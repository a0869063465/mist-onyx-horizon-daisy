import { board, byBoard } from "./board-cut.ts";
import { boardEnv, ENV_BOARDS } from "./env-boards.ts";
export type HudKey =
  | "foeHp"
  | "foeOrb"
  | "foeFlask"
  | "foeStars"
  | "foeGems"
  | "foeHand"
  | "foeReserve"
  | "youStars"
  | "youGems"
  | "youHp"
  | "youOrb"
  | "youFlask";

export type Mark = { x: number; y: number; size: number; hidden?: boolean };

export const HUD_MARKS: Array<{ key: HudKey; label: string; sample: string }> = [
  { key: "foeHp", label: "Máu địch", sample: "20" },
  { key: "foeOrb", label: "Gem địch", sample: "2" },
  { key: "foeFlask", label: "Bình địch", sample: "0" },
  { key: "foeStars", label: "Sao địch", sample: "0" },
  { key: "foeGems", label: "Thừa địch", sample: "0" },
  { key: "foeHand", label: "Phép địch", sample: "0" },
  { key: "foeReserve", label: "Dự bị địch", sample: "1" },
  { key: "youHp", label: "Máu bạn", sample: "20" },
  { key: "youOrb", label: "Gem bạn", sample: "2" },
  { key: "youFlask", label: "Bình bạn", sample: "0" },
  { key: "youStars", label: "Sao bạn", sample: "0" },
  { key: "youGems", label: "Thừa bạn", sample: "0" },
];

/** Card counts (the opponent's spells in hand and monsters in reserve) show twice their set size, in a framed tile. */
export const COUNT_MARKS: HudKey[] = ["foeHand", "foeReserve"];
export function markScale(key: HudKey): number {
  return COUNT_MARKS.includes(key) ? 2 : 1;
}

/** Số mặc định theo hai bàn (chủ game 15/11): A = màn 9:16, B = màn dài 9:20; đo từ ảnh `board-a.jpg` / `board-b.jpg`. */
export const DEFAULT_BOARD: Record<HudKey, Mark> = byBoard<Record<HudKey, Mark>>({
  a: {
    foeHp: { x: 13.5, y: 5.7, size: 5.6 },
    foeOrb: { x: 86.5, y: 5.7, size: 6.2 },
    foeFlask: { x: 92.5, y: 9.7, size: 3.2 },
    foeStars: { x: 81.7, y: 19, size: 3.6 },
    foeGems: { x: 88, y: 19, size: 3.2 },
    foeHand: { x: 84, y: 29.5, size: 3.2 },
    foeReserve: { x: 50, y: 3.9, size: 3.2 },
    youHp: { x: 10.6, y: 88.5, size: 5.6 },
    youOrb: { x: 89, y: 89.1, size: 6.2 },
    youFlask: { x: 93.5, y: 93.4, size: 3.2 },
    youStars: { x: 81.8, y: 74.1, size: 3.6 },
    youGems: { x: 90, y: 74.1, size: 3.2 },
  },
  b: {
    foeHp: { x: 13.9, y: 12, size: 5.6 },
    foeOrb: { x: 85.5, y: 12, size: 6.2 },
    foeFlask: { x: 92.4, y: 15.4, size: 3.2 },
    foeStars: { x: 77.3, y: 32.6, size: 3.6 },
    foeGems: { x: 86.8, y: 32.6, size: 3.2 },
    foeHand: { x: 82, y: 25.8, size: 3.2 },
    foeReserve: { x: 49.6, y: 10, size: 3.2 },
    youHp: { x: 10, y: 94.1, size: 5.6 },
    youOrb: { x: 88.9, y: 92.9, size: 6.2 },
    youFlask: { x: 93.2, y: 97.3, size: 3.2 },
    youStars: { x: 77.8, y: 70.5, size: 3.6 },
    youGems: { x: 87.3, y: 70.5, size: 3.2 },
  },
});

