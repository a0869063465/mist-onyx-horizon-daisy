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
