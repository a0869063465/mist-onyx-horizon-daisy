import { FORMS, MONSTERS, SPELLS, type MonsterCard, type SpellCard } from "@/lib/catalog";
import { tr } from "@/lib/i18n";

const KEY = "clash-card-text";
const REV = 1;

export type ChipDef = { key: string; label: string; tone: "y" | "z" };
export type AskDef = { key: string; title: string; label: string };

export const MONSTER_CHIPS: Record<string, ChipDef[]> = {
  "ga-he-dang-so": [
    { key: "charge", label: "Tích luỹ", tone: "y" },
    { key: "cast", label: "Quả cầu bóng tối", tone: "z" },
  ],
  "cuc-bong-ma-quai": [
    { key: "boom", label: "Phát nổ", tone: "y" },
    { key: "barrage", label: "Pháo kích", tone: "y" },
  ],
  "te-giac-be-con": [{ key: "up", label: "Thăng cấp", tone: "y" }],
  "phu-thuy-ti-hon": [{ key: "hex", label: "Cầu Sấm", tone: "y" }],
  "rong-phun-hoa-cau": [
    { key: "peek", label: "Lộ diện", tone: "y" },
    { key: "fire", label: "Cầu lửa", tone: "y" },
  ],
  "phu-thuy-thoi-gian": [
    { key: "age", label: "Lão hoá", tone: "y" },
    { key: "all", label: "Dòng chảy thời gian", tone: "y" },
  ],
  "kiem-si-lua-thieng": [
    { key: "fire", label: "Vệt Lửa", tone: "y" },
  ],
  "ong-khong-lo": [{ key: "stun", label: "Kim châm tê liệt", tone: "y" }],
  "mo-voi-ma-mut": [{ key: "burst", label: "Nguyền rửa", tone: "y" }],
  "rong-boc-trung": [
    { key: "stanceGuard", label: "Thế thủ", tone: "y" },
    { key: "stanceAttack", label: "Thế công", tone: "y" },
  ],
  "chien-si-gam-nham": [{ key: "guard", label: "Khiên thú sĩ", tone: "z" }],
  "chien-binh-xuong": [{ key: "agile", label: "Linh hoạt", tone: "z" }],
  medusa: [{ key: "stone", label: "Hoá đá", tone: "y" }],
  "linh-chien-da-khong-lo": [{ key: "wall", label: "Tường thành", tone: "z" }],
  "the-than-cua-shien": [{ key: "stand", label: "Thế thân", tone: "z" }],
  "phu-thuy-rung-den": [{ key: "curse", label: "Nguyền rủa", tone: "y" }],
  "yeu-tinh-chuc-phuc": [
    { key: "aid", label: "Hỗ công", tone: "y" },
    { key: "bless", label: "Hộ thủ", tone: "z" },
  ],
  "trieu-hoi-ac-ma": [{ key: "hex", label: "Sấm địa ngục", tone: "y" }],
  "sau-non": [{ key: "cocoon", label: "Hoá kén", tone: "y" }],
  "ken-ngai": [
    { key: "leg", label: "Mọc chân", tone: "y" },
    { key: "hatch", label: "Nở", tone: "y" },
  ],
  "ngai-khong-lo": [{ key: "dust", label: "Thổi độc", tone: "y" }],
  "ngai-nu-hoang": [{ key: "dust", label: "Thổi độc 2", tone: "y" }],
  "ngai-hoan-my": [{ key: "dust", label: "Thổi độc 3", tone: "y" }],
  "sua-hut-ma-phap": [{ key: "spit", label: "Tích luỹ ma pháp", tone: "y" }],
  "con-thinh-no-cua-hai-vuong": [{ key: "rage", label: "Cơn thịnh nộ của hải thần", tone: "y" }],
  "chien-binh-lan-khuat": [{ key: "hide", label: "Ẩn mình", tone: "y" }],
  "rong-dia-nguc": [{ key: "dark", label: "Lửa bóng tối", tone: "y" }],
  "hu-nhot-linh-hon": [{ key: "call", label: "Gọi hồn", tone: "y" }],
  "thanh-thuat-su": [{ key: "saint", label: "Thánh thuật", tone: "y" }],
  "binh-bien-hinh": [{ key: "shape", label: "Biến hình", tone: "y" }],
  "ky-si-canh-cut": [{ key: "swap", label: "Đổi bài", tone: "y" }],
  "mat-na-bong-toi": [{ key: "curse", label: "Trùng chú", tone: "y" }],
  "sieu-dan-t-rex": [
    { key: "charge", label: "Kích điện", tone: "y" },
    { key: "dump", label: "Phóng điện", tone: "y" },
  ],
  leviathan: [{ key: "rage", label: "Thần biển nổi giận", tone: "y" }],
  "phu-thuy-do-choi": [{ key: "seal", label: "Phong ấn", tone: "y" }],
  "sat-nhan-bat-giu": [{ key: "seize", label: "Bắt Giữ", tone: "y" }],
  "trai-tim-hai-long": [{ key: "tide", label: "Triều lên", tone: "y" }],
  "kizuran": [{ key: "cover", label: "Vì Anh Em", tone: "z" }],
  "mat-do-tan-pha": [{ key: "ball", label: "Cầu lửa địa ngục", tone: "y" }],
  "ky-si-bong-toi": [{ key: "vow", label: "Hiến Tế", tone: "y" }],
  "hoa-an-thit-nguoi": [{ key: "bite", label: "Ăn thịt", tone: "y" }],
  "thuong-quan-long": [{ key: "spin", label: "Cò quay", tone: "y" }],
  "may-nem-bom-hinh-nhen": [{ key: "bomb", label: "Súng phóng lựu", tone: "y" }],
  "may-quay-thuong": [
    { key: "reel", label: "Quay thưởng", tone: "y" },
    { key: "rage", label: "Con bạc nổi giận", tone: "z" },
  ],
  "rong-con": [{ key: "breath", label: "Hơi thở rồng", tone: "y" }],
  "rong-ngan-tuoi": [{ key: "breath", label: "Hơi thở rồng", tone: "y" }],
  "ma-dao-si": [{ key: "dan", label: "Ma đạn", tone: "y" }],
  "loi-nguyen-cua-rong": [{ key: "fire", label: "Địa ngục lửa", tone: "y" }],
  "ky-si-cuoi-rong": [
    { key: "spear", label: "Mũi thương bị nguyền rủa", tone: "y" },
    { key: "hell", label: "Lửa địa ngục", tone: "y" },
  ],
  "rong-ac-ma": [{ key: "orb", label: "Hoả cầu địa ngục", tone: "y" }],
  "thien-than-be-nho": [
    { key: "phys", label: "Khiên vật lý", tone: "y" },
    { key: "spell", label: "Khiên phép", tone: "y" },
    { key: "cover", label: "Đỡ hộ", tone: "z" },
  ],
  "my-dieu-nhan": [
    { key: "gust", label: "Thổi bay", tone: "y" },
    { key: "charm", label: "Mê hoặc", tone: "y" },
    { key: "armor", label: "Giáp và Vuốt", tone: "z" },
    { key: "lash", label: "Roi điện", tone: "z" },
  ],
  "nu-chua-dieu-nhan": [
    { key: "gust", label: "Thổi bay", tone: "y" },
    { key: "charm", label: "Mê hoặc", tone: "y" },
    { key: "lure", label: "Dụ dỗ", tone: "y" },
    { key: "armor", label: "Giáp và Vuốt", tone: "z" },
    { key: "lash", label: "Roi điện", tone: "z" },
  ],
  "nu-chua-dieu-nhan-hoan-my": [
    { key: "gust", label: "Gió xoáy", tone: "y" },
    { key: "lure", label: "Dụ dỗ", tone: "y" },
    { key: "bolt", label: "Roi sấm", tone: "y" },
  ],
  "hiep-si-cua-hau": [{ key: "sword", label: "Kiếm phép", tone: "y" }],
};

