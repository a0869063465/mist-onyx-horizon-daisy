import { monsterCard } from "./catalog.ts";
import type { Duel, Side } from "./duel.ts";

const KEY = "clash-habits";
const EARLY_NEED = 4;

export type HabitCounts = {
  games: number;
  earlyTurns: number;
  spentAll: number;
  keptMana: number;
  summonOne: number;
  summonHigher: number;
  floodGames: number;
  holdGames: number;
  face: number;
  monsterSwings: number;
  blocks: number;
  passes: number;
  spellDraws: number;
  monsterDraws: number;
};

export type Scratch = { turns: number; earlySummons: number };

export type WatchSnap = {
  turn: Side;
  step: Duel["step"];
  winner: Side | null;
  orb: number;
  draws: number;
  summons: number;
  hand: number;
  reserve: number;
  field: Array<{ uid: string; stars: number }>;
  pending: "face" | "melee" | "beam" | null;
  blocker: string | null;
  priority: Side | null;
};

export function emptyHabits(): HabitCounts {
  return {
    games: 0,
    earlyTurns: 0,
    spentAll: 0,
    keptMana: 0,
    summonOne: 0,
    summonHigher: 0,
    floodGames: 0,
    holdGames: 0,
    face: 0,
    monsterSwings: 0,
    blocks: 0,
    passes: 0,
    spellDraws: 0,
    monsterDraws: 0,
  };
}

export function freshScratch(): Scratch {
  return { turns: 1, earlySummons: 0 };
}

export function watchSnap(duel: Duel): WatchSnap {
  const you = duel.players[0];
  const pending = duel.pending;
  const kind = pending?.kind === "face" || pending?.kind === "melee" || pending?.kind === "beam" ? pending.kind : null;
  return {
    turn: duel.turn,
    step: duel.step,
    winner: duel.winner,
    orb: you.orb,
    draws: you.draws,
    summons: you.summons,
    hand: you.hand.length,
    reserve: you.reserve.length,
    field: you.field.flatMap((mon) => {
      if (!mon) return [];
      const card = monsterCard(mon.cardId);
      return [{ uid: mon.uid, stars: card?.stars ?? 1 }];
    }),
    pending: kind,
    blocker: duel.hold?.blocker ?? null,
    priority: duel.hold?.priority ?? null,
  };
}

export function loadHabits(): HabitCounts {
  if (typeof localStorage === "undefined") return emptyHabits();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyHabits();
    return { ...emptyHabits(), ...JSON.parse(raw) };
  } catch {
    return emptyHabits();
  }
}

export function saveHabits(habits: HabitCounts) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(habits));
}

export function clearHabits() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}

export function absorb(habits: HabitCounts, prev: WatchSnap, next: WatchSnap, scratch: Scratch): { habits: HabitCounts; scratch: Scratch } {
  if (prev.winner !== null && next.winner === null) return { habits, scratch: freshScratch() };
  const h = { ...habits };
  const s = { ...scratch };
  if (prev.winner === null && next.winner !== null) {
    h.games += 1;
    if (s.earlySummons >= 2) h.floodGames += 1;
    else h.holdGames += 1;
    return { habits: h, scratch: freshScratch() };
  }
  const playerMain = prev.turn === 0 && prev.step === "main";
  const playerRespond = prev.step === "respond" && prev.priority === 0;
  if (playerMain) {
    if (next.summons > prev.summons && s.turns <= 3) {
      const seen = new Set(prev.field.map((mon) => mon.uid));
      const born = next.field.find((mon) => !seen.has(mon.uid));
      if (born) {
        s.earlySummons += 1;
        if (born.stars <= 1) h.summonOne += 1;
        else h.summonHigher += 1;
      }
    }
    if (next.draws > prev.draws) {
      if (next.hand > prev.hand) h.spellDraws += 1;
      else h.monsterDraws += 1;
    }
    if (prev.pending === null && next.pending === "face") h.face += 1;
    if (prev.pending === null && (next.pending === "melee" || next.pending === "beam")) h.monsterSwings += 1;
    if (next.turn === 1) {
      if (s.turns <= 3) {
        h.earlyTurns += 1;
        if (prev.orb === 0) h.spentAll += 1;
        else h.keptMana += 1;
      }
      s.turns += 1;
    }
  }
  if (playerRespond && next.hand === prev.hand && next.summons === prev.summons && next.field.length === prev.field.length) {
    if (!prev.blocker && next.blocker) h.blocks += 1;
    else if (!next.blocker && (next.step === "main" || next.priority === 1)) h.passes += 1;
  }
  return { habits: h, scratch: s };
}

