import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { KEYWORDS, titleKeywords } from "@/lib/keywords";
import { CopyText } from "@/components/game/copy-text";
import { RowArrow, type SummonRow } from "@/components/game/row-arrow";
import { SKILL_ICONS } from "@/lib/skill-icons";
import { skillCost, type SkillKind, type SkillShown } from "@/lib/skill-book";
import { SPELL_KINDS } from "@/lib/spell-kinds";
import { tr } from "@/lib/i18n";
import { useSwipe } from "@/lib/swipe";

/** gold: Triệu hồi. red: Triệu hồi hiến tế. purple: spare. fuse: Dung hợp and summoning a fused monster (the fused-monster pink over red of the notice board). */
export type SheetTone = "gold" | "red" | "purple" | "fuse";
/** `swirl`: a round emblem holding the owner's whirlpool picture (Dung hợp), like Hiến tế's round emblem. */
export type SheetAction = { key: string; label: string; tone: SheetTone; cost: number; emblem?: "swirl"; onPress?: () => void; rows?: SheetRows };
/**
 * A summon button (chủ game 28/10): pressing it hides it, and ↑ (hàng trước) and ↓ (hàng sau) show side by side where it
 * stood; the arrow summons into that row. `front`/`back` false: the row takes no monster, its arrow is dark.
 */
export type SheetRows = { front: boolean; back: boolean; onRow: (row: SummonRow) => void };

/**
 * An icon on a sheet that is not one of the card's skills: Cân bằng (the deck builder) or a spell's kind (the
 * spell sheet). It sits after the skills in the same 3D style: `ring`/`deep` colour the gem, `rim` names the rim
 * gradient (rim3d-<rim>), `body` is what the description shows when it is tapped.
 */
export type SheetExtra = { key: string; name: string; emblem: ReactNode; rim: string; ring: string; deep: string; cost?: number | string; /** A big speed picture in the title, in place of the cost (chủ game 02/11). */ speed?: string; body: ReactNode };

