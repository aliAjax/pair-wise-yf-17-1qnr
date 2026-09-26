import {
  ANOMALY_CENTS,
  MIN_NOTE_LENGTH,
  anomalyReasons,
  anomalyRecords,
  canLockReport,
  formatCents,
  formatTime,
  latestRecords,
  noteClear,
  pendingReviews,
  replacedRecords,
} from "../types";
import type { Report } from "../types";

interface Props {
  report: Report;
  onUpdateNote: (recordId: string, note: string) => void;
  onConfirmReview: (recordId: string) => void;
  onLock: () => void;
}

export default function ReportPage({
  report,
  onUpdateNote,
  onConfirmReview,
  onLock,
}: Props) {
  const latest = latestRecords(report);
  const anomalies = anomalyRecords(report);
  const pending = pendingReviews(report);
  const reviewed = anomalies.length - pending.length;
  const replaced = replacedRecords(report).length;
  const canLock = canLockReport(report);

  const blocker =
    latest.length === 0
      ? "报告内暂无有效音管记录，无法完成"
      : pending.length > 0
        ? `还有 ${pending.length} 个异常音管待复核，全部复核通过后才能锁定完成`
        : "";

  return (
    <section className="report-page">
      <div className="meta-grid">
        <div>
          <small>场馆名称</small>
          <strong>{report.venue}</strong>
        </div>
        <div>
          <small>报告编号</small>
          <strong>{report.id.slice(0, 8)}</strong>
        </div>
        <div>
          <small>创建时间</small>
          <strong>{formatTime(report.createdAt)}</strong>
        </div>
        <div>
          <small>场馆状态</small>
          <strong>
            <span
              className={
                "badge " +
                (report.status === "completed" ? "badge-ok" : "badge-warn")
              }
            >
              {report.status === "completed" ? "已完成" : "进行中"}
            </span>
            {report.locked && (
              <span className="badge badge-muted ml-6">已锁定</span>
            )}
          </strong>
        </div>
      </div>

      <h3 className="section-title">数量汇总（以最新复测值为准）</h3>
      <div className="cards">
        <div className="card">
          <small>记录音管</small>
          <strong>{latest.length}</strong>
        </div>
        <div className="card">
          <small>异常音管</small>
          <strong className={anomalies.length > 0 ? "cents-bad" : ""}>
            {anomalies.length}
          </strong>
        </div>
        <div className="card">
          <small>待复核</small>
          <strong>{pending.length}</strong>
        </div>
        <div className="card">
          <small>已复核</small>
          <strong>{reviewed}</strong>
        </div>
        <div className="card">
          <small>已替换历史</small>
          <strong>{replaced}</strong>
        </div>
      </div>

      <h3 className="section-title">异常音管复核清单</h3>
      {anomalies.length === 0 ? (
        <p className="empty">本次维护没有异常音管，无需复核</p>
      ) : (
        anomalies.map((r) => {
          const clear = noteClear(r.note);
          return (
            <article className="review-item" key={r.id}>
              <div>
                <strong>{r.pipeNo}</strong>
                <p className="hint">
                  {r.stop} · {r.pitch} · {formatCents(r.cents)} 音分
                </p>
                <div className="badges mt-6">
                  {anomalyReasons(r).map((reason) => (
                    <span key={reason} className="badge badge-danger">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <div className="note-cell">
                {report.locked ? (
                  <span>{r.note || "—"}</span>
                ) : (
                  <>
                    <input
                      className={"note-input" + (!clear ? " unclear" : "")}
                      value={r.note}
                      placeholder={`填写维修备注（至少 ${MIN_NOTE_LENGTH} 个字）`}
                      onChange={(e) => onUpdateNote(r.id, e.target.value)}
                    />
                    {!clear && (
                      <span className="hint warn">
                        维修备注未写清楚，确认不了复核
                      </span>
                    )}
                  </>
                )}
              </div>
              <div>
                {r.reviewed ? (
                  <span className="badge badge-ok">已复核</span>
                ) : (
                  <button
                    className="primary"
                    disabled={!clear || report.locked}
                    title={
                      clear
                        ? "确认该音管复核通过"
                        : `维修备注写清楚（至少 ${MIN_NOTE_LENGTH} 个字）后才能确认复核`
                    }
                    onClick={() => onConfirmReview(r.id)}
                  >
                    确认复核
                  </button>
                )}
              </div>
            </article>
          );
        })
      )}

      <h3 className="section-title">锁定与完成</h3>
      {report.locked ? (
        <p className="banner ok">
          复核已通过，报告已锁定：音管编号、测量数据与维修备注均已锁定，场馆状态为已完成。
        </p>
      ) : (
        <div className="lock-box">
          <ul className="rules">
            <li>
              偏差达到 ±{ANOMALY_CENTS}{" "}
              音分或簧片标记异常的音管自动进入待复核；
            </li>
            <li>
              维修备注写清楚（至少 {MIN_NOTE_LENGTH} 个字）后才能确认复核；
            </li>
            <li>
              全部异常音管复核通过后，报告锁定，音管编号、测量数据与备注不可再修改；
            </li>
            <li>报告锁定后，场馆状态由进行中变为已完成。</li>
          </ul>
          <div className="form-foot">
            <button className="primary" disabled={!canLock} onClick={onLock}>
              复核通过，锁定报告并完成
            </button>
            {!canLock && blocker && (
              <span className="hint warn">{blocker}</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
