import type { MaintenanceReport } from "../types";
import { fmtTime, latestOf, summarizeEnv } from "../logic";

export function EnvLog({ report }: { report: MaintenanceReport }) {
  const env = summarizeEnv(report);
  if (!env) return <p className="muted">暂无温湿度记录。</p>;

  const rows = [...latestOf(report)].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return (
    <section className="stack">
      <div className="toolbar">
        <h3>温湿度记录</h3>
        <span className="muted">随每次音管测量记录，统计以最新复测值为准（共 {env.count} 条）</span>
      </div>
      <div className="env-strip">
        <div>
          <small>最新温度</small>
          <strong>{env.lastTemp.toFixed(1)}℃</strong>
        </div>
        <div>
          <small>平均温度</small>
          <strong>{env.avgTemp.toFixed(1)}℃</strong>
        </div>
        <div>
          <small>温度范围</small>
          <strong>
            {env.minTemp.toFixed(1)} ~ {env.maxTemp.toFixed(1)}℃
          </strong>
        </div>
        <div>
          <small>最新湿度</small>
          <strong>{env.lastHumidity}%</strong>
        </div>
        <div>
          <small>平均湿度</small>
          <strong>{env.avgHumidity.toFixed(0)}%</strong>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>记录时间</th>
              <th>音管编号</th>
              <th>音栓</th>
              <th>温度</th>
              <th>湿度</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td className="muted">{fmtTime(m.recordedAt)}</td>
                <td>
                  <b>{m.pipeNo}</b>
                </td>
                <td>{m.stopName}</td>
                <td>{m.temperature.toFixed(1)}℃</td>
                <td>{m.humidity}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
