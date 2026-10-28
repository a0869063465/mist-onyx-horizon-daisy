// Luật vòng/token/6 ô (chủ game 28/10): chạy duel.ts thật qua Vite SSR. Chạy từ thư mục repo: node scripts/round-rules.mjs
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(`${process.cwd()}/package.json`);
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const D = await server.ssrLoadModule("/src/lib/duel.ts");

const DECK = { monsters: ["khong-lo-mot-mat", "may-chem", "rong-con", "khong-lo-mot-mat", "may-chem"], spells: ["hap-thu-ma-phap", "vong-xoay-bao-ho"] };

/** A test duel with the given monsters at given slots: mine/theirs = { slot: [cardId, stats] }. */
function board(mine, theirs, extra = {}) {
  let s = D.createDuel(DECK, "test");
  for (const [side, spots] of [[0, mine], [1, theirs]]) {
    const field = Array(6).fill(null);
    for (const [slot, [id, stats]] of Object.entries(spots)) {
      s = D.testGrant({ ...s, players: s.players.map((p, i) => (i === side ? { ...p, field: Array(6).fill(null) } : p)) }, side, id, true);
      const mon = s.players[side].field[0];
      field[Number(slot)] = { ...mon, dim: false, ...(Number(slot) >= 3 ? { row: "back" } : {}), ...(stats ?? {}) };
    }
    s = { ...s, players: s.players.map((p, i) => (i === side ? { ...p, field } : p)) };
  }
  s = { ...s, turn: 0, round: 0, skipped: [false, false], step: "main", pending: null, hold: null, counterAsk: null, ...extra };
  // patch() fixes rows; a no-op summon-free nudge is enough: run through endTurn-less path by a fake patch via testGrant of nothing.
  return s;
}
const at = (s, side, slot) => s.players[side].field[slot];
const uid = (s, side, slot) => at(s, side, slot).uid;
const rows = (s) => s.players.map((p) => p.field.map((m) => (m ? `${m.cardId}${m.row === "back" ? "(sau)" : ""}` : "-")).join(" "));

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("triệu hồi nhường quyền, không thêm mana, vòng giữ nguyên; rút bài không nhường", () => {
  let s = board({}, {});
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0, stars: 4 })) };
  s = D.testGrant(s, 0, "may-chem", false);
  const index = s.players[0].reserve.findIndex((p) => p.id === "may-chem");
  const drawn = D.draw(s, "spell");
  assert.equal(drawn.turn, 0, "rút bài không nhường quyền");
  const summoned = D.summon(s, index, 0);
  assert.equal(summoned.turn, 1);
  assert.equal(summoned.round, 0);
  assert.equal(summoned.players[1].orb, 3);
  const foe = D.testGrant(summoned, 1, "may-chem", false);
  const theirs = D.summon(foe, foe.players[1].reserve.findIndex((p) => p.id === "may-chem"), 0);
  assert.ok(theirs.players[1].field[0], "người không giữ token vẫn triệu hồi được");
  assert.equal(theirs.turn, 0);
  assert.match(D.summon(D.testGrant(theirs, 0, "may-chem", false), theirs.players[0].reserve.length, 1).live, /Mỗi vòng chỉ triệu hồi 1 lần/);
});

test("lượt đầu được tấn công; đánh xong quyền sang đối thủ, vòng giữ nguyên", () => {
  let s = board({ 0: ["khong-lo-mot-mat"] }, {}, { opening: true });
  const swung = D.attackFace(s, uid(s, 0, 0));
  assert.equal(swung.pending?.kind, "face");
  const done = D.passResponse(swung);
  assert.equal(done.turn, 1);
  assert.equal(done.round, 0);
  assert.ok(done.players[1].hp < s.players[1].hp);
});

