import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { tr, useLang } from "@/lib/i18n";
import { listNotes, sendNote, type Note } from "@/lib/notes";

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
      <button
        type="button"
        className="mail-open"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={arm}
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
            <button type="submit" disabled={busy}>OK</button>
            <button type="button" onClick={close}>Huỷ</button>
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
            <input value={code} inputMode="numeric" type="password" onChange={(event) => setCode(event.target.value)} />
          </label>
          <div>
            <button type="submit">OK</button>
            <button type="button" onClick={closeLock}>Huỷ</button>
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
            <button type="button" onClick={() => setInbox(null)}>Huỷ</button>
          </div>
        </section>
      ) : null}
      <div>
        <div className="poster">
          <img src="/title.png" alt="Clash of the Beasts" />
          <Link to="/modes" className="hit hit-play" aria-label="Vào đấu trường" />
          <Link to="/deck" className="hit hit-deck" aria-label="Xây bộ bài" />
        </div>
        {wins > 0 ? <p className="win-note">{tr("Thành đã phá")}: {wins}</p> : null}
        <p className="home-links">
          <Link to="/tune">{tr("Tuỳ chỉnh bàn và lá")}</Link>
          <Link to="/watch">{tr("Thông tin")}</Link>
        </p>
      </div>
    </main>
  );
}
