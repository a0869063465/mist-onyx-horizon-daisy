import assert from "node:assert/strict";
import test from "node:test";
import { ADAPT_CAP, ADAPT_MIN_GAMES, chooseSwing, emptyLean, learnFrom, tilt } from "./adapt.ts";
import { aiStep, createDuel, endTurn, testGrant, type Duel } from "./duel.ts";
import { emptyHabits, saveHabits, type HabitCounts } from "./habits.ts";

function actions(kind: string, count: number, extra: Record<string, unknown> = {}) {
  return Array.from({ length: count }, () => ({ actor: 0, ok: true, kind, orb: [1, 1], cardId: "phu-thuy-thoi-gian", auto: false, ...extra }));
}

function finished(events: unknown[], winner: 0 | 1 | null = 0) {
  return { mode: "ai", winner, events };
}

test("too few matches keep the default lean", () => {
  const lean = learnFrom([finished(actions("attack-face", 8)), finished(actions("attack-face", 8))]);
  assert.equal(lean.ready, false);
  assert.equal(lean.games, 2);
  assert.equal(lean.counts.face, 16);
  assert.equal(lean.face, 0);
  assert.equal(lean.monster, 0);
  assert.deepEqual(chooseSwing(true, true, lean), "default");
  assert.deepEqual(chooseSwing(true, true, emptyLean()), "default");
});

test("finished matches build a bounded style and ignore junk", () => {
  const rows = [
    finished(actions("attack-face", 4), 0),
    finished(actions("attack-face", 4), 0),
    finished(actions("attack-monster", 1), 1),
    finished([...actions("spell", 3), ...actions("skill", 1)], 0),
    finished([{ actor: 0, ok: true, kind: "concede", orb: [0, 0] }, ...actions("attack-face", 9)], 1),
    null,
    { mode: "hotseat", winner: 0, events: actions("attack-face", 9) },
    { mode: "ai", winner: 0 },
    { mode: "ai", winner: 3, events: [] },
  ];
  const lean = learnFrom(rows);
  assert.equal(lean.games, 5);
  assert.equal(lean.used, 4);
  assert.equal(lean.wins, 3);
  assert.equal(lean.losses, 1);
  assert.equal(lean.concedes, 1);
  assert.equal(lean.counts.face, 8);
  assert.equal(lean.ready, true);
  assert.ok(lean.face > 0);
  assert.ok(lean.face <= ADAPT_CAP);
  assert.ok(lean.monster >= -ADAPT_CAP);
  assert.equal(learnFrom(null).ready, false);
  assert.equal(learnFrom("nope").games, 0);
  const flooded = learnFrom(Array.from({ length: ADAPT_MIN_GAMES }, () => finished(actions("attack-face", 20))));
  assert.equal(flooded.face, ADAPT_CAP);
  assert.equal(tilt(5, 10_000), 5 + ADAPT_CAP);
  assert.equal(tilt(5, -10_000), 5 - ADAPT_CAP);
  const auto = learnFrom(Array.from({ length: 4 }, () => finished([{ actor: 0, ok: true, auto: true, kind: "result", orb: [1, 1] }, ...actions("attack-face", 2)])));
  assert.equal(auto.counts.face, 8);
});

test("a face lean changes the legal attack the AI picks", () => {
  let duel = createDuel({ monsters: ["phu-thuy-thoi-gian"], spells: ["mua-ma-thuat"] }, "test");
  duel = testGrant(duel, 1, "may-chem", true);
  duel = testGrant(duel, 0, "phu-thuy-thoi-gian", true);
  const axe = duel.players[1].field[0];
  assert.ok(axe);
  const board: Duel = {
    ...duel,
    mode: "ai",
    turn: 1,
    players: [
      duel.players[0],
      {
        ...duel.players[1],
        turns: 5,
        summons: 1,
        draws: 1,
        acted: false,
        attackLock: 0,
        field: [axe, { ...axe, uid: "dim-a", dim: true }, { ...axe, uid: "dim-b", dim: true }],
      },
    ],
  };
  const plain = aiStep(board);
  assert.equal(plain.pending?.kind, "melee");
  const leaned = learnFrom(Array.from({ length: 4 }, () => finished(actions("attack-face", 6))));
  const swung = aiStep({ ...board, adapt: leaned });
  assert.equal(swung.pending?.kind, "face");
  assert.equal(swung.mode, "ai");
  assert.equal(chooseSwing(true, true, leaned), "face");
  const quiet = aiStep(endTurn(createDuel(undefined, "ai")));
  assert.equal(quiet.mode, "ai");
  assert.ok(quiet.step === "main" || quiet.step === "respond" || quiet.step === "over");
});

