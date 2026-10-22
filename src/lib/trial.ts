import { answerGemCap, answerGemWarn, assignBlock, attackFace, createDuel, endTurn, passResponse, testGrant, type Duel, type FieldMon, type Side } from "./duel.ts";

/**
 * Thực chiến của Giám định (chủ game 22/10): fixed matches against a scripted opponent, built with the real rules and
 * the real (not fake) cards. Each level teaches one idea of the card, and doing it wrong fails the level: the level
 * says what it wants, the match is judged after every move (`trialVerdict`), and the opponent acts by a script
 * (`trialFoe`), never by the computer's own plans, so a level always plays out the same.
 */
export type TrialLevel = { title: string; goal: string; hint: string };

export const TRIALS: Record<string, TrialLevel[]> = {
  "khong-lo-mot-mat": [
    {
      title: "Bất khả xâm phạm",
      goal: "Đối thủ sắp tấn công người chơi 2 lần. Dùng Khổng lồ 1 mắt chặn cả hai đòn, để mình không mất máu.",
      hint: "Khi bị tấn công, bấm Khổng lồ 1 mắt để chặn. Bấm Hết lượt khi đến lượt bạn.",
    },
    {
      title: "Hạ gã khổng lồ",
      goal: "Đối thủ có một Khổng lồ 1 mắt đã tích rất nhiều công. Hạ nó ngay trong lượt này, trước khi hết lượt.",
      hint: "Quái của bạn có Rồng con (Hơi thở rồng) và Kizuran (3 công). Thử xem đòn nào làm nó mất máu.",
    },
    {
      title: "Đập phá",
      goal: "Thắng trong 3 lượt của bạn bằng cách cho Khổng lồ 1 mắt đánh vào người chơi mỗi lượt.",
      hint: "Mỗi đòn đánh chủ động tốn thêm 1 mana, nhưng công tăng thêm 1 sau mỗi đòn.",
    },
  ],
};

export function trialLevels(cardId: string): TrialLevel[] {
  return TRIALS[cardId] ?? [];
}

const clean = (state: Duel, orb = 2): Duel => ({
  ...state,
  mode: "ai",
  opening: false,
  opener: null,
  gemCap: null,
  gemWarn: null,
  players: state.players.map((player) => ({ ...player, orb, flask: 0 })) as Duel["players"],
});

function put(state: Duel, side: Side, ids: string[]): Duel {
  return ids.reduce((next, id) => testGrant(next, side, id, true), state);
}

function mapField(state: Duel, side: Side, run: (mon: FieldMon) => FieldMon): Duel {
  const players = [...state.players] as Duel["players"];
  players[side] = { ...players[side], field: players[side].field.map((mon) => (mon ? run(mon) : mon)) };
  return { ...state, players };
}

/** The match a level starts from: the player (side 0) moves first. */
export function createTrialDuel(cardId: string, level: number): Duel {
  let state = createDuel(undefined, "test");
  if (cardId !== "khong-lo-mot-mat") return clean(state);
  if (level === 0) {
    state = put(put(state, 0, ["khong-lo-mot-mat"]), 1, ["kizuran"]);
    // The opponent strikes first, so the player's first move is to block.
    return clean({ ...state, turn: 1 });
  }
  if (level === 1) {
    state = put(put(state, 0, ["rong-con", "kizuran"]), 1, ["khong-lo-mot-mat"]);
    return clean(mapField(state, 1, (mon) => ({ ...mon, atk: 9 })));
  }
  state = put(state, 0, ["khong-lo-mot-mat"]);
  const players = [...state.players] as Duel["players"];
  players[1] = { ...players[1], hp: 12 };
  return clean({ ...state, players }, 1);
}

/**
 * What the scripted opponent does next in this state, or null to wait. The opponent passes whatever the player does,
 * attacks the player's face with every monster it has (level 1), then ends its turn.
 */
export function trialFoe(state: Duel, level: number): Duel | null {
  if (state.winner !== null || state.step === "over") return null;
  if (state.step === "respond") return state.hold?.priority === 1 ? passResponse(state) : null;
  if (state.step !== "main" || state.turn !== 1 || state.upkeep) return null;
  if (state.gemWarn === 1) return answerGemWarn(state);
  if (state.gemCap === 1) return answerGemCap(state, false);
  if (level === 0) {
    const striker = state.players[1].field.find((mon) => mon && mon.hp > 0 && !mon.dim);
    if (striker) return attackFace(state, striker.uid);
  }
  return endTurn(state);
}

/** "pass" when the level's goal is done, "fail" when it can no longer be done, null while it is still on. */
export function trialVerdict(state: Duel, level: number): "pass" | "fail" | null {
  const you = state.players[0];
  const foe = state.players[1];
  if (level === 0) {
    if (you.hp < 16 || !you.field.some((mon) => mon?.cardId === "khong-lo-mot-mat" && mon.hp > 0)) return "fail";
    // Two strikes done: the foe has had two turns after its first and it is the player's turn again.
    return state.turn === 0 && state.step === "main" && foe.turns >= 3 ? "pass" : null;
  }
  if (level === 1) {
    if (!foe.field.some((mon) => mon?.cardId === "khong-lo-mot-mat" && mon.hp > 0)) return "pass";
    return state.turn === 1 || state.winner !== null ? "fail" : null;
  }
  if (foe.hp <= 0 || state.winner === 0) return "pass";
  return you.turns >= 3 && state.turn === 1 ? "fail" : state.winner === 1 ? "fail" : null;
}

export { assignBlock };
