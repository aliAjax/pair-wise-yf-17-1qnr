import { useEffect, useState } from "react";
import "./styles.css";
import {
  ANOMALY_CENTS,
  anomalyRecords,
  canLockReport,
  formatTime,
  isAnomaly,
  latestRecords,
  noteClear,
  pendingReviews,
  replacedRecords,
  uid,
} from "./types";
import type { NewRecordData, Report } from "./types";
import { seedReports } from "./data";
import RecordForm from "./components/RecordForm";
import DeviationTable from "./components/DeviationTable";
import StopList from "./components/StopList";
import ClimateLog from "./components/ClimateLog";
import ReportPage from "./components/ReportPage";

const STORAGE_KEY = "hxyfront-62005-reports-v1";

function loadReports(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Report[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* 缓存损坏时回退到演示数据 */
  }
  return seedReports;
}

type TabKey = "deviation" | "stops" | "climate" | "report";
type VenueFilter = "all" | "in-progress" | "completed" | "anomaly";

const TABS: { key: TabKey; label: string }[] = [
  { key: "deviation", label: "调音偏差表" },
  { key: "stops", label: "音栓列表" },
  { key: "climate", label: "温湿度记录" },
  { key: "report", label: "单次维护报告" },
];

const VENUE_FILTERS: { key: VenueFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "in-progress", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "anomaly", label: "有异常" },
];

