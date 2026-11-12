import { useMemo, useRef, type TouchEvent } from "react";

/**
 * Vuốt ngang (chủ game 06/11): vuốt trái = +1 (tab / lá kế), vuốt phải = -1. Chỉ cảm ứng, ngón phải đi ngang rõ rệt
 * (dài ≥ 110 px, ngang gấp 2,6 lần dọc, dưới 0,7 giây; chủ game 08/11: bớt nhạy, vuốt dài mới ăn; chỉ vuốt đổi tab, vuốt đổi lá trong bảng `inside` giữ như cũ). Bỏ qua cú vuốt bắt đầu trên ô nhập, thanh trượt hoặc vùng có `data-noswipe`
 * (nơi có cử chỉ riêng như lật trang Album, cuộn lá). `go` trả `false` khi không còn tab để đổi: cú vuốt được giữ cho vùng bao ngoài xử lý.
 */
export function useSwipe(go: (dir: 1 | -1) => boolean | void, inside = false, min?: () => number) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const goRef = useRef(go);
  goRef.current = go;
  return useMemo(
    () => ({
      // Dùng sự kiện chạm (không dùng pointer): vùng cuộn dọc bên trong làm trình duyệt huỷ pointer ngay khi ngón đi ngang.
      onTouchStart(event: TouchEvent) {
        const target = event.target instanceof Element ? event.target : null;
        const touch = event.touches[0];
        const blocked = event.touches.length > 1 || !touch || !!target?.closest(inside ? BLOCKED_INSIDE : BLOCKED);
        start.current = blocked ? null : { x: touch.clientX, y: touch.clientY, t: Date.now() };
      },
      onTouchEnd(event: TouchEvent) {
        const from = start.current;
        start.current = null;
        const touch = event.changedTouches[0];
        if (!from || !touch) return;
        const dx = touch.clientX - from.x;
        const dy = touch.clientY - from.y;
        if (Math.abs(dx) < (inside ? 56 : min ? min() : SWIPE_MIN) || Math.abs(dx) < Math.abs(dy) * (inside ? 1.7 : 2.6) || Date.now() - from.t > (inside ? 800 : 700)) return;
        if (goRef.current(dx < 0 ? 1 : -1) !== false) event.stopPropagation();
      },
      onTouchCancel() {
        start.current = null;
      },
    }),
    [inside],
  );
}

/** Vuốt ngang tối thiểu (px) để đổi tab. */
const SWIPE_MIN = 110;

const BLOCKED_INSIDE = "[data-noswipe], input, textarea, select, [role='slider']";
const BLOCKED = "[data-noswipe], .msheet-back, .cc-back, .ms-drawer, .al-book, .al-pop, input, textarea, select, [role='slider']";

/** Vị trí tab kế (không vòng quanh); `null` khi đã ở đầu hoặc cuối. */
export function stepTab<T>(keys: readonly T[], current: T, dir: 1 | -1): T | null {
  const next = keys.indexOf(current) + dir;
  return next >= 0 && next < keys.length ? keys[next] : null;
}

/** Phần tử kế trong danh sách theo hướng vuốt; `null` khi `current` không nằm trong danh sách hoặc đã ở đầu/cuối. */
export function neighbour<T>(list: readonly T[], at: (item: T) => boolean, dir: 1 | -1): T | null {
  const index = list.findIndex(at);
  if (index < 0) return null;
  return list[index + dir] ?? null;
}
