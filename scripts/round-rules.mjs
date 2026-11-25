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
const K = await server.ssrLoadModule("/src/lib/keywords.ts");
const H = await server.ssrLoadModule("/src/lib/hidden-kinds.ts");

/** Gắn tạm quái ẩn (luật L2) trong lúc chạy fn (HIDDEN_CARDS thật đang rỗng). */
function withHidden(map, fn) {
  Object.assign(H.HIDDEN_CARDS, map);
  try {
    fn();
  } finally {
    for (const id of Object.keys(map)) delete H.HIDDEN_CARDS[id];
  }
}

/** Cả hai bỏ lượt: hết vòng. */
function closeRound(s) {
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 1, flask: 0 })) };
  return D.endTurn(D.endTurn(s));
}

/** Gắn tạm keyword cho một quái trong lúc chạy fn (CARD_KEYWORDS thật đang rỗng). */
function withKeywords(id, list, fn) {
  K.CARD_KEYWORDS[id] = list;
  try {
    fn();
  } finally {
    delete K.CARD_KEYWORDS[id];
  }
}

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
/** Harpie Lady đã nhận đủ 4 kỹ năng qua Giảo hoạt (để thử từng kỹ năng). */
const ALL_WIT = { wit: { born: 1, last: 1, picked: ["armor", "gust", "charm", "lash"], deeds: [] } };
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

test("người không giữ token không tấn công được; cả hai bỏ lượt thì hết vòng, cả hai +1 mana, bên không giữ token +1 nữa (L1)", () => {
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
  assert.equal(closed.players[0].orb, 2, "vòng mới của bên kia: bên này +1 +1");
  assert.equal(closed.players[1].orb, 1);
  assert.equal(D.attackFace(closed, uid(closed, 1, 0)).pending?.kind, "face");
});

test("L1: Trả đòn bằng đánh thường tốn 1 mana; không đủ mana thì không được hỏi Trả đòn", () => {
  const make = (orb) => {
    let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 10, maxHp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 20, maxHp: 20 }] });
    s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: i === 0 ? 3 : orb })) };
    return D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  };
  const open = make(2);
  assert.equal(open.counterAsk?.uid, uid(open, 1, 0));
  const hit = D.pickCounter(open, "phys");
  assert.equal(hit.players[1].orb, 1, "trả 1 mana");
  const broke = make(0);
  assert.equal(broke.counterAsk ?? null, null, "0 mana thì không Trả đòn");
  assert.match(broke.live, /không đủ/);
});

test("L1: Trả đòn bằng kỹ năng tốn thêm 1 mana (Hơi thở rồng 1 → 2)", () => {
  const make = (orb) => {
    let s = board({ 0: ["khong-lo-mot-mat", { atk: 2, def: 0, mdef: 0, hp: 20, maxHp: 20 }] }, { 0: ["rong-con", { hp: 20, maxHp: 20, def: 0 }] });
    s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: i === 0 ? 3 : orb })) };
    return D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  };
  const open = make(3);
  assert.equal(open.counterAsk?.uid, uid(open, 1, 0));
  const declared = D.declareSkill(open, uid(open, 1, 0), uid(open, 0, 0), 0);
  assert.equal(declared.step, "main", "Trả đòn đánh ngay, không qua hàng chờ: " + declared.live);
  assert.equal(declared.hold, null);
  assert.equal(declared.players[1].orb, 1, "3 - (1 + 1)");
  const poor = make(1);
  const refused = D.declareSkill(poor, uid(poor, 1, 0), uid(poor, 0, 0), 0);
  assert.equal(refused.players[1].orb, 1, "thiếu mana cho kỹ năng: trả lại phí");
  assert.equal(refused.counterAsk?.uid, uid(poor, 1, 0), "vẫn còn được Trả đòn bằng đánh thường");
});

test("Trả đòn bằng Hoả cầu: tự nhắm kẻ ra đòn, đánh ngay, đối thủ không phản được", () => {
  let s = board({ 0: ["hoa-an-thit-nguoi", { atk: 3, hp: 20, maxHp: 20, def: 0, mdef: 0 }] }, { 0: ["rong-phun-hoa-cau", { hp: 20, maxHp: 20 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3 })), counterAsk: { uid: uid(s, 1, 0), from: uid(s, 0, 0) }, turn: 1 };
  const next = D.useSkill(s, uid(s, 1, 0), uid(s, 0, 0), 1);
  assert.equal(next.hold, null, next.live);
  assert.ok(at(next, 0, 0).hp < 20, next.live);
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

test("Ngăn chặn phòng ngự: dùng sau khi quái lao ra chặn; quái bị chọn bỏ chặn, không che và không ai che cho nó tới hết vòng", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { hp: 20, maxHp: 20 }], 1: ["rong-con"] }, { 0: ["may-chem", { hp: 20, maxHp: 20 }], 1: ["kizuran", { hp: 20, maxHp: 20 }], 3: ["rong-con", { hp: 20, maxHp: 20 }] });
  s = D.testGrant(s, 0, "ngan-chan-phong-ngu", false);
  s = D.endTurn(D.endTurn(s));
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })), turn: 0, round: 0 };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 3));
  const idx = swung.players[0].hand.indexOf("ngan-chan-phong-ngu");
  assert.equal(swung.hold?.priority, 1, swung.live);
  assert.deepEqual(D.shelterPicks(swung), [], "chưa ai chặn thì chưa có ai để chọn");
  const blocked = D.assignBlock(swung, uid(s, 1, 0));
  assert.equal(blocked.hold?.blocker, uid(s, 1, 0), blocked.live);
  assert.deepEqual([...D.shelterPicks(blocked)].sort(), [uid(s, 1, 0), uid(s, 1, 3)].sort(), "chọn được quái chặn hoặc quái được che");
  // Pick the blocker: it no longer blocks, and cannot cover again this round.
  const a = D.castSpell(blocked, idx, uid(s, 1, 0));
  assert.equal(a.hold?.blocker ?? null, null, a.live);
  assert.equal(at(a, 1, 0).noBlock, true);
  assert.match(D.assignBlock(a, uid(s, 1, 0)).live, /không chặn được/i);
  // Pick the one covered: nobody covers it any more, the hit stands on it.
  const b = D.castSpell(blocked, idx, uid(s, 1, 3));
  assert.equal(b.hold?.blocker ?? null, null);
  assert.equal(at(b, 1, 3).noCover, true);
  assert.match(D.assignBlock(b, uid(s, 1, 1)).live, /không được che chắn/);
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
  assert.equal(declared.step, "main", "Trả đòn đánh ngay, không qua hàng chờ: " + declared.live);
  assert.equal(declared.counterAsk, null);
  const done = declared;
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
  assert.match(D.declareSkill(open, uid(s, 1, 0), uid(s, 0, 0), 1).live, /Kỹ năng chậm/);
  assert.ok(at(D.declareSkill(open, uid(s, 1, 0), uid(s, 0, 0), 0), 0, 0).hp < 20, "kỹ năng một mục tiêu vẫn trả đòn được");
});

test("Sừng lôi phá chỉ dùng trong vòng tấn công của mình", () => {
  let s = board({ 0: ["khong-lo-mot-mat"] }, { 0: ["khong-lo-mot-mat"] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5, hand: ["sung-loi-pha"], tolls: [false] })) };
  const off = D.castSpell({ ...s, round: 1 }, 0, uid(s, 0, 0));
  assert.match(off.live, /vòng tấn công/);
  assert.equal(at(off, 0, 0).horn ?? null, null);
  const on = D.castSpell(s, 0, uid(s, 0, 0));
  assert.ok(at(on, 0, 0).horn, on.live);
  // Chủ game 16/11: gắn sừng là +3 công ngay, không còn bảng chọn Lan / +3.
  assert.equal(at(on, 0, 0).atk, at(s, 0, 0).atk + 3);
  assert.ok(!at(on, 0, 0).hornNew);
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

test("Virus ăn mòn: chỉ dùng khi quái 1 sao có thể bị hạ; ăn mòn ngay, hoặc chờ trong chuỗi khi bên bị ăn mòn cầm Hấp thụ ma pháp", () => {
  const make = (atk, breaker) => {
    let s = board({ 0: ["khong-lo-mot-mat", { atk, hp: 20, maxHp: 20 }], 1: ["thuong-quan-long", { hp: 10, maxHp: 10, def: 0, mdef: 0 }] }, { 0: ["may-chem", { hp: 2, maxHp: 2, def: 0 }] });
    s = { ...s, players: s.players.map((p) => ({ ...p, hand: [], tolls: [] })) };
    s = D.testGrant(s, 1, "virus-an-mon", false);
    if (breaker) s = D.testGrant(s, 0, "hap-thu-ma-phap", false);
    s = D.endTurn(D.endTurn(s));
    s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: 5, ...(i === 0 ? { monsterDeck: [], reserve: [] } : {}) })), turn: 0, round: 0 };
    const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
    assert.equal(swung.hold?.priority, 1, swung.live);
    return { s, swung, cast: D.castSpell(swung, swung.players[1].hand.indexOf("virus-an-mon"), null) };
  };
  const settle = (x) => {
    for (let i = 0; i < 6 && x.step === "respond" && !x.pending?.corrode; i++) x = D.passResponse(x);
    return x;
  };
  const weak = make(1, false);
  assert.equal(weak.cast.virusArm ?? null, null, "quái không thể bị hạ thì không dùng được");
  const now = make(9, false);
  assert.equal(now.cast.virusArm?.owner, 1, now.cast.live);
  const ate = settle(now.cast);
  assert.equal(ate.virus?.owner, 1, ate.live);
  assert.equal(at(ate, 0, 1).hp, 8, "4 sao: 2 sát thương chuẩn ngay");
  assert.match(ate.corrosions?.at(-1)?.line ?? "", /Virus ăn mòn Thương quản long/);
  const held = settle(make(9, true).cast);
  assert.equal(held.pending?.corrode?.uid, uid(held, 0, 1), held.live);
  assert.equal(held.hold?.priority, 0);
  assert.equal(at(held, 0, 1).hp, 10, "chưa ăn mòn khi còn chờ");
  const landed = D.passResponse(held);
  assert.equal(at(landed, 0, 1).hp, 8, landed.live);
  assert.equal(landed.step, "main");
  const cured = D.castSpell(held, held.players[0].hand.indexOf("hap-thu-ma-phap"), null);
  assert.equal(cured.virus ?? null, null, cured.live);
  assert.equal(at(cured, 0, 1).hp, 10);
});

test("Phản nguyền: lúc Virus ăn mòn chờ thì chuyển Virus sang người gửi; chỉ 1 đồng minh xấu thì không cần chọn", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 9, hp: 20, maxHp: 20 }], 1: ["thuong-quan-long", { hp: 10, maxHp: 10, def: 0, mdef: 0 }] }, { 0: ["may-chem", { hp: 2, maxHp: 2, def: 0 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, hand: [], tolls: [] })) };
  s = D.testGrant(s, 1, "virus-an-mon", false);
  s = D.testGrant(s, 0, "phan-nguyen", false);
  s = D.endTurn(D.endTurn(s));
  s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: 5, ...(i === 0 ? { monsterDeck: [], reserve: [] } : {}) })), turn: 0, round: 0 };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  let x = D.castSpell(swung, swung.players[1].hand.indexOf("virus-an-mon"), null);
  for (let i = 0; i < 6 && x.step === "respond" && !x.pending?.corrode; i++) x = D.passResponse(x);
  assert.ok(x.pending?.corrode, x.live);
  const turned = D.castSpell(x, x.players[0].hand.indexOf("phan-nguyen"), null);
  assert.equal(turned.virus?.owner, 0, turned.live);
  assert.equal(turned.step, "main");
  assert.equal(at(turned, 0, 1).hp, 10, "quái không bị ăn mòn");
  assert.match(D.castSpell(swung, 0, null).live, /./);
  const idle = D.castSpell({ ...s }, s.players[0].hand.indexOf("phan-nguyen"), null);
  assert.equal(idle.virus ?? null, null);
});

test("skill chậm vào hàng chờ: Lão hoá, Cường hoá (vòng quay sau chuỗi), Nguyền rủa, Thổi bay; chỉ Hấp thụ hoá giải, không chặn", () => {
  const make = (mine, theirs) => {
    let s = board(mine, theirs);
    s = { ...s, players: s.players.map((p) => ({ ...p, hand: [], tolls: [] })) };
    s = D.endTurn(D.endTurn(s));
    return { ...s, players: s.players.map((p) => ({ ...p, orb: 6 })), turn: 0, round: 0 };
  };
  let s = make({ 0: ["phu-thuy-thoi-gian", { hp: 20, maxHp: 20 }] }, { 0: ["khong-lo-mot-mat", { atk: 9, def: 6, mdef: 6, hp: 20, maxHp: 20 }], 1: ["may-chem", { hp: 20, maxHp: 20 }] });
  const age = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0, true);
  assert.equal(age.step, "respond", age.live);
  assert.equal(age.pending?.kind, "beam");
  assert.equal(at(age, 1, 0).atk, 9, "chưa có tác dụng khi còn chờ");
  assert.match(D.assignBlock(age, uid(s, 1, 1)).live, /không chặn được/);
  const aged = D.passResponse(age);
  assert.ok(at(aged, 1, 0).atk < 9, aged.live);
  // Hấp thụ ma pháp hoá giải: nothing happens.
  const withAbsorb = D.testGrant(age, 1, "hap-thu-ma-phap", false);
  const eaten = D.castSpell(withAbsorb, withAbsorb.players[1].hand.indexOf("hap-thu-ma-phap"), null);
  assert.equal(eaten.step, "main", eaten.live);
  assert.equal(at(eaten, 1, 0).atk, 9);
  // Other answers are refused.
  const withMirror = D.testGrant(age, 1, "vong-xoay-bao-ho", false);
  assert.match(D.castSpell(withMirror, withMirror.players[1].hand.indexOf("vong-xoay-bao-ho"), null).live, /Hấp thụ ma pháp/);
  // Cường hoá: the wheel opens only once the chain is over, then lands.
  const boost = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 1, true);
  assert.equal(boost.step, "respond", boost.live);
  assert.equal(boost.wheel ?? null, null, "chưa quay khi còn chờ");
  const opened = D.passResponse(boost);
  assert.equal(opened.wheel?.sector, null, opened.live);
  assert.equal(at(opened, 1, 0).hp, 20);
  const pulled = D.pullWheel(opened);
  assert.notEqual(pulled.wheel?.sector, null);
  const landed = D.settleWheel(pulled);
  assert.equal(landed.wheel ?? null, null);
  const hit = pulled.wheel.sector % 3 === 0;
  if (hit) assert.ok(!at(landed, 1, 0), landed.live);
  else assert.ok(!at(landed, 0, 0), "trượt thì phù thuỷ tự huỷ");
  // Mộ voi ma mút: Nguyền rủa waits too.
  s = make({ 0: ["mo-voi-ma-mut", { hp: 6, maxHp: 6 }] }, { 0: ["khong-lo-mot-mat", { hp: 20, maxHp: 20, mdef: 0 }] });
  const curse = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0, true);
  assert.equal(curse.step, "respond", curse.live);
  assert.equal(at(curse, 1, 0).hp, 20);
  assert.ok(at(D.passResponse(curse), 1, 0).hp < 20);
  // Thổi bay (Mỹ điểu nhân) waits; then a spell leaves the foe's hand.
  s = make({ 0: ["my-dieu-nhan", { hp: 20, maxHp: 20, ...ALL_WIT }] }, { 0: ["khong-lo-mot-mat", { hp: 20, maxHp: 20 }] });
  s = D.testGrant(s, 1, "vong-xoay-bao-ho", false);
  const gust = D.useSkill(s, uid(s, 0, 0), null, 0);
  assert.equal(gust.step, "respond", gust.live);
  assert.equal(gust.players[1].hand.length, 1);
  assert.equal(D.passResponse(gust).players[1].hand.length, 0);
});

