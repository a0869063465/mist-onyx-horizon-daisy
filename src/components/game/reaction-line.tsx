import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Glyph, Rim } from "@/components/game/monster-sheet";
import { Medal, type MedalTone } from "@/components/game/medal";
import { FlowCanvas, type BoxPt, type FlowSpec, type Moat } from "@/components/game/flow-canvas";
import type { Side } from "@/lib/duel";
import { fanRoutes, type FanAim, type FanCard } from "@/lib/fan-plan";
import type { ChainOrb, FlowEnd, FlowLink, FlowTone } from "@/lib/reaction-chain";
import { playLine } from "@/lib/sfx";

/** Where an icon stands, in % of the board: just clear of the edge of its card that faces the middle (`face` +1 under
 *  a card of the top row, -1 over one of the bottom row, 0 a spell on its side's half). `delay`: seconds before its
 *  light starts (an attacker still lunging); `appear`: seconds before the icon itself fades in, after its light. */
export type IconSpot = { x: number; y: number; face: 1 | -1 | 0; delay: number; appear: number };

/** Where a flow lands on a card or a player, in % of the board, and the way it arrives there; `moat` what it runs
 *  round there (dòng chảy đợt 2): the card's box (its middle and size) or a ring round a player (radius in % of the
 *  board's width). */
export type EndSpot = { x: number; y: number; into: BoxPt; moat?: { kind: "box"; x: number; y: number; w: number; h: number } | { kind: "ring"; x: number; y: number; r: number } };

/** A point on the board in % of it. */
export type BoardPt = { x: number; y: number };

/** Where a spread splits, and the three cards' places of the front row it is aimed at (middles and sizes). */
export type ForkSpot = BoardPt & { front: FanCard[] };

/** How an icon looks: a 3D medal (attack, block), a skill's gem with its rim, or a card's picture in a rim. */
export type IconLook =
  | { type: "medal"; tone: MedalTone; icon: string }
  | { type: "gem"; icon: string; kind: string }
  | { type: "art"; src: string | null; ring: FlowTone };

/** Icon size in % of the board's width. */
export const ICON = 10;
/** The big card shown as a spell or a skill lands, in % of the board: its left edge on either side, its width and the
 *  height of its middle. It stands in the middle band on the side away from its icon (chủ game 23/10), so it covers
 *  neither the icon nor its card and is seen flying in: an icon on the left half sends it right, else left. */
const SHOW_LEFT = 3;
const SHOW_RIGHT = 52;
const SHOW_W = 30;
const SHOW_Y = 46;
const showLeft = (iconX: number) => (iconX < 45 ? SHOW_RIGHT : SHOW_LEFT);
/** The big card has flown into its icon this long after it shows (seconds). What ends meanwhile waits for it: an icon
 *  fires then, and what an answer stopped fizzles a moment later, as the answer lands on it. */
const SHOW_LAND = 1.82;
const FIZZLE_AFTER = 0.35;
/** The icons fade out this long after the last one fired or fizzled. */
const FIRE_TAIL = 1.15;
const FIZZLE_TAIL = 0.8;
/** Two taps closer than this open the card. */
const DOUBLE_TAP = 380;
/** Seconds a spell that stops a flow takes to fly in from the hand. */
const THROW = 0.5;

const toBox = (x: number, y: number): BoxPt => ({ x: x * 0.9, y: y * 1.6 });

/** The moat of a landing spot, in box units. */
function moatOf(spot: EndSpot): Moat | null {
  const moat = spot.moat;
  if (!moat) return null;
  if (moat.kind === "ring") return { kind: "ring", c: toBox(moat.x, moat.y), r: moat.r * 0.9 };
  return { kind: "box", c: toBox(moat.x, moat.y), half: { x: (moat.w / 2) * 0.9, y: (moat.h / 2) * 1.6 } };
}

/** The ring round an icon a flow wraps (Hấp thụ ma pháp round the spell it takes). */
const ICON_RING = ICON * 0.45 * 0.9;

