import { FORMS, MONSTERS, SPELLS } from "@/lib/catalog";
import { chipLabel, MONSTER_CHIPS } from "@/lib/card-edits";
import { parseCopy } from "@/lib/copy-mark";
import { FUSIONS } from "@/lib/fusion";
import { tr, useLang } from "@/lib/i18n";

/** The `sheet-*` inks are only for the monster sheet's description (see sheet-ink.ts), never the notice board. */
export type Ink =
  | "mon" | "spell" | "skill" | "atk" | "star1" | "star2" | "star3" | "star4" | "hide" | "sys" | "tru" | "phys" | "ward" | "fuse" | "mana"
  | "sheet-turn" | "sheet-blood" | "sheet-atk" | "sheet-def" | "sheet-mdef" | "sheet-guard" | "sheet-mute" | "sheet-hp" | "sheet-evo" | "sheet-clean";

/** Extra words to colour at a position of the text (the monster sheet's own colours): the longer match wins. */
export type InkAt = (text: string, at: number) => { text: string; ink: Ink } | null;

const FUSED = new Set(FUSIONS.map((recipe) => recipe.result));

function monsterInk(card: { id: string; stars: number }): Ink {
  if (FUSED.has(card.id)) return "fuse";
  return card.stars > 0 ? "mon" : "hide";
}

const NOTICE_RULES: Array<{ text: string; ink: Ink }> = [];
for (const card of MONSTERS) NOTICE_RULES.push({ text: card.name, ink: monsterInk(card) });
for (const card of FORMS) NOTICE_RULES.push({ text: card.name, ink: monsterInk(card) });
for (const card of SPELLS) NOTICE_RULES.push({ text: card.name, ink: "spell" });
for (const chips of Object.values(MONSTER_CHIPS)) {
  for (const chip of chips) {
    if (chip.label === "Khiên vật lý" || chip.label === "Khiên phép") continue;
    NOTICE_RULES.push({ text: chip.label, ink: "skill" });
  }
}
NOTICE_RULES.push(
  { text: "sát thương phép", ink: "skill" },
  { text: "Khiên vật lý", ink: "phys" },
  { text: "khiên vật lý", ink: "phys" },
  { text: "Khiên phép", ink: "ward" },
  { text: "khiên phép", ink: "ward" },
  { text: "sát thương vật lý", ink: "phys" },
  { text: "sát thương chuẩn", ink: "tru" },
  { text: "quái thú tấn công", ink: "atk" },
  { text: "giáp lá cà", ink: "atk" },
  { text: "va chạm", ink: "atk" },
  { text: "tấn công", ink: "atk" },
  { text: "1 lá quái thú", ink: "mon" },
  { text: "1 lá phép", ink: "spell" },
  { text: "quái thú 1 sao", ink: "star1" },
  { text: "quái thú 2 sao", ink: "star2" },
  { text: "quái thú 3 sao", ink: "star3" },
  { text: "quái thú 4 sao", ink: "star4" },
  { text: "quái thú ẩn mình", ink: "hide" },
  { text: "1 quái", ink: "mon" },
  { text: "1 phép", ink: "spell" },
  { text: "Đại thuỷ triều huỷ diệt", ink: "skill" },
  { text: "Con nước lớn tàn phá", ink: "skill" },
  { text: "Tia sáng huỷ diệt", ink: "skill" },
  { text: "tia sáng huỷ diệt", ink: "skill" },
  { text: "Sấm lôi phá", ink: "skill" },
  { text: "Đòn thêm", ink: "skill" },
  { text: "Giải phóng cầu ma lực", ink: "skill" },
  { text: "giải phóng cầu ma lực", ink: "skill" },
  { text: "Cầu ma lực", ink: "mana" },
  { text: "cầu ma lực", ink: "mana" },
);
for (const card of [...MONSTERS, ...FORMS]) {
  for (const bit of parseCopy(card.skill)) {
    if ("br" in bit || !bit.bold || !bit.under) continue;
    const name = bit.text.replace(/[:：.\s]+$/u, "").trim();
    if (name.length < 2 || name.length > 48) continue;
    NOTICE_RULES.push({ text: name, ink: "skill" });
  }
}

