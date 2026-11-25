import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Rim, SkillGlyph } from "@/components/game/monster-sheet";
import { tr } from "@/lib/i18n";

/** What a note names: a skill (its round icon in the colour of its kind) or a spell (its picture). */
export type NoteHead = {
  name: string;
  /** The light of the skill's kind or of the spell's speed. */
  tone: string;
  /** A skill: its icon and kind. */
  icon?: string;
  kind?: string;
  /** The picture: the caster's card, or the spell. */
  art?: string | null;
  /** Under the name: who uses it. */
  who?: string;
};

function Head({ head }: { head: NoteHead }) {
  return (
    <div className="an-head">
      {head.art ? (
        <span className="an-art">
          <img src={head.art} alt="" draggable={false} />
        </span>
      ) : null}
      <div className="an-title">
        <b className="an-name">
          {head.icon ? (
            <span className={`an-gem is-${head.kind ?? "active"}`}>
              <span className="unit-act-core">
                <SkillGlyph name={head.icon} />
              </span>
              <Rim kind={head.kind ?? "active"} />
            </span>
          ) : null}
          <span>{tr(head.name)}</span>
        </b>
        {head.who ? <small className="an-who">{head.who}</small> : null}
      </div>
    </div>
  );
}

/** How long a note of the opponent's action stays when nothing closes it (chủ game 14/11). */
const NOTE_MS = 8000;

/**
 * K4 (chủ game 14/11): đối thủ vừa dùng một phép hay một kỹ năng: bảng nhỏ ở đầu màn ghi tên và việc nó làm, mỗi kết quả
 * một dòng, chữ tô màu như bảng thông báo. Tắt khi bấm bất cứ đâu, khi có bảng mới (nơi gọi đổi `key`), hoặc sau 8 giây.
 */
export function FoeNote({ head, lines, onClose }: { head: NoteHead; lines: ReactNode[]; onClose: () => void }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const timer = window.setTimeout(() => close.current(), NOTE_MS);
    // The tap that closes it still does what it was for: the note is never in the way.
    const shut = () => close.current();
    const arm = window.setTimeout(() => document.addEventListener("pointerdown", shut, true), 250);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(arm);
      document.removeEventListener("pointerdown", shut, true);
    };
  }, []);
  return (
    <div className="act-note is-foe" style={{ "--note": head.tone } as CSSProperties} role="status">
      <i className="an-shine" aria-hidden="true" />
      <Head head={head} />
      {lines.length ? (
        <div className="an-lines">
          {lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      ) : null}
      <i className="an-clock" aria-hidden="true" />
    </div>
  );
}

/**
 * K5 (chủ game 14/11): bấm một kỹ năng, một phép (hoặc đòn đánh thường của quái có điều kiện riêng) thì bảng này ghi nó
 * làm gì; OK mới đi tiếp (chọn mục tiêu), Huỷ về lại danh sách vừa chọn. Tắt được trong Cài đặt.
 */
export function ConfirmNote({ head, body, onOk, onCancel }: { head: NoteHead; body: ReactNode; onOk: () => void; onCancel: () => void }) {
  return (
    <div className="act-ask-back" onClick={onCancel}>
      <div className="act-note is-ask" style={{ "--note": head.tone } as CSSProperties} role="dialog" onClick={(event) => event.stopPropagation()}>
        <i className="an-shine" aria-hidden="true" />
        <Head head={head} />
        <div className="an-lines">{body}</div>
        <div className="an-btns">
          <button type="button" className="an-btn press" onClick={onCancel}>
            {tr("Huỷ")}
          </button>
          <button type="button" className="an-btn is-ok press" onClick={onOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
