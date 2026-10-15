/**
 * Bộ nhớ các ván AI đã kết thúc. Không đọc habits, không đổi nước đi.
 * Khoá localStorage riêng: clash-match-history.
 */

export const MATCH_HISTORY_KEY = "clash-match-history";
export const MATCH_HISTORY_VERSION = 1;

const MAX_MATCHES = 40;

export type HistoryDeck = { monsters: string[]; spells: string[] };
export type OpeningDecks = { you: HistoryDeck; foe: HistoryDeck };
export type MatchResult = "win" | "loss" | "draw";

export type EventKind =
  | "draw"
  | "summon"
  | "attack-monster"
  | "attack-face"
  | "block"
  | "spell"
  | "skill"
  | "pass"
  | "end-turn"
  | "concede"
  | "win"
  | "fuse"
  | "wall"
  | "cover"
  | "upkeep"
  | "reel"
  | "result";

export type EventTarget = { kind: "face" } | { kind: "monster"; cardId: string | null; uid: string | null } | null;

export type HitNote = {
  who: 0 | 1;
  to: "face" | "monster";
  cardId: string | null;
  uid: string | null;
  before: number;
  after: number;
  dealt: number;
  blocked: boolean;
  reflect: boolean;
  delayed: boolean;
};

export type MatchEvent = {
  n: number;
  id: string;
  actor: 0 | 1;
  kind: EventKind;
  ok: boolean;
  cardId: string | null;
  target: EventTarget;
  hp: [number, number];
  orb: [number, number];
  stars: [number, number];
  end: "damage" | "concede" | null;
  cause: string | null;
  auto: boolean;
  hit: HitNote | null;
  look?: DecisionLook;
};

export type LookMon = {
  cardId: string;
  uid: string;
  atk: number;
  def: number;
  mdef: number;
  hp: number;
  dim: boolean;
  stun: number;
  stars: number;
};

export type LookKind = "draw" | "summon" | "attack-face" | "attack-monster" | "skill" | "spell" | "block" | "pass" | "end-turn" | "fuse" | "cover" | "wall";

export type LookOption = {
  id: string;
  kind: LookKind;
  cardId: string | null;
  target: EventTarget;
  cost: number;
};

/** Bàn cờ và các nước hợp lệ ngay trước một nước người chơi tự chọn. Ván cũ không có phần này. */
export type DecisionLook = {
  turn: 0 | 1;
  step: string;
  hp: [number, number];
  orb: [number, number];
  flask: [number, number];
  stars: [number, number];
  hand: [string[], string[]];
  reserve: [string[], string[]];
  field: [Array<LookMon | null>, Array<LookMon | null>];
  pending: string | null;
  options: LookOption[];
  pick: string;
};

export type OpeningPlayer = {
  hp: number;
  hand: readonly unknown[];
  field: readonly (unknown | null)[];
  reserve: readonly { id: string }[];
  monsterDeck: readonly { id: string }[];
  spellDeck: readonly string[];
  env?: string;
  draws: number;
  summons: number;
  turns?: number;
  spent?: readonly unknown[];
};

export type MatchRecord = {
  id: string;
  version: 1;
  mode: "ai";
  startedAt: number;
  endedAt: number;
  winner: 0 | 1 | null;
  result: MatchResult;
  decks: OpeningDecks | null;
  log: string[];
  events: MatchEvent[];
};

export type FinishedMatch = {
  id: string;
  startedAt: number;
  endedAt: number;
  mode: string;
  winner: 0 | 1 | null;
  decks: OpeningDecks | null;
  log: readonly string[];
  events?: readonly MatchEvent[];
};

export type HistoryStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type Remembered = { ok: true; added: boolean } | { ok: false; reason: "invalid" | "unread" | "full" };

let memoryBook: string | null = null;
let saveProblem: string | null = null;
const historyLines: string[] = [];
let lastSeal: { winner: 0 | 1 | null; step: string; saved: boolean; why: string } | null = null;
let lastWrite = { local: "chưa ghi", session: "chưa ghi", idb: "chưa ghi" };

function histLog(line: string) {
  historyLines.push(line);
  if (historyLines.length > 12) historyLines.shift();
  if (typeof console !== "undefined") console.info(`[history] ${line}`);
}

