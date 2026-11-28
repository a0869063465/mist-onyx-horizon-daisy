// Luật lá chắn gộp 1 loại (Z4, chủ game 23/11 + 27/11): chặn trọn 1 lần ra đòn (mọi loại sát thương), 2 lượt chung.
// Chạy từ thư mục repo: node scripts/shield-rules.mjs
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(`${process.cwd()}/package.json`);
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const D = await server.ssrLoadModule("/src/lib/duel.ts");

const DECK = { monsters: ["khong-lo-mot-mat", "may-chem", "rong-con", "khong-lo-mot-mat", "may-chem"], spells: ["hap-thu-ma-phap", "vong-xoay-bao-ho"] };
const DUMMY = "khong-lo-mot-mat";
const ANGEL = "thien-than-be-nho";

function board(mine, theirs, orb = 5) {
  let s = D.createDuel(DECK, "test");
  for (const [side, spots] of [[0, mine], [1, theirs]]) {
    const field = Array(6).fill(null);
    for (const [slot, [id, stats]] of Object.entries(spots)) {
      s = D.testGrant({ ...s, players: s.players.map((p, i) => (i === side ? { ...p, field: Array(6).fill(null) } : p)) }, side, id, true);
      const mon = s.players[side].field[0];
      field[Number(slot)] = { ...mon, dim: false, ...(Number(slot) >= 3 ? { row: "back" } : {}), ...(stats ?? {}) };
    }
    s = { ...s, players: s.players.map((p, i) => (i === side ? { ...p, field, orb: side === 0 ? orb : 0, flask: 0, stars: 3 } : p)) };
  }
  return { ...s, turn: 0, round: 0, skipped: [false, false], step: "main", pending: null, hold: null, counterAsk: null };
}
const at = (s, side, slot) => s.players[side].field[slot];
const hit = (s, a, b) => D.passResponse(D.attackMonster(s, a, b));
const mon = (stats) => [DUMMY, { atk: 3, def: 0, mdef: 0, hp: 20, maxHp: 20, ...stats }];
/** Quái không có skill, chặn đòn không tốn gì. */
const plain = (stats) => ["may-chem", { atk: 3, def: 0, mdef: 0, hp: 20, maxHp: 20, ...stats }];
/** Cả hai bỏ lượt: hết vòng (1 lượt chung). */
function closeRound(s) {
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 1, flask: 0 })), counterAsk: null };
  return D.endTurn(D.endTurn(s));
}

