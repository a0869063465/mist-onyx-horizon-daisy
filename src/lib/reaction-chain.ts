import type { Duel, Pending, Side } from "./duel.ts";

/**
 * The reaction line's orbs (thanh phản ứng kiểu Runeterra, chủ game 21/10): one orb for what is waiting (an attack,
 * a skill, a slow spell) and one for each spell played to answer it. The rules do not change; the chain only
 * follows the duel from one state to the next. An orb points at what it acts on: a monster, a player, or another
 * orb (Hấp thụ ma pháp flows into the spell it swallows); an attack flows from the attacker to what it hits. Only the orb of what is still waiting stays lit; an orb
 * that has done its work dims and stays on the line until the line closes.
 */
export type FlowEnd = { uid: string } | { face: Side } | { orb: string };

export type ChainOrb = {
  id: string;
  kind: "attack" | "skill" | "spell";
  /** Who acts: the attacker's side, the caster's side or the spell's owner. */
  side: Side;
  /** The monster that acts (attacker, caster, the bird of Roi điện); null for a spell from the hand. */
  source: string | null;
  /** The monster's card, kept for when it has left the field. */
  cardId: string | null;
  spell: string | null;
  /** Flows drawn into the orb (Phản nguyền takes the curse from an ally) and out of it. */
  from: FlowEnd[];
  to: FlowEnd[];
  /** The waiting action this orb stands for, without its target, so a block or a swap only turns its flow. */
  base: string | null;
  done: boolean;
};

let orbSeq = 1;

function sideOf(duel: Duel, uid: string | null | undefined): Side | null {
  if (!uid) return null;
  if (duel.players[0].field.some((mon) => mon?.uid === uid)) return 0;
  if (duel.players[1].field.some((mon) => mon?.uid === uid)) return 1;
  return null;
}

function cardOfUid(duel: Duel, uid: string | null | undefined): string | null {
  if (!uid) return null;
  for (const side of [0, 1] as const) {
    const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
    if (mon) return mon.cardId;
  }
  return null;
}

/** The waiting action without its target: the same base after a block, a swap or a rebound is the same orb. */
export function pendingBase(pending: Pending): string | null {
  if (!pending) return null;
  switch (pending.kind) {
    case "face":
    case "melee":
    case "gnaw":
      return `swing:${pending.attacker}`;
    case "beam":
    case "gnaw-skill":
      return `skill:${pending.caster}:${pending.index}`;
    case "spell":
      return `spell:${pending.owner}:${pending.cardId}`;
    case "lash":
      return `lash:${pending.bird}`;
  }
}

function living(duel: Duel, side: Side): FlowEnd[] {
  return duel.players[side].field.filter((mon) => mon && mon.hp > 0).map((mon) => ({ uid: mon!.uid }));
}

/** Where the waiting action goes: the monster it hits (or the one blocking for it), or the player. */
function pendingFlows(duel: Duel): { from: FlowEnd[]; to: FlowEnd[] } {
  const pending = duel.pending;
  if (!pending) return { from: [], to: [] };
  const blocker = duel.hold?.blocker ?? null;
  switch (pending.kind) {
    // A swing flows from the attacker to what it hits (the line draws it straight, not through the orb).
    case "face":
      return { from: [{ uid: pending.attacker }], to: [blocker ? { uid: blocker } : { face: (1 - duel.turn) as Side }] };
    case "melee":
    case "gnaw":
      return { from: [{ uid: pending.attacker }], to: [{ uid: blocker ?? pending.defender }] };
    case "beam":
    case "gnaw-skill": {
      if ("back" in pending && pending.back) return { from: [{ uid: pending.caster }], to: [{ uid: pending.caster }] };
      const target = blocker ?? pending.target;
      return { from: [{ uid: pending.caster }], to: target ? [{ uid: target }] : [] };
    }
    case "lash":
      return { from: [{ uid: pending.bird }], to: [{ uid: pending.foe }] };
    case "spell": {
      const foe = (1 - pending.owner) as Side;
      if (pending.cardId === "sam-set-tan-the" || pending.cardId === "thanh-guom-anh-sang") return { from: [], to: living(duel, foe) };
      if (pending.cardId === "mu-ma-phap") return { from: [], to: living(duel, pending.owner) };
      if (pending.cardId === "vong-nguyen-rua-ac-ma") return { from: [], to: pending.source ? [{ uid: pending.source }] : [] };
      if (pending.cardId === "phan-nguyen") {
        return { from: pending.source ? [{ uid: pending.source }] : [], to: pending.target ? [{ uid: pending.target }] : [] };
      }
      const target = blocker ?? pending.target;
      return { from: [], to: target ? [{ uid: target }] : [] };
    }
  }
}

