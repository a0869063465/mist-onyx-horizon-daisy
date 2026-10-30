import { monsterCard, spellCard } from "./catalog.ts";
import {
  aiAnswerAsk,
  aiStep,
  assignBlock,
  assignCover,
  attackFace,
  attackMonster,
  canGuardCover,
  canStand,
  canTargetFoe,
  canWall,
  confirmSwap,
  castSpell,
  cottonCover,
  cottonOffer,
  declareSkill,
  draw,
  endTurn,
  fuse,
  guardCover,
  harpyLash,
  harpyOffer,
  harpyWard,
  passResponse,
  pullReel,
  pullWheel,
  settleReel,
  settleWheel,
  spreadHits,
  spiritCover,
  canSpirit,
  standFor,
  summon,
  summonVow,
  toggleStance,
  useSkill as fireSkill,
  visibleStats,
  vowCap,
  wallAlly,
  type Duel,
  type FieldMon,
  type Side,
} from "./duel.ts";
import { fieldBindsFor } from "./field-chips.ts";

/**
 * Bộ não của máy (đợt 1, chủ game 23/10): thay chuỗi luật viết tay bằng tìm kiếm. Mỗi lần đến lượt máy làm một việc:
 * liệt kê mọi nước đi hợp lệ lấy thẳng từ luật trận (triệu hồi, hiến tế, dung hợp, rút, kỹ năng, phép với từng mục
 * tiêu, tấn công), thử từng nước trên bản sao trận, giả lập đối thủ chặn đòn tốt nhất bằng các quái đang thấy trên
 * sân, chấm điểm thế trận, đi tiếp vài nước trong lượt (tìm theo chùm), rồi chọn nước đầu của đường tốt nhất.
 * Máy không đọc tay bài, xấp bài của người chơi; rút bài là điểm dừng của đường đi (không biết trước lá sẽ rút).
 * Máy luôn là bên 1; câu hỏi giữa trận (Đàm phán, hộp ma lực…) vẫn do aiAnswerAsk trả lời.
 */

const ME: Side = 1;
const FOE: Side = 0;
/** Chùm tìm kiếm: số đường giữ lại mỗi tầng, số tầng, và giới hạn thời gian mỗi lần nghĩ. */
const BEAM = 6;
const DEPTH = 4;
const BUDGET_MS = 450;

/**
 * Một nước đi dưới dạng mô tả (gửi được qua luồng riêng): luồng suy nghĩ chọn nước, trang trận chạy lại nước đó
 * bằng luật trận thật của máy người chơi.
 */
export type Act =
  | ["end"]
  | ["ask"]
  | ["old"]
  | ["pass"]
  | ["draw"]
  | ["summon", number, 0 | 1 | 2]
  | ["vow", number, 0 | 1 | 2, string]
  | ["fuse", number, string, 0 | 1 | 2]
  | ["spell", number, string | null]
  | ["swap", number, string | null, string]
  | ["skill", string, string | null, number, boolean, string | null]
  | ["declare", string, string | null, number]
  | ["stance", string]
  | ["face", string]
  | ["hit", string, string]
  | ["block", string, boolean]
  | ["cover", string, string]
  | ["ward"]
  | ["lash"]
  | ["wall", string]
  | ["guard", string]
  | ["stand", string]
  | ["spirit", string]
  | ["cotton"];

