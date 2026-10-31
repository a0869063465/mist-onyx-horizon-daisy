import { useState } from "react";
import { plainCode, redeemCode } from "@/lib/app-mode";
import { addStars } from "@/lib/shop";
import { tr } from "@/lib/i18n";

/** Nhập mã: a box for gift codes; for now its codes switch between the publisher and the guest view. */
export function CodeEntry({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  function submit() {
    // S300: 300 stars, as many times as wanted while testing (owner, 19/10).
    if (plainCode(text) === "S300") {
      addStars(300);
      setText("");
      setNote("Đã nhận 300 sao.");
      return;
    }
    const mode = redeemCode(text);
    if (!mode) {
      setNote("Mã không đúng.");
      return;
    }
    setText("");
    setNote(mode === "guest" ? "Đã chuyển sang chế độ khách." : "Đã chuyển sang chế độ nhà phát hành.");
  }
  return (
    <main className="watch menu-page">
      <button type="button" className="watch-back" onClick={onBack}>
        {tr("Quay lại")}
      </button>
      <h1>{tr("Nhập mã")}</h1>
      <form
        className="watch-card code-entry"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          className="tune-input"
          value={text}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label={tr("Nhập mã")}
          onChange={(event) => {
            setText(event.target.value.toUpperCase());
            setNote("");
          }}
        />
        <button type="submit" className="act press" disabled={!text.trim()}>
          {tr("Xác nhận")}
        </button>
        {note ? <p className="code-note">{tr(note)}</p> : null}
      </form>
    </main>
  );
}

