import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Medal, type MedalTone } from "@/components/game/medal";
import { Badges, Burst, CARD_BACK, Face } from "@/components/shop/pack-opening";
import { tr } from "@/lib/i18n";
import { missionRows, type MatchReward, type MissionRow } from "@/lib/missions";
import { playPack, playReward } from "@/lib/sfx";
import { starCount, type Pull } from "@/lib/shop";

/**
 * Nhiệm vụ (chủ game 22/10), after LoR's quest screen (T12): each mission a row with its medal, a bar and its prize.
 * After a won match the bars fill one by one; a mission done flashes and its stars fly as a gold streak into the star
 * total, which counts up; a card prize drops face down and is flipped like a pack card. The menu opens the same rows,
 * standing still.
 */
const LOOK: Record<string, { tone: MedalTone; icon: string }> = {
  first: { tone: "gold", icon: "laurel-crown" },
  more: { tone: "orange", icon: "crossed-swords" },
};
const lookOf = (row: MissionRow) => LOOK[row.id] ?? { tone: "blue" as MedalTone, icon: "robot-golem" };

/** The trail of a streak: the head first, then smaller and fainter sparks a little behind it. */
const TRAIL = [
  { s: 26, o: 1, d: 0 },
  { s: 18, o: 0.8, d: 26 },
  { s: 14, o: 0.62, d: 52 },
  { s: 11, o: 0.46, d: 78 },
  { s: 8, o: 0.32, d: 104 },
  { s: 6, o: 0.2, d: 130 },
];
const FLY_MS = 640;

type Streak = { key: number; x0: number; y0: number; x1: number; y1: number; amount: number; then: () => void };

function Coin({ small = false }: { small?: boolean }) {
  return (
    <span className={`mp-coin${small ? " is-small" : ""}`} aria-hidden="true">
      ★
    </span>
  );
}

function Prize({ row }: { row: MissionRow }) {
  const prize = row.prize;
  if ("pack" in prize) {
    return (
      <>
        <img src={CARD_BACK.N} alt="" draggable={false} />
        <span>{tr("1 lá")}</span>
      </>
    );
  }
  return (
    <>
      <Coin small />
      <span>{prize.stars}</span>
      {prize.each ? <small>{tr("/trận")}</small> : null}
    </>
  );
}

function Row({ row, at, done, flash, chip }: { row: MissionRow; at: number; done: number; flash: boolean; chip: (el: HTMLElement | null) => void }) {
  const full = done >= row.goal;
  const look = lookOf(row);
  return (
    <li className={`mp-row${full ? " is-done" : ""}${flash ? " is-flash" : ""}`} style={{ "--i": at } as CSSProperties}>
      <span className="mp-medal">
        <Medal tone={look.tone} icon={look.icon} />
        {full ? <i className="mp-check">✓</i> : null}
      </span>
      <span className="mp-body">
        <b className="mp-title">{tr(row.title)}</b>
        <span className="mp-track">
          <span className="mp-fill" style={{ "--p": Math.min(1, done / row.goal) } as CSSProperties} />
        </span>
        {row.note && full ? <small className="mp-note">{tr(row.note)}</small> : <small className="mp-note">{"pack" in row.prize ? tr(`1 lá ${row.prize.pack}`) : " "}</small>}
      </span>
      <span className="mp-side">
        <b className="mp-count">
          {Math.min(done, row.goal)}/{row.goal}
        </b>
        <span ref={chip} className="mp-prize">
          <Prize row={row} />
        </span>
      </span>
    </li>
  );
}

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
      <span key={`c${bump}`} className={`mp-coin${bump ? " is-bump" : ""}`} aria-hidden="true">
        ★
      </span>
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