test("Hoa ăn thịt người chỉ hấp thụ ở vòng tấn công của mình", () => {
  let s = board({ 0: ["hoa-an-thit-nguoi", { hp: 3, maxHp: 3 }] }, { 0: ["khong-lo-mot-mat", { hp: 6, maxHp: 6 }] });
  // Round (token) belongs to the foe: the flower must not bite.
  const off = { ...s, turn: 0, round: 1 };
  const refused = D.useSkill(off, uid(off, 0, 0), uid(off, 1, 0), 0);
  assert.equal(at(refused, 1, 0).maxHp, 6, refused.live);
  assert.match(refused.live, /Chưa đến vòng/);
  // Its own round: the bite lands.
  const own = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0);
  assert.ok(at(own, 1, 0).maxHp < 6, own.live);
});

test("Ong khổng lồ: Kim châm tê liệt và gây thêm 2 sát thương phép; chỉ ở vòng của mình", () => {
  const s = board({ 0: ["ong-khong-lo", { hp: 1, maxHp: 1 }] }, { 0: ["khong-lo-mot-mat", { hp: 10, maxHp: 10, mdef: 0 }] });
  const off = { ...s, round: 1 };
  const refused = D.useSkill(off, uid(off, 0, 0), uid(off, 1, 0), 0);
  assert.equal(at(refused, 1, 0).stun, 0, refused.live);
  assert.match(refused.live, /Chưa đến vòng/);
  let fired = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0);
  if (fired.step === "respond") fired = D.passResponse(fired);
  assert.equal(at(fired, 1, 0).stun, 5, fired.live);
  assert.equal(at(fired, 1, 0).hp, 8, fired.live);
});

// Hộp ma thuật (chủ game 02/11)
function boxBoard(foeStats = {}) {
  const tough = { hp: 20, maxHp: 20, def: 0, mdef: 0 };
  let s = board({ 0: ["rong-con", { ...tough }], 1: ["may-chem", { ...tough, ...foeStats }] }, { 0: ["khong-lo-mot-mat", { ...tough }] });
  s = D.testGrant(s, 1, "hop-ma-thuat", false);
  return { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
}
const roundOver = (s) => {
  for (let i = 0; i < 6 && s.box; i += 1) s = D.endTurn(s);
  return s;
};

test("Hộp ma thuật siêu tốc: đổi chỗ 2 sân ngay, kỹ năng trúng quái địch; hết vòng về chỗ", () => {
  const s = boxBoard();
  const ally = uid(s, 1, 0);
  const enemy = uid(s, 0, 1);
  const breath = D.declareSkill(s, uid(s, 0, 0), ally, 0);
  assert.equal(breath.step, "respond", breath.live);
  const swapped = D.castSpell(breath, breath.players[1].hand.indexOf("hop-ma-thuat"), enemy);
  assert.equal(at(swapped, 1, 0).uid, enemy, "đổi ngay lúc dùng");
  assert.equal(swapped.step, "respond", "kỹ năng vẫn chờ");
  const landed = D.passResponse(swapped);
  assert.equal(at(landed, 1, 0).uid, enemy, landed.live);
  assert.equal(at(landed, 1, 0).abroad, 0);
  assert.equal(at(landed, 0, 1).uid, ally);
  assert.equal(at(landed, 0, 1).abroad, 1);
  assert.ok(at(landed, 1, 0).hp < 20, "kỹ năng trúng quái địch ở ô đó");
  assert.equal(at(landed, 0, 1).hp, 20, "đồng minh không trúng");
  const home = roundOver({ ...landed, step: "main", pending: null, hold: null });
  assert.equal(home.box, null, home.live);
  assert.equal(at(home, 1, 0).uid, ally, rows(home).join(" | "));
  assert.equal(at(home, 0, 1).uid, enemy);
  assert.equal(at(home, 1, 0).abroad, undefined);
});

test("Hộp ma thuật không dùng với đòn đánh thường", () => {
  const s = boxBoard();
  const hit = D.attackMonster(s, uid(s, 0, 1), uid(s, 1, 0));
  assert.equal(hit.step, "respond", hit.live);
  const tried = D.castSpell(hit, hit.players[1].hand.indexOf("hop-ma-thuat"), uid(s, 0, 0));
  assert.ok(!tried.hold?.box, tried.live);
  assert.match(tried.live, /Hộp ma thuật chỉ dùng/);
});

test("Quái ở sân lạ không tấn công, không dùng kỹ năng, không bị hiến tế", () => {
  const s = boxBoard();
  const ally = uid(s, 1, 0);
  const enemy = uid(s, 0, 1);
  const breath = D.declareSkill(s, uid(s, 0, 0), ally, 0);
  const landed = D.passResponse(D.castSpell(breath, breath.players[1].hand.indexOf("hop-ma-thuat"), enemy));
  const mine = { ...landed, step: "main", pending: null, hold: null, turn: 0, round: 0 };
  const swing = D.attackFace(mine, ally);
  assert.ok(!swing.pending, "quái của đối thủ đứng ở sân mình không tấn công được");
  const theirs = { ...landed, step: "main", pending: null, hold: null, turn: 1, round: 1 };
  const own = D.attackFace(theirs, enemy);
  assert.ok(!own.pending, "quái của mình ở sân bên kia không tấn công được");
  const skill = D.useSkill(mine, ally, null, 0);
  assert.equal(skill.players, mine.players, skill.live);
});

test("Một con chết: con kia về ô cũ, ô bên kia khoá tới hết vòng", () => {
  const s = boxBoard({ hp: 1, maxHp: 1 });
  const ally = uid(s, 1, 0);
  const enemy = uid(s, 0, 1);
  const breath = D.declareSkill(s, uid(s, 0, 0), ally, 0);
  const landed = D.passResponse(D.castSpell(breath, breath.players[1].hand.indexOf("hop-ma-thuat"), enemy));
  assert.equal(at(landed, 1, 0)?.uid, ally, `${landed.live} | ${rows(landed).join(" | ")}`);
  assert.equal(at(landed, 1, 0).abroad, undefined);
  assert.equal(at(landed, 0, 1), null, "ô bên kia trống");
  assert.deepEqual(landed.box?.shut, { side: 0, slot: 1 });
  let mine = D.testGrant({ ...landed, step: "main", pending: null, hold: null, turn: 0, round: 0 }, 0, "may-chem", false);
  mine = { ...mine, players: mine.players.map((p) => ({ ...p, stars: 5, summons: 0 })) };
  const refused = D.summon(mine, mine.players[0].reserve.length - 1, 1);
  assert.equal(at(refused, 0, 1), null);
  assert.match(refused.live, /khoá tới hết vòng/);
  const after = roundOver(mine);
  assert.equal(after.box, null, "hết vòng mở ô");
});

test("Hộp ma thuật chọn chính quái dùng kỹ năng: kỹ năng trúng lại nó", () => {
  const s = boxBoard();
  const ally = uid(s, 1, 0);
  const caster = uid(s, 0, 0);
  const breath = D.declareSkill(s, caster, ally, 0);
  const landed = D.passResponse(D.castSpell(breath, breath.players[1].hand.indexOf("hop-ma-thuat"), caster));
  assert.equal(at(landed, 1, 0).uid, caster, landed.live);
  assert.ok(at(landed, 1, 0).hp < 20, "kỹ năng trúng lại kẻ dùng");
  assert.equal(at(landed, 0, 0).hp, 20);
});

test("Hộp ma thuật với kỹ năng nhiều mục tiêu: chọn 1 đồng minh bị trúng, nhánh đó sang quái địch", () => {
  const tough = { hp: 40, maxHp: 40, def: 0, mdef: 0 };
  let s = board({ 1: ["trai-tim-hai-long", { hp: 30, maxHp: 30, def: 0 }], 2: ["may-chem", tough] }, { 0: ["khong-lo-mot-mat", tough], 1: ["may-chem", tough], 3: ["kazura", tough] });
  s = D.testGrant(s, 1, "hop-ma-thuat", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const staged = D.stageHold(D.declareSkill(s, uid(s, 0, 1), uid(s, 1, 3), 1));
  const { sure, hits } = spreadWith(staged, (row) => row.filter((id) => !id.startsWith("face")).length >= 2);
  const allies = D.boxAllies(sure, 1);
  assert.ok(allies.length >= 2, String(allies));
  const pick = allies[0];
  const enemy = uid(s, 0, 2);
  const tried = D.castSpell(sure, sure.players[1].hand.indexOf("hop-ma-thuat"), enemy);
  assert.match(tried.live, /Chọn đồng minh/, "nhiều đồng minh thì phải chọn");
  const swapped = D.castSpell(sure, sure.players[1].hand.indexOf("hop-ma-thuat"), enemy, false, pick);
  assert.ok(swapped.players[0].field.some((m) => m?.uid === pick), swapped.live);
  const landed = D.passResponse(swapped);
  const moved = landed.players[0].field.find((m) => m?.uid === pick);
  assert.ok(moved, `${landed.live} | ${rows(landed).join(" | ")} | ${hits}`);
  assert.equal(moved.hp, 40, "đồng minh đã sang sân kia không trúng");
});

// V3 (chủ game 04/11): Hấp thụ ma pháp nuốt phép nhanh và skill dạng phép vừa đáp; việc gốc chạy tiếp.
const withHand = (s, side, ids) => ids.reduce((acc, id) => D.testGrant(acc, side, id, false), s);
const rich = (s) => ({ ...s, players: s.players.map((p) => ({ ...p, orb: 8 })) });

test("Hấp thụ ma pháp nuốt Phục kích: kỹ năng vẫn vào, không ai đánh trả", () => {
  let s = board({ 0: ["rong-con", { hp: 20, maxHp: 20, def: 0, mdef: 0 }] }, { 0: ["khong-lo-mot-mat", { hp: 20, maxHp: 20, def: 0, mdef: 0, atk: 3 }] });
  s = rich(withHand(withHand(s, 1, ["phuc-kich"]), 0, ["hap-thu-ma-phap"]));
  const breath = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0);
  const waiting = D.castSpell(breath, breath.players[1].hand.indexOf("phuc-kich"), uid(s, 1, 0));
  assert.equal(waiting.hold?.priority, 0);
  assert.ok(D.eatFor(waiting, 0), "bên dùng kỹ năng nuốt được Phục kích");
  const eaten = D.castSpell(waiting, waiting.players[0].hand.indexOf("hap-thu-ma-phap"));
  assert.equal(eaten.pending?.kind, "beam", eaten.live);
  assert.equal(eaten.hold?.ambush, undefined, "Phục kích mất");
  assert.equal(eaten.hold?.priority, 1, "bên bị đánh được đáp lại");
  assert.ok(!eaten.players[1].hand.includes("phuc-kich"), "lá Phục kích vẫn mất");
  assert.ok(!eaten.players[0].hand.includes("hap-thu-ma-phap"));
  const done = D.passResponse(eaten);
  assert.ok(at(done, 1, 0).hp < 20, `kỹ năng vào: ${done.live}`);
  assert.equal(at(done, 0, 0).hp, 20, "không bị đánh trả");
});

test("Hấp thụ ma pháp nuốt Gương phòng hộ (từ tay và dựng sẵn): đòn đánh vẫn vào", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4, def: 2, mdef: 2, hp: 10, maxHp: 10 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20, def: 0 }] });
  s = rich(withHand(withHand(s, 1, ["guong-phong-ho"]), 0, ["hap-thu-ma-phap"]));
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  const cast = D.castSpell(swung, swung.players[1].hand.indexOf("guong-phong-ho"));
  const eaten = D.castSpell(cast, cast.players[0].hand.indexOf("hap-thu-ma-phap"));
  assert.equal(eaten.hold?.mirror, undefined, eaten.live);
  assert.equal(eaten.players[1].mirror ?? 0, 0, "không còn gương 3 lượt");
  const done = D.passResponse(eaten);
  assert.ok(at(done, 1, 0).hp < 20, done.live);
  assert.ok(at(done, 0, 0).atk > 2, "kẻ đánh không mất nửa công");
  // Gương dựng sẵn.
  let t = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, mirror: 2 } : p)) };
  const up = D.attackMonster(t, uid(t, 0, 0), uid(t, 1, 0));
  assert.equal(up.hold?.mirror, "up");
  const gone = D.castSpell(up, up.players[0].hand.indexOf("hap-thu-ma-phap"));
  assert.equal(gone.hold?.mirror, undefined, gone.live);
  assert.equal(gone.players[1].mirror, 0);
  const hit = D.passResponse(gone);
  assert.ok(at(hit, 1, 0).hp < 20, hit.live);
});

test("Hấp thụ ma pháp nuốt Vòng nguyền rủa ác ma: đòn đánh tiếp tục, kẻ đánh không bị nguyền", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4, def: 2, mdef: 2, hp: 10, maxHp: 10 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20, def: 0 }] });
  s = rich(withHand(withHand(s, 1, ["vong-nguyen-rua-ac-ma"]), 0, ["hap-thu-ma-phap"]));
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  const cursed = D.castSpell(swung, swung.players[1].hand.indexOf("vong-nguyen-rua-ac-ma"));
  const eaten = D.castSpell(cursed, cursed.players[0].hand.indexOf("hap-thu-ma-phap"));
  assert.equal(eaten.pending?.kind, "melee", eaten.live);
  const done = D.passResponse(eaten);
  assert.ok(at(done, 1, 0).hp < 20, done.live);
  assert.ok(!at(done, 0, 0).curse, "không bị nguyền");
});

test("Roi điện của Harpie Lady chờ trong chuỗi (25/11): không ai nuốt thì huỷ kỹ năng, +2 công, trả đòn lên kẻ ra đòn; Hấp thụ ma pháp nuốt thì kỹ năng vào", () => {
  let s = board({ 0: ["rong-con", { hp: 20, maxHp: 20, def: 0, mdef: 0 }] }, { 0: ["my-dieu-nhan", { hp: 20, maxHp: 20, def: 0, mdef: 0, ...ALL_WIT }] });
  s = rich(withHand(s, 0, ["hap-thu-ma-phap"]));
  const breath = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0);
  assert.equal(D.harpyOffer(breath, 1), "lash", breath.live);
  const atkBefore = at(breath, 1, 0).atk;
  const ward = D.harpyLash(breath);
  assert.equal(ward.pending?.kind, "beam", "chưa nổ");
  assert.equal(ward.hold?.priority, 0);
  const kept = D.passResponse(ward);
  assert.equal(at(kept, 1, 0).atk, atkBefore + 2, "chim +2 công");
  assert.equal(at(kept, 1, 0).hp >= 20, true, "kỹ năng bị huỷ");
  assert.ok(at(kept, 0, 0).hp < 20, `trả đòn lên kẻ ra đòn: ${kept.live}`);
  const eaten = D.castSpell(ward, ward.players[0].hand.indexOf("hap-thu-ma-phap"));
  assert.equal(eaten.hold?.ward, undefined, eaten.live);
  const done = D.passResponse(eaten);
  assert.ok(at(done, 1, 0).hp < 20, `kỹ năng vào: ${done.live}`);
  assert.equal(at(done, 1, 0).atk, atkBefore, "chim không lớn");
});

