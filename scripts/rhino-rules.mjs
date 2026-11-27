// Luật 3 lá Tê giác (chủ game 27/11): tiến hoá tự động theo sát thương ra đòn, Vào đây, Xông trận.
// Chạy từ thư mục repo: node scripts/rhino-rules.mjs
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(`${process.cwd()}/package.json`);
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const D = await server.ssrLoadModule("/src/lib/duel.ts");

const DECK = { monsters: ["khong-lo-mot-mat", "may-chem", "rong-con", "khong-lo-mot-mat", "may-chem"], spells: ["hap-thu-ma-phap", "vong-xoay-bao-ho"] };
const BABY = "te-giac-be-con";
const DUMMY = "khong-lo-mot-mat";

function board(mine, theirs, orb = 3, foeOrb = 0) {
  let s = D.createDuel(DECK, "test");
  for (const [side, spots] of [[0, mine], [1, theirs]]) {
    const field = Array(6).fill(null);
    for (const [slot, [id, stats]] of Object.entries(spots)) {
      s = D.testGrant({ ...s, players: s.players.map((p, i) => (i === side ? { ...p, field: Array(6).fill(null) } : p)) }, side, id, true);
      const mon = s.players[side].field[0];
      field[Number(slot)] = { ...mon, dim: false, ...(Number(slot) >= 3 ? { row: "back" } : {}), ...(stats ?? {}) };
    }
    s = { ...s, players: s.players.map((p, i) => (i === side ? { ...p, field, orb: side === 0 ? orb : foeOrb } : p)) };
  }
  return { ...s, turn: 0, round: 0, skipped: [false, false], step: "main", pending: null, hold: null, counterAsk: null };
}
const find = (s, uid) => s.players.flatMap((p) => p.field).find((m) => m?.uid === uid) ?? null;
const slotOf = (s, side, uid) => s.players[side].field.findIndex((m) => m?.uid === uid);
const hit = (s, a, b) => D.passResponse(D.attackMonster(s, a, b));
const foeMon = (stats) => [DUMMY, { atk: 0, def: 0, mdef: 0, hp: 20, maxHp: 20, ...stats }];
const baby = (stats) => [BABY, { level: 1, atk: 2, def: 0, mdef: 0, hp: 2, maxHp: 2, ...stats }];
const brave = (stats) => [BABY, { level: 2, atk: 3, def: 1, mdef: 1, hp: 3, maxHp: 3, ...stats }];
const warrior = (stats) => [BABY, { level: 3, atk: 4, def: 2, mdef: 2, hp: 5, maxHp: 5, ...stats }];

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log("PASS", name);
  } catch (error) {
    failed += 1;
    console.log("FAIL", name, "\n ", error.message);
  }
}

test("Bé con: đánh ra 2 sát thương thì đếm 2/4, chưa tiến hoá", () => {
  const s = board({ 0: baby() }, { 0: foeMon() });
  const r = find(s, s.players[0].field[0].uid).uid;
  const next = hit(s, r, s.players[1].field[0].uid);
  assert.equal(find(next, r).rush, 2);
  assert.equal(next.rhinoAsk ?? null, null);
});

test("Bé con hàng sau: đủ 4/4 + đủ mana thì hỏi; xác nhận thì trừ 1 mana, thành Tê giác hiếu thắng, lên hàng trước, đếm lại 0", () => {
  const s = board({ 3: baby({ rush: 2 }) }, { 0: foeMon() });
  const r = s.players[0].field[3].uid;
  const asked = hit(s, r, s.players[1].field[0].uid);
  assert.equal(asked.rhinoAsk?.uid, r, asked.live);
  assert.equal(asked.rhinoAsk.slot, 0);
  assert.equal(asked.rhinoAsk.level, 2);
  const orb = asked.players[0].orb;
  const done = D.answerRhino(asked);
  const mon = find(done, r);
  assert.equal(done.rhinoAsk, null);
  assert.equal(mon.level, 2);
  assert.equal(D.fieldName(mon), "Tê giác hiếu thắng");
  assert.deepEqual([mon.atk, mon.def, mon.mdef, mon.maxHp], [3, 1, 1, 3]);
  assert.equal(mon.hp, 3, "máu tối đa 2→3 thì máu hiện tại +1");
  assert.equal(mon.rush, 0);
  assert.equal(done.players[0].orb, orb - 1);
  assert.equal(slotOf(done, 0, r), 0, "lên ô trống hàng trước");
});

test("Hàng trước đầy: tiến hoá xong vẫn đứng hàng sau", () => {
  const s = board({ 0: [DUMMY, {}], 1: [DUMMY, {}], 2: [DUMMY, {}], 3: baby({ rush: 3 }) }, { 0: foeMon() });
  const r = s.players[0].field[3].uid;
  const done = D.answerRhino(hit(s, r, s.players[1].field[0].uid));
  assert.equal(find(done, r).level, 2);
  assert.equal(slotOf(done, 0, r), 3);
});

