/**
 * Màn thiếu chiều dọc (chủ game 28/10): bàn 841 x 1870 bị cắt bớt thay vì xén phần trên.
 * 1) cắt phía trên tới sát cầu máu / cầu mana của đối thủ;
 * 2) còn thiếu thì hai nửa đỏ và xanh xích lại gần nhau, đè lên nền sân không có đĩa (`board-floor.jpg`) lót ở dưới.
 * Mọi số vị trí trong game vẫn là phần trăm của ảnh bàn đầy đủ; `ry` đổi sang phần trăm của bàn đã cắt.
 */
export const BOARD_PX = { w: 841, h: 1870 };
/** Bàn đầy đủ: cao bằng 2,2235 lần bề ngang. */
export const FULL_RATIO = BOARD_PX.h / BOARD_PX.w;

/** Cắt ở trên tối đa tới đây (phần trăm chiều cao ảnh): chạm mép trên cầu mana của đối thủ. */
export const TOP_KEEP = 5;
/** Mép dưới nửa đỏ (hết lớp đất cam) và mép trên nửa xanh, theo ảnh bàn. */
export const RED_END = 42.2;
export const BLUE_START = 60.7;
/** Hai nửa chừa lại ít nhất chừng này nền sân giữa chúng. */
const MIN_GAP = 1.5;

export type BoardCut = {
  /** Phần trăm bỏ ở đầu ảnh. */
  top: number;
  /** Đoạn nền sân bỏ đi giữa hai nửa, phần trăm của ảnh đầy đủ: từ `from` tới `to`. */
  from: number;
  to: number;
  /** Phần của bàn đầy đủ còn lại (0–1). */
  v: number;
};

export const NO_CUT: BoardCut = { top: 0, from: RED_END, to: RED_END, v: 1 };

/** Cắt cho bàn rộng `boardW` px trên màn cao `screenH` px. */
export function planCut(boardW: number, screenH: number): BoardCut {
  const full = boardW * FULL_RATIO;
  // Dư một chút để làm tròn điểm ảnh không chừa khe ở mép trên (thừa thì mép trên bị xén, không thấy).
  const need = Math.max(0, (1 - screenH / full) * 100 + 0.2);
  if (need <= 0.2 || !Number.isFinite(need)) return NO_CUT;
  const top = Math.min(need, TOP_KEEP);
  const band = Math.min(need - top, BLUE_START - RED_END - MIN_GAP);
  const v = 1 - (top + band) / 100;
  return { top, from: RED_END, to: RED_END + band, v };
}

export function sameCut(a: BoardCut, b: BoardCut): boolean {
  return a.top === b.top && a.from === b.from && a.to === b.to && a.v === b.v;
}

let current: BoardCut = NO_CUT;

export function setBoardCut(cut: BoardCut) {
  current = cut;
}

export function boardCut(): BoardCut {
  return current;
}

/** Chiều cao một vị trí của ảnh đầy đủ (phần trăm) -> phần trăm của bàn đã cắt. Điểm trong dải bỏ dồn về chỗ nối. */
export function ry(y: number, cut: BoardCut = current): number {
  const band = cut.to - cut.from;
  // Điểm rơi vào đoạn bỏ đi thì dồn về giữa chỗ nền sân còn lại giữa hai nửa.
  const shown = y <= cut.from ? y - cut.top : y >= cut.to ? y - cut.top - band : cut.from - cut.top + (BLUE_START - cut.to) / 2;
  return shown / cut.v;
}

/** Một độ cao (phần trăm của bàn đầy đủ) -> phần trăm của bàn đã cắt. */
export function rh(h: number, cut: BoardCut = current): number {
  return h / cut.v;
}

/** Bề ngang bàn chia bề cao bàn đang hiện. */
export function boardAspect(cut: BoardCut = current): number {
  return BOARD_PX.w / BOARD_PX.h / cut.v;
}

/** Bản đồ bảng toạ độ `raw` theo vết cắt hiện tại; tính lại khi vết cắt đổi. */
export function cutView<T extends object>(raw: T, map: (raw: T, cut: BoardCut) => T): T {
  let seen: BoardCut | null = null;
  let out = raw;
  const get = () => {
    if (seen !== current) {
      seen = current;
      out = map(raw, current);
    }
    return out;
  };
  return new Proxy({} as T, { get: (_, key) => (get() as Record<string | symbol, unknown>)[key] });
}

/** Ô có góc trên trái (x, y) và cỡ (w, h). */
export function cutBox<B extends { y: number; h: number }>(box: B, cut: BoardCut): B {
  return { ...box, y: ry(box.y, cut), h: rh(box.h, cut) };
}
