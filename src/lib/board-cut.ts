/**
 * Màn thiếu chiều dọc (chủ game 28/10): bàn 841 x 1870 bị cắt bớt thay vì xén phần trên.
 * 1) cắt phía trên tới sát băng rôn đỏ của đối thủ (giữ nguyên băng rôn, viên máu và mana địch);
 * 2) còn thiếu thì bỏ một dải ngang ở giữa sân, đối xứng quanh tâm vòng tròn, rồi nối hai nửa lại.
 * Mọi số vị trí trong game vẫn là phần trăm của ảnh bàn đầy đủ; `ry` đổi sang phần trăm của bàn đã cắt.
 */
export const BOARD_PX = { w: 841, h: 1870 };
/** Bàn đầy đủ: cao bằng 2,2235 lần bề ngang. */
export const FULL_RATIO = BOARD_PX.h / BOARD_PX.w;

/** Mép trên băng rôn đỏ (phần trăm chiều cao ảnh): cắt tới đây là hết phần có thể cắt ở trên. */
const BANNER_TOP = 3.5;
/** Tâm vòng tròn giữa sân. */
const COMPASS = 51;
/** Dải giữa sân bỏ được tối đa: từ mép dưới hàng trước bên đỏ (38,7) tới mép trên hàng trước bên xanh (63,9) còn chừa 2 mỗi bên. */
const MAX_BAND = 21;

export type BoardCut = {
  /** Phần trăm bỏ ở đầu ảnh. */
  top: number;
  /** Dải bỏ ở giữa, phần trăm của ảnh đầy đủ: từ `from` tới `to`. */
  from: number;
  to: number;
  /** Phần của bàn đầy đủ còn lại (0–1). */
  v: number;
};

export const NO_CUT: BoardCut = { top: 0, from: COMPASS, to: COMPASS, v: 1 };

/** Cắt cho bàn rộng `boardW` px trên màn cao `screenH` px. */
export function planCut(boardW: number, screenH: number): BoardCut {
  const full = boardW * FULL_RATIO;
  // Dư một chút để làm tròn điểm ảnh không chừa khe ở mép trên (thừa thì mép trên bị xén, không thấy).
  const need = Math.max(0, (1 - screenH / full) * 100 + 0.2);
  if (need <= 0.2 || !Number.isFinite(need)) return NO_CUT;
  const top = Math.min(need, BANNER_TOP);
  const band = Math.min(need - top, MAX_BAND);
  const v = 1 - (top + band) / 100;
  return { top, from: COMPASS - band / 2, to: COMPASS + band / 2, v };
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
  const shown = y <= cut.from ? y - cut.top : y >= cut.to ? y - cut.top - band : cut.from - cut.top;
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
