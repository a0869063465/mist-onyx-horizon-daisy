import { useState, type ReactNode } from "react";
import { Medal } from "@/components/game/medal";
import { playIntro } from "@/lib/sfx";
import { tr } from "@/lib/i18n";

/** One card on the hand: its pick ("r:i" / "s:i") and how it looks. */
export type RebirthCard = { pick: string; face: ReactNode };

/**
 * Sinh mệnh mới (Quả trứng sinh mệnh, chủ game 21/11): chọn 1 lá trên tay để bỏ, cùng kiểu bảng đổi bài đầu trận
 * (lá chọn có xoáy tím, OK để dùng, ✕ để thôi).
 */
export function RebirthPanel({
  cards,
  onConfirm,
  onCancel,
  kind = "is-rebirth",
  title = "Sinh mệnh mới",
  sub = "Chọn 1 lá bài để bỏ",
}: {
  cards: RebirthCard[];
  onConfirm: (pick: string) => void;
  /** Không có thì không huỷ được (Đồng hồ khó đoán phải chọn). */
  onCancel?: () => void;
  kind?: string;
  title?: string;
  sub?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const toggle = (pick: string) => {
    const on = picked === pick;
    playIntro(on ? "unmark" : "mark");
    setPicked(on ? null : pick);
  };
  return (
    <div className={`op is-pick ${kind}`} role="dialog" aria-label={tr(title)}>
      <div className="op-dim" onClick={onCancel} />
      <div className="op-head">
        <h2 className="op-title">{tr(title)}</h2>
        <p className="op-sub">{tr(sub)}</p>
      </div>
      <div className="op-row rb-row">
        {cards.map((card) => {
          const marked = picked === card.pick;
          return (
            <div key={card.pick} className={`op-slot${marked ? " is-marked" : ""}`}>
              <button type="button" className="op-card" onClick={() => toggle(card.pick)}>
                <span className="op-flip">
                  <span className="op-front">{card.face}</span>
                </span>
                {marked ? <span className="op-swirl" aria-hidden="true" /> : null}
              </button>
            </div>
          );
        })}
      </div>
      <div className="op-foot rb-foot">
        {onCancel ? (
          <button type="button" className="rb-cancel press" onClick={onCancel}>
            {tr("Huỷ")}
          </button>
        ) : null}
        <button type="button" className="op-ok press" aria-label="OK" disabled={!picked} onClick={() => picked && onConfirm(picked)}>
          <Medal tone="blue" icon="check-mark" />
        </button>
      </div>
    </div>
  );
}
