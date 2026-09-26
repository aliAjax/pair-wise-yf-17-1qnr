import { useEffect, useMemo, useState } from "react";
import type { MaintenanceReport, ReedStatus } from "../types";
import { CENT_LIMIT, fmtCents, fmtTime, isCentOverLimit, isReedAbnormal, latestOf } from "../logic";

export interface NewMeasurement {
  pipeNo: string;
  stopName: string;
  pitch: string;
  cents: number;
  temperature: number;
  humidity: number;
  reedStatus: ReedStatus;
  note: string;
}

export interface Prefill {
  pipeNo: string;
  stopName: string;
  pitch: string;
  nonce: number;
}

interface Props {
  report: MaintenanceReport;
  prefill: Prefill | null;
  onAdd: (m: NewMeasurement) => void;
}

const REED_OPTIONS: ReedStatus[] = ["正常", "磨损", "松动", "异响"];

const STOP_SUGGESTIONS = [
  "Principal 8′",
  "Principal 4′",
  "Trumpet 8′",
  "Bourdon 16′",
  "Gedackt 8′",
  "Mixture IV",
  "Salicional 8′",
  "Rohrflöte 8′",
];

export function MeasurementForm({ report, prefill, onAdd }: Props) {
  const [pipeNo, setPipeNo] = useState("");
  const [stopName, setStopName] = useState("");
  const [pitch, setPitch] = useState("");
  const [cents, setCents] = useState("0");
  const [temperature, setTemperature] = useState("21.5");
  const [humidity, setHumidity] = useState("52");
  const [reedStatus, setReedStatus] = useState<ReedStatus>("正常");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // 从偏差表点「复测」时带入音管信息
  useEffect(() => {
    if (prefill) {
      setPipeNo(prefill.pipeNo);
      setStopName(prefill.stopName);
      setPitch(prefill.pitch);
      setMessage(null);
    }
  }, [prefill]);

  const stopOptions = useMemo(() => {
    const known = report.measurements.map((m) => m.stopName);
    return [...new Set([...STOP_SUGGESTIONS, ...known])];
  }, [report]);

  const existing = latestOf(report).find((m) => m.pipeNo === pipeNo.trim());

  const centsNum = Number(cents);
  const willBeAbnormal =
    (cents.trim() !== "" && Number.isFinite(centsNum) && isCentOverLimit(centsNum)) ||
    isReedAbnormal(reedStatus);

  if (report.locked) {
    return (
      <div className="notice gray">
        报告已于 {report.reviewedAt ? fmtTime(report.reviewedAt) : "复核时"}{" "}
        锁定：音管编号、测量数据与维修备注不可再修改，也不能新增或复测音管。
      </div>
    );
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pipeNo.trim() || !stopName.trim() || !pitch.trim()) {
      setMessage({ ok: false, text: "请填写音管编号、音栓和音高" });
      return;
    }
    for (const [value, label] of [
      [cents, "音分偏差"],
      [temperature, "温度"],
      [humidity, "湿度"],
    ] as const) {
      if (value.trim() === "" || !Number.isFinite(Number(value))) {
        setMessage({ ok: false, text: `${label}需为数字` });
        return;
      }
    }
    onAdd({
      pipeNo: pipeNo.trim(),
      stopName: stopName.trim(),
      pitch: pitch.trim(),
      cents: Number(cents),
      temperature: Number(temperature),
      humidity: Number(humidity),
      reedStatus,
      note: note.trim(),
    });
    setMessage({
      ok: true,
      text: existing
        ? `已复测 ${existing.pipeNo}，旧值 ${fmtCents(existing.cents)} 音分标记为「已替换」`
        : `已记录音管 ${pipeNo.trim()}`,
    });
    setPipeNo("");
    setPitch("");
    setCents("0");
    setReedStatus("正常");
    setNote("");
  };

  return (
    <form className="form-box" onSubmit={submit}>
      <div className="heading">
        <div>
          <p>数据录入</p>
          <h2>记录音管测量</h2>
        </div>
        <button type="submit" className="primary">
          {existing ? "提交复测（替换旧值）" : "保存记录"}
        </button>
      </div>

      {existing && (
        <div className="notice warn">
          音管 {existing.pipeNo} 已有记录（{existing.pitch} · {fmtCents(existing.cents)}{" "}
          音分），提交后旧值将标记为「已替换」，异常标记、数量汇总与场馆筛选均以新值为准。
        </div>
      )}

      <div className="field-grid">
        <label>
          <span>音管编号 *</span>
          <input
            value={pipeNo}
            onChange={(e) => setPipeNo(e.target.value)}
            placeholder="如 P-08-021"
          />
        </label>
        <label>
          <span>音栓 *</span>
          <input
            list="stop-options"
            value={stopName}
            onChange={(e) => setStopName(e.target.value)}
            placeholder="如 Principal 8′"
          />
          <datalist id="stop-options">
            {stopOptions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label>
          <span>音高 *</span>
          <input value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="如 C#4" />
        </label>
        <label>
          <span>音分偏差（达 ±{CENT_LIMIT} 进入待复核）</span>
          <input type="number" step="1" value={cents} onChange={(e) => setCents(e.target.value)} />
        </label>
        <label>
          <span>温度 ℃</span>
          <input
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
        </label>
        <label>
          <span>湿度 %</span>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
          />
        </label>
        <label>
          <span>簧片状态</span>
          <select value={reedStatus} onChange={(e) => setReedStatus(e.target.value as ReedStatus)}>
            {REED_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>维修备注{willBeAbnormal ? "（异常音管必填）" : ""}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="异常音管需写清处理情况"
          />
        </label>
      </div>

      {willBeAbnormal && note.trim() === "" && (
        <p className="hint">该音管将自动进入待复核，请补充维修备注，否则无法确认复核。</p>
      )}
      {message && (
        <p className={`form-message ${message.ok ? "ok" : "bad"}`}>{message.text}</p>
      )}
    </form>
  );
}