const REFUSED = "Không lưu được vào bộ nhớ máy. Hãy tải tệp trước khi thoát.";
const INVALID = "Ván đã kết thúc nhưng dữ liệu không hợp lệ nên không lưu.";
const DB_NAME = "clash-match-db";
const DB_STORE = "book";
const DB_KEY = "history";
const STAMP = "clash_hist";

type HistoryMirror = {
  read(): Promise<string | null>;
  write(value: string): void;
};

let testMirror: HistoryMirror | null = null;

export function matchHistoryProblem(): string | null {
  return saveProblem;
}

export function resetHistoryFallback() {
  memoryBook = null;
  saveProblem = null;
}

export function setHistoryMirrorForTests(mirror: HistoryMirror | null) {
  testMirror = mirror;
}

export function warmMatchHistory() {
  void historyDb();
}

function stamp(kind: "ok" | "bad") {
  try {
    if (typeof document === "undefined") return;
    document.cookie = `${STAMP}=${kind}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // Trình duyệt chặn cookie.
  }
}

function stamped(): "ok" | "bad" | null {
  try {
    if (typeof document === "undefined") return null;
    const hit = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${STAMP}=`));
    if (!hit) return null;
    const kind = hit.slice(STAMP.length + 1);
    return kind === "ok" || kind === "bad" ? kind : null;
  } catch {
    return null;
  }
}

function hostStorage(name: "localStorage" | "sessionStorage"): HistoryStore | null {
  try {
    const host = globalThis as { localStorage?: HistoryStore; sessionStorage?: HistoryStore };
    const store = host[name];
    if (!store || typeof store.getItem !== "function" || typeof store.setItem !== "function") return null;
    return store;
  } catch {
    return null;
  }
}

let opening: Promise<IDBDatabase | null> | null = null;

function historyDb(): Promise<IDBDatabase | null> {
  if (opening) return opening;
  const idb = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  if (!idb) {
    opening = Promise.resolve(null);
    return opening;
  }
  opening = new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = idb.open(DB_NAME, 1);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  return opening;
}

function writeMirror(value: string) {
  testMirror?.write(value);
  void historyDb().then((db) => {
    if (!db) {
      lastWrite = { ...lastWrite, idb: "không có" };
      histLog("ghi indexedDB: không có");
      return;
    }
    try {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(value, DB_KEY);
      tx.oncomplete = () => {
        lastWrite = { ...lastWrite, idb: "ok" };
        histLog("ghi indexedDB: ok");
      };
      tx.onerror = () => {
        lastWrite = { ...lastWrite, idb: "lỗi" };
        histLog("ghi indexedDB: lỗi");
      };
      tx.onabort = () => {
        lastWrite = { ...lastWrite, idb: "hủy" };
        histLog("ghi indexedDB: hủy");
      };
    } catch {
      lastWrite = { ...lastWrite, idb: "lỗi" };
      histLog("ghi indexedDB: lỗi");
    }
  });
}

