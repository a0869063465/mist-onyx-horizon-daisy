import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { learnFrom } from "./adapt.ts";
import { attackFace, attackMonster, assignBlock, castSpell, createDuel, draw, endTurn, passResponse, summon, testGrant, useSkill, type Duel } from "./duel.ts";
import { loadMatchHistory, rememberMatch, type HistoryStore, type MatchEvent } from "./match-history.ts";

class Memory implements HistoryStore {
  raw = new Map<string, string>();
  getItem(key: string) {
    return this.raw.has(key) ? this.raw.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.raw.set(key, value);
  }
}

function last(state: Duel, kind: MatchEvent["kind"]) {
  return [...(state.events ?? [])].reverse().find((event) => event.kind === kind && event.ok);
}

test("player choices record the board, the legal moves, and the move taken", () => {
  const deck = { monsters: ["khong-lo-mot-mat", "sau-non"], spells: ["mua-ma-thuat", "mua-ma-thuat"] };
  let state = createDuel(deck, "test", deck);
  state = draw(state, "monster");
  state = summon(state, 0, 0);
  const summoned = last(state, "summon");
  assert.ok(summoned?.look);
  assert.equal(summoned.look.pick.startsWith("summon:"), true);
  assert.ok(summoned.look.options.filter((option) => option.kind === "summon").length >= 2);
  assert.equal(summoned.look.options.some((option) => option.id === summoned.look?.pick), true);
  assert.equal(summoned.look.field[0].some((mon) => mon?.cardId === "khong-lo-mot-mat"), false);

  state = testGrant(state, 1, "phu-thuy-ti-hon", true);
  state = testGrant(state, 1, "sau-non", true);
  const foes = state.players[1].field.filter((mon) => mon);
  assert.equal(foes.length, 2);
  const attacker = state.players[0].field.find((mon) => mon);
  assert.ok(attacker);
  state = attackMonster(state, attacker.uid, foes[0]!.uid);
  const swung = last(state, "attack-monster");
  assert.equal(swung?.look?.pick, `attack-monster:${attacker.uid}:${foes[0]!.uid}`);
  assert.equal(swung?.look?.options.filter((option) => option.kind === "attack-monster").length, 2);

  state = passResponse(state);
  for (let n = 0; state.players[1].field.filter((mon) => mon && mon.hp > 0).length < 2 && n < 3; n += 1) {
    state = testGrant(state, 1, "phu-thuy-ti-hon", true);
  }
  state = testGrant(state, 0, "phu-thuy-ti-hon", true);
  const witch = state.players[0].field.find((mon) => mon?.cardId === "phu-thuy-ti-hon");
  assert.ok(witch);
  const liveFoes = state.players[1].field.filter((mon) => mon);
  state = useSkill(state, witch.uid, liveFoes[0]!.uid, 0);
  const skill = last(state, "skill");
  assert.ok(skill?.look);
  assert.equal(skill.look.options.filter((option) => option.kind === "skill" && option.target?.kind === "monster").length >= 2, true);
  assert.equal(skill.look.pick.includes(liveFoes[0]!.uid), true);

  state = testGrant(state, 0, "mua-ma-thuat", false);
  const handIndex = state.players[0].hand.lastIndexOf("mua-ma-thuat");
  state = castSpell(state, handIndex, null);
  const spell = last(state, "spell");
  assert.equal(spell?.cardId, "mua-ma-thuat");
  assert.equal(spell?.look?.options.some((option) => option.kind === "spell" && option.cardId === "mua-ma-thuat"), true);
  assert.equal(spell?.look?.pick.includes("mua-ma-thuat"), true);

  let blocking = createDuel(deck, "test", deck);
  blocking = testGrant(blocking, 0, "khong-lo-mot-mat", true);
  blocking = testGrant(blocking, 0, "sau-non", true);
  blocking = testGrant(blocking, 1, "khong-lo-mot-mat", true);
  blocking = { ...blocking, turn: 1 };
  const foeAttacker = blocking.players[1].field.find((mon) => mon);
  assert.ok(foeAttacker);
  const threatened = attackFace(blocking, foeAttacker.uid);
  const blocker = threatened.players[0].field.find((mon) => mon && mon.cardId === "khong-lo-mot-mat");
  assert.ok(blocker);
  const blocked = assignBlock(threatened, blocker.uid, false);
  const block = last(blocked, "block");
  assert.equal(block?.actor, 0);
  assert.equal(block?.look?.options.some((option) => option.kind === "block" && option.cardId === "khong-lo-mot-mat"), true);
  assert.equal(block?.look?.options.some((option) => option.kind === "pass"), true);
  assert.equal(block?.look?.pick, `block:${blocker.uid}`);
  const passed = passResponse(threatened);
  const letGo = last(passed, "pass");
  assert.equal(letGo?.look?.pick, "pass");
  assert.equal(letGo?.look?.options.some((option) => option.kind === "block"), true);

  const ended = endTurn(state.step === "main" ? state : passResponse(state));
  const turn = last(ended, "end-turn");
  assert.equal(turn?.actor, 0);
  assert.equal(turn?.look?.pick, "end-turn");
  assert.equal(turn?.look?.options.some((option) => option.id === "end-turn"), true);

  const ai = endTurn({ ...createDuel(deck, "test", deck), turn: 1 });
  assert.equal(last(ai, "end-turn")?.actor, 1);
  assert.equal(last(ai, "end-turn")?.look, undefined);

  const store = new Memory();
  const kept = rememberMatch(
    { id: "look-round", startedAt: 1, endedAt: 2, mode: "ai", winner: 0, decks: null, log: ended.log, events: ended.events ?? [] },
    store,
  );
  assert.equal(kept.ok, true);
  const back = loadMatchHistory(store)[0]?.events.find((event) => event.kind === "summon" && event.ok);
  assert.equal(back?.look?.pick, summoned.look?.pick);
  assert.equal(back?.look?.options.some((option) => option.id === back.look?.pick), true);
});

