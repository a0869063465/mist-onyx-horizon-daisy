import type { Duel, Pending, Side } from "./duel.ts";

/**
 * The reaction icons (chủ game 23/10, in place of the fixed reaction line of 21/10): one icon for what is waiting (an
 * attack, a skill, a slow spell), one for a monster that blocks it and one for each spell played to answer it. The
 * rules do not change; the icons only follow the duel from one state to the next. An icon stands by the card that
 * acts (the attacker, the caster, the blocker); a spell stands on its side's half, by the icon it answers. Smoke flows
 * from an icon to what it acts on: a monster, a player or another icon. A blocker draws the flow of what it blocks
 * into its own icon. When the wait ends, the icon of what waited fires if both sides let it through, or fizzles if an
 * answer stopped it; the others have done their work and fade with it.
 */
export type FlowEnd = { uid: string } | { face: Side } | { orb: string };

/** Smoke colours (chủ game 23/10): red a plain attack, blue a skill (Sừng lôi phá's and Mắt xanh's strikes too),
 *  pink a spell that harms, white one that breaks a spell, green one that helps an ally. */
export type FlowTone = "red" | "blue" | "pink" | "white" | "green";

/** One flow of smoke. It leaves its icon unless it says where it leaves from (Phản nguyền takes the curse from an
 *  ally; a skill that Giáp cơ khí throws back runs on from the spell's icon to its caster). */
export type FlowLink = { from?: FlowEnd; end: FlowEnd; tone: FlowTone };

export type ChainOrb = {
  id: string;
  kind: "attack" | "skill" | "spell" | "block";
  /** Who acts: the attacker's side, the caster's side, the spell's owner or the blocker's side. */
  side: Side;
  /** The monster that acts (attacker, caster, the bird of Roi điện, the blocker); null for a spell from the hand. */
  source: string | null;
  /** The monster's card, kept for when it has left the field. */
  cardId: string | null;
  spell: string | null;
  /** The card the icon stands by; null for a spell. */
  near: string | null;
  /** The icon a spell answered: it stands by it. */
  by: string | null;
  to: FlowLink[];
  /** The colour of the icon's own smoke and ring. */
  tone: FlowTone;
  /** The skill's index for a skill icon ("lash" for Roi điện), to name it and open its sheet on it. */
  skill: number | "lash" | null;
  /** An attack that is really a skill: Sừng lôi phá's strike shows the spell, Mắt xanh's its own skill. */
  strike: "horn" | "gaze" | null;
  /** The waiting action this icon stands for, without its target, so a block or a swap only turns its flow. */
  base: string | null;
  /** The monster it first aimed at, to tell Kizuran covering Kazura from a plain attack on Kizuran. */
  aim: string | null;
  /** The notice of the moment it showed, for a tap on it. */
  notice: string;
  done: boolean;
  /** How it ended: it fired at what it acts on, or an answer stopped it. Answers fire as they are played. */
  end: "fire" | "fizzle" | null;
  /** The notice as it fired: what a random skill came to. */
  result?: string;
};

let orbSeq = 1;

const WHITE_SPELLS = new Set(["hap-thu-ma-phap", "vong-xoay-bao-ho", "mua-ma-thuat"]);
const GREEN_SPELLS = new Set(["co-may-thoi-gian", "mu-ma-phap", "hoan-doi", "giap-co-khi"]);

/** The smoke of a spell: white when it breaks a spell, green when it helps an ally, pink when it harms. */
export function spellTone(id: string | null): FlowTone {
  if (id && WHITE_SPELLS.has(id)) return "white";
  if (id && GREEN_SPELLS.has(id)) return "green";
  return "pink";
}

function sideOf(duel: Duel, uid: string | null | undefined): Side | null {
  if (!uid) return null;
  if (duel.players[0].field.some((mon) => mon?.uid === uid)) return 0;
  if (duel.players[1].field.some((mon) => mon?.uid === uid)) return 1;
  return null;
}

function monOf(duel: Duel, uid: string | null | undefined) {
  if (!uid) return null;
  for (const side of [0, 1] as const) {
    const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
    if (mon) return mon;
  }
  return null;
}

/** The waiting action without its target: the same base after a block, a swap or a rebound is the same icon. */
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