function App() {
  const [reports, setReports] = useState<Report[]>(loadReports);
  const [selectedId, setSelectedId] = useState<string>(reports[0]?.id ?? "");
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("all");
  const [tab, setTab] = useState<TabKey>("deviation");
  const [newVenue, setNewVenue] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      /* 存储不可用时忽略 */
    }
  }, [reports]);

  const updateReport = (id: string, fn: (report: Report) => Report) =>
    setReports((list) => list.map((r) => (r.id === id ? fn(r) : r)));

  /** 新增 / 补录：同一音管编号只保留最新复测值，旧值标记为已替换 */
  const addRecord = (reportId: string, data: NewRecordData) => {
    updateReport(reportId, (report) => {
      if (report.locked) return report;
      const pipeNo = data.pipeNo.trim();
      const records = report.records.map((r) =>
        !r.replaced && r.pipeNo === pipeNo ? { ...r, replaced: true } : r,
      );
      return {
        ...report,
        records: [
          ...records,
          {
            ...data,
            pipeNo,
            id: uid(),
            reviewed: false,
            replaced: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  };

  /** 锁定前可修改备注；改动备注后需重新复核 */
  const updateNote = (reportId: string, recordId: string, note: string) => {
    updateReport(reportId, (report) =>
      report.locked
        ? report
        : {
            ...report,
            records: report.records.map((r) =>
              r.id === recordId && !r.replaced
                ? { ...r, note, reviewed: false }
                : r,
            ),
          },
    );
  };

  /** 备注写清楚的异常音管才能确认复核 */
  const confirmReview = (reportId: string, recordId: string) => {
    updateReport(reportId, (report) =>
      report.locked
        ? report
        : {
            ...report,
            records: report.records.map((r) =>
              r.id === recordId && isAnomaly(r) && noteClear(r.note)
                ? { ...r, reviewed: true }
                : r,
            ),
          },
    );
  };

  /** 全部复核通过后锁定报告，场馆状态变为已完成 */
  const lockReport = (reportId: string) => {
    updateReport(reportId, (report) =>
      canLockReport(report)
        ? { ...report, locked: true, status: "completed" }
        : report,
    );
  };

  const addVenue = () => {
    const venue = newVenue.trim();
    if (!venue) return;
    const existing = reports.find((r) => r.venue === venue);
    if (existing) {
      setSelectedId(existing.id);
    } else {
      const report: Report = {
        id: uid(),
        venue,
        createdAt: new Date().toISOString(),
        status: "in-progress",
        locked: false,
        records: [],
      };
      setReports((list) => [...list, report]);
      setSelectedId(report.id);
    }
    setNewVenue("");
    setTab("deviation");
  };

  const resetAll = () => {
    if (!window.confirm("确定要清空全部数据并恢复演示数据吗？")) return;
    setReports(seedReports);
    setSelectedId(seedReports[0]?.id ?? "");
    setVenueFilter("all");
    setTab("deviation");
  };

  const selected =
    reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;

  // 场馆筛选以最新复测值为准
  const filteredReports = reports.filter((r) => {
    if (venueFilter === "all") return true;
    if (venueFilter === "in-progress") return r.status === "in-progress";
    if (venueFilter === "completed") return r.status === "completed";
    return anomalyRecords(r).length > 0;
  });

  const selLatest = selected ? latestRecords(selected) : [];
  const selAnomalies = selected ? anomalyRecords(selected) : [];
  const selPending = selected ? pendingReviews(selected) : [];
  const selReplaced = selected ? replacedRecords(selected).length : 0;
  const stopCount = new Set(selLatest.map((r) => r.stop)).size;
  const overCount = selLatest.filter(
    (r) => Math.abs(r.cents) >= ANOMALY_CENTS,
  ).length;
  const avgTemp = selLatest.length
    ? selLatest.reduce((s, r) => s + r.temperature, 0) / selLatest.length
    : 0;
  const avgHum = selLatest.length
    ? selLatest.reduce((s, r) => s + r.humidity, 0) / selLatest.length
    : 0;

  return (
    <main className="app">
      <header className="panel topbar">
        <div>
          <p className="eyebrow">hxyfront-62005 · 源提示词 7 · Port 62005</p>
          <h1>管风琴音管调音记录</h1>
          <p className="sub">
            单次维护报告 · 偏差达到 ±{ANOMALY_CENTS}{" "}
            音分或簧片异常自动进入待复核 · 复核通过后报告锁定，场馆状态变为已完成
          </p>
        </div>
        <button className="ghost" onClick={resetAll}>
          重置演示数据
        </button>
      </header>

      <section className="metrics">
        <article className="metric">
          <small>音栓数量</small>
          <strong>{stopCount}</strong>
        </article>
        <article className="metric">
          <small>偏差超限（±{ANOMALY_CENTS} 音分）</small>
          <strong>{overCount}</strong>
        </article>
        <article className="metric">
          <small>平均温度</small>
          <strong>{selLatest.length ? `${avgTemp.toFixed(1)}℃` : "—"}</strong>
        </article>
        <article className="metric">
          <small>平均湿度</small>
          <strong>{selLatest.length ? `${avgHum.toFixed(1)}%` : "—"}</strong>
        </article>
      </section>

      <div className="layout">
        <aside className="panel sidebar">
          <h3 className="sidebar-title">场馆筛选（以最新复测值统计）</h3>
          <div className="chips">
            {VENUE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={"chip" + (venueFilter === f.key ? " active" : "")}
                onClick={() => setVenueFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="venue-list">
            {filteredReports.length === 0 && (
              <p className="empty">没有符合条件的场馆</p>
            )}
            {filteredReports.map((r) => {
              const anomalies = anomalyRecords(r).length;
              return (
                <button
                  key={r.id}
                  className={
                    "venue-item" + (selected?.id === r.id ? " active" : "")
                  }
                  onClick={() => setSelectedId(r.id)}
                >
                  <span className="venue-name">{r.venue}</span>
                  <span className="venue-meta">
                    <span
                      className={
                        "badge " +
                        (r.status === "completed" ? "badge-ok" : "badge-warn")
                      }
                    >
                      {r.status === "completed" ? "已完成" : "进行中"}
                    </span>
                    {anomalies > 0 && (
                      <span className="badge badge-danger">
                        异常 {anomalies}
                      </span>
                    )}
                    <span className="badge badge-muted">
                      {latestRecords(r).length} 根音管
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="new-venue">
            <input
              placeholder="新场馆名称，如 City Hall"
              value={newVenue}
              onChange={(e) => setNewVenue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addVenue()}
            />
            <button className="primary" onClick={addVenue}>
              新建报告
            </button>
          </div>
        </aside>

        <section className="panel content-panel">
          {!selected ? (
            <p className="empty">暂无场馆报告，请在左侧新建。</p>
          ) : (
            <>
              <header className="report-head">
                <div>
                  <h2>{selected.venue}</h2>
                  <p className="hint">
                    单次维护报告 · 编号 {selected.id.slice(0, 8)} · 创建于{" "}
                    {formatTime(selected.createdAt)}
                  </p>
                </div>
                <div className="badges">
                  <span
                    className={
                      "badge " +
                      (selected.status === "completed"
                        ? "badge-ok"
                        : "badge-warn")
                    }
                  >
                    {selected.status === "completed" ? "已完成" : "进行中"}
                  </span>
                  {selected.locked && (
                    <span className="badge badge-muted">已锁定</span>
                  )}
                  {selAnomalies.length > 0 && (
                    <span className="badge badge-danger">
                      异常 {selAnomalies.length}
                    </span>
                  )}
                  {selPending.length > 0 && (
                    <span className="badge badge-warn">
                      待复核 {selPending.length}
                    </span>
                  )}
                  {selReplaced > 0 && (
                    <span className="badge badge-muted">
                      已替换 {selReplaced}
                    </span>
                  )}
                </div>
              </header>

              {selected.locked && (
                <p className="banner ok mt-14">
                  复核已通过，报告已锁定：音管编号、测量数据与维修备注不可再修改，场馆状态已完成。
                </p>
              )}

              <nav className="tabs">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    className={"tab" + (tab === t.key ? " active" : "")}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              {tab === "deviation" && (
                <>
                  <RecordForm
                    locked={selected.locked}
                    existingPipeNos={selLatest.map((r) => r.pipeNo)}
                    onSubmit={(d) => addRecord(selected.id, d)}
                  />
                  <DeviationTable
                    report={selected}
                    onUpdateNote={(id, note) =>
                      updateNote(selected.id, id, note)
                    }
                    onConfirmReview={(id) => confirmReview(selected.id, id)}
                  />
                </>
              )}
              {tab === "stops" && <StopList report={selected} />}
              {tab === "climate" && <ClimateLog report={selected} />}
              {tab === "report" && (
                <ReportPage
                  report={selected}
                  onUpdateNote={(id, note) => updateNote(selected.id, id, note)}
                  onConfirmReview={(id) => confirmReview(selected.id, id)}
                  onLock={() => lockReport(selected.id)}
                />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
