import { appMode } from "./app-mode.ts";
import { DEFAULT_DECK } from "./catalog.ts";

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
