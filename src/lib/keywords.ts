/**
 * Keyword bằng hình (chủ game 10/11: bộ 14 icon mới THÊM vào bộ 15 cũ, không thay): icon xếp ngang ở cạnh trên bên trái lá
 * quái (tay bài, sân, bảng mô tả, kho bài). Chưa quái nào mang keyword: gắn bằng cách thêm id quái vào `CARD_KEYWORDS` khi
 * chủ game đưa danh sách. Quái 5 sao tạm thời chưa có keyword nào.
 *
 * Bộ cũ (15): ĐÃ CÓ LUẬT (duel.ts `keywordBarred`, `magicStrike`, `pierceLeft`): Bọc thép (phòng ngự thủ + thủ phép ≥ 3 mới
 * chặn được), Khổng lồ (máu ≥ 5), Siêu tốc (không ai chặn), Nanh vuốt (công ≥ 4), Luồn lách 1/2, Đòn đánh phép (đòn đánh
 * thường gây sát thương phép), Đâm xuyên (sát thương thừa vào người chơi). CHƯA CÓ LUẬT: Vinh quang, Hiến tế (hy sinh máu
 * hiện tại), Đội quân, Báo oán (khi chết), Phẫn nộ (mỗi khi mất máu), Khát máu (khi người chơi địch mất máu), Bắn phá (đòn
 * hoặc kỹ năng thường gây kèm sát thương lên người chơi).
 *
 * Bộ mới (14), CHƯA CÓ LUẬT (chờ số và danh sách quái); tác dụng chủ game viết:
 * - "cuoi-luot": phát huy công dụng ở cuối lượt. - "linh-hon": quái bị tiêu diệt ngay sau hành động hoặc đến hết lượt.
 * - "nhiem-vu": hoàn thành nhiệm vụ được giao thì nhận công dụng mới. - "ben-bi": quái duy trì sống sót bằng phòng ngự.
 * - "guom-mau": đánh vào được người chơi thì có thưởng. - "luc-luong": bài quân có chỉ số gốc cao.
 * - "hien-te-thuong": (tên hiển thị cũng là "Hiến tế", khác keyword Hiến tế cũ) triệu hồi nhờ hiến tế thì có thưởng.
 * - "hoi-phuc": hồi máu sau giao tranh hoặc cuối lượt. - "doi-mo": mỗi 3 quái đội mồ chết gần nhất trỗi dậy cả 3 với 1 máu,
 *   không phòng ngự. - "tao-bai": hiệu ứng tạo bài trên tay. - "dau-luot": đầu lượt phát huy tác dụng.
 * - "bo-bai": bỏ bài để đổi lấy hiệu ứng có lợi. - "xieng-xich": bài quân khống chế.
 * - "giao-chien": phát huy khả năng trong giao tranh.
 */
export type NewKeywordId =
  | "cuoi-luot"
  | "linh-hon"
  | "nhiem-vu"
  | "ben-bi"
  | "guom-mau"
  | "luc-luong"
  | "hien-te-thuong"
  | "hoi-phuc"
  | "doi-mo"
  | "tao-bai"
  | "dau-luot"
  | "bo-bai"
  | "xieng-xich"
  | "giao-chien";

/** Bộ icon cũ (15, trong đó Hiến tế cũ là "hien-te"). */
export type LegacyKeywordId =
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

export type KeywordId = NewKeywordId | LegacyKeywordId;

export const KEYWORDS: Record<KeywordId, { src: string; label: string }> = {
  "cuoi-luot": { src: "/ui/kw/cuoi-luot.webp", label: "Cuối lượt" },
  "linh-hon": { src: "/ui/kw/linh-hon.webp", label: "Linh hồn" },
  "nhiem-vu": { src: "/ui/kw/nhiem-vu.webp", label: "Nhiệm vụ" },
  "ben-bi": { src: "/ui/kw/ben-bi.webp", label: "Bền bỉ" },
  "guom-mau": { src: "/ui/kw/guom-mau.webp", label: "Gươm máu" },
  "luc-luong": { src: "/ui/kw/luc-luong.webp", label: "Lực lưỡng" },
  "hien-te-thuong": { src: "/ui/kw/hien-te-thuong.webp", label: "Hiến tế" },
  "hoi-phuc": { src: "/ui/kw/hoi-phuc.webp", label: "Hồi phục" },
  "doi-mo": { src: "/ui/kw/doi-mo.webp", label: "Đội mồ" },
  "tao-bai": { src: "/ui/kw/tao-bai.webp", label: "Tạo bài" },
  "dau-luot": { src: "/ui/kw/dau-luot.webp", label: "Đầu lượt" },
  "bo-bai": { src: "/ui/kw/bo-bai.webp", label: "Bỏ bài" },
  "xieng-xich": { src: "/ui/kw/xieng-xich.webp", label: "Xiềng xích" },
  "giao-chien": { src: "/ui/kw/giao-chien.webp", label: "Giao chiến" },
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