test("người không giữ token không tấn công được; cả hai bỏ lượt thì hết vòng, cả hai +1 mana", () => {
  let s = board({ 0: ["khong-lo-mot-mat"] }, { 0: ["khong-lo-mot-mat"] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 0, flask: 0 })) };
  const passed = D.endTurn(s);
  assert.equal(passed.turn, 1);
  assert.equal(passed.round, 0);
  const stolen = D.attackFace(passed, uid(passed, 1, 0));
  assert.notEqual(stolen.pending?.kind, "face");
  assert.match(stolen.live, /Chưa đến vòng/);
  const closed = D.endTurn(passed);
  assert.equal(closed.round, 1, "token sang người kia");
  assert.equal(closed.turn, 1);
  assert.equal(closed.players[0].orb, 1);
  assert.equal(closed.players[1].orb, 1);
  assert.equal(D.attackFace(closed, uid(closed, 1, 0)).pending?.kind, "face");
});

test("bỏ lượt rồi đối thủ hành động thì đếm bỏ lượt lại từ đầu", () => {
  let s = board({ 0: ["khong-lo-mot-mat"] }, {});
  s = D.testGrant(s, 1, "may-chem", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, stars: 4 })) };
  const passed = D.endTurn(s);
  const summoned = D.summon(passed, passed.players[1].reserve.findIndex((p) => p.id === "may-chem"), 0);
  assert.equal(summoned.turn, 0);
  assert.deepEqual(summoned.skipped, [false, false]);
  const again = D.endTurn(summoned);
  assert.equal(again.round, 0, "một lần bỏ lượt sau hành động chưa hết vòng");
});

test("mỗi quái một lần mỗi vòng, quái khác vẫn đánh được", () => {
  let s = board({ 0: ["khong-lo-mot-mat"], 1: ["khong-lo-mot-mat"] }, {});
  const first = D.passResponse(D.attackFace(s, uid(s, 0, 0)));
  const back = D.endTurn(first);
  assert.equal(back.turn, 0);
  assert.equal(back.round, 0);
  assert.notEqual(D.attackFace(back, uid(back, 0, 0)).pending?.kind, "face");
  assert.equal(D.attackFace(back, uid(back, 0, 1)).pending?.kind, "face");
});

test("hàng trước đánh hàng trước: bên bị đánh còn sống được Trả đòn riêng", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10, maxHp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 20, maxHp: 20 }] });
  const open = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(at(open, 0, 0).hp, 10, "kẻ đánh chưa bị trừ máu");
  assert.ok(at(open, 1, 0).hp < 20);
  assert.equal(open.counterAsk?.uid, uid(s, 1, 0));
  assert.equal(open.turn, 1);
  assert.match(D.endTurn(open).live, /Trả đòn/, "không bỏ lượt được khi chưa trả đòn");
  const hit = D.pickCounter(open, "phys");
  assert.equal(at(hit, 0, 0).hp, 10 - D.liveAtk(at(open, 1, 0)));
  assert.equal(hit.counterAsk, null);
  assert.equal(hit.turn, 1, "trả đòn xong quyền ở bên vừa trả");
});

test("hàng trước giết chết thì không có Trả đòn", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 9, def: 0, hp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 2 }] });
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(done.counterAsk ?? null, null);
  assert.equal(at(done, 0, 0).hp, 10);
  assert.equal(done.turn, 1);
});

test("hàng sau đánh chớp nhoáng: không bị trả đòn", () => {
  let s = board({ 3: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 20 }] });
  assert.equal(at(D.endTurn(D.endTurn(s)), 0, 3)?.row ?? at(s, 0, 3).row, "back");
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 3), uid(s, 1, 0)));
  assert.equal(done.counterAsk ?? null, null);
  assert.equal(at(done, 0, 3).hp, 10);
  assert.ok(at(done, 1, 0).hp < 20);
});

test("chặn: hàng trước chặn cho hàng sau; đánh hàng trước thì không ai chặn hộ; hàng sau không chặn", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 2, def: 0, hp: 9 }], 1: ["may-chem", { hp: 9 }], 3: ["may-chem", { hp: 9 }], 4: ["may-chem", { hp: 9 }] });
  s = D.endTurn(D.endTurn(s));
  s = { ...s, turn: 0, round: 0 };
  const onBack = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 3));
  assert.equal(onBack.pending?.kind, "melee");
  assert.match(onBack.live, /Có thể chặn/);
  const blocked = D.assignBlock(onBack, uid(s, 1, 0));
  assert.equal(blocked.hold?.blocker, uid(s, 1, 0));
  assert.match(D.assignBlock(onBack, uid(s, 1, 4)).live, /hàng sau không chặn/i);
  const traded = D.passResponse(blocked);
  assert.equal(at(traded, 1, 3).hp, 9, "quái hàng sau không bị đánh");
  assert.equal(traded.counterAsk?.uid, uid(s, 1, 0), "quái chặn còn sống được Trả đòn");
  const onFront = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 1));
  assert.match(D.assignBlock(onFront, uid(s, 1, 0)).live, /hàng trước thì không ai chặn hộ/);
});