export function runAct(state: Duel, act: Act): Duel {
  switch (act[0]) {
    case "end":
      return endTurn(state);
    case "ask":
      return aiAnswerAsk(state) ?? state;
    case "old":
      return aiStep(state);
    case "pass":
      return passResponse(state);
    case "draw":
      return draw(state);
    case "summon":
      return summon(state, act[1], act[2]);
    case "vow":
      return summonVow(state, act[1], act[2], [act[3]]);
    case "fuse":
      return fuse(state, act[1], act[2], act[3]);
    case "spell":
      return castSpell(state, act[1], act[2]);
    case "swap": {
      const cast = castSpell(state, act[1], act[2]);
      return cast.swap?.locked ? confirmSwap(cast, cast.swap.locked, act[3]) : cast;
    }
    case "skill":
      return fireSkill(state, act[1], act[2], act[3], act[4], act[5]);
    case "declare":
      return declareSkill(state, act[1], act[2], act[3]);
    case "stance":
      return toggleStance(state, act[1]);
    case "face":
      return attackFace(state, act[1]);
    case "hit":
      return attackMonster(state, act[1], act[2]);
    case "block":
      return assignBlock(state, act[1], act[2]);
    case "cover":
      return assignCover(state, act[1], act[2]);
    case "ward":
      return harpyWard(state);
    case "lash":
      return harpyLash(state);
    case "wall":
      return wallAlly(state, act[1]);
    case "guard":
      return guardCover(state, act[1]);
    case "stand":
      return standFor(state, act[1]);
    case "spirit":
      return spiritCover(state, act[1]);
    case "cotton":
      return cottonCover(state);
  }
}

type Line = { first: Act; now: Duel; score: number; stop: boolean };

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** A state that differs in play from the one before (not only a line in the log). */
function moved(prev: Duel, next: Duel): boolean {
  if (next === prev) return false;
  return (
    next.players !== prev.players ||
    next.step !== prev.step ||
    next.pending !== prev.pending ||
    next.turn !== prev.turn ||
    next.hold !== prev.hold ||
    next.winner !== prev.winner ||
    next.swap !== prev.swap ||
    next.parley !== prev.parley ||
    next.reel !== prev.reel ||
    next.wheel !== prev.wheel ||
    Boolean(next.upkeep) !== Boolean(prev.upkeep) ||
    next.recall !== prev.recall ||
    next.legs !== prev.legs ||
    next.gemCap !== prev.gemCap ||
    next.gemWarn !== prev.gemWarn ||
    next.preyAsk !== prev.preyAsk ||
    next.birdAsk !== prev.birdAsk ||
    next.plumeAsk !== prev.plumeAsk
  );
}

function live(field: Array<FieldMon | null>): FieldMon[] {
  return field.filter((mon): mon is FieldMon => Boolean(mon && mon.hp > 0));
}

/* ── Chấm điểm thế trận, nhìn từ phía máy ── */

function life(hp: number): number {
  // Máu thấp đáng giá hơn: mất 1 máu khi còn 3 tệ hơn khi còn 15.
  const h = Math.max(0, hp);
  return h * 2.4 + Math.min(h, 6) * 2.2;
}

function monValue(mon: FieldMon, allies: Array<FieldMon | null>): number {
  const s = visibleStats(mon, allies);
  const card = monsterCard(mon.cardId);
  const stars = card?.stars ?? 1;
  let v = 3 + stars * 2.2 + Math.max(0, s.atk) * 1.3 + Math.max(0, mon.hp) * 1.05 + Math.max(0, s.def) * 0.9 + Math.max(0, s.mdef) * 0.6;
  if (mon.stun > 0) v -= 1.5 + s.atk * 0.4;
  if ((mon.chain ?? 0) > 0) v -= 1 + s.atk * 0.3;
  if (mon.copy) v *= 0.8;
  return v;
}

/** The damage the side can bring on the other player next turn, after the other side's untapped blockers. */
function threat(state: Duel, side: Side): number {
  const hitters = live(state.players[side].field).filter((mon) => mon.stun === 0 && (mon.chain ?? 0) === 0 && mon.cardId !== "hoa-an-thit-nguoi");
  const atk = hitters.map((mon) => Math.max(0, visibleStats(mon, state.players[side].field).atk)).sort((a, b) => b - a);
  const walls = live(state.players[(1 - side) as Side].field).filter((mon) => !mon.noBlock && mon.stun === 0).length;
  return atk.slice(walls).reduce((sum, n) => sum + n, 0);
}

