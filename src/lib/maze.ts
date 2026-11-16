// Mê cung PvE: dữ liệu + luật (chỉ logic, không giao diện). Đặc tả: docs/maze/.
// Toạ độ ô: cột 1–7 trái sang phải, hàng A–G dưới lên. Cửa vào là (1,A).
// File này không import gì để chạy thẳng được bằng node --experimental-strip-types.

export const ROWS = "ABCDEFG";
export type Dir = "up" | "down" | "left" | "right";
export const DIRS: Dir[] = ["up", "right", "down", "left"];
const STEP: Record<Dir, [number, number]> = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };

/** Khoá ô, ví dụ "1A", "6E". */
export type CellKey = string;
export interface Pos {
  col: number;
  row: number;
}

export const cellKey = (p: Pos): CellKey => `${p.col}${ROWS[p.row]}`;
export function cellPos(k: CellKey): Pos {
  return { col: Number(k[0]), row: ROWS.indexOf(k[1]) };
}
const inBounds = (p: Pos) => p.col >= 1 && p.col <= 7 && p.row >= 0 && p.row <= 6;

/** Ô kề theo hướng, hoặc null nếu ra ngoài lưới (kể cả cửa vào phía dưới (1,A)). */
export function neighbor(k: CellKey, dir: Dir): CellKey | null {
  const p = cellPos(k);
  const next = { col: p.col + STEP[dir][0], row: p.row + STEP[dir][1] };
  return inBounds(next) ? cellKey(next) : null;
}

// ---------- Tường ----------
const edgeKey = (a: CellKey, b: CellKey) => [a, b].sort().join("|");
const WALLS = new Set<string>();
// Tường nằm giữa hai hàng, theo cột. "G|F": giữa hàng G (trên) và F (dưới).
const HORIZONTAL: Record<string, number[]> = {
  "G|F": [2, 3, 5, 6],
  "F|E": [1, 4],
  "E|D": [2, 3, 5],
  "D|C": [1, 2, 4, 6],
  "C|B": [3, 4, 6],
  "B|A": [2, 3, 5],
};
for (const [pair, cols] of Object.entries(HORIZONTAL)) {
  const [upper, lower] = pair.split("|");
  for (const col of cols) WALLS.add(edgeKey(`${col}${upper}`, `${col}${lower}`));
}
// Tường nằm giữa hai cột, theo hàng. "2|3": giữa cột 2 và cột 3.
const VERTICAL: Record<number, string[]> = {
  1: ["C"],
  2: ["F", "E", "B"],
  3: ["G", "A"],
  4: ROWS.split(""),
  5: ["C"],
  6: ["F", "E", "D", "B"],
};
for (const [left, rows] of Object.entries(VERTICAL)) {
  for (const row of rows) WALLS.add(edgeKey(`${left}${row}`, `${Number(left) + 1}${row}`));
}

export const wallBetween = (a: CellKey, b: CellKey) => WALLS.has(edgeKey(a, b));
/** Đi từ a sang ô kề b được không (kề nhau, không có tường). */
export const canPass = (a: CellKey, b: CellKey) => {
  const pa = cellPos(a);
  const pb = cellPos(b);
  return Math.abs(pa.col - pb.col) + Math.abs(pa.row - pb.row) === 1 && !wallBetween(a, b);
};

// ---------- Cổng ----------
export type PortalPair = "T1" | "T2" | "T3";
export interface Portal {
  pair: PortalPair;
  to: CellKey;
  /** T1 xanh dương (thường), T2 xanh lá (an toàn), T3 đỏ (nguy hiểm, một chiều). */
  tone: "blue" | "green" | "red";
}
export const PORTALS: Record<CellKey, Portal> = {
  "1E": { pair: "T1", to: "4A", tone: "blue" },
  "4A": { pair: "T1", to: "1E", tone: "blue" },
  "3G": { pair: "T2", to: "5A", tone: "green" },
  "5A": { pair: "T2", to: "3G", tone: "green" },
  "1C": { pair: "T3", to: "6C", tone: "red" },
};

// ---------- Quái, rương, boss ----------
export interface Monster {
  id: string;
  level: 1 | 2 | 3;
  at: CellKey;
}
const monster = (level: 1 | 2 | 3, at: CellKey): Monster => ({ id: `lv${level}-${at}`, level, at });
export const MONSTERS: Monster[] = [
  monster(1, "1C"),
  monster(1, "4C"),
  monster(1, "2D"),
  monster(1, "3B"),
  monster(2, "1F"),
  monster(2, "3E"),
  monster(2, "6A"),
  monster(3, "7E"),
  monster(3, "6D"),
];
export const BOSS_ID = "boss";
export const BOSS_CELLS: CellKey[] = ["5E", "6E", "5F", "6F"];
export const CHESTS = [
  { id: "chest-1", at: "4G" },
  { id: "chest-2", at: "5G" },
];

export const LIVES = 3;
export const FOG_MEMORY = 3;

