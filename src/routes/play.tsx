import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { CardFace, cardText } from "@/components/game/card-face";
import { CopyText } from "@/components/game/copy-text";
import { plainCopy } from "@/lib/copy-mark";
import { Painted } from "@/components/game/painted";
import { BoltBurst, FireBurst, LaserBeam, ShieldBurst, Spectacle, WaterBurst } from "@/components/game/spectacle";
import { ArenaFx } from "@/components/game/arena-fx";
import { artSrc, fakeMonsterCard, FORMS, isStill, MONSTERS, monsterCard, SPELLS, spellCard, spellSrc, type MonsterCard } from "@/lib/catalog";
import { askLabel, attackLabel, chipLabel, MONSTER_CHIPS } from "@/lib/card-edits";
import { fieldBindsFor } from "@/lib/field-chips";
import { playCue, playHit, setSound, soundOn, unlockSound } from "@/lib/sfx";
import { loadDeck } from "@/lib/deck";
import { fxUrl, matchJobs } from "@/lib/preload";
import { LoadScreen, type LoadFace } from "@/components/game/load-screen";
import { MatchIntro, type IntroSide } from "@/components/game/match-intro";
import { OpenerPanel, type OpenerCard } from "@/components/game/opener-panel";
import { Tutorial, type TutView } from "@/components/game/tutorial";
import { ActionButton, Glyph, GlyphDefs, MonsterSheet, Rim, type SheetAction, type UnitActKind } from "@/components/game/monster-sheet";
import { FUSE_BEATS, FuseDance, FusePic } from "@/components/game/fuse-dance";
import { Medal } from "@/components/game/medal";
import { skillsOf } from "@/lib/skill-book";
import { createTutorialDuel, TUTORIAL_MODE } from "@/lib/tutorial";
import { markTrial, TRIAL_KEY, TRIAL_MODE } from "@/lib/appraisal";
import { settleWin, type MatchReward } from "@/lib/missions";
import { MissionPanel } from "@/components/game/mission-panel";
import { EndScene } from "@/components/game/end-scene";
import { MatchSummary, type SummaryAgain, type SummarySeat } from "@/components/game/match-summary";
import { createTrialDuel, trialFoe, trialLevels, trialVerdict } from "@/lib/trial";
import { markTutorialDone } from "@/lib/tutorial-list";
import { absorb, freshScratch, loadHabits, saveHabits, watchSnap, type Scratch } from "@/lib/habits";
import { newMatchId, noteFinishedAi, openingDecks, warmMatchHistory, type OpeningDecks } from "@/lib/match-history";
import { setLang, tr, useLang } from "@/lib/i18n";
import { pollRoom, pushDuel, type NetSeat } from "@/lib/net-room";
import { MACHINE, withMachine } from "@/lib/machines";
import { brainStep, runAct } from "@/lib/brain";
import { think } from "@/lib/brain-client";
import { ownFace, roomFace } from "@/lib/match-faces";
import {
  assignBlock,
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
  declareSkill,
  dismissGlimpse,
  draw,
  endTurn,
  fieldName,
  harmShift,
  harmSkill,
  hornFit,
  skillLook,
  cottonCover,
  cottonOffer,
  chronoChoice,
  chronoHighAlly,
  rollTimeSector,
  digChoices,
  digGrave,
  passResponse,
  harpyOffer,
  harpyWard,
  harpyLash,
  answerPlume,
  answerPrey,
  evolveBird,
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
  armHorn,
  setCover,
  skillManaCost,
  skillFigure,
  summon,
  summonVow,
  previewMon,
  vowCap,
  fuse,
  testGrant,
  testEnv,
  testReset,
  canCastSwap,
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
} from "@/lib/duel";
import { findFusion, findKnightFusion, thirdKnight } from "@/lib/fusion";
import { COUNT_MARKS, DEFAULT_ACTIONS, loadAlertLook, loadField, markScale, matchBoard, type FieldKey } from "@/lib/layouts";
import { bottomArt, topArt } from "@/lib/env-boards";
import { spellFxLook } from "@/lib/card-fx";
import { ICON, ReactionLine, type EndSpot, type IconLook, type IconSpot } from "@/components/game/reaction-line";
import { stepChain, type ChainOrb, type FlowEnd } from "@/lib/reaction-chain";
import { RelatedFlow, SpellSheet } from "@/components/game/card-sheets";
import { SEA_KINDS } from "@/lib/env-kinds";
import { emitFx, LASER_MS } from "@/lib/spectacle";
import { fireBlastOn } from "@/lib/fx-prefs";

export const Route = createFileRoute("/play")({ component: PlayPage });

const SEA_IDS = new Set(SEA_KINDS);
const SEA_NAMES = SEA_KINDS.map((id) => monsterCard(id)?.name ?? "").filter(Boolean);

function seaVeiled(duel: Duel, viewer: Side, uid: string): boolean {
  if (!uid) return false;
  for (const side of [0, 1] as const) {
    const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
    if (!mon) continue;
    return side !== viewer && Boolean(duel.players[side].sea && SEA_IDS.has(mon.cardId) && !mon.shown);
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
  | { kind: "spell"; index: number; spellId: string; from?: string };

type Strike = { uid: string; face: boolean; foeUid: string | null };
/** Centre and width of a card on the board, in % of the board. */
type BoardSpot = { x: number; y: number; w: number };
/**
 * Fusion scene, after the owner's second reference video: both monsters rise to the middle (lift), smash into
 * each other (clash), spring apart (apart), are sucked into each other in a whirlpool, standing upright (swirl),
 * burst into a flash and whiteout (flash), and the fused monster turns a little on its upright axis as it
 * appears (turn). Its sheet asks to summon (reveal), and it lays down onto the slot with lightning (land).
 */
type FusePhase = "lift" | "clash" | "apart" | "swirl" | "flash" | "turn" | "reveal" | "land";
/** `third` and `c`: the third knight of a three-knight fusion and where it stands, so all three cards fly in. */
type FuseShow = { index: number; uid: string; slot: 0 | 1 | 2; resultId: string; phase: FusePhase; n: number; a: BoardSpot; b: BoardSpot; at: BoardSpot; third?: string; c?: BoardSpot };

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
type Inspect = { pile: "reserve" | "spell"; index: number } | { pile: "env"; id: string };
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
type Floater = { id: number; x: number; y: number; text: string; heal: boolean; spot: "self" | "target"; delay?: number };

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

const SLOT_POS: Record<Side, Array<{ x: number; y: number }>> = {
  0: [
    { x: 15, y: 70 },
    { x: 36, y: 70 },
    { x: 57, y: 70 },
  ],
  1: [
    { x: 21, y: 26 },
    { x: 40, y: 26 },
    { x: 59, y: 26 },
  ],
};

let floaterSeq = 1;

const SLOT_BOX: Record<Side, Array<{ x: number; y: number; w: number; h: number }>> = {
  0: [
    { x: 6, y: 63.5, w: 18, h: 13.5 },
    { x: 27, y: 63.5, w: 18, h: 13.5 },
    { x: 48, y: 63.5, w: 18, h: 13.5 },
  ],
  1: [
    { x: 13, y: 19.5, w: 16.5, h: 13 },
    { x: 32, y: 19.5, w: 16.5, h: 13 },
    { x: 51, y: 19.5, w: 16.5, h: 13 },
  ],
};

const HP_BOX: Record<Side, { x: number; y: number; w: number; h: number }> = {
  0: { x: 5, y: 82, w: 12, h: 7 },
  1: { x: 8, y: 5.5, w: 12, h: 7 },
};

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
  try {
    const raw = JSON.parse(sessionStorage.getItem("clash-net") ?? "null") as { seat?: string } | null;
    return raw?.seat === "host" || raw?.seat === "guest" ? raw.seat : null;
  } catch {
    return null;
  }
}

const TEST_DUEL_KEY = "clash-test-duel";

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

function boardActor(duel: Duel): Side {
  const picker = parleyPicker(duel);
  if (picker !== null) return picker;
  return (duel.step === "respond" && duel.hold ? duel.hold.priority : duel.turn) as Side;
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
const LUNGE_FACE = 0.42;
const LUNGE_MELEE = 0.56;
/** The icon's height and a little air on each side, in box units (the board is 90 × 160). */
const ICON_ROOM = (ICON * (9 / 16) + 1.2) * 1.6;

function lungeTravel(base: number, dx: number, dy: number): number {
  const dist = Math.hypot(dx * 0.9, dy * 1.6) || 1;
  return Math.max(0.05, base - ICON_ROOM / dist);
}

function attackShift(duel: Duel, uid: string, viewer: Side): { x: number; y: number } | null {
  const pending = duel.pending;
  if (duel.step !== "respond" || !pending || (pending.kind !== "face" && pending.kind !== "melee") || pending.attacker !== uid) return null;
  const attacker = fieldMon(duel, uid);
  if (attacker?.horn || attacker?.gaze) return null;
  if (seaVeiled(duel, viewer, uid)) return null;
  let fromSide: Side = 0;
  let fromIndex = -1;
  for (const side of [0, 1] as const) {
    const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
    if (index >= 0) {
      fromSide = side;
      fromIndex = index;
    }
  }
  if (fromIndex < 0) return null;
  const from = SLOT_BOX[screenSide(fromSide, viewer)][fromIndex];
  const foe = (1 - fromSide) as Side;
  const visualFoe = screenSide(foe, viewer);
  const foeIndex = pending.kind === "melee"
    ? duel.players[foe].field.findIndex((mon) => mon?.uid === (duel.hold?.blocker ?? pending.defender))
    : -1;
  const to = pending.kind === "face" ? HP_BOX[visualFoe] : foeIndex >= 0 ? SLOT_BOX[visualFoe][foeIndex] : null;
  if (!to) return null;
  const dx = to.x + to.w / 2 - (from.x + from.w / 2);
  const dy = to.y + to.h / 2 - (from.y + from.h / 2);
  const travel = lungeTravel(pending.kind === "face" ? LUNGE_FACE : LUNGE_MELEE, dx, dy);
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
  const face = HP_BOX[screenSide((1 - fromSide) as Side, viewer)];
  const dx = face.x + face.w / 2 - (from.x + from.w / 2);
  const dy = face.y + face.h / 2 - (from.y + from.h / 2);
  const travel = lungeTravel(LUNGE_FACE, dx, dy);
  return { x: from.x + from.w / 2 + dx * travel, y: from.y + from.h / 2 + dy * travel };
}

/**
 * A normal attack landing (chủ game 22/10, LoR): on a player, the attacker thrusts to the edge of that player's field
 * row, an electric dome lights where it hits and lightning runs along the edge of the board to the player's HP; on a
 * monster (attacked or blocking), the two cards collide. Hellfire balls and shots keep their own looks.
 */
type Landing =
  | { kind: "face"; uid: string; thrust: { x: number; y: number }; at: { x: number; y: number }; dir: -1 | 1; path: Array<[number, number]>; orb: { x: number; y: number } }
  | { kind: "clash"; uid: string; thrust: { x: number; y: number }; at: { x: number; y: number }; target: { x: number; y: number } };

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
    const hurt = !after || after.hp !== before.hp || fieldMon(next, attacker.uid)?.hp !== attacker.hp;
    if (!hurt) return null;
    const box = SLOT_BOX[screenSide(where.side, viewer)][where.index];
    const target = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const at = { x: from.x + (target.x - from.x) * 0.8, y: from.y + (target.y - from.y) * 0.8 };
    return { kind: "clash", uid: attacker.uid, thrust: toward(target, 0.72), at, target };
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
  return { kind: "face", uid: attacker.uid, thrust: toward(orb, reach * 0.9), at, dir: top ? -1 : 1, path, orb };
}

const SLOW_SPELLS = new Set(["sam-set-tan-the", "soi-xich-dia-nguc", "phan-nguyen", "mua-ma-thuat", "thanh-guom-anh-sang", "thu-hoi-quai-thu", "ke-dao-mo", "mu-ma-phap"]);
const SLOW_AIM = new Set(["soi-xich-dia-nguc", "phan-nguyen"]);
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
]);