test("the old 10-match history still loads and the learned weights stay the same", () => {
  const raw = JSON.parse(readFileSync("attachments/lich-su-van-dau (2).json", "utf8")) as { matches: Array<Record<string, unknown>> };
  assert.equal(raw.matches.length, 10);
  const before = learnFrom(raw.matches);
  const store = new Memory();
  for (const match of raw.matches) {
    const saved = rememberMatch(
      {
        id: String(match.id),
        startedAt: Number(match.startedAt),
        endedAt: Number(match.endedAt),
        mode: "ai",
        winner: match.winner as 0 | 1 | null,
        decks: (match.decks as null) ?? null,
        log: match.log as string[],
        events: match.events as MatchEvent[],
      },
      store,
    );
    assert.equal(saved.ok, true);
  }
  const loaded = loadMatchHistory(store);
  assert.equal(loaded.length, 10);
  assert.equal(loaded.every((match) => match.events.every((event) => event.look === undefined)), true);
  const after = learnFrom(loaded);
  assert.deepEqual(after.counts, before.counts);
  assert.equal(after.face, before.face);
  assert.equal(after.block, before.block);
  assert.equal(after.spend, before.spend);
  assert.equal(after.summon, before.summon);
  const broken = structuredClone(raw.matches[0]) as { events: Array<Record<string, unknown>>; id: string; startedAt: number; endedAt: number; winner: 0 | 1 | null; decks: null; log: string[] };
  broken.events[0] = { ...broken.events[0], look: { bad: true } };
  const dirty = new Memory();
  const kept = rememberMatch(
    { id: `${broken.id}-dirty`, startedAt: broken.startedAt, endedAt: broken.endedAt, mode: "ai", winner: broken.winner, decks: broken.decks, log: broken.log, events: broken.events as MatchEvent[] },
    dirty,
  );
  assert.equal(kept.ok, true);
  const row = loadMatchHistory(dirty)[0];
  assert.ok(row);
  assert.equal(row.events[0]?.look, undefined);
  assert.equal(row.events.length, (raw.matches[0].events as unknown[]).length);
});
