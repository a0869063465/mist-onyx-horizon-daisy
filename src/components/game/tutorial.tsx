import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { castSpell, draw, endTurn, passResponse, summon, type Duel, type Side } from "@/lib/duel";
import { artSrc, monsterCard } from "@/lib/catalog";
import { playCue } from "@/lib/sfx";
import { chainOnTop } from "@/lib/tutorial";

/** Numbers the tutorial shows on the board instead of the live ones, so each beat of the script reads right. */
export type TutView = { youOrb?: number; foeOrb?: number; youGems?: number; youStars?: number; show?: string[] };

export const GUIDE_ART = "/tutorial/nguoi-giu-khoa.webp";

/** min: smallest ring side, as a share of the board width. left: extra room on the left (the star icon sits left of its number). */
type Focus = { sel: string; min?: number; left?: number };
type Wait =
  | "ok"
  | "auto"
  /** Hand flipped once / twice more with the pile. */
  | "toggle"
  | "toggles"
  | "draw"
  | "summon"
  | "end"
  /** Opponent's scripted turn up to Sợi xích địa ngục waiting for an answer. */
  | "foe-cast"
  /** The player answered with Hấp thụ ma pháp. */
  | "absorb"
  | "foe-end"
  /** The player's Sợi xích địa ngục landed on the opponent's monster. */
  | "chain";
type Step = {
  id?: string;
  text?: string;
  focus: Focus[];
  wait: Wait;
  ms?: number;
  ribbon?: string;
  view?: TutView;
  /** Clickable besides the focused parts while the step waits for the player. */
  allow?: string[];
  hand?: "reserve" | "spell";
  pop?: string[];
  /** "grave": mộ mana empties into a star. "drag": a card slides from the hand to the field and back. */
  anim?: "grave" | "drag";
  /** Greeting lines: the guide stands large in the middle. */
  big?: boolean;
  /** Board left undimmed (the opponent's scripted moves). */
  clear?: boolean;
  /** A summon during this step jumps here. */
  summoned?: string;
  /** Sợi xích địa ngục goes on top of the player's spell pile first. */
  stack?: boolean;
};

const ORB: Focus = { sel: '[data-tut="youOrb"]', min: 0.2 };
const FOE_ORB: Focus = { sel: '[data-tut="foeOrb"]', min: 0.2 };
const GEMS: Focus = { sel: '[data-tut="youGems"]', min: 0.09 };
const STARS: Focus = { sel: '[data-tut="youStars"]', min: 0.09, left: 0.05 };
const MONSTERS: Focus = { sel: ".hand .hand-card.is-monster" };
const ONE_STAR: Focus = { sel: '.hand .hand-card.is-monster[data-stars="1"]' };
const HAND: Focus = { sel: ".hand .hand-card" };
const PILE: Focus = { sel: ".face-pile" };
const OPENING = { youOrb: 1, foeOrb: 1 };

