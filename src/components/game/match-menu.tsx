/**
 * Bảng trong trận (chủ game 12/11): toàn màn, 2 tab. Lịch sử (mặc định): diễn biến trận bằng hình lá, ký hiệu, mũi tên
 * và số máu; lá của mình luôn nằm bên trái, lá đối thủ bên phải, mũi tên chỉ từ bên ra đòn. Cài đặt: ngôn ngữ, âm
 * thanh, đầu hàng, về menu. Phong cách theo menu chính (xanh đen, viền vàng mảnh, góc vát).
 */
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { artSrc, monsterCard, spellCard, spellSrc } from "@/lib/catalog";
import { castName, type Duel, type Side } from "@/lib/duel";
import { buildLog, type LogAct, type LogCard, type LogHit, type LogLine, type LogRound, type LogTarget } from "@/lib/duel-log";
import { tr } from "@/lib/i18n";
import { bookSkill, skillsOf, type SkillShown } from "@/lib/skill-book";
import { playUi } from "@/lib/sfx";
import { Glyph } from "./monster-sheet";
import { Painted } from "./painted";

type Tab = "log" | "set";

const ACT_ICON: Record<LogAct, string> = {
  draw: "card-draw",
  summon: "card-play",
  fuse: "magic-swirl",
  attack: "sword-brandish",
  counter: "sword-clash",
  skill: "sparkles",
  spell: "fairy-wand",
  block: "round-shield",
  cover: "heart-shield",
  wall: "stone-wall",
  reel: "slot-machine",
  upkeep: "sands-of-time",
  effect: "spiky-explosion",
  concede: "ghost",
  win: "laurel-crown",
};

const ACT_NAME: Record<LogAct, string> = {
  draw: "Rút bài",
  summon: "Triệu hồi",
  fuse: "Dung hợp",
  attack: "Tấn công",
  counter: "Trả đòn",
  skill: "Kỹ năng",
  spell: "Phép",
  block: "Chặn",
  cover: "Che chắn",
  wall: "Tường thành",
  reel: "Quay thưởng",
  upkeep: "Duy trì",
  effect: "Hiệu ứng",
  concede: "Đầu hàng",
  win: "Chiến thắng",
};

/** Màu ký hiệu theo loại việc: đánh cam, skill theo màu viền skill, phép hồng, phòng thủ vàng, còn lại vàng nhạt. */
const ACT_TONE: Record<LogAct, string> = {
  draw: "#9fc4e8",
  summon: "#ffd874",
  fuse: "#e58cff",
  attack: "#ff9a3d",
  counter: "#ff9a3d",
  skill: "#5fb0f5",
  spell: "#ff6fb4",
  block: "#f2cf6a",
  cover: "#f2cf6a",
  wall: "#f2cf6a",
  reel: "#ffd874",
  upkeep: "#9fc4e8",
  effect: "#ff8a5c",
  concede: "#c9d3df",
  win: "#ffe08a",
};
const SKILL_TONE: Record<string, string> = { active: "#5fb0f5", risk: "#ff8a3a", spell: "#ff6fb4", passive: "#b98cf5", note: "#f2cf6a" };

/** Trái tim máu người chơi (màu theo phe qua currentColor). */
function Heart() {
  return (
    <svg className="glyph3d" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 21.2c-.3 0-.6-.1-.8-.3C6.3 16.800 2.500 13.400 2.500 9.100 2.500 6 4.900 3.600 7.900 3.600c1.600 0 3.100.8 4.100 2 1-1.200 2.500-2 4.100-2 3 0 5.400 2.400 5.400 5.500 0 4.300-3.800 7.700-8.700 11.800-.2.200-.5.300-.8.300z" />
    </svg>
  );
}

function cardName(card: LogCard | null): string {
  if (!card) return "";
  if (card.veil === "back") return "1 lá bài";
  if (card.veil === "hidden") return "quái thú ẩn mình";
  if (card.veil === "hat") return "Mũ";
  if (!card.id) return "";
  return monsterCard(card.id)?.name ?? spellCard(card.id)?.name ?? "";
}

