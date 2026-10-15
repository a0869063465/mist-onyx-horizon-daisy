export type Keyword =
  | "quick"
  | "overwhelm"
  | "barrier"
  | "elusive"
  | "tough"
  | "lifesteal"
  | "challenger"
  | "impact"
  | "attune"
  | "ephemeral"
  | "fearsome";

export type Speed = "burst" | "fast" | "slow";
export type Aim = "none" | "enemy-unit" | "ally-unit" | "two-units";

export type Effect =
  | { k: "dmg"; who: "enemy-unit" | "all-enemies" | "enemy-nexus"; n: number }
  | { k: "heal"; who: "all-allies" | "my-nexus" | "ally-unit"; n: number }
  | { k: "buff"; who: "ally-unit" | "all-allies" | "self"; atk: number; hp: number; mode: "perm" | "round" }
  | { k: "barrier"; who: "ally-unit" | "all-allies" | "self" }
  | { k: "stun"; who: "enemy-unit" | "all-enemies" }
  | { k: "frost"; who: "all-enemies" | "enemy-unit" }
  | { k: "noblock"; who: "enemy-unit" }
  | { k: "vuln"; who: "enemy-unit" }
  | { k: "spellmana"; n: number }
  | { k: "token" }
  | { k: "cleanse" }
  | { k: "grant"; who: "ally-unit"; kw: Keyword; mode: "round" | "perm" }
  | { k: "cut-atk"; who: "enemy-unit"; n: number }
  | { k: "atk-round"; who: "all-enemies"; n: number }
  | { k: "swap" }
  | { k: "recall" }
  | { k: "draw"; n: number }
  | { k: "counter" };

export type CardDef = {
  id: string;
  name: string;
  cost: number;
  type: "unit" | "spell";
  attack: number;
  health: number;
  keywords: Keyword[];
  text: string;
  aim: Aim;
  effects: Effect[];
  speed?: Speed;
  art: string;
};

export const KEYWORDS: Record<Keyword, { name: string; blurb: string }> = {
  quick: { name: "Đòn nhanh", blurb: "Đánh trước. Hạ được quân chặn thì không bị đánh trả." },
  overwhelm: { name: "Tràn", blurb: "Sát thương dư sau khi hạ quân chặn dội vào thành." },
  barrier: { name: "Khiên", blurb: "Chặn trọn lần sát thương kế tiếp." },
  elusive: { name: "Ẩn", blurb: "Chỉ quân Ẩn mới chặn được." },
  tough: { name: "Cứng", blurb: "Chịu ít hơn 1 sát thương mỗi lần." },
  lifesteal: { name: "Hút máu", blurb: "Sát thương gây ra hồi máu thành của bạn." },
  challenger: { name: "Khiêu chiến", blurb: "Chỉ định một quân địch phải chặn nếu nó chặn được." },
  impact: { name: "Va đập", blurb: "Khi xông lên, gây 1 sát thương lên thành địch." },
  attune: { name: "Cộng hưởng", blurb: "Khi vào sân, nhận 1 mana phép." },
  ephemeral: { name: "Phù du", blurb: "Biến mất ở cuối vòng." },
  fearsome: { name: "Uy hiếp", blurb: "Chỉ quân từ 3 công trở lên mới chặn được." },
};

export const SPEED_NAME: Record<Speed, string> = {
  burst: "Tức thì",
  fast: "Nhanh",
  slow: "Chậm",
};

