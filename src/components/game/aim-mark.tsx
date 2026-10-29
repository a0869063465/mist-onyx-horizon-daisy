import { useRef, useState } from "react";
import { IconFace } from "@/components/game/reaction-line";
import { spellSrc } from "@/lib/catalog";
import { spellTone } from "@/lib/reaction-chain";

/**
 * Chọn mục tiêu (video chủ game, 30/10, như LoR): a spell let go on the board waits as its icon in the middle, its short
 * line (the one its icon shows when tapped) on the left; the targets it may take glow. Dragging the icon back down to
 * the hand puts it away. `y`: the icon's height on the board (%).
 */
export function AimMark({ spellId, text, y, onDrop }: { spellId: string; text: string; y: number; onDrop: (x: number, y: number) => void }) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  return (
    <div className="aim-mark" style={{ top: `${y}%` }}>
      <p className="aim-mark-text">{text}</p>
      <button
        type="button"
        className="aim-mark-icon"
        style={drag ? { transform: `translate(calc(-50% + ${drag.x}px), calc(-50% + ${drag.y}px))` } : undefined}
        onPointerDown={(event) => {
          start.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!start.current) return;
          setDrag({ x: event.clientX - start.current.x, y: event.clientY - start.current.y });
        }}
        onPointerUp={(event) => {
          start.current = null;
          setDrag(null);
          onDrop(event.clientX, event.clientY);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDrag(null);
        }}
      >
        <IconFace look={{ type: "art", src: spellSrc(spellId), ring: spellTone(spellId) }} />
      </button>
    </div>
  );
}
