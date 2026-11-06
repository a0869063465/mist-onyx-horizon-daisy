import { useCallback, useEffect, useState } from "react";
import { addStars } from "./shop.ts";
import { DAILY_LIST, type ListedMission } from "./mission-list.ts";
import { dayDone, loadDay, loadWeek, onMissions, saveDay, saveWeek, weekDone, type DayStore, type WeekStore } from "./mission-store.ts";

/**
 * Nhiệm vụ Ngày / Tuần (chủ game 05/11): ĐỌC tiến độ và NHẬN thưởng. Tiến độ ghi ở mission-store.ts
 * (hết trận: `noteMatch` trong play.tsx; lá nhận được: `noteCards` ở mở gói, đổi sao, quà trong thư).
 */
export type DailyView = { done: (row: ListedMission) => number; claimed: (row: ListedMission) => boolean; claim: (row: ListedMission) => boolean };

export function useDaily(): DailyView {
  const [store, setStore] = useState<DayStore>({ day: "", played: 0, pvp: 0, claimed: [] });
  useEffect(() => {
    setStore(loadDay());
    return onMissions(() => setStore(loadDay()));
  }, []);
  const claim = useCallback((row: ListedMission) => {
    const now = loadDay();
    if (now.claimed.includes(row.id) || dayDone(now, row) < row.goal) return false;
    now.claimed.push(row.id);
    saveDay(now);
    addStars(row.stars);
    return true;
  }, []);
  return {
    done: (row) => dayDone(store, row),
    claimed: (row) => store.claimed.includes(row.id),
    claim,
  };
}

export { DAILY_LIST };

/**
 * Nhiệm vụ tuần: tuần 7 ngày từ lúc bắt đầu, hết thì đếm lại. Làm lại được (X3): nhận xong tiến độ về 0,
 * `claims` tăng; đủ `repeat` lần thì xong hẳn.
 */
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
    return onMissions(() => setStore(loadWeek()));
  }, []);
  const claim = useCallback((row: ListedMission) => {
    const now = loadWeek();
    const taken = now.claims[row.id] ?? 0;
    if (taken >= (row.repeat ?? 1) || weekDone(now, row) < row.goal) return false;
    now.claims[row.id] = taken + 1;
    now.done[row.id] = 0;
    saveWeek(now);
    addStars(row.stars);
    return true;
  }, []);
  return {
    done: (row) => weekDone(store, row),
    claims: (row) => store.claims[row.id] ?? 0,
    claim,
  };
}
