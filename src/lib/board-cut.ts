/**
 * Hai bàn đấu (chủ game 15/11): `board-a.jpg` 942 x 1670 cho màn tỉ lệ 9:16, `board-b.jpg` 877 x 1793 cho màn dài hơn (9:20).
 * Không còn cắt bàn: bàn luôn hiện đủ, co đều theo bề ngang (màn thấp hơn thì co theo bề cao). Mọi số vị trí trong game là
 * phần trăm của ảnh bàn đang dùng; bảng số riêng từng bàn đặt qua `byBoard`. Các hàm `ry`, `rh`, `cutBox`, `cutView` giữ lại
 * để code cũ chạy tiếp, nhưng nay là phép nhân 1 (không cắt).
 */
export type BoardId = "a" | "b";

export type BoardVariant = {
  id: BoardId;
  /** Cỡ ảnh gốc (điểm ảnh). */
  w: number;
  h: number;
  art: string;
  /** Dải đá giữa sân: mép dưới nửa đỏ và mép trên nửa xanh (phần trăm chiều cao ảnh). */
  redEnd: number;
  blueStart: number;
};

export const BOARDS: Record<BoardId, BoardVariant> = {
  a: { id: "a", w: 942, h: 1670, art: "/board-a.jpg", redEnd: 39.5, blueStart: 56.9 },
  b: { id: "b", w: 877, h: 1793, art: "/board-b.jpg", redEnd: 41.5, blueStart: 56.3 },
};

/** Màn có cao/rộng từ ngần này trở lên dùng bàn B, nhỏ hơn dùng bàn A (giữa 1,773 của A và 2,044 của B). */
export const BOARD_SWITCH = 1.91;

export type BoardCut = {
  id: BoardId;
  /** Giữ chỗ cho code cũ: không cắt nên luôn 0, `from` = `to`, `v` = 1. */
  top: number;
  from: number;
  to: number;
  v: number;
  short?: boolean;
};

function noCut(id: BoardId): BoardCut {
  return { id, top: 0, from: BOARDS[id].redEnd, to: BOARDS[id].redEnd, v: 1 };
}

const CUTS: Record<BoardId, BoardCut> = { a: noCut("a"), b: noCut("b") };
export const NO_CUT: BoardCut = CUTS.b;

/** Bàn nào dùng cho màn rộng `screenW` cao `screenH` (px). */
export function pickBoard(screenW: number, screenH: number): BoardId {
  return screenH / Math.max(1, screenW) >= BOARD_SWITCH ? "b" : "a";
}

/** Giữ tên cũ: trả "vết cắt" (nay chỉ chọn bàn) cho màn `screenW` x `screenH`; tham số đầu là bề ngang bàn cũ (bỏ qua). */
export function planCut(_boardW: number, screenH: number, screenW = 0): BoardCut {
  const w = screenW || _boardW;
  return CUTS[pickBoard(w, screenH)];
}

export function sameCut(a: BoardCut, b: BoardCut): boolean {
  return a.id === b.id;
}

let current: BoardCut = NO_CUT;

export function setBoardCut(cut: BoardCut) {
  current = cut;
}

export function boardCut(): BoardCut {
  return current;
}

/** Bàn đang dùng. */
export function board(cut: BoardCut = current): BoardVariant {
  return BOARDS[cut.id];
}

/** Bàn đang dùng cho màn hiện tại của trình duyệt (cho trang không đo màn như Tuỳ chỉnh). */
export function boardOfWindow(): BoardCut {
  if (typeof window === "undefined") return current;
  return CUTS[pickBoard(window.innerWidth, window.innerHeight)];
}

export const redEnd = (cut: BoardCut = current) => BOARDS[cut.id].redEnd;
export const blueStart = (cut: BoardCut = current) => BOARDS[cut.id].blueStart;

/** Cao chia rộng của ảnh bàn đang dùng. */
export function boardRatio(cut: BoardCut = current): number {
  const b = BOARDS[cut.id];
  return b.h / b.w;
}

/** Bề ngang bàn chia bề cao bàn đang hiện. */
export function boardAspect(cut: BoardCut = current): number {
  return 1 / boardRatio(cut);
}

/** Không cắt: vị trí giữ nguyên. */
export function ry(y: number, _cut: BoardCut = current): number {
  return y;
}

export function rh(h: number, _cut: BoardCut = current): number {
  return h;
}

/** Bản đồ bảng toạ độ `raw` theo bàn đang dùng; tính lại khi đổi bàn. */
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

/** Bảng riêng từng bàn: đọc bảng của bàn đang dùng. Đọc, liệt kê khoá và trải (`...`) đều chạy. */
export function byBoard<T extends object>(tables: Record<BoardId, T>): T {
  const now = () => tables[current.id];
  return new Proxy({} as T, {
    get: (_, key) => (now() as Record<string | symbol, unknown>)[key],
    has: (_, key) => key in now(),
    ownKeys: () => Reflect.ownKeys(now()),
    getOwnPropertyDescriptor: (_, key) => {
      const desc = Object.getOwnPropertyDescriptor(now(), key);
      return desc ? { ...desc, configurable: true } : undefined;
    },
  });
}

/** Ô có góc trên trái (x, y) và cỡ (w, h). */
export function cutBox<B extends { y: number; h: number }>(box: B, _cut: BoardCut): B {
  return box;
}
