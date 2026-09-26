import type { MaintenanceReport } from "../types";
import {
  abnormalOf,
  canConfirm,
  fmtCents,
  fmtTime,
  isAbnormal,
  isCentOverLimit,
  isReedAbnormal,
  latestOf,
  missingNoteOf,
  replacedOf,
  summarizeStops,
} from "../logic";

interface Props {
  report: MaintenanceReport;
  onConfirm: () => void;
}

export function ReportView({ report, onConfirm }: Props) {
  const latest = latestOf(report);
  const replaced = replacedOf(report);
  const abnormal = abnormalOf(report);
  const missing = missingNoteOf(report);
  const over = latest.filter((m) => isCentOverLimit(m.cents)).length;
  const reed = latest.filter((m) => isReedAbnormal(m.reedStatus)).length;
  const stops = summarizeStops(report);
  const ok = canConfirm(report);
  const pipes = [...latest].sort((a, b) => a.pipeNo.localeCompare(b.pipeNo));

  return (
    <section className="stack">
      <div className="heading">
        <div>
          <p>单次维护报告</p>
          <h2>{report.venue}</h2>
        </div>
        <div className="heading-chips">
          <span className={`chip ${report.status === "已完成" ? "ok" : "warn"}`}>
            {report.status}
          </span>
          {report.locked && <span className="chip gray">已锁定</span>}
        </div>
      </div>

      <div className="summary-grid">
        <article>
          <small>维护技师</small>
          <strong>{report.technician}</strong>
        </article>
        <article>
          <small>开始时间</small>
          <strong>{fmtTime(report.startedAt)}</strong>
        </article>
        <article>
          <small>音管总数</small>
          <strong>{latest.length}</strong>
        </article>
        <article>
          <small>音栓数量</small>
          <strong>{stops.length}</strong>
        </article>
        <article>
          <small>待复核</small>
          <strong>{abnormal.length}</strong>
        </article>
        <article>
          <small>偏差超限 / 簧片异常</small>
          <strong>
            {over} / {reed}
          </strong>
        </article>
        <article>
          <small>已替换历史</small>
          <strong>{replaced.length}</strong>
        </article>
        <article>
          <small>复核时间</small>
          <strong>{report.reviewedAt ? fmtTime(report.reviewedAt) : "—"}</strong>
        </article>
      </div>

      <section>
        <h3>音管清单（以最新复测值为准）</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>音管编号</th>
                <th>音栓</th>
                <th>音高</th>
                <th>音分偏差</th>
                <th>簧片状态</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {pipes.map((m) => (
                <tr key={m.id}>
                  <td>
                    <b>{m.pipeNo}</b>
                  </td>
                  <td>{m.stopName}</td>
                  <td>{m.pitch}</td>
                  <td className={isCentOverLimit(m.cents) ? "bad-text" : ""}>
                    {fmtCents(m.cents)}
                  </td>
                  <td className={isReedAbnormal(m.reedStatus) ? "bad-text" : ""}>
                    {m.reedStatus}
                  </td>
                  <td>
                    {isAbnormal(m) ? (
                      <span className="chip bad">待复核</span>
                    ) : (
                      <span className="chip ok">正常</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {report.locked ? (
        <div className="notice ok">
          复核已于 {report.reviewedAt ? fmtTime(report.reviewedAt) : ""}{" "}
          通过，报告已锁定：音管编号、测量数据与维修备注不可再修改，场馆状态为「已完成」。
        </div>
      ) : (
        <section>
          <h3>复核确认</h3>
          <ul className="checklist">
            <li>
              <i className={`dot ${latest.length > 0 ? "ok" : "bad"}`} />
              已记录 {latest.length} 支音管的测量数据
            </li>
            <li>
              <i className={`dot ${missing.length === 0 ? "ok" : "bad"}`} />
              {abnormal.length === 0
                ? "无异常音管，无需补充备注"
                : missing.length === 0
                  ? `${abnormal.length} 条异常音管的维修备注均已写清`
                  : `${missing.length} 条异常音管缺少维修备注：${missing
                      .map((m) => m.pipeNo)
                      .join("、")}`}
            </li>
          </ul>
          <button className="primary" disabled={!ok} onClick={onConfirm}>
            确认复核通过 · 锁定报告并完成场馆
          </button>
          {!ok && missing.length > 0 && (
            <p className="hint">维修备注没写清楚就确认不了，请先在「异常音管」页补齐备注。</p>
          )}
        </section>
      )}
    </section>
  );
}
