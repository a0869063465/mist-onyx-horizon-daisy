// Luật vòng/token/6 ô (chủ game 28/10): chạy duel.ts thật qua Vite SSR. Chạy từ thư mục repo: node scripts/round-rules.mjs
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(`${process.cwd()}/package.json`);
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const D = await server.ssrLoadModule("/src/lib/duel.ts");
const C = await server.ssrLoadModule("/src/lib/catalog.ts");
const B = await server.ssrLoadModule("/src/lib/brain.ts");
const P = await server.ssrLoadModule("/src/lib/preview.ts");

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

test("quái hàng sau bị đánh thẳng thì không phản đòn", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10 }] }, { 3: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 20 }] });
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 3)));
  assert.equal(at(done, 0, 0).hp, 10);
  assert.ok(at(done, 1, 3).hp < 20);
  assert.equal(done.counterAsk ?? null, null);
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

test("Gương phòng hộ nằm ngang tự dựng khi bị đánh: đối thủ OK rồi chủ gương OK mới chặn, cướp nửa chỉ số, không tốn lượt", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4, def: 2, mdef: 2, hp: 10, maxHp: 10 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20 }] });
  s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, mirror: 2 } : p)) };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(swung.hold?.mirror, "up", swung.live);
  assert.equal(swung.hold?.priority, 0, "gương dựng là hành động của chủ gương, quyền sang bên đánh");
  const set = D.passResponse(swung);
  assert.equal(set.step, "respond", "chưa nổ");
  assert.equal(set.hold?.mirror, "set");
  assert.equal(set.hold?.priority, 1);
  const done = D.passResponse(set);
  assert.equal(done.step, "main");
  assert.equal(at(done, 1, 0).hp, 20, "quái bị đánh không mất máu");
  assert.equal(at(done, 0, 0).atk, 2, "kẻ đánh còn nửa công");
  assert.equal(done.players[1].mirror, 2, "chặn không tốn lượt");
  // Đánh vào người chơi cũng bị chặn; kỹ năng thì không.
  const face = D.passResponse(D.passResponse(D.attackFace(s, uid(s, 0, 0))));
  assert.equal(face.players[1].hp, s.players[1].hp);
});

test("Gương phòng hộ dùng từ tay lúc bị đánh: dựng lên, đặt 3 lượt, chuỗi qua 2 lần OK", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4, def: 2, mdef: 2, hp: 10, maxHp: 10 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20 }] });
  s = D.testGrant(s, 1, "guong-phong-ho", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(swung.hold?.priority, 1);
  const cast = D.castSpell(swung, swung.players[1].hand.indexOf("guong-phong-ho"));
  assert.equal(cast.players[1].mirror, 3, cast.live);
  assert.equal(cast.hold?.mirror, "up");
  assert.equal(cast.hold?.priority, 0);
  const done = D.passResponse(D.passResponse(cast));
  assert.equal(at(done, 1, 0).hp, 20);
  assert.equal(at(done, 0, 0).atk, 2);
});

test("Phục kích chặn kỹ năng gây sát thương, quái chọn đánh trả kẻ dùng; không dùng được với đòn đánh thường", () => {
  let s = board({ 0: ["rong-con", { hp: 20, maxHp: 20, def: 0, mdef: 0 }], 1: ["khong-lo-mot-mat", { atk: 3 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20, def: 0, mdef: 0, atk: 3 }] });
  s = D.testGrant(s, 1, "phuc-kich", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const breath = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0);
  assert.equal(breath.step, "respond", breath.live);
  const waiting = D.castSpell(breath, breath.players[1].hand.indexOf("phuc-kich"), uid(s, 1, 0));
  assert.equal(waiting.pending?.kind, "beam", "Phục kích chờ trong chuỗi, chưa nổ");
  assert.deepEqual(waiting.hold?.ambush, { ally: uid(s, 1, 0), foe: uid(s, 0, 0) }, waiting.live);
  assert.equal(waiting.hold?.priority, 0, "quyền sang bên dùng kỹ năng");
  assert.equal(at(waiting, 0, 0).hp, 20);
  const cast = D.passResponse(waiting);
  assert.equal(cast.pending ?? null, null, cast.live);
  assert.equal(at(cast, 1, 0).hp, 20, "kỹ năng bị chặn");
  assert.ok(at(cast, 0, 0).hp < 20, "kẻ dùng kỹ năng bị đánh trả");
  const swung = D.attackMonster(s, uid(s, 0, 1), uid(s, 1, 0));
  const refused = D.castSpell(swung, swung.players[1].hand.indexOf("phuc-kich"), uid(s, 1, 0));
  assert.equal(refused.pending?.kind, "melee", "đòn đánh thường không bị Phục kích chặn");
});

