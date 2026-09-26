export type ReedStatus = "正常" | "磨损" | "松动" | "异响";

/** 单支音管的一次测量记录 */
export interface PipeMeasurement {
  id: string;
  pipeNo: string;
  stopName: string;
  pitch: string;
  /** 音分偏差，达到 ±8 即超限 */
  cents: number;
  temperature: number;
  humidity: number;
  reedStatus: ReedStatus;
  /** 维修备注，异常音管必须写清才能确认复核 */
  note: string;
  recordedAt: string;
  /** 被后续复测替换时，指向新记录 id；null 表示当前最新值 */
  supersededBy: string | null;
}

export type ReportStatus = "进行中" | "已完成";

/** 单次维护报告（一个场馆一次调音） */
export interface MaintenanceReport {
  id: string;
  venue: string;
  technician: string;
  startedAt: string;
  status: ReportStatus;
  /** 复核通过后锁定：音管编号、测量数据与备注不可再改 */
  locked: boolean;
  reviewedAt: string | null;
  measurements: PipeMeasurement[];
}

export interface StopSummary {
  name: string;
  total: number;
  abnormal: number;
  avgAbsCents: number;
  maxAbsCents: number;
}

export interface EnvSummary {
  count: number;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  avgHumidity: number;
  lastTemp: number;
  lastHumidity: number;
  lastAt: string;
}