function spellCanAnswer(id: string, duel: Duel): boolean {
  if (duel.step !== "respond" || !ANSWER_SPELLS.has(id)) return false;
  if (GUARD_SPELLS.has(id) && (duel.hold?.priority === undefined || answerSide(duel) !== duel.hold.priority)) return false;
  const pending = duel.pending;
  const horn = hornPending(duel);
  const attacked = (pending?.kind === "face" || pending?.kind === "melee") && !horn;
  const skilled = pending?.kind === "beam" || pending?.kind === "gnaw-skill" || horn;
  if (id === "vong-xoay-bao-ho" || id === "guong-phong-ho") return attacked;
  if (id === "la-chan-phan-don") return skilled && !bindBeam(duel);
  if (id === "hap-thu-ma-phap") return pending?.kind === "spell" || pending?.kind === "lash";
  // Only the attacking side may use it, to stop a foe from blocking (owner, 21/10).
  if (id === "ngan-chan-phong-ngu") return duel.hold?.priority === duel.turn && (Boolean(duel.hold?.blocker) || attacked);
  if (id === "vong-nguyen-rua-ac-ma") {
    if (pending?.kind === "face" || pending?.kind === "melee") return true;
    if (pending?.kind === "beam" || pending?.kind === "gnaw-skill") {
      const caster = fieldMon(duel, pending.caster);
      return Boolean(caster && harmSkill(caster.cardId, pending.index));
    }
    return false;
  }
  if (id === "phuc-kich") return attacked || pending?.kind === "face";
  if (id === "hoan-doi") return attacked || skilled || pending?.kind === "face";
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
    const uid = aimedUid(duel);
    if (side === undefined || !uid) return false;
    const mon = duel.players[side].field.find((unit) => unit?.uid === uid);
    if (!mon) return false;
    const stars = mon.cardId === "te-giac-be-con" && (mon.level ?? 1) > 1
      ? (monsterCard((mon.level ?? 1) >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang")?.stars ?? 1)
      : (monsterCard(mon.cardId)?.stars ?? 0);
    return stars === 1;
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
  if (id === "sung-loi-pha") return you.field.some((mon) => mon && hornFit(mon.cardId));
  if (id === "ke-dao-mo") return canTargetFoe(duel) && digChoices(duel, viewer).length > 0;
  if (!SLOW_SPELLS.has(id)) return false;
  const open = canTargetFoe(duel);
  const foes = foeAlive(duel, viewer);
  if (id === "soi-xich-dia-nguc" || id === "thanh-guom-anh-sang") return open && foes;
  if (id === "sam-set-tan-the") return open && foes;
  if (id === "phan-nguyen") return open && foes && you.field.some((mon) => mon && harmShift(mon));
  if (id === "mu-ma-phap") return you.field.some((mon) => mon && mon.cardId !== "mu");
  return true;
}

function answerPayoff(id: string, duel: Duel, viewer: Side) {
  if (id === "phuc-kich") {
    return duel.players[viewer].field.some((unit) => unit && unit.stun === 0 && (unit.chain ?? 0) === 0 && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai");
  }
  if (id === "la-chan-phan-don" || id === "ngan-chan-phong-ngu") return foeAlive(duel, viewer);
  return true;
}

// An answer spell flashes only when its Use button can be pressed.
function answerUsable(id: string, duel: Duel, viewer: Side, index: number) {
  const you = duel.players[viewer];
  const card = spellCard(id);
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
  if (ANSWER_SPELLS.has(id)) {
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
  if (offer === "lash") return pending.kind === "melee" && (duel.hold?.blocker ?? pending.defender) === mon.uid;
  return (pending.kind === "beam" || pending.kind === "gnaw-skill" || pending.kind === "spell") && pending.target === mon.uid;
}

function monsterAlert(duel: Duel, mon: FieldMon, viewer: Side): boolean {
  if (canStand(duel, mon.uid)) return true;
  if (harpyAlert(duel, mon, viewer)) return true;
  if (duel.step !== "respond" || duel.hold?.priority !== viewer || mon.dim || mon.stun > 0) return false;
  const pending = duel.pending;
  if (mon.cardId === "chien-si-gam-nham" && pending?.kind === "face") return true;
  if (mon.cardId === "yeu-tinh-chuc-phuc" && (pending?.kind === "face" || pending?.kind === "melee")) return true;
  if (mon.cardId === "linh-chien-da-khong-lo" && canWall(duel, mon.uid)) return true;
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

function holdingMend(mon: FieldMon) {
  if (mon.clash && (mon.clash.atk > 0 || mon.clash.def > 0 || mon.clash.maxHp > 0)) return true;
  if ((mon.blessAtk ?? 0) > 0 || (mon.blessDmg ?? 0) > 0) return true;
  return Boolean(mon.buff && ((mon.buff.def ?? 0) > 0 || (mon.buff.mdef ?? 0) > 0 || (mon.buff.maxHp ?? 0) > 0));
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
    for (let index = 0; index < 3; index += 1) {
      const was = before.field[index];
      const now = after.field[index];
      const spot = SLOT_POS[screenSide(side, viewer)][index];
      if (!was && now) pops.push(`${side}-${index}`);
      if (was && now && now.uid === was.uid && now.hp !== was.hp) {
        const delta = now.hp - was.hp;
        const beam = delta < 0 ? laserOf(`mon:${was.uid}`) : undefined;
        const rose = was.cardId === "ky-si-bong-toi" && now.cardId === "chien-binh-huyen-thoai";
        if (beam) floaters.push(...laserTicks(beam));
        else if (!(rose && delta < 0) && !(bombOn && bombHits.includes(was.uid)) && !(danOn && danHits.includes(was.uid)) && !riderIds.has(was.uid)) {
          floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `${delta > 0 ? "+" : ""}${delta}`, heal: delta > 0, spot: where });
          if (delta < 0 && !(next.skill && skillLook(next.skill.id, next.skill.index))) hits.push(now.uid);
        }
      }
      const mendN = was && now && now.uid === was.uid ? (next.mends ?? []).find((row) => row.uid === now.uid)?.n ?? 0 : 0;
      if (mendN > 0 && was && now && now.hp - was.hp !== mendN) {
        floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `+${mendN}`, heal: true, spot: where });
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
          (now.clash?.atk ?? 0) - (was.clash?.atk ?? 0),
          (now.clash?.def ?? 0) - (was.clash?.def ?? 0),
          stance,
        );
        if (gain > 0) floaters.push({ id: floaterSeq++, x: spot.x, y: spot.y, text: `+${gain}`, heal: true, spot: where });
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
  if (mon.cardId === "phu-thuy-ti-hon") return { name, text: "Gây ", hot: `${3 + stars} sát thương` };
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
  return id === "phu-thuy-ti-hon" || id === "mat-do-tan-pha" || id === "may-nem-bom-hinh-nhen" || id === "ma-dao-si" || id === "rong-ac-ma" || id === "rong-con" || id === "rong-ngan-tuoi" || id === "sua-hut-ma-phap" || id === "con-thinh-no-cua-hai-vuong" || (id === "rong-phun-hoa-cau" && index === 1) || (id === "ga-he-dang-so" && index === 1) || (id === "may-quay-thuong" && index === 1);
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
  onPull: () => void;
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
        {sector === null ? (
          <button type="button" className="act press" onClick={onPull}>
            Quay
          </button>
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
  /** Nhiệm vụ after a won match (chủ game 22/10): what it paid, and whether the end panels are past. */
  const [reward, setReward] = useState<MatchReward | null>(null);
  const [endStep, setEndStep] = useState<"wait" | "scene" | "rewards" | "done">("wait");
  /** Hết trận (chủ game 22/10): the losing side's HP on screen, where the end scene bursts it. */
  const [scene, setScene] = useState<{ win: boolean; at: { x: number; y: number }; tone: "red" | "blue" } | null>(null);
  const paidMatch = useRef<{ mid: string; reward: MatchReward | null } | null>(null);
  const [tutView, setTutView] = useState<TutView | null>(null);
  const [busy, setBusy] = useState(false);
  const [hand, setHand] = useState<"reserve" | "spell">("reserve");
  const [inspect, setInspect] = useState<Inspect | null>(null);
  const [strike, setStrike] = useState<Strike | null>(null);
  const [look, setLook] = useState<{ name: string; text: string; hot?: string; uid?: string; skill?: string } | null>(null);
  const [fuseShow, setFuseShow] = useState<FuseShow | null>(null);
  const [blockChoice, setBlockChoice] = useState<BlockChoice | null>(null);
  const [blessArm, setBlessArm] = useState(false);
  const [chronoAsk, setChronoAsk] = useState<{ caster: string; target: string; age: boolean; pass: boolean } | null>(null);
  const [chronoWarn, setChronoWarn] = useState<{ caster: string; target: string } | null>(null);
  const [chronoSpin, setChronoSpin] = useState<{ caster: string; target: string | null; index: 1 | 2; sector: number | null } | null>(null);
  const [fuseAsk, setFuseAsk] = useState<FuseAsk | null>(null);
  const [riteHand, setRiteHand] = useState<number | null>(null);
  const [vowAsk, setVowAsk] = useState<{ index: number; slot: 0 | 1 | 2; picks: string[] } | null>(null);
  const [fuseOn, setFuseOn] = useState(false);
  const [fuseDrag, setFuseDrag] = useState<{ x: number; y: number; moved: boolean } | null>(null);
  const [aim, setAim] = useState<Aim | null>(null);
  const [lureAsk, setLureAsk] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testPast, setTestPast] = useState<Duel[]>([]);
  const [testKind, setTestKind] = useState<"monster" | "spell">("monster");
  const [testFind, setTestFind] = useState("");
  const [sound, setSoundOn] = useState(true);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [swapPick, setSwapPick] = useState<string[]>([]);
  const [recallPick, setRecallPick] = useState<number[]>([]);
  const [reflectPick, setReflectPick] = useState<{ index: number; uid: string | null } | null>(null);
  const [ambushPick, setAmbushPick] = useState<{ index: number; uid: string | null } | null>(null);
  const [digPick, setDigPick] = useState<{ index: number; id: string | null } | null>(null);
  const [lockFlash, setLockFlash] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  /** The attacker's last thrust as its blow lands (chủ game 22/10). */
  const [thrust, setThrust] = useState<{ uid: string; x: number; y: number } | null>(null);
  /** A player's HP held at its old value until the lightning of a landing blow reaches it. */
  const [hpHold, setHpHold] = useState<Record<string, number>>({});
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [linger, setLinger] = useState<Linger[]>([]);
  const [laserHp, setLaserHp] = useState<Record<string, number>>({});
  const [burst, setBurst] = useState<Burst | null>(null);
  const [chain, setChain] = useState<ChainOrb[]>([]);
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
  const [motion, setMotion] = useState<Motion>({ pops: [], lunges: [], hits: [] });
  const [starFlash, setStarFlash] = useState<Side | null>(null);
  const [knightAsk, setKnightAsk] = useState<{ uid: string; foeUid: string | null; face: boolean; block?: boolean; room: 1 | 2 } | null>(null);
  const [hornAsk, setHornAsk] = useState<{ uid: string; foeUid: string; mode: "splash" | "plus" | null } | null>(null);
  const [cottonAsk, setCottonAsk] = useState<null | "hand">(null);
  const [askAt, setAskAt] = useState<{ x: number; y: number } | null>(null);
  const askDrag = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null);
  const prevDuel = useRef<Duel | null>(null);
  const seenViewer = useRef<Side | null>(null);
  const wave = useRef(0);
  const grab = useRef<Grab | null>(null);
  const fuseHold = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const origin = useRef({ x: 0, y: 0, moved: false, t: 0, pan: false, lastX: 0 });
  const handStrip = useRef<HTMLDivElement | null>(null);
  const noticeRef = useRef<HTMLParagraphElement | null>(null);
  const noticePan = useRef<{ id: number; y: number; top: number } | null>(null);
  const laserTimers = useRef<number[]>([]);
  const skillPan = useRef<{ id: number; y: number; top: number } | null>(null);
  const suppressClick = useRef(false);
  const scratch = useRef<Scratch>(freshScratch());
  const matchRef = useRef<{ id: string; startedAt: number; decks: OpeningDecks | null; saved: boolean } | null>(null);
  const starTimer = useRef(0);
  const stall = useRef({ live: "", n: 0 });
  const resetHold = useRef(0);
  const riteHold = useRef(0);
  const netRef = useRef<{ code: string; seat: NetSeat } | null>(null);
  const rev = useRef(0);
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
    let join: { code: string; seat: NetSeat } | null = null;
    try {
      join = JSON.parse(sessionStorage.getItem("clash-net") ?? "null") as { code: string; seat: NetSeat } | null;
    } catch {
      join = null;
    }
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
      const next = mode === "test" ? (loadTestDuel() ?? createDuel(loadDeck(), "test")) : newMatch(mode);
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
    setWait(quick ? "Đang vào trận…" : join.seat === "host" ? `Mã ${join.code}. Đợi đối thủ nhập mã này.` : "Đang vào phòng…");
    let stop = false;
    let voting = false;
    const tick = async () => {
      const wantDeck = join.seat === "host" && (againRef.current || liveDuel.current?.again?.[0] === "want");
      const room = await pollRoom({ data: { code: join.code, seat: join.seat, ...(wantDeck ? { deck: true } : {}) } });
      if (stop) return;
      if (room.phase === "gone") {
        setWait("Mã không còn. Hãy tạo mã mới.");
        return;
      }
      if (join.seat === "host" && room.guestDeck && !room.duel && !opening.current) {
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
    void tick();
    const timer = window.setInterval(() => void tick(), 280);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (duel?.mode === "test") sessionStorage.setItem(TEST_DUEL_KEY, JSON.stringify(duel));
  }, [duel]);

  useEffect(() => {
    setRecallPick([]);
  }, [duel?.recall]);

  useEffect(() => {
    if (!duel || busy || duel.winner !== null || duel.mode !== "ai" || duel.reel || !loaded || tutorial || trial) return;
    const aiResponds = duel.step === "respond" && duel.hold?.priority === 1;
    const aiMain = duel.turn === 1 && duel.step === "main";
    const aiParley = Boolean(duel.parley && duel.step === "main" && parleyPicker(duel) === 1);
    if (!aiResponds && !aiMain && !aiParley) return;
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
  }, [duel, busy, loaded, tutorial, trial]);

  // Thực chiến: the opponent follows its script, and the match is judged after every move.
  const verdict = trial && duel ? trialVerdict(duel, trial.level) : null;
  useEffect(() => {
    if (!trial || !duel || !loaded || busy || verdict) return;
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
  }, [duel, trial, loaded, busy, verdict]);
  useEffect(() => {
    if (trial && verdict === "pass") setTrialPaid(markTrial(trial.id, trial.level));
  }, [trial, verdict]);

  // The end of a match in Vs Máy, Đánh thường or Tuỳ chọn: the end scene (chủ game 22/10), then the missions a win
  // moved (paid once), then the old panel. Elsewhere only the old panel.
  const ended = duel?.winner ?? null;
  useEffect(() => {
    if (!duel || duel.winner === null) {
      setEndStep("wait");
      setReward(null);
      setScene(null);
      againRef.current = false;
      setAgain(false);
      return;
    }
    if (endedAt.current?.mid !== duel.mid) endedAt.current = { mid: duel.mid, at: Date.now() };
    const mine = viewerSide(duel, boardActor(duel), net?.seat ?? null);
    const earns = !tutorial && !trial && (duel.mode === "ai" || duel.mode === "net") && duel.winner === mine && Boolean(duel.mid);
    let paid: MatchReward | null = null;
    if (earns && duel.mid) {
      if (paidMatch.current?.mid === duel.mid) paid = paidMatch.current.reward;
      else {
        paid = settleWin(duel.mid, duel.mode === "ai" ? duel.machine : null);
        paidMatch.current = { mid: duel.mid, reward: paid };
      }
    }
    if (paid?.changed) setReward(paid);
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
      if (!pulled || pulled.mode !== "net" || !seat) return;
      const ticket = pushGen.current + 1;
      pushGen.current = ticket;
      void pushDuel({ data: { code: seat.code, seat: seat.seat, duel: JSON.stringify({ ...pulled, glimpse: null }) } }).then((pushed) => {
        if (ticket !== pushGen.current) return;
        if (!pushed.ok) return;
        rev.current = pushed.rev;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [duel, busy]);

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
    if (loaded && introSeen && openerLive) setOpenerOpen(true);
  }, [loaded, introSeen, openerLive]);

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
      setChain((list) => stepChain(null, duel, list));
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
    setChain((list) => stepChain(prev, duel, list));
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
    const beamKill = beamCaster === "ga-he-dang-so" || beamCaster === "phu-thuy-ti-hon" || beamCaster === "mo-voi-ma-mut";
    const monsterKill = !spent && duel.tone === "spell" && /sát thương phép|tiêu diệt/i.test(said);
    const cameFromBeam = prev.pending?.kind === "beam";
    const beamWasSwordsman = cameFromBeam && prev.pending?.kind === "beam" && fieldMon(prev, prev.pending.caster)?.cardId === "kiem-si-lua-thieng";
    const hellBoom = /Cầu lửa địa ngục/.test(said) && /sát thương|vật lý|phép|chuẩn/.test(said);
    const demonBoom = /Hoả cầu địa ngục/.test(said) && /sát thương chuẩn/.test(said);
    const swordBoom = /sát thương phép/.test(said) && (/Vệt Lửa|Lửa rồng thiêng|Đòn thêm|Hoả thần long|Cầu lửa/.test(said) || (cameFromBeam && beamWasSwordsman));
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
    const damageStart = beam && damageShot(beamCaster, beamIndex) && !firePrep && !beamKill && skillLook(beamCaster, beamIndex) !== "gun";
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
    if (quiet && (lunged || beam)) playCue("veil");
    const prepGun =
      (beam && duel.pending?.kind === "beam" && skillLook(beamCaster, duel.pending.index) === "gun") ||
      (hellFace && attackNow ? skillLook(fieldMon(duel, attackNow.attacker)?.cardId ?? "", 0) === "gun" : false);
    // Núi dung nham: the eruption, then the fire spell's explosion part on every target hit (owner, 19/10).
    if (!quiet && duel.lava && duel.lava.seq !== prev.lava?.seq) {
      playCue("eruption");
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
          playCue("swordBoom");
          if (point && fireBlastOn()) emitFx({ t: "fire", x: point.x, y: point.y });
        }, 2300 + order * 280);
      });
    }
    if (!quiet && firePrep && !prepGun) playCue("firePrep");
    if (!quiet && (blocked || gnawed)) playCue("block");
    if (!quiet && struck && spent !== "phuc-kich" && !curseBoom) playCue("hit");
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
      window.setTimeout(() => playCue("swordBoom"), 512);
      window.setTimeout(() => {
        if (fireBlastOn()) for (const point of points) emitFx({ t: "fire", x: point.x, y: point.y });
      }, 320);
    }
    if (!quiet && spent === "phuc-kich" && /phục kích/.test(said)) playCue("attack");
    if (!quiet && lunged && !hornNow && !gazing && !hellFace && !whipNow && spent !== "phuc-kich") {
      playCue("attack");
      const swung = duel.pending?.kind === "melee" ? duel.pending : null;
      const riderSwing = Boolean(swung && (fieldMon(duel, swung.attacker)?.cardId === "ky-si-cuoi-rong" || fieldMon(duel, duel.hold?.blocker ?? swung.defender)?.cardId === "ky-si-cuoi-rong"));
      if (riderSwing) playCue("firePrep", 0, 0.4);
    }
    if (!quiet && lunged && whipNow) playCue("reflect");
    if (!quiet && lunged && gazing) playCue("boltPrep");
    if (!quiet && lunged && hornNow) playCue("boltPrep");
    const vowed = !/Không đủ máu để hiến tế/.test(said) && /bị hiến tế|hiến tế\.|hiến tế hết máu/.test(said);
    const soulBlood = ([0, 1] as const).some((side) => {
      if (prev.players[side].hp - duel.players[side].hp < 2) return false;
      return duel.players[side].field.some((mon, index) => {
        const was = prev.players[side].field[index];
        return mon?.cardId === "ke-giam-ho-linh-hon" && (mon.vows ?? 0) > (was?.vows ?? 0);
      });
    });
    if (vowed || soulBlood) playCue("sacrifice");
    if (!quiet && /dùng Ẩn mình/.test(said)) playCue("sacrifice");
    if (!quiet && /thành Chiến binh huyền thoại/.test(said)) playCue("dispel");
    if (fireBlastOn()) {
      for (const side of [0, 1] as const) {
        duel.players[side].field.forEach((mon, index) => {
          const was = prev.players[side].field[index];
          if (mon?.cardId !== "ky-si-bong-toi" || (mon.path ?? 0) <= 0 || (was?.path ?? 0) > 0) return;
          const spot = SLOT_POS[screenSide(side, viewerNow)][index];
          if (spot) emitFx({ t: "fire", x: spot.x, y: spot.y });
        });
      }
      if (duel.rite && duel.rite.seq !== prev.rite?.seq) {
        const spot = SLOT_POS[screenSide(duel.rite.side, viewerNow)][duel.rite.slot];
        if (spot) emitFx({ t: "fire", x: spot.x, y: spot.y });
      }
      if (duel.ashes && duel.ashes.seq !== prev.ashes?.seq) {
        for (const slot of duel.ashes.slots) {
          const spot = SLOT_POS[screenSide(duel.ashes.side, viewerNow)][slot];
          if (spot) emitFx({ t: "fire", x: spot.x, y: spot.y });
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
          if (!mon || known.has(mon.uid) || (monsterCard(mon.cardId)?.stars ?? 0) < 4) return;
          const spot = SLOT_POS[screenSide(side, viewerNow)][index];
          if (spot) emitFx({ t: "rite", x: spot.x, y: spot.y, kind: "holy" });
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
        window.setTimeout(() => emitFx({ t: "rite", x: spot.x, y: spot.y }), 450);
        playCue("riteSummon", 0.45);
      }
    }
    if (drew) playCue("draw");
    if (summoned) playCue("summon");
    if (!quiet && /tích luỹ năng lượng/i.test(said)) playCue("spellRise");
    if (!quiet && /Lộ diện quái dự bị/.test(said)) playCue("dispel");
    if (!quiet && /thăng cấp/.test(said)) playCue("dispel");
    if (!quiet && /Nở ra/.test(said)) playCue("dispel");
    if (!quiet && /hồi \d+ và \+\d+ phòng ngự/.test(said)) playCue("dispel");
    if (!quiet && /nhân đôi phòng ngự/.test(said)) playCue("shield");
    if (!quiet && /cướp \d+ máu tối đa/.test(said)) playCue("dispel");
    if (!quiet && /phù hộ/.test(said)) playCue("spellRise");
    if (!quiet && /cuộn thế thủ/.test(said)) playCue("shield");
    if (!quiet && /xòe thế công/.test(said)) playCue("spellRise");
    if (!quiet && /Hoá kén/.test(said)) playCue("shield");
    if (!quiet && /sẽ đỡ đòn và phép|ngừng đỡ|tạo khiên/.test(said)) playCue("shield");
    for (const side of [0, 1] as const) {
      duel.players[side].field.forEach((mon, index) => {
        const was = prev.players[side].field[index];
        if (!mon?.ward || mon.ward === was?.ward) return;
        const spot = SLOT_POS[screenSide(side, viewerNow)][index];
        if (spot) emitFx({ t: "shield", kind: mon.ward, x: spot.x, y: spot.y });
      });
    }
    if (!quiet && /quét cả sân/.test(said)) playCue("timeFlow");
    else if (!quiet && /cường hoá và tiêu diệt|tiến hoá .+ dạng cuối|cường hoá .+, tăng 35%/.test(said)) playCue("timeBoost");
    else if (!quiet && /lão hoá .+, (tăng|giảm) 35%/i.test(said)) playCue("timeAge");
    if (!quiet && /nạp tia sáng huỷ diệt/.test(said)) {
      playCue("boltPrep");
      playCue("boltSmall");
      for (const side of [0, 1] as const) {
        duel.players[side].field.forEach((mon, index) => {
          const was = prev.players[side].field[index];
          if (!mon?.gaze || was?.gaze) return;
          const spot = SLOT_POS[screenSide(side, viewerNow)][index];
          if (spot) emitFx({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
        });
      }
    }
    if (!quiet && doomCast) playCue("boltPrep");
    if (!quiet && lashOpen) playCue("reflect");
    if (!quiet && lashBoom && lashWas) {
      playCue("boltSmall");
      for (const uid of [lashWas.bird, lashWas.foe]) {
        for (const side of [0, 1] as const) {
          const index = duel.players[side].field.findIndex((mon) => mon?.uid === uid);
          const was = index >= 0 ? index : prev.players[side].field.findIndex((mon) => mon?.uid === uid);
          const spot = was >= 0 ? SLOT_POS[screenSide(side, viewerNow)][was] : null;
          if (spot) emitFx({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
        }
      }
    }
    if (!quiet && /Thu hồi quái/.test(said)) playCue("dispel");
    else if (!quiet && beamKill) playCue("spellRise");
    else if (!quiet && damageStart) playCue("spellRise");
    else if (!quiet && hellBoom) {
      if (!(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun")) playCue("swordBoom");
    } else if (!quiet && demonBoom) playCue("swordBoom");
    else if (!quiet && swordBoom) {
      if (!(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun")) {
        if (!cameFromBeam) playCue("spellRise");
        playCue("swordBoom", cameFromBeam ? 0 : 0.24);
      }
    } else if (!quiet && gazeBoom && attackWas) {
      playCue("laserBoom");
      const from = slotPoint(prev, attackWas.attacker, viewerNow);
      const drops = laserDrops(prev, duel, viewerNow);
      const hit = drops[0];
      const to = hit ?? (attackWas.kind === "melee" ? slotPoint(prev, attackWas.defender, viewerNow) : aimPoint(prev, attackWas, viewerNow));
      if (from && to) emitFx({ t: "laser", x1: from.x, y1: from.y, x2: to.x, y2: to.y });
      const boltAt = to ?? hit;
      laserTimers.current.push(window.setTimeout(() => {
        playCue("boltSmall");
        if (boltAt) emitFx({ t: "bolt", rank: "small", self: hit?.spot === "self", x: boltAt.x, y: boltAt.y });
      }, LASER_MS));
    }
    else if (!quiet && whipBoom && attackWas) {
      playCue("boltBoom");
      const mine = attackWas.attacker;
      for (const side of [0, 1] as const) {
        const index = prev.players[side].field.findIndex((mon) => mon?.uid === mine);
        const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
        if (spot) emitFx({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
      }
      if (attackWas.kind === "melee") {
        for (const side of [0, 1] as const) {
          const index = prev.players[side].field.findIndex((mon) => mon?.uid === attackWas.defender);
          const spot = index >= 0 ? SLOT_POS[screenSide(side, viewerNow)][index] : null;
          if (spot) emitFx({ t: "bolt", rank: "big", x: spot.x, y: spot.y });
        }
      } else {
        const face = aimPoint(prev, attackWas, viewerNow);
        if (face) emitFx({ t: "bolt", rank: "big", x: face.x, y: face.y });
      }
    }
    else if (!quiet && hornBoom) {
      if (!wasHorn) playCue("boltPrep");
      playCue("boltSmall", wasHorn ? 0 : 0.24);
    }
    else if (!quiet && monsterKill && !whipNow && !whipBoom && !/Sấm lôi phá/.test(said) && !/Sấm sét tận thế/.test(said) && !/Roi điện/.test(said) && !/Roi sấm/.test(said) && !(duel.skill && skillLook(duel.skill.id, duel.skill.index) === "gun") && !/cường hoá và tiêu diệt/.test(said) && !/quét cả sân/.test(said)) {
      if (!cameFromBeam) playCue("spellRise");
      playCue("spellBoom");
    } else if (!quiet && curseBoom) playCue("swordBoom");
    else if (!quiet && spent === "sung-loi-pha") {
      playCue("boltPrep");
      playCue("boltSmall", 0.24);
      window.setTimeout(() => {
        for (const side of [0, 1] as const) {
          duel.players[side].field.forEach((mon, index) => {
            const was = prev.players[side].field[index];
            if (!mon?.horn || was?.horn) return;
            const spot = SLOT_POS[screenSide(side, viewerNow)][index];
            if (spot) emitFx({ t: "bolt", rank: "small", self: side === viewerNow, x: spot.x, y: spot.y });
          });
        }
      }, 240);
    }
    else if (!quiet && (BIND_SPELLS.has(spent) || beeBind || beeLand)) playCue("chain");
    else if (!quiet && REFLECT_SPELLS.has(spent)) playCue("reflect");
    else if (!quiet && spent === "giap-co-khi" && /bị phản vào/.test(said)) playCue("reflect");
    else if (!quiet && DISPEL_SPELLS.has(spent)) playCue("dispel");
    if (!quiet && /thổi độc|Thổi độc/.test(said) && /sát thương phép/.test(said)) playCue("poison", 1.15);
    else if (!quiet && /sát thương phép/.test(said) && /bào mòn/.test(said)) playCue("poison", 1.15);
    else if (!quiet && /trúng độc|chết vì độc|bị bào mòn|chết vì bào mòn|Virus ăn mòn (bắt đầu|gây|tiêu diệt|loại)/.test(said)) playCue("poison");
    const pendingChanged = duel.pending !== prev.pending;
    const armingGun = Boolean(duel.reel?.kind === "gun" && !prev.reel);
    const started = pendingChanged && duel.pending ? shotLook(duel, duel.pending) : null;
    const finished = pendingChanged && !duel.pending && !armingGun ? shotLook(prev, prev.pending) : null;
    const stamped = !started && !finished && duel.skill && duel.fx !== prev.fx ? skillLook(duel.skill.id, duel.skill.index) : null;
    const fromSpell = spent ? spellFxLook(spent) : null;
    const boomSpell = prev.pending?.kind === "spell" && duel.pending?.kind !== "spell" ? prev.pending.cardId : "";
    const boomFx = boomSpell ? spellFxLook(boomSpell) : null;
    const spellCard = Boolean((doomLook && doomLook !== "none") || (boomFx && boomFx !== "none") || (fromSpell && fromSpell !== "none" && !stamped && !finished));
    const look = started || finished || stamped || (fromSpell && fromSpell !== "none" ? fromSpell : null) || (doomLook && doomLook !== "none" ? doomLook : null) || (boomFx && boomFx !== "none" ? boomFx : null);
    const hud = matchBoard(duel.players[(1 - viewerNow) as Side].env, duel.players[viewerNow].env).marks;
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
    // A normal attack landing: the attacker thrusts in, the blow lands ~0.11 s later, the HP number waits for the
    // lightning to reach it.
    const landing = quiet ? null : attackLanding(prev, duel, viewerNow, hud);
    const LAND_MS = 110;
    const orbLate = new Set<number>();
    if (landing && shown) {
      for (const item of shown.floaters) {
        if (item.heal) continue;
        const onOrb = landing.kind === "face" && Math.abs(item.x - landing.orb.x) < 0.5 && Math.abs(item.y - landing.orb.y) < 0.5;
        if (onOrb) orbLate.add(item.id);
        item.delay = Math.max(item.delay ?? 0, onOrb ? 0.5 : LAND_MS / 1000);
      }
      setThrust({ uid: landing.uid, ...landing.thrust });
      if (landing.kind === "face") {
        const struck = ([0, 1] as const).find((side) => duel.players[side].hp < prev.players[side].hp);
        if (struck !== undefined) {
          const key = `face:${struck}`;
          setHpHold((now) => ({ ...now, [key]: prev.players[struck].hp }));
          window.setTimeout(() => setHpHold((now) => {
            const rest = { ...now };
            delete rest[key];
            return rest;
          }), 500);
        }
      }
      window.setTimeout(() => setThrust((now) => (now?.uid === landing.uid ? null : now)), LAND_MS + 50);
      window.setTimeout(() => {
        if (landing.kind === "face") emitFx({ t: "zap", x: landing.at.x, y: landing.at.y, dir: landing.dir, path: landing.path });
        else emitFx({ t: "clash", x: landing.at.x, y: landing.at.y });
      }, LAND_MS);
      playHit(landing.kind === "face" ? "zap" : "clash", LAND_MS / 1000);
    }
    const fxSourceUid = strikeUid(prev) || strikeUid(duel);
    const fxCard = (fxSourceUid ? (fieldMon(prev, fxSourceUid) ?? fieldMon(duel, fxSourceUid))?.cardId : undefined)
      ?? (spent || boomSpell || duel.skill?.id || undefined);
    if (shown) {
      if (shown.shake && !quiet) emitFx({ t: "shake", act: "shake", spot: "center", power: 1 });
      const casting = shown.burst?.tone === "heal" ? "healSpell" : shown.burst ? "spell" : null;
      const grouped = look === "spell" || look === "fire" || look === "gun" || look === "bolt" || look === "spark" || look === "tide-small" || look === "tide-mid" || look === "tide-big";
      if (!quiet && duel.fx !== prev.fx) {
        for (const mend of duel.mends ?? []) {
          for (const side of [0, 1] as const) {
            const index = duel.players[side].field.findIndex((unit) => unit?.uid === mend.uid);
            if (index < 0) continue;
            const spot = SLOT_POS[screenSide(side, viewerNow)][index];
            if (!spot) continue;
            emitFx({
              t: "ring",
              act: "heal",
              spot: side === viewerNow ? "self" : "target",
              x: spot.x,
              y: spot.y,
              color: "#3ec6ff",
              power: 1.05,
            });
          }
        }
      }
      if (!quiet) for (const item of shown.floaters) {
        const act = item.heal ? "heal" : item.text === "Hạ" ? "kill" : casting === "healSpell" ? "heal" : "hurt";
        if (grouped && !item.heal && item.text !== "Hạ") continue;
        // The HP a landing blow hits gets its own flash when the lightning reaches it.
        if (orbLate.has(item.id)) continue;
        if (item.heal) emitFx({ t: "ring", act, spot: item.spot, x: item.x, y: item.y, color: "#3ec6ff", power: 0.95 });
        else {
          emitFx({
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
        if (spot) emitFx({ t: "ring", act: "summon", spot: side === viewerNow ? "self" : "target", x: spot.x, y: spot.y, color: "#ffb347", power: 1.15, card: duel.players[side].field[Number(indexRaw)]?.cardId });
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
        if (from && to && duel.pending?.kind !== "beam") {
          const shooter = fieldMon(duel, uid);
          if (!shooter?.horn && !shooter?.gaze) emitFx({ t: "beam", act: "attack", x1: from.x, y1: from.y, x2: to.x, y2: to.y, color: "#ff8a00", card: shooter?.cardId });
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
          for (const hit of hits) emitFx({ t: "tide", rank, x: hit.x, y: hit.y });
        }
      } else if (look === "fire" || look === "gun") {
        const opening = look === "gun" ? openingGun : openingFire;
        if (!quiet && look === "gun") playCue(opening ? "gunPrep" : "gunBoom");
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
              emitFx({ t: "fire", x: point.x, y: point.y });
            }
          } else for (const hit of where) emitFx({ t: "fire", x: hit.x, y: hit.y });
        }
      } else if ((look === "bolt" || look === "spark") && !started) {
        const rank = look === "bolt" ? "big" : "small";
        if (look === "bolt") playCue("boltBoom");
        const where = hits.length ? hits : [{ x: 53, y: 30 }];
        for (const hit of where) emitFx({ t: "bolt", rank, self: rank === "small" && hit.spot === "self", x: hit.x, y: hit.y });
      } else if (!started && duel.skill?.id === "ma-dao-si" && (duel.skill.vols?.length ?? 0) > 1) {
        const count = duel.skill.vols?.length ?? 0;
        const id = duel.skill.hits?.[0];
        const point = (id ? splashMarkPoint(duel, id, viewerNow, shown?.falls ?? []) : null) ?? hits[0];
        if (point) {
          for (let i = 0; i < count; i += 1) {
            window.setTimeout(() => {
              emitFx({ t: "burst", act: "spell", spot: "target", x: point.x, y: point.y, color: "#ff4d4d", power: 1.1, card: fxCard });
            }, i * 420);
          }
        }
        emitFx({ t: "ring", act: "spell", spot: "center", x: 42, y: 44, color: "#ffd36a", power: 1.7, card: fxCard });
        for (let i = 1; i < count; i += 1) playCue("spellBoom", i * 0.42);
      } else if (!started && (hits.length > 0 || finished || stamped || look === "spell")) {
        for (const hit of hits) emitFx({ t: "burst", act: "spell", spot: "target", x: hit.x, y: hit.y, color: "#ff4d4d", power: 1.1, card: fxCard });
        emitFx({ t: "ring", act: "spell", spot: "center", x: 42, y: 44, color: "#ffd36a", power: 1.7, card: fxCard });
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
      const late = landing ? LAND_MS : 0;
      window.setTimeout(() => setShake(true), late);
      window.setTimeout(() => setShake(false), 640 + late);
    }
    if (shown.floaters.length > 0) {
      setFloaters((current) => [...current, ...shown.floaters]);
      const ids = new Set(shown.floaters.map((item) => item.id));
      const trail = Math.round(Math.max(0, ...shown.floaters.map((item) => (item.delay ?? 0) * 1000)));
      window.setTimeout(() => setFloaters((current) => current.filter((item) => !ids.has(item.id))), 1500 + trail);
    }
    if (shown.falls.length > 0) {
      const arm = (falls: Fall[], fadeAt: number) => {
        setLinger((current) => {
          const kept = current.filter((item) => !falls.some((fall) => fall.side === item.side && fall.index === item.index));
          return [...kept, ...falls.map((fall) => ({ id: fall.floater.id, side: fall.side, index: fall.index, mon: fall.mon }))];
        });
        window.setTimeout(() => {
          const ids = new Set(falls.map((fall) => fall.floater.id));
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
      if (rest.length) arm(rest, Math.max(0, wait) + Math.max(0, ...rest.map((fall) => fall.hold ?? 0)));
    }
    if (shown.burst) {
      setBurst(shown.burst);
      window.setTimeout(() => setBurst((current) => (current?.id === shown.burst?.id ? null : current)), 1600);
    }
    if (shown.motion.pops.length || shown.motion.lunges.length || shown.motion.hits.length) {
      setMotion(shown.motion);
      window.setTimeout(() => {
        if (wave.current === token) setMotion({ pops: [], lunges: [], hits: [] });
      }, 1400);
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

  const fuseKey = (() => {
    if (!duel || duel.step !== "main" || duel.winner) return "";
    const player = duel.players[duel.turn];
    const bits: string[] = [];
    const ids = player.field.filter((mon): mon is NonNullable<typeof mon> => Boolean(mon)).map((mon) => mon.cardId);
    player.reserve.forEach((held, index) => {
      player.field.forEach((mon) => {
        if (mon && (findFusion(held.id, mon.cardId) || findKnightFusion(held.id, mon.cardId, ids))) bits.push(`${index}:${mon.uid}`);
      });
    });
    return bits.length ? `${duel.turn}|${bits.join("|")}` : "";
  })();

  useEffect(() => {
    if (!fuseKey) {
      setFuseOn(false);
      return;
    }
    setFuseOn(true);
    const timer = window.setTimeout(() => setFuseOn(false), 3500);
    return () => window.clearTimeout(timer);
  }, [fuseKey]);

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
    if (!fuseShow || fuseShow.phase === "reveal" || fuseShow.phase === "land") return;
    if (fuseShow.phase === "lift") playCue("fuseRite");
    const phase = fuseShow.phase;
    const [wait, after] = FUSE_BEATS[phase];
    const timer = window.setTimeout(
      () => setFuseShow((current) => (current && current.n === fuseShow.n && current.phase === phase ? { ...current, phase: after } : current)),
      wait,
    );
    return () => window.clearTimeout(timer);
  }, [fuseShow?.n, fuseShow?.phase]);

  if (duel) turnClock.current = duel.clock ?? 1;

  if (!duel) {
    return (
      <main className="stage">
        <p>{wait || "Đang mở đấu trường…"}</p>
        {net?.seat === "host" && !(net as { quick?: boolean }).quick ? <p className="room-code">{net.code}</p> : null}
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
  const canPlay = mine && duel.step === "main" && duel.turn === viewer && !duel.upkeep && !gemHold;
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
  const canIntercept = responding && duel.hold?.priority === viewer && duel.pending?.kind === "face";
  const cotton = mine && responding && duel.hold?.priority === viewer ? cottonOffer(duel, viewer) : { hand: false };
  const standHand = Boolean(mine && canStandHand(duel, viewer));
  const beam = duel.pending?.kind === "beam" ? duel.pending : null;
  const groupedShot = shotLook(duel, duel.pending);
  // Sừng lôi phá's strike has its attack icon now (chủ game 23/10); the bar stays for skills until đợt 2.
  const beamFromBottom = beam ? you.field.some((unit) => unit?.uid === beam.caster) : false;
  const board = matchBoard(foe.env, you.env);
  // Before the transition effect has run, a blow about to land still shows the HP it hits at its old value.
  const lastDuel = prevDuel.current;
  const landingNow = lastDuel && lastDuel !== duel ? attackLanding(lastDuel, duel, viewer, board.marks) : null;
  const heldHp = (side: Side) => (landingNow?.kind === "face" && lastDuel && duel.players[side].hp < lastDuel.players[side].hp ? lastDuel.players[side].hp : undefined);
  const marks = board.marks;
  const artTop = topArt(foe.env);
  const artBottom = bottomArt(you.env);
  const actionsMoved = JSON.stringify(board.actions) !== JSON.stringify(DEFAULT_ACTIONS);
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

  function apply(next: Duel) {
    if (!duel || next === duel) return;
    seal(duel, next);
    if (duel.mode === "test") setTestPast((list) => [...list, structuredClone(duel)].slice(-40));
    const previous = duel;
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
    if (duel.mode !== "net" || !seat) return;
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
    setCottonAsk(null);
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
    const fresh = createDuel(loadDeck(), "test");
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
    setCottonAsk(null);
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

  function swallowNextClick() {
    const stop = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      window.removeEventListener("click", stop, true);
    };
    window.addEventListener("click", stop, true);
    window.setTimeout(() => window.removeEventListener("click", stop, true), 500);
  }

  function openHand(pile: "reserve" | "spell", index: number) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setInspect((current) => (current?.pile === pile && current.index === index ? null : { pile, index }));
  }

  function begin(event: ReactPointerEvent, payload: Grab) {
    if (!mine) return;
    suppressClick.current = false;
    grab.current = payload;
    origin.current = { x: event.clientX, y: event.clientY, moved: false, t: Date.now(), pan: false, lastX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    window.clearTimeout(riteHold.current);
    if (payload.kind === "summon") {
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
    setDrag({ ...payload, x: event.clientX, y: event.clientY });
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
    if (!mon || mon.dim || mon.stun > 0 || mon.noBlock || (mon.path ?? 0) > 0) {
      holdNotice("Quái này không chặn được");
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

  function finishDrop(hit: Element | null, payload: Grab) {
    if (!duel) return;
    const slotEl = hit?.closest("[data-slot]") as HTMLElement | null;
    const owner = slotEl ? Number(slotEl.dataset.owner) : NaN;
    const index = slotEl ? Number(slotEl.dataset.index) : NaN;
    const foeUid = slotEl?.dataset.uid ?? "";
    if (payload.kind === "summon") {
      if (responding && duel.hold && payload.card.id === "cuc-bong-ma-quai" && slotEl && owner === viewer && slotEl.dataset.empty === "1") {
        setCottonAsk("hand");
        return;
      }
      const partner = foeUid ? you.field.find((unit) => unit?.uid === foeUid) : null;
      const ids = you.field.filter((unit): unit is NonNullable<typeof unit> => Boolean(unit)).map((unit) => unit.cardId);
      const recipe = partner ? findFusion(payload.card.id, partner.cardId) ?? findKnightFusion(payload.card.id, partner.cardId, ids) : null;
      if (canPlay && recipe && partner && slotEl && owner === viewer && index >= 0 && index <= 2) {
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
      if (canPlay && cap > 0 && slotEl && owner === viewer && index >= 0 && index <= 2 && (armed || full)) {
        setVowAsk({ index: payload.index, slot: index as 0 | 1 | 2, picks: [] });
        return;
      }
      if (!canPlay || !slotEl || owner !== viewer || slotEl.dataset.empty !== "1" || index < 0 || index > 2) {
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
      if (payload.spellId === "hoan-doi") {
        setSwapPick([]);
        apply(castSpell(duel, payload.index, aimedUid(duel)));
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
              : kind === "skill" && pending && "caster" in pending
                ? pending.caster
                : kind === "attack" && pending && "attacker" in pending
                  ? pending.attacker
                  : null;
        apply(castSpell(duel, payload.index, uid));
        return;
      }
      if (!mine || hit?.closest(".hand") || hit?.closest(".face-pile")) return;
      const uid = slotEl?.dataset.uid || "";
      if (payload.spellId === "soi-xich-dia-nguc") {
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
    const reactEl = hit?.closest("[data-react]") as HTMLElement | null;
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
      const ontoShot = Boolean(reactEl) || Boolean(hit?.closest("[data-beam]")) || (pending && "attacker" in pending && foeUid === pending.attacker);
      if (guard?.cardId === "kizuran" && kazura && (ontoHer || ontoShot)) {
        apply(setCover(duel, guard.uid, true));
        return;
      }
    }
    if (reactEl && payload.kind === "unit" && duel.hold?.priority === viewer) {
      if (pending?.kind === "face") offerBlock(payload.uid);
      return;
    }
    const intercept = responding && duel.hold?.priority === viewer && pending?.kind === "face";
    if (intercept && pending) {
      const attackerUid = pending.attacker;
      const onShot = Boolean(hit?.closest("[data-beam]")) || (foeUid !== "" && foeUid === attackerUid);
      if (onShot) {
        offerBlock(payload.uid);
        return;
      }
      holdNotice("Chỉ chặn được đòn đánh vào người");
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
    if (aimingSkill && aim.index === 3) {
      const caster = you.field.find((unit) => unit?.uid === aim.uid);
      if (caster?.cardId === "nu-chua-dieu-nhan" || caster?.cardId === "nu-chua-dieu-nhan-hoan-my") {
        if (!aim.also) {
          if (!foeUid || owner === viewer) {
            holdNotice("Chọn một quái đối thủ");
            return;
          }
          setAim({ kind: "skill", uid: aim.uid, index: 3, also: foeUid });
          holdNotice("Chọn quái của ta");
          return;
        }
        if (owner !== viewer || !foeUid) {
          holdNotice("Chọn quái của ta");
          return;
        }
        apply(useSkill(duel, aim.uid, foeUid, 3, true, aim.also));
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
      apply(face ? attackFace(duel, payload.uid) : attackMonster(duel, payload.uid, foeUid));
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
    finishDrop(under(event.clientX, event.clientY), payload);
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
      setVowAsk({ index: aim.index, slot: index as 0 | 1 | 2, picks: [] });
      return;
    }
    setAim(null);
    apply(summon(duel, aim.index, index as 0 | 1 | 2));
  }

  function onUnit(side: Side, mon: FieldMon) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!mine || !duel) return;
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
    if (aim?.kind === "skill" && aim.index === 3) {
      const caster = you.field.find((unit) => unit?.uid === aim.uid);
      if (caster?.cardId === "nu-chua-dieu-nhan" || caster?.cardId === "nu-chua-dieu-nhan-hoan-my") {
        if (!aim.also) {
          if (side === viewer) {
            holdNotice("Chọn một quái đối thủ");
            return;
          }
          setAim({ kind: "skill", uid: aim.uid, index: 3, also: mon.uid });
          holdNotice("Chọn quái của ta");
          return;
        }
        if (side !== viewer) {
          holdNotice("Chọn quái của ta");
          return;
        }
        apply(useSkill(duel, aim.uid, mon.uid, 3, true, aim.also));
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
    if (side === viewer && (hatchReady || reelReady || harpyUp || (!mon.dim && (canPlay || reactive)))) {
      setAim({ kind: "menu", uid: mon.uid });
      setLook(null);
      return;
    }
    const owner = side === viewer ? you : foe;
    const veiled = side !== viewer && owner.sea && !mon.cage && !mon.shown && (mon.cardId === "trai-tim-hai-long" || mon.cardId === "sua-hut-ma-phap" || mon.cardId === "kraken");
    if (veiled) {
      setLook({ name: "quái thú ẩn mình", text: "Không thấy kỹ năng hay chỉ số." });
      return;
    }
    setLook({ ...fieldLook(mon, owner.stars), uid: mon.uid });
  }

  const foeSide = (viewer === 0 ? 1 : 0) as Side;
  const marksView = [
    ["foeHp", laserHp[`face:${foeSide}`] ?? hpHold[`face:${foeSide}`] ?? heldHp(foeSide) ?? foe.hp, ""],
    ["foeOrb", tutView?.foeOrb ?? foe.orb, ""],
    ["foeFlask", Math.min(1, foe.flask), "bình"],
    ["foeStars", foe.stars, "sao"],
    ["foeGems", foe.starGems, "thừa"],
    ["foeHand", foe.hand.length, "phép"],
    ["foeReserve", foe.reserve.length, "dự bị"],
    ["youHp", laserHp[`face:${viewer}`] ?? hpHold[`face:${viewer}`] ?? heldHp(viewer) ?? you.hp, ""],
    ["youOrb", tutView?.youOrb ?? you.orb, ""],
    ["youFlask", Math.min(1, you.flask), "bình"],
    ["youStars", tutView?.youStars ?? you.stars, "sao"],
    ["youGems", tutView?.youGems ?? you.starGems, "thừa"],
  ] as const;

  const reserveHeld = inspect?.pile === "reserve" ? you.reserve[inspect.index] : undefined;
  const reserveToll = Boolean(reserveHeld?.toll);
  const spellToll = inspect?.pile === "spell" ? Boolean(you.tolls?.[inspect.index]) : false;
  const shownMonster = reserveHeld ? monsterCard(reserveHeld.id) : undefined;
  const shownSpell = inspect?.pile === "spell" ? spellCard(you.hand[inspect.index] ?? "") : inspect?.pile === "env" ? spellCard(inspect.id) : undefined;
  const otherCount = hand === "reserve" ? you.hand.length : you.reserve.length;
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

  function placeFuse(slot: 0 | 1 | 2) {
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
    if (!slotEl || owner !== viewer || index < 0 || index > 2) {
      holdNotice("Kéo lá vào ô của bạn.");
      return;
    }
    placeFuse(index as 0 | 1 | 2);
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
    });
  }
  const fuseResult = fuseAsk ? monsterCard(fuseAsk.resultId) : undefined;
  const fuseHandName = fuseAsk ? fieldName({ cardId: fuseAsk.handId, level: fuseAsk.handLevel }) : "";
  const fuseFieldName = fuseAsk ? fieldName({ cardId: fuseAsk.fieldId, level: fuseAsk.fieldLevel }) : "";

  const ownLive = you.field.filter((mon): mon is FieldMon => Boolean(mon && mon.hp > 0));
  /** What the held monster can do right now; a button only shows when the match would accept it. */
  function handActions(index: number): SheetAction[] {
    const held = you.reserve[index];
    if (!duel || !held || !monsterCard(held.id) || !canPlay) return [];
    const known = new Set(you.field.map((mon) => mon?.uid));
    const lands = (next: Duel) => next.players[viewer].field.some((mon) => mon && !known.has(mon.uid));
    const cost = (next: Duel) => Math.max(0, you.orb - next.players[viewer].orb);
    const free = you.field.findIndex((mon, at) => !mon && (you.locked?.[at] ?? 0) === 0);
    const list: SheetAction[] = [];
    if (free >= 0) {
      const next = summon(duel, index, free as 0 | 1 | 2);
      if (lands(next)) {
        list.push({ key: "summon", label: "Triệu hồi", tone: "gold", cost: cost(next), onPress: () => {
          setInspect(null);
          apply(summon(duel, index, free as 0 | 1 | 2));
        } });
      }
    }
    if (vowCap(held.id, held.saved?.level ?? 1) > 0 && ownLive.length > 0) {
      const slot = (free >= 0 ? free : you.field.findIndex((mon) => mon?.uid === ownLive[0].uid)) as 0 | 1 | 2;
      const next = summonVow(duel, index, slot, [ownLive[0].uid]);
      if (lands(next)) {
        list.push({ key: "vow", label: "Hiến tế", tone: "red", cost: cost(next), onPress: () => {
          setInspect(null);
          setVowAsk({ index, slot, picks: [] });
        } });
      }
    }
    const ids = ownLive.map((mon) => mon.cardId);
    for (const mon of ownLive) {
      const recipe = findFusion(held.id, mon.cardId) ?? findKnightFusion(held.id, mon.cardId, ids);
      if (!recipe) continue;
      const slot = you.field.findIndex((unit) => unit?.uid === mon.uid) as 0 | 1 | 2;
      const next = fuse(duel, index, mon.uid, slot);
      if (!lands(next)) continue;
      list.push({ key: "fuse", label: "Dung hợp", tone: "fuse", emblem: "swirl", cost: cost(next), onPress: () => {
        const slotSpot = boardSpot(document.querySelector(`[data-slot="${viewer}-${slot}"]`), { x: 50, y: 62, w: 18 });
        setFuseShow({
          index,
          uid: mon.uid,
          slot,
          resultId: recipe.result,
          phase: "lift",
          n: Date.now(),
          a: boardSpot(document.querySelector(`[data-reserve="${index}"]`), { x: 30, y: 88, w: 18 }),
          b: slotSpot,
          at: slotSpot,
          ...trioOf(held.id, mon),
        });
        setInspect(null);
      } });
      break;
    }
    return list;
  }

  /** The card id whose name and skills a field monster shows (Tê giác changes form as it levels). */
  const formOf = (mon: FieldMon) =>
    mon.cardId === "te-giac-be-con" && (mon.level ?? 1) > 1 ? ((mon.level ?? 1) >= 3 ? "te-giac-chien-binh" : "te-giac-hieu-thang") : mon.cardId;
  // Tapping the card on the sheet opens the 3D fan of its related cards (owner, 19/10: everywhere a sheet opens).
  const sheetFor = (mon: FieldMon, allies: Array<FieldMon | null>, actions: SheetAction[], onClose: () => void, note?: string, startSkill?: string) => (
    <RelatedFlow
      id={formOf(mon)}
      onClose={onClose}
      sheet={(onArt) => (
        <MonsterSheet
          name={fieldName(mon)}
          card={<SheetCard mon={mon} allies={allies} layout={fieldLayout} />}
          count={sheetCount(mon, allies)}
          skills={skillsOf(formOf(mon), monsterCard(formOf(mon))?.skill ?? "")}
          actions={actions}
          note={note}
          onClose={onClose}
          onArt={onArt}
          startSkill={startSkill}
        />
      )}
    />
  );
  const handMon = inspect?.pile === "reserve" && reserveHeld ? previewMon(duel, viewer, reserveHeld) : null;
  const handSheet = handMon && inspect?.pile === "reserve" ? sheetFor(handMon, you.field, handActions(inspect.index), () => setInspect(null)) : null;
  const lookMon = look?.uid ? [...you.field, ...foe.field].find((mon) => mon?.uid === look.uid) ?? null : null;
  const lookAllies = lookMon && you.field.some((mon) => mon?.uid === lookMon.uid) ? you.field : foe.field;
  const lookSheet = lookMon ? sheetFor(lookMon, lookAllies, [], () => setLook(null), look?.hot ? `${look.text}${look.hot}` : undefined, look?.skill) : null;

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
    const lunge = attackShift(duel, uid, viewer);
    const dx = lunge ? (lunge.x * box.w) / 100 : 0;
    const dy = lunge ? (lunge.y * box.h) / 100 : 0;
    return { x: box.x + box.w / 2 + dx, y: box.y + box.h / 2 + dy, h: box.h, top: row === 1, dx, dy };
  };
  const iconSpots = new Map<string, IconSpot>();
  {
    const tall = ICON * (9 / 16);
    const clear = (x: number, y: number) => [...iconSpots.values()].every((other) => Math.hypot(x - other.x, ((y - other.y) * 16) / 9) >= ICON * 1.08);
    for (const orb of chain) {
      const kept = keptSpots.current.get(orb.id);
      // Once the wait is over an icon stays where it stood (the attacker leaves its lunge before its icon fires).
      if (kept && (orb.done || !responding)) {
        iconSpots.set(orb.id, kept);
        continue;
      }
      let spot: IconSpot | null = null;
      const card = orb.near ? cardSpot(orb.near) : null;
      if (card) {
        const lunging = card.dx !== 0 || card.dy !== 0;
        spot = {
          x: card.x,
          // Clear of the card, just in front of its edge (chủ game 23/10).
          y: card.top ? card.y + card.h / 2 + tall / 2 + 0.6 : card.y - card.h / 2 - tall / 2 - 0.6,
          face: card.top ? 1 : -1,
          // An attacker's light starts as its card arrives; an attacker's or a caster's icon fades in only after its
          // light has reached out (chủ game 23/10).
          delay: orb.kind === "attack" && lunging ? 0.75 : 0,
          appear: orb.kind === "attack" || orb.kind === "skill" ? (lunging ? 1.3 : 0.5) : 0,
        };
      } else if (!orb.near) {
        const mine = orb.side === viewer;
        const halfY = mine ? 56 : 40;
        const anchor = orb.by ? iconSpots.get(orb.by) ?? null : null;
        let x = 44;
        let y = halfY;
        if (anchor && anchor.y > 48 === mine) {
          x = anchor.x + (anchor.x < 50 ? ICON * 1.8 : -ICON * 1.8);
          y = anchor.y;
        } else if (anchor) {
          x = anchor.x;
        }
        const from = x;
        for (let step = 1; step <= 8 && !clear(x, y); step += 1) {
          x = Math.min(99 - ICON / 2, Math.max(ICON / 2 + 1, from + (step % 2 ? 1 : -1) * Math.ceil(step / 2) * ICON * 1.15));
        }
        spot = { x, y, face: 0, delay: 0, appear: 0 };
      }
      if (!spot) spot = kept ?? null;
      if (!spot) continue;
      iconSpots.set(orb.id, spot);
      keptSpots.current.set(orb.id, spot);
    }
  }
  /** Where a flow lands on a card (the middle of its edge facing the flow) or on a player's HP. */
  const flowEnd = (end: FlowEnd, from: { x: number; y: number }): EndSpot | null => {
    if ("orb" in end) return null;
    if ("face" in end) {
      const mark = end.face === viewer ? board.marks.youHp : board.marks.foeHp;
      const dx = (mark.x - from.x) * 0.9;
      const dy = (mark.y - from.y) * 1.6;
      const len = Math.hypot(dx, dy) || 1;
      return { x: mark.x, y: mark.y, into: { x: dx / len, y: dy / len } };
    }
    const card = cardSpot(end.uid);
    if (!card) return null;
    const below = from.y > card.y;
    return { x: card.x, y: below ? card.y + card.h * 0.46 : card.y - card.h * 0.46, into: { x: 0, y: below ? -1 : 1 } };
  };
  const hiddenMon = (orb: ChainOrb) => {
    const mon = orb.source ? fieldMon(duel, orb.source) : null;
    return Boolean(orb.source && seaVeiled(duel, viewer, orb.source)) || (orb.side !== viewer && duel.players[orb.side].hats && (mon?.cardId ?? orb.cardId) !== "mu");
  };
  /** The skill an icon stands for, as on the monster sheet: its name, glyph and kind. */
  const iconSkill = (orb: ChainOrb): { name: string; icon: string; kind: string } | null => {
    const mon = orb.source ? fieldMon(duel, orb.source) : null;
    const cardId = mon ? formOf(mon) : orb.cardId;
    if (!cardId) return null;
    const book = skillsOf(cardId, monsterCard(cardId)?.skill ?? "");
    const label = orb.skill === "lash" ? chipLabel(cardId, "lash") : orb.skill !== null ? castName(cardId, orb.skill) : "";
    const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
    const hit = label
      ? book.find((row) => same(row.name, label)) ?? book.find((row) => label.toLowerCase().startsWith(row.name.toLowerCase()))
      : book.find((row) => row.kind === "active" || row.kind === "risk");
    const kind = hit && hit.kind !== "passive" && hit.kind !== "note" ? hit.kind : "active";
    return { name: hit?.name ?? label, icon: hit?.icon ?? "sparkles", kind };
  };
  const iconLook = (orb: ChainOrb): IconLook => {
    if (orb.kind === "block") return { type: "medal", tone: "gold", icon: "crossed-swords" };
    if (orb.kind === "spell") return { type: "art", src: orb.spell ? spellSrc(orb.spell) : null, ring: orb.tone };
    if (orb.kind === "attack" && orb.strike === "horn") return { type: "art", src: spellSrc("sung-loi-pha"), ring: "blue" };
    if (orb.kind === "attack" && orb.strike !== "gaze") return { type: "medal", tone: "red", icon: "sword-brandish" };
    if (hiddenMon(orb)) return { type: "gem", icon: "sparkles", kind: "active" };
    const skill = iconSkill(orb);
    return { type: "gem", icon: skill?.icon ?? "sparkles", kind: skill?.kind ?? "active" };
  };
  const iconNote = (orb: ChainOrb): ReactNode => {
    const text = orb.notice || (orb.spell ? spellCard(orb.spell)?.name ?? "" : "");
    return text ? <NoticeText text={veilNotice(spoken(text, viewer), duel, viewer)} /> : null;
  };
  // Two quick taps on an icon: its card. A skill's sheet opens on that skill (chủ game 23/10).
  const openIcon = (orb: ChainOrb) => {
    if (orb.kind === "spell" && orb.spell) {
      setInspect({ pile: "env", id: orb.spell });
      return;
    }
    if (orb.strike === "horn") {
      setInspect({ pile: "env", id: "sung-loi-pha" });
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
    setLook({ ...fieldLook(mon, duel.players[side].stars), uid: mon.uid, skill });
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
    const name = orb.skill === "lash" ? chipLabel(mon.cardId, "lash") : orb.skill !== null ? castName(mon.cardId, orb.skill) : "";
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
  const openerCards: OpenerCard[] = [
    ...you.reserve.map((held, index): OpenerCard => {
      const card = monsterCard(held.id);
      return {
        key: `m${index}:${held.id}`,
        face: card ? <CardFace monster={card} level={held.saved?.level ?? 1} live={reserveLive(held, card)} fake={held.fake} gems={held.toll ? `${card.gems}+1` : undefined} /> : null,
        can: you.monsterDeck.length > 0,
      };
    }),
    ...you.hand.map((id, index): OpenerCard => ({ key: `s${index}:${id}`, face: <CardFace spellId={id} gems={you.tolls?.[index] ? `${spellCard(id)?.gems ?? 0}+1` : undefined} />, can: you.spellDeck.length > 0 })),
  ];
  const pinnedLine = pinnedId === null ? null : trailDots.find((dot) => dot.id === pinnedId)?.text ?? null;
  // While the icons show, a notice of one of them shows only when it is tapped; anything else is a prompt to the
  // player (a wrong move, a pick to make) and shows by itself for a few seconds (chủ game 23/10).
  const lineText = pinnedLine ?? (toast && !chain.some((orb) => orb.notice === toast) ? toast : "");
  const fuseHeld = fuseShow ? you.reserve[fuseShow.index] : undefined;
  const fusePartner = fuseShow ? you.field.find((mon) => mon?.uid === fuseShow.uid) ?? null : null;
  const fuseThird = fuseShow?.third ? you.field.find((mon) => mon?.uid === fuseShow.third) ?? null : null;
  const fuseBorn = fuseShow ? previewMon(duel, viewer, { id: fuseShow.resultId, hp: monsterCard(fuseShow.resultId)?.hp ?? 1, maxHp: monsterCard(fuseShow.resultId)?.hp ?? 1 }) : null;
  const fuseSheet =
    fuseShow?.phase === "reveal" && fuseBorn
      ? sheetFor(
          fuseBorn,
          you.field,
          [{ key: "go", label: "Triệu hồi", tone: "fuse", cost: 0, onPress: () => {
            const show = fuseShow;
            setFuseShow({ ...show, phase: "land" });
            // Lightning strikes the slot as the fused monster lands, with its thunder.
            playCue("boltPrep", 0.35);
            window.setTimeout(() => {
              apply(fuse(duel, show.index, show.uid, show.slot));
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
          } }],
          () => setFuseShow(null),
        )
      : null;

  return (
    <main className="stage">
      <GlyphDefs />
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
      <img className="board-bleed" src="/board-bleed.jpg" alt="" aria-hidden="true" draggable={false} decoding="async" />
      <section
        className={`board${shake ? " is-shaking" : ""}${fuseShow ? " is-fusing" : ""}${drag?.kind === "spell" && spellDragLive(drag.spellId, duel, viewer, drag.index) ? " is-aiming" : ""}`}
        aria-label="Bàn đấu"
        style={{ "--alert-size": `${loadAlertLook().glow}px`, "--alert-border": `${loadAlertLook().border}px`, ...(askAt ? { "--ask-x": `${askAt.x}%`, "--ask-y": `${askAt.y}%`, "--ask-bottom": "auto" } : {}) } as CSSProperties}
        onPointerDownCapture={() => {
          // A drag that ended on the field leaves no click behind; a fresh touch must not be swallowed for it.
          suppressClick.current = false;
        }}
        onPointerDown={graspAsk}
        onPointerMove={dragAsk}
        onPointerUp={dropAsk}
        onPointerCancel={dropAsk}
      >
        <div className="diorama">
        {artTop === artBottom ? (
          <img className="board-art" src={artTop} alt="" />
        ) : (
          <>
            <img className="board-art" src={artBottom} alt="" />
            <img className="board-art is-top" src={artTop} alt="" />
          </>
        )}
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
              <span style={{ fontSize: `${spot.size}cqmin` }}>{card.name}</span>
            </button>
          );
        })}
        <Link to="/" className="back-link">
          Menu
        </Link>
        <button type="button" className="help-btn press" onClick={() => setHelp(true)}>
          Cài đặt
        </button>
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
        {marksView.map(([key, value]) => {
          const orbKey = key === "youOrb" || key === "foeOrb";
          const flaskKey = key === "youFlask" || key === "foeFlask";
          const starKey = key === "youStars" || key === "foeStars";
          const gemKey = key === "youGems" || key === "foeGems";
          const gemOwner = key.startsWith("you") ? you : foe;
          if (gemKey && gemOwner.stars >= 4) return null;
          const always = orbKey || starKey || Boolean(tutView?.show?.includes(key));
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
          return (
            <div key={key} data-tut={key} className={`mark${orbKey ? " is-orb" : ""}${starLit ? " is-star" : ""}${COUNT_MARKS.includes(key) ? " is-count" : ""}`} style={{ left: `${marks[key].x}%`, top: `${marks[key].y}%`, fontSize: `${marks[key].size * markScale(key)}cqmin`, color }}>
              <b>{value}</b>
            </div>
          );
        })}
        {board.trail.hidden ? null : (
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
            {Array.from({ length: TRAIL_SLOTS }, (_, slot) => {
              const history = trailDots.slice(-TRAIL_SLOTS);
              const dot = history[slot - (TRAIL_SLOTS - history.length)];
              if (!dot) return <span key={`empty-${slot}`} className="trail-slot" />;
              const prev = history[slot - (TRAIL_SLOTS - history.length) - 1];
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
                      setPinnedId(dot.id);
                    }}
                  />
                </span>
              );
            })}
          </div>
        )}
        {board.notice.hidden ? null : (
          <p
            className={`banner${lineOn ? " is-quiet" : ""}`}
            ref={noticeRef}
            style={{
              left: `${board.notice.x}%`,
              top: `${board.notice.y}%`,
              width: `${board.notice.w}%`,
              height: `${board.notice.h}%`,
              right: "auto",
              fontSize: `${board.notice.font}cqmin`,
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
        {lineOn ? (
          <ReactionLine
            orbs={chain}
            closing={!responding}
            spots={iconSpots}
            endOf={flowEnd}
            lookOf={iconLook}
            noteOf={iconNote}
            hint={responding && lineText ? <NoticeText text={veilNotice(spoken(lineText, viewer), duel, viewer)} /> : null}
            hintKey={`${pinnedId ?? ""}:${lineText}`}
            hintPinned={pinnedLine !== null}
            cardOf={orbCard}
            onSheet={openIcon}
            onClosed={() => setChain((list) => (list.every((orb) => orb.done) ? [] : list))}
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
          const known = new Set(you.field.map((mon) => mon?.uid));
          const trial = vowAsk.picks.length ? summonVow(duel, vowAsk.index, vowAsk.slot, vowAsk.picks) : null;
          const ready = Boolean(trial?.players[viewer].field.some((mon) => mon && !known.has(mon.uid)));
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
                        label: "Triệu hồi",
                        tone: "red",
                        cost: Math.max(0, you.orb - (trial?.players[viewer].orb ?? you.orb)),
                        onPress: () => {
                          apply(summonVow(duel, vowAsk.index, vowAsk.slot, vowAsk.picks));
                          close();
                        },
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
        {mine && aim?.kind === "tide" ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{askLabel("trai-tim-hai-long", "tide")}</p>
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
        {duel.swap && duel.swap.side === viewer ? (
          <div className="overlay is-ask">
            <div className="ask-card">
              <p>{duel.swap.locked ? "Quái bị nhắm đã khoá. Chọn 1 quái để đổi, rồi bấm OK." : "Chọn 2 quái để đổi, rồi bấm OK."}</p>
              {duel.swap.locked ? <p>{fieldName(you.field.find((unit) => unit && `f:${unit.uid}` === duel.swap?.locked) ?? { cardId: "" })} đang bị nhắm.</p> : null}
              {you.field.map((unit) =>
                unit && !unit.copy && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai" && `f:${unit.uid}` !== duel.swap?.locked ? (
                  <button
                    key={unit.uid}
                    type="button"
                    className={swapPick.includes(`f:${unit.uid}`) ? "on" : ""}
                    onClick={() =>
                      setSwapPick((list) => {
                        const token = `f:${unit.uid}`;
                        const cap = duel.swap?.locked ? 1 : 2;
                        return list.includes(token) ? list.filter((item) => item !== token) : list.length >= cap ? [token] : [...list, token];
                      })
                    }
                  >
                    {tr(fieldName(unit))}
                  </button>
                ) : null,
              )}
              {you.reserve.map((held, index) => {
                const card = monsterCard(held.id);
                if (!card || (held.id === "trieu-hoi-ac-ma" ? you.stars < 3 : you.stars < card.stars) || card.stars === 0) return null;
                const token = `r:${index}`;
                return (
                  <button
                    key={token}
                    type="button"
                    className={swapPick.includes(token) ? "on" : ""}
                    onClick={() =>
                      setSwapPick((list) => {
                        const cap = duel.swap?.locked ? 1 : 2;
                        return list.includes(token) ? list.filter((item) => item !== token) : list.length >= cap ? [token] : [...list, token];
                      })
                    }
                  >
                    {held.saved ? fieldName({ cardId: held.id, level: held.saved.level }) : card.name}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={swapPick.length !== (duel.swap.locked ? 1 : 2)}
                onClick={() => {
                  const locked = duel.swap?.locked;
                  const next = locked ? confirmSwap(duel, locked, swapPick[0]) : confirmSwap(duel, swapPick[0], swapPick[1]);
                  if (!next.swap) setSwapPick([]);
                  apply(next);
                }}
              >
                OK
              </button>
            </div>
          </div>
        ) : null}
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
            <p>Tiến hoá Mỹ điểu nhân thành?</p>
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
        {cottonAsk === "hand" && cotton.hand ? (
          <div className="ask-card">
            <p>{monsterCard("cuc-bong-ma-quai")?.name}</p>
            <button type="button" onClick={() => { setCottonAsk(null); apply(cottonCover(duel, "hand")); }}>{askLabel("cuc-bong-ma-quai", "soft")}</button>
            <button type="button" onClick={() => setCottonAsk(null)}>{tr("Không")}</button>
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
                setChronoSpin({ caster: ask.caster, target: ask.target, index: 1, sector: null });
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
                setChronoSpin({ caster: ask.caster, target: ask.target, index: 1, sector: null });
              }}
            >
              Ok
            </button>
            <button type="button" onClick={() => setChronoWarn(null)}>{tr("Không")}</button>
          </div>
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
        {([0, 1, 2] as const).map((index) => {
          const side = (viewer === 0 ? 1 : 0) as Side;
          const mon = foe.field[index] ?? null;
          const held = linger.find((item) => item.side === side && item.index === index);
          const shown = mon ?? held?.mon ?? fallenMon(prevDuel.current, duel, side, index);
          const frozen = !mon && Boolean(shown);
          const allyAim = aim?.kind === "skill" && !!selectedCard && allySkill(selectedCard.id);
          const curseStep = aim?.kind === "spell" && aim.spellId === "phan-nguyen" ? (aim.from ? "foe" : "ally") : drag?.kind === "spell" && drag.spellId === "phan-nguyen" ? "ally" : null;
          const witchFoe = aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian";
          const attacking = !!mon && curseStep !== "ally" && (curseStep === "foe" || drag?.kind === "unit" || (drag?.kind === "spell" && drag.spellId !== "sung-loi-pha" && drag.spellId !== "phan-nguyen" && drag.spellId !== "hoan-doi" && drag.spellId !== "ke-dao-mo" && spellDragLive(drag.spellId, duel, viewer, drag.index)) || aim?.kind === "attack" || (aim?.kind === "spell" && aim.spellId !== "phan-nguyen" && aim.spellId !== "sung-loi-pha" && aim.spellId !== "hoan-doi" && aim.spellId !== "ke-dao-mo" && spellDragLive(aim.spellId, duel, viewer, aim.index)) || (aim?.kind === "skill" && !allyAim && !(witchFoe && chronoImmortal(mon))));
          const covered =
            !!mon &&
            mon.cardId === "kazura" &&
            foe.field.some((unit) => unit && unit.cardId === "kizuran" && unit.cover && unit.hp > 0 && unit.stun === 0 && (unit.chain ?? 0) === 0);
          const sheltered = !!mon && sanctuaryShielded(duel, mon.uid) && drag?.kind !== "spell" && aim?.kind !== "spell";
          const untouchable = sheltered || (!!mon && mon.cardId === "kazura" && (mon.safe ?? 0) > 0 && !covered && drag?.kind !== "spell" && aim?.kind !== "skill");
          return (
            <BoardSlot
              key={`f${index}`}
              mon={shown}
              frozen={frozen}
              fading={Boolean(held?.fading)}
              hpOverride={shown ? laserHp[`mon:${shown.uid}`] : undefined}
              side={side}
              near={false}
              index={index}
              layout={fieldLayout}
              hot={attacking && !untouchable}
              tone={drag?.kind === "spell" || aim?.kind === "spell" || aim?.kind === "skill" ? "skill" : "monster"}
              attack={attacking && !untouchable && drag?.kind !== "spell" && !(aim?.kind === "spell" && aim.spellId === "soi-xich-dia-nguc")}
              picked={aim?.kind === "skill" && aim.also === mon?.uid}
              shift={mon ? (attackShift(duel, mon.uid, viewer) ?? (thrust?.uid === mon.uid ? thrust : null)) : null}
              thrust={Boolean(mon && thrust?.uid === mon.uid)}
              motion={motion}
              veil={Boolean(duel.players[side].sea && mon && !mon.cage && !mon.shown && (mon.cardId === "trai-tim-hai-long" || mon.cardId === "sua-hut-ma-phap" || mon.cardId === "kraken"))}
              mask={Boolean(duel.players[side].hats && mon && mon.cardId !== "mu")}
              decoy={Boolean(mon && !mon.cage && mon.cardId === "chien-binh-lan-khuat" && (mon.shown ?? 0) > 0)}
              allies={duel.players[side].field}
              prime={!!mon && isPrime(duel, mon, side)}
              lockFlash={!!mon && lockFlash === mon.uid}
              onSlot={onSlot}
              onUnit={onUnit}
            />
          );
        })}
        {([0, 1, 2] as const).map((index) => {
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
          const grabbable = !!mon && !!card && mon.cardId !== "chan-ken" && mon.stun <= 0 && !(mon.path ?? 0) && (coverDrag || (!mon.dim && (canPlay || canIntercept)));
          return (
            <BoardSlot
              key={`y${index}`}
              mon={shown}
              frozen={frozen}
              fading={Boolean(held?.fading)}
              hpOverride={shown ? laserHp[`mon:${shown.uid}`] : undefined}
              side={viewer}
              near
              index={index}
              layout={fieldLayout}
              hot={((drag?.kind === "summon" || aim?.kind === "summon") && !mon) || (drag?.kind === "spell" && drag.spellId !== "hoan-doi" && drag.spellId !== "phan-nguyen" && drag.spellId !== "soi-xich-dia-nguc" && drag.spellId !== "ke-dao-mo" && spellDragLive(drag.spellId, duel, viewer, drag.index) && !!mon && (drag.spellId !== "sung-loi-pha" || hornFit(mon.cardId))) || (aim?.kind === "spell" && aim.spellId === "sung-loi-pha" && !!mon && hornFit(mon.cardId)) || (aim?.kind === "spell" && aim.spellId === "phan-nguyen" && !aim.from && !!mon && harmShift(mon)) || (!!mon && aim?.kind === "skill" && !!selectedCard && allySkill(selectedCard.id) && (mon.uid !== aim.uid || selectedCard.id === "thien-than-be-nho")) || (!!mon && aim?.kind === "skill" && selectedCard?.id === "phu-thuy-thoi-gian" && witchAllyMark(duel, aim.uid, mon))}
              fuse={Boolean(mon && ((fuseOn && fuseUids.has(mon.uid)) || (drag?.kind === "summon" && (findFusion(drag.card.id, mon.cardId) || findKnightFusion(drag.card.id, mon.cardId, you.field.filter((unit): unit is NonNullable<typeof unit> => Boolean(unit)).map((unit) => unit.cardId))))))}
              fuseHide={Boolean(mon && fuseAsk && fuseAsk.phase !== "ask" && fuseAsk.fieldUid === mon.uid)}
              tone={drag?.kind === "spell" || aim?.kind === "spell" || aim?.kind === "skill" ? "skill" : "monster"}
              picked={!!mon && ((!!aim && "uid" in aim && aim.uid === mon.uid) || duel.hold?.armed === mon.uid || (blessArm && mon.cardId === "yeu-tinh-chuc-phuc"))}
              attack={false}
              shift={mon ? (attackShift(duel, mon.uid, viewer) ?? (thrust?.uid === mon.uid ? thrust : null)) : null}
              thrust={Boolean(mon && thrust?.uid === mon.uid)}
              motion={motion}
              veil={false}
              allies={you.field}
              prime={!!mon && isPrime(duel, mon, viewer)}
              lockFlash={!!mon && lockFlash === mon.uid}
              alert={!!mon && (monsterAlert(duel, mon, viewer) || mysticAlert(duel, mon, viewer))}
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
        <div className={`lane${drag?.kind === "unit" || aim?.kind === "attack" ? " is-hot" : ""}`} />
        {beam && !groupedShot && !seaVeiled(duel, viewer, beam.caster) ? <div className={`attack-beam${beamFromBottom ? " from-bottom" : " from-top"}`} data-beam="1" /> : null}
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
        {drag?.kind === "unit" || aim?.kind === "attack" || (aim?.kind === "skill" && selectedCard && faceSkill(selectedCard.id, aim.index)) ? (
          <button
            type="button"
            className="face-drop"
            data-face="1"
            onClick={() => {
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
          className={`face-pile press${(you.hand.some((id, index) => answerUsable(id, duel, viewer, index)) && (drag?.kind === "unit" || drag?.kind === "summon")) || ((cotton.hand || standHand) && hand === "spell") ? " is-alert" : ""}`}
          style={{
            left: `${board.stack.x}%`,
            top: `${board.stack.y}%`,
            width: `${board.stack.width}%`,
            height: `${board.stack.height}%`,
            fontSize: `${board.stack.size}cqmin`,
          }}
          aria-label={hand === "reserve" ? "Đổi sang bài phép" : "Đổi sang quái thú"}
          onClick={() => {
            setHand((current) => (current === "reserve" ? "spell" : "reserve"));
            setInspect(null);
            setAim((current) => (current?.kind === "summon" ? null : current));
          }}
        >
          {otherCount > 0 ? <b>{otherCount}</b> : null}
          <small>{hand === "reserve" ? tr("Phép") : tr("Quái")}</small>
        </button>
        )}
        <div
          className={`hand is-strip${(hand === "reserve" ? you.reserve.length : you.hand.length) > 3 ? " is-paged" : ""}${riteHand !== null ? " is-rite" : ""}`}
          ref={handStrip}
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
          {hand === "reserve"
            ? you.reserve.map((held, index) => {
                const id = held.id;
                const card = monsterCard(id);
                if (!card) return null;
                const live = reserveLive(held, card);
                const open = inspect?.pile === "reserve" && inspect.index === index;
                const cottonCard = id === "cuc-bong-ma-quai" && cotton.hand;
                const standCard = id === "the-than-cua-shien" && standHand;
                const face = (
                  <button
                    key={`${id}-${index}`}
                    type="button"
                    className={`hand-card press is-monster${open || (aim?.kind === "summon" && aim.index === index) ? " is-open" : ""}${cottonCard || standCard ? " is-alert" : ""}${fuseHands.has(index) ? " is-fuse" : ""}${drag?.kind === "summon" && drag.index === index ? " is-ghosting" : ""}${fuseAsk && fuseAsk.phase !== "ask" && fuseAsk.reserveIndex === index ? " is-fuse-hide" : ""}`}
                    data-reserve={index}
                    data-stars={card.stars}
                    onClick={() => openHand("reserve", index)}
                    onPointerDown={(event) => begin(event, { kind: "summon", index, card })}
                    onPointerMove={move}
                    onPointerUp={end}
                  >
                    <CardFace monster={card} level={held.saved?.level ?? 1} live={live} gems={held.toll ? `${card.gems}+1` : undefined} fake={held.fake} selected={open || (aim?.kind === "summon" && aim.index === index)} />
                    {riteHand === index && !(drag?.kind === "summon" && drag.index === index) ? <RiteRing /> : null}
                  </button>
                );
                if (standCard) {
                  return (
                    <div key={`${id}-${index}`} className="hand-spell is-use">
                      {face}
                      <button type="button" className="spell-use" onClick={() => apply(standIn(duel, index))}>
                        Use
                      </button>
                    </div>
                  );
                }
                if (!cottonCard) return face;
                return (
                  <div key={`${id}-${index}`} className="hand-spell is-use">
                    {face}
                    <button type="button" className="spell-use" onClick={() => setCottonAsk("hand")}>
                      Use
                    </button>
                  </div>
                );
              })
            : you.hand.map((id, index) => {
                const open = inspect?.pile === "spell" && inspect.index === index;
                const tolled = Boolean(you.tolls?.[index]);
                const payable = tollOk(spellCard(id)?.gems ?? 0, tolled, you.orb, you.flask);
                const usable = mine && answerUsable(id, duel, viewer, index);
                const ready = usable;
                const slowUse = canPlay && slowUsable(id, duel, viewer) && payable;
                const using =
                  (aim?.kind === "spell" && aim.spellId === id && aim.index === index) ||
                  (reflectPick?.index === index && id === "la-chan-phan-don") ||
                  (ambushPick?.index === index && id === "phuc-kich");
                const card = (
                  <button
                    key={`${id}-${index}`}
                    type="button"
                    className={`hand-card press is-spell${open ? " is-open" : ""}${ready ? " is-alert" : ""}${drag?.kind === "spell" && drag.index === index ? " is-ghosting" : ""}`}
                    onClick={() => openHand("spell", index)}
                    onPointerDown={(event) => begin(event, { kind: "spell", index, spellId: id })}
                    onPointerMove={move}
                    onPointerUp={end}
                  >
                    <CardFace spellId={id} gems={tolled ? `${spellCard(id)?.gems ?? 0}+1` : undefined} selected={open} />
                  </button>
                );
                if ((!usable && !slowUse) || using) return card;
                return (
                  <div key={`${id}-${index}`} className="hand-spell is-use">
                    {card}
                    <button
                      type="button"
                      className="spell-use"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                      }}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        swallowNextClick();
                        if (id === "ke-dao-mo") {
                          openDig(index);
                          return;
                        }
                        if (id === "hoan-doi") {
                          setSwapPick([]);
                          apply(castSpell(duel, index, aimedUid(duel)));
                          return;
                        }
                        if (slowUse && id === "sung-loi-pha") {
                          setAim({ kind: "spell", index, spellId: id });
                          holdNotice("Chọn quái để gắn sừng.");
                          return;
                        }
                        if (slowUse && id === "phan-nguyen") {
                          if (!you.field.some((mon) => mon && harmShift(mon))) {
                            holdNotice("Không có đồng minh đang mang trạng thái xấu.");
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
                          setReflectPick({ index, uid: null });
                          return;
                        }
                        if (id === "phuc-kich") {
                          const pending = duel.pending;
                          const attacker = pending && "attacker" in pending ? pending.attacker : "";
                          const ready = you.field.some((unit) => unit && unit.stun === 0 && (unit.chain ?? 0) === 0 && unit.cardId !== "chan-ken" && unit.cardId !== "ken-ngai");
                          if (!attacker || !ready) {
                            apply(castSpell(duel, index, null));
                            return;
                          }
                          playCue("chain");
                          setLockFlash(attacker);
                          window.setTimeout(() => setLockFlash((now) => (now === attacker ? null : now)), 800);
                          setAmbushPick({ index, uid: null });
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
                      }}
                    >
                      Use
                    </button>
                  </div>
                );
              })}
          {(hand === "reserve" ? you.reserve.length : you.hand.length) === 0 ? (
            <p className="hand-empty">{hand === "reserve" ? tr("Hết quái dự bị") : tr("Hết phép")}</p>
          ) : null}
        </div>
        <div
          className="actions"
          style={
            actionsMoved
              ? ({
                  left: `${board.actions.x - board.actions.width / 2}%`,
                  top: `${board.actions.y - board.actions.height / 2}%`,
                  right: "auto",
                  width: `${board.actions.width}%`,
                  minHeight: `${board.actions.height}%`,
                  "--act-scale": board.actions.size,
                } as CSSProperties)
              : undefined
          }
        >
          {mine && duel.step === "main" && duel.turn === viewer && !gemHold && !you.drawLock && you.draws < 1 && you.monsterDeck.length > 0 ? (
            <button type="button" className="act medal-act is-draw-mon press" aria-label={tr("Rút quái")} onClick={() => apply(draw(duel, "monster"))}>
              <Medal tone="orange" icon="wolf-head" />
            </button>
          ) : null}
          {mine && duel.step === "main" && duel.turn === viewer && !gemHold && !you.drawLock && you.draws < 1 && you.spellDeck.length > 0 ? (
            <button type="button" className="act medal-act is-draw-spell press" aria-label={tr("Rút phép")} onClick={() => apply(draw(duel, "spell"))}>
              <Medal tone="purple" icon="spell-book" />
            </button>
          ) : null}
          {mine && !askUpkeep && !gemHold && !dueKnight && !knightAsk && !duel.recall && ((duel.step === "main" && duel.turn === viewer) || (responding && duel.hold)) ? (
            <button
              type="button"
              className={`act medal-act press ${responding ? "is-pass" : "is-end"}`}
              aria-label={responding ? "OK" : tr("Hết lượt")}
              onClick={() => apply(responding ? passResponse(duel) : endTurn(duel))}
            >
              <Medal tone={responding ? "blue" : "red"} icon={responding ? "check-mark" : "hourglass"} />
            </button>
          ) : null}
        </div>
        {aim?.kind === "menu" ? (
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
              setChronoSpin({ caster: uid, target: null, index: 2, sector: null });
            }}
            onLure={(uid) => setLureAsk(uid)}
            setAim={setAim}
            apply={apply}
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
              {selectedCard.id === "cuc-bong-ma-quai" ? (
                <>
                  <button type="button" className="act press is-skillbox" onClick={() => { setStrike(null); apply(useSkill(duel, strike.uid, null, 1)); }}>
                    Pháo kích
                  </button>
                </>
              ) : selectedCard.id === "mat-xanh-huy-diet" ? (
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
                  Tia sáng huỷ diệt
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
                mine && inspect.pile === "spell" && (duel.step === "respond" && ANSWER_SPELLS.has(shownSpell.id) ? answerUsable(shownSpell.id, duel, viewer, inspect.index) : shownSpell.id !== "hoan-doi")
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
        {drag ? (
          <div className="ghost" style={{ left: drag.x, top: drag.y }}>
            {drag.kind === "spell" ? (
              <CardFace spellId={drag.spellId} />
            ) : drag.kind === "unit" ? (
              <CardFace monster={drag.card} level={drag.live.level} live={drag.live} />
            ) : (
              <>
                <CardFace monster={drag.card} />
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
        {help ? (
          <div className="overlay">
            <div className="sheet">
              <h2>{tr("Cài đặt")}</h2>
              <p className="tuner-note">{tr("Ngôn ngữ")}</p>
              <div className="pad2">
                <button type="button" className={`act alt press${language === "vi" ? " on" : ""}`} onClick={() => setLang("vi")}>Tiếng Việt</button>
                <button type="button" className={`act alt press${language === "en" ? " on" : ""}`} onClick={() => setLang("en")}>English</button>
              </div>
              <button
                type="button"
                className="act press"
                onClick={() => {
                  setHelp(false);
                  apply(concede(duel, viewer));
                }}
              >
                {tr("Đầu hàng")}
              </button>
              <Link to="/" className="act alt press">
                {tr("Về menu chính")}
              </Link>
              <button type="button" className="act alt press" onClick={() => setHelp(false)}>
                {tr("Đóng")}
              </button>
              <div className="sound-row">
                <button
                  type="button"
                  className={`sound-ico${sound ? "" : " is-off"}`}
                  aria-label={sound ? "Tắt tiếng" : "Bật tiếng"}
                  onClick={() => {
                    const next = !sound;
                    setSound(next);
                    setSoundOn(next);
                    if (next) playCue("draw");
                  }}
                >
                  <SpeakerIcon muted={!sound} />
                </button>
              </div>
              <p className="tuner-note credit-note">Icon kỹ năng: game-icons.net (CC BY 3.0)</p>
            </div>
          </div>
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
          <EndScene win={scene.win} at={scene.at} tone={scene.tone} onDone={() => setEndStep(paidMatch.current?.reward?.changed ? "rewards" : "done")} />
        ) : null}
        {duel.winner !== null && endStep === "rewards" && reward ? <MissionPanel reward={reward} onDone={() => setEndStep("done")} /> : null}
        {duel.winner !== null && endStep === "done" && summed ? (
          <MatchSummary
            win={duel.winner === viewer}
            mode={duel.mode === "ai" ? "Đấu với máy" : quickNet ? "Đánh thường" : "Tuỳ chọn"}
            seconds={matchSeconds}
            you={summarySeat(viewer)}
            foe={summarySeat(viewer === 0 ? 1 : 0)}
            again={againLook}
            onContinue={leaveMatch}
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
        <BoltBurst />
        <LaserBeam />
        <WaterBurst />
        <ShieldBurst />
        </div>
        {fuseShow ? (
          <div className={`fuse3d is-${fuseShow.phase}`}>
            {(fuseShow.phase === "lift" || fuseShow.phase === "clash" || fuseShow.phase === "apart" || fuseShow.phase === "swirl" || fuseShow.phase === "flash") && fuseHeld && fusePartner ? (
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
            {(fuseShow.phase === "turn" || fuseShow.phase === "land") && fuseBorn ? (
              <div className="fuse3d-big" style={{ "--sx": `${fuseShow.at.x}%`, "--sy": `${fuseShow.at.y}%`, "--sw": `${fuseShow.at.w}%` } as CSSProperties}>
                <CardFace monster={monsterCard(fuseShow.resultId)!} />
              </div>
            ) : null}
            {fuseSheet}
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

function UnitChips({
  duel,
  uid,
  viewer,
  attackable,
  blessOn,
  onBless,
  onChronoFlow,
  onLure,
  setAim,
  apply,
}: {
  duel: Duel;
  uid: string;
  viewer: Side;
  attackable: boolean;
  blessOn: boolean;
  onBless: () => void;
  onChronoFlow: (uid: string) => void;
  onLure: (uid: string) => void;
  setAim: (aim: Aim | null) => void;
  apply: (next: Duel) => void;
}) {
  const side = (duel.players[0].field.some((unit) => unit?.uid === uid) ? 0 : 1) as Side;
  const mon = duel.players[side].field.find((unit) => unit?.uid === uid) ?? null;
  const card = mon ? monsterCard(mon.cardId) : undefined;
  const index = duel.players[side].field.findIndex((unit) => unit?.uid === uid);
  if (!mon || !card || index < 0) return null;
  const box = SLOT_BOX[screenSide(side, viewer)][index];
  const you = duel.players[side];
  const noSkill = mon.dim || mon.stun > 0 || (mon.chain ?? 0) > 0 || (mon.path ?? 0) > 0 || hexLocked(mon);
  const noAttack = noSkill || (mon.gag ?? 0) > 0 || card.id === "hoa-an-thit-nguoi";
  const empty = you.field.filter((unit) => !unit).length;
  const y: Array<{ key: string; label: string; go: () => void }> = [];
  const z: Array<{ key: string; label: string; go: () => void }> = [];
  const afford = (cost: number) => Boolean(duel.parley && duel.step === "respond") || you.orb >= cost;
  const aimSkill = (skillIndex: number) => setAim({ kind: "skill", uid, index: skillIndex });
  if (attackable && !noSkill) {
    for (const chip of fieldBindsFor(card.id, {
      cardId: card.id,
      orb: you.orb,
      level: mon.level ?? 1,
      hp: mon.hp,
      beat: mon.beat ?? 0,
      stored: mon.stored ?? 0,
      skillText: plainCopy(card.skill),
      afford,
      aim: aimSkill,
      cast: (index) => apply(useSkill(duel, uid, null, index)),
      declare: (index) => apply(declareSkill(duel, uid, null, index)),
      spent: mon.shed ?? [],
      room: empty,
    })) {
      y.push({ key: chip.key, label: chip.label, go: chip.go });
    }
  }

  if (attackable && !noSkill && !mon.copy && card.id === "ga-he-dang-so") {
    if (you.orb >= 1) y.push({ key: "charge", label: chipLabel(card.id, "charge"), go: () => apply(useSkill(duel, uid, null, 0)) });
    if (mon.charge >= 2) z.push({ key: "cast", label: chipLabel(card.id, "cast"), go: () => aimSkill(1) });
  }
  if (attackable && !mon.copy && card.id === "sat-nhan-bat-giu" && !mon.seized && mon.stun === 0 && (mon.chain ?? 0) === 0 && (mon.path ?? 0) === 0 && !mon.cage) {
    y.push({ key: "seize", label: chipLabel(card.id, "seize"), go: () => aimSkill(0) });
  }
  if (attackable && !noSkill && card.id === "mat-xanh-huy-diet" && !mon.gaze && you.orb >= 1) {
    y.push({ key: "gaze", label: "Tia sáng", go: () => apply(useSkill(duel, uid, null, 0)) });
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
    if (!noSkill) y.push({ key: "lure", label: chipLabel(card.id, "lure"), go: () => aimSkill(3) });
  }
  if (attackable && !noSkill && (card.id === "my-dieu-nhan" || card.id === "nu-chua-dieu-nhan")) {
    const spent = new Set(mon.shed ?? []);
    const gust = card.id === "nu-chua-dieu-nhan" ? 0 : 1;
    const charm = 0;
    if (!spent.has("gust") && you.orb >= gust) y.push({ key: "gust", label: chipLabel(card.id, "gust"), go: () => apply(useSkill(duel, uid, null, 0)) });
    if (card.id === "nu-chua-dieu-nhan" && mon.lure) y.push({ key: "lure", label: chipLabel(card.id, "lure"), go: () => aimSkill(3) });
    else if (!spent.has("charm") && you.orb >= charm) {
      y.push({
        key: "charm",
        label: chipLabel(card.id, "charm"),
        go: () => (card.id === "nu-chua-dieu-nhan" ? onLure(uid) : aimSkill(1)),
      });
    }
  }
  if (attackable && !noSkill && card.id === "hiep-si-cua-hau" && !duel.parley && you.orb >= 1) {
    y.push({ key: "talk", label: tr("Đàm phán"), go: () => apply(startParley(duel, uid)) });
  }
  if (attackable && !noSkill && card.id === "hiep-si-huyen-bi" && !duel.parley && you.orb >= 2) {
    z.push({ key: "talk", label: tr("Đàm phán"), go: () => apply(startParley(duel, uid)) });
  }
  if (attackable && !noSkill && card.id === "phu-thuy-thoi-gian" && you.orb >= 2) y.push({ key: "all", label: chipLabel(card.id, "all"), go: () => onChronoFlow(uid) });
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
  if (attackable && !noSkill && card.id === "may-quay-thuong" && you.orb >= 1) y.push({ key: "rage", label: chipLabel(card.id, "rage"), go: () => aimSkill(1) });
  if (attackable && !noSkill && card.id === "trai-tim-hai-long") {
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
  const strikeShown = attackable && !noAttack && visibleStats(mon, you.field).atk > 0;
  if (!strikeShown && y.length === 0 && z.length === 0) return null;

  // Each button shows the skill's emblem and name as on the monster sheet: the colour of its kind there, or blue
  // for a skill and red for a reaction when the sheet has no such skill. Attack is orange.
  const book = skillsOf(card.id, card.skill ?? "");
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const lookOf = (label: string, tone: "y" | "z"): { icon: string; kind: UnitActKind } => {
    const hit = book.find((row) => same(row.name, label)) ?? book.find((row) => label.toLowerCase().startsWith(row.name.toLowerCase()));
    const kind = hit && hit.kind !== "passive" && hit.kind !== "note" ? hit.kind : tone === "z" ? "risk" : "active";
    return { icon: hit?.icon ?? (tone === "z" ? "magic-swirl" : "sparkles"), kind };
  };
  const rows: Array<{ key: string; label: string; go: () => void; icon: string; kind: UnitActKind }> = [
    ...(strikeShown ? [{ key: "attack", label: attackLabel(), go: () => setAim({ kind: "attack", uid }), icon: "broadsword", kind: "attack" as const }] : []),
    ...y.map((item) => ({ ...item, ...lookOf(item.label, "y") })),
    ...z.map((item) => ({ ...item, ...lookOf(item.label, "z") })),
  ];
  const soloRed = z.length === 1 && y.length === 0 && !strikeShown;
  const wide = Math.max(box.w + 8, 31);
  const left = Math.min(Math.max(box.x + box.w / 2 - wide / 2, 1), 99 - wide);
  return (
    <div className="unit-acts" style={{ left: `${left}%`, width: `${wide}%`, ...(soloRed ? { top: `${box.y + box.h * 0.3}%` } : { bottom: `${100 - box.y + 0.8}%` }) } as CSSProperties}>
      {rows.map((row) => (
        <button key={row.key} type="button" className={`unit-act is-${row.kind} press`} onClick={row.go}>
          <span className="unit-act-ico">
            <span className="unit-act-core">
              <Glyph name={row.icon} />
            </span>
            <Rim kind={row.kind} />
          </span>
          <span className="unit-act-name">{tr(row.label)}</span>
        </button>
      ))}
    </div>
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
    (mon.cardId === "ga-he-dang-so" || mon.cardId === "tho-den-tinh-nghich") && mon.charge > 0
      ? mon.charge
      : mon.cardId === "linh-chien-da-khong-lo" && mon.blocksLeft > 0
        ? mon.blocksLeft
      : (mon.cardId === "kazura" || mon.cardId === "kizuran") && allies.some((unit) => unit && unit.cardId === (mon.cardId === "kazura" ? "kizuran" : "kazura") && unit.hp > 0)
        ? allies.reduce((sum, unit) => sum + (unit && unit.cardId === (mon.cardId === "kazura" ? "kizuran" : "kazura") && unit.hp > 0 ? (unit.stored ?? 0) : 0), 0) || ""
      : mon.cardId === "ken-ngai"
        ? mon.level ?? 0
        : mon.cardId === "con-thinh-no-cua-hai-vuong"
          ? 2 + 3 * (mon.stored ?? 0)
        : mon.cardId === "hiep-si-cua-hau"
          ? mon.beat === 1 ? 2 : 1
        : (mon.level ?? 1) > 1
          ? (mon.level ?? 1)
          : ""
  );
}

/** The monster as it stands on the field, without its name (the sheet shows the name beside it). */
function SheetCard({ mon, allies, layout }: { mon: FieldMon; allies: Array<FieldMon | null>; layout: ReturnType<typeof loadField> }) {
  const stats = visibleStats(mon, allies);
  const spot = (key: FieldKey, value: number, blue: boolean, cut = false) =>
    value === 0 ? null : (
      <span
        className={`fstat${value < 0 || cut ? " is-red" : blue ? " is-blue" : ""}`}
        style={{
          left: `${layout[key].x}%`,
          top: `${layout[key].y}%`,
          fontSize: cardText(layout[key].size, "cqmin"),
          width: `${layout[key].width}%`,
          height: `${layout[key].height}%`,
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
        <img className="frame" src="/field-frame.png" alt="" draggable={false} />
        {spot("def", stats.def, stats.blueDef, fakeCut(mon, "def", stats.def))}
        {spot("mdef", stats.mdef, stats.blueMdef, fakeCut(mon, "mdef", stats.mdef))}
        {spot("atk", stats.atk, stats.blueAtk, fakeCut(mon, "atk", stats.atk))}
        {spot("hp", mon.hp, stats.blueHp, fakeCut(mon, "hp", mon.hp))}
      </span>
    </span>
  );
}

function sheetCount(mon: FieldMon, allies: Array<FieldMon | null>): string {
  const count = fieldCount(mon, allies);
  if (count !== "" && count !== 0) return String(count);
  return (mon.shown ?? 0) > 0 ? String(mon.shown) : "";
}

function BoardSlot({
  mon,
  side,
  index,
  layout,
  near,
  hot,
  fuse = false,
  fuseHide = false,
  tone = "monster",
  picked = false,
  attack,
  shift = null,
  thrust = false,
  motion,
  ghosting,
  frozen = false,
  fading = false,
  prime = false,
  hpOverride,
  alert = false,
  veil = false,
  mask = false,
  decoy = false,
  lockFlash = false,
  allies = [],
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
  fuse?: boolean;
  fuseHide?: boolean;
  tone?: "monster" | "skill";
  picked?: boolean;
  attack: boolean;
  shift?: { x: number; y: number } | null;
  /** The last thrust of a landing blow: a quick move in place of the slow lunge. */
  thrust?: boolean;
  motion: Motion;
  ghosting?: boolean;
  frozen?: boolean;
  fading?: boolean;
  hpOverride?: number;
  prime?: boolean;
  alert?: boolean;
  veil?: boolean;
  mask?: boolean;
  decoy?: boolean;
  lockFlash?: boolean;
  allies?: Array<FieldMon | null>;
  onSlot: (side: Side, index: number) => void;
  onUnit: (side: Side, mon: FieldMon) => void;
  onPointerDown?: (event: ReactPointerEvent) => void;
  onPointerMove?: (event: ReactPointerEvent) => void;
  onPointerUp?: (event: ReactPointerEvent) => void;
}) {
  const cls = `slot slot-${near ? "y" : "f"}${index}${hot ? ` is-hot is-${tone}` : ""}${fuse ? " is-fuse" : ""}${picked ? " is-picked" : ""}${attack ? " is-attack" : ""}${alert ? " is-alert" : ""}${fading ? " is-falling" : ""}${motion.pops.includes(`${side}-${index}`) ? " summon-pop" : ""}${mon && motion.hits.includes(mon.uid) ? " is-hit" : ""}${thrust ? " is-thrust" : ""}`;
  const slotProps = {
    "data-slot": `${side}-${index}`,
    "data-owner": side,
    "data-index": index,
    "data-empty": mon && !frozen ? "0" : "1",
    "data-uid": frozen ? "" : mon?.uid ?? "",
  };
  if (!mon) {
    return <button type="button" className={cls} aria-label={`Ô ${index + 1}`} {...slotProps} onClick={() => onSlot(side, index)} />;
  }
  const tokenName = (monsterCard(mon.cardId)?.stars ?? 1) <= 0;
  const stats = visibleStats(mon, allies);
  const spot = (key: FieldKey, value: string | number, blue = false, hold = false, cut = false) => {
    if (typeof value === "number" && value === 0) return null;
    const red = (typeof value === "number" && value < 0) || cut;
    return (
    <span
      className={`fstat${key === "name" ? " fname" : ""}${key === "count" ? " is-count" : ""}${hold ? " is-hold" : ""}${tokenName && key === "name" ? " is-token" : ""}${red ? " is-red" : ""}${!red && blue ? " is-blue" : ""}`}
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
      style={shift ? { transform: `translate(${shift.x}%, ${shift.y}%)` } : undefined}
      {...slotProps}
      onClick={frozen ? undefined : () => onUnit(side, mon)}
      onPointerDown={frozen ? undefined : onPointerDown}
      onPointerMove={frozen ? undefined : onPointerMove}
      onPointerUp={frozen ? undefined : onPointerUp}
    >
      <span
        className={`field-unit${mask ? "" : `${mon.dim || bind > 0 || lockFlash || hexLocked(mon) ? " is-dim" : ""}${lockFlash ? " is-lockflash" : ""}${prime ? " is-prime" : ""}${holdingMend(mon) ? " is-mending" : ""}`}${lunging ? " is-lunging" : ""}${motion.hits.includes(mon.uid) ? " is-hit" : ""}${ghosting ? " is-dim" : ""}${fuseHide ? " is-fuse-hide" : ""}`}
      >
        {artSrc(mask ? "mu" : mon.cardId, mask ? 1 : mon.level) ? <img className="art" src={artSrc(mask ? "mu" : mon.cardId, mask ? 1 : mon.level)} alt="" draggable={false} style={veil ? { filter: "brightness(0)" } : undefined} /> : null}
        <img className="frame" src="/field-frame.png" alt="" draggable={false} />
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
          {mon.oath?.phys || mon.ward === "phys" ? <i className="is-ward-phys">{tr("Khiên")}</i> : null}
          {mon.oath?.spell || mon.ward === "spell" ? <i className="is-ward-spell">{tr("Phép")}</i> : null}
          {(mon.blessAtk ?? 0) > 0 || (mon.blessDmg ?? 0) > 0 ? <i>{tr("Hồi")}</i> : null}
          {glassLabel ? <i className="is-hold">{glassLabel}</i> : null}
          {mon.preyAim ? <i>{mon.preyKind === "spell" ? "Phép" : mon.preyKind === "tru" ? "Chuẩn" : "Vật"}</i> : null}
          {mon.cage ? <i>Khoá</i> : null}
        </span>
        )}
        {veil || (decoy ? false : !mask && hideName) ? null : spot("name", decoy ? "Thế thân" : mask ? "Mũ" : fieldName(mon))}
        {veil || mask || decoy ? null : spot("def", stats.def, stats.blueDef, false, fakeCut(mon, "def", stats.def))}
        {veil || mask || decoy ? null : spot("mdef", stats.mdef, stats.blueMdef, false, fakeCut(mon, "mdef", stats.mdef))}
        {veil || mask || decoy ? null : spot("atk", stats.atk, stats.blueAtk, false, fakeCut(mon, "atk", stats.atk))}
        {veil ? null : spot("hp", decoy ? (mon.stored ?? 1) : mask ? 1 : (hpOverride ?? mon.hp), decoy || mask ? false : stats.blueHp, false, !decoy && !mask && fakeCut(mon, "hp", mon.hp))}
        {!veil && !mask && !decoy && debtOn ? (
          <span
            className="fstat is-debt"
            style={{
              left: `${layout.count.x}%`,
              top: `${layout.count.y}%`,
              width: `${layout.count.width}%`,
              height: `${layout.count.height}%`,
              fontSize: cardText(layout.count.size, "cqmin"),
            }}
          >
            {debtSlots.map((part) => (
              <b key={part.k} className={`is-${part.k}`}>{part.n > 0 ? part.n : ""}</b>
            ))}
          </span>
        ) : null}
        {!mask && !debtOn && countShown ? spot("count", countShown, false, false) : null}
      </span>
    </button>
  );
}