function withHabits(counts: Partial<HabitCounts>, run: () => void) {
  const memory = new Map<string, string>();
  const store = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  };
  const host = globalThis as { localStorage?: Storage };
  const previous = host.localStorage;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: store });
  saveHabits({ ...emptyHabits(), ...counts });
  try {
    run();
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previous });
    else delete host.localStorage;
  }
}

function readyHabits(extra: Partial<HabitCounts> = {}): Partial<HabitCounts> {
  return { games: 2, earlyTurns: 4, ...extra };
}

function attackBoard(attackerId: string, defenderId: string): Duel {
  let duel = createDuel({ monsters: ["phu-thuy-thoi-gian"], spells: ["mua-ma-thuat"] }, "test");
  duel = testGrant(duel, 1, attackerId, true);
  duel = testGrant(duel, 0, defenderId, true);
  const axe = duel.players[1].field[0];
  if (!axe) throw new Error("missing attacker");
  return {
    ...duel,
    mode: "ai",
    turn: 1,
    players: [
      duel.players[0],
      {
        ...duel.players[1],
        turns: 5,
        summons: 1,
        draws: 1,
        acted: false,
        attackLock: 0,
        field: [axe, { ...axe, uid: "dim-a", dim: true }, { ...axe, uid: "dim-b", dim: true }],
      },
    ],
  };
}

function summonBoard(): Duel {
  let duel = createDuel({ monsters: ["ong-khong-lo"], spells: ["mua-ma-thuat"] }, "test");
  return {
    ...duel,
    mode: "ai",
    turn: 1,
    players: [
      duel.players[0],
      {
        ...duel.players[1],
        turns: 1,
        stars: 4,
        orb: 3,
        summons: 0,
        draws: 1,
        reserve: [
          { id: "phu-thuy-thoi-gian", hp: 1, maxHp: 1 },
          { id: "ong-khong-lo", hp: 3, maxHp: 3 },
        ],
        field: [null, null, null],
      },
    ],
  };
}

function drawBoard(): Duel {
  let duel = createDuel({ monsters: ["ong-khong-lo"], spells: ["mua-ma-thuat", "hoan-doi"] }, "test");
  duel = testGrant(duel, 1, "ong-khong-lo", true);
  const planted = duel.players[1].field[0];
  if (!planted) throw new Error("missing planted monster");
  return {
    ...duel,
    mode: "ai",
    turn: 1,
    players: [
      duel.players[0],
      {
        ...duel.players[1],
        turns: 1,
        stars: 4,
        orb: 3,
        summons: 1,
        draws: 0,
        monsterDeck: [{ id: "may-chem", hp: 3, maxHp: 3 }],
        spellDeck: ["hoan-doi"],
        field: [planted, { ...planted, uid: "dim-a", dim: true }, { ...planted, uid: "dim-b", dim: true }],
      },
    ],
  };
}

test("a monster lean takes a bad trade the default attack skips", () => {
  const board = attackBoard("linh-chien-da-khong-lo", "may-chem");
  assert.equal(aiStep(board).pending?.kind, "face");
  const leaned = learnFrom(Array.from({ length: 4 }, () => finished(actions("attack-monster", 6))));
  assert.ok(leaned.monster > 0);
  assert.equal(aiStep({ ...board, adapt: leaned }).pending?.kind, "melee");
});

