import { spellCard } from "./catalog.ts";

/**
 * Spell kinds (môi trường, phản đòn, giải trừ, đa năng, khống chế, sát thương), shown as one icon per spell on the
 * deck list and the spell sheet. The icon is the reaction bar's where there is one (`react`), else a game icon
 * (`glyph`); its colour is the reaction bar's colour for that icon. The owner will pick the final icons.
 */
export type SpellKindKey = "env" | "rebound" | "cleanse" | "multi" | "bind" | "harm";
export type SpellKind = {
  key: SpellKindKey;
  label: string;
  react?: "rebound" | "block" | "buff" | "chain" | "skill";
  glyph?: string;
  tone: string;
  ids: string[];
};

export const SPELL_KINDS: SpellKind[] = [
  { key: "env", label: "Môi trường", glyph: "mountains", tone: "#e0a85a", ids: ["bien-sau", "thao-nguyen", "dat-da", "nui", "rung-ram", "bong-toi", "cu-dia-may-moc", "thanh-dia-thien-su", "nui-dung-nham"] },
  { key: "rebound", label: "Phản đòn", react: "rebound", tone: "#ff4f93", ids: ["co-may-thoi-gian", "giap-co-khi", "hoan-doi", "la-chan-phan-don", "phuc-kich", "guong-phong-ho"] },
  { key: "cleanse", label: "Giải trừ", react: "block", tone: "#f5c542", ids: ["hap-thu-ma-phap", "mua-ma-thuat", "phan-nguyen", "vong-xoay-bao-ho"] },
  { key: "multi", label: "Đa năng", react: "buff", tone: "#3ddc6a", ids: ["ke-dao-mo", "mu-ma-phap", "thu-hoi-quai-thu"] },
  { key: "bind", label: "Khống chế", react: "chain", tone: "#d7d7e2", ids: ["soi-xich-dia-nguc", "thanh-guom-anh-sang", "vong-nguyen-rua-ac-ma", "ngan-chan-phong-ngu"] },
  { key: "harm", label: "Sát thương", react: "skill", tone: "#4aa8ff", ids: ["sung-loi-pha", "sam-set-tan-the", "virus-an-mon"] },
];

/** The kind of a spell; a spell no kind lists (a new one) counts as an environment if it is one, else Đa năng. */
export function spellKind(id: string): SpellKind {
  const listed = SPELL_KINDS.find((kind) => kind.ids.includes(id));
  if (listed) return listed;
  return SPELL_KINDS.find((kind) => kind.key === (spellCard(id)?.env ? "env" : "multi")) ?? SPELL_KINDS[0];
}

/** Spells in kind order (the order of SPELL_KINDS, then each kind's list). */
export function spellKindRank(id: string): number {
  const kind = spellKind(id);
  const at = SPELL_KINDS.indexOf(kind);
  const inside = kind.ids.indexOf(id);
  return at * 100 + (inside < 0 ? 99 : inside);
}
