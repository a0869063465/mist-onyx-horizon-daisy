import { C as spellCard, _ as monsterCard, m as deckLegal, n as DEFAULT_DECK, r as FORMS } from "./catalog-DOYBjZ9O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/deck-DAKxYBzq.js
var KEY = "clash-beasts-deck";
var BOOK_KEY = "clash-deck-book";
var RAISED_KEY = "clash-deck-raised";
var outside = new Set(FORMS.map((card) => card.id));
function playableMonster(id) {
	return Boolean(monsterCard(id)) && !outside.has(id);
}
function deckIssues(deck) {
	const monsters = deck.monsters.filter(playableMonster);
	const spells = deck.spells.filter((id) => spellCard(id));
	if (new Set(monsters).size !== monsters.length || new Set(spells).size !== spells.length) return "Mỗi lá chỉ được một bản.";
	if (spells.filter((id) => spellCard(id)?.env).length > 1) return "Chỉ được một lá môi trường.";
	if (!deckLegal(monsters.length, spells.length)) return "Cần đúng 24 lá: quái 13–17, phép 7–11.";
	return null;
}
function deckBalance(deck) {
	const side = (count, min, max) => {
		if (count < min) return {
			sign: "-",
			n: min - count,
			bad: true
		};
		if (count > max) return {
			sign: "+",
			n: count - max,
			bad: true
		};
		return {
			sign: "+",
			n: count - min,
			bad: false
		};
	};
	return {
		monster: side(deck.monsters.length, 13, 17),
		spell: side(deck.spells.length, 7, 11)
	};
}
function clean(deck) {
	return {
		monsters: (deck?.monsters ?? []).filter(playableMonster),
		spells: (deck?.spells ?? []).filter((id) => spellCard(id))
	};
}
function sameDeck(a, b) {
	return a.monsters.length === b.monsters.length && a.spells.length === b.spells.length && a.monsters.every((id, index) => id === b.monsters[index]) && a.spells.every((id, index) => id === b.spells[index]);
}
function keptIds(list, ok) {
	if (!Array.isArray(list)) return [];
	const next = [];
	for (const id of list) {
		if (typeof id !== "string" || !ok(id) || next.includes(id)) continue;
		next.push(id);
	}
	return next;
}
function raiseDefaultDeck() {
	if (typeof localStorage === "undefined" || localStorage.getItem(RAISED_KEY) === "1") return;
	const base = {
		monsters: [...DEFAULT_DECK.monsters],
		spells: [...DEFAULT_DECK.spells]
	};
	const rows = [];
	try {
		const raw = localStorage.getItem(BOOK_KEY);
		const data = raw ? JSON.parse(raw) : null;
		const used = /* @__PURE__ */ new Set();
		if (data && Array.isArray(data.decks)) for (const item of data.decks) {
			if (!item || typeof item !== "object") continue;
			const row = item;
			const n = Number(row.n);
			if (!Number.isInteger(n) || n < 1 || used.has(n)) continue;
			used.add(n);
			rows.push({
				n,
				name: typeof row.name === "string" && row.name.trim() ? row.name.slice(0, 40) : `Bộ ${n}`,
				monsters: keptIds(row.monsters, playableMonster),
				spells: keptIds(row.spells, (id) => Boolean(spellCard(id)))
			});
		}
	} catch {
		rows.length = 0;
	}
	rows.sort((a, b) => a.n - b.n);
	let saved = null;
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const deck = clean(JSON.parse(raw));
			if (deck.monsters.length + deck.spells.length > 0) saved = deck;
		}
	} catch {
		saved = null;
	}
	if (saved && !sameDeck(saved, base) && !rows.some((row) => sameDeck(row, saved))) rows.push({
		n: 0,
		name: "Bộ riêng",
		monsters: [...saved.monsters],
		spells: [...saved.spells]
	});
	const hit = rows.findIndex((row) => sameDeck(row, base));
	const top = hit >= 0 ? rows.splice(hit, 1)[0] : {
		n: 1,
		name: "Lv 1 Meta deck",
		monsters: base.monsters,
		spells: base.spells
	};
	if (!top.name.trim()) top.name = "Lv 1 Meta deck";
	for (const row of rows) if (row.name === "Lv 1 Meta deck") row.name = "Bộ riêng";
	const decks = [top, ...rows].map((row, index) => ({
		...row,
		n: index + 1
	}));
	localStorage.setItem(BOOK_KEY, JSON.stringify({
		active: 1,
		decks
	}));
	localStorage.setItem(KEY, JSON.stringify({
		monsters: base.monsters,
		spells: base.spells
	}));
	localStorage.setItem(RAISED_KEY, "1");
}
function loadDeck() {
	if (typeof localStorage === "undefined") return DEFAULT_DECK;
	raiseDefaultDeck();
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return DEFAULT_DECK;
		const deck = clean(JSON.parse(raw));
		if (deck.monsters.length + deck.spells.length === 0) return DEFAULT_DECK;
		return deck;
	} catch {
		return DEFAULT_DECK;
	}
}
function saveDeck(deck) {
	localStorage.setItem(KEY, JSON.stringify({
		monsters: deck.monsters,
		spells: deck.spells
	}));
}
//#endregion
export { saveDeck as a, raiseDefaultDeck as i, deckIssues as n, loadDeck as r, deckBalance as t };
