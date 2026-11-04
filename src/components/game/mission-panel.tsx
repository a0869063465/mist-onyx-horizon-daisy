import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Burst } from "@/components/shop/pack-opening";
import { tr } from "@/lib/i18n";
import type { ListedMission } from "@/lib/mission-list";
import type { MatchReward } from "@/lib/missions";
import { playReward } from "@/lib/sfx";

/**
 * Nhiệm vụ (chủ game 04/11): mỗi hàng là đúng ảnh hàng GPT của chủ game (`rd*` / `rw*`), code chỉ vẽ đè thanh tiến
 * độ (nhiệm vụ đang đếm), ô thưởng (ngôi sao của chủ game) và bảo vật. Sau trận, thanh chạy lần lượt; nhiệm vụ vừa
 * xong loé và sao bay vào ô tổng, số đếm lên.
 */

/** Một hàng nhiệm vụ; `chip` nhận ô thưởng để sao bay ra từ đó. */
export function MissionCard({ row, done, at, flash = false, chip }: { row: ListedMission; done: number; at: number; flash?: boolean; chip?: (el: HTMLElement | null) => void }) {
  const full = !row.locked && done >= row.goal;
  const bar = row.bar;
  return (
    <li
      className={`mx-card${row.locked ? " is-locked" : ""}${full ? " is-done" : ""}${flash ? " is-flash" : ""}`}
      style={{ "--i": at } as CSSProperties}
      aria-label={`${tr(row.title)} ${done} / ${row.goal}`}
    >
      <img className="mx-row" src={`/ui/mission/${row.row}.webp`} alt="" draggable={false} />
      {bar && !row.locked ? (
        <span
          className="mx-bar"
          style={{ "--top": bar[0], "--high": bar[1] - bar[0], "--p": Math.min(1, done / row.goal) } as CSSProperties}
          aria-hidden="true"
        >
          <em>
            {Math.min(done, row.goal)} / {row.goal}
          </em>
          <span className="mx-track">
            <i />
          </span>
        </span>
      ) : null}
      {row.relic ? (
        <span className="mx-relic" aria-hidden="true">
          <img src={`/ui/mission/${row.relic}.webp`} alt="" draggable={false} />
        </span>
      ) : null}
      <span ref={chip} className="mx-prize" aria-hidden="true">
        <img src="/ui/star.webp" alt="" draggable={false} />
        <b>×{row.stars}</b>
        {full ? <small className="mx-got">{tr("ĐÃ NHẬN")}</small> : null}
      </span>
      {row.locked ? <span className="mx-soon">{tr("Sắp có")}</span> : null}
    </li>
  );
}

/** The trail of a streak: the head first, then smaller and fainter sparks a little behind it. */
const TRAIL = [
  { s: 26, o: 1, d: 0 },
  { s: 18, o: 0.8, d: 26 },
  { s: 14, o: 0.62, d: 52 },
  { s: 11, o: 0.46, d: 78 },
  { s: 8, o: 0.32, d: 104 },
  { s: 6, o: 0.2, d: 130 },
];

type Streak = { key: number; x0: number; y0: number; x1: number; y1: number; amount: number; then: () => void };

/** The star total; a new value counts up from the old one, and each landing streak makes it bump. */
function Total({ value, bump, target }: { value: number; bump: number; target: (el: HTMLElement | null) => void }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const begin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const u = Math.min(1, (now - start) / 420);
      setShown(Math.round(begin + (value - begin) * (1 - (1 - u) ** 3)));
      if (u < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <div ref={target} className="mp-total">
      <span key={`c${bump}`} className={`mp-coin${bump ? " is-bump" : ""}`} aria-hidden="true" />
      <b key={`n${bump}`} className={bump ? "is-bump" : undefined}>
        {shown}
      </b>
      {bump ? <i key={`r${bump}`} className="mp-total-ring" aria-hidden="true" /> : null}
      {bump ? <Burst key={`b${bump}`} count={14} /> : null}
    </div>
  );
}

function Frame({ total, children, foot }: { total: ReactNode; children: ReactNode; foot: ReactNode }) {
  return (
    <div className="mp" role="dialog" aria-label={tr("Nhiệm vụ")}>
      <i className="mp-dust" aria-hidden="true" />
      {total}
      <header className="mp-head">
        <h2>{tr("NHIỆM VỤ")}</h2>
        <svg className="mp-flourish" viewBox="0 0 240 20" aria-hidden="true">
          <path d="M3 16h9q4 0 4-4v-2h94M130 10h94v2q0 4 4 4h9" />
          <path d="M110 10l10-7 10 7-10 7z" />
        </svg>
        <small>{tr("Làm mới lúc 0 giờ mỗi ngày")}</small>
      </header>
      {children}
      <footer className="mp-foot">{foot}</footer>
    </div>
  );
}

