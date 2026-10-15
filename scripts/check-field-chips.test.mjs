import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function chipPairs(source) {
  const block = source.slice(source.indexOf("export const MONSTER_CHIPS"), source.indexOf("export const MONSTER_ASKS"));
  const pairs = [];
  const chunks = block.split(/\n  "[a-z0-9-]+": /).slice(1);
  const ids = [...block.matchAll(/\n  "([a-z0-9-]+)": /g)].map((hit) => hit[1]);
  ids.forEach((id, index) => {
    for (const hit of chunks[index].matchAll(/key: "([^"]+)"[\s\S]*?tone: "([yz])"/g)) {
      pairs.push({ id, key: hit[1], tone: hit[2] });
    }
  });
  return pairs;
}

function bindKeys(source) {
  const rows = source.slice(source.indexOf("const ROWS"), source.indexOf("export const FIELD_BIND_KEYS"));
  const keys = [];
  for (const row of rows.split("\n  {").slice(1)) {
    const ids = [...(row.match(/ids: \[([^\]]+)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((hit) => hit[1]);
    const key = row.match(/key: "([^"]+)"/)?.[1];
    if (!key) continue;
    for (const id of ids) keys.push(`${id}:${key}`);
  }
  return keys;
}

function passiveKeys(source) {
  const list = source.match(/export const PASSIVE_CHIP_KEYS = \[([\s\S]*?)\]/)?.[1] ?? "";
  return [...list.matchAll(/"([^"]+)"/g)].map((hit) => hit[1]);
}

test("mọi nút skill vàng đều được gắn trên sân", () => {
  const play = read("../src/routes/play.tsx");
  const chips = chipPairs(read("../src/lib/card-edits.ts"));
  const binds = read("../src/lib/field-chips.ts");
  assert.match(play, /fieldBindsFor\(/);
  const bound = new Set(bindKeys(binds));
  const passive = new Set(passiveKeys(binds));
  const missing = [];
  for (const chip of chips) {
    if (chip.tone !== "y") continue;
    const key = `${chip.id}:${chip.key}`;
    if (bound.has(key) || passive.has(key)) continue;
    if (!play.includes(`key: "${chip.key}"`) && !play.includes(`"${chip.key}"`)) missing.push(key);
  }
  assert.deepEqual(missing, []);
});
