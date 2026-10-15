import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const { createDuel, draw, summon, attackFace, passResponse, endTurn, aiStep, answerLegs, answerUpkeep } = await vite.ssrLoadModule("/src/lib/duel.ts");
const { noteFinishedAi, exportMatchHistory, rememberMatch } = await vite.ssrLoadModule("/src/lib/match-history.ts");

const deck = {
  monsters: Array.from({ length: 12 }, () => "phu-thuy-thoi-gian"),
  spells: Array.from({ length: 8 }, () => "mua-ma-thuat"),
};

function progressed(before, after) {
  if (after === before || after.winner) return after !== before;
  if (after.turn !== before.turn || after.step !== before.step) return true;
  if (after.players[0].hp !== before.players[0].hp || after.players[1].hp !== before.players[1].hp) return true;
  const field = (player) => player.field.filter(Boolean).length;
  if (field(after.players[0]) !== field(before.players[0]) || field(after.players[1]) !== field(before.players[1])) return true;
  if ((after.players[0].draws ?? 0) > (before.players[0].draws ?? 0)) return true;
  if ((after.players[0].summons ?? 0) > (before.players[0].summons ?? 0)) return true;
  if ((after.players[0].aside ?? 0) > (before.players[0].aside ?? 0)) return true;
  return false;
}

function step(state) {
  if (state.winner || state.step === "over") return state;
  if (state.legs && state.turn === 0) return answerLegs(state, 0);
  if (state.upkeep && state.turn === 0 && state.step === "main") return answerUpkeep(state, false);
  if (state.step === "respond") {
    if (state.hold?.priority === 1) {
      const next = aiStep(state);
      return progressed(state, next) ? next : passResponse(state);
    }
    return passResponse(state);
  }
  if (state.turn === 1) {
    const next = aiStep(state);
    if (progressed(state, next)) return next;
    return endTurn(state);
  }
  if (state.players[0].draws < 1 && state.players[0].orb >= 1 && state.players[0].monsterDeck.length > 0) {
    const next = draw(state, "monster");
    if (progressed(state, next)) return next;
  }
  const slot = state.players[0].field.findIndex((mon) => !mon);
  if (state.players[0].summons < 1 && (state.players[0].aside ?? 0) < 1 && slot >= 0 && state.players[0].reserve.length > 0) {
    const next = summon(state, 0, slot);
    if (progressed(state, next)) return next;
  }
  const mon = state.players[0].field.find((unit) => unit && !unit.dim && unit.hp > 0);
  if (mon && !(state.opening && state.turn === 0)) {
    const next = attackFace(state, mon.uid);
    if (progressed(state, next) || next.step === "respond" || next.winner) return next;
  }
  return endTurn(state);
}

let state = createDuel(deck, "ai");
let spins = 0;
let last = "";
for (let n = 0; n < 1200 && state.winner === null; n += 1) {
  const next = step(state);
  const mark = `${next.step}|${next.turn}|${next.live}|${next.players.map((p) => p.hp).join("-")}|${next.events?.length}`;
  if (next === state || mark === last) {
    spins += 1;
    if (spins > 8) {
      console.log("STUCK", mark);
      break;
    }
  } else spins = 0;
  last = mark;
  state = next;
}

console.log("END", {
  winner: state.winner,
  step: state.step,
  events: state.events?.length ?? 0,
  hp: state.players.map((p) => p.hp),
  live: state.live,
});

const store = {
  raw: new Map(),
  getItem(key) {
    return this.raw.has(key) ? this.raw.get(key) : null;
  },
  setItem(key, value) {
    this.raw.set(key, value);
  },
};
const saved = noteFinishedAi(
  { mode: "ai", winner: null, step: "main" },
  state,
  { id: "sim", startedAt: 1, decks: null, saved: false },
  store,
);
const pack = exportMatchHistory(store);
console.log("SAVE", saved, "pack", pack.status, pack.status === "ready" ? pack.count : pack.message ?? "");
const raw = store.getItem("clash-match-history");
console.log("BYTES", raw ? raw.length : 0);

if (!saved.saved) {
  const events = state.events ?? [];
  const whole = rememberMatch(
    { id: "whole", startedAt: 1, endedAt: 2, mode: "ai", winner: state.winner ?? 0, decks: null, log: state.log, events },
    store,
  );
  console.log("WHOLE", whole);
  let bad = null;
  for (let i = 0; i < events.length; i += 1) {
    const attempt = rememberMatch(
      { id: `e-${i}`, startedAt: 1, endedAt: 2, mode: "ai", winner: state.winner ?? 0, decks: null, log: ["x"], events: [events[i]] },
      { raw: new Map(), getItem(key) { return this.raw.has(key) ? this.raw.get(key) : null; }, setItem(key, value) { this.raw.set(key, value); } },
    );
    if (!attempt.ok) {
      bad = { i, reason: attempt.reason, event: events[i] };
      break;
    }
  }
  console.log("BAD_EVENT", JSON.stringify(bad));
}


await vite.close();
