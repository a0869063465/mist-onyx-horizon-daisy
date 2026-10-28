import assert from "node:assert/strict";
import test from "node:test";
import { createDuel, concede, checkWinner, draw, endTurn, summon, attackFace, attackMonster, passResponse, assignBlock, aiStep, fuse, wallAlly, spiritCover, answerUpkeep, scoreReel, startReel, pullReel, settleReel, testGrant, useSkill, type Duel } from "./duel.ts";
import { FUSIONS } from "./fusion.ts";
import {
  MATCH_HISTORY_KEY,
  exportMatchHistory,
  exportStoredHistory,
  diagnoseHistory,
  isFinishedAi,
  loadMatchHistory,
  matchHistoryProblem,
  noteFinishedAi,
  openingDecks,
  rememberMatch,
  resetHistoryFallback,
  setHistoryMirrorForTests,
  type HistoryStore,
} from "./match-history.ts";

class Memory implements HistoryStore {
  raw = new Map<string, string>();
  fail = false;
  limit = 200_000;
  getItem(key: string) {
    return this.raw.has(key) ? this.raw.get(key)! : null;
  }
  setItem(key: string, value: string) {
    if (this.fail || value.length > this.limit) throw new Error("quota");
    this.raw.set(key, value);
  }
}

function finish(state: Duel, side: 0 | 1) {
  return concede(state, side);
}

test("a player win stays over, is stored, and reloads from either store", async () => {
  const deck = { monsters: ["khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat"], spells: ["mua-ma-thuat"] };
  const open = createDuel(deck, "ai");
  let ready = endTurn(endTurn(summon(draw(open), 0, 0)));
  const attacker = ready.players[0].field.find((mon) => mon);
  assert.ok(attacker);
  ready = { ...ready, players: [ready.players[0], { ...ready.players[1], hp: 1 }] };
  const finished = passResponse(attackFace(ready, attacker.uid));
  assert.equal(finished.winner, 0);
  assert.equal(finished.step, "over");
  const previousLocal = globalThis.localStorage;
  const previousSession = globalThis.sessionStorage;
  const local = new Memory();
  const session = new Memory();
  const mirror = { raw: null as string | null };
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
    assert.equal(seen.lastSeal?.saved, true);
    assert.equal(seen.lastSeal?.winner, 0);
    resetHistoryFallback();
    const reloaded = await exportStoredHistory();
    assert.equal(reloaded.status, "ready");
    if (reloaded.status === "ready") assert.match(reloaded.json, /player-win/);
    local.raw.clear();
    session.raw.clear();
    resetHistoryFallback();
    const fromIndexed = await exportStoredHistory();
    assert.equal(fromIndexed.status, "ready");
    if (fromIndexed.status === "ready") assert.equal(fromIndexed.count, 1);
  } finally {
    setHistoryMirrorForTests(null);
    resetHistoryFallback();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocal });
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSession });
  }
});

test("a finished AI match is saved even if the board step was left on main", () => {
  const store = new Memory();
  const saved = noteFinishedAi(
    { mode: "ai", winner: null },
    { mode: "ai", step: "main", winner: 0, log: ["Bạn thắng."], events: [] },
    { id: "flat-win", startedAt: 1, decks: null, saved: false },
    store,
  );
  assert.equal(saved.saved, true);
  assert.equal(exportMatchHistory(store).status, "ready");
});

test("ending an AI match stores it once and the export can read it", () => {
  const store = new Memory();
  const start = createDuel(undefined, "ai");
  const memo = { id: "played", startedAt: 4, decks: openingDecks(start.players), saved: false };
  const quit = concede(start, 0);
  const first = noteFinishedAi(start, quit, memo, store);
  assert.equal(first.saved, true);
  memo.saved = true;
  assert.equal(noteFinishedAi(start, quit, memo, store).saved, true);
  assert.equal(loadMatchHistory(store).length, 1);
  const pack = exportMatchHistory(store);
  assert.equal(pack.status, "ready");
  if (pack.status === "ready") {
    assert.equal(pack.count, 1);
    assert.match(pack.json, /played/);
    assert.match(pack.json, /"events"/);
    assert.match(pack.json, /concede/);
  }
  const open = createDuel(undefined, "ai");
  const dead = checkWinner({ ...open, players: [{ ...open.players[0], hp: 0 }, open.players[1]] });
  assert.equal(dead.step, "over");
  assert.equal(noteFinishedAi(open, dead, { id: "damage", startedAt: 1, decks: null, saved: false }, store).saved, true);
  assert.equal(exportMatchHistory(store).status === "ready" ? exportMatchHistory(store).count : 0, 2);
  const hotStart = createDuel(undefined, "hotseat");
  const hot = concede(hotStart, 0);
  assert.equal(noteFinishedAi(hotStart, hot, { id: "hot", startedAt: 1, decks: null, saved: false }, store).saved, false);
  assert.equal(loadMatchHistory(store).length, 2);
});