// ---------- Trạng thái ----------
export interface Buff {
  monster: string;
  level: number;
}
export interface Battle {
  monsterId: string;
  level: number;
  at: CellKey;
  /** Ô đứng trước khi bước vào ô quái; thua thì quay về đây. */
  from: CellKey;
}
export interface PortalPrompt {
  pair: PortalPair;
  from: CellKey;
  to: CellKey;
}
export interface MazeState {
  /** Lần chơi: 1 là lần đầu, 2 là cơ hội cuối. */
  attempt: number;
  lives: number;
  at: CellKey;
  /** Các ô đã đặt chân tới, theo thứ tự lần đầu tới. */
  visited: CellKey[];
  defeated: string[];
  chestsOpened: string[];
  buffs: Buff[];
  bossUnlocked: boolean;
  bossDefeated: boolean;
  pending: Battle | null;
  prompt: PortalPrompt | null;
  /** Ô cổng đang đứng mà khung chọn không hiện lại cho tới khi bước ra rồi vào lại. */
  portalQuiet: CellKey | null;
  /** Hết hai cơ hội: mê cung bị khoá. */
  locked: boolean;
}

export type MazeEvent =
  | { type: "encounter"; monster_id: string; level: number; cell: CellKey }
  | { type: "monster_defeated"; monster_id: string; level: number; cell: CellKey }
  | { type: "buff_granted"; level: number; monster_id: string }
  | { type: "chest_opened"; chest_id: string; cell: CellKey }
  | { type: "teleport_used"; pair_id: PortalPair; from: CellKey; to: CellKey }
  | { type: "boss_unlocked" }
  | { type: "boss_entered"; cell: CellKey }
  | { type: "boss_defeated" }
  | { type: "player_died"; lives: number }
  | { type: "maze_reset"; attempt: number }
  | { type: "maze_locked" };

export interface MazeResult {
  state: MazeState;
  events: MazeEvent[];
  /** false thì không có gì đổi; xem reason. */
  ok: boolean;
  reason?: string;
}

const fail = (state: MazeState, reason: string): MazeResult => ({ state, events: [], ok: false, reason });
const done = (state: MazeState, events: MazeEvent[]): MazeResult => ({ state, events, ok: true });

export const START: CellKey = "1A";

export function createMaze(attempt = 1): MazeState {
  return {
    attempt,
    lives: LIVES,
    at: START,
    visited: [START],
    defeated: [],
    chestsOpened: [],
    buffs: [],
    bossUnlocked: false,
    bossDefeated: false,
    pending: null,
    prompt: null,
    portalQuiet: null,
    locked: false,
  };
}

/** Quái còn sống ở ô k (không tính boss). */
export function monsterAt(state: MazeState, k: CellKey): Monster | null {
  return MONSTERS.find((m) => m.at === k && !state.defeated.includes(m.id)) ?? null;
}
export const bossAlive = (state: MazeState) => !state.bossDefeated;
export const chestAt = (state: MazeState, k: CellKey) =>
  CHESTS.find((c) => c.at === k && !state.chestsOpened.includes(c.id)) ?? null;

/** Đã hạ ít nhất một quái mỗi cấp 1, 2, 3 thì mở phòng boss. */
export function bossGateOpen(state: MazeState): boolean {
  const lv = (n: number) => MONSTERS.some((m) => m.level === n && state.defeated.includes(m.id));
  return lv(1) && lv(2) && lv(3);
}

const withVisit = (visited: CellKey[], k: CellKey) => (visited.includes(k) ? visited : [...visited, k]);

/** Sau khi đứng ở ô k (không còn đang đánh): nếu là ô cổng chưa im thì hiện khung chọn. */
export function portalPromptAt(state: MazeState, k: CellKey): PortalPrompt | null {
  const portal = PORTALS[k];
  if (!portal || state.portalQuiet === k) return null;
  return { pair: portal.pair, from: k, to: portal.to };
}

function enterCell(state: MazeState, from: CellKey, target: CellKey): MazeResult {
  const events: MazeEvent[] = [];
  let next: MazeState = { ...state, at: target, visited: withVisit(state.visited, target), portalQuiet: null, prompt: null };
  const intoBoss = BOSS_CELLS.includes(target) && !BOSS_CELLS.includes(from);
  if (intoBoss && bossAlive(state)) {
    events.push({ type: "boss_entered", cell: target });
    events.push({ type: "encounter", monster_id: BOSS_ID, level: 4, cell: target });
    next = { ...next, pending: { monsterId: BOSS_ID, level: 4, at: target, from } };
    return done(next, events);
  }
  const mon = monsterAt(state, target);
  if (mon) {
    events.push({ type: "encounter", monster_id: mon.id, level: mon.level, cell: target });
    next = { ...next, pending: { monsterId: mon.id, level: mon.level, at: target, from } };
    return done(next, events);
  }
  next = { ...next, prompt: portalPromptAt(next, target) };
  return done(next, events);
}

