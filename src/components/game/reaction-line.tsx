import { useId, type CSSProperties, type ReactNode } from "react";
import { Glyph } from "@/components/game/monster-sheet";
import { Medal } from "@/components/game/medal";
import type { ChainOrb, FlowEnd } from "@/lib/reaction-chain";

/** A point on the board in % of its width and height; a card also gives its size, so a stream can meet its edge. */
export type BoardSpot = { x: number; y: number; w?: number; h?: number };

export type OrbLook = { src: string | null; dark: boolean; attack: boolean; tone: string };

/** The board is 9:16, so the flows are drawn in a 90 × 160 box and stay round on every phone. */
const VX = 0.9;
const VY = 1.6;
/** Orb size in % of the board's width. */
const ORB = 11.5;
const GAP = 17;

type Pt = { x: number; y: number };
type Bezier = [Pt, Pt, Pt, Pt];

/** The flow's centre line in the 90 × 160 box: an S curve between two points, or an arch under the line from the
 *  foot of one orb to the foot of another (clear of both and of the notice above the line). */
function bezierOf(a: BoardSpot, b: BoardSpot, arch: boolean): Bezier {
  const p0 = { x: a.x * VX, y: a.y * VY };
  const p3 = { x: b.x * VX, y: b.y * VY };
  if (arch) {
    const foot = 4.2;
    const drop = Math.min(26, 14 + Math.abs(p3.x - p0.x) * 0.2);
    const s = { x: p0.x, y: p0.y + foot };
    const e = { x: p3.x, y: p3.y + foot };
    const q = { x: (s.x + e.x) / 2, y: s.y + drop };
    return [s, { x: s.x + ((q.x - s.x) * 2) / 3, y: s.y + ((q.y - s.y) * 2) / 3 }, { x: e.x + ((q.x - e.x) * 2) / 3, y: e.y + ((q.y - e.y) * 2) / 3 }, e];
  }
  const dy = p3.y - p0.y;
  return [p0, { x: p0.x, y: p0.y + dy * 0.5 }, { x: p3.x, y: p3.y - dy * 0.45 }, p3];
}

function pointAt(c: Bezier, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * c[0].x + 3 * u * u * t * c[1].x + 3 * u * t * t * c[2].x + t * t * t * c[3].x,
    y: u * u * u * c[0].y + 3 * u * u * t * c[1].y + 3 * u * t * t * c[2].y + t * t * t * c[3].y,
  };
}

function slopeAt(c: Bezier, t: number): Pt {
  const u = 1 - t;
  return {
    x: 3 * u * u * (c[1].x - c[0].x) + 6 * u * t * (c[2].x - c[1].x) + 3 * t * t * (c[3].x - c[2].x),
    y: 3 * u * u * (c[1].y - c[0].y) + 6 * u * t * (c[2].y - c[1].y) + 3 * t * t * (c[3].y - c[2].y),
  };
}

/** A ribbon around the centre line: thin where it leaves, fuller in the middle, thin again where it lands, with a
 *  slight sway so it reads as a stream rather than a ruled line. */
