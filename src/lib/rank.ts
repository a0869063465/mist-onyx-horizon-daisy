/** Hạng người chơi (chủ game 31/10): 6 hạng, mỗi hạng 4 cấp, IV thấp nhất, I cao nhất. Chưa có luật lên hạng. */
export const RANKS = [
  "Vua trò chơi",
  "Đấu thủ lừng danh",
  "Đấu thủ chuyên nghiệp",
  "Học viên học viện",
  "Bài thủ nghiệp dư",
  "Tập chơi",
] as const;

const ROMAN = ["I", "II", "III", "IV"] as const;

/** tier 0 = Vua trò chơi … 5 = Tập chơi; level 1 = cấp I (cao nhất) … 4 = cấp IV (thấp nhất). */
export function rankLabel(tier: number, level: number): string {
  const name = RANKS[Math.min(RANKS.length - 1, Math.max(0, tier))];
  return `${name} ${ROMAN[Math.min(3, Math.max(0, level - 1))]}`;
}

/** Người chơi mới: hạng thấp nhất. */
export const START_RANK = { tier: RANKS.length - 1, level: 4 };
