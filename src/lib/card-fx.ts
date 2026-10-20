import { MONSTER_CHIPS } from "@/lib/card-edits";
import { FORMS, MONSTERS, SPELLS, monsterCard } from "@/lib/catalog";

export type CardFx = "fire" | "spell" | "gun";
export type SpellFx = CardFx | "bolt" | "spark" | "none";
export type SkillLook = CardFx | "tide-small" | "tide-mid" | "tide-big" | null;

export type SkillSlot = { key: string; name: string; index: number };

const KEY = "clash-card-fx";

export const CARD_FX_CHOICES: { id: CardFx; label: string }[] = [
  { id: "fire", label: "Lửa" },
  { id: "spell", label: "Phép thường" },
  { id: "gun", label: "Súng" },
];

export const SPELL_FX_CHOICES: { id: SpellFx; label: string }[] = [
  { id: "bolt", label: "Sét" },
  { id: "spark", label: "Điện" },
  ...CARD_FX_CHOICES,
  { id: "none", label: "Không" },
];

const EXTRA: Record<string, SkillSlot[]> = {
  "trai-tim-hai-long": [
    { key: "tide", name: "Triều lên", index: 0 },
    { key: "surge", name: "Con nước lớn tàn phá", index: 1 },
    { key: "doom", name: "Đại thuỷ triều huỷ diệt", index: 2 },
  ],
  "kiem-si-lua-thieng": [
    { key: "fire", name: "Vệt Lửa", index: 0 },
    { key: "echo", name: "Đòn thêm", index: 8 },
    { key: "last", name: "Hoả thần long", index: 9 },
  ],
  "mat-xanh-huy-diet": [{ key: "gaze", name: "Tia sáng huỷ diệt", index: 0 }],
  "mat-do-tan-pha": [{ key: "ball", name: "Cầu lửa địa ngục", index: 0 }],
};

type Store = { m: Record<string, Record<string, CardFx>>; s: Record<string, SpellFx> };

const empty = (): Store => ({ m: {}, s: {} });

function isFx(value: unknown): value is CardFx {
  return value === "fire" || value === "spell" || value === "gun";
}

function isSpellFx(value: unknown): value is SpellFx {
  return isFx(value) || value === "none" || value === "bolt" || value === "spark";
}

