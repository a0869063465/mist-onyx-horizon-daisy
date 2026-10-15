import type { FxAct, FxEvent, FxPack, FxSpot } from "@/lib/spectacle";

export type { FxAct, FxPack, FxSpot };

export type FxPart = "rune" | "pillar" | "band" | "shock" | "rays" | "debris" | "bang" | "slash";

export type FxPrefs = Record<FxAct, Partial<Record<FxSpot, FxPart[]>>>;

const KEY = "clash-fx-v2";
const KEY_M1 = "clash-fx-m1-v2";
const PACK_KEY = "clash-fx-pack";

export const PACK_PARTS: Record<FxPack, FxPart[]> = {
  now: ["rune", "pillar", "band", "shock", "rays", "debris", "bang", "slash"],
  m1: ["pillar", "shock", "debris", "slash"],
};

export const FX_PART_LABEL: Record<FxPart, string> = {
  rune: "Vòng phép",
  pillar: "Cột sáng",
  band: "Vòng 3D xoay",
  shock: "Vòng sóng",
  rays: "Tia",
  debris: "Mảnh vỡ",
  bang: "Nháy sáng",
  slash: "Nhát chém",
};

export const FX_SPOT_LABEL: Record<FxSpot, string> = {
  self: "Trên bản thân",
  target: "Trên mục tiêu",
  center: "Giữa bàn",
};

const summon = ["rune", "pillar", "band", "shock", "rays", "debris", "bang"] as FxPart[];
const hurt = ["debris", "shock", "rays", "bang"] as FxPart[];
const heal = ["rune", "pillar", "band", "debris"] as FxPart[];
const spellHit = ["debris", "shock", "rays", "bang", "rune", "pillar", "band"] as FxPart[];

export const FX_ACTIONS: { id: FxAct; title: string; spots: { id: FxSpot; parts: FxPart[] }[] }[] = [
  { id: "summon", title: "1. Triệu hồi", spots: [
    { id: "self", parts: summon },
    { id: "target", parts: summon },
  ]},
  { id: "attack", title: "2. Lao vào đánh", spots: [
    { id: "self", parts: ["slash"] },
    { id: "target", parts: ["debris", "shock", "band", "rays", "bang"] },
  ]},
  { id: "hurt", title: "3. Mất máu", spots: [
    { id: "self", parts: hurt },
    { id: "target", parts: hurt },
  ]},
  { id: "kill", title: "4. Hạ quái", spots: [
    { id: "self", parts: hurt },
    { id: "target", parts: hurt },
  ]},
  { id: "heal", title: "5. Hồi máu", spots: [
    { id: "self", parts: heal },
    { id: "target", parts: heal },
  ]},
  { id: "spell", title: "6. Phép", spots: [
    { id: "center", parts: ["rune", "pillar", "band", "shock", "rays", "debris", "bang"] },
    { id: "target", parts: [...spellHit, "slash"] },
  ]},
  { id: "healSpell", title: "7. Phép hồi", spots: [
    { id: "center", parts: ["rune", "pillar", "band", "debris"] },
    { id: "self", parts: heal },
    { id: "target", parts: heal },
  ]},
  { id: "shake", title: "8. Đòn trúng, rung bàn", spots: [
    { id: "center", parts: ["rune", "rays", "shock", "bang"] },
  ]},
  { id: "ailment", title: "9. Bất lợi kéo dài", spots: [
    { id: "self", parts: ["rune", "pillar", "shock", "debris", "band"] },
    { id: "target", parts: ["rune", "pillar", "shock", "debris", "band"] },
  ]},
];

const NOW_ON: FxPrefs = {
  summon: { self: [], target: [] },
  attack: { self: [], target: [] },
  hurt: { self: [], target: [] },
  kill: { self: [], target: [] },
  heal: { self: [], target: [] },
  spell: {
    center: [],
    target: ["shock", "rays"],
  },
  healSpell: { center: [], self: [], target: [] },
  shake: { center: [] },
  ailment: { self: [], target: [] },
};

