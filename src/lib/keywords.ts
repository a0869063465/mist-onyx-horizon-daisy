/**
 * Keyword bằng hình (chủ game 10/11: bộ 14 icon mới THÊM vào bộ 15 cũ, không thay): icon xếp ngang ở cạnh trên bên trái lá
 * quái (tay bài, sân, bảng mô tả, kho bài). Chưa quái nào mang keyword: gắn bằng cách thêm id quái vào `CARD_KEYWORDS` khi
 * chủ game đưa danh sách. Quái 5 sao tạm thời chưa có keyword nào.
 *
 * Keyword là NHÃN XẾP NHÓM (chủ game 10/11): quái cùng đặc điểm mang chung keyword, tác dụng thật của từng quái nằm ở
 * skill riêng của nó. Chỉ một số keyword có luật chung trong engine (xem dưới).
 *
 * Bộ cũ (15): CÓ LUẬT CHUNG (duel.ts `keywordBarred`, `magicStrike`, `pierceLeft`): Bọc thép (thủ + thủ phép ≥ 3 mới chặn
 * được), Khổng lồ (máu ≥ 5), Siêu tốc (không ai chặn), Nanh vuốt (công ≥ 4), Luồn lách 1/2, Đòn đánh phép (đòn đánh thường
 * gây sát thương phép), Đâm xuyên (sát thương thừa vào người chơi). NHÃN NHÓM, không luật chung:
 * - "khe-uoc" Khế ước (trước là Hiến tế): hy sinh máu của 1 hay nhiều quái để tạo hiệu ứng có lợi (sát thương người chơi
 *   địch, hồi máu người chơi, sát thương quái địch, tăng chỉ số...; chỉ là ví dụ).
 * - "vinh-quang": hạ gục quái thấp sao hơn thì được thưởng, hạ quái sao bằng hoặc cao hơn thì được thưởng cường hoá.
 * - "lien-ket" Liên kết (trước là Đội quân): có 2, 4, 6 quân cùng tộc (hoặc môi trường) trên sân thì phát huy tác dụng lần
 *   lượt ở mức 2, mức 4 cộng dồn cả 2 + 4, mức 6 cộng dồn cả 2 + 4 + 6.
 * - "bao-oan": phát huy khả năng khi chết. - "phan-no": phát huy khả năng khi bị mất máu.
 * - "mui-mau" Mùi máu (trước là Khát máu): khi người chơi địch mất máu thì có thưởng.
 * - "tan-pha" Tàn phá (trước là Bắn phá): quái đa mục tiêu.
 *
 * Bộ mới (14), cũng là nhãn nhóm; tác dụng chủ game viết:
 * - "cuoi-luot": phát huy công dụng ở cuối lượt. - "linh-hon": quái bị tiêu diệt ngay sau hành động hoặc đến hết lượt.
 * - "nhiem-vu": hoàn thành nhiệm vụ được giao thì nhận công dụng mới. - "ben-bi": quái duy trì sống sót bằng phòng ngự.
 * - "guom-mau": đánh vào được người chơi thì có thưởng. - "luc-luong": bài quân có chỉ số gốc cao.
 * - "hien-te-thuong": (tên hiển thị cũng là "Hiến tế", khác keyword Hiến tế cũ) triệu hồi nhờ hiến tế thì có thưởng.
 * - "hoi-phuc": hồi máu sau giao tranh hoặc cuối lượt. - "doi-mo": mỗi 3 quái đội mồ chết gần nhất trỗi dậy cả 3 với 1 máu,
 *   không phòng ngự. - "tao-bai": hiệu ứng tạo bài trên tay. - "dau-luot": đầu lượt phát huy tác dụng.
 * - "bo-bai": bỏ bài để đổi lấy hiệu ứng có lợi. - "xieng-xich": bài quân khống chế.
 * - "tan-cong": thưởng phát huy trước khi quái CHỦ ĐỘNG lao vào đánh hoặc dùng kỹ năng (quái tự đánh/bị động không tính).
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
  | "tan-cong";

/** Bộ icon cũ (15, trong đó Hiến tế cũ đổi tên thành Khế ước, id "khe-uoc"). */
export type LegacyKeywordId =
  | "boc-thep"
  | "khong-lo"
  | "sieu-toc"
  | "nanh-vuot"
  | "luon-lach-1"
  | "luon-lach-2"
  | "phep"
  | "vinh-quang"
  | "khe-uoc"
  | "lien-ket"
  | "bao-oan"
  | "phan-no"
  | "mui-mau"
  | "dam-xuyen"
  | "tan-pha";

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
  "tan-cong": { src: "/ui/kw/tan-cong.webp", label: "Tấn công" },
  "boc-thep": { src: "/ui/kw/boc-thep.webp", label: "Bọc thép" },
  "khong-lo": { src: "/ui/kw/khong-lo.webp", label: "Khổng lồ" },
  "sieu-toc": { src: "/ui/kw/sieu-toc.webp", label: "Siêu tốc" },
  "nanh-vuot": { src: "/ui/kw/nanh-vuot.webp", label: "Nanh vuốt" },
  "luon-lach-1": { src: "/ui/kw/luon-lach-1.webp", label: "Luồn lách 1" },
  "luon-lach-2": { src: "/ui/kw/luon-lach-2.webp", label: "Luồn lách 2" },
  phep: { src: "/ui/kw/phep.webp", label: "Đòn đánh phép" },
  "vinh-quang": { src: "/ui/kw/vinh-quang.webp", label: "Vinh quang" },
  "khe-uoc": { src: "/ui/kw/khe-uoc.webp", label: "Khế ước" },
  "lien-ket": { src: "/ui/kw/lien-ket.webp", label: "Liên kết" },
  "bao-oan": { src: "/ui/kw/bao-oan.webp", label: "Báo oán" },
  "phan-no": { src: "/ui/kw/phan-no.webp", label: "Phẫn nộ" },
  "mui-mau": { src: "/ui/kw/mui-mau.webp", label: "Mùi máu" },
  "dam-xuyen": { src: "/ui/kw/dam-xuyen.webp", label: "Đâm xuyên" },
  "tan-pha": { src: "/ui/kw/tan-pha.webp", label: "Tàn phá" },
};

