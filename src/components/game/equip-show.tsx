import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Lá trang bị nhập vào quái (chủ game 16/11, theo video `ca2c63d5`, chỉ học nhịp; mốc đo từ giây 1,15 của video):
 * 0–210 ms lá phép bay từ tay ra bên phải và lật mặt, lá quái được bốc khỏi ô lên bên trái; 210–470 lá phép trượt ngang,
 * thu nhỏ, chui vào lá quái; 620–800 hai đốm trắng ở chân lá; 790–900 lá chớp trắng; 840–1010 tia nổ (màu `tone`);
 * 950–1040 lá xoay cạnh rồi hiện to; 1040–1230 số công chạy từ `atkFrom` lên `atkTo` và đổi sang màu công phép;
 * đứng tới 1400 rồi xoay thu về ô (1500). Âm của video chạy cùng mốc 0 nên các mốc này không tự ý đổi.
 * Lá quái là bản sao của chính ô trên sân (dựng ở cỡ lớn rồi thu nhỏ, nên lúc phóng to không nhoè).
 */
/** Video chủ game vốn đã tua nhanh (16/11): mọi mốc nhân hệ số này cho bằng nhịp thật. Muốn nhanh hay chậm hơn chỉ đổi số này
 *  (âm `equip-merge.mp3` được kéo dài 2 lần theo, đổi hệ số thì làm lại âm). */
