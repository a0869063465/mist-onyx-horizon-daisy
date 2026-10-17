import { useEffect, useState, type ReactNode } from "react";
import { CopyText } from "@/components/game/copy-text";
import { SKILL_ICONS } from "@/lib/skill-icons";
import type { SkillShown } from "@/lib/skill-book";
import { tr } from "@/lib/i18n";

/** gold: Triệu hồi. red: Triệu hồi hiến tế. purple: Dung hợp. fuse: summoning a fused monster. */
export type SheetTone = "gold" | "red" | "purple" | "fuse";
export type SheetAction = { key: string; label: string; tone: SheetTone; cost: number; onPress: () => void };

/** A game-icons glyph painted with the shared bevel gradient, so it reads as a raised 3D emblem. */
export function Glyph({ name, fill = "url(#sk3d-glyph)" }: { name: string; fill?: string }) {
  const body = (SKILL_ICONS[name] ?? SKILL_ICONS["info"] ?? "").replaceAll('fill="currentColor"', `fill="${fill}"`);
  return <svg className="glyph3d" viewBox="0 0 512 512" aria-hidden="true" dangerouslySetInnerHTML={{ __html: body }} />;
}

/** Gradients the 3D glyphs and gems share; rendered once per sheet. */
export function GlyphDefs() {
  return (
    <svg className="glyph-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <linearGradient id="sk3d-glyph" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f4f0ff" />
          <stop offset="1" stopColor="#a9b4d6" />
        </linearGradient>
        <linearGradient id="act3d-glyph" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#fff4d6" />
          <stop offset="1" stopColor="#d9b56a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Raised action button: emblem, label, and the mana it costs (hidden when free). */
export function ActionButton({ action, mini = false }: { action: SheetAction; mini?: boolean }) {
  return (
    <button type="button" className={`act3d is-${action.tone}${mini ? " is-mini" : ""}`} data-ui="confirm" onClick={action.onPress}>
      <span className="act3d-ico">
        <Glyph name="crystal-shrine" fill="url(#act3d-glyph)" />
      </span>
      <span className="act3d-label">{tr(action.label)}</span>
      {action.cost > 0 ? (
        <span className="act3d-cost">
          <i className="mana-gem" />
          <b>{action.cost}</b>
        </span>
      ) : null}
    </button>
  );
}

/**
 * Monster sheet: active skills (blue rings) and passive skills (purple rings) on top, the card as it looks on
 * the field with its name and actions beside it, and the description of whichever icon was tapped below.
 */
export function MonsterSheet({
  name,
  card,
  count,
  skills,
  actions,
  note,
  onClose,
}: {
  name: string;
  card: ReactNode;
  /** The orange number the monster shows on the field; empty hides the badge. */
  count: string;
  skills: SkillShown[];
  actions: SheetAction[];
  /** Live figure for this monster (e.g. its current skill damage), shown under the first skill. */
  note?: string;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState(0);
  useEffect(() => setPicked(0), [name]);
  const actives = skills.map((skill, index) => ({ skill, index })).filter((item) => item.skill.kind === "active");
  const passives = skills.map((skill, index) => ({ skill, index })).filter((item) => item.skill.kind === "passive");
  const shown = skills[picked];
  const row = (list: typeof actives) =>
    list.length ? (
      <div className="msheet-row">
        {list.map(({ skill, index }) => (
          <button
            key={`${skill.name}-${index}`}
            type="button"
            className={`sk3d is-${skill.kind}${index === picked ? " on" : ""}`}
            onClick={() => setPicked(index)}
          >
            <span className="sk3d-gem">
              <Glyph name={skill.icon} />
            </span>
            <span className="sk3d-name">{tr(skill.name)}</span>
          </button>
        ))}
      </div>
    ) : null;
  return (
    <div className="msheet-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <GlyphDefs />
      <div className="msheet" role="dialog" aria-label={name}>
        <button type="button" className="msheet-x" aria-label="Đóng" onClick={onClose}>
          ✕
        </button>
        {skills.length ? (
          <div className="msheet-skills">
            {row(actives)}
            {row(passives)}
          </div>
        ) : null}
        <div className="msheet-mid">
          <div className="msheet-card">
            {card}
            {count ? <span className="msheet-count">{count}</span> : null}
          </div>
          <div className="msheet-side">
            <h2 className="msheet-name">{tr(name)}</h2>
            {actions.map((action) => (
              <ActionButton key={action.key} action={action} />
            ))}
          </div>
        </div>
        <div className="msheet-desc">
          {shown ? (
            <>
              <b className={`msheet-desc-title is-${shown.kind}`}>{tr(shown.name)}</b>
              {shown.text ? (
                <p className="ink-skill">
                  <CopyText text={shown.text} />
                </p>
              ) : null}
              {note && picked === 0 ? <p className="msheet-note">{tr(note)}</p> : null}
            </>
          ) : (
            <p className="msheet-empty">{tr("Không có kỹ năng.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
