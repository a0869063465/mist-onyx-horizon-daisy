import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { tr, useLang } from "@/lib/i18n";
import { listNotes, sendNote, type Note } from "@/lib/notes";
import { playUi } from "@/lib/sfx";

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${-((i * 1.7) % 9).toFixed(2)}s`,
  duration: `${7 + ((i * 3) % 6)}s`,
  size: `${3 + (i % 3)}px`,
}));

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [wins, setWins] = useState(0);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);
  const [lock, setLock] = useState(false);
  const [code, setCode] = useState("");
  const [inbox, setInbox] = useState<Note[] | null>(null);
  const held = useRef(false);
  const timer = useRef(0);
  useLang();
  useEffect(() => {
    setWins(Number(localStorage.getItem("clash-wins") ?? "0") || 0);
  }, []);
  const close = () => {
    setOpen(false);
    setTitle("");
    setBody("");
    setFail(false);
  };
  const closeLock = () => {
    setLock(false);
    setCode("");
  };
  const arm = () => {
    held.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      held.current = true;
      close();
      setSent(false);
      setInbox(null);
      setLock(true);
    }, 420);
  };
  const drop = () => {
    window.clearTimeout(timer.current);
  };
  const submit = async () => {
    if (busy) return;
    if (!title.trim() && !body.trim()) return;
    setBusy(true);
    setFail(false);
    try {
      const result = await sendNote({ data: { title, body } });
      if (!result.ok) {
        setFail(true);
        return;
      }
      close();
      setSent(true);
    } catch {
      setFail(true);
    } finally {
      setBusy(false);
    }
  };
  const unlock = async () => {
    if (code !== "3725") return;
    const notes = await listNotes({ data: { password: code } }).catch(() => [] as Note[]);
    closeLock();
    setInbox(notes);
  };
  return (
    <main className="home">
      <div className="home-stage">
        <img className="home-art" src="/home-bg.jpg" alt="Clash of the Beasts" draggable={false} />
        <div className="home-shade" aria-hidden="true" />
        <div className="home-embers" aria-hidden="true">
          {EMBERS.map((ember, index) => (
            <span
              key={index}
              style={{
                left: ember.left,
                width: ember.size,
                height: ember.size,
                animationDelay: ember.delay,
                animationDuration: ember.duration,
              }}
            />
          ))}
        </div>
        {wins > 0 ? (
          <p className="home-wins">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h16M5 20V9l3 2 4-6 4 6 3-2v11" />
            </svg>
            {tr("Thành đã phá")}: <strong>{wins}</strong>
          </p>
        ) : null}
        <button
          type="button"
          className="mail-open"
          data-sfx
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={() => {
            playUi("soft");
            arm();
          }}
          onPointerUp={drop}
          onPointerLeave={drop}
          onPointerCancel={drop}
          onClick={() => {
            if (held.current) return;
            setSent(false);
            closeLock();
            setInbox(null);
            setOpen(true);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M4 7l8 6 8-6" />
          </svg>
          Góp ý
        </button>
        {sent ? <p className="mail-sent">Đã gửi</p> : null}
        {open ? (
          <form
            className="mail-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label>
              Tên vấn đề hoặc lá bài
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Chi tiết
              <textarea value={body} onChange={(event) => setBody(event.target.value)} />
            </label>
            {fail ? <p>Chưa gửi được.</p> : null}
            <div>
              <button type="submit" disabled={busy}>
                OK
              </button>
              <button type="button" onClick={close}>
                Huỷ
              </button>
            </div>
          </form>
        ) : null}
        {lock ? (
          <form
            className="mail-form"
            onSubmit={(event) => {
              event.preventDefault();
              void unlock();
            }}
          >
            <label>
              Mật khẩu
              <input
                value={code}
                inputMode="numeric"
                type="password"
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <div>
              <button type="submit">OK</button>
              <button type="button" onClick={closeLock}>
                Huỷ
              </button>
            </div>
          </form>
        ) : null}
        {inbox ? (
          <section className="mail-form mail-box">
            <h2>Hộp thư</h2>
            {inbox.length === 0 ? <p>Chưa có góp ý.</p> : null}
            <ul>
              {inbox.map((note) => (
                <li key={note.id}>
                  <strong>{note.title || "Không tên"}</strong>
                  <span>{note.created_at.slice(0, 16).replace("T", " ")}</span>
                  <p>{note.body}</p>
                </li>
              ))}
            </ul>
            <div>
              <button type="button" onClick={() => setInbox(null)}>
                Huỷ
              </button>
            </div>
          </section>
        ) : null}
        <nav className="home-menu" aria-label="Menu">
          <Link
            to="/modes"
            className="home-play"
            data-sfx
            onPointerDown={() => playUi("confirm")}
            aria-label="Vào đấu trường"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4l9 9M4 4h4l9 9M4 4v4l9 9M20 4l-9 9M20 4h-4M20 4v4M14 15l3 3M10 15l-3 3M15 19l4-4M9 19l-4-4" />
            </svg>
            <span>{tr("Chơi")}</span>
          </Link>
          {/* Where the deck builder button was (owner, 18/10). Open to everyone (owner, 19/10). */}
          <Link to="/shop" className="home-btn" data-sfx onPointerDown={() => playUi("select")}>
            <ShopIcon />
            <span>{tr("Cửa hàng")}</span>
          </Link>
          {/* Bộ sưu tập under the shop (owner, 19/10). Not open yet either. */}
          <div className="home-btn is-shut" aria-disabled="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="8" y="4" width="11" height="15" rx="1.8" />
              <path d="M5.5 7.5v11A2.5 2.5 0 0 0 8 21h8.5" />
              <path d="M11.5 9.5l2 2.5 2-2.5M13.5 12v3" />
            </svg>
            <span>{tr("Bộ sưu tập")}</span>
            <svg className="home-lock" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9.5" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <div className="home-row">
            <Link to="/tune" className="home-chip" data-sfx onPointerDown={() => playUi("soft")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="8" cy="17" r="2" />
              </svg>
              <span>{tr("Tuỳ chỉnh bàn và lá")}</span>
            </Link>
            <Link to="/watch" className="home-chip" data-sfx onPointerDown={() => playUi("soft")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v6M12 7.5v.5" />
              </svg>
              <span>{tr("Thông tin")}</span>
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9l1.6-5h14.8L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0" />
      <path d="M5 11.6V20h14v-8.4M10 20v-5h4v5" />
    </svg>
  );
}
