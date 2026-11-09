import { useId } from "react";
import { tr } from "@/lib/i18n";

/**
 * Mũi tên vàng chọn hàng khi triệu hồi (chủ game 28/10): ↑ hàng trước, ↓ hàng sau. Hiện trên lá quái vừa bấm một lần
 * trên tay, và hai bên nút Triệu hồi (bảng quái, Hiến tế, quái dung hợp). Hàng không nhận được quái thì mũi tên tối,
 * không bấm được.
 */
export type SummonRow = "front" | "back";

/** The arrow pointing up; the down arrow is the same shape turned upside down, lit from the top all the same. */
const UP: Array<[number, number]> = [
  [0, -32],
  [28, -2],
  [11, -2],
  [11, 30],
  [-11, 30],
  [-11, -2],
  [-28, -2],
];

function shape(row: SummonRow) {
  const flip = row === "back" ? -1 : 1;
  return `M${UP.map(([x, y]) => `${x} ${y * flip}`).join("L")}Z`;
}

export function RowArrow({ row, off = false, onPick }: { row: SummonRow; off?: boolean; onPick: () => void }) {
  const id = `ra${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const d = shape(row);
  return (
    <button
      type="button"
      className={`row-arrow is-${row}${off ? " is-off" : ""}`}
      aria-label={tr(row === "front" ? "Hàng trước" : "Hàng sau")}
      aria-disabled={off || undefined}
      onClick={(event) => {
        event.stopPropagation();
        if (!off) onPick();
      }}
    >
      <svg viewBox="-34 -38 68 76" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={row === "front" ? "#ffe3de" : "#e0f0ff"} />
            <stop offset="0.3" stopColor={row === "front" ? "#ff7a6b" : "#6ab4f2"} />
            <stop offset="0.66" stopColor={row === "front" ? "#d93a2e" : "#2f7fd0"} />
            <stop offset="1" stopColor={row === "front" ? "#6e1410" : "#123f78"} />
          </linearGradient>
          <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="0.48" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}-in`}>
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill={`url(#${id}-gold)`} stroke="#ffffff" strokeWidth="3.2" strokeLinejoin="round" />
        <g clipPath={`url(#${id}-in)`}>
          <rect x="-34" y="-38" width="68" height="76" fill={`url(#${id}-gloss)`} />
          <path d={d} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" transform="scale(0.8)" />
        </g>
      </svg>
    </button>
  );
}