function ribbon(c: Bezier, width: number, sway: number, phase = 0): string {
  const steps = 32;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const p = pointAt(c, t);
    const d = slopeAt(c, t);
    const len = Math.hypot(d.x, d.y) || 1;
    const nx = -d.y / len;
    const ny = d.x / len;
    const half = (width * (0.28 + 0.72 * Math.pow(Math.sin(Math.PI * t), 0.85))) / 2;
    const off = sway * Math.sin(t * Math.PI * 3 + phase) * Math.sin(Math.PI * t);
    left.push(`${(p.x + nx * (half + off)).toFixed(2)} ${(p.y + ny * (half + off)).toFixed(2)}`);
    right.push(`${(p.x - nx * (half - off)).toFixed(2)} ${(p.y - ny * (half - off)).toFixed(2)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

/** The middle of a card's lower edge (or upper edge); points that are not cards stay as they are. */
function edgeOf(spot: BoardSpot, lower: boolean): BoardSpot {
  if (!spot.h) return spot;
  return { x: spot.x, y: spot.y + (lower ? spot.h : -spot.h) * 0.46 };
}

function centre(c: Bezier): string {
  const f = (p: Pt) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  return `M${f(c[0])}C${f(c[1])} ${f(c[2])} ${f(c[3])}`;
}

/** One soft flowing stream in the reaction line's light blue, as in Runeterra: a blurred halo, a fuller body that
 *  brightens toward where it lands, a bright thread, lights running along it and a glow where it lands. */
type StreamFx = { soft: string; mid: string; run: string; land: string };

function Stream({ id, c, done, fx }: { id: string; c: Bezier; done: boolean; fx: StreamFx }) {
  const line = centre(c);
  return (
    <g className={`rx-stream${done ? " is-done" : ""}`}>
      <defs>
        <linearGradient id={`${id}-body`} gradientUnits="userSpaceOnUse" x1={c[0].x} y1={c[0].y} x2={c[3].x} y2={c[3].y}>
          <stop offset="0" stopColor="#1f9bff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#5ccaff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#c9f3ff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path className="rx-halo" d={ribbon(c, 7, 0.8)} filter={fx.soft} />
      <path className="rx-edge" d={ribbon(c, 4, 0.9)} filter={fx.mid} />
      <path className="rx-body" d={ribbon(c, 3.2, 0.9)} fill={`url(#${id}-body)`} filter={fx.mid} />
      <path className="rx-body is-twin" d={ribbon(c, 2.4, 0.9, Math.PI)} fill={`url(#${id}-body)`} filter={fx.mid} />
      <path className="rx-thread" d={line} />
      <path className="rx-run" d={line} pathLength={100} filter={fx.run} />
      <path className="rx-run is-late" d={line} pathLength={100} filter={fx.run} />
      <circle className="rx-rise" cx={c[0].x.toFixed(2)} cy={c[0].y.toFixed(2)} r="2" fill={fx.land} />
      <circle className="rx-land" cx={c[3].x.toFixed(2)} cy={c[3].y.toFixed(2)} r="4" fill={fx.land} />
    </g>
  );
}

/**
 * Thanh phản ứng kiểu Runeterra (chủ game 21/10): a glowing line across the board between the two fields with one
 * orb per action on it, newest on the left. A skill or a spell flows from its orb to what it acts on; an attack
 * flows from the attacking monster to the one it hits (chủ game 21/10). The lit orb is what is still waiting; the
 * others have done their work and stay dim. Tapping an orb opens its card. The notices of the moment show as a
 * small line by the newest orb while the notice board is hidden.
 */
export function ReactionLine({
  orbs,
  closing,
  lineY,
  x0,
  x1,
  spotOf,
  lookOf,
  note,
  noteKey,
  notePinned = false,
  onOrb,
}: {
  orbs: ChainOrb[];
  closing: boolean;
  lineY: number;
  x0: number;
  x1: number;
  spotOf: (end: FlowEnd) => BoardSpot | null;
  lookOf: (orb: ChainOrb) => OrbLook;
  note: ReactNode;
  noteKey: string;
  /** A notice picked from the history stays; the others fade. */
  notePinned?: boolean;
  onOrb: (orb: ChainOrb) => void;
}) {
  const uid = `rx${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const span = x1 - x0 - ORB * 1.2;
  const gap = orbs.length > 1 ? Math.min(GAP, span / (orbs.length - 1)) : GAP;
  const at = new Map(orbs.map((orb, index) => [orb.id, { x: x1 - ORB * 0.6 - index * gap, y: lineY }]));
  const endOf = (end: FlowEnd): BoardSpot | null => ("orb" in end ? at.get(end.orb) ?? null : spotOf(end));
  const newest = orbs.length ? at.get(orbs[orbs.length - 1].id)! : { x: x1 - ORB * 0.6, y: lineY };
  const noteLeft = Math.min(Math.max(newest.x, x0 + 18), x1 - 18);
  const fx: StreamFx = { soft: `url(#${uid}-soft)`, mid: `url(#${uid}-mid)`, run: `url(#${uid}-run)`, land: `url(#${uid}-land)` };

  return (
    <div className={`rx${closing ? " is-closing" : ""}`}>
      <div className="rx-veil" style={{ "--rx-y": `${lineY}%` } as CSSProperties} />
      <div className="rx-line" style={{ left: `${x0}%`, width: `${x1 - x0}%`, top: `${lineY}%` }} />
      <svg className="rx-flows" viewBox="0 0 90 160" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id={`${uid}-soft`} filterUnits="userSpaceOnUse" x="-20" y="-20" width="130" height="200">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          <filter id={`${uid}-mid`} filterUnits="userSpaceOnUse" x="-20" y="-20" width="130" height="200">
            <feGaussianBlur stdDeviation="0.45" />
          </filter>
          <filter id={`${uid}-run`} filterUnits="userSpaceOnUse" x="-20" y="-20" width="130" height="200">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
          <radialGradient id={`${uid}-land`}>
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#a6e8ff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#4fbaff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g>
          {orbs.flatMap((orb) => {
            const here = at.get(orb.id)!;
            const outs = orb.to.map((end) => ({ end, spot: endOf(end) })).filter((row): row is { end: FlowEnd; spot: BoardSpot } => Boolean(row.spot));
            // An attack flows from the attacker to what it hits; anything else from its orb.
            const starts = orb.kind === "attack" ? orb.from.map((end) => endOf(end)).filter((spot): spot is BoardSpot => Boolean(spot)) : [here];
            return starts.flatMap((start, s) =>
              outs.map(({ end, spot }, index) => {
                const arch = "orb" in end;
                // A stream leaves a card from the edge that faces its target and lands on the edge that faces it.
                const down = spot.y > start.y;
                const from = arch ? start : edgeOf(start, down);
                const to = arch ? spot : edgeOf(spot, !down);
                return <Stream key={`${orb.id}-${s}-${index}`} id={`${uid}-${orb.id}-${s}-${index}`} c={bezierOf(from, to, arch)} done={orb.done} fx={fx} />;
              }),
            );
          })}
        </g>
      </svg>
      {orbs.map((orb) => {
        const look = lookOf(orb);
        const here = at.get(orb.id)!;
        return (
          <button
            key={orb.id}
            type="button"
            className={`rx-orb is-${look.attack ? "attack" : orb.kind}${orb.done ? " is-done" : " is-live"}`}
            style={{ left: `${here.x}%`, top: `${here.y}%`, width: `${ORB}cqw`, height: `${ORB}cqw`, "--tone": look.tone } as CSSProperties}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onOrb(orb);
            }}
          >
            {look.attack ? (
              <Medal tone="orange" icon="sword-brandish" />
            ) : (
              <span className="rx-face">
                {look.src ? <img src={look.src} alt="" draggable={false} style={look.dark ? { filter: "brightness(0)" } : undefined} /> : null}
                {look.dark ? <i className="rx-hidden">?</i> : null}
                {orb.kind === "skill" && !look.dark ? (
                  <i className="rx-badge">
                    <Glyph name="sparkles" />
                  </i>
                ) : null}
              </span>
            )}
          </button>
        );
      })}
      {note ? (
        <p key={noteKey} className={`rx-note${notePinned ? " is-pinned" : ""}`} style={{ left: `${noteLeft}%`, top: `${lineY}%` }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
