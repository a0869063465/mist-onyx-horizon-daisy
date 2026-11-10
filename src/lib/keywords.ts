/**
 * Keyword bằng hình (chủ game 10/11, bộ 14 icon mới THAY bộ 15 cũ): icon xếp ngang ở cạnh trên bên trái lá quái (tay bài,
 * sân, bảng mô tả, kho bài). Chưa quái nào mang keyword: gắn bằng cách thêm id quái vào `CARD_KEYWORDS` khi chủ game đưa
 * danh sách. Quái 5 sao tạm thời chưa có keyword nào.
 *
 * CHƯA CÓ LUẬT cho cả 14 keyword mới (chờ chủ game nói số và danh sách quái). Tác dụng chủ game viết (chỉ để đọc, không phải
 * luật đã code):
 * - "cuoi-luot": phát huy công dụng ở cuối lượt. - "linh-hon": quái bị tiêu diệt ngay sau hành động hoặc đến hết lượt.
 * - "nhiem-vu": hoàn thành nhiệm vụ được giao thì nhận công dụng mới. - "ben-bi": quái duy trì sống sót bằng phòng ngự.
 * - "guom-mau": đánh vào được người chơi thì có thưởng. - "luc-luong": bài quân có chỉ số gốc cao.
 * - "hien-te": triệu hồi nhờ hiến tế thì có thưởng. - "hoi-phuc": hồi máu sau giao tranh hoặc cuối lượt.
 * - "doi-mo": mỗi 3 quái đội mồ chết gần nhất trỗi dậy cả 3 với 1 máu, không phòng ngự.
 * - "tao-bai": hiệu ứng tạo bài trên tay. - "dau-luot": đầu lượt phát huy tác dụng.
 * - "bo-bai": bỏ bài để đổi lấy hiệu ứng có lợi. - "xieng-xich": bài quân khống chế.
 * - "giao-chien": phát huy khả năng trong giao tranh.
 *
 * Luật CŨ (bộ 15 icon trước) vẫn nằm trong duel.ts (`keywordBarred`, `magicStrike`, `pierceLeft`) nhưng đã ngưng dùng:
 * không icon nào nối tới các id cũ trong `LegacyKeywordId` nên chúng không bao giờ chạy.
 */
export type NewKeywordId =
  | "cuoi-luot"
  | "linh-hon"
  | "nhiem-vu"
  | "ben-bi"
  | "guom-mau"
  | "luc-luong"
  | "hien-te"
  | "hoi-phuc"
  | "doi-mo"
  | "tao-bai"
  | "dau-luot"
  | "bo-bai"
  | "xieng-xich"
  | "giao-chien";

/** Id của bộ icon cũ, chỉ còn để luật cũ trong duel.ts biên dịch được. */
export type LegacyKeywordId =
  | "boc-thep"
  | "khong-lo"
  | "sieu-toc"
  | "nanh-vuot"
  | "luon-lach-1"
  | "luon-lach-2"
  | "phep"
  | "vinh-quang"
  | "doi-quan"
  | "bao-oan"
  | "phan-no"
  | "khat-mau"
  | "dam-xuyen"
  | "ban-pha";

export type KeywordId = NewKeywordId | LegacyKeywordId;

export const KEYWORDS: Record<NewKeywordId, { src: string; label: string }> = {
  "cuoi-luot": { src: "/ui/kw/cuoi-luot.webp", label: "Cuối lượt" },
  "linh-hon": { src: "/ui/kw/linh-hon.webp", label: "Linh hồn" },
  "nhiem-vu": { src: "/ui/kw/nhiem-vu.webp", label: "Nhiệm vụ" },
  "ben-bi": { src: "/ui/kw/ben-bi.webp", label: "Bền bỉ" },
  "guom-mau": { src: "/ui/kw/guom-mau.webp", label: "Gươm máu" },
  "luc-luong": { src: "/ui/kw/luc-luong.webp", label: "Lực lưỡng" },
  "hien-te": { src: "/ui/kw/hien-te.webp", label: "Hiến tế" },
  "hoi-phuc": { src: "/ui/kw/hoi-phuc.webp", label: "Hồi phục" },
  "doi-mo": { src: "/ui/kw/doi-mo.webp", label: "Đội mồ" },
  "tao-bai": { src: "/ui/kw/tao-bai.webp", label: "Tạo bài" },
  "dau-luot": { src: "/ui/kw/dau-luot.webp", label: "Đầu lượt" },
  "bo-bai": { src: "/ui/kw/bo-bai.webp", label: "Bỏ bài" },
  "xieng-xich": { src: "/ui/kw/xieng-xich.webp", label: "Xiềng xích" },
  "giao-chien": { src: "/ui/kw/giao-chien.webp", label: "Giao chiến" },
};

/** Keyword từng quái, theo id quái. Chủ game đưa danh sách rồi mới thêm. */
export const CARD_KEYWORDS: Record<string, KeywordId[]> = {};

export function keywordsOf(cardId: string | undefined | null): KeywordId[] {
  return cardId ? (CARD_KEYWORDS[cardId] ?? []) : [];
}
