/**
 * Skills shown as icons on the monster sheet, coloured by kind (the owner's scheme):
 * - active (blue): pressed on the board;
 * - risk (red): active skills that sacrifice or endanger the monster itself (Hoá Kén, Hiến Tế, paying HP);
 * - spell (pink): used like a reaction spell, in the reaction window or from the hand;
 * - passive (purple): works on its own;
 * - note (yellow): "Lưu ý", the important notes of the skill set.
 * `head` is the skill's heading in the card text: its description is the text from that heading to the next
 * one, so editing the card text keeps it in step. A skill whose heading is missing shows no text.
 */
export type SkillKind = "active" | "risk" | "spell" | "passive" | "note";
/**
 * `pick` takes a small skill out of a shared skill set: the lines of the card text that contain any of these
 * words (with their indented follow-on lines). Used when one heading holds several small skills, e.g. Khiên
 * Ân Huệ holds the blessings of the knight, the king and the queen.
 */
export type SkillEntry = { name: string; kind: SkillKind; icon: string; head?: string; pick?: string[]; chain?: boolean };
export type SkillShown = SkillEntry & { text: string };

const A = (name: string, icon: string, head = name): SkillEntry => ({ name, kind: "active", icon, head });
const P = (name: string, icon: string, head = name): SkillEntry => ({ name, kind: "passive", icon, head });
const AP = (name: string, icon: string, ...pick: string[]): SkillEntry => ({ name, kind: "active", icon, pick });
const PP = (name: string, icon: string, ...pick: string[]): SkillEntry => ({ name, kind: "passive", icon, pick });
const R = (name: string, icon: string, head = name): SkillEntry => ({ name, kind: "risk", icon, head });
const RP = (name: string, icon: string, ...pick: string[]): SkillEntry => ({ name, kind: "risk", icon, pick });
const S = (name: string, icon: string, head = name): SkillEntry => ({ name, kind: "spell", icon, head });
const SP = (name: string, icon: string, ...pick: string[]): SkillEntry => ({ name, kind: "spell", icon, pick });
/**
 * A skill that comes with the one before it (Chân kén and Nở with Hoá Kén): the sheet keeps them in one row,
 * joined by a metal bar.
 */
const joined = (entry: SkillEntry): SkillEntry => ({ ...entry, chain: true });
/** Lưu ý: the lines of the card text that are notes for the whole skill set. */
const NOTE = (...pick: string[]): SkillEntry => ({ name: "Lưu ý", kind: "note", icon: "info", pick });
const KNIGHT = PP("Lời chúc của kỵ sĩ", "black-knight-helm", "lời chúc của kỵ sĩ");
const KING = PP("Lời chúc của vua", "imperial-crown", "lời chúc của vua");
const QUEEN = PP("Lời chúc của hậu", "queen-crown", "lời chúc của hậu");