const U: CardDef[] = [
  { id: "thien-su", name: "Thiên sứ thú", cost: 1, type: "unit", attack: 1, health: 2, keywords: ["attune"], aim: "none", effects: [], art: "thien-su", text: "Cộng hưởng. Đầu mỗi vòng: +1 mana phép." },
  { id: "tho-den", name: "Thỏ đen", cost: 1, type: "unit", attack: 3, health: 1, keywords: ["elusive"], aim: "none", effects: [], art: "tho-den", text: "Ẩn." },
  { id: "ga-he", name: "Gã hề", cost: 2, type: "unit", attack: 2, health: 3, keywords: ["impact"], aim: "none", effects: [], art: "ga-he", text: "Va đập." },
  { id: "bong", name: "Cục bông", cost: 2, type: "unit", attack: 1, health: 1, keywords: [], aim: "none", effects: [{ k: "token" }], art: "bong", text: "Triệu hồi: tạo Bông sao 1/1 Phù du nếu còn ô trống." },
  { id: "te-giac", name: "Tê giác bé", cost: 2, type: "unit", attack: 2, health: 4, keywords: [], aim: "none", effects: [], art: "te-giac", text: "Mỗi lần sống sót sau sát thương thì lớn lên. Cấp 3: Hút máu." },
  { id: "ti-hon", name: "Phù thủy tí hon", cost: 2, type: "unit", attack: 1, health: 3, keywords: [], aim: "enemy-unit", effects: [{ k: "dmg", who: "enemy-unit", n: 2 }], art: "ti-hon", text: "Triệu hồi: gây 2 sát thương lên một quân địch." },
  { id: "thoi-gian", name: "Phù thủy thời gian", cost: 3, type: "unit", attack: 2, health: 3, keywords: [], aim: "none", effects: [{ k: "buff", who: "all-allies", atk: 1, hp: 1, mode: "round" }, { k: "atk-round", who: "all-enemies", n: 1 }], art: "thoi-gian", text: "Triệu hồi: đồng minh +1/+1 đến hết vòng. Mọi địch −1 công đến hết vòng." },
  { id: "ong", name: "Ong khổng lồ", cost: 3, type: "unit", attack: 4, health: 2, keywords: [], aim: "enemy-unit", effects: [{ k: "stun", who: "enemy-unit" }], art: "ong", text: "Triệu hồi: làm Choáng một quân địch." },
  { id: "gam", name: "Chiến sĩ gặm", cost: 3, type: "unit", attack: 3, health: 5, keywords: ["tough"], aim: "none", effects: [], art: "gam", text: "Cứng." },
  { id: "voi", name: "Mộ voi", cost: 3, type: "unit", attack: 3, health: 3, keywords: [], aim: "none", effects: [], art: "voi", text: "Hơi thở cuối: gây 3 sát thương lên kẻ kết liễu, hoặc lên thành." },
  { id: "yeu-tinh", name: "Yêu tinh", cost: 3, type: "unit", attack: 1, health: 4, keywords: [], aim: "ally-unit", effects: [{ k: "barrier", who: "ally-unit" }, { k: "buff", who: "ally-unit", atk: 2, hp: 0, mode: "round" }], art: "yeu-tinh", text: "Triệu hồi: một đồng minh nhận Khiên và +2 công đến hết vòng." },
  { id: "rong-hoa", name: "Rồng hoả cầu", cost: 4, type: "unit", attack: 4, health: 3, keywords: [], aim: "none", effects: [{ k: "dmg", who: "all-enemies", n: 1 }, { k: "dmg", who: "enemy-nexus", n: 1 }], art: "rong-hoa", text: "Triệu hồi: gây 1 sát thương lên mọi quân địch và thành địch." },
  { id: "khung-long", name: "Khủng long vảy kiếm", cost: 4, type: "unit", attack: 4, health: 4, keywords: [], aim: "none", effects: [], art: "khung-long", text: "Đòn đánh trúng quân: mục tiêu −1 công vĩnh viễn." },
  { id: "bo-tot", name: "Đấu sĩ bò", cost: 4, type: "unit", attack: 4, health: 5, keywords: [], aim: "none", effects: [], art: "bo-tot", text: "Khi một đồng minh khác chết: nhận +1/+1." },
  { id: "kiem-si", name: "Kiếm sĩ lửa", cost: 4, type: "unit", attack: 3, health: 4, keywords: ["quick"], aim: "enemy-unit", effects: [{ k: "dmg", who: "enemy-unit", n: 2 }], art: "kiem-si", text: "Đòn nhanh. Triệu hồi: gây 2 sát thương lên một quân địch." },
  { id: "linh-da", name: "Lính đá", cost: 5, type: "unit", attack: 2, health: 8, keywords: ["tough"], aim: "none", effects: [], art: "linh-da", text: "Cứng. Lần đầu sắp chết: còn 1 máu." },
  { id: "rong-trung", name: "Rồng trứng", cost: 5, type: "unit", attack: 4, health: 6, keywords: [], aim: "none", effects: [], art: "rong-trung", text: "Đổi thế trong lượt bạn. Thế công: +3 công. Thế thủ: Cứng và hồi 2 máu cuối vòng." },
  { id: "ky-si", name: "Kỳ sĩ bóng tối", cost: 5, type: "unit", attack: 5, health: 5, keywords: ["quick", "fearsome"], aim: "none", effects: [], art: "ky-si", text: "Đòn nhanh. Uy hiếp." },
  { id: "ac-ma", name: "Ác ma triệu hồi", cost: 6, type: "unit", attack: 6, health: 5, keywords: ["overwhelm"], aim: "enemy-unit", effects: [{ k: "dmg", who: "enemy-unit", n: 3 }], art: "ac-ma", text: "Tràn. Triệu hồi: gây 3 sát thương lên một quân địch." },
];

