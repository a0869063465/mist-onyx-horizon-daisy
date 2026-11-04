import { DAILY_LIST, type ListedMission } from "./mission-list.ts";
import { addStars, starCount } from "./shop.ts";

/**
 * Nhiệm vụ Ngày (chủ game 04/11), giữ trên máy. "Chơi" đếm mọi trận kết thúc ở Vs Máy, Đánh thường, Tuỳ chọn
 * (thắng, thua hay đầu hàng); "Thắng PvP" đếm trận thắng Đánh thường. 0 giờ đếm lại. Mỗi trận tính 1 lần (giữ mã
 * trận). Đủ mục tiêu thì tự cộng sao, mỗi nhiệm vụ 1 lần mỗi ngày. Nhiệm vụ khoá (Xếp hạng, cả tab Tuần) chưa đếm.
 */
const KEY = "clash-missions-v2";

type Store = { day: string; played: number; pvp: number; claimed: string[]; paid: string[] };

export type MissionRow = ListedMission & { done: number };
export type MatchReward = {
  before: MissionRow[];
  after: MissionRow[];
  /** Sao trận này trả. */
  stars: number;
  /** Số sao trước và sau trận. */
  total: [number, number];
  changed: boolean;
};

function dayOf(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function load(): Store {
  const today = dayOf();
  let raw: Partial<Store> = {};
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Store>;
  } catch {
    raw = {};
  }
  const same = raw.day === today;
  const num = (v: unknown) => (same && typeof v === "number" && v >= 0 ? v : 0);
  return {
    day: today,
    played: num(raw.played),
    pvp: num(raw.pvp),
    claimed: same && Array.isArray(raw.claimed) ? raw.claimed : [],
    paid: Array.isArray(raw.paid) ? raw.paid : [],
  };
}

function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage may be blocked */
  }
}

function doneOf(store: Store, row: ListedMission): number {
  if (row.locked || !row.count) return 0;
  return Math.min(row.goal, row.count === "play" ? store.played : store.pvp);
}

/** Nhiệm vụ Ngày và tiến độ hôm nay, cho trang Nhiệm vụ và bảng sau trận. */
export function dailyRows(store: Store = load()): MissionRow[] {
  return DAILY_LIST.map((row) => ({ ...row, done: doneOf(store, row) }));
}

/** Ghi một trận đã kết thúc (một lần mỗi trận); null khi trận này đã được ghi. */
export function settleMatch(mid: string, pvpWin: boolean): MatchReward | null {
  const store = load();
  if (store.paid.includes(mid)) return null;
  const before = dailyRows(store);
  const starsBefore = starCount();
  store.played += 1;
  if (pvpWin) store.pvp += 1;
  let stars = 0;
  for (const row of DAILY_LIST) {
    if (row.locked || store.claimed.includes(row.id) || doneOf(store, row) < row.goal) continue;
    store.claimed = [...store.claimed, row.id];
    stars += row.stars;
  }
  store.paid = [...store.paid, mid].slice(-40);
  save(store);
  if (stars) addStars(stars);
  const after = dailyRows(store);
  const changed = after.some((row, at) => row.done !== before[at]?.done);
  return { before, after, stars, total: [starsBefore, starCount()], changed };
}
