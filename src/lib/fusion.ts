export type FusionRecipe = {
  materials: [string, string];
  result: string;
};

export const FUSIONS: FusionRecipe[] = [
  { materials: ["ky-si-bong-toi", "loi-nguyen-cua-rong"], result: "ky-si-cuoi-rong" },
  { materials: ["mat-do-tan-pha", "trieu-hoi-ac-ma"], result: "rong-ac-ma" },
];

export function findFusion(a: string, b: string): FusionRecipe | null {
  return (
    FUSIONS.find((recipe) => {
      const [left, right] = recipe.materials;
      return (left === a && right === b) || (left === b && right === a);
    }) ?? null
  );
}

const KNIGHTS = ["hiep-si-cua-vua", "hiep-si-ho-ve", "hiep-si-cua-hau"];

export function findKnightFusion(hand: string, host: string, fieldIds: string[]): { result: string } | null {
  if (!KNIGHTS.includes(hand) || !KNIGHTS.includes(host) || hand === host) return null;
  const present = new Set([hand, host, ...fieldIds]);
  if (!KNIGHTS.every((id) => present.has(id))) return null;
  return { result: "hiep-si-huyen-bi" };
}

/** The third card of a three-knight fusion: the knight on the field that is neither the hand card nor the host. */
export function thirdKnight<T extends { uid: string; cardId: string }>(hand: string, host: T, field: Array<T | null>): T | null {
  const ids = field.filter((mon): mon is T => Boolean(mon)).map((mon) => mon.cardId);
  if (!findKnightFusion(hand, host.cardId, ids)) return null;
  return field.find((mon): mon is T => Boolean(mon && mon.uid !== host.uid && KNIGHTS.includes(mon.cardId) && mon.cardId !== hand && mon.cardId !== host.cardId)) ?? null;
}