function steps(viewer: Side): Step[] {
  const foe = viewer === 0 ? 1 : 0;
  const slots: Focus = { sel: `[data-slot][data-owner="${viewer}"][data-empty="1"]` };
  const ownMon: Focus = { sel: `[data-slot][data-owner="${viewer}"][data-empty="0"]` };
  const foeMon: Focus = { sel: `[data-slot][data-owner="${foe}"][data-empty="0"]` };
  return [
    { text: "Chào mừng đã đến với thế giới bài triệu hồi và ma pháp của vùng đất **Clash of the Beasts**.", focus: [], wait: "ok", big: true, view: OPENING, hand: "reserve" },
    { text: "Tôi là **Người giữ khoá**, từ giờ tôi là người hướng dẫn của bạn.", focus: [], wait: "ok", big: true, view: OPENING },
    { focus: [], wait: "auto", ms: 1900, ribbon: "Trận đấu bắt đầu", view: OPENING },
    { text: "Đầu trận đấu, mỗi người chơi được nhận miễn phí 1 năng lượng, tích trong **Quả Cầu Ma Pháp**.", focus: [ORB], wait: "ok", view: OPENING },
    { text: "Cùng 2 lá bài **Quái Thú**..", focus: [MONSTERS], wait: "ok", view: OPENING, hand: "reserve" },
    { text: "Và 1 lá **Ma Pháp**.", focus: [{ sel: ".hand .hand-card.is-spell" }], wait: "ok", view: OPENING, hand: "spell" },
    { text: "Hãy bấm vào xấp bài bên dưới để đổi loại bài trên tay.", focus: [PILE, HAND], wait: "toggle", view: OPENING },
    { text: "Hãy thử bấm như thế vài lần nữa.", focus: [PILE, HAND], wait: "toggles", view: OPENING },
    {
      text: "Hãy nhìn vào số nhỏ trên góc xấp bài này, đây là số **Ma Pháp** hoặc **Quái Thú** trên tay còn lại của bạn.",
      focus: [{ sel: ".face-pile b", min: 0.12 }],
      wait: "ok",
      view: OPENING,
    },
    {
      text: "Tương tự bạn cũng có thể nhìn được số lượng **Ma Pháp** và **Quái Thú** của đối phương.",
      focus: [{ sel: '[data-tut="foeHand"]', min: 0.1 }, { sel: '[data-tut="foeReserve"]', min: 0.1 }],
      wait: "ok",
      view: OPENING,
    },
    { focus: [], wait: "auto", ms: 1900, ribbon: "Bắt đầu lượt", view: OPENING, hand: "reserve" },
    { text: "Mỗi người chơi sẽ nhận được 1 năng lượng ở đầu lượt đấu. Kể cả lượt đấu của đối phương.", focus: [ORB, FOE_ORB], wait: "ok", pop: ["youOrb", "foeOrb"] },
    { text: "Đây là **Mộ Mana**. Mọi thao tác của bạn, đều có thể tiêu hao năng lượng.", focus: [GEMS], wait: "ok", view: { show: ["youGems"] } },
    {
      text: "1. Thao tác **Rút bài**\n2. **Triệu hồi** (khoảng 50% trường hợp)\n3. Sử dụng **Kỹ năng quái thú** (khoảng 90% trường hợp)\n4. **Ma pháp** (khoảng 30% trường hợp)",
      focus: [GEMS],
      wait: "ok",
      view: { show: ["youGems"] },
    },
    { text: "Hãy rút 1 lá bài.", focus: [{ sel: ".actions .act.is-draw-mon" }, { sel: ".actions .act.is-draw-spell" }], wait: "draw", view: { show: ["youGems"] } },
    { text: "Bạn có thể thấy, Mana tiêu hao cho rút bài sẽ chuyển vào **Mộ mana**.", focus: [GEMS], wait: "ok", view: { youGems: 1, youStars: 0, show: ["youGems"] }, pop: ["youGems"], hand: "reserve" },
    {
      text: "Khi đủ lượng mana nhất định. **Mộ mana** sẽ hiến tế lượng mana đó. Để nâng cấp **Sao**.",
      focus: [GEMS, STARS],
      wait: "ok",
      view: { youGems: 1, youStars: 0, show: ["youGems"] },
      anim: "grave",
    },
    { text: "Bạn đã đủ **Sao hiến tế** để triệu hồi **Quái thú 1 sao**. Hãy triệu hồi.", focus: [STARS, ONE_STAR], wait: "ok", hand: "reserve" },
    // The demo replays until the player drags a monster onto the field.
    { text: "Hãy kéo và thả Quái thú lên sân.", focus: [ONE_STAR, slots], wait: "summon", anim: "drag", allow: [".inspect-card", ".inspect-dismiss"], hand: "reserve" },
    // Already summoned this turn, so tapping is shown, not done.
    { text: "Hoặc nhấp vào quái thú, và bấm **Triệu Hồi**.", focus: [ONE_STAR], wait: "ok", hand: "reserve" },
    { text: "Người chơi ở lượt đi đầu tiên sẽ không thể tấn công đối phương.", focus: [ownMon], wait: "ok" },
    { text: "Hãy bấm vào **Kết thúc lượt**.", focus: [{ sel: ".actions .act.is-end" }], wait: "end" },
    { focus: [], wait: "auto", ms: 1900, ribbon: "Lượt đối thủ" },
    { focus: [], wait: "foe-cast", clear: true },
    {
      text: "Khi người chơi dùng ma pháp hoặc dùng quái thú **Tấn Công** vào đối phương. **Thanh phản ứng** sẽ hiện ra, cho phép người chơi còn lại ứng phó với nước đi đó.",
      focus: [{ sel: ".banner.is-react" }],
      wait: "ok",
    },
    { text: "Đối phương đang sử dụng **Sợi xích địa ngục** nhắm vào quái thú của bạn.", focus: [ownMon, { sel: "p.banner" }], wait: "ok" },
    {
      text: "Những phép có thể sử dụng để ứng phó nhấp nháy, có nút **Use** là có thể sử dụng được. Hãy thử bấm.",
      focus: [{ sel: ".hand .hand-spell.is-use" }],
      wait: "absorb",
      hand: "spell",
    },
    { text: "**Hấp thụ ma pháp** đã hấp thu hoàn toàn phép của đối thủ.", focus: [], wait: "ok" },
    { focus: [], wait: "foe-end" },
    { text: "Hãy rút 1 lá bài **Phép**.", focus: [{ sel: ".actions .act.is-draw-spell" }], wait: "draw", stack: true },
    {
      text: "Bạn đã rút được **Sợi xích địa ngục**. Hãy thử dùng nó.",
      focus: [{ sel: ".hand .hand-card.is-spell, .hand .hand-spell" }, foeMon],
      wait: "chain",
      allow: [".hand", ".inspect-card", ".inspect-dismiss", ".overlay", ".ask-card", "[data-slot]"],
      hand: "spell",
    },
    { text: "Tốt lắm. Chúc mừng bạn đã hoàn thành phần hướng dẫn cơ bản dành cho **Triệu hồi sư tập sự**.", focus: [], wait: "ok", big: true },
    { text: "Có thể chúng ta sẽ còn gặp lại nhau đấy.\nTạm biệt.", focus: [], wait: "ok", big: true },
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
      const extra = item.left && board ? board.width * item.left : 0;
      const width = Math.max(r.width + 12, side) + extra;
      const height = Math.max(r.height + 12, side);
      // Keep the ring on screen when the part sits at the very edge.
      const left = Math.max(2, Math.min(window.innerWidth - width - 2, r.left + r.width / 2 - (width - extra) / 2 - extra));
      const top = Math.max(2, Math.min(window.innerHeight - height - 2, r.top + r.height / 2 - height / 2));
      boxes.push({ left, top, width, height });
    }
  }
  return boxes;
}

