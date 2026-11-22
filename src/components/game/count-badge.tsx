import type { CSSProperties } from "react";
import { SkillGlyph } from "@/components/game/monster-sheet";

/** Màu số đếm trên quái, lấy đúng màu bảng thông báo (chủ game 22/11). */
export type CountTone = "white" | "pink" | "red" | "green" | "phys" | "ward" | "tru";

export type CountPart = { text: string; tone: CountTone };

/** Ô số đếm của quái (trước là số cam): icon gốc của skill dạng ô vuông, số màu nằm sát bên phải. */
export function CountBadge({ icon, parts, style, sheet = false, debt = false }: { icon?: string; parts: CountPart[]; style?: CSSProperties; sheet?: boolean; debt?: boolean }) {
  return (
    <span className={`cntb${sheet ? " is-sheet" : ""}${icon ? "" : " is-plain"}${debt ? " is-debt" : ""}`} style={style}>
      {icon ? (
        <i className="cntb-ico">
          <SkillGlyph name={icon} />
        </i>
      ) : null}
      <span className="cntb-n">
        {parts.map((part, index) => (
          <b key={index} className={`is-${part.tone}`}>{part.text}</b>
        ))}
      </span>
    </span>
  );
}
