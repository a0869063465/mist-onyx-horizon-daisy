import { useEffect, useRef, type ReactNode } from "react";

export type DanceSpot = { x: number; y: number; w: number };

/**
 * Beat lengths (ms) of the fusion scene, after the owner's reference video. The phase clock in play.tsx and the
 * fusion sound in sfx.ts follow the same beats: lift 0, clash 0.56 s, apart 0.78 s, swirl 1.2 s, flash 2.3 s,
 * turn 2.86 s, the fused monster's sheet at 3.96 s.
 */
export const FUSE_BEATS = {
  lift: [560, "clash"],
  clash: [220, "apart"],
  apart: [420, "swirl"],
  swirl: [1100, "flash"],
  flash: [560, "turn"],
  turn: [1100, "reveal"],
} as const;

/** Where the two monsters meet, in % of the board, and how wide they stand there. */
const CX = 50;
const CY = 44;
const WIDE = 26;
/** Distance from the middle after they spring apart, which is where the whirlpool starts. */
const FAR = 26;
/** How far apart their centres are when they smash into each other. */
const HIT = 9;
/** The whirlpool seen from above and in front: its height is this share of its width. */
const FLAT = 0.4;
const TURNS = 2.25;
const LAST = 2.5;
/** After the swirl they keep spinning tight inside the flash while they fade. */
const TAIL = 380;

const ease = {
  inOut: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
  in: (u: number) => u * u,
  out: (u: number) => 1 - (1 - u) ** 3,
};
const clamp = (u: number) => Math.min(1, Math.max(0, u));
const mix = (from: number, to: number, u: number) => from + (to - from) * u;

type Pose = { x: number; y: number; w: number; scale: number; tilt: number; front: number; glow: number; fade: number };

/** One card's pose at `t` ms after the scene starts; `side` is -1 for the card that goes left, 1 for the right. */
function pose(t: number, side: number, from: DanceSpot, tall: number): Pose {
  const lift = FUSE_BEATS.lift[0];
  const clash = lift + FUSE_BEATS.clash[0];
  const apart = clash + FUSE_BEATS.apart[0];
  const swirl = apart + FUSE_BEATS.swirl[0];
  if (t < lift) {
    // Both monsters rise from where they are to the middle of the board.
    const u = ease.inOut(clamp(t / lift));
    return { x: mix(from.x, CX + side * 20, u), y: mix(from.y, CY, u), w: mix(from.w, WIDE, u), scale: 1 + 0.08 * Math.sin(Math.PI * u), tilt: 0, front: 0, glow: 0.15 * u, fade: 1 };
  }
  if (t < clash) {
    // They rush into each other, leaning into the blow.
    const u = ease.in(clamp((t - lift) / (clash - lift)));
    return { x: mix(CX + side * 20, CX + side * HIT, u), y: CY, w: WIDE, scale: 1, tilt: -side * 8 * u, front: 0, glow: 0.15, fade: 1 };
  }
  if (t < apart) {
    // They spring back a distance and settle upright.
    const u = clamp((t - clash) / (apart - clash));
    const back = ease.out(u);
    return { x: mix(CX + side * HIT, CX + side * FAR, back), y: CY, w: WIDE, scale: 1 + 0.08 * (1 - back), tilt: -side * 8 * (1 - back) * Math.cos(u * Math.PI * 2), front: 0, glow: 0.15, fade: 1 };
  }
  // The whirlpool: each card circles the middle on a flattened ring, always standing upright, drawn in faster and
  // faster. The near half of the ring is lower and larger, and the nearer card covers the other.
  const u = (t - apart) / (swirl - apart);
  const spin = u <= 1 ? u ** 1.7 : 1 + 1.7 * (u - 1);
  const reach = u <= 1 ? LAST + (FAR - LAST) * (1 - u) ** 1.35 : LAST;
  const turn = (side < 0 ? Math.PI : 0) + TURNS * 2 * Math.PI * spin;
  const depth = Math.sin(turn) * (reach / FAR);
  const late = clamp(u);
  return {
    x: CX + reach * Math.cos(turn),
    y: CY + reach * Math.sin(turn) * FLAT * tall,
    w: WIDE,
    scale: 1 + 0.2 * depth,
    tilt: 0,
    front: depth,
    glow: 0.15 + 0.85 * late * late,
    fade: u <= 1 ? 1 : clamp(1 - (t - swirl) / TAIL),
  };
}

/**
 * The two monsters of a fusion, moved frame by frame from the moment this mounts: they rise to the middle, smash
 * into each other, spring apart, then are sucked into each other on a whirlpool, standing upright, until they meet
 * inside the flash. `children` are the two card faces, the hand card first.
 */
export function FuseDance({ a, b, children }: { a: DanceSpot; b: DanceSpot; children: [ReactNode, ReactNode] }) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLDivElement | null>>([null, null]);

  useEffect(() => {
    const start = performance.now();
    const box = root.current?.getBoundingClientRect();
    // Board width over height, so the whirlpool keeps its shape on any screen.
    const tall = box && box.height > 0 ? box.width / box.height : 0.56;
    const sides = a.x <= b.x ? [-1, 1] : [1, -1];
    let frame = 0;
    const draw = () => {
      const t = performance.now() - start;
      [a, b].forEach((spot, index) => {
        const el = cards.current[index];
        if (!el) return;
        const p = pose(t, sides[index], spot, tall);
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
        el.style.width = `${p.w}%`;
        el.style.transform = `translate(-50%, -50%) rotate(${p.tilt}deg) scale(${p.scale})`;
        el.style.zIndex = p.front > 0 ? "3" : "2";
        el.style.opacity = `${p.fade}`;
        el.style.filter = `brightness(${1 + 1.6 * p.glow}) drop-shadow(0 0 ${4 + 20 * p.glow}px rgba(232, 200, 255, ${0.35 + 0.6 * p.glow})) drop-shadow(0 10px 12px rgba(0, 0, 0, ${0.75 * (1 - p.glow)}))`;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [a, b]);

  return (
    <div ref={root} className="fuse3d-dance">
      {children.map((face, index) => (
        <div key={index} ref={(el) => void (cards.current[index] = el)} className="fuse3d-card">
          {face}
        </div>
      ))}
    </div>
  );
}
