import { useState } from "react";
import type { MaintenanceReport, PipeMeasurement } from "../types";
import {
  CENT_LIMIT,
  fmtCents,
  fmtTime,
  isAbnormal,
  isCentOverLimit,
  isReedAbnormal,
  latestOf,
  previousOf,
  replacedOf,
} from "../logic";

interface Props {
  report: MaintenanceReport;
  onRetune: (m: PipeMeasurement) => void;
}

function CentsBar({ cents }: { cents: number }) {
  const clamped = Math.max(-16, Math.min(16, cents));
  const left = ((clamped + 16) / 32) * 100;
  const bad = isCentOverLimit(cents);
  return (
    <span className="cents-cell">
      <span className="cents-bar">
        <i className="zero" />
        <i className="limit" style={{ left: "25%" }} />
        <i className="limit" style={{ left: "75%" }} />
        <i className={`marker ${bad ? "bad" : "ok"}`} style={{ left: `calc(${left}% - 3px)` }} />
      </span>
      <b className={bad ? "bad-text" : ""}>{fmtCents(cents)}</b>
    </span>
  );
}

export function DeviationTable({ report, onRetune }: Props) {
  const [showReplaced, setShowReplaced] = useState(false);
  const latest = latestOf(report);
  const replaced = replacedOf(report);
  const rows = (showReplaced ? [...report.measurements] : [...latest]).sort((a, b) =>
    a.recordedAt.localeCompare(b.recordedAt)
  );

  return (
    <section>
      <div className="toolbar">
        <h3>调音偏差表</h3>
        <label className="toggle">
          <input
            type="checkbox"
            checked={showReplaced}
            onChange={(e) => setShowReplaced(e.target.checked)}
          />
          显示已替换的历史记录（{replaced.length}）
        </label>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>音管编号</th>
              <th>音栓</th>
              <th>音高</th>
              <th>音分偏差（±{CENT_LIMIT} 超限）</th>
              <th>簧片状态</th>
              <th>维修备注</th>
              <th>状态</th>
              <th>时间</th>
              {!report.locked && <th>操作</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const isReplaced = m.supersededBy !== null;
              const prev = previousOf(report, m);
              const abnormal = isAbnormal(m);
              return (
                <tr key={m.id} className={isReplaced ? "replaced" : ""}>
                  <td>
                    <b>{m.pipeNo}</b> {prev && <span className="chip blue">复测</span>}
                  </td>
                  <td>{m.stopName}</td>
                  <td>{m.pitch}</td>
                  <td>
                    <CentsBar cents={m.cents} />
                  </td>
                  <td className={isReedAbnormal(m.reedStatus) ? "bad-text" : ""}>
                    {m.reedStatus}
                  </td>
                  <td className="note-cell">
                    {m.note ? (
                      m.note
                    ) : abnormal && !isReplaced ? (
                      <span className="bad-text">未填写</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {isReplaced ? (
                      <span className="chip gray">已替换</span>
                    ) : abnormal ? (
                      <span className="chip bad">待复核</span>
                    ) : (
                      <span className="chip ok">正常</span>
                    )}
                  </td>
                  <td className="muted">{fmtTime(m.recordedAt)}</td>
                  {!report.locked && (
                    <td>
                      {isReplaced ? (
                        <span className="muted">—</span>
                      ) : (
                        <button className="btn-small" onClick={() => onRetune(m)}>
                          复测
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="muted">暂无测量记录。</p>}
    </section>
  );
}
