import type { BoxPt } from "@/components/game/flow-canvas";

/**
 * Dòng chảy (chủ game 29/10, hình vẽ vòi nước): the way each branch of a spread runs from its fork into its target. It
 * runs out sideways past its target, sagging back toward the one who sent it, rises beside the card and turns back in
 * to it (uốn ngược trở lại): round the outside of the end of a row and in square to the card's outer side, up the gap
 * between two cards and on along the side of one behind them (too narrow to turn in square), or under a card straight
 * ahead and up square into its near edge, off to one side (a flow may meet a card on any edge, anywhere; it meets it
 * right on its edge, chủ game 29/10). On each side the branches nest like the petals of a tulip: the inner ones leave
 * the fork rising and sag little, the outer ones leave it flat or falling and sag deeper, so none crosses another;
 * branches up the same way leave the fork as one and part where the nearer turns in.
 *
 * Board places are in % of the board (x of its width, y of its height); a branch's way and its directions are in the
 * 90 × 160 box the flows are drawn in.
 */
export type FanCard = { x: number; y: number; w: number; h: number };
export type FanAim = { key: string; card?: FanCard; ring?: { x: number; y: number; r: number }; point?: { x: number; y: number } };
export type FanRoute = {
  /** Where it meets its target, in % of the board, and the way it runs there. */
  entry: { x: number; y: number };
  into: BoxPt;
  /** Its whole way: cubic Bézier pieces end to end (its start, two controls and an end, two controls and an end…). */
  path: BoxPt[];
};

/** How far outside the end of a row the outer branches rise, in % of the board's width: room enough to turn in square
 *  to the card's side. */
const OUTER = 5;
/** A card closer than this (in card widths) to the fork's line is straight ahead of it. */
const AHEAD = 0.6;
/** How far up a card's side a branch meets it, from the edge facing the fork (in card heights); how far to the side
 *  of a card straight ahead it meets its near edge (in card widths). */
const ENTRY_UP = 1 / 3;
const NEAR_SIDE = 0.35;
/** A front-row card is met at the corner of its near edge on the side its branch comes from, slanting in across the
 *  corner (chủ game 29/10); the one ahead of the fork rises this far (in % of the board's width) outside that corner. */
const NEAR_OUT = 4;
/** How much farther out than the front row's outer branch a back-row end card's branch rises (in % of the board's
 *  width), so the two don't run on top of each other (chủ game 29/10: bung rộng); it meets that card at its outer
 *  side halfway up. It goes as one with the branch into the front row's card there as far as the bottom of their sag,
 *  then out on its own (chủ game 29/10: nửa đầu dùng chung nhánh, nửa sau tách ra). */
const CORNER_OUT = 6;
/** Box units an inner branch's sag keeps clear of the next one out. */
const NEST = 1.2;

type Kind = "side" | "near" | "gap" | "ring";

