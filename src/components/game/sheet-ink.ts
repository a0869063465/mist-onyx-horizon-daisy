import type { Ink, InkAt } from "@/components/game/painted";

/**
 * The monster sheet's own colours for its description (the owner's scheme, 18/10), on top of the notice board's.
 * Only the sheet uses them; the notice board keeps its colours. A number in front is coloured with its word.
 * - turns "5 lượt": orange; attack "công": orange; sacrifice "hiến tế": red;
 * - "thủ": yellow; "thủ phép": purple; "phòng ngự" (both): yellow to purple, top to bottom;
 * - "máu", "máu tối đa", "hồi 1 máu", "hồi đầy máu": green; "tiến hoá": pink;
 * - "không thể hành động / tấn công…": a readable grey; lifting bad states ("giải mọi trạng thái bất lợi"): blue.
 */
const NUM = String.raw`(?:[+\-−]?\d+\s*(?:điểm\s+)?)?`;
const START = String.raw`(?<![\p{L}\d])`;
/** A bare number right after the word ("thủ 3", "máu 4"), not one that starts a new phrase ("công 2 lần"). */
const AFTER = String.raw`(?:\s+\d+(?!\s*[\p{L}\d]))?`;
const END = String.raw`(?![\p{L}])`;

const RULES: Array<{ ink: Ink; re: RegExp }> = (
  [
    { ink: "sheet-turn", re: String.raw`\d+\s*lượt` },
    { ink: "sheet-blood", re: String.raw`hiến tế(?:\s+linh hồn)?` },
    { ink: "sheet-guard", re: String.raw`${NUM}phòng ngự` },
    { ink: "sheet-mdef", re: String.raw`${NUM}thủ phép${AFTER}` },
    { ink: "sheet-def", re: String.raw`(?<!(?:đối|phòng)\s)${NUM}thủ(?!\s*phép)${AFTER}` },
    { ink: "sheet-atk", re: String.raw`(?<!(?:tấn|thành|phản)\s)${NUM}công(?!\s*(?:chúa|kích))${AFTER}` },
    {
      ink: "sheet-hp",
      re: String.raw`hồi\s+(?:đầy\s+|\d+\s*)?máu(?:\s+tối đa)?|${NUM}máu(?:\s+tối đa)?${AFTER}`,
    },
    { ink: "sheet-evo", re: String.raw`tiến ho[áa]` },
    {
      ink: "sheet-mute",
      re: String.raw`không\s+(?:thể|được)\s+(?:hành động|tấn công|chặn|phản đòn|di chuyển|dùng (?:kỹ năng|skill|phép))`,
    },
    {
      ink: "sheet-clean",
      re: String.raw`giải\s+(?:trừ\s+)?(?:mọi|toàn bộ|hết|các)?\s*(?:các\s+)?trạng thái bất lợi|xo[áa]\s+(?:mọi|các|hết)?\s*trạng thái bất lợi|giải trừ|giải khống chế`,
    },
  ] as Array<{ ink: Ink; re: string }>
).map((rule) => ({ ink: rule.ink, re: new RegExp(`${START}(?:${rule.re})${END}`, "iuy") }));

export const sheetInk: InkAt = (text, at) => {
  let best: ReturnType<InkAt> = null;
  for (const rule of RULES) {
    rule.re.lastIndex = at;
    const hit = rule.re.exec(text);
    if (hit && (!best || hit[0].length > best.text.length)) best = { text: hit[0], ink: rule.ink };
  }
  return best;
};