const M1_ON: FxPrefs = {
  summon: { self: ["shock", "pillar"], target: ["pillar", "shock"] },
  attack: { self: ["slash"], target: [] },
  hurt: { self: [], target: [] },
  kill: { self: [], target: [] },
  heal: { self: ["pillar"], target: ["pillar"] },
  spell: { center: [], target: [] },
  healSpell: { center: [], self: ["pillar"], target: ["pillar"] },
  shake: { center: [] },
  ailment: { self: ["pillar"], target: ["pillar"] },
};

function fromTable(table: FxPrefs): FxPrefs {
  const prefs = {} as FxPrefs;
  for (const action of FX_ACTIONS) {
    prefs[action.id] = {};
    for (const spot of action.spots) {
      const chosen = table[action.id]?.[spot.id] ?? [];
      prefs[action.id][spot.id] = chosen.filter((part) => spot.parts.includes(part));
    }
  }
  return prefs;
}

export function defaultFxPrefs(pack: FxPack = "now"): FxPrefs {
  return fromTable(pack === "m1" ? M1_ON : NOW_ON);
}

export function loadActivePack(): FxPack {
  if (typeof localStorage === "undefined") return "now";
  return localStorage.getItem(PACK_KEY) === "m1" ? "m1" : "now";
}

const LOOK_KEY = "clash-fx-look-v2";

export type ActLook = { edit: FxPack; hide: Record<FxPack, boolean> };

export function defaultLooks(): Record<FxAct, ActLook> {
  const looks = {} as Record<FxAct, ActLook>;
  for (const action of FX_ACTIONS) {
    const edit = action.id === "summon" || action.id === "spell" ? "now" : "m1";
    looks[action.id] = { edit, hide: { now: false, m1: false } };
  }
  return looks;
}

export function loadLooks(): Record<FxAct, ActLook> {
  const looks = defaultLooks();
  if (typeof localStorage === "undefined") return looks;
  try {
    const raw = JSON.parse(localStorage.getItem(LOOK_KEY) ?? "null") as Partial<Record<FxAct, ActLook>> | null;
    if (!raw) return looks;
    for (const action of FX_ACTIONS) {
      const saved = raw[action.id];
      if (!saved) continue;
      looks[action.id] = {
        edit: saved.edit === "m1" ? "m1" : "now",
        hide: { now: Boolean(saved.hide?.now), m1: Boolean(saved.hide?.m1) },
      };
    }
  } catch {
    return defaultLooks();
  }
  return looks;
}

export function saveLooks(looks: Record<FxAct, ActLook>) {
  localStorage.setItem(LOOK_KEY, JSON.stringify(looks));
}

export function actPack(act: FxAct): FxPack {
  return loadLooks()[act]?.edit ?? "now";
}

export function loadFxPrefs(pack: FxPack = "now"): FxPrefs {
  const prefs = defaultFxPrefs(pack);
  if (typeof localStorage === "undefined") return prefs;
  const allow = new Set(PACK_PARTS[pack]);
  try {
    const raw = JSON.parse(localStorage.getItem(pack === "m1" ? KEY_M1 : KEY) ?? "null") as
      | Partial<Record<FxAct, FxPart[] | Partial<Record<FxSpot, FxPart[]>>>>
      | null;
    if (!raw) return prefs;
    for (const action of FX_ACTIONS) {
      const saved = raw[action.id];
      if (!saved) continue;
      if (Array.isArray(saved)) {
        for (const spot of action.spots) {
          prefs[action.id][spot.id] = saved.filter((part) => spot.parts.includes(part) && allow.has(part));
        }
        continue;
      }
      for (const spot of action.spots) {
        const list = saved[spot.id];
        if (!Array.isArray(list)) continue;
        prefs[action.id][spot.id] = list.filter((part): part is FxPart => spot.parts.includes(part) && allow.has(part));
      }
    }
  } catch {
    return defaultFxPrefs(pack);
  }
  return prefs;
}