export type Style = {
  ready: boolean;
  spendAll: boolean;
  oneStar: boolean;
  flood: boolean;
  preferFace: boolean | null;
  blockEager: boolean | null;
  spellDraw: boolean | null;
};

export function readStyle(habits = loadHabits()): Style {
  const ready = habits.earlyTurns >= EARLY_NEED;
  const extra = ready && habits.games >= 2 && habits.face + habits.monsterSwings + habits.blocks + habits.passes + habits.spellDraws + habits.monsterDraws >= 4;
  return {
    ready,
    spendAll: !ready || habits.spentAll >= habits.keptMana,
    oneStar: !ready || habits.summonOne >= habits.summonHigher,
    flood: ready && habits.floodGames > habits.holdGames,
    preferFace: extra && habits.face + habits.monsterSwings >= 3 ? habits.face > habits.monsterSwings : null,
    blockEager: extra && habits.blocks + habits.passes >= 3 ? habits.blocks >= habits.passes : null,
    spellDraw: extra && habits.spellDraws + habits.monsterDraws >= 3 ? habits.spellDraws >= habits.monsterDraws : null,
  };
}

function ratio(yes: number, no: number): string {
  const total = yes + no;
  if (total === 0) return "chưa thấy";
  return `${yes}/${total}`;
}

export function watchLines(habits = loadHabits()): Array<{ title: string; text: string }> {
  const style = readStyle(habits);
  const early = habits.earlyTurns < EARLY_NEED
    ? `Chưa đủ. Mới xem ${habits.earlyTurns}/${EARLY_NEED} lượt đầu, AI vẫn đánh lối cơ bản.`
    : "Đủ dữ liệu. 3 thói quen này được dùng trong 3 lượt đầu, trước khi xử lý mối nguy.";
  return [
    { title: "Ván đã xem", text: `${habits.games}` },
    { title: "Lối cơ bản", text: early },
    {
      title: "Hết mana lúc đầu",
      text: style.ready
        ? style.spendAll
          ? `Có. Dùng hết ${ratio(habits.spentAll, habits.keptMana)} lượt đầu.`
          : `Không. Còn mana ${ratio(habits.keptMana, habits.spentAll)} lượt đầu.`
        : `Chưa rõ. Hết mana ${ratio(habits.spentAll, habits.keptMana)}.`,
    },
    {
      title: "Quái 1 sao sớm",
      text: style.ready
        ? style.oneStar
          ? `Có. Gọi 1 sao ${ratio(habits.summonOne, habits.summonHigher)} lần đầu trận.`
          : `Không. Gọi quái sao cao hơn ${ratio(habits.summonHigher, habits.summonOne)} lần.`
        : `Chưa rõ. 1 sao ${ratio(habits.summonOne, habits.summonHigher)}.`,
    },
    {
      title: "Tràn sân",
      text: style.ready
        ? style.flood
          ? `Có. ${ratio(habits.floodGames, habits.holdGames)} ván gọi từ 2 quái trong 3 lượt đầu.`
          : `Không. ${ratio(habits.holdGames, habits.floodGames)} ván chỉ gọi ít.`
        : `Chưa rõ. Tràn ${ratio(habits.floodGames, habits.holdGames)}.`,
    },
    {
      title: "Học thêm",
      text: style.preferFace === null && style.blockEager === null && style.spellDraw === null
        ? "Chưa bổ sung. Cần rõ 3 mục trên và thêm vài nước đánh, chặn, rút bài."
        : [
            style.preferFace === null ? "Đánh người: chưa rõ" : style.preferFace ? "Hay đánh người" : "Hay đánh quái",
            style.blockEager === null ? "Chặn: chưa rõ" : style.blockEager ? "Hay chặn" : "Hay chịu",
            style.spellDraw === null ? "Rút bài: chưa rõ" : style.spellDraw ? "Hay rút phép" : "Hay rút quái",
          ].join(". ") + ".",
    },
  ];
}
