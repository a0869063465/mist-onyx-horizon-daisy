import { useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Lá bị bỏ khỏi tay (chủ game 22/11, video Grok `9e8e8963`): lá nhấc lên, bay vòng cung nhẹ về hướng 2 giờ, vừa bay vừa
 * cháy tan thành lửa xanh lá, mất khoảng một phần ba đường bay. Lá xanh trong video chỉ là màu giữ chỗ: `bo-la-mask.webp`
 * (alpha = độ sáng của lá) khoét chính lá thật nên lá tan theo từng mảng lửa; `bo-la-sang.webp` là phần lửa (hạt, vệt chói,
 * viền sáng). Hai tấm là 9 × 9 khung 288 px, 74 khung, video phát nhanh `SPEED` lần (3, để lá cháy hết ở khoảng 1/3 đường bay).
 */
const FRAMES = 74;
const COLS = 9;
const ROWS = 9;
const FPS = 24;
const SPEED = 3;
/** Cả chuyến bay (giây); lá cháy hết ở khoảng một phần ba đường. */
const FLIGHT_MS = 1900;
const LIFT_MS = 160;

/** Lá trong khung video 960 px: 496 × 690 px, tâm (482, 431). */
const CARD = { x: 234 / 960, y: 86 / 960, w: 496 / 960, h: 690 / 960, cx: 482 / 960, cy: 431 / 960 };
const MASK = "/fx/bo-la-mask.webp?v=1";
const LIGHT = "/fx/bo-la-sang.webp?v=1";
export const BURN_PICTURES = [MASK, LIGHT];

/** 2 giờ: lên phải 30° so với ngang. */
const ANGLE = (30 * Math.PI) / 180;

function at(frame: number) {
  const col = frame % COLS;
  const row = Math.floor(frame / COLS);
  return `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
}

export type BurnRect = { left: number; top: number; width: number; height: number };

/**
 * `rect` = chỗ lá nằm trên màn hình (px); `children` = lá vẽ vừa khít khung đó. Gọi `onDone` khi bay xong.
 */
export function CardBurn({ rect, children, onDone }: { rect: BurnRect; children: ReactNode; onDone: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const mask = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const frameW = rect.width / CARD.w;
  useLayoutEffect(() => {
    const start = performance.now();
    const reach = Math.min(window.innerWidth, window.innerHeight) * 0.42;
    let raf = 0;
    let last = -1;
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / FLIGHT_MS);
      // Nhấc lên trước (lá phồng và nổi), rồi trượt đi chậm dần: đường cong chữ C nhẹ lên trên.
      const lift = Math.min(1, elapsed / LIFT_MS);
      const e = Math.pow(t, 1.25);
      const x = Math.cos(ANGLE) * reach * e;
      const y = -Math.sin(ANGLE) * reach * e - Math.sin(Math.PI * e) * reach * 0.16 - lift * rect.height * 0.06;
      const scale = 1 + 0.07 * lift - 0.1 * t;
      const turn = -6 * e;
      if (wrap.current) wrap.current.style.transform = `translate(${x}px, ${y}px) rotate(${turn}deg) scale(${scale})`;
      const frame = Math.max(0, Math.min(FRAMES - 1, Math.floor(((elapsed - LIFT_MS * 0.6) / 1000) * FPS * SPEED)));
      if (frame !== last) {
        last = frame;
        const pos = at(frame);
        if (mask.current) {
          mask.current.style.maskPosition = pos;
          mask.current.style.webkitMaskPosition = pos;
        }
        if (light.current) light.current.style.backgroundPosition = pos;
      }
      if (elapsed < FLIGHT_MS) raf = requestAnimationFrame(tick);
      else done.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = {
    left: `${rect.left + rect.width / 2 - CARD.cx * frameW}px`,
    top: `${rect.top + rect.height / 2 - CARD.cy * frameW}px`,
    width: `${frameW}px`,
    height: `${frameW}px`,
    transformOrigin: `${CARD.cx * 100}% ${CARD.cy * 100}%`,
  };
  const sheet = { maskImage: `url(${MASK})`, WebkitMaskImage: `url(${MASK})`, maskPosition: at(0), WebkitMaskPosition: at(0) };
  return createPortal(
    <div ref={wrap} className="burn" style={style} aria-hidden="true">
      <div ref={mask} className="burn-mask" style={sheet}>
        <div className="burn-card" style={{ left: `${CARD.x * 100}%`, top: `${CARD.y * 100}%`, width: `${CARD.w * 100}%`, height: `${CARD.h * 100}%` }}>
          {children}
        </div>
      </div>
      <div ref={light} className="burn-light" style={{ backgroundImage: `url(${LIGHT})`, backgroundPosition: at(0) }} />
    </div>,
    document.body,
  );
}
