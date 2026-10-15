import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loadDeck } from "@/lib/deck";
import { tr, useLang } from "@/lib/i18n";
import { joinRoom, openRoom } from "@/lib/net-room";

export const Route = createFileRoute("/modes")({ component: ModesPage });

function remember(code: string, seat: "host" | "guest") {
  sessionStorage.setItem("clash-mode", "net");
  sessionStorage.setItem("clash-net", JSON.stringify({ code, seat }));
}

function ModesPage() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useLang();

  function goLocal(mode: "ai" | "hotseat" | "test") {
    sessionStorage.setItem("clash-mode", mode);
    sessionStorage.removeItem("clash-net");
    void navigate({ to: "/play" });
  }

  async function host() {
    setBusy(true);
    setNote("");
    try {
      const opened = await openRoom({ data: { deck: loadDeck() } });
      remember(opened.code, "host");
      await navigate({ to: "/play" });
    } catch {
      setNote("Không tạo được mã.");
      setBusy(false);
    }
  }

  async function join() {
    const next = code.trim().toUpperCase();
    if (next.length < 4) {
      setNote("Nhập đủ 4 ký tự.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const joined = await joinRoom({ data: { code: next, deck: loadDeck() } });
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
    <main className="watch">
      <Link to="/" className="watch-back">
        {tr("Về sân")}
      </Link>
      <h1>{tr("Chọn cách chơi")}</h1>
      {online ? (
        <form
          className="room-box"
          onSubmit={(event) => {
            event.preventDefault();
            void join();
          }}
        >
          <h2>Online</h2>
          <button type="button" className="act press" disabled={busy} onClick={() => void host()}>
            {tr("Lấy mã")}
          </button>
          <label>
            {tr("Nhập mã")}
            <input value={code} maxLength={4} autoCapitalize="characters" onChange={(event) => setCode(event.target.value.toUpperCase())} />
          </label>
          <button type="submit" className="act alt press" disabled={busy}>
            {tr("Vào mã")}
          </button>
          {note ? <p>{note}</p> : null}
          <button type="button" className="act alt press" onClick={() => setOnline(false)}>
            {tr("Quay lại")}
          </button>
        </form>
      ) : (
        <div className="mode-list">
          <button type="button" className="act press" onClick={() => goLocal("ai")}>
            {tr("Vs Máy")}
          </button>
          <h2>Vs Player</h2>
          <button type="button" className="act press" onClick={() => goLocal("hotseat")}>
            {tr("2 người 1 máy")}
          </button>
          <button type="button" className="act alt press" onClick={() => setOnline(true)}>
            Online
          </button>
          <button type="button" className="act press" onClick={() => goLocal("test")}>
            Test
          </button>
        </div>
      )}
    </main>
  );
}
