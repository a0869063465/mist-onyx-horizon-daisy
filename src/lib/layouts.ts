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

export const DEFAULT_BOARD: Record<HudKey, Mark> = {
  foeHp: { x: 13.7, y: 11.3, size: 6.2 },
  foeOrb: { x: 84.2, y: 10.4, size: 9.6 },
  foeFlask: { x: 90.8, y: 15.4, size: 5.2 },
  foeStars: { x: 76.5, y: 21.5, size: 5.4 },
  foeGems: { x: 87, y: 21.6, size: 4.6 },
  foeHand: { x: 56.5, y: 6.8, size: 3.4 },
  foeReserve: { x: 79.5, y: 28.3, size: 4.2 },
  youHp: { x: 9, y: 88.5, size: 6.6 },
  youOrb: { x: 91.1, y: 88.1, size: 9.6 },
  youFlask: { x: 94.8, y: 94, size: 5.2 },
  youStars: { x: 85.1, y: 81, size: 5.4 },
  youGems: { x: 97.4, y: 80.7, size: 4.6 },
};

export type Spot = { x: number; y: number; size: number; width: number; height: number; hidden?: boolean };
export type Notice = { x: number; y: number; w: number; h: number; font: number; hidden?: boolean };
export type Trail = { x: number; y: number; w: number; h: number; dot: number; glow: number; hidden?: boolean };
export type BoardLayout = { marks: Record<HudKey, Mark>; notice: Notice; reaction: Notice; stack: Spot; env: Spot; envFoe: Spot; trail: Trail; actions: Spot };

export const DEFAULT_NOTICE: Notice = { x: 8.7, y: 36.8, w: 70, h: 21, font: 4.8, hidden: false };
export const DEFAULT_TRAIL: Trail = { x: 1.2, y: 36.8, w: 7.2, h: 21, dot: 1.6, glow: 3, hidden: false };
export const DEFAULT_REACTION: Notice = { x: 74, y: 34, w: 20, h: 28, font: 4.2, hidden: false };
export const DEFAULT_STACK: Spot = { x: 83.4, y: 72.6, size: 3.1, width: 16, height: 10, hidden: false };
export const DEFAULT_ENV: Spot = { x: 7.6, y: 58.4, size: 3.6, width: 22, height: 5, hidden: false };
export const DEFAULT_ENV_FOE: Spot = { x: 76.4, y: 36.1, size: 3.6, width: 22, height: 5, hidden: false };
/** Rút quái / Rút phép / Hết lượt block. Centre x/y; size scales the button text. Default matches the stylesheet. */
export const DEFAULT_ACTIONS: Spot = { x: 89.5, y: 52, size: 1, width: 18, height: 20, hidden: false };

export const DEFAULT_BOARD_LAYOUT: BoardLayout = {
  marks: DEFAULT_BOARD,
  notice: DEFAULT_NOTICE,
  trail: DEFAULT_TRAIL,
  reaction: DEFAULT_REACTION,
  stack: DEFAULT_STACK,
  env: DEFAULT_ENV,
  envFoe: DEFAULT_ENV_FOE,
  actions: DEFAULT_ACTIONS,
};

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
  gems: { x: 84.8, y: 10.5, size: 18, width: 14, height: 12 },
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

const BOARD_KEY = "clash-board-layout";
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

function boardKey(env?: string) {
  return env ? `${BOARD_KEY}:${env}` : BOARD_KEY;
}

function asActions(value: unknown): Spot {
  const spot = asSpot(value, DEFAULT_ACTIONS);
  return { ...spot, hidden: false };
}

/** Layout for the default board, or for one environment's board (falls back to the default layout until saved). */
export function loadBoard(env?: string): BoardLayout {
  publishLayout();
  const own = env ? read(boardKey(env)) : null;
  const raw = (own ?? read(BOARD_KEY)) as Partial<BoardLayout> & Partial<Record<HudKey, Mark>> | null;
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
    actions: asActions(raw?.actions),
  };
}

export function saveBoard(layout: BoardLayout, env?: string) {
  localStorage.setItem(boardKey(env), JSON.stringify(layout));
}

/** Drop an environment's own layout so it follows the default board layout again. */
export function clearBoard(env: string) {
  localStorage.removeItem(boardKey(env));
}

/** Environments that have their own saved layout. */
export function savedBoards(): Record<string, BoardLayout> {
  const out: Record<string, BoardLayout> = {};
  for (const env of Object.keys(ENV_BOARDS)) if (read(boardKey(env))) out[env] = loadBoard(env);
  return out;
}

const TOP_MARKS: HudKey[] = ["foeHp", "foeOrb", "foeFlask", "foeStars", "foeGems", "foeHand", "foeReserve"];

/** In a match: the top half follows the opponent's environment layout, the bottom half follows yours. */
export function matchBoard(topEnv: string | null | undefined, bottomEnv: string | null | undefined): BoardLayout {
  const top = loadBoard(boardEnv(topEnv));
  const bottom = loadBoard(boardEnv(bottomEnv));
  const marks = { ...bottom.marks };
  for (const key of TOP_MARKS) marks[key] = top.marks[key];
  return {
    marks,
    notice: top.notice,
    trail: top.trail,
    reaction: top.reaction,
    envFoe: top.envFoe,
    env: bottom.env,
    stack: bottom.stack,
    actions: bottom.actions,
  };
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
  saveBoard(DEFAULT_BOARD_LAYOUT);
  saveCard(DEFAULT_CARD);
  saveSpell(DEFAULT_SPELL);
  saveField(DEFAULT_FIELD);
  localStorage.setItem("clash-sound", "on");
  localStorage.setItem("clash-vol-fx", "100");
  localStorage.setItem("clash-vol-tap", "100");
  localStorage.setItem(PUBLISH_KEY, PUBLISH_REV);
}