function pendingOrb(duel: Duel): ChainOrb | null {
  const pending = duel.pending;
  if (!pending) return null;
  const flows = pendingFlows(duel);
  const base = pendingBase(pending);
  if (pending.kind === "spell") {
    return { id: `orb${orbSeq++}`, kind: "spell", side: pending.owner, source: pending.source ?? null, cardId: cardOfUid(duel, pending.source), spell: pending.cardId, ...flows, base, done: false };
  }
  const source = pending.kind === "lash" ? pending.bird : pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.caster : pending.attacker;
  const swing = pending.kind === "face" || pending.kind === "melee" || pending.kind === "gnaw";
  // A swing that is really a skill (Sừng lôi phá's Sấm lôi phá, Tia sáng's shot) still reads as the swing it is.
  return {
    id: `orb${orbSeq++}`,
    kind: swing ? "attack" : "skill",
    side: pending.kind === "lash" ? pending.owner : (sideOf(duel, source) ?? duel.turn),
    source,
    cardId: cardOfUid(duel, source),
    spell: null,
    ...flows,
    base,
    done: false,
  };
}

/** The attacker or caster of the waiting action. */
function striker(pending: Pending): string | null {
  if (!pending) return null;
  if (pending.kind === "face" || pending.kind === "melee" || pending.kind === "gnaw") return pending.attacker;
  if (pending.kind === "beam" || pending.kind === "gnaw-skill") return pending.caster;
  if (pending.kind === "lash") return pending.bird;
  return null;
}

/** A spell played to answer: what it flows into, by what each answer does in the rules today. */
function answerOrb(prev: Duel, next: Duel, spell: string, side: Side, target: FlowEnd | null, answered: ChainOrb | null): ChainOrb {
  const into: FlowEnd[] = answered ? [{ orb: answered.id }] : [];
  const attacker = striker(prev.pending);
  let to: FlowEnd[];
  switch (spell) {
    case "hap-thu-ma-phap":
    case "la-chan-phan-don":
    case "vong-xoay-bao-ho":
      to = into;
      break;
    case "guong-phong-ho":
      // Today Gương phòng hộ blocks and takes half the attacker's stats at once.
      to = [...into, ...(attacker ? [{ uid: attacker }] : [])];
      break;
    case "phuc-kich":
      to = attacker ? [{ uid: attacker }] : into;
      break;
    default:
      to = target ? [target] : into;
  }
  return { id: `orb${orbSeq++}`, kind: "spell", side, source: null, cardId: null, spell, from: [], to, base: null, done: true };
}

/** Spells that left a hand between two states, with their owner. */
function playedSpells(prev: Duel, next: Duel): Array<{ id: string; side: Side; target: FlowEnd | null }> {
  const seen = new Set((prev.events ?? []).map((row) => row.id));
  const rows = (next.events ?? []).filter((row) => !seen.has(row.id) && row.kind === "spell" && row.ok && row.cardId);
  if (rows.length) {
    return rows.map((row) => ({
      id: row.cardId!,
      side: row.actor,
      target: row.target?.kind === "monster" && row.target.uid ? { uid: row.target.uid } : row.target?.kind === "face" ? { face: (1 - row.actor) as Side } : null,
    }));
  }
  for (const side of [0, 1] as const) {
    const left = [...next.players[side].hand];
    for (const id of prev.players[side].hand) {
      const at = left.indexOf(id);
      if (at >= 0) left.splice(at, 1);
      else return [{ id, side, target: null }];
    }
  }
  return [];
}

/** The chain after one change of the duel. */
export function stepChain(prev: Duel | null, next: Duel, chain: ChainOrb[]): ChainOrb[] {
  const open = next.step === "respond";
  if (!prev || prev.step !== "respond" || chain.length === 0) {
    if (!open) return chain.some((orb) => !orb.done) ? chain.map((orb) => ({ ...orb, done: true })) : chain;
    const first = pendingOrb(next);
    return first ? [first] : [];
  }
  const base = open ? pendingBase(next.pending) : null;
  let list = [...chain];
  const answered = list.find((orb) => !orb.done && orb.base === pendingBase(prev.pending)) ?? null;
  let placed = false;
  // Answers can also end the wait at once (Gương phòng hộ, Hấp thụ ma pháp): their orb still joins the line.
  for (const play of playedSpells(prev, next)) {
    // An answer that waits in its turn (Vòng nguyền rủa ác ma) is the new waiting action.
    if (open && next.pending?.kind === "spell" && next.pending.cardId === play.id && next.pending.owner === play.side && base !== pendingBase(prev.pending)) {
      const orb = pendingOrb(next);
      if (orb) list.push(orb);
      placed = true;
      continue;
    }
    list.push(answerOrb(prev, next, play.id, play.side, play.target, answered));
  }
  if (open) {
    const live = list.find((orb) => orb.base !== null && orb.base === base);
    if (live) {
      // The same action, turned by a block, a swap or a rebound.
      const flows = pendingFlows(next);
      list = list.map((orb) => (orb === live ? { ...orb, ...flows } : orb));
    } else if (base && !placed) {
      const orb = pendingOrb(next);
      if (orb) list.push(orb);
    }
  }
  return list.map((orb) => ({ ...orb, done: !open || orb.base === null || orb.base !== base }));
}