/** After a match that moved a mission: the bars fill in turn and each mission just done pays its stars. */
export function MissionPanel({ reward, onDone }: { reward: MatchReward; onDone: () => void }) {
  const rows = reward.after;
  const [shown, setShown] = useState(() => reward.before.map((row) => row.done));
  const [flash, setFlash] = useState<number | null>(null);
  const [total, setTotal] = useState(reward.total[0]);
  const [bump, setBump] = useState(0);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [end, setEnd] = useState(false);
  const chips = useRef<(HTMLElement | null)[]>([]);
  const totalBox = useRef<HTMLElement | null>(null);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);

  /** A gold streak from a prize into the coin of the star total. */
  const launch = (from: DOMRect | null | undefined, amount: number, then: () => void) => {
    const to = totalBox.current?.querySelector(".mp-coin")?.getBoundingClientRect();
    if (!from || !to || amount <= 0) {
      setTotal((now) => now + Math.max(0, amount));
      then();
      return;
    }
    seq.current += 1;
    playReward("streak");
    const x0 = from.left + from.width / 2;
    const y0 = from.top + from.height / 2;
    setStreaks((now) => [...now, { key: seq.current, x0, y0, x1: to.left + to.width / 2, y1: to.top + to.height / 2, amount, then }]);
  };

  useEffect(() => {
    const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
    const changed = rows.map((row, at) => row.done !== reward.before[at]?.done);
    const pays = (at: number) => changed[at] && rows[at].done >= rows[at].goal && (reward.before[at]?.done ?? 0) < rows[at].goal;
    const finish = () => {
      setTotal(reward.total[1]);
      setEnd(true);
    };
    const step = (from: number) => {
      const at = rows.findIndex((_, index) => index >= from && changed[index]);
      if (at < 0) return later(200, finish);
      chips.current[at]?.closest("li")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setShown((now) => now.map((value, index) => (index === at ? rows[at].done : value)));
      playReward("rise");
      later(700, () => {
        if (!pays(at)) return later(120, () => step(at + 1));
        setFlash(at);
        playReward("done");
        later(240, () => launch(chips.current[at]?.getBoundingClientRect(), rows[at].stars, () => later(240, () => step(at + 1))));
      });
    };
    later(700, () => step(0));
    const list = timers.current;
    return () => list.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward, rows]);

  /** The head of a streak reaches the coin: the total takes the stars; the tail is cleared when its last spark lands. */
  const land = (streak: Streak) => {
    setTotal((now) => now + streak.amount);
    setBump((now) => now + 1);
    playReward("coin");
    streak.then();
  };
  const clear = (key: number) => setStreaks((now) => now.filter((item) => item.key !== key));

  return (
    <>
      <Frame
        total={<Total value={total} bump={bump} target={(el) => (totalBox.current = el)} />}
        foot={
          end ? (
            <button type="button" className="mp-go" onClick={onDone}>
              {tr("Tiếp tục")}
            </button>
          ) : null
        }
      >
        <ol className="mp-list mx-plist">
          {rows.map((row, at) => (
            <MissionCard key={row.id} row={row} at={at} done={shown[at] ?? row.done} flash={flash === at} chip={(el) => (chips.current[at] = el)} />
          ))}
        </ol>
      </Frame>
      {streaks.map((streak) => (
        <span
          key={streak.key}
          className="mp-streak"
          style={{ "--x0": `${streak.x0}px`, "--y0": `${streak.y0}px`, "--dx": `${streak.x1 - streak.x0}px`, "--dy": `${streak.y1 - streak.y0}px` } as CSSProperties}
          aria-hidden="true"
        >
          {TRAIL.map((dot, index) => (
            <span key={index} className="mp-streak-x" style={{ "--d": `${dot.d}ms` } as CSSProperties}>
              <span className="mp-streak-y" onAnimationEnd={index === 0 ? () => land(streak) : index === TRAIL.length - 1 ? () => clear(streak.key) : undefined}>
                <i className="mp-comet" style={{ "--s": `${dot.s}px`, "--o": dot.o } as CSSProperties} />
              </span>
            </span>
          ))}
        </span>
      ))}
    </>
  );
}
