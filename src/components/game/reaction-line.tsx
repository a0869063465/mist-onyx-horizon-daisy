import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Glyph, Rim } from "@/components/game/monster-sheet";
import { Medal, type MedalTone } from "@/components/game/medal";
import { FlowCanvas, type BoxPt, type FlowSpec } from "@/components/game/flow-canvas";
import type { ChainOrb, FlowEnd, FlowTone } from "@/lib/reaction-chain";
import { playLine } from "@/lib/sfx";

/** Where an icon stands, in % of the board: by the edge of its card that faces the middle (`face` +1 hangs under a
 *  card of the top row, -1 sits on one of the bottom row, 0 a spell on its side's half). `ride`: where it starts
 *  (an offset in %) to ride with its lunging card; `delay`: seconds before its smoke starts. */
export type IconSpot = { x: number; y: number; face: 1 | -1 | 0; ride: { x: number; y: number } | null; delay: number };

/** Where a flow lands on a card or a player, in % of the board, and the way it arrives there. */
export type EndSpot = { x: number; y: number; into: BoxPt };

/** How an icon looks: a 3D medal (attack, block), a skill's gem with its rim, or a card's picture in a rim. */
export type IconLook =
  | { type: "medal"; tone: MedalTone; icon: string }
  | { type: "gem"; icon: string; kind: string }
  | { type: "art"; src: string | null; ring: FlowTone };

/** Icon size in % of the board's width. */
export const ICON = 10;
/** The big card shown as a spell or a skill lands: left edge, width and height of its middle, in % of the board. */
const SHOW_LEFT = 3;
const SHOW_W = 30;
const SHOW_Y = 48;
/** The big card has flown into its icon this long after it shows (seconds). What ends meanwhile waits for it: an icon
 *  fires then, and what an answer stopped fizzles a moment later, as the answer lands on it. */
const SHOW_LAND = 1.82;
const FIZZLE_AFTER = 0.35;
/** The icons fade out this long after the last one fired or fizzled. */
const FIRE_TAIL = 1.15;
const FIZZLE_TAIL = 0.8;
/** Two taps closer than this open the card. */
const DOUBLE_TAP = 380;

const toBox = (x: number, y: number): BoxPt => ({ x: x * 0.9, y: y * 1.6 });

function unitDir(dx: number, dy: number): BoxPt {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function endKey(end: FlowEnd): string {
  return "uid" in end ? `u:${end.uid}` : "face" in end ? `f:${end.face}` : `o:${end.orb}`;
}

/**
 * Icon phản ứng (chủ game 23/10, in place of the fixed reaction line): each action of the wait shows as an icon by
 * the card that makes it (a spell on its side's half, by what it answers), with smoke flowing to what it acts on. A
 * tap shows the icon's notice beside it, coloured as on the notice board; two quick taps open its card (a skill's
 * sheet opens on that skill). A spell or a skill landing shows big at the left for a moment, then flies into its icon.
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
  const pointOf = (end: FlowEnd, from: { x: number; y: number }): { x: number; y: number; into: BoxPt } | null => {
    if ("orb" in end) {
      const spot = spots.get(end.orb);
      if (!spot) return null;
      // It lands on the rim of the icon facing it (in box units the icon's radius is ICON × 0.45), so the glow is not
      // hidden under the icon.
      const dir = unitDir((spot.x - from.x) * 0.9, (spot.y - from.y) * 1.6);
      const rim = ICON * 0.45 * 0.8;
      return { x: spot.x - (dir.x * rim) / 0.9, y: spot.y - (dir.y * rim) / 1.6, into: dir };
    }
    return endOf(end, from);
  };
  const flows: FlowSpec[] = [];
  const now = performance.now() / 1000;
  for (const orb of orbs) {
    const here = spots.get(orb.id);
    if (!here) continue;
    const since = born.current.has(orb.id) ? now - born.current.get(orb.id)! : 0;
    for (const link of orb.to) {
      const start = link.from ? ("orb" in link.from ? spots.get(link.from.orb) ?? null : endOf(link.from, here)) : here;
      if (!start) continue;
      const land = pointOf(link.end, start);
      if (!land) continue;
      const faceOut = !link.from && here.face !== 0 ? { x: 0, y: here.face } : unitDir((land.x - start.x) * 0.9, (land.y - start.y) * 1.6);
      flows.push({
        key: `${orb.id}|${link.from ? endKey(link.from) : "-"}|${endKey(link.end)}`,
        a: toBox(start.x, start.y),
        b: toBox(land.x, land.y),
        out: faceOut,
        into: land.into,
        tone: link.tone,
        done: orb.done,
        end: orb.end,
        late: lateOf(orb),
        // An attack's blow is drawn on the board; only a blow into a blocker's icon surges into it (giao chiến).
        strike: orb.kind === "attack" && !("orb" in link.end),
        delay: link.from ? 0 : Math.max(0, here.delay - since),
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
        return (
          <button
            key={orb.id}
            type="button"
            className={`rx-icon is-${orb.kind} is-${look.type}${orb.done ? " is-done" : " is-live"}${orb.end ? ` is-${orb.end}` : ""}${spot.ride ? " is-riding" : ""}${tip === orb.id ? " is-tipped" : ""}`}
            data-react={react}
            style={
              {
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${ICON}cqw`,
                height: `${ICON}cqw`,
                "--late": `${lateOf(orb).toFixed(2)}s`,
                "--ring": `var(--flow-${orb.tone})`,
                ...(spot.ride ? { "--ride-x": `${spot.ride.x}cqw`, "--ride-y": `${spot.ride.y}cqh` } : {}),
              } as CSSProperties
            }
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              tapped(orb);
            }}
          >
            <IconFace look={look} />
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
              left: `${SHOW_LEFT}%`,
              top: `${SHOW_Y}%`,
              width: `${SHOW_W}cqw`,
              "--dx": showAt.x - (SHOW_LEFT + SHOW_W / 2),
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
