import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DeckBox, LorDefs } from "@/components/deck-box";
import { Glyph } from "@/components/game/monster-sheet";
import { artSrc } from "@/lib/catalog";
import { deckIssues, saveDeck } from "@/lib/deck";
import {
  cardsOf,
  coverOf,
  deckOrder,
  freshDeck,
  loadBook,
  saveBook,
  type DeckEntry,
} from "@/lib/deck-book";
import { tr, useLang } from "@/lib/i18n";
import { fakeIds } from "@/lib/owned-cards";
import { joinRoom, leaveQueue, openRoom, seekMatch, type NetDeck } from "@/lib/net-room";

export const Route = createFileRoute("/modes")({ component: DeckSelectPage });

/**
 * Game modes on a deck's panel (owner, 18/10). Đánh thường pairs two waiting players (`QueueScreen`). `art` is the
 * monster faintly behind its card in the mode picker, as the LoR picker shows a champion behind each choice.
 */
type PlayMode = "ai" | "quick" | "custom" | "test";
const MODES: Array<{ key: PlayMode; label: string; text: string; art: string; open: boolean }> = [
  { key: "ai", label: "Vs Máy", text: "Đấu với máy.", art: "may-quay-thuong", open: true },
  {
    key: "quick",
    label: "Đánh thường",
    text: "Tìm trận với người chơi khác.",
    art: "kiem-si-lua-thieng",
    open: true,
  },
  {
    key: "custom",
    label: "Tuỳ chọn",
    text: "Tạo phòng mời bạn bè, hoặc nhập mã phòng.",
    art: "hiep-si-cua-vua",
    open: true,
  },
  { key: "test", label: "Test", text: "Thử bộ bài tự do.", art: "phu-thuy-thoi-gian", open: true },
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

function reasonOf(error: unknown): string {
  const text = error instanceof Error ? error.message.trim() : "";
  return text ? ` (${text.slice(0, 120)})` : "";
}

/** `quick`: paired by Đánh thường, so the match shows "Đang vào trận…" instead of a code to share. */
function remember(code: string, seat: "host" | "guest", quick = false) {
  sessionStorage.setItem("clash-mode", "net");
  sessionStorage.setItem("clash-net", JSON.stringify({ code, seat, ...(quick ? { quick: true } : {}) }));
}

/**
 * Chọn bộ bài (owner, 18/10): what Chơi opens, made to look like the LoR deck screen the owner recorded. A grid of
 * deck boxes (favourites first, then the latest changed); tap one and its blue panel opens as a band across the
 * screen, dark above and below: the game mode on top, the deck's portrait, the deck box between Yêu thích and
 * Chỉnh sửa, its name, Chơi ngay, and Xoá in the corner. Bộ bài mới makes an empty deck and opens the deck builder;
 * Hướng dẫn (top right) opens the list of tutorials.
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
  const [queueing, setQueueing] = useState(false);
  useLang();

  useEffect(() => {
    const stored = loadBook();
    // Every deck keeps the cover it was given; a deck whose cover left it gets a new one, and a chosen cover that
    // left the deck is no longer the player's choice.
    setBook(
      stored.decks.map((row) => {
        const cover = coverOf(row) ?? undefined;
        return { ...row, cover, coverSet: (row.coverSet && cover === row.cover) || undefined };
      }),
    );
    setActive(stored.active);
    setMode(loadMode());
    setBooted(true);
    // Chơi lại after an Đánh thường match (chủ game 22/10): straight back into the queue with the same deck.
    if (sessionStorage.getItem("clash-requeue")) {
      sessionStorage.removeItem("clash-requeue");
      const row = stored.decks.find((item) => item.n === stored.active);
      if (row && !deckIssues(cardsOf(row))) {
        setOpen(row.n);
        setQueueing(true);
      }
    }
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

  function goLocal(next: "ai" | "test") {
    sessionStorage.setItem("clash-mode", next);
    sessionStorage.removeItem("clash-net");
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
    if (mode === "quick") {
      setQueueing(true);
      return;
    }
    goLocal(mode === "test" ? "test" : "ai");
  }

  async function host(row: DeckEntry) {
    setBusy(true);
    setNote("");
    try {
      const opened = await openRoom({ data: { deck: netDeck(row) } });
      remember(opened.code, "host");
      await navigate({ to: "/play" });
    } catch (error) {
      // The server's reason is shown too, so a failing room server can be told apart from a bad connection.
      setNote(`Không tạo được mã.${reasonOf(error)}`);
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
      const joined = await joinRoom({ data: { code: next, deck: netDeck(row) } });
      if (!joined.ok) {
        setNote(joined.error);
        setBusy(false);
        return;
      }
      remember(joined.code, "guest");
      await navigate({ to: "/play" });
    } catch (error) {
      setNote(`Không vào được phòng.${reasonOf(error)}`);
      setBusy(false);
    }
  }

  const coverArt = shown?.cover ? artSrc(shown.cover, 1) : null;

  return (
    <main className="lor-page">
      <LorDefs />
      <div className="lor-main">
        <header className="lor-head">
          <Link to="/" className="lor-stone is-back" aria-label={tr("Về sân")}>
            {"<<"}
          </Link>
          <h1>{tr("Chọn bộ bài của bạn")}</h1>
          <Link to="/guide" className="lor-stone is-help">
            {tr("Hướng dẫn")}
          </Link>
        </header>
        <div className="lor-bar">
          <button type="button" className="lor-stone" onClick={makeDeck}>
            {tr("Bộ bài mới")}
          </button>
        </div>
        <section className="lor-grid">
          {decks.map((row) => (
            <button
              key={row.n}
              type="button"
              className={`lor-deck${row.n === open ? " on" : ""}`}
              onClick={() => setOpen(row.n)}
            >
              <DeckBox cover={row.cover} spells={row.spells} fav={row.fav} warn={Boolean(deckIssues(cardsOf(row)))} />
              <span className="lor-deck-name">{row.name}</span>
            </button>
          ))}
        </section>
      </div>
      {shown ? (
        <div
          className="lor-drawer-back is-band"
          onClick={(event) => event.target === event.currentTarget && setOpen(null)}
        >
          <aside className="lor-drawer" role="dialog" aria-label={shown.name}>
            <button type="button" className="lor-pill" onClick={() => setPicking(true)}>
              {tr(modeInfo.label)}
            </button>
            <div className="lor-drawer-body">
              <div className="lor-portrait-row">
                <span
                  className="lor-portrait"
                  style={coverArt ? { backgroundImage: `url(${coverArt})` } : undefined}
                />
              </div>
              <div className="lor-stage">
                <div className="lor-side">
                  <button
                    type="button"
                    className={`lor-square is-fav${shown.fav ? " on" : ""}`}
                    aria-pressed={Boolean(shown.fav)}
                    onClick={() => toggleFav(shown.n)}
                  >
                    <Glyph name="round-star" fill="url(#lor-star)" />
                  </button>
                  <span>{tr("Yêu thích")}</span>
                </div>
                <div className="lor-stage-box">
                  <DeckBox cover={shown.cover} spells={shown.spells} fav={shown.fav} warn={Boolean(deckIssues(cardsOf(shown)))} />
                </div>
                <div className="lor-side">
                  <button type="button" className="lor-square" onClick={() => edit(shown.n)}>
                    <Glyph name="quill-ink" fill="url(#lor-silver)" />
                  </button>
                  <span>{tr("Chỉnh sửa")}</span>
                </div>
              </div>
              <h2 className="lor-title">{shown.name}</h2>
              <button
                type="button"
                className="lor-play"
                data-ui="confirm"
                disabled={Boolean(deckIssues(cardsOf(shown)))}
                onClick={() => play(shown)}
              >
                {tr("Chơi ngay")}
              </button>
            </div>
            <button
              type="button"
              className="lor-square is-delete"
              aria-label={tr("Xoá bộ bài")}
              onClick={() => setAsking(shown.n)}
            >
              <Glyph name="trash-can" fill="url(#lor-silver)" />
            </button>
          </aside>
        </div>
      ) : null}
      {picking ? (
        <LorModal art={coverArt} onClose={() => setPicking(false)}>
          <h2 className="lor-modal-title">{tr(modeInfo.label)}</h2>
          <p className="lor-modal-sub">{tr(modeInfo.text)}</p>
          <h3 className="lor-modal-label">{tr("Chọn chế độ chơi")}</h3>
          <div className="lor-cards">
            {MODES.map((item) => {
              const art = artSrc(item.art, 1);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`lor-card${item.key === mode ? " on" : ""}${item.open ? "" : " is-shut"}`}
                  disabled={!item.open}
                  onClick={() => pickMode(item.key)}
                >
                  {art ? (
                    <span className="lor-card-art" style={{ backgroundImage: `url(${art})` }} />
                  ) : null}
                  <b>
                    {item.open ? null : <Glyph name="padlock" fill="#c9c3b6" />}
                    {tr(item.label)}
                  </b>
                  <i aria-hidden="true" />
                  <span>{tr(item.text)}</span>
                </button>
              );
            })}
          </div>
        </LorModal>
      ) : null}
      {queueing && shown ? (
        <QueueScreen
          deck={netDeck(shown)}
          art={coverArt}
          onMatched={(found, seat) => {
            remember(found, seat, true);
            void navigate({ to: "/play" });
          }}
          onCancel={() => setQueueing(false)}
        />
      ) : null}
      {room && shown ? (
        <LorModal art={coverArt} onClose={() => !busy && setRoom(false)}>
          <h2 className="lor-modal-title">{tr("Tuỳ chọn")}</h2>
          <p className="lor-modal-sub">{tr("Tạo phòng mời bạn bè, hoặc nhập mã phòng.")}</p>
          <form
            className="lor-room"
            onSubmit={(event) => {
              event.preventDefault();
              void join(shown);
            }}
          >
            <button
              type="button"
              className="lor-play is-wide"
              data-ui="confirm"
              disabled={busy}
              onClick={() => void host(shown)}
            >
              {tr("Lấy mã")}
            </button>
            <h3 className="lor-modal-label">{tr("Nhập mã")}</h3>
            <div className="lor-room-row">
              <input
                value={code}
                maxLength={4}
                autoCapitalize="characters"
                aria-label={tr("Nhập mã")}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
              <button type="submit" className="lor-stone" disabled={busy}>
                {tr("Vào mã")}
              </button>
            </div>
            {note ? <p className="lor-note">{tr(note)}</p> : null}
          </form>
        </LorModal>
      ) : null}
      {asking !== null ? (
        <LorModal art={coverArt} onClose={() => setAsking(null)}>
          <h2 className="lor-modal-title">{tr("Xoá bộ bài")}</h2>
          <p className="lor-modal-sub">{book.find((row) => row.n === asking)?.name ?? ""}</p>
          <div className="lor-ask">
            <button type="button" className="lor-stone is-danger" onClick={() => remove(asking)}>
              {tr("Xoá")}
            </button>
            <button type="button" className="lor-stone" onClick={() => setAsking(null)}>
              {tr("Huỷ")}
            </button>
          </div>
        </LorModal>
      ) : null}
    </main>
  );
}

/** A deck as a room gets it: the cards, with its name and cover for the VS screen (chủ game 22/10). */
function netDeck(row: DeckEntry): NetDeck {
  const cards = cardsOf(row);
  return { ...cards, fake: fakeIds([...cards.monsters, ...cards.spells]), name: row.name, cover: coverOf(row) };
}

/**
 * Đánh thường's waiting screen, after LoR's (owner, 18/10): a framed panel in the middle of the screen, not a strip
 * down it, with the mode, "Đang trong hàng chờ đối thủ", the deck's portrait, the time waited and Huỷ. It waits
 * until paired or cancelled. The background is /queue-bg.jpg (the owner's picture, portrait) over the deck's art.
 */
function QueueScreen({
  deck,
  art,
  onMatched,
  onCancel,
}: {
  deck: NetDeck;
  art: string | null;
  onMatched: (code: string, seat: "host" | "guest") => void;
  onCancel: () => void;
}) {
  const [ticket] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  );
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const done = useRef(false);
  const matched = useRef(onMatched);
  matched.current = onMatched;
  const cards = useRef(deck);

  useEffect(() => {
    const started = Date.now();
    const clock = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    let waiting = false;
    const seek = async () => {
      if (done.current || waiting) return;
      waiting = true;
      try {
        const found = await seekMatch({ data: { ticket, deck: cards.current } });
        setNote("");
        if (found.phase === "matched" && !done.current) {
          done.current = true;
          matched.current(found.code, found.seat);
        }
      } catch (error) {
        setNote(`Không kết nối được máy chủ.${reasonOf(error)}`);
      } finally {
        waiting = false;
      }
    };
    void seek();
    const timer = window.setInterval(() => void seek(), 1200);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(timer);
    };
  }, [ticket]);

  function cancel() {
    done.current = true;
    void leaveQueue({ data: { ticket } }).catch(() => undefined);
    onCancel();
  }

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className="lor-queue" role="dialog" aria-label={tr("Đánh thường")}>
      {art ? <span className="lor-queue-art" style={{ backgroundImage: `url(${art})` }} /> : null}
      <span className="lor-queue-bg" />
      <section className="lor-queue-box">
        <h2>{tr("Đánh thường")}</h2>
        <p className="lor-queue-sub">{tr("Đang trong hàng chờ đối thủ")}</p>
        <span className="lor-queue-face" style={art ? { backgroundImage: `url(${art})` } : undefined} />
        <p className="lor-queue-time">
          {tr("Đang tìm trận đấu:")} <b>{time}</b>
        </p>
        <button type="button" className="lor-stone" onClick={cancel}>
          {tr("Huỷ")}
        </button>
        {note ? <p className="lor-note">{tr(note)}</p> : null}
      </section>
    </div>
  );
}

/** The LoR mode picker look: a blue panel in a thin gold line, a faded monster behind, a round gold close button. */
function LorModal({
  art,
  onClose,
  children,
}: {
  art: string | null;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="lor-modal-back"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="lor-modal" role="dialog">
        {art ? <span className="lor-modal-art" style={{ backgroundImage: `url(${art})` }} /> : null}
        <button type="button" className="lor-x" aria-label={tr("Đóng")} onClick={onClose}>
          ✕
        </button>
        <div className="lor-modal-body">{children}</div>
      </div>
    </div>
  );
}