function unit(x: number, y: number): BoxPt {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function cubic(a: BoxPt, b: BoxPt, c: BoxPt, d: BoxPt, t: number): BoxPt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

/** Points along the pieces of a way (`upto` of them). */
function along(path: BoxPt[], upto = Infinity): BoxPt[] {
  const pts: BoxPt[] = [path[0]];
  for (let j = 0, n = 0; j + 3 < path.length && n < upto; j += 3, n += 1) {
    for (let i = 1; i <= 24; i += 1) pts.push(cubic(path[j], path[j + 1], path[j + 2], path[j + 3], i / 24));
  }
  return pts;
}

/**
 * A branch's way, in box units: from the fork `f` out to `side`, leaving it rising by `lift` (falling below 0), over
 * into its sag `dip` below the fork, round the bottom and up the lane `lane` (an x), then back in to `e`, arriving
 * along `into`. `toward`: +1 if its target lies down the board from the fork, -1 if up. Branches up the same way
 * rise as one to the height `riseOf` sets (the nearer one's entry), so they part only where the nearer turns in.
 */
function wayOf(f: BoxPt, e: BoxPt, into: BoxPt, lane: number, dip: number, lift: number, side: number, toward: number, kind: Kind, riseOf = e.y, shared?: BoxPt[]): BoxPt[] {
  const reach = Math.abs(lane - f.x);
  // A branch that rises almost straight from the fork barely sags, or it would double back on itself.
  const sag = Math.min(dip, reach * 0.6);
  // One that goes as one with another out of the fork (`shared`: that one's way to the bottom of its sag) parts there.
  const low = shared ? shared[3] : { x: f.x + side * reach * 0.7, y: f.y - toward * sag };
  const out = unit(side, toward * lift);
  const first = Math.hypot(low.x - f.x, low.y - f.y);
  const rise = { x: lane, y: low.y + (riseOf - low.y) * 0.3 };
  const climb = Math.abs(rise.y - low.y);
  const last = Math.hypot(e.x - rise.x, e.y - rise.y);
  // Into a card's side it turns in square off its lane, round a corner as wide as the room it has.
  const turnIn = kind === "side" ? Math.abs(e.x - lane) : last * 0.3;
  return [
    ...(shared ?? [f, { x: f.x + out.x * first * 0.45, y: f.y + out.y * first * 0.45 }, { x: low.x - side * first * 0.35, y: low.y }, low]),
    { x: low.x + side * Math.abs(lane - low.x) * 0.55, y: low.y },
    { x: lane, y: rise.y - toward * climb * 0.55 },
    rise,
    { x: lane, y: rise.y + toward * last * 0.3 },
    { x: e.x - into.x * turnIn, y: e.y - into.y * turnIn },
    e,
  ];
}

/**
 * The way into a back-row card that is not at the end of its row on its branch's side is the owner's own stroke (chủ
 * game 29/10: drew it in red over a spread at all six and said to use it as drawn): out from the fork, back over the
 * corner of the front row's card on that side and up into the middle of the card's near edge. In % of the board as
 * drawn (the fork at `DRAWN_FORK`, the card it was drawn to at `DRAWN_CARD`, the last point where it meets the card).
 * The two at the ends of the back row go round the outside as before (chủ game 29/10).
 */
const DRAWN_FORK = { x: 40.02, y: 44.97 };
const DRAWN_CARD: FanCard = { x: 41.3, y: 20.91, w: 17.6, h: 11.12 };
const DRAWN: Array<[number, number]> = [[39.52, 43.37], [35.04, 43.78], [30.56, 44.34], [26.84, 43.33], [24.56, 41.52], [24.67, 39.42], [26.21, 37.45], [28.84, 35.73], [32.13, 34.19], [35.42, 32.71], [38.46, 31.12], [39.45, 29.15], [40.93, 26.47]];

/** The owner's stroke laid onto this spread: mirrored if its branch goes the other way, stretched across with the
 *  card's place (the board's edges stay put), up and down with the fork (flipped for the blue side), its start moved
 *  to the fork; as cubic pieces through its points, in box units. */
function drawnRoute(mirror: boolean, card: FanCard, fork: { x: number; y: number }): FanRoute {
  const ref = DRAWN_CARD;
  const flipX = (x: number) => (mirror ? 2 * ref.x - x : x);
  const refL = ref.x - ref.w / 2;
  const refR = ref.x + ref.w / 2;
  const left = card.x - card.w / 2;
  const right = card.x + card.w / 2;
  const mapX = (x: number) =>
    x <= refL ? (x / refL) * left : x >= refR ? right + ((x - refR) / (100 - refR)) * (100 - right) : left + ((x - refL) / (refR - refL)) * (right - left);
  const last = DRAWN[DRAWN.length - 1];
  // Where it meets the card, as far across and up the card as on the one it was drawn on (from the near edge).
  const down = card.y > fork.y ? -1 : 1;
  const meet = { x: mapX(flipX(last[0])), y: card.y + ((last[1] - ref.y) / ref.h) * card.h * down };
  const stretch = (meet.y - fork.y) / (last[1] - DRAWN_FORK.y);
  let pts = DRAWN.map(([x, y]) => ({ x: mapX(flipX(x)), y: fork.y + (y - DRAWN_FORK.y) * stretch }));
  pts[pts.length - 1] = meet;
  // It starts at the fork: the start moves there, the rest of it less and less.
  const K = 1870 / 841;
  const lens = [0];
  for (let i = 1; i < pts.length; i += 1) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, (pts[i].y - pts[i - 1].y) * K));
  const total = lens[lens.length - 1] || 1;
  const dx = fork.x - pts[0].x;
  const dy = fork.y - pts[0].y;
  pts = pts.map((pt, i) => {
    const w = Math.pow(1 - Math.min(1, lens[i] / total / 0.35), 2);
    return { x: pt.x + dx * w, y: pt.y + dy * w };
  });
  // Cubic pieces through every point (Catmull-Rom), in box units.
  const box = pts.map((pt) => ({ x: pt.x * 0.9, y: pt.y * 1.6 }));
  const path: BoxPt[] = [box[0]];
  for (let i = 0; i + 1 < box.length; i += 1) {
    const p0 = box[Math.max(0, i - 1)];
    const p1 = box[i];
    const p2 = box[i + 1];
    const p3 = box[Math.min(box.length - 1, i + 2)];
    path.push({ x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }, { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }, p2);
  }
  const end = box[box.length - 1];
  const before = box[box.length - 2];
  return { entry: meet, into: unit(end.x - before.x, end.y - before.y), path };
}