test("Giáp và Vuốt của Harpie Lady (25/11): né đòn đánh thường tốn 1 mana, +2 thủ và +2 máu tối đa, trả 5 sát thương phép vào kẻ tấn công", () => {
  let s = board({ 0: ["may-chem", { atk: 4, hp: 20, maxHp: 20, def: 0, mdef: 0 }] }, { 0: ["my-dieu-nhan", { hp: 20, maxHp: 20, def: 0, mdef: 0, ...ALL_WIT }] });
  s = rich(s);
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(D.harpyOffer(swung, 1), "armor", swung.live);
  const orbBefore = swung.players[1].orb;
  const dodge = D.harpyWard(swung);
  assert.equal(dodge.pending?.kind, "lash", dodge.live);
  assert.equal(dodge.players[1].orb, orbBefore - 1, "1 mana");
  assert.equal(at(dodge, 1, 0).def, 2);
  assert.equal(at(dodge, 1, 0).maxHp, 22);
  const done = D.passResponse(dodge);
  assert.equal(at(done, 1, 0).hp, 22, `đòn bị né: ${done.live}`);
  assert.equal(at(done, 0, 0).hp, 15, "trả 5 sát thương phép");
});

test("Hấp thụ ma pháp không dùng được khi không có gì để nuốt (đòn đánh thường)", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20 }] });
  s = rich(withHand(s, 1, ["hap-thu-ma-phap"]));
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.ok(!D.eatFor(swung, 1));
  const tried = D.castSpell(swung, swung.players[1].hand.indexOf("hap-thu-ma-phap"));
  assert.ok(tried.players[1].hand.includes("hap-thu-ma-phap"), "lá còn trên tay");
});

test("keyword chặn: Siêu tốc, Bọc thép, Khổng lồ, Nanh vuốt", () => {
  const base = () => {
    let s = board({ 0: ["may-chem", { atk: 3, hp: 10 }] }, { 0: ["rong-con", { atk: 2, def: 1, mdef: 1, hp: 4 }], 1: ["rong-con", { atk: 5, def: 2, mdef: 2, hp: 6 }] });
    s = D.endTurn(D.endTurn(s));
    return { ...s, turn: 0, round: 0 };
  };
  withKeywords("may-chem", ["sieu-toc"], () => {
    const s = base();
    const swung = D.attackFace(s, uid(s, 0, 0));
    assert.match(D.assignBlock(swung, uid(s, 1, 1)).live, /Siêu tốc/);
  });
  withKeywords("may-chem", ["boc-thep"], () => {
    const s = base();
    const swung = D.attackFace(s, uid(s, 0, 0));
    assert.match(D.assignBlock(swung, uid(s, 1, 0)).live, /Bọc thép/);
    assert.equal(D.assignBlock(swung, uid(s, 1, 1)).hold?.blocker, uid(s, 1, 1));
  });
  withKeywords("may-chem", ["khong-lo"], () => {
    const s = base();
    const swung = D.attackFace(s, uid(s, 0, 0));
    assert.match(D.assignBlock(swung, uid(s, 1, 0)).live, /Khổng lồ/);
    assert.equal(D.assignBlock(swung, uid(s, 1, 1)).hold?.blocker, uid(s, 1, 1));
  });
  withKeywords("may-chem", ["nanh-vuot"], () => {
    const s = base();
    const swung = D.attackFace(s, uid(s, 0, 0));
    assert.match(D.assignBlock(swung, uid(s, 1, 0)).live, /Nanh vuốt/);
    assert.equal(D.assignBlock(swung, uid(s, 1, 1)).hold?.blocker, uid(s, 1, 1));
  });
  const s = base();
  assert.equal(D.assignBlock(D.attackFace(s, uid(s, 0, 0)), uid(s, 1, 0)).hold?.blocker, uid(s, 1, 0), "không keyword thì chặn như thường");
});

test("keyword Luồn lách 2: số quái được chặn = số quái hàng trước trừ 2", () => {
  const make = (front) => {
    const theirs = {};
    for (let i = 0; i < front; i += 1) theirs[i] = ["rong-con", { atk: 2, def: 1, hp: 6 }];
    let s = board({ 0: ["may-chem", { atk: 3, hp: 10 }] }, theirs);
    s = D.endTurn(D.endTurn(s));
    return { ...s, turn: 0, round: 0 };
  };
  withKeywords("may-chem", ["luon-lach-2"], () => {
    const two = make(2);
    assert.match(D.assignBlock(D.attackFace(two, uid(two, 0, 0)), uid(two, 1, 0)).live, /Luồn lách 2/);
    const three = make(3);
    assert.equal(D.assignBlock(D.attackFace(three, uid(three, 0, 0)), uid(three, 1, 0)).hold?.blocker, uid(three, 1, 0));
  });
});

test("keyword Đòn đánh phép: đòn đánh thường trừ thủ phép, không trừ thủ", () => {
  const make = () => {
    let s = board({ 0: ["may-chem", { atk: 4, hp: 10 }] }, { 0: ["rong-con", { atk: 0, def: 3, mdef: 0, hp: 9, maxHp: 9 }] });
    s = D.endTurn(D.endTurn(s));
    return { ...s, turn: 0, round: 0 };
  };
  const plain = make();
  const a = D.passResponse(D.attackMonster(plain, uid(plain, 0, 0), uid(plain, 1, 0)));
  assert.equal(at(a, 1, 0).hp, 8, "thường: 4 công trừ 3 thủ");
  withKeywords("may-chem", ["phep"], () => {
    const s = make();
    const b = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
    assert.equal(at(b, 1, 0).hp, 5, `phép: 4 sát thương phép, thủ phép 0 (${b.live})`);
  });
});

test("keyword Đâm xuyên: hạ quái thì sát thương thừa vào người chơi", () => {
  const make = () => {
    let s = board({ 0: ["may-chem", { atk: 9, hp: 10 }] }, { 0: ["rong-con", { atk: 0, def: 0, mdef: 0, hp: 2, maxHp: 2 }] });
    s = D.endTurn(D.endTurn(s));
    return { ...s, turn: 0, round: 0 };
  };
  const plain = make();
  const hp = plain.players[1].hp;
  const a = D.passResponse(D.attackMonster(plain, uid(plain, 0, 0), uid(plain, 1, 0)));
  assert.equal(a.players[1].hp, hp, "không keyword thì người chơi không mất máu");
  withKeywords("may-chem", ["dam-xuyen"], () => {
    const s = make();
    const b = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
    assert.equal(b.players[1].hp, hp - 7, b.live);
    assert.match(b.live, /Đâm xuyên gây 7/);
  });
});

test("Hộ vệ: chặn được kẻ có Siêu tốc; chỉ triệu hồi vào hàng trước", () => {
  const base = () => {
    let s = board({ 0: ["may-chem", { atk: 3, hp: 10 }] }, { 0: ["rong-con", { atk: 2, def: 1, mdef: 1, hp: 4 }] });
    s = D.endTurn(D.endTurn(s));
    return { ...s, turn: 0, round: 0 };
  };
  withKeywords("may-chem", ["sieu-toc"], () => {
    const plain = base();
    assert.match(D.assignBlock(D.attackFace(plain, uid(plain, 0, 0)), uid(plain, 1, 0)).live, /Siêu tốc/);
    withKeywords("rong-con", ["ho-ve"], () => {
      const s = base();
      const blocked = D.assignBlock(D.attackFace(s, uid(s, 0, 0)), uid(s, 1, 0));
      assert.equal(blocked.hold?.blocker, uid(s, 1, 0), blocked.live);
    });
  });
  let s = board({}, {});
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 8, flask: 0, stars: 4 })) };
  s = D.testGrant(s, 0, "hiep-si-ho-ve", false);
  const index = s.players[0].reserve.findIndex((p) => p.id === "hiep-si-ho-ve");
  assert.match(D.summon(s, index, 3).live, /hàng trước/);
  assert.ok(D.summon(s, index, 0).players[0].field[0], "hàng trước thì được");
});

/** Bỏ hộp hỏi giải phóng cầu ma lực (mana đầy) để bài thử đi tiếp. */
const calm = (s) => ({ ...s, gemCap: null, gemWarn: null });

test("Tháo vát: đánh 2 lần mỗi vòng, lần 3 không được", () => {
  const make = () => {
    let s = board({ 0: ["may-chem", { atk: 1, hp: 10 }] }, { 3: ["rong-con", { hp: 9 }] });
    s = D.endTurn(D.endTurn(s));
    return { ...s, turn: 0, round: 0 };
  };
  const twice = (s) => {
    const a = D.passResponse(D.attackFace(s, uid(s, 0, 0)));
    assert.equal(a.turn, 1, a.live);
    const back = calm(D.endTurn(calm(a)));
    assert.equal(back.turn, 0, back.live);
    return back;
  };
  const plain = twice(make());
  assert.notEqual(D.attackFace(plain, uid(plain, 0, 0)).pending?.kind, "face", "không keyword: chỉ 1 lần");
  withKeywords("may-chem", ["thao-vat"], () => {
    const back = twice(make());
    const second = D.attackFace(back, uid(back, 0, 0));
    assert.equal(second.pending?.kind, "face", second.live);
    const third = calm(D.endTurn(calm(D.passResponse(second))));
    assert.equal(third.turn, 0, third.live);
    assert.notEqual(D.attackFace(third, uid(third, 0, 0)).pending?.kind, "face", "lần 3 không được");
  });
});

test("Đá tảng: đánh bằng 70% máu, bị đánh trả cùng lúc; bị đánh thì phản đòn", () => {
  withKeywords("may-chem", ["da-tang"], () => {
    let s = board({ 0: ["may-chem", { atk: 0, def: 0, mdef: 0, hp: 10, maxHp: 10 }] }, { 0: ["rong-con", { atk: 3, def: 0, mdef: 0, hp: 20, maxHp: 20 }] });
    s = D.endTurn(D.endTurn(s));
    s = { ...s, turn: 0, round: 0 };
    const hit = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
    assert.equal(at(hit, 1, 0).hp, 13, hit.live);
    assert.equal(at(hit, 0, 0).hp, 7, "mục tiêu đánh trả cùng lúc");
    assert.ok(!hit.counterAsk, "không Trả đòn riêng");
    let t = board({ 0: ["khong-lo-mot-mat", { atk: 6, def: 0, mdef: 0, hp: 20, maxHp: 20 }] }, { 0: ["may-chem", { atk: 0, def: 2, mdef: 0, hp: 8, maxHp: 8 }] });
    t = D.endTurn(D.endTurn(t));
    t = { ...t, turn: 0, round: 0 };
    const struck = D.passResponse(D.attackMonster(t, uid(t, 0, 0), uid(t, 1, 0)));
    assert.equal(at(struck, 1, 0).hp, 4, struck.live);
    assert.equal(at(struck, 0, 0).hp, 16, "phản 2 chặn + 2 (25% của 8)");
  });
});

test("Trang bị: cộng chỉ số, quái rời sân thì về tay, lần 2 thêm 1 mana rồi mất hẳn", () => {
  const card = C.spellCard("mua-ma-thuat");
  const saved = { gear: card.gear, effect: card.effect };
  card.gear = true;
  card.effect = "+2 công, +3 máu";
  try {
    let s = board({ 0: ["rong-con", { atk: 1, def: 0, mdef: 0, hp: 2, maxHp: 2 }], 1: ["rong-con", { atk: 1, def: 0, mdef: 0, hp: 2, maxHp: 2 }] }, { 0: ["khong-lo-mot-mat", { atk: 30, hp: 30, maxHp: 30 }] });
    s = D.endTurn(D.endTurn(s));
    s = rich(withHand({ ...s, turn: 0, round: 0 }, 0, ["mua-ma-thuat"]));
    const orb = s.players[0].orb;
    const worn = D.castSpell(s, s.players[0].hand.indexOf("mua-ma-thuat"), uid(s, 0, 0));
    assert.equal(at(worn, 0, 0).atk, 3, worn.live);
    assert.equal(at(worn, 0, 0).hp, 5);
    assert.equal(at(worn, 0, 0).maxHp, 5);
    assert.equal(worn.players[0].orb, orb - card.gems);
    assert.ok(!worn.players[0].hand.includes("mua-ma-thuat"));
    const kill = (state, slot) => {
      let r = state.turn === 1 ? calm(D.endTurn(state)) : state;
      r = r.turn === 0 ? calm(D.endTurn(r)) : r;
      if (r.round !== 1) r = calm(D.endTurn(calm(D.endTurn(r))));
      assert.equal(r.round, 1, r.live);
      r = { ...r, turn: 1 };
      return D.passResponse(D.attackMonster(r, uid(r, 1, 0), uid(r, 0, slot)));
    };
    const dead = kill(worn, 0);
    assert.equal(at(dead, 0, 0), null, dead.live);
    const i = dead.players[0].hand.indexOf("mua-ma-thuat");
    assert.ok(i >= 0, "về tay");
    assert.equal(dead.players[0].tolls[i], true, "lần sau thêm 1 mana");
    let again = { ...rich(dead), turn: 0, round: 0, step: "main", pending: null, hold: null, skipped: [false, false] };
    const orb2 = again.players[0].orb;
    const worn2 = D.castSpell(again, i, uid(again, 0, 1));
    assert.equal(at(worn2, 0, 1).atk, 3, worn2.live);
    assert.equal(worn2.players[0].orb, orb2 - card.gems - 1);
    const dead2 = kill(worn2, 1);
    assert.equal(at(dead2, 0, 1), null, dead2.live);
    assert.ok(!dead2.players[0].hand.includes("mua-ma-thuat"), "lần 2 rời sân thì mất hẳn");
  } finally {
    card.gear = saved.gear;
    card.effect = saved.effect;
  }
});

test("Hoán đổi: chọn lá dự bị không đủ điều kiện thì vẫn còn quái bị nhắm, không đứng yên", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20 }], 1: ["may-chem", { hp: 20, maxHp: 20 }] });
  s = rich(withHand(s, 1, ["hoan-doi", "thuong-quan-long"]));
  s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, stars: 0 } : p)) };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  const cast = D.castSpell(swung, swung.players[1].hand.indexOf("hoan-doi"), uid(s, 1, 0));
  assert.ok(cast.swap?.locked, "Hoán đổi mở bước chọn");
  const bench = cast.players[1].reserve.findIndex((card) => card.id === "thuong-quan-long");
  assert.ok(bench >= 0, "lá dự bị 4 sao có trên tay");
  const refused = D.confirmSwap(cast, cast.swap.locked, `r:${bench}`);
  assert.equal(refused.swap?.locked, cast.swap.locked, "chọn sai vẫn giữ quái bị nhắm");
  const done = D.confirmSwap(refused, cast.swap.locked, `f:${uid(s, 1, 1)}`);
  assert.ok(!done.swap, "chọn quái hợp lệ thì xong");
});

test("Hoán đổi: swap không có quái bị nhắm bị bỏ, OK không kẹt; quái từ Hộp ma thuật không chọn được", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20 }], 1: ["may-chem", { hp: 20, maxHp: 20, abroad: 0 }] });
  s = rich(withHand(s, 1, ["hoan-doi"]));
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  const dead = { ...swung, swap: { first: null, side: 1 } };
  const passed = D.passResponse(dead);
  assert.ok(!passed.swap, "swap cụt bị bỏ");
  const cast = D.castSpell(swung, swung.players[1].hand.indexOf("hoan-doi"), uid(s, 1, 0));
  assert.ok(!cast.swap || D.swapRows(cast.players[1]).every((token) => token !== `f:${uid(s, 1, 1)}`), "quái abroad không nằm trong danh sách chọn");
});

test("Máy không chọn nước Hoán đổi hỏng", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20 }], 1: ["may-chem", { hp: 20, maxHp: 20 }] });
  s = rich(withHand(s, 1, ["hoan-doi", "thuong-quan-long"]));
  s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, stars: 0 } : p)) };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  const act = B.brainChoose(swung, 300);
  if (act) assert.ok(!B.runAct(swung, act).swap, `nước ${JSON.stringify(act)} không để swap dở`);
});