function same(a: Box[], b: Box[]) {
  return a.length === b.length && a.every((box, i) => Math.abs(box.left - b[i].left) < 0.5 && Math.abs(box.top - b[i].top) < 0.5 && Math.abs(box.width - b[i].width) < 0.5 && Math.abs(box.height - b[i].height) < 0.5);
}

/** **word** shows in gold. */
function Line({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <p>
      {parts.map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </p>
  );
}

const GUIDE_W = 300;

/** Where the guide (mascot and line) stands: beside the rings, never on them, always on screen. */
function guideSpot(boxes: Box[], big: boolean): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(vw - 16, GUIDE_W);
  if (big || boxes.length === 0) return { left: (vw - width) / 2, width, top: vh * 0.3 };
  const top = Math.min(...boxes.map((box) => box.top));
  const bottom = Math.max(...boxes.map((box) => box.top + box.height));
  const cx = (Math.min(...boxes.map((box) => box.left)) + Math.max(...boxes.map((box) => box.left + box.width))) / 2;
  const left = Math.max(8, Math.min(vw - width - 8, cx - width / 2));
  const roomBelow = vh - bottom;
  if (top > roomBelow && top > 130) return { left, width, bottom: vh - top + 10 };
  if (roomBelow > 130) return { left, width, top: bottom + 10 };
  return { left, width, top: 64 };
}

/**
 * Guided first turns: the guide (Người giữ khoá) speaks one line at a time, the board dims except the parts
 * that line is about, and only what the line asks for can be pressed. "Bỏ qua" is always there.
 */
