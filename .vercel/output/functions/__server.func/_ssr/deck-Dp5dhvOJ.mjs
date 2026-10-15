import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as tr, w as useLang, x as CopyText } from "./router-D9l-mBhf.mjs";
import { C as spellCard, _ as monsterCard, i as MONSTERS, n as DEFAULT_DECK, r as FORMS, s as SPELLS, t as DECK_NOTES } from "./catalog-DOYBjZ9O.mjs";
import { t as CardFace } from "./card-face-C68Pz_14.mjs";
import { a as saveDeck, i as raiseDefaultDeck, n as deckIssues, r as loadDeck, t as deckBalance } from "./deck-DAKxYBzq.mjs";
import { n as loadStrategies, t as deckTactics } from "./strategies-CpEOr7ax.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/deck-Dp5dhvOJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "clash-deck-book";
var DB = "clash-deck-files";
var STORE = "handles";
var HANDLE = "book";
function ids(list, ok) {
	if (!Array.isArray(list)) return [];
	const next = [];
	for (const id of list) {
		if (typeof id !== "string" || !ok(id) || next.includes(id)) continue;
		next.push(id);
	}
	return next;
}
function entry(raw, used) {
	if (!raw || typeof raw !== "object") return null;
	const row = raw;
	const n = Number(row.n);
	if (!Number.isInteger(n) || n < 1 || used.has(n)) return null;
	used.add(n);
	return {
		n,
		name: typeof row.name === "string" ? row.name.slice(0, 40) : `Bộ ${n}`,
		monsters: ids(row.monsters, (id) => Boolean(monsterCard(id))),
		spells: ids(row.spells, (id) => Boolean(spellCard(id)))
	};
}
function parseBook(raw) {
	try {
		const data = JSON.parse(raw);
		const used = /* @__PURE__ */ new Set();
		const decks = (Array.isArray(data.decks) ? data.decks : []).map((row) => entry(row, used)).filter((row) => Boolean(row)).sort((a, b) => a.n - b.n);
		if (decks.length === 0) return null;
		return {
			decks,
			active: decks[0].n
		};
	} catch {
		return null;
	}
}
function seed() {
	return {
		decks: [{
			n: 1,
			name: "Lv 1 Meta deck",
			monsters: [...DEFAULT_DECK.monsters],
			spells: [...DEFAULT_DECK.spells]
		}],
		active: 1
	};
}
function loadBook() {
	if (typeof localStorage === "undefined") return seed();
	raiseDefaultDeck();
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return seed();
		const book = parseBook(raw);
		if (!book) return seed();
		const data = JSON.parse(raw);
		const active = Number(data.active);
		return {
			decks: book.decks,
			active: book.decks.some((row) => row.n === active) ? active : book.decks[0].n
		};
	} catch {
		return seed();
	}
}
function saveBook(book) {
	localStorage.setItem(KEY, JSON.stringify({
		active: book.active,
		decks: book.decks
	}));
}
function freshDeck(decks) {
	const n = decks.reduce((max, row) => Math.max(max, row.n), 0) + 1;
	return {
		n,
		name: `Bộ ${n}`,
		monsters: [],
		spells: []
	};
}
function cardsOf(entry) {
	return {
		monsters: [...entry.monsters],
		spells: [...entry.spells]
	};
}
function fileTypes() {
	return {
		suggestedName: "bo-bai.json",
		types: [{
			description: "Bộ bài",
			accept: { "application/json": [".json"] }
		}]
	};
}
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function remembered() {
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readonly").objectStore(STORE).get(HANDLE);
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => reject(req.error);
		});
	} catch {
		return null;
	}
}
async function remember(handle) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(handle, HANDLE);
		req.onsuccess = () => resolve();
		req.onerror = () => reject(req.error);
	});
}
async function canWrite(handle) {
	try {
		if (!handle.queryPermission && !handle.requestPermission) return true;
		if (await handle.queryPermission?.({ mode: "readwrite" }) === "granted") return true;
		return await handle.requestPermission?.({ mode: "readwrite" }) === "granted";
	} catch {
		return false;
	}
}
async function writeHandle(handle, book) {
	const writable = await handle.createWritable();
	await writable.write(JSON.stringify({ decks: book.decks }, null, 2));
	await writable.close();
}
function downloadBook(book) {
	const blob = new Blob([JSON.stringify({ decks: book.decks }, null, 2)], { type: "application/json" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "bo-bai.json";
	link.click();
	URL.revokeObjectURL(link.href);
}
async function saveBookFile(book) {
	const existing = await remembered();
	if (existing && await canWrite(existing)) try {
		await writeHandle(existing, book);
		return "saved";
	} catch {}
	const picker = window.showSaveFilePicker;
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
function readLocal() {
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
			file.text().then(resolve);
		};
		input.click();
	});
}
async function openBookFile() {
	const picker = window.showOpenFilePicker;
	try {
		if (!picker) {
			const text = await readLocal();
			if (text == null) return null;
			return parseBook(text) ?? "bad";
		}
		const [handle] = await picker(fileTypes());
		const book = parseBook(await (await handle.getFile()).text());
		if (!book) return "bad";
		if (await canWrite(handle)) await remember(handle);
		return book;
	} catch {
		return null;
	}
}
/** Ngày thêm lá và ngày cập nhật. File này tự ghi lại khi lá trong catalog đổi. */
var CARD_CLOCK = {
	"phu-thuy-thoi-gian": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 1,
		"def": 1,
		"mdef": 2,
		"hp": 1,
		"text": "c14e9894",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"rong-phun-hoa-cau": {
		"kind": "monster",
		"stars": 2,
		"mana": 0,
		"atk": 4,
		"def": 1,
		"mdef": 2,
		"hp": 5,
		"text": "ba7db9f5",
		"added": null,
		"powerAt": "2026-10-09",
		"powerTone": "up",
		"shiftAt": null
	},
	"chien-si-gam-nham": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 3,
		"def": 1,
		"mdef": 1,
		"hp": 5,
		"text": "c33c269c",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"kiem-si-lua-thieng": {
		"kind": "monster",
		"stars": 3,
		"mana": 0,
		"atk": 3,
		"def": 0,
		"mdef": 2,
		"hp": 7,
		"text": "cee9962",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": "2026-10-14"
	},
	"dau-si-bo-tot": {
		"kind": "monster",
		"stars": 3,
		"mana": 1,
		"atk": 5,
		"def": 1,
		"mdef": 2,
		"hp": 6,
		"text": "6fe50892",
		"added": null,
		"powerAt": "2026-10-08",
		"powerTone": "down",
		"shiftAt": null
	},
	"trieu-hoi-ac-ma": {
		"kind": "monster",
		"stars": 4,
		"mana": 0,
		"atk": 6,
		"def": 0,
		"mdef": 2,
		"hp": 5,
		"text": "c56d511e",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ky-si-bong-toi": {
		"kind": "monster",
		"stars": 4,
		"mana": 1,
		"atk": 4,
		"def": 1,
		"mdef": 1,
		"hp": 7,
		"text": "b75d3ea9",
		"added": null,
		"powerAt": "2026-10-08",
		"powerTone": "down",
		"shiftAt": null
	},
	"yeu-tinh-chuc-phuc": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 0,
		"def": 1,
		"mdef": 1,
		"hp": 3,
		"text": "ec074266",
		"added": null,
		"powerAt": "2026-10-10",
		"powerTone": "down",
		"shiftAt": null
	},
	"mo-voi-ma-mut": {
		"kind": "monster",
		"stars": 2,
		"mana": 0,
		"atk": 3,
		"def": 3,
		"mdef": 4,
		"hp": 2,
		"text": "321c7137",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ong-khong-lo": {
		"kind": "monster",
		"stars": 2,
		"mana": 0,
		"atk": 6,
		"def": 0,
		"mdef": 0,
		"hp": 3,
		"text": "e182f2c2",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"linh-chien-da-khong-lo": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 1,
		"def": 2,
		"mdef": 2,
		"hp": 8,
		"text": "f30fd9a6",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"khung-long-vay-kiem": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 1,
		"def": 3,
		"mdef": 0,
		"hp": 5,
		"text": "c80492",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"rong-boc-trung": {
		"kind": "monster",
		"stars": 3,
		"mana": 1,
		"atk": 0,
		"def": 1,
		"mdef": 0,
		"hp": 8,
		"text": "cdfc02e4",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ga-he-dang-so": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 2,
		"hp": 5,
		"text": "313e8a96",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"tho-den-tinh-nghich": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 4,
		"def": 0,
		"mdef": 0,
		"hp": 2,
		"text": "5a994f2f",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"cuc-bong-ma-quai": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 1,
		"text": "7fad80bf",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"quai-thu-thien-su": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 6,
		"text": "899b9a3a",
		"added": "2026-10-05",
		"powerAt": "2026-10-14",
		"powerTone": "up",
		"shiftAt": "2026-10-09"
	},
	"te-giac-be-con": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 3,
		"text": "5526a243",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"phu-thuy-ti-hon": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 1,
		"def": 0,
		"mdef": 2,
		"hp": 3,
		"text": "920c7311",
		"added": null,
		"powerAt": "2026-10-14",
		"powerTone": "down",
		"shiftAt": null
	},
	"sau-non": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 1,
		"def": 0,
		"mdef": 0,
		"hp": 2,
		"text": "84193083",
		"added": null,
		"powerAt": "2026-10-09",
		"powerTone": "down",
		"shiftAt": null
	},
	"trai-tim-hai-long": {
		"kind": "monster",
		"stars": 3,
		"mana": 0,
		"atk": 4,
		"def": 1,
		"mdef": 1,
		"hp": 6,
		"text": "1e2aac30",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"sua-hut-ma-phap": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 1,
		"def": 0,
		"mdef": 4,
		"hp": 5,
		"text": "fdc82127",
		"added": null,
		"powerAt": "2026-10-08",
		"powerTone": "down",
		"shiftAt": null
	},
	"con-thinh-no-cua-hai-vuong": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 1,
		"def": 0,
		"mdef": 0,
		"hp": 2,
		"text": "8b20dfec",
		"added": null,
		"powerAt": "2026-10-14",
		"powerTone": "up",
		"shiftAt": null
	},
	"chien-binh-lan-khuat": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 4,
		"def": 0,
		"mdef": 0,
		"hp": 1,
		"text": "2867439c",
		"added": "2026-10-13",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ke-san-moi-tu-than": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 3,
		"def": 0,
		"mdef": 0,
		"hp": 1,
		"text": "45866c5f",
		"added": "2026-10-13",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"sat-nhan-bat-giu": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 3,
		"def": 0,
		"mdef": 0,
		"hp": 2,
		"text": "94c00f29",
		"added": "2026-10-13",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"kraken": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 3,
		"def": 3,
		"mdef": 0,
		"hp": 4,
		"text": "845492e2",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"kazura": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 6,
		"def": 1,
		"mdef": 0,
		"hp": 3,
		"text": "142b3178",
		"added": null,
		"powerAt": "2026-10-08",
		"powerTone": "down",
		"shiftAt": null
	},
	"kizuran": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 3,
		"def": 0,
		"mdef": 0,
		"hp": 8,
		"text": "ad0905df",
		"added": null,
		"powerAt": "2026-10-14",
		"powerTone": "up",
		"shiftAt": null
	},
	"ke-giam-ho-linh-hon": {
		"kind": "monster",
		"stars": 2,
		"mana": 2,
		"atk": 2,
		"def": 1,
		"mdef": 0,
		"hp": 4,
		"text": "770b83a1",
		"added": null,
		"powerAt": "2026-10-15",
		"powerTone": "up",
		"shiftAt": "2026-10-15"
	},
	"mat-xanh-huy-diet": {
		"kind": "monster",
		"stars": 4,
		"mana": 2,
		"atk": 6,
		"def": 4,
		"mdef": 4,
		"hp": 6,
		"text": "c3ef89f7",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": "2026-10-12"
	},
	"mat-do-tan-pha": {
		"kind": "monster",
		"stars": 4,
		"mana": 0,
		"atk": 6,
		"def": 2,
		"mdef": 2,
		"hp": 7,
		"text": "4d977da",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"hoa-an-thit-nguoi": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 0,
		"def": 3,
		"mdef": 0,
		"hp": 3,
		"text": "6fd53fa3",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"thuong-quan-long": {
		"kind": "monster",
		"stars": 4,
		"mana": 1,
		"atk": 6,
		"def": 1,
		"mdef": 3,
		"hp": 5,
		"text": "433bd43f",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"may-nem-bom-hinh-nhen": {
		"kind": "monster",
		"stars": 3,
		"mana": 0,
		"atk": 5,
		"def": 1,
		"mdef": 3,
		"hp": 5,
		"text": "23c555c6",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"khong-lo-mot-mat": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 3,
		"def": 3,
		"mdef": 0,
		"hp": 1,
		"text": "639f7d00",
		"added": "2026-10-05",
		"powerAt": "2026-10-14",
		"powerTone": "down",
		"shiftAt": "2026-10-08"
	},
	"may-quay-thuong": {
		"kind": "monster",
		"stars": 4,
		"mana": 0,
		"atk": 4,
		"def": 2,
		"mdef": 2,
		"hp": 7,
		"text": "68f78d6f",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"rong-con": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 2,
		"hp": 2,
		"text": "e0428404",
		"added": null,
		"powerAt": "2026-10-09",
		"powerTone": "down",
		"shiftAt": null
	},
	"chien-binh-rong": {
		"kind": "monster",
		"stars": 3,
		"mana": 2,
		"atk": 4,
		"def": 1,
		"mdef": 1,
		"hp": 4,
		"text": "44142109",
		"added": "2026-10-05",
		"powerAt": "2026-10-14",
		"powerTone": "down",
		"shiftAt": "2026-10-10"
	},
	"may-chem": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 4,
		"def": 0,
		"mdef": 4,
		"hp": 3,
		"text": "811c9dc5",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ma-dao-si": {
		"kind": "monster",
		"stars": 3,
		"mana": 0,
		"atk": 2,
		"def": 3,
		"mdef": 1,
		"hp": 5,
		"text": "2abfe135",
		"added": null,
		"powerAt": "2026-10-14",
		"powerTone": "down",
		"shiftAt": null
	},
	"loi-nguyen-cua-rong": {
		"kind": "monster",
		"stars": 3,
		"mana": 0,
		"atk": 4,
		"def": 1,
		"mdef": 3,
		"hp": 4,
		"text": "ed3a294c",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"thien-than-be-nho": {
		"kind": "monster",
		"stars": 1,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 1,
		"text": "3dec5047",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"hiep-si-cua-vua": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 2,
		"def": 3,
		"mdef": 0,
		"hp": 3,
		"text": "106a33ec",
		"added": "2026-10-11",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": "2026-10-14"
	},
	"hiep-si-ho-ve": {
		"kind": "monster",
		"stars": 3,
		"mana": 1,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 2,
		"text": "8aa7ff44",
		"added": "2026-10-11",
		"powerAt": "2026-10-14",
		"powerTone": "up",
		"shiftAt": "2026-10-12"
	},
	"hiep-si-cua-hau": {
		"kind": "monster",
		"stars": 2,
		"mana": 1,
		"atk": 1,
		"def": 0,
		"mdef": 3,
		"hp": 3,
		"text": "dc9c0f31",
		"added": "2026-10-11",
		"powerAt": "2026-10-12",
		"powerTone": "up",
		"shiftAt": "2026-10-14"
	},
	"my-dieu-nhan": {
		"kind": "monster",
		"stars": 2,
		"mana": 0,
		"atk": 3,
		"def": 1,
		"mdef": 1,
		"hp": 4,
		"text": "23c6388",
		"added": "2026-10-05",
		"powerAt": "2026-10-11",
		"powerTone": "up",
		"shiftAt": null
	},
	"the-than-cua-shien": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 3,
		"def": 0,
		"mdef": 0,
		"hp": 2,
		"text": "eb4be4c0",
		"added": "2026-10-14",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"phu-thuy-rung-den": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 3,
		"hp": 4,
		"text": "640758a0",
		"added": "2026-10-14",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"hiep-si-huyen-bi": {
		"kind": "monster",
		"stars": 5,
		"mana": 0,
		"atk": 2,
		"def": 3,
		"mdef": 3,
		"hp": 3,
		"text": "72d4ed87",
		"added": "2026-10-11",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ky-si-cuoi-rong": {
		"kind": "monster",
		"stars": 5,
		"mana": 0,
		"atk": 6,
		"def": 3,
		"mdef": 3,
		"hp": 8,
		"text": "aa3b4190",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"rong-ac-ma": {
		"kind": "monster",
		"stars": 5,
		"mana": 0,
		"atk": 8,
		"def": 2,
		"mdef": 2,
		"hp": 12,
		"text": "3fece12e",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"nu-chua-dieu-nhan": {
		"kind": "monster",
		"stars": 4,
		"mana": 0,
		"atk": 6,
		"def": 3,
		"mdef": 1,
		"hp": 6,
		"text": "db46e29e",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"nu-chua-dieu-nhan-hoan-my": {
		"kind": "monster",
		"stars": 5,
		"mana": 0,
		"atk": 6,
		"def": 3,
		"mdef": 3,
		"hp": 8,
		"text": "7c21158a",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"rong-ngan-tuoi": {
		"kind": "monster",
		"stars": 4,
		"mana": 0,
		"atk": 7,
		"def": 2,
		"mdef": 3,
		"hp": 9,
		"text": "ab2ba96c",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"chien-binh-huyen-thoai": {
		"kind": "monster",
		"stars": 5,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 5,
		"text": "50ee23db",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ken-ngai": {
		"kind": "monster",
		"stars": 1,
		"mana": 0,
		"atk": 0,
		"def": 3,
		"mdef": 1,
		"hp": 4,
		"text": "811c9dc5",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"chan-ken": {
		"kind": "monster",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 3,
		"mdef": 1,
		"hp": 2,
		"text": "164dd62f",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ngai-khong-lo": {
		"kind": "monster",
		"stars": 3,
		"mana": 0,
		"atk": 3,
		"def": 1,
		"mdef": 0,
		"hp": 6,
		"text": "16442b9a",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ngai-nu-hoang": {
		"kind": "monster",
		"stars": 4,
		"mana": 0,
		"atk": 4,
		"def": 2,
		"mdef": 1,
		"hp": 7,
		"text": "d0d0af5b",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ngai-hoan-my": {
		"kind": "monster",
		"stars": 5,
		"mana": 0,
		"atk": 6,
		"def": 4,
		"mdef": 3,
		"hp": 8,
		"text": "abe70a2f",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"te-giac-hieu-thang": {
		"kind": "monster",
		"stars": 2,
		"mana": 0,
		"atk": 3,
		"def": 1,
		"mdef": 1,
		"hp": 4,
		"text": "f0084053",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"te-giac-chien-binh": {
		"kind": "monster",
		"stars": 3,
		"mana": 0,
		"atk": 5,
		"def": 2,
		"mdef": 2,
		"hp": 5,
		"text": "74cd52e4",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"sam-set-tan-the": {
		"kind": "spell",
		"stars": 0,
		"mana": 3,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "dfa879c3",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"guong-phong-ho": {
		"kind": "spell",
		"stars": 0,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "2f1becde",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"la-chan-phan-don": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "32357959",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"soi-xich-dia-nguc": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "8ef15bed",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"vong-nguyen-rua-ac-ma": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "4a98557a",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"sung-loi-pha": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "f17a3ee0",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"hap-thu-ma-phap": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "26944181",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"phan-nguyen": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "2f7a256",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"phuc-kich": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "2ae4ee0b",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"mua-ma-thuat": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "5f5eda3",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"hoan-doi": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "42f9a5c1",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"vong-xoay-bao-ho": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "d5dd5c41",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ngan-chan-phong-ngu": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "a9bb59c",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"thanh-guom-anh-sang": {
		"kind": "spell",
		"stars": 0,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "21d9d58d",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"thu-hoi-quai-thu": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "f0c5f9d1",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"bien-sau": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "6f2c39f4",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"virus-an-mon": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "13aabd22",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"ke-dao-mo": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "f18a82ec",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"co-may-thoi-gian": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "393e9172",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"giap-co-khi": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "61454bbe",
		"added": "2026-10-05",
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	},
	"mu-ma-phap": {
		"kind": "spell",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0,
		"text": "680c8c82",
		"added": null,
		"powerAt": null,
		"powerTone": null,
		"shiftAt": null
	}
};
/** Chỉ số trong code lúc bắt đầu ghi, ngày 2026-10-08. Không sửa tay. Lịch sử nằm ở BALANCE_LOG. */
var BALANCE_BASE = {
	"phu-thuy-thoi-gian": {
		"kind": "monster",
		"name": "Phù thuỷ thời gian",
		"stars": 1,
		"mana": 1,
		"atk": 1,
		"def": 1,
		"mdef": 2,
		"hp": 1
	},
	"rong-phun-hoa-cau": {
		"kind": "monster",
		"name": "Rồng phun hoả cầu",
		"stars": 2,
		"mana": 0,
		"atk": 4,
		"def": 1,
		"mdef": 2,
		"hp": 4
	},
	"chien-si-gam-nham": {
		"kind": "monster",
		"name": "Chiến sĩ gặm nhắm",
		"stars": 2,
		"mana": 1,
		"atk": 3,
		"def": 1,
		"mdef": 1,
		"hp": 5
	},
	"kiem-si-lua-thieng": {
		"kind": "monster",
		"name": "Kiếm sĩ lửa thiêng",
		"stars": 3,
		"mana": 0,
		"atk": 3,
		"def": 0,
		"mdef": 2,
		"hp": 7
	},
	"dau-si-bo-tot": {
		"kind": "monster",
		"name": "Đấu sĩ bò tót",
		"stars": 3,
		"mana": 0,
		"atk": 5,
		"def": 1,
		"mdef": 2,
		"hp": 6
	},
	"trieu-hoi-ac-ma": {
		"kind": "monster",
		"name": "Triệu hồi ác ma",
		"stars": 4,
		"mana": 0,
		"atk": 6,
		"def": 0,
		"mdef": 2,
		"hp": 5
	},
	"ky-si-bong-toi": {
		"kind": "monster",
		"name": "Kỵ sĩ bóng tối",
		"stars": 4,
		"mana": 0,
		"atk": 4,
		"def": 1,
		"mdef": 1,
		"hp": 7
	},
	"yeu-tinh-chuc-phuc": {
		"kind": "monster",
		"name": "Yêu tinh chúc phúc",
		"stars": 2,
		"mana": 1,
		"atk": 0,
		"def": 2,
		"mdef": 3,
		"hp": 3
	},
	"mo-voi-ma-mut": {
		"kind": "monster",
		"name": "Mộ voi ma mút",
		"stars": 2,
		"mana": 0,
		"atk": 3,
		"def": 3,
		"mdef": 4,
		"hp": 2
	},
	"ong-khong-lo": {
		"kind": "monster",
		"name": "Ong khổng lồ",
		"stars": 2,
		"mana": 0,
		"atk": 6,
		"def": 0,
		"mdef": 0,
		"hp": 3
	},
	"linh-chien-da-khong-lo": {
		"kind": "monster",
		"name": "Lính chiến đá khổng lồ",
		"stars": 2,
		"mana": 1,
		"atk": 1,
		"def": 2,
		"mdef": 2,
		"hp": 8
	},
	"khung-long-vay-kiem": {
		"kind": "monster",
		"name": "Khủng long vãy kiếm",
		"stars": 2,
		"mana": 1,
		"atk": 1,
		"def": 3,
		"mdef": 0,
		"hp": 5
	},
	"rong-boc-trung": {
		"kind": "monster",
		"name": "Rồng bọc trứng",
		"stars": 3,
		"mana": 1,
		"atk": 0,
		"def": 1,
		"mdef": 0,
		"hp": 8
	},
	"ga-he-dang-so": {
		"kind": "monster",
		"name": "Gã hề đáng sợ",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 2,
		"hp": 5
	},
	"tho-den-tinh-nghich": {
		"kind": "monster",
		"name": "Thỏ đen tinh nghịch",
		"stars": 1,
		"mana": 1,
		"atk": 4,
		"def": 0,
		"mdef": 0,
		"hp": 2
	},
	"cuc-bong-ma-quai": {
		"kind": "monster",
		"name": "Cục bông ma quái",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 1
	},
	"quai-thu-thien-su": {
		"kind": "monster",
		"name": "Quái thú thiên sứ",
		"stars": 1,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 4
	},
	"te-giac-be-con": {
		"kind": "monster",
		"name": "Tê giác bé con",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 3
	},
	"phu-thuy-ti-hon": {
		"kind": "monster",
		"name": "Phù thuỷ tí hơn",
		"stars": 1,
		"mana": 0,
		"atk": 1,
		"def": 0,
		"mdef": 2,
		"hp": 4
	},
	"sau-non": {
		"kind": "monster",
		"name": "Sâu non",
		"stars": 1,
		"mana": 0,
		"atk": 1,
		"def": 0,
		"mdef": 0,
		"hp": 2
	},
	"trai-tim-hai-long": {
		"kind": "monster",
		"name": "Trái tim hải long",
		"stars": 3,
		"mana": 0,
		"atk": 4,
		"def": 1,
		"mdef": 1,
		"hp": 6
	},
	"sua-hut-ma-phap": {
		"kind": "monster",
		"name": "Sứa hút ma pháp",
		"stars": 2,
		"mana": 0,
		"atk": 1,
		"def": 0,
		"mdef": 4,
		"hp": 5
	},
	"kraken": {
		"kind": "monster",
		"name": "Kraken",
		"stars": 2,
		"mana": 1,
		"atk": 3,
		"def": 3,
		"mdef": 0,
		"hp": 4
	},
	"kazura": {
		"kind": "monster",
		"name": "Kazura",
		"stars": 2,
		"mana": 0,
		"atk": 6,
		"def": 1,
		"mdef": 0,
		"hp": 3
	},
	"kizuran": {
		"kind": "monster",
		"name": "Kizuran",
		"stars": 2,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 8
	},
	"ke-giam-ho-linh-hon": {
		"kind": "monster",
		"name": "Kẻ giám hộ linh hồn",
		"stars": 2,
		"mana": 2,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 4
	},
	"mat-xanh-huy-diet": {
		"kind": "monster",
		"name": "Mắt xanh huỷ diệt",
		"stars": 4,
		"mana": 2,
		"atk": 8,
		"def": 4,
		"mdef": 4,
		"hp": 5
	},
	"mat-do-tan-pha": {
		"kind": "monster",
		"name": "Mắt đỏ tàn phá",
		"stars": 4,
		"mana": 0,
		"atk": 6,
		"def": 2,
		"mdef": 2,
		"hp": 7
	},
	"hoa-an-thit-nguoi": {
		"kind": "monster",
		"name": "Hoa ăn thịt người",
		"stars": 1,
		"mana": 1,
		"atk": 0,
		"def": 3,
		"mdef": 0,
		"hp": 3
	},
	"thuong-quan-long": {
		"kind": "monster",
		"name": "Thương quản long",
		"stars": 4,
		"mana": 1,
		"atk": 6,
		"def": 1,
		"mdef": 3,
		"hp": 5
	},
	"may-nem-bom-hinh-nhen": {
		"kind": "monster",
		"name": "Máy ném bom hình nhện",
		"stars": 3,
		"mana": 0,
		"atk": 5,
		"def": 1,
		"mdef": 3,
		"hp": 5
	},
	"khong-lo-mot-mat": {
		"kind": "monster",
		"name": "Khổng lồ 1 mắt",
		"stars": 1,
		"mana": 1,
		"atk": 3,
		"def": 4,
		"mdef": 0,
		"hp": 1
	},
	"may-quay-thuong": {
		"kind": "monster",
		"name": "Máy quay thưởng",
		"stars": 4,
		"mana": 0,
		"atk": 4,
		"def": 2,
		"mdef": 2,
		"hp": 7
	},
	"rong-con": {
		"kind": "monster",
		"name": "Rồng con",
		"stars": 1,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 2,
		"hp": 2
	},
	"chien-binh-rong": {
		"kind": "monster",
		"name": "Chiến binh rồng",
		"stars": 3,
		"mana": 0,
		"atk": 5,
		"def": 2,
		"mdef": 2,
		"hp": 6
	},
	"may-chem": {
		"kind": "monster",
		"name": "Máy chém",
		"stars": 1,
		"mana": 1,
		"atk": 4,
		"def": 0,
		"mdef": 4,
		"hp": 3
	},
	"ma-dao-si": {
		"kind": "monster",
		"name": "Ma đạo sĩ",
		"stars": 3,
		"mana": 0,
		"atk": 2,
		"def": 3,
		"mdef": 1,
		"hp": 5
	},
	"loi-nguyen-cua-rong": {
		"kind": "monster",
		"name": "Lời nguyền của rồng",
		"stars": 3,
		"mana": 0,
		"atk": 4,
		"def": 1,
		"mdef": 3,
		"hp": 4
	},
	"thien-than-be-nho": {
		"kind": "monster",
		"name": "Thiên thần bé nhỏ",
		"stars": 1,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 1
	},
	"my-dieu-nhan": {
		"kind": "monster",
		"name": "Mỹ điểu nhân",
		"stars": 2,
		"mana": 0,
		"atk": 3,
		"def": 1,
		"mdef": 1,
		"hp": 4
	},
	"ky-si-cuoi-rong": {
		"kind": "monster",
		"name": "Kỵ sĩ cưỡi rồng",
		"stars": 5,
		"mana": 0,
		"atk": 6,
		"def": 3,
		"mdef": 3,
		"hp": 8
	},
	"rong-ac-ma": {
		"kind": "monster",
		"name": "Rồng ác ma",
		"stars": 5,
		"mana": 0,
		"atk": 8,
		"def": 2,
		"mdef": 2,
		"hp": 12
	},
	"nu-chua-dieu-nhan": {
		"kind": "monster",
		"name": "Nữ chúa điểu nhân",
		"stars": 4,
		"mana": 0,
		"atk": 6,
		"def": 3,
		"mdef": 1,
		"hp": 6
	},
	"nu-chua-dieu-nhan-hoan-my": {
		"kind": "monster",
		"name": "Nữ chúa điểu nhân hoàn mỹ",
		"stars": 5,
		"mana": 0,
		"atk": 6,
		"def": 3,
		"mdef": 3,
		"hp": 8
	},
	"rong-ngan-tuoi": {
		"kind": "monster",
		"name": "Rồng ngàn tuổi",
		"stars": 4,
		"mana": 0,
		"atk": 7,
		"def": 2,
		"mdef": 3,
		"hp": 9
	},
	"chien-binh-huyen-thoai": {
		"kind": "monster",
		"name": "Chiến binh huyền thoại",
		"stars": 5,
		"mana": 0,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 5
	},
	"ken-ngai": {
		"kind": "monster",
		"name": "Kén ngài",
		"stars": 1,
		"mana": 0,
		"atk": 0,
		"def": 3,
		"mdef": 1,
		"hp": 4
	},
	"chan-ken": {
		"kind": "monster",
		"name": "Chân kén",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 3,
		"mdef": 1,
		"hp": 2
	},
	"ngai-khong-lo": {
		"kind": "monster",
		"name": "Ngài Khổng lồ",
		"stars": 3,
		"mana": 0,
		"atk": 3,
		"def": 1,
		"mdef": 0,
		"hp": 6
	},
	"ngai-nu-hoang": {
		"kind": "monster",
		"name": "Ngài Nữ hoàng",
		"stars": 4,
		"mana": 0,
		"atk": 4,
		"def": 2,
		"mdef": 1,
		"hp": 7
	},
	"ngai-hoan-my": {
		"kind": "monster",
		"name": "Ngài tối thượng",
		"stars": 5,
		"mana": 0,
		"atk": 6,
		"def": 4,
		"mdef": 3,
		"hp": 8
	},
	"te-giac-hieu-thang": {
		"kind": "monster",
		"name": "Tê giác hiếu thắng",
		"stars": 2,
		"mana": 0,
		"atk": 3,
		"def": 1,
		"mdef": 1,
		"hp": 4
	},
	"te-giac-chien-binh": {
		"kind": "monster",
		"name": "Chiến binh tê giác",
		"stars": 3,
		"mana": 0,
		"atk": 5,
		"def": 2,
		"mdef": 2,
		"hp": 5
	},
	"sam-set-tan-the": {
		"kind": "spell",
		"name": "Sấm sét tận thế",
		"stars": 0,
		"mana": 3,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"guong-phong-ho": {
		"kind": "spell",
		"name": "Gương phòng hộ",
		"stars": 0,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"la-chan-phan-don": {
		"kind": "spell",
		"name": "Lá chắn phản đòn",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"soi-xich-dia-nguc": {
		"kind": "spell",
		"name": "Sợi xích địa ngục",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"vong-nguyen-rua-ac-ma": {
		"kind": "spell",
		"name": "Vòng nguyền rủa ác ma",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"sung-loi-pha": {
		"kind": "spell",
		"name": "Sừng lôi phá",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"hap-thu-ma-phap": {
		"kind": "spell",
		"name": "Hấp thụ ma pháp",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"phan-nguyen": {
		"kind": "spell",
		"name": "Phản nguyền",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"phuc-kich": {
		"kind": "spell",
		"name": "Phục kích",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"mua-ma-thuat": {
		"kind": "spell",
		"name": "Mưa ma thuật",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"hoan-doi": {
		"kind": "spell",
		"name": "Hoán đổi",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"vong-xoay-bao-ho": {
		"kind": "spell",
		"name": "Vòng xoáy bảo hộ",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"ngan-chan-phong-ngu": {
		"kind": "spell",
		"name": "Ngăn chặn phòng ngự",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"thanh-guom-anh-sang": {
		"kind": "spell",
		"name": "Thanh gươm ánh sáng",
		"stars": 0,
		"mana": 1,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"thu-hoi-quai-thu": {
		"kind": "spell",
		"name": "Thu hồi quái thú",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"bien-sau": {
		"kind": "spell",
		"name": "Biển sâu",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"virus-an-mon": {
		"kind": "spell",
		"name": "Virus ăn mòn",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"ke-dao-mo": {
		"kind": "spell",
		"name": "Kẻ đào mộ",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"co-may-thoi-gian": {
		"kind": "spell",
		"name": "Cỗ máy thời gian",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"giap-co-khi": {
		"kind": "spell",
		"name": "Giáp cơ khí",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"mu-ma-phap": {
		"kind": "spell",
		"name": "Mũ ma pháp",
		"stars": 0,
		"mana": 0,
		"atk": 0,
		"def": 0,
		"mdef": 0,
		"hp": 0
	},
	"hiep-si-ho-ve": {
		"kind": "monster",
		"name": "Hiệp sĩ hộ vệ",
		"stars": 2,
		"mana": 1,
		"atk": 2,
		"def": 0,
		"mdef": 0,
		"hp": 2
	},
	"hiep-si-cua-hau": {
		"kind": "monster",
		"name": "Hiệp sĩ của hậu",
		"stars": 2,
		"mana": 1,
		"atk": 1,
		"def": 0,
		"mdef": 3,
		"hp": 2
	}
};
/**
* Cũ ở trên, mới ở dưới. Không sửa BALANCE_BASE.
* Sửa chỉ số trong code thì thêm một mục vào cuối: ngày, id, từ và tới.
* Cùng một lần sửa thì cùng wave. Wave lớn hơn là đợt mới hơn.
* Tăng chỉ số, tăng sát thương, giảm mana hoặc giảm sao là Tăng. Ngược lại là Giảm.
* Cùng lúc có cả hai hướng thì là Thay đổi lối chơi.
* Đổi skill của quái hoặc phép cũ thì hỏi trước, rồi mới ghi tone và notes.
* Quên ghi thì phần lệch so với lần cuối vẫn tự hiện thành một lần mới.
*/
var BALANCE_LOG = [
	{
		id: "khong-lo-mot-mat",
		at: "2026-10-08",
		wave: 1,
		tone: "shift",
		stats: { mana: {
			from: 1,
			to: 0
		} },
		notes: ["Thêm kỹ năng Đập phá"]
	},
	{
		id: "yeu-tinh-chuc-phuc",
		at: "2026-10-08",
		wave: 2,
		stats: { mana: {
			from: 1,
			to: 2
		} }
	},
	{
		id: "kazura",
		at: "2026-10-08",
		wave: 3,
		stats: { mana: {
			from: 0,
			to: 1
		} }
	},
	{
		id: "kizuran",
		at: "2026-10-08",
		wave: 3,
		stats: { mana: {
			from: 0,
			to: 1
		} }
	},
	{
		id: "dau-si-bo-tot",
		at: "2026-10-08",
		wave: 3,
		stats: { mana: {
			from: 0,
			to: 1
		} }
	},
	{
		id: "sua-hut-ma-phap",
		at: "2026-10-08",
		wave: 3,
		stats: { mana: {
			from: 0,
			to: 1
		} }
	},
	{
		id: "ky-si-bong-toi",
		at: "2026-10-08",
		wave: 3,
		stats: { mana: {
			from: 0,
			to: 1
		} }
	},
	{
		id: "chien-binh-rong",
		at: "2026-10-08",
		wave: 3,
		stats: { mana: {
			from: 0,
			to: 2
		} }
	},
	{
		id: "kizuran",
		at: "2026-10-09",
		wave: 4,
		stats: { mana: {
			from: 1,
			to: 2
		} }
	},
	{
		id: "quai-thu-thien-su",
		at: "2026-10-09",
		wave: 5,
		tone: "shift",
		stats: { mana: {
			from: 1,
			to: 0
		} },
		notes: ["Thêm kỹ năng Cầu nguyện"]
	},
	{
		id: "rong-con",
		at: "2026-10-09",
		wave: 6,
		tone: "down",
		notes: ["Sát thương phép của Hơi thở rồng giảm xuống 1 (2)", "Hơi thở rồng đánh được vào người chơi"]
	},
	{
		id: "rong-phun-hoa-cau",
		at: "2026-10-09",
		wave: 7,
		stats: { hp: {
			from: 4,
			to: 5
		} }
	},
	{
		id: "quai-thu-thien-su",
		at: "2026-10-09",
		wave: 8,
		tone: "shift",
		stats: {
			mana: {
				from: 0,
				to: 2
			},
			hp: {
				from: 4,
				to: 6
			}
		}
	},
	{
		id: "yeu-tinh-chuc-phuc",
		at: "2026-10-09",
		wave: 9,
		tone: "down",
		notes: ["Hỗ công tốn 1 mana. Đòn kế tiếp tăng 3 công, 1 thủ và 3 sát thương phép", "Hộ thủ tốn 1 mana"]
	},
	{
		id: "yeu-tinh-chuc-phuc",
		at: "2026-10-09",
		wave: 10,
		tone: "down",
		stats: {
			def: {
				from: 2,
				to: 1
			},
			mdef: {
				from: 3,
				to: 1
			}
		}
	},
	{
		id: "sau-non",
		at: "2026-10-09",
		wave: 11,
		tone: "down",
		notes: ["Hoá kén chỉ tạo được 1 chân kén"]
	},
	{
		id: "chien-binh-rong",
		at: "2026-10-09",
		wave: 12,
		tone: "down",
		stats: { hp: {
			from: 6,
			to: 4
		} }
	},
	{
		id: "chien-binh-rong",
		at: "2026-10-10",
		wave: 13,
		tone: "shift",
		stats: {
			atk: {
				from: 5,
				to: 4
			},
			hp: {
				from: 4,
				to: 5
			},
			mdef: {
				from: 2,
				to: 1
			}
		}
	},
	{
		id: "yeu-tinh-chuc-phuc",
		at: "2026-10-10",
		wave: 14,
		tone: "down",
		stats: { mana: {
			from: 2,
			to: 1
		} }
	},
	{
		id: "kizuran",
		at: "2026-10-11",
		wave: 15,
		stats: { mana: {
			from: 2,
			to: 1
		} }
	},
	{
		id: "my-dieu-nhan",
		at: "2026-10-11",
		wave: 15,
		tone: "up",
		notes: ["Mê hoặc tiêu hao 0 mana"]
	},
	{
		id: "hiep-si-ho-ve",
		at: "2026-10-11",
		wave: 16,
		tone: "up",
		notes: ["Kiếm phòng ngự không khoá lượt sau"]
	},
	{
		id: "hiep-si-cua-hau",
		at: "2026-10-12",
		wave: 17,
		tone: "up",
		notes: ["Thêm kỹ năng Kiếm phép"]
	},
	{
		id: "hiep-si-ho-ve",
		at: "2026-10-12",
		wave: 17,
		tone: "shift",
		stats: {
			stars: {
				from: 2,
				to: 3
			},
			atk: {
				from: 2,
				to: 1
			},
			hp: {
				from: 2,
				to: 1
			}
		},
		notes: ["Thêm lời chúc của kỵ sĩ", "Thêm kỹ năng Học tập và trưởng thành"]
	},
	{
		id: "mat-xanh-huy-diet",
		at: "2026-10-12",
		wave: 18,
		tone: "shift",
		stats: {
			atk: {
				from: 8,
				to: 6
			},
			hp: {
				from: 5,
				to: 6
			}
		},
		notes: ["Tia sáng huỷ diệt gây sát thương chuẩn"]
	},
	{
		id: "hiep-si-cua-vua",
		at: "2026-10-14",
		wave: 19,
		tone: "shift",
		stats: { hp: {
			from: 1,
			to: 3
		} },
		notes: ["Bỏ 2 máu ảo của lời chúc kỵ sĩ cũ"]
	},
	{
		id: "hiep-si-cua-hau",
		at: "2026-10-14",
		wave: 19,
		tone: "shift",
		stats: { hp: {
			from: 2,
			to: 3
		} },
		notes: ["Bỏ 2 máu ảo của lời chúc kỵ sĩ cũ"]
	},
	{
		id: "con-thinh-no-cua-hai-vuong",
		at: "2026-10-14",
		wave: 20,
		tone: "up",
		stats: { atk: {
			from: 0,
			to: 1
		} }
	},
	{
		id: "khong-lo-mot-mat",
		at: "2026-10-14",
		wave: 20,
		tone: "down",
		stats: { def: {
			from: 4,
			to: 3
		} }
	},
	{
		id: "quai-thu-thien-su",
		at: "2026-10-14",
		wave: 20,
		tone: "up",
		stats: { mana: {
			from: 2,
			to: 1
		} },
		notes: ["Bảng chọn ghi Cầu nguyện"]
	},
	{
		id: "kizuran",
		at: "2026-10-14",
		wave: 20,
		tone: "up",
		stats: { atk: {
			from: 2,
			to: 3
		} }
	},
	{
		id: "chien-binh-rong",
		at: "2026-10-14",
		wave: 20,
		tone: "down",
		stats: {
			hp: {
				from: 5,
				to: 4
			},
			def: {
				from: 2,
				to: 1
			}
		}
	},
	{
		id: "hiep-si-ho-ve",
		at: "2026-10-14",
		wave: 20,
		tone: "up",
		stats: {
			atk: {
				from: 1,
				to: 2
			},
			hp: {
				from: 1,
				to: 2
			}
		}
	},
	{
		id: "ma-dao-si",
		at: "2026-10-14",
		wave: 20,
		tone: "down",
		notes: ["Ma đạn bắn 1, rồi 2, loạt cuối 4"]
	},
	{
		id: "kiem-si-lua-thieng",
		at: "2026-10-14",
		wave: 21,
		tone: "shift",
		notes: ["Sau Truy cùng diệt tận có Hoả thần long, tốn thêm 3 máu và 1 mana, gây 4 sát thương phép và 3 sát thương chuẩn"]
	},
	{
		id: "phu-thuy-ti-hon",
		at: "2026-10-14",
		wave: 22,
		tone: "down",
		stats: { hp: {
			from: 4,
			to: 3
		} }
	},
	{
		id: "ke-giam-ho-linh-hon",
		at: "2026-10-15",
		wave: 23,
		tone: "up",
		stats: { def: {
			from: 0,
			to: 1
		} }
	}
];
var STATS = [
	"hp",
	"atk",
	"def",
	"mdef",
	"stars",
	"mana"
];
var LABEL = {
	hp: "Máu",
	atk: "Công",
	def: "Thủ",
	mdef: "Thủ phép",
	stars: "Sao",
	mana: "Mana"
};
var TONE_WORD = {
	up: "Tăng",
	down: "Giảm",
	shift: "Thay đổi lối chơi"
};
function toneWord(tone) {
	return TONE_WORD[tone];
}
function whenLabel(chrono, count) {
	return count > 1 && chrono === count ? "Lần cuối" : `Lần ${chrono}`;
}
function isRecent(at, now = /* @__PURE__ */ new Date()) {
	const days = ageDays(at, now);
	return days !== null && days <= 14;
}
function ageDays(at, now) {
	if (at === "live") return 0;
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(at);
	if (!match) return null;
	const then = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return Math.round((today.getTime() - then.getTime()) / 864e5);
}
function markFace(id, now = /* @__PURE__ */ new Date()) {
	const row = CARD_CLOCK[id];
	if (!row) return null;
	if (row.kind === "monster" && row.powerAt && row.powerTone) {
		const days = ageDays(row.powerAt, now);
		if (days !== null && days >= 0 && days < 5) return row.powerTone;
	}
	if (row.added && within(row.added, 9, now)) return "new";
	if (row.shiftAt && within(row.shiftAt, 6, now)) return "new";
	return null;
}
function within(at, limit, now) {
	const days = ageDays(at, now);
	return days !== null && days >= 0 && days <= limit;
}
function powerSign(key, from, to) {
	if (to === from) return 0;
	const bigger = to > from;
	if (key === "stars" || key === "mana") return bigger ? -1 : 1;
	return bigger ? 1 : -1;
}
function toneFromStats(stats) {
	let up = false;
	let down = false;
	for (const key of STATS) {
		const step = stats?.[key];
		if (!step) continue;
		const sign = powerSign(key, step.from, step.to);
		if (sign > 0) up = true;
		if (sign < 0) down = true;
	}
	if (up && down) return "shift";
	if (up) return "up";
	if (down) return "down";
	return null;
}
function statLine(key, from, to) {
	const raised = to > from;
	const mark = powerSign(key, from, to) > 0 ? "up" : "down";
	return [
		{ text: `${LABEL[key]} ` },
		{
			text: raised ? "tăng" : "giảm",
			mark
		},
		{ text: ` ${raised ? "lên" : "xuống"} ${to} (${from})` }
	];
}
function liveSnaps() {
	const map = /* @__PURE__ */ new Map();
	for (const card of [...MONSTERS, ...FORMS]) map.set(card.id, {
		kind: "monster",
		name: card.name,
		stars: card.stars,
		mana: card.gems,
		atk: card.atk,
		def: card.def,
		mdef: card.mdef,
		hp: card.hp
	});
	for (const card of SPELLS) map.set(card.id, {
		kind: "spell",
		name: card.name,
		stars: 0,
		mana: card.gems,
		atk: 0,
		def: 0,
		mdef: 0,
		hp: 0
	});
	return map;
}
function numbers(snap) {
	return {
		hp: snap.hp,
		atk: snap.atk,
		def: snap.def,
		mdef: snap.mdef,
		stars: snap.stars,
		mana: snap.mana
	};
}
function entryLines(entry) {
	const lines = [];
	for (const key of STATS) {
		const step = entry.stats?.[key];
		if (!step || step.from === step.to) continue;
		lines.push(statLine(key, step.from, step.to));
	}
	for (const note of entry.notes ?? []) lines.push([{ text: note }]);
	return lines;
}
function infoBlocks(id) {
	const live = liveSnaps().get(id);
	const base = BALANCE_BASE[id];
	if (!live || !base) return [];
	const cursor = numbers(base);
	const logged = BALANCE_LOG.filter((entry) => entry.id === id);
	const blocks = [];
	for (const entry of logged) {
		const tone = entry.tone ?? toneFromStats(entry.stats);
		const lines = entryLines(entry);
		if (tone && lines.length) blocks.push({
			at: entry.at,
			when: "",
			tone,
			toneText: toneWord(tone),
			lines
		});
		for (const key of STATS) {
			const step = entry.stats?.[key];
			if (step) cursor[key] = step.to;
		}
	}
	const drift = {};
	const now = numbers(live);
	for (const key of STATS) {
		if (live.kind === "spell" && key !== "mana") continue;
		if (cursor[key] !== now[key]) drift[key] = {
			from: cursor[key],
			to: now[key]
		};
	}
	const driftTone = toneFromStats(drift);
	const driftLines = entryLines({
		id,
		at: "live",
		stats: drift
	});
	if (driftTone && driftLines.length) blocks.push({
		at: "live",
		when: "",
		tone: driftTone,
		toneText: toneWord(driftTone),
		lines: driftLines
	});
	const count = blocks.length;
	return blocks.map((block, index) => ({
		...block,
		when: whenLabel(index + 1, count)
	})).reverse();
}
function footRows(kind, now = /* @__PURE__ */ new Date()) {
	const rows = [];
	for (const [id, snap] of liveSnaps()) {
		if (snap.kind !== kind) continue;
		const newest = infoBlocks(id).filter((block) => isRecent(block.at, now))[0];
		if (!newest) continue;
		let wave = newest.at === "live" ? Number.MAX_SAFE_INTEGER : 0;
		if (newest.at !== "live") for (let index = BALANCE_LOG.length - 1; index >= 0; index -= 1) {
			const entry = BALANCE_LOG[index];
			if (entry.id === id && entry.at === newest.at) {
				wave = entry.wave;
				break;
			}
		}
		rows.push({
			id,
			name: snap.name,
			stars: snap.stars,
			mana: snap.mana,
			tone: newest.tone,
			wave
		});
	}
	rows.sort((a, b) => b.wave - a.wave || (kind === "monster" ? a.stars - b.stars : a.mana - b.mana) || a.name.localeCompare(b.name, "vi"));
	return rows.slice(0, kind === "monster" ? 12 : 7);
}
function DeckPage() {
	const [deck, setDeck] = (0, import_react.useState)(DEFAULT_DECK);
	const [book, setBook] = (0, import_react.useState)([]);
	const [active, setActive] = (0, import_react.useState)(null);
	const [booted, setBooted] = (0, import_react.useState)(false);
	const [tab, setTab] = (0, import_react.useState)("monster");
	const [info, setInfo] = (0, import_react.useState)(null);
	const [saveGone, setSaveGone] = (0, import_react.useState)(false);
	const [plansOpen, setPlansOpen] = (0, import_react.useState)(false);
	const plansScroll = (0, import_react.useRef)(0);
	useLang();
	(0, import_react.useEffect)(() => {
		const stored = loadBook();
		const found = stored.decks.find((row) => row.n === stored.active) ?? stored.decks[0];
		setBook(stored.decks);
		setActive(found?.n ?? null);
		if (found) setDeck(cardsOf(found));
		else setDeck(loadDeck());
		setBooted(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!booted || active == null) return;
		setBook((current) => {
			const row = current.find((entry) => entry.n === active);
			if (!row) return current;
			if (sameIds(row.monsters, deck.monsters) && sameIds(row.spells, deck.spells)) return current;
			return current.map((entry) => entry.n === active ? {
				...entry,
				monsters: deck.monsters,
				spells: deck.spells
			} : entry);
		});
	}, [
		deck,
		active,
		booted
	]);
	(0, import_react.useEffect)(() => {
		if (!booted) return;
		saveBook({
			decks: book,
			active
		});
	}, [
		book,
		active,
		booted
	]);
	const issue = deckIssues(deck);
	const balance = deckBalance(deck);
	function addMonster(id) {
		setDeck((current) => {
			if (current.monsters.includes(id) || current.monsters.length >= 17 || current.monsters.length + current.spells.length >= 24) return current;
			return {
				...current,
				monsters: [...current.monsters, id]
			};
		});
	}
	function addSpell(id) {
		setDeck((current) => {
			if (current.spells.includes(id) || current.spells.length >= 11 || current.monsters.length + current.spells.length >= 24) return current;
			if (spellCard(id)?.env && current.spells.some((item) => spellCard(item)?.env)) return current;
			return {
				...current,
				spells: [...current.spells, id]
			};
		});
	}
	function dropMonster(id) {
		setDeck((current) => ({
			...current,
			monsters: current.monsters.filter((item) => item !== id)
		}));
	}
	function dropSpell(id) {
		setDeck((current) => ({
			...current,
			spells: current.spells.filter((item) => item !== id)
		}));
	}
	function tapCard(id, kind, fromDeck) {
		if (info) {
			setInfo(info === id ? null : id);
			return;
		}
		if (fromDeck) {
			if (kind === "monster") dropMonster(id);
			else dropSpell(id);
			return;
		}
		if (kind === "monster") {
			if (FORMS.some((card) => card.id === id)) return;
			addMonster(id);
		} else addSpell(id);
	}
	const pickedMonsters = deck.monsters.map((id) => monsterCard(id)).filter((card) => !!card).sort(byStars);
	const pickedSpells = deck.spells.map((id) => spellCard(id)).filter((card) => !!card).sort(byMana);
	const lockedIds = new Set(FORMS.map((card) => card.id));
	const poolMonsters = [...MONSTERS.filter((card) => !deck.monsters.includes(card.id)).map((card) => monsterCard(card.id) ?? card), ...FORMS.map((card) => monsterCard(card.id) ?? card)].sort(byStars);
	const poolSpells = SPELLS.filter((card) => !deck.spells.includes(card.id)).map((card) => spellCard(card.id) ?? card).sort(byMana);
	if (plansOpen) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckPlans, {
		ids: [...deck.monsters, ...deck.spells],
		onBack: () => {
			setPlansOpen(false);
			window.requestAnimationFrame(() => window.scrollTo(0, plansScroll.current));
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "builder",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "deck-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "chip",
						children: tr("Về sân")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "deck-count",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [deck.monsters.length + deck.spells.length, "/24"] })
					}),
					saveGone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "save is-gone" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "save press",
						disabled: Boolean(issue),
						onClick: () => {
							saveDeck(deck);
							setSaveGone(true);
							window.setTimeout(() => setSaveGone(false), 3e3);
						},
						children: tr("Lưu")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-tabs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `chip${tab === "monster" ? " on" : ""}`,
						onClick: () => {
							setTab("monster");
							setInfo(null);
						},
						children: tr("Quái thú")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `chip${tab === "spell" ? " on" : ""}`,
						onClick: () => {
							setTab("spell");
							setInfo(null);
						},
						children: tr("Phép")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `chip${tab === "using" ? " on" : ""}`,
						onClick: () => {
							setTab("using");
							setInfo(null);
						},
						children: "Deck"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, { balance }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-grid",
				children: [
					tab === "monster" ? poolMonsters.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardPick, {
						held: info === card.id,
						locked: lockedIds.has(card.id),
						onHold: () => setInfo(card.id),
						onTap: () => tapCard(card.id, "monster", false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							monster: card,
							selected: info === card.id,
							mark: markFace(card.id)
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeldInfo, { id: card.id }) : null] }, card.id)) : null,
					tab === "spell" ? spellBands(poolSpells).map((band) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [band.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "deck-band",
						children: tr(band.label)
					}) : null, band.cards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardPick, {
						held: info === card.id,
						onHold: () => setInfo(card.id),
						onTap: () => tapCard(card.id, "spell", false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							spellId: card.id,
							selected: info === card.id,
							mark: markFace(card.id)
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeldInfo, { id: card.id }) : null] }, card.id))] }, band.label || "rest")) : null,
					tab === "using" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [pickedMonsters.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardPick, {
						held: info === card.id,
						onHold: () => setInfo(card.id),
						onTap: () => tapCard(card.id, "monster", true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							monster: card,
							selected: info === card.id,
							mark: markFace(card.id)
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeldInfo, { id: card.id }) : null] }, card.id)), pickedSpells.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardPick, {
						held: info === card.id,
						onHold: () => setInfo(card.id),
						onTap: () => tapCard(card.id, "spell", true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							spellId: card.id,
							selected: info === card.id,
							mark: markFace(card.id)
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeldInfo, { id: card.id }) : null] }, card.id))] }) : null
				]
			}),
			tab === "monster" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckStats, { lines: monsterStatLines() }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerFoot, { kind: "monster" })] }) : null,
			tab === "spell" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckStats, { lines: spellStatLines() }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerFoot, { kind: "spell" })] }) : null,
			tab === "using" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckFoot, {
				monsters: pickedMonsters,
				spells: pickedSpells,
				onPlans: () => {
					plansScroll.current = window.scrollY;
					setPlansOpen(true);
					window.scrollTo(0, 0);
				}
			}) : null,
			tab === "using" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckBar, {
				decks: book,
				active,
				onChoose: (n) => {
					const row = book.find((entry) => entry.n === n);
					if (!row) return;
					setActive(n);
					setDeck(cardsOf(row));
				},
				onRename: (n, name) => setBook((current) => current.map((entry) => entry.n === n ? {
					...entry,
					name
				} : entry)),
				onAdd: () => {
					const row = freshDeck(book);
					setBook((current) => [...current, row]);
					setActive(row.n);
					setDeck(cardsOf(row));
				},
				onDelete: (n) => {
					const next = book.filter((entry) => entry.n !== n);
					const fallback = [...next].sort((a, b) => a.n - b.n).at(-1) ?? null;
					setBook(next);
					if (active === n) {
						setActive(fallback?.n ?? null);
						if (fallback) setDeck(cardsOf(fallback));
					}
				},
				onSave: () => saveBookFile({
					decks: book,
					active
				}),
				onLoad: async () => {
					const loaded = await openBookFile();
					if (!loaded || loaded === "bad") return loaded === "bad";
					const pick = loaded.decks[0] ?? null;
					setBook(loaded.decks);
					setActive(pick?.n ?? null);
					if (pick) setDeck(cardsOf(pick));
					return false;
				}
			}) : null
		]
	});
}
function sameIds(left, right) {
	return left.length === right.length && left.every((id, index) => id === right[index]);
}
function byStars(a, b) {
	return a.stars - b.stars || a.name.localeCompare(b.name, "vi");
}
function byMana(a, b) {
	return a.gems - b.gems || a.name.localeCompare(b.name, "vi");
}
var SPELL_BANDS = [
	{
		label: "Môi trường",
		ids: ["bien-sau"]
	},
	{
		label: "Phản đòn",
		ids: [
			"co-may-thoi-gian",
			"giap-co-khi",
			"hoan-doi",
			"la-chan-phan-don",
			"phuc-kich",
			"guong-phong-ho"
		]
	},
	{
		label: "Giải trừ",
		ids: [
			"hap-thu-ma-phap",
			"mua-ma-thuat",
			"phan-nguyen",
			"vong-xoay-bao-ho"
		]
	},
	{
		label: "Đa năng",
		ids: [
			"ke-dao-mo",
			"mu-ma-phap",
			"thu-hoi-quai-thu"
		]
	},
	{
		label: "Khống chế",
		ids: [
			"soi-xich-dia-nguc",
			"thanh-guom-anh-sang",
			"vong-nguyen-rua-ac-ma",
			"ngan-chan-phong-ngu"
		]
	},
	{
		label: "Sát thương",
		ids: [
			"sung-loi-pha",
			"sam-set-tan-the",
			"virus-an-mon"
		]
	}
];
function spellBands(cards) {
	const bands = SPELL_BANDS.map((band) => ({
		label: band.label,
		cards: band.ids.map((id) => cards.find((card) => card.id === id)).filter((card) => !!card)
	})).filter((band) => band.cards.length > 0);
	const listed = new Set(SPELL_BANDS.flatMap((band) => band.ids));
	const rest = cards.filter((card) => !listed.has(card.id)).sort(byMana);
	if (rest.length) bands.push({
		label: "",
		cards: rest
	});
	return bands;
}
function countBands(cards) {
	return SPELL_BANDS.map((band) => `${tr(band.label)}: ${cards.filter((card) => band.ids.includes(card.id) || band.label === "Môi trường" && card.env).length}`);
}
function monsterStatLines() {
	const outside = new Set(FORMS.map((card) => card.id));
	const counts = /* @__PURE__ */ new Map();
	let forms = 0;
	for (const card of [...MONSTERS, ...FORMS]) {
		const live = monsterCard(card.id) ?? card;
		if (outside.has(card.id)) {
			forms += 1;
			continue;
		}
		counts.set(live.stars, (counts.get(live.stars) ?? 0) + 1);
	}
	const lines = [...counts.keys()].sort((a, b) => a - b).map((stars) => `${stars} ${tr("sao")}: ${counts.get(stars)}`);
	lines.push(`${tr("Ngoài bộ")}: ${forms}`);
	return lines;
}
function spellStatLines() {
	return [...countBands(SPELLS.map((card) => spellCard(card.id) ?? card)), `${tr("Tổng")}: ${SPELLS.length}`];
}
function DeckBar({ decks, active, onChoose, onRename, onAdd, onDelete, onSave, onLoad }) {
	const bar = (0, import_react.useRef)(null);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const [saveAsk, setSaveAsk] = (0, import_react.useState)(false);
	const [saveGone, setSaveGone] = (0, import_react.useState)(false);
	const [badFile, setBadFile] = (0, import_react.useState)(false);
	const rows = [...decks].sort((a, b) => a.n - b.n);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		function away(event) {
			const node = event.target;
			if (node instanceof Node && bar.current?.contains(node)) return;
			setOpen(false);
			setEditing(null);
			setConfirm(null);
		}
		document.addEventListener("pointerdown", away);
		return () => document.removeEventListener("pointerdown", away);
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "deck-bar",
		ref: bar,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "deck-files",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `deck-ico press${saveAsk ? " on" : ""}`,
				"aria-label": tr("Lưu bộ sưu tập"),
				onClick: () => setSaveAsk((value) => !value),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloppyIcon, {})
			}), saveAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `deck-ico press${saveGone ? " is-gone" : ""}`,
					"aria-label": tr("Ghi vào file"),
					onClick: () => {
						setSaveGone(true);
						window.setTimeout(() => setSaveGone(false), 2e3);
						onSave();
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloppyIcon, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "deck-ico press",
					"aria-label": tr("Mở bộ sưu tập"),
					onClick: () => {
						onLoad().then((bad) => setBadFile(bad));
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderIcon, {})
				}),
				badFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "deck-file-bad",
					children: tr("Không đọc được file.")
				}) : null
			] }) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "deck-switch",
			children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "deck-plus press",
				onClick: onAdd,
				"aria-label": tr("Thêm bộ bài"),
				children: "+"
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-stack",
				children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "deck-book",
					children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckRow, {
						row,
						on: row.n === active,
						editing: editing === row.n,
						confirm: confirm === row.n,
						editOpen: editing != null,
						onEdit: (n) => {
							setConfirm(null);
							setEditing(n);
						},
						onChoose: (n) => {
							setEditing(null);
							setConfirm(null);
							onChoose(n);
						},
						onRename,
						onAskDelete: (n) => {
							setEditing(null);
							setConfirm(n);
						},
						onDelete: (n) => {
							setConfirm(null);
							onDelete(n);
						},
						onCancelDelete: () => setConfirm(null),
						onStopEdit: () => setEditing(null)
					}, row.n))
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `deck-ico press${open ? " on" : ""}`,
					"aria-label": tr("Bộ bài"),
					onClick: () => setOpen((value) => !value),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackIcon, {})
				})]
			})]
		})]
	});
}
function DeckRow({ row, on, editing, confirm, editOpen, onEdit, onChoose, onRename, onAskDelete, onDelete, onCancelDelete, onStopEdit }) {
	const held = (0, import_react.useRef)(false);
	const timer = (0, import_react.useRef)(null);
	const jumped = (0, import_react.useRef)(false);
	function arm(go) {
		held.current = false;
		if (timer.current != null) window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => {
			held.current = true;
			go();
		}, 420);
	}
	function drop() {
		if (timer.current != null) window.clearTimeout(timer.current);
		timer.current = null;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `deck-row${on ? " on" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "deck-num press",
				onContextMenu: (event) => event.preventDefault(),
				onPointerDown: () => arm(() => onAskDelete(row.n)),
				onPointerUp: drop,
				onPointerCancel: drop,
				onClick: () => {
					if (held.current) {
						held.current = false;
						return;
					}
					onChoose(row.n);
				},
				children: row.n
			}),
			editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "deck-name-edit",
				value: row.name,
				autoFocus: true,
				onChange: (event) => onRename(row.n, event.target.value),
				onBlur: () => {
					window.setTimeout(() => {
						if (document.activeElement?.closest(".deck-name-edit")) return;
						onStopEdit();
					}, 0);
				},
				onKeyDown: (event) => {
					if (event.key === "Enter") onStopEdit();
				}
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "deck-name press",
				onContextMenu: (event) => event.preventDefault(),
				onPointerDown: () => {
					if (editOpen) {
						jumped.current = true;
						onEdit(row.n);
						return;
					}
					arm(() => onEdit(row.n));
				},
				onPointerUp: drop,
				onPointerCancel: drop,
				onClick: () => {
					if (jumped.current) {
						jumped.current = false;
						return;
					}
					if (held.current) {
						held.current = false;
						return;
					}
					onChoose(row.n);
				},
				children: row.name || tr("Chưa đặt tên")
			}),
			confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "deck-ask",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: tr("Xoá bộ này?") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onDelete(row.n),
						children: tr("Xoá")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onCancelDelete,
						children: tr("Không")
					})
				]
			}) : null
		]
	});
}
function FloppyIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 4h14l6 6v18H6V4z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 4v7h7" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "10",
				y: "17",
				width: "12",
				height: "9"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "11",
				y: "6",
				width: "6",
				height: "4"
			})
		]
	});
}
function FolderIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 11V8h8l2 3h16v4H3z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 14h26l-3 13H6L3 14z" })]
	});
}
function StackIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "8",
			y: "6",
			width: "14",
			height: "18"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "11",
			y: "9",
			width: "14",
			height: "18"
		})]
	});
}
function DeckStats({ lines }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "deck-stats",
		children: lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line }, line))
	});
}
function DeckFoot({ monsters, spells, onPlans }) {
	const stars = [
		1,
		2,
		3,
		4
	].map((n) => `${n} ${tr("sao")}: ${monsters.filter((card) => card.stars === n).length}`);
	const spellLines = countBands(spells);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "deck-stats",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "deck-stats-top",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-stats-copy",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: tr("Quái thú") }), stars.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line }, line))]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "deck-plans-open",
				onClick: onPlans,
				children: tr("Các chiến thuật đang có trong bộ bài")
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "deck-stats-copy",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: tr("Phép") }), spellLines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line }, line))]
		})]
	});
}
function DeckPlans({ ids, onBack }) {
	const groups = deckTactics(ids, loadStrategies());
	const gray = new Set(FORMS.map((card) => card.id));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "watch is-wide deck-plans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "watch-back",
				onClick: onBack,
				children: tr("Trở về")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tr("Các chiến thuật đang có trong bộ bài") }),
			groups.length ? groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "deck-plan-band",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: group.title === "Quái thú chủ lực" ? "is-main" : void 0,
					children: tr(group.title)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "deck-plan-row",
					children: group.plans.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: `plan${plan.cards.length === 1 ? " is-narrow" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "plan-title",
							children: plan.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "deck-grid plan-grid",
							children: plan.cards.map((id) => {
								const monster = monsterCard(id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `plan-card${gray.has(id) ? " is-gray" : ""}`,
									children: monster ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { monster }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { spellId: id })
								}, id);
							})
						})]
					}, plan.id))
				})]
			}, group.title)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "plan-empty",
				children: tr("Bộ này chưa có chiến thuật nào.")
			})
		]
	});
}
function Mark({ side }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
		className: side.bad ? "is-bad" : "is-ok",
		children: `${side.sign}${side.n}`
	});
}
function Need({ balance }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "deck-need",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			tr("Quái thú"),
			": ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { side: balance.monster })
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			tr("Phép"),
			": ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { side: balance.spell })
		] })]
	});
}
function HeldInfo({ id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BalanceInfo, { id }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardCopy, { id })] });
}
function BalanceInfo({ id }) {
	const blocks = infoBlocks(id);
	if (!blocks.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "power-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: `is-${blocks[0].tone}`,
			children: tr("Cân bằng sức mạnh")
		}), blocks.map((block, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index ? "power-block is-next" : "power-block",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "power-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "power-when",
						children: [
							"- ",
							tr(block.when),
							","
						]
					}),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						className: `power-tone is-${block.tone}`,
						children: tr(block.toneText)
					}),
					":"
				]
			}), block.lines.map((line, lineIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: line.map((bit, bitIndex) => bit.mark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `power-bit is-${bit.mark}`,
				children: tr(bit.text)
			}, bitIndex) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tr(bit.text) }, bitIndex)) }, lineIndex))]
		}, `${block.at}-${block.when}`))]
	});
}
function PowerFoot({ kind }) {
	const rows = footRows(kind);
	if (!rows.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "power-foot",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: tr("Cân bằng sức mạnh") }), rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `power-name is-${row.tone}`,
			children: kind === "monster" ? `${row.stars}★ ${tr(row.name)}` : tr(row.name)
		}, row.id))]
	});
}
function CardCopy({ id }) {
	const monster = monsterCard(id);
	const spell = monster ? void 0 : spellCard(id);
	if (!monster && !spell) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: `focus-copy is-inline${monster ? " is-skill" : " is-spell"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: tr(monster?.name ?? spell?.name ?? "") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: monster ? "ink-skill" : "ink-spell",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyText, { text: monster?.skill ?? spell?.effect ?? "" })
			}),
			DECK_NOTES[id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "deck-note",
				children: tr(DECK_NOTES[id])
			}) : null
		]
	});
}
function CardPick({ held, locked = false, onHold, onTap, children }) {
	const timer = (0, import_react.useRef)(null);
	const didHold = (0, import_react.useRef)(false);
	function clear() {
		if (timer.current !== null) window.clearTimeout(timer.current);
		timer.current = null;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `pick press${held ? " is-held" : ""}${locked ? " is-locked" : ""}`,
		onPointerDown: () => {
			didHold.current = false;
			clear();
			timer.current = window.setTimeout(() => {
				didHold.current = true;
				onHold();
			}, 420);
		},
		onPointerUp: clear,
		onPointerCancel: clear,
		onClick: () => {
			if (didHold.current) {
				didHold.current = false;
				return;
			}
			if (locked && !held) return;
			onTap();
		},
		children
	});
}
//#endregion
export { DeckPage as component };