test("Đại hồng thuỷ huỷ diệt: chọn 1 quái, chỉ cả hàng của nó dính (chủ game 04/11)", () => {
  const tough = { hp: 40, maxHp: 40, mdef: 0 };
  for (const [aim, hitRow] of [[3, [3, 4, 5]], [1, [0, 1, 2]]]) {
    let s = board(
      { 0: ["trai-tim-hai-long"] },
      { 0: ["may-chem", tough], 1: ["may-chem", tough], 2: ["may-chem", tough], 3: ["may-chem", tough], 4: ["may-chem", tough], 5: ["may-chem", tough] },
    );
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, orb: 5, flask: 0, stars: 4 } : p)) };
    const cast = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, aim), 2);
    let done = cast;
    for (let i = 0; i < 6 && (done.pending || done.hold); i += 1) done = D.passResponse(done);
    for (let slot = 0; slot < 6; slot += 1) {
      const mon = at(done, 1, slot);
      assert.ok(mon, `ô ${slot} còn quái | ${done.live}`);
      if (hitRow.includes(slot)) assert.ok(mon.hp < 40, `ô ${slot} phải dính | ${done.live}`);
      else assert.equal(mon.hp, 40, `ô ${slot} không được dính | ${done.live}`);
    }
  }
});

test("luật 12/11: đổi bài xong, cả hai bên tự rút 1 lá, tốn 1 gem, vòng 1 không rút thêm", () => {
  let s = D.createDuel(undefined, "ai");
  assert.ok(s.opener, "trận Vs Máy còn bảng đổi bài của người chơi");
  assert.equal(s.players[0].draws, 0, "chưa đổi bài thì chưa rút");
  const hand0 = s.players[0].reserve.length + s.players[0].hand.length;
  const hand1 = s.players[1].reserve.length + s.players[1].hand.length;
  const pile0 = D.pileLeft(s.players[0]);
  const orb = [s.players[0].orb, s.players[1].orb];
  s = D.openerSwap(s, 0, { reserve: [], hand: [] });
  assert.equal(s.opener, null);
  for (const side of [0, 1]) {
    const p = s.players[side];
    assert.equal(p.draws, 1, `bên ${side} đã rút`);
    assert.equal(p.orb, orb[side] - 1, `bên ${side} trả 1 gem`);
  }
  assert.equal(s.players[0].reserve.length + s.players[0].hand.length, hand0 + 1);
  assert.equal(s.players[1].reserve.length + s.players[1].hand.length, hand1 + 1);
  assert.equal(D.pileLeft(s.players[0]), pile0 - 1);
  const again = D.draw(s);
  assert.equal(again.players[0].draws, 1, "vòng 1 không rút thêm");
});

test("luật 0.2: Vãy phá giáp trừ 2 thủ TRƯỚC rồi mới tính sát thương", () => {
  let s = board({ 0: ["khung-long-vay-kiem", { atk: 4, def: 0, hp: 10, maxHp: 10 }] }, { 0: ["khong-lo-mot-mat", { atk: 0, def: 3, mdef: 0, hp: 10, maxHp: 10 }] });
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(at(done, 1, 0).def, 1, done.live);
  assert.equal(at(done, 1, 0).hp, 7, `4 công vào thủ 3 - 2 = 1 → 3 sát thương | ${done.live}`);
});

test("luật 0.2: Hoả cầu giảm 1 thủ phép TRƯỚC rồi mới gây sát thương phép", () => {
  let s = board({ 0: ["rong-phun-hoa-cau"] }, { 0: ["khong-lo-mot-mat", { atk: 0, def: 0, mdef: 2, hp: 10, maxHp: 10 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3 })) };
  let next = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 1);
  for (let i = 0; i < 3 && next.step === "respond"; i++) next = D.passResponse(next);
  assert.equal(at(next, 1, 0).mdef, 1, next.live);
  assert.equal(at(next, 1, 0).hp, 8, `3 phép vào thủ phép 2 - 1 = 1 → 2 sát thương | ${next.live}`);
});

const FOG = (s, side) => ({ ...s, players: s.players.map((p, i) => (i === side ? { ...p, env: H.FOG_ENV } : p)) });

test("Ẩn: triệu hồi Ẩn tốn thêm 1 mana, đứng úp; quái 5 sao không ẩn; hiến tế/triệu hồi thường không ẩn", () => {
  let s = board({}, {});
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0, stars: 4 })) };
  s = D.testGrant(s, 0, "rong-con", false);
  const idx = s.players[0].reserve.findIndex((p) => p.id === "rong-con");
  const gems = C.monsterCard("rong-con").gems;
  const plain = D.summon(s, idx, 0);
  const hid = D.summonHidden(s, idx, 0);
  assert.equal(at(plain, 0, 0).lurk, undefined, "thường không ẩn");
  assert.equal(at(hid, 0, 0).lurk?.left, 4, hid.live);
  assert.equal(at(hid, 0, 0).lurk?.wake, 2);
  assert.equal(s.players[0].orb - hid.players[0].orb, gems + H.HIDE_FEE, "tốn thêm 1 mana");
  const poor = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, orb: gems, flask: 0 } : p)) };
  assert.equal(at(D.summonHidden(poor, idx, 0), 0, 0), null, "thiếu mana phí Ẩn thì không được");
});

test("Ẩn hết 4 vòng: không sương mù thì lật thành quái thường; có sương mù thì về xấp, rút 1, triệu hồi phản ứng Ẩn", () => {
  for (const fog of [false, true]) {
    let s = board({}, {});
    s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0, stars: 4 })) };
    if (fog) s = FOG(s, 0);
    s = D.testGrant(s, 0, "may-chem", false);
    s = D.summonHidden(s, s.players[0].reserve.findIndex((p) => p.id === "may-chem"), 0);
    for (let n = 0; n < 3; n++) s = closeRound(s);
    assert.equal(at(s, 0, 0).lurk.left, 1);
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, field: p.field.map((m, k) => (k === 0 ? { ...m, hp: 1 } : m)) } : p)) };
    s = D.testGrant(s, 0, "rong-con", false);
    const pile = s.players[0].monsterDeck.length + s.players[0].spellDeck.length;
    s = closeRound(s);
    if (!fog) {
      assert.equal(at(s, 0, 0)?.cardId, "may-chem", `ở lại sân | ${s.live}`);
      assert.equal(at(s, 0, 0).lurk, undefined, "thành quái thường");
      assert.equal(s.lurkAsk ?? null, null);
      assert.ok(s.dodge?.uids.includes(uid(s, 0, 0)), "loé sáng");
      continue;
    }
    assert.equal(at(s, 0, 0), null, `về xấp | ${s.live}`);
    assert.equal(s.lurkAsk?.side, 0);
    assert.equal(s.players[0].monsterDeck.length + s.players[0].spellDeck.length, pile, "về xấp 1, rút 1");
    const back = [...s.players[0].monsterDeck, ...s.players[0].reserve].find((p) => p.id === "may-chem" && p.saved);
    assert.equal(back?.hp, 1, "giữ máu");
    const pick = D.lurkChoices(s, 0).find((row) => row.id === "rong-con");
    assert.ok(pick?.ok);
    const summons = s.players[0].summons;
    const done = D.answerLurk(s, pick.index);
    assert.equal(at(done, 0, 0)?.cardId, "rong-con", done.live);
    assert.equal(at(done, 0, 0).lurk?.left, 4, "ra sân ẩn");
    assert.equal(done.players[0].summons, summons, "không tính lượt triệu hồi");
    assert.equal(D.answerLurk(s, null).lurkAsk, null);
  }
});

test("Ẩn bị đánh: giao tranh xong (kể cả Trả đòn) thì lật; không sương mù ở lại sân, có sương mù về xấp; chết thì chết thường", () => {
  for (const fog of [false, true]) {
    let s = board({ 0: ["khong-lo-mot-mat", { atk: 2, def: 0, hp: 9, maxHp: 9 }] }, { 0: ["may-chem", { atk: 1, def: 0, hp: 8, maxHp: 8, lurk: { left: 4, wake: 2 } }] });
    s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0 })) };
    if (fog) s = FOG(s, 1);
    let next = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
    assert.ok(next.counterAsk, `được hỏi Trả đòn | ${next.live}`);
    assert.ok(at(next, 1, 0)?.lurk, "chưa lật khi còn Trả đòn");
    next = D.pickCounter(next, "phys");
    if (fog) {
      assert.equal(at(next, 1, 0), null, `về xấp sau Trả đòn | ${next.live}`);
      assert.equal(next.lurkAsk?.side, 1);
    } else {
      assert.equal(at(next, 1, 0)?.cardId, "may-chem", next.live);
      assert.equal(at(next, 1, 0).lurk, undefined);
    }
  }
  let dead = FOG(board({ 0: ["khong-lo-mot-mat", { atk: 9, def: 0, hp: 9, maxHp: 9 }] }, { 0: ["may-chem", { atk: 1, def: 0, hp: 2, maxHp: 2, lurk: { left: 4 } }] }), 1);
  dead = D.passResponse(D.attackMonster(dead, uid(dead, 0, 0), uid(dead, 1, 0)));
  assert.equal(dead.lurkAsk ?? null, null, "chết thì không hỏi");
});

test("Ẩn: tự đánh ở lượt mình thì lộ diện thành quái thường", () => {
  let s = board({ 0: ["may-chem", { atk: 2, hp: 9, maxHp: 9, lurk: { left: 4 } }] }, {});
  const swung = D.attackFace(s, uid(s, 0, 0));
  assert.equal(at(swung, 0, 0).lurk, undefined, swung.live);
  assert.equal(at(D.passResponse(swung), 0, 0)?.cardId, "may-chem");
});

test("Ẩn chủ động: đủ 2 vòng (3 nếu triệu hồi ở vòng đối thủ) thì Kích hoạt, lật có loé sáng", () => {
  let s = board({}, {});
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0, stars: 4 })) };
  s = D.testGrant(s, 0, "may-chem", false);
  s = D.summonHidden(s, s.players[0].reserve.findIndex((p) => p.id === "may-chem"), 0);
  assert.equal(at(s, 0, 0).lurk?.wake, 2);
  s = D.testGrant(s, 1, "may-chem", false);
  s = D.summonHidden(s, s.players[1].reserve.findIndex((p) => p.id === "may-chem"), 0);
  assert.equal(at(s, 1, 0).lurk?.wake, 3, "triệu hồi ở vòng đối thủ thì chờ 3");
  s = closeRound(s);
  assert.ok(!D.lurkReady(at(s, 0, 0)));
  s = closeRound(s);
  assert.ok(D.lurkReady(at(s, 0, 0)), "đủ 2 vòng");
  assert.ok(!D.lurkReady(at(s, 1, 0)), "bên kia chưa đủ 3");
  if (s.turn !== 0) s = D.endTurn(s);
  const woke = D.wakeLurk(s, uid(s, 0, 0));
  assert.equal(at(woke, 0, 0)?.lurk, undefined, woke.live);
  assert.ok(woke.dodge?.uids.includes(uid(s, 0, 0)), "loé sáng");
  const fogWoke = D.wakeLurk(FOG(s, 0), uid(s, 0, 0));
  assert.equal(at(fogWoke, 0, 0), null, "có sương mù thì về xấp");
});

test("Đắm tàu: quái đánh vật lý vào Kraken bị tiêu diệt ngay, Kraken không mất máu; đòn phép thì không", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 9, maxHp: 9 }] }, { 0: ["kraken", { hp: 3, maxHp: 3 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0 })) };
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(at(done, 0, 0), null, `kẻ đánh bị tiêu diệt | ${done.live}`);
  assert.equal(at(done, 1, 0)?.hp, 3, "Kraken không mất máu");
  assert.ok(done.dodge?.uids.includes(uid(s, 1, 0)), "loé sáng");
  withKeywords("khong-lo-mot-mat", ["phep"], () => {
    const magic = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
    assert.equal(at(magic, 0, 0)?.cardId, "khong-lo-mot-mat", `đòn phép không kích hoạt Đắm tàu | ${magic.live}`);
  });
});

test("Phản phép: quái có Đòn đánh phép đánh vào Sứa bị tiêu diệt ngay; đòn vật lý thì không; Kraken ẩn bị đánh vẫn kích hoạt và lật", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 9, maxHp: 9 }] }, { 0: ["sua-hut-ma-phap", { hp: 2, maxHp: 2 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0 })) };
  withKeywords("khong-lo-mot-mat", ["phep"], () => {
    const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
    assert.equal(at(done, 0, 0), null, `kẻ đánh bị tiêu diệt | ${done.live}`);
    assert.equal(at(done, 1, 0)?.hp, 2, "Sứa không mất máu");
  });
  const phys = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(at(phys, 0, 0)?.cardId, "khong-lo-mot-mat", "đòn vật lý không kích hoạt Phản phép");
  let k = board({ 0: ["khong-lo-mot-mat", { atk: 4, def: 0, hp: 9, maxHp: 9 }] }, { 0: ["kraken", { hp: 3, maxHp: 3, lurk: { left: 4, wake: 2 } }] });
  k = { ...k, players: k.players.map((p) => ({ ...p, orb: 3, flask: 0 })) };
  const hit = D.passResponse(D.attackMonster(k, uid(k, 0, 0), uid(k, 1, 0)));
  assert.equal(at(hit, 0, 0), null, hit.live);
  assert.equal(at(hit, 1, 0)?.lurk, undefined, "lật thành quái thường");
});

test("Khổng lồ thủ lĩnh: Đập phá +1 công và hồi 1 máu (không vượt máu tối đa); mặc giáp chỉ +1 công", () => {
  for (const [id, heal] of [["khong-lo-thu-linh", 1], ["khong-lo-mac-giap", 0]]) {
    let s = board({ 0: [id, { hp: 5, maxHp: 9 }] }, { 0: ["may-chem", { hp: 20, maxHp: 20, atk: 0 }] });
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, orb: 2 } : p)) };
    const atk0 = at(s, 0, 0).atk;
    const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
    const me = at(done, 0, 0);
    assert.equal(me.atk, atk0 + 1, "+1 công");
    assert.equal(me.hp, 5 + heal, "hồi máu");
  }
});

test("Dung hợp: ra quái N sao cần người chơi từ N-1 sao (rồng ác ma 5 sao cần 4 sao)", () => {
  let s = board({ 0: ["mat-do-tan-pha", {}] }, {});
  s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, reserve: [{ id: "trieu-hoi-ac-ma" }] } : p)) };
  const need = C.monsterCard("rong-ac-ma").stars - 1;
  const set = (n) => ({ ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, stars: n } : p)) });
  const uidA = at(s, 0, 0).uid;
  const low = D.fuse(set(need - 1), 0, uidA, 1);
  assert.equal(low.players[0].reserve.length, 1, "thiếu sao: không dung hợp");
  assert.match(low.live, /Cần/);
  const ok = D.fuse(set(need), 0, uidA, 1);
  assert.equal(ok.players[0].reserve.length, 0, "đủ N-1 sao: dung hợp được");
});

