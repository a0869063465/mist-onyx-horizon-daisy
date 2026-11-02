import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { fxUrl } from "@/lib/preload";

/** Video tủ (chủ game 02/11): khung 640×920 cắt từ video gốc; ô xanh (nay trong suốt) là chỗ lá đứng. */
export const BOX_VIDEO = "/ui/box-open.webm?v=1";
const HOLE = { left: 98 / 640, top: 179 / 920, width: 406 / 640, height: 570 / 920 };
/** Bỏ đoạn đầu (ô xanh trống rồi khung tủ hiện dần). */
const START = 1;
/** Lúc tủ đã đóng kín: lá cũ biến mất sau cửa, mở ra là lá mới. */
const SHUT = 6.2;

export type BoxSpot = {
  /** The slot, in pixels from the top left of the board (the effect lives inside the board, so cards keep their size). */
  rect: { left: number; top: number; width: number; height: number };
  /** A copy of the card that stood there before the trade, shown until the doors close. */
  ghost: HTMLElement | null;
};

/**
 * Hộp ma thuật: a cabinet plays over each of the two slots that traded; the old card shows through until its doors
 * close, then they open on the new one.
 */
export function BoxFx({ host, spots, onDone }: { host: HTMLElement; spots: BoxSpot[]; onDone: () => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const ended = useRef(0);
  useEffect(() => {
    const root = holder.current;
    if (!root) return;
    const ghosts = Array.from(root.querySelectorAll<HTMLElement>("[data-ghost]"));
    spots.forEach((spot, index) => {
      const box = ghosts[index];
      if (!box || !spot.ghost) return;
      const copy = spot.ghost.cloneNode(true) as HTMLElement;
      copy.removeAttribute("data-slot");
      copy.removeAttribute("data-uid");
      copy.style.position = "absolute";
      copy.style.inset = "0";
      copy.style.left = "0";
      copy.style.top = "0";
      copy.style.width = "100%";
      copy.style.height = "100%";
      copy.style.translate = "none";
      copy.style.transform = "none";
      box.appendChild(copy);
    });
    const safety = window.setTimeout(onDone, 16000);
    return () => window.clearTimeout(safety);
    // Once per trade: the spots are fixed when it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const finish = () => {
    ended.current += 1;
    if (ended.current >= spots.length) onDone();
  };
  return createPortal(
    <div ref={holder} className="box-fx" aria-hidden="true">
      {spots.map((spot, index) => {
        const width = spot.rect.width / HOLE.width;
        const height = spot.rect.height / HOLE.height;
        return (
          <div key={index}>
            <div className="box-fx-ghost" data-ghost style={{ left: spot.rect.left, top: spot.rect.top, width: spot.rect.width, height: spot.rect.height }} />
            <video
              className="box-fx-video"
              src={fxUrl(BOX_VIDEO)}
              muted
              playsInline
              autoPlay
              preload="auto"
              style={{ left: spot.rect.left - HOLE.left * width, top: spot.rect.top - HOLE.top * height, width, height }}
              onLoadedMetadata={(event) => {
                event.currentTarget.currentTime = START;
              }}
              onTimeUpdate={(event) => {
                if (event.currentTarget.currentTime < SHUT) return;
                const ghost = holder.current?.querySelectorAll<HTMLElement>("[data-ghost]")[index];
                if (ghost) ghost.style.display = "none";
              }}
              onEnded={finish}
              onError={finish}
            />
          </div>
        );
      })}
    </div>,
    host,
  );
}
