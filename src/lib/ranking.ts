import { avgTurns, type Profile } from "./profile";

/**
 * Bảng xếp hạng chỉ số (chủ game 31/10, theo bảng xếp hạng Liên Quân): mỗi chỉ số một bảng xếp hạng trong mọi người chơi
 * có hồ sơ trên máy chủ (hoặc chỉ bạn bè). Mục cuối là Tổng quan: mạng nhện 5 trục chấm x/5 theo phần trăm.
 */
export type StatKey = "rank" | "games" | "level" | "winrate" | "style" | "collection" | "streak";

export const STAT_LIST: { key: StatKey; label: string }[] = [
  { key: "rank", label: "Xếp hạng" },
  { key: "games", label: "Số trận" },
  { key: "level", label: "Cấp độ" },
  { key: "winrate", label: "Tỉ lệ thắng" },
  { key: "style", label: "Lối chơi" },
  { key: "collection", label: "Bộ sưu tập" },
  { key: "streak", label: "Chuỗi thắng" },
];

/** Năm trục của mạng nhện, theo thứ tự quanh vòng. */
export const RADAR_AXES: StatKey[] = ["winrate", "games", "streak", "style", "collection"];

/** Mốc số trận: qua mốc nào mới đồng nhóm với người ở mốc đó (chủ game 31/10). */
export const MILESTONES = [20, 50, 100, 200, 400, 800];

export function groupOf(games: number): number {
  return MILESTONES.filter((mark) => games >= mark).length;
}

/** Khoá so sánh của một chỉ số: lớn hơn là hạng cao hơn, so từng phần tử. Xếp hạng và Cấp độ chưa có luật nên ai cũng bằng nhau. */
export function statKey(profile: Profile, stat: StatKey): number[] {
  switch (stat) {
    case "rank":
    case "level":
      return [0];
    case "games":
      return [profile.games];
    case "winrate":
      return [groupOf(profile.games), profile.games ? profile.wins / profile.games : 0];
    case "style":
      return [avgTurns(profile) ?? -1];
    case "collection":
      return [profile.collection?.have ?? 0];
    case "streak":
      return [profile.chain?.best ?? 0];
  }
}

/** Số hiện ra trên hàng (null khi chưa có số liệu). */
export function statValue(profile: Profile, stat: StatKey): number | null {
  switch (stat) {
    case "rank":
      return 0;
    case "level":
      return 1;
    case "games":
      return profile.games;
    case "winrate":
      return profile.games ? Math.round((profile.wins / profile.games) * 1000) / 10 : 0;
    case "style":
      return avgTurns(profile);
    case "collection":
      return profile.collection?.have ?? 0;
    case "streak":
      return profile.chain?.best ?? 0;
  }
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export type Entry = { id: string; cover: string | null; profile: Profile };
export type Ranked = { pos: number; id: string; cover: string | null; v: number | null; games: number; wins: number };

/** Xếp mọi người theo một chỉ số; bằng nhau thì cùng hạng. */
export function rankAll(field: Entry[], stat: StatKey): Ranked[] {
  const keyed = field.map((entry) => ({ entry, key: statKey(entry.profile, stat) }));
  keyed.sort((x, y) => compare(x.key, y.key) || x.entry.id.localeCompare(y.entry.id));
  const out: Ranked[] = [];
  keyed.forEach((row, i) => {
    const pos = i > 0 && compare(keyed[i - 1]!.key, row.key) === 0 ? out[i - 1]!.pos : i + 1;
    out.push({ pos, id: row.entry.id, cover: row.entry.cover, v: statValue(row.entry.profile, stat), games: row.entry.profile.games, wins: row.entry.profile.wins });
  });
  return out;
}

/** Cần ít nhất chừng này người mới chấm x/5 (dưới đó ghi "Chưa đủ dữ liệu"). */
export const RADAR_MIN = 5;

/** Điểm x/5 của một người trên một trục: top 20% = 5, 20–40% = 4, … (bằng nhau thì cùng điểm). */
export function radarScore(field: Entry[], id: string, stat: StatKey): number {
  const ranked = rankAll(field, stat);
  const row = ranked.find((one) => one.id === id);
  if (!row || ranked.length === 0) return 0;
  const better = row.pos - 1;
  return Math.max(1, 5 - Math.floor((better / ranked.length) * 5));
}