test("Dung hợp Khổng lồ (18/11): 3 lá 1 mắt trên tay chọn Mặc giáp hoặc Thủ lĩnh; tính 1 lượt triệu hồi; thiếu sao thì đứng yên", () => {
  const withHand = (s, ids, extra = {}) => ({ ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, reserve: ids.map((id) => ({ id, hp: 3, maxHp: 3 })), stars: 2, orb: 3, summons: 0, fresh: [], ...extra } : p)) });
  const s = withHand(board({}, {}), ["khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat"]);
  const ways = D.setFusionsFor(s, 0, 0).map((w) => w.result).sort();
  assert.deepEqual(ways, ["khong-lo-mac-giap", "khong-lo-thu-linh"]);
  const boss = D.fuseSet(s, 0, "khong-lo-thu-linh", 0);
  assert.equal(at(boss, 0, 0)?.cardId, "khong-lo-thu-linh", boss.live);
  assert.equal(boss.players[0].reserve.length, 0, "dùng cả 3 lá trên tay");
  assert.equal(boss.players[0].summons, 1, "tính 1 lượt triệu hồi");
  assert.equal(at(boss, 0, 0).dim, true, "3 sao mà mình 2 sao: không hành động lượt này");
  const armor = D.fuseSet(s, 0, "khong-lo-mac-giap", 0);
  assert.equal(at(armor, 0, 0)?.cardId, "khong-lo-mac-giap");
  assert.equal(armor.players[0].reserve.length, 1, "Mặc giáp dùng 2 lá, còn 1");
  assert.equal(at(armor, 0, 0).dim, false, "2 sao đủ sao: hành động được");
  // Nguyên liệu ưu tiên quái trên sân: sân có 1 mắt + tay 2 lá, Mặc giáp dùng lá sân + lá kéo ra, giữ 1 lá trên tay.
  const keep = D.fuseSet(withHand(board({ 0: ["khong-lo-mot-mat", {}] }, {}), ["khong-lo-mot-mat", "khong-lo-mot-mat"]), 0, "khong-lo-mac-giap", 1);
  assert.equal(at(keep, 0, 1)?.cardId, "khong-lo-mac-giap", keep.live);
  assert.equal(keep.players[0].reserve.length, 1, "giữ lại 1 lá trên tay");
  assert.equal(at(keep, 0, 0), null, "quái trên sân được dùng làm nguyên liệu");
  // Đã triệu hồi quái khác vòng này: không dung hợp được.
  const used = D.fuseSet(withHand(board({}, {}), ["khong-lo-mot-mat", "khong-lo-mot-mat"], { summons: 1 }), 0, "khong-lo-mac-giap", 0);
  assert.equal(used.players[0].reserve.length, 2, "đã dùng lượt triệu hồi");
  // Lỡ kéo 1 lá nguyên liệu ra sân: vẫn dung hợp được (châm chước).
  let lap = withHand(board({}, {}), ["khong-lo-mot-mat", "khong-lo-mot-mat"]);
  lap = D.summon(lap, 0, 0);
  lap = { ...lap, turn: 0, step: "main", hold: null, pending: null };
  const after = D.fuseSet(lap, 0, "khong-lo-mac-giap", 0);
  assert.equal(at(after, 0, 0)?.cardId, "khong-lo-mac-giap", after.live);
  // Dung hợp cũ (Kỵ sĩ bóng tối + Lời nguyền của rồng) cũng tính lượt triệu hồi.
  let old = board({ 0: ["ky-si-bong-toi", {}] }, {});
  old = { ...old, players: old.players.map((p, i) => (i === 0 ? { ...p, stars: 4, orb: 3, summons: 1, fresh: [], reserve: [{ id: "loi-nguyen-cua-rong", hp: 4, maxHp: 4 }] } : p)) };
  const barred = D.fuse(old, 0, uid(old, 0, 0), 0);
  assert.equal(barred.players[0].reserve.length, 1, "đã triệu hồi quái khác: không dung hợp");
});

test("Phù thuỷ tập sự / bậc thầy (18/11): dung hợp từ tí hơn, Cầu sấm +1, bậc thầy giết mục tiêu thì Cầu sấm tăng 1 vĩnh viễn", () => {
  const hand = (s, ids, stars) => ({ ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, reserve: ids.map((id) => ({ id, hp: 3, maxHp: 3 })), stars, orb: 3, summons: 0, fresh: [] } : p)) });
  const base = hand(board({}, {}), ["phu-thuy-ti-hon", "phu-thuy-ti-hon", "phu-thuy-ti-hon"], 3);
  const ways = D.setFusionsFor(base, 0, 0).map((w) => w.result).sort();
  assert.deepEqual(ways, ["phu-thuy-bac-thay", "phu-thuy-tap-su"]);
  // Cầu sấm: tí hơn 2 + sao, tập sự 3 + sao, bậc thầy 3 + sao (sao 3: 5 / 6 / 6).
  const hit = (id, extraMon = {}) => {
    let s = board({ 0: [id, extraMon] }, { 0: ["may-chem", { hp: 20, maxHp: 20, def: 0, mdef: 0 }] });
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, stars: 3, orb: 3 } : p)) };
    const done = D.passResponse(D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0, false, null));
    return { s: done, dealt: 20 - (at(done, 1, 0)?.hp ?? 0) };
  };
  assert.equal(hit("phu-thuy-ti-hon").dealt, 5);
  assert.equal(hit("phu-thuy-tap-su").dealt, 6);
  assert.equal(hit("phu-thuy-bac-thay").dealt, 6);
  // Bậc thầy giết được mục tiêu: Cầu sấm của nó +1 vĩnh viễn; không giết thì không tăng.
  let kill = board({ 0: ["phu-thuy-bac-thay", {}] }, { 0: ["may-chem", { hp: 2, maxHp: 2, def: 0, mdef: 0 }] });
  kill = { ...kill, players: kill.players.map((p, i) => (i === 0 ? { ...p, stars: 3, orb: 3 } : p)) };
  const killed = D.passResponse(D.useSkill(kill, uid(kill, 0, 0), uid(kill, 1, 0), 0, false, null));
  assert.equal(at(killed, 1, 0), null, killed.live);
  assert.equal(at(killed, 0, 0).skillUp, 1, "giết được: +1 vĩnh viễn");
  const miss = hit("phu-thuy-bac-thay").s;
  assert.ok(!at(miss, 0, 0).skillUp, "không giết: không tăng");
});

test("Chiến binh kỳ nhông / cưỡi rồng (18/11): dung hợp với Rồng con, Linh hoạt né 65% đòn từ 5 sát thương, Cưỡi rồng nửa công chuẩn + hồi máu", () => {
  const real = Math.random;
  const rolled = (n, fn) => {
    Math.random = () => n;
    try {
      return fn();
    } finally {
      Math.random = real;
    }
  };
  // Chuỗi chờ gieo bằng mầm riêng (hold.seed): bỏ mầm để Math.random giả có tác dụng.
  const unseeded = (s) => (s.hold ? { ...s, hold: { ...s.hold, seed: undefined } } : s);
  // Dung hợp: Chiến binh kỳ nhông trên tay + Rồng con trên sân (hoặc trên tay).
  let f = board({ 0: ["rong-con", {}] }, {});
  f = { ...f, players: f.players.map((p, i) => (i === 0 ? { ...p, reserve: [{ id: "chien-binh-ky-nhong", hp: 4, maxHp: 4 }], stars: 2, orb: 3, summons: 0, fresh: [] } : p)) };
  assert.deepEqual(D.setFusionsFor(f, 0, 0).map((w) => w.result), ["chien-binh-cuoi-rong"]);
  // Đánh thường công 6 vào kỳ nhông: gieo trúng thì né (không mất máu, có dấu chớp sáng); gieo trượt thì trúng.
  const melee = (atk, n) => {
    const s = board({ 0: ["may-chem", { atk, hp: 9, maxHp: 9 }] }, { 0: ["chien-binh-ky-nhong", { atk: 0 }] });
    return rolled(n, () => D.passResponse(unseeded(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)))));
  };
  const dodged = melee(6, 0);
  assert.equal(at(dodged, 1, 0).hp, 4, dodged.live);
  assert.ok(dodged.dodge?.uids.includes(uid(dodged, 1, 0)), "có dấu né để chớp sáng");
  assert.ok(at(melee(6, 0.99), 1, 0) === null || at(melee(6, 0.99), 1, 0).hp < 4, "gieo trượt: trúng đòn");
  assert.ok(at(melee(4, 0), 1, 0) === null || at(melee(4, 0), 1, 0).hp < 4, "công 4 (dưới 5): không né");
  // Skill: Cầu sấm của Phù thuỷ bậc thầy (6 sát thương phép) né được; Hơi thở rồng (2 chuẩn + 1 phép = 3) thì không.
  const skill = (id, n) => {
    let s = board({ 0: [id, {}] }, { 0: ["chien-binh-ky-nhong", { atk: 0 }] });
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, stars: 3, orb: 3 } : p)) };
    return rolled(n, () => D.passResponse(unseeded(D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0, false, null))));
  };
  const hex = skill("phu-thuy-bac-thay", 0);
  assert.equal(at(hex, 1, 0).hp, 4, hex.live);
  assert.match(hex.live, /né đòn/);
  assert.ok(hex.players[0].orb < 3, "skill vẫn tốn mana");
  const breath = skill("rong-con", 0);
  assert.ok(!at(breath, 1, 0) || at(breath, 1, 0).hp < 4, "đòn 3 sát thương: không né");
  // Cưỡi rồng: công 4 = 2 vật lý + 2 chuẩn; vào quái thủ 1 mất 3 máu, nó hồi 2 máu.
  let r = board({ 0: ["chien-binh-cuoi-rong", { hp: 3, maxHp: 6 }] }, { 0: ["may-chem", { atk: 0, def: 1, mdef: 0, hp: 20, maxHp: 20 }] });
  r = D.passResponse(D.attackMonster(r, uid(r, 0, 0), uid(r, 1, 0)));
  assert.equal(at(r, 1, 0).hp, 17, r.live);
  assert.equal(at(r, 0, 0).hp, 5, r.live);
  // Vào người chơi: mất 4 máu, nó hồi 2.
  let face = board({ 0: ["chien-binh-cuoi-rong", { hp: 3, maxHp: 6 }] }, {});
  const hp = face.players[1].hp;
  face = D.passResponse(D.attackFace(face, uid(face, 0, 0)));
  assert.equal(face.players[1].hp, hp - 4, face.live);
  assert.equal(at(face, 0, 0).hp, 5, face.live);
});

test("Gió dịu đi: Nắng và gió ẩn bị đánh thì tự lật, chặn đòn; kẻ đánh đã hành động, đối thủ mất 1 mana và 1 mana trong mộ", () => {
  let s = board({ 0: ["rong-con", { atk: 3, hp: 9, maxHp: 9 }] }, { 0: ["nang-va-gio", { hp: 4, maxHp: 4, lurk: { left: 4, wake: 2 } }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0, starGems: 2 })) };
  const aimed = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(at(aimed, 1, 0)?.lurk, undefined, `tự lật lúc bị nhắm | ${aimed.live}`);
  assert.ok(aimed.hold?.breeze && aimed.hold.mirror === "up" && aimed.hold.priority === 0, "lên hàng chờ, bên đánh đáp trước");
  assert.match(D.assignBlock(D.passResponse(aimed), uid(s, 1, 0)).live, /Gió dịu đi/);
  const done = D.passResponse(D.passResponse(aimed));
  assert.equal(at(done, 1, 0)?.hp, 4, `không mất máu | ${done.live}`);
  assert.ok(at(done, 0, 0)?.dim, "kẻ đánh đã hành động");
  assert.equal(done.players[0].orb, aimed.players[0].orb - 1, "mất 1 mana");
  assert.equal(done.players[0].starGems, aimed.players[0].starGems - 1, "mất 1 mana trong mộ");
  // Không ẩn: đánh trúng như thường.
  const open = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, field: p.field.map((m) => (m ? { ...m, lurk: undefined } : m)) } : p)) };
  const plain = D.passResponse(D.attackMonster(open, uid(s, 0, 0), uid(s, 1, 0)));
  assert.ok(at(plain, 1, 0) === null || at(plain, 1, 0).hp < 4, plain.live);
});

test("Nắng ấm lên: skill chậm, trả 2 mana lúc lên hàng chờ; nổ thì 1 chuẩn lên mọi quái trừ nó và 2 người chơi, hoàn 1 mana; bị Hấp thụ nuốt thì mất mana", () => {
  let s = board({ 0: ["nang-va-gio", { hp: 4, maxHp: 4 }], 1: ["may-chem", { hp: 5, maxHp: 5, def: 5 }] }, { 0: ["rong-con", { hp: 5, maxHp: 5, def: 5 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0 })) };
  const hp = s.players.map((p) => p.hp);
  const queued = D.declareSkill(s, uid(s, 0, 0), null, 0);
  assert.equal(queued.step, "respond", queued.live);
  assert.equal(queued.players[0].orb, 1, "trả 2 mana lúc lên hàng chờ");
  assert.match(D.assignBlock(queued, uid(s, 1, 0)).live, /không chặn được/);
  const done = D.passResponse(queued);
  assert.equal(at(done, 0, 0).hp, 4, "không trúng chính nó");
  assert.equal(at(done, 0, 1).hp, 4, `đồng minh mất 1 dù thủ cao | ${done.live}`);
  assert.equal(at(done, 1, 0).hp, 4, "quái địch mất 1");
  assert.deepEqual(done.players.map((p) => p.hp), hp.map((n) => n - 1), "2 người chơi mất 1");
  assert.equal(done.players[0].orb, 2, "hoàn 1 mana");
  const withAbsorb = D.testGrant(queued, 1, "hap-thu-ma-phap", false);
  const eaten = D.castSpell({ ...withAbsorb, players: withAbsorb.players.map((p, i) => (i === 1 ? { ...p, orb: 3 } : p)) }, withAbsorb.players[1].hand.indexOf("hap-thu-ma-phap"), null);
  assert.equal(eaten.step, "main", eaten.live);
  assert.equal(at(eaten, 1, 0).hp, 5, "bị nuốt thì không nổ");
  assert.equal(eaten.players[0].orb, 1, "không hoàn mana");
  const poor = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, orb: 1 } : p)) };
  assert.match(D.declareSkill(poor, uid(s, 0, 0), null, 0).live, /Cần 2 gem/);
});

/** Đòn cuối cùng (chủ game 20/11): bên 0 đánh hạ quái của bên 1; bên 1 cầm lá. */
function riteBoard(victim, killer) {
  let s = board({ 0: killer }, { 0: victim });
  s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: 3, flask: 0, hand: i === 1 ? [D.RITE_CARD] : [], tolls: [] })) };
  return D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
}

test("Đòn cuối cùng (20/11): quái bị quái địch hạ, quyền về chủ thì quái chết ra đòn cuối, sát thương chuẩn, chỉ 1 mana", () => {
  const dead = riteBoard(["may-chem", { atk: 3, def: 0, hp: 2, maxHp: 2 }], ["khong-lo-mot-mat", { atk: 5, def: 4, mdef: 4, hp: 10, maxHp: 10 }]);
  assert.equal(at(dead, 1, 0), null, "quái bên 1 chết: " + dead.live);
  assert.equal(dead.turn, 1, "quyền về bên bị hạ");
  assert.equal(D.riteDeadFor(dead, 1).length, 1, "lá chớp");
  const cast = D.castSpell(dead, 0, null);
  assert.equal(cast.players[1].hand.length, 0, cast.live);
  assert.equal(cast.players[1].orb, 2, "trả 1 mana của lá");
  assert.equal(at(cast, 1, 0)?.cardId, "may-chem", "quái chết gượng dậy");
  assert.equal(cast.counterAsk?.from, uid(dead, 0, 0));
  const hit = D.pickCounter(cast, "phys");
  assert.equal(at(hit, 0, 0).hp, 7, "3 sát thương chuẩn, bỏ qua 4 thủ: " + hit.live);
  assert.equal(at(hit, 1, 0), null, "đòn xong thì quái lại biến mất");
  assert.equal(hit.players[1].orb, 2, "không trả phí Trả đòn");
  assert.equal(hit.turn, 1, "quyền vẫn ở bên dùng lá");
  assert.equal(hit.rites ?? null, null);
});