export function loadCardFx(): Store {
  if (typeof localStorage === "undefined") return empty();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Store> | null;
    const store = empty();
    if (!raw) return store;
    for (const [cardId, row] of Object.entries(raw.m ?? {})) {
      if (!row || typeof row !== "object") continue;
      const next: Record<string, CardFx> = {};
      for (const [skill, fx] of Object.entries(row)) if (isFx(fx)) next[skill] = fx;
      if (Object.keys(next).length) store.m[cardId] = next;
    }
    for (const [cardId, fx] of Object.entries(raw.s ?? {})) if (isSpellFx(fx)) store.s[cardId] = fx;
    const gaze = store.m["mat-xanh-huy-diet"];
    if (gaze?.gaze) {
      delete gaze.gaze;
      if (!Object.keys(gaze).length) delete store.m["mat-xanh-huy-diet"];
      write(store);
    }
    return store;
  } catch {
    return empty();
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function skillsOf(cardId: string): SkillSlot[] {
  if (EXTRA[cardId]) return EXTRA[cardId];
  const chips = MONSTER_CHIPS[cardId];
  if (chips?.length) {
    return chips.map((chip, index) => ({
      key: chip.key,
      name: chip.label,
      index: skillIndex(cardId, chip.key, index),
    }));
  }
  const line = monsterCard(cardId)?.skill.split("\n")[0]?.replace(/\.$/, "").trim() || "";
  const name = line.length > 0 && line.length <= 28 ? line : "Kỹ năng";
  return [{ key: "skill", name, index: 0 }];
}

function skillIndex(cardId: string, key: string, fallback: number) {
  if (cardId === "rong-phun-hoa-cau") return key === "fire" ? 1 : 0;
  if (cardId === "phu-thuy-thoi-gian") return key === "all" ? 2 : 0;
  if (cardId === "ga-he-dang-so") return key === "cast" ? 1 : 0;
  return fallback;
}

export function slotFor(cardId: string, index: number): SkillSlot | undefined {
  const skills = skillsOf(cardId);
  if (cardId === "kiem-si-lua-thieng") {
    if (index === 8) return skills.find((skill) => skill.key === "echo");
    if (index === 9) return skills.find((skill) => skill.key === "last");
    return skills.find((skill) => skill.key === "fire");
  }
  if (cardId === "phu-thuy-thoi-gian") return skills.find((skill) => skill.key === (index >= 2 ? "all" : "age"));
  if (cardId === "rong-phun-hoa-cau") return skills.find((skill) => skill.key === (index > 0 ? "fire" : "peek"));
  if (cardId === "ga-he-dang-so") return skills.find((skill) => skill.key === (index === 1 ? "cast" : "charge"));
  return skills.find((skill) => skill.index === index) ?? skills[0];
}

export function baseSkillLook(cardId: string, index = 0): SkillLook {
  if (cardId === "trai-tim-hai-long") return index >= 2 ? "tide-big" : index === 1 ? "tide-mid" : "tide-small";
  if (cardId === "kiem-si-lua-thieng") return "fire";
  if (cardId === "rong-phun-hoa-cau" && index === 1) return "fire";
  if (cardId === "ga-he-dang-so") return index === 1 ? "spell" : null;
  if (
    cardId === "phu-thuy-ti-hon" ||
    cardId === "trieu-hoi-ac-ma" ||
    cardId === "sua-hut-ma-phap" ||
    cardId === "con-thinh-no-cua-hai-vuong" ||
    cardId === "mo-voi-ma-mut" ||
    cardId === "ngai-khong-lo" ||
    cardId === "ngai-nu-hoang" ||
    cardId === "ngai-hoan-my" ||
    cardId === "ma-dao-si"
  ) {
    return "spell";
  }
  if (cardId === "mat-do-tan-pha") return "fire";
  if (cardId === "loi-nguyen-cua-rong") return "fire";
  if (cardId === "thuong-quan-long") return "gun";
  if (cardId === "may-nem-bom-hinh-nhen") return "gun";
  if (cardId === "may-quay-thuong") return index === 1 ? "spell" : null;
  if (cardId === "rong-con" || cardId === "rong-ngan-tuoi" || cardId === "rong-ac-ma") return "fire";
  return null;
}

export function choiceOf(cardId: string, skillKey: string, store = loadCardFx()): CardFx | null {
  return store.m[cardId]?.[skillKey] ?? null;
}

export function shownChoice(cardId: string, skill: SkillSlot, store = loadCardFx()): CardFx | null {
  const picked = choiceOf(cardId, skill.key, store);
  if (picked) return picked;
  const base = baseSkillLook(cardId, skill.index);
  return base === "fire" || base === "spell" || base === "gun" ? base : null;
}

export function setMonsterFx(cardId: string, skillKey: string, fx: CardFx) {
  const store = loadCardFx();
  const skill = skillsOf(cardId).find((item) => item.key === skillKey);
  const base = skill ? baseSkillLook(cardId, skill.index) : null;
  const row = { ...(store.m[cardId] ?? {}) };
  if (base === fx || row[skillKey] === fx) delete row[skillKey];
  else row[skillKey] = fx;
  if (Object.keys(row).length) store.m[cardId] = row;
  else delete store.m[cardId];
  write(store);
}

const SPELL_HIT = new Set(["sam-set-tan-the", "phuc-kich", "virus-an-mon", "ham-chong"]);

export function spellBase(cardId: string): SpellFx {
  if (cardId === "sam-set-tan-the") return "bolt";
  if (cardId === "sung-loi-pha") return "spark";
  if (SPELL_HIT.has(cardId)) return "spell";
  return "none";
}

export function setSpellFx(cardId: string, fx: SpellFx) {
  const store = loadCardFx();
  if (fx === spellBase(cardId) || store.s[cardId] === fx) delete store.s[cardId];
  else store.s[cardId] = fx;
  write(store);
}

export function spellChoice(cardId: string, store = loadCardFx()): SpellFx {
  return store.s[cardId] ?? spellBase(cardId);
}

export function spellFxLook(cardId: string): SpellFx | null {
  return loadCardFx().s[cardId] ?? null;
}

export function skillVisual(cardId: string, index = 0): SkillLook {
  if (cardId === "mat-xanh-huy-diet") return null;
  const slot = slotFor(cardId, index);
  const picked = slot ? loadCardFx().m[cardId]?.[slot.key] : null;
  if (picked) return picked;
  return baseSkillLook(cardId, index);
}

export function cardFxMonsters() {
  return [...MONSTERS, ...FORMS].sort((a, b) => a.stars - b.stars || a.name.localeCompare(b.name, "vi"));
}

export function cardFxSpells() {
  return [...SPELLS].sort((a, b) => a.gems - b.gems || a.name.localeCompare(b.name, "vi"));
}

function fxLabel(fx: SpellFx) {
  return SPELL_FX_CHOICES.find((item) => item.id === fx)?.label ?? fx;
}

export function exportCardFx(): string {
  const store = loadCardFx();
  const blocks: string[] = [];
  for (const card of cardFxMonsters()) {
    const row = store.m[card.id];
    if (!row) continue;
    const lines = skillsOf(card.id)
      .filter((skill) => row[skill.key])
      .map((skill) => `${skill.name}: ${fxLabel(row[skill.key])}`);
    if (lines.length) blocks.push([card.name, ...lines].join("\n"));
  }
  for (const card of cardFxSpells()) {
    const fx = store.s[card.id];
    if (fx) blocks.push(`${card.name}: ${fxLabel(fx)}`);
  }
  if (!blocks.length) return "";
  return `HIỆU ỨNG LÁ BÀI\n\n${blocks.join("\n\n")}\n`;
}

export function tideNote(cardId: string, skill: SkillSlot, store = loadCardFx()) {
  if (choiceOf(cardId, skill.key, store)) return "";
  const base = baseSkillLook(cardId, skill.index);
  if (base === "tide-small" || base === "tide-mid" || base === "tide-big") return "Skill này giữ nước riêng của Trái tim hải long.";
  return "";
}
