import { DEFAULT_DECK, FORMS, MONSTERS, SPELLS, monsterCard, spellCard } from "./catalog.ts";
import { ENV_KINDS } from "./env-kinds.ts";
import { loadRates, naturalTier, tierOf, type PackEntry, type Rates, type Tier } from "./shop.ts";
import { spellKindRank } from "./spell-kinds.ts";
import { EVOLUTIONS } from "./strategies.ts";

/**
 * Bộ sưu tập (owner, 21/10): every card a deck can hold has a number, No.xxx. Monsters go by environment, 60
 * numbers each, in the owner's order; spells start at No.601, by spell group. Inside a block the monsters go from
 * the most stars to the fewest, and the cards of one set stay together at the place of the set's strongest card.
 * Forms (evolutions and fusions) have no number and are not in the albums. The numbers are worked out again whenever
 * cards are added (owner: they may still move while many cards are coming).
 */

export const BLOCK = 60;
export const SPELL_START = 601;

/** A kind inside an environment's block, starting `offset` numbers in; `rest` takes the monsters no kind lists. */
type Part = { label: string; offset: number; ids?: string[]; rest?: boolean };

/** The environments in album order (owner, 21/10); Vương quốc is still to come. */
const ALBUM_ENVS: Array<{ env: string; parts?: Part[] }> = [
  {
    env: "nui",
    parts: [
      { label: "Rồng", offset: 0, ids: ["mat-xanh-huy-diet", "loi-nguyen-cua-rong", "rong-boc-trung", "rong-phun-hoa-cau", "rong-con"], rest: true },
      { label: "Chim", offset: 30, ids: ["my-dieu-nhan"] },
    ],
  },
  { env: "bong-toi" },
  { env: "thao-nguyen" },
  {
    env: "rung-ram",
    parts: [
      { label: "Côn trùng", offset: 0, ids: ["ong-khong-lo", "sau-non"] },
      // Hoa ăn thịt người goes with the beasts for now (owner, 21/10).
      { label: "Thú", offset: 30, ids: ["te-giac-be-con", "tho-den-tinh-nghich", "hoa-an-thit-nguoi"], rest: true },
    ],
  },
  {
    env: "dat-da",
    parts: [
      { label: "Đá", offset: 0, ids: ["linh-chien-da-khong-lo", "khong-lo-mot-mat"], rest: true },
      { label: "Khủng long", offset: 20, ids: ["khung-long-vay-kiem"] },
      { label: "Xác sống", offset: 40, ids: ["mo-voi-ma-mut"] },
    ],
  },
  { env: "bien-sau" },
  { env: "cu-dia-may-moc" },
  { env: "thanh-dia-thien-su" },
  { env: "nui-dung-nham" },
  { env: "vuong-quoc" },
];

export type AlbumCard = { id: string; no: number; kind: "monster" | "spell"; part: string };
export type Album = { id: string; name: string; env: string | null; cards: AlbumCard[] };
export type CardSet = { id: string; name: string; ids: string[] };

const forms = new Set(FORMS.map((card) => card.id));
const deckMonsters = () => MONSTERS.map((card) => monsterCard(card.id) ?? card).filter((card) => !forms.has(card.id));
const starsOf = (id: string) => monsterCard(id)?.stars ?? 0;
const nameOf = (id: string) => monsterCard(id)?.name ?? spellCard(id)?.name ?? id;

/**
 * Sets (owner, 21/10): the cards that make a form together, named after that form, for now. Forms are not in the
 * albums, so a set only keeps the deck cards; one card alone is no set.
 */
export function cardSets(): CardSet[] {
  const deck = new Set(deckMonsters().map((card) => card.id));
  return EVOLUTIONS.map((row) => ({ id: row.result, name: monsterCard(row.result)?.name ?? row.result, ids: row.needs.filter((id) => deck.has(id)) })).filter(
    (set) => set.ids.length >= 2,
  );
}

