import { appMode } from "./app-mode.ts";
import { DEFAULT_DECK } from "./catalog.ts";
import { EVOLUTIONS } from "./strategies.ts";

const OWNED_KEY = "clash-owned";
const STARTER = new Set([...DEFAULT_DECK.monsters, ...DEFAULT_DECK.spells]);

/**
 * Which cards a player may put in a deck (owner, 19/10): a guest has the default deck's cards and the cards opened
 * from packs; the publisher has every card. Kept on this phone with the rest of the shop.
 */
export function canUseCard(id: string): boolean {
  if (appMode() === "publisher" || STARTER.has(id)) return true;
  try {
    const raw = JSON.parse(localStorage.getItem(OWNED_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) && raw.includes(id);
  } catch {
    return false;
  }
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
