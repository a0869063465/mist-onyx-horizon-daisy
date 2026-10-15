import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as tr, T as parseCopy, w as useLang } from "./router-D9l-mBhf.mjs";
import { _ as monsterCard, i as MONSTERS, o as MONSTER_CHIPS, p as chipLabel, r as FORMS, s as SPELLS } from "./catalog-DOYBjZ9O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/habits-E9sSgm9g.js
var import_jsx_runtime = require_jsx_runtime();
var FUSIONS = [{
	materials: ["ky-si-bong-toi", "loi-nguyen-cua-rong"],
	result: "ky-si-cuoi-rong"
}, {
	materials: ["mat-do-tan-pha", "trieu-hoi-ac-ma"],
	result: "rong-ac-ma"
}];
function findFusion(a, b) {
	return FUSIONS.find((recipe) => {
		const [left, right] = recipe.materials;
		return left === a && right === b || left === b && right === a;
	}) ?? null;
}
var KNIGHTS = [
	"hiep-si-cua-vua",
	"hiep-si-ho-ve",
	"hiep-si-cua-hau"
];
function findKnightFusion(hand, host, fieldIds) {
	if (!KNIGHTS.includes(hand) || !KNIGHTS.includes(host) || hand === host) return null;
	const present = /* @__PURE__ */ new Set([
		hand,
		host,
		...fieldIds
	]);
	if (!KNIGHTS.every((id) => present.has(id))) return null;
	return { result: "hiep-si-huyen-bi" };
}
var FUSED = new Set(FUSIONS.map((recipe) => recipe.result));
function monsterInk(card) {
	if (FUSED.has(card.id)) return "fuse";
	return card.stars > 0 ? "mon" : "hide";
}
var NOTICE_RULES = [];
for (const card of MONSTERS) NOTICE_RULES.push({
	text: card.name,
	ink: monsterInk(card)
});
for (const card of FORMS) NOTICE_RULES.push({
	text: card.name,
	ink: monsterInk(card)
});
for (const card of SPELLS) NOTICE_RULES.push({
	text: card.name,
	ink: "spell"
});
for (const chips of Object.values(MONSTER_CHIPS)) for (const chip of chips) {
	if (chip.label === "Khiên vật lý" || chip.label === "Khiên phép") continue;
	NOTICE_RULES.push({
		text: chip.label,
		ink: "skill"
	});
}
NOTICE_RULES.push({
	text: "sát thương phép",
	ink: "skill"
}, {
	text: "Khiên vật lý",
	ink: "phys"
}, {
	text: "khiên vật lý",
	ink: "phys"
}, {
	text: "Khiên phép",
	ink: "ward"
}, {
	text: "khiên phép",
	ink: "ward"
}, {
	text: "sát thương vật lý",
	ink: "phys"
}, {
	text: "sát thương chuẩn",
	ink: "tru"
}, {
	text: "quái thú tấn công",
	ink: "atk"
}, {
	text: "giáp lá cà",
	ink: "atk"
}, {
	text: "va chạm",
	ink: "atk"
}, {
	text: "tấn công",
	ink: "atk"
}, {
	text: "1 lá quái thú",
	ink: "mon"
}, {
	text: "1 lá phép",
	ink: "spell"
}, {
	text: "quái thú 1 sao",
	ink: "star1"
}, {
	text: "quái thú 2 sao",
	ink: "star2"
}, {
	text: "quái thú 3 sao",
	ink: "star3"
}, {
	text: "quái thú 4 sao",
	ink: "star4"
}, {
	text: "quái thú ẩn mình",
	ink: "hide"
}, {
	text: "1 quái",
	ink: "mon"
}, {
	text: "1 phép",
	ink: "spell"
}, {
	text: "Đại thuỷ triều huỷ diệt",
	ink: "skill"
}, {
	text: "Con nước lớn tàn phá",
	ink: "skill"
}, {
	text: "Tia sáng huỷ diệt",
	ink: "skill"
}, {
	text: "tia sáng huỷ diệt",
	ink: "skill"
}, {
	text: "Sấm lôi phá",
	ink: "skill"
}, {
	text: "Đòn thêm",
	ink: "skill"
}, {
	text: "Giải phóng cầu ma lực",
	ink: "skill"
}, {
	text: "giải phóng cầu ma lực",
	ink: "skill"
}, {
	text: "Cầu ma lực",
	ink: "mana"
}, {
	text: "cầu ma lực",
	ink: "mana"
});
for (const card of [...MONSTERS, ...FORMS]) for (const bit of parseCopy(card.skill)) {
	if ("br" in bit || !bit.bold || !bit.under) continue;
	const name = bit.text.replace(/[:：.\s]+$/u, "").trim();
	if (name.length < 2 || name.length > 48) continue;
	NOTICE_RULES.push({
		text: name,
		ink: "skill"
	});
}
var SYSTEM_RULES = [
	{
		text: "Chế độ test",
		ink: "sys"
	},
	{
		text: "Cập nhật",
		ink: "sys"
	},
	{
		text: "Thông tin",
		ink: "sys"
	},
	{
		text: "Chiến thuật",
		ink: "sys"
	},
	{
		text: "Xuất",
		ink: "sys"
	},
	{
		text: "Trở về",
		ink: "sys"
	},
	{
		text: "Mô tả",
		ink: "sys"
	},
	{
		text: "Reset",
		ink: "sys"
	},
	{
		text: "Test",
		ink: "sys"
	},
	{
		text: "test",
		ink: "sys"
	},
	{
		text: "Use",
		ink: "sys"
	},
	{
		text: "AI",
		ink: "sys"
	}
];
function ruleBuckets(rules) {
	const buckets = /* @__PURE__ */ new Map();
	for (const rule of [...rules].sort((a, b) => b.text.length - a.text.length)) {
		if (!rule.text) continue;
		const key = rule.text[0];
		const list = buckets.get(key);
		if (list) list.push(rule);
		else buckets.set(key, [rule]);
	}
	return buckets;
}
var BASE_BUCKETS = ruleBuckets(NOTICE_RULES);
var SYSTEM_BUCKETS = ruleBuckets([...NOTICE_RULES, ...SYSTEM_RULES]);
function noticeParts(raw, system = false) {
	const text = raw.replace(/^\d+\.\s*/, "");
	const extra = [];
	for (const [id, chips] of Object.entries(MONSTER_CHIPS)) for (const chip of chips) {
		const label = chipLabel(id, chip.key);
		if (label && label !== chip.label) extra.push({
			text: label,
			ink: "skill"
		});
	}
	const buckets = extra.length ? ruleBuckets([
		...NOTICE_RULES,
		...extra,
		...system ? SYSTEM_RULES : []
	]) : system ? SYSTEM_BUCKETS : BASE_BUCKETS;
	const out = [];
	let index = 0;
	while (index < text.length) {
		const hit = buckets.get(text[index])?.find((rule) => text.startsWith(rule.text, index));
		if (hit) {
			out.push({
				text: hit.text,
				ink: hit.ink
			});
			index += hit.text.length;
			continue;
		}
		const mana = /^(?:Cầu ma lực|cầu ma lực|\d+\s*mana)/.exec(text.slice(index));
		if (mana) {
			out.push({
				text: mana[0],
				ink: "mana"
			});
			index += mana[0].length;
			continue;
		}
		const dealt = /^gây \d+ máu/.exec(text.slice(index));
		if (dealt) {
			out.push({
				text: dealt[0],
				ink: "atk"
			});
			index += dealt[0].length;
			continue;
		}
		const phys = /^\d+ sát thương vật lý/.exec(text.slice(index));
		if (phys) {
			out.push({
				text: phys[0],
				ink: "phys"
			});
			index += phys[0].length;
			continue;
		}
		const spell = /^\d+ sát thương phép/.exec(text.slice(index));
		if (spell) {
			out.push({
				text: spell[0],
				ink: "skill"
			});
			index += spell[0].length;
			continue;
		}
		const tru = /^\d+ sát thương chuẩn/.exec(text.slice(index));
		if (tru) {
			out.push({
				text: tru[0],
				ink: "tru"
			});
			index += tru[0].length;
			continue;
		}
		const last = out.at(-1);
		if (last && !last.ink) last.text += text[index];
		else out.push({ text: text[index] });
		index += 1;
	}
	return out;
}
function Painted({ text, system = false }) {
	useLang();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: noticeParts(text, system).map((part, index) => part.ink ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
		className: `ink-${part.ink}`,
		children: tr(part.text)
	}, index) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tr(part.text) }, index)) });
}
/**
* Bộ nhớ các ván AI đã kết thúc. Không đọc habits, không đổi nước đi.
* Khoá localStorage riêng: clash-match-history.
*/
var MATCH_HISTORY_KEY = "clash-match-history";
var memoryBook = null;
var saveProblem = null;
var historyLines = [];
var lastSeal = null;
var lastWrite = {
	local: "chưa ghi",
	session: "chưa ghi",
	idb: "chưa ghi"
};
function histLog(line) {
	historyLines.push(line);
	if (historyLines.length > 12) historyLines.shift();
	if (typeof console !== "undefined") console.info(`[history] ${line}`);
}
var REFUSED = "Không lưu được vào bộ nhớ máy. Hãy tải tệp trước khi thoát.";
var INVALID = "Ván đã kết thúc nhưng dữ liệu không hợp lệ nên không lưu.";
var DB_NAME = "clash-match-db";
var DB_STORE = "book";
var DB_KEY = "history";
var STAMP = "clash_hist";
var testMirror = null;
function matchHistoryProblem() {
	return saveProblem;
}
function warmMatchHistory() {
	historyDb();
}
function stamp(kind) {
	try {
		if (typeof document === "undefined") return;
		document.cookie = `${STAMP}=${kind}; Path=/; Max-Age=31536000; SameSite=Lax`;
	} catch {}
}
function stamped() {
	try {
		if (typeof document === "undefined") return null;
		const hit = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${STAMP}=`));
		if (!hit) return null;
		const kind = hit.slice(11);
		return kind === "ok" || kind === "bad" ? kind : null;
	} catch {
		return null;
	}
}
function hostStorage(name) {
	try {
		const store = globalThis[name];
		if (!store || typeof store.getItem !== "function" || typeof store.setItem !== "function") return null;
		return store;
	} catch {
		return null;
	}
}
var opening = null;
function historyDb() {
	if (opening) return opening;
	const idb = globalThis.indexedDB;
	if (!idb) {
		opening = Promise.resolve(null);
		return opening;
	}
	opening = new Promise((resolve) => {
		let request;
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
function writeMirror(value) {
	testMirror?.write(value);
	historyDb().then((db) => {
		if (!db) {
			lastWrite = {
				...lastWrite,
				idb: "không có"
			};
			histLog("ghi indexedDB: không có");
			return;
		}
		try {
			const tx = db.transaction(DB_STORE, "readwrite");
			tx.objectStore(DB_STORE).put(value, DB_KEY);
			tx.oncomplete = () => {
				lastWrite = {
					...lastWrite,
					idb: "ok"
				};
				histLog("ghi indexedDB: ok");
			};
			tx.onerror = () => {
				lastWrite = {
					...lastWrite,
					idb: "lỗi"
				};
				histLog("ghi indexedDB: lỗi");
			};
			tx.onabort = () => {
				lastWrite = {
					...lastWrite,
					idb: "hủy"
				};
				histLog("ghi indexedDB: hủy");
			};
		} catch {
			lastWrite = {
				...lastWrite,
				idb: "lỗi"
			};
			histLog("ghi indexedDB: lỗi");
		}
	});
}
async function readMirror() {
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
function browserStore() {
	return {
		getItem(key) {
			if (key === "clash-match-history" && memoryBook) return memoryBook;
			for (const store of [hostStorage("localStorage"), hostStorage("sessionStorage")]) {
				if (!store) continue;
				try {
					const raw = store.getItem(key);
					if (raw) return raw;
				} catch {}
			}
			return null;
		},
		setItem(key, value) {
			if (key === "clash-match-history") {
				memoryBook = value;
				saveProblem = null;
				stamp("ok");
				writeMirror(value);
			}
			let persisted = false;
			for (const name of ["localStorage", "sessionStorage"]) {
				const store = hostStorage(name);
				const slot = name === "localStorage" ? "local" : "session";
				if (!store) {
					if (key === "clash-match-history") lastWrite = {
						...lastWrite,
						[slot]: "không có"
					};
					continue;
				}
				try {
					store.setItem(key, value);
					if (store.getItem(key)) {
						persisted = true;
						if (key === "clash-match-history") lastWrite = {
							...lastWrite,
							[slot]: "ok"
						};
					} else if (key === "clash-match-history") lastWrite = {
						...lastWrite,
						[slot]: "không đọc lại được"
					};
				} catch {
					if (key === "clash-match-history") lastWrite = {
						...lastWrite,
						[slot]: "lỗi"
					};
				}
			}
			if (key === "clash-match-history") {
				saveProblem = persisted ? null : REFUSED;
				histLog(`ghi local=${lastWrite.local} session=${lastWrite.session}`);
			}
		}
	};
}
function cardIds(list) {
	const ids = [];
	for (const card of list) {
		if (!card || typeof card.id !== "string" || card.id.length === 0 || card.id.length > 80) return null;
		ids.push(card.id);
	}
	return ids;
}
function spellIds(list, env) {
	const ids = [];
	if (env !== void 0) {
		if (typeof env !== "string" || env.length === 0 || env.length > 80) return null;
		ids.push(env);
	}
	for (const id of list) {
		if (typeof id !== "string" || id.length === 0 || id.length > 80) return null;
		ids.push(id);
	}
	return ids;
}
function freshOpening(player) {
	return player.hp === 16 && player.hand.length <= 1 && player.field.length === 3 && player.field.every((mon) => mon === null) && player.draws === 0 && player.summons === 0 && (player.turns ?? 0) === 0 && (player.spent?.length ?? 0) === 0;
}
function deckOf(player) {
	const monsters = cardIds(player.reserve);
	const rest = cardIds(player.monsterDeck);
	const spells = spellIds([...player.hand, ...player.spellDeck], player.env);
	if (!monsters || !rest || !spells) return null;
	return {
		monsters: [...monsters, ...rest],
		spells
	};
}
/** Bộ bài lúc mở ván. Trả null nếu sân không còn là ván vừa tạo. */
function openingDecks(players) {
	if (!freshOpening(players[0]) || !freshOpening(players[1])) return null;
	const you = deckOf(players[0]);
	const foe = deckOf(players[1]);
	if (!you || !foe) return null;
	return {
		you,
		foe
	};
}
function newMatchId(now = Date.now()) {
	const rand = Math.random().toString(36).slice(2, 10);
	return `m-${now.toString(36)}-${rand}`;
}
function matchResult(winner) {
	if (winner === 0) return "win";
	if (winner === 1) return "loss";
	return "draw";
}
function isFinishedAi(mode, step, winner) {
	return mode === "ai" && step === "over" && (winner === 0 || winner === 1 || winner === null);
}
function cleanDeck(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	if (!Array.isArray(row.monsters) || !Array.isArray(row.spells)) return null;
	if (!row.monsters.every((id) => typeof id === "string") || !row.spells.every((id) => typeof id === "string")) return null;
	return {
		monsters: [...row.monsters],
		spells: [...row.spells]
	};
}
function cleanDecks(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	const you = cleanDeck(row.you);
	const foe = cleanDeck(row.foe);
	if (!you || !foe) return null;
	return {
		you,
		foe
	};
}
function pair(value) {
	return Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}
var EVENT_KINDS = /* @__PURE__ */ new Set([
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
	"result"
]);
function parseTarget(value) {
	if (value === null) return null;
	if (!value || typeof value !== "object") return void 0;
	const row = value;
	if (row.kind === "face") return { kind: "face" };
	if (row.kind !== "monster") return void 0;
	if (row.cardId !== null && typeof row.cardId !== "string") return void 0;
	if (row.uid !== null && typeof row.uid !== "string") return void 0;
	return {
		kind: "monster",
		cardId: row.cardId ?? null,
		uid: row.uid ?? null
	};
}
function parseHit(value) {
	if (value === void 0 || value === null) return null;
	if (typeof value !== "object") return void 0;
	const row = value;
	if (row.who !== 0 && row.who !== 1) return void 0;
	if (row.to !== "face" && row.to !== "monster") return void 0;
	if (row.cardId !== null && typeof row.cardId !== "string") return void 0;
	if (row.uid !== null && typeof row.uid !== "string") return void 0;
	if (typeof row.before !== "number" || typeof row.after !== "number" || typeof row.dealt !== "number") return void 0;
	if (!Number.isFinite(row.before) || !Number.isFinite(row.after) || !Number.isFinite(row.dealt)) return void 0;
	if (typeof row.blocked !== "boolean" || typeof row.reflect !== "boolean" || typeof row.delayed !== "boolean") return void 0;
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
		delayed: row.delayed
	};
}
function parseEvent(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	if (typeof row.n !== "number" || !Number.isInteger(row.n) || row.n < 1) return null;
	if (row.actor !== 0 && row.actor !== 1) return null;
	if (typeof row.kind !== "string" || !EVENT_KINDS.has(row.kind)) return null;
	if (typeof row.ok !== "boolean") return null;
	if (row.cardId !== null && typeof row.cardId !== "string") return null;
	if (!pair(row.hp) || !pair(row.orb) || !pair(row.stars)) return null;
	if (row.end !== null && row.end !== "damage" && row.end !== "concede") return null;
	const target = parseTarget(row.target);
	if (target === void 0) return null;
	if (row.id !== void 0 && (typeof row.id !== "string" || row.id.length === 0 || row.id.length > 40)) return null;
	if (row.cause !== void 0 && row.cause !== null && typeof row.cause !== "string") return null;
	if (row.auto !== void 0 && typeof row.auto !== "boolean") return null;
	const hit = parseHit(row.hit);
	if (hit === void 0) return null;
	return {
		n: row.n,
		id: row.id ?? `legacy-${row.n}`,
		actor: row.actor,
		kind: row.kind,
		ok: row.ok,
		cardId: row.cardId ?? null,
		target,
		hp: row.hp,
		orb: row.orb,
		stars: row.stars,
		end: row.end ?? null,
		cause: row.cause ?? null,
		auto: row.auto ?? false,
		hit
	};
}
function parseEvents(value) {
	if (value === void 0) return [];
	if (!Array.isArray(value)) return null;
	const events = [];
	for (const row of value) {
		const parsed = parseEvent(row);
		if (!parsed) return null;
		events.push(parsed);
	}
	return events;
}
function parseRecord(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
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
		return {
			...row,
			decks,
			log: [...row.log],
			events
		};
	}
	return {
		...row,
		decks: null,
		log: [...row.log],
		events
	};
}
function readBook(store) {
	const raw = store.getItem(MATCH_HISTORY_KEY);
	if (!raw) return {
		matches: [],
		writable: true
	};
	try {
		const data = JSON.parse(raw);
		if (!data || typeof data !== "object" || data.version !== 1 || !Array.isArray(data.matches)) return {
			matches: [],
			writable: false
		};
		return {
			matches: data.matches.flatMap((row) => {
				const parsed = parseRecord(row);
				return parsed ? [parsed] : [];
			}),
			writable: true
		};
	} catch {
		return {
			matches: [],
			writable: false
		};
	}
}
function writeBook(store, matches) {
	let rows = matches.slice(-40);
	while (rows.length > 0) try {
		store.setItem(MATCH_HISTORY_KEY, JSON.stringify({
			version: 1,
			matches: rows
		}));
		return true;
	} catch {
		if (rows.length === 1) return false;
		rows = rows.slice(1);
	}
	return false;
}
function loadMatchHistory(store) {
	return readBook(store ?? browserStore()).matches;
}
function exportMatchHistory(store) {
	const kept = store ?? browserStore();
	let raw;
	try {
		raw = kept.getItem(MATCH_HISTORY_KEY);
	} catch {
		return {
			status: "broken",
			message: saveProblem ?? REFUSED
		};
	}
	if (!raw) return saveProblem ? {
		status: "broken",
		message: saveProblem
	} : { status: "empty" };
	try {
		const data = JSON.parse(raw);
		if (!data || typeof data !== "object" || data.version !== 1 || !Array.isArray(data.matches)) return {
			status: "broken",
			message: "Lịch sử không đọc được. Dữ liệu gốc vẫn giữ nguyên."
		};
		if (data.matches.length === 0) return saveProblem ? {
			status: "broken",
			message: saveProblem
		} : { status: "empty" };
		return {
			status: "ready",
			count: data.matches.length,
			json: JSON.stringify(data, null, 2)
		};
	} catch {
		return {
			status: "broken",
			message: "Lịch sử không đọc được. Dữ liệu gốc vẫn giữ nguyên."
		};
	}
}
/** Đọc cả bản IndexedDB. Dùng cho màn xuất, sau khi trang đã tải lại. */
async function exportStoredHistory() {
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
	if (mark === "ok") return {
		status: "broken",
		message: REFUSED
	};
	if (mark === "bad") return {
		status: "broken",
		message: INVALID
	};
	histLog("đọc màn xuất: trống");
	return sync;
}
function rememberMatch(input, store) {
	const own = store === void 0;
	const kept = store ?? browserStore();
	if (!isFinishedAi(input.mode, "over", input.winner)) return {
		ok: false,
		reason: "invalid"
	};
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
		events: input.events ?? []
	});
	if (!record) {
		if (own) {
			saveProblem = INVALID;
			if (!memoryBook) stamp("bad");
		}
		return {
			ok: false,
			reason: "invalid"
		};
	}
	const book = readBook(kept);
	if (!book.writable) {
		if (own) saveProblem = REFUSED;
		return {
			ok: false,
			reason: "unread"
		};
	}
	if (book.matches.some((match) => match.id === record.id)) return {
		ok: true,
		added: false
	};
	const wrote = writeBook(kept, [...book.matches, record]);
	if (!wrote && own) saveProblem = REFUSED;
	return wrote ? {
		ok: true,
		added: true
	} : {
		ok: false,
		reason: "full"
	};
}
function noteFinishedAi(prev, next, memo, store) {
	const id = memo?.id ?? "";
	const startedAt = memo?.startedAt ?? 0;
	if (memo?.saved) return {
		saved: true,
		id,
		startedAt
	};
	if (!(prev.mode === "ai" && next.mode === "ai" && prev.winner === null && (next.winner === 0 || next.winner === 1))) return {
		saved: false,
		id,
		startedAt
	};
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
		events: next.events ?? []
	}, store);
	lastSeal = {
		winner: next.winner,
		step: next.step,
		saved: kept.ok,
		why: kept.ok ? "đã lưu" : kept.reason
	};
	histLog(`kết thúc winner=${next.winner} step=${next.step} lưu=${kept.ok ? "có" : "không"} ${kept.ok ? "" : kept.reason}`.trim());
	return {
		saved: kept.ok,
		id: matchId,
		startedAt: began
	};
}
function countRaw(raw) {
	if (!raw) return 0;
	try {
		const data = JSON.parse(raw);
		return Array.isArray(data.matches) ? data.matches.length : null;
	} catch {
		return null;
	}
}
function snapStore(store) {
	if (!store) return {
		count: null,
		error: "không có"
	};
	try {
		const count = countRaw(store.getItem(MATCH_HISTORY_KEY));
		return {
			count,
			error: count === null ? "không đọc được" : ""
		};
	} catch {
		return {
			count: null,
			error: "lỗi đọc"
		};
	}
}
/** Số bản ghi từng kho. Không gồm nội dung ván. */
async function diagnoseHistory() {
	const idb = typeof indexedDB !== "undefined" && indexedDB ? "có" : "không";
	let indexed = {
		count: null,
		error: idb === "có" ? "" : "không có"
	};
	try {
		const raw = await readMirror();
		indexed = {
			count: countRaw(raw),
			error: raw === null && idb === "không" ? "không có" : ""
		};
		if (indexed.count === null) indexed.error = "không đọc được";
	} catch {
		indexed = {
			count: null,
			error: "lỗi đọc"
		};
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
		lines: [...historyLines]
	};
}
var KEY = "clash-habits";
var EARLY_NEED = 4;
function emptyHabits() {
	return {
		games: 0,
		earlyTurns: 0,
		spentAll: 0,
		keptMana: 0,
		summonOne: 0,
		summonHigher: 0,
		floodGames: 0,
		holdGames: 0,
		face: 0,
		monsterSwings: 0,
		blocks: 0,
		passes: 0,
		spellDraws: 0,
		monsterDraws: 0
	};
}
function freshScratch() {
	return {
		turns: 1,
		earlySummons: 0
	};
}
function watchSnap(duel) {
	const you = duel.players[0];
	const pending = duel.pending;
	const kind = pending?.kind === "face" || pending?.kind === "melee" || pending?.kind === "beam" ? pending.kind : null;
	return {
		turn: duel.turn,
		step: duel.step,
		winner: duel.winner,
		orb: you.orb,
		draws: you.draws,
		summons: you.summons,
		hand: you.hand.length,
		reserve: you.reserve.length,
		field: you.field.flatMap((mon) => {
			if (!mon) return [];
			const card = monsterCard(mon.cardId);
			return [{
				uid: mon.uid,
				stars: card?.stars ?? 1
			}];
		}),
		pending: kind,
		blocker: duel.hold?.blocker ?? null,
		priority: duel.hold?.priority ?? null
	};
}
function loadHabits() {
	if (typeof localStorage === "undefined") return emptyHabits();
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return emptyHabits();
		return {
			...emptyHabits(),
			...JSON.parse(raw)
		};
	} catch {
		return emptyHabits();
	}
}
function saveHabits(habits) {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(KEY, JSON.stringify(habits));
}
function clearHabits() {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(KEY);
}
function absorb(habits, prev, next, scratch) {
	if (prev.winner !== null && next.winner === null) return {
		habits,
		scratch: freshScratch()
	};
	const h = { ...habits };
	const s = { ...scratch };
	if (prev.winner === null && next.winner !== null) {
		h.games += 1;
		if (s.earlySummons >= 2) h.floodGames += 1;
		else h.holdGames += 1;
		return {
			habits: h,
			scratch: freshScratch()
		};
	}
	const playerMain = prev.turn === 0 && prev.step === "main";
	const playerRespond = prev.step === "respond" && prev.priority === 0;
	if (playerMain) {
		if (next.summons > prev.summons && s.turns <= 3) {
			const seen = new Set(prev.field.map((mon) => mon.uid));
			const born = next.field.find((mon) => !seen.has(mon.uid));
			if (born) {
				s.earlySummons += 1;
				if (born.stars <= 1) h.summonOne += 1;
				else h.summonHigher += 1;
			}
		}
		if (next.draws > prev.draws) {
			if (next.hand > prev.hand) h.spellDraws += 1;
			else h.monsterDraws += 1;
		}
		if (prev.pending === null && next.pending === "face") h.face += 1;
		if (prev.pending === null && (next.pending === "melee" || next.pending === "beam")) h.monsterSwings += 1;
		if (next.turn === 1) {
			if (s.turns <= 3) {
				h.earlyTurns += 1;
				if (prev.orb === 0) h.spentAll += 1;
				else h.keptMana += 1;
			}
			s.turns += 1;
		}
	}
	if (playerRespond && next.hand === prev.hand && next.summons === prev.summons && next.field.length === prev.field.length) {
		if (!prev.blocker && next.blocker) h.blocks += 1;
		else if (!next.blocker && (next.step === "main" || next.priority === 1)) h.passes += 1;
	}
	return {
		habits: h,
		scratch: s
	};
}
function readStyle(habits = loadHabits()) {
	const ready = habits.earlyTurns >= EARLY_NEED;
	const extra = ready && habits.games >= 2 && habits.face + habits.monsterSwings + habits.blocks + habits.passes + habits.spellDraws + habits.monsterDraws >= 4;
	return {
		ready,
		spendAll: !ready || habits.spentAll >= habits.keptMana,
		oneStar: !ready || habits.summonOne >= habits.summonHigher,
		flood: ready && habits.floodGames > habits.holdGames,
		preferFace: extra && habits.face + habits.monsterSwings >= 3 ? habits.face > habits.monsterSwings : null,
		blockEager: extra && habits.blocks + habits.passes >= 3 ? habits.blocks >= habits.passes : null,
		spellDraw: extra && habits.spellDraws + habits.monsterDraws >= 3 ? habits.spellDraws >= habits.monsterDraws : null
	};
}
function ratio(yes, no) {
	const total = yes + no;
	if (total === 0) return "chưa thấy";
	return `${yes}/${total}`;
}
function watchLines(habits = loadHabits()) {
	const style = readStyle(habits);
	const early = habits.earlyTurns < EARLY_NEED ? `Chưa đủ. Mới xem ${habits.earlyTurns}/${EARLY_NEED} lượt đầu, AI vẫn đánh lối cơ bản.` : "Đủ dữ liệu. 3 thói quen này được dùng trong 3 lượt đầu, trước khi xử lý mối nguy.";
	return [
		{
			title: "Ván đã xem",
			text: `${habits.games}`
		},
		{
			title: "Lối cơ bản",
			text: early
		},
		{
			title: "Hết mana lúc đầu",
			text: style.ready ? style.spendAll ? `Có. Dùng hết ${ratio(habits.spentAll, habits.keptMana)} lượt đầu.` : `Không. Còn mana ${ratio(habits.keptMana, habits.spentAll)} lượt đầu.` : `Chưa rõ. Hết mana ${ratio(habits.spentAll, habits.keptMana)}.`
		},
		{
			title: "Quái 1 sao sớm",
			text: style.ready ? style.oneStar ? `Có. Gọi 1 sao ${ratio(habits.summonOne, habits.summonHigher)} lần đầu trận.` : `Không. Gọi quái sao cao hơn ${ratio(habits.summonHigher, habits.summonOne)} lần.` : `Chưa rõ. 1 sao ${ratio(habits.summonOne, habits.summonHigher)}.`
		},
		{
			title: "Tràn sân",
			text: style.ready ? style.flood ? `Có. ${ratio(habits.floodGames, habits.holdGames)} ván gọi từ 2 quái trong 3 lượt đầu.` : `Không. ${ratio(habits.holdGames, habits.floodGames)} ván chỉ gọi ít.` : `Chưa rõ. Tràn ${ratio(habits.floodGames, habits.holdGames)}.`
		},
		{
			title: "Học thêm",
			text: style.preferFace === null && style.blockEager === null && style.spellDraw === null ? "Chưa bổ sung. Cần rõ 3 mục trên và thêm vài nước đánh, chặn, rút bài." : [
				style.preferFace === null ? "Đánh người: chưa rõ" : style.preferFace ? "Hay đánh người" : "Hay đánh quái",
				style.blockEager === null ? "Chặn: chưa rõ" : style.blockEager ? "Hay chặn" : "Hay chịu",
				style.spellDraw === null ? "Rút bài: chưa rõ" : style.spellDraw ? "Hay rút phép" : "Hay rút quái"
			].join(". ") + "."
		}
	];
}
//#endregion
export { warmMatchHistory as _, exportStoredHistory as a, freshScratch as c, matchHistoryProblem as d, newMatchId as f, saveHabits as g, readStyle as h, diagnoseHistory as i, loadHabits as l, openingDecks as m, absorb as n, findFusion as o, noteFinishedAi as p, clearHabits as r, findKnightFusion as s, Painted as t, loadMatchHistory as u, watchLines as v, watchSnap as y };