test("Đòn cuối cùng: skill Trả đòn đơn mục tiêu thành sát thương chuẩn, không tốn mana của skill", () => {
  const dead = riteBoard(["rong-con", { atk: 1, def: 0, hp: 1, maxHp: 1 }], ["khong-lo-mot-mat", { atk: 5, def: 0, mdef: 5, hp: 20, maxHp: 20 }]);
  const cast = D.castSpell(dead, 0, null);
  const ghost = at(cast, 1, 0);
  assert.equal(ghost?.cardId, "rong-con");
  const hp = at(cast, 0, 0).hp;
  const burned = D.declareSkill(cast, ghost.uid, uid(cast, 0, 0), 0);
  assert.ok(at(burned, 0, 0).hp < hp, "Hơi thở rồng xuyên 5 thủ phép: " + burned.live);
  assert.equal(burned.players[1].orb, 2, "chỉ trả 1 mana của lá");
  assert.equal(at(burned, 1, 0), null, burned.live);
});

test("Đòn cuối cùng: qua việc khác là mất cơ hội; kẻ hạ đã chết hoặc chủ động đánh rồi chết thì không chớp", () => {
  const dead = riteBoard(["may-chem", { atk: 3, def: 0, hp: 2, maxHp: 2 }], ["khong-lo-mot-mat", { atk: 5, def: 0, hp: 10, maxHp: 10 }]);
  const passed = D.endTurn(dead);
  assert.equal(D.riteDeadFor(passed, 1).length, 0, "bỏ lượt là mất");
  // Kẻ hạ không còn trên sân: lá không chớp.
  const gone = { ...dead, players: dead.players.map((p, i) => (i === 0 ? { ...p, field: Array(6).fill(null) } : p)) };
  assert.equal(D.riteDeadFor(gone, 1).length, 0, "kẻ hạ đã chết");
  // Bên 0 chủ động đánh, chết vì Trả đòn: quyền về đối thủ, không dùng được.
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 1, def: 0, hp: 2, maxHp: 2 }] }, { 0: ["khong-lo-mot-mat", { atk: 9, def: 0, hp: 20, maxHp: 20 }] });
  s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: 3, hand: i === 0 ? [D.RITE_CARD] : [], tolls: [] })) };
  const open = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  const back = D.pickCounter(open, "phys");
  assert.equal(at(back, 0, 0), null, back.live);
  assert.equal(D.riteDeadFor(back, 0).length, 0, "đánh rồi chết vì Trả đòn: không kích hoạt");
});

test("Huỷ diệt (20/11): phép chậm 2 mana, giết thẳng 1 quái địch kể cả hàng sau và 5 sao; chỉ Hấp thụ ma pháp hoá giải", () => {
  const make = (theirs) => {
    let s = board({ 0: ["may-chem", {}] }, theirs);
    return { ...s, players: s.players.map((p, i) => ({ ...p, orb: 3, flask: 0, hand: i === 0 ? ["huy-diet"] : ["hoan-doi", "hap-thu-ma-phap"], tolls: [] })) };
  };
  // Hàng sau, máu nhiều, thủ cao: vẫn chết.
  let s = make({ 0: ["khong-lo-mot-mat", {}], 3: ["chien-binh-rong", { hp: 30, maxHp: 30, def: 9, mdef: 9 }] });
  const back = uid(s, 1, 3);
  const cast = D.castSpell(s, 0, back);
  assert.equal(cast.step, "respond", "phép chậm chờ phản ứng: " + cast.live);
  assert.equal(cast.players[0].orb, 1, "2 mana");
  assert.match(D.castSpell(cast, 0, null).live, /Chỉ Hấp thụ ma pháp/, "Hoán đổi không đáp được");
  assert.equal(D.assignBlock(cast, uid(cast, 1, 0)).hold?.blocker ?? null, null, "không chặn được");
  const done = D.passResponse(cast);
  assert.equal(at(done, 1, 3), null, "chết ngay: " + done.live);
  assert.ok(at(done, 1, 0), "quái khác còn nguyên");
  assert.equal(done.rites ?? null, null, "phép không mở Đòn cuối cùng");
  // Quái 5 sao cũng chết.
  let five = make({ 0: ["rong-ac-ma", {}] });
  five = D.passResponse(D.castSpell(five, 0, uid(five, 1, 0)));
  assert.equal(at(five, 1, 0), null, five.live);
  // Hấp thụ ma pháp hoá giải: quái sống.
  let eat = make({ 0: ["khong-lo-mot-mat", {}] });
  eat = D.castSpell(eat, 0, uid(eat, 1, 0));
  eat = D.castSpell(eat, 1, null);
  eat = D.passResponse(D.passResponse(eat));
  assert.ok(at(eat, 1, 0), "Hấp thụ ma pháp cứu: " + eat.live);
});

test("Bẫy thú (20/11): quái địch máu dưới 4 vừa triệu hồi thì quyền về mình bẫy được ngay; qua việc khác là mất", () => {
  let s = board({ 0: ["khong-lo-mot-mat", {}] }, {});
  s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: 3, flask: 0, stars: 4, hand: i === 1 ? [D.TRAP_CARD] : [], tolls: [] })) };
  s = D.testGrant(s, 0, "may-chem", false);
  const summoned = D.summon(s, s.players[0].reserve.findIndex((p) => p.id === "may-chem"), 1);
  const fresh = uid(summoned, 0, 1);
  assert.equal(summoned.turn, 1);
  assert.deepEqual(D.trapPicks(summoned, 1), [fresh], "Máy chém máu dưới 4: lá chớp");
  const cast = D.castSpell(summoned, 0, fresh);
  assert.equal(cast.step, "respond", "phép nhanh chờ đối thủ đáp: " + cast.live);
  assert.equal(cast.players[1].orb, 2, "1 mana");
  const done = D.passResponse(cast);
  assert.equal(at(done, 0, 1), null, "Máy chém chết: " + done.live);
  assert.ok(at(done, 0, 0), "quái khác còn");
  // Bỏ lượt là mất.
  assert.equal(D.trapPicks(D.endTurn(summoned), 1).length, 0);
  // Máu từ 4 trở lên: không bẫy được.
  const tough = { ...summoned, players: summoned.players.map((p, i) => (i === 0 ? { ...p, field: p.field.map((m) => (m?.uid === fresh ? { ...m, hp: 4, maxHp: 4 } : m)) } : p)) };
  assert.equal(D.trapPicks(tough, 1).length, 0, "máu 4 không bẫy");
  // Quái ẩn chưa lật: không bẫy được.
  const hidden = { ...summoned, players: summoned.players.map((p, i) => (i === 0 ? { ...p, field: p.field.map((m) => (m?.uid === fresh ? { ...m, lurk: { left: 4 } } : m)) } : p)) };
  assert.equal(D.trapPicks(hidden, 1).length, 0, "quái ẩn không bẫy");
});

test("Bẫy thú: quái máu dưới 4 đưa đòn đánh lên hàng chờ thì bẫy trong chuỗi, chuỗi nổ là chết, đòn huỷ; Hấp thụ ma pháp nuốt được", () => {
  const make = () => {
    let s = board({ 0: ["may-chem", { atk: 5, hp: 2, maxHp: 2 }] }, { 0: ["khong-lo-mot-mat", { hp: 10, maxHp: 10 }] });
    s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: 3, flask: 0, hand: i === 1 ? [D.TRAP_CARD] : ["hap-thu-ma-phap"], tolls: [] })) };
    return D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  };
  const open = make();
  assert.equal(D.trapPicks(open, 1).length, 1, "kẻ đánh máu 2: lá chớp");
  const set = D.castSpell(open, 0, null);
  assert.equal(set.hold?.trap?.uid, uid(open, 0, 0), "bẫy chờ trong chuỗi: " + set.live);
  assert.equal(set.hold?.priority, 0, "đối thủ được đáp");
  const sprung = D.passResponse(D.passResponse(set));
  assert.equal(at(sprung, 0, 0), null, "kẻ đánh chết: " + sprung.live);
  assert.equal(at(sprung, 1, 0).hp, 10, "đòn huỷ");
  assert.equal(sprung.step, "main");
  // Hấp thụ ma pháp nuốt Bẫy thú: đòn vẫn vào.
  const eaten = D.castSpell(set, 0, null);
  const landed = D.passResponse(D.passResponse(eaten));
  assert.ok(at(landed, 0, 0), "kẻ đánh còn sống: " + landed.live);
  assert.ok(at(landed, 1, 0).hp < 10, "đòn vẫn vào");
});

test("Kuriboh (21/11): công 1 đánh quái thì nổ ngay, không hàng chờ, gây sát thương chuẩn bằng công, biến mất, không bị đánh trả", () => {
  const s = board({ 0: ["cuc-bong-ma-quai", {}] }, { 0: ["khong-lo-mot-mat", { atk: 5, def: 3, hp: 10, maxHp: 10 }] });
  const done = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(done.step, "main", "không vào hàng chờ: " + done.live);
  assert.equal(done.hold, null);
  assert.equal(at(done, 0, 0), null, "Kuriboh biến mất");
  assert.equal(at(done, 1, 0).hp, 9, "1 sát thương chuẩn, xuyên thủ: " + done.live);
  assert.equal(done.counterAsk ?? null, null, "không Trả đòn");
  assert.deepEqual(done.boom?.uids, [uid(s, 0, 0)], "đánh dấu nổ cho trang trận");
  assert.equal(done.turn, 1, "quyền sang đối thủ");
});

test("Kuriboh: được buff công trên 1 thì đòn vào hàng chờ như thường, lúc nổ gây đúng công", () => {
  const s = board({ 0: ["cuc-bong-ma-quai", { atk: 3 }] }, { 0: ["khong-lo-mot-mat", { atk: 5, def: 3, hp: 10, maxHp: 10 }] });
  const open = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(open.step, "respond", "vào hàng chờ: " + open.live);
  const done = D.passResponse(open);
  assert.equal(at(done, 0, 0), null);
  assert.equal(at(done, 1, 0).hp, 7, "3 sát thương chuẩn: " + done.live);
});

test("Kuriboh: bị đánh thì nổ vào kẻ đánh và biến mất, kẻ đánh không gây sát thương", () => {
  const s = board({ 0: ["khong-lo-mot-mat", { atk: 5, def: 2, hp: 10, maxHp: 10 }] }, { 0: ["cuc-bong-ma-quai", {}], 1: ["may-chem", {}] });
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  assert.equal(at(done, 1, 0), null, "Kuriboh biến mất: " + done.live);
  assert.equal(at(done, 0, 0).hp, 9, "kẻ đánh chịu 1 sát thương chuẩn");
  assert.equal(done.counterAsk ?? null, null);
});

test("Kuriboh: đánh người chơi gây sát thương chuẩn bằng công rồi biến mất; lao ra chặn đòn vào người chơi cũng nổ", () => {
  const s = board({ 0: ["cuc-bong-ma-quai", {}] }, {});
  const hp = s.players[1].hp;
  const face = D.attackFace(s, uid(s, 0, 0));
  assert.equal(face.step, "main", face.live);
  assert.equal(face.players[1].hp, hp - 1);
  assert.equal(at(face, 0, 0), null);
  const t = board({ 0: ["khong-lo-mot-mat", { atk: 5, def: 2, hp: 10, maxHp: 10 }] }, { 0: ["cuc-bong-ma-quai", {}] });
  const open = D.attackFace(t, uid(t, 0, 0));
  const blocked = D.passResponse(D.passResponse(D.assignBlock(open, uid(t, 1, 0))));
  assert.equal(at(blocked, 1, 0), null, "Kuriboh chặn rồi nổ: " + blocked.live);
  assert.equal(at(blocked, 0, 0).hp, 9);
  assert.equal(blocked.players[1].hp, t.players[1].hp, "người chơi không mất máu");
});

test("Kuriboh Cấp số nhân: 1 mana; bị tiêu diệt (cả lúc tự nổ) thì ra 2 Kuriboh mới, hàng trước trước, con mới dùng lại được", () => {
  let s = board({ 0: ["cuc-bong-ma-quai", {}], 1: ["may-chem", {}] }, { 0: ["khong-lo-mot-mat", { atk: 5, def: 3, hp: 10, maxHp: 10 }] });
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0 })) };
  const armed = D.useSkill(s, uid(s, 0, 0), null, 0);
  assert.equal(armed.players[0].orb, 2, "1 mana: " + armed.live);
  assert.ok(at(armed, 0, 0).mult);
  assert.match(D.useSkill({ ...armed, turn: 0 }, uid(s, 0, 0), null, 0).live, /đã kích hoạt|đã hành động/);
  const ready = { ...armed, turn: 0, players: armed.players.map((p, i) => (i === 0 ? { ...p, field: p.field.map((m) => (m ? { ...m, used: false, dim: false } : m)) } : p)) };
  const done = D.attackMonster(ready, uid(s, 0, 0), uid(s, 1, 0));
  const kids = done.players[0].field.map((m, slot) => (m?.cardId === "cuc-bong-ma-quai" ? slot : null)).filter((n) => n !== null);
  assert.deepEqual(kids, [0, 2], "2 con mới, hàng trước trước: " + rows(done));
  assert.ok(!at(done, 0, 0).mult && !at(done, 0, 2).mult, "con mới chưa kích hoạt");
  assert.equal(at(done, 1, 0).hp, 9);
  // Không kích hoạt thì không nhân đôi.
  const plain = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(plain.players[0].field.filter((m) => m?.cardId === "cuc-bong-ma-quai").length, 0);
});

test("Đồng hồ khó đoán (21/11): ra sân chọn hung bạo/mỏng manh, tự đổi sau mỗi 2 vòng, máu tối đa tăng thì máu tăng theo; úp thì hung bạo, không đổi", () => {
  let s = board({}, {});
  s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: 3, flask: 0, stars: 2, reserve: i === 0 ? [{ id: "dong-ho-kho-doan", hp: 2, maxHp: 2 }] : p.reserve })) };
  const placed = D.summon(s, 0, 0);
  assert.ok(placed.clockAsk, "hỏi chọn trạng thái: " + placed.live);
  assert.equal(placed.turn, 0, "chưa chọn xong thì chưa nhường quyền");
  const fierce = D.chooseClock(placed, "dong-ho-hung-bao");
  const f = at(fierce, 0, 0);
  assert.equal(f.cardId, "dong-ho-hung-bao");
  assert.deepEqual([f.atk, f.def, f.mdef, f.hp, f.maxHp], [5, 0, 0, 6, 6]);
  assert.equal(fierce.turn, 1, "chọn xong thì nhường quyền như triệu hồi");
  assert.equal(fierce.clockAsk, null);
  assert.ok(D.spellAtk(f), "hung bạo có Đòn đánh phép");
  const one = closeRound(fierce);
  assert.equal(at(one, 0, 0).cardId, "dong-ho-hung-bao", "1 vòng: chưa đổi");
  assert.equal(at(one, 0, 0).clockLeft, 1);
  const two = closeRound(one);
  const t = at(two, 0, 0);
  assert.equal(t.cardId, "dong-ho-mong-manh", "2 vòng: đổi sang mỏng manh " + two.live);
  assert.deepEqual([t.atk, t.hp, t.maxHp], [0, 1, 1]);
  assert.equal(D.spellAtk(t), false, "mỏng manh không có Đòn đánh phép");
  const four = closeRound(closeRound(two));
  assert.equal(at(four, 0, 0).cardId, "dong-ho-hung-bao", "thêm 2 vòng: về hung bạo");
  assert.deepEqual([at(four, 0, 0).hp, at(four, 0, 0).maxHp], [6, 6], "máu tối đa +5 thì máu +5");
  // Chọn mỏng manh lúc ra sân.
  const frail = at(D.chooseClock(placed, "dong-ho-mong-manh"), 0, 0);
  assert.deepEqual([frail.cardId, frail.atk, frail.hp, frail.maxHp], ["dong-ho-mong-manh", 0, 1, 1]);
  // Máy (bên 1) tự chọn hung bạo.
  const mine = { ...placed, mode: "ai", clockAsk: { ...placed.clockAsk, side: 1 } };
  assert.equal(D.aiAnswerAsk(mine) === null, false);
  // Chọn dạng trước khi ra sân (chủ game 22/11): Triệu hồi mỏng manh thì không hỏi, nhường quyền ngay.
  const pre = D.summonClock(s, "dong-ho-mong-manh", (st) => D.summon(st, 0, 0));
  assert.equal(pre.clockAsk ?? null, null, "đã chọn trước thì không hỏi: " + pre.live);
  assert.equal(pre.clockPick ?? null, null, "không để sót dạng đã chọn");
  assert.deepEqual([at(pre, 0, 0).cardId, at(pre, 0, 0).hp, at(pre, 0, 0).lurk ?? null], ["dong-ho-mong-manh", 1, null]);
  assert.equal(pre.turn, 1, "triệu hồi xong nhường quyền");
  // Úp: quái ẩn, hung bạo, dù có chọn mỏng manh.
  const set = D.summonHidden({ ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, orb: 4 } : p)) }, 0, 0);
  assert.equal(set.clockAsk ?? null, null);
  assert.equal(at(set, 0, 0).cardId, "dong-ho-hung-bao");
  assert.ok(at(set, 0, 0).lurk, "Ẩn = quái ẩn");
  const later = closeRound(set);
  if (at(later, 0, 0)?.lurk) assert.equal(at(later, 0, 0).cardId, "dong-ho-hung-bao", "ẩn thì không đổi dạng");
  assert.equal(set.clockPick ?? null, null);
  // Triệu hồi bị từ chối (ô có quái) thì bàn giữ nguyên.
  assert.equal(D.summonClock(pre, "dong-ho-hung-bao", (st) => D.summon(st, 0, 0)).clockPick ?? null, null);
});