async function readMirror(): Promise<string | null> {
  if (testMirror) return testMirror.read();
  const db = await historyDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(DB_KEY);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function browserStore(): HistoryStore {
  return {
    getItem(key: string) {
      if (key === MATCH_HISTORY_KEY && memoryBook) return memoryBook;
      for (const store of [hostStorage("localStorage"), hostStorage("sessionStorage")]) {
        if (!store) continue;
        try {
          const raw = store.getItem(key);
          if (raw) return raw;
        } catch {
          // Máy chặn đọc.
        }
      }
      return null;
    },
    setItem(key: string, value: string) {
      if (key === MATCH_HISTORY_KEY) {
        memoryBook = value;
        saveProblem = null;
        stamp("ok");
        writeMirror(value);
      }
      let persisted = false;
      const names = ["localStorage", "sessionStorage"] as const;
      for (const name of names) {
        const store = hostStorage(name);
        const slot = name === "localStorage" ? "local" : "session";
        if (!store) {
          if (key === MATCH_HISTORY_KEY) lastWrite = { ...lastWrite, [slot]: "không có" };
          continue;
        }
        try {
          store.setItem(key, value);
          const kept = store.getItem(key);
          if (kept) {
            persisted = true;
            if (key === MATCH_HISTORY_KEY) lastWrite = { ...lastWrite, [slot]: "ok" };
          } else if (key === MATCH_HISTORY_KEY) lastWrite = { ...lastWrite, [slot]: "không đọc lại được" };
        } catch {
          if (key === MATCH_HISTORY_KEY) lastWrite = { ...lastWrite, [slot]: "lỗi" };
        }
      }
      if (key === MATCH_HISTORY_KEY) {
        saveProblem = persisted ? null : REFUSED;
        histLog(`ghi local=${lastWrite.local} session=${lastWrite.session}`);
      }
    },
  };
}

function cardIds(list: readonly { id: string }[]): string[] | null {
  const ids: string[] = [];
  for (const card of list) {
    if (!card || typeof card.id !== "string" || card.id.length === 0 || card.id.length > 80) return null;
    ids.push(card.id);
  }
  return ids;
}

function spellIds(list: readonly string[], env?: string): string[] | null {
  const ids: string[] = [];
  if (env !== undefined) {
    if (typeof env !== "string" || env.length === 0 || env.length > 80) return null;
    ids.push(env);
  }
  for (const id of list) {
    if (typeof id !== "string" || id.length === 0 || id.length > 80) return null;
    ids.push(id);
  }
  return ids;
}

function freshOpening(player: OpeningPlayer): boolean {
  return (
    player.hp === 16 &&
    player.hand.length <= 1 &&
    player.field.length === 3 &&
    player.field.every((mon) => mon === null) &&
    player.draws === 0 &&
    player.summons === 0 &&
    (player.turns ?? 0) === 0 &&
    (player.spent?.length ?? 0) === 0
  );
}

function deckOf(player: OpeningPlayer): HistoryDeck | null {
  const monsters = cardIds(player.reserve);
  const rest = cardIds(player.monsterDeck);
  const spells = spellIds([...player.hand, ...player.spellDeck], player.env);
  if (!monsters || !rest || !spells) return null;
  return { monsters: [...monsters, ...rest], spells };
}

/** Bộ bài lúc mở ván. Trả null nếu sân không còn là ván vừa tạo. */
export function openingDecks(players: readonly [OpeningPlayer, OpeningPlayer]): OpeningDecks | null {
  if (!freshOpening(players[0]) || !freshOpening(players[1])) return null;
  const you = deckOf(players[0]);
  const foe = deckOf(players[1]);
  if (!you || !foe) return null;
  return { you, foe };
}

export function newMatchId(now = Date.now()): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `m-${now.toString(36)}-${rand}`;
}

export function matchResult(winner: 0 | 1 | null): MatchResult {
  if (winner === 0) return "win";
  if (winner === 1) return "loss";
  return "draw";
}

export function isFinishedAi(mode: string, step: string, winner: 0 | 1 | null): boolean {
  return mode === "ai" && step === "over" && (winner === 0 || winner === 1 || winner === null);
}

function cleanDeck(value: unknown): HistoryDeck | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { monsters?: unknown; spells?: unknown };
  if (!Array.isArray(row.monsters) || !Array.isArray(row.spells)) return null;
  if (!row.monsters.every((id) => typeof id === "string") || !row.spells.every((id) => typeof id === "string")) return null;
  return { monsters: [...row.monsters], spells: [...row.spells] };
}

function cleanDecks(value: unknown): OpeningDecks | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { you?: unknown; foe?: unknown };
  const you = cleanDeck(row.you);
  const foe = cleanDeck(row.foe);
  if (!you || !foe) return null;
  return { you, foe };
}

