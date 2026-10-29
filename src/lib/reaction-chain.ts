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
 *  ally; a skill that Giáp cơ khí throws back runs on from the spell's icon to its caster).
 *  Dòng chảy đợt 2 (chủ game 29/10): `fork` a branch of a spread, from the fork in front of the row it splits at;
 *  `dam` it runs into an icon that stops it and surges against it as a flood against a dam; `wrap` it wraps the icon
 *  it reaches (Hấp thụ ma pháp round the spell it takes); `back` it is thrown back and goes round its way in.
 *  Chặn từng nhánh (chủ game 29/10): `cover` a branch a monster blocks, the one it was on its way to: it runs as it
 *  would to it and stops at the blocker's icon on its way. */
export type FlowLink = { from?: FlowEnd; end: FlowEnd; tone: FlowTone; fork?: boolean; dam?: boolean; wrap?: boolean; back?: boolean; cover?: FlowEnd };

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
  /** Dòng chảy đợt 2: a skill landing on more than one runs to a fork in front of this side's row, then splits. */
  spread?: Side | null;
  /** The one thing a single action is aimed at, kept for where an icon that stops it stands. */
  goal?: FlowEnd | null;
  /** The icon this spell stops (Lá chắn phản đòn, Gương phòng hộ, Vòng nguyền rủa ác ma): it stands on that flow. */
  stops?: string | null;
  /** Its roll hit nobody: it fades now, though the wait goes on (chủ game 29/10). */
  miss?: boolean;
  /** A wall card lying by the environment card that rose by itself (Gương phòng hộ): it flies in from there. */
  wall?: boolean;
  /** An ally sent by an answer (Phục kích) strikes without lunging: its red light is drawn as a flow. */
  sent?: boolean;
  /** A block icon on one branch of a spread: what that branch was on its way to (a uid, or "face:N"). */
  cover?: string;
};

let orbSeq = 1;

const WHITE_SPELLS = new Set(["hap-thu-ma-phap", "vong-xoay-bao-ho", "mua-ma-thuat"]);
/** Spells that stand in the way of what they answer, as a dam (chủ game 29/10): Lá chắn phản đòn a skill, Gương
 *  phòng hộ an attack, Vòng nguyền rủa ác ma both. */
const DAM_SPELLS = new Set(["la-chan-phan-don", "guong-phong-ho", "vong-nguyen-rua-ac-ma", "phuc-kich"]);
/** Spells that throw a skill back from their icon. */
const REFLECT_SPELLS = new Set(["giap-co-khi", "la-chan-phan-don"]);
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

/** Where the waiting action goes: the monster or the player it hits, or the icon of what stands in front of it.
 *  `reflect`: the icon of the spell throwing a skill back, and whether it stands in the skill's way as a dam. */
