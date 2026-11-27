/**
 * Bảng đăng ký skill bị động / phản ứng với Giải giới (vô hiệu hoá), chủ game 22/11.
 *
 * Mỗi lá có skill bị động ("passive") hoặc skill dùng như phép ("spell") trong SKILL_BOOK phải có một dòng ở đây.
 * Thêm lá mới có skill bị động mà quên dòng này thì `scripts/round-rules.mjs` báo lỗi, ghi rõ tên lá.
 *
 * - "chan": đã chặn khi quái bị giải giới (có `!disarmed(...)` ở chỗ skill chạy trong duel.ts).
 * - "tay":  skill chỉ dùng từ trên tay, quái chưa ở sân nên không bị giải giới.
 * - "giu":  cố ý giữ: là điều kiện phải trả (cầu nguyện, khế ước), không phải lợi; bỏ đi thì quái được lợi.
 * - "chua": chưa rà; skill bị động này có thể vẫn chạy khi quái bị giải giới.
 *
 * Lá mới có skill bị động: chặn bằng `numb(mon)` (tắt khi bị giải giới, trừ lúc đòn đã phóng đang nổ) ở chỗ skill chạy
 * trong duel.ts, hoặc thêm trường trạng thái của nó vào `DISARM_KEEP` (+ `DISARM_KIT` nếu là đồ của đòn) để giải giới gỡ đi.
 */
export type DisarmStatus = "chan" | "tay" | "giu" | "chua";

