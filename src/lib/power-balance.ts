import { CARD_CLOCK } from "@/lib/card-clock";
import { FORMS, MONSTERS, SPELLS } from "@/lib/catalog";
import { BALANCE_BASE, type Snap } from "@/lib/power-balance-base";

export type { Snap };

export type StatKey = "hp" | "atk" | "def" | "mdef" | "stars" | "mana";
export type Tone = "up" | "down" | "shift";

export type BalanceEntry = {
  id: string;
  at: string;
  wave: number;
  tone?: Tone;
  stats?: Partial<Record<StatKey, { from: number; to: number }>>;
  notes?: string[];
};

/**
 * Cũ ở trên, mới ở dưới. Không sửa BALANCE_BASE.
 * Sửa chỉ số trong code thì thêm một mục vào cuối: ngày, id, từ và tới.
 * Cùng một lần sửa thì cùng wave. Wave lớn hơn là đợt mới hơn.
 * Tăng chỉ số, tăng sát thương, giảm mana hoặc giảm sao là Tăng. Ngược lại là Giảm.
 * Cùng lúc có cả hai hướng thì là Thay đổi lối chơi.
 * Đổi skill của quái hoặc phép cũ thì hỏi trước, rồi mới ghi tone và notes.
 * Quên ghi thì phần lệch so với lần cuối vẫn tự hiện thành một lần mới.
 */