test("a refused device store still exports the finished AI match and says why", () => {
  const previousLocal = globalThis.localStorage;
  const previousSession = globalThis.sessionStorage;
  const quota = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota");
    },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: quota });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: quota });
  resetHistoryFallback();
  try {
    const start = createDuel(undefined, "ai");
    const quit = concede(start, 0);
    const sealed = noteFinishedAi(start, quit, { id: "quota-game", startedAt: 5, decks: openingDecks(start.players), saved: false });
    assert.equal(sealed.saved, true);
    const pack = exportMatchHistory();
    assert.equal(pack.status, "ready");
    if (pack.status === "ready") {
      assert.equal(pack.count, 1);
      assert.match(pack.json, /quota-game/);
      assert.match(pack.json, /"events"/);
    }
    assert.match(matchHistoryProblem() ?? "", /Không lưu được vào bộ nhớ máy/);
    assert.equal(noteFinishedAi(start, quit, { id: "quota-game", startedAt: 5, decks: null, saved: false }).saved, true);
    const again = exportMatchHistory();
    assert.equal(again.status === "ready" ? again.count : 0, 1);
  } finally {
    resetHistoryFallback();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocal });
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSession });
  }
});

test("a finished AI match survives a reload when the device refuses localStorage", async () => {
  const previousLocal = globalThis.localStorage;
  const previousSession = globalThis.sessionStorage;
  const previousDocument = globalThis.document;
  const quota = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota");
    },
  };
  const mirror = { raw: null as string | null };
  const jar = { cookie: "" };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: quota });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: quota });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get cookie() {
        return jar.cookie;
      },
      set cookie(value: string) {
        jar.cookie = value.split(";")[0] ?? "";
      },
    },
  });
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
    const start = createDuel(undefined, "ai");
    const quit = concede(start, 0);
    const sealed = noteFinishedAi(start, quit, { id: "reload-game", startedAt: 5, decks: openingDecks(start.players), saved: false });
    assert.equal(sealed.saved, true);
    assert.match(mirror.raw ?? "", /reload-game/);
    resetHistoryFallback();
    const pack = await exportStoredHistory();
    assert.equal(pack.status, "ready");
    if (pack.status === "ready") {
      assert.equal(pack.count, 1);
      assert.match(pack.json, /reload-game/);
      assert.match(pack.json, /"events"/);
    }
    mirror.raw = null;
    resetHistoryFallback();
    const lost = await exportStoredHistory();
    assert.equal(lost.status, "broken");
    if (lost.status === "broken") assert.match(lost.message ?? "", /Không lưu được vào bộ nhớ máy/);
    jar.cookie = "";
    const empty = await exportStoredHistory();
    assert.equal(empty.status, "empty");
  } finally {
    setHistoryMirrorForTests(null);
    resetHistoryFallback();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocal });
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSession });
    Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
  }
});