const S: CardDef[] = [
  { id: "sung", name: "Sừng lôi phá", cost: 1, type: "spell", attack: 0, health: 0, keywords: [], speed: "burst", aim: "ally-unit", art: "sung", effects: [{ k: "buff", who: "ally-unit", atk: 2, hp: 1, mode: "perm" }], text: "Tức thì: một đồng minh +2/+1 vĩnh viễn." },
  { id: "cam-chan", name: "Cấm chặn", cost: 1, type: "spell", attack: 0, health: 0, keywords: [], speed: "burst", aim: "enemy-unit", art: "cam-chan", effects: [{ k: "noblock", who: "enemy-unit" }], text: "Tức thì: một quân địch không thể chặn trong vòng này." },
  { id: "hap-thu", name: "Hấp thụ", cost: 1, type: "spell", attack: 0, health: 0, keywords: [], speed: "burst", aim: "none", art: "hap-thu", effects: [{ k: "cleanse" }, { k: "spellmana", n: 1 }], text: "Tức thì: gỡ choáng, khoá công và cấm chặn trên quân bạn. +1 mana phép." },
  { id: "nguyen", name: "Nguyền", cost: 2, type: "spell", attack: 0, health: 0, keywords: [], speed: "slow", aim: "enemy-unit", art: "nguyen", effects: [{ k: "cut-atk", who: "enemy-unit", n: 2 }, { k: "frost", who: "enemy-unit" }], text: "Chậm: một quân địch −2 công vĩnh viễn và còn 0 công đến hết vòng." },
  { id: "phan-don", name: "Phản đòn", cost: 2, type: "spell", attack: 0, health: 0, keywords: [], speed: "burst", aim: "enemy-unit", art: "phan-don", effects: [{ k: "counter" }], text: "Tức thì: huỷ phép đang treo và gây 2 lên thành địch. Không có phép thì gây 2 lên một quân." },
  { id: "xich", name: "Xích địa ngục", cost: 3, type: "spell", attack: 0, health: 0, keywords: [], speed: "slow", aim: "enemy-unit", art: "xich", effects: [{ k: "stun", who: "enemy-unit" }, { k: "vuln", who: "enemy-unit" }], text: "Chậm: Choáng một quân địch. Quân đó chịu thêm 1 sát thương đến hết vòng." },
  { id: "phuc-kich", name: "Phục kích", cost: 3, type: "spell", attack: 0, health: 0, keywords: [], speed: "fast", aim: "ally-unit", art: "phuc-kich", effects: [{ k: "buff", who: "ally-unit", atk: 3, hp: 0, mode: "round" }, { k: "grant", who: "ally-unit", kw: "quick", mode: "round" }], text: "Nhanh: một đồng minh +3 công và Đòn nhanh đến hết vòng." },
  { id: "guong", name: "Gương phòng hộ", cost: 3, type: "spell", attack: 0, health: 0, keywords: [], speed: "burst", aim: "none", art: "guong", effects: [{ k: "barrier", who: "all-allies" }], text: "Tức thì: mọi đồng minh nhận Khiên." },
  { id: "hoan-vi", name: "Hoán vị", cost: 2, type: "spell", attack: 0, health: 0, keywords: [], speed: "fast", aim: "two-units", art: "hoan-vi", effects: [{ k: "swap" }], text: "Nhanh: hoán vị hai quân trên sân, kể cả đổi phe." },
  { id: "mua", name: "Mưa phép", cost: 4, type: "spell", attack: 0, health: 0, keywords: [], speed: "burst", aim: "none", art: "mua", effects: [{ k: "heal", who: "all-allies", n: 3 }, { k: "heal", who: "my-nexus", n: 3 }, { k: "cleanse" }], text: "Tức thì: hồi 3 máu mọi đồng minh và thành bạn. Gỡ hiệu ứng xấu." },
  { id: "xoay", name: "Xoáy sương", cost: 5, type: "spell", attack: 0, health: 0, keywords: [], speed: "fast", aim: "none", art: "xoay", effects: [{ k: "frost", who: "all-enemies" }], text: "Nhanh: mọi quân địch còn 0 công đến hết vòng." },
  { id: "guom", name: "Gươm ánh sáng", cost: 6, type: "spell", attack: 0, health: 0, keywords: [], speed: "slow", aim: "none", art: "guom", effects: [{ k: "stun", who: "all-enemies" }], text: "Chậm: Choáng mọi quân địch." },
  { id: "thu-hoi", name: "Thu hồi", cost: 4, type: "spell", attack: 0, health: 0, keywords: [], speed: "slow", aim: "none", art: "thu-hoi", effects: [{ k: "recall" }, { k: "draw", n: 1 }], text: "Chậm: thu mọi quân của bạn về tay, rồi rút 1 lá." },
  { id: "sam", name: "Sấm sét", cost: 8, type: "spell", attack: 0, health: 0, keywords: [], speed: "slow", aim: "none", art: "sam", effects: [{ k: "dmg", who: "all-enemies", n: 3 }, { k: "dmg", who: "enemy-nexus", n: 3 }], text: "Chậm: gây 3 sát thương lên mọi quân địch và thành địch." },
];

export const TOKEN: CardDef = {
  id: "token-bong",
  name: "Bông sao",
  cost: 1,
  type: "unit",
  attack: 1,
  health: 1,
  keywords: ["ephemeral"],
  text: "Phù du.",
  aim: "none",
  effects: [],
  art: "bong",
};

export const COLLECTION: CardDef[] = [...U, ...S];

const MAP = new Map<string, CardDef>([...COLLECTION, TOKEN].map((card) => [card.id, card]));

export function cardById(id: string): CardDef {
  const card = MAP.get(id);
  if (!card) throw new Error(id);
  return card;
}

export function tryCard(id: string): CardDef | undefined {
  return MAP.get(id);
}

export function artSrc(card: CardDef, level = 1): string {
  if (card.id === "te-giac" && level >= 3) return "/art/te-giac-3.jpg";
  return `/art/${card.art}.jpg`;
}

export function displayName(card: CardDef, level = 1): string {
  if (card.id !== "te-giac") return card.name;
  if (level >= 3) return "Chiến binh tê giác";
  if (level === 2) return "Tê giác hiếu thắng";
  return card.name;
}
