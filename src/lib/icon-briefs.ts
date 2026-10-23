import { spellCard } from "@/lib/catalog";

/**
 * Tác dụng ngắn của icon phản ứng (chủ game 23/10, T3): a tap on a skill's or a spell's icon shows its name and a short
 * effect. The effect is the part of the card text these patterns pick (several parts are joined with commas), so the
 * numbers follow the card text when it changes. A skill or a spell with no pattern, or whose text no longer matches,
 * shows its whole text.
 */
const SKILL_BRIEFS: Record<string, Record<string, RegExp[]>> = {
  "rong-phun-hoa-cau": { "Hoả cầu": [/giảm \d+ thủ phép và gây \d+ sát thương phép/] },
  "rong-con": { "Hơi thở rồng": [/gây \d+ sát thương chuẩn và \d+ sát thương phép/] },
  "rong-ngan-tuoi": { "Hơi thở rồng": [/gây \d+ sát thương chuẩn và \d+ sát thương phép/] },
  "kiem-si-lua-thieng": {
    "Vệt lửa": [/gây \d+ sát thương phép/],
    "Truy cùng diệt tận": [/tiêu thêm \d+ máu để gây thêm \d+ sát thương phép một lần nữa/],
    "Hoả thần long": [/gây \d+ sát thương phép và \d+ sát thương chuẩn/],
  },
  "trieu-hoi-ac-ma": { "Sấm địa ngục": [/Gây \d+ sát thương phép/] },
  "ong-khong-lo": { "Kim châm tê liệt": [/gây tê liệt 1 quái thú trong \d+ lượt/] },
  "mo-voi-ma-mut": {
    "Nguyền rủa": [/hy sinh và sử dụng lượng máu hiện tại tấn công vào 1 quái thú đối phương/, /bào mòn chúng qua từng lượt với \d+ sát thương chuẩn/],
  },
  "ga-he-dang-so": { "Quả cầu bóng đêm": [/gây \d+ sát thương, cứ thêm \d+ lần gây thêm \d+ sát thương/] },
  "cuc-bong-ma-quai": { "Phát nổ": [/Tự huỷ, gây sát thương phép lên kẻ địch bằng với công/] },
  "phu-thuy-ti-hon": { "Cầu sấm": [/gây sát thương phép bằng \d+ cộng với số sao hiện có/] },
  "trai-tim-hai-long": {
    "Triều lên": [/gây \d+ sát thương phép lên 1 \S+ địch/],
    "Con nước lớn tàn phá": [/gây \d+ sát thương phép và thêm 1 kẻ địch ngẫu nhiên/],
    "Đại hồng thuỷ huỷ diệt": [/gây \d+ sát thương phép lên tất cả kẻ địch/],
  },
  "sua-hut-ma-phap": { "Tích luỹ ma pháp": [/gây \d+ cộng với số sát thương đã tích tụ/] },
  "con-thinh-no-cua-hai-vuong": { "Cơn thịnh nộ của hải thần": [/Gây \d+ \+ \d+ × số lần bị đè nén/] },
  "phu-thuy-thoi-gian": {
    "Lão hoá": [/Đồng minh \([^)]*\) tăng \d+% chỉ số/, /Đối thủ giảm \d+% chỉ số/],
    "Dòng chảy thời gian": [/Ảnh hưởng của ma pháp cường hoá của lão hoá lên tất cả các bài quân trên sân/],
  },
  "yeu-tinh-chuc-phuc": { "Hỗ công": [/Đòn kế tiếp của đồng minh tăng \d+ công, \+\d+ thủ và \d+ sát thương phép/] },
  "mat-xanh-huy-diet": { "Cầu sấm ánh sáng": [/Đòn tấn công tiếp theo thành tia sáng huỷ diệt, sát thương chuẩn bằng đúng công/] },
  "mat-do-tan-pha": { "Cầu lửa địa ngục": [/gây sát thương hỗn hơp \([^)]*\)/] },
  "rong-ac-ma": { "Hoả cầu địa ngục": [/gây sát thương hỗn hơp \([^)]*\)/] },
  "hoa-an-thit-nguoi": { "Hấp thụ": [/Chịu đòn từ 1 quái thú, để cướp \d+ máu tối đa của nó/] },
  "thuong-quan-long": { "Cò quay": [/Ba nòng, mỗi nòng có tỉ lệ \d+% được bắn/] },
  "may-nem-bom-hinh-nhen": { "Súng phóng lựu": [/Tạo cơn mưa bom \d+ quả, mỗi quả \d+ sát thương chuẩn/] },
  "may-quay-thuong": { "Con bạc nổi giận": [/gây sát thương phép bằng số lần quay trượt cộng thêm \d+/] },
  "ma-dao-si": { "Ma đạn": [/bắn \d+ phát liên tục, sát thương tăng dần theo từng loại ma đạn, từ \d+ rồi \d+ và loạt cuối là \d+/] },
  "loi-nguyen-cua-rong": { "Địa ngục lửa": [/Gây \d+ sát thương chuẩn lên mọi quái địch/] },
  "thien-than-be-nho": { "Thiên thần hộ mệnh": [/Tạo 1 khiên vật lý hoặc 1 khiên phép cho 1 đồng minh/] },
  "phu-thuy-rung-den": { "Nguyền rủa": [/-\d+ công -\d+ sát thương kỹ năng/, /-\d+ thủ -\d+ thủ phép/, /duy trì trong \d+ lượt/] },
  "hiep-si-cua-hau": { "Kiếm phép": [/Lần 1: [^.]*\. Gây [^.]*?(?= lên)/, /Lần 2: [^.]*\. Gây [^.]*?(?= lên)/] },
  "my-dieu-nhan": {
    "Thổi bay": [/Huỷ 1 lá phép ngẫu nhiên trên tay đối thủ/],
    "Mê hoặc": [/Kích động 1 quái địch đánh thường vào ta/, /Quái đó không thể hành động ở lượt sau/],
    "Roi điện": [/né/, /Tăng vĩnh viễn \d+ công và trả \d+ sát thương phép/],
  },
  "nu-chua-dieu-nhan": {
    "Thổi bay": [/Huỷ 1 lá phép ngẫu nhiên trên tay đối thủ/],
    "Mê hoặc": [/Kích động 1 quái địch đánh thường vào ta/, /Quái đó không thể hành động ở lượt sau/],
    "Dụ dỗ": [/Dụ 1 quái địch đánh thường vào 1 quái của ta/],
    "Roi điện": [/né/, /Tăng vĩnh viễn \d+ công và trả \d+ sát thương phép/],
  },
  "nu-chua-dieu-nhan-hoan-my": {
    "Gió xoáy": [/Thổi bay 1 phép ngẫu nhiên của địch/, /Lượt sau không được rút bài/],
    "Dụ dỗ": [/Dụ 1 quái địch đánh thường vào 1 quái của ta/],
    "Roi sấm": [/Đòn đánh kế tiếp thành sát thương phép, gồm công và mọi sát thương đã tích/],
  },
  "chien-si-gam-nham": { "Khiên thú sĩ": [/tăng gấp đôi phòng ngự và thêm \d+ máu tối đa/] },
  "ngai-khong-lo": { "Thổi độc": [/gây \d+ sát thương phép lên tất cả quái thú kẻ địch/, /dính độc chịu \d+ sát thương chuẩn đầu mỗi lượt, kéo dài \d+ lượt/] },
  "ngai-nu-hoang": { "Thổi độc": [/gây \d+ sát thương phép lên tất cả quái thú kẻ địch/, /độc trong \d+ lượt/] },
  "ngai-hoan-my": { "Thổi độc": [/gây \d+ sát thương phép lên tất cả quái thú kẻ địch/, /độc vĩnh viễn/] },
};

