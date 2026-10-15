import assert from "node:assert/strict";
import test from "node:test";
import { attackMonster, castSpell, createDuel, endTurn, testGrant } from "./duel.ts";

test("guard mirror blocks the attack it is played against", () => {
  let duel = createDuel({
    monsters: ["khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat"],
    spells: ["guong-phong-ho", "guong-phong-ho"],
  }, "test");
  duel = testGrant(duel, 0, "khong-lo-mot-mat", true);
  duel = endTurn(duel);
  duel = testGrant(duel, 1, "khong-lo-mot-mat", true);
  const bump = (player: (typeof duel.players)[number]) => ({
    ...player,
    orb: 3,
    field: player.field.map((mon) => (mon ? { ...mon, hp: 8, maxHp: 8, atk: 4, def: 2, mdef: 2 } : mon)),
  });
  duel = {
    ...duel,
    turn: 1,
    step: "main",
    gemCap: null,
    gemWarn: null,
    upkeep: null,
    players: [bump(duel.players[0]), bump(duel.players[1])],
  };
  duel = {
    ...duel,
    players: [{ ...duel.players[0], hand: ["guong-phong-ho"], tolls: [false] }, duel.players[1]],
  };
  const defender = duel.players[0].field.find((mon) => mon);
  const attacker = duel.players[1].field.find((mon) => mon);
  assert.ok(defender && attacker);
  const attacked = attackMonster(duel, attacker.uid, defender.uid);
  assert.equal(attacked.step, "respond");
  const reflected = castSpell(attacked, 0, null);
  const robbed = reflected.players[1].field.find((mon) => mon?.uid === attacker.uid);
  assert.equal(reflected.pending, null);
  assert.equal(reflected.step, "main");
  assert.ok(robbed);
  assert.equal(robbed.atk, 2);
  assert.equal(robbed.def, 1);
  assert.equal(robbed.mdef, 1);
  assert.equal(robbed.hp, 4);
  assert.equal(robbed.glass, true);
  assert.equal(robbed.dim, true);
  assert.equal(reflected.players[0].mirror, 3);
  assert.equal(reflected.players[0].field.find((mon) => mon?.uid === defender.uid)?.hp, 8);
  assert.equal(reflected.players[0].hand.includes("guong-phong-ho"), false);
  assert.match(reflected.live, /Gương phòng hộ chặn giáp lá cà/);
});