test("an AI match is stored once, and a forfeit stores the winner", () => {
  const store = new Memory();
  const duel = createDuel(undefined, "ai");
  const decks = openingDecks(duel.players);
  assert.ok(decks);
  assert.equal(decks.you.monsters.length, duel.players[0].reserve.length + duel.players[0].monsterDeck.length);
  assert.equal(
    decks.you.spells.length,
    duel.players[0].hand.length + duel.players[0].spellDeck.length + (duel.players[0].env ? 1 : 0),
  );
  assert.equal(duel.players[0].hand.length, 1);
  assert.equal(isFinishedAi(duel.mode, duel.step, duel.winner), false);
  const won = finish(duel, 1);
  assert.equal(won.mode, "ai");
  assert.equal(won.step, "over");
  assert.equal(won.winner, 0);
  const row = {
    id: "match-win",
    startedAt: 10,
    endedAt: 20,
    mode: won.mode,
    winner: won.winner,
    decks,
    log: won.log,
  };
  assert.equal(rememberMatch(row, store).ok, true);
  assert.equal(rememberMatch(row, store).ok, true);
  assert.equal(rememberMatch(row, store).ok && rememberMatch(row, store).added, false);
  const lost = finish(createDuel(undefined, "ai"), 0);
  assert.equal(lost.winner, 1);
  assert.equal(rememberMatch({ ...row, id: "match-loss", winner: lost.winner, log: lost.log }, store).ok, true);
  const again = loadMatchHistory(store);
  assert.equal(again.length, 2);
  assert.equal(again[0]?.result, "win");
  assert.equal(again[1]?.result, "loss");
  assert.equal(again[0]?.id, "match-win");
  assert.deepEqual(again[1]?.log, lost.log);
});

test("reload keeps history, and unfinished or other modes are refused", () => {
  const store = new Memory();
  const duel = createDuel(undefined, "ai");
  const decks = openingDecks(duel.players);
  rememberMatch({ id: "kept", startedAt: 1, endedAt: 2, mode: "ai", winner: 0, decks, log: ["1. xong"] }, store);
  const reloaded = loadMatchHistory(store);
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0]?.log[0], "1. xong");
  assert.equal(isFinishedAi("ai", "main", null), false);
  assert.equal(isFinishedAi("hotseat", "over", 0), false);
  assert.equal(isFinishedAi("net", "over", 1), false);
  assert.equal(isFinishedAi("test", "over", 0), false);
  for (const mode of ["hotseat", "net", "test"]) {
    const saved = rememberMatch({ id: mode, startedAt: 1, endedAt: 2, mode, winner: 0, decks, log: [] }, store);
    assert.equal(saved.ok, false);
  }
  const open = rememberMatch({ id: "open", startedAt: 1, endedAt: 2, mode: "ai", winner: null, decks, log: [] }, store);
  assert.equal(open.ok, true);
  assert.equal(loadMatchHistory(store).find((match) => match.id === "open")?.result, "draw");
  assert.equal(loadMatchHistory(store).some((match) => match.mode !== "ai"), false);
  assert.equal(loadMatchHistory(store).some((match) => match.id === "hotseat"), false);
});

test("a bad new record does not erase older history", () => {
  const store = new Memory();
  rememberMatch({ id: "old", startedAt: 1, endedAt: 2, mode: "ai", winner: 1, decks: null, log: ["cũ"] }, store);
  const before = store.getItem(MATCH_HISTORY_KEY);
  const bad = rememberMatch({ id: "", startedAt: 3, endedAt: 4, mode: "ai", winner: 0, decks: null, log: ["mới"] }, store);
  assert.equal(bad.ok, false);
  assert.equal(store.getItem(MATCH_HISTORY_KEY), before);
  assert.equal(loadMatchHistory(store).length, 1);
  store.fail = true;
  const blocked = rememberMatch({ id: "next", startedAt: 5, endedAt: 6, mode: "ai", winner: 0, decks: null, log: [] }, store);
  assert.equal(blocked.ok, false);
  assert.equal(store.getItem(MATCH_HISTORY_KEY), before);
  store.fail = false;
  const junk = "{";
  store.raw.set(MATCH_HISTORY_KEY, junk);
  const refused = rememberMatch({ id: "after-junk", startedAt: 7, endedAt: 8, mode: "ai", winner: 0, decks: null, log: [] }, store);
  assert.equal(refused.ok, false);
  assert.equal(store.getItem(MATCH_HISTORY_KEY), junk);
});

test("five end checks of one match stay a single record", () => {
  const store = new Memory();
  const row = { id: "once", startedAt: 1, endedAt: 2, mode: "ai", winner: 0 as const, decks: null, log: ["a"] };
  for (let n = 0; n < 5; n += 1) rememberMatch(row, store);
  assert.equal(loadMatchHistory(store).length, 1);
});