export type Spot = { x: number; y: number; size: number; width: number; height: number; hidden?: boolean };
export type Notice = { x: number; y: number; w: number; h: number; font: number; hidden?: boolean };
export type Trail = { x: number; y: number; w: number; h: number; dot: number; glow: number; hidden?: boolean };
export type ActKey = "drawMon" | "drawSpell" | "endTurn";
export type FaceKey = "foeFace" | "youFace" | "foeAtk" | "youAtk" | "foeDef" | "youDef";
/** Bố cục bàn Grok (chủ game 28/10): mỗi nút, chân dung, kiếm, khiên có ghim riêng; `actions` cũ giữ để đọc bố cục đã lưu. */
export type BoardLayout = { marks: Record<HudKey, Mark>; notice: Notice; reaction: Notice; stack: Spot; env: Spot; envFoe: Spot; wall: Spot; wallFoe: Spot; trail: Trail; actions: Spot } & Record<ActKey | FaceKey, Spot>;

// Hai bàn mới (chủ game 15/11): số mặc định đo từ ảnh. Lá môi trường, tường thành, kiếm, hồ sơ nằm trong dải đá giữa sân,
// đo từ mép dải (bàn A: 39,5 đến 56,9; bàn B: 41,5 đến 56,3) rồi co theo bề dày dải.
const spot = (x: number, y: number, size: number, width: number, height: number): Spot => ({ x, y, size, width, height, hidden: false });
export const DEFAULT_NOTICE: Notice = byBoard<Notice>({
  a: { x: 16, y: 41.5, w: 64, h: 10, font: 3.2, hidden: false },
  b: { x: 16, y: 43, w: 64, h: 10, font: 3.2, hidden: false },
});
export const DEFAULT_TRAIL: Trail = byBoard<Trail>({
  a: { x: 6.6, y: 44, w: 10, h: 10, dot: 1.4, glow: 3, hidden: false },
  b: { x: 6.6, y: 44.5, w: 10, h: 10, dot: 1.4, glow: 3, hidden: false },
});
export const DEFAULT_REACTION: Notice = byBoard<Notice>({
  a: { x: 64, y: 42.5, w: 22, h: 12, font: 3.2, hidden: false },
  b: { x: 64, y: 43.5, w: 22, h: 12, font: 3.2, hidden: false },
});
export const DEFAULT_STACK: Spot = byBoard<Spot>({ a: spot(85, 63.5, 2.6, 15, 7.2), b: spot(85, 63, 2.6, 15, 7.2) });
export const DEFAULT_ENV: Spot = byBoard<Spot>({ a: spot(73.4, 55.1, 2.2, 16, 4), b: spot(73.4, 54.7, 2.2, 16, 4) });
export const DEFAULT_ENV_FOE: Spot = byBoard<Spot>({ a: spot(74.1, 41.8, 2.2, 16, 4), b: spot(74.1, 43.4, 2.2, 16, 4) });
/** Tường thành (chủ game 01/11): chỗ lá đầu tiên, tâm; các lá sau nối dọc về phía giữa sân. Mặc định = một bước dọc cạnh lá môi trường. */
export const DEFAULT_WALL: Spot = byBoard<Spot>({ a: spot(73.4, 51, 2.2, 16, 4), b: spot(73.4, 51.3, 2.2, 16, 4) });
export const DEFAULT_WALL_FOE: Spot = byBoard<Spot>({ a: spot(74.1, 45.8, 2.2, 16, 4), b: spot(74.1, 46.9, 2.2, 16, 4) });
/** Rút bài / Hết lượt block. Centre x/y; size scales the button text. Default matches the stylesheet. */
export const DEFAULT_ACTIONS: Spot = spot(94.4, 50, 1, 11, 20);

