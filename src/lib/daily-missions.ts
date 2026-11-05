import { useCallback, useEffect, useState } from "react";
import { addStars } from "./shop.ts";
import { DAILY_LIST, type ListedMission } from "./mission-list.ts";

/**
 * Nhiệm vụ ngày (chủ game 05/11): chỉ ĐỌC tiến độ và NHẬN thưởng ở đây.
 * Kho `clash-missions-v3` {day, played, pvp, claimed}: hết ngày (0 giờ) thì đếm lại từ đầu.
 * Việc GHI tiến độ (đếm trận Vs Máy / Đánh thường / Tuỳ chọn) làm ở bước luật, chưa nối.
 */
const KEY = "clash-missions-v3";

type Store = { day: string; played: number; pvp: number; claimed: string[] };

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
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  return {
    day: today,
    played: same ? num(raw.played) : 0,
    pvp: same ? num(raw.pvp) : 0,
    claimed: same && Array.isArray(raw.claimed) ? raw.claimed.filter((id): id is string => typeof id === "string") : [],
  };
}

function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // The phone refused to store it: the page still works for this visit.
  }
}

export type DailyView = { done: (row: ListedMission) => number; claimed: (row: ListedMission) => boolean; claim: (row: ListedMission) => boolean };

/** Tiến độ hôm nay của một nhiệm vụ (chỉ trần ở mục tiêu). Xếp hạng chưa có chế độ nên luôn 0. */
function doneOf(store: Store, row: ListedMission): number {
  const n = row.count === "play" ? store.played : row.count === "pvp" ? store.pvp : 0;
  return Math.min(row.goal, n);
}

export function useDaily(): DailyView {
  const [store, setStore] = useState<Store>({ day: "", played: 0, pvp: 0, claimed: [] });
  useEffect(() => {
    setStore(load());
  }, []);
  const claim = useCallback((row: ListedMission) => {
    const now = load();
    if (now.claimed.includes(row.id) || doneOf(now, row) < row.goal) return false;
    now.claimed.push(row.id);
    save(now);
    addStars(row.stars);
    setStore(now);
    return true;
  }, []);
  return {
    done: (row) => doneOf(store, row),
    claimed: (row) => store.claimed.includes(row.id),
    claim,
  };
}

export { DAILY_LIST };

/**
 * Nhiệm vụ tuần (chủ game 05/11): kho `clash-missions-w1` {start, done, claims}. Tuần tính 7 ngày từ lúc bắt đầu, hết thì đếm lại.
 * Nhiệm vụ làm lại được (X3): nhận xong tiến độ về 0 và đếm lại, `claims` tăng; đủ `repeat` lần thì xong hẳn.
 * Chỉ ĐỌC tiến độ + NHẬN; việc ghi tiến độ (đếm trận xếp hạng, bảo vật, thu thập lá) làm ở bước luật, chưa nối.
 */
const WEEK_KEY = "clash-missions-w1";
const WEEK_MS = 7 * 24 * 3600 * 1000;

type WeekStore = { start: number; done: Record<string, number>; claims: Record<string, number> };

function loadWeek(): WeekStore {
  let raw: Partial<WeekStore> = {};
  try {
    raw = JSON.parse(localStorage.getItem(WEEK_KEY) ?? "{}") as Partial<WeekStore>;
  } catch {
    raw = {};
  }
  const now = Date.now();
  const live = typeof raw.start === "number" && now - raw.start < WEEK_MS;
  const map = (v: unknown): Record<string, number> => {
    const out: Record<string, number> = {};
    if (v && typeof v === "object") for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === "number" && n > 0) out[k] = Math.floor(n);
    return out;
  };
  return { start: live ? (raw.start as number) : now, done: live ? map(raw.done) : {}, claims: live ? map(raw.claims) : {} };
}

function saveWeek(store: WeekStore) {
  try {
    localStorage.setItem(WEEK_KEY, JSON.stringify(store));
  } catch {
    // The phone refused to store it: the page still works for this visit.
  }
}

export type WeeklyView = {
  done: (row: ListedMission) => number;
  /** Số lần đã nhận của tuần này. */
  claims: (row: ListedMission) => number;
  claim: (row: ListedMission) => boolean;
};

export function useWeekly(): WeeklyView {
  const [store, setStore] = useState<WeekStore>({ start: 0, done: {}, claims: {} });
  useEffect(() => {
    setStore(loadWeek());
  }, []);
  const claim = useCallback((row: ListedMission) => {
    const now = loadWeek();
    const taken = now.claims[row.id] ?? 0;
    if (taken >= (row.repeat ?? 1) || (now.done[row.id] ?? 0) < row.goal) return false;
    now.claims[row.id] = taken + 1;
    now.done[row.id] = 0;
    saveWeek(now);
    addStars(row.stars);
    setStore(now);
    return true;
  }, []);
  return {
    done: (row) => Math.min(row.goal, store.done[row.id] ?? 0),
    claims: (row) => store.claims[row.id] ?? 0,
    claim,
  };
}

