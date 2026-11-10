import { useId, type CSSProperties } from "react";
import type { UnitActKind } from "@/components/game/monster-sheet";
import { tr } from "@/lib/i18n";

/**
 * Chọn mục tiêu bằng 4 mũi tên (chủ game 10/11): sau khi bấm Tấn công hoặc một skill, trên lá quái đang dùng hiện 4 mũi
 * tên bay từ tâm ra phải, trái, trên, dưới (hướng không có mục tiêu thì ẩn) và một nút tròn OK ở giữa. Mũi tên dời đèn
 * neon sang mục tiêu kế theo hướng đó; OK là chọn mục tiêu đang sáng. Màu theo màu icon của nút đã bấm.
 */
export type PadDir = "up" | "down" | "left" | "right";

/** Light to dark, the stops of the arrow's fill for each kind of button (its icon's ring colour). */
const TONES: Record<UnitActKind, [string, string, string, string, string]> = {
  attack: ["#ffe7c4", "#ffa733", "#e06a00", "#6e2a00", "#ff8a00"],
  active: ["#dff6ff", "#6fd6ff", "#1f8fd0", "#0d3c66", "#3ec6ff"],
  passive: ["#f1e2ff", "#c98bff", "#8a3fd6", "#3a1066", "#b45cff"],
  risk: ["#ffe0c8", "#f08a45", "#c0520e", "#5a2204", "#e36c1c"],
  spell: ["#ffe0ec", "#ff7fb0", "#d92a6e", "#5e0a2c", "#ff4f93"],
  note: ["#fff6d0", "#ffd95a", "#d1a000", "#5e4300", "#ffd23c"],
};

const UP: Array<[number, number]> = [
  [0, -32],
  [28, -2],
  [11, -2],
  [11, 30],
  [-11, 30],
  [-11, -2],
  [-28, -2],
];
const TURN: Record<PadDir, number> = { up: 0, right: 90, down: 180, left: 270 };
const ARROW = `M${UP.map(([x, y]) => `${x} ${y}`).join("L")}Z`;

export type PadBox = { left: number; top: number; width: number; height: number };

export function AimPad({ box, kind, open, onStep, onOk }: { box: PadBox; kind: UnitActKind; open: Record<PadDir, boolean>; onStep: (dir: PadDir) => void; onOk: () => void }) {
  const id = `ap${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const tone = TONES[kind] ?? TONES.active;
  const size = Math.max(22, Math.min(34, box.width * 0.42));
  const reachX = box.width * 0.5;
  const reachY = reachX; // cả 4 mũi tên cách đều nút OK, lấy mũi tên phải làm chuẩn (chủ game 10/11)
  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();
  const defs = (
    <defs>
      <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={tone[0]} />
        <stop offset="0.3" stopColor={tone[1]} />
        <stop offset="0.66" stopColor={tone[2]} />
        <stop offset="1" stopColor={tone[3]} />
      </linearGradient>
      <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="0.48" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
  return (
    <div
      className="aim-pad"
      style={{ left: box.left + box.width / 2, top: box.top + box.height / 2, "--pad-glow": tone[4], "--pad-size": `${size}px` } as CSSProperties}
      onPointerDown={stop}
      onPointerDownCapture={stop}
    >
      {(Object.keys(TURN) as PadDir[]).map((dir) =>
        open[dir] ? (
          <button
            key={dir}
            type="button"
            className={`aim-pad-arrow is-${dir}`}
            aria-label={tr(dir === "up" ? "Lên" : dir === "down" ? "Xuống" : dir === "left" ? "Trái" : "Phải")}
            style={{ "--to-x": `${dir === "left" ? -reachX : dir === "right" ? reachX : 0}px`, "--to-y": `${dir === "up" ? -reachY : dir === "down" ? reachY : 0}px` } as CSSProperties}
            onClick={(event) => {
              event.stopPropagation();
              onStep(dir);
            }}
          >
            <svg viewBox="-34 -38 68 76" aria-hidden="true" style={{ transform: `rotate(${TURN[dir]}deg)` }}>
              {defs}
              <path d={ARROW} fill={`url(#${id}-fill)`} stroke="#ffffff" strokeWidth="3.2" strokeLinejoin="round" />
              <path d={ARROW} fill={`url(#${id}-gloss)`} />
              <path d={ARROW} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" transform="scale(0.8)" />
            </svg>
          </button>
        ) : null,
      )}
      <button
        type="button"
        className="aim-pad-ok"
        aria-label="OK"
        onClick={(event) => {
          event.stopPropagation();
          onOk();
        }}
      >
        <svg viewBox="-36 -36 72 72" aria-hidden="true">
          {defs}
          <circle r="31" fill={`url(#${id}-fill)`} stroke="#ffffff" strokeWidth="3.2" />
          <ellipse cy="-13" rx="22" ry="14" fill={`url(#${id}-gloss)`} />
          <circle r="25" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
          <text y="8" textAnchor="middle" className="aim-pad-ok-text">
            OK
          </text>
        </svg>
      </button>
    </div>
  );
}