export const SKILL_BOOK: Record<string, SkillEntry[]> = {
  "phu-thuy-thoi-gian": [A("Lão hoá", "hourglass"), P("Cường hoá Lão Hoá", "anticlockwise-rotation"), A("Dòng chảy thời gian", "clockwork")],
  "rong-phun-hoa-cau": [A("Lộ diện", "all-seeing-eye"), A("Hoả cầu", "fireball")],
  "chien-si-gam-nham": [S("Khiên thú sĩ", "wolf-head")],
  "kiem-si-lua-thieng": [A("Vệt lửa", "fire-dash"), joined(R("Truy cùng diệt tận", "flame-spin")), joined(R("Hoả thần long", "dragon-head"))],
  "dau-si-bo-tot": [P("Chiến lợi phẩm", "charging-bull")],
  "trieu-hoi-ac-ma": [P("Khế ước ác ma", "pentagram-rose"), A("Sấm địa ngục", "lightning-flame")],
  "ky-si-bong-toi": [PP("Kỵ pháp", "mounted-knight", "khi giáp lá cà"), joined(PP("Chiến ý", "sword-brandish", "chiến ý")), R("Hiến Tế", "sacrificial-dagger")],
  "yeu-tinh-chuc-phuc": [P("Lời chúc phúc của tinh linh", "fairy-wand"), A("Hỗ công", "crossed-swords"), S("Hộ thủ", "checked-shield")],
  "mo-voi-ma-mut": [R("Nguyền rủa", "animal-skull"), P("Ác linh", "ghost")],
  "ong-khong-lo": [A("Kim châm tê liệt", "bee")],
  "linh-chien-da-khong-lo": [S("Tường thành", "stone-wall")],
  "khung-long-vay-kiem": [P("Vãy phá giáp", "stegosaurus-scales")],
  "rong-boc-trung": [A("Thế công", "dragon-spiral"), A("Thế thủ", "egg-defense"), NOTE("đổi thế công hoặc thế thủ")],
  "ga-he-dang-so": [A("Quả cầu bóng đêm", "concentration-orb")],
  "tho-den-tinh-nghich": [P("Nhảy qua lại", "rabbit")],
  "cuc-bong-ma-quai": [A("Phát nổ", "spiky-explosion"), A("Pháo kích", "cannon-shot"), S("Bông mềm", "fluffy-cloud"), NOTE("mỗi loại kỹ năng", "các kỹ năng ngoài")],
  "quai-thu-thien-su": [P("Cầu nguyện", "prayer"), P("Ân huệ thiên sứ", "angel-wings")],
  "te-giac-be-con": [A("Thăng cấp", "rhinoceros-horn")],
  "te-giac-hieu-thang": [A("Thăng cấp", "rhinoceros-horn")],
  "te-giac-chien-binh": [P("Tinh thần chiến binh", "rhinoceros-horn")],
  "phu-thuy-ti-hon": [A("Cầu sấm", "focused-lightning")],
  "sau-non": [
    RP("Hoá Kén", "caterpillar", "tiêu hao 1 mana.", "kén có công", "kén và chân kén hồi"),
    joined(AP("Chân kén", "spider-web", "tạo tối đa 2 chân kén")),
    joined(PP("Nở", "butterfly", "đầu lượt của bạn", "đủ 4 lần", "đủ 5 lần", "đủ 6 lần", "chết từ mốc")),
  ],
  "trai-tim-hai-long": [A("Triều lên", "wave-crest"), A("Con nước lớn tàn phá", "big-wave"), A("Đại hồng thuỷ huỷ diệt", "waves"), NOTE("kẻ bị đòn này hạ")],
  "sua-hut-ma-phap": [A("Tích luỹ ma pháp", "jellyfish")],
  "con-thinh-no-cua-hai-vuong": [
    P("Hộ thần", "checked-shield"),
    P("Đè nén", "trident-shield"),
    A("Cơn thịnh nộ của hải thần", "trident"),
    P("Biển lặng", "wave-surfer"),
  ],
  "chien-binh-lan-khuat": [A("Ẩn mình", "hooded-assassin"), NOTE("số cam cho thấy")],
  "ke-san-moi-tu-than": [P("Kẻ săn mồi tử thần", "grim-reaper")],
  "sat-nhan-bat-giu": [A("Bắt Giữ", "manacles")],
  "rong-dia-nguc": [A("Lửa bóng tối", "fireball")],
  "hu-nhot-linh-hon": [P("Hũ nhốt hồn", "ghost"), A("Gọi hồn", "prayer")],
  "sangan": [P("Triệu gọi", "card-joker")],
  "thanh-thuat-su": [A("Thánh thuật", "heart-shield")],
  "ke-trom-ao-trang": [P("Kẻ trộm", "card-joker"), P("Lẫn trốn", "rabbit")],
  "binh-bien-hinh": [A("Biến hình", "butterfly")],
  "ky-nhong-dien": [P("Kích điện", "lightning-flame")],
  "ky-si-canh-cut": [A("Đổi bài", "card-exchange")],
  "mat-na-bong-toi": [A("Trùng chú", "ghost")],
  "khung-long-hinh-nguoi": [P("Thông minh", "all-seeing-eye")],
  "zoa": [P("Quái thú", "health-normal")],
  "metal-zoa": [P("Quái thú", "health-normal")],
  "te-te-da": [P("Giáp Cứng", "checked-shield"), NOTE("cường hoá")],
  "chien-binh-nam-cham": [P("Siêu tốc", "energy-sword"), P("Từ Tính", "electric-whip"), P("Lực từ", "crossed-swords")],
  "sieu-dan-t-rex": [A("Kích điện", "lightning-flame"), A("Phóng điện", "bolt-spell-cast"), P("Bảo trì", "health-normal")],
  leviathan: [P("Không được mạo phạm", "shield"), A("Thần biển nổi giận", "trident")],
  "phu-thuy-do-choi": [P("Hộ pháp", "magic-shield"), A("Phong ấn", "padlock")],
  "ky-sinh-trung-kim-loai": [P("Máy lọc", "gear-hammer"), P("Tăng sinh khối", "upgrade")],
  "nguoi-yeu-hanh-phuc": [P("Tia sáng hạnh phúc", "angel-wings")],
  "kraken": [P("Đắm tàu", "kraken-tentacle")],
  "kazura": [P("Săn bắt vì bạn", "hunting-bolas"), NOTE("điểm số phía trên", "không thể bị chọn làm mục tiêu")],
  "kizuran": [S("Chịu đòn vì bạn", "heart-shield"), NOTE("số cam:", "điểm do kazura kiếm được")],
  "ke-giam-ho-linh-hon": [P("Phẫn nộ", "enrage"), R("Kiếm hấp thụ linh hồn", "bloody-sword")],
  "mat-xanh-huy-diet": [A("Cầu sấm ánh sáng", "bolt-eye")],
  "mat-do-tan-pha": [A("Cầu lửa địa ngục", "burning-eye")],
  "hoa-an-thit-nguoi": [A("Hấp thụ", "carnivorous-plant"), NOTE("không đánh thường")],
  "thuong-quan-long": [A("Cò quay", "revolver")],
  "may-nem-bom-hinh-nhen": [A("Súng phóng lựu", "carpet-bombing")],
  "khong-lo-mot-mat": [P("Đập phá", "cyclops")],
  "may-quay-thuong": [
    AP("Quay thưởng", "slot-machine", "quay thưởng một lần", "vòng quay trúng"),
    AP("Số 7", "card-joker", "- số 7"),
    AP("Kiếm", "broadsword", "- kiếm"),
    AP("Khiên", "round-shield", "- khiên"),
    AP("Thập tự", "health-normal", "- thập tự"),
    AP("Số 6", "dice-six-faces-six", "-số 6", "- số 6"),
    A("Con bạc nổi giận", "dice-fire"),
  ],
  "rong-con": [A("Hơi thở rồng", "dragon-breath")],
  "rong-ngan-tuoi": [A("Hơi thở rồng", "dragon-breath")],
  "chien-binh-rong": [P("Vảy rồng", "scale-mail")],
  "ma-dao-si": [A("Ma đạn", "bolt-spell-cast")],
  "loi-nguyen-cua-rong": [A("Địa ngục lửa", "fire-ring")],
  "thien-than-be-nho": [A("Thiên thần hộ mệnh", "angel-outfit"), S("Tinh linh bé nhỏ", "fairy")],
  "hiep-si-cua-vua": [KNIGHT, QUEEN, P("Kiếm tấn công", "broadsword")],
  "hiep-si-ho-ve": [QUEEN, KING, KNIGHT, S("Kiếm hộ vệ", "sword-in-stone"), PP("Học tập", "open-book", "- học tập"), PP("Trưởng thành", "growth", "- trưởng thành"), NOTE("số màu cam và tím")],
  "hiep-si-cua-hau": [KNIGHT, KING, A("Đàm phán", "shaking-hands"), A("Kiếm phép", "energy-sword")],
  "hiep-si-huyen-bi": [P("Khiên toàn năng", "magic-shield"), A("Tấn công", "sword-clash"), S("Phòng ngự", "shield-reflect"), A("Đàm phán", "shaking-hands")],
  "my-dieu-nhan": [S("Giáp và Vuốt", "harpy"), A("Thổi bay", "whirlwind"), A("Mê hoặc", "charm"), S("Roi điện", "electric-whip"), NOTE("mỗi kỹ năng", "đủ 4 kỹ năng")],
  "nu-chua-dieu-nhan": [S("Giáp và Vuốt", "harpy"), A("Thổi bay", "whirlwind"), A("Mê hoặc", "charm"), A("Dụ dỗ", "lips"), S("Roi điện", "electric-whip"), NOTE("mỗi kỹ năng", "đủ 4 kỹ năng")],
  "nu-chua-dieu-nhan-hoan-my": [P("Giáp phản", "spiked-shell"), A("Gió xoáy", "tornado"), A("Dụ dỗ", "lips"), A("Roi sấm", "lightning-branches")],
  "the-than-cua-shien": [SP("Thế thân trên sân", "ninja-heroic-stance", "- trên sân"), SP("Thế thân trên tay", "card-exchange", "- trên tay")],
  "phu-thuy-rung-den": [A("Nguyền rủa", "witch-face")],
  "ky-si-cuoi-rong": [P("Mũi thương bị nguyền rủa", "barbed-spear"), P("Lửa địa ngục", "flame-tunnel")],
  "rong-ac-ma": [A("Hoả cầu địa ngục", "burning-skull")],
  "chien-binh-huyen-thoai": [P("Chiến sư", "laurel-crown"), P("Bền bỉ", "heart-plus")],
  "ken-ngai": [A("Nở", "butterfly")],
  "chan-ken": [P("Chân kén", "spider-web", "")],
  "ngai-khong-lo": [A("Thổi độc", "poison-cloud")],
  "ngai-nu-hoang": [A("Thổi độc", "poison-cloud"), NOTE("độc sẽ cộng dồn")],
  "ngai-hoan-my": [A("Thổi độc", "poison-cloud"), NOTE("độc sẽ cộng dồn")],
  "bong-ma-dia-nguc": [P("Gieo rắc", "ghost")],
  "chien-binh-xuong": [S("Linh hoạt", "sword-clash")],
  "medusa": [A("Hoá đá", "medusa-head"), P("Tan vỡ", "cracked-glass")],
};

