import { machineGroup, machineOf, MACHINES } from "./machines.ts";
import { addStars, drawReward, PACK, starCount, type Pull } from "./shop.ts";

/**
 * Nhiệm vụ (chủ game 22/10), kept on the phone. Each day the first win pays 2 stars, the 2nd and 3rd 1 star each, in
 * Vs Máy, Đánh thường and Tuỳ chọn. Winning against the same machine 3 times (not in a row, the count is not reset
 * by the day) pays 1 card of that machine's pack, then counts again from 0; each machine pays once a day, and wins
 * after that on the same day do not count. A match pays once (its id is kept).
 */
export const WIN_STARS = [2, 1, 1];
const MACHINE_WINS = 3;
const KEY = "clash-missions";

type Tally = { wins: number; paidDay?: string };
type Store = { day: string; wins: number; machines: Record<string, Tally>; paid: string[] };

/** What a mission pays: stars (each = per win, for the 2nd and 3rd win of the day) or a card of a pack. */
export type MissionPrize = { stars: number; each?: boolean } | { pack: string };
export type MissionRow = { id: string; title: string; done: number; goal: number; prize: MissionPrize; note?: string };
export type MatchReward = {
  before: MissionRow[];
  after: MissionRow[];
  /** Stars won by the match (the card's refund star is not in it). */
  stars: number;
  card: Pull | null;
  /** The star count before and after everything this match paid. */
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
  const sameDay = raw.day === today;
  return {
    day: today,
    wins: sameDay && typeof raw.wins === "number" ? raw.wins : 0,
    machines: raw.machines && typeof raw.machines === "object" ? raw.machines : {},
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

const packName = (id: string) => (id === PACK.id ? PACK.name : id);

/** The missions and how far each one is, for the menu and the panel after a match. */
export function missionRows(store: Store = load()): MissionRow[] {
  const rows: MissionRow[] = [
    { id: "first", title: "Thắng trận đầu tiên trong ngày", done: Math.min(store.wins, 1), goal: 1, prize: { stars: WIN_STARS[0] } },
    { id: "more", title: "Thắng thêm 2 trận trong ngày", done: Math.max(0, Math.min(store.wins - 1, 2)), goal: 2, prize: { stars: WIN_STARS[1], each: true } },
  ];
  for (const machine of MACHINES) {
    const tally = store.machines[machine.id] ?? { wins: 0 };
    const paidToday = tally.paidDay === store.day;
    rows.push({
      id: `machine:${machine.id}`,
      title: `Thắng máy ${machineGroup(machine)} ${MACHINE_WINS} trận`,
      done: paidToday ? MACHINE_WINS : Math.min(tally.wins, MACHINE_WINS),
      goal: MACHINE_WINS,
      prize: { pack: packName(machine.pack) },
      note: paidToday ? "Đã nhận hôm nay, mai đếm tiếp" : undefined,
    });
  }
  return rows;
}

/** Pays a won match once (Vs Máy, Đánh thường, Tuỳ chọn); null when this match was paid already. */
export function settleWin(mid: string, machineId: string | null | undefined): MatchReward | null {
  const store = load();
  if (store.paid.includes(mid)) return null;
  const before = missionRows(store);
  const starsBefore = starCount();
  const stars = WIN_STARS[store.wins] ?? 0;
  store.wins += 1;
  let card: Pull | null = null;
  const machine = machineOf(machineId);
  if (machine) {
    const tally: Tally = { ...(store.machines[machine.id] ?? { wins: 0 }) };
    if (tally.paidDay !== store.day) {
      tally.wins += 1;
      if (tally.wins >= MACHINE_WINS) {
        card = drawReward();
        tally.wins = 0;
        tally.paidDay = store.day;
      }
    }
    store.machines[machine.id] = tally;
  }
  store.paid = [...store.paid, mid].slice(-40);
  save(store);
  if (stars) addStars(stars);
  const after = missionRows(store);
  const changed = after.some((row, at) => row.done !== before[at]?.done || row.note !== before[at]?.note);
  return { before, after, stars, card, total: [starsBefore, starCount()], changed };
}