function pair(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

const EVENT_KINDS = new Set<EventKind>([
  "draw",
  "summon",
  "attack-monster",
  "attack-face",
  "block",
  "spell",
  "skill",
  "pass",
  "end-turn",
  "concede",
  "win",
  "fuse",
  "wall",
  "cover",
  "upkeep",
  "reel",
  "result",
]);

function parseTarget(value: unknown): EventTarget | undefined {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const row = value as { kind?: unknown; cardId?: unknown; uid?: unknown };
  if (row.kind === "face") return { kind: "face" };
  if (row.kind !== "monster") return undefined;
  if (row.cardId !== null && typeof row.cardId !== "string") return undefined;
  if (row.uid !== null && typeof row.uid !== "string") return undefined;
  return { kind: "monster", cardId: row.cardId ?? null, uid: row.uid ?? null };
}

function parseHit(value: unknown): HitNote | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object") return undefined;
  const row = value as Partial<HitNote>;
  if (row.who !== 0 && row.who !== 1) return undefined;
  if (row.to !== "face" && row.to !== "monster") return undefined;
  if (row.cardId !== null && typeof row.cardId !== "string") return undefined;
  if (row.uid !== null && typeof row.uid !== "string") return undefined;
  if (typeof row.before !== "number" || typeof row.after !== "number" || typeof row.dealt !== "number") return undefined;
  if (!Number.isFinite(row.before) || !Number.isFinite(row.after) || !Number.isFinite(row.dealt)) return undefined;
  if (typeof row.blocked !== "boolean" || typeof row.reflect !== "boolean" || typeof row.delayed !== "boolean") return undefined;
  return {
    who: row.who,
    to: row.to,
    cardId: row.cardId ?? null,
    uid: row.uid ?? null,
    before: row.before,
    after: row.after,
    dealt: row.dealt,
    blocked: row.blocked,
    reflect: row.reflect,
    delayed: row.delayed,
  };
}

function parseLook(value: unknown): DecisionLook | null | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<DecisionLook>;
  if (row.turn !== 0 && row.turn !== 1) return null;
  if (typeof row.step !== "string" || row.step.length === 0 || row.step.length > 40) return null;
  if (!pair(row.hp) || !pair(row.orb) || !pair(row.flask) || !pair(row.stars)) return null;
  if (row.pending !== null && typeof row.pending !== "string") return null;
  if (typeof row.pick !== "string" || row.pick.length === 0 || row.pick.length > 80) return null;
  const hand = parseIdLists(row.hand);
  const reserve = parseIdLists(row.reserve);
  const field = parseField(row.field);
  const options = parseOptions(row.options);
  if (!hand || !reserve || !field || !options) return null;
  if (!options.some((option) => option.id === row.pick)) return null;
  return { turn: row.turn, step: row.step, hp: row.hp, orb: row.orb, flask: row.flask, stars: row.stars, hand, reserve, field, pending: row.pending ?? null, options, pick: row.pick };
}

function parseIdLists(value: unknown): [string[], string[]] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const lists = value.map((row) => (Array.isArray(row) && row.every((id) => typeof id === "string") ? [...row] : null));
  if (lists.some((row) => !row)) return null;
  return lists as [string[], string[]];
}

function parseLookMon(value: unknown): LookMon | null | undefined {
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const row = value as Partial<LookMon>;
  if (typeof row.cardId !== "string" || typeof row.uid !== "string") return undefined;
  if (typeof row.atk !== "number" || typeof row.def !== "number" || typeof row.mdef !== "number" || typeof row.hp !== "number" || typeof row.stars !== "number" || typeof row.stun !== "number") return undefined;
  if (typeof row.dim !== "boolean") return undefined;
  return { cardId: row.cardId, uid: row.uid, atk: row.atk, def: row.def, mdef: row.mdef, hp: row.hp, dim: row.dim, stun: row.stun, stars: row.stars };
}

function parseField(value: unknown): [Array<LookMon | null>, Array<LookMon | null>] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const sides = value.map((side) => {
    if (!Array.isArray(side) || side.length !== 3) return null;
    const slots = side.map((slot) => parseLookMon(slot));
    if (slots.some((slot) => slot === undefined)) return null;
    return slots as Array<LookMon | null>;
  });
  if (sides.some((side) => !side)) return null;
  return sides as [Array<LookMon | null>, Array<LookMon | null>];
}

const LOOK_KINDS = new Set<LookKind>(["draw", "summon", "attack-face", "attack-monster", "skill", "spell", "block", "pass", "end-turn", "fuse", "cover", "wall"]);