function unitDir(dx: number, dy: number): BoxPt {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function endKey(end: FlowEnd): string {
  return "uid" in end ? `u:${end.uid}` : "face" in end ? `f:${end.face}` : `o:${end.orb}`;
}

/** A flow's key: its icon, where it leaves from (a fork, another place, or the icon) and where it lands. */
function keyOf(orb: ChainOrb, link: FlowLink): string {
  return `${orb.id}|${link.fork ? "fork" : link.from ? endKey(link.from) : "-"}|${endKey(link.end)}`;
}

/** Which way a flow back from one place to another swings round (+1 to its left-hand side): toward the middle of the
 *  board, where there is room. */
function swingOf(from: BoardPt, to: BoardPt): number {
  const dx = (to.x - from.x) * 0.9;
  const dy = (to.y - from.y) * 1.6;
  const len = Math.hypot(dx, dy) || 1;
  const mx = ((from.x + to.x) / 2) * 0.9;
  const my = ((from.y + to.y) / 2) * 1.6;
  return Math.sign((-dy / len) * (45 - mx) + (dx / len) * (80 - my)) || 1;
}

/**
 * Icon phản ứng (chủ game 23/10, in place of the fixed reaction line): each action of the wait shows as an icon by
 * the card that makes it (a spell on its side's half, by what it answers), with smoke flowing to what it acts on. A
 * tap shows the icon's notice beside it, coloured as on the notice board; two quick taps open its card (a skill's
 * sheet opens on that skill). A spell or a skill landing shows big on the side away from its icon for a moment, then
 * flies into it.
 */
export function ReactionLine({
  orbs,
  closing,
  spots,
  endOf,
  lookOf,
  noteOf,
  hint,
  hintKey,
  hintPinned = false,
  cardOf,
  onSheet,
  onClosed,
  cracked,
  aimless,
  forkOf,
  throwFrom,
}: {
  orbs: ChainOrb[];
  closing: boolean;
  spots: ReadonlyMap<string, IconSpot>;
  /** Where a flow lands on a card or a player, coming from a point (in % of the board). */
  endOf: (end: FlowEnd, from: { x: number; y: number }) => EndSpot | null;
  lookOf: (orb: ChainOrb) => IconLook;
  /** The icon's notice, coloured as on the notice board. */
  noteOf: (orb: ChainOrb) => ReactNode;
  /** A prompt to the player (a wrong move, a pick to make): a small line in the middle for a few seconds. */
  hint: ReactNode;
  hintKey: string;
  /** A notice picked from the history stays. */
  hintPinned?: boolean;
  /** The big card for an icon (a spell, or a monster with its skill's name); null shows none. */
  cardOf: (orb: ChainOrb) => ReactNode;
  /** Two quick taps: the icon's card. */
  onSheet: (orb: ChainOrb) => void;
  /** The icons have faded out after the wait ended. */
  onClosed: () => void;
  /** Con mắt (hàng chờ, chủ game 28/10): queued icons that have gone through in the preview show as cracks. */
  cracked?: ReadonlySet<string>;
  /** In the preview, a queued icon whose roll is still to come keeps its face but has no target yet. */
  aimless?: ReadonlySet<string>;
  /** Dòng chảy đợt 2: where a spread aimed at a side splits, just in front of that side's row. */
  forkOf: (orb: ChainOrb, from: BoardPt) => ForkSpot | null;
  /** Where a spell that stops a flow flies in from: its owner's hand. */
  throwFrom: (side: Side) => BoardPt;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const lastTap = useRef<{ id: string; at: number } | null>(null);
  // A spell or a skill landing shows big at the left for a moment (chủ game 21/10, câu 5), then flies into its icon;
  // what ends meanwhile waits for it (`late`). Each icon sounds once as it shows, and once as it fires or fizzles.
  // Worked out before the screen paints, so nothing flashes without its delay first.
  const [show, setShow] = useState<string | null>(null);
  const [late, setLate] = useState<ReadonlyMap<string, number>>(() => new Map());
  const heard = useRef(new Map<string, ChainOrb["end"]>());
  /** When each icon showed (seconds): a flow that turns later (into a blocker) does not wait for the lunge again. */
  const born = useRef(new Map<string, number>());
  const showing = useRef<{ id: string; at: number } | null>(null);
  useLayoutEffect(() => {
    const now = performance.now() / 1000;
    let landed: ChainOrb | null = null;
    const ended: ChainOrb[] = [];
    for (const orb of orbs) {
      const known = heard.current.has(orb.id);
      const was = heard.current.get(orb.id) ?? null;
      heard.current.set(orb.id, orb.end);
      if (!known) {
        landed = orb;
        born.current.set(orb.id, now);
        if (orb.kind !== "attack") playLine("orb");
      }
      if (orb.end && orb.end !== was) ended.push(orb);
    }
    if (landed && cardOf(landed)) {
      showing.current = { id: landed.id, at: now };
      setShow(landed.id);
    }
    const land = showing.current ? Math.max(0, showing.current.at + SHOW_LAND - now) : 0;
    const delays = ended.map((orb) => [orb.id, land > 0 ? land + (orb.end === "fizzle" ? FIZZLE_AFTER : 0) : 0] as const);
    if (land > 0 && delays.length) setLate((map) => new Map([...map, ...delays]));
    for (const [index, orb] of ended.entries()) playLine(orb.end!, delays[index][1] + (orb.end === "fire" ? 0.1 : 0.08));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbs]);
  const lateOf = (orb: ChainOrb) => late.get(orb.id) ?? 0;
  const close = Math.max(FIRE_TAIL, ...orbs.map((orb) => lateOf(orb) + (orb.end === "fizzle" ? FIZZLE_TAIL : FIRE_TAIL)));

  // The smoke: every flow of every icon, from its icon (or where it says it leaves from) to where it lands.
  const pointOf = (link: FlowLink, from: { x: number; y: number }): EndSpot | null => {
    const end = link.end;
    if ("orb" in end) {
      const spot = spots.get(end.orb);
      if (!spot) return null;
      const dir = unitDir((spot.x - from.x) * 0.9, (spot.y - from.y) * 1.6);
      // Wrapping an icon, it runs into a ring round it (Hấp thụ ma pháp round the spell it takes).
      if (link.wrap) return { x: spot.x, y: spot.y, into: dir, moat: { kind: "ring", x: spot.x, y: spot.y, r: ICON_RING / 0.9 } };
      // It lands on the rim of the icon facing it (in box units the icon's radius is ICON × 0.45), so the glow is not
      // hidden under the icon; a dam a little further out, on the wall the icon makes.
      const rim = ICON * 0.45 * (link.dam ? 0.95 : 0.8);
      return { x: spot.x - (dir.x * rim) / 0.9, y: spot.y - (dir.y * rim) / 1.6, into: dir };
    }
    return endOf(end, from);
  };
  const flows: FlowSpec[] = [];
  const now = performance.now() / 1000;
  /** An icon that a live flow surges against: it stands as a wall, bright, while that flow waits. */
  const walls = new Set<string>();
  // Two flows running opposite ways between the same places (chủ game 29/10): a skill thrown back (Giáp cơ khí, Lá
  // chắn phản đòn), or a spell that stops an attack striking back at the attacker (Gương phòng hộ, Vòng nguyền rủa ác
  // ma). The way back swings round the side with more room, toward the middle of the board, and lands on that side of
  // its card; the way in bows a little the other way. A thrown skill's way back runs on once its way in has reached
  // the icon.
  const backs = new Map<string, { swing: number; after?: string; wide: boolean }>();
  const arcs = new Map<string, number>();
  for (const orb of orbs) {
    const thrown = orb.to.find((link) => link.back && link.from && "orb" in link.from);
    if (thrown?.from && "orb" in thrown.from) {
      const turn = thrown.from.orb;
      const from = spots.get(turn);
      const to = from ? endOf(thrown.end, from) : null;
      const wayIn = orb.to.find((link) => !link.from && "orb" in link.end && link.end.orb === turn);
      if (from && to) {
        const swing = swingOf(from, to);
        backs.set(keyOf(orb, thrown), { swing, after: wayIn ? keyOf(orb, wayIn) : undefined, wide: true });
        if (wayIn) arcs.set(keyOf(orb, wayIn), swing * 0.35);
      }
    }
    const stopped = orb.stops ? orbs.find((other) => other.id === orb.stops) ?? null : null;
    const struck = stopped?.source ?? null;
    const back = struck ? orb.to.find((link) => !link.from && "uid" in link.end && link.end.uid === struck) : undefined;
    const from = back ? spots.get(orb.id) : undefined;
    const to = back && from ? endOf(back.end, from) : null;
    if (stopped && back && from && to) {
      const swing = swingOf(from, to);
      backs.set(keyOf(orb, back), { swing, wide: false });
      const wayIn = stopped.to.find((link) => link.dam && "orb" in link.end && link.end.orb === orb.id);
      if (wayIn) arcs.set(keyOf(stopped, wayIn), swing * 0.35);
    }
  }
  for (const orb of orbs) {
    const here = spots.get(orb.id);
    if (!here || cracked?.has(orb.id)) continue;
    const since = born.current.has(orb.id) ? now - born.current.get(orb.id)! : 0;
    const wait = Math.max(0, here.delay - since);
    // A spell that stops a flow sends its own light once it has flown in from the hand.
    const thrownIn = orb.stops ? Math.max(0, THROW - since) : 0;
    const late = lateOf(orb);
    // A roll that hit nobody fades with its icon at once (chủ game 29/10).
    const done = orb.done || Boolean(orb.miss);
    const end = orb.miss && !orb.end ? ("fizzle" as const) : orb.end;
    // A spread runs to the fork in front of the row it splits at, then a branch to each it lands on.
    const fork = orb.spread !== undefined && orb.spread !== null ? forkOf(orb, here) : null;
    const trunk = fork ? `${orb.id}|fork` : "";
    if (fork) {
      flows.push({
        key: trunk,
        a: toBox(here.x, here.y),
        b: toBox(fork.x, fork.y),
        out: here.face !== 0 ? { x: 0, y: here.face } : unitDir((fork.x - here.x) * 0.9, (fork.y - here.y) * 1.6),
        into: unitDir((fork.x - here.x) * 0.9, (fork.y - here.y) * 1.6),
        tone: orb.tone,
        done,
        end,
        late,
        strike: false,
        delay: wait,
        land: "none",
        // The trunk of a spread widens half as much as a flow at one target (chủ game 29/10).
        tail: 0.5,
      });
    }
    // How each branch runs from the fork (hình vẽ vòi nước của chủ game, 29/10): out past its target, sagging back,
    // then up beside it and back in to it, on whichever edge suits.
    const aims: FanAim[] = [];
    if (fork) {
      for (const link of orb.to) {
        if (!link.fork) continue;
        const land = pointOf(link, fork);
        if (!land) continue;
        const moat = land.moat;
        aims.push({
          key: keyOf(orb, link),
          card: moat?.kind === "box" ? { x: moat.x, y: moat.y, w: moat.w, h: moat.h } : undefined,
          ring: moat?.kind === "ring" ? { x: moat.x, y: moat.y, r: moat.r } : undefined,
          point: moat ? undefined : { x: land.x, y: land.y },
        });
      }
    }
    const routes = fork ? fanRoutes(fork, aims, fork.front) : null;
    for (const link of orb.to) {
      if (link.fork && !fork) continue;
      const start = link.fork ? fork : link.from ? ("orb" in link.from ? spots.get(link.from.orb) ?? null : endOf(link.from, here)) : here;
      if (!start) continue;
      let land = pointOf(link, start);
      if (!land) continue;
      const key = keyOf(orb, link);
      const way = backs.get(key);
      const route = link.fork ? routes?.get(key) : undefined;
      if (route) land = { ...land, x: route.entry.x, y: route.entry.y, into: route.into };
      // The way back lands on the side of its target it swings round to, not under the icon it left from.
      if (way && land.moat?.kind === "box") {
        const dx = (land.x - start.x) * 0.9;
        const dy = (land.y - start.y) * 1.6;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * way.swing;
        const ny = (dx / len) * way.swing;
        const box = land.moat;
        land =
          Math.abs(nx) >= Math.abs(ny)
            ? { ...land, x: box.x + (Math.sign(nx) * box.w) / 2, y: box.y, into: { x: -Math.sign(nx), y: 0 } }
            : { ...land, x: box.x, y: box.y + (Math.sign(ny) * box.h) / 2, into: { x: 0, y: -Math.sign(ny) } };
      }
      const toward = unitDir((land.x - start.x) * 0.9, (land.y - start.y) * 1.6);
      const faceOut = !link.fork && !link.from && here.face !== 0 ? { x: 0, y: here.face } : toward;
      if (link.dam && "orb" in link.end && !done) walls.add(link.end.orb);
      // A flow into what stops it waits for the spell to fly in from the hand.
      const stopper = link.dam && "orb" in link.end ? orbs.find((other) => other.id === (link.end as { orb: string }).orb && other.stops) : undefined;
      const flyWait = stopper && born.current.has(stopper.id) ? Math.max(0, THROW - (now - born.current.get(stopper.id)!)) : 0;
      flows.push({
        key,
        a: toBox(start.x, start.y),
        b: toBox(land.x, land.y),
        out: faceOut,
        into: land.into,
        tone: link.tone,
        done,
        end,
        late,
        // An attack's blow is drawn on the board; only a blow into a blocker's icon surges into it (giao chiến).
        strike: orb.kind === "attack" && !("orb" in link.end),
        delay: link.from || link.fork ? flyWait : Math.max(wait, flyWait, thrownIn),
        land: link.dam ? "dam" : "flare",
        moat: moatOf(land),
        path: route?.path,
        // Each arcs to its own left-hand side, and the two run opposite ways: in on one side, back round the other. A
        // curse's or a mirror's way back to the attacker (no damage) takes a third of the arc and half the tail.
        arc: way ? way.swing * (way.wide ? 1.1 : 1.1 / 3) : arcs.get(key),
        after: link.fork ? trunk : way?.after,
        tail: way && !way.wide ? 0.5 : 1,
      });
    }
  }

  const tapped = (orb: ChainOrb) => {
    const now = performance.now();
    const last = lastTap.current;
    if (last && last.id === orb.id && now - last.at < DOUBLE_TAP) {
      lastTap.current = null;
      setTip(null);
      onSheet(orb);
      return;
    }
    lastTap.current = { id: orb.id, at: now };
    setTip((current) => (current === orb.id ? null : orb.id));
  };

  const shown = show ? orbs.find((orb) => orb.id === show) ?? null : null;
  const showAt = shown ? spots.get(shown.id) : null;
  const tipOrb = tip ? orbs.find((orb) => orb.id === tip) ?? null : null;
  const tipAt = tipOrb ? spots.get(tipOrb.id) : null;

  return (
    <div
      className={`rx${closing ? " is-closing" : ""}`}
      style={{ "--close": `${close.toFixed(2)}s` } as CSSProperties}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && event.animationName === "rx-out") onClosed();
      }}
    >
      <FlowCanvas flows={flows} />
      {orbs.map((orb) => {
        const spot = spots.get(orb.id);
        if (!spot) return null;
        const look = lookOf(orb);
        const react = orb.kind === "attack" ? "attack" : orb.kind === "skill" ? "skill" : orb.kind === "block" ? "block" : undefined;
        // A spell that stops a flow flies in from its owner's hand to stand in that flow's way (chủ game 29/10).
        const hand = orb.stops ? throwFrom(orb.side) : null;
        return (
          <button
            key={orb.id}
            type="button"
            className={`rx-icon is-${orb.kind} is-${look.type}${orb.done && !walls.has(orb.id) ? " is-done" : " is-live"}${orb.end ? ` is-${orb.end}` : ""}${spot.appear > 0 ? " is-dawn" : ""}${tip === orb.id ? " is-tipped" : ""}${cracked?.has(orb.id) ? " is-cracked" : ""}${hand ? " is-thrown" : ""}${walls.has(orb.id) ? " is-wall" : ""}${orb.miss ? " is-miss" : ""}`}
            data-react={react}
            style={
              {
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${ICON}cqw`,
                height: `${ICON}cqw`,
                "--late": `${lateOf(orb).toFixed(2)}s`,
                "--ring": `var(--flow-${orb.tone})`,
                "--appear": `${spot.appear.toFixed(2)}s`,
                ...(hand ? { "--hx": `${(hand.x - spot.x).toFixed(2)}cqw`, "--hy": `${(hand.y - spot.y).toFixed(2)}cqh` } : {}),
              } as CSSProperties
            }
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              tapped(orb);
            }}
          >
            {cracked?.has(orb.id) ? <CrackFace /> : <IconFace look={look} />}
          </button>
        );
      })}
      {tipOrb && tipAt ? (
        <p
          key={tipOrb.id}
          className={`rx-tip${tipAt.y > 48 ? " is-above" : " is-below"}`}
          style={{ left: `${Math.min(Math.max(tipAt.x, 22), 78)}%`, top: `${tipAt.y}%` }}
          onClick={() => setTip(null)}
        >
          {noteOf(tipOrb)}
        </p>
      ) : null}
      {hint ? (
        <p key={hintKey} className={`rx-hint${hintPinned ? " is-pinned" : ""}`}>
          {hint}
        </p>
      ) : null}
      {shown && showAt ? (
        <div
          key={shown.id}
          className="rx-show"
          style={
            {
              left: `${showLeft(showAt.x)}%`,
              top: `${SHOW_Y}%`,
              width: `${SHOW_W}cqw`,
              "--from": showLeft(showAt.x) === SHOW_LEFT ? "-30%" : "30%",
              "--dx": showAt.x - (showLeft(showAt.x) + SHOW_W / 2),
              "--dy": showAt.y - SHOW_Y,
              "--shrink": ICON / SHOW_W,
            } as CSSProperties
          }
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            showing.current = null;
            setShow(null);
          }}
        >
          {cardOf(shown)}
        </div>
      ) : null}
    </div>
  );
}

/** A queued icon that has gone through in the eye's preview: a dark hole with cracks running out of it. */
function CrackFace() {
  const rays = [
    "M50 50L50 6L46 18L53 26",
    "M50 50L88 24L76 30L80 40",
    "M50 50L93 60L82 58L86 70",
    "M50 50L66 94L62 82L54 88",
    "M50 50L20 90L28 80L18 76",
    "M50 50L6 56L18 52L12 42",
    "M50 50L16 14L26 22L30 12",
  ];
  return (
    <svg className="rx-crack" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="30" fill="rgba(4, 8, 18, 0.88)" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(120, 190, 255, 0.55)" strokeWidth="1.4" />
      {rays.map((d) => (
        <path key={d} d={d} fill="none" stroke="rgba(150, 210, 255, 0.85)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      <circle cx="50" cy="50" r="13" fill="#02040b" />
    </svg>
  );
}

/** The face of an icon: a medal, a skill's gem in its kind's rim, or a picture in a rim of its smoke's colour. */
function IconFace({ look }: { look: IconLook }) {
  if (look.type === "medal") return <Medal tone={look.tone} icon={look.icon} />;
  if (look.type === "gem") {
    return (
      <span className={`rx-gem is-${look.kind}`}>
        <span className="rx-gem-core">
          <Glyph name={look.icon} />
        </span>
        <Rim kind={look.kind} />
      </span>
    );
  }
  return (
    <span className="rx-art">
      <span className="rx-art-pic">{look.src ? <img src={look.src} alt="" draggable={false} /> : null}</span>
      <Rim kind={`flow-${look.ring}`} />
    </span>
  );
}