export const MONSTER_ASKS: Record<string, AskDef[]> = {
  "ken-ngai": [{ key: "legs", title: "Hỏi mọc chân", label: "Tạo chân kén? Tốn 1 mana." }],
  "trieu-hoi-ac-ma": [{ key: "pact", title: "Hỏi khế ước", label: "Trả 1 mana để {tên} ở lại?" }],
  "quai-thu-thien-su": [{ key: "pray", title: "Hỏi cầu nguyện", label: "Tiêu 1 mana để {tên} cầu nguyện?" }],
  "kiem-si-lua-thieng": [
    { key: "echo", title: "Hỏi đòn thêm", label: "Truy cùng diệt tận." },
    { key: "last", title: "Hoả thần long", label: "Tiêu hao thêm 3 máu và 1 mana để gây 4 sát thương phép và 2 sát thương chuẩn" },
  ],
  "ky-si-bong-toi": [
    { key: "pick1", title: "Hỏi 1 mục", label: "Chọn 1 mục cho lần giáp lá cà này." },
    { key: "pick2", title: "Hỏi thêm mục", label: "Được chọn thêm 1 mục." },
  ],
  "phu-thuy-thoi-gian": [{ key: "boost", title: "Hỏi cường hoá", label: "Cường hoá mục tiêu này?" }],
  "yeu-tinh-chuc-phuc": [{ key: "buff", title: "Hỏi chúc phúc", label: "Chúc phúc quái nào?" }],
  "chien-si-gam-nham": [{ key: "block", title: "Hỏi cách chặn", label: "Chặn thường hay dùng kỹ năng?" }],
  "trai-tim-hai-long": [
    { key: "tide", title: "Hỏi triều lên", label: "Sóng lớn hơn" },
    { key: "surge", title: "Con nước lớn", label: "Con nước lớn tàn phá" },
    { key: "doom", title: "Đại thuỷ triều", label: "Đại thuỷ triều huỷ diệt" },
  ],
  "cuc-bong-ma-quai": [{ key: "soft", title: "Bông mềm", label: "Triệu hồi bản thân ra chặn. Tốn 1 mana, các bản sao lấp đầy sân." }],
};

