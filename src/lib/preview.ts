import { confirmStage, passResponse, pickCounter, settleReel, type Duel, type FieldMon, type Side } from "@/lib/duel";

/**
 * Con mắt của hàng chờ (chủ game 28/10): bàn sau khi xác nhận, tính như đối thủ không phản ứng. Một hành động còn
 * ngẫu nhiên chưa quay (chưa xác nhận) được thử với nhiều lần quay; chỗ nào các lần quay không giống nhau thì không
 * chắc, nên chỉ hiện phần chắc chắn.
 */
const SEEDS = [11, 23, 37, 53, 71, 97];

/** On from here as if nobody answers: the side holding the reply passes, a forced Trả đòn strikes back as a plain blow. */
export function settle(state: Duel): Duel {
  let s = state;
  for (let i = 0; i < 24; i += 1) {
    if (s.winner !== null) return s;
    let next = s;
    if (s.counterAsk) next = pickCounter(s, "phys");
    else if (s.step === "respond" && s.hold && !s.hold.stage) next = passResponse(s);
    if (next === s || (next.step === s.step && next.pending === s.pending && next.hold?.priority === s.hold?.priority && next.counterAsk === s.counterAsk)) return next;
    s = next;
  }
  return s;
}

/**
 * The match after the viewer's queue goes through unanswered, once per roll. `act`: one action of the viewer not yet
 * confirmed (its rolls are still to come). `answer`: the viewer's answers, already on this screen; the other side passes.
 */
export function queueRuns(state: Duel, kind: "act" | "answer", viewer: Side): Duel[] {
  if (kind === "act") return SEEDS.map((seed) => settle(confirmStage(state, seed)));
  const handed = state.step === "respond" && state.hold && state.hold.priority === viewer ? { ...state, hold: { ...state.hold, priority: (1 - viewer) as Side, passed: [false, false] as [boolean, boolean] } } : state;
  return [settle(handed)];
}

/** What a monster shows of itself, to tell whether an action touched it (a blow, a curse, poison, wetness…). */
function touch(mon: FieldMon | null | undefined): string {
  if (!mon || mon.hp <= 0) return "x";
  return [
    mon.hp,
    mon.maxHp,
    mon.atk,
    mon.def,
    mon.mdef,
    mon.stun,
    mon.chain ?? 0,
    mon.curse ? 1 : 0,
    mon.wet ?? 0,
    mon.poison ? `${mon.poison.stacks}/${mon.poison.left}` : "",
    mon.hex ? mon.hex.left : 0,
    mon.noBlock ? 1 : 0,
    mon.vulnerable ?? 0,
  ].join(",");
}

function findMon(state: Duel, uid: string): FieldMon | null {
  for (const player of state.players) {
    const mon = player.field.find((unit) => unit?.uid === uid);
    if (mon) return mon;
  }
  return null;
}

function sideOfUid(state: Duel, uid: string): Side | null {
  if (state.players[0].field.some((mon) => mon?.uid === uid)) return 0;
  if (state.players[1].field.some((mon) => mon?.uid === uid)) return 1;
  return null;
}

/**
 * The side a skill is aimed at and what it is aimed at ("face:N" a player), for a waiting action that can land on
 * more than one: a skill, a skill at a player, Sừng lôi phá's strike that spreads. Null for anything else.
 */
function aimOf(state: Duel): { side: Side; aim: string | null } | null {
  const pending = state.pending;
  if (!pending) return null;
  if (pending.kind === "beam" || pending.kind === "gnaw-skill") {
    if ("back" in pending && pending.back) return null;
    const caster = sideOfUid(state, pending.caster);
    if (caster === null) return null;
    const side = (1 - caster) as Side;
    return { side, aim: pending.target ?? null };
  }
  if (pending.kind === "face" && pending.skill) {
    const side = (1 - state.turn) as Side;
    return { side, aim: `face:${side}` };
  }
  if (pending.kind === "melee" && findMon(state, pending.attacker)?.horn === "splash") return { side: (1 - state.turn) as Side, aim: pending.defender };
  return null;
}

/**
 * Whom an action landed on, from the match before and after it (what it touched; a chosen target it did not touch is
 * not counted, so a roll that may miss it does not show a branch to it). "spin": whom it hits is drawn later (Thương
 * quản long's reel); null: it has not landed (nothing to tell).
 */
function struck(before: Duel, after: Duel, side: Side): string[] | "spin" | null {
  if (after.reel && !before.reel) {
    // Cò quay: its barrels and whom they hit are rolled with the action's seed, so they are known once it is
    // confirmed; the reel is run to its end to see them.
    const done = after.reel.kind === "gun" && after.reel.phase === "spin" ? settleReel(after) : null;
    return done && !done.reel ? struck(before, done, side) : "spin";
  }
  if (after === before || (after.step === "respond" && after.pending === before.pending)) return null;
  const hits = new Set<string>();
  const record = after.skill && after.skill !== before.skill ? after.skill.hits : undefined;
  for (const hit of record ?? []) hits.add(hit);
  for (const mon of before.players[side].field) {
    if (mon && mon.hp > 0 && touch(mon) !== touch(findMon(after, mon.uid))) hits.add(mon.uid);
  }
  if (after.players[side].hp !== before.players[side].hp) hits.add(`face:${side}`);
  return [...hits].sort();
}

/**
 * Dòng chảy đợt 2 (chủ game 29/10): whom a skill that can land on more than one lands on, so its light runs to a fork
 * in front of their row and splits there. `hits`: monsters (uid) and players ("face:N") as far as they are known;
 * `random`: its roll decides whom; `known`: the roll is made (confirmed and landed in the rules), else only what
 * every roll hits is in `hits`; `side`: the side it is aimed at.
 */
export type Reach = { side: Side; hits: string[]; random: boolean; known: boolean };

const ROLLS = [11, 23, 37, 53];

export function reachOf(state: Duel): Reach | null {
  if (state.step !== "respond" || !state.hold || !state.pending) return null;
  const aimed = aimOf(state);
  if (!aimed) return null;
  // Whom it lands on with nobody in front of it: a blocker takes the branch it stands in front of (a monster covering
  // one branch takes that branch, chủ game 29/10).
  const open: Duel = { ...state, hold: { ...state.hold, blocker: null, blockerSkill: false, covers: undefined } };
  const run = (seed: number) => {
    try {
      return struck(open, passResponse(confirmStage({ ...open, hold: { ...open.hold!, stage: true } }, seed)), aimed.side);
    } catch {
      return null;
    }
  };
  const spinning: Reach = { side: aimed.side, hits: [], random: true, known: false };
  if (state.hold.stage) {
    const rolls = ROLLS.map(run);
    if (rolls.some((roll) => roll === "spin")) return spinning;
    const sets = rolls.filter((roll): roll is string[] => Array.isArray(roll));
    if (sets.length < rolls.length) return null;
    const same = sets.every((roll) => roll.join("|") === sets[0].join("|"));
    if (same) return { side: aimed.side, hits: sets[0], random: false, known: true };
    // Before its roll only what every roll hits is sure.
    return { side: aimed.side, hits: sets[0].filter((hit) => sets.every((roll) => roll.includes(hit))), random: true, known: false };
  }
  const seed = state.hold.seed ?? 0;
  const real = run(seed);
  if (real === "spin") return spinning;
  if (!real) return null;
  // Random when another roll would land elsewhere.
  const random = ROLLS.filter((roll) => roll !== seed).some((roll) => {
    const other = run(roll);
    return !Array.isArray(other) || other.join("|") !== real.join("|");
  });
  return { side: aimed.side, hits: real, random, known: true };
}