function skillOf(line: LogLine): SkillShown | undefined {
  const id = line.card?.id;
  if (line.act !== "skill" || !id) return undefined;
  const text = monsterCard(id)?.skill ?? "";
  const book = skillsOf(id, text);
  const usable = book.filter((row) => row.kind !== "passive" && row.kind !== "note");
  if (line.skill === null) return usable[0];
  const label = castName(id, line.skill);
  return bookSkill(id, label, text) ?? (usable.length === 1 ? usable[0] : undefined) ?? (label ? { name: label, kind: "active", icon: "sparkles", text: "" } : usable[0]);
}

function Pic({ card, viewer, mini = false, dead = false }: { card: LogCard; viewer: Side; mini?: boolean; dead?: boolean }) {
  const mine = card.side === viewer;
  const base = `mm-pic ${mine ? "is-mine" : "is-foe"}${mini ? " is-mini" : ""}${dead ? " is-dead" : ""}`;
  if (card.veil === "back") {
    return (
      <span className={`${base} is-back`}>
        <img src={mine ? "/ui/card-back-you.webp" : "/ui/card-back-foe.webp"} alt="" draggable={false} />
      </span>
    );
  }
  if (card.veil === "hidden" || !card.id) {
    return (
      <span className={`${base} is-veil`}>
        <b>?</b>
      </span>
    );
  }
  const art = card.veil === "hat" ? artSrc("mu", 1) : monsterCard(card.id) ? artSrc(card.id, 1) : spellSrc(card.id);
  return (
    <span className={`${base}${spellCard(card.id) && card.veil !== "hat" ? " is-spell" : ""}`}>
      <span className="mm-pic-art" style={{ backgroundImage: `url(${art})` }} />
      {dead ? (
        // Bị hạ: hình vẫn thấy, hai vệt chém trắng mảnh bắt chéo (thon hai đầu) và một đốm sáng ở chỗ giao.
        <svg className="mm-slain" viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M8 8 Q55.5 55.5 92 112 Q44.5 64.5 8 8Z" />
          <path d="M92 8 Q55.5 64.5 8 112 Q44.5 55.5 92 8Z" />
          <path className="mm-slain-gem" d="M50 52 L55.500 60 L50 68 L44.500 60Z" />
        </svg>
      ) : null}
    </span>
  );
}

function Face({ side, viewer, hp }: { side: Side; viewer: Side; hp?: number }) {
  return (
    <span className={`mm-face ${side === viewer ? "is-mine" : "is-foe"}`}>
      <Heart />
      {hp === undefined ? null : <b>{hp}</b>}
    </span>
  );
}

function Loss({ hit }: { hit: LogHit }) {
  if (hit.away) {
    return (
      <span className="mm-loss is-away">
        <Glyph name="card-exchange" fill="currentColor" />
      </span>
    );
  }
  if (hit.blocked) {
    return (
      <span className="mm-loss is-blocked">
        <Glyph name="checked-shield" fill="currentColor" />0
      </span>
    );
  }
  return (
    <span className={`mm-loss${hit.reflect ? " is-reflect" : ""}${hit.delayed ? " is-delayed" : ""}`}>
      {hit.reflect ? <Glyph name="shield-reflect" fill="currentColor" /> : hit.delayed ? <Glyph name="hourglass" fill="currentColor" /> : null}
      {hit.dealt > 0 ? `−${hit.dealt}` : "0"}
    </span>
  );
}

function sameCard(hit: LogHit, line: LogLine): boolean {
  const target = line.target;
  if (!target) return false;
  if (target.face) return hit.card === null && hit.side === target.side;
  if (!hit.card) return false;
  return target.card.uid !== null ? hit.card.uid === target.card.uid : hit.card.id === target.card.id && hit.card.side === target.card.side;
}

