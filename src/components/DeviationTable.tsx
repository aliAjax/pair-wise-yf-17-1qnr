import { useState } from "react";
import {
  ANOMALY_CENTS,
  MIN_NOTE_LENGTH,
  anomalyReasons,
  formatCents,
  isAnomaly,
  latestRecords,
  noteClear,
  replacedRecords,
} from "../types";
import type { PipeRecord, Report } from "../types";

interface Props {
  report: Report;
  onUpdateNote: (recordId: string, note: string) => void;
  onConfirmReview: (recordId: string) => void;
}

type RowFilter = "all" | "anomaly" | "pending";

const ROW_FILTERS: { key: RowFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "anomaly", label: "仅看异常" },
  { key: "pending", label: "仅看待复核" },
];

export default function DeviationTable({
  report,
  onUpdateNote,
  onConfirmReview,
}: Props) {
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [showReplaced, setShowReplaced] = useState(false);

  const locked = report.locked;
  const latestCount = latestRecords(report).length;
  const replacedCount = replacedRecords(report).length;

  const rows = report.records.filter((r) => {
    if (r.replaced && !showReplaced) return false;
    if (rowFilter === "anomaly") return isAnomaly(r);
    if (rowFilter === "pending")
      return !r.replaced && isAnomaly(r) && !r.reviewed;
    return true;
  });

  const reviewStatus = (r: PipeRecord) => {
    if (r.replaced) return <span className="hint">—</span>;
    if (!isAnomaly(r)) return <span className="badge badge-muted">无需复核</span>;
    if (r.reviewed) return <span className="badge badge-ok">已复核</span>;
    return <span className="badge badge-warn">待复核</span>;
  };

  const noteCell = (r: PipeRecord) => {
    if (r.replaced) return <span className="hint">{r.note || "—"}</span>;
    if (locked) return <span>{r.note || "—"}</span>;
    const unclear = isAnomaly(r) && !noteClear(r.note);
    return (
      <div className="note-cell">
        <input
          className={"note-input" + (unclear ? " unclear" : "")}
          value={r.note}
          placeholder={`填写维修备注（至少 ${MIN_NOTE_LENGTH} 个字）`}
          onChange={(e) => onUpdateNote(r.id, e.target.value)}
        />
        {unclear && (
          <span className="hint warn">备注未写清楚，无法确认复核</span>
        )}
      </div>
    );
  };

  const actionCell = (r: PipeRecord) => {
    if (locked) return <span className="hint">已锁定</span>;
    if (r.replaced || !isAnomaly(r)) return <span className="hint">—</span>;
    if (r.reviewed) return <span className="hint">复核通过</span>;
    const clear = noteClear(r.note);
    return (
      <button
        className="primary"
        disabled={!clear}
        title={
          clear
            ? "确认该音管复核通过"
            : `维修备注写清楚（至少 ${MIN_NOTE_LENGTH} 个字）后才能确认复核`
        }
        onClick={() => onConfirmReview(r.id)}
      >
        确认复核
      </button>
    );
  };

  return (
    <section>
      <div className="table-tools">
        <div className="chips">
          {ROW_FILTERS.map((f) => (
            <button
              key={f.key}
              className={"chip" + (rowFilter === f.key ? " active" : "")}
              onClick={() => setRowFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={showReplaced}
            onChange={(e) => setShowReplaced(e.target.checked)}
          />
          显示已替换记录（{replacedCount}）
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>音管编号</th>
              <th>音栓</th>
              <th>音高</th>
              <th>音分偏差</th>
              <th>温度℃</th>
              <th>湿度%</th>
              <th>簧片状态</th>
              <th>异常标记</th>
              <th>复核状态</th>
              <th>维修备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="empty-cell">
                  暂无符合条件的记录
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className={
                  r.replaced ? "replaced" : isAnomaly(r) ? "flagged" : ""
                }
              >
                <td>
                  <strong>{r.pipeNo}</strong>
                  {r.replaced && (
                    <span className="badge badge-muted ml-6">已替换</span>
                  )}
                </td>
                <td>{r.stop}</td>
                <td className="num">{r.pitch}</td>
                <td className="num">
                  <span
                    className={
                      !r.replaced && Math.abs(r.cents) >= ANOMALY_CENTS
                        ? "cents-bad"
                        : ""
                    }
                  >
                    {formatCents(r.cents)}
                  </span>
                </td>
                <td className="num">{r.temperature.toFixed(1)}</td>
                <td className="num">{r.humidity.toFixed(0)}</td>
                <td>
                  {r.reed === "abnormal" ? (
                    <span className="badge badge-danger">异常</span>
                  ) : (
                    <span className="badge badge-ok">正常</span>
                  )}
                </td>
                <td>
                  {r.replaced || !isAnomaly(r) ? (
                    <span className="hint">—</span>
                  ) : (
                    <span className="badges">
                      {anomalyReasons(r).map((reason) => (
                        <span key={reason} className="badge badge-danger">
                          {reason}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                <td>{reviewStatus(r)}</td>
                <td>{noteCell(r)}</td>
                <td>{actionCell(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint mt-10">
        有效记录 {latestCount} 条（异常标记与统计以最新复测值为准）
        {replacedCount > 0 ? ` · 已替换历史 ${replacedCount} 条` : ""} ·
        偏差达到 ±{ANOMALY_CENTS} 音分或簧片异常的音管自动进入待复核
      </p>
    </section>
  );
}
