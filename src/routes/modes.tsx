import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { Glyph, GlyphDefs, Rim } from "@/components/game/monster-sheet";
import { artSrc, spellCard, spellSrc } from "@/lib/catalog";
import { deckIssues, saveDeck } from "@/lib/deck";
import { cardsOf, coverOf, deckOrder, freshDeck, loadBook, saveBook, type DeckEntry } from "@/lib/deck-book";
import { tr, useLang } from "@/lib/i18n";
import { joinRoom, openRoom } from "@/lib/net-room";

export const Route = createFileRoute("/modes")({ component: DeckSelectPage });

/** Game modes on a deck's panel (owner, 18/10). Đánh thường (matchmaking) is shown but not open yet. */
type PlayMode = "ai" | "quick" | "custom" | "test";
const MODES: Array<{ key: PlayMode; label: string; icon: string; open: boolean }> = [
  { key: "ai", label: "Vs Máy", icon: "robot-golem", open: true },
  { key: "quick", label: "Đánh thường", icon: "crossed-swords", open: false },
  { key: "custom", label: "Tuỳ chọn", icon: "shaking-hands", open: true },
  { key: "test", label: "Test", icon: "test-tubes", open: true },
];
const MODE_KEY = "clash-play-mode";

function loadMode(): PlayMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return MODES.some((mode) => mode.key === saved && mode.open) ? (saved as PlayMode) : "ai";
  } catch {
    return "ai";
  }
}

function remember(code: string, seat: "host" | "guest") {
  sessionStorage.setItem("clash-mode", "net");
  sessionStorage.setItem("clash-net", JSON.stringify({ code, seat }));
}

/**
 * Chọn bộ bài (owner, 18/10, after the LoR deck screen): what Chơi opens. A grid of decks (favourites first, then
 * the latest changed); tap one for its panel: game mode on top, Yêu thích, Chỉnh sửa, Chơi ngay, Xoá. Bộ bài mới
 * makes an empty deck and opens the deck builder; Hướng dẫn sits top right.
 */
