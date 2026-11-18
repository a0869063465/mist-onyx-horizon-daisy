/**
 * Hàng khuyên dùng cho từng quái (chủ game chọn 18/11): mũi tên hàng khuyên dùng toả sáng khi chọn hàng triệu hồi.
 * Quái không có trong hai danh sách thì không toả sáng (chủ game chưa chọn). Thêm quái mới: thêm id vào danh sách.
 */
export type AdvisedRow = "front" | "back";

const FRONT = new Set([
  "rong-phun-hoa-cau",
  "chien-si-gam-nham",
  "dau-si-bo-tot",
  "ky-si-bong-toi",
  "mo-voi-ma-mut",
  "linh-chien-da-khong-lo",
  "khung-long-vay-kiem",
  "rong-boc-trung",
  "tho-den-tinh-nghich",
  "te-giac-be-con",
  "con-thinh-no-cua-hai-vuong",
  "chien-binh-lan-khuat",
  "kraken",
  "kizuran",
  "ke-giam-ho-linh-hon",
  "mat-xanh-huy-diet",
  "hoa-an-thit-nguoi",
  "khong-lo-mot-mat",
  "may-quay-thuong",
  "chien-binh-rong",
  "hiep-si-cua-vua",
  "hiep-si-ho-ve",
  "hiep-si-huyen-bi",
  "ky-si-cuoi-rong",
  "chien-binh-huyen-thoai",
  "khong-lo-mac-giap",
  "khong-lo-thu-linh",
  "chien-binh-cuoi-rong",
]);

const BACK = new Set([
  "phu-thuy-thoi-gian",
  "kiem-si-lua-thieng",
  "trieu-hoi-ac-ma",
  "yeu-tinh-chuc-phuc",
  "ong-khong-lo",
  "ga-he-dang-so",
  "quai-thu-thien-su",
  "phu-thuy-ti-hon",
  "kazura",
  "mat-do-tan-pha",
  "thuong-quan-long",
  "may-nem-bom-hinh-nhen",
  "rong-con",
  "ma-dao-si",
  "thien-than-be-nho",
  "hiep-si-cua-hau",
  "phu-thuy-rung-den",
  "rong-ngan-tuoi",
  "phu-thuy-tap-su",
  "phu-thuy-bac-thay",
]);

export function advisedRow(cardId: string | null | undefined): AdvisedRow | null {
  if (!cardId) return null;
  if (FRONT.has(cardId)) return "front";
  if (BACK.has(cardId)) return "back";
  return null;
}
