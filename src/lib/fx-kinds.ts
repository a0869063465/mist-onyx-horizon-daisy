/**
 * Hệ hiệu ứng của từng lá, chọn theo bản chất và kỹ năng của lá.
 * kind: màu, hạt và kiểu nổ. strike: kiểu đòn khi lao vào đánh.
 * Lá không có trong bảng dùng "beast" + "claw" (quái) hoặc "arcane" (phép).
 */
export type FxKind = "fire" | "water" | "storm" | "shadow" | "holy" | "nature" | "earth" | "arcane" | "steel" | "blood" | "beast";
export type FxStrike = "claw" | "blade" | "smash" | "pierce" | "magic" | "shot";

export const CARD_FX_KIND: Record<string, [FxKind, FxStrike]> = {
  "phu-thuy-thoi-gian": ["arcane", "magic"],
  "rong-phun-hoa-cau": ["fire", "claw"],
  "chien-si-gam-nham": ["beast", "claw"],
  "kiem-si-lua-thieng": ["fire", "blade"],
  "dau-si-bo-tot": ["beast", "smash"],
  "trieu-hoi-ac-ma": ["blood", "claw"],
  "ky-si-bong-toi": ["shadow", "blade"],
  "yeu-tinh-chuc-phuc": ["holy", "magic"],
  "mo-voi-ma-mut": ["shadow", "smash"],
  "ong-khong-lo": ["nature", "pierce"],
  "linh-chien-da-khong-lo": ["earth", "smash"],
  "khung-long-vay-kiem": ["beast", "claw"],
  "rong-boc-trung": ["earth", "claw"],
  "ga-he-dang-so": ["shadow", "magic"],
  "tho-den-tinh-nghich": ["nature", "claw"],
  "cuc-bong-ma-quai": ["shadow", "magic"],
  "bong-ma-dia-nguc": ["shadow", "claw"],
  "chien-binh-xuong": ["shadow", "blade"],
  "medusa": ["earth", "magic"],
  "quai-thu-thien-su": ["holy", "magic"],
  "te-giac-be-con": ["earth", "smash"],
  "te-giac-hieu-thang": ["earth", "smash"],
  "te-giac-chien-binh": ["earth", "smash"],
  "phu-thuy-ti-hon": ["storm", "magic"],
  "sau-non": ["nature", "pierce"],
  "ken-ngai": ["nature", "smash"],
  "chan-ken": ["nature", "smash"],
  "ngai-khong-lo": ["nature", "magic"],
  "ngai-nu-hoang": ["nature", "magic"],
  "ngai-hoan-my": ["nature", "magic"],
  "trai-tim-hai-long": ["water", "magic"],
  "sua-hut-ma-phap": ["water", "magic"],
  "con-thinh-no-cua-hai-vuong": ["water", "pierce"],
  kraken: ["water", "smash"],
  "chien-binh-lan-khuat": ["shadow", "blade"],
  "ke-san-moi-tu-than": ["blood", "claw"],
  "sat-nhan-bat-giu": ["shadow", "blade"],
  kazura: ["blood", "claw"],
  kizuran: ["earth", "smash"],
  "ke-giam-ho-linh-hon": ["shadow", "blade"],
  "mat-xanh-huy-diet": ["holy", "claw"],
  "mat-do-tan-pha": ["fire", "claw"],
  "hoa-an-thit-nguoi": ["nature", "claw"],
  "thuong-quan-long": ["steel", "shot"],
  "may-nem-bom-hinh-nhen": ["steel", "shot"],
  "khong-lo-mot-mat": ["earth", "smash"],
  "may-quay-thuong": ["steel", "smash"],
  "rong-con": ["fire", "claw"],
  "chien-binh-rong": ["fire", "blade"],
  "may-chem": ["steel", "blade"],
  "ma-dao-si": ["arcane", "magic"],
  "loi-nguyen-cua-rong": ["fire", "magic"],
  "thien-than-be-nho": ["holy", "magic"],
  "hiep-si-cua-vua": ["holy", "blade"],
  "hiep-si-ho-ve": ["holy", "blade"],
  "hiep-si-cua-hau": ["holy", "blade"],
  "my-dieu-nhan": ["storm", "claw"],
  "nu-chua-dieu-nhan": ["storm", "claw"],
  "nu-chua-dieu-nhan-hoan-my": ["storm", "claw"],
  "the-than-cua-shien": ["arcane", "magic"],
  "phu-thuy-rung-den": ["shadow", "magic"],
  "hiep-si-huyen-bi": ["arcane", "blade"],
  "ky-si-cuoi-rong": ["fire", "pierce"],
  "rong-ac-ma": ["blood", "claw"],
  "rong-ngan-tuoi": ["fire", "claw"],
  "chien-binh-huyen-thoai": ["holy", "blade"],
  mu: ["arcane", "magic"],
  // phép
  "sam-set-tan-the": ["storm", "magic"],
  "guong-phong-ho": ["arcane", "magic"],
  "la-chan-phan-don": ["arcane", "magic"],
  "soi-xich-dia-nguc": ["blood", "magic"],
  "vong-nguyen-rua-ac-ma": ["blood", "magic"],
  "sung-loi-pha": ["storm", "magic"],
  "hap-thu-ma-phap": ["arcane", "magic"],
  "phan-nguyen": ["shadow", "magic"],
  "phuc-kich": ["steel", "blade"],
  "mua-ma-thuat": ["holy", "magic"],
  "hoan-doi": ["arcane", "magic"],
  "vong-xoay-bao-ho": ["water", "magic"],
  "ngan-chan-phong-ngu": ["shadow", "magic"],
  "thanh-guom-anh-sang": ["holy", "blade"],
  "thu-hoi-quai-thu": ["arcane", "magic"],
  "virus-an-mon": ["nature", "magic"],
  "ke-dao-mo": ["shadow", "magic"],
  "co-may-thoi-gian": ["arcane", "magic"],
  "giap-co-khi": ["steel", "magic"],
  "mu-ma-phap": ["arcane", "magic"],
  "ham-chong": ["steel", "blade"],
};

export function fxKindOf(cardId: string | null | undefined): [FxKind, FxStrike] {
  if (!cardId) return ["beast", "claw"];
  return CARD_FX_KIND[cardId] ?? ["beast", "claw"];
}

export type FxStyle = "new" | "old";
const STYLE_KEY = "clash-fx-style";

/** Which effect system plays in matches. "new" is the default; "old" brings back the previous effects. */
export function fxStyle(): FxStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === "old" ? "old" : "new";
  } catch {
    return "new";
  }
}

export function setFxStyle(style: FxStyle) {
  try {
    localStorage.setItem(STYLE_KEY, style);
  } catch {
    /* storage blocked */
  }
}