// Chỗ hai nút rút cũ giờ là nút X đỏ (drawMon) và con mắt (drawSpell).
export const DEFAULT_SPOTS: Record<ActKey | FaceKey, Spot> = byBoard<Record<ActKey | FaceKey, Spot>>({
  a: {
    drawMon: spot(78.6, 78.5, 1, 8.4, 4.7),
    drawSpell: spot(78.4, 83.5, 1, 8.4, 4.7),
    endTurn: spot(91.2, 81.2, 1, 14.4, 7.7),
    foeFace: spot(88.3, 42.2, 1, 11.5, 5.2),
    youFace: spot(11.5, 54.7, 1, 11.5, 5.2),
    foeAtk: spot(91.9, 42.4, 1, 19.8, 9.2),
    youAtk: spot(90.2, 53.9, 1, 19.8, 9.2),
    foeDef: spot(88.6, 42.2, 1, 10.2, 4.6),
    youDef: spot(11.7, 54.9, 1, 10.2, 4.6),
  },
  b: {
    drawMon: spot(78.6, 76.5, 1, 8.4, 4.7),
    drawSpell: spot(78.4, 81.5, 1, 8.4, 4.7),
    endTurn: spot(91.2, 79.5, 1, 14.4, 7.7),
    foeFace: spot(88.3, 43.8, 1, 11.5, 5.2),
    youFace: spot(11.5, 54.4, 1, 11.5, 5.2),
    foeAtk: spot(91.9, 43.9, 1, 19.8, 9.2),
    youAtk: spot(90.2, 53.7, 1, 19.8, 9.2),
    foeDef: spot(88.6, 43.8, 1, 10.2, 4.6),
    youDef: spot(11.7, 54.5, 1, 10.2, 4.6),
  },
});
export const BOARD_ACTS: Array<{ key: ActKey; label: string }> = [
  { key: "drawMon", label: "Nút X (huỷ)" },
  { key: "drawSpell", label: "Nút con mắt" },
  { key: "endTurn", label: "Nút OK" },
];
export const BOARD_FACES: Array<{ key: FaceKey; label: string; kind: "face" | "atk" | "def" }> = [
  { key: "foeFace", label: "Hồ sơ địch", kind: "face" },
  { key: "youFace", label: "Hồ sơ bạn", kind: "face" },
  { key: "foeAtk", label: "Tấn công địch", kind: "atk" },
  { key: "youAtk", label: "Tấn công bạn", kind: "atk" },
  { key: "foeDef", label: "Phòng thủ địch", kind: "def" },
  { key: "youDef", label: "Phòng thủ bạn", kind: "def" },
];

/** Bố cục mặc định của bàn đang dùng. */
export function defaultBoardLayout(): BoardLayout {
  return {
    ...DEFAULT_SPOTS,
    marks: { ...DEFAULT_BOARD },
    notice: { ...DEFAULT_NOTICE },
    trail: { ...DEFAULT_TRAIL },
    reaction: { ...DEFAULT_REACTION },
    stack: { ...DEFAULT_STACK },
    env: { ...DEFAULT_ENV },
    envFoe: { ...DEFAULT_ENV_FOE },
    wall: { ...DEFAULT_WALL },
    wallFoe: { ...DEFAULT_WALL_FOE },
    actions: { ...DEFAULT_ACTIONS },
  };
}
/** Giữ tên cũ: đọc luôn ra bố cục mặc định của bàn đang dùng. */
export const DEFAULT_BOARD_LAYOUT: BoardLayout = new Proxy({} as BoardLayout, {
  get: (_, key) => (defaultBoardLayout() as unknown as Record<string | symbol, unknown>)[key],
  ownKeys: () => Reflect.ownKeys(defaultBoardLayout()),
  getOwnPropertyDescriptor: (_, key) => ({ configurable: true, enumerable: true, value: (defaultBoardLayout() as unknown as Record<string | symbol, unknown>)[key] }),
});

export type CardKey = "stars" | "gems" | "def" | "mdef" | "atk" | "hp" | "name" | "fresh";

export const CARD_MARKS: Array<{ key: CardKey; label: string; sample: string; box: boolean }> = [
  { key: "stars", label: "Sao", sample: "2", box: false },
  { key: "gems", label: "Gem", sample: "1", box: false },
  { key: "def", label: "Thủ", sample: "3", box: false },
  { key: "mdef", label: "Thủ phép", sample: "2", box: false },
  { key: "atk", label: "Công", sample: "4", box: false },
  { key: "hp", label: "Máu", sample: "5", box: false },
  { key: "name", label: "Tên", sample: "Thỏ đen", box: true },
  { key: "fresh", label: "New", sample: "New", box: true },
];

export const DEFAULT_CARD: Record<CardKey, Spot> = {
  stars: { x: 88.7, y: 2, size: 24, width: 14, height: 15 },
  gems: { x: 87.8, y: 14.7, size: 19, width: 14, height: 14 },
  def: { x: 21.4, y: 51.4, size: 18, width: 14, height: 12 },
  mdef: { x: 21.9, y: 63.5, size: 18, width: 14, height: 11 },
  atk: { x: 37.1, y: 87.2, size: 22, width: 14, height: 15 },
  hp: { x: 86.2, y: 87.2, size: 22, width: 14, height: 15 },
  name: { x: 28.1, y: 7.6, size: 17, width: 94, height: 28 },
  fresh: { x: 87.9, y: 66.8, size: 12, width: 54, height: 23 },
};

