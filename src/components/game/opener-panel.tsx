import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Medal } from "@/components/game/medal";
import { playIntro } from "@/lib/sfx";
import { tr } from "@/lib/i18n";

/** One opening card: how it looks, and whether its pile still has a card to replace it with. */
export type OpenerCard = { key: string; face: ReactNode; can: boolean };

/** Seconds to choose (chủ game 22/10, câu 6); when they run out, the cards marked so far are replaced. */
const LIMIT = 20;
/** The replaced cards flip and fly back to the pile, then the new ones fly out and flip up (ms). */
const OUT = 700;
const IN = 750;
const LEAVE = 450;
/** Where the piles are, in % of the screen's width (the stack button sits at the right); the 3 cards stand at 19, 50
 *  and 81 %. */
const PILE_X = 83;

/**
 * Bài khởi đầu (chủ game 22/10, T2 trong video LoR; tự dựng lại): the 3 opening cards (2 monsters, 1 spell). Tap a
 * card or its Thay thế button to mark it (a purple swirl turns on it), Hoàn tác to unmark, OK to confirm. Marked cards
 * flip face down and fly back to the pile; the new ones fly out and flip up. Then "Đang chờ đối thủ…" until the other
 * side is done too (Đánh thường, Tuỳ chọn), and the panel leaves as the match starts.
 */
export function OpenerPanel({
  cards,
  first,
  ready,
  startWaiting = false,
  onConfirm,
  onClosed,
}: {
  /** The current opening cards: after OK, the new cards stand where the replaced ones were. */
  cards: OpenerCard[];
  /** This side moves first. */
  first: boolean;
  /** Both sides are done: the match can start. */
  ready: boolean;
  /** This side already chose (the page was opened again while the other side chooses). */
  startWaiting?: boolean;
  onConfirm: (picked: number[]) => void;
  onClosed: () => void;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  const [phase, setPhase] = useState<"pick" | "out" | "in" | "wait" | "leave">(startWaiting ? "wait" : "pick");
  const [left, setLeft] = useState(LIMIT);
  const before = useRef<OpenerCard[]>([]);
  const sent = useRef<number[]>([]);
  const confirmRef = useRef<() => void>(() => {});
  /** OK counts once, even when two taps (or a tap and the clock) land before the panel redraws. */
  const confirmed = useRef(startWaiting);
  const closedRef = useRef(onClosed);
  closedRef.current = onClosed;

  confirmRef.current = () => {
    if (phase !== "pick" || confirmed.current) return;
    confirmed.current = true;
    const chosen = [...pickedRef.current].sort((a, b) => a - b);
    before.current = cards;
    sent.current = chosen;
    onConfirm(chosen);
    if (!chosen.length) {
      setPhase("wait");
      return;
    }
    setPhase("out");
    playIntro("flip");
    playIntro("back", 0.24);
    window.setTimeout(() => {
      setPhase("in");
      playIntro("deal");
      playIntro("flip", 0.42);
    }, OUT);
    window.setTimeout(() => setPhase("wait"), OUT + IN);
  };

  // The clock runs while choosing; at 0 the marked cards are replaced.
  useEffect(() => {
    if (phase !== "pick") return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const rest = Math.max(0, LIMIT - Math.floor((Date.now() - started) / 1000));
      setLeft(rest);
      if (rest === 0) {
        window.clearInterval(timer);
        confirmRef.current();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "wait" || !ready) return;
    setPhase("leave");
    playIntro("ready");
  }, [phase, ready]);

  useEffect(() => {
    if (phase !== "leave") return;
    const timer = window.setTimeout(() => closedRef.current(), LEAVE);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const toggle = (index: number) => {
    if (phase !== "pick" || !cards[index]?.can) return;
    const on = picked.includes(index);
    playIntro(on ? "unmark" : "mark");
    setPicked(on ? picked.filter((item) => item !== index) : [...picked, index]);
  };

  const shown = phase === "out" ? before.current : cards;
  const waiting = phase === "wait" && !ready;

  return (
    <div className={`op is-${phase}`} role="dialog" aria-label={tr("Bài khởi đầu")}>
      <div className="op-dim" />
      <div className="op-head">
        <h2 className="op-title">{tr("Bài khởi đầu")}</h2>
        <p className="op-sub">{tr(waiting ? "Đang chờ đối thủ…" : "Chọn các lá bài để thay thế")}</p>
      </div>
      <div className="op-row">
        {shown.map((card, index) => {
          const swapped = sent.current.includes(index);
          const marked = phase === "pick" && picked.includes(index);
          const motion = swapped && (phase === "out" || phase === "in") ? ` is-${phase}` : "";
          return (
            <div key={index} className={`op-slot${marked ? " is-marked" : ""}${motion}`} style={{ "--to-pile": `${PILE_X - (19 + index * 31)}cqw` } as CSSProperties}>
              <button type="button" className="op-card" disabled={phase !== "pick" || !card.can} onClick={() => toggle(index)}>
                <span className="op-flip">
                  <span className="op-front">{card.face}</span>
                  <img className="op-back" src="/ui/card-back.webp" alt="" draggable={false} />
                </span>
                {marked ? <span className="op-swirl" aria-hidden="true" /> : null}
              </button>
              <button type="button" className={`op-toggle${marked ? " is-undo" : ""}`} disabled={phase !== "pick" || !card.can} onClick={() => toggle(index)}>
                {tr(marked ? "Hoàn tác" : "Thay thế")}
              </button>
            </div>
          );
        })}
      </div>
      <p className="op-first">{tr(first ? "Bạn đi trước" : "Bạn sẽ đi sau")}</p>
      <div className="op-foot">
        <button type="button" className="op-ok press" aria-label="OK" disabled={phase !== "pick"} onClick={() => confirmRef.current()}>
          <Medal tone="blue" icon="check-mark" />
          <svg className="op-clock" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="18.6" pathLength={100} style={{ strokeDashoffset: 100 - (left / LIMIT) * 100 }} />
          </svg>
        </button>
        {phase === "pick" ? <span className="op-left">{left}</span> : null}
      </div>
    </div>
  );
}