test("Quả trứng sinh mệnh (21/11): Sinh mệnh mới lần đầu 1 mana + mình rút 2, các lần sau 0 mana + rút 1; đối thủ bỏ 1 ngẫu nhiên và rút 1", () => {
  let s = board({ 0: ["qua-trung-sinh-menh", {}] }, {});
  s = {
    ...s,
    players: s.players.map((p, i) => ({ ...p, orb: 3, draws: 1, reserve: i === 0 ? [{ id: "rong-con", hp: 2, maxHp: 2 }] : [{ id: "may-chem", hp: 2, maxHp: 2 }], hand: i === 0 ? ["hoan-doi"] : ["phuc-kich"], tolls: [false] })),
  };
  const left = (p) => p.monsterDeck.length + p.spellDeck.length;
  const egg = uid(s, 0, 0);
  // Chưa chọn lá: từ chối, không tốn mana.
  const none = D.useSkill(s, egg, null, 0, false, null);
  assert.equal(none.players[0].orb, 3, none.live);
  const n = D.useSkill(s, egg, null, 0, false, "s:0");
  assert.equal(n.players[0].orb, 2, n.live);
  assert.equal(n.players[0].reserve.length + n.players[0].hand.length, 2 - 1 + 2, "lần đầu: bỏ 1 rút 2");
  assert.equal(n.players[1].reserve.length + n.players[1].hand.length, 2 - 1 + 1, "đối thủ bỏ 1 rút 1");
  assert.equal(left(s.players[0]) - left(n.players[0]), 2);
  assert.equal(left(s.players[1]) - left(n.players[1]), 1);
  assert.equal(n.players[0].draws, 1, "rút miễn phí, không tính lá rút của vòng");
  assert.ok(at(n, 0, 0).used, "dùng xong là đã hành động");
  assert.ok(at(n, 0, 0).reborn, "đánh dấu đã dùng lần đầu");
  assert.match(n.live, /Sinh mệnh mới/);
  // Lần sau (vòng sau, quái hết hành động): 0 mana, mình chỉ rút 1.
  const next = { ...n, turn: 0, players: n.players.map((p, i) => (i === 0 ? { ...p, field: p.field.map((m) => (m ? { ...m, used: false, dim: false } : m)) } : p)) };
  const again = D.useSkill(next, egg, null, 0, false, "r:0");
  assert.equal(again.players[0].orb, next.players[0].orb, "lần sau không tốn mana: " + again.live);
  assert.equal(left(next.players[0]) - left(again.players[0]), 1, "lần sau mình rút 1");
  assert.equal(left(next.players[1]) - left(again.players[1]), 1, "đối thủ vẫn rút 1");
  // Đã hành động trong vòng: không dùng lại ngay.
  const same = D.useSkill({ ...n, turn: 0 }, egg, null, 0, false, "r:0");
  assert.equal(same.players[0].orb, n.players[0].orb, same.live);
});

test("Tử thần của những lá bài (22/11): Gặt hồn tốn 1 mana để tấn công; vào được người chơi thì đối thủ huỷ 1 lá ngẫu nhiên; bị chặn thì không", () => {
  let s = board({ 0: ["tu-than-cua-nhung-la-bai", {}] }, { 0: ["may-chem", {}] });
  s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: i === 0 ? 1 : 0, reserve: i === 1 ? [{ id: "rong-con", hp: 2, maxHp: 2 }] : p.reserve, hand: i === 1 ? ["hoan-doi"] : p.hand, tolls: i === 1 ? [false] : p.tolls })) };
  const broke = D.attackFace({ ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, orb: 0 } : p)) }, uid(s, 0, 0));
  assert.notEqual(broke.pending?.kind, "face", "thiếu mana không đánh được");
  const swung = D.attackFace(s, uid(s, 0, 0));
  assert.equal(swung.players[0].orb, 0, "tấn công tốn 1 mana");
  const hand = (p) => p.reserve.length + p.hand.length;
  const done = D.passResponse(swung);
  assert.ok(done.players[1].hp < s.players[1].hp, done.live);
  assert.equal(hand(done.players[1]), hand(s.players[1]) - 1, "đối thủ huỷ 1 lá: " + done.live);
  assert.match(done.live, /Gặt hồn/);
  assert.equal(done.discard?.drops.length, 1);
  assert.equal(done.discard.drops[0].side, 1);
  assert.ok(["rong-con", "hoan-doi"].includes(done.discard.drops[0].card));
  // Bị chặn: không vào người chơi, không mất lá.
  const blocked = D.passResponse(D.assignBlock(swung, uid(s, 1, 0)));
  const settled = blocked.step === "respond" ? D.passResponse(blocked) : blocked;
  assert.equal(hand(settled.players[1]), hand(s.players[1]), "bị chặn thì không huỷ lá: " + settled.live);
});

test("Quả trứng thiên sứ chặn đòn đánh thường, kẻ đánh mệt, quái bị đánh Trả đòn không tốn phí", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 20, maxHp: 20 }] }, { 0: ["may-chem", { atk: 4, def: 0, mdef: 0, hp: 20, maxHp: 20 }] });
  s = D.testGrant(s, 1, "qua-trung-thien-su", false);
  s = { ...s, players: s.players.map((p, i) => ({ ...p, orb: i === 1 ? 0 : 5 })) };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(swung.pending?.kind, "melee", swung.live);
  const waiting = D.castSpell(swung, swung.players[1].hand.indexOf("qua-trung-thien-su"), null);
  assert.deepEqual(waiting.hold?.egg, { ally: uid(s, 1, 0), foe: uid(s, 0, 0) }, waiting.live);
  assert.equal(waiting.hold?.priority, 0, "quyền sang bên đánh");
  const landed = D.passResponse(waiting);
  assert.equal(at(landed, 1, 0).hp, 20, "đòn bị chặn");
  assert.equal(at(landed, 0, 0).dim, true, "kẻ đánh bị mệt");
  assert.equal(landed.counterAsk?.uid, uid(s, 1, 0), landed.live);
  assert.equal(landed.counterAsk?.free, true);
  const hit = D.pickCounter(landed, "phys");
  assert.ok(at(hit, 0, 0).hp < 20, "Trả đòn dù 0 mana: " + hit.live);
});

test("Quả trứng thiên sứ: quái hàng sau bị kỹ năng nhắm vẫn được Trả đòn; không dùng khi đánh vào người chơi", () => {
  let s = board({ 0: ["rong-con", { hp: 20, maxHp: 20, def: 0, mdef: 0 }], 1: ["khong-lo-mot-mat", { atk: 3 }] }, { 3: ["may-chem", { atk: 4, def: 0, mdef: 0, hp: 20, maxHp: 20 }] });
  s = D.testGrant(s, 1, "qua-trung-thien-su", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const breath = D.declareSkill(s, uid(s, 0, 0), uid(s, 1, 3), 0);
  assert.equal(breath.step, "respond", breath.live);
  const waiting = D.castSpell(breath, breath.players[1].hand.indexOf("qua-trung-thien-su"), uid(s, 1, 3));
  assert.ok(waiting.hold?.egg, waiting.live);
  const landed = D.passResponse(waiting);
  assert.equal(at(landed, 1, 3).hp, 20, "kỹ năng bị chặn");
  assert.equal(landed.counterAsk?.uid, uid(s, 1, 3), "hàng sau được Trả đòn: " + landed.live);
  const orb = landed.players[1].orb;
  const hit = D.pickCounter(landed, "phys");
  assert.equal(hit.players[1].orb, orb, "không thu phí");
  assert.ok(at(hit, 0, 0).hp < 20);
  const face = D.attackFace(s, uid(s, 0, 1));
  const refused = D.castSpell(face, face.players[1].hand.indexOf("qua-trung-thien-su"), null);
  assert.ok(!refused.hold?.egg, "đánh vào người chơi thì không dùng được");
});

test("Hấp thụ ma pháp nuốt Quả trứng thiên sứ: đòn đánh vẫn vào", () => {
  let s = board({ 0: ["khong-lo-mot-mat", { atk: 3, def: 0, hp: 20, maxHp: 20 }] }, { 0: ["may-chem", { atk: 4, def: 0, mdef: 0, hp: 20, maxHp: 20 }] });
  s = D.testGrant(s, 1, "qua-trung-thien-su", false);
  s = D.testGrant(s, 0, "hap-thu-ma-phap", false);
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const swung = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  const waiting = D.castSpell(swung, swung.players[1].hand.indexOf("qua-trung-thien-su"), null);
  assert.ok(waiting.hold?.egg, waiting.live);
  const eaten = D.castSpell(waiting, waiting.players[0].hand.indexOf("hap-thu-ma-phap"), null);
  assert.ok(!eaten.hold?.egg, "đã bị nuốt: " + eaten.live);
  let done = eaten;
  for (let i = 0; i < 4 && done.step === "respond"; i += 1) done = D.passResponse(done);
  assert.ok(at(done, 1, 0).hp < 20, "đòn vẫn vào: " + done.live);
});

let failed = 0;
test("Lính chiến đá khổng lồ (21/11): quái địch chỉ được chọn nó làm mục tiêu (đánh thường, đánh người chơi, kỹ năng); quái 5 sao không bị ép", () => {
  const s = board({ 0: ["khong-lo-mot-mat", { atk: 5, def: 2, hp: 10, maxHp: 10 }], 1: ["rong-con", {}] }, { 0: ["linh-chien-da-khong-lo", {}], 1: ["may-chem", {}] });
  const other = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 1));
  assert.equal(other.step, "main", "không đánh Máy chém được: " + other.live);
  assert.match(other.live, /Lính chiến đá khổng lồ/);
  const face = D.attackFace(s, uid(s, 0, 0));
  assert.equal(face.step, "main", "không đánh người chơi được: " + face.live);
  const ok = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(ok.step, "respond", "đánh Lính đá được: " + ok.live);
  const rich = { ...s, players: s.players.map((p) => ({ ...p, orb: 5 })) };
  const skill = D.useSkill(rich, uid(s, 0, 1), uid(s, 1, 1), 0);
  assert.equal(skill.players[1].field[1].hp, at(s, 1, 1).hp, "kỹ năng không nhắm Máy chém được: " + skill.live);
  assert.equal(skill.pending ?? null, null);
  const five = board({ 0: ["rong-ac-ma", {}] }, { 0: ["linh-chien-da-khong-lo", {}], 1: ["may-chem", {}] });
  const free = D.attackMonster(five, uid(five, 0, 0), uid(five, 1, 1));
  assert.notEqual(free.live, D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 1)).live, "quái 5 sao chọn tự do: " + free.live);
});

test("Lính chiến đá khổng lồ: mỗi đợt công kích trúng nó thì thủ và thủ phép giảm 1, vĩnh viễn; không còn đỡ đòn cho đồng minh", () => {
  const s = board({ 0: ["khong-lo-mot-mat", { atk: 2, def: 2, hp: 10, maxHp: 10 }] }, { 0: ["linh-chien-da-khong-lo", {}], 1: ["may-chem", {}] });
  const card = C.monsterCard("linh-chien-da-khong-lo");
  assert.deepEqual([card.atk, card.def, card.mdef, card.hp], [2, 3, 3, 6]);
  const done = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)));
  const stone = at(done, 1, 0);
  assert.equal(stone.hp, 6, "2 công không xuyên 3 thủ: " + done.live);
  assert.deepEqual([stone.def, stone.mdef], [2, 2], "giảm 1 cả hai sau đợt đó");
  assert.equal(D.canWall(s, uid(s, 1, 0)), false);
});

test("Harpie Lady: Giảo hoạt lúc triệu hồi, chọn 1 trong 2 kỹ năng; trả lời xong mới nhường quyền", () => {
  const card = C.monsterCard("my-dieu-nhan");
  assert.equal(card.name, "Harpie Lady");
  assert.equal(card.hp, 3);
  let s = board({}, {});
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 5, flask: 0, stars: 4 })) };
  s = D.testGrant(s, 0, "my-dieu-nhan", false);
  const summoned = D.summon(s, s.players[0].reserve.findIndex((p) => p.id === "my-dieu-nhan"), 0);
  const ask = summoned.wileAsk?.[0];
  assert.ok(ask, summoned.live);
  assert.equal(ask.side, 0);
  assert.equal(ask.picks.length, 2);
  assert.notEqual(ask.picks[0], ask.picks[1]);
  assert.equal(summoned.turn, 0, "chưa nhường khi chưa chọn");
  assert.deepEqual([...at(summoned, 0, 0).shed].sort(), ["armor", "charm", "gust", "lash"], "chưa có kỹ năng nào");
  const picked = D.answerWile(summoned, ask.picks[1]);
  assert.equal(picked.wileAsk, null);
  assert.equal(picked.turn, 1, "chọn xong thì nhường");
  assert.ok(!at(picked, 0, 0).shed.includes(ask.picks[1]), picked.live);
  assert.ok(at(picked, 0, 0).shed.includes(ask.picks[0]));
  const timeout = D.answerWile(summoned, null);
  assert.ok(ask.picks.includes(at(timeout, 0, 0).wit.picked[0]), "hết giờ lấy ngẫu nhiên trong 2 kỹ năng");
});

test("Harpie Lady: Giảo hoạt mời lại ở lượt chung thứ 3 sau lượt triệu hồi, không mời kỹ năng đã nhận", () => {
  let s = board({ 0: ["my-dieu-nhan", {}] }, { 0: ["may-chem", {}] });
  s = D.draw({ ...s, players: s.players.map((p) => ({ ...p, orb: 3 })) }, "spell");
  const first = s.wileAsk[0].picks[0];
  s = D.answerWile(s, first);
  const born = at(s, 0, 0).wit.born;
  assert.deepEqual(at(s, 0, 0).wit.picked, [first]);
  for (let n = 1; n <= 3; n += 1) {
    s = closeRound(s);
    const clock = s.clock - born;
    assert.equal(Boolean(s.wileAsk?.length), clock === 3, `lượt +${clock}`);
  }
  assert.ok(!s.wileAsk[0].picks.includes(first), "không mời lại kỹ năng đã nhận");
});

