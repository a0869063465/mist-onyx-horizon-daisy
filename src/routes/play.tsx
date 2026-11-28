import { EnvField, hasEnvField } from "@/components/game/env-field";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeywordRow } from "@/components/game/keyword-row";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { CardFace, cardText } from "@/components/game/card-face";
import { CopyText } from "@/components/game/copy-text";
import { plainCopy } from "@/lib/copy-mark";
import { Painted } from "@/components/game/painted";
import { AegisBreak, AegisHold, BoltBurst, BoomBlast, BuffBlast, FireBurst, FlareBlast, FOG_MS, FogWipe, HealBlast, LaserBeam, Spectacle, WaterBurst } from "@/components/game/spectacle";
import { ArenaFx } from "@/components/game/arena-fx";
import { artSrc, fakeMonsterCard, FORMS, isStill, MONSTERS, monsterCard, SPELLS, SPRING, SPRING_WORN, spellCard, spellSrc, type MonsterCard } from "@/lib/catalog";
import { askLabel, attackLabel, chipLabel, MONSTER_CHIPS } from "@/lib/card-edits";
import { aimTorch, lightTorch, type TorchBox, type TorchState } from "@/lib/torch";
import { blueStart, boardAspect, boardCut, boardRatio, byBoard, planCut, redEnd, rh, ry, sameCut, setBoardCut, NO_CUT, type BoardCut } from "@/lib/board-cut";
import { fieldBindsFor } from "@/lib/field-chips";
import { playCue, playHit, playLine, playPack, playUi, setSound, soundOn, unlockSound, type Cue } from "@/lib/sfx";
import { loadDeck } from "@/lib/deck";
import { fxUrl, matchJobs } from "@/lib/preload";
import { LoadScreen, type LoadFace } from "@/components/game/load-screen";
import { MatchIntro, type IntroSide } from "@/components/game/match-intro";
import { OpenerPanel, type OpenerCard } from "@/components/game/opener-panel";
import { PickPanel, type PickCard } from "@/components/game/pick-panel";
import { RebirthPanel, type RebirthCard } from "@/components/game/rebirth-panel";
import { Tutorial, type TutView } from "@/components/game/tutorial";
import { CountBadge, type CountPart } from "@/components/game/count-badge";
import { ActionButton, GlyphDefs, hasSkillArt, MonsterSheet, Rim, SkillGlyph, type SheetAction, type UnitActKind } from "@/components/game/monster-sheet";
import { FUSE_BEATS, FuseDance, FusePic } from "@/components/game/fuse-dance";
import { Medal } from "@/components/game/medal";
import { OracleOrb } from "@/components/game/oracle-orb";
import { HintCard } from "@/components/game/hint-card";
import { countHint } from "@/lib/hints";
import { CATAPULT, cannotAct, EGG, handPicks, STAR_COST, skillLoss, shieldBreaks } from "@/lib/duel";

/** Mana trong mộ cần cộng dồn để có đủ n sao (mốc 1, 3, 6, 10). */
const starPrice = (n: number) => STAR_COST.slice(0, n).reduce((a, b) => a + b, 0);
import { AimMark } from "@/components/game/aim-mark";
import { RowArrow, type SummonRow } from "@/components/game/row-arrow";
import { AimPad, type PadBox, type PadDir } from "@/components/game/aim-pad";
import { TurnLight, type TankGeo, type TankSide, type TitleCue } from "@/components/game/turn-light";
import { SKILL_BOOK, bookSkill, skillCost, skillsOf } from "@/lib/skill-book";
import { spellKind, spellSpeed, speedTone } from "@/lib/spell-kinds";
import { skillBrief, spellBrief } from "@/lib/icon-briefs";
import { createTutorialDuel, TUTORIAL_MODE } from "@/lib/tutorial";
import { markTrial, TRIAL_KEY, TRIAL_MODE } from "@/lib/appraisal";
import { noteMatch, type MatchGain } from "@/lib/mission-store";
import { finishMazeBattle, takeMazeBattle, type MazeBattleTicket } from "@/lib/maze-store";
import { MissionAfter, missionRowsOf } from "@/components/game/mission-after";
import { EndScene } from "@/components/game/end-scene";
import { MatchSummary, type SummaryAgain, type SummarySeat } from "@/components/game/match-summary";
import { createTrialDuel, trialFoe, trialLevels, trialVerdict } from "@/lib/trial";
import { markTutorialDone } from "@/lib/tutorial-list";
import { absorb, freshScratch, loadHabits, saveHabits, watchSnap, type Scratch } from "@/lib/habits";
import { newMatchId, noteFinishedAi, openingDecks, warmMatchHistory, type OpeningDecks } from "@/lib/match-history";
import { MatchMenu } from "@/components/game/match-menu";
import { setLang, tr, useLang } from "@/lib/i18n";
import { pollRoom, pushDuel, type NetSeat } from "@/lib/net-room";
import { MACHINE, withMachine } from "@/lib/machines";
import { AttackEmblem } from "@/components/game/attack-emblem";
import { BoxFx, type BoxSpot } from "@/components/game/box-fx";
import { DeckPile, SHUFFLE_MS } from "@/components/game/deck-pile";
import { DrawFlights, type DrawFlight } from "@/components/game/draw-flights";
import { CardBurn, type BurnRect } from "@/components/game/card-burn";
import { CardShow } from "@/components/game/card-show";
import { ConfirmNote, FoeNote, type NoteHead } from "@/components/game/act-notes";
import { confirmOn, setConfirmOn } from "@/lib/confirm-ask";
import { CastShow } from "@/components/game/cast-show";
import { CardShatter, SHATTER_BURST, SHATTER_MS } from "@/components/game/card-shatter";
import { EquipShow, EQUIP_MS } from "@/components/game/equip-show";
import { HandPeek, type PeekInfo } from "@/components/game/hand-peek";
import { brainStep, runAct } from "@/lib/brain";
import { think } from "@/lib/brain-client";
import { ownFace, roomFace } from "@/lib/match-faces";
import {
  assignBlock,
  assignCover,
  attackFace,
  attackMonster,
  boostGnawOnChain,
  canWall,
  canStand,
  canStandHand,
  hexLocked,
  standFor,
  standIn,
  canGuardCover,
  canDispatch,
  dispatchKnight,
  isKnight,
  guardCover,
  startParley,
  pickParley,
  parleyPicker,
  canSpirit,
  spiritCover,
  castName,
  castSpell,
  concede,
  createDuel,
  openingDraw,
  declareSkill,
  dismissGlimpse,
  draw,
  OPENING_CARDS,
  pileLeft,
  FIELD_SLOTS,
  pickCounter,
  endTurn,
  fieldName,
  harmShift,
  harmSkill,
  reactSkillOk,
  slowSkill,
  attackRound,
  hornFit,
  skillLook,
  chronoChoice,
  chronoHighAlly,
  rollTimeSector,
  pullWheel,
  settleWheel,
  digChoices,
  digGrave,
  passResponse,
  harpyOffer,
  harpyWard,
  eatFor,
  harpyLash,
  answerPlume,
  answerPrey,
  evolveBird,
  answerRhino,
  rhinoProgress,
  answerWile,
  WILE_CARDS,
  isWileCard,
  wileReady,
  wileBirds,
  charmCode,
  REVIVE_CARD,
  PRISM_CARD,
  PRISM_DRAW,
  prismPicks,
  prismBase,
  answerTrim,
  reviveReady,
  reviveChoices,
  reviveCode,
  chooseClock,
  summonClock,
  CLOCK,
  CLOCK_FIERCE,
  CLOCK_FRAIL,
  clockForm,
  wallAlly,
  confirmSwap,
  confirmRecall,
  recallCost,
  recallFits,
  recallLeft,
  recallReady,
  recallStars,
  canTargetFoe,
  primeKnight,
  offerVow,
  answerFairy,
  answerSoul,
  soulAskLine,
  swordAskLine,
  answerSword,
  armHorn,
  spellAtk,
  setCover,
  skillManaCost,
  skillFigure,
  summon,
  summonHidden,
  summonVow,
  previewMon,
  vowCap,
  fuse,
  fuseSet,
  setFusionsFor,
  testGrant,
  testEnv,
  testReset,
  canCastSwap,
  shelterPicks,
  boxAllies,
  DUO_CARD,
  duoAllies,
  duoTargets,
  duoReady,
  duoCode,
  duoCanAttack,
  duoCanSkill,
  type DuoPick,
  springAllies,
  eggAim,
  eggAllies,
  boxFoes,
  virusTargets,
  slowWaiting,
  answerSide,
  canTestReset,
  toggleStance,
  useSkill,
  swordFollow,
  swordLast,
  answerUpkeep,
  answerGemCap,
  answerGemWarn,
  answerLegs,
  visibleStats,
  sanctuaryShielded,
  startReel,
  pullReel,
  settleReel,
  openerSwap,
  type AgainVote,
  type Duel,
  type FieldMon,
  type OpenerPick,
  type ReelFace,
  type Side,
  type Slot,
  confirmStage,
  stageHold,
  knackOpen,
  boulder,
  gearCard,
  backSlot,
  lurking,
  lurkReady,
  lurkChoices,
  answerLurk,
  wakeLurk,
  riteDeadFor,
  RITE_CARD,
  doomWaiting,
  trapPicks,
  TRAP_CARD,
  lockChoices,
} from "@/lib/duel";
import { queueRuns, reachOf, settle, type Reach } from "@/lib/preview";
import { advisedRow } from "@/lib/row-advice";
import { findFusion, findKnightFusion, hexBonus, isHexer, thirdKnight, type FuseMat } from "@/lib/fusion";
import { COUNT_MARKS, fieldSpots, SHEET_SPOTS, loadAlertLook, loadField, markScale, matchBoard, type FieldKey } from "@/lib/layouts";
import { bottomArt, topArt } from "@/lib/env-boards";
import { spellFxLook } from "@/lib/card-fx";
import { AimFlow, ICON, ReactionLine, branchRoutes, coverPoint, keyOf, type EndSpot, type IconLook, type IconSpot } from "@/components/game/reaction-line";
import { stepChain, type ChainOrb, type FlowEnd, type FlowLink } from "@/lib/reaction-chain";
import { RelatedFlow, SpellSheet } from "@/components/game/card-sheets";
import { SEA_KINDS } from "@/lib/env-kinds";
import { emitFx, LASER_MS, type FxEvent } from "@/lib/spectacle";
import { fireBlastOn } from "@/lib/fx-prefs";
import { pushReplay, pushWatch, readReplay, readWatch } from "@/lib/friends";
import { markReplay, recordGame } from "@/lib/profile";
import { ReplayBook, ReplayRecorder, packReplay, unpackReplay } from "@/lib/replay";
import { loadReplayAsk, PLAYER_NAME, playerId, PROFILE_BACK_KEY, REPLAY_KEY, usePulse, WATCH_KEY, WATCH_SEAT_KEY } from "@/lib/friend-state";

export const Route = createFileRoute("/play")({ component: PlayPage });

const SEA_IDS = new Set(SEA_KINDS);
const SEA_NAMES = SEA_KINDS.map((id) => monsterCard(id)?.name ?? "").filter(Boolean);

function seaVeiled(duel: Duel, viewer: Side, uid: string): boolean {
  if (!uid) return false;
  for (const side of [0, 1] as const) {
    const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
    if (!mon) continue;
    return side !== viewer && (Boolean(duel.players[side].sea && SEA_IDS.has(mon.cardId) && !mon.shown) || lurking(mon));
  }
  return false;
}

function strikeUid(duel: Duel): string {
  const pending = duel.pending;
  if (!pending) return "";
  if (pending.kind === "beam" || pending.kind === "gnaw-skill") return pending.caster;
  if (pending.kind === "face" || pending.kind === "melee" || pending.kind === "gnaw") return pending.attacker;
  return "";
}

function hiddenStrike(prev: Duel, next: Duel, viewer: Side): boolean {
  const uid = strikeUid(next) || strikeUid(prev);
  return seaVeiled(next, viewer, uid) || seaVeiled(prev, viewer, uid);
}

function fallenSea(prev: Duel, next: Duel, viewer: Side): string[] {
  const names: string[] = [];
  for (const side of [0, 1] as const) {
    if (side === viewer || !prev.players[side].sea) continue;
    for (const mon of prev.players[side].field) {
      if (!mon || mon.shown || !SEA_IDS.has(mon.cardId)) continue;
      const still = next.players[side].field.some((unit) => unit?.uid === mon.uid && unit.hp > 0);
      if (!still) names.push(fieldName(mon));
    }
  }
  return names;
}

/** A new match of this mode; Vs Máy plays máy chung's own deck (chủ game 22/10), shown with its name and group. */
function newMatch(mode: Duel["mode"]): Duel {
  const deck = loadDeck();
  const duel = createDuel(deck, mode, mode === "ai" ? MACHINE : undefined);
  return mode === "ai" ? withMachine(duel, MACHINE, ownFace(deck)) : duel;
}

function veilSlain(prev: Duel, next: Duel, viewer: Side): boolean {
  if (fallenSea(prev, next, viewer).length === 0) return false;
  const pending = prev.pending;
  return pending?.kind === "melee" || pending?.kind === "gnaw" || pending?.kind === "beam" || pending?.kind === "gnaw-skill" || next.tone === "hit" || next.tone === "spell";
}

function deathReveal(text: string, duel: Duel, viewer: Side): boolean {
  const foe = duel.players[viewer === 0 ? 1 : 0];
  if (!foe.sea) return false;
  const onFoe = new Set(foe.field.filter((mon) => mon).map((mon) => fieldName(mon!)));
  const yours = new Set(duel.players[viewer].field.filter((mon) => mon).map((mon) => fieldName(mon!)));
  return SEA_NAMES.some((name) => text.includes(name) && !onFoe.has(name) && !yours.has(name));
}

function maskHats(text: string, duel: Duel, viewer: Side): string {
  const foe = duel.players[viewer === 0 ? 1 : 0];
  if (!foe.hats) return text;
  const names = foe.field.filter((mon) => mon && mon.cardId !== "mu").map((mon) => fieldName(mon!));
  let out = text;
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    if (name) out = out.split(name).join("Mũ");
  }
  return out;
}

function veilNotice(text: string, duel: Duel, viewer: Side): string {
  return maskLurk(veilSea(text, duel, viewer), duel, viewer);
}

function veilSea(text: string, duel: Duel, viewer: Side): string {
  text = maskHats(text, duel, viewer);
  const foe = duel.players[viewer === 0 ? 1 : 0];
  if (foe.field.some((mon) => mon && mon.cardId === "chien-binh-lan-khuat" && (mon.shown ?? 0) > 0)) {
    text = text.split("Chiến binh lẫn khuất").join("Thế thân");
  }
  const hornHit = /Sấm lôi phá/.test(text);
  if (!hornHit && deathReveal(text, duel, viewer)) return text;
  const masked = maskHidden(text, duel, viewer);
  if (hornHit) return maskSeaHit(masked, duel, viewer);
  if (!masked.includes("quái thú ẩn mình")) return masked;
  const names = duel.players[viewer].field.filter((mon) => mon).map((mon) => fieldName(mon!));
  names.sort((a, b) => b.length - a.length);
  const hit = names.find((name) => name && masked.includes(name));
  if (hit) return `quái thú ẩn mình tấn công ${hit}`;
  if (/người|đánh vào bạn|tấn công bạn/i.test(masked)) return "quái thú ẩn mình tấn công bạn";
  return "quái thú ẩn mình tấn công";
}

function maskSeaHit(text: string, duel: Duel, viewer: Side): string {
  const foe = duel.players[viewer === 0 ? 1 : 0];
  if (!foe.sea) return text;
  const visible = new Set(foe.field.filter((mon) => mon && (!SEA_IDS.has(mon.cardId) || mon.shown)).map((mon) => fieldName(mon!)));
  let out = text;
  for (const name of [...SEA_NAMES].sort((a, b) => b.length - a.length)) {
    if (visible.has(name)) continue;
    out = out.split(name).join("quái thú ẩn mình");
  }
  return out;
}

function maskHidden(text: string, duel: Duel, viewer: Side): string {
  const foe = duel.players[viewer === 0 ? 1 : 0];
  if (!foe.sea) return text;
  const onFoe = new Set(foe.field.filter((mon) => mon && !mon.shown && SEA_NAMES.includes(fieldName(mon))).map((mon) => fieldName(mon!)));
  let out = text;
  for (const name of [...SEA_NAMES].sort((a, b) => b.length - a.length)) {
    if (onFoe.has(name)) out = out.split(name).join("quái thú ẩn mình");
  }
  return out;
}

/** Luật L2: quái ẩn đang úp trên sân đối thủ không lộ tên trong thông báo. */
function maskLurk(text: string, duel: Duel, viewer: Side): string {
  const foe = duel.players[viewer === 0 ? 1 : 0];
  const names = [...new Set(foe.field.filter((mon) => mon && lurking(mon)).map((mon) => fieldName(mon!)))].filter(Boolean);
  let out = text;
  for (const name of names.sort((a, b) => b.length - a.length)) out = out.split(name).join("quái thú ẩn mình");
  return out;
}

type Aim =
  | { kind: "summon"; index: number }
  | { kind: "unit"; uid: string }
  | { kind: "menu"; uid: string }
  | { kind: "attack"; uid: string }
  | { kind: "skill-info"; uid: string }
  | { kind: "cast"; uid: string }
  | { kind: "innate"; uid: string }
  | { kind: "skill"; uid: string; index: number; also?: string }
  | { kind: "tide"; uid: string }
  | { kind: "spell"; index: number; spellId: string; from?: string; duo?: { picks: DuoPick[]; ask?: string }; wile?: { ally?: string } };

type Strike = { uid: string; face: boolean; foeUid: string | null };
/** Centre and width of a card on the board, in % of the board. */
type BoardSpot = { x: number; y: number; w: number };
/**
 * Fusion scene, after the owner's second reference video: both monsters rise to the middle (lift), smash into
 * each other (clash), spring apart (apart), are sucked into each other in a whirlpool, standing upright (swirl),
 * burst into a flash and whiteout (flash), and the fused monster turns a little on its upright axis as it
 * appears (turn). Its sheet asks to summon (reveal), and it lays down onto the slot with lightning (land).
 */
type FusePhase = "lift" | "clash" | "apart" | "swirl" | "flash" | "turn" | "reveal" | "rows" | "land";
/** Lá quái đưa từ tay ra giữa sân (chủ game 13/11): chọn hình thức triệu hồi (menu) rồi hàng (rows); `picks` = quân đã chọn
 *  hiến tế; `leave` = lá đang bay về tay (home) hoặc đáp xuống ô (land). */
type Staged = {
  index: number;
  id: string;
  mode: "menu" | "rows" | "none";
  picks: string[] | null;
  leave: null | { kind: "home" } | { kind: "land"; slot: Slot };
  /** Triệu hồi Ẩn (chủ game 21/11). */
  hide?: boolean;
  /** Đồng hồ khó đoán (chủ game 22/11): dạng đã chọn trước khi ra sân (null = đang chọn). Ẩn thì luôn hung bạo. */
  clock?: { form: string | null };
};
/** Giữa lá hiện to giữa sân, theo % chiều cao bàn. */
const SHOW_TOP = 47;
const PEEK_TOP = 9;
/** `third` and `c`: the third knight of a three-knight fusion and where it stands, so all three cards fly in. */
type FuseOpt = { uid: string; slot: 0 | 1 | 2 | 3 | 4 | 5; resultId: string; cost: number; set?: { mats: FuseMat[] } };
/** Dung hợp từ lá giống nhau: hình và chỗ của từng nguyên liệu ngoài lá đang kéo, để cảnh dung hợp bay đúng. */
type FuseMatShow = { src: string; spot: BoardSpot; uid?: string; index?: number };
type FuseShow = { index: number; uid: string; slot: 0 | 1 | 2 | 3 | 4 | 5; resultId: string; phase: FusePhase; n: number; a: BoardSpot; b: BoardSpot; at: BoardSpot; third?: string; c?: BoardSpot; set?: { mats: FuseMatShow[] } };

/** The rays of the fusion flash: angle (deg), length and thickness (vmin), delay (ms). */
const FUSE_RAYS = [
  [-90, 62, 1.1, 0], [-62, 48, 0.7, 40], [-118, 52, 0.8, 20], [-34, 40, 0.6, 70], [-146, 44, 0.6, 50], [-8, 56, 0.9, 30],
  [172, 50, 0.8, 60], [28, 34, 0.5, 90], [152, 30, 0.5, 100], [90, 28, 0.6, 80], [62, 24, 0.4, 110], [118, 26, 0.4, 120],
] as const;

/** Where an element sits on the board, as a card spot. */
function boardSpot(el: Element | null, fallback: BoardSpot): BoardSpot {
  const board = document.querySelector(".board")?.getBoundingClientRect();
  if (!board || !el) return fallback;
  const box = el.getBoundingClientRect();
  return { x: ((box.left + box.width / 2 - board.left) / board.width) * 100, y: ((box.top + box.height / 2 - board.top) / board.height) * 100, w: (box.width / board.width) * 100 };
}
type Inspect = { pile: "reserve" | "spell"; index: number } | { pile: "env"; id: string; from?: "chain" };
type BlockChoice = { uid: string; skill: boolean | null; buff: boolean | null };
type FuseAsk = {
  id: number;
  reserveIndex: number;
  fieldUid: string;
  handId: string;
  handLevel: number;
  fieldId: string;
  fieldLevel: number;
  resultId: string;
  slot: 0 | 1 | 2;
  phase: "ask" | "fly" | "flash" | "preview";
  fromHand: { x: number; y: number };
  fromField: { x: number; y: number };
};

type Grab =
  | { kind: "summon"; index: number; card: MonsterCard }
  | { kind: "spell"; index: number; spellId: string }
  | { kind: "unit"; uid: string; card: MonsterCard; live: { name: string; atk: number; def: number; mdef: number; hp: number; level: number } };

type Drag = Grab & { x: number; y: number };
type Floater = { id: number; x: number; y: number; text: string; heal: boolean; spot: "self" | "target"; delay?: number; grow?: boolean; hush?: boolean; buff?: boolean; mend?: number };

function floaterStyle(item: Floater) {
  return {
    left: `${item.x}%`,
    top: `${item.y}%`,
    ...(item.delay ? { animationDelay: `${item.delay}s`, animationFillMode: "both" as const } : {}),
  };
}
type Fall = { floater: Floater; side: Side; index: number; mon: FieldMon; hold?: number; laser?: boolean };
type Linger = { id: number; side: Side; index: number; mon: FieldMon; fading?: boolean };
type Motion = { pops: string[]; lunges: string[]; hits: string[] };
type Burst = { id: number; tone: "spell" | "heal"; text: string };

/**
 * 6 ô mỗi bên trên bàn mới (ảnh board-full.jpg của Grok, chủ game chọn 28/10): số theo phần trăm của chính ảnh bàn.
 * Ô 0–2 là hàng trước (sát giữa sân), ô 3–5 là hàng sau (sát tay).
 */
const SLOT_COLS = [13.1, 33.7, 53.6] as const;
const SLOT_W = 15.3;
/** Một bảng ô cho một bàn: `foeRows` / `youRows` = [hàng trước, hàng sau] mỗi hàng {y đầu, cao}. Đo từ ảnh bàn (chủ game 15/11). */
function slotTables(foeRows: [{ y: number; h: number }, { y: number; h: number }], youRows: [{ y: number; h: number }, { y: number; h: number }]) {
  const boxes = (rows: [{ y: number; h: number }, { y: number; h: number }]) => [
    ...SLOT_COLS.map((x) => ({ x, y: rows[0].y, w: SLOT_W, h: rows[0].h })),
    ...SLOT_COLS.map((x) => ({ x, y: rows[1].y, w: SLOT_W, h: rows[1].h })),
  ];
  const pos = (list: Array<{ x: number; y: number; w: number; h: number }>) => list.map((box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 }));
  const you = boxes(youRows);
  const foe = boxes(foeRows);
  return { box: { 0: you, 1: foe }, pos: { 0: pos(you), 1: pos(foe) } };
}
const SLOT_A = slotTables([{ y: 25, h: 11.8 }, { y: 12, h: 11.7 }], [{ y: 59.4, h: 11.6 }, { y: 72.2, h: 11.5 }]);
const SLOT_B = slotTables([{ y: 28.8, h: 10.2 }, { y: 17.5, h: 10.2 }], [{ y: 58.5, h: 10.2 }, { y: 69.8, h: 9.9 }]);
const SLOT_POS: Record<Side, Array<{ x: number; y: number }>> = byBoard({ a: SLOT_A.pos, b: SLOT_B.pos });
const SLOT_BOX: Record<Side, Array<{ x: number; y: number; w: number; h: number }>> = byBoard({ a: SLOT_A.box, b: SLOT_B.box });
/** Khung quanh viên máu của từng bên: góc trên trái + cỡ (phần trăm bàn). */
const HP_BOX: Record<Side, { x: number; y: number; w: number; h: number }> = byBoard({
  a: { 0: { x: 4.5, y: 85, w: 12.3, h: 6.9 }, 1: { x: 7.3, y: 2.3, w: 12.3, h: 6.9 } },
  b: { 0: { x: 3.3, y: 90.7, w: 13.5, h: 6.6 }, 1: { x: 7.1, y: 8.7, w: 13.5, h: 6.6 } },
});

/** Ô của từng hàng phía mình, từ trái sang (bảng trên: ô 0–2 hàng trước, 3–5 hàng sau, x tăng dần). */
const ROW_SLOTS: Record<SummonRow, Slot[]> = { front: [0, 1, 2], back: [3, 4, 5] };
/** Two taps on the same card in hand within this many ms open its sheet (chủ game 28/10). */
const DOUBLE_TAP = 350;
/** Gợi ý lượt 1 (t1-draw1, t1-draw0, t1-pass, t1-more): tạm ẩn từ 12/11, đặt false để bật lại. */
const TURN_ONE_HINTS_OFF = true;
/** Lá tự rút của lượt đầu bay sau 3 lá đầu (3 lá cách 0,15 giây + 0,62 giây bay) cộng một nhịp nghỉ (chủ game 13/11). */
const AUTO_DRAW_AT = 1.5;

/** Bên nào vừa xáo bộ bài giữa `prev` và `next` (chủ game 26/11). Trận mới mở chỉ tính khi đang đổi bài đầu trận. */
function shuffledSides(prev: Duel | null, next: Duel): Side[] {
  const now = next.shuffles ?? [0, 0];
  const fresh = !prev || prev.mid !== next.mid;
  if (fresh && !next.opener) return [];
  const was = fresh ? [0, 0] : prev?.shuffles ?? [0, 0];
  return ([0, 1] as const).filter((side) => now[side] > was[side]);
}

let floaterSeq = 1;

const TRAIL_INK = {
  atk: "#ff3b3b",
  skill: "#3aa0ff",
  block: "#ffe14a",
  sys: "#141414",
  summon: "#ff9a1f",
  spell: "#ff4fa3",
  draw: "#c6ff3d",
  tick: "#3dcc4a",
} as const;

type TrailInk = keyof typeof TRAIL_INK;
type TrailMark = { id: number; text: string; ink: TrailInk; clock: number };

const TRAIL_SLOTS = 5;
const SKILL_NAMES = [...new Set(Object.values(MONSTER_CHIPS).flatMap((chips) => chips.map((chip) => chip.label)))].sort((a, b) => b.length - a.length);
const SPELL_NAMES = [...SPELLS].map((card) => card.name).sort((a, b) => b.length - a.length);

function namedIn(body: string, names: string[]) {
  return names.some((name) => name.length > 1 && body.includes(name));
}

function isDrawNotice(body: string) {
  if (/không được rút|chỉ rút|Hết quái để rút|Hết phép để rút|Rút bài cần|Mỗi lượt chỉ rút/.test(body)) return false;
  return /(?:^|\n)(?:Bạn|Đối thủ) rút \S/u.test(body);
}

function isTurnDamage(body: string) {
  return /trúng độc|chết vì độc|bị bào mòn|chết vì bào mòn|Virus ăn mòn (?:gây|tiêu diệt|bắt đầu)|gánh (?:\d+ )?đòn cho kén|nhận \d+[^\n.]*sát thương/.test(body);
}

function trailSkip(text: string) {
  const body = text.replace(/^\d+\.\s*/u, "").trim();
  if (!/bắt đầu lượt/.test(body)) return false;
  if (isTurnDamage(body) || /sát thương|giáp lá cà|đánh thường|đánh vào người|bắn phép/.test(body)) return false;
  return true;
}

function monsterDamage(body: string) {
  if (/giáp lá cà|đánh thường|lao vào|sáp lá cà/.test(body)) return true;
  if (/sát thương[\s\S]{0,48}(?:lên|vào) (?!người chơi\b)/.test(body)) return true;
  return /gây \d+ máu lên (?!người chơi\b)/.test(body);
}

function hitsPlayer(body: string) {
  return /người chơi|vào người\b/.test(body);
}

function plainPlayerAttack(body: string) {
  if (!hitsPlayer(body)) return false;
  if (/(?:chỉ|không|Chọn|Hãy)(?:\s|$)/.test(body) && !/Có thể chặn/.test(body)) return false;
  if (/bắn phép|dùng |theo Đàm phán|theo Kiếm đàm phán/.test(body)) return false;
  return /đánh vào người|gây \d+ máu lên người chơi/.test(body);
}

function skillSpellPlayer(body: string) {
  if (!hitsPlayer(body) || plainPlayerAttack(body)) return false;
  if (/(?:chỉ|không|Chọn|Hãy)(?:\s|$)/.test(body) && !/Có thể chặn/.test(body) && !/sát thương/.test(body)) return false;
  return /sát thương|bắn phép|dùng .+ lên người chơi|Tấn công nhát|đang thi triển/.test(body) || namedIn(body, SKILL_NAMES) || namedIn(body, SPELL_NAMES);
}

function noticeInk(text: string): TrailInk {
  const body = text.replace(/^\d+\.\s*/u, "").trim();
  if (/sẽ chặn|Kiếm phòng ngự|Phòng ngự|Đỡ hộ|Đỡ Kazura|đỡ đòn|đỡ phép|chặn bằng /.test(body)) return "block";
  if (isDrawNotice(body)) return "draw";
  if (isTurnDamage(body)) return "tick";
  if (monsterDamage(body)) return "atk";
  if (plainPlayerAttack(body)) return "atk";
  if (skillSpellPlayer(body)) return "skill";
  if (/triệu hồi/.test(body) && !/không triệu hồi|chỉ triệu hồi|đã triệu hồi trong lượt|triệu hồi nhanh được|mới triệu hồi/.test(body)) return "summon";
  if (/đang thi triển/.test(body)) return "spell";
  if (namedIn(body, SKILL_NAMES)) return "skill";
  if (namedIn(body, SPELL_NAMES)) return "spell";
  return "sys";
}

function NoticeText({ text }: { text: string }) {
  const lines = text.split("\n");
  const listed = lines.length > 1 && lines.slice(1).some((line) => line.startsWith("- "));
  if (!listed) return <Painted text={text} />;
  return (
    <>
      <span className="banner-title">
        <Painted text={lines[0] ?? ""} />
      </span>
      {lines.slice(1).filter((line) => line.trim()).map((line, index) => (
        <span key={index} className="banner-line">
          <Painted text={line} />
        </span>
      ))}
    </>
  );
}

function spoken(text: string, viewer: Side): string {
  let out = text;
  if (viewer === 1) out = out.replaceAll("Đối thủ", "\u0001").replaceAll("Bạn", "Đối thủ").replaceAll("\u0001", "Bạn");
  // The drawn card's name may be followed by more of the notice ("… có thể triệu hồi quái thú N sao"): only the name is
  // hidden, the rest stays.
  return out.replace(/Đối thủ rút ([^.]*)/g, (_, rest: string) => {
    const called = rest.trim();
    const named = (cards: Array<{ name: string }>) =>
      [...cards].sort((a, b) => b.name.length - a.name.length).find((card) => called === card.name || called.startsWith(`${card.name} `));
    const monster = named(MONSTERS);
    const spell = monster ? null : named(SPELLS);
    const tail = monster ? called.slice(monster.name.length) : spell ? called.slice(spell.name.length) : "";
    return `${monster ? "Đối thủ rút 1 quái" : "Đối thủ rút 1 phép"}${tail}`;
  });
}

function savedSeat(): "host" | "guest" | null {
  if (typeof sessionStorage === "undefined") return null;
  if (sessionStorage.getItem(WATCH_KEY) || sessionStorage.getItem(REPLAY_KEY)) return sessionStorage.getItem(WATCH_SEAT_KEY) === "guest" ? "guest" : "host";
  try {
    const raw = JSON.parse(sessionStorage.getItem("clash-net") ?? "null") as { seat?: string } | null;
    return raw?.seat === "host" || raw?.seat === "guest" ? raw.seat : null;
  } catch {
    return null;
  }
}

/** Bộ bài của một bên lúc vào trận, để ghi vào hồ sơ. */
function deckOf(face: import("@/lib/duel").DuelFace | undefined) {
  return face?.cards ? { monsters: [...face.cards.monsters], spells: [...face.cards.spells], name: face.deck ?? null, cover: face.cover ?? null } : undefined;
}

const TEST_DUEL_KEY = "clash-test-duel";

/** Gương phòng hộ đứng sẵn vừa tự dựng trước đòn đánh của `side`, và còn chờ `side` trả lời (chưa phát động). */
function mirrorWaits(duel: Duel, side: Side): boolean {
  const hold = duel.hold;
  if (duel.step !== "respond" || !hold || hold.stage || hold.mirror !== "up" || hold.priority !== side || duel.turn !== side) return false;
  const pending = duel.pending;
  return Boolean(pending && (pending.kind === "melee" || (pending.kind === "face" && !pending.skill)));
}

function loadTestDuel(): Duel | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TEST_DUEL_KEY);
    if (!raw) return null;
    const duel = JSON.parse(raw) as Duel;
    return duel?.mode === "test" ? duel : null;
  } catch {
    return null;
  }
}

/** Con mắt (chủ game 28/10): a monster after the queue goes through; `gain` is the certain change of each number. */
type Forecast = { dead: boolean; gain: Record<"atk" | "def" | "mdef" | "hp", number> };
type Sight = { mons: Map<string, Forecast>; hp: [number, number]; random: boolean };

/**
 * What the eye shows from the outcomes of the queue under several rolls: only the part every roll agrees on (a fall
 * as small as the smallest fall, a rise as small as the smallest rise), and a monster is gone only if it falls in all.
 */
function foresee(now: Duel, runs: Duel[]): Sight {
  const keys = ["atk", "def", "mdef", "hp"] as const;
  const certain = (deltas: number[]) => (deltas.every((d) => d > 0) ? Math.min(...deltas) : deltas.every((d) => d < 0) ? Math.max(...deltas) : 0);
  const mons = new Map<string, Forecast>();
  let random = false;
  const find = (duel: Duel, uid: string) => {
    for (const player of duel.players) {
      const mon = player.field.find((unit) => unit?.uid === uid);
      if (mon) return { mon, field: player.field };
    }
    return null;
  };
  for (const side of [0, 1] as const) {
    for (const mon of now.players[side].field) {
      if (!mon) continue;
      const shown = visibleStats(mon, now.players[side].field);
      const base = { atk: shown.atk, def: shown.def, mdef: shown.mdef, hp: mon.hp };
      const outs = runs.map((run) => {
        const after = find(run, mon.uid);
        if (!after || after.mon.hp <= 0) return null;
        const stats = visibleStats(after.mon, after.field);
        return { atk: stats.atk, def: stats.def, mdef: stats.mdef, hp: after.mon.hp };
      });
      const dead = outs.every((out) => out === null);
      if (!dead && outs.some((out) => out === null)) random = true;
      const gain = { atk: 0, def: 0, mdef: 0, hp: 0 };
      for (const key of keys) {
        const deltas = outs.map((out) => (out ? out[key] - base[key] : key === "hp" ? -base.hp : 0));
        if (new Set(deltas).size > 1) random = true;
        gain[key] = dead ? 0 : certain(deltas);
      }
      if (dead || keys.some((key) => gain[key] !== 0)) mons.set(mon.uid, { dead, gain });
    }
  }
  const hp = ([0, 1] as const).map((side) => {
    const deltas = runs.map((run) => run.players[side].hp - now.players[side].hp);
    if (new Set(deltas).size > 1) random = true;
    return now.players[side].hp + certain(deltas);
  }) as [number, number];
  return { mons, hp, random };
}

function boardActor(duel: Duel): Side {
  const picker = parleyPicker(duel);
  if (picker !== null) return picker;
  // A queued action not yet confirmed (hàng chờ) still belongs to the side that queued it.
  return (duel.step === "respond" && duel.hold && !duel.hold.stage ? duel.hold.priority : duel.turn) as Side;
}

function viewerSide(duel: Duel, actorSide: Side, seat: "host" | "guest" | null): Side {
  if (duel.mode === "hotseat" || duel.mode === "test") return actorSide;
  if (duel.mode === "ai") return 0;
  return (seat ?? savedSeat()) === "guest" ? 1 : 0;
}

function screenSide(side: Side, viewer: Side): Side {
  return side === viewer ? 0 : 1;
}

function knightRoom(self: FieldMon, other: FieldMon | null, selfAllies: Array<FieldMon | null>, foeAllies: Array<FieldMon | null>): 1 | 2 {
  if (!other) return 1;
  const stars = monsterCard(other.cardId)?.stars ?? 0;
  const higher = visibleStats(other, foeAllies).atk > visibleStats(self, selfAllies).atk;
  return higher || stars >= 4 ? 2 : 1;
}

function knightDue(duel: Duel, viewer: Side): { uid: string; room: 1 | 2 } | null {
  if (duel.step !== "respond" || !duel.hold || duel.hold.priority !== viewer || duel.winner) return null;
  const pending = duel.pending;
  if (!pending || (pending.kind !== "melee" && pending.kind !== "face")) return null;
  const foeSide = (1 - duel.turn) as Side;
  const attacker = duel.players[duel.turn].field.find((unit) => unit?.uid === (pending.kind === "melee" || pending.kind === "face" ? pending.attacker : "")) ?? null;
  const defId = pending.kind === "melee" ? (duel.hold.blocker ?? pending.defender) : duel.hold.blocker;
  if (!defId) return null;
  const defender = duel.players[foeSide].field.find((unit) => unit?.uid === defId) ?? null;
  const self = viewer === duel.turn ? attacker : defender;
  const other = viewer === duel.turn ? defender : attacker;
  if (!self || self.cardId !== "ky-si-bong-toi" || self.clash || (self.path ?? 0) > 0) return null;
  const foeAllies = duel.players[viewer === 0 ? 1 : 0].field;
  return { uid: self.uid, room: knightRoom(self, other, duel.players[viewer].field, foeAllies) };
}

/** How far an attacker lunges toward what it hits while the other side may answer: as far as it always did, less the
 *  room its reaction icon takes in front of it (chủ game 23/10). */
/** Dòng chảy đợt 2: how far in front of the row it is aimed at a spread splits, as a share of the gap between the two
 *  front rows (chủ game 29/10: a quarter, so a spell that stops its trunk stands just before it on that side's half),
 *  and the ring round a player's health its light runs into, in % of the board's width. */
const FORK_SHARE = 0.25;
const HP_RING = 7.4;
/** The ring a flow of Gió dịu đi runs round a mana mark. */
const MANA_RING = 4.2;
/** How far along the way to the mana marks the mother flow of Gió dịu đi runs before it splits. */
const MANA_FORK = 0.55;
/** How long the blown-away mana keeps its old number: the pink flow's way to it (ms). */
const DRAIN_WAIT = 1500;
/** The icon's height and a little air on each side, in box units (the board is 90 × 160). */
const iconRoom = () => (ICON / boardRatio() + 1.2) * 1.6;

function lungeTravel(base: number, dx: number, dy: number): number {
  const dist = Math.hypot(dx * 0.9, dy * 1.6 * boardCut().v) || 1;
  return Math.max(0.05, base - iconRoom() / dist);
}

/** Chủ game 14/11 (P3.1): a normal attack no longer flies up to hit: the attacker stands still like a monster that uses a
 *  skill (its icon, flow and landing effects tell the story). Only a monster that blocks still flies out (`blockShift`). */
function attackShift(_duel: Duel, _uid: string, _viewer: Side): { x: number; y: number } | null {
  return null;
}

/** What is left of the middle band between the two front rows (in % of the board's height) once a blow's icon and
 *  its blocker's icon stand in it with a short stretch of flow between them. A cut board (a short screen) may leave
 *  none: then neither card lunges and the two icons close in on their cards. */
function blockRoom(): number {
  const top = Math.max(...SLOT_BOX[1].slice(0, 3).map((box) => box.y + box.h));
  const bottom = Math.min(...SLOT_BOX[0].slice(0, 3).map((box) => box.y));
  const tall = ICON * boardAspect();
  return bottom - top - 2 * (tall + 0.6) - tall * 0.5;
}

/**
 * Dòng chảy đợt 2 (chủ game 29/10): a monster that blocks flies out of its row toward the middle of the board, its
 * crossed swords in front of it as the wall the blow surges against. A blocker stands in the front row, so it moves
 * away from what it covers (a monster behind it, or the player). In % of its own box, as `attackShift`.
 */
const LUNGE_BLOCK = 0.2;
/** How near the way of a branch (box units) a monster must be dropped to stand in front of it. */
const LANE_REACH = 7;
/** The gap between a wall card and the card beside it, in % of the board's width. */
const WALL_GAP = 0.8;
/** How far along a branch, from its fork to what it lands on, the icon of a monster covering it stands. */
const COVER_ALONG = 0.7;
/** How far an attacker lunges toward a monster that blocks it. */
const LUNGE_BLOCKED = 0.3;
function blockShift(duel: Duel, uid: string, viewer: Side): { x: number; y: number } | null {
  if (duel.step !== "respond" || !duel.hold || duel.hold.blocker !== uid || !duel.pending) return null;
  if (seaVeiled(duel, viewer, uid)) return null;
  const side = duel.players[0].field.some((mon) => mon?.uid === uid) ? 0 : duel.players[1].field.some((mon) => mon?.uid === uid) ? 1 : null;
  if (side === null) return null;
  const row = screenSide(side, viewer);
  const box = SLOT_BOX[row][duel.players[side].field.findIndex((mon) => mon?.uid === uid)];
  if (!box) return null;
  const lift = Math.min(LUNGE_BLOCK * box.h, Math.max(0, blockRoom() / 2));
  return { x: 0, y: (row === 1 ? 1 : -1) * (lift / box.h) * 100 };
}

/** Phục kích (chủ game 30/10): the ally it sends flies at the one whose skill it stopped, once its pink light reached it
 *  (`POUNCE_AFTER` ms after it is played), and waits there for the chain to land. In % of its own box. */
const POUNCE_AFTER = 1100;
/** An ally Phục kích can send: not stunned, not chained, and not a card that never fights. */
function ambushReady(mon: FieldMon): boolean {
  return mon.hp > 0 && mon.stun === 0 && (mon.chain ?? 0) === 0 && mon.cardId !== "chan-ken" && mon.cardId !== "ken-ngai" && mon.cardId !== "hoa-an-thit-nguoi";
}

function ambushShift(duel: Duel, uid: string, viewer: Side): { x: number; y: number } | null {
  const ambush = duel.step === "respond" ? duel.hold?.ambush : null;
  if (!ambush || ambush.ally !== uid) return null;
  const seat = (id: string) => {
    for (const side of [0, 1] as const) {
      const index = duel.players[side].field.findIndex((mon) => mon?.uid === id);
      if (index >= 0) return SLOT_BOX[screenSide(side, viewer)][index];
    }
    return null;
  };
  const from = seat(uid);
  const to = seat(ambush.foe);
  if (!from || !to) return null;
  const dx = to.x + to.w / 2 - (from.x + from.w / 2);
  const dy = to.y + to.h / 2 - (from.y + from.h / 2);
  const travel = lungeTravel(LUNGE_BLOCKED, dx, dy);
  return { x: (dx * travel * 100) / from.w, y: (dy * travel * 100) / from.h };
}

function lungedAttackerPoint(duel: Duel, viewer: Side): { x: number; y: number } | null {
  const pending = duel.pending;
  if (!pending || pending.kind !== "face") return null;
  let fromSide: Side = 0;
  let fromIndex = -1;
  for (const side of [0, 1] as const) {
    const index = duel.players[side].field.findIndex((mon) => mon?.uid === pending.attacker);
    if (index >= 0) {
      fromSide = side;
      fromIndex = index;
    }
  }
  if (fromIndex < 0) return null;
  const from = SLOT_BOX[screenSide(fromSide, viewer)][fromIndex];
  const shift = attackShift(duel, pending.attacker, viewer);
  return { x: from.x + from.w / 2 + ((shift?.x ?? 0) * from.w) / 100, y: from.y + from.h / 2 + ((shift?.y ?? 0) * from.h) / 100 };
}

/**
 * A normal attack landing (chủ game 22/10, LoR): on a player, the attacker thrusts to the edge of that player's field
 * row, an electric dome lights where it hits and lightning runs along the edge of the board to the player's HP; on a
 * monster (attacked or blocking), the two cards collide. Hellfire balls and shots keep their own looks.
 */
type Landing =
  | { kind: "face"; uid: string; thrust: { x: number; y: number }; ang: number; at: { x: number; y: number }; dir: -1 | 1; path: Array<[number, number]>; orb: { x: number; y: number } }
  | { kind: "clash"; uid: string; thrust: { x: number; y: number }; at: { x: number; y: number }; target: { x: number; y: number }; ang: number };

const HELL_IDS = new Set(["mat-do-tan-pha", "rong-ac-ma"]);
const BOARD_EDGE = 4;
/** Máy chờ 2 giây trước mỗi việc (chủ game: giữ nhịp này); nó nghĩ trong lúc chờ, tối đa THINK_MS. */
const AI_WAIT = 2000;
const THINK_MS = 1300;

function seatOf(duel: Duel, uid: string): { side: Side; index: number } | null {
  for (const side of [0, 1] as const) {
    const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
    if (index >= 0) return { side, index };
  }
  return null;
}

/** The card a monster on the field shows as: Tê giác bé con grown up is its grown card. */
function formOf(mon: FieldMon) {
  return mon.cardId === "te-giac-be-con" && (mon.level ?? 1) > 1 ? ((mon.level ?? 1) >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang") : mon.cardId;
}

/** The light of a skill by its kind (K2, K4): brighter than the metal of its rim, so it reads as a glow. */
const SKILL_GLOW: Record<string, string> = { active: "#62b8ff", risk: "#ff8f3d", spell: "#ff6bb5", slow: "#ff5a4a", buff: "#2fd072" };

type SkillFacts = { cardId: string; name: string; icon: string; kind: string; slow: boolean; buff?: boolean };
/** The skill a monster is using, as its sheet names it: by its number among the monster's skills ("lash" = Roi điện). */
function skillFacts(mon: FieldMon | null, fallbackId: string | null, skill: number | "lash" | "armor" | null): SkillFacts | null {
  const cardId = mon ? formOf(mon) : fallbackId;
  if (!cardId) return null;
  const card = monsterCard(cardId);
  const book = skillsOf(cardId, card?.skill ?? "");
  const label = skill === "lash" || skill === "armor" ? chipLabel(cardId, skill) : skill !== null ? castName(cardId, skill) : "";
  // A skill the rules name after its monster is the only one it can use.
  const sole = () => {
    const usable = book.filter((row) => row.kind !== "passive" && row.kind !== "note");
    return usable.length === 1 ? usable[0] : undefined;
  };
  const hit = label
    ? bookSkill(cardId, label, card?.skill ?? "") ?? (label.trim().toLowerCase() === card?.name.trim().toLowerCase() ? sole() : undefined)
    : book.find((row) => row.kind === "active" || row.kind === "risk");
  const kind = hit && hit.kind !== "passive" && hit.kind !== "note" ? hit.kind : "active";
  return { cardId, name: hit?.name ?? label, icon: hit?.icon ?? "sparkles", kind, slow: Boolean(hit?.slow), buff: Boolean(hit?.buff) };
}

/** K2 (chủ game 14/11): a monster rouses before its skill goes off: light gathers on its card (ROUSE_CAST ms), it jolts
 *  toward its target, and only then (ROUSE_MS) does the skill's own effect, its sound and its numbers land. */
const ROUSE_MS = 720;
/** Pháo kích (chủ game 23/11): đạn leo lên lưng rùa trong MOUNT_MS rồi chờ trên nòng AIM_HOLD_MS mới bay. */
const MOUNT_MS = 400;
const AIM_HOLD_MS = 1000;
const CANNON_MS = MOUNT_MS + AIM_HOLD_MS;
/** Chủ game 16/11: a monster whose skill is queued lifts off the board and flares (the clip is 2 s long; it lifts as the light builds, drops once it fades). */
const FLARE_MS = 1800;
const ROUSE_CAST = 400;

/** K5: a normal attack that asks first: only a monster whose attack has a condition of its own (chủ game 14/11). */
function attackTerms(mon: FieldMon): string | null {
  if (["khong-lo-mot-mat", "khong-lo-mac-giap", "khong-lo-thu-linh", "tu-than-cua-nhung-la-bai"].includes(mon.cardId) && !mon.horn && !mon.gaze && !mon.bolt) {
    const cost = /Tiêu hao\s*(\d+)\s*mana/i.exec(plainCopy(monsterCard(mon.cardId)?.skill ?? ""))?.[1] ?? "1";
    return `Tiêu hao ${cost} mana để tấn công`;
  }
  // Chủ game 18/11: đòn đánh thường kèm hiệu ứng riêng cũng hỏi xác nhận. Vãy phá giáp trừ thủ mục tiêu trước khi tính sát thương.
  if (mon.cardId === "khung-long-vay-kiem") return `Giảm ${skillLoss(mon.cardId, "def", 2)} thủ của 1 kẻ địch`;
  return null;
}

function attackLanding(prev: Duel, next: Duel, viewer: Side, marks: { youHp: { x: number; y: number }; foeHp: { x: number; y: number } }): Landing | null {
  const pending = prev.pending;
  if (prev.step !== "respond" || !pending || next.pending === pending) return null;
  if (pending.kind !== "face" && pending.kind !== "melee") return null;
  if (pending.kind === "face" && pending.skill) return null;
  const attacker = fieldMon(prev, pending.attacker);
  if (!attacker || attacker.horn || attacker.gaze || attacker.bolt || HELL_IDS.has(attacker.cardId) || seaVeiled(prev, viewer, attacker.uid)) return null;
  const seat = seatOf(prev, attacker.uid);
  if (!seat) return null;
  const foe = (1 - seat.side) as Side;
  const home = SLOT_BOX[screenSide(seat.side, viewer)][seat.index];
  const from = { x: home.x + home.w / 2, y: home.y + home.h / 2 };
  const toward = (point: { x: number; y: number }, travel: number) => ({ x: ((point.x - from.x) * travel * 100) / home.w, y: ((point.y - from.y) * travel * 100) / home.h });
  const blocker = prev.hold?.blocker ?? null;
  const struck = pending.kind === "melee" ? (blocker ?? pending.defender) : blocker;
  if (struck) {
    const where = seatOf(prev, struck);
    const before = fieldMon(prev, struck);
    if (!where || !before) return null;
    const after = fieldMon(next, struck);
    // Gương phòng hộ chặn đòn (chủ game 09/11): không gây sát thương thì không có hiệu ứng đánh trúng; chỉ số kẻ đánh bị cướp
    // nên máu của nó đổi, không phải là trúng đòn trả.
    if (prev.hold?.mirror && after && after.hp === before.hp) return null;
    // Khiên (Z4, chủ game 28/11): đòn bị khiên chặn hết không đổi máu ai, nhưng quái vẫn lao vào và va chạm; khiên vỡ cũng là trúng đòn.
    const hurt = !after || after.hp !== before.hp || fieldMon(next, attacker.uid)?.hp !== attacker.hp || Boolean(before.aegis && !after.aegis);
    if (!hurt) return null;
    const box = SLOT_BOX[screenSide(where.side, viewer)][where.index];
    const target = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const at = { x: from.x + (target.x - from.x) * 0.8, y: from.y + (target.y - from.y) * 0.8 };
    // The way the blow travels on the screen (the board is taller than wide), for the sparks and the speed trail.
    const ang = Math.atan2((target.y - from.y) / boardAspect(), target.x - from.x);
    return { kind: "clash", uid: attacker.uid, thrust: toward(target, 0.76), at, target, ang };
  }
  if (next.players[foe].hp >= prev.players[foe].hp) return null;
  const top = screenSide(foe, viewer) === 1;
  const orb = top ? marks.foeHp : marks.youHp;
  const row = SLOT_BOX[screenSide(foe, viewer)];
  const edgeY = top ? Math.max(...row.map((box) => box.y + box.h)) + 1 : Math.min(...row.map((box) => box.y)) - 1;
  const span = orb.y - from.y;
  if (Math.abs(span) < 1) return null;
  const reach = Math.max(0.2, Math.min(1, (edgeY - from.y) / span));
  const at = { x: from.x + (orb.x - from.x) * reach, y: edgeY };
  const edgeX = orb.x < 50 ? BOARD_EDGE : 100 - BOARD_EDGE;
  const path: Array<[number, number]> = [[at.x, at.y], [edgeX, at.y], [edgeX, orb.y], [orb.x, orb.y]];
  const faceAng = Math.atan2((orb.y - from.y) / boardAspect(), orb.x - from.x);
  // Chủ game 16/11: đòn đánh người chơi tông thẳng vào viên máu (lá lao tới tận viên), nổ ngay tại viên, không còn tia điện dọc mép.
  return { kind: "face", uid: attacker.uid, thrust: toward(orb, 1), ang: faceAng, at: { x: orb.x, y: orb.y }, dir: top ? -1 : 1, path, orb };
}

/** Bề ngang khung video nổ của Kuriboh so với bề ngang một lá (khung nổ ra tới mép ở đỉnh nổ). */
const BOOM_SPAN = 3.2;

/** Kuriboh tự lao vào rồi nổ ngay (chủ game 21/11): đòn không qua hàng chờ nên không có `pending`, kẻ lao và mục tiêu lấy từ `Duel.boom`. */
function boomLanding(prev: Duel, next: Duel, viewer: Side, marks: { youHp: { x: number; y: number }; foeHp: { x: number; y: number } }, wallAt?: (side: Side) => { x: number; y: number }): Landing | null {
  const boom = next.boom;
  if (!boom || boom.id === prev.boom?.id) return null;
  for (const uid of boom.uids) {
    const to = boom.to[uid];
    const attacker = fieldMon(prev, uid);
    const seat = seatOf(prev, uid);
    if (!to || !attacker || !seat || seaVeiled(prev, viewer, uid)) continue;
    const home = SLOT_BOX[screenSide(seat.side, viewer)][seat.index];
    const from = { x: home.x + home.w / 2, y: home.y + home.h / 2 };
    const toward = (point: { x: number; y: number }, travel: number) => ({ x: ((point.x - from.x) * travel * 100) / home.w, y: ((point.y - from.y) * travel * 100) / home.h });
    if (to.startsWith("face:")) {
      const foe = Number(to.slice(5)) as Side;
      const top = screenSide(foe, viewer) === 1;
      const orb = top ? marks.foeHp : marks.youHp;
      return { kind: "face", uid, thrust: toward(orb, 1), ang: Math.atan2((orb.y - from.y) / boardAspect(), orb.x - from.x), at: { x: orb.x, y: orb.y }, dir: top ? -1 : 1, path: [], orb };
    }
    // Pháo kích bắn vào lá tường thành: lao tới lá nằm ngang đó.
    if (to.startsWith("wall:") && wallAt) {
      const target = wallAt(Number(to.slice(5)) as Side);
      return { kind: "clash", uid, thrust: toward(target, 0.9), at: { x: target.x, y: target.y }, target, ang: Math.atan2((target.y - from.y) / boardAspect(), target.x - from.x) };
    }
    const where = seatOf(prev, to);
    if (!where) continue;
    const box = SLOT_BOX[screenSide(where.side, viewer)][where.index];
    const target = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    return { kind: "clash", uid, thrust: toward(target, 0.76), at: { x: from.x + (target.x - from.x) * 0.8, y: from.y + (target.y - from.y) * 0.8 }, target, ang: Math.atan2((target.y - from.y) / boardAspect(), target.x - from.x) };
  }
  return null;
}

const SLOW_SPELLS = new Set(["sam-set-tan-the", "huy-diet", "soi-xich-dia-nguc", "phan-nguyen", "mua-ma-thuat", "thanh-guom-anh-sang", "thu-hoi-quai-thu", "ke-dao-mo", "mu-ma-phap"]);
const SLOW_AIM = new Set(["soi-xich-dia-nguc", "huy-diet", "phan-nguyen"]);
/** Phép có mục tiêu (chủ game 03/11, V8B): the side whose monsters it picks; kéo lá hay bấm Use rồi rê, mục tiêu dùng
 *  được sáng neon như chọn skill. Phản nguyền and Hộp ma thuật pick an ally first, then an enemy. */
const SPELL_AIMS: Record<string, "foe" | "ally"> = {
  "soi-xich-dia-nguc": "foe",
  "huy-diet": "foe",
  "sung-loi-pha": "ally",
  "giap-co-khi": "ally",
  "co-may-thoi-gian": "ally",
  "virus-an-mon": "ally",
  "phuc-kich": "ally",
  "qua-trung-thien-su": "ally",
  [SPRING]: "ally",
  [SPRING_WORN]: "ally",
  "ngan-chan-phong-ngu": "foe",
  "la-chan-phan-don": "foe",
};
/** Phe mục tiêu của lá phép kéo/bấm chọn mục tiêu; lá Trang bị gắn lên quái mình. */
function spellAimOf(id: string): "foe" | "ally" | undefined {
  return SPELL_AIMS[id] ?? (gearCard(id) ? "ally" : undefined);
}
/** Spells that wait as an icon in the middle of the board while their target is picked (chủ game 30/10; Phục kích first,
 *  the others once the owner has seen it). */
const AIM_MARK = new Set(["phuc-kich", "ngan-chan-phong-ngu", "hop-ma-thuat", "qua-trung-thien-su", DUO_CARD, SPRING, SPRING_WORN, WILE_CARDS.gust, WILE_CARDS.charm]);

/** Suối nguồn sinh mệnh (chủ game 25/11): siêu tốc, dùng được ở lượt chính lẫn lúc đáp trong chuỗi; nhắm 1 đồng minh. */
function isSpring(id: string) {
  return id === SPRING || id === SPRING_WORN;
}
function springLive(duel: Duel, viewer: Side) {
  if (springAllies(duel, viewer).length === 0) return false;
  if (duel.step === "respond") return duel.hold?.priority === viewer && !duel.hold?.stage && !slowWaiting(duel) && !doomWaiting(duel);
  return duel.step === "main" && duel.turn === viewer && !duel.upkeep && duel.gemCap !== viewer && duel.gemWarn !== viewer;
}
const QUIET_SPELLS = new Set(["soi-xich-dia-nguc", "vong-nguyen-rua-ac-ma", "sung-loi-pha"]);
const REFLECT_SPELLS = new Set(["guong-phong-ho", "la-chan-phan-don", "phan-nguyen"]);
const DISPEL_SPELLS = new Set(["hap-thu-ma-phap", "mua-ma-thuat", "vong-xoay-bao-ho", "thu-hoi-quai-thu"]);
const BIND_SPELLS = new Set(["soi-xich-dia-nguc", "thanh-guom-anh-sang", "ngan-chan-phong-ngu", "vong-nguyen-rua-ac-ma"]);

function spentSpell(prev: Duel, next: Duel) {
  for (const side of [0, 1] as const) {
    const left = [...next.players[side].hand];
    for (const id of prev.players[side].hand) {
      const index = left.indexOf(id);
      if (index >= 0) left.splice(index, 1);
      else return id;
    }
  }
  return "";
}

function bindBeam(duel: Duel) {
  const pending = duel.pending;
  return pending?.kind === "beam" && fieldMon(duel, pending.caster)?.cardId === "ong-khong-lo";
}

function fieldMon(duel: Duel, uid: string) {
  for (const side of [0, 1] as const) {
    const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
    if (mon) return mon;
  }
  return null;
}

/** Chủ game 16/11: gắn Sừng lôi phá chạy hiệu ứng nhập lá mới (EquipShow). Hiệu ứng cũ lúc gắn (lá phép to giữa sân, tia sét
 *  nhỏ, hai tiếng sét, video hồi máu) chỉ ẨN bằng cờ này, không xoá: đặt false là về như cũ. */
const HORN_EQUIP_SHOW = true;

function hornFx() {
  const fx = spellFxLook("sung-loi-pha");
  if (fx === "none") return null;
  if (fx === "fire" || fx === "gun" || fx === "bolt" || fx === "spark") return fx;
  return "spark";
}

function shotLook(state: Duel, pending: Duel["pending"]) {
  if (!pending) return null;
  if (pending.kind === "face" || pending.kind === "melee") {
    const mon = fieldMon(state, pending.attacker);
    if (mon?.horn) return hornFx();
    if (mon?.gaze) return null;
    if (pending.kind === "face" && pending.skill) {
      if (!mon) return null;
      const index = mon.cardId === "may-quay-thuong" ? 1 : 0;
      return skillLook(mon.cardId, index);
    }
    return null;
  }
  if (pending.kind !== "beam" && pending.kind !== "gnaw-skill") return null;
  const mon = fieldMon(state, pending.caster);
  if (!mon) return null;
  if (pending.kind === "beam" && pending.back && mon.horn) return hornFx();
  const own = skillLook(mon.cardId, pending.index);
  if (own) return own;
  return null;
}

function aimPoint(state: Duel, pending: Duel["pending"], viewer: Side): { x: number; y: number } | null {
  if (!pending) return null;
  const uid = pending.kind === "melee" || pending.kind === "gnaw"
    ? pending.defender
    : pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell"
      ? pending.target
      : "";
  if (uid) {
    for (const side of [0, 1] as const) {
      const index = state.players[side].field.findIndex((mon) => mon?.uid === uid);
      if (index >= 0) return SLOT_POS[screenSide(side, viewer)][index] ?? null;
    }
  }
  if (pending.kind === "face" || (pending.kind === "beam" && !pending.target)) {
    const from = pending.kind === "face" ? pending.attacker : pending.caster;
    let fromSide: Side = state.turn;
    for (const side of [0, 1] as const) {
      if (state.players[side].field.some((mon) => mon?.uid === from)) fromSide = side;
    }
    const box = HP_BOX[screenSide((1 - fromSide) as Side, viewer)];
    return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }
  return null;
}

type LaserDrop = { key: string; from: number; to: number; x: number; y: number; spot: "self" | "target" };

function gazeShot(prev: Duel) {
  const pending = prev.pending;
  if (!pending || (pending.kind !== "melee" && pending.kind !== "face")) return null;
  const mon = fieldMon(prev, pending.attacker);
  if (!mon?.gaze || mon.horn) return null;
  return pending;
}

function laserDrops(prev: Duel, next: Duel, viewer: Side): LaserDrop[] {
  const gaze = gazeShot(prev);
  if (!gaze || next.pending) return [];
  const owner: Side = prev.players[0].field.some((mon) => mon?.uid === gaze.attacker) ? 0 : 1;
  const drops: LaserDrop[] = [];
  const said = next.fx !== prev.fx ? next.live : "";
  if (gaze.kind === "face") {
    const side = (1 - owner) as Side;
    const from = prev.players[side].hp;
    const to = next.players[side].hp;
    if (to < from) {
      const box = HP_BOX[screenSide(side, viewer)];
      drops.push({ key: `face:${side}`, from, to, x: box.x + box.w / 2, y: box.y + box.h / 2, spot: side === viewer ? "self" : "target" });
    }
  }
  for (const side of [0, 1] as const) {
    for (let index = 0; index < prev.players[side].field.length; index += 1) {
      const was = prev.players[side].field[index];
      const now = next.players[side].field[index];
      if (!was || was.uid === gaze.attacker) continue;
      if (now && now.uid !== was.uid) continue;
      const stayed = now && now.uid === was.uid ? now : null;
      const to = stayed ? stayed.hp : 0;
      if (to >= was.hp) continue;
      if (!stayed && /hiến tế|Thu hồi quái/.test(said)) continue;
      const point = SLOT_POS[screenSide(side, viewer)][index];
      if (!point) continue;
      drops.push({ key: `mon:${was.uid}`, from: was.hp, to, x: point.x, y: point.y, spot: side === viewer ? "self" : "target" });
    }
  }
  return drops;
}

function slotPoint(state: Duel, uid: string, viewer: Side) {
  for (const side of [0, 1] as const) {
    const index = state.players[side].field.findIndex((mon) => mon?.uid === uid);
    if (index >= 0) return SLOT_POS[screenSide(side, viewer)][index] ?? null;
  }
  return null;
}

function laserTicks(drop: LaserDrop): Floater[] {
  const n = drop.from - drop.to;
  if (n <= 0) return [];
  const step = LASER_MS / n / 1000;
  const out: Floater[] = [];
  for (let i = 1; i <= n; i += 1) out.push({ id: floaterSeq++, x: drop.x, y: drop.y, text: "-1", heal: false, spot: drop.spot, delay: i * step });
  return out;
}

function splashMarkPoint(state: Duel, id: string, viewer: Side, falls: Fall[]): { x: number; y: number } | null {
  if (id.startsWith("face:")) {
    const side = Number(id.slice(5));
    if (side !== 0 && side !== 1) return null;
    const box = HP_BOX[screenSide(side as Side, viewer)];
    return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }
  for (const side of [0, 1] as const) {
    const index = state.players[side].field.findIndex((mon) => mon?.uid === id);
    if (index >= 0) return SLOT_POS[screenSide(side, viewer)][index] ?? null;
  }
  const fall = falls.find((row) => row.mon.uid === id);
  return fall ? { x: fall.floater.x, y: fall.floater.y } : null;
}


const ANSWER_SPELLS = new Set([
  "bay-thu",
  "guong-phong-ho",
  "la-chan-phan-don",
  "vong-xoay-bao-ho",
  "phuc-kich",
  "vong-nguyen-rua-ac-ma",
  "hoan-doi",
  "hap-thu-ma-phap",
  "ngan-chan-phong-ngu",
  "virus-an-mon",
  "co-may-thoi-gian",
  "giap-co-khi",
  "phan-nguyen",
  "hop-ma-thuat",
  "qua-trung-thien-su",
  DUO_CARD,
  WILE_CARDS.armor,
  WILE_CARDS.lash,
  REVIVE_CARD,
  PRISM_CARD,
]);

function hornPending(duel: Duel): boolean {
  const pending = duel.pending;
  if (!pending || (pending.kind !== "face" && pending.kind !== "melee")) return false;
  return Boolean(fieldMon(duel, pending.attacker)?.horn || fieldMon(duel, pending.attacker)?.gaze);
}

// Answer spells that guard against an attack, skill or spell: only the side it lands on may use them.
const GUARD_SPELLS = new Set([
  "guong-phong-ho",
  "la-chan-phan-don",
  "vong-xoay-bao-ho",
  "phuc-kich",
  "vong-nguyen-rua-ac-ma",
  "hoan-doi",
  "hap-thu-ma-phap",
  "hop-ma-thuat",
]);

function spellCanAnswer(id: string, duel: Duel): boolean {
  if (duel.step !== "respond" || !ANSWER_SPELLS.has(id)) return false;
  // Hấp thụ ma pháp nuốt phép nhanh và skill dạng phép vừa đáp trong chuỗi (chủ game 04/11).
  if (id === "hap-thu-ma-phap" && duel.hold && eatFor(duel, duel.hold.priority)) return true;
  // A slow skill waiting in the chain is broken only by Hấp thụ ma pháp for now (chủ game 30/10).
  // Huỷ diệt chỉ Hấp thụ ma pháp hoá giải được (chủ game 20/11).
  if (doomWaiting(duel)) return id === "hap-thu-ma-phap";
  if (id === TRAP_CARD) return duel.hold ? trapPicks(duel, duel.hold.priority).length > 0 : false;
  // Song sát: tự phát động, chờ trong chuỗi như Phục kích (chủ game 25/11).
  if (id === DUO_CARD) return duel.hold?.priority !== undefined && duoReady(duel, duel.hold.priority);
  // Lá phép Harpie Lady và Hồi sinh quái thú (chủ game 26/11): chờ trong chuỗi như Bẫy thú.
  if (id === WILE_CARDS.armor || id === WILE_CARDS.lash) return duel.hold?.priority !== undefined && wileReady(duel, duel.hold.priority, id);
  if (id === REVIVE_CARD) return duel.hold?.priority !== undefined && reviveReady(duel, duel.hold.priority);
  // Kính vạn hoa (chủ game 26/11): siêu tốc, dùng được trong chuỗi khi còn quái sao chép được hoặc Harpie Lady trong bộ.
  if (id === PRISM_CARD) return duel.hold?.priority !== undefined && prismPicks(duel, duel.hold.priority).length > 0;
  if (slowWaiting(duel)) return id === "hap-thu-ma-phap" || (id === "hop-ma-thuat" && duel.hold?.priority !== undefined && boxAllies(duel, duel.hold.priority).length > 0);
  // Quả trứng thiên sứ (chủ game 21/11): an enemy monster's attack or damaging skill aimed at a monster of yours.
  if (id === "qua-trung-thien-su") return duel.hold?.priority !== undefined && eggAim(duel, duel.hold.priority) !== null;
  if (GUARD_SPELLS.has(id) && (duel.hold?.priority === undefined || answerSide(duel) !== duel.hold.priority)) return false;
  const pending = duel.pending;
  const horn = hornPending(duel);
  const attacked = (pending?.kind === "face" || pending?.kind === "melee") && !horn;
  const skilled = pending?.kind === "beam" || pending?.kind === "gnaw-skill" || horn;
  if (id === "vong-xoay-bao-ho" || id === "guong-phong-ho") return attacked;
  if (id === "la-chan-phan-don") return skilled && !bindBeam(duel);
  if (id === "hap-thu-ma-phap") {
    // Roi sấm đã nạp trên đòn đánh: luật cũng cho nuốt (duel.ts chargedWhip), nên nút phải dùng được (chủ game 03/11, V3).
    const whipped = (pending?.kind === "melee" || pending?.kind === "face") && [0, 1].some((side) => duel.players[side].field.some((unit) => unit?.uid === pending.attacker && unit.bolt));
    return pending?.kind === "spell" || pending?.kind === "lash" || whipped;
  }
  // Phản nguyền turns a bite of Virus ăn mòn that waits on its owner back (chủ game 30/10).
  if (id === "phan-nguyen") return pending?.kind === "spell" && Boolean(pending.corrode);
  // Only the attacking side may use it, to stop a foe from blocking (owner, 21/10).
  if (id === "ngan-chan-phong-ngu") return duel.hold?.priority === duel.turn && shelterPicks(duel).length > 0;
  if (id === "vong-nguyen-rua-ac-ma") {
    if (pending?.kind === "face" || pending?.kind === "melee") return true;
    if (pending?.kind === "beam" || pending?.kind === "gnaw-skill") {
      const caster = fieldMon(duel, pending.caster);
      return Boolean(caster && harmSkill(caster.cardId, pending.index));
    }
    return false;
  }
  // Chủ game 29/10: Phục kích stops a damaging skill aimed at you, not a plain attack.
  if (id === "phuc-kich") {
    if (pending?.kind === "beam" || pending?.kind === "gnaw-skill") {
      const caster = fieldMon(duel, pending.caster);
      return !("back" in pending && pending.back) && Boolean(caster && harmSkill(caster.cardId, pending.index));
    }
    return (pending?.kind === "face" && Boolean(pending.skill)) || (pending?.kind === "melee" && Boolean(fieldMon(duel, pending.attacker)?.horn));
  }
  if (id === "hoan-doi") return attacked || skilled || pending?.kind === "face";
  // Hộp ma thuật (chủ game 02/11): an ally struck by the other side's skill, one aim or a branch of several.
  if (id === "hop-ma-thuat") return duel.hold?.priority !== undefined && boxAllies(duel, duel.hold.priority).length > 0;
  if (id === "co-may-thoi-gian") {
    const side = duel.hold?.priority;
    const uid = aimedUid(duel);
    if (side === undefined || !uid) return false;
    const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
    return Boolean(mon && (duel.past?.[mon.uid] ?? duel.born?.[mon.uid]));
  }
  if (id === "giap-co-khi") {
    const side = duel.hold?.priority;
    const shot = duel.pending;
    if (side === undefined || shot?.kind !== "beam" || !shot.target || shot.back) return false;
    const ally = duel.players[side].field.find((unit) => unit?.uid === shot.target);
    const caster = fieldMon(duel, shot.caster);
    if (!ally || !caster) return false;
    const casterSide = duel.players[0].field.some((unit) => unit?.uid === caster.uid) ? 0 : 1;
    return casterSide !== side;
  }
  if (id === "virus-an-mon") {
    const side = duel.hold?.priority;
    return side !== undefined && virusTargets(duel, side).length > 0;
  }
  return false;
}

function foeAlive(duel: Duel, viewer: Side) {
  return duel.players[viewer === 0 ? 1 : 0].field.some((mon) => mon && mon.hp > 0);
}

function tollOk(gems: number, tolled: boolean, orb: number, flask: number) {
  if (!tolled) return orb >= gems;
  if (gems >= 3) return orb >= gems && flask >= 1;
  return orb >= gems + 1;
}

function slowUsable(id: string, duel: Duel, viewer: Side) {
  const you = duel.players[viewer];
  if (you.orb < (spellCard(id)?.gems ?? 0)) return false;
  // Sừng lôi phá only in the round its side holds the sword (chủ game 29/10).
  if (isSpring(id)) return duel.step === "main" && springLive(duel, viewer);
  if (id === "sung-loi-pha") return attackRound(duel) === viewer && you.field.some((mon) => mon && hornFit(mon.cardId));
  if (id === "ke-dao-mo") return canTargetFoe(duel) && digChoices(duel, viewer).length > 0;
  // Đòn cuối cùng (chủ game 20/11): ngay lúc quyền về sau khi quái mình bị quái địch hạ.
  if (id === RITE_CARD) return riteDeadFor(duel, viewer).length > 0;
  // Bẫy thú (chủ game 20/11): ngay lúc quyền về sau khi quái địch máu dưới 4 vừa triệu hồi.
  if (id === TRAP_CARD) return trapPicks(duel, viewer).length > 0;
  if (id === DUO_CARD) return duoReady(duel, viewer);
  if (isWileCard(id)) return wileReady(duel, viewer, id);
  if (id === REVIVE_CARD) return reviveReady(duel, viewer);
  if (id === PRISM_CARD) return prismPicks(duel, viewer).length > 0;
  if (!SLOW_SPELLS.has(id)) return false;
  const open = canTargetFoe(duel);
  const foes = foeAlive(duel, viewer);
  if (id === "soi-xich-dia-nguc" || id === "thanh-guom-anh-sang" || id === "huy-diet") return open && foes;
  if (id === "sam-set-tan-the") return open && foes;
  if (id === "phan-nguyen") return open && foes && you.field.some((mon) => mon && harmShift(mon));
  if (id === "mu-ma-phap") return you.field.some((mon) => mon && mon.cardId !== "mu");
  return true;
}

function answerPayoff(id: string, duel: Duel, viewer: Side) {
  if (id === "phuc-kich") {
    return duel.players[viewer].field.some((unit) => unit && unit.stun === 0 && (unit.chain ?? 0) === 0 && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai");
  }
  if (id === "la-chan-phan-don" || id === "ngan-chan-phong-ngu" || id === "hop-ma-thuat") return foeAlive(duel, viewer);
  return true;
}

// An answer spell flashes only when its Use button can be pressed.
function answerUsable(id: string, duel: Duel, viewer: Side, index: number) {
  const you = duel.players[viewer];
  const card = spellCard(id);
  if (card && isSpring(id)) return duel.step === "respond" && springLive(duel, viewer) && tollOk(card.gems, Boolean(you.tolls?.[index]), you.orb, you.flask);
  if (!card || duel.hold?.priority !== viewer || !spellCanAnswer(id, duel)) return false;
  if (!tollOk(card.gems, Boolean(you.tolls?.[index]), you.orb, you.flask)) return false;
  if (!answerPayoff(id, duel, viewer)) return false;
  return id !== "hoan-doi" || canCastSwap(duel, viewer);
}

function spellDragLive(id: string, duel: Duel, viewer: Side, index = -1) {
  const you = duel.players[viewer];
  const card = spellCard(id);
  const tolled = index >= 0 && Boolean(you.tolls?.[index]);
  if (!card || !tollOk(card.gems, tolled, you.orb, you.flask)) return false;
  if (isSpring(id)) return springLive(duel, viewer);
  if (ANSWER_SPELLS.has(id) && ((id !== "phan-nguyen" && id !== TRAP_CARD && id !== REVIVE_CARD && id !== PRISM_CARD) || duel.step === "respond")) {
    if (duel.step !== "respond" || duel.hold?.priority !== viewer) return false;
    if (!spellCanAnswer(id, duel) || !answerPayoff(id, duel, viewer)) return false;
    if (id === "hoan-doi") return canCastSwap(duel, viewer);
    return true;
  }
  if (duel.step !== "main" || duel.turn !== viewer || duel.upkeep || duel.gemCap === viewer || duel.gemWarn === viewer) return false;
  if (spellCard(id)?.env) return true;
  return slowUsable(id, duel, viewer);
}

function aimedUid(duel: Duel): string | null {
  const pending = duel.pending;
  if (!pending) return null;
  if (pending.kind === "melee") return duel.hold?.blocker ?? pending.defender;
  if (pending.kind === "gnaw") return pending.defender;
  if (pending.kind === "gnaw-skill") return pending.target;
  if (pending.kind === "beam" || pending.kind === "spell") return pending.target;
  return null;
}

function mysticAlert(duel: Duel, mon: FieldMon, viewer: Side): boolean {
  if (mon.cardId !== "hiep-si-huyen-bi" || mon.dim || mon.hp <= 0) return false;
  if (canGuardCover(duel, mon.uid)) return true;
  if (duel.step !== "main" || duel.turn !== viewer || duel.parley || duel.winner) return false;
  if (mon.stun > 0 || (mon.chain ?? 0) > 0 || (mon.path ?? 0) > 0) return false;
  if (duel.players[viewer].orb < 2) return false;
  return duel.players[(1 - viewer) as Side].field.some((unit) => unit && unit.hp > 0 && unit.cardId !== "mu");
}

/** Mỹ điểu nhân and Nữ chúa điểu nhân answer from the board, as other reaction skills do: the bird the skill, spell
 *  or swing is aimed at flashes, and tapping it shows Giáp và Vuốt or Roi điện. */
function harpyAlert(duel: Duel, mon: FieldMon, viewer: Side): boolean {
  const offer = harpyOffer(duel, viewer);
  const pending = duel.pending;
  if (!offer || !pending) return false;
  if (pending.kind === "melee") return (duel.hold?.blocker ?? pending.defender) === mon.uid;
  return (pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") && pending.target === mon.uid;
}

/** Glow colour of a monster's reaction skill: the rim colour of that skill (reaction skills are mostly the pink spell kind). */
const SKILL_TONES: Record<string, string> = { active: "#2f9cf0", passive: "#a56cf0", risk: "#e8352c", spell: "#ff4fa6", note: "#e8c14a" };
function reactTone(_cardId: string): string {
  // Chủ game 14/11: mọi quái phản ứng chớp hồng (cả Thế thân, Khiên thú sĩ).
  return SKILL_TONES.spell;
}

function monsterAlert(duel: Duel, mon: FieldMon, viewer: Side): boolean {
  if (canStand(duel, mon.uid)) return true;
  if (harpyAlert(duel, mon, viewer)) return true;
  if (duel.step !== "respond" || duel.hold?.priority !== viewer || mon.dim || cannotAct(mon)) return false;
  const pending = duel.pending;
  if (mon.cardId === "chien-si-gam-nham" && pending?.kind === "face") return true;
  if (mon.cardId === "yeu-tinh-chuc-phuc" && (pending?.kind === "face" || pending?.kind === "melee")) return true;
  if (mon.cardId === "linh-chien-da-khong-lo" && canWall(duel, mon.uid)) return true;
  // Điều động của Hiệp sĩ hộ vệ (chủ game 27/11): chớp hồng khi quái của mình bị đòn tấn công nhắm.
  if (mon.cardId === "hiep-si-ho-ve" && canDispatch(duel, mon.uid)) return true;
  if (canSpirit(duel, mon.uid)) return true;
  if (mon.cardId === "ky-si-bong-toi" && !(mon.path ?? 0) && pending?.kind === "melee" && pending.defender === mon.uid && !mon.clash) return true;
  return false;
}

function reserveLive(held: { id: string; hp: number; fake?: boolean; saved?: { level?: number; atk: number; def: number; mdef: number } }, card: MonsterCard) {
  const shown = held.fake ? fakeMonsterCard(card) : card;
  return {
    name: held.saved ? fieldName({ cardId: held.id, level: held.saved.level } as FieldMon) : card.name,
    atk: held.saved?.atk ?? shown.atk,
    def: held.saved?.def ?? shown.def,
    mdef: held.saved?.mdef ?? shown.mdef,
    hp: held.hp,
  };
}

/** A fake card's stat that is below the real card's is shown in red (chủ game 22/10); health by its top value. */
function fakeCut(mon: FieldMon, key: "atk" | "def" | "mdef" | "hp", value: number): boolean {
  if (!mon.fake) return false;
  const real = monsterCard(mon.cardId);
  return Boolean(real && (key === "hp" ? (mon.maxHp || value) : value) < real[key]);
}

/** Đã mệt (hành động rồi), trừ quái Tháo vát còn lượt hành động thứ hai. */
function tired(mon: FieldMon) {
  return mon.dim && !knackOpen(mon);
}

function gnawBoosted(prev: Duel, next: Duel) {
  for (const side of [0, 1] as const) {
    for (const mon of next.players[side].field) {
      if (!mon || mon.cardId !== "chien-si-gam-nham") continue;
      const was = prev.players[side].field.find((unit) => unit?.uid === mon.uid);
      if (was && (mon.def > was.def || mon.maxHp > was.maxHp)) return true;
    }
  }
  return false;
}

function fallenMon(prev: Duel | null, next: Duel, side: Side, index: number): FieldMon | null {
  if (!prev || prev === next) return null;
  if (prev.fx === next.fx && prev.pending === next.pending) return null;
  if (next.fx !== prev.fx && /Thu hồi quái/.test(next.live)) return null;
  const was = prev.players[side].field[index];
  const now = next.players[side].field[index];
  return was && !now ? was : null;
}

function killWait(prev: Duel, next: Duel, look: string | null, spellCard = false): number {
  const said = next.fx !== prev.fx ? next.live : "";
  if (/Thu hồi quái/.test(said)) return -1;
  if (/trúng độc|chết vì độc|bị bào mòn|chết vì bào mòn|Virus ăn mòn/.test(said)) return 0;
  if (spellCard && look === "spell") return 200;
  if (look === "fire" || look === "spell" || look === "gun" || look === "bolt" || look === "spark") return 400;
  if (look === "tide-small" || look === "tide-mid" || look === "tide-big") return 200;
  const swing = next.tone === "hit" || prev.pending?.kind === "melee" || prev.pending?.kind === "gnaw" || prev.pending?.kind === "face";
  return swing && next.fx !== prev.fx ? 600 : 0;
}
function showEffects(prev: Duel, next: Duel, viewer: Side, marks: { youHp: { x: number; y: number }; foeHp: { x: number; y: number } }) {
  if (prev.fx === next.fx && prev.pending === next.pending) return null;
  const floaters: Floater[] = [];
  const falls: Fall[] = [];
  const pops: string[] = [];
  const lunges: string[] = [];
  const hits: string[] = [];
  const riderSkill = next.skill?.id === "ky-si-cuoi-rong" && next.skill.hits && next.skill.vols && next.skill.hits.length === next.skill.vols.length ? next.skill : null;
  const riderIds = new Set(riderSkill?.hits ?? []);
  const bomb = next.skill?.id === "may-nem-bom-hinh-nhen" ? next.skill : null;
  const bombHits = bomb?.hits ?? [];
  const bombVols = bomb?.vols ?? [];
  const bombOn = Boolean(bomb && bombHits.length > 0 && bombHits.length === bombVols.length);
  const dan = next.skill?.id === "ma-dao-si" ? next.skill : null;
  const danHits = dan?.hits ?? [];
  const danVols = dan?.vols ?? [];
  const danOn = Boolean(dan && danVols.length > 1 && danHits.length === danVols.length);
  const bombSpot = (id: string): { x: number; y: number; spot: "self" | "target" } | null => {
    if (id.startsWith("face:")) {
      const side = Number(id.slice(5));
      if (side !== 0 && side !== 1) return null;
      const mark = side === viewer ? marks.youHp : marks.foeHp;
      return { x: mark.x, y: mark.y, spot: side === viewer ? "self" : "target" };
    }
    for (const side of [0, 1] as const) {
      const index = prev.players[side].field.findIndex((mon) => mon?.uid === id);
      if (index < 0) continue;
      const spot = SLOT_POS[screenSide(side, viewer)][index];
      if (!spot) return null;
      return { x: spot.x, y: spot.y, spot: side === viewer ? "self" : "target" };
    }
    return null;
  };
  const lasers = laserDrops(prev, next, viewer);
  const laserOf = (key: string) => lasers.find((drop) => drop.key === key);
  for (const side of [0, 1] as const) {
    const before = prev.players[side];
    const after = next.players[side];
    const where = side === viewer ? "self" : "target";
    if (after.hp !== before.hp) {
      const mark = side === viewer ? marks.youHp : marks.foeHp;
      const delta = after.hp - before.hp;
      const beam = delta < 0 ? laserOf(`face:${side}`) : undefined;
      if (beam) floaters.push(...laserTicks(beam));
      else if (!(bombOn && bombHits.includes(`face:${side}`)) && !(danOn && danHits.includes(`face:${side}`))) {
        floaters.push({ id: floaterSeq++, x: mark.x, y: mark.y, text: `${delta > 0 ? "+" : ""}${delta}`, heal: delta > 0, spot: where });
      }
    }
    for (let index = 0; index < FIELD_SLOTS; index += 1) {
      const was = before.field[index];
      const now = after.field[index];
      const spot = SLOT_POS[screenSide(side, viewer)][index];
      if (!was && now && !now.lurk) pops.push(`${side}-${index}`);
      if (was && now && now.uid === was.uid && now.hp !== was.hp) {
        const delta = now.hp - was.hp;
        const beam = delta < 0 ? laserOf(`mon:${was.uid}`) : undefined;
        const rose = was.cardId === "ky-si-bong-toi" && now.cardId === "chien-binh-huyen-thoai";
        if (beam) floaters.push(...laserTicks(beam));
        else if (!(rose && delta < 0) && !(bombOn && bombHits.includes(was.uid)) && !(danOn && danHits.includes(was.uid)) && !riderIds.has(was.uid)) {
          // grow: the rise came with a max-HP rise (tăng máu tối đa), which keeps its old ring.
          floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `${delta > 0 ? "+" : ""}${delta}`, heal: delta > 0, spot: where, grow: now.maxHp > was.maxHp, mend: delta - Math.max(0, now.maxHp - was.maxHp) });
          if (delta < 0 && !(next.skill && skillLook(next.skill.id, next.skill.index))) hits.push(now.uid);
        }
      }
      const mendN = was && now && now.uid === was.uid ? (next.mends ?? []).find((row) => row.uid === now.uid)?.n ?? 0 : 0;
      if (mendN > 0 && was && now && now.hp - was.hp !== mendN) {
        // The mend's own video is played by the loop over duel.mends; no second one here.
        floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `+${mendN}`, heal: true, spot: where, hush: true });
      }
      const rain = /Mưa ma thuật hồi (\d+)/.exec(next.live);
      if (was && now && now.uid === was.uid && rain && harmShift(was) && !harmShift(now) && now.hp === was.hp) {
        floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `+${rain[1]}`, heal: true, spot: where });
      }
      if (was && now && now.uid === was.uid) {
        const stance =
          now.cardId === "rong-boc-trung" && now.stance !== was.stance ? (now.stance === "attack" ? skillFigure(now.cardId, "atk", 4) : skillFigure(now.cardId, "guard", 2)) : 0;
        const gain = Math.max(
          0,
          now.atk - was.atk,
          now.def - was.def,
          now.mdef - was.mdef,
          (now.blessAtk ?? 0) - (was.blessAtk ?? 0),
          (now.kGuard?.def ?? 0) - (was.kGuard?.def ?? 0),
          (now.kGuard?.mdef ?? 0) - (was.kGuard?.mdef ?? 0),
          (now.clash?.atk ?? 0) - (was.clash?.atk ?? 0),
          (now.clash?.def ?? 0) - (was.clash?.def ?? 0),
          stance,
        );
        if (gain > 0) floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `+${gain}`, heal: true, spot: where, buff: true });
      }
      if (was && now && now.uid === was.uid && (now.chain ?? 0) > (was.chain ?? 0)) hits.push(now.uid);
      if (was && !now && !(next.fx !== prev.fx && /Thu hồi quái/.test(next.live))) {
        const said = next.fx !== prev.fx ? next.live : "";
        const beam = laserOf(`mon:${was.uid}`);
        const clockKill = next.fx !== prev.fx && side !== next.turn && /cường hoá và tiêu diệt|quét cả sân/.test(next.live);
        if (beam) floaters.push(...laserTicks(beam));
        else if (was.hp > 0 && !/hiến tế/.test(said) && !(bombOn && bombHits.includes(was.uid)) && !(danOn && danHits.includes(was.uid)) && !riderIds.has(was.uid)) {
          floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `-${was.hp}`, heal: false, spot: where, delay: clockKill ? 1 : undefined });
        }
        const floater: Floater = { id: floaterSeq++, x: spot.x, y: spot.y, text: "Hạ", heal: false, spot: where };
        falls.push({ floater, side, index, mon: was, hold: clockKill ? 1000 : riderIds.has(was.uid) ? 1120 : 0, laser: Boolean(beam) });
      }
      if (was && now && now.uid === was.uid && !was.dim && now.dim && !now.horn && !now.gaze && !was.horn && !was.gaze) {
        const cast = next.skill?.id === now.cardId ? skillLook(next.skill.id, next.skill.index) : null;
        if (!cast) lunges.push(now.uid);
      }
    }
  }
  if (bombOn) {
    bombHits.forEach((id, index) => {
      const n = bombVols[index] ?? 0;
      if (n <= 0) return;
      const point = bombSpot(id);
      if (!point) return;
      floaters.push({ id: floaterSeq++, x: point.x, y: point.y, text: `-${n}`, heal: false, spot: point.spot, delay: index * 0.18 });
    });
  }
  if (danOn) {
    danHits.forEach((id, index) => {
      const n = danVols[index] ?? 0;
      if (n <= 0) return;
      const point = bombSpot(id);
      if (!point) return;
      floaters.push({ id: floaterSeq++, x: point.x, y: point.y, text: `-${n}`, heal: false, spot: point.spot, delay: index * 0.42 });
    });
  }
  if (next.pending?.kind === "face" && prev.pending?.kind !== "face" && !fieldMon(next, next.pending.attacker)?.horn && !fieldMon(next, next.pending.attacker)?.gaze) lunges.push(next.pending.attacker);
  if (next.pending?.kind === "melee" && prev.pending?.kind !== "melee" && !fieldMon(next, next.pending.attacker)?.horn && !fieldMon(next, next.pending.attacker)?.gaze) lunges.push(next.pending.attacker);
  const burst =
    next.fx !== prev.fx && (next.tone === "spell" || next.tone === "heal")
      ? { id: next.fx, tone: next.tone as Burst["tone"], text: next.live.replace(/^\d+\.\s*/, "").slice(0, 84) }
      : null;
  const shake = next.tone === "hit" && next.fx !== prev.fx;
  if (riderSkill?.hits && riderSkill.vols) {
    const beats = riderSkill.hits;
    beats.forEach((id, index) => {
      const n = riderSkill.vols?.[index] ?? 0;
      if (n <= 0) return;
      const point = bombSpot(id);
      if (!point) return;
      floaters.push({ id: floaterSeq++, x: point.x, y: point.y, text: `-${n}`, heal: false, spot: point.spot, delay: beats[index + 1] === id ? 0 : 1.12 });
    });
  }
  if (!shake && !burst && floaters.length === 0 && falls.length === 0 && pops.length === 0 && lunges.length === 0) return null;
  return { shake, floaters, falls, burst, motion: { pops, lunges, hits } satisfies Motion };
}

function fieldLook(mon: FieldMon, stars: number): { name: string; text: string; hot?: string } {
  const name = fieldName(mon);
  if (isHexer(mon.cardId)) return { name, text: "Gây ", hot: `${2 + hexBonus(mon.cardId) + stars + (mon.skillUp ?? 0)} sát thương` };
  if (mon.cardId === "mo-voi-ma-mut") return { name, text: "Hy sinh, gây ", hot: `${mon.hp} sát thương phép` };
  if (mon.cardId === "ga-he-dang-so" && mon.charge >= 2) {
    const amount = skillFigure("ga-he-dang-so", "dmg", 5) + skillFigure("ga-he-dang-so", "dmg", 4, 1) * Math.floor((mon.charge - 2) / 2);
    return { name, text: "Gây ", hot: `${amount} sát thương` };
  }
  if (mon.cardId === "te-giac-be-con" && (mon.level ?? 1) > 1) {
    const form = (mon.level ?? 1) >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang";
    return { name, text: monsterCard(form)?.skill ?? "" };
  }
  return { name, text: monsterCard(mon.cardId)?.skill ?? "" };
}

function innateText(id: string, skill: string): string | null {
  if (id === "tho-den-tinh-nghich" || id === "quai-thu-thien-su") return skill;
  return null;
}

function activeText(id: string, skill: string): string | null {
  if (id === "tho-den-tinh-nghich" || id === "quai-thu-thien-su") return null;
  return skill.trim() ? skill : null;
}

function tideCost(index: 0 | 1) {
  const text = monsterCard("trai-tim-hai-long")?.skill ?? "";
  const found = [...text.matchAll(/thêm\s*(\d+)\s*mana/gi)].map((hit) => Number(hit[1]));
  return found[index] ?? (index === 0 ? 1 : 2);
}

function allySkill(id: string) {
  return id === "yeu-tinh-chuc-phuc" || id === "thien-than-be-nho";
}

function witchAllyMark(duel: Duel, casterUid: string, mon: FieldMon) {
  if (mon.uid === casterUid || mon.hp <= 0) return false;
  return !chronoHighAlly(duel, casterUid, mon.uid);
}

function chronoImmortal(mon: FieldMon) {
  return mon.cardId === "rong-con" || mon.cardId === "rong-ngan-tuoi";
}

function chronoSpecial(mon: FieldMon) {
  return mon.cardId === "te-giac-hieu-thang" || (mon.cardId === "te-giac-be-con" && (mon.level ?? 1) < 3);
}

function shotSkill(id: string) {
  return id !== "mo-voi-ma-mut" && id !== "yeu-tinh-chuc-phuc";
}

function damageShot(cardId: string, index: number) {
  return harmSkill(cardId, index);
}

function faceSkill(id: string, index: number) {
  return id === CATAPULT || isHexer(id) || id === "mat-do-tan-pha" || id === "may-nem-bom-hinh-nhen" || id === "ma-dao-si" || id === "rong-ac-ma" || id === "rong-con" || id === "rong-ngan-tuoi" || id === "sua-hut-ma-phap" || id === "con-thinh-no-cua-hai-vuong" || (id === "rong-phun-hoa-cau" && index === 1) || (id === "ga-he-dang-so" && index === 1) || (id === "may-quay-thuong" && index === 1);
}

function skillChoices(text: string): string[] {
  const numbered = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line) && !/^0\./.test(line));
  return numbered.length > 0 ? numbered : [text.trim()];
}

function wantsTarget(text: string): boolean {
  if (/tất cả|đồng minh|dự bị|nhân bản|thăng cấp|tích luỹ/i.test(text)) return false;
  return /kẻ địch|đối phương|đối thủ|tê liệt|quái|sát thương/i.test(text);
}

const REEL_ORDER: ReelFace[] = ["seven", "atk", "def", "hp", "six"];

function reelResultCue(faces: ReelFace[]) {
  const counts = new Map<ReelFace, number>();
  for (const face of faces) counts.set(face, (counts.get(face) ?? 0) + 1);
  let best: { face: ReelFace; n: number } | null = null;
  for (const [face, n] of counts) {
    if (n < 2) continue;
    if (!best || n > best.n) best = { face, n };
  }
  if (!best) return null;
  if (best.face === "six") return "reelSix" as const;
  if (best.face === "seven") return "reelSeven" as const;
  return best.n >= 3 ? ("reelTriple" as const) : ("reelPair" as const);
}

type SpinFace = ReelFace | "phys" | "spell" | "tru" | "blank";

function ReelGlyph({ face }: { face: SpinFace | null }) {
  if (face === "phys") return <img className="is-gun" src="/art/gun-phys.png?v=1" alt="Súng vật lý" draggable={false} />;
  if (face === "spell") return <img className="is-gun" src="/art/gun-spell.png?v=1" alt="Súng phép" draggable={false} />;
  if (face === "tru") return <img className="is-gun" src="/art/gun-tru.png?v=1" alt="Súng chuẩn" draggable={false} />;
  if (face === "blank") return null;
  if (face === "atk") return <img src="/art/reel-kiem.png?v=3" alt="Công" draggable={false} />;
  if (face === "hp") return <img src="/art/reel-tim.png?v=3" alt="Máu" draggable={false} />;
  if (face === "def") {
    return (
      <svg viewBox="0 0 24 24" aria-label="Thủ">
        <path fill="currentColor" d="M12 2 4 5.2V11c0 5 3.4 8.6 8 10.8 4.6-2.2 8-5.8 8-10.8V5.2L12 2Z" />
      </svg>
    );
  }
  if (face === "seven" || face === "six") {
    return <b className={face === "seven" ? "is-seven" : "is-six"}>{face === "seven" ? "7" : "6"}</b>;
  }
  return <b>?</b>;
}

function SlotMachine({
  faces,
  phase,
  canPull,
  onPull,
  onDone,
  kind,
  order,
}: {
  faces: SpinFace[] | null;
  phase: "wait" | "spin";
  canPull: boolean;
  onPull: () => void;
  onDone?: () => void;
  kind?: "prize" | "gun";
  order?: Array<"phys" | "spell" | "tru"> | null;
}) {
  const [shown, setShown] = useState<Array<SpinFace | null>>([null, null, null]);
  const [locked, setLocked] = useState(0);
  const done = useRef(onDone);
  const held = useRef(0);
  done.current = onDone;
  const gun = kind === "gun";
  useEffect(() => {
    if (phase !== "spin" || !faces) {
      setShown([null, null, null]);
      setLocked(0);
      held.current = 0;
      return;
    }
    playCue("reelSpin");
    const spinFace = (index: number): SpinFace => {
      if (!gun) return REEL_ORDER[Math.floor(Math.random() * REEL_ORDER.length)]!;
      const barrel = order?.[index] ?? "phys";
      return Math.random() < 0.5 ? barrel : "blank";
    };
    const roll = window.setInterval(() => {
      setShown([0, 1, 2].map((index) => (index < held.current ? faces[index]! : spinFace(index))));
    }, 90);
    const lock = (count: number) => {
      held.current = count;
      setLocked(count);
      setShown([0, 1, 2].map((index) => (index < count ? faces[index]! : spinFace(index))));
    };
    const first = window.setTimeout(() => lock(1), 3300);
    const second = window.setTimeout(() => {
      playCue("reelStop");
      lock(2);
    }, 4200);
    const third = window.setTimeout(() => {
      playCue("reelStop");
      lock(3);
      const guns = faces.filter((face) => face === "phys" || face === "spell" || face === "tru").length;
      const cue = gun ? (guns >= 2 ? "reelPair" : null) : reelResultCue(faces as ReelFace[]);
      if (cue) playCue(cue, 0.12);
    }, 4980);
    const finish = window.setTimeout(() => done.current?.(), 5800);
    return () => {
      window.clearInterval(roll);
      window.clearTimeout(first);
      window.clearTimeout(second);
      window.clearTimeout(third);
      window.clearTimeout(finish);
    };
  }, [phase, faces, gun, order]);
  return (
    <div className="overlay">
      <div className="sheet slot-machine">
        <h2>{gun ? "Cò quay" : "Quay thưởng"}</h2>
        <div className="slot-reels">
          {shown.map((face, index) => (
            <div key={index} className={`slot-reel${phase === "spin" && index >= locked ? " is-spin" : ""}`}>
              <ReelGlyph face={face} />
            </div>
          ))}
        </div>
        {phase === "wait" && canPull && !gun ? (
          <button type="button" className="act press" onClick={onPull}>
            Kéo
          </button>
        ) : phase === "wait" && gun ? null : (
          <p>{phase === "wait" ? "Đợi kéo." : locked >= 3 ? "Xong." : "Đang quay."}</p>
        )}
      </div>
    </div>
  );
}

const TIME_HITS = [true, false, false, true, false, false];
const NEEDLE_REST = 313.51;

function needleTurn(sector: number) {
  const target = (270 + sector * 60) % 360;
  return 5 * 360 + ((target - NEEDLE_REST + 360) % 360);
}

function TimeWheel({
  sector,
  title,
  onPull,
  onDone,
}: {
  sector: number | null;
  title: string;
  onPull: (() => void) | null;
  onDone: () => void;
}) {
  const [turn, setTurn] = useState(0);
  const [moving, setMoving] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (sector === null) {
      setTurn(0);
      setMoving(false);
      return;
    }
    playCue("reelSpin");
    const arm = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setMoving(true);
        setTurn(needleTurn(sector));
      });
    });
    const sound = window.setTimeout(() => playCue(TIME_HITS[sector] ? "reelSeven" : "reelSix"), 2750);
    const finish = window.setTimeout(() => done.current(), 3600);
    return () => {
      window.cancelAnimationFrame(arm);
      window.clearTimeout(sound);
      window.clearTimeout(finish);
    };
  }, [sector]);
  return (
    <div className="overlay">
      <div className="sheet time-wheel-sheet">
        <h2>{title}</h2>
        <div className="time-wheel">
          <img className="time-disk" src="/art/time-wheel.png?v=1" alt="" draggable={false} />
          <img
            className={`time-needle${moving ? " is-on" : ""}`}
            src="/art/time-needle.png?v=1"
            alt=""
            draggable={false}
            style={{ transform: `rotate(${turn}deg)` }}
          />
        </div>
        {sector === null && onPull ? (
          <button type="button" className="act press" onClick={onPull}>
            Quay
          </button>
        ) : sector === null ? (
          <p>Đối thủ đang quay.</p>
        ) : (
          <p>Đang quay.</p>
        )}
      </div>
    </div>
  );
}

function PlayPage() {
  const language = useLang();
  const navigate = useNavigate();
  // Màn thiếu chiều dọc thì bàn bị cắt (board-cut.ts); mọi bảng toạ độ đọc vết cắt này.
  const [cut, setCut] = useState<BoardCut>(NO_CUT);
  setBoardCut(cut);
  useLayoutEffect(() => {
    const measure = () => {
      const high = window.innerHeight;
      const next = planCut(window.innerWidth, high, window.innerWidth);
      setCut((prev) => (sameCut(prev, next) ? prev : next));
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);
  /** Back to the screen the tutorial was opened from. */
  const leaveTutorial = () => {
    setTutorial(false);
    setTutView(null);
    void navigate({ to: sessionStorage.getItem("clash-tutorial-from") || "/guide" });
  };
  const [duel, setDuel] = useState<Duel | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  /** Thực chiến of a Giám định: the card and level being played. */
  const [trial, setTrial] = useState<{ id: string; level: number } | null>(null);
  const [trialPaid, setTrialPaid] = useState(false);
  /** Hết trận: whether the end scene is past. */
  const [endStep, setEndStep] = useState<"wait" | "scene" | "missions" | "done">("wait");
  const [gain, setGain] = useState<MatchGain | null>(null);
  /** Trận mê cung (chủ game 15/11): đánh quái ở /maze, hết trận quay về /maze. */
  const mazeFight = useRef<MazeBattleTicket | null>(null);
  /** Hết trận (chủ game 22/10): the losing side's HP on screen, where the end scene bursts it. */
  const [scene, setScene] = useState<{ win: boolean; at: { x: number; y: number }; tone: "red" | "blue" } | null>(null);
  const [tutView, setTutView] = useState<TutView | null>(null);
  const [busy, setBusy] = useState(false);
  const [hand, setHand] = useState<"reserve" | "spell">("reserve");
  const [inspect, setInspect] = useState<Inspect | null>(null);
  const [strike, setStrike] = useState<Strike | null>(null);
  const [look, setLook] = useState<{ name: string; text: string; hot?: string; uid?: string; skill?: string; from?: "chain" } | null>(null);
  const [fuseShow, setFuseShow] = useState<FuseShow | null>(null);
  const [fuseChoice, setFuseChoice] = useState<{ index: number; opts: FuseOpt[]; at: number } | null>(null);
  const [clockOn, setClockOn] = useState<string | null>(null);
  const fusePickRef = useRef<HTMLDivElement | null>(null);
  // Bảng chọn dung hợp: hình quái nằm ngay dưới bảng mô tả (cao thấp tuỳ số dòng), nút Dung hợp cố định ở ~60% sân (chủ game 18/11).
  useLayoutEffect(() => {
    const box = fusePickRef.current;
    if (!box) return;
    const fit = () => {
      const peek = box.querySelector<HTMLElement>(".hand-peek");
      const whole = box.getBoundingClientRect();
      const bottom = peek ? peek.getBoundingClientRect().bottom - whole.top : whole.height * 0.34;
      // Chân hình luôn ở 61,7% sân, cao tối đa 28,5% (đo theo ảnh chụp bảng Khổng lồ của chủ game 18/11); bảng mô tả dài hơn thì hình thấp lại.
      const top = Math.max(whole.height * 0.332, bottom + whole.height * 0.012);
      box.style.setProperty("--pick-top", `${top}px`);
      box.style.setProperty("--pick-h", `${Math.max(120, whole.height * 0.617 - top)}px`);
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(box);
    const peek = box.querySelector<HTMLElement>(".hand-peek");
    if (peek) watch.observe(peek);
    return () => watch.disconnect();
  }, [fuseChoice?.at, fuseChoice?.opts.length, Boolean(fuseChoice)]);
  const [blockChoice, setBlockChoice] = useState<BlockChoice | null>(null);
  const [blessArm, setBlessArm] = useState(false);
  const [chronoAsk, setChronoAsk] = useState<{ caster: string; target: string; age: boolean; pass: boolean } | null>(null);
  const [chronoWarn, setChronoWarn] = useState<{ caster: string; target: string } | null>(null);
  const [chronoSpin, setChronoSpin] = useState<{ caster: string; target: string | null; index: 1 | 2; sector: number | null } | null>(null);
  const [fuseAsk, setFuseAsk] = useState<FuseAsk | null>(null);
  const [riteHand, setRiteHand] = useState<number | null>(null);
  // Bấm một lần lá trên tay (chủ game 28/10): quái hiện mũi tên ↑↓ chọn hàng, phép hiện icon dùng phép; bấm đôi mới mở
  // bảng lá. `lastTap` nhận ra lần bấm thứ hai của một lần bấm đôi.
  const [handPick, setHandPick] = useState<{ pile: "reserve" | "spell"; index: number; id: string } | null>(null);
  /** Bấm 1 lần lá quái trên tay: hàng nút (menu) rồi 2 mũi tên chọn hàng (rows). */
  const [pickStage, setPickStage] = useState<"menu" | "rows">("menu");
  useEffect(() => setPickStage("menu"), [handPick]);
  const lastTap = useRef<{ pile: "reserve" | "spell"; index: number; at: number } | null>(null);
  // `slot` null: chosen from the Hiến tế button, the row arrows choose where it lands; a drop on a slot keeps that slot.
  const [vowAsk, setVowAsk] = useState<{ index: number; slot: Slot | null; picks: string[]; stage?: boolean } | null>(null);
  // Tay bài theo video (chủ game 13/11; Hướng dẫn giữ cách cũ): bấm lá = nhấc lá + bảng ngắn (`peekAt` = kỹ năng đang xem,
  // bấm lại lá thì sang kỹ năng kế, hết thì về đầu); kéo lá quái ra = `stage` (lá to giữa sân + lựa chọn); lá vừa rút hiện
  // giữa màn (`drawShows`, lần lượt từng lá) rồi mới về tay.
  const [peekAt, setPeekAt] = useState(0);
  const [stage, setStage] = useState<Staged | null>(null);
  const [drawShows, setDrawShows] = useState<Array<{ key: number; target: string; wait?: boolean }>>([]);
  const [drawLeave, setDrawLeave] = useState(false);
  /** K3 (chủ game 14/11): a spell used outside the reaction chain shows big in the middle of the board, then fades. */
  const [castShow, setCastShow] = useState<{ key: string; id: string } | null>(null);
  const [equipShow, setEquipShow] = useState<{ key: string; spellId: string; uid: string; slot: string; from: "hand" | "foe"; atkFrom: number; atkTo: number; fromBlue: boolean } | null>(null);
  // K4: việc đối thủ vừa làm (phép, kỹ năng); K5: bảng xác nhận trước khi mình dùng kỹ năng / phép.
  const [foeNote, setFoeNote] = useState<{ key: string; head: NoteHead; lines: string[] } | null>(null);
  const [useAsk, setUseAsk] = useState<{ head: NoteHead; lines: string[]; text?: string; go: () => void } | null>(null);
  /** Khoá 1 (chủ game 22/11): the attacker is choosing the enemy monster to lock; `go` goes on with the strike. */
  const [lockPick, setLockPick] = useState<{ uid: string; go: (base?: Duel) => void } | null>(null);
  const [confirmUse, setConfirmUse] = useState(true);
  useEffect(() => setConfirmUse(confirmOn()), []);
  // Bàn đổi (đối thủ đi, hết lượt) thì bảng xác nhận đang mở không còn đúng nữa.
  useEffect(() => setUseAsk(null), [duel]);
  useEffect(() => setPeekAt(0), [handPick?.pile, handPick?.index, handPick?.id, drawShows[0]?.key]);
  const [fuseOn, setFuseOn] = useState(false);
  const [fuseDrag, setFuseDrag] = useState<{ x: number; y: number; moved: boolean } | null>(null);
  const [aim, setAim] = useState<Aim | null>(null);
  const [lureAsk, setLureAsk] = useState<string | null>(null);
  // Sinh mệnh mới (chủ game 21/11): uid của Quả trứng đang chọn lá để bỏ.
  const [rebirthAsk, setRebirthAsk] = useState<string | null>(null);
  /** Hồi sinh quái thú đang chọn quái trong mộ: vị trí lá trên tay. */
  const [reviveAsk, setReviveAsk] = useState<{ index: number } | null>(null);
  const [prismAsk, setPrismAsk] = useState<{ index: number } | null>(null);
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testPast, setTestPast] = useState<Duel[]>([]);
  const [testKind, setTestKind] = useState<"monster" | "spell">("monster");
  const [testFind, setTestFind] = useState("");
  const [sound, setSoundOn] = useState(true);
  const [drag, setDrag] = useState<Drag | null>(null);
  // Chọn mục tiêu thông minh (chủ game 31/10): while a card is dragged, the target nearest the finger lights ("<side>-<slot>"
  // as data-slot, or "face"), and a drop that is not right on a target picks it. `snapPool` holds the targets the match
  // accepts for this drag, worked out once when it starts.
  const [snap, setSnap] = useState<string | null>(null);
  /** Kéo quái lên mục tiêu (chủ game 10/11): the monster and the target it was dropped on; the list of what it can do there shows. */
  const [dropMenu, setDropMenu] = useState<{ uid: string; key: string } | null>(null);
  /** A target to fire at once the aim picked from the drop list is in place. */
  const fireAfter = useRef<string | null>(null);
  /** Skill nhiều mục tiêu (chủ game 10/11): no tap or press on the next target within 2 s, the list of targets shows. */
  const [alsoPanel, setAlsoPanel] = useState(false);
  /**
   * Chọn mục tiêu bằng 4 mũi tên (chủ game 10/11): with Tấn công or a skill on, the target lit for the arrows and the OK
   * on the caster's card (nearest the caster at first), and the caster's card on screen.
   */
  const [aimLit, setAimLit] = useState<string | null>(null);
  const [padBox, setPadBox] = useState<PadBox | null>(null);
  const aimSeen = useRef<Aim | null>(null);
  // The tap a slide ends in, kept fresh each render so it sees the button's aim (ấn giữ rồi trượt).
  const slideFire = useRef<(key: string) => void>(() => undefined);
  /** Luật 0.3: chuyển lượt lúc neon còn sáng đã bắn mục tiêu đó; lần dựng kế tiếp xác nhận hàng chờ (hoặc huỷ nếu còn thiếu bước). */
  const autoOk = useRef(false);
  const snapPool = useRef<{ grab: Grab; keys: Set<string> } | null>(null);
  /** Chọn mục tiêu bằng đèn pin (chủ game 01/11): the lamp at the touch-down point of an attack drag or a target press. */
  const torch = useRef<TorchState | null>(null);
  /** A target press (startPress) is on: the field's own drags stay off. */
  const pressing = useRef(false);
  const planCache = useRef<{ duel: Duel | null; aim: Aim | null; uid: string | null; plan: TargetPlan | null }>({ duel: null, aim: null, uid: null, plan: null });
  const [swapPick, setSwapPick] = useState<string[]>([]);
  /** Hoán đổi (chủ game 30/10): the monster that goes back into a hand flies there as a ghost of its card. */
  const [swapGhost, setSwapGhost] = useState<{ key: number; mon: FieldMon; rect: { left: number; top: number; width: number; height: number }; to: { x: number; y: number } } | null>(null);
  const swapSeen = useRef<Duel | null>(null);
  const boxSeen = useRef<Duel | null>(null);
  const [boxShow, setBoxShow] = useState<{ key: number; host: HTMLElement; spots: BoxSpot[] } | null>(null);
  const [recallPick, setRecallPick] = useState<number[]>([]);
  const [reflectPick, setReflectPick] = useState<{ index: number; uid: string | null } | null>(null);
  const [ambushPick, setAmbushPick] = useState<{ index: number; uid: string | null } | null>(null);
  const [digPick, setDigPick] = useState<{ index: number; id: string | null } | null>(null);
  /** Đòn cuối cùng: nhiều quái vừa bị hạ thì chọn quái ra đòn cuối trước. */
  const [riteAsk, setRiteAsk] = useState<{ index: number } | null>(null);
  const [lockFlash, setLockFlash] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  /** The attacker's last thrust as its blow lands (chủ game 22/10). */
  const [lift, setLift] = useState<string | null>(null);
  /** Quái ẩn vừa lật (chủ game 21/11): bên mình lật bài, bên kia xoá sương mù; uid → kiểu hiệu ứng. */
  const [unveil, setUnveil] = useState<Record<string, "own" | "foe">>({});
  const [thrust, setThrust] = useState<{ uid: string; x: number; y: number; phase?: "back" | "ram" | "rouse" | "cast" | "mount"; ang?: number; tone?: string } | null>(null);
  /** The ally Phục kích sends, once it has flown out (`POUNCE_AFTER`). */
  const [pounce, setPounce] = useState<string | null>(null);
  const sentAlly = duel?.step === "respond" ? duel.hold?.ambush?.ally ?? null : null;
  useEffect(() => {
    if (!sentAlly) {
      setPounce(null);
      return;
    }
    const timer = window.setTimeout(() => setPounce(sentAlly), POUNCE_AFTER);
    return () => window.clearTimeout(timer);
  }, [sentAlly]);
  /** A player's HP held at its old value until the lightning of a landing blow reaches it. */
  const [hpHold, setHpHold] = useState<Record<string, number>>({});
  /** Quái mà khiên đã vỡ trong dữ liệu nhưng hình khiên còn đứng tới lúc đòn chạm (Z4, chủ game 28/11). */
  const [aegisKeep, setAegisKeep] = useState<Record<string, boolean>>({});
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [linger, setLinger] = useState<Linger[]>([]);
  /** Chủ game 16/11: monsters being shattered (the video effect), kept apart from the slot so a new summon there is not hidden. */
  const [shatters, setShatters] = useState<Array<{ id: number; side: Side; index: number; mon: FieldMon }>>([]);
  const [laserHp, setLaserHp] = useState<Record<string, number>>({});
  const [burst, setBurst] = useState<Burst | null>(null);
  const [chain, setChain] = useState<ChainOrb[]>([]);
  // Hàng chờ (chủ game 28/10): what this screen's player has queued and not confirmed yet, kept on this screen only
  // until the tick. `act`: one action at the opponent; `answer`: answers to the opponent's action. `base` is the
  // match as it stood before (X goes back to it, with the icons of `chain` as they were). `peek`: the eye's preview.
  const [queue, setQueue] = useState<{ kind: "act" | "answer"; base: Duel; chain: ChainOrb[] } | null>(null);
  // Gương phòng hộ đứng sẵn (chủ game 09/11): sau Xác nhận, gương tự dựng và quyền còn ở bên đánh; gương chủ yếu để doạ,
  // nên đòn lỡ tay vẫn rút lại được bằng X tới khi bên đánh bấm OK. `base` là bàn lúc trước khi đánh.
  const [mirrorBack, setMirrorBack] = useState<{ base: Duel; chain: ChainOrb[] } | null>(null);
  const [peek, setPeek] = useState(false);
  const sightMemo = useRef<{ duel: Duel | null; kind: string | null; sight: Sight | null }>({ duel: null, kind: null, sight: null });
  // Whom the waiting action lands on (dòng chảy đợt 2), worked out once per state of the match.
  const reachMemo = useRef<{ duel: Duel | null; reach: Reach | null }>({ duel: null, reach: null });
  const reachFor = (state: Duel): Reach | null => {
    if (reachMemo.current.duel !== state) reachMemo.current = { duel: state, reach: reachOf(state) };
    return reachMemo.current.reach;
  };
  // Màn VS (T1) and Bài khởi đầu (T2), chủ game 22/10: the VS screen plays once per match before the opening hand, and
  // the opening hand stays open until its cards have flown, even once both sides are done.
  // introMid: the match whose VS screen has played, so a new match (Đấu lại, Chơi lại) plays it again first.
  const [introMid, setIntroMid] = useState<string | null>(null);
  const introSeen = introMid !== null && introMid === (duel?.mid ?? "");
  const [openerOpen, setOpenerOpen] = useState(false);
  /** Online: this side's opening pick, put again on top of the other side's when both were sent at once. */
  const openerWant = useRef<{ side: Side; pick: OpenerPick } | null>(null);
  /** The slot of each monster the reaction line points at, so a stream still lands where one fell as its orb fired. */
  const lineSeats = useRef(new Map<string, { side: Side; index: number }>());
  // Where each reaction icon stood: an icon that has done its work stays put while the others fade.
  const keptSpots = useRef(new Map<string, IconSpot>());
  /** The branches of the spread on the board that a monster can stand in front of (worked out as the icons are). */
  const branchLanes = useRef<Array<{ hit: string; pts: Array<{ x: number; y: number }> }>>([]);
  /** The flow of the strike a monster can block, as runs from its icon to where it lands (% of the board). */
  const strikeFlows = useRef<Array<[{ x: number; y: number }, { x: number; y: number }]>>([]);
  /** The last results each skill icon showed while its caster stood. */
  const briefSeen = useRef(new Map<string, string>());
  const [motion, setMotion] = useState<Motion>({ pops: [], lunges: [], hits: [] });
  const [starFlash, setStarFlash] = useState<Side | null>(null);
  /** Gió dịu đi (chủ game 22/11): the blown-away mana keeps its old number while the pink flow runs, then blinks and falls. */
  const [drainHold, setDrainHold] = useState<{ side: Side; orb: boolean; gems: boolean } | null>(null);
  const [drainBlink, setDrainBlink] = useState<{ side: Side; orb: boolean; gems: boolean } | null>(null);
  const [knightAsk, setKnightAsk] = useState<{ uid: string; foeUid: string | null; face: boolean; block?: boolean; room: 1 | 2 } | null>(null);
  const [hornAsk, setHornAsk] = useState<{ uid: string; foeUid: string; mode: "splash" | "plus" | null } | null>(null);
  const [askAt, setAskAt] = useState<{ x: number; y: number } | null>(null);
  const askDrag = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null);
  const prevDuel = useRef<Duel | null>(null);
  const seenViewer = useRef<Side | null>(null);
  const wave = useRef(0);
  const grab = useRef<Grab | null>(null);
  const fuseHold = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const origin = useRef({ x: 0, y: 0, moved: false, t: 0, pan: false, lastX: 0 });
  const handStrip = useRef<HTMLDivElement | null>(null);
  // Cards past the three-card window fade out the further they sit beyond it, so nothing is cut and the glow of the edge cards stays free (chủ game 03/11).
  const fadeEdges = (strip: HTMLElement) => {
    const box = strip.getBoundingClientRect();
    const style = getComputedStyle(strip);
    const left = box.left + (parseFloat(style.paddingLeft) || 0);
    const right = box.right - (parseFloat(style.paddingRight) || 0);
    strip.querySelectorAll<HTMLElement>(".hand-pick").forEach((pick) => {
      const rect = pick.getBoundingClientRect();
      const over = Math.max(rect.right - right, left - rect.left, 0);
      pick.style.setProperty("--edge", String(Math.max(0, Math.min(1, 1 - over / 30))));
    });
  };
  useLayoutEffect(() => {
    if (handStrip.current) fadeEdges(handStrip.current);
  });
  const noticeRef = useRef<HTMLParagraphElement | null>(null);
  const noticePan = useRef<{ id: number; y: number; top: number } | null>(null);
  const laserTimers = useRef<number[]>([]);
  const skillPan = useRef<{ id: number; y: number; top: number } | null>(null);
  const suppressClick = useRef(false);
  /** Khung gợi ý kiểu Hướng dẫn (chủ game 03/11): lặp 3 lần cùng hành vi mới hiện, mỗi gợi ý một lần. */
  const [hint, setHint] = useState<{ targets: string[]; body: ReactNode } | null>(null);
  function hintOk() {
    return Boolean(duel) && !tutorial && !trial && !replay && (duel?.mode === "ai" || duel?.mode === "net");
  }
  /** Lượt 1: mọi hành động lặp lại (nhấp lá, kéo quái, bấm quái) nhắc người chơi bước tiếp theo. */
  function turnOneHint() {
    // Tạm ẩn (chủ game 12/11): lượt đầu đã tự rút 1 lá nên các gợi ý cũ của lượt 1 không còn đúng.
    if (TURN_ONE_HINTS_OFF) return;
    if (!duel || !hintOk() || !canPlay || (duel.clock ?? 1) > 1) return;
    const mine = duel.players[viewer];
    const one = <b className="hint-s1">1 sao</b>;
    const drawn = mine.draws >= 1 || pileLeft(mine) < 1;
    if (!drawn) {
      const has = mine.reserve.some((held) => monsterCard(held.id)?.stars === 1);
      if (!countHint(has ? "t1-draw1" : "t1-draw0")) return;
      setHint(
        has
          ? { targets: [".face-pile"], body: <p>Hãy rút 1 lá bài để được triệu hồi quái {one}</p> }
          : { targets: [".face-pile", ".hand.is-strip"], body: <p>Hãy rút bài đã.<br />Để có thể <b className="hint-sum">triệu hồi</b> quái {one}.</p> },
      );
      return;
    }
    const usable = mine.reserve.some((held) => (monsterCard(held.id)?.stars ?? 9) <= mine.stars);
    if (duel.round !== undefined && duel.round !== viewer) {
      if (!countHint("t1-more")) return;
      setHint({ targets: [".medal-act"], body: <p>Hãy tiếp tục bấm chuyển</p> });
      return;
    }
    if (!usable && mine.field.every((mon) => !mon)) {
      if (!countHint("t1-pass")) return;
      setHint({ targets: [".hand.is-strip", ".medal-act"], body: <p>Bạn không có quái {one} nào trên tay.<br />Hãy bấm chuyển</p> });
    }
  }
  /**
   * Lượt đầu, chưa rút bài (chủ game 08/11): bấm liên tục 5-6 lần mà không có việc chủ động nào xen vào (xem thông tin,
   * rút bài) là thao tác bất lực: hiện hướng dẫn chỉ phải rút bài.
   */
  const helpless = useRef({ n: 0, at: 0 });
  function helplessTap(deliberate: boolean) {
    const now = Date.now();
    const run = helpless.current;
    if (deliberate || now - run.at > 5000) run.n = 0;
    if (deliberate) return;
    run.at = now;
    run.n += 1;
    if (run.n < 5) return;
    if (!duel || !hintOk() || !canPlay || (duel.clock ?? 1) > 1 || hint) return;
    const mine = duel.players[viewer];
    if (mine.draws >= 1 || pileLeft(mine) < 1) return;
    run.n = 0;
    // After the finger is up, so the click of this same touch does not land on the new overlay and close it.
    window.setTimeout(() => setHint({ targets: [".face-pile"], body: <p>Hãy rút bài đã.<br />Bấm vào <b className="hint-sum">xấp bài</b> để rút.</p> }), 450);
  }
  /** Thiếu sao (không phải chuyện rút bài): bảng mana cần thêm. */
  function stuckHint(cardStars: number) {
    if (!duel || !hintOk()) return;
    if (!countHint("stars")) return;
    const mine = duel.players[viewer];
    const star = <b className={`hint-s${Math.min(4, Math.max(1, cardStars))}`}>{cardStars} sao</b>;
    const total = starPrice(cardStars);
    const have = starPrice(mine.stars) + mine.starGems;
    setHint({
      targets: ['[data-tut="youGems"]', '[data-tut="youStars"]'],
      body: (
        <p>
          Quái {star} cần đủ <b className="hint-gem">{total} mana</b> trong mộ để <b className="hint-sum">triệu hồi</b>.
          <br />
          Cần tiêu thêm <b className="hint-gem">{Math.max(1, total - have)} mana</b> nữa.
        </p>
      ),
    });
  }
  /** Bấm mộ mana hoặc ô sao: còn bao nhiêu mana nữa tới sao kế. */
  function starGapHint() {
    if (!duel || tutorial || replay) return;
    const mine = duel.players[viewer];
    const next = mine.stars + 1;
    setHint({
      targets: ['[data-tut="youGems"]', '[data-tut="youStars"]'],
      body:
        mine.stars >= STAR_COST.length ? (
          <p>
            Bạn đã đủ <b className="hint-s4">{STAR_COST.length} sao</b>.
          </p>
        ) : (
          <p>
            <b className="hint-gem">{STAR_COST[mine.stars] - mine.starGems}</b> <i className="mana-gem" aria-hidden="true" /> → <b className={`hint-s${Math.min(4, next)}`}>{next} ★</b>
          </p>
        ),
    });
  }
  /** Last tap on a monster of the field: a second tap within DOUBLE_TAP opens its sheet (chủ game 02/11). */
  const fieldTap = useRef<{ uid: string; at: number } | null>(null);
  const scratch = useRef<Scratch>(freshScratch());
  const matchRef = useRef<{ id: string; startedAt: number; decks: OpeningDecks | null; saved: boolean } | null>(null);
  const starTimer = useRef(0);
  // Lá bốc bay từ xấp lên tay (chủ game 30/10).
  const [flights, setFlights] = useState<DrawFlight[]>([]);
  // Hiệu ứng xáo bài: số lần xấp mình / xấp địch vừa bị xáo; đổi bài đầu trận thì chờ bảng đóng mới xáo (chủ game 26/11).
  const [shuf, setShuf] = useState({ you: 0, foe: 0 });
  const shufflePending = useRef<Side[]>([]);
  // Chủ game 22/11: lá bị bỏ khỏi tay (Gặt hồn, Sinh mệnh mới) nhấc lên, bay cung về 2 giờ rồi cháy tan (card-burn.tsx).
  const [burns, setBurns] = useState<Array<{ id: number; rect: BurnRect; face: ReactNode }>>([]);
  const burnSeen = useRef<{ mid: string | null; id: number }>({ mid: null, id: 0 });
  const handRects = useRef<Record<string, BurnRect>>({});
  const burnPrev = useRef<Duel | null>(null);
  const flightId = useRef(0);
  const flightDone = (id: number) => setFlights((list) => list.filter((flight) => flight.id !== id));
  // Số lá còn trong xấp / trên tay: ẩn, chỉ hiện khi bấm (chủ game 30/10). Địch: bấm xấp hoặc khay tay bật/tắt; xấp mình: nhấp
  // đôi hiện 3 giây rồi tự mất (nhấp đơn là rút, nên rút chờ DOUBLE_TAP xem có lần bấm thứ hai không).
  const [surrenderAsk, setSurrenderAsk] = useState(false);
  const pileTap = useRef(0);
  const countTimer = useRef(0);
  const drawNow = useRef<() => void>(() => undefined);
  const stall = useRef({ live: "", n: 0 });
  const resetHold = useRef(0);
  const riteHold = useRef(0);
  const netRef = useRef<{ code: string; seat: NetSeat } | null>(null);
  const rev = useRef(0);
  const netWake = useRef<(() => void) | null>(null);
  const pushGen = useRef(0);
  const opening = useRef(false);
  // Chơi lại in Tuỳ chọn (chủ game 22/10): this side's vote goes to the room once per match; the host then opens the
  // next match. `liveDuel` is the duel as last drawn, for the room's poll.
  const againRef = useRef(false);
  const voteSent = useRef<string | null>(null);
  const liveDuel = useRef<Duel | null>(null);
  liveDuel.current = duel;
  const [again, setAgain] = useState(false);
  // When this game saw the match end, for the time on the summary.
  const endedAt = useRef<{ mid: string | undefined; at: number } | null>(null);
  const noticeQ = useRef<{ text: string; until: number; ink: TrailInk; clock: number }[]>([]);
  const noticeTimer = useRef(0);
  const trailLog = useRef<TrailMark[]>([]);
  const trailSeq = useRef(0);
  const turnClock = useRef(1);
  const windupText = useRef<string | null>(null);
  const [trailDots, setTrailDots] = useState<TrailMark[]>([]);
  const [pinnedId, setPinnedId] = useState<number | null>(null);
  const [net, setNet] = useState<{ code: string; seat: NetSeat } | null>(null);
  const [wait, setWait] = useState("");
  /** Xem trận của bạn bè (chủ game 31/10): ID bạn đó; trận chỉ để xem, không bấm được gì. */
  const [watch, setWatch] = useState<{ friend: string; over: boolean } | null>(null);
  // Xem lại trận (chủ game 31/10): sách khung, khung đang xem, đang chạy, tốc độ.
  const [replay, setReplay] = useState<{ book: ReplayBook; at: number; playing: boolean; speed: 1 | 2 | 4 } | null>(null);
  /** Thanh điều khiển xem lại (chủ game 01/11): nút camera bật/tắt, kéo bằng dải tiêu đề, vị trí giữ tới khi thoát. */
  const [rpShow, setRpShow] = useState(true);
  const [rpPos, setRpPos] = useState<{ x: number; y: number } | null>(null);
  const friendPulse = usePulse();
  const watchPush = useRef<{ at: number; timer: number; rev: number }>({ at: 0, timer: 0, rev: 0 });

  function remember(items: { text: string; ink: TrailInk; clock: number }[]) {
    const fresh = items.filter((item) => item.text && !trailSkip(item.text));
    if (!fresh.length) return;
    const stamped = fresh.map((item) => {
      trailSeq.current += 1;
      return { id: trailSeq.current, text: item.text, ink: item.ink, clock: item.clock };
    });
    trailLog.current = [...trailLog.current, ...stamped].slice(-80);
    setTrailDots(trailLog.current);
  }

  function dropTrail(text: string) {
    const log = trailLog.current;
    let index = -1;
    for (let i = log.length - 1; i >= 0; i -= 1) {
      if (log[i].text === text) {
        index = i;
        break;
      }
    }
    if (index < 0) return;
    const id = log[index].id;
    trailLog.current = log.filter((item) => item.id !== id);
    setTrailDots(trailLog.current);
    setPinnedId((current) => (current === id ? null : current));
  }

  function holdNotice(text: string, player = true, clock?: number) {
    const now = Date.now();
    const stamp = clock ?? turnClock.current;
    const ink = noticeInk(text);
    window.clearTimeout(noticeTimer.current);
    if (!text) {
      noticeQ.current = [];
      setToast("");
      return;
    }
    let q = noticeQ.current.slice();
    let expired = false;
    if (q[0] && q[0].until <= now) {
      expired = true;
      q = q.slice(1);
      if (q[0]) q[0] = { ...q[0], until: now + 2500 };
    }
    if (q.length > 0 && q[q.length - 1].text === text) {
      noticeQ.current = q;
      if (expired && q[0]) setToast(q[0].text);
      armNotice();
      return;
    }
    remember([{ text, ink, clock: stamp }]);
    if (player && q.length >= 2) {
      const next = { text, until: now + 2500, ink, clock: stamp };
      noticeQ.current = [next];
      setToast(text);
      return;
    }
    if (q.length === 0) {
      const next = { text, until: now + 2500, ink, clock: stamp };
      noticeQ.current = [next];
      setToast(text);
      return;
    }
    if (expired && q[0]) setToast(q[0].text);
    q.push({ text, until: 0, ink, clock: stamp });
    noticeQ.current = q;
    armNotice();
  }

  function armNotice() {
    window.clearTimeout(noticeTimer.current);
    const q = noticeQ.current;
    if (q.length < 2 || !q[0]?.until) return;
    const wait = Math.max(0, q[0].until - Date.now());
    noticeTimer.current = window.setTimeout(() => {
      const list = noticeQ.current;
      if (list.length < 2) return;
      const rest = list.slice(1);
      rest[0] = { ...rest[0], until: Date.now() + 2500 };
      noticeQ.current = rest;
      setToast(rest[0].text);
      if (rest.length > 1) armNotice();
    }, wait);
  }

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  useEffect(() => {
    setSoundOn(soundOn());
    const unlock = () => unlockSound();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const box = noticeRef.current;
    if (!box || pinnedId !== null) return;
    box.scrollTop = 0;
  }, [toast, duel?.turn, pinnedId]);

  useEffect(() => {
    const box = noticeRef.current;
    if (box) box.scrollTop = 0;
  }, [pinnedId]);

  useEffect(() => {
    if (pinnedId === null) return;
    if (!trailDots.some((dot) => dot.id === pinnedId)) setPinnedId(null);
  }, [pinnedId, trailDots]);

  useEffect(() => {
    if (pinnedId === null) return;
    const down = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (noticeRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest(".trail-dot, .notice-trail")) return;
      setPinnedId(null);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [pinnedId]);

  useEffect(() => {
    const ask = loadReplayAsk();
    if (ask) {
      // Xem lại trận: tải bản ghi, nhìn từ phía chủ trận, không thao tác được, lật hết bài hai bên.
      matchRef.current = null;
      setWatch({ friend: ask.player, over: false });
      setWait("Đang tải trận…");
      let stop = false;
      void readReplay({ data: ask })
        .then(async (got) => {
          if (stop) return;
          const data = got.ok ? await unpackReplay(got.data) : null;
          if (stop) return;
          if (!data) {
            setWait("Không tải được trận này.");
            return;
          }
          const book = new ReplayBook(data);
          sessionStorage.setItem(WATCH_SEAT_KEY, data.seat);
          setNet({ code: "", seat: data.seat, ...(data.mode === "quick" ? { quick: true } : {}) } as { code: string; seat: NetSeat });
          setReplay({ book, at: 0, playing: true, speed: 1 });
          setWait("");
          setDuel({ ...book.frame<Duel>(0), mode: "net", glimpse: null });
        })
        .catch(() => {
          if (!stop) setWait("Không tải được trận này.");
        });
      return () => {
        stop = true;
      };
    }
    const friend = sessionStorage.getItem(WATCH_KEY);
    if (friend) {
      // Người xem: đọc trận của bạn mình mỗi 1,5 giây, nhìn từ phía bạn đó. Trận nào cũng hiện như trận online.
      matchRef.current = null;
      setWatch({ friend, over: false });
      setWait("Đang tải trận…");
      let stop = false;
      let seen = -1;
      let gone = 0;
      const tick = async () => {
        try {
          const got = await readWatch({ data: { id: playerId(), friend } });
          if (stop) return;
          if (got.phase === "play") {
            gone = 0;
            if (got.rev === seen) return;
            seen = got.rev;
            const raw = JSON.parse(got.duel) as Duel;
            sessionStorage.setItem(WATCH_SEAT_KEY, got.side === 1 ? "guest" : "host");
            const quick = got.mode === "quick";
            setNet((current) => (current?.seat === (got.side === 1 ? "guest" : "host") ? current : ({ code: "", seat: got.side === 1 ? "guest" : "host", ...(quick ? { quick: true } : {}) } as { code: string; seat: NetSeat })));
            setWait("");
            setDuel({ ...raw, mode: "net", glimpse: null });
          } else if (got.phase === "gone") {
            gone += 1;
            if (gone >= 2) setWatch((current) => (current ? { ...current, over: true } : current));
          }
        } catch {
          // Mất mạng: thử lại lần sau.
        }
      };
      void tick();
      const timer = window.setInterval(() => void tick(), 1500);
      return () => {
        stop = true;
        window.clearInterval(timer);
      };
    }
    let join: { code: string; seat: NetSeat } | null = null;
    try {
      join = JSON.parse(sessionStorage.getItem("clash-net") ?? "null") as { code: string; seat: NetSeat } | null;
    } catch {
      join = null;
    }
    const mazeTicket = takeMazeBattle();
    if (!join?.code || (join.seat !== "host" && join.seat !== "guest")) {
      const saved = sessionStorage.getItem("clash-mode");
      if (saved === TUTORIAL_MODE) {
        matchRef.current = null;
        setTutorial(true);
        setDuel(createTutorialDuel());
        return;
      }
      if (saved === TRIAL_MODE) {
        let picked: { id: string; level: number } | null = null;
        try {
          picked = JSON.parse(sessionStorage.getItem(TRIAL_KEY) ?? "null") as { id: string; level: number } | null;
        } catch {
          picked = null;
        }
        if (picked) {
          matchRef.current = null;
          setTrial(picked);
          setDuel(createTrialDuel(picked.id, picked.level));
          return;
        }
      }
      const mode = saved === "hotseat" || saved === "test" ? saved : "ai";
      // Vé mê cung chỉ đọc được một lần; React chạy hiệu ứng 2 lần ở bản dev nên giữ vé đã lấy.
      mazeFight.current = mode === "ai" ? (mazeTicket ?? mazeFight.current) : null;
      const next = mode === "test" ? (loadTestDuel() ?? openingDraw(createDuel(loadDeck(), "test"))) : newMatch(mode);
      if (next.mode === "ai" && next.step === "main" && next.winner === null) {
        warmMatchHistory();
        matchRef.current = { id: newMatchId(), startedAt: Date.now(), decks: openingDecks(next.players), saved: false };
      } else matchRef.current = null;
      setDuel(next);
      return;
    }
    matchRef.current = null;
    netRef.current = join;
    setNet(join);
    // A room paired by Đánh thường has both decks already: no code to share.
    const quick = Boolean((join as { quick?: boolean }).quick);
    // Mời bạn bè vào trận (chủ game 31/10): chờ bạn nhận lời mời, không cần đưa mã.
    const invited = Boolean((join as { friend?: boolean }).friend);
    setWait(quick ? "Đang vào trận…" : invited && join.seat === "host" ? "Đang chờ bạn vào trận…" : join.seat === "host" ? `Mã ${join.code}. Đợi đối thủ nhập mã này.` : "Đang vào phòng…");
    let stop = false;
    let voting = false;
    const tick = async () => {
      const wantDeck = join.seat === "host" && (againRef.current || liveDuel.current?.again?.[0] === "want");
      const room = await pollRoom({ data: { code: join.code, seat: join.seat, since: rev.current, ...(wantDeck ? { deck: true } : {}) } });
      if (stop) return;
      if (room.phase === "gone") {
        setWait("Mã không còn. Hãy tạo mã mới.");
        return;
      }
      if (join.seat === "host" && room.guestDeck && room.phase === "wait" && !opening.current) {
        opening.current = true;
        const deck = loadDeck();
        const opened: Duel = { ...createDuel(deck, "net", room.guestDeck), faces: [ownFace(deck), roomFace(room.guestDeck)] };
        const pushed = await pushDuel({
          data: { code: join.code, seat: "host", duel: JSON.stringify({ ...opened, glimpse: null }) },
        });
        if (stop) return;
        if (!pushed.ok) {
          opening.current = false;
          setWait(pushed.error);
          return;
        }
        rev.current = pushed.rev;
        setWait("");
        setDuel(opened);
        return;
      }
      if (room.duel && room.rev > rev.current) {
        rev.current = room.rev;
        let next = JSON.parse(room.duel) as Duel;
        // Đổi bài đầu trận: when both sides sent their pick at once, the later one lost this side's pick; it goes on top.
        const want = openerWant.current;
        if (want && next.opener && !next.opener.done[want.side]) {
          next = openerSwap(next, want.side, want.pick);
          void pushDuel({ data: { code: join.code, seat: join.seat, duel: JSON.stringify({ ...next, glimpse: null }) } }).then((pushed) => {
            if (pushed.ok) rev.current = pushed.rev;
          });
        } else if (want) openerWant.current = null;
        setWait("");
        holdNotice(next.live ?? "", false, next.clock);
        setQueue(null);
        setPeek(false);
        setDuel(next);
        liveDuel.current = next;
      }
      // Chơi lại (Tuỳ chọn): send this side's vote on the finished match; the host opens the next match in the same
      // room, with the same two decks, once the guest wants it too.
      const last = liveDuel.current;
      if (voting || !last || last.winner === null) return;
      const side: Side = join.seat === "host" ? 0 : 1;
      const votes: [AgainVote, AgainVote] = last.again ?? [null, null];
      // A vote already in the room counts too (the page opened again while waiting).
      if (!againRef.current && votes[side] !== "want") return;
      if (side === 0 && votes[1] === "want") {
        if (!room.guestDeck) return;
        voting = true;
        const deck = loadDeck();
        const opened: Duel = { ...createDuel(deck, "net", room.guestDeck), faces: [ownFace(deck), roomFace(room.guestDeck)] };
        const pushed = await pushDuel({ data: { code: join.code, seat: "host", duel: JSON.stringify({ ...opened, glimpse: null }) } }).catch(() => null);
        voting = false;
        if (stop || !pushed?.ok) return;
        rev.current = pushed.rev;
        openerWant.current = null;
        setDuel(opened);
        liveDuel.current = opened;
        return;
      }
      if (votes[side] === "want" || voteSent.current === last.mid) return;
      voting = true;
      const mine: [AgainVote, AgainVote] = side === 0 ? ["want", votes[1]] : [votes[0], "want"];
      const pushed = await pushDuel({ data: { code: join.code, seat: join.seat, duel: JSON.stringify({ ...last, again: mine, glimpse: null }) } }).catch(() => null);
      voting = false;
      // The room keeps the other side's vote; the next poll brings both.
      if (pushed?.ok) voteSent.current = last.mid ?? null;
    };
    // Lag Đánh thường (chủ game 15/11): an ask every 280 ms whatever happened to the one before piled the asks up on the
    // server for over 10 s. Now the next ask waits for the last one: soon (0,8 s) while the other side is to act, slower
    // (2 s) while this side is.
    const mine: Side = join.seat === "host" ? 0 : 1;
    const pace = () => {
      const live = liveDuel.current;
      if (!live || live.winner !== null || live.opener) return 800;
      return boardActor(live) === mine ? 2000 : 800;
    };
    let timer = 0;
    let busy = false;
    const loop = async () => {
      busy = true;
      try {
        await tick();
      } catch {
        // A lost ask: the next one tries again.
      }
      busy = false;
      if (!stop) timer = window.setTimeout(() => void loop(), pace());
    };
    // The wait is set after each ask, so a 2 s wait chosen while it was this side's turn stayed on after the move was
    // sent: the other side's answer was seen up to 2 s late (chủ game 16/11). When the match changes, set the wait again.
    netWake.current = () => {
      if (stop || busy) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void loop(), pace());
    };
    void loop();
    return () => {
      netWake.current = null;
      stop = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    netWake.current?.();
  }, [duel?.turn, duel?.round, duel?.winner]);

  useEffect(() => {
    if (duel?.mode === "test") sessionStorage.setItem(TEST_DUEL_KEY, JSON.stringify(duel));
  }, [duel]);

  useEffect(() => {
    setRecallPick([]);
  }, [duel?.recall]);

  // Hoán đổi (chủ game 30/10): two monsters that trade places run round each other, each on half of an ellipse whose
  // two ends are the two monsters; one traded with a card of the hand flies into the hand while the card flies out.
  useLayoutEffect(() => {
    const before = swapSeen.current;
    swapSeen.current = duel;
    if (!duel || !before || before.mid !== duel.mid || !/Hoán đổi (xong|quái)/.test(duel.live)) return;
    const slotOf = (side: number, index: number) => document.querySelector<HTMLElement>(`[data-slot="${side}-${index}"]`);
    const centre = (rect: DOMRect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    const handOf = (rect: DOMRect) => {
      const c = centre(rect);
      const box = document.querySelector(c.y > window.innerHeight / 2 ? ".hand" : ".foe-fan")?.getBoundingClientRect();
      return box ? centre(box) : { x: window.innerWidth / 2, y: c.y > window.innerHeight / 2 ? window.innerHeight : 0 };
    };
    const play = (el: HTMLElement, frames: Keyframe[], ms: number, easing: string) => {
      el.style.zIndex = "40";
      const run = el.animate(frames, { duration: ms, easing });
      run.onfinish = () => {
        el.style.zIndex = "";
      };
    };
    for (const side of [0, 1] as const) {
      const was = before.players[side].field;
      const now = duel.players[side].field;
      const done = new Set<number>();
      for (let i = 0; i < 6; i += 1) {
        const oldMon = was[i];
        const newMon = now[i];
        if (done.has(i) || !newMon || oldMon?.uid === newMon.uid) continue;
        const j = oldMon ? now.findIndex((mon, k) => k > i && mon?.uid === oldMon.uid && was[k]?.uid === newMon.uid) : -1;
        const elI = slotOf(side, i);
        if (!elI) continue;
        if (j >= 0) {
          const elJ = slotOf(side, j);
          if (!elJ) continue;
          done.add(j);
          const ci = centre(elI.getBoundingClientRect());
          const cj = centre(elJ.getBoundingClientRect());
          const mid = { x: (ci.x + cj.x) / 2, y: (ci.y + cj.y) / 2 };
          const d = Math.hypot(cj.x - ci.x, cj.y - ci.y) || 1;
          const n = { x: -(cj.y - ci.y) / d, y: (cj.x - ci.x) / d };
          const bow = Math.max(elI.getBoundingClientRect().height * 0.55, d * 0.3);
          const ring = (own: { x: number; y: number }, far: { x: number; y: number }, sign: number): Keyframe[] =>
            Array.from({ length: 21 }, (_, k) => {
              const t = k / 20;
              const th = Math.PI * (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
              const x = mid.x + (far.x - mid.x) * Math.cos(th) + sign * n.x * bow * Math.sin(th);
              const y = mid.y + (far.y - mid.y) * Math.cos(th) + sign * n.y * bow * Math.sin(th);
              return { translate: `${x - own.x}px ${y - own.y}px`, offset: t };
            });
          play(elI, ring(ci, cj, 1), 760, "linear");
          play(elJ, ring(cj, ci, -1), 760, "linear");
        } else if (!now.some((mon, k) => k !== i && mon && oldMon && mon.uid === oldMon.uid) && !was.some((mon) => mon?.uid === newMon.uid)) {
          const rect = elI.getBoundingClientRect();
          const c = centre(rect);
          const hand = handOf(rect);
          play(elI, [{ translate: `${hand.x - c.x}px ${hand.y - c.y}px`, scale: "0.35", opacity: 0 }, { translate: "0px 0px", scale: "1", opacity: 1 }], 720, "cubic-bezier(.2,.8,.3,1)");
          if (oldMon) setSwapGhost({ key: Date.now(), mon: oldMon, rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, to: hand });
        }
      }
    }
  }, [duel]);

  // Hộp ma thuật (chủ game 02/11): a cabinet over each of the two slots that traded, the old card showing until the
  // doors close; when they come home (the round ends, or one falls) the cards slide back.
  useLayoutEffect(() => {
    const before = boxSeen.current;
    boxSeen.current = duel;
    if (!duel || !before || before.mid !== duel.mid) return;
    const host = document.querySelector<HTMLElement>(".board");
    const slotEl = (side: number, index: number) => document.querySelector<HTMLElement>(`[data-slot="${side}-${index}"]`);
    const unitEl = (uid: string) => document.querySelector<HTMLElement>(`[data-slot][data-uid="${uid}"]`);
    const calm = typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    const box = duel.box;
    if (host && box && box.pair.length === 2 && before.box?.seq !== box.seq && !calm) {
      const frame = host.getBoundingClientRect();
      const spots = box.pair.flatMap((row): BoxSpot[] => {
        const el = slotEl(row.side, row.slot);
        if (!el) return [];
        const rect = el.getBoundingClientRect();
        return [{ rect: { left: rect.left - frame.left, top: rect.top - frame.top, width: rect.width, height: rect.height }, ghost: unitEl(row.uid) }];
      });
      if (spots.length) setBoxShow({ key: box.seq, host, spots });
      return;
    }
    const was = before.box?.pair ?? [];
    const kept = new Set((box?.pair ?? []).map((row) => row.uid));
    for (const row of was) {
      if (kept.has(row.uid)) continue;
      const from = ([0, 1] as const).flatMap((side) => {
        const index = before.players[side].field.findIndex((mon) => mon?.uid === row.uid);
        return index >= 0 ? [{ side, index }] : [];
      })[0];
      const now = unitEl(row.uid);
      const old = from ? slotEl(from.side, from.index) : null;
      if (!from || !now || !old || from.side === row.side) continue;
      const a = old.getBoundingClientRect();
      const b = now.getBoundingClientRect();
      now.style.zIndex = "40";
      const run = now.animate(
        [{ translate: `${a.left + a.width / 2 - (b.left + b.width / 2)}px ${a.top + a.height / 2 - (b.top + b.height / 2)}px` }, { translate: "0px 0px" }],
        { duration: calm ? 1 : 620, easing: "cubic-bezier(.3,.7,.3,1)" },
      );
      run.onfinish = () => {
        now.style.zIndex = "";
      };
    }
  }, [duel]);

  useEffect(() => {
    if (!duel || busy || duel.winner !== null || duel.mode !== "ai" || duel.reel || duel.wheel || !loaded || tutorial || trial || queue) return;
    const aiResponds = duel.step === "respond" && duel.hold?.priority === 1 && !duel.hold.stage;
    const aiMain = duel.turn === 1 && duel.step === "main";
    const aiParley = Boolean(duel.parley && duel.step === "main" && parleyPicker(duel) === 1);
    // Harpie Lady (Giảo hoạt, tiến hoá): máy trả lời câu của nó; câu của người chơi thì máy chờ.
    const birdSide = duel.birdAsk ? (duel.birdAsk.side ?? (duel.players[1].field.some((mon) => mon?.uid === duel.birdAsk?.uid) ? 1 : 0)) : null;
    const askSide = duel.trimAsk?.[0]?.side ?? duel.wileAsk?.[0]?.side ?? birdSide ?? duel.rhinoAsk?.side ?? null;
    if (askSide === 0) return;
    const aiAsk = askSide === 1;
    if (!aiResponds && !aiMain && !aiParley && !aiAsk) return;
    // Bộ não mới (đợt 1): máy nghĩ ở luồng riêng trong 2 giây chờ, rồi trang chạy lại nước nó chọn bằng luật thật.
    const asked = duel;
    const started = Date.now();
    let timer = 0;
    let gone = false;
    void think(asked, THINK_MS).then((act) => {
      if (gone) return;
      timer = window.setTimeout(() => {
        setDuel((current) => {
          if (!current) return current;
          let next = current === asked && act ? runAct(current, act) : brainStep(current, 300);
          if (next === current) next = brainStep(current, 300);
          if (next === current) return current;
          const stuck = next.live === current.live && next.step === current.step && next.turn === current.turn && next.pending === current.pending;
          if (stuck) {
            stall.current = { live: next.live, n: stall.current.live === next.live ? stall.current.n + 1 : 1 };
            if (stall.current.n >= 2) {
              next = next.step === "respond" ? passResponse(next) : endTurn(next.step === "main" ? next : { ...next, step: "main" });
              stall.current = { live: "", n: 0 };
            }
          } else stall.current = { live: "", n: 0 };
          holdNotice(next.live, false, next.clock);
          return next;
        });
      }, Math.max(0, AI_WAIT - (Date.now() - started)));
    });
    return () => {
      gone = true;
      window.clearTimeout(timer);
    };
  }, [duel, busy, loaded, tutorial, trial, queue]);

  // Thực chiến: the opponent follows its script, and the match is judged after every move.
  const verdict = trial && duel ? trialVerdict(duel, trial.level) : null;
  useEffect(() => {
    if (!trial || !duel || !loaded || busy || verdict || queue) return;
    const timer = window.setTimeout(() => {
      setDuel((current) => {
        if (!current) return current;
        const next = trialFoe(current, trial.level);
        if (!next || next === current) return current;
        if (next.live !== current.live) holdNotice(next.live, false, next.clock);
        return next;
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [duel, trial, loaded, busy, verdict, queue]);
  useEffect(() => {
    if (trial && verdict === "pass") setTrialPaid(markTrial(trial.id, trial.level));
  }, [trial, verdict]);

  // Xem trận (chủ game 31/10): trận chạy trên máy này (Vs Máy, Test) gửi bản chụp lên khi có bạn bè đang xem,
  // tối đa mỗi 1,5 giây. Trận online thì người xem đọc thẳng phòng.
  const watchedNow = friendPulse.watched;
  const watchDuel = useRef<Duel | null>(null);
  watchDuel.current = duel;
  useEffect(() => {
    const push = watchPush.current;
    if (!duel || watch || tutorial || trial || !watchedNow || (duel.mode !== "ai" && duel.mode !== "test")) return;
    const send = () => {
      const current = watchDuel.current;
      if (!current) return;
      push.at = Date.now();
      push.rev += 1;
      void pushWatch({ data: { id: playerId(), duel: JSON.stringify({ ...current, glimpse: null }), rev: push.rev } }).catch(() => undefined);
    };
    const wait = 1500 - (Date.now() - push.at);
    if (wait <= 0) send();
    else if (!push.timer) {
      push.timer = window.setTimeout(() => {
        push.timer = 0;
        send();
      }, wait);
    }
  }, [duel, watch, tutorial, trial, watchedNow]);
  useEffect(() => () => window.clearTimeout(watchPush.current.timer), []);

  // Xem lại trận: tự sang khung kế theo đúng nhịp lúc đánh (chậm nhất 2,5 giây, nhanh nhất 0,25 giây), chia tốc độ.
  useEffect(() => {
    if (!replay?.playing) return;
    const { book, at, speed } = replay;
    if (at >= book.length - 1) return;
    const gap = Math.min(2500, Math.max(250, book.timeAt(at + 1) - book.timeAt(at))) / speed;
    const timer = window.setTimeout(() => seekReplay(at + 1), gap);
    return () => window.clearTimeout(timer);
  }, [replay]);

  // Replay (chủ game 31/10): ghi từng bước của trận Vs Máy, Đánh thường, Tuỳ chọn trên máy này; hết trận thì nén và gửi
  // lên máy chủ (mỗi người giữ 10 trận). Trận mở lại giữa chừng (tải lại trang) chỉ ghi từ lúc mở lại.
  const recorder = useRef<ReplayRecorder | null>(null);
  const replaySent = useRef<string | null>(null);
  useEffect(() => {
    if (!duel?.mid || watch || tutorial || trial || sessionStorage.getItem(REPLAY_KEY)) return;
    if (duel.mode !== "ai" && duel.mode !== "net") return;
    const plain = { ...duel, glimpse: null };
    const rec = recorder.current;
    if (rec && rec.mid === duel.mid) {
      rec.push(plain);
      return;
    }
    if (duel.winner !== null) return;
    const quick = Boolean((net as { quick?: boolean } | null)?.quick);
    recorder.current = new ReplayRecorder(duel.mid, duel.mode === "ai" ? "ai" : quick ? "quick" : "custom", duel.mode === "net" ? (net?.seat ?? "host") : "host", plain);
  }, [duel, watch, tutorial, trial, net]);

  function sendReplay(done: Duel) {
    const rec = recorder.current;
    if (!rec || !done.mid || rec.mid !== done.mid || replaySent.current === done.mid) return;
    replaySent.current = done.mid;
    rec.push({ ...done, glimpse: null });
    const mid = done.mid;
    void packReplay(rec.done())
      .then((data) => pushReplay({ data: { id: playerId(), mid, data } }))
      .then((got) => {
        if (got.ok) markReplay(mid);
      })
      .catch(() => undefined);
  }

  // The end of a match in Vs Máy, Đánh thường or Tuỳ chọn: the end scene (chủ game 22/10), then the summary.
  // Elsewhere only the old panel.
  const ended = duel?.winner ?? null;
  useEffect(() => {
    if (!duel || duel.winner === null) {
      setEndStep("wait");
      setGain(null);
      setScene(null);
      againRef.current = false;
      setAgain(false);
      return;
    }
    if (endedAt.current?.mid !== duel.mid) endedAt.current = { mid: duel.mid, at: Date.now() };
    // Người xem trận của bạn bè và người xem lại trận: không cảnh hết trận, không thưởng.
    if (sessionStorage.getItem(WATCH_KEY) || sessionStorage.getItem(REPLAY_KEY)) return;
    const mine = viewerSide(duel, boardActor(duel), net?.seat ?? null);
    // Hồ sơ (chủ game 31/10): trận với người (Đánh thường, Tuỳ chọn) tính chỉ số; Vs Máy chỉ vào lịch sử để xem replay.
    if ((duel.mode === "net" || duel.mode === "ai") && duel.mid && !tutorial && !trial) {
      recordGame({ mid: duel.mid, win: duel.winner === mine, mode: duel.mode === "ai" ? "ai" : (net as { quick?: boolean } | null)?.quick ? "quick" : "custom", cover: duel.faces?.[mine]?.cover ?? null,
        at: Date.now(),
        turns: duel.clock ?? 0,
        mine: deckOf(duel.faces?.[mine]),
        foe: deckOf(duel.faces?.[mine === 0 ? 1 : 0]),
        foeId: duel.faces?.[mine === 0 ? 1 : 0]?.pid ?? undefined,
      });
      sendReplay(duel);
    }
    // Trận mê cung: ghi thắng/thua để /maze áp khi quay về.
    if (duel.mode === "ai" && mazeFight.current) finishMazeBattle({ monsterId: mazeFight.current.monsterId, won: duel.winner === mine });
    // Nhiệm vụ (chủ game 05/11): mọi trận Vs Máy, Đánh thường, Tuỳ chọn đã kết thúc (thua, đầu hàng cũng tính) là đã chơi;
    // thắng Đánh thường là thắng PvP. Mỗi trận tính 1 lần (theo mid), chưa hiện bảng sau trận.
    if ((duel.mode === "ai" || duel.mode === "net") && duel.mid && !tutorial && !trial) {
      const got = noteMatch(duel.mid, duel.mode === "net" && Boolean((net as { quick?: boolean } | null)?.quick) && duel.winner === mine);
      if (got && missionRowsOf(got).length) setGain(got);
    }
    const staged = !tutorial && !trial && (duel.mode === "ai" || duel.mode === "net");
    if (!staged) {
      setEndStep("done");
      return;
    }
    // After the last blow has landed (its lightning reaches the HP in 0.5 s), the losing HP bursts.
    const win = duel.winner === mine;
    const spot = matchBoard(duel.players[(1 - mine) as Side].env, duel.players[mine].env).marks[win ? "foeHp" : "youHp"];
    const timer = window.setTimeout(() => {
      const box = document.querySelector(".board")?.getBoundingClientRect();
      const at = box ? { x: box.left + (spot.x / 100) * box.width, y: box.top + (spot.y / 100) * box.height } : { x: window.innerWidth * 0.15, y: window.innerHeight * (win ? 0.1 : 0.88) };
      setScene({ win, at, tone: win ? "red" : "blue" });
      setEndStep("scene");
    }, 750);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, duel?.mid]);

  useEffect(() => {
    if (!duel || busy || duel.winner !== null || duel.step !== "main" || duel.upkeep || duel.reel?.kind !== "gun" || duel.reel.phase !== "wait") return;
    const seat = netRef.current;
    const actor = boardActor(duel);
    const viewer = viewerSide(duel, actor, seat?.seat ?? null);
    const drives =
      duel.mode === "ai" ||
      ((duel.mode === "hotseat" || duel.mode === "test" || actor === viewer) && duel.turn === viewer);
    if (!drives) return;
    const timer = window.setTimeout(() => {
      let pulled: Duel | null = null;
      setDuel((current) => {
        if (!current?.reel || current.reel.kind !== "gun" || current.reel.phase !== "wait") return current;
        const next = pullReel(current);
        if (next !== current) pulled = next;
        return next;
      });
      const sent = pulled as Duel | null;
      if (!sent || sent.mode !== "net" || !seat) return;
      const ticket = pushGen.current + 1;
      pushGen.current = ticket;
      void pushDuel({ data: { code: seat.code, seat: seat.seat, duel: JSON.stringify({ ...sent, glimpse: null }) } }).then((pushed) => {
        if (ticket !== pushGen.current) return;
        if (!pushed.ok) return;
        rev.current = pushed.rev;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [duel, busy]);

  // The machine pulls its own time wheel (Vs Máy); it lands when the wheel stops, as for the player.
  useEffect(() => {
    const wheel = duel?.wheel;
    if (!duel || !wheel || wheel.sector !== null || duel.mode !== "ai" || !duel.players[1].field.some((mon) => mon?.uid === wheel.uid)) return;
    const timer = window.setTimeout(() => setDuel((current) => (current?.wheel && current.wheel.sector === null ? pullWheel(current) : current)), 900);
    return () => window.clearTimeout(timer);
  }, [duel]);

  useLayoutEffect(() => {
    if (!duel) return;
    const prev = prevDuel.current;
    if (!prev || prev === duel) return;
    const viewerNow: Side = viewerSide(duel, boardActor(duel), netRef.current?.seat ?? null);
    const drops = laserDrops(prev, duel, viewerNow);
    if (!drops.length) return;
    setLaserHp(Object.fromEntries(drops.map((drop) => [drop.key, drop.from])));
  }, [duel]);

  // A new match whose opening hands are not chosen yet (Đấu lại too) plays the VS screen again; after it, the opening
  // hand opens.
  // The tutorial needs no match loading (chủ game 22/10).
  useEffect(() => {
    if (tutorial || trial) setLoaded(true);
  }, [tutorial, trial]);
  const openerLive = Boolean(duel?.opener);
  useEffect(() => {
    if (loaded && introSeen && openerLive && !sessionStorage.getItem(WATCH_KEY) && !sessionStorage.getItem(REPLAY_KEY)) setOpenerOpen(true);
  }, [loaded, introSeen, openerLive]);
  // Hết đổi bài đầu trận (bảng đóng): 3 lá đầu bay từ xấp lên tay mỗi bên, lần lượt (chủ game 30/10).
  // Lá rút bay lên tay (chủ game 30/10): tạo trước khi trình duyệt vẽ, để lá mới không hiện lên tay rồi mới bay.
  // Đầu trận (hết bảng đổi bài): mọi lá trên tay mỗi bên bay lần lượt; sau đó mỗi lần rút là lá vừa thêm vào cuối dự bị
  // hoặc cuối phép trên tay.
  const openerWas = useRef(false);
  const drawPrev = useRef<Duel | null>(null);
  useLayoutEffect(() => {
    const prev = drawPrev.current;
    drawPrev.current = duel;
    if (!duel) return;
    const me = viewer;
    const shufSides = tutorial || replay ? [] : shuffledSides(prev, duel);
    const startShuffle = (sides: Side[]) => {
      if (sides.length === 0 || document.hidden) return;
      setShuf((was) => ({ you: was.you + (sides.includes(me) ? 1 : 0), foe: was.foe + (sides.includes((1 - me) as Side) ? 1 : 0) }));
      for (const side of sides) playCue(side === me ? "shuffleYou" : "shuffleFoe");
    };
    if (openerWas.current && !openerOpen && !duel.opener) {
      openerWas.current = false;
      // Xáo bài xong mới chia 3 lá đầu (chủ game 26/11).
      const swept = [...new Set([...shufflePending.current, ...shufSides])];
      shufflePending.current = [];
      startShuffle(swept);
      const lag = swept.length ? SHUFFLE_MS / 1000 : 0;
      // Lá tự rút của lượt đầu (chủ game 13/11): 3 lá đầu bay lên tay hết, chậm 1 nhịp rồi lá rút mới bay riêng.
      const you = duel.players[me];
      const drawn = you.draws >= 1 ? (you.reserve.length > 2 ? `r:${you.reserve.length - 1}` : you.hand.length > 1 ? `s:${you.hand.length - 1}` : null) : null;
      const mine = [...you.reserve.map((_, i) => `r:${i}`), ...you.hand.map((_, i) => `s:${i}`)].filter((target) => target !== drawn).slice(0, OPENING_CARDS);
      const born: DrawFlight[] = mine.map((target, i) => ({ id: (flightId.current += 1), side: "you", target, delay: lag + i * 0.15, deal: true }));
      for (let i = 0; i < OPENING_CARDS; i += 1) born.push({ id: (flightId.current += 1), side: "foe", delay: lag + i * 0.15, deal: true });
      for (let i = 0; i < OPENING_CARDS; i += 1) playCue("draw", lag + i * 0.15);
      if (drawn) {
        // Lá tự rút của lượt đầu cũng như lần rút thường (chủ game 15/11): hiện giữa màn rồi mới về tay, sau 3 lá đầu.
        const key = (flightId.current += 1);
        setDrawShows((list) => [...list, { key, target: drawn, wait: true }]);
        window.setTimeout(() => {
          setDrawShows((list) => list.map((show) => (show.key === key ? { ...show, wait: false } : show)));
          playPack("flip", 0.26);
          playPack("flash", 0.3);
        }, (AUTO_DRAW_AT + lag) * 1000);
      }
      if (duel.players[1 - me].draws >= 1) born.push({ id: (flightId.current += 1), side: "foe", delay: AUTO_DRAW_AT + lag });
      setFlights((list) => [...list, ...born]);
      return;
    }
    if (openerOpen) openerWas.current = true;
    // Bảng đổi bài còn đóng dần: lá tự rút của lượt đầu chưa bay ở đây, nó bay sau 3 lá đầu (nhánh trên).
    // Đổi bài đầu trận: nhớ ai đã xáo, chờ bảng đóng mới chạy hiệu ứng.
    if ((openerWas.current || duel.opener) && !watch) {
      if (shufSides.length) shufflePending.current = [...new Set([...shufflePending.current, ...shufSides])];
    }
    if (openerWas.current) return;
    if (!prev || !loaded || duel.opener || prev.mid !== duel.mid) return;
    startShuffle(shufSides);
    const born: DrawFlight[] = [];
    // Chủ game 16/11: lá đối thủ đánh ra rời khay bài thấy rõ: quái bay úp xuống ô rồi lật, phép loé sáng rồi tan.
    {
      const foeSide = (1 - me) as Side;
      const wasFoe = prev.players[foeSide];
      const nowFoe = duel.players[foeSide];
      const known = new Set(wasFoe.field.map((mon) => mon?.uid));
      if (nowFoe.reserve.length < wasFoe.reserve.length) {
        nowFoe.field.forEach((mon, index) => {
          if (mon && !known.has(mon.uid) && !(mon.lurk) && !seaVeiled(duel, me, mon.uid)) {
            born.push({ id: (flightId.current += 1), side: "foe", delay: 0, play: "mon", slot: `${screenSide(foeSide, me)}-${index}` });
          }
        });
      }
      // Phép bị bỏ khỏi tay (Gặt hồn, Sinh mệnh mới; chủ game 22/11) không phải phép đánh ra: nó cháy tan, không loé trên khay.
      const burned = duel.discard && duel.discard.id !== prev.discard?.id ? duel.discard.drops.filter((drop) => drop.side === foeSide && drop.at.startsWith("s:")).length : 0;
      if (nowFoe.hand.length < wasFoe.hand.length - burned) born.push({ id: (flightId.current += 1), side: "foe", delay: 0, play: "spell" });
    }
    ([0, 1] as const).forEach((side) => {
      const was = prev.players[side];
      const now = duel.players[side];
      const n = Math.min(3, now.draws - was.draws);
      if (n <= 0) return;
      if (side !== me) {
        for (let i = 0; i < n; i += 1) born.push({ id: (flightId.current += 1), side: "foe", delay: i * 0.14 });
        return;
      }
      const fresh = [
        ...now.reserve.slice(was.reserve.length).map((_, i) => `r:${was.reserve.length + i}`),
        ...now.hand.slice(was.hand.length).map((_, i) => `s:${was.hand.length + i}`),
      ].slice(-n);
      // Lá mình rút hiện ra giữa màn trước rồi mới về tay (chủ game 13/11); Hướng dẫn, xem trận, xem lại giữ lá bay thẳng.
      if (!tutorial && !replay && !watch) {
        const shows = fresh.map((target) => ({ key: (flightId.current += 1), target }));
        setDrawShows((list) => [...list, ...shows]);
        playPack("flip", 0.26);
        playPack("flash", 0.3);
        return;
      }
      fresh.forEach((target, i) => born.push({ id: (flightId.current += 1), side: "you", target, delay: i * 0.14 }));
    });
    if (born.length) setFlights((list) => [...list, ...born]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duel, openerOpen, loaded]);

  // Lá bị bỏ khỏi tay: dựng lá bay từ chỗ cũ của nó (đo ở lần vẽ trước), phía đối thủ là lá úp trong khay.
  useLayoutEffect(() => {
    const old = handRects.current;
    const prev = burnPrev.current;
    if (!duel) return;
    const seen = burnSeen.current;
    const now = duel.discard;
    if (seen.mid !== duel.mid) {
      burnSeen.current = { mid: duel.mid ?? null, id: now?.id ?? 0 };
      return;
    }
    if (!now || now.id === seen.id) return;
    burnSeen.current = { mid: duel.mid ?? null, id: now.id };
    if (!loaded || document.hidden) return;
    const born: Array<{ id: number; rect: BurnRect; face: ReactNode }> = [];
    for (const drop of now.drops) {
      const rect = drop.side === viewer ? old[drop.at] : undefined;
      let face: ReactNode = null;
      let place: BurnRect | undefined = rect;
      if (drop.side === viewer) {
        const hit = /^([rs]):(\d+)$/.exec(drop.at);
        const was = hit && prev ? prev.players[viewer] : null;
        if (hit && was && place) {
          const index = Number(hit[2]);
          if (hit[1] === "r") {
            const held = was.reserve[index];
            const card = held ? monsterCard(held.id) : null;
            if (held && card) face = <CardFace monster={card} hand level={held.saved?.level ?? 1} live={reserveLive(held, card)} fake={held.fake} gems={held.toll ? `${card.gems}+1` : undefined} />;
          } else {
            const spell = was.hand[index];
            if (spell) face = <CardFace spellId={spell} hand gems={was.tolls?.[index] ? `${spellCard(spell)?.gems ?? 0}+1` : undefined} />;
          }
        }
      } else {
        const back = document.querySelector<HTMLElement>(".foe-fan img");
        const box = back?.getBoundingClientRect();
        if (box && box.width > 0) {
          place = { left: box.left, top: box.top, width: box.width, height: box.height };
          face = <img src="/ui/card-back-foe.webp" alt="" draggable={false} />;
        }
      }
      if (face && place) born.push({ id: (flightId.current += 1), rect: place, face });
    }
    if (born.length) {
      playCue("burn");
      setBurns((list) => [...list, ...born]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duel?.discard?.id, duel?.mid]);
  // Sau mỗi lần vẽ: nhớ chỗ từng lá trên tay và ván hiện tại, để lần bỏ lá kế còn biết lá nằm đâu và là lá gì.
  useLayoutEffect(() => {
    const rects: Record<string, BurnRect> = {};
    document.querySelectorAll<HTMLElement>(".hand [data-hand]").forEach((pick) => {
      const box = pick.querySelector<HTMLElement>(".hand-card")?.getBoundingClientRect();
      const key = pick.getAttribute("data-hand");
      if (box && key && box.width > 0) rects[key] = { left: box.left, top: box.top, width: box.width, height: box.height };
    });
    handRects.current = rects;
    burnPrev.current = duel;
  });

  // The reaction icons fade out a moment after the wait is over and then report it (onClosed); this is the backstop
  // in case the fade never runs.
  useEffect(() => {
    if (chain.length === 0) {
      lineSeats.current.clear();
      keptSpots.current.clear();
    }
    if (duel?.step === "respond" || chain.length === 0) return;
    const timer = window.setTimeout(() => setChain((list) => (list.every((orb) => orb.done) ? [] : list)), 5000);
    return () => window.clearTimeout(timer);
  }, [duel?.step, chain]);

  useEffect(() => {
    if (!duel) return;
    const prev = prevDuel.current;
    if (prev === duel) return;
    prevDuel.current = duel;
    for (const id of laserTimers.current) window.clearTimeout(id);
    laserTimers.current = [];
    if (!prev) {
      // A match opened while something waits (a reload in an online match): the line shows what waits.
      const reach = reachFor(duel);
      setChain((list) => stepChain(null, duel, list, reach));
      return;
    }
    // A new match (Đấu lại, Chơi lại) starts clean: nothing of the last one plays out on it.
    if (prev.mid !== duel.mid) {
      setFloaters([]);
      setMotion({ pops: [], lunges: [], hits: [] });
      setBurst(null);
      setChain([]);
      return;
    }
    if (prev.step !== "respond" && duel.step === "respond") windupText.current = duel.live || null;
    if (prev.step === "respond" && duel.step !== "respond") {
      const open = windupText.current;
      windupText.current = null;
      if (open && duel.live && open !== duel.live) dropTrail(open);
    }
    seal(prev, duel);
    const viewerNow: Side = viewerSide(duel, boardActor(duel), netRef.current?.seat ?? null);
    if (seenViewer.current !== viewerNow) {
      seenViewer.current = viewerNow;
      keptSpots.current.clear();
      setFloaters([]);
      setMotion({ pops: [], lunges: [], hits: [] });
      setBurst(null);
    }
    const quiet = hiddenStrike(prev, duel, viewerNow) && !veilSlain(prev, duel, viewerNow);
    if (veilSlain(prev, duel, viewerNow)) {
      const names = fallenSea(prev, duel, viewerNow);
      const line = names.every((name) => duel.live.includes(name)) ? duel.live : `${duel.live} ${names.join(", ")} bị hạ.`;
      holdNotice(line, false, duel.clock);
    }
    if (duel.step !== "respond") {
      if (prev.step === "respond") {
        setBlessArm(false);
        setBlockChoice(null);
        setReflectPick(null);
        setAmbushPick(null);
      }
    } else {
      const answerReady = (id: string, state: Duel) => state.players[viewerNow].hand.some((held, index) => held === id && answerUsable(id, state, viewerNow, index));
      if ([...ANSWER_SPELLS].some((id) => answerReady(id, duel) && !answerReady(id, prev))) setHand("spell");
    }
    // Dòng chảy đợt 2: whom it lands on; a random one shows whom its roll hits once confirmed (chủ game 28/10, 29/10).
    const reach = reachFor(duel);
    setChain((list) => stepChain(prev, duel, list, reach));
    if (prev.mode === "ai" && duel.mode === "ai") {
      try {
        const learned = absorb(loadHabits(), watchSnap(prev), watchSnap(duel), scratch.current);
        scratch.current = learned.scratch;
        saveHabits(learned.habits);
      } catch {
        // Lỗi thói quen không được chặn việc lưu ván.
      }
    }
    const rose = ([0, 1] as Side[]).find((side) => duel.players[side].stars > prev.players[side].stars);
    if (rose !== undefined) {
      setStarFlash(rose);
      window.clearTimeout(starTimer.current);
      starTimer.current = window.setTimeout(() => setStarFlash(null), 3500);
    }
    if (duel.winner !== null && prev.winner === null && !(!tutorial && !trial && (duel.mode === "ai" || duel.mode === "net"))) playCue(duel.winner === viewerNow ? "win" : "lose");
    if (rose !== undefined) playCue("star");
    const spent = spentSpell(prev, duel);
    // K2 (chủ game 14/11): kỹ năng đã chờ trong chuỗi vừa được thông qua (cả hai bỏ qua): quái dùng nó tụ sáng tại chỗ, giật về
    // phía mục tiêu, rồi hiệu ứng, âm và số của kỹ năng mới tới (`pre` ms sau). Bị chặn, bị hoá giải, vòng quay / máy quay
    // mở ra thì không.
    // Pháo kích (chủ game 23/11): chuỗi xong thì quái làm đạn leo lên lưng rùa (MOUNT_MS), chờ trên nòng (AIM_HOLD_MS)
    // rồi mới lao vào mục tiêu như đòn đánh thường và nổ kiểu Kuriboh; mọi số, âm và hiệu ứng chờ tới lúc đó.
    const cannon = (() => {
      const boom = duel.boom;
      if (quiet || tutorial || !boom?.from || boom.id === prev.boom?.id) return null;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return null;
      const ammo = boom.uids.find((uid) => boom.from?.[uid]);
      const turtle = ammo ? boom.from[ammo] : null;
      if (!ammo || !turtle) return null;
      const seat = seatOf(prev, ammo);
      const base = seatOf(prev, turtle);
      if (!seat || !base) return null;
      const home = SLOT_BOX[screenSide(seat.side, viewerNow)][seat.index];
      const deck = SLOT_BOX[screenSide(base.side, viewerNow)][base.index];
      const to = boom.to[ammo] ?? "";
      const wallSpot = (side: Side) => {
        const layout = matchBoard(duel.players[(1 - viewerNow) as Side].env, duel.players[viewerNow].env);
        return side === viewerNow ? layout.wall : layout.wallFoe;
      };
      const marksNow = matchBoard(duel.players[(1 - viewerNow) as Side].env, duel.players[viewerNow].env).marks;
      const aimAt = to.startsWith("face:")
        ? (screenSide(Number(to.slice(5)) as Side, viewerNow) === 1 ? marksNow.foeHp : marksNow.youHp)
        : to.startsWith("wall:")
          ? wallSpot(Number(to.slice(5)) as Side)
          : (() => {
              const where = seatOf(prev, to);
              if (!where) return null;
              const box = SLOT_BOX[screenSide(where.side, viewerNow)][where.index];
              return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
            })();
      // Nằm trên lưng rùa, lệch về phía mục tiêu, còn thấy khoảng 1/4 lá rùa bên dưới.
      const deckMid = { x: deck.x + deck.w / 2, y: deck.y + deck.h / 2 };
      const dx = aimAt ? aimAt.x - deckMid.x : 0;
      const dy = aimAt ? (aimAt.y - deckMid.y) / boardAspect() : -1;
      const far = Math.hypot(dx, dy) || 1;
      const lean = { x: (dx / far) * deck.w * 0.3, y: (dy / far) * deck.w * 0.3 * boardAspect() };
      const seatMid = { x: home.x + home.w / 2, y: home.y + home.h / 2 };
      const mount = { x: ((deckMid.x + lean.x - seatMid.x) * 100) / home.w, y: ((deckMid.y + lean.y - seatMid.y) * 100) / home.h };
      return { ammo, mount, ang: Math.atan2(dy, dx) };
    })();
    const rouse = (() => {
      if (cannon) return null;
      const cast = prev.pending;
      if (quiet || tutorial || prev.mid !== duel.mid || prev.step !== "respond" || !cast || duel.pending) return null;
      if (cast.kind !== "beam" && cast.kind !== "gnaw-skill" && !(cast.kind === "face" && cast.skill)) return null;
      if (prev.hold?.ambush || prev.hold?.egg || (duel.reel && !prev.reel) || (duel.wheel && !prev.wheel)) return null;
      const known = new Set((prev.events ?? []).map((row) => row.id));
      if (!(duel.events ?? []).some((row) => !known.has(row.id) && row.kind === "pass")) return null;
      if (duel.fx !== prev.fx && /chặn kỹ năng|chặn đòn tấn công|Hấp thụ ma pháp/.test(duel.live)) return null;
      const uid = cast.kind === "face" ? cast.attacker : cast.caster;
      const seat = seatOf(prev, uid);
      const mon = fieldMon(prev, uid);
      if (!seat || !mon) return null;
      const row = screenSide(seat.side, viewerNow);
      const home = SLOT_BOX[row][seat.index];
      const from = { x: home.x + home.w / 2, y: home.y + home.h / 2 };
      const aim = aimPoint(prev, cast, viewerNow) ?? { x: from.x, y: from.y + (row === 0 ? -20 : 20) };
      const dx = aim.x - from.x;
      const dy = (aim.y - from.y) / boardAspect();
      const far = Math.hypot(dx, dy);
      const reach = 2.6;
      const jolt = far < 1 ? { x: 0, y: 0 } : { x: (((dx / far) * reach) * 100) / home.w, y: (((dy / far) * reach * boardAspect()) * 100) / home.h };
      const index = cast.kind === "face" ? (mon.cardId === "may-quay-thuong" ? 1 : 0) : cast.kind === "beam" ? cast.index : 0;
      const facts = skillFacts(mon, mon.cardId, index);
      const tone = SKILL_GLOW[facts?.slow ? "slow" : facts?.buff ? "buff" : facts?.kind ?? "active"] ?? SKILL_GLOW.active;
      return { uid, from, jolt, ang: far < 1 ? undefined : Math.atan2(dy, dx), tone };
    })();
    const pre = cannon ? CANNON_MS : rouse ? ROUSE_MS : 0;
    if (cannon) {
      setThrust({ uid: cannon.ammo, ...cannon.mount, phase: "mount", ang: cannon.ang });
      playHit("dash", 0);
    }
    const cueAt = (kind: Cue, delay?: number, offset = 0) => playCue(kind, delay, offset, pre / 1000);
    const fxAt = (event: FxEvent) => {
      if (pre) window.setTimeout(() => emitFx(event), pre);
      else emitFx(event);
    };
    if (rouse) {
      const { uid, jolt, tone } = rouse;
      setThrust({ uid, x: 0, y: 0, phase: "rouse", tone });
      window.setTimeout(() => setThrust((now) => (now?.uid === uid && now.phase === "rouse" ? { uid, ...jolt, phase: "cast", tone } : now)), ROUSE_CAST);
      window.setTimeout(() => setThrust((now) => (now?.uid === uid && now.phase === "cast" ? { uid, x: 0, y: 0, phase: "cast", tone } : now)), ROUSE_CAST + 120);
      window.setTimeout(() => setThrust((now) => (now?.uid === uid && now.phase === "cast" ? null : now)), ROUSE_MS + 140);
      emitFx({ t: "rouse", x: rouse.from.x, y: rouse.from.y, color: tone, ang: rouse.ang });
      playHit("rouse");
      // Máu trên lá và trên viên máu giữ số cũ tới lúc hiệu ứng của kỹ năng chạm.
      const held: Record<string, number> = {};
      for (const side of [0, 1] as const) {
        if (duel.players[side].hp !== prev.players[side].hp) held[`face:${side}`] = prev.players[side].hp;
        for (const was of prev.players[side].field) {
          const now = was ? fieldMon(duel, was.uid) : null;
          if (was && now && now.hp !== was.hp) held[`mon:${was.uid}`] = was.hp;
        }
      }
      const keys = Object.keys(held);
      if (keys.length) {
        setHpHold((now) => ({ ...now, ...held }));
        window.setTimeout(() => setHpHold((now) => {
          const rest = { ...now };
          for (const key of keys) delete rest[key];
          return rest;
        }), ROUSE_MS);
      }
    }
    // K3: phép không vào chuỗi phản ứng (dùng ở bước chính, có tác dụng ngay) cũng hiện to giữa sân; phép vào chuỗi do
    // ReactionLine lo (lá thu vào icon của nó).
    const castNow = (duel.events ?? []).slice((prev.events ?? []).length).find((row) => row.kind === "spell" && row.ok && row.cardId);
    // Lá trang bị nhập vào quái (chủ game 16/11): thay lá phép to giữa sân cho Sừng lôi phá. Quái đang bị che (Biển sâu, Mũ
    // ma pháp, quái ẩn) của đối thủ thì giữ cách cũ để không lộ lá.
    const equipNow = (() => {
      if (!HORN_EQUIP_SHOW || spent !== "sung-loi-pha" || prev.mid !== duel.mid) return null;
      for (const side of [0, 1] as const) {
        for (let index = 0; index < duel.players[side].field.length; index += 1) {
          const mon = duel.players[side].field[index];
          const was = prev.players[side].field[index];
          if (!mon?.horn || !was || was.uid !== mon.uid || was.horn) continue;
          if (side !== viewerNow && (seaVeiled(duel, viewerNow, mon.uid) || duel.players[side].hats || mon.lurk)) return null;
          const before = visibleStats(was, prev.players[side].field);
          const after = visibleStats(mon, duel.players[side].field);
          return { key: `${duel.fx}:${mon.uid}`, spellId: spent, uid: mon.uid, slot: `${side}-${index}`, from: side === viewerNow ? ("hand" as const) : ("foe" as const), atkFrom: before.atk, atkTo: after.atk, fromBlue: Boolean(before.blueAtk) };
        }
      }
      return null;
    })();
    if (equipNow) {
      setEquipShow(equipNow);
      playCue("equipMerge");
    }
    if (castNow?.cardId && !equipNow && prev.mid === duel.mid && duel.step !== "respond" && prev.step !== "respond") {
      setCastShow({ key: castNow.id, id: castNow.cardId });
      playLine("cast");
    }
    // K4 (chủ game 14/11): đối thủ vừa dùng một phép hay một kỹ năng (vào chuỗi hay không): bảng ghi tên và việc nó làm.
    const foeAct = (() => {
      if (tutorial || duel.mode === "test" || duel.mode === "hotseat" || prev.mid !== duel.mid || quiet) return null;
      const known = new Set((prev.events ?? []).map((row) => row.id));
      const rows = (duel.events ?? []).filter((row) => !known.has(row.id) && row.ok && row.actor !== viewerNow && row.cardId && (row.kind === "spell" || row.kind === "skill"));
      return rows[rows.length - 1] ?? null;
    })();
    if (foeAct?.cardId) {
      const actor = foeAct.actor as Side;
      if (foeAct.kind === "spell") {
        const card = SPELLS.find((spell) => spell.id === foeAct.cardId);
        const brief = spellBrief(duel, foeAct.cardId, actor).split("\n").slice(1).filter(Boolean);
        if (card) {
          setFoeNote({ key: foeAct.id, head: { name: card.name, tone: speedTone(card.id), art: spellSrc(card.id), who: tr("Phép của đối thủ") }, lines: brief });
          playLine("note", 0.12);
        }
      } else {
        const pending = duel.pending;
        const waiting = pending?.kind === "beam" || pending?.kind === "gnaw-skill" ? pending.caster : pending?.kind === "face" ? pending.attacker : "";
        const held = waiting ? fieldMon(duel, waiting) : null;
        const mon =
          (held && held.cardId === foeAct.cardId ? held : null) ??
          duel.players[actor].field.find((unit) => unit?.cardId === foeAct.cardId) ??
          prev.players[actor].field.find((unit) => unit?.cardId === foeAct.cardId) ??
          null;
        const facts = skillFacts(mon, foeAct.cardId, foeAct.skill ?? 0);
        if (facts?.name && !(mon && seaVeiled(duel, viewerNow, mon.uid))) {
          const target = foeAct.target?.kind === "monster" && foeAct.target.uid ? fieldMon(duel, foeAct.target.uid) : null;
          const brief = skillBrief({ duel, cardId: facts.cardId, name: facts.name, mon, target }).split("\n").slice(1).filter(Boolean);
          const card = monsterCard(facts.cardId);
          setFoeNote({
            key: foeAct.id,
            head: { name: facts.name, tone: SKILL_GLOW[facts.slow ? "slow" : facts.buff ? "buff" : facts.kind] ?? SKILL_GLOW.active, icon: facts.icon, kind: facts.slow ? "slow" : facts.buff ? "buff" : facts.kind, art: artSrc(facts.cardId, mon?.level ?? 1), who: card ? tr(card.name) : "" },
            lines: brief,
          });
          playLine("note", 0.12);
        }
      }
    }
    // Chủ game 16/11: quái vừa đưa kỹ năng lên hàng chờ (mình hoặc đối thủ) phát quang một lần, cùng lúc bảng rút gọn của kỹ năng.
    const flare = (() => {
      const now = duel.pending;
      if (quiet || tutorial || prev.mid !== duel.mid || !now) return null;
      if (now.kind !== "beam" && now.kind !== "gnaw-skill" && !(now.kind === "face" && now.skill)) return null;
      const uid = now.kind === "face" ? now.attacker : now.caster;
      const was = prev.pending;
      if (was && (was.kind === "face" ? was.attacker : was.kind === "beam" || was.kind === "gnaw-skill" ? was.caster : "") === uid) return null;
      const seat = seatOf(duel, uid);
      const mon = fieldMon(duel, uid);
      if (!seat || !mon || seaVeiled(duel, viewerNow, mon.uid)) return null;
      const box = SLOT_BOX[screenSide(seat.side, viewerNow)][seat.index];
      return { uid, x: box.x + box.w / 2, y: box.y + box.h / 2, w: box.w };
    })();
    if (flare) {
      emitFx({ t: "flare", x: flare.x, y: flare.y, w: flare.w });
      const { uid } = flare;
      setLift(uid);
      window.setTimeout(() => setLift((now) => (now === uid ? null : now)), FLARE_MS);
    }
    // Tiến hoá của Tê giác (chủ game 27/11): đủ điều kiện thì quái loé sáng như skill bị động kích hoạt, và đối thủ thấy
    // bảng tóm tắt skill 8 giây (bảng nhỏ đầu màn như K4); người tiến hoá thấy màn xác nhận ngay sau đó.
    if (!quiet && !tutorial && prev.mid === duel.mid && duel.rhinoAsk && duel.rhinoAsk.uid !== prev.rhinoAsk?.uid) {
      const ask = duel.rhinoAsk;
      const seat = seatOf(duel, ask.uid);
      const mon = fieldMon(duel, ask.uid);
      if (seat && mon && !seaVeiled(duel, viewerNow, mon.uid)) {
        const box = SLOT_BOX[screenSide(seat.side, viewerNow)][seat.index];
        emitFx({ t: "flare", x: box.x + box.w / 2, y: box.y + box.h / 2, w: box.w });
        setLift(ask.uid);
        window.setTimeout(() => setLift((now) => (now === ask.uid ? null : now)), FLARE_MS);
        if (seat.side !== viewerNow && duel.mode !== "test" && duel.mode !== "hotseat") {
          const form = monsterCard(ask.level >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang");
          setFoeNote({
            key: `rhino:${ask.uid}:${ask.level}`,
            head: { name: "Tiến hoá", tone: "#b58cff", icon: "round-star", kind: "passive", art: artSrc("te-giac-be-con", mon.level ?? 1), who: fieldName(mon) },
            lines: [`Tiến hoá thành ${form?.name ?? ""}, tiêu hao 1 mana.`],
          });
          playLine("note", 0.12);
        }
      }
    }
    // Quái ẩn vừa lật mà còn trên sân: lá của mình lật mặt, bên đối thủ sương mù tan đi (chủ game 21/11).
    if (!quiet && !tutorial && prev.mid === duel.mid) {
      const fresh: Record<string, "own" | "foe"> = {};
      for (const side of [0, 1] as const) {
        for (const mon of duel.players[side].field) {
          if (!mon || mon.lurk) continue;
          const was = fieldMon(prev, mon.uid);
          if (was?.lurk) fresh[mon.uid] = side === viewerNow ? "own" : "foe";
        }
      }
      const keys = Object.keys(fresh);
      if (keys.length > 0) {
        setUnveil((now) => ({ ...now, ...fresh }));
        for (const uid of keys) {
          window.setTimeout(() => setUnveil((now) => Object.fromEntries(Object.entries(now).filter(([key]) => key !== uid))), fresh[uid] === "foe" ? FOG_MS : 1100);
        }
      }
    }
    // Linh hoạt (chủ game 18/11), quái ẩn kích hoạt / Đắm tàu / Phản phép (21/11): chớp sáng bằng hiệu ứng phát quang có
    // sẵn, cả hai bên đều thấy. Quái ẩn về xấp (sương mù) thì chớp ở ô nó vừa rời.
    if (!quiet && !tutorial && prev.mid === duel.mid && duel.dodge && duel.dodge.id !== prev.dodge?.id) {
      for (const uid of duel.dodge.uids) {
        const here = seatOf(duel, uid);
        const seat = here ?? seatOf(prev, uid);
        const mon = fieldMon(duel, uid) ?? fieldMon(prev, uid);
        if (!seat || !mon || (here && seaVeiled(duel, viewerNow, mon.uid))) continue;
        const box = SLOT_BOX[screenSide(seat.side, viewerNow)][seat.index];
        emitFx({ t: "flare", x: box.x + box.w / 2, y: box.y + box.h / 2, w: box.w });
        setLift(uid);
        window.setTimeout(() => setLift((now) => (now === uid ? null : now)), FLARE_MS);
      }
    }
    if (!quiet && !tutorial && prev.mid === duel.mid && duel.drain && duel.drain.id !== prev.drain?.id) {
      const drain = { side: duel.drain.side, orb: duel.drain.orb, gems: duel.drain.gems };
      setDrainHold(drain);
      window.setTimeout(() => {
        setDrainHold(null);
        setDrainBlink(drain);
        window.setTimeout(() => setDrainBlink(null), 1300);
      }, DRAIN_WAIT);
    }
    const blocked = Boolean(duel.hold?.blocker) && duel.hold?.blocker !== prev.hold?.blocker;
    const beam = duel.pending?.kind === "beam" && prev.pending?.kind !== "beam";
    const attackNow = duel.pending?.kind === "face" || duel.pending?.kind === "melee" ? duel.pending : null;
    const attackWas = prev.pending?.kind === "face" || prev.pending?.kind === "melee" ? prev.pending : null;
    const lunged = Boolean(attackNow && (!attackWas || attackWas.attacker !== attackNow.attacker || attackWas.kind !== attackNow.kind));
    const hornNow = attackNow ? Boolean(fieldMon(duel, attackNow.attacker)?.horn) : false;
    const whipNow = Boolean(attackNow && !hornNow && fieldMon(duel, attackNow.attacker)?.bolt);
    const struck = duel.tone === "hit" && duel.fx !== prev.fx;
    const drew = ([0, 1] as const).some((side) => duel.players[side].draws > prev.players[side].draws);
    const summoned = ([0, 1] as const).some((side) =>
      duel.players[side].field.some((mon, index) => mon && !prev.players[side].field[index]),
    );
    const gazing = attackNow ? Boolean(fieldMon(duel, attackNow.attacker)?.gaze && !fieldMon(duel, attackNow.attacker)?.horn) : false;
    const wasGaze = Boolean(attackWas && !attackNow && fieldMon(prev, attackWas.attacker)?.gaze && !fieldMon(prev, attackWas.attacker)?.horn);
    const hellFace = Boolean(lunged && attackNow?.kind === "face" && attackNow.skill);
    const said = duel.fx !== prev.fx ? duel.live : "";
    const whipBoom = Boolean(attackWas && !attackNow && fieldMon(prev, attackWas.attacker)?.bolt && !fieldMon(prev, attackWas.attacker)?.horn && /sát thương phép/.test(said));
    const gnawed = gnawBoosted(prev, duel);
    const beamCaster = beam && duel.pending?.kind === "beam" ? fieldMon(duel, duel.pending.caster)?.cardId ?? "" : "";
    const beamKill = beamCaster === "ga-he-dang-so" || isHexer(beamCaster) || beamCaster === "mo-voi-ma-mut";
    const monsterKill = !spent && duel.tone === "spell" && /sát thương phép|tiêu diệt/i.test(said);
    const cameFromBeam = prev.pending?.kind === "beam";
    const beamWasSwordsman = cameFromBeam && prev.pending?.kind === "beam" && fieldMon(prev, prev.pending.caster)?.cardId === "kiem-si-lua-thieng";
    const hellBoom = /Cầu lửa địa ngục/.test(said) && /sát thương|vật lý|phép|chuẩn/.test(said);
    const demonBoom = /Hoả cầu địa ngục/.test(said) && /sát thương chuẩn/.test(said);
    const swordBoom = /sát thương phép/.test(said) && (/Vệt Lửa|Lửa rồng thiêng|Đòn thêm|Truy cùng diệt tận|Hoả thần long|Cầu lửa|Hoả cầu(?! địa ngục)/.test(said) || (cameFromBeam && beamWasSwordsman));
    const curseIndex =
      duel.skill?.id === "loi-nguyen-cua-rong"
        ? duel.skill.index
        : cameFromBeam && prev.pending?.kind === "beam" && fieldMon(prev, prev.pending.caster)?.cardId === "loi-nguyen-cua-rong"
          ? prev.pending.index
          : null;
    const curseBoom = curseIndex !== null && skillLook("loi-nguyen-cua-rong", curseIndex) === "fire" && /sát thương chuẩn/.test(said);
    const firePrep =
      (beam &&
        duel.pending?.kind === "beam" &&
        (beamCaster === "kiem-si-lua-thieng" || beamCaster === "mat-do-tan-pha" || beamCaster === "loi-nguyen-cua-rong" || beamCaster === "rong-ac-ma" || (beamCaster === "rong-phun-hoa-cau" && duel.pending.index === 1))) ||
      hellFace;
    const beamIndex = beam && duel.pending?.kind === "beam" ? duel.pending.index : -1;
    // Skill nước có video riêng kèm âm của video (chủ game 06/11): bỏ âm nổ cũ.
    const waterIds = ["trai-tim-hai-long", "con-thinh-no-cua-hai-vuong"];
    const waterCast =
      waterIds.includes(beamCaster) ||
      waterIds.includes(duel.skill?.id ?? "") ||
      (prev.pending?.kind === "beam" && waterIds.includes(fieldMon(prev, prev.pending.caster)?.cardId ?? ""));
    const damageStart = beam && damageShot(beamCaster, beamIndex) && !firePrep && !beamKill && !waterCast && skillLook(beamCaster, beamIndex) !== "gun";
    const beeBind = beam && beamCaster === "ong-khong-lo";
    const beeLand = prev.pending?.kind !== "beam" && /Ong khổng lồ gây tê liệt/.test(said);
    const wasHorn = Boolean(attackWas && !attackNow && fieldMon(prev, attackWas.attacker)?.horn);
    const hornBoom = !gazing && !wasGaze && !attackNow && ((duel.tone === "spell" && /Sấm lôi phá[\s\S]*sát thương phép/.test(said)) || (wasHorn && /sát thương phép/.test(said)));
    const gazeBoom = wasGaze && /sát thương phép|sát thương chuẩn/.test(said);
    const doomCast = duel.pending?.kind === "spell" && duel.pending.cardId === "sam-set-tan-the" && !(prev.pending?.kind === "spell" && prev.pending.cardId === "sam-set-tan-the");
    const picked = spellFxLook("sam-set-tan-the");
    const doomFx = picked === "fire" || picked === "gun" || picked === "spark" || picked === "none" ? picked : "bolt";
    const doomLook = /Sấm sét tận thế/.test(said) && !/đang thi triển/.test(said) ? doomFx : null;
    const lashNow = duel.pending?.kind === "lash" ? duel.pending : null;
    const lashWas = prev.pending?.kind === "lash" ? prev.pending : null;
    const lashOpen = Boolean(lashNow && !lashWas);
    const lashBoom = Boolean(lashWas && !lashNow && !/Hấp thụ ma pháp nuốt/.test(said));
    if (quiet && (lunged || beam)) cueAt("veil");
    const prepGun =
      (beam && duel.pending?.kind === "beam" && skillLook(beamCaster, duel.pending.index) === "gun") ||
      (hellFace && attackNow ? skillLook(fieldMon(duel, attackNow.attacker)?.cardId ?? "", 0) === "gun" : false);
    // Núi dung nham: the eruption, then the fire spell's explosion part on every target hit (owner, 19/10).
    if (!quiet && duel.lava && duel.lava.seq !== prev.lava?.seq) {
      cueAt("eruption");
      duel.lava.hits.forEach((hit, order) => {
        let point: { x: number; y: number } | null = null;
        if (hit.uid === null) {
          const box = HP_BOX[screenSide(hit.side, viewerNow)];
          point = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
        } else {
          const live = duel.players[hit.side].field.findIndex((mon) => mon?.uid === hit.uid);
          const was = prev.players[hit.side].field.findIndex((mon) => mon?.uid === hit.uid);
          const index = live >= 0 ? live : was;
          point = index >= 0 ? (SLOT_POS[screenSide(hit.side, viewerNow)][index] ?? null) : null;
        }
        window.setTimeout(() => {
          cueAt("swordBoom");
          if (point && fireBlastOn()) fxAt({ t: "fire", x: point.x, y: point.y });
        }, 2300 + order * 280);
      });
    }
    if (!quiet && firePrep && !prepGun) cueAt("firePrep");
    if (!quiet && (blocked || gnawed)) cueAt("block");
    // A normal attack landing: the attacker thrusts in, the blow lands ~0.11 s later, the HP number waits for the
    // lightning to reach it.
    const hud = matchBoard(duel.players[(1 - viewerNow) as Side].env, duel.players[viewerNow].env).marks;
    const hudWalls = matchBoard(duel.players[(1 - viewerNow) as Side].env, duel.players[viewerNow].env);
    const landing = quiet ? null : (attackLanding(prev, duel, viewerNow, hud) ?? boomLanding(prev, duel, viewerNow, hud, (side) => (side === viewerNow ? hudWalls.wall : hudWalls.wallFoe)));
    // Kuriboh phát nổ (chủ game 21/11): vụ nổ ở giữa hai lá lúc chạm, lá Kuriboh còn đứng đó tới đỉnh nổ rồi mất hẳn, không vỡ lá.
    const boomOn = !quiet && !tutorial && Boolean(duel.boom && duel.boom.id !== prev.boom?.id) && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const boomIds = new Set<string>(boomOn ? duel.boom?.uids ?? [] : []);
    // Đòn tông có tiếng riêng (lao + va): tiếng trúng đòn cũ không phát chồng lên nó (chủ game 14/11).
    const rammed = Boolean(landing);
    if (!quiet && struck && spent !== "phuc-kich" && !curseBoom && !rammed) cueAt("hit");
    const struckMelee = prev.pending?.kind === "melee" ? prev.pending : null;
    const riderHit = Boolean(struck && struckMelee && (fieldMon(prev, struckMelee.attacker)?.cardId === "ky-si-cuoi-rong" || fieldMon(prev, prev.hold?.blocker ?? struckMelee.defender)?.cardId === "ky-si-cuoi-rong"));
    if (!quiet && riderHit && struckMelee) {
      const ids = new Set<string>();
      if (duel.skill?.id === "ky-si-cuoi-rong") for (const id of duel.skill.hits ?? []) ids.add(id);
      else {
        ids.add(struckMelee.attacker);
        ids.add(prev.hold?.blocker ?? struckMelee.defender);
      }
      const points: { x: number; y: number }[] = [];
      for (const id of ids) {
        for (const side of [0, 1] as const) {
          const live = duel.players[side].field.findIndex((mon) => mon?.uid === id);
          const was = prev.players[side].field.findIndex((mon) => mon?.uid === id);
          const index = live >= 0 ? live : was;
          const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
          if (spot) points.push(spot);
        }
      }
      window.setTimeout(() => cueAt("swordBoom"), 512);
      window.setTimeout(() => {
        if (fireBlastOn()) for (const point of points) fxAt({ t: "fire", x: point.x, y: point.y });
      }, 320);
    }
    if (!quiet && spent === "phuc-kich" && /phục kích/.test(said)) cueAt("attack");
    if (!quiet && lunged && !hornNow && !gazing && !hellFace && !whipNow && spent !== "phuc-kich") {
      cueAt("attack");
      const swung = duel.pending?.kind === "melee" ? duel.pending : null;
      const riderSwing = Boolean(swung && (fieldMon(duel, swung.attacker)?.cardId === "ky-si-cuoi-rong" || fieldMon(duel, duel.hold?.blocker ?? swung.defender)?.cardId === "ky-si-cuoi-rong"));
      if (riderSwing) cueAt("firePrep", 0, 0.4);
    }
    if (!quiet && lunged && whipNow) cueAt("reflect");
    if (!quiet && lunged && gazing) cueAt("boltPrep");
    if (!quiet && lunged && hornNow) cueAt("boltPrep");
    const vowed = !/Không đủ máu để hiến tế/.test(said) && /bị hiến tế|hiến tế\.|hiến tế hết máu/.test(said);
    const soulBlood = ([0, 1] as const).some((side) => {
      if (prev.players[side].hp - duel.players[side].hp < 2) return false;
      return duel.players[side].field.some((mon, index) => {
        const was = prev.players[side].field[index];
        return mon?.cardId === "ke-giam-ho-linh-hon" && (mon.vows ?? 0) > (was?.vows ?? 0);
      });
    });
    if (vowed || soulBlood) cueAt("sacrifice");
    if (!quiet && /dùng Ẩn mình/.test(said)) cueAt("sacrifice");
    if (!quiet && /thành Chiến binh huyền thoại/.test(said)) cueAt("dispel");
    if (fireBlastOn()) {
      for (const side of [0, 1] as const) {
        duel.players[side].field.forEach((mon, index) => {
          const was = prev.players[side].field[index];
          if (mon?.cardId !== "ky-si-bong-toi" || (mon.path ?? 0) <= 0 || (was?.path ?? 0) > 0) return;
          const spot = SLOT_POS[screenSide(side, viewerNow)][index];
          if (spot) fxAt({ t: "fire", x: spot.x, y: spot.y });
        });
      }
      if (duel.rite && duel.rite.seq !== prev.rite?.seq) {
        const spot = SLOT_POS[screenSide(duel.rite.side, viewerNow)][duel.rite.slot];
        if (spot) fxAt({ t: "fire", x: spot.x, y: spot.y });
      }
      if (duel.ashes && duel.ashes.seq !== prev.ashes?.seq) {
        for (const slot of duel.ashes.slots) {
          const spot = SLOT_POS[screenSide(duel.ashes.side, viewerNow)][slot];
          if (spot) fxAt({ t: "fire", x: spot.x, y: spot.y });
        }
      }
    }
    // Summoning a main monster (Quái thú chủ lực, 4 stars and up) lands it in a gold summoning circle; other
    // monsters keep the usual summon effect, and sacrifice summons have their own circle below.
    const sacrificed = Boolean(duel.ashes && duel.ashes.seq !== prev.ashes?.seq);
    const summonedNow = (duel.events ?? []).slice(prev.events?.length ?? 0).some((row) => row.kind === "summon" && row.ok);
    if (summonedNow && !sacrificed) {
      for (const side of [0, 1] as const) {
        const known = new Set(prev.players[side].field.map((mon) => mon?.uid));
        duel.players[side].field.forEach((mon, index) => {
          if (!mon || known.has(mon.uid) || mon.lurk || (monsterCard(mon.cardId)?.stars ?? 0) < 4) return;
          const spot = SLOT_POS[screenSide(side, viewerNow)][index];
          if (spot) fxAt({ t: "rite", x: spot.x, y: spot.y, kind: "holy" });
        });
      }
    }
    // Sacrifice summon: the sacrificed burn (above), then the new monster lands in a pillar of hellfire.
    if (duel.ashes && duel.ashes.seq !== prev.ashes?.seq) {
      const side = duel.ashes.side;
      const known = new Set(prev.players[side].field.map((mon) => mon?.uid));
      const at = duel.players[side].field.findIndex((mon) => mon && !known.has(mon.uid));
      const spot = at >= 0 ? SLOT_POS[screenSide(side, viewerNow)][at] : null;
      if (spot) {
        window.setTimeout(() => fxAt({ t: "rite", x: spot.x, y: spot.y }), 450);
        cueAt("riteSummon", 0.45);
      }
    }
    if (drew) cueAt("draw");
    if (summoned) cueAt("summon");
    if (!quiet && /tích luỹ năng lượng/i.test(said)) cueAt("spellRise");
    if (!quiet && /Lộ diện quái dự bị/.test(said)) cueAt("dispel");
    if (!quiet && /thăng cấp/.test(said)) cueAt("dispel");
    if (!quiet && /Nở ra/.test(said)) cueAt("dispel");
    if (!quiet && /hồi \d+ và \+\d+ phòng ngự/.test(said)) cueAt("dispel");
    if (!quiet && /nhân đôi phòng ngự/.test(said)) cueAt("shield");
    if (!quiet && /cướp \d+ máu tối đa/.test(said)) cueAt("dispel");
    if (!quiet && /phù hộ/.test(said)) cueAt("spellRise");
    if (!quiet && /cuộn thế thủ/.test(said)) cueAt("shield");
    if (!quiet && /xòe thế công/.test(said)) cueAt("spellRise");
    if (!quiet && /Hoá kén/.test(said)) cueAt("shield");
    if (!quiet && /sẽ đỡ đòn và phép|ngừng đỡ/.test(said)) cueAt("shield");
    for (const side of [0, 1] as const) {
      duel.players[side].field.forEach((mon, index) => {
        const was = prev.players[side].field[index];
        if (quiet || !mon?.aegis || (was?.uid === mon.uid && (was.aegis ?? 0) >= mon.aegis) || seaVeiled(duel, viewerNow, mon.uid)) return;
        // Khiên dựng lên (Z4, chủ game 27/11): video + âm buffkhien chạy một lần, đặt đúng lá nhận khiên.
        const box = SLOT_BOX[screenSide(side, viewerNow)][index];
        emitFx({ t: "aegis", phase: "up", x: box.x + box.w / 2, y: box.y + box.h / 2, w: box.w });
      });
    }
    if (!quiet && /quét cả sân/.test(said)) cueAt("timeFlow");
    else if (!quiet && /cường hoá và tiêu diệt|tiến hoá .+ dạng cuối|cường hoá .+, tăng 35%/.test(said)) cueAt("timeBoost");
    else if (!quiet && /lão hoá .+, (tăng|giảm) 35%/i.test(said)) cueAt("timeAge");
    if (!quiet && /nạp tia sáng huỷ diệt/.test(said)) {
      cueAt("boltPrep");
      cueAt("boltSmall");
      for (const side of [0, 1] as const) {
        duel.players[side].field.forEach((mon, index) => {
          const was = prev.players[side].field[index];
          if (!mon?.gaze || was?.gaze) return;
          const spot = SLOT_POS[screenSide(side, viewerNow)][index];
          if (spot) fxAt({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
        });
      }
    }
    if (!quiet && doomCast) cueAt("boltPrep");
    if (!quiet && lashOpen) cueAt("reflect");
    if (!quiet && lashBoom && lashWas) {
      cueAt("boltSmall");
      for (const uid of [lashWas.bird, lashWas.foe]) {
        for (const side of [0, 1] as const) {
          const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
          const was = index >= 0 ? index : prev.players[side].field.findIndex((mon) => mon?.uid === uid);
          const spot = was >= 0 ? SLOT_POS[screenSide(side, viewerNow)][was] : null;
          if (spot) fxAt({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
        }
      }
    }
    if (!quiet && /Thu hồi quái/.test(said)) cueAt("dispel");
    else if (!quiet && beamKill) cueAt("spellRise");
    else if (!quiet && damageStart) cueAt("spellRise");
    else if (!quiet && hellBoom) {
      if (!(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun")) cueAt("swordBoom");
    } else if (!quiet && demonBoom) cueAt("swordBoom");
    else if (!quiet && swordBoom) {
      if (!(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun")) {
        if (!cameFromBeam) cueAt("spellRise");
        cueAt("swordBoom", cameFromBeam ? 0 : 0.24);
      }
    } else if (!quiet && gazeBoom && attackWas) {
      cueAt("laserBoom");
      const from = slotPoint(prev, attackWas.attacker, viewerNow);
      const drops = laserDrops(prev, duel, viewerNow);
      const hit = drops[0];
      const to = hit ?? (attackWas.kind === "melee" ? slotPoint(prev, attackWas.defender, viewerNow) : aimPoint(prev, attackWas, viewerNow));
      if (from && to) fxAt({ t: "laser", x1: from.x, y1: from.y, x2: to.x, y2: to.y });
      const boltAt = to ?? hit;
      laserTimers.current.push(window.setTimeout(() => {
        cueAt("boltSmall");
        if (boltAt) fxAt({ t: "bolt", rank: "small", self: hit?.spot === "self", x: boltAt.x, y: boltAt.y });
      }, LASER_MS));
    }
    else if (!quiet && whipBoom && attackWas) {
      cueAt("boltBoom");
      const mine = attackWas.attacker;
      for (const side of [0, 1] as const) {
        const index = prev.players[side].field.findIndex((mon) => mon?.uid === mine);
        const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
        if (spot) fxAt({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
      }
      if (attackWas.kind === "melee") {
        for (const side of [0, 1] as const) {
          const index = prev.players[side].field.findIndex((mon) => mon?.uid === attackWas.defender);
          const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
          if (spot) fxAt({ t: "bolt", rank: "big", x: spot.x, y: spot.y });
        }
      } else {
        const face = aimPoint(prev, attackWas, viewerNow);
        if (face) fxAt({ t: "bolt", rank: "big", x: face.x, y: face.y });
      }
    }
    else if (!quiet && hornBoom) {
      if (!wasHorn) cueAt("boltPrep");
      cueAt("boltSmall", wasHorn ? 0 : 0.24);
    }
    else if (!quiet && monsterKill && !waterCast && !whipNow && !whipBoom && !/Sấm lôi phá/.test(said) && !/Sấm sét tận thế/.test(said) && !/Roi điện/.test(said) && !/Roi sấm/.test(said) && !(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun") && !/cường hoá và tiêu diệt/.test(said) && !/quét cả sân/.test(said)) {
      if (!cameFromBeam) cueAt("spellRise");
      cueAt("spellBoom");
    } else if (!quiet && curseBoom) cueAt("swordBoom");
    else if (!quiet && spent === "sung-loi-pha" && !equipNow) {
      cueAt("boltPrep");
      cueAt("boltSmall", 0.24);
      window.setTimeout(() => {
        for (const side of [0, 1] as const) {
          duel.players[side].field.forEach((mon, index) => {
            const was = prev.players[side].field[index];
            if (!mon?.horn || was?.horn) return;
            const spot = SLOT_POS[screenSide(side, viewerNow)][index];
            if (spot) fxAt({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
          });
        }
      }, 240);
    }
    else if (!quiet && (BIND_SPELLS.has(spent) || beeBind || beeLand)) cueAt("chain");
    else if (!quiet && REFLECT_SPELLS.has(spent)) cueAt("reflect");
    else if (!quiet && spent === "giap-co-khi" && /bị phản vào/.test(said)) cueAt("reflect");
    else if (!quiet && DISPEL_SPELLS.has(spent)) cueAt("dispel");
    if (!quiet && /thổi độc|Thổi độc/.test(said) && /sát thương phép/.test(said)) cueAt("poison", 1.15);
    else if (!quiet && /sát thương phép/.test(said) && /bào mòn/.test(said)) cueAt("poison", 1.15);
    else if (!quiet && /trúng độc|chết vì độc|bị bào mòn|chết vì bào mòn|Virus ăn mòn (bắt đầu|gây|tiêu diệt|loại)/.test(said)) cueAt("poison");
    const pendingChanged = duel.pending !== prev.pending;
    const armingGun = Boolean(duel.reel?.kind === "gun" && !prev.reel);
    const started = pendingChanged && duel.pending ? shotLook(duel, duel.pending) : null;
    // A skill stopped by Phục kích never goes off: no fire on the target (chủ game 01/11).
    const stopped = Boolean(prev.hold?.ambush) || Boolean(prev.hold?.egg) || /Phục kích[^.]*chặn kỹ năng|chặn kỹ năng/.test(said);
    const finished = pendingChanged && !duel.pending && !armingGun && !stopped ? shotLook(prev, prev.pending) : null;
    const stamped = !started && !finished && duel.skill && duel.fx !== prev.fx ? skillLook(duel.skill.id, duel.skill.index) : null;
    const fromSpell = spent ? spellFxLook(spent) : null;
    const boomSpell = prev.pending?.kind === "spell" && duel.pending?.kind !== "spell" ? prev.pending.cardId : "";
    const boomFx = boomSpell ? spellFxLook(boomSpell) : null;
    const spellCard = Boolean((doomLook && doomLook !== "none") || (boomFx && boomFx !== "none") || (fromSpell && fromSpell !== "none" && !stamped && !finished));
    const look = started || finished || stamped || (fromSpell && fromSpell !== "none" ? fromSpell : null) || (doomLook && doomLook !== "none" ? doomLook : null) || (boomFx && boomFx !== "none" ? boomFx : null);
    const wait = killWait(prev, duel, look, spellCard);
    const rawShown = showEffects(prev, duel, viewerNow, hud);
    const shown = rawShown && quiet
      ? {
          ...rawShown,
          shake: false,
          burst: null,
          floaters: rawShown.floaters.filter((item) => item.spot === "self" && !item.heal && item.text !== "Hạ"),
          motion: {
            pops: [] as string[],
            lunges: (lunged || beam) ? [strikeUid(duel) || strikeUid(prev)].filter(Boolean) : [],
            hits: [] as string[],
          },
        }
      : rawShown;
    // Nhập lá trang bị: số +N chỉ bay lên khi lá quái đã về ô, và không kèm video hồi máu (tia nổ của hiệu ứng mới thay).
    if (equipNow && shown) for (const item of shown.floaters) if (item.heal) { item.hush = true; item.delay = EQUIP_MS / 1000; }
    // Đòn tông (chủ game 14/11): quái đánh quái lấy đà lùi nhẹ (WIND) rồi lao thẳng vào mục tiêu (RAM), tới nơi mới nổ.
    const WIND_MS = landing ? 150 : 0;
    const BOOM_PEAK_MS = 280;
    const LAND_MS = 110 + WIND_MS;
    const orbLate = new Set<number>();
    if (pre && shown) for (const item of shown.floaters) item.delay = (item.delay ?? 0) + pre / 1000;
    // Pháo kích: cú lao bắt đầu sau khi đạn đã lên nòng và chờ xong (`pre`).
    const lead = cannon && landing?.uid === cannon.ammo ? pre : 0;
    // Khiên vỡ (Z4, chủ game 28/11): video + âm vỡ khiên đặt đúng lá bị đòn, ĐÚNG LÚC đòn chạm (đánh thường: sau cú lao; skill, phép: theo
    // lúc hiệu ứng tới), hình khiên còn đứng tới lúc đó. Hết hạn thì không nháy.
    if (!quiet) {
      const gap = landing ? lead + LAND_MS + (boomIds.has(landing.uid) ? BOOM_PEAK_MS : 0) : Math.max(0, wait);
      for (const uid of shieldBreaks(prev, duel)) {
        const seat = seatOf(duel, uid);
        const mon = fieldMon(duel, uid);
        if (!seat || !mon || seaVeiled(duel, viewerNow, mon.uid)) continue;
        const box = SLOT_BOX[screenSide(seat.side, viewerNow)][seat.index];
        const burst = () => emitFx({ t: "aegis", phase: "break", x: box.x + box.w / 2, y: box.y + box.h / 2, w: box.w });
        if (gap > 0) {
          setAegisKeep((now) => ({ ...now, [uid]: true }));
          window.setTimeout(() => {
            setAegisKeep((now) => {
              const rest = { ...now };
              delete rest[uid];
              return rest;
            });
            burst();
          }, gap);
        } else burst();
      }
    }
    if (landing && shown) {
      for (const item of shown.floaters) {
        if (item.heal) continue;
        item.delay = Math.max(item.delay ?? 0, (lead + LAND_MS) / 1000);
      }
      {
        const lunged = lead && cannon ? cannon.mount : (attackShift(prev, landing.uid, viewerNow) ?? { x: 0, y: 0 });
        const wind = () => setThrust({ uid: landing.uid, x: lunged.x - landing.thrust.x * 0.2, y: lunged.y - landing.thrust.y * 0.2, phase: "back" });
        if (lead) window.setTimeout(wind, lead);
        else wind();
        window.setTimeout(() => setThrust((now) => (now?.uid === landing.uid ? { uid: landing.uid, ...landing.thrust, phase: "ram", ang: landing.ang } : now)), lead + WIND_MS);
        playHit("dash", (lead + WIND_MS - 40) / 1000);
      }
      if (lead) {
        // Máu trên lá và viên máu giữ số cũ tới lúc đạn chạm.
        const held: Record<string, number> = {};
        for (const side of [0, 1] as const) {
          if (duel.players[side].hp !== prev.players[side].hp) held[`face:${side}`] = prev.players[side].hp;
          for (const was of prev.players[side].field) {
            const now = was ? fieldMon(duel, was.uid) : null;
            if (was && now && now.hp !== was.hp) held[`mon:${was.uid}`] = was.hp;
          }
        }
        const keys = Object.keys(held);
        if (keys.length) {
          setHpHold((now) => ({ ...now, ...held }));
          window.setTimeout(() => setHpHold((now) => {
            const rest = { ...now };
            for (const key of keys) delete rest[key];
            return rest;
          }), lead + LAND_MS + 60);
        }
      }
      if (landing.kind === "face") {
        const struck = ([0, 1] as const).find((side) => duel.players[side].hp < prev.players[side].hp);
        if (struck !== undefined) {
          const key = `face:${struck}`;
          setHpHold((now) => ({ ...now, [key]: prev.players[struck].hp }));
          window.setTimeout(() => setHpHold((now) => {
            const rest = { ...now };
            delete rest[key];
            return rest;
          }), LAND_MS + 60);
        }
      }
      window.setTimeout(() => setThrust((now) => (now?.uid === landing.uid ? null : now)), lead + LAND_MS + (boomIds.has(landing.uid) ? BOOM_PEAK_MS : 0) + 130);
      if (boomOn) {
        const seat = seatOf(prev, landing.uid);
        const cardW = seat ? SLOT_BOX[screenSide(seat.side, viewerNow)][seat.index].w : 15;
        const start = slotPoint(prev, landing.uid, viewerNow);
        const spot = landing.kind === "face" || !start ? landing.at : { x: start.x + (landing.target.x - start.x) * 0.88, y: start.y + (landing.target.y - start.y) * 0.88 };
        window.setTimeout(() => fxAt({ t: "boom", x: spot.x, y: spot.y, w: cardW * BOOM_SPAN }), LAND_MS);
      } else {
        window.setTimeout(() => {
          fxAt({ t: "clash", x: landing.at.x, y: landing.at.y, ang: landing.ang });
        }, LAND_MS);
        playHit("ram", LAND_MS / 1000);
      }
    }
    const fxSourceUid = strikeUid(prev) || strikeUid(duel);
    const fxCard = (fxSourceUid ? (fieldMon(prev, fxSourceUid) ?? fieldMon(duel, fxSourceUid))?.cardId : undefined)
      ?? (spent || boomSpell || duel.skill?.id || undefined);
    if (shown) {
      // Đòn tông tự rung lúc chạm: không rung trước.
      if (shown.shake && !quiet && !rammed) fxAt({ t: "shake", act: "shake", spot: "center", power: 1 });
      const casting = shown.burst?.tone === "heal" ? "healSpell" : shown.burst ? "spell" : null;
      const grouped = look === "spell" || look === "fire" || look === "gun" || look === "bolt" || look === "spark" || look === "tide-small" || look === "tide-mid" || look === "tide-big";
      // Một chỗ chỉ chạy một video buff trong một lần cập nhật (mends + số bay cùng chỉ một quái).
      const buffed = new Set<string>();
      const fxBuffOnce = (spot: "self" | "target", x: number, y: number) => {
        const key = `${x.toFixed(1)}:${y.toFixed(1)}`;
        if (buffed.has(key)) return;
        buffed.add(key);
        fxAt({ t: "buff", act: "buff", spot, x, y });
      };
      const mendedAt = new Set<string>();
      const fxMendOnce = (spot: "self" | "target", x: number, y: number) => {
        const key = `${x.toFixed(1)}:${y.toFixed(1)}`;
        if (mendedAt.has(key)) return;
        mendedAt.add(key);
        fxAt({ t: "heal", act: "heal", spot, x, y });
      };
      if (!quiet && duel.fx !== prev.fx) {
        for (const mend of duel.mends ?? []) {
          for (const side of [0, 1] as const) {
            const index = duel.players[side].field.findIndex((unit) => unit?.uid === mend.uid);
            if (index < 0) continue;
            const spot = SLOT_POS[screenSide(side, viewerNow)][index];
            if (!spot) continue;
            const where = side === viewerNow ? "self" : "target";
            // Chủ game 26/11: buff chỉ số (kể cả máu tối đa) là video vòng cam; chỉ phần máu thật hồi lại mới là video hồi máu.
            const was = prev.players[side].field.find((unit) => unit?.uid === mend.uid);
            const rise = Math.max(0, (duel.players[side].field[index]?.maxHp ?? 0) - (was?.maxHp ?? 0));
            if (mend.n - rise > 0) fxMendOnce(where, spot.x, spot.y);
            if (mend.n === 0 || rise > 0) fxBuffOnce(where, spot.x, spot.y);
          }
        }
      }
      if (!quiet) for (const item of shown.floaters) {
        const act = item.heal ? "heal" : item.text === "Hạ" ? "kill" : casting === "healSpell" ? "heal" : "hurt";
        if (grouped && !item.heal && item.text !== "Hạ") continue;
        // The HP a landing blow hits gets its own flash when the lightning reaches it.
        if (orbLate.has(item.id)) continue;
        // Hồi máu, buff và tự tăng chỉ số dùng video hồi máu (chủ game 06/11); tăng máu tối đa giữ vòng cũ.
        if (item.hush) continue;
        // Đòn tông: vụ nổ ở chỗ chạm thay chớp đỏ cũ trên lá bị trúng.
        if (rammed && !item.heal && item.text !== "Hạ") continue;
        if (item.buff) fxBuffOnce(item.spot, item.x, item.y);
        else if (item.heal && !item.grow) fxAt({ t: "heal", act: "heal", spot: item.spot, x: item.x, y: item.y });
        else if (item.heal) {
          // Máu tối đa tăng = buff (video cam); phần máu hồi thật (nếu có) thêm video hồi máu.
          fxBuffOnce(item.spot, item.x, item.y);
          if ((item.mend ?? 0) > 0) fxMendOnce(item.spot, item.x, item.y);
        }
        else {
          fxAt({
            t: "burst",
            act,
            spot: item.spot,
            x: item.x,
            y: item.y,
            color: item.text === "Hạ" ? "#ffb020" : "#ff4d4d",
            power: item.text === "Hạ" ? 1.4 : 0.95,
            card: fxCard,
          });
        }
      }
      for (const key of shown.motion.pops) {
        const [raw, indexRaw] = key.split("-");
        const side = Number(raw) as Side;
        const spot = SLOT_POS[screenSide(side, viewerNow)][Number(indexRaw)];
        if (spot) fxAt({ t: "ring", act: "summon", spot: side === viewerNow ? "self" : "target", x: spot.x, y: spot.y, color: "#ffb347", power: 1.15, card: duel.players[side].field[Number(indexRaw)]?.cardId });
      }
      for (const uid of shown.motion.lunges) {
        let fromSide: Side = 0;
        let fromIndex = -1;
        for (const side of [0, 1] as const) {
          const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
          if (index >= 0) {
            fromSide = side;
            fromIndex = index;
          }
        }
        if (fromIndex < 0) continue;
        const from = SLOT_POS[screenSide(fromSide, viewerNow)][fromIndex];
        const pending = duel.pending;
        const attackerUid = pending && (pending.kind === "face" || pending.kind === "melee") ? pending.attacker : "";
        const blocking = Boolean(duel.hold?.blocker && uid === duel.hold.blocker && uid !== attackerUid && pending?.kind === "face");
        const foeSide = (1 - fromSide) as Side;
        const aimed = pending?.kind === "melee" || pending?.kind === "gnaw"
          ? (duel.hold?.blocker ?? pending.defender)
          : pending?.kind === "beam"
            ? pending.target
            : "";
        const foeIndex = aimed ? duel.players[foeSide].field.findIndex((mon) => mon?.uid === aimed) : -1;
        const face = HP_BOX[screenSide(foeSide, viewerNow)];
        const to = blocking
          ? lungedAttackerPoint(duel, viewerNow)
          : pending?.kind === "face" || (pending?.kind === "beam" && !pending.target)
            ? { x: face.x + face.w / 2, y: face.y + face.h / 2 }
            : foeIndex >= 0
              ? SLOT_POS[screenSide(foeSide, viewerNow)][foeIndex]
              : null;
        // Vệt cam + vết chém lúc vừa lao ra chỉ còn ở đòn đánh thẳng người chơi: quái đánh quái (và quái chặn) giờ nổ một lần
        // lúc đòn tông chạm (chủ game 14/11: thay mới thì bỏ hiệu ứng cũ).
        if (from && to && pending?.kind === "face" && !blocking) {
          const shooter = fieldMon(duel, uid);
          if (!shooter?.horn && !shooter?.gaze) fxAt({ t: "beam", act: "attack", x1: from.x, y1: from.y, x2: to.x, y2: to.y, color: "#ff8a00", card: shooter?.cardId });
        }
      }
    }
    if (!quiet && look) {
      const hits: { x: number; y: number; spot?: "self" | "target" }[] = [];
      const seen = new Set<string>();
      const add = (point: { x: number; y: number; spot?: "self" | "target" } | null | undefined) => {
        if (!point) return;
        const key = `${Math.round(point.x)}-${Math.round(point.y)}`;
        if (seen.has(key)) return;
        seen.add(key);
        hits.push(point);
      };
      if (shown) for (const hit of shown.floaters) if (!hit.heal) add(hit);
      if (shown) for (const fall of shown.falls) add(fall.floater);
      if (hits.length === 0) add(aimPoint(started ? duel : prev, started ? duel.pending : prev.pending, viewerNow));
      if (look === "spell" && hits.length === 0) {
        const aim = duel.skill?.aim;
        if (aim) {
          for (const side of [0, 1] as const) {
            const index = duel.players[side].field.findIndex((unit) => unit?.uid === aim);
            const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
            if (spot) add(spot);
          }
        }
      }
      const openingFire =
        (started === "fire" && finished !== "fire") ||
        (fromSpell === "fire" && duel.pending?.kind === "spell" && prev.pending?.kind !== "spell");
      const openingGun =
        (started === "gun" && finished !== "gun") ||
        (fromSpell === "gun" && duel.pending?.kind === "spell" && prev.pending?.kind !== "spell");
      if (look === "tide-small" || look === "tide-mid" || look === "tide-big") {
        const opening = Boolean(started) && !finished;
        const multi = look === "tide-mid" || look === "tide-big";
        if (!(opening && multi)) {
          const rank = look === "tide-big" ? "big" : look === "tide-mid" ? "mid" : "small";
          if (rank === "big") {
            // Sóng lớn: một con sóng mỗi hàng bị trúng, giữa hàng, đáy ở chân hàng (chủ game 04/11).
            const rows = new Map<string, { x: number; y: number }>();
            for (const hit of hits) {
              let best: { key: string; x: number; y: number; d: number } | null = null;
              for (const screen of [0, 1] as const) {
                for (const back of [false, true]) {
                  const boxes = SLOT_BOX[screen].filter((_, index) => backSlot(index) === back);
                  const mid = boxes.reduce((sum, box) => sum + box.y + box.h / 2, 0) / boxes.length;
                  const d = Math.abs(mid - hit.y);
                  if (!best || d < best.d) {
                    const left = Math.min(...boxes.map((box) => box.x));
                    const right = Math.max(...boxes.map((box) => box.x + box.w));
                    const foot = Math.max(...boxes.map((box) => box.y + box.h));
                    best = { key: `${screen}-${back}`, x: (left + right) / 2, y: foot, d };
                  }
                }
              }
              if (best && best.d < 9) rows.set(best.key, { x: best.x, y: best.y });
              else rows.set(`${hit.x}-${hit.y}`, { x: hit.x, y: hit.y });
            }
            for (const row of rows.values()) fxAt({ t: "tide", rank, x: row.x, y: row.y });
          } else for (const hit of hits) fxAt({ t: "tide", rank, x: hit.x, y: hit.y });
        }
      } else if (look === "fire" || look === "gun") {
        const opening = look === "gun" ? openingGun : openingFire;
        if (!quiet && look === "gun") cueAt(opening ? "gunPrep" : "gunBoom");
        if (!opening && (look === "gun" || fireBlastOn())) {
          const shot = finished ? prev.pending : duel.pending;
          const board = finished ? prev : duel;
          const aimed = aimPoint(board, shot, viewerNow);
          const casterUid = shot?.kind === "beam" || shot?.kind === "gnaw-skill" ? shot.caster : shot?.kind === "melee" || shot?.kind === "face" ? shot.attacker : "";
          let caster: { x: number; y: number } | null = null;
          if (casterUid) {
            for (const side of [0, 1] as const) {
              const index = board.players[side].field.findIndex((mon) => mon?.uid === casterUid);
              if (index >= 0) caster = SLOT_POS[screenSide(side, viewerNow)][index] ?? null;
            }
          }
          const landed = hits.filter((hit) => !caster || Math.abs(hit.x - caster.x) > 3 || Math.abs(hit.y - caster.y) > 3);
          const hellShot = Boolean(casterUid && ["mat-do-tan-pha", "rong-ac-ma"].includes(fieldMon(board, casterUid)?.cardId ?? ""));
          const splash = duel.skill?.id === "may-nem-bom-hinh-nhen" || duel.skill?.id === "thuong-quan-long" || duel.skill?.id === "loi-nguyen-cua-rong";
          const where = splash
            ? []
            : hellShot
              ? landed.length
                ? landed
                : aimed
                  ? [aimed]
                  : [{ x: 42, y: 44 }]
              : aimed
                ? [aimed]
                : landed.length
                  ? landed
                  : [{ x: 42, y: 44 }];
          if (splash) {
            const seen = new Set<string>();
            for (const id of duel.skill?.hits ?? []) {
              const point = splashMarkPoint(duel, id, viewerNow, shown?.falls ?? []);
              if (!point) continue;
              const key = `${Math.round(point.x)}-${Math.round(point.y)}`;
              if (seen.has(key)) continue;
              seen.add(key);
              fxAt({ t: "fire", x: point.x, y: point.y });
            }
          } else for (const hit of where) fxAt({ t: "fire", x: hit.x, y: hit.y });
        }
      } else if ((look === "bolt" || look === "spark") && !started) {
        const rank = look === "bolt" ? "big" : "small";
        if (look === "bolt") cueAt("boltBoom");
        const where = hits.length ? hits : [{ x: 53, y: 30 }];
        for (const hit of where) fxAt({ t: "bolt", rank, self: rank === "small" && hit.spot === "self", x: hit.x, y: hit.y });
      } else if (!started && duel.skill?.id === "ma-dao-si" && (duel.skill.vols?.length ?? 0) > 1) {
        const count = duel.skill.vols?.length ?? 0;
        const id = duel.skill.hits?.[0];
        const point = (id ? splashMarkPoint(duel, id, viewerNow, shown?.falls ?? []) : null) ?? hits[0];
        if (point) {
          for (let i = 0; i < count; i += 1) {
            window.setTimeout(() => {
              fxAt({ t: "burst", act: "spell", spot: "target", x: point.x, y: point.y, color: "#ff4d4d", power: 1.1, card: fxCard });
            }, i * 420);
          }
        }
        fxAt({ t: "ring", act: "spell", spot: "center", x: 42, y: 44, color: "#ffd36a", power: 1.7, card: fxCard });
        for (let i = 1; i < count; i += 1) cueAt("spellBoom", i * 0.42);
      } else if (!started && (hits.length > 0 || finished || stamped || look === "spell")) {
        const rageCast = duel.skill?.id === "con-thinh-no-cua-hai-vuong" || (prev.pending?.kind === "beam" && fieldMon(prev, prev.pending.caster)?.cardId === "con-thinh-no-cua-hai-vuong");
        if (rageCast && hits.length > 0) {
          // Cơn thịnh nộ của hải thần: video xoáy nước thay nổ đỏ (chủ game 06/11).
          for (const hit of hits) fxAt({ t: "tide", rank: "rage", x: hit.x, y: hit.y });
        } else {
          for (const hit of hits) fxAt({ t: "burst", act: "spell", spot: "target", x: hit.x, y: hit.y, color: "#ff4d4d", power: 1.1, card: fxCard });
          fxAt({ t: "ring", act: "spell", spot: "center", x: 42, y: 44, color: "#ffd36a", power: 1.7, card: fxCard });
        }
      }
    }
    const beamDrops = laserDrops(prev, duel, viewerNow);
    if (beamDrops.length) {
      for (const drop of beamDrops) {
        const n = drop.from - drop.to;
        const step = LASER_MS / n;
        for (let i = 1; i <= n; i += 1) {
          const hp = drop.from - i;
          laserTimers.current.push(window.setTimeout(() => setLaserHp((cur) => ({ ...cur, [drop.key]: hp })), Math.round(i * step)));
        }
      }
    } else setLaserHp((cur) => (Object.keys(cur).length ? {} : cur));
    if (!shown) return;
    const token = wave.current + 1;
    wave.current = token;
    if (shown.shake) {
      const late = (landing ? LAND_MS : 0) + pre;
      window.setTimeout(() => setShake(true), late);
      window.setTimeout(() => setShake(false), 640 + late);
    }
    if (shown.floaters.length > 0) {
      setFloaters((current) => [...current, ...shown.floaters]);
      const ids = new Set(shown.floaters.map((item) => item.id));
      const trail = Math.round(Math.max(0, ...shown.floaters.map((item) => (item.delay ?? 0) * 1000)));
      window.setTimeout(() => setFloaters((current) => current.filter((item) => !ids.has(item.id))), 1500 + trail);
    }
    const boomFalls = shown.falls.filter((fall) => boomIds.has(fall.mon.uid));
    if (boomFalls.length > 0) {
      setLinger((current) => {
        const kept = current.filter((item) => !boomFalls.some((fall) => fall.side === item.side && fall.index === item.index));
        return [...kept, ...boomFalls.map((fall) => ({ id: fall.floater.id, side: fall.side, index: fall.index, mon: fall.mon }))];
      });
      const gone = new Set(boomFalls.map((fall) => fall.floater.id));
      // Không có cú lao (đòn không dựng được đường bay) thì nổ ngay tại ô của nó.
      if (!landing) for (const fall of boomFalls) fxAt({ t: "boom", x: fall.floater.x, y: fall.floater.y, w: 15 * BOOM_SPAN });
      window.setTimeout(() => setLinger((current) => current.filter((item) => !gone.has(item.id))), (landing ? LAND_MS : 0) + BOOM_PEAK_MS + pre);
    }
    shown.falls = shown.falls.filter((fall) => !boomIds.has(fall.mon.uid));
    // Số mất máu / "Hạ" ở ô Kuriboh nổ không hiện: nó biến mất trong vụ nổ, số sát thương hiện trên kẻ bị trúng.
    if (boomIds.size > 0) shown.floaters = shown.floaters.filter((item) => !boomFalls.some((fall) => fall.floater.id === item.id || (Math.abs(fall.floater.x - item.x) < 0.5 && Math.abs(fall.floater.y - item.y) < 0.5)));
    if (shown.falls.length > 0) {
      const arm = (falls: Fall[], fadeAt: number) => {
        setLinger((current) => {
          const kept = current.filter((item) => !falls.some((fall) => fall.side === item.side && fall.index === item.index));
          return [...kept, ...falls.map((fall) => ({ id: fall.floater.id, side: fall.side, index: fall.index, mon: fall.mon }))];
        });
        window.setTimeout(() => {
          const ids = new Set(falls.map((fall) => fall.floater.id));
          const calm = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
          if (!quiet && !calm) {
            // Chủ game 16/11: the card shatters (video, its own flash and sound) in place of the old fade and burst.
            setLinger((current) => current.filter((item) => !ids.has(item.id)));
            setShatters((current) => [...current, ...falls.map((fall) => ({ id: fall.floater.id, side: fall.side, index: fall.index, mon: fall.mon }))]);
            setFloaters((current) => [...current, ...falls.map((fall) => ({ ...fall.floater, delay: SHATTER_BURST }))]);
            playCue("shatter");
            window.setTimeout(() => setFloaters((current) => current.filter((item) => !ids.has(item.id))), 1500 + Math.round(SHATTER_BURST * 1000));
            return;
          }
          setLinger((current) => current.map((item) => (ids.has(item.id) ? { ...item, fading: true } : item)));
          if (!quiet) {
            setFloaters((current) => [...current, ...falls.map((fall) => fall.floater)]);
            for (const fall of falls) emitFx({ t: "burst", act: "kill", spot: fall.floater.spot, x: fall.floater.x, y: fall.floater.y, color: "#ffb020", power: 1.4, card: fxCard });
            window.setTimeout(() => setFloaters((current) => current.filter((item) => !ids.has(item.id))), 1500);
          }
        }, fadeAt);
        window.setTimeout(() => {
          const ids = new Set(falls.map((fall) => fall.floater.id));
          setLinger((current) => current.filter((item) => !ids.has(item.id)));
        }, fadeAt + 300);
      };
      const beamed = shown.falls.filter((fall) => fall.laser);
      const rest = shown.falls.filter((fall) => !fall.laser);
      if (beamed.length) arm(beamed, LASER_MS);
      if (rest.length) arm(rest, pre + Math.max(0, wait) + Math.max(0, ...rest.map((fall) => fall.hold ?? 0)));
    }
    if (shown.burst) {
      const flare = shown.burst;
      if (pre) window.setTimeout(() => setBurst(flare), pre);
      else setBurst(flare);
      window.setTimeout(() => setBurst((current) => (current?.id === flare.id ? null : current)), 1600 + pre);
    }
    if (shown.motion.pops.length || shown.motion.lunges.length || shown.motion.hits.length) {
      // Lá bị tông giật lúc đòn chạm, không giật trước.
      const late = rammed ? LAND_MS + pre : pre;
      if (late) window.setTimeout(() => wave.current === token && setMotion(shown.motion), late);
      else setMotion(shown.motion);
      window.setTimeout(() => {
        if (wave.current === token) setMotion({ pops: [], lunges: [], hits: [] });
      }, 1400 + late);
    }
  }, [duel]);

  useEffect(() => {
    if (!duel) {
      emitFx({ t: "ailments", act: "ailment", marks: [] });
      return;
    }
    const actorNow = boardActor(duel);
    const viewerNow: Side = viewerSide(duel, actorNow, net?.seat ?? null);
    const marks: { id: string; x: number; y: number; spot: "self" | "target" }[] = [];
    for (const side of [0, 1] as const) {
      duel.players[side].field.forEach((mon, index) => {
        if (!mon) return;
        const lasting = mon.curse || mon.vulnerable > 0 || (mon.noBlock && !isStill(mon.cardId)) || mon.bleed > 0 || Boolean(mon.erode && mon.erode.left !== 0);
        if (!lasting) return;
        const box = SLOT_BOX[screenSide(side, viewerNow)][index];
        if (!box) return;
        marks.push({ id: mon.uid, x: box.x + box.w / 2, y: box.y + box.h / 2, spot: side === viewerNow ? "self" : "target" });
      });
    }
    emitFx({ t: "ailments", act: "ailment", marks });
  }, [duel, net]);

  const drawShowing = drawShows.length > 0;
  const fuseKey = (() => {
    if (!duel || duel.step !== "main" || duel.winner) return "";
    const player = duel.players[duel.turn];
    const bits: string[] = [];
    const ids = player.field.filter((mon): mon is NonNullable<typeof mon> => Boolean(mon)).map((mon) => mon.cardId);
    player.reserve.forEach((held, index) => {
      player.field.forEach((mon) => {
        if (mon && (findFusion(held.id, mon.cardId) || findKnightFusion(held.id, mon.cardId, ids))) bits.push(`${index}:${mon.uid}`);
      });
      for (const way of setFusionsFor(duel, duel.turn, index)) bits.push(`${index}:${way.result}`);
    });
    return bits.length ? `${duel.turn}|${bits.join("|")}` : "";
  })();

  useEffect(() => {
    if (!fuseKey) {
      setFuseOn(false);
      return;
    }
    setFuseOn(true);
    // Lá vừa rút đang hiện giữa màn thì glow chưa đếm giờ, tới khi lá về tay mới đếm 3,5 giây (chủ game 18/11).
    if (drawShowing) return;
    const timer = window.setTimeout(() => setFuseOn(false), 3500);
    return () => window.clearTimeout(timer);
  }, [fuseKey, drawShowing]);

  useEffect(() => {
    if (!fuseAsk || fuseAsk.phase === "ask" || fuseAsk.phase === "preview") return;
    if (fuseAsk.phase === "fly") playCue("fusion");
    const wait = fuseAsk.phase === "fly" ? 780 : 700;
    const next = fuseAsk.phase === "fly" ? "flash" : "preview";
    const timer = window.setTimeout(() => {
      setFuseAsk((current) => (current && current.id === fuseAsk.id && current.phase === fuseAsk.phase ? { ...current, phase: next } : current));
    }, wait);
    return () => window.clearTimeout(timer);
  }, [fuseAsk?.id, fuseAsk?.phase]);

  useEffect(() => {
    if (!fuseShow || fuseShow.phase === "reveal" || fuseShow.phase === "rows" || fuseShow.phase === "land") return;
    if (fuseShow.phase === "lift") playCue("fuseRite");
    const phase = fuseShow.phase;
    const [wait, after] = FUSE_BEATS[phase];
    const timer = window.setTimeout(
      () => setFuseShow((current) => (current && current.n === fuseShow.n && current.phase === phase ? { ...current, phase: after } : current)),
      wait,
    );
    return () => window.clearTimeout(timer);
  }, [fuseShow?.n, fuseShow?.phase]);

  // The picked card in hand goes back when the priority, the step or the round changes.
  useEffect(() => setHandPick(null), [duel?.turn, duel?.step, duel?.round]);
  // The eye's preview goes with the reaction row it was for.
  useEffect(() => {
    if (peek && !queue && !(duel?.step === "respond" && duel.hold && !duel.hold.stage)) setPeek(false);
  }, [duel, queue, peek]);
  // A queue left from another match, or an action the match no longer holds waiting, goes.
  useEffect(() => {
    if (!queue || !duel) return;
    if (duel.mid !== queue.base.mid || duel.winner !== null || (queue.kind === "act" && !duel.hold?.stage)) {
      setQueue(null);
      setPeek(false);
    }
  }, [duel, queue]);
  // The withdraw of a mirror-faced attack goes once the attacker lets the mirror rise, or anything else moves on.
  useEffect(() => {
    if (!mirrorBack) return;
    if (!duel || duel.mid !== mirrorBack.base.mid || duel.winner !== null || !mirrorWaits(duel, duel.turn)) setMirrorBack(null);
  }, [duel, mirrorBack]);
  // The row arrows stand outside the picked card, over its top edge: where that card is on the board, in % of the board.
  const [pickSpot, setPickSpot] = useState<{ x: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = handPick?.pile === "reserve" ? document.querySelector(`[data-reserve="${handPick.index}"]`) : null;
    const board = el?.closest(".board")?.getBoundingClientRect();
    if (!el || !board) {
      setPickSpot(null);
      return;
    }
    const box = el.getBoundingClientRect();
    setPickSpot({ x: ((box.left + box.width / 2 - board.left) / board.width) * 100, top: ((box.top - board.top) / board.height) * 100 });
  }, [handPick, cut]);

  // Dòng sáng chuyển lượt (turn-light.tsx, chủ game 28/10): bể của bên đang giữ quyền ở giữa sân, sát khu của bên đó;
  // chữ "TỚI LƯỢT CỦA BẠN" khi quyền về mình, "VÒNG N" khi sang vòng mới. Bể đi theo vết cắt của bàn.
  // Miệng bể nằm giữa dải đá còn nhìn thấy giữa hai đáy. Không đi qua `ry(TANK_OPEN)`: khi màn ngắn cả đoạn giữa sân bị bỏ dồn
  // về một điểm, bể hai bên dẹp lại thành một vạch (chủ game 01/11, bên đỏ).
  const tankGeo = useMemo<Record<TankSide, TankGeo>>(() => {
    const foeBase = tankBase().foe;
    const youBase = tankBase().you;
    // Sâu bằng khoảng một ô gạch ở mọi màn (chủ game 01/11, bản màn cắt trông ổn): màn đủ dài không để bể sâu cả nửa dải đá; màn
    // bị cắt thì dải đá còn ít nên bể nông hơn thế.
    const depth = Math.min((youBase - foeBase) / 2, rh(TANK_DEPTH, cut));
    return {
      foe: { x0: TANK_WALLS[0], x1: TANK_WALLS[1], base: foeBase, open: foeBase + depth },
      you: { x0: TANK_WALLS[0], x1: TANK_WALLS[1], base: youBase, open: youBase - depth },
    };
  }, [cut]);
  const [turnCue, setTurnCue] = useState<TitleCue | null>(null);
  // Số cam của cả hai bên chớp 3 giây đầu mỗi vòng mới (chủ game 21/11).
  const [countBlink, setCountBlink] = useState(false);
  const blinkClock = useRef<number | null>(null);
  const blinkTimer = useRef(0);
  useEffect(() => {
    if (!duel) return;
    const clock = duel.clock ?? 1;
    const was = blinkClock.current;
    blinkClock.current = clock;
    if (was === null || clock <= was || duel.winner !== null || tutorial) return;
    setCountBlink(true);
    window.clearTimeout(blinkTimer.current);
    blinkTimer.current = window.setTimeout(() => setCountBlink(false), 3000);
  }, [duel]);
  useEffect(() => () => window.clearTimeout(blinkTimer.current), []);
  const lightSeen = useRef<{ actor: Side; clock: number } | null>(null);
  const cueTimer = useRef(0);
  useEffect(() => {
    if (!duel) return;
    const actorNow = boardActor(duel);
    const viewerNow = viewerSide(duel, actorNow, net?.seat ?? null);
    const clock = duel.clock ?? 1;
    const seen = lightSeen.current;
    lightSeen.current = { actor: actorNow, clock };
    // The first look at a match, a finished match, a lesson or the test table: no titles.
    if (!seen || duel.winner !== null || tutorial || duel.mode === "test" || duel.mode === "hotseat") return;
    let wait = 0;
    if (clock > seen.clock) {
      setTurnCue({ id: Date.now(), kind: "round", lines: [`${tr("VÒNG")} ${clock}`] });
      wait = 1700;
    }
    if (actorNow === viewerNow && seen.actor !== viewerNow && duel.step === "main") {
      const cue: TitleCue = { id: Date.now() + 1, kind: "turn", lines: [tr("TỚI LƯỢT"), tr("CỦA BẠN")] };
      window.clearTimeout(cueTimer.current);
      if (wait) cueTimer.current = window.setTimeout(() => setTurnCue(cue), wait);
      else setTurnCue(cue);
    }
  }, [duel]);
  useEffect(() => () => window.clearTimeout(cueTimer.current), []);
  // Kéo quái lên mục tiêu: the button picked from the drop list fires at the target once its aim is in place.
  useEffect(() => {
    const key = fireAfter.current;
    if (!key || !aim) return;
    fireAfter.current = null;
    slideFire.current(key);
  }, [aim]);
  // Chọn nốt mục tiêu (chủ game 10/11): a quick tap or a press-and-slide picks it; nothing right within 2 s, the list shows.
  useEffect(() => {
    setAlsoPanel(false);
    if (aim?.kind !== "skill" || !aim.also) return;
    const timer = window.setTimeout(() => {
      if (!pressing.current) setAlsoPanel(true);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [aim]);
  // 4 mũi tên (chủ game 10/11): a new aim lights the target nearest the caster; the lit one stays while it can still be taken.
  useLayoutEffect(() => {
    const on = aim?.kind === "attack" || aim?.kind === "skill";
    const keys = on ? padKeys() : new Set<string>();
    const slot = on && aim ? you.field.findIndex((unit) => unit?.uid === aim.uid) : -1;
    const caster = slot >= 0 ? document.querySelector<HTMLElement>(`[data-slot="${viewer}-${slot}"]`)?.getBoundingClientRect() : undefined;
    if (!on || keys.size === 0 || !caster || caster.width === 0) {
      aimSeen.current = aim;
      setAimLit(null);
      setPadBox(null);
      return;
    }
    setPadBox({ left: caster.left, top: caster.top, width: caster.width, height: caster.height });
    const fresh = aimSeen.current !== aim;
    aimSeen.current = aim;
    setAimLit((lit) => {
      if (!fresh && lit && keys.has(lit)) return lit;
      const cx = caster.left + caster.width / 2;
      const cy = caster.top + caster.height / 2;
      let best: string | null = null;
      let far = Infinity;
      for (const one of torchBoxes(keys)) {
        const d = Math.hypot(one.left + one.width / 2 - cx, one.top + one.height / 2 - cy);
        if (d < far) {
          far = d;
          best = one.key;
        }
      }
      return best;
    });
  }, [aim, duel]);
  // The match moved on: the drop list goes.
  useEffect(() => {
    setDropMenu((open) => {
      if (open) setSnap(null);
      return null;
    });
  }, [duel]);
  // Luật 0.3 (chủ game 11/11): bấm chuyển lượt khi neon còn sáng mục tiêu = mục tiêu đó được chọn, hành động vào hàng chờ
  // và được xác nhận luôn (sang đối thủ như thường). Còn thiếu bước (skill 2 bước, bảng hỏi thêm) thì huỷ rồi chuyển lượt.
  useEffect(() => {
    if (!autoOk.current || !duel) return;
    autoOk.current = false;
    if (queue) {
      confirmQueue();
      return;
    }
    if (aim || vowAsk || hornAsk || knightAsk || chronoAsk || digPick) {
      cancelPick();
      if (duel.step === "main" && duel.turn === viewer && !duel.hold) apply(endTurn(duel));
    }
  }, [queue, aim, duel, aimLit]);

  if (duel) turnClock.current = duel.clock ?? 1;

  // Chủ game 16/11: đã đẩy lên hàng chờ mà 2 giây không làm gì thì nút OK chớp toả hào quang.
  const [okFlare, setOkFlare] = useState(false);
  useEffect(() => {
    setOkFlare(false);
    if (!queue) return;
    const t = window.setTimeout(() => setOkFlare(true), 2000);
    return () => window.clearTimeout(t);
  }, [queue, aim, vowAsk, hornAsk, knightAsk, chronoAsk, digPick, peek]);
  if (!duel) {
    return (
      <main className="stage">
        <p>{tr(watch?.over ? "Trận đã kết thúc." : wait || "Đang mở đấu trường…")}</p>
        {net?.seat === "host" && !(net as { quick?: boolean }).quick && !watch ? <p className="room-code">{net.code}</p> : null}
        {watch ? (
          <button type="button" className="fr-btn" onClick={leaveWatch}>
            {tr("Thoát")}
          </button>
        ) : null}
      </main>
    );
  }

  const responding = duel.step === "respond";
  const actor = boardActor(duel);
  const viewer: Side = viewerSide(duel, actor, net?.seat ?? null);
  const you = duel.players[viewer];
  const foe = duel.players[viewer === 0 ? 1 : 0];
  const mine = !busy && duel.winner === null && (duel.mode === "hotseat" || duel.mode === "test" || actor === (duel.mode === "ai" ? 0 : viewer));
  const gemHold = duel.gemCap === viewer || duel.gemWarn === viewer;
  const wheelOwner: Side | null = duel.wheel ? (duel.players[0].field.some((mon) => mon?.uid === duel.wheel?.uid) ? 0 : 1) : null;
  const canPlay = mine && duel.step === "main" && duel.turn === viewer && !duel.upkeep && !gemHold && !duel.counterAsk && !queue;
  // The OK button is a tick while something waits for an answer or for this side's confirmation.
  const ticking = responding || Boolean(queue);
  // Con mắt (chủ game 28/10): the match after the tick, as if the opponent does not answer; only what is certain.
  // The eye is open whenever a reaction row stands, whether this side has acted or not (chủ game 30/10); only X opens
  // when this side has an action to cancel. With nothing of this side queued the preview is the match as it goes on if
  // this side lets the waiting action through.
  const eyeOn = Boolean(queue) || Boolean(responding && duel.hold && !duel.hold.stage);
  // X còn mở khi Gương phòng hộ đứng sẵn tự dựng trước đòn của mình và chưa phát động (chủ game 09/11).
  const withdrawOn = !queue && Boolean(mirrorBack) && mine && mirrorWaits(duel, viewer);
  let sight: Sight | null = null;
  if (peek && eyeOn) {
    const memo = sightMemo.current;
    const kind = queue?.kind ?? "pass";
    if (memo.duel === duel && memo.kind === kind) sight = memo.sight;
    else {
      try {
        sight = foresee(duel, queue ? queueRuns(duel, queue.kind, viewer) : [settle(duel)]);
      } catch {
        sight = null;
      }
      sightMemo.current = { duel, kind, sight };
    }
  }
  // In the preview the queued icons have gone through, so they show as cracks; one whose roll is still to come keeps
  // its icon, with no target yet (chủ game 28/10).
  const peekIcons = sight && !queue
    ? { cracked: new Set(chain.map((orb) => orb.id)), aimless: new Set<string>() }
    : sight && queue
    ? (() => {
        const fresh = new Set(chain.filter((orb) => !queue.chain.some((old) => old.id === orb.id)).map((orb) => orb.id));
        return sight.random && queue.kind === "act" ? { cracked: new Set<string>(), aimless: fresh } : { cracked: fresh, aimless: new Set<string>() };
      })()
    : null;
  const dueKnight = mine ? knightDue(duel, viewer) : null;
  const upkeepUnit =
    mine && duel.upkeep && duel.turn === viewer
      ? you.field.find((unit) => unit !== null && unit.uid === duel.upkeep && unit.hp > 0) ?? null
      : null;
  const demonUpkeep = upkeepUnit?.cardId === "trieu-hoi-ac-ma";
  const angelUpkeep = upkeepUnit?.cardId === "quai-thu-thien-su";
  const askUpkeep = Boolean(demonUpkeep || angelUpkeep);
  const testCards = (testKind === "monster" ? [...MONSTERS, ...FORMS].sort((a, b) => a.stars - b.stars || a.name.localeCompare(b.name, "vi")) : [...SPELLS].sort((a, b) => a.gems - b.gems || a.name.localeCompare(b.name, "vi"))).filter((card) =>
    card.name.toLocaleLowerCase("vi").includes(testFind.trim().toLocaleLowerCase("vi")),
  );
  const otherSide = (viewer === 0 ? 1 : 0) as Side;
  // Luật 6 ô (Grok, chủ game 28/10 C3): quái hàng trước chặn đòn đánh / kỹ năng vào người chơi hoặc vào quái hàng sau.
  const coverBack = (() => {
    const pending = duel.pending;
    const aimed = pending?.kind === "melee" ? pending.defender : pending?.kind === "beam" || pending?.kind === "gnaw-skill" ? pending.target : null;
    return Boolean(aimed && you.field.some((unit) => unit?.uid === aimed && unit.row === "back"));
  })();
  const canIntercept = responding && duel.hold?.priority === viewer && (duel.pending?.kind === "face" || coverBack);
  const standHand = Boolean(mine && canStandHand(duel, viewer));
  const board = matchBoard(foe.env, you.env);
  /** Chọn mục tiêu theo video chủ game (30/10): the spell waits as an icon in the middle with its short line. */
  const aimMark = aim?.kind === "spell" && AIM_MARK.has(aim.spellId) ? aim : null;
  /** Hoán đổi (siêu tốc, chủ game 30/10): the monster aimed at is locked; the others that can trade glow, tap one. */
  const swapAsk = duel.swap && duel.swap.side === viewer && duel.swap.locked ? duel.swap : null;
  /** Điều động (chủ game 27/11): một trong hai con đổi chỗ phải là hiệp sĩ. */
  const swapKnightOk = (cardId: string) => !swapAsk?.knight || isKnight(cardId) || isKnight(you.field.find((unit) => `f:${unit?.uid}` === swapAsk.locked)?.cardId);
  const swapFit = (unit: FieldMon | null | undefined) => Boolean(swapAsk && unit && swapKnightOk(unit.cardId) && !unit.copy && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai" && unit.abroad === undefined && `f:${unit.uid}` !== swapAsk.locked);
  const swapBench = (held: (typeof you.reserve)[number]) => {
    const card = monsterCard(held.id);
    // The Triệu hồi ác ma also needs its 1 mana when it comes out at exactly 3 stars (a refused pick used to freeze the swap).
    const fresh = held.id === "trieu-hoi-ac-ma" && you.stars === 3 && !held.saved?.seen && you.orb < 1;
    return Boolean(swapAsk && card && swapKnightOk(held.id) && card.stars !== 0 && !fresh && !(held.id === "trieu-hoi-ac-ma" ? you.stars < 3 : you.stars < card.stars));
  };
  const markId = aimMark?.spellId ?? (swapAsk ? "hoan-doi" : null);
  // X (chủ game 31/10): opens as soon as a skill, an attack or a target choice is under way, and cancels that choice, not
  // only what stands in the queue.
  const picking = Boolean((aim && aim.kind !== "unit" && aim.kind !== "menu" && aim.kind !== "skill-info" && aim.kind !== "cast" && aim.kind !== "innate") || lockPick || vowAsk || hornAsk || knightAsk || chronoAsk || digPick);
  /** Hộp ma thuật: the card becomes an icon in the middle; pick the ally struck (when several are), then the enemy. */
  function startBox(index: number) {
    if (!duel) return;
    const allies = boxAllies(duel, viewer);
    if (allies.length === 0) {
      holdNotice("Chưa có đồng minh nào bị kỹ năng nhắm.");
      return;
    }
    playCue("chain");
    setAim({ kind: "spell", index, spellId: "hop-ma-thuat", ...(allies.length === 1 ? { from: allies[0] } : {}) });
    holdNotice(allies.length === 1 ? "Chọn quái đối thủ để đổi chỗ." : "Chọn đồng minh đang bị nhắm.");
  }
  /**
   * Lá phép Harpie Lady và Hồi sinh quái thú (chủ game 26/11). Giáp và Vuốt, Roi điện: dùng luôn (harpie bị nhắm đã rõ).
   * Thổi bay: chọn Harpie Lady. Mê hoặc: quái địch, rồi đồng minh bị đánh, rồi Harpie Lady phát động (nếu có nhiều con).
   * Hồi sinh quái thú: bảng chọn quái trong mộ.
   */
  function startWileSpell(index: number) {
    if (!duel) return;
    const id = duel.players[viewer].hand[index] ?? "";
    if (id === REVIVE_CARD) {
      if (!reviveReady(duel, viewer)) {
        holdNotice(duel.step === "respond" ? "Hồi sinh quái thú chỉ phản ứng khi quái địch đánh thường vào bạn hoặc quái của bạn." : "Hồi sinh quái thú cần quái trong mộ và ô trống.");
        return;
      }
      setReviveAsk({ index });
      return;
    }
    if (id === PRISM_CARD) {
      if (!prismPicks(duel, viewer).length) {
        holdNotice("Không có quái đồng minh sao chép được, bộ bài cũng không còn Harpie Lady.");
        return;
      }
      setPrismAsk({ index });
      return;
    }
    if (!isWileCard(id)) return;
    if (!wileReady(duel, viewer, id)) {
      holdNotice(id === WILE_CARDS.armor ? "Giáp và Vuốt chỉ dùng khi Harpie Lady chưa hành động bị đòn đánh thường nhắm vào." : id === WILE_CARDS.lash ? "Roi điện chỉ dùng khi Harpie Lady chưa hành động bị kỹ năng của 1 quái thú nhắm tới." : "Cần 1 Harpie Lady chưa hành động trên sân.");
      return;
    }
    if (id === WILE_CARDS.armor || id === WILE_CARDS.lash) {
      apply(castSpell(duel, index, null));
      return;
    }
    const birds = wileBirds(duel, viewer);
    if (id === WILE_CARDS.gust && birds.length === 1) {
      apply(castSpell(duel, index, null, false, birds[0]));
      return;
    }
    playCue("chain");
    setAim({ kind: "spell", index, spellId: id });
    holdNotice(id === WILE_CARDS.gust ? "Chọn 1 Harpie Lady." : "Chọn 1 quái địch.");
  }
  /** Mê hoặc: bấm quái trong lúc chọn (địch → đồng minh → Harpie Lady phát động). */
  function wileTap(mon: FieldMon, side: Side) {
    if (!duel || aim?.kind !== "spell") return;
    const birds = wileBirds(duel, viewer);
    if (aim.spellId === WILE_CARDS.gust) {
      if (side === viewer && birds.includes(mon.uid)) {
        const index = aim.index;
        setAim(null);
        holdNotice("");
        apply(castSpell(duel, index, null, false, mon.uid));
      }
      return;
    }
    if (side !== viewer) {
      if (aim.wile) return;
      setAim({ ...aim, from: mon.uid });
      holdNotice("Chọn 1 quái thú đồng minh bị đánh (được là chính Harpie Lady).");
      return;
    }
    if (!aim.from) {
      holdNotice("Chọn 1 quái địch trước.");
      return;
    }
    const cast = (bird: string, ally: string) => {
      const index = aim.index;
      const foe = aim.from!;
      setAim(null);
      holdNotice("");
      apply(castSpell(duel, index, foe, false, charmCode(bird, ally)));
    };
    if (!aim.wile) {
      if (birds.length === 1) {
        cast(birds[0]!, mon.uid);
        return;
      }
      setAim({ ...aim, wile: { ally: mon.uid } });
      holdNotice("Chọn Harpie Lady phát động phép.");
      return;
    }
    if (birds.includes(mon.uid)) cast(mon.uid, aim.wile.ally!);
  }
  /** Song sát: the card becomes an icon; pick the enemy, then ally 1 and its blow, then ally 2 and its blow. */
  function startDuo(index: number) {
    if (!duel) return;
    if (!duoReady(duel, viewer)) {
      holdNotice("Cần ít nhất 2 quái đồng minh và 1 quái địch.");
      return;
    }
    playCue("chain");
    setAim({ kind: "spell", index, spellId: DUO_CARD, duo: { picks: [] } });
    holdNotice("Chọn 1 quái địch.");
  }
  /** The blows ally `uid` can strike the enemy `target` with in Song sát: Tấn công and the damage skills allowed. */
  function duoActs(uid: string, target: string): { act: DuoPick["act"]; label: string }[] {
    const mon = you.field.find((unit) => unit?.uid === uid);
    const card = mon ? monsterCard(mon.cardId) : undefined;
    if (!duel || !mon || !card) return [];
    const out: { act: DuoPick["act"]; label: string }[] = [];
    if (duoCanAttack(mon)) out.push({ act: "atk", label: "Tấn công" });
    for (const chip of fieldBindsFor(card.id, {
      cardId: card.id,
      orb: you.orb,
      level: mon.level ?? 1,
      hp: mon.hp,
      stored: mon.stored ?? 0,
      skillText: plainCopy(card.skill),
      afford: () => true,
      aim: () => undefined,
      cast: () => undefined,
      declare: () => undefined,
      spent: [...(mon.shed ?? []), ...(mon.mult ? ["mult"] : [])],
      room: 0,
    })) {
      if (!chip.aims || !duoCanSkill(duel, mon, chip.skill, target)) continue;
      if (out.some((one) => one.act === chip.skill)) continue;
      out.push({ act: chip.skill, label: castName(card.id, chip.skill) });
    }
    return out;
  }
  /** The ally's blow picked: the second one casts the spell. */
  function duoPick(act: DuoPick["act"]) {
    if (!duel || aim?.kind !== "spell" || aim.spellId !== DUO_CARD || !aim.duo?.ask || !aim.from) return;
    const picks = [...aim.duo.picks, { uid: aim.duo.ask, act }];
    if (picks.length < 2) {
      setAim({ ...aim, duo: { picks } });
      holdNotice("Chọn quái đồng minh thứ 2.");
      return;
    }
    const target = aim.from;
    const index = aim.index;
    setAim(null);
    holdNotice("");
    apply(castSpell(duel, index, target, false, duoCode(picks)));
  }
  /** Quả trứng thiên sứ: one monster aimed at = cast at once; several = an icon waits while one of them is picked. */
  function startEgg(index: number) {
    if (!duel) return;
    const picks = eggAllies(duel, viewer);
    if (picks.length === 0) {
      holdNotice("Chưa có quái nào của bạn bị tấn công hoặc bị kỹ năng nhắm.");
      return;
    }
    if (picks.length === 1) {
      apply(castSpell(duel, index, picks[0]));
      return;
    }
    playCue("chain");
    setAim({ kind: "spell", index, spellId: "qua-trung-thien-su" });
    holdNotice("Chọn 1 quái bị nhắm đến để trả đòn.");
  }
  /** Suối nguồn sinh mệnh: 1 đồng minh thì dùng ngay; nhiều thì icon chờ giữa sân trong lúc chọn. */
  function startSpring(index: number) {
    if (!duel) return;
    const id = duel.players[viewer].hand[index] ?? SPRING;
    const picks = springAllies(duel, viewer);
    if (picks.length === 0) {
      holdNotice("Chưa có quái thú đồng minh nào trên sân.");
      return;
    }
    if (picks.length === 1) {
      apply(castSpell(duel, index, picks[0]));
      return;
    }
    playCue("chain");
    setAim({ kind: "spell", index, spellId: id });
    holdNotice("Chọn 1 quái thú đồng minh để hồi máu.");
  }
  function cancelPick() {
    setAim(null);
    setLockPick(null);
    setVowAsk(null);
    setHornAsk(null);
    setKnightAsk(null);
    setChronoAsk(null);
    setDigPick(null);
    setRiteHand(null);
    setReviveAsk(null);
    holdNotice("");
  }
  /**
   * Tường thành (chủ game 29/10, xếp dọc 01/11): cards lying across, the first at the spot the owner sets in the settings screen,
   * the rest stacked in a column toward the middle of the board (the opponent's go down, yours go up). Gương phòng hộ
   * shows the turns it has left. In % of the board: the centre and the size (the same anchor as the settings screen).
   */
  const wallCards = (side: Side) => {
    const spot = side === viewer ? board.wall : board.wallFoe;
    const toward = side === viewer ? -1 : 1;
    const walls = !spot.hidden && duel.players[side].mirror > 0 ? [{ id: "guong-phong-ho", left: duel.players[side].mirror }] : [];
    return walls.map((wall, index) => ({ ...wall, x: spot.x, y: spot.y + toward * index * (spot.height + WALL_GAP), w: spot.width, h: spot.height }));
  };
  // Bàn cắt giữa sân thì không còn chỗ cho bảng thông báo: chỉ hiện khi bấm một chấm lịch sử (chủ game 28/10).
  const compact = cut.to - cut.from > 1;
  // Nút OK: bên kia đã bỏ lượt thì lần bấm này kết thúc vòng (đồng hồ cát), chưa thì chỉ chuyển quyền (mũi tên).
  const closesRound = Boolean(duel.skipped?.[1 - viewer]);
  const trailSlots = compact ? 3 : TRAIL_SLOTS;
  // Before the transition effect has run, a blow about to land still shows the HP it hits at its old value.
  const lastDuel = prevDuel.current;
  const landingNow = lastDuel && lastDuel !== duel ? attackLanding(lastDuel, duel, viewer, board.marks) : null;
  const heldHp = (side: Side) => (landingNow?.kind === "face" && lastDuel && duel.players[side].hp < lastDuel.players[side].hp ? lastDuel.players[side].hp : undefined);
  const marks = board.marks;
  const artTop = topArt(foe.env);
  const artBottom = bottomArt(you.env);
  const fieldLayout = loadField();
  const selected = you.field.find((mon) => mon && aim && "uid" in aim && aim.uid === mon.uid) ?? null;
  const selectedCard = selected ? monsterCard(selected.cardId) : undefined;

  function seal(prev: Duel, next: Duel) {
    const memo = matchRef.current;
    const kept = noteFinishedAi(prev, next, memo);
    if (!kept.saved) return;
    if (memo) memo.saved = true;
    else matchRef.current = { id: kept.id, startedAt: kept.startedAt, decks: null, saved: true };
  }

  /** Đấu lại / Chơi lại here: a new match of the same mode (Vs Máy against the machine again). */
  function rematchHere() {
    if (!duel) return;
    const next = newMatch(duel.mode);
    if (next.mode === "ai" && next.step === "main" && next.winner === null) {
      warmMatchHistory();
      matchRef.current = { id: newMatchId(), startedAt: Date.now(), decks: openingDecks(next.players), saved: false };
    } else matchRef.current = null;
    apply(next);
  }

  /** Chơi lại on the summary: Vs Máy plays the machine again, Đánh thường looks for a new match with the same deck,
   *  Tuỳ chọn asks the same pair to play again in the same room. */
  function playAgain() {
    if (!duel) return;
    if (duel.mode !== "net") {
      rematchHere();
      return;
    }
    if ((net as { quick?: boolean } | null)?.quick) {
      sessionStorage.removeItem("clash-net");
      sessionStorage.setItem("clash-requeue", "1");
      void navigate({ to: "/modes" });
      return;
    }
    againRef.current = true;
    setAgain(true);
  }

  /** Tiếp tục: back to Chọn bộ bài; online, the room is told this side has left. */
  function leaveMatch() {
    const seat = netRef.current;
    if (duel?.mode === "net" && seat && duel.winner !== null) {
      const votes: [AgainVote, AgainVote] = duel.again ?? [null, null];
      const left: [AgainVote, AgainVote] = seat.seat === "host" ? ["left", votes[1]] : [votes[0], "left"];
      void pushDuel({ data: { code: seat.code, seat: seat.seat, duel: JSON.stringify({ ...duel, again: left, glimpse: null }) } }).catch(() => undefined);
    }
    againRef.current = false;
    sessionStorage.removeItem("clash-net");
    void navigate({ to: "/modes" });
  }

  /**
   * Hàng chờ (chủ game 28/10): one action of this screen's player at the opponent waits here, unseen by them, until
   * the tick confirms it; answers to the opponent's action wait the same way, and the reply stays with this side so it
   * can add more answers before the tick. Nothing that waits leaves this screen.
   */
  function queueStep(prev: Duel, next: Duel): { next: Duel; kind: "act" | "answer" } | null {
    if (!mine || tutorial || next.winner !== null || next.mid !== prev.mid) return null;
    // A choice the rules ask for while an action resolves (Kỵ sĩ bóng tối's stance, a pick of cards…) is made at once.
    if (prev.parley || next.parley || prev.soulAsk || prev.swordAsk || prev.plumeAsk || prev.birdAsk || prev.clockAsk || prev.preyAsk || prev.reel || prev.recall || dueKnight) return null;
    const declared =
      !queue &&
      prev.step === "main" &&
      prev.turn === viewer &&
      prev.countering == null &&
      next.countering == null &&
      next.step === "respond" &&
      // A standing Gương phòng hộ keeps the reply with the attacker, yet the attack still waits in the queue (chủ game 03/11).
      Boolean(next.hold && !next.hold.stage && (next.hold.priority !== viewer || next.hold.mirror === "up")) &&
      // Mũ ma pháp only covers this side's own field, so it is not an action at the opponent.
      !(next.pending?.kind === "spell" && next.pending.cardId === "mu-ma-phap");
    if (declared) return { next: stageHold(next), kind: "act" };
    const replying = prev.step === "respond" && Boolean(prev.hold && !prev.hold.stage && prev.hold.priority === viewer);
    if ((replying && queue?.kind !== "act") || queue?.kind === "answer") {
      const kept =
        next.step === "respond" && next.hold && !next.hold.stage && next.hold.priority !== viewer
          ? { ...next, hold: { ...next.hold, priority: viewer, passed: [false, false] as [boolean, boolean] } }
          : next;
      return { next: kept, kind: "answer" };
    }
    return null;
  }

  function apply(next: Duel) {
    if (!duel || next === duel) return;
    const held = queueStep(duel, next);
    if (held) {
      const base = duel;
      const icons = chain;
      setQueue((current) => current ?? { kind: held.kind, base, chain: icons });
    } else if (queue) {
      // A move made at once while answers waited takes them along to the other side.
      setQueue(null);
      setPeek(false);
    }
    land(held ? held.next : next, Boolean(held));
  }

  /** The tick: the queued action goes to the opponent, or the answers go and the reply passes to the other side. */
  function confirmQueue() {
    if (!duel || !queue) return;
    const kind = queue.kind;
    setQueue(null);
    setPeek(false);
    if (kind === "act") {
      const sent = confirmStage(duel);
      if (mirrorWaits(sent, viewer)) setMirrorBack({ base: queue.base, chain: queue.chain });
      land(sent);
      return;
    }
    const open = duel.step === "respond" && duel.hold && !duel.hold.stage && duel.hold.priority === viewer;
    land(open && duel.hold ? { ...duel, hold: { ...duel.hold, priority: otherSide, passed: [false, false] } } : { ...duel });
  }

  /** X: everything queued goes back (cards to the hand, mana back); the opponent never saw any of it. */
  function cancelQueue() {
    if (!duel || !queue) return;
    const { base, chain: icons } = queue;
    setQueue(null);
    setPeek(false);
    setAim(null);
    setInspect(null);
    prevDuel.current = base;
    setChain(icons);
    holdNotice("");
    setDuel(base);
  }

  /** X lúc Gương phòng hộ đứng chờ bên đánh: đòn rút lại, bàn về như trước khi đánh; đối thủ đã thấy đòn nên cũng được gửi. */
  function withdrawMirror() {
    if (!duel || !mirrorBack) return;
    const { base, chain: icons } = mirrorBack;
    setMirrorBack(null);
    setPeek(false);
    prevDuel.current = base;
    setChain(icons);
    land({ ...base, live: "Rút lại đòn đánh." });
  }

  /** A move this screen's player cannot make while something waits in the queue. */
  function queueBlocked(): boolean {
    if (!queue) return false;
    holdNotice("Hãy huỷ hàng chờ trước.");
    return true;
  }

  /** Puts a new state of the match on this screen and, unless it only waits here (`local`), sends it online. */
  function land(next: Duel, local = false) {
    if (!duel || next === duel) return;
    seal(duel, next);
    if (duel.mode === "test") setTestPast((list) => [...list, structuredClone(duel)].slice(-40));
    const previous = duel;
    // Gương phòng hộ vừa dựng trước đòn của bên này (dù đòn đi đường nào): giữ bàn lúc trước để X rút lại được (chủ game 09/11).
    if (previous.step === "main" && mirrorWaits(next, previous.turn) && previous.turn === viewer) setMirrorBack((kept) => kept ?? { base: previous, chain });
    const ticket = pushGen.current + 1;
    pushGen.current = ticket;
    holdNotice(next.live, true, next.clock);
    setAim(null);
    setInspect(null);
    setBlockChoice(null);
    setChronoAsk(null);
    setChronoWarn(null);
    setChronoSpin(null);
    setBusy(true);
    window.setTimeout(() => setBusy(false), 180);
    setDuel(next);
    const seat = netRef.current;
    if (local || duel.mode !== "net" || !seat) return;
    void pushDuel({ data: { code: seat.code, seat: seat.seat, duel: JSON.stringify({ ...next, glimpse: null }) } }).then((pushed) => {
      if (ticket !== pushGen.current) return;
      if (!pushed.ok) {
        holdNotice(pushed.error);
        setDuel(previous);
        return;
      }
      rev.current = pushed.rev;
    });
  }

  /** Bài khởi đầu: the picked opening cards (indexes over the 2 monsters, then the spell) are replaced. Online, both
   *  sides choose at once, so a pick that clashes with the other side's is put on top of it when the poll brings it. */
  function leaveWatch() {
    if (replay || sessionStorage.getItem(REPLAY_KEY)) {
      leaveReplay();
      return;
    }
    sessionStorage.removeItem(WATCH_KEY);
    sessionStorage.removeItem(WATCH_SEAT_KEY);
    void navigate({ to: "/friends" });
  }

  /** Thoát xem lại: về đúng trang đã mở hồ sơ, hồ sơ mở lại (PROFILE_BACK_KEY). */
  function leaveReplay() {
    sessionStorage.removeItem(REPLAY_KEY);
    sessionStorage.removeItem(WATCH_SEAT_KEY);
    let path = "/friends";
    try {
      const back = JSON.parse(sessionStorage.getItem(PROFILE_BACK_KEY) ?? "null") as { path?: string } | null;
      if (back?.path === "/" || back?.path === "/friends") path = back.path;
    } catch {
      // Không đọc được: về Bạn bè.
    }
    void navigate({ to: path });
  }

  function seekReplay(at: number, playing?: boolean) {
    setReplay((current) => {
      if (!current) return current;
      const next = Math.max(0, Math.min(at, current.book.length - 1));
      setDuel({ ...current.book.frame<Duel>(next), mode: "net", glimpse: null });
      return { ...current, at: next, playing: (playing ?? current.playing) && next < current.book.length - 1 };
    });
  }

  function confirmOpener(picked: number[]) {
    if (!duel?.opener) return;
    const count = you.reserve.length;
    const pick: OpenerPick = { reserve: picked.filter((index) => index < count), hand: picked.filter((index) => index >= count).map((index) => index - count) };
    const next = openerSwap(duel, viewer, pick);
    if (next === duel) return;
    setDuel(next);
    const seat = netRef.current;
    if (duel.mode !== "net" || !seat) return;
    openerWant.current = { side: viewer, pick };
    const ticket = pushGen.current + 1;
    pushGen.current = ticket;
    void pushDuel({ data: { code: seat.code, seat: seat.seat, duel: JSON.stringify({ ...next, glimpse: null }) } }).then((pushed) => {
      if (ticket === pushGen.current && pushed.ok) rev.current = pushed.rev;
    });
  }

  function pickChrono(targetUid: string) {
    if (!duel || aim?.kind !== "skill") return;
    if (targetUid === aim.uid) {
      setAim(null);
      return;
    }
    const choice = chronoChoice(duel, aim.uid, targetUid);
    if (!choice || chronoHighAlly(duel, aim.uid, targetUid)) {
      holdNotice("Không chọn được mục tiêu này");
      return;
    }
    const ally = duel.players[duel.turn].field.find((unit) => unit?.uid === targetUid) ?? null;
    if (ally) {
      setAim(null);
      if (chronoImmortal(ally) || chronoSpecial(ally)) {
        setChronoAsk({ caster: aim.uid, target: targetUid, age: false, pass: true });
        return;
      }
      apply(useSkill(duel, aim.uid, targetUid, 0, true));
      return;
    }
    const foeSide = (1 - duel.turn) as Side;
    const enemy = duel.players[foeSide].field.find((unit) => unit?.uid === targetUid);
    if (!enemy || chronoImmortal(enemy)) {
      holdNotice("Không chọn được mục tiêu này");
      return;
    }
    setAim(null);
    setChronoAsk({ caster: aim.uid, target: targetUid, age: !chronoSpecial(enemy), pass: chronoSpecial(enemy) });
  }

  function clearShown() {
    setFloaters([]);
    setMotion({ pops: [], lunges: [], hits: [] });
    setBurst(null);
    setShake(false);
    setChain([]);
    setLockFlash(null);
    setStarFlash(null);
  }

  function undoTest() {
    const prev = testPast.at(-1);
    if (!prev) return;
    setQueue(null);
    setPeek(false);
    prevDuel.current = prev;
    seenViewer.current = viewerSide(prev, boardActor(prev), netRef.current?.seat ?? null);
    trailLog.current = [];
    windupText.current = null;
    setTrailDots([]);
    setPinnedId(null);
    holdNotice("");
    setAim(null);
    setInspect(null);
    setBlockChoice(null);
    setChronoAsk(null);
    setChronoWarn(null);
    setChronoSpin(null);
    setKnightAsk(null);
    setHornAsk(null);
    setBlessArm(false);
    setSwapPick([]);
    setReflectPick(null);
    setAmbushPick(null);
    setStrike(null);
    setLook(null);
    setDrag(null);
    clearShown();
    setDuel(prev);
    setTestPast((list) => list.slice(0, -1));
  }

  function restartTest() {
    if (!duel || duel.mode !== "test") return;
    const fresh = openingDraw(createDuel(loadDeck(), "test"));
    setTestPast((list) => [...list, structuredClone(duel)].slice(-40));
    prevDuel.current = fresh;
    seenViewer.current = viewerSide(fresh, boardActor(fresh), netRef.current?.seat ?? null);
    trailLog.current = [];
    windupText.current = null;
    setTrailDots([]);
    setPinnedId(null);
    holdNotice("Ván test bắt đầu lại.");
    setAim(null);
    setInspect(null);
    setBlockChoice(null);
    setChronoAsk(null);
    setChronoWarn(null);
    setChronoSpin(null);
    setKnightAsk(null);
    setHornAsk(null);
    setBlessArm(false);
    setSwapPick([]);
    setReflectPick(null);
    setAmbushPick(null);
    setStrike(null);
    setLook(null);
    setDrag(null);
    clearShown();
    setDuel(fresh);
  }

  function armReset(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    window.clearTimeout(resetHold.current);
    resetHold.current = window.setTimeout(() => {
      resetHold.current = 0;
      restartTest();
    }, 650);
  }

  function releaseReset() {
    if (!duel || !resetHold.current) return;
    window.clearTimeout(resetHold.current);
    resetHold.current = 0;
    if (!canTestReset(duel)) return;
    apply(testReset(duel));
  }

  function cancelReset() {
    window.clearTimeout(resetHold.current);
    resetHold.current = 0;
  }

  /** The second tap of a double tap on the same card in hand (chủ game 28/10: bấm đôi mở bảng lá). */
  function secondTap(pile: "reserve" | "spell", index: number) {
    const last = lastTap.current;
    return Boolean(last && last.pile === pile && last.index === index && Date.now() - last.at < DOUBLE_TAP);
  }

  function openSheet(pile: "reserve" | "spell", index: number) {
    lastTap.current = null;
    setHandPick(null);
    setInspect({ pile, index });
  }

  // One tap picks the card (its row arrows or its use icon show), a second tap soon after opens its sheet.
  /** Chưa rút bài nên thiếu đúng 1 sao để triệu hồi quái này: rút 1 lá là đủ. */
  function needsDraw(stars: number) {
    if (!duel || !canPlay) return false;
    const mine = duel.players[viewer];
    return mine.stars < stars && mine.stars + 1 >= stars && mine.draws < 1 && pileLeft(mine) > 0;
  }

  function openHand(pile: "reserve" | "spell", index: number, id: string) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!tutorial) {
      // Theo video (chủ game 13/11): bấm lá = nhấc lá + bảng ngắn; bấm lại = kỹ năng kế (hết thì về đầu). Bấm giữ mở bảng đầy đủ.
      setInspect(null);
      if (handPick?.pile === pile && handPick.index === index && handPick.id === id) {
        setPeekAt((at) => at + 1);
        playUi("soft");
        return;
      }
      playUi("select");
      setHandPick({ pile, index, id });
      return;
    }
    if (secondTap(pile, index)) {
      openSheet(pile, index);
      return;
    }
    lastTap.current = { pile, index, at: Date.now() };
    if (pile === "reserve" && duel && canPlay) {
      const wanted = monsterCard(id);
      const mine = duel.players[viewer];
      if (wanted && !needsDraw(wanted.stars) && mine.stars < wanted.stars && wanted.id !== "trieu-hoi-ac-ma" && mine.draws >= 1) stuckHint(wanted.stars);
    }
    turnOneHint();
    setInspect(null);
    setHandPick((current) => (current?.pile === pile && current.index === index ? null : { pile, index, id }));
  }

  function begin(event: ReactPointerEvent, payload: Grab) {
    if (!mine || pressing.current) return;
    suppressClick.current = false;
    grab.current = payload;
    origin.current = { x: event.clientX, y: event.clientY, moved: false, t: Date.now(), pan: false, lastX: event.clientX };
    torch.current = payload.kind === "unit" || payload.kind === "summon" ? lightTorch(event.clientX, event.clientY) : null;
    event.currentTarget.setPointerCapture(event.pointerId);
    window.clearTimeout(riteHold.current);
    if (!tutorial && payload.kind !== "unit") {
      // Bấm giữ lá trên tay mở bảng mô tả đầy đủ (chủ game 13/11, thay bấm đôi và bấm giữ hiến tế cũ).
      const pile = payload.kind === "summon" ? "reserve" : "spell";
      riteHold.current = window.setTimeout(() => {
        if (origin.current.moved || grab.current !== payload) return;
        suppressClick.current = true;
        grab.current = null;
        setStage(null);
        openSheet(pile, payload.index);
      }, 480);
    } else if (payload.kind === "summon") {
      const level = duel?.players[viewer].reserve[payload.index]?.saved?.level ?? 1;
      if (vowCap(payload.card.id, level) > 0) {
        riteHold.current = window.setTimeout(() => {
          if (origin.current.moved) return;
          suppressClick.current = true;
          setRiteHand((current) => (current === payload.index ? null : payload.index));
        }, 480);
      }
    }
  }

  function move(event: ReactPointerEvent) {
    const payload = grab.current;
    if (!payload) return;
    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;
    if (!origin.current.moved && dx * dx + dy * dy < 81) return;
    window.clearTimeout(riteHold.current);
    const strip = handStrip.current;
    if (!origin.current.moved && (payload.kind === "summon" || payload.kind === "spell") && strip && strip.scrollWidth > strip.clientWidth + 2 && Math.abs(dx) > Math.abs(dy)) {
      origin.current.pan = true;
    }
    origin.current.moved = true;
    if (origin.current.pan && strip) {
      strip.scrollLeft -= event.clientX - origin.current.lastX;
      origin.current.lastX = event.clientX;
      return;
    }
    setInspect(null);
    setHandPick(null);
    setDrag({ ...payload, x: event.clientX, y: event.clientY });
    if (snapPool.current?.grab !== payload) snapPool.current = { grab: payload, keys: snapKeys(payload) };
    setSnap(snapAt(payload, event.clientX, event.clientY));
  }

  /** The targets this drag can land on, by the match's own rules: empty slots it can be summoned into, enemies it can attack. */
  function snapKeys(payload: Grab): Set<string> {
    const keys = new Set<string>();
    if (payload.kind === "spell") return spellAimOf(payload.spellId) ? spellKeys(payload.spellId, payload.index) : keys;
    if (!duel || !canPlay || responding || duel.step !== "main" || queue) return keys;
    if (payload.kind === "summon") {
      if (!tutorial || riteHand === payload.index) return keys;
      for (const slot of [...ROW_SLOTS.front, ...ROW_SLOTS.back]) {
        if (!you.field[slot] && took(summon(duel, payload.index, slot))) keys.add(`${viewer}-${slot}`);
      }
      return keys;
    }
    if (payload.kind === "unit" && !aim) return dropPlan(payload.uid)?.keys ?? attackKeys(payload.uid);
    return keys;
  }

  /** The enemies (and the player) this monster can attack now, by the rules. */
  function attackKeys(uid: string): Set<string> {
    const keys = new Set<string>();
    if (!duel) return keys;
    const side = (1 - viewer) as Side;
    foe.field.forEach((mon, slot) => {
      if (!mon) return;
      const next = attackMonster(duel, uid, mon.uid);
      if (next !== duel && (next.pending?.kind === "melee" || Boolean(next.soulAsk && !duel.soulAsk) || Boolean(next.swordAsk && !duel.swordAsk))) keys.add(`${side}-${slot}`);
    });
    const face = attackFace(duel, uid);
    if (face !== duel && (face.pending?.kind === "face" || Boolean(face.soulAsk && !duel.soulAsk) || Boolean(face.swordAsk && !duel.swordAsk))) keys.add("face");
    return keys;
  }

  /**
   * The monsters a spell with a target can take now (V8B, chủ game 03/11), by its own rule; for Phản nguyền and Hộp ma
   * thuật, the ally first (`from` unset) then the enemy.
   */
  function spellKeys(id: string, index: number, from?: string): Set<string> {
    const keys = new Set<string>();
    if (!duel || !mine || duel.hold?.stage || !spellDragLive(id, duel, viewer, index)) return keys;
    const foeSide = (1 - viewer) as Side;
    const each = (side: Side, take: (mon: FieldMon) => boolean) =>
      duel.players[side].field.forEach((mon, slot) => {
        if (mon && mon.cardId !== "mu" && take(mon)) keys.add(`${side}-${slot}`);
      });
    if (id === "phan-nguyen") {
      if (from) each(foeSide, () => true);
      else each(viewer, (mon) => harmShift(mon));
      return keys;
    }
    if (id === WILE_CARDS.gust) {
      const birds = wileBirds(duel, viewer);
      each(viewer, (mon) => birds.includes(mon.uid));
      return keys;
    }
    if (id === WILE_CARDS.charm) {
      const birds = wileBirds(duel, viewer);
      if (aim?.kind === "spell" && aim.wile) each(viewer, (mon) => birds.includes(mon.uid));
      else if (!from) each(foeSide, (mon) => mon.hp > 0);
      else each(viewer, (mon) => mon.hp > 0);
      return keys;
    }
    if (id === DUO_CARD) {
      if (!from) each(foeSide, (mon) => duoTargets(duel, viewer).includes(mon.uid));
      else each(viewer, (mon) => duoAllies(duel, viewer).includes(mon.uid) && !(aim?.kind === "spell" && aim.duo?.picks.some((pick) => pick.uid === mon.uid)));
      return keys;
    }
    if (id === "hop-ma-thuat") {
      if (from) each(foeSide, (mon) => boxFoes(duel, viewer).includes(mon.uid));
      else each(viewer, (mon) => boxAllies(duel, viewer).includes(mon.uid));
      return keys;
    }
    if (isSpring(id)) {
      const picks = springAllies(duel, viewer);
      each(0, (mon) => picks.includes(mon.uid));
      each(1, (mon) => picks.includes(mon.uid));
      return keys;
    }
    const aims = spellAimOf(id);
    if (!aims) return keys;
    const cards = duel.players[viewer].hand.length;
    each(aims === "foe" ? foeSide : viewer, (mon) => {
      if (id === "soi-xich-dia-nguc" || id === "huy-diet") return true;
      if (id === "sung-loi-pha") return hornFit(mon.cardId);
      if (id === "phuc-kich") return ambushReady(mon);
      if (id === "qua-trung-thien-su") return eggAllies(duel, viewer).includes(mon.uid);
      if (id === "ngan-chan-phong-ngu") return shelterPicks(duel).includes(mon.uid);
      // The others by the rule itself: the card leaves the hand only on a target it takes.
      return castSpell(duel, index, mon.uid).players[viewer].hand.length < cards;
    });
    return keys;
  }

  /** The spell being aimed now (dragged, or picked with Use), if it takes a target. */
  function spellAim(): { id: string; index: number; from?: string } | null {
    if (drag?.kind === "spell") return spellAimOf(drag.spellId) ? { id: drag.spellId, index: drag.index } : null;
    if (aim?.kind === "spell" && (spellAimOf(aim.spellId) || aim.spellId === "phan-nguyen" || aim.spellId === "hop-ma-thuat" || aim.spellId === DUO_CARD || aim.spellId === WILE_CARDS.gust || aim.spellId === WILE_CARDS.charm)) return { id: aim.spellId, index: aim.index, from: aim.from };
    return null;
  }

  /**
   * The targets a button can slide to (ấn giữ rồi trượt, chủ game 31/10): the ones a tap after the button would take,
   * found by running the same rule a tap runs.
   */
  function slideKeys(slide: ChipSlide): Set<string> {
    const keys = new Set<string>();
    if (!duel || !canPlay || duel.step !== "main" || queue) return keys;
    if (slide.kind === "attack") return attackKeys(slide.uid);
    const caster = you.field.find((unit) => unit?.uid === slide.uid);
    const card = caster ? monsterCard(caster.cardId) : undefined;
    if (!caster || !card) return keys;
    const changed = (next: Duel) => next !== duel;
    const each = (side: Side, take: (mon: FieldMon) => boolean) =>
      duel.players[side].field.forEach((mon, slot) => {
        if (mon && take(mon)) keys.add(`${side}-${slot}`);
      });
    const foeSide = (1 - viewer) as Side;
    if (card.id === "phu-thuy-thoi-gian") {
      each(viewer, (mon) => mon.uid !== caster.uid && Boolean(chronoChoice(duel, caster.uid, mon.uid)) && !chronoHighAlly(duel, caster.uid, mon.uid));
      each(foeSide, (mon) => Boolean(chronoChoice(duel, caster.uid, mon.uid)) && !chronoImmortal(mon));
      return keys;
    }
    if (twoStep(card.id, slide.index)) {
      each(foeSide, () => true);
      return keys;
    }
    // Pháo kích (chủ game 23/11): bước 1 là mục tiêu (quái địch, người chơi; lá tường thành bấm thẳng vào lá), bước 2 là đạn.
    if (card.id === CATAPULT) {
      each(foeSide, (mon) => mon.hp > 0);
      keys.add("face");
      return keys;
    }
    if (allySkill(card.id)) {
      const selfOk = card.id === "thien-than-be-nho";
      each(viewer, (mon) => (selfOk || mon.uid !== caster.uid) && changed(useSkill(duel, caster.uid, mon.uid, slide.index, true)));
      return keys;
    }
    each(foeSide, (mon) =>
      changed(shotSkill(card.id) ? declareSkill(duel, caster.uid, mon.uid, slide.index) : useSkill(duel, caster.uid, mon.uid, slide.index, true)),
    );
    if (faceSkill(card.id, slide.index) && changed(declareSkill(duel, caster.uid, null, slide.index))) keys.add("face");
    return keys;
  }

  /**
   * Nhấp icon rồi bấm xuống và rê (chủ game 01/11): with Tấn công or a skill on, a touch anywhere on the field lights a
   * torch at that point; moving lights the target its beam picks (as an attack drag does) and letting go picks it, as
   * tapping it would. Letting go with nothing lit turns the button off. A tap with no move is a plain tap, as before.
   */
  function startPress(event: ReactPointerEvent) {
    if (!duel || event.button > 0 || drag || grab.current) return;
    const cast = aim?.kind === "spell" ? spellAim() : null;
    if (aim?.kind !== "attack" && aim?.kind !== "skill" && !cast) return;
    const target = event.target as HTMLElement;
    if (target.closest(".unit-acts, .hand, .act, .aim-mark, .rp-bar") || (target.closest("button") && !target.closest(".slot, .face-drop"))) return;
    // Bấm Use rồi rê trên sân (V8B): a spell with a target lights its targets the same way.
    const keys = cast ? spellKeys(cast.id, cast.index, cast.from) : aim?.kind === "attack" ? attackKeys(aim.uid) : aim?.kind === "skill" ? (aim.also ? alsoKeys() : slideKeys({ kind: "skill", uid: aim.uid, index: aim.index })) : new Set<string>();
    if (keys.size === 0) return;
    const lamp = lightTorch(event.clientX, event.clientY);
    torch.current = lamp;
    pressing.current = true;
    const pointer = event.pointerId;
    let moved = false;
    let lit: string | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      if (!moved && Math.hypot(e.clientX - lamp.x, e.clientY - lamp.y) > 9) moved = true;
      if (!moved) return;
      const hit = under(e.clientX, e.clientY);
      const direct = (hit?.closest("[data-slot]") as HTMLElement | null)?.dataset.slot ?? (hit?.closest(".face-drop") ? "face" : null);
      lit = aimTorch(lamp, torchBoxes(keys), e.clientX, e.clientY, direct && keys.has(direct) ? direct : null);
      setSnap(lit);
    };
    const stop = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      pressing.current = false;
      if (torch.current === lamp) torch.current = null;
      if (!moved) return;
      setSnap(null);
      if (e.type === "pointercancel") return;
      if (lit) {
        holdNotice("");
        slideFire.current(lit);
      } else {
        setAim(null);
        holdNotice("");
      }
      // The click after this press must not pick again.
      suppressClick.current = true;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function hitsHand(x: number, y: number): boolean {
    return Boolean(under(x, y)?.closest(".hand"));
  }

  function snapNode(key: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(key === "face" ? ".face-drop" : `[data-slot="${key}"]`);
  }

  /**
   * The target a drag points at. A summon: up or down picks the row (front or back of your side), across picks the empty
   * slot nearest the finger in it; the other row when this one is full. An attack: the enemy (or the player) nearest the
   * finger, once it is above your front row. A finger right on a target keeps that target; over the hand, nothing.
   */
  function snapAt(payload: Grab, x: number, y: number): string | null {
    const keys = snapPool.current?.grab === payload ? snapPool.current.keys : null;
    if (!keys || keys.size === 0) return null;
    const hit = under(x, y);
    if (hit?.closest(".hand")) return null;
    const direct = (hit?.closest("[data-slot]") as HTMLElement | null)?.dataset.slot ?? (hit?.closest(".face-drop") ? "face" : null);
    if (direct && keys.has(direct) && payload.kind !== "unit" && payload.kind !== "summon") return direct;
    if (payload.kind === "summon") {
      // Your own monster under the finger: fusion or a sacrifice, as before.
      if (direct && direct.startsWith(`${viewer}-`) && you.field[Number(direct.split("-")[1])]) return null;
      // Kéo triệu hồi kiểu đèn pin (chủ game 01/11): cùng cách kéo đánh, mục tiêu = các ô trống của sân mình.
    }
    if (!torch.current) torch.current = lightTorch(origin.current.x, origin.current.y);
    // Kéo triệu hồi: nhích nhẹ theo hướng là đổi ô như kéo skill, không cần kéo đúng ô (chủ game 03/11).
    return aimTorch(torch.current, torchBoxes(keys), x, y, payload.kind === "summon" ? null : direct && keys.has(direct) ? direct : null);
  }

  /**
   * The targets an attack (drag or Tấn công) or a skill can pick now, and the sides it looks at; the monsters there that it
   * cannot pick glow red (chủ game 01/11, T2). Kept until the match, the aim or the dragged monster changes.
   */
  function targetPlan(): TargetPlan | null {
    if (!duel) return null;
    const cast = spellAim();
    const uid = drag?.kind === "unit" ? drag.uid : cast ? `spell:${cast.id}:${cast.index}:${cast.from ?? ""}` : null;
    const cache = planCache.current;
    if (lockPick) {
      // Khoá 1: every living enemy monster can be locked.
      const lockUid = `lock:${lockPick.uid}`;
      if (cache.duel === duel && cache.aim === aim && cache.uid === lockUid) return cache.plan;
      const picks = lockChoices(duel, lockPick.uid);
      const keys = new Set<string>();
      foe.field.forEach((mon, slot) => {
        if (mon && picks.includes(mon.uid)) keys.add(`${(1 - viewer) as Side}-${slot}`);
      });
      const plan = { keys, foe: true, you: false, caster: lockPick.uid };
      planCache.current = { duel, aim, uid: lockUid, plan };
      return plan;
    }
    if (cache.duel === duel && cache.aim === aim && cache.uid === uid) return cache.plan;
    if (cast) {
      // Phép có mục tiêu (V8B): only the monsters it can take glow; the others on its side are marked as not pickable.
      const keys = spellKeys(cast.id, cast.index, cast.from);
      const onFoe = cast.id === WILE_CARDS.gust ? false : cast.id === WILE_CARDS.charm ? !cast.from && !(aim?.kind === "spell" && aim.wile) : cast.id === DUO_CARD ? !cast.from : cast.id === "phan-nguyen" || cast.id === "hop-ma-thuat" ? Boolean(cast.from) : spellAimOf(cast.id) === "foe";
      const plan = { keys, foe: onFoe, you: !onFoe, caster: "" };
      planCache.current = { duel, aim, uid, plan };
      return plan;
    }
    if (!canPlay || responding || duel.step !== "main" || queue) return null;
    let plan: TargetPlan | null = null;
    if (uid && !aim) {
      const keys = snapPool.current?.grab.kind === "unit" && snapPool.current.grab.uid === uid ? snapPool.current.keys : attackKeys(uid);
      plan = { keys, foe: true, you: [...keys].some((key) => key.startsWith(`${viewer}-`)), caster: uid };
    }
    else if (aim?.kind === "attack") plan = { keys: attackKeys(aim.uid), foe: true, you: false, caster: aim.uid };
    else if (aim?.kind === "skill" && aim.also) plan = { keys: alsoKeys(), foe: false, you: true, caster: aim.uid };
    else if (aim?.kind === "skill" && !aim.also) {
      const id = you.field.find((unit) => unit?.uid === aim.uid)?.cardId ?? "";
      const both = id === "phu-thuy-thoi-gian";
      const ally = allySkill(id);
      plan = { keys: slideKeys({ kind: "skill", uid: aim.uid, index: aim.index }), foe: both || !ally, you: both || ally, caster: aim.uid };
    }
    planCache.current = { duel, aim, uid, plan };
    return plan;
  }

  /** The next target of a skill with more than one (Dụ dỗ: the ally after the enemy): your monsters but the caster. */
  function alsoKeys(): Set<string> {
    const keys = new Set<string>();
    if (aim?.kind !== "skill" || !aim.also) return keys;
    you.field.forEach((mon, slot) => {
      if (mon && mon.uid !== aim.uid) keys.add(`${viewer}-${slot}`);
    });
    return keys;
  }

  /** The colour of the button now aiming (its icon's ring): Tấn công orange, a skill by its kind. */
  function aimKind(): UnitActKind {
    if (!duel || aim?.kind !== "skill") return "attack";
    const index = aim.index;
    const dry = unitRows(rowArgs(aim.uid, () => undefined, () => undefined, () => undefined, true));
    return dry?.rows.find((row) => row.slide?.kind === "skill" && row.slide.index === index)?.kind ?? "active";
  }

  /** The targets the arrows walk over now (the ones Tấn công or the skill can take). */
  function padKeys(): Set<string> {
    if (aim?.kind !== "attack" && aim?.kind !== "skill") return new Set();
    return targetPlan()?.keys ?? new Set();
  }

  /**
   * The target next to the lit one in a direction (mũi tên): ahead of it that way, within a wide cone, the nearest along
   * the way with a sideways miss counting double; none, the arrow hides.
   */
  function stepLit(dir: PadDir): string | null {
    if (!aimLit) return null;
    const boxes = torchBoxes(padKeys());
    const at = boxes.find((one) => one.key === aimLit);
    if (!at) return null;
    const cx = at.left + at.width / 2;
    const cy = at.top + at.height / 2;
    let best: string | null = null;
    let bestX = 0;
    let score = Infinity;
    for (const one of boxes) {
      if (one.key === aimLit) continue;
      const dx = one.left + one.width / 2 - cx;
      const dy = one.top + one.height / 2 - cy;
      const along = dir === "right" ? dx : dir === "left" ? -dx : dir === "down" ? dy : -dy;
      const side = Math.abs(dir === "left" || dir === "right" ? dy : dx);
      if (along < 6 || side > along * 1.8) continue;
      const cost = along + side * 2;
      // Gần bằng nhau (ô 4 và ô 6 quanh ô 5): lấy ô gần quái đang dùng hơn (chủ game 10/11).
      const tie = Math.abs(cost - score) < 8;
      const nearer = tie && padBox ? Math.abs(one.left + one.width / 2 - (padBox.left + padBox.width / 2)) < Math.abs(bestX - (padBox.left + padBox.width / 2)) : false;
      if (cost < score - 8 || (tie && (nearer || (!padBox && cost < score))) || (!tie && cost < score)) {
        score = Math.min(score, cost);
        best = one.key;
        bestX = one.left + one.width / 2;
      }
    }
    return best;
  }

  /** The boxes on screen of the targets a torch can pick. */
  function torchBoxes(keys: Set<string>): TorchBox[] {
    const boxes: TorchBox[] = [];
    for (const key of keys) {
      const box = snapNode(key)?.getBoundingClientRect();
      if (box && box.width > 0) boxes.push({ key, left: box.left, top: box.top, width: box.width, height: box.height });
    }
    return boxes;
  }

  function commitBlock(uid: string, skill: boolean, buff: boolean) {
    if (!duel) return;
    let next = assignBlock(duel, uid, skill);
    if (buff) next = answerFairy(next, uid, true);
    setBlessArm(false);
    apply(next);
  }

  function offerBlock(uid: string) {
    if (!duel) return;
    const mon = you.field.find((unit) => unit?.uid === uid) ?? null;
    if (!mon || mon.dim || mon.stun > 0 || mon.noBlock || mon.row === "back" || (mon.path ?? 0) > 0) {
      holdNotice(mon?.row === "back" ? "Hàng sau không phòng được." : "Quái này không chặn được");
      return;
    }
    if (mon.cardId === "ky-si-bong-toi" && !mon.clash) {
      const pending = duel.pending;
      const attackerUid = pending && (pending.kind === "face" || pending.kind === "melee") ? pending.attacker : "";
      const attacker = foe.field.find((unit) => unit?.uid === attackerUid) ?? null;
      setKnightAsk({ uid: mon.uid, foeUid: null, face: false, block: true, room: knightRoom(mon, attacker, you.field, foe.field) });
      return;
    }
    if (blessArm && mon.cardId === "yeu-tinh-chuc-phuc") {
      holdNotice("Kéo quái khác lên để chặn.");
      return;
    }
    const gnaw = mon.cardId === "chien-si-gam-nham" && you.orb >= skillManaCost(mon.cardId);
    const skill = duel.hold?.armed === uid ? true : gnaw ? null : false;
    const fairy = you.orb >= skillManaCost("yeu-tinh-chuc-phuc", 1) && you.field.some((unit) => unit && unit.cardId === "yeu-tinh-chuc-phuc" && unit.uid !== uid && !unit.dim && unit.stun === 0);
    const buff = blessArm && fairy ? true : fairy ? null : false;
    if (skill === null || buff === null) {
      setBlockChoice({ uid, skill, buff });
      return;
    }
    commitBlock(uid, skill, buff);
  }

  function pickBlock(patch: Partial<BlockChoice>) {
    if (!blockChoice) return;
    const next = { ...blockChoice, ...patch };
    if (next.skill !== null && next.buff !== null) {
      commitBlock(next.uid, next.skill, next.buff);
      return;
    }
    setBlockChoice(next);
  }

  function under(x: number, y: number) {
    return document.elementsFromPoint(x, y).find((node) => !node.closest(".ghost") && !node.closest(".inspect-dismiss") && !node.closest(".inspect-card")) ?? null;
  }

  /** Đòn cuối cùng: 1 quái vừa bị hạ thì nó gượng dậy ngay; nhiều quái thì chọn quái trước, rồi chọn đòn trên quái đó. */
  function startRite(index: number) {
    if (!duel) return;
    const dead = riteDeadFor(duel, viewer);
    if (dead.length === 0) {
      holdNotice("Đòn cuối cùng chỉ dùng ngay lúc quái của bạn vừa bị quái địch hạ.");
      return;
    }
    if (dead.length === 1 && dead[0]) {
      apply(castSpell(duel, index, null, false, dead[0].uid));
      return;
    }
    setRiteAsk({ index });
  }

  function openDig(index: number) {
    if (!duel) return;
    if (!canTargetFoe(duel)) {
      holdNotice("Lượt đầu không được nhắm đối thủ.");
      return;
    }
    if (digChoices(duel, viewer).length === 0) {
      holdNotice("Đối thủ chưa có lá đã rời sân.");
      return;
    }
    setDigPick({ index, id: null });
  }

  function finishDrop(hit: Element | null, payload: Grab, at?: { x: number; y: number }) {
    if (!duel) return;
    // While something waits, only answers to the opponent's action can still be added.
    if (queue && (queue.kind === "act" || duel.step !== "respond") && queueBlocked()) return;
    const slotEl = hit?.closest("[data-slot]") as HTMLElement | null;
    const owner = slotEl ? Number(slotEl.dataset.owner) : NaN;
    const index = slotEl ? Number(slotEl.dataset.index) : NaN;
    const foeUid = slotEl?.dataset.uid ?? "";
    if (payload.kind === "summon") {
      if (!tutorial) {
        // Kéo lá ra khỏi tay (chủ game 13/11): lá hiện to giữa sân với các lựa chọn; không còn thả thẳng vào ô.
        if (!at || !hitsHand(at.x, at.y)) openStage(payload.index);
        return;
      }
      const partner = foeUid ? you.field.find((unit) => unit?.uid === foeUid) : null;
      const ids = you.field.filter((unit): unit is NonNullable<typeof unit> => Boolean(unit)).map((unit) => unit.cardId);
      const recipe = partner ? findFusion(payload.card.id, partner.cardId) ?? findKnightFusion(payload.card.id, partner.cardId, ids) : null;
      if (canPlay && recipe && partner && slotEl && owner === viewer && index >= 0 && index < FIELD_SLOTS) {
        // Dropping a card on its fusion partner plays the same fusion scene as the Dung hợp button.
        const slotSpot = boardSpot(slotEl, { x: 50, y: 62, w: 18 });
        setFuseShow({
          index: payload.index,
          uid: partner.uid,
          slot: index as 0 | 1 | 2,
          resultId: recipe.result,
          phase: "lift",
          n: Date.now(),
          a: boardSpot(document.querySelector(`[data-reserve="${payload.index}"]`), { x: 30, y: 88, w: 18 }),
          b: slotSpot,
          at: slotSpot,
          ...trioOf(payload.card.id, partner),
        });
        return;
      }
      const cap = vowCap(payload.card.id, you.reserve[payload.index]?.saved?.level ?? 1);
      const full = you.field.every((mon) => mon);
      const armed = riteHand === payload.index;
      if (canPlay && cap > 0 && slotEl && owner === viewer && index >= 0 && index < FIELD_SLOTS && (armed || full)) {
        setVowAsk({ index: payload.index, slot: index as Slot, picks: [] });
        return;
      }
      turnOneHint();
      if (needsDraw(payload.card.stars)) return;
      if (canPlay && duel.players[viewer].stars < payload.card.stars && payload.card.id !== "trieu-hoi-ac-ma" && duel.players[viewer].draws >= 1) stuckHint(payload.card.stars);
      if (!canPlay || !slotEl || owner !== viewer || slotEl.dataset.empty !== "1" || index < 0 || index >= FIELD_SLOTS) {
        holdNotice("Thả quái vào ô trống của bạn.");
        return;
      }
      apply(summon(duel, payload.index, index as 0 | 1 | 2));
      return;
    }
    if (payload.kind === "spell") {
      if (!spellDragLive(payload.spellId, duel, viewer, payload.index)) {
        holdNotice("Chưa đủ điều kiện để dùng.");
        return;
      }
      if (payload.spellId === "ke-dao-mo") {
        openDig(payload.index);
        return;
      }
      if (payload.spellId === RITE_CARD) {
        startRite(payload.index);
        return;
      }
      if (payload.spellId === TRAP_CARD) {
        apply(castSpell(duel, payload.index, trapPicks(duel, viewer)[0] ?? null));
        return;
      }
      if (payload.spellId === "hoan-doi") {
        setSwapPick([]);
        apply(castSpell(duel, payload.index, aimedUid(duel)));
        return;
      }
      // Như video chủ game (30/10): thả lên đồng minh dùng được là chọn luôn; thả chỗ khác trên sân thì lá thành icon
      // giữa sân chờ chọn mục tiêu; thả về tay thì thôi.
      if (payload.spellId === "phuc-kich") {
        if (hit?.closest(".hand")) return;
        const ally = slotEl && owner === viewer ? you.field.find((mon) => mon?.uid === slotEl.dataset.uid) ?? null : null;
        if (ally && ambushReady(ally)) {
          apply(castSpell(duel, payload.index, ally.uid));
          return;
        }
        playCue("chain");
        setAim({ kind: "spell", index: payload.index, spellId: payload.spellId });
        return;
      }
      // Quả trứng thiên sứ: one monster aimed at = cast at once; several = dropped on one of them, or an icon waiting.
      if (payload.spellId === "qua-trung-thien-su") {
        if (hit?.closest(".hand")) return;
        const picks = eggAllies(duel, viewer);
        const ally = slotEl && owner === viewer ? you.field.find((mon) => mon?.uid === slotEl.dataset.uid) ?? null : null;
        if (picks.length === 1 || (ally && picks.includes(ally.uid))) {
          apply(castSpell(duel, payload.index, picks.length === 1 ? picks[0] : ally!.uid));
          return;
        }
        startEgg(payload.index);
        return;
      }
      if (payload.spellId === DUO_CARD) {
        if (hit?.closest(".hand")) return;
        startDuo(payload.index);
        return;
      }
      if (isWileCard(payload.spellId) || payload.spellId === REVIVE_CARD || payload.spellId === PRISM_CARD) {
        if (hit?.closest(".hand")) return;
        startWileSpell(payload.index);
        return;
      }
      // Hộp ma thuật: dropped on an enemy with one ally struck, it is cast; elsewhere it waits as an icon.
      if (payload.spellId === "hop-ma-thuat") {
        if (hit?.closest(".hand")) return;
        const allies = boxAllies(duel, viewer);
        const mark = slotEl && owner !== viewer ? foe.field.find((mon) => mon?.uid === slotEl.dataset.uid) ?? null : null;
        if (allies.length === 1 && mark && boxFoes(duel, viewer).includes(mark.uid)) {
          apply(castSpell(duel, payload.index, mark.uid, false, allies[0]));
          return;
        }
        startBox(payload.index);
        return;
      }
      // Suối nguồn sinh mệnh: dropped on an ally it is cast; elsewhere it waits as an icon.
      if (isSpring(payload.spellId)) {
        if (hit?.closest(".hand")) return;
        const uid = slotEl?.dataset.uid ?? "";
        if (uid && springAllies(duel, viewer).includes(uid)) {
          apply(castSpell(duel, payload.index, uid));
          return;
        }
        startSpring(payload.index);
        return;
      }
      // Ngăn chặn phòng ngự: dropped on a monster it can take, it is cast; elsewhere on the board it waits as an icon.
      if (payload.spellId === "ngan-chan-phong-ngu") {
        if (hit?.closest(".hand")) return;
        const mark = slotEl && owner !== viewer ? foe.field.find((mon) => mon?.uid === slotEl.dataset.uid) ?? null : null;
        if (mark && shelterPicks(duel).includes(mark.uid)) {
          apply(castSpell(duel, payload.index, mark.uid));
          return;
        }
        playCue("chain");
        setAim({ kind: "spell", index: payload.index, spellId: payload.spellId });
        return;
      }
      const reactEl = hit?.closest("[data-react]") as HTMLElement | null;
      if (reactEl && payload.spellId !== "soi-xich-dia-nguc") {
        const kind = reactEl.dataset.react;
        const pending = duel.pending;
        const uid =
          payload.spellId === "co-may-thoi-gian" || payload.spellId === "giap-co-khi"
            ? aimedUid(duel)
            : kind === "block"
              ? duel.hold?.blocker ?? null
              : (kind === "skill" || kind === "attack") && pending
                ? "caster" in pending
                  ? pending.caster
                  : "attacker" in pending
                    ? pending.attacker
                    : null
                : null;
        apply(castSpell(duel, payload.index, uid));
        return;
      }
      if (!mine || hit?.closest(".hand") || hit?.closest(".face-pile")) return;
      const uid = slotEl?.dataset.uid || "";
      if (payload.spellId === "soi-xich-dia-nguc" || payload.spellId === "huy-diet") {
        const marked = slotEl && owner !== viewer ? foe.field.find((mon) => mon?.uid === uid) ?? null : null;
        if (!marked) {
          holdNotice("Chọn một quái đối thủ.");
          return;
        }
        apply(castSpell(duel, payload.index, marked.uid));
        return;
      }
      if (payload.spellId === "sung-loi-pha") {
        const ally = slotEl && owner === viewer ? you.field.find((mon) => mon?.uid === uid) ?? null : null;
        if (!ally || !hornFit(ally.cardId)) {
          holdNotice("Sừng không gắn dạng người, thiên thần hay thiên sứ.");
          return;
        }
      }
      if (payload.spellId === "phan-nguyen") {
        if (owner === viewer) {
          const ally = you.field.find((mon) => mon?.uid === uid) ?? null;
          if (!ally || !harmShift(ally)) {
            holdNotice("Chọn đồng minh đang mang trạng thái xấu.");
            return;
          }
          setAim({ kind: "spell", index: payload.index, spellId: payload.spellId, from: ally.uid });
          holdNotice("Chọn quái đối thủ để chuyển trạng thái.");
          return;
        }
        const from = aim?.kind === "spell" && aim.spellId === "phan-nguyen" ? aim.from : null;
        if (!from) {
          holdNotice("Chọn đồng minh đang mang trạng thái xấu trước.");
          return;
        }
        apply(castSpell(duel, payload.index, uid, false, from));
        setAim(null);
        return;
      }
      apply(castSpell(duel, payload.index, uid || null));
      return;
    }
    const pending = duel.pending;
    // Lớp ánh sáng / lá đang lao có thể nằm đè lên icon đòn: xét mọi lớp tại điểm thả, không chỉ lớp trên cùng.
    const stack = at ? document.elementsFromPoint(at.x, at.y).filter((node) => !node.closest(".ghost")) : [];
    const reactEl = (hit?.closest("[data-react]") ?? stack.map((node) => node.closest("[data-react]")).find(Boolean) ?? null) as HTMLElement | null;
    const beamEl = hit?.closest("[data-beam]") ?? stack.map((node) => node.closest("[data-beam]")).find(Boolean) ?? null;
    if (payload.kind === "unit" && responding && duel.hold?.priority === viewer) {
      const guard = you.field.find((unit) => unit?.uid === payload.uid);
      const aimed =
        pending?.kind === "melee" || pending?.kind === "gnaw"
          ? pending.defender
          : pending?.kind === "beam" || pending?.kind === "gnaw-skill" || pending?.kind === "spell"
            ? pending.target
            : null;
      const kazura = aimed ? you.field.some((unit) => unit?.uid === aimed && unit.cardId === "kazura") : false;
      const ontoHer = Boolean(foeUid && you.field.some((unit) => unit?.uid === foeUid && unit.cardId === "kazura"));
      const ontoShot = Boolean(reactEl) || Boolean(beamEl) || (pending && "attacker" in pending && foeUid === pending.attacker);
      if (guard?.cardId === "kizuran" && kazura && (ontoHer || ontoShot)) {
        apply(setCover(duel, guard.uid, true));
        return;
      }
      // Chặn từng nhánh (chủ game 29/10): a front-row monster dropped onto the way of one branch of a spread stands in
      // front of it.
      const lanes = branchLanes.current;
      if (guard && guard.row !== "back" && lanes.length && !reactEl && at) {
        const rect = document.querySelector(".board")?.getBoundingClientRect();
        if (rect) {
          const x = ((at.x - rect.left) / rect.width) * 100;
          const y = ((at.y - rect.top) / rect.height) * 100;
          let best: { hit: string; gap: number } | null = null;
          for (const lane of lanes) {
            for (const pt of lane.pts) {
              const gap = Math.hypot((pt.x - x) * 0.9, (pt.y - y) * 1.6 * boardCut().v);
              if (!best || gap < best.gap) best = { hit: lane.hit, gap };
            }
          }
          if (best && best.gap <= LANE_REACH) apply(assignCover(duel, guard.uid, best.hit));
          else holdNotice("Kéo quái lên đường flow để chặn.");
          return;
        }
      }
    }
    const frontHit = Boolean(
      responding &&
        duel.hold?.priority === viewer &&
        !coverBack &&
        (pending?.kind === "melee" || pending?.kind === "beam" || pending?.kind === "gnaw-skill") &&
        you.field.some((unit) => unit?.uid === (pending.kind === "melee" ? pending.defender : pending.target)),
    );
    if (reactEl && payload.kind === "unit" && duel.hold?.priority === viewer) {
      if (pending?.kind === "face" || coverBack) offerBlock(payload.uid);
      else if (frontHit) holdNotice("Hàng trước tự chịu, không ai chặn hộ.");
      return;
    }
    if (frontHit && payload.kind === "unit") {
      holdNotice("Hàng trước tự chịu, không ai chặn hộ.");
      return;
    }
    const intercept = responding && duel.hold?.priority === viewer && (pending?.kind === "face" || coverBack);
    if (intercept && pending) {
      const attackerUid = "attacker" in pending ? pending.attacker : "caster" in pending ? pending.caster : "";
      let onFlow = false;
      const board = document.querySelector(".board")?.getBoundingClientRect();
      if (board && at) {
        const rows = 16 / 9 / boardCut().v;
        const x = ((at.x - board.left) / board.width) * 100;
        const y = ((at.y - board.top) / board.height) * 100;
        onFlow = strikeFlows.current.some(([a, b]) => {
          const dx = b.x - a.x;
          const dy = (b.y - a.y) * rows;
          const len2 = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * rows * dy) / len2));
          return Math.hypot(x - (a.x + t * dx), (y - (a.y + (t * dy) / rows)) * rows) <= LANE_REACH;
        });
      }
      const onShot = coverBack || onFlow || Boolean(beamEl) || Boolean(reactEl) || (foeUid !== "" && foeUid === attackerUid);
      if (onShot) {
        offerBlock(payload.uid);
        return;
      }
      holdNotice("Kéo hàng trước lên đòn để chặn.");
      return;
    }
    if (!canPlay) return;
    if (aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian") {
      if (foeUid && foeUid !== aim.uid) {
        pickChrono(foeUid);
        return;
      }
      holdNotice("Chọn một quái");
      return;
    }
    const aimingSkill = aim?.kind === "skill";
    if (aimingSkill && twoStep(you.field.find((unit) => unit?.uid === aim.uid)?.cardId ?? "", aim.index)) {
      {
        if (!aim.also) {
          if (!foeUid || owner === viewer) {
            holdNotice("Chọn một quái đối thủ");
            return;
          }
          setAim({ kind: "skill", uid: aim.uid, index: aim.index, also: foeUid });
          holdNotice("Chọn quái của ta");
          return;
        }
        if (owner !== viewer || !foeUid || foeUid === aim.uid) {
          holdNotice("Chọn quái của ta");
          return;
        }
        apply(useSkill(duel, aim.uid, foeUid, aim.index, true, aim.also));
        return;
      }
    }
    if (aimingSkill && selectedCard && allySkill(selectedCard.id)) {
      const selfOk = selectedCard.id === "thien-than-be-nho";
      if (slotEl && owner === viewer && foeUid && (selfOk || foeUid !== aim.uid)) {
        apply(useSkill(duel, aim.uid, foeUid, aim.index, true));
        return;
      }
      holdNotice(selfOk ? "Chọn một đồng minh" : "Chọn một quái đồng minh khác");
      return;
    }
    if (hit?.closest("[data-face]") || (slotEl && owner !== viewer && foeUid)) {
      if (aimingSkill) {
        const caster = you.field.find((unit) => unit?.uid === aim.uid);
        const card = caster ? monsterCard(caster.cardId) : undefined;
        const face = Boolean(hit?.closest("[data-face]"));
        if (face && card && !faceSkill(card.id, aim.index)) {
          holdNotice("Chọn một quái đối thủ");
          return;
        }
        const foeHit = face ? null : foeUid || null;
        apply(
          card && shotSkill(card.id)
            ? declareSkill(duel, aim.uid, foeHit, aim.index)
            : useSkill(duel, aim.uid, foeHit, aim.index, true),
        );
        return;
      }
      const face = Boolean(hit?.closest("[data-face]"));
      const attacker = you.field.find((unit) => unit?.uid === payload.uid);
      if (!face && attacker?.hornNew && foeUid) {
        setHornAsk({ uid: payload.uid, foeUid, mode: null });
        return;
      }
      if (!face && attacker?.cardId === "ky-si-bong-toi" && foeUid) {
        const foeMon = foe.field.find((unit) => unit?.uid === foeUid);
        const stars = foeMon ? (monsterCard(foeMon.cardId)?.stars ?? 0) : 0;
        const room = foeMon && (foeMon.atk > attacker.atk || stars >= 4) ? 2 : 1;
        setKnightAsk({ uid: payload.uid, foeUid, face: false, room });
        return;
      }
      const dragged = payload.uid;
      withLock(dragged, (base) => {
        const from = base ?? duel;
        apply(face ? attackFace(from, dragged) : attackMonster(from, dragged, foeUid));
      });
      return;
    }
    holdNotice("Kéo lên quái địch, hoặc lên vùng máu địch để đánh người.");
  }

  function end(event: ReactPointerEvent) {
    const payload = grab.current;
    grab.current = null;
    const moved = origin.current.moved;
    const panned = origin.current.pan;
    origin.current.moved = false;
    origin.current.pan = false;
    window.clearTimeout(riteHold.current);
    setDrag(null);
    setSnap(null);
    const snapped = payload && moved && !panned ? snapAt(payload, event.clientX, event.clientY) : null;
    snapPool.current = null;
    if (panned) {
      suppressClick.current = true;
      return;
    }
    if (!payload) return;
    if (!moved && payload.kind === "unit" && Date.now() - origin.current.t > 420) {
      const unit = you.field.find((mon) => mon?.uid === payload.uid);
      const reactive = Boolean(unit && duel && (gnawReady(duel, unit, viewer) || monsterAlert(duel, unit, viewer) || mysticAlert(duel, unit, viewer)));
      if (!reactive) {
        suppressClick.current = true;
        setAim(null);
        setLook(unit ? { ...fieldLook(unit, you.stars), uid: unit.uid } : { name: payload.card.name, text: payload.card.skill });
      }
      return;
    }
    if (!moved) return;
    suppressClick.current = true;
    // Kéo quái lên mục tiêu (chủ game 10/11): the list of what it can do there shows, near the monster dragged.
    if (payload.kind === "unit" && !aim && duel && canPlay && !responding && duel.step === "main" && !queue) {
      if (snapped && dropRows({ uid: payload.uid, key: snapped })) {
        setDropMenu({ uid: payload.uid, key: snapped });
        setSnap(snapped);
        return;
      }
      // Nothing it can do where it was dropped (an attack with 0 attack, a skill that takes no such target): nothing happens.
      if (!hitsHand(event.clientX, event.clientY)) holdNotice("Quái này không làm được gì ở đó.");
      return;
    }
    finishDrop((snapped ? snapNode(snapped) : null) ?? under(event.clientX, event.clientY), payload, { x: event.clientX, y: event.clientY });
  }

  function onSlot(side: Side, index: number) {
    if (!duel || !mine || duel.step !== "main" || side !== viewer) return;
    if (aim?.kind !== "summon") return;
    const held = you.reserve[aim.index];
    if (!held) {
      setAim(null);
      return;
    }
    const cap = vowCap(held.id, held.saved?.level ?? 1);
    if (cap > 0 && (riteHand === aim.index || you.field.every((mon) => mon))) {
      setAim(null);
      setVowAsk({ index: aim.index, slot: index as Slot, picks: [] });
      return;
    }
    setAim(null);
    apply(summon(duel, aim.index, index as 0 | 1 | 2));
  }

  slideFire.current = (key: string) => {
    if (!duel) return;
    if (key === "face") {
      if (shelling()) shellTap("face", otherSide);
      else if (aim?.kind === "attack") apply(attackFace(duel, aim.uid));
      else if (aim?.kind === "skill") apply(declareSkill(duel, aim.uid, null, aim.index));
      return;
    }
    const [side, slot] = key.split("-").map(Number);
    const mon = duel.players[side as Side]?.field[slot];
    if (mon) onUnit(side as Side, mon);
  };

  /** The buttons of a monster on the field, with the given hands for what they do (real ones, or a dry run). */
  function rowArgs(uid: string, put: (next: Duel) => void, aimTo: (next: Aim | null) => void, lure: (uid: string) => void, dry = false): UnitRowsArgs {
    return {
      duel: duel!,
      uid,
      viewer,
      attackable: canPlay,
      blessOn: blessArm,
      onBless: () => undefined,
      onChronoFlow: (id) => {
        if (!duel || !canTargetFoe(duel)) {
          if (!dry) holdNotice("Lượt đầu không được nhắm đối thủ.");
          return;
        }
        aimTo(null);
        put(useSkill(duel, id, null, 2));
      },
      onLure: lure,
      setAim: aimTo,
      apply: put,
    };
  }

  /**
   * A button with no target of its own (Cò quay, a skill on the whole enemy side...): does it act on the enemy? Found by
   * a dry run of the button: the enemy side changes, or a window opens for the enemy to answer.
   */
  function hitsFoe(uid: string, key: string): boolean {
    if (!duel) return false;
    let out: Duel | null = null;
    let lured = false;
    const dry = unitRows(rowArgs(uid, (next) => (out = next), () => undefined, () => (lured = true), true));
    const row = dry?.rows.find((one) => one.key === key);
    if (!row) return false;
    try {
      row.go();
    } catch {
      return false;
    }
    if (lured) return true;
    const next = out as Duel | null;
    if (!next || next === duel) return false;
    const side = (1 - viewer) as Side;
    const shape = (game: Duel) => JSON.stringify({ hp: game.players[side].hp, field: game.players[side].field.map((mon) => (mon ? [mon.uid, mon.hp, mon.atk, mon.def, mon.mdef, mon.stun, mon.chain ?? 0] : null)) });
    if (shape(next) !== shape(duel)) return true;
    return next.step === "respond" && Boolean(next.pending) && !duel.pending;
  }

  /**
   * Kéo quái lên mục tiêu (chủ game 10/11): what each button of the monster can be dropped on. Tấn công and the skills
   * that pick a target take the targets their own rule takes; a button with no target that acts on the enemy (random or
   * whole-side) takes any enemy and the enemy player; the rest (self buffs) stay on the tap list only.
   */
  function dropPlan(uid: string): { keys: Set<string>; options: Array<{ row: UnitRow; keys: Set<string>; open: boolean }>; box: { x: number; y: number; w: number; h: number } } | null {
    if (!duel || !canPlay || responding || duel.step !== "main" || queue) return null;
    const built = unitRows(rowArgs(uid, apply, setAim, (id) => setLureAsk(id)));
    if (!built) return null;
    const self = `${viewer}-${you.field.findIndex((mon) => mon?.uid === uid)}`;
    const foeSide = (1 - viewer) as Side;
    const anyFoe = new Set<string>(["face"]);
    duel.players[foeSide].field.forEach((mon, slot) => {
      if (mon) anyFoe.add(`${foeSide}-${slot}`);
    });
    const options: Array<{ row: UnitRow; keys: Set<string>; open: boolean }> = [];
    const keys = new Set<string>();
    for (const row of built.rows) {
      let picks: Set<string> | null = null;
      let open = false;
      if (row.slide) picks = row.slide.kind === "attack" ? attackKeys(uid) : slideKeys(row.slide);
      else if (hitsFoe(uid, row.key)) {
        picks = anyFoe;
        open = true;
      }
      if (!picks) continue;
      const mine = new Set([...picks].filter((key) => key !== self));
      if (mine.size === 0) continue;
      options.push({ row, keys: mine, open });
      for (const key of mine) keys.add(key);
    }
    return { keys, options, box: built.box };
  }

  /**
   * K5 (chủ game 14/11): bấm một nút của quái trên sân thì bảng xác nhận ghi nút đó làm gì; OK mới chạy (chọn mục tiêu),
   * Huỷ về lại danh sách. Đánh thường chỉ hỏi với quái có điều kiện riêng (Khổng lồ 1 mắt tốn mana). Tắt trong Cài đặt thì
   * chạy thẳng; nút không có gì để ghi cũng chạy thẳng.
   */
  function withLock(uid: string, go: (base?: Duel) => void) {
    const mon = duel ? fieldMon(duel, uid) : null;
    if (!duel || !mon || tutorial || lockChoices(duel, uid).length === 0) {
      go();
      return;
    }
    const card = monsterCard(mon.cardId);
    playUi("select");
    setUseAsk({
      head: { name: "Khoá 1", tone: "#3cff4a", art: "/ui/kw/luon-lach-1.webp", who: card ? tr(card.name) : "" },
      lines: ["Chọn 1 quái địch để khoá hành động"],
      go: () => {
        holdNotice("Khoá 1: chọn 1 quái địch để khoá hành động.");
        setLockPick({ uid, go });
      },
    });
  }
  /** Khoá 1: the locked monster is set on the match; the strike that follows carries it into the queue. */
  function pickLock(foeUid: string) {
    const pick = lockPick;
    if (!pick || !duel) return;
    setLockPick(null);
    holdNotice("");
    playUi("confirm");
    const armed: Duel = { ...duel, lockAim: { by: pick.uid, uid: foeUid } };
    setDuel(armed);
    pick.go(armed);
  }

  function askRow(uid: string, plain: UnitRow) {
    const row: UnitRow = { ...plain, go: () => withLock(uid, plain.go) };
    const mon = duel ? fieldMon(duel, uid) : null;
    if (!duel || !mon || !confirmUse || tutorial) {
      row.go();
      return;
    }
    const card = monsterCard(mon.cardId);
    const art = artSrc(formOf(mon), mon.level ?? 1);
    if (row.key === "attack") {
      const terms = attackTerms(mon);
      if (!terms) {
        row.go();
        return;
      }
      playUi("select");
      setUseAsk({ head: { name: row.label, tone: "#ff7a5c", icon: row.icon, kind: "attack", art, who: card ? tr(card.name) : "" }, lines: [terms], go: row.go });
      return;
    }
    const hit = bookSkill(mon.cardId, row.label, card?.skill ?? "");
    const name = hit?.name ?? row.label;
    const lines = skillBrief({ duel, cardId: formOf(mon), name, mon, target: null, ask: true }).split("\n").slice(1).filter(Boolean);
    if (lines.length === 0 && !hit?.text) {
      row.go();
      return;
    }
    // Chủ game 17/11: thêm dòng "Tiêu hao x mana" (số lấy từ chữ skill, như icon trên bảng quái); không có phí thì không ghi.
    const cost = skillCost(hit?.text ?? "");
    if (cost && !lines.some((line) => /tiêu hao/i.test(line))) lines.unshift(`${tr("Tiêu hao")} ${cost} mana`);
    const kind = hit?.slow ? "slow" : hit?.buff ? "buff" : row.kind;
    playUi("select");
    setUseAsk({ head: { name, tone: SKILL_GLOW[kind] ?? SKILL_GLOW.active, icon: row.icon, kind, art, who: card ? tr(card.name) : "" }, lines, text: lines.length ? undefined : hit?.text, go: row.go });
  }
  /** K5: the same for a spell used by its button on the card in hand. */
  function askSpell(id: string, go: () => void, toll = false) {
    const card = spellCard(id);
    if (!duel || !card || !confirmUse || tutorial) {
      go();
      return;
    }
    const lines = spellBrief(duel, id, viewer).split("\n").slice(1).filter(Boolean);
    // Chủ game 17/11: khung OK/Huỷ ghi thêm "Tiêu hao x mana" (phép có phí +1 thì cộng vào); 0 mana thì không ghi.
    const cost = card.gems + (toll ? 1 : 0);
    if (cost > 0) lines.unshift(`${tr("Tiêu hao")} ${cost} mana`);
    playUi("select");
    setUseAsk({ head: { name: card.name, tone: speedTone(id), art: spellSrc(id), who: tr("Phép") }, lines, text: lines.length ? undefined : card.effect, go });
  }

  /** The drop list: only the buttons that take this target, each firing at it. */
  function dropRows(ask: { uid: string; key: string }): { rows: UnitRow[]; box: { x: number; y: number; w: number; h: number } } | null {
    const plan = dropPlan(ask.uid);
    if (!plan) return null;
    const rows = plan.options
      .filter((option) => option.keys.has(ask.key))
      .map(({ row, open }) => ({
        ...row,
        slide: undefined,
        go: () => {
          setDropMenu(null);
          setSnap(null);
          if (open || !row.slide) {
            row.go();
            return;
          }
          fireAfter.current = ask.key;
          setAim(row.slide.kind === "attack" ? { kind: "attack", uid: row.slide.uid } : { kind: "skill", uid: row.slide.uid, index: row.slide.index });
        },
      }));
    return rows.length ? { rows, box: plan.box } : null;
  }

  /** Pháo kích của Rùa máy bắn đá đang chọn mục tiêu hoặc đạn. */
  function shelling(): boolean {
    return Boolean(duel && aim?.kind === "skill" && fieldMon(duel, aim.uid)?.cardId === CATAPULT);
  }

  /**
   * Pháo kích (chủ game 23/11): bấm trước mục tiêu (quái địch, người chơi hoặc lá tường thành của đối thủ), rồi 1 quái
   * thú khác của mình làm đạn. `key`: uid quái, "face" hoặc "wall".
   */
  function shellTap(key: string, side: Side | null) {
    if (!duel || aim?.kind !== "skill") return;
    if (!aim.also) {
      if (side === otherSide) {
        setAim({ ...aim, also: key });
        holdNotice("Chọn 1 quái thú của bạn làm đạn pháo");
        return;
      }
      holdNotice("Chọn quái, người chơi hoặc lá tường thành của đối thủ");
      return;
    }
    if (side !== viewer || key === aim.uid) {
      holdNotice("Chọn 1 quái thú khác của bạn làm đạn pháo");
      return;
    }
    const also = aim.also;
    const target = also === "face" || also === "wall" ? null : also;
    apply(useSkill(duel, aim.uid, target, aim.index, true, also === "wall" ? `${key}|wall` : key));
  }

  function onUnit(side: Side, mon: FieldMon) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!mine || !duel) return;
    if (lockPick) {
      if (side !== viewer && lockChoices(duel, lockPick.uid).includes(mon.uid)) pickLock(mon.uid);
      return;
    }
    if (side === viewer) turnOneHint();
    // Hoán đổi: tap a glowing ally to trade places with the monster aimed at.
    if (swapAsk) {
      if (side === viewer && swapFit(mon)) apply(confirmSwap(duel, swapAsk.locked!, `f:${mon.uid}`));
      return;
    }
    if (shelling()) {
      if (side === viewer && aim?.kind === "skill" && mon.uid === aim.uid && !aim.also) {
        setAim(null);
        return;
      }
      shellTap(mon.uid, side);
      return;
    }
    if (aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian") {
      if (mon.uid === aim.uid) {
        setAim(null);
        return;
      }
      pickChrono(mon.uid);
      return;
    }
    if (aim?.kind === "spell" && aim.spellId === "sung-loi-pha") {
      if (side === viewer && hornFit(mon.cardId)) {
        apply(castSpell(duel, aim.index, mon.uid));
        setAim(null);
      }
      return;
    }
    if (aim?.kind === "spell" && aim.spellId === "phan-nguyen") {
      if (!aim.from) {
        if (side === viewer && harmShift(mon)) {
          setAim({ ...aim, from: mon.uid });
          holdNotice("Chọn quái đối thủ để chuyển trạng thái.");
        }
        return;
      }
      if (side !== viewer) {
        apply(castSpell(duel, aim.index, mon.uid, false, aim.from));
        setAim(null);
      }
      return;
    }
    if (aim?.kind === "spell" && (aim.spellId === WILE_CARDS.gust || aim.spellId === WILE_CARDS.charm)) {
      wileTap(mon, side);
      return;
    }
    if (aim?.kind === "spell" && aim.spellId === DUO_CARD) {
      if (aim.duo?.ask) return;
      if (side !== viewer) {
        if (duoTargets(duel, viewer).includes(mon.uid)) {
          setAim({ ...aim, from: mon.uid, duo: { picks: [] } });
          holdNotice("Chọn quái đồng minh thứ 1.");
        }
        return;
      }
      if (!aim.from) {
        holdNotice("Chọn 1 quái địch trước.");
        return;
      }
      if (duoAllies(duel, viewer).includes(mon.uid) && !aim.duo?.picks.some((pick) => pick.uid === mon.uid)) {
        setAim({ ...aim, duo: { picks: aim.duo?.picks ?? [], ask: mon.uid } });
        holdNotice("Chọn đòn của quái này.");
      }
      return;
    }
    if (aim?.kind === "spell" && aim.spellId === "hop-ma-thuat") {
      if (!aim.from) {
        if (side === viewer && boxAllies(duel, viewer).includes(mon.uid)) {
          setAim({ ...aim, from: mon.uid });
          holdNotice("Chọn quái đối thủ để đổi chỗ.");
        }
        return;
      }
      if (side !== viewer && boxFoes(duel, viewer).includes(mon.uid)) {
        apply(castSpell(duel, aim.index, mon.uid, false, aim.from));
        setAim(null);
      }
      return;
    }
    if (aim?.kind === "spell" && aim.spellId === "ngan-chan-phong-ngu") {
      if (side !== viewer && shelterPicks(duel).includes(mon.uid)) {
        apply(castSpell(duel, aim.index, mon.uid));
        setAim(null);
      }
      return;
    }
    if (aim?.kind === "spell" && isSpring(aim.spellId)) {
      if (springAllies(duel, viewer).includes(mon.uid)) {
        apply(castSpell(duel, aim.index, mon.uid));
        setAim(null);
      }
      return;
    }
    if (aim?.kind === "spell" && aim.spellId === "qua-trung-thien-su") {
      if (side === viewer && eggAllies(duel, viewer).includes(mon.uid)) {
        apply(castSpell(duel, aim.index, mon.uid));
        setAim(null);
      }
      return;
    }
    if (aim?.kind === "spell" && aim.spellId === "phuc-kich") {
      if (side === viewer && ambushReady(mon)) {
        apply(castSpell(duel, aim.index, mon.uid));
        setAim(null);
      }
      return;
    }
    if (aim?.kind === "spell" && side !== viewer) {
      apply(castSpell(duel, aim.index, mon.uid));
      setAim(null);
      return;
    }
    if (aim?.kind === "attack" && side !== viewer) {
      const attacker = you.field.find((unit) => unit?.uid === aim.uid);
      if (attacker?.hornNew) {
        setHornAsk({ uid: aim.uid, foeUid: mon.uid, mode: null });
        setAim(null);
        return;
      }
      if (attacker?.cardId === "ky-si-bong-toi" && !attacker.clash) {
        const stars = monsterCard(mon.cardId)?.stars ?? 0;
        const room = mon.atk > attacker.atk || stars >= 4 ? 2 : 1;
        setKnightAsk({ uid: attacker.uid, foeUid: mon.uid, face: false, room });
        setAim(null);
        return;
      }
      apply(attackMonster(duel, aim.uid, mon.uid));
      return;
    }
    if (aim?.kind === "skill" && twoStep(you.field.find((unit) => unit?.uid === aim.uid)?.cardId ?? "", aim.index)) {
      {
        if (!aim.also) {
          if (side === viewer) {
            holdNotice("Chọn một quái đối thủ");
            return;
          }
          setAim({ kind: "skill", uid: aim.uid, index: aim.index, also: mon.uid });
          holdNotice("Chọn quái của ta");
          return;
        }
        if (side !== viewer || mon.uid === aim.uid) {
          holdNotice("Chọn quái của ta");
          return;
        }
        apply(useSkill(duel, aim.uid, mon.uid, aim.index, true, aim.also));
        return;
      }
    }
    if (aim?.kind === "skill" && selectedCard && allySkill(selectedCard.id)) {
      const selfOk = selectedCard.id === "thien-than-be-nho";
      if (side === viewer && (selfOk || mon.uid !== aim.uid)) {
        apply(useSkill(duel, aim.uid, mon.uid, aim.index, true));
        return;
      }
      if (side === viewer) {
        setAim(null);
        return;
      }
      holdNotice(selfOk ? "Chọn một đồng minh" : "Chọn một quái đồng minh khác");
      return;
    }
    if (aim?.kind === "skill" && side !== viewer) {
      const caster = you.field.find((unit) => unit?.uid === aim.uid);
      const card = caster ? monsterCard(caster.cardId) : undefined;
      apply(
        card && shotSkill(card.id)
          ? declareSkill(duel, aim.uid, mon.uid, aim.index)
          : useSkill(duel, aim.uid, mon.uid, aim.index, true),
      );
      return;
    }
    const lastTap = fieldTap.current;
    fieldTap.current = { uid: mon.uid, at: Date.now() };
    if (lastTap && lastTap.uid === mon.uid && Date.now() - lastTap.at < DOUBLE_TAP && (!aim || aim.kind === "menu")) {
      fieldTap.current = null;
      const holder = side === viewer ? you : foe;
      setAim(null);
      const hidden = side !== viewer && ((holder.sea && !mon.cage && !mon.shown && (mon.cardId === "trai-tim-hai-long" || mon.cardId === "sua-hut-ma-phap" || mon.cardId === "kraken")) || lurking(mon));
      setLook(hidden ? { name: "quái thú ẩn mình", text: "Không thấy kỹ năng hay chỉ số." } : { ...fieldLook(mon, holder.stars), uid: mon.uid });
      return;
    }
    const ready = side === viewer && gnawReady(duel, mon, side);
    const coverReady =
      side === viewer &&
      !mon.dim &&
      mon.cardId === "kizuran" &&
      mon.stun === 0 &&
      (mon.chain ?? 0) === 0 &&
      (canPlay || (responding && duel.hold?.priority === viewer));
    const hatchReady =
      side === viewer &&
      canPlay &&
      mon.cardId === "ken-ngai" &&
      mon.stun === 0 &&
      (mon.chain ?? 0) === 0 &&
      (mon.level ?? 0) >= 4 &&
      (mon.level ?? 0) <= 5;
    const reelReady =
      side === viewer &&
      canPlay &&
      mon.cardId === "may-quay-thuong" &&
      !mon.spun &&
      mon.stun === 0 &&
      (mon.chain ?? 0) === 0 &&
      (mon.path ?? 0) === 0;
    const sealed = mon.stun > 0 || (mon.chain ?? 0) > 0;
    if (side === viewer && canPlay && aim?.kind === "menu" && aim.uid === mon.uid) {
      setAim(null);
      return;
    }
    const fairyUp = side === viewer && monsterAlert(duel, mon, side) && mon.cardId === "yeu-tinh-chuc-phuc";
    const wallUp = side === viewer && canWall(duel, mon.uid);
    const spiritUp = side === viewer && canSpirit(duel, mon.uid);
    const mysticUp = side === viewer && mysticAlert(duel, mon, side);
    const harpyUp = side === viewer && harpyAlert(duel, mon, viewer);
    const reactive = ready || coverReady || fairyUp || wallUp || spiritUp || mysticUp;
    if (side === viewer && sealed && !harpyUp) return;
    if (side === viewer && (hatchReady || reelReady || harpyUp || (!tired(mon) && (canPlay || reactive)))) {
      setAim({ kind: "menu", uid: mon.uid });
      setLook(null);
      return;
    }
    const owner = side === viewer ? you : foe;
    const veiled = side !== viewer && ((owner.sea && !mon.cage && !mon.shown && (mon.cardId === "trai-tim-hai-long" || mon.cardId === "sua-hut-ma-phap" || mon.cardId === "kraken")) || lurking(mon));
    if (veiled) {
      setLook({ name: "quái thú ẩn mình", text: "Không thấy kỹ năng hay chỉ số." });
      return;
    }
    setLook({ ...fieldLook(mon, owner.stars), uid: mon.uid });
  }

  const foeSide = (viewer === 0 ? 1 : 0) as Side;
  const canDrawNow = Boolean(mine && duel.step === "main" && duel.turn === viewer && !gemHold && !duel.counterAsk && !you.drawLock && you.draws < 1 && pileLeft(you) > 0);
  drawNow.current = () => {
    if (queueBlocked()) return;
    if (canDrawNow) apply(draw(duel));
  };
  const marksView = [
    ["foeHp", laserHp[`face:${foeSide}`] ?? hpHold[`face:${foeSide}`] ?? heldHp(foeSide) ?? foe.hp, ""],
    ["foeOrb", (tutView?.foeOrb ?? foe.orb) + (drainHold?.orb && drainHold.side !== viewer ? 1 : 0), ""],
    ["foeFlask", Math.min(1, foe.flask), "bình"],
    ["foeStars", foe.stars, "sao"],
    ["foeGems", foe.starGems + (drainHold?.gems && drainHold.side !== viewer ? 1 : 0), "thừa"],
    // Xấp bài úp bên đỏ (tấm in 3 lá) ghi số lá còn trong xấp của đối thủ; số lá trên tay họ ở chính giữa khay để bài
    // (băng rôn đỏ trên cùng), trên dải lá úp xoè (chủ game 28/10).
    ["foeHand", pileLeft(foe), "bài"],
    ["foeReserve", foe.reserve.length + foe.hand.length, "lá"],
    ["youHp", laserHp[`face:${viewer}`] ?? hpHold[`face:${viewer}`] ?? heldHp(viewer) ?? you.hp, ""],
    ["youOrb", (tutView?.youOrb ?? you.orb) + (drainHold?.orb && drainHold.side === viewer ? 1 : 0), ""],
    ["youFlask", Math.min(1, you.flask), "bình"],
    ["youStars", tutView?.youStars ?? you.stars, "sao"],
    ["youGems", (tutView?.youGems ?? you.starGems) + (drainHold?.gems && drainHold.side === viewer ? 1 : 0), "thừa"],
  ] as const;

  const reserveHeld = inspect?.pile === "reserve" ? you.reserve[inspect.index] : undefined;
  const reserveToll = Boolean(reserveHeld?.toll);
  const spellToll = inspect?.pile === "spell" ? Boolean(you.tolls?.[inspect.index]) : false;
  const shownMonster = reserveHeld ? monsterCard(reserveHeld.id) : undefined;
  const shownSpell = inspect?.pile === "spell" ? spellCard(you.hand[inspect.index] ?? "") : inspect?.pile === "env" ? spellCard(inspect.id) : undefined;
  // Trả đòn (luật mới): quái của mình vừa chịu đòn mà còn sống phải trả đòn trước khi làm gì khác.
  const counterSeat = mine && duel.counterAsk ? you.field.findIndex((mon) => mon?.uid === duel.counterAsk?.uid) : -1;
  const graspAsk = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input")) return;
    const card = target.closest(".ask-card");
    if (!card || !target.closest(".ask-card p")) return;
    const board = event.currentTarget.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    askDrag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: ((box.left - board.left) / board.width) * 100,
      top: ((box.top - board.top) / board.height) * 100,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragAsk = (event: ReactPointerEvent<HTMLElement>) => {
    const held = askDrag.current;
    if (!held || held.pointer !== event.pointerId) return;
    const board = event.currentTarget.getBoundingClientRect();
    const x = Math.min(60, Math.max(0, held.left + ((event.clientX - held.x) / board.width) * 100));
    const y = Math.min(80, Math.max(0, held.top + ((event.clientY - held.y) / board.height) * 100));
    setAskAt({ x, y });
  };
  const dropAsk = (event: ReactPointerEvent<HTMLElement>) => {
    if (askDrag.current?.pointer === event.pointerId) askDrag.current = null;
  };

  function placeFuse(slot: 0 | 1 | 2 | 3 | 4 | 5) {
    if (!duel || !fuseAsk || fuseAsk.phase !== "preview") return;
    const next = fuse(duel, fuseAsk.reserveIndex, fuseAsk.fieldUid, slot);
    if (next.players[viewer].field[slot]?.cardId !== fuseAsk.resultId) {
      holdNotice(next.live || "Không đặt được vào ô này.");
      return;
    }
    setFuseAsk(null);
    setFuseDrag(null);
    apply(next);
  }

  function dropFuse(x: number, y: number) {
    const node = document.elementsFromPoint(x, y).find((item) => item.closest("[data-slot]"));
    const slotEl = node?.closest("[data-slot]") as HTMLElement | null;
    const owner = slotEl ? Number(slotEl.dataset.owner) : NaN;
    const index = slotEl ? Number(slotEl.dataset.index) : NaN;
    if (!slotEl || owner !== viewer || index < 0 || index >= FIELD_SLOTS) {
      holdNotice("Kéo lá vào ô của bạn.");
      return;
    }
    placeFuse(index as 0 | 1 | 2 | 3 | 4 | 5);
  }

  /** For three knights, the third one on the field and where it stands, so all three fly into the fusion scene. */
  function trioOf(handId: string, host: FieldMon): Pick<FuseShow, "third" | "c"> {
    const third = thirdKnight(handId, host, you.field);
    if (!third) return {};
    const slot = you.field.findIndex((mon) => mon?.uid === third.uid);
    return { third: third.uid, c: boardSpot(document.querySelector(`[data-slot="${viewer}-${slot}"]`), { x: 50, y: 62, w: 18 }) };
  }

  const fuseHands = new Set<number>();
  const fuseUids = new Set<string>();
  if (fuseOn) {
    const ids = you.field.filter((unit): unit is NonNullable<typeof unit> => Boolean(unit)).map((unit) => unit.cardId);
    you.reserve.forEach((held, index) => {
      you.field.forEach((mon) => {
        if (mon && (findFusion(held.id, mon.cardId) || findKnightFusion(held.id, mon.cardId, ids))) {
          fuseHands.add(index);
          fuseUids.add(mon.uid);
        }
      });
      for (const way of setFusionsFor(duel, viewer, index)) {
        fuseHands.add(index);
        for (const mat of way.mats) {
          if (mat.from === "hand") fuseHands.add(mat.index);
          else fuseUids.add(mat.uid);
        }
      }
    });
  }
  const fuseResult = fuseAsk ? monsterCard(fuseAsk.resultId) : undefined;
  const fuseHandName = fuseAsk ? fieldName({ cardId: fuseAsk.handId, level: fuseAsk.handLevel }) : "";
  const fuseFieldName = fuseAsk ? fieldName({ cardId: fuseAsk.fieldId, level: fuseAsk.fieldLevel }) : "";

  const ownLive = you.field.filter((mon): mon is FieldMon => Boolean(mon && mon.hp > 0));
  // Mũi tên chọn hàng (chủ game 28/10): ↑ hàng trước, ↓ hàng sau; quái vào ô đầu tiên từ trái sang của hàng đó mà luật
  // nhận (ô trống, ô của quái bị hiến tế, ô của quái đem dung hợp). A play happened when it took the card from the hand.
  const took = (next: Duel) => next.players[viewer].reserve.length < you.reserve.length;
  const rowSlot = (row: SummonRow, play: (slot: Slot) => Duel): Slot | null => ROW_SLOTS[row].find((slot) => took(play(slot))) ?? null;
  const summonAt = (index: number) => (slot: Slot) => (you.field[slot] ? duel : summon(duel, index, slot));
  const hideAt = (index: number) => (slot: Slot) => (you.field[slot] ? duel : summonHidden(duel, index, slot));
  const vowAt = (index: number, picks: string[]) => (slot: Slot) => {
    const mon = you.field[slot];
    return mon && !picks.includes(mon.uid) ? duel : summonVow(duel, index, slot, picks);
  };
  const fuseAt = (show: FuseShow) => (slot: Slot) => (show.set ? fuseSet(duel, show.index, show.resultId, slot) : fuse(duel, show.index, show.uid, slot));
  const cost = (next: Duel) => Math.max(0, you.orb - next.players[viewer].orb);
  function startFuse(index: number, opt: FuseOpt) {
    const held = you.reserve[index];
    const mon = you.field.find((unit) => unit?.uid === opt.uid);
    if (!held || (!mon && !opt.set)) return;
    const slotSpot = boardSpot(document.querySelector(`[data-slot="${viewer}-${opt.slot}"]`), { x: 50, y: 62, w: 18 });
    if (opt.set) {
      // Nguyên liệu khác lá đang kéo: lá trên tay bay lên từ tay, quái trên sân từ ô của nó.
      const mats: FuseMatShow[] = opt.set.mats.slice(1).flatMap((mat): FuseMatShow[] => {
        if (mat.from === "hand") {
          const card = you.reserve[mat.index];
          return card ? [{ index: mat.index, src: artSrc(card.id, card.saved?.level ?? 1), spot: boardSpot(document.querySelector(`[data-hand="r:${mat.index}"]`), { x: 50, y: 92, w: 18 }) }] : [];
        }
        const unit = you.field.find((at) => at?.uid === mat.uid);
        const at = you.field.findIndex((one) => one?.uid === mat.uid);
        return unit ? [{ src: artSrc(unit.cardId, unit.level ?? 1), spot: boardSpot(document.querySelector(`[data-slot="${viewer}-${at}"]`), slotSpot), uid: unit.uid }] : [];
      });
      setFuseChoice(null);
      setFuseShow({
        index,
        uid: opt.uid,
        slot: opt.slot,
        resultId: opt.resultId,
        phase: "lift",
        n: Date.now(),
        a: boardSpot(document.querySelector(".card-show") ?? document.querySelector(`[data-reserve="${index}"]`), { x: 30, y: 88, w: 18 }),
        b: mats[0]?.spot ?? slotSpot,
        c: mats[1]?.spot,
        at: slotSpot,
        set: { mats },
      });
      setInspect(null);
      return;
    }
    if (!mon) return;
    setFuseChoice(null);
    setFuseShow({
      index,
      uid: opt.uid,
      slot: opt.slot,
      resultId: opt.resultId,
      phase: "lift",
      n: Date.now(),
      a: boardSpot(document.querySelector(".card-show") ?? document.querySelector(`[data-reserve="${index}"]`), { x: 30, y: 88, w: 18 }),
      b: slotSpot,
      at: slotSpot,
      ...trioOf(held.id, mon),
    });
    setInspect(null);
  }
  /** What the held monster can do right now; a button only shows when the match would accept it. */
  function handActions(index: number): SheetAction[] {
    const held = you.reserve[index];
    if (!duel || !held || !monsterCard(held.id) || !canPlay) return [];
    const list: SheetAction[] = [];
    const place = summonAt(index);
    const front = rowSlot("front", place);
    const back = rowSlot("back", place);
    const first = front ?? back;
    if (first !== null) {
      list.push({
        key: "summon",
        label: "Triệu hồi",
        tone: "gold",
        cost: cost(place(first)),
        rows: {
          front: front !== null,
          back: back !== null,
          advice: advisedRow(held.id),
          onRow: (row) => {
            const slot = row === "front" ? front : back;
            if (slot === null) return;
            setInspect(null);
            apply(summon(duel, index, slot));
          },
        },
      });
    }
    // Ẩn (chủ game 21/11): mọi quái 1–4 sao, tốn thêm 1 mana, rồi chọn hàng như Triệu hồi.
    const hidePlace = hideAt(index);
    const hideFront = rowSlot("front", hidePlace);
    const hideBack = rowSlot("back", hidePlace);
    const hideFirst = hideFront ?? hideBack;
    if (hideFirst !== null) {
      list.push({
        key: "hide",
        label: "Ẩn",
        tone: "mist",
        emblem: "veil",
        cost: cost(hidePlace(hideFirst)),
        rows: {
          front: hideFront !== null,
          back: hideBack !== null,
          advice: advisedRow(held.id),
          onRow: (row) => {
            const slot = row === "front" ? hideFront : hideBack;
            if (slot === null) return;
            setInspect(null);
            apply(summonHidden(duel, index, slot));
          },
        },
      });
    }
    if (vowCap(held.id, held.saved?.level ?? 1) > 0 && ownLive.length > 0) {
      const offer = vowAt(index, [ownLive[0].uid]);
      const slot = rowSlot("front", offer) ?? rowSlot("back", offer);
      if (slot !== null) {
        list.push({ key: "vow", label: "Hiến tế", tone: "red", cost: cost(offer(slot)), onPress: () => {
          setInspect(null);
          setVowAsk({ index, slot: null, picks: [] });
        } });
      }
    }
    const ids = ownLive.map((mon) => mon.cardId);
    const opts: FuseOpt[] = [];
    for (const mon of ownLive) {
      const recipe = findFusion(held.id, mon.cardId) ?? findKnightFusion(held.id, mon.cardId, ids);
      if (!recipe || opts.some((opt) => opt.resultId === recipe.result)) continue;
      const slot = you.field.findIndex((unit) => unit?.uid === mon.uid) as Slot;
      const next = fuse(duel, index, mon.uid, slot);
      if (!took(next)) continue;
      opts.push({ uid: mon.uid, slot, resultId: recipe.result, cost: cost(next) });
    }
    // Dung hợp từ lá giống nhau (Khổng lồ, chủ game 18/11): nguyên liệu trên tay hoặc sân; quái ra đứng ở ô nguyên liệu trên sân, không thì ô trống.
    for (const way of setFusionsFor(duel, viewer, index)) {
      if (opts.some((opt) => opt.resultId === way.result)) continue;
      const order = [...way.mats.flatMap((mat) => (mat.from === "field" ? [you.field.findIndex((unit) => unit?.uid === mat.uid)] : [])), ...Array.from({ length: FIELD_SLOTS }, (_, at) => at)];
      const slot = order.find((at) => at >= 0 && took(fuseSet(duel, index, way.result, at as Slot))) as Slot | undefined;
      if (slot === undefined) continue;
      opts.push({ uid: way.mats.find((mat): mat is Extract<FuseMat, { from: "field" }> => mat.from === "field")?.uid ?? "", slot, resultId: way.result, cost: cost(fuseSet(duel, index, way.result, slot)), set: { mats: way.mats } });
    }
    // Mọi dung hợp (kể cả chỉ 1 cách) hiện bảng chọn quái kết quả, mỗi quái một nút Dung hợp (chủ game 18/11).
    if (opts.length > 0) {
      list.push({ key: "fuse", label: "Dung hợp", tone: "fuse", emblem: "swirl", cost: Math.min(...opts.map((opt) => opt.cost)), onPress: () => {
        setInspect(null);
        setPeekAt(0);
        setFuseChoice({ index, opts, at: 0 });
      } });
    }
    return list;
  }

  // The picked monster in hand that can be summoned now (a monster flashing orange shows its skill instead).
  const pickHeld = handPick?.pile === "reserve" ? you.reserve[handPick.index] : undefined;
  const pickMon = pickHeld && pickHeld.id === handPick?.id && canPlay && !(pickHeld.id === "the-than-cua-shien" && standHand) ? handPick.index : null;
  const pickRows = pickMon !== null ? { front: rowSlot("front", summonAt(pickMon)), back: rowSlot("back", summonAt(pickMon)) } : null;
  const pickShown = pickRows && (pickRows.front !== null || pickRows.back !== null) ? pickRows : null;
  // Bấm 1 lần lá quái trên tay (chủ game 01/11): hàng nút Triệu hồi / Hiến tế / Dung hợp (nút nào luật cho mới hiện) ở chỗ
  // 2 mũi tên; bấm Triệu hồi thì các nút biến mất, 2 mũi tên hiện thế chỗ.
  const pickActs: SheetAction[] =
    pickMon !== null
      ? handActions(pickMon).map((act) => {
          const index = pickMon;
          const press =
            act.key === "summon"
              ? pickHeld?.id === CLOCK
                ? () => openStage(index, { form: null })
                : () => setPickStage("rows")
              : act.key === "hide"
                ? () => setStage({ index, id: you.reserve[index]?.id ?? "", mode: "rows", picks: null, leave: null, hide: true, ...(pickHeld?.id === CLOCK ? { clock: { form: CLOCK_FIERCE } } : {}) })
                : act.onPress;
          return {
            ...act,
            rows: undefined,
            onPress: () => {
              if (secondTap("reserve", index)) {
                openSheet("reserve", index);
                return;
              }
              if (act.key !== "summon" && act.key !== "hide") setHandPick(null);
              press?.();
            },
          };
        })
      : [];

  /** An arrow on a picked monster in hand: summon it into that row; the second tap of a double tap opens its sheet. */
  function pickRow(index: number, row: SummonRow) {
    if (!duel) return;
    if (secondTap("reserve", index)) {
      openSheet("reserve", index);
      return;
    }
    const slot = rowSlot(row, summonAt(index));
    if (slot === null) return;
    setHandPick(null);
    apply(summon(duel, index, slot));
  }

  /** The card id whose name and skills a field monster shows (Tê giác changes form as it levels). */
  /** Kéo lá quái ra khỏi tay (hoặc bấm mũi tên trắng): lá hiện to giữa sân với các lựa chọn luật cho phép (chủ game 13/11). */
  function openStage(index: number, clock?: Staged["clock"]) {
    const held = you.reserve[index];
    const card = held ? monsterCard(held.id) : undefined;
    if (!duel || !held || !card || stage || fuseShow || vowAsk) return;
    if (queue && queueBlocked()) return;
    const acts = handActions(index);
    if (acts.length === 0) {
      turnOneHint();
      if (!needsDraw(card.stars) && canPlay && you.stars < card.stars && card.id !== "trieu-hoi-ac-ma" && you.draws >= 1) stuckHint(card.stars);
    }
    playPack("deal");
    playUi("confirm");
    setInspect(null);
    setHandPick({ pile: "reserve", index, id: held.id });
    if (clock && acts.some((act) => act.key === "summon")) {
      setStage({ index, id: held.id, mode: "rows", picks: null, leave: null, clock });
      return;
    }
    setStage({ index, id: held.id, mode: acts.length === 0 ? "none" : acts.length === 1 && acts[0].key === "summon" ? "rows" : "menu", picks: null, leave: null });
  }
  const stageHeld = stage ? you.reserve[stage.index] : undefined;
  const stageOk = Boolean(stage && stageHeld && stageHeld.id === stage.id);
  const stagePlace = stage && stageOk ? (stage.picks ? vowAt(stage.index, stage.picks) : stage.hide ? hideAt(stage.index) : summonAt(stage.index)) : null;
  const stageRows = stagePlace ? { front: rowSlot("front", stagePlace), back: rowSlot("back", stagePlace) } : null;
  // Đang chọn dạng Đồng hồ (Triệu hồi, chưa đáp): lá giữa ẩn, 2 dạng hai bên; chưa chọn thì mũi tên mờ.
  const stageChoosing = Boolean(stage?.clock && !stage.hide && stage.mode === "rows" && !stage.leave);
  const stageWaits = Boolean(stage?.clock && !stage.clock.form);
  const closeStage = () => setStage((now) => (now && !now.leave ? { ...now, leave: { kind: "home" } } : now));
  /** The staged card has flown: home to the hand, or onto its slot, where the summon really happens. */
  const stageLeft = () => {
    const done = stage;
    setStage(null);
    setHandPick(null);
    if (!done || done.leave?.kind !== "land" || !duel) return;
    const slot = done.leave.slot;
    const run = (state: Duel) => (done.picks ? summonVow(state, done.index, slot, done.picks) : done.hide ? summonHidden(state, done.index, slot) : summon(state, done.index, slot));
    apply(done.clock?.form && !done.hide ? summonClock(duel, done.clock.form, run) : run(duel));
  };
  const stageActs: SheetAction[] =
    stage && stageOk && stage.mode === "menu"
      ? handActions(stage.index).map((act) => ({
          ...act,
          rows: undefined,
          onPress:
            act.key === "summon" || act.key === "hide"
              ? () => setStage((now) => (now ? { ...now, mode: "rows", picks: null, hide: act.key === "hide", ...(now.id === CLOCK ? { clock: { form: act.key === "hide" ? CLOCK_FIERCE : null } } : {}) } : now))
              : act.key === "vow"
                ? () => setVowAsk({ index: stage.index, slot: null, picks: [], stage: true })
                : () => {
                    act.onPress?.();
                    setStage(null);
                    setHandPick(null);
                  },
        }))
      : [];
  /** Bảng ngắn của một lá trên tay: quái (chỉ số + kỹ năng) hoặc phép (màu tốc độ + chữ lá). */
  const peekOf = (pile: "reserve" | "spell", index: number): PeekInfo | null => {
    if (pile === "spell") {
      const card = spellCard(you.hand[index] ?? "");
      if (!card) return null;
      // Bảng ngắn của lá phép ghi tóm tắt từng dòng như bảng Huỷ / OK (chủ game 26/11); lá chưa có thì giữ chữ lá.
      const brief = spellBrief(duel, card.id, viewer).split("\n").slice(1).filter(Boolean);
      return { name: card.name, cardId: card.id, gems: you.tolls?.[index] ? `${card.gems}+1` : card.gems, skills: [], tone: speedTone(card.id), text: brief.length ? brief.join("\n") : card.effect };
    }
    const held = you.reserve[index];
    const card = held ? monsterCard(held.id) : undefined;
    if (!held || !card) return null;
    const live = reserveLive(held, card);
    const shownAs = previewMon(duel, viewer, held);
    const form = shownAs ? formOf(shownAs) : held.id;
    return { name: live.name, cardId: form, stars: card.stars, gems: held.toll ? `${card.gems}+1` : card.gems, stats: live, skills: skillsOf(form, monsterCard(form)?.skill ?? card.skill ?? "") };
  };
  /** Tay xoè (chủ game 13/11): lá thứ `at` nghiêng và hạ theo vòm, lá giữa đứng thẳng. */
  const fanStyle = (at: number): CSSProperties => {
    const mid = (you.reserve.length + you.hand.length - 1) / 2;
    const t = mid > 0 ? (at - mid) / mid : 0;
    return { "--rot": `${(t * Math.min(9, 3.2 * mid)).toFixed(2)}deg`, "--drop": `calc(${(t * t * Math.min(2.2, 0.7 * mid)).toFixed(2)} * var(--cqw))` } as CSSProperties;
  };
  // Lá tự rút của lượt đầu chờ (`wait`) tới sau 3 lá đầu: lá thật vẫn ẩn, chưa hiện giữa màn.
  const drawShow = drawShows[0] && !drawShows[0].wait ? drawShows[0] : null;
  const drawPeek = drawShow ? peekOf(drawShow.target.startsWith("r:") ? "reserve" : "spell", Number(drawShow.target.slice(2))) : null;
  const pickPeekRaw = !tutorial && !drawShow && !fuseShow && !vowAsk && !useAsk && !stage?.leave && handPick && !inspect ? peekOf(handPick.pile, handPick.index) : null;
  // Đồng hồ khó đoán đã chọn dạng: bảng ngắn hiện dạng đó.
  const clockShown = stage?.clock?.form ? monsterCard(stage.clock.form) : undefined;
  const pickPeek: PeekInfo | null =
    pickPeekRaw && clockShown
      ? { ...pickPeekRaw, name: tr(clockShown.name), cardId: clockShown.id, stats: { atk: clockShown.atk, def: clockShown.def, mdef: clockShown.mdef, hp: clockShown.hp }, skills: skillsOf(clockShown.id, clockShown.skill ?? "") }
      : pickPeekRaw;
  const handRect = (target: string) => {
    const pick = document.querySelector<HTMLElement>(`.hand [data-hand="${target}"]`);
    pick?.scrollIntoView({ block: "nearest", inline: "nearest" });
    return pick?.querySelector(".hand-card")?.getBoundingClientRect();
  };

  // Vuốt đổi lá trong bảng mô tả (chủ game 06/11), đi vòng tròn: tay bài (quái dự bị rồi phép); sân theo thứ tự quái hàng trước rồi hàng sau,
  // rồi lá môi trường và tường thành, của mình trước rồi sang sân địch; icon phản ứng thì chỉ đi qua các lá đang tham gia phản ứng.
  const browse = (dir: 1 | -1): boolean | void => {
    const turn = <T,>(list: T[], at: number): T | null => (list.length > 1 && at >= 0 ? list[(at + dir + list.length) % list.length] : null);
    const fromChain = (inspect?.pile === "env" && inspect.from === "chain") || look?.from === "chain";
    if (fromChain) {
      const cards = chain.filter((orb) => (orb.kind === "spell" && orb.spell) || orb.strike === "horn" || (((orb.kind === "skill" && orb.source) || orb.strike === "gaze") && orb.source && !hiddenMon(orb) && fieldMon(duel, orb.source)));
      const at = cards.findIndex((orb) => {
        if (orb.kind === "spell" && orb.spell) return inspect?.pile === "env" && inspect.id === orb.spell;
        if (orb.strike === "horn") return inspect?.pile === "env" && inspect.id === "sung-loi-pha";
        const mon = orb.source ? fieldMon(duel, orb.source) : null;
        return !!mon && look?.uid === mon.uid && look?.skill === iconSkill(orb)?.name;
      });
      const next = turn(cards, at);
      if (!next) return false;
      setInspect(null);
      setLook(null);
      openIcon(next);
      return;
    }
    if (inspect && inspect.pile !== "env") {
      const hand: Array<{ pile: "reserve" | "spell"; index: number }> = [
        ...you.reserve.map((_, index) => ({ pile: "reserve" as const, index })),
        ...you.hand.map((_, index) => ({ pile: "spell" as const, index })),
      ];
      const next = turn(hand, hand.findIndex((card) => card.pile === inspect.pile && card.index === inspect.index));
      if (!next) return false;
      setInspect({ pile: next.pile, index: next.index });
      return;
    }
    const ring: Array<{ uid: string; side: Side } | { env: string }> = [];
    for (const side of [viewer, foeSide] as Side[]) {
      const holder = side === viewer ? you : foe;
      holder.field.forEach((mon) => {
        if (mon && !seaVeiled(duel, viewer, mon.uid) && !(side !== viewer && holder.hats && mon.cardId !== "mu")) ring.push({ uid: mon.uid, side });
      });
      const spot = side === viewer ? board_env_spot(true) : board_env_spot(false);
      if (holder.env && !spot.hidden && spellCard(holder.env)) ring.push({ env: holder.env });
      wallCards(side).forEach((wall) => ring.push({ env: wall.id }));
    }
    const here = look?.uid ?? null;
    const at = ring.findIndex((one) => ("uid" in one ? one.uid === here : !here && inspect?.pile === "env" && one.env === inspect.id));
    const next = turn(ring, at);
    if (!next) return false;
    setInspect(null);
    setLook(null);
    if ("uid" in next) {
      const mon = fieldMon(duel, next.uid);
      if (mon) setLook({ ...fieldLook(mon, duel.players[next.side].stars), uid: mon.uid });
    } else setInspect({ pile: "env", id: next.env });
  };
  const board_env_spot = (mine: boolean) => (mine ? board.env : board.envFoe);

  // Tapping the card on the sheet opens the 3D fan of its related cards (owner, 19/10: everywhere a sheet opens).
  const sheetFor = (mon: FieldMon, allies: Array<FieldMon | null>, actions: SheetAction[], onClose: () => void, note?: string, startSkill?: string, stay = false, onSwipe?: (dir: 1 | -1) => boolean | void) => (
    <RelatedFlow
      id={formOf(mon)}
      onClose={onClose}
      sheet={(onArt) => (
        <MonsterSheet
          name={fieldName(mon)}
          card={<SheetCard mon={mon} allies={allies} layout={fieldLayout} />}
          count={sheetCount(mon, allies)}
          countBadge={sheetBadge(mon, allies)}
          tag={{ stars: monsterCard(formOf(mon))?.stars }}
          skills={skillsOf(formOf(mon), monsterCard(formOf(mon))?.skill ?? "")}
          actions={actions}
          note={note}
          onClose={onClose}
          onArt={onArt}
          startSkill={startSkill}
          stay={stay}
          onSwipe={stay ? undefined : onSwipe}
        />
      )}
    />
  );
  const handMon = inspect?.pile === "reserve" && reserveHeld ? previewMon(duel, viewer, reserveHeld) : null;
  const handSheet = handMon && inspect?.pile === "reserve" ? sheetFor(handMon, you.field, tutorial ? handActions(inspect.index) : [], () => setInspect(null), undefined, undefined, false, browse) : null;
  const lookMon = look?.uid ? [...you.field, ...foe.field].find((mon) => mon?.uid === look.uid) ?? null : null;
  const lookAllies = lookMon && you.field.some((mon) => mon?.uid === lookMon.uid) ? you.field : foe.field;
  const lookSheet = lookMon ? sheetFor(lookMon, lookAllies, [], () => setLook(null), look?.hot ? `${look.text}${look.hot}` : undefined, look?.skill, false, browse) : null;

  // Icon phản ứng (chủ game 23/10): where each icon stands and where its smoke lands, from the viewer's seat. An icon
  // stands at the middle of its card's edge that faces the middle (under a card of the top row, over one of the
  // bottom row); a spell stands on its side's half, by the icon it answers, or in the middle of that half. A monster
  // hidden by Biển sâu or under a hat does not show its skill, as on the board and in the notices.
  const lineOn = chain.length > 0;
  const seatOfUid = (uid: string): { side: Side; index: number } | null => {
    let seat: { side: Side; index: number } | null = null;
    for (const side of [0, 1] as const) {
      const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
      if (index >= 0) seat = { side, index };
    }
    if (seat) lineSeats.current.set(uid, seat);
    else seat = lineSeats.current.get(uid) ?? null;
    return seat;
  };
  /** A card on the board in % of the board: its middle where it stands now (an attacker lunges), its size and row. */
  const cardSpot = (uid: string) => {
    const seat = seatOfUid(uid);
    if (!seat) return null;
    const row = screenSide(seat.side, viewer);
    const box = SLOT_BOX[row][seat.index];
    const lunge = attackShift(duel, uid, viewer) ?? blockShift(duel, uid, viewer) ?? (pounce === uid ? ambushShift(duel, uid, viewer) : null);
    const dx = lunge ? (lunge.x * box.w) / 100 : 0;
    const dy = lunge ? (lunge.y * box.h) / 100 : 0;
    return { x: box.x + box.w / 2 + dx, y: box.y + box.h / 2 + dy, w: box.w, h: box.h, top: row === 1, dx, dy };
  };
  /** Whether no card stands right beside a monster's card in its row, to its left (-1) or right (+1) on the screen. */
  const besideFree = (uid: string, dir: -1 | 1) => {
    const seat = seatOfUid(uid);
    if (!seat) return true;
    const boxes = SLOT_BOX[screenSide(seat.side, viewer)];
    const own = boxes[seat.index];
    const row = seat.index < 3 ? [0, 1, 2] : [3, 4, 5];
    return !row.some((index) => {
      if (index === seat.index || !duel.players[seat.side].field[index]) return false;
      const gap = boxes[index].x - own.x;
      return Math.sign(gap) === dir && Math.abs(gap) < own.w * 1.6;
    });
  };
  /** Dòng chảy đợt 2: a side's front row, in % of the board: the edge facing the middle and where a spread splits. */
  const frontOf = (side: Side) => {
    const row = screenSide(side, viewer);
    const front = SLOT_BOX[row].slice(0, 3);
    const top = row === 1;
    const edge = top ? Math.max(...front.map((box) => box.y + box.h)) : Math.min(...front.map((box) => box.y));
    const mid = front[1];
    return { top, edge, x: mid.x + mid.w / 2 };
  };
  /** Where a spread splits: out in the middle band between the two front rows (not up against the monsters), toward
   *  the middle of its targets, so branches fan out naturally (chủ game 29/10). */
  const forkFor = (orb: ChainOrb, from: { x: number; y: number }) => {
    const side = orb.spread as Side;
    const near = frontOf(side);
    const far = frontOf((1 - side) as Side);
    const band = Math.abs(far.edge - near.edge);
    const xs: number[] = [];
    const spots: Array<{ x: number; y: number }> = [];
    for (const link of orb.to) {
      if (!link.fork) continue;
      // A branch a monster blocks still counts as the one it was on its way to.
      const end = link.cover ?? link.end;
      if ("uid" in end) {
        const card = cardSpot(end.uid);
        if (card) {
          xs.push(card.x);
          spots.push(card);
        }
      } else if ("face" in end) {
        xs.push((end.face === viewer ? board.marks.youHp : board.marks.foeHp).x);
      } else if ("mana" in end) {
        const name = `${end.mana === viewer ? "you" : "foe"}${end.part === "orb" ? "Orb" : end.part === "gems" ? "Gems" : "Stars"}` as keyof typeof board.marks;
        xs.push(board.marks[name].x);
      }
    }
    // Gió dịu đi (chủ game 22/11): the mother flow runs ~half way from its icon to the two mana marks, then splits.
    const manas = orb.to.filter((link) => link.fork && "mana" in link.end);
    if (manas.length && manas.length === orb.to.filter((link) => link.fork).length) {
      const marks = manas.map((link) => {
        const end = link.end as { mana: Side; part: "orb" | "gems" | "stars" };
        const name = `${end.mana === viewer ? "you" : "foe"}${end.part === "orb" ? "Orb" : end.part === "gems" ? "Gems" : "Stars"}` as keyof typeof board.marks;
        return board.marks[name];
      });
      const mx = marks.reduce((sum, m) => sum + m.x, 0) / marks.length;
      const my = marks.reduce((sum, m) => sum + m.y, 0) / marks.length;
      return { x: from.x + (mx - from.x) * MANA_FORK, y: from.y + (my - from.y) * MANA_FORK, front: [] as Array<{ x: number; y: number; w: number; h: number }> };
    }
    const mean = xs.length ? xs.reduce((sum, x) => sum + x, 0) / xs.length : near.x;
    // The front row it is aimed at, for the branches to find their way round its cards.
    const front = SLOT_BOX[screenSide(side, viewer)].slice(0, 3).map((box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2, w: box.w, h: box.h }));
    const y = near.edge + (near.top ? 1 : -1) * band * FORK_SHARE;
    // Up to three cards, two of them one behind the other: it splits on the way into one of the front-row cards, right
    // under it, the one most in line with where it comes from (chủ game 29/10: điểm tách nằm trên một trong các dòng,
    // nửa đầu dòng kia dùng chung; as the standard of two in a column).
    // Two or three targets always (chủ game 29/10: chỉ từ 4 quái trở lên mới dùng kiểu cũ).
    const stacked = xs.length > 1 && xs.length <= 3;
    const ahead = spots.filter((spot) => Math.abs(spot.y - front[0].y) < front[0].h * 0.5).sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))[0];
    if (stacked && ahead) return { x: ahead.x, y, front };
    return { x: Math.min(86, Math.max(14, from.x * 0.4 + mean * 0.6)), y, front };
  };
  /** Where a spell that stops a flow flies in from: the player's hand, or the wall card it lies as (Gương phòng hộ). */
  const throwFrom = (side: Side, wall?: string | null) => {
    const lying = wall ? wallCards(side).find((card) => card.id === wall) : undefined;
    if (lying) return { x: lying.x, y: lying.y };
    return side === viewer ? { x: 50, y: ry(95) } : { x: 51.6, y: ry(7.2) };
  };
  /**
   * Dòng chảy đợt 2 (chủ game 29/10): a spell that stops a flow (Lá chắn phản đòn, Gương phòng hộ, Vòng nguyền rủa ác
   * ma) stands in its way as a dam: just before the fork of a spread, else just in front of the row of the side it
   * guards, on the way from the icon it stops to what that was aimed at.
   */
  const stopSpot = (orb: ChainOrb, placed: ReadonlyMap<string, IconSpot>): IconSpot | null => {
    const stopped = chain.find((other) => other.id === orb.stops) ?? null;
    const from = stopped ? placed.get(stopped.id) ?? null : null;
    if (!stopped || !from) return null;
    const tall = ICON * boardAspect();
    let goal: { x: number; y: number; side: Side; fork: boolean } | null = null;
    if (stopped.spread !== undefined && stopped.spread !== null) {
      const fork = forkFor(stopped, from);
      goal = { x: fork.x, y: fork.y, side: stopped.spread, fork: true };
    }
    else if (stopped.goal && "uid" in stopped.goal) {
      const card = cardSpot(stopped.goal.uid);
      const seat = seatOfUid(stopped.goal.uid);
      if (card && seat) goal = { x: card.x, y: card.y, side: seat.side, fork: false };
    } else if (stopped.goal && "face" in stopped.goal) {
      const mark = stopped.goal.face === viewer ? board.marks.youHp : board.marks.foeHp;
      goal = { x: mark.x, y: mark.y, side: stopped.goal.face, fork: false };
    }
    if (!goal) return null;
    const front = frontOf(goal.side);
    const wantY = (goal.fork ? goal.y : front.edge) + (front.top ? 1 : -1) * (tall / 2 + 0.8);
    const span = goal.y - from.y;
    // At least a short stretch of the flow shows before the wall: an attacker that lunged far leaves little room.
    const least = (ICON * 1.9) / (Math.hypot(goal.x - from.x, span / boardAspect()) || 1);
    const t = Math.min(0.9, Math.max(0.2, least, Math.abs(span) < 0.5 ? 0.6 : (wantY - from.y) / span));
    const x = Math.min(99 - ICON / 2, Math.max(ICON / 2 + 1, from.x + (goal.x - from.x) * t));
    return { x, y: from.y + span * t, face: 0, delay: 0.5, appear: 0 };
  };
  /** Where a flow lands on a card (the middle of its edge facing the flow) or on a player's HP. */
  const flowEnd = (end: FlowEnd, from: { x: number; y: number }): EndSpot | null => {
    if ("orb" in end) return null;
    // Dòng chảy đợt 2 (chủ game 29/10): it runs into a thin moat round what it reaches, as a canal into the moat of a
    // walled city: a ring round a player's health, the card's box round a monster.
    if ("face" in end) {
      const mark = end.face === viewer ? board.marks.youHp : board.marks.foeHp;
      const dx = (mark.x - from.x) * 0.9;
      const dy = (mark.y - from.y) * 1.6 * boardCut().v;
      const len = Math.hypot(dx, dy) || 1;
      return { x: mark.x, y: mark.y, into: { x: dx / len, y: dy / len }, moat: { kind: "ring", x: mark.x, y: mark.y, r: HP_RING } };
    }
    if ("mana" in end) {
      // Gió dịu đi (chủ game 22/11): a ring round the attacker's ngọc mana, mana in the grave or star frame.
      const name = `${end.mana === viewer ? "you" : "foe"}${end.part === "orb" ? "Orb" : end.part === "gems" ? "Gems" : "Stars"}` as keyof typeof board.marks;
      const mark = board.marks[name];
      const dx = (mark.x - from.x) * 0.9;
      const dy = (mark.y - from.y) * 1.6 * boardCut().v;
      const len = Math.hypot(dx, dy) || 1;
      return { x: mark.x, y: mark.y, into: { x: dx / len, y: dy / len }, moat: { kind: "ring", x: mark.x, y: mark.y, r: MANA_RING } };
    }
    if ("hand" in end || "pile" in end) {
      // Virus ăn mòn eats a card in the hand or the deck (chủ game 30/10): the flow runs into a moat that follows the
      // edge of the pile (the printed pile on the board) or of the hand, not a circle.
      const mine = ("hand" in end ? end.hand : end.pile) === viewer;
      const el = mine ? document.querySelector("hand" in end ? ".hand" : ".face-pile") : null;
      const stack = board.stack;
      const mark = "hand" in end ? marks.foeReserve : board.marks.foeHand;
      const box =
        mine && el
          ? (() => {
              const r = el.getBoundingClientRect();
              const bd = document.querySelector(".board")?.getBoundingClientRect();
              return bd ? { x: ((r.left + r.width / 2 - bd.left) / bd.width) * 100, y: ((r.top + r.height / 2 - bd.top) / bd.height) * 100, w: (r.width / bd.width) * 100, h: (r.height / bd.height) * 100 } : null;
            })()
          : null;
      const spot = box ?? { x: mark.x, y: mark.y, w: "hand" in end ? 30 : stack.width, h: "hand" in end ? 9 : stack.height };
      const below = from.y > spot.y;
      return { x: spot.x, y: below ? spot.y + spot.h * 0.5 : spot.y - spot.h * 0.5, into: { x: 0, y: below ? -1 : 1 }, moat: { kind: "box", x: spot.x, y: spot.y, w: spot.w, h: spot.h } };
    }
    // Pháo kích bắn vào lá tường thành (chủ game 23/11): dòng chạy vào hào quanh lá nằm ngang đầu tiên của bên đó.
    if ("wall" in end) {
      const lying = wallCards(end.wall)[0];
      if (!lying) return null;
      const below = from.y > lying.y;
      return { x: lying.x, y: below ? lying.y + lying.h * 0.5 : lying.y - lying.h * 0.5, into: { x: 0, y: below ? -1 : 1 }, moat: { kind: "box", x: lying.x, y: lying.y, w: lying.w, h: lying.h } };
    }
    const card = cardSpot(end.uid);
    if (!card) return null;
    const below = from.y > card.y;
    return { x: card.x, y: below ? card.y + card.h * 0.5 : card.y - card.h * 0.5, into: { x: 0, y: below ? -1 : 1 }, moat: { kind: "box", x: card.x, y: card.y, w: card.w, h: card.h } };
  };
  const iconSpots = new Map<string, IconSpot>();
  /** Chặn từng nhánh (chủ game 29/10): how far each monster covering a branch has flown out, in % of its own box, so
   *  its icon stands on that branch. */
  const coverShifts = new Map<string, { x: number; y: number }>();
  /** Where a flow lands, as the icons layer works it out: on a card or a player, or the rim of the icon facing it. */
  const flowPoint = (one: FlowLink, from: { x: number; y: number }): EndSpot | null => {
    if (!("orb" in one.end)) return flowEnd(one.end, from);
    const spot = iconSpots.get(one.end.orb);
    if (!spot) return null;
    const dx = (spot.x - from.x) * 0.9;
    const dy = (spot.y - from.y) * 1.6;
    const len = Math.hypot(dx, dy) || 1;
    const rim = ICON * 0.45 * (one.dam ? 0.95 : 0.8);
    return { x: spot.x - (dx / len) * (rim / 0.9), y: spot.y - (dy / len) * (rim / 1.6), into: { x: dx / len, y: dy / len } };
  };
  {
    const tall = ICON * boardAspect();
    /** A block icon on one branch of a spread: on that branch where it crosses in front of the blocker's row; the
     *  blocker flies out so its icon stands there. */
    const coverSpot = (orb: ChainOrb): IconSpot | null => {
      if (!orb.cover || !orb.source || orb.done) return null;
      const live = chain.find((other) => other.to.some((link) => link.cover && "orb" in link.end && link.end.orb === orb.id));
      const link = live?.to.find((one) => one.cover && "orb" in one.end && one.end.orb === orb.id);
      const here = live ? iconSpots.get(live.id) : undefined;
      const card = cardSpot(orb.source);
      if (!live || !link || !here || !card || live.spread === undefined || live.spread === null) return null;
      const fork = forkFor(live, here);
      const route = branchRoutes(live, fork, flowPoint).get(keyOf(live, link));
      if (!route) return null;
      // It flies out to the branch's way, 70% of the way from the fork to what it covers (chủ game 29/10).
      const rest = card.top ? card.y + card.h / 2 + tall / 2 + 0.6 : card.y - card.h / 2 - tall / 2 - 0.6;
      const at = coverPoint(route, COVER_ALONG);
      const x = Math.min(99 - ICON / 2, Math.max(ICON / 2 + 1, at.x));
      const seat = seatOfUid(orb.source);
      const box = seat ? SLOT_BOX[screenSide(seat.side, viewer)][seat.index] : null;
      // The card lifts toward the middle as a plain blocker does, never back into its own row, and over to the icon.
      const lift = Math.min(LUNGE_BLOCK * card.h, Math.max(0, blockRoom() / 2));
      const toward = card.top ? 1 : -1;
      const dy = toward * Math.min(lift, Math.max(0, (at.y - rest) * toward));
      if (box) coverShifts.set(orb.source, { x: ((x - card.x) * 100) / box.w, y: (dy * 100) / box.h });
      return { x, y: at.y, face: card.top ? 1 : -1, delay: 0, appear: 0 };
    };
    const rows = 16 / 9 / boardCut().v;
    // An icon placed later never stands on the flow of one placed before (chủ game 30/10): each placed icon's flows, as
    // straight runs from it to where they land, are kept clear of by `ICON * 0.95`.
    const runs: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
    const onRun = (x: number, y: number) =>
      runs.some(([a, b]) => {
        const dx = b.x - a.x;
        const dy = (b.y - a.y) * rows;
        const len2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * rows * dy) / len2));
        return Math.hypot(x - (a.x + t * dx), (y - (a.y + (t * dy) / rows)) * rows) < ICON * 0.95;
      });
    const clear = (x: number, y: number) => !onRun(x, y) && [...iconSpots.values()].every((other) => Math.hypot(x - other.x, (y - other.y) * rows) >= ICON * 1.08);
    // Song sát: the allies' icons first, so the spell's icon finds its place between them clear of their flows.
    const placing = [...chain].sort((a, b) => Number(Boolean(b.base?.startsWith("duo:"))) - Number(Boolean(a.base?.startsWith("duo:"))));
    for (const orb of placing) {
      const kept = keptSpots.current.get(orb.id);
      // Once the wait is over an icon stays where it stood (the attacker leaves its lunge before its icon fires).
      if (kept && (orb.done || !responding)) {
        iconSpots.set(orb.id, kept);
        continue;
      }
      let spot: IconSpot | null = orb.cover ? coverSpot(orb) : null;
      const card = orb.near && !spot ? cardSpot(orb.near) : null;
      if (spot) {
        // Placed on its branch.
      } else if (card) {
        const lunging = card.dx !== 0 || card.dy !== 0;
        // A blow and its blocker on a cut board: their icons close in on their cards to leave the flow between them.
        const squeeze = duel.hold?.blocker && orb.kind !== "spell" ? Math.min(tall * 0.5, Math.max(0, -blockRoom() / 2)) : 0;
        spot = {
          // Khoá 1's icon stands beside the striker's own (chủ game 22/11).
          x: orb.kind === "seal" ? Math.min(99 - ICON / 2, Math.max(ICON / 2 + 1, card.x + (card.x > 50 ? -1 : 1) * ICON * 1.15)) : card.x,
          // Clear of the card, just in front of its edge (chủ game 23/10).
          y: card.top ? card.y + card.h / 2 + tall / 2 + 0.6 - squeeze : card.y - card.h / 2 - tall / 2 - 0.6 + squeeze,
          face: card.top ? 1 : -1,
          // A lunging card's light starts as it arrives (an attack, or a skill at a player); an attacker's or a
          // caster's icon fades in only after its light has reached out (chủ game 23/10).
          // Phục kích's ally strikes after its pink light reached it and it flew out.
          delay: orb.sent ? POUNCE_AFTER / 1000 + 0.3 : lunging ? 0.75 : 0,
          appear: orb.sent ? POUNCE_AFTER / 1000 : orb.kind === "attack" || orb.kind === "skill" ? (lunging ? 1.3 : 0.5) : 0,
        };
      } else if (!orb.near && orb.stops && stopSpot(orb, iconSpots)) {
        spot = stopSpot(orb, iconSpots);
      } else if (!orb.near) {
        const mine = orb.side === viewer;
        const halfY = ry(mine ? 56 : 40);
        const anchor = orb.by ? iconSpots.get(orb.by) ?? null : null;
        let x = 44;
        let y = halfY;
        // Song sát (chủ game 25/11): between its 2 allies' icons and a step toward the middle, so the pink light runs
        // down into them without crossing their own light into the enemy.
        const allies = orb.spell === DUO_CARD ? orb.to.flatMap((link) => ("orb" in link.end ? [iconSpots.get(link.end.orb)] : [])).filter((one): one is IconSpot => Boolean(one)) : [];
        if (allies.length > 0) {
          x = allies.reduce((sum, one) => sum + one.x, 0) / allies.length;
          y = allies.reduce((sum, one) => sum + one.y, 0) / allies.length;
        }
        // Icons of a chain line up toward the middle of the board, the earlier an answer the nearer the icon it
        // answers (chủ game 28/10): a monster on the right sends them left, one on the left sends them right.
        const dir = anchor ? (anchor.x < 50 ? 1 : -1) : 1;
        if (anchor && anchor.y > ry(51) === mine) {
          x = anchor.x + dir * ICON * 1.8;
          y = anchor.y;
        } else if (anchor) {
          x = anchor.x;
        }
        const from = x;
        const lane = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((step) => [from + dir * step * ICON * 1.15]).concat([1, 2, 3, 4].map((step) => from - dir * step * ICON * 1.15));
        if (allies.length > 0) {
          // On the line between the two halves, halfway between A and B: where the two allies' flows cross that line
          // (chủ game 26/11). Each flow leaves its icon straight up and only then bends toward the enemy, so it crosses
          // the line close to its icon's x: the middle of the two icons stands for the middle of A and B.
          x = allies.reduce((sum, one) => sum + one.x, 0) / allies.length;
          y = ry(51);
        } else
          for (const next of lane) {
            if (clear(x, y)) break;
            x = Math.min(99 - ICON / 2, Math.max(ICON / 2 + 1, next));
          }
        spot = { x, y, face: 0, delay: 0, appear: 0 };
      }
      if (!spot) spot = kept ?? null;
      if (!spot) continue;
      iconSpots.set(orb.id, spot);
      keptSpots.current.set(orb.id, spot);
      for (const link of orb.to) {
        if ("orb" in link.end) continue;
        const land = flowEnd(link.end, spot);
        if (land) runs.push([spot, land]);
      }
    }
  }
  // Kéo quái lên dòng flow của đòn cũng là chặn (chủ game 18/11), không chỉ lên icon hay quái ra đòn.
  strikeFlows.current = [];
  if (responding) {
    for (const orb of chain) {
      if (orb.done || (orb.kind !== "attack" && orb.kind !== "skill")) continue;
      const from = iconSpots.get(orb.id);
      if (!from) continue;
      for (const link of orb.to) {
        if ("orb" in link.end) continue;
        const land = flowEnd(link.end, from);
        if (land) strikeFlows.current.push([from, land]);
      }
    }
  }
  // Chặn từng nhánh (chủ game 29/10): the branches of a spread a monster can still stand in front of, as points along
  // their way (in % of the board), for a monster dropped onto one.
  {
    const lanes: Array<{ hit: string; pts: Array<{ x: number; y: number }> }> = [];
    const live = responding ? chain.find((orb) => !orb.done && orb.spread !== undefined && orb.spread !== null && orb.to.filter((link) => link.fork).length >= 2) : undefined;
    const here = live ? iconSpots.get(live.id) : undefined;
    if (live && here) {
      const fork = forkFor(live, here);
      const routes = branchRoutes(live, fork, flowPoint);
      for (const link of live.to) {
        if (!link.fork || link.cover || "orb" in link.end) continue;
        const path = routes.get(keyOf(live, link))?.path;
        if (!path) continue;
        const pts: Array<{ x: number; y: number }> = [];
        for (let j = 0; j + 3 < path.length; j += 3) {
          for (let i = 0; i <= 24; i += 1) {
            const t = i / 24;
            const u = 1 - t;
            const [a, b, c, d] = [path[j], path[j + 1], path[j + 2], path[j + 3]];
            pts.push({ x: (u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x) / 0.9, y: (u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y) / 1.6 });
          }
        }
        lanes.push({ hit: "uid" in link.end ? link.end.uid : `face:${(link.end as { face: Side }).face}`, pts });
      }
    }
    branchLanes.current = lanes;
  }
  const hiddenMon = (orb: ChainOrb) => {
    const mon = orb.source ? fieldMon(duel, orb.source) : null;
    return Boolean(orb.source && seaVeiled(duel, viewer, orb.source)) || (orb.side !== viewer && duel.players[orb.side].hats && (mon?.cardId ?? orb.cardId) !== "mu");
  };
  /** The skill an icon stands for, as on the monster sheet: its name, glyph and kind. */
  const iconSkill = (orb: ChainOrb): { name: string; icon: string; kind: string; brief: string } | null => {
    const mon = orb.source ? fieldMon(duel, orb.source) : null;
    const facts = skillFacts(mon, orb.cardId, orb.skill);
    if (!facts) return null;
    const { cardId, name, kind } = facts;
    const hit = facts;
    // Its results as it stands now; once the caster has gone (Mộ voi ma mút gives itself), what it said last.
    const pending = duel.pending;
    const extra = pending?.kind === "beam" && orb.source && pending.caster === orb.source ? pending.extra ?? null : null;
    const fresh = name && mon ? skillBrief({ duel, cardId, name, mon, target: orb.aim ? fieldMon(duel, orb.aim) : null, result: orb.result, extra }) : "";
    if (fresh) briefSeen.current.set(orb.id, fresh);
    const brief = fresh || briefSeen.current.get(orb.id) || (name ? skillBrief({ duel, cardId, name, mon: null, target: null, result: orb.result }) : "");
    return { name, icon: hit?.icon ?? "sparkles", kind, brief };
  };
  const iconLook = (orb: ChainOrb): IconLook => {
    if (orb.kind === "block") return { type: "medal", tone: "gold", icon: "crossed-swords" };
    if (orb.kind === "seal") return { type: "art", src: "/ui/kw/luon-lach-1.webp", ring: orb.tone };
    if (orb.kind === "spell") return { type: "art", src: orb.spell ? spellSrc(orb.spell) : null, ring: orb.tone };
    if (orb.kind === "attack" && orb.strike === "horn") return { type: "art", src: spellSrc("sung-loi-pha"), ring: "blue" };
    if (orb.kind === "attack" && orb.strike !== "gaze") return { type: "medal", tone: "red", icon: "sword-brandish" };
    if (hiddenMon(orb)) return { type: "gem", icon: "sparkles", kind: "active" };
    const skill = iconSkill(orb);
    return { type: "gem", icon: skill?.icon ?? "sparkles", kind: skill?.kind ?? "active" };
  };
  // A tap on a skill's or a spell's icon: its name and short effect (chủ game 23/10, T3). An attack, a block, Sừng lôi
  // phá's strike and a hidden monster keep the notice they came with.
  const iconNote = (orb: ChainOrb): ReactNode => {
    const brief =
      orb.kind === "spell" && orb.spell
        ? spellBrief(duel, orb.spell, orb.side, chain.some((other) => other.to.some((link) => link.from && "orb" in link.from && link.from.orb === orb.id)), chain.some((other) => other.id === orb.by && other.spell === "virus-an-mon"))
        : (orb.kind === "skill" || orb.strike === "gaze") && !hiddenMon(orb)
          ? iconSkill(orb)?.brief ?? ""
          : "";
    if (brief) return <NoticeText text={brief} />;
    const text = orb.notice || (orb.spell ? spellCard(orb.spell)?.name ?? "" : "");
    return text ? <NoticeText text={veilNotice(spoken(text, viewer), duel, viewer)} /> : null;
  };
  // Two quick taps on an icon: its card. A skill's sheet opens on that skill (chủ game 23/10).
  const openIcon = (orb: ChainOrb) => {
    if (orb.kind === "spell" && orb.spell) {
      setInspect({ pile: "env", id: orb.spell, from: "chain" });
      return;
    }
    if (orb.strike === "horn") {
      setInspect({ pile: "env", id: "sung-loi-pha", from: "chain" });
      return;
    }
    const mon = orb.source ? fieldMon(duel, orb.source) : null;
    if (!mon) return;
    const side: Side = duel.players[0].field.some((unit) => unit?.uid === mon.uid) ? 0 : 1;
    if (hiddenMon(orb)) {
      setLook({ name: "quái thú ẩn mình", text: "Không thấy kỹ năng hay chỉ số." });
      return;
    }
    const skill = orb.kind === "skill" || orb.strike === "gaze" ? iconSkill(orb)?.name : undefined;
    setLook({ ...fieldLook(mon, duel.players[side].stars), uid: mon.uid, skill, from: "chain" });
  };
  // The big card as a spell or a skill lands on the line: the spell, or the monster with its skill's name. A monster
  // hidden by Biển sâu or under a hat shows none.
  const orbCard = (orb: ChainOrb): ReactNode => {
    if (orb.kind === "spell") return orb.spell ? <CardFace spellId={orb.spell} /> : null;
    const mon = orb.kind === "skill" && orb.source ? fieldMon(duel, orb.source) : null;
    if (!mon || seaVeiled(duel, viewer, mon.uid) || (orb.side !== viewer && duel.players[orb.side].hats && mon.cardId !== "mu")) return null;
    const card = monsterCard(mon.cardId);
    if (!card) return null;
    const stats = visibleStats(mon, duel.players[orb.side].field);
    const name = orb.skill === "lash" || orb.skill === "armor" ? chipLabel(mon.cardId, orb.skill) : orb.skill !== null ? castName(mon.cardId, orb.skill) : "";
    // A skill with painted art shows just that picture, feathered and glowing, without a rim (chủ game 20/11), then it
    // shrinks into the round icon.
    const sk = iconSkill(orb);
    if (sk && hasSkillArt(sk.icon)) {
      return (
        <>
          <span className="rx-show-skill">
            <SkillGlyph name={sk.icon} center />
          </span>
          {name ? <b className="rx-show-name">{tr(name)}</b> : null}
        </>
      );
    }
    return (
      <>
        <CardFace monster={card} level={mon.level ?? 1} live={{ name: fieldName(mon), atk: stats.atk, def: stats.def, mdef: stats.mdef, hp: mon.hp }} />
        {name ? <b className="rx-show-name">{tr(name)}</b> : null}
      </>
    );
  };
  // Đầu trận (chủ game 22/10): the match loading banner picks a monster of your deck (T15); the VS screen shows each
  // side's deck and champion (T1); the opening hand is the 2 monsters and the spell (T2).
  const loadFace: LoadFace = {
    mode: tr(tutorial ? "Hướng dẫn" : duel.mode === "ai" ? "Vs Máy" : duel.mode === "net" ? ((net as { quick?: boolean } | null)?.quick ? "Đánh thường" : "Tuỳ chọn") : duel.mode === "test" ? "Test" : "2 người"),
    pool: (you.roster ?? []).flatMap((id) => {
      const card = monsterCard(id);
      return card ? [{ name: tr(card.name), art: artSrc(id, 1) }] : [];
    }),
  };
  const sideLabel = (side: Side) => (side === viewer ? "Bạn" : duel.faces?.[side]?.name ?? (duel.mode === "ai" ? "Máy" : "Đối thủ"));
  const introSide = (side: Side): IntroSide => {
    const face = duel.faces?.[side] ?? null;
    return { label: sideLabel(side), deck: face?.deck ?? null, art: face?.cover ? artSrc(face.cover, 1) : null };
  };
  // Tổng kết trận (chủ game 22/10) after Vs Máy, Đánh thường and Tuỳ chọn; Test, Hướng dẫn and Thực chiến keep the
  // old panel. Each row has the side's name and deck as the VS screen shows them, over the board it played on.
  const quickNet = Boolean((net as { quick?: boolean } | null)?.quick);
  const summed = !tutorial && !trial && (duel.mode === "ai" || duel.mode === "net");
  const summarySeat = (side: Side): SummarySeat => {
    const face = duel.faces?.[side] ?? null;
    const env = duel.players[side].env;
    return { label: sideLabel(side), deck: face?.deck ?? null, cover: face?.cover ?? null, board: side === viewer ? bottomArt(env) : topArt(env), cards: face?.cards ?? null };
  };
  const sawEnd = endedAt.current;
  const endAt = sawEnd && sawEnd.mid === duel.mid ? sawEnd.at : Date.now();
  const matchSeconds = Math.max(0, Math.round((endAt - (duel.started ?? endAt)) / 1000));
  const votes: [AgainVote, AgainVote] = duel.again ?? [null, null];
  const theirVote = votes[viewer === 0 ? 1 : 0];
  const againLook: SummaryAgain =
    duel.mode !== "net" || quickNet
      ? {}
      : theirVote === "left"
        ? { off: true, note: "Đối thủ đã rời phòng.", tone: "red" }
        : again || votes[viewer] === "want"
          ? { waiting: true }
          : theirVote === "want"
            ? { note: "Đối thủ muốn chơi lại." }
            : {};
  // Lá tự rút lượt đầu không nằm trong bảng đổi bài: bảng chỉ có 3 lá đầu, lá rút bay lên tay sau khi bảng đóng.
  const autoR = you.draws >= 1 && you.reserve.length > 2 ? you.reserve.length - 1 : -1;
  const autoS = you.draws >= 1 && autoR < 0 && you.hand.length > 1 ? you.hand.length - 1 : -1;
  const wileAsk = duel.wileAsk?.[0] ?? null;
  const rhinoAsk = duel.rhinoAsk ?? null;
  const rhinoMon = rhinoAsk ? duel.players[rhinoAsk.side].field.find((unit) => unit?.uid === rhinoAsk.uid) ?? null : null;
  const rhinoCard = rhinoAsk ? monsterCard(rhinoAsk.level >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang") : null;
  const trimAsk = duel.trimAsk?.[0] ?? null;
  // Bỏ lá dư (chủ game 27/11): đủ mọi lá trên tay, quái dự bị trước rồi phép, như bảng Sinh mệnh mới.
  const trimHand = trimAsk ? duel.players[trimAsk.side] : null;
  const trimCards: PickCard[] = trimHand
    ? [
        ...trimHand.reserve.map((held, index): PickCard => {
          const card = monsterCard(held.id);
          return { key: `r:${index}`, face: card ? <CardFace monster={card} hand level={held.saved?.level ?? 1} live={reserveLive(held, card)} fake={held.fake} gems={held.toll ? `${card.gems}+1` : undefined} /> : null };
        }),
        ...trimHand.hand.map((id, index): PickCard => ({ key: `s:${index}`, face: <CardFace spellId={id} hand gems={trimHand.tolls?.[index] ? `${spellCard(id)?.gems ?? 0}+1` : undefined} /> })),
      ]
    : [];
  const openerCards: OpenerCard[] = [
    ...you.reserve.filter((_, index) => index !== autoR).map((held, index): OpenerCard => {
      const card = monsterCard(held.id);
      return {
        key: `m${index}:${held.id}`,
        face: card ? <CardFace monster={card} hand level={held.saved?.level ?? 1} live={reserveLive(held, card)} fake={held.fake} gems={held.toll ? `${card.gems}+1` : undefined} /> : null,
        can: pileLeft(you) > 0,
      };
    }),
    ...you.hand.filter((_, index) => index !== autoS).map((id, index): OpenerCard => ({ key: `s${index}:${id}`, face: <CardFace spellId={id} hand gems={you.tolls?.[index] ? `${spellCard(id)?.gems ?? 0}+1` : undefined} />, can: pileLeft(you) > 0 })),
  ];
  const rebirthCards: RebirthCard[] = rebirthAsk
    ? [
        ...you.reserve.map((held, index): RebirthCard => {
          const card = monsterCard(held.id);
          return { pick: `r:${index}`, face: card ? <CardFace monster={card} hand level={held.saved?.level ?? 1} live={reserveLive(held, card)} fake={held.fake} gems={held.toll ? `${card.gems}+1` : undefined} /> : null };
        }),
        ...you.hand.map((id, index): RebirthCard => ({ pick: `s:${index}`, face: <CardFace spellId={id} hand gems={you.tolls?.[index] ? `${spellCard(id)?.gems ?? 0}+1` : undefined} /> })),
      ]
    : [];
  const pinnedLine = pinnedId === null ? null : trailDots.find((dot) => dot.id === pinnedId)?.text ?? null;
  // While the icons show, a notice of one of them shows only when it is tapped; anything else is a prompt to the
  // player (a wrong move, a pick to make) and shows by itself for a few seconds (chủ game 23/10).
  const lineText = pinnedLine ?? (toast && !chain.some((orb) => orb.notice === toast) ? toast : "");
  const fuseHeld = fuseShow ? you.reserve[fuseShow.index] : undefined;
  const fusePartner = fuseShow ? you.field.find((mon) => mon?.uid === fuseShow.uid) ?? null : null;
  const fuseThird = fuseShow?.third ? you.field.find((mon) => mon?.uid === fuseShow.third) ?? null : null;
  const fuseBorn = fuseShow ? previewMon(duel, viewer, { id: fuseShow.resultId, hp: monsterCard(fuseShow.resultId)?.hp ?? 1, maxHp: monsterCard(fuseShow.resultId)?.hp ?? 1 }) : null;
  // Dung hợp xong thì phải triệu hồi quái mới (chủ game 28/10): bảng không đóng được, nút Triệu hồi hiện mũi tên chọn hàng.
  const fuseRows = fuseShow?.phase === "reveal" || fuseShow?.phase === "rows" ? { front: rowSlot("front", fuseAt(fuseShow)), back: rowSlot("back", fuseAt(fuseShow)) } : null;
  /** Dung hợp xong (chủ game 13/11): xem bảng của quái mới (reveal), bấm ra ngoài thì chọn hàng trên / dưới (rows), rồi đáp xuống ô. */
  const fuseLand = (row: SummonRow) => {
    if (!fuseShow || !fuseRows) return;
    const slot = row === "front" ? fuseRows.front : fuseRows.back;
    if (slot === null) return;
    const at = boardSpot(document.querySelector(`[data-slot="${viewer}-${slot}"]`), fuseShow.at);
    const show = { ...fuseShow, slot, at };
    setFuseShow({ ...show, phase: "land" });
    // Lightning strikes the slot as the fused monster lands, with its thunder.
    playCue("boltPrep", 0.35);
    window.setTimeout(() => {
      apply(fuseAt(show)(show.slot));
      setFuseShow(null);
      emitFx({ t: "rite", x: show.at.x, y: show.at.y, kind: "fuse" });
      emitFx({ t: "bolt", rank: "big", x: show.at.x, y: show.at.y });
      playCue("boltBoom");
      window.setTimeout(() => {
        emitFx({ t: "bolt", rank: "small", x: show.at.x - 7, y: show.at.y - 2 });
        emitFx({ t: "bolt", rank: "small", x: show.at.x + 7, y: show.at.y + 1 });
        playCue("boltSmall");
      }, 260);
    }, 750);
  };
  const fuseCard = fuseShow ? monsterCard(fuseShow.resultId) : undefined;
  const fusePeek: PeekInfo | null =
    fuseShow?.phase === "reveal" && fuseBorn && fuseCard
      ? { name: fieldName(fuseBorn), cardId: fuseCard.id, stars: fuseCard.stars, stats: { atk: fuseCard.atk, def: fuseCard.def, mdef: fuseCard.mdef, hp: fuseCard.hp }, skills: skillsOf(fuseCard.id, fuseCard.skill ?? "") }
      : null;

  return (
    <main className={`stage is-play${replay ? " is-replay" : ""}${countBlink ? " count-blink" : ""}`} data-cut={cut.top > 0 ? "" : undefined}>
      <GlyphDefs />
      <DrawFlights flights={flights} onDone={flightDone} />
      {burns.map((item) => (
        <CardBurn key={item.id} rect={item.rect} onDone={() => setBurns((list) => list.filter((row) => row.id !== item.id))}>
          {item.face}
        </CardBurn>
      ))}
      {watch ? (
        <>
          <div className="watch-shield" aria-hidden="true" />
          {replay && rpShow ? (
            <ReplayBar
              pos={rpPos}
              onMove={setRpPos}
              at={replay.at}
              total={replay.book.length}
              round={duel.clock ?? 1}
              playing={replay.playing}
              speed={replay.speed}
              onSeek={(at) => seekReplay(at, false)}
              onStep={(by) => seekReplay(replay.at + by, false)}
              onPlay={() => {
                if (replay.at >= replay.book.length - 1) seekReplay(0, true);
                else setReplay({ ...replay, playing: !replay.playing });
              }}
              onSpeed={() => setReplay({ ...replay, speed: replay.speed === 1 ? 2 : replay.speed === 2 ? 4 : 1 })}
              onExit={leaveReplay}
            />
          ) : (
          <div className="watch-bar">
            <span>
              {tr(duel.winner !== null || watch.over ? "Trận đã kết thúc." : "Đang xem trận của")} {duel.winner !== null || watch.over ? null : <b>{tr(PLAYER_NAME)} {watch.friend}</b>}
            </span>
            <button type="button" className="fr-btn" onClick={leaveWatch}>
              {tr("Thoát")}
            </button>
          </div>
          )}
        </>
      ) : null}
      {loaded || tutorial || trial ? null : <LoadScreen kind="match" title={tutorial ? "Đang chuẩn bị trận hướng dẫn" : "Đang chuẩn bị trận đấu"} jobs={() => matchJobs(duel)} onDone={() => setLoaded(true)} face={loadFace} />}
      {loaded && duel.opener && !introSeen ? <MatchIntro top={introSide(viewer === 0 ? 1 : 0)} bottom={introSide(viewer)} onDone={() => setIntroMid(duel.mid ?? "")} /> : null}
      {openerOpen ? (
        <OpenerPanel
          cards={openerCards}
          first={duel.turn === viewer}
          ready={!duel.opener}
          startWaiting={Boolean(duel.opener?.done[viewer])}
          onConfirm={confirmOpener}
          onClosed={() => setOpenerOpen(false)}
        />
      ) : null}
      {reviveAsk && duel.players[viewer].hand[reviveAsk.index] === REVIVE_CARD && reviveReady(duel, viewer) ? (
        <PickPanel
          key={`revive:${reviveAsk.index}`}
          title="Hồi sinh quái thú"
          sub="Chọn 1 quái thú trong mộ"
          cards={reviveChoices(duel, duel.step === "respond").map((row): PickCard => {
            const card = monsterCard(row.cardId);
            return {
              key: `${row.from}|${row.cardId}`,
              face: (
                <>
                  {card ? <CardFace monster={card} hand /> : null}
                  <span className="pk-tag">{tr(row.from === viewer ? "Mộ của bạn" : "Mộ đối thủ")}</span>
                </>
              ),
            };
          })}
          onCancel={() => setReviveAsk(null)}
          onTimeout={() => setReviveAsk(null)}
          onConfirm={(key) => {
            const [from, cardId] = key.split("|");
            const index = reviveAsk.index;
            setReviveAsk(null);
            apply(castSpell(duel, index, null, false, reviveCode({ from: Number(from) as Side, cardId: cardId!, slot: null })));
          }}
        />
      ) : null}
      {prismAsk && duel.players[viewer].hand[prismAsk.index] === PRISM_CARD && prismPicks(duel, viewer).length ? (
        <PickPanel
          key={`prism:${prismAsk.index}`}
          title="Kính vạn hoa"
          sub="Chọn quái để sao chép, hoặc rút Harpie Lady"
          cards={prismPicks(duel, viewer).map((pick): PickCard => {
            const mon = pick === PRISM_DRAW ? null : duel.players[viewer].field.find((unit) => unit?.uid === pick) ?? null;
            const base = mon ? prismBase(mon) : "my-dieu-nhan";
            const card = base ? monsterCard(base) : null;
            return {
              key: pick,
              face: (
                <>
                  {card ? <CardFace monster={card} hand live={pick === PRISM_DRAW || !base ? undefined : reserveLive({ id: base, hp: 1, fake: mon?.fake }, card)} /> : null}
                  <span className="pk-tag">{tr(pick === PRISM_DRAW ? "Rút từ bộ bài" : "Bản sao 1 máu")}</span>
                </>
              ),
            };
          })}
          onCancel={() => setPrismAsk(null)}
          onTimeout={() => setPrismAsk(null)}
          onConfirm={(key) => {
            const index = prismAsk.index;
            setPrismAsk(null);
            apply(castSpell(duel, index, key));
          }}
        />
      ) : null}
      {trimAsk && (trimAsk.side === viewer || duel.mode === "net") ? (
        <PickPanel
          key={`trim:${trimAsk.side}:${duel.clock ?? 1}`}
          mine={trimAsk.side === viewer}
          title="Tay quá 7 lá"
          sub={`Chọn ${trimAsk.n} lá để bỏ`}
          need={trimAsk.n}
          cards={trimCards}
          onConfirm={(pick) => apply(answerTrim(duel, [pick]))}
          onPicks={(picks) => apply(answerTrim(duel, picks))}
          onTimeout={() => apply(answerTrim(duel, null))}
        />
      ) : null}
      {wileAsk && (wileAsk.side === viewer || duel.mode === "net") ? (
        <PickPanel
          key={`wile:${wileAsk.uid}:${duel.clock ?? 1}`}
          mine={wileAsk.side === viewer}
          title="Giảo hoạt"
          sub="Chọn 1 lá phép của Harpie Lady"
          cards={wileAsk.picks.map((pick): PickCard => ({ key: pick, face: <CardFace spellId={WILE_CARDS[pick as keyof typeof WILE_CARDS]} hand /> }))}
          onConfirm={(pick) => apply(answerWile(duel, pick))}
          onTimeout={() => apply(answerWile(duel, null))}
        />
      ) : null}
      {rhinoAsk && rhinoCard && (rhinoAsk.side === viewer || duel.mode === "net") ? (
        <PickPanel
          key={`rhino:${rhinoAsk.uid}:${rhinoAsk.level}`}
          mine={rhinoAsk.side === viewer}
          foeSees
          preset="form"
          title="Tiến hoá"
          sub={`${rhinoCard.name} · ${rhinoMon?.row === "back" && rhinoAsk.slot >= 3 ? "Đứng hàng sau" : "Lên hàng trước"}`}
          foeSub={`${rhinoCard.name} tiến hoá…`}
          cards={[{ key: "form", face: <CardFace monster={rhinoCard} hand /> }]}
          onConfirm={() => apply(answerRhino(duel))}
          onTimeout={() => apply(answerRhino(duel))}
        />
      ) : null}
      {rebirthAsk && duel.step === "main" && duel.turn === viewer ? (
        <RebirthPanel
          cards={rebirthCards}
          onCancel={() => setRebirthAsk(null)}
          onConfirm={(pick) => {
            const uid = rebirthAsk;
            setRebirthAsk(null);
            apply(useSkill(duel, uid, null, 0, false, pick));
          }}
        />
      ) : null}
      {trial && duel ? (
        <div className="ap-trial">
          <b>{tr(trialLevels(trial.id)[trial.level]?.title ?? "")}</b>
          <span>{tr(trialLevels(trial.id)[trial.level]?.goal ?? "")}</span>
          {verdict ? (
            <div className="ap-result">
              <h3>{tr(verdict === "pass" ? "Hoàn thành!" : "Chưa đạt")}</h3>
              {verdict === "pass" && trialPaid ? <p>{tr("Đã hoàn thành cả hai phần: nhận ★2")}</p> : null}
              <p>{tr(verdict === "pass" ? "" : trialLevels(trial.id)[trial.level]?.hint ?? "")}</p>
              {verdict === "fail" ? (
                <button type="button" onClick={() => setDuel(createTrialDuel(trial.id, trial.level))}>
                  {tr("Thử lại")}
                </button>
              ) : null}
              <button type="button" onClick={leaveTutorial}>
                {tr("Thoát")}
              </button>
            </div>
          ) : (
            <button type="button" className="ap-quit" onClick={leaveTutorial}>
              {tr("Bỏ qua")}
            </button>
          )}
        </div>
      ) : null}
      {loaded && tutorial ? (
        <Tutorial
          duel={duel}
          viewer={viewer}
          hand={hand}
          setHand={setHand}
          onView={setTutView}
          drive={(run) =>
            setDuel((current) => {
              if (!current) return current;
              const next = run(current);
              if (next === current) return current;
              if (next.live !== current.live) holdNotice(next.live, false, next.clock);
              return next;
            })
          }
          onSkip={leaveTutorial}
          onDone={() => {
            markTutorialDone();
            leaveTutorial();
          }}
        />
      ) : null}
      <section
        className={`board${shake ? " is-shaking" : ""}${fuseShow ? " is-fusing" : ""}${drag?.kind === "spell" && !spellAimOf(drag.spellId) && spellDragLive(drag.spellId, duel, viewer, drag.index) ? " is-aiming" : ""}`}
        aria-label="Bàn đấu"
        style={{ "--board-ratio": boardRatio(cut), "--alert-size": `${loadAlertLook().glow}px`, "--alert-border": `${loadAlertLook().border}px`, ...(askAt ? { "--ask-x": `${askAt.x}%`, "--ask-y": `${askAt.y}%`, "--ask-bottom": "auto" } : {}) } as CSSProperties}
        onPointerDownCapture={(event) => {
          // A drag that ended on the field leaves no click behind; a fresh touch must not be swallowed for it.
          suppressClick.current = false;
          if (dropMenu && !(event.target as HTMLElement).closest(".unit-acts")) {
            setDropMenu(null);
            setSnap(null);
          }
          helplessTap(Boolean(inspect) || Boolean((event.target as HTMLElement).closest(".face-pile")));
          startPress(event);
          // A touch anywhere but the hand puts the picked card back.
          if (!(event.target as HTMLElement).closest(".hand, .hand-acts, .row-arrows, .hand-peek, .hand-arrow, .stage-back, .msheet-back")) setHandPick(null);
        }}
        onPointerDown={graspAsk}
        onPointerMove={dragAsk}
        onPointerUp={dropAsk}
        onPointerCancel={dropAsk}
      >
        <div className="diorama">
        <BoardArt src={artTop} bottom={artBottom} cut={cut} />
        {hasEnvField(foe.env) && <EnvField key={`t-${foe.env}`} env={foe.env as string} half="top" board={cut.id} />}
        {hasEnvField(you.env) && <EnvField key={`b-${you.env}`} env={you.env as string} half="bot" board={cut.id} />}
        <TurnLight side={duel.winner !== null ? null : actor === viewer ? "you" : "foe"} geo={tankGeo} cue={turnCue} />
        {(() => {
          // Tay đối thủ (chủ game 28/10): lá úp xoè trong khay để bài (băng rôn đỏ ở chính giữa trên cùng), nhìn là thấy
          // bao nhiêu lá; số lá trên tay là ô số foeReserve ở chính giữa khay, nên dải lá đi theo ô số đó.
          const count = foe.reserve.length + foe.hand.length;
          if (count === 0) return null;
          const shown = Math.min(FOE_FAN.most, count);
          const at = marks.foeReserve;
          // Xem lại trận (chủ game 31/10): lật hết bài hai bên, tay đối thủ hiện hình lá thật.
          const faces = replay ? [...foe.reserve.map((mon) => artSrc(mon.id)), ...foe.hand.map((id) => spellSrc(id))] : null;
          return (
            <div className={`foe-fan${faces ? " is-open" : ""}`} aria-label={`${count} ${tr("lá trên tay")}`} style={{ left: `${at.x}%`, top: `${at.y - rh(FOE_FAN.lift)}%` }}>
              {Array.from({ length: shown }, (_, i) => {
                const k = i - (shown - 1) / 2;
                return <img key={i} src={faces?.[i] || "/ui/card-back-foe.webp"} alt="" draggable={false} style={{ transform: `translateX(calc(${k * FOE_FAN.gap} * var(--cqw))) translateY(calc(${k * k * FOE_FAN.drop} * var(--cqw))) rotate(${k * FOE_FAN.turn}deg)` }} />;
              })}
            </div>
          );
        })()}
        {(() => {
          // Kiếm cánh + khiên (video chủ game, 30/10): chỉ ở bên đang giữ token tấn công của vòng; đổi bên thì bên cũ mờ tắt,
          // bên mới chạy hiệu ứng. Chưa hiện khi còn màn tải, màn VS hay đổi bài đầu trận.
          const holder = duel.round ?? duel.turn;
          const box = (spot: typeof board.youAtk) => (spot.hidden ? null : (pinBox(spot) as CSSProperties));
          return <AttackEmblem current={duel.winner !== null || !(loaded || tutorial || trial) || duel.opener ? null : holder === viewer ? "you" : "foe"} boxes={{ you: box(board.youAtk), foe: box(board.foeAtk) }} />;
        })()}
        {[
          { id: you.env, spot: board.env, key: "you-env" },
          { id: foe.env, spot: board.envFoe, key: "foe-env" },
        ].map(({ id, spot, key }) => {
          if (!id || spot.hidden) return null;
          const card = spellCard(id);
          if (!card) return null;
          return (
            <button
              key={key}
              type="button"
              className="env-card"
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.width}%`, height: `${spot.height}%` }}
              onClick={() => setInspect({ pile: "env", id })}
            >
              <img src={spellSrc(id)} alt="" draggable={false} />
              <span style={{ fontSize: `calc(${spot.size} * var(--cqmin))` }}>{card.name}</span>
            </button>
          );
        })}
        {markId ? (
          <AimMark
            bare={Boolean(swapAsk)}
            spellId={markId}
            text={spellBrief(duel, markId, viewer).split("\n").slice(1).join("\n")}
            y={ry(51)}
            onDrop={(x, y) => {
              // Kéo icon về tay là thôi dùng (lá vẫn trên tay).
              const hand = document.querySelector(".hand")?.getBoundingClientRect();
              if (hand && y >= hand.top && x >= hand.left && x <= hand.right) {
                if (swapAsk) cancelQueue();
                else setAim(null);
              }
            }}
          />
        ) : null}
        {([viewer, otherSide] as Side[]).flatMap((side) =>
          wallCards(side).map((wall) => (
            <button
              key={`wall-${side}-${wall.id}`}
              type="button"
              className={`wall-card${side === otherSide && shelling() && aim?.kind === "skill" && !aim.also ? " is-shell" : ""}`}
              style={{ left: `${wall.x}%`, top: `${wall.y}%`, width: `${wall.w}%`, height: `${wall.h}%` }}
              onClick={() => {
                // Pháo kích chọn lá tường thành của đối thủ làm mục tiêu.
                if (side === otherSide && shelling() && aim?.kind === "skill" && !aim.also) {
                  shellTap("wall", otherSide);
                  return;
                }
                setInspect({ pile: "env", id: wall.id });
              }}
              aria-label={`${spellCard(wall.id)?.name ?? ""}: còn ${wall.left} lượt`}
            >
              <img src={spellSrc(wall.id)} alt="" draggable={false} />
              <b>{wall.left}</b>
            </button>
          )),
        )}
        {duel.mode === "test" ? (
          <div className="test-tools">
            <button
              type="button"
              className={`test-btn press${canTestReset(duel) ? "" : " is-dim"}`}
              onPointerDown={armReset}
              onPointerUp={releaseReset}
              onPointerCancel={cancelReset}
              onContextMenu={(event) => event.preventDefault()}
            >
              Reset
            </button>
            <button type="button" className="test-btn press" onClick={() => setTestOpen(true)}>
              Test
            </button>
            <button type="button" className="test-btn press" disabled={testPast.length === 0} onClick={undoTest}>
              Trở về
            </button>
          </div>
        ) : null}
        {board.stack.hidden || marks.foeHand.hidden ? null : (
          <div className="foe-pile" style={{ left: `${marks.foeHand.x}%`, top: `${marks.foeHand.y}%`, width: `${board.stack.width}%`, height: `${board.stack.height}%`, fontSize: `calc(${board.stack.size} * var(--cqmin))` }}>
            <DeckPile count={pileLeft(foe)} side="foe" shuffle={shuf.foe} />
          </div>
        )}
        {/* Nút ba gạch (chủ game 14/11): mở bảng Lịch sử + Cài đặt; đứng ngay dưới bộ bài địch, về phía giữa sân. Thay nút
            Menu và Cài đặt ở hai góc trên (Về menu chính và Đầu hàng nằm trong tab Cài đặt của bảng). */}
        <button
          type="button"
          className="log-btn press"
          style={boardCut().id === "b" ? { left: `${marks.foeStars.x + 4.5}%`, top: "37.6%" } : { left: `${marks.foeHand.x}%`, top: "36.2%" }}
          aria-label={tr("Lịch sử và cài đặt")}
          onClick={() => (playUi("select"), setHelp(true))}
        >
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="log-btn-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff3c4" />
                <stop offset="0.45" stopColor="#f0c860" />
                <stop offset="1" stopColor="#9a6a1c" />
              </linearGradient>
              <radialGradient id="log-btn-core" cx="0.5" cy="0.35" r="0.75">
                <stop offset="0" stopColor="#27406e" />
                <stop offset="0.6" stopColor="#101c38" />
                <stop offset="1" stopColor="#060b18" />
              </radialGradient>
            </defs>
            <path d="M24 2 L42 12 L46 24 L42 36 L24 46 L6 36 L2 24 L6 12 Z" fill="url(#log-btn-core)" stroke="url(#log-btn-gold)" strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M24 6.5 L39 14.6 L42 24 L39 33.4 L24 41.5 L9 33.4 L6 24 L9 14.6 Z" fill="none" stroke="#f0c860" strokeOpacity="0.35" strokeWidth="1" />
            <g fill="url(#log-btn-gold)">
              <path d="M13 15.6 L35 15.6 L37 17.5 L35 19.4 L13 19.4 L11 17.5 Z" />
              <path d="M13 22.1 L35 22.1 L37 24 L35 25.9 L13 25.9 L11 24 Z" />
              <path d="M13 28.6 L35 28.6 L37 30.5 L35 32.4 L13 32.4 L11 30.5 Z" />
            </g>
          </svg>
        </button>
        {marksView.map(([key, value]) => {
          const orbKey = key === "youOrb" || key === "foeOrb";
          const flaskKey = key === "youFlask" || key === "foeFlask";
          const starKey = key === "youStars" || key === "foeStars";
          const gemKey = key === "youGems" || key === "foeGems";
          const gemOwner = key.startsWith("you") ? you : foe;
          if (gemKey && gemOwner.stars >= 4) return null;
          const always = orbKey || starKey || Boolean(tutView?.show?.includes(key));
          // Số xấp địch nay nằm dưới xấp (DeckPile); số tay bài địch luôn hiện (chủ game 01/11).
          if (key === "foeHand" || (key === "foeReserve" && !tutView?.show?.includes(key))) return null;
          if (marks[key].hidden || (value === 0 && !always)) return null;
          const sideOrb = key.startsWith("you") ? tutView?.youOrb ?? you.orb : tutView?.foeOrb ?? foe.orb;
          const starLit = starFlash !== null && ((starFlash === viewer && key === "youStars") || (starFlash !== viewer && key === "foeStars"));
          const color = orbKey
            ? value >= 3
              ? "#ff4d4d"
              : value === 2
                ? "#ff8a00"
                : value === 1
                  ? "#3ec6ff"
                  : "#fff"
            : flaskKey && sideOrb >= 3
              ? "#ff4d4d"
              : starLit
                ? "#ff8a00"
                : undefined;
          // Con mắt: a player's health after the queue goes through, red when it falls, green when it rises.
          const hpSide = key === "youHp" ? viewer : key === "foeHp" ? otherSide : null;
          const seen = hpSide !== null && sight ? sight.hp[hpSide] : null;
          const shift = seen !== null && hpSide !== null ? seen - duel.players[hpSide].hp : 0;
          return (
            <div key={key} data-tut={key} onClick={(key === "youGems" || key === "youStars") && !tutorial && !replay ? starGapHint : undefined} className={`mark${(key === "youGems" || key === "youStars") && !tutorial && !replay ? " is-tap" : ""}${orbKey ? " is-orb" : ""}${starLit ? " is-star" : ""}${drainBlink && (key === (drainBlink.side === viewer ? "youOrb" : "foeOrb") ? drainBlink.orb : key === (drainBlink.side === viewer ? "youGems" : "foeGems") ? drainBlink.gems : false) ? " is-drain" : ""}${COUNT_MARKS.includes(key) ? " is-count" : ""}${shift < 0 ? " is-loss" : shift > 0 ? " is-gain" : ""}`} style={{ left: `${marks[key].x}%`, top: `${marks[key].y}%`, fontSize: `calc(${marks[key].size * markScale(key)} * var(--cqmin))`, color: shift ? undefined : color }}>
              <b>{shift ? seen : value}</b>
            </div>
          );
        })}
        {/* Chấm lịch sử và bảng thông báo ẩn hẳn trong trận (chủ game 01/11); Hướng dẫn và Thực chiến còn chỉ vào bảng nên giữ. */}
        {board.trail.hidden || !(tutorial || trial) ? null : (
          <div
            className="notice-trail"
            style={{
              left: `${board.trail.x}%`,
              top: `${board.trail.y}%`,
              width: `${board.trail.w}%`,
              height: `${board.trail.h}%`,
              ["--dot" as string]: board.trail.dot / 1.6,
            } as CSSProperties}
          >
            {Array.from({ length: trailSlots }, (_, slot) => {
              const history = trailDots.slice(-trailSlots);
              const dot = history[slot - (trailSlots - history.length)];
              if (!dot) return <span key={`empty-${slot}`} className="trail-slot" />;
              const prev = history[slot - (trailSlots - history.length) - 1];
              return (
                <span key={dot.id} className="trail-slot">
                  {prev && prev.clock !== dot.clock ? <i className="trail-gap" /> : null}
                  <button
                    type="button"
                    className={`trail-dot${pinnedId === dot.id ? " is-on" : ""}`}
                    aria-label="Xem lại thông báo"
                    style={{
                      color: TRAIL_INK[dot.ink],
                      boxShadow: `0 0 ${board.trail.glow}px ${board.trail.glow * 0.2}px ${TRAIL_INK[dot.ink]}`,
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setPinnedId((current) => (current === dot.id ? null : dot.id));
                    }}
                  />
                </span>
              );
            })}
          </div>
        )}
        {board.notice.hidden || pinnedId === null ? null : (
          <p
            className={`banner${lineOn ? " is-quiet" : ""}`}
            ref={noticeRef}
            style={{
              left: `${board.notice.x}%`,
              top: `${board.notice.y}%`,
              width: `${board.notice.w}%`,
              height: `${board.notice.h}%`,
              right: "auto",
              fontSize: `calc(${board.notice.font} * var(--cqmin))`,
            }}
            onPointerDown={(event) => {
              const box = event.currentTarget;
              if (box.scrollHeight <= box.clientHeight + 2) return;
              noticePan.current = { id: event.pointerId, y: event.clientY, top: box.scrollTop };
              box.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const pan = noticePan.current;
              if (!pan || pan.id !== event.pointerId) return;
              event.currentTarget.scrollTop = pan.top - (event.clientY - pan.y);
            }}
            onPointerUp={() => {
              noticePan.current = null;
            }}
            onPointerCancel={() => {
              noticePan.current = null;
            }}
          >
            <span className="banner-copy">
              <span className="banner-body">
                {(() => {
                  const pinned = pinnedId === null ? null : trailDots.find((dot) => dot.id === pinnedId);
                  const bannerText = pinned?.text ?? toast;
                  return bannerText ? <NoticeText text={veilNotice(spoken(bannerText, viewer), duel, viewer)} /> : duel.turn === viewer ? tr("Kéo lá lên ô. Bấm lá để xem kỹ năng.") : tr("Đợi đối thủ.");
                })()}
              </span>
            </span>
          </p>
        )}
        {hint ? (
          <HintCard targets={hint.targets} onClose={() => setHint(null)}>
            {hint.body}
          </HintCard>
        ) : null}
        {lineOn ? (
          <ReactionLine
            orbs={chain}
            closing={!responding}
            spots={iconSpots}
            mid={ry(51)}
            endOf={flowEnd}
            lookOf={iconLook}
            noteOf={iconNote}
            hint={responding && lineText ? <NoticeText text={veilNotice(spoken(lineText, viewer), duel, viewer)} /> : null}
            hintKey={`${pinnedId ?? ""}:${lineText}`}
            hintPinned={pinnedLine !== null}
            cardOf={orbCard}
            onSheet={openIcon}
            onClosed={() => setChain((list) => (list.every((orb) => orb.done) ? [] : list))}
            cracked={peekIcons?.cracked}
            aimless={peekIcons?.aimless}
            forkOf={forkFor}
            throwFrom={throwFrom}
            besideFree={besideFree}
            rouseLate={tutorial ? 0 : ROUSE_CAST / 1000}
          />
        ) : null}
        {askUpkeep && upkeepUnit && !gemHold ? (
          <div className="overlay is-ask">
            <div className="ask-card is-keep">
              <button type="button" onClick={() => apply(answerUpkeep(duel, true))}>
                {angelUpkeep ? "Cầu nguyện" : "Duy trì"}
              </button>
              <button type="button" onClick={() => apply(answerUpkeep(duel, false))}>
                Rời sân
              </button>
            </div>
          </div>
        ) : null}
        {vowAsk && mine ? (() => {
          const held = you.reserve[vowAsk.index];
          const cap = vowCap(held?.id ?? "", held?.saved?.level ?? 1);
          const close = () => {
            setVowAsk(null);
            setRiteHand(null);
          };
          // Từ lá đưa ra giữa sân (chủ game 13/11): chọn xong quân tế thì về lại lá đó để chọn hàng trên / dưới.
          const staged = Boolean(vowAsk.stage);
          // Dropped on a slot: it lands there. From the Hiến tế button: chọn quân tế trước, rồi mũi tên chọn hàng (chủ game 28/10).
          const picks = vowAsk.picks;
          const fixed = vowAsk.slot;
          const offer = vowAt(vowAsk.index, picks);
          const front = fixed === null && picks.length ? rowSlot("front", offer) : null;
          const back = fixed === null && picks.length ? rowSlot("back", offer) : null;
          const first = fixed ?? front ?? back;
          const trial = picks.length && first !== null ? summonVow(duel, vowAsk.index, first, picks) : null;
          const ready = Boolean(trial && took(trial));
          const go = (slot: Slot) => {
            apply(summonVow(duel, vowAsk.index, slot, picks));
            close();
          };
          return (
            <div className="msheet-back is-vow" onClick={(event) => event.target === event.currentTarget && close()}>
              <GlyphDefs />
              <div className="vow3d" role="dialog">
                <p className="vow3d-title">
                  <CopyText text={`Hãy chọn các quái thú mà bạn muốn **Hiến tế** để **Triệu hồi**.\nTối đa là **${cap}**`} />
                </p>
                <div className="vow3d-list">
                  {you.field.map((mon) => {
                    if (!mon || mon.hp <= 0) return null;
                    const on = vowAsk.picks.includes(mon.uid);
                    return (
                      <button
                        key={mon.uid}
                        type="button"
                        className={`vow3d-pick${on ? " on" : ""}`}
                        onClick={() =>
                          setVowAsk((current) => {
                            if (!current) return current;
                            if (current.picks.includes(mon.uid)) return { ...current, picks: current.picks.filter((uid) => uid !== mon.uid) };
                            const picks = current.picks.length >= cap ? [...current.picks.slice(1), mon.uid] : [...current.picks, mon.uid];
                            return { ...current, picks };
                          })
                        }
                      >
                        <SheetCard mon={mon} allies={you.field} layout={fieldLayout} />
                        <span className="vow3d-name">{tr(fieldName(mon))}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="vow3d-actions">
                  {ready ? (
                    <ActionButton
                      mini
                      action={{
                        key: "vow",
                        label: staged ? "Hiến tế" : "Triệu hồi",
                        tone: "red",
                        cost: trial ? cost(trial) : 0,
                        ...(staged
                          ? {
                              onPress: () => {
                                setStage((now) => (now ? { ...now, mode: "rows", picks, ...(now.id === CLOCK ? { clock: { hide: false, form: null } } : {}) } : now));
                                close();
                              },
                            }
                          : fixed === null
                          ? {
                              rows: {
                                front: front !== null,
                                back: back !== null,
                                advice: advisedRow(held.id),
                                onRow: (row: SummonRow) => {
                                  const slot = row === "front" ? front : back;
                                  if (slot !== null) go(slot);
                                },
                              },
                            }
                          : { onPress: () => go(fixed) }),
                      }}
                    />
                  ) : null}
                  <button type="button" className="vow3d-no" onClick={close}>
                    {tr("Không")}
                  </button>
                </div>
              </div>
            </div>
          );
        })() : null}
        {mine && duel.gemCap === viewer && duel.turn === viewer ? (
          <div className="overlay is-ask">
            <div className="ask-card is-mana">
              <p>{tr("Bạn đã đạt đến mức gem giới hạn, có đồng ý giải phóng cầu ma lực 3 mana đổi lấy 2 mana triệu hồi hay không?")}</p>
              <button type="button" onClick={() => apply(answerGemCap(duel, true))}>
                {tr("OK")}
              </button>
              <button type="button" onClick={() => apply(answerGemCap(duel, false))}>
                {tr("Không")}
              </button>
            </div>
          </div>
        ) : null}
        {mine && duel.gemWarn === viewer && duel.turn === viewer && duel.gemCap !== viewer ? (
          <div className="overlay is-ask">
            <div className="ask-card is-mana">
              <p>{tr('Bạn chỉ được dùng "Giải phóng ma lực" 1 lần trong mỗi trận đấu. Hãy cẩn thận với lượng ma lực đang quá tải của mình.')}</p>
              <button type="button" onClick={() => apply(answerGemWarn(duel))}>
                {tr("OK")}
              </button>
            </div>
          </div>
        ) : null}
        {duel.reel ? (
          <SlotMachine
            faces={duel.reel.faces}
            phase={duel.reel.phase}
            kind={duel.reel.kind ?? "prize"}
            order={duel.reel.order ?? null}
            canPull={Boolean(canPlay && duel.players[duel.turn].field.some((unit) => unit?.uid === duel.reel?.uid))}
            onPull={() => apply(pullReel(duel))}
            onDone={() => {
              if (duel.mode === "net" && !canPlay) return;
              apply(settleReel(duel));
            }}
          />
        ) : null}
        {mine && aim?.kind === "spell" && aim.spellId === DUO_CARD && aim.duo?.ask && aim.from ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>
                <b>Chọn đòn</b>
              </p>
              {duoActs(aim.duo.ask, aim.from).map((one) => (
                <button key={String(one.act)} type="button" onClick={() => duoPick(one.act)}>
                  {one.label}
                </button>
              ))}
              <button type="button" onClick={() => setAim({ ...aim, duo: { picks: aim.duo?.picks ?? [] } })}>
                Quay lại
              </button>
            </div>
          </div>
        ) : null}
        {mine && aim?.kind === "tide" ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{askLabel("trai-tim-hai-long", "tide")}</p>
              {duel.counterAsk?.uid === aim.uid ? null : (
                <>
                  <button type="button" disabled={you.orb < tideCost(0)} onClick={() => setAim({ kind: "skill", uid: aim.uid, index: 1 })}>
                    {askLabel("trai-tim-hai-long", "surge")}
                  </button>
                  <button
                    type="button"
                    disabled={you.orb < tideCost(1)}
                    onClick={() => {
                      setAim({ kind: "skill", uid: aim.uid, index: 2 });
                    }}
                  >
                    {askLabel("trai-tim-hai-long", "doom")}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setAim({ kind: "skill", uid: aim.uid, index: 0 });
                  holdNotice("Chọn một kẻ địch.");
                }}
              >
                Không
              </button>
            </div>
          </div>
        ) : null}
        {duel.lurkAsk && duel.lurkAsk.side === viewer && !replay
          ? (() => {
              const choices = lurkChoices(duel, viewer);
              if (choices.length === 0) {
                return (
                  <button type="button" className="lurk-back" onClick={() => apply(answerLurk(duel, null))}>
                    <p className="lurk-none">{tr("Không có quái ẩn trên tay để thay thế")}</p>
                  </button>
                );
              }
              return (
                <div className="lurk-back">
                  <div className="lurk-panel">
                    <h3>{tr("Triệu hồi phản ứng 1 quái ẩn")}</h3>
                    <div className="lurk-grid">
                      {choices.map((row) => {
                        const card = monsterCard(row.id);
                        if (!card) return null;
                        return (
                          <button key={`${row.id}-${row.index}`} type="button" className="lurk-card" disabled={!row.ok} onClick={() => apply(answerLurk(duel, row.index))}>
                            <CardFace monster={card} hand />
                            {row.why ? <small>{tr(row.why)}</small> : null}
                          </button>
                        );
                      })}
                    </div>
                    <button type="button" className="lurk-skip" onClick={() => apply(answerLurk(duel, null))}>
                      {tr("Bỏ qua")}
                    </button>
                  </div>
                </div>
              );
            })()
          : null}
        {duel.recall && duel.recall.side === viewer ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{tr("Chọn quái ra sân. Không vượt sao đã thu:")} {recallLeft(duel.recall.caps, recallPick.map((index) => recallStars(you.reserve[index]))).join(", ")}</p>
              <p>{tr("Quái 4 sao tốn thêm 1 mana.")}</p>
              {you.reserve.map((held, index) => {
                const card = monsterCard(held.id);
                if (!card) return null;
                const on = recallPick.includes(index);
                const stars = recallStars(held);
                const trial = on ? recallPick : [...recallPick, index];
                const canAdd = on || (recallPick.length < duel.recall!.caps.length && recallFits(duel.recall!.caps, trial.map((at) => recallStars(you.reserve[at]))));
                const name = held.saved ? fieldName({ cardId: held.id, level: held.saved.level }) : card.name;
                return (
                  <button
                    key={`${held.id}-${index}`}
                    type="button"
                    className={on ? "on" : ""}
                    disabled={!canAdd}
                    onClick={() => setRecallPick((list) => (list.includes(index) ? list.filter((item) => item !== index) : [...list, index]))}
                  >
                    {tr(name)} · {stars} {tr("sao")}{stars === 4 ? ` · ${tr("1 mana")}` : ""}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={(() => {
                  const caps = duel.recall?.caps ?? [];
                  return !recallReady(caps, you.reserve, recallPick, you.orb);
                })()}
                onClick={() => {
                  apply(confirmRecall(duel, recallPick));
                  setRecallPick([]);
                }}
              >
                OK
              </button>
            </div>
          </div>
        ) : null}
        {swapGhost ? <SwapGhost key={swapGhost.key} ghost={swapGhost} onDone={() => setSwapGhost(null)} /> : null}
        {boxShow ? <BoxFx key={boxShow.key} host={boxShow.host} spots={boxShow.spots} onDone={() => setBoxShow(null)} /> : null}
        {reflectPick ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{tr("Chọn kẻ địch để phản đòn, rồi bấm OK.")}</p>
              {(duel.hold ? duel.players[(1 - duel.hold.priority) as Side] : duel.players[duel.turn]).field.map((unit) =>
                unit ? (
                  <button
                    key={unit.uid}
                    type="button"
                    className={reflectPick.uid === unit.uid ? "on" : ""}
                    onClick={() => setReflectPick({ index: reflectPick.index, uid: unit.uid })}
                  >
                    {tr(fieldName(unit))}
                  </button>
                ) : null,
              )}
              <button
                type="button"
                disabled={!reflectPick.uid}
                onClick={() => {
                  const next = castSpell(duel, reflectPick.index, reflectPick.uid);
                  setReflectPick(null);
                  apply(next);
                }}
              >
                OK
              </button>
            </div>
          </div>
        ) : null}
        {riteAsk && you.hand[riteAsk.index] === RITE_CARD && riteDeadFor(duel, viewer).length > 1 ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{tr("Đòn cuối cùng: chọn quái vừa bị hạ để ra đòn cuối.")}</p>
              {riteDeadFor(duel, viewer).map((row) => (
                <button
                  key={row.uid}
                  type="button"
                  onClick={() => {
                    setRiteAsk(null);
                    apply(castSpell(duel, riteAsk.index, null, false, row.uid));
                  }}
                >
                  {tr(monsterCard(row.mon.cardId)?.name ?? row.mon.cardId)}
                </button>
              ))}
              <button type="button" onClick={() => setRiteAsk(null)}>
                {tr("Đóng")}
              </button>
            </div>
          </div>
        ) : null}
        {digPick && you.hand[digPick.index] === "ke-dao-mo" ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{tr("Chọn quái hoặc phép đã rời sân, rồi bấm OK.")}</p>
              <p>{tr("Quái")}</p>
              {digChoices(duel, viewer)
                .filter((row) => row.kind === "monster")
                .map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={digPick.id === row.id ? "on" : ""}
                    onClick={() => setDigPick({ index: digPick.index, id: row.id })}
                  >
                    {tr(monsterCard(row.id)?.name ?? row.id)}
                  </button>
                ))}
              <p>{tr("Phép")}</p>
              {digChoices(duel, viewer)
                .filter((row) => row.kind === "spell")
                .map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={digPick.id === row.id ? "on" : ""}
                    onClick={() => setDigPick({ index: digPick.index, id: row.id })}
                  >
                    {tr(spellCard(row.id)?.name ?? row.id)}
                  </button>
                ))}
              <button
                type="button"
                disabled={!digPick.id}
                onClick={() => {
                  const picked = digPick.id;
                  if (!picked) return;
                  const next = digGrave(duel, digPick.index, picked);
                  setDigPick(null);
                  apply(next);
                }}
              >
                OK
              </button>
              <button type="button" onClick={() => setDigPick(null)}>
                {tr("Đóng")}
              </button>
            </div>
          </div>
        ) : null}
        {ambushPick ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{tr("Đòn đã bị chặn. Chọn quái đánh lại, rồi bấm OK.")}</p>
              {you.field.map((unit) =>
                unit && unit.stun === 0 && (unit.chain ?? 0) === 0 && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai" ? (
                  <button
                    key={unit.uid}
                    type="button"
                    className={ambushPick.uid === unit.uid ? "on" : ""}
                    onClick={() => setAmbushPick({ index: ambushPick.index, uid: unit.uid })}
                  >
                    {tr(fieldName(unit))}
                  </button>
                ) : null,
              )}
              <button
                type="button"
                disabled={!ambushPick.uid}
                onClick={() => {
                  const next = castSpell(duel, ambushPick.index, ambushPick.uid);
                  setAmbushPick(null);
                  apply(next);
                }}
              >
                OK
              </button>
            </div>
          </div>
        ) : null}
        {duel.swordAsk && duel.turn === viewer ? (
          <div className="overlay is-ask">
            <div className="ask-card is-keep">
              <p>{tr(swordAskLine(you.field.find((unit) => unit?.uid === duel.swordAsk?.uid) ?? ({ cardId: "" } as never)))}</p>
              <button type="button" onClick={() => apply(answerSword(duel, true))}>{tr("Dùng Kiếm")}</button>
              <button type="button" onClick={() => apply(answerSword(duel, false))}>{tr("Không")}</button>
            </div>
          </div>
        ) : null}
        {duel.soulAsk && duel.turn === viewer ? (
          <div className="overlay is-ask">
            <div className="ask-card is-keep">
              <p>{tr(soulAskLine(you.field.find((unit) => unit?.uid === duel.soulAsk?.uid) ?? { vows: 0 } as never))}</p>
              <button type="button" onClick={() => apply(answerSoul(duel, true))}>{tr("Hiến tế")}</button>
              <button type="button" onClick={() => apply(answerSoul(duel, false))}>{tr("Không")}</button>
            </div>
          </div>
        ) : null}
        {mine && duel.legs && duel.step === "main" ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{askLabel("ken-ngai", "legs")}</p>
              {[1]
                .filter((count) => you.orb >= 1 && you.field.filter((unit, index) => !unit && (you.locked?.[index] ?? 0) === 0).length >= count)
                .map((count) => (
                  <button key={count} type="button" onClick={() => apply(answerLegs(duel, count))}>
                    {count} chân
                  </button>
                ))}
              <button type="button" onClick={() => apply(answerLegs(duel, 0))}>
                Không
              </button>
            </div>
          </div>
        ) : null}
        {mine && duel.parley && duel.step === "main" && parleyPicker(duel) === viewer ? (
          <div className="ask-card">
            <p>
              {duel.parley.step === "pick-lunger" || duel.parley.step === "pick-lunger2"
                ? tr("Chọn quái của bạn để lao vào.")
                : tr("Chọn quái của bạn để chịu đòn.")}
            </p>
            {duel.parley.kind === "mystic" && duel.parley.step === "pick-victim" ? (
              <button type="button" onClick={() => apply(pickParley(duel, "face"))}>
                {tr("Người chơi")}
              </button>
            ) : null}
            {you.field.map((unit) =>
              unit && unit.hp > 0 && unit.cardId !== "mu" && !(duel.parley?.kind === "mystic" && duel.parley.step === "pick-victim" && unit.uid === duel.parley.queen) ? (
                <button key={unit.uid} type="button" onClick={() => apply(pickParley(duel, unit.uid))}>
                  {tr(fieldName(unit))}
                </button>
              ) : null,
            )}
          </div>
        ) : null}
        {mine && duel.echo && duel.step === "main" ? (
          <div className="ask-card">
            <p>{askLabel("kiem-si-lua-thieng", "echo")}</p>
            {foe.field.map((unit) =>
              unit ? (
                <button key={unit.uid} type="button" onClick={() => apply(swordFollow(duel, unit.uid))}>
                  {tr(fieldName(unit))}
                </button>
              ) : null,
            )}
            <button type="button" onClick={() => apply(swordFollow(duel, null))}>
              Không
            </button>
          </div>
        ) : null}
        {mine && duel.last && !duel.echo && duel.step === "main" ? (
          <div className="ask-card">
            <p>{askLabel("kiem-si-lua-thieng", "last")}</p>
            {foe.field.map((unit) =>
              unit ? (
                <button key={unit.uid} type="button" onClick={() => apply(swordLast(duel, unit.uid))}>
                  {tr(fieldName(unit))}
                </button>
              ) : null,
            )}
            <button type="button" onClick={() => apply(swordLast(duel, null))}>
              Không
            </button>
          </div>
        ) : null}
        {hornAsk ? (
          <div className="ask-card">
            <p>Sấm lôi phá</p>
            <button type="button" className={hornAsk.mode === "splash" ? "on" : ""} onClick={() => setHornAsk({ ...hornAsk, mode: "splash" })}>Lan</button>
            <button type="button" className={hornAsk.mode === "plus" ? "on" : ""} onClick={() => setHornAsk({ ...hornAsk, mode: "plus" })}>+3</button>
            <button
              type="button"
              disabled={!hornAsk.mode}
              onClick={() => {
                const ask = hornAsk;
                if (!ask.mode || !duel) return;
                if (you.orb < 1) {
                  holdNotice("Cần 1 mana.");
                  return;
                }
                setHornAsk(null);
                apply(attackMonster(armHorn(duel, ask.uid, ask.mode), ask.uid, ask.foeUid));
              }}
            >
              OK
            </button>
          </div>
        ) : null}
        {knightAsk || dueKnight ? (
          <KnightPick
            room={(knightAsk ?? dueKnight)!.room}
            onSkip={() => {
              if (knightAsk?.block) apply(assignBlock(primeKnight(duel, knightAsk.uid, []), knightAsk.uid, false));
              else if (dueKnight) apply(primeKnight(duel, dueKnight.uid, []));
              setKnightAsk(null);
            }}
            onPick={(picks) => {
              const ask = knightAsk;
              const uid = (ask ?? dueKnight)!.uid;
              let next = primeKnight(duel, uid, picks);
              if (ask?.block) next = assignBlock(next, uid, false);
              else if (ask?.foeUid) next = attackMonster(next, uid, ask.foeUid);
              apply(next);
              setKnightAsk(null);
            }}
          />
        ) : null}
        {alsoPanel && aim?.kind === "skill" && aim.also ? (
          <div className="ask-card">
            <p>{tr("Chọn mục tiêu tiếp theo")}</p>
            {[...alsoKeys()].map((key) => {
              const [side, slot] = key.split("-").map(Number);
              const mon = duel.players[side as Side]?.field[slot];
              if (!mon) return null;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setAlsoPanel(false);
                    slideFire.current(key);
                  }}
                >
                  {fieldName(mon)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setAlsoPanel(false);
                setAim(null);
              }}
            >
              {tr("Huỷ")}
            </button>
          </div>
        ) : null}
        {lureAsk ? (
          <div className="ask-card">
            <p>Tiến hoá Mê hoặc thành Dụ dỗ? Tốn 2 mana, rồi chọn quái địch và quái của ta.</p>
            <button
              type="button"
              onClick={() => {
                if (you.orb < 2) {
                  holdNotice("Cần 2 mana.");
                  return;
                }
                const uid = lureAsk;
                setLureAsk(null);
                setAim({ kind: "skill", uid, index: 3 });
                holdNotice("Chọn một quái đối thủ.");
              }}
            >
              Tiến hoá
            </button>
            <button
              type="button"
              onClick={() => {
                const uid = lureAsk;
                setLureAsk(null);
                setAim({ kind: "skill", uid, index: 1 });
              }}
            >
              {tr("Không")}
            </button>
          </div>
        ) : null}
        {duel.birdAsk && duel.players[viewer].field.some((mon) => mon?.uid === duel.birdAsk?.uid) ? (
          <div className="ask-card">
            <p>Tiến hoá Harpie Lady thành?</p>
            <button type="button" onClick={() => apply(evolveBird(duel, "cong-chua-dieu-nhan"))}>Công chúa điểu nhân</button>
            <button type="button" onClick={() => apply(evolveBird(duel, "nu-chua-dieu-nhan"))}>Nữ chúa điểu nhân</button>
          </div>
        ) : null}
        {duel.plumeAsk && duel.turn === viewer ? (
          <div className="ask-card">
            <p>Roi điện? Né đòn và trả 5 sát thương phép.</p>
            <button type="button" onClick={() => apply(answerPlume(duel, true))}>Ok</button>
            <button type="button" onClick={() => apply(answerPlume(duel, false))}>{tr("Không")}</button>
          </div>
        ) : null}
        {duel.preyAsk && duel.turn === viewer ? (
          <div className="ask-card">
            <p>Ta là Kẻ săn mồi tử thần, tiêu hao 1 mana, cùng ta tiêu diệt hắn?</p>
            <button type="button" onClick={() => apply(answerPrey(duel, true))}>Ok</button>
            <button type="button" onClick={() => apply(answerPrey(duel, false))}>{tr("Không")}</button>
          </div>
        ) : null}
        {blockChoice ? (
          <div className="ask-card">
            {blockChoice.skill === null ? (
              <>
                <p>{askLabel("chien-si-gam-nham", "block")}</p>
                <button type="button" onClick={() => pickBlock({ skill: false })}>{tr("Chặn thường")}</button>
                <button type="button" onClick={() => pickBlock({ skill: true })}>{tr("Chặn skill")}</button>
              </>
            ) : null}
            {blockChoice.buff === null ? (
              <>
                <p>{askLabel("yeu-tinh-chuc-phuc", "buff")}</p>
                <button type="button" onClick={() => pickBlock({ buff: true })}>Buff</button>
                <button type="button" onClick={() => pickBlock({ buff: false })}>{tr("Không")}</button>
              </>
            ) : null}
          </div>
        ) : null}
        {fuseAsk?.phase === "ask" && fuseResult ? (
          <div className="ask-card">
            <p>{`Hợp nhất ${fuseHandName} và ${fuseFieldName} trở thành ${fuseResult.name}.`}</p>
            <button type="button" onClick={() => setFuseAsk((current) => (current ? { ...current, phase: "fly" } : current))}>Ok</button>
            <button type="button" onClick={() => setFuseAsk(null)}>{tr("Không")}</button>
          </div>
        ) : null}
        {fuseAsk && fuseAsk.phase !== "ask" && fuseResult ? (
          <div className={`fuse-stage is-${fuseAsk.phase}`}>
            {fuseAsk.phase !== "preview" ? (
              <>
                <div className="fuse-card is-a" style={{ "--x": `${fuseAsk.fromHand.x}%`, "--y": `${fuseAsk.fromHand.y}%` } as CSSProperties}>
                  <CardFace monster={monsterCard(fuseAsk.handId)} level={fuseAsk.handLevel} />
                </div>
                <div className="fuse-card is-b" style={{ "--x": `${fuseAsk.fromField.x}%`, "--y": `${fuseAsk.fromField.y}%` } as CSSProperties}>
                  <CardFace monster={monsterCard(fuseAsk.fieldId)} level={fuseAsk.fieldLevel} />
                </div>
                {fuseAsk.phase === "flash" ? <div className="fuse-flash" /> : null}
              </>
            ) : (
              <div className="fuse-preview">
                <div
                  className={`fuse-result${fuseDrag?.moved ? " is-holding" : ""}`}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    fuseHold.current = { x: event.clientX, y: event.clientY, moved: false };
                    setFuseDrag({ x: event.clientX, y: event.clientY, moved: false });
                  }}
                  onPointerMove={(event) => {
                    const start = fuseHold.current;
                    if (!start) return;
                    const moved = start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8;
                    fuseHold.current = { x: start.x, y: start.y, moved };
                    setFuseDrag({ x: event.clientX, y: event.clientY, moved });
                  }}
                  onPointerUp={(event) => {
                    const moved = fuseHold.current?.moved;
                    fuseHold.current = null;
                    setFuseDrag(null);
                    if (moved) dropFuse(event.clientX, event.clientY);
                  }}
                >
                  <CardFace monster={fuseResult} />
                </div>
                <div className="fuse-copy">
                  <strong>{fuseResult.name}</strong>
                  <p>
                    <CopyText text={fuseResult.skill} />
                  </p>
                </div>
                <button type="button" className="act press" onClick={() => placeFuse(fuseAsk.slot)}>Ok</button>
                <p className="fuse-hint">Giữ kéo lá vào ô muốn đặt.</p>
              </div>
            )}
          </div>
        ) : null}
        {fuseDrag?.moved && fuseResult ? (
          <div className="ghost" style={{ left: fuseDrag.x, top: fuseDrag.y }}>
            <CardFace monster={fuseResult} />
          </div>
        ) : null}
        {chronoAsk ? (
          <div className="ask-card">
            <p>{askLabel("phu-thuy-thoi-gian", "boost")}</p>
            <button
              type="button"
              onClick={() => {
                const ask = chronoAsk;
                setChronoAsk(null);
                if (duel && chronoHighAlly(duel, ask.caster, ask.target)) {
                  setChronoWarn(ask);
                  return;
                }
                // It waits in the chain; its wheel turns once the chain is over (chủ game 30/10).
                apply(useSkill(duel, ask.caster, ask.target, 1, true));
              }}
            >
              {tr("Cường hoá")}
            </button>
            {chronoAsk.age ? (
              <button type="button" onClick={() => { const ask = chronoAsk; setChronoAsk(null); apply(useSkill(duel, ask.caster, ask.target, 0, true)); }}>{tr("Lão hoá")}</button>
            ) : null}
            {chronoAsk.pass ? (
              <button type="button" onClick={() => setChronoAsk(null)}>{tr("Không")}</button>
            ) : null}
          </div>
        ) : null}
        {chronoWarn ? (
          <div className="ask-card">
            <p>{tr("Hiệu ứng cường hoá không có tác dụng lên đồng minh thông thường cấp cao, bạn vẫn thi triển chứ.")}</p>
            <button
              type="button"
              onClick={() => {
                const ask = chronoWarn;
                setChronoWarn(null);
                apply(useSkill(duel, ask.caster, ask.target, 1, true));
              }}
            >
              Ok
            </button>
            <button type="button" onClick={() => setChronoWarn(null)}>{tr("Không")}</button>
          </div>
        ) : null}
        {duel.wheel ? (
          <TimeWheel
            key={duel.wheel.id}
            sector={duel.wheel.sector}
            title={duel.wheel.index === 2 ? tr("Dòng chảy thời gian") : tr("Cường hoá")}
            onPull={wheelOwner === viewer && canPlay ? () => apply(pullWheel(duel)) : null}
            onDone={() => {
              // The owner's screen lands it (the machine's too, in Vs Máy); the other only watches.
              if (duel.wheel && (wheelOwner === viewer || duel.mode === "ai")) apply(settleWheel(duel));
            }}
          />
        ) : null}
        {chronoSpin ? (
          <TimeWheel
            sector={chronoSpin.sector}
            title={chronoSpin.index === 2 ? tr("Dòng chảy thời gian") : tr("Cường hoá")}
            onPull={() => setChronoSpin((spin) => (spin && spin.sector === null ? { ...spin, sector: rollTimeSector() } : spin))}
            onDone={() => {
              const spin = chronoSpin;
              if (!spin || spin.sector === null || !duel) {
                setChronoSpin(null);
                return;
              }
              const extra = TIME_HITS[spin.sector] ? "hit" : "miss";
              setChronoSpin(null);
              apply(useSkill(duel, spin.caster, spin.target, spin.index, true, extra));
            }}
          />
        ) : null}
        {([0, 1, 2, 3, 4, 5] as const).map((index) => {
          const plan = targetPlan();
          const side = (viewer === 0 ? 1 : 0) as Side;
          const mon = foe.field[index] ?? null;
          const held = linger.find((item) => item.side === side && item.index === index);
          const shown = mon ?? held?.mon ?? fallenMon(prevDuel.current, duel, side, index);
          const frozen = !mon && Boolean(shown);
          const allyAim = aim?.kind === "skill" && !!selectedCard && allySkill(selectedCard.id);
          const curseStep = aim?.kind === "spell" && aim.spellId === "phan-nguyen" ? (aim.from ? "foe" : "ally") : drag?.kind === "spell" && drag.spellId === "phan-nguyen" ? "ally" : null;
          const witchFoe = aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian";
          const attacking = !!mon && curseStep !== "ally" && (curseStep === "foe" || drag?.kind === "unit" || (drag?.kind === "spell" && drag.spellId !== "sung-loi-pha" && drag.spellId !== "phan-nguyen" && drag.spellId !== "hoan-doi" && drag.spellId !== "ke-dao-mo" && spellDragLive(drag.spellId, duel, viewer, drag.index)) || aim?.kind === "attack" || (aim?.kind === "spell" && aim.spellId !== "phan-nguyen" && aim.spellId !== "sung-loi-pha" && aim.spellId !== "hoan-doi" && aim.spellId !== "ke-dao-mo" && aim.spellId !== "phuc-kich" && aim.spellId !== "qua-trung-thien-su" && aim.spellId !== "ngan-chan-phong-ngu" && aim.spellId !== "hop-ma-thuat" && spellDragLive(aim.spellId, duel, viewer, aim.index)) || (aim?.kind === "spell" && aim.spellId === "ngan-chan-phong-ngu" && shelterPicks(duel).includes(mon.uid)) || (aim?.kind === "spell" && aim.spellId === "hop-ma-thuat" && Boolean(aim.from) && boxFoes(duel, viewer).includes(mon.uid)) || (aim?.kind === "skill" && !allyAim && !(witchFoe && chronoImmortal(mon))));
          const covered =
            !!mon &&
            mon.cardId === "kazura" &&
            foe.field.some((unit) => unit && unit.cardId === "kizuran" && unit.cover && unit.hp > 0 && unit.stun === 0 && (unit.chain ?? 0) === 0);
          const sheltered = !!mon && sanctuaryShielded(duel, mon.uid) && drag?.kind !== "spell" && aim?.kind !== "spell";
          const untouchable = sheltered || (!!mon && mon.cardId === "kazura" && (mon.safe ?? 0) > 0 && !covered && drag?.kind !== "spell" && aim?.kind !== "skill");
          const foeHot = plan ? !!mon && plan.keys.has(`${side}-${index}`) : attacking && !untouchable;
          const foeSpell =
            curseStep === "foe" ||
            (drag?.kind === "spell" && !["sung-loi-pha", "phan-nguyen", "hoan-doi", "ke-dao-mo", "soi-xich-dia-nguc", "huy-diet"].includes(drag.spellId) && spellDragLive(drag.spellId, duel, viewer, drag.index)) ||
            (aim?.kind === "spell" && !["phan-nguyen", "sung-loi-pha", "hoan-doi", "ke-dao-mo", "phuc-kich", "qua-trung-thien-su"].includes(aim.spellId) && (aim.spellId === "ngan-chan-phong-ngu" || (aim.spellId === "hop-ma-thuat" ? Boolean(aim.from) : spellDragLive(aim.spellId, duel, viewer, aim.index))));
          const foeBlocked = !!mon && !frozen && !foeHot && (plan ? plan.foe : foeSpell);
          return (
            <BoardSlot
              key={`f${index}`}
              mon={shown}
              frozen={frozen}
              fading={Boolean(held?.fading)}
              hpOverride={shown ? (laserHp[`mon:${shown.uid}`] ?? hpHold[`mon:${shown.uid}`]) : undefined}
              side={side}
              near={false}
              index={index}
              layout={fieldLayout}
              hot={foeHot}
              blocked={foeBlocked}
              tone={drag?.kind === "spell" || aim?.kind === "spell" ? "spell" : aim?.kind === "skill" ? "skill" : "monster"}
              attack={foeHot && drag?.kind !== "spell" && aim?.kind !== "spell"}
              picked={aim?.kind === "skill" && aim.also === mon?.uid}
              snapped={snap === `${side}-${index}` || (!snap && !drag && aimLit === `${side}-${index}`)}
              shift={mon ? (attackShift(duel, mon.uid, viewer) ?? blockShift(duel, mon.uid, viewer) ?? coverShifts.get(mon.uid) ?? (pounce === mon.uid ? ambushShift(duel, mon.uid, viewer) : null) ?? (thrust?.uid === mon.uid ? thrust : null)) : shown && thrust?.uid === shown.uid ? thrust : null}
              thrust={shown && thrust?.uid === shown.uid ? (thrust.phase ?? "ram") : false}
              ramAng={shown && thrust?.uid === shown.uid ? thrust.ang : undefined}
              rouseTone={shown && thrust?.uid === shown.uid ? thrust.tone : undefined}
              lifted={Boolean(shown && lift === shown.uid)}
              motion={motion}
              veil={Boolean((duel.players[side].sea && mon && !mon.cage && !mon.shown && (mon.cardId === "trai-tim-hai-long" || mon.cardId === "sua-hut-ma-phap" || mon.cardId === "kraken")) || lurking(mon))}
              unveil={mon ? unveil[mon.uid] : undefined}
              fog={Boolean(mon && lurking(mon))}
              mask={Boolean(duel.players[side].hats && mon && mon.cardId !== "mu")}
              decoy={Boolean(mon && !mon.cage && mon.cardId === "chien-binh-lan-khuat" && (mon.shown ?? 0) > 0)}
              allies={duel.players[side].field}
              prime={!!mon && isPrime(duel, mon, side)}
              lockFlash={!!mon && lockFlash === mon.uid}
              forecast={mon && !lurking(mon) && !(duel.players[side].sea && !mon.cage && !mon.shown && SEA_KINDS.includes(mon.cardId)) && !(duel.players[side].hats && mon.cardId !== "mu") ? sight?.mons.get(mon.uid) : undefined}
              onSlot={onSlot}
              onUnit={onUnit}
            />
          );
        })}
        {([0, 1, 2, 3, 4, 5] as const).map((index) => {
          const mon = you.field[index] ?? null;
          const held = linger.find((item) => item.side === viewer && item.index === index);
          const shown = mon ?? held?.mon ?? fallenMon(prevDuel.current, duel, viewer, index);
          const frozen = !mon && Boolean(shown);
          const card = mon ? monsterCard(mon.cardId) : undefined;
          const coverDrag =
            !!mon &&
            responding &&
            duel.hold?.priority === viewer &&
            mon.cardId === "kizuran" &&
            mon.stun <= 0 &&
            (mon.chain ?? 0) === 0 &&
            you.field.some((unit) => {
              if (!unit || unit.cardId !== "kazura") return false;
              const pending = duel.pending;
              const aimed = pending?.kind === "melee" || pending?.kind === "gnaw" ? pending.defender : pending?.kind === "beam" || pending?.kind === "gnaw-skill" || pending?.kind === "spell" ? pending.target : null;
              return unit.uid === aimed;
            });
          const youHot = ((drag?.kind === "summon" || aim?.kind === "summon") && !mon) || (drag?.kind === "spell" && drag.spellId !== "hoan-doi" && drag.spellId !== "phan-nguyen" && drag.spellId !== "soi-xich-dia-nguc" && drag.spellId !== "huy-diet" && drag.spellId !== "ke-dao-mo" && spellDragLive(drag.spellId, duel, viewer, drag.index) && !!mon && (drag.spellId !== "sung-loi-pha" || hornFit(mon.cardId))) || (aim?.kind === "spell" && aim.spellId === "sung-loi-pha" && !!mon && hornFit(mon.cardId)) || (aim?.kind === "spell" && aim.spellId === "phuc-kich" && !!mon && ambushReady(mon)) || (aim?.kind === "spell" && aim.spellId === "qua-trung-thien-su" && !!mon && eggAllies(duel, viewer).includes(mon.uid)) || (!!mon && swapFit(mon)) || (aim?.kind === "spell" && aim.spellId === "phan-nguyen" && !aim.from && !!mon && harmShift(mon)) || (aim?.kind === "spell" && aim.spellId === "hop-ma-thuat" && !aim.from && !!mon && boxAllies(duel, viewer).includes(mon.uid)) || (!!mon && aim?.kind === "skill" && !!selectedCard && allySkill(selectedCard.id) && (mon.uid !== aim.uid || selectedCard.id === "thien-than-be-nho")) || (!!mon && aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian" && witchAllyMark(duel, aim.uid, mon));
          const plan = targetPlan();
          const youSpell =
            (drag?.kind === "spell" && drag.spellId === "sung-loi-pha" && spellDragLive(drag.spellId, duel, viewer, drag.index)) ||
            (aim?.kind === "spell" && (aim.spellId === "sung-loi-pha" || aim.spellId === "phuc-kich" || aim.spellId === "qua-trung-thien-su" || ((aim.spellId === "phan-nguyen" || aim.spellId === "hop-ma-thuat") && !aim.from))) ||
            Boolean(swapAsk);
          const youBlocked =
            !!mon && !frozen && mon.uid !== plan?.caster && !(plan ? plan.keys.has(`${viewer}-${index}`) : youHot) && (plan ? plan.you : youSpell);
          const grabbable = !!mon && !!card && mon.cardId !== "chan-ken" && mon.stun <= 0 && !(mon.path ?? 0) && (coverDrag || (!tired(mon) && (canPlay || (canIntercept && mon.row !== "back"))));
          return (
            <BoardSlot
              key={`y${index}`}
              mon={shown}
              frozen={frozen}
              fading={Boolean(held?.fading)}
              hpOverride={shown ? (laserHp[`mon:${shown.uid}`] ?? hpHold[`mon:${shown.uid}`]) : undefined}
              side={viewer}
              near
              index={index}
              layout={fieldLayout}
              hot={spellAim() && plan ? plan.keys.has(`${viewer}-${index}`) : youHot}
              blocked={youBlocked}
              fuse={Boolean(mon && ((fuseOn && fuseUids.has(mon.uid)) || (drag?.kind === "summon" && (findFusion(drag.card.id, mon.cardId) || findKnightFusion(drag.card.id, mon.cardId, you.field.filter((unit): unit is NonNullable<typeof unit> => Boolean(unit)).map((unit) => unit.cardId))))))}
              fuseHide={Boolean(mon && fuseAsk && fuseAsk.phase !== "ask" && fuseAsk.fieldUid === mon.uid)}
              tone={drag?.kind === "summon" || aim?.kind === "summon" ? "summon" : drag?.kind === "spell" || aim?.kind === "spell" ? "spell" : aim?.kind === "skill" ? "skill" : "monster"}
              picked={!!mon && ((!!aim && "uid" in aim && aim.uid === mon.uid) || duel.hold?.armed === mon.uid || (blessArm && mon.cardId === "yeu-tinh-chuc-phuc"))}
              snapped={snap === `${viewer}-${index}` || (!snap && !drag && aimLit === `${viewer}-${index}`)}
              attack={false}
              shift={mon ? (attackShift(duel, mon.uid, viewer) ?? blockShift(duel, mon.uid, viewer) ?? coverShifts.get(mon.uid) ?? (pounce === mon.uid ? ambushShift(duel, mon.uid, viewer) : null) ?? (thrust?.uid === mon.uid ? thrust : null)) : shown && thrust?.uid === shown.uid ? thrust : null}
              thrust={shown && thrust?.uid === shown.uid ? (thrust.phase ?? "ram") : false}
              ramAng={shown && thrust?.uid === shown.uid ? thrust.ang : undefined}
              rouseTone={shown && thrust?.uid === shown.uid ? thrust.tone : undefined}
              lifted={Boolean(shown && lift === shown.uid)}
              motion={motion}
              veil={false}
              allies={you.field}
              prime={!!mon && isPrime(duel, mon, viewer)}
              lockFlash={!!mon && lockFlash === mon.uid}
              alert={!!mon && (monsterAlert(duel, mon, viewer) || mysticAlert(duel, mon, viewer) || (lurkReady(mon) && duel.turn === viewer && duel.step === "main"))}
              lurk={!!mon && lurking(mon)}
              unveil={mon ? unveil[mon.uid] : undefined}
              ready={!!mon && !frozen && canPlay && attackRound(duel) === viewer && !tired(mon) && !cannotAct(mon) && !(mon.path ?? 0) && mon.cardId !== "chan-ken" && !mon.abroad && !hexLocked(mon)}
              block={!!mon && !frozen && canIntercept && mon.row !== "back" && !isStill(mon.cardId) && !mon.noBlock && !tired(mon) && mon.stun <= 0 && !(mon.path ?? 0) && !(mon.chain ?? 0) && mon.cardId !== "chan-ken" && !mon.abroad && !hexLocked(mon)}
              alertColor={mon ? reactTone(mon.cardId) : undefined}
              forecast={mon ? sight?.mons.get(mon.uid) : undefined}
              onSlot={onSlot}
              onUnit={onUnit}
              onPointerDown={
                grabbable
                  ? (event) =>
                      begin(event, {
                        kind: "unit",
                        uid: mon.uid,
                        card,
                        live: {
                          name: fieldName(mon),
                          atk: mon.atk,
                          def: mon.def,
                          mdef: mon.mdef,
                          hp: mon.hp,
                          level: mon.level ?? 1,
                        },
                      })
                  : undefined
              }
              onPointerMove={grabbable ? move : undefined}
              onPointerUp={grabbable ? end : undefined}
              ghosting={drag?.kind === "unit" && drag.uid === mon?.uid}
            />
          );
        })}
        {shatters.map((item) => {
          const seat = SLOT_BOX[item.side === viewer ? 0 : 1][item.index];
          if (!seat) return null;
          return (
            <CardShatter key={item.id} box={seat} onDone={() => setShatters((current) => current.filter((row) => row.id !== item.id))}>
              <BoardSlot mon={item.mon} frozen bare side={item.side} near={item.side === viewer} index={item.index} layout={fieldLayout} hot={false} attack={false} motion={{ pops: [], lunges: [], hits: [] }} allies={[]} onSlot={() => undefined} onUnit={() => undefined} />
            </CardShatter>
          );
        })}
        <div className={`lane${drag?.kind === "unit" || aim?.kind === "attack" ? " is-hot" : ""}`} />
        <div className="floaters">
          {floaters.filter((item) => !item.heal).map((item) => (
            <span key={item.id} className="floater" style={floaterStyle(item)}>
              {item.text}
            </span>
          ))}
          {floaters.filter((item) => item.heal).map((item) => (
            <span key={item.id} className="floater heal" style={floaterStyle(item)}>
              {item.text}
            </span>
          ))}
        </div>
        {drag?.kind === "unit" || aim?.kind === "attack" || (aim?.kind === "skill" && !(shelling() && aim.also) && selectedCard && faceSkill(selectedCard.id, aim.index)) ? (
          <button
            type="button"
            className={`face-drop${snap === "face" || (!snap && !drag && aimLit === "face") ? " is-snap" : ""}`}
            data-face="1"
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              if (shelling()) {
                shellTap("face", otherSide);
                return;
              }
              if (aim?.kind === "attack") apply(attackFace(duel, aim.uid));
              if (aim?.kind === "skill") apply(declareSkill(duel, aim.uid, null, aim.index));
            }}
          >
            {aim?.kind === "skill" ? "Người chơi" : "Đánh người"}
          </button>
        ) : null}
        {board.stack.hidden ? null : (
        <button
          type="button"
          className={`face-pile press${canDrawNow ? " is-ready" : ""}${(you.hand.some((id, index) => answerUsable(id, duel, viewer, index)) && (drag?.kind === "unit" || drag?.kind === "summon")) || (standHand && hand === "spell") ? " is-alert" : ""}`}
          style={{
            ...({ "--alert-color": "#ff4f93" } as CSSProperties),
            left: `${board.stack.x}%`,
            top: `${board.stack.y}%`,
            width: `${board.stack.width}%`,
            height: `${board.stack.height}%`,
            fontSize: `calc(${board.stack.size} * var(--cqmin))`,
          }}
          aria-label={tr("Rút bài")}
          onClick={() => {
            setInspect(null);
            setAim((current) => (current?.kind === "summon" ? null : current));
            if (pileTap.current) {
              // Nhấp đôi: hỏi Đầu hàng (chủ game 01/11), không rút.
              window.clearTimeout(pileTap.current);
              pileTap.current = 0;
              if (!tutorial && !trial) setSurrenderAsk(true);
              return;
            }
            pileTap.current = window.setTimeout(() => {
              pileTap.current = 0;
              drawNow.current();
            }, DOUBLE_TAP);
          }}
        >
          <DeckPile count={pileLeft(you)} side="you" ready={canDrawNow} shuffle={shuf.you} />
          {tutorial ? null : <DrawHint on={canDrawNow} />}
        </button>
        )}
        <div
          style={{ top: `calc(${100 - 11.4 * (2.2235 / boardRatio())}% - var(--hand-up, 0px))`, height: `calc(${11.4 * (2.2235 / boardRatio())}% + var(--hand-up, 0px))`, ...({ "--step": Math.max(6.6, (58 - 17.8) / Math.max(1, you.reserve.length + you.hand.length - 1)) } as CSSProperties) }}
          className={`hand is-strip${tutorial ? "" : ` is-fan${you.reserve.length + you.hand.length > 3 ? " is-lap" : ""}`}${you.reserve.length + you.hand.length > 3 ? " is-paged" : ""}${openerOpen || (duel.opener && (duel.mode === "ai" || duel.mode === "net")) ? " is-dealing" : ""}${riteHand !== null ? " is-rite" : ""}`}
          ref={handStrip}
          onScroll={(event) => {
            setHandPick(null);
            fadeEdges(event.currentTarget);
          }}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            origin.current = { x: event.clientX, y: event.clientY, moved: false, t: Date.now(), pan: true, lastX: event.clientX };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!origin.current.pan || grab.current) return;
            const strip = handStrip.current;
            if (!strip) return;
            strip.scrollLeft -= event.clientX - origin.current.lastX;
            origin.current.lastX = event.clientX;
            origin.current.moved = true;
          }}
          onPointerUp={() => {
            if (grab.current) return;
            origin.current.pan = false;
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setInspect(null);
          }}
        >
          {[
            ...you.reserve.map((held, index) => {
                const id = held.id;
                const card = monsterCard(id);
                if (!card) return null;
                const live = reserveLive(held, card);
                const open = inspect?.pile === "reserve" && inspect.index === index;
                const picked = handPick?.pile === "reserve" && handPick.index === index && handPick.id === id;
                const lit = open || picked || (aim?.kind === "summon" && aim.index === index);
                const swapCard = swapBench(held);
                const summonPlace = summonAt(index);
                const summonable = canPlay && !(id === "the-than-cua-shien" && standHand) && (rowSlot("front", summonPlace) !== null || rowSlot("back", summonPlace) !== null);
                const standCard = id === "the-than-cua-shien" && standHand;
                // A monster flashing orange uses its skill from the hand: tap the card, then the skill (Bông mềm, Thế thân).
                const react = standCard ? { label: "Thế thân trên tay", go: () => apply(standIn(duel, index)) } : null;
                const reactLook = react ? bookSkill(id, react.label, card.skill ?? "") : undefined;
                return (
                  <div key={`${id}-${index}`} className={`hand-pick${picked && !tutorial ? " is-up" : ""}${stage?.index === index && stageOk ? " is-out" : ""}${drawShows.some((show) => show.target === `r:${index}`) ? " is-away" : ""}`} data-hand={`r:${index}`} style={fanStyle(index)}>
                    <button
                      type="button"
                      className={`hand-card press is-monster${lit ? " is-open" : ""}${standCard || swapCard ? " is-alert" : ""}${summonable ? " is-summonable" : ""}${fuseHands.has(index) ? " is-fuse" : ""}${drag?.kind === "summon" && drag.index === index ? " is-ghosting" : ""}${(fuseAsk && fuseAsk.phase !== "ask" && fuseAsk.reserveIndex === index) || (fuseShow?.set && (fuseShow.index === index || fuseShow.set.mats.some((mat) => mat.index === index))) ? " is-fuse-hide" : ""}`}
                      data-reserve={index}
                      data-stars={card.stars}
                      style={standCard || swapCard ? ({ "--alert-color": SKILL_TONES.spell } as CSSProperties) : undefined}
                      onClick={() => (swapAsk ? (swapCard ? apply(confirmSwap(duel, swapAsk.locked!, `r:${index}`)) : undefined) : openHand("reserve", index, id))}
                      onPointerDown={(event) => begin(event, { kind: "summon", index, card })}
                      onPointerMove={move}
                      onPointerUp={end}
                    >
                      <CardFace monster={card} hand level={held.saved?.level ?? 1} live={live} gems={held.toll ? `${card.gems}+1` : undefined} fake={held.fake} selected={lit} />
                      {riteHand === index && !(drag?.kind === "summon" && drag.index === index) ? <RiteRing /> : null}
                    </button>
                    {picked && react ? (
                      <HandUse
                        icon={reactLook?.icon ?? "magic-swirl"}
                        kind={reactLook && reactLook.kind !== "passive" && reactLook.kind !== "note" ? reactLook.kind : "spell"}
                        label={react.label}
                        onUse={() => {
                          if (secondTap("reserve", index)) {
                            openSheet("reserve", index);
                            return;
                          }
                          setHandPick(null);
                          react.go();
                        }}
                      />
                    ) : null}
                  </div>
                );
              }),
            ...you.hand.map((id, index) => {
                const open = inspect?.pile === "spell" && inspect.index === index;
                const tolled = Boolean(you.tolls?.[index]);
                const payable = tollOk(spellCard(id)?.gems ?? 0, tolled, you.orb, you.flask);
                const usable = mine && answerUsable(id, duel, viewer, index);
                // Đòn cuối cùng chớp hồng đúng lúc dùng được (chủ game 20/11).
                const riteNow = Boolean(mine) && (id === RITE_CARD || (id === TRAP_CARD && duel.step === "main")) && spellDragLive(id, duel, viewer, index);
                const ready = (usable && (spellSpeed(id) === "fast" || spellSpeed(id) === "super")) || riteNow;
                // V8C: đủ điều kiện thi triển thì viền + glow sáng đứng yên; phép nhanh/siêu tốc đủ điều kiện thì thở mạnh (V8D).
                const castable = Boolean(mine) && !ready && (usable || spellDragLive(id, duel, viewer, index));
                const slowUse = canPlay && slowUsable(id, duel, viewer) && payable;
                const using =
                  (aim?.kind === "spell" && aim.spellId === id && aim.index === index) ||
                  (reflectPick?.index === index && id === "la-chan-phan-don") ||
                  (ambushPick?.index === index && id === "phuc-kich");
                const picked = handPick?.pile === "spell" && handPick.index === index && handPick.id === id;
                const card = (
                  <button
                    type="button"
                    className={`hand-card press is-spell${open || picked ? " is-open" : ""}${ready ? " is-alert" : ""}${castable ? " is-castable" : ""}${drag?.kind === "spell" && drag.index === index ? " is-ghosting" : ""}`}
                    style={ready ? ({ "--alert-color": riteNow ? "#ff4fa6" : SKILL_TONES.spell } as CSSProperties) : undefined}
                    onClick={() => openHand("spell", index, id)}
                    onPointerDown={(event) => begin(event, { kind: "spell", index, spellId: id })}
                    onPointerMove={move}
                    onPointerUp={end}
                  >
                    <CardFace spellId={id} hand gems={tolled ? `${spellCard(id)?.gems ?? 0}+1` : undefined} selected={open || picked} />
                  </button>
                );
                // One tap on a spell that can be used now shows its use icon (chủ game 28/10: "Bấm 1 lần hiện icon dùng phép").
                return (
                  <div key={`${id}-${index}`} className={`hand-pick${picked && !tutorial ? " is-up" : ""}${drawShows.some((show) => show.target === `s:${index}`) ? " is-away" : ""}`} data-hand={`s:${index}`} style={fanStyle(you.reserve.length + index)}>
                    {card}
                    {picked && (usable || slowUse) && !using ? (
                      <HandUse
                        icon="fairy-wand"
                        kind="spell"
                        label="Dùng phép"
                        onUse={() => {
                          if (secondTap("spell", index)) {
                            openSheet("spell", index);
                            return;
                          }
                          const run = () => {
                            setHandPick(null);
                            if (id === "ke-dao-mo") {
                              openDig(index);
                              return;
                            }
                            if (id === RITE_CARD) {
                              startRite(index);
                              return;
                            }
                            if (id === TRAP_CARD) {
                              apply(castSpell(duel, index, trapPicks(duel, viewer)[0] ?? null));
                              return;
                            }
                            if (id === "hoan-doi") {
                              setSwapPick([]);
                              apply(castSpell(duel, index, aimedUid(duel)));
                              return;
                            }
                            if (id === DUO_CARD) {
                              startDuo(index);
                              return;
                            }
                            if (isWileCard(id) || id === REVIVE_CARD || id === PRISM_CARD) {
                              startWileSpell(index);
                              return;
                            }
                            if (isSpring(id)) {
                              startSpring(index);
                              return;
                            }
                            if (slowUse && id === "sung-loi-pha") {
                              setAim({ kind: "spell", index, spellId: id });
                              holdNotice("Chọn quái để gắn sừng.");
                              return;
                            }
                            if (slowUse && id === "phan-nguyen") {
                              const cursed = you.field.filter((mon) => mon && harmShift(mon));
                              if (cursed.length === 0) {
                                holdNotice("Không có đồng minh đang mang trạng thái xấu.");
                                return;
                              }
                              // One cursed ally is picked by itself; from two the player chooses (chủ game 30/10).
                              if (cursed.length === 1 && cursed[0]) {
                                setAim({ kind: "spell", index, spellId: id, from: cursed[0].uid });
                                holdNotice("Chọn quái đối thủ để chuyển trạng thái.");
                                return;
                              }
                              setAim({ kind: "spell", index, spellId: id });
                              holdNotice("Chọn đồng minh đang mang trạng thái xấu.");
                              return;
                            }
                            if (slowUse && SLOW_AIM.has(id)) {
                              setAim({ kind: "spell", index, spellId: id });
                              holdNotice("Chọn một quái đối thủ.");
                              return;
                            }
                            if (slowUse) {
                              apply(castSpell(duel, index, null));
                              return;
                            }
                            if (id === "la-chan-phan-don") {
                              // Như mọi phép có mục tiêu (V8B): bấm hoặc rê trên sân tới kẻ địch sáng neon.
                              setAim({ kind: "spell", index, spellId: id });
                              holdNotice("Chọn một kẻ địch để phản đòn.");
                              return;
                            }
                            if (id === "ngan-chan-phong-ngu") {
                              if (shelterPicks(duel).length === 0) {
                                holdNotice("Chưa có quái nào lao ra chặn hoặc che.");
                                return;
                              }
                              playCue("chain");
                              setAim({ kind: "spell", index, spellId: id });
                              return;
                            }
                            if (id === "hop-ma-thuat") {
                              startBox(index);
                              return;
                            }
                            if (id === "qua-trung-thien-su") {
                              startEgg(index);
                              return;
                            }
                            if (id === "phuc-kich") {
                              // Chọn mục tiêu theo video chủ game (30/10): icon giữa sân + dòng mô tả, đồng minh dùng được sáng viền.
                              if (!you.field.some((unit) => unit && ambushReady(unit))) {
                                holdNotice("Không có đồng minh nào ra đòn được.");
                                return;
                              }
                              playCue("chain");
                              setAim({ kind: "spell", index, spellId: id });
                              return;
                            }
                            const pending = duel.pending;
                            const caster = pending && ("caster" in pending ? pending.caster : "attacker" in pending ? pending.attacker : null);
                            const foeMon = foe.field.find((mon) => mon && mon.uid !== caster) ?? foe.field.find((mon) => mon) ?? null;
                            const aimed = aimedUid(duel);
                            const aimedFoe = aimed && foe.field.some((mon) => mon?.uid === aimed) ? aimed : null;
                            const aimedAlly = aimed && you.field.some((mon) => mon?.uid === aimed) ? aimed : null;
                            const target = id === "ngan-chan-phong-ngu" ? aimedFoe ?? foeMon?.uid ?? null : id === "co-may-thoi-gian" || id === "giap-co-khi" ? aimedAlly : null;
                            apply(castSpell(duel, index, target));
                          };
                          askSpell(id, run, tolled);
                        }}
                      />
                    ) : null}
                  </div>
                );
              }),
          ]}
          {you.reserve.length + you.hand.length === 0 ? <p className="hand-empty">{tr("Hết bài trên tay")}</p> : null}
        </div>
        {/* Tay bài theo video (chủ game 13/11): mũi tên trắng trên lá quái đang nhấc (kéo lá ra, hoặc bấm mũi tên), bảng ngắn
            phía trên, lá kéo ra hiện to giữa sân với lựa chọn, lá vừa rút hiện giữa màn. */}
        {!tutorial && handPick?.pile === "reserve" && pickSpot && !stage && !drawShow && !fuseShow && mine ? (
          <button type="button" className="hand-arrow" style={{ left: `${pickSpot.x}%`, top: `${pickSpot.top}%` }} aria-label={tr("Đưa lá ra sân")} onClick={() => openStage(handPick.index)}>
            <svg viewBox="0 0 60 34" aria-hidden="true">
              <path d="M30 2 L58 22 L44 22 L44 32 L16 32 L16 22 L2 22 Z" />
            </svg>
          </button>
        ) : null}
        {stage && stageOk && stageHeld ? (
          <div className={`stage-back${stageChoosing ? " is-clock-pick" : ""}`} onClick={(event) => event.target === event.currentTarget && closeStage()}>
            <CardShow
              key={`stage-${stage.index}-${stage.id}`}
              from={() => document.querySelector(`.hand [data-reserve="${stage.index}"]`)?.getBoundingClientRect()}
              leave={
                stage.leave
                  ? stage.leave.kind === "land"
                    ? { land: true, to: ((slot) => () => document.querySelector(`[data-slot="${viewer}-${slot}"]`)?.getBoundingClientRect())(stage.leave.slot) }
                    : { to: () => handRect(`r:${stage.index}`) }
                  : null
              }
              onLeft={stageLeft}
              top={SHOW_TOP}
              under={
                <div className={`stage-opts is-${stage.mode}`}>
                  {stage.mode === "rows" && stageRows ? (
                    <>
                      <RowArrow row="front" off={stageRows.front === null || stageWaits} advised={advisedRow(stage.id) === "front"} onPick={() => stageRows.front !== null && (playPack("cut"), setStage({ ...stage, leave: { kind: "land", slot: stageRows.front } }))} />
                      <RowArrow row="back" off={stageRows.back === null || stageWaits} advised={advisedRow(stage.id) === "back"} onPick={() => stageRows.back !== null && (playPack("cut"), setStage({ ...stage, leave: { kind: "land", slot: stageRows.back } }))} />
                    </>
                  ) : stage.mode === "menu" ? (
                    stageActs.map((act) => <ActionButton key={act.key} action={act} mini />)
                  ) : (
                    <p className="stage-none">{tr("Chưa triệu hồi được.")}</p>
                  )}
                </div>
              }
            >
              <button type="button" className="hand-card is-monster stage-face" onClick={() => (playUi("soft"), setPeekAt((at) => at + 1))}>
                {stage.clock?.form && monsterCard(stage.clock.form) ? (
                  <CardFace monster={monsterCard(stage.clock.form)!} hand />
                ) : (
                  <CardFace monster={monsterCard(stageHeld.id)!} hand level={stageHeld.saved?.level ?? 1} live={reserveLive(stageHeld, monsterCard(stageHeld.id)!)} gems={stageHeld.toll ? `${monsterCard(stageHeld.id)!.gems}+1` : undefined} fake={stageHeld.fake} />
                )}
              </button>
            </CardShow>
            {/* Đồng hồ khó đoán (chủ game 22/11): 2 dạng hiện hai bên như lá giữa sân; bấm 1 bên thì bên kia mờ, mũi tên giữa sáng lên. */}
            {stageChoosing
              ? [CLOCK_FIERCE, CLOCK_FRAIL].map((form, i) => (
                  <button
                    key={form}
                    type="button"
                    className={`clock-side is-${i === 0 ? "left" : "right"}${stage.clock?.form === form ? " is-on" : stage.clock?.form ? " is-dim" : ""}`}
                    style={{ top: `${SHOW_TOP}%` }}
                    onClick={() => (playUi("soft"), setStage({ ...stage, clock: { form } }))}
                  >
                    <CardFace monster={monsterCard(form)!} hand />
                  </button>
                ))
              : null}
            {/* Bảng mô tả nằm CÙNG lớp với lá giữa sân (z lá 80 > bảng 75) nên lá không bị bảng che; để ngoài lớp này bảng đè lên lá. */}
            {pickPeek ? (
              <HandPeek
                info={pickPeek}
                at={pickPeek.skills.length ? peekAt % pickPeek.skills.length : 0}
                onPick={(index) => (playUi("soft"), setPeekAt(index))}
                top={PEEK_TOP}
                onTap={() => (playUi("soft"), setPeekAt((at) => at + 1))}
              />
            ) : null}
          </div>
        ) : null}
        {drawShow ? (
          <div
            className="stage-back is-draw"
            onClick={(event) => {
              if (drawLeave) return;
              const n = drawPeek?.skills.length ?? 0;
              // Bấm vào lá hoặc bảng: kỹ năng kế; hết kỹ năng, hoặc bấm ra ngoài: lá về tay.
              if ((event.target as HTMLElement).closest(".card-show, .hand-peek") && peekAt + 1 < n) {
                playUi("soft");
                setPeekAt(peekAt + 1);
              } else {
                playPack("deal");
                setDrawLeave(true);
              }
            }}
          >
            <CardShow
              key={`draw-${drawShow.key}`}
              flip
              from={() => (document.querySelector(".face-pile .deck-pile img:last-of-type") ?? document.querySelector(".face-pile"))?.getBoundingClientRect()}
              leave={drawLeave ? { to: () => handRect(drawShow.target) } : null}
              onLeft={() => {
                setDrawLeave(false);
                setDrawShows((list) => list.slice(1));
              }}
              top={SHOW_TOP}
            >
              {drawShow.target.startsWith("r:") && you.reserve[Number(drawShow.target.slice(2))] && monsterCard(you.reserve[Number(drawShow.target.slice(2))].id) ? (
                ((held) => (
                  <span className="hand-card is-monster stage-face">
                    <CardFace monster={monsterCard(held.id)!} hand level={held.saved?.level ?? 1} live={reserveLive(held, monsterCard(held.id)!)} gems={held.toll ? `${monsterCard(held.id)!.gems}+1` : undefined} fake={held.fake} />
                  </span>
                ))(you.reserve[Number(drawShow.target.slice(2))])
              ) : you.hand[Number(drawShow.target.slice(2))] ? (
                <span className="hand-card is-spell stage-face">
                  <CardFace spellId={you.hand[Number(drawShow.target.slice(2))]} hand gems={you.tolls?.[Number(drawShow.target.slice(2))] ? `${spellCard(you.hand[Number(drawShow.target.slice(2))])?.gems ?? 0}+1` : undefined} />
                </span>
              ) : null}
            </CardShow>
            {drawPeek && !drawLeave ? <HandPeek info={drawPeek} at={peekAt} onPick={setPeekAt} top={PEEK_TOP} /> : null}
          </div>
        ) : null}
        {equipShow ? (
          <>
            <style>{`[data-uid="${equipShow.uid}"] .field-unit { visibility: hidden; }`}</style>
            <EquipShow
              key={equipShow.key}
              slot={equipShow.slot}
              from={equipShow.from}
              tone={speedTone(equipShow.spellId)}
              atkFrom={equipShow.atkFrom}
              atkTo={equipShow.atkTo}
              fromBlue={equipShow.fromBlue}
              onEnd={() => setEquipShow((now) => (now?.key === equipShow.key ? null : now))}
            >
              <span className="hand-card is-spell">
                <CardFace spellId={equipShow.spellId} hand />
              </span>
            </EquipShow>
          </>
        ) : null}
        {castShow ? (
          <div className="cast-layer">
            <CastShow key={castShow.key} tone={speedTone(castShow.id)} onEnd={() => setCastShow((now) => (now?.key === castShow.key ? null : now))}>
              <CardFace spellId={castShow.id} />
            </CastShow>
          </div>
        ) : null}
        {foeNote ? (
          <FoeNote key={foeNote.key} head={foeNote.head} lines={foeNote.lines.map((line, index) => <Painted key={index} text={line} />)} onClose={() => setFoeNote((now) => (now?.key === foeNote.key ? null : now))} />
        ) : null}
        {useAsk ? (
          <ConfirmNote
            head={useAsk.head}
            body={
              useAsk.lines.length ? (
                useAsk.lines.map((line, index) => (
                  <p key={index}>
                    <CopyText text={line} firstTitle={false} inked />
                  </p>
                ))
              ) : (
                <p className="ink-skill">
                  <CopyText text={useAsk.text ?? ""} firstTitle={false} inked />
                </p>
              )
            }
            onOk={() => {
              const go = useAsk.go;
              setUseAsk(null);
              playUi("confirm");
              go();
            }}
            onCancel={() => {
              setUseAsk(null);
              playUi("soft");
            }}
          />
        ) : null}
        {pickPeek && !(stage && stageOk && stageHeld) ? (
          <HandPeek
            info={pickPeek}
            at={pickPeek.skills.length ? peekAt % pickPeek.skills.length : 0}
            onPick={(index) => (playUi("soft"), setPeekAt(index))}
            top={PEEK_TOP}
            onTap={() => (playUi("soft"), setPeekAt((at) => at + 1))}
          />
        ) : null}
        {tutorial && pickStage === "menu" && pickActs.length > 1 && pickSpot && pickMon !== null ? (
          <span className="hand-acts" style={{ left: `${Math.min(80, Math.max(20, pickSpot.x))}%`, top: `${pickSpot.top}%` }}>
            {pickActs.map((act) => (
              <ActionButton key={act.key} action={act} mini />
            ))}
          </span>
        ) : null}
        {tutorial && (pickStage === "rows" || (pickActs.length === 1 && pickActs[0].key === "summon")) && pickShown && pickSpot && pickMon !== null ? (
          // Mũi tên chọn hàng (chủ game 28/10): ngoài lá, ngay trên mép trên lá, nằm cạnh nhau như ở nút Triệu hồi.
          <span className="row-arrows is-hand" style={{ left: `${pickSpot.x}%`, top: `${pickSpot.top}%` }}>
            <RowArrow row="front" off={pickShown.front === null} advised={advisedRow(you.reserve[pickMon]?.id) === "front"} onPick={() => pickRow(pickMon, "front")} />
            <RowArrow row="back" off={pickShown.back === null} advised={advisedRow(you.reserve[pickMon]?.id) === "back"} onPick={() => pickRow(pickMon, "back")} />
          </span>
        ) : null}
        {/* Bố cục chung (chủ game 28/10, theo bàn Grok): OK / chuyển lượt to trên cầu mana; X đỏ (huỷ) và con mắt (xem trước)
            ở chỗ hai nút rút cũ, chưa bấm được (hàng chờ hành động làm sau). Rút bài = bấm xấp bài úp. */}
        <div className="actions is-spread">
          {/* Hàng chờ (chủ game 28/10): X huỷ hết hàng chờ, con mắt bật/tắt xem trước; cả hai khép khi không có gì chờ. */}
          {replay ? (
            board.endTurn.hidden ? null : (
              <button type="button" className={`act medal-act press replay-cam${rpShow ? " is-on" : ""}`} style={pinMedal(board.endTurn)} aria-label={tr("Thanh điều khiển")} aria-pressed={rpShow} onClick={() => setRpShow((on) => !on)}>
                <img className="medal act-face" src="/ui/replay-cam.webp?v=1" alt="" draggable={false} />
              </button>
            )
          ) : null}
          {replay || board.drawMon.hidden ? null : (
            <button
              type="button"
              className={`oracle-act${queue || markId || picking || withdrawOn ? " is-live" : ""}`}
              aria-label={tr("Huỷ hàng chờ")}
              disabled={!queue && !markId && !picking && !withdrawOn}
              style={pinMedal(board.drawMon)}
              onClick={() => (swapAsk ? cancelQueue() : picking ? cancelPick() : queue ? cancelQueue() : withdrawOn ? withdrawMirror() : undefined)}
            >
              {queue || markId || picking || withdrawOn ? <OracleOrb kind="cancel" state="open" /> : <img className="act-new is-eye" src="/ui/act2/eye-red.webp?v=1" alt="" draggable={false} style={{ "--w": 8.25 } as CSSProperties} />}
            </button>
          )}
          {replay || board.drawSpell.hidden ? null : (
            <button
              type="button"
              className={`oracle-act${eyeOn ? " is-live" : ""}${peek && eyeOn ? " is-peek" : ""}`}
              aria-label={tr("Xem trước")}
              disabled={!eyeOn}
              style={pinMedal(board.drawSpell)}
              onPointerDown={(e) => {
                // Chủ game 16/11: ấn và giữ để xem trước, buông tay là tắt.
                e.currentTarget.setPointerCapture?.(e.pointerId);
                setPeek(true);
              }}
              onPointerUp={() => setPeek(false)}
              onPointerCancel={() => setPeek(false)}
              onLostPointerCapture={() => setPeek(false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {peek && eyeOn ? (
                <span className="oracle-smoke" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              ) : null}
              {eyeOn ? <OracleOrb kind="eye" state={peek ? "look" : "open"} /> : <img className="act-new is-eye" src="/ui/act2/eye-gold.webp?v=1" alt="" draggable={false} style={{ "--w": 8.25 } as CSSProperties} />}
            </button>
          )}
          {!replay && mine && !board.endTurn.hidden && !askUpkeep && !gemHold && !dueKnight && !knightAsk && !duel.recall && !duel.counterAsk && ((duel.step === "main" && duel.turn === viewer) || (responding && duel.hold) || queue) ? (
            <button
              type="button"
              className={`act medal-act press ${ticking ? "is-pass" : closesRound ? "is-end" : "is-end is-arrow"}${okFlare && ticking ? " is-flare" : ""}`}
              style={pinMedal(board.endTurn)}
              aria-label={ticking ? "OK" : tr("Hết lượt")}
              onClick={() => {
                if (markId) return;
                // Luật 0.3: neon còn sáng mục tiêu mà quên OK thì chọn luôn mục tiêu đó rồi xác nhận, không huỷ.
                if (aimLit && (aim?.kind === "attack" || aim?.kind === "skill")) {
                  const key = aimLit;
                  setAimLit(null);
                  setPadBox(null);
                  holdNotice("");
                  autoOk.current = true;
                  slideFire.current(key);
                  return;
                }
                if (queue) confirmQueue();
                else if (duel.hold?.stage) land(confirmStage(duel));
                else if (responding) land(passResponse(duel));
                else apply(endTurn(duel));
              }}
            >
              {ticking ? (
                <img className="act-new is-ok" src="/ui/act2/ok.webp?v=1" alt="" draggable={false} style={{ "--w": 14, "--h": 15.2 } as CSSProperties} />
              ) : closesRound ? (
                <img className="medal act-face" src="/ui/act-round.webp?v=1" alt="" draggable={false} />
              ) : (
                <img className="act-new is-arrow" src="/ui/act2/arrow.webp?v=1" alt="" draggable={false} style={{ "--w": 13.8, "--h": 14.6 } as CSSProperties} />
              )}
              {ticking ? <span className="act-halo" aria-hidden="true" /> : null}
              {/* Như video chủ game (30/10): đang chọn mục tiêu / đã xếp chờ xác nhận. */}
              {markId ? <span className="act-caption">{tr("Chọn mục tiêu")}</span> : queue ? <span className="act-caption">{tr("Xác nhận")}</span> : null}
            </button>
          ) : null}
        </div>
        {counterSeat >= 0 && duel.counterAsk ? (
          <UnitChips
            duel={duel}
            uid={duel.counterAsk.uid}
            viewer={viewer}
            attackable
            riposte
            blessOn={false}
            onBless={() => undefined}
            onChronoFlow={() => undefined}
            onLure={() => undefined}
            setAim={setAim}
            apply={apply}
            onAsk={askRow}
          />
        ) : null}
        {dropMenu && !duel.counterAsk
          ? (() => {
              const built = dropRows(dropMenu);
              return built ? <UnitActs rows={built.rows} box={built.box} soloRed={false} onAsk={(row) => askRow(dropMenu.uid, row)} /> : null;
            })()
          : null}
        {aim?.kind === "menu" && !duel.counterAsk ? (
          <UnitChips
            duel={duel}
            uid={aim.uid}
            viewer={viewer}
            attackable={canPlay}
            blessOn={blessArm}
            onBless={() => {
              setBlessArm(true);
              holdNotice("Yêu tinh đang chờ. Kéo quái khác lên để chặn.");
            }}
            onChronoFlow={(uid) => {
              if (!canTargetFoe(duel)) {
                holdNotice("Lượt đầu không được nhắm đối thủ.");
                return;
              }
              setAim(null);
              setChronoAsk(null);
              setChronoWarn(null);
              apply(useSkill(duel, uid, null, 2));
            }}
            onLure={(uid) => setLureAsk(uid)}
            onRebirth={(uid) => {
              setAim(null);
              setRebirthAsk(uid);
            }}
            setAim={setAim}
            apply={apply}
            onAsk={askRow}
          />
        ) : null}
        {lookSheet ?? (look ? (
          <div className="overlay">
            <div className="sheet is-skill is-read">
              <h2>{look.name}</h2>
              <p
                className="ink-skill"
                onPointerDown={(event) => {
                  const box = event.currentTarget;
                  if (box.scrollHeight <= box.clientHeight + 2) return;
                  skillPan.current = { id: event.pointerId, y: event.clientY, top: box.scrollTop };
                  box.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const pan = skillPan.current;
                  if (!pan || pan.id !== event.pointerId) return;
                  event.currentTarget.scrollTop = pan.top - (event.clientY - pan.y);
                }}
                onPointerUp={() => {
                  skillPan.current = null;
                }}
                onPointerCancel={() => {
                  skillPan.current = null;
                }}
              >
                <CopyText text={look.text} />
                {look.hot ? <b className="ink-monster">{tr(look.hot)}</b> : null}
              </p>
              <button type="button" className="act alt press" onClick={() => setLook(null)}>
                Đóng
              </button>
            </div>
          </div>
        ) : null)}
        {strike && selectedCard ? (
          <div className="overlay">
            <div className="sheet is-skill">
              <h2>{selectedCard.name}</h2>
              <button
                type="button"
                className="act press"
                onClick={() => {
                  const next = strike.face || !strike.foeUid ? attackFace(duel, strike.uid) : attackMonster(duel, strike.uid, strike.foeUid);
                  setStrike(null);
                  apply(next);
                }}
              >
                Đánh thường
              </button>
              {selectedCard.id === "mat-xanh-huy-diet" ? (
                <button
                  type="button"
                  className="act press is-skillbox"
                  onClick={() => {
                    const had = duel.players.flatMap((player) => player.field).some((unit) => unit?.uid === strike.uid && unit.gaze);
                    const armed = had ? duel : useSkill(duel, strike.uid, null, 0);
                    const ready = armed.players.flatMap((player) => player.field).some((unit) => unit?.uid === strike.uid && unit.gaze);
                    setStrike(null);
                    if (!ready) {
                      apply(armed);
                      return;
                    }
                    apply(strike.face || !strike.foeUid ? attackFace(armed, strike.uid) : attackMonster(armed, strike.uid, strike.foeUid));
                  }}
                >
                  Cầu sấm ánh sáng
                </button>
              ) : (
                skillChoices(selectedCard.skill).map((line, index) => (
                  <button
                    key={line}
                    type="button"
                    className="act press is-skillbox"
                    onClick={() => {
                      setStrike(null);
                      const shot = !/tích luỹ|thăng cấp|nhân bản|lộ diện|đổi thế/i.test(line);
                      apply(shot ? declareSkill(duel, strike.uid, wantsTarget(line) ? strike.foeUid : null, index) : useSkill(duel, strike.uid, wantsTarget(line) ? strike.foeUid : null, index));
                    }}
                  >
                    {line.replace(/^\d+\.\s*/, "")}
                  </button>
                ))
              )}
              <button type="button" className="act alt press" onClick={() => setStrike(null)}>
                Huỷ
              </button>
            </div>
          </div>
        ) : null}
        {handSheet ??
          (inspect && shownSpell ? (
            // Spells open the spell sheet, laid out like the monster sheet (owner, 18/10).
            <SpellSheet
              id={shownSpell.id}
              gems={spellToll ? `${shownSpell.gems}+1` : undefined}
              actions={
                mine && inspect.pile === "spell" && !(queue && (queue.kind === "act" || duel.step !== "respond")) && (isSpring(shownSpell.id) ? springLive(duel, viewer) : duel.step === "respond" && ANSWER_SPELLS.has(shownSpell.id) ? answerUsable(shownSpell.id, duel, viewer, inspect.index) : shownSpell.id !== "hoan-doi")
                  ? [
                      {
                        key: "cast",
                        label: shownSpell.id === "hoan-doi" || shownSpell.id === "ke-dao-mo" ? "Use" : "Dùng phép",
                        tone: "purple",
                        cost: shownSpell.gems + (spellToll ? 1 : 0),
                        onPress: () => {
                          const index = inspect.index;
                          if (shownSpell.id === "ke-dao-mo") {
                            setInspect(null);
                            openDig(index);
                            return;
                          }
                          if (shownSpell.id === "hop-ma-thuat") {
                            setInspect(null);
                            startBox(index);
                            return;
                          }
                          if (shownSpell.id === DUO_CARD) {
                            setInspect(null);
                            startDuo(index);
                            return;
                          }
                          if (isWileCard(shownSpell.id) || shownSpell.id === REVIVE_CARD || shownSpell.id === PRISM_CARD) {
                            setInspect(null);
                            startWileSpell(index);
                            return;
                          }
                          if (isSpring(shownSpell.id)) {
                            setInspect(null);
                            startSpring(index);
                            return;
                          }
                          if (shownSpell.id === "qua-trung-thien-su") {
                            setInspect(null);
                            startEgg(index);
                            return;
                          }
                          if (shownSpell.id === "ngan-chan-phong-ngu") {
                            setInspect(null);
                            if (shelterPicks(duel).length === 0) {
                              holdNotice("Chưa có quái nào lao ra chặn hoặc che.");
                              return;
                            }
                            playCue("chain");
                            setAim({ kind: "spell", index, spellId: shownSpell.id });
                            return;
                          }
                          const swap = shownSpell.id === "hoan-doi";
                          const aimed = aimedUid(duel);
                          const ally = aimed && duel.players[viewer].field.some((mon) => mon?.uid === aimed) ? aimed : null;
                          setInspect(null);
                          if (swap) setSwapPick([]);
                          apply(castSpell(duel, index, swap ? aimed : shownSpell.id === "co-may-thoi-gian" || shownSpell.id === "giap-co-khi" ? ally : null));
                        },
                      },
                    ]
                  : []
              }
              onClose={() => setInspect(null)}
              onSwipe={browse}
            />
          ) : inspect && shownMonster ? (
            <>
              <button type="button" className="inspect-dismiss" aria-label="Đóng kỹ năng" onClick={() => setInspect(null)} />
              <div className="inspect-card">
                <CardFace monster={shownMonster} gems={reserveToll ? `${shownMonster.gems}+1` : undefined} live={reserveHeld && shownMonster ? reserveLive(reserveHeld, shownMonster) : undefined} />
                <div className="inspect-copy is-skill">
                  <strong>{shownMonster.name}</strong>
                  <p>{`${shownMonster.stars} sao · ${reserveToll ? `${shownMonster.gems}+1` : shownMonster.gems} gem`}</p>
                  <p className="ink-skill">
                    <CopyText text={shownMonster.skill ?? ""} />
                  </p>
                </div>
              </div>
            </>
          ) : null)}
        {drag && snap ? <SnapTop keyName={snap} x={drag.x} y={drag.y} /> : null}
        {(() => {
          // P3.2: the neon's target already shows its light while Tấn công or a skill is aimed (not for drags or spells).
          if (!duel || !aimLit || drag || snap || (aim?.kind !== "attack" && aim?.kind !== "skill")) return null;
          const card = cardSpot(aim.uid);
          if (!card) return null;
          const foeSide = (viewer === 0 ? 1 : 0) as Side;
          let end: FlowEnd | null = null;
          if (aimLit === "face") end = { face: foeSide };
          else {
            const [sideText, slotText] = aimLit.split("-");
            const uid = duel.players[Number(sideText) as Side]?.field[Number(slotText)]?.uid;
            if (uid) end = { uid };
          }
          const from = { x: card.x, y: card.top ? card.y + card.h / 2 : card.y - card.h / 2 };
          const to = end ? flowEnd(end, from) : null;
          if (!to) return null;
          const kind = aimKind();
          const tone = kind === "attack" ? "red" : aim.kind === "skill" && allySkill(you.field.find((unit) => unit?.uid === aim.uid)?.cardId ?? "") ? "green" : "blue";
          return <AimFlow from={{ ...from, face: card.top ? 1 : -1 }} to={to} tone={tone} />;
        })()}
        {padBox && aimLit && !drag && !snap && (aim?.kind === "attack" || aim?.kind === "skill") ? (
          <AimPad
            box={padBox}
            kind={aimKind()}
            open={{ up: Boolean(stepLit("up")), down: Boolean(stepLit("down")), left: Boolean(stepLit("left")), right: Boolean(stepLit("right")) }}
            onStep={(dir) => {
              const next = stepLit(dir);
              if (next) setAimLit(next);
            }}
          />
        ) : null}
        {drag ? (
          <div className="ghost" style={{ left: drag.x, top: drag.y }}>
            {drag.kind === "spell" ? (
              <CardFace spellId={drag.spellId} hand gems={you.tolls?.[drag.index] ? `${spellCard(drag.spellId)?.gems ?? 0}+1` : undefined} />
            ) : drag.kind === "unit" ? (
              <CardFace monster={drag.card} level={drag.live.level} live={drag.live} />
            ) : (
              <>
                <CardFace monster={drag.card} hand level={you.reserve[drag.index]?.saved?.level ?? 1} live={you.reserve[drag.index] ? reserveLive(you.reserve[drag.index], drag.card) : undefined} fake={you.reserve[drag.index]?.fake} />
                {drag.kind === "summon" && riteHand === drag.index ? <RiteRing /> : null}
              </>
            )}
          </div>
        ) : null}
        {duel.glimpse ? (
          <div className="overlay">
            <div className="sheet glimpse-sheet">
              <h2>{tr("Quái dự bị đối thủ")}</h2>
              {duel.glimpse.length === 0 ? <p>{tr("Không còn quái dự bị.")}</p> : null}
              <div className="glimpse-list">
                {duel.glimpse.map((id, index) => {
                  const card = monsterCard(id);
                  if (!card) return null;
                  return (
                    <div className="glimpse-row" key={`${id}-${index}`}>
                      <CardFace monster={card} />
                      <div className="inspect-copy is-skill">
                        <strong>{card.name}</strong>
                        <p>
                          {card.stars} sao · {card.gems} gem
                        </p>
                        <p className="ink-skill">
                          <CopyText text={card.skill} />
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button type="button" className="act press" onClick={() => setDuel(dismissGlimpse(duel))}>
                Đóng
              </button>
            </div>
          </div>
        ) : null}
        {surrenderAsk ? (
          <div className="overlay" onClick={() => setSurrenderAsk(false)}>
            <div className="sheet surrender-ask" onClick={(event) => event.stopPropagation()}>
              <h2>{tr("Đầu hàng?")}</h2>
              <div className="pad2">
                <button
                  type="button"
                  className="act press"
                  onClick={() => {
                    setSurrenderAsk(false);
                    apply(concede(duel, viewer));
                  }}
                >
                  {tr("Có")}
                </button>
                <button type="button" className="act alt press" onClick={() => setSurrenderAsk(false)}>
                  {tr("Không")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {help ? (
          <MatchMenu
            duel={duel}
            viewer={viewer}
            foeName={duel.faces?.[otherSide]?.name ?? (duel.mode === "ai" ? tr("Máy") : tr("Đối thủ"))}
            language={language}
            sound={sound}
            confirm={confirmUse}
            onConfirm={() => {
              const next = !confirmUse;
              setConfirmOn(next);
              setConfirmUse(next);
              playUi("soft");
            }}
            canConcede={duel.winner === null}
            onLang={setLang}
            onSound={() => {
              const next = !sound;
              setSound(next);
              setSoundOn(next);
              if (next) playCue("draw");
            }}
            onConcede={() => {
              setHelp(false);
              apply(concede(duel, viewer));
            }}
            onClose={() => setHelp(false)}
          />
        ) : null}
        {testOpen && duel.mode === "test" ? (
          <div className="overlay">
            <div className="sheet test-sheet">
              <h2>Test</h2>
              <p>{tr("Bên dưới là lượt đang chơi. Tay hoặc sân không tốn sao hay mana.")}</p>
              <div className="pad2">
                <button type="button" className={`tuner-item${testKind === "monster" ? " on" : ""}`} onClick={() => setTestKind("monster")}>
                  {tr("Quái")}
                </button>
                <button type="button" className={`tuner-item${testKind === "spell" ? " on" : ""}`} onClick={() => setTestKind("spell")}>
                  {tr("Phép")}
                </button>
              </div>
              <input className="tune-input" value={testFind} placeholder={tr("Tìm tên")} onChange={(event) => setTestFind(event.target.value)} />
              {testCards.map((card) => (
                <div className="test-row" key={card.id}>
                  <b>{tr(card.name)}</b>
                  {"env" in card && card.env ? (
                    <>
                      <button type="button" onClick={() => apply(testEnv(duel, viewer, card.id))}>
                        {tr("Sân bạn")}
                      </button>
                      <button type="button" onClick={() => apply(testEnv(duel, otherSide, card.id))}>
                        {tr("Sân đối")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => apply(testGrant(duel, viewer, card.id, false))}>
                        Tay bạn
                      </button>
                      <button type="button" onClick={() => apply(testGrant(duel, otherSide, card.id, false))}>
                        Tay đối
                      </button>
                    </>
                  )}
                  {testKind === "monster" ? (
                    <>
                      <button type="button" onClick={() => apply(testGrant(duel, viewer, card.id, true))}>
                        {tr("Sân bạn")}
                      </button>
                      <button type="button" onClick={() => apply(testGrant(duel, otherSide, card.id, true))}>
                        {tr("Sân đối")}
                      </button>
                    </>
                  ) : null}
                </div>
              ))}
              <button type="button" className="act alt press" onClick={() => setTestOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        ) : null}
        {duel.winner !== null && endStep === "scene" && scene ? (
          <EndScene win={scene.win} at={scene.at} tone={scene.tone} onDone={() => setEndStep(gain ? "missions" : "done")} />
        ) : null}
        {duel.winner !== null && endStep === "missions" && gain ? <MissionAfter gain={gain} onDone={() => setEndStep("done")} /> : null}
        {duel.winner !== null && endStep === "done" && summed ? (
          <MatchSummary
            win={duel.winner === viewer}
            mode={duel.mode === "ai" ? "Đấu với máy" : quickNet ? "Đánh thường" : "Tuỳ chọn"}
            seconds={matchSeconds}
            you={summarySeat(viewer)}
            foe={summarySeat(viewer === 0 ? 1 : 0)}
            again={mazeFight.current ? { off: true } : againLook}
            onContinue={mazeFight.current ? () => void navigate({ to: "/maze" }) : leaveMatch}
            onAgain={playAgain}
          />
        ) : null}
        {duel.winner !== null && endStep === "done" && !summed ? (
          <div className="overlay">
            <div className="sheet">
              <h2>{duel.mode === "hotseat" || duel.mode === "test" ? (duel.winner === 0 ? "Bên 1 thắng" : "Bên 2 thắng") : duel.winner === viewer ? "Bạn thắng" : "Bạn thua"}</h2>
              {duel.mode === "net" ? null : (
                <button type="button" className="act press" onClick={rematchHere}>
                  Đấu lại
                </button>
              )}
              <Link to="/deck" className="act alt press">
                Sửa bộ bài
              </Link>
              <Link to="/" className="act alt press">
                Về menu chính
              </Link>
            </div>
          </div>
        ) : null}
        <Spectacle />
        <ArenaFx />
        <FireBurst />
        <HealBlast />
        <BuffBlast />
        <AegisBreak />
        {([0, 1] as const).flatMap((side) =>
          duel.players[side].field.map((mon, index) => {
            if (!mon || !(mon.aegis || aegisKeep[mon.uid]) || mon.hp <= 0 || seaVeiled(duel, viewer, mon.uid)) return null;
            const box = SLOT_BOX[screenSide(side, viewer)][index];
            return <AegisHold key={`aegis-${mon.uid}`} x={box.x + box.w / 2} y={box.y + box.h / 2} w={box.w} />;
          }),
        )}
        <FlareBlast />
        <BoomBlast />
        <BoltBurst />
        <LaserBeam />
        <WaterBurst />
        </div>
        {fuseShow ? (
          <div className={`fuse3d is-${fuseShow.phase}`}>
            {(fuseShow.phase === "lift" || fuseShow.phase === "clash" || fuseShow.phase === "apart" || fuseShow.phase === "swirl" || fuseShow.phase === "flash") && fuseHeld && fuseShow.set && fuseShow.set.mats.length ? (
              <FuseDance a={fuseShow.a} b={fuseShow.b} c={fuseShow.set.mats[1] ? fuseShow.c : undefined}>
                {[
                  <FusePic key="a" src={artSrc(fuseHeld.id, fuseHeld.saved?.level ?? 1)} />,
                  ...fuseShow.set.mats.slice(0, 2).map((mat, i) => <FusePic key={i ? "c" : "b"} src={mat.src} />),
                ]}
              </FuseDance>
            ) : null}
            {(fuseShow.phase === "lift" || fuseShow.phase === "clash" || fuseShow.phase === "apart" || fuseShow.phase === "swirl" || fuseShow.phase === "flash") && !fuseShow.set && fuseHeld && fusePartner ? (
              <FuseDance a={fuseShow.a} b={fuseShow.b} c={fuseThird ? fuseShow.c : undefined}>
                {[
                  <FusePic key="a" src={artSrc(fuseHeld.id, fuseHeld.saved?.level ?? 1)} />,
                  <FusePic key="b" src={artSrc(fusePartner.cardId, fusePartner.level ?? 1)} />,
                  ...(fuseThird ? [<FusePic key="c" src={artSrc(fuseThird.cardId, fuseThird.level ?? 1)} />] : []),
                ]}
              </FuseDance>
            ) : null}
            {fuseShow.phase === "swirl" || fuseShow.phase === "flash" || fuseShow.phase === "turn" ? <i className="fuse3d-glow" /> : null}
            {fuseShow.phase === "flash" ? (
              <span className="fuse3d-star">
                <i className="is-core" />
                {FUSE_RAYS.map((ray, i) => (
                  <i key={i} className="is-ray" style={{ "--a": `${ray[0]}deg`, "--l": `${ray[1]}vmin`, "--h": `${ray[2]}vmin`, "--dl": `${ray[3]}ms` } as CSSProperties} />
                ))}
              </span>
            ) : null}
            {fuseShow.phase === "flash" || fuseShow.phase === "turn" ? <i className="fuse3d-white" /> : null}
            {fuseShow.phase === "turn" ? (
              <span className="fuse3d-dust">
                {Array.from({ length: 28 }, (_, i) => (
                  <i
                    key={i}
                    style={{ left: `${(i * 53 + 7) % 100}%`, top: `${(i * 37 + 11) % 96}%`, "--s": `${0.6 + ((i * 7) % 5) / 5}`, "--t": `${0.7 + ((i * 3) % 5) / 10}s`, "--dl": `${((i * 11) % 7) * 30}ms` } as CSSProperties}
                  />
                ))}
              </span>
            ) : null}
            {fuseShow.phase === "reveal" ? (
              <i
                className="fuse3d-catch"
                onClick={() => {
                  setPeekAt(0);
                  setFuseShow({ ...fuseShow, phase: "rows" });
                }}
              />
            ) : null}
            {(fuseShow.phase === "turn" || fuseShow.phase === "reveal" || fuseShow.phase === "rows" || fuseShow.phase === "land") && fuseBorn ? (
              <div
                className="fuse3d-big"
                style={{ "--sx": `${fuseShow.at.x}%`, "--sy": `${fuseShow.at.y}%`, "--sw": `${fuseShow.at.w}%` } as CSSProperties}
                onClick={fuseShow.phase === "reveal" ? () => (playUi("soft"), setPeekAt((at) => at + 1)) : undefined}
              >
                <CardFace monster={monsterCard(fuseShow.resultId)!} hand />
              </div>
            ) : null}
            {fusePeek ? (
              <HandPeek
                info={fusePeek}
                at={fusePeek.skills.length ? peekAt % fusePeek.skills.length : 0}
                onPick={(index) => (playUi("soft"), setPeekAt(index))}
                top={PEEK_TOP}
                onTap={() => (playUi("soft"), setPeekAt((at) => at + 1))}
              />
            ) : null}
            {fuseShow.phase === "rows" && fuseRows ? (
              <div className="stage-opts is-rows is-fuse">
                <RowArrow row="front" off={fuseRows.front === null} advised={advisedRow(fuseShow.resultId) === "front"} onPick={() => fuseLand("front")} />
                <RowArrow row="back" off={fuseRows.back === null} advised={advisedRow(fuseShow.resultId) === "back"} onPick={() => fuseLand("back")} />
              </div>
            ) : null}
          </div>
        ) : null}
        {fuseChoice && !fuseShow ? (
          <div ref={fusePickRef} className="fuse-pick" onClick={() => setFuseChoice(null)}>
            {fuseChoice.opts.map((opt, i) => (
              <div key={opt.resultId} className={`fuse-pick-col${i === fuseChoice.at ? " is-on" : ""}`} onClick={(event) => event.stopPropagation()}>
                <img
                  className="fuse-pick-art"
                  src={`/art/fuse/${opt.resultId}.webp`}
                  alt={tr(monsterCard(opt.resultId)?.name ?? "")}
                  onError={(event) => { const el = event.currentTarget; if (!el.dataset.fallback) { el.dataset.fallback = "1"; el.src = artSrc(opt.resultId, 1); el.classList.add("is-flat"); } }}
                  draggable={false}
                  onClick={() => {
                    playUi("soft");
                    setPeekAt(0);
                    setFuseChoice({ ...fuseChoice, at: i });
                  }}
                />
                <ActionButton action={{ key: "fuse", label: "Dung hợp", tone: "fuse", emblem: "swirl", cost: opt.cost, onPress: () => startFuse(fuseChoice.index, opt) }} />
              </div>
            ))}
            {(() => {
              const card = monsterCard(fuseChoice.opts[fuseChoice.at].resultId);
              if (!card) return null;
              const info: PeekInfo = { name: tr(card.name), cardId: card.id, stars: card.stars, stats: { atk: card.atk, def: card.def, mdef: card.mdef, hp: card.hp }, skills: skillsOf(card.id, card.skill ?? "") };
              return <HandPeek info={info} at={info.skills.length ? peekAt % info.skills.length : 0} onPick={(index) => (playUi("soft"), setPeekAt(index))} top={PEEK_TOP} onTap={() => (playUi("soft"), setPeekAt((at) => at + 1))} />;
            })()}
          </div>
        ) : null}
        {/* Đồng hồ ra sân bằng đường khác (bảng quái, phản ứng…): chọn dạng sau khi đáp, cùng kiểu 2 lá hai bên. */}
        {duel.clockAsk && duel.clockAsk.side === viewer && !watch && !stage ? (
          <div className="stage-back is-clock-pick">
            {[CLOCK_FIERCE, CLOCK_FRAIL].map((form, i) => (
              <button
                key={form}
                type="button"
                className={`clock-side is-${i === 0 ? "left" : "right"}${clockOn === form ? " is-on" : clockOn ? " is-dim" : ""}`}
                style={{ top: `${SHOW_TOP}%` }}
                onClick={() => (playUi("soft"), setClockOn(form))}
              >
                <CardFace monster={monsterCard(form)!} hand />
              </button>
            ))}
            <div className="stage-opts is-rows">
              <ActionButton mini action={{ key: "clock", label: "Chọn", tone: "gold", cost: 0, onPress: () => {
                if (!clockOn) return;
                const form = clockOn;
                setClockOn(null);
                apply(chooseClock(duel, form));
              } }} />
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path fill="currentColor" d="M3.5 9.2h3.6L12 5v14l-4.9-4.2H3.5z" />
      {muted ? (
        <path d="M16 9.2l5.2 5.6M21.2 9.2L16 14.8" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      ) : (
        <>
          <path d="M15.6 8.4a4.2 4.2 0 0 1 0 7.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 5.6a7.4 7.4 0 0 1 0 12.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function gnawReady(duel: Duel, mon: FieldMon, side: Side) {
  if (mon.cardId !== "chien-si-gam-nham" || mon.dim || mon.stun > 0 || mon.noBlock) return false;
  if ((duel.players[side].orb < skillManaCost(mon.cardId) && !duel.parley) || duel.step !== "respond" || duel.hold?.priority !== side || !duel.pending) return false;
  const pending = duel.pending;
  if (pending.kind === "melee") return pending.attacker !== mon.uid && (pending.defender === mon.uid || duel.hold?.blocker === mon.uid);
  if (pending.kind === "face") return pending.attacker !== mon.uid && side !== duel.turn;
  if (pending.kind === "beam" && pending.back) return pending.target === mon.uid && pending.caster !== mon.uid;
  if (pending.kind === "beam") return pending.caster !== mon.uid && side !== duel.turn;
  return false;
}

function isPrime(duel: Duel, mon: FieldMon, side: Side) {
  if (mon.stun > 0) return false;
  if (mon.cardId === "ga-he-dang-so" && mon.charge >= 2 && !mon.dim) return true;
  return gnawReady(duel, mon, side);
}

/** A button on a monster that picks a target, for ấn giữ rồi trượt: Tấn công, or the skill it aims. */
type TargetPlan = { keys: Set<string>; foe: boolean; you: boolean; caster: string };
type ChipSlide = { kind: "attack"; uid: string } | { kind: "skill"; uid: string; index: number };

type UnitRow = { key: string; label: string; go: () => void; slide?: ChipSlide; icon: string; kind: UnitActKind };
type UnitRowsArgs = {
  duel: Duel;
  uid: string;
  viewer: Side;
  attackable: boolean;
  riposte?: boolean;
  blessOn: boolean;
  onBless: () => void;
  onChronoFlow: (uid: string) => void;
  onLure: (uid: string) => void;
  onRebirth?: (uid: string) => void;
  setAim: (aim: Aim | null) => void;
  apply: (next: Duel) => void;
};

/** The buttons a monster on the field shows when tapped (the same list a drag onto a target filters). */
function unitRows({ duel, uid, viewer, attackable, riposte = false, blessOn, onBless, onChronoFlow, onLure, onRebirth, setAim, apply }: UnitRowsArgs): { rows: UnitRow[]; box: { x: number; y: number; w: number; h: number }; soloRed: boolean } | null {
  const side = (duel.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1) as Side;
  const mon = duel.players[side].field.find((unit) => unit?.uid === uid) ?? null;
  const card = mon ? monsterCard(mon.cardId) : undefined;
  const index = duel.players[side].field.findIndex((unit) => unit?.uid === uid);
  if (!mon || !card || index < 0) return null;
  const box = SLOT_BOX[screenSide(side, viewer)][index];
  const you = duel.players[side];
  const noSkill = (tired(mon) && !riposte) || mon.stun > 0 || (mon.chain ?? 0) > 0 || (mon.path ?? 0) > 0 || hexLocked(mon);
  const noAttack = noSkill || (mon.gag ?? 0) > 0 || card.id === "hoa-an-thit-nguoi";
  const empty = you.field.filter((unit) => !unit).length;
  type Row = { key: string; label: string; go: () => void; slide?: ChipSlide };
  const y: Row[] = [];
  const z: Row[] = [];
  const aimed = (skillIndex: number): ChipSlide => ({ kind: "skill", uid, index: skillIndex });
  const afford = (cost: number) => Boolean(duel.parley && duel.step === "respond") || you.orb >= cost;
  const aimSkill = (skillIndex: number) => setAim({ kind: "skill", uid, index: skillIndex });
  // Chỉ bên giữ kiếm (token tấn công của vòng) được đánh và dùng kỹ năng gây sát thương; Trả đòn thì luôn được.
  const sword = riposte || attackRound(duel) === side;
  if (attackable && !noSkill) {
    for (const chip of fieldBindsFor(card.id, {
      cardId: card.id,
      orb: you.orb,
      level: mon.level ?? 1,
      hp: mon.hp,
      stored: mon.stored ?? 0,
      skillText: plainCopy(card.skill),
      afford,
      aim: aimSkill,
      cast: (index) => apply(useSkill(duel, uid, null, index)),
      declare: (index) => apply(declareSkill(duel, uid, null, index)),
      spent: [...(mon.shed ?? []), ...(mon.mult ? ["mult"] : [])],
      room: empty,
    })) {
      if (!sword && harmSkill(card.id, chip.skill)) continue;
      // Skill chậm (chủ game 29/10): a skill that lands on several is not for striking back; its button is hidden.
      if (riposte && !reactSkillOk(duel, uid, chip.skill)) continue;
      // Trả đòn: kỹ năng có mục tiêu đánh ngay vào kẻ ra đòn, không chọn mục tiêu, không qua hàng chờ.
      if (riposte && chip.aims && duel.counterAsk) {
        const from = duel.counterAsk.from;
        y.push({ key: chip.key, label: chip.label, go: () => apply(useSkill(duel, uid, from, chip.skill)) });
        continue;
      }
      y.push({ key: chip.key, label: chip.label, go: chip.go, ...(chip.aims ? { slide: aimed(chip.skill) } : {}) });
    }
  }

  if (attackable && !noSkill && !mon.copy && card.id === "ga-he-dang-so") {
    if (you.orb >= 1) y.push({ key: "charge", label: chipLabel(card.id, "charge"), go: () => apply(useSkill(duel, uid, null, 0)) });
    if (mon.charge >= 2 && sword) z.push({ key: "cast", label: chipLabel(card.id, "cast"), go: () => aimSkill(1), slide: aimed(1) });
  }
  if (attackable && !mon.copy && card.id === "sat-nhan-bat-giu" && !mon.seized && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0 && !mon.cage) {
    y.push({ key: "seize", label: chipLabel(card.id, "seize"), go: () => aimSkill(0), slide: aimed(0) });
  }
  // Sinh mệnh mới: skill buff, không dùng khi Trả đòn hay đang giao tranh (chủ game 21/11).
  if (attackable && !noSkill && !riposte && onRebirth && card.id === EGG && duel.step === "main" && afford(mon.reborn ? 0 : 1) && handPicks(you).length > 0) {
    y.push({ key: "life", label: chipLabel(card.id, "life"), go: () => onRebirth(uid) });
  }
  if (attackable && !noSkill && card.id === "mat-xanh-huy-diet" && !mon.gaze && you.orb >= 1) {
    y.push({ key: "gaze", label: "Cầu sấm ánh sáng", go: () => apply(useSkill(duel, uid, null, 0)) });
  }
  if (attackable && !noSkill && card.id === "ky-si-bong-toi" && afford(skillManaCost(card.id))) {
    y.push({ key: "vow", label: chipLabel(card.id, "vow"), go: () => apply(offerVow(duel, uid)) });
  }
  if (attackable && card.id === "nu-chua-dieu-nhan-hoan-my") {
    const quiet = mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0;
    if (quiet) {
      y.push({ key: "gust", label: chipLabel(card.id, "gust"), go: () => apply(useSkill(duel, uid, null, 0)) });
      if (!mon.bolt && you.orb >= 1) y.push({ key: "bolt", label: chipLabel(card.id, "bolt"), go: () => apply(useSkill(duel, uid, null, 2)) });
    }
    if (!noSkill) y.push({ key: "lure", label: chipLabel(card.id, "lure"), go: () => aimSkill(3), slide: aimed(3) });
  }
  if (attackable && !noSkill && (card.id === "my-dieu-nhan" || card.id === "nu-chua-dieu-nhan")) {
    const spent = new Set(mon.shed ?? []);
    const gust = card.id === "nu-chua-dieu-nhan" ? 0 : 1;
    const charm = 0;
    if (!spent.has("gust") && you.orb >= gust) y.push({ key: "gust", label: chipLabel(card.id, "gust"), go: () => apply(useSkill(duel, uid, null, 0)) });
    if (card.id === "nu-chua-dieu-nhan" && mon.lure) y.push({ key: "lure", label: chipLabel(card.id, "lure"), go: () => aimSkill(3), slide: aimed(3) });
    else if (!spent.has("charm") && you.orb >= charm) {
      y.push({
        key: "charm",
        label: chipLabel(card.id, "charm"),
        go: () => (card.id === "nu-chua-dieu-nhan" ? onLure(uid) : aimSkill(1)),
        ...(card.id === "nu-chua-dieu-nhan" ? {} : { slide: aimed(1) }),
      });
    }
  }
  if (attackable && !noSkill && card.id === "hiep-si-huyen-bi" && !duel.parley && you.orb >= 2) {
    z.push({ key: "talk", label: tr("Đàm phán"), go: () => apply(startParley(duel, uid)) });
  }
  if (attackable && !noSkill && card.id === "phu-thuy-thoi-gian" && you.orb >= 2 && sword) y.push({ key: "all", label: chipLabel(card.id, "all"), go: () => onChronoFlow(uid) });
  if (attackable && !noSkill && card.id === "rong-boc-trung") {
    y.push({
      key: "stance",
      label: mon.stance === "guard" ? chipLabel(card.id, "stanceAttack") : chipLabel(card.id, "stanceGuard"),
      go: () => apply(toggleStance(duel, uid)),
    });
  }
  if (card.id === "ken-ngai" && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.level ?? 0) >= 4 && (mon.level ?? 0) <= 5) {
    y.push({ key: "hatch", label: chipLabel(card.id, "hatch"), go: () => apply(useSkill(duel, uid, null, 1)) });
  }
  if (attackable && card.id === "may-quay-thuong" && !mon.spun && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0) {
    y.push({
      key: "reel",
      label: chipLabel(card.id, "reel"),
      go: () => {
        setAim(null);
        apply(startReel(duel, uid));
      },
    });
  }
  if (attackable && !noSkill && card.id === "may-quay-thuong" && you.orb >= 1 && sword) y.push({ key: "rage", label: chipLabel(card.id, "rage"), go: () => aimSkill(1), slide: aimed(1) });
  if (attackable && !noSkill && card.id === "trai-tim-hai-long" && sword) {
    y.push({ key: "tide", label: chipLabel(card.id, "tide"), go: () => setAim({ kind: "tide", uid }) });
  }
  if (mon.cardId === "yeu-tinh-chuc-phuc" && monsterAlert(duel, mon, side) && afford(skillManaCost(mon.cardId, 1))) {
    z.push({
      key: "bless",
      label: blessOn ? tr("Đang chờ buff") : chipLabel(mon.cardId, "bless"),
      go: () => {
        const pending = duel.pending;
        if (pending?.kind === "melee" && pending.defender) {
          apply(answerFairy(duel, pending.defender, true));
          return;
        }
        onBless();
      },
    });
  }
  if (side === viewer && harpyAlert(duel, mon, viewer)) {
    if (harpyOffer(duel, viewer) === "armor") z.push({ key: "armor", label: chipLabel(card.id, "armor"), go: () => apply(harpyWard(duel)) });
    else z.push({ key: "lash", label: chipLabel(card.id, "lash"), go: () => apply(harpyLash(duel)) });
  }
  if (side === viewer && mon.cardId === "hiep-si-ho-ve" && canDispatch(duel, uid)) {
    z.push({ key: "dispatch", label: tr("Điều động"), go: () => apply(dispatchKnight(duel, uid)) });
  }
  if (canWall(duel, uid) && !mon.dim) {
    z.push({ key: "wall", label: chipLabel(mon.cardId, "wall"), go: () => apply(wallAlly(duel, uid)) });
  }
  if (canStand(duel, uid)) {
    z.push({ key: "stand", label: chipLabel(mon.cardId, "stand"), go: () => apply(standFor(duel, uid)) });
  }
  if (canGuardCover(duel, uid)) {
    z.push({ key: "cover", label: card.id === "hiep-si-huyen-bi" ? tr("Phòng ngự") : tr("Kiếm phòng ngự"), go: () => apply(guardCover(duel, uid)) });
  }
  if (canSpirit(duel, uid) && !mon.dim) {
    z.push({ key: "cover", label: chipLabel("thien-than-be-nho", "cover"), go: () => apply(spiritCover(duel, uid)) });
  }
  if (!mon.dim && card.id === "kizuran" && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.cover || you.field.some((unit) => unit && unit.cardId === "kazura" && unit.hp > 0))) {
    z.push({ key: "cover", label: mon.cover ? tr("Ngừng đỡ") : chipLabel(card.id, "cover"), go: () => apply(setCover(duel, uid, !mon.cover)) });
  }
  if (gnawReady(duel, mon, side)) {
    const pending = duel.pending;
    if (!(pending?.kind === "beam" && pending.target && pending.target !== uid)) {
      z.push({
        key: "guard",
        label: chipLabel(card.id, "guard"),
        go: () =>
          apply(
            pending?.kind === "beam"
              ? boostGnawOnChain(duel, uid)
              : pending?.kind === "face"
                ? assignBlock(duel, uid, true)
                : boostGnawOnChain(duel, uid),
          ),
      });
    }
  }
  // Luật L2: quái ẩn kiểu 2 đủ vòng chờ thì chớp hồng, bấm Kích hoạt.
  if (attackable && !riposte && lurkReady(mon) && duel.step === "main" && duel.turn === side && mon.stun <= 0 && (mon.chain ?? 0) === 0) {
    y.unshift({ key: "lurk-wake", label: "Kích hoạt", go: () => apply(wakeLurk(duel, uid)) });
  }
  const strikeShown = attackable && sword && !noAttack && (visibleStats(mon, you.field).atk > 0 || boulder(mon));
  if (!strikeShown && y.length === 0 && z.length === 0) return null;

  // Each button shows the skill's emblem and name as on the monster sheet: the colour of its kind there, or blue
  // for a skill and red for a reaction when the sheet has no such skill. Attack is orange.
  const lookOf = (label: string, tone: "y" | "z"): { icon: string; kind: UnitActKind } => {
    const hit = bookSkill(card.id, label, card.skill ?? "");
    const kind = hit && hit.kind !== "passive" && hit.kind !== "note" ? hit.kind : tone === "z" ? "risk" : "active";
    return { icon: hit?.icon ?? (tone === "z" ? "magic-swirl" : "sparkles"), kind };
  };
  const rows: Array<Row & { icon: string; kind: UnitActKind }> = [
    ...(strikeShown
      ? [
          {
            key: "attack",
            label: attackLabel(),
            go: () => (riposte ? apply(pickCounter(duel, "phys")) : setAim({ kind: "attack", uid })),
            icon: "sword-clash",
            kind: "attack" as const,
            ...(riposte ? {} : { slide: { kind: "attack", uid } as ChipSlide }),
          },
        ]
      : []),
    ...y.map((item) => ({ ...item, ...lookOf(item.label, "y") })),
    ...z.map((item) => ({ ...item, ...lookOf(item.label, "z") })),
  ];
  const soloRed = z.length === 1 && y.length === 0 && !strikeShown;
  return { rows, box, soloRed };
}

function UnitChips({
  duel,
  uid,
  viewer,
  attackable,
  riposte = false,
  blessOn,
  onBless,
  onChronoFlow,
  onLure,
  onRebirth,
  onSlide,
  setAim,
  apply,
  onAsk,
}: {
  duel: Duel;
  uid: string;
  viewer: Side;
  attackable: boolean;
  /** Trả đòn (luật 6 ô): quái vừa chịu đòn chọn đánh thường hoặc kỹ năng để đánh trả, dù đang mệt. */
  riposte?: boolean;
  blessOn: boolean;
  onBless: () => void;
  onChronoFlow: (uid: string) => void;
  onLure: (uid: string) => void;
  onRebirth?: (uid: string) => void;
  /** Ấn giữ rồi trượt (chủ game 31/10): a button that picks a target starts a slide to it. */
  onSlide?: (slide: ChipSlide, go: () => void, event: ReactPointerEvent<HTMLButtonElement>) => void;
  setAim: (aim: Aim | null) => void;
  apply: (next: Duel) => void;
  /** K5: a press goes through the confirm panel first. */
  onAsk?: (uid: string, row: UnitRow) => void;
}) {
  const built = unitRows({ duel, uid, viewer, attackable, riposte, blessOn, onBless, onChronoFlow, onLure, onRebirth, setAim, apply });
  if (!built) return null;
  return <UnitActs rows={built.rows} box={built.box} soloRed={built.soloRed} riposte={riposte} rite={riposte && duel.rites?.strike === uid} free={Boolean(riposte && duel.counterAsk?.free)} onSlide={onSlide} onAsk={onAsk ? (row) => onAsk(uid, row) : undefined} />;
}

/** The list of buttons above a monster on the field (tapped, or dragged onto a target). */
function UnitActs({ rows, box, soloRed, riposte = false, free = false, rite = false, onSlide, onAsk }: { rows: UnitRow[]; box: { x: number; y: number; w: number; h: number }; soloRed: boolean; riposte?: boolean; /** Quả trứng thiên sứ: this Trả đòn costs no fee. */ free?: boolean; /** Đòn cuối cùng: quái đã chết đang ra đòn cuối, không tốn phí Trả đòn. */ rite?: boolean; onSlide?: (slide: ChipSlide, go: () => void, event: ReactPointerEvent<HTMLButtonElement>) => void; /** K5: a press goes through the confirm panel first. */ onAsk?: (row: UnitRow) => void }) {
  const wide = Math.max(box.w + 8, 31);
  const left = Math.min(Math.max(box.x + box.w / 2 - wide / 2, 1), 99 - wide);
  return (
    <div className={`unit-acts${riposte ? " is-riposte" : ""}`} style={{ left: `${left}%`, width: `${wide}%`, ...(soloRed ? { top: `${box.y + box.h * 0.3}%` } : { bottom: `${100 - box.y + 0.8}%` }) } as CSSProperties}>
      {riposte ? <p className="riposte-title">{rite ? tr("Đòn cuối cùng") : tr("Trả đòn")} {rite || free ? null : <small>{tr("(+1 mana)")}</small>}</p> : null}
      {rows.map((row) => (
        <button
          key={row.key}
          type="button"
          className={`unit-act is-${row.kind} press`}
          onClick={onAsk ? () => onAsk(row) : row.go}
          onPointerDown={row.slide && onSlide ? (event) => onSlide(row.slide!, row.go, event) : undefined}
        >
          <span className="unit-act-ico">
            <span className="unit-act-core">
              <SkillGlyph name={row.icon} />
            </span>
            <Rim kind={row.kind} />
          </span>
          <span className="unit-act-name">{tr(row.label)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The round 3D icon on a card in hand after one tap (chủ game 28/10): Dùng phép on a spell, or the skill a monster
 * flashing orange uses from the hand.
 */
function HandUse({ icon, kind, label, onUse }: { icon: string; kind: UnitActKind; label: string; onUse: () => void }) {
  return (
    <button
      type="button"
      className={`hand-use is-${kind}`}
      aria-label={tr(label)}
      onClick={(event) => {
        event.stopPropagation();
        onUse();
      }}
    >
      <span className="unit-act-ico">
        <span className="unit-act-core">
          <SkillGlyph name={icon} />
        </span>
        <Rim kind={kind} />
      </span>
    </button>
  );
}

/** Mũi tên khuyên rút (chủ game 13/11): hiện trên xấp bài khi rút được, vài giây thì tắt; không rút cũng được. */
function DrawHint({ on }: { on: boolean }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!on) {
      setShown(false);
      return;
    }
    setShown(true);
    const timer = window.setTimeout(() => setShown(false), 4500);
    return () => window.clearTimeout(timer);
  }, [on]);
  if (!shown) return null;
  return (
    <span className="draw-hint" aria-hidden="true">
      <em>{tr("Rút")}</em>
      <svg viewBox="0 0 60 40">
        <path d="M16 2 L44 2 L44 16 L58 16 L30 38 L2 16 L16 16 Z" />
      </svg>
    </span>
  );
}

function RiteRing() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!video || !canvas || !ctx) return;
    let alive = true;
    const paint = () => {
      if (!alive) return;
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;
        const holeX = Math.round((222 * canvas.width) / 784);
        const holeY = Math.round((289 * canvas.height) / 1168);
        const holeR = Math.round((572 * canvas.width) / 784);
        const holeB = Math.round((872 * canvas.height) / 1168);
        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            const i = (y * canvas.width + x) * 4;
            if (x >= holeX && x < holeR && y >= holeY && y < holeB) {
              data[i + 3] = 0;
              continue;
            }
            const max = Math.max(data[i], data[i + 1], data[i + 2]);
            data[i + 3] = max < 22 ? 0 : max < 58 ? Math.round(((max - 22) / 36) * 255) : 255;
          }
        }
        ctx.putImageData(frame, 0, 0);
      }
      requestAnimationFrame(paint);
    };
    const frame = requestAnimationFrame(paint);
    void video.play();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <>
      <video ref={videoRef} className="rite-src" src={fxUrl("/fx/hien-te-vong.mp4?v=2")} autoPlay loop playsInline />
      <canvas ref={canvasRef} className="rite-ring" width={240} height={358} />
    </>
  );
}

function KnightPick({
  room,
  onPick,
  onSkip,
}: {
  room: 1 | 2;
  onPick: (picks: Array<"atk" | "def" | "hp">) => void;
  onSkip: () => void;
}) {
  const [picks, setPicks] = useState<Array<"atk" | "def" | "hp">>([]);
  const choose = (pick: "atk" | "def" | "hp") => {
    const next = picks.includes(pick) ? picks.filter((item) => item !== pick) : [...picks, pick].slice(-room);
    setPicks(next);
  };
  return (
    <div className="overlay is-ask">
      <div className="ask-card">
        <p>{room === 2 ? askLabel("ky-si-bong-toi", "pick2") : askLabel("ky-si-bong-toi", "pick1")}</p>
        <button type="button" className={picks.includes("atk") ? "on" : ""} onClick={() => choose("atk")}>{tr("+3 công")}</button>
        <button type="button" className={picks.includes("def") ? "on" : ""} onClick={() => choose("def")}>{tr("+2 thủ")}</button>
        <button type="button" className={picks.includes("hp") ? "on" : ""} onClick={() => choose("hp")}>{tr("+2 máu tối đa")}</button>
        <button type="button" disabled={picks.length === 0} onClick={() => onPick(picks.slice(0, room))}>{tr("Chọn")}</button>
        <button type="button" onClick={onSkip}>{tr("Bỏ qua")}</button>
      </div>
    </div>
  );
}

/** The orange number a monster shows on the field (charge, blocks left, level…), or "" for none. */
function fieldCount(mon: FieldMon, allies: Array<FieldMon | null>): number | string {
  return (
    // Kuriboh đã kích hoạt Cấp số nhân (chủ game 21/11): icon x2 ở ô số cam.
    mon.cardId === "cuc-bong-ma-quai" && mon.mult
      ? "×2"
      : (mon.cardId === "ga-he-dang-so" || mon.cardId === "tho-den-tinh-nghich") && mon.charge > 0
      ? mon.charge
      : (mon.cardId === "kazura" || mon.cardId === "kizuran") && allies.some((unit) => unit && unit.cardId === (mon.cardId === "kazura" ? "kizuran" : "kazura") && unit.hp > 0)
        ? allies.reduce((sum, unit) => sum + (unit && unit.cardId === (mon.cardId === "kazura" ? "kizuran" : "kazura") && unit.hp > 0 ? (unit.stored ?? 0) : 0), 0) || ""
      : clockForm(mon.cardId) && !mon.lurk
        ? mon.clockLeft ?? 2
      : mon.cardId === "te-giac-be-con"
        ? rhinoProgress(mon) ?? ""
      : mon.cardId === "ken-ngai"
        ? mon.level ?? 0
        : mon.cardId === "con-thinh-no-cua-hai-vuong"
          ? 2 + 3 * (mon.stored ?? 0)
        : (mon.level ?? 1) > 1
          ? (mon.level ?? 1)
          : ""
  );
}

/** Icon gốc của skill đứng cạnh số đếm của từng quái (chủ game 22/11: dùng đúng icon skill, không đổi). */
const COUNT_ICON: Record<string, string> = {
  "cuc-bong-ma-quai": "three-friends",
  "ga-he-dang-so": "concentration-orb",
  "tho-den-tinh-nghich": "rabbit",
  "kazura": "hunting-bolas",
  "kizuran": "heart-shield",
  "ken-ngai": "butterfly",
  "te-giac-be-con": "round-star",
  "con-thinh-no-cua-hai-vuong": "guardian-shield",
  "hiep-si-ho-ve": "growth",
  "chien-binh-rong": "scale-mail",
  "nu-chua-dieu-nhan-hoan-my": "spiked-shell",
  "hiep-si-huyen-bi": "magic-shield",
};

/** Màu số đếm: trắng là lượt bình thường; Gã hề hồng khi đủ thi triển, đỏ khi đã mạnh hơn lần sau; Kén hồng khi đủ lượt
 *  mở kén, đỏ khi qua mốc đó. */
function countTone(mon: FieldMon): CountPart["tone"] {
  if (mon.cardId === "ga-he-dang-so") return mon.charge >= 4 ? "red" : mon.charge >= 2 ? "pink" : "white";
  if (mon.cardId === "ken-ngai") return (mon.level ?? 0) >= 6 ? "red" : (mon.level ?? 0) >= 4 ? "pink" : "white";
  return "white";
}

/** The number parts beside the icon: one number, or the three debts of Vảy rồng (vật lý vàng, phép tím, chuẩn xám). */
function countParts(mon: FieldMon, text: string, debt: Array<{ k: "p" | "s" | "t"; n: number }>): CountPart[] {
  if (debt.some((part) => part.n > 0)) {
    return debt.map((part) => ({ text: part.n > 0 ? String(part.n) : "", tone: part.k === "p" ? "phys" : part.k === "s" ? "ward" : "tru" }));
  }
  return [{ text, tone: countTone(mon) }];
}

/** The monster as it stands on the field, without its name (the sheet shows the name beside it). */
function SheetCard({ mon, allies, layout }: { mon: FieldMon; allies: Array<FieldMon | null>; layout: ReturnType<typeof loadField> }) {
  const stats = visibleStats(mon, allies);
  const spotsNow = SHEET_SPOTS;
  const spot = (key: FieldKey, value: number, blue: boolean, cut = false) =>
    value === 0 ? null : (
      <span
        className={`fstat is-${key}${value < 0 || cut ? " is-red" : key === "atk" && spellAtk(mon) ? " is-spellatk" : blue ? " is-blue" : ""}`}
        style={{
          left: `${spotsNow[key].x}%`,
          top: `${spotsNow[key].y}%`,
          fontSize: cardText(spotsNow[key].size, "cqmin"),
          width: `${spotsNow[key].width}%`,
          height: `${spotsNow[key].height}%`,
        }}
      >
        {value}
      </span>
    );
  const art = artSrc(mon.cardId, mon.level);
  return (
    <span className="sheet-unit">
      <span className="field-unit">
        {art ? <img className="art" src={art} alt="" draggable={false} /> : null}
        <img className="frame" src="/ui/frame-sheet.png" alt="" draggable={false} />
        {spot("def", stats.def, stats.blueDef, fakeCut(mon, "def", stats.def))}
        {spot("mdef", stats.mdef, stats.blueMdef, fakeCut(mon, "mdef", stats.mdef))}
        {spot("atk", stats.atk, stats.blueAtk, fakeCut(mon, "atk", stats.atk))}
        {spot("hp", mon.hp, stats.blueHp, fakeCut(mon, "hp", mon.hp))}
        <KeywordRow cardId={mon.cardId} />
      </span>
    </span>
  );
}

/** The count tile on the monster sheet: the skill icon square with its coloured number(s), like on the field. */
function sheetBadge(mon: FieldMon, allies: Array<FieldMon | null>) {
  const text = sheetCount(mon, allies);
  const due = mon.cardId === "chien-binh-rong" || mon.cardId === "nu-chua-dieu-nhan-hoan-my" || mon.cardId === "hiep-si-ho-ve" || mon.cardId === "hiep-si-huyen-bi" ? mon.debt?.[0] : undefined;
  const slim = mon.cardId === "nu-chua-dieu-nhan-hoan-my" || mon.cardId === "hiep-si-ho-ve" || mon.cardId === "hiep-si-huyen-bi";
  const debt = [
    { k: "p" as const, n: due?.p ?? 0 },
    { k: "s" as const, n: due?.s ?? 0 },
    ...(slim ? [] : [{ k: "t" as const, n: due?.t ?? 0 }]),
  ];
  const owed = debt.some((part) => part.n > 0);
  if (!owed && !text) return null;
  const counted = owed || (() => { const c = fieldCount(mon, allies); return c !== "" && c !== 0; })();
  return <CountBadge sheet debt={owed} icon={counted ? COUNT_ICON[mon.cardId] : undefined} parts={countParts(mon, text, owed ? debt : [])} />;
}

function sheetCount(mon: FieldMon, allies: Array<FieldMon | null>): string {
  const count = fieldCount(mon, allies);
  if (count !== "" && count !== 0) return String(count);
  return (mon.shown ?? 0) > 0 ? String(mon.shown) : "";
}

/** The opponent's hand fan in the card tray (the red banner): its middle sits `lift`% of the full board picture above the
 *  hand count, the cards `gap` cqw apart along the banner's arch (each step `turn` degrees, lower by `drop` cqw × k²). */
const FOE_FAN = { lift: 0.7, most: 7, turn: 6, gap: 5.6, drop: 0.2 } as const;

/** The turn light's tanks on the full board picture (board-cut.ts maps them onto a cut board): the walls at the two
 *  edges of the screen, each bottom flush with the edge of that side's area (chủ game 30/10: no gap between), both open
 *  toward the middle. */
const TANK_WALLS = [0, 100] as const;
/** Đáy mỗi bể = mép dải đá của bên đó (đọc theo bàn đang dùng). */
const tankBase = () => ({ foe: redEnd(), you: blueStart() });
/** Độ sâu bể (phần trăm chiều cao bàn đầy đủ): khoảng một ô gạch, ~54 px trên màn rộng 390. */
const TANK_DEPTH = 6.2;

/** A board pin (Grok layout): centred on its spot, sized by width × size of the board. */
function pinBox(spot: { x: number; y: number; width: number; height: number; size: number }): CSSProperties {
  const scale = spot.size || 1;
  return { left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.width * scale}%`, height: `${spot.height * scale}%` };
}

/** A round 3D button on a board pin: as wide as the pin. */
function pinMedal(spot: { x: number; y: number; width: number; size: number }): CSSProperties {
  return { left: `${spot.x}%`, top: `${spot.y}%`, "--medal": `calc(${spot.width * (spot.size || 1)} * var(--cqw))` } as CSSProperties;
}

/** Ảnh bàn đang dùng (A hoặc B, board-cut.ts): luôn hiện đủ, không cắt (chủ game 15/11). Môi trường Núi dung nham tạm dùng chung bàn này. */
function BoardArt({ src }: { src: string; bottom?: string; cut?: BoardCut }) {
  return <img className="board-art" src={src} alt="" />;
}

/** V6 (chủ game 03/11): viền neon của ô đang chọn nằm TRÊN lá đang kéo, không bị lá che. */
function SnapTop({ keyName }: { keyName: string; x: number; y: number }) {
  const el = document.querySelector<HTMLElement>(keyName === "face" ? ".face-drop" : `[data-slot="${keyName}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return <div className={`snap-top${keyName === "face" ? " is-face" : ""}`} style={{ left: r.left, top: r.top, width: r.width, height: r.height }} />;
}

function BoardSlot({
  mon,
  side,
  index,
  layout: _layout,
  near,
  hot,
  blocked = false,
  fuse = false,
  fuseHide = false,
  tone = "monster",
  picked = false,
  snapped = false,
  attack,
  shift = null,
  thrust = false,
  ramAng,
  rouseTone,
  lifted = false,
  motion,
  ghosting,
  frozen = false,
  fading = false,
  bare = false,
  prime = false,
  hpOverride,
  alert = false,
  ready = false,
  block = false,
  alertColor,
  lurk = false,
  unveil,
  fog = false,
  veil = false,
  mask = false,
  decoy = false,
  lockFlash = false,
  allies = [],
  forecast,
  onSlot,
  onUnit,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  mon: FieldMon | null;
  side: Side;
  near?: boolean;
  index: number;
  layout: ReturnType<typeof loadField>;
  hot: boolean;
  /** T2 (chủ game 01/11): a monster the current attack, skill or spell cannot pick, red outline and glow. */
  blocked?: boolean;
  fuse?: boolean;
  fuseHide?: boolean;
  tone?: "monster" | "skill" | "summon" | "spell";
  picked?: boolean;
  /** Chọn mục tiêu thông minh: the target a drag will land on. */
  snapped?: boolean;
  attack: boolean;
  shift?: { x: number; y: number } | null;
  /** The last thrust of a landing blow: a quick move in place of the slow lunge. */
  thrust?: false | "back" | "ram" | "rouse" | "cast" | "mount";
  /** K2: the light of the skill this monster is rousing for. */
  rouseTone?: string;
  /** Chủ game 16/11: the card is lifted off the board for a moment while it flares (its skill is queued). */
  lifted?: boolean;
  /** The way a ramming blow travels on the screen (radians): the speed trail streams the other way. */
  ramAng?: number;
  motion: Motion;
  ghosting?: boolean;
  frozen?: boolean;
  fading?: boolean;
  /** Drawn to fill its parent, without the slot attributes: the card inside the shatter effect. */
  bare?: boolean;
  hpOverride?: number;
  prime?: boolean;
  alert?: boolean;
  /** Chủ game 14/11: my monster that can still act in my attack round, green breathing glow like a summonable hand card. */
  ready?: boolean;
  /** Chủ game 14/11: my monster that can block the blow now, yellow breathing glow. */
  block?: boolean;
  alertColor?: string;
  /** Luật L2: quái ẩn của mình, glow trắng đứng yên. */
  lurk?: boolean;
  /** Quái ẩn vừa lật: `own` lật bài, `foe` xoá sương mù. */
  unveil?: "own" | "foe";
  fog?: boolean;
  veil?: boolean;
  mask?: boolean;
  decoy?: boolean;
  lockFlash?: boolean;
  allies?: Array<FieldMon | null>;
  /** Con mắt: this monster after the queue goes through (its numbers then, or `dead`), only what is certain. */
  forecast?: Forecast;
  onSlot: (side: Side, index: number) => void;
  onUnit: (side: Side, mon: FieldMon) => void;
  onPointerDown?: (event: ReactPointerEvent) => void;
  onPointerMove?: (event: ReactPointerEvent) => void;
  onPointerUp?: (event: ReactPointerEvent) => void;
}) {
  const cls = `slot slot-${near ? "y" : "f"}${index}${hot ? ` is-hot is-${tone}` : ""}${fuse ? " is-fuse" : ""}${picked ? " is-picked" : ""}${snapped ? " is-snap" : ""}${blocked && !snapped ? " is-blocked" : ""}${attack ? " is-attack" : ""}${alert ? " is-alert" : ""}${ready && !alert && !lurk ? " is-ready" : ""}${block && !alert && !lurk ? " is-block" : ""}${lurk && !alert ? " is-lurk" : ""}${fading ? " is-falling" : ""}${motion.pops.includes(`${side}-${index}`) ? " summon-pop" : ""}${mon && motion.hits.includes(mon.uid) ? " is-hit" : ""}${lifted ? " is-lift" : ""}${thrust === "rouse" ? " is-rouse" : thrust ? ` is-thrust${thrust === "back" ? " is-windup" : thrust === "cast" ? " is-cast" : thrust === "mount" ? " is-mount" : ""}` : ""}${mon && forecast?.dead && !veil && !mask && !decoy ? " is-doomed" : ""}`;
  // Where the slot stands on the (possibly cut) board; the slot-f / slot-y classes hold the uncut numbers.
  const seat = SLOT_BOX[near ? 0 : 1][index];
  const place: CSSProperties = bare ? { left: 0, top: 0, width: "100%", height: "100%" } : { left: `${seat.x}%`, top: `${seat.y}%`, width: `${seat.w}%`, height: `${seat.h}%`, ...(alert && alertColor ? ({ "--alert-color": alertColor } as CSSProperties) : {}), ...(rouseTone ? ({ "--rouse": rouseTone } as CSSProperties) : {}) };
  const slotProps = bare ? {} : {
    "data-slot": `${side}-${index}`,
    "data-owner": side,
    "data-index": index,
    "data-empty": mon && !frozen ? "0" : "1",
    "data-uid": frozen ? "" : mon?.uid ?? "",
  };
  if (!mon) {
    return <button type="button" className={cls} style={place} aria-label={`Ô ${index + 1}`} {...slotProps} onClick={() => onSlot(side, index)} />;
  }
  const tokenName = (monsterCard(mon.cardId)?.stars ?? 1) <= 0;
  const layout = fieldSpots();
  const stats = visibleStats(mon, allies);
  const spot = (key: FieldKey, value: string | number, blue = false, hold = false, cut = false) => {
    // Con mắt: a number the queue changes shows as it will be, red when it falls, green when it rises (0 included).
    const shift = forecast && !veil && !mask && !decoy && (key === "atk" || key === "def" || key === "mdef" || key === "hp") ? forecast.gain[key] : 0;
    if (shift && typeof value === "number") value += shift;
    if (typeof value === "number" && value === 0 && !shift) return null;
    const red = !shift && ((typeof value === "number" && value < 0) || cut);
    return (
    <span
      className={`fstat${key === "def" || key === "mdef" || key === "atk" || key === "hp" ? ` is-${key}` : ""}${key === "name" ? " fname" : ""}${key === "count" ? " is-count" : ""}${hold ? " is-hold" : ""}${tokenName && key === "name" ? " is-token" : ""}${red ? " is-red" : ""}${!red && !shift && key === "atk" && spellAtk(mon) ? " is-spellatk" : !red && !shift && blue ? " is-blue" : ""}${shift < 0 ? " is-loss" : shift > 0 ? " is-gain" : ""}`}
      style={{
        left: `${layout[key].x}%`,
        top: `${layout[key].y}%`,
        fontSize: cardText(hold ? Math.round(layout[key].size * 1.18) : layout[key].size, "cqmin"),
        width: `${hold ? Math.min(48, Math.round(layout[key].width * 1.45)) : layout[key].width}%`,
        height: `${layout[key].height}%`,
      }}
    >
      {key === "name" && typeof value === "string" ? tr(value) : value}
    </span>
    );
  };
  const bind = Math.max(mon.stun, mon.chain ?? 0, mon.gag ?? 0, mon.path ?? 0);
  const count = fieldCount(mon, allies);
  const glassLabel = mon.glass ? tr("Suy") : "";
  const lit = (mon.shown ?? 0) > 0 ? mon.shown ?? 0 : 0;
  const counted = count !== "" && count !== 0;
  const countShown = counted ? String(count) : lit > 0 ? String(lit) : "";
  const due = !veil && !mask && (mon.cardId === "chien-binh-rong" || mon.cardId === "nu-chua-dieu-nhan-hoan-my" || mon.cardId === "hiep-si-ho-ve" || mon.cardId === "hiep-si-huyen-bi") ? mon.debt?.[0] : undefined;
  const debtSlots = [
    { k: "p" as const, n: due?.p ?? 0 },
    { k: "s" as const, n: due?.s ?? 0 },
    ...(mon.cardId === "nu-chua-dieu-nhan-hoan-my" || mon.cardId === "hiep-si-ho-ve" || mon.cardId === "hiep-si-huyen-bi" ? [] : [{ k: "t" as const, n: due?.t ?? 0 }]),
  ];
  const debtOn = debtSlots.some((part) => part.n > 0);
  const hideName = countShown.length >= 2 || debtOn;
  const lunging = Boolean(shift);
  return (
    <button
      type="button"
      className={`${cls}${lunging ? " is-lunging" : ""}`}
      style={shift ? { ...place, transform: `translate(${shift.x}%, ${shift.y}%)` } : place}
      {...slotProps}
      onClick={frozen ? undefined : () => onUnit(side, mon)}
      onPointerDown={frozen ? undefined : onPointerDown}
      onPointerMove={frozen ? undefined : onPointerMove}
      onPointerUp={frozen ? undefined : onPointerUp}
    >
      {thrust === "rouse" || thrust === "cast" ? <i className="rouse-aura" aria-hidden="true" /> : null}
      {thrust === "ram" && ramAng !== undefined ? <i className="ram-trail" style={{ "--ang": `${ramAng}rad` } as CSSProperties} aria-hidden="true" /> : null}
      <span
        className={`field-unit${mask ? "" : `${tired(mon) || bind > 0 || lockFlash || hexLocked(mon) ? " is-dim" : ""}${lockFlash ? " is-lockflash" : ""}${prime ? " is-prime" : ""}`}${lunging ? " is-lunging" : ""}${motion.hits.includes(mon.uid) ? " is-hit" : ""}${ghosting ? " is-dim" : ""}${fuseHide ? " is-fuse-hide" : ""}`}
      >
        {unveil === "own" ? <img className="lurk-turn" src="/ui/card-back-you.webp" alt="" draggable={false} /> : null}
        <span className={`fu-body${unveil === "own" ? " is-flip" : ""}`}>
        {lurk && !veil ? <img className="lurk-back" src="/ui/card-back-you.webp" alt="" draggable={false} /> : null}
        {fog || unveil === "foe" ? <img className={`lurk-fog${unveil === "foe" ? " is-out" : ""}`} src="/ui/suong-mu-dung.webp" alt="" draggable={false} /> : null}
        {unveil === "foe" ? <FogWipe /> : null}
        {artSrc(mask ? "mu" : mon.cardId, mask ? 1 : mon.level) ? <img className="art" src={artSrc(mask ? "mu" : mon.cardId, mask ? 1 : mon.level)} alt="" draggable={false} style={veil ? { filter: "brightness(0)" } : undefined} /> : null}
        <img className="frame" src="/ui/frame-hand-nogem.png" alt="" draggable={false} />
        {veil || decoy || mask ? null : <KeywordRow cardId={mon.cardId} />}
        {veil || decoy ? (decoy ? null : <i className="sea-veil">{tr("Ẩn")}</i>) : mask ? null : (
        <span className="badges">
          {bind > 0 ? <i className="is-hold">{bind >= 90 ? "∞" : bind}</i> : null}
          {(mon.lava ?? 0) > 0 ? <i className="is-lava">{mon.lava}</i> : null}
          {mon.curse ? <i className="is-harm">∞</i> : null}
          {mon.vulnerable > 0 ? <i>X2</i> : null}
          {mon.noBlock && !isStill(mon.cardId) ? <i>{tr("Cấm")}</i> : null}
          {mon.poison ? <i className="is-harm">{mon.poison.left == null || mon.poison.left >= 90 ? "∞" : mon.poison.left}</i> : null}
          {mon.hex && mon.hex.left > 0 ? <i className="is-harm">{mon.hex.left}</i> : null}
          {(mon.wet ?? 0) > 0 ? <i>{tr("Ẩm")}</i> : null}
          {mon.cover ? <i>{tr("Đỡ")}</i> : null}
          {mon.oath?.phys ? <i className="is-ward-phys">{tr("Khiên")}</i> : null}
          {mon.oath?.spell ? <i className="is-ward-spell">{tr("Phép")}</i> : null}
          {(mon.blessAtk ?? 0) > 0 || (mon.blessDmg ?? 0) > 0 ? <i>{tr("Hồi")}</i> : null}
          {glassLabel ? <i className="is-hold">{glassLabel}</i> : null}
          {mon.preyAim ? <i>{mon.preyKind === "spell" ? "Phép" : mon.preyKind === "tru" ? "Chuẩn" : "Vật"}</i> : null}
          {mon.cage ? <i>Khoá</i> : null}
        </span>
        )}
        {/* Lá sân không ghi tên (chủ game 03/11), giống lá trên tay. */}
        {veil || mask || decoy ? null : spot("def", stats.def, stats.blueDef, false, fakeCut(mon, "def", stats.def))}
        {veil || mask || decoy ? null : spot("mdef", stats.mdef, stats.blueMdef, false, fakeCut(mon, "mdef", stats.mdef))}
        {veil || mask || decoy ? null : spot("atk", stats.atk, stats.blueAtk, false, fakeCut(mon, "atk", stats.atk))}
        {veil ? null : spot("hp", decoy ? (mon.stored ?? 1) : mask ? 1 : (hpOverride ?? mon.hp), decoy || mask ? false : stats.blueHp, false, !decoy && !mask && fakeCut(mon, "hp", mon.hp))}
        {!mask && (debtOn ? !veil && !decoy : Boolean(countShown)) ? (
          <CountBadge
            icon={counted || debtOn ? COUNT_ICON[mon.cardId] : undefined}
            debt={debtOn}
            parts={countParts(mon, countShown, debtOn ? debtSlots : [])}
            style={{
              left: `${layout.count.x}%`,
              top: `${layout.count.y}%`,
              fontSize: cardText(layout.count.size, "cqmin"),
            }}
          />
        ) : null}
        </span>
      </span>
    </button>
  );
}

/** Hoán đổi with a card of the hand: the monster that leaves the field flies into the hand as a shrinking ghost of its card. */
function SwapGhost({ ghost, onDone }: { ghost: { mon: FieldMon; rect: { left: number; top: number; width: number; height: number }; to: { x: number; y: number } }; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dx = ghost.to.x - (ghost.rect.left + ghost.rect.width / 2);
    const dy = ghost.to.y - (ghost.rect.top + ghost.rect.height / 2);
    const run = el.animate([{ translate: "0px 0px", scale: "1", opacity: 1 }, { translate: `${dx}px ${dy}px`, scale: "0.3", opacity: 0 }], { duration: 720, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" });
    run.onfinish = onDone;
    return () => run.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const card = monsterCard(ghost.mon.cardId);
  if (!card) return null;
  return (
    <div ref={ref} style={{ position: "fixed", left: ghost.rect.left, top: ghost.rect.top, width: ghost.rect.width, height: ghost.rect.height, zIndex: 45, pointerEvents: "none" }}>
      <CardFace monster={card} level={ghost.mon.level ?? 1} live={{ name: fieldName(ghost.mon), atk: ghost.mon.atk, def: ghost.mon.def, mdef: ghost.mon.mdef, hp: ghost.mon.hp }} />
    </div>
  );
}

/** Dải điều khiển khi xem lại trận (chủ game 31/10): lùi 1 bước, chạy / tạm dừng, tới 1 bước, thanh tua kèm Vòng, x1/x2/x4. */
function ReplayBar({ pos, onMove, at, total, round, playing, speed, onSeek, onStep, onPlay, onSpeed, onExit }: { pos: { x: number; y: number } | null; onMove: (pos: { x: number; y: number }) => void; at: number; total: number; round: number; playing: boolean; speed: number; onSeek: (at: number) => void; onStep: (by: number) => void; onPlay: () => void; onSpeed: () => void; onExit: () => void }) {
  const icon = (d: string) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  const box = useRef<HTMLDivElement | null>(null);
  const grab = useRef<{ dx: number; dy: number } | null>(null);
  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    grab.current = { dx: event.clientX - (rect.left + rect.width / 2), dy: event.clientY - (rect.top + rect.height / 2) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const hold = grab.current;
    const rect = box.current?.getBoundingClientRect();
    if (!hold || !rect) return;
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    onMove({
      x: Math.min(Math.max(event.clientX - hold.dx, halfW), window.innerWidth - halfW),
      y: Math.min(Math.max(event.clientY - hold.dy, halfH), window.innerHeight - halfH),
    });
  };
  return (
    <div className="rp-bar" ref={box} style={pos ? { left: pos.x, top: pos.y } : undefined}>
      <div className="rp-top is-grip" onPointerDown={down} onPointerMove={drag} onPointerUp={() => (grab.current = null)} onPointerCancel={() => (grab.current = null)}>
        <b>{tr("XEM LẠI TRẬN")}</b>
        <span className="rp-round">
          {tr("Vòng")} {round}
        </span>
        <button type="button" className="rp-exit" onClick={onExit}>
          {tr("Thoát")}
        </button>
      </div>
      <input className="rp-seek" type="range" min={0} max={Math.max(0, total - 1)} value={at} onChange={(event) => onSeek(Number(event.target.value))} aria-label={tr("Tua trận")} style={{ ["--p" as string]: `${total > 1 ? (at / (total - 1)) * 100 : 0}%` }} />
      <div className="rp-keys">
        <button type="button" onClick={() => onStep(-1)} disabled={at <= 0} aria-label={tr("Lùi 1 bước")}>
          {icon("M6 5h2.4v14H6zM20 5v14L9.5 12z")}
        </button>
        <button type="button" className="rp-play" onClick={onPlay} aria-label={tr(playing ? "Tạm dừng" : "Chạy")}>
          {playing ? icon("M7 5h3.6v14H7zm6.4 0H17v14h-3.6z") : icon("M8 5v14l11-7z")}
        </button>
        <button type="button" onClick={() => onStep(1)} disabled={at >= total - 1} aria-label={tr("Tới 1 bước")}>
          {icon("M15.6 5H18v14h-2.4zM4 5l10.5 7L4 19z")}
        </button>
        <button type="button" className="rp-speed" onClick={onSpeed} aria-label={tr("Tốc độ")}>
          x{speed}
        </button>
        <span className="rp-count">
          {at + 1}/{total}
        </span>
      </div>
    </div>
  );
}

/** Skill chọn 2 mục tiêu (quái địch rồi quái của ta): Dụ dỗ của 2 nữ chúa, Mê hoặc của Harpie Lady (chủ game 25/11). */
function twoStep(cardId: string, index: number): boolean {
  if (cardId === "nu-chua-dieu-nhan" || cardId === "nu-chua-dieu-nhan-hoan-my") return index === 3;
  return cardId === "my-dieu-nhan" && index === 1;
}
