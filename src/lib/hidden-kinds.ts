/**
 * Luật L2 quái ẩn (chủ game 14/11). Quái ẩn ra sân không có vòng triệu hồi, glow trắng; đối thủ thấy úp như quái ẩn
 * Biển sâu.
 * - Kiểu 1 (mọi quái ẩn): đếm 4 vòng chung; sang vòng thứ 5 thì lật cho đối thủ xem, về xấp, xáo bài, rút 1 lá, rồi
 *   được triệu hồi phản ứng 1 quái ẩn khác trên tay (không tính lượt triệu hồi của vòng, vẫn phải đủ sao và mana).
 * - Kiểu 2 (một số quái): đủ 2 vòng (3 nếu triệu hồi trong vòng tấn công của đối thủ) thì chớp hồng, bấm Kích hoạt để
 *   dùng tác dụng riêng rồi về xấp như kiểu 1.
 * - Kiểu 3 (mọi quái ẩn): bị đánh hoặc bị kỹ năng thì giao tranh xong (kể cả Trả đòn) mới về xấp như kiểu 1; máu, chỉ
 *   số, trạng thái giữ khi rút lại. Chết thì là chết thường.
 * - Tự đánh hoặc dùng kỹ năng ở lượt của mình thì lộ diện, thành quái thường (không còn kiểu 1).
 * - Quái 5 sao chưa có cơ chế này.
 *
 * Danh sách chủ game chưa đưa: thêm id quái vào đây (1 = chỉ kiểu 1, 2 = có thêm kích hoạt kiểu 2).
 */
export const HIDDEN_CARDS: Record<string, 1 | 2> = {};

/** Số vòng chung quái ẩn đứng úp trước khi tự lật về xấp. */
export const LURK_ROUNDS = 4;

/** Số vòng chờ của kiểu 2 (thêm 1 nếu triệu hồi trong vòng tấn công của đối thủ). */
export const LURK_WAKE = 2;

export function hiddenKind(cardId: string): 1 | 2 | 0 {
  return HIDDEN_CARDS[cardId] ?? 0;
}
