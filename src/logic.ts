import type {
  EnvSummary,
  MaintenanceReport,
  PipeMeasurement,
  ReedStatus,
  StopSummary,
} from "./types";

/** 偏差达到 ±8 音分即视为超限 */
export const CENT_LIMIT = 8;

export const isCentOverLimit = (cents: number): boolean => Math.abs(cents) >= CENT_LIMIT;

export const isReedAbnormal = (reed: ReedStatus): boolean => reed !== "正常";

/** 偏差超限或簧片标记异常 → 音管自动进入待复核 */
export const isAbnormal = (m: PipeMeasurement): boolean =>
  isCentOverLimit(m.cents) || isReedAbnormal(m.reedStatus);

/** 最新复测值（未被替换的记录）。异常标记、数量汇总、场馆筛选都以它为准 */
export const latestOf = (r: MaintenanceReport): PipeMeasurement[] =>
  r.measurements.filter((m) => m.supersededBy === null);

/** 已被替换的历史记录 */
export const replacedOf = (r: MaintenanceReport): PipeMeasurement[] =>
  r.measurements.filter((m) => m.supersededBy !== null);

/** 待复核 = 最新记录中的异常音管 */
export const abnormalOf = (r: MaintenanceReport): PipeMeasurement[] =>
  latestOf(r).filter(isAbnormal);

/** 备注是否写清楚（去空白后非空） */
export const noteReady = (m: PipeMeasurement): boolean => m.note.trim().length > 0;

/** 备注没写清楚、阻塞复核确认的异常音管 */
export const missingNoteOf = (r: MaintenanceReport): PipeMeasurement[] =>
  abnormalOf(r).filter((m) => !noteReady(m));

/** 复核确认条件：未锁定、已有测量、异常音管备注齐全 */
export const canConfirm = (r: MaintenanceReport): boolean =>
  !r.locked && latestOf(r).length > 0 && missingNoteOf(r).length === 0;

export function summarizeStops(r: MaintenanceReport): StopSummary[] {
  const byStop = new Map<string, PipeMeasurement[]>();
  for (const m of latestOf(r)) {
    const list = byStop.get(m.stopName) ?? [];
    list.push(m);
    byStop.set(m.stopName, list);
  }
  return [...byStop.entries()]
    .map(([name, list]) => {
      const abs = list.map((m) => Math.abs(m.cents));
      return {
        name,
        total: list.length,
        abnormal: list.filter(isAbnormal).length,
        avgAbsCents: abs.reduce((a, b) => a + b, 0) / abs.length,
        maxAbsCents: Math.max(...abs),
      };
    })
    .sort((a, b) => b.abnormal - a.abnormal || a.name.localeCompare(b.name));
}

export function summarizeEnv(r: MaintenanceReport): EnvSummary | null {
  const list = latestOf(r);
  if (list.length === 0) return null;
  const temps = list.map((m) => m.temperature);
  const hums = list.map((m) => m.humidity);
  const sorted = [...list].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const last = sorted[sorted.length - 1];
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    count: list.length,
    avgTemp: avg(temps),
    minTemp: Math.min(...temps),
    maxTemp: Math.max(...temps),
    avgHumidity: avg(hums),
    lastTemp: last.temperature,
    lastHumidity: last.humidity,
    lastAt: last.recordedAt,
  };
}

/** 找到某条复测记录替换掉的旧值 */
export const previousOf = (
  r: MaintenanceReport,
  m: PipeMeasurement
): PipeMeasurement | undefined => r.measurements.find((x) => x.supersededBy === m.id);

export const fmtCents = (c: number): string => (c > 0 ? `+${c}` : `${c}`);

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