export function judge(state: Duel, me: Side = ME): number {
  if (state.winner === me) return 1e6;
  if (state.winner !== null) return -1e6;
  const foe = (1 - me) as Side;
  const P = state.players[me];
  const F = state.players[foe];
  let score = life(P.hp) - life(F.hp);
  score += live(P.field).reduce((sum, mon) => sum + monValue(mon, P.field), 0);
  score -= live(F.field).reduce((sum, mon) => sum + monValue(mon, F.field), 0);
  score += P.reserve.length * 2.2 + P.hand.length * 2 - F.reserve.length * 2.2 - F.hand.length * 2;
  score += P.stars * 2.5 - F.stars * 2.5;
  score += Math.min(3, P.orb) * 0.5 + Math.min(1, P.flask) * 0.4;
  // Đòn kết liễu của đối thủ ở lượt sau, và của máy.
  const danger = threat(state, foe);
  if (danger >= P.hp) score -= 60;
  else score -= danger * 0.6;
  const reach = threat(state, me);
  if (reach >= F.hp) score += 25;
  return score;
}

/* ── Giả lập cho tới lúc trận yên (cửa sổ phản ứng đóng, câu hỏi đã trả lời) ── */

function askOf(state: Duel): Side | null {
  if (state.recall) return state.recall.side;
  if (state.gemCap != null) return state.gemCap;
  if (state.gemWarn != null) return state.gemWarn;
  if (state.parley && state.step === "main") return null;
  if (state.swap) return state.swap.side;
  if (state.upkeep || state.legs || state.preyAsk || state.plumeAsk) return state.turn;
  return null;
}

/** Đối thủ (bên 0) chặn đòn đánh thẳng mặt bằng quái tốt nhất đang thấy trên sân, hoặc không chặn. */
function foeReply(state: Duel, budget: number): Duel {
  const pending = state.pending;
  if (pending?.kind === "face" && state.hold && !state.hold.blocker) {
    const blockers = live(state.players[FOE].field).filter((mon) => !mon.dim && mon.stun === 0 && !mon.noBlock && !(mon.path ?? 0));
    let best = passResponse(state);
    let worst = judge(quiet(best, budget - 1));
    for (const mon of blockers) {
      const tried = assignBlock(state, mon.uid);
      if (!moved(state, tried)) continue;
      const value = judge(quiet(tried, budget - 1));
      if (value < worst) {
        worst = value;
        best = tried;
      }
    }
    return best;
  }
  return passResponse(state);
}

/** Runs the match on (both sides passing, the machine answering its own questions) until it rests. */
export function quiet(state: Duel, budget = 2): Duel {
  let s = state;
  for (let i = 0; i < 60; i += 1) {
    if (s.winner !== null) return s;
    if (s.reel) {
      const next = s.reel.phase === "wait" ? pullReel(s) : settleReel(s);
      if (!moved(s, next) && next.reel === s.reel) return s;
      s = next;
      continue;
    }
    // The time wheel turns once the chain is over (chủ game 30/10): pulled and landed in one go here.
    if (s.wheel) {
      const next = settleWheel(pullWheel(s));
      if (next.wheel === s.wheel) return s;
      s = next;
      continue;
    }
    const ask = askOf(s);
    if (ask === FOE) return s;
    const answered = aiAnswerAsk(s);
    if (answered && answered !== s && moved(s, answered)) {
      s = answered;
      continue;
    }
    if (s.step === "respond" && s.hold) {
      const next = s.hold.priority === FOE && budget > 0 ? foeReply(s, budget) : passResponse(s);
      if (!moved(s, next)) return s;
      s = next;
      continue;
    }
    return s;
  }
  return s;
}

/* ── Liệt kê nước đi ── */

type Move = { act: Act; s: Duel; leaf?: boolean };

function tryMove(list: Move[], state: Duel, act: Act, leaf = false) {
  const next = runAct(state, act);
  if (moved(state, next) && next.winner !== FOE) list.push({ act, s: next, leaf });
}

