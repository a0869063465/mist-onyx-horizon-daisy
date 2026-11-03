import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react";

type Box = { left: number; top: number; width: number; height: number };

const GUIDE_ART = "/tutorial/nguoi-giu-khoa.webp";
const GUIDE_W = 340;

/**
 * Khung gợi ý (chủ game 03/11): làm y như Hướng dẫn: nền tối, vùng liên quan sáng viền vàng chớp, Người giữ khoá nói trong
 * bong bóng, nút » đóng (không tự tắt). Chỉ bấm được trong vùng sáng và nút »; bấm đúng vùng sáng thì hành động chạy rồi khung đóng.
 * `targets` là các selector của vùng cần sáng.
 */
export function HintCard({ targets, onClose, children }: { targets: string[]; onClose: () => void; children: ReactNode }) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const key = targets.join("|");

  useLayoutEffect(() => {
    const measure = () => {
      const found: Box[] = [];
      for (const sel of targets) {
        document.querySelectorAll(sel).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) found.push({ left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 });
        });
      }
      setBoxes(found);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [key]);

  // Như Hướng dẫn: ngoài vùng sáng không bấm được; bấm trúng vùng sáng thì để hành động chạy rồi đóng gợi ý.
  useEffect(() => {
    const open = [...targets, ".hint-bubble"].join(",");
    let pressBlocked = false;
    const guard = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      const inside = Boolean(target?.closest(open));
      if (event.type === "pointerdown" || event.type === "touchstart") pressBlocked = !inside;
      if (inside || ((event.type === "click" || event.type === "pointerup") && !pressBlocked)) {
        if (event.type === "click" && target && !target.closest(".hint-bubble")) window.setTimeout(onClose, 0);
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    };
    const kinds = ["pointerdown", "pointerup", "click", "touchstart"] as const;
    for (const kind of kinds) window.addEventListener(kind, guard, { capture: true, passive: false });
    return () => {
      for (const kind of kinds) window.removeEventListener(kind, guard, { capture: true });
    };
  }, [key, onClose]);

  const vw = typeof window === "undefined" ? 400 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const width = Math.min(vw - 16, GUIDE_W);
  let spot: CSSProperties = { left: (vw - width) / 2, width, top: vh * 0.3 };
  if (boxes.length) {
    const top = Math.min(...boxes.map((box) => box.top));
    const bottom = Math.max(...boxes.map((box) => box.top + box.height));
    const cx = (Math.min(...boxes.map((box) => box.left)) + Math.max(...boxes.map((box) => box.left + box.width))) / 2;
    const left = Math.max(8, Math.min(vw - width - 8, cx - width / 2));
    const roomBelow = vh - bottom;
    spot = top > roomBelow && top > 150 ? { left, width, bottom: vh - top + 10 } : roomBelow > 150 ? { left, width, top: bottom + 10 } : { left, width, top: 64 };
  }

  return (
    <div className="tut-layer hint-card" role="dialog">
      <svg className="tut-dim" width={vw} height={vh} aria-hidden="true">
        <path
          fillRule="evenodd"
          fill="rgba(0,0,0,0.62)"
          d={`M0 0H${vw}V${vh}H0Z${boxes.map((box) => `M${box.left} ${box.top}h${box.width}v${box.height}h${-box.width}Z`).join("")}`}
        />
      </svg>
      {boxes.map((box, i) => (
        <div key={i} className="tut-ring" style={{ left: box.left, top: box.top, width: box.width, height: box.height }} />
      ))}
      <div className="tut-guide tut-ui hint-guide" style={spot}>
        <img className="tut-mascot" src={GUIDE_ART} alt="Người giữ khoá" draggable={false} />
        <div className="tut-bubble">
          {children}
          <button type="button" className="tut-next press" data-ui="confirm" aria-label="Đóng" onClick={onClose}>
            <span>»</span>
          </button>
        </div>
      </div>
    </div>
  );
}
