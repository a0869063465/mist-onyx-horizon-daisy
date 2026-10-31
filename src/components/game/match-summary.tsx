import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { DeckBox, LorDefs } from "@/components/deck-box";
import { DeckRow } from "@/components/deck-row";
import { CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { Glyph } from "@/components/game/monster-sheet";
import { artSrc, monsterCard, spellCard, type MonsterCard, type SpellCard } from "@/lib/catalog";
import { byMana, byStars } from "@/lib/deck";
import { tr } from "@/lib/i18n";
import { playSummary } from "@/lib/sfx";

/** One player on the summary: the name and deck of the VS screen, the board behind the row, and the deck brought. */
export type SummarySeat = {
  label: string;
  deck: string | null;
  cover: string | null;
  board: string;
  cards: { monsters: string[]; spells: string[] } | null;
};

/** Chơi lại in Tuỳ chọn: waiting for the other player, a line over the buttons, or no rematch left (they left). */
export type SummaryAgain = { waiting?: boolean; note?: string; tone?: "gold" | "red"; off?: boolean };

const MOTES = 18;

/**
 * Tổng kết trận (T13, chủ game 22/10, after the LoR summary the owner recorded): "CHIẾN THẮNG · ĐẤU VỚI MÁY · 03:16"
 * on top, a row for each player (portrait, name, deck name, the board behind it, the deck box and Tìm hiểu bộ bài,
 * which opens the deck's cards in a blue drawer from the right; a card opens its sheet), Tiếp tục and Chơi lại.
 */
export function MatchSummary({
  win,
  mode,
  seconds,
  you,
  foe,
  again = {},
  onContinue,
  onAgain,
}: {
  win: boolean;
  mode: string;
  seconds: number;
  you: SummarySeat;
  foe: SummarySeat;
  again?: SummaryAgain;
  onContinue: () => void;
  onAgain: () => void;
}) {
  const [shown, setShown] = useState<SummarySeat | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [sheet, setSheet] = useState<{ id: string; kind: "monster" | "spell" } | null>(null);
  const motes = useMemo(
    () =>
      Array.from({ length: MOTES }, (_, i) => ({
        "--x": `${(i * 37 + 11) % 100}%`,
        "--d": `${((i * 0.53) % 6).toFixed(2)}s`,
        "--t": `${(7 + ((i * 1.3) % 5)).toFixed(2)}s`,
        "--s": `${2 + ((i * 7) % 4)}px`,
        "--w": `${((i % 2 ? 1 : -1) * (6 + ((i * 13) % 18))).toFixed(0)}px`,
      })) as CSSProperties[],
    [],
  );

  useEffect(() => {
    playSummary("open");
    playSummary("row", 0.42);
    playSummary("row", 0.6);
  }, []);

  function look(seat: SummarySeat) {
    if (!seat.cards) return;
    playSummary("drawer");
    setLeaving(false);
    setShown(seat);
  }

  // The drawer slides back out before it goes.
  function shut() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, 240);
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className={`ms${win ? " is-win" : " is-lose"}`} role="dialog" aria-label={tr(win ? "CHIẾN THẮNG" : "THẤT BẠI")}>
      <LorDefs />
      <EyeDefs />
      <span className="ms-sky" aria-hidden="true" />
      <span className="ms-motes" aria-hidden="true">
        {motes.map((style, i) => (
          <i key={i} style={style} />
        ))}
      </span>
      <header className="ms-head">
        <h2 className="ms-title">{tr(win ? "CHIẾN THẮNG" : "THẤT BẠI")}</h2>
        <p className="ms-meta">
          <span>{tr(mode)}</span>
          <span>{time}</span>
        </p>
      </header>
      <span className="ms-rule" aria-hidden="true" />
      <section className="ms-rows">
        <SeatRow seat={you} at={0} onLook={() => look(you)} />
        <span className="ms-rule is-mid" aria-hidden="true" />
        <SeatRow seat={foe} at={1} onLook={() => look(foe)} />
      </section>
      <footer className="ms-foot">
        {again.note ? <p className={`ms-note${again.tone === "red" ? " is-red" : ""}`}>{tr(again.note)}</p> : null}
        <div className="ms-buttons">
          <button type="button" className="ms-btn" onClick={onContinue}>
            {tr("Tiếp tục")}
          </button>
          <button
            type="button"
            className={`ms-btn is-main${again.waiting ? " is-waiting" : ""}`}
            data-ui="confirm"
            disabled={Boolean(again.waiting || again.off)}
            onClick={onAgain}
          >
            {tr(again.waiting ? "Đang chờ đối thủ…" : "Chơi lại")}
          </button>
        </div>
      </footer>
      {shown?.cards ? <DeckDrawer seat={shown} cards={shown.cards} leaving={leaving} onPick={setSheet} onClose={shut} /> : null}
      {sheet?.kind === "monster" ? <CardMonsterSheet id={sheet.id} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === "spell" ? <SpellSheet id={sheet.id} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

/** A player's row: their half of the board behind it (yours the lower half, the other player's the upper half), the
 *  round portrait, name and deck name, the deck box and Tìm hiểu bộ bài. */
function SeatRow({ seat, at, onLook }: { seat: SummarySeat; at: number; onLook: () => void }) {
  const art = seat.cover ? artSrc(seat.cover, 1) : null;
  const spells = seat.cards?.spells ?? [];
  return (
    <article className="ms-row" style={{ "--at": at, "--board": `url(${seat.board})`, "--spot": at === 0 ? "50% 80%" : "50% 18%" } as CSSProperties}>
      <span className="ms-row-board" aria-hidden="true" />
      <span className="ms-face" style={art ? { backgroundImage: `url(${art})` } : undefined} aria-hidden="true" />
      <div className="ms-who">
        <b className="ms-name">{tr(seat.label)}</b>
        {seat.deck ? <span className="ms-deck">{tr(seat.deck)}</span> : null}
      </div>
      <span className="ms-box">
        <DeckBox cover={seat.cover} spells={spells} />
      </span>
      <button type="button" className="ms-look" disabled={!seat.cards} onClick={onLook}>
        <span className="lor-square ms-eye">
          <EyeIcon />
        </span>
        <span className="ms-look-text">{tr("Tìm hiểu bộ bài")}</span>
      </button>
    </article>
  );
}

/** "Bộ bài của …": the deck's cards as the deck builder lists them, two to a line as LoR shows them. */
export function DeckDrawer({
  seat,
  cards,
  leaving,
  onPick,
  onClose,
}: {
  seat: SummarySeat;
  cards: { monsters: string[]; spells: string[] };
  leaving: boolean;
  onPick: (pick: { id: string; kind: "monster" | "spell" }) => void;
  onClose: () => void;
}) {
  const monsters = cards.monsters.map((id) => monsterCard(id)).filter((card): card is MonsterCard => Boolean(card)).sort(byStars);
  const spells = cards.spells.map((id) => spellCard(id)).filter((card): card is SpellCard => Boolean(card)).sort(byMana);
  const rows = [...monsters.map((card) => ({ id: card.id, kind: "monster" as const })), ...spells.map((card) => ({ id: card.id, kind: "spell" as const }))];
  return (
    <div className={`ms-drawer-back${leaving ? " is-leaving" : ""}`} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="ms-drawer" role="dialog" aria-label={`${tr("Bộ bài của")} ${tr(seat.label)}`}>
        <button type="button" className="ms-drawer-x" aria-label={tr("Đóng")} onClick={onClose}>
          ✕
        </button>
        <header className="ms-drawer-head">
          <h3>
            <span>{tr("Bộ bài của")}</span> <b>{tr(seat.label)}</b>
          </h3>
          <div className="ms-counts">
            <span title={tr("Quái thú")}>
              <Glyph name="wolf-head" fill="#f4efe2" />
              <b>{monsters.length}</b>
            </span>
            <span title={tr("Phép")}>
              <Glyph name="spell-book" fill="#f4efe2" />
              <b>{spells.length}</b>
            </span>
            <span title={tr("Tổng")}>
              <CardsIcon />
              <b>{monsters.length + spells.length}</b>
            </span>
          </div>
        </header>
        <div className="ms-drawer-list">
          {rows.map((row, i) => (
            <span key={row.id} className="ms-drawer-row" style={{ "--i": i } as CSSProperties}>
              <DeckRow id={row.id} kind={row.kind} onTap={() => onPick(row)} />
            </span>
          ))}
        </div>
      </aside>
    </div>
  );
}

/** The white eye with an amber iris of LoR's Tìm hiểu bộ bài, drawn here. */
function EyeIcon() {
  return (
    <svg className="ms-eye-svg" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M3 24C9.5 13 16.5 8.5 24 8.5S38.5 13 45 24c-6.5 11-13.5 15.5-21 15.5S9.5 35 3 24Z" fill="url(#ms-eye-white)" stroke="#1b1107" strokeWidth="2.4" />
      <circle cx="24" cy="24" r="9.2" fill="url(#ms-eye-iris)" stroke="#3a1c04" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="4" fill="#160a02" />
      <circle cx="20.6" cy="20.4" r="2.2" fill="#ffffff" />
    </svg>
  );
}

/** A small fan of cards for the deck's total. */
function CardsIcon() {
  return (
    <svg className="glyph3d" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="9" y="9" width="21" height="30" rx="3" transform="rotate(-12 19.5 24)" fill="none" stroke="#f4efe2" strokeWidth="3" />
      <rect x="18" y="8" width="21" height="30" rx="3" transform="rotate(10 28.5 23)" fill="#f4efe2" />
    </svg>
  );
}

function EyeDefs() {
  return (
    <svg className="glyph-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <radialGradient id="ms-eye-white" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.75" stopColor="#ece6da" />
          <stop offset="1" stopColor="#b9ae9c" />
        </radialGradient>
        <radialGradient id="ms-eye-iris" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="0.55" stopColor="#e88a1c" />
          <stop offset="1" stopColor="#8a3a05" />
        </radialGradient>
      </defs>
    </svg>
  );
}