export const BALANCE_LOG: BalanceEntry[] = [
  {
    id: "khong-lo-mot-mat",
    at: "2026-10-08",
    wave: 1,
    tone: "shift",
    stats: { mana: { from: 1, to: 0 } },
    notes: ["Thêm kỹ năng Đập phá"],
  },
  {
    id: "yeu-tinh-chuc-phuc",
    at: "2026-10-08",
    wave: 2,
    stats: { mana: { from: 1, to: 2 } },
  },
  {
    id: "kazura",
    at: "2026-10-08",
    wave: 3,
    stats: { mana: { from: 0, to: 1 } },
  },
  {
    id: "kizuran",
    at: "2026-10-08",
    wave: 3,
    stats: { mana: { from: 0, to: 1 } },
  },
  {
    id: "dau-si-bo-tot",
    at: "2026-10-08",
    wave: 3,
    stats: { mana: { from: 0, to: 1 } },
  },
  {
    id: "sua-hut-ma-phap",
    at: "2026-10-08",
    wave: 3,
    stats: { mana: { from: 0, to: 1 } },
  },
  {
    id: "ky-si-bong-toi",
    at: "2026-10-08",
    wave: 3,
    stats: { mana: { from: 0, to: 1 } },
  },
  {
    id: "chien-binh-rong",
    at: "2026-10-08",
    wave: 3,
    stats: { mana: { from: 0, to: 2 } },
  },
  {
    id: "kizuran",
    at: "2026-10-09",
    wave: 4,
    stats: { mana: { from: 1, to: 2 } },
  },
  {
    id: "quai-thu-thien-su",
    at: "2026-10-09",
    wave: 5,
    tone: "shift",
    stats: { mana: { from: 1, to: 0 } },
    notes: ["Thêm kỹ năng Cầu nguyện"],
  },
  {
    id: "rong-con",
    at: "2026-10-09",
    wave: 6,
    tone: "down",
    notes: ["Sát thương phép của Hơi thở rồng giảm xuống 1 (2)", "Hơi thở rồng đánh được vào người chơi"],
  },
  {
    id: "rong-phun-hoa-cau",
    at: "2026-10-09",
    wave: 7,
    stats: { hp: { from: 4, to: 5 } },
  },
  {
    id: "quai-thu-thien-su",
    at: "2026-10-09",
    wave: 8,
    tone: "shift",
    stats: { mana: { from: 0, to: 2 }, hp: { from: 4, to: 6 } },
  },
  {
    id: "yeu-tinh-chuc-phuc",
    at: "2026-10-09",
    wave: 9,
    tone: "down",
    notes: [
      "Hỗ công tốn 1 mana. Đòn kế tiếp tăng 3 công, 1 thủ và 3 sát thương phép",
      "Hộ thủ tốn 1 mana",
    ],
  },
  {
    id: "yeu-tinh-chuc-phuc",
    at: "2026-10-09",
    wave: 10,
    tone: "down",
    stats: { def: { from: 2, to: 1 }, mdef: { from: 3, to: 1 } },
  },
  {
    id: "sau-non",
    at: "2026-10-09",
    wave: 11,
    tone: "down",
    notes: ["Hoá kén chỉ tạo được 1 chân kén"],
  },
  {
    id: "chien-binh-rong",
    at: "2026-10-09",
    wave: 12,
    tone: "down",
    stats: { hp: { from: 6, to: 4 } },
  },
  {
    id: "chien-binh-rong",
    at: "2026-10-10",
    wave: 13,
    tone: "shift",
    stats: { atk: { from: 5, to: 4 }, hp: { from: 4, to: 5 }, mdef: { from: 2, to: 1 } },
  },
  {
    id: "yeu-tinh-chuc-phuc",
    at: "2026-10-10",
    wave: 14,
    tone: "down",
    stats: { mana: { from: 2, to: 1 } },
  },
  {
    id: "kizuran",
    at: "2026-10-11",
    wave: 15,
    stats: { mana: { from: 2, to: 1 } },
  },
  {
    id: "my-dieu-nhan",
    at: "2026-10-11",
    wave: 15,
    tone: "up",
    notes: ["Mê hoặc tiêu hao 0 mana"],
  },
  {
    id: "hiep-si-ho-ve",
    at: "2026-10-11",
    wave: 16,
    tone: "up",
    notes: ["Kiếm phòng ngự không khoá lượt sau"],
  },
  {
    id: "hiep-si-cua-hau",
    at: "2026-10-12",
    wave: 17,
    tone: "up",
    notes: ["Thêm kỹ năng Kiếm phép"],
  },
  {
    id: "hiep-si-ho-ve",
    at: "2026-10-12",
    wave: 17,
    tone: "shift",
    stats: { stars: { from: 2, to: 3 }, atk: { from: 2, to: 1 }, hp: { from: 2, to: 1 } },
    notes: ["Thêm lời chúc của kỵ sĩ", "Thêm kỹ năng Học tập và trưởng thành"],
  },
  {
    id: "mat-xanh-huy-diet",
    at: "2026-10-12",
    wave: 18,
    tone: "shift",
    stats: { atk: { from: 8, to: 6 }, hp: { from: 5, to: 6 } },
    notes: ["Tia sáng huỷ diệt gây sát thương chuẩn"],
  },
  {
    id: "hiep-si-cua-vua",
    at: "2026-10-14",
    wave: 19,
    tone: "shift",
    stats: { hp: { from: 1, to: 3 } },
    notes: ["Bỏ 2 máu ảo của lời chúc kỵ sĩ cũ"],
  },
  {
    id: "hiep-si-cua-hau",
    at: "2026-10-14",
    wave: 19,
    tone: "shift",
    stats: { hp: { from: 2, to: 3 } },
    notes: ["Bỏ 2 máu ảo của lời chúc kỵ sĩ cũ"],
  },
  {
    id: "con-thinh-no-cua-hai-vuong",
    at: "2026-10-14",
    wave: 20,
    tone: "up",
    stats: { atk: { from: 0, to: 1 } },
  },
  {
    id: "khong-lo-mot-mat",
    at: "2026-10-14",
    wave: 20,
    tone: "down",
    stats: { def: { from: 4, to: 3 } },
  },
  {
    id: "quai-thu-thien-su",
    at: "2026-10-14",
    wave: 20,
    tone: "up",
    stats: { mana: { from: 2, to: 1 } },
    notes: ["Bảng chọn ghi Cầu nguyện"],
  },
  {
    id: "kizuran",
    at: "2026-10-14",
    wave: 20,
    tone: "up",
    stats: { atk: { from: 2, to: 3 } },
  },
  {
    id: "chien-binh-rong",
    at: "2026-10-14",
    wave: 20,
    tone: "down",
    stats: { hp: { from: 5, to: 4 }, def: { from: 2, to: 1 } },
  },
  {
    id: "hiep-si-ho-ve",
    at: "2026-10-14",
    wave: 20,
    tone: "up",
    stats: { atk: { from: 1, to: 2 }, hp: { from: 1, to: 2 } },
  },
  {
    id: "ma-dao-si",
    at: "2026-10-14",
    wave: 20,
    tone: "down",
    notes: ["Ma đạn bắn 1, rồi 2, loạt cuối 4"],
  },
  {
    id: "kiem-si-lua-thieng",
    at: "2026-10-14",
    wave: 21,
    tone: "shift",
    notes: ["Sau Truy cùng diệt tận có Hoả thần long, tốn thêm 3 máu và 1 mana, gây 4 sát thương phép và 3 sát thương chuẩn"],
  },
  {
    id: "phu-thuy-ti-hon",
    at: "2026-10-14",
    wave: 22,
    tone: "down",
    stats: { hp: { from: 4, to: 3 } },
  },
  {
    id: "ke-giam-ho-linh-hon",
    at: "2026-10-15",
    wave: 23,
    tone: "up",
    stats: { def: { from: 0, to: 1 } },
  },
];

