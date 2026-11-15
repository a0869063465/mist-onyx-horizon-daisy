import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DeckBox, LorDefs } from "@/components/deck-box";
import { GoldText } from "@/components/gold-text";
import { Glyph } from "@/components/game/monster-sheet";
import { artSrc } from "@/lib/catalog";
import { deckIssues, saveDeck } from "@/lib/deck";
import { trialCount } from "@/lib/owned-cards";
import { TRIAL_SWAP_OVER, trialLeft } from "@/lib/trial-deck";

/** A deck with more than 16 trial cards shows the time left on its box (chủ game 08/11). */
function trialMark(row: { monsters: string[]; spells: string[] }): string | null {
  if (typeof localStorage === "undefined") return null;
  return trialCount([...row.monsters, ...row.spells]) > TRIAL_SWAP_OVER ? trialLeft() : null;
}
import {
  cardsOf,
  coverOf,
  deckOrder,
  EDIT_KEY,
  freshDeck,
  loadBook,
  saveBook,
  type DeckEntry,
} from "@/lib/deck-book";
import { tr, useLang } from "@/lib/i18n";
import { fakeIds } from "@/lib/owned-cards";
import { joinRoom, leaveQueue, openRoom, seekMatch, type NetDeck } from "@/lib/net-room";
import { inviteFriend } from "@/lib/friends";
import { loadFriendMatch, PLAYER_NAME, playerId, setFriendMatch, type FriendMatch } from "@/lib/friend-state";

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
function remember(code: string, seat: "host" | "guest", quick = false, friend = false) {
  sessionStorage.setItem("clash-mode", "net");
  sessionStorage.setItem("clash-net", JSON.stringify({ code, seat, ...(quick ? { quick: true } : {}), ...(friend ? { friend: true } : {}) }));
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
  const goNow = useRef(false);
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
  // Mời bạn bè vào trận / nhận lời mời (chủ game 31/10): mỗi người tự chọn bộ bài rồi Chơi ngay.
  const [friend, setFriend] = useState<FriendMatch | null>(null);
  const [friendNote, setFriendNote] = useState("");
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
    setOpen(stored.active);
    setMode(loadMode());
    setFriend(loadFriendMatch());
    setBooted(true);
    // PvP on the home screen (chủ game 15/11): start the ticked deck in the saved mode once the page has its state.
    if (sessionStorage.getItem("clash-go")) {
      sessionStorage.removeItem("clash-go");
      goNow.current = true;
    }
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

  useEffect(() => {
    if (!booted || !goNow.current) return;
    goNow.current = false;
    const row = book.find((item) => item.n === active);
    if (row && !deckIssues(cardsOf(row))) play(row);
  }, [booted]);

  const decks = deckOrder(book);
  const shown = book.find((row) => row.n === open) ?? null;
  const modeInfo = (friend ? MODES.find((item) => item.key === "custom") : MODES.find((item) => item.key === mode)) ?? MODES[0];

  // The builder opens the deck asked for; the tick (the chosen deck) stays where it is (chủ game 15/11).
  function edit(n: number) {
    sessionStorage.setItem(EDIT_KEY, String(n));
    void navigate({ to: "/deck" });
  }

  function makeDeck() {
    const row = freshDeck(book);
    const next = [...book, row];
    setBook(next);
    saveBook({ decks: next, active: active ?? row.n });
    sessionStorage.setItem(EDIT_KEY, String(row.n));
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
    if (friend) {
      void withFriend(row, friend);
      return;
    }
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

  function dropFriend() {
    setFriendMatch(null);
    setFriend(null);
    setFriendNote("");
  }

  async function withFriend(row: DeckEntry, match: FriendMatch) {
    setBusy(true);
    setFriendNote("");
    try {
      if (match.kind === "invite") {
        const opened = await openRoom({ data: { deck: netDeck(row) } });
        const sent = await inviteFriend({ data: { id: playerId(), to: match.to, code: opened.code } });
        if (!sent.ok) {
          setFriendNote(sent.error);
          setBusy(false);
          return;
        }
        setFriendMatch(null);
        remember(opened.code, "host", false, true);
      } else {
        const joined = await joinRoom({ data: { code: match.code, deck: netDeck(row) } });
        if (!joined.ok) {
          setFriendNote(joined.error);
          setBusy(false);
          return;
        }
        setFriendMatch(null);
        remember(joined.code, "guest", false, true);
      }
      await navigate({ to: "/play" });
    } catch (error) {
      setFriendNote(`Mất kết nối.${reasonOf(error)}`);
      setBusy(false);
    }
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

  // --k = bề ngang màn / 848 (số thuần) để nghiêng ảnh tranh theo bìa bằng matrix3d tính theo px của ảnh thiết kế
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const set = () => el.style.setProperty("--k", String(el.clientWidth / 848));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const coverArt = shown?.cover ? artSrc(shown.cover, 1) : null;

  return (
    <main className="dk2-page">
      <LorDefs />
      <div className="dk2" ref={pageRef}>
        <img className="dk2-bg" src="/ui/deck/bg.webp" alt="" draggable={false} />
        <div className="dk2-stage" style={{ ["--rows" as string]: Math.max(2, Math.ceil(decks.length / 3)) }}>
          <Link to="/" className="dk2-btn dk2-back" aria-label={tr("Về sân")} data-ui="select">
            <img src="/ui/deck/back.webp" alt="" draggable={false} />
          </Link>
          {friend ? (
            <div className="lor-invite dk2-invite">
              <span>
                {friend.kind === "invite"
                  ? `${tr("Mời")} ${tr(PLAYER_NAME)} ${friend.to}: ${tr("chọn bộ bài rồi Chơi ngay.")}`
                  : `${tr("Vào trận với")} ${tr(PLAYER_NAME)} ${friend.from}: ${tr("chọn bộ bài rồi Chơi ngay.")}`}
                {friendNote ? <em className="lor-invite-note"> {tr(friendNote)}</em> : null}
              </span>
              <button type="button" onClick={dropFriend}>
                {tr("Huỷ")}
              </button>
            </div>
          ) : null}
          <button type="button" className="dk2-btn dk2-add" onClick={makeDeck} aria-label={tr("Bộ bài mới")} data-ui="select">
            <img src="/ui/deck/add.webp" alt="" draggable={false} />
          </button>
          <button
            type="button"
            className="dk2-btn dk2-choose"
            disabled={!shown || Boolean(deckIssues(cardsOf(shown)))}
            onClick={() => shown && setActive(shown.n)}
            aria-label={tr("Chọn")}
            data-ui="confirm"
          >
            <img src="/ui/deck/choose.webp" alt="" draggable={false} />
          </button>
          <button
            type="button"
            className="dk2-btn dk2-edit"
            disabled={!shown}
            onClick={() => shown && edit(shown.n)}
            aria-label={tr("Chỉnh sửa")}
            data-ui="select"
          >
            <img src="/ui/deck/edit.webp" alt="" draggable={false} />
          </button>
          {decks.map((row, i) => {
            const bad = Boolean(deckIssues(cardsOf(row)));
            const art = row.cover ? artSrc(row.cover, 1) : null;
            const on = row.n === active;
            return (
              <button
                key={row.n}
                type="button"
                className={`dk2-deck dk2-c${i % 3} dk2-r${Math.floor(i / 3)}${row.n === open ? " is-sel" : ""}${on ? " is-on" : ""}${bad ? " is-bad" : ""}`}
                onClick={() => setOpen(row.n)}
                data-ui="select"
              >
                <i className="dk2-art" style={{ backgroundImage: `url(${art ?? "/ui/card-back-you.webp"})` }} />
                <img className="dk2-off dk2-stack" src="/ui/deck/stack.webp" alt="" draggable={false} />
                <img className="dk2-off dk2-plate" src="/ui/deck/plate.webp" alt="" draggable={false} />
                <img className="dk2-glow" src="/ui/deck/deck-on.webp" alt="" draggable={false} />
                <span className="dk2-name">
                  <GoldText text={row.name} capU={18} fitU={142} />
                </span>
                {bad ? (
                  <img className="dk2-mark dk2-bang" src="/ui/deck/bang.webp" alt="" draggable={false} />
                ) : on ? (
                  <img className="dk2-mark dk2-tick" src="/ui/deck/tick.webp" alt="" draggable={false} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
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
  return { ...cards, fake: fakeIds([...cards.monsters, ...cards.spells]), name: row.name, cover: coverOf(row), pid: playerId() };
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
