/**
 * Học lối chơi từ các ván AI đã xong. Chỉ đổi độ ưu tiên giữa nước hợp lệ.
 * Không đọc ván đang diễn ra, không tính hiệu ứng tự động là nước người chơi chọn.
 */

import { monsterCard } from "./catalog.ts";
import { loadMatchHistory, type MatchEvent } from "./match-history.ts";

export const ADAPT_MIN_GAMES = 4;
export const ADAPT_MIN_SAMPLES = 6;
export const ADAPT_CAP = 12;

export type LeanCounts = {
  face: number;
  monster: number;
  spell: number;
  skill: number;
  summon: number;
  end: number;
  spent: number;
  kept: number;
  lowStar: number;
  highStar: number;
  blocks: number;
  lets: number;
};

export type Lean = {
  ready: boolean;
  games: number;
  used: number;
  wins: number;
  losses: number;
  concedes: number;
  face: number;
  monster: number;
  spell: number;
  skill: number;
  summon: number;
  spend: number;
  lowStar: number;
  block: number;
  counts: LeanCounts;
};

export function emptyLean(): Lean {
  return {
    ready: false,
    games: 0,
    used: 0,
    wins: 0,
    losses: 0,
    concedes: 0,
    face: 0,
    monster: 0,
    spell: 0,
    skill: 0,
    summon: 0,
    spend: 0,
    lowStar: 0,
    block: 0,
    counts: { face: 0, monster: 0, spell: 0, skill: 0, summon: 0, end: 0, spent: 0, kept: 0, lowStar: 0, highStar: 0, blocks: 0, lets: 0 },
  };
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-ADAPT_CAP, Math.min(ADAPT_CAP, n));
}

function side(yes: number, no: number): number {
  const total = yes + no;
  if (total < ADAPT_MIN_SAMPLES) return 0;
  return clamp(((yes / total) - 0.5) * 2 * ADAPT_CAP);
}

function eventList(value: unknown): MatchEvent[] | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { mode?: unknown; winner?: unknown; events?: unknown };
  if (row.mode !== "ai") return null;
  if (row.winner !== 0 && row.winner !== 1 && row.winner !== null) return null;
  if (!Array.isArray(row.events)) return null;
  return row.events as MatchEvent[];
}

function chosen(event: MatchEvent): boolean {
  return event.actor === 0 && event.ok === true && event.auto !== true;
}

function showedMonster(event: MatchEvent): boolean {
  if (!event || event.ok !== true) return false;
  if (event.kind === "result") return event.hit?.to === "monster" && event.hit.who === 0;
  if (event.actor !== 0 || event.auto === true) return false;
  if (event.kind === "summon" || event.kind === "fuse") return true;
  return Boolean(event.cardId) && (event.kind === "attack-face" || event.kind === "attack-monster" || event.kind === "skill" || event.kind === "block" || event.kind === "wall" || event.kind === "cover");
}

function attackRow(event: MatchEvent): boolean {
  return (event.kind === "attack-face" || event.kind === "attack-monster") && event.ok === true && event.auto !== true;
}

function closesFace(attack: MatchEvent, event: MatchEvent): boolean {
  if (event.kind !== "result") return false;
  if (typeof attack.id === "string" && attack.id.length > 0) return event.cause === attack.id;
  return event.cause == null;
}

/** Một đòn vào người của đối thủ, rồi đúng lựa chọn của người chơi trước khi đòn đó kết thúc. */
function blockSamples(events: MatchEvent[]): { blocks: number; lets: number } {
  let blocks = 0;
  let lets = 0;
  for (let i = 0; i < events.length; i += 1) {
    const attack = events[i];
    if (!attack || attack.kind !== "attack-face" || attack.actor !== 1 || attack.ok !== true || attack.auto === true) continue;
    let decision: "block" | "let" | null = null;
    for (let j = i + 1; j < events.length; j += 1) {
      const event = events[j];
      if (!event || typeof event !== "object") continue;
      if (attackRow(event)) break;
      if (closesFace(attack, event)) break;
      if (event.auto === true || event.actor !== 0 || event.ok !== true) continue;
      if (event.kind === "wall" || event.kind === "cover") continue;
      if (event.kind === "block") {
        decision = "block";
        break;
      }
      if (event.kind === "pass") {
        decision = "let";
        break;
      }
    }
    if (decision === "block") blocks += 1;
    else if (decision === "let" && events.slice(0, i).some((event) => event && showedMonster(event))) lets += 1;
  }
  return { blocks, lets };
}