function parseOptions(value: unknown): LookOption[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 80) return null;
  const options: LookOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const row = item as Partial<LookOption>;
    if (typeof row.id !== "string" || row.id.length === 0 || row.id.length > 80) return null;
    if (typeof row.kind !== "string" || !LOOK_KINDS.has(row.kind as LookKind)) return null;
    if (row.cardId !== null && typeof row.cardId !== "string") return null;
    if (typeof row.cost !== "number" || !Number.isFinite(row.cost)) return null;
    const target = parseTarget(row.target);
    if (target === undefined) return null;
    options.push({ id: row.id, kind: row.kind as LookKind, cardId: row.cardId ?? null, target, cost: row.cost });
  }
  return options;
}

function parseEvent(value: unknown): MatchEvent | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<MatchEvent>;
  if (typeof row.n !== "number" || !Number.isInteger(row.n) || row.n < 1) return null;
  if (row.actor !== 0 && row.actor !== 1) return null;
  if (typeof row.kind !== "string" || !EVENT_KINDS.has(row.kind as EventKind)) return null;
  if (typeof row.ok !== "boolean") return null;
  if (row.cardId !== null && typeof row.cardId !== "string") return null;
  if (!pair(row.hp) || !pair(row.orb) || !pair(row.stars)) return null;
  if (row.end !== null && row.end !== "damage" && row.end !== "concede") return null;
  const target = parseTarget(row.target);
  if (target === undefined) return null;
  if (row.id !== undefined && (typeof row.id !== "string" || row.id.length === 0 || row.id.length > 40)) return null;
  if (row.cause !== undefined && row.cause !== null && typeof row.cause !== "string") return null;
  if (row.auto !== undefined && typeof row.auto !== "boolean") return null;
  const hit = parseHit(row.hit);
  if (hit === undefined) return null;
  const look = parseLook(row.look);
  if (look === null) {
    return {
      n: row.n,
      id: row.id ?? `legacy-${row.n}`,
      actor: row.actor,
      kind: row.kind as EventKind,
      ok: row.ok,
      cardId: row.cardId ?? null,
      target,
      hp: row.hp,
      orb: row.orb,
      stars: row.stars,
      end: row.end ?? null,
      cause: row.cause ?? null,
      auto: row.auto ?? false,
      hit,
    };
  }
  return {
    n: row.n,
    id: row.id ?? `legacy-${row.n}`,
    actor: row.actor,
    kind: row.kind as EventKind,
    ok: row.ok,
    cardId: row.cardId ?? null,
    target,
    hp: row.hp,
    orb: row.orb,
    stars: row.stars,
    end: row.end ?? null,
    cause: row.cause ?? null,
    auto: row.auto ?? false,
    hit,
    ...(look ? { look } : {}),
  };
}

function parseEvents(value: unknown): MatchEvent[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const events: MatchEvent[] = [];
  for (const row of value) {
    const parsed = parseEvent(row);
    if (!parsed) return null;
    events.push(parsed);
  }
  return events;
}

function parseRecord(value: unknown): MatchRecord | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<MatchRecord>;
  if (row.version !== 1 || row.mode !== "ai") return null;
  if (typeof row.id !== "string" || row.id.length === 0 || row.id.length > 80) return null;
  if (typeof row.startedAt !== "number" || typeof row.endedAt !== "number") return null;
  if (!Number.isFinite(row.startedAt) || !Number.isFinite(row.endedAt) || row.endedAt < row.startedAt) return null;
  if (row.winner !== 0 && row.winner !== 1 && row.winner !== null) return null;
  if (row.result !== matchResult(row.winner)) return null;
  if (!Array.isArray(row.log) || !row.log.every((line) => typeof line === "string")) return null;
  const events = parseEvents(row.events);
  if (!events) return null;
  if (row.decks !== null) {
    const decks = cleanDecks(row.decks);
    if (!decks) return null;
    return { ...row, decks, log: [...row.log], events } as MatchRecord;
  }
  return { ...(row as MatchRecord), decks: null, log: [...row.log], events };
}