export const DISARM_PASSIVES: Record<string, { status: DisarmStatus; note?: string }> = {
  // Đã chặn (kỹ năng chủ động: cửa chung castSkillBody; bị động: numb()/disarmed() hoặc DISARM_KEEP gỡ trạng thái)
  "quai-thu-thien-su": { status: "chan", note: "Ân huệ thiên sứ (mana)" },
  "tinh-linh-dan-hac": { status: "chan", note: "Tiếng nhạc du dương (mana đầu lượt; lúc triệu hồi thì chưa thể bị giải giới)" },
  "thien-su-vo-hinh": { status: "chan", note: "Khoá 1 (monKeywords), Mũi tên thiên sứ (rút lá)" },
  "nang-va-gio": { status: "chan", note: "Gió dịu đi (breezeRises); Nắng ấm lên là kỹ năng chủ động, chặn ở cửa chung" },
  "tu-than-cua-nhung-la-bai": { status: "chan", note: "Gặt hồn (reapPlain bỏ phí tấn công như Đập phá, reapHand không huỷ lá)" },
  "chi-em-harpie": { status: "chan", note: "Chị em: Giải giới 1 lá là cả nhóm (trạng thái chung, settleKin)" },
  "harpie-chi-ca": { status: "chan", note: "Chị em (chung trạng thái); Giáp và Vuốt, Roi điện là lá phép trên tay" },
  "harpie-chi-thu": { status: "chan", note: "Chị em (chung trạng thái); Giáp và Vuốt, Roi điện là lá phép trên tay" },
  "harpie-em-ut": { status: "chan", note: "Chị em (chung trạng thái); Giáp và Vuốt, Roi điện là lá phép trên tay" },
  "chien-si-gam-nham": { status: "chan", note: "Khiên thú sĩ" },
  "yeu-tinh-chuc-phuc": { status: "chan", note: "hào quang, Hộ thủ" },
  "linh-chien-da-khong-lo": { status: "chan", note: "Tường thành" },
  "tho-den-tinh-nghich": { status: "chan", note: "né đòn" },
  "sua-hut-ma-phap": { status: "chan", note: "Phản phép" },
  kraken: { status: "chan", note: "Đắm tàu" },
  kizuran: { status: "chan", note: "Chịu đòn vì bạn" },
  "chien-binh-ky-nhong": { status: "chan", note: "Linh hoạt (né đòn)" },
  "chien-binh-cuoi-rong": { status: "chan", note: "Linh hoạt, Cưỡi rồng" },
  "dong-ho-kho-doan": { status: "chan", note: "Tiktok" },
  "dong-ho-hung-bao": { status: "chan", note: "Tiktok" },
  "dong-ho-mong-manh": { status: "chan", note: "Tiktok" },
  "thien-than-be-nho": { status: "chan", note: "Tinh linh bé nhỏ" },
  "hiep-si-ho-ve": { status: "chan", note: "Kiếm hộ vệ, Lời chúc (gỡ oath), Học tập (vua/hậu bị giải giới thì không dạy)" },
  "hiep-si-huyen-bi": { status: "chan", note: "Phòng ngự, Khiên toàn năng (gỡ veil)" },
  "my-dieu-nhan": { status: "chan", note: "Giáp và Vuốt, Roi điện" },
  "nu-chua-dieu-nhan": { status: "chan", note: "Giáp và Vuốt, Roi điện" },
  "the-than-cua-shien": { status: "chan", note: "Thế thân trên sân" },
  "phu-thuy-thoi-gian": { status: "chan", note: "Cường hoá Lão Hoá (nằm trong kỹ năng)" },
  "dau-si-bo-tot": { status: "chan", note: "Chiến lợi phẩm (bullAward)" },
  "ky-si-bong-toi": { status: "chan", note: "Kỵ pháp (knightOpen), Hiến Tế (offerVow)" },
  "mo-voi-ma-mut": { status: "chan", note: "Ác linh (combatErode)" },
  "khung-long-vay-kiem": { status: "chan", note: "Vãy phá giáp (strikePair)" },
  "te-giac-chien-binh": { status: "chan", note: "Tinh thần chiến binh (clashGrow), về Tê giác bé con" },
  "sau-non": { status: "chan", note: "Nở (kén ngừng đếm, không nở)" },
  "trai-tim-hai-long": { status: "chan", note: "Con nước lớn, Đại hồng thuỷ (nằm trong kỹ năng)" },
  "con-thinh-no-cua-hai-vuong": { status: "chan", note: "Hộ thần (gỡ oath), Đè nén (pressTide), Biển lặng" },
  "ke-san-moi-tu-than": { status: "chan", note: "Kẻ săn mồi tử thần (markPrey, preyKind)" },
  kazura: { status: "chan", note: "Săn bắt vì bạn (leechKazura), được che (kazuraSafe)" },
  "ke-giam-ho-linh-hon": { status: "chan", note: "Phẫn nộ (soulSync, soulLeech, hỏi hiến máu)" },
  "khong-lo-mot-mat": { status: "chan", note: "Đập phá (smashPlain, growSmash)" },
  "khong-lo-mac-giap": { status: "chan", note: "Đập phá" },
  "khong-lo-thu-linh": { status: "chan", note: "Đập phá" },
  "may-quay-thuong": { status: "chan", note: "các ô quay (nằm trong Quay thưởng, spinReel)" },
  "chien-binh-rong": { status: "chan", note: "Vảy rồng (scaly); nợ cũ vẫn trả" },
  "hiep-si-cua-vua": { status: "chan", note: "Lời chúc (gỡ ward), Kiếm tấn công (swordDue, swordSwing)" },
  "hiep-si-cua-hau": { status: "chan", note: "Lời chúc (gỡ oath), Đàm phán (startParley)" },
  "nu-chua-dieu-nhan-hoan-my": { status: "chan", note: "Giáp phản (plateBank, bankPlate)" },
  "ky-si-cuoi-rong": { status: "chan", note: "Mũi thương bị nguyền rủa, Lửa địa ngục (riding)" },
  "chien-binh-huyen-thoai": { status: "chan", note: "Chiến sư (withLegend), Bền bỉ" },
  "chan-ken": { status: "chan", note: "Chân kén (không đỡ hộ kén, không hồi máu)" },
  // Chỉ dùng từ tay
  "cuc-bong-ma-quai": { status: "tay", note: "Bông mềm" },
  // Cố ý giữ
  "trieu-hoi-ac-ma": { status: "giu", note: "Khế ước ác ma: phải trả 1 mana hoặc rời sân" },
};