/** `front`: the three cards' places of the front row of the side the spread is aimed at (middles and sizes). */
export function fanRoutes(fork: { x: number; y: number }, aims: FanAim[], front: FanCard[]): Map<string, FanRoute> {
  const routes = new Map<string, FanRoute>();
  if (front.length < 3 || aims.length === 0) return routes;
  const toward = Math.sign(front[1].y - fork.y) || -1;
  const edgeOf = (card: FanCard, side: number) => card.x + (side * card.w) / 2;
  const outerLeft = edgeOf(front[0], -1) - OUTER;
  const outerRight = edgeOf(front[2], 1) + OUTER;
  const gaps = [(edgeOf(front[0], 1) + edgeOf(front[1], -1)) / 2, (edgeOf(front[1], 1) + edgeOf(front[2], -1)) / 2];
  // The way up beside a column on one side: outside the row at its ends, else the gap between two columns.
  const laneBeside = (col: number, side: number) => (side < 0 ? (col === 0 ? outerLeft : gaps[col - 1]) : col === 2 ? outerRight : gaps[col]);
  const column = (x: number) => [0, 1, 2].reduce((best, i) => (Math.abs(front[i].x - x) < Math.abs(front[best].x - x) ? i : best), 0);

  type Plan = { aim: FanAim; side: number; ahead: boolean; inFront: boolean; col: number };
  const plans: Plan[] = aims.map((aim) => {
    const at = aim.card ?? aim.ring ?? aim.point ?? fork;
    const lateral = at.x - fork.x;
    const col = column(at.x);
    const inFront = aim.card ? Math.abs(aim.card.y - front[col].y) < aim.card.h * 0.5 : false;
    const ahead = Boolean(aim.card) && Math.abs(lateral) < (aim.card?.w ?? 0) * AHEAD;
    return { aim, side: Math.sign(lateral) || -1, ahead, inFront, col };
  });
  // Straight ahead of the fork: one behind takes the side with fewer branches, one in front of it the other side.
  const count: Record<number, number> = { [-1]: 0, [1]: 0 };
  for (const plan of plans) if (!plan.ahead) count[plan.side] += 1;
  let taken = 0;
  for (const plan of plans.filter((one) => one.ahead).sort((a, b) => Number(a.inFront) - Number(b.inFront))) {
    plan.side = taken ? -taken : count[-1] <= count[1] ? -1 : 1;
    taken = plan.side;
    count[plan.side] += 1;
  }

  const drafts = plans.map((plan) => {
    const { aim, side } = plan;
    let entry: { x: number; y: number };
    let into: BoxPt;
    let lane: number;
    let kind: Kind;
    let wide: number | null = null;
    if (aim.card) {
      const card = aim.card;
      const near = card.y - (toward * card.h) / 2;
      lane = laneBeside(plan.col, side);
      if (plan.ahead && plan.inFront) {
        // Out under the card, then up square into its near edge, off to that side.
        kind = "near";
        entry = { x: edgeOf(card, side), y: near };
        lane = entry.x + side * NEAR_OUT;
        into = unit(-side, toward);
      } else if (!plan.inFront && ((plan.col === 0 && side < 0) || (plan.col === 2 && side > 0))) {
        // A back-row card at the end of its row: up wider round the outside, in at its outer side halfway up, slanting.
        kind = "side";
        lane = laneBeside(plan.col, side);
        wide = lane + side * CORNER_OUT;
        entry = { x: edgeOf(card, side), y: near + toward * card.h * 0.5 };
        into = unit(-side, toward * 0.7);
      } else {
        // Up beside it and in at its side, a third of the way up from its near edge: in square from outside the row;
        // from a gap too narrow to turn in, on along its side into the moat there.
        kind = lane === outerLeft || lane === outerRight ? "side" : "gap";
        const corner = kind === "side" && plan.inFront;
        entry = { x: edgeOf(card, side), y: corner ? near : near + toward * card.h * ENTRY_UP };
        into = corner ? unit(-side, toward) : kind === "side" ? { x: -side, y: 0 } : { x: 0, y: toward };
      }
    } else if (aim.ring) {
      // A player: up round the outside of the rows into the ring round its health, from below.
      kind = "ring";
      lane = side < 0 ? outerLeft : outerRight;
      entry = { x: aim.ring.x, y: aim.ring.y - toward * aim.ring.r * (0.9 / 1.6) };
      into = { x: 0, y: toward };
    } else {
      kind = "ring";
      const point = aim.point ?? fork;
      lane = point.x + side * 3;
      entry = point;
      into = { x: 0, y: toward };
    }
    return { key: aim.key, side, entry, into, lane, kind, wide };
  });

  const f = { x: fork.x * 0.9, y: fork.y * 1.6 };
  for (const side of [-1, 1]) {
    // Branches up the same way share it: the nearer turns in first, the farther rises on.
    const lanes = new Map<string, Array<{ draft: (typeof drafts)[number]; e: BoxPt }>>();
    for (const draft of drafts) {
      if (draft.side !== side) continue;
      const id = draft.lane.toFixed(1);
      lanes.set(id, [...(lanes.get(id) ?? []), { draft, e: { x: draft.entry.x * 0.9, y: draft.entry.y * 1.6 } }]);
    }
    const groups = [...lanes.values()]
      .map((members) => {
        members.sort((a, b) => Math.abs(a.e.y - f.y) - Math.abs(b.e.y - f.y));
        const lane = Math.min(99, Math.max(1, members[0].draft.lane)) * 0.9;
        return { members, lane, reach: Math.abs(lane - f.x) };
      })
      .sort((a, b) => a.reach - b.reach);
    if (!groups.length) continue;
    // The outermost sags deepest; it leaves the fork a little rising, or a little falling under branches nested
    // inside it.
    let outer: BoxPt[] | null = null;
    let dip = Math.min(5, Math.max(2.5, groups[groups.length - 1].reach * 0.15 + 1));
    let lift = groups.length > 1 ? -0.15 : 0.15;
    for (let i = groups.length - 1; i >= 0; i -= 1) {
      const group = groups[i];
      const near = group.members[0];
      let path = wayOf(f, near.e, near.draft.into, group.lane, dip, lift, side, toward, near.draft.kind);
      // Nested inside the one out from it: rising out of the fork, sagging less, clear of it all the way round.
      for (let tries = 0; outer && tries < 8 && !clearOf(path, outer, f, side, toward); tries += 1) {
        dip *= 0.75;
        lift = Math.min(0.9, lift + 0.12);
        path = wayOf(f, near.e, near.draft.into, group.lane, dip, lift, side, toward, near.draft.kind);
      }
      for (const member of group.members) {
        const wide = member.draft.wide;
        const way =
          member === near
            ? path
            : wide !== null
              ? wayOf(f, member.e, member.draft.into, Math.min(99, Math.max(1, wide)) * 0.9, dip, lift, side, toward, member.draft.kind, member.e.y, path.slice(0, 4))
              : wayOf(f, member.e, member.draft.into, group.lane, dip, lift, side, toward, member.draft.kind, near.e.y);
        routes.set(member.draft.key, { entry: member.draft.entry, into: member.draft.into, path: way });
      }
      outer = path;
      const next = groups[i - 1];
      if (next) {
        dip = Math.max(0.6, Math.min(dip - 1, dip * (next.reach / Math.max(1, group.reach)) * 0.75));
        lift = Math.min(0.9, lift + 0.4);
      }
    }
  }
  // A back-row card not at the end of its row on its branch's side: the owner's own stroke (chủ game 29/10); the rest
  // are worked out as before.
  for (const plan of plans) {
    const card = plan.aim.card;
    if (!card || plan.inFront) continue;
    if ((plan.col === 0 && plan.side < 0) || (plan.col === 2 && plan.side > 0)) continue;
    routes.set(plan.aim.key, drawnRoute(plan.side > 0, card, fork));
  }
  return routes;
}

/** Whether a branch stays inside the one out from it (nearer the targets) on its way out to its lane: by `NEST`, or
 *  by less close to the fork, where the two leave together. */
function clearOf(inner: BoxPt[], outer: BoxPt[], f: BoxPt, side: number, toward: number): boolean {
  const mine = along(inner, 2);
  const theirs = along(outer, 2);
  for (const pt of mine) {
    const off = (pt.x - f.x) * side;
    if (off < 1) continue;
    let best: BoxPt | null = null;
    for (const other of theirs) if ((other.x - f.x) * side > 0 && (!best || Math.abs(other.x - pt.x) < Math.abs(best.x - pt.x))) best = other;
    if (best && Math.abs(best.x - pt.x) < 1.5 && (best.y - pt.y) * -toward < Math.min(NEST, off * 0.35)) return false;
  }
  return true;
}
