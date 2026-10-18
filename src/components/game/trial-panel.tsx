import { artSrc } from "@/lib/catalog";
import { tr } from "@/lib/i18n";

/**
 * LoR's challenge panel sliding in from the right (owner's picture 2, 18/10): name, the two monsters VS, a line
 * of text, who it is for, Chơi ngay. Built for the tutorial list, kept for Giám định (owner: keep it, used later).
 */
export function TrialPanel({
  title,
  left,
  right,
  text,
  level,
  onPlay,
  onClose,
}: {
  title: string;
  left: string;
  right: string;
  text: string;
  level: string;
  onPlay: () => void;
  onClose: () => void;
}) {
  return (
    <div className="lor-drawer-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="lor-trial-panel" role="dialog" aria-label={tr(title)}>
        <h2 className="lor-trial-name">{tr(title)}</h2>
        <svg className="lor-flourish" viewBox="0 0 240 20" aria-hidden="true">
          <path d="M3 16h9q4 0 4-4v-2h94M130 10h94v2q0 4 4 4h9" />
          <path d="M110 10l10-7 10 7-10 7z" />
          <circle cx="22" cy="14" r="1.4" />
          <circle cx="218" cy="14" r="1.4" />
        </svg>
        <div className="lor-vs">
          <span className="lor-vs-face" style={{ backgroundImage: `url(${artSrc(left, 1)})` }} />
          <span className="lor-vs-mid">
            <b>VS</b>
            <svg viewBox="0 0 60 14" aria-hidden="true">
              <path d="M0 11H23l7-7 7 7H60" />
            </svg>
          </span>
          <span className="lor-vs-face" style={{ backgroundImage: `url(${artSrc(right, 1)})` }} />
        </div>
        <p className="lor-trial-text">{tr(text)}</p>
        <div className="lor-trial-level">
          <span>{tr("Độ khó đề nghị cho:")}</span>
          <b>{tr(level)}</b>
        </div>
        <button type="button" className="lor-play" data-ui="confirm" onClick={onPlay}>
          {tr("Chơi ngay")}
        </button>
      </aside>
    </div>
  );
}
