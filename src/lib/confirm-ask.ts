/** K5 (chủ game 14/11): hỏi xác nhận trước khi dùng kỹ năng / phép. Bật sẵn; tắt trong Cài đặt của trận. */
const KEY = "clash-confirm-use";

export function confirmOn(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setConfirmOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Không lưu được thì chỉ giữ trong phiên này.
  }
}
