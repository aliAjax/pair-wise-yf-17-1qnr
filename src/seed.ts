import type { MaintenanceReport, PipeMeasurement, ReedStatus } from "./types";

const t = (hm: string) => `2026-09-26T${hm}:00`;

function mm(
  id: string,
  pipeNo: string,
  stopName: string,
  pitch: string,
  cents: number,
  temperature: number,
  humidity: number,
  reedStatus: ReedStatus,
  note: string,
  recordedAt: string,
  supersededBy: string | null = null
): PipeMeasurement {
  return {
    id,
    pipeNo,
    stopName,
    pitch,
    cents,
    temperature,
    humidity,
    reedStatus,
    note,
    recordedAt,
    supersededBy,
  };
}

export function seedReports(): MaintenanceReport[] {
  return [
    {
      id: "rpt-stmary",
      venue: "St.Mary 大教堂",
      technician: "李维",
      startedAt: t("09:10"),
      status: "进行中",
      locked: false,
      reviewedAt: null,
      measurements: [
        mm("a1", "P-08-014", "Principal 8′", "C4", 3, 21.4, 52, "正常", "", t("09:32")),
        // a2 被 a5 复测替换：旧值保留为「已替换」，汇总以 a5 为准
        mm("a2", "P-08-021", "Trumpet 8′", "C#4", 14, 21.4, 52, "磨损", "", t("09:47"), "a5"),
        mm("a3", "P-16-002", "Bourdon 16′", "F2", -12, 21.6, 53, "正常", "", t("10:05")),
        mm("a4", "P-04-006", "Principal 4′", "G3", -3, 21.6, 53, "正常", "", t("10:18")),
        mm(
          "a5",
          "P-08-021",
          "Trumpet 8′",
          "C#4",
          9,
          21.9,
          54,
          "磨损",
          "簧片清灰并微调簧舌，偏差由 +14 降至 +9，待复核确认",
          t("10:36")
        ),
        mm("a6", "P-08-030", "Mixture IV", "A4", 1, 22.0, 54, "正常", "", t("10:52")),
        mm("a7", "P-08-033", "Gedackt 8′", "D3", 8, 22.1, 55, "正常", "", t("11:08")),
      ],
    },
    {
      id: "rpt-concerthall",
      venue: "ConcertHall A 音乐厅",
      technician: "王岚",
      startedAt: t("08:30"),
      status: "已完成",
      locked: true,
      reviewedAt: t("10:05"),
      measurements: [
        mm("b1", "P-01-101", "Principal 8′", "A3", 2, 20.8, 48, "正常", "", t("08:55")),
        mm("b2", "P-01-115", "Trompete 8′", "E4", 11, 20.9, 48, "松动", "", t("09:12"), "b4"),
        mm("b3", "P-01-120", "Bourdon 16′", "C2", -4, 21.0, 49, "正常", "", t("09:26")),
        mm(
          "b4",
          "P-01-115",
          "Trompete 8′",
          "E4",
          5,
          21.2,
          49,
          "正常",
          "簧片紧固后复测，偏差 +11 → +5，恢复正常",
          t("09:44")
        ),
      ],
    },
    {
      id: "rpt-abbey",
      venue: "Abbey Room 礼堂",
      technician: "李维",
      startedAt: t("13:40"),
      status: "进行中",
      locked: false,
      reviewedAt: null,
      measurements: [
        mm("c1", "P-04-201", "Principal 4′", "G3", -3, 22.4, 57, "正常", "", t("13:55")),
        mm("c2", "P-08-205", "Salicional 8′", "B3", 6, 22.5, 57, "正常", "", t("14:10")),
        mm("c3", "P-08-209", "Rohrflöte 8′", "F3", 0, 22.5, 58, "正常", "", t("14:22")),
      ],
    },
  ];
}
