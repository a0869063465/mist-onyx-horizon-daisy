/**
 * Bảng đăng ký skill bị động / phản ứng với Giải giới (vô hiệu hoá), chủ game 22/11.
 *
 * Mỗi lá có skill bị động ("passive") hoặc skill dùng như phép ("spell") trong SKILL_BOOK phải có một dòng ở đây.
 * Thêm lá mới có skill bị động mà quên dòng này thì `scripts/round-rules.mjs` báo lỗi, ghi rõ tên lá.
 *
 * - "chan": đã chặn khi quái bị giải giới (có `!sealed(...)` ở chỗ skill chạy trong duel.ts).
 * - "tay":  skill chỉ dùng từ trên tay, quái chưa ở sân nên không bị giải giới.
 * - "chua": chưa rà; skill bị động này có thể vẫn chạy khi quái bị giải giới.
 */
export type SealStatus = "chan" | "tay" | "chua";

export const SEAL_PASSIVES: Record<string, { status: SealStatus; note?: string }> = {
  // Đã chặn
  "quai-thu-thien-su": { status: "chan", note: "Ân huệ thiên sứ (mana); Cầu nguyện chưa rà" },
  "chien-si-gam-nham": { status: "chan", note: "Khiên thú sĩ" },
  "yeu-tinh-chuc-phuc": { status: "chan", note: "hào quang, Hộ thủ" },
  "linh-chien-da-khong-lo": { status: "chan", note: "Tường thành" },
  "tho-den-tinh-nghich": { status: "chan", note: "né đòn" },
  "sua-hut-ma-phap": { status: "chan", note: "Phản phép" },
  kraken: { status: "chan", note: "Đắm tàu" },
  kizuran: { status: "chan", note: "Chịu đòn vì bạn" },
  "chien-binh-ky-nhong": { status: "chan", note: "Linh hoạt (né đòn)" },
  "chien-binh-cuoi-rong": { status: "chan", note: "Linh hoạt (né đòn); Cưỡi rồng chưa rà" },
  "dong-ho-kho-doan": { status: "chan", note: "Tiktok" },
  "dong-ho-hung-bao": { status: "chan", note: "Tiktok" },
  "dong-ho-mong-manh": { status: "chan", note: "Tiktok" },
  "thien-than-be-nho": { status: "chan", note: "Tinh linh bé nhỏ" },
  "hiep-si-ho-ve": { status: "chan", note: "Kiếm hộ vệ; Học tập, Trưởng thành, các Lời chúc chưa rà" },
  "hiep-si-huyen-bi": { status: "chan", note: "Phòng ngự; Khiên toàn năng chưa rà" },
  "my-dieu-nhan": { status: "chan", note: "Giáp và Vuốt, Roi điện" },
  "nu-chua-dieu-nhan": { status: "chan", note: "Giáp và Vuốt, Roi điện" },
  "the-than-cua-shien": { status: "chan", note: "Thế thân trên sân" },
  // Chỉ dùng từ tay
  "cuc-bong-ma-quai": { status: "tay", note: "Bông mềm" },
  // Chưa rà
  "phu-thuy-thoi-gian": { status: "chua", note: "Cường hoá Lão Hoá" },
  "dau-si-bo-tot": { status: "chua", note: "Chiến lợi phẩm" },
  "trieu-hoi-ac-ma": { status: "chua", note: "Khế ước ác ma" },
  "ky-si-bong-toi": { status: "chua", note: "Kỵ pháp, Chiến ý" },
  "mo-voi-ma-mut": { status: "chua", note: "Ác linh" },
  "khung-long-vay-kiem": { status: "chua", note: "Vãy phá giáp" },
  "te-giac-chien-binh": { status: "chua", note: "Tinh thần chiến binh" },
  "sau-non": { status: "chua", note: "Nở" },
  "trai-tim-hai-long": { status: "chua", note: "Con nước lớn tàn phá, Đại hồng thuỷ huỷ diệt" },
  "con-thinh-no-cua-hai-vuong": { status: "chua", note: "Hộ thần, Đè nén, Biển lặng" },
  "ke-san-moi-tu-than": { status: "chua", note: "Kẻ săn mồi tử thần" },
  kazura: { status: "chua", note: "Săn bắt vì bạn" },
  "ke-giam-ho-linh-hon": { status: "chua", note: "Phẫn nộ" },
  "khong-lo-mot-mat": { status: "chua", note: "Đập phá" },
  "khong-lo-mac-giap": { status: "chua", note: "Đập phá" },
  "khong-lo-thu-linh": { status: "chua", note: "Đập phá" },
  "may-quay-thuong": { status: "chua", note: "Số 7, Kiếm, Khiên, Thập tự, Số 6" },
  "chien-binh-rong": { status: "chua", note: "Vảy rồng" },
  "hiep-si-cua-vua": { status: "chua", note: "các Lời chúc, Kiếm tấn công" },
  "hiep-si-cua-hau": { status: "chua", note: "các Lời chúc" },
  "nu-chua-dieu-nhan-hoan-my": { status: "chua", note: "Giáp phản" },
  "ky-si-cuoi-rong": { status: "chua", note: "Mũi thương bị nguyền rủa, Lửa địa ngục" },
  "chien-binh-huyen-thoai": { status: "chua", note: "Chiến sư, Bền bỉ" },
  "chan-ken": { status: "chua", note: "Chân kén" },
};