function readBook(store: HistoryStore): { matches: MatchRecord[]; writable: boolean } {
  const raw = store.getItem(MATCH_HISTORY_KEY);
  if (!raw) return { matches: [], writable: true };
  try {
    const data = JSON.parse(raw) as { version?: unknown; matches?: unknown };
    if (!data || typeof data !== "object" || data.version !== MATCH_HISTORY_VERSION || !Array.isArray(data.matches)) {
      return { matches: [], writable: false };
    }
    return { matches: data.matches.flatMap((row) => {
      const parsed = parseRecord(row);
      return parsed ? [parsed] : [];
    }), writable: true };
  } catch {
    return { matches: [], writable: false };
  }
}

function writeBook(store: HistoryStore, matches: MatchRecord[]): boolean {
  let rows = matches.slice(-MAX_MATCHES);
  while (rows.length > 0) {
    try {
      store.setItem(MATCH_HISTORY_KEY, JSON.stringify({ version: MATCH_HISTORY_VERSION, matches: rows }));
      return true;
    } catch {
      if (rows.length === 1) return false;
      rows = rows.slice(1);
    }
  }
  return false;
}

export function loadMatchHistory(store?: HistoryStore): MatchRecord[] {
  return readBook(store ?? browserStore()).matches;
}

export type HistoryPack = { status: "empty" } | { status: "broken"; message?: string } | { status: "ready"; count: number; json: string };

export function exportMatchHistory(store?: HistoryStore): HistoryPack {
  const kept = store ?? browserStore();
  let raw: string | null;
  try {
    raw = kept.getItem(MATCH_HISTORY_KEY);
  } catch {
    return { status: "broken", message: saveProblem ?? REFUSED };
  }
  if (!raw) return saveProblem ? { status: "broken", message: saveProblem } : { status: "empty" };
  try {
    const data = JSON.parse(raw) as { version?: unknown; matches?: unknown };
    if (!data || typeof data !== "object" || data.version !== MATCH_HISTORY_VERSION || !Array.isArray(data.matches)) {
      return { status: "broken", message: "Lịch sử không đọc được. Dữ liệu gốc vẫn giữ nguyên." };
    }
    if (data.matches.length === 0) return saveProblem ? { status: "broken", message: saveProblem } : { status: "empty" };
    return { status: "ready", count: data.matches.length, json: JSON.stringify(data, null, 2) };
  } catch {
    return { status: "broken", message: "Lịch sử không đọc được. Dữ liệu gốc vẫn giữ nguyên." };
  }
}

/** Đọc cả bản IndexedDB. Dùng cho màn xuất, sau khi trang đã tải lại. */
export async function exportStoredHistory(): Promise<HistoryPack> {
  const sync = exportMatchHistory();
  if (sync.status !== "empty") {
    histLog(`đọc màn xuất: ${sync.status === "ready" ? sync.count : sync.status}`);
    return sync;
  }
  try {
    const mirrored = await readMirror();
    if (mirrored) {
      memoryBook = mirrored;
      saveProblem = null;
      const again = exportMatchHistory();
      if (again.status !== "empty") {
        histLog(`đọc màn xuất từ indexedDB: ${again.status === "ready" ? again.count : again.status}`);
        return again;
      }
    }
  } catch {
    histLog("đọc indexedDB: lỗi");
  }
  const mark = stamped();
  if (mark === "ok") return { status: "broken", message: REFUSED };
  if (mark === "bad") return { status: "broken", message: INVALID };
  histLog("đọc màn xuất: trống");
  return sync;
}

export function rememberMatch(input: FinishedMatch, store?: HistoryStore): Remembered {
  const own = store === undefined;
  const kept = store ?? browserStore();
  if (!isFinishedAi(input.mode, "over", input.winner)) return { ok: false, reason: "invalid" };
  const startedAt = input.startedAt;
  const endedAt = Math.max(input.endedAt, startedAt);
  const record = parseRecord({
    id: input.id,
    version: 1,
    mode: "ai",
    startedAt,
    endedAt,
    winner: input.winner,
    result: matchResult(input.winner),
    decks: input.decks,
    log: input.log,
    events: input.events ?? [],
  });
  if (!record) {
    if (own) {
      saveProblem = INVALID;
      if (!memoryBook) stamp("bad");
    }
    return { ok: false, reason: "invalid" };
  }
  const book = readBook(kept);
  if (!book.writable) {
    if (own) saveProblem = REFUSED;
    return { ok: false, reason: "unread" };
  }
  if (book.matches.some((match) => match.id === record.id)) return { ok: true, added: false };
  const wrote = writeBook(kept, [...book.matches, record]);
  if (!wrote && own) saveProblem = REFUSED;
  return wrote ? { ok: true, added: true } : { ok: false, reason: "full" };
}