function DeckSelectPage() {
  const navigate = useNavigate();
  const [book, setBook] = useState<DeckEntry[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [booted, setBooted] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [mode, setMode] = useState<PlayMode>("ai");
  const [picking, setPicking] = useState(false);
  const [asking, setAsking] = useState<number | null>(null);
  const [room, setRoom] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useLang();

  useEffect(() => {
    const stored = loadBook();
    // Every deck keeps the cover it was given; a deck whose cover left it gets a new one.
    setBook(stored.decks.map((row) => ({ ...row, cover: coverOf(row) ?? undefined })));
    setActive(stored.active);
    setMode(loadMode());
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    saveBook({ decks: book, active });
  }, [book, active, booted]);

  const decks = deckOrder(book);
  const shown = book.find((row) => row.n === open) ?? null;
  const modeInfo = MODES.find((item) => item.key === mode) ?? MODES[0];

  // The builder opens the book's active deck; the state follows too, so the save after a change keeps it.
  function edit(n: number) {
    setActive(n);
    saveBook({ decks: book, active: n });
    void navigate({ to: "/deck" });
  }

  function makeDeck() {
    const row = freshDeck(book);
    const next = [...book, row];
    setBook(next);
    setActive(row.n);
    saveBook({ decks: next, active: row.n });
    void navigate({ to: "/deck" });
  }

  function toggleFav(n: number) {
    setBook((current) => current.map((row) => (row.n === n ? { ...row, fav: !row.fav } : row)));
  }

  function remove(n: number) {
    const next = book.filter((row) => row.n !== n);
    setBook(next);
    if (active === n) setActive(next[0]?.n ?? null);
    setAsking(null);
    setOpen(null);
  }

  function pickMode(next: PlayMode) {
    if (!MODES.find((item) => item.key === next)?.open) return;
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // The mode is only remembered for next time.
    }
    setPicking(false);
  }

  function goLocal(next: "ai" | "test" | "tutorial") {
    sessionStorage.setItem("clash-mode", next);
    sessionStorage.removeItem("clash-net");
    // The tutorial returns here when it ends or is skipped.
    if (next === "tutorial") sessionStorage.setItem("clash-tutorial-from", window.location.pathname);
    void navigate({ to: "/play" });
  }

  function play(row: DeckEntry) {
    const cards = cardsOf(row);
    if (deckIssues(cards)) return;
    // The match reads the deck to play from the saved deck.
    saveDeck(cards);
    setActive(row.n);
    saveBook({ decks: book, active: row.n });
    if (mode === "custom") {
      setNote("");
      setCode("");
      setRoom(true);
      return;
    }
    goLocal(mode === "test" ? "test" : "ai");
  }

  async function host(row: DeckEntry) {
    setBusy(true);
    setNote("");
    try {
      const opened = await openRoom({ data: { deck: cardsOf(row) } });
      remember(opened.code, "host");
      await navigate({ to: "/play" });
    } catch {
      setNote("Không tạo được mã.");
      setBusy(false);
    }
  }

  async function join(row: DeckEntry) {
    const next = code.trim().toUpperCase();
    if (next.length < 4) {
      setNote("Nhập đủ 4 ký tự.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const joined = await joinRoom({ data: { code: next, deck: cardsOf(row) } });
      if (!joined.ok) {
        setNote(joined.error);
        setBusy(false);
        return;
      }
      remember(joined.code, "guest");
      await navigate({ to: "/play" });
    } catch {
      setNote("Không vào được phòng.");
      setBusy(false);
    }
  }

  return (
    <main className="ds-page">
      <GlyphDefs />
      <header className="dk-head ds-head">
        <Link to="/" className="dk-back" aria-label={tr("Về sân")}>
          {"<<"}
        </Link>
        <h1>{tr("Chọn bộ bài")}</h1>
        <button type="button" className="ds-help" onClick={() => goLocal("tutorial")}>
          <Glyph name="help" fill="#f3dfa6" />
          <span>{tr("Hướng dẫn")}</span>
        </button>
      </header>
      <div className="ds-bar">
        <button type="button" className="ds-new" onClick={makeDeck}>
          <Glyph name="card-play" fill="#f3dfa6" />
          <span>{tr("Bộ bài mới")}</span>
        </button>
      </div>
      <section className="ds-grid">
        {decks.map((row) => (
          <button key={row.n} type="button" className="ds-deck" onClick={() => setOpen(row.n)}>
            <DeckBox row={row} />
            <span className="ds-name">{row.name}</span>
          </button>
        ))}
      </section>
      {shown ? (
        <div className="ds-back" onClick={(event) => event.target === event.currentTarget && setOpen(null)}>
          <div className="ds-panel" role="dialog" aria-label={shown.name}>
            <button type="button" className="msheet-x" aria-label={tr("Đóng")} onClick={() => setOpen(null)}>
              ✕
            </button>
            <button type="button" className="ds-mode" onClick={() => setPicking(true)}>
              <Glyph name={modeInfo.icon} fill="#f3dfa6" />
              <span>{tr(modeInfo.label)}</span>
            </button>
            <div className="ds-stage">
              <button type="button" className={`ds-side is-fav${shown.fav ? " on" : ""}`} onClick={() => toggleFav(shown.n)}>
                <SideGem glyph="round-star" ring="#ff8a3d" deep="#4a1c04" rim="attack" />
                <span>{tr("Yêu thích")}</span>
              </button>
              <div className="ds-cover">
                <DeckBox row={shown} />
              </div>
              <button type="button" className="ds-side" onClick={() => edit(shown.n)}>
                <SideGem glyph="quill-ink" ring="#e9c46a" deep="#3a2a06" rim="note" />
                <span>{tr("Chỉnh sửa")}</span>
              </button>
            </div>
            <h2 className="ds-title">{shown.name}</h2>
            <button type="button" className="ds-play" data-ui="confirm" disabled={Boolean(deckIssues(cardsOf(shown)))} onClick={() => play(shown)}>
              {tr("Chơi ngay")}
            </button>
            <button type="button" className="ds-delete" aria-label={tr("Xoá bộ bài")} onClick={() => setAsking(shown.n)}>
              <Glyph name="trash-can" fill="#ffb4a6" />
            </button>
          </div>
        </div>
      ) : null}
      {picking ? (
        <div className="ds-back is-top" onClick={(event) => event.target === event.currentTarget && setPicking(false)}>
          <div className="ds-modes" role="dialog" aria-label={tr("Chế độ chơi")}>
            <h2>{tr("Chế độ chơi")}</h2>
            <div className="ds-mode-grid">
              {MODES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`ds-mode-pick${item.key === mode ? " on" : ""}${item.open ? "" : " is-shut"}`}
                  disabled={!item.open}
                  onClick={() => pickMode(item.key)}
                >
                  <Glyph name={item.open ? item.icon : "padlock"} fill={item.open ? "#f3dfa6" : "#8d8a83"} />
                  <span>{tr(item.label)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {room && shown ? (
        <div className="ds-back is-top" onClick={(event) => event.target === event.currentTarget && !busy && setRoom(false)}>
          <form
            className="ds-room"
            onSubmit={(event) => {
              event.preventDefault();
              void join(shown);
            }}
          >
            <h2>{tr("Tuỳ chọn")}</h2>
            <button type="button" className="ds-play" data-ui="confirm" disabled={busy} onClick={() => void host(shown)}>
              {tr("Lấy mã")}
            </button>
            <label>
              {tr("Nhập mã")}
              <input value={code} maxLength={4} autoCapitalize="characters" onChange={(event) => setCode(event.target.value.toUpperCase())} />
            </label>
            <button type="submit" className="ds-ghost" disabled={busy}>
              {tr("Vào mã")}
            </button>
            {note ? <p className="ds-note">{tr(note)}</p> : null}
          </form>
        </div>
      ) : null}
      {asking !== null ? (
        <div className="ds-back is-top" onClick={(event) => event.target === event.currentTarget && setAsking(null)}>
          <div className="ds-ask" role="alertdialog">
            <p>{`${tr("Xoá bộ bài")} "${book.find((row) => row.n === asking)?.name ?? ""}"?`}</p>
            <div>
              <button type="button" className="ds-danger" onClick={() => remove(asking)}>
                {tr("Xoá")}
              </button>
              <button type="button" className="ds-ghost" onClick={() => setAsking(null)}>
                {tr("Huỷ")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

/**
 * A deck's box: its cover monster in a gold frame over a stack of cards, a star ribbon for a favourite, a red !
 * on top for a deck that cannot be played yet, and its environment card's icon under the art when it has one.
 */
function DeckBox({ row }: { row: DeckEntry }) {
  const cover = row.cover ?? null;
  const art = cover ? artSrc(cover, 1) : null;
  const env = row.spells.find((id) => spellCard(id)?.env);
  const broken = Boolean(deckIssues(cardsOf(row)));
  return (
    <span className="ds-box">
      <span className="ds-box-art" style={art ? { backgroundImage: `url(${art})` } : undefined} />
      {row.fav ? (
        <span className="ds-flag" aria-label={tr("Yêu thích")}>
          ★
        </span>
      ) : null}
      {broken ? (
        <span className="ds-warn" aria-label={tr("Chưa đủ lá")}>
          !
        </span>
      ) : null}
      {env ? (
        <span className="ds-env">
          <img src={spellSrc(env)} alt="" draggable={false} />
        </span>
      ) : null}
    </span>
  );
}

function SideGem({ glyph, ring, deep, rim }: { glyph: string; ring: string; deep: string; rim: string }) {
  return (
    <span className="sk3d ds-gem" style={{ "--ring": ring, "--deep": deep } as CSSProperties}>
      <span className="sk3d-gem">
        <span className="sk3d-core">
          <Glyph name={glyph} />
        </span>
        <Rim kind={rim} />
      </span>
    </span>
  );
}
