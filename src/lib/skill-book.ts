/**
 * Skills shown as icons on the monster sheet. "active" skills are the ones pressed on the board (blue ring);
 * "passive" ones work on their own (purple ring). `head` is the skill's heading in the card text: its
 * description is the text from that heading to the next one, so editing the card text keeps it in step.
 * A skill whose heading is missing from the text shows the whole card text.
 */
export type SkillKind = "active" | "passive";
export type SkillEntry = { name: string; kind: SkillKind; icon: string; head?: string };
export type SkillShown = SkillEntry & { text: string };

const A = (name: string, icon: string, head = name): SkillEntry => ({ name, kind: "active", icon, head });
const P = (name: string, icon: string, head = name): SkillEntry => ({ name, kind: "passive", icon, head });

export const SKILL_BOOK: Record<string, SkillEntry[]> = {
  "phu-thuy-thoi-gian": [A("Lão hoá", "hourglass"), P("Cường hoá Lão Hoá", "anticlockwise-rotation"), A("Dòng chảy thời gian", "clockwork")],
  "rong-phun-hoa-cau": [A("Lộ diện", "all-seeing-eye"), A("Hoả cầu", "fireball")],
  "chien-si-gam-nham": [A("Khiên thú sĩ", "wolf-head")],
  "kiem-si-lua-thieng": [A("Vệt lửa", "fire-dash"), A("Long Hoả", "fire-breath"), A("Truy cùng diệt tận", "flame-spin"), A("Hoả thần long", "dragon-head")],
  "dau-si-bo-tot": [P("Chiến lợi phẩm", "charging-bull")],
  "trieu-hoi-ac-ma": [P("Khế ước ác ma", "pentagram-rose"), A("Sấm địa ngục", "lightning-flame")],
  "ky-si-bong-toi": [P("Kỵ pháp", "mounted-knight"), A("Hiến Tế", "sacrificial-dagger")],
  "yeu-tinh-chuc-phuc": [P("Lời chúc phúc của tinh linh", "fairy-wand"), A("Hỗ công", "crossed-swords"), A("Hộ thủ", "checked-shield")],
  "mo-voi-ma-mut": [A("Nguyền rủa", "animal-skull"), P("Ác linh", "ghost")],
  "ong-khong-lo": [A("Tê liệt", "bee")],
  "linh-chien-da-khong-lo": [A("Tường thành", "stone-wall")],
  "khung-long-vay-kiem": [P("Vãy phá giáp", "stegosaurus-scales")],
  "rong-boc-trung": [A("Thế công", "dragon-spiral"), A("Thế thủ", "egg-defense")],
  "ga-he-dang-so": [A("Quả cầu bóng đêm", "concentration-orb")],
  "tho-den-tinh-nghich": [P("Nhảy qua lại", "rabbit")],
  "cuc-bong-ma-quai": [A("Dùng để tấn công", "floating-ghost"), A("Dùng để phòng ngự", "ghost-ally"), A("Dùng như spell", "magic-swirl")],
  "quai-thu-thien-su": [P("Cầu nguyện", "prayer"), P("Ân huệ thiên sứ", "angel-wings")],
  "te-giac-be-con": [A("Thăng cấp", "rhinoceros-horn")],
  "te-giac-hieu-thang": [A("Thăng cấp", "rhinoceros-horn")],
  "te-giac-chien-binh": [P("Tinh thần chiến binh", "rhinoceros-horn")],
  "phu-thuy-ti-hon": [A("Cầu sấm", "focused-lightning")],
  "sau-non": [A("Hoá Kén", "caterpillar")],
  "trai-tim-hai-long": [A("Triều lên", "wave-crest"), A("Con nước lớn tàn phá", "big-wave"), A("Đại hồng thuỷ huỷ diệt", "waves")],
  "sua-hut-ma-phap": [A("Ma pháp tích tụ", "jellyfish")],
  "con-thinh-no-cua-hai-vuong": [P("Đè nén", "trident-shield"), A("Cơn thịnh nộ của hải thần", "trident"), P("Biển lặng", "wave-surfer")],
  "chien-binh-lan-khuat": [A("Ẩn mình", "hooded-assassin")],
  "ke-san-moi-tu-than": [P("Kẻ săn mồi tử thần", "grim-reaper")],
  "sat-nhan-bat-giu": [A("Bắt Giữ", "manacles")],
  "kraken": [P("Đắm tàu", "kraken-tentacle")],
  "kazura": [P("Săn bắt vì bạn", "hunting-bolas")],
  "kizuran": [A("Chịu đòn vì bạn", "heart-shield")],
  "ke-giam-ho-linh-hon": [P("Phẫn nộ", "enrage"), P("Kiếm hấp thụ linh hồn", "bloody-sword")],
  "mat-xanh-huy-diet": [A("Cầu sấm ánh sáng", "bolt-eye")],
  "mat-do-tan-pha": [A("Cầu lửa địa ngục", "burning-eye")],
  "hoa-an-thit-nguoi": [A("Hấp thụ", "carnivorous-plant")],
  "thuong-quan-long": [A("Cò quay", "revolver")],
  "may-nem-bom-hinh-nhen": [A("Súng phóng lựu", "carpet-bombing")],
  "khong-lo-mot-mat": [P("Đập phá", "cyclops")],
  "may-quay-thuong": [A("Quay thưởng", "slot-machine"), A("Con bạc nổi giận", "dice-fire")],
  "rong-con": [A("Hơi thở rồng", "dragon-breath")],
  "rong-ngan-tuoi": [A("Hơi thở rồng", "dragon-breath")],
  "chien-binh-rong": [P("Vảy rồng", "scale-mail")],
  "ma-dao-si": [A("Ma đạn", "bolt-spell-cast")],
  "loi-nguyen-cua-rong": [A("Địa ngục lửa", "fire-ring")],
  "thien-than-be-nho": [A("Thiên thần hộ mệnh", "angel-outfit"), P("Tinh linh bé nhỏ", "fairy")],
  "hiep-si-cua-vua": [P("Khiên Ân Huệ", "crowned-heart"), P("Kiếm tấn công", "broadsword")],
  "hiep-si-ho-ve": [P("Khiên Ân Huệ", "crowned-heart"), A("Kiếm hộ vệ", "sword-in-stone"), P("Học tập và trưởng thành", "open-book")],
  "hiep-si-cua-hau": [P("Khiên Ân Huệ", "crowned-heart"), A("Đàm phán", "shaking-hands"), A("Kiếm phép", "energy-sword")],
  "hiep-si-huyen-bi": [P("Khiên toàn năng", "magic-shield"), A("Tấn công", "sword-clash"), A("Phòng ngự", "shield-reflect"), A("Đàm phán", "shaking-hands")],
  "my-dieu-nhan": [A("Giáp và Vuốt", "harpy"), A("Thổi bay", "whirlwind"), A("Mê hoặc", "charm"), A("Roi điện", "electric-whip")],
  "nu-chua-dieu-nhan": [A("Giáp và Vuốt", "harpy"), A("Thổi bay", "whirlwind"), A("Mê hoặc", "charm"), A("Dụ dỗ", "lips"), A("Roi điện", "electric-whip")],
  "nu-chua-dieu-nhan-hoan-my": [P("Giáp phản", "spiked-shell"), A("Gió xoáy", "tornado"), A("Dụ dỗ", "lips"), A("Roi sấm", "lightning-branches")],
  "the-than-cua-shien": [A("Thế thân", "ninja-heroic-stance")],
  "phu-thuy-rung-den": [A("Nguyền rủa", "witch-face")],
  "ky-si-cuoi-rong": [P("Mũi thương bị nguyền rủa", "barbed-spear"), P("Lửa địa ngục", "flame-tunnel")],
  "rong-ac-ma": [A("Hoả cầu địa ngục", "burning-skull")],
  "chien-binh-huyen-thoai": [P("Chiến sư", "laurel-crown"), P("Bền bỉ", "heart-plus")],
  "ken-ngai": [A("Mọc chân", "spider-alt", ""), A("Nở", "butterfly", "")],
  "chan-ken": [P("Chân kén", "spider-web", "")],
  "ngai-khong-lo": [A("Thổi độc", "poison-cloud")],
  "ngai-nu-hoang": [A("Thổi độc", "poison-cloud")],
  "ngai-hoan-my": [A("Thổi độc", "poison-cloud")],
};

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
  const starts = list.map((entry) => (entry.head ? findHead(text, entry.head) : -1));
  const sorted = [...new Set(starts.filter((at) => at >= 0))].sort((a, b) => a - b);
  const first = sorted[0] ?? -1;
  return list.map((entry, i) => {
    const at = starts[i];
    if (at < 0) return { ...entry, text: entry.head === "" ? text.trim() : "" };
    const end = sorted.find((other) => other > at) ?? text.length;
    // Lines before the first heading (a card's general rule) go with the first skill.
    const lead = at === first && first > 0 ? `${text.slice(0, first).trim()}\n\n` : "";
    return { ...entry, text: `${lead}${dropHead(text.slice(at, end), entry.head ?? "").trim()}` };
  });
}
