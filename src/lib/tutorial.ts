import { DEFAULT_DECK, monsterCard } from "./catalog.ts";
import { createDuel, type Duel, type PileMon } from "./duel.ts";

export const TUTORIAL_MODE = "tutorial";

/** The two 1-star monsters the tutorial hands the player, so the first summon is always possible. */
const OPENING_MONSTERS = ["rong-con", "khong-lo-mot-mat"];
/** The player's free opening spell, used to answer the opponent's chain. */
const OPENING_SPELL = "hap-thu-ma-phap";
/** The spell both sides use in the script. */
export const TUTORIAL_CHAIN = "soi-xich-dia-nguc";
/** The 1-star monster the opponent draws and summons on its first turn. */
const FOE_MONSTER = "phu-thuy-ti-hon";

function freshPile(id: string): PileMon {
  const hp = monsterCard(id)?.hp ?? 1;
  return { id, hp, maxHp: hp };
}

function without(list: PileMon[], ids: string[]): PileMon[] {
  const rest = [...list];
  for (const id of ids) {
    const at = rest.findIndex((held) => held.id === id);
    if (at >= 0) rest.splice(at, 1);
  }
  return rest;
}

/** A normal match against the computer, with fixed cards so the guided turns always play out as written. */
export function createTutorialDuel(): Duel {
  const duel = createDuel(DEFAULT_DECK, "ai");
  const [you, them] = duel.players;
  const yourSpells = you.spellDeck.filter((id) => id !== TUTORIAL_CHAIN && id !== OPENING_SPELL);
  // Sợi xích địa ngục sits second, and moves to the top when the script asks for a spell draw.
  const spellDeck = [yourSpells[0], TUTORIAL_CHAIN, ...yourSpells.slice(1)].filter(Boolean);
  const theirMonsters = without([...them.reserve, ...them.monsterDeck], [FOE_MONSTER]);
  const theirReserve = theirMonsters.filter((held) => (monsterCard(held.id)?.stars ?? 0) > 1).slice(0, 2);
  const theirDeck = [freshPile(FOE_MONSTER), ...without(theirMonsters, theirReserve.map((held) => held.id))];
  const players: Duel["players"] = [
    {
      ...you,
      reserve: OPENING_MONSTERS.map(freshPile),
      monsterDeck: without([...you.reserve, ...you.monsterDeck], OPENING_MONSTERS),
      hand: [OPENING_SPELL],
      tolls: [false],
      spellDeck,
      spellTax: spellDeck.map(() => false),
    },
    {
      ...them,
      reserve: theirReserve,
      monsterDeck: theirDeck,
      hand: [TUTORIAL_CHAIN],
      tolls: [false],
      spellDeck: them.spellDeck.filter((id) => id !== TUTORIAL_CHAIN),
      spellTax: them.spellDeck.filter((id) => id !== TUTORIAL_CHAIN).map(() => false),
    },
  ];
  return { ...duel, players };
}

/** Puts Sợi xích địa ngục on top of the player's spell pile for the scripted spell draw. */
export function chainOnTop(duel: Duel, side: 0 | 1): Duel {
  const you = duel.players[side];
  if (you.spellDeck[0] === TUTORIAL_CHAIN || !you.spellDeck.includes(TUTORIAL_CHAIN)) return duel;
  const at = you.spellDeck.indexOf(TUTORIAL_CHAIN);
  const spellDeck = [TUTORIAL_CHAIN, ...you.spellDeck.filter((_, i) => i !== at)];
  const tax = you.spellTax ?? [];
  const spellTax = [Boolean(tax[at]), ...tax.filter((_, i) => i !== at)];
  const players = [...duel.players] as Duel["players"];
  players[side] = { ...you, spellDeck, spellTax };
  return { ...duel, players };
}
