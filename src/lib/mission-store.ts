import { DAILY_LIST, WEEKLY_LIST, type ListedMission } from "./mission-list.ts";

/**
 * Kho tiến độ nhiệm vụ (chủ game 05/11). Không đụng tới sao ở đây (nhận thưởng nằm ở daily-missions.ts),
 * để shop.ts, collection.ts, mail-box.ts ghi lá vào được mà không vòng import.
 *
 * Ngày `clash-missions-v3` {day, played, pvp, claimed}: 0 giờ đếm lại.
 * Tuần `clash-missions-w1` {start, done, claims}: 7 ngày từ lần ghi/xem đầu tiên, hết thì tuần mới.
 * Trận đã tính `clash-missions-mids`: mỗi trận (mid) chỉ tính 1 lần.
 */
const DAY_KEY = "clash-missions-v3";
const WEEK_KEY = "clash-missions-w1";
const MIDS_KEY = "clash-missions-mids";
const WEEK_MS = 7 * 24 * 3600 * 1000;
const MIDS_KEPT = 40;

export type DayStore = { day: string; played: number; pvp: number; claimed: string[] };
export type WeekStore = { start: number; done: Record<string, number>; claims: Record<string, number> };

function read(key: string): Record<string, unknown> {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}") as unknown;
    return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The phone refused to store it: the page still works for this visit.
  }
  for (const hear of listeners) hear();
}

const listeners = new Set<() => void>();

/** Gọi lại khi kho nhiệm vụ đổi (trang Nhiệm vụ, chấm đỏ ở menu). */
export function onMissions(hear: () => void): () => void {
  listeners.add(hear);
  return () => {
    listeners.delete(hear);
  };
}

function dayOf(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

export function loadDay(): DayStore {
  const raw = read(DAY_KEY);
  const today = dayOf();
  const same = raw.day === today;
  return {
    day: today,
    played: same ? num(raw.played) : 0,
    pvp: same ? num(raw.pvp) : 0,
    claimed: same && Array.isArray(raw.claimed) ? raw.claimed.filter((id): id is string => typeof id === "string") : [],
  };
}

export function saveDay(store: DayStore) {
  write(DAY_KEY, store);
}

export function loadWeek(): WeekStore {
  const raw = read(WEEK_KEY);
  const now = Date.now();
  const live = typeof raw.start === "number" && raw.start <= now && now - raw.start < WEEK_MS;
  const map = (v: unknown): Record<string, number> => {
    const out: Record<string, number> = {};
    if (v && typeof v === "object") for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (num(n) > 0) out[k] = num(n);
    return out;
  };
  return { start: live ? (raw.start as number) : now, done: live ? map(raw.done) : {}, claims: live ? map(raw.claims) : {} };
}

export function saveWeek(store: WeekStore) {
  write(WEEK_KEY, store);
}

/** Tiến độ hôm nay của một nhiệm vụ ngày (trần ở mục tiêu). Xếp hạng chưa có chế độ nên luôn 0. */
export function dayDone(store: DayStore, row: ListedMission): number {
  const n = row.count === "play" ? store.played : row.count === "pvp" ? store.pvp : 0;
  return Math.min(row.goal, n);
}

/** Tiến độ tuần này của một nhiệm vụ tuần (trần ở mục tiêu). */
export function weekDone(store: WeekStore, row: ListedMission): number {
  return Math.min(row.goal, store.done[row.id] ?? 0);
}

/**
 * Một trận đã kết thúc (Vs Máy, Đánh thường, Tuỳ chọn; thắng, thua hay đầu hàng đều là đã chơi).
 * `pvpWin` = thắng Đánh thường. Trận đã tính rồi thì bỏ qua; trả true khi vừa ghi.
 */
export function noteMatch(mid: string, pvpWin: boolean): boolean {
  const raw = read(MIDS_KEY);
  const seen = Array.isArray(raw.mids) ? raw.mids.filter((one): one is string => typeof one === "string") : [];
  if (!mid || seen.includes(mid)) return false;
  write(MIDS_KEY, { mids: [...seen, mid].slice(-MIDS_KEPT) });
  const day = loadDay();
  day.played += 1;
  if (pvpWin) day.pvp += 1;
  saveDay(day);
  // Tuần: chưa có trận xếp hạng, nên chỉ giữ cho mốc 7 ngày bắt đầu từ trận đầu tiên.
  saveWeek(loadWeek());
  return true;
}

/** Bậc của một lá nhận được, cho "Thu thập 4 điểm SR hoặc UR": SR 1 điểm, UR 2 điểm (chủ game 05/11). */
export type GotCard = { id: string; tier: "N" | "SR" | "UR" };

/** Lá vừa nhận (mở gói, đổi sao, quà trong thư), kể cả lá trùng đã có (chủ game 05/11). */
export function noteCards(cards: GotCard[]) {
  if (!cards.length) return;
  const week = loadWeek();
  const points = cards.reduce((sum, card) => sum + (card.tier === "UR" ? 2 : card.tier === "SR" ? 1 : 0), 0);
  for (const row of WEEKLY_LIST) {
    const add = row.count === "cards" ? cards.length : row.count === "rare" ? points : 0;
    if (add > 0) week.done[row.id] = (week.done[row.id] ?? 0) + add;
  }
  saveWeek(week);
}

/** Có nhiệm vụ Ngày hoặc Tuần đã đủ mà chưa nhận (chấm đỏ thẻ Nhiệm vụ ở menu). */
export function missionsReady(): boolean {
  const day = loadDay();
  if (DAILY_LIST.some((row) => !day.claimed.includes(row.id) && dayDone(day, row) >= row.goal)) return true;
  const week = loadWeek();
  return WEEKLY_LIST.some((row) => (week.claims[row.id] ?? 0) < (row.repeat ?? 1) && weekDone(week, row) >= row.goal);
}