export type SpellKey = "gems" | "name" | "fresh";

export const SPELL_MARKS: Array<{ key: SpellKey; label: string; sample: string; box: boolean }> = [
  { key: "gems", label: "Gem", sample: "1", box: false },
  { key: "name", label: "Tên phép", sample: "Mưa ma thuật", box: true },
  { key: "fresh", label: "New", sample: "New", box: true },
];

export const DEFAULT_SPELL: Record<SpellKey, Spot> = {
  gems: { x: 84.8, y: 10.5, size: 12.5, width: 14, height: 12 },
  name: { x: 50, y: 80.4, size: 13, width: 78, height: 25 },
  fresh: { x: 13.4, y: 3.4, size: 12, width: 54, height: 32 },
};

export type FieldKey = "name" | "def" | "mdef" | "atk" | "hp" | "count";

export type FieldSpot = { x: number; y: number; size: number; width: number; height: number };

export const FIELD_MARKS: Array<{ key: FieldKey; label: string; sample: string; box: boolean }> = [
  { key: "name", label: "Tên", sample: "Thỏ đen", box: true },
  { key: "def", label: "Thủ", sample: "3", box: false },
  { key: "mdef", label: "Thủ phép", sample: "2", box: false },
  { key: "atk", label: "Công", sample: "4", box: false },
  { key: "hp", label: "Máu", sample: "3", box: false },
  { key: "count", label: "Số đếm", sample: "2", box: false },
];

export const DEFAULT_FIELD: Record<FieldKey, FieldSpot> = {
  name: { x: 77.2, y: 0, size: 17, width: 80, height: 26 },
  def: { x: 32.6, y: 44.5, size: 23, width: 22, height: 19 },
  mdef: { x: 32.7, y: 64.5, size: 23, width: 20, height: 19 },
  atk: { x: 36.8, y: 88, size: 26, width: 22, height: 22 },
  hp: { x: 87.2, y: 87.3, size: 26, width: 22, height: 22 },
  count: { x: 57.1, y: 8.1, size: 30, width: 96, height: 22 },
};

/**
 * Fixed spots of the new monster frames (chủ game 02/11; centres, % of the card). The frame draws the icons, so a figure
 * sits beside its icon: SHEET for the sheet's card, HAND for the card in the hand (which also has the stars + gem plaques).
 */
export const SHEET_SPOTS: Record<FieldKey, FieldSpot> = {
  name: { x: 50, y: 50, size: 10, width: 10, height: 10 },
  def: { x: 18.6, y: 51.9, size: 14, width: 10, height: 6 },
  mdef: { x: 18.6, y: 64.3, size: 14, width: 10, height: 6 },
  atk: { x: 37.9, y: 86.8, size: 20, width: 14, height: 9 },
  hp: { x: 86.1, y: 86.8, size: 20, width: 14, height: 9 },
  count: { x: 57.1, y: 8.1, size: 30, width: 96, height: 22 },
};
export const HAND_SPOTS: Record<"stars" | "gems" | "def" | "mdef" | "atk" | "hp", Spot> = {
  stars: { x: 81, y: 4.8, size: 17, width: 40, height: 15 },
  gems: { x: 89.1, y: 18.9, size: 16, width: 18, height: 16 },
  def: { x: 21.9, y: 47.3, size: 18, width: 16, height: 21 },
  mdef: { x: 22.1, y: 63.4, size: 18, width: 16, height: 20 },
  atk: { x: 37.9, y: 87.1, size: 19, width: 18, height: 22 },
  hp: { x: 86.2, y: 86.8, size: 19, width: 18, height: 22 },
};

/** Bố cục bàn lưu riêng từng bàn (A / B, chủ game 15/11); khoá v11 của bàn cũ không còn được đọc. */
const boardStoreKey = () => `clash-board-layout-v12-${board().id}`;
const ALERT_KEY = "clash-alert-size";

export type AlertLook = { glow: number; border: number };

