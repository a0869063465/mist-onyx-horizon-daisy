import type { BoxPt } from "@/components/game/flow-canvas";

/**
 * Dòng chảy (chủ game 29/10, hình vẽ vòi nước): the way each branch of a spread runs from its fork into its target. It
 * runs out sideways past its target, sagging back toward the one who sent it, rises beside the card and turns back in
 * to it (uốn ngược trở lại): round the outside of the end of a row into the card's outer side, up the gap between two
 * cards into the side of one behind them, or under a card straight ahead and up into its near edge from the side (a
 * flow may meet a card on any edge, anywhere). On each side the branches nest like the petals of a tulip: the inner
 * ones leave the fork rising and sag little, the outer ones leave it flat or falling and sag deeper, so none crosses
 * another.
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

/** How far outside the end of a row the outer branches rise, in % of the board's width. */
const OUTER = 3.5;
/** How much farther out a second branch up the same outer way rises. */
const LANE_STEP = 3;
/** A card closer than this (in card widths) to the fork's line is straight ahead of it. */
const AHEAD = 0.6;
/** How far up a card's side a branch meets it, from the edge facing the fork (in card heights). */
const ENTRY_UP = 1 / 3;
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
 * along `into`. `toward`: +1 if its target lies down the board from the fork, -1 if up.
 */
function wayOf(f: BoxPt, e: BoxPt, into: BoxPt, lane: number, dip: number, lift: number, side: number, toward: number, kind: Kind): BoxPt[] {
  const reach = Math.abs(lane - f.x);
  const low = { x: f.x + side * reach * 0.7, y: f.y - toward * dip };
  const out = unit(side, toward * lift);
  const first = Math.hypot(low.x - f.x, low.y - f.y);
  const rise = { x: lane, y: low.y + (e.y - low.y) * 0.3 };
  const climb = Math.abs(rise.y - low.y);
  const last = Math.hypot(e.x - rise.x, e.y - rise.y);
  // Into a card's side it bows round from its lane, as a petal's tip.
  const turnIn = last * (kind === "side" ? 0.35 : 0.3);
  return [
    f,
    { x: f.x + out.x * first * 0.45, y: f.y + out.y * first * 0.45 },
    { x: low.x - side * first * 0.35, y: low.y },
    low,
    { x: low.x + side * Math.abs(lane - low.x) * 0.55, y: low.y },
    { x: lane, y: rise.y - toward * climb * 0.55 },
    rise,
    { x: lane, y: rise.y + toward * last * 0.3 },
    { x: e.x - into.x * turnIn, y: e.y - into.y * turnIn },
    e,
  ];
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
    if (aim.card) {
      const card = aim.card;
      const near = card.y - (toward * card.h) / 2;
      lane = laneBeside(plan.col, side);
      if (plan.ahead && plan.inFront) {
        // Under the card, out nearly to its side, then up and back in to its near edge.
        kind = "near";
        lane = card.x + side * card.w * 0.45;
        entry = { x: card.x + side * card.w * 0.15, y: near };
        into = unit(-side * 0.4, toward);
      } else {
        // Up beside it and in at its side, a third of the way up from its near edge.
        kind = lane === outerLeft || lane === outerRight ? "side" : "gap";
        entry = { x: edgeOf(card, side), y: near + toward * card.h * ENTRY_UP };
        into = kind === "side" ? unit(-side, toward) : unit(-side * 0.35, toward);
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
    return { key: aim.key, side, entry, into, lane, kind };
  });

  // Branches up the same outer way: the nearer turns in first, the farther rises outside it.
  const byLane = new Map<string, typeof drafts>();
  for (const draft of drafts) {
    if (draft.kind !== "side" && draft.kind !== "ring") continue;
    const id = `${draft.side}:${draft.lane.toFixed(1)}`;
    byLane.set(id, [...(byLane.get(id) ?? []), draft]);
  }
  for (const group of byLane.values()) {
    group.sort((a, b) => Math.abs(a.entry.y - fork.y) - Math.abs(b.entry.y - fork.y));
    group.forEach((draft, index) => {
      draft.lane += draft.side * LANE_STEP * index;
    });
  }

  const f = { x: fork.x * 0.9, y: fork.y * 1.6 };
  for (const side of [-1, 1]) {
    const mine = drafts
      .filter((draft) => draft.side === side)
      .map((draft) => {
        const lane = Math.min(98.5, Math.max(1.5, draft.lane)) * 0.9;
        return { draft, lane, reach: Math.abs(lane - f.x), e: { x: draft.entry.x * 0.9, y: draft.entry.y * 1.6 } };
      })
      .sort((a, b) => a.reach - b.reach);
    if (!mine.length) continue;
    // The outermost sags deepest; it leaves the fork a little rising, or a little falling under branches nested
    // inside it.
    let outer: BoxPt[] | null = null;
    let dip = Math.min(5, Math.max(2.5, mine[mine.length - 1].reach * 0.15 + 1));
    let lift = mine.length > 1 ? -0.15 : 0.15;
    for (let i = mine.length - 1; i >= 0; i -= 1) {
      const row = mine[i];
      let path = wayOf(f, row.e, row.draft.into, row.lane, dip, lift, side, toward, row.draft.kind);
      // Nested inside the one out from it: rising out of the fork, sagging less, clear of it all the way round.
      for (let tries = 0; outer && tries < 8 && !clearOf(path, outer, f, side, toward); tries += 1) {
        dip *= 0.75;
        lift = Math.min(0.9, lift + 0.12);
        path = wayOf(f, row.e, row.draft.into, row.lane, dip, lift, side, toward, row.draft.kind);
      }
      routes.set(row.draft.key, { entry: row.draft.entry, into: row.draft.into, path });
      outer = path;
      const next = mine[i - 1];
      if (next) {
        dip = Math.max(0.6, Math.min(dip - 1, dip * (next.reach / Math.max(1, row.reach)) * 0.75));
        lift = Math.min(0.9, lift + 0.4);
      }
    }
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