test("Thiếu mana: chưa tiến hoá; vừa đủ mana thì hỏi", () => {
  const s = board({ 0: baby({ rush: 3 }) }, { 0: foeMon() }, 0);
  const r = s.players[0].field[0].uid;
  const waited = hit(s, r, s.players[1].field[0].uid);
  assert.equal(find(waited, r).rush, 4);
  assert.equal(waited.rhinoAsk ?? null, null);
  const rich = { ...waited, players: waited.players.map((p, i) => ({ ...p, orb: i === 0 ? 1 : 0 })) };
  const later = D.endTurn({ ...rich, step: "main", turn: rich.turn });
  assert.equal(later.rhinoAsk?.uid, r, later.live);
});

test("Cú đánh làm đủ 4/4 mà hạ gục địch: Tê giác hiếu thắng được +1 máu vĩnh viễn", () => {
  const s = board({ 0: baby({ rush: 2 }) }, { 0: foeMon({ hp: 2, maxHp: 2 }) });
  const r = s.players[0].field[0].uid;
  const done = D.answerRhino(hit(s, r, s.players[1].field[0].uid));
  const mon = find(done, r);
  assert.equal(mon.maxHp, 4, "3 + 1 hạ gục");
  assert.equal(mon.hp, 4);
});

test("Vào đây: nhận sát thương thì +1 máu tối đa trước rồi mới trừ", () => {
  const s = board({ 0: brave() }, { 0: foeMon({ atk: 3 }) }, 3, 3);
  const r = s.players[0].field[0].uid;
  const asked = hit(s, r, s.players[1].field[0].uid);
  assert.equal(asked.counterAsk?.uid, s.players[1].field[0].uid, "đối thủ được Trả đòn");
  const next = D.pickCounter(asked, "phys");
  const mon = find(next, r);
  assert.equal(mon.maxHp, 4);
  assert.equal(mon.hp, 4 - (4 - 1), "4 máu trừ (3 công +1 Đập phá của quái thử - 1 thủ)");
  assert.equal(mon.rush, 3);
});

test("Vào đây: không nhận sát thương thì không +1", () => {
  const s = board({ 0: brave() }, { 0: foeMon({ atk: 0 }) });
  const r = s.players[0].field[0].uid;
  const next = hit(s, r, s.players[1].field[0].uid);
  assert.equal(find(next, r).maxHp, 3);
  assert.equal(find(next, r).hp, 3);
});

test("Vào đây: hạ gục 1 địch thì +1 máu tối đa", () => {
  const s = board({ 0: brave() }, { 0: foeMon({ hp: 2, maxHp: 2 }) });
  const r = s.players[0].field[0].uid;
  const next = hit(s, r, s.players[1].field[0].uid);
  assert.equal(find(next, r).maxHp, 4);
});

test("Hiếu thắng đủ 8/8 thì tiến hoá thành Tê giác chiến binh 4/2/2/5, giữ máu vĩnh viễn đã nhận", () => {
  const s = board({ 0: brave({ rush: 6, grit: 1, maxHp: 4, hp: 4 }) }, { 0: foeMon() });
  const r = s.players[0].field[0].uid;
  const asked = hit(s, r, s.players[1].field[0].uid);
  assert.equal(asked.rhinoAsk?.level, 3, asked.live);
  const mon = find(D.answerRhino(asked), r);
  assert.equal(D.fieldName(mon), "Tê giác chiến binh");
  assert.deepEqual([mon.atk, mon.def, mon.mdef, mon.maxHp], [4, 2, 2, 6]);
});

test("Xông trận: ra đòn hồi 1 máu, +1 công ngay đòn này, cộng dồn, hết 3 lượt chung thì mất", () => {
  const s = board({ 0: warrior({ hp: 3 }) }, { 0: foeMon() });
  const r = s.players[0].field[0].uid;
  const f = s.players[1].field[0].uid;
  const one = hit(s, r, f);
  let mon = find(one, r);
  assert.equal(find(one, f).hp, 20 - 4, "đòn này vẫn 4 công, +1 tính sau khi ra đòn");
  assert.equal(mon.atk, 5);
  assert.equal(mon.hp, 4, "hồi 1 máu");
  assert.deepEqual(mon.rally, [3]);
  const again = { ...one, turn: 0, step: "main", players: one.players.map((p) => ({ ...p, field: p.field.map((m) => (m ? { ...m, used: false, dim: false } : m)) })) };
  mon = find(hit(again, r, f), r);
  assert.equal(mon.atk, 6, "cộng dồn");
});

test("Không còn nút Thăng cấp: dùng kỹ năng 0 của Tê giác không làm gì", () => {
  const s = board({ 0: baby() }, { 0: foeMon() });
  const r = s.players[0].field[0].uid;
  const next = D.useSkill(s, r, null, 0);
  assert.equal(find(next, r).level, 1);
});

await server.close();
console.log(failed ? `${failed} FAIL` : "ALL PASS");
process.exit(failed ? 1 : 0);