/** The monster the waiting action is aimed at, if it is aimed at one. */
function aimedAt(pending: Pending): string | null {
  if (!pending) return null;
  if (pending.kind === "melee" || pending.kind === "gnaw") return pending.defender;
  if (pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") return pending.target ?? null;
  return null;
}

/** An attack that is really a skill (chủ game 23/10): Sừng lôi phá's strike and Mắt xanh's light are blue. */
function strikeOf(duel: Duel, pending: Pending): "horn" | "gaze" | null {
  if (!pending || (pending.kind !== "face" && pending.kind !== "melee")) return null;
  const attacker = monOf(duel, pending.attacker);
  if (attacker?.horn) return "horn";
  if (attacker?.gaze) return "gaze";
  return null;
}

/** A skill aimed at a player (Hơi thở rồng, Hoả cầu, Cầu lửa địa ngục…): the rules hold it as a blow at the face. */
function faceSkill(pending: Pending): boolean {
  return pending?.kind === "face" && Boolean(pending.skill);
}

/** The skill a skill at a player casts: Hoả cầu is Rồng canh pháo đài's second, Con bạc nổi giận Máy quay thưởng's. */
function faceSkillIndex(cardId: string | null): number {
  return cardId === "rong-phun-hoa-cau" || cardId === "may-quay-thuong" ? 1 : 0;
}

function pendingTone(duel: Duel, pending: Pending): FlowTone {
  if (!pending) return "red";
  if (pending.kind === "spell") return spellTone(pending.cardId);
  if (faceSkill(pending)) return "blue";
  if (pending.kind === "face" || pending.kind === "melee" || pending.kind === "gnaw") return strikeOf(duel, pending) ? "blue" : "red";
  return "blue";
}

/**
 * Who stands in front of the waiting action: the monster that blocks it, or Kizuran taking for Kazura what was aimed
 * at her (Chịu đòn vì bạn), before or after the attack (the rules move the hit at the end, or move the aim at once).
 */
function guardOf(duel: Duel, firstAim: string | null): string | null {
  if (duel.hold?.blocker) return duel.hold.blocker;
  const aimed = aimedAt(duel.pending);
  const side = sideOf(duel, aimed);
  if (!aimed || side === null) return null;
  const mon = monOf(duel, aimed);
  if (mon?.cardId === "kazura") {
    const guard = duel.players[side].field.find((unit) => unit && unit.cardId === "kizuran" && unit.cover && unit.hp > 0 && unit.stun === 0 && (unit.chain ?? 0) === 0);
    return guard?.uid ?? null;
  }
  if (mon?.cardId === "kizuran" && mon.cover && firstAim && firstAim !== aimed) return aimed;
  return null;
}

/** Where the waiting action goes: the monster or the player it hits, or the icon of what stands in front of it. */
function pendingLinks(duel: Duel, guardIcon: string | null, reflect: string | null): FlowLink[] {
  const pending = duel.pending;
  if (!pending) return [];
  const tone = pendingTone(duel, pending);
  const link = (end: FlowEnd): FlowLink => ({ end, tone });
  if (guardIcon) return [link({ orb: guardIcon })];
  switch (pending.kind) {
    case "face":
      return [link({ face: (1 - duel.turn) as Side })];
    case "melee":
    case "gnaw":
      return [link({ uid: pending.defender })];
    case "beam":
    case "gnaw-skill": {
      // Thrown back by Giáp cơ khí (chủ game 23/10): the skill runs into the spell's icon, and on from it to its caster.
      if ("back" in pending && pending.back) {
        return reflect ? [link({ orb: reflect }), { from: { orb: reflect }, end: { uid: pending.caster }, tone }] : [link({ uid: pending.caster })];
      }
      return pending.target ? [link({ uid: pending.target })] : [];
    }
    case "lash":
      return [link({ uid: pending.foe })];
    case "spell": {
      const foe = (1 - pending.owner) as Side;
      if (pending.cardId === "sam-set-tan-the" || pending.cardId === "thanh-guom-anh-sang") return living(duel, foe).map(link);
      if (pending.cardId === "mu-ma-phap") return living(duel, pending.owner).map(link);
      if (pending.cardId === "vong-nguyen-rua-ac-ma") return pending.source ? [link({ uid: pending.source })] : [];
      if (pending.cardId === "phan-nguyen") {
        return [...(pending.source ? [{ from: { uid: pending.source }, end: { orb: "self" }, tone }] : []), ...(pending.target ? [link({ uid: pending.target })] : [])];
      }
      return pending.target ? [link({ uid: pending.target })] : [];
    }
  }
}

/** Phản nguyền's curse flows from the ally into the spell's own icon. */
function selfLinks(links: FlowLink[], id: string): FlowLink[] {
  return links.map((link) => ("orb" in link.end && link.end.orb === "self" ? { ...link, end: { orb: id } } : link));
}

function pendingOrb(duel: Duel, by: string | null = null): ChainOrb | null {
  const pending = duel.pending;
  if (!pending) return null;
  const id = `orb${orbSeq++}`;
  const base = pendingBase(pending);
  const tone = pendingTone(duel, pending);
  const to = selfLinks(pendingLinks(duel, null, null), id);
  const aim = aimedAt(pending);
  if (pending.kind === "spell") {
    return { id, kind: "spell", side: pending.owner, source: pending.source ?? null, cardId: monOf(duel, pending.source)?.cardId ?? null, spell: pending.cardId, near: null, by, to, tone, skill: null, strike: null, base, aim, notice: duel.live, done: false, end: null };
  }
  const source = pending.kind === "lash" ? pending.bird : pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.caster : pending.attacker;
  const cardId = monOf(duel, source)?.cardId ?? null;
  // A skill at a player is a skill (its own icon, blue), though the rules hold it as a blow at the face.
  const swing = (pending.kind === "face" && !faceSkill(pending)) || pending.kind === "melee" || pending.kind === "gnaw";
  return {
    id,
    kind: swing ? "attack" : "skill",
    side: pending.kind === "lash" ? pending.owner : (sideOf(duel, source) ?? duel.turn),
    source,
    cardId,
    spell: null,
    near: source,
    by,
    to,
    tone,
    skill: pending.kind === "lash" ? "lash" : pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.index : faceSkill(pending) ? faceSkillIndex(cardId) : null,
    strike: swing ? strikeOf(duel, pending) : null,
    base,
    aim,
    notice: duel.live,
    done: false,
    end: null,
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

/** A spell played to answer: what it flows into, by what each answer does in the rules today (đợt 3 redraws the
 *  answers to attacks). It stands by the icon it answered. */
function answerOrb(prev: Duel, next: Duel, spell: string, side: Side, target: FlowEnd | null, answered: ChainOrb | null): ChainOrb {
  const tone = spellTone(spell);
  const into: FlowLink[] = answered ? [{ end: { orb: answered.id }, tone }] : [];
  const attacker = striker(prev.pending);
  let to: FlowLink[];
  switch (spell) {
    case "hap-thu-ma-phap":
    case "vong-xoay-bao-ho":
      to = into;
      break;
    case "la-chan-phan-don":
      to = [...into, ...(target && "uid" in target ? [{ end: target, tone }] : [])];
      break;
    case "guong-phong-ho":
      // Today Gương phòng hộ blocks and takes half the attacker's stats at once.
      to = [...into, ...(attacker ? [{ end: { uid: attacker }, tone }] : [])];
      break;
    case "phuc-kich":
      to = attacker ? [{ end: { uid: attacker }, tone }] : into;
      break;
    case "giap-co-khi": {
      // Giáp cơ khí (chủ game 23/10): green into the ally it arms; a skill it throws back runs through its icon.
      const pending = prev.pending;
      const ally = target ?? (pending && (pending.kind === "beam" || pending.kind === "gnaw-skill") && pending.target ? { uid: pending.target } : null);
      to = ally ? [{ end: ally, tone }] : [];
      break;
    }
    default:
      to = target ? [{ end: target, tone }] : into;
  }
  return {
    id: `orb${orbSeq++}`,
    kind: "spell",
    side,
    source: null,
    cardId: null,
    spell,
    near: null,
    by: answered?.id ?? null,
    to,
    tone,
    skill: null,
    strike: null,
    base: null,
    aim: null,
    notice: next.live,
    done: true,
    end: "fire",
  };
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

/** The block icon of a waiting action: a blocker's crossed swords, by the blocker. */
function blockOrb(next: Duel, guard: string, base: string, tone: FlowTone): ChainOrb {
  return {
    id: `orb${orbSeq++}`,
    kind: "block",
    side: sideOf(next, guard) ?? ((1 - next.turn) as Side),
    source: guard,
    cardId: monOf(next, guard)?.cardId ?? null,
    spell: null,
    near: guard,
    by: null,
    to: [],
    tone,
    skill: null,
    strike: null,
    base: `block:${base}`,
    aim: null,
    notice: next.live,
    done: false,
    end: null,
  };
}

/** The chain after one change of the duel. */
/**
 * `aims`: whom the roll of the waiting action hits, when its roll decides it (hàng chờ, chủ game 28/10: the opponent
 * sees whom it shoots once it is confirmed); its light then runs to each of them.
 */
export function stepChain(prev: Duel | null, next: Duel, chain: ChainOrb[], aims: Array<string | "face"> | null = null): ChainOrb[] {
  const open = next.step === "respond";
  let list: ChainOrb[];
  let passed = false;
  if (!prev || prev.step !== "respond" || chain.length === 0) {
    if (!open) return chain.some((orb) => !orb.done) ? chain.map((orb) => ({ ...orb, done: true })) : chain;
    const first = pendingOrb(next);
    list = first ? [first] : [];
  } else {
    list = [...chain];
    const answered = list.find((orb) => !orb.done && orb.kind !== "block" && orb.base === pendingBase(prev.pending)) ?? null;
    const base = open ? pendingBase(next.pending) : null;
    let placed = false;
    // Answers can also end the wait at once (Gương phòng hộ, Hấp thụ ma pháp): their icon still shows.
    for (const play of playedSpells(prev, next)) {
      // An answer that waits in its turn (Vòng nguyền rủa ác ma) is the new waiting action, by the icon it answered.
      if (open && next.pending?.kind === "spell" && next.pending.cardId === play.id && next.pending.owner === play.side && base !== pendingBase(prev.pending)) {
        const orb = pendingOrb(next, answered?.id ?? null);
        if (orb) list.push(orb);
        placed = true;
        continue;
      }
      list.push(answerOrb(prev, next, play.id, play.side, play.target, answered));
    }
    if (open && base && !placed && !list.some((orb) => orb.kind !== "block" && orb.base === base)) {
      const orb = pendingOrb(next);
      if (orb) list.push(orb);
    }
    // What was waiting and is no longer: it went through if both sides passed, else an answer stopped it.
    const seen = new Set((prev.events ?? []).map((row) => row.id));
    passed = (next.events ?? []).some((row) => !seen.has(row.id) && row.kind === "pass");
  }
  const base = open ? pendingBase(next.pending) : null;
  const live = open && base ? list.find((orb) => orb.kind !== "block" && orb.base === base && !orb.done) ?? null : null;
  if (live) {
    // Who stands in front of it: its block icon (made once per blocker), into which its smoke is drawn.
    const guard = guardOf(next, live.aim);
    const blockKey = `block:${base}`;
    let shield = list.find((orb) => orb.kind === "block" && orb.base === blockKey && !orb.done) ?? null;
    if (shield && shield.source !== guard) {
      list = list.map((orb) => (orb === shield ? { ...orb, done: true, end: "fizzle" as const } : orb));
      shield = null;
    }
    if (guard && !shield) {
      shield = blockOrb(next, guard, base!, pendingTone(next, next.pending));
      list.push(shield);
    }
    // Giáp cơ khí throwing the skill back: the spell's icon is where the skill turns.
    const reflect = next.pending && "back" in next.pending && next.pending.back ? [...list].reverse().find((orb) => orb.spell === "giap-co-khi")?.id ?? null : null;
    const tone = pendingTone(next, next.pending);
    const to =
      aims && aims.length && !shield && !reflect
        ? aims.map((aim): FlowLink => ({ end: aim === "face" ? { face: (1 - next.turn) as Side } : { uid: aim }, tone }))
        : selfLinks(pendingLinks(next, shield?.id ?? null, reflect), live.id);
    list = list.map((orb) => (orb === live ? { ...orb, to, tone: pendingTone(next, next.pending), strike: orb.kind === "attack" ? strikeOf(next, next.pending) ?? orb.strike : null } : orb));
  }
  // Done: what waited and no longer does fires or fizzles; a block icon goes with what it blocked.
  const ended = new Map<string, ChainOrb["end"]>();
  list = list.map((orb) => {
    if (orb.kind === "block") return orb;
    const done = !open || orb.base === null || orb.base !== base;
    if (!done || orb.done) return orb.done === done ? orb : { ...orb, done };
    const end = orb.end ?? (passed ? "fire" : "fizzle");
    if (orb.base) ended.set(`block:${orb.base}`, end);
    // What came of it (the notice as it lands): a random skill's outcome shows on its icon afterwards.
    return { ...orb, done, end, result: !orb.end && end === "fire" ? next.live : orb.result };
  });
  return list.map((orb) => {
    if (orb.kind !== "block" || orb.done) return orb;
    if (orb.base && ended.has(orb.base)) return { ...orb, done: true, end: ended.get(orb.base) ?? "fizzle" };
    if (!open) return { ...orb, done: true, end: passed ? "fire" : "fizzle" };
    return orb;
  });
}