test("habits choose the attack until that history axis has a direction", () => {
  const board = attackBoard("may-chem", "phu-thuy-thoi-gian");
  assert.equal(aiStep(board).pending?.kind, "melee");
  withHabits(readyHabits({ face: 3, monsterSwings: 0, blocks: 1 }), () => {
    assert.equal(aiStep(board).pending?.kind, "face");
    const blank = learnFrom(Array.from({ length: 4 }, () => finished(actions("end-turn", 1))));
    assert.equal(blank.ready, true);
    assert.equal(blank.face, 0);
    assert.equal(aiStep({ ...board, adapt: blank }).pending?.kind, "face");
    const monsters = learnFrom(Array.from({ length: 4 }, () => finished(actions("attack-monster", 6))));
    assert.equal(aiStep({ ...board, adapt: monsters }).pending?.kind, "melee");
  });
});

test("star lean overrides the default and the habit in both directions", () => {
  const board = summonBoard();
  const summoned = (state: Duel) => state.players[1].field.find((mon) => mon)?.cardId;
  assert.equal(summoned(aiStep(board)), "phu-thuy-thoi-gian");
  const high = learnFrom(Array.from({ length: 4 }, () => finished(actions("summon", 6, { cardId: "ong-khong-lo" }))));
  assert.ok(high.lowStar < 0);
  assert.equal(summoned(aiStep({ ...board, adapt: high })), "ong-khong-lo");
  const low = learnFrom(Array.from({ length: 4 }, () => finished(actions("summon", 6, { cardId: "phu-thuy-thoi-gian" }))));
  assert.ok(low.lowStar > 0);
  withHabits(readyHabits({ summonOne: 0, summonHigher: 3, monsterDraws: 4 }), () => {
    assert.equal(summoned(aiStep(board)), "ong-khong-lo");
    assert.equal(summoned(aiStep({ ...board, adapt: low })), "phu-thuy-thoi-gian");
  });
});

test("spend lean spends or holds when the default and the habit disagree", () => {
  const board = drawBoard();
  const drew = (state: Duel) => state.players[1].draws > board.players[1].draws;
  assert.equal(drew(aiStep(board)), true);
  const hold = learnFrom(Array.from({ length: 4 }, () => finished([{ actor: 0, ok: true, auto: false, kind: "end-turn", orb: [2, 1] }, { actor: 0, ok: true, auto: false, kind: "end-turn", orb: [2, 1] }])));
  assert.ok(hold.spend < 0);
  assert.equal(drew(aiStep({ ...board, adapt: hold })), false);
  const spend = learnFrom(Array.from({ length: 4 }, () => finished([
    { actor: 0, ok: true, auto: false, kind: "draw", orb: [3, 1] },
    { actor: 0, ok: true, auto: false, kind: "draw", orb: [2, 1] },
    { actor: 0, ok: true, auto: false, kind: "summon", orb: [1, 1] },
  ])));
  assert.ok(spend.spend > 0);
  withHabits(readyHabits({ spentAll: 0, keptMana: 3, monsterDraws: 4 }), () => {
    assert.equal(drew(aiStep(board)), false);
    assert.equal(drew(aiStep({ ...board, adapt: spend })), true);
  });
});

test("spell lean overrides the draw habit in both directions", () => {
  const board = drawBoard();
  const pile = (state: Duel) => {
    if (state.players[1].spellDeck.length < board.players[1].spellDeck.length) return "spell";
    if (state.players[1].monsterDeck.length < board.players[1].monsterDeck.length) return "monster";
    return "none";
  };
  assert.equal(pile(aiStep(board)), "spell");
  const skills = learnFrom(Array.from({ length: 4 }, () => finished(actions("skill", 6))));
  assert.ok(skills.spell < 0);
  assert.equal(pile(aiStep({ ...board, adapt: skills })), "monster");
  const spells = learnFrom(Array.from({ length: 4 }, () => finished(actions("spell", 6))));
  assert.ok(spells.spell > 0);
  withHabits(readyHabits({ spellDraws: 0, monsterDraws: 4 }), () => {
    assert.equal(pile(aiStep(board)), "monster");
    assert.equal(pile(aiStep({ ...board, adapt: spells })), "spell");
  });
});