let failed = 0;
let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name}\n     ${error?.message ?? error}`);
  }
}

test("Cơn thịnh nộ của hải vương: ra sân có 1 khiên 2 lượt, không còn khiên vật lý/phép cũ", () => {
  let s = board({}, { 0: mon({}) });
  s = D.testGrant(s, 0, "con-thinh-no-cua-hai-vuong", true);
  const sea = s.players[0].field.find((m) => m?.cardId === "con-thinh-no-cua-hai-vuong");
  assert.equal(sea.aegis, 2);
  assert.equal(sea.oath, undefined);
});

test("Đòn đánh vào quái có khiên: chặn trọn (0 máu mất), khiên vỡ, thông báo ghi; đòn sau gây sát thương bình thường", () => {
  const s = board({ 0: mon({ atk: 5 }) }, { 0: mon({ atk: 0, aegis: 2 }) });
  const once = hit(s, at(s, 0, 0).uid, at(s, 1, 0).uid);
  assert.equal(at(once, 1, 0).hp, 20, once.live);
  assert.equal(at(once, 1, 0).aegis, undefined);
  assert.match(once.log.join("\n"), /\(Khiên đã vỡ\)/);
  assert.deepEqual(D.shieldBreaks(s, once), [at(s, 1, 0).uid], "vỡ trong cùng lượt chung = vỡ (cho hiệu ứng)");
  // Đòn kế (lần ra đòn khác) vào cùng quái: khiên đã vỡ, trúng bình thường.
  const bare = board({ 0: mon({ atk: 5 }) }, { 0: mon({ atk: 0 }) });
  const twice = hit(bare, at(bare, 0, 0).uid, at(bare, 1, 0).uid);
  assert.equal(at(twice, 1, 0).hp, 15, twice.live);
});

test("Thủ chặn hết sát thương vẫn làm vỡ khiên: sát thương đến là vỡ (chủ game 27/11)", () => {
  const s = board({ 0: mon({ atk: 3 }) }, { 0: mon({ atk: 0, def: 9, aegis: 2 }) });
  const once = hit(s, at(s, 0, 0).uid, at(s, 1, 0).uid);
  assert.equal(at(once, 1, 0).aegis, undefined, once.live);
  assert.equal(at(once, 1, 0).hp, 20);
  const spell = board({ 0: mon({}) }, { 0: mon({ mdef: 99, aegis: 2 }) });
  const cast = { ...spell, players: spell.players.map((p, i) => (i === 0 ? { ...p, hand: ["sam-set-tan-the"], orb: 9 } : p)) };
  let next = D.castSpell(cast, 0, null);
  for (let i = 0; i < 4 && next.pending; i += 1) next = D.passResponse(next);
  assert.equal(at(next, 1, 0).aegis, undefined, "sát thương chuẩn tới cũng vỡ: " + next.live);
});

test("Sát thương gốc 0 (công 0) thì khiên không vỡ", () => {
  const s = board({ 0: mon({ atk: 0 }) }, { 0: mon({ atk: 0, aegis: 2 }) });
  const once = hit(s, at(s, 0, 0).uid, at(s, 1, 0).uid);
  assert.equal(at(once, 1, 0).aegis, 2, once.live);
});

test("Khiên của kẻ tấn công chặn Trả đòn của quái bị đánh (Trả đòn là đòn đánh)", () => {
  let s = board({ 0: mon({ atk: 1, aegis: 2 }) }, { 0: mon({ atk: 6 }) });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3 })) };
  const open = hit(s, at(s, 0, 0).uid, at(s, 1, 0).uid);
  assert.equal(open.counterAsk?.uid, at(s, 1, 0).uid, open.live);
  const once = D.pickCounter(open, "phys");
  assert.equal(at(once, 0, 0).hp, 20, once.live);
  assert.equal(at(once, 0, 0).aegis, undefined);
  assert.equal(at(once, 1, 0).hp, 19);
});

test("Phép sát thương chuẩn diện rộng (Sấm sét tận thế): quái có khiên 0, quái khác trúng bình thường", () => {
  let s = board({ 0: mon({}) }, { 0: mon({ aegis: 2 }), 1: mon({}) });
  s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, hand: ["sam-set-tan-the"], orb: 9 } : p)) };
  let next = D.castSpell(s, 0, null);
  for (let i = 0; i < 4 && next.pending; i += 1) next = D.passResponse(next);
  assert.equal(at(next, 1, 0).hp, 20, next.live);
  assert.equal(at(next, 1, 0).aegis, undefined);
  assert.ok(at(next, 1, 1).hp < 20, `quái không khiên phải trúng: ${next.live}`);
});

test("Khiên không bị đánh: tự mất sau 2 lượt chung (lượt nhận tính là lượt 1); hết hạn không tính là vỡ", () => {
  let s = board({ 0: mon({ aegis: 2 }) }, { 0: mon({}) });
  const one = closeRound(s);
  assert.equal(at(one, 0, 0).aegis, 1, one.live);
  const two = closeRound(one);
  assert.equal(at(two, 0, 0).aegis, undefined, two.live);
  assert.deepEqual(D.shieldBreaks(one, two), [], "hết hạn không nháy vỡ");
});

test("Chiến binh rồng có khiên: đợt đầu bị chặn, các đợt Vảy rồng sau vẫn trúng (chỉ chặn đợt đầu)", () => {
  const s = board({ 0: mon({ atk: 9 }) }, { 0: ["chien-binh-rong", { atk: 0, def: 0, mdef: 0, hp: 20, maxHp: 20, aegis: 2 }] });
  const once = hit(s, at(s, 0, 0).uid, at(s, 1, 0).uid);
  assert.equal(at(once, 1, 0).hp, 20, once.live);
  assert.equal(at(once, 1, 0).aegis, undefined);
  assert.ok((at(once, 1, 0).debt?.[0]?.p ?? 0) > 0, "nợ Vảy rồng vẫn xếp hàng");
  const later = closeRound(once);
  assert.ok(at(later, 1, 0).hp < 20, `đợt sau vẫn trúng: ${later.live}`);
});

test("Sát thương hết vòng không làm vỡ khiên", () => {
  const s = board({ 0: ["chien-binh-rong", { atk: 0, def: 0, mdef: 0, hp: 20, maxHp: 20, aegis: 2, debt: [{ p: 3, s: 0, t: 0 }, { p: 3, s: 0, t: 0 }] }] }, { 0: mon({}) });
  const next = closeRound(s);
  assert.ok(at(next, 0, 0).hp < 20, next.live);
  assert.equal(at(next, 0, 0).aegis, 1, "khiên còn, chỉ trừ 1 lượt");
});

// ---- Nàng tiên giữ khoá (chủ game 28/11): Tinh linh hộ mệnh + Tinh linh bé nhỏ ----
/** Đối thủ (bên 1) ra đòn, bên 0 (có Nàng tiên) đang giữ quyền phản ứng. */
function foeBoard(mine, theirs, orb = 3) {
  const s = board(mine, theirs, orb);
  return { ...s, turn: 1, round: 1, players: s.players.map((p, i) => ({ ...p, orb: i === 0 ? orb : 5 })) };
}

test("Tinh linh hộ mệnh: đòn đánh vào đồng minh, chọn quái bị nhắm, 1 mana, tạo khiên; đòn tới thì khiên chặn", () => {
  let s = foeBoard({ 0: mon({}), 3: [ANGEL, { hp: 3, maxHp: 3 }] }, { 0: mon({ atk: 5 }) });
  s = D.attackMonster(s, at(s, 1, 0).uid, at(s, 0, 0).uid);
  assert.equal(s.hold?.priority, 0, s.live);
  const angel = at(s, 0, 3).uid;
  assert.deepEqual(D.spiritTargets(s, angel), [at(s, 0, 0).uid], "chỉ quái bị nhắm");
  const warded = D.spiritWard(s, angel, at(s, 0, 0).uid);
  assert.equal(at(warded, 0, 0).aegis, 2, warded.live);
  assert.equal(warded.players[0].orb, 2, "trừ 1 mana");
  assert.equal(at(warded, 0, 3).dim, true);
  assert.match(warded.live, /Tinh linh hộ mệnh, tạo khiên cho/);
  let done = warded;
  for (let i = 0; i < 4 && done.pending; i += 1) done = D.passResponse(done);
  assert.equal(at(done, 0, 0).hp, 20, done.live);
  assert.equal(at(done, 0, 0).aegis, undefined);
});

test("Tinh linh hộ mệnh: phép diện rộng của đối thủ nhắm nhiều quái, chọn 1 trong số đó", () => {
  let s = foeBoard({ 0: mon({}), 1: mon({}), 3: [ANGEL, { hp: 9, maxHp: 9 }] }, { 0: mon({}) });
  s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, hand: ["sam-set-tan-the"], orb: 9 } : p)) };
  s = D.castSpell(s, 0, null);
  const angel = at(s, 0, 3).uid;
  const aims = D.spiritTargets(s, angel);
  assert.equal(aims.length, 3, `cả 3 quái bị nhắm: ${s.live}`);
  const warded = D.spiritWard(s, angel, at(s, 0, 1).uid);
  let done = warded;
  for (let i = 0; i < 4 && done.pending; i += 1) done = D.passResponse(done);
  assert.equal(at(done, 0, 1).hp, 20, "quái được chọn không mất máu");
  assert.ok(at(done, 0, 0).hp < 20, "quái kia vẫn trúng");
});

test("Tinh linh hộ mệnh: không có khi hết mana, khi phe mình ra đòn, hay Nàng tiên đã hành động", () => {
  let s = foeBoard({ 0: mon({}), 3: [ANGEL, {}] }, { 0: mon({ atk: 5 }) }, 0);
  s = D.attackMonster(s, at(s, 1, 0).uid, at(s, 0, 0).uid);
  assert.deepEqual(D.spiritTargets(s, at(s, 0, 3).uid), [], "0 mana");
  let mine = board({ 0: mon({ atk: 5 }), 3: [ANGEL, {}] }, { 0: mon({}) });
  mine = D.attackMonster(mine, at(mine, 0, 0).uid, at(mine, 1, 0).uid);
  assert.deepEqual(D.spiritTargets(mine, at(mine, 0, 3).uid), [], "đòn của phe mình");
  let used = foeBoard({ 0: mon({}), 3: [ANGEL, { dim: true }] }, { 0: mon({ atk: 5 }) });
  used = D.attackMonster(used, at(used, 1, 0).uid, at(used, 0, 0).uid);
  assert.deepEqual(D.spiritTargets(used, at(used, 0, 3).uid), [], "đã hành động");
});

test("Tinh linh hộ mệnh: chỉ buff lá bị nhắm tới; đã có quái chặn hộ thì không dùng được (chủ game 28/11)", () => {
  let s = foeBoard({ 0: plain({}), 3: [ANGEL, {}], 4: plain({}) }, { 0: mon({ atk: 5 }) });
  s = D.attackMonster(s, at(s, 1, 0).uid, at(s, 0, 4).uid);
  const angel = at(s, 0, 3).uid;
  assert.deepEqual(D.spiritTargets(s, angel), [at(s, 0, 4).uid], "trước khi chặn: lá bị nhắm");
  const blocked = D.assignBlock(s, at(s, 0, 0).uid);
  assert.equal(blocked.hold?.blocker, at(s, 0, 0).uid, blocked.live);
  assert.deepEqual(D.spiritTargets(blocked, angel), [], "đã chặn hộ: không dùng được");
  assert.match(D.spiritWard(blocked, angel, at(s, 0, 0).uid).live, /Chọn 1 quái/);
});

test("Bỏ skill cũ: nút Thiên thần hộ mệnh không còn tạo khiên, không còn đỡ hộ riêng", () => {
  const s = board({ 0: [ANGEL, {}], 1: mon({}) }, { 0: mon({}) });
  const next = D.useSkill(s, at(s, 0, 0).uid, at(s, 0, 1).uid, 0);
  assert.equal(at(next, 0, 1).aegis, undefined, next.live);
  assert.equal(D.canSpirit(s, at(s, 0, 1).uid), false);
});

test("Tinh linh bé nhỏ: đồng minh đầu tiên chặn đòn hộ Nàng tiên (hàng sau) được khiên, tự trừ 1 mana, 1 lần mỗi lượt chung", () => {
  let s = foeBoard({ 0: plain({}), 1: plain({}), 3: [ANGEL, { hp: 3, maxHp: 3 }] }, { 0: mon({ atk: 5 }), 1: mon({ atk: 5 }) });
  s = D.attackMonster(s, at(s, 1, 0).uid, at(s, 0, 3).uid);
  const blocked = D.assignBlock(s, at(s, 0, 0).uid);
  assert.equal(blocked.hold?.blocker, at(s, 0, 0).uid, blocked.live);
  assert.equal(at(blocked, 0, 0).aegis, 2, blocked.live);
  assert.equal(blocked.players[0].orb, 2);
  assert.equal(at(blocked, 0, 3).fairyShot, true);
  let done = blocked;
  for (let i = 0; i < 4 && done.pending; i += 1) done = D.passResponse(done);
  assert.equal(at(done, 0, 0).hp, 20, "khiên chặn đòn cho quái chặn hộ: " + done.live);
  // Đòn thứ hai trong cùng lượt chung: không tạo thêm.
  let again = { ...done, turn: 1, step: "main", pending: null, hold: null, counterAsk: null, players: done.players.map((p, i) => ({ ...p, orb: i === 0 ? 3 : 5, field: p.field.map((m) => (m ? { ...m, dim: false } : m)) })) };
  again = D.attackMonster(again, at(again, 1, 1).uid, at(again, 0, 3).uid);
  const second = D.assignBlock(again, at(again, 0, 1).uid);
  assert.equal(at(second, 0, 1).aegis, undefined, "lượt này đã dùng: " + second.live);
  assert.equal(second.players[0].orb, 3);
  // Hết lượt chung thì dùng lại được.
  const next = closeRound({ ...done, step: "main", pending: null, hold: null });
  assert.equal(at(next, 0, 3).fairyShot, undefined);
});

test("Tinh linh bé nhỏ: hết mana thì không tạo khiên, đồng minh vẫn chặn được", () => {
  let s = foeBoard({ 0: plain({}), 3: [ANGEL, {}] }, { 0: mon({ atk: 5 }) }, 0);
  s = D.attackMonster(s, at(s, 1, 0).uid, at(s, 0, 3).uid);
  const blocked = D.assignBlock(s, at(s, 0, 0).uid);
  assert.equal(blocked.hold?.blocker, at(s, 0, 0).uid, blocked.live);
  assert.equal(at(blocked, 0, 0).aegis, undefined);
});

console.log(`${passed}/${passed + failed} đạt`);
await server.close();
process.exit(failed ? 1 : 0);
