import { useState } from "react";
import type { MaintenanceReport, PipeMeasurement } from "../types";
import {
  CENT_LIMIT,
  abnormalOf,
  fmtCents,
  fmtTime,
  isCentOverLimit,
  isReedAbnormal,
  missingNoteOf,
} from "../logic";

interface Props {
  report: MaintenanceReport;
  onSaveNote: (measurementId: string, note: string) => void;
  onGotoReport: () => void;
}

function ExceptionCard({
  m,
  locked,
  onSave,
}: {
  m: PipeMeasurement;
  locked: boolean;
  onSave: (note: string) => void;
}) {
  const [value, setValue] = useState(m.note);
  const [saved, setSaved] = useState(false);

  const reasons = [
    isCentOverLimit(m.cents) ? `偏差 ${fmtCents(m.cents)} 超限` : null,
    isReedAbnormal(m.reedStatus) ? `簧片${m.reedStatus}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="exception-card">
      <div className="exception-head">
        <div>
          <b>{m.pipeNo}</b> <span className="chip bad">待复核</span>
        </div>
        <span className="exception-meta">
          {m.stopName} · {m.pitch} · {m.temperature.toFixed(1)}℃ · {m.humidity}% ·{" "}
          {fmtTime(m.recordedAt)}
        </span>
      </div>
      <div className="exception-meta">进入待复核原因:{reasons}</div>
      <label>
        <span>维修备注（确认复核前必须写清楚）</span>
        <textarea
          value={value}
          disabled={locked}
          placeholder="记录处理措施与复测结果"
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
        />
      </label>
      {!locked && (
        <div className="exception-actions">
          <button
            className="btn-small primary"
            onClick={() => {
              onSave(value);
              setSaved(true);
            }}
          >
            保存备注
          </button>
          {saved && <span className="form-message ok">已保存</span>}
          {value.trim() === "" && <span className="hint-inline">备注为空，无法确认复核</span>}
        </div>
      )}
    </article>
  );
}

export function ExceptionPanel({ report, onSaveNote, onGotoReport }: Props) {
  const abnormal = abnormalOf(report);
  const missing = missingNoteOf(report);

  return (
    <section className="stack">
      <div className="toolbar">
        <h3>异常音管标记</h3>
        <span className="muted">
          偏差达 ±{CENT_LIMIT} 音分或簧片标记异常的音管自动进入待复核
        </span>
      </div>

      {abnormal.length === 0 ? (
        <div className="notice ok">当前没有待复核的异常音管。</div>
      ) : (
        abnormal.map((m) => (
          <ExceptionCard
            key={m.id}
            m={m}
            locked={report.locked}
            onSave={(note) => onSaveNote(m.id, note)}
          />
        ))
      )}

      {report.locked ? (
        <div className="notice gray">报告已锁定，异常标记与备注以锁定时的最新复测值为准。</div>
      ) : (
        abnormal.length > 0 &&
        (missing.length > 0 ? (
          <div className="notice warn">
            还有 {missing.length} 条异常音管缺少维修备注（
            {missing.map((m) => m.pipeNo).join("、")}），补齐后才能确认复核。
          </div>
        ) : (
          <div className="notice ok">
            全部异常音管备注齐全，可以确认复核。
            <button className="btn-small" onClick={onGotoReport}>
              前往维护报告
            </button>
          </div>
        ))
      )}
    </section>
  );
}