export function loadAlertLook(): AlertLook {
  const raw = read(ALERT_KEY);
  const row = raw && typeof raw === "object" ? (raw as { size?: unknown; border?: unknown }) : {};
  const glow = Number(row.size);
  const border = Number(row.border);
  return {
    glow: Number.isFinite(glow) ? Math.min(96, Math.max(4, glow)) : 32,
    border: Number.isFinite(border) ? Math.min(20, Math.max(1, border)) : 2,
  };
}

export function loadAlert(): number {
  return loadAlertLook().glow;
}

export function saveAlert(glow: number, border: number) {
  localStorage.setItem(
    ALERT_KEY,
    JSON.stringify({
      v: 3,
      size: Math.min(96, Math.max(4, Math.round(glow))),
      border: Math.min(20, Math.max(1, Math.round(border))),
    }),
  );
}
const CARD_KEY = "clash-card-layout";
const SPELL_KEY = "clash-spell-layout";
const HAND_KEY = "clash-card-hand-v2";
const FIELD_KEY = "clash-field-card";
const SPOT_VERSION = 4;

function read(key: string): unknown {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function asSpot(value: unknown, fallback: Spot): Spot {
  const spot = value && typeof value === "object" ? (value as Partial<Spot>) : {};
  return {
    x: typeof spot.x === "number" ? spot.x : fallback.x,
    y: typeof spot.y === "number" ? spot.y : fallback.y,
    size: typeof spot.size === "number" ? spot.size : fallback.size,
    width: typeof spot.width === "number" ? spot.width : fallback.width,
    height: typeof spot.height === "number" ? spot.height : fallback.height,
  };
}

function asTrail(value: unknown): Trail {
  const raw = value && typeof value === "object" ? (value as Partial<Trail>) : {};
  return {
    x: typeof raw.x === "number" ? raw.x : DEFAULT_TRAIL.x,
    y: typeof raw.y === "number" ? raw.y : DEFAULT_TRAIL.y,
    w: typeof raw.w === "number" ? raw.w : DEFAULT_TRAIL.w,
    h: typeof raw.h === "number" ? raw.h : DEFAULT_TRAIL.h,
    dot: typeof raw.dot === "number" ? raw.dot : DEFAULT_TRAIL.dot,
    glow: typeof raw.glow === "number" ? raw.glow : DEFAULT_TRAIL.glow,
    hidden: raw.hidden === true,
  };
}
function asNotice(value: unknown, fallback: Notice): Notice {
  const raw = value && typeof value === "object" ? (value as Partial<Notice>) : null;
  if (!raw || typeof raw.x !== "number") return { ...fallback, hidden: false };
  const notice = {
    x: raw.x,
    y: typeof raw.y === "number" ? raw.y : fallback.y,
    w: typeof raw.w === "number" ? raw.w : fallback.w,
    h: typeof raw.h === "number" ? raw.h : fallback.h,
    font: typeof raw.font === "number" ? raw.font : fallback.font,
    hidden: raw.hidden === true,
  };
  if (fallback === DEFAULT_REACTION && notice.w >= notice.h) return { ...DEFAULT_REACTION, hidden: notice.hidden };
  return notice;
}

function asEnv(value: unknown): Spot {
  if (!value) return { ...DEFAULT_ENV };
  const spot = asStack(value);
  if (spot.y < 56 && spot.height >= 9) return { ...DEFAULT_ENV };
  return spot;
}

function asStack(value: unknown): Spot {
  const spot = asSpot(value, DEFAULT_STACK);
  const raw = value && typeof value === "object" ? (value as Partial<Spot>) : {};
  const base =
    typeof raw.width !== "number" && typeof raw.size === "number" && raw.size > 8
      ? { ...DEFAULT_STACK, x: spot.x, y: spot.y, width: raw.size, height: Math.round(raw.size * 0.72 * 10) / 10 }
      : spot;
  return { ...base, hidden: raw.hidden === true };
}

/** Bố cục bàn dùng CHUNG cho mọi môi trường (chủ game 01/11): khoá riêng từng môi trường cũ không còn được đọc. */
function boardKey(env?: string) {
  return env ? `${boardStoreKey()}:${env}` : boardStoreKey();
}

function asActions(value: unknown): Spot {
  const spot = asSpot(value, DEFAULT_ACTIONS);
  return { ...spot, hidden: false };
}

/** Layout of the board: one for every environment (the parameter is kept for old callers and ignored). */
export function loadBoard(_env?: string): BoardLayout {
  publishLayout();
  const raw = read(boardStoreKey()) as Partial<BoardLayout> & Partial<Record<HudKey, Mark>> | null;
  const marks = { ...DEFAULT_BOARD };
  const source = raw?.marks ?? (raw && typeof raw.foeHp?.x === "number" ? raw : DEFAULT_BOARD);
  for (const key of Object.keys(DEFAULT_BOARD) as HudKey[]) {
    const mark = source[key];
    if (mark && typeof mark.x === "number") marks[key] = { ...DEFAULT_BOARD[key], ...mark, hidden: mark.hidden === true };
  }
  return {
    marks,
    notice: asNotice(raw?.notice, DEFAULT_NOTICE),
    trail: asTrail(raw?.trail),
    reaction: asNotice(raw?.reaction, DEFAULT_REACTION),
    stack: asStack(raw?.stack),
    env: asEnv(raw?.env),
    envFoe: raw?.envFoe ? asStack(raw.envFoe) : { ...DEFAULT_ENV_FOE },
    wall: raw?.wall ? asStack(raw.wall) : { ...DEFAULT_WALL },
    wallFoe: raw?.wallFoe ? asStack(raw.wallFoe) : { ...DEFAULT_WALL_FOE },
    actions: asActions(raw?.actions),
    ...spotsOf(raw as Partial<Record<ActKey | FaceKey, Spot>> | null),
  };
}

function spotsOf(raw: Partial<Record<ActKey | FaceKey, Spot>> | null): Record<ActKey | FaceKey, Spot> {
  const out = {} as Record<ActKey | FaceKey, Spot>;
  for (const key of Object.keys(DEFAULT_SPOTS) as Array<ActKey | FaceKey>) {
    const value = raw?.[key];
    out[key] = value && typeof value.x === "number" ? { ...asSpot(value, DEFAULT_SPOTS[key]), hidden: value.hidden === true } : { ...DEFAULT_SPOTS[key] };
  }
  return out;
}

export function saveBoard(layout: BoardLayout, _env?: string) {
  localStorage.setItem(boardStoreKey(), JSON.stringify(layout));
}

/** Drop an environment's own layout so it follows the default board layout again. */
export function clearBoard(env: string) {
  localStorage.removeItem(boardKey(env));
}

/** No environment has its own layout any more. */
export function savedBoards(): Record<string, BoardLayout> {
  return {};
}

const TOP_MARKS: HudKey[] = ["foeHp", "foeOrb", "foeFlask", "foeStars", "foeGems", "foeHand", "foeReserve"];

/** In a match: the top half follows the opponent's environment layout, the bottom half follows yours. */
export function matchBoard(topEnv: string | null | undefined, bottomEnv: string | null | undefined): BoardLayout {
  const top = loadBoard(boardEnv(topEnv));
  const bottom = loadBoard(boardEnv(bottomEnv));
  const marks = { ...bottom.marks };
  for (const key of TOP_MARKS) marks[key] = top.marks[key];
  return ({
    marks,
    notice: top.notice,
    trail: top.trail,
    reaction: top.reaction,
    envFoe: top.envFoe,
    wallFoe: top.wallFoe,
    env: bottom.env,
    wall: bottom.wall,
    stack: bottom.stack,
    actions: bottom.actions,
    drawMon: bottom.drawMon,
    drawSpell: bottom.drawSpell,
    endTurn: bottom.endTurn,
    youFace: bottom.youFace,
    youAtk: bottom.youAtk,
    youDef: bottom.youDef,
    foeFace: top.foeFace,
    foeAtk: top.foeAtk,
    foeDef: top.foeDef,
  });
}

function loadSpots<K extends string>(key: string, defaults: Record<K, Spot>): Record<K, Spot> {
  const raw = read(key) as { v?: number; spots?: Partial<Record<K, Spot>> } | null;
  const next = {} as Record<K, Spot>;
  const keep = raw?.v === SPOT_VERSION || (key === CARD_KEY && raw?.v === 2);
  const saved = keep ? raw?.spots : undefined;
  for (const spotKey of Object.keys(defaults) as K[]) next[spotKey] = asSpot(saved?.[spotKey], defaults[spotKey]);
  return next;
}

function saveSpots(key: string, layout: unknown) {
  localStorage.setItem(key, JSON.stringify({ v: SPOT_VERSION, spots: layout }));
}

const OLD_FRESH: Spot[] = [
  { x: 28, y: 34, size: 12, width: 42, height: 26 },
  { x: 28, y: 32, size: 12, width: 40, height: 16 },
  { x: 28, y: 32, size: 11, width: 34, height: 11 },
  { x: 50, y: 58, size: 12, width: 42, height: 26 },
  { x: 50, y: 62, size: 12, width: 40, height: 16 },
  { x: 50, y: 62, size: 11, width: 34, height: 11 },
];

function keptFresh(spot: Spot) {
  return !OLD_FRESH.some((old) => old.x === spot.x && old.y === spot.y && old.width === spot.width && old.height === spot.height && old.size === spot.size);
}

export function loadCard(): Record<CardKey, Spot> {
  publishLayout();
  const layout = loadSpots(CARD_KEY, DEFAULT_CARD);
  if (!keptFresh(layout.fresh)) layout.fresh = { ...DEFAULT_CARD.fresh };
  return layout;
}

export function saveCard(layout: Record<CardKey, Spot>) {
  saveSpots(CARD_KEY, layout);
}

export function loadSpell(): Record<SpellKey, Spot> {
  publishLayout();
  const layout = loadSpots(SPELL_KEY, DEFAULT_SPELL);
  if (!keptFresh(layout.fresh)) layout.fresh = { ...DEFAULT_SPELL.fresh };
  return layout;
}

export function saveSpell(layout: Record<SpellKey, Spot>) {
  saveSpots(SPELL_KEY, layout);
}

export function loadField(): Record<FieldKey, FieldSpot> {
  publishLayout();
  return loadSpots(FIELD_KEY, DEFAULT_FIELD);
}

export function saveField(layout: Record<FieldKey, FieldSpot>) {
  saveSpots(FIELD_KEY, layout);
}

const PUBLISH_KEY = "clash-layout-publish";
const PUBLISH_REV = "1";

export function publishLayout() {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(PUBLISH_KEY) === PUBLISH_REV) return;
  saveCard(DEFAULT_CARD);
  saveSpell(DEFAULT_SPELL);
  saveField(DEFAULT_FIELD);
  localStorage.setItem("clash-sound", "on");
  localStorage.setItem("clash-vol-fx", "100");
  localStorage.setItem("clash-vol-tap", "100");
  localStorage.setItem(PUBLISH_KEY, PUBLISH_REV);
}

