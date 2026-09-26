import { useState } from "react";
import { STOP_CATEGORIES, STOPS } from "../data";
import { ANOMALY_CENTS, isAnomaly, latestRecords } from "../types";
import type { Report } from "../types";

export default function StopList({ report }: { report: Report }) {
  const [cat, setCat] = useState("全部");
  const latest = latestRecords(report);

  const rows = STOPS.map((stop) => {
    const recs = latest.filter((r) => r.stop === stop.name);
    const anomalies = recs.filter(isAnomaly).length;
    const avgAbs = recs.length
      ? recs.reduce((s, r) => s + Math.abs(r.cents), 0) / recs.length
      : 0;
    const maxAbs = recs.length
      ? Math.max(...recs.map((r) => Math.abs(r.cents)))
      : 0;
    return { ...stop, count: recs.length, anomalies, avgAbs, maxAbs };
  }).filter((s) => s.count > 0 && (cat === "全部" || s.category === cat));

  return (
    <section>
      <div className="table-tools">
        <div className="chips">
          {["全部", ...STOP_CATEGORIES].map((c) => (
            <button
              key={c}
              className={"chip" + (cat === c ? " active" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="hint">
          统计以最新复测值为准 · 偏差达到 ±{ANOMALY_CENTS}{" "}
          音分或簧片异常计为异常
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="empty">该分类下暂无音管记录</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>音栓</th>
                <th>分类</th>
                <th>音管数</th>
                <th>异常数</th>
                <th>平均 |偏差|（音分）</th>
                <th>最大 |偏差|（音分）</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.name}>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>
                    <span className="badge badge-info">{s.category}</span>
                  </td>
                  <td className="num">{s.count}</td>
                  <td className="num">
                    {s.anomalies > 0 ? (
                      <span className="cents-bad">{s.anomalies}</span>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="num">{s.avgAbs.toFixed(1)}</td>
                  <td className="num">{s.maxAbs.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
