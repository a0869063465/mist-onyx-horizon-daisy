import { useEffect, useState } from "react";
import { FORMS, MONSTERS, SPELLS, monsterCard, spellCard } from "@/lib/catalog";

/**
 * Cửa hàng (owner, 19/10): packs bought with stars. A pack holds 5 different cards, each drawn by its weight.
 * Tiers: Normal (blue) = spells of 0 mana and 1–2 star monsters, SR (gold) = spells of 1 mana and 3 star monsters,
 * UR (rainbow) = 4 star monsters and spells of 2 mana or more. That is the usual rule; the rate panel can move a card.
 * A card drawn again refunds 1 star. 10 packs cost 150 stars and hold at least one UR.
 * For now there is one common pack for testing (9 packs later), with every card a deck can hold except 5-star
 * monsters, environments included. Stars, owned cards and the rates the publisher tunes are kept on this phone.
 */
export type Tier = "N" | "SR" | "UR";
export type PackKind = "monster" | "spell";
export type PackEntry = { id: string; kind: PackKind };
export type RateEdit = { tier?: Tier; weight?: number };
export type Rates = Record<string, RateEdit>;
export type Pull = PackEntry & { tier: Tier; fresh: boolean; refund: number };
export type OpenedPack = { pulls: Pull[]; best: Tier };
export type Purchase = { packs: OpenedPack[]; spent: number; refund: number; fresh: number };

export const PACK_SIZE = 5;
export const PACK_PRICE = 15;
export const BUNDLE_SIZE = 10;
export const BUNDLE_PRICE = 150;
/** Highest first. */
export const TIERS: Tier[] = ["UR", "SR", "N"];
export const TIER_NAME: Record<Tier, string> = { N: "Normal", SR: "SR", UR: "UR" };
export const DEFAULT_WEIGHT: Record<Tier, number> = { N: 10, SR: 4, UR: 1 };
export const MAX_WEIGHT = 999;

export const PACK = {
  id: "goi-chung",
  name: "Gói chung",
  art: "/ui/pack.webp",
  blurb: "Gói thử nghiệm gồm mọi lá bỏ vào bộ bài được, trừ quái 5 sao. Mỗi gói 5 lá khác nhau.",
};

const STAR_KEY = "clash-stars";
const OWNED_KEY = "clash-owned";
const RATE_KEY = "clash-pack-rates";
const TIER_RANK: Record<Tier, number> = { N: 0, SR: 1, UR: 2 };

export function tierRank(tier: Tier): number {
  return TIER_RANK[tier];
}

/** The common pack: every monster a deck can hold (no forms, no 5 stars) and every spell. */
export function packPool(): PackEntry[] {
  const forms = new Set(FORMS.map((card) => card.id));
  const monsters: PackEntry[] = MONSTERS.map((card) => monsterCard(card.id) ?? card)
    .filter((card) => !forms.has(card.id) && card.stars <= 4)
    .map((card) => ({ id: card.id, kind: "monster" }));
  const spells: PackEntry[] = SPELLS.map((card) => ({ id: card.id, kind: "spell" }));
  return [...monsters, ...spells];
}

/** The usual tier: by stars for a monster, by mana for a spell. */
export function naturalTier(entry: PackEntry): Tier {
  if (entry.kind === "monster") {
    const stars = monsterCard(entry.id)?.stars ?? 1;
    return stars >= 4 ? "UR" : stars === 3 ? "SR" : "N";
  }
  const gems = spellCard(entry.id)?.gems ?? 0;
  return gems >= 2 ? "UR" : gems === 1 ? "SR" : "N";
}

export function tierOf(entry: PackEntry, rates: Rates): Tier {
  return rates[entry.id]?.tier ?? naturalTier(entry);
}

export function weightOf(entry: PackEntry, rates: Rates): number {
  const weight = rates[entry.id]?.weight;
  return typeof weight === "number" ? weight : DEFAULT_WEIGHT[tierOf(entry, rates)];
}

export function cardName(entry: PackEntry): string {
  return (entry.kind === "monster" ? monsterCard(entry.id)?.name : spellCard(entry.id)?.name) ?? entry.id;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Only for this visit then.
  }
}

export function loadRates(): Rates {
  const raw = read<unknown>(RATE_KEY, {});
  if (!raw || typeof raw !== "object") return {};
  const rates: Rates = {};
  for (const [id, edit] of Object.entries(raw as Record<string, unknown>)) {
    if (!edit || typeof edit !== "object") continue;
    const row = edit as { tier?: unknown; weight?: unknown };
    const next: RateEdit = {};
    if (row.tier === "N" || row.tier === "SR" || row.tier === "UR") next.tier = row.tier;
    if (typeof row.weight === "number" && Number.isFinite(row.weight)) next.weight = clampWeight(row.weight);
    if (next.tier || next.weight !== undefined) rates[id] = next;
  }
  return rates;
}

export function saveRates(rates: Rates) {
  write(RATE_KEY, rates);
}

export function clampWeight(value: number): number {
  return Math.max(0, Math.min(MAX_WEIGHT, Math.round(value)));
}

/** A card's edit with defaults dropped, so a card back on the usual tier and weight leaves the list. */
export function tidyEdit(entry: PackEntry, edit: RateEdit): RateEdit | null {
  const next: RateEdit = {};
  const tier = edit.tier ?? naturalTier(entry);
  if (tier !== naturalTier(entry)) next.tier = tier;
  if (edit.weight !== undefined && edit.weight !== DEFAULT_WEIGHT[tier]) next.weight = edit.weight;
  return next.tier || next.weight !== undefined ? next : null;
}

// ---- Stars (the shop's money) and owned cards, on this phone until accounts exist (owner, 19/10). ----

const starListeners = new Set<(stars: number) => void>();

