import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Glyph } from "@/components/game/monster-sheet";
import { ReactGlyph } from "@/components/game/react-glyph";
import { artSrc, monsterCard, spellCard, spellSrc } from "@/lib/catalog";
import { tr } from "@/lib/i18n";
import { spellKind } from "@/lib/spell-kinds";

/**
 * One row of the deck list: the stars (monster) or mana (spell, blank at 0) on the left, the name over a strip
 * of the card's art, and on the right the summoning mana crystal (monster, hidden at 0) or the spell's kind icon.
 */
export function DeckRow({ id, kind, lifted = false, onPress, onTap }: { id: string; kind: "monster" | "spell"; lifted?: boolean; onPress?: (event: ReactPointerEvent) => void; onTap: () => void }) {
  const monster = kind === "monster" ? monsterCard(id) : undefined;
  const spell = kind === "spell" ? spellCard(id) : undefined;
  if (!monster && !spell) return null;
  const art = monster ? artSrc(id, 1) : spellSrc(id);
  const sort = spell ? spellKind(id) : null;
  return (
    <div
      role="button"
      tabIndex={0}
      className={`dk-row is-${kind}${lifted ? " is-lifted" : ""}`}
      onPointerDown={onPress}
      onClick={onTap}
      onContextMenu={(event) => event.preventDefault()}
    >
      {art ? <span className="dk-row-art" style={{ backgroundImage: `url(${art})` }} /> : null}
      <span className={`dk-row-badge is-${kind}${monster ? ` is-s${Math.min(5, Math.max(1, monster.stars))}` : ""}`}>
        {monster ? (
          <>
            <i className="dk-row-star" aria-hidden="true">
              ★
            </i>
            <b>{monster.stars}</b>
          </>
        ) : spell && spell.gems > 0 ? (
          <b>{spell.gems}</b>
        ) : null}
      </span>
      <span className="dk-row-name">{tr(monster?.name ?? spell?.name ?? "")}</span>
      <span className="dk-row-end">
        {monster ? (
          monster.gems > 0 ? (
            <span className="dk-row-cost">
              <i className="mana-gem" />
              <b>{monster.gems}</b>
            </span>
          ) : null
        ) : sort ? (
          <span className="dk-row-kind" style={{ "--tone": sort.tone } as CSSProperties} title={tr(sort.label)}>
            {sort.react === "rebound" ? (
              <span className="dk-row-kind-pic">
                <ReactGlyph kind="rebound" />
              </span>
            ) : sort.react ? (
              <ReactGlyph kind={sort.react} />
            ) : (
              <Glyph name={sort.glyph ?? "info"} fill={sort.tone} />
            )}
          </span>
        ) : null}
      </span>
    </div>
  );
}