function mark(id: string, kind: string, extra: Record<string, unknown> = {}) {
  return { id, actor: 0, ok: true, auto: false, kind, orb: [1, 1], ...extra };
}

function faceHit(id: string) {
  return { id, actor: 1, ok: true, auto: false, kind: "attack-face", orb: [1, 1] };
}

function blow(id: string, cause: string) {
  return { id, actor: 1, ok: true, auto: true, kind: "result", cause, orb: [1, 1] };
}

function blockStory(blocks: number, lets: number) {
  const events = [mark("summon", "summon", { cardId: "ong-khong-lo" })];
  for (let i = 0; i < blocks; i += 1) events.push(faceHit(`face-${i}`), mark(`block-${i}`, "block", { cardId: "ong-khong-lo" }), blow(`hit-${i}`, `face-${i}`));
  for (let i = 0; i < lets; i += 1) events.push(faceHit(`open-${i}`), mark(`pass-${i}`, "pass"), blow(`done-${i}`, `open-${i}`));
  return events;
}

function repeated(events: unknown[], games = 4) {
  return learnFrom(Array.from({ length: games }, () => finished(events)));
}

test("block history pairs one face attack with the player's own choice", () => {
  const mixed = repeated(blockStory(2, 2));
  assert.equal(mixed.ready, true);
  assert.equal(mixed.counts.blocks, 8);
  assert.equal(mixed.counts.lets, 8);
  assert.equal(mixed.block, 0);

  const few = repeated(blockStory(1, 0));
  assert.equal(few.ready, true);
  assert.equal(few.counts.blocks, 4);
  assert.equal(few.counts.lets, 0);
  assert.equal(few.block, 0);

  const short = repeated(blockStory(2, 0), 2);
  assert.equal(short.ready, false);
  assert.equal(short.counts.blocks, 4);
  assert.equal(short.block, 0);

  const eager = repeated(blockStory(2, 0));
  assert.equal(eager.counts.blocks, 8);
  assert.equal(eager.counts.lets, 0);
  assert.ok(eager.block > 0);
  assert.ok(eager.block <= ADAPT_CAP);

  const shy = repeated(blockStory(0, 2));
  assert.equal(shy.counts.blocks, 0);
  assert.equal(shy.counts.lets, 8);
  assert.ok(shy.block < 0);

  const bare = repeated([faceHit("a"), mark("p", "pass"), blow("r", "a")]);
  assert.equal(bare.counts.lets, 0);
  assert.equal(bare.counts.blocks, 0);

  const crossed = repeated([
    mark("summon", "summon", { cardId: "ong-khong-lo" }),
    faceHit("a1"),
    blow("r1", "a1"),
    mark("late", "pass"),
    faceHit("a2"),
    faceHit("a3"),
    mark("once", "pass"),
    blow("r3", "a3"),
    { id: "own", actor: 0, ok: true, auto: false, kind: "attack-face", cardId: "ong-khong-lo", orb: [1, 1] },
    mark("confirm", "pass"),
    { id: "ai-block", actor: 1, ok: true, auto: false, kind: "block", cardId: "ong-khong-lo", orb: [1, 1] },
    mark("miss", "block", { ok: false, cardId: "ong-khong-lo" }),
    mark("cover", "cover", { cardId: "phu-thuy-thoi-gian" }),
    mark("wall", "wall", { cardId: "linh-chien-da-khong-lo" }),
    { id: "auto-pass", actor: 0, ok: true, auto: true, kind: "pass", orb: [1, 1] },
  ]);
  assert.equal(crossed.counts.blocks, 0);
  assert.equal(crossed.counts.lets, 4);
});

