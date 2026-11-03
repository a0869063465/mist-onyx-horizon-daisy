import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { HINT_MS } from "@/lib/hints";

type Box = { left: number; top: number; right: number; bottom: number };

/**
 * Khung gợi ý (chủ game 03/11): nền tối, vùng liên quan sáng vàng, bảng nhỏ gần đó (chữ cam nhấp nhô như ghi chú kéo
 * thả), nút >> đóng; tự tắt sau HINT_MS. `targets` là các selector của vùng cần sáng.
 */
export function HintCard({ targets, onClose, auto = true, children }: { targets: string[]; onClose: () => void; auto?: boolean; children: ReactNode }) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [view, setView] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const found: Box[] = [];
      for (const sel of targets) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) found.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
      setBoxes(found);
      setView({ w: window.innerWidth, h: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targets.join("|")]);

  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(onClose, HINT_MS);
    return () => window.clearTimeout(timer);
  }, [auto, onClose]);

  const pad = 6;
  const union = boxes.length
    ? boxes.reduce((a, b) => ({ left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) }))
    : null;
  const width = Math.min(view.w * 0.86, 320);
  const below = union ? (union.top + union.bottom) / 2 < view.h / 2 : false;
  const center = union ? (union.left + union.right) / 2 : view.w / 2;
  const left = Math.max(view.w * 0.07, Math.min(view.w - width - view.w * 0.07, center - width / 2));
  const place = union
    ? below
      ? { top: union.bottom + pad + 12 }
      : { bottom: view.h - union.top + pad + 12 }
    : { top: view.h * 0.4 };

  return (
    <div className="hint-card" role="dialog">
      <svg className="hint-dim" width={view.w} height={view.h} aria-hidden="true">
        <defs>
          <mask id="hint-hole">
            <rect width={view.w} height={view.h} fill="#fff" />
            {boxes.map((b, i) => (
              <rect key={i} x={b.left - pad} y={b.top - pad} width={b.right - b.left + pad * 2} height={b.bottom - b.top + pad * 2} rx={10} fill="#000" />
            ))}
          </mask>
        </defs>
        <rect width={view.w} height={view.h} fill="rgba(4, 6, 12, 0.78)" mask="url(#hint-hole)" />
        {boxes.map((b, i) => (
          <rect key={i} className="hint-ring" x={b.left - pad} y={b.top - pad} width={b.right - b.left + pad * 2} height={b.bottom - b.top + pad * 2} rx={10} fill="none" />
        ))}
      </svg>
      <div className="hint-bubble" style={{ left, width, ...place }}>
        <div className="hint-text">
          <i className="hint-mark" aria-hidden="true">
            ?
          </i>
          <div>{children}</div>
        </div>
        <button type="button" className="hint-next" aria-label="Đóng" onClick={onClose}>
          »
        </button>
      </div>
    </div>
  );
}
