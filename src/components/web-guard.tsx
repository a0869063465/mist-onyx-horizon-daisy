import { useEffect } from "react";

/**
 * Chặn thao tác của trình duyệt khi chơi (chủ game 06/11): chụm 2 ngón phóng to (cả Safari qua gesture*), (bấm đúp phóng to đã khoá bằng touch-action), menu khi giữ (ảnh, liên kết, chữ), kéo ảnh. Ô nhập chữ và vùng `.allow-select` giữ nguyên để gõ và copy.
 */
export function WebGuard() {
  useEffect(() => {
    const typing = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("input, textarea, [contenteditable='true'], .allow-select");
    const stop = (e: Event) => e.preventDefault();
    const menu = (e: Event) => { if (!typing(e.target)) e.preventDefault(); };
    const drag = (e: Event) => { if (!typing(e.target)) e.preventDefault(); };
    const pinch = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    const wheel = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    for (const n of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(n, stop);
    document.addEventListener("contextmenu", menu);
    document.addEventListener("dragstart", drag);
    document.addEventListener("touchmove", pinch, { passive: false });
    window.addEventListener("wheel", wheel, { passive: false });
    return () => {
      for (const n of ["gesturestart", "gesturechange", "gestureend"]) document.removeEventListener(n, stop);
      document.removeEventListener("contextmenu", menu);
      document.removeEventListener("dragstart", drag);
      document.removeEventListener("touchmove", pinch);
      window.removeEventListener("wheel", wheel);
    };
  }, []);
  return null;
}
