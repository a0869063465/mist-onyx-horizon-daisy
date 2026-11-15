/**
 * Lịch sử trong trận (chủ game 12/11): gom `duel.events` thành vòng → khối → dòng để bảng Lịch sử vẽ bằng hình lá,
 * ký hiệu và số máu. Một khối = một việc và mọi đáp trả xen kẽ của hai bên (chặn, phép phản ứng, Trả đòn) cho tới khi
 * chuỗi xong. Chỉ đọc, không đổi trận.
 */
import type { Duel, Side } from "./duel";
import type { MatchEvent } from "./match-history";
import { SEA_KINDS } from "./env-kinds";

/** Một lá trong lịch sử. `veil`: back = lá úp (bài đối thủ rút), hidden = quái thú ẩn mình, hat = dưới Mũ ma pháp. */
export type LogCard = { side: Side; id: string | null; uid: string | null; veil: "none" | "back" | "hidden" | "hat" };

export type LogHit = {
  side: Side;
  /** null = đánh vào người chơi. */
  card: LogCard | null;
  dealt: number;
  before: number;
  after: number;
  dead: boolean;
  blocked: boolean;
  reflect: boolean;
  delayed: boolean;
  /** Quái rời sân mà không phải bị hạ (Thu hồi quái thú thu về bộ bài). */
  away?: boolean;
};

export type LogAct = "draw" | "summon" | "fuse" | "attack" | "counter" | "skill" | "spell" | "block" | "cover" | "wall" | "reel" | "upkeep" | "effect" | "concede" | "win";

export type LogTarget = { face: true; side: Side } | { face: false; card: LogCard };

export type LogLine = {
  key: string;
  act: LogAct;
  side: Side;
  card: LogCard | null;
  /** Kỹ năng thứ mấy của quái (ván cũ không ghi: null). */
  skill: number | null;
  target: LogTarget | null;
  hits: LogHit[];
  /** Dòng đáp trả trong khối (không phải việc mở đầu). */
  reply: boolean;
};

export type LogBlock = { key: string; lines: LogLine[] };

export type LogRound = {
  key: string;
  /** Vòng (Duel.clock); null với ván cũ chưa ghi vòng. */
  clock: number | null;
  /** Bên giữ token tấn công của vòng. */
  token: Side | null;
  /** Máu hai bên lúc vào vòng. */
  hp: [number, number];
  blocks: LogBlock[];
};

const SEA = new Set(SEA_KINDS);
const SHOWN: Partial<Record<MatchEvent["kind"], LogAct>> = {
  draw: "draw",
  summon: "summon",
  fuse: "fuse",
  "attack-monster": "attack",
  "attack-face": "attack",
  skill: "skill",
  spell: "spell",
  block: "block",
  cover: "cover",
  wall: "wall",
  reel: "reel",
  upkeep: "upkeep",
  concede: "concede",
  win: "win",
};

function sideOfUid(uid: string | null, fallback: Side): Side {
  if (uid?.startsWith("0-")) return 0;
  if (uid?.startsWith("1-")) return 1;
  return fallback;
}

/** How the viewer may see this card now: a hidden sea monster and a monster under the hats stay unnamed while they
 *  are still on the other side's field (the same rule the notices follow). */
function seen(duel: Duel, viewer: Side, side: Side, id: string | null, uid: string | null): LogCard {
  if (!id) return { side, id: null, uid, veil: "hidden" };
  if (side === viewer || id === "mu") return { side, id, uid, veil: "none" };
  const owner = duel.players[side];
  const mons = owner.field.filter((mon) => mon && (uid ? mon.uid === uid : mon.cardId === id));
  if (mons.length === 0) return { side, id, uid, veil: "none" };
  if (owner.hats) return { side, id: null, uid, veil: "hat" };
  if (owner.sea && SEA.has(id) && mons.some((mon) => mon && !mon.shown && !mon.cage)) return { side, id: null, uid, veil: "hidden" };
  if (mons.some((mon) => mon?.lurk)) return { side, id: null, uid, veil: "hidden" };
  return { side, id, uid, veil: "none" };
}

function waits(event: MatchEvent): boolean {
  if (typeof event.wait === "boolean") return event.wait;
  return event.kind === "attack-monster" || event.kind === "attack-face" || event.kind === "block" || event.kind === "cover" || event.kind === "wall";
}

