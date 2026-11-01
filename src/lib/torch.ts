/**
 * Chọn mục tiêu bằng đèn pin (chủ game 01/11). The finger's touch-down point is the lamp. Every target (a monster card or
 * the player) owns the beam between the two lines from the lamp past its two ends that do not cut through it; the beam
 * runs on behind the card without end. The finger in a beam may pick that target; out of every beam, nothing is picked.
 *
 * - Crossing a target's centre ray (lamp → card centre) moves the pick to it and locks it there, front row or back.
 * - The lock holds while the finger stays in its beam and crosses no other centre ray.
 * - Beams that overlap in one direction (a front card and the card behind it) are walked by moving a little out or in,
 *   at most a quarter of the card's depth (chủ game: "nhích nhẹ, cùng lắm 1/4 lá").
 * - No lock yet: in the nearest row the finger's beams reach, the target whose centre ray is nearest the finger.
 * - A finger right on a target picks it.
 */
export type TorchBox = { key: string; left: number; top: number; width: number; height: number };
export type TorchState = { x: number; y: number; lock: string | null; reach: number; angle: number | null };

/** Below this the finger is still on the lamp. */
const STILL = 10;
/** Smallest step out or in that walks to the next card in a direction. */
const MIN_STEP = 9;

export function lightTorch(x: number, y: number): TorchState {
  return { x, y, lock: null, reach: 0, angle: null };
}

const turn = (a: number) => {
  let d = a % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
};

type Beam = { key: string; angle: number; lo: number; hi: number; dist: number; depth: number };

function beamOf(lamp: { x: number; y: number }, box: TorchBox): Beam | null {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  // The lamp on the card: no beam (a tap there picks it).
  if (lamp.x >= box.left && lamp.x <= box.left + box.width && lamp.y >= box.top && lamp.y <= box.top + box.height) return null;
  const angle = Math.atan2(cy - lamp.y, cx - lamp.x);
  const corners = [
    [box.left, box.top],
    [box.left + box.width, box.top],
    [box.left, box.top + box.height],
    [box.left + box.width, box.top + box.height],
  ];
  let lo = 0;
  let hi = 0;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  let near = Infinity;
  let far = -Infinity;
  for (const [px, py] of corners) {
    const d = turn(Math.atan2(py - lamp.y, px - lamp.x) - angle);
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
    const along = (px - lamp.x) * ux + (py - lamp.y) * uy;
    near = Math.min(near, along);
    far = Math.max(far, along);
  }
  return { key: box.key, angle, lo, hi, dist: Math.hypot(cx - lamp.x, cy - lamp.y), depth: far - near };
}

/** Moves the torch to the finger at (x, y); returns the picked key (also kept in `state.lock`). */
export function aimTorch(state: TorchState, boxes: TorchBox[], x: number, y: number, under: string | null): string | null {
  const reach = Math.hypot(x - state.x, y - state.y);
  if (under && boxes.some((box) => box.key === under)) {
    state.lock = under;
    state.reach = reach;
    state.angle = reach >= STILL ? Math.atan2(y - state.y, x - state.x) : state.angle;
    return under;
  }
  if (reach < STILL) return state.lock;
  const angle = Math.atan2(y - state.y, x - state.x);
  const beams = boxes.map((box) => beamOf(state, box)).filter((beam): beam is Beam => beam !== null);
  const lit = beams
    .filter((beam) => {
      const d = turn(angle - beam.angle);
      return d >= beam.lo && d <= beam.hi;
    })
    .sort((a, b) => a.dist - b.dist);
  const before = state.angle;
  state.angle = angle;
  if (!lit.length) {
    state.lock = null;
    state.reach = reach;
    return null;
  }
  // Centre rays crossed since the last move: the pick jumps to the one nearest the finger now.
  if (before !== null) {
    const swept = turn(angle - before);
    const crossed = lit.filter((beam) => {
      const from = turn(beam.angle - before);
      return swept !== 0 && Math.sign(from) === Math.sign(swept) && Math.abs(from) <= Math.abs(swept);
    });
    if (crossed.length) {
      crossed.sort((a, b) => Math.abs(turn(angle - a.angle)) - Math.abs(turn(angle - b.angle)));
      const next = crossed.find((beam) => beam.key === state.lock) ?? crossed[0];
      state.lock = next.key;
      state.reach = reach;
      return state.lock;
    }
  }
  const at = lit.findIndex((beam) => beam.key === state.lock);
  if (at < 0) {
    // The nearest row first (the cards behind need a step out); in it, the centre ray nearest the finger.
    const row = lit.filter((beam) => beam.dist <= lit[0].dist + lit[0].depth / 2);
    row.sort((a, b) => Math.abs(turn(angle - a.angle)) - Math.abs(turn(angle - b.angle)));
    state.lock = row[0].key;
    state.reach = reach;
    return state.lock;
  }
  // Out a little: the card behind in this direction; in a little: the card in front.
  const step = Math.max(MIN_STEP, lit[at].depth / 4);
  if (reach - state.reach >= step) {
    if (at + 1 < lit.length) state.lock = lit[at + 1].key;
    state.reach = reach;
  } else if (state.reach - reach >= step) {
    if (at > 0) state.lock = lit[at - 1].key;
    state.reach = reach;
  }
  return state.lock;
}
