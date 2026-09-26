import { useEffect, useMemo, useReducer, useState } from "react";
import "./styles.css";
import type { MaintenanceReport, PipeMeasurement } from "./types";
import { seedReports } from "./seed";
import {
  abnormalOf,
  canConfirm,
  isCentOverLimit,
  isReedAbnormal,
  latestOf,
  replacedOf,
  summarizeEnv,
  summarizeStops,
} from "./logic";
import { MeasurementForm } from "./components/MeasurementForm";
import type { NewMeasurement, Prefill } from "./components/MeasurementForm";
import { DeviationTable } from "./components/DeviationTable";
import { StopList } from "./components/StopList";
import { EnvLog } from "./components/EnvLog";
import { ExceptionPanel } from "./components/ExceptionPanel";
import { ReportView } from "./components/ReportView";

const STORAGE_KEY = "hxyfront-62005-state-v1";

type Action =
  | { type: "add"; venueId: string; measurement: NewMeasurement }
  | { type: "note"; venueId: string; measurementId: string; note: string }
  | { type: "confirm"; venueId: string }
  | { type: "reset" };

function reducer(state: MaintenanceReport[], action: Action): MaintenanceReport[] {
  switch (action.type) {
    case "add":
      return state.map((r) => {
        if (r.id !== action.venueId || r.locked) return r;
        const id = `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        // 同一音管编号补录 = 复测：旧值标记已替换，保留新值
        const prev = latestOf(r).find((x) => x.pipeNo === action.measurement.pipeNo);
        const next: PipeMeasurement = {
          ...action.measurement,
          id,
          recordedAt: new Date().toISOString(),
          supersededBy: null,
        };
        const measurements = prev
          ? [...r.measurements.map((x) => (x.id === prev.id ? { ...x, supersededBy: id } : x)), next]
          : [...r.measurements, next];
        return { ...r, measurements };
      });
    case "note":
      return state.map((r) => {
        if (r.id !== action.venueId || r.locked) return r;
        return {
          ...r,
          measurements: r.measurements.map((m) =>
            m.id === action.measurementId ? { ...m, note: action.note } : m
          ),
        };
      });
    case "confirm":
      return state.map((r) => {
        if (r.id !== action.venueId || !canConfirm(r)) return r;
        // 复核通过：锁定报告，场馆状态转为已完成
        return { ...r, locked: true, status: "已完成", reviewedAt: new Date().toISOString() };
      });
    case "reset":
      return seedReports();
  }
}

function init(): MaintenanceReport[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MaintenanceReport[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // 本地数据损坏时回退到示例数据
  }
  return seedReports();
}

type TabKey = "deviation" | "stops" | "env" | "exceptions" | "report";

const TABS: { key: TabKey; label: string }[] = [
  { key: "deviation", label: "调音偏差表" },
  { key: "stops", label: "音栓列表" },
  { key: "env", label: "温湿度记录" },
  { key: "exceptions", label: "异常音管" },
  { key: "report", label: "维护报告" },
];

function App() {
  const [reports, dispatch] = useReducer(reducer, [] as MaintenanceReport[], init);
  const [venueId, setVenueId] = useState("");
  const [tab, setTab] = useState<TabKey>("deviation");
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // 忽略写入失败
    }
  }, [reports]);

  const report = reports.find((r) => r.id === venueId) ?? reports[0];

  const summary = useMemo(() => {
    const latest = latestOf(report);
    return {
      stops: summarizeStops(report),
      total: latest.length,
      replaced: replacedOf(report).length,
      abnormal: abnormalOf(report).length,
      over: latest.filter((m) => isCentOverLimit(m.cents)).length,
      reed: latest.filter((m) => isReedAbnormal(m.reedStatus)).length,
      env: summarizeEnv(report),
    };
  }, [report]);

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62005 · 管风琴维护 · Port 62005</p>
        <h1>管风琴音管调音记录</h1>
        <span>
          调音结束后当场完成单次维护报告：记录各音管的音高、音分偏差、温湿度与簧片状态；偏差达
          ±8 音分或簧片标记异常的音管自动进入待复核，维修备注写清后方可确认复核；复核通过后报告锁定，
          场馆状态转为已完成。同一音管补录时旧值标记为已替换，异常标记、数量汇总与场馆筛选均以最新复测值为准。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>音栓数量</small>
          <strong>{summary.stops.length}</strong>
          <span className="sub">覆盖音管 {summary.total} 支</span>
        </article>
        <article>
          <small>音管总数</small>
          <strong>{summary.total}</strong>
          <span className="sub">已替换历史 {summary.replaced} 条</span>
        </article>
        <article style={summary.abnormal > 0 ? { borderTopColor: "#dc2626" } : undefined}>
          <small>待复核</small>
          <strong>{summary.abnormal}</strong>
          <span className="sub">
            偏差超限 {summary.over} · 簧片异常 {summary.reed}
          </span>
        </article>
        <article>
          <small>最新温度</small>
          <strong>{summary.env ? `${summary.env.lastTemp.toFixed(1)}℃` : "—"}</strong>
          <span className="sub">
            {summary.env
              ? `均值 ${summary.env.avgTemp.toFixed(1)}℃ · ${summary.env.minTemp.toFixed(1)}~${summary.env.maxTemp.toFixed(1)}℃`
              : "暂无记录"}
          </span>
        </article>
        <article>
          <small>最新湿度</small>
          <strong>{summary.env ? `${summary.env.lastHumidity}%` : "—"}</strong>
          <span className="sub">
            {summary.env ? `均值 ${summary.env.avgHumidity.toFixed(0)}% · ${summary.env.count} 条记录` : "暂无记录"}
          </span>
        </article>
      </section>

      <section className="workspace">
        <aside className="panel">
          <h2>场馆筛选</h2>
          <div className="venue-list">
            {reports.map((r) => (
              <button
                key={r.id}
                className={`venue-item ${r.id === report.id ? "active" : ""}`}
                onClick={() => setVenueId(r.id)}
              >
                <span className="venue-head">
                  <span>{r.venue}</span>
                  <span className={`chip ${r.status === "已完成" ? "ok" : "warn"}`}>{r.status}</span>
                </span>
                <small>
                  技师 {r.technician} · 音管 {latestOf(r).length} · 待复核 {abnormalOf(r).length}
                  {r.locked ? " · 已锁定" : ""}
                </small>
              </button>
            ))}
          </div>
          <button className="reset" onClick={() => dispatch({ type: "reset" })}>
            恢复示例数据
          </button>
        </aside>

        <section className="panel">
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "active" : ""}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {t.key === "exceptions" && summary.abnormal > 0 && (
                  <span className="tab-badge">{summary.abnormal}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "deviation" && (
            <div className="stack">
              <MeasurementForm
                report={report}
                prefill={prefill}
                onAdd={(m) => dispatch({ type: "add", venueId: report.id, measurement: m })}
              />
              <DeviationTable
                report={report}
                onRetune={(m) =>
                  setPrefill({ pipeNo: m.pipeNo, stopName: m.stopName, pitch: m.pitch, nonce: Date.now() })
                }
              />
            </div>
          )}
          {tab === "stops" && <StopList report={report} />}
          {tab === "env" && <EnvLog report={report} />}
          {tab === "exceptions" && (
            <ExceptionPanel
              report={report}
              onSaveNote={(id, note) =>
                dispatch({ type: "note", venueId: report.id, measurementId: id, note })
              }
              onGotoReport={() => setTab("report")}
            />
          )}
          {tab === "report" && (
            <ReportView
              report={report}
              onConfirm={() => dispatch({ type: "confirm", venueId: report.id })}
            />
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
