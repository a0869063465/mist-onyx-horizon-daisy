/**
 * Hệ của quái cho từng lá môi trường. Mỗi quái thuộc một hệ.
 * Sửa danh sách ở đây khi chủ game xếp lại hệ. Quái 5 sao và dạng ngoài bộ cũng được hưởng môi trường (chủ game 19/10).
 */
/**
 * Thánh địa thiên sứ. Guarded: the angels (thiên sứ, yêu tinh, tinh linh: frail buffers) and the sanctuary's
 * buffing priests (Thánh thuật sư). Người yêu hạnh phúc is a frail winged spirit, same guard. Warriors: the angel
 * warriors who fight (none yet).
 */
export const SANCTUARY_GUARDED = [
  "quai-thu-thien-su",
  "yeu-tinh-chuc-phuc",
  "thien-than-be-nho",
  "thanh-thuat-su",
  "nguoi-yeu-hanh-phuc",
];
export const SANCTUARY_WARRIORS: string[] = [];

/** Quái biển: Biển sâu ẩn chỉ số và xáo ô của chúng (luật trong duel.ts, che tên trong play.tsx). */
export const SEA_KINDS = ["trai-tim-hai-long", "sua-hut-ma-phap", "kraken", "con-thinh-no-cua-hai-vuong", "leviathan", "ky-sinh-trung-kim-loai"];

export const ENV_KINDS: Record<string, string[]> = {
  // Biển sâu: quái biển
  "bien-sau": SEA_KINDS,
  // Chiến binh (cả dạng người: Kazura, Kizuran; Ma đạo sĩ là mạo hiểm giả phe con người; Thế thân của shien là kiếm sĩ)
  "thao-nguyen": [
    "chien-si-gam-nham",
    "kiem-si-lua-thieng",
    "dau-si-bo-tot",
    "hiep-si-cua-vua",
    "hiep-si-ho-ve",
    "hiep-si-cua-hau",
    "chien-binh-rong",
    "kazura",
    "kizuran",
    "ma-dao-si",
    "the-than-cua-shien",
    "ky-si-canh-cut",
    "chien-binh-nam-cham",
  ],
  // Đất đá
  "dat-da": ["linh-chien-da-khong-lo", "khung-long-vay-kiem", "mo-voi-ma-mut", "khong-lo-mot-mat", "khung-long-hinh-nguoi", "hu-nhot-linh-hon", "binh-bien-hinh", "te-te-da"],
  // Chim chóc, rồng và quái điện
  nui: ["rong-phun-hoa-cau", "rong-boc-trung", "rong-con", "rong-ngan-tuoi", "loi-nguyen-cua-rong", "my-dieu-nhan", "nu-chua-dieu-nhan", "mat-xanh-huy-diet", "ky-nhong-dien", "sieu-dan-t-rex"],
  // Thú rừng và côn trùng
  "rung-ram": [
    "ong-khong-lo",
    "sau-non",
    "ken-ngai",
    "ngai-khong-lo",
    "ngai-nu-hoang",
    "tho-den-tinh-nghich",
    "te-giac-be-con",
    "te-giac-hieu-thang",
    "te-giac-chien-binh",
    "hoa-an-thit-nguoi",
    "sangan",
  ],
  // Máy móc (thân làm phần lớn bằng sắt)
  "cu-dia-may-moc": ["thuong-quan-long", "may-chem", "may-nem-bom-hinh-nhen", "may-quay-thuong", "metal-zoa"],
  // Núi dung nham: quái hệ lửa (chủ game 19/10: chưa có quái nào; mỗi quái chỉ thuộc một môi trường)
  "nui-dung-nham": [],
  // Thiên sứ: thiên sứ, thuật sư phục vụ thánh địa, chiến binh thiên sứ
  "thanh-dia-thien-su": [...SANCTUARY_GUARDED, ...SANCTUARY_WARRIORS],
  // Bóng tối (cả phù thuỷ: Phù thuỷ thời gian, Phù thuỷ tí hơn). Zoa là Ác ma, chưa có lá môi trường Ác ma.
  "bong-toi": [
    "trieu-hoi-ac-ma",
    "ky-si-bong-toi",
    "chien-binh-lan-khuat",
    "ke-san-moi-tu-than",
    "sat-nhan-bat-giu",
    "ga-he-dang-so",
    "cuc-bong-ma-quai",
    "mat-do-tan-pha",
    "phu-thuy-rung-den",
    "ke-giam-ho-linh-hon",
    "phu-thuy-thoi-gian",
    "phu-thuy-ti-hon",
    "mat-na-bong-toi",
    "rong-dia-nguc",
    "ke-trom-ao-trang",
    "bong-ma-dia-nguc",
  ],
};

/**
 * True when the environment card `env` boosts this monster (its kind). Environments count for 5-star monsters and
 * forms outside the deck too (owner, 19/10); they are only left out of deck counts.
 */
export function envFavors(env: string | undefined, cardId: string, jarSoul = false): boolean {
  if (!env) return false;
  if (jarSoul) return env === "bong-toi";
  const list = ENV_KINDS[env];
  return Boolean(list && list.includes(cardId));
}
