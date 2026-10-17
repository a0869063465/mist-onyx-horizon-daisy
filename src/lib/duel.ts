import {
  DEFAULT_DECK,
  isStill,
  monsterCard,
  spellCard,
  type MonsterCard,
} from "./catalog.ts";
import { chooseSwing, readLean, tilt, type Lean } from "./adapt.ts";
import { readStyle } from "./habits.ts";
import { chipLabel } from "./card-edits.ts";
import { skillVisual } from "./card-fx.ts";
import { findFusion, findKnightFusion } from "./fusion.ts";
import { envFavors } from "./env-kinds.ts";
import { plainCopy } from "./copy-mark.ts";
import type { DecisionLook, EventTarget, HitNote, LookOption, MatchEvent } from "./match-history.ts";

export type Side = 0 | 1;

export type FieldMon = {
  uid: string;
  cardId: string;
  hp: number;
  atk: number;
  def: number;
  mdef: number;
  dim: boolean;
  blocksLeft: number;
  stun: number;
  stance: "attack" | "guard";
  stanceUsed: boolean;
  bleed: number;
  curse: boolean;
  vulnerable: number;
  noBlock: boolean;
  charge: number;
  held: boolean;
  copy: boolean;
  level: number;
  maxHp: number;
  chain?: number;
  gag?: number;
  buff?: { def: number; mdef: number; maxHp: number };
  erode?: { from: Side; left: number | null };
  wet?: number;
  poison?: { stacks: number; left: number | null; perfect: boolean; from: Side; kind: "giant" | "queen" | "perfect" };
  stored?: number;
  blessAtk?: number;
  blessDmg?: number;
  nextDef?: number;
  blessDef?: number;
  blessMdef?: number;
  tempGuard?: number;
  raised?: { atk: number; def: number; mdef: number; hp: number };
  horn?: "plain" | "splash" | "plus";
  hornNew?: boolean;
  gaze?: boolean;
  bolt?: boolean;
  host?: string;
  cover?: boolean;
  glass?: boolean;
  shown?: number;
  clash?: { atk: number; def: number; maxHp: number; mdef?: number };
  pact?: boolean;
  seen?: boolean;
  ward?: "phys" | "spell";
  wardStay?: boolean;
  veil?: boolean;
  edge?: boolean;
  oath?: { phys?: boolean; spell?: boolean };
  oathBack?: { phys?: boolean; spell?: boolean };
  guarding?: boolean;
  oathShot?: boolean;
  riposte?: boolean;
  safe?: number;
  soul?: number;
  vows?: number;
  skillUp?: number;
  /** Thảo nguyên: took part in a clash this turn. */
  meadow?: boolean;
  /** Rừng rậm: form that already got +2 max HP. */
  envHp?: string;
  /** Núi: already got +2 skill damage. */
  envSkill?: boolean;
  path?: number;
  fed?: number;
  spun?: boolean;
  misses?: number;
  shed?: string[];
  lure?: boolean;
  acts?: number;
  preyKind?: "phys" | "spell" | "tru";
  preyAim?: string;
  cage?: boolean;
  cageHp?: number;
  cageMax?: number;
  seized?: boolean;
  debt?: [{ p: number; s: number; t: number }, { p: number; s: number; t: number }];
  hex?: { left: number };
  beat?: number;
};

export type PileMon = { id: string; hp: number; maxHp: number; saved?: Omit<FieldMon, "uid">; toll?: boolean; freeAt?: number };

export type Player = {
  hp: number;
  stars: number;
  starGems: number;
  orb: number;
  flask: number;
  reserve: PileMon[];
  hand: string[];
  tolls?: boolean[];
  monsterDeck: PileMon[];
  spellDeck: string[];
  spellTax?: boolean[];
  spent?: string[];
  field: Array<FieldMon | null>;
  draws: number;
  drawLock?: boolean;
  drawBan?: number;
  summons: number;
  aside?: number;
  acted: boolean;
  turns: number;
  attackLock: number;
  mirror: number;
  sea?: boolean;
  env?: string;
  locked?: [number, number, number];
  hats?: boolean;
  roster?: string[];
};

export type Pending =
  | { kind: "face"; attacker: string; skill?: boolean }
  | { kind: "gnaw"; attacker: string; defender: string }
  | { kind: "gnaw-skill"; caster: string; target: string; index: number }
  | { kind: "melee"; attacker: string; defender: string }
  | { kind: "beam"; caster: string; target: string | null; index: number; back?: boolean; extra?: string | null }
  | { kind: "spell"; owner: Side; cardId: string; target: string | null; source?: string | null }
  | { kind: "lash"; owner: Side; bird: string; foe: string; stun: boolean }
  | null;

export type Hold = {
  priority: Side;
  passed: [boolean, boolean];
  blocker: string | null;
  blockerSkill: boolean;
  armed: string | null;
};

export type Duel = {
  players: [Player, Player];
  turn: Side;
  opening: boolean;
  step: "main" | "respond" | "over";
  pending: Pending;
  hold: Hold | null;
  log: string[];
  events?: MatchEvent[];
  adapt?: Lean;
  live: string;
  stepNo: number;
  winner: Side | null;
  seq: number;
  mode: "ai" | "hotseat" | "net" | "test";
  fx: number;
  tone: "hit" | "spell" | "heal" | "info";
  skill?: { id: string; index: number; aim?: string | null; hits?: string[]; vols?: number[] } | null;
  starPing: { side: Side; stars: number } | null;
  glimpse: string[] | null;
  echo?: string | null;
  last?: string | null;
  upkeep?: string | null;
  gemCap?: Side | null;
  gemWarn?: Side | null;
  gemUsed?: [boolean, boolean];
  gemWarned?: [boolean, boolean];
  legs?: string | null;
  mends?: { uid: string; n: number }[] | null;
  swap?: { first: string | null; side: Side; locked?: string | null } | null;
  virusArm?: { owner: Side; uid: string } | null;
  virus?: { owner: Side } | null;
  soulAsk?: { uid: string; kind: "melee" | "face"; target?: string } | null;
  plumeAsk?: { bird: string; foe: string } | null;
  parley?: {
    queen: string;
    side: Side;
    kind?: "queen" | "mystic";
    step: "pick-victim" | "pick-lunger" | "fight" | "pick-victim2" | "pick-lunger2";
    round: 1 | 2;
    home: Side;
    victim?: string;
    lunger?: string;
    forced?: boolean;
    keep?: Record<string, { dim: boolean; blessAtk: number; blessDmg: number; nextDef: number }>;
  } | null;
  birdAsk?: { uid: string } | null;
  prey?: { side: Side; aim: string; kind: "phys" | "spell" | "tru" } | null;
  preyAsk?: boolean;
  recall?: { side: Side; caps: number[] } | null;
  rite?: { side: Side; slot: 0 | 1 | 2; seq: number } | null;
  ashes?: { side: Side; slots: Array<0 | 1 | 2>; seq: number } | null;
  clock?: number;
  past?: Record<string, { mon: FieldMon; slot: 0 | 1 | 2 }>;
  history?: Array<Record<string, { mon: FieldMon; slot: 0 | 1 | 2 }>>;
  now?: Record<string, { mon: FieldMon; slot: 0 | 1 | 2 }>;
  born?: Record<string, { mon: FieldMon; slot: 0 | 1 | 2 }>;
  reel?: {
    id: number;
    uid: string;
    kind?: "prize" | "gun";
    order?: Array<"phys" | "spell" | "tru">;
    faces: Array<"seven" | "atk" | "def" | "hp" | "six" | "phys" | "spell" | "tru" | "blank"> | null;
    phase: "wait" | "spin";
  } | null;
};

const STAR_COST = [1, 3, 6, 10];

function shuffle<T>(list: T[]): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
  }
  return next;
}

function asPile(id: string, hp?: number, maxHp?: number): PileMon {
  const card = monsterCard(id);
  const cap = maxHp ?? card?.hp ?? 1;
  return { id, maxHp: cap, hp: Math.max(0, Math.min(cap, hp ?? cap)) };
}

function pileFromField(mon: FieldMon): PileMon {
  const { uid: _uid, ...saved } = mon;
  const cap = saved.maxHp || saved.hp;
  return { id: saved.cardId, maxHp: cap, hp: Math.max(0, Math.min(cap, saved.hp)), saved };
}

function pileNow(card: PileMon): number {
  return card.saved ? Math.min(card.hp, card.saved.hp) : card.hp;
}

function woundPile(card: PileMon, dmg: number): PileMon | null {
  const hp = pileNow(card) - dmg;
  if (hp <= 0) return null;
  return { ...card, hp, saved: card.saved ? { ...card.saved, hp } : card.saved };
}

const LIFE = 16;

function emptyPlayer(monsters: string[], spells: string[]): Player {
  const env = spells.find((id) => spellCard(id)?.env);
  const monsterDeck = shuffle(monsters).map((id) => asPile(id));
  const reserve = monsterDeck.splice(0, 2);
  const spellDeck = shuffle(spells.filter((id) => id !== env));
  const spellTax = spellDeck.map(() => false);
  const openingSpell = spellDeck.shift();
  const openingToll = openingSpell ? Boolean(spellTax.shift()) : false;
  return {
    hp: LIFE,
    stars: 0,
    starGems: 0,
    orb: 1,
    flask: 0,
    reserve,
    hand: openingSpell ? [openingSpell] : [],
    tolls: openingSpell ? [openingToll] : [],
    monsterDeck,
    spellDeck,
    spellTax,
    spent: [],
    field: [null, null, null],
    draws: 0,
    summons: 0,
    acted: false,
    turns: 0,
    attackLock: 0,
    mirror: 0,
    env,
    sea: env === "bien-sau",
    roster: [...monsters],
  };
}

function pour(orb: number, flask: number, gain: number): { orb: number; flask: number } {
  const pool = orb + Math.min(1, Math.max(0, flask)) + gain;
  const nextOrb = Math.min(3, pool);
  return { orb: nextOrb, flask: Math.min(1, pool - nextOrb) };
}

function refill(player: Player): Player {
  const angels = player.field.filter((mon) => mon?.cardId === "quai-thu-thien-su").length;
  return { ...player, ...pour(player.orb, player.flask, 1 + angels), draws: 0, summons: 0, aside: 0, acted: false };
}

export function createDuel(
  deck = DEFAULT_DECK,
  mode: Duel["mode"] = "ai",
  foeDeck?: { monsters: string[]; spells: string[] },
): Duel {
  const other = foeDeck ?? deck;
  const players: [Player, Player] = [
    refill(emptyPlayer(deck.monsters, deck.spells)),
    refill(emptyPlayer(other.monsters, other.spells)),
  ];
  if (mode === "test") {
    for (const player of players) {
      player.stars = 4;
      player.starGems = 0;
      player.orb = 3;
      player.flask = 1;
      player.turns = 1;
    }
  }
  return {
    players,
    turn: 0,
    opening: mode !== "test",
    step: "main",
    pending: null,
    hold: null,
    log: [],
    events: [],
    live: "",
    stepNo: 0,
    winner: null,
    seq: 1,
    mode,
    fx: 1,
    tone: "info",
    starPing: null,
    glimpse: null,
    echo: null,
    last: null,
    upkeep: null,
    legs: null,
    clock: 1,
    past: {},
    now: {},
    born: {},
  };
}

function unperiod(line: string) {
  if (line.includes("\n")) return line;
  return line.replace(/[.。]+\s*$/u, "");
}

const wardLines: string[] = [];

function boardStats(state: Duel): Pick<MatchEvent, "hp" | "orb" | "stars"> {
  return {
    hp: [state.players[0].hp, state.players[1].hp],
    orb: [state.players[0].orb, state.players[1].orb],
    stars: [state.players[0].stars, state.players[1].stars],
  };
}

type TraceEvent = {
  kind: MatchEvent["kind"];
  actor: 0 | 1;
  ok: boolean;
  cardId: string | null;
  target: EventTarget;
  end: "damage" | "concede" | null;
  cause?: string | null;
  auto?: boolean;
  hit?: HitNote | null;
};

function freshId(events: MatchEvent[]): string {
  let max = 0;
  for (const row of events) {
    const found = /^e(\d+)$/.exec(row.id ?? "");
    if (found) max = Math.max(max, Number(found[1]));
  }
  return `e${max + 1}`;
}

const LOOK_KINDS = new Set<TraceEvent["kind"]>(["draw", "summon", "attack-monster", "attack-face", "skill", "spell", "block", "pass", "end-turn", "fuse", "cover", "wall"]);
const LOOK_SKILLS: Record<string, Array<{ index: number; cast: "self" | "aim" | "declare" }>> = {
  "te-giac-be-con": [{ index: 0, cast: "self" }],
  "hiep-si-cua-hau": [{ index: 0, cast: "aim" }],
  "mat-do-tan-pha": [{ index: 0, cast: "aim" }],
  "hoa-an-thit-nguoi": [{ index: 0, cast: "aim" }],
  "thuong-quan-long": [{ index: 0, cast: "declare" }],
  "may-nem-bom-hinh-nhen": [{ index: 0, cast: "aim" }],
  "rong-con": [{ index: 0, cast: "aim" }],
  "rong-ngan-tuoi": [{ index: 0, cast: "aim" }],
  "phu-thuy-ti-hon": [{ index: 0, cast: "aim" }],
  "ma-dao-si": [{ index: 0, cast: "aim" }],
  "loi-nguyen-cua-rong": [{ index: 0, cast: "aim" }],
  "rong-ac-ma": [{ index: 0, cast: "aim" }],
  "cuc-bong-ma-quai": [{ index: 0, cast: "aim" }, { index: 1, cast: "self" }],
  "thien-than-be-nho": [{ index: 0, cast: "aim" }, { index: 1, cast: "aim" }],
  "rong-phun-hoa-cau": [{ index: 0, cast: "declare" }, { index: 1, cast: "aim" }],
  "phu-thuy-thoi-gian": [{ index: 0, cast: "aim" }],
  "kiem-si-lua-thieng": [{ index: 0, cast: "aim" }, { index: 1, cast: "aim" }],
  "ong-khong-lo": [{ index: 0, cast: "aim" }],
  "phu-thuy-rung-den": [{ index: 0, cast: "aim" }],
  "mo-voi-ma-mut": [{ index: 0, cast: "aim" }],
  "yeu-tinh-chuc-phuc": [{ index: 0, cast: "aim" }],
  "trieu-hoi-ac-ma": [{ index: 0, cast: "aim" }],
  "sau-non": [{ index: 0, cast: "self" }],
  "ngai-khong-lo": [{ index: 0, cast: "aim" }],
  "ngai-nu-hoang": [{ index: 0, cast: "aim" }],
  "ngai-hoan-my": [{ index: 0, cast: "aim" }],
  "sua-hut-ma-phap": [{ index: 0, cast: "aim" }],
  "con-thinh-no-cua-hai-vuong": [{ index: 0, cast: "aim" }],
  "chien-binh-lan-khuat": [{ index: 0, cast: "self" }],
};
let listingChoices = false;

function manaPool(player: { orb: number; flask: number }) {
  return player.orb + player.flask;
}

function choiceCost(before: Duel, after: Duel, side: Side) {
  return Math.max(0, manaPool(before.players[side]) - manaPool(after.players[side]));
}

function lookCopy(state: Duel): Duel | null {
  try {
    return structuredClone(state);
  } catch {
    return null;
  }
}

function lookProbe(state: Duel, run: (copy: Duel) => Duel): { copy: Duel; next: Duel } | null {
  const copy = lookCopy(state);
  if (!copy) return null;
  const saved = wardLines.splice(0, wardLines.length);
  const charm = charmDamage;
  const hex = skillHex;
  try {
    return { copy, next: run(copy) };
  } catch {
    return null;
  } finally {
    wardLines.splice(0, wardLines.length, ...saved);
    charmDamage = charm;
    skillHex = hex;
  }
}

function lookMon(mon: FieldMon | null): { cardId: string; uid: string; atk: number; def: number; mdef: number; hp: number; dim: boolean; stun: number; stars: number } | null {
  if (!mon) return null;
  return {
    cardId: mon.cardId,
    uid: mon.uid,
    atk: mon.atk,
    def: mon.def,
    mdef: mon.mdef,
    hp: mon.hp,
    dim: mon.dim,
    stun: mon.stun,
    stars: monsterCard(mon.cardId)?.stars ?? 0,
  };
}

function skillLanded(before: Duel, after: Duel, uid: string) {
  const face = after.pending?.kind === "face" && Boolean(after.pending.skill) && after.pending.attacker === uid;
  const beam = after.pending?.kind === "beam" && after.pending.caster === uid;
  const changed = after.players !== before.players || after.winner !== before.winner || after.reel !== before.reel;
  return Boolean(face || beam || changed);
}

function handCopies(hand: readonly string[], cardId: string) {
  let count = 0;
  for (const id of hand) if (id === cardId) count += 1;
  return count;
}

function spellLandedChoice(before: Duel, after: Duel, side: Side, cardId: string) {
  const held = after.pending?.kind === "spell" && after.pending.cardId === cardId;
  const removed = handCopies(before.players[side].hand, cardId) > handCopies(after.players[side].hand, cardId);
  return Boolean(held || removed);
}

function listChoices(state: Duel): LookOption[] {
  const options: LookOption[] = [];
  const seen = new Set<string>();
  const add = (option: LookOption) => {
    if (seen.has(option.id) || options.length >= 79) return;
    seen.add(option.id);
    options.push(option);
  };
  const actor: Side = state.step === "respond" && state.hold ? state.hold.priority : state.turn;
  if (actor !== 0) return options;
  const you = state.players[0];
  const foe = state.players[1];
  const foes = foe.field.filter((mon): mon is FieldMon => Boolean(mon && mon.hp > 0));
  const allies = you.field.filter((mon): mon is FieldMon => Boolean(mon && mon.hp > 0));
  if (state.step === "main" && state.turn === 0 && !state.winner) {
    for (const pile of ["monster", "spell"] as const) {
      const tried = lookProbe(state, (copy) => draw(copy, pile));
      if (!tried || tried.next.players[0].draws <= tried.copy.players[0].draws) continue;
      const cardId = pile === "monster" ? tried.next.players[0].reserve.at(-1)?.id ?? null : tried.next.players[0].hand.at(-1) ?? null;
      add({ id: `draw:${pile}`, kind: "draw", cardId, target: null, cost: choiceCost(tried.copy, tried.next, 0) });
    }
    for (let index = 0; index < you.reserve.length; index += 1) {
      const cardId = you.reserve[index]?.id ?? null;
      if (!cardId) continue;
      for (const slot of [0, 1, 2] as const) {
        const tried = lookProbe(state, (copy) => summon(copy, index, slot));
        if (!tried) continue;
        const gained = tried.next.players[0].field.some((mon) => mon && !tried.copy.players[0].field.some((unit) => unit?.uid === mon.uid));
        if (!gained && tried.next.players[0].summons <= tried.copy.players[0].summons && (tried.next.players[0].aside ?? 0) <= (tried.copy.players[0].aside ?? 0)) continue;
        add({ id: `summon:${index}:${cardId}`, kind: "summon", cardId, target: null, cost: choiceCost(tried.copy, tried.next, 0) });
        break;
      }
    }
    for (const attacker of allies) {
      const face = lookProbe(state, (copy) => attackFace(copy, attacker.uid));
      if (face?.next.pending?.kind === "face" && !face.next.pending.skill) {
        add({ id: `attack-face:${attacker.uid}`, kind: "attack-face", cardId: attacker.cardId, target: { kind: "face" }, cost: choiceCost(face.copy, face.next, 0) });
      }
      for (const defender of foes) {
        const tried = lookProbe(state, (copy) => attackMonster(copy, attacker.uid, defender.uid));
        if (tried?.next.pending?.kind !== "melee") continue;
        add({
          id: `attack-monster:${attacker.uid}:${defender.uid}`,
          kind: "attack-monster",
          cardId: attacker.cardId,
          target: { kind: "monster", cardId: defender.cardId, uid: defender.uid },
          cost: choiceCost(tried.copy, tried.next, 0),
        });
      }
      for (const skill of LOOK_SKILLS[attacker.cardId] ?? []) {
        const targets = skill.cast === "self" ? [null] : [null, ...foes.map((mon) => mon.uid), ...allies.map((mon) => mon.uid)];
        for (const targetUid of targets) {
          const tried = lookProbe(state, (copy) => (skill.cast === "declare" ? declareSkill(copy, attacker.uid, targetUid, skill.index) : useSkill(copy, attacker.uid, targetUid, skill.index)));
          if (!tried || !skillLanded(tried.copy, tried.next, attacker.uid)) continue;
          const target = tried.next.pending?.kind === "face" && tried.next.pending.skill
            ? ({ kind: "face" } as const)
            : targetUid
              ? monsterTarget(state, targetUid)
              : null;
          const key = target?.kind === "face" ? "face" : target?.kind === "monster" ? target.uid ?? "mon" : "none";
          add({ id: `skill:${attacker.uid}:${skill.index}:${key}`, kind: "skill", cardId: attacker.cardId, target, cost: choiceCost(tried.copy, tried.next, 0) });
        }
      }
    }
    for (let index = 0; index < you.reserve.length; index += 1) {
      for (const host of allies) {
        const tried = lookProbe(state, (copy) => fuse(copy, index, host.uid, 0));
        if (!tried || tried.next.players === tried.copy.players) continue;
        add({
          id: `fuse:${index}:${host.uid}`,
          kind: "fuse",
          cardId: you.reserve[index]?.id ?? null,
          target: { kind: "monster", cardId: host.cardId, uid: host.uid },
          cost: choiceCost(tried.copy, tried.next, 0),
        });
      }
    }
    const ended = lookProbe(state, (copy) => endTurn(copy));
    if (ended && (ended.next.turn !== ended.copy.turn || ended.next.winner !== ended.copy.winner)) {
      add({ id: "end-turn", kind: "end-turn", cardId: null, target: null, cost: 0 });
    }
  }
  if (state.step === "respond" && state.hold?.priority === 0 && state.pending) {
    if (state.pending.kind === "face") {
      for (const mon of allies) {
        const tried = lookProbe(state, (copy) => assignBlock(copy, mon.uid, false));
        if (tried?.next.hold?.blocker !== mon.uid) continue;
        const attacker = state.pending.attacker;
        add({ id: `block:${mon.uid}`, kind: "block", cardId: mon.cardId, target: monsterTarget(state, attacker), cost: choiceCost(tried.copy, tried.next, 0) });
      }
    }
    const passed = lookProbe(state, (copy) => passResponse(copy));
    if (passed && (passed.next.pending !== passed.copy.pending || passed.next.step !== passed.copy.step || passed.next.winner !== passed.copy.winner || passed.next.hold === null)) {
      add({ id: "pass", kind: "pass", cardId: null, target: null, cost: 0 });
    }
    for (const mon of allies) {
      if (canWall(state, mon.uid)) {
        const tried = lookProbe(state, (copy) => wallAlly(copy, mon.uid));
        if (tried && tried.next.players !== tried.copy.players) {
          add({ id: `wall:${mon.uid}`, kind: "wall", cardId: mon.cardId, target: null, cost: choiceCost(tried.copy, tried.next, 0) });
        }
      }
      if (canGuardCover(state, mon.uid)) {
        const tried = lookProbe(state, (copy) => guardCover(copy, mon.uid));
        if (tried && tried.next.players !== tried.copy.players) {
          add({ id: `cover:${mon.uid}`, kind: "cover", cardId: mon.cardId, target: null, cost: choiceCost(tried.copy, tried.next, 0) });
        }
      }
    }
  }
  if ((state.step === "main" && state.turn === 0) || (state.step === "respond" && state.hold?.priority === 0)) {
    const aims = [null, ...allies.map((mon) => mon.uid), ...foes.map((mon) => mon.uid)];
    for (let index = 0; index < you.hand.length; index += 1) {
      const cardId = you.hand[index] ?? null;
      if (!cardId) continue;
      for (const targetUid of aims) {
        const tried = lookProbe(state, (copy) => castSpell(copy, index, targetUid));
        if (!tried || !spellLandedChoice(tried.copy, tried.next, 0, cardId)) continue;
        const key = targetUid ?? "none";
        add({ id: `spell:${index}:${cardId}:${key}`, kind: "spell", cardId, target: targetUid ? monsterTarget(state, targetUid) : null, cost: choiceCost(tried.copy, tried.next, 0) });
      }
    }
  }
  return options;
}

function chosenLookId(before: Duel, after: Duel, event: TraceEvent, options: LookOption[]): string | null {
  if (event.kind === "draw") {
    const pile = event.cardId && monsterCard(event.cardId) ? "monster" : "spell";
    return options.find((option) => option.id === `draw:${pile}`)?.id ?? options.find((option) => option.kind === "draw")?.id ?? null;
  }
  if (event.kind === "summon") {
    return options.find((option) => option.kind === "summon" && option.cardId === event.cardId)?.id ?? null;
  }
  if (event.kind === "attack-face") {
    const uid = before.players[0].field.find((mon) => mon?.cardId === event.cardId)?.uid;
    return options.find((option) => option.kind === "attack-face" && (!uid || option.id.endsWith(`:${uid}`)))?.id ?? null;
  }
  if (event.kind === "attack-monster") {
    const target = event.target?.kind === "monster" ? event.target.uid : null;
    return options.find((option) => option.kind === "attack-monster" && option.cardId === event.cardId && option.target?.kind === "monster" && option.target.uid === target)?.id ?? null;
  }
  if (event.kind === "skill") {
    const index = after.skill?.index ?? (after.pending?.kind === "beam" ? after.pending.index : null);
    const target = event.target?.kind === "face" ? "face" : event.target?.kind === "monster" ? event.target.uid ?? "mon" : "none";
    const uid = before.players[0].field.find((mon) => mon?.cardId === event.cardId)?.uid;
    return options.find((option) => option.kind === "skill" && option.cardId === event.cardId && (index == null || option.id.includes(`:${index}:`)) && option.id.endsWith(`:${target}`) && (!uid || option.id.startsWith(`skill:${uid}:`)))?.id
      ?? options.find((option) => option.kind === "skill" && option.cardId === event.cardId)?.id
      ?? null;
  }
  if (event.kind === "spell") {
    const key = event.target?.kind === "monster" ? event.target.uid ?? "none" : "none";
    return options.find((option) => option.kind === "spell" && option.cardId === event.cardId && option.id.endsWith(`:${key}`))?.id ?? null;
  }
  if (event.kind === "block") {
    return options.find((option) => option.kind === "block" && option.cardId === event.cardId)?.id ?? null;
  }
  if (event.kind === "fuse") {
    return options.find((option) => option.kind === "fuse" && option.cardId === event.cardId)?.id ?? null;
  }
  if (event.kind === "wall" || event.kind === "cover") {
    return options.find((option) => option.kind === event.kind && option.cardId === event.cardId)?.id ?? null;
  }
  if (event.kind === "pass" || event.kind === "end-turn") {
    return options.find((option) => option.kind === event.kind)?.id ?? null;
  }
  return null;
}

function buildLook(before: Duel, after: Duel, event: TraceEvent): DecisionLook | undefined {
  const options = listChoices(before);
  let pick = chosenLookId(before, after, event, options);
  if (!pick) {
    pick = `done:${event.kind}:${event.cardId ?? "none"}`;
    options.push({ id: pick, kind: (LOOK_KINDS.has(event.kind) ? event.kind : "pass") as LookOption["kind"], cardId: event.cardId, target: event.target, cost: choiceCost(before, after, 0) });
  }
  return {
    turn: before.turn,
    step: before.step,
    hp: [before.players[0].hp, before.players[1].hp],
    orb: [before.players[0].orb, before.players[1].orb],
    flask: [before.players[0].flask, before.players[1].flask],
    stars: [before.players[0].stars, before.players[1].stars],
    hand: [[...before.players[0].hand], [...before.players[1].hand]],
    reserve: [before.players[0].reserve.map((card) => card.id), before.players[1].reserve.map((card) => card.id)],
    field: [before.players[0].field.map((mon) => lookMon(mon)), before.players[1].field.map((mon) => lookMon(mon))],
    pending: before.pending?.kind ?? null,
    options,
    pick,
  };
}

function traced(before: Duel, after: Duel, event: TraceEvent): Duel {
  const start = before.events?.length ?? 0;
  const current = after.events ?? [];
  if (event.kind !== "result" && current.slice(start).some((row) => row.kind === event.kind && row.actor === event.actor)) return after;
  let look: DecisionLook | undefined;
  if (!listingChoices && event.actor === 0 && event.ok && event.auto !== true && LOOK_KINDS.has(event.kind)) {
    listingChoices = true;
    try {
      look = buildLook(before, after, event);
    } catch {
      look = undefined;
    } finally {
      listingChoices = false;
    }
  }
  const row: MatchEvent = {
    cause: null,
    auto: false,
    hit: null,
    ...event,
    ...(look ? { look } : {}),
    n: start + 1,
    id: freshId(current),
    ...boardStats(after),
  };
  const events = [...current.slice(0, start), row, ...current.slice(start)].map((item, index) => ({ ...item, n: index + 1 }));
  return { ...after, events };
}

function debtSum(mon: { debt?: [{ p: number; s: number; t: number }, { p: number; s: number; t: number }] } | null | undefined): number {
  if (!mon?.debt) return 0;
  return mon.debt[0].p + mon.debt[0].s + mon.debt[0].t + mon.debt[1].p + mon.debt[1].s + mon.debt[1].t;
}

function causeOf(state: Duel): { id: string | null; actor: 0 | 1; cardId: string | null } {
  const rows = state.events ?? [];
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    if (!row || row.auto || !row.ok) continue;
    if (row.kind === "result" || row.kind === "pass" || row.kind === "win" || row.kind === "block" || row.kind === "wall" || row.kind === "cover") continue;
    return { id: row.id ?? null, actor: row.actor, cardId: row.cardId };
  }
  return { id: null, actor: state.turn, cardId: null };
}

function collectHits(before: Duel, after: Duel, flags: { blocked: boolean; reflect: boolean; turn: boolean }): HitNote[] {
  const notes: HitNote[] = [];
  for (const side of [0, 1] as const) {
    const previousHp = before.players[side].hp;
    const nextHp = after.players[side].hp;
    if (nextHp < previousHp) {
      notes.push({
        who: side,
        to: "face",
        cardId: null,
        uid: null,
        before: previousHp,
        after: nextHp,
        dealt: previousHp - nextHp,
        blocked: flags.blocked,
        reflect: flags.reflect,
        delayed: false,
      });
    }
    const older = new Map(before.players[side].field.flatMap((mon) => (mon ? [[mon.uid, mon] as const] : [])));
    const still = new Set(after.players[side].field.flatMap((mon) => (mon ? [mon.uid] : [])));
    for (const mon of after.players[side].field) {
      if (!mon) continue;
      const prev = older.get(mon.uid);
      if (!prev) continue;
      const queued = debtSum(mon) - debtSum(prev);
      const dropped = mon.hp < prev.hp;
      if (!dropped && queued <= 0) continue;
      notes.push({
        who: side,
        to: "monster",
        cardId: mon.cardId,
        uid: mon.uid,
        before: prev.hp,
        after: mon.hp,
        dealt: Math.max(0, prev.hp - mon.hp),
        blocked: flags.blocked,
        reflect: flags.reflect,
        delayed: flags.turn ? queued < 0 : queued > 0,
      });
    }
    for (const [uid, prev] of older) {
      if (still.has(uid) || prev.hp <= 0) continue;
      notes.push({
        who: side,
        to: "monster",
        cardId: prev.cardId,
        uid,
        before: prev.hp,
        after: 0,
        dealt: prev.hp,
        blocked: flags.blocked,
        reflect: flags.reflect,
        delayed: flags.turn && debtSum(prev) > 0,
      });
    }
  }
  if (notes.length === 0 && flags.blocked) {
    const uid = before.hold?.blocker;
    const mon = uid ? before.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null : null;
    if (mon) {
      const owner = (before.players[0].field.some((unit) => unit?.uid === mon.uid) ? 0 : 1) as 0 | 1;
      const now = after.players[owner].field.find((unit) => unit?.uid === mon.uid);
      notes.push({
        who: owner,
        to: "monster",
        cardId: mon.cardId,
        uid: mon.uid,
        before: mon.hp,
        after: now?.hp ?? mon.hp,
        dealt: 0,
        blocked: true,
        reflect: flags.reflect,
        delayed: false,
      });
    }
  }
  return notes;
}

function withResults(before: Duel, after: Duel, flags: { blocked: boolean; reflect: boolean; turn: boolean }): Duel {
  if (after === before) return after;
  const start = before.events?.length ?? 0;
  if ((after.events ?? []).slice(start).some((row) => row.kind === "result")) return after;
  const hits = collectHits(before, after, flags);
  if (hits.length === 0) return after;
  const cause = causeOf(after);
  let next = after;
  for (const hit of hits) {
    next = {
      ...next,
      events: (() => {
        const current = next.events ?? [];
        const row: MatchEvent = {
          n: current.length + 1,
          id: freshId(current),
          actor: cause.actor,
          kind: "result",
          ok: true,
          auto: true,
          cause: cause.id,
          cardId: cause.cardId,
          target: hit.to === "face" ? { kind: "face" } : { kind: "monster", cardId: hit.cardId, uid: hit.uid },
          hit,
          end: null,
          ...boardStats(next),
        };
        return [...current, row];
      })(),
    };
  }
  return next;
}

function traceSkill(before: Duel, after: Duel, uid: string, targetUid: string | null): Duel {
  if (after === before) return after;
  const mon = before.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
  const face = after.pending?.kind === "face" && Boolean(after.pending.skill);
  const beam = after.pending?.kind === "beam" && after.pending.caster === uid;
  const changed = after.players !== before.players || after.winner !== before.winner || after.reel !== before.reel;
  const ok = face || beam || changed;
  if (!ok && after.upkeep && !before.upkeep && after.players === before.players) return after;
  if (!ok && after.fx === before.fx && after.pending === before.pending) return after;
  const target = face ? ({ kind: "face" } as const) : targetUid ? monsterTarget(before, targetUid) : null;
  return traced(before, after, { kind: "skill", actor: before.turn, ok, cardId: mon?.cardId ?? null, target, end: null });
}

function monsterTarget(state: Duel, uid: string | null | undefined): EventTarget {
  if (!uid) return null;
  const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid);
  return { kind: "monster", cardId: mon?.cardId ?? null, uid };
}

function note(state: Duel, line: string, tone: Duel["tone"] = "info"): Duel {
  const stepNo = state.stepNo + 1;
  const extra = state.starPing
    ? ` ${sideName(state.starPing.side)} có thể triệu hồi quái thú ${state.starPing.stars} sao`
    : "";
  const ward = wardLines.length ? ` ${wardLines.splice(0).join(" ")}` : "";
  const text = unperiod(`${stepNo}. ${unperiod(line)}${ward}${extra}`);
  return soulSync(reapVirus({
    ...state,
    starPing: null,
    stepNo,
    fx: state.fx + 1,
    tone,
    skill: null,
    log: [...state.log, text],
    live: text,
    mends: null,
  }));
}

function pingStars(state: Duel, side: Side, before: number, after: number): Duel {
  if (after <= before) return state;
  return { ...state, starPing: { side, stars: after } };
}

function departed(before: Array<FieldMon | null>, after: Array<FieldMon | null>): string[] {
  const stay = new Set(after.filter((mon): mon is FieldMon => Boolean(mon)).map((mon) => mon.uid));
  return before.filter((mon): mon is FieldMon => Boolean(mon && !stay.has(mon.uid))).map((mon) => mon.cardId);
}

function envForm(mon: FieldMon): string {
  return mon.cardId === "te-giac-be-con" ? `${mon.cardId}:${mon.level ?? 1}` : mon.cardId;
}

/** Rừng rậm: +2 max HP and HP. Núi: +2 skill damage. Applied once per form while the card is on the field. */
function envBoost(player: Player): Player {
  const env = player.env;
  if (env !== "rung-ram" && env !== "nui") return player;
  let changed = false;
  const field = player.field.map((mon) => {
    if (!mon || mon.hp <= 0 || !envFavors(env, mon.cardId)) return mon;
    if (env === "rung-ram") {
      const form = envForm(mon);
      if (mon.envHp === form) return mon;
      changed = true;
      return { ...mon, maxHp: (mon.maxHp || mon.hp) + 2, hp: mon.hp + 2, raised: markRaised(mon, { hp: 2 }), envHp: form };
    }
    if (mon.envSkill) return mon;
    changed = true;
    return { ...mon, skillUp: (mon.skillUp ?? 0) + 2, envSkill: true };
  });
  return changed ? { ...player, field: field as Player["field"] } : player;
}

function patch(state: Duel, side: Side, rawPlayer: Player): Duel {
  const player = envBoost(rawPlayer);
  const prev = state.players[side];
  const gone = [
    ...departed(prev.field, player.field),
    ...(prev.env && prev.env !== player.env ? [prev.env] : []),
  ];
  const spent = [...(player.spent ?? prev.spent ?? []), ...gone];
  const players = [...state.players] as [Player, Player];
  players[side] = tidyHats({ ...player, spent });
  let born = state.born;
  player.field.forEach((mon, slot) => {
    if (!mon || born?.[mon.uid]) return;
    born = { ...(born ?? {}), [mon.uid]: { mon: structuredClone(mon), slot: slot as 0 | 1 | 2 } };
  });
  return { ...state, players, born };
}

function cardOf(mon: FieldMon): MonsterCard {
  if (mon.cardId === "mu") {
    return { id: "mu", name: "Mũ", stars: 0, gems: 0, atk: 0, def: 0, mdef: 0, hp: 1, art: "mu", skill: "" };
  }
  const card = monsterCard(mon.cardId);
  if (!card) throw new Error(mon.cardId);
  if (mon.cardId === "te-giac-be-con") return { ...card, name: rhinoForm(mon.level ?? 1).name };
  return card;
}

const RHINO_IDS = ["te-giac-be-con", "te-giac-hieu-thang", "te-giac-chien-binh"] as const;

function rhinoForm(level: number) {
  const card = monsterCard(RHINO_IDS[Math.min(3, Math.max(1, level)) - 1]);
  const baby = skillText("te-giac-be-con");
  const section = level >= 3 ? (baby.split(/lv\s*3/i)[1] ?? "") : level === 2 ? (baby.split(/lv\s*2/i)[1] ?? "").split(/lv\s*3/i)[0] : "";
  const text = section || plainCopy(card?.skill || "");
  return {
    name: card?.name ?? "Tê giác",
    atk: grabNums(text, NUM_ATK)[0] ?? card?.atk ?? 0,
    def: grabNums(text, NUM_DEF)[0] ?? card?.def ?? 0,
    mdef: grabNums(text, NUM_MDEF)[0] ?? card?.mdef ?? 0,
    hp: grabNums(text, NUM_HP)[0] ?? card?.hp ?? 1,
  };
}

export function fieldName(mon: { cardId: string; level?: number }): string {
  if (mon.cardId === "mu") return "Mũ";
  if (mon.cardId === "te-giac-be-con") return rhinoForm(mon.level ?? 1).name;
  return monsterCard(mon.cardId)?.name ?? "";
}

function clashGrow(mon: FieldMon): FieldMon {
  if (mon.cardId !== "te-giac-be-con" || (mon.level ?? 1) < 3 || mon.hp <= 0) return mon;
  const maxHp = (mon.maxHp || mon.hp) + 1;
  return { ...mon, maxHp, hp: mon.hp + 1, raised: markRaised(mon, { hp: 1 }) };
}

function rhinoRankCost(level: number) {
  const costs = grabNums(skillText("te-giac-be-con"), /tiêu(?:\s*hao)?\s*(\d+)\s*mana/gi);
  if (level >= 2) return costs[1] ?? 2;
  return costs[0] ?? 1;
}

function isSpecial(mon: FieldMon) {
  if (mon.cardId === "te-giac-chien-binh") return false;
  if (mon.cardId === "te-giac-hieu-thang") return true;
  return mon.cardId === "te-giac-be-con" && (mon.level ?? 1) < 3;
}

function evolveSpecial(mon: FieldMon): FieldMon {
  const form = rhinoForm(3);
  const missing = Math.max(0, (mon.maxHp || mon.hp) - mon.hp);
  const maxHp = form.hp;
  return { ...mon, cardId: "te-giac-be-con", level: 3, atk: form.atk, def: form.def, mdef: form.mdef, maxHp, hp: Math.max(1, maxHp - missing) };
}

function evolveImmortal(mon: FieldMon): FieldMon {
  if (mon.cardId !== "rong-con") return mon;
  const card = monsterCard("rong-ngan-tuoi");
  if (!card) return mon;
  const missing = Math.max(0, (mon.maxHp || mon.hp) - mon.hp);
  const maxHp = card.hp;
  return { ...mon, cardId: card.id, level: 1, atk: card.atk, def: card.def, mdef: card.mdef, maxHp, hp: Math.max(1, maxHp - missing), raised: undefined };
}

function timeWave(mon: FieldMon, enemy: boolean): FieldMon | null {
  if (enemy) {
    if (!isImmortal(mon)) return null;
    return mon.cardId === "rong-con" ? evolveImmortal(mon) : buffMon(mon);
  }
  if (cardStars(mon.cardId, mon.level ?? 1) >= 3) return mon;
  if (isImmortal(mon)) return evolveImmortal(mon);
  if (isSpecial(mon)) return evolveSpecial(mon);
  return buffMon(mon);
}

export function chronoChoice(state: Duel, casterUid: string, targetUid: string): "kill" | "evolve" | "age" | null {
  if (targetUid === casterUid) return null;
  const side = state.turn;
  const you = state.players[side];
  const foe = state.players[(1 - side) as Side];
  const ally = you.field.find((unit) => unit?.uid === targetUid) ?? null;
  const enemy = foe.field.find((unit) => unit?.uid === targetUid) ?? null;
  const mon = ally ?? enemy;
  if (!mon) return null;
  if (enemy && !canTargetFoe(state)) return null;
  if (enemy) return "kill";
  if (ally && isSpecial(ally)) return "evolve";
  return "age";
}

export function chronoHighAlly(state: Duel, casterUid: string, targetUid: string): boolean {
  const you = state.players[state.turn];
  const ally = you.field.find((unit) => unit?.uid === targetUid && unit.uid !== casterUid) ?? null;
  if (!ally || isSpecial(ally) || isImmortal(ally)) return false;
  return cardStars(ally.cardId, ally.level ?? 1) >= 3;
}

function isImmortal(mon: FieldMon) {
  return mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi";
}

function pct35(n: number) {
  return Math.round(n * 0.35);
}

function markRaised(mon: FieldMon, part: { atk?: number; def?: number; mdef?: number; hp?: number }) {
  const cur = mon.raised ?? { atk: 0, def: 0, mdef: 0, hp: 0 };
  return {
    atk: cur.atk + (part.atk ?? 0),
    def: cur.def + (part.def ?? 0),
    mdef: cur.mdef + (part.mdef ?? 0),
    hp: cur.hp + (part.hp ?? 0),
  };
}

function ageMon(mon: FieldMon): FieldMon {
  const cut = (n: number) => Math.max(0, n - pct35(n));
  const atk = cut(mon.atk);
  const def = cut(mon.def);
  const mdef = cut(mon.mdef);
  const base = mon.maxHp || mon.hp;
  const maxHp = Math.max(1, base - pct35(base));
  const hp = Math.max(0, Math.min(maxHp, mon.hp - pct35(mon.hp)));
  const raised = mon.raised
    ? {
        atk: Math.max(0, mon.raised.atk - (mon.atk - atk)),
        def: Math.max(0, mon.raised.def - (mon.def - def)),
        mdef: Math.max(0, mon.raised.mdef - (mon.mdef - mdef)),
        hp: Math.max(0, mon.raised.hp - (base - maxHp)),
      }
    : undefined;
  return { ...mon, atk, def, mdef, maxHp, hp, raised };
}

const TIME_WEDGE = [2, 1, 1, 2, 1, 1];

export function rollTimeSector(): number {
  let roll = Math.floor(Math.random() * 8);
  for (let index = 0; index < TIME_WEDGE.length; index += 1) {
    if (roll < TIME_WEDGE[index]) return index;
    roll -= TIME_WEDGE[index];
  }
  return 0;
}

function wheelLanded(extra: string | null): boolean {
  if (extra === "hit") return true;
  if (extra === "miss") return false;
  return rollTimeSector() % 3 === 0;
}

function breakWitch(state: Duel, side: Side, owner: Player, uid: string, beforeStars: number): Duel {
  const field = owner.field.map((unit) => (unit?.uid === uid ? { ...unit, hp: 0 } : unit));
  const next = pingStars(patch(state, side, dropDead({ ...owner, field })), side, beforeStars, owner.stars);
  return note(next, `Vòng quay trượt. ${monsterCard("phu-thuy-thoi-gian")?.name ?? "Phù thuỷ thời gian"} tự huỷ.`, "spell");
}

function buffMon(mon: FieldMon): FieldMon {
  const atk = pct35(mon.atk);
  if (mon.cage) return { ...mon, atk: mon.atk + atk, raised: markRaised(mon, { atk }) };
  const def = pct35(mon.def);
  const mdef = pct35(mon.mdef);
  const hp = pct35(mon.maxHp || mon.hp);
  return {
    ...mon,
    atk: mon.atk + atk,
    def: mon.def + def,
    mdef: mon.mdef + mdef,
    maxHp: (mon.maxHp || mon.hp) + hp,
    hp: mon.hp + hp,
    raised: markRaised(mon, { atk, def, mdef, hp }),
  };
}

export function sideName(side: Side): string {
  return side === 0 ? "Bạn" : "Đối thủ";
}

export function testGrant(state: Duel, side: Side, cardId: string, ontoField: boolean): Duel {
  if (state.mode !== "test" || state.winner || state.step === "over") return state;
  const you = state.players[side];
  const monster = monsterCard(cardId);
  const spell = spellCard(cardId);
  if (ontoField) {
    if (!monster) return state;
    const slot = you.field.findIndex((cell) => !cell);
    if (slot < 0) return note(state, "Hết ô trống.");
    const field = [...you.field] as Player["field"];
    const next = place({ ...state, seq: state.seq + 1 }, side, cardId);
    if (cardId === "kazura") next.dim = true;
    field[slot] = next;
    const vow = absorbVow({ ...you, field }, next.uid);
    const line = vow.eaten ? `${monster.name} bị hiến tế.` : `Thử triệu hồi ${monster.name}.`;
    return note(
      patch(
        { ...state, seq: state.seq + 2, rite: vow.eaten ? { side, slot: slot as 0 | 1 | 2, seq: state.seq + 1 } : state.rite },
        side,
        vow.player,
      ),
      line,
    );
  }
  if (spell) return note(patch(state, side, { ...you, hand: [...you.hand, cardId], tolls: [...handTolls(you), false] }), `Thử cầm phép ${spell.name}.`);
  if (!monster) return state;
  return note(patch(state, side, { ...you, reserve: [...you.reserve, asPile(cardId)] }), `Thử cầm quái ${monster.name}.`);
}

export function testEnv(state: Duel, side: Side, cardId: string): Duel {
  if (state.mode !== "test" || state.winner || state.step === "over") return state;
  const spell = spellCard(cardId);
  if (!spell?.env) return state;
  const you = state.players[side];
  return note(patch(state, side, { ...you, env: cardId, sea: cardId === "bien-sau" }), `${spell.name} đã nằm trên sân.`);
}

function freshTestMon(state: Duel, side: Side, mon: FieldMon): FieldMon {
  const next = place(state, side, mon.cardId);
  next.uid = mon.uid;
  if (mon.cardId === "kazura") next.dim = true;
  return next;
}

function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left == null || right == null) return left == null && right == null;
  if (typeof left !== "object" || typeof right !== "object") return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (!sameValue(a[key], b[key])) return false;
  return true;
}

export function canTestReset(state: Duel): boolean {
  if (state.mode !== "test" || state.winner || state.step === "over") return false;
  if (state.step !== "main" || state.pending || state.hold || state.echo || state.last || state.upkeep || state.legs || state.glimpse || state.reel) return true;
  return state.players.some((player, index) => {
    if (player.orb !== 3 || player.flask !== 1) return true;
    return player.field.some((mon) => mon && monsterCard(mon.cardId) && !sameValue(mon, freshTestMon(state, index as Side, mon)));
  });
}

export function testReset(state: Duel): Duel {
  if (state.mode !== "test" || state.winner || state.step === "over") return state;
  const players = state.players.map((player, index) => {
    const side = index as Side;
    const field = player.field.map((mon) => {
      if (!mon || !monsterCard(mon.cardId)) return mon;
      return freshTestMon(state, side, mon);
    }) as Player["field"];
    return { ...player, field, orb: 3, flask: 1 };
  }) as [Player, Player];
  return note(
    { ...state, players, step: "main", pending: null, hold: null, echo: null, last: null, upkeep: null, legs: null, glimpse: null, reel: null },
    "Reset quân bài và mana.",
  );
}

export function concede(state: Duel, side: Side): Duel {
  if (state.winner) return state;
  const winner = (side === 0 ? 1 : 0) as Side;
  return traced(state, {
    ...state,
    winner,
    step: "over",
    pending: null,
    hold: null,
    live: unperiod(`${sideName(winner)} thắng`),
  }, { kind: "concede", actor: side, ok: true, cardId: null, target: null, end: "concede" });
}

function grantUsed(player: Player, amount: number): Player {
  let starGems = player.starGems + amount;
  let stars = player.stars;
  while (stars < STAR_COST.length && starGems >= STAR_COST[stars]) {
    starGems -= STAR_COST[stars];
    stars += 1;
  }
  return { ...player, starGems, stars };
}

function bank(player: Player, amount: number): Player {
  return { ...grantUsed(player, amount), orb: player.orb - amount };
}

function pay(player: Player, amount: number): Player | null {
  if (amount <= 0) return player;
  if (player.orb < amount) return null;
  return bank(player, amount);
}

function talkLock(state: Duel): Duel | null {
  if (state.preyAsk) return note(state, "Hãy chọn có truy sát không.");
  if (state.parley && state.step === "main") return note(state, "Hãy chọn quái cho Đàm phán.");
  return null;
}

function freeTalk(state: Duel, run: (state: Duel) => Duel): Duel {
  if (!state.parley) return run(state);
  const talk = state.parley;
  const snap: [number, number] = [state.players[0].orb, state.players[1].orb];
  let boosted: Duel = { ...state, parley: null };
  for (const side of [0, 1] as const) {
    const you = boosted.players[side];
    boosted = patch(boosted, side, { ...you, orb: you.orb + 40 });
  }
  const next = run(boosted);
  let restored = next;
  for (const side of [0, 1] as const) {
    const you = restored.players[side];
    const orb = Math.max(snap[side], you.orb - 40);
    if (orb !== you.orb) restored = patch(restored, side, { ...restored.players[side], orb });
  }
  return { ...restored, parley: restored.parley ?? talk };
}

function playBill(gems: number, tolled: boolean, orb: number, flask: number): string | null {
  if (!tolled) return orb < gems ? `Cần ${gems} gem.` : null;
  if (gems >= 3) {
    if (orb < gems) return `Cần ${gems} gem.`;
    if (flask < 1) return "Cần 1 ngọc trong bình.";
    return null;
  }
  return orb < gems + 1 ? `Cần ${gems + 1} gem.` : null;
}

function payPlayed(player: Player, gems: number, tolled: boolean): Player | null {
  if (!tolled) return pay(player, gems);
  if (gems >= 3) {
    const paid = pay(player, gems);
    const flask = Math.min(1, paid?.flask ?? 0);
    if (!paid || flask < 1) return null;
    return { ...paid, flask: flask - 1 };
  }
  return pay(player, gems + 1);
}

function handTolls(player: Player): boolean[] {
  return player.hand.map((_, index) => Boolean(player.tolls?.[index]));
}

function dropHandCard(player: Player, index: number): Player {
  return {
    ...player,
    hand: player.hand.filter((_, at) => at !== index),
    tolls: handTolls(player).filter((_, at) => at !== index),
  };
}

export function digChoices(state: Duel, side: Side): Array<{ id: string; kind: "monster" | "spell" }> {
  const foe = state.players[(1 - side) as Side];
  const seen = new Set<string>();
  const choices: Array<{ id: string; kind: "monster" | "spell" }> = [];
  for (const id of foe.spent ?? []) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (monsterCard(id)) choices.push({ id, kind: "monster" });
    else if (spellCard(id)) choices.push({ id, kind: "spell" });
  }
  return choices;
}

export function digGrave(state: Duel, handIndex: number, cardId: string): Duel {
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
  const side = state.turn;
  const player = state.players[side];
  if (player.hand[handIndex] !== "ke-dao-mo") return state;
  const choice = digChoices(state, side).find((row) => row.id === cardId);
  if (!choice) return note(state, "Lá đó chưa rời sân.");
  const tolled = Boolean(player.tolls?.[handIndex]);
  const bill = playBill(0, tolled, player.orb, player.flask);
  if (bill) return note(state, bill);
  const paid = payPlayed(player, 0, tolled);
  if (!paid) return note(state, bill ?? "Cần gem.");
  const dropped = dropHandCard(paid, handIndex);
  let nextPlayer: Player = { ...dropped, spent: [...(dropped.spent ?? []), "ke-dao-mo"] };
  if (choice.kind === "monster") {
    nextPlayer = { ...nextPlayer, reserve: [...nextPlayer.reserve, { ...asPile(cardId), toll: true }] };
  } else {
    nextPlayer = { ...nextPlayer, hand: [...nextPlayer.hand, cardId], tolls: [...handTolls(nextPlayer), true] };
  }
  return patch({ ...state, seq: state.seq + 1 }, side, nextPlayer);
}

function plainHat(mon: FieldMon): FieldMon {
  const hp = Math.max(0, Math.min(1, mon.hp));
  return {
    ...mon,
    cardId: "mu",
    hp,
    maxHp: 1,
    atk: 0,
    def: 0,
    mdef: 0,
    dim: true,
    noBlock: true,
    stun: 0,
    curse: false,
    vulnerable: 0,
    bleed: 0,
    chain: 0,
    gag: 0,
    poison: undefined,
    erode: undefined,
    wet: undefined,
    blessAtk: 0,
    blessDmg: 0,
    blessDef: 0,
    blessMdef: 0,
    hex: undefined,
    raised: undefined,
    buff: undefined,
    horn: undefined,
    gaze: undefined,
    clash: undefined,
    glass: undefined,
  };
}

function tidyHats(player: Player): Player {
  const field = player.field.map((mon) => {
    if (!mon || mon.cardId !== "mu") return mon;
    return mon.hp <= 0 ? null : plainHat(mon);
  }) as Player["field"];
  const reals = field.filter((mon) => mon && mon.cardId !== "mu").length;
  const tokens = field.filter((mon) => mon?.cardId === "mu").length;
  const hats = player.hats && !(reals === 1 && tokens === 0) && reals > 0 ? true : player.hats ? false : player.hats;
  return { ...player, field, hats };
}

function mixRow(field: Array<FieldMon | null>): Array<FieldMon | null> {
  const next = [...field];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
  }
  return next;
}

function makeHat(seq: number, side: Side, n: number): FieldMon {
  return {
    uid: `${side}-mu-${seq}-${n}`,
    cardId: "mu",
    hp: 1,
    atk: 0,
    def: 0,
    mdef: 0,
    maxHp: 1,
    dim: true,
    blocksLeft: 0,
    stun: 0,
    stance: "attack",
    stanceUsed: false,
    bleed: 0,
    curse: false,
    vulnerable: 0,
    noBlock: true,
    charge: 0,
    held: false,
    copy: false,
    level: 1,
  };
}

function place(state: Duel, side: Side, cardId: string, held?: PileMon): FieldMon {
  const card = monsterCard(cardId);
  if (!card) throw new Error(cardId);
  const used = new Set<string>();
  for (const player of state.players) for (const mon of player.field) if (mon) used.add(mon.uid);
  let seq = state.seq;
  let uid = `${side}-${seq}`;
  while (used.has(uid)) {
    seq += 1;
    uid = `${side}-${seq}`;
  }
  if (held?.saved) {
    const cap = held.saved.maxHp || held.maxHp;
    return { ...held.saved, uid, hp: Math.min(held.hp, held.saved.hp, cap), maxHp: cap };
  }
  const maxHp = held?.maxHp ?? card.hp;
  return {
    uid,
    cardId,
    hp: held ? Math.min(held.hp, maxHp) : card.hp,
    atk: card.atk,
    def: card.def,
    mdef: card.mdef,
    dim: false,
    blocksLeft: card.name === "Lính chiến đá khổng lồ" ? 2 : 1,
    stun: 0,
    stance: "attack",
    stanceUsed: false,
    bleed: 0,
    curse: false,
    vulnerable: 0,
    noBlock: false,
    charge: 0,
    held: false,
    copy: false,
    level: 1,
    maxHp,
    ...(cardId === "kazura" ? { safe: 2 } : {}),
    ...(cardId === "ken-ngai" || cardId === "chan-ken" ? { dim: true } : {}),
    ...(isStill(cardId) ? { noBlock: true } : {}),
    ...(cardId === "con-thinh-no-cua-hai-vuong" ? { oath: { phys: true, spell: true } } : {}),
    ...kingBless(state, side, cardId),
    ...guardBless(state, side, cardId),
    ...queenBless(state, side, cardId),
    ...mysticBless(cardId),
  };
}

/** How a held monster would stand on the field if summoned now (for showing it, not for play). */
export function previewMon(state: Duel, side: Side, held: PileMon): FieldMon | null {
  return monsterCard(held.id) ? place(state, side, held.id, held) : null;
}

const KING = "hiep-si-cua-vua";
const GUARD_KNIGHT = "hiep-si-ho-ve";
const QUEEN_KNIGHT = "hiep-si-cua-hau";
const MYSTIC = "hiep-si-huyen-bi";

function knightTutor(field: Array<FieldMon | null>) {
  return field.some((mon) => mon && mon.hp > 0 && (mon.cardId === KING || mon.cardId === QUEEN_KNIGHT));
}

function mysticBless(cardId: string): Partial<FieldMon> {
  if (cardId !== MYSTIC) return {};
  return { oath: { phys: true, spell: true } };
}

function mysticDue(mon: FieldMon) {
  return mon.cardId === MYSTIC && !mon.horn && !mon.gaze && !mon.bolt;
}

function kingBless(state: Duel, side: Side, cardId: string): Partial<FieldMon> {
  if (cardId !== KING) return {};
  const roster = state.players[side].roster ?? [];
  if (!roster.includes(QUEEN_KNIGHT)) return {};
  return { ward: "spell", wardStay: true };
}

function swordDue(mon: FieldMon) {
  return mon.cardId === KING && Boolean(mon.edge) && !mon.horn && !mon.gaze && !mon.bolt;
}

function guardBless(state: Duel, side: Side, cardId: string): Partial<FieldMon> {
  if (cardId !== GUARD_KNIGHT) return {};
  const roster = state.players[side].roster ?? [];
  const oath = {
    ...(roster.includes(KING) ? { phys: true } : {}),
    ...(roster.includes(QUEEN_KNIGHT) ? { spell: true } : {}),
  };
  return oath.phys || oath.spell ? { oath } : {};
}

function queenBless(state: Duel, side: Side, cardId: string): Partial<FieldMon> {
  if (cardId !== QUEEN_KNIGHT) return {};
  const roster = state.players[side].roster ?? [];
  if (!roster.includes(KING)) return {};
  return { oath: { phys: true } };
}

function hasOath(mon: FieldMon, kind: "phys" | "spell") {
  return kind === "phys" ? Boolean(mon.oath?.phys) : Boolean(mon.oath?.spell);
}

const mysticSoak = new Map<string, { p: number; s: number }>();

function swallowOath(mon: FieldMon, kind: "phys" | "spell", amount: number): { mon: FieldMon; amount: number } {
  if (mon.cage || amount <= 0 || !hasOath(mon, kind)) return { mon, amount };
  const oath = { ...(mon.oath ?? {}) };
  if (kind === "phys") delete oath.phys;
  else delete oath.spell;
  let next: FieldMon = { ...mon, oath: oath.phys || oath.spell ? oath : undefined };
  if (mon.cardId === MYSTIC) {
    const cur = mysticSoak.get(mon.uid) ?? { p: 0, s: 0 };
    if (kind === "phys") cur.p += amount;
    else cur.s += amount;
    mysticSoak.set(mon.uid, cur);
    next = { ...next, veil: true };
    wardLines.push(wardTag(kind));
    return { mon: next, amount: 0 };
  }
  if (mon.cardId === GUARD_KNIGHT) {
    const due = next.debt?.[0] ?? { p: 0, s: 0, t: 0 };
    const add = Math.round(amount * 0.6);
    const bank = { p: due.p + (kind === "phys" ? add : 0), s: due.s + (kind === "spell" ? add : 0), t: 0 };
    const back = mon.guarding ? { ...(mon.oathBack ?? {}), [kind]: true } : undefined;
    next = { ...next, ...(back ? { oathBack: back } : {}), debt: [{ ...bank }, { p: 0, s: 0, t: 0 }] };
  }
  wardLines.push(wardTag(kind));
  return { mon: next, amount: 0 };
}

function spareMysticVeil(before: FieldMon, after: FieldMon): FieldMon {
  if (before.cardId === MYSTIC && !before.veil && after.veil) return { ...after, veil: undefined };
  return after;
}

function settleMystic(before: FieldMon, after: FieldMon, foe: FieldMon | null, allies: Array<FieldMon | null> | undefined, active: boolean): { mon: FieldMon; foe: FieldMon | null } {
  const soaked = mysticSoak.get(before.uid) ?? { p: 0, s: 0 };
  mysticSoak.delete(before.uid);
  if (before.cardId !== MYSTIC) return { mon: after, foe };
  const lostPhys = Boolean(before.oath?.phys) && !after.oath?.phys;
  const lostSpell = Boolean(before.oath?.spell) && !after.oath?.spell;
  const mon = spareMysticVeil(before, after);
  if (!lostPhys && !lostSpell) return { mon, foe };
  const markBack = (body: FieldMon) => {
    if (!active && !before.guarding) return body;
    const back = { ...(body.oathBack ?? {}) };
    if (lostPhys) back.phys = true;
    if (lostSpell) back.spell = true;
    return { ...body, oathBack: back };
  };
  if (!active || !foe) {
    const due = before.debt?.[0] ?? { p: 0, s: 0, t: 0 };
    const bank = { p: due.p + Math.round(soaked.p * 0.6), s: due.s + Math.round(soaked.s * 0.6), t: 0 };
    return { mon: markBack({ ...mon, debt: bank.p || bank.s ? [{ ...bank }, { p: 0, s: 0, t: 0 }] : mon.debt }), foe };
  }
  const due = before.debt?.[0];
  let nextFoe = foe;
  if (due && ((due.p ?? 0) > 0 || (due.s ?? 0) > 0)) {
    const landed = landHell(foe, { phys: due.p, spell: due.s, tru: 0 }, allies);
    nextFoe = landed.mon;
    wardLines.push(`${cardOf(before).name} giải phóng ${due.p} sát thương vật lý và ${due.s} sát thương phép`);
  }
  const kept = { p: Math.round(soaked.p * 0.6), s: Math.round(soaked.s * 0.6), t: 0 };
  const debt = (kept.p || kept.s ? [{ ...kept }, { p: 0, s: 0, t: 0 }] : undefined) as FieldMon["debt"];
  return { mon: markBack({ ...mon, debt }), foe: nextFoe };
}

function settleGuard(mon: FieldMon): FieldMon {
  if (!mon.oathBack && !mon.guarding && !mon.oathShot) return mon;
  const oath = { ...(mon.oath ?? {}) };
  if (mon.oathBack?.phys) oath.phys = true;
  if (mon.oathBack?.spell) oath.spell = true;
  return {
    ...mon,
    oath: oath.phys || oath.spell ? oath : undefined,
    oathBack: undefined,
    guarding: undefined,
    oathShot: undefined,
    riposte: undefined,
  };
}

const SEA_IDS = new Set(["trai-tim-hai-long", "sua-hut-ma-phap", "kraken"]);

function isSea(id: string) {
  return SEA_IDS.has(id);
}

function held(mon: FieldMon) {
  return mon.stun > 0 || (mon.chain ?? 0) > 0;
}

function canIntercept(mon: FieldMon | null, committed = false): mon is FieldMon {
  if (!mon || mon.noBlock || mon.cage || (mon.path ?? 0) > 0 || hexLocked(mon)) return false;
  if ((held(mon) || mon.stun > 0) && !(committed && mon.guarding)) return false;
  if (!committed && mon.dim && mon.cardId !== "cuc-bong-ma-quai") return false;
  return true;
}

function barred(mon: FieldMon) {
  return held(mon) || (mon.gag ?? 0) > 0 || hexLocked(mon);
}

function guardBonus(mon: FieldMon) {
  return mon.cardId === "rong-boc-trung" && mon.stance === "guard" ? skillFigure(mon.cardId, "guard", 2) : 0;
}

function auraGuard(allies: Array<FieldMon | null> | undefined, mon: FieldMon) {
  if (!allies?.some((unit) => unit && unit.hp > 0 && unit.cardId === "yeu-tinh-chuc-phuc" && unit.uid !== mon.uid)) return 0;
  const parsed = skillFigure("yeu-tinh-chuc-phuc", "guard", 1);
  return parsed > 0 ? parsed : 1;
}

function dullHorn(mon: FieldMon, mode: FieldMon["horn"]): FieldMon {
  const next = mode === "splash" || mode === "plus" ? { ...mon, horn: "plain" as const } : mon;
  return next.gaze ? { ...next, gaze: undefined } : next;
}

const NOT_BEAST = new Set([
  "phu-thuy-thoi-gian",
  "kiem-si-lua-thieng",
  "ky-si-bong-toi",
  "ga-he-dang-so",
  "phu-thuy-ti-hon",
  "phu-thuy-rung-den",
  "yeu-tinh-chuc-phuc",
  "quai-thu-thien-su",
  "ke-giam-ho-linh-hon",
  "ma-dao-si",
]);

export function hornFit(cardId: string) {
  return !NOT_BEAST.has(cardId);
}

export function harmShift(mon: FieldMon) {
  if (mon.stun > 0 || mon.bleed > 0 || mon.curse || mon.vulnerable > 0) return true;
  if ((mon.chain ?? 0) > 0 || (mon.gag ?? 0) > 0 || mon.poison || mon.erode) return true;
  if (mon.wet && mon.wet < 90) return true;
  if (mon.hex && mon.hex.left > 0) return true;
  return mon.noBlock && !isStill(mon.cardId);
}

function freshHarm(mon: FieldMon): Partial<FieldMon> {
  const part: Partial<FieldMon> = {};
  if (mon.stun > 0) part.stun = grabNums(skillText("ong-khong-lo"), /(\d+)\s*lượt/gi)[0] ?? 5;
  if (mon.bleed > 0) part.bleed = mon.bleed;
  if (mon.curse) part.curse = true;
  if (mon.vulnerable > 0) part.vulnerable = mon.vulnerable;
  if ((mon.chain ?? 0) > 0) part.chain = grabNums(spellText("soi-xich-dia-nguc"), /(\d+)\s*lượt/gi)[0] ?? 2;
  if ((mon.gag ?? 0) > 0) part.gag = grabNums(spellText("thanh-guom-anh-sang"), /(\d+)\s*lượt/gi)[0] ?? 5;
  if (mon.poison) {
    const left = mon.poison.kind === "giant" ? 3 : mon.poison.kind === "queen" ? 5 : null;
    part.poison = { ...mon.poison, left };
  }
  if (mon.erode) part.erode = { from: mon.erode.from, left: mon.erode.left === null ? null : (mammothFightErode() ?? 2) };
  if (mon.wet && mon.wet < 90) part.wet = 2;
  if (mon.hex && mon.hex.left > 0) part.hex = { left: 6 };
  if (mon.noBlock && !isStill(mon.cardId)) part.noBlock = true;
  return part;
}

function clearHarm(mon: FieldMon): FieldMon {
  return {
    ...mon,
    stun: 0,
    bleed: 0,
    curse: false,
    vulnerable: 0,
    chain: 0,
    gag: 0,
    poison: undefined,
    erode: undefined,
    wet: mon.wet && mon.wet >= 90 ? mon.wet : undefined,
    hex: undefined,
    noBlock: isStill(mon.cardId) ? true : false,
  };
}

function liveDef(mon: FieldMon, allies?: Array<FieldMon | null>) {
  const hex = mon.hex && mon.hex.left > 0 ? 2 : 0;
  if ((mon.chain ?? 0) > 0) return 0 - hex;
  if (mon.cage) return Math.max(0, mon.def - (mon.raised?.def ?? 0) - (mon.buff?.def ?? 0)) - hex;
  return mon.def + (mon.tempGuard ?? 0) + (mon.nextDef ?? 0) + guardBonus(mon) + (mon.clash?.def ?? 0) + auraGuard(allies, mon) - hex;
}

function liveMdef(mon: FieldMon, allies?: Array<FieldMon | null>) {
  const hex = mon.hex && mon.hex.left > 0 ? 2 : 0;
  if ((mon.chain ?? 0) > 0) return 0 - hex;
  if (mon.cage) return Math.max(0, mon.mdef - (mon.raised?.mdef ?? 0) - (mon.buff?.mdef ?? 0)) - hex;
  return mon.mdef + (mon.tempGuard ?? 0) + guardBonus(mon) + (mon.clash?.mdef ?? 0) + auraGuard(allies, mon) - hex;
}

function rawAtk(mon: FieldMon) {
  let atk = mon.atk + (mon.blessAtk ?? 0) + (mon.clash?.atk ?? 0);
  if (mon.cardId === "rong-boc-trung" && mon.stance === "attack") atk += skillFigure(mon.cardId, "atk", 4);
  if (mon.cardId === "con-thinh-no-cua-hai-vuong") atk += 3 * (mon.stored ?? 0);
  return atk;
}

function liveAtk(mon: FieldMon) {
  const atk = rawAtk(mon);
  if (!mon.hex || mon.hex.left <= 0) return atk;
  return Math.max(0, atk - 3);
}

export function hexLocked(mon: FieldMon | null | undefined) {
  if (!mon?.hex || mon.hex.left <= 0) return false;
  return rawAtk(mon) - 3 < 0;
}

export function visibleStats(mon: FieldMon, allies: Array<FieldMon | null>) {
  const aura = auraGuard(allies, mon);
  const stanceAtk = mon.cardId === "rong-boc-trung" && mon.stance === "attack";
  return {
    atk: liveAtk(mon),
    def: liveDef(mon, allies),
    mdef: liveMdef(mon, allies),
    blueAtk: (mon.blessAtk ?? 0) > 0 || (mon.clash?.atk ?? 0) > 0 || stanceAtk || (mon.raised?.atk ?? 0) > 0 || (mon.cardId === "con-thinh-no-cua-hai-vuong" && (mon.stored ?? 0) > 0),
    blueDef: !mon.cage && ((mon.tempGuard ?? 0) > 0 || (mon.nextDef ?? 0) > 0 || (mon.blessDef ?? 0) > 0 || guardBonus(mon) > 0 || (mon.clash?.def ?? 0) > 0 || aura > 0 || (mon.raised?.def ?? 0) > 0 || (mon.buff?.def ?? 0) > 0),
    blueMdef: !mon.cage && ((mon.tempGuard ?? 0) > 0 || (mon.blessMdef ?? 0) > 0 || guardBonus(mon) > 0 || aura > 0 || (mon.raised?.mdef ?? 0) > 0 || (mon.buff?.mdef ?? 0) > 0 || (mon.clash?.mdef ?? 0) > 0),
    blueHp: !mon.cage && ((mon.raised?.hp ?? 0) > 0 || (mon.clash?.maxHp ?? 0) > 0 || (mon.buff?.maxHp ?? 0) > 0),
  };
}

function livingLegs(field: Array<FieldMon | null>, host: string) {
  return field.filter((unit): unit is FieldMon => Boolean(unit && unit.cardId === "chan-ken" && unit.host === host && unit.hp > 0));
}

function shuntUid(field: Array<FieldMon | null>, uid: string | null): string | null {
  if (!uid) return uid;
  const mon = field.find((unit) => unit?.uid === uid);
  if (!mon || mon.cardId !== "ken-ngai") return uid;
  const legs = livingLegs(field, mon.uid);
  if (legs.length === 0) return uid;
  return legs[Math.floor(Math.random() * legs.length)].uid;
}

function spray(
  field: Array<FieldMon | null>,
  hit: (unit: FieldMon, allies: Array<FieldMon | null>) => FieldMon,
  spare: string[] = [],
) {
  const hops: string[] = [];
  const spared = new Set(spare);
  for (const unit of field) {
    if (!unit || unit.cardId !== "ken-ngai") continue;
    const legs = livingLegs(field, unit.uid);
    if (legs.length === 0) continue;
    spared.add(unit.uid);
    hops.push(legs[Math.floor(Math.random() * legs.length)].uid);
  }
  let next = field.map((unit) => (!unit || spared.has(unit.uid) ? unit : hit(unit, field)));
  for (const uid of hops) {
    const leg = next.find((unit) => unit?.uid === uid);
    if (!leg || leg.hp <= 0) continue;
    const hurt = hit(leg, next);
    next = next.map((unit) => (unit?.uid === uid ? hurt : unit));
  }
  return next;
}

function feedBull(mon: FieldMon, points: number): { mon: FieldMon; healed: number } {
  const next = { ...mon };
  const heals = grabNums(skillText(mon.cardId), NUM_HEAL);
  const healCap = heals.length > 0 ? heals.reduce((sum, value) => sum + value, 0) : 2;
  const room = Math.max(0, (next.maxHp || next.hp) - next.hp);
  const heal = Math.min(points, healCap, room);
  next.hp += heal;
  let left = points - heal;
  let step = 0;
  const stepHp = skillFigure(mon.cardId, "max", 1);
  const stepAtk = skillFigure(mon.cardId, "atk", 1);
  const stepDef = skillFigure(mon.cardId, "guard", skillFigure(mon.cardId, "def", 1));
  while (left > 0) {
    if (step % 3 === 0) {
      next.maxHp = (next.maxHp || next.hp) + stepHp;
      next.hp += stepHp;
      next.raised = markRaised(next, { hp: stepHp });
    } else if (step % 3 === 1) {
      next.atk += stepAtk;
      next.raised = markRaised(next, { atk: stepAtk });
    } else {
      next.def += stepDef;
      next.mdef += stepDef;
      next.blessDef = (next.blessDef ?? 0) + stepDef;
      next.blessMdef = (next.blessMdef ?? 0) + stepDef;
    }
    left -= 1;
    step += 1;
  }
  return { mon: next, healed: heal };
}

function bullAward(mon: FieldMon, victimId: string, victimDead: boolean): { mon: FieldMon; mend: number } {
  if (mon.cardId !== "dau-si-bo-tot" || !victimDead) return { mon, mend: 0 };
  const stars = monsterCard(victimId)?.stars ?? 1;
  const points = stars >= 4 ? 4 : stars >= 3 ? 3 : 2;
  const fed = feedBull(mon, points);
  return { mon: fed.mon, mend: fed.healed };
}

function kazuraSafe(mon: FieldMon | null): boolean {
  return Boolean(mon && mon.cardId === "kazura" && (mon.safe ?? 0) > 0 && !mon.cage);
}

function clearClash(mon: FieldMon): FieldMon {
  if (!mon.clash && !mon.blessAtk) return mon;
  const maxHp = Math.max(1, (mon.maxHp || mon.hp) - (mon.clash?.maxHp ?? 0));
  return { ...mon, maxHp, hp: Math.min(mon.hp, maxHp), clash: undefined, blessAtk: mon.blessAtk && mon.dim ? 0 : mon.blessAtk };
}

function dropClash(mon: FieldMon): FieldMon {
  if (!mon.clash) return mon;
  const maxHp = Math.max(1, (mon.maxHp || mon.hp) - mon.clash.maxHp);
  return { ...mon, maxHp, hp: Math.min(mon.hp, maxHp), clash: undefined };
}

function releaseLegend(state: Duel): Duel {
  let next = state;
  for (const side of [0, 1] as const) {
    const player = next.players[side];
    if (!player.field.some((mon) => mon?.cardId === "chien-binh-huyen-thoai" && mon.clash)) continue;
    const field = player.field.map((mon) => (mon?.cardId === "chien-binh-huyen-thoai" && mon.clash ? dropClash(mon) : mon));
    next = patch(next, side, { ...player, field });
  }
  return next;
}

function knightOpen(mon: FieldMon | null): boolean {
  return Boolean(mon && mon.hp > 0 && mon.cardId === "ky-si-bong-toi" && !mon.clash && !(mon.path ?? 0));
}

function dropGuard(mon: FieldMon): FieldMon {
  if (!mon.tempGuard) return mon;
  return { ...mon, tempGuard: 0 };
}

function spendBless(mon: FieldMon): FieldMon {
  if (!mon.blessAtk && !mon.blessDmg && !mon.nextDef) return mon;
  return { ...mon, blessAtk: 0, blessDmg: 0, nextDef: 0 };
}

function applyPoison(mon: FieldMon, kind: "giant" | "queen" | "perfect", from: Side): FieldMon {
  if (mon.hp <= 0) return mon;
  const current = mon.poison;
  if (kind === "giant") {
    if (current?.kind === "giant") return { ...mon, poison: { ...current, left: 3 } };
    if (current) return mon;
    return { ...mon, poison: { stacks: 1, left: 3, perfect: false, from, kind } };
  }
  if (kind === "queen") {
    return { ...mon, poison: { stacks: (current?.stacks ?? 0) + 1, left: 5, perfect: false, from, kind: "queen" } };
  }
  return { ...mon, poison: { stacks: (current?.stacks ?? 0) + 1, left: null, perfect: true, from, kind: "perfect" } };
}

function mothOf(age: number) {
  if (age >= 6) return "ngai-hoan-my";
  if (age >= 5) return "ngai-nu-hoang";
  return "ngai-khong-lo";
}

function hatchCocoon(mon: FieldMon): FieldMon {
  const cardId = mothOf(mon.level ?? 0);
  const card = monsterCard(cardId);
  if (!card) return mon;
  return {
    ...mon,
    cardId,
    atk: card.atk,
    def: card.def,
    mdef: card.mdef,
    hp: card.hp,
    maxHp: card.hp,
    host: undefined,
    level: 1,
    dim: false,
    noBlock: false,
  };
}

function bloomCocoons(player: Player): { player: Player; line: string } {
  const ripe = player.field.filter((mon) => mon?.cardId === "ken-ngai" && mon.hp > 0 && (mon.level ?? 0) >= 6);
  if (ripe.length === 0) return { player, line: "" };
  const ids = new Set(ripe.map((mon) => mon!.uid));
  const drop = new Set(player.field.flatMap((mon) => (mon?.host && ids.has(mon.host) ? [mon.uid] : [])));
  const names: string[] = [];
  const field = player.field.map((mon) => {
    if (!mon || drop.has(mon.uid)) return null;
    if (!ids.has(mon.uid)) return mon;
    const born = hatchCocoon(mon);
    names.push(cardOf(born).name);
    return born;
  });
  return { player: { ...player, field }, line: names.map((name) => `${name} tự nở`).join(". ") };
}

function settleCocoon(player: Player): Player {
  const hatching = player.field.filter((mon) => mon?.cardId === "ken-ngai" && mon.hp <= 0 && (mon.level ?? 0) >= 4).map((mon) => mon!.uid);
  if (hatching.length === 0) return player;
  const drop = new Set(player.field.flatMap((mon) => (mon?.host && hatching.includes(mon.host) ? [mon.uid] : [])));
  return {
    ...player,
    field: player.field.map((mon) => {
      if (!mon || drop.has(mon.uid)) return null;
      if (hatching.includes(mon.uid)) return hatchCocoon(mon);
      return mon;
    }),
  };
}

function shuffleSea(player: Player): Player {
  if (!player.sea) return player;
  const seats = player.field.map((mon, index) => (mon && isSea(mon.cardId) ? index : -1)).filter((index) => index >= 0);
  if (seats.length < 2) return player;
  const order = [...seats];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }
  const field = [...player.field] as Player["field"];
  const bodies = seats.map((index) => field[index]);
  seats.forEach((index, at) => {
    field[order[at]] = bodies[at];
  });
  return { ...player, field };
}

function lockIndex(player: Player, index: number): Player {
  if (index < 0 || index > 2) return player;
  const locked = [...(player.locked ?? [0, 0, 0])] as [number, number, number];
  locked[index] = 2;
  return { ...player, locked };
}

function alive(field: Array<FieldMon | null>): Array<FieldMon | null> {
  return field.map((mon) => (mon && mon.hp > 0 ? mon : null));
}

function partnerId(id: string) {
  if (id === "kazura") return "kizuran";
  if (id === "kizuran") return "kazura";
  return "";
}

function spendPartners(allies: Array<FieldMon | null> | undefined, id: string, amount: number) {
  if (!allies || amount <= 0 || !id) return 0;
  const mates = allies.filter((mon) => mon && mon.cardId === id && mon.hp > 0);
  if (mates.length === 0) return 0;
  let left = amount;
  for (const mon of mates) {
    if (!mon || left <= 0) break;
    const have = mon.stored ?? 0;
    const used = Math.min(have, left);
    mon.stored = have - used;
    left -= used;
  }
  return amount - left;
}

function third(amount: number) {
  const n = Math.max(0, Math.floor(amount));
  const base = Math.floor(n / 3);
  return n % 3 === 2 ? base + 1 : base;
}

function pushDebt(mon: FieldMon, add: { p: number; s: number; t: number }): FieldMon {
  if (mon.cardId !== "chien-binh-rong" || (add.p <= 0 && add.s <= 0 && add.t <= 0)) return mon;
  const cur = mon.debt ?? [{ p: 0, s: 0, t: 0 }, { p: 0, s: 0, t: 0 }];
  return {
    ...mon,
    debt: [
      { p: cur[0].p + add.p, s: cur[0].s + add.s, t: cur[0].t + add.t },
      { p: cur[1].p + add.p, s: cur[1].s + add.s, t: cur[1].t + add.t },
    ],
  };
}

function takePhysical(mon: FieldMon, raw: number, allies?: Array<FieldMon | null>) {
  if (shadeHidden(mon)) {
    const pool = mon.stored ?? 1;
    const taken = Math.min(pool, Math.max(0, raw));
    const left = pool - taken;
    return { mon: left > 0 ? { ...mon, stored: left } : { ...mon, shown: undefined, stored: undefined }, bite: taken, surplus: 0 };
  }
  const gated = swallowOath(mon, "phys", raw);
  if (gated.mon !== mon) return { mon: gated.mon, bite: 0, surplus: 0 };
  if (mon.cardId === "chien-binh-rong") {
    const slice = third(raw);
    const queued = pushDebt(mon, { p: slice, s: 0, t: 0 });
    const soaked = soak(queued, "phys", hurt(queued, Math.max(0, slice - liveDef(queued, allies))));
    return applyIncoming(soaked.mon, soaked.amount, allies);
  }
  const def = liveDef(mon, allies);
  const blocked = Math.max(0, Math.min(raw, def));
  const soaked = soak(bankPlate(mon, "phys", blocked), "phys", hurt(mon, physical(raw, def)));
  return applyIncoming(soaked.mon, soaked.amount, allies);
}

function applyIncoming(mon: FieldMon, amount: number, allies?: Array<FieldMon | null>, veilBudget?: number): { mon: FieldMon; bite: number; surplus: number } {
  let incoming = Math.max(0, amount);
  const cap = veilBudget !== undefined ? veilBudget : mon.veil && incoming > 0 && mon.hp > 0 ? 2 : 0;
  if (cap > 0 && incoming > 0 && mon.hp > 0) incoming = Math.max(0, incoming - cap);
  const before = mon.hp;
  const bite = Math.min(incoming, Math.max(0, before));
  const surplus = incoming - bite;
  const spent = spendPartners(allies, partnerId(mon.cardId), bite);
  const left = bite - spent;
  const stored = mon.cardId === "kizuran" ? (mon.stored ?? 0) + left : mon.stored;
  return { mon: { ...mon, hp: before - left, stored }, bite, surplus };
}

function mendHp(mon: FieldMon, amount: number): FieldMon {
  if (amount <= 0 || mon.hp <= 0) return mon;
  const cap = mon.maxHp || mon.hp;
  return { ...mon, hp: Math.min(cap, mon.hp + amount) };
}

function leechKazura(attacker: FieldMon, bite: number, surplus: number, allies: Array<FieldMon | null>): { attacker: FieldMon; allies: Array<FieldMon | null> } {
  if (attacker.cardId !== "kazura") return { attacker, allies };
  const healed = mendHp(attacker, surplus);
  let left = bite;
  const next = allies.map((mon) => {
    if (!mon || mon.cardId !== "kizuran" || mon.hp <= 0 || left <= 0) return mon;
    const room = Math.max(0, (mon.maxHp || mon.hp) - mon.hp);
    const gain = Math.min(room, left);
    left -= gain;
    return gain > 0 ? { ...mon, hp: mon.hp + gain } : mon;
  });
  return {
    attacker: left > 0 ? { ...healed, stored: (healed.stored ?? 0) + left } : healed,
    allies: next,
  };
}

function redirectCover(field: Array<FieldMon | null>, uid: string | null): string | null {
  if (!uid) return uid;
  const target = field.find((mon) => mon?.uid === uid);
  if (!target || target.cardId !== "kazura") return uid;
  const guard = field.find((mon) => mon && mon.cardId === "kizuran" && mon.cover && mon.hp > 0 && mon.stun === 0 && (mon.chain ?? 0) === 0);
  return guard?.uid ?? uid;
}

let charmDamage = 0;

function wardTag(kind: "phys" | "spell") {
  return `(${kind === "phys" ? "Khiên vật lý" : "Khiên phép"} đã vỡ)`;
}

function soak(mon: FieldMon, kind: "phys" | "spell", amount: number): { mon: FieldMon; amount: number } {
  if (mon.cage || !mon.ward || amount <= 0) return { mon, amount };
  if (mon.wardStay) {
    if (kind !== "spell" || mon.ward !== "spell") return { mon, amount };
    wardLines.push(wardTag("spell"));
    return { mon: { ...mon, ward: undefined, wardStay: undefined }, amount: 0 };
  }
  const popped = { ...mon, ward: undefined };
  wardLines.push(wardTag(mon.ward));
  if (mon.ward !== kind) return { mon: popped, amount };
  return { mon: popped, amount: 0 };
}

function damageSpell(mon: FieldMon, amount: number, allies?: Array<FieldMon | null>, source?: FieldMon | null): FieldMon {
  mon = openShade(mon);
  const total = source ? outgoing(source, amount + charmDamage) : amount + charmDamage;
  const gated = swallowOath(mon, "spell", total);
  if (gated.mon !== mon) return settleMystic(mon, gated.mon, null, allies, Boolean(mon.guarding)).mon;
  if (mon.cardId === "chien-binh-rong") {
    const slice = third(total);
    const queued = pushDebt(mon, { p: 0, s: slice, t: 0 });
    const dealt = Math.max(0, slice - liveMdef(queued, allies));
    const soaked = soak(queued, "spell", hurt(queued, dealt));
    return applyIncoming(soaked.mon, soaked.amount, allies).mon;
  }
  const mdef = liveMdef(mon, allies);
  const dealt = Math.max(0, total - mdef);
  const blocked = Math.max(0, Math.min(total, mdef));
  const plated = bankPlate(mon, "spell", blocked);
  const soaked = soak(plated, "spell", hurt(plated, dealt));
  const hit = applyIncoming(soaked.mon, soaked.amount, allies);
  const stored = mon.cardId === "sua-hut-ma-phap" ? (mon.stored ?? 0) + blocked : hit.mon.stored;
  return settleMystic(mon, { ...hit.mon, stored }, null, allies, Boolean(mon.guarding)).mon;
}

function spellLanded(target: FieldMon, amount: number, allies?: Array<FieldMon | null>, source?: FieldMon | null): number {
  const gross = amount + charmDamage;
  const peeked = source ? hexCut(source, gross, "peek") : gross;
  const total = source?.curse ? Math.floor(peeked / 2) : peeked;
  const base = target.cardId === "chien-binh-rong" ? third(total) : total;
  const landed = hurt(target, Math.max(0, base - liveMdef(target, allies)));
  return target.ward === "spell" && landed > 0 ? 0 : landed;
}

function spellPhrase(targets: Array<FieldMon | null | undefined>, amount: number, allies?: Array<FieldMon | null>, source?: FieldMon | null): string {
  const rows = targets.filter((mon): mon is FieldMon => Boolean(mon)).map((mon) => ({ name: cardOf(mon).name, n: spellLanded(mon, amount, allies, source) }));
  if (rows.length === 0) return "0 sát thương phép";
  if (rows.every((row) => row.n === rows[0].n)) return `${rows[0].n} sát thương phép`;
  return rows.map((row) => `${row.n} sát thương phép lên ${row.name}`).join(", ");
}

function aimNotice(title: string, rows: Array<{ name: string; bits: string }>, tail = ""): string | null {
  const shown = rows.filter((row) => row.name && row.bits);
  if (shown.length < 2) return null;
  const lines = shown.map((row) => `- gây ${row.bits} lên ${row.name}.`);
  const extra = tail.trim();
  return [title, ...lines, ...(extra ? [extra] : [])].join("\n");
}

function trueDamage(mon: FieldMon, amount: number, allies?: Array<FieldMon | null>, veilBudget?: number): FieldMon {
  return landTrue(mon, amount, allies, veilBudget).mon;
}

function landTrue(mon: FieldMon, amount: number, allies?: Array<FieldMon | null>, veilBudget?: number): { mon: FieldMon; bite: number; surplus: number } {
  const total = amount + charmDamage;
  if (mon.cardId !== "chien-binh-rong") return applyIncoming(mon, hurt(mon, total), allies, veilBudget);
  const slice = third(total);
  const queued = pushDebt(mon, { p: 0, s: 0, t: slice });
  return applyIncoming(queued, hurt(queued, slice), allies, veilBudget);
}

function truLanded(target: FieldMon, amount: number, allies?: Array<FieldMon | null>, source?: FieldMon | null): number {
  const total = (source ? outgoing(source, amount) : amount) + charmDamage;
  const slice = target.cardId === "chien-binh-rong" ? third(total) : total;
  return shownTru(target, hurt(target, slice), allies);
}

function stampErode(mon: FieldMon, from: Side, left: number | null): FieldMon {
  if (mon.erode?.left === null) return mon;
  if (left === null) return { ...mon, erode: { from, left: null } };
  return { ...mon, erode: { from, left: Math.max(mon.erode?.left ?? 0, left) } };
}

function mammothFightErode(): number | null {
  const line = skillText("mo-voi-ma-mut")
    .split("\n")
    .find((row) => /hy sinh bằng chiến đấu/i.test(row));
  if (!line) return 2;
  const times = /(\d+)\s*lần/i.exec(line);
  return times ? Number(times[1]) : 2;
}

function combatErode(attacker: FieldMon, defender: FieldMon, attackerSide: Side): { attacker: FieldMon; defender: FieldMon } {
  let nextAttacker = attacker;
  let nextDefender = defender;
  const ticks = mammothFightErode();
  if (ticks !== null && ticks > 0) {
    if (attacker.cardId === "mo-voi-ma-mut" && attacker.hp <= 0 && defender.hp > 0) nextDefender = stampErode(defender, attackerSide, ticks);
    if (defender.cardId === "mo-voi-ma-mut" && defender.hp <= 0 && attacker.hp > 0) {
      nextAttacker = stampErode(attacker, (1 - attackerSide) as Side, ticks);
    }
  }
  return { attacker: nextAttacker, defender: nextDefender };
}

function outgoing(mon: FieldMon, amount: number): number {
  const cut = hexCut(mon, amount, "spend");
  return mon.curse ? Math.floor(cut / 2) : cut;
}

type HexClip = { gross: number; net: number; seen: boolean; applied: boolean };
let skillHex: { uid: string; left: number; clips: HexClip[] } | null = null;

function hexCut(mon: FieldMon | null | undefined, amount: number, mode: "peek" | "spend") {
  if (!skillHex || !mon || mon.uid !== skillHex.uid || amount <= 0) return amount;
  if (mode === "spend") {
    const reserved = skillHex.clips.find((clip) => clip.gross === amount && clip.seen && !clip.applied);
    if (reserved) {
      reserved.applied = true;
      return reserved.net;
    }
    const cut = Math.min(skillHex.left, amount);
    skillHex.left -= cut;
    const net = amount - cut;
    skillHex.clips.push({ gross: amount, net, seen: false, applied: true });
    return net;
  }
  const applied = skillHex.clips.find((clip) => clip.gross === amount && clip.applied && !clip.seen);
  if (applied) {
    applied.seen = true;
    return applied.net;
  }
  const pending = skillHex.clips.find((clip) => clip.gross === amount && clip.seen && !clip.applied);
  if (pending) return pending.net;
  const cut = Math.min(skillHex.left, amount);
  skillHex.left -= cut;
  const net = amount - cut;
  skillHex.clips.push({ gross: amount, net, seen: true, applied: false });
  return net;
}

function shaveHex(mon: FieldMon, parts: { spell: number; phys: number; tru: number }) {
  const spell = Math.max(0, parts.spell);
  const phys = Math.max(0, parts.phys);
  const tru = Math.max(0, parts.tru);
  if (!skillHex || skillHex.uid !== mon.uid || skillHex.left <= 0) return { spell, phys, tru };
  let left = skillHex.left;
  const spellCut = Math.min(spell, left);
  left -= spellCut;
  const physCut = Math.min(phys, left);
  left -= physCut;
  const truCut = Math.min(tru, left);
  skillHex.left = 0;
  skillHex.clips = [];
  return { spell: spell - spellCut, phys: phys - physCut, tru: tru - truCut };
}

function bindSkillHex(mon: FieldMon) {
  if (skillHex?.uid === mon.uid) return () => {};
  const prev = skillHex;
  skillHex = mon.hex && mon.hex.left > 0 ? { uid: mon.uid, left: 3, clips: [] } : null;
  return () => {
    skillHex = prev;
  };
}

export function skillLook(cardId: string, index = 0): "spell" | "fire" | "gun" | "tide-small" | "tide-mid" | "tide-big" | null {
  return skillVisual(cardId, index);
}

export function harmSkill(cardId: string, index = 0) {
  if (cardId === "kiem-si-lua-thieng" || cardId === "phu-thuy-ti-hon" || cardId === "trieu-hoi-ac-ma" || cardId === "sua-hut-ma-phap" || cardId === "trai-tim-hai-long" || cardId === "mo-voi-ma-mut" || cardId === "mat-do-tan-pha" || cardId === "may-nem-bom-hinh-nhen") return true;
  if (cardId === "ngai-khong-lo" || cardId === "ngai-nu-hoang" || cardId === "ngai-hoan-my") return true;
  if (cardId === "rong-phun-hoa-cau") return index === 1;
  if (cardId === "ga-he-dang-so") return index === 1;
  if (cardId === "phu-thuy-thoi-gian") return index >= 1;
  if (cardId === "may-quay-thuong") return index === 1;
  if (cardId === "rong-con" || cardId === "rong-ngan-tuoi") return true;
  if (cardId === "ma-dao-si" || cardId === "loi-nguyen-cua-rong" || cardId === "rong-ac-ma" || cardId === "con-thinh-no-cua-hai-vuong") return true;
  if (cardId === QUEEN_KNIGHT) return true;
  if (cardId === "cuc-bong-ma-quai") return index === 0;
  return false;
}

function hurt(mon: FieldMon, amount: number): number {
  return mon.vulnerable > 0 ? amount * 2 : amount;
}

function partnerPool(mon: { cardId: string; hp: number } | null | undefined, allies?: Array<FieldMon | null>): number {
  if (!mon || !allies) return 0;
  const id = partnerId(mon.cardId);
  if (!id) return 0;
  let total = 0;
  for (const mate of allies) {
    if (mate && mate.hp > 0 && mate.cardId === id) total += mate.stored ?? 0;
  }
  return total;
}

function phantomPool(mon: { cardId: string; hp: number; veil?: boolean; cage?: boolean } | null | undefined, allies?: Array<FieldMon | null>): number {
  if (!mon || mon.hp <= 0 || mon.cage) return 0;
  return (mon.veil ? 2 : 0) + partnerPool(mon, allies);
}

function shownTru(mon: { cardId: string; hp: number; veil?: boolean } | null | undefined, amount: number, allies?: Array<FieldMon | null>, earlier = 0, pool?: number): number {
  const raw = Math.max(0, amount);
  if (!mon || mon.hp <= 0 || raw <= 0) return raw;
  const have = pool ?? phantomPool(mon, allies);
  const left = Math.max(0, have - Math.max(0, earlier));
  return Math.max(0, raw - left);
}

function veilLeft(mon: { hp: number; veil?: boolean } | null | undefined, spent: number): number {
  if (!mon?.veil || mon.hp <= 0) return 0;
  return Math.max(0, 2 - Math.max(0, spent));
}

function physical(atk: number, def: number): number {
  return Math.max(0, atk - def);
}

const PERFECT = "nu-chua-dieu-nhan-hoan-my";

function plateBank(mon: FieldMon) {
  const due = mon.cardId === PERFECT ? mon.debt?.[0] : undefined;
  return { p: due?.p ?? 0, s: due?.s ?? 0 };
}

function bankPlate(mon: FieldMon, kind: "phys" | "spell", blocked: number): FieldMon {
  if (mon.cardId !== PERFECT || blocked <= 0) return mon;
  const cur = plateBank(mon);
  const next = { p: cur.p + (kind === "phys" ? blocked : 0), s: cur.s + (kind === "spell" ? blocked : 0), t: 0 };
  return { ...mon, debt: [next, { p: 0, s: 0, t: 0 }] };
}

function spendPlate(mon: FieldMon, spent: { p: number; s: number }, usedBolt: boolean): FieldMon {
  if (mon.cardId !== PERFECT) return mon;
  const cur = plateBank(mon);
  const next = { p: Math.max(0, cur.p - spent.p), s: Math.max(0, cur.s - spent.s), t: 0 };
  const empty = next.p === 0 && next.s === 0;
  return { ...mon, debt: empty ? undefined : [next, { p: 0, s: 0, t: 0 }], bolt: usedBolt ? undefined : mon.bolt };
}

const RIDER = "ky-si-cuoi-rong";

function riderFireLine(rows: Array<{ name: string; n: number }>): string {
  if (rows.every((row) => row.n === rows[0]?.n)) return `- Lửa địa ngục gây ${rows[0]?.n ?? 0} sát thương chuẩn lên ${rows.map((row) => row.name).join(", ")}`;
  return rows.map((row) => `- Lửa địa ngục gây ${row.n} sát thương chuẩn lên ${row.name}`).join("\n");
}

function riderPackets(attacker: FieldMon, defender: FieldMon, allies?: Array<FieldMon | null>) {
  const tru = skillFigure(RIDER, "dmg", 4);
  const fire = skillFigure(RIDER, "dmg", 2, 1);
  const atk = outgoing(attacker, liveAtk(attacker));
  const def = liveDef(defender, allies);
  const physicalPart = Math.max(0, atk - tru - def);
  return {
    first: hurt(defender, Math.max(0, tru - fire) + physicalPart),
    second: hurt(defender, fire),
    physical: hurt(defender, physicalPart),
    tru: hurt(defender, tru),
    fire,
  };
}

export function canTargetFoe(state: Duel): boolean {
  return !(state.opening && state.turn === 0);
}

function dueUpkeep(mon: FieldMon | null): mon is FieldMon {
  if (!mon || mon.hp <= 0) return false;
  if (mon.cardId === "trieu-hoi-ac-ma" && mon.pact) return true;
  return mon.cardId === "quai-thu-thien-su";
}

function nextUpkeep(field: Array<FieldMon | null>, except = ""): FieldMon | null {
  const demon = field.find((mon) => mon && mon.uid !== except && mon.hp > 0 && mon.cardId === "trieu-hoi-ac-ma" && mon.pact);
  if (demon) return demon;
  return field.find((mon) => mon && mon.uid !== except && mon.hp > 0 && mon.cardId === "quai-thu-thien-su") ?? null;
}

function scrubUpkeep(state: Duel): Duel {
  if (!state.upkeep) return state;
  const you = state.players[state.turn];
  if (you.field.some((unit) => unit?.uid === state.upkeep && dueUpkeep(unit))) return state;
  return { ...state, upkeep: nextUpkeep(you.field)?.uid ?? null };
}

function needUpkeep(state: Duel): Duel | null {
  if (state.gemCap === state.turn) return note(state, "Hãy chọn giải phóng cầu ma lực trước.");
  if (state.gemWarn === state.turn) return note(state, "Hãy đọc thông báo ma lực quá tải trước.");
  const next = scrubUpkeep(state);
  if (next.upkeep) {
    const mon = next.players[next.turn].field.find((unit) => unit?.uid === next.upkeep);
    return note(next, mon ? `Hãy chọn duy trì ${cardOf(mon).name} trước` : "Hãy chọn duy trì trước");
  }
  return next === state ? null : next;
}

export function draw(state: Duel, pile: "monster" | "spell"): Duel {
  const next = drawCore(state, pile);
  if (next === state) return next;
  const side = state.turn;
  const ok = next.players[side].draws > state.players[side].draws;
  if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
  const cardId = ok ? (pile === "monster" ? next.players[side].reserve.at(-1)?.id ?? null : next.players[side].hand.at(-1) ?? null) : null;
  return traced(state, next, { kind: "draw", actor: side, ok, cardId, target: null, end: null });
}

function drawCore(state: Duel, pile: "monster" | "spell"): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  const side = state.turn;
  let player = state.players[side];
  if (player.drawLock) return note(state, "Lượt này không được rút bài.");
  if (player.draws >= 1) return note(state, "Mỗi lượt chỉ rút 1 lá.");
  const before = player.stars;
  const paid = pay(player, 1);
  if (!paid) return note(state, "Rút bài cần 1 gem trên quả cầu.");
  player = paid;
  if (pile === "monster") {
    if (player.monsterDeck.length === 0) return note(state, "Hết quái để rút.");
    const [held, ...rest] = player.monsterDeck;
    player = { ...player, monsterDeck: rest, reserve: [...player.reserve, held], draws: player.draws + 1 };
  } else {
    if (player.spellDeck.length === 0) return note(state, "Hết phép để rút.");
    const [cardId, ...rest] = player.spellDeck;
    const tax = player.spellTax ?? [];
    player = {
      ...player,
      spellDeck: rest,
      spellTax: tax.slice(1),
      hand: [...player.hand, cardId],
      tolls: [...handTolls(player), Boolean(tax[0])],
      draws: player.draws + 1,
    };
  }
  const kind = pile === "monster" ? "1 quái" : "1 phép";
  const cardName = pile === "monster" ? monsterCard(player.reserve.at(-1)?.id ?? "")?.name : spellCard(player.hand.at(-1) ?? "")?.name;
  const shown = cardName ?? kind;
  return note(pingStars(patch({ ...state, seq: state.seq + 1 }, side, player), side, before, player.stars), `${sideName(side)} rút ${shown}.`);
}

export function summon(state: Duel, reserveIndex: number, slot: 0 | 1 | 2): Duel {
  const next = summonCore(state, reserveIndex, slot);
  if (next === state) return next;
  const side = state.turn;
  const before = new Set(state.players[side].field.map((mon) => mon?.uid));
  const gained = next.players[side].field.some((mon) => mon && !before.has(mon.uid));
  const ok = next.players[side].summons > state.players[side].summons || (next.players[side].aside ?? 0) > (state.players[side].aside ?? 0) || gained;
  if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
  return traced(state, next, { kind: "summon", actor: side, ok, cardId: state.players[side].reserve[reserveIndex]?.id ?? null, target: null, end: null });
}

function summonCore(state: Duel, reserveIndex: number, slot: 0 | 1 | 2): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  const side = state.turn;
  const player = state.players[side];
  const held = player.reserve[reserveIndex];
  const cardId = held?.id;
  const card = cardId ? monsterCard(cardId) : undefined;
  if (!card) return state;
  const witch = cardId === "phu-thuy-thoi-gian";
  if (witch) {
    if ((player.aside ?? 0) >= 1) return note(state, `${card.name} đã triệu hồi trong lượt này.`);
  } else if (player.summons >= 1) return note(state, "Mỗi lượt chỉ triệu hồi 1 lần.");
  if (player.field[slot]) return note(state, "Ô này đã có quái.");
  if ((player.locked?.[slot] ?? 0) > 0) return note(state, "Ô này đang ngập, chưa dùng được");
  const short = player.stars < card.stars;
  const studied = cardId === GUARD_KNIGHT && knightTutor(player.field);
  const forced = short && cardId === "trieu-hoi-ac-ma";
  if (short && !forced && !studied) return note(state, `Cần ${card.stars} sao.`);
  const gate = demonGate(player, held);
  if (typeof gate === "string") return note(state, gate);
  const before = player.stars;
  const gratis = held.freeAt != null && held.freeAt === player.turns;
  const tolled = gratis ? false : Boolean(held.toll);
  const bill = playBill(gratis ? 0 : card.gems, tolled, player.orb, player.flask);
  if (bill) return note(state, bill);
  const paid = payPlayed(gate.player, gratis ? 0 : card.gems, tolled);
  if (!paid) return note(state, bill ?? `Cần ${card.gems} gem đang có.`);
  let next = place(state, side, cardId, held);
  if (cardId === "kazura" && !held.saved) next.dim = true;
  if (cardId === "trieu-hoi-ac-ma" && player.stars === 3 && !held.saved) next.pact = true;
  let grown = false;
  if (cardId === GUARD_KNIGHT && !held.saved && player.stars >= 3) {
    grown = true;
    next = { ...next, atk: next.atk + 2, maxHp: (next.maxHp || next.hp) + 3, hp: next.hp + 3, raised: markRaised(next, { atk: 2, hp: 3 }) };
  }
  if (gate.fresh) next.seen = true;
  const field = [...paid.field] as Player["field"];
  field[slot] = next;
  const reserve = paid.reserve
    .filter((_, index) => index !== reserveIndex)
    .map((pile) => (pile.freeAt == null ? pile : { ...pile, freeAt: undefined }));
  let placed = shuffleSea({ ...paid, field, reserve, summons: witch ? paid.summons : paid.summons + 1, aside: witch ? (paid.aside ?? 0) + 1 : paid.aside });
  const vow = absorbVow(placed, next.uid);
  placed = vow.player;
  if (placed.hats) placed = { ...placed, field: mixRow(placed.field) as Player["field"] };
  const line = vow.eaten
    ? `${card.name} bị hiến tế.`
    : forced
      ? `${sideName(side)} bất chấp triệu hồi ${card.name}. Đầu lượt phải trả khế ước.${gate.fresh ? " Lần ra sân này tốn 1 mana." : ""}`
      : `${sideName(side)} triệu hồi ${card.name}${grown ? " Trưởng thành: +2 công, +3 máu." : ""}${gate.fresh ? " Lần ra sân này tốn 1 mana." : ""}`;
  return note(
    pingStars(patch({ ...state, seq: state.seq + 1, rite: vow.eaten ? { side, slot, seq: state.seq + 1 } : state.rite }, side, placed), side, before, placed.stars),
    line,
  );
}

export function vowCap(id: string, level = 1): number {
  const stars = cardStars(id, level);
  if (stars < 2 || stars > 4) return 0;
  return stars - 1;
}

export function summonVow(state: Duel, reserveIndex: number, slot: 0 | 1 | 2, picks: string[]): Duel {
  const next = summonVowCore(state, reserveIndex, slot, picks);
  if (next === state) return next;
  const side = state.turn;
  const before = new Set(state.players[side].field.map((mon) => mon?.uid));
  const gained = next.players[side].field.some((mon) => mon && !before.has(mon.uid));
  const ok = next.players[side].summons > state.players[side].summons || (next.players[side].aside ?? 0) > (state.players[side].aside ?? 0) || gained;
  return traced(state, next, { kind: "summon", actor: side, ok, cardId: state.players[side].reserve[reserveIndex]?.id ?? null, target: null, end: null });
}

function summonVowCore(state: Duel, reserveIndex: number, slot: 0 | 1 | 2, picks: string[]): Duel {
  const side = state.turn;
  const unique = [...new Set(picks)].filter((uid) => state.players[side].field.some((mon) => mon?.uid === uid && mon.hp > 0));
  if (unique.length === 0 && !state.players[side].field[slot]) return summonCore(state, reserveIndex, slot);
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  const player = state.players[side];
  const held = player.reserve[reserveIndex];
  const cardId = held?.id;
  const card = cardId ? monsterCard(cardId) : undefined;
  if (!card || !cardId || !held) return state;
  const cap = vowCap(cardId, held.saved?.level ?? 1);
  if (cap <= 0) return note(state, `${card.name} không triệu hồi hiến tế được.`);
  if (unique.length > cap) return note(state, `Tối đa ${cap} quái.`);
  const full = player.field.every((mon) => mon);
  if (full && unique.length === 0) return note(state, "Sân đầy, hãy hiến ít nhất 1 quái.");
  const witch = cardId === "phu-thuy-thoi-gian";
  if (witch) {
    if ((player.aside ?? 0) >= 1) return note(state, `${card.name} đã triệu hồi trong lượt này.`);
  } else if (player.summons >= 1) return note(state, "Mỗi lượt chỉ triệu hồi 1 lần.");
  const occupant = player.field[slot];
  const freed = unique.map((uid) => player.field.findIndex((mon) => mon?.uid === uid)).filter((index) => index >= 0);
  let land: 0 | 1 | 2 = slot;
  if (occupant && !unique.includes(occupant.uid)) {
    if (freed.length === 0) return note(state, "Ô này đã có quái.");
    land = freed[Math.floor(Math.random() * freed.length)] as 0 | 1 | 2;
  }
  if ((player.locked?.[land] ?? 0) > 0 && !player.field[land]) return note(state, "Ô này đang ngập, chưa dùng được");
  const stars = cardStars(cardId, held.saved?.level ?? 1);
  const short = player.stars < stars;
  const studied = cardId === GUARD_KNIGHT && knightTutor(player.field);
  const forced = short && cardId === "trieu-hoi-ac-ma";
  if (short && !forced && !studied) return note(state, `Cần ${stars} sao.`);
  const gate = demonGate(player, held);
  if (typeof gate === "string") return note(state, gate);
  const before = player.stars;
  const gratis = held.freeAt != null && held.freeAt === player.turns;
  const tolled = gratis ? false : Boolean(held.toll);
  const bill = playBill(gratis ? 0 : card.gems, tolled, player.orb, player.flask);
  if (bill) return note(state, bill);
  const paid = payPlayed(gate.player, gratis ? 0 : card.gems, tolled);
  if (!paid) return note(state, bill ?? `Cần ${card.gems} gem đang có.`);
  const names = unique
    .map((uid) => {
      const mon = player.field.find((unit) => unit?.uid === uid);
      return mon ? cardOf(mon).name : "";
    })
    .filter(Boolean);
  let born = place(state, side, cardId, held);
  if (cardId === "kazura" && !held.saved) born = { ...born, dim: true };
  if (cardId === "trieu-hoi-ac-ma" && player.stars === 3 && !held.saved) born = { ...born, pact: true };
  const count = unique.length;
  const hp = count >= 3 ? 3 : count >= 1 ? 2 : 0;
  const atk = count >= 2 ? 2 : 0;
  const def = count >= 3 ? 1 : 0;
  const skill = count >= 2 ? 2 : 0;
  born = {
    ...born,
    atk: born.atk + atk,
    def: born.def + def,
    hp: born.hp + hp,
    maxHp: (born.maxHp || born.hp) + hp,
    skillUp: (born.skillUp ?? 0) + skill,
    raised: hp || atk || def ? markRaised(born, { atk, def, hp }) : born.raised,
  };
  if (gate.fresh) born.seen = true;
  const cleared = paid.field.map((mon) => (mon && unique.includes(mon.uid) ? null : mon)) as Player["field"];
  const field = [...cleared] as Player["field"];
  field[land] = born;
  const reserve = paid.reserve.filter((_, index) => index !== reserveIndex).map((pile) => (pile.freeAt == null ? pile : { ...pile, freeAt: undefined }));
  let placed = shuffleSea({ ...paid, field, reserve, summons: witch ? paid.summons : paid.summons + 1, aside: witch ? (paid.aside ?? 0) + 1 : paid.aside });
  const vow = absorbVow(placed, born.uid);
  placed = vow.player;
  if (placed.hats) placed = { ...placed, field: mixRow(placed.field) as Player["field"] };
  const bits = [hp ? `+${hp} máu` : "", atk ? `+${atk} công` : "", skill ? `+${skill} sát thương kỹ năng` : "", def ? `+${def} phòng ngự` : ""].filter(Boolean);
  const eaten = names.length ? `${names.join(", ")} bị hiến tế. ` : "";
  const line = vow.eaten ? `${eaten}${card.name} bị hiến tế.` : `${eaten}${sideName(side)} triệu hồi ${card.name}${bits.length ? `. ${bits.join(", ")}.` : "."}`;
  const seq = state.seq + 1;
  return note(
    pingStars(
      patch(
        {
          ...state,
          seq,
          ashes: names.length ? { side, slots: freed as Array<0 | 1 | 2>, seq } : state.ashes,
          rite: vow.eaten ? { side, slot: land, seq } : state.rite,
        },
        side,
        placed,
      ),
      side,
      before,
      placed.stars,
    ),
    line,
  );
}

export function fuse(state: Duel, reserveIndex: number, fieldUid: string, slot: 0 | 1 | 2): Duel {
  const next = fuseCore(state, reserveIndex, fieldUid, slot);
  if (next === state) return next;
  const ok = next.players !== state.players;
  if (!ok && next.upkeep && !state.upkeep) return next;
  const held = state.players[state.turn].reserve[reserveIndex];
  return traced(state, next, {
    kind: "fuse",
    actor: state.turn,
    ok,
    cardId: held?.id ?? null,
    target: monsterTarget(state, fieldUid),
    end: null,
  });
}

function fuseCore(state: Duel, reserveIndex: number, fieldUid: string, slot: 0 | 1 | 2): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  const side = state.turn;
  const player = state.players[side];
  const held = player.reserve[reserveIndex];
  const host = player.field.find((mon) => mon?.uid === fieldUid) ?? null;
  if (!held || !host) return state;
  const ids = player.field.filter((mon): mon is FieldMon => Boolean(mon)).map((mon) => mon.cardId);
  const knight = findKnightFusion(held.id, host.cardId, ids);
  const recipe = findFusion(held.id, host.cardId);
  const resultId = knight?.result ?? recipe?.result;
  const handCard = monsterCard(held.id);
  const result = resultId ? monsterCard(resultId) : undefined;
  if ((!recipe && !knight) || !handCard || !result) return note(state, "Không hợp nhất được.");
  if (player.field[slot] && player.field[slot]?.uid !== fieldUid && !(knight && player.field[slot]?.cardId && ["hiep-si-cua-vua", "hiep-si-ho-ve", "hiep-si-cua-hau"].includes(player.field[slot]?.cardId ?? ""))) return note(state, "Ô này đã có quái.");
  if ((player.locked?.[slot] ?? 0) > 0) return note(state, "Ô này đang ngập, chưa dùng được");
  const born = place({ ...state, seq: state.seq + 1 }, side, result.id);
  const knights = new Set(["hiep-si-cua-vua", "hiep-si-ho-ve", "hiep-si-cua-hau"]);
  const field = player.field.map((mon) => (knight && mon && knights.has(mon.cardId) ? null : mon?.uid === fieldUid ? null : mon)) as Player["field"];
  field[slot] = born;
  const reserve = player.reserve.filter((_, index) => index !== reserveIndex);
  const placed = { ...player, field, reserve, spent: [...(player.spent ?? []), held.id, ...(knight ? ids.filter((id) => knights.has(id) && id !== held.id) : [])] };
  const handName = fieldName({ cardId: held.id, level: held.saved?.level ?? 1 });
  const line = knight ? `Hợp nhất ba hiệp sĩ trở thành ${result.name}.` : `Hợp nhất ${handName} và ${fieldName(host)} trở thành ${result.name}.`;
  return note(patch({ ...state, seq: state.seq + 2 }, side, placed), line);
}

function absorbVow(player: Player, uid: string): { player: Player; eaten: boolean } {
  const born = player.field.find((mon) => mon?.uid === uid) ?? null;
  if (!born || born.copy) return { player, eaten: false };
  const stars = monsterCard(born.cardId)?.stars ?? 99;
  if (stars < 1 || stars > 2) return { player, eaten: false };
  if (!player.field.some((mon) => mon && mon.uid !== uid && (mon.path ?? 0) > 0)) return { player, eaten: false };
  const field = player.field.map((mon) => {
    if (!mon) return mon;
    if (mon.uid === uid) return null;
    if ((mon.path ?? 0) <= 0) return mon;
    const maxHp = (mon.maxHp || mon.hp) + 1;
    return {
      ...mon,
      fed: (mon.fed ?? 0) + 1,
      def: mon.def + 1,
      mdef: mon.mdef + 1,
      maxHp,
      hp: mon.hp + 1,
      raised: markRaised(mon, { def: 1, mdef: 1, hp: 1 }),
    };
  });
  return { player: { ...player, field }, eaten: true };
}

function becomeLegend(mon: FieldMon): FieldMon {
  const fed = mon.fed ?? 0;
  const card = monsterCard("chien-binh-huyen-thoai");
  const atk = (card?.atk ?? 2) + fed;
  const def = (card?.def ?? 0) + fed;
  const mdef = (card?.mdef ?? 0) + fed;
  const maxHp = (card?.hp ?? 5) + fed;
  return clearHarm({
    ...mon,
    cardId: "chien-binh-huyen-thoai",
    atk,
    def,
    mdef,
    maxHp,
    hp: maxHp,
    path: undefined,
    fed,
    clash: undefined,
    gaze: undefined,
    raised: fed > 0 ? { atk: fed, def: fed, mdef: fed, hp: fed } : undefined,
  });
}

function settleVow(mon: FieldMon): FieldMon {
  if (mon.hp <= 0) return mon;
  const fed = mon.fed ?? 0;
  const path = mon.path ?? 0;
  if (path <= 0) {
    if (mon.cardId !== "chien-binh-huyen-thoai" || fed <= 0) return mon;
    const cap = mon.maxHp || mon.hp;
    return { ...mon, hp: Math.min(cap, mon.hp + fed) };
  }
  if (path === 1) return becomeLegend(mon);
  const cap = mon.maxHp || mon.hp;
  return { ...mon, hp: Math.min(cap, mon.hp + fed), path: path - 1 };
}

export function offerVow(state: Duel, uid: string): Duel {
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== "ky-si-bong-toi" || mon.dim || held(mon) || (mon.path ?? 0) > 0) return state;
  const cost = skillManaCost(mon.cardId, 1);
  const before = you.stars;
  const paid = pay(you, cost);
  if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
  const turns = grabNums(skillText(mon.cardId), /(\d+)\s*lượt/gi)[0] ?? 5;
  const field = paid.field.map((unit) =>
    unit?.uid === uid ? { ...unit, atk: 0, def: 0, mdef: 0, path: turns, fed: 0, raised: undefined, clash: undefined } : unit,
  );
  return note(
    pingStars(patch(state, side, { ...paid, field }), side, before, paid.stars),
    `${cardOf(mon).name} hiến tế. Mất hết công và phòng ngự. Không hành động trong ${turns} lượt.`,
  );
}

function withLegend(mon: FieldMon): FieldMon {
  if (mon.cardId !== "chien-binh-huyen-thoai" || mon.clash) return mon;
  const atk = skillFigure(mon.cardId, "atk", 3);
  const def = skillFigure(mon.cardId, "def", 2);
  const bonus = skillFigure(mon.cardId, "max", 2);
  return { ...mon, hp: mon.hp + bonus, maxHp: (mon.maxHp || mon.hp) + bonus, clash: { atk, def, maxHp: bonus } };
}

function stampLegend(state: Duel, uids: string[]): Duel {
  const want = new Set(uids);
  let next = state;
  const names: string[] = [];
  for (const side of [0, 1] as const) {
    const player = next.players[side];
    let changed = false;
    const field = player.field.map((mon) => {
      if (!mon || !want.has(mon.uid)) return mon;
      const armed = withLegend(mon);
      if (armed === mon) return mon;
      changed = true;
      names.push(cardOf(mon).name);
      return armed;
    });
    if (changed) next = patch(next, side, { ...player, field });
  }
  if (names.length === 0) return state;
  const atk = skillFigure("chien-binh-huyen-thoai", "atk", 3);
  const def = skillFigure("chien-binh-huyen-thoai", "def", 2);
  const max = skillFigure("chien-binh-huyen-thoai", "max", 2);
  return note(next, `${names.join(", ")} nhận +${atk} công, +${def} thủ và +${max} máu tối đa cho lần giáp lá cà này.`);
}

function rabbitDodge(self: FieldMon, other: FieldMon): boolean {
  if (self.cardId !== "tho-den-tinh-nghich") return false;
  const rates = grabNums(skillText(self.cardId), /(\d+)\s*%/gi);
  const stars = monsterCard(other.cardId)?.stars ?? 0;
  const pct = stars >= 3 ? (rates[1] ?? rates[0] ?? 70) : (rates[0] ?? 35);
  return Math.random() < pct / 100;
}

function releaseGuardAttack(before: FieldMon, after: FieldMon, defender: FieldMon, allies?: Array<FieldMon | null>): { attacker: FieldMon; defender: FieldMon } {
  if (before.cardId !== GUARD_KNIGHT || before.guarding) return { attacker: after, defender };
  const lostPhys = Boolean(before.oath?.phys) && !after.oath?.phys;
  const lostSpell = Boolean(before.oath?.spell) && !after.oath?.spell;
  if (!lostPhys && !lostSpell) return { attacker: after, defender };
  const back = { ...(after.oathBack ?? {}) };
  if (lostPhys) back.phys = true;
  if (lostSpell) back.spell = true;
  const due = before.debt?.[0] ?? { p: 0, s: 0, t: 0 };
  const now = after.debt?.[0] ?? { p: 0, s: 0, t: 0 };
  const kept = { p: Math.max(0, now.p - due.p), s: Math.max(0, now.s - due.s), t: 0 };
  const cleared: FieldMon = { ...after, oathBack: back, debt: kept.p || kept.s ? [{ ...kept }, { p: 0, s: 0, t: 0 }] : undefined };
  if (due.p <= 0 && due.s <= 0) return { attacker: cleared, defender };
  const landed = landHell(defender, { phys: due.p, spell: due.s, tru: 0 }, allies);
  wardLines.push(`${cardOf(before).name} giải phóng ${due.p} sát thương vật lý và ${due.s} sát thương phép`);
  return { attacker: cleared, defender: landed.mon };
}

function guardStrikeKind(mon: FieldMon, roster?: string[]): "phys" | "spell" {
  if (mon.cardId !== GUARD_KNIGHT) return "phys";
  const lostPhys = Boolean(roster?.includes(KING)) && !mon.oath?.phys;
  const lostSpell = Boolean(roster?.includes(QUEEN_KNIGHT)) && !mon.oath?.spell;
  if (lostPhys) return "spell";
  if (lostSpell) return "phys";
  return "phys";
}

function strikeSpell(defender: FieldMon, raw: number, allies?: Array<FieldMon | null>): { mon: FieldMon; bite: number; surplus: number } {
  if (raw <= 0) return { mon: defender, bite: 0, surplus: 0 };
  const mon = openShade(defender);
  if (mon.cardId === "chien-binh-rong") {
    const slice = third(raw);
    const queued = pushDebt(mon, { p: 0, s: slice, t: 0 });
    const dealt = Math.max(0, slice - liveMdef(queued, allies));
    const soaked = soak(queued, "spell", hurt(queued, dealt));
    return applyIncoming(soaked.mon, soaked.amount, allies);
  }
  const gated = swallowOath(mon, "spell", raw);
  if (gated.mon !== mon) return { mon: gated.mon, bite: 0, surplus: 0 };
  const mdef = liveMdef(mon, allies);
  const dealt = Math.max(0, raw - mdef);
  const blocked = Math.max(0, Math.min(raw, mdef));
  const plated = bankPlate(mon, "spell", blocked);
  const soaked = soak(plated, "spell", hurt(plated, dealt));
  const hit = applyIncoming(soaked.mon, soaked.amount, allies);
  const stored = mon.cardId === "sua-hut-ma-phap" ? (mon.stored ?? 0) + blocked : hit.mon.stored;
  return { ...hit, mon: { ...hit.mon, stored } };
}

function strikePair(attacker: FieldMon, defender: FieldMon, alliesA?: Array<FieldMon | null>, alliesB?: Array<FieldMon | null>, rosterA?: string[], rosterB?: string[], rockA = 0, rockB = 0): { attacker: FieldMon; defender: FieldMon; dodged: boolean; bite: number; surplus: number } {
  let atk = liveAtk(attacker) + rockA;
  let counter = liveAtk(defender) + rockB;
  if (defender.riposte) counter = 0;
  const defA = liveDef(attacker, alliesA);
  const defB = liveDef(defender, alliesB);
  if (defender.cardId === "kraken") counter += Math.min(Math.max(0, defB), Math.max(0, atk));
  if (attacker.cardId === "kraken") atk += Math.min(Math.max(0, defA), Math.max(0, counter));
  const plate = plateBank(attacker);
  const bolt = attacker.cardId === PERFECT && Boolean(attacker.bolt);
  if (!bolt) atk += plate.p;
  const attackerDodged = rabbitDodge(attacker, defender);
  const defenderDodged = rabbitDodge(defender, attacker);
  const beam = Boolean(attacker.horn || attacker.gaze || bolt);
  if (shadeHidden(attacker) || (shadeHidden(defender) && !beam) || defender.cage) counter = 0;
  const hiddenTrue = shadeHidden(attacker) && !beam;
  const gazeTrue = Boolean(attacker.gaze && !attacker.horn && !bolt) || hiddenTrue;
  const counterBlow = defender.cardId === RIDER && !beam && !shadeHidden(attacker) ? riderPackets(defender, attacker, alliesA) : null;
  const blockSpell = !attackerDodged && !beam && !counterBlow && defender.cardId === GUARD_KNIGHT && Boolean(defender.guarding) && guardStrikeKind(defender, rosterB) === "spell" && counter > 0;
  const counterRaw = outgoing(defender, counter);
  const struck = attackerDodged || beam
    ? { mon: attacker, bite: 0, surplus: 0 }
    : counterBlow
      ? applyIncoming(attacker, counterBlow.first, alliesA)
      : blockSpell
        ? strikeSpell(attacker, counterRaw, alliesA)
        : takePhysical(attacker, counterRaw, alliesA);
  if (blockSpell && counterRaw > 0) wardLines.push(`${cardOf(defender).name} gây ${counterRaw} sát thương phép`);
  const nextAttacker = spendBless(clearClash({
    ...struck.mon,
    charge: attacker.charge + (attackerDodged ? 1 : 0),
    dim: true,
    def: defender.cardId === "khung-long-vay-kiem" ? attacker.def - skillLoss(defender.cardId, "def", 2) : struck.mon.def,
    mdef: struck.mon.mdef,
  }));
  const hornRaw = bolt ? liveAtk(attacker) + plate.p + plate.s : attacker.horn === "plus" ? Math.min(8, atk) : attacker.horn === "splash" ? Math.min(4, atk) : atk;
  const hornAmount = outgoing(attacker, hornRaw);
  let bite = 0;
  let surplus = 0;
  let defenderBody: FieldMon;
  if (gazeTrue) {
    if (defenderDodged) defenderBody = defender;
    else {
      const hit = landTrue(defender, outgoing(attacker, atk), alliesB);
      defenderBody = hit.mon;
      bite = hit.bite;
      surplus = hit.surplus;
    }
  } else if (beam) {
    const gated = swallowOath(defender, "spell", defenderDodged ? 0 : hornAmount);
    if (gated.mon !== defender) {
      defenderBody = gated.mon;
    } else {
    const mdef = liveMdef(defender, alliesB);
    if (defender.cardId === "chien-binh-rong" && !defenderDodged) {
      const slice = third(hornAmount);
      const queued = pushDebt(defender, { p: 0, s: slice, t: 0 });
      const dealt = Math.max(0, slice - liveMdef(queued, alliesB));
      const hit = applyIncoming(queued, hurt(queued, dealt), alliesB);
      defenderBody = hit.mon;
      bite = hit.bite;
      surplus = hit.surplus;
    } else {
      const blocked = Math.max(0, Math.min(hornAmount, mdef));
      const plated = bankPlate(defender, "spell", defenderDodged ? 0 : blocked);
      const dealt = Math.max(0, hornAmount - mdef);
      const incoming = defenderDodged ? 0 : hurt(plated, dealt);
      const soaked = soak(plated, "spell", incoming);
      const hit = applyIncoming(soaked.mon, soaked.amount, alliesB);
      const stored = defender.cardId === "sua-hut-ma-phap" ? (defender.stored ?? 0) + blocked : hit.mon.stored;
      defenderBody = { ...hit.mon, stored };
      bite = hit.bite;
      surplus = hit.surplus;
    }
    }
  } else {
    const riderAtk = attacker.cardId === RIDER;
    const guardSpell = !riderAtk && guardStrikeKind(attacker, rosterA) === "spell";
    const dragon = !riderAtk && !guardSpell && defender.cardId === "chien-binh-rong" && !defenderDodged;
    let hit;
    if (guardSpell) {
      const raw = defenderDodged ? 0 : outgoing(attacker, atk);
      hit = strikeSpell(defender, raw, alliesB);
      if (raw > 0) wardLines.push(`${cardOf(attacker).name} gây ${raw} sát thương phép`);
    } else if (dragon) hit = takePhysical(defender, outgoing(attacker, atk), alliesB);
    else if (riderAtk && !defenderDodged) {
      const pack = riderPackets(attacker, defender, alliesB);
      const soaked = soak(defender, "phys", pack.physical);
      hit = applyIncoming(soaked.mon, Math.max(0, pack.first - pack.physical) + soaked.amount, alliesB);
    } else {
      const raw = outgoing(attacker, atk);
      const gated = swallowOath(defender, "phys", defenderDodged ? 0 : raw);
      if (gated.mon !== defender) hit = { mon: gated.mon, bite: 0, surplus: 0 };
      else {
      const blocked = defenderDodged ? 0 : Math.max(0, Math.min(raw, defB));
      const plated = bankPlate(defender, "phys", blocked);
      const soaked = soak(plated, "phys", defenderDodged ? 0 : hurt(plated, physical(raw, defB)));
      hit = applyIncoming(soaked.mon, soaked.amount, alliesB);
      }
    }
    if (!guardSpell && shadeHidden(defender) && !defenderDodged) {
      const raw = outgoing(attacker, atk);
      const pool = defender.stored ?? 1;
      const taken = Math.min(pool, Math.max(0, raw));
      const left = pool - taken;
      hit = { mon: left > 0 ? { ...defender, stored: left } : { ...defender, shown: undefined, stored: undefined }, bite: taken, surplus: 0 };
    }
    if (attacker.cardId === "ke-san-moi-tu-than" && attacker.preyKind && attacker.preyKind !== "phys" && !defenderDodged) {
      const amount = liveAtk(attacker);
      if (attacker.preyKind === "spell") {
        const spellBody = damageSpell(defender, amount, alliesB, attacker);
        hit = { mon: spellBody, bite: Math.max(0, defender.hp - Math.max(0, spellBody.hp)), surplus: 0 };
      } else {
        const tru = landTrue(defender, outgoing(attacker, amount), alliesB);
        hit = { mon: tru.mon, bite: tru.bite, surplus: tru.surplus };
      }
    }
    defenderBody = hit.mon;
    bite = hit.bite;
    surplus = hit.surplus;
  }
  if (!beam && plate.s > 0) defenderBody = damageSpell(defenderBody, plate.s, alliesB);
  const nextDefender = {
    ...defenderBody,
    charge: defender.charge + (defenderDodged ? 1 : 0),
    def: attacker.cardId === "khung-long-vay-kiem" ? defender.def - skillLoss(attacker.cardId, "def", 2) : defenderBody.def,
    mdef: defenderBody.mdef,
    dim: true,
  };
  if (defender.blocksLeft > 1) {
    nextDefender.dim = false;
    nextDefender.blocksLeft -= 1;
  }
  nextDefender.guarding = undefined;
  nextDefender.oathShot = undefined;
  nextDefender.riposte = undefined;
  const grownAttacker = attacker.cardId === PERFECT ? spendPlate(clashGrow(nextAttacker), bolt ? { p: plate.p, s: plate.s } : plate, bolt) : clashGrow(nextAttacker);
  const grownDefender = dropGuard(clashGrow(dropClash(nextDefender)));
  const dumped = releaseGuardAttack(attacker, grownAttacker, grownDefender, alliesB);
  const attackerBreak = settleMystic(attacker, dumped.attacker, dumped.defender, alliesB, true);
  const defenderBreak = settleMystic(defender, attackerBreak.foe ?? dumped.defender, attackerBreak.mon, alliesA, Boolean(defender.guarding));
  return { attacker: defenderBreak.foe ?? attackerBreak.mon, defender: defenderBreak.mon, dodged: attackerDodged || defenderDodged, bite, surplus };
}

function withLeech(field: Array<FieldMon | null>, attacker: FieldMon, bite: number, surplus: number) {
  const leech = leechKazura(attacker, bite, surplus, field);
  const healed = new Map(leech.allies.filter((mon) => mon).map((mon) => [mon!.uid, mon!]));
  return {
    attacker: leech.attacker,
    field: field.map((mon) => {
      if (!mon) return mon;
      if (mon.uid === attacker.uid) return leech.attacker;
      return mon.cardId === "kizuran" ? (healed.get(mon.uid) ?? mon) : mon;
    }),
  };
}

function dropDead(player: Player): Player {
  const hatched = settleCocoon(player);
  return { ...hatched, field: alive(hatched.field) };
}

export function checkWinner(state: Duel): Duel {
  const fallen = state.players.findIndex((player) => player.hp <= 0);
  if (fallen === -1) return state;
  const winner = (fallen === 0 ? 1 : 0) as Side;
  const next = { ...state, winner, step: "over" as const, pending: null, hold: null, log: [...state.log, `${sideName(winner)} thắng.`] };
  if (state.winner || (state.events ?? []).some((row) => row.kind === "win")) return next;
  return traced(state, next, { kind: "win", actor: winner, ok: true, cardId: null, target: null, end: "damage" });
}

function skillText(id: string) {
  return plainCopy(monsterCard(id)?.skill ?? "");
}

function spellText(id: string) {
  return spellCard(id)?.effect ?? "";
}

function grabNums(text: string, pattern: RegExp): number[] {
  const found: number[] = [];
  for (const hit of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
    const raw = hit.slice(1).find((part) => part !== undefined);
    const value = Number(raw);
    if (Number.isFinite(value)) found.push(Math.round(value));
  }
  return found;
}

function bulletRamp(text: string): number[] {
  const hit = text.match(/từ\s+(\d+)\s+rồi\s+(\d+)\s+và loạt cuối là\s+(\d+)/i);
  if (!hit) return [1, 2, 4];
  return [Number(hit[1]), Number(hit[2]), Number(hit[3])];
}

const NUM_ATK = /(?:\+|tăng)\s*(\d+)\s*công|công\s*(\d+)/gi;
const NUM_DEF = /(?:\+\s*(\d+)\s*thủ(?!\s*phép)|thủ\s*(\d+)(?!\s*phép))/gi;
const NUM_GUARD = /(\d+)\s*phòng\s*ngự/gi;
const NUM_MDEF = /(?:\+\s*(\d+)\s*thủ\s*phép|thủ\s*phép\s*(\d+))/gi;
const NUM_HEAL = /hồi(?:\s*phục)?\s*(\d+)\s*máu|hồi\s*thêm\s*(\d+)/gi;
const NUM_MAX = /(?:\+|thêm|tăng)\s*(\d+)\s*máu\s*tối\s*đa/gi;
const NUM_HP = /máu\s*(\d+)/gi;
const NUM_DMG = /(\d+)\s*sát\s*thương/gi;

export function skillFigure(id: string, kind: "atk" | "def" | "guard" | "mdef" | "heal" | "max" | "hp" | "dmg", fallback: number, index = 0) {
  const text = skillText(id);
  if (kind === "dmg") {
    const dealt = grabNums(text, NUM_DMG);
    if (dealt.length > 0) return dealt[index] ?? fallback;
    return grabNums(text, /gây\s*(\d+)/gi)[index] ?? fallback;
  }
  const pattern = kind === "atk" ? NUM_ATK : kind === "def" ? NUM_DEF : kind === "guard" ? NUM_GUARD : kind === "mdef" ? NUM_MDEF : kind === "heal" ? NUM_HEAL : kind === "max" ? NUM_MAX : NUM_HP;
  return grabNums(text, pattern)[index] ?? fallback;
}

function favorShots<T extends { kind: "spell" | "phys" | "tru"; n: number }>(mon: FieldMon, shots: T[]): T[] {
  const plus = mon.skillUp ?? 0;
  if (plus <= 0 || shots.length === 0) return shots;
  const rank = (kind: T["kind"]) => (kind === "spell" ? 0 : kind === "phys" ? 1 : 2);
  const best = Math.min(...shots.map((shot) => rank(shot.kind)));
  let pick = -1;
  let top = -1;
  shots.forEach((shot, index) => {
    if (rank(shot.kind) !== best) return;
    if (shot.n >= top) {
      top = shot.n;
      pick = index;
    }
  });
  if (pick < 0) return shots;
  return shots.map((shot, index) => (index === pick ? { ...shot, n: shot.n + plus } : shot));
}

function skillThreat(cardId: string, index: number): number {
  const whole = skillText(cardId);
  const numbered = whole
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line));
  const text = numbered.length > 0 ? (numbered[index] ?? numbered[0]) : whole;
  const per = /mỗi/i.test(text);
  const count = per ? (grabNums(text, /(\d+)\s*(?:quả|phát|loạt|trái|đòn|lần)/gi)[0] ?? 1) : 1;
  const phys = grabNums(text, /(\d+)\s*sát thương vật lý/gi).reduce((sum, n) => sum + n, 0);
  const spell = grabNums(text, /(\d+)\s*sát thương phép/gi).reduce((sum, n) => sum + n, 0);
  const tru = grabNums(text, /(\d+)\s*sát thương chuẩn/gi).reduce((sum, n) => sum + n, 0);
  const kinds = [phys, spell, tru].filter((n) => n > 0).map((n) => n * count);
  if (kinds.length > 0) return Math.max(...kinds);
  const plain = grabNums(text, /(\d+)\s*sát thương/gi).reduce((sum, n) => sum + n, 0);
  return plain * count;
}

function skillLoss(id: string, kind: "def" | "mdef", fallback: number) {
  const text = skillText(id);
  const pattern = kind === "def" ? /giảm\s*(\d+)\s*thủ(?!\s*phép)/gi : /(?:giảm\s*(\d+)\s*thủ\s*phép|và\s*(\d+)\s*thủ\s*phép)/gi;
  return grabNums(text, pattern)[0] ?? fallback;
}

function spellFigure(id: string, kind: "atk" | "heal", fallback: number) {
  const text = spellText(id);
  const found = grabNums(text, kind === "atk" ? NUM_ATK : NUM_HEAL);
  return found[0] ?? fallback;
}

export function skillManaCost(id: string, fallback = 1) {
  const hit = /tiêu(?:\s*hao)?\s*(\d+)\s*mana/i.exec(skillText(id));
  const value = hit ? Number(hit[1]) : fallback;
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
}

export function skillHpBonus(id: string, fallback = 1) {
  return skillFigure(id, "max", fallback);
}

function payCost(player: Player, cost: number): Player | null {
  if (cost <= 0) return player;
  return pay(player, cost);
}

function gnawReady(mon: FieldMon | null, owner: Player) {
  return Boolean(mon && mon.cardId === "chien-si-gam-nham" && !mon.dim && mon.stun === 0 && !hexLocked(mon) && owner.orb >= skillManaCost(mon.cardId));
}

function boostGnaw(mon: FieldMon): FieldMon {
  if (mon.cage) return { ...mon, dim: true };
  const maxHp = mon.maxHp || mon.hp;
  const bonus = skillHpBonus(mon.cardId);
  return {
    ...mon,
    dim: true,
    def: mon.def * 2,
    mdef: mon.mdef * 2,
    maxHp: maxHp + bonus,
    hp: mon.hp + bonus,
    buff: {
      def: (mon.buff?.def ?? 0) + mon.def,
      mdef: (mon.buff?.mdef ?? 0) + mon.mdef,
      maxHp: (mon.buff?.maxHp ?? 0) + bonus,
    },
  };
}

function spentAct(mon: FieldMon): FieldMon {
  if (mon.blocksLeft > 1) return mon;
  return { ...mon, dim: true };
}

function fadeBuff(mon: FieldMon): FieldMon {
  if (!mon.buff) return mon;
  const maxHp = Math.max(1, (mon.maxHp || mon.hp) - mon.buff.maxHp);
  return {
    ...mon,
    def: Math.max(0, mon.def - mon.buff.def),
    mdef: Math.max(0, mon.mdef - mon.buff.mdef),
    maxHp,
    hp: Math.min(mon.hp, maxHp),
    buff: undefined,
  };
}

function beginHold(state: Duel, pending: Exclude<Pending, null>, line: string): Duel {
  const noted = note(state, line);
  const opened: Duel = {
    ...noted,
    step: "respond",
    pending,
    hold: { priority: (1 - state.turn) as Side, passed: [false, false], blocker: null, blockerSkill: false, armed: null },
  };
  if (pending.kind !== "melee") return opened;
  return stampLegend(opened, [pending.attacker, pending.defender]);
}

function keep(state: Duel): Duel {
  if (state.step !== "respond" || !state.hold || !state.pending) return { ...state, hold: null };
  return {
    ...state,
    hold: { ...state.hold, passed: [false, false], priority: (1 - state.hold.priority) as Side },
  };
}

function askKnight(state: Duel, priority: Side): Duel {
  if (!state.hold) return state;
  const aimed = state.hold.priority === priority ? state : { ...state, hold: { ...state.hold, priority, passed: [false, false] as [boolean, boolean] } };
  if (aimed.live.includes("Kỵ sĩ hãy chọn")) return aimed;
  return note(aimed, "Kỵ sĩ hãy chọn trạng thái trước khi giáp lá cà");
}

export function passResponse(state: Duel): Duel {
  const next = passResponseCore(state);
  if (next === state || !state.hold) return next;
  const resolved = next.pending !== state.pending || next.step !== state.step || next.winner !== state.winner || next.hold === null;
  if (!resolved) return next;
  const marked = traced(state, next, { kind: "pass", actor: state.hold.priority, ok: true, cardId: null, target: null, end: null });
  const reflect = Boolean(state.pending && "back" in state.pending && state.pending.back);
  return withResults(state, marked, { blocked: Boolean(state.hold.blocker), reflect, turn: false });
}

function passResponseCore(state: Duel): Duel {
  if (state.step !== "respond" || !state.hold || !state.pending || state.winner) return state;
  if (state.swap) return note(state, state.swap.locked ? "Hãy chọn 1 quái để hoán đổi." : "Hãy chọn hai quái để hoán đổi.");
  const hold = state.hold;
  const pending = state.pending;
  const foe = (1 - state.turn) as Side;
  if (pending.kind === "spell") {
    const ownerSide = pending.owner;
    const open = { ...state, step: "main" as const, pending: null, hold: null, turn: ownerSide };
    const owner = open.players[ownerSide];
    const hand = [...owner.hand, pending.cardId];
    const tolls = [...handTolls(owner), false];
    const target = redirectCover(state.players[(1 - ownerSide) as Side].field, pending.target) ?? pending.target;
    const armed = commitGuardShot(patch(open, ownerSide, { ...owner, hand, tolls }), pending.source ?? "", target ?? "", false);
    const resolved = castSpell(armed, hand.length - 1, target, true, pending.source ?? null);
    const released = releaseGuardMark(resolved, target);
    const foeSide = (1 - ownerSide) as Side;
    const aimedFoe = Boolean(pending.target && state.players[foeSide].field.some((mon) => mon?.uid === pending.target));
    const pressed = aimedFoe || pending.cardId === "sam-set-tan-the" ? pressTide(released, foeSide) : released;
    return pressed.turn === ownerSide ? { ...pressed, turn: state.turn } : pressed;
  }
  if (pending.kind === "face") {
    const blocker = hold.blocker;
    const mon = blocker ? state.players[foe].field.find((unit) => unit?.uid === blocker) ?? null : null;
    const legal = canIntercept(mon, Boolean(blocker));
    if (legal && mon && knightOpen(mon)) return askKnight(state, foe);
    const attacker = state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker) ?? null;
    if (legal && knightOpen(attacker)) return askKnight(state, state.turn);
    return { ...resolveFace(state, legal ? blocker : null, legal && hold.blockerSkill), hold: null };
  }
  if (pending.kind === "melee") {
    const blocker = hold.blocker;
    const mon = blocker ? state.players[foe].field.find((unit) => unit?.uid === blocker) ?? null : null;
    const legal = canIntercept(mon, Boolean(blocker));
    const defenderUid = redirectCover(state.players[foe].field, legal ? blocker! : pending.defender) ?? (legal ? blocker! : pending.defender);
    const defender = state.players[foe].field.find((unit) => unit?.uid === defenderUid) ?? null;
    const attacker = state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker) ?? null;
    if (knightOpen(defender)) return askKnight(state, foe);
    if (knightOpen(attacker)) return askKnight(state, state.turn);
    return { ...resolveMelee(state, pending.attacker, defenderUid), hold: null };
  }
  if (pending.kind === "beam") {
    if (pending.back) return finishRebound(state);
    const blocker = hold.blocker;
    const mon = blocker ? state.players[(1 - state.turn) as Side].field.find((unit) => unit?.uid === blocker) ?? null : null;
    const legal = canIntercept(mon, Boolean(blocker));
    const target = redirectCover(state.players[foe].field, legal ? blocker : pending.target) ?? (legal ? blocker : pending.target);
    const open = commitGuardShot({ ...state, step: "main" as const, pending: null, hold: null }, pending.caster, target ?? "", false);
    if (pending.index === 8 && open.echo === pending.caster) return swordFollow(open, target, true);
    if (pending.index === 9 && open.last === pending.caster) return swordLast(open, target, true);
    return releaseGuardMark(useSkill(open, pending.caster, target, pending.index, true, pending.extra ?? null, true), target);
  }
  if (pending.kind === "gnaw" || pending.kind === "gnaw-skill") return { ...answerGnaw(state, false), hold: null };
  if (pending.kind === "lash") return finishLash(state);
  return { ...state, step: "main", pending: null, hold: null };
}

const STAND_IN = "the-than-cua-shien";

function standAim(state: Duel): { face: boolean; uid: string | null } | null {
  const pending = state.pending;
  const hold = state.hold;
  if (!pending || !hold) return null;
  if (pending.kind === "face") {
    const attacker = state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker);
    if (attacker?.horn === "splash") return null;
    return { face: true, uid: null };
  }
  if (pending.kind === "melee" || pending.kind === "gnaw") {
    const attacker = state.players[state.turn].field.find((unit) => unit?.uid === pending.attacker);
    if (attacker?.horn === "splash") return null;
    return { face: false, uid: pending.defender };
  }
  if ((pending.kind === "beam" || pending.kind === "gnaw-skill") && pending.target) {
    if (state.players[hold.priority].field.some((unit) => unit?.uid === pending.caster)) return null;
    return { face: false, uid: pending.target };
  }
  if (pending.kind === "spell" && pending.target && pending.owner !== hold.priority) return { face: false, uid: pending.target };
  return null;
}

function retargetStand(pending: Exclude<Pending, null>, uid: string): Exclude<Pending, null> {
  if (pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") return { ...pending, target: uid };
  if (pending.kind === "melee" || pending.kind === "gnaw") return { ...pending, defender: uid };
  return pending;
}

function finishStand(state: Duel, ownerSide: Side, owner: Player, uid: string, line: string): Duel {
  const pending = state.pending;
  if (!pending || !state.hold) return state;
  const noted = note(patch(state, ownerSide, owner), line, "info");
  return {
    ...noted,
    step: "respond",
    pending: retargetStand(pending, uid),
    hold: { ...state.hold, blocker: uid, blockerSkill: false, armed: null, priority: state.turn, passed: [false, false] },
  };
}

export function canStand(state: Duel, uid: string): boolean {
  if (state.step !== "respond" || !state.hold || !state.pending) return false;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  if (state.hold.priority !== ownerSide) return false;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== STAND_IN || mon.hp <= 0 || !canIntercept(mon, true)) return false;
  const aim = standAim(state);
  if (!aim) return false;
  if (aim.face) {
    if (ownerSide === state.turn) return false;
  } else {
    if (!aim.uid || aim.uid === uid) return false;
    if (!owner.field.some((unit) => unit?.uid === aim.uid && unit.hp > 0)) return false;
  }
  return owner.orb >= 1 || Boolean(state.parley);
}

export function standFor(state: Duel, uid: string): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => standFor(next, uid));
  const next = standForCore(state, uid);
  if (next === state) return next;
  const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
  const actor = (state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1) as Side;
  const aim = standAim(state);
  const ok = next.hold?.blocker === uid;
  return traced(state, next, { kind: "cover", actor, ok, cardId: mon?.cardId ?? null, target: monsterTarget(state, aim?.uid), end: null });
}

function standForCore(state: Duel, uid: string): Duel {
  if (!canStand(state, uid) || !state.hold || !state.pending) return state;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid);
  if (!mon) return state;
  const paid = state.parley ? owner : pay(owner, 1);
  if (!paid) return note(state, "Cần 1 gem.");
  const aim = standAim(state);
  const ally = aim?.uid ? owner.field.find((unit) => unit?.uid === aim.uid) : null;
  const line = actNotice("Thế thân", [
    aim?.face ? "chuyển đòn nhắm người chơi sang Thế thân của shien" : `chuyển mục tiêu từ ${ally ? cardOf(ally).name : "đồng minh"} sang Thế thân của shien`,
  ]);
  return finishStand(state, ownerSide, paid, uid, line);
}

export function canStandHand(state: Duel, side: Side): boolean {
  if (state.step !== "respond" || !state.hold || state.hold.priority !== side || !state.pending) return false;
  const aim = standAim(state);
  if (!aim || aim.face || !aim.uid) return false;
  const owner = state.players[side];
  if (!owner.field.some((unit) => unit?.uid === aim.uid && unit.hp > 0)) return false;
  if (owner.orb < 1 && !state.parley) return false;
  return owner.reserve.some((card) => card.id === STAND_IN);
}

export function standIn(state: Duel, reserveIndex: number): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => standIn(next, reserveIndex));
  const next = standInCore(state, reserveIndex);
  if (next === state) return next;
  const side = state.hold?.priority ?? state.turn;
  const ok = next.players[side].field.some((mon) => mon?.cardId === STAND_IN && !state.players[side].field.some((unit) => unit?.uid === mon.uid));
  return traced(state, next, { kind: "cover", actor: side, ok, cardId: STAND_IN, target: monsterTarget(state, standAim(state)?.uid), end: null });
}

function standInCore(state: Duel, reserveIndex: number): Duel {
  if (!state.hold || !state.pending) return state;
  const ownerSide = state.hold.priority;
  if (!canStandHand(state, ownerSide)) return state;
  const owner = state.players[ownerSide];
  const held = owner.reserve[reserveIndex];
  if (held?.id !== STAND_IN) return state;
  const aim = standAim(state);
  const slot = owner.field.findIndex((unit) => unit?.uid === aim?.uid);
  const ally = slot >= 0 ? owner.field[slot] : null;
  if (!ally || !aim?.uid) return state;
  const paid = state.parley ? owner : pay(owner, 1);
  if (!paid) return note(state, "Cần 1 gem.");
  const seq = state.seq + 1;
  const body = place({ ...state, seq }, ownerSide, STAND_IN, held.saved ? held : undefined);
  const field = [...paid.field] as Player["field"];
  field[slot] = body;
  const reserve = paid.reserve.filter((_, index) => index !== reserveIndex);
  reserve.push({ ...pileFromField(ally), freeAt: owner.turns });
  const swapped = { ...paid, field, reserve };
  const line = actNotice("Thế thân", [`đưa ${cardOf(ally).name} về tay`, "đòn rơi vào Thế thân của shien"]);
  return finishStand({ ...state, seq: seq + 1 }, ownerSide, swapped, body.uid, line);
}

function wallAim(state: Duel): { kind: "melee" | "beam"; uid: string } | null {
  const pending = state.pending;
  if (!pending) return null;
  if (pending.kind === "melee" || pending.kind === "gnaw") return { kind: "melee", uid: pending.defender };
  if ((pending.kind === "beam" || pending.kind === "gnaw-skill") && pending.target) {
    const caster = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === pending.caster);
    if (!caster || !harmSkill(caster.cardId, pending.index)) return null;
    return { kind: "beam", uid: pending.target };
  }
  return null;
}

function spendWall(mon: FieldMon): FieldMon {
  if (mon.blocksLeft > 1) return { ...mon, blocksLeft: mon.blocksLeft - 1, dim: false };
  return { ...mon, dim: true };
}

export function canWall(state: Duel, uid: string): boolean {
  if (state.step !== "respond" || !state.hold || !state.pending) return false;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  if (state.hold.priority !== ownerSide) return false;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== "linh-chien-da-khong-lo" || !canIntercept(mon)) return false;
  const aim = wallAim(state);
  if (!aim || aim.uid === uid) return false;
  const ally = owner.field.find((unit) => unit?.uid === aim.uid && unit.hp > 0);
  if (!ally) return false;
  return owner.orb >= skillManaCost(mon.cardId, 1) || Boolean(state.parley);
}

export function wallAlly(state: Duel, uid: string): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => wallAlly(next, uid));
  const next = wallAllyCore(state, uid);
  if (next === state) return next;
  const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
  const actor = (state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1) as Side;
  const aim = wallAim(state);
  const ok = next.hold?.blocker === uid;
  if (!ok && next.players === state.players && next.upkeep && !state.upkeep) return next;
  return traced(state, next, { kind: "wall", actor, ok, cardId: mon?.cardId ?? null, target: monsterTarget(state, aim?.uid), end: null });
}

function wallAllyCore(state: Duel, uid: string): Duel {
  if (!canWall(state, uid) || !state.hold || !state.pending) return state;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid);
  const aim = wallAim(state);
  if (!mon || !aim) return state;
  const ally = owner.field.find((unit) => unit?.uid === aim.uid);
  if (!ally) return state;
  const paid = pay(owner, skillManaCost(mon.cardId, 1));
  if (!paid) return note(state, "Cần 1 gem.");
  const soldier = aim.kind === "beam" ? spendWall(mon) : spentAct(mon);
  const patched = patch(state, ownerSide, { ...paid, field: paid.field.map((unit) => (unit?.uid === uid ? soldier : unit)) });
  const pending = patched.pending ?? state.pending;
  const nextPending =
    pending.kind === "beam" || pending.kind === "gnaw-skill"
      ? { ...pending, target: uid }
      : pending.kind === "melee" || pending.kind === "gnaw"
        ? { ...pending, defender: uid }
        : pending;
  const noted = note(patched, `${cardOf(mon).name} đỡ đòn cho ${cardOf(ally).name}.`, "info");
  return {
    ...noted,
    step: "respond",
    pending: nextPending,
    hold: { ...state.hold, blocker: uid, blockerSkill: false, armed: null, priority: state.turn, passed: [false, false] },
  };
}

function spiritAim(state: Duel): string | null {
  const pending = state.pending;
  if (!pending) return null;
  if (pending.kind === "melee" || pending.kind === "gnaw") return state.hold?.blocker ?? pending.defender;
  if ((pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") && pending.target) return state.hold?.blocker ?? pending.target;
  return null;
}

export function canSpirit(state: Duel, uid: string): boolean {
  if (state.step !== "respond" || !state.hold || !state.pending) return false;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  if (state.hold.priority !== ownerSide) return false;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
  if (!canIntercept(mon) || mon.cardId === "thien-than-be-nho") return false;
  const aim = spiritAim(state);
  if (!aim || aim === uid) return false;
  const ally = owner.field.find((unit) => unit?.uid === aim && unit.hp > 0 && unit.cardId === "thien-than-be-nho");
  return Boolean(ally);
}

export function spiritCover(state: Duel, uid: string): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => spiritCover(next, uid));
  const next = spiritCoverCore(state, uid);
  if (next === state) return next;
  const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
  const actor = (state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1) as Side;
  const aim = spiritAim(state);
  const ok = next.hold?.blocker === uid;
  return traced(state, next, { kind: "cover", actor, ok, cardId: mon?.cardId ?? null, target: monsterTarget(state, aim), end: null });
}

function spiritCoverCore(state: Duel, uid: string): Duel {
  if (!canSpirit(state, uid) || !state.hold || !state.pending) return state;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid);
  const aim = spiritAim(state);
  const ally = aim ? owner.field.find((unit) => unit?.uid === aim) : null;
  if (!mon || !ally) return state;
  const spent = spentAct(mon);
  const patched = patch(state, ownerSide, { ...owner, field: owner.field.map((unit) => (unit?.uid === uid ? spent : unit)) });
  const pending = state.pending;
  const nextPending =
    pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell"
      ? { ...pending, target: uid }
      : pending.kind === "melee" || pending.kind === "gnaw"
        ? { ...pending, defender: uid }
        : pending;
  const noted = note(patched, `${cardOf(mon).name} đỡ đòn hộ cho ${cardOf(ally).name}.`, "info");
  return {
    ...noted,
    step: "respond",
    pending: nextPending,
    hold: { ...state.hold, blocker: uid, blockerSkill: false, armed: null, priority: state.turn, passed: [false, false] },
  };
}

export function assignBlock(state: Duel, blockerUid: string, withSkill = false): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => assignBlock(next, blockerUid, withSkill));
  const next = assignBlockCore(state, blockerUid, withSkill);
  if (next === state) return next;
  const mon = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === blockerUid) ?? null;
  const actor = (state.players[0].field.some((unit) => unit?.uid === blockerUid) ? 0 : 1) as Side;
  const ok = next.hold?.blocker === blockerUid;
  if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
  const attacker = state.pending && (state.pending.kind === "face" || state.pending.kind === "melee") ? state.pending.attacker : null;
  return traced(state, next, { kind: "block", actor, ok, cardId: mon?.cardId ?? null, target: monsterTarget(state, attacker), end: null });
}

function assignBlockCore(state: Duel, blockerUid: string, withSkill = false): Duel {
  const defender = (1 - state.turn) as Side;
  const pending = state.pending;
  const canIntercept = pending?.kind === "face";
  if (state.step !== "respond" || !state.hold || state.hold.priority !== defender) {
    return note(state, "Chưa tới lượt chặn");
  }
  if (!canIntercept) return note(state, "Quái chỉ chặn đòn đánh vào người");
  const you = state.players[defender];
  const blocker = you.field.find((mon) => mon?.uid === blockerUid) ?? null;
  if (!blocker || blocker.dim || blocker.cardId === "chan-ken" || held(blocker) || hexLocked(blocker) || blocker.noBlock || (blocker.path ?? 0) > 0) return note(state, "Quái này không chặn được");
  let next = state;
  let skill = false;
  if (withSkill) {
    if (blocker.cardId !== "chien-si-gam-nham") return note(state, "Quái này không có kỹ năng chặn.");
    const cost = skillManaCost(blocker.cardId);
    const paid = payCost(you, cost);
    if (!paid) return assignBlock(state, blockerUid, false);
    next = patch(state, defender, {
      ...paid,
      field: paid.field.map((mon) => (mon?.uid === blocker.uid ? boostGnaw(blocker) : mon)),
    });
    skill = true;
  }
  const actor = next.players[defender].field.find((mon) => mon?.uid === blocker.uid) ?? blocker;
  if (!actor.dim && actor.blocksLeft <= 1) {
    next = patch(next, defender, {
      ...next.players[defender],
      field: next.players[defender].field.map((mon) => (mon?.uid === blocker.uid ? spentAct(mon) : mon)),
    });
  }
  if (smashPlain(blocker) || blocker.cardId === GUARD_KNIGHT) {
    const owner = next.players[defender];
    const paid = pay(owner, 1);
    if (!paid) return note(state, "Cần 1 mana.");
    next = patch(next, defender, paid);
  }
  if (blocker.cardId === GUARD_KNIGHT) {
    const owner = next.players[defender];
    next = patch(next, defender, {
      ...owner,
      field: owner.field.map((mon) => (mon?.uid === blocker.uid ? { ...mon, guarding: true, oathShot: false } : mon)),
    });
  }
  const veiled = next.players[defender].field.find((mon) => mon?.uid === blocker.uid) ?? null;
  if (shadeHidden(veiled)) {
    next = patch(next, defender, {
      ...next.players[defender],
      field: next.players[defender].field.map((mon) => (mon?.uid === blocker.uid ? openShade(mon) : mon)),
    });
  }
  const acted = markQueenAct(next, defender, blocker.uid);
  const noted = note(acted.state, blocker.cardId === GUARD_KNIGHT ? `${cardOf(blocker).name} dùng Kiếm phòng ngự.${acted.extra}` : `${cardOf(blocker).name} sẽ chặn.${acted.extra}`, "info");
  const blocked: Duel = {
    ...noted,
    step: "respond",
    pending: state.pending,
    hold: { priority: state.turn, passed: [false, false], blocker: blockerUid, blockerSkill: skill, armed: null },
  };
  const ids = [blockerUid];
  if (pending?.kind === "face") ids.push(pending.attacker);
  return stampLegend(blocked, ids);
}

export function canGuardCover(state: Duel, uid: string): boolean {
  if (state.step !== "respond" || !state.hold || !state.pending) return false;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  if (state.hold.priority !== ownerSide) return false;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || (mon.cardId !== GUARD_KNIGHT && mon.cardId !== MYSTIC) || !canIntercept(mon) || mon.dim) return false;
  if (owner.orb < 1 && !state.parley) return false;
  const pending = state.pending;
  if (pending.kind === "face") return mon.cardId === MYSTIC;
  const aim = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? pending.target : null;
  if (!aim || aim === uid) return false;
  return owner.field.some((unit) => unit?.uid === aim && unit.hp > 0);
}

export function guardCover(state: Duel, uid: string): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => guardCover(next, uid));
  if (!canGuardCover(state, uid) || !state.hold || !state.pending) return state;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid);
  const pending = state.pending;
  const aim = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? pending.target : null;
  const ally = aim ? owner.field.find((unit) => unit?.uid === aim) : null;
  if (!mon || !ally && pending.kind !== "face") return state;
  const paid = pay(owner, 1);
  if (!paid) return note(state, "Cần 1 mana.");
  const body = { ...spentAct(mon), guarding: true, oathShot: false };
  const patched = patch(state, ownerSide, { ...paid, field: paid.field.map((unit) => (unit?.uid === uid ? body : unit)) });
  if (pending.kind === "face") {
    return {
      ...note(patched, mon.cardId === MYSTIC ? `${cardOf(mon).name} dùng Phòng ngự, đỡ đòn cho người chơi.` : `${cardOf(mon).name} dùng Kiếm phòng ngự, đỡ đòn cho người chơi.`, "info"),
      step: "respond",
      pending,
      hold: { ...state.hold, blocker: uid, blockerSkill: false, armed: null, priority: state.turn, passed: [false, false] },
    };
  }
  if (!ally) return state;
  const nextPending =
    pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell"
      ? { ...pending, target: uid }
      : pending.kind === "melee" || pending.kind === "gnaw"
        ? { ...pending, defender: uid }
        : pending;
  return {
    ...note(patched, mon.cardId === MYSTIC ? `${cardOf(mon).name} dùng Phòng ngự, đỡ đòn cho ${cardOf(ally).name}.` : `${cardOf(mon).name} dùng Kiếm phòng ngự, đỡ đòn cho ${cardOf(ally).name}.`, "info"),
    step: "respond",
    pending: nextPending,
    hold: { ...state.hold, blocker: uid, blockerSkill: false, armed: null, priority: state.turn, passed: [false, false] },
  };
}

export function armBlockSkill(state: Duel, uid: string, skillName: string): Duel {
  if (state.step !== "respond" || !state.hold || state.winner) return state;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  if (state.hold.priority !== ownerSide) return note(state, "Chưa tới lượt phản ứng.");
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== "chien-si-gam-nham" || mon.dim || mon.stun > 0 || mon.noBlock) return state;
  const cost = skillManaCost(mon.cardId);
  if (owner.orb < cost) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
  const name = skillName.trim() || "Khiên thú sĩ";
  return {
    ...state,
    live: `Kéo ${cardOf(mon).name} lên icon tấn công để chặn bằng ${name}`,
    hold: { ...state.hold, armed: uid },
  };
}

export function boostGnawOnChain(state: Duel, picked?: string): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => boostGnawOnChain(next, picked));
  if (state.step !== "respond" || !state.hold || !state.pending) return state;
  const pending = state.pending;
  const uid =
    picked ??
    (pending.kind === "melee"
      ? (state.hold.blocker ?? pending.defender)
      : pending.kind === "face"
        ? state.hold.blocker
        : pending.kind === "beam"
          ? (state.hold.blocker ?? pending.target)
          : pending.kind === "gnaw"
            ? pending.defender
            : pending.kind === "gnaw-skill"
              ? pending.target
              : null);
  if (!uid) return note(state, "Chưa có quân để gặm nhắm.");
  if (pending.kind === "face" && pending.attacker === uid) return note(state, "Đang tấn công thì không gặm nhắm được.");
  if (pending.kind === "melee" && pending.attacker === uid) return note(state, "Đang tấn công thì không gặm nhắm được.");
  if (pending.kind === "beam" && pending.caster === uid) return note(state, "Đang tấn công thì không gặm nhắm được.");
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  if (state.hold.priority !== ownerSide) return note(state, "Chưa tới lượt phản ứng.");
  const owner = state.players[ownerSide];
  const mon = owner.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== "chien-si-gam-nham" || mon.dim) return note(state, mon?.dim ? "Quái này đã hành động." : `Không phải ${monsterCard("chien-si-gam-nham")?.name}.`);
  const cost = skillManaCost(mon.cardId);
  const paid = payCost(owner, cost);
  if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
  const bonus = skillHpBonus(mon.cardId);
  const next = patch(state, ownerSide, { ...paid, field: paid.field.map((unit) => (unit?.uid === uid ? boostGnaw(mon) : unit)) });
  const marked = next.hold ? { ...next, hold: { ...next.hold, armed: uid } } : next;
  return keep(note(marked, `${cardOf(mon).name} nhân đôi phòng ngự và tăng ${bonus} máu tối đa.`, "spell"));
}

export function flashCotton(state: Duel, reserveIndex: number): Duel {
  if (state.step !== "respond" || !state.hold || state.winner) return state;
  const side = state.hold.priority;
  const you = state.players[side];
  if (you.reserve[reserveIndex]?.id !== "cuc-bong-ma-quai") return note(state, `Chỉ ${monsterCard("cuc-bong-ma-quai")?.name} đang dự bị mới triệu hồi nhanh.`);
  return cottonCover(state, "hand");
}

function threatenedSide(state: Duel): Side | null {
  const pending = state.pending;
  if (!pending || state.step !== "respond") return null;
  if (pending.kind === "face" || pending.kind === "melee" || pending.kind === "gnaw" || pending.kind === "gnaw-skill") {
    return (1 - state.turn) as Side;
  }
  if (pending.kind === "beam") {
    if (!pending.target) return (1 - state.turn) as Side;
    if (state.players[0].field.some((mon) => mon?.uid === pending.target)) return 0;
    if (state.players[1].field.some((mon) => mon?.uid === pending.target)) return 1;
    return (1 - state.turn) as Side;
  }
  return null;
}

function openSlots(player: Player) {
  return player.field.filter((cell, index) => !cell && (player.locked?.[index] ?? 0) === 0).length;
}

/** Bông mềm: while the player is attacked, Cục bông ma quái in hand can be summoned to block, for 1 mana. */
export function cottonOffer(state: Duel, side: Side) {
  const none = { hand: false };
  if (state.step !== "respond" || !state.hold || state.hold.priority !== side || state.winner) return none;
  const pending = state.pending;
  const onPlayer = pending?.kind === "face" || (pending?.kind === "beam" && !pending.target);
  if (!onPlayer || threatenedSide(state) !== side) return none;
  const you = state.players[side];
  const inHand = you.reserve.some((card) => card.id === "cuc-bong-ma-quai");
  return { hand: inHand && openSlots(you) >= 1 && you.orb >= 1 };
}

function redirectHit(state: Duel, uid: string): Duel {
  if (!state.hold || !state.pending) return state;
  const pending = state.pending;
  const nextPending =
    pending.kind === "beam"
      ? { ...pending, target: uid }
      : pending.kind === "melee"
        ? { ...pending, defender: uid }
        : pending.kind === "gnaw"
          ? { ...pending, defender: uid }
          : pending.kind === "gnaw-skill"
            ? { ...pending, target: uid }
            : pending;
  const noted = note(state, `${monsterCard("cuc-bong-ma-quai")?.name} đỡ đòn.`, "info");
  return {
    ...noted,
    pending: nextPending,
    hold: { ...state.hold, blocker: uid, blockerSkill: false, armed: null, priority: state.turn, passed: [false, false] },
  };
}

/** At most this many Cục bông ma quái (the blocker and its copies) stand on the field after Bông mềm. */
const SOFT_COTTON_MAX = 4;

export function cottonCover(state: Duel, _mode: "hand" = "hand"): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => cottonCover(next));
  if (!state.hold || state.step !== "respond") return state;
  const side = state.hold.priority;
  const offer = cottonOffer(state, side);
  const you = state.players[side];
  const name = monsterCard("cuc-bong-ma-quai")?.name ?? "Cục bông ma quái";
  if (!offer.hand) return note(state, `${name} không triệu hồi nhanh được.`);
  const index = you.reserve.findIndex((card) => card.id === "cuc-bong-ma-quai");
  const paid = pay(you, 1);
  if (!paid || index < 0) return note(state, "Cần 1 gem.");
  const field = [...paid.field] as Player["field"];
  const slots = field.flatMap((cell, slot) => (!cell && (paid.locked?.[slot] ?? 0) === 0 ? [slot] : []));
  if (slots.length === 0) return note(state, "Không còn ô trống.");
  let seq = state.seq + 1;
  const body = place({ ...state, seq }, side, "cuc-bong-ma-quai", paid.reserve[index]);
  field[slots[0]] = body;
  for (const slot of slots.slice(1, SOFT_COTTON_MAX)) {
    seq += 1;
    field[slot] = { ...place({ ...state, seq }, side, "cuc-bong-ma-quai"), copy: true };
  }
  const reserve = paid.reserve.filter((_, slot) => slot !== index);
  const next = patch({ ...state, seq: seq + 1 }, side, { ...paid, field, reserve });
  return redirectHit(next, body.uid);
}

/** The two monsters whose skill is the hellfire ball: Mắt đỏ tàn phá and Rồng ác ma (same rules, figures read from each card). */
function isHell(id: string) {
  return id === "mat-do-tan-pha" || id === "rong-ac-ma";
}

function hellCount(text: string, word: string, fallback: number) {
  const full = new RegExp(`(\\d+)\\s*sát thương\\s+${word}`, "i").exec(text);
  if (full) return Number(full[1]);
  const brief = new RegExp(`(\\d+)\\s*${word}`, "i").exec(text);
  return brief ? Number(brief[1]) : fallback;
}

function hellFigures(id: string) {
  const text = skillText(id);
  const spill = /từ\s*(\d+)\s*trở lên/i.exec(text);
  return {
    phys: hellCount(text, "vật lý", 4),
    spell: hellCount(text, "phép", 5),
    tru: hellCount(text, "chuẩn", 2),
    spill: spill ? Number(spill[1]) : 6,
  };
}

type HellPack = { phys: number; spell: number; tru: number };

function hellSplit(pack: HellPack, hp: number): { left: HellPack; killed: boolean } {
  const total = pack.phys + pack.spell + pack.tru;
  if (hp <= 0) return { left: pack, killed: true };
  if (total < hp) return { left: { phys: 0, spell: 0, tru: 0 }, killed: false };
  const budget = Math.min(hp, pack.phys + pack.spell);
  const bigIsPhys = pack.phys >= pack.spell;
  const big = bigIsPhys ? pack.phys : pack.spell;
  const small = bigIsPhys ? pack.spell : pack.phys;
  const smallTake = Math.min(small, Math.floor(budget / 2));
  const bigTake = Math.min(big, budget - smallTake);
  const physTake = bigIsPhys ? bigTake : smallTake;
  const spellTake = bigIsPhys ? smallTake : bigTake;
  const trueTake = Math.min(pack.tru, Math.max(0, hp - physTake - spellTake));
  return {
    left: { phys: pack.phys - physTake, spell: pack.spell - spellTake, tru: pack.tru - trueTake },
    killed: true,
  };
}

function hellMitigate(pack: HellPack, mon: FieldMon, allies?: Array<FieldMon | null>): HellPack {
  const phys = Math.max(0, pack.phys - liveDef(mon, allies));
  const spell = Math.max(0, pack.spell - liveMdef(mon, allies));
  const scale = mon.vulnerable > 0 ? 2 : 1;
  return { phys: phys * scale, spell: spell * scale, tru: pack.tru * scale };
}

function hellSum(pack: HellPack) {
  return pack.phys + pack.spell + pack.tru;
}

function actNotice(title: string, actions: string[]) {
  const lines = actions.map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return title;
  if (lines.length === 1) {
    const one = lines[0].replace(/^[-\s]+/u, "").replace(/[.。]+$/u, "");
    return `${title} ${one}.`;
  }
  return [title, ...lines.map((line) => `- ${line.replace(/^[-\s]+/u, "").replace(/[.。]+$/u, "")}.`)].join("\n");
}

function hellLine(pack: HellPack, name: string, broke: "phys" | "spell" | null = null, body?: FieldMon | null, allies?: Array<FieldMon | null>, pool?: number) {
  const have = pool ?? phantomPool(body, allies);
  const spell = Math.max(0, pack.spell);
  const phys = Math.max(0, pack.phys);
  const truRaw = Math.max(0, pack.tru);
  const spellTake = Math.min(have, spell);
  const physTake = Math.min(Math.max(0, have - spell), phys);
  const tru = Math.max(0, truRaw - Math.max(0, have - spell - phys));
  const other = [
    pack.phys > 0 ? `${phys - physTake} sát thương vật lý` : "",
    pack.spell > 0 ? `${spell - spellTake} sát thương phép` : "",
    pack.tru > 0 ? `${tru} sát thương chuẩn` : "",
  ].filter(Boolean);
  const zeroed = broke === "phys" && pack.phys === 0 ? "0 sát thương vật lý" : broke === "spell" && pack.spell === 0 ? "0 sát thương phép" : "";
  const tag = broke ? ` ${wardTag(broke)}` : "";
  if (other.length > 0) return [`gây ${other.join(", ")} lên ${name}${tag}`];
  if (zeroed) return [`gây ${zeroed} lên ${name}${tag}`];
  return [`gây 0 sát thương lên ${name}${tag}`];
}

function soakPack(mon: FieldMon, pack: HellPack): { mon: FieldMon; pack: HellPack; broke: "phys" | "spell" | null } {
  if (mon.cage || !mon.ward) return { mon, pack, broke: null };
  if (mon.wardStay) {
    if (mon.ward !== "spell" || pack.spell <= 0) return { mon, pack, broke: null };
    return { mon: { ...mon, ward: undefined, wardStay: undefined }, pack: { ...pack, spell: 0 }, broke: "spell" };
  }
  const matched = mon.ward === "phys" ? pack.phys : pack.spell;
  const other = mon.ward === "phys" ? pack.spell : pack.phys;
  if (matched <= 0 && other <= 0) return { mon, pack, broke: null };
  const popped = { ...mon, ward: undefined };
  if (matched > 0) return { mon: popped, pack: { ...pack, [mon.ward]: 0 }, broke: mon.ward };
  return { mon: popped, pack, broke: mon.ward };
}

function landHell(mon: FieldMon, pack: HellPack, allies?: Array<FieldMon | null>): { mon: FieldMon; dealt: number; left: HellPack; blockedSpell: number; taken: HellPack; broke: "phys" | "spell" | null } {
  const physGate = swallowOath(mon, "phys", pack.phys);
  const spellGate = swallowOath(physGate.mon, "spell", pack.spell);
  mon = spellGate.mon;
  pack = { phys: physGate.amount, spell: spellGate.amount, tru: pack.tru };
  const sliced = mon.cardId === "chien-binh-rong" ? { phys: third(pack.phys), spell: third(pack.spell), tru: third(pack.tru) } : pack;
  const body = mon.cardId === "chien-binh-rong" ? pushDebt(mon, { p: sliced.phys, s: sliced.spell, t: sliced.tru }) : mon;
  const rawSpell = sliced.spell;
  const opened = hellMitigate(sliced, body, allies);
  const guarded = soakPack(body, opened);
  const blockedSpell = Math.max(0, Math.min(rawSpell, liveMdef(body, allies)));
  const hit = applyIncoming(guarded.mon, hellSum(guarded.pack), allies);
  const stored = mon.cardId === "sua-hut-ma-phap" ? (hit.mon.stored ?? 0) + blockedSpell : hit.mon.stored;
  return { mon: { ...hit.mon, stored }, dealt: hellSum(guarded.pack), left: hellSplit(guarded.pack, mon.hp).left, blockedSpell, taken: guarded.pack, broke: guarded.broke };
}

function resolveHell(state: Duel, attacker: FieldMon, defender: FieldMon): Duel {
  const side = (state.players[0].field.some((mon) => mon?.uid === attacker.uid) ? 0 : 1) as Side;
  const foe = (state.players[0].field.some((mon) => mon?.uid === defender.uid) ? 0 : 1) as Side;
  const you = state.players[side];
  const them = state.players[foe];
  const releaseHex = bindSkillHex(attacker);
  const figures = hellFigures(attacker.cardId);
  if (attacker.skillUp) figures.spell += attacker.skillUp;
  const shaved = shaveHex(attacker, figures);
  const shot: HellPack = {
    phys: outgoing(attacker, shaved.phys),
    spell: outgoing(attacker, shaved.spell),
    tru: outgoing(attacker, shaved.tru),
  };
  releaseHex();
  const mainPool = phantomPool(defender, them.field);
  const landed = landHell(defender, shot, them.field);
  const killed = landed.mon.hp <= 0;
  const leftover = killed ? landed.left : { phys: 0, spell: 0, tru: 0 };
  const spill = killed && hellSum(leftover) >= figures.spill;
  const others = them.field.filter((mon): mon is FieldMon => Boolean(mon && mon.uid !== defender.uid && mon.hp > 0));
  const splashHits = spill
    ? others.map((mon) => {
        const pool = phantomPool(mon, them.field);
        const hit = landHell(mon, leftover, them.field);
        return { uid: mon.uid, name: cardOf(mon).name, dealt: hit.dealt, mon: hit.mon, taken: hit.taken, broke: hit.broke, from: mon, pool };
      })
    : [];
  const foeField = them.field.map((mon) => {
    if (!mon) return mon;
    if (mon.uid === defender.uid) return landed.mon;
    return splashHits.find((row) => row.uid === mon.uid)?.mon ?? mon;
  });
  const spent = (mon: FieldMon) => (mon.uid === attacker.uid ? { ...mon, dim: true } : mon);
  const yourField = (side === foe ? foeField : you.field).map((mon) => (mon ? spent(mon) : mon));
  let next = patch(state, side, { ...you, field: yourField });
  if (side !== foe) next = patch(next, foe, dropDead({ ...them, field: foeField }));
  else next = patch(next, side, dropDead({ ...you, field: yourField }));
  const actions = [...hellLine(landed.taken, cardOf(defender).name, landed.broke, defender, them.field, mainPool), ...splashHits.flatMap((row) => hellLine(row.taken, row.name, row.broke, row.from, them.field, row.pool))];
  return releaseLegend({
    ...note(next, actNotice(castName(attacker.cardId, 0), actions), "spell"),
    step: "main",
    pending: null,
    hold: null,
    skill: { id: attacker.cardId, index: 0, aim: defender.uid },
  });
}

function openGuardShot(attacker: FieldMon, defender: FieldMon, melee: boolean, allies: Array<FieldMon | null>, roster?: string[]): { attacker: FieldMon; defender: FieldMon; line: string } {
  if (defender.cardId !== GUARD_KNIGHT || !defender.guarding || defender.oathShot) return { attacker, defender, line: "" };
  const due = defender.debt?.[0];
  const folded = melee && Boolean(due && ((due.p ?? 0) > 0 || (due.s ?? 0) > 0));
  const cleared: FieldMon = { ...defender, debt: undefined, oathShot: true, riposte: folded || undefined };
  if (!due || ((due.p ?? 0) <= 0 && (due.s ?? 0) <= 0)) return { attacker, defender: cleared, line: "" };
  const blow = melee ? liveAtk(defender) : 0;
  const spellBlow = guardStrikeKind(defender, roster) === "spell";
  const phys = due.p + (spellBlow ? 0 : blow);
  const spell = due.s + (spellBlow ? blow : 0);
  const landed = landHell(attacker, { phys, spell, tru: 0 }, allies);
  return { attacker: landed.mon, defender: cleared, line: `${cardOf(defender).name} phản ${phys} sát thương vật lý và ${spell} sát thương phép.` };
}

function commitGuardShot(state: Duel, attackerUid: string, defenderUid: string, melee: boolean): Duel {
  const attackerSide = (state.players[0].field.some((mon) => mon?.uid === attackerUid) ? 0 : 1) as Side;
  const attacker = state.players[attackerSide].field.find((mon) => mon?.uid === attackerUid) ?? null;
  const defenderSide = (state.players[0].field.some((mon) => mon?.uid === defenderUid) ? 0 : 1) as Side;
  const defender = state.players[defenderSide].field.find((mon) => mon?.uid === defenderUid) ?? null;
  if (!defender) return state;
  if (!attacker) {
    if (defender.cardId !== GUARD_KNIGHT || !defender.guarding || defender.oathShot) return state;
    const due = defender.debt?.[0];
    const cleared: FieldMon = { ...defender, debt: undefined, oathShot: true };
    const foe = (1 - defenderSide) as Side;
    let next = patch(state, defenderSide, {
      ...state.players[defenderSide],
      field: state.players[defenderSide].field.map((mon) => (mon?.uid === defender.uid ? cleared : mon)),
    });
    if (!due || ((due.p ?? 0) <= 0 && (due.s ?? 0) <= 0)) return next;
    const dealt = due.p + due.s;
    next = patch(next, foe, { ...next.players[foe], hp: next.players[foe].hp - dealt });
    return note(next, `${cardOf(defender).name} phản ${due.p} sát thương vật lý và ${due.s} sát thương phép.`, "hit");
  }
  const shot = openGuardShot(attacker, defender, melee, state.players[attackerSide].field, state.players[defenderSide].roster);
  if (shot.attacker === attacker && shot.defender === defender) return state;
  let next = patch(state, attackerSide, {
    ...state.players[attackerSide],
    field: state.players[attackerSide].field.map((mon) => (mon?.uid === attacker.uid ? shot.attacker : mon)),
  });
  const foe = next.players[defenderSide];
  next = patch(next, defenderSide, { ...foe, field: foe.field.map((mon) => (mon?.uid === defender.uid ? shot.defender : mon)) });
  return shot.line ? note(next, shot.line, "hit") : next;
}

function releaseGuardMark(state: Duel, uid: string | null): Duel {
  if (!uid) return state;
  for (const side of [0, 1] as const) {
    const you = state.players[side];
    if (!you.field.some((mon) => mon?.uid === uid && (mon.guarding || mon.oathShot))) continue;
    return patch(state, side, {
      ...you,
      field: you.field.map((mon) => (mon?.uid === uid ? { ...mon, guarding: undefined, oathShot: undefined, riposte: undefined } : mon)),
    });
  }
  return state;
}

function parleyActor(talk: NonNullable<Duel["parley"]>): Side {
  if (talk.step === "pick-victim" || talk.step === "pick-lunger2") return talk.side;
  return (1 - talk.side) as Side;
}

export function parleyPicker(state: Duel): Side | null {
  if (!state.parley || state.step !== "main" || state.parley.step === "fight") return null;
  return parleyActor(state.parley);
}

function living(field: Array<FieldMon | null>, uid: string) {
  return field.find((mon) => mon?.uid === uid && mon.hp > 0 && mon.cardId !== "mu") ?? null;
}

export function startParley(state: Duel, uid: string): Duel {
  if (state.step !== "main" || state.winner || state.parley) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.dim || held(mon) || (mon.path ?? 0) > 0) return state;
  const foes = state.players[(1 - side) as Side].field.filter((unit) => unit && unit.hp > 0 && unit.cardId !== "mu");
  if (mon.cardId === MYSTIC) {
    if (foes.length < 1) return note(state, "Đối phương cần ít nhất 1 quái trên sân.");
    const paid = pay(you, 2);
    if (!paid) return note(state, "Cần 2 mana.");
    const next = patch(state, side, paid);
    return note({ ...next, parley: { queen: uid, side, kind: "mystic", step: "pick-victim", round: 1, home: side } }, `${cardOf(mon).name} dùng Đàm phán.`, "info");
  }
  if (mon.cardId !== QUEEN_KNIGHT) return state;
  const allies = you.field.filter((unit) => unit && unit.hp > 0 && unit.uid !== uid && unit.cardId !== "mu");
  if (allies.length < 1 || foes.length < 1) return note(state, "Mỗi bên cần ít nhất 1 quái ngoài Hiệp sĩ của hậu.");
  const paid = pay(you, 1);
  if (!paid) return note(state, "Cần 1 mana.");
  const field = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
  const next = patch(state, side, { ...paid, field });
  return note({ ...next, parley: { queen: uid, side, step: "pick-victim", round: 1, home: side } }, `${cardOf(mon).name} dùng Đàm phán.`, "info");
}

export function pickParley(state: Duel, uid: string): Duel {
  const talk = state.parley;
  if (!talk || state.step !== "main" || talk.step === "fight") return state;
  if (uid === "face") {
    if (talk.kind !== "mystic" || talk.step !== "pick-victim") return state;
    return note({ ...state, parley: { ...talk, step: "pick-lunger", victim: "face" } }, "Người chơi sẽ chịu đòn.", "info");
  }
  if (talk.kind === "mystic" && talk.step === "pick-victim" && uid === talk.queen) return note(state, "Chọn người chơi hoặc một quái khác.");
  const side = parleyActor(talk);
  const mon = living(state.players[side].field, uid);
  if (!mon) return note(state, "Chọn một quái trên sân.");
  if (talk.step === "pick-victim") return note({ ...state, parley: { ...talk, step: "pick-lunger", victim: uid } }, `${cardOf(mon).name} sẽ chịu đòn.`, "info");
  if (talk.step === "pick-lunger") return openParleyFight(state, uid, talk.victim ?? "", 1);
  if (talk.step === "pick-victim2") {
    const nextTalk = { ...talk, step: "pick-lunger2" as const, victim: uid, round: 2 as const };
    if (talk.forced) {
      const queen = living(state.players[talk.side].field, talk.queen);
      if (!queen) return { ...state, parley: null };
      return openParleyFight({ ...state, parley: nextTalk }, queen.uid, uid, 2);
    }
    return note({ ...state, parley: nextTalk }, `${cardOf(mon).name} sẽ chịu đòn.`, "info");
  }
  return openParleyFight(state, uid, talk.victim ?? "", 2);
}

function openParleyFight(state: Duel, attackerUid: string, defenderUid: string, round: 1 | 2): Duel {
  const talk = state.parley;
  if (!talk) return state;
  if (defenderUid === "face") {
    const attackerSide = (state.players[0].field.some((mon) => mon?.uid === attackerUid) ? 0 : 1) as Side;
    const attacker = living(state.players[attackerSide].field, attackerUid);
    if (!attacker) return { ...state, parley: null };
    const keep: NonNullable<Duel["parley"]>["keep"] = {
      [attacker.uid]: { dim: attacker.dim, blessAtk: attacker.blessAtk ?? 0, blessDmg: attacker.blessDmg ?? 0, nextDef: attacker.nextDef ?? 0 },
    };
    const held = beginHold({ ...state, turn: attackerSide }, { kind: "face", attacker: attacker.uid }, `${cardOf(attacker).name} đánh vào người theo Đàm phán.`);
    return { ...held, parley: { ...talk, step: "fight", round, victim: "face", lunger: attacker.uid, keep } };
  }
  const attackerSide = (state.players[0].field.some((mon) => mon?.uid === attackerUid) ? 0 : 1) as Side;
  const defenderSide = (state.players[0].field.some((mon) => mon?.uid === defenderUid) ? 0 : 1) as Side;
  const attacker = living(state.players[attackerSide].field, attackerUid);
  const defender = living(state.players[defenderSide].field, defenderUid);
  if (!attacker || !defender) return { ...state, parley: null };
  const keep: NonNullable<Duel["parley"]>["keep"] = {
    [attacker.uid]: { dim: attacker.dim, blessAtk: attacker.blessAtk ?? 0, blessDmg: attacker.blessDmg ?? 0, nextDef: attacker.nextDef ?? 0 },
    [defender.uid]: { dim: defender.dim, blessAtk: defender.blessAtk ?? 0, blessDmg: defender.blessDmg ?? 0, nextDef: defender.nextDef ?? 0 },
  };
  const held = beginHold({ ...state, turn: attackerSide }, { kind: "melee", attacker: attacker.uid, defender: defender.uid }, `${cardOf(attacker).name} lao vào ${cardOf(defender).name} theo Đàm phán.`);
  return { ...held, parley: { ...talk, step: "fight", round, victim: defender.uid, lunger: attacker.uid, keep } };
}

function finishParley(state: Duel): Duel {
  const talk = state.parley;
  if (!talk || talk.step !== "fight" || state.step === "respond") return state;
  let next = state;
  const keep = talk.keep ?? {};
  for (const side of [0, 1] as const) {
    const you = next.players[side];
    let changed = false;
    const field = you.field.map((mon) => {
      const saved = mon ? keep[mon.uid] : undefined;
      if (!mon || !saved || mon.hp <= 0) return mon;
      changed = true;
      return { ...mon, dim: saved.dim, blessAtk: saved.blessAtk, blessDmg: saved.blessDmg, nextDef: saved.nextDef };
    });
    if (changed) next = patch(next, side, { ...you, field });
  }
  const queen = next.players[talk.side].field.find((mon) => mon?.uid === talk.queen && mon.hp > 0);
  const home = talk.home;
  if (talk.kind === "mystic") {
    const foe = (1 - talk.side) as Side;
    const left = next.players[foe].field.filter((mon) => mon && mon.hp > 0 && mon.cardId !== "mu");
    if (!queen || left.length === 0 || next.winner || talk.round === 2) {
      const you = next.players[talk.side];
      const field = you.field.map((mon) => (mon?.uid === talk.queen && mon.hp > 0 ? { ...mon, dim: true } : mon));
      return { ...patch(next, talk.side, { ...you, field }), turn: home, step: "main", pending: null, hold: null, parley: null };
    }
    return {
      ...next,
      turn: home,
      step: "main",
      pending: null,
      hold: null,
      parley: { ...talk, step: "pick-victim2", round: 2, forced: false, victim: undefined, lunger: undefined, keep: undefined },
    };
  }
  if (!queen || next.winner || talk.round === 2) return { ...next, turn: home, parley: null };
  const owner = next.players[talk.side].field;
  const victim = owner.find((mon) => mon && mon.uid === talk.victim && mon.hp > 0);
  const others = owner.filter((mon) => mon && mon.hp > 0 && mon.cardId !== "mu" && mon.uid !== talk.queen);
  return {
    ...next,
    turn: home,
    step: "main",
    pending: null,
    hold: null,
    parley: { ...talk, step: "pick-victim2", round: 2, forced: !victim && others.length === 0, victim: undefined, lunger: undefined, keep: undefined },
  };
}

function mysticSecond(state: Duel, attackerUid: string, defenderUid: string | null): Duel {
  let attacker: FieldMon | null = null;
  let attackerSide: Side = 0;
  for (const side of [0, 1] as const) {
    const found = state.players[side].field.find((mon) => mon?.uid === attackerUid && mon.hp > 0) ?? null;
    if (found) {
      attacker = found;
      attackerSide = side;
    }
  }
  if (!attacker || !mysticDue(attacker)) return state;
  if (defenderUid) {
    let defender: FieldMon | null = null;
    let defenderSide: Side = 0;
    for (const side of [0, 1] as const) {
      const found = state.players[side].field.find((mon) => mon?.uid === defenderUid && mon.hp > 0) ?? null;
      if (found) {
        defender = found;
        defenderSide = side;
      }
    }
    if (!defender) return state;
    const raw = outgoing(attacker, liveAtk(attacker) + 5);
    const hit = takePhysical(defender, raw, state.players[defenderSide].field);
    const settled = settleMystic(defender, hit.mon, null, state.players[defenderSide].field, false);
    const you = state.players[defenderSide];
    const field = you.field.map((mon) => (mon?.uid === defender?.uid ? settled.mon : mon));
    const next = patch(state, defenderSide, dropDead({ ...you, field }));
    const dealt = Math.max(0, defender.hp - (settled.mon.hp > 0 ? settled.mon.hp : 0));
    return note(next, `Tấn công nhát 2 của ${cardOf(attacker).name} gây ${dealt} sát thương.`, "hit");
  }
  const foe = (1 - attackerSide) as Side;
  const them = state.players[foe];
  if (them.hp <= 0) return state;
  const extra = liveAtk(attacker) + 5;
  const next = checkWinner(patch(state, foe, { ...them, hp: them.hp - extra }));
  return note(next, `Tấn công nhát 2 của ${cardOf(attacker).name} gây ${extra} sát thương lên người chơi.`, "hit");
}

function fieldUnit(state: Duel, uid: string): { mon: FieldMon; side: Side } | null {
  for (const side of [0, 1] as const) {
    const mon = state.players[side].field.find((unit) => unit?.uid === uid && unit.hp > 0) ?? null;
    if (mon) return { mon, side };
  }
  return null;
}

function mysticRiposte(state: Duel, mysticUid: string, foeUid: string): Duel {
  const slash = (current: Duel, bonus: number, which: "nhát 1" | "nhát 2"): Duel | null => {
    const knight = fieldUnit(current, mysticUid);
    const foe = fieldUnit(current, foeUid);
    if (!knight || !foe || !mysticDue(knight.mon)) return null;
    const raw = outgoing(knight.mon, liveAtk(knight.mon) + bonus);
    const hit = takePhysical(foe.mon, raw, current.players[foe.side].field);
    const settled = settleMystic(foe.mon, hit.mon, null, current.players[foe.side].field, false);
    const you = current.players[foe.side];
    const field = you.field.map((mon) => (mon?.uid === foe.mon.uid ? settled.mon : mon));
    const next = patch(current, foe.side, dropDead({ ...you, field }));
    const dealt = Math.max(0, foe.mon.hp - (settled.mon.hp > 0 ? settled.mon.hp : 0));
    return note(next, `Tấn công ${which} của ${cardOf(knight.mon).name} gây ${dealt} sát thương vào ${cardOf(foe.mon).name}.`, "hit");
  };
  const first = slash(state, 0, "nhát 1");
  if (!first) return state;
  if (!fieldUnit(first, foeUid)) return first;
  return slash(first, 5, "nhát 2") ?? first;
}

const TIDE = "con-thinh-no-cua-hai-vuong";
const SHADE = "chien-binh-lan-khuat";
const PREY = "ke-san-moi-tu-than";

function cyclePrey(kind: "phys" | "spell" | "tru"): "phys" | "spell" | "tru" {
  if (kind === "phys") return "spell";
  if (kind === "spell") return "tru";
  return "phys";
}

function markPrey(state: Duel, side: Side, attacker: FieldMon, aim: string, connected: boolean, died: boolean): Duel {
  if (attacker.cardId !== PREY) return state;
  if (!died) return attacker.preyAim ? { ...state, prey: null, preyAsk: false } : state;
  const current = attacker.preyKind ?? "phys";
  return { ...state, preyAsk: false, prey: { side, aim, kind: connected ? cyclePrey(current) : current } };
}

function offerPrey(state: Duel): { state: Duel; line: string } {
  const prey = state.prey;
  if (!prey || state.turn !== prey.side) return { state, line: "" };
  const you = state.players[prey.side];
  const foe = state.players[(1 - prey.side) as Side];
  const alive = prey.aim === "face" ? foe.hp > 0 : foe.field.some((mon) => mon?.uid === prey.aim && mon.hp > 0);
  if (!alive) return { state: { ...state, prey: null, preyAsk: false }, line: "Con mồi đã gục xuống." };
  const open = you.field.some((mon, index) => !mon && (you.locked?.[index] ?? 0) === 0);
  if (!open || you.orb < 1) return { state: { ...state, prey: null, preyAsk: false }, line: "Ý chí săn mồi không còn. Cuộc đi săn kết thúc." };
  return { state: { ...state, preyAsk: true }, line: "" };
}

export function answerPrey(state: Duel, yes: boolean): Duel {
  const prey = state.prey;
  if (!state.preyAsk || !prey || prey.side !== state.turn) return state;
  const closed = { ...state, prey: null, preyAsk: false };
  const end = "Ý chí săn mồi không còn. Cuộc đi săn kết thúc.";
  if (!yes) return note(closed, end);
  const you = state.players[prey.side];
  const slot = you.field.findIndex((mon, index) => !mon && (you.locked?.[index] ?? 0) === 0);
  const paid = slot >= 0 ? pay(you, 1) : null;
  if (slot < 0 || !paid) return note(closed, end);
  const born = { ...place(state, prey.side, PREY), preyKind: prey.kind, preyAim: prey.aim, dim: false };
  const field = paid.field.slice();
  field[slot] = born;
  return note(patch(closed, prey.side, { ...paid, field }), `${cardOf(born).name} trở lại để truy sát con mồi.`, "heal");
}

function shadeHidden(mon: FieldMon | null | undefined) {
  return Boolean(mon && mon.cardId === SHADE && (mon.shown ?? 0) > 0 && !mon.cage);
}

function armCage(mon: FieldMon): FieldMon {
  const printed = monsterCard(mon.cardId)?.hp ?? mon.hp;
  const maxHp = mon.maxHp || mon.hp;
  const baseMax = Math.max(1, Math.min(maxHp, printed));
  const hp = Math.min(mon.hp, baseMax);
  return { ...mon, cage: true, cageHp: mon.hp - hp, cageMax: maxHp - baseMax, hp, maxHp: baseMax };
}

function freeCage(mon: FieldMon): FieldMon {
  if (!mon.cage) return mon;
  const maxHp = (mon.maxHp || mon.hp) + (mon.cageMax ?? 0);
  const hp = Math.min(maxHp, mon.hp + (mon.cageHp ?? 0));
  return { ...mon, cage: undefined, cageHp: undefined, cageMax: undefined, hp, maxHp };
}

function castSeize(state: Duel, side: Side, mon: FieldMon, targetUid: string | null): Duel {
  if (mon.seized) return note(state, "Bắt Giữ chỉ dùng một lần mỗi lượt.");
  if (held(mon) || (mon.path ?? 0) > 0) return state;
  if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
  const foe = (1 - side) as Side;
  const them = state.players[foe];
  const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0 && unit.cardId !== "mu") ?? null;
  if (!target) return note(state, "Chọn một quái đối thủ.");
  const yourField = state.players[side].field.map((unit) => (unit?.uid === mon.uid ? { ...unit, seized: true } : unit));
  const foeField = them.field.map((unit) => (unit?.uid === target.uid ? armCage(unit) : unit));
  const next = patch(patch(state, side, { ...state.players[side], field: yourField }), foe, { ...them, field: foeField });
  return note(next, `${cardOf(mon).name} bắt giữ ${cardOf(target).name}. Khoá cứng đến hết lượt.`, "info");
}

function openShade(mon: FieldMon): FieldMon {
  if (!shadeHidden(mon)) return mon;
  return { ...mon, shown: undefined, stored: undefined };
}

function pressTide(state: Duel, victim: Side): Duel {
  const you = state.players[victim];
  let hit = false;
  const field = you.field.map((mon) => {
    if (!mon || mon.hp <= 0 || mon.cardId !== TIDE) return mon;
    hit = true;
    return { ...mon, stored: (mon.stored ?? 0) + 1 };
  });
  return hit ? patch(state, victim, { ...you, field }) : state;
}

function calmTide(state: Duel, uid: string): Duel {
  for (const side of [0, 1] as const) {
    const you = state.players[side];
    const mon = you.field.find((unit) => unit?.uid === uid && unit.cardId === TIDE);
    if (!mon || (mon.stored ?? 0) === 0) continue;
    return patch(state, side, { ...you, field: you.field.map((unit) => (unit?.uid === uid ? { ...unit, stored: 0 } : unit)) });
  }
  return state;
}

function tideSwing(state: Duel, victim: Side, attackerUid: string): Duel {
  return calmTide(pressTide(state, victim), attackerUid);
}

function tideAimsFoe(state: Duel, actor: Side, cardId: string, index: number, targetUid: string | null): boolean {
  const foe = (1 - actor) as Side;
  if (targetUid && state.players[foe].field.some((mon) => mon?.uid === targetUid)) return true;
  if (targetUid) return false;
  if (cardId === TIDE || cardId === "sua-hut-ma-phap" || cardId === "mat-do-tan-pha" || cardId === "rong-ac-ma") return true;
  if (cardId === "rong-con" || cardId === "rong-ngan-tuoi") return true;
  if (cardId === "rong-phun-hoa-cau" && index > 0) return true;
  if (cardId === "may-quay-thuong" && index === 1) return true;
  if (cardId === "trai-tim-hai-long" && index >= 2) return true;
  return false;
}

function tideSkill(before: Duel, after: Duel, uid: string, targetUid: string | null, index: number): Duel {
  if (after.players === before.players && after.winner === before.winner) return after;
  const caster = before.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
  if (!caster) return after;
  const actor = (before.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1) as Side;
  if (!tideAimsFoe(before, actor, caster.cardId, index, targetUid)) return after;
  return pressTide(after, (1 - actor) as Side);
}

function resolveMelee(state: Duel, attackerUid: string, defenderUid: string): Duel {
  return envGuard(state, [attackerUid, defenderUid], [attackerUid, defenderUid], () => resolveMeleeCore(state, attackerUid, defenderUid));
}

function resolveMeleeCore(state: Duel, attackerUid: string, defenderUid: string): Duel {
  const side = state.turn;
  const foe = (1 - side) as Side;
  const you = state.players[side];
  const them = state.players[foe];
  const attacker = you.field.find((mon) => mon?.uid === attackerUid) ?? null;
  const defender = them.field.find((mon) => mon?.uid === defenderUid) ?? null;
  if (!attacker || !defender) return releaseLegend({ ...state, step: "main", pending: null, hold: null });
  if (them.mirror > 0) {
    const plain = dropClash(openShade(attacker));
    const robbed = {
      ...plain,
      atk: Math.floor(plain.atk / 2),
      def: Math.floor(plain.def / 2),
      mdef: Math.floor(plain.mdef / 2),
      hp: Math.max(1, Math.floor(plain.hp / 2)),
      dim: true,
      glass: true,
    };
    return tideSwing(releaseLegend({
      ...note(
        patch(state, side, { ...you, field: you.field.map((mon) => (mon?.uid === attacker.uid ? robbed : mon)) }),
        "Gương phòng hộ chặn giáp lá cà và cướp một nửa chỉ số.",
        "spell",
      ),
      step: "main",
      pending: null,
      hold: null,
    }), foe, attacker.uid);
  }
  const meleeBlow = !attacker.horn && !attacker.gaze && !attacker.bolt;
  const shot = openGuardShot(attacker, defender, meleeBlow, you.field, them.roster);
  const defPool = phantomPool(defender, them.field);
  const atkPool = phantomPool(attacker, you.field);
  const hit = strikePair(withLegend(shot.attacker), withLegend(shot.defender), you.field, them.field, you.roster, them.roster, rockOf(state, attacker), rockOf(state, defender));
  const awardA = bullAward(hit.attacker, defender.cardId, hit.defender.hp <= 0);
  const awardD = bullAward(hit.defender, attacker.cardId, hit.attacker.hp <= 0);
  let wornA = dullHorn(awardA.mon, attacker.horn);
  let wornD = awardD.mon;
  const hornRaw = attacker.horn === "plus" ? Math.min(8, liveAtk(attacker)) : attacker.horn === "splash" ? Math.min(4, liveAtk(attacker)) : liveAtk(attacker);
  const hornDealt = attacker.horn && !rabbitDodge(defender, attacker) ? spellLanded(defender, hornRaw, them.field, attacker) : attacker.horn ? 0 : 0;
  const gazeDealt = attacker.gaze && !attacker.horn && !rabbitDodge(defender, attacker) ? truLanded(defender, liveAtk(attacker), them.field, attacker) : 0;
  const hiddenStrike = shadeHidden(attacker) && !attacker.horn && !attacker.gaze && !attacker.bolt;
  const hiddenDealt = hiddenStrike && !rabbitDodge(defender, attacker) ? truLanded(defender, liveAtk(attacker), them.field, attacker) : 0;
  let splashLine = "";
  let splash = 0;
  let others: FieldMon[] = [];
  if (attacker.horn === "splash") {
    splash = Math.min(4, liveAtk(attacker));
    others = them.field.filter((mon): mon is FieldMon => Boolean(mon && mon.uid !== defender.uid && mon.hp > 0));
    if (others.length) {
      splashLine = ` Lan ${others.map((mon) => `${spellLanded(mon, splash, them.field, attacker)} sát thương phép vào ${cardOf(mon).name}`).join(", ")}.`;
    }
    const splashed = spray(them.field, (mon, allies) => (mon.uid === defender.uid ? mon : damageSpell(mon, splash, allies, attacker)), [defender.uid]);
    them.field.splice(0, them.field.length, ...splashed);
  }
  const worn = combatErode(wornA, wornD, side);
  let body = worn.defender;
  let riderAttacker = worn.attacker;
  const riderBits: string[] = [];
  let riderSkill: Duel["skill"] = null;
  const clash = !attacker.horn && !attacker.gaze;
  if (clash && attacker.cardId === RIDER && !rabbitDodge(defender, attacker)) {
    const packets = riderPackets(withLegend(attacker), defender, them.field);
    body = applyIncoming(body, packets.second, them.field, veilLeft(defender, packets.first)).mon;
    const hits = [defender.uid, defender.uid];
    const vols = [packets.first, packets.second];
    const fires: Array<{ name: string; n: number }> = [];
    them.field.forEach((mon, index) => {
      if (!mon || mon.uid === defender.uid || mon.hp <= 0) return;
      const n = hurt(mon, packets.fire);
      const shown = shownTru(mon, n, them.field);
      them.field[index] = applyIncoming(mon, n, them.field).mon;
      hits.push(mon.uid);
      vols.push(n);
      fires.push({ name: fieldName(mon), n: shown });
    });
    riderSkill = { id: RIDER, index: 0, aim: defender.uid, hits, vols };
    riderBits.push(`- Mũi thương bị nguyền rủa lên ${fieldName(defender)} gây ${shownTru(defender, packets.physical, them.field, 0, defPool)} sát thương vật lý, ${shownTru(defender, packets.tru, them.field, packets.physical, defPool)} sát thương chuẩn.`);
    if (fires.length) riderBits.push(riderFireLine(fires));
  }
  if (clash && defender.cardId === RIDER && !rabbitDodge(attacker, defender)) {
    const packets = riderPackets(withLegend(defender), attacker, you.field);
    riderAttacker = applyIncoming(riderAttacker, packets.second, you.field, veilLeft(attacker, packets.first)).mon;
    const hits = [attacker.uid, attacker.uid, ...(riderSkill?.hits ?? [])];
    const vols = [packets.first, packets.second, ...(riderSkill?.vols ?? [])];
    const fires: Array<{ name: string; n: number }> = [];
    you.field.forEach((mon, index) => {
      if (!mon || mon.uid === attacker.uid || mon.hp <= 0) return;
      const n = hurt(mon, packets.fire);
      const shown = shownTru(mon, n, you.field);
      you.field[index] = applyIncoming(mon, n, you.field).mon;
      hits.push(mon.uid);
      vols.push(n);
      fires.push({ name: fieldName(mon), n: shown });
    });
    riderSkill = { id: RIDER, index: 0, aim: riderSkill?.aim ?? attacker.uid, hits, vols };
    riderBits.push(`- Mũi thương bị nguyền rủa lên ${fieldName(attacker)} gây ${shownTru(attacker, packets.physical, you.field, 0, atkPool)} sát thương vật lý, ${shownTru(attacker, packets.tru, you.field, packets.physical, atkPool)} sát thương chuẩn.`);
    if (fires.length) riderBits.push(riderFireLine(fires));
  }
  const riderLine = riderBits.length ? `${monsterCard(RIDER)?.name ?? "Kỵ sĩ cưỡi rồng"} dùng\n${riderBits.join("\n")}` : "";
  const fed = withLeech(you.field, riderAttacker, hit.bite, hit.surplus);
  let next = patch(state, side, settleCocoon(dropDead({ ...you, field: fed.field })));
  next = patch(next, foe, settleCocoon(dropDead({ ...them, field: them.field.map((mon) => (mon?.uid === defender.uid ? body : mon)) })));
  const soul = soulLeech(next, side, attacker, hit.bite + hit.surplus);
  next = soul.state;
  const tail = `${shot.line ? ` ${shot.line}` : ""}${hit.dodged ? " Thỏ đen tinh nghịch né đòn." : ""}${soul.line}`;
  const hornRows = attacker.horn
    ? [
        { name: cardOf(defender).name, bits: `${hornDealt} sát thương phép` },
        ...(attacker.horn === "splash"
          ? others.map((mon) => ({ name: cardOf(mon).name, bits: `${spellLanded(mon, splash, them.field, attacker)} sát thương phép` }))
          : []),
      ]
    : [];
  const hornLine = attacker.horn ? aimNotice("Sấm lôi phá", hornRows, tail) : null;
  const boltDealt = attacker.bolt ? spellLanded(defender, liveAtk(attacker) + plateBank(attacker).p + plateBank(attacker).s, them.field, attacker) : 0;
  const released = releaseLegend({
    ...note(
      next,
      hornLine
        ? hornLine
        : attacker.horn
          ? `Sấm lôi phá gây ${hornDealt} sát thương phép vào ${cardOf(defender).name}.${splashLine}${tail}`
          : attacker.bolt
            ? `Roi sấm gây ${boltDealt} sát thương phép vào ${cardOf(defender).name}.${tail}`
            : attacker.gaze
            ? `${cardOf(attacker).name} bắn tia sáng vào ${cardOf(defender).name}, gây ${gazeDealt} sát thương chuẩn.${tail}`
            : hiddenStrike
              ? `${cardOf(attacker).name} ám sát ${cardOf(defender).name}, gây ${hiddenDealt} sát thương chuẩn.${tail}`
            : riderLine
              ? `${riderLine}${tail}`
              : attacker.cardId === PREY && attacker.preyKind === "spell"
                ? `${cardOf(attacker).name} truy sát ${cardOf(defender).name}, gây ${spellLanded(defender, liveAtk(attacker), them.field, attacker)} sát thương phép.${tail}`
                : attacker.cardId === PREY && attacker.preyKind === "tru"
                  ? `${cardOf(attacker).name} truy sát ${cardOf(defender).name}, gây ${truLanded(defender, liveAtk(attacker), them.field, attacker)} sát thương chuẩn.${tail}`
                  : `${cardOf(attacker).name} giáp lá cà với ${cardOf(defender).name}.${tail}`,
      attacker.horn || attacker.gaze || attacker.bolt ? "spell" : "hit",
    ),
    step: "main",
    pending: null,
    hold: null,
    skill: riderSkill,
    mends: [awardA, awardD].filter((row) => row.mend > 0 && row.mon.hp > 0).map((row) => ({ uid: row.mon.uid, n: row.mend })),
  });
  const covered = defender.cardId === MYSTIC && Boolean(defender.guarding);
  const swung = tideSwing(finishParley(mysticSecond(swingSword(growSmash(
    growSmash(becomePerfect(released, side, attacker.uid), attacker.uid, smashPlain(attacker)),
    defender.uid,
    smashPlain(defender) && !attacker.horn && !attacker.gaze && !attacker.bolt,
  ), attacker.uid, swordSwing(attacker)), attacker.uid, defender.uid)), foe, attacker.uid);
  const origin = state.pending?.kind === "melee" ? state.pending.defender : defender.uid;
  const hunted = markPrey(swung, side, attacker, origin, origin === defender.uid && !hit.dodged, riderAttacker.hp <= 0);
  return covered ? mysticRiposte(hunted, defender.uid, attacker.uid) : hunted;
}

const SOUL_ID = "ke-giam-ho-linh-hon";

function grantSoul(mon: FieldMon, stacks: number): FieldMon {
  const hp = stacks;
  const cap = (mon.maxHp || mon.hp) + hp;
  return {
    ...mon,
    maxHp: cap,
    hp: mon.hp + hp,
    raised: markRaised(mon, { hp }),
    soul: (mon.soul ?? 0) + stacks,
  };
}

function soulSync(state: Duel): Duel {
  let next = state;
  const mends = [...(state.mends ?? [])];
  let gained = false;
  for (const side of [0, 1] as const) {
    const player = next.players[side];
    const due = Math.floor(Math.max(0, LIFE - player.hp) / 3);
    let changed = false;
    const field = player.field.map((mon) => {
      if (!mon || mon.cardId !== SOUL_ID || mon.hp <= 0) return mon;
      const add = due - (mon.soul ?? 0);
      if (add <= 0) return mon;
      changed = true;
      gained = true;
      mends.push({ uid: mon.uid, n: add });
      return grantSoul(mon, add);
    });
    if (changed) next = patch(next, side, { ...next.players[side], field });
  }
  if (!gained) return next;
  return { ...next, mends, tone: next.tone === "info" ? "heal" : next.tone };
}

function soulLeech(state: Duel, side: Side, attacker: FieldMon, dealt: number): { state: Duel; line: string } {
  if (attacker.cardId !== SOUL_ID || attacker.horn || dealt <= 0) return { state, line: "" };
  const you = state.players[side];
  const hp = Math.min(LIFE, you.hp + dealt);
  const gain = hp - you.hp;
  if (gain <= 0) return { state, line: "" };
  return { state: patch(state, side, { ...you, hp }), line: ` ${cardOf(attacker).name} hồi ${gain} máu cho người chơi.` };
}

function soulToll(mon: FieldMon): number {
  return 2 + (mon.vows ?? 0);
}

function soulGrant(mon: FieldMon): { atk: number; def: number; hp: number } {
  const extra = mon.vows ?? 0;
  return { atk: 1 + extra, def: 1, hp: 1 + extra };
}

export function soulAskLine(mon: FieldMon): string {
  const cost = soulToll(mon);
  const grant = soulGrant(mon);
  return `Hiến tế ${cost} máu để +${grant.atk} công, +1 phòng ngự và +${grant.hp} máu tối đa trong giao tranh?`;
}

function offerSoul(state: Duel, uid: string): Duel {
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  const cost = mon ? soulToll(mon) : 2;
  if (!mon || you.hp < cost) return state;
  const grant = soulGrant(mon);
  const field = you.field.map((unit) => {
    if (unit?.uid !== uid) return unit;
    return {
      ...unit,
      hp: unit.hp + grant.hp,
      maxHp: (unit.maxHp || unit.hp) + grant.hp,
      vows: (unit.vows ?? 0) + 1,
      clash: {
        atk: (unit.clash?.atk ?? 0) + grant.atk,
        def: (unit.clash?.def ?? 0) + grant.def,
        mdef: (unit.clash?.mdef ?? 0) + grant.def,
        maxHp: (unit.clash?.maxHp ?? 0) + grant.hp,
      },
    };
  });
  return patch(state, side, { ...you, hp: you.hp - cost, field });
}

export function answerSoul(state: Duel, yes: boolean): Duel {
  const ask = state.soulAsk;
  if (!ask) return state;
  let next: Duel = { ...state, soulAsk: null };
  if (yes) {
    const mon = next.players[next.turn].field.find((unit) => unit?.uid === ask.uid) ?? null;
    if (!mon || next.players[next.turn].hp < soulToll(mon)) return note(next, "Không đủ máu để hiến tế.");
    next = offerSoul(next, ask.uid);
    if (next.players[next.turn].hp <= 0) return checkWinner(note(next, `${monsterCard(SOUL_ID)?.name} hiến tế hết máu.`));
  }
  return ask.kind === "face" ? attackFace(next, ask.uid, true) : attackMonster(next, ask.uid, ask.target ?? "", false, true);
}

export function attackMonster(state: Duel, attackerUid: string, defenderUid: string, _skipGnaw = false, soulChosen = false): Duel {
  const next = attackMonsterCore(state, attackerUid, defenderUid, _skipGnaw, soulChosen);
  if (next === state || (next.soulAsk && !state.soulAsk)) return next;
  const declared = next.pending?.kind === "melee";
  if (!declared && next.upkeep && !state.upkeep && next.players === state.players) return next;
  const mon = state.players[state.turn].field.find((unit) => unit?.uid === attackerUid) ?? null;
  const targetUid = declared && next.pending?.kind === "melee" ? next.pending.defender : defenderUid;
  return traced(state, next, {
    kind: "attack-monster",
    actor: state.turn,
    ok: declared,
    cardId: mon?.cardId ?? null,
    target: monsterTarget(declared ? next : state, targetUid),
    end: null,
  });
}

function attackMonsterCore(state: Duel, attackerUid: string, defenderUid: string, _skipGnaw = false, soulChosen = false): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner || !canTargetFoe(state)) {
    return canTargetFoe(state) ? state : note(state, "Lượt đầu không được nhắm đối thủ.");
  }
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  const you = state.players[state.turn];
  const them = state.players[(1 - state.turn) as Side];
  defenderUid = redirectCover(them.field, defenderUid) ?? defenderUid;
  defenderUid = shuntUid(them.field, defenderUid) ?? defenderUid;
  const picked = them.field.find((mon) => mon?.uid === defenderUid) ?? null;
  if (picked && kazuraSafe(picked)) return note(state, `${cardOf(picked).name} không thể bị tấn công. Còn ${picked.safe ?? 0} lượt.`);
  if (you.attackLock > 0) return note(state, "Bạn đang bị cấm tấn công.");
  const attacker = you.field.find((mon) => mon?.uid === attackerUid) ?? null;
  const defender = them.field.find((mon) => mon?.uid === defenderUid) ?? null;
  if (attacker && (attacker.path ?? 0) > 0) return note(state, `${cardOf(attacker).name} không thể hành động.`);
  if (!attacker || attacker.dim || attacker.cardId === "chan-ken" || attacker.cardId === "hoa-an-thit-nguoi" || attacker.cardId === "mu" || barred(attacker) || (attacker.path ?? 0) > 0 || !defender) return state;
  if (attacker.cage) return note(state, "Đang bị khoá cứng.");
  if (attacker.preyAim === "face") return note(state, "Chỉ được truy sát người chơi đối thủ.");
  if (attacker.preyAim && attacker.preyAim !== defender.uid) return note(state, "Chỉ được truy sát con mồi đã ghi nhớ.");
  if (attacker.hornNew && state.mode === "ai" && state.turn === 1) {
    const mode: "plain" | "plus" = you.orb >= 1 ? "plus" : "plain";
    const field = you.field.map((mon) => (mon?.uid === attacker.uid ? { ...mon, horn: mode, hornNew: false } : mon));
    return attackMonster(patch(state, state.turn, { ...you, field }), attackerUid, defenderUid, _skipGnaw, soulChosen);
  }
  if (attacker.cardId === "rong-boc-trung" && attacker.stance === "guard") return note(state, "Thế thủ không được tấn công");
  if (attacker.cardId === SOUL_ID && !soulChosen && you.hp >= soulToll(attacker)) {
    if (state.mode === "ai" && state.turn === 1) return attackMonster(you.hp >= 8 ? offerSoul(state, attacker.uid) : state, attackerUid, defenderUid, _skipGnaw, true);
    return { ...state, soulAsk: { uid: attacker.uid, kind: "melee", target: defenderUid } };
  }
  const landed = them.field.find((mon) => mon?.uid === defenderUid) ?? defender;
  let ready: Duel = { ...state, echo: null, last: null };
  if (attacker.horn === "splash" || attacker.horn === "plus") {
    const paid = pay(you, 1);
    if (!paid) {
      const field = you.field.map((mon) => (mon?.uid === attacker.uid ? { ...mon, horn: "plain" as const } : mon));
      ready = patch(ready, state.turn, { ...you, field });
    } else ready = patch(ready, state.turn, paid);
  }
  const named = ready.players[state.turn].field.find((mon) => mon?.uid === attacker.uid) ?? attacker;
  let cast = ready;
  if (smashPlain(named) || swordDue(named) || mysticDue(named)) {
    const paid = pay(cast.players[state.turn], 1);
    if (!paid) return note(state, "Cần 1 mana.");
    cast = patch(cast, state.turn, paid);
  }
  const hornRaw = named.horn === "plus" ? Math.min(8, liveAtk(named)) : named.horn === "splash" ? Math.min(4, liveAtk(named)) : named.horn ? liveAtk(named) : 0;
  const hornHit = named.horn ? spellLanded(landed, hornRaw, them.field, named) : 0;
  const line = named.horn
    ? `Sấm lôi phá gây ${hornHit} sát thương phép vào ${cardOf(landed).name}`
    : named.bolt
      ? `Roi sấm gây ${spellLanded(landed, liveAtk(named) + plateBank(named).p + plateBank(named).s, them.field, named)} sát thương phép vào ${cardOf(landed).name}`
      : named.gaze
      ? `${cardOf(named).name} bắn tia sáng vào ${cardOf(landed).name}, gây ${truLanded(landed, liveAtk(named), them.field, named)} sát thương chuẩn`
      : mysticDue(named)
        ? `${cardOf(named).name} dùng Tấn công, lao vào ${cardOf(landed).name}`
        : `${cardOf(named).name} lao vào ${cardOf(landed).name}`;
  const acted = markQueenAct(cast, state.turn, named.uid);
  return beginHold(acted.state, { kind: "melee", attacker: named.uid, defender: landed.uid }, `${line}${acted.extra}`);
}

export function attackFace(state: Duel, attackerUid: string, soulChosen = false): Duel {
  const next = attackFaceCore(state, attackerUid, soulChosen);
  if (next === state || (next.soulAsk && !state.soulAsk)) return next;
  const declared = next.pending?.kind === "face" && !next.pending.skill;
  if (!declared && next.upkeep && !state.upkeep && next.players === state.players) return next;
  const mon = state.players[state.turn].field.find((unit) => unit?.uid === attackerUid) ?? null;
  return traced(state, next, { kind: "attack-face", actor: state.turn, ok: declared, cardId: mon?.cardId ?? null, target: { kind: "face" }, end: null });
}

function attackFaceCore(state: Duel, attackerUid: string, soulChosen = false): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
  const you = state.players[state.turn];
  if (you.attackLock > 0) return note(state, "Bạn đang bị cấm tấn công.");
  const attacker = you.field.find((mon) => mon?.uid === attackerUid) ?? null;
  if (attacker && (attacker.path ?? 0) > 0) return note(state, `${cardOf(attacker).name} không thể hành động.`);
  if (!attacker || attacker.dim || attacker.cardId === "chan-ken" || attacker.cardId === "hoa-an-thit-nguoi" || barred(attacker) || (attacker.path ?? 0) > 0) return state;
  if (attacker.cage) return note(state, "Đang bị khoá cứng.");
  if (attacker.preyAim && attacker.preyAim !== "face") return note(state, "Chỉ được truy sát con mồi đã ghi nhớ.");
  if (attacker.cardId === "rong-boc-trung" && attacker.stance === "guard") return note(state, "Thế thủ không được tấn công");
  if (attacker.cardId === SOUL_ID && !soulChosen && you.hp >= soulToll(attacker)) {
    if (state.mode === "ai" && state.turn === 1) return attackFace(you.hp >= 8 ? offerSoul(state, attacker.uid) : state, attackerUid, true);
    return { ...state, soulAsk: { uid: attacker.uid, kind: "face" } };
  }
  let cast: Duel = { ...state, echo: null, last: null };
  if (smashPlain(attacker) || swordDue(attacker) || mysticDue(attacker)) {
    const paid = pay(cast.players[state.turn], 1);
    if (!paid) return note(state, "Cần 1 mana.");
    cast = patch(cast, state.turn, paid);
  }
  const line = attacker.horn || attacker.gaze || attacker.bolt ? `${cardOf(attacker).name} bắn phép vào người. Có thể chặn` : mysticDue(attacker) ? `${cardOf(attacker).name} dùng Tấn công, đánh vào người. Có thể chặn` : `${cardOf(attacker).name} đánh vào người. Có thể chặn`;
  const acted = markQueenAct(cast, state.turn, attacker.uid);
  return beginHold(acted.state, { kind: "face", attacker: attacker.uid }, `${line}${acted.extra}`);
}

function resolveHellFace(state: Duel, attacker: FieldMon, blocker: FieldMon | null): Duel {
  const side = state.turn;
  const foe = (1 - side) as Side;
  const you = state.players[side];
  const cost = skillManaCost(attacker.cardId, 1);
  const before = you.stars;
  const paid = pay(you, cost);
  if (!paid) return { ...note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`), step: "main", pending: null, hold: null };
  const armed = pingStars(patch(state, side, paid), side, before, paid.stars);
  const caster = armed.players[side].field.find((mon) => mon?.uid === attacker.uid) ?? attacker;
  if (blocker) return resolveHell(armed, caster, blocker);
  const releaseHex = bindSkillHex(caster);
  const figures = hellFigures(attacker.cardId);
  if (attacker.skillUp) figures.spell += attacker.skillUp;
  const shaved = shaveHex(attacker, figures);
  const shot = {
    phys: outgoing(caster, shaved.phys),
    spell: outgoing(caster, shaved.spell),
    tru: outgoing(caster, shaved.tru),
  };
  releaseHex();
  const dealt = shot.phys + shot.spell + shot.tru;
  const field = armed.players[side].field.map((mon) => (mon?.uid === caster.uid ? { ...mon, dim: true } : mon));
  let next = patch(armed, side, { ...armed.players[side], field });
  const them = next.players[foe];
  next = patch(next, foe, { ...them, hp: them.hp - dealt });
  next = checkWinner(note(next, actNotice(castName(attacker.cardId, 0), hellLine(shot, "người chơi")), "spell"));
  return {
    ...next,
    step: next.winner !== null ? "over" : "main",
    pending: null,
    hold: null,
    skill: { id: attacker.cardId, index: 0, aim: null },
  };
}

export function resolveFace(state: Duel, blockerUid: string | null, withSkill = false): Duel {
  const attackerUid = state.pending?.kind === "face" ? state.pending.attacker : null;
  const pair = attackerUid && blockerUid ? [attackerUid, blockerUid] : [];
  return envGuard(state, attackerUid ? [attackerUid, ...(blockerUid ? [blockerUid] : [])] : [], pair, () => resolveFaceCore(state, blockerUid, withSkill));
}

function resolveFaceCore(state: Duel, blockerUid: string | null, withSkill = false): Duel {
  if (state.step !== "respond" || state.pending?.kind !== "face") return state;
  const pending = state.pending;
  const side = state.turn;
  const foe = (1 - side) as Side;
  const you = state.players[side];
  const them = state.players[foe];
  const attacker = you.field.find((mon) => mon?.uid === pending.attacker) ?? null;
  if (!attacker) return releaseLegend({ ...state, step: "main", pending: null });
  if (pending.skill && attacker.cardId === "may-quay-thuong") {
    const blocker = blockerUid ? them.field.find((mon) => mon?.uid === blockerUid) ?? null : null;
    const legal = blocker && canIntercept(blocker, true) ? blocker.uid : null;
    const open = commitGuardShot({ ...state, step: "main" as const, pending: null, hold: null }, attacker.uid, legal ?? "", false);
    return releaseGuardMark(useSkill(open, attacker.uid, legal, 1, true, null, true), legal);
  }
  if (blockerUid) {
    const blocker = them.field.find((mon) => mon?.uid === blockerUid) ?? null;
    if (!canIntercept(blocker, true)) {
      return { ...resolveFace(state, null, false), hold: null };
    }
    if (them.mirror > 0) {
      const plain = dropClash(openShade(attacker));
      const robbed = {
        ...plain,
        atk: Math.floor(plain.atk / 2),
        def: Math.floor(plain.def / 2),
        mdef: Math.floor(plain.mdef / 2),
        hp: Math.max(1, Math.floor(plain.hp / 2)),
        dim: true,
        glass: true,
      };
      const next = patch(state, side, {
        ...you,
        field: you.field.map((mon) => (mon?.uid === attacker.uid ? robbed : mon)),
      });
      return tideSwing(releaseLegend({ ...note(next, "Gương phòng hộ chặn đòn và cướp một nửa chỉ số.", "spell"), step: "main", pending: null }), foe, attacker.uid);
    }
    if (isHell(attacker.cardId)) return resolveHellFace(state, attacker, blocker);
    if (pending.skill && (attacker.cardId === "rong-con" || attacker.cardId === "rong-ngan-tuoi" || attacker.cardId === "rong-phun-hoa-cau" || attacker.cardId === "sua-hut-ma-phap" || attacker.cardId === TIDE)) {
      const open = commitGuardShot({ ...state, step: "main" as const, pending: null, hold: null }, attacker.uid, blocker.uid, false);
      return releaseGuardMark(useSkill(open, attacker.uid, blocker.uid, attacker.cardId === "rong-phun-hoa-cau" ? 1 : 0, true, null, true), blocker.uid);
    }
    const guarding = them;
    const meleeBlow = !attacker.horn && !attacker.gaze && !attacker.bolt;
    const shot = openGuardShot(attacker, blocker, meleeBlow, you.field, them.roster);
    const body = withLegend(shot.defender);
    const hit = strikePair(withLegend(shot.attacker), body, you.field, guarding.field, you.roster, them.roster, rockOf(state, attacker), rockOf(state, blocker));
    const awardA = bullAward(hit.attacker, body.cardId, hit.defender.hp <= 0);
    const awardD = bullAward(hit.defender, attacker.cardId, hit.attacker.hp <= 0);
    let wornA = dullHorn(awardA.mon, attacker.horn);
    let wornD = awardD.mon;
    const worn = combatErode(wornA, wornD, side);
    const fed = withLeech(you.field, worn.attacker, hit.bite, hit.surplus);
    let next = patch(state, side, settleCocoon(dropDead({ ...you, field: fed.field })));
    next = patch(next, foe, settleCocoon(dropDead({ ...guarding, field: guarding.field.map((mon) => (mon?.uid === body.uid ? worn.defender : mon)) })));
    const soul = soulLeech(next, side, attacker, hit.bite + hit.surplus);
    next = soul.state;
    const gazeOnly = Boolean(attacker.gaze && !attacker.horn && !attacker.bolt);
    const hiddenOnly = shadeHidden(attacker) && !attacker.horn && !attacker.gaze && !attacker.bolt;
    const beamed = Boolean(attacker.horn || attacker.bolt);
    const how = beamed ? "đỡ phép" : withSkill ? "chặn bằng kỹ năng" : "chặn bằng giáp lá cà";
    const plate = plateBank(attacker);
    const taken = beamed
      ? rabbitDodge(body, attacker)
        ? 0
        : spellLanded(
            body,
            attacker.bolt
              ? liveAtk(attacker) + plate.p + plate.s
              : attacker.horn === "plus"
                ? Math.min(8, liveAtk(attacker))
                : attacker.horn === "splash"
                  ? Math.min(4, liveAtk(attacker))
                  : liveAtk(attacker),
            guarding.field,
            attacker,
          )
      : (gazeOnly || hiddenOnly) && !rabbitDodge(body, attacker)
        ? truLanded(body, liveAtk(attacker), guarding.field, attacker)
        : 0;
    const hurtBit = beamed ? `, chịu ${taken} sát thương phép` : gazeOnly || hiddenOnly ? `, chịu ${taken} sát thương chuẩn` : "";
    const blocked = releaseLegend({
      ...note(next, `${cardOf(body).name} ${how}${hurtBit}.${shot.line ? ` ${shot.line}` : ""}${hit.dodged ? ` ${cardOf(body).name} né đòn.` : ""}${soul.line}`, beamed || gazeOnly ? "spell" : "hit"),
      step: "main",
      pending: null,
      mends: [awardA, awardD].filter((row) => row.mend > 0 && row.mon.hp > 0).map((row) => ({ uid: row.mon.uid, n: row.mend })),
    });
    const swung = tideSwing(finishParley(mysticSecond(swingSword(growSmash(
      growSmash(becomePerfect(blocked, side, attacker.uid), attacker.uid, smashPlain(attacker)),
      blocker.uid,
      smashPlain(blocker) && !attacker.horn && !attacker.gaze && !attacker.bolt,
    ), attacker.uid, swordSwing(attacker)), attacker.uid, blocker.uid)), foe, attacker.uid);
    const hunted = markPrey(swung, side, attacker, "face", false, worn.attacker.hp <= 0);
    return blocker.cardId === MYSTIC ? mysticRiposte(hunted, blocker.uid, attacker.uid) : hunted;
  }
  if (isHell(attacker.cardId)) return resolveHellFace(state, attacker, null);
  if (pending.skill && (attacker.cardId === "rong-con" || attacker.cardId === "rong-ngan-tuoi" || attacker.cardId === "rong-phun-hoa-cau" || attacker.cardId === "sua-hut-ma-phap" || attacker.cardId === TIDE)) {
    const open = { ...state, step: "main" as const, pending: null, hold: null };
    return useSkill(open, attacker.uid, null, attacker.cardId === "rong-phun-hoa-cau" ? 1 : 0, true, null, true);
  }
  const plate = plateBank(attacker);
  const bolt = Boolean(attacker.bolt);
  const spent = dropClash(spendBless(spendPlate(dullHorn({ ...attacker, dim: true }, attacker.horn), bolt ? { p: plate.p, s: plate.s } : plate, bolt)));
  const raw = attacker.horn ? attacker.atk + (attacker.blessAtk ?? 0) : liveAtk(attacker);
  const dealt = attacker.cardId === PERFECT
    ? outgoing(attacker, bolt ? raw + plate.p + plate.s : raw + plate.p + plate.s)
    : attacker.horn || attacker.gaze
      ? outgoing(attacker, raw)
      : attacker.cardId === RIDER
        ? outgoing(attacker, Math.max(raw, skillFigure(RIDER, "dmg", 4)))
        : raw;
  const bitten = Math.min(dealt, Math.max(0, them.hp));
  const fed = withLeech(you.field, spent, bitten, Math.max(0, dealt - bitten));
  let next = patch(state, side, { ...you, field: fed.field });
  next = patch(next, foe, { ...them, hp: them.hp - dealt });
  const soul = soulLeech(next, side, attacker, dealt);
  next = soul.state;
  const gazeTrue = Boolean(attacker.gaze && !attacker.horn && !bolt);
  const beamed = Boolean(attacker.horn || attacker.gaze || attacker.bolt);
  const guardSpell = !attacker.horn && !attacker.gaze && !bolt && guardStrikeKind(attacker, you.roster) === "spell";
  const preyHit = attacker.cardId === PREY && attacker.preyKind === "spell" ? "sát thương phép" : attacker.cardId === PREY && attacker.preyKind === "tru" ? "sát thương chuẩn" : "";
  const hiddenFace = shadeHidden(attacker) && !beamed ? "sát thương chuẩn" : "";
  const faceWord = guardSpell ? "sát thương phép" : preyHit || hiddenFace || "máu";
  next = checkWinner(note(next, beamed ? `${cardOf(attacker).name} gây ${dealt} ${gazeTrue ? "sát thương chuẩn" : "sát thương phép"} lên người chơi.${soul.line}` : `${cardOf(attacker).name} gây ${dealt} ${faceWord} lên người chơi.${soul.line}`, beamed || guardSpell || preyHit === "sát thương phép" ? "spell" : "hit"));
  return markPrey(tideSwing(finishParley(mysticSecond(swingSword(growSmash(becomePerfect(releaseLegend({ ...next, step: next.winner !== null ? "over" : "main", pending: null }), side, attacker.uid), attacker.uid, smashPlain(attacker)), attacker.uid, swordSwing(attacker)), attacker.uid, null)), foe, attacker.uid), side, attacker, "face", true, spent.hp <= 0);
}

export function answerGnaw(state: Duel, useSkillNow: boolean): Duel {
  const pending = state.pending;
  if (state.step !== "respond" || !pending) return state;
  if (pending.kind === "gnaw") {
    const ownerSide = (state.players[0].field.some((mon) => mon?.uid === pending.defender) ? 0 : 1) as Side;
    let next = state;
    if (useSkillNow) {
      const owner = next.players[ownerSide];
      const mon = owner.field.find((unit) => unit?.uid === pending.defender) ?? null;
      const paid = mon ? payCost(owner, skillManaCost(mon.cardId)) : null;
      if (paid && mon && !mon.dim) {
        const boosted = boostGnaw(mon);
        const bonus = skillHpBonus(mon.cardId);
        next = note(
          patch(next, ownerSide, { ...paid, field: paid.field.map((unit) => (unit?.uid === mon.uid ? boosted : unit)) }),
          `${cardOf(mon).name} nhân đôi phòng ngự và tăng ${bonus} máu tối đa.`,
        );
      }
    }
    next = { ...next, step: "main", pending: null };
    return attackMonsterCore(next, pending.attacker, pending.defender, true, true);
  }
  if (pending.kind === "gnaw-skill") {
    const ownerSide = (state.players[0].field.some((mon) => mon?.uid === pending.target) ? 0 : 1) as Side;
    let next = state;
    if (useSkillNow) {
      const owner = next.players[ownerSide];
      const mon = owner.field.find((unit) => unit?.uid === pending.target) ?? null;
      const paid = mon ? payCost(owner, skillManaCost(mon.cardId)) : null;
      if (paid && mon && !mon.dim) {
        const boosted = boostGnaw(mon);
        const bonus = skillHpBonus(mon.cardId);
        next = note(
          patch(next, ownerSide, { ...paid, field: paid.field.map((unit) => (unit?.uid === mon.uid ? { ...boosted, dim: true } : unit)) }),
          `${cardOf(mon).name} nhân đôi phòng ngự và tăng ${bonus} máu tối đa.`,
        );
      }
    }
    next = { ...next, step: "main", pending: null };
    return useSkill(next, pending.caster, pending.target, pending.index, true, null, true);
  }
  return state;
}

export function declareSkill(state: Duel, uid: string, targetUid: string | null, skillIndex = 0, extra: string | null = null): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => declareSkill(next, uid, targetUid, skillIndex, extra));
  const next = declareSkillCore(state, uid, targetUid, skillIndex, extra);
  return traceSkill(state, next, uid, targetUid);
}

function declareSkillCore(state: Duel, uid: string, targetUid: string | null, skillIndex = 0, extra: string | null = null): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner) return state;
  const you = state.players[state.turn];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.dim || held(mon) || hexLocked(mon)) return state;
  if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
  if (isHell(mon.cardId) && you.orb < skillManaCost(mon.cardId, 1)) return note(state, "Cần 1 gem.");
  if (mon.cardId === "may-nem-bom-hinh-nhen" && you.orb < skillManaCost(mon.cardId, 1)) return note(state, "Cần 1 gem.");
  const foeField = state.players[(1 - state.turn) as Side].field;
  const aimed = redirectCover(foeField, targetUid);
  const moth = mon.cardId === "ngai-khong-lo" || mon.cardId === "ngai-nu-hoang" || mon.cardId === "ngai-hoan-my";
  if (moth && !aimed) return note(state, "Chọn một quái đối thủ.");
  if (mon.cardId === "trai-tim-hai-long" && skillIndex >= 2 && !aimed) return note(state, "Chọn một quái đối thủ.");
  if (mon.cardId === "may-nem-bom-hinh-nhen" && targetUid && !aimed) return note(state, "Chọn một quái đối thủ hoặc người chơi.");
  const skill = castName(mon.cardId, skillIndex);
  const aimedMon = aimed ? [...foeField, ...you.field].find((unit) => unit?.uid === aimed) ?? null : null;
  const onto = aimedMon ? ` lên ${cardOf(aimedMon).name}` : "";
  if (isHell(mon.cardId) && !aimed) {
    return beginHold(state, { kind: "face", attacker: uid, skill: true }, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
  }
  if (isHarpy(mon.cardId)) {
    if ((mon.shed ?? []).includes("charm")) return note(state, "Mê hoặc đã biến mất.");
    if (!aimed) return note(state, "Chọn một quái đối thủ.");
    if (you.orb < harpyKit(mon.cardId).charm) return note(state, "Cần 1 mana.");
  }
  if (mon.cardId === "may-quay-thuong" && skillIndex === 1) {
    if (you.orb < 1) return note(state, "Cần 1 mana.");
    if (!aimed) return beginHold(state, { kind: "face", attacker: uid, skill: true }, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
  }
  if ((mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi") && !aimed) {
    return beginHold(state, { kind: "face", attacker: uid, skill: true }, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
  }
  if (mon.cardId === "rong-phun-hoa-cau" && skillIndex > 0 && !aimed) {
    return beginHold(state, { kind: "face", attacker: uid, skill: true }, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
  }
  if (mon.cardId === "sua-hut-ma-phap" && !aimed) {
    return beginHold(state, { kind: "face", attacker: uid, skill: true }, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
  }
  if (mon.cardId === TIDE && !aimed) {
    return beginHold(state, { kind: "face", attacker: uid, skill: true }, `${cardOf(mon).name} dùng ${skill} lên người chơi. Có thể chặn`);
  }
  if (mon.cardId === "loi-nguyen-cua-rong" && !aimed) return note(state, "Chọn một quái đối thủ.");
  if (mon.cardId === "cuc-bong-ma-quai" && skillIndex === 0 && !foeField.some((unit) => unit?.uid === aimed && unit.hp > 0)) return note(state, "Chọn một quái đối thủ.");
  if (mon.cardId === "phu-thuy-rung-den") {
    if (!aimed) return note(state, "Chọn một quái đối thủ.");
    const foeMon = foeField.find((unit) => unit?.uid === aimed && unit.hp > 0);
    if (!foeMon) return note(state, "Chọn một quái đối thủ.");
  }
  if (mon.cardId === QUEEN_KNIGHT) {
    if (!aimed) return note(state, "Chọn một quái đối thủ.");
    const foeMon = foeField.find((unit) => unit?.uid === aimed && unit.hp > 0);
    if (!foeMon) return note(state, "Chọn một quái đối thủ.");
    if (you.orb < queenSwing(mon).cost) return note(state, "Cần 1 mana.");
  }
  return beginHold(state, { kind: "beam", caster: uid, target: aimed, index: skillIndex, extra }, `${cardOf(mon).name} dùng ${skill}${onto}.`);
}

function castName(cardId: string, index: number): string {
  if (cardId === "kiem-si-lua-thieng") {
    if (index === 1) return chipLabel(cardId, "blood");
    if (index === 8) return "Đòn thêm";
    if (index === 9) return "Hoả thần long";
    return chipLabel(cardId, "fire");
  }
  if (cardId === "rong-phun-hoa-cau") return chipLabel(cardId, index > 0 ? "fire" : "peek");
  if (cardId === "phu-thuy-thoi-gian") return chipLabel(cardId, index >= 2 ? "all" : "age");
  if (cardId === "ga-he-dang-so") return chipLabel(cardId, index === 0 ? "charge" : "cast");
  if (cardId === "yeu-tinh-chuc-phuc") return chipLabel(cardId, index === 0 ? "aid" : "bless");
  if (cardId === "sau-non") return chipLabel(cardId, "cocoon");
  if (cardId === "ken-ngai") return chipLabel(cardId, "hatch");
  if (cardId === "phu-thuy-ti-hon" || cardId === "trieu-hoi-ac-ma") return chipLabel(cardId, "hex");
  if (cardId === "ong-khong-lo") return chipLabel(cardId, "stun");
  if (cardId === "mo-voi-ma-mut") return chipLabel(cardId, "burst");
  if (cardId === "ngai-khong-lo" || cardId === "ngai-nu-hoang" || cardId === "ngai-hoan-my") return chipLabel(cardId, "dust");
  if (cardId === "sua-hut-ma-phap") return chipLabel(cardId, "spit");
  if (cardId === TIDE) return chipLabel(cardId, "rage");
  if (cardId === SHADE) return chipLabel(cardId, "hide");
  if (cardId === "trai-tim-hai-long") {
    if (index >= 2) return "Đại thuỷ triều huỷ diệt";
    if (index === 1) return "Con nước lớn tàn phá";
    return chipLabel(cardId, "tide");
  }
  if (cardId === "mat-xanh-huy-diet") return "Tia sáng huỷ diệt";
  if (cardId === "mat-do-tan-pha") return "Cầu lửa địa ngục";
  if (cardId === "hoa-an-thit-nguoi") return chipLabel(cardId, "bite");
  if (cardId === PERFECT) {
    if (index === 2) return "Roi sấm";
    if (index === 3) return "Dụ dỗ";
    return "Gió xoáy";
  }
  if (isHarpy(cardId)) {
    if (index === 3) return "Dụ dỗ";
    return chipLabel(cardId, index === 1 ? "charm" : "gust");
  }
  if (cardId === "thuong-quan-long") return chipLabel(cardId, "spin");
  if (cardId === "may-nem-bom-hinh-nhen") return chipLabel(cardId, "bomb");
  if (cardId === "may-quay-thuong") return chipLabel(cardId, index === 1 ? "rage" : "reel");
  if (cardId === "rong-con" || cardId === "rong-ngan-tuoi") return chipLabel(cardId, "breath");
  if (cardId === "ma-dao-si") return chipLabel(cardId, "dan");
  if (cardId === "loi-nguyen-cua-rong") return chipLabel(cardId, "fire");
  if (cardId === "phu-thuy-rung-den") return chipLabel(cardId, "curse");
  if (cardId === "rong-ac-ma") return chipLabel(cardId, "orb");
  if (cardId === "cuc-bong-ma-quai") return chipLabel(cardId, index === 0 ? "boom" : "barrage");
  if (cardId === QUEEN_KNIGHT) return chipLabel(cardId, "sword");
  return monsterCard(cardId)?.name ?? "Kỹ năng";
}

function strikeName(mon: FieldMon): string {
  if (isHell(mon.cardId)) return castName(mon.cardId, 0);
  if (mon.gaze && !mon.horn) return "Tia sáng huỷ diệt";
  if (mon.horn) return "Sấm lôi phá";
  return castName(mon.cardId, 0);
}

function rebound(state: Duel, victimUid: string): Duel {
  const pending = state.pending;
  if (!pending) return note(state, "Không có đòn để phản.");
  const reactor = state.hold?.priority ?? ((1 - state.turn) as Side);
  const foeSide = (1 - reactor) as Side;
  const victim = state.players[foeSide].field.find((mon) => mon?.uid === victimUid) ?? null;
  if (!victim) return note(state, "Chọn một kẻ địch để phản đòn.");
  const casterUid = pending.kind === "beam" ? pending.caster : pending.kind === "face" || pending.kind === "melee" ? pending.attacker : "";
  const caster = state.players[0].field.find((mon) => mon?.uid === casterUid) ?? state.players[1].field.find((mon) => mon?.uid === casterUid) ?? null;
  if (pending.kind === "beam" && caster?.cardId === "ong-khong-lo") return note(state, "Lá chắn phản đòn không phản được đòn trói.");
  if (pending.kind === "beam" && !caster) return note(state, "Không còn quái thi triển.");
  if ((pending.kind === "face" || pending.kind === "melee") && !caster?.horn && !caster?.gaze && !isHell(caster?.cardId ?? "")) return note(state, "Không có đòn kỹ năng để phản.");
  if (pending.kind !== "beam" && pending.kind !== "face" && pending.kind !== "melee") return note(state, "Không có đòn kỹ năng để phản.");
  const index = pending.kind === "beam" ? pending.index : 0;
  const name = pending.kind === "beam" ? castName(caster!.cardId, index) : strikeName(caster!);
  return {
    ...note(state, `${name} bị phản vào ${cardOf(victim).name}.`),
    step: "respond",
    pending: { kind: "beam", caster: caster!.uid, target: victim.uid, index, back: true },
    hold: { priority: foeSide, passed: [false, false], blocker: null, blockerSkill: false, armed: null },
  };
}

function finishRebound(state: Duel): Duel {
  const pending = state.pending;
  if (!pending || pending.kind !== "beam" || !pending.back || !pending.target) return { ...state, step: "main", pending: null, hold: null };
  const caster = state.players[0].field.find((mon) => mon?.uid === pending.caster) ?? state.players[1].field.find((mon) => mon?.uid === pending.caster) ?? null;
  const victimSide = (state.players[0].field.some((mon) => mon?.uid === pending.target) ? 0 : 1) as Side;
  const victim = state.players[victimSide].field.find((mon) => mon?.uid === pending.target) ?? null;
  const clear = { ...state, step: "main" as const, pending: null, hold: null, echo: null, last: null };
  if (!caster || !victim) return clear;
  const ownerSide = (state.players[0].field.some((mon) => mon?.uid === caster.uid) ? 0 : 1) as Side;
  if (caster.cardId === QUEEN_KNIGHT) {
    const live = state.players[ownerSide].field.find((mon) => mon?.uid === caster.uid) ?? caster;
    return strikeQueenSword(clear, ownerSide, live, victimSide, victim);
  }
  if (caster.cardId === "ong-khong-lo") {
    let owner = state.players[ownerSide];
    const paid = payCost(owner, skillManaCost(caster.cardId, 1));
    if (!paid) return note(clear, "Không đủ mana để phản đòn.");
    owner = paid;
    const turns = grabNums(skillText(caster.cardId), /(\d+)\s*lượt/gi)[0] ?? 5;
    const stunAt = (mon: FieldMon) => (mon.uid === victim.uid ? { ...mon, stun: turns } : mon);
    let field = owner.field.map((mon) => (mon?.uid === caster.uid ? stunAt({ ...mon, dim: true }) : mon ? stunAt(mon) : mon));
    let next = patch(clear, ownerSide, { ...owner, field });
    if (ownerSide !== victimSide) {
      const them = state.players[victimSide];
      next = patch(next, victimSide, { ...them, field: them.field.map((mon) => (mon ? stunAt(mon) : mon)) });
    }
    return note(next, `${castName(caster.cardId, pending.index)} trong ${turns} lượt.`, "spell");
  }
  if (caster.cardId === "may-nem-bom-hinh-nhen") {
    const live = clear.players[ownerSide].field.find((unit) => unit?.uid === caster.uid) ?? caster;
    return rainBombs(clear, ownerSide, live, victim.uid);
  }
  let owner = state.players[ownerSide];
  if (isHell(caster.cardId)) {
    const cost = skillManaCost(caster.cardId, 1);
    const paid = payCost(owner, cost);
    if (!paid) return note(clear, "Không đủ mana để phản đòn.");
    const dimmed = { ...caster, dim: true };
    const field = paid.field.map((mon) => (mon?.uid === caster.uid ? dimmed : mon));
    return resolveHell(patch(clear, ownerSide, { ...paid, field }), dimmed, victim);
  }
  if (caster.cardId === "may-quay-thuong") {
    const paid = payCost(owner, 1);
    if (!paid) return note(clear, "Không đủ mana để phản đòn.");
    const amount = (caster.misses ?? 0) + 3;
    const dimmed = { ...caster, dim: true };
    let field = paid.field.map((mon) => (mon?.uid === caster.uid ? dimmed : mon));
    if (ownerSide === victimSide) field = field.map((mon) => (mon?.uid === victim.uid ? damageSpell(mon, amount, field, caster) : mon));
    let next = patch(clear, ownerSide, dropDead({ ...paid, field }));
    if (ownerSide !== victimSide) {
      const them = state.players[victimSide];
      next = patch(next, victimSide, dropDead({ ...them, field: them.field.map((mon) => (mon?.uid === victim.uid ? damageSpell(mon, amount, them.field, caster) : mon)) }));
    }
    return note(next, `${castName(caster.cardId, pending.index)} bị phản, gây ${spellLanded(victim, amount, ownerSide === victimSide ? field : state.players[victimSide].field, caster)} sát thương phép.`, "spell");
  }
  if (caster.cardId === "loi-nguyen-cua-rong") {
    const amount = grabNums(skillText(caster.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2;
    const paid = payCost(owner, skillManaCost(caster.cardId, 0));
    if (!paid) return note(clear, "Không đủ mana để phản đòn.");
    owner = paid;
    const blow = outgoing(caster, amount);
    let field = owner.field.map((mon) => (mon?.uid === caster.uid ? { ...mon, dim: true } : mon));
    const strike = (unit: FieldMon, allies: Array<FieldMon | null>) => trueDamage(unit.uid === caster.uid ? { ...unit, dim: true } : unit, blow, allies);
    let lost = 0;
    if (ownerSide === victimSide) {
      const current = field.find((mon) => mon?.uid === victim.uid) ?? victim;
      const hit = strike(current, field);
      lost = Math.max(0, current.hp - hit.hp);
      field = field.map((mon) => (mon?.uid === victim.uid ? hit : mon));
    }
    let next = patch(clear, ownerSide, dropDead({ ...owner, field }));
    if (ownerSide !== victimSide) {
      const them = state.players[victimSide];
      const current = them.field.find((mon) => mon?.uid === victim.uid) ?? victim;
      const hit = strike(current, them.field);
      lost = Math.max(0, current.hp - hit.hp);
      next = patch(next, victimSide, dropDead({ ...them, field: them.field.map((mon) => (mon?.uid === victim.uid ? hit : mon)) }));
    }
    return note(next, `${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(victim).name}, gây ${lost} sát thương chuẩn.`, "hit");
  }
  if (caster.gaze && !caster.horn) {
    const amount = outgoing(caster, liveAtk(caster));
    const field = owner.field.map((mon) => {
      if (!mon) return mon;
      if (mon.uid === caster.uid) {
        const spent = { ...mon, dim: true, gaze: undefined };
        return mon.uid === victim.uid ? landTrue(spent, amount, owner.field).mon : spent;
      }
      return mon.uid === victim.uid ? landTrue(mon, amount, owner.field).mon : mon;
    });
    const landed = ownerSide === victimSide ? field : state.players[victimSide].field.map((mon) => (mon?.uid === victim.uid ? landTrue(mon, amount, state.players[victimSide].field).mon : mon));
    let next = ownerSide === victimSide ? patch(clear, ownerSide, dropDead({ ...owner, field })) : patch(clear, ownerSide, { ...owner, field });
    if (ownerSide !== victimSide) next = patch(next, victimSide, dropDead({ ...state.players[victimSide], field: landed }));
    const allies = ownerSide === victimSide ? owner.field : state.players[victimSide].field;
    return note(next, `${strikeName(caster)} bị phản vào ${cardOf(victim).name}, gây ${truLanded(victim, amount, allies)} sát thương chuẩn.`, "spell");
  }
  if (caster.horn) {
    const atk = liveAtk(caster);
    const amount = outgoing(caster, caster.horn === "plus" ? Math.min(8, atk) : caster.horn === "splash" ? Math.min(4, atk) : atk);
    const field = owner.field.map((mon) => {
      if (!mon) return mon;
      if (mon.uid === caster.uid) {
        const spent = { ...mon, dim: true, gaze: undefined, horn: mon.horn === "plain" || !mon.horn ? mon.horn : ("plain" as const) };
        return mon.uid === victim.uid ? damageSpell(spent, amount, owner.field) : spent;
      }
      return mon.uid === victim.uid ? damageSpell(mon, amount, owner.field) : mon;
    });
    const landed = ownerSide === victimSide ? field : state.players[victimSide].field.map((mon) => (mon?.uid === victim.uid ? damageSpell(mon, amount, state.players[victimSide].field) : mon));
    let next = ownerSide === victimSide ? patch(clear, ownerSide, dropDead({ ...owner, field })) : patch(clear, ownerSide, { ...owner, field });
    if (ownerSide !== victimSide) next = patch(next, victimSide, dropDead({ ...state.players[victimSide], field: landed }));
    return note(next, `${strikeName(caster)} bị phản vào ${cardOf(victim).name}, gây ${spellLanded(victim, amount, ownerSide === victimSide ? owner.field : state.players[victimSide].field, null)} sát thương phép.`, "spell");
  }
  let body = { ...caster, dim: true };
  const blood = caster.cardId === "kiem-si-lua-thieng" && pending.index !== 0;
  if (blood) {
    const bites = grabNums(skillText(caster.cardId), /tiêu(?:\s*hao)?\s*(\d+)\s*máu/gi);
    const bite = bites[pending.index === 8 ? 1 : 0] ?? 2;
    if (caster.hp <= bite) return note(clear, "Không đủ máu để phản đòn.");
    body = { ...caster, hp: caster.hp - bite, dim: true };
  } else {
    const cost = caster.cardId === "rong-phun-hoa-cau" && pending.index > 0 ? 1 : skillManaCost(caster.cardId, 0);
    const paid = payCost(owner, cost);
    if (!paid) return note(clear, "Không đủ mana để phản đòn.");
    owner = paid;
  }
  const amount = skillFigure(caster.cardId, "dmg", 0, pending.index === 8 ? 2 : pending.index);
  let field = owner.field.map((mon) => (mon?.uid === body.uid ? body : mon));
  if (amount > 0 && ownerSide === victimSide) {
    const current = field.find((mon) => mon?.uid === victim.uid) ?? victim;
    field = field.map((mon) => (mon?.uid === victim.uid ? damageSpell(current, amount, field, caster) : mon));
  }
  let next = patch(clear, ownerSide, dropDead({ ...owner, field }));
  if (amount > 0 && ownerSide !== victimSide) {
    const them = state.players[victimSide];
    const foeField = them.field.map((mon) => (mon?.uid === victim.uid ? damageSpell(mon, amount, them.field, caster) : mon));
    next = patch(next, victimSide, dropDead({ ...them, field: foeField }));
  }
  return note(
    next,
    amount > 0
      ? `${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(victim).name}, gây ${spellLanded(victim, amount, ownerSide === victimSide ? field : state.players[victimSide].field, caster)} sát thương phép.`
      : `${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(victim).name}.`,
    "spell",
  );
}

function chargedWhip(state: Duel) {
  const pending = state.pending;
  if (pending?.kind !== "melee" && pending?.kind !== "face") return null;
  for (const side of [0, 1] as const) {
    const mon = state.players[side].field.find((unit) => unit?.uid === pending.attacker) ?? null;
    if (mon?.bolt) return { side, mon };
  }
  return null;
}

export function castSpell(state: Duel, handIndex: number, targetUid: string | null = null, replay = false, sourceUid: string | null = null): Duel {
  const next = castSpellCore(state, handIndex, targetUid, replay, sourceUid);
  if (replay || next === state) return next;
  const side = (state.step === "main" ? state.turn : (state.hold?.priority ?? ((1 - state.turn) as Side))) as Side;
  const cardId = state.players[side].hand[handIndex] ?? null;
  const held = next.pending?.kind === "spell" && next.pending.cardId === cardId;
  const removed = cardId !== null && handCopies(state.players[side].hand, cardId) > handCopies(next.players[side].hand, cardId);
  const ok = held || removed;
  if (!ok && next.upkeep && !state.upkeep && next.players === state.players) return next;
  const marked = traced(state, next, {
    kind: "spell",
    actor: side,
    ok,
    cardId,
    target: targetUid ? monsterTarget(state, targetUid) : null,
    end: null,
  });
  const reflect = Boolean(state.pending && "back" in state.pending && state.pending.back);
  return withResults(state, marked, { blocked: Boolean(state.hold?.blocker), reflect, turn: false });
}

function castSpellCore(state: Duel, handIndex: number, targetUid: string | null = null, replay = false, sourceUid: string | null = null): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.winner || (state.step !== "main" && state.step !== "respond")) return state;
  if (!replay && state.step === "main") {
    const waiting = needUpkeep(state);
    if (waiting) return waiting;
  }
  const side = (replay || state.step === "main" ? state.turn : (state.hold?.priority ?? ((1 - state.turn) as Side))) as Side;
  const foe = (1 - side) as Side;
  const player = state.players[side];
  const cardId = player.hand[handIndex];
  const card = cardId ? spellCard(cardId) : undefined;
  if (!card) return state;
  if (card.id === "ke-dao-mo") return state;
  if (card.env) return note(state, "Lá môi trường đã nằm trên sân.");
  const response = new Set([
    "guong-phong-ho",
    "la-chan-phan-don",
    "vong-xoay-bao-ho",
    "vong-nguyen-rua-ac-ma",
    "phuc-kich",
    "hoan-doi",
    "hap-thu-ma-phap",
    "ngan-chan-phong-ngu",
    "virus-an-mon",
    "co-may-thoi-gian",
    "giap-co-khi",
  ]);
  if (!replay && card.id === "hoan-doi") {
    if (!canCastSwap(state, side)) {
      return note(state, swapRows(player).length < 2 ? "Không đủ quái để hoán đổi." : "Hoán đổi chỉ dùng khi có quái bị nhắm.");
    }
  }
  if (!replay && card.id === "hap-thu-ma-phap" && state.pending?.kind !== "spell" && state.pending?.kind !== "lash" && !chargedWhip(state)) {
    return note(state, "Chỉ hấp thu được lá phép đang thi triển.");
  }
  if (!replay && card.id === "virus-an-mon") {
    if (state.step !== "respond" || !watchedOneStar(state, side)) return note(state, "Virus ăn mòn chỉ dùng khi quái 1 sao đồng minh bị nhắm.");
  }
  if (!replay && card.id === "co-may-thoi-gian") {
    const ally = targetUid ? player.field.find((mon) => mon?.uid === targetUid) ?? null : null;
    if (state.step !== "respond" || !ally || !(state.past?.[ally.uid] ?? state.born?.[ally.uid])) {
      return note(state, "Cỗ máy thời gian chỉ dùng khi đồng minh đang bị nhắm.");
    }
  }
  if (!replay && card.id === "giap-co-khi") {
    const pending = state.pending;
    const ally = targetUid ? player.field.find((mon) => mon?.uid === targetUid) ?? null : null;
    const casterUid = pending?.kind === "beam" ? pending.caster : "";
    const caster = state.players[0].field.find((mon) => mon?.uid === casterUid) ?? state.players[1].field.find((mon) => mon?.uid === casterUid) ?? null;
    const foeCaster = Boolean(caster && !player.field.some((mon) => mon?.uid === caster.uid));
    if (state.step !== "respond" || pending?.kind !== "beam" || !pending.target || pending.target !== ally?.uid || !foeCaster) {
      return note(state, "Giáp cơ khí chỉ dùng khi kỹ năng đối phương nhắm một đồng minh.");
    }
  }
  if (!replay && card.id === "mu-ma-phap" && !player.field.some((mon) => mon && mon.cardId !== "mu")) {
    return note(state, "Cần có quái trên sân.");
  }
  if (!replay && card.id === "la-chan-phan-don") {
    const pending = state.pending;
    const attacker = pending && (pending.kind === "face" || pending.kind === "melee")
      ? state.players[state.turn].field.find((mon) => mon?.uid === pending.attacker)
      : null;
    const horn = Boolean(attacker?.horn || attacker?.gaze);
    if (pending?.kind === "beam") {
      const caster = state.players[0].field.find((mon) => mon?.uid === pending.caster) ?? state.players[1].field.find((mon) => mon?.uid === pending.caster);
      if (caster?.cardId === "ong-khong-lo") return note(state, "Lá chắn phản đòn không phản được đòn trói.");
    }
    if (pending?.kind !== "beam" && !horn) return note(state, "Chỉ phản được đòn kỹ năng.");
    const reactor = state.hold?.priority ?? ((1 - state.turn) as Side);
    const foeSide = (1 - reactor) as Side;
    if (!targetUid || !state.players[foeSide].field.some((mon) => mon?.uid === targetUid)) {
      return note(state, "Chọn một kẻ địch để phản đòn.");
    }
  }
  if (!replay && state.step === "respond" && !response.has(card.id)) return note(state, "Phép này không ứng biến được.");
  if (!replay && state.step === "main" && !canTargetFoe(state) && card.id !== "mua-ma-thuat" && card.id !== "thu-hoi-quai-thu" && card.id !== "sung-loi-pha" && card.id !== "mu-ma-phap") {
    return note(state, "Lượt đầu không được nhắm đối thủ.");
  }
  if (card.id === "sung-loi-pha") {
    const picked = targetUid
      ? player.field.find((mon) => mon?.uid === targetUid) ?? null
      : player.field.find((mon) => mon && hornFit(mon.cardId)) ?? null;
    if (!picked || !hornFit(picked.cardId)) return note(state, "Sừng không gắn dạng người, thiên thần hay thiên sứ.");
    targetUid = picked.uid;
  }
  if (card.id === "soi-xich-dia-nguc") {
    const foeSide = (1 - side) as Side;
    const picked = targetUid
      ? state.players[foeSide].field.find((mon) => mon?.uid === targetUid) ?? null
      : state.players[foeSide].field.find((mon) => mon) ?? null;
    if (!picked || (targetUid && picked.uid !== targetUid)) return note(state, "Chọn một quái đối thủ.");
    targetUid = picked.uid;
  }
  let spellSource: string | null = null;
  if (card.id === "phan-nguyen") {
    const foeSide = (1 - side) as Side;
    const ally = sourceUid
      ? player.field.find((mon) => mon?.uid === sourceUid) ?? null
      : player.field.find((mon) => mon && harmShift(mon)) ?? null;
    const picked = targetUid
      ? state.players[foeSide].field.find((mon) => mon?.uid === targetUid) ?? null
      : !sourceUid
        ? state.players[foeSide].field.find((mon) => mon) ?? null
        : null;
    if (!ally || !harmShift(ally)) return note(state, "Chọn đồng minh đang mang trạng thái xấu.");
    if (!picked) return note(state, "Chọn quái đối thủ để chuyển trạng thái.");
    spellSource = ally.uid;
    targetUid = picked.uid;
  }
  if (!replay && card.id === "vong-nguyen-rua-ac-ma") {
    const pending = state.pending;
    const swing = pending?.kind === "face" || pending?.kind === "melee";
    const shot = pending?.kind === "beam" || pending?.kind === "gnaw-skill";
    if (state.step !== "respond" || !pending || (!swing && !shot)) {
      return note(state, "Vòng nguyền chỉ chặn đòn đánh hoặc skill gây sát thương.");
    }
    const uid = swing && "attacker" in pending ? pending.attacker : "caster" in pending ? pending.caster : "";
    const ownerSide = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
    const attacker = state.players[ownerSide].field.find((mon) => mon?.uid === uid) ?? null;
    if (!attacker) return note(state, "Không có quái để nguyền.");
    if (shot && !harmSkill(attacker.cardId, "index" in pending ? pending.index : 0)) {
      return note(state, "Vòng nguyền chỉ chặn skill gây sát thương.");
    }
  }
  let next = state;
  if (!replay) {
    const before = player.stars;
    const tolled = Boolean(player.tolls?.[handIndex]);
    const bill = playBill(card.gems, tolled, player.orb, player.flask);
    if (bill) return note(state, bill);
    const paid = payPlayed(player, card.gems, tolled);
    if (!paid) return note(state, bill ?? `Cần ${card.gems} gem.`);
    const dropped = dropHandCard(paid, handIndex);
    const buried = { ...dropped, spent: [...(dropped.spent ?? paid.spent ?? []), card.id] };
    next = pingStars(patch(state, side, buried), side, before, buried.stars);
    const burst = new Set(["mua-ma-thuat", "hap-thu-ma-phap", "vong-xoay-bao-ho", "thu-hoi-quai-thu"]);
    if (card.id === "vong-nguyen-rua-ac-ma" && state.step === "respond" && state.pending) {
      const pending = state.pending;
      const uid = pending.kind === "face" || pending.kind === "melee" ? pending.attacker : pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.caster : "";
      return {
        ...note(next, `${card.name} đang thi triển.`),
        step: "respond",
        pending: { kind: "spell", owner: side, cardId: card.id, target: null, source: uid },
        hold: { priority: (1 - side) as Side, passed: [false, false], blocker: null, blockerSkill: false, armed: null },
      };
    }
    if (state.step === "main" && !response.has(card.id) && card.id !== "sung-loi-pha" && !burst.has(card.id)) {
      return beginHold(next, { kind: "spell", owner: side, cardId: card.id, target: targetUid, source: spellSource }, `${card.name} đang thi triển.`);
    }
  } else {
    next = patch(state, side, dropHandCard(player, handIndex));
  }
  if (targetUid) targetUid = redirectCover(next.players[foe].field, targetUid);
  const enemy = next.players[foe];
  const foeMon = targetUid ? enemy.field.find((mon) => mon?.uid === targetUid) ?? null : enemy.field.find((mon) => mon) ?? null;

  if (card.id === "sam-set-tan-the") {
    const amount = 2 + next.players[side].stars;
    const living = next.players[foe].field.filter((mon): mon is FieldMon => Boolean(mon && mon.hp > 0));
    const rows = living.map((mon) => ({ name: cardOf(mon).name, bits: `${shownTru(mon, amount, next.players[foe].field)} sát thương chuẩn` }));
    const field = next.players[foe].field.map((mon) => (mon ? trueDamage(mon, amount, next.players[foe].field) : mon));
    const struck = patch(next, foe, dropDead({ ...next.players[foe], field }));
    const line = aimNotice("Sấm sét tận thế", rows) ?? `Sấm sét tận thế gây ${rows[0]?.bits ?? `${amount} sát thương chuẩn`} lên tất cả kẻ địch.`;
    return note(struck, line, "spell");
  }
  if (card.id === "mua-ma-thuat") {
    const amount = spellFigure("mua-ma-thuat", "heal", 2);
    const wash = (mon: FieldMon): FieldMon => {
      const cap = mon.maxHp || mon.hp;
      return {
        ...mon,
        hp: Math.min(cap, mon.hp + amount),
        stun: 0,
        bleed: 0,
        curse: false,
        noBlock: false,
        vulnerable: 0,
        chain: 0,
        gag: 0,
        poison: undefined,
        erode: undefined,
        wet: mon.wet && mon.wet >= 90 ? mon.wet : undefined,
      };
    };
    const rained = patch(next, side, { ...next.players[side], field: next.players[side].field.map((mon) => (mon ? wash(mon) : mon)) });
    return note(rained, `Mưa ma thuật hồi ${amount + charmDamage} máu và gỡ hết trạng thái xấu`, "heal");
  }
  if (card.id === "mu-ma-phap") {
    const you = next.players[side];
    if (!you.field.some((mon) => mon && mon.cardId !== "mu")) return note(next, "Cần có quái trên sân.");
    const field = [...you.field] as Player["field"];
    let n = 0;
    for (let i = 0; i < 3; i += 1) {
      if (!field[i]) field[i] = makeHat(next.seq + n + 1, side, n++);
    }
    return note(patch(next, side, { ...you, field, hats: true }), "Mũ ma pháp che sân.", "spell");
  }
  if (card.id === "thanh-guom-anh-sang") {
    const turns = grabNums(spellText("thanh-guom-anh-sang"), /(\d+)\s*lượt/gi)[0] ?? 5;
    const open = (mon: FieldMon | null, gag: number) => (mon ? { ...mon, gag, shown: isSea(mon.cardId) ? turns : mon.shown } : mon);
    const foeField = enemy.field.map((mon) => open(mon, turns));
    let marked = patch(next, foe, { ...enemy, field: foeField });
    const yourField = marked.players[side].field.map((mon) => (mon && isSea(mon.cardId) ? { ...mon, shown: turns } : mon));
    marked = patch(marked, side, { ...marked.players[side], field: yourField });
    return note(marked, `Thanh gươm ánh sáng cấm các quái đang có mặt tấn công ${turns} lượt và hiện mọi quái ẩn.`, "spell");
  }
  if (card.id === "guong-phong-ho") {
    const armed = patch(next, side, { ...next.players[side], mirror: 3 });
    const pending = state.pending;
    const swing = state.step === "respond" && pending && (pending.kind === "melee" || pending.kind === "face");
    const attackerUid = swing && "attacker" in pending ? pending.attacker : "";
    const attackerSide = state.turn;
    const you = armed.players[attackerSide];
    const attacker = attackerUid ? you.field.find((mon) => mon?.uid === attackerUid) ?? null : null;
    if (!attacker) return note(armed, "Gương phòng hộ dựng lên trong 3 lượt.", "spell");
    const plain = dropClash(openShade(attacker));
    const robbed = {
      ...plain,
      atk: Math.floor(plain.atk / 2),
      def: Math.floor(plain.def / 2),
      mdef: Math.floor(plain.mdef / 2),
      hp: Math.max(1, Math.floor(plain.hp / 2)),
      dim: true,
      glass: true,
    };
    const robbedState = patch(armed, attackerSide, {
      ...you,
      field: you.field.map((mon) => (mon?.uid === attacker.uid ? robbed : mon)),
    });
    const line = pending?.kind === "melee"
      ? "Gương phòng hộ chặn giáp lá cà và cướp một nửa chỉ số."
      : "Gương phòng hộ chặn đòn và cướp một nửa chỉ số.";
    return tideSwing(releaseLegend({
      ...note(robbedState, line, "spell"),
      step: "main",
      pending: null,
      hold: null,
    }), side, attacker.uid);
  }
  if (card.id === "soi-xich-dia-nguc") {
    if (!foeMon) return note(next, "Không có quái để xiềng.");
    const field = enemy.field.map((mon) => (mon?.uid === foeMon.uid ? { ...mon, chain: 2, def: 0, mdef: 0 } : mon));
    let marked = note(patch(next, foe, { ...enemy, field }), `Sợi xích địa ngục khống chế ${cardOf(foeMon).name} và đưa phòng ngự về 0.`, "spell");
    if (marked.hold?.blocker === foeMon.uid) {
      marked = { ...marked, hold: { ...marked.hold, blocker: null, blockerSkill: false, armed: null } };
    }
    return marked.step === "respond" ? keep(marked) : marked;
  }
  if (card.id === "vong-nguyen-rua-ac-ma") {
    const pending = state.pending;
    const swing = pending?.kind === "face" || pending?.kind === "melee";
    const shot = pending?.kind === "beam" || pending?.kind === "gnaw-skill";
    const uid = swing && pending && "attacker" in pending ? pending.attacker : shot && pending && "caster" in pending ? pending.caster : sourceUid ?? "";
    if (!replay && (state.step !== "respond" || !pending || (!swing && !shot))) {
      return note(next, "Vòng nguyền chỉ chặn đòn đánh hoặc skill gây sát thương.");
    }
    const ownerSide = (next.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
    const attacker = next.players[ownerSide].field.find((mon) => mon?.uid === uid) ?? null;
    if (!attacker) return note(next, "Không có quái để nguyền.");
    if (shot && pending && "index" in pending && !harmSkill(attacker.cardId, pending.index)) {
      return note(next, "Vòng nguyền chỉ chặn skill gây sát thương.");
    }
    const field = next.players[ownerSide].field.map((mon) => (mon?.uid === attacker.uid ? { ...mon, curse: true, dim: true } : mon));
    return releaseLegend(note(
      { ...patch(next, ownerSide, { ...next.players[ownerSide], field }), step: "main", pending: null, hold: null },
      `${cardOf(attacker).name} bị chặn và nguyền. Sát thương còn một nửa.`,
      "spell",
    ));
  }
  if (card.id === "sung-loi-pha") {
    const ally = next.players[side].field.find((mon) => mon?.uid === targetUid) ?? null;
    if (!ally || !hornFit(ally.cardId)) return state;
    const field = next.players[side].field.map((mon) => (mon?.uid === ally.uid ? { ...mon, horn: "plain" as const, hornNew: true } : mon));
    return note(patch(next, side, { ...next.players[side], field }), `${cardOf(ally).name} mang Sừng lôi phá. Đòn đánh thành sát thương phép.`, "info");
  }
  if (card.id === "bien-sau") {
    const field = next.players[side].field.map((mon) => (mon && isSea(mon.cardId) ? { ...mon, wet: 99 } : mon));
    return note(patch(next, side, shuffleSea({ ...next.players[side], sea: true, field })), "Biển sâu nuốt quái biển. Đối thủ không thấy chỉ số", "spell");
  }
  if (card.id === "co-may-thoi-gian") {
    const ally = targetUid ? next.players[side].field.find((mon) => mon?.uid === targetUid) ?? null : null;
    if (!ally) return note(next, "Không có đồng minh đang bị nhắm.");
    const stamp = turnStamp(next, ally.uid);
    const rewound = rewindAlly(next, side, ally.uid);
    if (!rewound || !stamp) return note(next, "Không có trạng thái trước.");
    return keep(note(rewound, `Cỗ máy thời gian đưa ${cardOf(stamp.mon).name} về ${stamp.born ? "trạng thái lúc vừa triệu hồi" : "trạng thái đầu 3 lượt chung trước"}.`, "spell"));
  }
  if (card.id === "giap-co-khi") {
    const pending = state.pending;
    const ally = targetUid ? next.players[side].field.find((mon) => mon?.uid === targetUid) ?? null : null;
    const casterUid = pending?.kind === "beam" ? pending.caster : "";
    const caster = next.players[0].field.find((mon) => mon?.uid === casterUid) ?? next.players[1].field.find((mon) => mon?.uid === casterUid) ?? null;
    if (!ally || !caster || pending?.kind !== "beam") return note(next, "Giáp cơ khí chỉ dùng khi kỹ năng đối phương nhắm một đồng minh.");
    const atkPlus = grabNums(card.effect, /(\d+)\s*công/gi)[0] ?? 2;
    const mdefPlus = grabNums(card.effect, /(\d+)\s*thủ phép/gi)[0] ?? 2;
    const buffed = { ...ally, atk: ally.atk + atkPlus, mdef: ally.mdef + mdefPlus, raised: markRaised(ally, { atk: atkPlus, mdef: mdefPlus }) };
    const field = next.players[side].field.map((mon) => (mon?.uid === ally.uid ? buffed : mon));
    const plated = patch(next, side, { ...next.players[side], field });
    const threat = skillThreat(caster.cardId, pending.index);
    const base = `Giáp cơ khí tăng ${atkPlus} công và ${mdefPlus} thủ phép cho ${cardOf(ally).name}.`;
    if (liveAtk(buffed) <= threat) return keep(note(plated, base, "spell"));
    const casterSide = (plated.players[0].field.some((mon) => mon?.uid === caster.uid) ? 0 : 1) as Side;
    return {
      ...note(plated, `${base} ${castName(caster.cardId, pending.index)} bị phản vào ${cardOf(caster).name}.`, "spell"),
      step: "respond",
      pending: { kind: "beam", caster: caster.uid, target: caster.uid, index: pending.index, back: true },
      hold: { priority: casterSide, passed: [false, false], blocker: null, blockerSkill: false, armed: null },
    };
  }
  if (card.id === "hap-thu-ma-phap") {
    if (state.pending?.kind === "lash") {
      return note({ ...next, step: "main", pending: null, hold: null }, "Hấp thụ ma pháp nuốt Roi điện.", "spell");
    }
    const whip = chargedWhip(state);
    if (whip) {
      const owner = next.players[whip.side];
      const field = owner.field.map((unit) => (unit?.uid === whip.mon.uid ? { ...unit, bolt: undefined } : unit));
      return note(patch({ ...next, step: "main", pending: null, hold: null }, whip.side, { ...owner, field }), "Hấp thụ ma pháp nuốt Roi sấm.", "spell");
    }
    if (state.pending?.kind !== "spell") return note(next, "Chỉ hấp thu được lá phép đang thi triển.");
    const eaten = spellCard(state.pending.cardId)?.name ?? state.pending.cardId;
    return note({ ...next, step: "main", pending: null, hold: null }, `Hấp thụ ma pháp nuốt ${eaten}.`, "spell");
  }
  if (card.id === "phan-nguyen") {
    const ally = next.players[side].field.find((mon) => mon?.uid === spellSource) ?? null;
    if (!ally || !foeMon || !harmShift(ally)) return state;
    const moved = freshHarm(ally);
    const mine = next.players[side].field.map((mon) => (mon?.uid === ally.uid ? clearHarm(mon) : mon));
    const theirs = enemy.field.map((mon) => (mon?.uid === foeMon.uid ? { ...mon, ...moved } : mon));
    let shifted = patch(next, side, { ...next.players[side], field: mine });
    shifted = patch(shifted, foe, { ...enemy, field: theirs });
    return note(shifted, `Phản nguyền chuyển trạng thái xấu từ ${cardOf(ally).name} sang ${cardOf(foeMon).name}.`, "spell");
  }
  if (card.id === "phuc-kich") {
    const pending = state.pending;
    if (state.step !== "respond" || !pending || (pending.kind !== "face" && pending.kind !== "melee")) return note(next, "Phục kích chỉ dùng khi bị tấn công.");
    const ready = next.players[side].field.filter((mon) => mon && mon.stun === 0 && (mon.chain ?? 0) === 0 && mon.cardId !== "chan-ken" && mon.cardId !== "ken-ngai" && mon.cardId !== "hoa-an-thit-nguoi");
    const fighter = targetUid ? ready.find((mon) => mon?.uid === targetUid) ?? null : null;
    const attacker = next.players[foe].field.find((mon) => mon?.uid === pending.attacker) ?? null;
    if (!fighter || !attacker) return note(next, "Chọn quái để phục kích.");
    const bonus = spellFigure("phuc-kich", "atk", 2);
    const raw = fighter.atk + bonus;
    const body = openShade(attacker);
    const ambush = body.cardId === "chien-binh-rong" ? takePhysical(body, raw, next.players[foe].field) : null;
    const dealt = ambush ? Math.max(0, body.hp - ambush.mon.hp) : physical(raw, body.def);
    const foeField = next.players[foe].field.map((mon) =>
      mon?.uid === attacker.uid ? (ambush ? { ...ambush.mon, dim: true } : { ...body, hp: body.hp - dealt, dim: true }) : mon,
    );
    const myField = next.players[side].field.map((mon) =>
      mon?.uid === fighter.uid ? { ...mon, dim: true } : mon,
    );
    let hit = patch(next, foe, dropDead({ ...next.players[foe], field: foeField }));
    hit = patch(hit, side, { ...hit.players[side], field: myField });
    return releaseLegend({
      ...note(
        hit,
        actNotice("Phục kích", ["chặn đòn tấn công", `đánh thường lên ${cardOf(attacker).name}, gây ${dealt} máu và không bị phản đòn`]),
        "hit",
      ),
      step: "main",
      pending: null,
    });
  }
  if (card.id === "hoan-doi") {
    if (state.step !== "respond" || !state.pending) return note(next, "Hoán đổi chỉ dùng khi có quái bị nhắm.");
    return { ...next, swap: { first: lockedSwapToken(next, side), side, locked: lockedSwapToken(next, side) } };
  }
  if (card.id === "virus-an-mon") {
    if (state.step !== "respond") return note(next, "Virus ăn mòn chỉ dùng khi quái 1 sao bị nhắm.");
    const marked = watchedOneStar(next, side);
    if (!marked) return note(next, "Chỉ theo dõi được quái 1 sao đồng minh đang bị nhắm.");
    return note({ ...next, virusArm: { owner: side, uid: marked.uid } }, `Virus ăn mòn theo dõi ${cardOf(marked).name}. Nếu nó bị tiêu diệt, virus sẽ ăn mòn đối thủ.`, "info");
  }
  if (card.id === "vong-xoay-bao-ho") {
    if (state.step !== "respond") return note(next, "Vòng xoáy chỉ dùng khi đang bị tấn công.");
    return endTurn({ ...note(next, "Vòng xoáy bảo hộ chặn đòn và kết thúc lượt.", "spell"), step: "main", pending: null });
  }
  if (card.id === "ngan-chan-phong-ngu") {
    if (!foeMon) return note(next, "Không có quái để chặn phòng ngự.");
    const field = enemy.field.map((mon) => (mon?.uid === foeMon.uid ? { ...mon, noBlock: true } : mon));
    let marked = note(patch(next, foe, { ...enemy, field }), `${cardOf(foeMon).name} không được chặn trong lượt này.`, "spell");
    if (marked.hold?.blocker === foeMon.uid) {
      marked = { ...marked, hold: { ...marked.hold, blocker: null, blockerSkill: false, armed: null } };
    }
    return keep(marked);
  }
  if (card.id === "la-chan-phan-don") {
    if (!targetUid) return note(next, "Chọn một kẻ địch để phản đòn.");
    return rebound(next, targetUid);
  }
  if (card.id === "thu-hoi-quai-thu") {
    const owner = next.players[side];
    const fieldKept = owner.field.flatMap((mon) => (mon && keptField(mon) ? [pileFromField(mon)] : []));
    const reserveKept = owner.reserve.filter((pile) => keptPile(pile));
    const caps = fieldKept.map((pile) => cardStars(pile.id, pile.saved?.level ?? 1));
    const backMonsters = [...owner.monsterDeck, ...reserveKept, ...fieldKept];
    const monsterDeck = shuffle(backMonsters);
    const reserve = monsterDeck.splice(0, fieldKept.length + reserveKept.length);
    const deckTax = owner.spellTax ?? [];
    const pairs = [
      ...owner.spellDeck.map((id, index) => ({ id, tax: Boolean(deckTax[index]) })),
      ...owner.hand.map((id, index) => ({ id, tax: Boolean(handTolls(owner)[index]) })),
    ];
    const mixed = shuffle(pairs);
    const handPairs = mixed.splice(0, owner.hand.length);
    const recalled = {
      ...owner,
      field: [null, null, null] as Player["field"],
      reserve,
      hand: handPairs.map((row) => row.id),
      tolls: handPairs.map((row) => row.tax),
      monsterDeck,
      spellDeck: mixed.map((row) => row.id),
      spellTax: mixed.map((row) => row.tax),
    };
    const marked = patch(next, side, recalled);
    const line = "Thu hồi quái và phép.";
    if (caps.length === 0) return note(marked, line, "spell");
    return note({ ...marked, recall: { side, caps } }, line, "spell");
  }
  return note(next, `${card.name} đã trả gem. Hiệu ứng đặc biệt chưa gắn hết.`, "spell");
}

function aimedId(state: Duel): string | null {
  const pending = state.pending;
  if (pending?.kind === "melee" || pending?.kind === "gnaw") return state.hold?.blocker ?? pending.defender;
  if (pending?.kind === "face") return state.hold?.blocker ?? null;
  if (pending?.kind === "beam" || pending?.kind === "gnaw-skill" || pending?.kind === "spell") return pending.target ?? state.hold?.blocker ?? null;
  return state.hold?.blocker ?? null;
}

function redirectAim(state: Duel, fromUid: string | null, toUid: string | null): Duel {
  if (!fromUid || !toUid || fromUid === toUid) return state;
  const pending = state.pending;
  let nextPending = pending;
  if (pending && (pending.kind === "melee" || pending.kind === "gnaw") && pending.defender === fromUid) nextPending = { ...pending, defender: toUid };
  if (pending && (pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") && pending.target === fromUid) nextPending = { ...pending, target: toUid };
  const hold = state.hold?.blocker === fromUid && state.hold ? { ...state.hold, blocker: toUid } : state.hold;
  return { ...state, pending: nextPending, hold };
}
function swapToken(player: Player, token: string): { kind: "field"; uid: string } | { kind: "reserve"; index: number } | null {
  if (token.startsWith("f:")) {
    const uid = token.slice(2);
    return player.field.some((mon) => mon?.uid === uid) ? { kind: "field", uid } : null;
  }
  if (token.startsWith("r:")) {
    const index = Number(token.slice(2));
    return Number.isInteger(index) && player.reserve[index] ? { kind: "reserve", index } : null;
  }
  return null;
}

function canBring(player: Player, cardId: string) {
  const card = monsterCard(cardId);
  if (!card || card.stars === 0) return false;
  if (cardId === "trieu-hoi-ac-ma") return player.stars >= 3;
  return player.stars >= card.stars;
}

function demonGate(player: Player, held: PileMon): { player: Player; fresh: boolean } | string {
  if (held.id !== "trieu-hoi-ac-ma") return { player, fresh: false };
  if (player.stars < 3) return "Cần ít nhất 3 sao.";
  if (player.stars !== 3 || held.saved?.seen) return { player, fresh: false };
  const paid = pay(player, 1);
  if (!paid) return "Cần 1 mana để ra sân.";
  return { player: paid, fresh: true };
}

function swapRows(player: Player): string[] {
  const tokens: string[] = [];
  for (const unit of player.field) {
    if (unit && !unit.copy && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai") tokens.push(`f:${unit.uid}`);
  }
  player.reserve.forEach((card, index) => {
    if (canBring(player, card.id)) tokens.push(`r:${index}`);
  });
  return tokens;
}

function lockedSwapToken(state: Duel, side: Side): string | null {
  const uid = aimedId(state);
  if (!uid) return null;
  const mon = state.players[side].field.find((unit) => unit?.uid === uid);
  if (!mon || mon.copy || mon.cardId === "chan-ken" || mon.cardId === "ken-ngai") return null;
  return `f:${uid}`;
}

export function canCastSwap(state: Duel, side: Side): boolean {
  if (state.step !== "respond" || !state.pending) return false;
  const rows = swapRows(state.players[side]);
  const locked = lockedSwapToken(state, side);
  if (!locked) return rows.length >= 2;
  return rows.some((token) => token !== locked);
}

export function confirmSwap(state: Duel, firstToken: string, secondToken: string): Duel {
  if (!state.swap) return state;
  if (firstToken === secondToken) return note(state, "Chọn hai quái khác nhau.");
  const side = state.swap.side;
  const done = pickSwap({ ...state, swap: { first: firstToken, side } }, secondToken);
  if (done.swap) return { ...done, swap: { first: null, side } };
  return done;
}

export function pickSwap(state: Duel, token: string): Duel {
  if (!state.swap) return state;
  const side = state.swap.side;
  const you = state.players[side];
  if (!swapToken(you, token)) return note(state, "Không đổi được quái này.");
  if (!state.swap.first) return { ...state, swap: { first: token, side }, live: "Chọn quái thứ hai." };
  if (state.swap.first === token) return note(state, "Chọn một quái khác.");
  const first = swapToken(you, state.swap.first);
  const second = swapToken(you, token);
  if (!first || !second) return { ...state, swap: null };
  const field = [...you.field] as Player["field"];
  const reserve = [...you.reserve];
  const takeField = (uid: string) => {
    const mon = field.find((unit) => unit?.uid === uid) ?? null;
    if (!mon || mon.copy || mon.cardId === "chan-ken" || mon.cardId === "ken-ngai") return null;
    return mon;
  };
  if (first.kind === "field" && second.kind === "field") {
    const a = field.findIndex((mon) => mon?.uid === first.uid);
    const b = field.findIndex((mon) => mon?.uid === second.uid);
    if (a < 0 || b < 0) return { ...state, swap: null };
    const hold = field[a];
    field[a] = field[b];
    field[b] = hold;
    const aimed = aimedId(state);
    const other = aimed === first.uid ? second.uid : aimed === second.uid ? first.uid : null;
    return redirectAim(note(patch({ ...state, swap: null }, side, { ...you, field, reserve }), "Hoán đổi xong.", "spell"), aimed, other);
  } else if (first.kind === "reserve" && second.kind === "reserve") {
    const hold = reserve[first.index];
    reserve[first.index] = reserve[second.index];
    reserve[second.index] = hold;
  } else {
    const board = first.kind === "field" ? first : second.kind === "field" ? second : null;
    const bench = first.kind === "reserve" ? first : second.kind === "reserve" ? second : null;
    const mon = board ? takeField(board.uid) : null;
    const card = bench ? reserve[bench.index] : undefined;
    if (!board || !bench || !mon || !card || !canBring(you, card.id)) return note(state, "Quái dự bị chưa đủ điều kiện triệu hồi.");
    const gate = demonGate(you, card);
    if (typeof gate === "string") return note(state, gate);
    const slot = field.findIndex((unit) => unit?.uid === mon.uid);
    const seq = state.seq + 1;
    const born = place({ ...state, seq }, side, card.id, card);
    if (!card.saved && card.id === "trieu-hoi-ac-ma" && you.stars === 3) born.pact = true;
    if (gate.fresh) born.seen = true;
    field[slot] = born;
    reserve[bench.index] = pileFromField(mon);
    const aimed = aimedId(state);
    return redirectAim(
      note(patch({ ...state, seq: seq + 1, swap: null }, side, { ...gate.player, field, reserve }), "Hoán đổi quái trên sân với quái dự bị.", "spell"),
      aimed === mon.uid ? aimed : null,
      aimed === mon.uid ? born.uid : null,
    );
  }
  return note(patch({ ...state, swap: null }, side, { ...you, field, reserve }), "Hoán đổi xong.", "spell");
}

function flowerBite(state: Duel, foe: Side, attackerUid: string, flowerUid: string, take: number, lead: string): Duel {
  return envGuard(state, [attackerUid, flowerUid], [attackerUid, flowerUid], () => flowerBiteCore(state, foe, attackerUid, flowerUid, take, lead));
}

function flowerBiteCore(state: Duel, foe: Side, attackerUid: string, flowerUid: string, take: number, lead: string): Duel {
  const side = (1 - foe) as Side;
  const you = state.players[side];
  const them = state.players[foe];
  const attacker = them.field.find((mon) => mon?.uid === attackerUid && mon.hp > 0) ?? null;
  const flower = you.field.find((mon) => mon?.uid === flowerUid && mon.hp > 0) ?? null;
  if (!attacker || !flower) {
    return { ...note(state, lead, "heal"), mends: take > 0 ? [{ uid: flowerUid, n: take }] : null };
  }
  const keptDim = attacker.dim;
  const hit = strikePair(withLegend(attacker), withLegend(flower), them.field, you.field, them.roster, you.roster, rockOf(state, attacker), rockOf(state, flower));
  const awardA = bullAward(hit.attacker, flower.cardId, hit.defender.hp <= 0);
  const awardD = bullAward(hit.defender, attacker.cardId, hit.attacker.hp <= 0);
  const worn = combatErode(awardA.mon, awardD.mon, foe);
  const fed = withLeech(them.field, { ...worn.attacker, dim: keptDim }, hit.bite, hit.surplus);
  let next = patch(state, foe, settleCocoon(dropDead({ ...them, field: fed.field })));
  next = patch(next, side, settleCocoon(dropDead({ ...next.players[side], field: next.players[side].field.map((mon) => (mon?.uid === flower.uid ? worn.defender : mon)) })));
  const soul = soulLeech(next, foe, attacker, hit.bite + hit.surplus);
  next = soul.state;
  const steal = lead.replace(`${cardOf(flower).name} `, "").replace(/\.+$/u, "");
  const noted = note(
    next,
    `${actNotice(cardOf(flower).name, [steal, `${cardOf(attacker).name} đánh thường vào ${cardOf(flower).name}`])}${hit.dodged ? " Thỏ đen tinh nghịch né đòn." : ""}${soul.line}`,
    "heal",
  );
  const mends = [{ uid: flower.uid, n: take }, ...[awardA, awardD].filter((row) => row.mend > 0 && row.mon.hp > 0).map((row) => ({ uid: row.mon.uid, n: row.mend }))];
  return growSmash(releaseLegend({ ...noted, mends }), attacker.uid, attacker.cardId === "khong-lo-mot-mat");
}

function rainBombs(state: Duel, side: Side, mon: FieldMon, primaryUid: string | null): Duel {
  const foe = (1 - side) as Side;
  const you = state.players[side];
  const before = you.stars;
  const cost = skillManaCost(mon.cardId, 1);
  const paid = pay(you, cost);
  if (!paid) return note(state, "Cần 1 gem.");
  const text = skillText(mon.cardId);
  const count = 5;
  const each = grabNums(text, /(\d+)\s*sát thương chuẩn/gi)[0] ?? 1;
  const chance = (grabNums(text, /(\d+)\s*%/gi)[0] ?? 50) / 100;
  const bombPlus = mon.skillUp ?? 0;
  let yourField = paid.field.map((unit) => (unit?.uid === mon.uid ? { ...unit, dim: true } : unit));
  let foeField = state.players[foe].field.map((unit) => unit);
  let foeHp = state.players[foe].hp;
  let total = 0;
  const hits: string[] = [];
  const vols: number[] = [];
  const tally = new Map<string, { name: string; n: number }>();
  const addHit = (key: string, name: string, n: number) => {
    const row = tally.get(key);
    if (row) row.n += n;
    else tally.set(key, { name, n });
  };
  const shotN = (shot: number) => each + (shot === count - 1 ? bombPlus : 0);
  const strikeMon = (field: Array<FieldMon | null>, uid: string, shot: number) => {
    const target = field.find((unit) => unit?.uid === uid && unit.hp > 0);
    if (!target) return field;
    const beforeHp = target.hp;
    const struck = trueDamage(target, outgoing(mon, shotN(shot)));
    const dealt = Math.max(0, beforeHp - struck.hp);
    hits.push(uid);
    vols.push(dealt);
    total += dealt;
    addHit(uid, cardOf(target).name, dealt);
    return field.map((unit) => (unit?.uid === uid ? struck : unit));
  };
  for (let shot = 0; shot < count; shot += 1) {
    if (Math.random() < chance) {
      if (!primaryUid) {
        const n = outgoing(mon, shotN(shot)) + charmDamage;
        foeHp -= n;
        total += n;
        hits.push(`face:${foe}`);
        vols.push(n);
        addHit("face", "người chơi", n);
      } else if (yourField.some((unit) => unit?.uid === primaryUid)) yourField = strikeMon(yourField, primaryUid, shot);
      else foeField = strikeMon(foeField, primaryUid, shot);
      continue;
    }
    const options: Array<{ uid: string } | { face: true }> = [];
    for (const unit of foeField) {
      if (unit && unit.hp > 0 && unit.uid !== primaryUid) options.push({ uid: unit.uid });
    }
    if (primaryUid) options.push({ face: true });
    if (options.length === 0) continue;
    const pick = options[Math.floor(Math.random() * options.length)];
    if ("face" in pick) {
      const n = outgoing(mon, shotN(shot)) + charmDamage;
      foeHp -= n;
      total += n;
      hits.push(`face:${foe}`);
      vols.push(n);
      addHit("face", "người chơi", n);
    } else foeField = strikeMon(foeField, pick.uid, shot);
  }
  let next = pingStars(patch(state, side, dropDead({ ...paid, field: yourField })), side, before, paid.stars);
  next = patch(next, foe, dropDead({ ...next.players[foe], field: foeField, hp: foeHp }));
  const bombRows = [...tally.values()].map((row) => ({ name: row.name, bits: `${row.n} sát thương chuẩn` }));
  const bombLine = aimNotice(castName(mon.cardId, 0), bombRows);
  const noted = note(next, bombLine ?? `${cardOf(mon).name} gây ${total} sát thương chuẩn.`, "spell");
  return checkWinner({ ...noted, skill: { id: mon.cardId, index: 0, aim: primaryUid, hits, vols } });
}

export type ReelFace = "seven" | "atk" | "def" | "hp" | "six";
export type GunBarrel = "phys" | "spell" | "tru";

const REEL_FACES: ReelFace[] = ["seven", "atk", "def", "hp", "six"];

function gunHits(extra: string | null): GunBarrel[] | null {
  if (extra == null) return null;
  if (extra === "none") return [];
  const hits = extra.split(",").filter((face): face is GunBarrel => face === "phys" || face === "spell" || face === "tru");
  return hits;
}

function openGunReel(state: Duel, uid: string): Duel {
  const opened: Duel = {
    ...state,
    reel: { id: state.seq + 1, uid, kind: "gun", order: shuffle(["phys", "spell", "tru"]), faces: null, phase: "wait" },
  };
  return pullReel(opened);
}

function grantAtk(mon: FieldMon, n: number): FieldMon {
  return { ...mon, atk: mon.atk + n, raised: markRaised(mon, { atk: n }) };
}

function smashPlain(mon: FieldMon): boolean {
  return mon.cardId === "khong-lo-mot-mat" && !mon.horn && !mon.gaze && !mon.bolt;
}

function swordSwing(mon: FieldMon) {
  return mon.cardId === KING && !mon.horn && !mon.gaze && !mon.bolt;
}

function dullSword(mon: FieldMon): FieldMon {
  const raised = mon.raised ?? { atk: 0, def: 0, mdef: 0, hp: 0 };
  const next = { ...raised, atk: Math.max(0, raised.atk - 5) };
  const clear = next.atk === 0 && next.def === 0 && next.mdef === 0 && next.hp === 0;
  return { ...mon, atk: Math.max(0, mon.atk - 5), raised: clear ? undefined : next, edge: undefined };
}

function stackAct(state: Duel, extra: string): Duel {
  const raw = state.live ?? "";
  const head = /^(\d+)\.\s*/u.exec(raw);
  const body = (head ? raw.slice(head[0].length) : raw).trim();
  const add = extra.replace(/^[-•]\s*/u, "").replace(/[.。]+$/u, "").trim();
  const prefix = head ? `${head[1]}. ` : "";
  const text = body.includes("\n")
    ? `${prefix}${body}\n- ${add}.`
    : `${prefix}- ${body.replace(/^[-•]\s*/u, "").replace(/[.。]+$/u, "").trim()}.\n- ${add}.`;
  const log = state.log.length ? [...state.log.slice(0, -1), text] : [text];
  return { ...state, live: text, log };
}

function swingSword(state: Duel, uid: string | null | undefined, allow: boolean): Duel {
  if (!allow || !uid) return state;
  const side = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid && unit.hp > 0) ?? null;
  if (!mon || mon.cardId !== KING) return state;
  const nextMon = mon.edge ? dullSword(mon) : { ...grantAtk(mon, 5), edge: true };
  const field = you.field.map((unit) => (unit?.uid === uid ? nextMon : unit));
  const next = patch(state, side, { ...you, field });
  const extra = mon.edge ? `${cardOf(mon).name} trả thanh gươm về ban đầu.` : `${cardOf(mon).name} mài sắc thanh gươm, +5 công.`;
  return stackAct(next, extra);
}

function growSmash(state: Duel, uid: string | null | undefined, allow: boolean): Duel {
  if (!allow || !uid) return state;
  const side = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid && unit.hp > 0) ?? null;
  if (!mon || mon.cardId !== "khong-lo-mot-mat") return state;
  const grown = grantAtk(mon, 1);
  const field = you.field.map((unit) => (unit?.uid === uid ? grown : unit));
  const next = patch(state, side, { ...you, field });
  return stackAct(next, `${cardOf(mon).name} dùng Đập phá, tăng 1 công vĩnh viễn.`);
}

function grantWard(mon: FieldMon, n: number): FieldMon {
  if (mon.cage) return mon;
  return { ...mon, def: mon.def + n, mdef: mon.mdef + n, raised: markRaised(mon, { def: n, mdef: n }) };
}

function healBank(mon: FieldMon, n: number): FieldMon {
  const cap = mon.maxHp || mon.hp;
  const room = Math.max(0, cap - mon.hp);
  if (mon.cage) return { ...mon, hp: mon.hp + Math.min(n, room) };
  const spill = Math.max(0, n - room);
  return {
    ...mon,
    hp: mon.hp + Math.min(n, room) + spill,
    maxHp: cap + spill,
    raised: spill > 0 ? markRaised(mon, { hp: spill }) : mon.raised,
  };
}

function grantMax(mon: FieldMon, n: number): FieldMon {
  if (mon.cage) return mon;
  return { ...mon, maxHp: (mon.maxHp || mon.hp) + n, raised: markRaised(mon, { hp: n }) };
}

function reelPrize(faces: ReelFace[]): { face: ReelFace; rank: 2 | 3 } | null {
  const counts = new Map<ReelFace, number>();
  for (const face of faces) counts.set(face, (counts.get(face) ?? 0) + 1);
  let best: { face: ReelFace; rank: 2 | 3 } | null = null;
  for (const [face, count] of counts) {
    if (count < 2) continue;
    const rank = count >= 3 ? 3 : 2;
    if (!best || rank > best.rank) best = { face, rank };
  }
  return best;
}

function payReel(mon: FieldMon, faces: ReelFace[]): { mon: FieldMon | null; line: string; tone: "heal" | "hit" | "info" } {
  const prize = reelPrize(faces);
  if (!prize) return { mon: { ...mon, misses: (mon.misses ?? 0) + 1 }, line: "Quay trượt.", tone: "info" };
  const hot = prize.rank === 3;
  if (prize.face === "six") {
    if (hot) return { mon: { ...mon, hp: 0 }, line: "3 số 6, tự hủy.", tone: "hit" };
    const hp = mon.hp - 2;
    return { mon: hp > 0 ? { ...mon, hp } : { ...mon, hp: 0 }, line: "2 số 6, mất 2 máu.", tone: "hit" };
  }
  let next = mon;
  if (prize.face === "atk" || prize.face === "seven") next = grantAtk(next, hot ? 4 : 2);
  if (prize.face === "def" || prize.face === "seven") next = grantWard(next, hot ? 2 : 1);
  if (prize.face === "hp" || prize.face === "seven") {
    const wasFull = next.hp >= (next.maxHp || next.hp);
    next = healBank(next, 3);
    if (hot) {
      next = grantMax(next, 3);
      if (wasFull) next = { ...next, hp: next.maxHp || next.hp };
    }
  }
  if (prize.face === "seven") return { mon: next, line: hot ? "3 số 7, nhận hết hiệu ứng cường hoá." : "2 số 7, nhận hết hiệu ứng có lợi.", tone: "heal" };
  if (prize.face === "atk") return { mon: next, line: hot ? "3 công, +4 công." : "2 công, +2 công.", tone: "heal" };
  if (prize.face === "def") return { mon: next, line: hot ? "3 thủ, +2 phòng ngự." : "2 thủ, +1 phòng ngự.", tone: "heal" };
  return { mon: next, line: hot ? "3 máu, hồi 3 và +3 máu tối đa." : "2 máu, hồi 3.", tone: "heal" };
}

export function startReel(state: Duel, uid: string): Duel {
  if (state.step !== "main" || state.winner || state.reel) return state;
  const you = state.players[state.turn];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== "may-quay-thuong" || held(mon)) return state;
  if (mon.stun > 0 || (mon.chain ?? 0) > 0 || (mon.path ?? 0) > 0) return note(state, "Đang không quay được.");
  if (mon.spun) return note(state, "Lượt này đã quay.");
  return { ...state, reel: { id: state.seq + 1, uid, faces: null, phase: "wait" } };
}

export function pullReel(state: Duel): Duel {
  const next = pullReelCore(state);
  if (next === state) return next;
  const mon = state.players[state.turn].field.find((unit) => unit?.uid === state.reel?.uid) ?? null;
  const ok = next.reel?.phase === "spin";
  if (!ok && next.players === state.players && next.reel === state.reel) return next;
  return traced(state, next, { kind: "reel", actor: state.turn, ok, cardId: mon?.cardId ?? null, target: null, end: null });
}

function pullReelCore(state: Duel): Duel {
  const reel = state.reel;
  if (!reel || reel.phase !== "wait" || state.step !== "main" || state.winner) return state;
  if (reel.kind === "gun") return pullGun(state);
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === reel.uid && unit.cardId === "may-quay-thuong") ?? null;
  if (!mon || mon.spun) return { ...state, reel: null };
  const faces = [0, 1, 2].map(() => REEL_FACES[Math.floor(Math.random() * REEL_FACES.length)]!) as ReelFace[];
  const field = you.field.map((unit) => (unit?.uid === mon.uid ? { ...unit, spun: true } : unit));
  return { ...patch(state, side, { ...you, field }), reel: { ...reel, faces, phase: "spin" } };
}

export function settleReel(state: Duel): Duel {
  const next = settleReelCore(state);
  if (next === state) return next;
  return withResults(state, next, { blocked: false, reflect: false, turn: false });
}

function settleReelCore(state: Duel): Duel {
  const reel = state.reel;
  if (!reel || reel.phase !== "spin" || !reel.faces) return { ...state, reel: null };
  if (reel.kind === "gun") return settleGun(state);
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === reel.uid) ?? null;
  if (!mon) return { ...state, reel: null };
  const paid = payReel(mon, reel.faces as ReelFace[]);
  const field = you.field.map((unit) => (unit?.uid === mon.uid ? paid.mon : unit));
  const next = patch({ ...state, reel: null }, side, dropDead({ ...you, field }));
  return note(next, paid.line, paid.tone);
}

function pullGun(state: Duel): Duel {
  const reel = state.reel;
  if (!reel || reel.kind !== "gun" || !reel.order) return { ...state, reel: null };
  const mon = state.players[state.turn].field.find((unit) => unit?.uid === reel.uid && unit.cardId === "thuong-quan-long") ?? null;
  if (!mon) return { ...state, reel: null };
  const chance = (grabNums(skillText(mon.cardId), /(\d+)\s*%/gi)[0] ?? 45) / 100;
  const faces = reel.order.map((gun) => (Math.random() < chance ? gun : "blank"));
  return { ...state, reel: { ...reel, faces, phase: "spin" } };
}

function settleGun(state: Duel): Duel {
  const reel = state.reel;
  if (!reel?.faces) return { ...state, reel: null };
  const hits = reel.faces.filter((face): face is GunBarrel => face === "phys" || face === "spell" || face === "tru");
  const uid = reel.uid;
  return useSkill({ ...state, reel: null }, uid, null, 0, true, hits.length ? hits.join(",") : "none", true);
}

export function scoreReel(state: Duel, uid: string, faces: ReelFace[]): Duel {
  const next = scoreReelCore(state, uid, faces);
  if (next === state) return next;
  const mon = state.players[state.turn].field.find((unit) => unit?.uid === uid) ?? null;
  const ok = next.players !== state.players;
  const marked = traced(state, next, { kind: "reel", actor: state.turn, ok, cardId: mon?.cardId ?? null, target: null, end: null });
  return withResults(state, marked, { blocked: false, reflect: false, turn: false });
}

function scoreReelCore(state: Duel, uid: string, faces: ReelFace[]): Duel {
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon) return state;
  const paid = payReel({ ...mon, spun: true }, faces);
  const field = you.field.map((unit) => (unit?.uid === uid ? paid.mon : unit));
  return note(patch(state, side, dropDead({ ...you, field })), paid.line, paid.tone);
}

const GIRL = "my-dieu-nhan";
const QUEEN = "nu-chua-dieu-nhan";
const PRINCESS = "cong-chua-dieu-nhan";

function isHarpy(id: string) {
  return id === GIRL || id === QUEEN;
}

function harpyKit(id: string) {
  if (id === QUEEN) return { armor: 2, gust: 0, charm: 0, lash: 1, def: 0, mdef: 3, hp: 3, atk: 1 };
  return { armor: 2, gust: 1, charm: 0, lash: 2, def: 2, mdef: 0, hp: 2, atk: 3 };
}

function shedOf(mon: FieldMon) {
  return mon.shed ?? [];
}

function growHarpy(mon: FieldMon, part: { atk?: number; def?: number; mdef?: number; hp?: number }, key: string): FieldMon {
  const atk = part.atk ?? 0;
  const def = part.def ?? 0;
  const mdef = part.mdef ?? 0;
  const hp = part.hp ?? 0;
  const maxHp = (mon.maxHp || mon.hp) + hp;
  return {
    ...mon,
    atk: mon.atk + atk,
    def: mon.def + def,
    mdef: mon.mdef + mdef,
    maxHp,
    hp: mon.hp + hp,
    raised: markRaised(mon, { atk, def, mdef, hp }),
    shed: [...shedOf(mon), key],
  };
}

function banDraw(player: Player): Player {
  return { ...player, drawBan: (player.drawBan ?? 0) + 1 };
}

function becomePerfect(state: Duel, side: Side, uid: string): Duel {
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid && unit.cardId === QUEEN && unit.hp > 0) ?? null;
  const card = monsterCard(PERFECT);
  if (!mon || !card || shedOf(mon).length < 4 || (mon.acts ?? 0) < 2) return state;
  const born: FieldMon = {
    ...mon,
    cardId: card.id,
    atk: card.atk,
    def: card.def,
    mdef: card.mdef,
    hp: card.hp,
    maxHp: card.hp,
    level: 1,
    raised: undefined,
    shed: [],
    lure: undefined,
    acts: 0,
    debt: undefined,
    bolt: undefined,
  };
  const field = you.field.map((unit) => (unit?.uid === mon.uid ? born : unit));
  return note(patch(state, side, { ...you, field }), `${cardOf(mon).name} tiến hoá thành ${card.name}.`, "heal");
}

function sealHarpy(state: Duel, side: Side, uid: string, line: string, tone: Duel["tone"]): Duel {
  const mon = state.players[side].field.find((unit) => unit?.uid === uid) ?? null;
  let text = line;
  const ripe = Boolean(mon && mon.cardId === QUEEN && shedOf(mon).length >= 4 && (mon.acts ?? 0) >= 2);
  if (mon?.cardId === GIRL && shedOf(mon).length >= 4) text += " Hãy chọn Công chúa điểu nhân hoặc Nữ chúa điểu nhân.";
  const noted = note(state, text, tone);
  if (mon?.cardId === GIRL && shedOf(mon).length >= 4) return { ...noted, birdAsk: { uid } };
  if (ripe) return becomePerfect(noted, side, uid);
  return noted;
}

function markQueenAct(state: Duel, side: Side, uid: string): { state: Duel; extra: string } {
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== QUEEN) return { state, extra: "" };
  const before = mon.acts ?? 0;
  const nextMon = { ...mon, acts: before + 1 };
  const patched = patch(state, side, { ...you, field: you.field.map((unit) => (unit?.uid === uid ? nextMon : unit)) });
  const extra = "";
  return { state: patched, extra };
}

function harpyBird(state: Duel, side: Side, uid: string | null) {
  if (!uid) return null;
  return state.players[side].field.find((unit) => unit?.uid === uid && unit.hp > 0 && isHarpy(unit.cardId)) ?? null;
}

export function harpyOffer(state: Duel, side: Side): "armor" | "lash" | null {
  if (state.step !== "respond" || state.hold?.priority !== side || !state.pending) return null;
  const owner = state.players[side];
  const pending = state.pending;
  if (pending.kind === "melee") {
    const uid = state.hold.blocker ?? pending.defender;
    const bird = harpyBird(state, side, uid);
    if (bird && !shedOf(bird).includes("lash") && owner.orb >= harpyKit(bird.cardId).lash) return "lash";
    return null;
  }
  const uid = pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.target : pending.kind === "spell" ? pending.target : null;
  const bird = harpyBird(state, side, uid);
  if (bird && !shedOf(bird).includes("armor") && owner.orb >= harpyKit(bird.cardId).armor) return "armor";
  return null;
}

export function harpyWard(state: Duel): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => harpyWard(next));
  if (harpyOffer(state, state.hold?.priority ?? state.turn) !== "armor" || !state.hold || !state.pending) return state;
  const side = state.hold.priority;
  const pending = state.pending;
  const uid = pending.kind === "beam" || pending.kind === "gnaw-skill" ? pending.target : pending.kind === "spell" ? pending.target : null;
  const you = state.players[side];
  const bird = harpyBird(state, side, uid);
  const kit = bird ? harpyKit(bird.cardId) : null;
  const paid = bird && kit ? pay(you, kit.armor) : null;
  if (!bird || !kit || !paid) return note(state, "Cần 2 mana.");
  const grown = growHarpy(bird, { def: kit.def, mdef: kit.mdef, hp: kit.hp }, "armor");
  const field = paid.field.map((unit) => (unit?.uid === bird.uid ? grown : unit));
  let what = "đòn";
  if (pending.kind === "spell") what = spellCard(pending.cardId)?.name ?? "phép";
  else if (pending.kind === "beam" || pending.kind === "gnaw-skill") {
    const caster = state.players[0].field.find((unit) => unit?.uid === pending.caster) ?? state.players[1].field.find((unit) => unit?.uid === pending.caster);
    what = castName(caster?.cardId ?? "", pending.index);
  }
  const gain = kit.mdef > 0 ? `tăng vĩnh viễn ${kit.mdef} thủ phép và ${kit.hp} máu` : `tăng vĩnh viễn ${kit.def} thủ và ${kit.hp} máu`;
  const line = actNotice("Giáp và Vuốt", [`huỷ ${what} nhắm vào ${cardOf(bird).name}`, gain]);
  const sealed = sealHarpy(patch(state, side, { ...paid, field }), side, bird.uid, line, "spell");
  return { ...sealed, step: "main", pending: null, hold: null };
}

function openLash(state: Duel, owner: Side, bird: string, foe: string, stun: boolean, line: string): Duel {
  const noted = note(state, line, "spell");
  const foeSide = (1 - owner) as Side;
  return {
    ...noted,
    step: "respond",
    pending: { kind: "lash", owner, bird, foe, stun },
    hold: { priority: foeSide, passed: [false, false], blocker: null, blockerSkill: false, armed: null },
  };
}

function finishLash(state: Duel): Duel {
  const pending = state.pending;
  if (!pending || pending.kind !== "lash") return state;
  const owner = pending.owner;
  const foe = (1 - owner) as Side;
  const you = state.players[owner];
  const them = state.players[foe];
  const bird = you.field.find((unit) => unit?.uid === pending.bird) ?? null;
  const attacker = them.field.find((unit) => unit?.uid === pending.foe && unit.hp > 0) ?? null;
  const open = { ...state, step: "main" as const, pending: null, hold: null };
  if (!bird || !attacker) return bird ? sealHarpy(open, owner, bird.uid, open.live, "spell") : open;
  const burned = damageSpell(attacker, 5, them.field, bird);
  const dealt = spellLanded(attacker, 5, them.field, bird);
  const hit = burned.hp > 0 ? { ...burned, dim: true, stun: pending.stun ? Math.max(burned.stun, 2) : burned.stun } : burned;
  const next = patch(open, foe, dropDead({ ...them, field: them.field.map((unit) => (unit?.uid === attacker.uid ? hit : unit)) }));
  const bits = [`gây ${dealt} sát thương phép lên ${cardOf(attacker).name}`];
  if (pending.stun) bits.push(`${cardOf(attacker).name} không thể hành động ở lượt sau`);
  return sealHarpy(next, owner, bird.uid, actNotice("Roi điện", bits), "spell");
}

export function harpyLash(state: Duel): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => harpyLash(next));
  if (harpyOffer(state, state.hold?.priority ?? state.turn) !== "lash" || !state.hold || state.pending?.kind !== "melee") return state;
  const side = state.hold.priority;
  const pending = state.pending;
  const uid = state.hold.blocker ?? pending.defender;
  const you = state.players[side];
  const bird = harpyBird(state, side, uid);
  const kit = bird ? harpyKit(bird.cardId) : null;
  const atkSide = state.turn === side ? ((1 - side) as Side) : state.turn;
  const them = state.players[atkSide];
  const attacker = them.field.find((unit) => unit?.uid === pending.attacker) ?? null;
  const paid = bird && kit ? pay(you, kit.lash) : null;
  if (!bird || !kit || !attacker || !paid) return note(state, kit?.lash === 1 ? "Cần 1 mana." : "Cần 2 mana.");
  const grown = growHarpy(bird, { atk: kit.atk }, "lash");
  let next = patch(state, side, { ...paid, field: paid.field.map((unit) => (unit?.uid === bird.uid ? grown : unit)) });
  const marked = them.field.map((unit) => (unit?.uid === attacker.uid ? { ...unit, dim: true } : unit));
  next = patch(next, atkSide, { ...them, field: marked });
  const line = actNotice("Roi điện", [`né đòn của ${cardOf(attacker).name}`, `tăng vĩnh viễn ${kit.atk} công`, "đang thi triển"]);
  return openLash(next, side, bird.uid, attacker.uid, false, line);
}

function charmStrike(state: Duel, birdUid: string, foeUid: string): Duel {
  return envGuard(state, [birdUid, foeUid], [birdUid, foeUid], () => charmStrikeCore(state, birdUid, foeUid));
}

function charmStrikeCore(state: Duel, birdUid: string, foeUid: string): Duel {
  const side = state.turn;
  const foe = (1 - side) as Side;
  const you = state.players[side];
  const them = state.players[foe];
  const bird = you.field.find((unit) => unit?.uid === birdUid) ?? null;
  const attacker = them.field.find((unit) => unit?.uid === foeUid && unit.hp > 0) ?? null;
  if (!bird || !attacker) return note(state, "Không còn quái để mê hoặc.");
  const hit = strikePair(withLegend(attacker), withLegend(bird), them.field, you.field, them.roster, you.roster, rockOf(state, attacker), rockOf(state, bird));
  const stunned = hit.attacker.hp > 0 ? { ...hit.attacker, dim: true, stun: Math.max(hit.attacker.stun, 2) } : hit.attacker;
  let next = patch(state, foe, dropDead({ ...them, field: them.field.map((unit) => (unit?.uid === attacker.uid ? stunned : unit)) }));
  next = patch(next, side, dropDead({ ...you, field: you.field.map((unit) => (unit?.uid === bird.uid ? hit.defender : unit)) }));
  return growSmash(sealHarpy(next, side, bird.uid, actNotice("Mê hoặc", [`${cardOf(attacker).name} đánh thường vào ${cardOf(bird).name}`, `${cardOf(attacker).name} không thể hành động ở lượt sau`]), "hit"), attacker.uid, attacker.cardId === "khong-lo-mot-mat");
}

export function answerPlume(state: Duel, yes: boolean): Duel {
  const ask = state.plumeAsk;
  if (!ask) return state;
  const cleared: Duel = { ...state, plumeAsk: null };
  if (!yes) return charmStrike(cleared, ask.bird, ask.foe);
  const side = cleared.turn;
  const foe = (1 - side) as Side;
  const you = cleared.players[side];
  const them = cleared.players[foe];
  const bird = you.field.find((unit) => unit?.uid === ask.bird && isHarpy(unit.cardId)) ?? null;
  const kit = bird ? harpyKit(bird.cardId) : null;
  const attacker = them.field.find((unit) => unit?.uid === ask.foe && unit.hp > 0) ?? null;
  const paid = bird && kit && !shedOf(bird).includes("lash") ? pay(you, kit.lash) : null;
  if (!bird || !kit || !attacker || !paid) return charmStrike(cleared, ask.bird, ask.foe);
  const grown = growHarpy(bird, { atk: kit.atk }, "lash");
  let next = patch(cleared, side, { ...paid, field: paid.field.map((unit) => (unit?.uid === bird.uid ? grown : unit)) });
  const marked = them.field.map((unit) => (unit?.uid === attacker.uid ? { ...unit, dim: true } : unit));
  next = patch(next, foe, { ...them, field: marked });
  const line = actNotice("Roi điện", [`né đòn của ${cardOf(attacker).name}`, `tăng vĩnh viễn ${kit.atk} công`, "đang thi triển", `${cardOf(attacker).name} không thể hành động ở lượt sau`]);
  return openLash(next, side, bird.uid, attacker.uid, true, line);
}

export function evolveBird(state: Duel, formId: string): Duel {
  const ask = state.birdAsk;
  if (!ask) return state;
  if (formId !== QUEEN && formId !== PRINCESS) return state;
  const card = monsterCard(formId);
  if (!card) return note(state, `${formId === PRINCESS ? "Công chúa điểu nhân" : "Nữ chúa điểu nhân"} sẽ bổ sung sau.`);
  const side = (state.players[0].field.some((mon) => mon?.uid === ask.uid) ? 0 : 1) as Side;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === ask.uid && unit.cardId === GIRL) ?? null;
  if (!mon) return { ...state, birdAsk: null };
  const born: FieldMon = {
    ...mon,
    cardId: card.id,
    atk: card.atk,
    def: card.def,
    mdef: card.mdef,
    hp: card.hp,
    maxHp: card.hp,
    level: 1,
    raised: undefined,
    shed: [],
    lure: undefined,
    acts: 0,
  };
  const field = you.field.map((unit) => (unit?.uid === mon.uid ? born : unit));
  return note(patch({ ...state, birdAsk: null }, side, { ...you, field }), `${cardOf(mon).name} tiến hoá thành ${card.name}.`, "heal");
}

function castHarpy(state: Duel, side: Side, mon: FieldMon, skillIndex: number, targetUid: string | null): Duel {
  const you = state.players[side];
  const foe = (1 - side) as Side;
  const kit = harpyKit(mon.cardId);
  const spent = shedOf(mon);
  if (skillIndex === 0) {
    if (spent.includes("gust")) return note(state, "Thổi bay đã biến mất.");
    const paid = pay(you, kit.gust);
    if (!paid) return note(state, "Cần 1 mana.");
    const hand = [...state.players[foe].hand];
    const spells = hand.map((id, index) => ({ id, index })).filter((row) => spellCard(row.id) && !spellCard(row.id)?.env);
    if (spells.length === 0) return note(state, "Đối thủ không có phép trên tay.");
    const pick = spells[Math.floor(Math.random() * spells.length)]!;
    hand.splice(pick.index, 1);
    const tolls = handTolls(state.players[foe]).filter((_, index) => index !== pick.index);
    const grown = { ...mon, dim: true, shed: [...spent, "gust"] };
    const field = paid.field.map((unit) => (unit?.uid === mon.uid ? grown : unit));
    let next = patch(state, side, { ...paid, field });
    next = patch(next, foe, { ...state.players[foe], hand, tolls });
    return sealHarpy(next, side, mon.uid, actNotice("Thổi bay", [`huỷ ${spellCard(pick.id)?.name ?? "1 phép"} trên tay đối thủ`]), "spell");
  }
  if (spent.includes("charm")) return note(state, "Mê hoặc đã biến mất.");
  const them = state.players[foe];
  const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
  if (!target) return note(state, "Chọn một quái đối thủ.");
  const paid = pay(you, kit.charm);
  if (!paid) return note(state, "Cần 1 mana.");
  const grown = { ...mon, dim: true, shed: [...spent, "charm"] };
  const field = paid.field.map((unit) => (unit?.uid === mon.uid ? grown : unit));
  const next = patch(state, side, { ...paid, field });
  const owner = next.players[side];
  const still = owner.field.find((unit) => unit?.uid === mon.uid) ?? grown;
  if (!shedOf(still).includes("lash") && owner.orb >= harpyKit(still.cardId).lash) {
    return note({ ...next, plumeAsk: { bird: mon.uid, foe: target.uid } }, `${cardOf(mon).name} mê hoặc ${cardOf(target).name}. Dùng Roi điện để né?`, "info");
  }
  return charmStrike(next, mon.uid, target.uid);
}

function castLure(state: Duel, side: Side, mon: FieldMon, foeUid: string | null, allyUid: string | null): Duel {
  const pair = foeUid && allyUid ? [foeUid, allyUid] : [];
  return envGuard(state, pair, pair, () => castLureCore(state, side, mon, foeUid, allyUid));
}

function castLureCore(state: Duel, side: Side, mon: FieldMon, foeUid: string | null, allyUid: string | null): Duel {
  const you = state.players[side];
  const foe = (1 - side) as Side;
  const them = state.players[foe];
  const enemy = them.field.find((unit) => unit?.uid === foeUid && unit.hp > 0) ?? null;
  const ally = you.field.find((unit) => unit?.uid === allyUid && unit.hp > 0) ?? null;
  if (!enemy || !ally) return note(state, "Chọn quái địch và quái của ta.");
  const evolve = mon.cardId !== PERFECT && !mon.lure;
  const paid = evolve ? pay(you, 2) : you;
  if (!paid) return note(state, "Cần 2 mana.");
  const before = mon.acts ?? 0;
  const grown = { ...mon, dim: true, lure: true, acts: before + 1 };
  const field = paid.field.map((unit) => (unit?.uid === mon.uid ? grown : unit));
  let next = patch(state, side, { ...paid, field });
  const owner = next.players[side];
  const foeNow = next.players[foe];
  const attacker = foeNow.field.find((unit) => unit?.uid === enemy.uid) ?? enemy;
  const defender = owner.field.find((unit) => unit?.uid === ally.uid) ?? ally;
  const hit = strikePair(withLegend(attacker), withLegend(defender), foeNow.field, owner.field, foeNow.roster, owner.roster, rockOf(next, attacker), rockOf(next, defender));
  const swung = hit.attacker.hp > 0 ? { ...hit.attacker, dim: false, stun: 0 } : hit.attacker;
  next = patch(next, foe, dropDead({ ...foeNow, field: foeNow.field.map((unit) => (unit?.uid === attacker.uid ? swung : unit)) }));
  next = patch(next, side, dropDead({ ...owner, field: owner.field.map((unit) => (unit?.uid === defender.uid ? hit.defender : unit)) }));
  const lines = [`${cardOf(grown).name} dụ dỗ ${cardOf(attacker).name}`, `${cardOf(attacker).name} sáp lá cà với ${cardOf(defender).name}`];
  const text = actNotice("Dụ dỗ", lines);
  return growSmash(becomePerfect(note(next, text, "hit"), side, mon.uid), attacker.uid, attacker.cardId === "khong-lo-mot-mat");
}

function castPerfect(state: Duel, side: Side, mon: FieldMon, skillIndex: number, targetUid: string | null, extra: string | null): Duel {
  const you = state.players[side];
  const foe = (1 - side) as Side;
  if (skillIndex === 3) return castLure(state, side, mon, extra, targetUid);
  if (skillIndex === 2) {
    if (mon.bolt) return note(state, "Roi sấm đã nạp cho đòn tiếp theo.");
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 mana.");
    const field = paid.field.map((unit) => (unit?.uid === mon.uid ? { ...unit, bolt: true } : unit));
    return note(patch(state, side, { ...paid, field }), `${cardOf(mon).name} nạp Roi sấm. Đòn đánh tiếp theo là sát thương phép.`, "spell");
  }
  const hand = [...state.players[foe].hand];
  const spells = hand.map((id, index) => ({ id, index })).filter((row) => spellCard(row.id) && !spellCard(row.id)?.env);
  let next = patch(state, side, banDraw(you));
  if (spells.length === 0) return note(next, actNotice("Gió xoáy", ["đối thủ không có phép trên tay", "lượt sau không được rút bài"]), "spell");
  const pick = spells[Math.floor(Math.random() * spells.length)]!;
  hand.splice(pick.index, 1);
  const tolls = handTolls(state.players[foe]).filter((_, index) => index !== pick.index);
  next = patch(next, foe, { ...state.players[foe], hand, tolls });
  return note(next, actNotice("Gió xoáy", [`thổi bay ${spellCard(pick.id)?.name ?? "1 phép"}`, "lượt sau không được rút bài"]), "spell");
}


function aidSpent(before: Duel, after: Duel): boolean {
  if (after === before) return false;
  if (after.winner !== before.winner || after.pending !== before.pending || after.reel !== before.reel) return true;
  for (const side of [0, 1] as const) {
    const left = before.players[side];
    const right = after.players[side];
    if (left.hp !== right.hp || left.orb !== right.orb || left.stars !== right.stars) return true;
    for (let slot = 0; slot < 3; slot += 1) {
      const a = left.field[slot];
      const b = right.field[slot];
      if (!a && !b) continue;
      if (!a || !b || a.uid !== b.uid || a.hp !== b.hp || a.dim !== b.dim) return true;
    }
  }
  return false;
}

function dropAid(state: Duel, uid: string): Duel {
  for (const side of [0, 1] as const) {
    const you = state.players[side];
    if (!you.field.some((mon) => mon?.uid === uid)) continue;
    const field = you.field.map((mon) => (mon?.uid === uid ? spendBless(mon) : mon));
    return patch(state, side, { ...you, field });
  }
  return state;
}

function queenSwing(mon: FieldMon): { n: 1 | 2; cost: number; pack: HellPack } {
  const n: 1 | 2 = mon.beat === 1 ? 2 : 1;
  const line = skillText(QUEEN_KNIGHT)
    .split("\n")
    .find((row) => new RegExp(`Lần\\s*${n}\\b`, "i").test(row)) ?? "";
  const cost = /tiêu(?:\s*hao)?\s*(\d+)\s*mana/i.exec(line);
  const phys = /(\d+)\s*sát thương vật lý/i.exec(line);
  const spell = /(\d+)\s*sát thương phép/i.exec(line);
  const tru = /(\d+)\s*sát thương chuẩn/i.exec(line);
  return {
    n,
    cost: cost ? Number(cost[1]) : n === 1 ? 0 : 1,
    pack: {
      phys: phys ? Number(phys[1]) : n === 1 ? 1 : 3,
      spell: spell ? Number(spell[1]) : n === 1 ? 1 : 3,
      tru: tru ? Number(tru[1]) : n === 1 ? 0 : 1,
    },
  };
}

function strikeQueenSword(state: Duel, ownerSide: Side, mon: FieldMon, victimSide: Side, victim: FieldMon): Duel {
  const you = state.players[ownerSide];
  const swing = queenSwing(mon);
  const before = you.stars;
  const paid = pay(you, swing.cost);
  if (!paid) return note(state, "Cần 1 mana.");
  const charm = charmDamage > 0 ? charmDamage : (mon.blessDmg ?? 0);
  const releaseHex = bindSkillHex(mon);
  const shaved = shaveHex(mon, {
    phys: swing.pack.phys + (swing.pack.phys > 0 ? charm : 0),
    spell: swing.pack.spell + (swing.pack.spell > 0 ? charm : 0),
    tru: swing.pack.tru + (swing.pack.tru > 0 ? charm : 0),
  });
  const shot: HellPack = {
    phys: outgoing(mon, shaved.phys),
    spell: outgoing(mon, shaved.spell),
    tru: outgoing(mon, shaved.tru),
  };
  releaseHex();
  const them = state.players[victimSide];
  const pool = phantomPool(victim, them.field);
  const landed = landHell(victim, shot, them.field);
  const beat = swing.n === 1 ? 1 : 0;
  const spentBody = victim.uid === mon.uid ? { ...landed.mon, dim: true, beat } : landed.mon;
  const casterBody = victim.uid === mon.uid ? spentBody : { ...mon, dim: true, beat };
  const write = (field: Array<FieldMon | null>) =>
    field.map((unit) => {
      if (!unit) return unit;
      if (unit.uid === victim.uid) return spentBody;
      if (unit.uid === mon.uid) return casterBody;
      return unit;
    });
  let next = pingStars(patch(state, ownerSide, { ...paid, field: write(paid.field) }), ownerSide, before, paid.stars);
  if (victimSide !== ownerSide) next = patch(next, victimSide, dropDead({ ...them, field: write(them.field) }));
  else next = patch(next, ownerSide, dropDead({ ...next.players[ownerSide], field: next.players[ownerSide].field }));
  return note(next, actNotice(castName(mon.cardId, 0), hellLine(landed.taken, cardOf(victim).name, landed.broke, victim, them.field, pool)), "spell");
}

export function useSkill(state: Duel, uid: string, targetUid: string | null, skillIndex = 0, skipGnaw = false, extra: string | null = null, silent = false): Duel {
  return envGuard(state, [uid], [], () => useSkillCore(state, uid, targetUid, skillIndex, skipGnaw, extra, silent));
}

function useSkillCore(state: Duel, uid: string, targetUid: string | null, skillIndex = 0, skipGnaw = false, extra: string | null = null, silent = false): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => useSkill(next, uid, targetUid, skillIndex, skipGnaw, extra, silent));
  const caster = state.players.flatMap((player) => player.field).find((unit) => unit?.uid === uid) ?? null;
  const bonus = caster?.blessDmg ?? 0;
  const previous = charmDamage;
  const previousHex = skillHex;
  charmDamage = bonus;
  skillHex = caster?.hex && caster.hex.left > 0 ? { uid: caster.uid, left: 3, clips: [] } : null;
  try {
    const result = castSkill(state, uid, targetUid, skillIndex, skipGnaw, extra);
    const armed = caster && ((caster.blessAtk ?? 0) > 0 || (caster.blessDmg ?? 0) > 0 || (caster.nextDef ?? 0) > 0) && aidSpent(state, result)
      ? dropAid(result, caster.uid)
      : result;
    const next = !caster || armed.fx === state.fx ? armed : {
      ...armed,
      skill: {
        id: caster.cardId,
        index: skillIndex,
        aim: targetUid,
        ...(armed.skill?.hits ? { hits: armed.skill.hits, vols: armed.skill.vols, aim: armed.skill.aim ?? targetUid, index: armed.skill.index } : {}),
      },
    };
    const tided = tideSkill(state, next, uid, targetUid, skillIndex);
    if (silent) return tided;
    const marked = traceSkill(state, tided, uid, targetUid);
    return withResults(state, marked, { blocked: false, reflect: false, turn: false });
  } finally {
    charmDamage = previous;
    skillHex = previousHex;
  }
}

function castSkill(state: Duel, uid: string, targetUid: string | null, skillIndex = 0, skipGnaw = false, extra: string | null = null): Duel {
  if (state.step !== "main" || state.winner) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  state = { ...state, echo: null, last: null };
  const side = state.turn;
  const foe = (1 - side) as Side;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (mon?.cardId === "sat-nhan-bat-giu") return castSeize(state, side, mon, targetUid);
  if (mon?.cage) return note(state, "Đang bị khoá cứng.");
  if (!mon || held(mon) || hexLocked(mon) || (mon.dim && !(mon.cardId === "ken-ngai" && skillIndex === 1) && !(mon.cardId === PERFECT && (skillIndex === 0 || skillIndex === 2))) || (mon.path ?? 0) > 0) return state;
  if (mon.cardId === "mat-xanh-huy-diet") {
    if (mon.gaze) return note(state, "Tia sáng huỷ diệt đã nạp cho đòn tiếp theo.");
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem.");
    const field = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, gaze: true } : unit));
    const armed = note(pingStars(patch(state, side, { ...paid, field }), side, before, paid.stars), `${cardOf(mon).name} nạp tia sáng huỷ diệt. Đòn tiếp theo là sát thương chuẩn bằng công.`, "heal");
    return { ...armed, mends: [{ uid: mon.uid, n: 0 }] };
  }
  if (mon.cardId === "thien-than-be-nho") {
    const ally = you.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
    if (!ally) return note(state, "Chọn một đồng minh.");
    const kind: "phys" | "spell" = skillIndex === 1 ? "spell" : "phys";
    const field = you.field.map((unit): FieldMon | null => {
      if (!unit) return unit;
      if (unit.uid === ally.uid) {
        if (unit.cage || unit.wardStay || (kind === "phys" && unit.oath?.phys) || (kind === "spell" && unit.oath?.spell)) return unit;
        return { ...unit, ward: kind };
      }
      if (unit.uid === mon.uid) return { ...unit, dim: true };
      return unit;
    });
    const label = kind === "phys" ? "khiên vật lý" : "khiên phép";
    return note(patch(state, side, { ...you, field }), `${cardOf(mon).name} dùng Thiên thần hộ mệnh, tạo ${label} cho ${cardOf(ally).name}.`, "heal");
  }
  if (mon.cardId === PERFECT) return castPerfect(state, side, mon, skillIndex, targetUid, extra);
  if (mon.cardId === QUEEN && skillIndex === 3) return castLure(state, side, mon, extra, targetUid);
  if (isHarpy(mon.cardId) && (skillIndex === 0 || skillIndex === 1)) return castHarpy(state, side, mon, skillIndex, targetUid);
  targetUid = redirectCover(state.players[foe].field, targetUid);
  if (!skipGnaw && targetUid && canTargetFoe(state)) {
    const foeMon = state.players[foe].field.find((unit) => unit?.uid === targetUid) ?? null;
    if (gnawReady(foeMon, state.players[foe])) {
      const asked = note(state, `${castName(mon.cardId, skillIndex)} nhắm vào Chiến sĩ gặm nhắm.`);
      return {
        ...asked,
        step: "respond",
        pending: { kind: "gnaw-skill", caster: uid, target: targetUid, index: skillIndex },
        hold: { priority: foe, passed: [false, false], blocker: null, blockerSkill: false, armed: null },
      };
    }
  }
  if (mon.cardId === "may-nem-bom-hinh-nhen") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    return rainBombs(state, side, mon, targetUid);
  }
  if (mon.cardId === "hoa-an-thit-nguoi") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ.");
    const bite = grabNums(skillText(mon.cardId), /cướp\s*(\d+)\s*máu\s*tối\s*đa/gi)[0] ?? 2;
    const take = Math.min(bite, target.hp);
    const drained = {
      ...target,
      maxHp: Math.max(0, (target.maxHp || target.hp) - take),
      hp: target.hp - take,
      raised: target.raised ? { ...target.raised, hp: Math.max(0, target.raised.hp - take) } : undefined,
    };
    const fed = {
      ...mon,
      maxHp: (mon.maxHp || mon.hp) + take,
      hp: mon.hp + take,
      raised: markRaised(mon, { hp: take }),
      dim: true,
    };
    const foeField = them.field.map((unit) => (unit?.uid === target.uid ? drained : unit));
    const yourField = you.field.map((unit) => (unit?.uid === mon.uid ? fed : unit));
    let next = patch(state, side, { ...you, field: yourField });
    next = patch(next, foe, dropDead({ ...them, field: foeField }));
    const killed = drained.hp <= 0;
    const line = killed
      ? `${cardOf(mon).name} cướp ${take} máu tối đa và hạ ${cardOf(target).name}.`
      : `${cardOf(mon).name} cướp ${take} máu tối đa từ ${cardOf(target).name}.`;
    if (killed) return { ...note(next, line, "heal"), mends: [{ uid: mon.uid, n: take }] };
    return flowerBite(next, foe, target.uid, mon.uid, take, line);
  }
  if (mon.cardId === "thuong-quan-long") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    const foes = them.field.filter((unit): unit is FieldMon => Boolean(unit && unit.hp > 0));
    if (foes.length === 0) return note(state, "Không có quái địch.");
    const landed = gunHits(extra);
    if (!landed) return state.reel ? state : openGunReel(state, uid);
    const before = you.stars;
    const cost = skillManaCost(mon.cardId, 1);
    const paid = pay(you, cost);
    if (!paid) return note(state, "Cần 1 gem.");
    const text = skillText(mon.cardId);
    const barrels = [
      { key: "phys" as const, n: grabNums(text, /(\d+)\s*sát thương vật lý/gi)[0] ?? 6 },
      { key: "spell" as const, n: grabNums(text, /(\d+)\s*sát thương phép/gi)[0] ?? 5 },
      { key: "tru" as const, n: grabNums(text, /(\d+)\s*sát thương chuẩn/gi)[0] ?? 4 },
    ].filter((barrel) => landed.includes(barrel.key));
    const shaved = shaveHex(mon, {
      phys: barrels.reduce((sum, barrel) => sum + (barrel.key === "phys" ? barrel.n : 0), 0),
      spell: barrels.reduce((sum, barrel) => sum + (barrel.key === "spell" ? barrel.n : 0), 0),
      tru: barrels.reduce((sum, barrel) => sum + (barrel.key === "tru" ? barrel.n : 0), 0),
    });
    const tuned = favorShots(
      mon,
      barrels.map((barrel) => ({ kind: barrel.key, n: shaved[barrel.key] })),
    );
    for (let index = 0; index < barrels.length; index += 1) barrels[index] = { key: tuned[index].kind, n: tuned[index].n };
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    if (barrels.length === 0) return next;
    const pool = shuffle(foes);
    const shots = barrels.map((barrel, index) => ({
      barrel,
      uid: (index < pool.length ? pool[index] : pool[Math.floor(Math.random() * pool.length)]).uid,
    }));
    let field = next.players[foe].field;
    const hits: string[] = [];
    const byTarget = new Map<string, { name: string; phys: number; spell: number; tru: number; physShot: boolean; spellShot: boolean; truShot: boolean }>();
    const bump = (id: string, name: string, kind: "phys" | "spell" | "tru", n: number) => {
      const row = byTarget.get(id) ?? { name, phys: 0, spell: 0, tru: 0, physShot: false, spellShot: false, truShot: false };
      row[kind] += n;
      if (kind === "phys") row.physShot = true;
      if (kind === "spell") row.spellShot = true;
      if (kind === "tru") row.truShot = true;
      byTarget.set(id, row);
    };
    for (const shot of shots) {
      const real = shuntUid(field, shot.uid) ?? shot.uid;
      const target = field.find((unit) => unit?.uid === real);
      if (!target) continue;
      hits.push(real);
      if (shot.barrel.key === "spell") {
        const landedN = spellLanded(target, shot.barrel.n, field, mon);
        bump(real, cardOf(target).name, "spell", shownTru(target, landedN, field));
        field = field.map((unit) => (unit?.uid === real ? damageSpell(unit, shot.barrel.n, field, mon) : unit));
      } else if (shot.barrel.key === "phys") {
        const raw = outgoing(mon, shot.barrel.n);
        if (target.cardId === "chien-binh-rong") {
          const hit = takePhysical(target, raw, field);
          bump(real, cardOf(target).name, "phys", Math.max(0, target.hp - hit.mon.hp));
          field = field.map((unit) => (unit?.uid === real ? hit.mon : unit));
        } else {
          const rawN = hurt(target, Math.max(0, raw - liveDef(target, field)));
          bump(real, cardOf(target).name, "phys", shownTru(target, rawN, field));
          field = field.map((unit) => (unit?.uid === real ? applyIncoming(unit, rawN, field).mon : unit));
        }
      } else {
        const raw = outgoing(mon, shot.barrel.n);
        if (target.cardId === "chien-binh-rong") {
          const slice = third(raw);
          const queued = pushDebt(target, { p: 0, s: 0, t: slice });
          const rawHit = hurt(queued, slice);
          bump(real, cardOf(target).name, "tru", shownTru(queued, rawHit, field));
          field = field.map((unit) => (unit?.uid === real ? applyIncoming(queued, rawHit, field).mon : unit));
        } else {
          const rawN = hurt(target, raw);
          bump(real, cardOf(target).name, "tru", shownTru(target, rawN, field));
          field = field.map((unit) => (unit?.uid === real ? applyIncoming(unit, rawN, field).mon : unit));
        }
      }
    }
    next = patch(next, foe, settleCocoon(dropDead({ ...next.players[foe], field })));
    const spinRows = [...byTarget.values()].map((row) => {
      const parts = [
        row.physShot ? `${row.phys} sát thương vật lý` : "",
        row.spellShot ? `${row.spell} sát thương phép` : "",
        row.truShot ? `${row.tru} sát thương chuẩn` : "",
      ].filter(Boolean);
      return { name: row.name, bits: parts.join(", ") };
    });
    if (spinRows.length === 0) return next;
    const noted = note(next, aimNotice(castName(mon.cardId, skillIndex), spinRows) ?? `${cardOf(mon).name} gây ${spinRows[0]?.bits ?? "0 sát thương"}.`, "spell");
    return checkWinner({ ...noted, skill: { id: mon.cardId, index: 0, aim: null, hits } });
  }
  if (isHell(mon.cardId)) {
    const them = state.players[foe];
    const target = targetUid ? them.field.find((unit) => unit?.uid === targetUid) ?? null : null;
    if (targetUid && !target) return note(state, "Chọn một quái đối thủ.");
    const cost = skillManaCost(mon.cardId, 1);
    const before = you.stars;
    const paid = pay(you, cost);
    if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
    const armed = pingStars(patch(state, side, paid), side, before, paid.stars);
    const caster = armed.players[side].field.find((unit) => unit?.uid === uid) ?? mon;
    if (!target) {
      const figures = hellFigures(mon.cardId);
      if (caster.skillUp) figures.spell += caster.skillUp;
      const shaved = shaveHex(caster, figures);
      const shot = {
        phys: outgoing(caster, shaved.phys),
        spell: outgoing(caster, shaved.spell),
        tru: outgoing(caster, shaved.tru),
      };
      const dealt = shot.phys + shot.spell + shot.tru;
      const field = armed.players[side].field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
      let next = patch(armed, side, { ...armed.players[side], field });
      const foePlayer = next.players[foe];
      next = patch(next, foe, { ...foePlayer, hp: foePlayer.hp - dealt });
      return checkWinner(note(next, actNotice(castName(mon.cardId, skillIndex), hellLine(shot, "người chơi")), "spell"));
    }
    return resolveHell(armed, caster, target);
  }
  if (mon.cardId === "kiem-si-lua-thieng") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
    const them = state.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ");
    targetUid = shuntUid(them.field, target.uid);
    const landed = them.field.find((unit) => unit?.uid === targetUid) ?? target;
    if (skillIndex > 0) {
      const bite = grabNums(skillText(mon.cardId), /tiêu(?:\s*hao)?\s*(\d+)\s*máu/gi)[0] ?? 2;
      if (mon.hp <= bite) return note(state, `Không đủ máu. Skill này sẽ khiến ${cardOf(mon).name} mất mạng.`);
      const amount = skillFigure(mon.cardId, "dmg", 7, 1) + (mon.skillUp ?? 0);
      const yourField = you.field.map((unit) => (unit?.uid === uid ? { ...unit, hp: unit.hp - bite, dim: unit.hp - bite > 0 } : unit));
      const foeField = them.field.map((unit) => (unit?.uid === landed.uid ? damageSpell(unit, amount, them.field, mon) : unit));
      let next = patch(state, side, dropDead({ ...you, field: yourField }));
      next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
      return armEcho(note(next, `${castName(mon.cardId, skillIndex)} đổi ${bite} máu lấy ${spellLanded(landed, amount, them.field, mon)} sát thương phép`, "spell"), uid);
    }
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem");
    const amount = skillFigure(mon.cardId, "dmg", 5) + (mon.skillUp ?? 0);
    const hit = damageSpell(landed, amount, them.field, mon);
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    const foeField = them.field.map((unit) => (unit?.uid === landed.uid ? hit : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
    return armEcho(note(next, `${castName(mon.cardId, skillIndex)} gây ${spellLanded(landed, amount, them.field, mon)} sát thương phép`, "spell"), uid);
  }
  if (mon.cardId === "mo-voi-ma-mut") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem.");
    const them = state.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ.");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const landed = them.field.find((unit) => unit?.uid === real) ?? target;
    const amount = mon.hp;
    const hit = damageSpell(landed, amount, undefined, mon);
    const marked = hit.hp > 0 ? stampErode(hit, side, null) : hit;
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? null : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    next = patch(next, foe, dropDead({ ...them, field: them.field.map((unit) => (unit?.uid === landed.uid ? marked : unit)) }));
    const line =
      marked.hp > 0
        ? `${castName(mon.cardId, skillIndex)} hy sinh, gây ${spellLanded(landed, amount, undefined, mon)} sát thương phép và bào mòn ${cardOf(target).name}.`
        : `${castName(mon.cardId, skillIndex)} hy sinh, gây ${spellLanded(landed, amount, undefined, mon)} sát thương phép.`;
    return note(next, line, "spell");
  }
  if (mon.cardId === QUEEN_KNIGHT) {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ.");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const victim = them.field.find((unit) => unit?.uid === real && unit.hp > 0) ?? target;
    return strikeQueenSword(state, side, mon, foe, victim);
  }
  if (mon.cardId === "phu-thuy-rung-den") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ.");
    const before = you.stars;
    const cost = skillManaCost(mon.cardId, 1);
    const paid = pay(you, cost);
    if (!paid) return note(state, "Cần 1 mana.");
    const foeField = them.field.map((unit) => (unit?.uid === target.uid ? { ...unit, hex: { left: 6 } } : unit));
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    next = patch(next, foe, { ...them, field: foeField });
    return note(next, `${castName(mon.cardId, skillIndex)} lên ${cardOf(target).name}.`);
  }
  if (mon.cardId === "ong-khong-lo") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem.");
    const them = state.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ.");
    const turns = grabNums(skillText(mon.cardId), /(\d+)\s*lượt/gi)[0] ?? 5;
    const foeField = them.field.map((unit) => (unit?.uid === target.uid ? { ...unit, stun: turns } : unit));
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    next = patch(next, foe, { ...them, field: foeField });
    return note(next, `${castName(mon.cardId, skillIndex)} trong ${turns} lượt.`);
  }
  if (mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    if ((mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi") && !targetUid) {
      const before = you.stars;
      const paid = pay(you, skillManaCost(mon.cardId, 1));
      if (!paid) return note(state, "Cần 1 gem.");
      const tru = grabNums(skillText(mon.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2;
      const spell = grabNums(skillText(mon.cardId), /(\d+)\s*sát thương phép/gi)[0] ?? 1;
      const pack = shaveHex(mon, { spell: spell + (mon.skillUp ?? 0), phys: 0, tru });
      const truDealt = outgoing(mon, pack.tru) + charmDamage;
      const spellDealt = outgoing(mon, pack.spell) + charmDamage;
      const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
      let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
      next = patch(next, foe, { ...next.players[foe], hp: next.players[foe].hp - truDealt - spellDealt });
      return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${truDealt} sát thương chuẩn và ${spellDealt} sát thương phép lên người chơi.`, "spell"));
    }
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ.");
    const before = you.stars;
    const paid = pay(you, skillManaCost(mon.cardId, 1));
    if (!paid) return note(state, "Cần 1 gem.");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const victim = them.field.find((unit) => unit?.uid === real) ?? target;
    const tru = grabNums(skillText(mon.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2;
    const spell = grabNums(skillText(mon.cardId), /(\d+)\s*sát thương phép/gi)[0] ?? 2;
    const pack = shaveHex(mon, { spell: spell + (mon.skillUp ?? 0), phys: 0, tru });
    const truRaw = outgoing(mon, pack.tru) + charmDamage;
    const truNow = victim.cardId === "chien-binh-rong" ? third(truRaw) : outgoing(mon, pack.tru);
    const spellDealt = spellLanded(victim, pack.spell, them.field, mon);
    const spellShown = Math.max(0, spellDealt - Math.min(phantomPool(victim, them.field), spellDealt));
    const truDealt = shownTru(victim, hurt(victim, truNow), them.field, spellDealt);
    const burned = trueDamage(damageSpell(victim, pack.spell, them.field, mon), outgoing(mon, pack.tru), them.field, veilLeft(victim, spellDealt));
    const foeField = them.field.map((unit) => (unit?.uid === real ? burned : unit));
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    next = patch(next, foe, dropDead({ ...them, field: foeField }));
    return note(next, `${castName(mon.cardId, skillIndex)} gây ${truDealt} sát thương chuẩn và ${spellShown} sát thương phép.`, "spell");
  }
  if (mon.cardId === "rong-phun-hoa-cau") {
    if (skillIndex > 0) {
      if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
      const them = state.players[foe];
      if (!targetUid) {
        const before = you.stars;
        const paid = pay(you, 1);
        if (!paid) return note(state, "Cần 1 gem.");
        const amount = skillFigure(mon.cardId, "dmg", 3) + (mon.skillUp ?? 0);
        const dealt = outgoing(mon, amount + charmDamage);
        const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
        let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
        next = patch(next, foe, { ...next.players[foe], hp: next.players[foe].hp - dealt });
        return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
      }
      const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
      if (!target) return note(state, "Chọn một quái đối thủ");
      const before = you.stars;
      const paid = pay(you, 1);
      if (!paid) return note(state, "Cần 1 gem.");
      const real = shuntUid(them.field, target.uid) ?? target.uid;
      const loss = skillLoss(mon.cardId, "mdef", 1);
      const amount = skillFigure(mon.cardId, "dmg", 3) + (mon.skillUp ?? 0);
      const foeField = them.field.map((unit) => {
        if (unit?.uid !== real) return unit;
        return { ...damageSpell(unit, amount, them.field, mon), mdef: unit.mdef - loss };
      });
      const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
      let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
      next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
      return note(next, `${castName(mon.cardId, skillIndex)} giảm ${loss} thủ phép và gây ${spellPhrase([them.field.find((unit) => unit?.uid === real)], amount, them.field, mon)}`, "spell");
    }
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    const before = you.stars;
    const cost = skillManaCost(mon.cardId);
    const paid = payCost(you, cost);
    if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    if (state.mode !== "ai" || side === 0) next = { ...next, glimpse: them.reserve.map((card) => card.id) };
    return note(next, `${castName(mon.cardId, skillIndex)} quái dự bị.`);
  }
  if (mon.cardId === "ga-he-dang-so") {
    if (skillIndex === 0) {
      const before = you.stars;
      const paid = pay(you, 1);
      if (!paid) return note(state, "Cần 1 gem.");
      const yourField = paid.field.map((unit) =>
        unit?.uid === uid ? { ...unit, charge: unit.charge + 1, held: true, dim: true } : unit,
      );
      return note(
        pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars),
        `${castName(mon.cardId, skillIndex)} năng lượng.`,
      );
    }
    if (mon.charge < 2) return note(state, "Chưa đủ năng lượng để thi triển.");
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const amount = skillFigure(mon.cardId, "dmg", 5) + skillFigure(mon.cardId, "dmg", 4, 1) * Math.floor((mon.charge - 2) / 2) + (mon.skillUp ?? 0);
    const yourField = you.field.map((unit) => (unit?.uid === uid ? { ...unit, charge: 0, held: false, dim: true } : unit));
    let next = patch(state, side, { ...you, field: yourField });
    const them = next.players[foe];
    if (!targetUid) {
      const dealt = outgoing(mon, amount);
      next = patch(next, foe, { ...them, hp: them.hp - dealt });
      return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt + charmDamage} sát thương phép lên người chơi.`, "spell"));
    }
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một mục tiêu.");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const foeField = them.field.map((unit) => (unit?.uid === real ? damageSpell(unit, amount, undefined, mon) : unit));
    next = patch(next, foe, dropDead({ ...them, field: foeField }));
    return note(next, `${castName(mon.cardId, skillIndex)} gây ${spellLanded(them.field.find((unit) => unit?.uid === real) ?? target, amount, undefined, mon)} sát thương phép.`, "spell");
  }
  if (mon.cardId === "cuc-bong-ma-quai") {
    const spent = mon.shed ?? [];
    if (skillIndex === 0) {
      // Phát nổ: no mana, it destroys itself and deals spell damage equal to its attack to an enemy monster.
      const them = state.players[foe];
      const target = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
      if (!target) return note(state, "Chọn một quái đối thủ.");
      const real = shuntUid(them.field, target.uid) ?? target.uid;
      const landed = them.field.find((unit) => unit?.uid === real) ?? target;
      const amount = outgoing(mon, liveAtk(mon));
      const foeField = them.field.map((unit) => (unit?.uid === landed.uid ? damageSpell(unit, amount, them.field, mon) : unit));
      const yourField = you.field.map((unit) => (unit?.uid === uid ? null : unit));
      const next = patch(patch(state, side, { ...you, field: yourField }), foe, settleCocoon(dropDead({ ...them, field: foeField })));
      return note(next, `${castName(mon.cardId, 0)} tự huỷ, gây ${spellLanded(landed, amount, them.field, mon)} sát thương phép lên ${cardOf(landed).name}.`, "spell");
    }
    // Pháo kích: 1 mana, copies itself into an empty slot. Not counted as having acted. Each kind of skill is used once.
    if (spent.includes("barrage")) return note(state, "Pháo kích đã biến mất.");
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem.");
    const field = [...paid.field] as Player["field"];
    const slot = field.findIndex((unit, at) => !unit && (paid.locked?.[at] ?? 0) === 0);
    if (slot < 0) return note(state, "Không đủ ô trống.");
    const seq = state.seq + 1;
    field[slot] = { ...place({ ...state, seq }, side, mon.cardId), copy: true, shed: [...spent] };
    const yourField = field.map((unit) => (unit?.uid === uid ? { ...unit, shed: [...spent, "barrage"] } : unit)) as Player["field"];
    return note(
      pingStars(patch({ ...state, seq: seq + 1 }, side, { ...paid, field: yourField }), side, before, paid.stars),
      `${castName(mon.cardId, 1)}: ${cardOf(mon).name} nhân bản chính nó.`,
    );
  }
  if (mon.cardId === "te-giac-be-con") {
    if ((mon.level ?? 1) >= 3) return note(state, "Đã đạt cấp cuối.");
    const nextLevel = (mon.level ?? 1) + 1;
    const cost = rhinoRankCost(mon.level ?? 1);
    const before = you.stars;
    const paid = pay(you, cost);
    if (!paid) return note(state, cost === 1 ? "Cần 1 gem." : `Cần ${cost} gem.`);
    const form = rhinoForm(nextLevel);
    const heal = skillFigure(mon.cardId, "heal", 2);
    const yourField = paid.field.map((unit) =>
      unit?.uid === uid
        ? {
            ...unit,
            level: nextLevel,
            atk: form.atk,
            def: form.def,
            mdef: form.mdef,
            hp: Math.min(form.hp, unit.hp + heal),
            maxHp: form.hp,
            dim: true,
          }
        : unit,
    );
    return note(
      pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars),
      `${form.name} thăng cấp, hồi ${heal} máu.`,
      "heal",
    );
  }
  if (mon.cardId === "ma-dao-si") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const before = you.stars;
    const paid = pay(you, skillManaCost(mon.cardId, 1));
    if (!paid) return note(state, "Cần 1 mana.");
    const text = skillText(mon.cardId);
    const packets = favorShots(mon, bulletRamp(text).map((n) => ({ kind: "spell" as const, n }))).map((shot) => shot.n);
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    const them = next.players[foe];
    const name = castName(mon.cardId, skillIndex);
    if (!targetUid) {
      const vols: number[] = [];
      for (const each of packets) vols.push(outgoing(mon, each + charmDamage));
      const dealt = vols.reduce((sum, n) => sum + n, 0);
      next = patch(next, foe, { ...them, hp: them.hp - dealt });
      const noted = checkWinner(note(next, `${name} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
      return { ...noted, skill: { id: mon.cardId, index: skillIndex, aim: null, hits: vols.map(() => `face:${foe}`), vols } };
    }
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một mục tiêu.");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    let victim = them.field.find((unit) => unit?.uid === real) ?? target;
    const vols: number[] = [];
    for (const each of packets) {
      vols.push(spellLanded(victim, each, them.field, mon));
      victim = damageSpell(victim, each, them.field, mon);
    }
    const dealt = vols.reduce((sum, n) => sum + n, 0);
    next = patch(next, foe, dropDead({ ...them, field: them.field.map((unit) => (unit?.uid === real ? victim : unit)) }));
    const noted = note(next, `${name} gây ${dealt} sát thương phép.`, "spell");
    return { ...noted, skill: { id: mon.cardId, index: skillIndex, aim: real, hits: vols.map(() => real), vols } };
  }
  if (mon.cardId === "loi-nguyen-cua-rong") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    const picked = them.field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
    if (!picked) return note(state, "Chọn một quái đối thủ.");
    const before = you.stars;
    const cost = skillManaCost(mon.cardId, 0);
    const paid = payCost(you, cost);
    if (!paid) return note(state, "Không đủ mana.");
    const amount = grabNums(skillText(mon.cardId), /(\d+)\s*sát thương chuẩn/gi)[0] ?? 2;
    const blow = outgoing(mon, amount);
    const vow = mon.skillUp ?? 0;
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    const curseRows = them.field.filter((unit): unit is FieldMon => Boolean(unit && unit.hp > 0)).map((unit) => {
      const total = blow + (unit.uid === picked.uid ? vow : 0) + charmDamage;
      const rawN = unit.cardId === "chien-binh-rong" ? hurt(unit, third(total)) : hurt(unit, total);
      const n = shownTru(unit, rawN, them.field);
      return { name: cardOf(unit).name, bits: `${n} sát thương chuẩn` };
    });
    const hits: string[] = [];
    const foeField = spray(them.field, (unit, allies) => {
      if (unit.hp > 0) hits.push(unit.uid);
      return trueDamage(unit, blow + (unit.uid === picked.uid ? vow : 0), allies);
    });
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
    const lone = curseRows[0]?.bits ?? `${blow} sát thương chuẩn`;
    const noted = note(next, aimNotice(castName(mon.cardId, skillIndex), curseRows) ?? `${castName(mon.cardId, skillIndex)} gây ${lone}.`, "hit");
    return { ...noted, skill: { id: mon.cardId, index: skillIndex, aim: targetUid, hits } };
  }
  if (mon.cardId === "phu-thuy-ti-hon") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem.");
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    const amount = 3 + next.players[side].stars + (mon.skillUp ?? 0);
    const them = next.players[foe];
    if (!targetUid) {
      const dealt = outgoing(mon, amount);
      next = patch(next, foe, { ...them, hp: them.hp - dealt });
      return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt + charmDamage} sát thương phép lên người chơi.`, "spell"));
    }
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một mục tiêu.");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const foeField = them.field.map((unit) => (unit?.uid === real ? damageSpell(unit, amount, undefined, mon) : unit));
    next = patch(next, foe, dropDead({ ...them, field: foeField }));
    return note(next, `${castName(mon.cardId, skillIndex)} gây ${spellLanded(them.field.find((unit) => unit?.uid === real) ?? target, amount, undefined, mon)} sát thương phép.`, "spell");
  }
  if (mon.cardId === "phu-thuy-thoi-gian") {
    const name = castName(mon.cardId, skillIndex);
    const dimSelf = (field: Array<FieldMon | null>) => field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    if (skillIndex === 2) {
      if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
      const before = you.stars;
      const paid = pay(you, 2);
      if (!paid) return note(state, "Cần 2 mana.");
      if (!wheelLanded(extra)) return breakWitch(state, side, paid, uid, before);
      const yourField = paid.field.map((unit) => {
        if (!unit) return unit;
        if (unit.uid === uid) return { ...unit, dim: true };
        return timeWave(unit, false);
      });
      const foeField = state.players[foe].field.map((unit) => (unit ? timeWave(unit, true) : unit));
      let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
      next = patch(next, foe, dropDead({ ...next.players[foe], field: foeField }));
      next = patch(next, side, dropDead(next.players[side]));
      const killed: string[] = [];
      const foeBorn: string[] = [];
      const foeBuff: string[] = [];
      const grown: string[] = [];
      const allyBorn: string[] = [];
      const evolved = (beforeMon: FieldMon, afterMon: FieldMon) => afterMon.cardId !== beforeMon.cardId || (afterMon.level ?? 1) !== (beforeMon.level ?? 1);
      for (const unit of state.players[foe].field) {
        if (!unit || unit.hp <= 0) continue;
        const after = timeWave(unit, true);
        if (!after) killed.push(cardOf(unit).name);
        else if (evolved(unit, after)) foeBorn.push(`- Lão hoá tiến hoá ${cardOf(unit).name} thành ${cardOf(after).name}`);
        else foeBuff.push(cardOf(unit).name);
      }
      for (const unit of paid.field) {
        if (!unit || unit.hp <= 0 || unit.uid === uid) continue;
        const after = timeWave(unit, false);
        if (!after || after === unit) continue;
        if (evolved(unit, after)) allyBorn.push(`- Lão hoá tiến hoá ${cardOf(unit).name} thành ${cardOf(after).name}`);
        else grown.push(cardOf(unit).name);
      }
      const lines = ["Dòng chảy thời gian quét cả sân"];
      if (killed.length) lines.push(`- Lão hoá tiêu diệt ${killed.join(", ")}`);
      lines.push(...foeBorn);
      if (foeBuff.length) lines.push(`- Lão hoá cường hoá ${foeBuff.join(", ")}, tăng 35% chỉ số`);
      if (grown.length) lines.push(`- Lão hoá làm trưởng thành ${grown.join(", ")}, tăng 35% chỉ số`);
      lines.push(...allyBorn);
      return note(next, lines.join("\n"), "spell");
    }
    const ally = you.field.find((unit) => unit?.uid === targetUid && unit.uid !== uid) ?? null;
    const enemy = state.players[foe].field.find((unit) => unit?.uid === targetUid) ?? null;
    const target = ally ?? enemy;
    if (!target) return note(state, "Chọn một mục tiêu.");
    if (enemy && !canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    if (skillIndex === 1) {
      if (!wheelLanded(extra)) return breakWitch(state, side, you, uid, you.stars);
      const yourBase = dimSelf(you.field);
      const put = (nextMon: FieldMon | null, line: string, tone: Duel["tone"]) => {
        if (enemy) {
          const foeField = state.players[foe].field.map((unit) => (unit?.uid === enemy.uid ? nextMon : unit));
          let next = patch(state, side, { ...you, field: yourBase });
          next = patch(next, foe, dropDead({ ...state.players[foe], field: foeField }));
          return note(next, line, tone);
        }
        const yourField = yourBase.map((unit) => (unit?.uid === target.uid ? nextMon : unit));
        return note(patch(state, side, { ...you, field: yourField }), line, tone);
      };
      if (target.cardId === "rong-con" || (ally && isSpecial(ally))) {
        const born = target.cardId === "rong-con" ? evolveImmortal(target) : evolveSpecial(ally!);
        return put(born, `${name} tiến hoá ${cardOf(born).name} đến dạng cuối.`, "spell");
      }
      if (isImmortal(target)) {
        const boosted = buffMon(target);
        return put(boosted, `${name} cường hoá ${cardOf(boosted).name}, tăng 35% chỉ số.`, "heal");
      }
      if (enemy) return put(null, `${name} cường hoá và tiêu diệt ${cardOf(enemy).name}.`, "spell");
      return note(patch(state, side, { ...you, field: yourBase }), `${name} không có tác dụng lên ${cardOf(target).name}.`);
    }
    if (enemy && isImmortal(enemy)) return note(state, "Không chọn được kẻ địch bất tử.");
    if (ally && cardStars(ally.cardId, ally.level ?? 1) >= 3) return note(state, "Lão hoá thường chỉ ảnh hưởng đồng minh từ 2 sao trở xuống.");
    const yourBase = dimSelf(you.field);
    if (enemy) {
      const aged = ageMon(enemy);
      const foeField = state.players[foe].field.map((unit) => (unit?.uid === enemy.uid ? aged : unit));
      let next = patch(state, side, { ...you, field: yourBase });
      next = patch(next, foe, dropDead({ ...state.players[foe], field: foeField }));
      return note(next, `${name} lão hoá ${cardOf(enemy).name}, giảm 35% chỉ số.`, "spell");
    }
    const grown = buffMon(ally!);
    const yourField = yourBase.map((unit) => (unit?.uid === ally!.uid ? grown : unit));
    return note(patch(state, side, { ...you, field: yourField }), `Lão hoá trưởng thành hoá ${cardOf(ally!).name}, tăng 35% chỉ số.`, "heal");
  }
  if (mon.cardId === "trieu-hoi-ac-ma") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
    const them = state.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ");
    const wet = (target.wet ?? 0) > 0;
    const base = skillFigure(mon.cardId, "dmg", 5);
    const bonus = grabNums(skillText(mon.cardId), /nhận thêm\s*(\d+)/gi)[0] ?? 2;
    const plain = (wet ? base + bonus : base);
    const ids = [target.uid];
    if (wet) for (const unit of them.field) if (unit && unit.uid !== target.uid && (unit.wet ?? 0) > 0) ids.push(unit.uid);
    let foeField = them.field;
    for (const id of ids) {
      const real = shuntUid(foeField, id) ?? id;
      const amount = plain + (id === target.uid ? (mon.skillUp ?? 0) : 0);
      foeField = foeField.map((unit) => (unit?.uid === real ? damageSpell(unit, amount, foeField, mon) : unit));
    }
    const yourField = you.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = patch(state, side, { ...you, field: yourField });
    next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
    const aims = ids.map((id) => them.field.find((unit) => unit?.uid === (shuntUid(them.field, id) ?? id))).filter((unit): unit is FieldMon => Boolean(unit));
    const demonRows = aims.map((unit) => {
      const blow = plain + (unit.uid === target.uid ? (mon.skillUp ?? 0) : 0);
      return { name: cardOf(unit).name, bits: `${spellLanded(unit, blow, them.field, mon)} sát thương phép` };
    });
    const spread = wet && aims.length > 1 && new Set(aims.map((unit) => spellLanded(unit, plain, them.field, mon))).size === 1 ? "Đòn lan sang kẻ đang ẩm." : "";
    return note(next, aimNotice(castName(mon.cardId, skillIndex), demonRows, spread) ?? `${castName(mon.cardId, skillIndex)} gây ${spellPhrase(aims, plain, them.field, mon)}`, "spell");
  }
  if (mon.cardId === "yeu-tinh-chuc-phuc") {
    if (mon.dim) return note(state, "Yêu tinh đã hành động trong lượt này");
    const ally = you.field.find((unit) => unit?.uid === targetUid && unit.uid !== uid) ?? null;
    if (!ally) return note(state, "Chọn một quái đồng minh khác");
    const cost = skillManaCost(mon.cardId, 1);
    const paid = pay(you, cost);
    if (!paid) return note(state, "Cần 1 mana.");
    const atk = skillFigure(mon.cardId, "atk", 3);
    const dmg = skillFigure(mon.cardId, "dmg", 3);
    const guard = skillFigure(mon.cardId, "def", 1);
    const field = paid.field.map((unit) => {
      if (!unit) return unit;
      if (unit.uid === uid) return { ...unit, dim: true };
      if (unit.uid === ally.uid) return { ...unit, blessAtk: atk, blessDmg: dmg, nextDef: guard };
      return unit;
    });
    return note(patch(state, side, { ...paid, field }), `${castName(mon.cardId, skillIndex)} phù hộ ${cardOf(ally).name} cho đòn kế tiếp. +${atk} công, +${guard} thủ, +${dmg} sát thương phép.`, "heal");
  }
  if (mon.cardId === "sau-non") {
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem");
    const card = monsterCard("ken-ngai");
    const field = paid.field.map((unit) =>
      unit?.uid === uid && card
        ? {
            ...unit,
            cardId: "ken-ngai",
            atk: skillFigure("ken-ngai", "atk", card.atk),
            def: skillFigure("ken-ngai", "def", card.def),
            mdef: skillFigure("ken-ngai", "mdef", card.mdef),
            hp: skillFigure("ken-ngai", "hp", card.hp),
            maxHp: skillFigure("ken-ngai", "hp", card.hp),
            level: 0,
            dim: true,
            noBlock: true,
          }
        : unit,
    );
    return {
      ...note(pingStars(patch(state, side, { ...paid, field }), side, before, paid.stars), castName(mon.cardId, skillIndex)),
      legs: uid,
    };
  }
  if (mon.cardId === "ken-ngai") {
    if (skillIndex !== 1) return note(state, "Chân kén chỉ mọc lúc hoá kén");
    const age = mon.level ?? 0;
    if (age < 4 || age > 5) return note(state, age < 4 ? "Chưa đủ lượt để nở" : "Kén tự nở ở lượt 6");
      const legs = you.field.filter((unit) => unit?.host === uid);
      const born = hatchCocoon(mon);
      const field = you.field.map((unit) => {
        if (!unit || legs.some((leg) => leg?.uid === unit.uid)) return unit && legs.some((leg) => leg?.uid === unit.uid) ? null : unit;
        return unit.uid === uid ? born : unit;
      });
      return {
        ...note(patch(state, side, { ...you, field }), `${castName(mon.cardId, skillIndex)} ra ${cardOf(born).name}`, "heal"),
        mends: [{ uid: born.uid, n: 0 }],
      };
  }
  if (mon.cardId === "ngai-khong-lo" || mon.cardId === "ngai-nu-hoang" || mon.cardId === "ngai-hoan-my") {
    const picked = state.players[foe].field.find((unit) => unit?.uid === targetUid && unit.hp > 0) ?? null;
    if (!picked) return note(state, "Chọn một quái đối thủ.");
    const before = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 gem");
    const kind = mon.cardId === "ngai-khong-lo" ? "giant" : mon.cardId === "ngai-nu-hoang" ? "queen" : "perfect";
    const amount = skillFigure(mon.cardId, "dmg", kind === "giant" ? 4 : kind === "queen" ? 5 : 6);
    const hit = (unit: FieldMon, allies: Array<FieldMon | null>) => applyPoison(damageSpell(unit, amount + (unit.uid === picked.uid ? (mon.skillUp ?? 0) : 0), allies, mon), kind, side)!;
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    const foeField = spray(state.players[foe].field, hit);
    let next = pingStars(patch(state, side, settleCocoon(dropDead({ ...paid, field: yourField }))), side, before, paid.stars);
    next = patch(next, foe, settleCocoon(dropDead({ ...next.players[foe], field: foeField })));
    const foes = state.players[foe].field.filter((unit): unit is FieldMon => Boolean(unit && unit.hp > 0));
    const dustRows = foes.map((unit) => ({ name: cardOf(unit).name, bits: `${spellLanded(unit, amount + (unit.uid === picked.uid ? (mon.skillUp ?? 0) : 0), state.players[foe].field, mon)} sát thương phép` }));
    return note(next, aimNotice(castName(mon.cardId, skillIndex), dustRows) ?? `${castName(mon.cardId, skillIndex)} ${spellPhrase(foes, amount, state.players[foe].field, mon)}`, "spell");
  }
  if (mon.cardId === SHADE) {
    const beforeStars = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 mana.");
    const field = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, shown: 5, stored: 1 } : unit));
    return note(pingStars(patch(state, side, { ...paid, field }), side, beforeStars, paid.stars), `${cardOf(mon).name} dùng Ẩn mình. Đối thủ chỉ thấy thế thân.`, "spell");
  }
  if (mon.cardId === TIDE) {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const them = state.players[foe];
    const target = targetUid ? them.field.find((unit) => unit?.uid === targetUid) ?? null : null;
    if (targetUid && !target) return note(state, "Chọn một quái đối thủ.");
    const beforeStars = you.stars;
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 mana.");
    const amount = 2 + 3 * (mon.stored ?? 0) + (mon.skillUp ?? 0);
    const name = castName(mon.cardId, 0);
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, stored: 0, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, beforeStars, paid.stars);
    if (!target) {
      const dealt = outgoing(mon, amount + charmDamage);
      next = patch(next, foe, { ...next.players[foe], hp: next.players[foe].hp - dealt });
      return checkWinner(note(next, `${name} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
    }
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const foeField = them.field.map((unit) => (unit?.uid === real ? damageSpell(unit, amount, them.field, mon) : unit));
    next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
    const struck = them.field.find((unit) => unit?.uid === real) ?? target;
    return note(next, `${name} gây ${spellLanded(struck, amount, them.field, mon)} sát thương phép lên ${cardOf(struck).name}.`, "spell");
  }
  if (mon.cardId === "sua-hut-ma-phap") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
    const them = state.players[foe];
    const amount = skillFigure(mon.cardId, "dmg", 3) + (mon.stored ?? 0) + (mon.skillUp ?? 0);
    if (!targetUid) {
      const dealt = outgoing(mon, amount + charmDamage);
      const yourField = you.field.map((unit) => (unit?.uid === uid ? { ...unit, stored: 0, dim: true } : unit));
      let next = patch(state, side, { ...you, field: yourField });
      next = patch(next, foe, { ...next.players[foe], hp: next.players[foe].hp - dealt });
      return checkWinner(note(next, `${castName(mon.cardId, skillIndex)} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
    }
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một quái đối thủ");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const foeField = them.field.map((unit) => (unit?.uid === real ? damageSpell(unit, amount, them.field, mon) : unit));
    const yourField = you.field.map((unit) => (unit?.uid === uid ? { ...unit, stored: 0, dim: true } : unit));
    let next = patch(state, side, { ...you, field: yourField });
    next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
    const jelly = them.field.find((unit) => unit?.uid === real) ?? target;
    return note(next, `${castName(mon.cardId, skillIndex)} ${spellLanded(jelly, amount, them.field, mon)} sát thương phép`, "spell");
  }
  if (mon.cardId === "trai-tim-hai-long") {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ");
    const base = skillIndex === 0;
    const all = skillIndex === 2;
    const costs = grabNums(skillText(mon.cardId), /thêm\s*(\d+)\s*mana/gi);
    const cost = base ? 0 : all ? (costs[1] ?? 2) : (costs[0] ?? 1);
    const before = you.stars;
    const paid = cost > 0 ? pay(you, cost) : you;
    if (!paid) return note(state, `Cần ${cost} mana`);
    const them = state.players[foe];
    const amount = skillFigure(mon.cardId, "dmg", base ? 4 : all ? 6 : 5, base ? 0 : all ? 2 : 1);
    const living = them.field.filter((unit) => unit && unit.hp > 0);
    let victims: string[] = [];
    if (all) {
      if (!them.field.some((unit) => unit?.uid === targetUid && unit.hp > 0)) return note(state, "Chọn một quái đối thủ.");
      victims = living.map((unit) => unit!.uid);
    } else {
      const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
      if (!target) return note(state, "Chọn một quái đối thủ");
      if (base) victims = [target.uid];
      else {
        const pool = living.filter((unit) => unit!.uid !== target.uid);
        const extra = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)]!.uid : null;
        victims = extra ? [target.uid, extra] : [target.uid];
      }
    }
    let foeField = them.field;
    for (const id of victims) {
      const covered = redirectCover(foeField, id) ?? id;
      const real = shuntUid(foeField, covered) ?? covered;
      foeField = foeField.map((unit) => (unit?.uid === real ? { ...damageSpell(unit, amount, foeField, mon), wet: Math.max(unit.wet ?? 0, 2) } : unit));
    }
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = pingStars(patch(state, side, { ...paid, field: yourField }), side, before, paid.stars);
    let foePlayer = settleCocoon(dropDead({ ...them, field: foeField }));
    them.field.forEach((unit, index) => {
      const now = foePlayer.field[index];
      if (unit && unit.hp > 0 && (!now || now.hp <= 0)) foePlayer = lockIndex(foePlayer, index);
    });
    next = patch(next, foe, foePlayer);
    const title = all ? "Đại thuỷ triều huỷ diệt" : base ? "Triều lên" : "Con nước lớn tàn phá";
    const tideAims = victims.map((id) => them.field.find((unit) => unit?.uid === (shuntUid(them.field, redirectCover(them.field, id) ?? id) ?? id))).filter((unit): unit is FieldMon => Boolean(unit));
    const tideRows = tideAims.map((unit) => ({ name: cardOf(unit).name, bits: `${spellLanded(unit, amount, them.field, mon)} sát thương phép` }));
    return note(next, aimNotice(title, tideRows) ?? `${title} gây ${spellPhrase(tideAims, amount, them.field, mon)}`, "spell");
  }
  if (mon.cardId === "may-quay-thuong" && skillIndex === 1) {
    if (!canTargetFoe(state)) return note(state, "Lượt đầu không được nhắm đối thủ.");
    const paid = pay(you, 1);
    if (!paid) return note(state, "Cần 1 mana.");
    const amount = (mon.misses ?? 0) + 3;
    const name = castName(mon.cardId, 1);
    const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, dim: true } : unit));
    let next = patch(state, side, { ...paid, field: yourField });
    if (!targetUid) {
      const them = next.players[foe];
      const dealt = outgoing(mon, amount);
      next = patch(next, foe, { ...them, hp: them.hp - dealt });
      return checkWinner(note(next, `${name} gây ${dealt} sát thương phép lên người chơi.`, "spell"));
    }
    const them = next.players[foe];
    const target = them.field.find((unit) => unit?.uid === targetUid) ?? null;
    if (!target) return note(state, "Chọn một mục tiêu.");
    const real = shuntUid(them.field, target.uid) ?? target.uid;
    const foeField = them.field.map((unit) => (unit?.uid === real ? damageSpell(unit, amount, them.field, mon) : unit));
    next = patch(next, foe, dropDead({ ...them, field: foeField }));
    const landed = them.field.find((unit) => unit?.uid === real) ?? target;
    return note(next, `${name} gây ${spellLanded(landed, amount, them.field, mon)} sát thương phép.`, "spell");
  }
  return note(state, "Kỹ năng này chưa được gắn vào ván đấu");
}

export function answerLegs(state: Duel, count: number): Duel {
  const uid = state.legs;
  if (!uid || state.winner) return { ...state, legs: null };
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid && unit.cardId === "ken-ngai" && unit.hp > 0) ?? null;
  if (!mon || count <= 0) return note({ ...state, legs: null }, "Kén không mọc chân");
  const open = you.field
    .map((unit, index) => (!unit && (you.locked?.[index] ?? 0) === 0 ? index : -1))
    .filter((index) => index >= 0);
  const room = Math.min(1, count, open.length);
  if (room <= 0) return note({ ...state, legs: null }, "Không còn ô trống để mọc chân");
  if (you.orb < 1) return note({ ...state, legs: null }, "Cần 1 mana để mọc chân");
  const paid = pay(you, 1);
  if (!paid) return note({ ...state, legs: null }, "Cần 1 mana để mọc chân");
  const field = [...paid.field] as Player["field"];
  let seq = state.seq;
  const legHp = skillFigure("chan-ken", "hp", skillFigure("ken-ngai", "hp", 2, 1));
  for (let index = 0; index < room; index += 1) {
    seq += 1;
    const slot = open[index]!;
    field[slot] = { ...place({ ...state, seq }, side, "chan-ken"), host: uid, hp: legHp, maxHp: legHp };
  }
  return note(
    patch({ ...state, seq: seq + 1, legs: null }, side, { ...paid, field }),
    room === 1 ? "Kén mọc một chân" : `Kén mọc ${room} chân`,
  );
}

function followBite(cardId: string): number {
  const hit = /tiêu thêm\s+(\d+)\s*máu/i.exec(skillText(cardId));
  const value = hit ? Number(hit[1]) : 2;
  return Number.isFinite(value) ? value : 2;
}

function lastStrike(cardId: string): { hp: number; mana: number; spell: number; tru: number } {
  const hit = /tiêu hao thêm\s+(\d+)\s*máu và\s+(\d+)\s*mana[\s\S]*?(\d+)\s*sát thương phép và\s+(\d+)\s*sát thương chuẩn/i.exec(skillText(cardId));
  const hp = hit ? Number(hit[1]) : 3;
  const mana = hit ? Number(hit[2]) : 1;
  const spell = hit ? Number(hit[3]) : 4;
  const tru = hit ? Number(hit[4]) : 2;
  return {
    hp: Number.isFinite(hp) ? hp : 3,
    mana: Number.isFinite(mana) ? mana : 1,
    spell: Number.isFinite(spell) ? spell : 4,
    tru: Number.isFinite(tru) ? tru : 2,
  };
}

function armEcho(state: Duel, uid: string): Duel {
  const mon = [...state.players[0].field, ...state.players[1].field].find((unit) => unit?.uid === uid);
  const bite = mon ? followBite(mon.cardId) : 2;
  if (!mon || mon.hp <= bite) return { ...state, echo: null };
  return { ...state, echo: uid };
}

function armLast(state: Duel, uid: string): Duel {
  const mon = [...state.players[0].field, ...state.players[1].field].find((unit) => unit?.uid === uid);
  if (!mon || mon.hp <= 0) return { ...state, last: null };
  const side = (state.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1) as Side;
  const cost = lastStrike(mon.cardId);
  if (mon.hp <= cost.hp || state.players[side].orb < cost.mana) return { ...state, last: null };
  return { ...state, last: uid };
}

export function swordFollow(state: Duel, targetUid: string | null, committed = false): Duel {
  const uid = state.echo;
  if (!uid || state.winner) return state;
  if (!committed && state.step !== "main") return state;
  const side = state.turn;
  const foe = (1 - side) as Side;
  if (!targetUid) return note({ ...state, echo: null }, `${monsterCard("kiem-si-lua-thieng")?.name ?? ""} không đánh thêm`);
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon) return { ...state, echo: null };
  const bite = followBite(mon.cardId);
  if (mon.hp <= bite) return note({ ...state, echo: null }, `Không đủ máu. Đòn thêm sẽ khiến ${cardOf(mon).name} mất mạng.`);
  const them = state.players[foe];
  const aimed = shuntUid(them.field, redirectCover(them.field, targetUid));
  const target = them.field.find((unit) => unit?.uid === aimed) ?? null;
  if (!target) return note(state, "Chọn một quái đối thủ");
  if (!committed) return beginHold(state, { kind: "beam", caster: uid, target: aimed, index: 8 }, `${cardOf(mon).name} dùng ${castName(mon.cardId, 8)} lên ${cardOf(target).name}.`);
  const amount = skillFigure(mon.cardId, "dmg", 5, 2);
  const yourField = you.field.map((unit) => (unit?.uid === uid ? { ...unit, hp: unit.hp - bite } : unit));
  const foeField = them.field.map((unit) => (unit?.uid === target.uid ? damageSpell(unit, amount, them.field, mon) : unit));
  let next = patch({ ...state, echo: null }, side, dropDead({ ...you, field: yourField }));
  next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
  next = note(next, `${castName(mon.cardId, 8)} tiêu thêm ${bite} máu, gây ${spellLanded(target, amount, them.field, mon)} sát thương phép`, "spell");
  return armLast(next, uid);
}

export function swordLast(state: Duel, targetUid: string | null, committed = false): Duel {
  const uid = state.last;
  if (!uid || state.winner) return state;
  if (!committed && state.step !== "main") return state;
  const side = state.turn;
  const foe = (1 - side) as Side;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!targetUid) return note({ ...state, last: null }, `${mon ? cardOf(mon).name : ""} không đánh thêm`);
  if (!mon) return { ...state, last: null };
  const cost = lastStrike(mon.cardId);
  if (mon.hp <= cost.hp) return note({ ...state, last: null }, `Không đủ máu. Hoả thần long sẽ khiến ${cardOf(mon).name} mất mạng.`);
  const them = state.players[foe];
  const aimed = shuntUid(them.field, redirectCover(them.field, targetUid));
  const target = them.field.find((unit) => unit?.uid === aimed) ?? null;
  if (!target) return note(state, "Chọn một quái đối thủ");
  if (!committed) return beginHold(state, { kind: "beam", caster: uid, target: aimed, index: 9 }, `${cardOf(mon).name} dùng ${castName(mon.cardId, 9)} lên ${cardOf(target).name}.`);
  const paid = pay(you, cost.mana);
  if (!paid) return note({ ...state, last: null }, "Cần 1 mana.");
  const pack = shaveHex(mon, { spell: cost.spell, phys: 0, tru: cost.tru });
  const truRaw = outgoing(mon, pack.tru) + charmDamage;
  const truNow = target.cardId === "chien-binh-rong" ? third(truRaw) : outgoing(mon, pack.tru);
  const spellDealt = spellLanded(target, pack.spell, them.field, mon);
  const spellShown = Math.max(0, spellDealt - Math.min(phantomPool(target, them.field), spellDealt));
  const truDealt = shownTru(target, hurt(target, truNow), them.field, spellDealt);
  const burned = trueDamage(damageSpell(target, pack.spell, them.field, mon), outgoing(mon, pack.tru), them.field, veilLeft(target, spellDealt));
  const yourField = paid.field.map((unit) => (unit?.uid === uid ? { ...unit, hp: unit.hp - cost.hp } : unit));
  const foeField = them.field.map((unit) => (unit?.uid === target.uid ? burned : unit));
  let next = patch({ ...state, last: null }, side, dropDead({ ...paid, field: yourField }));
  next = patch(next, foe, settleCocoon(dropDead({ ...them, field: foeField })));
  return note(next, `${castName(mon.cardId, 9)} tiêu ${cost.hp} máu và ${cost.mana} mana, gây ${spellShown} sát thương phép và ${truDealt} sát thương chuẩn`, "spell");
}

export function setCover(state: Duel, uid: string, on: boolean): Duel {
  const side = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== "kizuran") return state;
  if (mon.stun > 0 || (mon.chain ?? 0) > 0) return note(state, `${cardOf(mon).name} đang bị khống chế.`);
  if (on && !you.field.some((unit) => unit && unit.cardId === "kazura" && unit.hp > 0)) return note(state, `Cần ${monsterCard("kazura")?.name} trên sân.`);
  const field = you.field.map((unit) => (unit?.uid === uid ? { ...unit, cover: on } : unit));
  let next = patch(state, side, { ...you, field });
  const pending = next.pending;
  if (on && pending && (pending.kind === "melee" || pending.kind === "gnaw" || pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell")) {
    const aimed = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.target;
    const target = aimed ? [...next.players[0].field, ...next.players[1].field].find((unit) => unit?.uid === aimed) : null;
    if (target?.cardId === "kazura" && you.field.some((unit) => unit?.uid === target.uid)) {
      next =
        pending.kind === "melee" || pending.kind === "gnaw"
          ? { ...next, pending: { ...pending, defender: uid } }
          : { ...next, pending: { ...pending, target: uid } };
    }
  }
  return note(next, on ? `${cardOf(mon).name} sẽ đỡ đòn và phép cho ${monsterCard("kazura")?.name}.` : `${cardOf(mon).name} ngừng đỡ.`);
}

export function toggleStance(state: Duel, uid: string): Duel {
  if (state.step !== "main" || state.winner) return state;
  const side = state.turn;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.dim || held(mon)) return state;
  if (mon.cardId !== "rong-boc-trung") return note(state, `Chỉ ${monsterCard("rong-boc-trung")?.name ?? ""} đổi được thế.`);
  if (mon.stanceUsed) return note(state, "Mỗi lượt chỉ đổi thế một lần, trước khi tấn công.");
  const stance: "attack" | "guard" = mon.stance === "attack" ? "guard" : "attack";
  const field = you.field.map((unit) => (unit?.uid === uid ? { ...unit, stance, stanceUsed: true } : unit));
  return note(patch(state, side, { ...you, field }), stance === "guard" ? `${cardOf(mon).name} cuộn thế thủ.` : `${cardOf(mon).name} xòe thế công.`, "heal");
}

function cardStars(id: string, level = 1): number {
  if (id === "te-giac-be-con") {
    const form = ["te-giac-be-con", "te-giac-hieu-thang", "te-giac-chien-binh"][Math.min(3, Math.max(1, level)) - 1];
    return monsterCard(form)?.stars ?? 1;
  }
  return monsterCard(id)?.stars ?? 0;
}

function keptField(mon: FieldMon) {
  return !mon.copy && mon.cardId !== "chan-ken" && cardStars(mon.cardId, mon.level ?? 1) > 0;
}

function keptPile(pile: PileMon) {
  return !pile.saved?.copy && cardStars(pile.id, pile.saved?.level ?? 1) > 0;
}

export function recallStars(held: PileMon) {
  return cardStars(held.id, held.saved?.level ?? 1);
}

export function recallFits(caps: number[], stars: number[]) {
  return recallLeft(caps, stars).length === caps.length - stars.length;
}

export function recallLeft(caps: number[], stars: number[]) {
  const left = caps.map((cap, index) => ({ cap, index }));
  const used = new Set<number>();
  for (const star of [...stars].sort((a, b) => a - b)) {
    const pick = left
      .filter((item) => !used.has(item.index) && item.cap >= star)
      .sort((a, b) => a.cap - b.cap || a.index - b.index)[0];
    if (!pick) break;
    used.add(pick.index);
  }
  return left.filter((item) => !used.has(item.index)).map((item) => item.cap);
}

export function recallCost(stars: number[]) {
  return stars.filter((star) => star === 4).length;
}

export function recallReady(caps: number[], reserve: PileMon[], picks: number[], mana: number) {
  const stars = picks.map((index) => recallStars(reserve[index]));
  if (!recallFits(caps, stars) || recallCost(stars) > mana || picks.length > caps.length) return false;
  if (picks.length === caps.length) return true;
  const used = new Set(picks);
  const canMore = reserve.some((held, index) => {
    if (used.has(index)) return false;
    const next = [...stars, recallStars(held)];
    return recallFits(caps, next) && recallCost(next) <= mana;
  });
  return !canMore;
}

function chooseRecall(reserve: PileMon[], caps: number[], mana: number) {
  const stars = reserve.map((held) => recallStars(held));
  const limit = Math.min(caps.length, reserve.length);
  const order = stars.map((star, index) => ({ star, index })).sort((a, b) => a.star - b.star || a.index - b.index);
  const picked: number[] = [];
  for (const item of order) {
    if (picked.length >= limit) break;
    const next = [...picked, item.index];
    const nextStars = next.map((index) => stars[index]);
    if (!recallFits(caps, nextStars) || recallCost(nextStars) > mana) continue;
    picked.push(item.index);
  }
  return picked;
}

export function confirmRecall(state: Duel, indexes: number[]): Duel {
  const ask = state.recall;
  if (!ask) return state;
  const side = ask.side;
  const owner = state.players[side];
  const unique = [...new Set(indexes)].filter((index) => index >= 0 && index < owner.reserve.length);
  const stars = unique.map((index) => recallStars(owner.reserve[index]));
  if (!recallReady(ask.caps, owner.reserve, unique, owner.orb)) return note(state, "Chọn chưa đúng số quái hoặc vượt sao đã thu.");
  const cost = recallCost(stars);
  const before = owner.stars;
  const paid = cost > 0 ? pay(owner, cost) : owner;
  if (!paid) return note(state, "Không đủ mana cho quái 4 sao.");
  const slots = ([0, 1, 2] as const).filter((index) => !paid.field[index] && (paid.locked?.[index] ?? 0) === 0);
  const field = [...paid.field] as Player["field"];
  const used = new Set<number>();
  let seq = state.seq;
  unique.slice(0, slots.length).forEach((index, at) => {
    const held = paid.reserve[index];
    field[slots[at]] = { ...place({ ...state, seq }, side, held.id, held), dim: true };
    seq += 1;
    used.add(index);
  });
  const reserve = paid.reserve.filter((_, index) => !used.has(index));
  const placed = shuffleSea({ ...paid, field, reserve });
  const marked = patch({ ...state, seq, recall: null }, side, placed);
  const line = used.size > 0 ? `Đưa ${used.size} quái ra sân.` : "Không đưa quái ra sân.";
  return note(pingStars(marked, side, before, placed.stars), line, "spell");
}

function watchedOneStar(state: Duel, side: Side): FieldMon | null {
  const pending = state.pending;
  if (!pending) return null;
  const uid =
    pending.kind === "melee" || pending.kind === "gnaw"
      ? (state.hold?.blocker ?? pending.defender)
      : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell"
        ? (state.hold?.blocker ?? pending.target)
        : pending.kind === "face"
          ? state.hold?.blocker ?? null
          : null;
  if (!uid) return null;
  const mon = state.players[side].field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || cardStars(mon.cardId, mon.level ?? 1) !== 1) return null;
  return mon;
}

function corrodeSide(state: Duel, foe: Side): { state: Duel; line: string } {
  const player = state.players[foe];
  const pool: Array<{ zone: "deck" | "reserve" | "field"; index: number; id: string; uid?: string }> = [];
  player.monsterDeck.forEach((card, index) => {
    if (cardStars(card.id, card.saved?.level ?? 1) >= 3) pool.push({ zone: "deck", index, id: card.id });
  });
  player.reserve.forEach((card, index) => {
    if (cardStars(card.id, card.saved?.level ?? 1) >= 3) pool.push({ zone: "reserve", index, id: card.id });
  });
  player.field.forEach((mon, index) => {
    if (mon && mon.hp > 0 && cardStars(mon.cardId, mon.level ?? 1) >= 3) pool.push({ zone: "field", index, id: mon.cardId, uid: mon.uid });
  });
  if (pool.length === 0) return { state, line: "" };
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const stars = pick.zone === "field"
    ? cardStars(pick.id, player.field[pick.index]?.level ?? 1)
    : cardStars(pick.id, (pick.zone === "deck" ? player.monsterDeck[pick.index] : player.reserve[pick.index])?.saved?.level ?? 1);
  const dmg = stars >= 4 ? 2 : 1;
  const name = monsterCard(pick.id)?.name ?? "quái";
  const previous = charmDamage;
  charmDamage = 0;
  try {
    if (pick.zone === "field") {
      const mon = player.field[pick.index];
      if (!mon) return { state, line: "" };
      const lineN = shownTru(mon, dmg, player.field);
      const hurtMon = trueDamage(mon, dmg, player.field);
      const field = player.field.map((unit, index) => (index === pick.index ? hurtMon : unit));
      const next = patch(state, foe, dropDead({ ...player, field }));
      const line = hurtMon.hp <= 0 ? `Virus ăn mòn tiêu diệt ${name}` : `Virus ăn mòn gây ${lineN} sát thương chuẩn lên ${name}`;
      return { state: next, line };
    }
    if (pick.zone === "deck") {
      const held = woundPile(player.monsterDeck[pick.index], dmg);
      const monsterDeck = held ? player.monsterDeck.map((card, index) => (index === pick.index ? held : card)) : player.monsterDeck.filter((_, index) => index !== pick.index);
      const line = held ? `Virus ăn mòn gây ${dmg} sát thương chuẩn lên ${name} trong bộ bài` : `Virus ăn mòn tiêu diệt ${name} trong bộ bài`;
      return { state: patch(state, foe, { ...player, monsterDeck }), line };
    }
    const held = woundPile(player.reserve[pick.index], dmg);
    const reserve = held ? player.reserve.map((card, index) => (index === pick.index ? held : card)) : player.reserve.filter((_, index) => index !== pick.index);
    const line = held ? `Virus ăn mòn gây ${dmg} sát thương chuẩn lên ${name}` : `Virus ăn mòn tiêu diệt ${name}`;
    return { state: patch(state, foe, { ...player, reserve }), line };
  } finally {
    charmDamage = previous;
  }
}

function igniteVirus(state: Duel, owner: Side): Duel {
  const tick = corrodeSide(state, (1 - owner) as Side);
  const extra = tick.line ? `Virus ăn mòn bắt đầu. ${tick.line}` : "Virus ăn mòn bắt đầu.";
  return {
    ...tick.state,
    virusArm: null,
    virus: { owner },
    live: `${state.live} ${extra}`.trim(),
    log: [...state.log, extra],
  };
}

function reapVirus(state: Duel): Duel {
  const arm = state.virusArm;
  if (!arm) return state;
  const living = state.players.some((player) => player.field.some((mon) => mon?.uid === arm.uid && mon.hp > 0));
  if (living) {
    if (state.step === "respond" && state.pending) return state;
    return { ...state, virusArm: null };
  }
  return igniteVirus({ ...state, virusArm: null }, arm.owner);
}

function virusTick(state: Duel): { state: Duel; line: string } {
  if (!state.virus) return { state, line: "" };
  return corrodeSide(state, (1 - state.virus.owner) as Side);
}

function erosionTick(state: Duel): { state: Duel; line: string } {
  let next = state;
  const bits: string[] = [];
  for (const side of [0, 1] as const) {
    const player = next.players[side];
    let touched = false;
    const hops: Array<{ uid: string; amount: number }> = [];
    const field = player.field.map((mon) => {
      if (!mon?.erode && !mon?.poison) return mon;
      touched = true;
      let nextMon = mon;
      let moved = 0;
      const legs = mon.cardId === "ken-ngai" ? livingLegs(player.field, mon.uid) : [];
      const relay = legs.length > 0 ? legs[Math.floor(Math.random() * legs.length)].uid : "";
      if (mon.erode) {
        const amount = state.turn === mon.erode.from ? 1 : 2;
        const left = mon.erode.left === null ? null : mon.erode.left - 1;
        nextMon = { ...nextMon, erode: left === 0 ? undefined : { from: mon.erode.from, left } };
        if (relay) moved += amount;
        else nextMon = trueDamage(nextMon, amount, player.field);
        bits.push(nextMon.hp <= 0 ? `${cardOf(mon).name} chết vì bào mòn` : `${cardOf(mon).name} bị bào mòn ${amount + charmDamage}`);
      }
      if (nextMon.hp > 0 && nextMon.poison) {
        const poison = nextMon.poison;
        const doubled = poison.perfect && state.turn !== poison.from;
        const amount = poison.stacks * (doubled ? 2 : 1);
        const left = poison.left === null ? null : poison.left - 1;
        nextMon = { ...nextMon, poison: left === 0 ? undefined : { ...poison, left } };
        if (relay) moved += amount;
        else nextMon = trueDamage(nextMon, amount, player.field);
        bits.push(nextMon.hp <= 0 ? `${cardOf(mon).name} chết vì độc` : `${cardOf(mon).name} trúng độc ${amount + charmDamage}`);
      }
      if (relay && moved > 0) hops.push({ uid: relay, amount: moved });
      return nextMon;
    });
    let settled = field;
    for (const hop of hops) {
      const leg = settled.find((unit) => unit?.uid === hop.uid);
      if (!leg || leg.hp <= 0) continue;
      const hurt = trueDamage(leg, hop.amount, settled);
      settled = settled.map((unit) => (unit?.uid === hop.uid ? hurt : unit));
      bits.push(hurt.hp <= 0 ? `${cardOf(leg).name} gánh đòn cho kén và gục` : `${cardOf(leg).name} gánh ${hop.amount} đòn cho kén`);
    }
    if (touched) next = patch(next, side, settleCocoon(dropDead({ ...player, field: settled })));
  }
  return { state: next, line: bits.join(" ") };
}

function turnStamp(state: Duel, uid: string): { mon: FieldMon; slot: 0 | 1 | 2; born?: boolean } | null {
  const history = state.history ?? [];
  const ago = history.length >= 3 ? history[0] : undefined;
  if (ago?.[uid]) return ago[uid];
  const born = state.born?.[uid];
  return born ? { ...born, born: true } : null;
}

function rewindAlly(state: Duel, side: Side, uid: string): Duel | null {
  const player = state.players[side];
  const from = player.field.findIndex((mon) => mon?.uid === uid);
  const stamp = turnStamp(state, uid);
  if (from < 0 || !stamp) return null;
  const body = { ...structuredClone(stamp.mon), uid };
  const field = [...player.field] as Player["field"];
  const to = stamp.slot;
  if (from !== to) {
    const other = field[to];
    field[from] = other ?? null;
    field[to] = body;
  } else field[from] = body;
  return patch(state, side, { ...player, field });
}

function stampTurn(state: Duel): Duel {
  const now: NonNullable<Duel["now"]> = {};
  for (const team of state.players) {
    team.field.forEach((mon, slot) => {
      if (!mon) return;
      now[mon.uid] = { mon: structuredClone(mon), slot: slot as 0 | 1 | 2 };
    });
  }
  const history = [...(state.history ?? [])];
  if (state.now) history.push(state.now);
  const kept = history.slice(-3);
  return { ...state, past: kept[kept.length - 1] ?? {}, history: kept, now, clock: (state.clock ?? 1) + 1 };
}

function settleDragonDebt(state: Duel): { state: Duel; line: string } {
  const bits: string[] = [];
  let next = state;
  for (const side of [0, 1] as const) {
    const player = next.players[side];
    let field = player.field;
    for (const mon of field) {
      if (!mon || mon.cardId !== "chien-binh-rong" || mon.hp <= 0 || !mon.debt) continue;
      const due = mon.debt[0];
      const rest = mon.debt[1];
      if (due.p + due.s + due.t + rest.p + rest.s + rest.t <= 0) continue;
      const p = Math.max(0, due.p - liveDef(mon, field));
      const s = Math.max(0, due.s - liveMdef(mon, field));
      const dealt = hurt(mon, p) + hurt(mon, s) + hurt(mon, due.t);
      const shifted: FieldMon = {
        ...mon,
        debt: rest.p + rest.s + rest.t > 0 ? [rest, { p: 0, s: 0, t: 0 }] : undefined,
      };
      const spellN = hurt(mon, s);
      const physN = hurt(mon, p);
      const truN = hurt(mon, due.t);
      const pool = phantomPool(mon, field);
      const hit = applyIncoming(shifted, dealt, field);
      field = field.map((unit) => (unit?.uid === mon.uid ? hit.mon : unit));
      const spellOut = Math.max(0, spellN - Math.min(pool, spellN));
      const afterSpell = Math.max(0, pool - spellN);
      const physOut = Math.max(0, physN - Math.min(afterSpell, physN));
      const truOut = Math.max(0, truN - Math.max(0, afterSpell - physN));
      const parts = [
        p > 0 ? `${physOut} sát thương vật lý` : "",
        s > 0 ? `${spellOut} sát thương phép` : "",
        due.t > 0 ? `${truOut} sát thương chuẩn` : "",
      ].filter(Boolean);
      if (parts.length) bits.push(`${cardOf(mon).name} nhận ${parts.join(", ")}`);
      if (hit.mon.hp <= 0) bits.push(`${cardOf(mon).name} bị hạ`);
    }
    next = patch(next, side, dropDead({ ...next.players[side], field }));
  }
  return { state: next, line: bits.join(". ") };
}


// ---- Lá môi trường: Thảo nguyên, Đất đá, Bóng tối ----

function ownerSide(state: Duel, uid: string): Side | null {
  if (state.players[0].field.some((mon) => mon?.uid === uid)) return 0;
  if (state.players[1].field.some((mon) => mon?.uid === uid)) return 1;
  return null;
}

/** Đất đá: attack bonus for one clash, 40% of current def + mdef, rounded. */
function rockOf(state: Duel, mon: FieldMon | null | undefined): number {
  if (!mon) return 0;
  const side = ownerSide(state, mon.uid);
  if (side === null) return 0;
  const owner = state.players[side];
  if (owner.env !== "dat-da" || !envFavors("dat-da", mon.cardId)) return 0;
  const total = liveDef(mon, owner.field) + liveMdef(mon, owner.field);
  return total > 0 ? Math.round(total * 0.4) : 0;
}

let envDepth = 0;
let envSources: string[] = [];
let envClash: string[] = [];

/** Runs one action and, at the outermost call, applies Bóng tối, Đất đá notes and Thảo nguyên marks. */
function envGuard(before: Duel, sources: string[], clash: string[], run: () => Duel): Duel {
  if (envDepth === 0) {
    envSources = [];
    envClash = [];
  }
  envSources.push(...sources);
  envClash.push(...clash);
  envDepth += 1;
  let after: Duel;
  try {
    after = run();
  } finally {
    envDepth -= 1;
  }
  if (envDepth > 0) return after;
  const sourcesNow = [...new Set(envSources)];
  const clashNow = [...new Set(envClash)];
  envSources = [];
  envClash = [];
  if (after === before) return after;
  return darkToll(before, rockNotes(before, markMeadow(after, clashNow), clashNow), sourcesNow);
}

function rockNotes(before: Duel, after: Duel, clash: string[]): Duel {
  const rows: { uid: string; name: string; n: number }[] = [];
  for (const uid of clash) {
    const side = ownerSide(before, uid);
    if (side === null) continue;
    const mon = before.players[side].field.find((unit) => unit?.uid === uid);
    const n = rockOf(before, mon);
    if (mon && n > 0) rows.push({ uid, name: shadeHidden(mon) ? "Quái thú ẩn mình" : cardOf(mon).name, n });
  }
  if (!rows.length) return after;
  const alive = (uid: string) => after.players.some((player) => player.field.some((unit) => unit?.uid === uid && unit.hp > 0));
  const mends = [...(after.mends ?? []), ...rows.filter((row) => alive(row.uid)).map((row) => ({ uid: row.uid, n: row.n }))];
  const text = rows.map((row) => `+${row.n} công cho ${row.name}`).join(", ");
  return { ...note(after, `Đất đá: ${text} trong lần giao tranh này.`, after.tone), mends };
}

function markMeadow(state: Duel, clash: string[]): Duel {
  if (!clash.length) return state;
  let next = state;
  for (const side of [0, 1] as Side[]) {
    const player = next.players[side];
    if (player.env !== "thao-nguyen") continue;
    let changed = false;
    const field = player.field.map((mon) => {
      if (!mon || mon.meadow || mon.hp <= 0 || !clash.includes(mon.uid) || !envFavors("thao-nguyen", mon.cardId)) return mon;
      changed = true;
      return { ...mon, meadow: true };
    });
    if (changed) next = patch(next, side, { ...player, field: field as Player["field"] });
  }
  return next;
}

/** Thảo nguyên: at the end of the turn, each warrior that clashed heals 1. */
function meadowHeal(state: Duel): Duel {
  let next = state;
  const mends = [...(state.mends ?? [])];
  const names: string[] = [];
  for (const side of [0, 1] as Side[]) {
    const player = next.players[side];
    if (!player.field.some((mon) => mon?.meadow)) continue;
    const field = player.field.map((mon) => {
      if (!mon || !mon.meadow) return mon;
      const cap = mon.maxHp || mon.hp;
      const healed = player.env === "thao-nguyen" && mon.hp > 0 ? Math.min(1, Math.max(0, cap - mon.hp)) : 0;
      if (healed > 0) {
        mends.push({ uid: mon.uid, n: healed });
        names.push(cardOf(mon).name);
      }
      return { ...mon, hp: mon.hp + healed, meadow: undefined };
    });
    next = patch(next, side, { ...player, field: field as Player["field"] });
  }
  if (!names.length) return next;
  return { ...note(next, `Thảo nguyên hồi 1 máu cho ${names.join(", ")}.`, "heal"), mends };
}

/** Bóng tối: each enemy monster a dark ally damaged costs the enemy player 1, or 2 if it lost more than 5. */
function darkToll(before: Duel, after: Duel, sources: string[]): Duel {
  let next = after;
  for (const side of [0, 1] as Side[]) {
    if (next.winner != null) return next;
    const owner = before.players[side];
    if (owner.env !== "bong-toi") continue;
    const dark = sources
      .map((uid) => owner.field.find((mon) => mon?.uid === uid) ?? null)
      .find((mon): mon is FieldMon => Boolean(mon && envFavors("bong-toi", mon.cardId)));
    if (!dark) continue;
    const foe = (1 - side) as Side;
    let toll = 0;
    for (const prev of before.players[foe].field) {
      if (!prev || prev.hp <= 0) continue;
      const now = next.players[foe].field.find((mon) => mon?.uid === prev.uid);
      const lost = prev.hp - Math.max(0, now?.hp ?? 0);
      if (lost > 0) toll += lost > 5 ? 2 : 1;
    }
    if (toll <= 0) continue;
    const them = next.players[foe];
    const name = shadeHidden(dark) ? "Quái thú ẩn mình" : cardOf(dark).name;
    next = checkWinner(note(patch(next, foe, { ...them, hp: them.hp - toll }), `Bóng tối: ${name} gây thêm ${toll} sát thương chuẩn lên người chơi.`, "hit"));
  }
  return next;
}

export function endTurn(state: Duel): Duel {
  const next = endTurnCore(state);
  if (next === state) return next;
  if (next.turn === state.turn && next.winner === state.winner && next.step === state.step) return next;
  const marked = traced(state, next, { kind: "end-turn", actor: state.turn, ok: true, cardId: null, target: null, end: null });
  return withResults(state, marked, { blocked: false, reflect: false, turn: true });
}

function endTurnCore(state: Duel): Duel {
  const locked = talkLock(state);
  if (locked) return locked;
  if (state.step !== "main" || state.winner || state.recall) return state;
  const waiting = needUpkeep(state);
  if (waiting) return waiting;
  state = meadowHeal(releaseLegend({ ...state, echo: null, last: null }));
  const side = state.turn;
  const foe = (1 - side) as Side;
  const vowHeals: { uid: string; n: number }[] = [];
  let current = state.players[side];
  current = {
    ...current,
    field: current.field.map((mon) => {
      if (!mon || mon.copy) return null;
      if (mon.cardId === PREY && mon.preyAim) return null;
      const heal =
        (mon.cardId === "rong-boc-trung" && mon.stance === "guard" ? skillFigure(mon.cardId, "heal", 3) : 0) +
        (mon.cardId === "ken-ngai" || mon.cardId === "chan-ken" ? skillFigure(mon.cardId, "heal", 1) : 0);
      const clown = mon.cardId === "ga-he-dang-so";
      const rabbit = mon.cardId === "tho-den-tinh-nghich";
      const charge = clown ? (mon.held ? mon.charge + 1 : 0) : rabbit ? 0 : mon.charge;
      const cap = mon.maxHp || mon.hp;
      const next = {
        ...mon,
        dim: mon.cardId === "ken-ngai" || mon.cardId === "chan-ken" ? true : clown,
        charge,
        held: false,
        stanceUsed: false,
        noBlock: isStill(mon.cardId) ? true : false,
        chain: Math.max(0, (mon.chain ?? 0) - 1),
        gag: Math.max(0, (mon.gag ?? 0) - 1),
        shown: (mon.shown ?? 0) > 1 ? (mon.shown ?? 0) - 1 : undefined,
        stored: mon.cardId === SHADE && (mon.shown ?? 0) === 1 ? undefined : mon.stored,
        hp: Math.min(cap, mon.hp + heal),
        stun: Math.max(0, mon.stun - 1),
        hex: mon.hex && mon.hex.left > 1 ? { left: mon.hex.left - 1 } : undefined,
        vulnerable: Math.max(0, mon.vulnerable - 1),
        safe: Math.max(0, (mon.safe ?? 0) - 1),
        hornNew: false,
        wet: mon.wet && mon.wet < 90 ? Math.max(0, mon.wet - 1) : mon.wet,
        blessAtk: 0,
        blessDmg: 0,
        nextDef: 0,
        tempGuard: 0,
        seized: undefined,
      };
      if (mon.hp > 0 && (mon.fed ?? 0) > 0 && ((mon.path ?? 0) > 0 || mon.cardId === "chien-binh-huyen-thoai")) vowHeals.push({ uid: mon.uid, n: mon.fed ?? 0 });
      return settleGuard(settleVow(next));
    }).map((mon) => (mon ? fadeBuff(mon) : mon)),
    attackLock: Math.max(0, current.attackLock - 1),
    mirror: Math.max(0, current.mirror - 1),
    locked: (current.locked ?? [0, 0, 0]).map((left) => Math.max(0, left - 1)) as [number, number, number],
    draws: 0,
    summons: 0,
    aside: 0,
    turns: (current.turns ?? 0) + 1,
    reserve: current.reserve.map((pile) => (pile.freeAt == null ? pile : { ...pile, freeAt: undefined })),
  };
  let next = patch(state, side, current);
  const incoming = next.players[foe];
  const drawBan = incoming.drawBan ?? 0;
  const angels = incoming.field.filter((mon) => mon?.cardId === "quai-thu-thien-su").length;
  const incomingMana = pour(incoming.orb, incoming.flask, 1 + angels);
  const capped = incomingMana.orb >= 3 && incomingMana.flask >= 1;
  const usedRelease = Boolean(next.gemUsed?.[foe]);
  const warnedRelease = Boolean(next.gemWarned?.[foe]);
  const staying = next.players[side];
  const stayMana = pour(staying.orb, staying.flask, 1);
  next = patch(next, side, { ...staying, ...stayMana });
  next = patch(next, foe, {
    ...incoming,
    ...incomingMana,
    draws: 0,
    drawLock: drawBan > 0,
    drawBan: drawBan > 0 ? drawBan - 1 : 0,
    summons: 0,
    aside: 0,
    acted: false,
    attackLock: Math.max(0, incoming.attackLock - 1),
    mirror: Math.max(0, incoming.mirror - 1),
    field: incoming.field.map((mon) => {
      if (!mon) return mon;
      const cocoon = mon.cardId === "ken-ngai" || mon.cardId === "chan-ken";
      const cap = mon.maxHp || mon.hp;
      const faded = fadeBuff({
        ...mon,
        dim: mon.cardId === "ken-ngai" || mon.cardId === "chan-ken" ? true : false,
        noBlock: isStill(mon.cardId) ? true : mon.noBlock,
        charge: mon.cardId === "tho-den-tinh-nghich" ? 0 : mon.charge,
        hp: cocoon ? Math.min(cap, mon.hp + skillFigure(mon.cardId, "heal", 1)) : mon.hp,
        level: mon.cardId === "ken-ngai" ? (mon.level ?? 0) + 1 : mon.level,
        stun: Math.max(0, mon.stun - 1),
        hex: mon.hex && mon.hex.left > 1 ? { left: mon.hex.left - 1 } : undefined,
        vulnerable: Math.max(0, mon.vulnerable - 1),
        chain: Math.max(0, (mon.chain ?? 0) - 1),
        gag: Math.max(0, (mon.gag ?? 0) - 1),
        shown: (mon.shown ?? 0) > 1 ? (mon.shown ?? 0) - 1 : undefined,
        stored: mon.cardId === SHADE && (mon.shown ?? 0) === 1 ? undefined : mon.stored,
        safe: Math.max(0, (mon.safe ?? 0) - 1),
        wet: mon.wet && mon.wet < 90 ? Math.max(0, mon.wet - 1) : mon.wet,
        spun: false,
        tempGuard: 0,
      });
      if (mon.hp > 0 && (mon.fed ?? 0) > 0 && ((mon.path ?? 0) > 0 || mon.cardId === "chien-binh-huyen-thoai")) vowHeals.push({ uid: mon.uid, n: mon.fed ?? 0 });
      return freeCage(settleGuard(settleVow(faded)));
    }),
  });
  const bloomed = bloomCocoons(next.players[foe]);
  next = patch(next, foe, shuffleSea(bloomed.player));
  const demonOwner = next.players[foe];
  const dueNow = nextUpkeep(demonOwner.field);
  next = {
    ...next,
    turn: foe,
    opening: false,
    step: "main",
    pending: null,
    hold: null,
    log: [],
    live: "",
    starPing: null,
    stepNo: 0,
    upkeep: dueNow?.uid ?? null,
    gemCap: capped && !usedRelease ? foe : null,
    gemWarn: capped && usedRelease && !warnedRelease ? foe : null,
  };
  const eroded = erosionTick(next);
  const virused = virusTick(eroded.state);
  let startedTurn = virused.state;
  for (const at of [0, 1] as const) {
    const board = startedTurn.players[at];
    if (!board.hats) continue;
    startedTurn = patch(startedTurn, at, { ...board, field: mixRow(board.field) as Player["field"] });
  }
  const owed = settleDragonDebt(startedTurn);
  startedTurn = owed.state;
  const started = angels > 0 ? `${sideName(foe)} bắt đầu lượt. Quái thú thiên sứ cho thêm ${angels} gem.` : `${sideName(foe)} bắt đầu lượt.`;
  const pact = dueNow?.cardId === "trieu-hoi-ac-ma" ? `${cardOf(dueNow).name} thiếu sao phải trả khế ước: 1 mana, hoặc rời sân.` : "";
  const pray = angels > 0 ? "Quái thú thiên sứ cần cầu nguyện: tiêu 1 mana, hoặc rời sân." : "";
  const due = [started, pact, pray].filter(Boolean).join(" ");
  const vowNames = [0, 1].flatMap((at) =>
    state.players[at as 0 | 1].field.filter((mon) => mon && (mon.path ?? 0) === 1 && mon.hp > 0).map((mon) => cardOf(mon!).name),
  );
  const vowLine = vowNames.length ? `${vowNames.join(", ")} thành Chiến binh huyền thoại. Hồi đầy máu và gỡ hết trạng thái xấu.` : "";
  const healLine = vowHeals
    .map((row) => {
      const mon = state.players[0].field.find((unit) => unit?.uid === row.uid) ?? state.players[1].field.find((unit) => unit?.uid === row.uid);
      return mon ? `${cardOf(mon).name} hồi ${row.n} máu` : "";
    })
    .filter(Boolean)
    .join(". ");
  const offered = offerPrey(startedTurn);
  startedTurn = offered.state;
  const extra = [vowLine, healLine, bloomed.line, eroded.line, virused.line, owed.line, offered.line].filter(Boolean).join(" ");
  const mute = startedTurn.players[foe].drawLock ? " Lượt này không được rút bài." : "";
  const noted = note(stampTurn(startedTurn), extra ? `${due}${mute} ${extra}` : `${due}${mute}`);
  const mends = [...(noted.mends ?? []), ...vowHeals];
  return mends.length ? { ...noted, mends } : noted;
}

function summonAside(state: Duel): Duel | null {
  const player = state.players[state.turn];
  if ((player.aside ?? 0) >= 1) return null;
  const index = player.reserve.findIndex((held) => held.id === "phu-thuy-thoi-gian");
  if (index < 0) return null;
  const held = player.reserve[index];
  const card = monsterCard(held.id);
  if (!card || player.stars < card.stars) return null;
  if (playBill(card.gems, Boolean(held.toll), player.orb, player.flask)) return null;
  const slot = ([0, 1, 2] as const).find((index) => !player.field[index] && (player.locked?.[index] ?? 0) === 0);
  if (slot === undefined) return null;
  const next = summon(state, index, slot);
  return next.players[state.turn].field[slot]?.cardId === "phu-thuy-thoi-gian" ? next : null;
}

function summonBias(opening: boolean, oneStar: boolean, lean: Lean): "low" | "high" | "atk" {
  if (!opening) return "atk";
  if (lean.ready && lean.lowStar > 0) return "low";
  if (lean.ready && lean.lowStar < 0) return "high";
  return oneStar ? "low" : "atk";
}

function learnedDraw(me: Player, board: number, style: ReturnType<typeof readStyle>, lean: Lean): "monster" | "spell" | null {
  if (lean.ready && lean.spell > 0 && me.spellDeck.length > 0 && (board > 0 || me.monsterDeck.length === 0)) return "spell";
  if (lean.ready && lean.spell < 0 && me.monsterDeck.length > 0) return "monster";
  if (style.spellDraw === false && me.monsterDeck.length > 0) return "monster";
  if (style.spellDraw === true && me.spellDeck.length > 0 && (board > 0 || me.monsterDeck.length === 0)) return "spell";
  const wantSpell = board > 0 && style.spellDraw !== false && (me.stars >= 1 || me.monsterDeck.length === 0);
  if (wantSpell && me.spellDeck.length > 0) return "spell";
  if (me.monsterDeck.length > 0 && me.stars < 2) return "monster";
  if (me.spellDeck.length > 0) return "spell";
  if (me.monsterDeck.length > 0) return "monster";
  return null;
}

function summonPick(state: Duel, bias: "low" | "high" | "atk"): Duel | null {
  const player = state.players[state.turn];
  const options = player.reserve
    .map((held, index) => ({ id: held.id, index, toll: Boolean(held.toll), card: monsterCard(held.id) }))
    .filter((row) => {
      if (!row.card) return false;
      const ready = row.id === "trieu-hoi-ac-ma" ? player.stars >= 3 : player.stars >= row.card.stars;
      const held = player.reserve[row.index];
      const early = row.id === "trieu-hoi-ac-ma" && player.stars === 3;
      const entry = early && !held?.saved?.seen ? 1 : 0;
      return ready && player.orb + player.flask >= entry && playBill(row.card.gems, row.toll, Math.max(0, player.orb - entry), player.flask) === null;
    })
    .sort((a, b) => {
      if (bias !== "atk" && a.card && b.card && a.card.stars !== b.card.stars) return bias === "low" ? a.card.stars - b.card.stars : b.card.stars - a.card.stars;
      return (b.card?.atk ?? 0) - (a.card?.atk ?? 0);
    });
  const pick = options[0];
  if (!pick) return null;
  const slot = player.field.findIndex((cell) => !cell);
  if (slot < 0) return null;
  return summon(state, pick.index, slot as 0 | 1 | 2);
}

function develop(state: Duel): Duel | null {
  const me = state.players[state.turn];
  const style = readStyle();
  const lean = state.adapt ?? readLean();
  const board = me.field.filter(Boolean).length;
  const opening = (me.turns ?? 0) < 3;
  if (!opening && !(style.flood && me.summons < 1 && board < 3)) return null;
  const canDraw = !me.drawLock && me.draws < 1 && me.orb >= 1;
  const bias = summonBias(opening, style.oneStar, lean);
  const holdBack = lean.ready && lean.summon < 0 && board > 0;
  if (!holdBack && me.summons < 1 && board < 3 && (board === 0 || style.flood || bias === "low" || me.stars >= 2)) {
    const called = summonPick(state, bias);
    if (called) return called;
  }
  const eager = lean.ready && lean.spend !== 0 ? lean.spend > 0 : style.spendAll;
  if (canDraw && (opening ? eager || me.stars < 2 : me.stars < 2)) {
    const kind = learnedDraw(me, board, style, lean);
    if (kind) return draw(state, kind);
  }
  if (me.summons < 1 && board < 3) return summonPick(state, bias);
  if (board < 3) return summonAside(state);
  return null;
}

export function answerGemCap(state: Duel, yes: boolean): Duel {
  if (state.gemCap !== state.turn || state.winner) return state;
  const side = state.turn;
  const you = state.players[side];
  if (!yes) return note({ ...state, gemCap: null }, "Giữ nguyên cầu ma lực.");
  if (you.orb < 3 || you.flask < 1) return note({ ...state, gemCap: null }, "Không đủ mana để giải phóng.");
  const before = you.stars;
  const gained = grantUsed(you, 2);
  const player = { ...gained, orb: you.orb - 3 + 1, flask: you.flask - 1 };
  const used = state.gemUsed ?? [false, false];
  const gemUsed: [boolean, boolean] = [used[0], used[1]];
  gemUsed[side] = true;
  const next = pingStars(patch({ ...state, gemCap: null, gemUsed }, side, player), side, before, player.stars);
  return note(next, "Giải phóng cầu ma lực. Mất 3 mana, nhận 2 mana đã sử dụng, 1 mana bình vào cầu.");
}

export function answerGemWarn(state: Duel): Duel {
  if (state.gemWarn !== state.turn || state.winner) return state;
  const warned = state.gemWarned ?? [false, false];
  const gemWarned: [boolean, boolean] = [warned[0], warned[1]];
  gemWarned[state.turn] = true;
  return note(
    { ...state, gemWarn: null, gemWarned },
    'Bạn chỉ được dùng "Giải phóng ma lực" 1 lần trong mỗi trận đấu. Hãy cẩn thận với lượng ma lực đang quá tải của mình.',
  );
}

export function answerUpkeep(state: Duel, keepIt: boolean): Duel {
  const next = answerUpkeepCore(state, keepIt);
  if (next === state) return next;
  const uid = state.upkeep;
  const mon = uid ? state.players[state.turn].field.find((unit) => unit?.uid === uid && dueUpkeep(unit)) ?? null : null;
  if (!mon) return next;
  const stayed = next.players[state.turn].field.some((unit) => unit?.uid === mon.uid);
  return traced(state, next, { kind: "upkeep", actor: state.turn, ok: keepIt ? stayed : true, cardId: mon.cardId, target: null, end: null });
}

function answerUpkeepCore(state: Duel, keepIt: boolean): Duel {
  const scrubbed = scrubUpkeep(state);
  const uid = scrubbed.upkeep;
  if (!uid || scrubbed.winner) return scrubbed;
  const side = scrubbed.turn;
  const you = scrubbed.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid && dueUpkeep(unit)) ?? null;
  if (!mon) return scrubbed;
  const paid = keepIt ? pay(you, 1) : null;
  const player = paid ?? { ...you, field: you.field.map((unit) => (unit?.uid === uid ? null : unit)) };
  let next = patch(scrubbed, side, player);
  const another = nextUpkeep(next.players[side].field, uid);
  next = { ...next, upkeep: another?.uid ?? null };
  const name = cardOf(mon).name;
  const kept = mon.cardId === "quai-thu-thien-su" ? `${name} được cầu nguyện` : `${name} được duy trì`;
  return note(next, paid ? kept : keepIt ? `Không đủ 1 mana. ${name} rời sân` : `${name} rời sân`);
}

export function primeKnight(state: Duel, uid: string, picks: Array<"atk" | "def" | "hp">): Duel {
  const side = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const you = state.players[side];
  const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
  if (!mon || mon.cardId !== "ky-si-bong-toi" || (mon.path ?? 0) > 0) return state;
  const unique = [...new Set(picks)].slice(0, 2);
  const clash = { atk: 0, def: 0, maxHp: 0 };
  let hp = mon.hp;
  let maxHp = mon.maxHp || mon.hp;
  for (const pick of unique) {
    if (pick === "atk") clash.atk += skillFigure(mon.cardId, "atk", 3);
    if (pick === "def") clash.def += skillFigure(mon.cardId, "def", 2);
    if (pick === "hp") {
      const bonus = skillFigure(mon.cardId, "max", 2);
      clash.maxHp += bonus;
      maxHp += bonus;
      hp += bonus;
    }
  }
  const field = you.field.map((unit) => (unit?.uid === uid ? { ...unit, hp, maxHp, clash } : unit));
  const bits = unique.map((pick) => (pick === "atk" ? `+${clash.atk} công` : pick === "def" ? `+${clash.def} thủ` : `+${clash.maxHp} máu tối đa`));
  const name = cardOf(mon).name;
  const line = bits.length > 0 ? `${name} nhận ${bits.join(", ")} cho lần giáp lá cà này` : `${name} không đổi chỉ số`;
  return note(patch(state, side, { ...you, field }), line);
}

export function answerFairy(state: Duel, allyUid: string, yes: boolean): Duel {
  if (state.parley && state.step === "respond") return freeTalk(state, (next) => answerFairy(next, allyUid, yes));
  if (!yes) return state;
  const side = (state.players[0].field.some((mon) => mon?.uid === allyUid) ? 0 : 1) as Side;
  const you = state.players[side];
  const fairy = you.field.find((mon) => mon?.cardId === "yeu-tinh-chuc-phuc" && !mon.dim && mon.stun === 0) ?? null;
  const ally = you.field.find((mon) => mon?.uid === allyUid) ?? null;
  if (!fairy || !ally) return state;
  const cost = skillManaCost("yeu-tinh-chuc-phuc", 1);
  const paid = pay(you, cost);
  if (!paid) return note(state, "Cần 1 mana.");
  const heal = skillFigure("yeu-tinh-chuc-phuc", "heal", 3);
  const guard = skillFigure("yeu-tinh-chuc-phuc", "guard", 1);
  const cap = ally.maxHp || ally.hp;
  const field = paid.field.map((mon) => {
    if (!mon) return mon;
    if (mon.uid === fairy.uid && mon.uid === ally.uid) {
      return {
        ...mon,
        dim: true,
        hp: Math.min(cap, mon.hp + heal),
        tempGuard: mon.cage ? mon.tempGuard : (mon.tempGuard ?? 0) + guard,
      };
    }
    if (mon.uid === fairy.uid) return { ...mon, dim: true };
    if (mon.uid === ally.uid) {
      return {
        ...mon,
        hp: Math.min(cap, mon.hp + heal),
        tempGuard: mon.cage ? mon.tempGuard : (mon.tempGuard ?? 0) + guard,
      };
    }
    return mon;
  });
  return note(patch(state, side, { ...paid, field }), `${cardOf(ally).name} được ${cardOf(fairy).name} hồi ${heal} và +${guard} phòng ngự`, "heal");
}

export function armHorn(state: Duel, uid: string, mode: "splash" | "plus"): Duel {
  const side = (state.players[0].field.some((mon) => mon?.uid === uid) ? 0 : 1) as Side;
  const you = state.players[side];
  const field = you.field.map((mon) => (mon?.uid === uid && mon.horn ? { ...mon, horn: mode, hornNew: false } : mon));
  return patch(state, side, { ...you, field });
}

export function dismissGlimpse(state: Duel): Duel {
  return { ...state, glimpse: null };
}

function threatRank(mon: FieldMon): number {
  if (mon.cardId === "cuc-bong-ma-quai" && !mon.copy) return 130;
  if (mon.cardId === "quai-thu-thien-su") return 120;
  if (mon.cardId === "ga-he-dang-so" && mon.charge >= 2) return 110;
  if (mon.cardId === "ga-he-dang-so" && mon.charge >= 1) return 100;
  if (mon.cardId === "phu-thuy-thoi-gian") return 40;
  return monsterCard(mon.cardId)?.atk ?? 0;
}

function mustKill(mon: FieldMon): boolean {
  return (mon.cardId === "cuc-bong-ma-quai" && !mon.copy) || mon.cardId === "quai-thu-thien-su" || (mon.cardId === "ga-he-dang-so" && mon.charge >= 1);
}

function spellHurt(mon: FieldMon, amount: number): number {
  return hurt(mon, Math.max(0, amount - liveMdef(mon)));
}

function clashCost(attacker: FieldMon, defender: FieldMon) {
  const deal = hurt(defender, physical(outgoing(attacker, attacker.atk), defender.def));
  const take = hurt(attacker, physical(outgoing(defender, defender.atk), attacker.def));
  return { deal, take, kill: deal >= defender.hp && deal > 0, suicide: take >= attacker.hp && take > 0 };
}

function withLive(next: Duel): Duel {
  const last = next.log.at(-1) ?? "";
  return { ...next, live: last || next.live };
}

function progress(state: Duel, next: Duel): Duel | null {
  if (
    next.players[0] === state.players[0] &&
    next.players[1] === state.players[1] &&
    next.step === state.step &&
    next.pending === state.pending &&
    next.turn === state.turn
  ) {
    return null;
  }
  return next;
}

function chooseBlock(state: Duel): { uid: string | null; skill: boolean } {
  const pending = state.pending;
  if (!pending || pending.kind !== "face") return { uid: null, skill: false };
  const options = state.players[1].field.filter((mon): mon is FieldMon => Boolean(mon && !mon.dim && mon.stun === 0 && !mon.noBlock && !(mon.path ?? 0)));
  if (options.length === 0) return { uid: null, skill: false };
  const style = readStyle();
  const skillOf = (mon: FieldMon) => mon.cardId === "chien-si-gam-nham" && state.players[1].orb >= skillManaCost(mon.cardId);
  const attacker = state.players[0].field.find((mon) => mon?.uid === pending.attacker) ?? null;
  if (!attacker) return { uid: null, skill: false };
  let best: FieldMon | null = null;
  let bestScore = -Infinity;
  for (const mon of options) {
    if (smashPlain(mon) && state.players[1].orb < 1) continue;
    if (mon.cardId === GUARD_KNIGHT && state.players[1].orb < 1) continue;
    const hit = clashCost(attacker, mon);
    let score = attacker.atk * 2;
    if (hit.kill && !hit.suicide) score += 80;
    else if (!hit.suicide) score += 30 - hit.take;
    else score -= 50 + threatRank(mon);
    if (mustKill(mon) && hit.suicide) score -= 80;
    if (score > bestScore) {
      best = mon;
      bestScore = score;
    }
  }
  if (!best) return { uid: null, skill: false };
  const lean = state.adapt ?? readLean();
  if (lean.ready && lean.block !== 0) {
    if (tilt(bestScore, lean.block) < attacker.atk) return { uid: null, skill: false };
    return { uid: best.uid, skill: skillOf(best) };
  }
  if (style.blockEager === true) return { uid: best.uid, skill: skillOf(best) };
  if (bestScore < attacker.atk) return { uid: null, skill: false };
  if (style.blockEager === false && bestScore < attacker.atk * 2) return { uid: null, skill: false };
  return { uid: best.uid, skill: skillOf(best) };
}

function gnawWorth(state: Duel): boolean {
  const pending = state.pending;
  if (pending?.kind === "gnaw-skill") {
    const ownerSide = (state.players[0].field.some((mon) => mon?.uid === pending.target) ? 0 : 1) as Side;
    return state.players[ownerSide].orb >= skillManaCost("chien-si-gam-nham");
  }
  if (pending?.kind !== "gnaw" && pending?.kind !== "melee") return false;
  const defenderUid = pending.kind === "melee" ? (state.hold?.blocker ?? pending.defender) : pending.defender;
  const attacker = state.players[state.turn].field.find((mon) => mon?.uid === pending.attacker) ?? null;
  const defender = state.players[(1 - state.turn) as Side].field.find((mon) => mon?.uid === defenderUid) ?? null;
  const bonus = skillHpBonus("chien-si-gam-nham");
  if (!attacker || !defender || state.players[(1 - state.turn) as Side].orb < skillManaCost("chien-si-gam-nham")) return false;
  const before = clashCost(attacker, defender);
  const after = clashCost(attacker, { ...defender, def: defender.def * 2, hp: defender.hp + bonus });
  return (before.kill && !after.kill) || after.take < before.take;
}

function askedNow(prev: Duel, next: Duel): boolean {
  return Boolean(
    (next.step === "respond" && prev.step !== "respond") ||
      (next.pending && !prev.pending) ||
      (next.upkeep && !prev.upkeep) ||
      (next.gemCap && !prev.gemCap) ||
      (next.gemWarn && !prev.gemWarn) ||
      (next.parley && !prev.parley) ||
      (next.preyAsk && !prev.preyAsk) ||
      (next.birdAsk && !prev.birdAsk) ||
      (next.plumeAsk && !prev.plumeAsk) ||
      (next.recall && !prev.recall) ||
      (next.legs && !prev.legs),
  );
}

function oneMain(prev: Duel, next: Duel | null): Duel | null {
  if (!next || next === prev) return null;
  if (askedNow(prev, next)) return next;
  if (next.players[0] === prev.players[0] && next.players[1] === prev.players[1] && next.step === prev.step && next.pending === prev.pending && next.turn === prev.turn) return null;
  return next;
}

function learnedOffer(state: Duel): Duel | null {
  const me = state.players[state.turn];
  const lean = state.adapt ?? readLean();
  if (!lean.ready || (lean.summon <= 0 && lean.spend <= 0)) return null;
  const board = me.field.filter(Boolean).length;
  const order: Array<"draw" | "summon"> = [];
  if (lean.summon > 0 && lean.spend > 0) {
    if (board > 0) order.push("draw", "summon");
    else order.push("summon");
  } else if (lean.spend > 0) order.push("draw");
  else order.push("summon");
  const style = readStyle();
  const bias = summonBias((me.turns ?? 0) < 3, style.oneStar, lean);
  for (const kind of order) {
    const next = kind === "summon" ? (me.summons < 1 ? summonPick(state, bias) : null) : offerLearnedDraw(state, style, lean);
    const taken = oneMain(state, next);
    if (taken) return taken;
  }
  return null;
}

function offerLearnedDraw(state: Duel, style: ReturnType<typeof readStyle>, lean: Lean): Duel | null {
  const me = state.players[state.turn];
  if (me.drawLock || me.draws >= 1 || me.orb < 1) return null;
  const kind = learnedDraw(me, me.field.filter(Boolean).length, style, lean);
  if (!kind) return null;
  return draw(state, kind);
}

export function aiStep(state: Duel): Duel {
  if (state.mode !== "ai" || state.winner !== null || state.reel) return state;
  if (state.parley && state.step === "main") {
    const picker = parleyPicker(state);
    if (picker !== 1) return state;
    const talk = state.parley;
    const options = state.players[picker].field.filter((mon): mon is FieldMon => Boolean(mon && mon.hp > 0 && mon.cardId !== "mu" && !(talk.kind === "mystic" && talk.step === "pick-victim" && mon.uid === talk.queen)));
    if (options.length === 0 && talk.kind === "mystic" && talk.step === "pick-victim") return withLive(pickParley(state, "face"));
    const lunging = talk.step === "pick-lunger" || talk.step === "pick-lunger2";
    const pick = [...options].sort((a, b) => (lunging ? b.atk - a.atk : a.hp - b.hp))[0];
    if (!pick) return { ...state, parley: null };
    return withLive(pickParley(state, pick.uid));
  }
  if (state.birdAsk && state.players[1].field.some((mon) => mon?.uid === state.birdAsk?.uid)) return withLive(evolveBird(state, "nu-chua-dieu-nhan"));
  if (state.plumeAsk && state.turn === 1) return withLive(answerPlume(state, state.players[1].orb >= harpyKit(state.players[1].field.find((mon) => mon?.uid === state.plumeAsk?.bird)?.cardId ?? "").lash));
  if (state.recall?.side === 1) return withLive(confirmRecall(state, chooseRecall(state.players[1].reserve, state.recall.caps, state.players[1].orb)));
  if (state.legs && state.turn === 1 && state.step === "main") {
    const you = state.players[1];
    const open = you.field.filter((unit, index) => !unit && (you.locked?.[index] ?? 0) === 0).length;
    return withLive(answerLegs(state, you.orb >= 1 ? Math.min(1, open) : 0));
  }
  if (state.gemWarn === 1 && state.turn === 1 && state.step === "main") return withLive(answerGemWarn(state));
  if (state.gemCap === 1 && state.turn === 1 && state.step === "main") return withLive(answerGemCap(state, true));
  if (state.upkeep && state.turn === 1 && state.step === "main") return withLive(answerUpkeep(state, state.players[1].orb >= 1));
  if (state.preyAsk && state.turn === 1 && state.step === "main") return withLive(answerPrey(state, true));
  if (state.step === "respond" && state.hold?.priority === 1) {
    const plume = harpyOffer(state, 1);
    if (plume === "armor") return withLive(harpyWard(state));
    if (plume === "lash") return withLive(harpyLash(state));
    const pending = state.pending;
    const foe = (1 - state.turn) as Side;
    let knight: FieldMon | null = null;
    let other: FieldMon | null = null;
    if (pending?.kind === "melee" || (pending?.kind === "face" && state.hold.blocker)) {
      const attacker = state.players[state.turn].field.find((mon) => mon?.uid === pending.attacker) ?? null;
      const defId = pending.kind === "melee" ? (state.hold.blocker ?? pending.defender) : state.hold.blocker;
      const defender = defId ? state.players[foe].field.find((mon) => mon?.uid === defId) ?? null : null;
      if (state.turn !== 1 && defender && knightOpen(defender)) {
        knight = defender;
        other = attacker;
      } else if (state.turn === 1 && attacker && knightOpen(attacker)) {
        knight = attacker;
        other = defender;
      }
    }
    if (!knight && pending?.kind === "face" && !state.hold.blocker) {
      const choice = chooseBlock(state);
      const picked = choice.uid ? state.players[1].field.find((mon) => mon?.uid === choice.uid) ?? null : null;
      if (picked && knightOpen(picked)) {
        knight = picked;
        other = state.players[0].field.find((mon) => mon?.uid === pending.attacker) ?? null;
      }
    }
    if (knight) {
      const stars = other ? (monsterCard(other.cardId)?.stars ?? 0) : 0;
      const room = other && (other.atk > knight.atk || stars >= 4);
      return withLive(primeKnight(state, knight.uid, room ? ["atk", "def"] : ["atk"]));
    }
    if (state.pending?.kind === "lash" || chargedWhip(state)) {
      const index = state.players[1].hand.indexOf("hap-thu-ma-phap");
      if (index >= 0) return withLive(castSpell(state, index, null));
    }
    if (state.pending?.kind === "spell" && state.turn !== 1) {
      const index = state.players[1].hand.indexOf("hap-thu-ma-phap");
      if (index >= 0) return withLive(castSpell(state, index, null));
    }
    if (state.pending?.kind === "face") {
      if (!state.hold.blocker) {
        const choice = chooseBlock(state);
        if (choice.uid) return withLive(assignBlock(state, choice.uid, choice.skill));
      }
    }
    const soldier = state.players[1].field.find((mon) => mon && canWall(state, mon.uid));
    if (soldier && state.pending) {
      const pending = state.pending;
      const aimUid =
        pending.kind === "melee" || pending.kind === "gnaw"
          ? pending.defender
          : pending.kind === "beam" || pending.kind === "gnaw-skill"
            ? pending.target
            : null;
      const ally = aimUid ? state.players[1].field.find((mon) => mon?.uid === aimUid) : null;
      if (ally && ally.hp < soldier.hp) return withLive(wallAlly(state, soldier.uid));
    }
    const guard = state.players[1].field.find((mon) => mon && canGuardCover(state, mon.uid));
    if (guard && state.pending) {
      const pending = state.pending;
      const aimUid = pending.kind === "melee" || pending.kind === "gnaw" ? pending.defender : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell" ? pending.target : null;
      const ally = aimUid ? state.players[1].field.find((mon) => mon?.uid === aimUid) : null;
      if (ally && ally.hp <= guard.hp) return withLive(guardCover(state, guard.uid));
    }
    if (state.pending?.kind === "gnaw" || state.pending?.kind === "gnaw-skill") return withLive(answerGnaw(state, gnawWorth(state)));
    if (state.pending?.kind === "melee") {
      const melee = state.pending;
      const defender = state.players[1].field.find((mon) => mon?.uid === (state.hold?.blocker ?? melee.defender)) ?? null;
      if (defender && gnawReady(defender, state.players[1]) && gnawWorth(state)) {
        const boosted = boostGnawOnChain(state);
        if (boosted.step !== "respond" || boosted.players !== state.players) return withLive(boosted);
      }
    }
    if (state.pending?.kind === "beam" && state.turn !== 1) {
      const beam = state.pending;
      const owner = state.players[1];
      const gnaws = owner.field.filter((mon): mon is FieldMon => gnawReady(mon, owner));
      const hit = beam.target ? gnaws.find((mon) => mon.uid === beam.target) : gnaws[0];
      if (hit && state.hold && state.hold.armed !== hit.uid) return withLive(boostGnawOnChain(state, hit.uid));
    }
    return withLive(passResponse(state));
  }
  if (state.turn !== 1 || state.step !== "main") return state;
  if (state.players[1].acted) return endTurn(state);
  const openingPlan = develop(state);
  if (openingPlan) return withLive(openingPlan);
  const me = state.players[1];
  const foe = state.players[0];
  const foes = foe.field.filter((mon): mon is FieldMon => Boolean(mon));
  const threats = foes.filter(mustKill).sort((a, b) => threatRank(b) - threatRank(a));
  const ready = me.field.filter((mon): mon is FieldMon => Boolean(mon && !mon.dim && mon.stun === 0));
  const room = me.field.some((slot) => !slot);
  const canSummon = me.reserve.some((held) => {
    const card = monsterCard(held.id);
    return Boolean(card && me.stars >= card.stars && playBill(card.gems, Boolean(held.toll), me.orb, me.flask) === null);
  });

  const chrono = ready.find((mon) => mon.cardId === "phu-thuy-thoi-gian");
  if (chrono && canTargetFoe(state)) {
    const lowAlly = me.field.some((mon) => mon && mon.uid !== chrono.uid && cardStars(mon.cardId, mon.level ?? 1) < 3);
    if (me.orb >= 2 && (foes.length > 0 || lowAlly)) {
      const wave = progress(state, useSkill(state, chrono.uid, null, 2, true));
      if (wave) return wave;
    }
    const target = threats.find((mon) => !isImmortal(mon)) ?? foes.find((mon) => !isImmortal(mon));
    if (target) {
      const cast = progress(state, useSkill(state, chrono.uid, target.uid, 0, true));
      if (cast) return cast;
    }
  }

  const perfect = me.field.find((mon) => mon?.cardId === PERFECT && mon.hp > 0 && mon.stun === 0 && (mon.chain ?? 0) === 0);
  if (perfect && canTargetFoe(state) && foe.hand.some((id) => spellCard(id) && !spellCard(id)?.env)) {
    const cast = progress(state, useSkill(state, perfect.uid, null, 0, true));
    if (cast) return cast;
  }
  if (perfect && !perfect.bolt && me.orb >= 1) {
    const cast = progress(state, useSkill(state, perfect.uid, null, 2, true));
    if (cast) return cast;
  }
  if (perfect && !perfect.dim && canTargetFoe(state) && threats[0]) {
    const cast = progress(state, useSkill(state, perfect.uid, perfect.uid, 3, true, threats[0].uid));
    if (cast) return cast;
  }

  const bird = ready.find((mon) => isHarpy(mon.cardId));
  if (bird && canTargetFoe(state) && !(bird.shed ?? []).includes("gust") && me.orb >= harpyKit(bird.cardId).gust && foe.hand.some((id) => spellCard(id) && !spellCard(id)?.env)) {
    const cast = progress(state, useSkill(state, bird.uid, null, 0));
    if (cast) return cast;
  }
  if (bird?.lure && canTargetFoe(state) && threats[0]) {
    const cast = progress(state, useSkill(state, bird.uid, bird.uid, 3, true, threats[0].uid));
    if (cast) return cast;
  }
  if (bird && !bird.lure && canTargetFoe(state) && !(bird.shed ?? []).includes("charm") && me.orb >= harpyKit(bird.cardId).charm && threats[0]) {
    const cast = progress(state, declareSkill(state, bird.uid, threats[0].uid, 1));
    if (cast) return cast;
  }

  if (canTargetFoe(state) && me.attackLock === 0 && threats.length > 0) {
    let best: { atk: FieldMon; def: FieldMon; take: number; suicide: boolean } | null = null;
    for (const atk of ready) {
      if (smashPlain(atk) && me.orb < 1) continue;
      if (swordDue(atk) && me.orb < 1) continue;
      for (const def of threats) {
        if (kazuraSafe(def)) continue;
        const hit = clashCost(atk, def);
        if (!hit.kill) continue;
        if (!best || Number(hit.suicide) < Number(best.suicide) || (hit.suicide === best.suicide && (hit.take < best.take || threatRank(def) > threatRank(best.def)))) {
          best = { atk, def, take: hit.take, suicide: hit.suicide };
        }
      }
    }
    if (best) {
      const swung = attackMonster(state, best.atk.uid, best.def.uid);
      return withLive(patch(swung, 1, { ...swung.players[1], acted: true }));
    }
  }

  const mammoth = ready.find((mon) => mon.cardId === "mo-voi-ma-mut");
  if (mammoth && me.orb >= 1 && canTargetFoe(state)) {
    const victim = threats.find((mon) => spellHurt(mon, mammoth.hp) >= mon.hp) ?? foes.find((mon) => spellHurt(mon, mammoth.hp) >= mon.hp);
    if (victim) {
      const cast = progress(state, useSkill(state, mammoth.uid, victim.uid, 0, true));
      if (cast) return cast;
    }
  }
  const witch = ready.find((mon) => mon.cardId === "phu-thuy-ti-hon");
  if (witch && me.orb >= 1 && canTargetFoe(state)) {
    const victim = threats.find((mon) => spellHurt(mon, 3 + me.stars) >= mon.hp);
    if (victim) {
      const cast = progress(state, declareSkill(state, witch.uid, victim.uid, 0));
      if (cast) return cast;
    }
  }
  const queen = ready.find((mon) => mon.cardId === QUEEN_KNIGHT && !hexLocked(mon) && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0 && !mon.cage);
  if (queen && canTargetFoe(state) && foes.length > 0 && me.orb >= queenSwing(queen).cost) {
    const victim = threats.find((mon) => !kazuraSafe(mon)) ?? foes.find((mon) => !kazuraSafe(mon));
    if (victim) {
      const cast = progress(state, declareSkill(state, queen.uid, victim.uid, 0));
      if (cast) return cast;
    }
  }
  const clown = ready.find((mon) => mon.cardId === "ga-he-dang-so");
  if (clown && clown.charge >= 2 && canTargetFoe(state)) {
    const amount = skillFigure("ga-he-dang-so", "dmg", 5) + skillFigure("ga-he-dang-so", "dmg", 4, 1) * Math.floor((clown.charge - 2) / 2);
    const victim = threats.find((mon) => spellHurt(mon, amount) >= mon.hp) ?? foes.find((mon) => spellHurt(mon, amount) >= mon.hp);
    if (victim) {
      const cast = progress(state, declareSkill(state, clown.uid, victim.uid, 1));
      if (cast) return cast;
    }
  }
  if (clown && clown.charge > 0 && me.orb >= 1) {
    const cast = progress(state, useSkill(state, clown.uid, null, 0));
    if (cast) return cast;
  }

  const grown = develop(state);
  if (grown) return withLive(grown);

  const leanNow = state.adapt ?? readLean();
  const styleNow = readStyle();
  const bias = summonBias((me.turns ?? 0) < 3, styleNow.oneStar, leanNow);
  const deferSummon = leanNow.ready && leanNow.summon > 0 && leanNow.spend > 0 && me.field.some(Boolean);
  if (!deferSummon && threats.length === 0 && room && canSummon && me.summons < 1 && ready.length === 0) {
    const called = summonPick(state, bias);
    if (called) return called;
  }
  if (!deferSummon && threats.length === 0 && !(room && canSummon) && !me.drawLock && me.draws < 1 && me.orb >= 2) {
    const eager = leanNow.ready && leanNow.spend !== 0 ? leanNow.spend > 0 : styleNow.spendAll;
    const opening = (me.turns ?? 0) < 3;
    if (opening ? eager || me.stars < 2 : me.stars < 2) {
      const kind = learnedDraw(me, me.field.filter(Boolean).length, styleNow, leanNow);
      if (kind) return draw(state, kind);
    }
  }
  if (!deferSummon && threats.length === 0 && room && canSummon && me.summons < 1) {
    const called = summonPick(state, bias);
    if (called) return called;
  }
  if (!deferSummon && threats.length === 0 && room) {
    const called = summonAside(state);
    if (called) return called;
  }

  const rhino = ready.find((mon) => mon.cardId === "te-giac-be-con" && (mon.level ?? 1) < 3);
  if (threats.length === 0 && rhino && me.orb >= rhinoRankCost(rhino.level ?? 1) && foes.length === 0) {
    const cast = progress(state, useSkill(state, rhino.uid, null, 0));
    if (cast) return cast;
  }
  if (threats.length === 0 && clown && me.orb >= 1 && clown.charge < 2 && foes.length === 0) {
    const cast = progress(state, useSkill(state, clown.uid, null, 0));
    if (cast) return cast;
  }
  const peeked = state.log.some((line) => line.includes("làm lộ quái dự bị"));
  const dragon = ready.find((mon) => mon.cardId === "rong-phun-hoa-cau");
  if (threats.length === 0 && dragon && !peeked && me.orb >= Math.max(skillManaCost(dragon.cardId), 2) && canTargetFoe(state) && foe.reserve.length > 0 && ready.length > 1) {
    const cast = progress(state, declareSkill(state, dragon.uid, null, 0));
    if (cast) return cast;
  }

  const offered = learnedOffer(state);
  if (offered) return withLive(offered);
  if (deferSummon && threats.length === 0 && room) {
    const aside = oneMain(state, summonAside(state));
    if (aside) return withLive(aside);
  }

  if (canTargetFoe(state) && me.attackLock === 0 && ready.length > 0) {
    const style = readStyle();
    const lean = state.adapt ?? readLean();
    const faceFirst = [...ready].filter((mon) => (!smashPlain(mon) && !swordDue(mon)) || me.orb >= 1).sort((a, b) => b.atk - a.atk)[0];
    const bestClash = (strict: boolean) => {
      let found: { atk: FieldMon; def: FieldMon; deal: number; take: number } | null = null;
      for (const atk of ready) {
        if (smashPlain(atk) && me.orb < 1) continue;
        if (swordDue(atk) && me.orb < 1) continue;
        for (const def of foes) {
          if (kazuraSafe(def)) continue;
          const hit = clashCost(atk, def);
          if (hit.deal <= 0) continue;
          if (strict && hit.take > hit.deal && !hit.kill) continue;
          const score = (hit.kill ? 50 : 0) + hit.deal - hit.take + threatRank(def);
          const prev = found ? (clashCost(found.atk, found.def).kill ? 50 : 0) + found.deal - found.take + threatRank(found.def) : -Infinity;
          if (!found || score > prev) found = { atk, def, deal: hit.deal, take: hit.take };
        }
      }
      return found;
    };
    const fair = bestClash(true);
    const anyHit = bestClash(false);
    const swing = chooseSwing(Boolean(faceFirst && faceFirst.atk > 0), Boolean(anyHit), lean);
    const historySwing = lean.ready && swing !== "default";
    if (!historySwing && (style.preferFace === true || (style.preferFace === null && swing === "face")) && faceFirst && faceFirst.atk > 0) {
      const swung = attackFace(state, faceFirst.uid);
      return withLive(patch(swung, 1, { ...swung.players[1], acted: true }));
    }
    if (historySwing && swing === "face" && faceFirst && faceFirst.atk > 0) {
      const swung = attackFace(state, faceFirst.uid);
      return withLive(patch(swung, 1, { ...swung.players[1], acted: true }));
    }
    const monsterHit = swing === "monster" ? (fair ?? anyHit) : fair;
    if (monsterHit && (historySwing || style.preferFace !== true)) {
      const swung = attackMonster(state, monsterHit.atk.uid, monsterHit.def.uid);
      return withLive(patch(swung, 1, { ...swung.players[1], acted: true }));
    }
    const face = faceFirst;
    if (face && face.atk > 0) {
      const swung = attackFace(state, face.uid);
      return withLive(patch(swung, 1, { ...swung.players[1], acted: true }));
    }
  }
  return endTurn(state);
}