test("events stay across turns, name the actor, and do not treat a refusal as success", () => {
  const deck = { monsters: ["khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat"], spells: ["mua-ma-thuat"] };
  let duel = createDuel(deck, "ai");
  const refused = summon(duel, 0, 0);
  assert.equal(refused.events?.some((event) => event.kind === "summon" && event.ok), false);
  assert.equal(refused.events?.find((event) => event.kind === "summon")?.ok, false);
  duel = draw(duel);
  const drawn = duel.events?.find((event) => event.kind === "draw");
  assert.equal(drawn?.ok, true);
  assert.equal(drawn?.actor, 0);
  assert.equal(drawn?.cardId, "khong-lo-mot-mat");
  const blocked = draw(duel);
  assert.equal(blocked.events?.filter((event) => event.kind === "draw" && !event.ok).length, 1);
  duel = endTurn(blocked);
  duel = endTurn(duel);
  const kinds = duel.events?.map((event) => event.kind);
  assert.deepEqual(kinds, ["draw", "draw", "end-turn", "end-turn"]);
  assert.deepEqual(duel.events?.map((event) => event.actor), [0, 0, 0, 1]);
  assert.deepEqual(duel.events?.map((event) => event.n), [1, 2, 3, 4]);
  assert.equal(duel.log.some((line) => line.includes("Khổng lồ")), false);
  assert.equal(duel.events?.[0]?.hp[0], 16);
  assert.equal(duel.events?.[0]?.orb.length, 2);
  const ready = endTurn(endTurn(summon(draw(createDuel(deck, "ai")), 0, 0)));
  const attacker = ready.players[0].field.find((mon) => mon);
  assert.ok(attacker);
  const swung = attackFace(ready, attacker.uid);
  const attack = swung.events?.find((event) => event.kind === "attack-face");
  assert.equal(attack?.ok, true);
  assert.equal(attack?.actor, 0);
  assert.equal(attack?.cardId, "khong-lo-mot-mat");
  assert.equal(attack?.target?.kind, "face");
  const passed = passResponse(swung);
  const pass = passed.events?.find((event) => event.kind === "pass");
  assert.equal(pass?.ok, true);
  assert.equal(pass?.actor, 1);
});

test("concede and a rules win are different endings, and an AI match stores events once", () => {
  const store = new Memory();
  const deck = { monsters: ["khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat"], spells: ["mua-ma-thuat"] };
  let duel = createDuel(deck, "ai");
  duel = draw(duel);
  duel = endTurn(duel);
  const quit = concede(duel, 0);
  const giveUp = quit.events?.find((event) => event.kind === "concede");
  assert.equal(giveUp?.actor, 0);
  assert.equal(giveUp?.end, "concede");
  assert.equal(giveUp?.ok, true);
  assert.equal(quit.events?.some((event) => event.kind === "draw"), true);
  assert.equal(quit.winner, 1);
  const decks = openingDecks(createDuel(deck, "ai").players);
  const saved = rememberMatch({
    id: "full",
    startedAt: 5,
    endedAt: 9,
    mode: quit.mode,
    winner: quit.winner,
    decks,
    log: quit.log,
    events: quit.events,
  }, store);
  assert.equal(saved.ok && saved.added, true);
  assert.equal(rememberMatch({
    id: "full",
    startedAt: 5,
    endedAt: 9,
    mode: "ai",
    winner: 1,
    decks,
    log: quit.log,
    events: quit.events,
  }, store).added, false);
  assert.equal(loadMatchHistory(store).length, 1);
  assert.equal(loadMatchHistory(store)[0]?.events.length, quit.events?.length);

  const fallen = checkWinner({
    ...duel,
    players: [{ ...duel.players[0], hp: 0 }, duel.players[1]],
  });
  const victory = fallen.events?.find((event) => event.kind === "win");
  assert.equal(victory?.end, "damage");
  assert.equal(victory?.actor, 1);
  assert.equal(checkWinner(fallen).events?.filter((event) => event.kind === "win").length, 1);

  const raw = store.getItem(MATCH_HISTORY_KEY);
  const old = JSON.parse(raw ?? "{}") as { matches: Array<Record<string, unknown>> };
  delete old.matches[0]?.events;
  store.raw.set(MATCH_HISTORY_KEY, JSON.stringify(old));
  assert.deepEqual(loadMatchHistory(store)[0]?.events, []);
  const before = store.getItem(MATCH_HISTORY_KEY);
  const junk = rememberMatch({
    id: "bad-events",
    startedAt: 1,
    endedAt: 2,
    mode: "ai",
    winner: 0,
    decks: null,
    log: [],
    events: [{ n: 0 } as never],
  }, store);
  assert.equal(junk.ok, false);
  assert.equal(store.getItem(MATCH_HISTORY_KEY), before);
});

