import type { ReactNode } from "react";
import { CardFace, cardText } from "@/components/game/card-face";
import { CopyText } from "@/components/game/copy-text";
import { Glyph, MonsterSheet, type SheetAction, type SheetExtra } from "@/components/game/monster-sheet";
import { ReactGlyph } from "@/components/game/react-glyph";
import { artSrc, monsterCard, spellCard } from "@/lib/catalog";
import { tr } from "@/lib/i18n";
import { loadField, type FieldKey } from "@/lib/layouts";
import { infoBlocks } from "@/lib/power-balance";
import { skillsOf } from "@/lib/skill-book";
import { spellKind } from "@/lib/spell-kinds";

/** The power balance notes of a card (Tăng, Giảm, Thay đổi lối chơi), newest first, as the deck page showed them. */
export function BalanceLines({ id }: { id: string }) {
  const blocks = infoBlocks(id);
  return (
    <div className="power-lines">
      {blocks.map((block, index) => (
        <div key={`${block.at}-${block.when}`} className={index ? "power-block is-next" : "power-block"}>
          <p className="power-head">
            <span className="power-when">- {tr(block.when)},</span> <b className={`power-tone is-${block.tone}`}>{tr(block.toneText)}</b>:
          </p>
          {block.lines.map((line, lineIndex) => (
            <p key={lineIndex}>
              {line.map((bit, bitIndex) =>
                bit.mark ? (
                  <span key={bitIndex} className={`power-bit is-${bit.mark}`}>
                    {tr(bit.text)}
                  </span>
                ) : (
                  <span key={bitIndex}>{tr(bit.text)}</span>
                ),
              )}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

/** A spell's kind as its sheet icon, in the reaction bar's colour; tapping it shows the spell's text (and a note). */
export function spellKindExtra(id: string, gems?: number | string, note?: string): SheetExtra {
  const kind = spellKind(id);
  const spell = spellCard(id);
  const emblem = kind.react ? (
    <span className="sk3d-react">
      <ReactGlyph kind={kind.react} />
    </span>
  ) : (
    <Glyph name={kind.glyph ?? "info"} />
  );
  return {
    key: `kind-${kind.key}`,
    name: kind.label,
    emblem,
    rim: `sp-${kind.key}`,
    ring: kind.tone,
    deep: "#14101c",
    cost: gems ?? spell?.gems ?? 0,
    body: (
      <>
        <p className="ink-spell">
          <CopyText text={spell?.effect ?? ""} />
        </p>
        {note ? <p className="msheet-note">{tr(note)}</p> : null}
      </>
    ),
  };
}

/** A catalog monster as it looks on the field (art, frame and figures), for its sheet outside a match. */
export function FieldFace({ id }: { id: string }) {
  const card = monsterCard(id);
  if (!card) return null;
  const layout = loadField();
  const spot = (key: FieldKey, value: number) =>
    value === 0 ? null : (
      <span
        className="fstat"
        style={{
          left: `${layout[key].x}%`,
          top: `${layout[key].y}%`,
          fontSize: cardText(layout[key].size, "cqmin"),
          width: `${layout[key].width}%`,
          height: `${layout[key].height}%`,
        }}
      >
        {value}
      </span>
    );
  const art = artSrc(id, 1);
  return (
    <span className="sheet-unit">
      <span className="field-unit">
        {art ? <img className="art" src={art} alt="" draggable={false} /> : null}
        <img className="frame" src="/field-frame.png" alt="" draggable={false} />
        {spot("def", card.def)}
        {spot("mdef", card.mdef)}
        {spot("atk", card.atk)}
        {spot("hp", card.hp)}
      </span>
    </span>
  );
}

/** The monster sheet of a catalog card (deck builder): its skills, then the extra icons. */
export function CardMonsterSheet({
  id,
  extras = [],
  actions = [],
  aside,
  note,
  onClose,
}: {
  id: string;
  extras?: SheetExtra[];
  actions?: SheetAction[];
  aside?: ReactNode;
  note?: string;
  onClose: () => void;
}) {
  const card = monsterCard(id);
  if (!card) return null;
  return (
    <MonsterSheet name={card.name} card={<FieldFace id={id} />} count="" skills={skillsOf(id, card.skill ?? "")} extras={extras} actions={actions} aside={aside} note={note} onClose={onClose} />
  );
}

/**
 * The spell sheet, laid out like the monster sheet (owner, 18/10): the spell's kind icon on top (then any extra
 * icon), the spell card with its name and actions, and the text of the tapped icon below.
 */
export function SpellSheet({
  id,
  gems,
  extras = [],
  actions = [],
  aside,
  note,
  onClose,
}: {
  id: string;
  gems?: number | string;
  extras?: SheetExtra[];
  actions?: SheetAction[];
  aside?: ReactNode;
  note?: string;
  onClose: () => void;
}) {
  const spell = spellCard(id);
  if (!spell) return null;
  return (
    <MonsterSheet
      name={spell.name}
      card={<CardFace spellId={id} gems={gems} />}
      count=""
      skills={[]}
      extras={[spellKindExtra(id, gems, note), ...extras]}
      actions={actions}
      aside={aside}
      onClose={onClose}
    />
  );
}
