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
import { buildLog, type LogAct, type LogCard, type LogHit, type LogLine, type LogRound } from "@/lib/duel-log";
import { tr } from "@/lib/i18n";
import { bookSkill, skillsOf, type SkillShown } from "@/lib/skill-book";
import { playUi } from "@/lib/sfx";
import { Glyph } from "./monster-sheet";

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
        <span className="mm-skull">
          <Glyph name="animal-skull" fill="#fff" />
        </span>
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

function sentence(line: LogLine, viewer: Side): string {
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
  const parts = line.hits.map((hit) => {
    const whom = hit.card ? cardName(hit.card) : hit.side === viewer ? "Bạn" : "Đối thủ";
    if (hit.blocked) return `${whom} chặn hết`;
    const tail = hit.dead ? ", bị hạ" : hit.card ? "" : ` (${hit.before} → ${hit.after})`;
    return `${whom} mất ${hit.dealt} máu${hit.delayed ? " (trả dần)" : ""}${hit.reflect ? " (phản đòn)" : ""}${tail}`;
  });
  return parts.length ? `${head}: ${parts.join("; ")}` : head;
}

function Line({ line, viewer, open, onTap }: { line: LogLine; viewer: Side; open: boolean; onTap: () => void }) {
  const mine = line.side === viewer;
  const skill = skillOf(line);
  const icon = skill?.icon ?? ACT_ICON[line.act];
  const tone = line.act === "skill" ? (skill?.slow ? "#ff5a4f" : (SKILL_TONE[skill?.kind ?? "active"] ?? ACT_TONE.skill)) : ACT_TONE[line.act];
  const label = line.act === "skill" ? (skill?.name ?? ACT_NAME.skill) : line.act === "spell" ? cardName(line.card) || ACT_NAME.spell : ACT_NAME[line.act];
  const main = line.hits.find((hit) => sameCard(hit, line));
  const rest = line.hits.filter((hit) => hit !== main);
  const target = line.target;
  const banner = line.act === "win" || line.act === "concede";
  const solo = !target && !banner;
  return (
    <button
      type="button"
      className={`mm-line ${mine ? "is-mine" : "is-foe"} is-${line.act}${line.reply ? " is-reply" : ""}${open ? " is-open" : ""}${banner ? " is-banner" : ""}${solo ? " is-solo" : ""}`}
      style={{ ["--tone" as string]: tone }}
      onClick={onTap}
    >
      <span className="mm-row">
        {line.card ? <Pic card={line.card} viewer={viewer} mini={solo} /> : line.act === "effect" ? null : <Face side={line.side} viewer={viewer} />}
        <span className="mm-mid">
          <span className="mm-label">{tr(label)}</span>
          <span className="mm-way">
            <span className="mm-badge">
              <Glyph name={icon} fill="currentColor" />
            </span>
            {target ? <span className="mm-arrow" /> : null}
          </span>
        </span>
        {target ? (
          <span className={`mm-aim${target.face ? " is-face" : ""}`}>
            {target.face ? <Face side={target.side} viewer={viewer} hp={main ? main.after : undefined} /> : <Pic card={target.card} viewer={viewer} dead={Boolean(main?.dead)} />}
            {main ? <Loss hit={main} /> : null}
          </span>
        ) : null}
      </span>
      {rest.length > 0 ? (
        <span className="mm-rest">
          {rest.map((hit, index) => (
            <span key={index} className="mm-chip">
              {hit.card ? <Pic card={hit.card} viewer={viewer} mini dead={hit.dead} /> : <Face side={hit.side} viewer={viewer} hp={hit.after} />}
              <Loss hit={hit} />
            </span>
          ))}
        </span>
      ) : null}
      {open ? <span className="mm-say">{sentence(line, viewer)}</span> : null}
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
      <span className="mm-round-name">{round.clock === null ? tr("Diễn biến") : `${tr("Vòng")} ${round.clock}`}</span>
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
