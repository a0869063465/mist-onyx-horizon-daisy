import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Burst } from "@/components/shop/pack-opening";
import type { DailyView } from "@/lib/daily-missions";
import type { ListedMission } from "@/lib/mission-list";
import { tr } from "@/lib/i18n";
import { playReward } from "@/lib/sfx";

/**
 * Hàng nhiệm vụ ngày (chủ game 05/11): mỗi trạng thái là NGUYÊN hàng cắt từ ảnh thiết kế, giữ khung, chữ, icon, ánh sáng.
 * xanh dương (đang làm) / vàng (đủ, chờ nhận) / xanh lá (đã nhận). Chỉ ống tiến độ xanh dương và chữ "n / mục tiêu" do code vẽ
 * (ống rỗng + viên số nằm sẵn trong ảnh, chữ số trong viên đã xoá); ô sao ở hàng vàng là nút nhận thưởng duy nhất bấm được.
 * Toạ độ là % của hàng (đo trên ảnh xanh dương 900 px): t/fh = mép trên và cao của phần đầy, c = tâm dọc của chữ số.
 */
export const QROW = [
  { h: 170, t: 70.38, fh: 13.39, c: 77.08 },
  { h: 170, t: 69.01, fh: 13.39, c: 75.70 },
  { h: 170, t: 69.01, fh: 13.39, c: 75.70 },
  { h: 170, t: 69.70, fh: 13.05, c: 76.22 },
  { h: 170, t: 70.04, fh: 13.39, c: 76.73 },
  { h: 170, t: 70.04, fh: 13.39, c: 76.73 },
  { h: 170, t: 69.70, fh: 13.05, c: 76.22 },
  { h: 170, t: 69.35, fh: 13.39, c: 76.05 },
];
const FILL_ONE = 38.39;
const FILL_TWO = 40.47;
const FILL_END = 70.43;
const NUM_LEFT = 29.31;

export function DailyCard({ row, at, daily, from, delay = 0 }: { row: ListedMission; at: number; daily: DailyView; from?: number; delay?: number }) {
  const q = QROW[at] ?? QROW[0];
  const real = daily.done(row);
  // Bảng sau trận: thanh chạy từ tiến độ cũ lên mới (from), lần lượt theo `delay` ms.
  const [shown, setShown] = useState(from ?? real);
  useEffect(() => {
    if (from === undefined) return;
    const id = window.setTimeout(() => setShown(real), delay + 350);
    return () => window.clearTimeout(id);
  }, [from, real, delay]);
  const done = from === undefined ? real : shown;
  const claimed = daily.claimed(row);
  const ready = !claimed && done >= row.goal;
  const [fading, setFading] = useState(false);
  const [pop, setPop] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const left = row.goal >= 10 ? FILL_TWO : FILL_ONE;
  const full = FILL_END - left;
  const ratio = Math.min(1, done / row.goal);

  const press = () => {
    if (!ready) return;
    if (!daily.claim(row)) return;
    playReward("coin");
    playReward("done", 0.12);
    setFading(true);
    setPop((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFading(false), 700);
  };

  return (
    <li
      className={`mx-card is-q${ready ? " is-ready" : ""}${claimed ? " is-claimed" : ""}`}
      style={{ "--i": at, aspectRatio: `900 / ${q.h}` } as CSSProperties}
      aria-label={`${tr(row.title)} ${done} / ${row.goal}`}
    >
      {!claimed && !ready ? <img className="mx-q" src={`/ui/mission/q-b${at}.webp`} alt="" draggable={false} /> : null}
      {ready || (claimed && fading) ? <img className={`mx-q${claimed ? " is-under" : ""}`} src={`/ui/mission/q-g${at}.webp`} alt="" draggable={false} /> : null}
      {claimed ? <img className="mx-q" src={`/ui/mission/q-d${at}.webp`} alt="" draggable={false} /> : null}
      {!claimed && !ready ? (
        <>
          <i
            className="mx-fill"
            aria-hidden="true"
            style={{ left: `${left}%`, top: `${q.t}%`, height: `${q.fh}%`, width: `${full * ratio}%`, opacity: done > 0 ? 1 : 0 } as CSSProperties}
          />
          <b className={`mx-num${`${done} / ${row.goal}`.length > 6 ? " is-long" : ""}`} style={{ left: `${NUM_LEFT}%`, top: `${q.c}%` }}>
            {done} / {row.goal}
          </b>
        </>
      ) : null}
      {ready ? (
        <button type="button" className="mx-claim" aria-label={tr("Nhận thưởng")} onClick={press} style={{ backgroundImage: `url(/ui/mission/q-g${at}.webp)` }} />
      ) : null}
      {pop > 0 ? (
        <span key={pop} className="mx-pop" aria-hidden="true">
          <Burst count={16} />
          <em>+{row.stars}★</em>
        </span>
      ) : null}
    </li>
  );
}