test("aiStep still returns a duel and does not record other modes", () => {
  const random = Math.random;
  const make = (seed: number) => {
    let x = seed;
    Math.random = () => {
      x = (x * 1664525 + 1013904223) % 4294967296;
      return x / 4294967296;
    };
    const duel = createDuel(undefined, "ai");
    const next = aiStep(endTurn(duel));
    return { live: next.live, turn: next.turn, hp: next.players.map((player) => player.hp), events: next.events?.length ?? 0 };
  };
  try {
    const first = make(7);
    const second = make(7);
    assert.equal(first.live, second.live);
    assert.equal(first.turn, second.turn);
    assert.deepEqual(first.hp, second.hp);
    assert.equal(first.events, second.events);
    assert.ok(first.events >= 1);
  } finally {
    Math.random = random;
  }
  const store = new Memory();
  for (const mode of ["hotseat", "net", "test"] as const) {
    const duel = concede(createDuel(undefined, mode), 0);
    assert.equal(duel.events?.some((event) => event.kind === "concede"), true);
    assert.equal(rememberMatch({
      id: mode,
      startedAt: 1,
      endedAt: 2,
      mode,
      winner: duel.winner,
      decks: null,
      log: duel.log,
      events: duel.events,
    }, store).ok, false);
  }
  assert.equal(loadMatchHistory(store).length, 0);
});

function trial() {
  return createDuel({ monsters: ["phu-thuy-thoi-gian"], spells: ["mua-ma-thuat"] }, "test");
}

test("fusion, wall, cover, upkeep and reel record the actor once", () => {
  FUSIONS.push({ materials: ["cuc-bong-ma-quai", "rong-con"], result: "rong-ngan-tuoi" });
  try {
    let duel = testGrant(testGrant(testGrant(trial(), 0, "rong-con", true), 0, "kiem-si-lua-thieng", true), 0, "cuc-bong-ma-quai", false);
    const host = duel.players[0].field[0];
    const index = duel.players[0].reserve.findIndex((held) => held.id === "cuc-bong-ma-quai");
    assert.ok(host && index >= 0);
    const refused = fuse(duel, index, host.uid, 1);
    assert.equal(refused.events?.find((event) => event.kind === "fuse")?.ok, false);
    const fused = fuse(duel, index, host.uid, 0);
    const fusion = fused.events?.filter((event) => event.kind === "fuse") ?? [];
    assert.equal(fusion.length, 1);
    assert.equal(fusion[0]?.ok, true);
    assert.equal(fusion[0]?.actor, 0);
    assert.equal(fusion[0]?.cardId, "cuc-bong-ma-quai");
    assert.equal(fusion[0]?.target && fusion[0].target.kind === "monster" ? fusion[0].target.uid : "", host.uid);
    assert.equal(fusion[0]?.auto, false);
  } finally {
    FUSIONS.pop();
  }

  let duel = testGrant(testGrant(testGrant(trial(), 0, "khong-lo-mot-mat", true), 1, "thien-than-be-nho", true), 1, "linh-chien-da-khong-lo", true);
  const angel = duel.players[1].field.find((mon) => mon?.cardId === "thien-than-be-nho");
  const soldier = duel.players[1].field.find((mon) => mon?.cardId === "linh-chien-da-khong-lo");
  const giant = duel.players[0].field[0];
  assert.ok(angel && soldier && giant);
  const walled = wallAlly(attackMonster(duel, giant.uid, angel.uid), soldier.uid);
  const wall = walled.events?.filter((event) => event.kind === "wall") ?? [];
  assert.equal(wall.length, 1);
  assert.equal(wall[0]?.actor, 1);
  assert.equal(wall[0]?.ok, true);
  assert.equal(wall[0]?.cardId, "linh-chien-da-khong-lo");
  assert.equal(wall[0]?.target && wall[0].target.kind === "monster" ? wall[0].target.uid : "", angel.uid);

  duel = testGrant(testGrant(testGrant(trial(), 0, "khong-lo-mot-mat", true), 1, "thien-than-be-nho", true), 1, "phu-thuy-thoi-gian", true);
  const target = duel.players[1].field.find((mon) => mon?.cardId === "thien-than-be-nho");
  const witch = duel.players[1].field.find((mon) => mon?.cardId === "phu-thuy-thoi-gian");
  const attacker = duel.players[0].field[0];
  assert.ok(target && witch && attacker);
  const covered = spiritCover(attackMonster(duel, attacker.uid, target.uid), witch.uid);
  const cover = covered.events?.filter((event) => event.kind === "cover") ?? [];
  assert.equal(cover.length, 1);
  assert.equal(cover[0]?.actor, 1);
  assert.equal(cover[0]?.cardId, "phu-thuy-thoi-gian");
  assert.equal(cover[0]?.target && cover[0].target.kind === "monster" ? cover[0].target.uid : "", target.uid);

  duel = testGrant(trial(), 0, "quai-thu-thien-su", true);
  const prayer = duel.players[0].field[0];
  assert.ok(prayer);
  const kept = answerUpkeep({ ...duel, upkeep: prayer.uid }, true);
  const upkeep = kept.events?.find((event) => event.kind === "upkeep");
  assert.equal(upkeep?.ok, true);
  assert.equal(upkeep?.actor, 0);
  assert.equal(upkeep?.cardId, "quai-thu-thien-su");
  const poor = { ...duel, upkeep: prayer.uid, players: [{ ...duel.players[0], orb: 0, flask: 0 }, duel.players[1]] as Duel["players"] };
  assert.equal(answerUpkeep(poor, true).events?.find((event) => event.kind === "upkeep")?.ok, false);

  duel = testGrant(trial(), 0, "may-quay-thuong", true);
  const machine = duel.players[0].field[0];
  assert.ok(machine);
  const scored = scoreReel(duel, machine.uid, ["atk", "def", "hp"]);
  const reels = scored.events?.filter((event) => event.kind === "reel") ?? [];
  assert.equal(reels.length, 1);
  assert.equal(reels[0]?.actor, 0);
  assert.equal(reels[0]?.cardId, "may-quay-thuong");
  assert.equal(reels[0]?.auto, false);
  const spun = settleReel(pullReel(startReel(duel, machine.uid)));
  assert.equal(spun.events?.filter((event) => event.kind === "reel").length, 1);
});