export function noteFinishedAi(
  prev: { mode: string; winner: 0 | 1 | null },
  next: { mode: string; step: string; winner: 0 | 1 | null; log: readonly string[]; events?: readonly MatchEvent[] },
  memo: { id: string; startedAt: number; decks: OpeningDecks | null; saved: boolean } | null,
  store?: HistoryStore,
): { saved: boolean; id: string; startedAt: number } {
  const id = memo?.id ?? "";
  const startedAt = memo?.startedAt ?? 0;
  if (memo?.saved) return { saved: true, id, startedAt };
  const crossing = prev.mode === "ai" && next.mode === "ai" && prev.winner === null && (next.winner === 0 || next.winner === 1);
  if (!crossing) {
    return { saved: false, id, startedAt };
  }
  const matchId = memo?.id ?? newMatchId();
  const began = memo?.startedAt ?? Date.now();
  const kept = rememberMatch({
    id: matchId,
    startedAt: began,
    endedAt: Math.max(Date.now(), began),
    mode: next.mode,
    winner: next.winner,
    decks: memo?.decks ?? null,
    log: next.log,
    events: next.events ?? [],
  }, store);
  lastSeal = { winner: next.winner, step: next.step, saved: kept.ok, why: kept.ok ? "đã lưu" : kept.reason };
  histLog(`kết thúc winner=${next.winner} step=${next.step} lưu=${kept.ok ? "có" : "không"} ${kept.ok ? "" : kept.reason}`.trim());
  return { saved: kept.ok, id: matchId, startedAt: began };
}

function countRaw(raw: string | null): number | null {
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw) as { matches?: unknown };
    return Array.isArray(data.matches) ? data.matches.length : null;
  } catch {
    return null;
  }
}

function snapStore(store: HistoryStore | null): { count: number | null; error: string } {
  if (!store) return { count: null, error: "không có" };
  try {
    const count = countRaw(store.getItem(MATCH_HISTORY_KEY));
    return { count, error: count === null ? "không đọc được" : "" };
  } catch {
    return { count: null, error: "lỗi đọc" };
  }
}

export type HistoryDiag = {
  idb: "có" | "không";
  memory: number | null;
  local: { count: number | null; error: string };
  session: { count: number | null; error: string };
  indexed: { count: number | null; error: string };
  lastWrite: { local: string; session: string; idb: string };
  lastSeal: { winner: 0 | 1 | null; step: string; saved: boolean; why: string } | null;
  lines: string[];
};

/** Số bản ghi từng kho. Không gồm nội dung ván. */
export async function diagnoseHistory(): Promise<HistoryDiag> {
  const idb = typeof indexedDB !== "undefined" && indexedDB ? "có" : "không";
  let indexed = { count: null as number | null, error: idb === "có" ? "" : "không có" };
  try {
    const raw = await readMirror();
    indexed = { count: countRaw(raw), error: raw === null && idb === "không" ? "không có" : "" };
    if (indexed.count === null) indexed.error = "không đọc được";
  } catch {
    indexed = { count: null, error: "lỗi đọc" };
  }
  histLog(`đọc kho memory=${countRaw(memoryBook) ?? "lỗi"} local=${snapStore(hostStorage("localStorage")).count ?? "lỗi"} session=${snapStore(hostStorage("sessionStorage")).count ?? "lỗi"} indexedDB=${indexed.count ?? indexed.error}`);
  return {
    idb,
    memory: countRaw(memoryBook),
    local: snapStore(hostStorage("localStorage")),
    session: snapStore(hostStorage("sessionStorage")),
    indexed,
    lastWrite: { ...lastWrite },
    lastSeal: lastSeal ? { ...lastSeal } : null,
    lines: [...historyLines],
  };
}
