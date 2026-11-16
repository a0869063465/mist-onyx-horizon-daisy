import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Quái bị hạ (chủ game 16/11, video Grok `41a2d123`): lá chói sáng một nhịp rồi vỡ thành mảnh, loé vàng ở giữa, mảnh bay ra
 * và mờ dần. Lá hồng trong video chỉ là màu giữ chỗ: `vo-mask.webp` (alpha = phần hồng) khoét chính lá thật nên mỗi mảnh
 * mang hình lá; lá thật phồng theo độ nở của mảnh (`SCALES`, đo từ video) để hình bám theo mảnh. `vo-sang.webp` là phần
 * sáng (loé vàng, viền chói). Hai tấm là 9 × 6 khung 256 px, 24 khung mỗi giây, khung 7 là lúc vỡ.
 */
const FRAMES = 54;
const COLS = 9;
const ROWS = 6;
const FPS = 24;
/** Seconds into the clip when the card bursts (frame 7). */
export const SHATTER_BURST = 7 / FPS;
export const SHATTER_MS = Math.round((FRAMES / FPS) * 1000);

/** Mean radius of the pink fragments against the whole card, per frame (burst frames smoothed). */
const SCALES = [1, 1, 1, 0.99, 0.99, 0.99, 0.99, 1.01, 1.02, 1.04, 1.05, 1.06, 1.09, 1.11, 1.14, 1.19, 1.22, 1.24, 1.27, 1.29, 1.32, 1.34, 1.37, 1.42, 1.44, 1.47, 1.5, 1.55, 1.58, 1.61, 1.64, 1.69, 1.72, 1.75, 1.78, 1.84, 1.87, 1.9, 1.92, 1.97, 2, 2.02, 2.05, 2.1, 2.12, 2.15, 2.17, 2.21, 2.23, 2.26, 2.28, 2.31, 2.33, 2.34];

/** The card inside the 960 px video frame: 487 × 683 px with its centre at (479.5, 429.5). */
const CARD = { x: 236 / 960, y: 88 / 960, w: 487 / 960, h: 683 / 960, cx: 479.5 / 960, cy: 429.5 / 960 };

const SHEET = "/fx/vo-mask.webp?v=1";
const LIGHT = "/fx/vo-sang.webp?v=1";
export const SHATTER_PICTURES = [SHEET, LIGHT];

function at(frame: number) {
  const col = frame % COLS;
  const row = Math.floor(frame / COLS);
  return `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
}

/**
 * `box` is the slot's box in % of the board; `children` is the card drawn to exactly that box. The effect fills a square
 * around it (the video frame) and calls `onDone` when the clip ends.
 */
export function CardShatter({ box, children, onDone }: { box: { x: number; y: number; w: number; h: number }; children: ReactNode; onDone: () => void }) {
  const mask = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useLayoutEffect(() => {
    const start = performance.now();
    let raf = 0;
    let last = -1;
    const tick = (now: number) => {
      const elapsed = now - start;
      const frame = Math.min(FRAMES - 1, Math.floor((elapsed / 1000) * FPS));
      if (frame !== last) {
        last = frame;
        const pos = at(frame);
        if (mask.current) {
          mask.current.style.maskPosition = pos;
          mask.current.style.webkitMaskPosition = pos;
        }
        if (light.current) light.current.style.backgroundPosition = pos;
        if (card.current) card.current.style.transform = `scale(${SCALES[frame] ?? 1})`;
      }
      if (elapsed < SHATTER_MS) raf = requestAnimationFrame(tick);
      else done.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const width = (box.w * 960) / (CARD.w * 960);
  const height = (box.h * 960) / (CARD.h * 960);
  const style = {
    left: `${box.x + box.w / 2 - CARD.cx * width}%`,
    top: `${box.y + box.h / 2 - CARD.cy * height}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
  const sheet = { maskImage: `url(${SHEET})`, WebkitMaskImage: `url(${SHEET})`, maskPosition: at(0), WebkitMaskPosition: at(0) };
  return (
    <div className="shatter" style={style} aria-hidden="true">
      <div ref={mask} className="shatter-mask" style={sheet}>
        <div ref={card} className="shatter-card" style={{ left: `${CARD.x * 100}%`, top: `${CARD.y * 100}%`, width: `${CARD.w * 100}%`, height: `${CARD.h * 100}%` }}>
          {children}
        </div>
      </div>
      <div ref={light} className="shatter-light" style={{ backgroundImage: `url(${LIGHT})`, backgroundPosition: at(0) }} />
    </div>
  );
}
