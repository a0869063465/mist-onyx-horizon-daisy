import { chipLabel } from "@/lib/card-edits";
import { skillManaCost } from "@/lib/duel";

export type FieldBindCtx = {
  cardId: string;
  orb: number;
  level: number;
  hp: number;
  beat: number;
  stored: number;
  skillText: string;
  afford: (cost: number) => boolean;
  aim: (index: number) => void;
  cast: (index: number) => void;
  declare: (index: number) => void;
  /** Skills this monster has already used up (once per kind). */
  spent: string[];
  /** Empty slots on its side. */
  room: number;
};

export type FieldBindChip = { key: string; label: string; go: () => void };

type Gate = (ctx: FieldBindCtx) => boolean;

type Row = {
  ids: string[];
  key: string;
  cast: "aim" | "self" | "declare";
  skill: number;
  gate?: Gate;
  label?: (ctx: FieldBindCtx) => string;
};

const pay = (fallback: number): Gate => (ctx) => ctx.afford(skillManaCost(ctx.cardId, fallback));
const orb = (n: number): Gate => (ctx) => ctx.orb >= n;

const ROWS: Row[] = [
  { ids: ["te-giac-be-con"], key: "up", cast: "self", skill: 0, gate: (ctx) => ctx.level < 3 && ctx.afford(ctx.level >= 2 ? 2 : 1) },
  { ids: ["hiep-si-cua-hau"], key: "sword", cast: "aim", skill: 0, label: (ctx) => `${chipLabel(ctx.cardId, "sword")} ${ctx.beat === 1 ? 2 : 1}` },
  { ids: ["mat-do-tan-pha"], key: "ball", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["cuc-bong-ma-quai"], key: "boom", cast: "aim", skill: 0 },
  { ids: ["cuc-bong-ma-quai"], key: "barrage", cast: "self", skill: 1, gate: (ctx) => ctx.room >= 1 && ctx.afford(1) && !ctx.spent.includes("barrage") },
  { ids: ["hoa-an-thit-nguoi"], key: "bite", cast: "aim", skill: 0 },
  { ids: ["thuong-quan-long"], key: "spin", cast: "declare", skill: 0, gate: pay(1) },
  { ids: ["may-nem-bom-hinh-nhen"], key: "bomb", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["rong-con", "rong-ngan-tuoi"], key: "breath", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["phu-thuy-ti-hon"], key: "hex", cast: "aim", skill: 0, gate: orb(1) },
  { ids: ["ma-dao-si"], key: "dan", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["loi-nguyen-cua-rong"], key: "fire", cast: "aim", skill: 0, gate: pay(0) },
  { ids: ["rong-ac-ma"], key: "orb", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["thien-than-be-nho"], key: "phys", cast: "aim", skill: 0 },
  { ids: ["thien-than-be-nho"], key: "spell", cast: "aim", skill: 1 },
  { ids: ["rong-phun-hoa-cau"], key: "peek", cast: "declare", skill: 0, gate: pay(1) },
  { ids: ["rong-phun-hoa-cau"], key: "fire", cast: "aim", skill: 1, gate: orb(1) },
  { ids: ["phu-thuy-thoi-gian"], key: "age", cast: "aim", skill: 0 },
  { ids: ["kiem-si-lua-thieng"], key: "fire", cast: "aim", skill: 0 },
  {
    ids: ["kiem-si-lua-thieng"],
    key: "blood",
    cast: "aim",
    skill: 1,
    gate: (ctx) => ctx.hp > Number(/tiêu(?:\s*hao)?\s*(\d+)\s*máu/i.exec(ctx.skillText)?.[1] ?? 2),
  },
  { ids: ["ong-khong-lo"], key: "stun", cast: "aim", skill: 0, gate: orb(1) },
  { ids: ["phu-thuy-rung-den"], key: "curse", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["mo-voi-ma-mut"], key: "burst", cast: "aim", skill: 0, gate: orb(1) },
  { ids: ["yeu-tinh-chuc-phuc"], key: "aid", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["trieu-hoi-ac-ma"], key: "hex", cast: "aim", skill: 0 },
  { ids: ["sau-non"], key: "cocoon", cast: "self", skill: 0, gate: orb(1) },
  { ids: ["ngai-khong-lo", "ngai-nu-hoang", "ngai-hoan-my"], key: "dust", cast: "aim", skill: 0, gate: orb(1) },
  { ids: ["sua-hut-ma-phap"], key: "spit", cast: "aim", skill: 0, label: (ctx) => `${chipLabel(ctx.cardId, "spit")} ${3 + ctx.stored}` },
  { ids: ["con-thinh-no-cua-hai-vuong"], key: "rage", cast: "aim", skill: 0, gate: (ctx) => ctx.afford(1) },
  { ids: ["chien-binh-lan-khuat"], key: "hide", cast: "self", skill: 0, gate: (ctx) => ctx.afford(1) },
];

export const FIELD_BIND_KEYS = ROWS.flatMap((row) => row.ids.map((id) => `${id}:${row.key}`));

/** Tên skill có trong danh sách nút nhưng không phải nút bấm trên sân. */
export const PASSIVE_CHIP_KEYS = ["ken-ngai:leg", "ky-si-cuoi-rong:spear", "ky-si-cuoi-rong:hell"];

export function fieldBindsFor(cardId: string, ctx: FieldBindCtx): FieldBindChip[] {
  const chips: FieldBindChip[] = [];
  for (const row of ROWS) {
    if (!row.ids.includes(cardId)) continue;
    if (row.gate && !row.gate(ctx)) continue;
    const go = () => (row.cast === "aim" ? ctx.aim(row.skill) : row.cast === "declare" ? ctx.declare(row.skill) : ctx.cast(row.skill));
    chips.push({ key: row.key, label: row.label?.(ctx) ?? chipLabel(cardId, row.key), go });
  }
  return chips;
}
