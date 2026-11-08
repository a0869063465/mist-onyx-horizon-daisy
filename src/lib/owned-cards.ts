import { appMode } from "./app-mode.ts";
import { copyCap, DEFAULT_DECK, WAITING_CARDS } from "./catalog.ts";
import { EVOLUTIONS } from "./strategies.ts";

const OWNED_KEY = "clash-owned";
const STARTER = new Set([...DEFAULT_DECK.monsters, ...DEFAULT_DECK.spells]);

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
  const owned = Math.min(cap, counts.get(id) ?? 0);
  return owned > 0 ? owned : STARTER.has(id) ? 1 : 0;
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

/** Of these cards, the ones that play as FAKE: starter-deck cards whose real card is not owned (chủ game 22/10). */
export function fakeIds(ids: string[]): string[] {
  if (typeof localStorage === "undefined") return ids.filter((id) => STARTER.has(id));
  const real = realOwned();
  return ids.filter((id) => STARTER.has(id) && !real.has(id));
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
export function keepCopies(list: unknown, ok: (id: string) => boolean): string[] {
  if (!Array.isArray(list)) return [];
  const room = copiesOf(list.filter((id): id is string => typeof id === "string"));
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