type Store = {
  rev: number;
  monsters: Record<string, Partial<MonsterCard>>;
  spells: Record<string, Partial<SpellCard>>;
  chips: Record<string, Record<string, string>>;
  asks: Record<string, Record<string, string>>;
  attack: string;
  baseMonsters: Record<string, Partial<MonsterCard>>;
  baseSpells: Record<string, Partial<SpellCard>>;
  baseChips: Record<string, Record<string, string>>;
  baseAsks: Record<string, Record<string, string>>;
};

const empty = (): Store => ({
  rev: REV,
  monsters: {},
  spells: {},
  chips: {},
  asks: {},
  attack: "",
  baseMonsters: {},
  baseSpells: {},
  baseChips: {},
  baseAsks: {},
});

function read(): Store {
  if (typeof localStorage === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<Store>;
    const store = empty();
    store.attack = typeof parsed.attack === "string" ? parsed.attack : "";
    let dirty = false;
    if (parsed.rev !== REV) {
      store.monsters = stripKeys(parsed.monsters ?? {}, MONSTER_NUMS);
      store.spells = stripKeys(parsed.spells ?? {}, ["gems"]);
      store.chips = parsed.chips ?? {};
      store.asks = parsed.asks ?? {};
      dirty = true;
    } else {
      store.monsters = parsed.monsters ?? {};
      store.spells = parsed.spells ?? {};
      store.chips = parsed.chips ?? {};
      store.asks = parsed.asks ?? {};
      store.baseMonsters = parsed.baseMonsters ?? {};
      store.baseSpells = parsed.baseSpells ?? {};
      store.baseChips = parsed.baseChips ?? {};
      store.baseAsks = parsed.baseAsks ?? {};
      dirty = shed(store);
    }
    if (dropKnown(store)) dirty = true;
    if (dirty) write(store);
    return store;
  } catch {
    return empty();
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

const STALE_SKILLS: Array<[string, string]> = [
  ["khong-lo-mot-mat", "Sau mỗi lần giáp lá cà"],
  ["ngai-khong-lo", "Tiêu hao 1 mana gây 4 sát thương phép lên tất cả quái thú kẻ địch. Quái sống sót dính độc 1 sát thương chuẩn đầu mỗi lượt, kéo 3 lượt, không cộng dồn."],
  ["trai-tim-hai-long", "lên toàn bộ kẻ địch"],
  ["kazura", "Điểm số phía trên tôi là số máu ảo"],
  ["ke-giam-ho-linh-hon", "Chỉ số đã tăng thì không mất"],
  ["hiep-si-cua-vua", "Đòn đánh thứ 1 gây 2"],
  ["hiep-si-ho-ve", "75% sát thương khiên nuốt"],
  ["hiep-si-cua-hau", "đòn 2 ta buộc phải đánh bằng Hiệp sĩ của hậu"],
  ["hiep-si-cua-hau", "Kiếm đàm phán"],
  ["hiep-si-cua-vua", "bộ bài.\nKhi lá chắn do Khiên Ân Huệ"],
  ["hiep-si-ho-ve", "bộ bài.\nKhi lá chắn do Khiên Ân Huệ"],
  ["hiep-si-cua-hau", "bộ bài.\nKhi lá chắn do Khiên Ân Huệ"],
  ["hiep-si-cua-vua", "bộ bài.\n\nKhi lá chắn"],
  ["hiep-si-ho-ve", "bộ bài.\n\nKhi lá chắn"],
  ["hiep-si-cua-hau", "bộ bài.\n\nKhi lá chắn"],
  ["mat-xanh-huy-diet", "sát thương phép bằng đúng công"],
  ["chien-binh-lan-khuat", "đang đứng, trong lúc ẩn mình"],
  ["khung-long-vay-kiem", "giảm 1 thủ và 1 thủ phép"],
  ["kiem-si-lua-thieng", "4 sát thương phép và 3 sát thương chuẩn"],
  ["hiep-si-huyen-bi", "Ghi 100% sát thương khiên nuốt"],
  ["chien-si-gam-nham", "thêm 3 máu tối đa"],
  ["ga-he-dang-so", "gây 5 sát thương, cứ thêm"],
  ["rong-ac-ma", "Gây 6 sát thương chuẩn lên 1 mục tiêu"],
  ["khung-long-vay-kiem", "giảm 2 thủ phép"],
  ["my-dieu-nhan", "không được rút bài"],
  ["nu-chua-dieu-nhan", "không được rút bài"],
  ["nu-chua-dieu-nhan", "không khoá rút bài"],
  ["cuc-bong-ma-quai", "Dùng để tấn công"],
  ["ong-khong-lo", "__**Tê liệt**__"],
  ["sua-hut-ma-phap", "Ma pháp tích tụ"],
  ["kiem-si-lua-thieng", "Long Hoả"],
];

const FRESH_SKILL: Array<[string, string]> = [
  ["hiep-si-cua-hau", "Kiếm phép"],
  ["hiep-si-ho-ve", "Học tập và trưởng thành"],
  ["hiep-si-ho-ve", "loại sát thương ta gây ra phụ thuộc"],
  ["ma-dao-si", "loạt cuối là 4"],
  ["kiem-si-lua-thieng", "Hoả thần long"],
  ["hiep-si-cua-vua", "bộ bài.\n    Khi lá chắn"],
  ["hiep-si-ho-ve", "bộ bài.\n    Khi lá chắn"],
  ["hiep-si-cua-hau", "bộ bài.\n    Khi lá chắn"],
  ["ky-si-bong-toi", "con đường hỗn mang"],
  ["ken-ngai", "mọc chân tăng sức phòng ngự"],
];

const STALE_CHIPS: Array<[string, string, string]> = [
  ["yeu-tinh-chuc-phuc", "aid", "Hỗ trợ +2"],
  ["yeu-tinh-chuc-phuc", "aid", "Hỗ công+2"],
  ["yeu-tinh-chuc-phuc", "bless", "Chúc phúc"],
  ["sua-hut-ma-phap", "spit", "Phóng"],
  ["kizuran", "cover", "Đỡ Kazura"],
];

const STALE_ASKS: Array<[string, string, string]> = [
  ["yeu-tinh-chuc-phuc", "buff", "Chúc phúc quái này?"],
  ["trai-tim-hai-long", "tide", "Triều lên. Chọn một cách."],
  ["kiem-si-lua-thieng", "echo", "Chọn mục tiêu."],
  ["kiem-si-lua-thieng", "last", "Tiêu hao 3 máu và 1 mana để gây 6 sát thương phép."],
  ["kiem-si-lua-thieng", "last", "Tiêu hao thêm 3 máu và 1 mana để gây 4 sát thương phép và 3 sát thương chuẩn"],
];

function dropKey(bag: Record<string, Record<string, string>>, base: Record<string, Record<string, string>>, id: string, key: string, old: string) {
  if (bag[id]?.[key] !== old) return false;
  delete bag[id][key];
  delete base[id]?.[key];
  if (Object.keys(bag[id]).length === 0) delete bag[id];
  if (base[id] && Object.keys(base[id]).length === 0) delete base[id];
  return true;
}

function dropKnown(store: Store) {
  let changed = false;
  for (const [id, old] of STALE_SKILLS) {
    const card = store.monsters[id];
    if (!card?.skill?.includes(old)) continue;
    delete card.skill;
    delete store.baseMonsters[id]?.skill;
    if (Object.keys(card).length === 0) {
      delete store.monsters[id];
      delete store.baseMonsters[id];
    }
    changed = true;
  }
  for (const [id, mark] of FRESH_SKILL) {
    const card = store.monsters[id];
    if (!card?.skill || card.skill.includes(mark)) continue;
    delete card.skill;
    delete store.baseMonsters[id]?.skill;
    if (Object.keys(card).length === 0) {
      delete store.monsters[id];
      delete store.baseMonsters[id];
    }
    changed = true;
  }
  const fairy = store.monsters["thien-than-be-nho"];
  if (fairy?.name === "Thiên thần bé nhỏ") {
    delete fairy.name;
    delete store.baseMonsters["thien-than-be-nho"]?.name;
    if (Object.keys(fairy).length === 0) {
      delete store.monsters["thien-than-be-nho"];
      delete store.baseMonsters["thien-than-be-nho"];
    }
    changed = true;
  }
  for (const [id, old] of [["thao-nguyen", "Nếu một đồng minh tham gia"], ["nui", "tăng thêm 2 sát thương kỹ năng"]] as const) {
    const card = store.spells[id];
    if (!card?.effect?.includes(old)) continue;
    delete card.effect;
    delete store.baseSpells[id]?.effect;
    if (Object.keys(card).length === 0) {
      delete store.spells[id];
      delete store.baseSpells[id];
    }
    changed = true;
  }
  const rain = store.spells["mua-ma-thuat"];
  if (rain?.effect?.includes("Hồi phục 4 máu")) {
    rain.effect = rain.effect.replace("Hồi phục 4 máu", "Hồi phục 2 máu");
    changed = true;
  }
  for (const [id, key, old] of STALE_CHIPS) changed = dropKey(store.chips, store.baseChips, id, key, old) || changed;
  for (const [id, key, old] of STALE_ASKS) changed = dropKey(store.asks, store.baseAsks, id, key, old) || changed;
  return changed;
}

function catalogMonster(id: string): MonsterCard | undefined {
  return MONSTERS.find((card) => card.id === id) ?? FORMS.find((card) => card.id === id);
}

function catalogSpell(id: string): SpellCard | undefined {
  return SPELLS.find((card) => card.id === id);
}

const MONSTER_NUMS = ["stars", "gems", "atk", "def", "mdef", "hp"] as const;

function sameField(key: string, live: unknown, base: unknown) {
  if (key === "picture") return (live || "") === (base || "");
  return live === base;
}

function stripKeys<T extends object>(bag: Record<string, Partial<T>>, keys: readonly string[]): Record<string, Partial<T>> {
  const next: Record<string, Partial<T>> = {};
  for (const [id, patch] of Object.entries(bag)) {
    const copy = { ...patch };
    for (const key of keys) delete copy[key as keyof T];
    if (Object.keys(copy).length) next[id] = copy;
  }
  return next;
}

function shedNums<T extends object>(patch: Partial<T>, base: Partial<T> | undefined, live: T, keys: readonly (keyof T)[]) {
  let changed = false;
  for (const key of keys) {
    if (patch[key] === undefined) continue;
    if (base?.[key] === undefined || !sameField(String(key), live[key], base[key])) {
      delete patch[key];
      if (base) delete base[key];
      changed = true;
    }
  }
  return changed;
}

function shed(store: Store) {
  let changed = false;
  for (const id of Object.keys(store.monsters)) {
    const live = catalogMonster(id);
    const patch = store.monsters[id];
    if (!live || !patch) {
      delete store.monsters[id];
      delete store.baseMonsters[id];
      changed = true;
      continue;
    }
    if (shedNums(patch, store.baseMonsters[id], live, MONSTER_NUMS)) changed = true;
    if (Object.keys(patch).length === 0) {
      delete store.monsters[id];
      delete store.baseMonsters[id];
      changed = true;
    }
  }
  for (const id of Object.keys(store.spells)) {
    const live = catalogSpell(id);
    const patch = store.spells[id];
    if (!live || !patch) {
      delete store.spells[id];
      delete store.baseSpells[id];
      changed = true;
      continue;
    }
    if (shedNums(patch, store.baseSpells[id], live, ["gems"])) changed = true;
    if (Object.keys(patch).length === 0) {
      delete store.spells[id];
      delete store.baseSpells[id];
      changed = true;
    }
  }
  return changed;
}

export function applyMonster(card: MonsterCard): MonsterCard {
  const patch = read().monsters[card.id];
  if (!patch) return card;
  return { ...card, ...cleanMonster(patch) };
}

export function applySpell(card: SpellCard): SpellCard {
  const patch = read().spells[card.id];
  if (!patch) return card;
  return { ...card, ...cleanSpell(patch) };
}

export function chipLabel(cardId: string, key: string): string {
  const edited = read().chips[cardId]?.[key];
  if (edited && edited.trim()) return edited.trim();
  return MONSTER_CHIPS[cardId]?.find((chip) => chip.key === key)?.label ?? key;
}

export function attackLabel(): string {
  const text = read().attack.trim();
  return text || "Tấn công";
}

export function monsterDraft(card: MonsterCard): MonsterCard {
  return applyMonster(card);
}

export function spellDraft(card: SpellCard): SpellCard {
  return applySpell(card);
}

export function askLabel(cardId: string, key: string, name = ""): string {
  const edited = read().asks[cardId]?.[key];
  const base = MONSTER_ASKS[cardId]?.find((ask) => ask.key === key)?.label ?? "";
  const text = edited && edited.trim() ? edited.trim() : base;
  return tr(text).replaceAll("{tên}", name);
}

export function askDraft(cardId: string): Record<string, string> {
  const asks = MONSTER_ASKS[cardId] ?? [];
  const saved = read().asks[cardId] ?? {};
  return Object.fromEntries(asks.map((ask) => [ask.key, saved[ask.key]?.trim() || ask.label]));
}

export function chipDraft(cardId: string): Record<string, string> {
  const chips = MONSTER_CHIPS[cardId] ?? [];
  const saved = read().chips[cardId] ?? {};
  return Object.fromEntries(chips.map((chip) => [chip.key, saved[chip.key]?.trim() || chip.label]));
}

export function saveMonster(card: MonsterCard, chips: Record<string, string>, asks: Record<string, string> = {}) {
  const store = read();
  const live = catalogMonster(card.id);
  if (!live) return;
  const diff = monsterDiff(card, live);
  if (Object.keys(diff).length === 0) {
    delete store.monsters[card.id];
    delete store.baseMonsters[card.id];
  } else {
    store.monsters[card.id] = diff;
    store.baseMonsters[card.id] = monsterBase(live, diff);
  }
  putLabels(store.chips, store.baseChips, card.id, chips, MONSTER_CHIPS[card.id] ?? []);
  putLabels(store.asks, store.baseAsks, card.id, asks, MONSTER_ASKS[card.id] ?? []);
  write(store);
}

export function saveSpell(card: SpellCard) {
  const store = read();
  const live = catalogSpell(card.id);
  if (!live) return;
  const diff = spellDiff(card, live);
  if (Object.keys(diff).length === 0) {
    delete store.spells[card.id];
    delete store.baseSpells[card.id];
  } else {
    store.spells[card.id] = diff;
    store.baseSpells[card.id] = spellBase(live, diff);
  }
  write(store);
}

export function saveAttack(label: string) {
  const store = read();
  store.attack = label.trim();
  write(store);
}

export function resetMonster(id: string) {
  const store = read();
  delete store.monsters[id];
  delete store.baseMonsters[id];
  delete store.chips[id];
  delete store.baseChips[id];
  delete store.asks[id];
  delete store.baseAsks[id];
  write(store);
}

export function resetSpell(id: string) {
  const store = read();
  delete store.spells[id];
  delete store.baseSpells[id];
  write(store);
}

function monsterDiff(card: MonsterCard, live: MonsterCard): Partial<MonsterCard> {
  const next: Partial<MonsterCard> = {};
  if (card.name !== live.name) next.name = card.name;
  if (card.skill !== live.skill) next.skill = card.skill;
  if ((card.strong ?? "") !== (live.strong ?? "")) next.strong = card.strong ?? "";
  if ((card.weak ?? "") !== (live.weak ?? "")) next.weak = card.weak ?? "";
  if ((card.counter ?? "") !== (live.counter ?? "")) next.counter = card.counter ?? "";
  for (const key of MONSTER_NUMS) if (card[key] !== live[key]) next[key] = card[key];
  const picture = card.picture || "";
  if (picture && picture !== (live.picture || "")) next.picture = picture;
  return next;
}

function monsterBase(live: MonsterCard, diff: Partial<MonsterCard>): Partial<MonsterCard> {
  const snap: Partial<MonsterCard> = {};
  if (diff.name !== undefined) snap.name = live.name;
  if (diff.skill !== undefined) snap.skill = live.skill;
  if (diff.strong !== undefined) snap.strong = live.strong ?? "";
  if (diff.weak !== undefined) snap.weak = live.weak ?? "";
  if (diff.counter !== undefined) snap.counter = live.counter ?? "";
  for (const key of MONSTER_NUMS) if (diff[key] !== undefined) snap[key] = live[key];
  if (diff.picture !== undefined) snap.picture = live.picture || "";
  return snap;
}

function spellDiff(card: SpellCard, live: SpellCard): Partial<SpellCard> {
  const next: Partial<SpellCard> = {};
  if (card.name !== live.name) next.name = card.name;
  if (card.effect !== live.effect) next.effect = card.effect;
  if (card.gems !== live.gems) next.gems = card.gems;
  const picture = card.picture || "";
  if (picture && picture !== (live.picture || "")) next.picture = picture;
  return next;
}

function spellBase(live: SpellCard, diff: Partial<SpellCard>): Partial<SpellCard> {
  const snap: Partial<SpellCard> = {};
  if (diff.name !== undefined) snap.name = live.name;
  if (diff.effect !== undefined) snap.effect = live.effect;
  if (diff.gems !== undefined) snap.gems = live.gems;
  if (diff.picture !== undefined) snap.picture = live.picture || "";
  return snap;
}

function putLabels(
  bag: Record<string, Record<string, string>>,
  bases: Record<string, Record<string, string>>,
  id: string,
  values: Record<string, string>,
  defs: Array<{ key: string; label: string }>,
) {
  const diff: Record<string, string> = {};
  const base: Record<string, string> = {};
  for (const item of defs) {
    const value = values[item.key]?.trim() ?? "";
    if (value && value !== item.label) {
      diff[item.key] = value;
      base[item.key] = item.label;
    }
  }
  if (Object.keys(diff).length === 0) {
    delete bag[id];
    delete bases[id];
    return;
  }
  bag[id] = diff;
  bases[id] = base;
}

function num(value: unknown, fallback: number) {
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? Math.max(0, Math.round(next)) : fallback;
}

function cleanMonster(patch: Partial<MonsterCard>): Partial<MonsterCard> {
  const next: Partial<MonsterCard> = {};
  if (typeof patch.name === "string") next.name = patch.name;
  if (typeof patch.skill === "string") next.skill = patch.skill;
  if (typeof patch.strong === "string") next.strong = patch.strong;
  if (typeof patch.weak === "string") next.weak = patch.weak;
  if (typeof patch.counter === "string") next.counter = patch.counter;
  if (patch.stars !== undefined) next.stars = num(patch.stars, 0);
  if (patch.gems !== undefined) next.gems = num(patch.gems, 0);
  if (patch.atk !== undefined) next.atk = num(patch.atk, 0);
  if (patch.def !== undefined) next.def = num(patch.def, 0);
  if (patch.mdef !== undefined) next.mdef = num(patch.mdef, 0);
  if (patch.hp !== undefined) next.hp = num(patch.hp, 1);
  if (typeof patch.picture === "string" && patch.picture) next.picture = patch.picture;
  return next;
}

function cleanSpell(patch: Partial<SpellCard>): Partial<SpellCard> {
  const next: Partial<SpellCard> = {};
  if (typeof patch.name === "string") next.name = patch.name;
  if (typeof patch.effect === "string") next.effect = patch.effect;
  if (patch.gems !== undefined) next.gems = num(patch.gems, 0);
  if (typeof patch.picture === "string" && patch.picture) next.picture = patch.picture;
  return next;
}
