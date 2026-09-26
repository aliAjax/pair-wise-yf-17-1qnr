export type ReedStatus = "normal" | "abnormal";
export type ReportStatus = "in-progress" | "completed";

export interface PipeRecord {
  id: string;
  pipeNo: string; // 音管编号
  stop: string; // 音栓
  pitch: string; // 音高
  cents: number; // 音分偏差
  temperature: number; // 温度 ℃
  humidity: number; // 湿度 %
  reed: ReedStatus; // 簧片状态
  note: string; // 维修备注
  reviewed: boolean; // 复核通过
  replaced: boolean; // 已被新的复测值替换
  createdAt: string; // ISO 时间
}

export interface NewRecordData {
  pipeNo: string;
  stop: string;
  pitch: string;
  cents: number;
  temperature: number;
  humidity: number;
  reed: ReedStatus;
  note: string;
}

export interface Report {
  id: string;
  venue: string; // 场馆名称（教堂 / 音乐厅）
  createdAt: string;
  status: ReportStatus; // 进行中 / 已完成
  locked: boolean; // 复核通过后锁定，数据不可再改
  records: PipeRecord[];
}

/** 偏差达到 ±8 音分即视为超限 */
export const ANOMALY_CENTS = 8;
/** 维修备注至少 4 个字才算“写清楚” */
export const MIN_NOTE_LENGTH = 4;

/** 偏差超限或簧片异常 → 异常音管，自动进入待复核 */
export const isAnomaly = (r: PipeRecord): boolean =>
  Math.abs(r.cents) >= ANOMALY_CENTS || r.reed === "abnormal";

export const anomalyReasons = (r: PipeRecord): string[] => {
  const reasons: string[] = [];
  if (Math.abs(r.cents) >= ANOMALY_CENTS) reasons.push("偏差超限");
  if (r.reed === "abnormal") reasons.push("簧片异常");
  return reasons;
};

/** 备注写清楚了才能确认复核 */
export const noteClear = (note: string): boolean =>
  note.trim().length >= MIN_NOTE_LENGTH;

/** 最新复测值（未被替换的记录），所有统计、标记、筛选都以它为准 */
export const latestRecords = (report: Report): PipeRecord[] =>
  report.records.filter((r) => !r.replaced);

export const replacedRecords = (report: Report): PipeRecord[] =>
  report.records.filter((r) => r.replaced);

export const anomalyRecords = (report: Report): PipeRecord[] =>
  latestRecords(report).filter(isAnomaly);

export const pendingReviews = (report: Report): PipeRecord[] =>
  anomalyRecords(report).filter((r) => !r.reviewed);

/** 全部异常音管复核通过、且报告内有有效记录，才能锁定并完成 */
export const canLockReport = (report: Report): boolean =>
  !report.locked &&
  latestRecords(report).length > 0 &&
  pendingReviews(report).length === 0;

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleString("zh-CN", { hour12: false });

export const formatCents = (cents: number): string =>
  `${cents > 0 ? "+" : ""}${cents}`;