function headOf(line: LogLine, viewer: Side): string {
  const who = line.side === viewer ? "Bạn" : "Đối thủ";
  const name = cardName(line.card);
  const aim = line.target ? (line.target.face ? (line.target.side === viewer ? "bạn" : "đối thủ") : cardName(line.target.card)) : "";
  const onto = aim ? ` lên ${aim}` : "";
  const skill = skillOf(line);
  let head: string;
  switch (line.act) {
    case "draw":
      head = `${who} rút ${name}`;
      break;
    case "summon":
      head = `${who} triệu hồi ${name}`;
      break;
    case "fuse":
      head = `${who} dung hợp ${name}`;
      break;
    case "attack":
      head = `${name} tấn công ${aim}`;
      break;
    case "counter":
      head = `${name} trả đòn ${aim}`;
      break;
    case "skill":
      head = `${name} dùng ${skill?.name ?? "kỹ năng"}${onto}`;
      break;
    case "spell":
      head = `${who} dùng ${name}${onto}`;
      break;
    case "block":
      head = `${name} chặn ${aim}`;
      break;
    case "cover":
      head = `${name} che chắn${aim ? ` trước ${aim}` : ""}`;
      break;
    case "wall":
      head = `${name} dựng tường thành${aim ? ` trước ${aim}` : ""}`;
      break;
    case "reel":
      head = `${name} quay thưởng`;
      break;
    case "upkeep":
      head = `${who} duy trì ${name}`;
      break;
    case "concede":
      head = `${who} đầu hàng`;
      break;
    case "win":
      head = `${who} thắng`;
      break;
    default:
      head = "Hiệu ứng";
  }
  return head;
}

/** Chữ chi tiết khi bấm một dòng: in màu như bảng thông báo (tên quái cam, phép hồng, kỹ năng xanh), dòng đầu là
 *  việc, mỗi kết quả một dòng ngắn. */
function Say({ line, viewer }: { line: LogLine; viewer: Side }) {
  return (
    <span className="mm-say">
      <span className="mm-say-head">
        <Painted text={headOf(line, viewer)} />
      </span>
      {line.hits.map((hit, index) => (
        <span key={index} className="mm-say-row">
          {hit.card ? <Painted text={cardName(hit.card)} /> : <b className={hit.side === viewer ? "is-mine" : "is-foe"}>{hit.side === viewer ? "Bạn" : "Đối thủ"}</b>}
          {hit.away ? (
            <i>về bộ bài</i>
          ) : hit.blocked ? (
            <i className="is-ward">chặn hết</i>
          ) : (
            <>
              <b className="mm-say-dmg">−{hit.dealt} máu</b>
              {hit.card ? null : (
                <i>
                  {hit.before} → {hit.after}
                </i>
              )}
              {hit.dead ? <i className="is-dead">bị hạ</i> : null}
              {hit.reflect ? <i>phản đòn</i> : null}
              {hit.delayed ? <i>trả dần</i> : null}
            </>
          )}
        </span>
      ))}
    </span>
  );
}

type Aim = { target: LogTarget; hit?: LogHit };

/** Mục tiêu của một dòng: mục tiêu chính đứng đầu, rồi mọi lá khác bị trúng. Sát thương dội lại chính kẻ ra đòn
 *  (`self`) hiện trên hình kẻ ra đòn, không nằm trong xấp mục tiêu. */
function aimsOf(line: LogLine): { aims: Aim[]; self?: LogHit } {
  const main = line.hits.find((hit) => sameCard(hit, line));
  const actor = line.act === "spell" ? null : line.card;
  const self = actor ? line.hits.find((hit) => hit !== main && hit.card !== null && hit.card.id === actor.id && hit.card.side === actor.side) : undefined;
  const aims: Aim[] = [];
  if (line.target) aims.push({ target: line.target, hit: main });
  for (const hit of line.hits) {
    if (hit === main || hit === self) continue;
    aims.push({ target: hit.card ? { face: false, card: hit.card } : { face: true, side: hit.side }, hit });
  }
  return { aims, self };
}

function Tile({ aim, viewer, mini = false }: { aim: Aim; viewer: Side; mini?: boolean }) {
  if (aim.target.face) return <Face side={aim.target.side} viewer={viewer} hp={aim.hit ? aim.hit.after : undefined} />;
  return <Pic card={aim.target.card} viewer={viewer} mini={mini} dead={Boolean(aim.hit?.dead)} />;
}

/** Một mục tiêu thì một hình; nhiều mục tiêu thì một xấp lá, lá trên cùng là mục tiêu chính, có số lá ở góc. */
function Stack({ aims, viewer }: { aims: Aim[]; viewer: Side }) {
  const [top, ...more] = aims;
  const under = more.slice(0, 2);
  const lone = more.length === 0;
  return (
    <span className={`mm-aim${lone && top.target.face ? " is-face" : ""}${lone ? "" : " is-stack"}`} style={{ ["--more" as string]: under.length }}>
      {under
        .map((aim, index) => (
          <span key={index} className="mm-under" style={{ ["--k" as string]: index + 1 }}>
            <Tile aim={{ target: aim.target }} viewer={viewer} />
          </span>
        ))
        .reverse()}
      <span className="mm-lead">
        <Tile aim={top} viewer={viewer} />
        {top.hit ? <Loss hit={top.hit} /> : null}
      </span>
      {lone ? null : <i className="mm-count">{aims.length}</i>}
    </span>
  );
}