test("Harpie Lady: thi triển 3 hành động khác nhau thì chọn tiến hoá", () => {
  let s = board({ 0: ["my-dieu-nhan", { hp: 20, maxHp: 20, ...ALL_WIT }], 1: ["khong-lo-mot-mat", { hp: 20, maxHp: 20 }] }, { 3: ["may-chem", { hp: 20, maxHp: 20 }] });
  s = rich(s);
  s = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 3)));
  assert.deepEqual(at(s, 0, 0).wit.deeds, ["attack"]);
  s = { ...s, turn: 0, players: s.players.map((p) => ({ ...p, field: p.field.map((m) => (m ? { ...m, dim: false, used: false } : m)) })) };
  s = D.passResponse(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 3)));
  assert.equal(at(s, 0, 0).wit.deeds.length, 1, "đánh lần 2 không tính thêm");
  s = { ...s, turn: 0, players: s.players.map((p) => ({ ...p, field: p.field.map((m) => (m ? { ...m, dim: false, used: false } : m)) })) };
  s = D.testGrant(s, 1, "hap-thu-ma-phap", false);
  let gust = D.useSkill(s, uid(s, 0, 0), null, 0);
  if (gust.step === "respond") gust = D.passResponse(gust);
  assert.deepEqual(at(gust, 0, 0).wit.deeds, ["attack", "gust"], gust.live);
  assert.equal(gust.birdAsk ?? null, null);
  s = { ...gust, turn: 0, players: gust.players.map((p) => ({ ...p, field: p.field.map((m) => (m ? { ...m, dim: false, used: false } : m)) })) };
  let charm = D.useSkill(s, uid(s, 0, 0), uid(s, 0, 1), 1, true, uid(s, 1, 3));
  if (charm.step === "respond") charm = D.passResponse(charm);
  assert.ok(charm.birdAsk, charm.live);
  const evolved = D.evolveBird(charm, "nu-chua-dieu-nhan");
  assert.equal(at(evolved, 0, 0).cardId, "nu-chua-dieu-nhan");
});

test("Harpie Lady: Mê hoặc 0 mana, chờ trong chuỗi, quái địch đánh thường vào 1 quái đồng minh khác, không bị cấm hành động", () => {
  let s = board(
    { 0: ["my-dieu-nhan", { hp: 20, maxHp: 20, ...ALL_WIT }], 1: ["khong-lo-mot-mat", { hp: 20, maxHp: 20, def: 0, mdef: 0 }] },
    { 0: ["may-chem", { atk: 4, hp: 20, maxHp: 20, def: 0, mdef: 0 }] },
  );
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 0 })) };
  const bird = uid(s, 0, 0);
  const ally = uid(s, 0, 1);
  const foe = uid(s, 1, 0);
  const self = D.useSkill(s, bird, bird, 1, true, foe);
  assert.equal(self.step, "main", "không chọn chính cô");
  const charm = D.useSkill(s, bird, ally, 1, true, foe);
  assert.equal(charm.step, "respond", charm.live);
  assert.equal(at(charm, 0, 1).hp, 20, "chưa nổ khi còn chờ");
  const done = D.passResponse(charm);
  assert.equal(at(done, 0, 1).hp, 16, done.live);
  assert.equal(at(done, 0, 0).hp, 20, "Harpie Lady không bị đánh");
  assert.equal(at(done, 1, 0).stun, 0, "quái địch không bị cấm hành động");
  assert.equal(done.plumeAsk ?? null, null);
  assert.ok(at(done, 0, 0).shed.includes("charm"));
  assert.equal(done.players[0].orb, 0);
});

test("Tinh linh đàn hạc: triệu hồi chính nó +2 mana vào mộ mana (dư lên sao); đầu lượt +1 mana mỗi con; quái khác triệu hồi không kích", () => {
  const spent = (p) => D.STAR_COST.slice(0, p.stars).reduce((a, b) => a + b, 0) + p.starGems;
  let s = board({}, {});
  s = { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0, stars: 2, starGems: 0 })) };
  s = D.testGrant(s, 0, "tinh-linh-dan-hac", false);
  const harp = D.summon(s, s.players[0].reserve.findIndex((p) => p.id === "tinh-linh-dan-hac"), 0);
  assert.equal(harp.players[0].field[0]?.cardId, "tinh-linh-dan-hac", harp.live);
  assert.equal(spent(harp.players[0]) - spent(s.players[0]), 4, "2 mana trả + 2 mana trao");
  assert.match(harp.live, /Tiếng nhạc du dương/);
  let other = D.testGrant(s, 0, "may-chem", false);
  other = { ...other, players: other.players.map((p, i) => (i === 0 ? { ...p, field: [harp.players[0].field[0], null, null, null, null, null] } : p)) };
  const plain = D.summon(other, other.players[0].reserve.findIndex((p) => p.id === "may-chem"), 1);
  const fee = C.MONSTERS.find((m) => m.id === "may-chem").gems;
  assert.equal(spent(plain.players[0]) - spent(other.players[0]), fee, "chỉ mana trả cho Máy chém: đàn hạc trên sân không kích");
  let t = board({}, { 0: ["tinh-linh-dan-hac"], 1: ["tinh-linh-dan-hac"] });
  t = { ...t, players: t.players.map((p) => ({ ...p, orb: 0, flask: 0 })) };
  const closed = D.endTurn(D.endTurn(t));
  assert.equal(closed.players[1].orb, 3, "1 + 2 con đàn hạc");
  assert.match(closed.live + (closed.log ?? []).join(" "), /Tiếng nhạc du dương cho thêm 2 gem/);
});

test("Khoá 1: quái bị khoá không chặn, không Trả đòn; hết đòn thì gỡ khoá. Mũi tên thiên sứ trúng người chơi thì rút 1 lá", () => {
  const settle = (x) => { for (let i = 0; i < 6 && x.step === "respond"; i += 1) x = D.passResponse(x); return x; };
  let s = board({ 0: ["thien-su-vo-hinh"] }, { 0: ["rong-con", { atk: 2, def: 0, hp: 9, maxHp: 9 }], 1: ["may-chem", { atk: 2, def: 0, hp: 9, maxHp: 9 }] });
  const angel = uid(s, 0, 0);
  assert.deepEqual(D.lockChoices(s, angel).sort(), [uid(s, 1, 0), uid(s, 1, 1)].sort());
  const locked = D.lockStrike(s, angel, uid(s, 1, 0), (x) => D.attackFace(x, angel));
  assert.equal(locked.hold?.seal?.uid, uid(s, 1, 0), locked.live);
  assert.equal(at(locked, 1, 0).seal, angel);
  assert.equal(D.assignBlock(locked, uid(s, 1, 0)).hold?.blocker ?? null, null, "quái bị khoá không chặn được");
  const pile = D.pileLeft(s.players[0]);
  const done = settle(locked);
  assert.ok(done.players[1].hp < s.players[1].hp);
  assert.equal(D.pileLeft(done.players[0]), pile - 1, "Mũi tên thiên sứ rút 1 lá");
  assert.equal(done.players[0].draws, s.players[0].draws, "không tính lượt rút");
  assert.equal(at(done, 1, 0).seal, undefined, "hết đòn thì gỡ khoá");
  const blocked = settle(D.assignBlock(D.attackFace(s, angel), uid(s, 1, 1)));
  assert.equal(blocked.players[1].hp, s.players[1].hp);
  assert.equal(D.pileLeft(blocked.players[0]), pile, "bị chặn hết thì không rút");
  const free = settle(D.attackMonster(s, angel, uid(s, 1, 0)));
  assert.ok(free.counterAsk, "không khoá thì mục tiêu được Trả đòn");
  const sealed = settle(D.lockStrike(s, angel, uid(s, 1, 0), (x) => D.attackMonster(x, angel, uid(s, 1, 0))));
  assert.ok(!sealed.counterAsk, "mục tiêu bị khoá thì không Trả đòn");
  assert.equal(at(sealed, 1, 0).seal, undefined);
});

test("Pháo kích (23/11): skill chậm; nổ thì quái làm đạn mất, 65% máu hiện tại + sao chuẩn lên quái/người chơi, phá lá tường thành; đạn mất trước thì huỷ, không tốn mana", () => {
  const make = () => {
    let s = board({ 0: ["rua-may-ban-da", { hp: 3, maxHp: 3 }], 1: ["rong-con", { hp: 5, maxHp: 5 }], 3: ["may-chem", { hp: 2, maxHp: 2 }] }, { 0: ["khong-lo-mot-mat", { hp: 10, maxHp: 10, def: 5 }] });
    return { ...s, players: s.players.map((p) => ({ ...p, orb: 3, flask: 0 })) };
  };
  // Bắn quái: đạn Rồng con máu 5 (1 sao) → làm tròn(3,25) + 1 = 4 chuẩn, bỏ qua thủ.
  let s = make();
  const shell = uid(s, 0, 1);
  const queued = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0, true, shell);
  assert.equal(queued.step, "respond", queued.live);
  assert.equal(queued.players[0].orb, 3, "chưa trả mana lúc lên hàng chờ");
  assert.match(D.assignBlock(queued, uid(s, 1, 0)).live, /không chặn được/);
  const done = D.passResponse(queued);
  const blow = Math.round(5 * 0.65) + 1;
  assert.equal(D.catapultDamage(at(s, 0, 1)), blow, "65% máu hiện tại (5) làm tròn + 1 sao");
  assert.equal(at(done, 1, 0).hp, 10 - blow, `Khổng lồ mất ${blow} dù thủ 5 | ${done.live}`);
  assert.equal(at(done, 0, 1), null, "đạn mất");
  assert.equal(done.players[0].orb, 2, "trả 1 mana lúc nổ");
  assert.ok(done.boom?.from?.[shell], "hiệu ứng biết con rùa");
  // Bắn người chơi: đạn Máy chém máu 2 (1 sao) → làm tròn(1,3) + 1 = 2 chuẩn.
  s = make();
  const hp = s.players[1].hp;
  const face = D.passResponse(D.useSkill(s, uid(s, 0, 0), null, 0, true, uid(s, 0, 3)));
  assert.equal(face.players[1].hp, hp - 2, face.live);
  // Bắn lá tường thành: Gương phòng hộ của đối thủ bị phá.
  s = make();
  s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, mirror: 3 } : p)) };
  const wall = D.passResponse(D.useSkill(s, uid(s, 0, 0), null, 0, true, `${uid(s, 0, 3)}|wall`));
  assert.equal(wall.players[1].mirror, 0, wall.live);
  assert.equal(wall.players[1].hp, s.players[1].hp, "không trúng người chơi");
  // Đạn mất trước lúc nổ: skill bị huỷ, không tốn mana.
  s = make();
  const waiting = D.useSkill(s, uid(s, 0, 0), uid(s, 1, 0), 0, true, shell);
  const gone = { ...waiting, players: waiting.players.map((p, i) => (i === 0 ? { ...p, field: p.field.map((m) => (m?.uid === shell ? null : m)) } : p)) };
  const cancelled = D.passResponse(gone);
  assert.equal(at(cancelled, 1, 0).hp, 10, cancelled.live);
  assert.equal(cancelled.players[0].orb, 3, "không tốn mana");
  assert.match(cancelled.live, /Pháo kích bị huỷ/);
  // Không có đạn thì không lên hàng chờ.
  assert.notEqual(D.useSkill(make(), uid(s, 0, 0), uid(s, 1, 0), 0, true, null).step, "respond");
});

test("Hiệp sĩ của vua/hậu (25/11): Kiếm hỏi lúc tấn công chủ động, 1 mana +3 công cho đòn đó; thiếu mana thì không hỏi", () => {
  const make = (orb) => {
    const s = board({ 0: ["hiep-si-cua-vua", { atk: 3, def: 0, mdef: 0, hp: 3, maxHp: 3 }] }, { 0: ["may-chem", { atk: 0, def: 0, mdef: 0, hp: 20, maxHp: 20 }] });
    return { ...s, players: s.players.map((p, i) => ({ ...p, orb: i === 0 ? orb : 0 })) };
  };
  let s = make(2);
  const asked = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(asked.swordAsk?.kind, "melee", asked.live);
  assert.equal(asked.pending, null, "chưa lên hàng chờ khi đang hỏi");
  const yes = D.answerSword(asked, true);
  assert.equal(yes.pending?.kind, "melee", yes.live);
  assert.equal(yes.players[0].orb, 1, "Kiếm tốn 1 mana");
  const hit = D.passResponse(yes);
  assert.equal(at(hit, 1, 0).hp, 14, "3 công + 3 Kiếm: " + hit.live);
  assert.equal(at(hit, 0, 0).blessAtk ?? 0, 0, "hết đòn thì mất +3");
  const no = D.passResponse(D.answerSword(D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0)), false));
  assert.equal(at(no, 1, 0).hp, 17, "không dùng Kiếm: " + no.live);
  assert.equal(no.players[0].orb, 2);
  s = make(0);
  const broke = D.attackMonster(s, uid(s, 0, 0), uid(s, 1, 0));
  assert.equal(broke.swordAsk ?? null, null, "0 mana thì không hỏi");
  assert.equal(broke.pending?.kind, "melee");
  // Đánh người chơi cũng hỏi.
  s = make(1);
  const face = D.attackFace(s, uid(s, 0, 0));
  assert.equal(face.swordAsk?.kind, "face", face.live);
  const landed = D.passResponse(D.answerSword(face, true));
  assert.equal(landed.players[1].hp, s.players[1].hp - 6, landed.live);
});

test("Hiệp sĩ của vua/hậu (25/11): Khiên +4 thủ trước đòn vật lý đầu tiên trong lượt, +4 thủ phép trước đòn phép (đòn đánh của hậu là phép); hết lượt thì mất", () => {
  const make = (foe) => {
    const s = board({ 0: ["hiep-si-cua-vua", { atk: 0, def: 0, mdef: 0, hp: 10, maxHp: 10 }] }, { 0: [foe, { atk: 5, def: 0, mdef: 0, hp: 20, maxHp: 20 }], 1: ["may-chem", { atk: 5, def: 0, mdef: 0, hp: 20, maxHp: 20 }] }, { turn: 1, round: 1 });
    return { ...s, players: s.players.map((p) => ({ ...p, orb: 0 })) };
  };
  let s = make("may-chem");
  let hit = D.passResponse(D.attackMonster(s, uid(s, 1, 0), uid(s, 0, 0)));
  assert.equal(at(hit, 0, 0).hp, 9, "5 công - 4 thủ của Khiên: " + hit.live);
  assert.deepEqual(at(hit, 0, 0).kGuard, { def: 4, mdef: 0 });
  assert.ok(hit.log.some((line) => /giương Khiên, \+4 thủ/.test(line)), hit.log.slice(-3).join(" | "));
  // Lần thứ hai trong cùng lượt: không bật lại, thủ +4 vẫn còn.
  hit = { ...hit, counterAsk: null, turn: 1, step: "main", pending: null, hold: null };
  const again = D.passResponse(D.attackMonster(hit, uid(s, 1, 1), uid(s, 0, 0)));
  assert.equal(at(again, 0, 0).hp, 8, again.live);
  // Hết lượt: Khiên mất, lượt sau bật lại được.
  const next = closeRound(again);
  assert.equal(at(next, 0, 0)?.kGuard, undefined);
  // Đòn đánh của Hiệp sĩ của hậu là sát thương phép: Khiên vào thủ phép.
  s = make("hiep-si-cua-hau");
  const magic = D.passResponse(D.attackMonster(s, uid(s, 1, 0), uid(s, 0, 0)));
  assert.equal(at(magic, 0, 0).hp, 9, magic.live);
  assert.deepEqual(at(magic, 0, 0).kGuard, { def: 0, mdef: 4 });
});

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
