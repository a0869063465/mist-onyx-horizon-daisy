import { useEffect, useState } from "react";
import { FORMS, MONSTERS, SPELLS, monsterCard, spellCard } from "@/lib/catalog";
import { spellKindRank } from "@/lib/spell-kinds";

/**
 * Cửa hàng (owner, 19/10): packs bought with stars. A pack holds 3 different cards (owner: 3, not 5).
 * Tiers: Normal (blue) = spells of 0 mana and 1–2 star monsters, SR (gold) = spells of 1 mana and 3 star monsters,
 * UR (rainbow) = 4 star monsters and spells of 2 mana or more. That is the usual rule; the rate panel can move a card.
 * Each card drawn is first a tier, by the tier's percent (only those 3 numbers are tuned; owner, 19/10), then any card
 * of that tier, all with the same chance. A card drawn again refunds 1 star. 10 packs cost 150 stars and hold at
 * least one UR. For now there is one common pack for testing (9 packs later), with every card a deck can hold except
 * 5-star monsters, environments included. Stars, owned cards and the rates the publisher tunes are kept on this phone.
 */
export type Tier = "N" | "SR" | "UR";
export type PackKind = "monster" | "spell";
export type PackEntry = { id: string; kind: PackKind };
/** The chance (in %) each card drawn is of each tier, and the cards moved to another tier than the usual one. */
export type Rates = { tiers: Record<Tier, number>; moved: Record<string, Tier> };
export type Pull = PackEntry & { tier: Tier; fresh: boolean; refund: number };
export type OpenedPack = { pulls: Pull[]; best: Tier };
export type Purchase = { packs: OpenedPack[]; spent: number; refund: number; fresh: number };

export const PACK_SIZE = 3;
export const PACK_PRICE = 15;
export const BUNDLE_SIZE = 10;
export const BUNDLE_PRICE = 150;
/** Highest first. */
export const TIERS: Tier[] = ["UR", "SR", "N"];
export const TIER_NAME: Record<Tier, string> = { N: "Normal", SR: "SR", UR: "UR" };
/** Each card drawn: UR 2,1%, SR 11,3%, Normal the rest (owner's numbers, 19/10). */
export const DEFAULT_TIERS: Record<Tier, number> = { UR: 2.1, SR: 11.3, N: 86.6 };

export const PACK = {
  id: "goi-chung",
  name: "Gói chung",
  art: "/ui/pack.webp",
  blurb: "Gói thử nghiệm gồm mọi lá bỏ vào bộ bài được, trừ quái 5 sao. Mỗi gói 3 lá khác nhau.",
};

const STAR_KEY = "clash-stars";
const OWNED_KEY = "clash-owned";
const RATE_KEY = "clash-pack-odds";
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
  return rates.moved[entry.id] ?? naturalTier(entry);
}

export function cardName(entry: PackEntry): string {
  return (entry.kind === "monster" ? monsterCard(entry.id)?.name : spellCard(entry.id)?.name) ?? entry.id;
}

