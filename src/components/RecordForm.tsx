import { useState } from "react";
import type { FormEvent } from "react";
import { STOPS } from "../data";
import { ANOMALY_CENTS, MIN_NOTE_LENGTH } from "../types";
import type { NewRecordData, ReedStatus } from "../types";

interface Props {
  locked: boolean;
  existingPipeNos: string[];
  onSubmit: (data: NewRecordData) => void;
}

export default function RecordForm({ locked, existingPipeNos, onSubmit }: Props) {
  const [pipeNo, setPipeNo] = useState("");
  const [stop, setStop] = useState(STOPS[0].name);
  const [pitch, setPitch] = useState("");
  const [cents, setCents] = useState("0");
  const [temperature, setTemperature] = useState("21");
  const [humidity, setHumidity] = useState("45");
  const [reed, setReed] = useState<ReedStatus>("normal");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (locked) {
    return <p className="banner">报告已锁定，无法新增或补录音管记录。</p>;
  }

  const centsNum = Number(cents);
  const willFlag =
    (cents.trim() !== "" &&
      Number.isFinite(centsNum) &&
      Math.abs(centsNum) >= ANOMALY_CENTS) ||
    reed === "abnormal";
  const isSupplement =
    pipeNo.trim() !== "" && existingPipeNos.includes(pipeNo.trim());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const tempNum = Number(temperature);
    const humNum = Number(humidity);
    if (!pipeNo.trim()) return setError("请填写音管编号");
    if (!pitch.trim()) return setError("请填写音高（如 C#4）");
    if (!Number.isFinite(centsNum)) return setError("音分偏差需为数字");
    if (!Number.isFinite(tempNum)) return setError("温度需为数字");
    if (!Number.isFinite(humNum) || humNum < 0 || humNum > 100)
      return setError("湿度需为 0 ~ 100 的数字");

    onSubmit({
      pipeNo: pipeNo.trim(),
      stop,
      pitch: pitch.trim(),
      cents: centsNum,
      temperature: tempNum,
      humidity: humNum,
      reed,
      note: note.trim(),
    });
    // 保留音栓 / 温湿度，方便同一场馆连续录入
    setPipeNo("");
    setPitch("");
    setCents("0");
    setNote("");
    setError("");
  };

  return (
    <form className="record-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          <span>音管编号</span>
          <input
            value={pipeNo}
            onChange={(e) => setPipeNo(e.target.value)}
            placeholder="如 P-014"
          />
        </label>
        <label>
          <span>音栓</span>
          <select value={stop} onChange={(e) => setStop(e.target.value)}>
            {STOPS.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}（{s.category}）
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>音高</span>
          <input
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="如 C#4"
          />
        </label>
        <label>
          <span>音分偏差</span>
          <input
            value={cents}
            onChange={(e) => setCents(e.target.value)}
            inputMode="decimal"
            placeholder="如 -12"
          />
        </label>
        <label>
          <span>温度 ℃</span>
          <input
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label>
          <span>湿度 %</span>
          <input
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label>
          <span>簧片状态</span>
          <select
            value={reed}
            onChange={(e) => setReed(e.target.value as ReedStatus)}
          >
            <option value="normal">正常</option>
            <option value="abnormal">异常</option>
          </select>
        </label>
        <label>
          <span>维修备注</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`异常音管需写清楚（至少 ${MIN_NOTE_LENGTH} 个字）`}
          />
        </label>
      </div>
      <div className="form-foot">
        <button type="submit" className="primary">
          {isSupplement ? "补录复测值" : "保存记录"}
        </button>
        {isSupplement && (
          <span className="hint warn">
            该编号已存在：提交后旧值标记为已替换，统计以新复测值为准
          </span>
        )}
        {willFlag && (
          <span className="hint danger">
            偏差达到 ±{ANOMALY_CENTS} 音分或簧片异常，提交后自动进入待复核
          </span>
        )}
        {error && <span className="hint danger">{error}</span>}
      </div>
    </form>
  );
}
