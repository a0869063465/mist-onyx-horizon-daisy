export type FxAct = "summon" | "attack" | "hurt" | "kill" | "heal" | "spell" | "healSpell" | "shake" | "ailment";
export type FxSpot = "self" | "target" | "center";
export type FxPack = "now" | "m1";

export type FxEvent =
  | { t: "burst"; act: FxAct; spot: FxSpot; x: number; y: number; color: string; power: number; pack?: FxPack; card?: string }
  | { t: "ring"; act: FxAct; spot: FxSpot; x: number; y: number; color: string; power: number; pack?: FxPack; card?: string }
  | { t: "beam"; act: "attack"; x1: number; y1: number; x2: number; y2: number; color: string; pack?: FxPack; card?: string }
  | { t: "shake"; act: "shake"; spot: "center"; power: number; pack?: FxPack }
  | { t: "ailments"; act: "ailment"; pack?: FxPack; marks: { id: string; x: number; y: number; spot: "self" | "target" }[] }
  | { t: "fire"; x: number; y: number; pack?: FxPack }
  /** Hồi máu thật (máu hiện tại hồi lại): video hồi máu xanh lục, chủ game 06/11. */
  | { t: "heal"; act: "heal"; spot: FxSpot; x: number; y: number; pack?: FxPack }
  /** Buff chỉ số (công, thủ, thủ phép, máu tối đa), KHÔNG phải hồi phục: video vòng cam, chủ game 26/11. */
  | { t: "buff"; act: "buff"; spot: FxSpot; x: number; y: number; pack?: FxPack }
  | { t: "bolt"; rank: "small" | "big"; x: number; y: number; self?: boolean; pack?: FxPack }
  | { t: "laser"; x1: number; y1: number; x2: number; y2: number; pack?: FxPack }
  | { t: "tide"; rank: "small" | "mid" | "big" | "rage"; x: number; y: number; pack?: FxPack }
  | { t: "shield"; kind: "phys" | "spell"; x: number; y: number; pack?: FxPack }
  /** A monster arriving on a slot in a summoning circle (always played, whatever the effect style):
   * blood = sacrifice summon, holy = summon, fuse = fused monster. */
  | { t: "rite"; x: number; y: number; kind?: "blood" | "holy" | "fuse"; pack?: FxPack }
  /** A normal attack landing on a player (chủ game 22/10, LoR's nexus hit): an electric dome where the attacker hits
   *  the edge of the field (bulging away from it, dir -1 up / 1 down), then white lightning running along the path
   *  to the player's HP. Always played. */
  | { t: "zap"; x: number; y: number; dir: -1 | 1; path: Array<[number, number]>; pack?: FxPack }
  /** Two monsters colliding: an attack on a monster, or a blocker taking the hit (chủ game 22/10). Always played. */
  | { t: "clash"; x: number; y: number; /** A ramming blow (chủ game 14/11): the way the attacker came, in radians on the screen. */ ang: number; pack?: FxPack }
  /** K2 (chủ game 14/11): a monster rousing as its skill goes off, before the skill's own effect: light gathers on its
   *  card, then bursts out toward the target (`ang`, radians on the screen). Always played. */
  | { t: "rouse"; x: number; y: number; color: string; ang?: number; pack?: FxPack }
  /** Chủ game 16/11: quái vừa lên hàng chờ phản ứng với kỹ năng: phát quang một lần quanh lá (video + âm của chủ game). `w` = bề ngang lá, % bàn. */
  | { t: "flare"; x: number; y: number; w: number; pack?: FxPack }
  /** Chủ game 21/11: Kuriboh phát nổ giữa hai lá lúc chạm (video 512×512, tâm nổ ở 50% / 52,7%). `w` = bề ngang khung video, % bàn. */
  | { t: "boom"; x: number; y: number; w: number; pack?: FxPack }
  /** Z4 (chủ game 27/11): khiên vỡ khi sát thương tới. Video 480×480 có lá ở giữa (lá 51,7% bề ngang khung). `w` = bề ngang lá, % bàn. */
  | { t: "aegis"; x: number; y: number; w: number; pack?: FxPack };

type Listener = (event: FxEvent) => void;
const listeners = new Set<Listener>();

export const LASER_MS = 2130;

export function emitFx(event: FxEvent) {
  for (const listener of listeners) listener(event);
}

export function subscribeFx(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