test("damage is recorded after it resolves and links back to the action", () => {
  let duel = testGrant(trial(), 0, "khong-lo-mot-mat", true);
  const giant = duel.players[0].field[0];
  assert.ok(giant);
  const swung = attackFace(duel, giant.uid);
  const attack = swung.events?.find((event) => event.kind === "attack-face");
  assert.equal(attack?.hit, null);
  const passed = passResponse(swung);
  const blows = passed.events?.filter((event) => event.kind === "result") ?? [];
  assert.equal(blows.length, 1);
  assert.equal(passed.events?.filter((event) => event.kind === "attack-face").length, 1);
  assert.equal(blows[0]?.auto, true);
  assert.equal(blows[0]?.cause, attack?.id);
  assert.equal(blows[0]?.hit?.to, "face");
  assert.equal(blows[0]?.hit?.who, 1);
  assert.equal(blows[0]?.hit?.reflect, false);
  assert.equal(blows[0]?.hit?.delayed, false);
  assert.equal(blows[0]?.hit?.dealt, 16 - passed.players[1].hp);
  assert.ok((blows[0]?.hit?.dealt ?? 0) > 0);

  duel = testGrant(testGrant(trial(), 0, "khong-lo-mot-mat", true), 1, "phu-thuy-thoi-gian", true);
  const foe = duel.players[1].field[0];
  const striker = duel.players[0].field[0];
  assert.ok(foe && striker);
  const declared = attackFace(duel, striker.uid);
  const blocked = passResponse(assignBlock(declared, foe.uid));
  const guard = blocked.events?.find((event) => event.kind === "result");
  assert.equal(blocked.events?.filter((event) => event.kind === "attack-face").length, 1);
  assert.equal(blocked.events?.filter((event) => event.kind === "result").length, 1);
  assert.equal(guard?.hit?.blocked, true);
  assert.equal(guard?.cause, declared.events?.find((event) => event.kind === "attack-face")?.id);
  assert.equal(blocked.players[1].hp, 16);

  duel = testGrant(testGrant(trial(), 0, "rong-con", true), 1, "chien-binh-rong", true);
  const breath = duel.players[0].field[0];
  const dragon = duel.players[1].field[0];
  assert.ok(breath && dragon);
  const burned = useSkill(duel, breath.uid, dragon.uid, 0, true);
  const skill = burned.events?.find((event) => event.kind === "skill");
  const first = burned.events?.find((event) => event.kind === "result");
  assert.equal(burned.events?.filter((event) => event.kind === "skill").length, 1);
  assert.equal(first?.auto, true);
  assert.equal(first?.cause, skill?.id);
  assert.equal(first?.hit?.delayed, true);
  assert.equal(first?.hit?.dealt, dragon.hp - (burned.players[1].field[0]?.hp ?? 0));
  const later = endTurn(burned);
  const tick = later.events?.find((event) => event.kind === "result" && event.cause === later.events?.find((row) => row.kind === "end-turn")?.id);
  assert.equal(tick?.auto, true);
  assert.equal(tick?.hit?.delayed, true);
  assert.ok((tick?.hit?.dealt ?? 0) > 0);
});

