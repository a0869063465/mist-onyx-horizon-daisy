/** Kinds of mark on the reaction bar (thanh phản ứng). */
export type ReactMark = "attack" | "block" | "skill" | "buff" | "chain" | "skull" | "rebound";

/** The reaction bar's icons; the spell kinds on the deck builder and spell sheet reuse them. */
export function ReactGlyph({ kind }: { kind: ReactMark }) {
  if (kind === "attack") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path d="M6 26 L20 8 L23 11 L9 29 Z" fill="currentColor" />
        <path d="M18 6 L26 4 L24 12 Z" fill="currentColor" />
        <path d="M8 22 L14 28" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "block") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path d="M16 3 L27 8 V16 C27 23 16 29 16 29 C16 29 5 23 5 16 V8 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M11 16 L15 20 L22 12" fill="none" stroke="currentColor" strokeWidth="2.4" />
      </svg>
    );
  }
  if (kind === "chain") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <rect x="4" y="12" width="12" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <rect x="16" y="12" width="12" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="2.4" />
      </svg>
    );
  }
  if (kind === "skull") {
    return <img src="/fx/skull.png" alt="" draggable={false} />;
  }
  if (kind === "rebound") {
    return <img src="/fx/rebound.png" alt="" draggable={false} />;
  }
  if (kind === "skill") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path d="M18 2 L8 18 H15 L13 30 L25 13 H18 Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path d="M16 4 L18.5 13 H28 L20.5 18.5 L23 28 L16 22.5 L9 28 L11.5 18.5 L4 13 H13.5 Z" fill="currentColor" />
    </svg>
  );
}