function pendingLinks(duel: Duel, guardIcon: string | null, reflect: { id: string; dam: boolean } | null): FlowLink[] {
  const pending = duel.pending;
  if (!pending) return [];
  const tone = pendingTone(duel, pending);
  const link = (end: FlowEnd): FlowLink => ({ end, tone });
  if (guardIcon) return [{ end: { orb: guardIcon }, tone, dam: true }];
  switch (pending.kind) {
    case "face":
      return [link({ face: (1 - duel.turn) as Side })];
    case "melee":
    case "gnaw":
      return [link({ uid: pending.defender })];
    case "beam":
    case "gnaw-skill": {
      // Thrown back by Giáp cơ khí or Lá chắn phản đòn (chủ game 23/10, 29/10): the skill runs into the spell's icon
      // (Lá chắn phản đòn's a dam it surges against), then runs on from it to the one it is thrown at, round its way in.
      if ("back" in pending && pending.back) {
        const victim = pending.target ?? pending.caster;
        return reflect ? [{ end: { orb: reflect.id }, tone, dam: reflect.dam }, { from: { orb: reflect.id }, end: { uid: victim }, tone, back: true }] : [link({ uid: victim })];
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
  const goal = to.length === 1 && !to[0].from ? to[0].end : null;
  if (pending.kind === "spell") {
    return { id, kind: "spell", side: pending.owner, source: pending.source ?? null, cardId: monOf(duel, pending.source)?.cardId ?? null, spell: pending.cardId, near: null, by, to, tone, skill: null, strike: null, base, aim, notice: duel.live, done: false, end: null, goal };
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
    goal,
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
      // It takes the spell: its white light wraps that spell's icon (chủ game 29/10).
      to = into.map((link) => ({ ...link, wrap: true }));
      break;
    case "vong-xoay-bao-ho":
      to = into;
      break;
    case "la-chan-phan-don":
      // Its icon stands in the skill's way; the skill runs on from it to the one it is thrown at (the waiting action's
      // own flows draw that).
      to = [];
      break;
    case "guong-phong-ho":
      // Today Gương phòng hộ blocks and takes half the attacker's stats at once: it stands in the attack's way.
      to = attacker ? [{ end: { uid: attacker }, tone }] : [];
      break;
    case "phuc-kich":
      // Chủ game 29/10: it stops the skill; pink to the ally it sends, which strikes the one who used it (its own
      // attack icon, `ambushOrb`).
      to = target ? [{ end: target, tone }] : into;
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
    stops: answered && DAM_SPELLS.has(spell) ? answered.id : null,
  };
}

/** Phục kích's ally striking back: an attack icon by it, red into the one whose skill it stopped. */
function ambushOrb(prev: Duel, next: Duel, ally: string, side: Side): ChainOrb | null {
  const foe = striker(prev.pending);
  if (!foe) return null;
  return {
    id: `orb${orbSeq++}`,
    kind: "attack",
    side,
    source: ally,
    cardId: monOf(next, ally)?.cardId ?? monOf(prev, ally)?.cardId ?? null,
    spell: null,
    near: ally,
    by: null,
    to: [{ end: { uid: foe }, tone: "red" }],
    tone: "red",
    skill: null,
    strike: null,
    base: null,
    aim: foe,
    notice: next.live,
    done: true,
    end: "fire",
    sent: true,
  };
}

/** Gương phòng hộ standing up against an attack (chủ game 29/10): pink into the attacker; the attack surges into it. */
function mirrorOrb(next: Duel, live: ChainOrb, side: Side): ChainOrb {
  return {
    id: `orb${orbSeq++}`,
    kind: "spell",
    side,
    source: null,
    cardId: null,
    spell: "guong-phong-ho",
    near: null,
    by: live.id,
    to: live.source ? [{ end: { uid: live.source }, tone: "pink" }] : [],
    tone: "pink",
    skill: null,
    strike: null,
    base: null,
    aim: null,
    notice: next.live,
    done: false,
    end: null,
    stops: live.id,
    wall: true,
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

/** Where one of a spread's hits lands: a monster, or a player ("face:N"). */
function hitEnd(hit: string): FlowEnd {
  return hit.startsWith("face:") ? { face: Number(hit.slice(5)) as Side } : { uid: hit };
}

/** Whom the waiting action lands on, as the page works it out (preview.ts `reachOf`). */
export type ChainReach = { side: Side; hits: string[]; random: boolean; known: boolean };

/**
 * The chain after one change of the duel. `reach`: whom the waiting action lands on, for a skill that can land on more
 * than one (dòng chảy đợt 2, chủ game 29/10): its light runs to a fork in front of their row and splits there, one
 * branch each; while its roll is still to come only to the fork (hàng chờ: the opponent sees whom it shoots once it
 * is confirmed); a roll that hits nobody fades with its icon at once.
 */
export function stepChain(prev: Duel | null, next: Duel, chain: ChainOrb[], reach: ChainReach | null = null): ChainOrb[] {
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
        if (orb) list.push({ ...orb, stops: answered && DAM_SPELLS.has(play.id) ? answered.id : null });
        placed = true;
        continue;
      }
      list.push(answerOrb(prev, next, play.id, play.side, play.target, answered));
      if (play.id === "phuc-kich" && play.target && "uid" in play.target) {
        const strike = ambushOrb(prev, next, play.target.uid, play.side);
        if (strike) list.push(strike);
      }
    }
    // What a spell stops runs into its icon now, surging against it (Gương phòng hộ ends the wait at once, so this
    // shows as the attack fades; Vòng nguyền rủa ác ma holds it while the curse waits).
    for (const stopper of list) {
      if (!stopper.stops || stopper.kind !== "spell") continue;
      list = list.map((orb) => (orb.id === stopper.stops && !orb.to.some((link) => "orb" in link.end && link.end.orb === stopper.id) ? { ...orb, to: [{ end: { orb: stopper.id }, tone: orb.tone, dam: true }] } : orb));
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
  // An attack held by the curse that stops it (Vòng nguyền rủa ác ma) waits with it.
  const heldBy = new Map<string, string>();
  if (live?.stops && live.kind === "spell") heldBy.set(live.stops, live.id);
  // Gương phòng hộ risen against the attack: its icon, held while the wait goes on.
  const mirror = live && next.hold?.mirror ? list.find((orb) => orb.spell === "guong-phong-ho" && orb.stops === live.id) ?? null : null;
  if (live && next.hold?.mirror && !mirror) {
    const side = (1 - next.turn) as Side;
    list.push(mirrorOrb(next, live, side));
  }
  const glass = live && next.hold?.mirror ? list.find((orb) => orb.spell === "guong-phong-ho" && orb.stops === live.id) ?? null : null;
  // Phục kích waiting in the chain (chủ game 30/10): its icon stops the skill on its way in, its ally's strike waits.
  const ambush = next.hold?.ambush ?? null;
  const lurk = live && ambush ? list.find((orb) => orb.spell === "phuc-kich" && orb.stops === live.id) ?? null : null;
  const pounce = live && ambush ? list.find((orb) => orb.sent && orb.source === ambush.ally) ?? null : null;
  const wall = glass ?? lurk;
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
    // Chặn từng nhánh (chủ game 29/10): an icon for each monster in front of one branch of a spread.
    const coverShields = new Map<string, ChainOrb>();
    for (const cover of next.hold?.covers ?? []) {
      const key = `block:${base}:${cover.target}`;
      let orb = list.find((other) => other.kind === "block" && other.base === key && !other.done) ?? null;
      if (orb && orb.source !== cover.blocker) {
        list = list.map((other) => (other === orb ? { ...other, done: true, end: "fizzle" as const } : other));
        orb = null;
      }
      if (!orb) {
        orb = { ...blockOrb(next, cover.blocker, `${base}:${cover.target}`, pendingTone(next, next.pending)), cover: cover.target };
        list.push(orb);
      }
      coverShields.set(cover.target, orb);
    }
    // Giáp cơ khí or Lá chắn phản đòn throwing the skill back: the spell's icon is where the skill turns.
    const turner = next.pending && "back" in next.pending && next.pending.back ? [...list].reverse().find((orb) => orb.spell && REFLECT_SPELLS.has(orb.spell)) ?? null : null;
    const reflect = turner ? { id: turner.id, dam: DAM_SPELLS.has(turner.spell!) } : null;
    const tone = pendingTone(next, next.pending);
    // A skill landing on more than one, or whose roll decides whom (dòng chảy đợt 2): to a fork, then a branch each;
    // the branch to what a blocker stands in front of runs into the blocker's icon instead.
    const hits = reach && !reflect ? reach.hits.filter((hit) => hit !== guard) : [];
    const spreads = Boolean(reach && !reflect && (reach.random || hits.length >= 2));
    let to: FlowLink[];
    let spread: Side | null = null;
    let miss = false;
    if (wall) {
      // Stopped before it splits: one flow into the icon that stops it.
      to = [{ end: { orb: wall.id }, tone, dam: true }];
    } else if (spreads && reach) {
      spread = reach.side;
      const guarded = guard ? aimedAt(next.pending) ?? (next.pending?.kind === "face" ? `face:${reach.side}` : null) : null;
      to = hits.map((hit): FlowLink => {
        if (shield && hit === guarded) return { end: { orb: shield.id }, tone, fork: true, dam: true };
        const cover = coverShields.get(hit);
        if (cover) return { end: { orb: cover.id }, tone, fork: true, dam: true, cover: hitEnd(hit) };
        return { end: hitEnd(hit), tone, fork: true };
      });
      if (shield && !to.some((link) => link.dam)) to.push({ end: { orb: shield.id }, tone, fork: true, dam: true });
      miss = reach.random && reach.known && hits.length === 0 && !shield && coverShields.size === 0;
    } else {
      to = selfLinks(pendingLinks(next, shield?.id ?? null, reflect), live.id);
      // A spell on a whole side (Sấm sét tận thế, Mũ ma pháp) splits the same way.
      if (next.pending?.kind === "spell" && !shield && to.length >= 2 && to.every((link) => !link.from && "uid" in link.end)) {
        spread = sideOf(next, "uid" in to[0].end ? to[0].end.uid : null);
        if (spread !== null) to = to.map((link) => ({ ...link, fork: true }));
      }
    }
    list = list.map((orb) =>
      orb === live
        ? {
            ...orb,
            to,
            tone: pendingTone(next, next.pending),
            strike: orb.kind === "attack" ? strikeOf(next, next.pending) ?? orb.strike : null,
            spread: spread ?? (reflect ? orb.spread ?? null : null),
            miss,
            // Where an icon stopping it stands: on its way to what it was aimed at.
            goal: wall && !orb.goal ? (aimedAt(next.pending) ? { uid: aimedAt(next.pending)! } : { face: (1 - (sideOf(next, orb.source) ?? next.turn)) as Side }) : orb.goal,
          }
        : orb,
    );
  }
  // Done: what waited and no longer does fires or fizzles; a block icon goes with what it blocked.
  const ended = new Map<string, ChainOrb["end"]>();
  list = list.map((orb) => {
    if (orb.kind === "block") return orb;
    // The mirror stands until the attack it stops is over.
    if ((glass && orb.id === glass.id) || (lurk && orb.id === lurk.id) || (pounce && orb.id === pounce.id)) return orb.done || orb.end ? { ...orb, done: false, end: null } : orb;
    const done = !heldBy.has(orb.id) && (!open || orb.base === null || orb.base !== base);
    if (!done || orb.done) return orb.done === done ? orb : { ...orb, done };
    // What a curse held is stopped by it, whatever came of the curse (the rules today); a skill thrown back goes on.
    const stopped = !orb.to.some((link) => link.back) && orb.to.some((link) => link.dam && "orb" in link.end && list.some((other) => other.id === (link.end as { orb: string }).orb && other.kind === "spell"));
    const end = orb.end ?? (passed && !stopped ? "fire" : "fizzle");
    if (orb.base) ended.set(`block:${orb.base}`, end);
    // What came of it (the notice as it lands): a random skill's outcome shows on its icon afterwards.
    return { ...orb, done, end, result: !orb.end && end === "fire" ? next.live : orb.result };
  });
  return list.map((orb) => {
    if (orb.kind !== "block" || orb.done) return orb;
    // A block icon on one branch goes with the spread it blocks ("block:<base>:<target>").
    const key = orb.base && orb.cover ? orb.base.slice(0, -(orb.cover.length + 1)) : orb.base;
    if (key && ended.has(key)) return { ...orb, done: true, end: ended.get(key) ?? "fizzle" };
    if (!open) return { ...orb, done: true, end: passed ? "fire" : "fizzle" };
    return orb;
  });
}
