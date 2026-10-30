import { monsterCard, spellCard } from "@/lib/catalog";
import { plainCopy } from "@/lib/copy-mark";
import {
  ageMon,
  bulletRamp,
  buffMon,
  favorShots,
  hellFigures,
  liveAtk,
  queenSwing,
  skillLoss,
  type Duel,
  type FieldMon,
  type Side,
} from "@/lib/duel";

/**
 * Kết quả của icon phản ứng (chủ game 23/10, T3): a tap on a skill's or a spell's icon shows its name, then what it
 * does, one result a line, with the numbers it carries now (the blow before the target's defence: Núi's bonus, the
 * curse of Phù thuỷ rừng đen and Vòng nguyền rủa ác ma counted). What is paid for it (mana, HP) is left out. What is not
 * known yet (which barrels fire, where the bombs fall) shows what is sure, and what came of it once it has fired.
 */
export type SkillAt = {
  duel: Duel;
  cardId: string;
  /** The skill's name on the sheet. */
  name: string;
  /** The caster as it stands now (null once it has gone). */
  mon: FieldMon | null;
  /** The monster aimed at, if one. */
  target: FieldMon | null;
  /** The notice as it fired, once it has. */
  result?: string;
  /** The part picked as it was cast (Thiên thần hộ mệnh's kind of shield). */
  extra?: string | null;
};

type Pack = { phys: number; spell: number; tru: number };

const text = (cardId: string) => plainCopy(monsterCard(cardId)?.skill ?? "");
const num = (source: string, pattern: RegExp, fallback: number, at = 0) => {
  const found = [...source.matchAll(new RegExp(pattern.source, "gi"))].map((hit) => Number(hit[1]));
  return found[at] ?? fallback;
};

/** The blow as it leaves the caster: +Núi on its spell part, less the black witch's curse (3, spell first), halved
 *  under Vòng nguyền rủa ác ma. */
function blow(mon: FieldMon | null, pack: Pack, plus = true): Pack {
  if (!mon) return pack;
  const out = { ...pack, spell: pack.spell + (plus ? mon.skillUp ?? 0 : 0) };
  let hex = mon.hex && mon.hex.left > 0 ? 3 : 0;
  for (const key of ["spell", "phys", "tru"] as const) {
    const cut = Math.min(Math.max(0, out[key]), hex);
    hex -= cut;
    out[key] -= cut;
  }
  const half = (n: number) => Math.max(0, mon.curse ? Math.floor(n / 2) : n);
  return { phys: half(out.phys), spell: half(out.spell), tru: half(out.tru) };
}

