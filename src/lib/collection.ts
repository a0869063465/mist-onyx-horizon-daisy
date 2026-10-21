import { DEFAULT_DECK, FORMS, MONSTERS, SPELLS, monsterCard, spellCard, spellSrc } from "./catalog.ts";
import { ENV_KINDS } from "./env-kinds.ts";
import { addOwned, addStars, loadRates, naturalTier, ownedIds, starCount, tierOf, type PackEntry, type Rates, type Tier } from "./shop.ts";
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
/** The spell album's cover. */
const SPELL_COVER = "sam-set-tan-the";

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
/** `cover`: the picture on the album's cover, the environment card's (the spells: one spell's). */
export type Album = { id: string; name: string; env: string | null; cover: string; cards: AlbumCard[] };
export type CardSet = { id: string; name: string; ids: string[] };

const forms = new Set(FORMS.map((card) => card.id));
const deckMonsters = () => MONSTERS.map((card) => monsterCard(card.id) ?? card).filter((card) => !forms.has(card.id));
const starsOf = (id: string) => monsterCard(id)?.stars ?? 0;
/** A card's name, a monster's or a spell's. */
export const cardName = (id: string) => monsterCard(id)?.name ?? spellCard(id)?.name ?? id;

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
    units.sort((a, b) => starsOf(b[0]) - starsOf(a[0]) || cardName(a[0]).localeCompare(cardName(b[0]), "vi"));
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
    list.push({ id: row.env, name: spellCard(row.env)?.name ?? row.env, env: spellCard(row.env) ? row.env : null, cover: spellSrc(row.env), cards });
  });
  const spells = SPELLS.map((card) => card.id).sort((a, b) => spellKindRank(a) - spellKindRank(b));
  list.push({
    id: "phep",
    name: "Phép",
    env: null,
    cover: spellSrc(SPELL_COVER),
    cards: spells.map((id, index) => ({ id, no: SPELL_START + index, kind: "spell", part: "" })),
  });
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

/** An album page: 4 cards a row, 4 rows. */
export const PAGE_COLS = 4;
export const PAGE_ROWS = 4;

/**
 * What a page pocket holds: a card (`linked` when it belongs to more than one set or to a set with cards in another
 * album: its sets open from it), a set standing framed together on the page, or nothing.
 */
export type PageItem = { type: "card"; card: AlbumCard; linked: boolean } | { type: "set"; set: CardSet; cards: AlbumCard[] } | { type: "blank" };

/**
 * An album's pages. A set stands framed when all its cards are in this album side by side and none of them is in
 * another set; it never breaks over two rows, so the row before it may end with empty pockets. The last page is
 * filled up with empty pockets, like a binder.
 */
export function albumPages(album: Album, sets = cardSets()): PageItem[][] {
  const at = new Map(album.cards.map((card, index) => [card.id, index]));
  const count = new Map<string, number>();
  for (const set of sets) for (const id of set.ids) count.set(id, (count.get(id) ?? 0) + 1);
  const framed = new Map<string, CardSet>();
  for (const set of sets) {
    const spots = set.ids.map((id) => at.get(id));
    if (set.ids.length > PAGE_COLS || spots.some((spot) => spot === undefined) || set.ids.some((id) => count.get(id) !== 1)) continue;
    const order = (spots as number[]).sort((a, b) => a - b);
    if (order.every((spot, index) => index === 0 || spot === order[index - 1] + 1)) for (const id of set.ids) framed.set(id, set);
  }
  const items: PageItem[] = [];
  let col = 0;
  for (let index = 0; index < album.cards.length; ) {
    const card = album.cards[index];
    const set = framed.get(card.id);
    if (!set) {
      items.push({ type: "card", card, linked: count.has(card.id) });
      col = (col + 1) % PAGE_COLS;
      index += 1;
      continue;
    }
    if (col + set.ids.length > PAGE_COLS) {
      for (; col < PAGE_COLS; col += 1) items.push({ type: "blank" });
      col = 0;
    }
    items.push({ type: "set", set, cards: album.cards.slice(index, index + set.ids.length) });
    col = (col + set.ids.length) % PAGE_COLS;
    index += set.ids.length;
  }
  const size = PAGE_COLS * PAGE_ROWS;
  const pages: PageItem[][] = [];
  let page: PageItem[] = [];
  let used = 0;
  for (const item of items) {
    page.push(item);
    used += item.type === "set" ? item.cards.length : 1;
    if (used === size) {
      pages.push(page);
      page = [];
      used = 0;
    }
  }
  if (used || !pages.length) {
    for (; used < size; used += 1) page.push({ type: "blank" });
    pages.push(page);
  }
  return pages;
}

/** The album a card is in. */
export function albumOf(id: string, list = albums()): Album | undefined {
  return list.find((album) => album.cards.some((card) => card.id === id));
}

const SEEN_KEY = "clash-album-seen";
const CLAIMED_KEY = "clash-set-claimed";

function readIds(key: string): Set<string> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function writeIds(key: string, ids: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    // Only for this visit then.
  }
}

/** The cards already looked at in their album, on this phone. */
export function loadAlbumSeen(): Set<string> {
  return readIds(SEEN_KEY);
}

export function markAlbumSeen(ids: Iterable<string>): Set<string> {
  const seen = loadAlbumSeen();
  for (const id of ids) seen.add(id);
  writeIds(SEEN_KEY, seen);
  return seen;
}

/**
 * A card owned that will need Giám định (owner, 21/10): any card got from a pack or bought with stars, not the default
 * deck's. Giám định itself is still to come.
 */
export function awaitsAppraisal(id: string, owned: Set<string>): boolean {
  return owned.has(id) && !DEFAULT_DECK.monsters.includes(id) && !DEFAULT_DECK.spells.includes(id);
}

/** Cards owned and not looked at in their album yet; the default deck's cards are never new. */
export function newCards(owned: Set<string>, seen: Set<string>): Set<string> {
  const starters = new Set([...DEFAULT_DECK.monsters, ...DEFAULT_DECK.spells]);
  return new Set([...owned].filter((id) => !starters.has(id) && !seen.has(id)));
}

/** Đổi sao lấy lá (owner, 21/10): the stars a card of the albums costs, by its rarity; an environment card is SR. */
export const EXCHANGE_PRICE: Record<Tier, number> = { N: 7, SR: 50, UR: 140 };

export function exchangePrice(id: string, rates: Rates = loadRates()): number {
  return EXCHANGE_PRICE[rarityOf(id, rates)];
}

/** Buys a card of the albums not owned yet, saved before any light show; false when owned or short of stars. */
export function exchangeCard(id: string): boolean {
  const price = exchangePrice(id);
  if (collectionOwned(ownedIds()).has(id) || !cardNumbers().has(id) || starCount() < price) return false;
  addOwned(id);
  addStars(-price);
  return true;
}

/** The sets whose stars were taken already (owner, 21/10: once each, with Nhận). */
export function claimedSets(): Set<string> {
  return readIds(CLAIMED_KEY);
}

/** A set's stars, once, when all its cards are owned; 0 otherwise. */
export function claimSet(set: CardSet): number {
  const claimed = claimedSets();
  const owned = collectionOwned(ownedIds());
  if (claimed.has(set.id) || !set.ids.every((id) => owned.has(id))) return 0;
  const stars = setReward(set);
  claimed.add(set.id);
  writeIds(CLAIMED_KEY, claimed);
  addStars(stars);
  return stars;
}