const SPELL_BRIEFS: Record<string, RegExp[]> = {
  "soi-xich-dia-nguc": [/Khống chế 1 quái thú trong \d+ lượt và làm phòng ngự về 0/],
  "thanh-guom-anh-sang": [/Ngăn tất cả quái thú đối phương tấn công trong \d+ lượt/],
  "sam-set-tan-the": [/Gây \d+ \+ \(số sao hiện có của bạn\) thành sát thương chuẩn lên tất cả quái thú kẻ địch/],
  "mu-ma-phap": [/Tạo mũ che sân của bạn/, /Đối phương chỉ thấy mũ/],
  "phan-nguyen": [/Chuyển trạng thái xấu đó sang quái đối thủ/],
  "guong-phong-ho": [/Tạo rào chắn ngăn đòn tấn công giáp lá cà, cướp 1\/2 mọi chỉ số quái thú đang tấn công/],
  "la-chan-phan-don": [/Phản đòn kỹ năng đang nhắm mình sang 1 kẻ địch bất kỳ/],
  "vong-nguyen-rua-ac-ma": [/Chặn đòn tấn công hoặc skill gây sát thương/, /Sát thương nó gây ra còn một nửa, vĩnh viễn/],
  "hap-thu-ma-phap": [/Hấp thu lá phép đang thi triển/],
  "phuc-kich": [/chặn đòn trước/, /Quái đó tăng \d+ công trong đòn này và gây sát thương giáp lá cà lên quái đang tấn công/],
  "hoan-doi": [/Hoán đổi vị trí của nó với quái thú đó/],
  "vong-xoay-bao-ho": [/Ngăn chặn đòn tấn công, và buộc đối thủ kết thúc ngay lượt/],
  "ngan-chan-phong-ngu": [/Chỉ định 1 đối thú không thể tham gia phòng ngự trong lượt này/],
  "virus-an-mon": [/ăn mòn 1 quái từ \d+ sao trở lên của đối thủ/, /Gây \d+ sát thương chuẩn, gấp đôi nếu từ \d+ sao/],
  "co-may-thoi-gian": [/Đưa quái đó về trạng thái ở đầu \d+ lượt chung trước/],
  "giap-co-khi": [/Tăng \d+ công và \d+ thủ phép vĩnh viễn, trước khi đòn rơi/, /Nếu công sau khi tăng cao hơn sát thương của đòn, phản nguyên đòn về quái ra đòn/],
};

