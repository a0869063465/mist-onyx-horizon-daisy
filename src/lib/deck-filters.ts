import { SPELLS, monsterCard } from "./catalog.ts";
import { ENV_KINDS } from "./env-kinds.ts";
import type { Strategy } from "./strategies.ts";

/**
 * Filters of the deck builder's card pool (monsters only): by environment (the kinds the environment cards
 * favour), by type (groups of the tactics list), by stars. Within one section any chosen button matches; across
 * sections every section must match.
 */

/** The environment buttons, in the catalog's order of the environment cards. */
export const ENV_FILTERS = SPELLS.filter((card) => card.env && ENV_KINDS[card.id]).map((card) => ({ id: card.id, label: card.name }));

/**
 * Monster types (owner, 18/10), each the monsters of some tactics groups:
 * Đa dụng = the situational ones; Sát thương = big, steady and versatile damage; Đấu sĩ = the fighters;
 * Phòng ngự = defence specialists; Theo bộ = monsters that come as a set; Phát triển = the ones that grow.
 */
export const MONSTER_TYPES: Array<{ key: string; label: string; icon: string; plans: string[] }> = [
  { key: "da-dung", label: "Đa dụng", icon: "card-joker", plans: ["tinh-huong"] },
  { key: "sat-thuong", label: "Sát thương", icon: "spiky-explosion", plans: ["sat-lon", "sat-on", "sat-da-nang"] },
  { key: "dau-si", label: "Đấu sĩ", icon: "crossed-swords", plans: ["chien-binh", "ben-bi", "cap-thap", "chien-dau"] },
  { key: "phong-ngu", label: "Phòng ngự", icon: "checked-shield", plans: ["phong-da-dung"] },
  { key: "theo-bo", label: "Theo bộ", icon: "three-friends", plans: ["khien-hiep-si", "guom-khien"] },
  { key: "phat-trien", label: "Phát triển", icon: "growth", plans: ["tich-luy", "may-rui", "don-chien", "chi-so-tot"] },
];

export const STAR_FILTERS = [1, 2, 3, 4];

export type PoolFilter = { envs: string[]; types: string[]; stars: number[] };
export const NO_FILTER: PoolFilter = { envs: [], types: [], stars: [] };

export function filterOn(filter: PoolFilter): boolean {
  return filter.envs.length + filter.types.length + filter.stars.length > 0;
}

/** True when the monster passes the filter (`plans` is the tactics list in use, so the owner's edits count). */
export function passesFilter(id: string, filter: PoolFilter, plans: Strategy[]): boolean {
  if (filter.envs.length && !filter.envs.some((env) => ENV_KINDS[env]?.includes(id))) return false;
  if (filter.types.length) {
    const groups = MONSTER_TYPES.filter((type) => filter.types.includes(type.key)).flatMap((type) => type.plans);
    if (!plans.some((plan) => groups.includes(plan.id) && plan.cards.includes(id))) return false;
  }
  if (filter.stars.length && !filter.stars.includes(monsterCard(id)?.stars ?? 0)) return false;
  return true;
}

/** Lower-case, accents off ("hoá" → "hoa"), so a search finds names typed without marks. */
export function plainName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
