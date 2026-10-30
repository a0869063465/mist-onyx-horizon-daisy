import type { CSSProperties } from "react";

/** Mỗi 4 lá còn trong xấp thì dày thêm một lớp (tối đa 6); hết bài thì ô trống. */
const PER_LAYER = 4;
const MAX_LAYERS = 6;

export const pileLayers = (count: number) => (count <= 0 ? 0 : Math.min(MAX_LAYERS, Math.ceil(count / PER_LAYER)));

/**
 * Xấp bài úp vẽ bằng code trên ô trống của ảnh bàn (chủ game 30/10): dày theo số lá còn trong xấp, lá bốc bay ra từ
 * mặt xấp. Lớp dưới tối hơn và lệch xuống một chút cho ra cảm giác có độ dày.
 */
export function DeckPile({ count, side }: { count: number; side: "you" | "foe" }) {
  const layers = pileLayers(count);
  return (
    <span className="deck-pile" aria-hidden="true">
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
    </span>
  );
}
