import { DEFAULT_DECK, monsterCard } from "./catalog.ts";
import { createDuel, type Duel, type PileMon } from "./duel.ts";

export const TUTORIAL_MODE = "tutorial";

/** The two 1-star monsters the tutorial hands the player, so the first summon is always possible. */
const OPENING_MONSTERS = ["rong-con", "khong-lo-mot-mat"];

function freshPile(id: string): PileMon {
  const hp = monsterCard(id)?.hp ?? 1;
  return { id, hp, maxHp: hp };
}

/** A normal match against the computer, with a fixed opening hand for the guided first turn. */
export function createTutorialDuel(): Duel {
  const duel = createDuel(DEFAULT_DECK, "ai");
  const you = duel.players[0];
  const rest = [...you.reserve, ...you.monsterDeck];
  for (const id of OPENING_MONSTERS) {
    const at = rest.findIndex((held) => held.id === id);
    if (at >= 0) rest.splice(at, 1);
  }
  const players: Duel["players"] = [{ ...you, reserve: OPENING_MONSTERS.map(freshPile), monsterDeck: rest }, duel.players[1]];
  return { ...duel, players };
}
