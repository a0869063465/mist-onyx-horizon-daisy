import { useId } from "react";
import { SKILL_ICONS } from "@/lib/skill-icons";

/** Face and gem colours of the round 3D buttons (Rút quái, Rút phép, Hết lượt, OK) and of the attack orb. */
export type MedalTone = "orange" | "purple" | "red" | "blue" | "gold";

const TONES: Record<MedalTone, { hi: string; mid: string; lo: string; gemHi: string; gem: string; gemLo: string }> = {
  orange: { hi: "#ffd9a0", mid: "#ff8a12", lo: "#7a3200", gemHi: "#fff0cf", gem: "#ffa233", gemLo: "#9a4400" },
  purple: { hi: "#efd6ff", mid: "#9c4ff2", lo: "#341066", gemHi: "#f6e6ff", gem: "#bf7dff", gemLo: "#4e1a8a" },
  red: { hi: "#ffc0b6", mid: "#e8352c", lo: "#5e0907", gemHi: "#ffe0da", gem: "#ff5a4a", gemLo: "#86110b" },
  blue: { hi: "#bfe6ff", mid: "#1f84e8", lo: "#0a2c66", gemHi: "#e3f6ff", gem: "#42b8ff", gemLo: "#0b4b94" },
  gold: { hi: "#fff0b8", mid: "#f2b526", lo: "#7c4c00", gemHi: "#fff7d6", gem: "#ffc93d", gemLo: "#8f5a00" },
};

/** Glyphs drawn for the medals in the same 512 space as the game-icons set. */
const MEDAL_ICONS: Record<string, string> = {
  // A thick up arrow: chuyển quyền sang bên kia (vòng chưa hết).
  "up-arrow": '<path fill="currentColor" d="M256 70l150 160h-92v212H198V230h-92z"/>',
  // A thick X: huỷ hành động đang chờ.
  "cross-mark": '<path fill="currentColor" d="M118 160l42-42 96 96 96-96 42 42-96 96 96 96-42 42-96-96-96 96-42-42 96-96z"/>',
  // A playing card with three claw slashes across it: Rút quái.
  "claw-card":
    '<path fill="currentColor" fill-rule="evenodd" d="M150 34h212a40 40 0 0 1 40 40v364a40 40 0 0 1-40 40H150a40 40 0 0 1-40-40V74a40 40 0 0 1 40-40zm16 58v328h180V92z"/>' +
    '<path fill="currentColor" d="M178 118c44 54 84 128 104 240l-34 8c-24-100-58-166-98-222z"/>' +
    '<path fill="currentColor" d="M236 104c42 60 74 134 88 246l-34 6c-16-98-44-168-84-226z"/>' +
    '<path fill="currentColor" d="M298 114c30 48 52 104 56 178l-32 4c-6-62-24-110-52-158z"/>',
};

function iconBody(icon: string): string {
  return MEDAL_ICONS[icon] ?? SKILL_ICONS[icon] ?? SKILL_ICONS["info"] ?? "";
}

/** A stone-rimmed round button face: four gems on the rim, a glossy coloured face and a raised cream glyph. */
export function Medal({ tone, icon, className }: { tone: MedalTone; icon: string; className?: string }) {
  const id = `md${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const t = TONES[tone];
  const body = iconBody(icon);
  const box = 48;
  const gems = [0, 90, 180, 270].map((angle) => {
    const x = 43.6 * Math.sin((angle * Math.PI) / 180);
    const y = -43.6 * Math.cos((angle * Math.PI) / 180);
    return { x, y };
  });
  const s = 7;
  const g = 5;
  return (
    <svg className={className ? `medal ${className}` : "medal"} viewBox="-50 -50 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-stone`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#f6f3ec" />
          <stop offset="0.42" stopColor="#bdb8ae" />
          <stop offset="1" stopColor="#5a564f" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${id}-pit`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c9c6c0" />
          <stop offset="1" stopColor="#6c6862" />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.36" cy="0.28" r="0.85">
          <stop offset="0" stopColor={t.hi} />
          <stop offset="0.42" stopColor={t.mid} />
          <stop offset="1" stopColor={t.lo} />
        </radialGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-cream`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf7" />
          <stop offset="0.55" stopColor="#f1e2c0" />
          <stop offset="1" stopColor="#c9ad80" />
        </linearGradient>
        <pattern id={`${id}-weave`} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0H3.2M0 0V3.2" stroke="#fff" strokeWidth="0.35" strokeOpacity="0.16" />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <circle r="37" />
        </clipPath>
      </defs>
      <circle r="49" fill={`url(#${id}-stone)`} stroke="#26231f" strokeWidth="1.3" />
      <circle r="47.3" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.8" />
      <circle r="39.4" fill="#1d1a17" />
      <circle r="39.4" fill="none" stroke={`url(#${id}-pit)`} strokeWidth="1.4" />
      <circle r="37" fill={`url(#${id}-face)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="-40" y="-40" width="80" height="80" fill={`url(#${id}-weave)`} />
      </g>
      <circle r="35.8" fill="none" stroke="#000" strokeOpacity="0.32" strokeWidth="2.6" />
      <ellipse cx="-5" cy="-18" rx="25" ry="12.5" fill={`url(#${id}-gloss)`} />
      <g transform={`translate(${-box / 2} ${-box / 2 + 1}) scale(${box / 512})`}>
        <g transform="translate(0 30)" opacity="0.55" dangerouslySetInnerHTML={{ __html: body.replaceAll('fill="currentColor"', 'fill="#120a02"') }} />
        <g dangerouslySetInnerHTML={{ __html: body.replaceAll('fill="currentColor"', 'fill="#5c4628" stroke="#5c4628" stroke-width="26" stroke-linejoin="round"') }} />
        <g dangerouslySetInnerHTML={{ __html: body.replaceAll('fill="currentColor"', `fill="url(#${id}-cream)"`) }} />
      </g>
      {gems.map(({ x, y }, index) => (
        <g key={index} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
          <path d={`M0 ${-s}L${s} 0L0 ${s}L${-s} 0Z`} fill={`url(#${id}-metal)`} stroke="#2c2925" strokeWidth="0.7" />
          <path d={`M0 ${-g}L${-g} 0L0 0Z`} fill={t.gemHi} />
          <path d={`M0 ${-g}L${g} 0L0 0Z`} fill={t.gem} />
          <path d={`M${-g} 0L0 ${g}L0 0Z`} fill={t.gem} />
          <path d={`M${g} 0L0 ${g}L0 0Z`} fill={t.gemLo} />
          <path d={`M0 ${-g * 0.45}L${g * 0.45} 0L0 ${g * 0.45}L${-g * 0.45} 0Z`} fill={t.gemHi} opacity="0.55" />
          <circle cx="-1.5" cy="-2" r="0.95" fill="#fff" />
        </g>
      ))}
    </svg>
  );
}
