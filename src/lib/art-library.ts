import { FORMS, MONSTERS, SPELLS, librarySrc } from "@/lib/catalog";

export type ArtShot = { key: string; src: string; label: string };

const KEPT: Array<[string, string]> = [
  ["kho-sau-non", "Kho Sâu non"],
  ["kho-ken-ngai", "Kho Kén ngài"],
  ["kho-chan-ken", "Kho Chân kén"],
  ["kho-ngai-khong-lo", "Kho Ngài Khổng lồ"],
  ["kho-ngai-nu-hoang", "Kho Ngài Nữ hoàng"],
  ["kho-ngai-toi-thuong", "Kho Ngài tối thượng"],
  ["kho-kraken", "Kho Kraken"],
  ["kho-sua", "Kho Sứa"],
  ["kho-hai-long", "Kho Hải long"],
  ["kho-phap-su-guong", "Kho Pháp sư gương"],
  ["kho-chien-rong", "Kho Chiến rồng"],
  ["kho-rong-xuong", "Kho Rồng xương"],
  ["kho-quai-dong-ho", "Kho Quái đồng hồ"],
  ["kho-tu-sat", "Kho Tủ sắt"],
  ["kho-rong-thep", "Kho Rồng thép"],
  ["kho-ke-dao-mo", "Kho Kẻ đào mộ"],
  ["kho-nguoi-may-vang", "Kho Người máy vàng"],
  ["kho-may-liem", "Kho Máy liềm"],
  ["kho-rong-con", "Kho Rồng con"],
  ["kho-hiep-si-gay", "Kho Hiệp sĩ gậy"],
  ["kho-nhen-may", "Kho Nhện máy"],
  ["kho-rong-sung", "Kho Rồng súng"],
  ["kho-ham-gai", "Kho Hàm gai"],
  ["kho-hoa-an-thit", "Kho Hoa ăn thịt"],
  ["kho-tien-giap", "Kho Tiên giáp"],
  ["kho-canh-hong", "Kho Cánh hồng"],
  ["kho-rong-xich", "Kho Rồng xích"],
  ["kho-canh-lam", "Kho Cánh lam"],
  ["kho-canh-trang", "Kho Cánh trắng"],
];

const HIDDEN_KEY = "clash-hidden-art";

function hiddenArts(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(raw) ? raw.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export function hideArt(key: string) {
  const next = hiddenArts();
  next.add(key);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
}

function visible(shots: ArtShot[]): ArtShot[] {
  const hidden = hiddenArts();
  return shots.filter((shot) => !hidden.has(shot.key));
}

export function monsterArts(): ArtShot[] {
  const shots = [...MONSTERS, ...FORMS].flatMap((card) =>
    card.art ? [{ key: `monster:${card.art}`, src: librarySrc(`monster:${card.art}`), label: card.name }] : [],
  );
  shots.push({ key: "monster:te-giac-3", src: librarySrc("monster:te-giac-3"), label: "Tê giác cấp 3" });
  for (const [art, label] of KEPT) shots.push({ key: `monster:${art}`, src: librarySrc(`monster:${art}`), label });
  return visible(shots);
}

export function spellArts(): ArtShot[] {
  return visible(
    SPELLS.map((card) => ({
      key: `spell:${card.id}`,
      src: librarySrc(`spell:${card.id}`),
      label: card.name,
    })),
  );
}

export function defaultMonsterPicture(art: string) {
  return `monster:${art}`;
}

export function defaultSpellPicture(id: string) {
  return `spell:${id}`;
}