test("Cỗ máy thời gian chờ trong chuỗi, chỉ lùi quái khi chuỗi nổ", () => {
  let s = board({ 0: ["rong-con", { hp: 20, maxHp: 20, def: 0, mdef: 0 }] }, { 0: ["khong-lo-mot-mat", { hp: 20, maxHp: 20, def: 0, mdef: 0 }] });
  s = D.testGrant(s, 1, "co-may-thoi-gian", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const ally = uid(s, 1, 0);
  s = { ...s, born: { [ally]: { mon: { ...at(s, 1, 0), def: 5, mdef: 5 }, slot: 0 } } };
  const breath = D.declareSkill(s, uid(s, 0, 0), ally, 0);
  assert.equal(breath.step, "respond", breath.live);
  const waiting = D.castSpell(breath, breath.players[1].hand.indexOf("co-may-thoi-gian"), ally);
  assert.deepEqual(waiting.hold?.rewind, { ally }, waiting.live);
  assert.equal(at(waiting, 1, 0).def, 0, "chưa lùi khi còn chờ");
  assert.equal(waiting.hold?.priority, 0, "quyền sang bên dùng kỹ năng");
  const landed = D.passResponse(waiting);
  assert.equal(at(landed, 1, 0).def, 5, landed.live);
  assert.ok(!landed.hold?.rewind, "đã lùi xong");
});

test("Giáp cơ khí buff và so công ngay lúc dùng: đủ công thì phản, không đủ thì kỹ năng vẫn vào", () => {
  const make = (atk) => {
    let s = board({ 0: ["rong-con", { hp: 20, maxHp: 20, def: 0, mdef: 0 }] }, { 0: ["khong-lo-mot-mat", { hp: 20, maxHp: 20, def: 0, mdef: 0, atk }] });
    s = D.testGrant(s, 1, "giap-co-khi", false);
    s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
    const breath = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0);
    return D.castSpell(breath, breath.players[1].hand.indexOf("giap-co-khi"), uid(s, 1, 0));
  };
  const strong = make(10);
  assert.equal(at(strong, 1, 0).atk, 12, "tăng ngay lúc dùng");
  assert.equal(strong.pending?.back, true, "đủ công: phản ngay");
  const weak = make(0);
  assert.equal(at(weak, 1, 0).atk, 2);
  assert.ok(!weak.pending?.back, "không đủ công: không phản");
});

test("Phục kích chặn cả kỹ năng nhiều mục tiêu (Con nước lớn tàn phá)", () => {
  const tough = { hp: 40, maxHp: 40, def: 0, mdef: 0 };
  let s = board({ 1: ["trai-tim-hai-long", { hp: 30, maxHp: 30, def: 0 }] }, { 0: ["khong-lo-mot-mat", tough], 1: ["may-chem", tough], 3: ["kazura", tough] });
  s = D.testGrant(s, 1, "phuc-kich", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 1), uid(s, 1, 3), 1));
  const { sure } = spreadWith(staged, (row) => row.length >= 2);
  const waiting = D.castSpell(sure, sure.players[1].hand.indexOf("phuc-kich"), uid(s, 1, 1));
  assert.ok(waiting.hold?.ambush, waiting.live);
  const done = D.passResponse(waiting);
  for (const slot of [0, 1, 3]) assert.equal(at(done, 1, slot).hp, 40, "không nhánh nào trúng");
  assert.ok(at(done, 0, 1).hp < 30, "kẻ dùng kỹ năng bị đánh trả");
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

test("hàng chờ: đòn đang xếp chờ xác nhận, đối thủ chưa chặn được; tick xong mới chặn và giải quyết", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 2, def: 0, hp: 9 }] });
  const staged = D.stageHold(D.attackFace(s, uid(s, 0, 0)));
  assert.equal(staged.hold?.stage, true);
  assert.equal(D.passResponse(staged), staged, "chưa xác nhận thì chưa giải quyết");
  assert.equal(D.assignBlock(staged, uid(s, 1, 0)), staged, "chưa xác nhận thì đối thủ chưa chặn");
  const sure = D.confirmStage(staged);
  assert.equal(sure.hold?.stage, undefined);
  const blocked = D.assignBlock(sure, uid(s, 1, 0));
  assert.equal(blocked.hold?.blocker, uid(s, 1, 0));
  assert.equal(blocked.hold?.seed, sure.hold?.seed, "chặn giữ nguyên mầm quay");
  assert.equal(D.passResponse(blocked).players[1].hp, s.players[1].hp);
});

