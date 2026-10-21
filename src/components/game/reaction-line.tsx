import type { CSSProperties, ReactNode } from "react";
import { Glyph } from "@/components/game/monster-sheet";
import { Medal } from "@/components/game/medal";
import type { ChainOrb, FlowEnd } from "@/lib/reaction-chain";

/** A point on the board in % of its width and height. */
export type BoardSpot = { x: number; y: number };

export type OrbLook = { src: string | null; dark: boolean; attack: boolean; tone: string };

/** The board is 9:16, so the flows are drawn in a 90 × 160 box and stay round on every phone. */
const VX = 0.9;
const VY = 1.6;
/** Orb size in % of the board's width. */
const ORB = 11.5;
const GAP = 17;

function curve(a: BoardSpot, b: BoardSpot): string {
  const ax = a.x * VX;
  const ay = a.y * VY;
  const bx = b.x * VX;
  const by = b.y * VY;
  if (Math.abs(by - ay) < 6) {
    // Orb to orb on the line: an arch under it, from the foot of one orb to the foot of the other, clear of both
    // and of the notice above the line.
    const foot = 4.2;
    const drop = Math.min(26, 14 + Math.abs(bx - ax) * 0.2);
    return `M${ax.toFixed(2)} ${(ay + foot).toFixed(2)}Q${((ax + bx) / 2).toFixed(2)} ${(ay + foot + drop).toFixed(2)} ${bx.toFixed(2)} ${(by + foot).toFixed(2)}`;
  }
  const dy = by - ay;
  return `M${ax.toFixed(2)} ${ay.toFixed(2)}C${ax.toFixed(2)} ${(ay + dy * 0.5).toFixed(2)} ${bx.toFixed(2)} ${(by - dy * 0.45).toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
}

/**
 * Thanh phản ứng kiểu Runeterra (chủ game 21/10): a glowing line across the board between the two fields, one orb
 * per action on it, newest on the left, and flows from the acting monster into its orb and from the orb to what it
 * acts on. The lit orb is what is still waiting; the others have done their work and stay dim. Tapping an orb opens
 * its card. The notices of the moment show as a small line by the newest orb while the notice board is hidden.
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
  const span = x1 - x0 - ORB * 1.2;
  const gap = orbs.length > 1 ? Math.min(GAP, span / (orbs.length - 1)) : GAP;
  const at = new Map(orbs.map((orb, index) => [orb.id, { x: x1 - ORB * 0.6 - index * gap, y: lineY }]));
  const endOf = (end: FlowEnd): BoardSpot | null => ("orb" in end ? at.get(end.orb) ?? null : spotOf(end));
  const newest = orbs.length ? at.get(orbs[orbs.length - 1].id)! : { x: x1 - ORB * 0.6, y: lineY };
  const noteLeft = Math.min(Math.max(newest.x, x0 + 18), x1 - 18);

  return (
    <div className={`rx${closing ? " is-closing" : ""}`}>
      <div className="rx-veil" style={{ "--rx-y": `${lineY}%` } as CSSProperties} />
      <div className="rx-line" style={{ left: `${x0}%`, width: `${x1 - x0}%`, top: `${lineY}%` }} />
      <svg className="rx-flows" viewBox="0 0 90 160" preserveAspectRatio="none" aria-hidden="true">
        {orbs.map((orb) => {
          const look = lookOf(orb);
          const here = at.get(orb.id)!;
          const ins = orb.from.map((end) => endOf(end)).filter((spot): spot is BoardSpot => Boolean(spot));
          const outs = orb.to.map((end) => endOf(end)).filter((spot): spot is BoardSpot => Boolean(spot));
          return (
            <g key={orb.id} className={`rx-flow${orb.done ? " is-done" : ""}`} style={{ "--tone": look.tone } as CSSProperties}>
              {ins.map((spot, index) => (
                <g key={`i${index}`}>
                  <path className="rx-glow" d={curve(spot, here)} />
                  <path className="rx-core" d={curve(spot, here)} />
                </g>
              ))}
              {outs.map((spot, index) => (
                <g key={`o${index}`}>
                  <path className="rx-glow" d={curve(here, spot)} />
                  <path className="rx-core" d={curve(here, spot)} />
                  <circle className="rx-tip" cx={(spot.x * VX).toFixed(2)} cy={(spot.y * VY).toFixed(2)} r="1.5" />
                </g>
              ))}
            </g>
          );
        })}
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
              <Medal tone="orange" icon="broadsword" />
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