test("an older event without the new fields still loads", () => {
  const store = new Memory();
  store.setItem(MATCH_HISTORY_KEY, JSON.stringify({
    version: 1,
    matches: [{
      id: "old-shape",
      version: 1,
      mode: "ai",
      startedAt: 1,
      endedAt: 2,
      winner: 0,
      result: "win",
      decks: null,
      log: [],
      events: [{ n: 1, actor: 0, kind: "draw", ok: true, cardId: "a", target: null, hp: [20, 20], orb: [1, 1], stars: [0, 0], end: null }],
    }],
  }));
  const row = loadMatchHistory(store)[0];
  assert.equal(row?.events[0]?.id, "legacy-1");
  assert.equal(row?.events[0]?.cause, null);
  assert.equal(row?.events[0]?.auto, false);
  assert.equal(row?.events[0]?.hit, null);
});

test("match export keeps stored fields, and a bad book is left untouched", () => {
  const store = new Memory();
  assert.equal(exportMatchHistory(store).status, "empty");
  const saved = {
    version: 1,
    matches: [{
      id: "kept",
      version: 1,
      mode: "ai",
      startedAt: 1,
      endedAt: 2,
      winner: 0,
      result: "win",
      decks: { you: { monsters: ["a"], spells: ["b"] }, foe: { monsters: ["c"], spells: [] } },
      log: ["x"],
      events: [{ n: 1, actor: 0, kind: "summon", ok: true, cardId: "a", target: null, hp: [20, 20], orb: [1, 1], stars: [0, 0], end: null }],
    }, {
      id: "older",
      version: 1,
      mode: "ai",
      startedAt: 3,
      endedAt: 4,
      winner: 1,
      result: "loss",
      decks: null,
      log: [],
    }],
  };
  store.setItem(MATCH_HISTORY_KEY, JSON.stringify(saved));
  const before = store.getItem(MATCH_HISTORY_KEY);
  const pack = exportMatchHistory(store);
  assert.equal(pack.status, "ready");
  if (pack.status !== "ready") return;
  assert.equal(pack.count, 2);
  const parsed = JSON.parse(pack.json) as { matches: Array<{ id: string; result: string; decks: unknown; events?: unknown }> };
  assert.equal(parsed.matches[0]?.result, "win");
  assert.deepEqual(parsed.matches[0]?.decks, saved.matches[0]?.decks);
  assert.equal(Array.isArray(parsed.matches[0]?.events), true);
  assert.equal(parsed.matches[1]?.events, undefined);
  assert.equal(store.getItem(MATCH_HISTORY_KEY), before);
  store.setItem(MATCH_HISTORY_KEY, "{");
  const broken = store.getItem(MATCH_HISTORY_KEY);
  assert.equal(exportMatchHistory(store).status, "broken");
  assert.equal(store.getItem(MATCH_HISTORY_KEY), broken);
  store.setItem(MATCH_HISTORY_KEY, JSON.stringify({ version: 1, matches: [] }));
  assert.equal(exportMatchHistory(store).status, "empty");
});



