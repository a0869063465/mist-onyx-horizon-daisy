import { appMode } from "./app-mode.ts";
import { copyCap, WAITING_CARDS } from "./catalog.ts";
import { EVOLUTIONS } from "./strategies.ts";
import { trialCopies, trialLeft } from "./trial-deck.ts";

const OWNED_KEY = "clash-owned";

/**
 * Which cards a player may put in a deck (owner, 19/10): a guest has the default deck's cards and the cards opened
 * from packs; the publisher has every card. Kept on this phone with the rest of the shop.
 */
export function canUseCard(id: string): boolean {
  return usableCopies(id) > 0;
}

/** Copies the phone holds of each card (the owned list repeats a card once per copy). */
function ownedCopies(): Map<string, number> {
  const counts = new Map<string, number>();
  try {
    const raw = JSON.parse(localStorage.getItem(OWNED_KEY) ?? "[]") as unknown;
    if (Array.isArray(raw)) for (const id of raw) if (typeof id === "string") counts.set(id, (counts.get(id) ?? 0) + 1);
  } catch {
    // Nothing owned then.
  }
  return counts;
}

/**
 * How many copies of a card a deck may hold (chủ game 08/11): its cap (quái 1 sao 3, 2 sao 2, phép 0 mana 2, khác 1),
 * but no more than the copies owned; the publisher has every cap full; a starter card not owned yet plays as 1 fake.
 */
export function usableCopies(id: string, counts: Map<string, number> = ownedCopies()): number {
  if (WAITING_CARDS.has(id)) return 0;
  const cap = copyCap(id);
  if (cap === 0) return 0;
  if (appMode() === "publisher") return cap;
  // Copies owned, or the copies this week's trial deck lends, whichever is more (chủ game 08/11).
  return Math.min(cap, Math.max(counts.get(id) ?? 0, trialCopies(id)));
}

/** Copies owned (capped), without the trial ones. */
export function ownedCopiesOf(id: string, counts: Map<string, number> = ownedCopies()): number {
  if (appMode() === "publisher") return copyCap(id);
  return Math.min(copyCap(id), counts.get(id) ?? 0);
}

/** The trial label of a card ("6D", "5H") while some of its usable copies are only lent this week; null otherwise. */
export function trialTag(id: string, counts: Map<string, number> = ownedCopies()): string | null {
  if (typeof localStorage === "undefined" || appMode() === "publisher") return null;
  return usableCopies(id, counts) > ownedCopiesOf(id, counts) ? trialLeft() : null;
}

/** Copies in a deck past what is owned: the trial ones (and, once a week ends, the expired ones). */
export function trialCount(ids: string[], counts: Map<string, number> = ownedCopies()): number {
  const seen = new Map<string, number>();
  let n = 0;
  for (const id of ids) {
    const k = (seen.get(id) ?? 0) + 1;
    seen.set(id, k);
    if (k > ownedCopiesOf(id, counts)) n += 1;
  }
  return n;
}

/** `usableCopies` for many cards at once, reading the owned list a single time. */
export function copiesOf(ids: Iterable<string>): Map<string, number> {
  const counts = ownedCopies();
  return new Map([...new Set(ids)].map((id) => [id, usableCopies(id, counts)]));
}

/** The cards opened from packs, bought or given: the real ones (the starter deck's cards are only fakes until then). */
export function realOwned(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(OWNED_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

/** Lá fake bỏ (chủ game 08/11): the starter cards are trial cards with full figures now, so none plays as fake. */
export function fakeIds(_ids: string[]): string[] {
  return [];
}

/** Chân kén is no evolution of its own: it comes out of Kén ngài, so it needs what Kén ngài needs. */
const COMES_FROM: Record<string, string> = { "chan-ken": "ken-ngai" };

/**
 * A form (evolution or fusion) shown in the deck builder's pool (owner, 21/10): only when the player may use every
 * card one of its ways needs; Rồng con alone does not show Rồng ngàn tuổi without Phù thuỷ thời gian.
 */
export function canReachForm(id: string): boolean {
  const ways = EVOLUTIONS.filter((row) => row.result === (COMES_FROM[id] ?? id));
  return ways.some((row) => row.needs.every((need) => canUseCard(need)));
}

/** A saved list of cards with each card kept no more times than the deck may hold it (chủ game 08/11). */
export function keepCopies(list: unknown, ok: (id: string) => boolean, upTo: "use" | "cap" = "use"): string[] {
  if (!Array.isArray(list)) return [];
  // A saved deck keeps cards it may no longer use (a trial week over) up to their cap: shown dimmed, marked "!".
  const room = upTo === "cap" ? new Map(list.filter((id): id is string => typeof id === "string").map((id) => [id, copyCap(id)])) : copiesOf(list.filter((id): id is string => typeof id === "string"));
  const used = new Map<string, number>();
  const next: string[] = [];
  for (const id of list) {
    if (typeof id !== "string" || !ok(id)) continue;
    const n = used.get(id) ?? 0;
    if (n >= (room.get(id) ?? 0)) continue;
    used.set(id, n + 1);
    next.push(id);
  }
  return next;
}