/** The sets a card belongs to. */
export function setsOf(id: string, sets = cardSets()): CardSet[] {
  return sets.filter((set) => set.ids.includes(id));
}

/** A set's stars when all its cards are owned (owner, 21/10, for now): N 1,5, SR 9, UR 20 each, added up, rounded. */
const SET_PRIZE: Record<Tier, number> = { N: 1.5, SR: 9, UR: 20 };

export function setReward(set: CardSet, rates: Rates = loadRates()): number {
  return Math.round(set.ids.reduce((sum, id) => sum + SET_PRIZE[rarityOf(id, rates)], 0));
}

/** A card's rarity, as in the shop's pack (a publisher's move counts); forms by their stars. */
export function rarityOf(id: string, rates: Rates = loadRates()): Tier {
  const entry: PackEntry = { id, kind: monsterCard(id) ? "monster" : "spell" };
  return forms.has(id) ? naturalTier(entry) : tierOf(entry, rates);
}

/** One environment's numbers: each kind from its own start, sets kept together, most stars first. */
function numberEnv(env: string, base: number, parts: Part[] | undefined, sets: CardSet[]): AlbumCard[] {
  const listed = new Set(ENV_KINDS[env] ?? []);
  const members = deckMonsters()
    .map((card) => card.id)
    .filter((id) => listed.has(id));
  const kinds = parts ?? [{ label: "", offset: 0, rest: true }];
  const claimed = new Set(kinds.flatMap((part) => part.ids ?? []));
  const out: AlbumCard[] = [];
  for (const part of kinds) {
    const ids = members.filter((id) => (part.ids ?? []).includes(id) || (part.rest && !claimed.has(id)));
    // The cards of a set inside this kind are one unit, placed by its strongest card; any other card is alone.
    const units: string[][] = [];
    const placed = new Set<string>();
    for (const set of sets) {
      const inside = set.ids.filter((id) => ids.includes(id));
      if (inside.length < 2 || inside.some((id) => placed.has(id))) continue;
      inside.sort((a, b) => starsOf(b) - starsOf(a) || set.ids.indexOf(a) - set.ids.indexOf(b));
      inside.forEach((id) => placed.add(id));
      units.push(inside);
    }
    for (const id of ids) if (!placed.has(id)) units.push([id]);
    units.sort((a, b) => starsOf(b[0]) - starsOf(a[0]) || nameOf(a[0]).localeCompare(nameOf(b[0]), "vi"));
    let no = base + part.offset;
    for (const unit of units) for (const id of unit) out.push({ id, no: no++, kind: "monster", part: part.label });
  }
  return out;
}

/** Every album: one per environment in the owner's order (only those with cards), then the spells. */
export function albums(): Album[] {
  const sets = cardSets();
  const list: Album[] = [];
  ALBUM_ENVS.forEach((row, index) => {
    const cards = numberEnv(row.env, 1 + index * BLOCK, row.parts, sets);
    if (!cards.length) return;
    list.push({ id: row.env, name: spellCard(row.env)?.name ?? row.env, env: spellCard(row.env) ? row.env : null, cards });
  });
  const spells = SPELLS.map((card) => card.id).sort((a, b) => spellKindRank(a) - spellKindRank(b));
  list.push({ id: "phep", name: "Phép", env: null, cards: spells.map((id, index) => ({ id, no: SPELL_START + index, kind: "spell", part: "" })) });
  return list;
}

/** Every card's number. */
export function cardNumbers(): Map<string, number> {
  return new Map(albums().flatMap((album) => album.cards.map((card) => [card.id, card.no] as const)));
}

export function formatNo(no: number): string {
  return `No.${String(no).padStart(3, "0")}`;
}

/** The cards the player really has (owner, 21/10: the publisher's collection too): the default deck's and the ones opened. */
export function collectionOwned(owned: Set<string>): Set<string> {
  return new Set([...DEFAULT_DECK.monsters, ...DEFAULT_DECK.spells, ...owned]);
}
