import { EVOLUTIONS } from "./strategies.ts";

/**
 * Lá liên quan (owner, 19/10): the cards of one evolution or fusion family, shown together in the 3D fan when the
 * card on a sheet is tapped. Families come from EVOLUTIONS (what a form needs and what it becomes), the cards it
 * needs first, then the forms; Chân kén goes with Kén ngài, the form it grows legs from.
 */
const EXTRA_AFTER: Record<string, string[]> = { "ken-ngai": ["chan-ken"] };

function families(): string[][] {
  const groups: Array<{ needs: string[]; results: string[] }> = [];
  for (const row of EVOLUTIONS) {
    const ids = [...row.needs, row.result];
    const hits = groups.filter((group) => ids.some((id) => group.needs.includes(id) || group.results.includes(id)));
    const merged = { needs: hits.flatMap((group) => group.needs), results: hits.flatMap((group) => group.results) };
    for (const id of row.needs) if (!merged.needs.includes(id) && !merged.results.includes(id)) merged.needs.push(id);
    if (!merged.results.includes(row.result) && !merged.needs.includes(row.result)) merged.results.push(row.result);
    for (const group of hits) groups.splice(groups.indexOf(group), 1);
    groups.push(merged);
  }
  return groups.map((group) => [...group.needs, ...group.results].flatMap((id) => [id, ...(EXTRA_AFTER[id] ?? [])]));
}

const FAMILIES = families();

/** The family of a card, itself included, or an empty list when it has none. */
export function relatedCards(id: string): string[] {
  return FAMILIES.find((family) => family.includes(id)) ?? [];
}