export function saveFxPrefs(prefs: FxPrefs, pack: FxPack = "now") {
  localStorage.setItem(pack === "m1" ? KEY_M1 : KEY, JSON.stringify(prefs));
}

export function fxOn(pack: FxPack, act: FxAct, spot: FxSpot, part: FxPart) {
  return Boolean(loadFxPrefs(pack)[act][spot]?.includes(part));
}

export function ailmentHolds() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("clash-fx-ailment-hold") !== "0";
}

export function saveAilmentHold(on: boolean) {
  localStorage.setItem("clash-fx-ailment-hold", on ? "1" : "0");
}

export function fireBlastOn() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("clash-fx-fire") !== "0";
}

export function saveFireBlast(on: boolean) {
  localStorage.setItem("clash-fx-fire", on ? "1" : "0");
}

const TIDE_KEY = "clash-fx-tide";
export type TideRank = "small" | "mid" | "big";

export function tideOn(rank: TideRank) {
  if (typeof localStorage === "undefined") return true;
  const raw = localStorage.getItem(TIDE_KEY);
  if (raw == null) return true;
  return raw.split(",").includes(rank);
}

export function saveTide(rank: TideRank, on: boolean) {
  const all: TideRank[] = ["small", "mid", "big"];
  const next = all.filter((item) => (item === rank ? on : tideOn(item)));
  localStorage.setItem(TIDE_KEY, next.join(","));
}

export function exportFxText(pack: FxPack) {
  return JSON.stringify({ pack, effects: loadFxPrefs(pack) });
}

const YOU = { x: 32, y: 66 };
const FOE = { x: 53, y: 30 };
const MID = { x: 42, y: 44 };

export function previewOf(act: FxAct): FxEvent[] {
  if (act === "summon") {
    return [
      { t: "ring", act, spot: "self", ...YOU, color: "#ffb347", power: 1.15 },
      { t: "ring", act, spot: "target", ...FOE, color: "#ffb347", power: 1.15 },
    ];
  }
  if (act === "attack") return [{ t: "beam", act, x1: YOU.x, y1: YOU.y, x2: FOE.x, y2: FOE.y, color: "#ff8a00" }];
  if (act === "hurt") {
    return [
      { t: "burst", act, spot: "self", ...YOU, color: "#ff4d4d", power: 0.95 },
      { t: "burst", act, spot: "target", ...FOE, color: "#ff4d4d", power: 0.95 },
    ];
  }
  if (act === "kill") {
    return [
      { t: "burst", act, spot: "self", ...YOU, color: "#ffb020", power: 1.4 },
      { t: "burst", act, spot: "target", ...FOE, color: "#ffb020", power: 1.4 },
    ];
  }
  if (act === "heal") {
    return [
      { t: "ring", act, spot: "self", ...YOU, color: "#3ec6ff", power: 0.95 },
      { t: "ring", act, spot: "target", ...FOE, color: "#3ec6ff", power: 0.95 },
    ];
  }
  if (act === "spell") {
    return [
      { t: "ring", act, spot: "center", ...MID, color: "#ffd36a", power: 1.7 },
      { t: "burst", act, spot: "target", ...FOE, color: "#ff4d4d", power: 1.1 },
    ];
  }
  if (act === "healSpell") {
    return [
      { t: "ring", act, spot: "center", ...MID, color: "#7ee7ff", power: 1.7 },
      { t: "ring", act, spot: "self", ...YOU, color: "#3ec6ff", power: 0.95 },
      { t: "ring", act, spot: "target", ...FOE, color: "#3ec6ff", power: 0.95 },
    ];
  }
  if (act === "ailment") return [{ t: "ring", act, spot: "target", ...FOE, color: "#86e27a", power: 0.85 }];
  return [{ t: "shake", act: "shake", spot: "center", power: 1 }];
}