const STATS: StatKey[] = ["hp", "atk", "def", "mdef", "stars", "mana"];
const LABEL: Record<StatKey, string> = {
  hp: "Máu",
  atk: "Công",
  def: "Thủ",
  mdef: "Thủ phép",
  stars: "Sao",
  mana: "Mana",
};

const TONE_WORD: Record<Tone, string> = {
  up: "Tăng",
  down: "Giảm",
  shift: "Thay đổi lối chơi",
};

export type LineBit = {
  text: string;
  mark?: "up" | "down";
};

export type InfoBlock = {
  at: string;
  when: string;
  tone: Tone;
  toneText: string;
  lines: LineBit[][];
};

export type FootRow = {
  id: string;
  name: string;
  stars: number;
  mana: number;
  tone: Tone;
  wave: number;
};

export function toneWord(tone: Tone): string {
  return TONE_WORD[tone];
}

export function whenLabel(chrono: number, count: number): string {
  return count > 1 && chrono === count ? "Lần cuối" : `Lần ${chrono}`;
}

export function isRecent(at: string, now = new Date()): boolean {
  const days = ageDays(at, now);
  return days !== null && days <= 14;
}

function ageDays(at: string, now: Date): number | null {
  if (at === "live") return 0;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(at);
  if (!match) return null;
  const then = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - then.getTime()) / 86400000);
}

/** Ngày lá được thêm. Cũ ở trên. Lá ghi `since` thì lấy ngày đó, không cần thêm dòng ở đây. */
const ADDED: { id: string; at: string }[] = [
  { id: "my-dieu-nhan", at: "2026-10-05" },
  { id: "nu-chua-dieu-nhan", at: "2026-10-05" },
  { id: "nu-chua-dieu-nhan-hoan-my", at: "2026-10-05" },
  { id: "ky-si-cuoi-rong", at: "2026-10-05" },
  { id: "rong-ac-ma", at: "2026-10-05" },
  { id: "khong-lo-mot-mat", at: "2026-10-05" },
  { id: "chien-binh-rong", at: "2026-10-05" },
  { id: "giap-co-khi", at: "2026-10-05" },
  { id: "quai-thu-thien-su", at: "2026-10-05" },
  { id: "thien-than-be-nho", at: "2026-10-05" },
  { id: "co-may-thoi-gian", at: "2026-10-05" },
  { id: "ke-dao-mo", at: "2026-10-05" },
  { id: "hiep-si-cua-vua", at: "2026-10-11" },
  { id: "hiep-si-ho-ve", at: "2026-10-11" },
  { id: "hiep-si-cua-hau", at: "2026-10-11" },
  { id: "hiep-si-huyen-bi", at: "2026-10-11" },
];

export type FaceMark = "new" | "up" | "down";

export function recordedAdded(id: string): string | null {
  return sinceOf(id) ?? ADDED.find((row) => row.id === id)?.at ?? null;
}

export function markFace(id: string, now = new Date()): FaceMark | null {
  const row = CARD_CLOCK[id];
  if (!row) return null;
  if (row.kind === "monster" && row.powerAt && row.powerTone) {
    const days = ageDays(row.powerAt, now);
    if (days !== null && days >= 0 && days < 5) return row.powerTone;
  }
  if (row.added && within(row.added, 9, now)) return "new";
  if (row.shiftAt && within(row.shiftAt, 6, now)) return "new";
  return null;
}

export function markNew(id: string, now = new Date()): boolean {
  return markFace(id, now) !== null;
}

function sinceOf(id: string): string | null {
  const card = [...MONSTERS, ...FORMS, ...SPELLS].find((item) => item.id === id) as { since?: string } | undefined;
  return card?.since || null;
}

function within(at: string, limit: number, now: Date): boolean {
  const days = ageDays(at, now);
  return days !== null && days >= 0 && days <= limit;
}

function powerSign(key: StatKey, from: number, to: number): number {
  if (to === from) return 0;
  const bigger = to > from;
  if (key === "stars" || key === "mana") return bigger ? -1 : 1;
  return bigger ? 1 : -1;
}