export function learnFrom(input: unknown): Lean {
  if (!Array.isArray(input)) return emptyLean();
  const lean = emptyLean();
  for (const item of input) {
    const events = eventList(item);
    if (!events) continue;
    const row = item as { winner: 0 | 1 | null };
    lean.games += 1;
    const gaveUp = events.some((event) => event && event.kind === "concede" && event.actor === 0 && event.ok === true);
    if (gaveUp) {
      lean.concedes += 1;
      continue;
    }
    if (row.winner === 0) lean.wins += 1;
    else if (row.winner === 1) lean.losses += 1;
    lean.used += 1;
    let previous: number | null = null;
    for (const event of events) {
      if (!event || typeof event !== "object") continue;
      const orb = Array.isArray(event.orb) ? event.orb[0] : null;
      if (chosen(event)) {
        if (event.kind === "attack-face") lean.counts.face += 1;
        else if (event.kind === "attack-monster") lean.counts.monster += 1;
        else if (event.kind === "spell") lean.counts.spell += 1;
        else if (event.kind === "skill") lean.counts.skill += 1;
        else if (event.kind === "summon") {
          lean.counts.summon += 1;
          const stars = typeof event.cardId === "string" ? monsterCard(event.cardId)?.stars : undefined;
          if (stars === 1) lean.counts.lowStar += 1;
          else if (typeof stars === "number") lean.counts.highStar += 1;
        } else if (event.kind === "end-turn") lean.counts.end += 1;
        if (typeof orb === "number" && previous !== null && orb < previous && (event.kind === "spell" || event.kind === "skill" || event.kind === "summon" || event.kind === "draw" || event.kind === "fuse")) {
          lean.counts.spent += 1;
        }
        if (event.kind === "end-turn" && typeof orb === "number" && orb >= 2) lean.counts.kept += 1;
      }
      if (typeof orb === "number") previous = orb;
    }
    const sampled = blockSamples(events);
    lean.counts.blocks += sampled.blocks;
    lean.counts.lets += sampled.lets;
  }
  if (lean.used < ADAPT_MIN_GAMES) return lean;
  lean.ready = true;
  lean.face = side(lean.counts.face, lean.counts.monster);
  lean.monster = side(lean.counts.monster, lean.counts.face);
  lean.spell = side(lean.counts.spell, lean.counts.skill);
  lean.skill = side(lean.counts.skill, lean.counts.spell);
  lean.summon = side(lean.counts.summon, lean.counts.end);
  lean.spend = side(lean.counts.spent, lean.counts.kept);
  lean.lowStar = side(lean.counts.lowStar, lean.counts.highStar);
  lean.block = side(lean.counts.blocks, lean.counts.lets);
  return lean;
}

export function readLean(): Lean {
  try {
    return learnFrom(loadMatchHistory());
  } catch {
    return emptyLean();
  }
}

export function tilt(score: number, weight: number): number {
  if (!Number.isFinite(score)) return score;
  return score + clamp(weight);
}

export function chooseSwing(canFace: boolean, canMonster: boolean, lean: Lean): "face" | "monster" | "default" {
  if (!lean.ready) return "default";
  if (canFace && lean.face > lean.monster && lean.face > 0) return "face";
  if (canMonster && lean.monster > lean.face && lean.monster > 0) return "monster";
  return "default";
}