function faceWindow(blockerAtk: number, legal = true): Duel {
  let duel = createDuel({ monsters: ["phu-thuy-thoi-gian"], spells: ["mua-ma-thuat"] }, "test");
  duel = testGrant(duel, 0, "phu-thuy-thoi-gian", true);
  duel = testGrant(duel, 1, "ong-khong-lo", true);
  const attacker = duel.players[0].field[0];
  const blocker = duel.players[1].field[0];
  if (!attacker || !blocker) throw new Error("missing face monsters");
  return {
    ...duel,
    mode: "ai",
    turn: 0,
    step: "respond",
    pending: { kind: "face", attacker: attacker.uid },
    hold: { priority: 1, passed: [false, false], blocker: null, blockerSkill: false, armed: null },
    players: [
      { ...duel.players[0], hand: [], field: [{ ...attacker, atk: 10, def: 0, hp: 50, maxHp: 50 }, null, null] },
      { ...duel.players[1], hand: [], orb: 0, field: [{ ...blocker, atk: blockerAtk, def: 0, hp: 50, maxHp: 50, dim: !legal, stun: 0, noBlock: false }, null, null] },
    ],
  };
}

function didBlock(state: Duel): boolean {
  return Boolean(state.hold?.blocker);
}

test("block lean changes the choice and leaves an illegal block alone", () => {
  const board = faceWindow(35);
  assert.equal(didBlock(aiStep(board)), true);
  const none = repeated(blockStory(1, 0));
  assert.equal(none.block, 0);
  assert.equal(didBlock(aiStep({ ...board, adapt: none })), true);
  const toward = repeated(blockStory(2, 0));
  const away = repeated(blockStory(0, 2));
  assert.ok(toward.block > 0);
  assert.ok(away.block < 0);
  withHabits(readyHabits({ face: 1, blocks: 0, passes: 3 }), () => {
    assert.equal(didBlock(aiStep(board)), false);
    assert.equal(didBlock(aiStep({ ...board, adapt: none })), false);
    assert.equal(didBlock(aiStep({ ...board, adapt: toward })), true);
  });
  withHabits(readyHabits({ face: 1, blocks: 3, passes: 0 }), () => {
    assert.equal(didBlock(aiStep(board)), true);
    assert.equal(didBlock(aiStep({ ...board, adapt: away })), false);
  });
  assert.equal(didBlock(aiStep({ ...faceWindow(35, false), adapt: toward })), false);
});

function readyLean(patch: Partial<ReturnType<typeof emptyLean>> = {}) {
  return { ...emptyLean(), ready: true, games: 4, used: 4, ...patch };
}

function planted(cardId: string) {
  let duel = createDuel({ monsters: ["ong-khong-lo"], spells: ["mua-ma-thuat"] }, "test");
  duel = testGrant(duel, 1, cardId, true);
  const mon = duel.players[1].field[0];
  if (!mon) throw new Error(cardId);
  return mon;
}

function phaseBoard(setup: {
  field: Array<string | null>;
  foe: string;
  reserve?: string[];
  stars?: number;
  orb?: number;
  summons?: number;
  draws?: number;
  drawLock?: boolean;
  spellDeck?: string[];
  monsterDeck?: Array<{ id: string; hp: number; maxHp: number }>;
  locked?: [number, number, number];
  lean?: ReturnType<typeof emptyLean>;
}): Duel {
  let duel = createDuel({ monsters: ["ong-khong-lo"], spells: ["mua-ma-thuat"] }, "test");
  duel = testGrant(duel, 0, setup.foe, true);
  const foe = duel.players[0].field[0];
  if (!foe) throw new Error("foe");
  const field = setup.field.map((id, index) => (id ? { ...planted(id), uid: `${id}-${index}` } : null)) as Duel["players"][1]["field"];
  return {
    ...duel,
    mode: "ai",
    turn: 1,
    adapt: setup.lean,
    players: [
      { ...duel.players[0], field: [foe, null, null] },
      {
        ...duel.players[1],
        turns: 5,
        stars: setup.stars ?? 4,
        orb: setup.orb ?? 3,
        summons: setup.summons ?? 0,
        draws: setup.draws ?? 0,
        drawLock: Boolean(setup.drawLock),
        acted: false,
        attackLock: 0,
        hand: [],
        reserve: (setup.reserve ?? []).map((id) => ({ id, hp: 5, maxHp: 5 })),
        monsterDeck: setup.monsterDeck ?? [],
        spellDeck: setup.spellDeck ?? [],
        field,
        locked: setup.locked,
      },
    ],
  };
}