const plain = (text: string) => text.replace(/\*\*|__/g, "").replace(/\s+/g, " ").trim();

/** The parts the patterns pick, joined; null when a pattern no longer matches. */
function pick(text: string, patterns: RegExp[] | undefined): string | null {
  if (!patterns) return null;
  const flat = plain(text);
  const parts: string[] = [];
  for (const pattern of patterns) {
    const hit = flat.match(pattern);
    if (!hit) return null;
    parts.push(hit[0]);
  }
  const joined = parts.map((part, i) => (i === 0 ? part : part.charAt(0).toLowerCase() + part.slice(1))).join(", ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/**
 * A skill's name and short effect: "Hoả cầu: Giảm 1 thủ phép và gây 3 sát thương phép." `text` is the skill's own
 * slice of the card text; a small skill that shares its set's lines (Con nước lớn tàn phá) is found in the whole card.
 */
export function skillBrief(cardId: string, name: string, text: string, card = ""): string {
  const patterns = SKILL_BRIEFS[cardId]?.[name];
  const effect = pick(text, patterns) ?? pick(card, patterns) ?? plain(text);
  return effect ? `${name}: ${effect.replace(/[.\s]+$/, "")}.` : name;
}

/** A spell's name and short effect. */
export function spellBrief(spellId: string): string {
  const card = spellCard(spellId);
  if (!card) return "";
  const effect = pick(card.effect, SPELL_BRIEFS[spellId]) ?? plain(card.effect);
  return `${card.name}: ${effect.replace(/[.\s]+$/, "")}.`;
}

/** Every brief, for the owner to read over. */
export const BRIEF_SKILLS = SKILL_BRIEFS;
export const BRIEF_SPELLS = Object.keys(SPELL_BRIEFS);