export function buildLog(duel: Duel, viewer: Side): LogRound[] {
  const events = (duel.events ?? []).filter((row) => row.ok);
  const rounds: LogRound[] = [];
  let round: LogRound | null = null;
  let block: LogBlock | null = null;
  let prev: MatchEvent | null = null;
  let prevAct: MatchEvent | null = null;
  let hp: [number, number] = events[0] ? [Math.max(events[0].hp[0], 0), Math.max(events[0].hp[1], 0)] : [0, 0];
  const other = (side: Side): Side => (side === 0 ? 1 : 0);

  const openRound = (event: MatchEvent) => {
    round = { key: `r${rounds.length}`, clock: event.clock ?? null, token: event.token ?? null, hp, blocks: [] };
    rounds.push(round);
    block = null;
  };

  for (const event of events) {
    const clock = event.clock ?? null;
    if (!round || (clock !== null && clock !== (round as LogRound).clock)) openRound(event);
    const now = round as unknown as LogRound;

    if (event.kind === "result") {
      const note = event.hit;
      if (note) {
        const hit: LogHit = {
          side: note.who,
          card: note.to === "face" ? null : seen(duel, viewer, note.who, note.cardId, note.uid),
          dealt: note.dealt,
          before: note.before,
          after: Math.max(note.after, 0),
          dead: note.to === "monster" && note.after <= 0,
          blocked: note.blocked && note.dealt <= 0,
          reflect: note.reflect,
          delayed: note.delayed,
        };
        const lines: LogLine[] = (block as LogBlock | null)?.lines ?? [];
        const owner = lines.find((line) => line.key === event.cause);
        if (owner) {
          // Thu hồi quái thú thu quái về bộ bài: quái rời sân nhưng không phải bị hạ, không mất máu.
          if (owner.act === "spell" && owner.card?.id === "thu-hoi-quai-thu" && hit.card) owner.hits.push({ ...hit, dealt: 0, dead: false, away: true });
          else owner.hits.push(hit);
        }
        else {
          // Sát thương không thuộc việc nào đang mở (hiệu ứng đầu vòng, nợ sát thương, môi trường…): một dòng riêng.
          const last: LogBlock | undefined = now.blocks[now.blocks.length - 1];
          if (last && last === block && last.lines.length === 1 && last.lines[0].act === "effect" && prev?.kind === "result") last.lines[0].hits.push(hit);
          else {
            block = { key: `b${event.id}`, lines: [{ key: `fx-${event.id}`, act: "effect", side: other(note.who), card: null, skill: null, target: null, hits: [hit], reply: false }] };
            now.blocks.push(block);
          }
        }
      }
    } else {
      const act = SHOWN[event.kind];
      if (act) {
        const head: LogLine | undefined = (block as LogBlock | null)?.lines[0];
        const joins = Boolean(block && head && head.act !== "effect" && prev && waits(prev));
        // Trả đòn do máy tự đánh: nằm ngay sau lần bỏ qua khép chuỗi, nhắm lại kẻ vừa ra đòn.
        const strikesBack =
          !joins &&
          Boolean(head) &&
          prevAct?.kind === "pass" &&
          (event.kind === "attack-monster" || event.kind === "skill") &&
          event.actor !== head!.side &&
          (head!.act === "attack" || head!.act === "skill") &&
          event.target?.kind === "monster" &&
          event.target.cardId !== null &&
          event.target.cardId === head!.card?.id;
        const target: LogTarget | null =
          event.target?.kind === "face"
            ? { face: true, side: other(event.actor) }
            : event.target?.kind === "monster"
              ? { face: false, card: seen(duel, viewer, sideOfUid(event.target.uid, other(event.actor)), event.target.cardId, event.target.uid) }
              : null;
        const card: LogCard | null =
          event.kind === "draw"
            ? event.actor === viewer
              ? { side: event.actor, id: event.cardId, uid: null, veil: event.cardId ? "none" : "back" }
              : { side: event.actor, id: null, uid: null, veil: "back" }
            : event.kind === "win" || event.kind === "concede"
              ? null
              : seen(duel, viewer, event.actor, event.cardId, null);
        const line: LogLine = {
          key: event.id,
          act: strikesBack && act === "attack" ? "counter" : joins && act === "attack" && head && event.actor !== head.side && event.kind === "attack-monster" ? "counter" : act,
          side: event.actor,
          card,
          skill: event.kind === "skill" ? (event.skill ?? null) : null,
          target,
          hits: [],
          reply: joins || strikesBack,
        };
        if ((joins || strikesBack) && block) (block as LogBlock).lines.push(line);
        else {
          block = { key: `b${event.id}`, lines: [line] };
          now.blocks.push(block);
        }
      }
      prevAct = event;
    }
    prev = event;
    hp = [Math.max(event.hp[0], 0), Math.max(event.hp[1], 0)];
  }
  return rounds.filter((item) => item.blocks.length > 0);
}