/** The skills a monster offers, as the buttons on the field do (field-chips) plus the cards with their own buttons. */
function skillMoves(state: Duel, mon: FieldMon, list: Move[]) {
  const me = state.players[ME];
  const foes = live(state.players[FOE].field);
  const allies = live(me.field);
  const card = monsterCard(mon.cardId);
  if (!card) return;
  const room = me.field.filter((unit) => !unit).length;
  const aims: number[] = [];
  const selfs: number[] = [];
  const declares: number[] = [];
  for (const chip of fieldBindsFor(card.id, {
    cardId: card.id,
    orb: me.orb,
    level: mon.level ?? 1,
    hp: mon.hp,
    beat: mon.beat ?? 0,
    stored: mon.stored ?? 0,
    skillText: card.skill ?? "",
    afford: (cost) => me.orb >= cost,
    aim: (index) => aims.push(index),
    cast: (index) => selfs.push(index),
    declare: (index) => declares.push(index),
    spent: mon.shed ?? [],
    room,
  })) chip.go();
  const id = card.id;
  if (id === "ga-he-dang-so") {
    if (me.orb >= 1) selfs.push(0);
    if (mon.charge >= 2) aims.push(1);
  }
  if (id === "mat-xanh-huy-diet" && !mon.gaze && me.orb >= 1) selfs.push(0);
  if (id === "nu-chua-dieu-nhan-hoan-my") {
    selfs.push(0);
    if (!mon.bolt && me.orb >= 1) selfs.push(2);
  }
  if (id === "my-dieu-nhan" || id === "nu-chua-dieu-nhan") {
    const spent = new Set(mon.shed ?? []);
    if (!spent.has("gust") && me.orb >= (id === "nu-chua-dieu-nhan" ? 0 : 1)) selfs.push(0);
    if (id === "my-dieu-nhan" && !spent.has("charm")) aims.push(1);
  }
  if (id === "phu-thuy-thoi-gian" && me.orb >= 2) tryMove(list, state, ["skill", mon.uid, null, 2, true, null]);
  if (id === "rong-boc-trung") tryMove(list, state, ["stance", mon.uid]);
  if (id === "ken-ngai" && (mon.level ?? 0) >= 4 && (mon.level ?? 0) <= 5) selfs.push(1);
  if (id === "may-quay-thuong" && me.orb >= 1) aims.push(1);
  // Hai lượt chọn của nữ chúa điểu nhân: quái đối thủ rồi quái của ta.
  if ((id === "nu-chua-dieu-nhan" && mon.lure) || id === "nu-chua-dieu-nhan-hoan-my") {
    for (const foe of foes) for (const ally of allies) tryMove(list, state, ["skill", mon.uid, ally.uid, 3, true, foe.uid]);
  }
  for (const index of selfs) tryMove(list, state, ["skill", mon.uid, null, index, false, null]);
  for (const index of declares) tryMove(list, state, ["declare", mon.uid, null, index]);
  const shot = id !== "mo-voi-ma-mut" && id !== "yeu-tinh-chuc-phuc";
  const allySkill = id === "yeu-tinh-chuc-phuc" || id === "thien-than-be-nho";
  for (const index of aims) {
    if (allySkill) {
      for (const ally of allies) {
        if (ally.uid === mon.uid && id !== "thien-than-be-nho") continue;
        tryMove(list, state, ["skill", mon.uid, ally.uid, index, true, null]);
      }
      continue;
    }
    const fire = (target: string | null): Act => (shot ? ["declare", mon.uid, target, index] : ["skill", mon.uid, target, index, true, null]);
    for (const foe of foes) tryMove(list, state, fire(foe.uid));
    if (faceSkill(id, index)) tryMove(list, state, fire(null));
  }
}

function faceSkill(id: string, index: number) {
  return (
    id === "phu-thuy-ti-hon" ||
    id === "mat-do-tan-pha" ||
    id === "may-nem-bom-hinh-nhen" ||
    id === "ma-dao-si" ||
    id === "rong-ac-ma" ||
    id === "rong-con" ||
    id === "rong-ngan-tuoi" ||
    id === "sua-hut-ma-phap" ||
    id === "con-thinh-no-cua-hai-vuong" ||
    (id === "rong-phun-hoa-cau" && index === 1) ||
    (id === "ga-he-dang-so" && index === 1) ||
    (id === "may-quay-thuong" && index === 1)
  );
}

