import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Lá trang bị nhập vào quái (chủ game 16/11, theo video `ca2c63d5`, chỉ học nhịp; mốc đo từ giây 1,15 của video):
 * 0–210 ms lá phép bay từ tay ra bên phải và lật mặt, lá quái được bốc khỏi ô lên bên trái; 210–470 lá phép trượt ngang,
 * thu nhỏ, chui vào lá quái; 620–800 hai đốm trắng ở chân lá; 790–900 lá chớp trắng; 840–1010 tia nổ (màu `tone`);
 * 950–1040 lá xoay cạnh rồi hiện to; 1040–1230 số công chạy từ `atkFrom` lên `atkTo` và đổi sang màu công phép;
 * đứng tới 1400 rồi xoay thu về ô (1500). Âm của video chạy cùng mốc 0 nên các mốc này không tự ý đổi.
 * Lá quái là bản sao của chính ô trên sân (dựng ở cỡ lớn rồi thu nhỏ, nên lúc phóng to không nhoè).
 */
export const EQUIP_MS = 1500;
const T = { in: 210, merged: 470, spark: 620, flash: 790, burst: 840, turn: 950, edge: 992, big: 1040, counted: 1230, back: 1400, backEdge: 1448 };
/** Width of the big card, of the board's width; the centre of the two cards on the stage, in parts of the board. */
const BIG_W = 0.46;
const STAGE = { left: { x: 0.3, y: 0.5 }, right: { x: 0.7, y: 0.5 }, drift: { x: 0.27, y: 0.475 }, big: { x: 0.29, y: 0.49 } };
const STAGE_GROW = 1.18;