function Line({ line, viewer, open, onTap }: { line: LogLine; viewer: Side; open: boolean; onTap: () => void }) {
  const mine = line.side === viewer;
  const skill = skillOf(line);
  const icon = skill?.icon ?? ACT_ICON[line.act];
  const tone = line.act === "skill" ? (skill?.slow ? "#ff5a4f" : (SKILL_TONE[skill?.kind ?? "active"] ?? ACT_TONE.skill)) : ACT_TONE[line.act];
  const label = line.act === "skill" ? (skill?.name ?? ACT_NAME.skill) : line.act === "spell" ? cardName(line.card) || ACT_NAME.spell : ACT_NAME[line.act];
  const { aims, self } = aimsOf(line);
  const banner = line.act === "win" || line.act === "concede";
  const solo = aims.length === 0 && !banner;
  return (
    <button
      type="button"
      className={`mm-line ${mine ? "is-mine" : "is-foe"} is-${line.act}${line.reply ? " is-reply" : ""}${open ? " is-open" : ""}${banner ? " is-banner" : ""}${solo ? " is-solo" : ""}`}
      style={{ ["--tone" as string]: tone }}
      onClick={onTap}
    >
      <span className="mm-row">
        {line.card ? (
          <span className="mm-actor">
            <Pic card={line.card} viewer={viewer} mini={solo} dead={Boolean(self?.dead)} />
            {self ? <Loss hit={self} /> : null}
          </span>
        ) : line.act === "effect" ? null : (
          <Face side={line.side} viewer={viewer} />
        )}
        <span className="mm-mid">
          <span className="mm-label">{tr(label)}</span>
          <span className="mm-way">
            <span className="mm-badge">
              <Glyph name={icon} fill="currentColor" />
            </span>
            {aims.length > 0 ? <span className="mm-arrow" /> : null}
          </span>
        </span>
        {aims.length > 0 ? <Stack aims={aims} viewer={viewer} /> : null}
      </span>
      {open && aims.length > 1 ? (
        <span className="mm-rest">
          {aims.map((aim, index) => (
            <span key={index} className="mm-chip">
              <Tile aim={aim} viewer={viewer} mini />
              {aim.hit ? <Loss hit={aim.hit} /> : null}
            </span>
          ))}
        </span>
      ) : null}
      {open ? <Say line={line} viewer={viewer} /> : null}
    </button>
  );
}

function RoundHead({ round, viewer }: { round: LogRound; viewer: Side }) {
  const foe: Side = viewer === 0 ? 1 : 0;
  return (
    <div className="mm-round">
      <span className={`mm-round-hp is-mine${round.token === viewer ? " has-token" : ""}`}>
        <Heart />
        <b>{round.hp[viewer]}</b>
        {round.token === viewer ? <Glyph name="sword-brandish" fill="currentColor" /> : null}
      </span>
      <span className="mm-round-name">
        {round.clock === null ? tr("Diễn biến") : `${tr("Vòng")} ${round.clock}`}
        {round.token === null ? null : <em className={round.token === viewer ? "is-mine" : "is-foe"}>{round.token === viewer ? tr("Bạn") : tr("Đối thủ")}</em>}
      </span>
      <span className={`mm-round-hp is-foe${round.token === foe ? " has-token" : ""}`}>
        {round.token === foe ? <Glyph name="sword-brandish" fill="currentColor" /> : null}
        <b>{round.hp[foe]}</b>
        <Heart />
      </span>
    </div>
  );
}

