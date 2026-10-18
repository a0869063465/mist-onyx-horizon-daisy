import { raiseDefaultDeck, type BeastDeck } from "./deck.ts";
import { DEFAULT_DECK, monsterCard, spellCard } from "./catalog.ts";
import { EVOLUTIONS } from "./strategies.ts";

const KEY = "clash-deck-book";
const DB = "clash-deck-files";
const STORE = "handles";
const HANDLE = "book";

/**
 * `fav`: a favourite deck (starred, listed first). `at`: when its cards or name last changed (newest first after
 * the favourites). `cover`: the monster shown on its box, picked at random among its monsters with the most stars,
 * unless the player chose it (`coverSet`, Đổi hình nền in the deck builder).
 */
export type DeckEntry = { n: number; name: string; monsters: string[]; spells: string[]; fav?: boolean; at?: number; cover?: string; coverSet?: boolean };
export type DeckBook = { decks: DeckEntry[]; active: number | null };

type FileHandle = {
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  queryPermission?: (query: { mode: "readwrite" }) => Promise<string>;
  requestPermission?: (query: { mode: "readwrite" }) => Promise<string>;
};

type PickerWindow = Window & {
  showSaveFilePicker?: (options: unknown) => Promise<FileHandle>;
  showOpenFilePicker?: (options: unknown) => Promise<FileHandle[]>;
};

function ids(list: unknown, ok: (id: string) => boolean): string[] {
  if (!Array.isArray(list)) return [];
  const next: string[] = [];
  for (const id of list) {
    if (typeof id !== "string" || !ok(id) || next.includes(id)) continue;
    next.push(id);
  }
  return next;
}

function entry(raw: unknown, used: Set<number>): DeckEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<DeckEntry>;
  const n = Number(row.n);
  if (!Number.isInteger(n) || n < 1 || used.has(n)) return null;
  used.add(n);
  const kept: DeckEntry = {
    n,
    name: typeof row.name === "string" ? row.name.slice(0, 40) : `Bộ ${n}`,
    monsters: ids(row.monsters, (id) => Boolean(monsterCard(id))),
    spells: ids(row.spells, (id) => Boolean(spellCard(id))),
  };
  if (row.fav === true) kept.fav = true;
  if (typeof row.at === "number" && Number.isFinite(row.at)) kept.at = row.at;
  if (typeof row.cover === "string" && monsterCard(row.cover)) kept.cover = row.cover;
  if (row.coverSet === true) kept.coverSet = true;
  return kept;
}

export function parseBook(raw: string): DeckBook | null {
  try {
    const data = JSON.parse(raw) as { decks?: unknown };
    const used = new Set<number>();
    const decks = (Array.isArray(data.decks) ? data.decks : [])
      .map((row) => entry(row, used))
      .filter((row): row is DeckEntry => Boolean(row))
      .sort((a, b) => a.n - b.n);
    if (decks.length === 0) return null;
    return { decks, active: decks[0].n };
  } catch {
    return null;
  }
}

function seed(): DeckBook {
  return {
    decks: [{ n: 1, name: "Lv 1 Meta deck", monsters: [...DEFAULT_DECK.monsters], spells: [...DEFAULT_DECK.spells] }],
    active: 1,
  };
}

export function loadBook(): DeckBook {
  if (typeof localStorage === "undefined") return seed();
  raiseDefaultDeck();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const book = parseBook(raw);
    if (!book) return seed();
    const data = JSON.parse(raw) as { active?: unknown };
    const active = Number(data.active);
    return { decks: book.decks, active: book.decks.some((row) => row.n === active) ? active : book.decks[0].n };
  } catch {
    return seed();
  }
}

export function saveBook(book: DeckBook) {
  localStorage.setItem(KEY, JSON.stringify({ active: book.active, decks: book.decks }));
}

export function freshDeck(decks: DeckEntry[]): DeckEntry {
  const n = decks.reduce((max, row) => Math.max(max, row.n), 0) + 1;
  return { n, name: `Bộ ${n}`, monsters: [], spells: [], at: Date.now() };
}