export function starCount(): number {
  const value = Number(read<unknown>(STAR_KEY, 0));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function setStarCount(value: number) {
  const next = Math.max(0, Math.floor(value));
  write(STAR_KEY, next);
  for (const hear of starListeners) hear(next);
}

/** Publisher tool: more stars to test with. */
export function addStars(amount: number) {
  setStarCount(starCount() + amount);
}

export function useStars(): number {
  const [stars, setStars] = useState(0);
  useEffect(() => {
    setStars(starCount());
    starListeners.add(setStars);
    return () => {
      starListeners.delete(setStars);
    };
  }, []);
  return stars;
}

export function ownedIds(): Set<string> {
  const raw = read<unknown>(OWNED_KEY, []);
  return new Set(Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : []);
}

/** Publisher tool: forget the cards drawn, to see NEW and the refunds again. */
export function clearOwned() {
  write(OWNED_KEY, []);
}

// ---- Drawing ----

type Weighted = PackEntry & { tier: Tier; weight: number };

function weighted(rates: Rates): Weighted[] {
  return packPool()
    .map((entry) => ({ ...entry, tier: tierOf(entry, rates), weight: weightOf(entry, rates) }))
    .filter((entry) => entry.weight > 0);
}

/** Up to `count` different cards, each pick by weight among the cards not picked yet. */
function drawFrom(pool: Weighted[], count: number, rng: () => number): Weighted[] {
  const left = [...pool];
  const picked: Weighted[] = [];
  while (picked.length < count && left.length) {
    const total = left.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng() * total;
    let index = left.length - 1;
    for (let i = 0; i < left.length; i += 1) {
      roll -= left[i].weight;
      if (roll < 0) {
        index = i;
        break;
      }
    }
    picked.push(left.splice(index, 1)[0]);
  }
  return picked;
}

function bestOf(cards: Array<{ tier: Tier }>): Tier {
  return cards.reduce<Tier>((best, card) => (TIER_RANK[card.tier] > TIER_RANK[best] ? card.tier : best), "N");
}

/** The cards of `count` packs; a bundle of 10 with no UR gets one, in place of a lower card of a random pack. */
export function drawPacks(count: number, rates: Rates, rng: () => number = Math.random): Weighted[][] {
  const pool = weighted(rates);
  const packs = Array.from({ length: count }, () => drawFrom(pool, PACK_SIZE, rng));
  if (count >= BUNDLE_SIZE && !packs.some((pack) => pack.some((card) => card.tier === "UR"))) {
    const at = Math.floor(rng() * packs.length);
    const pack = packs[at];
    const urs = pool.filter((card) => card.tier === "UR" && !pack.some((held) => held.id === card.id));
    const [ur] = drawFrom(urs, 1, rng);
    if (ur && pack.length) pack[Math.floor(rng() * pack.length)] = ur;
  }
  return packs;
}

/**
 * Buys 1 or 10 packs: takes the stars, draws the cards, keeps the new ones and refunds 1 star for each card
 * already owned (or drawn earlier in the same bundle). Everything is saved before the opening is shown.
 */
export function buyPacks(count: 1 | 10, rng: () => number = Math.random): Purchase | null {
  const price = count === BUNDLE_SIZE ? BUNDLE_PRICE : PACK_PRICE;
  const stars = starCount();
  if (stars < price) return null;
  const owned = ownedIds();
  let refund = 0;
  let fresh = 0;
  const packs: OpenedPack[] = drawPacks(count, loadRates(), rng).map((cards) => {
    const pulls = cards.map(({ id, kind, tier }) => {
      const isNew = !owned.has(id);
      if (isNew) {
        owned.add(id);
        fresh += 1;
      } else refund += 1;
      return { id, kind, tier, fresh: isNew, refund: isNew ? 0 : 1 };
    });
    return { pulls, best: bestOf(pulls) };
  });
  write(OWNED_KEY, [...owned]);
  setStarCount(stars - price + refund);
  return { packs, spent: price, refund, fresh };
}

// ---- Odds for the rate panel ----

/** A small seeded random, so the odds shown do not jitter between renders. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Odds = { card: Record<string, number>; best: Record<Tier, number> };

/** By simulation: the chance each card is in one pack, and the chance a pack's best card is UR, SR or Normal. */
export function packOdds(rates: Rates, runs = 20000): Odds {
  const pool = weighted(rates);
  const rng = seeded(20261019);
  const seen: Record<string, number> = {};
  const best: Record<Tier, number> = { N: 0, SR: 0, UR: 0 };
  for (let run = 0; run < runs; run += 1) {
    const pack = drawFrom(pool, PACK_SIZE, rng);
    for (const card of pack) seen[card.id] = (seen[card.id] ?? 0) + 1;
    best[bestOf(pack)] += 1;
  }
  const card: Record<string, number> = {};
  for (const entry of packPool()) card[entry.id] = (seen[entry.id] ?? 0) / runs;
  return { card, best: { N: best.N / runs, SR: best.SR / runs, UR: best.UR / runs } };
}

/** The tuned rates as text to paste to Claude: only the cards that left the usual tier or weight. */
export function ratesText(rates: Rates): string {
  const lines = [`Tỉ lệ ${PACK.name} (mặc định: Normal ${DEFAULT_WEIGHT.N}, SR ${DEFAULT_WEIGHT.SR}, UR ${DEFAULT_WEIGHT.UR})`];
  const edited = packPool().filter((entry) => rates[entry.id]);
  if (!edited.length) lines.push("Chưa đổi lá nào.");
  for (const entry of edited) lines.push(`${cardName(entry)} (${entry.id}): ${TIER_NAME[tierOf(entry, rates)]}, trọng số ${weightOf(entry, rates)}`);
  return lines.join("\n");
}