/** The figures on the monster card in the hand (new frame), tunable in Tuỳ chỉnh (chủ game 02/11). */
export type HandKey = "stars" | "gems" | "def" | "mdef" | "atk" | "hp";
export const HAND_MARKS: Array<{ key: HandKey; label: string; sample: string; box: boolean }> = CARD_MARKS.filter((mark) => mark.key !== "name" && mark.key !== "fresh") as Array<{ key: HandKey; label: string; sample: string; box: boolean }>;
export const DEFAULT_HAND: Record<HandKey, Spot> = HAND_SPOTS;
export function loadHand(): Record<HandKey, Spot> {
  publishLayout();
  return loadSpots(HAND_KEY, DEFAULT_HAND);
}
export function saveHand(layout: Record<HandKey, Spot>) {
  saveSpots(HAND_KEY, layout);
}

/** The figures on the spell card in the hand (new frame): mana gem and speed icon, tunable in Tuỳ chỉnh (chủ game 02/11). Centres, like every Spot. */
export type SpellHandKey = "gems" | "speed";
export const SPELL_HAND_MARKS: Array<{ key: SpellHandKey; label: string; sample: string; box: boolean }> = [
  { key: "gems", label: "Gem", sample: "1", box: false },
  { key: "speed", label: "Icon tốc độ", sample: "", box: true },
];
export const DEFAULT_SPELL_HAND: Record<SpellHandKey, Spot> = {
  gems: { x: 84.8, y: 10.5, size: 18, width: 14, height: 12 },
  speed: { x: 87, y: 24.5, size: 10, width: 19, height: 13 },
};
const SPELL_HAND_KEY = "clash-spell-hand-v1";
export function loadSpellHand(): Record<SpellHandKey, Spot> {
  publishLayout();
  return loadSpots(SPELL_HAND_KEY, DEFAULT_SPELL_HAND);
}
export function saveSpellHand(layout: Record<SpellHandKey, Spot>) {
  saveSpots(SPELL_HAND_KEY, layout);
}

