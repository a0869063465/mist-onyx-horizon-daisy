/**
 * Luật quái ẩn (chủ game 14/11, sửa 21/11). Mọi quái 1–4 sao đều triệu hồi Ẩn được (nút Ẩn khi kéo lá ra), tốn thêm
 * `HIDE_FEE` mana so với triệu hồi thường, rồi chọn hàng như thường. Quái ẩn ra sân không có vòng triệu hồi, glow trắng,
 * đứng yên; đối thủ thấy úp như quái ẩn Biển sâu.
 * Ba cách kích hoạt (lúc kích hoạt luôn loé sáng):
 * - Chủ động: đủ `LURK_WAKE` vòng chung (thêm 1 nếu triệu hồi trong vòng tấn công của đối thủ) thì chớp, bấm Kích hoạt.
 * - Phản ứng: tuỳ lá (thời điểm ghi trong mô tả của lá), `LURK_ACTS` trong duel.ts.
 * - Bị động: bị đánh, bị kỹ năng, bị phép nhắm; giao tranh xong (kể cả Trả đòn) thì lật.
 * Hết `LURK_ROUNDS` vòng thì tự lật.
 * Lật xong: có lá môi trường Sương mù (`FOG_ENV`) trên sân của chủ quái thì về xấp bài (giữ máu, chỉ số, trạng thái),
 * xáo bài, rút 1 lá, được triệu hồi phản ứng Ẩn 1 quái khác trên tay; không có sương mù thì thành quái thường trên sân.
 * Tự đánh hoặc dùng kỹ năng ở lượt của mình thì lộ diện, thành quái thường. Quái 5 sao không ẩn được.
 */
export const HIDDEN_CARDS: Record<string, 1 | 2> = {};

/** Số vòng chung quái ẩn đứng úp trước khi tự lật. */
export const LURK_ROUNDS = 4;

/** Số vòng chờ trước khi lật chủ động được (thêm 1 nếu triệu hồi trong vòng tấn công của đối thủ). */
export const LURK_WAKE = 2;

/** Triệu hồi Ẩn tốn thêm ngần này mana. */
export const HIDE_FEE = 1;

/** Lá môi trường Sương mù (chưa có lá trong game; chủ game gửi chữ + ảnh thì thêm). */
export const FOG_ENV = "suong-mu";

export function hiddenKind(cardId: string): 1 | 2 | 0 {
  return HIDDEN_CARDS[cardId] ?? 0;
}