export function Tutorial({
  duel,
  viewer,
  hand,
  setHand,
  onView,
  drive,
  onSkip,
  onDone,
}: {
  duel: Duel;
  viewer: Side;
  hand: "reserve" | "spell";
  setHand: (hand: "reserve" | "spell") => void;
  onView: (view: TutView | null) => void;
  /** Plays a scripted move for the opponent on the live match. */
  drive: (run: (current: Duel) => Duel) => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const list = useRef(steps(viewer)).current;
  const foe = (viewer === 0 ? 1 : 0) as Side;
  const [at, setAt] = useState(0);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [holes, setHoles] = useState<Box[]>([]);
  const [anim, setAnim] = useState<TutView | null>(null);
  const [pops, setPops] = useState<{ keys: string[]; n: number } | null>(null);
  const [aside, setAside] = useState(false);
  const [ghost, setGhost] = useState<{ from: Box; to: Box; src: string; n: number } | null>(null);
  const entry = useRef({ hand, flips: 0, draws: 0, field: 0, foeField: 0 });
  const step = list[at] as Step | undefined;

  const next = () => setAt((now) => now + 1);
  const jump = (id: string) => setAt(Math.max(0, list.findIndex((item) => item.id === id)));

  // Enter a step: remember where things stood, set the numbers, the hand side, pops and animations.
  useEffect(() => {
    if (!step) {
      onView(null);
      onDone();
      return;
    }
    const you = duel.players[viewer];
    entry.current = { hand: step.hand ?? hand, flips: 0, draws: you.draws, field: you.field.filter(Boolean).length, foeField: duel.players[foe].field.filter(Boolean).length };
    if (step.hand) setHand(step.hand);
    setAnim(null);
    setGhost(null);
    const timers: number[] = [];
    const later = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
    if (step.pop) {
      setPops({ keys: step.pop, n: Date.now() });
      playCue("star");
    }
    if (step.anim === "grave") {
      // Mộ mana empties into the star, slowly.
      later(900, () => setAnim({ ...step.view, youGems: 0, youStars: 0 }));
      later(1600, () => {
        setAnim({ show: ["youGems"], youGems: 0 });
        setPops({ keys: ["youStars"], n: Date.now() });
        playCue("star");
      });
    }
    if (step.anim === "drag") {
      // Shows the move, then hands over: the demo replays every few seconds until the player does it.
      const show = () => {
        const card = document.querySelector('.hand .hand-card.is-monster[data-stars="1"]') as HTMLElement | null;
        const slot = document.querySelector(`[data-slot][data-owner="${viewer}"][data-empty="1"]`);
        const held = duel.players[viewer].reserve[Number(card?.dataset.reserve ?? -1)];
        if (!card || !slot || !held) return;
        const a = card.getBoundingClientRect();
        const b = slot.getBoundingClientRect();
        setGhost({ from: { left: a.left, top: a.top, width: a.width, height: a.height }, to: { left: b.left, top: b.top, width: b.width, height: b.height }, src: artSrc(held.id), n: Date.now() });
      };
      later(350, show);
      const again = window.setInterval(show, 4200);
      timers.push(again);
    }
    if (step.wait === "auto" || (step.wait === "summon" && step.ms)) later(step.ms ?? 1500, next);
    if (step.wait === "foe-cast") {
      // Đối thủ rút bài, triệu hồi quái 1 sao, rồi dùng Sợi xích địa ngục lên quái của bạn.
      later(900, () => drive((d) => (d.turn === foe && d.step === "main" ? draw(d, "monster") : d)));
      later(2300, () =>
        drive((d) => {
          const them = d.players[foe];
          const last = them.reserve.length - 1;
          const index = (monsterCard(them.reserve[last]?.id ?? "")?.stars ?? 9) <= 1 ? last : them.reserve.findIndex((held) => (monsterCard(held.id)?.stars ?? 9) <= 1);
          const slot = them.field.findIndex((mon) => !mon);
          return d.turn === foe && d.step === "main" && index >= 0 && slot >= 0 ? summon(d, index, slot as 0 | 1 | 2) : d;
        }),
      );
      later(3900, () =>
        drive((d) => {
          const index = d.players[foe].hand.indexOf("soi-xich-dia-nguc");
          const aim = d.players[viewer].field.find(Boolean)?.uid ?? null;
          return d.turn === foe && d.step === "main" && index >= 0 && aim ? castSpell(d, index, aim) : d;
        }),
      );
    }
    if (step.stack) drive((d) => chainOnTop(d, viewer));
    if (step.wait === "foe-end") later(1100, () => drive((d) => (d.turn === foe && d.step === "main" ? endTurn(d) : d)));
    return () => timers.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);

  useEffect(() => {
    onView(anim ?? step?.view ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, anim]);

  // Steps that wait on the player (or the scripted opponent) move on when the match shows it happened.
  useEffect(() => {
    if (!step) return;
    const you = duel.players[viewer];
    const seen = entry.current;
    if (hand !== seen.hand) {
      seen.hand = hand;
      seen.flips += 1;
    }
    let timer = 0;
    const soon = (run: () => void, ms = 450) => {
      timer = window.setTimeout(run, ms);
    };
    if (step.wait === "toggle" && seen.flips >= 1) soon(next);
    if (step.wait === "toggles" && seen.flips >= 2) soon(next, 600);
    if (step.wait === "draw" && you.draws > seen.draws) soon(next, 300);
    if (step.wait === "summon" && you.field.filter(Boolean).length > seen.field) soon(() => (step.summoned ? jump(step.summoned) : next()), 700);
    if (step.wait === "end" && duel.turn !== viewer) next();
    if (step.wait === "foe-cast" && duel.step === "respond" && duel.hold?.priority === viewer) soon(next, 700);
    if (step.wait === "absorb" && duel.step === "main" && !duel.pending && !you.hand.includes("hap-thu-ma-phap")) soon(next, 900);
    if (step.wait === "foe-end" && duel.turn === viewer && duel.step === "main") soon(next, 600);
    if (step.wait === "chain") {
      // The opponent lets the chain through.
      if (duel.step === "respond" && duel.hold?.priority === foe) soon(() => drive((d) => (d.step === "respond" && d.hold?.priority === foe ? passResponse(d) : d)), 900);
      else if (duel.players[foe].field.some((mon) => mon && (mon.chain ?? 0) > 0)) soon(next, 2000);
    }
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duel, hand, step, viewer]);

  // Follow the rings as the board moves (hand scroll, resize, cards arriving).
  useLayoutEffect(() => {
    if (!step) return;
    let frame = 0;
    let last: Box[] = [];
    let lastHoles: Box[] = [];
    const tick = () => {
      // The line steps aside while a card panel the step allows is open, so it never covers it.
      setAside(Boolean(document.querySelector(".inspect-card")) && Boolean(step.allow?.includes(".inspect-card")));
      const now = measure(step.focus);
      if (!same(now, last)) {
        last = now;
        setBoxes(now);
      }
      const open = measure((step.allow ?? []).filter((sel) => sel === ".inspect-card" || sel === ".overlay" || sel === ".ask-card").map((sel) => ({ sel })));
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
    const acting = step.wait === "toggle" || step.wait === "toggles" || step.wait === "draw" || step.wait === "summon" || step.wait === "end" || step.wait === "absorb" || step.wait === "chain";
    const open = [".tut-ui", ...(acting ? [...step.focus.map((item) => item.sel), ...(step.allow ?? [])] : [])].join(", ");
    // A click follows its press: after an allowed press (a drag that ends elsewhere) the click must reach the
    // game too, or the game waits for it and drops the next tap.
    let pressBlocked = false;
    const guard = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      const inside = Boolean(target?.closest(open));
      if (event.type === "pointerdown" || event.type === "touchstart") pressBlocked = !inside;
      if (inside || ((event.type === "click" || event.type === "pointerup") && !pressBlocked)) return;
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

  const popAt = pops ? pops.keys.map((key) => ({ key, box: measure([{ sel: `[data-tut="${key}"]` }])[0] })) : [];
  const speaking = Boolean(step.text) && !aside;
  let say: ReactNode = null;
  if (speaking && step.text) {
    say = (
      <div className={`tut-guide tut-ui${step.big ? " is-big" : ""}`} style={guideSpot(boxes, Boolean(step.big))} key={at}>
        <img className="tut-mascot" src={GUIDE_ART} alt="Người giữ khoá" draggable={false} />
        <div className="tut-bubble">
          {step.text.split("\n").map((line, i) => (
            <Line key={i} text={line} />
          ))}
          {step.wait === "ok" ? (
            <button type="button" className="tut-next press" data-ui="confirm" aria-label="Tiếp" onClick={next}>
              <span>»</span>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="tut-layer">
      {step.clear ? null : (
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
      )}
      {boxes.map((box, i) => (
        <div key={i} className="tut-ring" style={{ left: box.left, top: box.top, width: box.width, height: box.height }} />
      ))}
      {popAt.map(({ key, box }) =>
        box ? (
          <div key={`${key}-${pops?.n}`} className="tut-pop" style={{ left: box.left + box.width / 2, top: box.top + box.height / 2 }}>
            <i />
            <b>+1</b>
          </div>
        ) : null,
      )}
      {ghost ? (
        <div
          key={ghost.n}
          className="tut-ghost"
          style={
            {
              left: ghost.from.left,
              top: ghost.from.top,
              width: ghost.from.width,
              height: ghost.from.height,
              "--dx": `${ghost.to.left + ghost.to.width / 2 - (ghost.from.left + ghost.from.width / 2)}px`,
              "--dy": `${ghost.to.top + ghost.to.height / 2 - (ghost.from.top + ghost.from.height / 2)}px`,
            } as CSSProperties
          }
        >
          <img src={ghost.src} alt="" draggable={false} />
          <i className="tut-finger" />
        </div>
      ) : null}
      {step.ribbon ? (
        <div className="tut-ribbon">
          <span>{step.ribbon}</span>
        </div>
      ) : null}
      {say}
      <button type="button" className="tut-skip tut-ui press" data-ui="soft" onClick={onSkip}>
        ✕ Bỏ qua
      </button>
    </div>
  );
}
