import { writeFileSync } from "node:fs";
import { CARD_CLOCK, type CardClock, type ClockTone } from "../src/lib/card-clock.ts";
import { FORMS, MONSTERS, SPELLS } from "../src/lib/catalog.ts";
import { BALANCE_LOG, recordedAdded, toneFromStats, type StatKey } from "../src/lib/power-balance.ts";

type Live = {
  kind: "monster" | "spell";
  stars: number;
  mana: number;
  atk: number;
  def: number;
  mdef: number;
  hp: number;
  skill: string;
};

const STATS: StatKey[] = ["hp", "atk", "def", "mdef", "stars", "mana"];

function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function fingerprint(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function toneOf(prev: CardClock, next: Live): "up" | "down" | "shift" | null {
  const stats: Partial<Record<StatKey, { from: number; to: number }>> = {};
  const before = { hp: prev.hp, atk: prev.atk, def: prev.def, mdef: prev.mdef, stars: prev.stars, mana: prev.mana };
  const after = { hp: next.hp, atk: next.atk, def: next.def, mdef: next.mdef, stars: next.stars, mana: next.mana };
  for (const key of STATS) {
    if (next.kind === "spell" && key !== "mana") continue;
    if (before[key] !== after[key]) stats[key] = { from: before[key], to: after[key] };
  }
  if (!Object.keys(stats).length) return null;
  return toneFromStats(stats);
}

function history(id: string): { powerAt: string | null; powerTone: ClockTone | null; shiftAt: string | null } {
  let powerAt: string | null = null;
  let powerTone: ClockTone | null = null;
  let shiftAt: string | null = null;
  for (const entry of BALANCE_LOG) {
    if (entry.id !== id) continue;
    const tone = entry.tone ?? toneFromStats(entry.stats);
    if ((tone === "up" || tone === "down") && (!powerAt || entry.at > powerAt)) {
      powerAt = entry.at;
      powerTone = tone;
    }
    if (tone === "shift" && (!shiftAt || entry.at > shiftAt)) shiftAt = entry.at;
  }
  return { powerAt, powerTone, shiftAt };
}

function row(id: string, live: Live, prev: CardClock | undefined, day: string): CardClock {
  const text = fingerprint(live.skill);
  const base = {
    kind: live.kind,
    stars: live.stars,
    mana: live.mana,
    atk: live.atk,
    def: live.def,
    mdef: live.mdef,
    hp: live.hp,
    text,
  };
  if (!prev) {
    const past = history(id);
    return { ...base, added: recordedAdded(id), ...past };
  }
  let { added, powerAt, powerTone, shiftAt } = prev;
  if (!added) added = recordedAdded(id);
  const tone = toneOf(prev, live);
  if (tone === "up" || tone === "down") {
    powerAt = day;
    powerTone = tone;
  } else if (tone === "shift") {
    shiftAt = day;
    powerAt = null;
    powerTone = null;
  }
  if (prev.text !== text) shiftAt = day;
  return { ...base, added, powerAt, powerTone, shiftAt };
}

const live = new Map<string, Live>();
for (const card of [...MONSTERS, ...FORMS]) {
  live.set(card.id, {
    kind: "monster",
    stars: card.stars,
    mana: card.gems,
    atk: card.atk,
    def: card.def,
    mdef: card.mdef,
    hp: card.hp,
    skill: card.skill,
  });
}
for (const card of SPELLS) {
  live.set(card.id, { kind: "spell", stars: 0, mana: card.gems, atk: 0, def: 0, mdef: 0, hp: 0, skill: card.effect });
}

const day = today();
const next: Record<string, CardClock> = {};
for (const [id, card] of live) next[id] = row(id, card, CARD_CLOCK[id], day);

const body = `export type ClockTone = "up" | "down";

export type CardClock = {
  kind: "monster" | "spell";
  stars: number;
  mana: number;
  atk: number;
  def: number;
  mdef: number;
  hp: number;
  text: string;
  added: string | null;
  powerAt: string | null;
  powerTone: ClockTone | null;
  shiftAt: string | null;
};

/** Ngày thêm lá và ngày cập nhật. File này tự ghi lại khi lá trong catalog đổi. */
export const CARD_CLOCK: Record<string, CardClock> = ${JSON.stringify(next, null, 2)};
`;

writeFileSync(new URL("../src/lib/card-clock.ts", import.meta.url), body);
console.log(`stamped ${Object.keys(next).length} cards ${day}`);
