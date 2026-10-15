import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const duelMod = await vite.ssrLoadModule("/src/lib/duel.ts");
const hist = await vite.ssrLoadModule("/src/lib/match-history.ts");
const { attackFace, createDuel, draw, endTurn, passResponse, summon } = duelMod;
const { diagnoseHistory, exportStoredHistory, noteFinishedAi, openingDecks, resetHistoryFallback, setHistoryMirrorForTests } = hist;

const deck = { monsters: ["khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat"], spells: ["mua-ma-thuat"] };
const open = createDuel(deck, "ai");
let ready = endTurn(endTurn(summon(draw(open, "monster"), 0, 0)));
const attacker = ready.players[0].field.find((mon) => mon);
assert.ok(attacker);
ready = { ...ready, players: [ready.players[0], { ...ready.players[1], hp: 1 }] };
const finished = passResponse(attackFace(ready, attacker.uid));
assert.equal(finished.winner, 0, "player should win");
assert.equal(finished.step, "over", "a player win must close the match");

class Memory {
  raw = new Map();
  getItem(key) {
    return this.raw.has(key) ? this.raw.get(key) : null;
  }
  setItem(key, value) {
    this.raw.set(key, value);
  }
}

const previousLocal = globalThis.localStorage;
const previousSession = globalThis.sessionStorage;
const local = new Memory();
const session = new Memory();
const mirror = { raw: null };
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
setHistoryMirrorForTests({
  async read() {
    return mirror.raw;
  },
  write(value) {
    mirror.raw = value;
  },
});
resetHistoryFallback();
try {
  const sealed = noteFinishedAi(ready, finished, { id: "player-win", startedAt: 5, decks: openingDecks(open.players), saved: false });
  assert.equal(sealed.saved, true);
  const seen = await diagnoseHistory();
  assert.equal(seen.local.count, 1);
  assert.equal(seen.session.count, 1);
  assert.equal(seen.indexed.count, 1);
  assert.equal(seen.memory, 1);
  resetHistoryFallback();
  const reloaded = await exportStoredHistory();
  assert.equal(reloaded.status, "ready");
  assert.match(reloaded.json, /player-win/);
  local.raw.clear();
  session.raw.clear();
  resetHistoryFallback();
  const onlyIndexed = await exportStoredHistory();
  assert.equal(onlyIndexed.status, "ready");
  assert.equal(onlyIndexed.count, 1);
  const split = await diagnoseHistory();
  assert.equal(split.local.count, 0);
  assert.equal(split.indexed.count, 1);
  console.log("FLOW_OK", JSON.stringify({ winner: finished.winner, step: finished.step, local: seen.local.count, indexed: seen.indexed.count, afterReload: reloaded.count, indexedAlone: onlyIndexed.count }));
} finally {
  setHistoryMirrorForTests(null);
  resetHistoryFallback();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocal });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSession });
  await vite.close();
}