export const EQUIP_SLOW = 2;
const K = EQUIP_SLOW;
export const EQUIP_MS = 1600 * K;
const T = { merged: 520 * K, spark: 620 * K, flash: 790 * K, burst: 840 * K, turn: 950 * K, edge: 992 * K, big: 1040 * K, counted: 1230 * K, back: 1400 * K, backEdge: 1448 * K };
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
    type Pose = { x: number; y: number; s: number; rz?: number; ry?: number; o?: number };
    const ease = {
      out: (u: number) => 1 - (1 - u) ** 3,
      inOut: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
      in: (u: number) => u * u * u,
      // Vượt nhẹ rồi về: lá đặt xuống / nhấc lên có đà, không dừng cứng.
      back: (u: number) => 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2,
    };
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    // Chuyển động tự nhiên (chủ game 17/11): mỗi đoạn là một đường cong lấy mẫu dày (cung nhô lên, nghiêng nhẹ, vượt rồi về), không đi
    // thẳng một mạch; đoạn nghỉ giữ nguyên tư thế.
    const track = (w: number, h: number) => {
      const out: Keyframe[] = [];
      const tf = (q: Pose) => `translate(${q.x - w / 2}px, ${q.y - h / 2}px) perspective(900px) rotateY(${q.ry ?? 0}deg) rotateZ(${q.rz ?? 0}deg) scale(${q.s})`;
      const push = (t: number, q: Pose) => out.push({ offset: Math.min(1, t / EQUIP_MS), transform: tf(q), opacity: q.o ?? 1 });
      const tween = (t0: number, t1: number, a: Pose, b: Pose, move = ease.inOut, lift = 0, grow = move, steps = 14) => {
        for (let i = 0; i <= steps; i += 1) {
          const u = i / steps;
          const k = move(u);
          push(lerp(t0, t1, u), {
            x: lerp(a.x, b.x, k),
            y: lerp(a.y, b.y, k) - Math.sin(Math.PI * k) * lift * H,
            s: lerp(a.s, b.s, grow(u)),
            rz: lerp(a.rz ?? 0, b.rz ?? 0, k),
            ry: lerp(a.ry ?? 0, b.ry ?? 0, k),
            o: lerp(a.o ?? 1, b.o ?? 1, k),
          });
        }
      };
      return { out, tween, push };
    };
    const px = (q: { x: number; y: number }) => ({ x: q.x * W, y: q.y * H });
    const left = px(STAGE.left);
    const drift = px(STAGE.drift);
    const big = px(STAGE.big);
    const right = px(STAGE.right);
    const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const at = (ms: number) => ms / EQUIP_MS;
    const runs: Animation[] = [];

    // Lá quái: ấn xuống chút rồi nhấc lên theo cung, vượt nhẹ rồi nằm yên; trôi sang chỗ lá trang bị chui vào, phồng lên một nhịp
    // khi nhận, lơ lửng nhẹ, xoay cạnh, hiện to; cuối cùng xoay thu về, hạ xuống ô và nảy nhẹ.
    {
      const m = track(bigW, bigH);
      const sit: Pose = { x: home.x, y: home.y, s: s0 };
      const pressed: Pose = { ...sit, y: home.y + 4, s: s0 * 0.95 };
      const lifted: Pose = { x: left.x, y: left.y, s: s1 * 1.03, rz: -3 };
      const placed: Pose = { x: left.x, y: left.y, s: s1 };
      const adrift: Pose = { x: drift.x, y: drift.y, s: s1 };
      const pulse: Pose = { ...adrift, s: s1 * 1.045 };
      const bob: Pose = { ...adrift, y: drift.y - H * 0.006 };
      const edge = mid(drift, big);
      const toEdge: Pose = { x: edge.x, y: edge.y, s: (s1 + 1) / 2, ry: 88 };
      const bigUp: Pose = { x: big.x, y: big.y, s: 1.03 };
      const bigSet: Pose = { x: big.x, y: big.y, s: 1 };
      const back = mid(big, home);
      const backEdge: Pose = { x: back.x, y: back.y, s: (s0 + 1) / 2, ry: -88 };
      const above: Pose = { x: home.x, y: home.y - 3, s: s0 * 1.03 };
      m.tween(0, 140, sit, pressed, ease.out, 0, ease.out, 4);
      m.tween(140, 560, pressed, lifted, ease.out, 0.035, ease.back);
      m.tween(560, 700, lifted, placed, ease.inOut, 0, ease.inOut, 6);
      m.tween(700, 1000, placed, adrift, ease.inOut, 0, ease.inOut, 10);
      m.tween(1000, 1090, adrift, pulse, ease.out, 0, ease.out, 6);
      m.tween(1090, T.spark, pulse, adrift, ease.inOut, 0, ease.inOut, 6);
      m.tween(T.spark, 1570, adrift, bob, ease.inOut, 0, ease.inOut, 8);
      m.tween(1570, T.turn, bob, adrift, ease.inOut, 0, ease.inOut, 8);
      m.tween(T.turn, T.edge, adrift, toEdge, ease.in, 0, ease.in, 6);
      m.tween(T.edge, T.big, toEdge, bigUp, ease.out, 0, ease.out, 6);
      m.tween(T.big, 2200, bigUp, bigSet, ease.inOut, 0, ease.inOut, 8);
      m.push(T.back, bigSet);
      m.tween(T.back, T.backEdge, bigSet, backEdge, ease.in, 0, ease.in, 6);
      m.tween(T.backEdge, 3060, backEdge, above, ease.out, 0, ease.out, 8);
      m.tween(3060, EQUIP_MS, above, sit, ease.inOut, 0, ease.inOut, 6);
      runs.push(monEl.animate(m.out, { duration: EQUIP_MS, fill: "both" }));
      // Bóng đổ dài ra khi lá nhấc lên cao, ngắn lại khi hạ xuống.
      const shade = (y: number, blur: number, a: number) => `drop-shadow(0 ${y}px ${blur}px rgb(0 0 0 / ${a}))`;
      runs.push(
        copy.animate(
          [
            { offset: 0, filter: shade(3, 4, 0.5), easing: "ease-out" },
            { offset: at(140), filter: shade(2, 3, 0.5), easing: "ease-out" },
            { offset: at(560), filter: shade(24, 24, 0.45) },
            { offset: at(T.backEdge), filter: shade(24, 24, 0.45), easing: "ease-out" },
            { offset: at(3060), filter: shade(6, 6, 0.5) },
            { offset: 1, filter: shade(3, 4, 0.5) },
          ],
          { duration: EQUIP_MS, fill: "both" },
        ),
      );
    }

    // Lá trang bị: nhấc khỏi tay, bay theo cung ra bên phải, lật mặt trên đường, hạ xuống nghiêng nhẹ rồi nằm yên một nhịp;
    // sau đó mới trượt sang, nghiêng và thu nhỏ dần cho tới khi chui vào lá quái.
    {
      const gearW = box.width * STAGE_GROW;
      const gearH = gearW * (3.05 / 2);
      gearEl.style.width = `${gearW}px`;
      gearEl.style.height = `${gearH}px`;
      const hand = document.querySelector<HTMLElement>(from === "hand" ? ".hand" : ".foe-fan")?.getBoundingClientRect();
      const start = hand
        ? { x: hand.left - board.left + hand.width / 2, y: hand.top - board.top + hand.height / 2 }
        : { x: W / 2, y: from === "hand" ? H : 0 };
      const dir = from === "hand" ? 1 : -1;
      const g = track(gearW, gearH);
      const g0: Pose = { x: start.x, y: start.y, s: 0.7, rz: 10 * dir, ry: 70, o: 0.15 };
      const g1: Pose = { x: right.x, y: right.y, s: 1, rz: -2, ry: 0, o: 1 };
      const g2: Pose = { x: drift.x + gearW * 0.3, y: drift.y, s: 0.3, rz: -8, o: 1 };
      const g3: Pose = { x: drift.x, y: drift.y, s: 0.08, rz: -10, o: 0 };
      g.tween(0, 520, g0, g1, ease.out, 0.05 * dir, ease.out);
      g.push(660, g1);
      g.tween(660, 960, g1, g2, ease.inOut, 0.02 * dir, ease.inOut, 12);
      g.tween(960, T.merged, g2, g3, ease.in, 0, ease.in, 4);
      g.push(EQUIP_MS, g3);
      runs.push(gearEl.animate(g.out, { duration: EQUIP_MS, fill: "both" }));
    }

    // Light on the monster: sparks at its feet, the white flash, the burst of rays.
    const part = (name: string) => monEl.querySelector<HTMLElement>(name);
    const keyed = (el: HTMLElement | null, frames: Keyframe[]) => {
      if (el) runs.push(el.animate(frames, { duration: EQUIP_MS, fill: "both" }));
    };
    for (const spark of monEl.querySelectorAll<HTMLElement>(".equip-spark")) {
      keyed(spark, [
        { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" },
        { offset: at(T.spark), opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" },
        { offset: at(T.spark + 60 * K), opacity: 1, transform: "translate(-50%, -50%) scale(0.7)" },
        { offset: at(T.flash), opacity: 1, transform: "translate(-50%, -50%) scale(1.5)" },
        { offset: at(T.flash + 90 * K), opacity: 0, transform: "translate(-50%, -50%) scale(2.4)" },
        { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(2.4)" },
      ]);
    }
    keyed(part(".equip-white"), [
      { offset: 0, opacity: 0 },
      { offset: at(T.flash - 30 * K), opacity: 0 },
      { offset: at(T.flash + 40 * K), opacity: 1 },
      { offset: at(T.flash + 80 * K), opacity: 0.95 },
      { offset: at(T.turn), opacity: 0.35 },
      { offset: at(T.big), opacity: 0 },
      { offset: 1, opacity: 0 },
    ]);
    keyed(part(".equip-burst"), [
      { offset: 0, opacity: 0, transform: "translate(-50%, -50%) scale(0.25) rotate(0deg)" },
      { offset: at(T.burst - 20 * K), opacity: 0, transform: "translate(-50%, -50%) scale(0.25) rotate(0deg)" },
      { offset: at(T.burst + 50 * K), opacity: 1, transform: "translate(-50%, -50%) scale(0.75) rotate(8deg)" },
      { offset: at(T.burst + 170 * K), opacity: 0.85, transform: "translate(-50%, -50%) scale(1.1) rotate(16deg)" },
      { offset: at(T.big), opacity: 0, transform: "translate(-50%, -50%) scale(1.25) rotate(20deg)" },
      { offset: 1, opacity: 0, transform: "translate(-50%, -50%) scale(1.25) rotate(20deg)" },
    ]);
    keyed(part(".equip-halo"), [
      { offset: 0, opacity: 0 },
      { offset: at(T.big - 20 * K), opacity: 0 },
      { offset: at(T.big + 40 * K), opacity: 1 },
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
