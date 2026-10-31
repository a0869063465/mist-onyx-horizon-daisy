/**
 * Hồ sơ người chơi (chủ game 31/10): chỉ tính trận với người (Đánh thường, Tuỳ chọn). Mỗi máy ghi kết quả trận vào đây,
 * rồi gửi bản tổng hợp lên máy chủ cho bạn bè xem. Trận trước khi có tính năng này không được tính.
 */
export type ProfileMode = "quick" | "custom";
export type ProfileGame = { mid: string; win: boolean; mode: ProfileMode; cover: string | null; at: number; turns?: number };
export type AlbumStat = { name: string; have: number; total: number };
export type CollectionStat = { have: number; total: number; albums: AlbumStat[] };
export type Profile = {
  games: number;
  wins: number;
  modes: Record<ProfileMode, number>;
  covers: Record<string, number>;
  recent: ProfileGame[];
  /** Tổng số lượt chung của các trận có ghi số lượt, và số trận đó (lối chơi = trung bình). */
  turns?: number;
  turnGames?: number;
  streak?: number;
  best?: number;
  winsBy?: Record<ProfileMode, number>;
  collection?: CollectionStat;
};

const KEY = "clash-profile";
export const RECENT = 10;

export const EMPTY_PROFILE: Profile = { games: 0, wins: 0, modes: { quick: 0, custom: 0 }, covers: {}, recent: [] };

export function loadProfile(): Profile {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Profile | null;
    if (raw && typeof raw.games === "number" && Array.isArray(raw.recent)) return { ...EMPTY_PROFILE, ...raw, modes: { ...EMPTY_PROFILE.modes, ...raw.modes } };
  } catch {
    // Không đọc được: bắt đầu lại.
  }
  return { ...EMPTY_PROFILE, modes: { quick: 0, custom: 0 }, covers: {}, recent: [] };
}

/** Ghi một trận với người; cùng `mid` chỉ tính một lần. */
export function recordGame(game: ProfileGame): boolean {
  if (!game.mid) return false;
  const profile = loadProfile();
  if (profile.recent.some((row) => row.mid === game.mid)) return false;
  profile.games += 1;
  if (game.win) profile.wins += 1;
  profile.winsBy = { quick: profile.winsBy?.quick ?? 0, custom: profile.winsBy?.custom ?? 0 };
  if (game.win) profile.winsBy[game.mode] += 1;
  profile.streak = game.win ? (profile.streak ?? 0) + 1 : 0;
  profile.best = Math.max(profile.best ?? 0, profile.streak);
  if (game.turns && game.turns > 0) {
    profile.turns = (profile.turns ?? 0) + game.turns;
    profile.turnGames = (profile.turnGames ?? 0) + 1;
  }
  profile.modes[game.mode] += 1;
  if (game.cover) profile.covers[game.cover] = (profile.covers[game.cover] ?? 0) + 1;
  profile.recent = [game, ...profile.recent].slice(0, RECENT);
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    return false;
  }
  return true;
}

/** Chế độ chơi nhiều nhất (null khi chưa có trận), bìa bộ bài dùng nhiều nhất. */
export function favourites(profile: Profile): { mode: ProfileMode | null; cover: string | null } {
  const mode = profile.games === 0 ? null : profile.modes.custom > profile.modes.quick ? "custom" : "quick";
  const covers = Object.entries(profile.covers).sort((a, b) => b[1] - a[1]);
  return { mode, cover: covers[0]?.[0] ?? null };
}

/** Lối chơi: trung bình số lượt chung của trận lúc hết trận (null khi chưa có số liệu). */
export function avgTurns(profile: Profile): number | null {
  return profile.turnGames ? Math.round((profile.turns ?? 0) / profile.turnGames * 10) / 10 : null;
}

export function winRate(profile: Profile): number {
  return profile.games === 0 ? 0 : Math.round((profile.wins / profile.games) * 100);
}

/** Đọc bản tổng hợp từ máy chủ: chỉ nhận số và chữ ngắn. */
export function cleanProfile(raw: unknown): Profile | null {
  try {
    const data = (typeof raw === "string" ? JSON.parse(raw) : raw) as Profile | null;
    if (!data || typeof data.games !== "number") return null;
    const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
    const covers: Record<string, number> = {};
    for (const [id, n] of Object.entries(data.covers ?? {}).slice(0, 60)) covers[String(id).slice(0, 80)] = num(n);
    return {
      games: num(data.games),
      wins: num(data.wins),
      modes: { quick: num(data.modes?.quick), custom: num(data.modes?.custom) },
      covers,
      turns: num(data.turns),
      turnGames: num(data.turnGames),
      streak: num(data.streak),
      best: num(data.best),
      winsBy: { quick: num(data.winsBy?.quick), custom: num(data.winsBy?.custom) },
      collection: data.collection
        ? {
            have: num(data.collection.have),
            total: num(data.collection.total),
            albums: (Array.isArray(data.collection.albums) ? data.collection.albums : []).slice(0, 30).map((row) => ({ name: String(row.name ?? "").slice(0, 40), have: num(row.have), total: num(row.total) })),
          }
        : undefined,
      recent: (Array.isArray(data.recent) ? data.recent : []).slice(0, RECENT).map((row) => ({
        mid: String(row.mid ?? "").slice(0, 40),
        win: Boolean(row.win),
        mode: row.mode === "custom" ? "custom" : "quick",
        cover: typeof row.cover === "string" ? row.cover.slice(0, 80) : null,
        at: num(row.at),
      })),
    };
  } catch {
    return null;
  }
}
