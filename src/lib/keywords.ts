/**
 * Keyword bằng hình (chủ game 09/11): icon xếp ngang ở cạnh trên bên trái lá quái (tay bài, sân, bảng mô tả, kho bài).
 * Chưa quái nào mang keyword: gắn bằng cách thêm id quái vào `CARD_KEYWORDS` khi chủ game đưa danh sách. Quái 5 sao tạm
 * thời chưa có keyword nào (chủ game 09/11).
 *
 * Luật (làm sau, chờ danh sách quái):
 * - "phep": đòn đánh thường của quái này gây sát thương phép.
 * - "vinh-quang": hạ gục một quái thì được chỉ số; hạ quái bằng hoặc hơn sao của quái này thì được thêm chỉ số cường hoá
 *   (mức tăng tuỳ từng quái).
 * - "luon-lach-1", "luon-lach-2": số quái hàng trước của đối thủ được chặn = số quái hàng trước hiện có trừ x (x = 1 hoặc
 *   2); chỉ tính riêng quái này, quái khác đánh thì chặn như thường; môi trường có thể mở hàng trước ra 4-5 ô.
 * - "khong-chan": đối thủ không được chặn đòn của quái này.
 */
export type KeywordId = "phep" | "vinh-quang" | "luon-lach-1" | "luon-lach-2" | "khong-chan";

export const KEYWORDS: Record<KeywordId, { src: string; label: string }> = {
  phep: { src: "/ui/kw/phep.webp", label: "Đòn đánh phép" },
  "vinh-quang": { src: "/ui/kw/vinh-quang.webp", label: "Vinh quang" },
  "luon-lach-1": { src: "/ui/kw/luon-lach-1.webp", label: "Luồn lách 1" },
  "luon-lach-2": { src: "/ui/kw/luon-lach-2.webp", label: "Luồn lách 2" },
  "khong-chan": { src: "/ui/kw/khong-chan.webp", label: "Không thể chặn" },
};

/** Keyword từng quái, theo id quái. Chủ game đưa danh sách rồi mới thêm. */
export const CARD_KEYWORDS: Record<string, KeywordId[]> = {};

export function keywordsOf(cardId: string | undefined | null): KeywordId[] {
  return cardId ? (CARD_KEYWORDS[cardId] ?? []) : [];
}