function onBoard(state: Duel) {
  return state.players[1].field.filter(Boolean).length;
}

test("a positive summon weight summons before a normal attack and not before a kill or a skill", () => {
  const summon = readyLean({ summon: 12 });
  const open = phaseBoard({
    field: ["may-chem", null, null],
    foe: "quai-thu-thien-su",
    reserve: ["cuc-bong-ma-quai"],
    lean: summon,
  });
  const called = aiStep(open);
  assert.equal(called.players[1].summons, 1);
  assert.equal(onBoard(called), 2);
  assert.equal(called.pending, null);
  const again = aiStep(called);
  assert.equal(again.players[1].summons, 1);
  assert.equal(onBoard(again), 2);
  assert.equal(again.pending?.kind, "melee");

  const quiet = phaseBoard({
    field: ["may-chem", null, null],
    foe: "quai-thu-thien-su",
    reserve: ["cuc-bong-ma-quai"],
    lean: readyLean(),
  });
  assert.equal(aiStep(quiet).pending?.kind, "melee");
  assert.equal(aiStep(quiet).players[1].summons, 0);
  const shy = aiStep({ ...quiet, adapt: readyLean({ summon: -12 }) });
  assert.equal(shy.pending?.kind, "melee");
  assert.equal(shy.players[1].summons, 0);

  const kill = phaseBoard({
    field: ["ong-khong-lo", null, null],
    foe: "quai-thu-thien-su",
    reserve: ["cuc-bong-ma-quai"],
    lean: summon,
  });
  assert.equal(aiStep(kill).pending?.kind, "melee");
  assert.equal(aiStep(kill).players[1].summons, 0);

  const skilled = phaseBoard({
    field: ["phu-thuy-thoi-gian", null, null],
    foe: "may-chem",
    reserve: ["cuc-bong-ma-quai"],
    orb: 3,
    lean: readyLean({ summon: 12, spend: 12 }),
    spellDeck: ["mua-ma-thuat"],
  });
  const cast = aiStep(skilled);
  assert.equal(cast.players[1].summons, 0);
  assert.equal(cast.players[1].draws, 0);
  assert.equal(cast.players[1].reserve[0]?.id, "cuc-bong-ma-quai");
});

test("a summon that cannot be played falls through once and never leaves the board changed", () => {
  const blocked = phaseBoard({
    field: [null, "may-chem", "may-chem"],
    foe: "quai-thu-thien-su",
    reserve: ["cuc-bong-ma-quai"],
    locked: [1, 0, 0],
    lean: readyLean({ summon: 12 }),
  });
  const swung = aiStep(blocked);
  assert.equal(swung.pending?.kind, "melee");
  assert.equal(swung.players[1].summons, 0);
  assert.equal(swung.players[1].field[0], null);
  assert.equal(Boolean(swung.upkeep || swung.gemCap || swung.pending?.kind !== "melee"), false);

  const poor = phaseBoard({
    field: ["may-chem", null, null],
    foe: "quai-thu-thien-su",
    reserve: ["ong-khong-lo"],
    stars: 1,
    lean: readyLean({ summon: 12 }),
  });
  const missed = aiStep(poor);
  assert.equal(missed.pending?.kind, "melee");
  assert.equal(onBoard(missed), 1);
});