/** Lý do không đi được theo hướng dir, hoặc null nếu đi được. */
export function blockedReason(state: MazeState, dir: Dir): string | null {
  if (state.locked) return "locked";
  if (state.pending) return "battle";
  if (state.prompt) return "prompt";
  const target = neighbor(state.at, dir);
  if (!target) return "edge";
  if (wallBetween(state.at, target)) return "wall";
  if (BOSS_CELLS.includes(target) && !BOSS_CELLS.includes(state.at) && !state.bossUnlocked) return "boss-locked";
  return null;
}

export function move(state: MazeState, dir: Dir): MazeResult {
  const why = blockedReason(state, dir);
  if (why) return fail(state, why);
  return enterCell(state, state.at, neighbor(state.at, dir) as CellKey);
}

/** Đồng ý dịch chuyển ở ô cổng đang đứng. */
export function confirmPortal(state: MazeState): MazeResult {
  const prompt = state.prompt;
  if (!prompt) return fail(state, "no-prompt");
  const events: MazeEvent[] = [{ type: "teleport_used", pair_id: prompt.pair, from: prompt.from, to: prompt.to }];
  const base: MazeState = { ...state, prompt: null, at: prompt.to, visited: withVisit(state.visited, prompt.to), portalQuiet: prompt.to };
  const mon = monsterAt(base, prompt.to);
  if (mon) {
    events.push({ type: "encounter", monster_id: mon.id, level: mon.level, cell: prompt.to });
    return done({ ...base, pending: { monsterId: mon.id, level: mon.level, at: prompt.to, from: prompt.from } }, events);
  }
  return done(base, events);
}

/** Huỷ dịch chuyển: đứng yên, khung chọn không hiện lại cho tới khi bước ra rồi vào lại. */
export function cancelPortal(state: MazeState): MazeResult {
  if (!state.prompt) return fail(state, "no-prompt");
  return done({ ...state, prompt: null, portalQuiet: state.at }, []);
}

/** Mở rương ở ô đang đứng (giao diện gọi khi người chơi chọn mở). */
export function openChest(state: MazeState): MazeResult {
  if (state.locked || state.pending || state.prompt) return fail(state, "busy");
  const chest = chestAt(state, state.at);
  if (!chest) return fail(state, "no-chest");
  return done({ ...state, chestsOpened: [...state.chestsOpened, chest.id] }, [{ type: "chest_opened", chest_id: chest.id, cell: state.at }]);
}

/** Mê cung mới cho lần chơi kế (reset). Buff xoá theo (chưa chốt: xem docs/maze/dac-ta.md). */
export function resetMaze(state: MazeState): MazeState {
  return createMaze(state.attempt + 1);
}

/** Báo kết quả màn đấu bài của quái đang chờ. */
export function resolveBattle(state: MazeState, won: boolean): MazeResult {
  const battle = state.pending;
  if (!battle) return fail(state, "no-battle");
  const events: MazeEvent[] = [];
  if (won) {
    let next: MazeState = { ...state, pending: null };
    if (battle.monsterId === BOSS_ID) {
      next = { ...next, bossDefeated: true };
      events.push({ type: "boss_defeated" });
    } else {
      next = { ...next, defeated: [...state.defeated, battle.monsterId], buffs: [...state.buffs, { monster: battle.monsterId, level: battle.level }] };
      events.push({ type: "monster_defeated", monster_id: battle.monsterId, level: battle.level, cell: battle.at });
      events.push({ type: "buff_granted", level: battle.level, monster_id: battle.monsterId });
    }
    if (!next.bossUnlocked && bossGateOpen(next)) {
      next = { ...next, bossUnlocked: true };
      events.push({ type: "boss_unlocked" });
    }
    // Thắng cũng lùi 1 ô về chỗ đứng trước khi vào ô quái.
    next = { ...next, at: battle.from, portalQuiet: battle.from, prompt: null };
    return done(next, events);
  }
  // Thua: mất 1 mạng, quay về ô đứng trước khi bước vào ô quái.
  const lives = state.lives - 1;
  events.push({ type: "player_died", lives });
  const back: MazeState = { ...state, pending: null, lives, at: battle.from, portalQuiet: battle.from, prompt: null };
  if (lives > 0) return done(back, events);
  if (state.attempt < 2) {
    const fresh = resetMaze(state);
    events.push({ type: "maze_reset", attempt: fresh.attempt });
    return done(fresh, events);
  }
  events.push({ type: "maze_locked" });
  return done({ ...back, locked: true }, events);
}

// ---------- Sương mù ----------
export interface Visibility {
  /** Ô nhân vật đứng và các ô kề không bị tường chắn. */
  view: CellKey[];
  /** 3 ô đi qua sớm nhất mà không nằm trong tầm nhìn. */
  early: CellKey[];
  /** Hợp của hai nhóm trên: các ô được sáng. */
  lit: CellKey[];
}
export function visibility(state: MazeState): Visibility {
  const view = [state.at];
  for (const dir of DIRS) {
    const next = neighbor(state.at, dir);
    if (next && !wallBetween(state.at, next)) view.push(next);
  }
  const early: CellKey[] = [];
  for (const k of state.visited) {
    if (early.length >= FOG_MEMORY) break;
    if (!view.includes(k)) early.push(k);
  }
  return { view, early, lit: [...view, ...early] };
}
