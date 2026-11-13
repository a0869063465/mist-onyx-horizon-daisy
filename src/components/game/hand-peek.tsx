import type { CSSProperties } from "react";
import { CopyText } from "@/components/game/copy-text";
import { Glyph, Rim } from "@/components/game/monster-sheet";
import { KEYWORDS, keywordsOf } from "@/lib/keywords";
import { skillCost, type SkillShown } from "@/lib/skill-book";
import { tr } from "@/lib/i18n";

/** What the short panel shows for one card (chủ game 13/11): a monster (stats + skills) or a spell (its text). */
export type PeekInfo = {
  name: string;
  cardId: string;
  stars?: number;
  gems?: number | string;
  stats?: { atk: number; def: number; mdef: number; hp: number };
  skills: SkillShown[];
  /** A spell: its speed colour and its text. */
  tone?: string;
  text?: string;
};

/**
 * Bảng mô tả ngắn (chủ game 13/11, theo video): tên, sao, mana, icon keyword, công / thủ / thủ phép / máu, mô tả MỘT kỹ
 * năng và dãy icon kỹ năng ở đáy. Bấm icon để xem kỹ năng đó; nơi gọi đổi `at` khi lá được bấm thêm lần nữa.
 */
export function HandPeek({ info, at, onPick, top, onTap }: { info: PeekInfo; at: number; onPick: (index: number) => void; top: number; onTap?: () => void }) {
  const keywords = keywordsOf(info.cardId);
  const shown = info.skills.length ? info.skills[Math.min(at, info.skills.length - 1)] : undefined;
  const cost = shown ? skillCost(shown.text) : "";
  return (
    <div className="hand-peek" style={{ top: `${top}%`, ...(info.tone ? ({ "--peek": info.tone } as CSSProperties) : {}) }} role="note" onClick={onTap}>
      <div className="hp-head">
        <b className="hp-name">{tr(info.name)}</b>
        {info.gems ? (
          <span className="msheet-tag tag-gems">
            <img className="tag-gem" src="/ui/gem.webp" alt="" draggable={false} />
            <b>{info.gems}</b>
          </span>
        ) : null}
        {info.stars ? (
          <span className={`msheet-tag tag-stars is-s${Math.min(5, Math.max(1, info.stars))}`}>
            <i className="tag-star" />
            <b>{info.stars}</b>
          </span>
        ) : null}
      </div>
      {info.stats || keywords.length ? (
        <div className="hp-line">
          {keywords.map((id) => (
            <span key={id} className="kw-icon hp-kw" data-kw={id} title={KEYWORDS[id].label}>
              <img src={KEYWORDS[id].src} alt="" draggable={false} />
            </span>
          ))}
          {info.stats ? (
            <span className="hp-stats">
              <span className="is-atk"><i>{tr("Công")}</i><b>{info.stats.atk}</b></span>
              <span className="is-def"><i>{tr("Thủ")}</i><b>{info.stats.def}</b></span>
              <span className="is-mdef"><i>{tr("Thủ phép")}</i><b>{info.stats.mdef}</b></span>
              <span className="is-hp"><i>{tr("Máu")}</i><b>{info.stats.hp}</b></span>
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="hp-desc">
        {shown ? (
          <>
            <b className={`msheet-desc-title is-${shown.kind}${shown.slow ? " is-slow" : ""}`}>
              {tr(shown.name)}
              {cost ? (
                <span className="act3d-cost">
                  <i className="mana-gem" />
                  <b>{cost}</b>
                </span>
              ) : null}
            </b>
            {shown.text ? (
              <p className="ink-skill">
                <CopyText text={shown.text} firstTitle={false} inked />
              </p>
            ) : null}
          </>
        ) : info.text ? (
          <p className="ink-skill">
            <CopyText text={info.text} firstTitle={false} inked />
          </p>
        ) : (
          <p className="msheet-empty">{tr("Không có kỹ năng.")}</p>
        )}
      </div>
      {info.skills.length > 1 ? (
        <div className="hp-icons">
          {info.skills.map((skill, index) => (
            <button
              key={`${skill.name}-${index}`}
              type="button"
              className={`sk3d is-${skill.kind}${skill.slow ? " is-slow" : ""}${index === Math.min(at, info.skills.length - 1) ? " on" : ""}`}
              aria-label={tr(skill.name)}
              onClick={(event) => {
                event.stopPropagation();
                onPick(index);
              }}
            >
              <span className="sk3d-gem">
                <span className="sk3d-core">
                  <Glyph name={skill.icon} />
                </span>
                <Rim kind={skill.slow ? "slow" : skill.kind} />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
