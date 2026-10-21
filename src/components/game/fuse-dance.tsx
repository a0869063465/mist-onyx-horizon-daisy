import { useEffect, useRef, type ReactNode } from "react";

export type DanceSpot = { x: number; y: number; w: number };

/**
 * A card in the fusion scene as its picture only, in the gold frame of Đổi hình nền: no name, no figures. Used for
 * the cards flying in and for the fused monster that appears after the flash (owner, 21/10).
 */
export function FusePic({ src }: { src: string }) {
  return (
    <span className="fuse3d-pic">
      <span className="fuse3d-pic-art" style={{ backgroundImage: `url(${src})` }} />
      <img className="fuse3d-pic-frame" src="/ui/cover-frame.png" alt="" draggable={false} />
    </span>
  );
}

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

/** Where the monsters meet, in % of the board, and how wide they stand there. */
const CX = 50;
const CY = 44;
const WIDE = 26;
const TURNS = 2.25;
/** After the whirlpool they stay in the middle inside the flash while they fade. */
const TAIL = 380;

/**
 * Distances from the middle, in % of the board's width: where the cards wait before the blow, how close they come in
 * it, and where they spring back to before the whirlpool. Two cards keep their old distances. Three wait far enough
 * apart that the two on the left do not cover each other, and only just touch in the blow (owner, 21/10: picture B).
 */
type Ring = { start: number; hit: number; far: number };
const TWO: Ring = { start: 20, hit: 9, far: 26 };
const THREE: Ring = { start: 27, hit: 13.3, far: 33 };
/** Three cards: the two field cards wait 120° from the hand card, one upper left and one lower left. */
const TRIO_ANGLE = (2 * Math.PI) / 3;
/**
 * Each card leans back this many degrees about the line from the middle through it. The leans are too small to see,
 * but they make the browser draw the cards crossing each other wherever they overlap, in the blow and in the
 * whirlpool alike (owner, 21/10). Three cards make a ring: the hand card lies over the lower left one, that one over
 * the upper left one, and the upper left one over the hand card. Two cards each lie over the other on one side of
 * the line between them.
 */
const PITCH = 6;

const ease = {
  inOut: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
  in: (u: number) => u * u,
  out: (u: number) => 1 - (1 - u) ** 3,
};
const clamp = (u: number) => Math.min(1, Math.max(0, u));
const mix = (from: number, to: number, u: number) => from + (to - from) * u;

/** `axis`: the direction (radians) from the middle to the card, which the card leans back about. */
type Pose = { x: number; y: number; w: number; scale: number; tilt: number; glow: number; fade: number; axis: number };

/**
 * One card's pose at `t` ms after the scene starts; `angle` is where it waits around the middle (0 = 3 o'clock,
 * growing clockwise on screen). The cards rise from where they are, rush into each other leaning into the blow,
 * spring back and settle upright, then whirl in the upright plane of the screen (owner, 21/10, for two cards as for
 * three): a true circle, every card standing upright and keeping its size, clockwise and faster and faster. The ring
 * stays wide and closes on the middle at the very end, so the cards never spin on a tiny circle around it, which
 * looked like shaking (owner, 21/10).
 */
