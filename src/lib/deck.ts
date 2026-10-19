import { DEFAULT_DECK, deckLegal, FORMS, monsterCard, spellCard } from "./catalog.ts";
import { canUseCard } from "./owned-cards.ts";

const KEY = "clash-beasts-deck";
const BOOK_KEY = "clash-deck-book";
const RAISED_KEY = "clash-deck-raised";
const outside = new Set(FORMS.map((card) => card.id));

export type BeastDeck = { monsters: string[]; spells: string[] };

function playableMonster(id: string) {
  return Boolean(monsterCard(id)) && !outside.has(id);
}

export function deckIssues(deck: BeastDeck): string | null {
  const monsters = deck.monsters.filter(playableMonster);
  const spells = deck.spells.filter((id) => spellCard(id));
  if (new Set(monsters).size !== monsters.length || new Set(spells).size !== spells.length) return "Mỗi lá chỉ được một bản.";
  if (spells.filter((id) => spellCard(id)?.env).length > 1) return "Chỉ được một lá môi trường.";
  if (!deckLegal(monsters.length, spells.length)) return "Cần đúng 24 lá: quái 13–17, phép 7–11.";
  return null;
}

export type DeckSide = { sign: "" | "+" | "-"; n: number; bad: boolean };

export function deckBalance(deck: BeastDeck): { monster: DeckSide; spell: DeckSide } {
  const side = (count: number, min: number, max: number): DeckSide => {
    if (count < min) return { sign: "-", n: min - count, bad: true };
    if (count > max) return { sign: "+", n: count - max, bad: true };
    return { sign: "+", n: count - min, bad: false };
  };
  return { monster: side(deck.monsters.length, 13, 17), spell: side(deck.spells.length, 7, 11) };
}

function clean(deck: Partial<BeastDeck> | undefined): BeastDeck {
  return {
    monsters: (deck?.monsters ?? []).filter((id) => playableMonster(id) && canUseCard(id)),
    spells: (deck?.spells ?? []).filter((id) => Boolean(spellCard(id)) && canUseCard(id)),
  };
}

function sameDeck(a: BeastDeck, b: BeastDeck) {
  return a.monsters.length === b.monsters.length && a.spells.length === b.spells.length && a.monsters.every((id, index) => id === b.monsters[index]) && a.spells.every((id, index) => id === b.spells[index]);
}

function keptIds(list: unknown, ok: (id: string) => boolean) {
  if (!Array.isArray(list)) return [];
  const next: string[] = [];
  for (const id of list) {
    if (typeof id !== "string" || !ok(id) || next.includes(id)) continue;
    next.push(id);
  }
  return next;
}

export function raiseDefaultDeck() {
  if (typeof localStorage === "undefined" || localStorage.getItem(RAISED_KEY) === "1") return;
  const base: BeastDeck = { monsters: [...DEFAULT_DECK.monsters], spells: [...DEFAULT_DECK.spells] };
  const rows: Array<BeastDeck & { n: number; name: string }> = [];
  try {
    const raw = localStorage.getItem(BOOK_KEY);
    const data = raw ? (JSON.parse(raw) as { decks?: unknown }) : null;
    const used = new Set<number>();
    if (data && Array.isArray(data.decks)) {
      for (const item of data.decks) {
        if (!item || typeof item !== "object") continue;
        const row = item as { n?: unknown; name?: unknown; monsters?: unknown; spells?: unknown };
        const n = Number(row.n);
        if (!Number.isInteger(n) || n < 1 || used.has(n)) continue;
        used.add(n);
        rows.push({
          n,
          name: typeof row.name === "string" && row.name.trim() ? row.name.slice(0, 40) : `Bộ ${n}`,
          monsters: keptIds(row.monsters, playableMonster),
          spells: keptIds(row.spells, (id) => Boolean(spellCard(id))),
        });
      }
    }
  } catch {
    rows.length = 0;
  }
  rows.sort((a, b) => a.n - b.n);
  let saved: BeastDeck | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const deck = clean(JSON.parse(raw) as Partial<BeastDeck>);
      if (deck.monsters.length + deck.spells.length > 0) saved = deck;
    }
  } catch {
    saved = null;
  }
  if (saved && !sameDeck(saved, base) && !rows.some((row) => sameDeck(row, saved!))) {
    rows.push({ n: 0, name: "Bộ riêng", monsters: [...saved.monsters], spells: [...saved.spells] });
  }
  const hit = rows.findIndex((row) => sameDeck(row, base));
  const top = hit >= 0 ? rows.splice(hit, 1)[0] : { n: 1, name: "Lv 1 Meta deck", monsters: base.monsters, spells: base.spells };
  if (!top.name.trim()) top.name = "Lv 1 Meta deck";
  for (const row of rows) {
    if (row.name === "Lv 1 Meta deck") row.name = "Bộ riêng";
  }
  const decks = [top, ...rows].map((row, index) => ({ ...row, n: index + 1 }));
  localStorage.setItem(BOOK_KEY, JSON.stringify({ active: 1, decks }));
  localStorage.setItem(KEY, JSON.stringify({ monsters: base.monsters, spells: base.spells }));
  localStorage.setItem(RAISED_KEY, "1");
}

export function loadDeck(): BeastDeck {
  if (typeof localStorage === "undefined") return DEFAULT_DECK;
  raiseDefaultDeck();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DECK;
    const deck = clean(JSON.parse(raw) as Partial<BeastDeck>);
    if (deck.monsters.length + deck.spells.length === 0) return DEFAULT_DECK;
    return deck;
  } catch {
    return DEFAULT_DECK;
  }
}

export function saveDeck(deck: BeastDeck) {
  localStorage.setItem(KEY, JSON.stringify({ monsters: deck.monsters, spells: deck.spells }));
}