test("hàng chờ: hành động ngẫu nhiên quay lúc xác nhận, cùng mầm thì cùng kết quả", () => {
  let s = board({ 0: ["may-nem-bom-hinh-nhen"] }, { 0: ["khong-lo-mot-mat", { hp: 30, maxHp: 30, def: 0, mdef: 0 }], 1: ["khong-lo-mot-mat", { hp: 30, maxHp: 30, def: 0, mdef: 0 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0));
  assert.equal(staged.step, "respond");
  const outcome = (seed) => {
    const done = D.passResponse(D.confirmStage(staged, seed));
    return `${done.players[1].field.map((m) => m?.hp ?? 0).join(",")}|${done.players[1].hp}`;
  };
  assert.equal(outcome(5), outcome(5));
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(outcome)).size > 1, "mầm khác thì có lúc khác");
});

/** A skill that lands on several, waiting to resolve, confirmed with the first seed where `want(hits)` holds. */
function spreadWith(staged, want) {
  for (let seed = 1; seed < 400; seed += 1) {
    const sure = D.confirmStage(staged, seed);
    const hits = D.spreadHits(sure);
    if (hits && want(hits)) return { sure, hits };
  }
  throw new Error("không tìm được mầm phù hợp");
}

test("chặn nhiều nhánh: Súng phóng lựu vào người chơi, quái hàng trước không bị trúng chặn nhánh vào người chơi", () => {
  const tough = { hp: 40, maxHp: 40, def: 0, mdef: 0 };
  let s = board({ 0: ["may-nem-bom-hinh-nhen"] }, { 0: ["khong-lo-mot-mat", tough], 1: ["may-chem", tough], 3: ["kazura", tough] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5, hp: 30 })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 0), null, 0));
  const guard = uid(s, 1, 1);
  const { sure } = spreadWith(staged, (hits) => hits.includes("face:1") && !hits.includes(guard) && !hits.includes(uid(s, 1, 3)) && hits.length >= 2);
  assert.match(D.assignCover(sure, guard, uid(s, 1, 3)).live, /Nhánh này không trúng ai|Quái/, "nhánh không trúng thì không chặn");
  const covered = D.assignCover(sure, guard, "face:1");
  assert.deepEqual(covered.hold?.covers, [{ blocker: guard, target: "face:1" }], covered.live);
  assert.match(D.assignCover({ ...covered, hold: { ...covered.hold, priority: 1 } }, guard, "face:1").live, /một nhánh|đã có/);
  const open = D.passResponse(D.passResponse({ ...covered, hold: { ...covered.hold, priority: 0 } }));
  const done = open.counterAsk ? D.pickCounter(open, "phys") : open;
  assert.equal(done.players[1].hp, 30, "người chơi không mất máu");
  assert.ok(at(done, 1, 1).hp < 40, "quái chặn chịu đòn thay");
});

test("chặn nhiều nhánh: Con nước lớn tàn phá, quái chặn chịu cả sát thương lẫn ướt; quái đang bị nhắm không chặn hộ", () => {
  const tough = { hp: 40, maxHp: 40, def: 0, mdef: 0 };
  let s = board({ 1: ["trai-tim-hai-long"] }, { 0: ["khong-lo-mot-mat", tough], 1: ["may-chem", tough], 3: ["kazura", tough] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 1), uid(s, 1, 3), 1));
  assert.equal(staged.pending?.kind, "beam", staged.live);
  const { sure, hits } = spreadWith(staged, (row) => row.includes(uid(s, 1, 3)) && row.includes(uid(s, 1, 0)));
  assert.equal(hits.length, 2);
  assert.match(D.assignCover(sure, uid(s, 1, 0), uid(s, 1, 3)).live, /đang bị nhắm/);
  const covered = D.assignCover(sure, uid(s, 1, 1), uid(s, 1, 3));
  assert.equal(covered.hold?.covers?.length, 1, covered.live);
  let done = D.passResponse(covered);
  while (done.counterAsk) done = D.pickCounter(done, "phys");
  assert.equal(at(done, 1, 3).hp, 40, "Kazura không mất máu");
  assert.ok(at(done, 1, 1).hp < 40 && (at(done, 1, 1).wet ?? 0) > 0, "Máy chém chịu đòn và bị ướt");
  assert.ok(at(done, 1, 0).hp < 40, "nhánh kia vẫn trúng");
});