function norm(text: string) {
  return text.replace(/\*\*|__/g, "").trim().toLowerCase();
}

/**
 * A line that is only a heading: marked and closed ("__**Khiên Ân Huệ**__:"), or marked and ending in a colon
 * with its closing mark on the next line ("__**Kỵ pháp: ").
 */
const HEADING_LINE = /^\s*(?:\*\*__|__\*\*)[^\n]*?(?:(?:__\*\*|\*\*__)\s*:?|:)\s*$/;

/** A heading whose closing mark sits at the start of the next line: "__**Ngủ đông" then "**__Tôi không thể…". */
const OPEN_HEADING = /^\s*(?:\*\*__|__\*\*)[^\n*_]*$/;
const MARKED = /^\s*(?:\*\*__|__\*\*|\*\*|__)/;

/** The lines holding any of the words, each with the indented lines that continue it. */
function pickLines(text: string, words: string[]): string[] {
  const lines = text.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = norm(lines[i]);
    if (!line || !words.some((word) => line.includes(word.toLowerCase()))) continue;
    out.push(lines[i]);
    while (i + 1 < lines.length && /^[ \t]{2,}\S/.test(lines[i + 1])) out.push(lines[++i]);
  }
  return out;
}

const tidy = (lines: string[]) =>
  lines
    .map((line) => line.trim().replace(/^(?:\*\*__|__\*\*|\*\*|__)\s*/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * The mana a skill costs, read from its description: every "N mana" except mana gained ("nhận thêm 1 mana")
 * or an alternative ("Hoặc tiêu hao 2 mana để tiến hoá"). Several different costs show as "0/1"; none, or
 * only 0, shows nothing.
 */
export function skillCost(text: string): string {
  const costs: number[] = [];
  for (const hit of text.matchAll(/(\d+)\s*mana/gi)) {
    const before = text.slice(Math.max(0, (hit.index ?? 0) - 28), hit.index).toLowerCase();
    if (/nhận|hoặc/.test(before)) continue;
    const value = Number(hit[1]);
    if (!costs.includes(value)) costs.push(value);
  }
  return costs.some((value) => value > 0) ? costs.join("/") : "";
}

/** Every skill icon the book uses (for the icon extractor and checks). */
export const SKILL_ICON_NAMES = [...new Set(Object.values(SKILL_BOOK).flatMap((list) => list.map((entry) => entry.icon)))];

const OPENERS = /(\*\*__|__\*\*|\*\*|__)\s*/g;

function plain(text: string) {
  return text.replace(/\*\*|__/g, "").toLowerCase();
}

/** Where a heading starts in the card text: a marked heading first, then a line that starts with it. */
function findHead(text: string, head: string): number {
  const want = plain(head).trim();
  if (!want) return -1;
  for (const hit of text.matchAll(OPENERS)) {
    const at = hit.index ?? 0;
    const after = plain(text.slice(at + hit[0].length, at + hit[0].length + head.length + 8)).trim();
    if (after.startsWith(want)) return at;
  }
  const lines = text.split("\n");
  let offset = 0;
  for (const line of lines) {
    if (plain(line).trim().startsWith(want)) return offset;
    offset += line.length + 1;
  }
  return -1;
}

/** The slice without its own heading, since the sheet already shows the skill's name as a title. */
function dropHead(segment: string, head: string): string {
  const name = head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mark = "(?:\\*\\*__|__\\*\\*|\\*\\*|__)?";
  return segment.replace(new RegExp(`^\\s*${mark}\\s*${name}\\s*[.:]?\\s*${mark}\\s*[.:]?\\s*`, "iu"), "");
}

/** The skills of a card, each with its own slice of the card text. */
export function skillsOf(cardId: string, text: string): SkillShown[] {
  const list = SKILL_BOOK[cardId] ?? [];
  if (list.length === 0) return [];
  // Lines a small skill took for itself, and bare heading lines, are left out of the bigger skills around them.
  const taken = new Set(list.flatMap((entry) => (entry.pick ? pickLines(text, entry.pick).map(norm) : [])));
  const keep = (chunk: string) => {
    const lines = chunk.split("\n");
    return lines.filter((line, at) => !taken.has(norm(line)) && !HEADING_LINE.test(line) && !(OPEN_HEADING.test(line) && MARKED.test(lines[at + 1] ?? "")));
  };
  const starts = list.map((entry) => (entry.pick ? -1 : entry.head ? findHead(text, entry.head) : -1));
  const sorted = [...new Set(starts.filter((at) => at >= 0))].sort((a, b) => a - b);
  const first = sorted[0] ?? -1;
  return list.map((entry, i) => {
    if (entry.pick) return { ...entry, text: tidy(pickLines(text, entry.pick)) };
    const at = starts[i];
    if (at < 0) return { ...entry, text: entry.head === "" ? text.trim() : "" };
    const end = sorted.find((other) => other > at) ?? text.length;
    // Lines before the first heading (a card's general rule) go with the first skill.
    const lead = at === first && first > 0 ? tidy(keep(text.slice(0, first))) : "";
    const body = tidy(keep(dropHead(text.slice(at, end), entry.head ?? "")));
    return { ...entry, text: lead ? `${lead}\n\n${body}` : body };
  });
}
