// Scenes for multi-target flows: node .claude/skills/flow/scripts/scenes.mjs <out dir>  (run from the repo). Each scene is two states: before, then the spread staged.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const require = createRequire(`${process.cwd()}/package.json`);
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
const out = process.argv[2];
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const D = await server.ssrLoadModule("/src/lib/duel.ts");
const deck = { monsters: ["khong-lo-mot-mat", "may-chem", "rong-con", "kazura", "kizuran", "ma-dao-si", "chien-binh-rong", "hiep-si-ho-ve", "hiep-si-cua-vua", "hiep-si-cua-hau", "my-dieu-nhan", "phu-thuy-ti-hon", "rong-boc-trung"], spells: ["hap-thu-ma-phap", "vong-xoay-bao-ho", "phuc-kich"] };
function put(s, side, spots) {
  let t = s;
  const field = Array(6).fill(null);
  for (const [slot, spec] of Object.entries(spots)) {
    const [id, stats] = Array.isArray(spec) ? spec : [spec, {}];
    t = D.testGrant({ ...t, players: t.players.map((p, i) => (i === side ? { ...p, field: Array(6).fill(null) } : p)) }, side, id, true);
    field[Number(slot)] = { ...t.players[side].field[0], dim: false, ...(Number(slot) >= 3 ? { row: "back" } : {}), ...stats };
  }
  return { ...t, players: t.players.map((p, i) => (i === side ? { ...p, field } : p)) };
}
function hand(s, side, ids) {
  let t = { ...s, mode: "test", players: s.players.map((p, i) => (i === side ? { ...p, reserve: [], hand: [], tolls: [] } : p)) };
  for (const id of ids) t = D.testGrant(t, side, id, false);
  return t;
}
function base(mine, foes, cards = [], foeCards = [], extra = {}) {
  let s = D.createDuel(deck, "test");
  s = put(s, 0, mine);
  s = put(s, 1, foes);
  s = hand(s, 0, cards);
  s = hand(s, 1, foeCards);
  return { ...s, mode: "ai", opener: null, turn: 0, round: 0, opening: false, skipped: [false, false], step: "main", pending: null, hold: null, players: s.players.map((p) => ({ ...p, orb: 6, flask: 0, stars: 4, summons: 0 })), ...extra };
}
const uid = (s, side, slot) => s.players[side].field[slot].uid;
const save = (name, states) => states.forEach((st, i) => writeFileSync(`${out}/${name}-${i}.json`, JSON.stringify(st)));
const big = { hp: 20, maxHp: 20 };
const area = (name, foes, mine = { 1: "loi-nguyen-cua-rong" }) => {
  const s = base(mine, foes);
  const caster = Object.keys(mine).map(Number).find((k) => s.players[0].field[k]?.cardId === "loi-nguyen-cua-rong");
  const target = Object.keys(foes).map(Number)[0];
  const d = D.declareSkill(s, uid(s, 0, caster), uid(s, 1, target), 0);
  console.log(name, d.step, d.pending?.kind, d.live);
  save(name, [s, D.stageHold(d)]);
};
area("two", { 0: ["khong-lo-mot-mat", big], 2: ["kizuran", big] });
area("three", { 0: ["khong-lo-mot-mat", big], 1: ["may-chem", big], 2: ["kizuran", big] });
area("six", { 0: ["khong-lo-mot-mat", big], 1: ["may-chem", big], 2: ["kizuran", big], 3: ["kazura", big], 4: ["rong-con", big], 5: ["ma-dao-si", big] });
area("left3", { 0: ["khong-lo-mot-mat", big], 3: ["kazura", big], 1: ["may-chem", big] });
area("pair", { 1: ["may-chem", big], 4: ["rong-con", big] });
area("side", { 2: ["kizuran", big], 5: ["ma-dao-si", big] }, { 0: "loi-nguyen-cua-rong" });
// The machine's Địa ngục lửa on my monsters.
{
  const s = base({ 0: ["khong-lo-mot-mat", big], 1: ["may-chem", big], 2: ["kizuran", big], 4: ["rong-con", big] }, { 1: "loi-nguyen-cua-rong" }, [], [], { turn: 1, round: 1 });
  const d = D.declareSkill(s, uid(s, 1, 1), uid(s, 0, 1), 0);
  console.log("foe", d.step, d.pending?.kind, d.live, d.hold?.priority);
  save("foe", [s, d]);
}
await server.close();
console.log("ok");