/** Vị trí và cỡ icon của 8 thẻ menu chính, chỉnh tay trong Tuỳ chỉnh (chủ game 06/11). dx/dy = độ lệch (rem) so với chỗ mặc định, size = chiều cao (rem). */
export type MenuIconKey = "album" | "events" | "ranks" | "shop" | "gifts" | "missions" | "friends" | "mail";
export type MenuIcon = { dx: number; dy: number; size: number };
export const MENU_ICON_MARKS: Array<{ key: MenuIconKey; label: string }> = [
  { key: "album", label: "Bộ sưu tập" },
  { key: "events", label: "Sự kiện" },
  { key: "ranks", label: "Bảng xếp hạng" },
  { key: "shop", label: "Cửa hàng" },
  { key: "gifts", label: "Phần thưởng" },
  { key: "missions", label: "Nhiệm vụ" },
  { key: "friends", label: "Bạn bè" },
  { key: "mail", label: "Thư" },
];
export const DEFAULT_MENU_ICON: MenuIcon = { dx: 0, dy: 0, size: 3.5 };
// Mặc định = số chủ game chỉnh tay rồi chụp lại (06/11, lần 2): dx, dy (rem, lệch so với chỗ gốc), size (rem).
export const DEFAULT_MENU_ICONS: Record<MenuIconKey, MenuIcon> = {
  album: { dx: -2.5, dy: 0.1, size: 3.1 },
  events: { dx: -2.1, dy: 0.4, size: 3.1 },
  ranks: { dx: -1.9, dy: 0.4, size: 3.3 },
  shop: { dx: -2.0, dy: 0.6, size: 3.1 },
  gifts: { dx: 1.9, dy: 0.7, size: 3.1 },
  missions: { dx: 2.1, dy: 0.7, size: 3.1 },
  friends: { dx: 1.7, dy: 0.7, size: 3.1 },
  mail: { dx: 1.8, dy: 0.4, size: 3.1 },
};
const MENU_ICON_KEY = "clash-menu-icons-v1";
function asMenuIcon(value: unknown, base: MenuIcon): MenuIcon {
  const raw = (value ?? {}) as Partial<MenuIcon>;
  const num = (item: unknown, fallback: number) => (typeof item === "number" && Number.isFinite(item) ? item : fallback);
  return { dx: num(raw.dx, base.dx), dy: num(raw.dy, base.dy), size: Math.min(8, Math.max(1.5, num(raw.size, base.size))) };
}
export function loadMenuIcons(): Record<MenuIconKey, MenuIcon> {
  const raw = read(MENU_ICON_KEY) as Partial<Record<MenuIconKey, unknown>> | null;
  const next = {} as Record<MenuIconKey, MenuIcon>;
  for (const mark of MENU_ICON_MARKS) next[mark.key] = asMenuIcon(raw?.[mark.key], DEFAULT_MENU_ICONS[mark.key]);
  return next;
}
export function saveMenuIcons(layout: Record<MenuIconKey, MenuIcon>) {
  localStorage.setItem(MENU_ICON_KEY, JSON.stringify(layout));
}

/** The sheet's card (chủ game 08/11): the field's frame and figures, but def and mdef where they were, atk and hp a little lower. */
export function sheetSpots(): Record<FieldKey, FieldSpot> {
  const f = fieldSpots();
  return {
    ...f,
    def: SHEET_SPOTS.def,
    mdef: SHEET_SPOTS.mdef,
    atk: { ...f.atk, y: f.atk.y + 1.6 },
    hp: { ...f.hp, y: f.hp.y + 1.6 },
  };
}

/** Lá quái trên sân dùng đúng khung và vị trí số của lá trên tay (chủ game 03/11); số cam vào ô tối góc trên phải (chỗ ô sao). */
export function fieldSpots(): Record<FieldKey, FieldSpot> {
  const h = loadHand();
  return {
    name: DEFAULT_FIELD.name,
    def: h.def,
    mdef: h.mdef,
    atk: h.atk,
    hp: h.hp,
    count: { x: h.stars.x, y: h.stars.y, size: h.stars.size, width: 30, height: h.stars.height },
  };
}
