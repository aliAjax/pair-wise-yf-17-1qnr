import { uid } from "./types";
import type { PipeRecord, Report } from "./types";

export interface StopInfo {
  name: string;
  category: string;
}

export const STOP_CATEGORIES = ["主音栓", "簧片音栓", "混合音栓", "低音管"];

export const STOPS: StopInfo[] = [
  { name: "Principal 8'", category: "主音栓" },
  { name: "Principal 4'", category: "主音栓" },
  { name: "Octave 2'", category: "主音栓" },
  { name: "Trumpet 8'", category: "簧片音栓" },
  { name: "Clarion 4'", category: "簧片音栓" },
  { name: "Mixture IV", category: "混合音栓" },
  { name: "Scharf III", category: "混合音栓" },
  { name: "Bourdon 16'", category: "低音管" },
  { name: "Subbass 16'", category: "低音管" },
];

let clock = Date.now() - 1000 * 60 * 60 * 6;
const tick = () => new Date((clock += 1000 * 60 * 9)).toISOString();

interface SeedRecord extends Partial<PipeRecord> {
  pipeNo: string;
  stop: string;
  pitch: string;
  cents: number;
  temperature: number;
  humidity: number;
  reed: PipeRecord["reed"];
  note: string;
}

const rec = (r: SeedRecord): PipeRecord => ({
  reviewed: false,
  replaced: false,
  ...r,
  id: uid(),
  createdAt: tick(),
});

export const seedReports: Report[] = [
  {
    id: uid(),
    venue: "St.Mary 大教堂",
    createdAt: tick(),
    status: "in-progress",
    locked: false,
    records: [
      rec({
        pipeNo: "P-014",
        stop: "Trumpet 8'",
        pitch: "C#4",
        cents: 9,
        temperature: 21.5,
        humidity: 46,
        reed: "abnormal",
        note: "簧片需微调，已现场调整并复测",
      }),
      rec({
        pipeNo: "P-027",
        stop: "Principal 4'",
        pitch: "G3",
        cents: -3,
        temperature: 21.4,
        humidity: 47,
        reed: "normal",
        note: "正常",
      }),
      // P-031 的旧复测值：已被下面的新值替换
      rec({
        pipeNo: "P-031",
        stop: "Bourdon 16'",
        pitch: "F2",
        cents: -15,
        temperature: 21.3,
        humidity: 48,
        reed: "normal",
        note: "初测偏差明显，准备复测",
        replaced: true,
      }),
      rec({
        pipeNo: "P-031",
        stop: "Bourdon 16'",
        pitch: "F2",
        cents: -12,
        temperature: 21.6,
        humidity: 45,
        reed: "normal",
        note: "",
      }),
      rec({
        pipeNo: "P-040",
        stop: "Mixture IV",
        pitch: "A4",
        cents: 4,
        temperature: 21.5,
        humidity: 46,
        reed: "normal",
        note: "复测正常",
      }),
    ],
  },
  {
    id: uid(),
    venue: "ConcertHall A 音乐厅",
    createdAt: tick(),
    status: "completed",
    locked: true,
    records: [
      rec({
        pipeNo: "P-102",
        stop: "Principal 8'",
        pitch: "C4",
        cents: 2,
        temperature: 22.1,
        humidity: 44,
        reed: "normal",
        note: "状态良好",
      }),
      rec({
        pipeNo: "P-118",
        stop: "Clarion 4'",
        pitch: "E4",
        cents: 8,
        temperature: 22.0,
        humidity: 44,
        reed: "abnormal",
        note: "簧片老化，已更换并复测合格",
        reviewed: true,
      }),
      rec({
        pipeNo: "P-120",
        stop: "Subbass 16'",
        pitch: "C2",
        cents: -1,
        temperature: 22.2,
        humidity: 43,
        reed: "normal",
        note: "正常",
      }),
    ],
  },
  {
    id: uid(),
    venue: "Abbey Room 音乐厅",
    createdAt: tick(),
    status: "in-progress",
    locked: false,
    records: [
      rec({
        pipeNo: "P-201",
        stop: "Bourdon 16'",
        pitch: "D2",
        cents: -6,
        temperature: 20.2,
        humidity: 52,
        reed: "normal",
        note: "接近阈值，持续观察",
      }),
      rec({
        pipeNo: "P-205",
        stop: "Trumpet 8'",
        pitch: "B3",
        cents: 11,
        temperature: 20.4,
        humidity: 51,
        reed: "abnormal",
        note: "",
      }),
      rec({
        pipeNo: "P-207",
        stop: "Scharf III",
        pitch: "G4",
        cents: 1,
        temperature: 20.3,
        humidity: 52,
        reed: "normal",
        note: "正常",
      }),
    ],
  },
];
