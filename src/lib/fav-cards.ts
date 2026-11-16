/** Lá yêu thích (chủ game 16/11: trái tim ở tab Sở hữu của bảng mô tả). Chỉ lưu trên máy, chưa dùng ở chỗ khác. */
const KEY = "clash-fav-cards";

function read(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isFavCard(id: string): boolean {
  return typeof localStorage !== "undefined" && read().includes(id);
}

/** Đổi dấu yêu thích; trả về trạng thái mới. */
export function toggleFavCard(id: string): boolean {
  const list = read();
  const on = !list.includes(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(on ? [...list, id] : list.filter((one) => one !== id)));
  } catch {
    // máy chặn lưu: dấu chỉ đổi trong lúc xem
  }
  return on;
}
