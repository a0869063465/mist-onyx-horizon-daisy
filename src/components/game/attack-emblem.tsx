import { useEffect, useRef, useState, type CSSProperties } from "react";
import { fxUrl } from "@/lib/preload";
import { playCue } from "@/lib/sfx";

export type EmblemSide = "you" | "foe";

const LEAVE_MS = 300;

/** Mốc nhịp chung của hai video (owner's Grok clips, 30/10): khiên hiện, cánh bung, kiếm cắm vào rồi đứng yên. */
export const EMBLEM_VIDEO: Record<EmblemSide, string> = { you: "/ui/atk-you.webm?v=1", foe: "/ui/atk-foe.webm?v=1" };
export const EMBLEM_STILL: Record<EmblemSide, string> = { you: "/ui/atk-you.webp?v=1", foe: "/ui/atk-foe.webp?v=1" };

const reduced = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

function Emblem({ side, style, leaving }: { side: EmblemSide; style: CSSProperties; leaving?: boolean }) {
  // Chạy hiệu ứng một lần; xong (hoặc máy giảm chuyển động, hoặc video lỗi) thì giữ khung cuối làm hình đứng yên.
  const [still, setStill] = useState(() => Boolean(leaving) || reduced());
  useEffect(() => {
    if (!leaving && !reduced()) playCue(side === "you" ? "emblemYou" : "emblemFoe");
  }, [side, leaving]);
  return (
    <span className={`turn-sword is-${side}${leaving ? " is-leaving" : ""}`} aria-hidden="true" style={style}>
      {still ? (
        <img src={EMBLEM_STILL[side]} alt="" draggable={false} />
      ) : (
        <video src={fxUrl(EMBLEM_VIDEO[side])} muted playsInline autoPlay preload="auto" onEnded={() => setStill(true)} onError={() => setStill(true)} />
      )}
    </span>
  );
}

/**
 * Kiếm cánh + khiên của bên giữ token tấn công. Đổi bên thì bên cũ mờ tắt ~0,3 giây, bên mới chạy hiệu ứng.
 * `boxes` là khung của từng bên (null = ẩn).
 */
export function AttackEmblem({ current, boxes }: { current: EmblemSide | null; boxes: Record<EmblemSide, CSSProperties | null> }) {
  const last = useRef<EmblemSide | null>(current);
  const [gone, setGone] = useState<EmblemSide | null>(null);
  useEffect(() => {
    const before = last.current;
    last.current = current;
    if (!before || before === current) return;
    setGone(before);
    const timer = window.setTimeout(() => setGone(null), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [current]);
  const leaving = gone && gone !== current ? boxes[gone] : null;
  const shown = current ? boxes[current] : null;
  return (
    <>
      {leaving && gone ? <Emblem key={`leave-${gone}`} side={gone} style={leaving} leaving /> : null}
      {shown && current ? <Emblem key={`sword-${current}`} side={current} style={shown} /> : null}
    </>
  );
}
