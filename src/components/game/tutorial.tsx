import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Duel, Side } from "@/lib/duel";
import { playCue } from "@/lib/sfx";

/** Numbers the tutorial shows on the board instead of the live ones, so each beat of the script reads right. */
export type TutView = { youOrb?: number; youGems?: number; youStars?: number; show?: string[] };

type Focus = { sel: string; min?: number };
type Wait = "ok" | "auto" | "hand-spell" | "draw" | "summon";
type Step = {
  text?: string;
  focus: Focus[];
  wait: Wait;
  ms?: number;
  ribbon?: string;
  view?: TutView;
  /** Clickable besides the focused parts while the step waits for the player. */
  allow?: string[];
  hand?: "reserve" | "spell";
  pop?: string;
};

const ORB: Focus = { sel: '[data-tut="youOrb"]', min: 0.2 };
const GEMS: Focus = { sel: '[data-tut="youGems"]', min: 0.09 };
const STARS: Focus = { sel: '[data-tut="youStars"]', min: 0.09 };
const MONSTERS: Focus = { sel: ".hand .hand-card.is-monster" };

function steps(viewer: Side): Step[] {
  const slots: Focus = { sel: `[data-slot][data-owner="${viewer}"][data-empty="1"]` };
  return [
    { text: "Đầu trận bạn nhận được 1 mana.", focus: [ORB], wait: "ok", view: { youOrb: 1 }, hand: "reserve" },
    { text: "Hai lá bài quái thú.", focus: [MONSTERS], wait: "ok", view: { youOrb: 1 } },
    {
      text: "Đây là ô đổi bài quái thú và quái trên tay. Số trên ô hiển thị số lá bài có trong xấp.\nBấm vào để đổi loại bài trên tay.",
      focus: [{ sel: ".face-pile" }],
      wait: "hand-spell",
      view: { youOrb: 1 },
    },
    { text: "Đầu game bạn sẽ có 1 lá bài phép miễn phí.", focus: [{ sel: ".hand .hand-card.is-spell" }], wait: "ok", view: { youOrb: 1 } },
    { focus: [], wait: "auto", ms: 1900, ribbon: "Bắt đầu lượt", view: { youOrb: 1 } },
    { text: "Mỗi lượt bạn nhận được 1 mana vào cầu.", focus: [ORB], wait: "ok", pop: "youOrb" },
    { text: "Hãy chú ý thanh mana đã sử dụng này.", focus: [GEMS], wait: "ok", view: { show: ["youGems"] } },
    { text: "Và sao ở kế bên.", focus: [STARS], wait: "ok", view: { show: ["youGems"] } },
    {
      text: "Hãy chọn loại bài mình rút.",
      focus: [{ sel: ".actions .act.is-draw-mon" }, { sel: ".actions .act.is-draw-spell" }],
      wait: "draw",
      view: { show: ["youGems"] },
    },
    { text: "Mana bạn dùng để rút bài chuyển vào mộ mana.", focus: [GEMS], wait: "ok", view: { youGems: 1, youStars: 0, show: ["youGems"] }, pop: "youGems" },
    { focus: [GEMS, STARS], wait: "auto", ms: 2600, view: { youGems: 1, youStars: 0, show: ["youGems"] } },
    { text: "Khi đủ lượng mana nhất định, mana trong mộ sẽ hiến tế thành Sao.", focus: [STARS], wait: "ok" },
    {
      text: "Đã đủ hiến tế cho quái 1 sao. Hãy triệu hồi quái ra sân.\nBạn có thể kéo thả quái ra sân.\nHoặc nhấp vào quái và bấm triệu hồi.",
      focus: [MONSTERS, slots],
      wait: "summon",
      allow: [".inspect-card", ".inspect-dismiss"],
      hand: "reserve",
    },
  ];
}

type Box = { left: number; top: number; width: number; height: number };

function measure(focus: Focus[]): Box[] {
  const board = document.querySelector(".board")?.getBoundingClientRect();
  const boxes: Box[] = [];
  for (const item of focus) {
    for (const el of document.querySelectorAll(item.sel)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const side = item.min && board ? board.width * item.min : 0;
      const width = Math.max(r.width + 12, side);
      const height = Math.max(r.height + 12, side);
      // Keep the ring on screen when the part sits at the very edge.
      const left = Math.max(2, Math.min(window.innerWidth - width - 2, r.left + r.width / 2 - width / 2));
      const top = Math.max(2, Math.min(window.innerHeight - height - 2, r.top + r.height / 2 - height / 2));
      boxes.push({ left, top, width, height });
    }
  }
  return boxes;
}

function same(a: Box[], b: Box[]) {
  return a.length === b.length && a.every((box, i) => Math.abs(box.left - b[i].left) < 0.5 && Math.abs(box.top - b[i].top) < 0.5 && Math.abs(box.width - b[i].width) < 0.5 && Math.abs(box.height - b[i].height) < 0.5);
}

/**
 * Guided first turn: dims the board, rings the parts the current line talks about in gold, and only lets
 * the player press what that line asks for. "Bỏ qua" is always there.
 */
