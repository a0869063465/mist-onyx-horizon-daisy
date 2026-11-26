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

/**
 * Dung hợp từ lá giống nhau (chủ game 18/11): nguyên liệu nằm trên tay hoặc trên sân, kéo 1 lá trên tay ra là dung hợp.
 * Khổng lồ mặc giáp = 2 Khổng lồ 1 mắt; Khổng lồ thủ lĩnh = Mặc giáp + 1 mắt, hoặc 3 Khổng lồ 1 mắt.
 */
export const SET_FUSIONS: Array<{ result: string; materials: string[] }> = [
  { result: "khong-lo-mac-giap", materials: ["khong-lo-mot-mat", "khong-lo-mot-mat"] },
  { result: "khong-lo-thu-linh", materials: ["khong-lo-mac-giap", "khong-lo-mot-mat"] },
  { result: "khong-lo-thu-linh", materials: ["khong-lo-mot-mat", "khong-lo-mot-mat", "khong-lo-mot-mat"] },
  // Chiến binh cưỡi rồng = Rồng con + Chiến binh kỳ nhông (chủ game 18/11), nguyên liệu trên tay hoặc trên sân.
  { result: "chien-binh-cuoi-rong", materials: ["chien-binh-ky-nhong", "rong-con"] },
  // Phù thuỷ tí hơn cùng khuôn (chủ game 18/11): Tập sự = 2 tí hơn; Bậc thầy = Tập sự + 1 tí hơn, hoặc 3 tí hơn.
  { result: "phu-thuy-tap-su", materials: ["phu-thuy-ti-hon", "phu-thuy-ti-hon"] },
  { result: "phu-thuy-bac-thay", materials: ["phu-thuy-tap-su", "phu-thuy-ti-hon"] },
  { result: "phu-thuy-bac-thay", materials: ["phu-thuy-ti-hon", "phu-thuy-ti-hon", "phu-thuy-ti-hon"] },
  // Chị em Harpie = 2 Harpie Lady (chủ game 26/11), nguyên liệu trên tay hoặc trên sân; ra sân tự tách 3 lá (duel.ts `settleKin`).
  { result: "chi-em-harpie", materials: ["my-dieu-nhan", "my-dieu-nhan"] },
];

/** One material of a set fusion: a card in the hand (by index) or a monster on the field (by uid). */
export type FuseMat = { from: "hand"; index: number } | { from: "field"; uid: string };
export type SetFusion = { result: string; mats: FuseMat[] };

/**
 * The set fusions the hand card at `index` can start, one per result (field monsters before hand cards). Each lists every material, the dragged card first.
 */
export function setFusions(
  index: number,
  hand: Array<{ id: string }>,
  field: Array<{ uid: string; cardId: string } | null>,
): SetFusion[] {
  const held = hand[index];
  if (!held) return [];
  const out: SetFusion[] = [];
  for (const recipe of SET_FUSIONS) {
    if (!recipe.materials.includes(held.id)) continue;
    const need = [...recipe.materials];
    need.splice(need.indexOf(held.id), 1);
    const mats: FuseMat[] = [{ from: "hand", index }];
    const usedHand = new Set([index]);
    const usedField = new Set<string>();
    let ok = true;
    for (const id of need) {
      // Quái đang đứng trên sân được dùng trước (chủ game 18/11), thiếu thì mới lấy lá trên tay.
      const f = field.find((mon) => mon && mon.cardId === id && !usedField.has(mon.uid));
      if (f) {
        usedField.add(f.uid);
        mats.push({ from: "field", uid: f.uid });
        continue;
      }
      const h = hand.findIndex((card, i) => card.id === id && !usedHand.has(i));
      if (h >= 0) {
        usedHand.add(h);
        mats.push({ from: "hand", index: h });
        continue;
      }
      ok = false;
      break;
    }
    if (!ok) continue;
    const prior = out.findIndex((fusion) => fusion.result === recipe.result);
    // Cùng ra 1 quái bằng 2 cách: giữ cách ít lá hơn (Thủ lĩnh từ Mặc giáp + 1 mắt trước 3 lá 1 mắt).
    if (prior >= 0) {
      if (out[prior].mats.length > mats.length) out[prior] = { result: recipe.result, mats };
      continue;
    }
    out.push({ result: recipe.result, mats });
  }
  return out;
}

/** Phù thuỷ tí hơn và 2 dạng dung hợp của nó, đều dùng Cầu sấm (chủ game 18/11). */
export const HEXERS = ["phu-thuy-ti-hon", "phu-thuy-tap-su", "phu-thuy-bac-thay"] as const;
export const isHexer = (id: string | null | undefined): boolean => Boolean(id && (HEXERS as readonly string[]).includes(id));
/** Sát thương Cầu sấm cộng thêm theo lá: Tập sự +1, Bậc thầy +1. */
export const hexBonus = (id: string | null | undefined): number => (id === "phu-thuy-tap-su" || id === "phu-thuy-bac-thay" ? 1 : 0);