test("chặn nhiều nhánh: máy cho quái hàng trước không bị trúng chặn nhánh vào quái hàng sau sắp chết; con mắt tính cả quái chặn", () => {
  const tough = { hp: 40, maxHp: 40, def: 0, mdef: 0 };
  let s = board({ 1: ["trai-tim-hai-long"] }, { 0: ["khong-lo-mot-mat", tough], 1: ["may-chem", tough], 3: ["kazura", { hp: 2, maxHp: 2, def: 0, mdef: 0 }] }, { mode: "ai" });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5, hand: [], reserve: [], tolls: [] })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 1), uid(s, 1, 3), 1));
  const { sure } = spreadWith(staged, (row) => row.includes(uid(s, 1, 3)) && row.includes(uid(s, 1, 0)) && !row.includes(uid(s, 1, 1)));
  assert.equal(sure.hold?.priority, 1, sure.live);
  const act = B.brainChoose(sure);
  assert.deepEqual(act, ["cover", uid(s, 1, 1), uid(s, 1, 3)], JSON.stringify(act));
  const covered = B.runAct(sure, act);
  assert.equal(covered.hold?.covers?.length, 1, covered.live);
  const [seen] = P.queueRuns(covered, "answer", 1);
  assert.equal(at(seen, 1, 3)?.hp, 2, "xem trước: Kazura không mất máu");
  assert.ok(at(seen, 1, 1).hp < 40, "xem trước: Máy chém chịu đòn thay");
  // Máy chặn tối đa 1 nhánh.
  assert.notEqual(B.brainChoose({ ...covered, hold: { ...covered.hold, priority: 1 } })?.[0], "cover");
});

test("trả đòn kỹ năng nhiều mục tiêu: lần lượt từ trái sang phải, mỗi lần một quái", () => {
  const tough = { hp: 40, maxHp: 40, def: 0, mdef: 0, atk: 1 };
  let s = board({ 1: ["trai-tim-hai-long", { hp: 30, maxHp: 30, def: 0 }] }, { 0: ["khong-lo-mot-mat", tough], 1: ["may-chem", tough] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 1), uid(s, 1, 1), 1));
  const { sure } = spreadWith(staged, (hits) => hits.length === 2);
  const first = D.passResponse(sure);
  assert.equal(first.counterAsk?.uid, uid(s, 1, 0), "quái bên trái trả đòn trước");
  const second = D.pickCounter(first, "phys");
  assert.equal(second.counterAsk?.uid, uid(s, 1, 1), "rồi tới quái bên phải");
  const done = D.pickCounter(second, "phys");
  assert.equal(done.counterAsk ?? null, null);
  assert.equal(at(done, 0, 1).hp, 28, "trúng 2 lần trả đòn");
});

test("trả đòn kỹ năng nhiều mục tiêu: kẻ phát động chết thì các lượt trả đòn còn lại huỷ", () => {
  const tough = { hp: 40, maxHp: 40, def: 0, mdef: 0, atk: 30 };
  let s = board({ 1: ["trai-tim-hai-long", { hp: 10, maxHp: 10, def: 0 }] }, { 0: ["khong-lo-mot-mat", tough], 1: ["may-chem", tough] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 1), uid(s, 1, 1), 1));
  const { sure } = spreadWith(staged, (hits) => hits.length === 2);
  const first = D.passResponse(sure);
  const done = D.pickCounter(first, "phys");
  assert.equal(done.counterAsk ?? null, null, "không còn ai để trả đòn");
});

test("skill chậm: kỹ năng diện rộng không dùng để Trả đòn", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 2, def: 0, hp: 20, maxHp: 20 }] }, { 0: ["trai-tim-hai-long", { hp: 20, maxHp: 20, def: 0 }], 1: ["may-chem"] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const open = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(open.counterAsk?.uid, uid(s, 1, 0));
  assert.equal(D.slowSkill(open, uid(s, 1, 0), 1), true);
  assert.equal(D.slowSkill(open, uid(s, 1, 0), 0), false);
  assert.match(D.declareSkill(open, uid(s, 1, 0), uid(s, 0, 0), 1).live, /diện rộng/);
  assert.notEqual(D.declareSkill(open, uid(s, 1, 0), uid(s, 0, 0), 0).step, "main", "kỹ năng một mục tiêu vẫn trả đòn được");
});