export function Tutorial({
  duel,
  viewer,
  hand,
  setHand,
  onView,
  onSkip,
  onDone,
}: {
  duel: Duel;
  viewer: Side;
  hand: "reserve" | "spell";
  setHand: (hand: "reserve" | "spell") => void;
  onView: (view: TutView | null) => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const list = useRef(steps(viewer)).current;
  const [at, setAt] = useState(0);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [holes, setHoles] = useState<Box[]>([]);
  const [anim, setAnim] = useState<TutView | null>(null);
  const [pop, setPop] = useState<{ key: string; n: number } | null>(null);
  const [aside, setAside] = useState(false);
  const start = useRef({ draws: duel.players[viewer].draws, field: duel.players[viewer].field.filter(Boolean).length });
  const step = list[at] as Step | undefined;

  const next = () => setAt((now) => now + 1);

  // Enter a step: set the numbers, the hand side, and any pop.
  useEffect(() => {
    if (!step) {
      onView(null);
      onDone();
      return;
    }
    if (step.hand) setHand(step.hand);
    setAnim(null);
    if (step.pop) {
      setPop({ key: step.pop, n: Date.now() });
      playCue("star");
    }
    if (step.wait === "auto" && !step.ribbon) {
      // Mộ mana empties into the star, slowly.
      const t1 = window.setTimeout(() => setAnim({ youGems: 0, youStars: 0, show: ["youGems"] }), 800);
      const t2 = window.setTimeout(() => {
        setAnim({ youGems: 0, show: ["youGems"] });
        setPop({ key: "youStars", n: Date.now() });
        playCue("star");
      }, 1500);
      const t3 = window.setTimeout(next, step.ms ?? 2000);
      return () => [t1, t2, t3].forEach((t) => window.clearTimeout(t));
    }
    if (step.wait === "auto") {
      const timer = window.setTimeout(next, step.ms ?? 1500);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);

  useEffect(() => {
    onView(anim ?? step?.view ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, anim]);

  // Steps that wait on the player move on when the match shows it happened.
  useEffect(() => {
    if (!step) return;
    const you = duel.players[viewer];
    if (step.wait === "hand-spell" && hand === "spell") next();
    if (step.wait === "draw" && you.draws > start.current.draws) next();
    if (step.wait === "summon" && you.field.filter(Boolean).length > start.current.field) next();
  }, [duel, hand, step, viewer]);

  // Follow the rings as the board moves (hand scroll, resize, cards arriving).
  useLayoutEffect(() => {
    if (!step) return;
    let frame = 0;
    let last: Box[] = [];
    let lastHoles: Box[] = [];
    const tick = () => {
      // The line steps aside while a card the step allows (its Triệu hồi panel) is open, so it never covers it.
      setAside(Boolean(step.allow?.some((sel) => document.querySelector(sel))));
      const now = measure(step.focus);
      if (!same(now, last)) {
        last = now;
        setBoxes(now);
      }
      const open = measure((step.allow ?? []).filter((sel) => sel !== ".inspect-dismiss").map((sel) => ({ sel })));
      if (!same(open, lastHoles)) {
        lastHoles = open;
        setHoles(open);
      }
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  // Only the tutorial's own buttons, and on action steps the focused parts, take touches.
  useEffect(() => {
    if (!step) return;
    const acting = step.wait !== "ok" && step.wait !== "auto";
    const open = [".tut-ui", ...(acting ? [...step.focus.map((item) => item.sel), ...(step.allow ?? [])] : [])].join(", ");
    const guard = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(open)) return;
      event.stopPropagation();
      event.preventDefault();
    };
    const kinds = ["pointerdown", "pointerup", "click", "touchstart"] as const;
    for (const kind of kinds) window.addEventListener(kind, guard, { capture: true, passive: false });
    return () => {
      for (const kind of kinds) window.removeEventListener(kind, guard, { capture: true });
    };
  }, [step]);

  if (!step) return null;

  const popBox = pop ? measure([{ sel: `[data-tut="${pop.key}"]` }])[0] : undefined;
  const lowest = boxes.reduce((y, box) => Math.min(y, box.top), Infinity);
  const highest = boxes.reduce((y, box) => Math.max(y, box.top + box.height), -Infinity);
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const above = boxes.length === 0 ? null : lowest > 170 ? vh - lowest + 14 : null;
  const bubbleStyle = boxes.length === 0 ? { top: "40%" } : above !== null ? { bottom: `${above}px` } : { top: `${Math.min(vh - 170, highest + 14)}px` };

  return (
    <div className="tut-layer">
      <svg className="tut-dim" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id="tut-hole">
            <rect width="100%" height="100%" fill="#fff" />
            {[...boxes, ...holes].map((box, i) => (
              <rect key={i} x={box.left} y={box.top} width={box.width} height={box.height} rx={12} fill="#000" />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.62)" mask="url(#tut-hole)" />
      </svg>
      {boxes.map((box, i) => (
        <div key={i} className="tut-ring" style={{ left: box.left, top: box.top, width: box.width, height: box.height }} />
      ))}
      {pop && popBox ? (
        <div key={pop.n} className="tut-pop" style={{ left: popBox.left + popBox.width / 2, top: popBox.top + popBox.height / 2 }}>
          <i />
          <b>+1</b>
        </div>
      ) : null}
      {step.ribbon ? (
        <div className="tut-ribbon">
          <span>{step.ribbon}</span>
        </div>
      ) : null}
      {step.text && !aside ? (
        <div className="tut-bubble tut-ui" style={bubbleStyle}>
          {step.text.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {step.wait === "ok" ? (
            <button type="button" className="act press tut-ok" data-ui="confirm" onClick={next}>
              OK
            </button>
          ) : null}
        </div>
      ) : null}
      <button type="button" className="tut-skip tut-ui press" data-ui="soft" onClick={onSkip}>
        ✕ Bỏ qua
      </button>
    </div>
  );
}