/** "Gây 2 sát thương chuẩn và 1 sát thương phép". */
function deal(pack: Pack, tail = ""): string {
  const parts = [
    pack.phys > 0 ? `${pack.phys} sát thương vật lý` : "",
    pack.spell > 0 ? `${pack.spell} sát thương phép` : "",
    pack.tru > 0 ? `${pack.tru} sát thương chuẩn` : "",
  ].filter(Boolean);
  if (parts.length === 0) return `Gây 0 sát thương${tail}`;
  const said = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} và ${parts[parts.length - 1]}`;
  return `Gây ${said}${tail}`;
}

const spellOnly = (n: number): Pack => ({ phys: 0, spell: n, tru: 0 });

/** What came of a skill whose outcome is random: its notice as it fired. */
function came(result: string | undefined): string[] {
  return result ? [result.replace(/^\d+\.\s*/, "").replace(/[.\s]+$/, "").trim()] : [];
}

/** A stat change as the sheet reads it: "-4 công, -1 thủ, -2 máu". */
function change(before: FieldMon, after: FieldMon): string {
  const rows: Array<[number, string]> = [
    [after.atk - before.atk, "công"],
    [after.def - before.def, "thủ"],
    [after.mdef - before.mdef, "thủ phép"],
    [after.hp - before.hp, "máu"],
  ];
  return rows
    .filter(([n]) => n !== 0)
    .map(([n, what]) => `${n > 0 ? "+" : ""}${n} ${what}`)
    .join(", ");
}

function harpy(name: string, t: string, target: FieldMon | null): string[] {
  const who = target ? monsterCard(target.cardId)?.name ?? "1 quái địch" : "1 quái địch";
  switch (name) {
    case "Thổi bay":
      return ["Huỷ 1 lá phép ngẫu nhiên trên tay đối thủ"];
    case "Mê hoặc":
      return [`${who} đánh thường vào ta`, "Quái đó không thể hành động ở lượt sau"];
    case "Dụ dỗ":
      return [`${who} đánh thường vào 1 quái của ta`];
    case "Gió xoáy":
      return ["Thổi bay 1 phép ngẫu nhiên của địch", "Lượt sau đối thủ không được rút bài"];
    case "Roi sấm":
      return ["Đòn đánh kế tiếp thành sát thương phép"];
    case "Roi điện": {
      const lash = t.slice(Math.max(0, t.indexOf("Roi điện")));
      return ["Né đòn", `+${num(lash, /tăng vĩnh viễn\s*(\d+)\s*công/, 3)} công vĩnh viễn`, `Trả ${num(lash, /trả\s*(\d+)\s*sát thương phép/, 5)} sát thương phép`];
    }
  }
  return [];
}

function lines(at: SkillAt): string[] {
  const { duel, cardId, name, mon, target } = at;
  const t = text(cardId);
  const side: Side | null = mon ? (duel.players[0].field.some((unit) => unit?.uid === mon.uid) ? 0 : 1) : null;
  switch (cardId) {
    case "rong-phun-hoa-cau":
      if (name !== "Hoả cầu") return [];
      return [...(target ? [`Giảm ${skillLoss(cardId, "mdef", 1)} thủ phép`] : []), deal(blow(mon, spellOnly(num(t, /gây\s*(\d+)\s*sát thương phép/, 3))))];
    case "rong-con":
    case "rong-ngan-tuoi":
      return [deal(blow(mon, { phys: 0, spell: num(t, /(\d+)\s*sát thương phép/, 1), tru: num(t, /(\d+)\s*sát thương chuẩn/, 2) }))];
    case "kiem-si-lua-thieng":
      if (name === "Truy cùng diệt tận") return [deal(blow(mon, spellOnly(num(t, /gây thêm\s*(\d+)\s*sát thương phép/, 4)))).replace("Gây", "Gây thêm")];
      if (name === "Hoả thần long") return [deal(blow(mon, { phys: 0, spell: num(t, /gây\s*(\d+)\s*sát thương phép và/, 4), tru: num(t, /và\s*(\d+)\s*sát thương chuẩn/, 2) }))];
      return [deal(blow(mon, spellOnly(num(t, /gây\s*(\d+)\s*sát thương phép/, 4))))];
    case "trieu-hoi-ac-ma": {
      const wet = (target?.wet ?? 0) > 0;
      const base = num(t, /gây\s*(\d+)\s*sát thương phép/, 5) + (wet ? num(t, /nhận thêm\s*(\d+)/, 2) : 0);
      return [deal(blow(mon, spellOnly(base))), ...(wet ? ["Lan sang kẻ địch khác đang ẩm ướt"] : [])];
    }
    case "ong-khong-lo":
      return [`Tê liệt ${num(t, /(\d+)\s*lượt/, 5)} lượt`];
    case "mo-voi-ma-mut":
      return [`Hy sinh và ${deal(blow(mon, spellOnly(mon?.hp ?? 0), false)).replace("Gây", "gây")}`, `Bào mòn ${num(t, /với\s*(\d+)\s*sát thương chuẩn/, 1)} sát thương chuẩn mỗi lượt`];
    case "ga-he-dang-so": {
      const charge = mon?.charge ?? 2;
      const amount = num(t, /gây\s*(\d+)\s*sát thương/, 6) + num(t, /gây thêm\s*(\d+)\s*sát thương/, 4) * Math.floor(Math.max(0, charge - 2) / 2);
      return [deal(blow(mon, spellOnly(amount)))];
    }
    case "cuc-bong-ma-quai":
      return name === "Phát nổ" && mon ? ["Tự huỷ", deal(blow(mon, spellOnly(liveAtk(mon)), false))] : [];
    case "phu-thuy-ti-hon":
      return [deal(blow(mon, spellOnly(Math.max(0, 3 + (side === null ? 0 : duel.players[side].stars) - (mon?.fake ? 1 : 0)))))];
    case "trai-tim-hai-long": {
      const step = name === "Đại hồng thuỷ huỷ diệt" ? 2 : name === "Con nước lớn tàn phá" ? 1 : 0;
      const pack = blow(mon, spellOnly(num(t, /gây\s*(\d+)\s*sát thương phép/, [4, 5, 6][step], step)));
      return step === 2 ? [deal(pack, " lên tất cả kẻ địch")] : step === 1 ? [deal(pack), "Thêm 1 kẻ địch ngẫu nhiên"] : [deal(pack)];
    }
    case "sua-hut-ma-phap":
      return [deal(blow(mon, spellOnly(num(t, /gây\s*(\d+)\s*cộng/, 3) + (mon?.stored ?? 0))))];
    case "con-thinh-no-cua-hai-vuong":
      return [deal(blow(mon, spellOnly(2 + 3 * (mon?.stored ?? 0))))];
    case "phu-thuy-thoi-gian": {
      if (name === "Dòng chảy thời gian") return ["Lão hoá lên tất cả quái trên sân"];
      if (!target) return [];
      const ally = side !== null && duel.players[side].field.some((unit) => unit?.uid === target.uid);
      const shift = change(target, ally ? buffMon(target) : ageMon(target));
      return shift ? [shift] : [];
    }
    case "yeu-tinh-chuc-phuc":
      if (name !== "Hỗ công") return [];
      return [`Đòn kế tiếp +${num(t, /tăng\s*(\d+)\s*công/, 3)} công, +${num(t, /\+(\d+)\s*thủ/, 1)} thủ và ${num(t, /(\d+)\s*sát thương phép/, 3)} sát thương phép`];
    case "mat-xanh-huy-diet":
      return mon ? [deal({ phys: 0, spell: 0, tru: liveAtk(mon) })] : [];
    case "mat-do-tan-pha":
    case "rong-ac-ma": {
      const figures = hellFigures(cardId);
      return [deal(blow(mon, { phys: figures.phys, spell: figures.spell, tru: figures.tru }))];
    }
    case "hoa-an-thit-nguoi": {
      const bite = num(t, /cướp\s*(\d+)\s*máu tối đa/, 2);
      return [`Cướp ${target ? Math.min(bite, target.hp) : bite} máu tối đa`];
    }
    case "thuong-quan-long":
      return at.result ? came(at.result) : [`3 nòng, mỗi nòng ${num(t, /(\d+)%/, 45)}% nổ`];
    case "may-nem-bom-hinh-nhen":
      return at.result ? came(at.result) : [`${num(t, /mưa bom\s*(\d+)\s*quả/, 5)} quả bom, mỗi quả ${num(t, /mỗi quả\s*(\d+)/, 1) + (mon?.skillUp ?? 0)} sát thương chuẩn`];
    case "may-quay-thuong":
      return name === "Con bạc nổi giận" ? [deal(blow(mon, spellOnly((mon?.misses ?? 0) + 3)))] : [];
    case "ma-dao-si": {
      const shots = mon ? favorShots(mon, bulletRamp(t).map((n) => ({ kind: "spell" as const, n }))).map((shot) => blow(mon, spellOnly(shot.n), false).spell) : bulletRamp(t);
      return [`Bắn ${shots.length} phát: ${shots.join(", ")} sát thương phép`];
    }
    case "loi-nguyen-cua-rong": {
      const each = blow(mon, { phys: 0, spell: 0, tru: num(t, /(\d+)\s*sát thương chuẩn/, 2) }, false).tru;
      const plus = mon?.skillUp ?? 0;
      return [`Gây ${each} sát thương chuẩn lên mọi quái địch`, ...(plus > 0 ? [`Mục tiêu chọn chịu thêm ${plus}`] : [])];
    }
    case "thien-than-be-nho":
      if (name !== "Thiên thần hộ mệnh") return ["Quái đồng minh đỡ đòn hộ"];
      return [at.extra === "spell" ? "Tạo 1 khiên phép" : at.extra === "phys" ? "Tạo 1 khiên vật lý" : "Tạo 1 khiên vật lý hoặc 1 khiên phép"];
    case "phu-thuy-rung-den":
      return [
        `-${num(t, /-(\d+)\s*công/, 3)} công, -${num(t, /-(\d+)\s*sát thương kỹ năng/, 3)} sát thương kỹ năng`,
        `-${num(t, /-(\d+)\s*thủ(?!\s*phép)/, 2)} thủ, -${num(t, /-(\d+)\s*thủ phép/, 2)} thủ phép`,
        `Trong ${num(t, /trong\s*(\d+)\s*lượt/, 6)} lượt`,
      ];
    case "hiep-si-cua-hau":
      return name === "Kiếm phép" && mon ? [deal(blow(mon, queenSwing(mon).pack))] : [];
    case "my-dieu-nhan":
    case "nu-chua-dieu-nhan":
    case "nu-chua-dieu-nhan-hoan-my":
      return harpy(name, t, target);
    case "chien-si-gam-nham":
      return ["Gấp đôi phòng ngự", `+${num(t, /thêm\s*(\d+)\s*máu tối đa/, 2)} máu tối đa`];
    case "ngai-khong-lo":
    case "ngai-nu-hoang":
    case "ngai-hoan-my": {
      const pack = blow(mon, spellOnly(num(t, /gây\s*(\d+)\s*sát thương phép/, 4)));
      const poison =
        cardId === "ngai-khong-lo"
          ? `Độc ${num(t, /chịu\s*(\d+)\s*sát thương chuẩn/, 1)} sát thương chuẩn mỗi lượt, ${num(t, /kéo dài\s*(\d+)\s*lượt/, 3)} lượt`
          : cardId === "ngai-nu-hoang"
            ? `Độc ${num(t, /độc trong\s*(\d+)\s*lượt/, 5)} lượt`
            : "Độc vĩnh viễn";
      return [deal(pack, " lên tất cả quái địch"), poison];
    }
  }
  return [];
}

const sentence = (row: string) => `${row.charAt(0).toUpperCase()}${row.slice(1)}${/[.!?]$/.test(row) ? "" : "."}`;

/** A skill's icon: its name, then its results a line each. */
export function skillBrief(at: SkillAt): string {
  return [at.name, ...lines(at).map(sentence)].join("\n");
}

/** A spell's icon: its name, then its results. `rebound`: Giáp cơ khí threw the skill back. */
export function spellBrief(duel: Duel, spellId: string, owner: Side, rebound = false): string {
  const card = spellCard(spellId);
  if (!card) return "";
  const e = plainCopy(card.effect);
  const rows = ((): string[] => {
    switch (spellId) {
      case "soi-xich-dia-nguc":
        return [`Khống chế ${num(e, /trong\s*(\d+)\s*lượt/, 2)} lượt`, "Phòng ngự về 0"];
      case "thanh-guom-anh-sang":
        return [`Quái đối phương không tấn công được ${num(e, /trong\s*(\d+)\s*lượt/, 5)} lượt`, "Quái ẩn mình hiện hình"];
      case "sam-set-tan-the":
        return [`Gây ${num(e, /Gây\s*(\d+)/, 2) + duel.players[owner].stars} sát thương chuẩn lên tất cả quái địch`];
      case "mu-ma-phap":
        return ["Mũ che sân, đối phương chỉ thấy mũ"];
      case "phan-nguyen":
        return ["Chuyển trạng thái xấu sang quái đối thủ"];
      case "guong-phong-ho":
        return ["Chặn đòn giáp lá cà", "Cướp 1/2 mọi chỉ số quái đang tấn công"];
      case "la-chan-phan-don":
        return ["Phản kỹ năng sang 1 kẻ địch"];
      case "vong-nguyen-rua-ac-ma":
        return ["Chặn đòn", "Sát thương của quái đó còn một nửa, vĩnh viễn"];
      case "hap-thu-ma-phap":
        return ["Hấp thu lá phép đang thi triển"];
      case "phuc-kich":
        // Chủ game 29/10–30/10: it stops a skill; "Một đồng minh ra đòn".
        return ["Chặn kỹ năng", `Một đồng minh ra đòn (+${num(e, /tăng\s*(\d+)\s*công/, 2)} công)`];
      case "hoan-doi":
        return ["Đổi chỗ quái bị nhắm với quái khác"];
      case "vong-xoay-bao-ho":
        return ["Chặn đòn", "Đối thủ kết thúc lượt ngay"];
      case "ngan-chan-phong-ngu":
        return ["Quái đó không chặn, không che và không được che tới hết vòng"];
      case "virus-an-mon":
        return [`Mỗi lượt ăn mòn 1 quái từ ${num(e, /từ\s*(\d+)\s*sao/, 3)} sao của đối thủ`, `Gây ${num(e, /Gây\s*(\d+)\s*sát thương chuẩn/, 1)} sát thương chuẩn, gấp đôi nếu từ ${num(e, /nếu từ\s*(\d+)\s*sao/, 4)} sao`];
      case "co-may-thoi-gian":
        return [`Quái về trạng thái ${num(e, /đầu\s*(\d+)\s*lượt/, 3)} lượt trước`];
      case "giap-co-khi":
        return [`+${num(e, /Tăng\s*(\d+)\s*công/, 2)} công, +${num(e, /và\s*(\d+)\s*thủ phép/, 2)} thủ phép vĩnh viễn`, ...(rebound ? ["Phản đòn trở về"] : [])];
    }
    return [e.split("\n")[0]];
  })();
  return [card.name, ...rows.map(sentence)].join("\n");
}
