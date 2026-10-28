import { confirmStage, passResponse, pickCounter, type Duel, type FieldMon, type Side } from "@/lib/duel";

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

function fieldOf(state: Duel): Array<{ side: Side; mon: FieldMon }> {
  return ([0, 1] as const).flatMap((side) => state.players[side].field.flatMap((mon) => (mon ? [{ side, mon }] : [])));
}

/** What an outcome shows of a monster, to tell two outcomes apart. */
function mark(mon: FieldMon | undefined): string {
  if (!mon || mon.hp <= 0) return "x";
  return [mon.hp, mon.maxHp, mon.atk, mon.def, mon.mdef, mon.stun, mon.chain ?? 0, mon.curse ? 1 : 0, mon.dim ? 1 : 0].join(",");
}

/**
 * A confirmed action whose roll decides what it hits (Máy ném bom hình nhện, Thỏ đen tinh nghịch né…): the opponent
 * sees whom this roll hits ("đối thủ thấy mình bắn ai", chủ game 28/10). Null when the roll changes nothing.
 */
export function rolledAims(state: Duel): Array<string | "face"> | null {
  if (state.step !== "respond" || !state.hold || state.hold.stage || !state.pending) return null;
  const seed = state.hold.seed;
  if (!seed) return null;
  const handed = (roll: number) => settle({ ...state, hold: { ...state.hold!, seed: roll, priority: (1 - state.turn) as Side, passed: [false, false] } });
  const real = handed(seed);
  const other = handed(seed === 11 ? 23 : 11);
  const foe = (1 - state.turn) as Side;
  const after = (duel: Duel) => new Map(fieldOf(duel).filter((row) => row.side === foe).map((row) => [row.mon.uid, mark(row.mon)]));
  const realMarks = after(real);
  const otherMarks = after(other);
  const before = fieldOf(state).filter((row) => row.side === foe);
  const differs = before.some((row) => realMarks.get(row.mon.uid) !== otherMarks.get(row.mon.uid)) || real.players[foe].hp !== other.players[foe].hp;
  if (!differs) return null;
  const hit: Array<string | "face"> = before.filter((row) => (realMarks.get(row.mon.uid) ?? "x") !== mark(row.mon)).map((row) => row.mon.uid);
  if (real.players[foe].hp !== state.players[foe].hp) hit.push("face");
  return hit;
}