export function EquipShow({
  slot,
  from,
  tone,
  atkFrom,
  atkTo,
  fromBlue = false,
  onEnd,
  children,
}: {
  /** `data-slot` of the monster's place on the field. */
  slot: string;
  /** Whose hand the card leaves: the viewer's strip at the bottom, or the opponent's fan at the top. */
  from: "hand" | "foe";
  tone: string;
  atkFrom: number;
  atkTo: number;
  /** The attack already stood buffed (blue) before the card went in. */
  fromBlue?: boolean;
  onEnd: () => void;
  /** The face of the equip card. */
  children: ReactNode;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const mon = useRef<HTMLDivElement>(null);
  const gear = useRef<HTMLDivElement>(null);
  const end = useRef(onEnd);
  end.current = onEnd;
  useLayoutEffect(() => {
    const root = layer.current;
    const monEl = mon.current;
    const gearEl = gear.current;
    const seat = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    if (!root || !monEl || !gearEl || !seat || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      end.current();
      return;
    }
    const board = root.getBoundingClientRect();
    const box = seat.getBoundingClientRect();
    const W = board.width;
    const H = board.height;
    const home = { x: box.left - board.left + box.width / 2, y: box.top - board.top + box.height / 2 };
    const bigW = W * BIG_W;
    const bigH = (bigW * box.height) / box.width;
    const s0 = box.width / bigW;
    const s1 = s0 * STAGE_GROW;

    // The monster: a copy of its slot, built at the big size.
    const copy = seat.cloneNode(true) as HTMLElement;
    for (const name of ["data-slot", "data-uid", "data-owner", "data-index", "data-empty", "aria-label"]) copy.removeAttribute(name);
    copy.className = "slot equip-copy";
    copy.removeAttribute("style");
    monEl.prepend(copy);
    monEl.style.width = `${bigW}px`;
    monEl.style.height = `${bigH}px`;
    const figure = copy.querySelector<HTMLElement>(".fstat.is-atk");
    if (figure) {
      figure.textContent = String(atkFrom);
      figure.classList.remove("is-spellatk");
      if (!fromBlue) figure.classList.remove("is-blue");
    }
    const place = (p: { x: number; y: number }, scale: number, turn = 0) =>
      `translate(${p.x - bigW / 2}px, ${p.y - bigH / 2}px) perspective(900px) rotateY(${turn}deg) scale(${scale})`;
    const px = (p: { x: number; y: number }) => ({ x: p.x * W, y: p.y * H });
    const left = px(STAGE.left);
    const drift = px(STAGE.drift);
    const big = px(STAGE.big);
    const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const at = (ms: number) => ms / EQUIP_MS;
    const runs: Animation[] = [];
    runs.push(
      monEl.animate(
        [
          { offset: 0, transform: place(home, s0), easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" },
          { offset: at(T.in), transform: place(left, s1), easing: "ease-in-out" },
          { offset: at(T.merged), transform: place(drift, s1), easing: "linear" },
          { offset: at(T.turn), transform: place(drift, s1), easing: "ease-in" },
          { offset: at(T.edge), transform: place(mid(drift, big), (s1 + 1) / 2, 88), easing: "ease-out" },
          { offset: at(T.big), transform: place(big, 1), easing: "linear" },
          { offset: at(T.back), transform: place(big, 1), easing: "ease-in" },
          { offset: at(T.backEdge), transform: place(mid(big, home), (s0 + 1) / 2, -88), easing: "ease-out" },
          { offset: 1, transform: place(home, s0) },
        ],
        { duration: EQUIP_MS, fill: "both" },
      ),
    );

    // The equip card: out of the hand to the right, then across into the monster.
    const gearW = box.width * STAGE_GROW;
    const gearH = gearW * (3.05 / 2);
    gearEl.style.width = `${gearW}px`;
    gearEl.style.height = `${gearH}px`;
    const hand = document.querySelector<HTMLElement>(from === "hand" ? ".hand" : ".foe-fan")?.getBoundingClientRect();
    const start = hand
      ? { x: hand.left - board.left + hand.width / 2, y: hand.top - board.top + hand.height / 2 }
      : { x: W / 2, y: from === "hand" ? H : 0 };
    const right = px(STAGE.right);
    const put = (p: { x: number; y: number }, scale: number, turn = 0) =>
      `translate(${p.x - gearW / 2}px, ${p.y - gearH / 2}px) perspective(900px) rotateY(${turn}deg) scale(${scale})`;
    runs.push(
      gearEl.animate(
        [
          { offset: 0, transform: put(start, 0.7, 90), opacity: 0.2, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" },
          { offset: at(T.in * 0.45), opacity: 1 },
          { offset: at(T.in), transform: put(right, 1, 0), opacity: 1, easing: "cubic-bezier(0.5, 0, 0.85, 0.6)" },
          { offset: at(T.merged - 50), transform: put({ x: drift.x + gearW * 0.25, y: drift.y }, 0.3), opacity: 1, easing: "linear" },
          { offset: at(T.merged), transform: put(drift, 0.08), opacity: 0 },
          { offset: 1, transform: put(drift, 0.08), opacity: 0 },
        ],
        { duration: EQUIP_MS, fill: "both" },
      ),
    );

    // Light on the monster: sparks at its feet, the white flash, the burst of rays.
    const part = (name: string) => monEl.querySelector<HTMLElement>(name);
    const keyed = (el: HTMLElement | null, frames: Keyframe[]) => {
      if (el) runs.push(el.animate(frames, { duration: EQUIP_MS, fill: "both" }));
    };
    for (const spark of monEl.querySelectorAll<HTMLElement>(".equip-spark")) {
      keyed(spark, [
        { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" },
        { offset: at(T.spark), opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" },
        { offset: at(T.spark + 60), opacity: 1, transform: "translate(-50%, -50%) scale(0.7)" },
        { offset: at(T.flash), opacity: 1, transform: "translate(-50%, -50%) scale(1.5)" },
        { offset: at(T.flash + 90), opacity: 0, transform: "translate(-50%, -50%) scale(2.4)" },
        { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(2.4)" },
      ]);
    }
    keyed(part(".equip-white"), [
      { offset: 0, opacity: 0 },
      { offset: at(T.flash - 30), opacity: 0 },
      { offset: at(T.flash + 40), opacity: 1 },
      { offset: at(T.flash + 80), opacity: 0.95 },
      { offset: at(T.turn), opacity: 0.35 },
      { offset: at(T.big), opacity: 0 },
      { offset: 1, opacity: 0 },
    ]);
    keyed(part(".equip-burst"), [
      { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.25) rotate(0deg)" },
      { offset: at(T.burst - 20), opacity: 0, transform: "translate(-50%, -50%) scale(0.25) rotate(0deg)" },
      { offset: at(T.burst + 50), opacity: 1, transform: "translate(-50%, -50%) scale(0.75) rotate(8deg)" },
      { offset: at(T.burst + 170), opacity: 0.85, transform: "translate(-50%, -50%) scale(1.1) rotate(16deg)" },
      { offset: at(T.big), opacity: 0, transform: "translate(-50%, -50%) scale(1.25) rotate(20deg)" },
      { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(1.25) rotate(20deg)" },
    ]);
    keyed(part(".equip-halo"), [
      { offset: 0, opacity: 0 },
      { offset: at(T.big - 20), opacity: 0 },
      { offset: at(T.big + 40), opacity: 1 },
      { offset: at(T.back), opacity: 0.8 },
      { offset: at(T.backEdge), opacity: 0 },
      { offset: 1, opacity: 0 },
    ]);

    // The attack climbs on the big card, in the colour of a magic attack.
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = now - began;
      if (figure && t >= T.big) {
        const k = Math.min(1, (t - T.big) / (T.counted - T.big));
        figure.textContent = String(Math.round(atkFrom + (atkTo - atkFrom) * k));
        if (!figure.classList.contains("is-spellatk")) {
          figure.classList.remove("is-blue");
          figure.classList.add("is-spellatk", "is-climbing");
        }
        if (k >= 1) {
          figure.classList.remove("is-climbing");
          figure.classList.add("is-landed");
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const done = window.setTimeout(() => end.current(), EQUIP_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
      for (const run of runs) run.cancel();
      copy.remove();
    };
  }, [slot, from, atkFrom, atkTo, fromBlue]);
  return (
    <div className="equip-layer" ref={layer} style={{ "--equip": tone } as React.CSSProperties} aria-hidden="true">
      <div className="equip-mon" ref={mon}>
        <span className="equip-burst" />
        <span className="equip-halo" />
        <span className="equip-white" />
        <i className="equip-spark is-l" />
        <i className="equip-spark is-r" />
      </div>
      <div className="equip-gear" ref={gear}>
        {children}
      </div>
    </div>
  );
}
