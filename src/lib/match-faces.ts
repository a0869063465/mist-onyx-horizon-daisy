import { monsterCard } from "./catalog.ts";
import { coverOf, loadBook } from "./deck-book.ts";
import type { DuelFace } from "./duel.ts";
import type { NetDeck } from "./net-room.ts";

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

/** The deck this match was opened with: Chơi ngay makes it the deck book's active deck. */
export function ownFace(): DuelFace {
  const book = loadBook();
  const entry = book.decks.find((row) => row.n === book.active) ?? null;
  return { deck: entry?.name ?? null, cover: entry ? coverOf(entry) : null };
}

/** Vs Máy: the computer plays a copy of your deck, so its champion is another of the deck's monsters with the most
 *  stars, other than yours, when the deck has one. It shows no deck name, only "Máy". */
export function machineFace(monsters: string[], yours: string | null): DuelFace {
  const pool = topMonsters(monsters, yours);
  return { deck: null, cover: pool[Math.floor(Math.random() * pool.length)] ?? yours };
}

/** The other player's deck as the room has it. A game that sends no cover gets the first of its top monsters. */
export function roomFace(deck: NetDeck | null): DuelFace {
  if (!deck) return { deck: null, cover: null };
  const cover = deck.cover && monsterCard(deck.cover) ? deck.cover : topMonsters(deck.monsters, null)[0] ?? null;
  return { deck: deck.name ?? null, cover };
}
