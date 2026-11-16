import assert from "node:assert/strict";
import test from "node:test";
import {
  BOSS_CELLS,
  CHESTS,
  DIRS,
  MONSTERS,
  PORTALS,
  ROWS,
  bossGateOpen,
  cancelPortal,
  cellKey,
  cellPos,
  confirmPortal,
  createMaze,
  monsterAt,
  move,
  neighbor,
  openChest,
  resolveBattle,
  portalPromptAt,
  visibility,
  wallBetween,
} from "./maze.ts";
import type { Dir, MazeResult, MazeState } from "./maze.ts";

/** Đi một loạt bước, mọi bước phải hợp lệ; trả trạng thái cuối và mọi sự kiện. */
function walk(start: MazeState, dirs: Dir[]) {
  let state = start;
  const events: MazeResult["events"] = [];
  for (const dir of dirs) {
    const res = move(state, dir);
    assert.ok(res.ok, `bước ${dir} từ ${state.at} bị chặn: ${res.reason}`);
    state = res.state;
    events.push(...res.events);
  }
  return { state, events };
}
const win = (state: MazeState) => {
  const at = state.pending?.at;
  const res = resolveBattle(state, true);
  assert.ok(res.ok);
  // Thắng thì lùi 1 ô; các bài cũ đi tiếp từ ô quái nên đặt lại ô đó.
  if (at) return { ...res, state: { ...res.state, at, prompt: portalPromptAt({ ...res.state, at }, at) } };
  return res;
};

test("tường đối xứng và khớp đặc tả", () => {
  for (let col = 1; col <= 7; col++) {
    for (let row = 0; row < 7; row++) {
      const here = cellKey({ col, row });
      for (const dir of DIRS) {
        const next = neighbor(here, dir);
        if (!next) continue;
        assert.equal(wallBetween(here, next), wallBetween(next, here));
      }
    }
  }
  assert.ok(wallBetween("4A", "5A"), "tường giữa cột 4 và 5 ở mọi hàng");
  assert.ok(wallBetween("4G", "5G"));
  assert.ok(!wallBetween("1A", "2A"));
  assert.ok(!wallBetween("1A", "1B"));
  assert.ok(wallBetween("1C", "2C"));
  assert.ok(wallBetween("1C", "1D"));
  assert.ok(wallBetween("5E", "5D"), "phòng boss kín ở đáy cột 5");
  assert.ok(!wallBetween("6E", "6D"), "cửa phòng boss là cạnh dưới (6,E)");
  assert.equal(neighbor("1A", "down"), null, "cửa vào phía dưới không đi ra được trong logic");
});

test("số lượng quái, rương, cổng đúng đặc tả", () => {
  const count = (lv: number) => MONSTERS.filter((m) => m.level === lv).length;
  assert.deepEqual([count(1), count(2), count(3)], [4, 3, 2]);
  assert.equal(CHESTS.length, 2);
  assert.equal(Object.keys(PORTALS).length, 5);
  assert.equal(PORTALS["1C"].to, "6C", "cổng đỏ một chiều (1,C) → (6,C)");
  assert.equal(PORTALS["6C"], undefined, "(6,C) không có cổng quay lại");
});

test("mọi ô đều tới được từ cửa vào (có cổng)", () => {
  const seen = new Set<string>(["1A"]);
  const queue = ["1A"];
  while (queue.length) {
    const here = queue.shift() as string;
    const targets: string[] = [];
    for (const dir of DIRS) {
      const next = neighbor(here, dir);
      if (next && !wallBetween(here, next)) targets.push(next);
    }
    if (PORTALS[here]) targets.push(PORTALS[here].to);
    for (const t of targets) {
      if (!seen.has(t)) {
        seen.add(t);
        queue.push(t);
      }
    }
  }
  assert.equal(seen.size, 49);
  for (const cell of BOSS_CELLS) assert.ok(seen.has(cell));
});

test("lối nhanh nhất chỉ gặp 3 quái rồi vào được phòng boss", () => {
  let { state, events } = walk(createMaze(), ["up", "up"]);
  assert.equal(state.at, "1C");
  assert.deepEqual(events.map((e) => e.type), ["encounter"]);
  assert.equal(state.pending?.monsterId, "lv1-1C");
  assert.equal(move(state, "down").reason, "battle", "đang đánh thì không đi được");

  let res = win(state);
  state = res.state;
  assert.deepEqual(res.events.map((e) => e.type), ["monster_defeated", "buff_granted"]);
  assert.equal(state.prompt?.to, "6C", "ở ô cổng đỏ thì hiện khung chọn");
  assert.equal(move(state, "down").reason, "prompt", "chưa chọn thì không đi tiếp");

  const tele = confirmPortal(state);
  state = tele.state;
  assert.equal(state.at, "6C");
  assert.equal(state.prompt, null, "đứng ở cổng đích không hiện khung");
  assert.deepEqual(tele.events, [{ type: "teleport_used", pair_id: "T3", from: "1C", to: "6C" }]);

  ({ state } = walk(state, ["right", "down", "down", "left"]));
  assert.equal(state.at, "6A");
  assert.equal(state.pending?.monsterId, "lv2-6A");
  state = win(state).state;

  ({ state } = walk(state, ["up", "left", "up", "up", "right"]));
  assert.equal(state.at, "6D");
  assert.equal(state.pending?.level, 3);
  assert.equal(state.bossUnlocked, false);
  res = win(state);
  state = res.state;
  assert.ok(res.events.some((e) => e.type === "boss_unlocked"));
  assert.ok(state.bossUnlocked && bossGateOpen(state));
  assert.equal(state.defeated.length, 3, "chỉ hạ đúng 3 quái");
  assert.equal(state.buffs.length, 3);

  res = move(state, "up");
  assert.ok(res.ok);
  assert.equal(res.state.at, "6E");
  assert.deepEqual(res.events.map((e) => e.type), ["boss_entered", "encounter"]);
  const end = win(res.state);
  assert.ok(end.events.some((e) => e.type === "boss_defeated"));
  assert.equal(end.state.bossDefeated, true);
});

