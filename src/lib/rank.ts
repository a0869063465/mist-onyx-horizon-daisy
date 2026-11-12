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

/** Huy hiệu hạng (chủ game 01/11): cùng một hình cho cả 4 cấp, xếp theo `RANKS` (0 = Vua trò chơi … 5 = Tập chơi). */
const BADGES = ["vua", "lung-danh", "chuyen-nghiep", "hoc-vien", "nghiep-du", "tap-choi"] as const;

export function rankBadge(tier: number): string {
  return `/ui/rank/${BADGES[Math.min(BADGES.length - 1, Math.max(0, tier))]}.webp`;
}

/** Khung hồ sơ theo hạng (chủ game 11/11): ảnh khung + ô trống giữa (px ảnh, [trái, trên, phải, dưới]) để đặt ảnh đại diện vừa ô. */
const FRAMES = {
  "vua": { w: 575, h: 640, hole: [122, 160, 453, 483] },
  "lung-danh": { w: 629, h: 640, hole: [132, 141, 497, 495] },
  "chuyen-nghiep": { w: 619, h: 590, hole: [108, 120, 466, 467] },
  "hoc-vien": { w: 492, h: 640, hole: [98, 189, 395, 486] },
  "nghiep-du": { w: 640, h: 633, hole: [124, 113, 512, 476] },
  "tap-choi": { w: 507, h: 540, hole: [77, 98, 404, 415] },
} as const;

export function rankFrame(tier: number) {
  const key = BADGES[Math.min(BADGES.length - 1, Math.max(0, tier))];
  return { src: `/ui/rank-frame/${key}.webp`, ...FRAMES[key] };
}