const SYSTEM_RULES: Array<{ text: string; ink: Ink }> = [
  { text: "Chế độ test", ink: "sys" },
  { text: "Cập nhật", ink: "sys" },
  { text: "Thông tin", ink: "sys" },
  { text: "Chiến thuật", ink: "sys" },
  { text: "Xuất", ink: "sys" },
  { text: "Trở về", ink: "sys" },
  { text: "Mô tả", ink: "sys" },
  { text: "Reset", ink: "sys" },
  { text: "Test", ink: "sys" },
  { text: "test", ink: "sys" },
  { text: "Use", ink: "sys" },
  { text: "AI", ink: "sys" },
];

function ruleBuckets(rules: Array<{ text: string; ink: Ink }>) {
  const buckets = new Map<string, Array<{ text: string; ink: Ink }>>();
  for (const rule of [...rules].sort((a, b) => b.text.length - a.text.length)) {
    if (!rule.text) continue;
    const key = rule.text[0];
    const list = buckets.get(key);
    if (list) list.push(rule);
    else buckets.set(key, [rule]);
  }
  return buckets;
}

const BASE_BUCKETS = ruleBuckets(NOTICE_RULES);
const SYSTEM_BUCKETS = ruleBuckets([...NOTICE_RULES, ...SYSTEM_RULES]);

/** `keepLead`: keep a leading "1." (card text), which a notice line drops. */
export function noticeParts(raw: string, system = false, keepLead = false, more?: InkAt): Array<{ text: string; ink?: Ink }> {
  const text = keepLead ? raw : raw.replace(/^\d+\.\s*/, "");
  const extra: Array<{ text: string; ink: Ink }> = [];
  for (const [id, chips] of Object.entries(MONSTER_CHIPS)) {
    for (const chip of chips) {
      const label = chipLabel(id, chip.key);
      if (label && label !== chip.label) extra.push({ text: label, ink: "skill" });
    }
  }
  const buckets = extra.length ? ruleBuckets([...NOTICE_RULES, ...extra, ...(system ? SYSTEM_RULES : [])]) : system ? SYSTEM_BUCKETS : BASE_BUCKETS;
  const out: Array<{ text: string; ink?: Ink }> = [];
  let index = 0;
  while (index < text.length) {
    const named = buckets.get(text[index])?.find((rule) => text.startsWith(rule.text, index));
    const own = more?.(text, index);
    const hit = own && (!named || own.text.length >= named.text.length) ? own : named;
    if (hit) {
      out.push({ text: hit.text, ink: hit.ink });
      index += hit.text.length;
      continue;
    }
    const mana = /^(?:Cầu ma lực|cầu ma lực|\d+\s*mana)/.exec(text.slice(index));
    if (mana) {
      out.push({ text: mana[0], ink: "mana" });
      index += mana[0].length;
      continue;
    }
    const dealt = /^gây \d+ máu/.exec(text.slice(index));
    if (dealt) {
      out.push({ text: dealt[0], ink: "atk" });
      index += dealt[0].length;
      continue;
    }
    const phys = /^\d+ sát thương vật lý/.exec(text.slice(index));
    if (phys) {
      out.push({ text: phys[0], ink: "phys" });
      index += phys[0].length;
      continue;
    }
    const spell = /^\d+ sát thương phép/.exec(text.slice(index));
    if (spell) {
      out.push({ text: spell[0], ink: "skill" });
      index += spell[0].length;
      continue;
    }
    const tru = /^\d+ sát thương chuẩn/.exec(text.slice(index));
    if (tru) {
      out.push({ text: tru[0], ink: "tru" });
      index += tru[0].length;
      continue;
    }
    const last = out.at(-1);
    if (last && !last.ink) last.text += text[index];
    else out.push({ text: text[index] });
    index += 1;
  }
  return out;
}

export function Painted({ text, system = false }: { text: string; system?: boolean }) {
  useLang();
  return (
    <>
      {noticeParts(text, system).map((part, index) =>
        part.ink ? (
          <b key={index} className={`ink-${part.ink}`}>
            {tr(part.text)}
          </b>
        ) : (
          <span key={index}>{tr(part.text)}</span>
        ),
      )}
    </>
  );
}
