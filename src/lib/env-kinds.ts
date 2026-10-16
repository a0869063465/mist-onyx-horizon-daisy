import { monsterCard } from "./catalog.ts";

/**
 * Hệ của quái cho từng lá môi trường. Mỗi quái thuộc một hệ.
 * Sửa danh sách ở đây khi chủ game xếp lại hệ. Quái 5 sao không được hưởng môi trường.
 */
export const ENV_KINDS: Record<string, string[]> = {
  // Chiến binh
  "thao-nguyen": [
    "chien-si-gam-nham",
    "kiem-si-lua-thieng",
    "dau-si-bo-tot",
    "hiep-si-cua-vua",
    "hiep-si-ho-ve",
    "hiep-si-cua-hau",
    "chien-binh-rong",
  ],
  // Đất đá
  "dat-da": ["linh-chien-da-khong-lo", "khung-long-vay-kiem", "mo-voi-ma-mut", "khong-lo-mot-mat"],
  // Chim chóc và rồng
  nui: ["rong-phun-hoa-cau", "rong-boc-trung", "rong-con", "rong-ngan-tuoi", "loi-nguyen-cua-rong", "my-dieu-nhan", "nu-chua-dieu-nhan"],
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
  ],
  // Bóng tối
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
  ],
};

/** True when the environment card `env` boosts this monster (its kind, and at most 4 stars). */
export function envFavors(env: string | undefined, cardId: string): boolean {
  if (!env) return false;
  const list = ENV_KINDS[env];
  if (!list || !list.includes(cardId)) return false;
  return (monsterCard(cardId)?.stars ?? 0) <= 4;
}
