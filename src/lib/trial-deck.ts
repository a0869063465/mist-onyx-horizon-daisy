import { DEFAULT_DECK, STARTER_NAME } from "./catalog.ts";

/**
 * Bộ dùng thử (chủ game 08/11): replaces the fake starter cards. Each calendar week (from 0:00 on Monday, the phone's
 * time) one deck of TRIAL_DECKS is lent: its cards play with full figures until the week ends, then the next deck
 * of the list comes round. The owner writes the decks; for now the starter deck is the only one.
 */
export type TrialDeck = { id: string; name: string; monsters: string[]; spells: string[] };

export const TRIAL_DECKS: TrialDeck[] = [{ id: "khoi-dau", name: STARTER_NAME, monsters: [...DEFAULT_DECK.monsters], spells: [...DEFAULT_DECK.spells] }];

/** A deck holding more trial copies than this is swapped whole for the new week's trial deck (chủ game 08/11). */
export const TRIAL_SWAP_OVER = 16;

const DAY = 24 * 60 * 60 * 1000;
/** A Monday the weeks are counted from. */
const FIRST_MONDAY = new Date(2026, 0, 5).getTime();

/** 0:00 of this week's Monday. */
export function weekStart(now = Date.now()): number {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day.getTime();
}

/** 0:00 of next Monday: when this week's trial cards end. */
export function trialEnds(now = Date.now()): number {
  const day = new Date(weekStart(now));
  day.setDate(day.getDate() + 7);
  return day.getTime();
}

export function weekIndex(now = Date.now()): number {
  return Math.round((weekStart(now) - FIRST_MONDAY) / (7 * DAY));
}

export function trialDeck(now = Date.now()): TrialDeck {
  const n = TRIAL_DECKS.length;
  return TRIAL_DECKS[((weekIndex(now) % n) + n) % n];
}

/** Copies of a card this week's trial deck lends. */
export function trialCopies(id: string, now = Date.now()): number {
  const deck = trialDeck(now);
  return [...deck.monsters, ...deck.spells].filter((one) => one === id).length;
}

/** Time left on the trial cards, as the owner wrote it: "7D" while a day or more is left, else "6H". */
export function trialLeft(now = Date.now()): string {
  const left = Math.max(0, trialEnds(now) - now);
  // Monday 0:00 shows 7D; under a day left it counts hours.
  return left >= DAY ? `${Math.ceil(left / DAY)}D` : `${Math.max(1, Math.ceil(left / (60 * 60 * 1000)))}H`;
}