/** Hoán đổi đặt trận vào bước chọn quái: thử đổi quái bị nhắm với từng quái hoặc lá dự bị còn lại. */
function finishSwap(cast: Duel, list: Move[], base: Duel, index: number, target: string | null) {
  const swap = cast.swap;
  if (!swap || swap.side !== ME || !swap.locked) return;
  const me = cast.players[ME];
  const tokens = [
    ...live(me.field).map((mon) => `f:${mon.uid}`),
    ...me.reserve.map((_, at) => `r:${at}`),
  ].filter((token) => token !== swap.locked);
  for (const token of tokens) tryMove(list, base, ["swap", index, target, token]);
}

function spellMoves(state: Duel, list: Move[]) {
  const me = state.players[ME];
  const targets = [null, ...live(state.players[ME].field).map((mon) => mon.uid), ...live(state.players[FOE].field).map((mon) => mon.uid)];
  const seen = new Set<string>();
  me.hand.forEach((id, index) => {
    if (seen.has(id) || !spellCard(id)) return;
    seen.add(id);
    for (const target of targets) {
      const next = castSpell(state, index, target);
      if (next.swap) finishSwap(next, list, state, index, target);
      else if (moved(state, next) && next.winner !== FOE) list.push({ act: ["spell", index, target], s: next });
    }
  });
}

/** Mọi nước đi của máy ở bước chính của lượt mình. */
export function mainMoves(state: Duel): Move[] {
  const list: Move[] = [];
  const me = state.players[ME];
  if (me.draws < 1 && !me.drawLock) {
    tryMove(list, state, ["draw"], true);
  }
  const free = me.field.findIndex((mon, at) => !mon && (me.locked?.[at] ?? 0) === 0);
  const own = live(me.field);
  const ids = new Set<string>();
  me.reserve.forEach((held, index) => {
    if (ids.has(held.id)) return;
    ids.add(held.id);
    if (free >= 0) tryMove(list, state, ["summon", index, free as 0 | 1 | 2]);
    if (vowCap(held.id, held.saved?.level ?? 1) > 0) {
      for (const mon of own) {
        const slot = (free >= 0 ? free : me.field.findIndex((unit) => unit?.uid === mon.uid)) as 0 | 1 | 2;
        tryMove(list, state, ["vow", index, slot, mon.uid]);
      }
    }
    for (const mon of own) {
      const slot = me.field.findIndex((unit) => unit?.uid === mon.uid) as 0 | 1 | 2;
      tryMove(list, state, ["fuse", index, mon.uid, slot]);
    }
  });
  spellMoves(state, list);
  const ready = own.filter((mon) => !mon.dim && mon.stun === 0 && !(mon.chain ?? 0) && !(mon.path ?? 0));
  for (const mon of ready) skillMoves(state, mon, list);
  if (canTargetFoe(state) && me.attackLock === 0) {
    for (const mon of ready) {
      if ((mon.gag ?? 0) > 0 || mon.cardId === "hoa-an-thit-nguoi") continue;
      tryMove(list, state, ["face", mon.uid]);
      for (const foe of live(state.players[FOE].field)) tryMove(list, state, ["hit", mon.uid, foe.uid]);
    }
  }
  return list;
}

