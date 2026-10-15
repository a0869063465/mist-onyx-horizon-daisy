import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as tr, E as plainCopy, F as unlockSound, N as soundOn, O as playCue, S as setLang, d as loadBoard, j as setSound, p as loadField, u as loadAlertLook, w as useLang, x as CopyText } from "./router-D9l-mBhf.mjs";
import { C as spellCard, _ as monsterCard, c as artSrc, d as attackLabel, h as isStill, i as MONSTERS, n as DEFAULT_DECK, o as MONSTER_CHIPS, p as chipLabel, r as FORMS, s as SPELLS, u as askLabel, w as spellSrc } from "./catalog-DOYBjZ9O.mjs";
import { t as CardFace } from "./card-face-C68Pz_14.mjs";
import { r as loadDeck } from "./deck-DAKxYBzq.mjs";
import { i as pushDuel, r as pollRoom } from "./net-room-BL71IoEz.mjs";
import { _ as warmMatchHistory, c as freshScratch, f as newMatchId, g as saveHabits, h as readStyle, l as loadHabits, m as openingDecks, n as absorb, o as findFusion, p as noteFinishedAi, s as findKnightFusion, t as Painted, u as loadMatchHistory, y as watchSnap } from "./habits-E9sSgm9g.mjs";
import { B as spellFxLook, C as fireBlastOn, L as skillVisual, b as emitFx, c as LaserBeam, d as ShieldBurst, f as Spectacle, o as FireBurst, p as WaterBurst, s as LASER_MS, t as BoltBurst } from "./card-fx-DwrPXICI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play-DYBuPf55.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function emptyLean() {
	return {
		ready: false,
		games: 0,
		used: 0,
		wins: 0,
		losses: 0,
		concedes: 0,
		face: 0,
		monster: 0,
		spell: 0,
		skill: 0,
		summon: 0,
		spend: 0,
		lowStar: 0,
		counts: {
			face: 0,
			monster: 0,
			spell: 0,
			skill: 0,
			summon: 0,
			end: 0,
			spent: 0,
			kept: 0,
			lowStar: 0,
			highStar: 0
		}
	};
}
function clamp(n) {
	if (!Number.isFinite(n)) return 0;
	return Math.max(-12, Math.min(12, n));
}
function side(yes, no) {
	const total = yes + no;
	if (total < 6) return 0;
	return clamp((yes / total - .5) * 2 * 12);
}
function eventList(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	if (row.mode !== "ai") return null;
	if (row.winner !== 0 && row.winner !== 1 && row.winner !== null) return null;
	if (!Array.isArray(row.events)) return null;
	return row.events;
}
function chosen(event) {
	return event.actor === 0 && event.ok === true && event.auto !== true;
}
function learnFrom(input) {
	if (!Array.isArray(input)) return emptyLean();
	const lean = emptyLean();
	for (const item of input) {
		const events = eventList(item);
		if (!events) continue;
		const row = item;
		lean.games += 1;
		if (events.some((event) => event && event.kind === "concede" && event.actor === 0 && event.ok === true)) {
			lean.concedes += 1;
			continue;
		}
		if (row.winner === 0) lean.wins += 1;
		else if (row.winner === 1) lean.losses += 1;
		lean.used += 1;
		let previous = null;
		for (const event of events) {
			if (!event || typeof event !== "object") continue;
			const orb = Array.isArray(event.orb) ? event.orb[0] : null;
			if (chosen(event)) {
				if (event.kind === "attack-face") lean.counts.face += 1;
				else if (event.kind === "attack-monster") lean.counts.monster += 1;
				else if (event.kind === "spell") lean.counts.spell += 1;
				else if (event.kind === "skill") lean.counts.skill += 1;
				else if (event.kind === "summon") {
					lean.counts.summon += 1;
					const stars = typeof event.cardId === "string" ? monsterCard(event.cardId)?.stars : void 0;
					if (stars === 1) lean.counts.lowStar += 1;
					else if (typeof stars === "number") lean.counts.highStar += 1;
				} else if (event.kind === "end-turn") lean.counts.end += 1;
				if (typeof orb === "number" && previous !== null && orb < previous && (event.kind === "spell" || event.kind === "skill" || event.kind === "summon" || event.kind === "draw" || event.kind === "fuse")) lean.counts.spent += 1;
				if (event.kind === "end-turn" && typeof orb === "number" && orb >= 2) lean.counts.kept += 1;
			}
			if (typeof orb === "number") previous = orb;
		}
	}
	if (lean.used < 4) return lean;
	lean.ready = true;
	lean.face = side(lean.counts.face, lean.counts.monster);
	lean.monster = side(lean.counts.monster, lean.counts.face);
	lean.spell = side(lean.counts.spell, lean.counts.skill);
	lean.skill = side(lean.counts.skill, lean.counts.spell);
	lean.summon = side(lean.counts.summon, lean.counts.end);
	lean.spend = side(lean.counts.spent, lean.counts.kept);
	lean.lowStar = side(lean.counts.lowStar, lean.counts.highStar);
	return lean;
}
function readLean() {
	try {
		return learnFrom(loadMatchHistory());
	} catch {
		return emptyLean();
	}
}
function chooseSwing(canFace, canMonster, lean) {
	if (!lean.ready) return "default";
	if (canFace && lean.face > lean.monster && lean.face > 0) return "face";
	if (canMonster && lean.monster > lean.face && lean.monster > 0) return "monster";
	return "default";
}
var STAR_COST = [
	1,
	3,
	6,
	10
];
function shuffle(list) {
	const next = [...list];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const swap = next[i];
		next[i] = next[j];
		next[j] = swap;
	}
	return next;
}
function asPile(id, hp, maxHp) {
	const card = monsterCard(id);
	const cap = maxHp ?? card?.hp ?? 1;
	return {
		id,
		maxHp: cap,
		hp: Math.max(0, Math.min(cap, hp ?? cap))
	};
}
function pileFromField(mon) {
	const { uid: _uid, ...saved } = mon;
	const cap = saved.maxHp || saved.hp;
	return {
		id: saved.cardId,
		maxHp: cap,
		hp: Math.max(0, Math.min(cap, saved.hp)),
		saved
	};
}
function pileNow(card) {
	return card.saved ? Math.min(card.hp, card.saved.hp) : card.hp;
}
function woundPile(card, dmg) {
	const hp = pileNow(card) - dmg;
	if (hp <= 0) return null;
	return {
		...card,
		hp,
		saved: card.saved ? {
			...card.saved,
			hp
		} : card.saved
	};
}
var LIFE = 16;
function emptyPlayer(monsters, spells) {
	const env = spells.find((id) => spellCard(id)?.env);
	const monsterDeck = shuffle(monsters).map((id) => asPile(id));
	const reserve = monsterDeck.splice(0, 2);
	const spellDeck = shuffle(spells.filter((id) => id !== env));
	const spellTax = spellDeck.map(() => false);
	const openingSpell = spellDeck.shift();
	const openingToll = openingSpell ? Boolean(spellTax.shift()) : false;
	return {
		hp: LIFE,
		stars: 0,
		starGems: 0,
		orb: 1,
		flask: 0,
		reserve,
		hand: openingSpell ? [openingSpell] : [],
		tolls: openingSpell ? [openingToll] : [],
		monsterDeck,
		spellDeck,
		spellTax,
		spent: [],
		field: [
			null,
			null,
			null
		],
		draws: 0,
		summons: 0,
		acted: false,
		turns: 0,
		attackLock: 0,
		mirror: 0,
		env,
		sea: env === "bien-sau",
		roster: [...monsters]
	};
}
function pour(orb, flask, gain) {
	const pool = orb + Math.min(1, Math.max(0, flask)) + gain;
	const nextOrb = Math.min(3, pool);
	return {
		orb: nextOrb,
		flask: Math.min(1, pool - nextOrb)
	};
}
function refill(player) {
	const angels = player.field.filter((mon) => mon?.cardId === "quai-thu-thien-su").length;
	return {
		...player,
		...pour(player.orb, player.flask, 1 + angels),
		draws: 0,
		summons: 0,
		aside: 0,
		acted: false
	};
}
function createDuel(deck = DEFAULT_DECK, mode = "ai", foeDeck) {
	const other = foeDeck ?? deck;
	const players = [refill(emptyPlayer(deck.monsters, deck.spells)), refill(emptyPlayer(other.monsters, other.spells))];
	if (mode === "test") for (const player of players) {
		player.stars = 4;
		player.starGems = 0;
		player.orb = 3;
		player.flask = 1;
		player.turns = 1;
	}
	return {
		players,
		turn: 0,
		opening: mode !== "test",
		step: "main",
		pending: null,
		hold: null,
		log: [],
		events: [],
		live: "",
		stepNo: 0,
		winner: null,
		seq: 1,
		mode,
		fx: 1,
		tone: "info",
		starPing: null,
		glimpse: null,
		echo: null,
		last: null,
		upkeep: null,
		legs: null,
		clock: 1,
		past: {},
		now: {},
		born: {}
	};
}
function unperiod(line) {
	if (line.includes("\n")) return line;
	return line.replace(/[.。]+\s*$/u, "");
}
var wardLines = [];
function boardStats(state) {
	return {
		hp: [state.players[0].hp, state.players[1].hp],
		orb: [state.players[0].orb, state.players[1].orb],
		stars: [state.players[0].stars, state.players[1].stars]
	};
}
function freshId(events) {
	let max = 0;
	for (const row of events) {
		const found = /^e(\d+)$/.exec(row.id ?? "");
		if (found) max = Math.max(max, Number(found[1]));
	}
	return `e${max + 1}`;
}
function traced(before, after, event) {
	const start = before.events?.length ?? 0;
	const current = after.events ?? [];
	if (event.kind !== "result" && current.slice(start).some((row) => row.kind === event.kind && row.actor === event.actor)) return after;
	const row = {
		cause: null,
		auto: false,
		hit: null,
		...event,
		n: start + 1,
		id: freshId(current),
		...boardStats(after)
	};
	const events = [
		...current.slice(0, start),
		row,
		...current.slice(start)
	].map((item, index) => ({
		...item,
		n: index + 1
	}));
	return {
		...after,
		events
	};
}
function debtSum(mon) {
	if (!mon?.debt) return 0;
	return mon.debt[0].p + mon.debt[0].s + mon.debt[0].t + mon.debt[1].p + mon.debt[1].s + mon.debt[1].t;
}
function causeOf(state) {
	const rows = state.events ?? [];
	for (let i = rows.length - 1; i >= 0; i -= 1) {
		const row = rows[i];
		if (!row || row.auto || !row.ok) continue;
		if (row.kind === "result" || row.kind === "pass" || row.kind === "win" || row.kind === "block" || row.kind === "wall" || row.kind === "cover") continue;
		return {
			id: row.id ?? null,
			actor: row.actor,
			cardId: row.cardId
		};
	}
	return {
		id: null,
		actor: state.turn,
		cardId: null
	};
}
function collectHits(before, after, flags) {
	const notes = [];
	for (const side of [0, 1]) {
		const previousHp = before.players[side].hp;
		const nextHp = after.players[side].hp;
		if (nextHp < previousHp) notes.push({
			who: side,
			to: "face",
			cardId: null,
			uid: null,
			before: previousHp,
			after: nextHp,
			dealt: previousHp - nextHp,
			blocked: flags.blocked,
			reflect: flags.reflect,
			delayed: false
		});
		const older = new Map(before.players[side].field.flatMap((mon) => mon ? [[mon.uid, mon]] : []));
		const still = new Set(after.players[side].field.flatMap((mon) => mon ? [mon.uid] : []));
		for (const mon of after.players[side].field) {
			if (!mon) continue;
			const prev = older.get(mon.uid);
			if (!prev) continue;
			const queued = debtSum(mon) - debtSum(prev);
			if (!(mon.hp < prev.hp) && queued <= 0) continue;
			notes.push({
				who: side,
				to: "monster",
				cardId: mon.cardId,
				uid: mon.uid,
				before: prev.hp,
				after: mon.hp,
				dealt: Math.max(0, prev.hp - mon.hp),
				blocked: flags.blocked,
				reflect: flags.reflect,
				delayed: flags.turn ? queued < 0 : queued > 0
			});
		}
		for (const [uid, prev] of older) {
			if (still.has(uid) || prev.hp <= 0) continue;
			notes.push({
				who: side,
				to: "monster",
				cardId: prev.cardId,
				uid,
				before: prev.hp,
				after: 0,
				dealt: prev.hp,
				blocked: flags.blocked,
				reflect: flags.reflect,
				delayed: flags.turn && debtSum(prev) > 0
			});
		}
	}
	if (notes.length === 0 && flags.blocked) {
		const uid = before.hold?.blocker;
		const mon = uid ? before.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null : null;
		if (mon) {
			const owner = before.players[0].field.some((unit) => unit?.uid === mon.uid) ? 0 : 1;
			const now = after.players[owner].field.find((unit) => unit?.uid === mon.uid);
			notes.push({
				who: owner,
				to: "monster",
				cardId: mon.cardId,
				uid: mon.uid,
				before: mon.hp,
				after: now?.hp ?? mon.hp,
				dealt: 0,
				blocked: true,
				reflect: flags.reflect,
				delayed: false
			});
		}
	}
	return notes;
}
function withResults(before, after, flags) {
	if (after === before) return after;
	const start = before.events?.length ?? 0;
	if ((after.events ?? []).slice(start).some((row) => row.kind === "result")) return after;
	const hits = collectHits(before, after, flags);
	if (hits.length === 0) return after;
	const cause = causeOf(after);
	let next = after;
	for (const hit of hits) next = {
		...next,
		events: (() => {
			const current = next.events ?? [];
			const row = {
				n: current.length + 1,
				id: freshId(current),
				actor: cause.actor,
				kind: "result",
				ok: true,
				auto: true,
				cause: cause.id,
				cardId: cause.cardId,
				target: hit.to === "face" ? { kind: "face" } : {
					kind: "monster",
					cardId: hit.cardId,
					uid: hit.uid
				},
				hit,
				end: null,
				...boardStats(next)
			};
			return [...current, row];
		})()
	};
	return next;
}
function traceSkill(before, after, uid, targetUid) {
	if (after === before) return after;
	const mon = before.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
	const face = after.pending?.kind === "face" && Boolean(after.pending.skill);
	const beam = after.pending?.kind === "beam" && after.pending.caster === uid;
	const changed = after.players !== before.players || after.winner !== before.winner || after.reel !== before.reel;
	const ok = face || beam || changed;
	if (!ok && after.upkeep && !before.upkeep && after.players === before.players) return after;
	if (!ok && after.fx === before.fx && after.pending === before.pending) return after;
	const target = face ? { kind: "face" } : targetUid ? monsterTarget(before, targetUid) : null;
	return traced(before, after, {
		kind: "skill",
		actor: before.turn,
		ok,
		cardId: mon?.cardId ?? null,
		target,
		end: null
	});
}
function monsterTarget(state, uid) {
	if (!uid) return null;
	return {
		kind: "monster",
		cardId: state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid)?.cardId ?? null,
		uid
	};
}
function note(state, line, tone = "info") {
	const stepNo = state.stepNo + 1;
	const extra = state.starPing ? ` ${sideName(state.starPing.side)} có thể triệu hồi quái thú ${state.starPing.stars} sao` : "";
	const ward = wardLines.length ? ` ${wardLines.splice(0).join(" ")}` : "";
	const text = unperiod(`${stepNo}. ${unperiod(line)}${ward}${extra}`);
	return soulSync(reapVirus({
		...state,
		starPing: null,
		stepNo,
		fx: state.fx + 1,
		tone,
		skill: null,
		log: [...state.log, text],
		live: text,
		mends: null
	}));
}
function pingStars(state, side, before, after) {
	if (after <= before) return state;
	return {
		...state,
		starPing: {
			side,
			stars: after
		}
	};
}
function departed(before, after) {
	const stay = new Set(after.filter((mon) => Boolean(mon)).map((mon) => mon.uid));
	return before.filter((mon) => Boolean(mon && !stay.has(mon.uid))).map((mon) => mon.cardId);
}
function patch(state, side, player) {
	const prev = state.players[side];
	const gone = [...departed(prev.field, player.field), ...prev.env && prev.env !== player.env ? [prev.env] : []];
	const spent = [...player.spent ?? prev.spent ?? [], ...gone];
	const players = [...state.players];
	players[side] = tidyHats({
		...player,
		spent
	});
	let born = state.born;
	player.field.forEach((mon, slot) => {
		if (!mon || born?.[mon.uid]) return;
		born = {
			...born ?? {},
			[mon.uid]: {
				mon: structuredClone(mon),
				slot
			}
		};
	});
	return {
		...state,
		players,
		born
	};
}
function cardOf(mon) {
	if (mon.cardId === "mu") return {
		id: "mu",
		name: "Mũ",
		stars: 0,
		gems: 0,
		atk: 0,
		def: 0,
		mdef: 0,
		hp: 1,
		art: "mu",
		skill: ""
	};
	const card = monsterCard(mon.cardId);
	if (!card) throw new Error(mon.cardId);
	if (mon.cardId === "te-giac-be-con") return {
		...card,
		name: rhinoForm(mon.level ?? 1).name
	};
	return card;
}
var RHINO_IDS = [
	"te-giac-be-con",
	"te-giac-hieu-thang",
	"te-giac-chien-binh"
];
function rhinoForm(level) {
	const card = monsterCard(RHINO_IDS[Math.min(3, Math.max(1, level)) - 1]);
	const baby = skillText("te-giac-be-con");
	const text = (level >= 3 ? baby.split(/lv\s*3/i)[1] ?? "" : level === 2 ? (baby.split(/lv\s*2/i)[1] ?? "").split(/lv\s*3/i)[0] : "") || plainCopy(card?.skill || "");
	return {
		name: card?.name ?? "Tê giác",
		atk: grabNums(text, NUM_ATK)[0] ?? card?.atk ?? 0,
		def: grabNums(text, NUM_DEF)[0] ?? card?.def ?? 0,
		mdef: grabNums(text, NUM_MDEF)[0] ?? card?.mdef ?? 0,
		hp: grabNums(text, NUM_HP)[0] ?? card?.hp ?? 1
	};
}
function fieldName(mon) {
	if (mon.cardId === "mu") return "Mũ";
	if (mon.cardId === "te-giac-be-con") return rhinoForm(mon.level ?? 1).name;
	return monsterCard(mon.cardId)?.name ?? "";
}
function clashGrow(mon) {
	if (mon.cardId !== "te-giac-be-con" || (mon.level ?? 1) < 3 || mon.hp <= 0) return mon;
	const maxHp = (mon.maxHp || mon.hp) + 1;
	return {
		...mon,
		maxHp,
		hp: mon.hp + 1,
		raised: markRaised(mon, { hp: 1 })
	};
}
function rhinoRankCost(level) {
	const costs = grabNums(skillText("te-giac-be-con"), /tiêu(?:\s*hao)?\s*(\d+)\s*mana/gi);
	if (level >= 2) return costs[1] ?? 2;
	return costs[0] ?? 1;
}
function isSpecial(mon) {
	if (mon.cardId === "te-giac-chien-binh") return false;
	if (mon.cardId === "te-giac-hieu-thang") return true;
	return mon.cardId === "te-giac-be-con" && (mon.level ?? 1) < 3;
}
function evolveSpecial(mon) {
	const form = rhinoForm(3);
	const missing = Math.max(0, (mon.maxHp || mon.hp) - mon.hp);
	const maxHp = form.hp;
	return {
		...mon,
		cardId: "te-giac-be-con",
		level: 3,
		atk: form.atk,
		def: form.def,
		mdef: form.mdef,
		maxHp,
		hp: Math.max(1, maxHp - missing)
	};
}
function evolveImmortal(mon) {
	if (mon.cardId !== "rong-con") return mon;
	const card = monsterCard("rong-ngan-tuoi");
	if (!card) return mon;
	const missing = Math.max(0, (mon.maxHp || mon.hp) - mon.hp);
	const maxHp = card.hp;
	return {
		...mon,
		cardId: card.id,
		level: 1,
		atk: card.atk,
		def: card.def,
		mdef: card.mdef,
		maxHp,
		hp: Math.max(1, maxHp - missing),
		raised: void 0
	};
}
function timeWave(mon, enemy) {
	if (enemy) {
		if (!isImmortal(mon)) return null;
		return mon.cardId === "rong-con" ? evolveImmortal(mon) : buffMon(mon);
	}
	if (cardStars(mon.cardId, mon.level ?? 1) >= 3) return mon;
	if (isImmortal(mon)) return evolveImmortal(mon);
	if (isSpecial(mon)) return evolveSpecial(mon);
	return buffMon(mon);
}
function chronoChoice(state, casterUid, targetUid) {
	if (targetUid === casterUid) return null;
	const side = state.turn;
	const you = state.players[side];
	const foe = state.players[1 - side];
	const ally = you.field.find((unit) => unit?.uid === targetUid) ?? null;
	const enemy = foe.field.find((unit) => unit?.uid === targetUid) ?? null;
	if (!(ally ?? enemy)) return null;
	if (enemy && !canTargetFoe(state)) return null;
	if (enemy) return "kill";
	if (ally && isSpecial(ally)) return "evolve";
	return "age";
}
function chronoHighAlly(state, casterUid, targetUid) {
	const ally = state.players[state.turn].field.find((unit) => unit?.uid === targetUid && unit.uid !== casterUid) ?? null;
	if (!ally || isSpecial(ally) || isImmortal(ally)) return false;
	return cardStars(ally.cardId, ally.level ?? 1) >= 3;
}
function isImmortal(mon) {
	return mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi";
}
function pct35(n) {
	return Math.round(n * .35);
}
function markRaised(mon, part) {
	const cur = mon.raised ?? {
		atk: 0,
		def: 0,
		mdef: 0,
		hp: 0
	};
	return {
		atk: cur.atk + (part.atk ?? 0),
		def: cur.def + (part.def ?? 0),
		mdef: cur.mdef + (part.mdef ?? 0),
		hp: cur.hp + (part.hp ?? 0)
	};
}
function ageMon(mon) {
	const cut = (n) => Math.max(0, n - pct35(n));
	const atk = cut(mon.atk);
	const def = cut(mon.def);
	const mdef = cut(mon.mdef);
	const base = mon.maxHp || mon.hp;
	const maxHp = Math.max(1, base - pct35(base));
	const hp = Math.max(0, Math.min(maxHp, mon.hp - pct35(mon.hp)));
	const raised = mon.raised ? {
		atk: Math.max(0, mon.raised.atk - (mon.atk - atk)),
		def: Math.max(0, mon.raised.def - (mon.def - def)),
		mdef: Math.max(0, mon.raised.mdef - (mon.mdef - mdef)),
		hp: Math.max(0, mon.raised.hp - (base - maxHp))
	} : void 0;
	return {
		...mon,
		atk,
		def,
		mdef,
		maxHp,
		hp,
		raised
	};
}
var TIME_WEDGE = [
	2,
	1,
	1,
	2,
	1,
	1
];
function rollTimeSector() {
	let roll = Math.floor(Math.random() * 8);
	for (let index = 0; index < TIME_WEDGE.length; index += 1) {
		if (roll < TIME_WEDGE[index]) return index;
		roll -= TIME_WEDGE[index];
	}
	return 0;
}
function wheelLanded(extra) {
	if (extra === "hit") return true;
	if (extra === "miss") return false;
	return rollTimeSector() % 3 === 0;
}
function breakWitch(state, side, owner, uid, beforeStars) {
	const field = owner.field.map((unit) => unit?.uid === uid ? {
		...unit,
		hp: 0
	} : unit);
	return note(pingStars(patch(state, side, dropDead({
		...owner,
		field
	})), side, beforeStars, owner.stars), `Vòng quay trượt. ${monsterCard("phu-thuy-thoi-gian")?.name ?? "Phù thuỷ thời gian"} tự huỷ.`, "spell");
}
function buffMon(mon) {
	const atk = pct35(mon.atk);
	if (mon.cage) return {
		...mon,
		atk: mon.atk + atk,
		raised: markRaised(mon, { atk })
	};
	const def = pct35(mon.def);
	const mdef = pct35(mon.mdef);
	const hp = pct35(mon.maxHp || mon.hp);
	return {
		...mon,
		atk: mon.atk + atk,
		def: mon.def + def,
		mdef: mon.mdef + mdef,
		maxHp: (mon.maxHp || mon.hp) + hp,
		hp: mon.hp + hp,
		raised: markRaised(mon, {
			atk,
			def,
			mdef,
			hp
		})
	};
}
function sideName(side) {
	return side === 0 ? "Bạn" : "Đối thủ";
}
function testGrant(state, side, cardId, ontoField) {
	if (state.mode !== "test" || state.winner || state.step === "over") return state;
	const you = state.players[side];
	const monster = monsterCard(cardId);
	const spell = spellCard(cardId);
	if (ontoField) {
		if (!monster) return state;
		const slot = you.field.findIndex((cell) => !cell);
		if (slot < 0) return note(state, "Hết ô trống.");
		const field = [...you.field];
		const next = place({
			...state,
			seq: state.seq + 1
		}, side, cardId);
		if (cardId === "kazura") next.dim = true;
		field[slot] = next;
		const vow = absorbVow({
			...you,
			field
		}, next.uid);
		const line = vow.eaten ? `${monster.name} bị hiến tế.` : `Thử triệu hồi ${monster.name}.`;
		return note(patch({
			...state,
			seq: state.seq + 2,
			rite: vow.eaten ? {
				side,
				slot,
				seq: state.seq + 1
			} : state.rite
		}, side, vow.player), line);
	}
	if (spell) return note(patch(state, side, {
		...you,
		hand: [...you.hand, cardId],
		tolls: [...handTolls(you), false]
	}), `Thử cầm phép ${spell.name}.`);
	if (!monster) return state;
	return note(patch(state, side, {
		...you,
		reserve: [...you.reserve, asPile(cardId)]
	}), `Thử cầm quái ${monster.name}.`);
}
function testEnv(state, side, cardId) {
	if (state.mode !== "test" || state.winner || state.step === "over") return state;
	const spell = spellCard(cardId);
	if (!spell?.env) return state;
	const you = state.players[side];
	return note(patch(state, side, {
		...you,
		env: cardId,
		sea: cardId === "bien-sau"
	}), `${spell.name} đã nằm trên sân.`);
}
function freshTestMon(state, side, mon) {
	const next = place(state, side, mon.cardId);
	next.uid = mon.uid;
	if (mon.cardId === "kazura") next.dim = true;
	return next;
}
function sameValue(left, right) {
	if (left === right) return true;
	if (left == null || right == null) return left == null && right == null;
	if (typeof left !== "object" || typeof right !== "object") return false;
	const a = left;
	const b = right;
	const keys = /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) if (!sameValue(a[key], b[key])) return false;
	return true;
}
function canTestReset(state) {
	if (state.mode !== "test" || state.winner || state.step === "over") return false;
	if (state.step !== "main" || state.pending || state.hold || state.echo || state.last || state.upkeep || state.legs || state.glimpse || state.reel) return true;
	return state.players.some((player, index) => {
		if (player.orb !== 3 || player.flask !== 1) return true;
		return player.field.some((mon) => mon && monsterCard(mon.cardId) && !sameValue(mon, freshTestMon(state, index, mon)));
	});
}
function testReset(state) {
	if (state.mode !== "test" || state.winner || state.step === "over") return state;
	const players = state.players.map((player, index) => {
		const side = index;
		const field = player.field.map((mon) => {
			if (!mon || !monsterCard(mon.cardId)) return mon;
			return freshTestMon(state, side, mon);
		});
		return {
			...player,
			field,
			orb: 3,
			flask: 1
		};
	});
	return note({
		...state,
		players,
		step: "main",
		pending: null,
		hold: null,
		echo: null,
		last: null,
		upkeep: null,
		legs: null,
		glimpse: null,
		reel: null
	}, "Reset quân bài và mana.");
}
function concede(state, side) {
	if (state.winner) return state;
	const winner = side === 0 ? 1 : 0;
	return traced(state, {
		...state,
		winner,
		step: "over",
		pending: null,
		hold: null,
		live: unperiod(`${sideName(winner)} thắng`)
	}, {
		kind: "concede",
		actor: side,
		ok: true,
		cardId: null,
		target: null,
		end: "concede"
	});
}
function grantUsed(player, amount) {
	let starGems = player.starGems + amount;
	let stars = player.stars;
	while (stars < STAR_COST.length && starGems >= STAR_COST[stars]) {
		starGems -= STAR_COST[stars];
		stars += 1;
	}
	return {
		...player,
		starGems,
		stars
	};
}
function bank(player, amount) {
	return {
		...grantUsed(player, amount),
		orb: player.orb - amount
	};
}
function pay$1(player, amount) {
	if (amount <= 0) return player;
	if (player.orb < amount) return null;
	return bank(player, amount);
}
function talkLock(state) {
	if (state.preyAsk) return note(state, "Hãy chọn có truy sát không.");
	if (state.parley && state.step === "main") return note(state, "Hãy chọn quái cho Đàm phán.");
	return null;
}
function freeTalk(state, run) {
	if (!state.parley) return run(state);
	const talk = state.parley;
	const snap = [state.players[0].orb, state.players[1].orb];
	let boosted = {
		...state,
		parley: null
	};
	for (const side of [0, 1]) {
		const you = boosted.players[side];
		boosted = patch(boosted, side, {
			...you,
			orb: you.orb + 40
		});
	}
	let restored = run(boosted);
	for (const side of [0, 1]) {
		const you = restored.players[side];
		const orb = Math.max(snap[side], you.orb - 40);
		if (orb !== you.orb) restored = patch(restored, side, {
			...restored.players[side],
			orb
		});
	}
	return {
		...restored,
		parley: restored.parley ?? talk
	};
}
function playBill(gems, tolled, orb, flask) {
	if (!tolled) return orb < gems ? `Cần ${gems} gem.` : null;
	if (gems >= 3) {
		if (orb < gems) return `Cần ${gems} gem.`;
		if (flask < 1) return "Cần 1 ngọc trong bình.";
		return null;
	}
	return orb < gems + 1 ? `Cần ${gems + 1} gem.` : null;
}
function payPlayed(player, gems, tolled) {
	if (!tolled) return pay$1(player, gems);
	if (gems >= 3) {
		const paid = pay$1(player, gems);
		const flask = Math.min(1, paid?.flask ?? 0);
		if (!paid || flask < 1) return null;
		return {
			...paid,
			flask: flask - 1
		};
	}
	return pay$1(player, gems + 1);
}
function handTolls(player) {
	return player.hand.map((_, index) => Boolean(player.tolls?.[index]));
}
function dropHandCard(player, index) {
	return {
		...player,
		hand: player.hand.filter((_, at) => at !== index),
		tolls: handTolls(player).filter((_, at) => at !== index)
	};
}
function digChoices(state, side) {
	const foe = state.players[1 - side];
	const seen = /* @__PURE__ */ new Set();
	const choices = [];
	for (const id of foe.spent ?? []) {
		if (seen.has(id)) continue;
		seen.add(id);
		if (monsterCard(id)) choices.push({
			id,
			kind: "monster"
		});
		else if (spellCard(id)) choices.push({
			id,
			kind: "spell"
		});
	}
	return choices;
}
function digGrave(state, handIndex, cardId) {
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
	const side = state.turn;
	const player = state.players[side];
	if (player.hand[handIndex] !== "ke-dao-mo") return state;
	const choice = digChoices(state, side).find((row) => row.id === cardId);
	if (!choice) return note(state, "Lá đó chưa rời sân.");
	const tolled = Boolean(player.tolls?.[handIndex]);
	const bill = playBill(0, tolled, player.orb, player.flask);
	if (bill) return note(state, bill);
	const paid = payPlayed(player, 0, tolled);
	if (!paid) return note(state, bill ?? "Cần gem.");
	const dropped = dropHandCard(paid, handIndex);
	let nextPlayer = {
		...dropped,
		spent: [...dropped.spent ?? [], "ke-dao-mo"]
	};
	if (choice.kind === "monster") nextPlayer = {
		...nextPlayer,
		reserve: [...nextPlayer.reserve, {
			...asPile(cardId),
			toll: true
		}]
	};
	else nextPlayer = {
		...nextPlayer,
		hand: [...nextPlayer.hand, cardId],
		tolls: [...handTolls(nextPlayer), true]
	};
	return patch({
		...state,
		seq: state.seq + 1
	}, side, nextPlayer);
}
function plainHat(mon) {
	const hp = Math.max(0, Math.min(1, mon.hp));
	return {
		...mon,
		cardId: "mu",
		hp,
		maxHp: 1,
		atk: 0,
		def: 0,
		mdef: 0,
		dim: true,
		noBlock: true,
		stun: 0,
		curse: false,
		vulnerable: 0,
		bleed: 0,
		chain: 0,
		gag: 0,
		poison: void 0,
		erode: void 0,
		wet: void 0,
		blessAtk: 0,
		blessDmg: 0,
		blessDef: 0,
		blessMdef: 0,
		hex: void 0,
		raised: void 0,
		buff: void 0,
		horn: void 0,
		gaze: void 0,
		clash: void 0,
		glass: void 0
	};
}
function tidyHats(player) {
	const field = player.field.map((mon) => {
		if (!mon || mon.cardId !== "mu") return mon;
		return mon.hp <= 0 ? null : plainHat(mon);
	});
	const reals = field.filter((mon) => mon && mon.cardId !== "mu").length;
	const tokens = field.filter((mon) => mon?.cardId === "mu").length;
	const hats = player.hats && !(reals === 1 && tokens === 0) && reals > 0 ? true : player.hats ? false : player.hats;
	return {
		...player,
		field,
		hats
	};
}
function mixRow(field) {
	const next = [...field];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const swap = next[i];
		next[i] = next[j];
		next[j] = swap;
	}
	return next;
}
function makeHat(seq, side, n) {
	return {
		uid: `${side}-mu-${seq}-${n}`,
		cardId: "mu",
		hp: 1,
		atk: 0,
		def: 0,
		mdef: 0,
		maxHp: 1,
		dim: true,
		blocksLeft: 0,
		stun: 0,
		stance: "attack",
		stanceUsed: false,
		bleed: 0,
		curse: false,
		vulnerable: 0,
		noBlock: true,
		charge: 0,
		held: false,
		copy: false,
		level: 1
	};
}
function place(state, side, cardId, held) {
	const card = monsterCard(cardId);
	if (!card) throw new Error(cardId);
	const used = /* @__PURE__ */ new Set();
	for (const player of state.players) for (const mon of player.field) if (mon) used.add(mon.uid);
	let seq = state.seq;
	let uid = `${side}-${seq}`;
	while (used.has(uid)) {
		seq += 1;
		uid = `${side}-${seq}`;
	}
	if (held?.saved) {
		const cap = held.saved.maxHp || held.maxHp;
		return {
			...held.saved,
			uid,
			hp: Math.min(held.hp, held.saved.hp, cap),
			maxHp: cap
		};
	}
	const maxHp = held?.maxHp ?? card.hp;
	return {
		uid,
		cardId,
		hp: held ? Math.min(held.hp, maxHp) : card.hp,
		atk: card.atk,
		def: card.def,
		mdef: card.mdef,
		dim: false,
		blocksLeft: card.name === "Lính chiến đá khổng lồ" ? 2 : 1,
		stun: 0,
		stance: "attack",
		stanceUsed: false,
		bleed: 0,
		curse: false,
		vulnerable: 0,
		noBlock: false,
		charge: 0,
		held: false,
		copy: false,
		level: 1,
		maxHp,
		...cardId === "kazura" ? { safe: 2 } : {},
		...cardId === "ken-ngai" || cardId === "chan-ken" ? { dim: true } : {},
		...isStill(cardId) ? { noBlock: true } : {},
		...cardId === "con-thinh-no-cua-hai-vuong" ? { oath: {
			phys: true,
			spell: true
		} } : {},
		...kingBless(state, side, cardId),
		...guardBless(state, side, cardId),
		...queenBless(state, side, cardId),
		...mysticBless(cardId)
	};
}
var KING = "hiep-si-cua-vua";
var GUARD_KNIGHT = "hiep-si-ho-ve";
var QUEEN_KNIGHT = "hiep-si-cua-hau";
var MYSTIC = "hiep-si-huyen-bi";
function knightTutor(field) {
	return field.some((mon) => mon && mon.hp > 0 && (mon.cardId === KING || mon.cardId === QUEEN_KNIGHT));
}
function mysticBless(cardId) {
	if (cardId !== MYSTIC) return {};
	return { oath: {
		phys: true,
		spell: true
	} };
}
function mysticDue(mon) {
	return mon.cardId === MYSTIC && !mon.horn && !mon.gaze && !mon.bolt;
}
function kingBless(state, side, cardId) {
	if (cardId !== KING) return {};
	if (!(state.players[side].roster ?? []).includes(QUEEN_KNIGHT)) return {};
	return {
		ward: "spell",
		wardStay: true
	};
}
function swordDue(mon) {
	return mon.cardId === KING && Boolean(mon.edge) && !mon.horn && !mon.gaze && !mon.bolt;
}
function guardBless(state, side, cardId) {
	if (cardId !== GUARD_KNIGHT) return {};
	const roster = state.players[side].roster ?? [];
	const oath = {
		...roster.includes(KING) ? { phys: true } : {},
		...roster.includes(QUEEN_KNIGHT) ? { spell: true } : {}
	};
	return oath.phys || oath.spell ? { oath } : {};
}
function queenBless(state, side, cardId) {
	if (cardId !== QUEEN_KNIGHT) return {};
	if (!(state.players[side].roster ?? []).includes(KING)) return {};
	return { oath: { phys: true } };
}
function hasOath(mon, kind) {
	return kind === "phys" ? Boolean(mon.oath?.phys) : Boolean(mon.oath?.spell);
}
var mysticSoak = /* @__PURE__ */ new Map();
function swallowOath(mon, kind, amount) {
	if (mon.cage || amount <= 0 || !hasOath(mon, kind)) return {
		mon,
		amount
	};
	const oath = { ...mon.oath ?? {} };
	if (kind === "phys") delete oath.phys;
	else delete oath.spell;
	let next = {
		...mon,
		oath: oath.phys || oath.spell ? oath : void 0
	};
	if (mon.cardId === MYSTIC) {
		const cur = mysticSoak.get(mon.uid) ?? {
			p: 0,
			s: 0
		};
		if (kind === "phys") cur.p += amount;
		else cur.s += amount;
		mysticSoak.set(mon.uid, cur);
		next = {
			...next,
			veil: true
		};
		wardLines.push(wardTag(kind));
		return {
			mon: next,
			amount: 0
		};
	}
	if (mon.cardId === GUARD_KNIGHT) {
		const due = next.debt?.[0] ?? {
			p: 0,
			s: 0,
			t: 0
		};
		const add = Math.round(amount * .6);
		const bank = {
			p: due.p + (kind === "phys" ? add : 0),
			s: due.s + (kind === "spell" ? add : 0),
			t: 0
		};
		const back = mon.guarding ? {
			...mon.oathBack ?? {},
			[kind]: true
		} : void 0;
		next = {
			...next,
			...back ? { oathBack: back } : {},
			debt: [{ ...bank }, {
				p: 0,
				s: 0,
				t: 0
			}]
		};
	}
	wardLines.push(wardTag(kind));
	return {
		mon: next,
		amount: 0
	};
}
function spareMysticVeil(before, after) {
	if (before.cardId === MYSTIC && !before.veil && after.veil) return {
		...after,
		veil: void 0
	};
	return after;
}
function settleMystic(before, after, foe, allies, active) {
	const soaked = mysticSoak.get(before.uid) ?? {
		p: 0,
		s: 0
	};
	mysticSoak.delete(before.uid);
	if (before.cardId !== MYSTIC) return {
		mon: after,
		foe
	};
	const lostPhys = Boolean(before.oath?.phys) && !after.oath?.phys;
	const lostSpell = Boolean(before.oath?.spell) && !after.oath?.spell;
	const mon = spareMysticVeil(before, after);
	if (!lostPhys && !lostSpell) return {
		mon,
		foe
	};
	const markBack = (body) => {
		if (!active && !before.guarding) return body;
		const back = { ...body.oathBack ?? {} };
		if (lostPhys) back.phys = true;
		if (lostSpell) back.spell = true;
		return {
			...body,
			oathBack: back
		};
	};
	if (!active || !foe) {
		const due = before.debt?.[0] ?? {
			p: 0,
			s: 0,
			t: 0
		};
		const bank = {
			p: due.p + Math.round(soaked.p * .6),
			s: due.s + Math.round(soaked.s * .6),
			t: 0
		};
		return {
			mon: markBack({
				...mon,
				debt: bank.p || bank.s ? [{ ...bank }, {
					p: 0,
					s: 0,
					t: 0
				}] : mon.debt
			}),
			foe
		};
	}
	const due = before.debt?.[0];
	let nextFoe = foe;
	if (due && ((due.p ?? 0) > 0 || (due.s ?? 0) > 0)) {
		nextFoe = landHell(foe, {
			phys: due.p,
			spell: due.s,
			tru: 0
		}, allies).mon;
		wardLines.push(`${cardOf(before).name} giải phóng ${due.p} sát thương vật lý và ${due.s} sát thương phép`);
	}
	const kept = {
		p: Math.round(soaked.p * .6),
		s: Math.round(soaked.s * .6),
		t: 0
	};
	const debt = kept.p || kept.s ? [{ ...kept }, {
		p: 0,
		s: 0,
		t: 0
	}] : void 0;
	return {
		mon: markBack({
			...mon,
			debt
		}),
		foe: nextFoe
	};
}
function settleGuard(mon) {
	if (!mon.oathBack && !mon.guarding && !mon.oathShot) return mon;
	const oath = { ...mon.oath ?? {} };
	if (mon.oathBack?.phys) oath.phys = true;
	if (mon.oathBack?.spell) oath.spell = true;
	return {
		...mon,
		oath: oath.phys || oath.spell ? oath : void 0,
		oathBack: void 0,
		guarding: void 0,
		oathShot: void 0,
		riposte: void 0
	};
}
var SEA_IDS$1 = /* @__PURE__ */ new Set([
	"trai-tim-hai-long",
	"sua-hut-ma-phap",
	"kraken"
]);
function isSea(id) {
	return SEA_IDS$1.has(id);
}
function held(mon) {
	return mon.stun > 0 || (mon.chain ?? 0) > 0;
}
function canIntercept(mon, committed = false) {
	if (!mon || mon.noBlock || mon.cage || (mon.path ?? 0) > 0 || hexLocked(mon)) return false;
	if ((held(mon) || mon.stun > 0) && !(committed && mon.guarding)) return false;
	if (!committed && mon.dim && mon.cardId !== "cuc-bong-ma-quai") return false;
	return true;
}
function barred(mon) {
	return held(mon) || (mon.gag ?? 0) > 0 || hexLocked(mon);
}
function guardBonus(mon) {
	return mon.cardId === "rong-boc-trung" && mon.stance === "guard" ? skillFigure(mon.cardId, "guard", 2) : 0;
}
function auraGuard(allies, mon) {
	if (!allies?.some((unit) => unit && unit.hp > 0 && unit.cardId === "yeu-tinh-chuc-phuc" && unit.uid !== mon.uid)) return 0;
	const parsed = skillFigure("yeu-tinh-chuc-phuc", "guard", 1);
	return parsed > 0 ? parsed : 1;
}
function dullHorn(mon, mode) {
	const next = mode === "splash" || mode === "plus" ? {
		...mon,
		horn: "plain"
	} : mon;
	return next.gaze ? {
		...next,
		gaze: void 0
	} : next;
}
var NOT_BEAST = /* @__PURE__ */ new Set([
	"phu-thuy-thoi-gian",
	"kiem-si-lua-thieng",
	"ky-si-bong-toi",
	"ga-he-dang-so",
	"phu-thuy-ti-hon",
	"phu-thuy-rung-den",
	"yeu-tinh-chuc-phuc",
	"quai-thu-thien-su",
	"ke-giam-ho-linh-hon",
	"ma-dao-si"
]);
function hornFit(cardId) {
	return !NOT_BEAST.has(cardId);
}
function harmShift(mon) {
	if (mon.stun > 0 || mon.bleed > 0 || mon.curse || mon.vulnerable > 0) return true;
	if ((mon.chain ?? 0) > 0 || (mon.gag ?? 0) > 0 || mon.poison || mon.erode) return true;
	if (mon.wet && mon.wet < 90) return true;
	if (mon.hex && mon.hex.left > 0) return true;
	return mon.noBlock && !isStill(mon.cardId);
}
function freshHarm(mon) {
	const part = {};
	if (mon.stun > 0) part.stun = grabNums(skillText("ong-khong-lo"), /(\d+)\s*lượt/gi)[0] ?? 5;
	if (mon.bleed > 0) part.bleed = mon.bleed;
	if (mon.curse) part.curse = true;
	if (mon.vulnerable > 0) part.vulnerable = mon.vulnerable;
	if ((mon.chain ?? 0) > 0) part.chain = grabNums(spellText("soi-xich-dia-nguc"), /(\d+)\s*lượt/gi)[0] ?? 2;
	if ((mon.gag ?? 0) > 0) part.gag = grabNums(spellText("thanh-guom-anh-sang"), /(\d+)\s*lượt/gi)[0] ?? 5;
	if (mon.poison) {
		const left = mon.poison.kind === "giant" ? 3 : mon.poison.kind === "queen" ? 5 : null;
		part.poison = {
			...mon.poison,
			left
		};
	}
	if (mon.erode) part.erode = {
		from: mon.erode.from,
		left: mon.erode.left === null ? null : mammothFightErode() ?? 2
	};
	if (mon.wet && mon.wet < 90) part.wet = 2;
	if (mon.hex && mon.hex.left > 0) part.hex = { left: 6 };
	if (mon.noBlock && !isStill(mon.cardId)) part.noBlock = true;
	return part;
}
function clearHarm(mon) {
	return {
		...mon,
		stun: 0,
		bleed: 0,
		curse: false,
		vulnerable: 0,
		chain: 0,
		gag: 0,
		poison: void 0,
		erode: void 0,
		wet: mon.wet && mon.wet >= 90 ? mon.wet : void 0,
		hex: void 0,
		noBlock: isStill(mon.cardId) ? true : false
	};
}
function liveDef(mon, allies) {
	const hex = mon.hex && mon.hex.left > 0 ? 2 : 0;
	if ((mon.chain ?? 0) > 0) return 0 - hex;
	if (mon.cage) return Math.max(0, mon.def - (mon.raised?.def ?? 0) - (mon.buff?.def ?? 0)) - hex;
	return mon.def + (mon.tempGuard ?? 0) + (mon.nextDef ?? 0) + guardBonus(mon) + (mon.clash?.def ?? 0) + auraGuard(allies, mon) - hex;
}
function liveMdef(mon, allies) {
	const hex = mon.hex && mon.hex.left > 0 ? 2 : 0;
	if ((mon.chain ?? 0) > 0) return 0 - hex;
	if (mon.cage) return Math.max(0, mon.mdef - (mon.raised?.mdef ?? 0) - (mon.buff?.mdef ?? 0)) - hex;
	return mon.mdef + (mon.tempGuard ?? 0) + guardBonus(mon) + (mon.clash?.mdef ?? 0) + auraGuard(allies, mon) - hex;
}
function rawAtk(mon) {
	let atk = mon.atk + (mon.blessAtk ?? 0) + (mon.clash?.atk ?? 0);
	if (mon.cardId === "rong-boc-trung" && mon.stance === "attack") atk += skillFigure(mon.cardId, "atk", 4);
	if (mon.cardId === "con-thinh-no-cua-hai-vuong") atk += 3 * (mon.stored ?? 0);
	return atk;
}
function liveAtk(mon) {
	const atk = rawAtk(mon);
	if (!mon.hex || mon.hex.left <= 0) return atk;
	return Math.max(0, atk - 3);
}
function hexLocked(mon) {
	if (!mon?.hex || mon.hex.left <= 0) return false;
	return rawAtk(mon) - 3 < 0;
}
function visibleStats(mon, allies) {
	const aura = auraGuard(allies, mon);
	const stanceAtk = mon.cardId === "rong-boc-trung" && mon.stance === "attack";
	return {
		atk: liveAtk(mon),
		def: liveDef(mon, allies),
		mdef: liveMdef(mon, allies),
		blueAtk: (mon.blessAtk ?? 0) > 0 || (mon.clash?.atk ?? 0) > 0 || stanceAtk || (mon.raised?.atk ?? 0) > 0 || mon.cardId === "con-thinh-no-cua-hai-vuong" && (mon.stored ?? 0) > 0,
		blueDef: !mon.cage && ((mon.tempGuard ?? 0) > 0 || (mon.nextDef ?? 0) > 0 || (mon.blessDef ?? 0) > 0 || guardBonus(mon) > 0 || (mon.clash?.def ?? 0) > 0 || aura > 0 || (mon.raised?.def ?? 0) > 0 || (mon.buff?.def ?? 0) > 0),
		blueMdef: !mon.cage && ((mon.tempGuard ?? 0) > 0 || (mon.blessMdef ?? 0) > 0 || guardBonus(mon) > 0 || aura > 0 || (mon.raised?.mdef ?? 0) > 0 || (mon.buff?.mdef ?? 0) > 0 || (mon.clash?.mdef ?? 0) > 0),
		blueHp: !mon.cage && ((mon.raised?.hp ?? 0) > 0 || (mon.clash?.maxHp ?? 0) > 0 || (mon.buff?.maxHp ?? 0) > 0)
	};
}
function livingLegs(field, host) {
	return field.filter((unit) => Boolean(unit && unit.cardId === "chan-ken" && unit.host === host && unit.hp > 0));
}
function shuntUid(field, uid) {
	if (!uid) return uid;
	const mon = field.find((unit) => unit?.uid === uid);
	if (!mon || mon.cardId !== "ken-ngai") return uid;
	const legs = livingLegs(field, mon.uid);
	if (legs.length === 0) return uid;
	return legs[Math.floor(Math.random() * legs.length)].uid;
}
function spray(field, hit, spare = []) {
	const hops = [];
	const spared = new Set(spare);
	for (const unit of field) {
		if (!unit || unit.cardId !== "ken-ngai") continue;
		const legs = livingLegs(field, unit.uid);
		if (legs.length === 0) continue;
		spared.add(unit.uid);
		hops.push(legs[Math.floor(Math.random() * legs.length)].uid);
	}
	let next = field.map((unit) => !unit || spared.has(unit.uid) ? unit : hit(unit, field));
	for (const uid of hops) {
		const leg = next.find((unit) => unit?.uid === uid);
		if (!leg || leg.hp <= 0) continue;
		const hurt = hit(leg, next);
		next = next.map((unit) => unit?.uid === uid ? hurt : unit);
	}
	return next;
}
function feedBull(mon, points) {
	const next = { ...mon };
	const heals = grabNums(skillText(mon.cardId), NUM_HEAL);
	const healCap = heals.length > 0 ? heals.reduce((sum, value) => sum + value, 0) : 2;
	const room = Math.max(0, (next.maxHp || next.hp) - next.hp);
	const heal = Math.min(points, healCap, room);
	next.hp += heal;
	let left = points - heal;
	let step = 0;
	const stepHp = skillFigure(mon.cardId, "max", 1);
	const stepAtk = skillFigure(mon.cardId, "atk", 1);
	const stepDef = skillFigure(mon.cardId, "guard", skillFigure(mon.cardId, "def", 1));
	while (left > 0) {
		if (step % 3 === 0) {
			next.maxHp = (next.maxHp || next.hp) + stepHp;
			next.hp += stepHp;
			next.raised = markRaised(next, { hp: stepHp });
		} else if (step % 3 === 1) {
			next.atk += stepAtk;
			next.raised = markRaised(next, { atk: stepAtk });
		} else {
			next.def += stepDef;
			next.mdef += stepDef;
			next.blessDef = (next.blessDef ?? 0) + stepDef;
			next.blessMdef = (next.blessMdef ?? 0) + stepDef;
		}
		left -= 1;
		step += 1;
	}
	return {
		mon: next,
		healed: heal
	};
}
function bullAward(mon, victimId, victimDead) {
	if (mon.cardId !== "dau-si-bo-tot" || !victimDead) return {
		mon,
		mend: 0
	};
	const stars = monsterCard(victimId)?.stars ?? 1;
	const fed = feedBull(mon, stars >= 4 ? 4 : stars >= 3 ? 3 : 2);
	return {
		mon: fed.mon,
		mend: fed.healed
	};
}
function kazuraSafe(mon) {
	return Boolean(mon && mon.cardId === "kazura" && (mon.safe ?? 0) > 0 && !mon.cage);
}
function clearClash(mon) {
	if (!mon.clash && !mon.blessAtk) return mon;
	const maxHp = Math.max(1, (mon.maxHp || mon.hp) - (mon.clash?.maxHp ?? 0));
	return {
		...mon,
		maxHp,
		hp: Math.min(mon.hp, maxHp),
		clash: void 0,
		blessAtk: mon.blessAtk && mon.dim ? 0 : mon.blessAtk
	};
}
function dropClash(mon) {
	if (!mon.clash) return mon;
	const maxHp = Math.max(1, (mon.maxHp || mon.hp) - mon.clash.maxHp);
	return {
		...mon,
		maxHp,
		hp: Math.min(mon.hp, maxHp),
		clash: void 0
	};
}
function releaseLegend(state) {
	let next = state;
	for (const side of [0, 1]) {
		const player = next.players[side];
		if (!player.field.some((mon) => mon?.cardId === "chien-binh-huyen-thoai" && mon.clash)) continue;
		const field = player.field.map((mon) => mon?.cardId === "chien-binh-huyen-thoai" && mon.clash ? dropClash(mon) : mon);
		next = patch(next, side, {
			...player,
			field
		});
	}
	return next;
}
function knightOpen(mon) {
	return Boolean(mon && mon.hp > 0 && mon.cardId === "ky-si-bong-toi" && !mon.clash && !(mon.path ?? 0));
}
function dropGuard(mon) {
	if (!mon.tempGuard) return mon;
	return {
		...mon,
		tempGuard: 0
	};
}
function spendBless(mon) {
	if (!mon.blessAtk && !mon.blessDmg && !mon.nextDef) return mon;
	return {
		...mon,
		blessAtk: 0,
		blessDmg: 0,
		nextDef: 0
	};
}
function applyPoison(mon, kind, from) {
	if (mon.hp <= 0) return mon;
	const current = mon.poison;
	if (kind === "giant") {
		if (current?.kind === "giant") return {
			...mon,
			poison: {
				...current,
				left: 3
			}
		};
		if (current) return mon;
		return {
			...mon,
			poison: {
				stacks: 1,
				left: 3,
				perfect: false,
				from,
				kind
			}
		};
	}
	if (kind === "queen") return {
		...mon,
		poison: {
			stacks: (current?.stacks ?? 0) + 1,
			left: 5,
			perfect: false,
			from,
			kind: "queen"
		}
	};
	return {
		...mon,
		poison: {
			stacks: (current?.stacks ?? 0) + 1,
			left: null,
			perfect: true,
			from,
			kind: "perfect"
		}
	};
}
function mothOf(age) {
	if (age >= 6) return "ngai-hoan-my";
	if (age >= 5) return "ngai-nu-hoang";
	return "ngai-khong-lo";
}
function hatchCocoon(mon) {
	const cardId = mothOf(mon.level ?? 0);
	const card = monsterCard(cardId);
	if (!card) return mon;
	return {
		...mon,
		cardId,
		atk: card.atk,
		def: card.def,
		mdef: card.mdef,
		hp: card.hp,
		maxHp: card.hp,
		host: void 0,
		level: 1,
		dim: false,
		noBlock: false
	};
}
function bloomCocoons(player) {
	const ripe = player.field.filter((mon) => mon?.cardId === "ken-ngai" && mon.hp > 0 && (mon.level ?? 0) >= 6);
	if (ripe.length === 0) return {
		player,
		line: ""
	};
	const ids = new Set(ripe.map((mon) => mon.uid));
	const drop = new Set(player.field.flatMap((mon) => mon?.host && ids.has(mon.host) ? [mon.uid] : []));
	const names = [];
	const field = player.field.map((mon) => {
		if (!mon || drop.has(mon.uid)) return null;
		if (!ids.has(mon.uid)) return mon;
		const born = hatchCocoon(mon);
		names.push(cardOf(born).name);
		return born;
	});
	return {
		player: {
			...player,
			field
		},
		line: names.map((name) => `${name} tự nở`).join(". ")
	};
}
function settleCocoon(player) {
	const hatching = player.field.filter((mon) => mon?.cardId === "ken-ngai" && mon.hp <= 0 && (mon.level ?? 0) >= 4).map((mon) => mon.uid);
	if (hatching.length === 0) return player;
	const drop = new Set(player.field.flatMap((mon) => mon?.host && hatching.includes(mon.host) ? [mon.uid] : []));
	return {
		...player,
		field: player.field.map((mon) => {
			if (!mon || drop.has(mon.uid)) return null;
			if (hatching.includes(mon.uid)) return hatchCocoon(mon);
			return mon;
		})
	};
}
function shuffleSea(player) {
	if (!player.sea) return player;
	const seats = player.field.map((mon, index) => mon && isSea(mon.cardId) ? index : -1).filter((index) => index >= 0);
	if (seats.length < 2) return player;
	const order = [...seats];
	for (let i = order.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const swap = order[i];
		order[i] = order[j];
		order[j] = swap;
	}
	const field = [...player.field];
	const bodies = seats.map((index) => field[index]);
	seats.forEach((index, at) => {
		field[order[at]] = bodies[at];
	});
	return {
		...player,
		field
	};
}
function lockIndex(player, index) {
	if (index < 0 || index > 2) return player;
	const locked = [...player.locked ?? [
		0,
		0,
		0
	]];
	locked[index] = 2;
	return {
		...player,
		locked
	};
}
function alive(field) {
	return field.map((mon) => mon && mon.hp > 0 ? mon : null);
}
function partnerId(id) {
	if (id === "kazura") return "kizuran";
	if (id === "kizuran") return "kazura";
	return "";
}
function spendPartners(allies, id, amount) {
	if (!allies || amount <= 0 || !id) return 0;
	const mates = allies.filter((mon) => mon && mon.cardId === id && mon.hp > 0);
	if (mates.length === 0) return 0;
	let left = amount;
	for (const mon of mates) {
		if (!mon || left <= 0) break;
		const have = mon.stored ?? 0;
		const used = Math.min(have, left);
		mon.stored = have - used;
		left -= used;
	}
	return amount - left;
}
function third(amount) {
	const n = Math.max(0, Math.floor(amount));
	const base = Math.floor(n / 3);
	return n % 3 === 2 ? base + 1 : base;
}
function pushDebt(mon, add) {
	if (mon.cardId !== "chien-binh-rong" || add.p <= 0 && add.s <= 0 && add.t <= 0) return mon;
	const cur = mon.debt ?? [{
		p: 0,
		s: 0,
		t: 0
	}, {
		p: 0,
		s: 0,
		t: 0
	}];
	return {
		...mon,
		debt: [{
			p: cur[0].p + add.p,
			s: cur[0].s + add.s,
			t: cur[0].t + add.t
		}, {
			p: cur[1].p + add.p,
			s: cur[1].s + add.s,
			t: cur[1].t + add.t
		}]
	};
}
function takePhysical(mon, raw, allies) {
	if (shadeHidden(mon)) {
		const pool = mon.stored ?? 1;
		const taken = Math.min(pool, Math.max(0, raw));
		const left = pool - taken;
		return {
			mon: left > 0 ? {
				...mon,
				stored: left
			} : {
				...mon,
				shown: void 0,
				stored: void 0
			},
			bite: taken,
			surplus: 0
		};
	}
	const gated = swallowOath(mon, "phys", raw);
	if (gated.mon !== mon) return {
		mon: gated.mon,
		bite: 0,
		surplus: 0
	};
	if (mon.cardId === "chien-binh-rong") {
		const slice = third(raw);
		const queued = pushDebt(mon, {
			p: slice,
			s: 0,
			t: 0
		});
		const soaked = soak(queued, "phys", hurt(queued, Math.max(0, slice - liveDef(queued, allies))));
		return applyIncoming(soaked.mon, soaked.amount, allies);
	}
	const def = liveDef(mon, allies);
	const soaked = soak(bankPlate(mon, "phys", Math.max(0, Math.min(raw, def))), "phys", hurt(mon, physical(raw, def)));
	return applyIncoming(soaked.mon, soaked.amount, allies);
}
function applyIncoming(mon, amount, allies, veilBudget) {
	let incoming = Math.max(0, amount);
	const cap = veilBudget !== void 0 ? veilBudget : mon.veil && incoming > 0 && mon.hp > 0 ? 2 : 0;
	if (cap > 0 && incoming > 0 && mon.hp > 0) incoming = Math.max(0, incoming - cap);
	const before = mon.hp;
	const bite = Math.min(incoming, Math.max(0, before));
	const surplus = incoming - bite;
	const left = bite - spendPartners(allies, partnerId(mon.cardId), bite);
	const stored = mon.cardId === "kizuran" ? (mon.stored ?? 0) + left : mon.stored;
	return {
		mon: {
			...mon,
			hp: before - left,
			stored
		},
		bite,
		surplus
	};
}
function mendHp(mon, amount) {
	if (amount <= 0 || mon.hp <= 0) return mon;
	const cap = mon.maxHp || mon.hp;
	return {
		...mon,
		hp: Math.min(cap, mon.hp + amount)
	};
}
function leechKazura(attacker, bite, surplus, allies) {
	if (attacker.cardId !== "kazura") return {
		attacker,
		allies
	};
	const healed = mendHp(attacker, surplus);
	let left = bite;
	const next = allies.map((mon) => {
		if (!mon || mon.cardId !== "kizuran" || mon.hp <= 0 || left <= 0) return mon;
		const room = Math.max(0, (mon.maxHp || mon.hp) - mon.hp);
		const gain = Math.min(room, left);
		left -= gain;
		return gain > 0 ? {
			...mon,
			hp: mon.hp + gain
		} : mon;
	});
	return {
		attacker: left > 0 ? {
			...healed,
			stored: (healed.stored ?? 0) + left
		} : healed,
		allies: next
	};
}
function redirectCover(field, uid) {
	if (!uid) return uid;
	const target = field.find((mon) => mon?.uid === uid);
	if (!target || target.cardId !== "kazura") return uid;
	return field.find((mon) => mon && mon.cardId === "kizuran" && mon.cover && mon.hp > 0 && mon.stun === 0 && (mon.chain ?? 0) === 0)?.uid ?? uid;
}
var charmDamage = 0;
function wardTag(kind) {
	return `(${kind === "phys" ? "Khiên vật lý" : "Khiên phép"} đã vỡ)`;
}
function soak(mon, kind, amount) {
	if (mon.cage || !mon.ward || amount <= 0) return {
		mon,
		amount
	};
	if (mon.wardStay) {
		if (kind !== "spell" || mon.ward !== "spell") return {
			mon,
			amount
		};
		wardLines.push(wardTag("spell"));
		return {
			mon: {
				...mon,
				ward: void 0,
				wardStay: void 0
			},
			amount: 0
		};
	}
	const popped = {
		...mon,
		ward: void 0
	};
	wardLines.push(wardTag(mon.ward));
	if (mon.ward !== kind) return {
		mon: popped,
		amount
	};
	return {
		mon: popped,
		amount: 0
	};
}
function damageSpell(mon, amount, allies, source) {
	mon = openShade(mon);
	const total = source ? outgoing(source, amount + charmDamage) : amount + charmDamage;
	const gated = swallowOath(mon, "spell", total);
	if (gated.mon !== mon) return settleMystic(mon, gated.mon, null, allies, Boolean(mon.guarding)).mon;
	if (mon.cardId === "chien-binh-rong") {
		const slice = third(total);
		const queued = pushDebt(mon, {
			p: 0,
			s: slice,
			t: 0
		});
		const soaked = soak(queued, "spell", hurt(queued, Math.max(0, slice - liveMdef(queued, allies))));
		return applyIncoming(soaked.mon, soaked.amount, allies).mon;
	}
	const mdef = liveMdef(mon, allies);
	const dealt = Math.max(0, total - mdef);
	const blocked = Math.max(0, Math.min(total, mdef));
	const plated = bankPlate(mon, "spell", blocked);
	const soaked = soak(plated, "spell", hurt(plated, dealt));
	const hit = applyIncoming(soaked.mon, soaked.amount, allies);
	const stored = mon.cardId === "sua-hut-ma-phap" ? (mon.stored ?? 0) + blocked : hit.mon.stored;
	return settleMystic(mon, {
		...hit.mon,
		stored
	}, null, allies, Boolean(mon.guarding)).mon;
}
function spellLanded(target, amount, allies, source) {
	const gross = amount + charmDamage;
	const peeked = source ? hexCut(source, gross, "peek") : gross;
	const total = source?.curse ? Math.floor(peeked / 2) : peeked;
	const base = target.cardId === "chien-binh-rong" ? third(total) : total;
	const landed = hurt(target, Math.max(0, base - liveMdef(target, allies)));
	return target.ward === "spell" && landed > 0 ? 0 : landed;
}
function spellPhrase(targets, amount, allies, source) {
	const rows = targets.filter((mon) => Boolean(mon)).map((mon) => ({
		name: cardOf(mon).name,
		n: spellLanded(mon, amount, allies, source)
	}));
	if (rows.length === 0) return "0 sát thương phép";
	if (rows.every((row) => row.n === rows[0].n)) return `${rows[0].n} sát thương phép`;
	return rows.map((row) => `${row.n} sát thương phép lên ${row.name}`).join(", ");
}
function aimNotice(title, rows, tail = "") {
	const shown = rows.filter((row) => row.name && row.bits);
	if (shown.length < 2) return null;
	const lines = shown.map((row) => `- gây ${row.bits} lên ${row.name}.`);
	const extra = tail.trim();
	return [
		title,
		...lines,
		...extra ? [extra] : []
	].join("\n");
}
function trueDamage(mon, amount, allies, veilBudget) {
	return landTrue(mon, amount, allies, veilBudget).mon;
}
function landTrue(mon, amount, allies, veilBudget) {
	const total = amount + charmDamage;
	if (mon.cardId !== "chien-binh-rong") return applyIncoming(mon, hurt(mon, total), allies, veilBudget);
	const slice = third(total);
	const queued = pushDebt(mon, {
		p: 0,
		s: 0,
		t: slice
	});
	return applyIncoming(queued, hurt(queued, slice), allies, veilBudget);
}
function truLanded(target, amount, allies, source) {
	const total = (source ? outgoing(source, amount) : amount) + charmDamage;
	return shownTru(target, hurt(target, target.cardId === "chien-binh-rong" ? third(total) : total), allies);
}
function stampErode(mon, from, left) {
	if (mon.erode?.left === null) return mon;
	if (left === null) return {
		...mon,
		erode: {
			from,
			left: null
		}
	};
	return {
		...mon,
		erode: {
			from,
			left: Math.max(mon.erode?.left ?? 0, left)
		}
	};
}
function mammothFightErode() {
	const line = skillText("mo-voi-ma-mut").split("\n").find((row) => /hy sinh bằng chiến đấu/i.test(row));
	if (!line) return 2;
	const times = /(\d+)\s*lần/i.exec(line);
	return times ? Number(times[1]) : 2;
}
function combatErode(attacker, defender, attackerSide) {
	let nextAttacker = attacker;
	let nextDefender = defender;
	const ticks = mammothFightErode();
	if (ticks !== null && ticks > 0) {
		if (attacker.cardId === "mo-voi-ma-mut" && attacker.hp <= 0 && defender.hp > 0) nextDefender = stampErode(defender, attackerSide, ticks);
		if (defender.cardId === "mo-voi-ma-mut" && defender.hp <= 0 && attacker.hp > 0) nextAttacker = stampErode(attacker, 1 - attackerSide, ticks);
	}
	return {
		attacker: nextAttacker,
		defender: nextDefender
	};
}
function outgoing(mon, amount) {
	const cut = hexCut(mon, amount, "spend");
	return mon.curse ? Math.floor(cut / 2) : cut;
}
var skillHex = null;
function hexCut(mon, amount, mode) {
	if (!skillHex || !mon || mon.uid !== skillHex.uid || amount <= 0) return amount;
	if (mode === "spend") {
		const reserved = skillHex.clips.find((clip) => clip.gross === amount && clip.seen && !clip.applied);
		if (reserved) {
			reserved.applied = true;
			return reserved.net;
		}
		const cut = Math.min(skillHex.left, amount);
		skillHex.left -= cut;
		const net = amount - cut;
		skillHex.clips.push({
			gross: amount,
			net,
			seen: false,
			applied: true
		});
		return net;
	}
	const applied = skillHex.clips.find((clip) => clip.gross === amount && clip.applied && !clip.seen);
	if (applied) {
		applied.seen = true;
		return applied.net;
	}
	const pending = skillHex.clips.find((clip) => clip.gross === amount && clip.seen && !clip.applied);
	if (pending) return pending.net;
	const cut = Math.min(skillHex.left, amount);
	skillHex.left -= cut;
	const net = amount - cut;
	skillHex.clips.push({
		gross: amount,
		net,
		seen: true,
		applied: false
	});
	return net;
}
function shaveHex(mon, parts) {
	const spell = Math.max(0, parts.spell);
	const phys = Math.max(0, parts.phys);
	const tru = Math.max(0, parts.tru);
	if (!skillHex || skillHex.uid !== mon.uid || skillHex.left <= 0) return {
		spell,
		phys,
		tru
	};
	let left = skillHex.left;
	const spellCut = Math.min(spell, left);
	left -= spellCut;
	const physCut = Math.min(phys, left);
	left -= physCut;
	const truCut = Math.min(tru, left);
	skillHex.left = 0;
	skillHex.clips = [];
	return {
		spell: spell - spellCut,
		phys: phys - physCut,
		tru: tru - truCut
	};
}
function bindSkillHex(mon) {
	if (skillHex?.uid === mon.uid) return () => {};
	const prev = skillHex;
	skillHex = mon.hex && mon.hex.left > 0 ? {
		uid: mon.uid,
		left: 3,
		clips: []
	} : null;
	return () => {
		skillHex = prev;
	};
}
function skillLook(cardId, index = 0) {
	return skillVisual(cardId, index);
}
function harmSkill(cardId, index = 0) {
	if (cardId === "kiem-si-lua-thieng" || cardId === "phu-thuy-ti-hon" || cardId === "trieu-hoi-ac-ma" || cardId === "sua-hut-ma-phap" || cardId === "trai-tim-hai-long" || cardId === "mo-voi-ma-mut" || cardId === "mat-do-tan-pha" || cardId === "may-nem-bom-hinh-nhen") return true;
	if (cardId === "ngai-khong-lo" || cardId === "ngai-nu-hoang" || cardId === "ngai-hoan-my") return true;
	if (cardId === "rong-phun-hoa-cau") return index === 1;
	if (cardId === "ga-he-dang-so") return index === 1;
	if (cardId === "phu-thuy-thoi-gian") return index >= 1;
	if (cardId === "may-quay-thuong") return index === 1;
	if (cardId === "rong-con" || cardId === "rong-ngan-tuoi") return true;
	if (cardId === "ma-dao-si" || cardId === "loi-nguyen-cua-rong" || cardId === "rong-ac-ma" || cardId === "con-thinh-no-cua-hai-vuong") return true;
	if (cardId === QUEEN_KNIGHT) return true;
	return false;
}
function hurt(mon, amount) {
	return mon.vulnerable > 0 ? amount * 2 : amount;
}
function partnerPool(mon, allies) {
	if (!mon || !allies) return 0;
	const id = partnerId(mon.cardId);
	if (!id) return 0;
	let total = 0;
	for (const mate of allies) if (mate && mate.hp > 0 && mate.cardId === id) total += mate.stored ?? 0;
	return total;
}
function phantomPool(mon, allies) {
	if (!mon || mon.hp <= 0 || mon.cage) return 0;
	return (mon.veil ? 2 : 0) + partnerPool(mon, allies);
}
function shownTru(mon, amount, allies, earlier = 0, pool) {
	const raw = Math.max(0, amount);
	if (!mon || mon.hp <= 0 || raw <= 0) return raw;
	const have = pool ?? phantomPool(mon, allies);
	const left = Math.max(0, have - Math.max(0, earlier));
	return Math.max(0, raw - left);
}
function veilLeft(mon, spent) {
	if (!mon?.veil || mon.hp <= 0) return 0;
	return Math.max(0, 2 - Math.max(0, spent));
}
function physical(atk, def) {
	return Math.max(0, atk - def);
}
var PERFECT = "nu-chua-dieu-nhan-hoan-my";
function plateBank(mon) {
	const due = mon.cardId === PERFECT ? mon.debt?.[0] : void 0;
	return {
		p: due?.p ?? 0,
		s: due?.s ?? 0
	};
}
function bankPlate(mon, kind, blocked) {
	if (mon.cardId !== PERFECT || blocked <= 0) return mon;
	const cur = plateBank(mon);
	const next = {
		p: cur.p + (kind === "phys" ? blocked : 0),
		s: cur.s + (kind === "spell" ? blocked : 0),
		t: 0
	};
	return {
		...mon,
		debt: [next, {
			p: 0,
			s: 0,
			t: 0
		}]
	};
}
function spendPlate(mon, spent, usedBolt) {
	if (mon.cardId !== PERFECT) return mon;
	const cur = plateBank(mon);
	const next = {
		p: Math.max(0, cur.p - spent.p),
		s: Math.max(0, cur.s - spent.s),
		t: 0
	};
	const empty = next.p === 0 && next.s === 0;
	return {
		...mon,
		debt: empty ? void 0 : [next, {
			p: 0,
			s: 0,
			t: 0
		}],
		bolt: usedBolt ? void 0 : mon.bolt
	};
}
var RIDER = "ky-si-cuoi-rong";
function riderFireLine(rows) {
	if (rows.every((row) => row.n === rows[0]?.n)) return `- Lửa địa ngục gây ${rows[0]?.n ?? 0} sát thương chuẩn lên ${rows.map((row) => row.name).join(", ")}`;
	return rows.map((row) => `- Lửa địa ngục gây ${row.n} sát thương chuẩn lên ${row.name}`).join("\n");
}
function riderPackets(attacker, defender, allies) {
	const tru = skillFigure(RIDER, "dmg", 4);
	const fire = skillFigure(RIDER, "dmg", 2, 1);
	const atk = outgoing(attacker, liveAtk(attacker));
	const def = liveDef(defender, allies);
	const physicalPart = Math.max(0, atk - tru - def);
	return {
		first: hurt(defender, Math.max(0, tru - fire) + physicalPart),
		second: hurt(defender, fire),
		physical: hurt(defender, physicalPart),
		tru: hurt(defender, tru),
		fire
	};
}
function canTargetFoe(state) {
	return !(state.opening && state.turn === 0);
}
function dueUpkeep(mon) {
	if (!mon || mon.hp <= 0) return false;
	if (mon.cardId === "trieu-hoi-ac-ma" && mon.pact) return true;
	return mon.cardId === "quai-thu-thien-su";
}
function nextUpkeep(field, except = "") {
	const demon = field.find((mon) => mon && mon.uid !== except && mon.hp > 0 && mon.cardId === "trieu-hoi-ac-ma" && mon.pact);
	if (demon) return demon;
	return field.find((mon) => mon && mon.uid !== except && mon.hp > 0 && mon.cardId === "quai-thu-thien-su") ?? null;
}
function scrubUpkeep(state) {
	if (!state.upkeep) return state;
	const you = state.players[state.turn];
	if (you.field.some((unit) => unit?.uid === state.upkeep && dueUpkeep(unit))) return state;
	return {
		...state,
		upkeep: nextUpkeep(you.field)?.uid ?? null
	};
}
function needUpkeep(state) {
	if (state.gemCap === state.turn) return note(state, "Hãy chọn giải phóng cầu ma lực trước.");
	if (state.gemWarn === state.turn) return note(state, "Hãy đọc thông báo ma lực quá tải trước.");
	const next = scrubUpkeep(state);
	if (next.upkeep) {
		const mon = next.players[next.turn].field.find((unit) => unit?.uid === next.upkeep);
		return note(next, mon ? `Hãy chọn duy trì ${cardOf(mon).name} trước` : "Hãy chọn duy trì trước");
	}
	return next === state ? null : next;
}
function draw(state, pile) {
	const next = drawCore(state, pile);
	if (next === state) return next;
	const side = state.turn;
	const ok = next.players[side].draws > state.players[side].draws;
	if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
	return traced(state, next, {
		kind: "draw",
		actor: side,
		ok,
		cardId: ok ? pile === "monster" ? next.players[side].reserve.at(-1)?.id ?? null : next.players[side].hand.at(-1) ?? null : null,
		target: null,
		end: null
	});
}
function drawCore(state, pile) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	const side = state.turn;
	let player = state.players[side];
	if (player.drawLock) return note(state, "Lượt này không được rút bài.");
	if (player.draws >= 1) return note(state, "Mỗi lượt chỉ rút 1 lá.");
	const before = player.stars;
	const paid = pay$1(player, 1);
	if (!paid) return note(state, "Rút bài cần 1 gem trên quả cầu.");
	player = paid;
	if (pile === "monster") {
		if (player.monsterDeck.length === 0) return note(state, "Hết quái để rút.");
		const [held, ...rest] = player.monsterDeck;
		player = {
			...player,
			monsterDeck: rest,
			reserve: [...player.reserve, held],
			draws: player.draws + 1
		};
	} else {
		if (player.spellDeck.length === 0) return note(state, "Hết phép để rút.");
		const [cardId, ...rest] = player.spellDeck;
		const tax = player.spellTax ?? [];
		player = {
			...player,
			spellDeck: rest,
			spellTax: tax.slice(1),
			hand: [...player.hand, cardId],
			tolls: [...handTolls(player), Boolean(tax[0])],
			draws: player.draws + 1
		};
	}
	const kind = pile === "monster" ? "1 quái" : "1 phép";
	const shown = (pile === "monster" ? monsterCard(player.reserve.at(-1)?.id ?? "")?.name : spellCard(player.hand.at(-1) ?? "")?.name) ?? kind;
	return note(pingStars(patch({
		...state,
		seq: state.seq + 1
	}, side, player), side, before, player.stars), `${sideName(side)} rút ${shown}.`);
}
function summon(state, reserveIndex, slot) {
	const next = summonCore(state, reserveIndex, slot);
	if (next === state) return next;
	const side = state.turn;
	const before = new Set(state.players[side].field.map((mon) => mon?.uid));
	const gained = next.players[side].field.some((mon) => mon && !before.has(mon.uid));
	const ok = next.players[side].summons > state.players[side].summons || (next.players[side].aside ?? 0) > (state.players[side].aside ?? 0) || gained;
	if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
	return traced(state, next, {
		kind: "summon",
		actor: side,
		ok,
		cardId: state.players[side].reserve[reserveIndex]?.id ?? null,
		target: null,
		end: null
	});
}
function summonCore(state, reserveIndex, slot) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	const side = state.turn;
	const player = state.players[side];
	const held = player.reserve[reserveIndex];
	const cardId = held?.id;
	const card = cardId ? monsterCard(cardId) : void 0;
	if (!card) return state;
	const witch = cardId === "phu-thuy-thoi-gian";
	if (witch) {
		if ((player.aside ?? 0) >= 1) return note(state, `${card.name} đã triệu hồi trong lượt này.`);
	} else if (player.summons >= 1) return note(state, "Mỗi lượt chỉ triệu hồi 1 lần.");
	if (player.field[slot]) return note(state, "Ô này đã có quái.");
	if ((player.locked?.[slot] ?? 0) > 0) return note(state, "Ô này đang ngập, chưa dùng được");
	const short = player.stars < card.stars;
	const studied = cardId === GUARD_KNIGHT && knightTutor(player.field);
	const forced = short && cardId === "trieu-hoi-ac-ma";
	if (short && !forced && !studied) return note(state, `Cần ${card.stars} sao.`);
	const gate = demonGate(player, held);
	if (typeof gate === "string") return note(state, gate);
	const before = player.stars;
	const gratis = held.freeAt != null && held.freeAt === player.turns;
	const tolled = gratis ? false : Boolean(held.toll);
	const bill = playBill(gratis ? 0 : card.gems, tolled, player.orb, player.flask);
	if (bill) return note(state, bill);
	const paid = payPlayed(gate.player, gratis ? 0 : card.gems, tolled);
	if (!paid) return note(state, bill ?? `Cần ${card.gems} gem đang có.`);
	let next = place(state, side, cardId, held);
	if (cardId === "kazura" && !held.saved) next.dim = true;
	if (cardId === "trieu-hoi-ac-ma" && player.stars === 3 && !held.saved) next.pact = true;
	let grown = false;
	if (cardId === GUARD_KNIGHT && !held.saved && player.stars >= 3) {
		grown = true;
		next = {
			...next,
			atk: next.atk + 2,
			maxHp: (next.maxHp || next.hp) + 3,
			hp: next.hp + 3,
			raised: markRaised(next, {
				atk: 2,
				hp: 3
			})
		};
	}
	if (gate.fresh) next.seen = true;
	const field = [...paid.field];
	field[slot] = next;
	const reserve = paid.reserve.filter((_, index) => index !== reserveIndex).map((pile) => pile.freeAt == null ? pile : {
		...pile,
		freeAt: void 0
	});
	let placed = shuffleSea({
		...paid,
		field,
		reserve,
		summons: witch ? paid.summons : paid.summons + 1,
		aside: witch ? (paid.aside ?? 0) + 1 : paid.aside
	});
	const vow = absorbVow(placed, next.uid);
	placed = vow.player;
	if (placed.hats) placed = {
		...placed,
		field: mixRow(placed.field)
	};
	const line = vow.eaten ? `${card.name} bị hiến tế.` : forced ? `${sideName(side)} bất chấp triệu hồi ${card.name}. Đầu lượt phải trả khế ước.${gate.fresh ? " Lần ra sân này tốn 1 mana." : ""}` : `${sideName(side)} triệu hồi ${card.name}${grown ? " Trưởng thành: +2 công, +3 máu." : ""}${gate.fresh ? " Lần ra sân này tốn 1 mana." : ""}`;
	return note(pingStars(patch({
		...state,
		seq: state.seq + 1,
		rite: vow.eaten ? {
			side,
			slot,
			seq: state.seq + 1
		} : state.rite
	}, side, placed), side, before, placed.stars), line);
}
function vowCap(id, level = 1) {
	const stars = cardStars(id, level);
	if (stars < 2 || stars > 4) return 0;
	return stars - 1;
}
function summonVow(state, reserveIndex, slot, picks) {
	const next = summonVowCore(state, reserveIndex, slot, picks);
	if (next === state) return next;
	const side = state.turn;
	const before = new Set(state.players[side].field.map((mon) => mon?.uid));
	const gained = next.players[side].field.some((mon) => mon && !before.has(mon.uid));
	return traced(state, next, {
		kind: "summon",
		actor: side,
		ok: next.players[side].summons > state.players[side].summons || (next.players[side].aside ?? 0) > (state.players[side].aside ?? 0) || gained,
		cardId: state.players[side].reserve[reserveIndex]?.id ?? null,
		target: null,
		end: null
	});
}
function summonVowCore(state, reserveIndex, slot, picks) {
	const side = state.turn;
	const unique = [...new Set(picks)].filter((uid) => state.players[side].field.some((mon) => mon?.uid === uid && mon.hp > 0));
	if (unique.length === 0 && !state.players[side].field[slot]) return summonCore(state, reserveIndex, slot);
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	const player = state.players[side];
	const held = player.reserve[reserveIndex];
	const cardId = held?.id;
	const card = cardId ? monsterCard(cardId) : void 0;
	if (!card || !cardId || !held) return state;
	const cap = vowCap(cardId, held.saved?.level ?? 1);
	if (cap <= 0) return note(state, `${card.name} không triệu hồi hiến tế được.`);
	if (unique.length > cap) return note(state, `Tối đa ${cap} quái.`);
	if (player.field.every((mon) => mon) && unique.length === 0) return note(state, "Sân đầy, hãy hiến ít nhất 1 quái.");
	const witch = cardId === "phu-thuy-thoi-gian";
	if (witch) {
		if ((player.aside ?? 0) >= 1) return note(state, `${card.name} đã triệu hồi trong lượt này.`);
	} else if (player.summons >= 1) return note(state, "Mỗi lượt chỉ triệu hồi 1 lần.");
	const occupant = player.field[slot];
	const freed = unique.map((uid) => player.field.findIndex((mon) => mon?.uid === uid)).filter((index) => index >= 0);
	let land = slot;
	if (occupant && !unique.includes(occupant.uid)) {
		if (freed.length === 0) return note(state, "Ô này đã có quái.");
		land = freed[Math.floor(Math.random() * freed.length)];
	}
	if ((player.locked?.[land] ?? 0) > 0 && !player.field[land]) return note(state, "Ô này đang ngập, chưa dùng được");
	const stars = cardStars(cardId, held.saved?.level ?? 1);
	const short = player.stars < stars;
	const studied = cardId === GUARD_KNIGHT && knightTutor(player.field);
	if (short && !(short && cardId === "trieu-hoi-ac-ma") && !studied) return note(state, `Cần ${stars} sao.`);
	const gate = demonGate(player, held);
	if (typeof gate === "string") return note(state, gate);
	const before = player.stars;
	const gratis = held.freeAt != null && held.freeAt === player.turns;
	const tolled = gratis ? false : Boolean(held.toll);
	const bill = playBill(gratis ? 0 : card.gems, tolled, player.orb, player.flask);
	if (bill) return note(state, bill);
	const paid = payPlayed(gate.player, gratis ? 0 : card.gems, tolled);
	if (!paid) return note(state, bill ?? `Cần ${card.gems} gem đang có.`);
	const names = unique.map((uid) => {
		const mon = player.field.find((unit) => unit?.uid === uid);
		return mon ? cardOf(mon).name : "";
	}).filter(Boolean);
	let born = place(state, side, cardId, held);
	if (cardId === "kazura" && !held.saved) born = {
		...born,
		dim: true
	};
	if (cardId === "trieu-hoi-ac-ma" && player.stars === 3 && !held.saved) born = {
		...born,
		pact: true
	};
	const hp = unique.length >= 1 ? 1 : 0;
	const atk = unique.length >= 2 ? 1 : 0;
	const def = unique.length >= 3 ? 1 : 0;
	born = {
		...born,
		atk: born.atk + atk,
		def: born.def + def,
		mdef: born.mdef + def,
		hp: born.hp + hp,
		maxHp: (born.maxHp || born.hp) + hp,
		skillUp: unique.length >= 2 ? 1 : born.skillUp,
		raised: hp || atk || def ? markRaised(born, {
			atk,
			def,
			mdef: def,
			hp
		}) : born.raised
	};
	if (gate.fresh) born.seen = true;
	const field = [...paid.field.map((mon) => mon && unique.includes(mon.uid) ? null : mon)];
	field[land] = born;
	const reserve = paid.reserve.filter((_, index) => index !== reserveIndex).map((pile) => pile.freeAt == null ? pile : {
		...pile,
		freeAt: void 0
	});
	let placed = shuffleSea({
		...paid,
		field,
		reserve,
		summons: witch ? paid.summons : paid.summons + 1,
		aside: witch ? (paid.aside ?? 0) + 1 : paid.aside
	});
	const vow = absorbVow(placed, born.uid);
	placed = vow.player;
	if (placed.hats) placed = {
		...placed,
		field: mixRow(placed.field)
	};
	const bits = [
		hp ? `+${hp} máu` : "",
		atk ? `+${atk} công` : "",
		unique.length >= 2 ? "+1 sát thương kỹ năng" : "",
		def ? "+1 phòng ngự" : ""
	].filter(Boolean);
	const eaten = names.length ? `${names.join(", ")} bị hiến tế. ` : "";
	const line = vow.eaten ? `${eaten}${card.name} bị hiến tế.` : `${eaten}${sideName(side)} triệu hồi ${card.name}${bits.length ? `. ${bits.join(", ")}.` : "."}`;
	const seq = state.seq + 1;
	return note(pingStars(patch({
		...state,
		seq,
		ashes: names.length ? {
			side,
			slots: freed,
			seq
		} : state.ashes,
		rite: vow.eaten ? {
			side,
			slot: land,
			seq
		} : state.rite
	}, side, placed), side, before, placed.stars), line);
}
function fuse(state, reserveIndex, fieldUid, slot) {
	const next = fuseCore(state, reserveIndex, fieldUid, slot);
	if (next === state) return next;
	const ok = next.players !== state.players;
	if (!ok && next.upkeep && !state.upkeep) return next;
	const held = state.players[state.turn].reserve[reserveIndex];
	return traced(state, next, {
		kind: "fuse",
		actor: state.turn,
		ok,
		cardId: held?.id ?? null,
		target: monsterTarget(state, fieldUid),
		end: null
	});
}
function fuseCore(state, reserveIndex, fieldUid, slot) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	const side = state.turn;
	const player = state.players[side];
	const held = player.reserve[reserveIndex];
	const host = player.field.find((mon) => mon?.uid === fieldUid) ?? null;
	if (!held || !host) return state;
	const ids = player.field.filter((mon) => Boolean(mon)).map((mon) => mon.cardId);
	const knight = findKnightFusion(held.id, host.cardId, ids);
	const recipe = findFusion(held.id, host.cardId);
	const resultId = knight?.result ?? recipe?.result;
	const handCard = monsterCard(held.id);
	const result = resultId ? monsterCard(resultId) : void 0;
	if (!recipe && !knight || !handCard || !result) return note(state, "Không hợp nhất được.");
	if (player.field[slot] && player.field[slot]?.uid !== fieldUid && !(knight && player.field[slot]?.cardId && [
		"hiep-si-cua-vua",
		"hiep-si-ho-ve",
		"hiep-si-cua-hau"
	].includes(player.field[slot]?.cardId ?? ""))) return note(state, "Ô này đã có quái.");
	if ((player.locked?.[slot] ?? 0) > 0) return note(state, "Ô này đang ngập, chưa dùng được");
	const born = place({
		...state,
		seq: state.seq + 1
	}, side, result.id);
	const knights = /* @__PURE__ */ new Set([
		"hiep-si-cua-vua",
		"hiep-si-ho-ve",
		"hiep-si-cua-hau"
	]);
	const field = player.field.map((mon) => knight && mon && knights.has(mon.cardId) ? null : mon?.uid === fieldUid ? null : mon);
	field[slot] = born;
	const reserve = player.reserve.filter((_, index) => index !== reserveIndex);
	const placed = {
		...player,
		field,
		reserve,
		spent: [
			...player.spent ?? [],
			held.id,
			...knight ? ids.filter((id) => knights.has(id) && id !== held.id) : []
		]
	};
	const handName = fieldName({
		cardId: held.id,
		level: held.saved?.level ?? 1
	});
	const line = knight ? `Hợp nhất ba hiệp sĩ trở thành ${result.name}.` : `Hợp nhất ${handName} và ${fieldName(host)} trở thành ${result.name}.`;
	return note(patch({
		...state,
		seq: state.seq + 2
	}, side, placed), line);
}
function absorbVow(player, uid) {
	const born = player.field.find((mon) => mon?.uid === uid) ?? null;
	if (!born || born.copy) return {
		player,
		eaten: false
	};
	const stars = monsterCard(born.cardId)?.stars ?? 99;
	if (stars < 1 || stars > 2) return {
		player,
		eaten: false
	};
	if (!player.field.some((mon) => mon && mon.uid !== uid && (mon.path ?? 0) > 0)) return {
		player,
		eaten: false
	};
	const field = player.field.map((mon) => {
		if (!mon) return mon;
		if (mon.uid === uid) return null;
		if ((mon.path ?? 0) <= 0) return mon;
		const maxHp = (mon.maxHp || mon.hp) + 1;
		return {
			...mon,
			fed: (mon.fed ?? 0) + 1,
			def: mon.def + 1,
			mdef: mon.mdef + 1,
			maxHp,
			hp: mon.hp + 1,
			raised: markRaised(mon, {
				def: 1,
				mdef: 1,
				hp: 1
			})
		};
	});
	return {
		player: {
			...player,
			field
		},
		eaten: true
	};
}
function becomeLegend(mon) {
	const fed = mon.fed ?? 0;
	const card = monsterCard("chien-binh-huyen-thoai");
	const atk = (card?.atk ?? 2) + fed;
	const def = (card?.def ?? 0) + fed;
	const mdef = (card?.mdef ?? 0) + fed;
	const maxHp = (card?.hp ?? 5) + fed;
	return clearHarm({
		...mon,
		cardId: "chien-binh-huyen-thoai",
		atk,
		def,
		mdef,
		maxHp,
		hp: maxHp,
		path: void 0,
		fed,
		clash: void 0,
		gaze: void 0,
		raised: fed > 0 ? {
			atk: fed,
			def: fed,
			mdef: fed,
			hp: fed
		} : void 0
	});
}
function settleVow(mon) {
	if (mon.hp <= 0) return mon;
	const fed = mon.fed ?? 0;
	const path = mon.path ?? 0;
	if (path <= 0) {
		if (mon.cardId !== "chien-binh-huyen-thoai" || fed <= 0) return mon;
		const cap = mon.maxHp || mon.hp;
		return {
			...mon,
			hp: Math.min(cap, mon.hp + fed)
		};
	}
	if (path === 1) return becomeLegend(mon);
	const cap = mon.maxHp || mon.hp;
	return {
		...mon,
		hp: Math.min(cap, mon.hp + fed),
		path: path - 1
	};
}
function offerVow(state, uid) {
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	const side = state.turn;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== "ky-si-bong-toi" || mon.dim || held(mon) || (mon.path ?? 0) > 0) return state;
	const cost = skillManaCost(mon.cardId, 1);
	const before = you.stars;
	const paid = pay$1(you, cost);
	if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
	const turns = grabNums(skillText(mon.cardId), /(\d+)\s*lượt/gi)[0] ?? 5;
	const field = paid.field.map((unit) => unit?.uid === uid ? {
		...unit,
		atk: 0,
		def: 0,
		mdef: 0,
		path: turns,
		fed: 0,
		raised: void 0,
		clash: void 0
	} : unit);
	return note(pingStars(patch(state, side, {
		...paid,
		field
	}), side, before, paid.stars), `${cardOf(mon).name} hiến tế. Mất hết công và phòng ngự. Không hành động trong ${turns} lượt.`);
}
function withLegend(mon) {
	if (mon.cardId !== "chien-binh-huyen-thoai" || mon.clash) return mon;
	const atk = skillFigure(mon.cardId, "atk", 3);
	const def = skillFigure(mon.cardId, "def", 2);
	const bonus = skillFigure(mon.cardId, "max", 2);
	return {
		...mon,
		hp: mon.hp + bonus,
		maxHp: (mon.maxHp || mon.hp) + bonus,
		clash: {
			atk,
			def,
			maxHp: bonus
		}
	};
}
function stampLegend(state, uids) {
	const want = new Set(uids);
	let next = state;
	const names = [];
	for (const side of [0, 1]) {
		const player = next.players[side];
		let changed = false;
		const field = player.field.map((mon) => {
			if (!mon || !want.has(mon.uid)) return mon;
			const armed = withLegend(mon);
			if (armed === mon) return mon;
			changed = true;
			names.push(cardOf(mon).name);
			return armed;
		});
		if (changed) next = patch(next, side, {
			...player,
			field
		});
	}
	if (names.length === 0) return state;
	const atk = skillFigure("chien-binh-huyen-thoai", "atk", 3);
	const def = skillFigure("chien-binh-huyen-thoai", "def", 2);
	const max = skillFigure("chien-binh-huyen-thoai", "max", 2);
	return note(next, `${names.join(", ")} nhận +${atk} công, +${def} thủ và +${max} máu tối đa cho lần giáp lá cà này.`);
}
function rabbitDodge(self, other) {
	if (self.cardId !== "tho-den-tinh-nghich") return false;
	const rates = grabNums(skillText(self.cardId), /(\d+)\s*%/gi);
	const pct = (monsterCard(other.cardId)?.stars ?? 0) >= 3 ? rates[1] ?? rates[0] ?? 70 : rates[0] ?? 35;
	return Math.random() < pct / 100;
}
function releaseGuardAttack(before, after, defender, allies) {
	if (before.cardId !== GUARD_KNIGHT || before.guarding) return {
		attacker: after,
		defender
	};
	const lostPhys = Boolean(before.oath?.phys) && !after.oath?.phys;
	const lostSpell = Boolean(before.oath?.spell) && !after.oath?.spell;
	if (!lostPhys && !lostSpell) return {
		attacker: after,
		defender
	};
	const back = { ...after.oathBack ?? {} };
	if (lostPhys) back.phys = true;
	if (lostSpell) back.spell = true;
	const due = before.debt?.[0] ?? {
		p: 0,
		s: 0,
		t: 0
	};
	const now = after.debt?.[0] ?? {
		p: 0,
		s: 0,
		t: 0
	};
	const kept = {
		p: Math.max(0, now.p - due.p),
		s: Math.max(0, now.s - due.s),
		t: 0
	};
	const cleared = {
		...after,
		oathBack: back,
		debt: kept.p || kept.s ? [{ ...kept }, {
			p: 0,
			s: 0,
			t: 0
		}] : void 0
	};
	if (due.p <= 0 && due.s <= 0) return {
		attacker: cleared,
		defender
	};
	const landed = landHell(defender, {
		phys: due.p,
		spell: due.s,
		tru: 0
	}, allies);
	wardLines.push(`${cardOf(before).name} giải phóng ${due.p} sát thương vật lý và ${due.s} sát thương phép`);
	return {
		attacker: cleared,
		defender: landed.mon
	};
}
function guardStrikeKind(mon, roster) {
	if (mon.cardId !== GUARD_KNIGHT) return "phys";
	const lostPhys = Boolean(roster?.includes(KING)) && !mon.oath?.phys;
	const lostSpell = Boolean(roster?.includes(QUEEN_KNIGHT)) && !mon.oath?.spell;
	if (lostPhys) return "spell";
	if (lostSpell) return "phys";
	return "phys";
}
function strikeSpell(defender, raw, allies) {
	if (raw <= 0) return {
		mon: defender,
		bite: 0,
		surplus: 0
	};
	const mon = openShade(defender);
	if (mon.cardId === "chien-binh-rong") {
		const slice = third(raw);
		const queued = pushDebt(mon, {
			p: 0,
			s: slice,
			t: 0
		});
		const soaked = soak(queued, "spell", hurt(queued, Math.max(0, slice - liveMdef(queued, allies))));
		return applyIncoming(soaked.mon, soaked.amount, allies);
	}
	const gated = swallowOath(mon, "spell", raw);
	if (gated.mon !== mon) return {
		mon: gated.mon,
		bite: 0,
		surplus: 0
	};
	const mdef = liveMdef(mon, allies);
	const dealt = Math.max(0, raw - mdef);
	const blocked = Math.max(0, Math.min(raw, mdef));
	const plated = bankPlate(mon, "spell", blocked);
	const soaked = soak(plated, "spell", hurt(plated, dealt));
	const hit = applyIncoming(soaked.mon, soaked.amount, allies);
	const stored = mon.cardId === "sua-hut-ma-phap" ? (mon.stored ?? 0) + blocked : hit.mon.stored;
	return {
		...hit,
		mon: {
			...hit.mon,
			stored
		}
	};
}
function strikePair(attacker, defender, alliesA, alliesB, rosterA, rosterB) {
	let atk = liveAtk(attacker);
	let counter = liveAtk(defender);
	if (defender.riposte) counter = 0;
	const defA = liveDef(attacker, alliesA);
	const defB = liveDef(defender, alliesB);
	if (defender.cardId === "kraken") counter += Math.min(Math.max(0, defB), Math.max(0, atk));
	if (attacker.cardId === "kraken") atk += Math.min(Math.max(0, defA), Math.max(0, counter));
	const plate = plateBank(attacker);
	const bolt = attacker.cardId === PERFECT && Boolean(attacker.bolt);
	if (!bolt) atk += plate.p;
	const attackerDodged = rabbitDodge(attacker, defender);
	const defenderDodged = rabbitDodge(defender, attacker);
	const beam = Boolean(attacker.horn || attacker.gaze || bolt);
	if (shadeHidden(attacker) || shadeHidden(defender) && !beam || defender.cage) counter = 0;
	const gazeTrue = Boolean(attacker.gaze && !attacker.horn && !bolt);
	const counterBlow = defender.cardId === RIDER && !beam && !shadeHidden(attacker) ? riderPackets(defender, attacker, alliesA) : null;
	const blockSpell = !attackerDodged && !beam && !counterBlow && defender.cardId === GUARD_KNIGHT && Boolean(defender.guarding) && guardStrikeKind(defender, rosterB) === "spell" && counter > 0;
	const counterRaw = outgoing(defender, counter);
	const struck = attackerDodged || beam ? {
		mon: attacker,
		bite: 0,
		surplus: 0
	} : counterBlow ? applyIncoming(attacker, counterBlow.first, alliesA) : blockSpell ? strikeSpell(attacker, counterRaw, alliesA) : takePhysical(attacker, counterRaw, alliesA);
	if (blockSpell && counterRaw > 0) wardLines.push(`${cardOf(defender).name} gây ${counterRaw} sát thương phép`);
	const nextAttacker = spendBless(clearClash({
		...struck.mon,
		charge: attacker.charge + (attackerDodged ? 1 : 0),
		dim: true,
		def: defender.cardId === "khung-long-vay-kiem" ? attacker.def - skillLoss(defender.cardId, "def", 1) : struck.mon.def,
		mdef: defender.cardId === "khung-long-vay-kiem" ? attacker.mdef - skillLoss(defender.cardId, "mdef", 1) : struck.mon.mdef
	}));
	const hornAmount = outgoing(attacker, bolt ? liveAtk(attacker) + plate.p + plate.s : attacker.horn === "plus" ? Math.min(8, atk) : attacker.horn === "splash" ? Math.min(4, atk) : atk);
	let bite = 0;
	let surplus = 0;
	let defenderBody;
	if (gazeTrue) {
		if (defenderDodged) defenderBody = defender;
		else {
			const hit = landTrue(defender, outgoing(attacker, atk), alliesB);
			defenderBody = hit.mon;
			bite = hit.bite;
			surplus = hit.surplus;
		}
	} else if (beam) {
		const gated = swallowOath(defender, "spell", defenderDodged ? 0 : hornAmount);
		if (gated.mon !== defender) defenderBody = gated.mon;
		else {
			const mdef = liveMdef(defender, alliesB);
			if (defender.cardId === "chien-binh-rong" && !defenderDodged) {
				const slice = third(hornAmount);
				const queued = pushDebt(defender, {
					p: 0,
					s: slice,
					t: 0
				});
				const hit = applyIncoming(queued, hurt(queued, Math.max(0, slice - liveMdef(queued, alliesB))), alliesB);
				defenderBody = hit.mon;
				bite = hit.bite;
				surplus = hit.surplus;
			} else {
				const blocked = Math.max(0, Math.min(hornAmount, mdef));
				const plated = bankPlate(defender, "spell", defenderDodged ? 0 : blocked);
				const dealt = Math.max(0, hornAmount - mdef);
				const soaked = soak(plated, "spell", defenderDodged ? 0 : hurt(plated, dealt));
				const hit = applyIncoming(soaked.mon, soaked.amount, alliesB);
				const stored = defender.cardId === "sua-hut-ma-phap" ? (defender.stored ?? 0) + blocked : hit.mon.stored;
				defenderBody = {
					...hit.mon,
					stored
				};
				bite = hit.bite;
				surplus = hit.surplus;
			}
		}
	} else {
		const riderAtk = attacker.cardId === RIDER;
		const guardSpell = !riderAtk && guardStrikeKind(attacker, rosterA) === "spell";
		const dragon = !riderAtk && !guardSpell && defender.cardId === "chien-binh-rong" && !defenderDodged;
		let hit;
		if (guardSpell) {
			const raw = defenderDodged ? 0 : outgoing(attacker, atk);
			hit = strikeSpell(defender, raw, alliesB);
			if (raw > 0) wardLines.push(`${cardOf(attacker).name} gây ${raw} sát thương phép`);
		} else if (dragon) hit = takePhysical(defender, outgoing(attacker, atk), alliesB);
		else if (riderAtk && !defenderDodged) {
			const pack = riderPackets(attacker, defender, alliesB);
			const soaked = soak(defender, "phys", pack.physical);
			hit = applyIncoming(soaked.mon, Math.max(0, pack.first - pack.physical) + soaked.amount, alliesB);
		} else {
			const raw = outgoing(attacker, atk);
			const gated = swallowOath(defender, "phys", defenderDodged ? 0 : raw);
			if (gated.mon !== defender) hit = {
				mon: gated.mon,
				bite: 0,
				surplus: 0
			};
			else {
				const plated = bankPlate(defender, "phys", defenderDodged ? 0 : Math.max(0, Math.min(raw, defB)));
				const soaked = soak(plated, "phys", defenderDodged ? 0 : hurt(plated, physical(raw, defB)));
				hit = applyIncoming(soaked.mon, soaked.amount, alliesB);
			}
		}
		if (!guardSpell && shadeHidden(defender) && !defenderDodged) {
			const raw = outgoing(attacker, atk);
			const pool = defender.stored ?? 1;
			const taken = Math.min(pool, Math.max(0, raw));
			const left = pool - taken;
			hit = {
				mon: left > 0 ? {
					...defender,
					stored: left
				} : {
					...defender,
					shown: void 0,
					stored: void 0
				},
				bite: taken,
				surplus: 0
			};
		}
		if (attacker.cardId === "ke-san-moi-tu-than" && attacker.preyKind && attacker.preyKind !== "phys" && !defenderDodged) {
			const amount = liveAtk(attacker);
			if (attacker.preyKind === "spell") {
				const spellBody = damageSpell(defender, amount, alliesB, attacker);
				hit = {
					mon: spellBody,
					bite: Math.max(0, defender.hp - Math.max(0, spellBody.hp)),
					surplus: 0
				};
			} else {
				const tru = landTrue(defender, outgoing(attacker, amount), alliesB);
				hit = {
					mon: tru.mon,
					bite: tru.bite,
					surplus: tru.surplus
				};
			}
		}
		defenderBody = hit.mon;
		bite = hit.bite;
		surplus = hit.surplus;
	}
	if (!beam && plate.s > 0) defenderBody = damageSpell(defenderBody, plate.s, alliesB);
	const nextDefender = {
		...defenderBody,
		charge: defender.charge + (defenderDodged ? 1 : 0),
		def: attacker.cardId === "khung-long-vay-kiem" ? defender.def - skillLoss(attacker.cardId, "def", 1) : defenderBody.def,
		mdef: attacker.cardId === "khung-long-vay-kiem" ? defender.mdef - skillLoss(attacker.cardId, "mdef", 1) : defenderBody.mdef,
		dim: true
	};
	if (defender.blocksLeft > 1) {
		nextDefender.dim = false;
		nextDefender.blocksLeft -= 1;
	}
	nextDefender.guarding = void 0;
	nextDefender.oathShot = void 0;
	nextDefender.riposte = void 0;
	const dumped = releaseGuardAttack(attacker, attacker.cardId === PERFECT ? spendPlate(clashGrow(nextAttacker), bolt ? {
		p: plate.p,
		s: plate.s
	} : plate, bolt) : clashGrow(nextAttacker), dropGuard(clashGrow(dropClash(nextDefender))), alliesB);
	const attackerBreak = settleMystic(attacker, dumped.attacker, dumped.defender, alliesB, true);
	const defenderBreak = settleMystic(defender, attackerBreak.foe ?? dumped.defender, attackerBreak.mon, alliesA, Boolean(defender.guarding));
	return {
		attacker: defenderBreak.foe ?? attackerBreak.mon,
		defender: defenderBreak.mon,
		dodged: attackerDodged || defenderDodged,
		bite,
		surplus
	};
}
function withLeech(field, attacker, bite, surplus) {
	const leech = leechKazura(attacker, bite, surplus, field);
	const healed = new Map(leech.allies.filter((mon) => mon).map((mon) => [mon.uid, mon]));
	return {
		attacker: leech.attacker,
		field: field.map((mon) => {
			if (!mon) return mon;
			if (mon.uid === attacker.uid) return leech.attacker;
			return mon.cardId === "kizuran" ? healed.get(mon.uid) ?? mon : mon;
		})
	};
}
function dropDead(player) {
	const hatched = settleCocoon(player);
	return {
		...hatched,
		field: alive(hatched.field)
	};
}
function checkWinner(state) {
	const fallen = state.players.findIndex((player) => player.hp <= 0);
	if (fallen === -1) return state;
	const winner = fallen === 0 ? 1 : 0;
	const next = {
		...state,
		winner,
		step: "over",
		pending: null,
		hold: null,
		log: [...state.log, `${sideName(winner)} thắng.`]
	};
	if (state.winner || (state.events ?? []).some((row) => row.kind === "win")) return next;
	return traced(state, next, {
		kind: "win",
		actor: winner,
		ok: true,
		cardId: null,
		target: null,
		end: "damage"
	});
}
function skillText(id) {
	return plainCopy(monsterCard(id)?.skill ?? "");
}
function spellText(id) {
	return spellCard(id)?.effect ?? "";
}
function grabNums(text, pattern) {
	const found = [];
	for (const hit of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
		const raw = hit.slice(1).find((part) => part !== void 0);
		const value = Number(raw);
		if (Number.isFinite(value)) found.push(Math.round(value));
	}
	return found;
}
function bulletRamp(text) {
	const hit = text.match(/từ\s+(\d+)\s+rồi\s+(\d+)\s+và loạt cuối là\s+(\d+)/i);
	if (!hit) return [
		1,
		2,
		4
	];
	return [
		Number(hit[1]),
		Number(hit[2]),
		Number(hit[3])
	];
}
var NUM_ATK = /(?:\+|tăng)\s*(\d+)\s*công|công\s*(\d+)/gi;
var NUM_DEF = /(?:\+\s*(\d+)\s*thủ(?!\s*phép)|thủ\s*(\d+)(?!\s*phép))/gi;
var NUM_GUARD = /(\d+)\s*phòng\s*ngự/gi;
var NUM_MDEF = /(?:\+\s*(\d+)\s*thủ\s*phép|thủ\s*phép\s*(\d+))/gi;
var NUM_HEAL = /hồi(?:\s*phục)?\s*(\d+)\s*máu|hồi\s*thêm\s*(\d+)/gi;
var NUM_MAX = /(?:\+|thêm|tăng)\s*(\d+)\s*máu\s*tối\s*đa/gi;
var NUM_HP = /máu\s*(\d+)/gi;
var NUM_DMG = /(\d+)\s*sát\s*thương/gi;
function skillFigure(id, kind, fallback, index = 0) {
	const text = skillText(id);
	if (kind === "dmg") {
		const dealt = grabNums(text, NUM_DMG);
		if (dealt.length > 0) return dealt[index] ?? fallback;
		return grabNums(text, /gây\s*(\d+)/gi)[index] ?? fallback;
	}
	return grabNums(text, kind === "atk" ? NUM_ATK : kind === "def" ? NUM_DEF : kind === "guard" ? NUM_GUARD : kind === "mdef" ? NUM_MDEF : kind === "heal" ? NUM_HEAL : kind === "max" ? NUM_MAX : NUM_HP)[index] ?? fallback;
}
function favorShots(mon, shots) {
	const plus = mon.skillUp ?? 0;
	if (plus <= 0 || shots.length === 0) return shots;
	const rank = (kind) => kind === "spell" ? 0 : kind === "phys" ? 1 : 2;
	const best = Math.min(...shots.map((shot) => rank(shot.kind)));
	let pick = -1;
	let top = -1;
	shots.forEach((shot, index) => {
		if (rank(shot.kind) !== best) return;
		if (shot.n >= top) {
			top = shot.n;
			pick = index;
		}
	});
	if (pick < 0) return shots;
	return shots.map((shot, index) => index === pick ? {
		...shot,
		n: shot.n + plus
	} : shot);
}
function skillThreat(cardId, index) {
	const whole = skillText(cardId);
	const numbered = whole.split("\n").map((line) => line.trim()).filter((line) => /^\d+\./.test(line));
	const text = numbered.length > 0 ? numbered[index] ?? numbered[0] : whole;
	const count = /mỗi/i.test(text) ? grabNums(text, /(\d+)\s*(?:quả|phát|loạt|trái|đòn|lần)/gi)[0] ?? 1 : 1;
	const kinds = [
		grabNums(text, /(\d+)\s*sát thương vật lý/gi).reduce((sum, n) => sum + n, 0),
		grabNums(text, /(\d+)\s*sát thương phép/gi).reduce((sum, n) => sum + n, 0),
		grabNums(text, /(\d+)\s*sát thương chuẩn/gi).reduce((sum, n) => sum + n, 0)
	].filter((n) => n > 0).map((n) => n * count);
	if (kinds.length > 0) return Math.max(...kinds);
	return grabNums(text, /(\d+)\s*sát thương/gi).reduce((sum, n) => sum + n, 0) * count;
}
function skillLoss(id, kind, fallback) {
	return grabNums(skillText(id), kind === "def" ? /giảm\s*(\d+)\s*thủ(?!\s*phép)/gi : /(?:giảm\s*(\d+)\s*thủ\s*phép|và\s*(\d+)\s*thủ\s*phép)/gi)[0] ?? fallback;
}
function spellFigure(id, kind, fallback) {
	return grabNums(spellText(id), kind === "atk" ? NUM_ATK : NUM_HEAL)[0] ?? fallback;
}
function skillManaCost(id, fallback = 1) {
	const hit = /tiêu(?:\s*hao)?\s*(\d+)\s*mana/i.exec(skillText(id));
	const value = hit ? Number(hit[1]) : fallback;
	return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
}
function skillHpBonus(id, fallback = 1) {
	return skillFigure(id, "max", fallback);
}
function payCost(player, cost) {
	if (cost <= 0) return player;
	return pay$1(player, cost);
}
function gnawReady$1(mon, owner) {
	return Boolean(mon && mon.cardId === "chien-si-gam-nham" && !mon.dim && mon.stun === 0 && !hexLocked(mon) && owner.orb >= skillManaCost(mon.cardId));
}
function boostGnaw(mon) {
	if (mon.cage) return {
		...mon,
		dim: true
	};
	const maxHp = mon.maxHp || mon.hp;
	const bonus = skillHpBonus(mon.cardId);
	return {
		...mon,
		dim: true,
		def: mon.def * 2,
		mdef: mon.mdef * 2,
		maxHp: maxHp + bonus,
		hp: mon.hp + bonus,
		buff: {
			def: (mon.buff?.def ?? 0) + mon.def,
			mdef: (mon.buff?.mdef ?? 0) + mon.mdef,
			maxHp: (mon.buff?.maxHp ?? 0) + bonus
		}
	};
}
function spentAct(mon) {
	if (mon.blocksLeft > 1) return mon;
	return {
		...mon,
		dim: true
	};
}
function fadeBuff(mon) {
	if (!mon.buff) return mon;
	const maxHp = Math.max(1, (mon.maxHp || mon.hp) - mon.buff.maxHp);
	return {
		...mon,
		def: Math.max(0, mon.def - mon.buff.def),
		mdef: Math.max(0, mon.mdef - mon.buff.mdef),
		maxHp,
		hp: Math.min(mon.hp, maxHp),
		buff: void 0
	};
}
function beginHold(state, pending, line) {
	const opened = {
		...note(state, line),
		step: "respond",
		pending,
		hold: {
			priority: 1 - state.turn,
			passed: [false, false],
			blocker: null,
			blockerSkill: false,
			armed: null
		}
	};
	if (pending.kind !== "melee") return opened;
	return stampLegend(opened, [pending.attacker, pending.defender]);
}
function keep(state) {
	if (state.step !== "respond" || !state.hold || !state.pending) return {
		...state,
		hold: null
	};
	return {
		...state,
		hold: {
			...state.hold,
			passed: [false, false],
			priority: 1 - state.hold.priority
		}
	};
}
function askKnight(state, priority) {
	if (!state.hold) return state;
	const aimed = state.hold.priority === priority ? state : {
		...state,
		hold: {
			...state.hold,
			priority,
			passed: [false, false]
		}
	};
	if (aimed.live.includes("Kỵ sĩ hãy chọn")) return aimed;
	return note(aimed, "Kỵ sĩ hãy chọn trạng thái trước khi giáp lá cà");
}
function passResponse(state) {
	const next = passResponseCore(state);
	if (next === state || !state.hold) return next;
	if (!(next.pending !== state.pending || next.step !== state.step || next.winner !== state.winner || next.hold === null)) return next;
	const marked = traced(state, next, {
		kind: "pass",
		actor: state.hold.priority,
		ok: true,
		cardId: null,
		target: null,
		end: null
	});
	const reflect = Boolean(state.pending && "back" in state.pending && state.pending.back);
	return withResults(state, marked, {
		blocked: Boolean(state.hold.blocker),
		reflect,
		turn: false
	});
}
function passResponseCore(state) {
	if (state.step !== "respond" || !state.hold || !state.pending || state.winner) return state;
	if (state.swap) return note(state, state.swap.locked ? "Hãy chọn 1 quái để hoán đổi." : "Hãy chọn hai quái để hoán đổi.");
	const hold = state.hold;
	const pending = state.pending;
	const foe = 1 - state.turn;
	if (pending.kind === "spell") {
		const ownerSide = pending.owner;
		const open = {
			...state,
			step: "main",
			pending: null,
			hold: null,
			turn: ownerSide
		};
		const owner = open.players[ownerSide];
		const hand = [...owner.hand, pending.cardId];
		const tolls = [...handTolls(owner), false];
		const target = redirectCover(state.players[1 - ownerSide].field, pending.target) ?? pending.target;
		const released = releaseGuardMark(castSpell(commitGuardShot(patch(open, ownerSide, {
			...owner,
			hand,
			tolls
		}), pending.source ?? "", target ?? "", false), hand.length - 1, target, true, pending.source ?? null), target);
		const foeSide = 1 - ownerSide;
		const pressed = Boolean(pending.target && state.players[foeSide].field.some((mon) => mon?.uid === pending.target)) || pending.cardId === "sam-set-tan-the" ? pressTide(released, foeSide) : released;
		return pressed.turn === ownerSide ? {
			...pressed,
			turn: state.turn
		} : pressed;
	}
	if (pending.kind === "face") {
		const blocker = hold.blocker;
		const mon = blocker ? state.players[foe].field.find((unit) => unit?.uid === blocker) ?? null : null;
		const legal = canIntercept(mon, Boolean(blocker));
		if (legal && mon && knightOpen(mon)) return askKnight(state, foe);
		const attacker = state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker) ?? null;
		if (legal && knightOpen(attacker)) return askKnight(state, state.turn);
		return {
			...resolveFace(state, legal ? blocker : null, legal && hold.blockerSkill),
			hold: null
		};
	}
	if (pending.kind === "melee") {
		const blocker = hold.blocker;
		const legal = canIntercept(blocker ? state.players[foe].field.find((unit) => unit?.uid === blocker) ?? null : null, Boolean(blocker));
		const defenderUid = redirectCover(state.players[foe].field, legal ? blocker : pending.defender) ?? (legal ? blocker : pending.defender);
		const defender = state.players[foe].field.find((unit) => unit?.uid === defenderUid) ?? null;
		const attacker = state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker) ?? null;
		if (knightOpen(defender)) return askKnight(state, foe);
		if (knightOpen(attacker)) return askKnight(state, state.turn);
		return {
			...resolveMelee(state, pending.attacker, defenderUid),
			hold: null
		};
	}
	if (pending.kind === "beam") {
		if (pending.back) return finishRebound(state);
		const blocker = hold.blocker;
		const legal = canIntercept(blocker ? state.players[1 - state.turn].field.find((unit) => unit?.uid === blocker) ?? null : null, Boolean(blocker));
		const target = redirectCover(state.players[foe].field, legal ? blocker : pending.target) ?? (legal ? blocker : pending.target);
		const open = commitGuardShot({
			...state,
			step: "main",
			pending: null,
			hold: null
		}, pending.caster, target ?? "", false);
		if (pending.index === 8 && open.echo === pending.caster) return swordFollow(open, target, true);
		if (pending.index === 9 && open.last === pending.caster) return swordLast(open, target, true);
		return releaseGuardMark(useSkill(open, pending.caster, target, pending.index, true, pending.extra ?? null, true), target);
	}
	if (pending.kind === "gnaw" || pending.kind === "gnaw-skill") return {
		...answerGnaw(state, false),
		hold: null
	};
	if (pending.kind === "lash") return finishLash(state);
	return {
		...state,
		step: "main",
		pending: null,
		hold: null
	};
}
var STAND_IN = "the-than-cua-shien";
function standAim(state) {
	const pending = state.pending;
	const hold = state.hold;
	if (!pending || !hold) return null;
	if (pending.kind === "face") {
		if (state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker)?.horn === "splash") return null;
		return {
			face: true,
			uid: null
		};
	}
	if (pending.kind === "melee" || pending.kind === "gnaw") {
		if (state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker)?.horn === "splash") return null;
		return {
			face: false,
			uid: pending.defender
		};
	}
	if ((pending.kind === "beam" || pending.kind === "gnaw-skill") && pending.target) {
		if (state.players[hold.priority].field.some((unit) => unit?.uid === pending.caster)) return null;
		return {
			face: false,
			uid: pending.target
		};
	}
	if (pending.kind === "spell" && pending.target && pending.owner !== hold.priority) return {
		face: false,
		uid: pending.target
	};
	return null;
}
function retargetStand(pending, uid) {
	if (pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") return {
		...pending,
		target: uid
	};
	if (pending.kind === "melee" || pending.kind === "gnaw") return {
		...pending,
		defender: uid
	};
	return pending;
}
function finishStand(state, ownerSide, owner, uid, line) {
	const pending = state.pending;
	if (!pending || !state.hold) return state;
	return {
		...note(patch(state, ownerSide, owner), line, "info"),
		step: "respond",
		pending: retargetStand(pending, uid),
		hold: {
			...state.hold,
			blocker: uid,
			blockerSkill: false,
			armed: null,
			priority: state.turn,
			passed: [false, false]
		}
	};
}
function canStand(state, uid) {
	if (state.step !== "respond" || !state.hold || !state.pending) return false;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	if (state.hold.priority !== ownerSide) return false;
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== STAND_IN || mon.hp <= 0 || !canIntercept(mon, true)) return false;
	const aim = standAim(state);
	if (!aim) return false;
	if (aim.face) {
		if (ownerSide === state.turn) return false;
	} else {
		if (!aim.uid || aim.uid === uid) return false;
		if (!owner.field.some((unit) => unit?.uid === aim.uid && unit.hp > 0)) return false;
	}
	return owner.orb >= 1 || Boolean(state.parley);
}
function standFor(state, uid) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => standFor(next, uid));
	const next = standForCore(state, uid);
	if (next === state) return next;
	const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
	const actor = state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1;
	const aim = standAim(state);
	return traced(state, next, {
		kind: "cover",
		actor,
		ok: next.hold?.blocker === uid,
		cardId: mon?.cardId ?? null,
		target: monsterTarget(state, aim?.uid),
		end: null
	});
}
function standForCore(state, uid) {
	if (!canStand(state, uid) || !state.hold || !state.pending) return state;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const owner = state.players[ownerSide];
	if (!owner.field.find((unit) => unit?.uid === uid)) return state;
	const paid = state.parley ? owner : pay$1(owner, 1);
	if (!paid) return note(state, "Cần 1 gem.");
	const aim = standAim(state);
	const ally = aim?.uid ? owner.field.find((unit) => unit?.uid === aim.uid) : null;
	return finishStand(state, ownerSide, paid, uid, actNotice("Thế thân", [aim?.face ? "chuyển đòn nhắm người chơi sang Thế thân của shien" : `chuyển mục tiêu từ ${ally ? cardOf(ally).name : "đồng minh"} sang Thế thân của shien`]));
}
function canStandHand(state, side) {
	if (state.step !== "respond" || !state.hold || state.hold.priority !== side || !state.pending) return false;
	const aim = standAim(state);
	if (!aim || aim.face || !aim.uid) return false;
	const owner = state.players[side];
	if (!owner.field.some((unit) => unit?.uid === aim.uid && unit.hp > 0)) return false;
	if (owner.orb < 1 && !state.parley) return false;
	return owner.reserve.some((card) => card.id === STAND_IN);
}
function standIn(state, reserveIndex) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => standIn(next, reserveIndex));
	const next = standInCore(state, reserveIndex);
	if (next === state) return next;
	const side = state.hold?.priority ?? state.turn;
	return traced(state, next, {
		kind: "cover",
		actor: side,
		ok: next.players[side].field.some((mon) => mon?.cardId === STAND_IN && !state.players[side].field.some((unit) => unit?.uid === mon.uid)),
		cardId: STAND_IN,
		target: monsterTarget(state, standAim(state)?.uid),
		end: null
	});
}
function standInCore(state, reserveIndex) {
	if (!state.hold || !state.pending) return state;
	const ownerSide = state.hold.priority;
	if (!canStandHand(state, ownerSide)) return state;
	const owner = state.players[ownerSide];
	const held = owner.reserve[reserveIndex];
	if (held?.id !== STAND_IN) return state;
	const aim = standAim(state);
	const slot = owner.field.findIndex((unit) => unit?.uid === aim?.uid);
	const ally = slot >= 0 ? owner.field[slot] : null;
	if (!ally || !aim?.uid) return state;
	const paid = state.parley ? owner : pay$1(owner, 1);
	if (!paid) return note(state, "Cần 1 gem.");
	const seq = state.seq + 1;
	const body = place({
		...state,
		seq
	}, ownerSide, STAND_IN, held.saved ? held : void 0);
	const field = [...paid.field];
	field[slot] = body;
	const reserve = paid.reserve.filter((_, index) => index !== reserveIndex);
	reserve.push({
		...pileFromField(ally),
		freeAt: owner.turns
	});
	const swapped = {
		...paid,
		field,
		reserve
	};
	const line = actNotice("Thế thân", [`đưa ${cardOf(ally).name} về tay`, "đòn rơi vào Thế thân của shien"]);
	return finishStand({
		...state,
		seq: seq + 1
	}, ownerSide, swapped, body.uid, line);
}
function wallAim(state) {
	const pending = state.pending;
	if (!pending) return null;
	if (pending.kind === "melee" || pending.kind === "gnaw") return {
		kind: "melee",
		uid: pending.defender
	};
	if ((pending.kind === "beam" || pending.kind === "gnaw-skill") && pending.target) {
		const caster = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === pending.caster);
		if (!caster || !harmSkill(caster.cardId, pending.index)) return null;
		return {
			kind: "beam",
			uid: pending.target
		};
	}
	return null;
}
function spendWall(mon) {
	if (mon.blocksLeft > 1) return {
		...mon,
		blocksLeft: mon.blocksLeft - 1,
		dim: false
	};
	return {
		...mon,
		dim: true
	};
}
function canWall(state, uid) {
	if (state.step !== "respond" || !state.hold || !state.pending) return false;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	if (state.hold.priority !== ownerSide) return false;
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== "linh-chien-da-khong-lo" || !canIntercept(mon)) return false;
	const aim = wallAim(state);
	if (!aim || aim.uid === uid) return false;
	if (!owner.field.find((unit) => unit?.uid === aim.uid && unit.hp > 0)) return false;
	return owner.orb >= skillManaCost(mon.cardId, 1) || Boolean(state.parley);
}
function wallAlly(state, uid) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => wallAlly(next, uid));
	const next = wallAllyCore(state, uid);
	if (next === state) return next;
	const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
	const actor = state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1;
	const aim = wallAim(state);
	const ok = next.hold?.blocker === uid;
	if (!ok && next.players === state.players && next.upkeep && !state.upkeep) return next;
	return traced(state, next, {
		kind: "wall",
		actor,
		ok,
		cardId: mon?.cardId ?? null,
		target: monsterTarget(state, aim?.uid),
		end: null
	});
}
function wallAllyCore(state, uid) {
	if (!canWall(state, uid) || !state.hold || !state.pending) return state;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid);
	const aim = wallAim(state);
	if (!mon || !aim) return state;
	const ally = owner.field.find((unit) => unit?.uid === aim.uid);
	if (!ally) return state;
	const paid = pay$1(owner, skillManaCost(mon.cardId, 1));
	if (!paid) return note(state, "Cần 1 gem.");
	const soldier = aim.kind === "beam" ? spendWall(mon) : spentAct(mon);
	const patched = patch(state, ownerSide, {
		...paid,
		field: paid.field.map((unit) => unit?.uid === uid ? soldier : unit)
	});
	const pending = patched.pending ?? state.pending;
	const nextPending = pending.kind === "beam" || pending.kind === "gnaw-skill" ? {
		...pending,
		target: uid
	} : pending.kind === "melee" || pending.kind === "gnaw" ? {
		...pending,
		defender: uid
	} : pending;
	return {
		...note(patched, `${cardOf(mon).name} đỡ đòn cho ${cardOf(ally).name}.`, "info"),
		step: "respond",
		pending: nextPending,
		hold: {
			...state.hold,
			blocker: uid,
			blockerSkill: false,
			armed: null,
			priority: state.turn,
			passed: [false, false]
		}
	};
}
function spiritAim(state) {
	const pending = state.pending;
	if (!pending) return null;
	if (pending.kind === "melee" || pending.kind === "gnaw") return state.hold?.blocker ?? pending.defender;
	if ((pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") && pending.target) return state.hold?.blocker ?? pending.target;
	return null;
}
function canSpirit(state, uid) {
	if (state.step !== "respond" || !state.hold || !state.pending) return false;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	if (state.hold.priority !== ownerSide) return false;
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
	if (!canIntercept(mon) || mon.cardId === "thien-than-be-nho") return false;
	const aim = spiritAim(state);
	if (!aim || aim === uid) return false;
	const ally = owner.field.find((unit) => unit?.uid === aim && unit.hp > 0 && unit.cardId === "thien-than-be-nho");
	return Boolean(ally);
}
function spiritCover(state, uid) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => spiritCover(next, uid));
	const next = spiritCoverCore(state, uid);
	if (next === state) return next;
	const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
	const actor = state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1;
	const aim = spiritAim(state);
	return traced(state, next, {
		kind: "cover",
		actor,
		ok: next.hold?.blocker === uid,
		cardId: mon?.cardId ?? null,
		target: monsterTarget(state, aim),
		end: null
	});
}
function spiritCoverCore(state, uid) {
	if (!canSpirit(state, uid) || !state.hold || !state.pending) return state;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid);
	const aim = spiritAim(state);
	const ally = aim ? owner.field.find((unit) => unit?.uid === aim) : null;
	if (!mon || !ally) return state;
	const spent = spentAct(mon);
	const patched = patch(state, ownerSide, {
		...owner,
		field: owner.field.map((unit) => unit?.uid === uid ? spent : unit)
	});
	const pending = state.pending;
	const nextPending = pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? {
		...pending,
		target: uid
	} : pending.kind === "melee" || pending.kind === "gnaw" ? {
		...pending,
		defender: uid
	} : pending;
	return {
		...note(patched, `${cardOf(mon).name} đỡ đòn hộ cho ${cardOf(ally).name}.`, "info"),
		step: "respond",
		pending: nextPending,
		hold: {
			...state.hold,
			blocker: uid,
			blockerSkill: false,
			armed: null,
			priority: state.turn,
			passed: [false, false]
		}
	};
}
function assignBlock(state, blockerUid, withSkill = false) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => assignBlock(next, blockerUid, withSkill));
	const next = assignBlockCore(state, blockerUid, withSkill);
	if (next === state) return next;
	const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === blockerUid) ?? null;
	const actor = state.players[0].field.some((unit) => unit?.uid === blockerUid) ? 0 : 1;
	const ok = next.hold?.blocker === blockerUid;
	if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
	const attacker = state.pending && (state.pending.kind === "face" || state.pending.kind === "melee") ? state.pending.attacker : null;
	return traced(state, next, {
		kind: "block",
		actor,
		ok,
		cardId: mon?.cardId ?? null,
		target: monsterTarget(state, attacker),
		end: null
	});
}
function assignBlockCore(state, blockerUid, withSkill = false) {
	const defender = 1 - state.turn;
	const pending = state.pending;
	const canIntercept = pending?.kind === "face";
	if (state.step !== "respond" || !state.hold || state.hold.priority !== defender) return note(state, "Chưa tới lượt chặn");
	if (!canIntercept) return note(state, "Quái chỉ chặn đòn đánh vào người");
	const you = state.players[defender];
	const blocker = you.field.find((mon) => mon?.uid === blockerUid) ?? null;
	if (!blocker || blocker.dim || blocker.cardId === "chan-ken" || held(blocker) || hexLocked(blocker) || blocker.noBlock || (blocker.path ?? 0) > 0) return note(state, "Quái này không chặn được");
	let next = state;
	let skill = false;
	if (withSkill) {
		if (blocker.cardId !== "chien-si-gam-nham") return note(state, "Quái này không có kỹ năng chặn.");
		const paid = payCost(you, skillManaCost(blocker.cardId));
		if (!paid) return assignBlock(state, blockerUid, false);
		next = patch(state, defender, {
			...paid,
			field: paid.field.map((mon) => mon?.uid === blocker.uid ? boostGnaw(blocker) : mon)
		});
		skill = true;
	}
	const actor = next.players[defender].field.find((mon) => mon?.uid === blocker.uid) ?? blocker;
	if (!actor.dim && actor.blocksLeft <= 1) next = patch(next, defender, {
		...next.players[defender],
		field: next.players[defender].field.map((mon) => mon?.uid === blocker.uid ? spentAct(mon) : mon)
	});
	if (smashPlain(blocker) || blocker.cardId === GUARD_KNIGHT) {
		const owner = next.players[defender];
		const paid = pay$1(owner, 1);
		if (!paid) return note(state, "Cần 1 mana.");
		next = patch(next, defender, paid);
	}
	if (blocker.cardId === GUARD_KNIGHT) {
		const owner = next.players[defender];
		next = patch(next, defender, {
			...owner,
			field: owner.field.map((mon) => mon?.uid === blocker.uid ? {
				...mon,
				guarding: true,
				oathShot: false
			} : mon)
		});
	}
	const acted = markQueenAct(next, defender, blocker.uid);
	const blocked = {
		...note(acted.state, blocker.cardId === GUARD_KNIGHT ? `${cardOf(blocker).name} dùng Kiếm phòng ngự.${acted.extra}` : `${cardOf(blocker).name} sẽ chặn.${acted.extra}`, "info"),
		step: "respond",
		pending: state.pending,
		hold: {
			priority: state.turn,
			passed: [false, false],
			blocker: blockerUid,
			blockerSkill: skill,
			armed: null
		}
	};
	const ids = [blockerUid];
	if (pending?.kind === "face") ids.push(pending.attacker);
	return stampLegend(blocked, ids);
}
function canGuardCover(state, uid) {
	if (state.step !== "respond" || !state.hold || !state.pending) return false;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	if (state.hold.priority !== ownerSide) return false;
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== GUARD_KNIGHT && mon.cardId !== MYSTIC || !canIntercept(mon) || mon.dim) return false;
	if (owner.orb < 1 && !state.parley) return false;
	const pending = state.pending;
	if (pending.kind === "face") return mon.cardId === MYSTIC;
	const aim = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? pending.target : null;
	if (!aim || aim === uid) return false;
	return owner.field.some((unit) => unit?.uid === aim && unit.hp > 0);
}
function guardCover(state, uid) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => guardCover(next, uid));
	if (!canGuardCover(state, uid) || !state.hold || !state.pending) return state;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid);
	const pending = state.pending;
	const aim = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? pending.target : null;
	const ally = aim ? owner.field.find((unit) => unit?.uid === aim) : null;
	if (!mon || !ally && pending.kind !== "face") return state;
	const paid = pay$1(owner, 1);
	if (!paid) return note(state, "Cần 1 mana.");
	const body = {
		...spentAct(mon),
		guarding: true,
		oathShot: false
	};
	const patched = patch(state, ownerSide, {
		...paid,
		field: paid.field.map((unit) => unit?.uid === uid ? body : unit)
	});
	if (pending.kind === "face") return {
		...note(patched, mon.cardId === MYSTIC ? `${cardOf(mon).name} dùng Phòng ngự, đỡ đòn cho người chơi.` : `${cardOf(mon).name} dùng Kiếm phòng ngự, đỡ đòn cho người chơi.`, "info"),
		step: "respond",
		pending,
		hold: {
			...state.hold,
			blocker: uid,
			blockerSkill: false,
			armed: null,
			priority: state.turn,
			passed: [false, false]
		}
	};
	if (!ally) return state;
	const nextPending = pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? {
		...pending,
		target: uid
	} : pending.kind === "melee" || pending.kind === "gnaw" ? {
		...pending,
		defender: uid
	} : pending;
	return {
		...note(patched, mon.cardId === MYSTIC ? `${cardOf(mon).name} dùng Phòng ngự, đỡ đòn cho ${cardOf(ally).name}.` : `${cardOf(mon).name} dùng Kiếm phòng ngự, đỡ đòn cho ${cardOf(ally).name}.`, "info"),
		step: "respond",
		pending: nextPending,
		hold: {
			...state.hold,
			blocker: uid,
			blockerSkill: false,
			armed: null,
			priority: state.turn,
			passed: [false, false]
		}
	};
}
function boostGnawOnChain(state, picked) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => boostGnawOnChain(next, picked));
	if (state.step !== "respond" || !state.hold || !state.pending) return state;
	const pending = state.pending;
	const uid = picked ?? (pending.kind === "melee" ? state.hold.blocker ?? pending.defender : pending.kind === "face" ? state.hold.blocker : pending.kind === "beam" ? state.hold.blocker ?? pending.target : pending.kind === "gnaw" ? pending.defender : pending.kind === "gnaw-skill" ? pending.target : null);
	if (!uid) return note(state, "Chưa có quân để gặm nhắm.");
	if (pending.kind === "face" && pending.attacker === uid) return note(state, "Đang tấn công thì không gặm nhắm được.");
	if (pending.kind === "melee" && pending.attacker === uid) return note(state, "Đang tấn công thì không gặm nhắm được.");
	if (pending.kind === "beam" && pending.caster === uid) return note(state, "Đang tấn công thì không gặm nhắm được.");
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	if (state.hold.priority !== ownerSide) return note(state, "Chưa tới lượt phản ứng.");
	const owner = state.players[ownerSide];
	const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== "chien-si-gam-nham" || mon.dim) return note(state, mon?.dim ? "Quái này đã hành động." : `Không phải ${monsterCard("chien-si-gam-nham")?.name}.`);
	const cost = skillManaCost(mon.cardId);
	const paid = payCost(owner, cost);
	if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
	const bonus = skillHpBonus(mon.cardId);
	const next = patch(state, ownerSide, {
		...paid,
		field: paid.field.map((unit) => unit?.uid === uid ? boostGnaw(mon) : unit)
	});
	return keep(note(next.hold ? {
		...next,
		hold: {
			...next.hold,
			armed: uid
		}
	} : next, `${cardOf(mon).name} nhân đôi phòng ngự và tăng ${bonus} máu tối đa.`, "spell"));
}
function threatenedSide(state) {
	const pending = state.pending;
	if (!pending || state.step !== "respond") return null;
	if (pending.kind === "face" || pending.kind === "melee" || pending.kind === "gnaw" || pending.kind === "gnaw-skill") return 1 - state.turn;
	if (pending.kind === "beam") {
		if (!pending.target) return 1 - state.turn;
		if (state.players[0].field.some((mon) => mon?.uid === pending.target)) return 0;
		if (state.players[1].field.some((mon) => mon?.uid === pending.target)) return 1;
		return 1 - state.turn;
	}
	return null;
}
function openSlots(player) {
	return player.field.filter((cell, index) => !cell && (player.locked?.[index] ?? 0) === 0).length;
}
function cottonOffer(state, side) {
	const none = {
		self: false,
		copy: false,
		hand: false,
		handCopy: false
	};
	if (state.step !== "respond" || !state.hold || state.hold.priority !== side || state.winner) return none;
	if (threatenedSide(state) !== side) return none;
	const you = state.players[side];
	const original = you.field.find((mon) => mon && mon.cardId === "cuc-bong-ma-quai" && !mon.copy && !mon.dim && mon.stun === 0 && !mon.noBlock) ?? null;
	const room = openSlots(you);
	const inHand = you.reserve.some((card) => card.id === "cuc-bong-ma-quai");
	return {
		self: Boolean(original),
		copy: Boolean(original && room >= 1 && you.orb >= 1),
		hand: inHand && room >= 1,
		handCopy: inHand && room >= 2 && you.orb >= 1
	};
}
function redirectHit(state, uid) {
	if (!state.hold || !state.pending) return state;
	const pending = state.pending;
	const nextPending = pending.kind === "beam" ? {
		...pending,
		target: uid
	} : pending.kind === "melee" ? {
		...pending,
		defender: uid
	} : pending.kind === "gnaw" ? {
		...pending,
		defender: uid
	} : pending.kind === "gnaw-skill" ? {
		...pending,
		target: uid
	} : pending;
	return {
		...note(state, `${monsterCard("cuc-bong-ma-quai")?.name} đỡ đòn.`, "info"),
		pending: nextPending,
		hold: {
			...state.hold,
			blocker: uid,
			blockerSkill: false,
			armed: null,
			priority: state.turn,
			passed: [false, false]
		}
	};
}
function cottonCover(state, mode) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => cottonCover(next, mode));
	if (!state.hold || state.step !== "respond") return state;
	const side = state.hold.priority;
	const offer = cottonOffer(state, side);
	const you = state.players[side];
	const name = monsterCard("cuc-bong-ma-quai")?.name ?? "Cục bông ma quái";
	if (mode === "self") {
		const mon = you.field.find((unit) => unit && unit.cardId === "cuc-bong-ma-quai" && !unit.copy && !unit.dim && unit.stun === 0 && !unit.noBlock) ?? null;
		if (!offer.self || !mon) return note(state, `${name} không đỡ được.`);
		return redirectHit(state, mon.uid);
	}
	if (mode === "copy") {
		if (!offer.copy) return note(state, "Không đủ mana hoặc ô trống để nhân bản.");
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem.");
		const field = [...paid.field];
		const slot = field.findIndex((cell, index) => !cell && (paid.locked?.[index] ?? 0) === 0);
		if (slot < 0) return note(state, "Không còn ô trống.");
		const seq = state.seq + 1;
		const copy = {
			...place({
				...state,
				seq
			}, side, "cuc-bong-ma-quai"),
			copy: true
		};
		field[slot] = copy;
		const marked = field.map((unit) => unit && unit.cardId === "cuc-bong-ma-quai" && !unit.copy ? {
			...unit,
			dim: true
		} : unit);
		return redirectHit(patch({
			...state,
			seq: seq + 1
		}, side, {
			...paid,
			field: marked
		}), copy.uid);
	}
	if (mode === "hand" ? !offer.hand : !offer.handCopy) return note(state, `${name} không triệu hồi nhanh được.`);
	const index = you.reserve.findIndex((card) => card.id === "cuc-bong-ma-quai");
	const paid = mode === "hand-copy" ? pay$1(you, 1) : you;
	if (!paid || index < 0) return note(state, "Cần 1 gem.");
	const field = [...paid.field];
	const slots = field.flatMap((cell, slot) => !cell && (paid.locked?.[slot] ?? 0) === 0 ? [slot] : []);
	if (slots.length === 0 || mode === "hand-copy" && slots.length < 2) return note(state, "Không còn ô trống.");
	let seq = state.seq + 1;
	const body = {
		...place({
			...state,
			seq
		}, side, "cuc-bong-ma-quai", paid.reserve[index]),
		dim: true
	};
	field[slots[0]] = body;
	let guard = body.uid;
	if (mode === "hand-copy") for (const slot of slots.slice(1)) {
		seq += 1;
		const copy = {
			...place({
				...state,
				seq
			}, side, "cuc-bong-ma-quai"),
			copy: true
		};
		field[slot] = copy;
		guard = copy.uid;
	}
	const reserve = paid.reserve.filter((_, slot) => slot !== index);
	return redirectHit(patch({
		...state,
		seq: seq + 1
	}, side, {
		...paid,
		field,
		reserve
	}), guard);
}
function hellCount(text, word, fallback) {
	const full = new RegExp(`(\\d+)\\s*sát thương\\s+${word}`, "i").exec(text);
	if (full) return Number(full[1]);
	const brief = new RegExp(`(\\d+)\\s*${word}`, "i").exec(text);
	return brief ? Number(brief[1]) : fallback;
}
function hellFigures(id) {
	const text = skillText(id);
	const spill = /từ\s*(\d+)\s*trở lên/i.exec(text);
	return {
		phys: hellCount(text, "vật lý", 4),
		spell: hellCount(text, "phép", 5),
		tru: hellCount(text, "chuẩn", 2),
		spill: spill ? Number(spill[1]) : 6
	};
}
function hellSplit(pack, hp) {
	const total = pack.phys + pack.spell + pack.tru;
	if (hp <= 0) return {
		left: pack,
		killed: true
	};
	if (total < hp) return {
		left: {
			phys: 0,
			spell: 0,
			tru: 0
		},
		killed: false
	};
	const budget = Math.min(hp, pack.phys + pack.spell);
	const bigIsPhys = pack.phys >= pack.spell;
	const big = bigIsPhys ? pack.phys : pack.spell;
	const small = bigIsPhys ? pack.spell : pack.phys;
	const smallTake = Math.min(small, Math.floor(budget / 2));
	const bigTake = Math.min(big, budget - smallTake);
	const physTake = bigIsPhys ? bigTake : smallTake;
	const spellTake = bigIsPhys ? smallTake : bigTake;
	const trueTake = Math.min(pack.tru, Math.max(0, hp - physTake - spellTake));
	return {
		left: {
			phys: pack.phys - physTake,
			spell: pack.spell - spellTake,
			tru: pack.tru - trueTake
		},
		killed: true
	};
}
function hellMitigate(pack, mon, allies) {
	const phys = Math.max(0, pack.phys - liveDef(mon, allies));
	const spell = Math.max(0, pack.spell - liveMdef(mon, allies));
	const scale = mon.vulnerable > 0 ? 2 : 1;
	return {
		phys: phys * scale,
		spell: spell * scale,
		tru: pack.tru * scale
	};
}
function hellSum(pack) {
	return pack.phys + pack.spell + pack.tru;
}
function actNotice(title, actions) {
	const lines = actions.map((line) => line.trim()).filter(Boolean);
	if (lines.length === 0) return title;
	if (lines.length === 1) return `${title} ${lines[0].replace(/^[-\s]+/u, "").replace(/[.。]+$/u, "")}.`;
	return [title, ...lines.map((line) => `- ${line.replace(/^[-\s]+/u, "").replace(/[.。]+$/u, "")}.`)].join("\n");
}
function hellLine(pack, name, broke = null, body, allies, pool) {
	const have = pool ?? phantomPool(body, allies);
	const spell = Math.max(0, pack.spell);
	const phys = Math.max(0, pack.phys);
	const truRaw = Math.max(0, pack.tru);
	const spellTake = Math.min(have, spell);
	const physTake = Math.min(Math.max(0, have - spell), phys);
	const tru = Math.max(0, truRaw - Math.max(0, have - spell - phys));
	const other = [
		pack.phys > 0 ? `${phys - physTake} sát thương vật lý` : "",
		pack.spell > 0 ? `${spell - spellTake} sát thương phép` : "",
		pack.tru > 0 ? `${tru} sát thương chuẩn` : ""
	].filter(Boolean);
	const zeroed = broke === "phys" && pack.phys === 0 ? "0 sát thương vật lý" : broke === "spell" && pack.spell === 0 ? "0 sát thương phép" : "";
	const tag = broke ? ` ${wardTag(broke)}` : "";
	if (other.length > 0) return [`gây ${other.join(", ")} lên ${name}${tag}`];
	if (zeroed) return [`gây ${zeroed} lên ${name}${tag}`];
	return [`gây 0 sát thương lên ${name}${tag}`];
}
function soakPack(mon, pack) {
	if (mon.cage || !mon.ward) return {
		mon,
		pack,
		broke: null
	};
	if (mon.wardStay) {
		if (mon.ward !== "spell" || pack.spell <= 0) return {
			mon,
			pack,
			broke: null
		};
		return {
			mon: {
				...mon,
				ward: void 0,
				wardStay: void 0
			},
			pack: {
				...pack,
				spell: 0
			},
			broke: "spell"
		};
	}
	const matched = mon.ward === "phys" ? pack.phys : pack.spell;
	const other = mon.ward === "phys" ? pack.spell : pack.phys;
	if (matched <= 0 && other <= 0) return {
		mon,
		pack,
		broke: null
	};
	const popped = {
		...mon,
		ward: void 0
	};
	if (matched > 0) return {
		mon: popped,
		pack: {
			...pack,
			[mon.ward]: 0
		},
		broke: mon.ward
	};
	return {
		mon: popped,
		pack,
		broke: mon.ward
	};
}
function landHell(mon, pack, allies) {
	const physGate = swallowOath(mon, "phys", pack.phys);
	const spellGate = swallowOath(physGate.mon, "spell", pack.spell);
	mon = spellGate.mon;
	pack = {
		phys: physGate.amount,
		spell: spellGate.amount,
		tru: pack.tru
	};
	const sliced = mon.cardId === "chien-binh-rong" ? {
		phys: third(pack.phys),
		spell: third(pack.spell),
		tru: third(pack.tru)
	} : pack;
	const body = mon.cardId === "chien-binh-rong" ? pushDebt(mon, {
		p: sliced.phys,
		s: sliced.spell,
		t: sliced.tru
	}) : mon;
	const rawSpell = sliced.spell;
	const guarded = soakPack(body, hellMitigate(sliced, body, allies));
	const blockedSpell = Math.max(0, Math.min(rawSpell, liveMdef(body, allies)));
	const hit = applyIncoming(guarded.mon, hellSum(guarded.pack), allies);
	const stored = mon.cardId === "sua-hut-ma-phap" ? (hit.mon.stored ?? 0) + blockedSpell : hit.mon.stored;
	return {
		mon: {
			...hit.mon,
			stored
		},
		dealt: hellSum(guarded.pack),
		left: hellSplit(guarded.pack, mon.hp).left,
		blockedSpell,
		taken: guarded.pack,
		broke: guarded.broke
	};
}
function resolveHell(state, attacker, defender) {
	const side = state.players[0].field.some((mon) => mon?.uid === attacker.uid) ? 0 : 1;
	const foe = state.players[0].field.some((mon) => mon?.uid === defender.uid) ? 0 : 1;
	const you = state.players[side];
	const them = state.players[foe];
	const releaseHex = bindSkillHex(attacker);
	const figures = hellFigures(attacker.cardId);
	if (attacker.skillUp) figures.spell += attacker.skillUp;
	const shaved = shaveHex(attacker, figures);
	const shot = {
		phys: outgoing(attacker, shaved.phys),
		spell: outgoing(attacker, shaved.spell),
		tru: outgoing(attacker, shaved.tru)
	};
	releaseHex();
	const mainPool = phantomPool(defender, them.field);
	const landed = landHell(defender, shot, them.field);
	const killed = landed.mon.hp <= 0;
	const leftover = killed ? landed.left : {
		phys: 0,
		spell: 0,
		tru: 0
	};
	const spill = killed && hellSum(leftover) >= figures.spill;
	const others = them.field.filter((mon) => Boolean(mon && mon.uid !== defender.uid && mon.hp > 0));
	const splashHits = spill ? others.map((mon) => {
		const pool = phantomPool(mon, them.field);
		const hit = landHell(mon, leftover, them.field);
		return {
			uid: mon.uid,
			name: cardOf(mon).name,
			dealt: hit.dealt,
			mon: hit.mon,
			taken: hit.taken,
			broke: hit.broke,
			from: mon,
			pool
		};
	}) : [];
	const foeField = them.field.map((mon) => {
		if (!mon) return mon;
		if (mon.uid === defender.uid) return landed.mon;
		return splashHits.find((row) => row.uid === mon.uid)?.mon ?? mon;
	});
	const spent = (mon) => mon.uid === attacker.uid ? {
		...mon,
		dim: true
	} : mon;
	const yourField = (side === foe ? foeField : you.field).map((mon) => mon ? spent(mon) : mon);
	let next = patch(state, side, {
		...you,
		field: yourField
	});
	if (side !== foe) next = patch(next, foe, dropDead({
		...them,
		field: foeField
	}));
	else next = patch(next, side, dropDead({
		...you,
		field: yourField
	}));
	const actions = [...hellLine(landed.taken, cardOf(defender).name, landed.broke, defender, them.field, mainPool), ...splashHits.flatMap((row) => hellLine(row.taken, row.name, row.broke, row.from, them.field, row.pool))];
	return releaseLegend({
		...note(next, actNotice(castName(attacker.cardId, 0), actions), "spell"),
		step: "main",
		pending: null,
		hold: null,
		skill: {
			id: attacker.cardId,
			index: 0,
			aim: defender.uid
		}
	});
}
function openGuardShot(attacker, defender, melee, allies, roster) {
	if (defender.cardId !== GUARD_KNIGHT || !defender.guarding || defender.oathShot) return {
		attacker,
		defender,
		line: ""
	};
	const due = defender.debt?.[0];
	const folded = melee && Boolean(due && ((due.p ?? 0) > 0 || (due.s ?? 0) > 0));
	const cleared = {
		...defender,
		debt: void 0,
		oathShot: true,
		riposte: folded || void 0
	};
	if (!due || (due.p ?? 0) <= 0 && (due.s ?? 0) <= 0) return {
		attacker,
		defender: cleared,
		line: ""
	};
	const blow = melee ? liveAtk(defender) : 0;
	const spellBlow = guardStrikeKind(defender, roster) === "spell";
	const phys = due.p + (spellBlow ? 0 : blow);
	const spell = due.s + (spellBlow ? blow : 0);
	return {
		attacker: landHell(attacker, {
			phys,
			spell,
			tru: 0
		}, allies).mon,
		defender: cleared,
		line: `${cardOf(defender).name} phản ${phys} sát thương vật lý và ${spell} sát thương phép.`
	};
}
function commitGuardShot(state, attackerUid, defenderUid, melee) {
	const attackerSide = state.players[0].field.some((mon) => mon?.uid === attackerUid) ? 0 : 1;
	const attacker = state.players[attackerSide].field.find((mon) => mon?.uid === attackerUid) ?? null;
	const defenderSide = state.players[0].field.some((mon) => mon?.uid === defenderUid) ? 0 : 1;
	const defender = state.players[defenderSide].field.find((mon) => mon?.uid === defenderUid) ?? null;
	if (!defender) return state;
	if (!attacker) {
		if (defender.cardId !== GUARD_KNIGHT || !defender.guarding || defender.oathShot) return state;
		const due = defender.debt?.[0];
		const cleared = {
			...defender,
			debt: void 0,
			oathShot: true
		};
		const foe = 1 - defenderSide;
		let next = patch(state, defenderSide, {
			...state.players[defenderSide],
			field: state.players[defenderSide].field.map((mon) => mon?.uid === defender.uid ? cleared : mon)
		});
		if (!due || (due.p ?? 0) <= 0 && (due.s ?? 0) <= 0) return next;
		const dealt = due.p + due.s;
		next = patch(next, foe, {
			...next.players[foe],
			hp: next.players[foe].hp - dealt
		});
		return note(next, `${cardOf(defender).name} phản ${due.p} sát thương vật lý và ${due.s} sát thương phép.`, "hit");
	}
	const shot = openGuardShot(attacker, defender, melee, state.players[attackerSide].field, state.players[defenderSide].roster);
	if (shot.attacker === attacker && shot.defender === defender) return state;
	let next = patch(state, attackerSide, {
		...state.players[attackerSide],
		field: state.players[attackerSide].field.map((mon) => mon?.uid === attacker.uid ? shot.attacker : mon)
	});
	const foe = next.players[defenderSide];
	next = patch(next, defenderSide, {
		...foe,
		field: foe.field.map((mon) => mon?.uid === defender.uid ? shot.defender : mon)
	});
	return shot.line ? note(next, shot.line, "hit") : next;
}
function releaseGuardMark(state, uid) {
	if (!uid) return state;
	for (const side of [0, 1]) {
		const you = state.players[side];
		if (!you.field.some((mon) => mon?.uid === uid && (mon.guarding || mon.oathShot))) continue;
		return patch(state, side, {
			...you,
			field: you.field.map((mon) => mon?.uid === uid ? {
				...mon,
				guarding: void 0,
				oathShot: void 0,
				riposte: void 0
			} : mon)
		});
	}
	return state;
}
function parleyActor(talk) {
	if (talk.step === "pick-victim" || talk.step === "pick-lunger2") return talk.side;
	return 1 - talk.side;
}
function parleyPicker(state) {
	if (!state.parley || state.step !== "main" || state.parley.step === "fight") return null;
	return parleyActor(state.parley);
}
function living(field, uid) {
	return field.find((mon) => mon?.uid === uid && mon.hp > 0 && mon.cardId !== "mu") ?? null;
}
function startParley(state, uid) {
	if (state.step !== "main" || state.winner || state.parley) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	const side = state.turn;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.dim || held(mon) || (mon.path ?? 0) > 0) return state;
	const foes = state.players[1 - side].field.filter((unit) => unit && unit.hp > 0 && unit.cardId !== "mu");
	if (mon.cardId === MYSTIC) {
		if (foes.length < 1) return note(state, "Đối phương cần ít nhất 1 quái trên sân.");
		const paid = pay$1(you, 2);
		if (!paid) return note(state, "Cần 2 mana.");
		return note({
			...patch(state, side, paid),
			parley: {
				queen: uid,
				side,
				kind: "mystic",
				step: "pick-victim",
				round: 1,
				home: side
			}
		}, `${cardOf(mon).name} dùng Đàm phán.`, "info");
	}
	if (mon.cardId !== QUEEN_KNIGHT) return state;
	if (you.field.filter((unit) => unit && unit.hp > 0 && unit.uid !== uid && unit.cardId !== "mu").length < 1 || foes.length < 1) return note(state, "Mỗi bên cần ít nhất 1 quái ngoài Hiệp sĩ của hậu.");
	const paid = pay$1(you, 1);
	if (!paid) return note(state, "Cần 1 mana.");
	const field = paid.field.map((unit) => unit?.uid === uid ? {
		...unit,
		dim: true
	} : unit);
	return note({
		...patch(state, side, {
			...paid,
			field
		}),
		parley: {
			queen: uid,
			side,
			step: "pick-victim",
			round: 1,
			home: side
		}
	}, `${cardOf(mon).name} dùng Đàm phán.`, "info");
}
function pickParley(state, uid) {
	const talk = state.parley;
	if (!talk || state.step !== "main" || talk.step === "fight") return state;
	if (uid === "face") {
		if (talk.kind !== "mystic" || talk.step !== "pick-victim") return state;
		return note({
			...state,
			parley: {
				...talk,
				step: "pick-lunger",
				victim: "face"
			}
		}, "Người chơi sẽ chịu đòn.", "info");
	}
	if (talk.kind === "mystic" && talk.step === "pick-victim" && uid === talk.queen) return note(state, "Chọn người chơi hoặc một quái khác.");
	const side = parleyActor(talk);
	const mon = living(state.players[side].field, uid);
	if (!mon) return note(state, "Chọn một quái trên sân.");
	if (talk.step === "pick-victim") return note({
		...state,
		parley: {
			...talk,
			step: "pick-lunger",
			victim: uid
		}
	}, `${cardOf(mon).name} sẽ chịu đòn.`, "info");
	if (talk.step === "pick-lunger") return openParleyFight(state, uid, talk.victim ?? "", 1);
	if (talk.step === "pick-victim2") {
		const nextTalk = {
			...talk,
			step: "pick-lunger2",
			victim: uid,
			round: 2
		};
		if (talk.forced) {
			const queen = living(state.players[talk.side].field, talk.queen);
			if (!queen) return {
				...state,
				parley: null
			};
			return openParleyFight({
				...state,
				parley: nextTalk
			}, queen.uid, uid, 2);
		}
		return note({
			...state,
			parley: nextTalk
		}, `${cardOf(mon).name} sẽ chịu đòn.`, "info");
	}
	return openParleyFight(state, uid, talk.victim ?? "", 2);
}
function openParleyFight(state, attackerUid, defenderUid, round) {
	const talk = state.parley;
	if (!talk) return state;
	if (defenderUid === "face") {
		const attackerSide = state.players[0].field.some((mon) => mon?.uid === attackerUid) ? 0 : 1;
		const attacker = living(state.players[attackerSide].field, attackerUid);
		if (!attacker) return {
			...state,
			parley: null
		};
		const keep = { [attacker.uid]: {
			dim: attacker.dim,
			blessAtk: attacker.blessAtk ?? 0,
			blessDmg: attacker.blessDmg ?? 0,
			nextDef: attacker.nextDef ?? 0
		} };
		return {
			...beginHold({
				...state,
				turn: attackerSide
			}, {
				kind: "face",
				attacker: attacker.uid
			}, `${cardOf(attacker).name} đánh vào người theo Đàm phán.`),
			parley: {
				...talk,
				step: "fight",
				round,
				victim: "face",
				lunger: attacker.uid,
				keep
			}
		};
	}
	const attackerSide = state.players[0].field.some((mon) => mon?.uid === attackerUid) ? 0 : 1;
	const defenderSide = state.players[0].field.some((mon) => mon?.uid === defenderUid) ? 0 : 1;
	const attacker = living(state.players[attackerSide].field, attackerUid);
	const defender = living(state.players[defenderSide].field, defenderUid);
	if (!attacker || !defender) return {
		...state,
		parley: null
	};
	const keep = {
		[attacker.uid]: {
			dim: attacker.dim,
			blessAtk: attacker.blessAtk ?? 0,
			blessDmg: attacker.blessDmg ?? 0,
			nextDef: attacker.nextDef ?? 0
		},
		[defender.uid]: {
			dim: defender.dim,
			blessAtk: defender.blessAtk ?? 0,
			blessDmg: defender.blessDmg ?? 0,
			nextDef: defender.nextDef ?? 0
		}
	};
	return {
		...beginHold({
			...state,
			turn: attackerSide
		}, {
			kind: "melee",
			attacker: attacker.uid,
			defender: defender.uid
		}, `${cardOf(attacker).name} lao vào ${cardOf(defender).name} theo Đàm phán.`),
		parley: {
			...talk,
			step: "fight",
			round,
			victim: defender.uid,
			lunger: attacker.uid,
			keep
		}
	};
}
function finishParley(state) {
	const talk = state.parley;
	if (!talk || talk.step !== "fight" || state.step === "respond") return state;
	let next = state;
	const keep = talk.keep ?? {};
	for (const side of [0, 1]) {
		const you = next.players[side];
		let changed = false;
		const field = you.field.map((mon) => {
			const saved = mon ? keep[mon.uid] : void 0;
			if (!mon || !saved || mon.hp <= 0) return mon;
			changed = true;
			return {
				...mon,
				dim: saved.dim,
				blessAtk: saved.blessAtk,
				blessDmg: saved.blessDmg,
				nextDef: saved.nextDef
			};
		});
		if (changed) next = patch(next, side, {
			...you,
			field
		});
	}
	const queen = next.players[talk.side].field.find((mon) => mon?.uid === talk.queen && mon.hp > 0);
	const home = talk.home;
	if (talk.kind === "mystic") {
		const foe = 1 - talk.side;
		const left = next.players[foe].field.filter((mon) => mon && mon.hp > 0 && mon.cardId !== "mu");
		if (!queen || left.length === 0 || next.winner || talk.round === 2) {
			const you = next.players[talk.side];
			const field = you.field.map((mon) => mon?.uid === talk.queen && mon.hp > 0 ? {
				...mon,
				dim: true
			} : mon);
			return {
				...patch(next, talk.side, {
					...you,
					field
				}),
				turn: home,
				step: "main",
				pending: null,
				hold: null,
				parley: null
			};
		}
		return {
			...next,
			turn: home,
			step: "main",
			pending: null,
			hold: null,
			parley: {
				...talk,
				step: "pick-victim2",
				round: 2,
				forced: false,
				victim: void 0,
				lunger: void 0,
				keep: void 0
			}
		};
	}
	if (!queen || next.winner || talk.round === 2) return {
		...next,
		turn: home,
		parley: null
	};
	const owner = next.players[talk.side].field;
	const victim = owner.find((mon) => mon && mon.uid === talk.victim && mon.hp > 0);
	const others = owner.filter((mon) => mon && mon.hp > 0 && mon.cardId !== "mu" && mon.uid !== talk.queen);
	return {
		...next,
		turn: home,
		step: "main",
		pending: null,
		hold: null,
		parley: {
			...talk,
			step: "pick-victim2",
			round: 2,
			forced: !victim && others.length === 0,
			victim: void 0,
			lunger: void 0,
			keep: void 0
		}
	};
}
function mysticSecond(state, attackerUid, defenderUid) {
	let attacker = null;
	let attackerSide = 0;
	for (const side of [0, 1]) {
		const found = state.players[side].field.find((mon) => mon?.uid === attackerUid && mon.hp > 0) ?? null;
		if (found) {
			attacker = found;
			attackerSide = side;
		}
	}
	if (!attacker || !mysticDue(attacker)) return state;
	if (defenderUid) {
		let defender = null;
		let defenderSide = 0;
		for (const side of [0, 1]) {
			const found = state.players[side].field.find((mon) => mon?.uid === defenderUid && mon.hp > 0) ?? null;
			if (found) {
				defender = found;
				defenderSide = side;
			}
		}
		if (!defender) return state;
		const raw = outgoing(attacker, liveAtk(attacker) + 5);
		const hit = takePhysical(defender, raw, state.players[defenderSide].field);
		const settled = settleMystic(defender, hit.mon, null, state.players[defenderSide].field, false);
		const you = state.players[defenderSide];
		const field = you.field.map((mon) => mon?.uid === defender?.uid ? settled.mon : mon);
		const next = patch(state, defenderSide, dropDead({
			...you,
			field
		}));
		const dealt = Math.max(0, defender.hp - (settled.mon.hp > 0 ? settled.mon.hp : 0));
		return note(next, `Tấn công nhát 2 của ${cardOf(attacker).name} gây ${dealt} sát thương.`, "hit");
	}
	const foe = 1 - attackerSide;
	const them = state.players[foe];
	if (them.hp <= 0) return state;
	const extra = liveAtk(attacker) + 5;
	return note(checkWinner(patch(state, foe, {
		...them,
		hp: them.hp - extra
	})), `Tấn công nhát 2 của ${cardOf(attacker).name} gây ${extra} sát thương lên người chơi.`, "hit");
}
function fieldUnit(state, uid) {
	for (const side of [0, 1]) {
		const mon = state.players[side].field.find((unit) => unit?.uid === uid && unit.hp > 0) ?? null;
		if (mon) return {
			mon,
			side
		};
	}
	return null;
}
function mysticRiposte(state, mysticUid, foeUid) {
	const slash = (current, bonus, which) => {
		const knight = fieldUnit(current, mysticUid);
		const foe = fieldUnit(current, foeUid);
		if (!knight || !foe || !mysticDue(knight.mon)) return null;
		const raw = outgoing(knight.mon, liveAtk(knight.mon) + bonus);
		const hit = takePhysical(foe.mon, raw, current.players[foe.side].field);
		const settled = settleMystic(foe.mon, hit.mon, null, current.players[foe.side].field, false);
		const you = current.players[foe.side];
		const field = you.field.map((mon) => mon?.uid === foe.mon.uid ? settled.mon : mon);
		const next = patch(current, foe.side, dropDead({
			...you,
			field
		}));
		const dealt = Math.max(0, foe.mon.hp - (settled.mon.hp > 0 ? settled.mon.hp : 0));
		return note(next, `Tấn công ${which} của ${cardOf(knight.mon).name} gây ${dealt} sát thương vào ${cardOf(foe.mon).name}.`, "hit");
	};
	const first = slash(state, 0, "nhát 1");
	if (!first) return state;
	if (!fieldUnit(first, foeUid)) return first;
	return slash(first, 5, "nhát 2") ?? first;
}
var TIDE = "con-thinh-no-cua-hai-vuong";
var SHADE = "chien-binh-lan-khuat";
var PREY = "ke-san-moi-tu-than";
function cyclePrey(kind) {
	if (kind === "phys") return "spell";
	if (kind === "spell") return "tru";
	return "phys";
}
function markPrey(state, side, attacker, aim, connected, died) {
	if (attacker.cardId !== PREY) return state;
	if (!died) return attacker.preyAim ? {
		...state,
		prey: null,
		preyAsk: false
	} : state;
	const current = attacker.preyKind ?? "phys";
	return {
		...state,
		preyAsk: false,
		prey: {
			side,
			aim,
			kind: connected ? cyclePrey(current) : current
		}
	};
}
function offerPrey(state) {
	const prey = state.prey;
	if (!prey || state.turn !== prey.side) return {
		state,
		line: ""
	};
	const you = state.players[prey.side];
	const foe = state.players[1 - prey.side];
	if (!(prey.aim === "face" ? foe.hp > 0 : foe.field.some((mon) => mon?.uid === prey.aim && mon.hp > 0))) return {
		state: {
			...state,
			prey: null,
			preyAsk: false
		},
		line: "Con mồi đã gục xuống."
	};
	if (!you.field.some((mon, index) => !mon && (you.locked?.[index] ?? 0) === 0) || you.orb < 1) return {
		state: {
			...state,
			prey: null,
			preyAsk: false
		},
		line: "Ý chí săn mồi không còn. Cuộc đi săn kết thúc."
	};
	return {
		state: {
			...state,
			preyAsk: true
		},
		line: ""
	};
}
function answerPrey(state, yes) {
	const prey = state.prey;
	if (!state.preyAsk || !prey || prey.side !== state.turn) return state;
	const closed = {
		...state,
		prey: null,
		preyAsk: false
	};
	const end = "Ý chí săn mồi không còn. Cuộc đi săn kết thúc.";
	if (!yes) return note(closed, end);
	const you = state.players[prey.side];
	const slot = you.field.findIndex((mon, index) => !mon && (you.locked?.[index] ?? 0) === 0);
	const paid = slot >= 0 ? pay$1(you, 1) : null;
	if (slot < 0 || !paid) return note(closed, end);
	const born = {
		...place(state, prey.side, PREY),
		preyKind: prey.kind,
		preyAim: prey.aim,
		dim: false
	};
	const field = paid.field.slice();
	field[slot] = born;
	return note(patch(closed, prey.side, {
		...paid,
		field
	}), `${cardOf(born).name} trở lại để truy sát con mồi.`, "heal");
}
function shadeHidden(mon) {
	return Boolean(mon && mon.cardId === SHADE && (mon.shown ?? 0) > 0 && !mon.cage);
}
function armCage(mon) {
	const printed = monsterCard(mon.cardId)?.hp ?? mon.hp;
	const maxHp = mon.maxHp || mon.hp;
	const baseMax = Math.max(1, Math.min(maxHp, printed));
	const hp = Math.min(mon.hp, baseMax);
	return {
		...mon,
		cage: true,
		cageHp: mon.hp - hp,
		cageMax: maxHp - baseMax,
		hp,
		maxHp: baseMax
	};
}
function freeCage(mon) {
	if (!mon.cage) return mon;
	const maxHp = (mon.maxHp || mon.hp) + (mon.cageMax ?? 0);
	const hp = Math.min(maxHp, mon.hp + (mon.cageHp ?? 0));
	return {
		...mon,
		cage: void 0,
		cageHp: void 0,
		cageMax: void 0,
		hp,
		maxHp
	};
}
function castSeize(state, side, mon, targetUid) {
	if (mon.seized) return note(state, "Bắt Giữ chỉ dùng một lần mỗi lượt.");
	if (held(mon) || (mon.path ?? 0) > 0) return state;
	if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
	const foe = 1 - side;
	const them = state.players[foe];
	const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0 && unit.cardId !== "mu") ?? null;
	if (!target) return note(state, "Chọn một quái đối thủ.");
	const yourField = state.players[side].field.map((unit) => unit?.uid === mon.uid ? {
		...unit,
		seized: true
	} : unit);
	const foeField = them.field.map((unit) => unit?.uid === target.uid ? armCage(unit) : unit);
	return note(patch(patch(state, side, {
		...state.players[side],
		field: yourField
	}), foe, {
		...them,
		field: foeField
	}), `${cardOf(mon).name} bắt giữ ${cardOf(target).name}. Khoá cứng đến hết lượt.`, "info");
}
function openShade(mon) {
	if (!shadeHidden(mon)) return mon;
	return {
		...mon,
		shown: void 0,
		stored: void 0
	};
}
function pressTide(state, victim) {
	const you = state.players[victim];
	let hit = false;
	const field = you.field.map((mon) => {
		if (!mon || mon.hp <= 0 || mon.cardId !== TIDE) return mon;
		hit = true;
		return {
			...mon,
			stored: (mon.stored ?? 0) + 1
		};
	});
	return hit ? patch(state, victim, {
		...you,
		field
	}) : state;
}
function calmTide(state, uid) {
	for (const side of [0, 1]) {
		const you = state.players[side];
		const mon = you.field.find((unit) => unit?.uid === uid && unit.cardId === TIDE);
		if (!mon || (mon.stored ?? 0) === 0) continue;
		return patch(state, side, {
			...you,
			field: you.field.map((unit) => unit?.uid === uid ? {
				...unit,
				stored: 0
			} : unit)
		});
	}
	return state;
}
function tideSwing(state, victim, attackerUid) {
	return calmTide(pressTide(state, victim), attackerUid);
}
function tideAimsFoe(state, actor, cardId, index, targetUid) {
	const foe = 1 - actor;
	if (targetUid && state.players[foe].field.some((mon) => mon?.uid === targetUid)) return true;
	if (targetUid) return false;
	if (cardId === TIDE || cardId === "sua-hut-ma-phap" || cardId === "mat-do-tan-pha" || cardId === "rong-ac-ma") return true;
	if (cardId === "rong-con" || cardId === "rong-ngan-tuoi") return true;
	if (cardId === "rong-phun-hoa-cau" && index > 0) return true;
	if (cardId === "may-quay-thuong" && index === 1) return true;
	if (cardId === "trai-tim-hai-long" && index >= 2) return true;
	return false;
}
function tideSkill(before, after, uid, targetUid, index) {
	if (after.players === before.players && after.winner === before.winner) return after;
	const caster = before.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
	if (!caster) return after;
	const actor = before.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1;
	if (!tideAimsFoe(before, actor, caster.cardId, index, targetUid)) return after;
	return pressTide(after, 1 - actor);
}
function resolveMelee(state, attackerUid, defenderUid) {
	const side = state.turn;
	const foe = 1 - side;
	const you = state.players[side];
	const them = state.players[foe];
	const attacker = you.field.find((mon) => mon?.uid === attackerUid) ?? null;
	const defender = them.field.find((mon) => mon?.uid === defenderUid) ?? null;
	if (!attacker || !defender) return releaseLegend({
		...state,
		step: "main",
		pending: null,
		hold: null
	});
	if (them.mirror > 0) {
		const plain = dropClash(openShade(attacker));
		const robbed = {
			...plain,
			atk: Math.floor(plain.atk / 2),
			def: Math.floor(plain.def / 2),
			mdef: Math.floor(plain.mdef / 2),
			hp: Math.max(1, Math.floor(plain.hp / 2)),
			dim: true,
			glass: true
		};
		return tideSwing(releaseLegend({
			...note(patch(state, side, {
				...you,
				field: you.field.map((mon) => mon?.uid === attacker.uid ? robbed : mon)
			}), "Gương phòng hộ chặn giáp lá cà và cướp một nửa chỉ số.", "spell"),
			step: "main",
			pending: null,
			hold: null
		}), foe, attacker.uid);
	}
	const shot = openGuardShot(attacker, defender, !attacker.horn && !attacker.gaze && !attacker.bolt, you.field, them.roster);
	const defPool = phantomPool(defender, them.field);
	const atkPool = phantomPool(attacker, you.field);
	const hit = strikePair(withLegend(shot.attacker), withLegend(shot.defender), you.field, them.field, you.roster, them.roster);
	const awardA = bullAward(hit.attacker, defender.cardId, hit.defender.hp <= 0);
	const awardD = bullAward(hit.defender, attacker.cardId, hit.attacker.hp <= 0);
	let wornA = dullHorn(awardA.mon, attacker.horn);
	let wornD = awardD.mon;
	const hornRaw = attacker.horn === "plus" ? Math.min(8, liveAtk(attacker)) : attacker.horn === "splash" ? Math.min(4, liveAtk(attacker)) : liveAtk(attacker);
	const hornDealt = attacker.horn && !rabbitDodge(defender, attacker) ? spellLanded(defender, hornRaw, them.field, attacker) : attacker.horn ? 0 : 0;
	const gazeDealt = attacker.gaze && !attacker.horn && !rabbitDodge(defender, attacker) ? truLanded(defender, liveAtk(attacker), them.field, attacker) : 0;
	let splashLine = "";
	let splash = 0;
	let others = [];
	if (attacker.horn === "splash") {
		splash = Math.min(4, liveAtk(attacker));
		others = them.field.filter((mon) => Boolean(mon && mon.uid !== defender.uid && mon.hp > 0));
		if (others.length) splashLine = ` Lan ${others.map((mon) => `${spellLanded(mon, splash, them.field, attacker)} sát thương phép vào ${cardOf(mon).name}`).join(", ")}.`;
		const splashed = spray(them.field, (mon, allies) => mon.uid === defender.uid ? mon : damageSpell(mon, splash, allies, attacker), [defender.uid]);
		them.field.splice(0, them.field.length, ...splashed);
	}
	const worn = combatErode(wornA, wornD, side);
	let body = worn.defender;
	let riderAttacker = worn.attacker;
	const riderBits = [];
	let riderSkill = null;
	const clash = !attacker.horn && !attacker.gaze;
	if (clash && attacker.cardId === RIDER && !rabbitDodge(defender, attacker)) {
		const packets = riderPackets(withLegend(attacker), defender, them.field);
		body = applyIncoming(body, packets.second, them.field, veilLeft(defender, packets.first)).mon;
		const hits = [defender.uid, defender.uid];
		const vols = [packets.first, packets.second];
		const fires = [];
		them.field.forEach((mon, index) => {
			if (!mon || mon.uid === defender.uid || mon.hp <= 0) return;
			const n = hurt(mon, packets.fire);
			const shown = shownTru(mon, n, them.field);
			them.field[index] = applyIncoming(mon, n, them.field).mon;
			hits.push(mon.uid);
			vols.push(n);
			fires.push({
				name: fieldName(mon),
				n: shown
			});
		});
		riderSkill = {
			id: RIDER,
			index: 0,
			aim: defender.uid,
			hits,
			vols
		};
		riderBits.push(`- Mũi thương bị nguyền rủa lên ${fieldName(defender)} gây ${shownTru(defender, packets.physical, them.field, 0, defPool)} sát thương vật lý, ${shownTru(defender, packets.tru, them.field, packets.physical, defPool)} sát thương chuẩn.`);
		if (fires.length) riderBits.push(riderFireLine(fires));
	}
	if (clash && defender.cardId === RIDER && !rabbitDodge(attacker, defender)) {
		const packets = riderPackets(withLegend(defender), attacker, you.field);
		riderAttacker = applyIncoming(riderAttacker, packets.second, you.field, veilLeft(attacker, packets.first)).mon;
		const hits = [
			attacker.uid,
			attacker.uid,
			...riderSkill?.hits ?? []
		];
		const vols = [
			packets.first,
			packets.second,
			...riderSkill?.vols ?? []
		];
		const fires = [];
		you.field.forEach((mon, index) => {
			if (!mon || mon.uid === attacker.uid || mon.hp <= 0) return;
			const n = hurt(mon, packets.fire);
			const shown = shownTru(mon, n, you.field);
			you.field[index] = applyIncoming(mon, n, you.field).mon;
			hits.push(mon.uid);
			vols.push(n);
			fires.push({
				name: fieldName(mon),
				n: shown
			});
		});
		riderSkill = {
			id: RIDER,
			index: 0,
			aim: riderSkill?.aim ?? attacker.uid,
			hits,
			vols
		};
		riderBits.push(`- Mũi thương bị nguyền rủa lên ${fieldName(attacker)} gây ${shownTru(attacker, packets.physical, you.field, 0, atkPool)} sát thương vật lý, ${shownTru(attacker, packets.tru, you.field, packets.physical, atkPool)} sát thương chuẩn.`);
		if (fires.length) riderBits.push(riderFireLine(fires));
	}
	const riderLine = riderBits.length ? `${monsterCard(RIDER)?.name ?? "Kỵ sĩ cưỡi rồng"} dùng\n${riderBits.join("\n")}` : "";
	const fed = withLeech(you.field, riderAttacker, hit.bite, hit.surplus);
	let next = patch(state, side, settleCocoon(dropDead({
		...you,
		field: fed.field
	})));
	next = patch(next, foe, settleCocoon(dropDead({
		...them,
		field: them.field.map((mon) => mon?.uid === defender.uid ? body : mon)
	})));
	const soul = soulLeech(next, side, attacker, hit.bite + hit.surplus);
	next = soul.state;
	const tail = `${shot.line ? ` ${shot.line}` : ""}${hit.dodged ? " Thỏ đen tinh nghịch né đòn." : ""}${soul.line}`;
	const hornRows = attacker.horn ? [{
		name: cardOf(defender).name,
		bits: `${hornDealt} sát thương phép`
	}, ...attacker.horn === "splash" ? others.map((mon) => ({
		name: cardOf(mon).name,
		bits: `${spellLanded(mon, splash, them.field, attacker)} sát thương phép`
	})) : []] : [];
	const hornLine = attacker.horn ? aimNotice("Sấm lôi phá", hornRows, tail) : null;
	const boltDealt = attacker.bolt ? spellLanded(defender, liveAtk(attacker) + plateBank(attacker).p + plateBank(attacker).s, them.field, attacker) : 0;
	const released = releaseLegend({
		...note(next, hornLine ? hornLine : attacker.horn ? `Sấm lôi phá gây ${hornDealt} sát thương phép vào ${cardOf(defender).name}.${splashLine}${tail}` : attacker.bolt ? `Roi sấm gây ${boltDealt} sát thương phép vào ${cardOf(defender).name}.${tail}` : attacker.gaze ? `${cardOf(attacker).name} bắn tia sáng vào ${cardOf(defender).name}, gây ${gazeDealt} sát thương chuẩn.${tail}` : riderLine ? `${riderLine}${tail}` : attacker.cardId === PREY && attacker.preyKind === "spell" ? `${cardOf(attacker).name} truy sát ${cardOf(defender).name}, gây ${spellLanded(defender, liveAtk(attacker), them.field, attacker)} sát thương phép.${tail}` : attacker.cardId === PREY && attacker.preyKind === "tru" ? `${cardOf(attacker).name} truy sát ${cardOf(defender).name}, gây ${truLanded(defender, liveAtk(attacker), them.field, attacker)} sát thương chuẩn.${tail}` : `${cardOf(attacker).name} giáp lá cà với ${cardOf(defender).name}.${tail}`, attacker.horn || attacker.gaze || attacker.bolt ? "spell" : "hit"),
		step: "main",
		pending: null,
		hold: null,
		skill: riderSkill,
		mends: [awardA, awardD].filter((row) => row.mend > 0 && row.mon.hp > 0).map((row) => ({
			uid: row.mon.uid,
			n: row.mend
		}))
	});
	const covered = defender.cardId === MYSTIC && Boolean(defender.guarding);
	const swung = tideSwing(finishParley(mysticSecond(swingSword(growSmash(growSmash(becomePerfect(released, side, attacker.uid), attacker.uid, smashPlain(attacker)), defender.uid, smashPlain(defender) && !attacker.horn && !attacker.gaze && !attacker.bolt), attacker.uid, swordSwing(attacker)), attacker.uid, defender.uid)), foe, attacker.uid);
	const origin = state.pending?.kind === "melee" ? state.pending.defender : defender.uid;
	const hunted = markPrey(swung, side, attacker, origin, origin === defender.uid && !hit.dodged, riderAttacker.hp <= 0);
	return covered ? mysticRiposte(hunted, defender.uid, attacker.uid) : hunted;
}
var SOUL_ID = "ke-giam-ho-linh-hon";
function grantSoul(mon, stacks) {
	const hp = stacks;
	const cap = (mon.maxHp || mon.hp) + hp;
	return {
		...mon,
		maxHp: cap,
		hp: mon.hp + hp,
		raised: markRaised(mon, { hp }),
		soul: (mon.soul ?? 0) + stacks
	};
}
function soulSync(state) {
	let next = state;
	const mends = [...state.mends ?? []];
	let gained = false;
	for (const side of [0, 1]) {
		const player = next.players[side];
		const due = Math.floor(Math.max(0, LIFE - player.hp) / 3);
		let changed = false;
		const field = player.field.map((mon) => {
			if (!mon || mon.cardId !== SOUL_ID || mon.hp <= 0) return mon;
			const add = due - (mon.soul ?? 0);
			if (add <= 0) return mon;
			changed = true;
			gained = true;
			mends.push({
				uid: mon.uid,
				n: add
			});
			return grantSoul(mon, add);
		});
		if (changed) next = patch(next, side, {
			...next.players[side],
			field
		});
	}
	if (!gained) return next;
	return {
		...next,
		mends,
		tone: next.tone === "info" ? "heal" : next.tone
	};
}
function soulLeech(state, side, attacker, dealt) {
	if (attacker.cardId !== SOUL_ID || attacker.horn || dealt <= 0) return {
		state,
		line: ""
	};
	const you = state.players[side];
	const hp = Math.min(LIFE, you.hp + dealt);
	const gain = hp - you.hp;
	if (gain <= 0) return {
		state,
		line: ""
	};
	return {
		state: patch(state, side, {
			...you,
			hp
		}),
		line: ` ${cardOf(attacker).name} hồi ${gain} máu cho người chơi.`
	};
}
function soulToll(mon) {
	return 2 + (mon.vows ?? 0);
}
function soulGrant(mon) {
	const extra = mon.vows ?? 0;
	return {
		atk: 1 + extra,
		def: 1,
		hp: 1 + extra
	};
}
function soulAskLine(mon) {
	const cost = soulToll(mon);
	const grant = soulGrant(mon);
	return `Hiến tế ${cost} máu để +${grant.atk} công, +1 phòng ngự và +${grant.hp} máu tối đa trong giao tranh?`;
}
function offerSoul(state, uid) {
	const side = state.turn;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	const cost = mon ? soulToll(mon) : 2;
	if (!mon || you.hp < cost) return state;
	const grant = soulGrant(mon);
	const field = you.field.map((unit) => {
		if (unit?.uid !== uid) return unit;
		return {
			...unit,
			hp: unit.hp + grant.hp,
			maxHp: (unit.maxHp || unit.hp) + grant.hp,
			vows: (unit.vows ?? 0) + 1,
			clash: {
				atk: (unit.clash?.atk ?? 0) + grant.atk,
				def: (unit.clash?.def ?? 0) + grant.def,
				mdef: (unit.clash?.mdef ?? 0) + grant.def,
				maxHp: (unit.clash?.maxHp ?? 0) + grant.hp
			}
		};
	});
	return patch(state, side, {
		...you,
		hp: you.hp - cost,
		field
	});
}
function answerSoul(state, yes) {
	const ask = state.soulAsk;
	if (!ask) return state;
	let next = {
		...state,
		soulAsk: null
	};
	if (yes) {
		const mon = next.players[next.turn].field.find((unit) => unit?.uid === ask.uid) ?? null;
		if (!mon || next.players[next.turn].hp < soulToll(mon)) return note(next, "Không đủ máu để hiến tế.");
		next = offerSoul(next, ask.uid);
		if (next.players[next.turn].hp <= 0) return checkWinner(note(next, `${monsterCard(SOUL_ID)?.name} hiến tế hết máu.`));
	}
	return ask.kind === "face" ? attackFace(next, ask.uid, true) : attackMonster(next, ask.uid, ask.target ?? "", false, true);
}
function attackMonster(state, attackerUid, defenderUid, _skipGnaw = false, soulChosen = false) {
	const next = attackMonsterCore(state, attackerUid, defenderUid, _skipGnaw, soulChosen);
	if (next === state || next.soulAsk && !state.soulAsk) return next;
	const declared = next.pending?.kind === "melee";
	if (!declared && next.upkeep && !state.upkeep && next.players === state.players) return next;
	const mon = state.players[state.turn].field.find((unit) => unit?.uid === attackerUid) ?? null;
	const targetUid = declared && next.pending?.kind === "melee" ? next.pending.defender : defenderUid;
	return traced(state, next, {
		kind: "attack-monster",
		actor: state.turn,
		ok: declared,
		cardId: mon?.cardId ?? null,
		target: monsterTarget(declared ? next : state, targetUid),
		end: null
	});
}
function attackMonsterCore(state, attackerUid, defenderUid, _skipGnaw = false, soulChosen = false) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner || !canTargetFoe(state)) return canTargetFoe(state) ? state : note(state, "Lượt đầu không được nhắm đối thủ.");
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	const you = state.players[state.turn];
	const them = state.players[1 - state.turn];
	defenderUid = redirectCover(them.field, defenderUid) ?? defenderUid;
	defenderUid = shuntUid(them.field, defenderUid) ?? defenderUid;
	const picked = them.field.find((mon) => mon?.uid === defenderUid) ?? null;
	if (picked && kazuraSafe(picked)) return note(state, `${cardOf(picked).name} không thể bị tấn công. Còn ${picked.safe ?? 0} lượt.`);
	if (you.attackLock > 0) return note(state, "Bạn đang bị cấm tấn công.");
	const attacker = you.field.find((mon) => mon?.uid === attackerUid) ?? null;
	const defender = them.field.find((mon) => mon?.uid === defenderUid) ?? null;
	if (attacker && (attacker.path ?? 0) > 0) return note(state, `${cardOf(attacker).name} không thể hành động.`);
	if (!attacker || attacker.dim || attacker.cardId === "chan-ken" || attacker.cardId === "hoa-an-thit-nguoi" || attacker.cardId === "mu" || barred(attacker) || (attacker.path ?? 0) > 0 || !defender) return state;
	if (attacker.cage) return note(state, "Đang bị khoá cứng.");
	if (attacker.preyAim === "face") return note(state, "Chỉ được truy sát người chơi đối thủ.");
	if (attacker.preyAim && attacker.preyAim !== defender.uid) return note(state, "Chỉ được truy sát con mồi đã ghi nhớ.");
	if (attacker.hornNew && state.mode === "ai" && state.turn === 1) {
		const mode = you.orb >= 1 ? "plus" : "plain";
		const field = you.field.map((mon) => mon?.uid === attacker.uid ? {
			...mon,
			horn: mode,
			hornNew: false
		} : mon);
		return attackMonster(patch(state, state.turn, {
			...you,
			field
		}), attackerUid, defenderUid, _skipGnaw, soulChosen);
	}
	if (attacker.cardId === "rong-boc-trung" && attacker.stance === "guard") return note(state, "Thế thủ không được tấn công");
	if (attacker.cardId === SOUL_ID && !soulChosen && you.hp >= soulToll(attacker)) {
		if (state.mode === "ai" && state.turn === 1) return attackMonster(you.hp >= 8 ? offerSoul(state, attacker.uid) : state, attackerUid, defenderUid, _skipGnaw, true);
		return {
			...state,
			soulAsk: {
				uid: attacker.uid,
				kind: "melee",
				target: defenderUid
			}
		};
	}
	const landed = them.field.find((mon) => mon?.uid === defenderUid) ?? defender;
	let ready = {
		...state,
		echo: null,
		last: null
	};
	if (attacker.horn === "splash" || attacker.horn === "plus") {
		const paid = pay$1(you, 1);
		if (!paid) {
			const field = you.field.map((mon) => mon?.uid === attacker.uid ? {
				...mon,
				horn: "plain"
			} : mon);
			ready = patch(ready, state.turn, {
				...you,
				field
			});
		} else ready = patch(ready, state.turn, paid);
	}
	const named = ready.players[state.turn].field.find((mon) => mon?.uid === attacker.uid) ?? attacker;
	let cast = ready;
	if (smashPlain(named) || swordDue(named) || mysticDue(named)) {
		const paid = pay$1(cast.players[state.turn], 1);
		if (!paid) return note(state, "Cần 1 mana.");
		cast = patch(cast, state.turn, paid);
	}
	const hornRaw = named.horn === "plus" ? Math.min(8, liveAtk(named)) : named.horn === "splash" ? Math.min(4, liveAtk(named)) : named.horn ? liveAtk(named) : 0;
	const hornHit = named.horn ? spellLanded(landed, hornRaw, them.field, named) : 0;
	const line = named.horn ? `Sấm lôi phá gây ${hornHit} sát thương phép vào ${cardOf(landed).name}` : named.bolt ? `Roi sấm gây ${spellLanded(landed, liveAtk(named) + plateBank(named).p + plateBank(named).s, them.field, named)} sát thương phép vào ${cardOf(landed).name}` : named.gaze ? `${cardOf(named).name} bắn tia sáng vào ${cardOf(landed).name}, gây ${truLanded(landed, liveAtk(named), them.field, named)} sát thương chuẩn` : mysticDue(named) ? `${cardOf(named).name} dùng Tấn công, lao vào ${cardOf(landed).name}` : `${cardOf(named).name} lao vào ${cardOf(landed).name}`;
	const acted = markQueenAct(cast, state.turn, named.uid);
	return beginHold(acted.state, {
		kind: "melee",
		attacker: named.uid,
		defender: landed.uid
	}, `${line}${acted.extra}`);
}
function attackFace(state, attackerUid, soulChosen = false) {
	const next = attackFaceCore(state, attackerUid, soulChosen);
	if (next === state || next.soulAsk && !state.soulAsk) return next;
	const declared = next.pending?.kind === "face" && !next.pending.skill;
	if (!declared && next.upkeep && !state.upkeep && next.players === state.players) return next;
	const mon = state.players[state.turn].field.find((unit) => unit?.uid === attackerUid) ?? null;
	return traced(state, next, {
		kind: "attack-face",
		actor: state.turn,
		ok: declared,
		cardId: mon?.cardId ?? null,
		target: { kind: "face" },
		end: null
	});
}
function attackFaceCore(state, attackerUid, soulChosen = false) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
	const you = state.players[state.turn];
	if (you.attackLock > 0) return note(state, "Bạn đang bị cấm tấn công.");
	const attacker = you.field.find((mon) => mon?.uid === attackerUid) ?? null;
	if (attacker && (attacker.path ?? 0) > 0) return note(state, `${cardOf(attacker).name} không thể hành động.`);
	if (!attacker || attacker.dim || attacker.cardId === "chan-ken" || attacker.cardId === "hoa-an-thit-nguoi" || barred(attacker) || (attacker.path ?? 0) > 0) return state;
	if (attacker.cage) return note(state, "Đang bị khoá cứng.");
	if (attacker.preyAim && attacker.preyAim !== "face") return note(state, "Chỉ được truy sát con mồi đã ghi nhớ.");
	if (attacker.cardId === "rong-boc-trung" && attacker.stance === "guard") return note(state, "Thế thủ không được tấn công");
	if (attacker.cardId === SOUL_ID && !soulChosen && you.hp >= soulToll(attacker)) {
		if (state.mode === "ai" && state.turn === 1) return attackFace(you.hp >= 8 ? offerSoul(state, attacker.uid) : state, attackerUid, true);
		return {
			...state,
			soulAsk: {
				uid: attacker.uid,
				kind: "face"
			}
		};
	}
	let cast = {
		...state,
		echo: null,
		last: null
	};
	if (smashPlain(attacker) || swordDue(attacker) || mysticDue(attacker)) {
		const paid = pay$1(cast.players[state.turn], 1);
		if (!paid) return note(state, "Cần 1 mana.");
		cast = patch(cast, state.turn, paid);
	}
	const line = attacker.horn || attacker.gaze || attacker.bolt ? `${cardOf(attacker).name} bắn phép vào người. Có thể chặn` : mysticDue(attacker) ? `${cardOf(attacker).name} dùng Tấn công, đánh vào người. Có thể chặn` : `${cardOf(attacker).name} đánh vào người. Có thể chặn`;
	const acted = markQueenAct(cast, state.turn, attacker.uid);
	return beginHold(acted.state, {
		kind: "face",
		attacker: attacker.uid
	}, `${line}${acted.extra}`);
}
function resolveHellFace(state, attacker, blocker) {
	const side = state.turn;
	const foe = 1 - side;
	const you = state.players[side];
	const cost = skillManaCost(attacker.cardId, 1);
	const before = you.stars;
	const paid = pay$1(you, cost);
	if (!paid) return {
		...note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`),
		step: "main",
		pending: null,
		hold: null
	};
	const armed = pingStars(patch(state, side, paid), side, before, paid.stars);
	const caster = armed.players[side].field.find((mon) => mon?.uid === attacker.uid) ?? attacker;
	if (blocker) return resolveHell(armed, caster, blocker);
	const releaseHex = bindSkillHex(caster);
	const figures = hellFigures(attacker.cardId);
	if (attacker.skillUp) figures.spell += attacker.skillUp;
	const shaved = shaveHex(attacker, figures);
	const shot = {
		phys: outgoing(caster, shaved.phys),
		spell: outgoing(caster, shaved.spell),
		tru: outgoing(caster, shaved.tru)
	};
	releaseHex();
	const dealt = shot.phys + shot.spell + shot.tru;
	const field = armed.players[side].field.map((mon) => mon?.uid === caster.uid ? {
		...mon,
		dim: true
	} : mon);
	let next = patch(armed, side, {
		...armed.players[side],
		field
	});
	const them = next.players[foe];
	next = patch(next, foe, {
		...them,
		hp: them.hp - dealt
	});
	next = checkWinner(note(next, actNotice(castName(attacker.cardId, 0), hellLine(shot, "người chơi")), "spell"));
	return {
		...next,
		step: next.winner !== null ? "over" : "main",
		pending: null,
		hold: null,
		skill: {
			id: attacker.cardId,
			index: 0,
			aim: null
		}
	};
}
function resolveDemonBall(state, caster, target) {
	const side = state.players[0].field.some((mon) => mon?.uid === caster.uid) ? 0 : 1;
	const foe = 1 - side;
	const you = state.players[side];
	state.players[foe];
	const amount = outgoing(caster, grabNums(skillText(caster.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 6) + (charmDamage || caster.blessDmg || 0);
	const yourField = you.field.map((unit) => unit?.uid === caster.uid ? {
		...unit,
		dim: true
	} : unit);
	let next = patch(state, side, {
		...you,
		field: yourField
	});
	if (!target) {
		const foePlayer = next.players[foe];
		next = patch(next, foe, {
			...foePlayer,
			hp: foePlayer.hp - amount
		});
		const checked = checkWinner(note(next, `${castName(caster.cardId, 0)} gây ${amount} sát thương chuẩn lên người chơi.`, "spell"));
		return releaseLegend({
			...checked,
			step: checked.winner !== null ? "over" : "main",
			pending: null,
			hold: null,
			skill: {
				id: caster.cardId,
				index: 0,
				aim: null
			}
		});
	}
	const landed = next.players[foe].field.find((unit) => unit?.uid === target.uid) ?? target;
	const before = landed.hp;
	const burned = (() => {
		const saved = charmDamage;
		charmDamage = 0;
		try {
			return trueDamage(landed, amount, next.players[foe].field);
		} finally {
			charmDamage = saved;
		}
	})();
	const dealt = Math.max(0, before - burned.hp);
	const foeField = next.players[foe].field.map((unit) => unit?.uid === landed.uid ? burned : unit);
	next = patch(next, foe, dropDead({
		...next.players[foe],
		field: foeField
	}));
	return releaseLegend({
		...note(next, `${castName(caster.cardId, 0)} gây ${dealt} sát thương chuẩn lên ${cardOf(landed).name}.`, "spell"),
		step: "main",
		pending: null,
		hold: null,
		skill: {
			id: caster.cardId,
			index: 0,
			aim: landed.uid
		}
	});
}
function resolveFace(state, blockerUid, withSkill = false) {
	if (state.step !== "respond" || state.pending?.kind !== "face") return state;
	const pending = state.pending;
	const side = state.turn;
	const foe = 1 - side;
	const you = state.players[side];
	const them = state.players[foe];
	const attacker = you.field.find((mon) => mon?.uid === pending.attacker) ?? null;
	if (!attacker) return releaseLegend({
		...state,
		step: "main",
		pending: null
	});
	if (pending.skill && attacker.cardId === "may-quay-thuong") {
		const blocker = blockerUid ? them.field.find((mon) => mon?.uid === blockerUid) ?? null : null;
		const legal = blocker && canIntercept(blocker, true) ? blocker.uid : null;
		return releaseGuardMark(useSkill(commitGuardShot({
			...state,
			step: "main",
			pending: null,
			hold: null
		}, attacker.uid, legal ?? "", false), attacker.uid, legal, 1, true, null, true), legal);
	}
	if (blockerUid) {
		const blocker = them.field.find((mon) => mon?.uid === blockerUid) ?? null;
		if (!canIntercept(blocker, true)) return {
			...resolveFace(state, null, false),
			hold: null
		};
		if (them.mirror > 0) {
			const plain = dropClash(openShade(attacker));
			const robbed = {
				...plain,
				atk: Math.floor(plain.atk / 2),
				def: Math.floor(plain.def / 2),
				mdef: Math.floor(plain.mdef / 2),
				hp: Math.max(1, Math.floor(plain.hp / 2)),
				dim: true,
				glass: true
			};
			return tideSwing(releaseLegend({
				...note(patch(state, side, {
					...you,
					field: you.field.map((mon) => mon?.uid === attacker.uid ? robbed : mon)
				}), "Gương phòng hộ chặn đòn và cướp một nửa chỉ số.", "spell"),
				step: "main",
				pending: null
			}), foe, attacker.uid);
		}
		if (attacker.cardId === "mat-do-tan-pha") return resolveHellFace(state, attacker, blocker);
		if (attacker.cardId === "rong-ac-ma") return resolveDemonBall(state, attacker, blocker);
		if (pending.skill && (attacker.cardId === "rong-con" || attacker.cardId === "rong-ngan-tuoi" || attacker.cardId === "rong-phun-hoa-cau" || attacker.cardId === "sua-hut-ma-phap" || attacker.cardId === TIDE)) return releaseGuardMark(useSkill(commitGuardShot({
			...state,
			step: "main",
			pending: null,
			hold: null
		}, attacker.uid, blocker.uid, false), attacker.uid, blocker.uid, attacker.cardId === "rong-phun-hoa-cau" ? 1 : 0, true, null, true), blocker.uid);
		const guarding = them;
		const shot = openGuardShot(attacker, blocker, !attacker.horn && !attacker.gaze && !attacker.bolt, you.field, them.roster);
		const body = withLegend(shot.defender);
		const hit = strikePair(withLegend(shot.attacker), body, you.field, guarding.field, you.roster, them.roster);
		const awardA = bullAward(hit.attacker, body.cardId, hit.defender.hp <= 0);
		const awardD = bullAward(hit.defender, attacker.cardId, hit.attacker.hp <= 0);
		let wornA = dullHorn(awardA.mon, attacker.horn);
		let wornD = awardD.mon;
		const worn = combatErode(wornA, wornD, side);
		const fed = withLeech(you.field, worn.attacker, hit.bite, hit.surplus);
		let next = patch(state, side, settleCocoon(dropDead({
			...you,
			field: fed.field
		})));
		next = patch(next, foe, settleCocoon(dropDead({
			...guarding,
			field: guarding.field.map((mon) => mon?.uid === body.uid ? worn.defender : mon)
		})));
		const soul = soulLeech(next, side, attacker, hit.bite + hit.surplus);
		next = soul.state;
		const gazeOnly = Boolean(attacker.gaze && !attacker.horn && !attacker.bolt);
		const beamed = Boolean(attacker.horn || attacker.bolt);
		const how = beamed ? "đỡ phép" : withSkill ? "chặn bằng kỹ năng" : "chặn bằng giáp lá cà";
		const plate = plateBank(attacker);
		const taken = beamed ? rabbitDodge(body, attacker) ? 0 : spellLanded(body, attacker.bolt ? liveAtk(attacker) + plate.p + plate.s : attacker.horn === "plus" ? Math.min(8, liveAtk(attacker)) : attacker.horn === "splash" ? Math.min(4, liveAtk(attacker)) : liveAtk(attacker), guarding.field, attacker) : gazeOnly && !rabbitDodge(body, attacker) ? truLanded(body, liveAtk(attacker), guarding.field, attacker) : 0;
		const hurtBit = beamed ? `, chịu ${taken} sát thương phép` : gazeOnly ? `, chịu ${taken} sát thương chuẩn` : "";
		const hunted = markPrey(tideSwing(finishParley(mysticSecond(swingSword(growSmash(growSmash(becomePerfect(releaseLegend({
			...note(next, `${cardOf(body).name} ${how}${hurtBit}.${shot.line ? ` ${shot.line}` : ""}${hit.dodged ? ` ${cardOf(body).name} né đòn.` : ""}${soul.line}`, beamed || gazeOnly ? "spell" : "hit"),
			step: "main",
			pending: null,
			mends: [awardA, awardD].filter((row) => row.mend > 0 && row.mon.hp > 0).map((row) => ({
				uid: row.mon.uid,
				n: row.mend
			}))
		}), side, attacker.uid), attacker.uid, smashPlain(attacker)), blocker.uid, smashPlain(blocker) && !attacker.horn && !attacker.gaze && !attacker.bolt), attacker.uid, swordSwing(attacker)), attacker.uid, blocker.uid)), foe, attacker.uid), side, attacker, "face", false, worn.attacker.hp <= 0);
		return blocker.cardId === MYSTIC ? mysticRiposte(hunted, blocker.uid, attacker.uid) : hunted;
	}
	if (attacker.cardId === "mat-do-tan-pha") return resolveHellFace(state, attacker, null);
	if (attacker.cardId === "rong-ac-ma") return resolveDemonBall(state, attacker, null);
	if (pending.skill && (attacker.cardId === "rong-con" || attacker.cardId === "rong-ngan-tuoi" || attacker.cardId === "rong-phun-hoa-cau" || attacker.cardId === "sua-hut-ma-phap" || attacker.cardId === TIDE)) return useSkill({
		...state,
		step: "main",
		pending: null,
		hold: null
	}, attacker.uid, null, attacker.cardId === "rong-phun-hoa-cau" ? 1 : 0, true, null, true);
	const plate = plateBank(attacker);
	const bolt = Boolean(attacker.bolt);
	const spent = dropClash(spendBless(spendPlate(dullHorn({
		...attacker,
		dim: true
	}, attacker.horn), bolt ? {
		p: plate.p,
		s: plate.s
	} : plate, bolt)));
	const raw = attacker.horn ? attacker.atk + (attacker.blessAtk ?? 0) : liveAtk(attacker);
	const dealt = attacker.cardId === PERFECT ? outgoing(attacker, bolt ? raw + plate.p + plate.s : raw + plate.p + plate.s) : attacker.horn || attacker.gaze ? outgoing(attacker, raw) : attacker.cardId === RIDER ? outgoing(attacker, Math.max(raw, skillFigure(RIDER, "dmg", 4))) : raw;
	const bitten = Math.min(dealt, Math.max(0, them.hp));
	const fed = withLeech(you.field, spent, bitten, Math.max(0, dealt - bitten));
	let next = patch(state, side, {
		...you,
		field: fed.field
	});
	next = patch(next, foe, {
		...them,
		hp: them.hp - dealt
	});
	const soul = soulLeech(next, side, attacker, dealt);
	next = soul.state;
	const gazeTrue = Boolean(attacker.gaze && !attacker.horn && !bolt);
	const beamed = Boolean(attacker.horn || attacker.gaze || attacker.bolt);
	const guardSpell = !attacker.horn && !attacker.gaze && !bolt && guardStrikeKind(attacker, you.roster) === "spell";
	const preyHit = attacker.cardId === PREY && attacker.preyKind === "spell" ? "sát thương phép" : attacker.cardId === PREY && attacker.preyKind === "tru" ? "sát thương chuẩn" : "";
	const faceWord = guardSpell ? "sát thương phép" : preyHit || "máu";
	next = checkWinner(note(next, beamed ? `${cardOf(attacker).name} gây ${dealt} ${gazeTrue ? "sát thương chuẩn" : "sát thương phép"} lên người chơi.${soul.line}` : `${cardOf(attacker).name} gây ${dealt} ${faceWord} lên người chơi.${soul.line}`, beamed || guardSpell || preyHit === "sát thương phép" ? "spell" : "hit"));
	return markPrey(tideSwing(finishParley(mysticSecond(swingSword(growSmash(becomePerfect(releaseLegend({
		...next,
		step: next.winner !== null ? "over" : "main",
		pending: null
	}), side, attacker.uid), attacker.uid, smashPlain(attacker)), attacker.uid, swordSwing(attacker)), attacker.uid, null)), foe, attacker.uid), side, attacker, "face", true, spent.hp <= 0);
}
function answerGnaw(state, useSkillNow) {
	const pending = state.pending;
	if (state.step !== "respond" || !pending) return state;
	if (pending.kind === "gnaw") {
		const ownerSide = state.players[0].field.some((mon) => mon?.uid === pending.defender) ? 0 : 1;
		let next = state;
		if (useSkillNow) {
			const owner = next.players[ownerSide];
			const mon = owner.field.find((unit) => unit?.uid === pending.defender) ?? null;
			const paid = mon ? payCost(owner, skillManaCost(mon.cardId)) : null;
			if (paid && mon && !mon.dim) {
				const boosted = boostGnaw(mon);
				const bonus = skillHpBonus(mon.cardId);
				next = note(patch(next, ownerSide, {
					...paid,
					field: paid.field.map((unit) => unit?.uid === mon.uid ? boosted : unit)
				}), `${cardOf(mon).name} nhân đôi phòng ngự và tăng ${bonus} máu tối đa.`);
			}
		}
		next = {
			...next,
			step: "main",
			pending: null
		};
		return attackMonsterCore(next, pending.attacker, pending.defender, true, true);
	}
	if (pending.kind === "gnaw-skill") {
		const ownerSide = state.players[0].field.some((mon) => mon?.uid === pending.target) ? 0 : 1;
		let next = state;
		if (useSkillNow) {
			const owner = next.players[ownerSide];
			const mon = owner.field.find((unit) => unit?.uid === pending.target) ?? null;
			const paid = mon ? payCost(owner, skillManaCost(mon.cardId)) : null;
			if (paid && mon && !mon.dim) {
				const boosted = boostGnaw(mon);
				const bonus = skillHpBonus(mon.cardId);
				next = note(patch(next, ownerSide, {
					...paid,
					field: paid.field.map((unit) => unit?.uid === mon.uid ? {
						...boosted,
						dim: true
					} : unit)
				}), `${cardOf(mon).name} nhân đôi phòng ngự và tăng ${bonus} máu tối đa.`);
			}
		}
		next = {
			...next,
			step: "main",
			pending: null
		};
		return useSkill(next, pending.caster, pending.target, pending.index, true, null, true);
	}
	return state;
}
function declareSkill(state, uid, targetUid, skillIndex = 0, extra = null) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => declareSkill(next, uid, targetUid, skillIndex, extra));
	return traceSkill(state, declareSkillCore(state, uid, targetUid, skillIndex, extra), uid, targetUid);
}
function declareSkillCore(state, uid, targetUid, skillIndex = 0, extra = null) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner) return state;
	const you = state.players[state.turn];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.dim || held(mon) || hexLocked(mon)) return state;
	if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
	if (mon.cardId === "mat-do-tan-pha" && you.orb < skillManaCost(mon.cardId, 1)) return note(state, "Cần 1 gem.");
	if (mon.cardId === "may-nem-bom-hinh-nhen" && you.orb < skillManaCost(mon.cardId, 1)) return note(state, "Cần 1 gem.");
	const foeField = state.players[1 - state.turn].field;
	const aimed = redirectCover(foeField, targetUid);
	if ((mon.cardId === "ngai-khong-lo" || mon.cardId === "ngai-nu-hoang" || mon.cardId === "ngai-hoan-my") && !aimed) return note(state, "Chọn một quái đối thủ.");
	if (mon.cardId === "trai-tim-hai-long" && skillIndex >= 2 && !aimed) return note(state, "Chọn một quái đối thủ.");
	if (mon.cardId === "may-nem-bom-hinh-nhen" && targetUid && !aimed) return note(state, "Chọn một quái đối thủ hoặc người chơi.");
	const skill = castName(mon.cardId, skillIndex);
	const aimedMon = aimed ? [...foeField, ...you.field].find((unit) => unit?.uid === aimed) ?? null : null;
	const onto = aimedMon ? ` lên ${cardOf(aimedMon).name}` : "";
	if (mon.cardId === "mat-do-tan-pha" && !aimed) return beginHold(state, {
		kind: "face",
		attacker: uid,
		skill: true
	}, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
	if (mon.cardId === "rong-ac-ma" && !aimed) return beginHold(state, {
		kind: "face",
		attacker: uid,
		skill: true
	}, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
	if (isHarpy(mon.cardId)) {
		if ((mon.shed ?? []).includes("charm")) return note(state, "Mê hoặc đã biến mất.");
		if (!aimed) return note(state, "Chọn một quái đối thủ.");
		if (you.orb < harpyKit(mon.cardId).charm) return note(state, "Cần 1 mana.");
	}
	if (mon.cardId === "may-quay-thuong" && skillIndex === 1) {
		if (you.orb < 1) return note(state, "Cần 1 mana.");
		if (!aimed) return beginHold(state, {
			kind: "face",
			attacker: uid,
			skill: true
		}, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
	}
	if ((mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi") && !aimed) return beginHold(state, {
		kind: "face",
		attacker: uid,
		skill: true
	}, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
	if (mon.cardId === "rong-phun-hoa-cau" && skillIndex > 0 && !aimed) return beginHold(state, {
		kind: "face",
		attacker: uid,
		skill: true
	}, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
	if (mon.cardId === "sua-hut-ma-phap" && !aimed) return beginHold(state, {
		kind: "face",
		attacker: uid,
		skill: true
	}, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
	if (mon.cardId === TIDE && !aimed) return beginHold(state, {
		kind: "face",
		attacker: uid,
		skill: true
	}, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
	if (mon.cardId === "loi-nguyen-cua-rong" && !aimed) return note(state, "Chọn một quái đối thủ.");
	if (mon.cardId === "phu-thuy-rung-den") {
		if (!aimed) return note(state, "Chọn một quái đối thủ.");
		if (!foeField.find((unit) => unit?.uid === aimed && unit.hp > 0)) return note(state, "Chọn một quái đối thủ.");
	}
	if (mon.cardId === QUEEN_KNIGHT) {
		if (!aimed) return note(state, "Chọn một quái đối thủ.");
		if (!foeField.find((unit) => unit?.uid === aimed && unit.hp > 0)) return note(state, "Chọn một quái đối thủ.");
		if (you.orb < queenSwing(mon).cost) return note(state, "Cần 1 mana.");
	}
	return beginHold(state, {
		kind: "beam",
		caster: uid,
		target: aimed,
		index: skillIndex,
		extra
	}, `${cardOf(mon).name} dùng ${skill}${onto}.`);
}
function castName(cardId, index) {
	if (cardId === "kiem-si-lua-thieng") {
		if (index === 1) return chipLabel(cardId, "blood");
		if (index === 8) return "Đòn thêm";
		if (index === 9) return "Hoả thần long";
		return chipLabel(cardId, "fire");
	}
	if (cardId === "rong-phun-hoa-cau") return chipLabel(cardId, index > 0 ? "fire" : "peek");
	if (cardId === "phu-thuy-thoi-gian") return chipLabel(cardId, index >= 2 ? "all" : "age");
	if (cardId === "ga-he-dang-so") return chipLabel(cardId, index === 0 ? "charge" : "cast");
	if (cardId === "yeu-tinh-chuc-phuc") return chipLabel(cardId, index === 0 ? "aid" : "bless");
	if (cardId === "sau-non") return chipLabel(cardId, "cocoon");
	if (cardId === "ken-ngai") return chipLabel(cardId, "hatch");
	if (cardId === "phu-thuy-ti-hon" || cardId === "trieu-hoi-ac-ma") return chipLabel(cardId, "hex");
	if (cardId === "ong-khong-lo") return chipLabel(cardId, "stun");
	if (cardId === "mo-voi-ma-mut") return chipLabel(cardId, "burst");
	if (cardId === "ngai-khong-lo" || cardId === "ngai-nu-hoang" || cardId === "ngai-hoan-my") return chipLabel(cardId, "dust");
	if (cardId === "sua-hut-ma-phap") return chipLabel(cardId, "spit");
	if (cardId === TIDE) return chipLabel(cardId, "rage");
	if (cardId === SHADE) return chipLabel(cardId, "hide");
	if (cardId === "trai-tim-hai-long") {
		if (index >= 2) return "Đại thuỷ triều huỷ diệt";
		if (index === 1) return "Con nước lớn tàn phá";
		return chipLabel(cardId, "tide");
	}
	if (cardId === "mat-xanh-huy-diet") return "Tia sáng huỷ diệt";
	if (cardId === "mat-do-tan-pha") return "Cầu lửa địa ngục";
	if (cardId === "hoa-an-thit-nguoi") return chipLabel(cardId, "bite");
	if (cardId === PERFECT) {
		if (index === 2) return "Roi sấm";
		if (index === 3) return "Dụ dỗ";
		return "Gió xoáy";
	}
	if (isHarpy(cardId)) {
		if (index === 3) return "Dụ dỗ";
		return chipLabel(cardId, index === 1 ? "charm" : "gust");
	}
	if (cardId === "thuong-quan-long") return chipLabel(cardId, "spin");
	if (cardId === "may-nem-bom-hinh-nhen") return chipLabel(cardId, "bomb");
	if (cardId === "may-quay-thuong") return chipLabel(cardId, index === 1 ? "rage" : "reel");
	if (cardId === "rong-con" || cardId === "rong-ngan-tuoi") return chipLabel(cardId, "breath");
	if (cardId === "ma-dao-si") return chipLabel(cardId, "dan");
	if (cardId === "loi-nguyen-cua-rong") return chipLabel(cardId, "fire");
	if (cardId === "phu-thuy-rung-den") return chipLabel(cardId, "curse");
	if (cardId === "rong-ac-ma") return chipLabel(cardId, "orb");
	if (cardId === QUEEN_KNIGHT) return chipLabel(cardId, "sword");
	return monsterCard(cardId)?.name ?? "Kỹ năng";
}
function strikeName(mon) {
	if (mon.cardId === "mat-do-tan-pha") return "Cầu lửa địa ngục";
	if (mon.gaze && !mon.horn) return "Tia sáng huỷ diệt";
	if (mon.horn) return "Sấm lôi phá";
	return castName(mon.cardId, 0);
}
function rebound(state, victimUid) {
	const pending = state.pending;
	if (!pending) return note(state, "Không có đòn để phản.");
	const foeSide = 1 - (state.hold?.priority ?? 1 - state.turn);
	const victim = state.players[foeSide].field.find((mon) => mon?.uid === victimUid) ?? null;
	if (!victim) return note(state, "Chọn một kẻ địch để phản đòn.");
	const casterUid = pending.kind === "beam" ? pending.caster : pending.kind === "face" || pending.kind === "melee" ? pending.attacker : "";
	const caster = state.players[0].field.find((mon) => mon?.uid === casterUid) ?? state.players[1].field.find((mon) => mon?.uid === casterUid) ?? null;
	if (pending.kind === "beam" && caster?.cardId === "ong-khong-lo") return note(state, "Lá chắn phản đòn không phản được đòn trói.");
	if (pending.kind === "beam" && !caster) return note(state, "Không còn quái thi triển.");
	if ((pending.kind === "face" || pending.kind === "melee") && !caster?.horn && !caster?.gaze && caster?.cardId !== "mat-do-tan-pha") return note(state, "Không có đòn kỹ năng để phản.");
	if (pending.kind !== "beam" && pending.kind !== "face" && pending.kind !== "melee") return note(state, "Không có đòn kỹ năng để phản.");
	const index = pending.kind === "beam" ? pending.index : 0;
	return {
		...note(state, `${pending.kind === "beam" ? castName(caster.cardId, index) : strikeName(caster)} bị phản vào ${cardOf(victim).name}.`),
		step: "respond",
		pending: {
			kind: "beam",
			caster: caster.uid,
			target: victim.uid,
			index,
			back: true
		},
		hold: {
			priority: foeSide,
			passed: [false, false],
			blocker: null,
			blockerSkill: false,
			armed: null
		}
	};
}
function finishRebound(state) {
	const pending = state.pending;
	if (!pending || pending.kind !== "beam" || !pending.back || !pending.target) return {
		...state,
		step: "main",
		pending: null,
		hold: null
	};
	const caster = state.players[0].field.find((mon) => mon?.uid === pending.caster) ?? state.players[1].field.find((mon) => mon?.uid === pending.caster) ?? null;
	const victimSide = state.players[0].field.some((mon) => mon?.uid === pending.target) ? 0 : 1;
	const victim = state.players[victimSide].field.find((mon) => mon?.uid === pending.target) ?? null;
	const clear = {
		...state,
		step: "main",
		pending: null,
		hold: null,
		echo: null,
		last: null
	};
	if (!caster || !victim) return clear;
	const ownerSide = state.players[0].field.some((mon) => mon?.uid === caster.uid) ? 0 : 1;
	if (caster.cardId === QUEEN_KNIGHT) return strikeQueenSword(clear, ownerSide, state.players[ownerSide].field.find((mon) => mon?.uid === caster.uid) ?? caster, victimSide, victim);
	if (caster.cardId === "ong-khong-lo") {
		let owner = state.players[ownerSide];
		const paid = payCost(owner, skillManaCost(caster.cardId, 1));
		if (!paid) return note(clear, "Không đủ mana để phản đòn.");
		owner = paid;
		const turns = grabNums(skillText(caster.cardId), /(\d+)\s*lượt/gi)[0] ?? 5;
		const stunAt = (mon) => mon.uid === victim.uid ? {
			...mon,
			stun: turns
		} : mon;
		let field = owner.field.map((mon) => mon?.uid === caster.uid ? stunAt({
			...mon,
			dim: true
		}) : mon ? stunAt(mon) : mon);
		let next = patch(clear, ownerSide, {
			...owner,
			field
		});
		if (ownerSide !== victimSide) {
			const them = state.players[victimSide];
			next = patch(next, victimSide, {
				...them,
				field: them.field.map((mon) => mon ? stunAt(mon) : mon)
			});
		}
		return note(next, `${castName(caster.cardId, pending.index)} trong ${turns} lượt.`, "spell");
	}
	if (caster.cardId === "may-nem-bom-hinh-nhen") return rainBombs(clear, ownerSide, clear.players[ownerSide].field.find((unit) => unit?.uid === caster.uid) ?? caster, victim.uid);
	let owner = state.players[ownerSide];
	if (caster.cardId === "mat-do-tan-pha") {
		const cost = skillManaCost(caster.cardId, 1);
		const paid = payCost(owner, cost);
		if (!paid) return note(clear, "Không đủ mana để phản đòn.");
		const dimmed = {
			...caster,
			dim: true
		};
		const field = paid.field.map((mon) => mon?.uid === caster.uid ? dimmed : mon);
		return resolveHell(patch(clear, ownerSide, {
			...paid,
			field
		}), dimmed, victim);
	}
	if (caster.cardId === "may-quay-thuong") {
		const paid = payCost(owner, 1);
		if (!paid) return note(clear, "Không đủ mana để phản đòn.");
		const amount = (caster.misses ?? 0) + 3;
		const dimmed = {
			...caster,
			dim: true
		};
		let field = paid.field.map((mon) => mon?.uid === caster.uid ? dimmed : mon);
		if (ownerSide === victimSide) field = field.map((mon) => mon?.uid === victim.uid ? damageSpell(mon, amount, field, caster) : mon);
		let next = patch(clear, ownerSide, dropDead({
			...paid,
			field
		}));
		if (ownerSide !== victimSide) {
			const them = state.players[victimSide];
			next = patch(next, victimSide, dropDead({
				...them,
				field: them.field.map((mon) => mon?.uid === victim.uid ? damageSpell(mon, amount, them.field, caster) : mon)
			}));
		}
		return note(next, `${castName(caster.cardId, pending.index)} bị phản, gây ${spellLanded(victim, amount, ownerSide === victimSide ? field : state.players[victimSide].field, caster)} sát thương phép.`, "spell");
	}
	if (caster.cardId === "loi-nguyen-cua-rong") {
		const amount = grabNums(skillText(caster.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2;
		const paid = payCost(owner, skillManaCost(caster.cardId, 0));
		if (!paid) return note(clear, "Không đủ mana để phản đòn.");
		owner = paid;
		const blow = outgoing(caster, amount);
		let field = owner.field.map((mon) => mon?.uid === caster.uid ? {
			...mon,
			dim: true
		} : mon);
		const strike = (unit, allies) => trueDamage(unit.uid === caster.uid ? {
			...unit,
			dim: true
		} : unit, blow, allies);
		let lost = 0;
		if (ownerSide === victimSide) {
			const current = field.find((mon) => mon?.uid === victim.uid) ?? victim;
			const hit = strike(current, field);
			lost = Math.max(0, current.hp - hit.hp);
			field = field.map((mon) => mon?.uid === victim.uid ? hit : mon);
		}
		let next = patch(clear, ownerSide, dropDead({
			...owner,
			field
		}));
		if (ownerSide !== victimSide) {
			const them = state.players[victimSide];
			const current = them.field.find((mon) => mon?.uid === victim.uid) ?? victim;
			const hit = strike(current, them.field);
			lost = Math.max(0, current.hp - hit.hp);
			next = patch(next, victimSide, dropDead({
				...them,
				field: them.field.map((mon) => mon?.uid === victim.uid ? hit : mon)
			}));
		}
		return note(next, `${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(victim).name}, gây ${lost} sát thương chuẩn.`, "hit");
	}
	if (caster.gaze && !caster.horn) {
		const amount = outgoing(caster, liveAtk(caster));
		const field = owner.field.map((mon) => {
			if (!mon) return mon;
			if (mon.uid === caster.uid) {
				const spent = {
					...mon,
					dim: true,
					gaze: void 0
				};
				return mon.uid === victim.uid ? landTrue(spent, amount, owner.field).mon : spent;
			}
			return mon.uid === victim.uid ? landTrue(mon, amount, owner.field).mon : mon;
		});
		const landed = ownerSide === victimSide ? field : state.players[victimSide].field.map((mon) => mon?.uid === victim.uid ? landTrue(mon, amount, state.players[victimSide].field).mon : mon);
		let next = ownerSide === victimSide ? patch(clear, ownerSide, dropDead({
			...owner,
			field
		})) : patch(clear, ownerSide, {
			...owner,
			field
		});
		if (ownerSide !== victimSide) next = patch(next, victimSide, dropDead({
			...state.players[victimSide],
			field: landed
		}));
		const allies = ownerSide === victimSide ? owner.field : state.players[victimSide].field;
		return note(next, `${strikeName(caster)} bị phản vào ${cardOf(victim).name}, gây ${truLanded(victim, amount, allies)} sát thương chuẩn.`, "spell");
	}
	if (caster.horn) {
		const atk = liveAtk(caster);
		const amount = outgoing(caster, caster.horn === "plus" ? Math.min(8, atk) : caster.horn === "splash" ? Math.min(4, atk) : atk);
		const field = owner.field.map((mon) => {
			if (!mon) return mon;
			if (mon.uid === caster.uid) {
				const spent = {
					...mon,
					dim: true,
					gaze: void 0,
					horn: mon.horn === "plain" || !mon.horn ? mon.horn : "plain"
				};
				return mon.uid === victim.uid ? damageSpell(spent, amount, owner.field) : spent;
			}
			return mon.uid === victim.uid ? damageSpell(mon, amount, owner.field) : mon;
		});
		const landed = ownerSide === victimSide ? field : state.players[victimSide].field.map((mon) => mon?.uid === victim.uid ? damageSpell(mon, amount, state.players[victimSide].field) : mon);
		let next = ownerSide === victimSide ? patch(clear, ownerSide, dropDead({
			...owner,
			field
		})) : patch(clear, ownerSide, {
			...owner,
			field
		});
		if (ownerSide !== victimSide) next = patch(next, victimSide, dropDead({
			...state.players[victimSide],
			field: landed
		}));
		return note(next, `${strikeName(caster)} bị phản vào ${cardOf(victim).name}, gây ${spellLanded(victim, amount, ownerSide === victimSide ? owner.field : state.players[victimSide].field, null)} sát thương phép.`, "spell");
	}
	let body = {
		...caster,
		dim: true
	};
	if (caster.cardId === "kiem-si-lua-thieng" && pending.index !== 0) {
		const bite = grabNums(skillText(caster.cardId), /tiêu(?:\s*hao)?\s*(\d+)\s*máu/gi)[pending.index === 8 ? 1 : 0] ?? 2;
		if (caster.hp <= bite) return note(clear, "Không đủ máu để phản đòn.");
		body = {
			...caster,
			hp: caster.hp - bite,
			dim: true
		};
	} else {
		const cost = caster.cardId === "rong-phun-hoa-cau" && pending.index > 0 ? 1 : skillManaCost(caster.cardId, 0);
		const paid = payCost(owner, cost);
		if (!paid) return note(clear, "Không đủ mana để phản đòn.");
		owner = paid;
	}
	const amount = skillFigure(caster.cardId, "dmg", 0, pending.index === 8 ? 2 : pending.index);
	let field = owner.field.map((mon) => mon?.uid === body.uid ? body : mon);
	if (amount > 0 && ownerSide === victimSide) {
		const current = field.find((mon) => mon?.uid === victim.uid) ?? victim;
		field = field.map((mon) => mon?.uid === victim.uid ? damageSpell(current, amount, field, caster) : mon);
	}
	let next = patch(clear, ownerSide, dropDead({
		...owner,
		field
	}));
	if (amount > 0 && ownerSide !== victimSide) {
		const them = state.players[victimSide];
		const foeField = them.field.map((mon) => mon?.uid === victim.uid ? damageSpell(mon, amount, them.field, caster) : mon);
		next = patch(next, victimSide, dropDead({
			...them,
			field: foeField
		}));
	}
	return note(next, amount > 0 ? `${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(victim).name}, gây ${spellLanded(victim, amount, ownerSide === victimSide ? field : state.players[victimSide].field, caster)} sát thương phép.` : `${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(victim).name}.`, "spell");
}
function chargedWhip(state) {
	const pending = state.pending;
	if (pending?.kind !== "melee" && pending?.kind !== "face") return null;
	for (const side of [0, 1]) {
		const mon = state.players[side].field.find((unit) => unit?.uid === pending.attacker) ?? null;
		if (mon?.bolt) return {
			side,
			mon
		};
	}
	return null;
}
function castSpell(state, handIndex, targetUid = null, replay = false, sourceUid = null) {
	const next = castSpellCore(state, handIndex, targetUid, replay, sourceUid);
	if (replay || next === state) return next;
	const side = state.step === "main" ? state.turn : state.hold?.priority ?? 1 - state.turn;
	const cardId = state.players[side].hand[handIndex] ?? null;
	const held = next.pending?.kind === "spell" && next.pending.cardId === cardId;
	const removed = cardId !== null && state.players[side].hand.includes(cardId) && !next.players[side].hand.includes(cardId);
	const ok = held || removed;
	if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
	const marked = traced(state, next, {
		kind: "spell",
		actor: side,
		ok,
		cardId,
		target: targetUid ? monsterTarget(state, targetUid) : null,
		end: null
	});
	const reflect = Boolean(state.pending && "back" in state.pending && state.pending.back);
	return withResults(state, marked, {
		blocked: Boolean(state.hold?.blocker),
		reflect,
		turn: false
	});
}
function castSpellCore(state, handIndex, targetUid = null, replay = false, sourceUid = null) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.winner || state.step !== "main" && state.step !== "respond") return state;
	if (!replay && state.step === "main") {
		const waiting = needUpkeep(state);
		if (waiting) return waiting;
	}
	const side = replay || state.step === "main" ? state.turn : state.hold?.priority ?? 1 - state.turn;
	const foe = 1 - side;
	const player = state.players[side];
	const cardId = player.hand[handIndex];
	const card = cardId ? spellCard(cardId) : void 0;
	if (!card) return state;
	if (card.id === "ke-dao-mo") return state;
	if (card.env) return note(state, "Lá môi trường đã nằm trên sân.");
	const response = /* @__PURE__ */ new Set([
		"guong-phong-ho",
		"la-chan-phan-don",
		"vong-xoay-bao-ho",
		"vong-nguyen-rua-ac-ma",
		"phuc-kich",
		"hoan-doi",
		"hap-thu-ma-phap",
		"ngan-chan-phong-ngu",
		"virus-an-mon",
		"co-may-thoi-gian",
		"giap-co-khi"
	]);
	if (!replay && card.id === "hoan-doi") {
		if (!canCastSwap(state, side)) return note(state, swapRows(player).length < 2 ? "Không đủ quái để hoán đổi." : "Hoán đổi chỉ dùng khi có quái bị nhắm.");
	}
	if (!replay && card.id === "hap-thu-ma-phap" && state.pending?.kind !== "spell" && state.pending?.kind !== "lash" && !chargedWhip(state)) return note(state, "Chỉ hấp thu được lá phép đang thi triển.");
	if (!replay && card.id === "virus-an-mon") {
		if (state.step !== "respond" || !watchedOneStar(state, side)) return note(state, "Virus ăn mòn chỉ dùng khi quái 1 sao đồng minh bị nhắm.");
	}
	if (!replay && card.id === "co-may-thoi-gian") {
		const ally = targetUid ? player.field.find((mon) => mon?.uid === targetUid) ?? null : null;
		if (state.step !== "respond" || !ally || !(state.past?.[ally.uid] ?? state.born?.[ally.uid])) return note(state, "Cỗ máy thời gian chỉ dùng khi đồng minh đang bị nhắm.");
	}
	if (!replay && card.id === "giap-co-khi") {
		const pending = state.pending;
		const ally = targetUid ? player.field.find((mon) => mon?.uid === targetUid) ?? null : null;
		const casterUid = pending?.kind === "beam" ? pending.caster : "";
		const caster = state.players[0].field.find((mon) => mon?.uid === casterUid) ?? state.players[1].field.find((mon) => mon?.uid === casterUid) ?? null;
		const foeCaster = Boolean(caster && !player.field.some((mon) => mon?.uid === caster.uid));
		if (state.step !== "respond" || pending?.kind !== "beam" || !pending.target || pending.target !== ally?.uid || !foeCaster) return note(state, "Giáp cơ khí chỉ dùng khi kỹ năng đối phương nhắm một đồng minh.");
	}
	if (!replay && card.id === "mu-ma-phap" && !player.field.some((mon) => mon && mon.cardId !== "mu")) return note(state, "Cần có quái trên sân.");
	if (!replay && card.id === "la-chan-phan-don") {
		const pending = state.pending;
		const attacker = pending && (pending.kind === "face" || pending.kind === "melee") ? state.players[state.turn].field.find((mon) => mon?.uid === pending.attacker) : null;
		const horn = Boolean(attacker?.horn || attacker?.gaze);
		if (pending?.kind === "beam") {
			if ((state.players[0].field.find((mon) => mon?.uid === pending.caster) ?? state.players[1].field.find((mon) => mon?.uid === pending.caster))?.cardId === "ong-khong-lo") return note(state, "Lá chắn phản đòn không phản được đòn trói.");
		}
		if (pending?.kind !== "beam" && !horn) return note(state, "Chỉ phản được đòn kỹ năng.");
		const foeSide = 1 - (state.hold?.priority ?? 1 - state.turn);
		if (!targetUid || !state.players[foeSide].field.some((mon) => mon?.uid === targetUid)) return note(state, "Chọn một kẻ địch để phản đòn.");
	}
	if (!replay && state.step === "respond" && !response.has(card.id)) return note(state, "Phép này không ứng biến được.");
	if (!replay && state.step === "main" && !canTargetFoe(state) && card.id !== "mua-ma-thuat" && card.id !== "thu-hoi-quai-thu" && card.id !== "sung-loi-pha" && card.id !== "mu-ma-phap") return note(state, "Lượt đầu không được nhắm đối thủ.");
	if (card.id === "sung-loi-pha") {
		const picked = targetUid ? player.field.find((mon) => mon?.uid === targetUid) ?? null : player.field.find((mon) => mon && hornFit(mon.cardId)) ?? null;
		if (!picked || !hornFit(picked.cardId)) return note(state, "Sừng không gắn dạng người, thiên thần hay thiên sứ.");
		targetUid = picked.uid;
	}
	if (card.id === "soi-xich-dia-nguc") {
		const foeSide = 1 - side;
		const picked = targetUid ? state.players[foeSide].field.find((mon) => mon?.uid === targetUid) ?? null : state.players[foeSide].field.find((mon) => mon) ?? null;
		if (!picked || targetUid && picked.uid !== targetUid) return note(state, "Chọn một quái đối thủ.");
		targetUid = picked.uid;
	}
	let spellSource = null;
	if (card.id === "phan-nguyen") {
		const foeSide = 1 - side;
		const ally = sourceUid ? player.field.find((mon) => mon?.uid === sourceUid) ?? null : player.field.find((mon) => mon && harmShift(mon)) ?? null;
		const picked = targetUid ? state.players[foeSide].field.find((mon) => mon?.uid === targetUid) ?? null : !sourceUid ? state.players[foeSide].field.find((mon) => mon) ?? null : null;
		if (!ally || !harmShift(ally)) return note(state, "Chọn đồng minh đang mang trạng thái xấu.");
		if (!picked) return note(state, "Chọn quái đối thủ để chuyển trạng thái.");
		spellSource = ally.uid;
		targetUid = picked.uid;
	}
	if (!replay && card.id === "vong-nguyen-rua-ac-ma") {
		const pending = state.pending;
		const swing = pending?.kind === "face" || pending?.kind === "melee";
		const shot = pending?.kind === "beam" || pending?.kind === "gnaw-skill";
		if (state.step !== "respond" || !pending || !swing && !shot) return note(state, "Vòng nguyền chỉ chặn đòn đánh hoặc skill gây sát thương.");
		const uid = swing && "attacker" in pending ? pending.attacker : "caster" in pending ? pending.caster : "";
		const ownerSide = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
		const attacker = state.players[ownerSide].field.find((mon) => mon?.uid === uid) ?? null;
		if (!attacker) return note(state, "Không có quái để nguyền.");
		if (shot && !harmSkill(attacker.cardId, "index" in pending ? pending.index : 0)) return note(state, "Vòng nguyền chỉ chặn skill gây sát thương.");
	}
	let next = state;
	if (!replay) {
		const before = player.stars;
		const tolled = Boolean(player.tolls?.[handIndex]);
		const bill = playBill(card.gems, tolled, player.orb, player.flask);
		if (bill) return note(state, bill);
		const paid = payPlayed(player, card.gems, tolled);
		if (!paid) return note(state, bill ?? `Cần ${card.gems} gem.`);
		const dropped = dropHandCard(paid, handIndex);
		const buried = {
			...dropped,
			spent: [...dropped.spent ?? paid.spent ?? [], card.id]
		};
		next = pingStars(patch(state, side, buried), side, before, buried.stars);
		const burst = /* @__PURE__ */ new Set([
			"mua-ma-thuat",
			"hap-thu-ma-phap",
			"vong-xoay-bao-ho",
			"thu-hoi-quai-thu"
		]);
		if (card.id === "vong-nguyen-rua-ac-ma" && state.step === "respond" && state.pending) {
			const pending = state.pending;
			const uid = pending.kind === "face" || pending.kind === "melee" ? pending.attacker : pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.caster : "";
			return {
				...note(next, `${card.name} đang thi triển.`),
				step: "respond",
				pending: {
					kind: "spell",
					owner: side,
					cardId: card.id,
					target: null,
					source: uid
				},
				hold: {
					priority: 1 - side,
					passed: [false, false],
					blocker: null,
					blockerSkill: false,
					armed: null
				}
			};
		}
		if (state.step === "main" && !response.has(card.id) && card.id !== "sung-loi-pha" && !burst.has(card.id)) return beginHold(next, {
			kind: "spell",
			owner: side,
			cardId: card.id,
			target: targetUid,
			source: spellSource
		}, `${card.name} đang thi triển.`);
	} else next = patch(state, side, dropHandCard(player, handIndex));
	if (targetUid) targetUid = redirectCover(next.players[foe].field, targetUid);
	const enemy = next.players[foe];
	const foeMon = targetUid ? enemy.field.find((mon) => mon?.uid === targetUid) ?? null : enemy.field.find((mon) => mon) ?? null;
	if (card.id === "sam-set-tan-the") {
		const amount = 2 + next.players[side].stars;
		const rows = next.players[foe].field.filter((mon) => Boolean(mon && mon.hp > 0)).map((mon) => ({
			name: cardOf(mon).name,
			bits: `${shownTru(mon, amount, next.players[foe].field)} sát thương chuẩn`
		}));
		const field = next.players[foe].field.map((mon) => mon ? trueDamage(mon, amount, next.players[foe].field) : mon);
		return note(patch(next, foe, dropDead({
			...next.players[foe],
			field
		})), aimNotice("Sấm sét tận thế", rows) ?? `Sấm sét tận thế gây ${rows[0]?.bits ?? `${amount} sát thương chuẩn`} lên tất cả kẻ địch.`, "spell");
	}
	if (card.id === "mua-ma-thuat") {
		const amount = spellFigure("mua-ma-thuat", "heal", 2);
		const wash = (mon) => {
			const cap = mon.maxHp || mon.hp;
			return {
				...mon,
				hp: Math.min(cap, mon.hp + amount),
				stun: 0,
				bleed: 0,
				curse: false,
				noBlock: false,
				vulnerable: 0,
				chain: 0,
				gag: 0,
				poison: void 0,
				erode: void 0,
				wet: mon.wet && mon.wet >= 90 ? mon.wet : void 0
			};
		};
		return note(patch(next, side, {
			...next.players[side],
			field: next.players[side].field.map((mon) => mon ? wash(mon) : mon)
		}), `Mưa ma thuật hồi ${amount + charmDamage} máu và gỡ hết trạng thái xấu`, "heal");
	}
	if (card.id === "mu-ma-phap") {
		const you = next.players[side];
		if (!you.field.some((mon) => mon && mon.cardId !== "mu")) return note(next, "Cần có quái trên sân.");
		const field = [...you.field];
		let n = 0;
		for (let i = 0; i < 3; i += 1) if (!field[i]) field[i] = makeHat(next.seq + n + 1, side, n++);
		return note(patch(next, side, {
			...you,
			field,
			hats: true
		}), "Mũ ma pháp che sân.", "spell");
	}
	if (card.id === "thanh-guom-anh-sang") {
		const turns = grabNums(spellText("thanh-guom-anh-sang"), /(\d+)\s*lượt/gi)[0] ?? 5;
		const open = (mon, gag) => mon ? {
			...mon,
			gag,
			shown: isSea(mon.cardId) ? turns : mon.shown
		} : mon;
		const foeField = enemy.field.map((mon) => open(mon, turns));
		let marked = patch(next, foe, {
			...enemy,
			field: foeField
		});
		const yourField = marked.players[side].field.map((mon) => mon && isSea(mon.cardId) ? {
			...mon,
			shown: turns
		} : mon);
		marked = patch(marked, side, {
			...marked.players[side],
			field: yourField
		});
		return note(marked, `Thanh gươm ánh sáng cấm các quái đang có mặt tấn công ${turns} lượt và hiện mọi quái ẩn.`, "spell");
	}
	if (card.id === "guong-phong-ho") return note(patch(next, side, {
		...next.players[side],
		mirror: 3
	}), "Gương phòng hộ dựng lên trong 3 lượt.", "spell");
	if (card.id === "soi-xich-dia-nguc") {
		if (!foeMon) return note(next, "Không có quái để xiềng.");
		const field = enemy.field.map((mon) => mon?.uid === foeMon.uid ? {
			...mon,
			chain: 2,
			def: 0,
			mdef: 0
		} : mon);
		let marked = note(patch(next, foe, {
			...enemy,
			field
		}), `Sợi xích địa ngục khống chế ${cardOf(foeMon).name} và đưa phòng ngự về 0.`, "spell");
		if (marked.hold?.blocker === foeMon.uid) marked = {
			...marked,
			hold: {
				...marked.hold,
				blocker: null,
				blockerSkill: false,
				armed: null
			}
		};
		return marked.step === "respond" ? keep(marked) : marked;
	}
	if (card.id === "vong-nguyen-rua-ac-ma") {
		const pending = state.pending;
		const swing = pending?.kind === "face" || pending?.kind === "melee";
		const shot = pending?.kind === "beam" || pending?.kind === "gnaw-skill";
		const uid = swing && pending && "attacker" in pending ? pending.attacker : shot && pending && "caster" in pending ? pending.caster : sourceUid ?? "";
		if (!replay && (state.step !== "respond" || !pending || !swing && !shot)) return note(next, "Vòng nguyền chỉ chặn đòn đánh hoặc skill gây sát thương.");
		const ownerSide = next.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
		const attacker = next.players[ownerSide].field.find((mon) => mon?.uid === uid) ?? null;
		if (!attacker) return note(next, "Không có quái để nguyền.");
		if (shot && pending && "index" in pending && !harmSkill(attacker.cardId, pending.index)) return note(next, "Vòng nguyền chỉ chặn skill gây sát thương.");
		const field = next.players[ownerSide].field.map((mon) => mon?.uid === attacker.uid ? {
			...mon,
			curse: true,
			dim: true
		} : mon);
		return releaseLegend(note({
			...patch(next, ownerSide, {
				...next.players[ownerSide],
				field
			}),
			step: "main",
			pending: null,
			hold: null
		}, `${cardOf(attacker).name} bị chặn và nguyền. Sát thương còn một nửa.`, "spell"));
	}
	if (card.id === "sung-loi-pha") {
		const ally = next.players[side].field.find((mon) => mon?.uid === targetUid) ?? null;
		if (!ally || !hornFit(ally.cardId)) return state;
		const field = next.players[side].field.map((mon) => mon?.uid === ally.uid ? {
			...mon,
			horn: "plain",
			hornNew: true
		} : mon);
		return note(patch(next, side, {
			...next.players[side],
			field
		}), `${cardOf(ally).name} mang Sừng lôi phá. Đòn đánh thành sát thương phép.`, "info");
	}
	if (card.id === "bien-sau") {
		const field = next.players[side].field.map((mon) => mon && isSea(mon.cardId) ? {
			...mon,
			wet: 99
		} : mon);
		return note(patch(next, side, shuffleSea({
			...next.players[side],
			sea: true,
			field
		})), "Biển sâu nuốt quái biển. Đối thủ không thấy chỉ số", "spell");
	}
	if (card.id === "co-may-thoi-gian") {
		const ally = targetUid ? next.players[side].field.find((mon) => mon?.uid === targetUid) ?? null : null;
		if (!ally) return note(next, "Không có đồng minh đang bị nhắm.");
		const stamp = turnStamp(next, ally.uid);
		const rewound = rewindAlly(next, side, ally.uid);
		if (!rewound || !stamp) return note(next, "Không có trạng thái trước.");
		return keep(note(rewound, `Cỗ máy thời gian đưa ${cardOf(stamp.mon).name} về ${stamp.born ? "trạng thái lúc vừa triệu hồi" : "trạng thái đầu 3 lượt chung trước"}.`, "spell"));
	}
	if (card.id === "giap-co-khi") {
		const pending = state.pending;
		const ally = targetUid ? next.players[side].field.find((mon) => mon?.uid === targetUid) ?? null : null;
		const casterUid = pending?.kind === "beam" ? pending.caster : "";
		const caster = next.players[0].field.find((mon) => mon?.uid === casterUid) ?? next.players[1].field.find((mon) => mon?.uid === casterUid) ?? null;
		if (!ally || !caster || pending?.kind !== "beam") return note(next, "Giáp cơ khí chỉ dùng khi kỹ năng đối phương nhắm một đồng minh.");
		const atkPlus = grabNums(card.effect, /(\d+)\s*công/gi)[0] ?? 2;
		const mdefPlus = grabNums(card.effect, /(\d+)\s*thủ phép/gi)[0] ?? 2;
		const buffed = {
			...ally,
			atk: ally.atk + atkPlus,
			mdef: ally.mdef + mdefPlus,
			raised: markRaised(ally, {
				atk: atkPlus,
				mdef: mdefPlus
			})
		};
		const field = next.players[side].field.map((mon) => mon?.uid === ally.uid ? buffed : mon);
		const plated = patch(next, side, {
			...next.players[side],
			field
		});
		const threat = skillThreat(caster.cardId, pending.index);
		const base = `Giáp cơ khí tăng ${atkPlus} công và ${mdefPlus} thủ phép cho ${cardOf(ally).name}.`;
		if (liveAtk(buffed) <= threat) return keep(note(plated, base, "spell"));
		const casterSide = plated.players[0].field.some((mon) => mon?.uid === caster.uid) ? 0 : 1;
		return {
			...note(plated, `${base} ${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(caster).name}.`, "spell"),
			step: "respond",
			pending: {
				kind: "beam",
				caster: caster.uid,
				target: caster.uid,
				index: pending.index,
				back: true
			},
			hold: {
				priority: casterSide,
				passed: [false, false],
				blocker: null,
				blockerSkill: false,
				armed: null
			}
		};
	}
	if (card.id === "hap-thu-ma-phap") {
		if (state.pending?.kind === "lash") return note({
			...next,
			step: "main",
			pending: null,
			hold: null
		}, "Hấp thụ ma pháp nuốt Roi điện.", "spell");
		const whip = chargedWhip(state);
		if (whip) {
			const owner = next.players[whip.side];
			const field = owner.field.map((unit) => unit?.uid === whip.mon.uid ? {
				...unit,
				bolt: void 0
			} : unit);
			return note(patch({
				...next,
				step: "main",
				pending: null,
				hold: null
			}, whip.side, {
				...owner,
				field
			}), "Hấp thụ ma pháp nuốt Roi sấm.", "spell");
		}
		if (state.pending?.kind !== "spell") return note(next, "Chỉ hấp thu được lá phép đang thi triển.");
		const eaten = spellCard(state.pending.cardId)?.name ?? state.pending.cardId;
		return note({
			...next,
			step: "main",
			pending: null,
			hold: null
		}, `Hấp thụ ma pháp nuốt ${eaten}.`, "spell");
	}
	if (card.id === "phan-nguyen") {
		const ally = next.players[side].field.find((mon) => mon?.uid === spellSource) ?? null;
		if (!ally || !foeMon || !harmShift(ally)) return state;
		const moved = freshHarm(ally);
		const mine = next.players[side].field.map((mon) => mon?.uid === ally.uid ? clearHarm(mon) : mon);
		const theirs = enemy.field.map((mon) => mon?.uid === foeMon.uid ? {
			...mon,
			...moved
		} : mon);
		let shifted = patch(next, side, {
			...next.players[side],
			field: mine
		});
		shifted = patch(shifted, foe, {
			...enemy,
			field: theirs
		});
		return note(shifted, `Phản nguyền chuyển trạng thái xấu từ ${cardOf(ally).name} sang ${cardOf(foeMon).name}.`, "spell");
	}
	if (card.id === "phuc-kich") {
		const pending = state.pending;
		if (state.step !== "respond" || !pending || pending.kind !== "face" && pending.kind !== "melee") return note(next, "Phục kích chỉ dùng khi bị tấn công.");
		const ready = next.players[side].field.filter((mon) => mon && mon.stun === 0 && (mon.chain ?? 0) === 0 && mon.cardId !== "chan-ken" && mon.cardId !== "ken-ngai" && mon.cardId !== "hoa-an-thit-nguoi");
		const fighter = targetUid ? ready.find((mon) => mon?.uid === targetUid) ?? null : null;
		const attacker = next.players[foe].field.find((mon) => mon?.uid === pending.attacker) ?? null;
		if (!fighter || !attacker) return note(next, "Chọn quái để phục kích.");
		const bonus = spellFigure("phuc-kich", "atk", 2);
		const raw = fighter.atk + bonus;
		const body = openShade(attacker);
		const ambush = body.cardId === "chien-binh-rong" ? takePhysical(body, raw, next.players[foe].field) : null;
		const dealt = ambush ? Math.max(0, body.hp - ambush.mon.hp) : physical(raw, body.def);
		const foeField = next.players[foe].field.map((mon) => mon?.uid === attacker.uid ? ambush ? {
			...ambush.mon,
			dim: true
		} : {
			...body,
			hp: body.hp - dealt,
			dim: true
		} : mon);
		const myField = next.players[side].field.map((mon) => mon?.uid === fighter.uid ? {
			...mon,
			dim: true
		} : mon);
		let hit = patch(next, foe, dropDead({
			...next.players[foe],
			field: foeField
		}));
		hit = patch(hit, side, {
			...hit.players[side],
			field: myField
		});
		return releaseLegend({
			...note(hit, actNotice("Phục kích", ["chặn đòn tấn công", `đánh thường lên ${cardOf(attacker).name}, gây ${dealt} máu và không bị phản đòn`]), "hit"),
			step: "main",
			pending: null
		});
	}
	if (card.id === "hoan-doi") {
		if (state.step !== "respond" || !state.pending) return note(next, "Hoán đổi chỉ dùng khi có quái bị nhắm.");
		return {
			...next,
			swap: {
				first: lockedSwapToken(next, side),
				side,
				locked: lockedSwapToken(next, side)
			}
		};
	}
	if (card.id === "virus-an-mon") {
		if (state.step !== "respond") return note(next, "Virus ăn mòn chỉ dùng khi quái 1 sao bị nhắm.");
		const marked = watchedOneStar(next, side);
		if (!marked) return note(next, "Chỉ theo dõi được quái 1 sao đồng minh đang bị nhắm.");
		return note({
			...next,
			virusArm: {
				owner: side,
				uid: marked.uid
			}
		}, `Virus ăn mòn theo dõi ${cardOf(marked).name}. Nếu nó bị tiêu diệt, virus sẽ ăn mòn đối thủ.`, "info");
	}
	if (card.id === "vong-xoay-bao-ho") {
		if (state.step !== "respond") return note(next, "Vòng xoáy chỉ dùng khi đang bị tấn công.");
		return endTurn({
			...note(next, "Vòng xoáy bảo hộ chặn đòn và kết thúc lượt.", "spell"),
			step: "main",
			pending: null
		});
	}
	if (card.id === "ngan-chan-phong-ngu") {
		if (!foeMon) return note(next, "Không có quái để chặn phòng ngự.");
		const field = enemy.field.map((mon) => mon?.uid === foeMon.uid ? {
			...mon,
			noBlock: true
		} : mon);
		let marked = note(patch(next, foe, {
			...enemy,
			field
		}), `${cardOf(foeMon).name} không được chặn trong lượt này.`, "spell");
		if (marked.hold?.blocker === foeMon.uid) marked = {
			...marked,
			hold: {
				...marked.hold,
				blocker: null,
				blockerSkill: false,
				armed: null
			}
		};
		return keep(marked);
	}
	if (card.id === "la-chan-phan-don") {
		if (!targetUid) return note(next, "Chọn một kẻ địch để phản đòn.");
		return rebound(next, targetUid);
	}
	if (card.id === "thu-hoi-quai-thu") {
		const owner = next.players[side];
		const fieldKept = owner.field.flatMap((mon) => mon && keptField(mon) ? [pileFromField(mon)] : []);
		const reserveKept = owner.reserve.filter((pile) => keptPile(pile));
		const caps = fieldKept.map((pile) => cardStars(pile.id, pile.saved?.level ?? 1));
		const monsterDeck = shuffle([
			...owner.monsterDeck,
			...reserveKept,
			...fieldKept
		]);
		const reserve = monsterDeck.splice(0, fieldKept.length + reserveKept.length);
		const deckTax = owner.spellTax ?? [];
		const mixed = shuffle([...owner.spellDeck.map((id, index) => ({
			id,
			tax: Boolean(deckTax[index])
		})), ...owner.hand.map((id, index) => ({
			id,
			tax: Boolean(handTolls(owner)[index])
		}))]);
		const handPairs = mixed.splice(0, owner.hand.length);
		const recalled = {
			...owner,
			field: [
				null,
				null,
				null
			],
			reserve,
			hand: handPairs.map((row) => row.id),
			tolls: handPairs.map((row) => row.tax),
			monsterDeck,
			spellDeck: mixed.map((row) => row.id),
			spellTax: mixed.map((row) => row.tax)
		};
		const marked = patch(next, side, recalled);
		const line = "Thu hồi quái và phép.";
		if (caps.length === 0) return note(marked, line, "spell");
		return note({
			...marked,
			recall: {
				side,
				caps
			}
		}, line, "spell");
	}
	return note(next, `${card.name} đã trả gem. Hiệu ứng đặc biệt chưa gắn hết.`, "spell");
}
function aimedId(state) {
	const pending = state.pending;
	if (pending?.kind === "melee" || pending?.kind === "gnaw") return state.hold?.blocker ?? pending.defender;
	if (pending?.kind === "face") return state.hold?.blocker ?? null;
	if (pending?.kind === "beam" || pending?.kind === "gnaw-skill" || pending?.kind === "spell") return pending.target ?? state.hold?.blocker ?? null;
	return state.hold?.blocker ?? null;
}
function redirectAim(state, fromUid, toUid) {
	if (!fromUid || !toUid || fromUid === toUid) return state;
	const pending = state.pending;
	let nextPending = pending;
	if (pending && (pending.kind === "melee" || pending.kind === "gnaw") && pending.defender === fromUid) nextPending = {
		...pending,
		defender: toUid
	};
	if (pending && (pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") && pending.target === fromUid) nextPending = {
		...pending,
		target: toUid
	};
	const hold = state.hold?.blocker === fromUid && state.hold ? {
		...state.hold,
		blocker: toUid
	} : state.hold;
	return {
		...state,
		pending: nextPending,
		hold
	};
}
function swapToken(player, token) {
	if (token.startsWith("f:")) {
		const uid = token.slice(2);
		return player.field.some((mon) => mon?.uid === uid) ? {
			kind: "field",
			uid
		} : null;
	}
	if (token.startsWith("r:")) {
		const index = Number(token.slice(2));
		return Number.isInteger(index) && player.reserve[index] ? {
			kind: "reserve",
			index
		} : null;
	}
	return null;
}
function canBring(player, cardId) {
	const card = monsterCard(cardId);
	if (!card || card.stars === 0) return false;
	if (cardId === "trieu-hoi-ac-ma") return player.stars >= 3;
	return player.stars >= card.stars;
}
function demonGate(player, held) {
	if (held.id !== "trieu-hoi-ac-ma") return {
		player,
		fresh: false
	};
	if (player.stars < 3) return "Cần ít nhất 3 sao.";
	if (player.stars !== 3 || held.saved?.seen) return {
		player,
		fresh: false
	};
	const paid = pay$1(player, 1);
	if (!paid) return "Cần 1 mana để ra sân.";
	return {
		player: paid,
		fresh: true
	};
}
function swapRows(player) {
	const tokens = [];
	for (const unit of player.field) if (unit && !unit.copy && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai") tokens.push(`f:${unit.uid}`);
	player.reserve.forEach((card, index) => {
		if (canBring(player, card.id)) tokens.push(`r:${index}`);
	});
	return tokens;
}
function lockedSwapToken(state, side) {
	const uid = aimedId(state);
	if (!uid) return null;
	const mon = state.players[side].field.find((unit) => unit?.uid === uid);
	if (!mon || mon.copy || mon.cardId === "chan-ken" || mon.cardId === "ken-ngai") return null;
	return `f:${uid}`;
}
function canCastSwap(state, side) {
	if (state.step !== "respond" || !state.pending) return false;
	const rows = swapRows(state.players[side]);
	const locked = lockedSwapToken(state, side);
	if (!locked) return rows.length >= 2;
	return rows.some((token) => token !== locked);
}
function confirmSwap(state, firstToken, secondToken) {
	if (!state.swap) return state;
	if (firstToken === secondToken) return note(state, "Chọn hai quái khác nhau.");
	const side = state.swap.side;
	const done = pickSwap({
		...state,
		swap: {
			first: firstToken,
			side
		}
	}, secondToken);
	if (done.swap) return {
		...done,
		swap: {
			first: null,
			side
		}
	};
	return done;
}
function pickSwap(state, token) {
	if (!state.swap) return state;
	const side = state.swap.side;
	const you = state.players[side];
	if (!swapToken(you, token)) return note(state, "Không đổi được quái này.");
	if (!state.swap.first) return {
		...state,
		swap: {
			first: token,
			side
		},
		live: "Chọn quái thứ hai."
	};
	if (state.swap.first === token) return note(state, "Chọn một quái khác.");
	const first = swapToken(you, state.swap.first);
	const second = swapToken(you, token);
	if (!first || !second) return {
		...state,
		swap: null
	};
	const field = [...you.field];
	const reserve = [...you.reserve];
	const takeField = (uid) => {
		const mon = field.find((unit) => unit?.uid === uid) ?? null;
		if (!mon || mon.copy || mon.cardId === "chan-ken" || mon.cardId === "ken-ngai") return null;
		return mon;
	};
	if (first.kind === "field" && second.kind === "field") {
		const a = field.findIndex((mon) => mon?.uid === first.uid);
		const b = field.findIndex((mon) => mon?.uid === second.uid);
		if (a < 0 || b < 0) return {
			...state,
			swap: null
		};
		const hold = field[a];
		field[a] = field[b];
		field[b] = hold;
		const aimed = aimedId(state);
		const other = aimed === first.uid ? second.uid : aimed === second.uid ? first.uid : null;
		return redirectAim(note(patch({
			...state,
			swap: null
		}, side, {
			...you,
			field,
			reserve
		}), "Hoán đổi xong.", "spell"), aimed, other);
	} else if (first.kind === "reserve" && second.kind === "reserve") {
		const hold = reserve[first.index];
		reserve[first.index] = reserve[second.index];
		reserve[second.index] = hold;
	} else {
		const board = first.kind === "field" ? first : second.kind === "field" ? second : null;
		const bench = first.kind === "reserve" ? first : second.kind === "reserve" ? second : null;
		const mon = board ? takeField(board.uid) : null;
		const card = bench ? reserve[bench.index] : void 0;
		if (!board || !bench || !mon || !card || !canBring(you, card.id)) return note(state, "Quái dự bị chưa đủ điều kiện triệu hồi.");
		const gate = demonGate(you, card);
		if (typeof gate === "string") return note(state, gate);
		const slot = field.findIndex((unit) => unit?.uid === mon.uid);
		const seq = state.seq + 1;
		const born = place({
			...state,
			seq
		}, side, card.id, card);
		if (!card.saved && card.id === "trieu-hoi-ac-ma" && you.stars === 3) born.pact = true;
		if (gate.fresh) born.seen = true;
		field[slot] = born;
		reserve[bench.index] = pileFromField(mon);
		const aimed = aimedId(state);
		return redirectAim(note(patch({
			...state,
			seq: seq + 1,
			swap: null
		}, side, {
			...gate.player,
			field,
			reserve
		}), "Hoán đổi quái trên sân với quái dự bị.", "spell"), aimed === mon.uid ? aimed : null, aimed === mon.uid ? born.uid : null);
	}
	return note(patch({
		...state,
		swap: null
	}, side, {
		...you,
		field,
		reserve
	}), "Hoán đổi xong.", "spell");
}
function flowerBite(state, foe, attackerUid, flowerUid, take, lead) {
	const side = 1 - foe;
	const you = state.players[side];
	const them = state.players[foe];
	const attacker = them.field.find((mon) => mon?.uid === attackerUid && mon.hp > 0) ?? null;
	const flower = you.field.find((mon) => mon?.uid === flowerUid && mon.hp > 0) ?? null;
	if (!attacker || !flower) return {
		...note(state, lead, "heal"),
		mends: take > 0 ? [{
			uid: flowerUid,
			n: take
		}] : null
	};
	const keptDim = attacker.dim;
	const hit = strikePair(withLegend(attacker), withLegend(flower), them.field, you.field, them.roster, you.roster);
	const awardA = bullAward(hit.attacker, flower.cardId, hit.defender.hp <= 0);
	const awardD = bullAward(hit.defender, attacker.cardId, hit.attacker.hp <= 0);
	const worn = combatErode(awardA.mon, awardD.mon, foe);
	const fed = withLeech(them.field, {
		...worn.attacker,
		dim: keptDim
	}, hit.bite, hit.surplus);
	let next = patch(state, foe, settleCocoon(dropDead({
		...them,
		field: fed.field
	})));
	next = patch(next, side, settleCocoon(dropDead({
		...next.players[side],
		field: next.players[side].field.map((mon) => mon?.uid === flower.uid ? worn.defender : mon)
	})));
	const soul = soulLeech(next, foe, attacker, hit.bite + hit.surplus);
	next = soul.state;
	const steal = lead.replace(`${cardOf(flower).name} `, "").replace(/\.+$/u, "");
	const noted = note(next, `${actNotice(cardOf(flower).name, [steal, `${cardOf(attacker).name} đánh thường vào ${cardOf(flower).name}`])}${hit.dodged ? " Thỏ đen tinh nghịch né đòn." : ""}${soul.line}`, "heal");
	const mends = [{
		uid: flower.uid,
		n: take
	}, ...[awardA, awardD].filter((row) => row.mend > 0 && row.mon.hp > 0).map((row) => ({
		uid: row.mon.uid,
		n: row.mend
	}))];
	return growSmash(releaseLegend({
		...noted,
		mends
	}), attacker.uid, attacker.cardId === "khong-lo-mot-mat");
}
function rainBombs(state, side, mon, primaryUid) {
	const foe = 1 - side;
	const you = state.players[side];
	const before = you.stars;
	const paid = pay$1(you, skillManaCost(mon.cardId, 1));
	if (!paid) return note(state, "Cần 1 gem.");
	const text = skillText(mon.cardId);
	const count = 5;
	const each = grabNums(text, /(\d+)\s*sát thương chuẩn/gi)[0] ?? 1;
	const chance = (grabNums(text, /(\d+)\s*%/gi)[0] ?? 50) / 100;
	const bombPlus = mon.skillUp ?? 0;
	let yourField = paid.field.map((unit) => unit?.uid === mon.uid ? {
		...unit,
		dim: true
	} : unit);
	let foeField = state.players[foe].field.map((unit) => unit);
	let foeHp = state.players[foe].hp;
	let total = 0;
	const hits = [];
	const vols = [];
	const tally = /* @__PURE__ */ new Map();
	const addHit = (key, name, n) => {
		const row = tally.get(key);
		if (row) row.n += n;
		else tally.set(key, {
			name,
			n
		});
	};
	const shotN = (shot) => each + (shot === 4 ? bombPlus : 0);
	const strikeMon = (field, uid, shot) => {
		const target = field.find((unit) => unit?.uid === uid && unit.hp > 0);
		if (!target) return field;
		const beforeHp = target.hp;
		const struck = trueDamage(target, outgoing(mon, shotN(shot)));
		const dealt = Math.max(0, beforeHp - struck.hp);
		hits.push(uid);
		vols.push(dealt);
		total += dealt;
		addHit(uid, cardOf(target).name, dealt);
		return field.map((unit) => unit?.uid === uid ? struck : unit);
	};
	for (let shot = 0; shot < count; shot += 1) {
		if (Math.random() < chance) {
			if (!primaryUid) {
				const n = outgoing(mon, shotN(shot)) + charmDamage;
				foeHp -= n;
				total += n;
				hits.push(`face:${foe}`);
				vols.push(n);
				addHit("face", "người chơi", n);
			} else if (yourField.some((unit) => unit?.uid === primaryUid)) yourField = strikeMon(yourField, primaryUid, shot);
			else foeField = strikeMon(foeField, primaryUid, shot);
			continue;
		}
		const options = [];
		for (const unit of foeField) if (unit && unit.hp > 0 && unit.uid !== primaryUid) options.push({ uid: unit.uid });
		if (primaryUid) options.push({ face: true });
		if (options.length === 0) continue;
		const pick = options[Math.floor(Math.random() * options.length)];
		if ("face" in pick) {
			const n = outgoing(mon, shotN(shot)) + charmDamage;
			foeHp -= n;
			total += n;
			hits.push(`face:${foe}`);
			vols.push(n);
			addHit("face", "người chơi", n);
		} else foeField = strikeMon(foeField, pick.uid, shot);
	}
	let next = pingStars(patch(state, side, dropDead({
		...paid,
		field: yourField
	})), side, before, paid.stars);
	next = patch(next, foe, dropDead({
		...next.players[foe],
		field: foeField,
		hp: foeHp
	}));
	const bombRows = [...tally.values()].map((row) => ({
		name: row.name,
		bits: `${row.n} sát thương chuẩn`
	}));
	const bombLine = aimNotice(castName(mon.cardId, 0), bombRows);
	return checkWinner({
		...note(next, bombLine ?? `${cardOf(mon).name} gây ${total} sát thương chuẩn.`, "spell"),
		skill: {
			id: mon.cardId,
			index: 0,
			aim: primaryUid,
			hits,
			vols
		}
	});
}
var REEL_FACES = [
	"seven",
	"atk",
	"def",
	"hp",
	"six"
];
function gunHits(extra) {
	if (extra == null) return null;
	if (extra === "none") return [];
	return extra.split(",").filter((face) => face === "phys" || face === "spell" || face === "tru");
}
function openGunReel(state, uid) {
	return pullReel({
		...state,
		reel: {
			id: state.seq + 1,
			uid,
			kind: "gun",
			order: shuffle([
				"phys",
				"spell",
				"tru"
			]),
			faces: null,
			phase: "wait"
		}
	});
}
function grantAtk(mon, n) {
	return {
		...mon,
		atk: mon.atk + n,
		raised: markRaised(mon, { atk: n })
	};
}
function smashPlain(mon) {
	return mon.cardId === "khong-lo-mot-mat" && !mon.horn && !mon.gaze && !mon.bolt;
}
function swordSwing(mon) {
	return mon.cardId === KING && !mon.horn && !mon.gaze && !mon.bolt;
}
function dullSword(mon) {
	const raised = mon.raised ?? {
		atk: 0,
		def: 0,
		mdef: 0,
		hp: 0
	};
	const next = {
		...raised,
		atk: Math.max(0, raised.atk - 5)
	};
	const clear = next.atk === 0 && next.def === 0 && next.mdef === 0 && next.hp === 0;
	return {
		...mon,
		atk: Math.max(0, mon.atk - 5),
		raised: clear ? void 0 : next,
		edge: void 0
	};
}
function stackAct(state, extra) {
	const raw = state.live ?? "";
	const head = /^(\d+)\.\s*/u.exec(raw);
	const body = (head ? raw.slice(head[0].length) : raw).trim();
	const add = extra.replace(/^[-•]\s*/u, "").replace(/[.。]+$/u, "").trim();
	const prefix = head ? `${head[1]}. ` : "";
	const text = body.includes("\n") ? `${prefix}${body}\n- ${add}.` : `${prefix}- ${body.replace(/^[-•]\s*/u, "").replace(/[.。]+$/u, "").trim()}.\n- ${add}.`;
	const log = state.log.length ? [...state.log.slice(0, -1), text] : [text];
	return {
		...state,
		live: text,
		log
	};
}
function swingSword(state, uid, allow) {
	if (!allow || !uid) return state;
	const side = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid && unit.hp > 0) ?? null;
	if (!mon || mon.cardId !== KING) return state;
	const nextMon = mon.edge ? dullSword(mon) : {
		...grantAtk(mon, 5),
		edge: true
	};
	const field = you.field.map((unit) => unit?.uid === uid ? nextMon : unit);
	return stackAct(patch(state, side, {
		...you,
		field
	}), mon.edge ? `${cardOf(mon).name} trả thanh gươm về ban đầu.` : `${cardOf(mon).name} mài sắc thanh gươm, +5 công.`);
}
function growSmash(state, uid, allow) {
	if (!allow || !uid) return state;
	const side = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid && unit.hp > 0) ?? null;
	if (!mon || mon.cardId !== "khong-lo-mot-mat") return state;
	const grown = grantAtk(mon, 1);
	const field = you.field.map((unit) => unit?.uid === uid ? grown : unit);
	return stackAct(patch(state, side, {
		...you,
		field
	}), `${cardOf(mon).name} dùng Đập phá, tăng 1 công vĩnh viễn.`);
}
function grantWard(mon, n) {
	if (mon.cage) return mon;
	return {
		...mon,
		def: mon.def + n,
		mdef: mon.mdef + n,
		raised: markRaised(mon, {
			def: n,
			mdef: n
		})
	};
}
function healBank(mon, n) {
	const cap = mon.maxHp || mon.hp;
	const room = Math.max(0, cap - mon.hp);
	if (mon.cage) return {
		...mon,
		hp: mon.hp + Math.min(n, room)
	};
	const spill = Math.max(0, n - room);
	return {
		...mon,
		hp: mon.hp + Math.min(n, room) + spill,
		maxHp: cap + spill,
		raised: spill > 0 ? markRaised(mon, { hp: spill }) : mon.raised
	};
}
function grantMax(mon, n) {
	if (mon.cage) return mon;
	return {
		...mon,
		maxHp: (mon.maxHp || mon.hp) + n,
		raised: markRaised(mon, { hp: n })
	};
}
function reelPrize(faces) {
	const counts = /* @__PURE__ */ new Map();
	for (const face of faces) counts.set(face, (counts.get(face) ?? 0) + 1);
	let best = null;
	for (const [face, count] of counts) {
		if (count < 2) continue;
		const rank = count >= 3 ? 3 : 2;
		if (!best || rank > best.rank) best = {
			face,
			rank
		};
	}
	return best;
}
function payReel(mon, faces) {
	const prize = reelPrize(faces);
	if (!prize) return {
		mon: {
			...mon,
			misses: (mon.misses ?? 0) + 1
		},
		line: "Quay trượt.",
		tone: "info"
	};
	const hot = prize.rank === 3;
	if (prize.face === "six") {
		if (hot) return {
			mon: {
				...mon,
				hp: 0
			},
			line: "3 số 6, tự hủy.",
			tone: "hit"
		};
		const hp = mon.hp - 2;
		return {
			mon: hp > 0 ? {
				...mon,
				hp
			} : {
				...mon,
				hp: 0
			},
			line: "2 số 6, mất 2 máu.",
			tone: "hit"
		};
	}
	let next = mon;
	if (prize.face === "atk" || prize.face === "seven") next = grantAtk(next, hot ? 4 : 2);
	if (prize.face === "def" || prize.face === "seven") next = grantWard(next, hot ? 2 : 1);
	if (prize.face === "hp" || prize.face === "seven") {
		const wasFull = next.hp >= (next.maxHp || next.hp);
		next = healBank(next, 3);
		if (hot) {
			next = grantMax(next, 3);
			if (wasFull) next = {
				...next,
				hp: next.maxHp || next.hp
			};
		}
	}
	if (prize.face === "seven") return {
		mon: next,
		line: hot ? "3 số 7, nhận hết hiệu ứng cường hoá." : "2 số 7, nhận hết hiệu ứng có lợi.",
		tone: "heal"
	};
	if (prize.face === "atk") return {
		mon: next,
		line: hot ? "3 công, +4 công." : "2 công, +2 công.",
		tone: "heal"
	};
	if (prize.face === "def") return {
		mon: next,
		line: hot ? "3 thủ, +2 phòng ngự." : "2 thủ, +1 phòng ngự.",
		tone: "heal"
	};
	return {
		mon: next,
		line: hot ? "3 máu, hồi 3 và +3 máu tối đa." : "2 máu, hồi 3.",
		tone: "heal"
	};
}
function startReel(state, uid) {
	if (state.step !== "main" || state.winner || state.reel) return state;
	const mon = state.players[state.turn].field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== "may-quay-thuong" || held(mon)) return state;
	if (mon.stun > 0 || (mon.chain ?? 0) > 0 || (mon.path ?? 0) > 0) return note(state, "Đang không quay được.");
	if (mon.spun) return note(state, "Lượt này đã quay.");
	return {
		...state,
		reel: {
			id: state.seq + 1,
			uid,
			faces: null,
			phase: "wait"
		}
	};
}
function pullReel(state) {
	const next = pullReelCore(state);
	if (next === state) return next;
	const mon = state.players[state.turn].field.find((unit) => unit?.uid === state.reel?.uid) ?? null;
	const ok = next.reel?.phase === "spin";
	if (!ok && next.players === state.players && next.reel === state.reel) return next;
	return traced(state, next, {
		kind: "reel",
		actor: state.turn,
		ok,
		cardId: mon?.cardId ?? null,
		target: null,
		end: null
	});
}
function pullReelCore(state) {
	const reel = state.reel;
	if (!reel || reel.phase !== "wait" || state.step !== "main" || state.winner) return state;
	if (reel.kind === "gun") return pullGun(state);
	const side = state.turn;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === reel.uid && unit.cardId === "may-quay-thuong") ?? null;
	if (!mon || mon.spun) return {
		...state,
		reel: null
	};
	const faces = [
		0,
		1,
		2
	].map(() => REEL_FACES[Math.floor(Math.random() * REEL_FACES.length)]);
	const field = you.field.map((unit) => unit?.uid === mon.uid ? {
		...unit,
		spun: true
	} : unit);
	return {
		...patch(state, side, {
			...you,
			field
		}),
		reel: {
			...reel,
			faces,
			phase: "spin"
		}
	};
}
function settleReel(state) {
	const next = settleReelCore(state);
	if (next === state) return next;
	return withResults(state, next, {
		blocked: false,
		reflect: false,
		turn: false
	});
}
function settleReelCore(state) {
	const reel = state.reel;
	if (!reel || reel.phase !== "spin" || !reel.faces) return {
		...state,
		reel: null
	};
	if (reel.kind === "gun") return settleGun(state);
	const side = state.turn;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === reel.uid) ?? null;
	if (!mon) return {
		...state,
		reel: null
	};
	const paid = payReel(mon, reel.faces);
	const field = you.field.map((unit) => unit?.uid === mon.uid ? paid.mon : unit);
	return note(patch({
		...state,
		reel: null
	}, side, dropDead({
		...you,
		field
	})), paid.line, paid.tone);
}
function pullGun(state) {
	const reel = state.reel;
	if (!reel || reel.kind !== "gun" || !reel.order) return {
		...state,
		reel: null
	};
	const mon = state.players[state.turn].field.find((unit) => unit?.uid === reel.uid && unit.cardId === "thuong-quan-long") ?? null;
	if (!mon) return {
		...state,
		reel: null
	};
	const chance = (grabNums(skillText(mon.cardId), /(\d+)\s*%/gi)[0] ?? 45) / 100;
	const faces = reel.order.map((gun) => Math.random() < chance ? gun : "blank");
	return {
		...state,
		reel: {
			...reel,
			faces,
			phase: "spin"
		}
	};
}
function settleGun(state) {
	const reel = state.reel;
	if (!reel?.faces) return {
		...state,
		reel: null
	};
	const hits = reel.faces.filter((face) => face === "phys" || face === "spell" || face === "tru");
	const uid = reel.uid;
	return useSkill({
		...state,
		reel: null
	}, uid, null, 0, true, hits.length ? hits.join(",") : "none", true);
}
var GIRL = "my-dieu-nhan";
var QUEEN = "nu-chua-dieu-nhan";
var PRINCESS = "cong-chua-dieu-nhan";
function isHarpy(id) {
	return id === GIRL || id === QUEEN;
}
function harpyKit(id) {
	if (id === QUEEN) return {
		armor: 2,
		gust: 0,
		charm: 0,
		lash: 1,
		def: 0,
		mdef: 3,
		hp: 3,
		atk: 1
	};
	return {
		armor: 2,
		gust: 1,
		charm: 0,
		lash: 2,
		def: 2,
		mdef: 0,
		hp: 2,
		atk: 3
	};
}
function shedOf(mon) {
	return mon.shed ?? [];
}
function growHarpy(mon, part, key) {
	const atk = part.atk ?? 0;
	const def = part.def ?? 0;
	const mdef = part.mdef ?? 0;
	const hp = part.hp ?? 0;
	const maxHp = (mon.maxHp || mon.hp) + hp;
	return {
		...mon,
		atk: mon.atk + atk,
		def: mon.def + def,
		mdef: mon.mdef + mdef,
		maxHp,
		hp: mon.hp + hp,
		raised: markRaised(mon, {
			atk,
			def,
			mdef,
			hp
		}),
		shed: [...shedOf(mon), key]
	};
}
function banDraw(player) {
	return {
		...player,
		drawBan: (player.drawBan ?? 0) + 1
	};
}
function becomePerfect(state, side, uid) {
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid && unit.cardId === QUEEN && unit.hp > 0) ?? null;
	const card = monsterCard(PERFECT);
	if (!mon || !card || shedOf(mon).length < 4 || (mon.acts ?? 0) < 2) return state;
	const born = {
		...mon,
		cardId: card.id,
		atk: card.atk,
		def: card.def,
		mdef: card.mdef,
		hp: card.hp,
		maxHp: card.hp,
		level: 1,
		raised: void 0,
		shed: [],
		lure: void 0,
		acts: 0,
		debt: void 0,
		bolt: void 0
	};
	const field = you.field.map((unit) => unit?.uid === mon.uid ? born : unit);
	return note(patch(state, side, {
		...you,
		field
	}), `${cardOf(mon).name} tiến hoá thành ${card.name}.`, "heal");
}
function sealHarpy(state, side, uid, line, tone) {
	const mon = state.players[side].field.find((unit) => unit?.uid === uid) ?? null;
	let text = line;
	const ripe = Boolean(mon && mon.cardId === QUEEN && shedOf(mon).length >= 4 && (mon.acts ?? 0) >= 2);
	if (mon?.cardId === GIRL && shedOf(mon).length >= 4) text += " Hãy chọn Công chúa điểu nhân hoặc Nữ chúa điểu nhân.";
	const noted = note(state, text, tone);
	if (mon?.cardId === GIRL && shedOf(mon).length >= 4) return {
		...noted,
		birdAsk: { uid }
	};
	if (ripe) return becomePerfect(noted, side, uid);
	return noted;
}
function markQueenAct(state, side, uid) {
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== QUEEN) return {
		state,
		extra: ""
	};
	const before = mon.acts ?? 0;
	const nextMon = {
		...mon,
		acts: before + 1
	};
	return {
		state: patch(state, side, {
			...you,
			field: you.field.map((unit) => unit?.uid === uid ? nextMon : unit)
		}),
		extra: ""
	};
}
function harpyBird(state, side, uid) {
	if (!uid) return null;
	return state.players[side].field.find((unit) => unit?.uid === uid && unit.hp > 0 && isHarpy(unit.cardId)) ?? null;
}
function harpyOffer(state, side) {
	if (state.step !== "respond" || state.hold?.priority !== side || !state.pending) return null;
	const owner = state.players[side];
	const pending = state.pending;
	if (pending.kind === "melee") {
		const bird = harpyBird(state, side, state.hold.blocker ?? pending.defender);
		if (bird && !shedOf(bird).includes("lash") && owner.orb >= harpyKit(bird.cardId).lash) return "lash";
		return null;
	}
	const bird = harpyBird(state, side, pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.target : pending.kind === "spell" ? pending.target : null);
	if (bird && !shedOf(bird).includes("armor") && owner.orb >= harpyKit(bird.cardId).armor) return "armor";
	return null;
}
function harpyWard(state) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => harpyWard(next));
	if (harpyOffer(state, state.hold?.priority ?? state.turn) !== "armor" || !state.hold || !state.pending) return state;
	const side = state.hold.priority;
	const pending = state.pending;
	const uid = pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.target : pending.kind === "spell" ? pending.target : null;
	const you = state.players[side];
	const bird = harpyBird(state, side, uid);
	const kit = bird ? harpyKit(bird.cardId) : null;
	const paid = bird && kit ? pay$1(you, kit.armor) : null;
	if (!bird || !kit || !paid) return note(state, "Cần 2 mana.");
	const grown = growHarpy(bird, {
		def: kit.def,
		mdef: kit.mdef,
		hp: kit.hp
	}, "armor");
	const field = paid.field.map((unit) => unit?.uid === bird.uid ? grown : unit);
	let what = "đòn";
	if (pending.kind === "spell") what = spellCard(pending.cardId)?.name ?? "phép";
	else if (pending.kind === "beam" || pending.kind === "gnaw-skill") what = castName((state.players[0].field.find((unit) => unit?.uid === pending.caster) ?? state.players[1].field.find((unit) => unit?.uid === pending.caster))?.cardId ?? "", pending.index);
	const gain = kit.mdef > 0 ? `tăng vĩnh viễn ${kit.mdef} thủ phép và ${kit.hp} máu` : `tăng vĩnh viễn ${kit.def} thủ và ${kit.hp} máu`;
	const line = actNotice("Giáp và Vuốt", [
		`huỷ ${what} nhắm vào ${cardOf(bird).name}`,
		gain,
		"lượt sau không được rút bài"
	]);
	return {
		...sealHarpy(patch(state, side, banDraw({
			...paid,
			field
		})), side, bird.uid, line, "spell"),
		step: "main",
		pending: null,
		hold: null
	};
}
function openLash(state, owner, bird, foe, stun, line) {
	const noted = note(state, line, "spell");
	const foeSide = 1 - owner;
	return {
		...noted,
		step: "respond",
		pending: {
			kind: "lash",
			owner,
			bird,
			foe,
			stun
		},
		hold: {
			priority: foeSide,
			passed: [false, false],
			blocker: null,
			blockerSkill: false,
			armed: null
		}
	};
}
function finishLash(state) {
	const pending = state.pending;
	if (!pending || pending.kind !== "lash") return state;
	const owner = pending.owner;
	const foe = 1 - owner;
	const you = state.players[owner];
	const them = state.players[foe];
	const bird = you.field.find((unit) => unit?.uid === pending.bird) ?? null;
	const attacker = them.field.find((unit) => unit?.uid === pending.foe && unit.hp > 0) ?? null;
	const open = {
		...state,
		step: "main",
		pending: null,
		hold: null
	};
	if (!bird || !attacker) return bird ? sealHarpy(open, owner, bird.uid, open.live, "spell") : open;
	const burned = damageSpell(attacker, 5, them.field, bird);
	const dealt = spellLanded(attacker, 5, them.field, bird);
	const hit = burned.hp > 0 ? {
		...burned,
		dim: true,
		stun: pending.stun ? Math.max(burned.stun, 2) : burned.stun
	} : burned;
	const next = patch(open, foe, dropDead({
		...them,
		field: them.field.map((unit) => unit?.uid === attacker.uid ? hit : unit)
	}));
	const bits = [`gây ${dealt} sát thương phép lên ${cardOf(attacker).name}`];
	if (pending.stun) bits.push(`${cardOf(attacker).name} không thể hành động ở lượt sau`);
	return sealHarpy(next, owner, bird.uid, actNotice("Roi điện", bits), "spell");
}
function harpyLash(state) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => harpyLash(next));
	if (harpyOffer(state, state.hold?.priority ?? state.turn) !== "lash" || !state.hold || state.pending?.kind !== "melee") return state;
	const side = state.hold.priority;
	const pending = state.pending;
	const uid = state.hold.blocker ?? pending.defender;
	const you = state.players[side];
	const bird = harpyBird(state, side, uid);
	const kit = bird ? harpyKit(bird.cardId) : null;
	const atkSide = state.turn === side ? 1 - side : state.turn;
	const them = state.players[atkSide];
	const attacker = them.field.find((unit) => unit?.uid === pending.attacker) ?? null;
	const paid = bird && kit ? pay$1(you, kit.lash) : null;
	if (!bird || !kit || !attacker || !paid) return note(state, kit?.lash === 1 ? "Cần 1 mana." : "Cần 2 mana.");
	const grown = growHarpy(bird, { atk: kit.atk }, "lash");
	let next = patch(state, side, banDraw({
		...paid,
		field: paid.field.map((unit) => unit?.uid === bird.uid ? grown : unit)
	}));
	const marked = them.field.map((unit) => unit?.uid === attacker.uid ? {
		...unit,
		dim: true
	} : unit);
	next = patch(next, atkSide, {
		...them,
		field: marked
	});
	const line = actNotice("Roi điện", [
		`né đòn của ${cardOf(attacker).name}`,
		`tăng vĩnh viễn ${kit.atk} công`,
		"đang thi triển",
		"lượt sau không được rút bài"
	]);
	return openLash(next, side, bird.uid, attacker.uid, false, line);
}
function charmStrike(state, birdUid, foeUid) {
	const side = state.turn;
	const foe = 1 - side;
	const you = state.players[side];
	const them = state.players[foe];
	const bird = you.field.find((unit) => unit?.uid === birdUid) ?? null;
	const attacker = them.field.find((unit) => unit?.uid === foeUid && unit.hp > 0) ?? null;
	if (!bird || !attacker) return note(state, "Không còn quái để mê hoặc.");
	const hit = strikePair(withLegend(attacker), withLegend(bird), them.field, you.field, them.roster, you.roster);
	const stunned = hit.attacker.hp > 0 ? {
		...hit.attacker,
		dim: true,
		stun: Math.max(hit.attacker.stun, 2)
	} : hit.attacker;
	let next = patch(state, foe, dropDead({
		...them,
		field: them.field.map((unit) => unit?.uid === attacker.uid ? stunned : unit)
	}));
	next = patch(next, side, dropDead({
		...you,
		field: you.field.map((unit) => unit?.uid === bird.uid ? hit.defender : unit)
	}));
	return growSmash(sealHarpy(next, side, bird.uid, actNotice("Mê hoặc", [
		`${cardOf(attacker).name} đánh thường vào ${cardOf(bird).name}`,
		`${cardOf(attacker).name} không thể hành động ở lượt sau`,
		"lượt sau không được rút bài"
	]), "hit"), attacker.uid, attacker.cardId === "khong-lo-mot-mat");
}
function answerPlume(state, yes) {
	const ask = state.plumeAsk;
	if (!ask) return state;
	const cleared = {
		...state,
		plumeAsk: null
	};
	if (!yes) return charmStrike(cleared, ask.bird, ask.foe);
	const side = cleared.turn;
	const foe = 1 - side;
	const you = cleared.players[side];
	const them = cleared.players[foe];
	const bird = you.field.find((unit) => unit?.uid === ask.bird && isHarpy(unit.cardId)) ?? null;
	const kit = bird ? harpyKit(bird.cardId) : null;
	const attacker = them.field.find((unit) => unit?.uid === ask.foe && unit.hp > 0) ?? null;
	const paid = bird && kit && !shedOf(bird).includes("lash") ? pay$1(you, kit.lash) : null;
	if (!bird || !kit || !attacker || !paid) return charmStrike(cleared, ask.bird, ask.foe);
	const grown = growHarpy(bird, { atk: kit.atk }, "lash");
	let next = patch(cleared, side, banDraw({
		...paid,
		field: paid.field.map((unit) => unit?.uid === bird.uid ? grown : unit)
	}));
	const marked = them.field.map((unit) => unit?.uid === attacker.uid ? {
		...unit,
		dim: true
	} : unit);
	next = patch(next, foe, {
		...them,
		field: marked
	});
	const line = actNotice("Roi điện", [
		`né đòn của ${cardOf(attacker).name}`,
		`tăng vĩnh viễn ${kit.atk} công`,
		"đang thi triển",
		`${cardOf(attacker).name} không thể hành động ở lượt sau`,
		"lượt sau không được rút bài"
	]);
	return openLash(next, side, bird.uid, attacker.uid, true, line);
}
function evolveBird(state, formId) {
	const ask = state.birdAsk;
	if (!ask) return state;
	if (formId !== QUEEN && formId !== PRINCESS) return state;
	const card = monsterCard(formId);
	if (!card) return note(state, `${formId === PRINCESS ? "Công chúa điểu nhân" : "Nữ chúa điểu nhân"} sẽ bổ sung sau.`);
	const side = state.players[0].field.some((mon) => mon?.uid === ask.uid) ? 0 : 1;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === ask.uid && unit.cardId === GIRL) ?? null;
	if (!mon) return {
		...state,
		birdAsk: null
	};
	const born = {
		...mon,
		cardId: card.id,
		atk: card.atk,
		def: card.def,
		mdef: card.mdef,
		hp: card.hp,
		maxHp: card.hp,
		level: 1,
		raised: void 0,
		shed: [],
		lure: void 0,
		acts: 0
	};
	const field = you.field.map((unit) => unit?.uid === mon.uid ? born : unit);
	return note(patch({
		...state,
		birdAsk: null
	}, side, {
		...you,
		field
	}), `${cardOf(mon).name} tiến hoá thành ${card.name}.`, "heal");
}
function castHarpy(state, side, mon, skillIndex, targetUid) {
	const you = state.players[side];
	const foe = 1 - side;
	const kit = harpyKit(mon.cardId);
	const spent = shedOf(mon);
	if (skillIndex === 0) {
		if (spent.includes("gust")) return note(state, "Thổi bay đã biến mất.");
		const paid = pay$1(you, kit.gust);
		if (!paid) return note(state, "Cần 1 mana.");
		const hand = [...state.players[foe].hand];
		const spells = hand.map((id, index) => ({
			id,
			index
		})).filter((row) => spellCard(row.id) && !spellCard(row.id)?.env);
		if (spells.length === 0) return note(state, "Đối thủ không có phép trên tay.");
		const pick = spells[Math.floor(Math.random() * spells.length)];
		hand.splice(pick.index, 1);
		const tolls = handTolls(state.players[foe]).filter((_, index) => index !== pick.index);
		const grown = {
			...mon,
			dim: true,
			shed: [...spent, "gust"]
		};
		const field = paid.field.map((unit) => unit?.uid === mon.uid ? grown : unit);
		let next = patch(state, side, banDraw({
			...paid,
			field
		}));
		next = patch(next, foe, {
			...state.players[foe],
			hand,
			tolls
		});
		return sealHarpy(next, side, mon.uid, actNotice("Thổi bay", [`huỷ ${spellCard(pick.id)?.name ?? "1 phép"} trên tay đối thủ`, "lượt sau không được rút bài"]), "spell");
	}
	if (spent.includes("charm")) return note(state, "Mê hoặc đã biến mất.");
	const target = state.players[foe].field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
	if (!target) return note(state, "Chọn một quái đối thủ.");
	const paid = pay$1(you, kit.charm);
	if (!paid) return note(state, "Cần 1 mana.");
	const grown = {
		...mon,
		dim: true,
		shed: [...spent, "charm"]
	};
	const field = paid.field.map((unit) => unit?.uid === mon.uid ? grown : unit);
	const next = patch(state, side, banDraw({
		...paid,
		field
	}));
	const owner = next.players[side];
	const still = owner.field.find((unit) => unit?.uid === mon.uid) ?? grown;
	if (!shedOf(still).includes("lash") && owner.orb >= harpyKit(still.cardId).lash) return note({
		...next,
		plumeAsk: {
			bird: mon.uid,
			foe: target.uid
		}
	}, `${cardOf(mon).name} mê hoặc ${cardOf(target).name}. Dùng Roi điện để né?`, "info");
	return charmStrike(next, mon.uid, target.uid);
}
function castLure(state, side, mon, foeUid, allyUid) {
	const you = state.players[side];
	const foe = 1 - side;
	const enemy = state.players[foe].field.find((unit) => unit?.uid === foeUid && unit.hp > 0) ?? null;
	const ally = you.field.find((unit) => unit?.uid === allyUid && unit.hp > 0) ?? null;
	if (!enemy || !ally) return note(state, "Chọn quái địch và quái của ta.");
	const paid = mon.cardId !== PERFECT && !mon.lure ? pay$1(you, 2) : you;
	if (!paid) return note(state, "Cần 2 mana.");
	const before = mon.acts ?? 0;
	const grown = {
		...mon,
		dim: true,
		lure: true,
		acts: before + 1
	};
	const field = paid.field.map((unit) => unit?.uid === mon.uid ? grown : unit);
	let next = patch(state, side, {
		...paid,
		field
	});
	const owner = next.players[side];
	const foeNow = next.players[foe];
	const attacker = foeNow.field.find((unit) => unit?.uid === enemy.uid) ?? enemy;
	const defender = owner.field.find((unit) => unit?.uid === ally.uid) ?? ally;
	const hit = strikePair(withLegend(attacker), withLegend(defender), foeNow.field, owner.field, foeNow.roster, owner.roster);
	const swung = hit.attacker.hp > 0 ? {
		...hit.attacker,
		dim: false,
		stun: 0
	} : hit.attacker;
	next = patch(next, foe, dropDead({
		...foeNow,
		field: foeNow.field.map((unit) => unit?.uid === attacker.uid ? swung : unit)
	}));
	next = patch(next, side, dropDead({
		...owner,
		field: owner.field.map((unit) => unit?.uid === defender.uid ? hit.defender : unit)
	}));
	const text = actNotice("Dụ dỗ", [`${cardOf(grown).name} dụ dỗ ${cardOf(attacker).name}`, `${cardOf(attacker).name} sáp lá cà với ${cardOf(defender).name}`]);
	return growSmash(becomePerfect(note(next, text, "hit"), side, mon.uid), attacker.uid, attacker.cardId === "khong-lo-mot-mat");
}
function castPerfect(state, side, mon, skillIndex, targetUid, extra) {
	const you = state.players[side];
	const foe = 1 - side;
	if (skillIndex === 3) return castLure(state, side, mon, extra, targetUid);
	if (skillIndex === 2) {
		if (mon.bolt) return note(state, "Roi sấm đã nạp cho đòn tiếp theo.");
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 mana.");
		const field = paid.field.map((unit) => unit?.uid === mon.uid ? {
			...unit,
			bolt: true
		} : unit);
		return note(patch(state, side, {
			...paid,
			field
		}), `${cardOf(mon).name} nạp Roi sấm. Đòn đánh tiếp theo là sát thương phép.`, "spell");
	}
	const hand = [...state.players[foe].hand];
	const spells = hand.map((id, index) => ({
		id,
		index
	})).filter((row) => spellCard(row.id) && !spellCard(row.id)?.env);
	let next = patch(state, side, banDraw(you));
	if (spells.length === 0) return note(next, actNotice("Gió xoáy", ["đối thủ không có phép trên tay", "lượt sau không được rút bài"]), "spell");
	const pick = spells[Math.floor(Math.random() * spells.length)];
	hand.splice(pick.index, 1);
	const tolls = handTolls(state.players[foe]).filter((_, index) => index !== pick.index);
	next = patch(next, foe, {
		...state.players[foe],
		hand,
		tolls
	});
	return note(next, actNotice("Gió xoáy", [`thổi bay ${spellCard(pick.id)?.name ?? "1 phép"}`, "lượt sau không được rút bài"]), "spell");
}
function aidSpent(before, after) {
	if (after === before) return false;
	if (after.winner !== before.winner || after.pending !== before.pending || after.reel !== before.reel) return true;
	for (const side of [0, 1]) {
		const left = before.players[side];
		const right = after.players[side];
		if (left.hp !== right.hp || left.orb !== right.orb || left.stars !== right.stars) return true;
		for (let slot = 0; slot < 3; slot += 1) {
			const a = left.field[slot];
			const b = right.field[slot];
			if (!a && !b) continue;
			if (!a || !b || a.uid !== b.uid || a.hp !== b.hp || a.dim !== b.dim) return true;
		}
	}
	return false;
}
function dropAid(state, uid) {
	for (const side of [0, 1]) {
		const you = state.players[side];
		if (!you.field.some((mon) => mon?.uid === uid)) continue;
		const field = you.field.map((mon) => mon?.uid === uid ? spendBless(mon) : mon);
		return patch(state, side, {
			...you,
			field
		});
	}
	return state;
}
function queenSwing(mon) {
	const n = mon.beat === 1 ? 2 : 1;
	const line = skillText(QUEEN_KNIGHT).split("\n").find((row) => new RegExp(`Lần\\s*${n}\\b`, "i").test(row)) ?? "";
	const cost = /tiêu(?:\s*hao)?\s*(\d+)\s*mana/i.exec(line);
	const phys = /(\d+)\s*sát thương vật lý/i.exec(line);
	const spell = /(\d+)\s*sát thương phép/i.exec(line);
	const tru = /(\d+)\s*sát thương chuẩn/i.exec(line);
	return {
		n,
		cost: cost ? Number(cost[1]) : n === 1 ? 0 : 1,
		pack: {
			phys: phys ? Number(phys[1]) : n === 1 ? 1 : 3,
			spell: spell ? Number(spell[1]) : n === 1 ? 1 : 3,
			tru: tru ? Number(tru[1]) : n === 1 ? 0 : 1
		}
	};
}
function strikeQueenSword(state, ownerSide, mon, victimSide, victim) {
	const you = state.players[ownerSide];
	const swing = queenSwing(mon);
	const before = you.stars;
	const paid = pay$1(you, swing.cost);
	if (!paid) return note(state, "Cần 1 mana.");
	const charm = charmDamage > 0 ? charmDamage : mon.blessDmg ?? 0;
	const releaseHex = bindSkillHex(mon);
	const shaved = shaveHex(mon, {
		phys: swing.pack.phys + (swing.pack.phys > 0 ? charm : 0),
		spell: swing.pack.spell + (swing.pack.spell > 0 ? charm : 0),
		tru: swing.pack.tru + (swing.pack.tru > 0 ? charm : 0)
	});
	const shot = {
		phys: outgoing(mon, shaved.phys),
		spell: outgoing(mon, shaved.spell),
		tru: outgoing(mon, shaved.tru)
	};
	releaseHex();
	const them = state.players[victimSide];
	const pool = phantomPool(victim, them.field);
	const landed = landHell(victim, shot, them.field);
	const beat = swing.n === 1 ? 1 : 0;
	const spentBody = victim.uid === mon.uid ? {
		...landed.mon,
		dim: true,
		beat
	} : landed.mon;
	const casterBody = victim.uid === mon.uid ? spentBody : {
		...mon,
		dim: true,
		beat
	};
	const write = (field) => field.map((unit) => {
		if (!unit) return unit;
		if (unit.uid === victim.uid) return spentBody;
		if (unit.uid === mon.uid) return casterBody;
		return unit;
	});
	let next = pingStars(patch(state, ownerSide, {
		...paid,
		field: write(paid.field)
	}), ownerSide, before, paid.stars);
	if (victimSide !== ownerSide) next = patch(next, victimSide, dropDead({
		...them,
		field: write(them.field)
	}));
	else next = patch(next, ownerSide, dropDead({
		...next.players[ownerSide],
		field: next.players[ownerSide].field
	}));
	return note(next, actNotice(castName(mon.cardId, 0), hellLine(landed.taken, cardOf(victim).name, landed.broke, victim, them.field, pool)), "spell");
}
function useSkill(state, uid, targetUid, skillIndex = 0, skipGnaw = false, extra = null, silent = false) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => useSkill(next, uid, targetUid, skillIndex, skipGnaw, extra, silent));
	const caster = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
	const bonus = caster?.blessDmg ?? 0;
	const previous = charmDamage;
	const previousHex = skillHex;
	charmDamage = bonus;
	skillHex = caster?.hex && caster.hex.left > 0 ? {
		uid: caster.uid,
		left: 3,
		clips: []
	} : null;
	try {
		const result = castSkill(state, uid, targetUid, skillIndex, skipGnaw, extra);
		const armed = caster && ((caster.blessAtk ?? 0) > 0 || (caster.blessDmg ?? 0) > 0 || (caster.nextDef ?? 0) > 0) && aidSpent(state, result) ? dropAid(result, caster.uid) : result;
		const tided = tideSkill(state, !caster || armed.fx === state.fx ? armed : {
			...armed,
			skill: {
				id: caster.cardId,
				index: skillIndex,
				aim: targetUid,
				...armed.skill?.hits ? {
					hits: armed.skill.hits,
					vols: armed.skill.vols,
					aim: armed.skill.aim ?? targetUid,
					index: armed.skill.index
				} : {}
			}
		}, uid, targetUid, skillIndex);
		if (silent) return tided;
		return withResults(state, traceSkill(state, tided, uid, targetUid), {
			blocked: false,
			reflect: false,
			turn: false
		});
	} finally {
		charmDamage = previous;
		skillHex = previousHex;
	}
}
function castSkill(state, uid, targetUid, skillIndex = 0, skipGnaw = false, extra = null) {
	if (state.step !== "main" || state.winner) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	state = {
		...state,
		echo: null,
		last: null
	};
	const side = state.turn;
	const foe = 1 - side;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (mon?.cardId === "sat-nhan-bat-giu") return castSeize(state, side, mon, targetUid);
	if (mon?.cage) return note(state, "Đang bị khoá cứng.");
	if (!mon || held(mon) || hexLocked(mon) || mon.dim && !(mon.cardId === "ken-ngai" && skillIndex === 1) && !(mon.cardId === PERFECT && (skillIndex === 0 || skillIndex === 2)) || (mon.path ?? 0) > 0) return state;
	if (mon.cardId === "mat-xanh-huy-diet") {
		if (mon.gaze) return note(state, "Tia sáng huỷ diệt đã nạp cho đòn tiếp theo.");
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem.");
		const field = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			gaze: true
		} : unit);
		return {
			...note(pingStars(patch(state, side, {
				...paid,
				field
			}), side, before, paid.stars), `${cardOf(mon).name} nạp tia sáng huỷ diệt. Đòn tiếp theo là sát thương chuẩn bằng công.`, "heal"),
			mends: [{
				uid: mon.uid,
				n: 0
			}]
		};
	}
	if (mon.cardId === "thien-than-be-nho") {
		const ally = you.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
		if (!ally) return note(state, "Chọn một đồng minh.");
		const kind = skillIndex === 1 ? "spell" : "phys";
		const field = you.field.map((unit) => {
			if (!unit) return unit;
			if (unit.uid === ally.uid) {
				if (unit.cage || unit.wardStay || kind === "phys" && unit.oath?.phys || kind === "spell" && unit.oath?.spell) return unit;
				return {
					...unit,
					ward: kind
				};
			}
			if (unit.uid === mon.uid) return {
				...unit,
				dim: true
			};
			return unit;
		});
		const label = kind === "phys" ? "khiên vật lý" : "khiên phép";
		return note(patch(state, side, {
			...you,
			field
		}), `${cardOf(mon).name} dùng Thiên thần hộ mệnh, tạo ${label} cho ${cardOf(ally).name}.`, "heal");
	}
	if (mon.cardId === PERFECT) return castPerfect(state, side, mon, skillIndex, targetUid, extra);
	if (mon.cardId === QUEEN && skillIndex === 3) return castLure(state, side, mon, extra, targetUid);
	if (isHarpy(mon.cardId) && (skillIndex === 0 || skillIndex === 1)) return castHarpy(state, side, mon, skillIndex, targetUid);
	targetUid = redirectCover(state.players[foe].field, targetUid);
	if (!skipGnaw && targetUid && canTargetFoe(state)) {
		if (gnawReady$1(state.players[foe].field.find((unit) => unit?.uid === targetUid) ?? null, state.players[foe])) return {
			...note(state, `${castName(mon.cardId, skillIndex)} nhắm vào Chiến sĩ gặm nhắm.`),
			step: "respond",
			pending: {
				kind: "gnaw-skill",
				caster: uid,
				target: targetUid,
				index: skillIndex
			},
			hold: {
				priority: foe,
				passed: [false, false],
				blocker: null,
				blockerSkill: false,
				armed: null
			}
		};
	}
	if (mon.cardId === "may-nem-bom-hinh-nhen") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		return rainBombs(state, side, mon, targetUid);
	}
	if (mon.cardId === "hoa-an-thit-nguoi") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const them = state.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ.");
		const bite = grabNums(skillText(mon.cardId), /cướp\s*(\d+)\s*máu\s*tối\s*đa/gi)[0] ?? 2;
		const take = Math.min(bite, target.hp);
		const drained = {
			...target,
			maxHp: Math.max(0, (target.maxHp || target.hp) - take),
			hp: target.hp - take,
			raised: target.raised ? {
				...target.raised,
				hp: Math.max(0, target.raised.hp - take)
			} : void 0
		};
		const fed = {
			...mon,
			maxHp: (mon.maxHp || mon.hp) + take,
			hp: mon.hp + take,
			raised: markRaised(mon, { hp: take }),
			dim: true
		};
		const foeField = them.field.map((unit) => unit?.uid === target.uid ? drained : unit);
		const yourField = you.field.map((unit) => unit?.uid === mon.uid ? fed : unit);
		let next = patch(state, side, {
			...you,
			field: yourField
		});
		next = patch(next, foe, dropDead({
			...them,
			field: foeField
		}));
		const killed = drained.hp <= 0;
		const line = killed ? `${cardOf(mon).name} cướp ${take} máu tối đa và hạ ${cardOf(target).name}.` : `${cardOf(mon).name} cướp ${take} máu tối đa từ ${cardOf(target).name}.`;
		if (killed) return {
			...note(next, line, "heal"),
			mends: [{
				uid: mon.uid,
				n: take
			}]
		};
		return flowerBite(next, foe, target.uid, mon.uid, take, line);
	}
	if (mon.cardId === "thuong-quan-long") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const foes = state.players[foe].field.filter((unit) => Boolean(unit && unit.hp > 0));
		if (foes.length === 0) return note(state, "Không có quái địch.");
		const landed = gunHits(extra);
		if (!landed) return state.reel ? state : openGunReel(state, uid);
		const before = you.stars;
		const paid = pay$1(you, skillManaCost(mon.cardId, 1));
		if (!paid) return note(state, "Cần 1 gem.");
		const text = skillText(mon.cardId);
		const barrels = [
			{
				key: "phys",
				n: grabNums(text, /(\d+)\s*sát thương vật lý/gi)[0] ?? 6
			},
			{
				key: "spell",
				n: grabNums(text, /(\d+)\s*sát thương phép/gi)[0] ?? 5
			},
			{
				key: "tru",
				n: grabNums(text, /(\d+)\s*sát thương chuẩn/gi)[0] ?? 4
			}
		].filter((barrel) => landed.includes(barrel.key));
		const shaved = shaveHex(mon, {
			phys: barrels.reduce((sum, barrel) => sum + (barrel.key === "phys" ? barrel.n : 0), 0),
			spell: barrels.reduce((sum, barrel) => sum + (barrel.key === "spell" ? barrel.n : 0), 0),
			tru: barrels.reduce((sum, barrel) => sum + (barrel.key === "tru" ? barrel.n : 0), 0)
		});
		const tuned = favorShots(mon, barrels.map((barrel) => ({
			kind: barrel.key,
			n: shaved[barrel.key]
		})));
		for (let index = 0; index < barrels.length; index += 1) barrels[index] = {
			key: tuned[index].kind,
			n: tuned[index].n
		};
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		if (barrels.length === 0) return next;
		const pool = shuffle(foes);
		const shots = barrels.map((barrel, index) => ({
			barrel,
			uid: (index < pool.length ? pool[index] : pool[Math.floor(Math.random() * pool.length)]).uid
		}));
		let field = next.players[foe].field;
		const hits = [];
		const byTarget = /* @__PURE__ */ new Map();
		const bump = (id, name, kind, n) => {
			const row = byTarget.get(id) ?? {
				name,
				phys: 0,
				spell: 0,
				tru: 0,
				physShot: false,
				spellShot: false,
				truShot: false
			};
			row[kind] += n;
			if (kind === "phys") row.physShot = true;
			if (kind === "spell") row.spellShot = true;
			if (kind === "tru") row.truShot = true;
			byTarget.set(id, row);
		};
		for (const shot of shots) {
			const real = shuntUid(field, shot.uid) ?? shot.uid;
			const target = field.find((unit) => unit?.uid === real);
			if (!target) continue;
			hits.push(real);
			if (shot.barrel.key === "spell") {
				const landedN = spellLanded(target, shot.barrel.n, field, mon);
				bump(real, cardOf(target).name, "spell", shownTru(target, landedN, field));
				field = field.map((unit) => unit?.uid === real ? damageSpell(unit, shot.barrel.n, field, mon) : unit);
			} else if (shot.barrel.key === "phys") {
				const raw = outgoing(mon, shot.barrel.n);
				if (target.cardId === "chien-binh-rong") {
					const hit = takePhysical(target, raw, field);
					bump(real, cardOf(target).name, "phys", Math.max(0, target.hp - hit.mon.hp));
					field = field.map((unit) => unit?.uid === real ? hit.mon : unit);
				} else {
					const rawN = hurt(target, Math.max(0, raw - liveDef(target, field)));
					bump(real, cardOf(target).name, "phys", shownTru(target, rawN, field));
					field = field.map((unit) => unit?.uid === real ? applyIncoming(unit, rawN, field).mon : unit);
				}
			} else {
				const raw = outgoing(mon, shot.barrel.n);
				if (target.cardId === "chien-binh-rong") {
					const slice = third(raw);
					const queued = pushDebt(target, {
						p: 0,
						s: 0,
						t: slice
					});
					const rawHit = hurt(queued, slice);
					bump(real, cardOf(target).name, "tru", shownTru(queued, rawHit, field));
					field = field.map((unit) => unit?.uid === real ? applyIncoming(queued, rawHit, field).mon : unit);
				} else {
					const rawN = hurt(target, raw);
					bump(real, cardOf(target).name, "tru", shownTru(target, rawN, field));
					field = field.map((unit) => unit?.uid === real ? applyIncoming(unit, rawN, field).mon : unit);
				}
			}
		}
		next = patch(next, foe, settleCocoon(dropDead({
			...next.players[foe],
			field
		})));
		const spinRows = [...byTarget.values()].map((row) => {
			const parts = [
				row.physShot ? `${row.phys} sát thương vật lý` : "",
				row.spellShot ? `${row.spell} sát thương phép` : "",
				row.truShot ? `${row.tru} sát thương chuẩn` : ""
			].filter(Boolean);
			return {
				name: row.name,
				bits: parts.join(", ")
			};
		});
		if (spinRows.length === 0) return next;
		return checkWinner({
			...note(next, aimNotice(castName(mon.cardId, skillIndex), spinRows) ?? `${cardOf(mon).name} gây ${spinRows[0]?.bits ?? "0 sát thương"}.`, "spell"),
			skill: {
				id: mon.cardId,
				index: 0,
				aim: null,
				hits
			}
		});
	}
	if (mon.cardId === "rong-ac-ma") {
		const them = state.players[foe];
		const target = targetUid ? them.field.find((unit) => unit?.uid === targetUid) ?? null : null;
		if (targetUid && !target) return note(state, "Chọn một quái đối thủ hoặc người chơi.");
		return resolveDemonBall(state, mon, target);
	}
	if (mon.cardId === "mat-do-tan-pha") {
		const them = state.players[foe];
		const target = targetUid ? them.field.find((unit) => unit?.uid === targetUid) ?? null : null;
		if (targetUid && !target) return note(state, "Chọn một quái đối thủ.");
		const cost = skillManaCost(mon.cardId, 1);
		const before = you.stars;
		const paid = pay$1(you, cost);
		if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
		const armed = pingStars(patch(state, side, paid), side, before, paid.stars);
		const caster = armed.players[side].field.find((unit) => unit?.uid === uid) ?? mon;
		if (!target) {
			const figures = hellFigures(mon.cardId);
			if (caster.skillUp) figures.spell += caster.skillUp;
			const shaved = shaveHex(caster, figures);
			const shot = {
				phys: outgoing(caster, shaved.phys),
				spell: outgoing(caster, shaved.spell),
				tru: outgoing(caster, shaved.tru)
			};
			const dealt = shot.phys + shot.spell + shot.tru;
			const field = armed.players[side].field.map((unit) => unit?.uid === uid ? {
				...unit,
				dim: true
			} : unit);
			let next = patch(armed, side, {
				...armed.players[side],
				field
			});
			const foePlayer = next.players[foe];
			next = patch(next, foe, {
				...foePlayer,
				hp: foePlayer.hp - dealt
			});
			return checkWinner(note(next, actNotice(castName(mon.cardId, skillIndex), hellLine(shot, "người chơi")), "spell"));
		}
		return resolveHell(armed, caster, target);
	}
	if (mon.cardId === "kiem-si-lua-thieng") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
		const them = state.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ");
		targetUid = shuntUid(them.field, target.uid);
		const landed = them.field.find((unit) => unit?.uid === targetUid) ?? target;
		if (skillIndex > 0) {
			const bite = grabNums(skillText(mon.cardId), /tiêu(?:\s*hao)?\s*(\d+)\s*máu/gi)[0] ?? 2;
			if (mon.hp <= bite) return note(state, `Không đủ máu. Skill này sẽ khiến ${cardOf(mon).name} mất mạng.`);
			const amount = skillFigure(mon.cardId, "dmg", 7, 1) + (mon.skillUp ?? 0);
			const yourField = you.field.map((unit) => unit?.uid === uid ? {
				...unit,
				hp: unit.hp - bite,
				dim: unit.hp - bite > 0
			} : unit);
			const foeField = them.field.map((unit) => unit?.uid === landed.uid ? damageSpell(unit, amount, them.field, mon) : unit);
			let next = patch(state, side, dropDead({
				...you,
				field: yourField
			}));
			next = patch(next, foe, settleCocoon(dropDead({
				...them,
				field: foeField
			})));
			return armEcho(note(next, `${castName(mon.cardId, skillIndex)} đổi ${bite} máu lấy ${spellLanded(landed, amount, them.field, mon)} sát thương phép`, "spell"), uid);
		}
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem");
		const amount = skillFigure(mon.cardId, "dmg", 5) + (mon.skillUp ?? 0);
		const hit = damageSpell(landed, amount, them.field, mon);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		const foeField = them.field.map((unit) => unit?.uid === landed.uid ? hit : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		next = patch(next, foe, settleCocoon(dropDead({
			...them,
			field: foeField
		})));
		return armEcho(note(next, `${castName(mon.cardId, skillIndex)} gây ${spellLanded(landed, amount, them.field, mon)} sát thương phép`, "spell"), uid);
	}
	if (mon.cardId === "mo-voi-ma-mut") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem.");
		const them = state.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ.");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const landed = them.field.find((unit) => unit?.uid === real) ?? target;
		const amount = mon.hp;
		const hit = damageSpell(landed, amount, void 0, mon);
		const marked = hit.hp > 0 ? stampErode(hit, side, null) : hit;
		const yourField = paid.field.map((unit) => unit?.uid === uid ? null : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		next = patch(next, foe, dropDead({
			...them,
			field: them.field.map((unit) => unit?.uid === landed.uid ? marked : unit)
		}));
		const line = marked.hp > 0 ? `${castName(mon.cardId, skillIndex)} hy sinh, gây ${spellLanded(landed, amount, void 0, mon)} sát thương phép và bào mòn ${cardOf(target).name}.` : `${castName(mon.cardId, skillIndex)} hy sinh, gây ${spellLanded(landed, amount, void 0, mon)} sát thương phép.`;
		return note(next, line, "spell");
	}
	if (mon.cardId === QUEEN_KNIGHT) {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const them = state.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ.");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const victim = them.field.find((unit) => unit?.uid === real && unit.hp > 0) ?? target;
		return strikeQueenSword(state, side, mon, foe, victim);
	}
	if (mon.cardId === "phu-thuy-rung-den") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const them = state.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ.");
		const before = you.stars;
		const paid = pay$1(you, skillManaCost(mon.cardId, 1));
		if (!paid) return note(state, "Cần 1 mana.");
		const foeField = them.field.map((unit) => unit?.uid === target.uid ? {
			...unit,
			hex: { left: 6 }
		} : unit);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		next = patch(next, foe, {
			...them,
			field: foeField
		});
		return note(next, `${castName(mon.cardId, skillIndex)} lên ${cardOf(target).name}.`);
	}
	if (mon.cardId === "ong-khong-lo") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem.");
		const them = state.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ.");
		const turns = grabNums(skillText(mon.cardId), /(\d+)\s*lượt/gi)[0] ?? 5;
		const foeField = them.field.map((unit) => unit?.uid === target.uid ? {
			...unit,
			stun: turns
		} : unit);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		next = patch(next, foe, {
			...them,
			field: foeField
		});
		return note(next, `${castName(mon.cardId, skillIndex)} trong ${turns} lượt.`);
	}
	if (mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const them = state.players[foe];
		if ((mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi") && !targetUid) {
			const before = you.stars;
			const paid = pay$1(you, skillManaCost(mon.cardId, 1));
			if (!paid) return note(state, "Cần 1 gem.");
			const tru = grabNums(skillText(mon.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2;
			const pack = shaveHex(mon, {
				spell: (grabNums(skillText(mon.cardId), /(\d+)\s*sát thương phép/gi)[0] ?? 1) + (mon.skillUp ?? 0),
				phys: 0,
				tru
			});
			const truDealt = outgoing(mon, pack.tru) + charmDamage;
			const spellDealt = outgoing(mon, pack.spell) + charmDamage;
			const yourField = paid.field.map((unit) => unit?.uid === uid ? {
				...unit,
				dim: true
			} : unit);
			let next = pingStars(patch(state, side, {
				...paid,
				field: yourField
			}), side, before, paid.stars);
			next = patch(next, foe, {
				...next.players[foe],
				hp: next.players[foe].hp - truDealt - spellDealt
			});
			return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${truDealt} sát thương chuẩn và ${spellDealt} sát thương phép lên người chơi.`, "spell"));
		}
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ.");
		const before = you.stars;
		const paid = pay$1(you, skillManaCost(mon.cardId, 1));
		if (!paid) return note(state, "Cần 1 gem.");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const victim = them.field.find((unit) => unit?.uid === real) ?? target;
		const tru = grabNums(skillText(mon.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2;
		const pack = shaveHex(mon, {
			spell: (grabNums(skillText(mon.cardId), /(\d+)\s*sát thương phép/gi)[0] ?? 2) + (mon.skillUp ?? 0),
			phys: 0,
			tru
		});
		const truRaw = outgoing(mon, pack.tru) + charmDamage;
		const truNow = victim.cardId === "chien-binh-rong" ? third(truRaw) : outgoing(mon, pack.tru);
		const spellDealt = spellLanded(victim, pack.spell, them.field, mon);
		const spellShown = Math.max(0, spellDealt - Math.min(phantomPool(victim, them.field), spellDealt));
		const truDealt = shownTru(victim, hurt(victim, truNow), them.field, spellDealt);
		const burned = trueDamage(damageSpell(victim, pack.spell, them.field, mon), outgoing(mon, pack.tru), them.field, veilLeft(victim, spellDealt));
		const foeField = them.field.map((unit) => unit?.uid === real ? burned : unit);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		next = patch(next, foe, dropDead({
			...them,
			field: foeField
		}));
		return note(next, `${castName(mon.cardId, skillIndex)} gây ${truDealt} sát thương chuẩn và ${spellShown} sát thương phép.`, "spell");
	}
	if (mon.cardId === "rong-phun-hoa-cau") {
		if (skillIndex > 0) {
			if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
			const them = state.players[foe];
			if (!targetUid) {
				const before = you.stars;
				const paid = pay$1(you, 1);
				if (!paid) return note(state, "Cần 1 gem.");
				const dealt = outgoing(mon, skillFigure(mon.cardId, "dmg", 3) + (mon.skillUp ?? 0) + charmDamage);
				const yourField = paid.field.map((unit) => unit?.uid === uid ? {
					...unit,
					dim: true
				} : unit);
				let next = pingStars(patch(state, side, {
					...paid,
					field: yourField
				}), side, before, paid.stars);
				next = patch(next, foe, {
					...next.players[foe],
					hp: next.players[foe].hp - dealt
				});
				return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
			}
			const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
			if (!target) return note(state, "Chọn một quái đối thủ");
			const before = you.stars;
			const paid = pay$1(you, 1);
			if (!paid) return note(state, "Cần 1 gem.");
			const real = shuntUid(them.field, target.uid) ?? target.uid;
			const loss = skillLoss(mon.cardId, "mdef", 1);
			const amount = skillFigure(mon.cardId, "dmg", 3) + (mon.skillUp ?? 0);
			const foeField = them.field.map((unit) => {
				if (unit?.uid !== real) return unit;
				return {
					...damageSpell(unit, amount, them.field, mon),
					mdef: unit.mdef - loss
				};
			});
			const yourField = paid.field.map((unit) => unit?.uid === uid ? {
				...unit,
				dim: true
			} : unit);
			let next = pingStars(patch(state, side, {
				...paid,
				field: yourField
			}), side, before, paid.stars);
			next = patch(next, foe, settleCocoon(dropDead({
				...them,
				field: foeField
			})));
			return note(next, `${castName(mon.cardId, skillIndex)} giảm ${loss} thủ phép và gây ${spellPhrase([them.field.find((unit) => unit?.uid === real)], amount, them.field, mon)}`, "spell");
		}
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const them = state.players[foe];
		const before = you.stars;
		const cost = skillManaCost(mon.cardId);
		const paid = payCost(you, cost);
		if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		if (state.mode !== "ai" || side === 0) next = {
			...next,
			glimpse: them.reserve.map((card) => card.id)
		};
		return note(next, `${castName(mon.cardId, skillIndex)} quái dự bị.`);
	}
	if (mon.cardId === "ga-he-dang-so") {
		if (skillIndex === 0) {
			const before = you.stars;
			const paid = pay$1(you, 1);
			if (!paid) return note(state, "Cần 1 gem.");
			const yourField = paid.field.map((unit) => unit?.uid === uid ? {
				...unit,
				charge: unit.charge + 1,
				held: true,
				dim: true
			} : unit);
			return note(pingStars(patch(state, side, {
				...paid,
				field: yourField
			}), side, before, paid.stars), `${castName(mon.cardId, skillIndex)} năng lượng.`);
		}
		if (mon.charge < 2) return note(state, "Chưa đủ năng lượng để thi triển.");
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const amount = skillFigure(mon.cardId, "dmg", 5) + skillFigure(mon.cardId, "dmg", 4, 1) * Math.floor((mon.charge - 2) / 2) + (mon.skillUp ?? 0);
		const yourField = you.field.map((unit) => unit?.uid === uid ? {
			...unit,
			charge: 0,
			held: false,
			dim: true
		} : unit);
		let next = patch(state, side, {
			...you,
			field: yourField
		});
		const them = next.players[foe];
		if (!targetUid) {
			const dealt = outgoing(mon, amount);
			next = patch(next, foe, {
				...them,
				hp: them.hp - dealt
			});
			return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt + charmDamage} sát thương phép lên người chơi.`, "spell"));
		}
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một mục tiêu.");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const foeField = them.field.map((unit) => unit?.uid === real ? damageSpell(unit, amount, void 0, mon) : unit);
		next = patch(next, foe, dropDead({
			...them,
			field: foeField
		}));
		return note(next, `${castName(mon.cardId, skillIndex)} gây ${spellLanded(them.field.find((unit) => unit?.uid === real) ?? target, amount, void 0, mon)} sát thương phép.`, "spell");
	}
	if (mon.cardId === "cuc-bong-ma-quai") {
		if (mon.copy) return note(state, "Bản sao không dùng được kỹ năng.");
		const count = skillIndex === 2 ? 2 : 1;
		if (you.field.filter((unit) => !unit).length < count) return note(state, "Không đủ ô trống.");
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem.");
		let seq = state.seq;
		const field = [...paid.field];
		for (let i = 0; i < count; i += 1) {
			const slot = field.findIndex((unit) => !unit);
			seq += 1;
			field[slot] = {
				...place({
					...state,
					seq
				}, side, mon.cardId),
				copy: true
			};
		}
		const yourField = field.map((unit) => unit?.uid === uid ? {
			...unit,
			charge: 1,
			dim: true
		} : unit);
		return note(pingStars(patch({
			...state,
			seq: seq + 1
		}, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars), `${cardOf(mon).name} nhân ${count} bản sao.`);
	}
	if (mon.cardId === "te-giac-be-con") {
		if ((mon.level ?? 1) >= 3) return note(state, "Đã đạt cấp cuối.");
		const nextLevel = (mon.level ?? 1) + 1;
		const cost = rhinoRankCost(mon.level ?? 1);
		const before = you.stars;
		const paid = pay$1(you, cost);
		if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
		const form = rhinoForm(nextLevel);
		const heal = skillFigure(mon.cardId, "heal", 2);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			level: nextLevel,
			atk: form.atk,
			def: form.def,
			mdef: form.mdef,
			hp: Math.min(form.hp, unit.hp + heal),
			maxHp: form.hp,
			dim: true
		} : unit);
		return note(pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars), `${form.name} thăng cấp, hồi ${heal} máu.`, "heal");
	}
	if (mon.cardId === "ma-dao-si") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const before = you.stars;
		const paid = pay$1(you, skillManaCost(mon.cardId, 1));
		if (!paid) return note(state, "Cần 1 mana.");
		const packets = favorShots(mon, bulletRamp(skillText(mon.cardId)).map((n) => ({
			kind: "spell",
			n
		}))).map((shot) => shot.n);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		const them = next.players[foe];
		const name = castName(mon.cardId, skillIndex);
		if (!targetUid) {
			const vols = [];
			for (const each of packets) vols.push(outgoing(mon, each + charmDamage));
			const dealt = vols.reduce((sum, n) => sum + n, 0);
			next = patch(next, foe, {
				...them,
				hp: them.hp - dealt
			});
			return {
				...checkWinner(note(next, `${name} gây ${dealt} sát thương phép lên người chơi.`, "spell")),
				skill: {
					id: mon.cardId,
					index: skillIndex,
					aim: null,
					hits: vols.map(() => `face:${foe}`),
					vols
				}
			};
		}
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một mục tiêu.");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		let victim = them.field.find((unit) => unit?.uid === real) ?? target;
		const vols = [];
		for (const each of packets) {
			vols.push(spellLanded(victim, each, them.field, mon));
			victim = damageSpell(victim, each, them.field, mon);
		}
		const dealt = vols.reduce((sum, n) => sum + n, 0);
		next = patch(next, foe, dropDead({
			...them,
			field: them.field.map((unit) => unit?.uid === real ? victim : unit)
		}));
		return {
			...note(next, `${name} gây ${dealt} sát thương phép.`, "spell"),
			skill: {
				id: mon.cardId,
				index: skillIndex,
				aim: real,
				hits: vols.map(() => real),
				vols
			}
		};
	}
	if (mon.cardId === "loi-nguyen-cua-rong") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const them = state.players[foe];
		const picked = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
		if (!picked) return note(state, "Chọn một quái đối thủ.");
		const before = you.stars;
		const paid = payCost(you, skillManaCost(mon.cardId, 0));
		if (!paid) return note(state, "Không đủ mana.");
		const blow = outgoing(mon, grabNums(skillText(mon.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2);
		const vow = mon.skillUp ?? 0;
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		const curseRows = them.field.filter((unit) => Boolean(unit && unit.hp > 0)).map((unit) => {
			const total = blow + (unit.uid === picked.uid ? vow : 0) + charmDamage;
			const n = shownTru(unit, unit.cardId === "chien-binh-rong" ? hurt(unit, third(total)) : hurt(unit, total), them.field);
			return {
				name: cardOf(unit).name,
				bits: `${n} sát thương chuẩn`
			};
		});
		const hits = [];
		const foeField = spray(them.field, (unit, allies) => {
			if (unit.hp > 0) hits.push(unit.uid);
			return trueDamage(unit, blow + (unit.uid === picked.uid ? vow : 0), allies);
		});
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		next = patch(next, foe, settleCocoon(dropDead({
			...them,
			field: foeField
		})));
		const lone = curseRows[0]?.bits ?? `${blow} sát thương chuẩn`;
		return {
			...note(next, aimNotice(castName(mon.cardId, skillIndex), curseRows) ?? `${castName(mon.cardId, skillIndex)} gây ${lone}.`, "hit"),
			skill: {
				id: mon.cardId,
				index: skillIndex,
				aim: targetUid,
				hits
			}
		};
	}
	if (mon.cardId === "phu-thuy-ti-hon") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem.");
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		const amount = 3 + next.players[side].stars + (mon.skillUp ?? 0);
		const them = next.players[foe];
		if (!targetUid) {
			const dealt = outgoing(mon, amount);
			next = patch(next, foe, {
				...them,
				hp: them.hp - dealt
			});
			return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt + charmDamage} sát thương phép lên người chơi.`, "spell"));
		}
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một mục tiêu.");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const foeField = them.field.map((unit) => unit?.uid === real ? damageSpell(unit, amount, void 0, mon) : unit);
		next = patch(next, foe, dropDead({
			...them,
			field: foeField
		}));
		return note(next, `${castName(mon.cardId, skillIndex)} gây ${spellLanded(them.field.find((unit) => unit?.uid === real) ?? target, amount, void 0, mon)} sát thương phép.`, "spell");
	}
	if (mon.cardId === "phu-thuy-thoi-gian") {
		const name = castName(mon.cardId, skillIndex);
		const dimSelf = (field) => field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		if (skillIndex === 2) {
			if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
			const before = you.stars;
			const paid = pay$1(you, 2);
			if (!paid) return note(state, "Cần 2 mana.");
			if (!wheelLanded(extra)) return breakWitch(state, side, paid, uid, before);
			const yourField = paid.field.map((unit) => {
				if (!unit) return unit;
				if (unit.uid === uid) return {
					...unit,
					dim: true
				};
				return timeWave(unit, false);
			});
			const foeField = state.players[foe].field.map((unit) => unit ? timeWave(unit, true) : unit);
			let next = pingStars(patch(state, side, {
				...paid,
				field: yourField
			}), side, before, paid.stars);
			next = patch(next, foe, dropDead({
				...next.players[foe],
				field: foeField
			}));
			next = patch(next, side, dropDead(next.players[side]));
			const killed = [];
			const foeBorn = [];
			const foeBuff = [];
			const grown = [];
			const allyBorn = [];
			const evolved = (beforeMon, afterMon) => afterMon.cardId !== beforeMon.cardId || (afterMon.level ?? 1) !== (beforeMon.level ?? 1);
			for (const unit of state.players[foe].field) {
				if (!unit || unit.hp <= 0) continue;
				const after = timeWave(unit, true);
				if (!after) killed.push(cardOf(unit).name);
				else if (evolved(unit, after)) foeBorn.push(`- Lão hoá tiến hoá ${cardOf(unit).name} thành ${cardOf(after).name}`);
				else foeBuff.push(cardOf(unit).name);
			}
			for (const unit of paid.field) {
				if (!unit || unit.hp <= 0 || unit.uid === uid) continue;
				const after = timeWave(unit, false);
				if (!after || after === unit) continue;
				if (evolved(unit, after)) allyBorn.push(`- Lão hoá tiến hoá ${cardOf(unit).name} thành ${cardOf(after).name}`);
				else grown.push(cardOf(unit).name);
			}
			const lines = ["Dòng chảy thời gian quét cả sân"];
			if (killed.length) lines.push(`- Lão hoá tiêu diệt ${killed.join(", ")}`);
			lines.push(...foeBorn);
			if (foeBuff.length) lines.push(`- Lão hoá cường hoá ${foeBuff.join(", ")}, tăng 35% chỉ số`);
			if (grown.length) lines.push(`- Lão hoá làm trưởng thành ${grown.join(", ")}, tăng 35% chỉ số`);
			lines.push(...allyBorn);
			return note(next, lines.join("\n"), "spell");
		}
		const ally = you.field.find((unit) => unit?.uid === targetUid && unit.uid !== uid) ?? null;
		const enemy = state.players[foe].field.find((unit) => unit?.uid === targetUid) ?? null;
		const target = ally ?? enemy;
		if (!target) return note(state, "Chọn một mục tiêu.");
		if (enemy && !canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		if (skillIndex === 1) {
			if (!wheelLanded(extra)) return breakWitch(state, side, you, uid, you.stars);
			const yourBase = dimSelf(you.field);
			const put = (nextMon, line, tone) => {
				if (enemy) {
					const foeField = state.players[foe].field.map((unit) => unit?.uid === enemy.uid ? nextMon : unit);
					let next = patch(state, side, {
						...you,
						field: yourBase
					});
					next = patch(next, foe, dropDead({
						...state.players[foe],
						field: foeField
					}));
					return note(next, line, tone);
				}
				const yourField = yourBase.map((unit) => unit?.uid === target.uid ? nextMon : unit);
				return note(patch(state, side, {
					...you,
					field: yourField
				}), line, tone);
			};
			if (target.cardId === "rong-con" || ally && isSpecial(ally)) {
				const born = target.cardId === "rong-con" ? evolveImmortal(target) : evolveSpecial(ally);
				return put(born, `${name} tiến hoá ${cardOf(born).name} đến dạng cuối.`, "spell");
			}
			if (isImmortal(target)) {
				const boosted = buffMon(target);
				return put(boosted, `${name} cường hoá ${cardOf(boosted).name}, tăng 35% chỉ số.`, "heal");
			}
			if (enemy) return put(null, `${name} cường hoá và tiêu diệt ${cardOf(enemy).name}.`, "spell");
			return note(patch(state, side, {
				...you,
				field: yourBase
			}), `${name} không có tác dụng lên ${cardOf(target).name}.`);
		}
		if (enemy && isImmortal(enemy)) return note(state, "Không chọn được kẻ địch bất tử.");
		if (ally && cardStars(ally.cardId, ally.level ?? 1) >= 3) return note(state, "Lão hoá thường chỉ ảnh hưởng đồng minh từ 2 sao trở xuống.");
		const yourBase = dimSelf(you.field);
		if (enemy) {
			const aged = ageMon(enemy);
			const foeField = state.players[foe].field.map((unit) => unit?.uid === enemy.uid ? aged : unit);
			let next = patch(state, side, {
				...you,
				field: yourBase
			});
			next = patch(next, foe, dropDead({
				...state.players[foe],
				field: foeField
			}));
			return note(next, `${name} lão hoá ${cardOf(enemy).name}, giảm 35% chỉ số.`, "spell");
		}
		const grown = buffMon(ally);
		const yourField = yourBase.map((unit) => unit?.uid === ally.uid ? grown : unit);
		return note(patch(state, side, {
			...you,
			field: yourField
		}), `Lão hoá trưởng thành hoá ${cardOf(ally).name}, tăng 35% chỉ số.`, "heal");
	}
	if (mon.cardId === "trieu-hoi-ac-ma") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
		const them = state.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ");
		const wet = (target.wet ?? 0) > 0;
		const base = skillFigure(mon.cardId, "dmg", 5);
		const bonus = grabNums(skillText(mon.cardId), /nhận thêm\s*(\d+)/gi)[0] ?? 2;
		const plain = wet ? base + bonus : base;
		const ids = [target.uid];
		if (wet) {
			for (const unit of them.field) if (unit && unit.uid !== target.uid && (unit.wet ?? 0) > 0) ids.push(unit.uid);
		}
		let foeField = them.field;
		for (const id of ids) {
			const real = shuntUid(foeField, id) ?? id;
			const amount = plain + (id === target.uid ? mon.skillUp ?? 0 : 0);
			foeField = foeField.map((unit) => unit?.uid === real ? damageSpell(unit, amount, foeField, mon) : unit);
		}
		const yourField = you.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = patch(state, side, {
			...you,
			field: yourField
		});
		next = patch(next, foe, settleCocoon(dropDead({
			...them,
			field: foeField
		})));
		const aims = ids.map((id) => them.field.find((unit) => unit?.uid === (shuntUid(them.field, id) ?? id))).filter((unit) => Boolean(unit));
		const demonRows = aims.map((unit) => {
			const blow = plain + (unit.uid === target.uid ? mon.skillUp ?? 0 : 0);
			return {
				name: cardOf(unit).name,
				bits: `${spellLanded(unit, blow, them.field, mon)} sát thương phép`
			};
		});
		const spread = wet && aims.length > 1 && new Set(aims.map((unit) => spellLanded(unit, plain, them.field, mon))).size === 1 ? "Đòn lan sang kẻ đang ẩm." : "";
		return note(next, aimNotice(castName(mon.cardId, skillIndex), demonRows, spread) ?? `${castName(mon.cardId, skillIndex)} gây ${spellPhrase(aims, plain, them.field, mon)}`, "spell");
	}
	if (mon.cardId === "yeu-tinh-chuc-phuc") {
		if (mon.dim) return note(state, "Yêu tinh đã hành động trong lượt này");
		const ally = you.field.find((unit) => unit?.uid === targetUid && unit.uid !== uid) ?? null;
		if (!ally) return note(state, "Chọn một quái đồng minh khác");
		const paid = pay$1(you, skillManaCost(mon.cardId, 1));
		if (!paid) return note(state, "Cần 1 mana.");
		const atk = skillFigure(mon.cardId, "atk", 3);
		const dmg = skillFigure(mon.cardId, "dmg", 3);
		const guard = skillFigure(mon.cardId, "def", 1);
		const field = paid.field.map((unit) => {
			if (!unit) return unit;
			if (unit.uid === uid) return {
				...unit,
				dim: true
			};
			if (unit.uid === ally.uid) return {
				...unit,
				blessAtk: atk,
				blessDmg: dmg,
				nextDef: guard
			};
			return unit;
		});
		return note(patch(state, side, {
			...paid,
			field
		}), `${castName(mon.cardId, skillIndex)} phù hộ ${cardOf(ally).name} cho đòn kế tiếp. +${atk} công, +${guard} thủ, +${dmg} sát thương phép.`, "heal");
	}
	if (mon.cardId === "sau-non") {
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem");
		const card = monsterCard("ken-ngai");
		const field = paid.field.map((unit) => unit?.uid === uid && card ? {
			...unit,
			cardId: "ken-ngai",
			atk: skillFigure("ken-ngai", "atk", card.atk),
			def: skillFigure("ken-ngai", "def", card.def),
			mdef: skillFigure("ken-ngai", "mdef", card.mdef),
			hp: skillFigure("ken-ngai", "hp", card.hp),
			maxHp: skillFigure("ken-ngai", "hp", card.hp),
			level: 0,
			dim: true,
			noBlock: true
		} : unit);
		return {
			...note(pingStars(patch(state, side, {
				...paid,
				field
			}), side, before, paid.stars), castName(mon.cardId, skillIndex)),
			legs: uid
		};
	}
	if (mon.cardId === "ken-ngai") {
		if (skillIndex !== 1) return note(state, "Chân kén chỉ mọc lúc hoá kén");
		const age = mon.level ?? 0;
		if (age < 4 || age > 5) return note(state, age < 4 ? "Chưa đủ lượt để nở" : "Kén tự nở ở lượt 6");
		const legs = you.field.filter((unit) => unit?.host === uid);
		const born = hatchCocoon(mon);
		const field = you.field.map((unit) => {
			if (!unit || legs.some((leg) => leg?.uid === unit.uid)) return unit && legs.some((leg) => leg?.uid === unit.uid) ? null : unit;
			return unit.uid === uid ? born : unit;
		});
		return {
			...note(patch(state, side, {
				...you,
				field
			}), `${castName(mon.cardId, skillIndex)} ra ${cardOf(born).name}`, "heal"),
			mends: [{
				uid: born.uid,
				n: 0
			}]
		};
	}
	if (mon.cardId === "ngai-khong-lo" || mon.cardId === "ngai-nu-hoang" || mon.cardId === "ngai-hoan-my") {
		const picked = state.players[foe].field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
		if (!picked) return note(state, "Chọn một quái đối thủ.");
		const before = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 gem");
		const kind = mon.cardId === "ngai-khong-lo" ? "giant" : mon.cardId === "ngai-nu-hoang" ? "queen" : "perfect";
		const amount = skillFigure(mon.cardId, "dmg", kind === "giant" ? 4 : kind === "queen" ? 5 : 6);
		const hit = (unit, allies) => applyPoison(damageSpell(unit, amount + (unit.uid === picked.uid ? mon.skillUp ?? 0 : 0), allies, mon), kind, side);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		const foeField = spray(state.players[foe].field, hit);
		let next = pingStars(patch(state, side, settleCocoon(dropDead({
			...paid,
			field: yourField
		}))), side, before, paid.stars);
		next = patch(next, foe, settleCocoon(dropDead({
			...next.players[foe],
			field: foeField
		})));
		const foes = state.players[foe].field.filter((unit) => Boolean(unit && unit.hp > 0));
		const dustRows = foes.map((unit) => ({
			name: cardOf(unit).name,
			bits: `${spellLanded(unit, amount + (unit.uid === picked.uid ? mon.skillUp ?? 0 : 0), state.players[foe].field, mon)} sát thương phép`
		}));
		return note(next, aimNotice(castName(mon.cardId, skillIndex), dustRows) ?? `${castName(mon.cardId, skillIndex)} ${spellPhrase(foes, amount, state.players[foe].field, mon)}`, "spell");
	}
	if (mon.cardId === SHADE) {
		const beforeStars = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 mana.");
		const field = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			shown: 3,
			stored: 1
		} : unit);
		return note(pingStars(patch(state, side, {
			...paid,
			field
		}), side, beforeStars, paid.stars), `${cardOf(mon).name} dùng Ẩn mình. Đối thủ chỉ thấy thế thân.`, "spell");
	}
	if (mon.cardId === TIDE) {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const them = state.players[foe];
		const target = targetUid ? them.field.find((unit) => unit?.uid === targetUid) ?? null : null;
		if (targetUid && !target) return note(state, "Chọn một quái đối thủ.");
		const beforeStars = you.stars;
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 mana.");
		const amount = 2 + 3 * (mon.stored ?? 0) + (mon.skillUp ?? 0);
		const name = castName(mon.cardId, 0);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			stored: 0,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, beforeStars, paid.stars);
		if (!target) {
			const dealt = outgoing(mon, amount + charmDamage);
			next = patch(next, foe, {
				...next.players[foe],
				hp: next.players[foe].hp - dealt
			});
			return checkWinner(note(next, `${name} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
		}
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const foeField = them.field.map((unit) => unit?.uid === real ? damageSpell(unit, amount, them.field, mon) : unit);
		next = patch(next, foe, settleCocoon(dropDead({
			...them,
			field: foeField
		})));
		const struck = them.field.find((unit) => unit?.uid === real) ?? target;
		return note(next, `${name} gây ${spellLanded(struck, amount, them.field, mon)} sát thương phép lên ${cardOf(struck).name}.`, "spell");
	}
	if (mon.cardId === "sua-hut-ma-phap") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
		const them = state.players[foe];
		const amount = skillFigure(mon.cardId, "dmg", 3) + (mon.stored ?? 0) + (mon.skillUp ?? 0);
		if (!targetUid) {
			const dealt = outgoing(mon, amount + charmDamage);
			const yourField = you.field.map((unit) => unit?.uid === uid ? {
				...unit,
				stored: 0,
				dim: true
			} : unit);
			let next = patch(state, side, {
				...you,
				field: yourField
			});
			next = patch(next, foe, {
				...next.players[foe],
				hp: next.players[foe].hp - dealt
			});
			return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
		}
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một quái đối thủ");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const foeField = them.field.map((unit) => unit?.uid === real ? damageSpell(unit, amount, them.field, mon) : unit);
		const yourField = you.field.map((unit) => unit?.uid === uid ? {
			...unit,
			stored: 0,
			dim: true
		} : unit);
		let next = patch(state, side, {
			...you,
			field: yourField
		});
		next = patch(next, foe, settleCocoon(dropDead({
			...them,
			field: foeField
		})));
		const jelly = them.field.find((unit) => unit?.uid === real) ?? target;
		return note(next, `${castName(mon.cardId, skillIndex)} ${spellLanded(jelly, amount, them.field, mon)} sát thương phép`, "spell");
	}
	if (mon.cardId === "trai-tim-hai-long") {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
		const base = skillIndex === 0;
		const all = skillIndex === 2;
		const costs = grabNums(skillText(mon.cardId), /thêm\s*(\d+)\s*mana/gi);
		const cost = base ? 0 : all ? costs[1] ?? 2 : costs[0] ?? 1;
		const before = you.stars;
		const paid = cost > 0 ? pay$1(you, cost) : you;
		if (!paid) return note(state, `Cần ${cost} mana`);
		const them = state.players[foe];
		const amount = skillFigure(mon.cardId, "dmg", base ? 4 : all ? 6 : 5, base ? 0 : all ? 2 : 1);
		const living = them.field.filter((unit) => unit && unit.hp > 0);
		let victims = [];
		if (all) {
			if (!them.field.some((unit) => unit?.uid === targetUid && unit.hp > 0)) return note(state, "Chọn một quái đối thủ.");
			victims = living.map((unit) => unit.uid);
		} else {
			const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
			if (!target) return note(state, "Chọn một quái đối thủ");
			if (base) victims = [target.uid];
			else {
				const pool = living.filter((unit) => unit.uid !== target.uid);
				const extra = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].uid : null;
				victims = extra ? [target.uid, extra] : [target.uid];
			}
		}
		let foeField = them.field;
		for (const id of victims) {
			const covered = redirectCover(foeField, id) ?? id;
			const real = shuntUid(foeField, covered) ?? covered;
			foeField = foeField.map((unit) => unit?.uid === real ? {
				...damageSpell(unit, amount, foeField, mon),
				wet: Math.max(unit.wet ?? 0, 2)
			} : unit);
		}
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = pingStars(patch(state, side, {
			...paid,
			field: yourField
		}), side, before, paid.stars);
		let foePlayer = settleCocoon(dropDead({
			...them,
			field: foeField
		}));
		them.field.forEach((unit, index) => {
			const now = foePlayer.field[index];
			if (unit && unit.hp > 0 && (!now || now.hp <= 0)) foePlayer = lockIndex(foePlayer, index);
		});
		next = patch(next, foe, foePlayer);
		const title = all ? "Đại thuỷ triều huỷ diệt" : base ? "Triều lên" : "Con nước lớn tàn phá";
		const tideAims = victims.map((id) => them.field.find((unit) => unit?.uid === (shuntUid(them.field, redirectCover(them.field, id) ?? id) ?? id))).filter((unit) => Boolean(unit));
		const tideRows = tideAims.map((unit) => ({
			name: cardOf(unit).name,
			bits: `${spellLanded(unit, amount, them.field, mon)} sát thương phép`
		}));
		return note(next, aimNotice(title, tideRows) ?? `${title} gây ${spellPhrase(tideAims, amount, them.field, mon)}`, "spell");
	}
	if (mon.cardId === "may-quay-thuong" && skillIndex === 1) {
		if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
		const paid = pay$1(you, 1);
		if (!paid) return note(state, "Cần 1 mana.");
		const amount = (mon.misses ?? 0) + 3;
		const name = castName(mon.cardId, 1);
		const yourField = paid.field.map((unit) => unit?.uid === uid ? {
			...unit,
			dim: true
		} : unit);
		let next = patch(state, side, {
			...paid,
			field: yourField
		});
		if (!targetUid) {
			const them = next.players[foe];
			const dealt = outgoing(mon, amount);
			next = patch(next, foe, {
				...them,
				hp: them.hp - dealt
			});
			return checkWinner(note(next, `${name} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
		}
		const them = next.players[foe];
		const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
		if (!target) return note(state, "Chọn một mục tiêu.");
		const real = shuntUid(them.field, target.uid) ?? target.uid;
		const foeField = them.field.map((unit) => unit?.uid === real ? damageSpell(unit, amount, them.field, mon) : unit);
		next = patch(next, foe, dropDead({
			...them,
			field: foeField
		}));
		const landed = them.field.find((unit) => unit?.uid === real) ?? target;
		return note(next, `${name} gây ${spellLanded(landed, amount, them.field, mon)} sát thương phép.`, "spell");
	}
	return note(state, "Kỹ năng này chưa được gắn vào ván đấu");
}
function answerLegs(state, count) {
	const uid = state.legs;
	if (!uid || state.winner) return {
		...state,
		legs: null
	};
	const side = state.turn;
	const you = state.players[side];
	if (!(you.field.find((unit) => unit?.uid === uid && unit.cardId === "ken-ngai" && unit.hp > 0) ?? null) || count <= 0) return note({
		...state,
		legs: null
	}, "Kén không mọc chân");
	const open = you.field.map((unit, index) => !unit && (you.locked?.[index] ?? 0) === 0 ? index : -1).filter((index) => index >= 0);
	const room = Math.min(1, count, open.length);
	if (room <= 0) return note({
		...state,
		legs: null
	}, "Không còn ô trống để mọc chân");
	if (you.orb < 1) return note({
		...state,
		legs: null
	}, "Cần 1 mana để mọc chân");
	const paid = pay$1(you, 1);
	if (!paid) return note({
		...state,
		legs: null
	}, "Cần 1 mana để mọc chân");
	const field = [...paid.field];
	let seq = state.seq;
	const legHp = skillFigure("chan-ken", "hp", skillFigure("ken-ngai", "hp", 2, 1));
	for (let index = 0; index < room; index += 1) {
		seq += 1;
		const slot = open[index];
		field[slot] = {
			...place({
				...state,
				seq
			}, side, "chan-ken"),
			host: uid,
			hp: legHp,
			maxHp: legHp
		};
	}
	return note(patch({
		...state,
		seq: seq + 1,
		legs: null
	}, side, {
		...paid,
		field
	}), room === 1 ? "Kén mọc một chân" : `Kén mọc ${room} chân`);
}
function followBite(cardId) {
	const hit = /tiêu thêm\s+(\d+)\s*máu/i.exec(skillText(cardId));
	const value = hit ? Number(hit[1]) : 2;
	return Number.isFinite(value) ? value : 2;
}
function lastStrike(cardId) {
	const hit = /tiêu hao thêm\s+(\d+)\s*máu và\s+(\d+)\s*mana[\s\S]*?(\d+)\s*sát thương phép và\s+(\d+)\s*sát thương chuẩn/i.exec(skillText(cardId));
	const hp = hit ? Number(hit[1]) : 3;
	const mana = hit ? Number(hit[2]) : 1;
	const spell = hit ? Number(hit[3]) : 4;
	const tru = hit ? Number(hit[4]) : 3;
	return {
		hp: Number.isFinite(hp) ? hp : 3,
		mana: Number.isFinite(mana) ? mana : 1,
		spell: Number.isFinite(spell) ? spell : 4,
		tru: Number.isFinite(tru) ? tru : 3
	};
}
function armEcho(state, uid) {
	const mon = [...state.players[0].field, ...state.players[1].field].find((unit) => unit?.uid === uid);
	const bite = mon ? followBite(mon.cardId) : 2;
	if (!mon || mon.hp <= bite) return {
		...state,
		echo: null
	};
	return {
		...state,
		echo: uid
	};
}
function armLast(state, uid) {
	const mon = [...state.players[0].field, ...state.players[1].field].find((unit) => unit?.uid === uid);
	if (!mon || mon.hp <= 0) return {
		...state,
		last: null
	};
	const side = state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1;
	const cost = lastStrike(mon.cardId);
	if (mon.hp <= cost.hp || state.players[side].orb < cost.mana) return {
		...state,
		last: null
	};
	return {
		...state,
		last: uid
	};
}
function swordFollow(state, targetUid, committed = false) {
	const uid = state.echo;
	if (!uid || state.winner) return state;
	if (!committed && state.step !== "main") return state;
	const side = state.turn;
	const foe = 1 - side;
	if (!targetUid) return note({
		...state,
		echo: null
	}, `${monsterCard("kiem-si-lua-thieng")?.name ?? ""} không đánh thêm`);
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon) return {
		...state,
		echo: null
	};
	const bite = followBite(mon.cardId);
	if (mon.hp <= bite) return note({
		...state,
		echo: null
	}, `Không đủ máu. Đòn thêm sẽ khiến ${cardOf(mon).name} mất mạng.`);
	const them = state.players[foe];
	const aimed = shuntUid(them.field, redirectCover(them.field, targetUid));
	const target = them.field.find((unit) => unit?.uid === aimed) ?? null;
	if (!target) return note(state, "Chọn một quái đối thủ");
	if (!committed) return beginHold(state, {
		kind: "beam",
		caster: uid,
		target: aimed,
		index: 8
	}, `${cardOf(mon).name} dùng ${castName(mon.cardId, 8)} lên ${cardOf(target).name}.`);
	const amount = skillFigure(mon.cardId, "dmg", 5, 2);
	const yourField = you.field.map((unit) => unit?.uid === uid ? {
		...unit,
		hp: unit.hp - bite
	} : unit);
	const foeField = them.field.map((unit) => unit?.uid === target.uid ? damageSpell(unit, amount, them.field, mon) : unit);
	let next = patch({
		...state,
		echo: null
	}, side, dropDead({
		...you,
		field: yourField
	}));
	next = patch(next, foe, settleCocoon(dropDead({
		...them,
		field: foeField
	})));
	next = note(next, `${castName(mon.cardId, 8)} tiêu thêm ${bite} máu, gây ${spellLanded(target, amount, them.field, mon)} sát thương phép`, "spell");
	return armLast(next, uid);
}
function swordLast(state, targetUid, committed = false) {
	const uid = state.last;
	if (!uid || state.winner) return state;
	if (!committed && state.step !== "main") return state;
	const side = state.turn;
	const foe = 1 - side;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!targetUid) return note({
		...state,
		last: null
	}, `${mon ? cardOf(mon).name : ""} không đánh thêm`);
	if (!mon) return {
		...state,
		last: null
	};
	const cost = lastStrike(mon.cardId);
	if (mon.hp <= cost.hp) return note({
		...state,
		last: null
	}, `Không đủ máu. Hoả thần long sẽ khiến ${cardOf(mon).name} mất mạng.`);
	const them = state.players[foe];
	const aimed = shuntUid(them.field, redirectCover(them.field, targetUid));
	const target = them.field.find((unit) => unit?.uid === aimed) ?? null;
	if (!target) return note(state, "Chọn một quái đối thủ");
	if (!committed) return beginHold(state, {
		kind: "beam",
		caster: uid,
		target: aimed,
		index: 9
	}, `${cardOf(mon).name} dùng ${castName(mon.cardId, 9)} lên ${cardOf(target).name}.`);
	const paid = pay$1(you, cost.mana);
	if (!paid) return note({
		...state,
		last: null
	}, "Cần 1 mana.");
	const pack = shaveHex(mon, {
		spell: cost.spell,
		phys: 0,
		tru: cost.tru
	});
	const truRaw = outgoing(mon, pack.tru) + charmDamage;
	const truNow = target.cardId === "chien-binh-rong" ? third(truRaw) : outgoing(mon, pack.tru);
	const spellDealt = spellLanded(target, pack.spell, them.field, mon);
	const spellShown = Math.max(0, spellDealt - Math.min(phantomPool(target, them.field), spellDealt));
	const truDealt = shownTru(target, hurt(target, truNow), them.field, spellDealt);
	const burned = trueDamage(damageSpell(target, pack.spell, them.field, mon), outgoing(mon, pack.tru), them.field, veilLeft(target, spellDealt));
	const yourField = paid.field.map((unit) => unit?.uid === uid ? {
		...unit,
		hp: unit.hp - cost.hp
	} : unit);
	const foeField = them.field.map((unit) => unit?.uid === target.uid ? burned : unit);
	let next = patch({
		...state,
		last: null
	}, side, dropDead({
		...paid,
		field: yourField
	}));
	next = patch(next, foe, settleCocoon(dropDead({
		...them,
		field: foeField
	})));
	return note(next, `${castName(mon.cardId, 9)} tiêu ${cost.hp} máu và ${cost.mana} mana, gây ${spellShown} sát thương phép và ${truDealt} sát thương chuẩn`, "spell");
}
function setCover(state, uid, on) {
	const side = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== "kizuran") return state;
	if (mon.stun > 0 || (mon.chain ?? 0) > 0) return note(state, `${cardOf(mon).name} đang bị khống chế.`);
	if (on && !you.field.some((unit) => unit && unit.cardId === "kazura" && unit.hp > 0)) return note(state, `Cần ${monsterCard("kazura")?.name} trên sân.`);
	const field = you.field.map((unit) => unit?.uid === uid ? {
		...unit,
		cover: on
	} : unit);
	let next = patch(state, side, {
		...you,
		field
	});
	const pending = next.pending;
	if (on && pending && (pending.kind === "melee" || pending.kind === "gnaw" || pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell")) {
		const aimed = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.target;
		const target = aimed ? [...next.players[0].field, ...next.players[1].field].find((unit) => unit?.uid === aimed) : null;
		if (target?.cardId === "kazura" && you.field.some((unit) => unit?.uid === target.uid)) next = pending.kind === "melee" || pending.kind === "gnaw" ? {
			...next,
			pending: {
				...pending,
				defender: uid
			}
		} : {
			...next,
			pending: {
				...pending,
				target: uid
			}
		};
	}
	return note(next, on ? `${cardOf(mon).name} sẽ đỡ đòn và phép cho ${monsterCard("kazura")?.name}.` : `${cardOf(mon).name} ngừng đỡ.`);
}
function toggleStance(state, uid) {
	if (state.step !== "main" || state.winner) return state;
	const side = state.turn;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.dim || held(mon)) return state;
	if (mon.cardId !== "rong-boc-trung") return note(state, `Chỉ ${monsterCard("rong-boc-trung")?.name ?? ""} đổi được thế.`);
	if (mon.stanceUsed) return note(state, "Mỗi lượt chỉ đổi thế một lần, trước khi tấn công.");
	const stance = mon.stance === "attack" ? "guard" : "attack";
	const field = you.field.map((unit) => unit?.uid === uid ? {
		...unit,
		stance,
		stanceUsed: true
	} : unit);
	return note(patch(state, side, {
		...you,
		field
	}), stance === "guard" ? `${cardOf(mon).name} cuộn thế thủ.` : `${cardOf(mon).name} xòe thế công.`, "heal");
}
function cardStars(id, level = 1) {
	if (id === "te-giac-be-con") {
		const form = [
			"te-giac-be-con",
			"te-giac-hieu-thang",
			"te-giac-chien-binh"
		][Math.min(3, Math.max(1, level)) - 1];
		return monsterCard(form)?.stars ?? 1;
	}
	return monsterCard(id)?.stars ?? 0;
}
function keptField(mon) {
	return !mon.copy && mon.cardId !== "chan-ken" && cardStars(mon.cardId, mon.level ?? 1) > 0;
}
function keptPile(pile) {
	return !pile.saved?.copy && cardStars(pile.id, pile.saved?.level ?? 1) > 0;
}
function recallStars(held) {
	return cardStars(held.id, held.saved?.level ?? 1);
}
function recallFits(caps, stars) {
	return recallLeft(caps, stars).length === caps.length - stars.length;
}
function recallLeft(caps, stars) {
	const left = caps.map((cap, index) => ({
		cap,
		index
	}));
	const used = /* @__PURE__ */ new Set();
	for (const star of [...stars].sort((a, b) => a - b)) {
		const pick = left.filter((item) => !used.has(item.index) && item.cap >= star).sort((a, b) => a.cap - b.cap || a.index - b.index)[0];
		if (!pick) break;
		used.add(pick.index);
	}
	return left.filter((item) => !used.has(item.index)).map((item) => item.cap);
}
function recallCost(stars) {
	return stars.filter((star) => star === 4).length;
}
function recallReady(caps, reserve, picks, mana) {
	const stars = picks.map((index) => recallStars(reserve[index]));
	if (!recallFits(caps, stars) || recallCost(stars) > mana || picks.length > caps.length) return false;
	if (picks.length === caps.length) return true;
	const used = new Set(picks);
	return !reserve.some((held, index) => {
		if (used.has(index)) return false;
		const next = [...stars, recallStars(held)];
		return recallFits(caps, next) && recallCost(next) <= mana;
	});
}
function chooseRecall(reserve, caps, mana) {
	const stars = reserve.map((held) => recallStars(held));
	const limit = Math.min(caps.length, reserve.length);
	const order = stars.map((star, index) => ({
		star,
		index
	})).sort((a, b) => a.star - b.star || a.index - b.index);
	const picked = [];
	for (const item of order) {
		if (picked.length >= limit) break;
		const nextStars = [...picked, item.index].map((index) => stars[index]);
		if (!recallFits(caps, nextStars) || recallCost(nextStars) > mana) continue;
		picked.push(item.index);
	}
	return picked;
}
function confirmRecall(state, indexes) {
	const ask = state.recall;
	if (!ask) return state;
	const side = ask.side;
	const owner = state.players[side];
	const unique = [...new Set(indexes)].filter((index) => index >= 0 && index < owner.reserve.length);
	const stars = unique.map((index) => recallStars(owner.reserve[index]));
	if (!recallReady(ask.caps, owner.reserve, unique, owner.orb)) return note(state, "Chọn chưa đúng số quái hoặc vượt sao đã thu.");
	const cost = recallCost(stars);
	const before = owner.stars;
	const paid = cost > 0 ? pay$1(owner, cost) : owner;
	if (!paid) return note(state, "Không đủ mana cho quái 4 sao.");
	const slots = [
		0,
		1,
		2
	].filter((index) => !paid.field[index] && (paid.locked?.[index] ?? 0) === 0);
	const field = [...paid.field];
	const used = /* @__PURE__ */ new Set();
	let seq = state.seq;
	unique.slice(0, slots.length).forEach((index, at) => {
		const held = paid.reserve[index];
		field[slots[at]] = {
			...place({
				...state,
				seq
			}, side, held.id, held),
			dim: true
		};
		seq += 1;
		used.add(index);
	});
	const reserve = paid.reserve.filter((_, index) => !used.has(index));
	const placed = shuffleSea({
		...paid,
		field,
		reserve
	});
	const marked = patch({
		...state,
		seq,
		recall: null
	}, side, placed);
	const line = used.size > 0 ? `Đưa ${used.size} quái ra sân.` : "Không đưa quái ra sân.";
	return note(pingStars(marked, side, before, placed.stars), line, "spell");
}
function watchedOneStar(state, side) {
	const pending = state.pending;
	if (!pending) return null;
	const uid = pending.kind === "melee" || pending.kind === "gnaw" ? state.hold?.blocker ?? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? state.hold?.blocker ?? pending.target : pending.kind === "face" ? state.hold?.blocker ?? null : null;
	if (!uid) return null;
	const mon = state.players[side].field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || cardStars(mon.cardId, mon.level ?? 1) !== 1) return null;
	return mon;
}
function corrodeSide(state, foe) {
	const player = state.players[foe];
	const pool = [];
	player.monsterDeck.forEach((card, index) => {
		if (cardStars(card.id, card.saved?.level ?? 1) >= 3) pool.push({
			zone: "deck",
			index,
			id: card.id
		});
	});
	player.reserve.forEach((card, index) => {
		if (cardStars(card.id, card.saved?.level ?? 1) >= 3) pool.push({
			zone: "reserve",
			index,
			id: card.id
		});
	});
	player.field.forEach((mon, index) => {
		if (mon && mon.hp > 0 && cardStars(mon.cardId, mon.level ?? 1) >= 3) pool.push({
			zone: "field",
			index,
			id: mon.cardId,
			uid: mon.uid
		});
	});
	if (pool.length === 0) return {
		state,
		line: ""
	};
	const pick = pool[Math.floor(Math.random() * pool.length)];
	const dmg = (pick.zone === "field" ? cardStars(pick.id, player.field[pick.index]?.level ?? 1) : cardStars(pick.id, (pick.zone === "deck" ? player.monsterDeck[pick.index] : player.reserve[pick.index])?.saved?.level ?? 1)) >= 4 ? 2 : 1;
	const name = monsterCard(pick.id)?.name ?? "quái";
	const previous = charmDamage;
	charmDamage = 0;
	try {
		if (pick.zone === "field") {
			const mon = player.field[pick.index];
			if (!mon) return {
				state,
				line: ""
			};
			const lineN = shownTru(mon, dmg, player.field);
			const hurtMon = trueDamage(mon, dmg, player.field);
			const field = player.field.map((unit, index) => index === pick.index ? hurtMon : unit);
			return {
				state: patch(state, foe, dropDead({
					...player,
					field
				})),
				line: hurtMon.hp <= 0 ? `Virus ăn mòn tiêu diệt ${name}` : `Virus ăn mòn gây ${lineN} sát thương chuẩn lên ${name}`
			};
		}
		if (pick.zone === "deck") {
			const held = woundPile(player.monsterDeck[pick.index], dmg);
			const monsterDeck = held ? player.monsterDeck.map((card, index) => index === pick.index ? held : card) : player.monsterDeck.filter((_, index) => index !== pick.index);
			const line = held ? `Virus ăn mòn gây ${dmg} sát thương chuẩn lên ${name} trong bộ bài` : `Virus ăn mòn tiêu diệt ${name} trong bộ bài`;
			return {
				state: patch(state, foe, {
					...player,
					monsterDeck
				}),
				line
			};
		}
		const held = woundPile(player.reserve[pick.index], dmg);
		const reserve = held ? player.reserve.map((card, index) => index === pick.index ? held : card) : player.reserve.filter((_, index) => index !== pick.index);
		const line = held ? `Virus ăn mòn gây ${dmg} sát thương chuẩn lên ${name}` : `Virus ăn mòn tiêu diệt ${name}`;
		return {
			state: patch(state, foe, {
				...player,
				reserve
			}),
			line
		};
	} finally {
		charmDamage = previous;
	}
}
function igniteVirus(state, owner) {
	const tick = corrodeSide(state, 1 - owner);
	const extra = tick.line ? `Virus ăn mòn bắt đầu. ${tick.line}` : "Virus ăn mòn bắt đầu.";
	return {
		...tick.state,
		virusArm: null,
		virus: { owner },
		live: `${state.live} ${extra}`.trim(),
		log: [...state.log, extra]
	};
}
function reapVirus(state) {
	const arm = state.virusArm;
	if (!arm) return state;
	if (state.players.some((player) => player.field.some((mon) => mon?.uid === arm.uid && mon.hp > 0))) {
		if (state.step === "respond" && state.pending) return state;
		return {
			...state,
			virusArm: null
		};
	}
	return igniteVirus({
		...state,
		virusArm: null
	}, arm.owner);
}
function virusTick(state) {
	if (!state.virus) return {
		state,
		line: ""
	};
	return corrodeSide(state, 1 - state.virus.owner);
}
function erosionTick(state) {
	let next = state;
	const bits = [];
	for (const side of [0, 1]) {
		const player = next.players[side];
		let touched = false;
		const hops = [];
		let settled = player.field.map((mon) => {
			if (!mon?.erode && !mon?.poison) return mon;
			touched = true;
			let nextMon = mon;
			let moved = 0;
			const legs = mon.cardId === "ken-ngai" ? livingLegs(player.field, mon.uid) : [];
			const relay = legs.length > 0 ? legs[Math.floor(Math.random() * legs.length)].uid : "";
			if (mon.erode) {
				const amount = state.turn === mon.erode.from ? 1 : 2;
				const left = mon.erode.left === null ? null : mon.erode.left - 1;
				nextMon = {
					...nextMon,
					erode: left === 0 ? void 0 : {
						from: mon.erode.from,
						left
					}
				};
				if (relay) moved += amount;
				else nextMon = trueDamage(nextMon, amount, player.field);
				bits.push(nextMon.hp <= 0 ? `${cardOf(mon).name} chết vì bào mòn` : `${cardOf(mon).name} bị bào mòn ${amount + charmDamage}`);
			}
			if (nextMon.hp > 0 && nextMon.poison) {
				const poison = nextMon.poison;
				const doubled = poison.perfect && state.turn !== poison.from;
				const amount = poison.stacks * (doubled ? 2 : 1);
				const left = poison.left === null ? null : poison.left - 1;
				nextMon = {
					...nextMon,
					poison: left === 0 ? void 0 : {
						...poison,
						left
					}
				};
				if (relay) moved += amount;
				else nextMon = trueDamage(nextMon, amount, player.field);
				bits.push(nextMon.hp <= 0 ? `${cardOf(mon).name} chết vì độc` : `${cardOf(mon).name} trúng độc ${amount + charmDamage}`);
			}
			if (relay && moved > 0) hops.push({
				uid: relay,
				amount: moved
			});
			return nextMon;
		});
		for (const hop of hops) {
			const leg = settled.find((unit) => unit?.uid === hop.uid);
			if (!leg || leg.hp <= 0) continue;
			const hurt = trueDamage(leg, hop.amount, settled);
			settled = settled.map((unit) => unit?.uid === hop.uid ? hurt : unit);
			bits.push(hurt.hp <= 0 ? `${cardOf(leg).name} gánh đòn cho kén và gục` : `${cardOf(leg).name} gánh ${hop.amount} đòn cho kén`);
		}
		if (touched) next = patch(next, side, settleCocoon(dropDead({
			...player,
			field: settled
		})));
	}
	return {
		state: next,
		line: bits.join(" ")
	};
}
function turnStamp(state, uid) {
	const history = state.history ?? [];
	const ago = history.length >= 3 ? history[0] : void 0;
	if (ago?.[uid]) return ago[uid];
	const born = state.born?.[uid];
	return born ? {
		...born,
		born: true
	} : null;
}
function rewindAlly(state, side, uid) {
	const player = state.players[side];
	const from = player.field.findIndex((mon) => mon?.uid === uid);
	const stamp = turnStamp(state, uid);
	if (from < 0 || !stamp) return null;
	const body = {
		...structuredClone(stamp.mon),
		uid
	};
	const field = [...player.field];
	const to = stamp.slot;
	if (from !== to) {
		field[from] = field[to] ?? null;
		field[to] = body;
	} else field[from] = body;
	return patch(state, side, {
		...player,
		field
	});
}
function stampTurn(state) {
	const now = {};
	for (const team of state.players) team.field.forEach((mon, slot) => {
		if (!mon) return;
		now[mon.uid] = {
			mon: structuredClone(mon),
			slot
		};
	});
	const history = [...state.history ?? []];
	if (state.now) history.push(state.now);
	const kept = history.slice(-3);
	return {
		...state,
		past: kept[kept.length - 1] ?? {},
		history: kept,
		now,
		clock: (state.clock ?? 1) + 1
	};
}
function settleDragonDebt(state) {
	const bits = [];
	let next = state;
	for (const side of [0, 1]) {
		let field = next.players[side].field;
		for (const mon of field) {
			if (!mon || mon.cardId !== "chien-binh-rong" || mon.hp <= 0 || !mon.debt) continue;
			const due = mon.debt[0];
			const rest = mon.debt[1];
			if (due.p + due.s + due.t + rest.p + rest.s + rest.t <= 0) continue;
			const p = Math.max(0, due.p - liveDef(mon, field));
			const s = Math.max(0, due.s - liveMdef(mon, field));
			const dealt = hurt(mon, p) + hurt(mon, s) + hurt(mon, due.t);
			const shifted = {
				...mon,
				debt: rest.p + rest.s + rest.t > 0 ? [rest, {
					p: 0,
					s: 0,
					t: 0
				}] : void 0
			};
			const spellN = hurt(mon, s);
			const physN = hurt(mon, p);
			const truN = hurt(mon, due.t);
			const pool = phantomPool(mon, field);
			const hit = applyIncoming(shifted, dealt, field);
			field = field.map((unit) => unit?.uid === mon.uid ? hit.mon : unit);
			const spellOut = Math.max(0, spellN - Math.min(pool, spellN));
			const afterSpell = Math.max(0, pool - spellN);
			const physOut = Math.max(0, physN - Math.min(afterSpell, physN));
			const truOut = Math.max(0, truN - Math.max(0, afterSpell - physN));
			const parts = [
				p > 0 ? `${physOut} sát thương vật lý` : "",
				s > 0 ? `${spellOut} sát thương phép` : "",
				due.t > 0 ? `${truOut} sát thương chuẩn` : ""
			].filter(Boolean);
			if (parts.length) bits.push(`${cardOf(mon).name} nhận ${parts.join(", ")}`);
			if (hit.mon.hp <= 0) bits.push(`${cardOf(mon).name} bị hạ`);
		}
		next = patch(next, side, dropDead({
			...next.players[side],
			field
		}));
	}
	return {
		state: next,
		line: bits.join(". ")
	};
}
function endTurn(state) {
	const next = endTurnCore(state);
	if (next === state) return next;
	if (next.turn === state.turn && next.winner === state.winner && next.step === state.step) return next;
	return withResults(state, traced(state, next, {
		kind: "end-turn",
		actor: state.turn,
		ok: true,
		cardId: null,
		target: null,
		end: null
	}), {
		blocked: false,
		reflect: false,
		turn: true
	});
}
function endTurnCore(state) {
	const locked = talkLock(state);
	if (locked) return locked;
	if (state.step !== "main" || state.winner || state.recall) return state;
	const waiting = needUpkeep(state);
	if (waiting) return waiting;
	state = releaseLegend({
		...state,
		echo: null,
		last: null
	});
	const side = state.turn;
	const foe = 1 - side;
	const vowHeals = [];
	let current = state.players[side];
	current = {
		...current,
		field: current.field.map((mon) => {
			if (!mon || mon.copy) return null;
			if (mon.cardId === PREY && mon.preyAim) return null;
			const heal = (mon.cardId === "rong-boc-trung" && mon.stance === "guard" ? skillFigure(mon.cardId, "heal", 3) : 0) + (mon.cardId === "ken-ngai" || mon.cardId === "chan-ken" ? skillFigure(mon.cardId, "heal", 1) : 0);
			const clown = mon.cardId === "ga-he-dang-so";
			const rabbit = mon.cardId === "tho-den-tinh-nghich";
			const charge = clown ? mon.held ? mon.charge + 1 : 0 : rabbit ? 0 : mon.charge;
			const cap = mon.maxHp || mon.hp;
			const next = {
				...mon,
				dim: mon.cardId === "ken-ngai" || mon.cardId === "chan-ken" ? true : clown,
				charge,
				held: false,
				stanceUsed: false,
				noBlock: isStill(mon.cardId) ? true : false,
				chain: Math.max(0, (mon.chain ?? 0) - 1),
				gag: Math.max(0, (mon.gag ?? 0) - 1),
				shown: (mon.shown ?? 0) > 1 ? (mon.shown ?? 0) - 1 : void 0,
				stored: mon.cardId === SHADE && (mon.shown ?? 0) === 1 ? void 0 : mon.stored,
				hp: Math.min(cap, mon.hp + heal),
				stun: Math.max(0, mon.stun - 1),
				hex: mon.hex && mon.hex.left > 1 ? { left: mon.hex.left - 1 } : void 0,
				vulnerable: Math.max(0, mon.vulnerable - 1),
				safe: Math.max(0, (mon.safe ?? 0) - 1),
				hornNew: false,
				wet: mon.wet && mon.wet < 90 ? Math.max(0, mon.wet - 1) : mon.wet,
				blessAtk: 0,
				blessDmg: 0,
				nextDef: 0,
				tempGuard: 0,
				seized: void 0
			};
			if (mon.hp > 0 && (mon.fed ?? 0) > 0 && ((mon.path ?? 0) > 0 || mon.cardId === "chien-binh-huyen-thoai")) vowHeals.push({
				uid: mon.uid,
				n: mon.fed ?? 0
			});
			return settleGuard(settleVow(next));
		}).map((mon) => mon ? fadeBuff(mon) : mon),
		attackLock: Math.max(0, current.attackLock - 1),
		mirror: Math.max(0, current.mirror - 1),
		locked: (current.locked ?? [
			0,
			0,
			0
		]).map((left) => Math.max(0, left - 1)),
		draws: 0,
		summons: 0,
		aside: 0,
		turns: (current.turns ?? 0) + 1,
		reserve: current.reserve.map((pile) => pile.freeAt == null ? pile : {
			...pile,
			freeAt: void 0
		})
	};
	let next = patch(state, side, current);
	const incoming = next.players[foe];
	const drawBan = incoming.drawBan ?? 0;
	const angels = incoming.field.filter((mon) => mon?.cardId === "quai-thu-thien-su").length;
	const incomingMana = pour(incoming.orb, incoming.flask, 1 + angels);
	const capped = incomingMana.orb >= 3 && incomingMana.flask >= 1;
	const usedRelease = Boolean(next.gemUsed?.[foe]);
	const warnedRelease = Boolean(next.gemWarned?.[foe]);
	const staying = next.players[side];
	const stayMana = pour(staying.orb, staying.flask, 1);
	next = patch(next, side, {
		...staying,
		...stayMana
	});
	next = patch(next, foe, {
		...incoming,
		...incomingMana,
		draws: 0,
		drawLock: drawBan > 0,
		drawBan: drawBan > 0 ? drawBan - 1 : 0,
		summons: 0,
		aside: 0,
		acted: false,
		attackLock: Math.max(0, incoming.attackLock - 1),
		mirror: Math.max(0, incoming.mirror - 1),
		field: incoming.field.map((mon) => {
			if (!mon) return mon;
			const cocoon = mon.cardId === "ken-ngai" || mon.cardId === "chan-ken";
			const cap = mon.maxHp || mon.hp;
			const faded = fadeBuff({
				...mon,
				dim: mon.cardId === "ken-ngai" || mon.cardId === "chan-ken" ? true : false,
				noBlock: isStill(mon.cardId) ? true : mon.noBlock,
				charge: mon.cardId === "tho-den-tinh-nghich" ? 0 : mon.charge,
				hp: cocoon ? Math.min(cap, mon.hp + skillFigure(mon.cardId, "heal", 1)) : mon.hp,
				level: mon.cardId === "ken-ngai" ? (mon.level ?? 0) + 1 : mon.level,
				stun: Math.max(0, mon.stun - 1),
				hex: mon.hex && mon.hex.left > 1 ? { left: mon.hex.left - 1 } : void 0,
				vulnerable: Math.max(0, mon.vulnerable - 1),
				chain: Math.max(0, (mon.chain ?? 0) - 1),
				gag: Math.max(0, (mon.gag ?? 0) - 1),
				shown: mon.cardId === SHADE ? mon.shown : (mon.shown ?? 0) > 1 ? (mon.shown ?? 0) - 1 : void 0,
				safe: Math.max(0, (mon.safe ?? 0) - 1),
				wet: mon.wet && mon.wet < 90 ? Math.max(0, mon.wet - 1) : mon.wet,
				spun: false,
				tempGuard: 0
			});
			if (mon.hp > 0 && (mon.fed ?? 0) > 0 && ((mon.path ?? 0) > 0 || mon.cardId === "chien-binh-huyen-thoai")) vowHeals.push({
				uid: mon.uid,
				n: mon.fed ?? 0
			});
			return freeCage(settleGuard(settleVow(faded)));
		})
	});
	const bloomed = bloomCocoons(next.players[foe]);
	next = patch(next, foe, shuffleSea(bloomed.player));
	const demonOwner = next.players[foe];
	const dueNow = nextUpkeep(demonOwner.field);
	next = {
		...next,
		turn: foe,
		opening: false,
		step: "main",
		pending: null,
		hold: null,
		log: [],
		live: "",
		starPing: null,
		stepNo: 0,
		upkeep: dueNow?.uid ?? null,
		gemCap: capped && !usedRelease ? foe : null,
		gemWarn: capped && usedRelease && !warnedRelease ? foe : null
	};
	const eroded = erosionTick(next);
	const virused = virusTick(eroded.state);
	let startedTurn = virused.state;
	for (const at of [0, 1]) {
		const board = startedTurn.players[at];
		if (!board.hats) continue;
		startedTurn = patch(startedTurn, at, {
			...board,
			field: mixRow(board.field)
		});
	}
	const owed = settleDragonDebt(startedTurn);
	startedTurn = owed.state;
	const due = [
		angels > 0 ? `${sideName(foe)} bắt đầu lượt. Quái thú thiên sứ cho thêm ${angels} gem.` : `${sideName(foe)} bắt đầu lượt.`,
		dueNow?.cardId === "trieu-hoi-ac-ma" ? `${cardOf(dueNow).name} thiếu sao phải trả khế ước: 1 mana, hoặc rời sân.` : "",
		angels > 0 ? "Quái thú thiên sứ cần cầu nguyện: tiêu 1 mana, hoặc rời sân." : ""
	].filter(Boolean).join(" ");
	const vowNames = [0, 1].flatMap((at) => state.players[at].field.filter((mon) => mon && (mon.path ?? 0) === 1 && mon.hp > 0).map((mon) => cardOf(mon).name));
	const vowLine = vowNames.length ? `${vowNames.join(", ")} thành Chiến binh huyền thoại. Hồi đầy máu và gỡ hết trạng thái xấu.` : "";
	const healLine = vowHeals.map((row) => {
		const mon = state.players[0].field.find((unit) => unit?.uid === row.uid) ?? state.players[1].field.find((unit) => unit?.uid === row.uid);
		return mon ? `${cardOf(mon).name} hồi ${row.n} máu` : "";
	}).filter(Boolean).join(". ");
	const offered = offerPrey(startedTurn);
	startedTurn = offered.state;
	const extra = [
		vowLine,
		healLine,
		bloomed.line,
		eroded.line,
		virused.line,
		owed.line,
		offered.line
	].filter(Boolean).join(" ");
	const mute = startedTurn.players[foe].drawLock ? " Lượt này không được rút bài." : "";
	const noted = note(stampTurn(startedTurn), extra ? `${due}${mute} ${extra}` : `${due}${mute}`);
	const mends = [...noted.mends ?? [], ...vowHeals];
	return mends.length ? {
		...noted,
		mends
	} : noted;
}
function summonAside(state) {
	const player = state.players[state.turn];
	if ((player.aside ?? 0) >= 1) return null;
	const index = player.reserve.findIndex((held) => held.id === "phu-thuy-thoi-gian");
	if (index < 0) return null;
	const held = player.reserve[index];
	const card = monsterCard(held.id);
	if (!card || player.stars < card.stars) return null;
	if (playBill(card.gems, Boolean(held.toll), player.orb, player.flask)) return null;
	const slot = [
		0,
		1,
		2
	].find((index) => !player.field[index] && (player.locked?.[index] ?? 0) === 0);
	if (slot === void 0) return null;
	const next = summon(state, index, slot);
	return next.players[state.turn].field[slot]?.cardId === "phu-thuy-thoi-gian" ? next : null;
}
function summonBias(opening, oneStar, lean) {
	if (!opening) return "atk";
	if (lean.ready && lean.lowStar > 0) return "low";
	if (lean.ready && lean.lowStar < 0) return "high";
	return oneStar ? "low" : "atk";
}
function learnedDraw(me, board, style, lean) {
	if (lean.ready && lean.spell > 0 && me.spellDeck.length > 0 && (board > 0 || me.monsterDeck.length === 0)) return "spell";
	if (lean.ready && lean.spell < 0 && me.monsterDeck.length > 0) return "monster";
	if (style.spellDraw === false && me.monsterDeck.length > 0) return "monster";
	if (style.spellDraw === true && me.spellDeck.length > 0 && (board > 0 || me.monsterDeck.length === 0)) return "spell";
	if (board > 0 && style.spellDraw !== false && (me.stars >= 1 || me.monsterDeck.length === 0) && me.spellDeck.length > 0) return "spell";
	if (me.monsterDeck.length > 0 && me.stars < 2) return "monster";
	if (me.spellDeck.length > 0) return "spell";
	if (me.monsterDeck.length > 0) return "monster";
	return null;
}
function summonPick(state, bias) {
	const player = state.players[state.turn];
	const pick = player.reserve.map((held, index) => ({
		id: held.id,
		index,
		toll: Boolean(held.toll),
		card: monsterCard(held.id)
	})).filter((row) => {
		if (!row.card) return false;
		const ready = row.id === "trieu-hoi-ac-ma" ? player.stars >= 3 : player.stars >= row.card.stars;
		const held = player.reserve[row.index];
		const entry = row.id === "trieu-hoi-ac-ma" && player.stars === 3 && !held?.saved?.seen ? 1 : 0;
		return ready && player.orb + player.flask >= entry && playBill(row.card.gems, row.toll, Math.max(0, player.orb - entry), player.flask) === null;
	}).sort((a, b) => {
		if (bias !== "atk" && a.card && b.card && a.card.stars !== b.card.stars) return bias === "low" ? a.card.stars - b.card.stars : b.card.stars - a.card.stars;
		return (b.card?.atk ?? 0) - (a.card?.atk ?? 0);
	})[0];
	if (!pick) return null;
	const slot = player.field.findIndex((cell) => !cell);
	if (slot < 0) return null;
	return summon(state, pick.index, slot);
}
function develop(state) {
	const me = state.players[state.turn];
	const style = readStyle();
	const lean = state.adapt ?? readLean();
	const board = me.field.filter(Boolean).length;
	const opening = (me.turns ?? 0) < 3;
	if (!opening && !(style.flood && me.summons < 1 && board < 3)) return null;
	const canDraw = !me.drawLock && me.draws < 1 && me.orb >= 1;
	const bias = summonBias(opening, style.oneStar, lean);
	if (!(lean.ready && lean.summon < 0 && board > 0) && me.summons < 1 && board < 3 && (board === 0 || style.flood || bias === "low" || me.stars >= 2)) {
		const called = summonPick(state, bias);
		if (called) return called;
	}
	const eager = lean.ready && lean.spend !== 0 ? lean.spend > 0 : style.spendAll;
	if (canDraw && (opening ? eager || me.stars < 2 : me.stars < 2)) {
		const kind = learnedDraw(me, board, style, lean);
		if (kind) return draw(state, kind);
	}
	if (me.summons < 1 && board < 3) return summonPick(state, bias);
	if (board < 3) return summonAside(state);
	return null;
}
function answerGemCap(state, yes) {
	if (state.gemCap !== state.turn || state.winner) return state;
	const side = state.turn;
	const you = state.players[side];
	if (!yes) return note({
		...state,
		gemCap: null
	}, "Giữ nguyên cầu ma lực.");
	if (you.orb < 3 || you.flask < 1) return note({
		...state,
		gemCap: null
	}, "Không đủ mana để giải phóng.");
	const before = you.stars;
	const player = {
		...grantUsed(you, 2),
		orb: you.orb - 3 + 1,
		flask: you.flask - 1
	};
	const used = state.gemUsed ?? [false, false];
	const gemUsed = [used[0], used[1]];
	gemUsed[side] = true;
	return note(pingStars(patch({
		...state,
		gemCap: null,
		gemUsed
	}, side, player), side, before, player.stars), "Giải phóng cầu ma lực. Mất 3 mana, nhận 2 mana đã sử dụng, 1 mana bình vào cầu.");
}
function answerGemWarn(state) {
	if (state.gemWarn !== state.turn || state.winner) return state;
	const warned = state.gemWarned ?? [false, false];
	const gemWarned = [warned[0], warned[1]];
	gemWarned[state.turn] = true;
	return note({
		...state,
		gemWarn: null,
		gemWarned
	}, "Bạn chỉ được dùng \"Giải phóng ma lực\" 1 lần trong mỗi trận đấu. Hãy cẩn thận với lượng ma lực đang quá tải của mình.");
}
function answerUpkeep(state, keepIt) {
	const next = answerUpkeepCore(state, keepIt);
	if (next === state) return next;
	const uid = state.upkeep;
	const mon = uid ? state.players[state.turn].field.find((unit) => unit?.uid === uid && dueUpkeep(unit)) ?? null : null;
	if (!mon) return next;
	const stayed = next.players[state.turn].field.some((unit) => unit?.uid === mon.uid);
	return traced(state, next, {
		kind: "upkeep",
		actor: state.turn,
		ok: keepIt ? stayed : true,
		cardId: mon.cardId,
		target: null,
		end: null
	});
}
function answerUpkeepCore(state, keepIt) {
	const scrubbed = scrubUpkeep(state);
	const uid = scrubbed.upkeep;
	if (!uid || scrubbed.winner) return scrubbed;
	const side = scrubbed.turn;
	const you = scrubbed.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid && dueUpkeep(unit)) ?? null;
	if (!mon) return scrubbed;
	const paid = keepIt ? pay$1(you, 1) : null;
	let next = patch(scrubbed, side, paid ?? {
		...you,
		field: you.field.map((unit) => unit?.uid === uid ? null : unit)
	});
	const another = nextUpkeep(next.players[side].field, uid);
	next = {
		...next,
		upkeep: another?.uid ?? null
	};
	const name = cardOf(mon).name;
	const kept = mon.cardId === "quai-thu-thien-su" ? `${name} được cầu nguyện` : `${name} được duy trì`;
	return note(next, paid ? kept : keepIt ? `Không đủ 1 mana. ${name} rời sân` : `${name} rời sân`);
}
function primeKnight(state, uid, picks) {
	const side = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const you = state.players[side];
	const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
	if (!mon || mon.cardId !== "ky-si-bong-toi" || (mon.path ?? 0) > 0) return state;
	const unique = [...new Set(picks)].slice(0, 2);
	const clash = {
		atk: 0,
		def: 0,
		maxHp: 0
	};
	let hp = mon.hp;
	let maxHp = mon.maxHp || mon.hp;
	for (const pick of unique) {
		if (pick === "atk") clash.atk += skillFigure(mon.cardId, "atk", 3);
		if (pick === "def") clash.def += skillFigure(mon.cardId, "def", 2);
		if (pick === "hp") {
			const bonus = skillFigure(mon.cardId, "max", 2);
			clash.maxHp += bonus;
			maxHp += bonus;
			hp += bonus;
		}
	}
	const field = you.field.map((unit) => unit?.uid === uid ? {
		...unit,
		hp,
		maxHp,
		clash
	} : unit);
	const bits = unique.map((pick) => pick === "atk" ? `+${clash.atk} công` : pick === "def" ? `+${clash.def} thủ` : `+${clash.maxHp} máu tối đa`);
	const name = cardOf(mon).name;
	const line = bits.length > 0 ? `${name} nhận ${bits.join(", ")} cho lần giáp lá cà này` : `${name} không đổi chỉ số`;
	return note(patch(state, side, {
		...you,
		field
	}), line);
}
function answerFairy(state, allyUid, yes) {
	if (state.parley && state.step === "respond") return freeTalk(state, (next) => answerFairy(next, allyUid, yes));
	if (!yes) return state;
	const side = state.players[0].field.some((mon) => mon?.uid === allyUid) ? 0 : 1;
	const you = state.players[side];
	const fairy = you.field.find((mon) => mon?.cardId === "yeu-tinh-chuc-phuc" && !mon.dim && mon.stun === 0) ?? null;
	const ally = you.field.find((mon) => mon?.uid === allyUid) ?? null;
	if (!fairy || !ally) return state;
	const paid = pay$1(you, skillManaCost("yeu-tinh-chuc-phuc", 1));
	if (!paid) return note(state, "Cần 1 mana.");
	const heal = skillFigure("yeu-tinh-chuc-phuc", "heal", 3);
	const guard = skillFigure("yeu-tinh-chuc-phuc", "guard", 1);
	const cap = ally.maxHp || ally.hp;
	const field = paid.field.map((mon) => {
		if (!mon) return mon;
		if (mon.uid === fairy.uid && mon.uid === ally.uid) return {
			...mon,
			dim: true,
			hp: Math.min(cap, mon.hp + heal),
			tempGuard: mon.cage ? mon.tempGuard : (mon.tempGuard ?? 0) + guard
		};
		if (mon.uid === fairy.uid) return {
			...mon,
			dim: true
		};
		if (mon.uid === ally.uid) return {
			...mon,
			hp: Math.min(cap, mon.hp + heal),
			tempGuard: mon.cage ? mon.tempGuard : (mon.tempGuard ?? 0) + guard
		};
		return mon;
	});
	return note(patch(state, side, {
		...paid,
		field
	}), `${cardOf(ally).name} được ${cardOf(fairy).name} hồi ${heal} và +${guard} phòng ngự`, "heal");
}
function armHorn(state, uid, mode) {
	const side = state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1;
	const you = state.players[side];
	const field = you.field.map((mon) => mon?.uid === uid && mon.horn ? {
		...mon,
		horn: mode,
		hornNew: false
	} : mon);
	return patch(state, side, {
		...you,
		field
	});
}
function dismissGlimpse(state) {
	return {
		...state,
		glimpse: null
	};
}
function threatRank(mon) {
	if (mon.cardId === "cuc-bong-ma-quai" && !mon.copy) return 130;
	if (mon.cardId === "quai-thu-thien-su") return 120;
	if (mon.cardId === "ga-he-dang-so" && mon.charge >= 2) return 110;
	if (mon.cardId === "ga-he-dang-so" && mon.charge >= 1) return 100;
	if (mon.cardId === "phu-thuy-thoi-gian") return 40;
	return monsterCard(mon.cardId)?.atk ?? 0;
}
function mustKill(mon) {
	return mon.cardId === "cuc-bong-ma-quai" && !mon.copy || mon.cardId === "quai-thu-thien-su" || mon.cardId === "ga-he-dang-so" && mon.charge >= 1;
}
function spellHurt(mon, amount) {
	return hurt(mon, Math.max(0, amount - liveMdef(mon)));
}
function clashCost(attacker, defender) {
	const deal = hurt(defender, physical(outgoing(attacker, attacker.atk), defender.def));
	const take = hurt(attacker, physical(outgoing(defender, defender.atk), attacker.def));
	return {
		deal,
		take,
		kill: deal >= defender.hp && deal > 0,
		suicide: take >= attacker.hp && take > 0
	};
}
function withLive(next) {
	const last = next.log.at(-1) ?? "";
	return {
		...next,
		live: last || next.live
	};
}
function progress(state, next) {
	if (next.players[0] === state.players[0] && next.players[1] === state.players[1] && next.step === state.step && next.pending === state.pending && next.turn === state.turn) return null;
	return next;
}
function chooseBlock(state) {
	const pending = state.pending;
	if (!pending || pending.kind !== "face") return {
		uid: null,
		skill: false
	};
	const options = state.players[1].field.filter((mon) => Boolean(mon && !mon.dim && mon.stun === 0 && !mon.noBlock && !(mon.path ?? 0)));
	if (options.length === 0) return {
		uid: null,
		skill: false
	};
	const style = readStyle();
	const skillOf = (mon) => mon.cardId === "chien-si-gam-nham" && state.players[1].orb >= skillManaCost(mon.cardId);
	const attacker = state.players[0].field.find((mon) => mon?.uid === pending.attacker) ?? null;
	if (!attacker) return {
		uid: null,
		skill: false
	};
	let best = null;
	let bestScore = -Infinity;
	for (const mon of options) {
		if (smashPlain(mon) && state.players[1].orb < 1) continue;
		if (mon.cardId === GUARD_KNIGHT && state.players[1].orb < 1) continue;
		const hit = clashCost(attacker, mon);
		let score = attacker.atk * 2;
		if (hit.kill && !hit.suicide) score += 80;
		else if (!hit.suicide) score += 30 - hit.take;
		else score -= 50 + threatRank(mon);
		if (mustKill(mon) && hit.suicide) score -= 80;
		if (score > bestScore) {
			best = mon;
			bestScore = score;
		}
	}
	if (!best) return {
		uid: null,
		skill: false
	};
	if (style.blockEager === true) return {
		uid: best.uid,
		skill: skillOf(best)
	};
	if (bestScore < attacker.atk) return {
		uid: null,
		skill: false
	};
	if (style.blockEager === false && bestScore < attacker.atk * 2) return {
		uid: null,
		skill: false
	};
	return {
		uid: best.uid,
		skill: skillOf(best)
	};
}
function gnawWorth(state) {
	const pending = state.pending;
	if (pending?.kind === "gnaw-skill") {
		const ownerSide = state.players[0].field.some((mon) => mon?.uid === pending.target) ? 0 : 1;
		return state.players[ownerSide].orb >= skillManaCost("chien-si-gam-nham");
	}
	if (pending?.kind !== "gnaw" && pending?.kind !== "melee") return false;
	const defenderUid = pending.kind === "melee" ? state.hold?.blocker ?? pending.defender : pending.defender;
	const attacker = state.players[state.turn].field.find((mon) => mon?.uid === pending.attacker) ?? null;
	const defender = state.players[1 - state.turn].field.find((mon) => mon?.uid === defenderUid) ?? null;
	const bonus = skillHpBonus("chien-si-gam-nham");
	if (!attacker || !defender || state.players[1 - state.turn].orb < skillManaCost("chien-si-gam-nham")) return false;
	const before = clashCost(attacker, defender);
	const after = clashCost(attacker, {
		...defender,
		def: defender.def * 2,
		hp: defender.hp + bonus
	});
	return before.kill && !after.kill || after.take < before.take;
}
function aiStep(state) {
	if (state.mode !== "ai" || state.winner !== null || state.reel) return state;
	if (state.parley && state.step === "main") {
		const picker = parleyPicker(state);
		if (picker !== 1) return state;
		const talk = state.parley;
		const options = state.players[picker].field.filter((mon) => Boolean(mon && mon.hp > 0 && mon.cardId !== "mu" && !(talk.kind === "mystic" && talk.step === "pick-victim" && mon.uid === talk.queen)));
		if (options.length === 0 && talk.kind === "mystic" && talk.step === "pick-victim") return withLive(pickParley(state, "face"));
		const lunging = talk.step === "pick-lunger" || talk.step === "pick-lunger2";
		const pick = [...options].sort((a, b) => lunging ? b.atk - a.atk : a.hp - b.hp)[0];
		if (!pick) return {
			...state,
			parley: null
		};
		return withLive(pickParley(state, pick.uid));
	}
	if (state.birdAsk && state.players[1].field.some((mon) => mon?.uid === state.birdAsk?.uid)) return withLive(evolveBird(state, "nu-chua-dieu-nhan"));
	if (state.plumeAsk && state.turn === 1) return withLive(answerPlume(state, state.players[1].orb >= harpyKit(state.players[1].field.find((mon) => mon?.uid === state.plumeAsk?.bird)?.cardId ?? "").lash));
	if (state.recall?.side === 1) return withLive(confirmRecall(state, chooseRecall(state.players[1].reserve, state.recall.caps, state.players[1].orb)));
	if (state.legs && state.turn === 1 && state.step === "main") {
		const you = state.players[1];
		const open = you.field.filter((unit, index) => !unit && (you.locked?.[index] ?? 0) === 0).length;
		return withLive(answerLegs(state, you.orb >= 1 ? Math.min(1, open) : 0));
	}
	if (state.gemWarn === 1 && state.turn === 1 && state.step === "main") return withLive(answerGemWarn(state));
	if (state.gemCap === 1 && state.turn === 1 && state.step === "main") return withLive(answerGemCap(state, true));
	if (state.upkeep && state.turn === 1 && state.step === "main") return withLive(answerUpkeep(state, state.players[1].orb >= 1));
	if (state.preyAsk && state.turn === 1 && state.step === "main") return withLive(answerPrey(state, true));
	if (state.step === "respond" && state.hold?.priority === 1) {
		const plume = harpyOffer(state, 1);
		if (plume === "armor") return withLive(harpyWard(state));
		if (plume === "lash") return withLive(harpyLash(state));
		const pending = state.pending;
		const foe = 1 - state.turn;
		let knight = null;
		let other = null;
		if (pending?.kind === "melee" || pending?.kind === "face" && state.hold.blocker) {
			const attacker = state.players[state.turn].field.find((mon) => mon?.uid === pending.attacker) ?? null;
			const defId = pending.kind === "melee" ? state.hold.blocker ?? pending.defender : state.hold.blocker;
			const defender = defId ? state.players[foe].field.find((mon) => mon?.uid === defId) ?? null : null;
			if (state.turn !== 1 && defender && knightOpen(defender)) {
				knight = defender;
				other = attacker;
			} else if (state.turn === 1 && attacker && knightOpen(attacker)) {
				knight = attacker;
				other = defender;
			}
		}
		if (!knight && pending?.kind === "face" && !state.hold.blocker) {
			const choice = chooseBlock(state);
			const picked = choice.uid ? state.players[1].field.find((mon) => mon?.uid === choice.uid) ?? null : null;
			if (picked && knightOpen(picked)) {
				knight = picked;
				other = state.players[0].field.find((mon) => mon?.uid === pending.attacker) ?? null;
			}
		}
		if (knight) {
			const stars = other ? monsterCard(other.cardId)?.stars ?? 0 : 0;
			const room = other && (other.atk > knight.atk || stars >= 4);
			return withLive(primeKnight(state, knight.uid, room ? ["atk", "def"] : ["atk"]));
		}
		if (state.pending?.kind === "lash" || chargedWhip(state)) {
			const index = state.players[1].hand.indexOf("hap-thu-ma-phap");
			if (index >= 0) return withLive(castSpell(state, index, null));
		}
		if (state.pending?.kind === "spell" && state.turn !== 1) {
			const index = state.players[1].hand.indexOf("hap-thu-ma-phap");
			if (index >= 0) return withLive(castSpell(state, index, null));
		}
		if (state.pending?.kind === "face") {
			if (!state.hold.blocker) {
				const choice = chooseBlock(state);
				if (choice.uid) return withLive(assignBlock(state, choice.uid, choice.skill));
			}
		}
		const soldier = state.players[1].field.find((mon) => mon && canWall(state, mon.uid));
		if (soldier && state.pending) {
			const pending = state.pending;
			const aimUid = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.target : null;
			const ally = aimUid ? state.players[1].field.find((mon) => mon?.uid === aimUid) : null;
			if (ally && ally.hp < soldier.hp) return withLive(wallAlly(state, soldier.uid));
		}
		const guard = state.players[1].field.find((mon) => mon && canGuardCover(state, mon.uid));
		if (guard && state.pending) {
			const pending = state.pending;
			const aimUid = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? pending.target : null;
			const ally = aimUid ? state.players[1].field.find((mon) => mon?.uid === aimUid) : null;
			if (ally && ally.hp <= guard.hp) return withLive(guardCover(state, guard.uid));
		}
		if (state.pending?.kind === "gnaw" || state.pending?.kind === "gnaw-skill") return withLive(answerGnaw(state, gnawWorth(state)));
		if (state.pending?.kind === "melee") {
			const melee = state.pending;
			const defender = state.players[1].field.find((mon) => mon?.uid === (state.hold?.blocker ?? melee.defender)) ?? null;
			if (defender && gnawReady$1(defender, state.players[1]) && gnawWorth(state)) {
				const boosted = boostGnawOnChain(state);
				if (boosted.step !== "respond" || boosted.players !== state.players) return withLive(boosted);
			}
		}
		if (state.pending?.kind === "beam" && state.turn !== 1) {
			const beam = state.pending;
			const owner = state.players[1];
			const gnaws = owner.field.filter((mon) => gnawReady$1(mon, owner));
			const hit = beam.target ? gnaws.find((mon) => mon.uid === beam.target) : gnaws[0];
			if (hit && state.hold && state.hold.armed !== hit.uid) return withLive(boostGnawOnChain(state, hit.uid));
		}
		return withLive(passResponse(state));
	}
	if (state.turn !== 1 || state.step !== "main") return state;
	if (state.players[1].acted) return endTurn(state);
	const openingPlan = develop(state);
	if (openingPlan) return withLive(openingPlan);
	const me = state.players[1];
	const foe = state.players[0];
	const foes = foe.field.filter((mon) => Boolean(mon));
	const threats = foes.filter(mustKill).sort((a, b) => threatRank(b) - threatRank(a));
	const ready = me.field.filter((mon) => Boolean(mon && !mon.dim && mon.stun === 0));
	const room = me.field.some((slot) => !slot);
	const canSummon = me.reserve.some((held) => {
		const card = monsterCard(held.id);
		return Boolean(card && me.stars >= card.stars && playBill(card.gems, Boolean(held.toll), me.orb, me.flask) === null);
	});
	const chrono = ready.find((mon) => mon.cardId === "phu-thuy-thoi-gian");
	if (chrono && canTargetFoe(state)) {
		const lowAlly = me.field.some((mon) => mon && mon.uid !== chrono.uid && cardStars(mon.cardId, mon.level ?? 1) < 3);
		if (me.orb >= 2 && (foes.length > 0 || lowAlly)) {
			const wave = progress(state, useSkill(state, chrono.uid, null, 2, true));
			if (wave) return wave;
		}
		const target = threats.find((mon) => !isImmortal(mon)) ?? foes.find((mon) => !isImmortal(mon));
		if (target) {
			const cast = progress(state, useSkill(state, chrono.uid, target.uid, 0, true));
			if (cast) return cast;
		}
	}
	const perfect = me.field.find((mon) => mon?.cardId === PERFECT && mon.hp > 0 && mon.stun === 0 && (mon.chain ?? 0) === 0);
	if (perfect && canTargetFoe(state) && foe.hand.some((id) => spellCard(id) && !spellCard(id)?.env)) {
		const cast = progress(state, useSkill(state, perfect.uid, null, 0, true));
		if (cast) return cast;
	}
	if (perfect && !perfect.bolt && me.orb >= 1) {
		const cast = progress(state, useSkill(state, perfect.uid, null, 2, true));
		if (cast) return cast;
	}
	if (perfect && !perfect.dim && canTargetFoe(state) && threats[0]) {
		const cast = progress(state, useSkill(state, perfect.uid, perfect.uid, 3, true, threats[0].uid));
		if (cast) return cast;
	}
	const bird = ready.find((mon) => isHarpy(mon.cardId));
	if (bird && canTargetFoe(state) && !(bird.shed ?? []).includes("gust") && me.orb >= harpyKit(bird.cardId).gust && foe.hand.some((id) => spellCard(id) && !spellCard(id)?.env)) {
		const cast = progress(state, useSkill(state, bird.uid, null, 0));
		if (cast) return cast;
	}
	if (bird?.lure && canTargetFoe(state) && threats[0]) {
		const cast = progress(state, useSkill(state, bird.uid, bird.uid, 3, true, threats[0].uid));
		if (cast) return cast;
	}
	if (bird && !bird.lure && canTargetFoe(state) && !(bird.shed ?? []).includes("charm") && me.orb >= harpyKit(bird.cardId).charm && threats[0]) {
		const cast = progress(state, declareSkill(state, bird.uid, threats[0].uid, 1));
		if (cast) return cast;
	}
	if (canTargetFoe(state) && me.attackLock === 0 && threats.length > 0) {
		let best = null;
		for (const atk of ready) {
			if (smashPlain(atk) && me.orb < 1) continue;
			if (swordDue(atk) && me.orb < 1) continue;
			for (const def of threats) {
				if (kazuraSafe(def)) continue;
				const hit = clashCost(atk, def);
				if (!hit.kill) continue;
				if (!best || Number(hit.suicide) < Number(best.suicide) || hit.suicide === best.suicide && (hit.take < best.take || threatRank(def) > threatRank(best.def))) best = {
					atk,
					def,
					take: hit.take,
					suicide: hit.suicide
				};
			}
		}
		if (best) {
			const swung = attackMonster(state, best.atk.uid, best.def.uid);
			return withLive(patch(swung, 1, {
				...swung.players[1],
				acted: true
			}));
		}
	}
	const mammoth = ready.find((mon) => mon.cardId === "mo-voi-ma-mut");
	if (mammoth && me.orb >= 1 && canTargetFoe(state)) {
		const victim = threats.find((mon) => spellHurt(mon, mammoth.hp) >= mon.hp) ?? foes.find((mon) => spellHurt(mon, mammoth.hp) >= mon.hp);
		if (victim) {
			const cast = progress(state, useSkill(state, mammoth.uid, victim.uid, 0, true));
			if (cast) return cast;
		}
	}
	const witch = ready.find((mon) => mon.cardId === "phu-thuy-ti-hon");
	if (witch && me.orb >= 1 && canTargetFoe(state)) {
		const victim = threats.find((mon) => spellHurt(mon, 3 + me.stars) >= mon.hp);
		if (victim) {
			const cast = progress(state, declareSkill(state, witch.uid, victim.uid, 0));
			if (cast) return cast;
		}
	}
	const queen = ready.find((mon) => mon.cardId === QUEEN_KNIGHT && !hexLocked(mon) && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0 && !mon.cage);
	if (queen && canTargetFoe(state) && foes.length > 0 && me.orb >= queenSwing(queen).cost) {
		const victim = threats.find((mon) => !kazuraSafe(mon)) ?? foes.find((mon) => !kazuraSafe(mon));
		if (victim) {
			const cast = progress(state, declareSkill(state, queen.uid, victim.uid, 0));
			if (cast) return cast;
		}
	}
	const clown = ready.find((mon) => mon.cardId === "ga-he-dang-so");
	if (clown && clown.charge >= 2 && canTargetFoe(state)) {
		const amount = skillFigure("ga-he-dang-so", "dmg", 5) + skillFigure("ga-he-dang-so", "dmg", 4, 1) * Math.floor((clown.charge - 2) / 2);
		const victim = threats.find((mon) => spellHurt(mon, amount) >= mon.hp) ?? foes.find((mon) => spellHurt(mon, amount) >= mon.hp);
		if (victim) {
			const cast = progress(state, declareSkill(state, clown.uid, victim.uid, 1));
			if (cast) return cast;
		}
	}
	if (clown && clown.charge > 0 && me.orb >= 1) {
		const cast = progress(state, useSkill(state, clown.uid, null, 0));
		if (cast) return cast;
	}
	const grown = develop(state);
	if (grown) return withLive(grown);
	const leanNow = state.adapt ?? readLean();
	const styleNow = readStyle();
	const bias = summonBias((me.turns ?? 0) < 3, styleNow.oneStar, leanNow);
	if (threats.length === 0 && room && canSummon && me.summons < 1 && ready.length === 0) {
		const called = summonPick(state, bias);
		if (called) return called;
	}
	if (threats.length === 0 && !(room && canSummon) && !me.drawLock && me.draws < 1 && me.orb >= 2) {
		const eager = leanNow.ready && leanNow.spend !== 0 ? leanNow.spend > 0 : styleNow.spendAll;
		if ((me.turns ?? 0) < 3 ? eager || me.stars < 2 : me.stars < 2) {
			const kind = learnedDraw(me, me.field.filter(Boolean).length, styleNow, leanNow);
			if (kind) return draw(state, kind);
		}
	}
	if (threats.length === 0 && room && canSummon && me.summons < 1) {
		const called = summonPick(state, bias);
		if (called) return called;
	}
	if (threats.length === 0 && room) {
		const called = summonAside(state);
		if (called) return called;
	}
	const rhino = ready.find((mon) => mon.cardId === "te-giac-be-con" && (mon.level ?? 1) < 3);
	if (threats.length === 0 && rhino && me.orb >= rhinoRankCost(rhino.level ?? 1) && foes.length === 0) {
		const cast = progress(state, useSkill(state, rhino.uid, null, 0));
		if (cast) return cast;
	}
	if (threats.length === 0 && clown && me.orb >= 1 && clown.charge < 2 && foes.length === 0) {
		const cast = progress(state, useSkill(state, clown.uid, null, 0));
		if (cast) return cast;
	}
	const peeked = state.log.some((line) => line.includes("làm lộ quái dự bị"));
	const dragon = ready.find((mon) => mon.cardId === "rong-phun-hoa-cau");
	if (threats.length === 0 && dragon && !peeked && me.orb >= Math.max(skillManaCost(dragon.cardId), 2) && canTargetFoe(state) && foe.reserve.length > 0 && ready.length > 1) {
		const cast = progress(state, declareSkill(state, dragon.uid, null, 0));
		if (cast) return cast;
	}
	if (canTargetFoe(state) && me.attackLock === 0 && ready.length > 0) {
		const style = readStyle();
		const lean = state.adapt ?? readLean();
		const faceFirst = [...ready].filter((mon) => !smashPlain(mon) && !swordDue(mon) || me.orb >= 1).sort((a, b) => b.atk - a.atk)[0];
		const bestClash = (strict) => {
			let found = null;
			for (const atk of ready) {
				if (smashPlain(atk) && me.orb < 1) continue;
				if (swordDue(atk) && me.orb < 1) continue;
				for (const def of foes) {
					if (kazuraSafe(def)) continue;
					const hit = clashCost(atk, def);
					if (hit.deal <= 0) continue;
					if (strict && hit.take > hit.deal && !hit.kill) continue;
					const score = (hit.kill ? 50 : 0) + hit.deal - hit.take + threatRank(def);
					const prev = found ? (clashCost(found.atk, found.def).kill ? 50 : 0) + found.deal - found.take + threatRank(found.def) : -Infinity;
					if (!found || score > prev) found = {
						atk,
						def,
						deal: hit.deal,
						take: hit.take
					};
				}
			}
			return found;
		};
		const fair = bestClash(true);
		const anyHit = bestClash(false);
		const swing = chooseSwing(Boolean(faceFirst && faceFirst.atk > 0), Boolean(anyHit), lean);
		const historySwing = lean.ready && swing !== "default";
		if (!historySwing && (style.preferFace === true || style.preferFace === null && swing === "face") && faceFirst && faceFirst.atk > 0) {
			const swung = attackFace(state, faceFirst.uid);
			return withLive(patch(swung, 1, {
				...swung.players[1],
				acted: true
			}));
		}
		if (historySwing && swing === "face" && faceFirst && faceFirst.atk > 0) {
			const swung = attackFace(state, faceFirst.uid);
			return withLive(patch(swung, 1, {
				...swung.players[1],
				acted: true
			}));
		}
		const monsterHit = swing === "monster" ? fair ?? anyHit : fair;
		if (monsterHit && (historySwing || style.preferFace !== true)) {
			const swung = attackMonster(state, monsterHit.atk.uid, monsterHit.def.uid);
			return withLive(patch(swung, 1, {
				...swung.players[1],
				acted: true
			}));
		}
		const face = faceFirst;
		if (face && face.atk > 0) {
			const swung = attackFace(state, face.uid);
			return withLive(patch(swung, 1, {
				...swung.players[1],
				acted: true
			}));
		}
	}
	return endTurn(state);
}
var pay = (fallback) => (ctx) => ctx.afford(skillManaCost(ctx.cardId, fallback));
var orb = (n) => (ctx) => ctx.orb >= n;
var ROWS = [
	{
		ids: ["te-giac-be-con"],
		key: "up",
		cast: "self",
		skill: 0,
		gate: (ctx) => ctx.level < 3 && ctx.afford(ctx.level >= 2 ? 2 : 1)
	},
	{
		ids: ["hiep-si-cua-hau"],
		key: "sword",
		cast: "aim",
		skill: 0,
		label: (ctx) => `${chipLabel(ctx.cardId, "sword")} ${ctx.beat === 1 ? 2 : 1}`
	},
	{
		ids: ["mat-do-tan-pha"],
		key: "ball",
		cast: "aim",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["hoa-an-thit-nguoi"],
		key: "bite",
		cast: "aim",
		skill: 0
	},
	{
		ids: ["thuong-quan-long"],
		key: "spin",
		cast: "declare",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["may-nem-bom-hinh-nhen"],
		key: "bomb",
		cast: "aim",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["rong-con", "rong-ngan-tuoi"],
		key: "breath",
		cast: "aim",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["phu-thuy-ti-hon"],
		key: "hex",
		cast: "aim",
		skill: 0,
		gate: orb(1)
	},
	{
		ids: ["ma-dao-si"],
		key: "dan",
		cast: "aim",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["loi-nguyen-cua-rong"],
		key: "fire",
		cast: "aim",
		skill: 0,
		gate: pay(0)
	},
	{
		ids: ["rong-ac-ma"],
		key: "orb",
		cast: "aim",
		skill: 0
	},
	{
		ids: ["thien-than-be-nho"],
		key: "phys",
		cast: "aim",
		skill: 0
	},
	{
		ids: ["thien-than-be-nho"],
		key: "spell",
		cast: "aim",
		skill: 1
	},
	{
		ids: ["rong-phun-hoa-cau"],
		key: "peek",
		cast: "declare",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["rong-phun-hoa-cau"],
		key: "fire",
		cast: "aim",
		skill: 1,
		gate: orb(1)
	},
	{
		ids: ["phu-thuy-thoi-gian"],
		key: "age",
		cast: "aim",
		skill: 0
	},
	{
		ids: ["kiem-si-lua-thieng"],
		key: "fire",
		cast: "aim",
		skill: 0
	},
	{
		ids: ["kiem-si-lua-thieng"],
		key: "blood",
		cast: "aim",
		skill: 1,
		gate: (ctx) => ctx.hp > Number(/tiêu(?:\s*hao)?\s*(\d+)\s*máu/i.exec(ctx.skillText)?.[1] ?? 2)
	},
	{
		ids: ["ong-khong-lo"],
		key: "stun",
		cast: "aim",
		skill: 0,
		gate: orb(1)
	},
	{
		ids: ["phu-thuy-rung-den"],
		key: "curse",
		cast: "aim",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["mo-voi-ma-mut"],
		key: "burst",
		cast: "aim",
		skill: 0,
		gate: orb(1)
	},
	{
		ids: ["yeu-tinh-chuc-phuc"],
		key: "aid",
		cast: "aim",
		skill: 0,
		gate: pay(1)
	},
	{
		ids: ["trieu-hoi-ac-ma"],
		key: "hex",
		cast: "aim",
		skill: 0
	},
	{
		ids: ["sau-non"],
		key: "cocoon",
		cast: "self",
		skill: 0,
		gate: orb(1)
	},
	{
		ids: [
			"ngai-khong-lo",
			"ngai-nu-hoang",
			"ngai-hoan-my"
		],
		key: "dust",
		cast: "aim",
		skill: 0,
		gate: orb(1)
	},
	{
		ids: ["sua-hut-ma-phap"],
		key: "spit",
		cast: "aim",
		skill: 0,
		label: (ctx) => `${chipLabel(ctx.cardId, "spit")} ${3 + ctx.stored}`
	},
	{
		ids: ["con-thinh-no-cua-hai-vuong"],
		key: "rage",
		cast: "aim",
		skill: 0,
		gate: (ctx) => ctx.afford(1)
	},
	{
		ids: ["chien-binh-lan-khuat"],
		key: "hide",
		cast: "self",
		skill: 0,
		gate: (ctx) => ctx.afford(1)
	}
];
ROWS.flatMap((row) => row.ids.map((id) => `${id}:${row.key}`));
function fieldBindsFor(cardId, ctx) {
	const chips = [];
	for (const row of ROWS) {
		if (!row.ids.includes(cardId)) continue;
		if (row.gate && !row.gate(ctx)) continue;
		const go = () => row.cast === "aim" ? ctx.aim(row.skill) : row.cast === "declare" ? ctx.declare(row.skill) : ctx.cast(row.skill);
		chips.push({
			key: row.key,
			label: row.label?.(ctx) ?? chipLabel(cardId, row.key),
			go
		});
	}
	return chips;
}
var SEA_IDS = /* @__PURE__ */ new Set([
	"trai-tim-hai-long",
	"sua-hut-ma-phap",
	"kraken"
]);
var SEA_NAMES = [
	"Trái tim hải long",
	"Sứa hút ma pháp",
	"Kraken"
];
function seaVeiled(duel, viewer, uid) {
	if (!uid) return false;
	for (const side of [0, 1]) {
		const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
		if (!mon) continue;
		return side !== viewer && Boolean(duel.players[side].sea && SEA_IDS.has(mon.cardId) && !mon.shown);
	}
	return false;
}
function strikeUid(duel) {
	const pending = duel.pending;
	if (!pending) return "";
	if (pending.kind === "beam" || pending.kind === "gnaw-skill") return pending.caster;
	if (pending.kind === "face" || pending.kind === "melee" || pending.kind === "gnaw") return pending.attacker;
	return "";
}
function hiddenStrike(prev, next, viewer) {
	const uid = strikeUid(next) || strikeUid(prev);
	return seaVeiled(next, viewer, uid) || seaVeiled(prev, viewer, uid);
}
function fallenSea(prev, next, viewer) {
	const names = [];
	for (const side of [0, 1]) {
		if (side === viewer || !prev.players[side].sea) continue;
		for (const mon of prev.players[side].field) {
			if (!mon || mon.shown || !SEA_IDS.has(mon.cardId)) continue;
			if (!next.players[side].field.some((unit) => unit?.uid === mon.uid && unit.hp > 0)) names.push(fieldName(mon));
		}
	}
	return names;
}
function veilSlain(prev, next, viewer) {
	if (fallenSea(prev, next, viewer).length === 0) return false;
	const pending = prev.pending;
	return pending?.kind === "melee" || pending?.kind === "gnaw" || pending?.kind === "beam" || pending?.kind === "gnaw-skill" || next.tone === "hit" || next.tone === "spell";
}
function deathReveal(text, duel, viewer) {
	const foe = duel.players[viewer === 0 ? 1 : 0];
	if (!foe.sea) return false;
	const onFoe = new Set(foe.field.filter((mon) => mon).map((mon) => fieldName(mon)));
	const yours = new Set(duel.players[viewer].field.filter((mon) => mon).map((mon) => fieldName(mon)));
	return SEA_NAMES.some((name) => text.includes(name) && !onFoe.has(name) && !yours.has(name));
}
function maskHats(text, duel, viewer) {
	const foe = duel.players[viewer === 0 ? 1 : 0];
	if (!foe.hats) return text;
	const names = foe.field.filter((mon) => mon && mon.cardId !== "mu").map((mon) => fieldName(mon));
	let out = text;
	for (const name of [...names].sort((a, b) => b.length - a.length)) if (name) out = out.split(name).join("Mũ");
	return out;
}
function veilNotice(text, duel, viewer) {
	text = maskHats(text, duel, viewer);
	if (duel.players[viewer === 0 ? 1 : 0].field.some((mon) => mon && mon.cardId === "chien-binh-lan-khuat" && (mon.shown ?? 0) > 0)) text = text.split("Chiến binh lẫn khuất").join("Thế thân");
	const hornHit = /Sấm lôi phá/.test(text);
	if (!hornHit && deathReveal(text, duel, viewer)) return text;
	const masked = maskHidden(text, duel, viewer);
	if (hornHit) return maskSeaHit(masked, duel, viewer);
	if (!masked.includes("quái thú ẩn mình")) return masked;
	const names = duel.players[viewer].field.filter((mon) => mon).map((mon) => fieldName(mon));
	names.sort((a, b) => b.length - a.length);
	const hit = names.find((name) => name && masked.includes(name));
	if (hit) return `quái thú ẩn mình tấn công ${hit}`;
	if (/người|đánh vào bạn|tấn công bạn/i.test(masked)) return "quái thú ẩn mình tấn công bạn";
	return "quái thú ẩn mình tấn công";
}
function maskSeaHit(text, duel, viewer) {
	const foe = duel.players[viewer === 0 ? 1 : 0];
	if (!foe.sea) return text;
	const visible = new Set(foe.field.filter((mon) => mon && (!SEA_IDS.has(mon.cardId) || mon.shown)).map((mon) => fieldName(mon)));
	let out = text;
	for (const name of [...SEA_NAMES].sort((a, b) => b.length - a.length)) {
		if (visible.has(name)) continue;
		out = out.split(name).join("quái thú ẩn mình");
	}
	return out;
}
function maskHidden(text, duel, viewer) {
	const foe = duel.players[viewer === 0 ? 1 : 0];
	if (!foe.sea) return text;
	const onFoe = new Set(foe.field.filter((mon) => mon && !mon.shown && SEA_NAMES.includes(fieldName(mon))).map((mon) => fieldName(mon)));
	let out = text;
	for (const name of [...SEA_NAMES].sort((a, b) => b.length - a.length)) if (onFoe.has(name)) out = out.split(name).join("quái thú ẩn mình");
	return out;
}
function floaterStyle(item) {
	return {
		left: `${item.x}%`,
		top: `${item.y}%`,
		...item.delay ? {
			animationDelay: `${item.delay}s`,
			animationFillMode: "both"
		} : {}
	};
}
var SLOT_POS = {
	0: [
		{
			x: 15,
			y: 70
		},
		{
			x: 36,
			y: 70
		},
		{
			x: 57,
			y: 70
		}
	],
	1: [
		{
			x: 21,
			y: 26
		},
		{
			x: 40,
			y: 26
		},
		{
			x: 59,
			y: 26
		}
	]
};
var floaterSeq = 1;
var SLOT_BOX = {
	0: [
		{
			x: 6,
			y: 63.5,
			w: 18,
			h: 13.5
		},
		{
			x: 27,
			y: 63.5,
			w: 18,
			h: 13.5
		},
		{
			x: 48,
			y: 63.5,
			w: 18,
			h: 13.5
		}
	],
	1: [
		{
			x: 13,
			y: 19.5,
			w: 16.5,
			h: 13
		},
		{
			x: 32,
			y: 19.5,
			w: 16.5,
			h: 13
		},
		{
			x: 51,
			y: 19.5,
			w: 16.5,
			h: 13
		}
	]
};
var HP_BOX = {
	0: {
		x: 5,
		y: 82,
		w: 12,
		h: 7
	},
	1: {
		x: 8,
		y: 5.5,
		w: 12,
		h: 7
	}
};
var TRAIL_INK = {
	atk: "#ff3b3b",
	skill: "#3aa0ff",
	block: "#ffe14a",
	sys: "#141414",
	summon: "#ff9a1f",
	spell: "#ff4fa3",
	draw: "#c6ff3d",
	tick: "#3dcc4a"
};
var TRAIL_SLOTS = 5;
var SKILL_NAMES = [...new Set(Object.values(MONSTER_CHIPS).flatMap((chips) => chips.map((chip) => chip.label)))].sort((a, b) => b.length - a.length);
var SPELL_NAMES = [...SPELLS].map((card) => card.name).sort((a, b) => b.length - a.length);
function namedIn(body, names) {
	return names.some((name) => name.length > 1 && body.includes(name));
}
function isDrawNotice(body) {
	if (/không được rút|chỉ rút|Hết quái để rút|Hết phép để rút|Rút bài cần|Mỗi lượt chỉ rút/.test(body)) return false;
	return /(?:^|\n)(?:Bạn|Đối thủ) rút \S/u.test(body);
}
function isTurnDamage(body) {
	return /trúng độc|chết vì độc|bị bào mòn|chết vì bào mòn|Virus ăn mòn (?:gây|tiêu diệt|bắt đầu)|gánh (?:\d+ )?đòn cho kén|nhận \d+[^\n.]*sát thương/.test(body);
}
function trailSkip(text) {
	const body = text.replace(/^\d+\.\s*/u, "").trim();
	if (!/bắt đầu lượt/.test(body)) return false;
	if (isTurnDamage(body) || /sát thương|giáp lá cà|đánh thường|đánh vào người|bắn phép/.test(body)) return false;
	return true;
}
function monsterDamage(body) {
	if (/giáp lá cà|đánh thường|lao vào|sáp lá cà/.test(body)) return true;
	if (/sát thương[\s\S]{0,48}(?:lên|vào) (?!người chơi\b)/.test(body)) return true;
	return /gây \d+ máu lên (?!người chơi\b)/.test(body);
}
function hitsPlayer(body) {
	return /người chơi|vào người\b/.test(body);
}
function plainPlayerAttack(body) {
	if (!hitsPlayer(body)) return false;
	if (/(?:chỉ|không|Chọn|Hãy)(?:\s|$)/.test(body) && !/Có thể chặn/.test(body)) return false;
	if (/bắn phép|dùng |theo Đàm phán|theo Kiếm đàm phán/.test(body)) return false;
	return /đánh vào người|gây \d+ máu lên người chơi/.test(body);
}
function skillSpellPlayer(body) {
	if (!hitsPlayer(body) || plainPlayerAttack(body)) return false;
	if (/(?:chỉ|không|Chọn|Hãy)(?:\s|$)/.test(body) && !/Có thể chặn/.test(body) && !/sát thương/.test(body)) return false;
	return /sát thương|bắn phép|dùng .+ lên người chơi|Tấn công nhát|đang thi triển/.test(body) || namedIn(body, SKILL_NAMES) || namedIn(body, SPELL_NAMES);
}
function noticeInk(text) {
	const body = text.replace(/^\d+\.\s*/u, "").trim();
	if (/sẽ chặn|Kiếm phòng ngự|Phòng ngự|Đỡ hộ|Đỡ Kazura|đỡ đòn|đỡ phép|chặn bằng /.test(body)) return "block";
	if (isDrawNotice(body)) return "draw";
	if (isTurnDamage(body)) return "tick";
	if (monsterDamage(body)) return "atk";
	if (plainPlayerAttack(body)) return "atk";
	if (skillSpellPlayer(body)) return "skill";
	if (/triệu hồi/.test(body) && !/không triệu hồi|chỉ triệu hồi|đã triệu hồi trong lượt|triệu hồi nhanh được|mới triệu hồi/.test(body)) return "summon";
	if (/đang thi triển/.test(body)) return "spell";
	if (namedIn(body, SKILL_NAMES)) return "skill";
	if (namedIn(body, SPELL_NAMES)) return "spell";
	return "sys";
}
function NoticeText({ text }) {
	const lines = text.split("\n");
	if (!(lines.length > 1 && lines.slice(1).some((line) => line.startsWith("- ")))) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Painted, { text });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "banner-title",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Painted, { text: lines[0] ?? "" })
	}), lines.slice(1).filter((line) => line.trim()).map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "banner-line",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Painted, { text: line })
	}, index))] });
}
function spoken(text, viewer) {
	let out = text;
	if (viewer === 1) out = out.replaceAll("Đối thủ", "").replaceAll("Bạn", "Đối thủ").replaceAll("", "Bạn");
	return out.replace(/Đối thủ rút ([^.]*)/g, (_, name) => {
		const called = name.trim();
		return MONSTERS.some((card) => card.name === called) ? "Đối thủ rút 1 quái" : "Đối thủ rút 1 phép";
	});
}
function savedSeat() {
	if (typeof sessionStorage === "undefined") return null;
	try {
		const raw = JSON.parse(sessionStorage.getItem("clash-net") ?? "null");
		return raw?.seat === "host" || raw?.seat === "guest" ? raw.seat : null;
	} catch {
		return null;
	}
}
var TEST_DUEL_KEY = "clash-test-duel";
function loadTestDuel() {
	if (typeof sessionStorage === "undefined") return null;
	try {
		const raw = sessionStorage.getItem(TEST_DUEL_KEY);
		if (!raw) return null;
		const duel = JSON.parse(raw);
		return duel?.mode === "test" ? duel : null;
	} catch {
		return null;
	}
}
function boardActor(duel) {
	const picker = parleyPicker(duel);
	if (picker !== null) return picker;
	return duel.step === "respond" && duel.hold ? duel.hold.priority : duel.turn;
}
function viewerSide(duel, actorSide, seat) {
	if (duel.mode === "hotseat" || duel.mode === "test") return actorSide;
	if (duel.mode === "ai") return 0;
	return (seat ?? savedSeat()) === "guest" ? 1 : 0;
}
function screenSide(side, viewer) {
	return side === viewer ? 0 : 1;
}
function knightRoom(self, other, selfAllies, foeAllies) {
	if (!other) return 1;
	const stars = monsterCard(other.cardId)?.stars ?? 0;
	return visibleStats(other, foeAllies).atk > visibleStats(self, selfAllies).atk || stars >= 4 ? 2 : 1;
}
function knightDue(duel, viewer) {
	if (duel.step !== "respond" || !duel.hold || duel.hold.priority !== viewer || duel.winner) return null;
	const pending = duel.pending;
	if (!pending || pending.kind !== "melee" && pending.kind !== "face") return null;
	const foeSide = 1 - duel.turn;
	const attacker = duel.players[duel.turn].field.find((unit) => unit?.uid === (pending.kind === "melee" || pending.kind === "face" ? pending.attacker : "")) ?? null;
	const defId = pending.kind === "melee" ? duel.hold.blocker ?? pending.defender : duel.hold.blocker;
	if (!defId) return null;
	const defender = duel.players[foeSide].field.find((unit) => unit?.uid === defId) ?? null;
	const self = viewer === duel.turn ? attacker : defender;
	const other = viewer === duel.turn ? defender : attacker;
	if (!self || self.cardId !== "ky-si-bong-toi" || self.clash || (self.path ?? 0) > 0) return null;
	const foeAllies = duel.players[viewer === 0 ? 1 : 0].field;
	return {
		uid: self.uid,
		room: knightRoom(self, other, duel.players[viewer].field, foeAllies)
	};
}
function attackShift(duel, uid, viewer) {
	const pending = duel.pending;
	if (duel.step !== "respond" || !pending || pending.kind !== "face" && pending.kind !== "melee" || pending.attacker !== uid) return null;
	const attacker = fieldMon(duel, uid);
	if (attacker?.horn || attacker?.gaze) return null;
	if (seaVeiled(duel, viewer, uid)) return null;
	let fromSide = 0;
	let fromIndex = -1;
	for (const side of [0, 1]) {
		const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
		if (index >= 0) {
			fromSide = side;
			fromIndex = index;
		}
	}
	if (fromIndex < 0) return null;
	const from = SLOT_BOX[screenSide(fromSide, viewer)][fromIndex];
	const foe = 1 - fromSide;
	const visualFoe = screenSide(foe, viewer);
	const foeIndex = pending.kind === "melee" ? duel.players[foe].field.findIndex((mon) => mon?.uid === (duel.hold?.blocker ?? pending.defender)) : -1;
	const to = pending.kind === "face" ? HP_BOX[visualFoe] : foeIndex >= 0 ? SLOT_BOX[visualFoe][foeIndex] : null;
	if (!to) return null;
	const travel = pending.kind === "face" ? .42 : .56;
	const dx = to.x + to.w / 2 - (from.x + from.w / 2);
	const dy = to.y + to.h / 2 - (from.y + from.h / 2);
	return {
		x: dx * travel * 100 / from.w,
		y: dy * travel * 100 / from.h
	};
}
var SLOW_SPELLS = /* @__PURE__ */ new Set([
	"sam-set-tan-the",
	"soi-xich-dia-nguc",
	"phan-nguyen",
	"mua-ma-thuat",
	"thanh-guom-anh-sang",
	"thu-hoi-quai-thu",
	"ke-dao-mo",
	"mu-ma-phap"
]);
var SLOW_AIM = /* @__PURE__ */ new Set(["soi-xich-dia-nguc", "phan-nguyen"]);
var REFLECT_SPELLS = /* @__PURE__ */ new Set([
	"guong-phong-ho",
	"la-chan-phan-don",
	"phan-nguyen"
]);
var DISPEL_SPELLS = /* @__PURE__ */ new Set([
	"hap-thu-ma-phap",
	"mua-ma-thuat",
	"vong-xoay-bao-ho",
	"thu-hoi-quai-thu"
]);
var BIND_SPELLS = /* @__PURE__ */ new Set([
	"soi-xich-dia-nguc",
	"thanh-guom-anh-sang",
	"ngan-chan-phong-ngu",
	"vong-nguyen-rua-ac-ma"
]);
function spentSpell(prev, next) {
	for (const side of [0, 1]) {
		const left = [...next.players[side].hand];
		for (const id of prev.players[side].hand) {
			const index = left.indexOf(id);
			if (index >= 0) left.splice(index, 1);
			else return id;
		}
	}
	return "";
}
function bindBeam(duel) {
	const pending = duel.pending;
	return pending?.kind === "beam" && fieldMon(duel, pending.caster)?.cardId === "ong-khong-lo";
}
function fieldMon(duel, uid) {
	for (const side of [0, 1]) {
		const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
		if (mon) return mon;
	}
	return null;
}
function hornFx() {
	const fx = spellFxLook("sung-loi-pha");
	if (fx === "none") return null;
	if (fx === "fire" || fx === "gun" || fx === "bolt" || fx === "spark") return fx;
	return "spark";
}
function shotLook(state, pending) {
	if (!pending) return null;
	if (pending.kind === "face" || pending.kind === "melee") {
		const mon = fieldMon(state, pending.attacker);
		if (mon?.horn) return hornFx();
		if (mon?.gaze) return null;
		if (pending.kind === "face" && pending.skill) {
			if (!mon) return null;
			const index = mon.cardId === "may-quay-thuong" ? 1 : 0;
			return skillLook(mon.cardId, index);
		}
		return null;
	}
	if (pending.kind !== "beam" && pending.kind !== "gnaw-skill") return null;
	const mon = fieldMon(state, pending.caster);
	if (!mon) return null;
	if (pending.kind === "beam" && pending.back && mon.horn) return hornFx();
	const own = skillLook(mon.cardId, pending.index);
	if (own) return own;
	return null;
}
function aimPoint(state, pending, viewer) {
	if (!pending) return null;
	const uid = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? pending.target : "";
	if (uid) for (const side of [0, 1]) {
		const index = state.players[side].field.findIndex((mon) => mon?.uid === uid);
		if (index >= 0) return SLOT_POS[screenSide(side, viewer)][index] ?? null;
	}
	if (pending.kind === "face" || pending.kind === "beam" && !pending.target) {
		const from = pending.kind === "face" ? pending.attacker : pending.caster;
		let fromSide = state.turn;
		for (const side of [0, 1]) if (state.players[side].field.some((mon) => mon?.uid === from)) fromSide = side;
		const box = HP_BOX[screenSide(1 - fromSide, viewer)];
		return {
			x: box.x + box.w / 2,
			y: box.y + box.h / 2
		};
	}
	return null;
}
function gazeShot(prev) {
	const pending = prev.pending;
	if (!pending || pending.kind !== "melee" && pending.kind !== "face") return null;
	const mon = fieldMon(prev, pending.attacker);
	if (!mon?.gaze || mon.horn) return null;
	return pending;
}
function laserDrops(prev, next, viewer) {
	const gaze = gazeShot(prev);
	if (!gaze || next.pending) return [];
	const owner = prev.players[0].field.some((mon) => mon?.uid === gaze.attacker) ? 0 : 1;
	const drops = [];
	const said = next.fx !== prev.fx ? next.live : "";
	if (gaze.kind === "face") {
		const side = 1 - owner;
		const from = prev.players[side].hp;
		const to = next.players[side].hp;
		if (to < from) {
			const box = HP_BOX[screenSide(side, viewer)];
			drops.push({
				key: `face:${side}`,
				from,
				to,
				x: box.x + box.w / 2,
				y: box.y + box.h / 2,
				spot: side === viewer ? "self" : "target"
			});
		}
	}
	for (const side of [0, 1]) for (let index = 0; index < prev.players[side].field.length; index += 1) {
		const was = prev.players[side].field[index];
		const now = next.players[side].field[index];
		if (!was || was.uid === gaze.attacker) continue;
		if (now && now.uid !== was.uid) continue;
		const stayed = now && now.uid === was.uid ? now : null;
		const to = stayed ? stayed.hp : 0;
		if (to >= was.hp) continue;
		if (!stayed && /hiến tế|Thu hồi quái/.test(said)) continue;
		const point = SLOT_POS[screenSide(side, viewer)][index];
		if (!point) continue;
		drops.push({
			key: `mon:${was.uid}`,
			from: was.hp,
			to,
			x: point.x,
			y: point.y,
			spot: side === viewer ? "self" : "target"
		});
	}
	return drops;
}
function slotPoint(state, uid, viewer) {
	for (const side of [0, 1]) {
		const index = state.players[side].field.findIndex((mon) => mon?.uid === uid);
		if (index >= 0) return SLOT_POS[screenSide(side, viewer)][index] ?? null;
	}
	return null;
}
function laserTicks(drop) {
	const n = drop.from - drop.to;
	if (n <= 0) return [];
	const step = LASER_MS / n / 1e3;
	const out = [];
	for (let i = 1; i <= n; i += 1) out.push({
		id: floaterSeq++,
		x: drop.x,
		y: drop.y,
		text: "-1",
		heal: false,
		spot: drop.spot,
		delay: i * step
	});
	return out;
}
function splashMarkPoint(state, id, viewer, falls) {
	if (id.startsWith("face:")) {
		const side = Number(id.slice(5));
		if (side !== 0 && side !== 1) return null;
		const box = HP_BOX[screenSide(side, viewer)];
		return {
			x: box.x + box.w / 2,
			y: box.y + box.h / 2
		};
	}
	for (const side of [0, 1]) {
		const index = state.players[side].field.findIndex((mon) => mon?.uid === id);
		if (index >= 0) return SLOT_POS[screenSide(side, viewer)][index] ?? null;
	}
	const fall = falls.find((row) => row.mon.uid === id);
	return fall ? {
		x: fall.floater.x,
		y: fall.floater.y
	} : null;
}
var ANSWER_SPELLS = /* @__PURE__ */ new Set([
	"guong-phong-ho",
	"la-chan-phan-don",
	"vong-xoay-bao-ho",
	"phuc-kich",
	"vong-nguyen-rua-ac-ma",
	"hoan-doi",
	"hap-thu-ma-phap",
	"ngan-chan-phong-ngu",
	"virus-an-mon",
	"co-may-thoi-gian",
	"giap-co-khi"
]);
function hornPending(duel) {
	const pending = duel.pending;
	if (!pending || pending.kind !== "face" && pending.kind !== "melee") return false;
	return Boolean(fieldMon(duel, pending.attacker)?.horn || fieldMon(duel, pending.attacker)?.gaze);
}
function spellCanAnswer(id, duel) {
	if (duel.step !== "respond" || !ANSWER_SPELLS.has(id)) return false;
	const pending = duel.pending;
	const horn = hornPending(duel);
	const attacked = (pending?.kind === "face" || pending?.kind === "melee") && !horn;
	const skilled = pending?.kind === "beam" || pending?.kind === "gnaw-skill" || horn;
	if (id === "vong-xoay-bao-ho" || id === "guong-phong-ho") return attacked;
	if (id === "la-chan-phan-don") return skilled && !bindBeam(duel);
	if (id === "hap-thu-ma-phap") return pending?.kind === "spell" || pending?.kind === "lash";
	if (id === "ngan-chan-phong-ngu") return Boolean(duel.hold?.blocker) || attacked;
	if (id === "vong-nguyen-rua-ac-ma") {
		if (pending?.kind === "face" || pending?.kind === "melee") return true;
		if (pending?.kind === "beam" || pending?.kind === "gnaw-skill") {
			const caster = fieldMon(duel, pending.caster);
			return Boolean(caster && harmSkill(caster.cardId, pending.index));
		}
		return false;
	}
	if (id === "phuc-kich") return attacked || pending?.kind === "face";
	if (id === "hoan-doi") return attacked || skilled || pending?.kind === "face";
	if (id === "co-may-thoi-gian") {
		const side = duel.hold?.priority;
		const uid = aimedUid(duel);
		if (side === void 0 || !uid) return false;
		const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
		return Boolean(mon && (duel.past?.[mon.uid] ?? duel.born?.[mon.uid]));
	}
	if (id === "giap-co-khi") {
		const side = duel.hold?.priority;
		const shot = duel.pending;
		if (side === void 0 || shot?.kind !== "beam" || !shot.target || shot.back) return false;
		const ally = duel.players[side].field.find((unit) => unit?.uid === shot.target);
		const caster = fieldMon(duel, shot.caster);
		if (!ally || !caster) return false;
		return (duel.players[0].field.some((unit) => unit?.uid === caster.uid) ? 0 : 1) !== side;
	}
	if (id === "virus-an-mon") {
		const side = duel.hold?.priority;
		const uid = aimedUid(duel);
		if (side === void 0 || !uid) return false;
		const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
		if (!mon) return false;
		return (mon.cardId === "te-giac-be-con" && (mon.level ?? 1) > 1 ? monsterCard((mon.level ?? 1) >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang")?.stars ?? 1 : monsterCard(mon.cardId)?.stars ?? 0) === 1;
	}
	return false;
}
function foeAlive(duel, viewer) {
	return duel.players[viewer === 0 ? 1 : 0].field.some((mon) => mon && mon.hp > 0);
}
function tollOk(gems, tolled, orb, flask) {
	if (!tolled) return orb >= gems;
	if (gems >= 3) return orb >= gems && flask >= 1;
	return orb >= gems + 1;
}
function slowUsable(id, duel, viewer) {
	const you = duel.players[viewer];
	if (you.orb < (spellCard(id)?.gems ?? 0)) return false;
	if (id === "sung-loi-pha") return you.field.some((mon) => mon && hornFit(mon.cardId));
	if (id === "ke-dao-mo") return canTargetFoe(duel) && digChoices(duel, viewer).length > 0;
	if (!SLOW_SPELLS.has(id)) return false;
	const open = canTargetFoe(duel);
	const foes = foeAlive(duel, viewer);
	if (id === "soi-xich-dia-nguc" || id === "thanh-guom-anh-sang") return open && foes;
	if (id === "sam-set-tan-the") return open && foes;
	if (id === "phan-nguyen") return open && foes && you.field.some((mon) => mon && harmShift(mon));
	if (id === "mu-ma-phap") return you.field.some((mon) => mon && mon.cardId !== "mu");
	return true;
}
function answerPayoff(id, duel, viewer) {
	if (id === "phuc-kich") return duel.players[viewer].field.some((unit) => unit && unit.stun === 0 && (unit.chain ?? 0) === 0 && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai");
	if (id === "la-chan-phan-don" || id === "ngan-chan-phong-ngu") return foeAlive(duel, viewer);
	return true;
}
function spellDragLive(id, duel, viewer, index = -1) {
	const you = duel.players[viewer];
	const card = spellCard(id);
	const tolled = index >= 0 && Boolean(you.tolls?.[index]);
	if (!card || !tollOk(card.gems, tolled, you.orb, you.flask)) return false;
	if (ANSWER_SPELLS.has(id)) {
		if (duel.step !== "respond" || duel.hold?.priority !== viewer) return false;
		if (!spellCanAnswer(id, duel) || !answerPayoff(id, duel, viewer)) return false;
		if (id === "hoan-doi") return canCastSwap(duel, viewer);
		return true;
	}
	if (duel.step !== "main" || duel.turn !== viewer || duel.upkeep || duel.gemCap === viewer || duel.gemWarn === viewer) return false;
	if (id === "bien-sau") return true;
	return slowUsable(id, duel, viewer);
}
function aimedUid(duel) {
	const pending = duel.pending;
	if (!pending) return null;
	if (pending.kind === "melee") return duel.hold?.blocker ?? pending.defender;
	if (pending.kind === "gnaw") return pending.defender;
	if (pending.kind === "gnaw-skill") return pending.target;
	if (pending.kind === "beam" || pending.kind === "spell") return pending.target;
	return null;
}
function mysticAlert(duel, mon, viewer) {
	if (mon.cardId !== "hiep-si-huyen-bi" || mon.dim || mon.hp <= 0) return false;
	if (canGuardCover(duel, mon.uid)) return true;
	if (duel.step !== "main" || duel.turn !== viewer || duel.parley || duel.winner) return false;
	if (mon.stun > 0 || (mon.chain ?? 0) > 0 || (mon.path ?? 0) > 0) return false;
	if (duel.players[viewer].orb < 2) return false;
	return duel.players[1 - viewer].field.some((unit) => unit && unit.hp > 0 && unit.cardId !== "mu");
}
function monsterAlert(duel, mon, viewer) {
	if (canStand(duel, mon.uid)) return true;
	if (duel.step !== "respond" || duel.hold?.priority !== viewer || mon.dim || mon.stun > 0) return false;
	const pending = duel.pending;
	if (mon.cardId === "chien-si-gam-nham" && pending?.kind === "face") return true;
	if (mon.cardId === "yeu-tinh-chuc-phuc" && (pending?.kind === "face" || pending?.kind === "melee")) return true;
	if (mon.cardId === "linh-chien-da-khong-lo" && canWall(duel, mon.uid)) return true;
	if (canSpirit(duel, mon.uid)) return true;
	if (mon.cardId === "ky-si-bong-toi" && !(mon.path ?? 0) && pending?.kind === "melee" && pending.defender === mon.uid && !mon.clash) return true;
	return false;
}
function reactionMark(prev, next) {
	if (next.step !== "respond") return null;
	if (next.hold?.blocker && next.hold.blocker !== prev.hold?.blocker) return "block";
	const pending = next.pending;
	const horn = hornPending(next);
	if ((pending?.kind === "face" || pending?.kind === "melee") && !horn && prev.pending?.kind !== pending.kind) return fieldMon(next, pending.attacker)?.bolt ? "rebound" : "attack";
	if (pending?.kind === "lash" && prev.pending?.kind !== "lash") return "rebound";
	if ((pending?.kind === "beam" || pending?.kind === "gnaw-skill" || horn) && prev.pending?.kind !== pending?.kind) return pending?.kind === "beam" && fieldMon(next, pending.caster)?.cardId === "ong-khong-lo" ? "chain" : "skill";
	if (pending?.kind === "spell" && pending.cardId === "sam-set-tan-the" && !(prev.pending?.kind === "spell" && prev.pending.cardId === "sam-set-tan-the")) return "skill";
	if (pending?.kind === "spell" && (pending.cardId === "soi-xich-dia-nguc" || pending.cardId === "thanh-guom-anh-sang" || pending.cardId === "vong-nguyen-rua-ac-ma") && !(prev.pending?.kind === "spell" && prev.pending.cardId === pending.cardId)) return "chain";
	for (const side of [0, 1]) for (const mon of next.players[side].field) {
		if (!mon) continue;
		const was = prev.players[side].field.find((unit) => unit?.uid === mon.uid);
		if (!was) continue;
		if ((mon.blessAtk ?? 0) > (was.blessAtk ?? 0) || (mon.blessDef ?? 0) > (was.blessDef ?? 0) || mon.clash && !was.clash || mon.horn && !was.horn) return "buff";
		if (mon.cardId === "chien-si-gam-nham" && (mon.def > was.def || mon.maxHp > was.maxHp)) return "buff";
	}
	return null;
}
function ReactGlyph({ kind }) {
	if (kind === "attack") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M6 26 L20 8 L23 11 L9 29 Z",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M18 6 L26 4 L24 12 Z",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 22 L14 28",
				stroke: "currentColor",
				strokeWidth: "2"
			})
		]
	});
	if (kind === "block") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M16 3 L27 8 V16 C27 23 16 29 16 29 C16 29 5 23 5 16 V8 Z",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2.4"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M11 16 L15 20 L22 12",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2.4"
		})]
	});
	if (kind === "chain") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "4",
			y: "12",
			width: "12",
			height: "8",
			rx: "4",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2.4"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "16",
			y: "12",
			width: "12",
			height: "8",
			rx: "4",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2.4"
		})]
	});
	if (kind === "skull") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/fx/skull.png",
		alt: "",
		draggable: false
	});
	if (kind === "rebound") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/fx/rebound.png",
		alt: "",
		draggable: false
	});
	if (kind === "skill") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M18 2 L8 18 H15 L13 30 L25 13 H18 Z",
			fill: "currentColor"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 32 32",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M16 4 L18.5 13 H28 L20.5 18.5 L23 28 L16 22.5 L9 28 L11.5 18.5 L4 13 H13.5 Z",
			fill: "currentColor"
		})
	});
}
function reserveLive(held, card) {
	return {
		name: held.saved ? fieldName({
			cardId: held.id,
			level: held.saved.level
		}) : card.name,
		atk: held.saved?.atk ?? card.atk,
		def: held.saved?.def ?? card.def,
		mdef: held.saved?.mdef ?? card.mdef,
		hp: held.hp
	};
}
function holdingMend(mon) {
	if (mon.clash && (mon.clash.atk > 0 || mon.clash.def > 0 || mon.clash.maxHp > 0)) return true;
	if ((mon.blessAtk ?? 0) > 0 || (mon.blessDmg ?? 0) > 0) return true;
	return Boolean(mon.buff && ((mon.buff.def ?? 0) > 0 || (mon.buff.mdef ?? 0) > 0 || (mon.buff.maxHp ?? 0) > 0));
}
function gnawBoosted(prev, next) {
	for (const side of [0, 1]) for (const mon of next.players[side].field) {
		if (!mon || mon.cardId !== "chien-si-gam-nham") continue;
		const was = prev.players[side].field.find((unit) => unit?.uid === mon.uid);
		if (was && (mon.def > was.def || mon.maxHp > was.maxHp)) return true;
	}
	return false;
}
function fallenMon(prev, next, side, index) {
	if (!prev || prev === next) return null;
	if (prev.fx === next.fx && prev.pending === next.pending) return null;
	if (next.fx !== prev.fx && /Thu hồi quái/.test(next.live)) return null;
	const was = prev.players[side].field[index];
	const now = next.players[side].field[index];
	return was && !now ? was : null;
}
function killWait(prev, next, look, spellCard = false) {
	const said = next.fx !== prev.fx ? next.live : "";
	if (/Thu hồi quái/.test(said)) return -1;
	if (/trúng độc|chết vì độc|bị bào mòn|chết vì bào mòn|Virus ăn mòn/.test(said)) return 0;
	if (spellCard && look === "spell") return 200;
	if (look === "fire" || look === "spell" || look === "gun" || look === "bolt" || look === "spark") return 400;
	if (look === "tide-small" || look === "tide-mid" || look === "tide-big") return 200;
	return (next.tone === "hit" || prev.pending?.kind === "melee" || prev.pending?.kind === "gnaw" || prev.pending?.kind === "face") && next.fx !== prev.fx ? 600 : 0;
}
function showEffects(prev, next, viewer, marks) {
	if (prev.fx === next.fx && prev.pending === next.pending) return null;
	const floaters = [];
	const falls = [];
	const pops = [];
	const lunges = [];
	const hits = [];
	const riderSkill = next.skill?.id === "ky-si-cuoi-rong" && next.skill.hits && next.skill.vols && next.skill.hits.length === next.skill.vols.length ? next.skill : null;
	const riderIds = new Set(riderSkill?.hits ?? []);
	const bomb = next.skill?.id === "may-nem-bom-hinh-nhen" ? next.skill : null;
	const bombHits = bomb?.hits ?? [];
	const bombVols = bomb?.vols ?? [];
	const bombOn = Boolean(bomb && bombHits.length > 0 && bombHits.length === bombVols.length);
	const dan = next.skill?.id === "ma-dao-si" ? next.skill : null;
	const danHits = dan?.hits ?? [];
	const danVols = dan?.vols ?? [];
	const danOn = Boolean(dan && danVols.length > 1 && danHits.length === danVols.length);
	const bombSpot = (id) => {
		if (id.startsWith("face:")) {
			const side = Number(id.slice(5));
			if (side !== 0 && side !== 1) return null;
			const mark = side === viewer ? marks.youHp : marks.foeHp;
			return {
				x: mark.x,
				y: mark.y,
				spot: side === viewer ? "self" : "target"
			};
		}
		for (const side of [0, 1]) {
			const index = prev.players[side].field.findIndex((mon) => mon?.uid === id);
			if (index < 0) continue;
			const spot = SLOT_POS[screenSide(side, viewer)][index];
			if (!spot) return null;
			return {
				x: spot.x,
				y: spot.y,
				spot: side === viewer ? "self" : "target"
			};
		}
		return null;
	};
	const lasers = laserDrops(prev, next, viewer);
	const laserOf = (key) => lasers.find((drop) => drop.key === key);
	for (const side of [0, 1]) {
		const before = prev.players[side];
		const after = next.players[side];
		const where = side === viewer ? "self" : "target";
		if (after.hp !== before.hp) {
			const mark = side === viewer ? marks.youHp : marks.foeHp;
			const delta = after.hp - before.hp;
			const beam = delta < 0 ? laserOf(`face:${side}`) : void 0;
			if (beam) floaters.push(...laserTicks(beam));
			else if (!(bombOn && bombHits.includes(`face:${side}`)) && !(danOn && danHits.includes(`face:${side}`))) floaters.push({
				id: floaterSeq++,
				x: mark.x,
				y: mark.y,
				text: `${delta > 0 ? "+" : ""}${delta}`,
				heal: delta > 0,
				spot: where
			});
		}
		for (let index = 0; index < 3; index += 1) {
			const was = before.field[index];
			const now = after.field[index];
			const spot = SLOT_POS[screenSide(side, viewer)][index];
			if (!was && now) pops.push(`${side}-${index}`);
			if (was && now && now.uid === was.uid && now.hp !== was.hp) {
				const delta = now.hp - was.hp;
				const beam = delta < 0 ? laserOf(`mon:${was.uid}`) : void 0;
				const rose = was.cardId === "ky-si-bong-toi" && now.cardId === "chien-binh-huyen-thoai";
				if (beam) floaters.push(...laserTicks(beam));
				else if (!(rose && delta < 0) && !(bombOn && bombHits.includes(was.uid)) && !(danOn && danHits.includes(was.uid)) && !riderIds.has(was.uid)) {
					floaters.push({
						id: floaterSeq++,
						x: spot.x,
						y: spot.y,
						text: `${delta > 0 ? "+" : ""}${delta}`,
						heal: delta > 0,
						spot: where
					});
					if (delta < 0 && !(next.skill && skillLook(next.skill.id, next.skill.index))) hits.push(now.uid);
				}
			}
			const mendN = was && now && now.uid === was.uid ? (next.mends ?? []).find((row) => row.uid === now.uid)?.n ?? 0 : 0;
			if (mendN > 0 && was && now && now.hp - was.hp !== mendN) floaters.push({
				id: floaterSeq++,
				x: spot.x,
				y: spot.y,
				text: `+${mendN}`,
				heal: true,
				spot: where
			});
			const rain = /Mưa ma thuật hồi (\d+)/.exec(next.live);
			if (was && now && now.uid === was.uid && rain && harmShift(was) && !harmShift(now) && now.hp === was.hp) floaters.push({
				id: floaterSeq++,
				x: spot.x,
				y: spot.y,
				text: `+${rain[1]}`,
				heal: true,
				spot: where
			});
			if (was && now && now.uid === was.uid) {
				const stance = now.cardId === "rong-boc-trung" && now.stance !== was.stance ? now.stance === "attack" ? skillFigure(now.cardId, "atk", 4) : skillFigure(now.cardId, "guard", 2) : 0;
				const gain = Math.max(0, now.atk - was.atk, now.def - was.def, now.mdef - was.mdef, (now.blessAtk ?? 0) - (was.blessAtk ?? 0), (now.clash?.atk ?? 0) - (was.clash?.atk ?? 0), (now.clash?.def ?? 0) - (was.clash?.def ?? 0), stance);
				if (gain > 0) floaters.push({
					id: floaterSeq++,
					x: spot.x,
					y: spot.y,
					text: `+${gain}`,
					heal: true,
					spot: where
				});
			}
			if (was && now && now.uid === was.uid && (now.chain ?? 0) > (was.chain ?? 0)) hits.push(now.uid);
			if (was && !now && !(next.fx !== prev.fx && /Thu hồi quái/.test(next.live))) {
				const said = next.fx !== prev.fx ? next.live : "";
				const beam = laserOf(`mon:${was.uid}`);
				const clockKill = next.fx !== prev.fx && side !== next.turn && /cường hoá và tiêu diệt|quét cả sân/.test(next.live);
				if (beam) floaters.push(...laserTicks(beam));
				else if (was.hp > 0 && !/hiến tế/.test(said) && !(bombOn && bombHits.includes(was.uid)) && !(danOn && danHits.includes(was.uid)) && !riderIds.has(was.uid)) floaters.push({
					id: floaterSeq++,
					x: spot.x,
					y: spot.y,
					text: `-${was.hp}`,
					heal: false,
					spot: where,
					delay: clockKill ? 1 : void 0
				});
				const floater = {
					id: floaterSeq++,
					x: spot.x,
					y: spot.y,
					text: "Hạ",
					heal: false,
					spot: where
				};
				falls.push({
					floater,
					side,
					index,
					mon: was,
					hold: clockKill ? 1e3 : riderIds.has(was.uid) ? 1120 : 0,
					laser: Boolean(beam)
				});
			}
			if (was && now && now.uid === was.uid && !was.dim && now.dim && !now.horn && !now.gaze && !was.horn && !was.gaze) {
				if (!(next.skill?.id === now.cardId ? skillLook(next.skill.id, next.skill.index) : null)) lunges.push(now.uid);
			}
		}
	}
	if (bombOn) bombHits.forEach((id, index) => {
		const n = bombVols[index] ?? 0;
		if (n <= 0) return;
		const point = bombSpot(id);
		if (!point) return;
		floaters.push({
			id: floaterSeq++,
			x: point.x,
			y: point.y,
			text: `-${n}`,
			heal: false,
			spot: point.spot,
			delay: index * .18
		});
	});
	if (danOn) danHits.forEach((id, index) => {
		const n = danVols[index] ?? 0;
		if (n <= 0) return;
		const point = bombSpot(id);
		if (!point) return;
		floaters.push({
			id: floaterSeq++,
			x: point.x,
			y: point.y,
			text: `-${n}`,
			heal: false,
			spot: point.spot,
			delay: index * .42
		});
	});
	if (next.pending?.kind === "face" && prev.pending?.kind !== "face" && !fieldMon(next, next.pending.attacker)?.horn && !fieldMon(next, next.pending.attacker)?.gaze) lunges.push(next.pending.attacker);
	if (next.pending?.kind === "melee" && prev.pending?.kind !== "melee" && !fieldMon(next, next.pending.attacker)?.horn && !fieldMon(next, next.pending.attacker)?.gaze) lunges.push(next.pending.attacker);
	const burst = next.fx !== prev.fx && (next.tone === "spell" || next.tone === "heal") ? {
		id: next.fx,
		tone: next.tone,
		text: next.live.replace(/^\d+\.\s*/, "").slice(0, 84)
	} : null;
	const shake = next.tone === "hit" && next.fx !== prev.fx;
	if (riderSkill?.hits && riderSkill.vols) {
		const beats = riderSkill.hits;
		beats.forEach((id, index) => {
			const n = riderSkill.vols?.[index] ?? 0;
			if (n <= 0) return;
			const point = bombSpot(id);
			if (!point) return;
			floaters.push({
				id: floaterSeq++,
				x: point.x,
				y: point.y,
				text: `-${n}`,
				heal: false,
				spot: point.spot,
				delay: beats[index + 1] === id ? 0 : 1.12
			});
		});
	}
	if (!shake && !burst && floaters.length === 0 && falls.length === 0 && pops.length === 0 && lunges.length === 0) return null;
	return {
		shake,
		floaters,
		falls,
		burst,
		motion: {
			pops,
			lunges,
			hits
		}
	};
}
function fieldLook(mon, stars) {
	const name = fieldName(mon);
	if (mon.cardId === "phu-thuy-ti-hon") return {
		name,
		text: "Gây ",
		hot: `${3 + stars} sát thương`
	};
	if (mon.cardId === "mo-voi-ma-mut") return {
		name,
		text: "Hy sinh, gây ",
		hot: `${mon.hp} sát thương phép`
	};
	if (mon.cardId === "ga-he-dang-so" && mon.charge >= 2) return {
		name,
		text: "Gây ",
		hot: `${skillFigure("ga-he-dang-so", "dmg", 5) + skillFigure("ga-he-dang-so", "dmg", 4, 1) * Math.floor((mon.charge - 2) / 2)} sát thương`
	};
	if (mon.cardId === "te-giac-be-con" && (mon.level ?? 1) > 1) {
		const form = (mon.level ?? 1) >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang";
		return {
			name,
			text: monsterCard(form)?.skill ?? ""
		};
	}
	return {
		name,
		text: monsterCard(mon.cardId)?.skill ?? ""
	};
}
function tideCost(index) {
	return [...(monsterCard("trai-tim-hai-long")?.skill ?? "").matchAll(/thêm\s*(\d+)\s*mana/gi)].map((hit) => Number(hit[1]))[index] ?? (index === 0 ? 1 : 2);
}
function allySkill(id) {
	return id === "yeu-tinh-chuc-phuc" || id === "thien-than-be-nho";
}
function witchAllyMark(duel, casterUid, mon) {
	if (mon.uid === casterUid || mon.hp <= 0) return false;
	return !chronoHighAlly(duel, casterUid, mon.uid);
}
function chronoImmortal(mon) {
	return mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi";
}
function chronoSpecial(mon) {
	return mon.cardId === "te-giac-hieu-thang" || mon.cardId === "te-giac-be-con" && (mon.level ?? 1) < 3;
}
function shotSkill(id) {
	return id !== "mo-voi-ma-mut" && id !== "yeu-tinh-chuc-phuc";
}
function damageShot(cardId, index) {
	return harmSkill(cardId, index);
}
function faceSkill(id, index) {
	return id === "phu-thuy-ti-hon" || id === "mat-do-tan-pha" || id === "may-nem-bom-hinh-nhen" || id === "ma-dao-si" || id === "rong-ac-ma" || id === "rong-con" || id === "rong-ngan-tuoi" || id === "sua-hut-ma-phap" || id === "con-thinh-no-cua-hai-vuong" || id === "rong-phun-hoa-cau" && index === 1 || id === "ga-he-dang-so" && index === 1 || id === "may-quay-thuong" && index === 1;
}
function skillChoices(text) {
	const numbered = text.split("\n").map((line) => line.trim()).filter((line) => /^\d+\./.test(line) && !/^0\./.test(line));
	return numbered.length > 0 ? numbered : [text.trim()];
}
function wantsTarget(text) {
	if (/tất cả|đồng minh|dự bị|nhân bản|thăng cấp|tích luỹ/i.test(text)) return false;
	return /kẻ địch|đối phương|đối thủ|tê liệt|quái|sát thương/i.test(text);
}
var REEL_ORDER = [
	"seven",
	"atk",
	"def",
	"hp",
	"six"
];
function reelResultCue(faces) {
	const counts = /* @__PURE__ */ new Map();
	for (const face of faces) counts.set(face, (counts.get(face) ?? 0) + 1);
	let best = null;
	for (const [face, n] of counts) {
		if (n < 2) continue;
		if (!best || n > best.n) best = {
			face,
			n
		};
	}
	if (!best) return null;
	if (best.face === "six") return "reelSix";
	if (best.face === "seven") return "reelSeven";
	return best.n >= 3 ? "reelTriple" : "reelPair";
}
function ReelGlyph({ face }) {
	if (face === "phys") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		className: "is-gun",
		src: "/art/gun-phys.png?v=1",
		alt: "Súng vật lý",
		draggable: false
	});
	if (face === "spell") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		className: "is-gun",
		src: "/art/gun-spell.png?v=1",
		alt: "Súng phép",
		draggable: false
	});
	if (face === "tru") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		className: "is-gun",
		src: "/art/gun-tru.png?v=1",
		alt: "Súng chuẩn",
		draggable: false
	});
	if (face === "blank") return null;
	if (face === "atk") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/art/reel-kiem.png?v=3",
		alt: "Công",
		draggable: false
	});
	if (face === "hp") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/art/reel-tim.png?v=3",
		alt: "Máu",
		draggable: false
	});
	if (face === "def") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		"aria-label": "Thủ",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M12 2 4 5.2V11c0 5 3.4 8.6 8 10.8 4.6-2.2 8-5.8 8-10.8V5.2L12 2Z"
		})
	});
	if (face === "seven" || face === "six") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
		className: face === "seven" ? "is-seven" : "is-six",
		children: face === "seven" ? "7" : "6"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "?" });
}
function SlotMachine({ faces, phase, canPull, onPull, onDone, kind, order }) {
	const [shown, setShown] = (0, import_react.useState)([
		null,
		null,
		null
	]);
	const [locked, setLocked] = (0, import_react.useState)(0);
	const done = (0, import_react.useRef)(onDone);
	const held = (0, import_react.useRef)(0);
	done.current = onDone;
	const gun = kind === "gun";
	(0, import_react.useEffect)(() => {
		if (phase !== "spin" || !faces) {
			setShown([
				null,
				null,
				null
			]);
			setLocked(0);
			held.current = 0;
			return;
		}
		playCue("reelSpin");
		const spinFace = (index) => {
			if (!gun) return REEL_ORDER[Math.floor(Math.random() * REEL_ORDER.length)];
			const barrel = order?.[index] ?? "phys";
			return Math.random() < .5 ? barrel : "blank";
		};
		const roll = window.setInterval(() => {
			setShown([
				0,
				1,
				2
			].map((index) => index < held.current ? faces[index] : spinFace(index)));
		}, 90);
		const lock = (count) => {
			held.current = count;
			setLocked(count);
			setShown([
				0,
				1,
				2
			].map((index) => index < count ? faces[index] : spinFace(index)));
		};
		const first = window.setTimeout(() => lock(1), 3300);
		const second = window.setTimeout(() => {
			playCue("reelStop");
			lock(2);
		}, 4200);
		const third = window.setTimeout(() => {
			playCue("reelStop");
			lock(3);
			const guns = faces.filter((face) => face === "phys" || face === "spell" || face === "tru").length;
			const cue = gun ? guns >= 2 ? "reelPair" : null : reelResultCue(faces);
			if (cue) playCue(cue, .12);
		}, 4980);
		const finish = window.setTimeout(() => done.current?.(), 5800);
		return () => {
			window.clearInterval(roll);
			window.clearTimeout(first);
			window.clearTimeout(second);
			window.clearTimeout(third);
			window.clearTimeout(finish);
		};
	}, [
		phase,
		faces,
		gun,
		order
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet slot-machine",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: gun ? "Cò quay" : "Quay thưởng" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "slot-reels",
					children: shown.map((face, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `slot-reel${phase === "spin" && index >= locked ? " is-spin" : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelGlyph, { face })
					}, index))
				}),
				phase === "wait" && canPull && !gun ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "act press",
					onClick: onPull,
					children: "Kéo"
				}) : phase === "wait" && gun ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: phase === "wait" ? "Đợi kéo." : locked >= 3 ? "Xong." : "Đang quay." })
			]
		})
	});
}
var TIME_HITS = [
	true,
	false,
	false,
	true,
	false,
	false
];
var NEEDLE_REST = 313.51;
function needleTurn(sector) {
	return 1800 + ((270 + sector * 60) % 360 - NEEDLE_REST + 360) % 360;
}
function TimeWheel({ sector, title, onPull, onDone }) {
	const [turn, setTurn] = (0, import_react.useState)(0);
	const [moving, setMoving] = (0, import_react.useState)(false);
	const done = (0, import_react.useRef)(onDone);
	done.current = onDone;
	(0, import_react.useEffect)(() => {
		if (sector === null) {
			setTurn(0);
			setMoving(false);
			return;
		}
		playCue("reelSpin");
		const arm = window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				setMoving(true);
				setTurn(needleTurn(sector));
			});
		});
		const sound = window.setTimeout(() => playCue(TIME_HITS[sector] ? "reelSeven" : "reelSix"), 2750);
		const finish = window.setTimeout(() => done.current(), 3600);
		return () => {
			window.cancelAnimationFrame(arm);
			window.clearTimeout(sound);
			window.clearTimeout(finish);
		};
	}, [sector]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet time-wheel-sheet",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: title }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "time-wheel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: "time-disk",
						src: "/art/time-wheel.png?v=1",
						alt: "",
						draggable: false
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: `time-needle${moving ? " is-on" : ""}`,
						src: "/art/time-needle.png?v=1",
						alt: "",
						draggable: false,
						style: { transform: `rotate(${turn}deg)` }
					})]
				}),
				sector === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "act press",
					onClick: onPull,
					children: "Quay"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Đang quay." })
			]
		})
	});
}
function PlayPage() {
	const language = useLang();
	const [duel, setDuel] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [hand, setHand] = (0, import_react.useState)("reserve");
	const [inspect, setInspect] = (0, import_react.useState)(null);
	const [strike, setStrike] = (0, import_react.useState)(null);
	const [look, setLook] = (0, import_react.useState)(null);
	const [blockChoice, setBlockChoice] = (0, import_react.useState)(null);
	const [blessArm, setBlessArm] = (0, import_react.useState)(false);
	const [chronoAsk, setChronoAsk] = (0, import_react.useState)(null);
	const [chronoWarn, setChronoWarn] = (0, import_react.useState)(null);
	const [chronoSpin, setChronoSpin] = (0, import_react.useState)(null);
	const [fuseAsk, setFuseAsk] = (0, import_react.useState)(null);
	const [riteHand, setRiteHand] = (0, import_react.useState)(null);
	const [vowAsk, setVowAsk] = (0, import_react.useState)(null);
	const [fuseOn, setFuseOn] = (0, import_react.useState)(false);
	const [fuseDrag, setFuseDrag] = (0, import_react.useState)(null);
	const [aim, setAim] = (0, import_react.useState)(null);
	const [lureAsk, setLureAsk] = (0, import_react.useState)(null);
	const [toast, setToast] = (0, import_react.useState)("");
	const [help, setHelp] = (0, import_react.useState)(false);
	const [testOpen, setTestOpen] = (0, import_react.useState)(false);
	const [testPast, setTestPast] = (0, import_react.useState)([]);
	const [testKind, setTestKind] = (0, import_react.useState)("monster");
	const [testFind, setTestFind] = (0, import_react.useState)("");
	const [sound, setSoundOn] = (0, import_react.useState)(true);
	const [drag, setDrag] = (0, import_react.useState)(null);
	const [swapPick, setSwapPick] = (0, import_react.useState)([]);
	const [recallPick, setRecallPick] = (0, import_react.useState)([]);
	const [reflectPick, setReflectPick] = (0, import_react.useState)(null);
	const [ambushPick, setAmbushPick] = (0, import_react.useState)(null);
	const [digPick, setDigPick] = (0, import_react.useState)(null);
	const [lockFlash, setLockFlash] = (0, import_react.useState)(null);
	const [shake, setShake] = (0, import_react.useState)(false);
	const [floaters, setFloaters] = (0, import_react.useState)([]);
	const [linger, setLinger] = (0, import_react.useState)([]);
	const [laserHp, setLaserHp] = (0, import_react.useState)({});
	const [burst, setBurst] = (0, import_react.useState)(null);
	const [reactMarks, setReactMarks] = (0, import_react.useState)([]);
	const [motion, setMotion] = (0, import_react.useState)({
		pops: [],
		lunges: [],
		hits: []
	});
	const [starFlash, setStarFlash] = (0, import_react.useState)(null);
	const [knightAsk, setKnightAsk] = (0, import_react.useState)(null);
	const [hornAsk, setHornAsk] = (0, import_react.useState)(null);
	const [cottonAsk, setCottonAsk] = (0, import_react.useState)(null);
	const [askAt, setAskAt] = (0, import_react.useState)(null);
	const askDrag = (0, import_react.useRef)(null);
	const prevDuel = (0, import_react.useRef)(null);
	const seenViewer = (0, import_react.useRef)(null);
	const wave = (0, import_react.useRef)(0);
	const grab = (0, import_react.useRef)(null);
	const fuseHold = (0, import_react.useRef)(null);
	const origin = (0, import_react.useRef)({
		x: 0,
		y: 0,
		moved: false,
		t: 0,
		pan: false,
		lastX: 0
	});
	const handStrip = (0, import_react.useRef)(null);
	const noticeRef = (0, import_react.useRef)(null);
	const noticePan = (0, import_react.useRef)(null);
	const laserTimers = (0, import_react.useRef)([]);
	const skillPan = (0, import_react.useRef)(null);
	const suppressClick = (0, import_react.useRef)(false);
	const scratch = (0, import_react.useRef)(freshScratch());
	const matchRef = (0, import_react.useRef)(null);
	const starTimer = (0, import_react.useRef)(0);
	const skullTimer = (0, import_react.useRef)(0);
	const reboundTimer = (0, import_react.useRef)(0);
	const stall = (0, import_react.useRef)({
		live: "",
		n: 0
	});
	const resetHold = (0, import_react.useRef)(0);
	const riteHold = (0, import_react.useRef)(0);
	const netRef = (0, import_react.useRef)(null);
	const rev = (0, import_react.useRef)(0);
	const pushGen = (0, import_react.useRef)(0);
	const opening = (0, import_react.useRef)(false);
	const noticeQ = (0, import_react.useRef)([]);
	const noticeTimer = (0, import_react.useRef)(0);
	const trailLog = (0, import_react.useRef)([]);
	const trailSeq = (0, import_react.useRef)(0);
	const turnClock = (0, import_react.useRef)(1);
	const windupText = (0, import_react.useRef)(null);
	const [trailDots, setTrailDots] = (0, import_react.useState)([]);
	const [pinnedId, setPinnedId] = (0, import_react.useState)(null);
	const [net, setNet] = (0, import_react.useState)(null);
	const [wait, setWait] = (0, import_react.useState)("");
	function remember(items) {
		const fresh = items.filter((item) => item.text && !trailSkip(item.text));
		if (!fresh.length) return;
		const stamped = fresh.map((item) => {
			trailSeq.current += 1;
			return {
				id: trailSeq.current,
				text: item.text,
				ink: item.ink,
				clock: item.clock
			};
		});
		trailLog.current = [...trailLog.current, ...stamped].slice(-80);
		setTrailDots(trailLog.current);
	}
	function dropTrail(text) {
		const log = trailLog.current;
		let index = -1;
		for (let i = log.length - 1; i >= 0; i -= 1) if (log[i].text === text) {
			index = i;
			break;
		}
		if (index < 0) return;
		const id = log[index].id;
		trailLog.current = log.filter((item) => item.id !== id);
		setTrailDots(trailLog.current);
		setPinnedId((current) => current === id ? null : current);
	}
	function holdNotice(text, player = true, clock) {
		const now = Date.now();
		const stamp = clock ?? turnClock.current;
		const ink = noticeInk(text);
		window.clearTimeout(noticeTimer.current);
		if (!text) {
			noticeQ.current = [];
			setToast("");
			return;
		}
		let q = noticeQ.current.slice();
		let expired = false;
		if (q[0] && q[0].until <= now) {
			expired = true;
			q = q.slice(1);
			if (q[0]) q[0] = {
				...q[0],
				until: now + 2500
			};
		}
		if (q.length > 0 && q[q.length - 1].text === text) {
			noticeQ.current = q;
			if (expired && q[0]) setToast(q[0].text);
			armNotice();
			return;
		}
		remember([{
			text,
			ink,
			clock: stamp
		}]);
		if (player && q.length >= 2) {
			const next = {
				text,
				until: now + 2500,
				ink,
				clock: stamp
			};
			noticeQ.current = [next];
			setToast(text);
			return;
		}
		if (q.length === 0) {
			const next = {
				text,
				until: now + 2500,
				ink,
				clock: stamp
			};
			noticeQ.current = [next];
			setToast(text);
			return;
		}
		if (expired && q[0]) setToast(q[0].text);
		q.push({
			text,
			until: 0,
			ink,
			clock: stamp
		});
		noticeQ.current = q;
		armNotice();
	}
	function armNotice() {
		window.clearTimeout(noticeTimer.current);
		const q = noticeQ.current;
		if (q.length < 2 || !q[0]?.until) return;
		const wait = Math.max(0, q[0].until - Date.now());
		noticeTimer.current = window.setTimeout(() => {
			const list = noticeQ.current;
			if (list.length < 2) return;
			const rest = list.slice(1);
			rest[0] = {
				...rest[0],
				until: Date.now() + 2500
			};
			noticeQ.current = rest;
			setToast(rest[0].text);
			if (rest.length > 1) armNotice();
		}, wait);
	}
	(0, import_react.useEffect)(() => () => window.clearTimeout(noticeTimer.current), []);
	(0, import_react.useEffect)(() => {
		setSoundOn(soundOn());
		const unlock = () => unlockSound();
		window.addEventListener("pointerdown", unlock);
		return () => window.removeEventListener("pointerdown", unlock);
	}, []);
	(0, import_react.useEffect)(() => {
		const box = noticeRef.current;
		if (!box || pinnedId !== null) return;
		box.scrollTop = 0;
	}, [
		toast,
		duel?.turn,
		pinnedId
	]);
	(0, import_react.useEffect)(() => {
		const box = noticeRef.current;
		if (box) box.scrollTop = 0;
	}, [pinnedId]);
	(0, import_react.useEffect)(() => {
		if (pinnedId === null) return;
		if (!trailDots.some((dot) => dot.id === pinnedId)) setPinnedId(null);
	}, [pinnedId, trailDots]);
	(0, import_react.useEffect)(() => {
		if (pinnedId === null) return;
		const down = (event) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (noticeRef.current?.contains(target)) return;
			if (target instanceof Element && target.closest(".trail-dot, .notice-trail")) return;
			setPinnedId(null);
		};
		document.addEventListener("pointerdown", down);
		return () => document.removeEventListener("pointerdown", down);
	}, [pinnedId]);
	(0, import_react.useEffect)(() => {
		let join = null;
		try {
			join = JSON.parse(sessionStorage.getItem("clash-net") ?? "null");
		} catch {
			join = null;
		}
		if (!join?.code || join.seat !== "host" && join.seat !== "guest") {
			const saved = sessionStorage.getItem("clash-mode");
			const mode = saved === "hotseat" || saved === "test" ? saved : "ai";
			const next = mode === "test" ? loadTestDuel() ?? createDuel(loadDeck(), "test") : createDuel(loadDeck(), mode);
			if (next.mode === "ai" && next.step === "main" && next.winner === null) {
				warmMatchHistory();
				matchRef.current = {
					id: newMatchId(),
					startedAt: Date.now(),
					decks: openingDecks(next.players),
					saved: false
				};
			} else matchRef.current = null;
			setDuel(next);
			return;
		}
		matchRef.current = null;
		netRef.current = join;
		setNet(join);
		setWait(join.seat === "host" ? `Mã ${join.code}. Đợi đối thủ nhập mã này.` : "Đang vào phòng…");
		let stop = false;
		const tick = async () => {
			const room = await pollRoom({ data: {
				code: join.code,
				seat: join.seat
			} });
			if (stop) return;
			if (room.phase === "gone") {
				setWait("Mã không còn. Hãy tạo mã mới.");
				return;
			}
			if (join.seat === "host" && room.guestDeck && !room.duel && !opening.current) {
				opening.current = true;
				const opened = createDuel(loadDeck(), "net", room.guestDeck);
				const pushed = await pushDuel({ data: {
					code: join.code,
					seat: "host",
					duel: JSON.stringify({
						...opened,
						glimpse: null
					})
				} });
				if (stop) return;
				if (!pushed.ok) {
					opening.current = false;
					setWait(pushed.error);
					return;
				}
				rev.current = pushed.rev;
				setWait("");
				setDuel(opened);
				return;
			}
			if (room.duel && room.rev > rev.current) {
				rev.current = room.rev;
				const next = JSON.parse(room.duel);
				setWait("");
				holdNotice(next.live ?? "", false, next.clock);
				setDuel(next);
			}
		};
		tick();
		const timer = window.setInterval(() => void tick(), 280);
		return () => {
			stop = true;
			window.clearInterval(timer);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (duel?.mode === "test") sessionStorage.setItem(TEST_DUEL_KEY, JSON.stringify(duel));
	}, [duel]);
	(0, import_react.useEffect)(() => {
		setRecallPick([]);
	}, [duel?.recall]);
	(0, import_react.useEffect)(() => {
		if (!duel || busy || duel.winner !== null || duel.mode !== "ai" || duel.reel) return;
		const aiResponds = duel.step === "respond" && duel.hold?.priority === 1;
		const aiMain = duel.turn === 1 && duel.step === "main";
		const aiParley = Boolean(duel.parley && duel.step === "main" && parleyPicker(duel) === 1);
		if (!aiResponds && !aiMain && !aiParley) return;
		const timer = window.setTimeout(() => {
			setDuel((current) => {
				if (!current) return current;
				let next = aiStep(current);
				if (next === current) return current;
				if (next.live === current.live && next.step === current.step && next.turn === current.turn && next.pending === current.pending) {
					stall.current = {
						live: next.live,
						n: stall.current.live === next.live ? stall.current.n + 1 : 1
					};
					if (stall.current.n >= 2) {
						next = next.step === "respond" ? passResponse(next) : endTurn(next.step === "main" ? next : {
							...next,
							step: "main"
						});
						stall.current = {
							live: "",
							n: 0
						};
					}
				} else stall.current = {
					live: "",
					n: 0
				};
				holdNotice(next.live, false, next.clock);
				return next;
			});
		}, 2e3);
		return () => window.clearTimeout(timer);
	}, [duel, busy]);
	(0, import_react.useEffect)(() => {
		if (!duel || busy || duel.winner !== null || duel.step !== "main" || duel.upkeep || duel.reel?.kind !== "gun" || duel.reel.phase !== "wait") return;
		const seat = netRef.current;
		const actor = boardActor(duel);
		const viewer = viewerSide(duel, actor, seat?.seat ?? null);
		if (!(duel.mode === "ai" || (duel.mode === "hotseat" || duel.mode === "test" || actor === viewer) && duel.turn === viewer)) return;
		const timer = window.setTimeout(() => {
			let pulled = null;
			setDuel((current) => {
				if (!current?.reel || current.reel.kind !== "gun" || current.reel.phase !== "wait") return current;
				const next = pullReel(current);
				if (next !== current) pulled = next;
				return next;
			});
			if (!pulled || pulled.mode !== "net" || !seat) return;
			const ticket = pushGen.current + 1;
			pushGen.current = ticket;
			pushDuel({ data: {
				code: seat.code,
				seat: seat.seat,
				duel: JSON.stringify({
					...pulled,
					glimpse: null
				})
			} }).then((pushed) => {
				if (ticket !== pushGen.current) return;
				if (!pushed.ok) return;
				rev.current = pushed.rev;
			});
		}, 0);
		return () => window.clearTimeout(timer);
	}, [duel, busy]);
	(0, import_react.useLayoutEffect)(() => {
		if (!duel) return;
		const prev = prevDuel.current;
		if (!prev || prev === duel) return;
		const viewerNow = viewerSide(duel, boardActor(duel), netRef.current?.seat ?? null);
		const drops = laserDrops(prev, duel, viewerNow);
		if (!drops.length) return;
		setLaserHp(Object.fromEntries(drops.map((drop) => [drop.key, drop.from])));
	}, [duel]);
	(0, import_react.useEffect)(() => {
		if (!duel) return;
		const prev = prevDuel.current;
		if (prev === duel) return;
		prevDuel.current = duel;
		for (const id of laserTimers.current) window.clearTimeout(id);
		laserTimers.current = [];
		if (!prev) return;
		if (prev.step !== "respond" && duel.step === "respond") windupText.current = duel.live || null;
		if (prev.step === "respond" && duel.step !== "respond") {
			const open = windupText.current;
			windupText.current = null;
			if (open && duel.live && open !== duel.live) dropTrail(open);
		}
		seal(prev, duel);
		const viewerNow = viewerSide(duel, boardActor(duel), netRef.current?.seat ?? null);
		if (seenViewer.current !== viewerNow) {
			seenViewer.current = viewerNow;
			setFloaters([]);
			setMotion({
				pops: [],
				lunges: [],
				hits: []
			});
			setBurst(null);
		}
		const quiet = hiddenStrike(prev, duel, viewerNow) && !veilSlain(prev, duel, viewerNow);
		if (veilSlain(prev, duel, viewerNow)) {
			const names = fallenSea(prev, duel, viewerNow);
			holdNotice(names.every((name) => duel.live.includes(name)) ? duel.live : `${duel.live} ${names.join(", ")} bị hạ.`, false, duel.clock);
		}
		const reflected = duel.fx !== prev.fx && /bị phản vào|Phản nguyền chuyển|Gương phòng hộ dựng lên/.test(duel.live);
		if (duel.step !== "respond") {
			if (reflected && prev.step !== "respond") {
				setReactMarks(["rebound"]);
				window.clearTimeout(reboundTimer.current);
				reboundTimer.current = window.setTimeout(() => setReactMarks((list) => list.length === 1 && list[0] === "rebound" ? [] : list), 1400);
			} else if (prev.step === "respond") {
				window.clearTimeout(reboundTimer.current);
				setReactMarks([]);
				setBlessArm(false);
				setBlockChoice(null);
				setReflectPick(null);
				setAmbushPick(null);
			}
			if (duel.fx !== prev.fx && /cường hoá và tiêu diệt|quét cả sân/.test(duel.live)) {
				window.clearTimeout(skullTimer.current);
				skullTimer.current = window.setTimeout(() => {
					setReactMarks(["skull"]);
					skullTimer.current = window.setTimeout(() => setReactMarks((list) => list.length === 1 && list[0] === "skull" ? [] : list), 1400);
				}, 1e3);
			}
		} else {
			const answerReady = (id, state) => state.hold?.priority === viewerNow && state.players[viewerNow].hand.includes(id) && spellCanAnswer(id, state);
			if ([...ANSWER_SPELLS].some((id) => answerReady(id, duel) && !answerReady(id, prev))) setHand("spell");
			const mark = reactionMark(prev, duel);
			const veiled = hiddenStrike(prev, duel, viewerNow);
			const shown = mark && veiled ? "attack" : mark;
			if (prev.step !== "respond") setReactMarks(shown ? [shown] : []);
			else if (shown) setReactMarks((list) => {
				if (veiled && shown === "attack" && list.includes("attack")) return list;
				if (shown === "rebound") return ["rebound", ...list];
				return list.includes(shown) ? list : [shown, ...list];
			});
			if (reflected) setReactMarks((list) => list.includes("rebound") ? list : ["rebound", ...list]);
		}
		if (prev.mode === "ai" && duel.mode === "ai") try {
			const learned = absorb(loadHabits(), watchSnap(prev), watchSnap(duel), scratch.current);
			scratch.current = learned.scratch;
			saveHabits(learned.habits);
		} catch {}
		const rose = [0, 1].find((side) => duel.players[side].stars > prev.players[side].stars);
		if (rose !== void 0) {
			setStarFlash(rose);
			window.clearTimeout(starTimer.current);
			starTimer.current = window.setTimeout(() => setStarFlash(null), 3500);
		}
		if (duel.winner !== null && prev.winner === null) playCue(duel.winner === viewerNow ? "win" : "lose");
		if (rose !== void 0) playCue("star");
		const spent = spentSpell(prev, duel);
		const blocked = Boolean(duel.hold?.blocker) && duel.hold?.blocker !== prev.hold?.blocker;
		const beam = duel.pending?.kind === "beam" && prev.pending?.kind !== "beam";
		const attackNow = duel.pending?.kind === "face" || duel.pending?.kind === "melee" ? duel.pending : null;
		const attackWas = prev.pending?.kind === "face" || prev.pending?.kind === "melee" ? prev.pending : null;
		const lunged = Boolean(attackNow && (!attackWas || attackWas.attacker !== attackNow.attacker || attackWas.kind !== attackNow.kind));
		const hornNow = attackNow ? Boolean(fieldMon(duel, attackNow.attacker)?.horn) : false;
		const whipNow = Boolean(attackNow && !hornNow && fieldMon(duel, attackNow.attacker)?.bolt);
		const struck = duel.tone === "hit" && duel.fx !== prev.fx;
		const drew = [0, 1].some((side) => duel.players[side].draws > prev.players[side].draws);
		const summoned = [0, 1].some((side) => duel.players[side].field.some((mon, index) => mon && !prev.players[side].field[index]));
		const gazing = attackNow ? Boolean(fieldMon(duel, attackNow.attacker)?.gaze && !fieldMon(duel, attackNow.attacker)?.horn) : false;
		const wasGaze = Boolean(attackWas && !attackNow && fieldMon(prev, attackWas.attacker)?.gaze && !fieldMon(prev, attackWas.attacker)?.horn);
		const hellFace = Boolean(lunged && attackNow?.kind === "face" && attackNow.skill);
		const said = duel.fx !== prev.fx ? duel.live : "";
		const whipBoom = Boolean(attackWas && !attackNow && fieldMon(prev, attackWas.attacker)?.bolt && !fieldMon(prev, attackWas.attacker)?.horn && /sát thương phép/.test(said));
		const gnawed = gnawBoosted(prev, duel);
		const beamCaster = beam && duel.pending?.kind === "beam" ? fieldMon(duel, duel.pending.caster)?.cardId ?? "" : "";
		const beamKill = beamCaster === "ga-he-dang-so" || beamCaster === "phu-thuy-ti-hon" || beamCaster === "mo-voi-ma-mut";
		const monsterKill = !spent && duel.tone === "spell" && /sát thương phép|tiêu diệt/i.test(said);
		const cameFromBeam = prev.pending?.kind === "beam";
		const beamWasSwordsman = cameFromBeam && prev.pending?.kind === "beam" && fieldMon(prev, prev.pending.caster)?.cardId === "kiem-si-lua-thieng";
		const hellBoom = /Cầu lửa địa ngục/.test(said) && /sát thương|vật lý|phép|chuẩn/.test(said);
		const demonBoom = /Hoả cầu địa ngục/.test(said) && /sát thương chuẩn/.test(said);
		const swordBoom = /sát thương phép/.test(said) && (/Vệt Lửa|Lửa rồng thiêng|Đòn thêm|Hoả thần long|Cầu lửa/.test(said) || cameFromBeam && beamWasSwordsman);
		const curseIndex = duel.skill?.id === "loi-nguyen-cua-rong" ? duel.skill.index : cameFromBeam && prev.pending?.kind === "beam" && fieldMon(prev, prev.pending.caster)?.cardId === "loi-nguyen-cua-rong" ? prev.pending.index : null;
		const curseBoom = curseIndex !== null && skillLook("loi-nguyen-cua-rong", curseIndex) === "fire" && /sát thương chuẩn/.test(said);
		const firePrep = beam && duel.pending?.kind === "beam" && (beamCaster === "kiem-si-lua-thieng" || beamCaster === "mat-do-tan-pha" || beamCaster === "loi-nguyen-cua-rong" || beamCaster === "rong-ac-ma" || beamCaster === "rong-phun-hoa-cau" && duel.pending.index === 1) || hellFace;
		const beamIndex = beam && duel.pending?.kind === "beam" ? duel.pending.index : -1;
		const damageStart = beam && damageShot(beamCaster, beamIndex) && !firePrep && !beamKill && skillLook(beamCaster, beamIndex) !== "gun";
		const beeBind = beam && beamCaster === "ong-khong-lo";
		const beeLand = prev.pending?.kind !== "beam" && /Ong khổng lồ gây tê liệt/.test(said);
		const wasHorn = Boolean(attackWas && !attackNow && fieldMon(prev, attackWas.attacker)?.horn);
		const hornBoom = !gazing && !wasGaze && !attackNow && (duel.tone === "spell" && /Sấm lôi phá[\s\S]*sát thương phép/.test(said) || wasHorn && /sát thương phép/.test(said));
		const gazeBoom = wasGaze && /sát thương phép|sát thương chuẩn/.test(said);
		const doomCast = duel.pending?.kind === "spell" && duel.pending.cardId === "sam-set-tan-the" && !(prev.pending?.kind === "spell" && prev.pending.cardId === "sam-set-tan-the");
		const picked = spellFxLook("sam-set-tan-the");
		const doomFx = picked === "fire" || picked === "gun" || picked === "spark" || picked === "none" ? picked : "bolt";
		const doomLook = /Sấm sét tận thế/.test(said) && !/đang thi triển/.test(said) ? doomFx : null;
		const lashNow = duel.pending?.kind === "lash" ? duel.pending : null;
		const lashWas = prev.pending?.kind === "lash" ? prev.pending : null;
		const lashOpen = Boolean(lashNow && !lashWas);
		const lashBoom = Boolean(lashWas && !lashNow && !/Hấp thụ ma pháp nuốt/.test(said));
		if (quiet && (lunged || beam)) playCue("veil");
		const prepGun = beam && duel.pending?.kind === "beam" && skillLook(beamCaster, duel.pending.index) === "gun" || (hellFace && attackNow ? skillLook(fieldMon(duel, attackNow.attacker)?.cardId ?? "", 0) === "gun" : false);
		if (!quiet && firePrep && !prepGun) playCue("firePrep");
		if (!quiet && (blocked || gnawed)) playCue("block");
		if (!quiet && struck && spent !== "phuc-kich" && !curseBoom) playCue("hit");
		const struckMelee = prev.pending?.kind === "melee" ? prev.pending : null;
		const riderHit = Boolean(struck && struckMelee && (fieldMon(prev, struckMelee.attacker)?.cardId === "ky-si-cuoi-rong" || fieldMon(prev, prev.hold?.blocker ?? struckMelee.defender)?.cardId === "ky-si-cuoi-rong"));
		if (!quiet && riderHit && struckMelee) {
			const ids = /* @__PURE__ */ new Set();
			if (duel.skill?.id === "ky-si-cuoi-rong") for (const id of duel.skill.hits ?? []) ids.add(id);
			else {
				ids.add(struckMelee.attacker);
				ids.add(prev.hold?.blocker ?? struckMelee.defender);
			}
			const points = [];
			for (const id of ids) for (const side of [0, 1]) {
				const live = duel.players[side].field.findIndex((mon) => mon?.uid === id);
				const was = prev.players[side].field.findIndex((mon) => mon?.uid === id);
				const index = live >= 0 ? live : was;
				const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
				if (spot) points.push(spot);
			}
			window.setTimeout(() => playCue("swordBoom"), 512);
			window.setTimeout(() => {
				if (fireBlastOn()) for (const point of points) emitFx({
					t: "fire",
					x: point.x,
					y: point.y
				});
			}, 320);
		}
		if (!quiet && spent === "phuc-kich" && /phục kích/.test(said)) playCue("attack");
		if (!quiet && lunged && !hornNow && !gazing && !hellFace && !whipNow && spent !== "phuc-kich") {
			playCue("attack");
			const swung = duel.pending?.kind === "melee" ? duel.pending : null;
			if (Boolean(swung && (fieldMon(duel, swung.attacker)?.cardId === "ky-si-cuoi-rong" || fieldMon(duel, duel.hold?.blocker ?? swung.defender)?.cardId === "ky-si-cuoi-rong"))) playCue("firePrep", 0, .4);
		}
		if (!quiet && lunged && whipNow) playCue("reflect");
		if (!quiet && lunged && gazing) playCue("boltPrep");
		if (!quiet && lunged && hornNow) playCue("boltPrep");
		const vowed = !/Không đủ máu để hiến tế/.test(said) && /bị hiến tế|hiến tế\.|hiến tế hết máu/.test(said);
		const soulBlood = [0, 1].some((side) => {
			if (prev.players[side].hp - duel.players[side].hp < 2) return false;
			return duel.players[side].field.some((mon, index) => {
				const was = prev.players[side].field[index];
				return mon?.cardId === "ke-giam-ho-linh-hon" && (mon.vows ?? 0) > (was?.vows ?? 0);
			});
		});
		if (vowed || soulBlood) playCue("sacrifice");
		if (!quiet && /thành Chiến binh huyền thoại/.test(said)) playCue("dispel");
		if (fireBlastOn()) {
			for (const side of [0, 1]) duel.players[side].field.forEach((mon, index) => {
				const was = prev.players[side].field[index];
				if (mon?.cardId !== "ky-si-bong-toi" || (mon.path ?? 0) <= 0 || (was?.path ?? 0) > 0) return;
				const spot = SLOT_POS[screenSide(side, viewerNow)][index];
				if (spot) emitFx({
					t: "fire",
					x: spot.x,
					y: spot.y
				});
			});
			if (duel.rite && duel.rite.seq !== prev.rite?.seq) {
				const spot = SLOT_POS[screenSide(duel.rite.side, viewerNow)][duel.rite.slot];
				if (spot) emitFx({
					t: "fire",
					x: spot.x,
					y: spot.y
				});
			}
			if (duel.ashes && duel.ashes.seq !== prev.ashes?.seq) for (const slot of duel.ashes.slots) {
				const spot = SLOT_POS[screenSide(duel.ashes.side, viewerNow)][slot];
				if (spot) emitFx({
					t: "fire",
					x: spot.x,
					y: spot.y
				});
			}
		}
		if (drew) playCue("draw");
		if (summoned) playCue("summon");
		if (!quiet && /tích luỹ năng lượng/i.test(said)) playCue("spellRise");
		if (!quiet && /Lộ diện quái dự bị/.test(said)) playCue("dispel");
		if (!quiet && /thăng cấp/.test(said)) playCue("dispel");
		if (!quiet && /Nở ra/.test(said)) playCue("dispel");
		if (!quiet && /hồi \d+ và \+\d+ phòng ngự/.test(said)) playCue("dispel");
		if (!quiet && /nhân đôi phòng ngự/.test(said)) playCue("shield");
		if (!quiet && /cướp \d+ máu tối đa/.test(said)) playCue("dispel");
		if (!quiet && /phù hộ/.test(said)) playCue("spellRise");
		if (!quiet && /cuộn thế thủ/.test(said)) playCue("shield");
		if (!quiet && /xòe thế công/.test(said)) playCue("spellRise");
		if (!quiet && /Hoá kén/.test(said)) playCue("shield");
		if (!quiet && /sẽ đỡ đòn và phép|ngừng đỡ|tạo khiên/.test(said)) playCue("shield");
		for (const side of [0, 1]) duel.players[side].field.forEach((mon, index) => {
			const was = prev.players[side].field[index];
			if (!mon?.ward || mon.ward === was?.ward) return;
			const spot = SLOT_POS[screenSide(side, viewerNow)][index];
			if (spot) emitFx({
				t: "shield",
				kind: mon.ward,
				x: spot.x,
				y: spot.y
			});
		});
		if (!quiet && /quét cả sân/.test(said)) playCue("timeFlow");
		else if (!quiet && /cường hoá và tiêu diệt|tiến hoá .+ dạng cuối|cường hoá .+, tăng 35%/.test(said)) playCue("timeBoost");
		else if (!quiet && /lão hoá .+, (tăng|giảm) 35%/i.test(said)) playCue("timeAge");
		if (!quiet && /nạp tia sáng huỷ diệt/.test(said)) {
			playCue("boltPrep");
			playCue("boltSmall");
			for (const side of [0, 1]) duel.players[side].field.forEach((mon, index) => {
				const was = prev.players[side].field[index];
				if (!mon?.gaze || was?.gaze) return;
				const spot = SLOT_POS[screenSide(side, viewerNow)][index];
				if (spot) emitFx({
					t: "bolt",
					rank: "small",
					self: side === viewerNow,
					x: spot.x,
					y: spot.y
				});
			});
		}
		if (!quiet && doomCast) playCue("boltPrep");
		if (!quiet && lashOpen) playCue("reflect");
		if (!quiet && lashBoom && lashWas) {
			playCue("boltSmall");
			for (const uid of [lashWas.bird, lashWas.foe]) for (const side of [0, 1]) {
				const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
				const was = index >= 0 ? index : prev.players[side].field.findIndex((mon) => mon?.uid === uid);
				const spot = was >= 0 ? SLOT_POS[screenSide(side, viewerNow)][was] : null;
				if (spot) emitFx({
					t: "bolt",
					rank: "small",
					self: side === viewerNow,
					x: spot.x,
					y: spot.y
				});
			}
		}
		if (!quiet && /Thu hồi quái/.test(said)) playCue("dispel");
		else if (!quiet && beamKill) playCue("spellRise");
		else if (!quiet && damageStart) playCue("spellRise");
		else if (!quiet && hellBoom) {
			if (!(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun")) playCue("swordBoom");
		} else if (!quiet && demonBoom) playCue("swordBoom");
		else if (!quiet && swordBoom) {
			if (!(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun")) {
				if (!cameFromBeam) playCue("spellRise");
				playCue("swordBoom", cameFromBeam ? 0 : .24);
			}
		} else if (!quiet && gazeBoom && attackWas) {
			playCue("laserBoom");
			const from = slotPoint(prev, attackWas.attacker, viewerNow);
			const hit = laserDrops(prev, duel, viewerNow)[0];
			const to = hit ?? (attackWas.kind === "melee" ? slotPoint(prev, attackWas.defender, viewerNow) : aimPoint(prev, attackWas, viewerNow));
			if (from && to) emitFx({
				t: "laser",
				x1: from.x,
				y1: from.y,
				x2: to.x,
				y2: to.y
			});
			const boltAt = to ?? hit;
			laserTimers.current.push(window.setTimeout(() => {
				playCue("boltSmall");
				if (boltAt) emitFx({
					t: "bolt",
					rank: "small",
					self: hit?.spot === "self",
					x: boltAt.x,
					y: boltAt.y
				});
			}, LASER_MS));
		} else if (!quiet && whipBoom && attackWas) {
			playCue("boltBoom");
			const mine = attackWas.attacker;
			for (const side of [0, 1]) {
				const index = prev.players[side].field.findIndex((mon) => mon?.uid === mine);
				const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
				if (spot) emitFx({
					t: "bolt",
					rank: "small",
					self: side === viewerNow,
					x: spot.x,
					y: spot.y
				});
			}
			if (attackWas.kind === "melee") for (const side of [0, 1]) {
				const index = prev.players[side].field.findIndex((mon) => mon?.uid === attackWas.defender);
				const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
				if (spot) emitFx({
					t: "bolt",
					rank: "big",
					x: spot.x,
					y: spot.y
				});
			}
			else {
				const face = aimPoint(prev, attackWas, viewerNow);
				if (face) emitFx({
					t: "bolt",
					rank: "big",
					x: face.x,
					y: face.y
				});
			}
		} else if (!quiet && hornBoom) {
			if (!wasHorn) playCue("boltPrep");
			playCue("boltSmall", wasHorn ? 0 : .24);
		} else if (!quiet && monsterKill && !whipNow && !whipBoom && !/Sấm lôi phá/.test(said) && !/Sấm sét tận thế/.test(said) && !/Roi điện/.test(said) && !/Roi sấm/.test(said) && !(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun") && !/cường hoá và tiêu diệt/.test(said) && !/quét cả sân/.test(said)) {
			if (!cameFromBeam) playCue("spellRise");
			playCue("spellBoom");
		} else if (!quiet && curseBoom) playCue("swordBoom");
		else if (!quiet && spent === "sung-loi-pha") {
			playCue("boltPrep");
			playCue("boltSmall", .24);
			window.setTimeout(() => {
				for (const side of [0, 1]) duel.players[side].field.forEach((mon, index) => {
					const was = prev.players[side].field[index];
					if (!mon?.horn || was?.horn) return;
					const spot = SLOT_POS[screenSide(side, viewerNow)][index];
					if (spot) emitFx({
						t: "bolt",
						rank: "small",
						self: side === viewerNow,
						x: spot.x,
						y: spot.y
					});
				});
			}, 240);
		} else if (!quiet && (BIND_SPELLS.has(spent) || beeBind || beeLand)) playCue("chain");
		else if (!quiet && REFLECT_SPELLS.has(spent)) playCue("reflect");
		else if (!quiet && spent === "giap-co-khi" && /bị phản vào/.test(said)) playCue("reflect");
		else if (!quiet && DISPEL_SPELLS.has(spent)) playCue("dispel");
		if (!quiet && /thổi độc|Thổi độc/.test(said) && /sát thương phép/.test(said)) playCue("poison", 1.15);
		else if (!quiet && /sát thương phép/.test(said) && /bào mòn/.test(said)) playCue("poison", 1.15);
		else if (!quiet && /trúng độc|chết vì độc|bị bào mòn|chết vì bào mòn|Virus ăn mòn (bắt đầu|gây|tiêu diệt|loại)/.test(said)) playCue("poison");
		const pendingChanged = duel.pending !== prev.pending;
		const armingGun = Boolean(duel.reel?.kind === "gun" && !prev.reel);
		const started = pendingChanged && duel.pending ? shotLook(duel, duel.pending) : null;
		const finished = pendingChanged && !duel.pending && !armingGun ? shotLook(prev, prev.pending) : null;
		const stamped = !started && !finished && duel.skill && duel.fx !== prev.fx ? skillLook(duel.skill.id, duel.skill.index) : null;
		const fromSpell = spent ? spellFxLook(spent) : null;
		const boomSpell = prev.pending?.kind === "spell" && duel.pending?.kind !== "spell" ? prev.pending.cardId : "";
		const boomFx = boomSpell ? spellFxLook(boomSpell) : null;
		const spellCard = Boolean(doomLook && doomLook !== "none" || boomFx && boomFx !== "none" || fromSpell && fromSpell !== "none" && !stamped && !finished);
		const look = started || finished || stamped || (fromSpell && fromSpell !== "none" ? fromSpell : null) || (doomLook && doomLook !== "none" ? doomLook : null) || (boomFx && boomFx !== "none" ? boomFx : null);
		const hud = loadBoard().marks;
		const wait = killWait(prev, duel, look, spellCard);
		const rawShown = showEffects(prev, duel, viewerNow, hud);
		const shown = rawShown && quiet ? {
			...rawShown,
			shake: false,
			burst: null,
			floaters: rawShown.floaters.filter((item) => item.spot === "self" && !item.heal && item.text !== "Hạ"),
			motion: {
				pops: [],
				lunges: lunged || beam ? [strikeUid(duel) || strikeUid(prev)].filter(Boolean) : [],
				hits: []
			}
		} : rawShown;
		if (shown) {
			if (shown.shake && !quiet) emitFx({
				t: "shake",
				act: "shake",
				spot: "center",
				power: 1
			});
			const casting = shown.burst?.tone === "heal" ? "healSpell" : shown.burst ? "spell" : null;
			const grouped = look === "spell" || look === "fire" || look === "gun" || look === "bolt" || look === "spark" || look === "tide-small" || look === "tide-mid" || look === "tide-big";
			if (!quiet && duel.fx !== prev.fx) for (const mend of duel.mends ?? []) for (const side of [0, 1]) {
				const index = duel.players[side].field.findIndex((unit) => unit?.uid === mend.uid);
				if (index < 0) continue;
				const spot = SLOT_POS[screenSide(side, viewerNow)][index];
				if (!spot) continue;
				emitFx({
					t: "ring",
					act: "heal",
					spot: side === viewerNow ? "self" : "target",
					x: spot.x,
					y: spot.y,
					color: "#3ec6ff",
					power: 1.05
				});
			}
			if (!quiet) for (const item of shown.floaters) {
				const act = item.heal ? "heal" : item.text === "Hạ" ? "kill" : casting === "healSpell" ? "heal" : "hurt";
				if (grouped && !item.heal && item.text !== "Hạ") continue;
				if (item.heal) emitFx({
					t: "ring",
					act,
					spot: item.spot,
					x: item.x,
					y: item.y,
					color: "#3ec6ff",
					power: .95
				});
				else emitFx({
					t: "burst",
					act,
					spot: item.spot,
					x: item.x,
					y: item.y,
					color: item.text === "Hạ" ? "#ffb020" : "#ff4d4d",
					power: item.text === "Hạ" ? 1.4 : .95
				});
			}
			for (const key of shown.motion.pops) {
				const [raw, indexRaw] = key.split("-");
				const side = Number(raw);
				const spot = SLOT_POS[screenSide(side, viewerNow)][Number(indexRaw)];
				if (spot) emitFx({
					t: "ring",
					act: "summon",
					spot: side === viewerNow ? "self" : "target",
					x: spot.x,
					y: spot.y,
					color: "#ffb347",
					power: 1.15
				});
			}
			for (const uid of shown.motion.lunges) {
				let fromSide = 0;
				let fromIndex = -1;
				for (const side of [0, 1]) {
					const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
					if (index >= 0) {
						fromSide = side;
						fromIndex = index;
					}
				}
				if (fromIndex < 0) continue;
				const from = SLOT_POS[screenSide(fromSide, viewerNow)][fromIndex];
				const pending = duel.pending;
				const foeSide = 1 - fromSide;
				const aimed = pending?.kind === "melee" || pending?.kind === "gnaw" ? duel.hold?.blocker ?? pending.defender : pending?.kind === "beam" ? pending.target : "";
				const foeIndex = aimed ? duel.players[foeSide].field.findIndex((mon) => mon?.uid === aimed) : -1;
				const face = HP_BOX[screenSide(foeSide, viewerNow)];
				const to = pending?.kind === "face" || pending?.kind === "beam" && !pending.target ? {
					x: face.x + face.w / 2,
					y: face.y + face.h / 2
				} : foeIndex >= 0 ? SLOT_POS[screenSide(foeSide, viewerNow)][foeIndex] : null;
				if (from && to && duel.pending?.kind !== "beam") {
					const shooter = fieldMon(duel, uid);
					if (!shooter?.horn && !shooter?.gaze) emitFx({
						t: "beam",
						act: "attack",
						x1: from.x,
						y1: from.y,
						x2: to.x,
						y2: to.y,
						color: "#ff8a00"
					});
				}
			}
		}
		if (!quiet && look) {
			const hits = [];
			const seen = /* @__PURE__ */ new Set();
			const add = (point) => {
				if (!point) return;
				const key = `${Math.round(point.x)}-${Math.round(point.y)}`;
				if (seen.has(key)) return;
				seen.add(key);
				hits.push(point);
			};
			if (shown) {
				for (const hit of shown.floaters) if (!hit.heal) add(hit);
			}
			if (shown) for (const fall of shown.falls) add(fall.floater);
			if (hits.length === 0) add(aimPoint(started ? duel : prev, started ? duel.pending : prev.pending, viewerNow));
			if (look === "spell" && hits.length === 0) {
				const aim = duel.skill?.aim;
				if (aim) for (const side of [0, 1]) {
					const index = duel.players[side].field.findIndex((unit) => unit?.uid === aim);
					const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
					if (spot) add(spot);
				}
			}
			const openingFire = started === "fire" && finished !== "fire" || fromSpell === "fire" && duel.pending?.kind === "spell" && prev.pending?.kind !== "spell";
			const openingGun = started === "gun" && finished !== "gun" || fromSpell === "gun" && duel.pending?.kind === "spell" && prev.pending?.kind !== "spell";
			if (look === "tide-small" || look === "tide-mid" || look === "tide-big") {
				if (!(Boolean(started) && !finished && (look === "tide-mid" || look === "tide-big"))) {
					const rank = look === "tide-big" ? "big" : look === "tide-mid" ? "mid" : "small";
					for (const hit of hits) emitFx({
						t: "tide",
						rank,
						x: hit.x,
						y: hit.y
					});
				}
			} else if (look === "fire" || look === "gun") {
				const opening = look === "gun" ? openingGun : openingFire;
				if (!quiet && look === "gun") playCue(opening ? "gunPrep" : "gunBoom");
				if (!opening && (look === "gun" || fireBlastOn())) {
					const shot = finished ? prev.pending : duel.pending;
					const board = finished ? prev : duel;
					const aimed = aimPoint(board, shot, viewerNow);
					const casterUid = shot?.kind === "beam" || shot?.kind === "gnaw-skill" ? shot.caster : shot?.kind === "melee" || shot?.kind === "face" ? shot.attacker : "";
					let caster = null;
					if (casterUid) for (const side of [0, 1]) {
						const index = board.players[side].field.findIndex((mon) => mon?.uid === casterUid);
						if (index >= 0) caster = SLOT_POS[screenSide(side, viewerNow)][index] ?? null;
					}
					const landed = hits.filter((hit) => !caster || Math.abs(hit.x - caster.x) > 3 || Math.abs(hit.y - caster.y) > 3);
					const hellShot = Boolean(casterUid && fieldMon(board, casterUid)?.cardId === "mat-do-tan-pha");
					const splash = duel.skill?.id === "may-nem-bom-hinh-nhen" || duel.skill?.id === "thuong-quan-long" || duel.skill?.id === "loi-nguyen-cua-rong";
					const where = splash ? [] : hellShot ? landed.length ? landed : aimed ? [aimed] : [{
						x: 42,
						y: 44
					}] : aimed ? [aimed] : landed.length ? landed : [{
						x: 42,
						y: 44
					}];
					if (splash) {
						const seen = /* @__PURE__ */ new Set();
						for (const id of duel.skill?.hits ?? []) {
							const point = splashMarkPoint(duel, id, viewerNow, shown?.falls ?? []);
							if (!point) continue;
							const key = `${Math.round(point.x)}-${Math.round(point.y)}`;
							if (seen.has(key)) continue;
							seen.add(key);
							emitFx({
								t: "fire",
								x: point.x,
								y: point.y
							});
						}
					} else for (const hit of where) emitFx({
						t: "fire",
						x: hit.x,
						y: hit.y
					});
				}
			} else if ((look === "bolt" || look === "spark") && !started) {
				const rank = look === "bolt" ? "big" : "small";
				if (look === "bolt") playCue("boltBoom");
				const where = hits.length ? hits : [{
					x: 53,
					y: 30
				}];
				for (const hit of where) emitFx({
					t: "bolt",
					rank,
					self: rank === "small" && hit.spot === "self",
					x: hit.x,
					y: hit.y
				});
			} else if (!started && duel.skill?.id === "ma-dao-si" && (duel.skill.vols?.length ?? 0) > 1) {
				const count = duel.skill.vols?.length ?? 0;
				const id = duel.skill.hits?.[0];
				const point = (id ? splashMarkPoint(duel, id, viewerNow, shown?.falls ?? []) : null) ?? hits[0];
				if (point) for (let i = 0; i < count; i += 1) window.setTimeout(() => {
					emitFx({
						t: "burst",
						act: "spell",
						spot: "target",
						x: point.x,
						y: point.y,
						color: "#ff4d4d",
						power: 1.1
					});
				}, i * 420);
				emitFx({
					t: "ring",
					act: "spell",
					spot: "center",
					x: 42,
					y: 44,
					color: "#ffd36a",
					power: 1.7
				});
				for (let i = 1; i < count; i += 1) playCue("spellBoom", i * .42);
			} else if (!started && (hits.length > 0 || finished || stamped || look === "spell")) {
				for (const hit of hits) emitFx({
					t: "burst",
					act: "spell",
					spot: "target",
					x: hit.x,
					y: hit.y,
					color: "#ff4d4d",
					power: 1.1
				});
				emitFx({
					t: "ring",
					act: "spell",
					spot: "center",
					x: 42,
					y: 44,
					color: "#ffd36a",
					power: 1.7
				});
			}
		}
		const beamDrops = laserDrops(prev, duel, viewerNow);
		if (beamDrops.length) for (const drop of beamDrops) {
			const n = drop.from - drop.to;
			const step = LASER_MS / n;
			for (let i = 1; i <= n; i += 1) {
				const hp = drop.from - i;
				laserTimers.current.push(window.setTimeout(() => setLaserHp((cur) => ({
					...cur,
					[drop.key]: hp
				})), Math.round(i * step)));
			}
		}
		else setLaserHp((cur) => Object.keys(cur).length ? {} : cur);
		if (!shown) return;
		const token = wave.current + 1;
		wave.current = token;
		if (shown.shake) {
			setShake(true);
			window.setTimeout(() => setShake(false), 640);
		}
		if (shown.floaters.length > 0) {
			setFloaters((current) => [...current, ...shown.floaters]);
			const ids = new Set(shown.floaters.map((item) => item.id));
			const trail = Math.round(Math.max(0, ...shown.floaters.map((item) => (item.delay ?? 0) * 1e3)));
			window.setTimeout(() => setFloaters((current) => current.filter((item) => !ids.has(item.id))), 1500 + trail);
		}
		if (shown.falls.length > 0) {
			const arm = (falls, fadeAt) => {
				setLinger((current) => {
					return [...current.filter((item) => !falls.some((fall) => fall.side === item.side && fall.index === item.index)), ...falls.map((fall) => ({
						id: fall.floater.id,
						side: fall.side,
						index: fall.index,
						mon: fall.mon
					}))];
				});
				window.setTimeout(() => {
					const ids = new Set(falls.map((fall) => fall.floater.id));
					setLinger((current) => current.map((item) => ids.has(item.id) ? {
						...item,
						fading: true
					} : item));
					if (!quiet) {
						setFloaters((current) => [...current, ...falls.map((fall) => fall.floater)]);
						for (const fall of falls) emitFx({
							t: "burst",
							act: "kill",
							spot: fall.floater.spot,
							x: fall.floater.x,
							y: fall.floater.y,
							color: "#ffb020",
							power: 1.4
						});
						window.setTimeout(() => setFloaters((current) => current.filter((item) => !ids.has(item.id))), 1500);
					}
				}, fadeAt);
				window.setTimeout(() => {
					const ids = new Set(falls.map((fall) => fall.floater.id));
					setLinger((current) => current.filter((item) => !ids.has(item.id)));
				}, fadeAt + 300);
			};
			const beamed = shown.falls.filter((fall) => fall.laser);
			const rest = shown.falls.filter((fall) => !fall.laser);
			if (beamed.length) arm(beamed, LASER_MS);
			if (rest.length) arm(rest, Math.max(0, wait) + Math.max(0, ...rest.map((fall) => fall.hold ?? 0)));
		}
		if (shown.burst) {
			setBurst(shown.burst);
			window.setTimeout(() => setBurst((current) => current?.id === shown.burst?.id ? null : current), 1600);
		}
		if (shown.motion.pops.length || shown.motion.lunges.length || shown.motion.hits.length) {
			setMotion(shown.motion);
			window.setTimeout(() => {
				if (wave.current === token) setMotion({
					pops: [],
					lunges: [],
					hits: []
				});
			}, 1400);
		}
	}, [duel]);
	(0, import_react.useEffect)(() => {
		if (!duel) {
			emitFx({
				t: "ailments",
				act: "ailment",
				marks: []
			});
			return;
		}
		const actorNow = boardActor(duel);
		const viewerNow = viewerSide(duel, actorNow, net?.seat ?? null);
		const marks = [];
		for (const side of [0, 1]) duel.players[side].field.forEach((mon, index) => {
			if (!mon) return;
			if (!(mon.curse || mon.vulnerable > 0 || mon.noBlock && !isStill(mon.cardId) || mon.bleed > 0 || Boolean(mon.erode && mon.erode.left !== 0))) return;
			const box = SLOT_BOX[screenSide(side, viewerNow)][index];
			if (!box) return;
			marks.push({
				id: mon.uid,
				x: box.x + box.w / 2,
				y: box.y + box.h / 2,
				spot: side === viewerNow ? "self" : "target"
			});
		});
		emitFx({
			t: "ailments",
			act: "ailment",
			marks
		});
	}, [duel, net]);
	const fuseKey = (() => {
		if (!duel || duel.step !== "main" || duel.winner) return "";
		const player = duel.players[duel.turn];
		const bits = [];
		const ids = player.field.filter((mon) => Boolean(mon)).map((mon) => mon.cardId);
		player.reserve.forEach((held, index) => {
			player.field.forEach((mon) => {
				if (mon && (findFusion(held.id, mon.cardId) || findKnightFusion(held.id, mon.cardId, ids))) bits.push(`${index}:${mon.uid}`);
			});
		});
		return bits.length ? `${duel.turn}|${bits.join("|")}` : "";
	})();
	(0, import_react.useEffect)(() => {
		if (!fuseKey) {
			setFuseOn(false);
			return;
		}
		setFuseOn(true);
		const timer = window.setTimeout(() => setFuseOn(false), 3500);
		return () => window.clearTimeout(timer);
	}, [fuseKey]);
	(0, import_react.useEffect)(() => {
		if (!fuseAsk || fuseAsk.phase === "ask" || fuseAsk.phase === "preview") return;
		if (fuseAsk.phase === "fly") playCue("fusion");
		const wait = fuseAsk.phase === "fly" ? 780 : 700;
		const next = fuseAsk.phase === "fly" ? "flash" : "preview";
		const timer = window.setTimeout(() => {
			setFuseAsk((current) => current && current.id === fuseAsk.id && current.phase === fuseAsk.phase ? {
				...current,
				phase: next
			} : current);
		}, wait);
		return () => window.clearTimeout(timer);
	}, [fuseAsk?.id, fuseAsk?.phase]);
	if (duel) turnClock.current = duel.clock ?? 1;
	if (!duel) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "stage",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: wait || "Đang mở đấu trường…" }), net?.seat === "host" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "room-code",
			children: net.code
		}) : null]
	});
	const responding = duel.step === "respond";
	const actor = boardActor(duel);
	const viewer = viewerSide(duel, actor, net?.seat ?? null);
	const you = duel.players[viewer];
	const foe = duel.players[viewer === 0 ? 1 : 0];
	const mine = !busy && duel.winner === null && (duel.mode === "hotseat" || duel.mode === "test" || actor === (duel.mode === "ai" ? 0 : viewer));
	const gemHold = duel.gemCap === viewer || duel.gemWarn === viewer;
	const canPlay = mine && duel.step === "main" && duel.turn === viewer && !duel.upkeep && !gemHold;
	const dueKnight = mine ? knightDue(duel, viewer) : null;
	const upkeepUnit = mine && duel.upkeep && duel.turn === viewer ? you.field.find((unit) => unit !== null && unit.uid === duel.upkeep && unit.hp > 0) ?? null : null;
	const demonUpkeep = upkeepUnit?.cardId === "trieu-hoi-ac-ma";
	const angelUpkeep = upkeepUnit?.cardId === "quai-thu-thien-su";
	const askUpkeep = Boolean(demonUpkeep || angelUpkeep);
	const testCards = (testKind === "monster" ? [...MONSTERS, ...FORMS].sort((a, b) => a.stars - b.stars || a.name.localeCompare(b.name, "vi")) : [...SPELLS].sort((a, b) => a.gems - b.gems || a.name.localeCompare(b.name, "vi"))).filter((card) => card.name.toLocaleLowerCase("vi").includes(testFind.trim().toLocaleLowerCase("vi")));
	const otherSide = viewer === 0 ? 1 : 0;
	const canIntercept = responding && duel.hold?.priority === viewer && duel.pending?.kind === "face";
	const cotton = mine && responding && duel.hold?.priority === viewer ? cottonOffer(duel, viewer) : {
		self: false,
		copy: false,
		hand: false,
		handCopy: false
	};
	const standHand = Boolean(mine && canStandHand(duel, viewer));
	const beam = duel.pending?.kind === "beam" ? duel.pending : null;
	const horning = hornPending(duel);
	const gazePending = Boolean(duel.pending && (duel.pending.kind === "face" || duel.pending.kind === "melee") && fieldMon(duel, duel.pending.attacker)?.gaze && !fieldMon(duel, duel.pending.attacker)?.horn);
	const groupedShot = shotLook(duel, duel.pending);
	const beamFromBottom = beam ? you.field.some((unit) => unit?.uid === beam.caster) : horning ? you.field.some((unit) => unit?.uid === (duel.pending?.kind === "face" || duel.pending?.kind === "melee" ? duel.pending.attacker : "")) : false;
	const board = loadBoard();
	const marks = board.marks;
	const fieldLayout = loadField();
	const selected = you.field.find((mon) => mon && aim && "uid" in aim && aim.uid === mon.uid) ?? null;
	const selectedCard = selected ? monsterCard(selected.cardId) : void 0;
	function seal(prev, next) {
		const memo = matchRef.current;
		const kept = noteFinishedAi(prev, next, memo);
		if (!kept.saved) return;
		if (memo) memo.saved = true;
		else matchRef.current = {
			id: kept.id,
			startedAt: kept.startedAt,
			decks: null,
			saved: true
		};
	}
	function apply(next) {
		if (!duel || next === duel) return;
		seal(duel, next);
		if (duel.mode === "test") setTestPast((list) => [...list, structuredClone(duel)].slice(-40));
		const previous = duel;
		const ticket = pushGen.current + 1;
		pushGen.current = ticket;
		holdNotice(next.live, true, next.clock);
		setAim(null);
		setInspect(null);
		setBlockChoice(null);
		setChronoAsk(null);
		setChronoWarn(null);
		setChronoSpin(null);
		setBusy(true);
		window.setTimeout(() => setBusy(false), 180);
		setDuel(next);
		const seat = netRef.current;
		if (duel.mode !== "net" || !seat) return;
		pushDuel({ data: {
			code: seat.code,
			seat: seat.seat,
			duel: JSON.stringify({
				...next,
				glimpse: null
			})
		} }).then((pushed) => {
			if (ticket !== pushGen.current) return;
			if (!pushed.ok) {
				holdNotice(pushed.error);
				setDuel(previous);
				return;
			}
			rev.current = pushed.rev;
		});
	}
	function pickChrono(targetUid) {
		if (!duel || aim?.kind !== "skill") return;
		if (targetUid === aim.uid) {
			setAim(null);
			return;
		}
		if (!chronoChoice(duel, aim.uid, targetUid) || chronoHighAlly(duel, aim.uid, targetUid)) {
			holdNotice("Không chọn được mục tiêu này");
			return;
		}
		const ally = duel.players[duel.turn].field.find((unit) => unit?.uid === targetUid) ?? null;
		if (ally) {
			setAim(null);
			if (chronoImmortal(ally) || chronoSpecial(ally)) {
				setChronoAsk({
					caster: aim.uid,
					target: targetUid,
					age: false,
					pass: true
				});
				return;
			}
			apply(useSkill(duel, aim.uid, targetUid, 0, true));
			return;
		}
		const foeSide = 1 - duel.turn;
		const enemy = duel.players[foeSide].field.find((unit) => unit?.uid === targetUid);
		if (!enemy || chronoImmortal(enemy)) {
			holdNotice("Không chọn được mục tiêu này");
			return;
		}
		setAim(null);
		setChronoAsk({
			caster: aim.uid,
			target: targetUid,
			age: !chronoSpecial(enemy),
			pass: chronoSpecial(enemy)
		});
	}
	function clearShown() {
		setFloaters([]);
		setMotion({
			pops: [],
			lunges: [],
			hits: []
		});
		setBurst(null);
		setShake(false);
		setReactMarks([]);
		setLockFlash(null);
		setStarFlash(null);
	}
	function undoTest() {
		const prev = testPast.at(-1);
		if (!prev) return;
		prevDuel.current = prev;
		seenViewer.current = viewerSide(prev, boardActor(prev), netRef.current?.seat ?? null);
		trailLog.current = [];
		windupText.current = null;
		setTrailDots([]);
		setPinnedId(null);
		holdNotice("");
		setAim(null);
		setInspect(null);
		setBlockChoice(null);
		setChronoAsk(null);
		setChronoWarn(null);
		setChronoSpin(null);
		setKnightAsk(null);
		setHornAsk(null);
		setCottonAsk(null);
		setBlessArm(false);
		setSwapPick([]);
		setReflectPick(null);
		setAmbushPick(null);
		setStrike(null);
		setLook(null);
		setDrag(null);
		clearShown();
		setDuel(prev);
		setTestPast((list) => list.slice(0, -1));
	}
	function restartTest() {
		if (!duel || duel.mode !== "test") return;
		const fresh = createDuel(loadDeck(), "test");
		setTestPast((list) => [...list, structuredClone(duel)].slice(-40));
		prevDuel.current = fresh;
		seenViewer.current = viewerSide(fresh, boardActor(fresh), netRef.current?.seat ?? null);
		trailLog.current = [];
		windupText.current = null;
		setTrailDots([]);
		setPinnedId(null);
		holdNotice("Ván test bắt đầu lại.");
		setAim(null);
		setInspect(null);
		setBlockChoice(null);
		setChronoAsk(null);
		setChronoWarn(null);
		setChronoSpin(null);
		setKnightAsk(null);
		setHornAsk(null);
		setCottonAsk(null);
		setBlessArm(false);
		setSwapPick([]);
		setReflectPick(null);
		setAmbushPick(null);
		setStrike(null);
		setLook(null);
		setDrag(null);
		clearShown();
		setDuel(fresh);
	}
	function armReset(event) {
		event.currentTarget.setPointerCapture(event.pointerId);
		window.clearTimeout(resetHold.current);
		resetHold.current = window.setTimeout(() => {
			resetHold.current = 0;
			restartTest();
		}, 650);
	}
	function releaseReset() {
		if (!duel || !resetHold.current) return;
		window.clearTimeout(resetHold.current);
		resetHold.current = 0;
		if (!canTestReset(duel)) return;
		apply(testReset(duel));
	}
	function cancelReset() {
		window.clearTimeout(resetHold.current);
		resetHold.current = 0;
	}
	function swallowNextClick() {
		const stop = (event) => {
			event.preventDefault();
			event.stopPropagation();
			window.removeEventListener("click", stop, true);
		};
		window.addEventListener("click", stop, true);
		window.setTimeout(() => window.removeEventListener("click", stop, true), 500);
	}
	function openHand(pile, index) {
		if (suppressClick.current) {
			suppressClick.current = false;
			return;
		}
		setInspect((current) => current?.pile === pile && current.index === index ? null : {
			pile,
			index
		});
	}
	function begin(event, payload) {
		if (!mine) return;
		suppressClick.current = false;
		grab.current = payload;
		origin.current = {
			x: event.clientX,
			y: event.clientY,
			moved: false,
			t: Date.now(),
			pan: false,
			lastX: event.clientX
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		window.clearTimeout(riteHold.current);
		if (payload.kind === "summon") {
			const level = duel?.players[viewer].reserve[payload.index]?.saved?.level ?? 1;
			if (vowCap(payload.card.id, level) > 0) riteHold.current = window.setTimeout(() => {
				if (origin.current.moved) return;
				suppressClick.current = true;
				setRiteHand((current) => current === payload.index ? null : payload.index);
			}, 480);
		}
	}
	function move(event) {
		const payload = grab.current;
		if (!payload) return;
		const dx = event.clientX - origin.current.x;
		const dy = event.clientY - origin.current.y;
		if (!origin.current.moved && dx * dx + dy * dy < 81) return;
		window.clearTimeout(riteHold.current);
		const strip = handStrip.current;
		if (!origin.current.moved && (payload.kind === "summon" || payload.kind === "spell") && strip && strip.scrollWidth > strip.clientWidth + 2 && Math.abs(dx) > Math.abs(dy)) origin.current.pan = true;
		origin.current.moved = true;
		if (origin.current.pan && strip) {
			strip.scrollLeft -= event.clientX - origin.current.lastX;
			origin.current.lastX = event.clientX;
			return;
		}
		setInspect(null);
		setDrag({
			...payload,
			x: event.clientX,
			y: event.clientY
		});
	}
	function commitBlock(uid, skill, buff) {
		if (!duel) return;
		let next = assignBlock(duel, uid, skill);
		if (buff) next = answerFairy(next, uid, true);
		setBlessArm(false);
		apply(next);
	}
	function offerBlock(uid) {
		if (!duel) return;
		const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
		if (!mon || mon.dim || mon.stun > 0 || mon.noBlock || (mon.path ?? 0) > 0) {
			holdNotice("Quái này không chặn được");
			return;
		}
		if (mon.cardId === "ky-si-bong-toi" && !mon.clash) {
			const pending = duel.pending;
			const attackerUid = pending && (pending.kind === "face" || pending.kind === "melee") ? pending.attacker : "";
			const attacker = foe.field.find((unit) => unit?.uid === attackerUid) ?? null;
			setKnightAsk({
				uid: mon.uid,
				foeUid: null,
				face: false,
				block: true,
				room: knightRoom(mon, attacker, you.field, foe.field)
			});
			return;
		}
		if (blessArm && mon.cardId === "yeu-tinh-chuc-phuc") {
			holdNotice("Kéo quái khác lên để chặn.");
			return;
		}
		const gnaw = mon.cardId === "chien-si-gam-nham" && you.orb >= skillManaCost(mon.cardId);
		const skill = duel.hold?.armed === uid ? true : gnaw ? null : false;
		const fairy = you.orb >= skillManaCost("yeu-tinh-chuc-phuc", 1) && you.field.some((unit) => unit && unit.cardId === "yeu-tinh-chuc-phuc" && unit.uid !== uid && !unit.dim && unit.stun === 0);
		const buff = blessArm && fairy ? true : fairy ? null : false;
		if (skill === null || buff === null) {
			setBlockChoice({
				uid,
				skill,
				buff
			});
			return;
		}
		commitBlock(uid, skill, buff);
	}
	function pickBlock(patch) {
		if (!blockChoice) return;
		const next = {
			...blockChoice,
			...patch
		};
		if (next.skill !== null && next.buff !== null) {
			commitBlock(next.uid, next.skill, next.buff);
			return;
		}
		setBlockChoice(next);
	}
	function under(x, y) {
		return document.elementsFromPoint(x, y).find((node) => !node.closest(".ghost") && !node.closest(".inspect-dismiss") && !node.closest(".inspect-card")) ?? null;
	}
	function openDig(index) {
		if (!duel) return;
		if (!canTargetFoe(duel)) {
			holdNotice("Lượt đầu không được nhắm đối thủ.");
			return;
		}
		if (digChoices(duel, viewer).length === 0) {
			holdNotice("Đối thủ chưa có lá đã rời sân.");
			return;
		}
		setDigPick({
			index,
			id: null
		});
	}
	function finishDrop(hit, payload) {
		if (!duel) return;
		const slotEl = hit?.closest("[data-slot]");
		const owner = slotEl ? Number(slotEl.dataset.owner) : NaN;
		const index = slotEl ? Number(slotEl.dataset.index) : NaN;
		const foeUid = slotEl?.dataset.uid ?? "";
		if (payload.kind === "summon") {
			if (responding && duel.hold && payload.card.id === "cuc-bong-ma-quai" && slotEl && owner === viewer && slotEl.dataset.empty === "1") {
				setCottonAsk("hand");
				return;
			}
			const partner = foeUid ? you.field.find((unit) => unit?.uid === foeUid) : null;
			const ids = you.field.filter((unit) => Boolean(unit)).map((unit) => unit.cardId);
			const recipe = partner ? findFusion(payload.card.id, partner.cardId) ?? findKnightFusion(payload.card.id, partner.cardId, ids) : null;
			if (canPlay && recipe && partner && slotEl && owner === viewer && index >= 0 && index <= 2) {
				const board = slotEl.closest(".board")?.getBoundingClientRect();
				const handEl = document.querySelector(`[data-reserve="${payload.index}"]`);
				const spot = (el, fallback) => {
					if (!board || !el) return fallback;
					const box = el.getBoundingClientRect();
					return {
						x: (box.left + box.width / 2 - board.left) / board.width * 100,
						y: (box.top + box.height / 2 - board.top) / board.height * 100
					};
				};
				setFuseAsk({
					id: Date.now(),
					reserveIndex: payload.index,
					fieldUid: partner.uid,
					handId: payload.card.id,
					handLevel: you.reserve[payload.index]?.saved?.level ?? 1,
					fieldId: partner.cardId,
					fieldLevel: partner.level ?? 1,
					resultId: recipe.result,
					slot: index,
					phase: "ask",
					fromHand: spot(handEl, {
						x: 30,
						y: 88
					}),
					fromField: spot(slotEl, {
						x: 36,
						y: 70
					})
				});
				return;
			}
			const cap = vowCap(payload.card.id, you.reserve[payload.index]?.saved?.level ?? 1);
			const full = you.field.every((mon) => mon);
			const armed = riteHand === payload.index;
			if (canPlay && cap > 0 && slotEl && owner === viewer && index >= 0 && index <= 2 && (armed || full)) {
				setVowAsk({
					index: payload.index,
					slot: index,
					picks: []
				});
				return;
			}
			if (!canPlay || !slotEl || owner !== viewer || slotEl.dataset.empty !== "1" || index < 0 || index > 2) {
				holdNotice("Thả quái vào ô trống của bạn.");
				return;
			}
			apply(summon(duel, payload.index, index));
			return;
		}
		if (payload.kind === "spell") {
			if (!spellDragLive(payload.spellId, duel, viewer, payload.index)) {
				holdNotice("Chưa đủ điều kiện để dùng.");
				return;
			}
			if (payload.spellId === "ke-dao-mo") {
				openDig(payload.index);
				return;
			}
			if (payload.spellId === "hoan-doi") {
				setSwapPick([]);
				apply(castSpell(duel, payload.index, aimedUid(duel)));
				return;
			}
			const reactEl = hit?.closest("[data-react]");
			if (reactEl && payload.spellId !== "soi-xich-dia-nguc") {
				const kind = reactEl.dataset.react;
				const pending = duel.pending;
				const uid = payload.spellId === "co-may-thoi-gian" || payload.spellId === "giap-co-khi" ? aimedUid(duel) : kind === "block" ? duel.hold?.blocker ?? null : kind === "skill" && pending && "caster" in pending ? pending.caster : kind === "attack" && pending && "attacker" in pending ? pending.attacker : null;
				apply(castSpell(duel, payload.index, uid));
				return;
			}
			if (!mine || hit?.closest(".hand") || hit?.closest(".face-pile")) return;
			const uid = slotEl?.dataset.uid || "";
			if (payload.spellId === "soi-xich-dia-nguc") {
				const marked = slotEl && owner !== viewer ? foe.field.find((mon) => mon?.uid === uid) ?? null : null;
				if (!marked) {
					holdNotice("Chọn một quái đối thủ.");
					return;
				}
				apply(castSpell(duel, payload.index, marked.uid));
				return;
			}
			if (payload.spellId === "sung-loi-pha") {
				const ally = slotEl && owner === viewer ? you.field.find((mon) => mon?.uid === uid) ?? null : null;
				if (!ally || !hornFit(ally.cardId)) {
					holdNotice("Sừng không gắn dạng người, thiên thần hay thiên sứ.");
					return;
				}
			}
			if (payload.spellId === "phan-nguyen") {
				if (owner === viewer) {
					const ally = you.field.find((mon) => mon?.uid === uid) ?? null;
					if (!ally || !harmShift(ally)) {
						holdNotice("Chọn đồng minh đang mang trạng thái xấu.");
						return;
					}
					setAim({
						kind: "spell",
						index: payload.index,
						spellId: payload.spellId,
						from: ally.uid
					});
					holdNotice("Chọn quái đối thủ để chuyển trạng thái.");
					return;
				}
				const from = aim?.kind === "spell" && aim.spellId === "phan-nguyen" ? aim.from : null;
				if (!from) {
					holdNotice("Chọn đồng minh đang mang trạng thái xấu trước.");
					return;
				}
				apply(castSpell(duel, payload.index, uid, false, from));
				setAim(null);
				return;
			}
			apply(castSpell(duel, payload.index, uid || null));
			return;
		}
		const pending = duel.pending;
		const reactEl = hit?.closest("[data-react]");
		if (payload.kind === "unit" && responding && duel.hold?.priority === viewer) {
			const guard = you.field.find((unit) => unit?.uid === payload.uid);
			const aimed = pending?.kind === "melee" || pending?.kind === "gnaw" ? pending.defender : pending?.kind === "beam" || pending?.kind === "gnaw-skill" || pending?.kind === "spell" ? pending.target : null;
			const kazura = aimed ? you.field.some((unit) => unit?.uid === aimed && unit.cardId === "kazura") : false;
			const ontoHer = Boolean(foeUid && you.field.some((unit) => unit?.uid === foeUid && unit.cardId === "kazura"));
			const ontoShot = Boolean(reactEl) || Boolean(hit?.closest("[data-beam]")) || pending && "attacker" in pending && foeUid === pending.attacker;
			if (guard?.cardId === "kizuran" && kazura && (ontoHer || ontoShot)) {
				apply(setCover(duel, guard.uid, true));
				return;
			}
		}
		if (reactEl && payload.kind === "unit" && duel.hold?.priority === viewer) {
			if (pending?.kind === "face") offerBlock(payload.uid);
			return;
		}
		if (responding && duel.hold?.priority === viewer && pending?.kind === "face" && pending) {
			const attackerUid = pending.attacker;
			if (Boolean(hit?.closest("[data-beam]")) || foeUid !== "" && foeUid === attackerUid) {
				offerBlock(payload.uid);
				return;
			}
			holdNotice("Chỉ chặn được đòn đánh vào người");
			return;
		}
		if (!canPlay) return;
		if (aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian") {
			if (foeUid && foeUid !== aim.uid) {
				pickChrono(foeUid);
				return;
			}
			holdNotice("Chọn một quái");
			return;
		}
		const aimingSkill = aim?.kind === "skill";
		if (aimingSkill && aim.index === 3) {
			const caster = you.field.find((unit) => unit?.uid === aim.uid);
			if (caster?.cardId === "nu-chua-dieu-nhan" || caster?.cardId === "nu-chua-dieu-nhan-hoan-my") {
				if (!aim.also) {
					if (!foeUid || owner === viewer) {
						holdNotice("Chọn một quái đối thủ");
						return;
					}
					setAim({
						kind: "skill",
						uid: aim.uid,
						index: 3,
						also: foeUid
					});
					holdNotice("Chọn quái của ta");
					return;
				}
				if (owner !== viewer || !foeUid) {
					holdNotice("Chọn quái của ta");
					return;
				}
				apply(useSkill(duel, aim.uid, foeUid, 3, true, aim.also));
				return;
			}
		}
		if (aimingSkill && selectedCard && allySkill(selectedCard.id)) {
			const selfOk = selectedCard.id === "thien-than-be-nho";
			if (slotEl && owner === viewer && foeUid && (selfOk || foeUid !== aim.uid)) {
				apply(useSkill(duel, aim.uid, foeUid, aim.index, true));
				return;
			}
			holdNotice(selfOk ? "Chọn một đồng minh" : "Chọn một quái đồng minh khác");
			return;
		}
		if (hit?.closest("[data-face]") || slotEl && owner !== viewer && foeUid) {
			if (aimingSkill) {
				const caster = you.field.find((unit) => unit?.uid === aim.uid);
				const card = caster ? monsterCard(caster.cardId) : void 0;
				const face = Boolean(hit?.closest("[data-face]"));
				if (face && card && !faceSkill(card.id, aim.index)) {
					holdNotice("Chọn một quái đối thủ");
					return;
				}
				const foeHit = face ? null : foeUid || null;
				apply(card && shotSkill(card.id) ? declareSkill(duel, aim.uid, foeHit, aim.index) : useSkill(duel, aim.uid, foeHit, aim.index, true));
				return;
			}
			const face = Boolean(hit?.closest("[data-face]"));
			const attacker = you.field.find((unit) => unit?.uid === payload.uid);
			if (!face && attacker?.hornNew && foeUid) {
				setHornAsk({
					uid: payload.uid,
					foeUid,
					mode: null
				});
				return;
			}
			if (!face && attacker?.cardId === "ky-si-bong-toi" && foeUid) {
				const foeMon = foe.field.find((unit) => unit?.uid === foeUid);
				const stars = foeMon ? monsterCard(foeMon.cardId)?.stars ?? 0 : 0;
				const room = foeMon && (foeMon.atk > attacker.atk || stars >= 4) ? 2 : 1;
				setKnightAsk({
					uid: payload.uid,
					foeUid,
					face: false,
					room
				});
				return;
			}
			apply(face ? attackFace(duel, payload.uid) : attackMonster(duel, payload.uid, foeUid));
			return;
		}
		holdNotice("Kéo lên quái địch, hoặc lên vùng máu địch để đánh người.");
	}
	function end(event) {
		const payload = grab.current;
		grab.current = null;
		const moved = origin.current.moved;
		const panned = origin.current.pan;
		origin.current.moved = false;
		origin.current.pan = false;
		window.clearTimeout(riteHold.current);
		setDrag(null);
		if (panned) {
			suppressClick.current = true;
			return;
		}
		if (!payload) return;
		if (!moved && payload.kind === "unit" && Date.now() - origin.current.t > 420) {
			const unit = you.field.find((mon) => mon?.uid === payload.uid);
			if (!Boolean(unit && duel && (gnawReady(duel, unit, viewer) || cottonReady(duel, unit, viewer) || monsterAlert(duel, unit, viewer) || mysticAlert(duel, unit, viewer)))) {
				suppressClick.current = true;
				setAim(null);
				setLook(unit ? fieldLook(unit, you.stars) : {
					name: payload.card.name,
					text: payload.card.skill
				});
			}
			return;
		}
		if (!moved) return;
		suppressClick.current = true;
		finishDrop(under(event.clientX, event.clientY), payload);
	}
	function onSlot(side, index) {
		if (!duel || !mine || duel.step !== "main" || side !== viewer) return;
		if (aim?.kind === "summon") apply(summon(duel, aim.index, index));
	}
	function onUnit(side, mon) {
		if (suppressClick.current) {
			suppressClick.current = false;
			return;
		}
		if (!mine || !duel) return;
		if (aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian") {
			if (mon.uid === aim.uid) {
				setAim(null);
				return;
			}
			pickChrono(mon.uid);
			return;
		}
		if (aim?.kind === "spell" && aim.spellId === "sung-loi-pha") {
			if (side === viewer && hornFit(mon.cardId)) {
				apply(castSpell(duel, aim.index, mon.uid));
				setAim(null);
			}
			return;
		}
		if (aim?.kind === "spell" && aim.spellId === "phan-nguyen") {
			if (!aim.from) {
				if (side === viewer && harmShift(mon)) {
					setAim({
						...aim,
						from: mon.uid
					});
					holdNotice("Chọn quái đối thủ để chuyển trạng thái.");
				}
				return;
			}
			if (side !== viewer) {
				apply(castSpell(duel, aim.index, mon.uid, false, aim.from));
				setAim(null);
			}
			return;
		}
		if (aim?.kind === "spell" && side !== viewer) {
			apply(castSpell(duel, aim.index, mon.uid));
			setAim(null);
			return;
		}
		if (aim?.kind === "attack" && side !== viewer) {
			const attacker = you.field.find((unit) => unit?.uid === aim.uid);
			if (attacker?.hornNew) {
				setHornAsk({
					uid: aim.uid,
					foeUid: mon.uid,
					mode: null
				});
				setAim(null);
				return;
			}
			if (attacker?.cardId === "ky-si-bong-toi" && !attacker.clash) {
				const stars = monsterCard(mon.cardId)?.stars ?? 0;
				const room = mon.atk > attacker.atk || stars >= 4 ? 2 : 1;
				setKnightAsk({
					uid: attacker.uid,
					foeUid: mon.uid,
					face: false,
					room
				});
				setAim(null);
				return;
			}
			apply(attackMonster(duel, aim.uid, mon.uid));
			return;
		}
		if (aim?.kind === "skill" && aim.index === 3) {
			const caster = you.field.find((unit) => unit?.uid === aim.uid);
			if (caster?.cardId === "nu-chua-dieu-nhan" || caster?.cardId === "nu-chua-dieu-nhan-hoan-my") {
				if (!aim.also) {
					if (side === viewer) {
						holdNotice("Chọn một quái đối thủ");
						return;
					}
					setAim({
						kind: "skill",
						uid: aim.uid,
						index: 3,
						also: mon.uid
					});
					holdNotice("Chọn quái của ta");
					return;
				}
				if (side !== viewer) {
					holdNotice("Chọn quái của ta");
					return;
				}
				apply(useSkill(duel, aim.uid, mon.uid, 3, true, aim.also));
				return;
			}
		}
		if (aim?.kind === "skill" && selectedCard && allySkill(selectedCard.id)) {
			const selfOk = selectedCard.id === "thien-than-be-nho";
			if (side === viewer && (selfOk || mon.uid !== aim.uid)) {
				apply(useSkill(duel, aim.uid, mon.uid, aim.index, true));
				return;
			}
			if (side === viewer) {
				setAim(null);
				return;
			}
			holdNotice(selfOk ? "Chọn một đồng minh" : "Chọn một quái đồng minh khác");
			return;
		}
		if (aim?.kind === "skill" && side !== viewer) {
			const caster = you.field.find((unit) => unit?.uid === aim.uid);
			const card = caster ? monsterCard(caster.cardId) : void 0;
			apply(card && shotSkill(card.id) ? declareSkill(duel, aim.uid, mon.uid, aim.index) : useSkill(duel, aim.uid, mon.uid, aim.index, true));
			return;
		}
		const ready = side === viewer && gnawReady(duel, mon, side);
		const cottonUp = side === viewer && cottonReady(duel, mon, side);
		const coverReady = side === viewer && !mon.dim && mon.cardId === "kizuran" && mon.stun === 0 && (mon.chain ?? 0) === 0 && (canPlay || responding && duel.hold?.priority === viewer);
		const hatchReady = side === viewer && canPlay && mon.cardId === "ken-ngai" && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.level ?? 0) >= 4 && (mon.level ?? 0) <= 5;
		const reelReady = side === viewer && canPlay && mon.cardId === "may-quay-thuong" && !mon.spun && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0;
		const sealed = mon.stun > 0 || (mon.chain ?? 0) > 0;
		if (side === viewer && canPlay && aim?.kind === "menu" && aim.uid === mon.uid) {
			setAim(null);
			return;
		}
		const fairyUp = side === viewer && monsterAlert(duel, mon, side) && mon.cardId === "yeu-tinh-chuc-phuc";
		const wallUp = side === viewer && canWall(duel, mon.uid);
		const spiritUp = side === viewer && canSpirit(duel, mon.uid);
		const mysticUp = side === viewer && mysticAlert(duel, mon, side);
		const reactive = ready || cottonUp || coverReady || fairyUp || wallUp || spiritUp || mysticUp;
		if (side === viewer && sealed) return;
		if (side === viewer && (hatchReady || reelReady || !mon.dim && (canPlay || reactive))) {
			setAim({
				kind: "menu",
				uid: mon.uid
			});
			setLook(null);
			return;
		}
		const owner = side === viewer ? you : foe;
		if (side !== viewer && owner.sea && !mon.cage && !mon.shown && (mon.cardId === "trai-tim-hai-long" || mon.cardId === "sua-hut-ma-phap" || mon.cardId === "kraken")) {
			setLook({
				name: "quái thú ẩn mình",
				text: "Không thấy kỹ năng hay chỉ số."
			});
			return;
		}
		setLook(fieldLook(mon, owner.stars));
	}
	const marksView = [
		[
			"foeHp",
			laserHp[`face:${viewer === 0 ? 1 : 0}`] ?? foe.hp,
			""
		],
		[
			"foeOrb",
			foe.orb,
			""
		],
		[
			"foeFlask",
			Math.min(1, foe.flask),
			"bình"
		],
		[
			"foeStars",
			foe.stars,
			"sao"
		],
		[
			"foeGems",
			foe.starGems,
			"thừa"
		],
		[
			"foeHand",
			foe.hand.length,
			"phép"
		],
		[
			"foeReserve",
			foe.reserve.length,
			"dự bị"
		],
		[
			"youHp",
			laserHp[`face:${viewer}`] ?? you.hp,
			""
		],
		[
			"youOrb",
			you.orb,
			""
		],
		[
			"youFlask",
			Math.min(1, you.flask),
			"bình"
		],
		[
			"youStars",
			you.stars,
			"sao"
		],
		[
			"youGems",
			you.starGems,
			"thừa"
		]
	];
	const reserveHeld = inspect?.pile === "reserve" ? you.reserve[inspect.index] : void 0;
	const reserveToll = Boolean(reserveHeld?.toll);
	const spellToll = inspect?.pile === "spell" ? Boolean(you.tolls?.[inspect.index]) : false;
	const shownMonster = reserveHeld ? monsterCard(reserveHeld.id) : void 0;
	const shownSpell = inspect?.pile === "spell" ? spellCard(you.hand[inspect.index] ?? "") : inspect?.pile === "env" ? spellCard(inspect.id) : void 0;
	const otherCount = hand === "reserve" ? you.hand.length : you.reserve.length;
	const graspAsk = (event) => {
		const target = event.target;
		if (target.closest("button, a, input")) return;
		const card = target.closest(".ask-card");
		if (!card || !target.closest(".ask-card p")) return;
		const board = event.currentTarget.getBoundingClientRect();
		const box = card.getBoundingClientRect();
		askDrag.current = {
			pointer: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			left: (box.left - board.left) / board.width * 100,
			top: (box.top - board.top) / board.height * 100
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const dragAsk = (event) => {
		const held = askDrag.current;
		if (!held || held.pointer !== event.pointerId) return;
		const board = event.currentTarget.getBoundingClientRect();
		const x = Math.min(60, Math.max(0, held.left + (event.clientX - held.x) / board.width * 100));
		const y = Math.min(80, Math.max(0, held.top + (event.clientY - held.y) / board.height * 100));
		setAskAt({
			x,
			y
		});
	};
	const dropAsk = (event) => {
		if (askDrag.current?.pointer === event.pointerId) askDrag.current = null;
	};
	function placeFuse(slot) {
		if (!duel || !fuseAsk || fuseAsk.phase !== "preview") return;
		const next = fuse(duel, fuseAsk.reserveIndex, fuseAsk.fieldUid, slot);
		if (next.players[viewer].field[slot]?.cardId !== fuseAsk.resultId) {
			holdNotice(next.live || "Không đặt được vào ô này.");
			return;
		}
		setFuseAsk(null);
		setFuseDrag(null);
		apply(next);
	}
	function dropFuse(x, y) {
		const slotEl = document.elementsFromPoint(x, y).find((item) => item.closest("[data-slot]"))?.closest("[data-slot]");
		const owner = slotEl ? Number(slotEl.dataset.owner) : NaN;
		const index = slotEl ? Number(slotEl.dataset.index) : NaN;
		if (!slotEl || owner !== viewer || index < 0 || index > 2) {
			holdNotice("Kéo lá vào ô của bạn.");
			return;
		}
		placeFuse(index);
	}
	const fuseHands = /* @__PURE__ */ new Set();
	const fuseUids = /* @__PURE__ */ new Set();
	if (fuseOn) {
		const ids = you.field.filter((unit) => Boolean(unit)).map((unit) => unit.cardId);
		you.reserve.forEach((held, index) => {
			you.field.forEach((mon) => {
				if (mon && (findFusion(held.id, mon.cardId) || findKnightFusion(held.id, mon.cardId, ids))) {
					fuseHands.add(index);
					fuseUids.add(mon.uid);
				}
			});
		});
	}
	const fuseResult = fuseAsk ? monsterCard(fuseAsk.resultId) : void 0;
	const fuseHandName = fuseAsk ? fieldName({
		cardId: fuseAsk.handId,
		level: fuseAsk.handLevel
	}) : "";
	const fuseFieldName = fuseAsk ? fieldName({
		cardId: fuseAsk.fieldId,
		level: fuseAsk.fieldLevel
	}) : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "stage",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: `board${shake ? " is-shaking" : ""}${drag?.kind === "spell" && spellDragLive(drag.spellId, duel, viewer, drag.index) ? " is-aiming" : ""}`,
			"aria-label": "Bàn đấu",
			style: {
				"--alert-size": `${loadAlertLook().glow}px`,
				"--alert-border": `${loadAlertLook().border}px`,
				...askAt ? {
					"--ask-x": `${askAt.x}%`,
					"--ask-y": `${askAt.y}%`,
					"--ask-bottom": "auto"
				} : {}
			},
			onPointerDown: graspAsk,
			onPointerMove: dragAsk,
			onPointerUp: dropAsk,
			onPointerCancel: dropAsk,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "diorama",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: "board-art",
						src: "/board.png",
						alt: ""
					}),
					[{
						id: you.env,
						spot: board.env,
						key: "you-env"
					}, {
						id: foe.env,
						spot: board.envFoe,
						key: "foe-env"
					}].map(({ id, spot, key }) => {
						if (!id || spot.hidden) return null;
						const card = spellCard(id);
						if (!card) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "env-card",
							style: {
								left: `${spot.x}%`,
								top: `${spot.y}%`,
								width: `${spot.width}%`,
								height: `${spot.height}%`
							},
							onClick: () => setInspect({
								pile: "env",
								id
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: spellSrc(id),
								alt: "",
								draggable: false
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { fontSize: `${spot.size}cqmin` },
								children: card.name
							})]
						}, key);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "back-link",
						children: "Menu"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "help-btn press",
						onClick: () => setHelp(true),
						children: "Cài đặt"
					}),
					duel.mode === "test" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "test-tools",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `test-btn press${canTestReset(duel) ? "" : " is-dim"}`,
								onPointerDown: armReset,
								onPointerUp: releaseReset,
								onPointerCancel: cancelReset,
								onContextMenu: (event) => event.preventDefault(),
								children: "Reset"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "test-btn press",
								onClick: () => setTestOpen(true),
								children: "Test"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "test-btn press",
								disabled: testPast.length === 0,
								onClick: undoTest,
								children: "Trở về"
							})
						]
					}) : null,
					marksView.map(([key, value]) => {
						const orbKey = key === "youOrb" || key === "foeOrb";
						const flaskKey = key === "youFlask" || key === "foeFlask";
						const starKey = key === "youStars" || key === "foeStars";
						const gemKey = key === "youGems" || key === "foeGems";
						const gemOwner = key.startsWith("you") ? you : foe;
						if (gemKey && gemOwner.stars >= 4) return null;
						const always = orbKey || starKey;
						if (marks[key].hidden || value === 0 && !always) return null;
						const sideOrb = key.startsWith("you") ? you.orb : foe.orb;
						const starLit = starFlash !== null && (starFlash === viewer && key === "youStars" || starFlash !== viewer && key === "foeStars");
						const color = orbKey ? value >= 3 ? "#ff4d4d" : value === 2 ? "#ff8a00" : value === 1 ? "#3ec6ff" : "#fff" : flaskKey && sideOrb >= 3 ? "#ff4d4d" : starLit ? "#ff8a00" : void 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `mark${orbKey ? " is-orb" : ""}${starLit ? " is-star" : ""}`,
							style: {
								left: `${marks[key].x}%`,
								top: `${marks[key].y}%`,
								fontSize: `${marks[key].size}cqmin`,
								color
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: value })
						}, key);
					}),
					board.trail.hidden ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "notice-trail",
						style: {
							left: `${board.trail.x}%`,
							top: `${board.trail.y}%`,
							width: `${board.trail.w}%`,
							height: `${board.trail.h}%`,
							["--dot"]: board.trail.dot / 1.6
						},
						children: Array.from({ length: TRAIL_SLOTS }, (_, slot) => {
							const history = trailDots.slice(-5);
							const dot = history[slot - (TRAIL_SLOTS - history.length)];
							if (!dot) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "trail-slot" }, `empty-${slot}`);
							const prev = history[slot - (TRAIL_SLOTS - history.length) - 1];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "trail-slot",
								children: [prev && prev.clock !== dot.clock ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "trail-gap" }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: `trail-dot${pinnedId === dot.id ? " is-on" : ""}`,
									"aria-label": "Xem lại thông báo",
									style: {
										color: TRAIL_INK[dot.ink],
										boxShadow: `0 0 ${board.trail.glow}px ${board.trail.glow * .2}px ${TRAIL_INK[dot.ink]}`
									},
									onPointerDown: (event) => {
										event.stopPropagation();
										setPinnedId(dot.id);
									}
								})]
							}, dot.id);
						})
					}),
					board.notice.hidden ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "banner",
						ref: noticeRef,
						style: {
							left: `${board.notice.x}%`,
							top: `${board.notice.y}%`,
							width: `${board.notice.w}%`,
							height: `${board.notice.h}%`,
							right: "auto",
							fontSize: `${board.notice.font}cqmin`
						},
						onPointerDown: (event) => {
							const box = event.currentTarget;
							if (box.scrollHeight <= box.clientHeight + 2) return;
							noticePan.current = {
								id: event.pointerId,
								y: event.clientY,
								top: box.scrollTop
							};
							box.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							const pan = noticePan.current;
							if (!pan || pan.id !== event.pointerId) return;
							event.currentTarget.scrollTop = pan.top - (event.clientY - pan.y);
						},
						onPointerUp: () => {
							noticePan.current = null;
						},
						onPointerCancel: () => {
							noticePan.current = null;
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "banner-copy",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "banner-body",
								children: (() => {
									const bannerText = (pinnedId === null ? null : trailDots.find((dot) => dot.id === pinnedId))?.text ?? toast;
									return bannerText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoticeText, { text: veilNotice(spoken(bannerText, viewer), duel, viewer) }) : duel.turn === viewer ? tr("Kéo lá lên ô. Bấm lá để xem kỹ năng.") : tr("Đợi đối thủ.");
								})()
							})
						})
					}),
					(responding || reactMarks.includes("rebound")) && !board.reaction.hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `banner is-react${duel.pending?.kind === "face" ? " is-drop" : ""}`,
						"data-react": duel.pending?.kind === "face" ? "attack" : void 0,
						style: {
							left: `${board.reaction.x}%`,
							top: `${board.reaction.y}%`,
							width: `${board.reaction.w}%`,
							height: `${board.reaction.h}%`,
							right: "auto"
						},
						children: [...reactMarks].reverse().map((kind, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `react-ico is-${kind}`,
							"data-react": kind,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReactGlyph, { kind })
						}, `${kind}-${index}`))
					}) : null,
					askUpkeep && upkeepUnit && !gemHold ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card is-keep",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(answerUpkeep(duel, true)),
								children: angelUpkeep ? "Cầu nguyện" : "Duy trì"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(answerUpkeep(duel, false)),
								children: "Rời sân"
							})]
						})
					}) : null,
					vowAsk && mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card is-keep",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									tr("Hãy chọn các quái thú mà bạn muốn hiến tế để triệu hồi. Tối đa là"),
									" ",
									vowCap(you.reserve[vowAsk.index]?.id ?? "", you.reserve[vowAsk.index]?.saved?.level ?? 1)
								] }),
								you.field.map((mon) => {
									if (!mon || mon.hp <= 0) return null;
									const on = vowAsk.picks.includes(mon.uid);
									const cap = vowCap(you.reserve[vowAsk.index]?.id ?? "", you.reserve[vowAsk.index]?.saved?.level ?? 1);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: on ? "on" : "",
										onClick: () => setVowAsk((current) => {
											if (!current) return current;
											const picks = current.picks.includes(mon.uid) ? current.picks.filter((uid) => uid !== mon.uid) : current.picks.length >= cap ? current.picks : [...current.picks, mon.uid];
											return {
												...current,
												picks
											};
										}),
										children: tr(fieldName(mon))
									}, mon.uid);
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										apply(summonVow(duel, vowAsk.index, vowAsk.slot, vowAsk.picks));
										setVowAsk(null);
										setRiteHand(null);
									},
									children: tr("OK")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setVowAsk(null);
										setRiteHand(null);
									},
									children: tr("Không")
								})
							]
						})
					}) : null,
					mine && duel.gemCap === viewer && duel.turn === viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card is-mana",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Bạn đã đạt đến mức gem giới hạn, có đồng ý giải phóng cầu ma lực 3 mana đổi lấy 2 mana triệu hồi hay không?") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => apply(answerGemCap(duel, true)),
									children: tr("OK")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => apply(answerGemCap(duel, false)),
									children: tr("Không")
								})
							]
						})
					}) : null,
					mine && duel.gemWarn === viewer && duel.turn === viewer && duel.gemCap !== viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card is-mana",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Bạn chỉ được dùng \"Giải phóng ma lực\" 1 lần trong mỗi trận đấu. Hãy cẩn thận với lượng ma lực đang quá tải của mình.") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(answerGemWarn(duel)),
								children: tr("OK")
							})]
						})
					}) : null,
					duel.reel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotMachine, {
						faces: duel.reel.faces,
						phase: duel.reel.phase,
						kind: duel.reel.kind ?? "prize",
						order: duel.reel.order ?? null,
						canPull: Boolean(canPlay && duel.players[duel.turn].field.some((unit) => unit?.uid === duel.reel?.uid)),
						onPull: () => apply(pullReel(duel)),
						onDone: () => {
							if (duel.mode === "net" && !canPlay) return;
							apply(settleReel(duel));
						}
					}) : null,
					mine && aim?.kind === "tide" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: askLabel("trai-tim-hai-long", "tide") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: you.orb < tideCost(0),
									onClick: () => setAim({
										kind: "skill",
										uid: aim.uid,
										index: 1
									}),
									children: askLabel("trai-tim-hai-long", "surge")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: you.orb < tideCost(1),
									onClick: () => {
										setAim({
											kind: "skill",
											uid: aim.uid,
											index: 2
										});
									},
									children: askLabel("trai-tim-hai-long", "doom")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setAim({
											kind: "skill",
											uid: aim.uid,
											index: 0
										});
										holdNotice("Chọn một kẻ địch.");
									},
									children: "Không"
								})
							]
						})
					}) : null,
					duel.recall && duel.recall.side === viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									tr("Chọn quái ra sân. Không vượt sao đã thu:"),
									" ",
									recallLeft(duel.recall.caps, recallPick.map((index) => recallStars(you.reserve[index]))).join(", ")
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Quái 4 sao tốn thêm 1 mana.") }),
								you.reserve.map((held, index) => {
									const card = monsterCard(held.id);
									if (!card) return null;
									const on = recallPick.includes(index);
									const stars = recallStars(held);
									const trial = on ? recallPick : [...recallPick, index];
									const canAdd = on || recallPick.length < duel.recall.caps.length && recallFits(duel.recall.caps, trial.map((at) => recallStars(you.reserve[at])));
									const name = held.saved ? fieldName({
										cardId: held.id,
										level: held.saved.level
									}) : card.name;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: on ? "on" : "",
										disabled: !canAdd,
										onClick: () => setRecallPick((list) => list.includes(index) ? list.filter((item) => item !== index) : [...list, index]),
										children: [
											tr(name),
											" · ",
											stars,
											" ",
											tr("sao"),
											stars === 4 ? ` · ${tr("1 mana")}` : ""
										]
									}, `${held.id}-${index}`);
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: (() => {
										return !recallReady(duel.recall?.caps ?? [], you.reserve, recallPick, you.orb);
									})(),
									onClick: () => {
										apply(confirmRecall(duel, recallPick));
										setRecallPick([]);
									},
									children: "OK"
								})
							]
						})
					}) : null,
					duel.swap && duel.swap.side === viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: duel.swap.locked ? "Quái bị nhắm đã khoá. Chọn 1 quái để đổi, rồi bấm OK." : "Chọn 2 quái để đổi, rồi bấm OK." }),
								duel.swap.locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [fieldName(you.field.find((unit) => unit && `f:${unit.uid}` === duel.swap?.locked) ?? { cardId: "" }), " đang bị nhắm."] }) : null,
								you.field.map((unit) => unit && !unit.copy && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai" && `f:${unit.uid}` !== duel.swap?.locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: swapPick.includes(`f:${unit.uid}`) ? "on" : "",
									onClick: () => setSwapPick((list) => {
										const token = `f:${unit.uid}`;
										const cap = duel.swap?.locked ? 1 : 2;
										return list.includes(token) ? list.filter((item) => item !== token) : list.length >= cap ? [token] : [...list, token];
									}),
									children: tr(fieldName(unit))
								}, unit.uid) : null),
								you.reserve.map((held, index) => {
									const card = monsterCard(held.id);
									if (!card || (held.id === "trieu-hoi-ac-ma" ? you.stars < 3 : you.stars < card.stars) || card.stars === 0) return null;
									const token = `r:${index}`;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: swapPick.includes(token) ? "on" : "",
										onClick: () => setSwapPick((list) => {
											const cap = duel.swap?.locked ? 1 : 2;
											return list.includes(token) ? list.filter((item) => item !== token) : list.length >= cap ? [token] : [...list, token];
										}),
										children: held.saved ? fieldName({
											cardId: held.id,
											level: held.saved.level
										}) : card.name
									}, token);
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: swapPick.length !== (duel.swap.locked ? 1 : 2),
									onClick: () => {
										const locked = duel.swap?.locked;
										const next = locked ? confirmSwap(duel, locked, swapPick[0]) : confirmSwap(duel, swapPick[0], swapPick[1]);
										if (!next.swap) setSwapPick([]);
										apply(next);
									},
									children: "OK"
								})
							]
						})
					}) : null,
					reflectPick ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Chọn kẻ địch để phản đòn, rồi bấm OK.") }),
								(duel.hold ? duel.players[1 - duel.hold.priority] : duel.players[duel.turn]).field.map((unit) => unit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: reflectPick.uid === unit.uid ? "on" : "",
									onClick: () => setReflectPick({
										index: reflectPick.index,
										uid: unit.uid
									}),
									children: tr(fieldName(unit))
								}, unit.uid) : null),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: !reflectPick.uid,
									onClick: () => {
										const next = castSpell(duel, reflectPick.index, reflectPick.uid);
										setReflectPick(null);
										apply(next);
									},
									children: "OK"
								})
							]
						})
					}) : null,
					digPick && you.hand[digPick.index] === "ke-dao-mo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Chọn quái hoặc phép đã rời sân, rồi bấm OK.") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Quái") }),
								digChoices(duel, viewer).filter((row) => row.kind === "monster").map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: digPick.id === row.id ? "on" : "",
									onClick: () => setDigPick({
										index: digPick.index,
										id: row.id
									}),
									children: tr(monsterCard(row.id)?.name ?? row.id)
								}, row.id)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Phép") }),
								digChoices(duel, viewer).filter((row) => row.kind === "spell").map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: digPick.id === row.id ? "on" : "",
									onClick: () => setDigPick({
										index: digPick.index,
										id: row.id
									}),
									children: tr(spellCard(row.id)?.name ?? row.id)
								}, row.id)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: !digPick.id,
									onClick: () => {
										const picked = digPick.id;
										if (!picked) return;
										const next = digGrave(duel, digPick.index, picked);
										setDigPick(null);
										apply(next);
									},
									children: "OK"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setDigPick(null),
									children: tr("Đóng")
								})
							]
						})
					}) : null,
					ambushPick ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Đòn đã bị chặn. Chọn quái đánh lại, rồi bấm OK.") }),
								you.field.map((unit) => unit && unit.stun === 0 && (unit.chain ?? 0) === 0 && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: ambushPick.uid === unit.uid ? "on" : "",
									onClick: () => setAmbushPick({
										index: ambushPick.index,
										uid: unit.uid
									}),
									children: tr(fieldName(unit))
								}, unit.uid) : null),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: !ambushPick.uid,
									onClick: () => {
										const next = castSpell(duel, ambushPick.index, ambushPick.uid);
										setAmbushPick(null);
										apply(next);
									},
									children: "OK"
								})
							]
						})
					}) : null,
					duel.soulAsk && duel.turn === viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr(soulAskLine(you.field.find((unit) => unit?.uid === duel.soulAsk?.uid) ?? { vows: 0 })) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => apply(answerSoul(duel, true)),
									children: tr("Hiến tế")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => apply(answerSoul(duel, false)),
									children: tr("Không")
								})
							]
						})
					}) : null,
					mine && duel.legs && duel.step === "main" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay is-ask",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ask-card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: askLabel("ken-ngai", "legs") }),
								[1].filter((count) => you.orb >= 1 && you.field.filter((unit, index) => !unit && (you.locked?.[index] ?? 0) === 0).length >= count).map((count) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => apply(answerLegs(duel, count)),
									children: [count, " chân"]
								}, count)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => apply(answerLegs(duel, 0)),
									children: "Không"
								})
							]
						})
					}) : null,
					mine && duel.parley && duel.step === "main" && parleyPicker(duel) === viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: duel.parley.step === "pick-lunger" || duel.parley.step === "pick-lunger2" ? tr("Chọn quái của bạn để lao vào.") : tr("Chọn quái của bạn để chịu đòn.") }),
							duel.parley.kind === "mystic" && duel.parley.step === "pick-victim" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(pickParley(duel, "face")),
								children: tr("Người chơi")
							}) : null,
							you.field.map((unit) => unit && unit.hp > 0 && unit.cardId !== "mu" && !(duel.parley?.kind === "mystic" && duel.parley.step === "pick-victim" && unit.uid === duel.parley.queen) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(pickParley(duel, unit.uid)),
								children: tr(fieldName(unit))
							}, unit.uid) : null)
						]
					}) : null,
					mine && duel.echo && duel.step === "main" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: askLabel("kiem-si-lua-thieng", "echo") }),
							foe.field.map((unit) => unit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(swordFollow(duel, unit.uid)),
								children: tr(fieldName(unit))
							}, unit.uid) : null),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(swordFollow(duel, null)),
								children: "Không"
							})
						]
					}) : null,
					mine && duel.last && !duel.echo && duel.step === "main" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: askLabel("kiem-si-lua-thieng", "last") }),
							foe.field.map((unit) => unit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(swordLast(duel, unit.uid)),
								children: tr(fieldName(unit))
							}, unit.uid) : null),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(swordLast(duel, null)),
								children: "Không"
							})
						]
					}) : null,
					hornAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Sấm lôi phá" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: hornAsk.mode === "splash" ? "on" : "",
								onClick: () => setHornAsk({
									...hornAsk,
									mode: "splash"
								}),
								children: "Lan"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: hornAsk.mode === "plus" ? "on" : "",
								onClick: () => setHornAsk({
									...hornAsk,
									mode: "plus"
								}),
								children: "+3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: !hornAsk.mode,
								onClick: () => {
									const ask = hornAsk;
									if (!ask.mode || !duel) return;
									if (you.orb < 1) {
										holdNotice("Cần 1 mana.");
										return;
									}
									setHornAsk(null);
									apply(attackMonster(armHorn(duel, ask.uid, ask.mode), ask.uid, ask.foeUid));
								},
								children: "OK"
							})
						]
					}) : null,
					knightAsk || dueKnight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KnightPick, {
						room: (knightAsk ?? dueKnight).room,
						onSkip: () => {
							if (knightAsk?.block) apply(assignBlock(primeKnight(duel, knightAsk.uid, []), knightAsk.uid, false));
							else if (dueKnight) apply(primeKnight(duel, dueKnight.uid, []));
							setKnightAsk(null);
						},
						onPick: (picks) => {
							const ask = knightAsk;
							const uid = (ask ?? dueKnight).uid;
							let next = primeKnight(duel, uid, picks);
							if (ask?.block) next = assignBlock(next, uid, false);
							else if (ask?.foeUid) next = attackMonster(next, uid, ask.foeUid);
							apply(next);
							setKnightAsk(null);
						}
					}) : null,
					lureAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Tiến hoá Mê hoặc thành Dụ dỗ? Tốn 2 mana, rồi chọn quái địch và quái của ta." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									if (you.orb < 2) {
										holdNotice("Cần 2 mana.");
										return;
									}
									const uid = lureAsk;
									setLureAsk(null);
									setAim({
										kind: "skill",
										uid,
										index: 3
									});
									holdNotice("Chọn một quái đối thủ.");
								},
								children: "Tiến hoá"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const uid = lureAsk;
									setLureAsk(null);
									setAim({
										kind: "skill",
										uid,
										index: 1
									});
								},
								children: tr("Không")
							})
						]
					}) : null,
					duel.birdAsk && duel.players[viewer].field.some((mon) => mon?.uid === duel.birdAsk?.uid) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Tiến hoá Mỹ điểu nhân thành?" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(evolveBird(duel, "cong-chua-dieu-nhan")),
								children: "Công chúa điểu nhân"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(evolveBird(duel, "nu-chua-dieu-nhan")),
								children: "Nữ chúa điểu nhân"
							})
						]
					}) : null,
					duel.plumeAsk && duel.turn === viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Roi điện? Né đòn và trả 5 sát thương phép." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(answerPlume(duel, true)),
								children: "Ok"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(answerPlume(duel, false)),
								children: tr("Không")
							})
						]
					}) : null,
					duel.preyAsk && duel.turn === viewer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Ta là Kẻ săn mồi tử thần, tiêu hao 1 mana, cùng ta tiêu diệt hắn?" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(answerPrey(duel, true)),
								children: "Ok"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => apply(answerPrey(duel, false)),
								children: tr("Không")
							})
						]
					}) : null,
					cottonAsk === "field" && (cotton.self || cotton.copy) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: monsterCard("cuc-bong-ma-quai")?.name }),
							cotton.self ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setCottonAsk(null);
									apply(cottonCover(duel, "self"));
								},
								children: askLabel("cuc-bong-ma-quai", "self")
							}) : null,
							cotton.copy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setCottonAsk(null);
									apply(cottonCover(duel, "copy"));
								},
								children: askLabel("cuc-bong-ma-quai", "copy")
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setCottonAsk(null),
								children: tr("Không")
							})
						]
					}) : null,
					cottonAsk === "hand" && (cotton.hand || cotton.handCopy) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: monsterCard("cuc-bong-ma-quai")?.name }),
							cotton.hand ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setCottonAsk(null);
									apply(cottonCover(duel, "hand"));
								},
								children: askLabel("cuc-bong-ma-quai", "hand")
							}) : null,
							cotton.handCopy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setCottonAsk(null);
									apply(cottonCover(duel, "hand-copy"));
								},
								children: askLabel("cuc-bong-ma-quai", "handCopy")
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setCottonAsk(null),
								children: tr("Không")
							})
						]
					}) : null,
					blockChoice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [blockChoice.skill === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: askLabel("chien-si-gam-nham", "block") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => pickBlock({ skill: false }),
								children: tr("Chặn thường")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => pickBlock({ skill: true }),
								children: tr("Chặn skill")
							})
						] }) : null, blockChoice.buff === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: askLabel("yeu-tinh-chuc-phuc", "buff") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => pickBlock({ buff: true }),
								children: "Buff"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => pickBlock({ buff: false }),
								children: tr("Không")
							})
						] }) : null]
					}) : null,
					fuseAsk?.phase === "ask" && fuseResult ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: `Hợp nhất ${fuseHandName} và ${fuseFieldName} trở thành ${fuseResult.name}.` }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setFuseAsk((current) => current ? {
									...current,
									phase: "fly"
								} : current),
								children: "Ok"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setFuseAsk(null),
								children: tr("Không")
							})
						]
					}) : null,
					fuseAsk && fuseAsk.phase !== "ask" && fuseResult ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `fuse-stage is-${fuseAsk.phase}`,
						children: fuseAsk.phase !== "preview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "fuse-card is-a",
								style: {
									"--x": `${fuseAsk.fromHand.x}%`,
									"--y": `${fuseAsk.fromHand.y}%`
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									monster: monsterCard(fuseAsk.handId),
									level: fuseAsk.handLevel
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "fuse-card is-b",
								style: {
									"--x": `${fuseAsk.fromField.x}%`,
									"--y": `${fuseAsk.fromField.y}%`
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									monster: monsterCard(fuseAsk.fieldId),
									level: fuseAsk.fieldLevel
								})
							}),
							fuseAsk.phase === "flash" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "fuse-flash" }) : null
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "fuse-preview",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `fuse-result${fuseDrag?.moved ? " is-holding" : ""}`,
									onPointerDown: (event) => {
										event.currentTarget.setPointerCapture(event.pointerId);
										fuseHold.current = {
											x: event.clientX,
											y: event.clientY,
											moved: false
										};
										setFuseDrag({
											x: event.clientX,
											y: event.clientY,
											moved: false
										});
									},
									onPointerMove: (event) => {
										const start = fuseHold.current;
										if (!start) return;
										const moved = start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8;
										fuseHold.current = {
											x: start.x,
											y: start.y,
											moved
										};
										setFuseDrag({
											x: event.clientX,
											y: event.clientY,
											moved
										});
									},
									onPointerUp: (event) => {
										const moved = fuseHold.current?.moved;
										fuseHold.current = null;
										setFuseDrag(null);
										if (moved) dropFuse(event.clientX, event.clientY);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { monster: fuseResult })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "fuse-copy",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: fuseResult.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyText, { text: fuseResult.skill }) })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press",
									onClick: () => placeFuse(fuseAsk.slot),
									children: "Ok"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "fuse-hint",
									children: "Giữ kéo lá vào ô muốn đặt."
								})
							]
						})
					}) : null,
					fuseDrag?.moved && fuseResult ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ghost",
						style: {
							left: fuseDrag.x,
							top: fuseDrag.y
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { monster: fuseResult })
					}) : null,
					chronoAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: askLabel("phu-thuy-thoi-gian", "boost") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const ask = chronoAsk;
									setChronoAsk(null);
									if (duel && chronoHighAlly(duel, ask.caster, ask.target)) {
										setChronoWarn(ask);
										return;
									}
									setChronoSpin({
										caster: ask.caster,
										target: ask.target,
										index: 1,
										sector: null
									});
								},
								children: tr("Cường hoá")
							}),
							chronoAsk.age ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const ask = chronoAsk;
									setChronoAsk(null);
									apply(useSkill(duel, ask.caster, ask.target, 0, true));
								},
								children: tr("Lão hoá")
							}) : null,
							chronoAsk.pass ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setChronoAsk(null),
								children: tr("Không")
							}) : null
						]
					}) : null,
					chronoWarn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ask-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Hiệu ứng cường hoá không có tác dụng lên đồng minh thông thường cấp cao, bạn vẫn thi triển chứ.") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const ask = chronoWarn;
									setChronoWarn(null);
									setChronoSpin({
										caster: ask.caster,
										target: ask.target,
										index: 1,
										sector: null
									});
								},
								children: "Ok"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setChronoWarn(null),
								children: tr("Không")
							})
						]
					}) : null,
					chronoSpin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeWheel, {
						sector: chronoSpin.sector,
						title: chronoSpin.index === 2 ? tr("Dòng chảy thời gian") : tr("Cường hoá"),
						onPull: () => setChronoSpin((spin) => spin && spin.sector === null ? {
							...spin,
							sector: rollTimeSector()
						} : spin),
						onDone: () => {
							const spin = chronoSpin;
							if (!spin || spin.sector === null || !duel) {
								setChronoSpin(null);
								return;
							}
							const extra = TIME_HITS[spin.sector] ? "hit" : "miss";
							setChronoSpin(null);
							apply(useSkill(duel, spin.caster, spin.target, spin.index, true, extra));
						}
					}) : null,
					[
						0,
						1,
						2
					].map((index) => {
						const side = viewer === 0 ? 1 : 0;
						const mon = foe.field[index] ?? null;
						const held = linger.find((item) => item.side === side && item.index === index);
						const shown = mon ?? held?.mon ?? fallenMon(prevDuel.current, duel, side, index);
						const frozen = !mon && Boolean(shown);
						const allyAim = aim?.kind === "skill" && !!selectedCard && allySkill(selectedCard.id);
						const curseStep = aim?.kind === "spell" && aim.spellId === "phan-nguyen" ? aim.from ? "foe" : "ally" : drag?.kind === "spell" && drag.spellId === "phan-nguyen" ? "ally" : null;
						const witchFoe = aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian";
						const attacking = !!mon && curseStep !== "ally" && (curseStep === "foe" || drag?.kind === "unit" || drag?.kind === "spell" && drag.spellId !== "sung-loi-pha" && drag.spellId !== "phan-nguyen" && drag.spellId !== "hoan-doi" && drag.spellId !== "ke-dao-mo" && spellDragLive(drag.spellId, duel, viewer, drag.index) || aim?.kind === "attack" || aim?.kind === "spell" && aim.spellId !== "phan-nguyen" && aim.spellId !== "sung-loi-pha" && aim.spellId !== "hoan-doi" && aim.spellId !== "ke-dao-mo" && spellDragLive(aim.spellId, duel, viewer, aim.index) || aim?.kind === "skill" && !allyAim && !(witchFoe && chronoImmortal(mon)));
						const covered = !!mon && mon.cardId === "kazura" && foe.field.some((unit) => unit && unit.cardId === "kizuran" && unit.cover && unit.hp > 0 && unit.stun === 0 && (unit.chain ?? 0) === 0);
						const untouchable = !!mon && mon.cardId === "kazura" && (mon.safe ?? 0) > 0 && !covered && drag?.kind !== "spell" && aim?.kind !== "skill";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardSlot, {
							mon: shown,
							frozen,
							fading: Boolean(held?.fading),
							hpOverride: shown ? laserHp[`mon:${shown.uid}`] : void 0,
							side,
							near: false,
							index,
							layout: fieldLayout,
							hot: attacking && !untouchable,
							tone: drag?.kind === "spell" || aim?.kind === "spell" || aim?.kind === "skill" ? "skill" : "monster",
							attack: attacking && !untouchable && drag?.kind !== "spell" && !(aim?.kind === "spell" && aim.spellId === "soi-xich-dia-nguc"),
							picked: aim?.kind === "skill" && aim.also === mon?.uid,
							shift: mon ? attackShift(duel, mon.uid, viewer) : null,
							motion,
							veil: Boolean(duel.players[side].sea && mon && !mon.cage && !mon.shown && (mon.cardId === "trai-tim-hai-long" || mon.cardId === "sua-hut-ma-phap" || mon.cardId === "kraken")),
							mask: Boolean(duel.players[side].hats && mon && mon.cardId !== "mu"),
							decoy: Boolean(mon && !mon.cage && mon.cardId === "chien-binh-lan-khuat" && (mon.shown ?? 0) > 0),
							allies: duel.players[side].field,
							prime: !!mon && isPrime(duel, mon, side),
							lockFlash: !!mon && lockFlash === mon.uid,
							onSlot,
							onUnit
						}, `f${index}`);
					}),
					[
						0,
						1,
						2
					].map((index) => {
						const mon = you.field[index] ?? null;
						const held = linger.find((item) => item.side === viewer && item.index === index);
						const shown = mon ?? held?.mon ?? fallenMon(prevDuel.current, duel, viewer, index);
						const frozen = !mon && Boolean(shown);
						const card = mon ? monsterCard(mon.cardId) : void 0;
						const coverDrag = !!mon && responding && duel.hold?.priority === viewer && mon.cardId === "kizuran" && mon.stun <= 0 && (mon.chain ?? 0) === 0 && you.field.some((unit) => {
							if (!unit || unit.cardId !== "kazura") return false;
							const pending = duel.pending;
							const aimed = pending?.kind === "melee" || pending?.kind === "gnaw" ? pending.defender : pending?.kind === "beam" || pending?.kind === "gnaw-skill" || pending?.kind === "spell" ? pending.target : null;
							return unit.uid === aimed;
						});
						const grabbable = !!mon && !!card && mon.cardId !== "chan-ken" && mon.stun <= 0 && !(mon.path ?? 0) && (coverDrag || !mon.dim && (canPlay || canIntercept));
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardSlot, {
							mon: shown,
							frozen,
							fading: Boolean(held?.fading),
							hpOverride: shown ? laserHp[`mon:${shown.uid}`] : void 0,
							side: viewer,
							near: true,
							index,
							layout: fieldLayout,
							hot: (drag?.kind === "summon" || aim?.kind === "summon") && !mon || drag?.kind === "spell" && drag.spellId !== "hoan-doi" && drag.spellId !== "phan-nguyen" && drag.spellId !== "soi-xich-dia-nguc" && drag.spellId !== "ke-dao-mo" && spellDragLive(drag.spellId, duel, viewer, drag.index) && !!mon && (drag.spellId !== "sung-loi-pha" || hornFit(mon.cardId)) || aim?.kind === "spell" && aim.spellId === "sung-loi-pha" && !!mon && hornFit(mon.cardId) || aim?.kind === "spell" && aim.spellId === "phan-nguyen" && !aim.from && !!mon && harmShift(mon) || !!mon && aim?.kind === "skill" && !!selectedCard && allySkill(selectedCard.id) && (mon.uid !== aim.uid || selectedCard.id === "thien-than-be-nho") || !!mon && aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian" && witchAllyMark(duel, aim.uid, mon),
							fuse: Boolean(mon && (fuseOn && fuseUids.has(mon.uid) || drag?.kind === "summon" && (findFusion(drag.card.id, mon.cardId) || findKnightFusion(drag.card.id, mon.cardId, you.field.filter((unit) => Boolean(unit)).map((unit) => unit.cardId))))),
							fuseHide: Boolean(mon && fuseAsk && fuseAsk.phase !== "ask" && fuseAsk.fieldUid === mon.uid),
							tone: drag?.kind === "spell" || aim?.kind === "spell" || aim?.kind === "skill" ? "skill" : "monster",
							picked: !!mon && (!!aim && "uid" in aim && aim.uid === mon.uid || duel.hold?.armed === mon.uid || blessArm && mon.cardId === "yeu-tinh-chuc-phuc"),
							attack: false,
							shift: mon ? attackShift(duel, mon.uid, viewer) : null,
							motion,
							veil: false,
							allies: you.field,
							prime: !!mon && isPrime(duel, mon, viewer),
							lockFlash: !!mon && lockFlash === mon.uid,
							alert: !!mon && (monsterAlert(duel, mon, viewer) || mysticAlert(duel, mon, viewer)),
							onSlot,
							onUnit,
							onPointerDown: grabbable ? (event) => begin(event, {
								kind: "unit",
								uid: mon.uid,
								card,
								live: {
									name: fieldName(mon),
									atk: mon.atk,
									def: mon.def,
									mdef: mon.mdef,
									hp: mon.hp,
									level: mon.level ?? 1
								}
							}) : void 0,
							onPointerMove: grabbable ? move : void 0,
							onPointerUp: grabbable ? end : void 0,
							ghosting: drag?.kind === "unit" && drag.uid === mon?.uid
						}, `y${index}`);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `lane${drag?.kind === "unit" || aim?.kind === "attack" ? " is-hot" : ""}` }),
					beam && !groupedShot && !seaVeiled(duel, viewer, beam.caster) || horning && !groupedShot && !gazePending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `attack-beam${beamFromBottom ? " from-bottom" : " from-top"}`,
						"data-beam": "1"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "floaters",
						children: [floaters.filter((item) => !item.heal).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "floater",
							style: floaterStyle(item),
							children: item.text
						}, item.id)), floaters.filter((item) => item.heal).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "floater heal",
							style: floaterStyle(item),
							children: item.text
						}, item.id))]
					}),
					drag?.kind === "unit" || aim?.kind === "attack" || aim?.kind === "skill" && selectedCard && faceSkill(selectedCard.id, aim.index) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "face-drop",
						"data-face": "1",
						onClick: () => {
							if (aim?.kind === "attack") apply(attackFace(duel, aim.uid));
							if (aim?.kind === "skill") apply(declareSkill(duel, aim.uid, null, aim.index));
						},
						children: aim?.kind === "skill" ? "Người chơi" : "Đánh người"
					}) : null,
					board.stack.hidden ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `face-pile press${you.hand.some((id) => spellCanAnswer(id, duel)) && (drag?.kind === "unit" || drag?.kind === "summon") || (cotton.hand || cotton.handCopy || standHand) && hand === "spell" ? " is-alert" : ""}`,
						style: {
							left: `${board.stack.x}%`,
							top: `${board.stack.y}%`,
							width: `${board.stack.width}%`,
							height: `${board.stack.height}%`,
							fontSize: `${board.stack.size}cqmin`
						},
						"aria-label": hand === "reserve" ? "Đổi sang bài phép" : "Đổi sang quái thú",
						onClick: () => {
							setHand((current) => current === "reserve" ? "spell" : "reserve");
							setInspect(null);
							setAim((current) => current?.kind === "summon" ? null : current);
						},
						children: [otherCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: otherCount }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: hand === "reserve" ? tr("Phép") : tr("Quái") })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `hand is-strip${(hand === "reserve" ? you.reserve.length : you.hand.length) > 3 ? " is-paged" : ""}`,
						ref: handStrip,
						onPointerDown: (event) => {
							if (event.target.closest("button")) return;
							origin.current = {
								x: event.clientX,
								y: event.clientY,
								moved: false,
								t: Date.now(),
								pan: true,
								lastX: event.clientX
							};
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (!origin.current.pan || grab.current) return;
							const strip = handStrip.current;
							if (!strip) return;
							strip.scrollLeft -= event.clientX - origin.current.lastX;
							origin.current.lastX = event.clientX;
							origin.current.moved = true;
						},
						onPointerUp: () => {
							if (grab.current) return;
							origin.current.pan = false;
						},
						onClick: (event) => {
							if (event.target === event.currentTarget) setInspect(null);
						},
						children: [hand === "reserve" ? you.reserve.map((held, index) => {
							const id = held.id;
							const card = monsterCard(id);
							if (!card) return null;
							const live = reserveLive(held, card);
							const open = inspect?.pile === "reserve" && inspect.index === index;
							const cottonCard = id === "cuc-bong-ma-quai" && (cotton.hand || cotton.handCopy);
							const standCard = id === "the-than-cua-shien" && standHand;
							const face = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `hand-card press is-monster${open || aim?.kind === "summon" && aim.index === index ? " is-open" : ""}${cottonCard || standCard ? " is-alert" : ""}${fuseHands.has(index) ? " is-fuse" : ""}${drag?.kind === "summon" && drag.index === index ? " is-ghosting" : ""}${fuseAsk && fuseAsk.phase !== "ask" && fuseAsk.reserveIndex === index ? " is-fuse-hide" : ""}`,
								"data-reserve": index,
								onClick: () => openHand("reserve", index),
								onPointerDown: (event) => begin(event, {
									kind: "summon",
									index,
									card
								}),
								onPointerMove: move,
								onPointerUp: end,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									monster: card,
									level: held.saved?.level ?? 1,
									live,
									gems: held.toll ? `${card.gems}+1` : void 0,
									selected: open || aim?.kind === "summon" && aim.index === index
								}), riteHand === index && !(drag?.kind === "summon" && drag.index === index) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									className: "rite-ring",
									src: "/fx/hien-te-vong.mp4",
									autoPlay: true,
									loop: true,
									playsInline: true,
									ref: (node) => {
										if (node) node.play();
									}
								}) : null]
							}, `${id}-${index}`);
							if (standCard) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hand-spell is-use",
								children: [face, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "spell-use",
									onClick: () => apply(standIn(duel, index)),
									children: "Use"
								})]
							}, `${id}-${index}`);
							if (!cottonCard) return face;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hand-spell is-use",
								children: [face, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "spell-use",
									onClick: () => setCottonAsk("hand"),
									children: "Use"
								})]
							}, `${id}-${index}`);
						}) : you.hand.map((id, index) => {
							const open = inspect?.pile === "spell" && inspect.index === index;
							const yours = mine && duel.hold?.priority === viewer;
							const ready = spellCanAnswer(id, duel) && (id !== "hoan-doi" || yours);
							const tolled = Boolean(you.tolls?.[index]);
							const payable = tollOk(spellCard(id)?.gems ?? 0, tolled, you.orb, you.flask);
							const usable = ready && yours && payable && answerPayoff(id, duel, viewer) && (id !== "hoan-doi" || canCastSwap(duel, viewer));
							const slowUse = canPlay && slowUsable(id, duel, viewer) && payable;
							const using = aim?.kind === "spell" && aim.spellId === id && aim.index === index || reflectPick?.index === index && id === "la-chan-phan-don" || ambushPick?.index === index && id === "phuc-kich";
							const card = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `hand-card press is-spell${open ? " is-open" : ""}${ready ? " is-alert" : ""}${drag?.kind === "spell" && drag.index === index ? " is-ghosting" : ""}`,
								onClick: () => openHand("spell", index),
								onPointerDown: (event) => begin(event, {
									kind: "spell",
									index,
									spellId: id
								}),
								onPointerMove: move,
								onPointerUp: end,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									spellId: id,
									gems: tolled ? `${spellCard(id)?.gems ?? 0}+1` : void 0,
									selected: open
								})
							}, `${id}-${index}`);
							if (!usable && !slowUse || using) return card;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hand-spell is-use",
								children: [card, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "spell-use",
									onPointerDown: (event) => {
										event.stopPropagation();
										event.preventDefault();
									},
									onPointerUp: (event) => {
										event.stopPropagation();
										event.preventDefault();
										swallowNextClick();
										if (id === "ke-dao-mo") {
											openDig(index);
											return;
										}
										if (id === "hoan-doi") {
											setSwapPick([]);
											apply(castSpell(duel, index, aimedUid(duel)));
											return;
										}
										if (slowUse && id === "sung-loi-pha") {
											setAim({
												kind: "spell",
												index,
												spellId: id
											});
											holdNotice("Chọn quái để gắn sừng.");
											return;
										}
										if (slowUse && id === "phan-nguyen") {
											if (!you.field.some((mon) => mon && harmShift(mon))) {
												holdNotice("Không có đồng minh đang mang trạng thái xấu.");
												return;
											}
											setAim({
												kind: "spell",
												index,
												spellId: id
											});
											holdNotice("Chọn đồng minh đang mang trạng thái xấu.");
											return;
										}
										if (slowUse && SLOW_AIM.has(id)) {
											setAim({
												kind: "spell",
												index,
												spellId: id
											});
											holdNotice("Chọn một quái đối thủ.");
											return;
										}
										if (slowUse) {
											apply(castSpell(duel, index, null));
											return;
										}
										if (id === "la-chan-phan-don") {
											setReflectPick({
												index,
												uid: null
											});
											return;
										}
										if (id === "phuc-kich") {
											const pending = duel.pending;
											const attacker = pending && "attacker" in pending ? pending.attacker : "";
											const ready = you.field.some((unit) => unit && unit.stun === 0 && (unit.chain ?? 0) === 0 && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai");
											if (!attacker || !ready) {
												apply(castSpell(duel, index, null));
												return;
											}
											setReactMarks((list) => list.includes("chain") ? list : ["chain", ...list]);
											playCue("chain");
											setLockFlash(attacker);
											window.setTimeout(() => setLockFlash((now) => now === attacker ? null : now), 800);
											setAmbushPick({
												index,
												uid: null
											});
											return;
										}
										const pending = duel.pending;
										const caster = pending && ("caster" in pending ? pending.caster : "attacker" in pending ? pending.attacker : null);
										const foeMon = foe.field.find((mon) => mon && mon.uid !== caster) ?? foe.field.find((mon) => mon) ?? null;
										const aimed = aimedUid(duel);
										const aimedFoe = aimed && foe.field.some((mon) => mon?.uid === aimed) ? aimed : null;
										const aimedAlly = aimed && you.field.some((mon) => mon?.uid === aimed) ? aimed : null;
										const target = id === "ngan-chan-phong-ngu" ? aimedFoe ?? foeMon?.uid ?? null : id === "co-may-thoi-gian" || id === "giap-co-khi" ? aimedAlly : null;
										apply(castSpell(duel, index, target));
									},
									children: "Use"
								})]
							}, `${id}-${index}`);
						}), (hand === "reserve" ? you.reserve.length : you.hand.length) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hand-empty",
							children: hand === "reserve" ? tr("Hết quái dự bị") : tr("Hết phép")
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "actions",
						children: [
							mine && duel.step === "main" && duel.turn === viewer && !gemHold && !you.drawLock && you.draws < 1 && you.monsterDeck.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "act is-draw-mon press",
								onClick: () => apply(draw(duel, "monster")),
								children: "Rút quái"
							}) : null,
							mine && duel.step === "main" && duel.turn === viewer && !gemHold && !you.drawLock && you.draws < 1 && you.spellDeck.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "act is-draw-spell press",
								onClick: () => apply(draw(duel, "spell")),
								children: "Rút phép"
							}) : null,
							responding && duel.hold?.priority === viewer && harpyOffer(duel, viewer) === "armor" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "act press is-skillbox",
								onClick: () => apply(harpyWard(duel)),
								children: "Giáp và Vuốt"
							}) : null,
							responding && duel.hold?.priority === viewer && harpyOffer(duel, viewer) === "lash" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "act press is-skillbox",
								onClick: () => apply(harpyLash(duel)),
								children: "Roi điện"
							}) : null,
							mine && !askUpkeep && !gemHold && !dueKnight && !knightAsk && !duel.recall && (duel.step === "main" && duel.turn === viewer || responding && duel.hold) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `act press ${responding ? "is-pass" : "is-end"}`,
								onClick: () => apply(responding ? passResponse(duel) : endTurn(duel)),
								children: responding ? "OK" : tr("Hết lượt")
							}) : null
						]
					}),
					aim?.kind === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitChips, {
						duel,
						uid: aim.uid,
						viewer,
						attackable: canPlay,
						blessOn: blessArm,
						onBless: () => {
							setBlessArm(true);
							holdNotice("Yêu tinh đang chờ. Kéo quái khác lên để chặn.");
						},
						onCotton: () => setCottonAsk("field"),
						onChronoFlow: (uid) => {
							if (!canTargetFoe(duel)) {
								holdNotice("Lượt đầu không được nhắm đối thủ.");
								return;
							}
							setAim(null);
							setChronoAsk(null);
							setChronoWarn(null);
							setChronoSpin({
								caster: uid,
								target: null,
								index: 2,
								sector: null
							});
						},
						onLure: (uid) => setLureAsk(uid),
						setAim,
						apply
					}) : null,
					look ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet is-skill is-read",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: look.name }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "ink-skill",
									onPointerDown: (event) => {
										const box = event.currentTarget;
										if (box.scrollHeight <= box.clientHeight + 2) return;
										skillPan.current = {
											id: event.pointerId,
											y: event.clientY,
											top: box.scrollTop
										};
										box.setPointerCapture(event.pointerId);
									},
									onPointerMove: (event) => {
										const pan = skillPan.current;
										if (!pan || pan.id !== event.pointerId) return;
										event.currentTarget.scrollTop = pan.top - (event.clientY - pan.y);
									},
									onPointerUp: () => {
										skillPan.current = null;
									},
									onPointerCancel: () => {
										skillPan.current = null;
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyText, { text: look.text }), look.hot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "ink-monster",
										children: tr(look.hot)
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act alt press",
									onClick: () => setLook(null),
									children: "Đóng"
								})
							]
						})
					}) : null,
					strike && selectedCard ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet is-skill",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: selectedCard.name }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press",
									onClick: () => {
										const next = strike.face || !strike.foeUid ? attackFace(duel, strike.uid) : attackMonster(duel, strike.uid, strike.foeUid);
										setStrike(null);
										apply(next);
									},
									children: "Đánh thường"
								}),
								selectedCard.id === "cuc-bong-ma-quai" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press is-skillbox",
									onClick: () => {
										setStrike(null);
										apply(useSkill(duel, strike.uid, null, 0));
									},
									children: "Nhân 2"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press is-skillbox",
									onClick: () => {
										setStrike(null);
										apply(useSkill(duel, strike.uid, null, 1));
									},
									children: "Nhân 3"
								})] }) : selectedCard.id === "mat-xanh-huy-diet" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press is-skillbox",
									onClick: () => {
										const armed = duel.players.flatMap((player) => player.field).some((unit) => unit?.uid === strike.uid && unit.gaze) ? duel : useSkill(duel, strike.uid, null, 0);
										const ready = armed.players.flatMap((player) => player.field).some((unit) => unit?.uid === strike.uid && unit.gaze);
										setStrike(null);
										if (!ready) {
											apply(armed);
											return;
										}
										apply(strike.face || !strike.foeUid ? attackFace(armed, strike.uid) : attackMonster(armed, strike.uid, strike.foeUid));
									},
									children: "Tia sáng huỷ diệt"
								}) : skillChoices(selectedCard.skill).map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press is-skillbox",
									onClick: () => {
										setStrike(null);
										apply(!/tích luỹ|thăng cấp|nhân bản|lộ diện|đổi thế/i.test(line) ? declareSkill(duel, strike.uid, wantsTarget(line) ? strike.foeUid : null, index) : useSkill(duel, strike.uid, wantsTarget(line) ? strike.foeUid : null, index));
									},
									children: line.replace(/^\d+\.\s*/, "")
								}, line)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act alt press",
									onClick: () => setStrike(null),
									children: "Huỷ"
								})
							]
						})
					}) : null,
					inspect && (shownMonster || shownSpell) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inspect-dismiss",
						"aria-label": "Đóng kỹ năng",
						onClick: () => setInspect(null)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "inspect-card",
						children: [shownMonster ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							monster: shownMonster,
							gems: reserveToll ? `${shownMonster.gems}+1` : void 0,
							live: reserveHeld && shownMonster ? reserveLive(reserveHeld, shownMonster) : void 0
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							spellId: shownSpell?.id,
							gems: spellToll ? `${shownSpell?.gems ?? 0}+1` : void 0
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `inspect-copy${shownMonster ? " is-skill" : " is-spell"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: shownMonster?.name ?? shownSpell?.name }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: shownMonster ? `${shownMonster.stars} sao · ${reserveToll ? `${shownMonster.gems}+1` : shownMonster.gems} gem` : `${spellToll ? `${shownSpell?.gems ?? 0}+1` : shownSpell?.gems ?? 0} gem` }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: shownMonster ? "ink-skill" : "ink-spell",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyText, { text: shownMonster?.skill ?? shownSpell?.effect ?? "" })
								}),
								shownSpell && mine && inspect?.pile === "spell" && (shownSpell.id !== "hoan-doi" || spellCanAnswer(shownSpell.id, duel)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press",
									onClick: () => {
										const index = inspect.index;
										if (shownSpell.id === "ke-dao-mo") {
											setInspect(null);
											openDig(index);
											return;
										}
										const swap = shownSpell.id === "hoan-doi";
										const aimed = aimedUid(duel);
										const ally = aimed && duel.players[viewer].field.some((mon) => mon?.uid === aimed) ? aimed : null;
										setInspect(null);
										if (swap) setSwapPick([]);
										apply(castSpell(duel, index, swap ? aimed : shownSpell.id === "co-may-thoi-gian" || shownSpell.id === "giap-co-khi" ? ally : null));
									},
									children: shownSpell.id === "hoan-doi" || shownSpell.id === "ke-dao-mo" ? "Use" : "Dùng phép"
								}) : null
							]
						})]
					})] }) : null,
					drag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ghost",
						style: {
							left: drag.x,
							top: drag.y
						},
						children: drag.kind === "spell" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { spellId: drag.spellId }) : drag.kind === "unit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							monster: drag.card,
							level: drag.live.level,
							live: drag.live
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { monster: drag.card }), drag.kind === "summon" && riteHand === drag.index ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							className: "rite-ring",
							src: "/fx/hien-te-vong.mp4",
							autoPlay: true,
							loop: true,
							playsInline: true,
							ref: (node) => {
								if (node) node.play();
							}
						}) : null] })
					}) : null,
					duel.glimpse ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet glimpse-sheet",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: tr("Quái dự bị đối thủ") }),
								duel.glimpse.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Không còn quái dự bị.") }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "glimpse-list",
									children: duel.glimpse.map((id, index) => {
										const card = monsterCard(id);
										if (!card) return null;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "glimpse-row",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { monster: card }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "inspect-copy is-skill",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: card.name }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
														card.stars,
														" sao · ",
														card.gems,
														" gem"
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "ink-skill",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyText, { text: card.skill })
													})
												]
											})]
										}, `${id}-${index}`);
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press",
									onClick: () => setDuel(dismissGlimpse(duel)),
									children: "Đóng"
								})
							]
						})
					}) : null,
					help ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: tr("Cài đặt") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "tuner-note",
									children: tr("Ngôn ngữ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pad2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: `act alt press${language === "vi" ? " on" : ""}`,
										onClick: () => setLang("vi"),
										children: "Tiếng Việt"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: `act alt press${language === "en" ? " on" : ""}`,
										onClick: () => setLang("en"),
										children: "English"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press",
									onClick: () => {
										setHelp(false);
										apply(concede(duel, viewer));
									},
									children: tr("Đầu hàng")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: "act alt press",
									children: tr("Về menu chính")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act alt press",
									onClick: () => setHelp(false),
									children: tr("Đóng")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "sound-row",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: `sound-ico${sound ? "" : " is-off"}`,
										"aria-label": sound ? "Tắt tiếng" : "Bật tiếng",
										onClick: () => {
											const next = !sound;
											setSound(next);
											setSoundOn(next);
											if (next) playCue("draw");
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpeakerIcon, { muted: !sound })
									})
								})
							]
						})
					}) : null,
					testOpen && duel.mode === "test" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet test-sheet",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Test" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Bên dưới là lượt đang chơi. Tay hoặc sân không tốn sao hay mana.") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pad2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: `tuner-item${testKind === "monster" ? " on" : ""}`,
										onClick: () => setTestKind("monster"),
										children: tr("Quái")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: `tuner-item${testKind === "spell" ? " on" : ""}`,
										onClick: () => setTestKind("spell"),
										children: tr("Phép")
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "tune-input",
									value: testFind,
									placeholder: tr("Tìm tên"),
									onChange: (event) => setTestFind(event.target.value)
								}),
								testCards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "test-row",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: tr(card.name) }),
										"env" in card && card.env ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => apply(testEnv(duel, viewer, card.id)),
											children: tr("Sân bạn")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => apply(testEnv(duel, otherSide, card.id)),
											children: tr("Sân đối")
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => apply(testGrant(duel, viewer, card.id, false)),
											children: "Tay bạn"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => apply(testGrant(duel, otherSide, card.id, false)),
											children: "Tay đối"
										})] }),
										testKind === "monster" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => apply(testGrant(duel, viewer, card.id, true)),
											children: tr("Sân bạn")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => apply(testGrant(duel, otherSide, card.id, true)),
											children: tr("Sân đối")
										})] }) : null
									]
								}, card.id)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act alt press",
									onClick: () => setTestOpen(false),
									children: "Đóng"
								})
							]
						})
					}) : null,
					duel.winner !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sheet",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: duel.mode === "hotseat" || duel.mode === "test" ? duel.winner === 0 ? "Bên 1 thắng" : "Bên 2 thắng" : duel.winner === viewer ? "Bạn thắng" : "Bạn thua" }),
								duel.mode === "net" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "act press",
									onClick: () => {
										const next = createDuel(loadDeck(), duel.mode);
										if (next.mode === "ai" && next.step === "main" && next.winner === null) {
											warmMatchHistory();
											matchRef.current = {
												id: newMatchId(),
												startedAt: Date.now(),
												decks: openingDecks(next.players),
												saved: false
											};
										} else matchRef.current = null;
										apply(next);
									},
									children: "Đấu lại"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/deck",
									className: "act alt press",
									children: "Sửa bộ bài"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: "act alt press",
									children: "Về menu chính"
								})
							]
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spectacle, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FireBurst, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoltBurst, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LaserBeam, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WaterBurst, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldBurst, {})
				]
			})
		})
	});
}
function SpeakerIcon({ muted }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		width: "28",
		height: "28",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M3.5 9.2h3.6L12 5v14l-4.9-4.2H3.5z"
		}), muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M16 9.2l5.2 5.6M21.2 9.2L16 14.8",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2.3",
			strokeLinecap: "round"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M15.6 8.4a4.2 4.2 0 0 1 0 7.2",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.8",
			strokeLinecap: "round"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M18 5.6a7.4 7.4 0 0 1 0 12.8",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.8",
			strokeLinecap: "round"
		})] })]
	});
}
function gnawReady(duel, mon, side) {
	if (mon.cardId !== "chien-si-gam-nham" || mon.dim || mon.stun > 0 || mon.noBlock) return false;
	if (duel.players[side].orb < skillManaCost(mon.cardId) && !duel.parley || duel.step !== "respond" || duel.hold?.priority !== side || !duel.pending) return false;
	const pending = duel.pending;
	if (pending.kind === "melee") return pending.attacker !== mon.uid && (pending.defender === mon.uid || duel.hold?.blocker === mon.uid);
	if (pending.kind === "face") return pending.attacker !== mon.uid && side !== duel.turn;
	if (pending.kind === "beam" && pending.back) return pending.target === mon.uid && pending.caster !== mon.uid;
	if (pending.kind === "beam") return pending.caster !== mon.uid && side !== duel.turn;
	return false;
}
function isPrime(duel, mon, side) {
	if (mon.stun > 0) return false;
	if (mon.cardId === "ga-he-dang-so" && mon.charge >= 2 && !mon.dim) return true;
	return gnawReady(duel, mon, side) || cottonReady(duel, mon, side);
}
function cottonReady(duel, mon, side) {
	if (mon.cardId !== "cuc-bong-ma-quai" || mon.copy) return false;
	const offer = cottonOffer(duel, side);
	return offer.self || offer.copy;
}
function SwordIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M14.2 2.2 21.8 9.8l-2.1 2.1-1.3-1.3-6.6 6.6 1.6 1.6-1.6 1.6-2.3-2.3-2.2 2.2-1.6-1.6 2.2-2.2-2.3-2.3 1.6-1.6 1.6 1.6 6.6-6.6-1.3-1.3 2.1-2.1Z"
		})
	});
}
function UnitChips({ duel, uid, viewer, attackable, blessOn, onBless, onCotton, onChronoFlow, onLure, setAim, apply }) {
	const side = duel.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1;
	const mon = duel.players[side].field.find((unit) => unit?.uid === uid) ?? null;
	const card = mon ? monsterCard(mon.cardId) : void 0;
	const index = duel.players[side].field.findIndex((unit) => unit?.uid === uid);
	if (!mon || !card || index < 0) return null;
	const box = SLOT_BOX[screenSide(side, viewer)][index];
	const you = duel.players[side];
	const noSkill = mon.dim || mon.stun > 0 || (mon.chain ?? 0) > 0 || (mon.path ?? 0) > 0 || hexLocked(mon);
	const noAttack = noSkill || (mon.gag ?? 0) > 0 || card.id === "hoa-an-thit-nguoi";
	const empty = you.field.filter((unit) => !unit).length;
	const y = [];
	const z = [];
	const afford = (cost) => Boolean(duel.parley && duel.step === "respond") || you.orb >= cost;
	const aimSkill = (skillIndex) => setAim({
		kind: "skill",
		uid,
		index: skillIndex
	});
	if (attackable && !noSkill) for (const chip of fieldBindsFor(card.id, {
		cardId: card.id,
		orb: you.orb,
		level: mon.level ?? 1,
		hp: mon.hp,
		beat: mon.beat ?? 0,
		stored: mon.stored ?? 0,
		skillText: plainCopy(card.skill),
		afford,
		aim: aimSkill,
		cast: (index) => apply(useSkill(duel, uid, null, index)),
		declare: (index) => apply(declareSkill(duel, uid, null, index))
	})) y.push({
		key: chip.key,
		label: chip.label,
		go: chip.go
	});
	if (attackable && !noSkill && !mon.copy && card.id === "ga-he-dang-so") {
		if (you.orb >= 1) y.push({
			key: "charge",
			label: chipLabel(card.id, "charge"),
			go: () => apply(useSkill(duel, uid, null, 0))
		});
		if (mon.charge >= 2) z.push({
			key: "cast",
			label: chipLabel(card.id, "cast"),
			go: () => aimSkill(1)
		});
	}
	if (attackable && !noSkill && !mon.copy && card.id === "cuc-bong-ma-quai") {
		if (empty >= 1) y.push({
			key: "one",
			label: chipLabel(card.id, "one"),
			go: () => apply(useSkill(duel, uid, null, 1))
		});
		if (empty >= 2) y.push({
			key: "two",
			label: chipLabel(card.id, "two"),
			go: () => apply(useSkill(duel, uid, null, 2))
		});
	}
	if (attackable && !mon.copy && card.id === "sat-nhan-bat-giu" && !mon.seized && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0 && !mon.cage) y.push({
		key: "seize",
		label: chipLabel(card.id, "seize"),
		go: () => aimSkill(0)
	});
	if (attackable && !noSkill && card.id === "mat-xanh-huy-diet" && !mon.gaze && you.orb >= 1) y.push({
		key: "gaze",
		label: "Tia sáng",
		go: () => apply(useSkill(duel, uid, null, 0))
	});
	if (attackable && !noSkill && card.id === "ky-si-bong-toi" && afford(skillManaCost(card.id))) y.push({
		key: "vow",
		label: chipLabel(card.id, "vow"),
		go: () => apply(offerVow(duel, uid))
	});
	if (attackable && card.id === "nu-chua-dieu-nhan-hoan-my") {
		if (mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0) {
			y.push({
				key: "gust",
				label: chipLabel(card.id, "gust"),
				go: () => apply(useSkill(duel, uid, null, 0))
			});
			if (!mon.bolt && you.orb >= 1) y.push({
				key: "bolt",
				label: chipLabel(card.id, "bolt"),
				go: () => apply(useSkill(duel, uid, null, 2))
			});
		}
		if (!noSkill) y.push({
			key: "lure",
			label: chipLabel(card.id, "lure"),
			go: () => aimSkill(3)
		});
	}
	if (attackable && !noSkill && (card.id === "my-dieu-nhan" || card.id === "nu-chua-dieu-nhan")) {
		const spent = new Set(mon.shed ?? []);
		const gust = card.id === "nu-chua-dieu-nhan" ? 0 : 1;
		const charm = 0;
		if (!spent.has("gust") && you.orb >= gust) y.push({
			key: "gust",
			label: chipLabel(card.id, "gust"),
			go: () => apply(useSkill(duel, uid, null, 0))
		});
		if (card.id === "nu-chua-dieu-nhan" && mon.lure) y.push({
			key: "lure",
			label: chipLabel(card.id, "lure"),
			go: () => aimSkill(3)
		});
		else if (!spent.has("charm") && you.orb >= charm) y.push({
			key: "charm",
			label: chipLabel(card.id, "charm"),
			go: () => card.id === "nu-chua-dieu-nhan" ? onLure(uid) : aimSkill(1)
		});
	}
	if (attackable && !noSkill && card.id === "hiep-si-cua-hau" && !duel.parley && you.orb >= 1) y.push({
		key: "talk",
		label: tr("Đàm phán"),
		go: () => apply(startParley(duel, uid))
	});
	if (attackable && !noSkill && card.id === "hiep-si-huyen-bi" && !duel.parley && you.orb >= 2) z.push({
		key: "talk",
		label: tr("Đàm phán"),
		go: () => apply(startParley(duel, uid))
	});
	if (attackable && !noSkill && card.id === "phu-thuy-thoi-gian" && you.orb >= 2) y.push({
		key: "all",
		label: chipLabel(card.id, "all"),
		go: () => onChronoFlow(uid)
	});
	if (attackable && !noSkill && card.id === "rong-boc-trung") y.push({
		key: "stance",
		label: mon.stance === "guard" ? chipLabel(card.id, "stanceAttack") : chipLabel(card.id, "stanceGuard"),
		go: () => apply(toggleStance(duel, uid))
	});
	if (card.id === "ken-ngai" && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.level ?? 0) >= 4 && (mon.level ?? 0) <= 5) y.push({
		key: "hatch",
		label: chipLabel(card.id, "hatch"),
		go: () => apply(useSkill(duel, uid, null, 1))
	});
	if (attackable && card.id === "may-quay-thuong" && !mon.spun && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0) y.push({
		key: "reel",
		label: chipLabel(card.id, "reel"),
		go: () => {
			setAim(null);
			apply(startReel(duel, uid));
		}
	});
	if (attackable && !noSkill && card.id === "may-quay-thuong" && you.orb >= 1) y.push({
		key: "rage",
		label: chipLabel(card.id, "rage"),
		go: () => aimSkill(1)
	});
	if (attackable && !noSkill && card.id === "trai-tim-hai-long") y.push({
		key: "tide",
		label: chipLabel(card.id, "tide"),
		go: () => setAim({
			kind: "tide",
			uid
		})
	});
	if (mon.cardId === "yeu-tinh-chuc-phuc" && monsterAlert(duel, mon, side) && afford(skillManaCost(mon.cardId, 1))) z.push({
		key: "bless",
		label: blessOn ? tr("Đang chờ buff") : chipLabel(mon.cardId, "bless"),
		go: () => {
			const pending = duel.pending;
			if (pending?.kind === "melee" && pending.defender) {
				apply(answerFairy(duel, pending.defender, true));
				return;
			}
			onBless();
		}
	});
	if (canWall(duel, uid) && !mon.dim) z.push({
		key: "wall",
		label: chipLabel(mon.cardId, "wall"),
		go: () => apply(wallAlly(duel, uid))
	});
	if (canStand(duel, uid)) z.push({
		key: "stand",
		label: chipLabel(mon.cardId, "stand"),
		go: () => apply(standFor(duel, uid))
	});
	if (canGuardCover(duel, uid)) z.push({
		key: "cover",
		label: card.id === "hiep-si-huyen-bi" ? tr("Phòng ngự") : tr("Kiếm phòng ngự"),
		go: () => apply(guardCover(duel, uid))
	});
	if (canSpirit(duel, uid) && !mon.dim) z.push({
		key: "cover",
		label: chipLabel("thien-than-be-nho", "cover"),
		go: () => apply(spiritCover(duel, uid))
	});
	if (!mon.dim && card.id === "kizuran" && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.cover || you.field.some((unit) => unit && unit.cardId === "kazura" && unit.hp > 0))) z.push({
		key: "cover",
		label: mon.cover ? tr("Ngừng đỡ") : chipLabel(card.id, "cover"),
		go: () => apply(setCover(duel, uid, !mon.cover))
	});
	if (gnawReady(duel, mon, side)) {
		const pending = duel.pending;
		if (!(pending?.kind === "beam" && pending.target && pending.target !== uid)) z.push({
			key: "guard",
			label: chipLabel(card.id, "guard"),
			go: () => apply(pending?.kind === "beam" ? boostGnawOnChain(duel, uid) : pending?.kind === "face" ? assignBlock(duel, uid, true) : boostGnawOnChain(duel, uid))
		});
	}
	if (cottonReady(duel, mon, side)) z.push({
		key: "dodge",
		label: chipLabel(card.id, "dodge"),
		go: onCotton
	});
	if (noAttack && y.length === 0 && z.length === 0) return null;
	const soloRed = z.length === 1 && y.length === 0 && !(attackable && !noAttack);
	let above = 0;
	const overCard = () => {
		above += 1;
		return {
			left: `${box.x}%`,
			top: `${Math.max(.6, box.y - above * 7.4)}%`,
			width: `${box.w}%`,
			height: "6.8%"
		};
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		attackable && !noAttack ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "act-chip is-k press",
			style: overCard(),
			onClick: () => setAim({
				kind: "attack",
				uid
			}),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwordIcon, {}), tr(attackLabel())]
		}) : null,
		y.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "act-chip is-y press",
			style: overCard(),
			onClick: item.go,
			children: tr(item.label)
		}, item.key)),
		z.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: `act-chip is-z press${soloRed ? " is-mid" : ""}`,
			style: soloRed ? {
				left: `${box.x}%`,
				top: `${box.y + box.h * .28}%`,
				width: `${box.w}%`,
				height: "8%"
			} : overCard(),
			onClick: item.go,
			children: tr(item.label)
		}, item.key))
	] });
}
function KnightPick({ room, onPick, onSkip }) {
	const [picks, setPicks] = (0, import_react.useState)([]);
	const choose = (pick) => {
		const next = picks.includes(pick) ? picks.filter((item) => item !== pick) : [...picks, pick].slice(-room);
		setPicks(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay is-ask",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ask-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: room === 2 ? askLabel("ky-si-bong-toi", "pick2") : askLabel("ky-si-bong-toi", "pick1") }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: picks.includes("atk") ? "on" : "",
					onClick: () => choose("atk"),
					children: tr("+3 công")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: picks.includes("def") ? "on" : "",
					onClick: () => choose("def"),
					children: tr("+2 thủ")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: picks.includes("hp") ? "on" : "",
					onClick: () => choose("hp"),
					children: tr("+2 máu tối đa")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: picks.length === 0,
					onClick: () => onPick(picks.slice(0, room)),
					children: tr("Chọn")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onSkip,
					children: tr("Bỏ qua")
				})
			]
		})
	});
}
function BoardSlot({ mon, side, index, layout, near, hot, fuse = false, fuseHide = false, tone = "monster", picked = false, attack, shift = null, motion, ghosting, frozen = false, fading = false, prime = false, hpOverride, alert = false, veil = false, mask = false, decoy = false, lockFlash = false, allies = [], onSlot, onUnit, onPointerDown, onPointerMove, onPointerUp }) {
	const cls = `slot slot-${near ? "y" : "f"}${index}${hot ? ` is-hot is-${tone}` : ""}${fuse ? " is-fuse" : ""}${picked ? " is-picked" : ""}${attack ? " is-attack" : ""}${alert ? " is-alert" : ""}${fading ? " is-falling" : ""}${motion.pops.includes(`${side}-${index}`) ? " summon-pop" : ""}${mon && motion.hits.includes(mon.uid) ? " is-hit" : ""}`;
	const slotProps = {
		"data-slot": `${side}-${index}`,
		"data-owner": side,
		"data-index": index,
		"data-empty": mon && !frozen ? "0" : "1",
		"data-uid": frozen ? "" : mon?.uid ?? ""
	};
	if (!mon) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: cls,
		"aria-label": `Ô ${index + 1}`,
		...slotProps,
		onClick: () => onSlot(side, index)
	});
	const tokenName = (monsterCard(mon.cardId)?.stars ?? 1) <= 0;
	const stats = visibleStats(mon, allies);
	const spot = (key, value, blue = false, hold = false) => {
		if (typeof value === "number" && value === 0) return null;
		const red = typeof value === "number" && value < 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `fstat${key === "name" ? " fname" : ""}${key === "count" ? " is-count" : ""}${hold ? " is-hold" : ""}${tokenName && key === "name" ? " is-token" : ""}${red ? " is-red" : ""}${!red && blue ? " is-blue" : ""}`,
			style: {
				left: `${layout[key].x}%`,
				top: `${layout[key].y}%`,
				fontSize: `${hold ? Math.round(layout[key].size * 1.18) : layout[key].size}cqmin`,
				width: `${hold ? Math.min(48, Math.round(layout[key].width * 1.45)) : layout[key].width}%`,
				height: `${layout[key].height}%`
			},
			children: key === "name" && typeof value === "string" ? tr(value) : value
		});
	};
	const bind = Math.max(mon.stun, mon.chain ?? 0, mon.gag ?? 0, mon.path ?? 0);
	const count = (mon.cardId === "ga-he-dang-so" || mon.cardId === "tho-den-tinh-nghich") && mon.charge > 0 ? mon.charge : mon.cardId === "linh-chien-da-khong-lo" && mon.blocksLeft > 0 ? mon.blocksLeft : (mon.cardId === "kazura" || mon.cardId === "kizuran") && allies.some((unit) => unit && unit.cardId === (mon.cardId === "kazura" ? "kizuran" : "kazura") && unit.hp > 0) ? allies.reduce((sum, unit) => sum + (unit && unit.cardId === (mon.cardId === "kazura" ? "kizuran" : "kazura") && unit.hp > 0 ? unit.stored ?? 0 : 0), 0) || "" : mon.cardId === "ken-ngai" ? mon.level ?? 0 : mon.cardId === "con-thinh-no-cua-hai-vuong" ? 2 + 3 * (mon.stored ?? 0) : mon.cardId === "hiep-si-cua-hau" ? mon.beat === 1 ? 2 : 1 : (mon.level ?? 1) > 1 ? mon.level ?? 1 : "";
	const glassLabel = mon.glass ? tr("Suy") : "";
	const lit = (mon.shown ?? 0) > 0 ? mon.shown ?? 0 : 0;
	const countShown = count !== "" && count !== 0 ? String(count) : lit > 0 ? String(lit) : "";
	const due = !veil && !mask && (mon.cardId === "chien-binh-rong" || mon.cardId === "nu-chua-dieu-nhan-hoan-my" || mon.cardId === "hiep-si-ho-ve" || mon.cardId === "hiep-si-huyen-bi") ? mon.debt?.[0] : void 0;
	const debtSlots = [
		{
			k: "p",
			n: due?.p ?? 0
		},
		{
			k: "s",
			n: due?.s ?? 0
		},
		...mon.cardId === "nu-chua-dieu-nhan-hoan-my" || mon.cardId === "hiep-si-ho-ve" || mon.cardId === "hiep-si-huyen-bi" ? [] : [{
			k: "t",
			n: due?.t ?? 0
		}]
	];
	const debtOn = debtSlots.some((part) => part.n > 0);
	const hideName = countShown.length >= 2 || debtOn;
	const lunging = Boolean(shift);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `${cls}${lunging ? " is-lunging" : ""}`,
		style: shift ? { transform: `translate(${shift.x}%, ${shift.y}%)` } : void 0,
		...slotProps,
		onClick: frozen ? void 0 : () => onUnit(side, mon),
		onPointerDown: frozen ? void 0 : onPointerDown,
		onPointerMove: frozen ? void 0 : onPointerMove,
		onPointerUp: frozen ? void 0 : onPointerUp,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `field-unit${mask ? "" : `${mon.dim || bind > 0 || lockFlash || hexLocked(mon) ? " is-dim" : ""}${lockFlash ? " is-lockflash" : ""}${prime ? " is-prime" : ""}${holdingMend(mon) ? " is-mending" : ""}`}${lunging ? " is-lunging" : ""}${motion.hits.includes(mon.uid) ? " is-hit" : ""}${ghosting ? " is-dim" : ""}${fuseHide ? " is-fuse-hide" : ""}`,
			children: [
				artSrc(decoy || mask ? "mu" : mon.cardId, decoy || mask ? 1 : mon.level) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					className: "art",
					src: artSrc(decoy || mask ? "mu" : mon.cardId, decoy || mask ? 1 : mon.level),
					alt: "",
					draggable: false,
					style: veil ? { filter: "brightness(0)" } : void 0
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					className: "frame",
					src: "/field-frame.png",
					alt: "",
					draggable: false
				}),
				veil || decoy ? decoy ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
					className: "sea-veil",
					children: tr("Ẩn")
				}) : mask ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "badges",
					children: [
						bind > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "is-hold",
							children: bind >= 90 ? "∞" : bind
						}) : null,
						mon.curse ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "is-harm",
							children: "∞"
						}) : null,
						mon.vulnerable > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "X2" }) : null,
						mon.noBlock && !isStill(mon.cardId) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: tr("Cấm") }) : null,
						mon.poison ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "is-harm",
							children: mon.poison.left == null || mon.poison.left >= 90 ? "∞" : mon.poison.left
						}) : null,
						mon.hex && mon.hex.left > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "is-harm",
							children: mon.hex.left
						}) : null,
						(mon.wet ?? 0) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: tr("Ẩm") }) : null,
						mon.cover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: tr("Đỡ") }) : null,
						mon.oath?.phys || mon.ward === "phys" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "is-ward-phys",
							children: tr("Khiên")
						}) : null,
						mon.oath?.spell || mon.ward === "spell" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "is-ward-spell",
							children: tr("Phép")
						}) : null,
						(mon.blessAtk ?? 0) > 0 || (mon.blessDmg ?? 0) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: tr("Hồi") }) : null,
						glassLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "is-hold",
							children: glassLabel
						}) : null,
						mon.preyAim ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: mon.preyKind === "spell" ? "Phép" : mon.preyKind === "tru" ? "Chuẩn" : "Vật" }) : null,
						mon.cage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "Khoá" }) : null
					]
				}),
				veil || (decoy ? false : !mask && hideName) ? null : spot("name", decoy ? "Thế thân" : mask ? "Mũ" : fieldName(mon)),
				veil || mask || decoy ? null : spot("def", stats.def, stats.blueDef),
				veil || mask || decoy ? null : spot("mdef", stats.mdef, stats.blueMdef),
				veil || mask || decoy ? null : spot("atk", stats.atk, stats.blueAtk),
				veil ? null : spot("hp", decoy ? mon.stored ?? 1 : mask ? 1 : hpOverride ?? mon.hp, decoy || mask ? false : stats.blueHp),
				!veil && !mask && !decoy && debtOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "fstat is-debt",
					style: {
						left: `${layout.count.x}%`,
						top: `${layout.count.y}%`,
						width: `${layout.count.width}%`,
						height: `${layout.count.height}%`,
						fontSize: `${layout.count.size}cqmin`
					},
					children: debtSlots.map((part) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						className: `is-${part.k}`,
						children: part.n > 0 ? part.n : ""
					}, part.k))
				}) : null,
				!mask && !debtOn && countShown ? spot("count", countShown, false, false) : null
			]
		})
	});
}
//#endregion
export { PlayPage as component };