/** The card a mission pays: it drops face down, a tap turns it over (SR jumps, UR comes forward in a ring of light). */
function CardReveal({ pull, onDone }: { pull: Pull; onDone: (from: DOMRect | null) => void }) {
  const [step, setStep] = useState<"drop" | "ready" | "open">("drop");
  const card = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    playPack("deal");
    const timer = window.setTimeout(() => setStep("ready"), 720);
    return () => window.clearTimeout(timer);
  }, []);
  const flip = () => {
    if (step !== "ready") return;
    setStep("open");
    playPack(pull.tier === "UR" ? "flipUR" : pull.tier === "SR" ? "flipSR" : "flip");
  };
  return (
    <div className={`mp-reveal is-${pull.tier}`} onClick={flip}>
      <h3>{tr("PHẦN THƯỞNG")}</h3>
      <div className="mp-stage">
        {step === "open" && pull.tier === "UR" ? <span className="po-bubble" aria-hidden="true" /> : null}
        <button
          ref={card}
          type="button"
          className={`mp-rcard is-${pull.tier}${step === "open" ? " is-flipped" : ""}${step === "open" && pull.tier !== "N" ? " is-pop" : ""}${pull.fresh ? "" : " is-owned"}`}
          aria-label={step === "open" ? undefined : tr("Lật lá")}
        >
          <span className="mp-rcard-inner">
            <span className="mp-rcard-back">
              <img src={CARD_BACK[pull.tier]} alt="" draggable={false} />
            </span>
            <span className="mp-rcard-front">
              <Face pull={pull} />
            </span>
          </span>
          {step === "open" ? <Badges pull={pull} /> : null}
        </button>
        {step === "open" && pull.tier !== "N" ? <Burst count={pull.tier === "UR" ? 26 : 16} rainbow={pull.tier === "UR"} /> : null}
      </div>
      {step === "open" ? (
        <button
          type="button"
          className="mp-go"
          onClick={(event) => {
            event.stopPropagation();
            onDone(card.current?.getBoundingClientRect() ?? null);
          }}
        >
          {tr("OK")}
        </button>
      ) : (
        <p className="mp-hint">{step === "ready" ? tr("Chạm để lật") : " "}</p>
      )}
    </div>
  );
}

/** After a won match that moved a mission: the bars fill in turn and the prizes are paid out. */
export function MissionPanel({ reward, onDone }: { reward: MatchReward; onDone: () => void }) {
  const rows = reward.after;
  const [shown, setShown] = useState(() => reward.before.map((row) => row.done));
  const [flash, setFlash] = useState<number | null>(null);
  const [total, setTotal] = useState(reward.total[0]);
  const [bump, setBump] = useState(0);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [card, setCard] = useState<Pull | null>(null);
  const [end, setEnd] = useState(false);
  const chips = useRef<(HTMLElement | null)[]>([]);
  const totalBox = useRef<HTMLElement | null>(null);
  const resume = useRef<(() => void) | null>(null);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);

  /** A gold streak from a prize (or the reward card) into the coin of the star total. */
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
    const changed = rows.map((row, at) => row.done !== reward.before[at]?.done || row.note !== reward.before[at]?.note);
    const firstPaid = changed[rows.findIndex((row) => row.id === "first")] ?? false;
    const pays = (at: number): "stars" | "card" | null => {
      const row = rows[at];
      if (row.id === "first" && changed[at] && reward.stars > 0) return "stars";
      if (row.id === "more" && changed[at] && !firstPaid && reward.stars > 0) return "stars";
      if ("pack" in row.prize && changed[at] && reward.card) return "card";
      return null;
    };
    const finish = () => {
      setTotal(reward.total[1]);
      setEnd(true);
    };
    const step = (from: number) => {
      const at = rows.findIndex((_, index) => index >= from && changed[index]);
      if (at < 0) return later(200, finish);
      setShown((now) => now.map((value, index) => (index === at ? rows[at].done : value)));
      playReward("rise");
      later(780, () => {
        const pay = pays(at);
        if (!pay) return later(160, () => step(at + 1));
        setFlash(at);
        playReward("done");
        if (pay === "stars") {
          later(240, () => launch(chips.current[at]?.getBoundingClientRect(), reward.stars, () => later(260, () => step(at + 1))));
          return;
        }
        later(520, () => {
          resume.current = () => step(at + 1);
          setCard(reward.card);
        });
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
        <ol className="mp-list">
          {rows.map((row, at) => (
            <Row key={row.id} row={row} at={at} done={shown[at] ?? row.done} flash={flash === at} chip={(el) => (chips.current[at] = el)} />
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
      {card ? (
        <CardReveal
          pull={card}
          onDone={(from) => {
            setCard(null);
            const next = () => {
              const run = resume.current;
              resume.current = null;
              run?.();
            };
            // A card already owned pays 1 star back, flying from the card into the total.
            if (card.refund) launch(from, card.refund, next);
            else next();
          }}
        />
      ) : null}
    </>
  );
}

/** The menu's Nhiệm vụ: the same rows as they stand today. */
export function MissionBoard({ onClose }: { onClose: () => void }) {
  const rows = useMemo(() => missionRows(), []);
  const total = useMemo(() => starCount(), []);
  return (
    <Frame
      total={<Total value={total} bump={0} target={() => undefined} />}
      foot={
        <button type="button" className="mp-go" onClick={onClose}>
          {tr("Đóng")}
        </button>
      }
    >
      <ol className="mp-list">
        {rows.map((row, at) => (
          <Row key={row.id} row={row} at={at} done={row.done} flash={false} chip={() => undefined} />
        ))}
      </ol>
    </Frame>
  );
}
