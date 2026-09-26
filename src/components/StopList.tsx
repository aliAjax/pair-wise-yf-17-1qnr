import type { MaintenanceReport } from "../types";
import { summarizeStops } from "../logic";

export function StopList({ report }: { report: MaintenanceReport }) {
  const stops = summarizeStops(report);
  if (stops.length === 0) return <p className="muted">暂无音栓数据。</p>;

  return (
    <section>
      <div className="toolbar">
        <h3>音栓列表</h3>
        <span className="muted">统计以各音管最新复测值为准</span>
      </div>
      <div className="stop-grid">
        {stops.map((s) => (
          <article className="stop-card" key={s.name}>
            <div className="stop-head">
              <h3>{s.name}</h3>
              {s.abnormal > 0 ? (
                <span className="chip bad">待复核 {s.abnormal}</span>
              ) : (
                <span className="chip ok">正常</span>
              )}
            </div>
            <div className="stop-stats">
              <span>
                音管 <b>{s.total}</b>
              </span>
              <span>
                平均|偏差| <b>{s.avgAbsCents.toFixed(1)}</b>
              </span>
              <span>
                最大|偏差| <b>{s.maxAbsCents.toFixed(0)}</b>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