test("Sừng lôi phá chỉ dùng trong vòng tấn công của mình", () => {
  let s = board({ 0: ["khong-lo-mot-mat"] }, { 0: ["khong-lo-mot-mat"] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5, hand: ["sung-loi-pha"], tolls: [false] })) };
  const off = D.castSpell({ ...s, round: 1 }, 0, uid(s, 0, 0));
  assert.match(off.live, /vòng tấn công/);
  assert.equal(at(off, 0, 0).horn ?? null, null);
  const on = D.castSpell(s, 0, uid(s, 0, 0));
  assert.ok(at(on, 0, 0).horn, on.live);
});

const BIG = {
  monsters: ["khong-lo-mot-mat", "may-chem", "rong-con", "kazura", "kizuran", "ma-dao-si", "chien-binh-rong", "hiep-si-ho-ve", "hiep-si-cua-vua", "hiep-si-cua-hau", "my-dieu-nhan", "phu-thuy-ti-hon", "rong-boc-trung"],
  spells: ["hap-thu-ma-phap", "vong-xoay-bao-ho", "phuc-kich", "guong-phong-ho", "hoan-doi", "virus-an-mon", "mua-ma-thuat"],
};
const cards = (p) => p.reserve.length + p.hand.length;

test("xấp chung: đầu trận 3 lá bất kỳ, thứ tự xấp khớp số lá", () => {
  let monstersSeen = 0;
  for (let n = 0; n < 400; n += 1) {
    const s = D.createDuel(BIG, "net");
    for (const p of s.players) {
      assert.equal(cards(p), 3);
      assert.equal(p.order.length, p.monsterDeck.length + p.spellDeck.length);
      assert.equal(p.order.filter((k) => k === "monster").length, p.monsterDeck.length);
      monstersSeen += p.reserve.length;
    }
  }
  const share = monstersSeen / (400 * 2 * 3);
  assert.ok(Math.abs(share - 13 / 20) < 0.05, `tỉ lệ quái trên tay đầu trận ${share.toFixed(3)} (mong 0.65)`);
});

test("rút bài: một nút, lấy đúng loại lá đầu xấp, không nhường quyền", () => {
  let s = D.createDuel(BIG, "test");
  s = { ...s, opening: false };
  for (let n = 0; n < 6; n += 1) {
    const me = s.players[0];
    const kind = me.order[0];
    const next = D.draw({ ...s, players: [{ ...me, draws: 0, orb: 3 }, s.players[1]] });
    const after = next.players[0];
    assert.equal(cards(after), cards(me) + 1);
    if (kind === "monster") assert.equal(after.reserve.length, me.reserve.length + 1);
    else assert.equal(after.hand.length, me.hand.length + 1);
    assert.equal(after.order.length, D.pileLeft(after));
    assert.equal(next.turn, 0);
    s = next;
  }
});

test("đổi bài đầu trận: lá mới lấy từ đầu xấp chung, vẫn 3 lá, lá bị đổi về xấp", () => {
  for (let n = 0; n < 200; n += 1) {
    const s = D.createDuel(BIG, "net");
    const p = s.players[0];
    const total = cards(p) + D.pileLeft(p);
    const pick = { reserve: p.reserve.map((_, i) => i), hand: p.hand.map((_, i) => i) };
    const swapped = D.openerSwap(s, 0, pick).players[0];
    assert.equal(cards(swapped), 3);
    assert.equal(cards(swapped) + D.pileLeft(swapped), total);
    assert.equal(swapped.order.length, D.pileLeft(swapped));
    const old = [...p.reserve.map((m) => m.id), ...p.hand];
    const now = [...swapped.reserve.map((m) => m.id), ...swapped.hand];
    assert.ok(now.every((id) => !old.includes(id)), "không rút lại đúng lá vừa đổi");
  }
});

test("luật bộ bài: 16–24 lá, ít nhất 13 quái, phép không bắt buộc", () => {
  assert.equal(C.deckLegal(13, 3), true);
  assert.equal(C.deckLegal(16, 0), true);
  assert.equal(C.deckLegal(24, 0), true);
  assert.equal(C.deckLegal(13, 2), false, "15 lá");
  assert.equal(C.deckLegal(12, 8), false, "12 quái");
  assert.equal(C.deckLegal(20, 5), false, "25 lá");
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