function pose(t: number, angle: number, from: DanceSpot, tall: number, ring: Ring): Pose {
  const lift = FUSE_BEATS.lift[0];
  const clash = lift + FUSE_BEATS.clash[0];
  const apart = clash + FUSE_BEATS.apart[0];
  const swirl = apart + FUSE_BEATS.swirl[0];
  const at = (reach: number, turn: number) => ({ x: CX + reach * Math.cos(turn), y: CY + reach * Math.sin(turn) * tall });
  // Lean into the blow: the top tips toward the middle.
  const lean = -8 * Math.cos(angle);
  if (t < lift) {
    const u = ease.inOut(clamp(t / lift));
    const end = at(ring.start, angle);
    return { x: mix(from.x, end.x, u), y: mix(from.y, end.y, u), w: mix(from.w, WIDE, u), scale: 1 + 0.08 * Math.sin(Math.PI * u), tilt: 0, glow: 0.15 * u, fade: 1, axis: angle };
  }
  if (t < clash) {
    const u = ease.in(clamp((t - lift) / (clash - lift)));
    return { ...at(mix(ring.start, ring.hit, u), angle), w: WIDE, scale: 1, tilt: lean * u, glow: 0.15, fade: 1, axis: angle };
  }
  if (t < apart) {
    const u = clamp((t - clash) / (apart - clash));
    const back = ease.out(u);
    return { ...at(mix(ring.hit, ring.far, back), angle), w: WIDE, scale: 1 + 0.08 * (1 - back), tilt: lean * (1 - back) * Math.cos(u * Math.PI * 2), glow: 0.15, fade: 1, axis: angle };
  }
  const u = (t - apart) / (swirl - apart);
  const spin = u <= 1 ? u ** 1.7 : 1 + 1.7 * (u - 1);
  // Wide for most of the whirlpool, then drawn straight into the middle as it ends; after that they stay there and
  // fade inside the flash.
  const reach = u <= 1 ? ring.far * (1 - u * u) : 0;
  const turn = angle + TURNS * 2 * Math.PI * spin;
  const late = clamp(u);
  return { ...at(reach, turn), w: WIDE, scale: 1, tilt: 0, glow: 0.15 + 0.85 * late * late, fade: u <= 1 ? 1 : clamp(1 - (t - swirl) / TAIL), axis: turn };
}

/**
 * The monsters of a fusion, moved frame by frame from the moment this mounts: they rise to the middle, smash into
 * each other, spring apart, then are sucked into each other on a whirlpool, standing upright, until they meet inside
 * the flash. `children` are the card faces, the hand card first. Two cards: the one further left on screen goes
 * left. With a third spot `c` (three knights), the hand card waits at 3 o'clock, the field card further left on
 * screen upper left and the other lower left.
 */
export function FuseDance({ a, b, c, children }: { a: DanceSpot; b: DanceSpot; c?: DanceSpot; children: ReactNode[] }) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLDivElement | null>>([null, null, null]);

  useEffect(() => {
    const start = performance.now();
    const box = root.current?.getBoundingClientRect();
    // Board width over height, so the whirlpool keeps its shape on any screen.
    const tall = box && box.height > 0 ? box.width / box.height : 0.56;
    const spots = c ? [a, b, c] : [a, b];
    const angles = c ? [0, b.x <= c.x ? -TRIO_ANGLE : TRIO_ANGLE, b.x <= c.x ? TRIO_ANGLE : -TRIO_ANGLE] : a.x <= b.x ? [Math.PI, 0] : [0, Math.PI];
    const ring = c ? THREE : TWO;
    let frame = 0;
    const draw = () => {
      const t = performance.now() - start;
      for (let index = 0; index < spots.length; index += 1) {
        const el = cards.current[index];
        if (!el) continue;
        const p = pose(t, angles[index], spots[index], tall, ring);
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
        el.style.width = `${p.w}%`;
        el.style.transform = `translate(-50%, -50%) rotate3d(${Math.cos(p.axis)}, ${Math.sin(p.axis)}, 0, ${PITCH}deg) rotate(${p.tilt}deg) scale(${p.scale})`;
        // A filter on a card stops the browser drawing the cards crossing each other, so the glow and the fade go on
        // the group around them and each card keeps only a plain shadow.
        el.style.boxShadow = `0 8px 12px rgba(0, 0, 0, ${0.6 * (1 - p.glow)})`;
        if (index === 0 && root.current) {
          root.current.style.opacity = `${p.fade}`;
          root.current.style.filter = `brightness(${1 + 1.6 * p.glow}) drop-shadow(0 0 ${4 + 20 * p.glow}px rgba(232, 200, 255, ${0.35 + 0.6 * p.glow})) drop-shadow(0 10px 12px rgba(0, 0, 0, ${0.75 * (1 - p.glow)}))`;
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [a, b, c]);

  return (
    <div ref={root} className="fuse3d-dance">
      <div className="fuse3d-ring">
        {children.map((face, index) => (
          <div key={index} ref={(el) => void (cards.current[index] = el)} className="fuse3d-card">
            {face}
          </div>
        ))}
      </div>
    </div>
  );
}
