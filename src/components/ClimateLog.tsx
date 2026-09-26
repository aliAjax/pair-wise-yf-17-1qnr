import { formatTime, latestRecords } from "../types";
import type { Report } from "../types";

export default function ClimateLog({ report }: { report: Report }) {
  const latest = latestRecords(report);

  if (latest.length === 0) {
    return <p className="empty">暂无温湿度记录</p>;
  }

  const temps = latest.map((r) => r.temperature);
  const hums = latest.map((r) => r.humidity);
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

  return (
    <section>
      <div className="cards">
        <div className="card">
          <small>平均温度</small>
          <strong>{avg(temps).toFixed(1)}℃</strong>
        </div>
        <div className="card">
          <small>温度范围</small>
          <strong>
            {Math.min(...temps).toFixed(1)} ~ {Math.max(...temps).toFixed(1)}℃
          </strong>
        </div>
        <div className="card">
          <small>平均湿度</small>
          <strong>{avg(hums).toFixed(1)}%</strong>
        </div>
        <div className="card">
          <small>湿度范围</small>
          <strong>
            {Math.min(...hums).toFixed(0)} ~ {Math.max(...hums).toFixed(0)}%
          </strong>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>记录时间</th>
              <th>音管编号</th>
              <th>音栓</th>
              <th>温度 ℃</th>
              <th>湿度 %</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((r) => (
              <tr key={r.id}>
                <td className="num">{formatTime(r.createdAt)}</td>
                <td>
                  <strong>{r.pipeNo}</strong>
                </td>
                <td>{r.stop}</td>
                <td>
                  <div className="cell-bar">
                    <span className="num">{r.temperature.toFixed(1)}</span>
                    <span className="bar">
                      <i
                        style={{
                          width: `${Math.min(100, (r.temperature / 40) * 100)}%`,
                        }}
                      />
                    </span>
                  </div>
                </td>
                <td>
                  <div className="cell-bar">
                    <span className="num">{r.humidity.toFixed(0)}</span>
                    <span className="bar">
                      <i
                        style={{ width: `${Math.min(100, r.humidity)}%` }}
                      />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint mt-10">温湿度取自每根音管最新一次复测记录。</p>
    </section>
  );
}