/** Monsters by stars, then spells by their group (as in Chỉnh sửa bộ bài) and mana; names last. */
export function byPower(a: PackEntry, b: PackEntry): number {
  const rank = (entry: PackEntry) => (entry.kind === "monster" ? (monsterCard(entry.id)?.stars ?? 0) : 1000 + spellKindRank(entry.id) * 10 + (spellCard(entry.id)?.gems ?? 0));
  return rank(a) - rank(b) || cardName(a).localeCompare(cardName(b), "vi");
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

export function freshRates(): Rates {
  return { tiers: { ...DEFAULT_TIERS }, moved: {} };
}

/** A percent as typed: 0 to 100, one decimal (owner, 19/10: 1,6% or 8,6%). */
export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

/** UR and SR are typed; Normal is what is left of 100%. */
export function withTier(rates: Rates, tier: "UR" | "SR", value: number): Rates {
  const tiers = { ...rates.tiers, [tier]: clampPercent(value) };
  const other = tier === "UR" ? "SR" : "UR";
  tiers[other] = Math.min(tiers[other], clampPercent(100 - tiers[tier]));
  tiers.N = clampPercent(100 - tiers.UR - tiers.SR);
  return { ...rates, tiers };
}

export function loadRates(): Rates {
  const raw = read<unknown>(RATE_KEY, null);
  const rates = freshRates();
  if (!raw || typeof raw !== "object") return rates;
  const data = raw as { tiers?: Record<string, unknown>; moved?: Record<string, unknown> };
  let next = rates;
  for (const tier of ["UR", "SR"] as const) {
    const value = data.tiers?.[tier];
    if (typeof value === "number" && Number.isFinite(value)) next = withTier(next, tier, value);
  }
  const ids = new Set(packPool().map((entry) => entry.id));
  for (const [id, tier] of Object.entries(data.moved ?? {})) {
    if (ids.has(id) && (tier === "N" || tier === "SR" || tier === "UR")) next.moved[id] = tier;
  }
  return next;
}

export function saveRates(rates: Rates) {
  write(RATE_KEY, rates);
}

/** Moves a card to a tier; back on its usual tier it leaves the list of moved cards. */
export function moveCard(rates: Rates, entry: PackEntry, tier: Tier): Rates {
  const moved = { ...rates.moved };
  if (tier === naturalTier(entry)) delete moved[entry.id];
  else moved[entry.id] = tier;
  return { ...rates, moved };
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

// ---- The look of the opened row, tuned by the publisher (owner, 19/10: "make it custom, I'll set it myself") ----

/**
 * One card place: its turn about the up-down axis (degrees; for the sides, toward the middle), its tilt about the
 * card's left-right axis (degrees, above 0 = top leans back), its roll about the axis out of the screen (degrees;
 * the sides mirrored), how far it sits lower
 * (px) how far it comes toward the screen (px, below 0 = further away)
 * and, for the sides only, how far they move apart along the screen (px, below 0 = closer to the middle). The two sides share one setting, mirrored.
 */
export type CardSpot = { lean: number; tilt: number; roll: number; sink: number; near: number; spread: number };
export type RowLook = { side: CardSpot; mid: CardSpot };
/**
 * The owner's own numbers (19/10, set on his phone with the Chỉnh hàng lá sliders, which were then taken out: "remember
 * these for later": 3 turns about X, Y, Z and 3 moves along X, Y, Z per card place).
 */
export const DEFAULT_ROW: RowLook = { side: { lean: 24, tilt: 2, roll: -3, sink: -5, near: 0, spread: 0 }, mid: { lean: 0, tilt: 5, roll: 0, sink: -9, near: -16, spread: 0 } };

/** The CSS variables the row reads. */
export function rowStyle(look: RowLook): Record<string, string> {
  return {
    "--side-lean": `${look.side.lean}deg`,
    "--side-tilt": `${look.side.tilt}deg`,
    "--side-roll": `${look.side.roll}deg`,
    "--mid-roll": `${look.mid.roll}deg`,
    "--side-spread": `${look.side.spread}px`,
    "--mid-tilt": `${look.mid.tilt}deg`,
    "--side-sink": `${look.side.sink}px`,
    "--side-near": `${look.side.near}px`,
    "--mid-lean": `${look.mid.lean}deg`,
    "--mid-sink": `${look.mid.sink}px`,
    "--mid-near": `${look.mid.near}px`,
  };
}

// ---- Drawing ----

type Drawn = PackEntry & { tier: Tier };
type Pools = Record<Tier, Drawn[]>;

function pools(rates: Rates): Pools {
  const sorted: Pools = { N: [], SR: [], UR: [] };
  for (const entry of packPool()) {
    const tier = tierOf(entry, rates);
    sorted[tier].push({ ...entry, tier });
  }
  return sorted;
}

/**
 * Up to `count` different cards: each one rolls a tier by the percents (a tier with no card left is skipped),
 * then takes any card of that tier not in the pack yet.
 */
function drawFrom(pool: Pools, rates: Rates, count: number, rng: () => number, only?: Tier): Drawn[] {
  const picked: Drawn[] = [];
  const left: Pools = { N: [...pool.N], SR: [...pool.SR], UR: [...pool.UR] };
  while (picked.length < count) {
    const open = (only ? [only] : TIERS).filter((tier) => left[tier].length && (only || rates.tiers[tier] > 0));
    if (!open.length) break;
    const total = open.reduce((sum, tier) => sum + (only ? 1 : rates.tiers[tier]), 0);
    let roll = rng() * total;
    let tier = open[open.length - 1];
    for (const option of open) {
      roll -= only ? 1 : rates.tiers[option];
      if (roll < 0) {
        tier = option;
        break;
      }
    }
    const list = left[tier];
    picked.push(list.splice(Math.floor(rng() * list.length), 1)[0]);
  }
  return picked;
}

function bestOf(cards: Array<{ tier: Tier }>): Tier {
  return cards.reduce<Tier>((best, card) => (TIER_RANK[card.tier] > TIER_RANK[best] ? card.tier : best), "N");
}

/** The cards of `count` packs; a bundle of 10 with no UR gets one, in place of a lower card of a random pack. */
export function drawPacks(count: number, rates: Rates, rng: () => number = Math.random): Drawn[][] {
  const pool = pools(rates);
  const packs = Array.from({ length: count }, () => drawFrom(pool, rates, PACK_SIZE, rng));
  if (count >= BUNDLE_SIZE && !packs.some((pack) => pack.some((card) => card.tier === "UR"))) {
    const pack = packs[Math.floor(rng() * packs.length)];
    const urs = { ...pool, UR: pool.UR.filter((card) => !pack.some((held) => held.id === card.id)) };
    const [ur] = drawFrom(urs, rates, 1, rng, "UR");
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
  const pool = pools(rates);
  const rng = seeded(20261019);
  const seen: Record<string, number> = {};
  const best: Record<Tier, number> = { N: 0, SR: 0, UR: 0 };
  for (let run = 0; run < runs; run += 1) {
    const pack = drawFrom(pool, rates, PACK_SIZE, rng);
    for (const card of pack) seen[card.id] = (seen[card.id] ?? 0) + 1;
    best[bestOf(pack)] += 1;
  }
  const card: Record<string, number> = {};
  for (const entry of packPool()) card[entry.id] = (seen[entry.id] ?? 0) / runs;
  return { card, best: { N: best.N / runs, SR: best.SR / runs, UR: best.UR / runs } };
}

/** The tuned rates as text to paste to Claude: the three percents and the cards moved to another tier. */
export function ratesText(rates: Rates): string {
  const lines = [`Tỉ lệ ${PACK.name}: UR ${rates.tiers.UR}%, SR ${rates.tiers.SR}%, Normal ${rates.tiers.N}% (mặc định UR ${DEFAULT_TIERS.UR}%, SR ${DEFAULT_TIERS.SR}%, Normal ${DEFAULT_TIERS.N}%)`];
  const moved = packPool().filter((entry) => rates.moved[entry.id]);
  if (moved.length) for (const entry of moved) lines.push(`${cardName(entry)} (${entry.id}): ${TIER_NAME[naturalTier(entry)]} → ${TIER_NAME[rates.moved[entry.id]]}`);
  else lines.push("Chưa đổi bậc lá nào.");
  return lines.join("\n");
}