test("phòng boss không có tác dụng khi chưa đủ điều kiện", () => {
  const state: MazeState = { ...createMaze(), at: "6D", visited: ["1A", "6D"], defeated: ["lv3-6D"] };
  const res = move(state, "up");
  assert.equal(res.ok, false);
  assert.equal(res.reason, "boss-locked");
  assert.deepEqual(res.events, []);
  assert.equal(res.state.at, "6D");
});

test("chết lùi 1 ô, giữ buff; mất 3 mạng thì reset, thua lần nữa thì khoá", () => {
  let { state } = walk(createMaze(), ["up", "up"]);
  assert.equal(state.pending?.from, "1B");
  let res = resolveBattle(state, false);
  state = res.state;
  assert.equal(state.lives, 2);
  assert.equal(state.at, "1B", "quay về ô đứng trước khi bước vào ô quái");
  assert.deepEqual(res.events, [{ type: "player_died", lives: 2 }]);
  assert.ok(monsterAt(state, "1C"), "quái vẫn còn");

  ({ state } = walk(state, ["up"]));
  state = resolveBattle(state, false).state;
  assert.equal(state.lives, 1);
  ({ state } = walk(state, ["up"]));
  res = resolveBattle(state, false);
  assert.equal(res.state.attempt, 2, "mất hết 3 mạng thì mê cung reset, còn 1 cơ hội");
  assert.equal(res.state.lives, 3);
  assert.equal(res.state.at, "1A");
  assert.ok(res.events.some((e) => e.type === "maze_reset"));

  state = res.state;
  for (let i = 0; i < 3; i++) {
    ({ state } = walk(state, state.at === "1A" ? ["up", "up"] : ["up"]));
    res = resolveBattle(state, false);
    state = res.state;
  }
  assert.equal(state.locked, true, "thất bại lần nữa thì khoá");
  assert.ok(res.events.some((e) => e.type === "maze_locked"));
  assert.equal(move(state, "up").reason, "locked");
});

test("huỷ dịch chuyển: khung chỉ hiện lại khi bước ra rồi vào lại", () => {
  let { state } = walk(createMaze(), ["up", "up"]);
  state = win(state).state;
  assert.ok(state.prompt);
  state = cancelPortal(state).state;
  assert.equal(state.prompt, null);
  assert.equal(state.at, "1C");
  ({ state } = walk(state, ["down"]));
  assert.equal(state.prompt, null);
  ({ state } = walk(state, ["up"]));
  assert.ok(state.prompt, "vào lại ô cổng thì hiện khung");
});

test("cổng hai chiều: dịch chuyển rồi đứng ở cổng đích không hiện khung", () => {
  const base: MazeState = { ...createMaze(), at: "1E", visited: ["1A", "1E"], prompt: { pair: "T1", from: "1E", to: "4A" } };
  const res = confirmPortal(base);
  assert.equal(res.state.at, "4A");
  assert.equal(res.state.prompt, null);
  assert.ok(res.state.visited.includes("4A"));
  assert.equal(res.events[0].type, "teleport_used");
});

test("sương mù: tầm nhìn 1 ô bị tường chắn, nhớ 3 ô đi qua sớm nhất ngoài tầm nhìn", () => {
  let state = createMaze();
  let vis = visibility(state);
  assert.deepEqual([...vis.view].sort(), ["1A", "1B", "2A"]);
  assert.deepEqual(vis.early, []);

  ({ state } = walk(state, ["up", "up"]));
  state = win(state).state;
  vis = visibility(state);
  assert.deepEqual([...vis.view].sort(), ["1B", "1C"], "tường chắn ở phải và trên ô (1,C)");
  assert.deepEqual(vis.early, ["1A"]);
  assert.equal(vis.lit.length, 3);

  // Đi dài hơn: nhớ đúng 3 ô sớm nhất, ô trong tầm nhìn không chiếm chỗ.
  const long: MazeState = { ...createMaze(), at: "4B", visited: ["1A", "2A", "3A", "4A", "4B"] };
  vis = visibility(long);
  assert.deepEqual(vis.early, ["1A", "2A", "3A"]);
  assert.ok(vis.view.includes("4A"));
  const inView: MazeState = { ...createMaze(), at: "2A", visited: ["1A", "2A", "3A", "4A"] };
  vis = visibility(inView);
  assert.ok(vis.view.includes("1A") && vis.view.includes("3A"));
  assert.deepEqual(vis.early, ["4A"], "1A và 3A đang nhìn thấy nên 4A thay vào");
});

test("mở rương chỉ ở ô có rương, một lần", () => {
  const state: MazeState = { ...createMaze(), at: "4G" };
  assert.equal(openChest(createMaze()).reason, "no-chest");
  const res = openChest(state);
  assert.ok(res.ok);
  assert.deepEqual(res.events, [{ type: "chest_opened", chest_id: "chest-1", cell: "4G" }]);
  assert.equal(openChest(res.state).reason, "no-chest");
});

test("toạ độ ô đọc ghi được", () => {
  for (const cell of ["1A", "7G", "4D"]) assert.equal(cellKey(cellPos(cell)), cell);
  assert.equal(ROWS.indexOf("G"), 6);
});
