import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { listNotes, type Note } from "@/lib/notes";

export const Route = createFileRoute("/hop-thu")({ component: Inbox });

function Inbox() {
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState<Note[] | null>(null);
  const open = async () => {
    if (code !== "3725") return;
    const rows = await listNotes({ data: { password: code } }).catch(() => [] as Note[]);
    setNotes(rows);
  };
  return (
    <main className="inbox">
      <p className="home-links">
        <Link to="/">Màn hình chính</Link>
      </p>
      {notes === null ? (
        <form
          className="mail-form is-page"
          onSubmit={(event) => {
            event.preventDefault();
            void open();
          }}
        >
          <label>
            Mật khẩu
            <input value={code} inputMode="numeric" type="password" onChange={(event) => setCode(event.target.value)} />
          </label>
          <div>
            <button type="submit">OK</button>
            <Link to="/">Huỷ</Link>
          </div>
        </form>
      ) : (
        <>
          <h1>Hộp thư</h1>
          {notes.length === 0 ? <p>Chưa có góp ý.</p> : null}
          <ul>
            {notes.map((note) => (
              <li key={note.id}>
                <strong>{note.title || "Không tên"}</strong>
                <span>{note.created_at.slice(0, 16).replace("T", " ")}</span>
                <p>{note.body}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