/** Mọi cách máy đáp lại khi đang giữ quyền phản ứng. */
function answerMoves(state: Duel): Move[] {
  const list: Move[] = [];
  tryMove(list, state, ["pass"]);
  tryMove(list, state, ["old"]);
  const plume = harpyOffer(state, ME);
  if (plume === "armor") tryMove(list, state, ["ward"]);
  if (plume === "lash") tryMove(list, state, ["lash"]);
  const me = state.players[ME];
  const own = live(me.field);
  if (state.pending?.kind === "face" && state.turn === FOE && state.hold && !state.hold.blocker) {
    for (const mon of own) {
      tryMove(list, state, ["block", mon.uid, false]);
      if (mon.cardId === "chien-si-gam-nham") tryMove(list, state, ["block", mon.uid, true]);
    }
  }
  // Chặn từng nhánh (chủ game 29/10): against a skill landing on several, a front-row monster it does not land on
  // stands in front of the branch to a back-row monster or to the machine. For now the machine covers one branch at
  // most ("máy tạm chặn tối đa 1 nhánh").
  if (state.turn === FOE && state.hold && !state.hold.covers?.length) {
    const hits = spreadHits(state);
    if (hits && hits.length >= 2) {
      const branches = hits.filter((hit) => hit === `face:${ME}` || own.some((mon) => mon.uid === hit && mon.row === "back"));
      for (const mon of own) {
        if (mon.row === "back" || hits.includes(mon.uid)) continue;
        for (const branch of branches) tryMove(list, state, ["cover", mon.uid, branch]);
      }
    }
  }
  for (const mon of own) {
    if (canWall(state, mon.uid)) tryMove(list, state, ["wall", mon.uid]);
    if (canGuardCover(state, mon.uid)) tryMove(list, state, ["guard", mon.uid]);
    if (canStand(state, mon.uid)) tryMove(list, state, ["stand", mon.uid]);
    if (canSpirit(state, mon.uid)) tryMove(list, state, ["spirit", mon.uid]);
  }
  if (cottonOffer(state, ME)) tryMove(list, state, ["cotton"]);
  spellMoves(state, list);
  return list;
}

/* ── Tìm đường ── */

/** Tìm theo chùm trong lượt của máy: giữ BEAM đường tốt nhất, đi tối đa DEPTH nước. Trả về nước đầu tốt nhất. */
function planTurn(state: Duel, deadline: number): Act {
  const base = judge(quiet(state));
  let best: Line | null = null;
  let frontier: Line[] = [];
  for (const move of mainMoves(state)) {
    const settled = quiet(move.s);
    const line = { first: move.act, now: settled, score: judge(settled), stop: Boolean(move.leaf) || settled.turn !== ME || settled.winner !== null };
    if (!best || line.score > best.score) best = line;
    frontier.push(line);
  }
  for (let depth = 1; depth < DEPTH && now() < deadline; depth += 1) {
    const grow = frontier.filter((line) => !line.stop && line.now.step === "main" && line.now.turn === ME && askOf(line.now) === null);
    grow.sort((a, b) => b.score - a.score);
    const next: Line[] = [];
    for (const line of grow.slice(0, BEAM)) {
      if (now() >= deadline) break;
      for (const move of mainMoves(line.now)) {
        const settled = quiet(move.s);
        const child: Line = { first: line.first, now: settled, score: judge(settled), stop: Boolean(move.leaf) || settled.turn !== ME || settled.winner !== null };
        if (child.score > (best?.score ?? -Infinity)) best = child;
        next.push(child);
      }
    }
    frontier = next;
  }
  if (!best || best.score <= base + 0.05) return ["end"];
  return best.first;
}

function planAnswer(state: Duel): Act {
  let best: { act: Act; score: number } | null = null;
  for (const move of answerMoves(state)) {
    const score = judge(quiet(move.s));
    if (!best || score > best.score) best = { act: move.act, score };
  }
  return best?.act ?? ["pass"];
}

/** Nước máy (bên 1) chọn lúc này; null khi không tới lượt máy. */
export function brainChoose(state: Duel, budgetMs = BUDGET_MS): Act | null {
  if (state.mode !== "ai" || state.winner !== null || state.reel || state.wheel) return null;
  if (aiAnswerAsk(state)) return ["ask"];
  if (state.step === "respond" && state.hold?.priority === ME) return planAnswer(state);
  if (state.turn !== ME || state.step !== "main") return null;
  return planTurn(state, now() + budgetMs);
}

/** Một việc của máy (bên 1), cùng chỗ gọi với aiStep cũ. */
export function brainStep(state: Duel, budgetMs = BUDGET_MS): Duel {
  const act = brainChoose(state, budgetMs);
  return act ? runAct(state, act) : state;
}