/** `hex` mixed toward `to` by `t` (0 keeps hex, 1 gives to). */
function mixHex(hex: string, to: string, t: number) {
  const parse = (value: string) => [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16));
  const [a, b] = [parse(hex), parse(to)];
  return `#${a.map((value, i) => Math.round(value + (b[i] - value) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** Rim gradient stops in the skills' pattern (light, colour, pale, dark, light colour) for one colour. */
/** Rim colours of the reaction icons, by the colour of their smoke. */
const FLOW_RIMS: Record<string, string> = { red: "#e8352c", blue: "#2f9cf0", pink: "#ff4fa6", white: "#c9d6ea", green: "#2fc56a" };

function rimStops(tone: string): string[] {
  return [mixHex(tone, "#ffffff", 0.85), tone, mixHex(tone, "#ffffff", 0.7), mixHex(tone, "#000000", 0.65), mixHex(tone, "#ffffff", 0.3)];
}

/** A game-icons glyph painted with the shared bevel gradient, so it reads as a raised 3D emblem. */
export function Glyph({ name, fill = "url(#sk3d-glyph)" }: { name: string; fill?: string }) {
  // Hiến Tế of Kỵ sĩ bóng tối: two crossed swords over a shield (chủ game 03/11).
  const raw =
    name === "swords-shield"
      ? `<g opacity="0.5">${SKILL_ICONS["checked-shield"] ?? ""}</g><g transform="translate(76.8 76.8) scale(0.7)" stroke="rgba(0,0,0,0.75)" stroke-width="14" paint-order="stroke">${SKILL_ICONS["crossed-swords"] ?? ""}</g>`
      : (SKILL_ICONS[name] ?? SKILL_ICONS["info"] ?? "");
  const body = raw.replaceAll('fill="currentColor"', `fill="${fill}"`);
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
        <linearGradient id="rim3d-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eafff0" />
          <stop offset="0.3" stopColor="#3fcf6a" />
          <stop offset="0.5" stopColor="#dfffe8" />
          <stop offset="0.75" stopColor="#12632d" />
          <stop offset="1" stopColor="#7cf0a0" />
        </linearGradient>
        <linearGradient id="rim3d-passive" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6eaff" />
          <stop offset="0.3" stopColor="#9a5fe0" />
          <stop offset="0.5" stopColor="#f0dcff" />
          <stop offset="0.75" stopColor="#40156e" />
          <stop offset="1" stopColor="#c69cff" />
        </linearGradient>
        <linearGradient id="rim3d-slow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd9d4" />
          <stop offset="0.3" stopColor="#e0201c" />
          <stop offset="0.5" stopColor="#ffb4ac" />
          <stop offset="0.75" stopColor="#5a0606" />
          <stop offset="1" stopColor="#ff5a4e" />
        </linearGradient>
        <linearGradient id="rim3d-risk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe9d6" />
          <stop offset="0.3" stopColor="#e36c1c" />
          <stop offset="0.5" stopColor="#ffd5b0" />
          <stop offset="0.75" stopColor="#6a2c04" />
          <stop offset="1" stopColor="#ff9a5a" />
        </linearGradient>
        <linearGradient id="rim3d-spell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe8f2" />
          <stop offset="0.3" stopColor="#ff4f93" />
          <stop offset="0.5" stopColor="#ffd9ea" />
          <stop offset="0.75" stopColor="#7a0c3c" />
          <stop offset="1" stopColor="#ff8ab8" />
        </linearGradient>
        <linearGradient id="rim3d-note" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff8d6" />
          <stop offset="0.3" stopColor="#e8b828" />
          <stop offset="0.5" stopColor="#fff2b0" />
          <stop offset="0.75" stopColor="#6e4c00" />
          <stop offset="1" stopColor="#ffd84a" />
        </linearGradient>
        <linearGradient id="rim3d-attack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1dc" />
          <stop offset="0.3" stopColor="#ff8a00" />
          <stop offset="0.5" stopColor="#ffe2b8" />
          <stop offset="0.75" stopColor="#6a2a00" />
          <stop offset="1" stopColor="#ffb04a" />
        </linearGradient>
        {SPELL_KINDS.map((kind) => (
          <linearGradient key={kind.key} id={`rim3d-sp-${kind.key}`} x1="0" y1="0" x2="1" y2="1">
            {rimStops(kind.tone).map((color, at) => (
              <stop key={at} offset={[0, 0.3, 0.5, 0.75, 1][at]} stopColor={color} />
            ))}
          </linearGradient>
        ))}
        {/* Rims of the reaction icons in their smoke's colour (chủ game 23/10). */}
        {Object.entries(FLOW_RIMS).map(([tone, color]) => (
          <linearGradient key={tone} id={`rim3d-flow-${tone}`} x1="0" y1="0" x2="1" y2="1">
            {rimStops(color).map((stop, at) => (
              <stop key={at} offset={[0, 0.3, 0.5, 0.75, 1][at]} stopColor={stop} />
            ))}
          </linearGradient>
        ))}
        {/* Grey steel for the deck builder's filter button. */}
        <linearGradient id="rim3d-steel" x1="0" y1="0" x2="1" y2="1">
          {rimStops("#9aa1ad").map((color, at) => (
            <stop key={at} offset={[0, 0.3, 0.5, 0.75, 1][at]} stopColor={color} />
          ))}
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

/** Emblem colours of the action buttons over a monster on the board: a skill kind, or orange for attack. */
export type UnitActKind = SkillKind | "attack";

/** Mid tone of each rim's metal, for the bar that joins skills that come together. */
const RIM_TONE: Record<SkillKind, string> = { active: "#4f9fe8", passive: "#9a5fe0", risk: "#e36c1c", spell: "#ff4f93", note: "#e8b828" };

/** Metal rim with four diamond studs over a round skill emblem, in the colour of the skill's kind. */
export function Rim({ kind }: { kind: UnitActKind | string }) {
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

/**
 * Action tile in the Lục Thần style: dark plate in a glowing frame, the emblem on top, the label under it with
 * the mana it costs. Triệu hồi and Dung hợp show the 3D crystal on its ring; Hiến tế keeps its round emblem,
 * and its mana gem is red.
 */
export function ActionButton({ action, mini = false }: { action: SheetAction; mini?: boolean }) {
  const [rowsOpen, setRowsOpen] = useState(false);
  const crystal = action.tone !== "red" && !action.emblem;
  const rows = action.rows;
  const tile = (
    <button type="button" className={`act3d is-${action.tone}${mini ? " is-mini" : ""}`} data-ui="confirm" onClick={rows ? () => setRowsOpen(true) : action.onPress}>
      <span className={`act3d-ico${crystal ? " is-crystal" : ""}${action.emblem ? ` is-${action.emblem}` : ""}`}>
        {action.emblem === "swirl" ? <i className="act3d-swirl" /> : crystal ? <Crystal tone={action.tone} /> : <Glyph name="candle-skull" fill="url(#act3d-red)" />}
      </span>
      <span className="act3d-label">
        {tr(action.label)}
        {action.cost > 0 ? (
          <span className="act3d-cost">
            <i className={`mana-gem${action.tone === "red" ? " is-red" : ""}`} />
            <b>{action.cost}</b>
          </span>
        ) : null}
      </span>
    </button>
  );
  if (!rows || !rowsOpen) return tile;
  return (
    <span className={`act3d-rows${mini ? " is-mini" : ""}`}>
      <RowArrow row="front" off={!rows.front} onPick={() => rows.onRow("front")} />
      <RowArrow row="back" off={!rows.back} onPick={() => rows.onRow("back")} />
    </span>
  );
}

/**
 * Monster sheet: skills pressed on the board (blue, red for the risky ones, pink for the spell-like ones) on
 * top, passive skills (purple) and Lưu ý (yellow) under them; the card as it looks on the field with its name
 * and actions beside it; and the description of whichever icon was tapped, with its mana cost, below.
 */
/** Most icons in one row of skills. */
const MAX_ROW = 4;

export function MonsterSheet({
  name,
  card,
  count,
  skills,
  extras = [],
  actions,
  aside,
  note,
  badge,
  tag,
  onClose,
  onArt,
  onBack,
  startSkill,
  stay = false,
  onSwipe,
}: {
  name: string;
  card: ReactNode;
  /** The orange number the monster shows on the field; empty hides the badge. */
  count: string;
  skills: SkillShown[];
  /** Icons after the skills that are not skills: a spell's kind on the spell sheet. */
  extras?: SheetExtra[];
  actions: SheetAction[];
  /** Shown beside the card under its name (the deck builder's power balance notes). */
  aside?: ReactNode;
  /** Live figure for this monster (e.g. its current skill damage), shown under the first skill. */
  note?: string;
  /** On the card's top right corner (the collection's rarity tag). */
  badge?: ReactNode;
  /** Beside the name (chủ game 02/11): the stars (coloured by their number) and the gems the card costs, if any. */
  tag?: { stars?: number; gems?: number | string };
  onClose: () => void;
  /** Tapping the card: the 3D fan of its related cards (owner, 19/10). Without it the card is only a picture. */
  onArt?: () => void;
  /** A sheet opened from the fan: "<<" (and a tap outside the sheet) goes back to the fan. */
  onBack?: () => void;
  /** A sheet opened from a reaction icon opens on the skill being used (chủ game 23/10): its name or button label. */
  startSkill?: string;
  /** No ✕ and no tap outside to close (chủ game 28/10: a fused monster must be summoned, the fusion cannot be undone). */
  stay?: boolean;
  /** Vuốt ngang đổi sang lá kế (chủ game 06/11): +1 = vuốt trái. Trả false khi không còn lá để đổi. */
  onSwipe?: (dir: 1 | -1) => boolean | void;
}) {
  const [slide, setSlide] = useState<0 | 1 | -1>(0);
  const swipe = useSwipe((dir) => {
    if (!onSwipe) return false;
    if (onSwipe(dir) === false) return false;
    setSlide(dir);
  }, true);
  const wanted = startSkill?.trim().toLowerCase() ?? "";
  const startAt = wanted ? skills.findIndex((skill) => skill.name.toLowerCase() === wanted || wanted.startsWith(skill.name.toLowerCase())) : -1;
  const first = startAt >= 0 ? `s${startAt}` : skills.length ? "s0" : extras[0] ? `x:${extras[0].key}` : "";
  const [picked, setPicked] = useState(first);
  useEffect(() => setPicked(first), [name, startSkill]); // eslint-disable-line react-hooks/exhaustive-deps
  // Skills that come together stay in one group, in the row of the first of them.
  const groups: Array<Array<{ skill: SkillShown; index: number }>> = [];
  skills.forEach((skill, index) => {
    if (skill.chain && groups.length) groups[groups.length - 1].push({ skill, index });
    else groups.push([{ skill, index }]);
  });
  const shown = picked.startsWith("s") ? skills[Number(picked.slice(1))] : undefined;
  const extra = picked.startsWith("x:") ? extras.find((item) => `x:${item.key}` === picked) : undefined;
  const cost = shown ? skillCost(shown.text) : "";
  const icon = ({ skill, index }: { skill: SkillShown; index: number }) => (
    <button
      key={`${skill.name}-${index}`}
      type="button"
      className={`sk3d is-${skill.kind}${skill.slow ? " is-slow" : ""}${`s${index}` === picked ? " on" : ""}`}
      onClick={() => setPicked(`s${index}`)}
    >
      <span className="sk3d-gem">
        <span className="sk3d-core">
          <Glyph name={skill.icon} />
        </span>
        <Rim kind={skill.slow ? "slow" : skill.kind} />
      </span>
      <span className="sk3d-name">{tr(skill.name)}</span>
    </button>
  );
  const extraIcon = (item: SheetExtra) => (
    <button
      key={`x-${item.key}`}
      type="button"
      className={`sk3d is-extra is-${item.key}${`x:${item.key}` === picked ? " on" : ""}`}
      style={{ "--ring": item.ring, "--deep": item.deep } as CSSProperties}
      onClick={() => setPicked(`x:${item.key}`)}
    >
      <span className="sk3d-gem">
        <span className="sk3d-core">{item.emblem}</span>
        <Rim kind={item.rim} />
      </span>
      <span className="sk3d-name">{tr(item.name)}</span>
    </button>
  );
  // At most 4 icons to a row, and no third row before 9 skills (chủ game 02/11). Skills of one colour sit together:
  // singles first (by colour), then the chains, then the extra icons. A chain stays whole in a row when that costs no
  // extra row; otherwise rows fill evenly and the metal bar breaks at the row's edge.
  const rank: Record<SkillKind, number> = { active: 0, spell: 1, risk: 2, passive: 3, note: 4 };
  type Piece = { item?: (typeof groups)[number][number]; extra?: SheetExtra; link: boolean };
  const lay = (list: typeof groups, withExtras: boolean): Piece[][] => {
    const kind = (group: (typeof groups)[number]) => rank[group[0].skill.kind];
    const singles = list.filter((group) => group.length === 1).sort((a, b) => kind(a) - kind(b));
    const chains = list.filter((group) => group.length > 1).sort((a, b) => kind(a) - kind(b));
    const units: Piece[][] = [
      ...singles.map((group) => [{ item: group[0], link: false }]),
      ...chains.map((group) => group.map((item, at) => ({ item, link: at > 0 }))),
      ...(withExtras ? extras.map((extra) => [{ extra, link: false }]) : []),
    ];
    const flat = units.flat();
    if (flat.length === 0) return [];
    const least = Math.ceil(flat.length / MAX_ROW);
    // 0) colour sections (chủ game 03/11): two or more icons of one colour start a row of their own, a lone icon (a note,
    // an extra) takes the next free slot of the row before it. Used only when it costs no extra row.
    const sections: Piece[][] = [];
    for (const unit of units) {
      const prev = sections[sections.length - 1];
      const same = prev && !unit[0].link && !prev[0].link && !!prev[0].item && !!unit[0].item && prev[0].item.skill.kind === unit[0].item.skill.kind;
      if (same) prev.push(...unit);
      else sections.push([...unit]);
    }
    const tidy: Piece[][] = [];
    let tidyOk = true;
    for (const section of sections) {
      if (section.length > MAX_ROW) {
        tidyOk = false;
        break;
      }
      const last = tidy[tidy.length - 1];
      if (section.length === 1 && last && last.length < MAX_ROW) last.push(...section);
      else tidy.push([...section]);
    }
    if (tidyOk && tidy.length <= least) return tidy;
    // 1) whole units while they fit in a row.
    const whole: Piece[][] = [];
    let ok = true;
    for (const unit of units) {
      if (unit.length > MAX_ROW) {
        ok = false;
        break;
      }
      const last = whole[whole.length - 1];
      if (last && last.length + unit.length <= MAX_ROW) last.push(...unit);
      else whole.push([...unit]);
    }
    if (ok && whole.length <= least) return whole;
    // 2) fill evenly, breaking chains at a row's edge.
    const size = Math.ceil(flat.length / least);
    const rows: Piece[][] = [];
    for (let at = 0; at < flat.length; at += size) rows.push(flat.slice(at, at + size));
    return rows;
  };
  const row = (list: typeof groups, withExtras: boolean) => {
    const lines = lay(list, withExtras);
    return lines.map((line, lineAt) => {
      // Pieces joined to the one before them share one chain span, so the bar sits between the icons.
      const out: ReactNode[] = [];
      for (let at = 0; at < line.length; at += 1) {
        const piece = line[at];
        if (piece.extra) {
          out.push(extraIcon(piece.extra));
          continue;
        }
        if (!piece.item) continue;
        let end = at;
        while (line[end + 1]?.link && line[end + 1]?.item) end += 1;
        const carry = (node: ReactNode) => node;
        if (end === at) {
          out.push(carry(icon(piece.item)));
          continue;
        }
        const run = line.slice(at, end + 1);
        out.push(
          carry(
            <span key={`chain-${piece.item.index}`} className="sk3d-chain">
              {run.map((part, k) => (
                <Fragment key={part.item!.index}>
                  {k > 0 ? <span className="sk3d-link" style={{ "--from": RIM_TONE[run[k - 1].item!.skill.kind], "--to": RIM_TONE[part.item!.skill.kind] } as CSSProperties} aria-hidden="true" /> : null}
                  {icon(part.item!)}
                </Fragment>
              ))}
            </span>,
          ),
        );
        at = end;
      }
      // A chain that wraps: the row sits under the one above so its last icon is in the same column as the icon above's last,
      // joined by one short bar across the gap (chủ game 03/11).
      const first = line[0];
      const wraps = lineAt > 0 && !!first?.link && !!first?.item;
      const prevLen = lineAt > 0 ? lines[lineAt - 1].length : 0;
      const shift = wraps ? Math.max(prevLen - line.length, 0) : 0;
      // A shorter row is centred over the longest one, so two icons sit staggered between the three below (chủ game 03/11).
      const widest = Math.max(...lines.map((l) => l.length));
      const stagger = !wraps && lines.length > 1 ? (widest - line.length) / 2 : 0;
      return (
        <div key={lineAt} className="msheet-row" style={shift || stagger ? { marginLeft: `${(shift || stagger) * 4.3}rem` } : undefined}>
          {wraps ? <i className="sk3d-drop" style={{ "--from": RIM_TONE[first.item!.skill.kind], left: `${(prevLen - 1 - shift) * 4.3 + 1.95 - 0.31}rem` } as CSSProperties} aria-hidden="true" /> : null}
          {out}
        </div>
      );
    });
  };
  return (
    <div className="msheet-back" onClick={(event) => event.target === event.currentTarget && (onBack ?? (stay ? undefined : onClose))?.()} {...(onSwipe ? swipe : {})}>
      <GlyphDefs />
      <div key={slide ? name : undefined} className={`msheet${slide ? ` is-slide-${slide > 0 ? "l" : "r"}` : ""}`} role="dialog" aria-label={name}>
        {onBack ? (
          <button type="button" className="msheet-up" aria-label={tr("Trở về")} onClick={onBack}>
            {"<<"}
          </button>
        ) : null}
        {stay ? null : (
          <button type="button" className="msheet-x" aria-label="Đóng" onClick={onClose}>
            ✕
          </button>
        )}
        {skills.length || extras.length ? (
          <div className="msheet-skills">
            {row(groups, true)}
          </div>
        ) : null}
        <div className="msheet-mid">
          <div
            className={`msheet-card${onArt ? " is-fan" : ""}`}
            role={onArt ? "button" : undefined}
            tabIndex={onArt ? 0 : undefined}
            aria-label={onArt ? tr("Lá liên quan") : undefined}
            onClick={onArt}
          >
            {card}
            {badge}
            {count ? <span className="msheet-count">{count}</span> : null}
          </div>
          <div className="msheet-side">
            <div className="msheet-head">
              <h2 className="msheet-name">{tr(name)}</h2>
              {tag?.gems ? (
                <span className="msheet-tag tag-gems">
                  <img className="tag-gem" src="/ui/gem.webp" alt="" draggable={false} />
                  <b>{tag.gems}</b>
                </span>
              ) : null}
              {tag?.stars ? (
                <span className={`msheet-tag tag-stars is-s${Math.min(5, Math.max(1, tag.stars))}`}>
                  <i className="tag-star" />
                  <b>{tag.stars}</b>
                </span>
              ) : null}
            </div>
            {aside}
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
              <b className={`msheet-desc-title is-${shown.kind}${shown.slow ? " is-slow" : ""}`}>
                {tr(shown.name)}
                {cost ? (
                  <span className="act3d-cost">
                    <i className="mana-gem" />
                    <b>{cost}</b>
                  </span>
                ) : null}
                {(() => {
                  const kws = titleKeywords(shown.keyword, shown.text);
                  if (!kws.length) return null;
                  return (
                    <span className="msheet-kwtags">
                      {"("}
                      {kws.map((id, i) => (
                        <Fragment key={id}>
                          {i > 0 ? ", " : null}
                          <span className="kw-name" data-kw={id}>{KEYWORDS[id].label}</span>
                        </Fragment>
                      ))}
                      {")"}
                    </span>
                  );
                })()}
              </b>
              {shown.text ? (
                <p className="ink-skill">
                  <CopyText text={shown.text} firstTitle={false} inked icons={["debuff", "sao-choi"]} />
                </p>
              ) : null}
              {note && picked === "s0" ? <p className="msheet-note">{tr(note)}</p> : null}
            </>
          ) : extra ? (
            <>
              <b className="msheet-desc-title is-extra" style={{ "--ring": extra.ring } as CSSProperties}>
                {tr(extra.name)}
                {extra.speed ? <img className="msheet-speed" src={extra.speed} alt="" draggable={false} /> : extra.cost ? (
                  <span className="act3d-cost">
                    <i className="mana-gem" />
                    <b>{extra.cost}</b>
                  </span>
                ) : null}
              </b>
              {extra.body}
            </>
          ) : (
            <p className="msheet-empty">{tr("Không có kỹ năng.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
