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
        <linearGradient id="act3d-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6cf" />
          <stop offset="0.45" stopColor="#f2c75c" />
          <stop offset="1" stopColor="#a8701a" />
        </linearGradient>
        <linearGradient id="act3d-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe0d6" />
          <stop offset="0.45" stopColor="#ff6a4a" />
          <stop offset="1" stopColor="#a8180a" />
        </linearGradient>
        <linearGradient id="act3d-purple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2ff" />
          <stop offset="0.45" stopColor="#c27aff" />
          <stop offset="1" stopColor="#5a1fa0" />
        </linearGradient>
        <linearGradient id="act3d-fuse" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd6ff" />
          <stop offset="0.48" stopColor="#ee5bff" />
          <stop offset="0.52" stopColor="#ff2d2d" />
          <stop offset="1" stopColor="#9a0010" />
        </linearGradient>
        <linearGradient id="rim3d-active" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eaf8ff" />
          <stop offset="0.3" stopColor="#4f9fe8" />
          <stop offset="0.5" stopColor="#dff3ff" />
          <stop offset="0.75" stopColor="#173f78" />
          <stop offset="1" stopColor="#7cc4ff" />
        </linearGradient>
        <linearGradient id="rim3d-passive" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6eaff" />
          <stop offset="0.3" stopColor="#9a5fe0" />
          <stop offset="0.5" stopColor="#f0dcff" />
          <stop offset="0.75" stopColor="#40156e" />
          <stop offset="1" stopColor="#c69cff" />
        </linearGradient>
        <linearGradient id="pedestal3d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c8" />
          <stop offset="0.45" stopColor="#c9963a" />
          <stop offset="1" stopColor="#5e3c0c" />
        </linearGradient>

      </defs>
    </svg>
  );
}

/** Metal rim with four diamond studs over a round skill emblem: blue for active skills, purple for passive. */
export function Rim({ kind }: { kind: "active" | "passive" }) {
  const metal = `url(#rim3d-${kind})`;
  return (
    <svg className="rim3d" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke={metal} strokeWidth="6" />
      <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="42.6" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
      {[0, 90, 180, 270].map((turn) => (
        <path key={turn} d="M50 -1 L55 5 L50 11 L45 5 Z" fill={metal} stroke="rgba(0,0,0,0.6)" strokeWidth="1" transform={`rotate(${turn} 50 50)`} />
      ))}
    </svg>
  );
}

/** Facet shades of the floating crystal, light to dark, per action colour. */
const CRYSTAL: Record<SheetTone, { top: string[]; low: string[]; glow: string }> = {
  gold: { top: ["#fffbe0", "#ffe98a", "#ffd23c"], low: ["#f5b80f", "#c98a00", "#8a5a00"], glow: "#ffe36a" },
  red: { top: ["#ffe4de", "#ff8a76", "#ff4a35"], low: ["#e0281a", "#a8140a", "#600400"], glow: "#ff5a40" },
  purple: { top: ["#f6e8ff", "#d4a2ff", "#b46cff"], low: ["#9346f0", "#6a22c0", "#3a0a78"], glow: "#c88cff" },
  fuse: { top: ["#ffe6ff", "#f39cff", "#ee5bff"], low: ["#ff3a3a", "#c0101a", "#6a0008"], glow: "#ff6ad8" },
};

/** A faceted crystal floating over a gold ring pedestal (simple 3D, after the owner's reference picture). */
export function Crystal({ tone }: { tone: SheetTone }) {
  const c = CRYSTAL[tone];
  const [t1, t2, t3] = c.top;
  const [l1, l2, l3] = c.low;
  return (
    <svg className="crystal3d" viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <radialGradient id={`crystal-halo-${tone}`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor={c.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="56" rx="44" ry="50" fill={`url(#crystal-halo-${tone})`} opacity="0.6" />
      <g className="crystal3d-base">
        <ellipse cx="50" cy="101" rx="44" ry="12" fill="url(#pedestal3d)" stroke="#3a2406" strokeWidth="1" />
        <ellipse cx="50" cy="99" rx="34" ry="8" fill="#2a1a06" />
        <ellipse cx="50" cy="99" rx="32" ry="7" fill="none" stroke={c.glow} strokeWidth="2.8" opacity="0.95" />
        <ellipse cx="50" cy="99" rx="32" ry="7" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.8" />
        <path d="M42 99 L42 95 Q50 92 58 95 L58 99 Q50 102 42 99 Z" fill="url(#pedestal3d)" stroke="#3a2406" strokeWidth="0.8" />
      </g>
      <g className="crystal3d-gem">
        <polygon points="50,4 22,44 38,52" fill={t2} />
        <polygon points="50,4 38,52 62,52" fill={t1} />
        <polygon points="50,4 62,52 78,44" fill={t3} />
        <polygon points="22,44 38,52 50,88" fill={l2} />
        <polygon points="38,52 62,52 50,88" fill={l1} />
        <polygon points="62,52 78,44 50,88" fill={l3} />
        <polyline points="50,4 38,52 50,88 62,52 50,4" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
        <polyline points="22,44 38,52 62,52 78,44" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.9" />
        <polygon points="50,10 41,40 46,43" fill="#ffffff" opacity="0.75" />
        <path d="M66 20 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#ffffff" />
        <path d="M33 62 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1 Z" fill="#ffffff" opacity="0.85" />
      </g>
    </svg>
  );
}

/** Action tile: dark plate in a glowing frame, the 3D crystal, and beside it the label and the mana it costs. */
export function ActionButton({ action, mini = false }: { action: SheetAction; mini?: boolean }) {
  return (
    <button type="button" className={`act3d is-${action.tone}${mini ? " is-mini" : ""}`} data-ui="confirm" onClick={action.onPress}>
      <span className="act3d-ico">
        <Crystal tone={action.tone} />
      </span>
      <span className="act3d-label">
        {tr(action.label)}
        {action.cost > 0 ? (
          <span className="act3d-cost">
            <i className="mana-gem" />
            <b>{action.cost}</b>
          </span>
        ) : null}
      </span>
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
              <span className="sk3d-core">
                <Glyph name={skill.icon} />
              </span>
              <Rim kind={skill.kind} />
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
            {actions.length ? (
              <div className="msheet-acts">
                {actions.map((action) => (
                  <ActionButton key={action.key} action={action} />
                ))}
              </div>
            ) : null}
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
