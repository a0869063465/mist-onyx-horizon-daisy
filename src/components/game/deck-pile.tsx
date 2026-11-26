import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flatFx, fxUrl } from "@/lib/preload";

/** Mỗi 4 lá còn trong xấp thì dày thêm một lớp (tối đa 6); hết bài thì ô trống. */
const PER_LAYER = 4;
const MAX_LAYERS = 6;

/** Hiệu ứng xáo bài (chủ game 26/11, 2 video Grok cắt 1,9 giây): ms cho tới lúc xấp tĩnh hiện lại. */
export const SHUFFLE_MS = 1900;
const SHUFFLE_VIDEO = { you: "/fx/xao-bai-xanh.webm?v=1", foe: "/fx/xao-bai-do.webm?v=1" } as const;

export const pileLayers = (count: number) => (count <= 0 ? 0 : Math.min(MAX_LAYERS, Math.ceil(count / PER_LAYER)));

/**
 * Xấp bài úp vẽ bằng code trên ô trống của ảnh bàn (chủ game 30/10): dày theo số lá còn trong xấp, lá bốc bay ra từ
 * mặt xấp. Lớp dưới tối hơn và lệch xuống một chút cho ra cảm giác có độ dày.
 */
export function DeckPile({ count, side, ready, shuffle }: { count: number; side: "you" | "foe"; /** Chưa rút bài: viền và glow sáng quanh lá trên cùng. */ ready?: boolean; /** Tăng lên mỗi lần bộ bài vừa bị xáo: phát video xáo bài đè lên xấp. */ shuffle?: number }) {
  const layers = pileLayers(count);
  const [live, setLive] = useState(false);
  const seen = useRef(shuffle ?? 0);
  useEffect(() => {
    if (!shuffle || shuffle === seen.current) return;
    seen.current = shuffle;
    // Safari không có video trong suốt: chỉ có tiếng, xấp tĩnh giữ nguyên.
    if (flatFx()) return;
    setLive(true);
    const safety = window.setTimeout(() => setLive(false), SHUFFLE_MS + 500);
    return () => window.clearTimeout(safety);
  }, [shuffle]);
  return (
    <span className={`deck-pile${ready ? " is-ready" : ""}${live ? " is-shuffling" : ""}`} aria-hidden="true">
      {Array.from({ length: layers }, (_, i) => {
        const up = layers - 1 - i; // 0 = lá trên cùng
        return (
          <img
            key={i}
            src={side === "you" ? "/ui/card-back-you.webp" : "/ui/card-back-foe.webp"}
            alt=""
            draggable={false}
            style={{ ["--down" as string]: up, ["--tilt" as string]: `${((i * 37) % 5) - 2}deg` } as CSSProperties}
          />
        );
      })}
      {live ? (
        <video
          key={shuffle}
          className={`shuffle-fx is-${side}`}
          src={fxUrl(SHUFFLE_VIDEO[side])}
          autoPlay
          muted
          playsInline
          preload="auto"
          ref={(el) => {
            // Ép phát từ khung đầu, tránh video đứng ở một khung trên điện thoại.
            if (el && el.dataset.go !== "1") {
              el.dataset.go = "1";
              el.currentTime = 0;
              void el.play().catch(() => undefined);
            }
          }}
          onLoadedData={(event) => {
            const el = event.currentTarget;
            if (el.paused) void el.play().catch(() => undefined);
          }}
          onEnded={() => setLive(false)}
        />
      ) : null}
      {layers > 0 ? <b className="deck-left">{count}</b> : null}
    </span>
  );
}