export function toneFromStats(stats: Partial<Record<StatKey, { from: number; to: number }>> | undefined): Tone | null {
  let up = false;
  let down = false;
  for (const key of STATS) {
    const step = stats?.[key];
    if (!step) continue;
    const sign = powerSign(key, step.from, step.to);
    if (sign > 0) up = true;
    if (sign < 0) down = true;
  }
  if (up && down) return "shift";
  if (up) return "up";
  if (down) return "down";
  return null;
}

export function statLine(key: StatKey, from: number, to: number): LineBit[] {
  const raised = to > from;
  const mark = powerSign(key, from, to) > 0 ? "up" : "down";
  return [
    { text: `${LABEL[key]} ` },
    { text: raised ? "tăng" : "giảm", mark },
    { text: ` ${raised ? "lên" : "xuống"} ${to} (${from})` },
  ];
}

function liveSnaps(): Map<string, Snap> {
  const map = new Map<string, Snap>();
  for (const card of [...MONSTERS, ...FORMS]) {
    map.set(card.id, { kind: "monster", name: card.name, stars: card.stars, mana: card.gems, atk: card.atk, def: card.def, mdef: card.mdef, hp: card.hp });
  }
  for (const card of SPELLS) {
    map.set(card.id, { kind: "spell", name: card.name, stars: 0, mana: card.gems, atk: 0, def: 0, mdef: 0, hp: 0 });
  }
  return map;
}

function numbers(snap: Snap): Record<StatKey, number> {
  return { hp: snap.hp, atk: snap.atk, def: snap.def, mdef: snap.mdef, stars: snap.stars, mana: snap.mana };
}

function entryLines(entry: BalanceEntry): LineBit[][] {
  const lines: LineBit[][] = [];
  for (const key of STATS) {
    const step = entry.stats?.[key];
    if (!step || step.from === step.to) continue;
    lines.push(statLine(key, step.from, step.to));
  }
  for (const note of entry.notes ?? []) lines.push([{ text: note }]);
  return lines;
}

export function infoBlocks(id: string): InfoBlock[] {
  const live = liveSnaps().get(id);
  const base = BALANCE_BASE[id];
  if (!live || !base) return [];
  const cursor = numbers(base);
  const logged = BALANCE_LOG.filter((entry) => entry.id === id);
  const blocks: InfoBlock[] = [];
  for (const entry of logged) {
    const tone = entry.tone ?? toneFromStats(entry.stats);
    const lines = entryLines(entry);
    if (tone && lines.length) {
      blocks.push({ at: entry.at, when: "", tone, toneText: toneWord(tone), lines });
    }
    for (const key of STATS) {
      const step = entry.stats?.[key];
      if (step) cursor[key] = step.to;
    }
  }
  const drift: Partial<Record<StatKey, { from: number; to: number }>> = {};
  const now = numbers(live);
  for (const key of STATS) {
    if (live.kind === "spell" && key !== "mana") continue;
    if (cursor[key] !== now[key]) drift[key] = { from: cursor[key], to: now[key] };
  }
  const driftTone = toneFromStats(drift);
  const driftEntry: BalanceEntry = { id, at: "live", stats: drift };
  const driftLines = entryLines(driftEntry);
  if (driftTone && driftLines.length) {
    blocks.push({ at: "live", when: "", tone: driftTone, toneText: toneWord(driftTone), lines: driftLines });
  }
  const count = blocks.length;
  return blocks
    .map((block, index) => ({ ...block, when: whenLabel(index + 1, count) }))
    .reverse();
}

export function footRows(kind: Snap["kind"], now = new Date()): FootRow[] {
  const rows: FootRow[] = [];
  for (const [id, snap] of liveSnaps()) {
    if (snap.kind !== kind) continue;
    const recent = infoBlocks(id).filter((block) => isRecent(block.at, now));
    const newest = recent[0];
    if (!newest) continue;
    let wave = newest.at === "live" ? Number.MAX_SAFE_INTEGER : 0;
    if (newest.at !== "live") {
      for (let index = BALANCE_LOG.length - 1; index >= 0; index -= 1) {
        const entry = BALANCE_LOG[index];
        if (entry.id === id && entry.at === newest.at) {
          wave = entry.wave;
          break;
        }
      }
    }
    rows.push({ id, name: snap.name, stars: snap.stars, mana: snap.mana, tone: newest.tone, wave });
  }
  rows.sort((a, b) => b.wave - a.wave || (kind === "monster" ? a.stars - b.stars : a.mana - b.mana) || a.name.localeCompare(b.name, "vi"));
  return rows.slice(0, kind === "monster" ? 12 : 7);
}