/** Favourites first, then the deck changed most recently (older decks with no time: the newest made first). */
export function deckOrder(decks: DeckEntry[]): DeckEntry[] {
  return [...decks].sort((a, b) => Number(Boolean(b.fav)) - Number(Boolean(a.fav)) || (b.at ?? 0) - (a.at ?? 0) || b.n - a.n);
}

/** Monsters a deck can show on its box: its own, then the forms its cards can become (evolutions, fusions). */
export function coverChoices(entry: Pick<DeckEntry, "monsters">): string[] {
  const owned = new Set(entry.monsters);
  const forms = EVOLUTIONS.filter((row) => row.needs.every((id) => owned.has(id))).map((row) => row.result);
  return [...entry.monsters.filter((id) => monsterCard(id)), ...forms.filter((id) => !owned.has(id))];
}

/**
 * The monster on a deck's box: the one the player chose while the deck can still show it; else its kept cover
 * while that is still one of the deck's monsters with the most stars, otherwise one of those picked at random
 * (owner, 18/10). Null for a deck with no monster.
 */
export function coverOf(entry: DeckEntry): string | null {
  if (entry.coverSet && entry.cover && coverChoices(entry).includes(entry.cover)) return entry.cover;
  const cards = entry.monsters.map((id) => monsterCard(id)).filter((card): card is NonNullable<typeof card> => Boolean(card));
  if (!cards.length) return null;
  const top = Math.max(...cards.map((card) => card.stars));
  const pool = cards.filter((card) => card.stars === top).map((card) => card.id);
  if (entry.cover && pool.includes(entry.cover)) return entry.cover;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function cardsOf(entry: DeckEntry): BeastDeck {
  return { monsters: [...entry.monsters], spells: [...entry.spells] };
}

function fileTypes() {
  return { suggestedName: "bo-bai.json", types: [{ description: "Bộ bài", accept: { "application/json": [".json"] } }] };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function remembered(): Promise<FileHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(HANDLE);
      req.onsuccess = () => resolve((req.result as FileHandle | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function remember(handle: FileHandle) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(handle, HANDLE);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function canWrite(handle: FileHandle) {
  try {
    if (!handle.queryPermission && !handle.requestPermission) return true;
    if ((await handle.queryPermission?.({ mode: "readwrite" })) === "granted") return true;
    return (await handle.requestPermission?.({ mode: "readwrite" })) === "granted";
  } catch {
    return false;
  }
}

async function writeHandle(handle: FileHandle, book: DeckBook) {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify({ decks: book.decks }, null, 2));
  await writable.close();
}

function downloadBook(book: DeckBook) {
  const blob = new Blob([JSON.stringify({ decks: book.decks }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "bo-bai.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function saveBookFile(book: DeckBook): Promise<"saved" | "cancel"> {
  const existing = await remembered();
  if (existing && (await canWrite(existing))) {
    try {
      await writeHandle(existing, book);
      return "saved";
    } catch {
      /* chọn file khác */
    }
  }
  const picker = (window as PickerWindow).showSaveFilePicker;
  if (!picker) {
    downloadBook(book);
    return "saved";
  }
  try {
    const handle = await picker(fileTypes());
    await writeHandle(handle, book);
    await remember(handle);
    return "saved";
  } catch {
    return "cancel";
  }
}

function readLocal(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      void file.text().then(resolve);
    };
    input.click();
  });
}

export async function openBookFile(): Promise<DeckBook | null | "bad"> {
  const picker = (window as PickerWindow).showOpenFilePicker;
  try {
    if (!picker) {
      const text = await readLocal();
      if (text == null) return null;
      return parseBook(text) ?? "bad";
    }
    const [handle] = await picker(fileTypes());
    const text = await (await handle.getFile()).text();
    const book = parseBook(text);
    if (!book) return "bad";
    if (await canWrite(handle)) await remember(handle);
    return book;
  } catch {
    return null;
  }
}
