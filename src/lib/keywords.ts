/**
 * Keyword bằng hình (chủ game 09/11): icon xếp ngang ở cạnh trên bên trái lá quái (tay bài, sân, bảng mô tả, kho bài).
 * Chưa quái nào mang keyword: gắn bằng cách thêm id quái vào `CARD_KEYWORDS` khi chủ game đưa danh sách. Quái 5 sao tạm
 * thời chưa có keyword nào (chủ game 09/11).
 *
 * Luật (chủ game 09/11). ĐÃ CÓ LUẬT (duel.ts `keywordBarred`, `magicStrike`, `pierceLeft`): Bọc thép, Khổng lồ,
 * Siêu tốc, Nanh vuốt, Luồn lách 1/2, Đòn đánh phép, Đâm xuyên. CHƯA CÓ LUẬT (chờ chủ game nói tác dụng/số): Vinh quang,
 * Hiến tế, Đội quân, Báo oán, Phẫn nộ, Khát máu, Bắn phá.
 * - "boc-thep": chỉ quái có tổng phòng ngự (thủ + thủ phép) từ 3 trở lên được chặn đòn của quái này.
 * - "khong-lo": chỉ quái có từ 5 máu trở lên được chặn.
 * - "sieu-toc": không quái nào chặn được.
 * - "nanh-vuot": chỉ quái có công từ 4 trở lên được chặn.
 * - "luon-lach-1", "luon-lach-2": số quái hàng trước của đối thủ được chặn = số quái hàng trước hiện có trừ x (x = 1 hoặc
 *   2); chỉ tính riêng quái này, quái khác đánh thì chặn như thường; môi trường có thể mở hàng trước ra 4-5 ô.
 * - "phep": đòn đánh thường của quái này gây sát thương phép.
 * - "vinh-quang": hạ gục một quái thì được chỉ số; hạ quái bằng hoặc hơn sao của quái này thì được thêm chỉ số cường hoá
 *   (mức tăng tuỳ từng quái).
 * - "hien-te": hy sinh máu hiện tại của quân bài để phát huy tác dụng.
 * - "doi-quan": phát huy tác dụng nếu có quân bài chung lực lượng trên sân.
 * - "bao-oan": phát huy tác dụng khi chết.
 * - "phan-no": phát huy tác dụng mỗi khi mất máu.
 * - "khat-mau": phát huy tác dụng mỗi khi người chơi địch mất máu.
 * - "dam-xuyen": sát thương thừa sau khi giết quái gây thẳng lên người chơi.
 * - "ban-pha": đòn đánh hoặc kỹ năng thông thường gây kèm sát thương lên người chơi.
 */
export type KeywordId =
  | "boc-thep"
  | "khong-lo"
  | "sieu-toc"
  | "nanh-vuot"
  | "luon-lach-1"
  | "luon-lach-2"
  | "phep"
  | "vinh-quang"
  | "hien-te"
  | "doi-quan"
  | "bao-oan"
  | "phan-no"
  | "khat-mau"
  | "dam-xuyen"
  | "ban-pha";

export const KEYWORDS: Record<KeywordId, { src: string; label: string }> = {
  "boc-thep": { src: "/ui/kw/boc-thep.webp", label: "Bọc thép" },
  "khong-lo": { src: "/ui/kw/khong-lo.webp", label: "Khổng lồ" },
  "sieu-toc": { src: "/ui/kw/sieu-toc.webp", label: "Siêu tốc" },
  "nanh-vuot": { src: "/ui/kw/nanh-vuot.webp", label: "Nanh vuốt" },
  "luon-lach-1": { src: "/ui/kw/luon-lach-1.webp", label: "Luồn lách 1" },
  "luon-lach-2": { src: "/ui/kw/luon-lach-2.webp", label: "Luồn lách 2" },
  phep: { src: "/ui/kw/phep.webp", label: "Đòn đánh phép" },
  "vinh-quang": { src: "/ui/kw/vinh-quang.webp", label: "Vinh quang" },
  "hien-te": { src: "/ui/kw/hien-te.webp", label: "Hiến tế" },
  "doi-quan": { src: "/ui/kw/doi-quan.webp", label: "Đội quân" },
  "bao-oan": { src: "/ui/kw/bao-oan.webp", label: "Báo oán" },
  "phan-no": { src: "/ui/kw/phan-no.webp", label: "Phẫn nộ" },
  "khat-mau": { src: "/ui/kw/khat-mau.webp", label: "Khát máu" },
  "dam-xuyen": { src: "/ui/kw/dam-xuyen.webp", label: "Đâm xuyên" },
  "ban-pha": { src: "/ui/kw/ban-pha.webp", label: "Bắn phá" },
};

/** Keyword từng quái, theo id quái. Chủ game đưa danh sách rồi mới thêm. */
export const CARD_KEYWORDS: Record<string, KeywordId[]> = {};

export function keywordsOf(cardId: string | undefined | null): KeywordId[] {
  return cardId ? (CARD_KEYWORDS[cardId] ?? []) : [];
}