test("a positive spend weight draws before a normal attack and yields to a summon on an empty board", () => {
  const spend = readyLean({ spend: 12 });
  const late = phaseBoard({
    field: ["may-chem", "may-chem", "may-chem"],
    foe: "phu-thuy-thoi-gian",
    stars: 4,
    orb: 1,
    summons: 1,
    spellDeck: ["mua-ma-thuat"],
    lean: spend,
  });
  const drew = aiStep(late);
  assert.equal(drew.players[1].draws, 1);
  assert.equal(drew.players[1].orb, 0);
  assert.equal(drew.pending, null);

  const dryOrb = { ...late, players: [late.players[0], { ...late.players[1], orb: 0 }] as Duel["players"], adapt: spend };
  assert.equal(aiStep(dryOrb).pending?.kind, "melee");
  assert.equal(aiStep(dryOrb).players[1].draws, 0);
  const already = { ...late, players: [late.players[0], { ...late.players[1], draws: 1 }] as Duel["players"], adapt: spend };
  assert.equal(aiStep(already).pending?.kind, "melee");
  assert.equal(aiStep(already).players[1].draws, 1);
  const locked = { ...late, players: [late.players[0], { ...late.players[1], drawLock: true }] as Duel["players"], adapt: spend };
  assert.equal(aiStep(locked).pending?.kind, "melee");
  assert.equal(aiStep(locked).players[1].draws, 0);

  const held = phaseBoard({
    field: ["may-chem", "may-chem", "may-chem"],
    foe: "phu-thuy-thoi-gian",
    stars: 4,
    orb: 3,
    summons: 1,
    spellDeck: ["mua-ma-thuat"],
    lean: readyLean(),
  });
  assert.equal(aiStep(held).players[1].draws, 0);
  assert.equal(aiStep(held).pending?.kind, "melee");

  const young = phaseBoard({
    field: ["may-chem", "may-chem", "may-chem"],
    foe: "phu-thuy-thoi-gian",
    stars: 1,
    orb: 2,
    summons: 1,
    spellDeck: ["mua-ma-thuat"],
    lean: readyLean({ spend: -12 }),
  });
  assert.equal(aiStep(young).players[1].draws, 1);

  const empty = phaseBoard({
    field: [null, null, null],
    foe: "quai-thu-thien-su",
    reserve: ["cuc-bong-ma-quai"],
    orb: 1,
    spellDeck: ["mua-ma-thuat"],
    lean: readyLean({ summon: 12, spend: 12 }),
  });
  const born = aiStep(empty);
  assert.equal(born.players[1].summons, 1);
  assert.equal(born.players[1].draws, 0);

  const busy = phaseBoard({
    field: ["may-chem", null, null],
    foe: "phu-thuy-thoi-gian",
    reserve: ["cuc-bong-ma-quai"],
    orb: 1,
    spellDeck: ["mua-ma-thuat"],
    lean: readyLean({ summon: 12, spend: 12 }),
  });
  const first = aiStep(busy);
  assert.equal(first.players[1].draws, 1);
  assert.equal(first.players[1].summons, 0);
  assert.equal(onBoard(first), 1);

  const dry = phaseBoard({
    field: ["may-chem", null, null],
    foe: "phu-thuy-thoi-gian",
    reserve: ["cuc-bong-ma-quai"],
    orb: 0,
    spellDeck: ["mua-ma-thuat"],
    lean: readyLean({ summon: 12, spend: 12 }),
  });
  const summed = aiStep(dry);
  assert.equal(summed.players[1].draws, 0);
  assert.equal(summed.players[1].summons, 1);
  assert.equal(onBoard(summed), 2);
  assert.equal(summed.pending, null);
});

test("a negative spend weight does not cancel a legal summon", () => {
  const board = phaseBoard({
    field: ["may-chem", null, null],
    foe: "phu-thuy-thoi-gian",
    reserve: ["cuc-bong-ma-quai"],
    lean: readyLean({ spend: -12 }),
  });
  const next = aiStep(board);
  assert.equal(next.players[1].summons, 1);
  assert.equal(next.players[1].draws, 0);
});


