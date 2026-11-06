import { useMemo, useRef, type TouchEvent } from "react";

/**
 * Vuốt ngang (chủ game 06/11): vuốt trái = +1 (tab / lá kế), vuốt phải = -1. Chỉ cảm ứng, ngón phải đi ngang rõ rệt
 * (dài ≥ 56 px, ngang gấp 1,7 lần dọc, dưới 0,8 giây). Bỏ qua cú vuốt bắt đầu trên ô nhập, thanh trượt hoặc vùng có `data-noswipe`
 * (nơi có cử chỉ riêng như lật trang Album, cuộn lá). `go` trả `false` khi không còn tab để đổi: cú vuốt được giữ cho vùng bao ngoài xử lý.
 */
export function useSwipe(go: (dir: 1 | -1) => boolean | void) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const goRef = useRef(go);
  goRef.current = go;
  return useMemo(
    () => ({
      // Dùng sự kiện chạm (không dùng pointer): vùng cuộn dọc bên trong làm trình duyệt huỷ pointer ngay khi ngón đi ngang.
      onTouchStart(event: TouchEvent) {
        const target = event.target instanceof Element ? event.target : null;
        const touch = event.touches[0];
        const blocked = event.touches.length > 1 || !touch || !!target?.closest(BLOCKED);
        start.current = blocked ? null : { x: touch.clientX, y: touch.clientY, t: Date.now() };
      },
      onTouchEnd(event: TouchEvent) {
        const from = start.current;
        start.current = null;
        const touch = event.changedTouches[0];
        if (!from || !touch) return;
        const dx = touch.clientX - from.x;
        const dy = touch.clientY - from.y;
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.7 || Date.now() - from.t > 800) return;
        if (goRef.current(dx < 0 ? 1 : -1) !== false) event.stopPropagation();
      },
      onTouchCancel() {
        start.current = null;
      },
    }),
    [],
  );
}

const BLOCKED = "[data-noswipe], .msheet-back, .cc-back, .ms-drawer, .al-book, .al-pop, input, textarea, select, [role='slider']";

/** Vị trí tab kế (không vòng quanh); `null` khi đã ở đầu hoặc cuối. */
export function stepTab<T>(keys: readonly T[], current: T, dir: 1 | -1): T | null {
  const next = keys.indexOf(current) + dir;
  return next >= 0 && next < keys.length ? keys[next] : null;
}
