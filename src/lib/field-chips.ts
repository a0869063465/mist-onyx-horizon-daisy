import { chipLabel } from "@/lib/card-edits";
import { skillManaCost } from "@/lib/duel";

export type FieldBindCtx = {
  cardId: string;
  orb: number;
  level: number;
  hp: number;
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

export type FieldBindChip = { key: string; label: string; go: () => void; skill: number; aims: boolean };

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
  { ids: ["mat-do-tan-pha"], key: "ball", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["cuc-bong-ma-quai"], key: "mult", cast: "self", skill: 0, gate: (ctx) => ctx.afford(skillManaCost(ctx.cardId, 1)) && !ctx.spent.includes("mult") },
  { ids: ["hoa-an-thit-nguoi"], key: "bite", cast: "aim", skill: 0 },
  { ids: ["thuong-quan-long"], key: "spin", cast: "declare", skill: 0, gate: pay(1) },
  { ids: ["nang-va-gio"], key: "sun", cast: "declare", skill: 0, gate: pay(2) },
  // Pháo kích: cần 1 quái thú khác của mình trên sân làm đạn (sân 6 ô, còn trống nhiều nhất 4 ô).
  { ids: ["rua-may-ban-da"], key: "shell", cast: "aim", skill: 0, gate: (ctx) => ctx.afford(skillManaCost(ctx.cardId, 1)) && ctx.room <= 4 },
  { ids: ["may-nem-bom-hinh-nhen"], key: "bomb", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["rong-con", "rong-ngan-tuoi"], key: "breath", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["phu-thuy-ti-hon", "phu-thuy-tap-su", "phu-thuy-bac-thay"], key: "hex", cast: "aim", skill: 0, gate: orb(1) },
  { ids: ["ma-dao-si"], key: "dan", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["loi-nguyen-cua-rong"], key: "fire", cast: "aim", skill: 0, gate: pay(0) },
  { ids: ["rong-ac-ma"], key: "orb", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["rong-phun-hoa-cau"], key: "peek", cast: "declare", skill: 0, gate: pay(1) },
  { ids: ["rong-phun-hoa-cau"], key: "fire", cast: "aim", skill: 1, gate: orb(1) },
  { ids: ["phu-thuy-thoi-gian"], key: "age", cast: "aim", skill: 0 },
  { ids: ["kiem-si-lua-thieng"], key: "fire", cast: "aim", skill: 0 },
  { ids: ["ong-khong-lo"], key: "stun", cast: "aim", skill: 0, gate: orb(1) },
  { ids: ["phu-thuy-rung-den"], key: "curse", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["mo-voi-ma-mut"], key: "burst", cast: "aim", skill: 0, gate: orb(1) },
  { ids: ["yeu-tinh-chuc-phuc"], key: "aid", cast: "aim", skill: 0, gate: pay(1) },
  { ids: ["trieu-hoi-ac-ma"], key: "hex", cast: "aim", skill: 0 },
  { ids: ["sau-non"], key: "cocoon", cast: "self", skill: 0, gate: orb(1) },
  { ids: ["ngai-khong-lo", "ngai-nu-hoang", "ngai-hoan-my"], key: "dust", cast: "aim", skill: 0, gate: orb(1) },
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
    chips.push({ key: row.key, label: row.label?.(ctx) ?? chipLabel(cardId, row.key), go, skill: row.skill, aims: row.cast === "aim" });
  }
  return chips;
}
