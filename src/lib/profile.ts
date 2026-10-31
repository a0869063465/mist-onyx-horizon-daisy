/**
 * Hồ sơ người chơi (chủ game 31/10): chỉ tính trận với người (Đánh thường, Tuỳ chọn). Mỗi máy ghi kết quả trận vào đây,
 * rồi gửi bản tổng hợp lên máy chủ cho bạn bè xem. Trận trước khi có tính năng này không được tính.
 */
export type ProfileMode = "quick" | "custom";
/** Bộ bài mang vào trận (cho dấu ba gạch trong Lịch sử đấu). */
export type DeckLite = { monsters: string[]; spells: string[]; name?: string | null; cover?: string | null };
export type ProfileGame = { mid: string; win: boolean; mode: ProfileMode; cover: string | null; at: number; turns?: number; mine?: DeckLite; foe?: DeckLite; foeId?: string };
export type AlbumStat = { name: string; cover: string; have: number; total: number };
export type SetStat = { name: string; reward: number; claimed: boolean; cards: { id: string; own: boolean }[] };
export type CollectionStat = { have: number; total: number; albums: AlbumStat[]; sets: SetStat[] };
/**
 * Chuỗi thắng (chủ game 31/10): chỉ trận Đánh thường. `run` = ID đối thủ của các trận thắng đang tính trong chuỗi hiện tại,
 * `last`/`same` = đối thủ thắng gần nhất và số trận thắng liên tiếp trước cùng người đó. `best` = chuỗi hợp lệ dài nhất từng đạt.
 */
export type Chain = { best: number; run: string[]; last: string | null; same: number };
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
  chain?: Chain;
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

const RUN_CAP = 300;

/**
 * Độ dài chuỗi sau khi áp quy tắc "ít nhất một nửa là người khác nhau": số người khác nhau × 2 ≥ số trận, không đủ thì
 * loại dần một trận của người gặp nhiều nhất.
 */
export function chainLength(run: string[]): number {
  const counts = new Map<string, number>();
  for (const id of run) counts.set(id, (counts.get(id) ?? 0) + 1);
  let total = run.length;
  while (total > 0 && counts.size * 2 < total) {
    let top = "";
    let most = 0;
    for (const [id, n] of counts) if (n > most) { top = id; most = n; }
    if (most <= 1) break;
    counts.set(top, most - 1);
    total -= 1;
  }
  return total;
}

/**
 * Cập nhật chuỗi thắng sau một trận Đánh thường. Thua thì hết chuỗi. Thắng không có ID đối thủ (trận cũ) thì không tính.
 * Thắng cùng một đối thủ lần thứ 3 liên tiếp trở đi thì bỏ qua, chuỗi không đứt.
 */
export function advanceChain(chain: Chain | undefined, win: boolean, foeId: string | undefined): Chain {
  const now: Chain = { best: chain?.best ?? 0, run: [...(chain?.run ?? [])], last: chain?.last ?? null, same: chain?.same ?? 0 };
  if (!win) return { ...now, run: [], last: null, same: 0 };
  if (!foeId) return now;
  now.same = now.last === foeId ? now.same + 1 : 1;
  now.last = foeId;
  if (now.same > 2) return now;
  now.run = [...now.run, foeId].slice(-RUN_CAP);
  now.best = Math.max(now.best, chainLength(now.run));
  return now;
}

/** Bản gửi lên máy chủ: bỏ danh sách đối thủ của chuỗi hiện tại, chỉ giữ kỷ lục. */
export function shareable(profile: Profile): Profile {
  const { chain, ...rest } = profile;
  return { ...rest, chain: { best: chain?.best ?? 0, run: [], last: null, same: 0 } };
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
  if (game.mode === "quick") profile.chain = advanceChain(profile.chain, game.win, game.foeId);
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

function cleanDeck(raw: unknown): DeckLite | undefined {
  const deck = raw as DeckLite | undefined;
  if (!deck || !Array.isArray(deck.monsters) || !Array.isArray(deck.spells)) return undefined;
  const ids = (list: unknown[]) => list.slice(0, 40).map((id) => String(id).slice(0, 80));
  return { monsters: ids(deck.monsters), spells: ids(deck.spells), name: typeof deck.name === "string" ? deck.name.slice(0, 40) : null, cover: typeof deck.cover === "string" ? deck.cover.slice(0, 80) : null };
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
      chain: { best: num(data.chain?.best), run: [], last: null, same: 0 },
      collection: data.collection
        ? {
            have: num(data.collection.have),
            total: num(data.collection.total),
            albums: (Array.isArray(data.collection.albums) ? data.collection.albums : []).slice(0, 30).map((row) => ({ name: String(row.name ?? "").slice(0, 40), cover: String(row.cover ?? "").slice(0, 120), have: num(row.have), total: num(row.total) })),
            sets: (Array.isArray(data.collection.sets) ? data.collection.sets : []).slice(0, 20).map((row) => ({
              name: String(row.name ?? "").slice(0, 40),
              reward: num(row.reward),
              claimed: Boolean(row.claimed),
              cards: (Array.isArray(row.cards) ? row.cards : []).slice(0, 6).map((card) => ({ id: String(card.id ?? "").slice(0, 80), own: Boolean(card.own) })),
            })),
          }
        : undefined,
      recent: (Array.isArray(data.recent) ? data.recent : []).slice(0, RECENT).map((row) => ({
        mid: String(row.mid ?? "").slice(0, 40),
        win: Boolean(row.win),
        mode: row.mode === "custom" ? "custom" : "quick",
        cover: typeof row.cover === "string" ? row.cover.slice(0, 80) : null,
        at: num(row.at),
        turns: num(row.turns) || undefined,
        mine: cleanDeck(row.mine),
        foe: cleanDeck(row.foe),
        foeId: typeof row.foeId === "string" ? row.foeId.slice(0, 8) : undefined,
      })),
    };
  } catch {
    return null;
  }
}
