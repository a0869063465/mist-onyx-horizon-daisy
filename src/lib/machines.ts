import { monsterCard } from "./catalog.ts";
import type { Duel, DuelFace } from "./duel.ts";
import { ENV_KINDS } from "./env-kinds.ts";
import { PACK } from "./shop.ts";

/**
 * The computer's own decks for Vs Máy (chủ game 22/10). Later each machine has a theme and its own pack; for now there
 * is one, máy chung: the old Lv 1 Meta deck with Máy chém in place of Ma đạo sĩ, Sấm sét tận thế left out and Thảo
 * nguyên as its environment, all real cards. Winning against the same machine 3 times gives a card of its pack.
 */
export type Machine = { id: string; monsters: string[]; spells: string[]; pack: string };

export const MACHINES: Machine[] = [
  {
    id: "may-chung",
    monsters: [
      "khong-lo-mot-mat",
      "phu-thuy-ti-hon",
      "quai-thu-thien-su",
      "rong-con",
      "thien-than-be-nho",
      "hiep-si-cua-vua",
      "hiep-si-ho-ve",
      "kazura",
      "kizuran",
      "my-dieu-nhan",
      "chien-binh-rong",
      "may-chem",
      "may-nem-bom-hinh-nhen",
      "thuong-quan-long",
      "hiep-si-cua-hau",
    ],
    spells: [
      "giap-co-khi",
      "la-chan-phan-don",
      "phuc-kich",
      "guong-phong-ho",
      "ke-dao-mo",
      "soi-xich-dia-nguc",
      "virus-an-mon",
      "hoan-doi",
      "thao-nguyen",
    ],
    pack: PACK.id,
  },
];

export const MACHINE = MACHINES[0];

export function machineOf(id: string | null | undefined): Machine | null {
  return MACHINES.find((machine) => machine.id === id) ?? null;
}

/** The name each kind of monster goes by (the groups of ENV_KINDS). */
const KIND_NAMES: Record<string, string> = {
  "bien-sau": "Quái biển",
  "thao-nguyen": "Chiến binh",
  "dat-da": "Đất đá",
  nui: "Rồng và chim",
  "rung-ram": "Thú rừng",
  "cu-dia-may-moc": "Máy móc",
  "nui-dung-nham": "Hệ lửa",
  "thanh-dia-thien-su": "Thiên sứ",
  "bong-toi": "Bóng tối",
};

/** The machine's deck goes by its biggest group of monsters (chủ game 22/10: máy chung is "Chiến binh"). */
export function machineGroup(machine: Machine): string {
  let best = "";
  let most = 0;
  for (const [env, ids] of Object.entries(ENV_KINDS)) {
    const count = machine.monsters.filter((id) => ids.includes(id)).length;
    if (count > most && KIND_NAMES[env]) {
      best = KIND_NAMES[env];
      most = count;
    }
  }
  return best || "Máy";
}

/** Its champion on the VS screen: the monster with the most stars (Thương quản long for máy chung). */
export function machineChampion(machine: Machine): string | null {
  let best: string | null = null;
  let stars = -1;
  for (const id of machine.monsters) {
    const card = monsterCard(id);
    if (card && card.stars > stars) {
      best = id;
      stars = card.stars;
    }
  }
  return best;
}

/** The machine's name for one match (chủ game 22/10: a Japanese name, picked at random). */
const NAMES = [
  "Haruto",
  "Sota",
  "Ren",
  "Yuto",
  "Kaito",
  "Riku",
  "Takumi",
  "Daiki",
  "Kenta",
  "Hiroshi",
  "Akira",
  "Sakura",
  "Yui",
  "Hina",
  "Aoi",
  "Rin",
  "Mei",
  "Yuna",
  "Akane",
  "Kaede",
];

export function machineFace(machine: Machine, rng: () => number = Math.random): DuelFace {
  return { name: NAMES[Math.floor(rng() * NAMES.length)], deck: machineGroup(machine), cover: machineChampion(machine) };
}

/** Marks a new Vs Máy match as played against this machine. */
export function withMachine(duel: Duel, machine: Machine, you: DuelFace): Duel {
  return { ...duel, machine: machine.id, faces: [you, machineFace(machine)] };
}
