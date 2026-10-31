import { monsterCard } from "./catalog.ts";
import { coverOf, loadBook } from "./deck-book.ts";
import type { DuelFace } from "./duel.ts";
import type { NetDeck } from "./net-room.ts";
import { playerId } from "./friend-state.ts";

/**
 * Each side of the VS screen (chủ game 22/10, câu 8 và 9): the deck's name and its champion, which is the deck's
 * cover (the picked cover, or one of its monsters with the most stars).
 */

function topMonsters(monsters: string[], skip: string | null): string[] {
  const cards = monsters.filter((id) => id !== skip).map((id) => monsterCard(id)).filter((card): card is NonNullable<typeof card> => Boolean(card));
  if (!cards.length) return [];
  const top = Math.max(...cards.map((card) => card.stars));
  return cards.filter((card) => card.stars === top).map((card) => card.id);
}

/** The deck this match was opened with (`cards`, the saved deck): Chơi ngay makes it the deck book's active deck. */
export function ownFace(cards: { monsters: string[]; spells: string[] }): DuelFace {
  const book = loadBook();
  const entry = book.decks.find((row) => row.n === book.active) ?? null;
  return { deck: entry?.name ?? null, cover: entry ? coverOf(entry) : null, pid: playerId() || null, cards: { monsters: [...cards.monsters], spells: [...cards.spells] } };
}

/** The other player's deck as the room has it. A game that sends no cover gets the first of its top monsters. */
export function roomFace(deck: NetDeck | null): DuelFace {
  if (!deck) return { deck: null, cover: null };
  const cover = deck.cover && monsterCard(deck.cover) ? deck.cover : topMonsters(deck.monsters, null)[0] ?? null;
  return { deck: deck.name ?? null, cover, pid: deck.pid ?? null, cards: { monsters: [...deck.monsters], spells: [...deck.spells] } };
}