test("đánh người chơi: hàng trước chặn, chặn xong được Trả đòn", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 2, def: 0, hp: 9 }] });
  const swung = D.attackFace(s, uid(s, 0, 0));
  const blocked = D.assignBlock(swung, uid(s, 1, 0));
  const done = D.passResponse(blocked);
  assert.equal(done.players[1].hp, s.players[1].hp);
  assert.equal(done.counterAsk?.uid, uid(s, 1, 0));
});

test("kỹ năng gây sát thương chỉ người giữ token dùng; kỹ năng tự do vẫn dùng", () => {
  let s = board({ 0: ["rong-con"] }, { 0: ["khong-lo-mot-mat", { hp: 20 }] }, { round: 1 });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3 })) };
  const denied = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0);
  assert.match(denied.live, /Chưa đến vòng/);
  const allowed = D.declareSkill({ ...s, round: 0 }, uid(s, 0, 0), uid(s, 1, 0), 0);
  assert.equal(allowed.step, "respond");
  const done = D.passResponse(allowed);
  assert.equal(done.turn, 1, "kỹ năng xong quyền sang đối thủ");
  assert.ok(at(done, 0, 0).used);
});

test("Vòng xoáy bảo hộ chặn đòn và kết thúc vòng", () => {
  let s = board({ 0: ["khong-lo-mot-mat"] }, {});
  s = D.testGrant(s, 1, "vong-xoay-bao-ho", false);
  const swung = D.attackFace(s, uid(s, 0, 0));
  const cast = D.castSpell(swung, swung.players[1].hand.indexOf("vong-xoay-bao-ho"));
  assert.equal(cast.round, 1);
  assert.equal(cast.players[1].hp, s.players[1].hp);
});

test("Vs Máy: máy được Trả đòn thì tự trả", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 20 }] }, { mode: "ai" });
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(done.counterAsk, null);
  assert.ok(at(done, 0, 0).hp < 10);
});

test("Trả đòn bằng kỹ năng (Rồng con dùng Hơi thở rồng), xong quyền ở bên vừa trả", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 2, def: 0, mdef: 0, hp: 20, maxHp: 20 }] }, { 0: ["rong-con", { hp: 20, maxHp: 20, def: 0 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3 })) };
  const open = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(open.counterAsk?.uid, uid(s, 1, 0));
  const declared = D.declareSkill(open, uid(s, 1, 0), uid(s, 0, 0), 0);
  assert.equal(declared.step, "respond", declared.live);
  assert.equal(declared.counterAsk, null);
  const done = D.passResponse(declared);
  assert.ok(at(done, 0, 0).hp < 20, "kẻ đánh trúng hơi thở");
  assert.equal(done.counterAsk ?? null, null, "không trả đòn ngược lại");
  assert.equal(done.turn, 1);
  assert.equal(done.countering ?? null, null);
});

test("kỹ năng nhắm quái hàng sau: hàng trước chặn thay", () => {
  let s = board({ 0: ["rong-con"] }, { 0: ["khong-lo-mot-mat", { hp: 20, maxHp: 20 }], 3: ["may-chem", { hp: 9 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3 })) };
  const declared = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 3), 0);
  assert.equal(declared.pending?.kind, "beam");
  const blocked = D.assignBlock(declared, uid(s, 1, 0));
  assert.equal(blocked.hold?.blocker, uid(s, 1, 0), blocked.live);
  const done = D.passResponse(blocked);
  assert.equal(at(done, 1, 3).hp, 9);
  assert.ok(at(done, 1, 0).hp < 20);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name}\n     ${error.message.split("\n").join("\n     ")}`);
  }
}
console.log(`${tests.length - failed}/${tests.length} đạt`);
await server.close();
process.exit(failed ? 1 : 0);