/** Keyword từng quái, theo id quái (chủ game duyệt 10/11: đa phần 1, tối đa 2, chỉ cái đặc trưng chính). */
export const CARD_KEYWORDS: Record<string, KeywordId[]> = {
  "chien-si-gam-nham": ["ben-bi"],
  "chien-binh-rong": ["ben-bi"],
  "hiep-si-ho-ve": ["ben-bi"],
  "khong-lo-mot-mat": ["luc-luong"],
  "may-chem": ["luc-luong"],
  "trai-tim-hai-long": ["tan-pha"],
  "loi-nguyen-cua-rong": ["tan-pha"],
  "thuong-quan-long": ["tan-pha"],
  "may-nem-bom-hinh-nhen": ["tan-pha"],
  "ong-khong-lo": ["xieng-xich"],
  "sat-nhan-bat-giu": ["xieng-xich"],
  "phu-thuy-rung-den": ["xieng-xich"],
  "my-dieu-nhan": ["nhiem-vu", "xieng-xich"],
  "kiem-si-lua-thieng": ["khe-uoc"],
  "ke-giam-ho-linh-hon": ["khe-uoc"],
  "mo-voi-ma-mut": ["khe-uoc", "bao-oan"],
  "dau-si-bo-tot": ["vinh-quang"],
  "rong-boc-trung": ["hoi-phuc"],
  "kizuran": ["hoi-phuc"],
  "quai-thu-thien-su": ["dau-luot"],
  "ke-san-moi-tu-than": ["bao-oan"],
  "ky-si-bong-toi": ["tan-cong"],
};

/** Dòng mô tả (theo tên kỹ năng trên bảng quái) được in icon keyword phía trước. */
export const KEYWORD_LINES: Record<string, Record<string, KeywordId>> = {
  "chien-si-gam-nham": { "Khiên thú sĩ": "ben-bi" },
  "chien-binh-rong": { "Vảy rồng": "ben-bi" },
  "hiep-si-ho-ve": { "Lời chúc của kỵ sĩ": "ben-bi", "Lời chúc của vua": "ben-bi", "Lời chúc của hậu": "ben-bi" },
  "trai-tim-hai-long": { "Đại hồng thuỷ huỷ diệt": "tan-pha" },
  "loi-nguyen-cua-rong": { "Địa ngục lửa": "tan-pha" },
  "thuong-quan-long": { "Cò quay": "tan-pha" },
  "may-nem-bom-hinh-nhen": { "Súng phóng lựu": "tan-pha" },
  "ong-khong-lo": { "Kim châm tê liệt": "xieng-xich" },
  "sat-nhan-bat-giu": { "Bắt Giữ": "xieng-xich" },
  "phu-thuy-rung-den": { "Nguyền rủa": "xieng-xich" },
  "my-dieu-nhan": { "Mê hoặc": "xieng-xich" },
  "kiem-si-lua-thieng": { "Truy cùng diệt tận": "khe-uoc", "Hoả thần long": "khe-uoc" },
  "ke-giam-ho-linh-hon": { "Kiếm hấp thụ linh hồn": "khe-uoc" },
  "mo-voi-ma-mut": { "Nguyền rủa": "khe-uoc", "Ác linh": "bao-oan" },
  "dau-si-bo-tot": { "Chiến lợi phẩm": "vinh-quang" },
  "rong-boc-trung": { "Thế thủ": "hoi-phuc" },
  kizuran: { "Chịu đòn vì bạn": "hoi-phuc" },
  "quai-thu-thien-su": { "Cầu nguyện": "dau-luot", "Ân huệ thiên sứ": "dau-luot" },
  "ke-san-moi-tu-than": { "Kẻ săn mồi tử thần": "bao-oan" },
  "ky-si-bong-toi": { "Kỵ pháp": "tan-cong" },
};

export function keywordsOf(cardId: string | undefined | null): KeywordId[] {
  return cardId ? (CARD_KEYWORDS[cardId] ?? []) : [];
}