export function MatchMenu({
  duel,
  viewer,
  foeName,
  language,
  sound,
  canConcede,
  onLang,
  onSound,
  onConcede,
  onClose,
}: {
  duel: Duel;
  viewer: Side;
  foeName: string;
  language: string;
  sound: boolean;
  canConcede: boolean;
  onLang: (lang: "vi" | "en") => void;
  onSound: () => void;
  onConcede: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("log");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const body = useRef<HTMLDivElement | null>(null);
  const rounds = useMemo(() => buildLog(duel, viewer), [duel, viewer]);
  const foe: Side = viewer === 0 ? 1 : 0;
  const count = duel.events?.length ?? 0;

  // Mở ra là thấy việc mới nhất (ở dưới cùng).
  useLayoutEffect(() => {
    if (tab !== "log") return;
    const node = body.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [tab, count]);

  const pick = (next: Tab) => {
    if (next === tab) return;
    playUi("select");
    setTab(next);
  };

  let log: ReactNode;
  if (rounds.length === 0) log = <p className="mm-empty">{tr("Chưa có diễn biến nào.")}</p>;
  else {
    log = rounds.map((round) => (
      <section key={round.key} className="mm-sec">
        <RoundHead round={round} viewer={viewer} />
        {round.blocks.map((block) => (
          <div key={block.key} className={`mm-block ${block.lines[0].side === viewer ? "is-mine" : "is-foe"}${block.lines.length > 1 ? " is-chain" : ""}`}>
            {block.lines.map((line) => (
              <Line key={line.key} line={line} viewer={viewer} open={openKey === line.key} onTap={() => setOpenKey((key) => (key === line.key ? null : line.key))} />
            ))}
          </div>
        ))}
      </section>
    ));
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="mm" role="dialog" aria-modal="true" aria-label={tr("Lịch sử và cài đặt")}>
      <div className="mm-stage">
        <header className="mm-top">
          <button type="button" className="mm-back" aria-label={tr("Đóng")} onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.5 4.5 7 12l7.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="mm-score">
            <span className="mm-score-side is-mine">
              <em>{tr("Bạn")}</em>
              <b>
                <Heart />
                {Math.max(duel.players[viewer].hp, 0)}
              </b>
            </span>
            <span className="mm-score-round">
              <i />
              {tr("Vòng")} {duel.clock ?? 1}
              <i />
            </span>
            <span className="mm-score-side is-foe">
              <em>{foeName}</em>
              <b>
                {Math.max(duel.players[foe].hp, 0)}
                <Heart />
              </b>
            </span>
          </div>
        </header>
        <nav className="mm-tabs">
          <button type="button" className={`mm-tab${tab === "log" ? " is-on" : ""}`} onClick={() => pick("log")}>
            <Glyph name="open-book" fill="currentColor" />
            <span>{tr("Lịch sử")}</span>
          </button>
          <i className="mm-tab-gap" />
          <button type="button" className={`mm-tab${tab === "set" ? " is-on" : ""}`} onClick={() => pick("set")}>
            <Glyph name="clockwork" fill="currentColor" />
            <span>{tr("Cài đặt")}</span>
          </button>
        </nav>
        <div className="mm-body" ref={body}>
          {tab === "log" ? (
            log
          ) : (
            <div className="mm-set">
              <section className="mm-card">
                <h3>{tr("Ngôn ngữ")}</h3>
                <div className="mm-pair">
                  <button type="button" className={`mm-opt${language === "vi" ? " is-on" : ""}`} onClick={() => onLang("vi")}>
                    Tiếng Việt
                  </button>
                  <button type="button" className={`mm-opt${language === "en" ? " is-on" : ""}`} onClick={() => onLang("en")}>
                    English
                  </button>
                </div>
              </section>
              <section className="mm-card">
                <h3>{tr("Âm thanh")}</h3>
                <div className="mm-pair">
                  <button type="button" className={`mm-opt${sound ? " is-on" : ""}`} onClick={() => (sound ? undefined : onSound())}>
                    {tr("Bật")}
                  </button>
                  <button type="button" className={`mm-opt${sound ? "" : " is-on"}`} onClick={() => (sound ? onSound() : undefined)}>
                    {tr("Tắt")}
                  </button>
                </div>
              </section>
              <section className="mm-card">
                <h3>{tr("Trận đấu")}</h3>
                <div className="mm-pair">
                  <button type="button" className="mm-opt is-danger" disabled={!canConcede} onClick={onConcede}>
                    {tr("Đầu hàng")}
                  </button>
                  <Link to="/" className="mm-opt">
                    {tr("Về menu chính")}
                  </Link>
                </div>
              </section>
              <p className="mm-credit">Icon kỹ năng: game-icons.net (CC BY 3.0)</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
