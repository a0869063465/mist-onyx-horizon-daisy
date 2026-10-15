import { Fragment, useState } from "react";
import { CardFace } from "@/components/game/card-face";
import {
  CARD_FX_CHOICES,
  cardFxMonsters,
  cardFxSpells,
  exportCardFx,
  setMonsterFx,
  setSpellFx,
  shownChoice,
  skillsOf,
  SPELL_FX_CHOICES,
  spellChoice,
  tideNote,
  type CardFx,
  type SpellFx,
  loadCardFx,
} from "@/lib/card-fx";
import { tr } from "@/lib/i18n";

export function CardFxPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"monster" | "spell">("monster");
  const [open, setOpen] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [store, setStore] = useState(loadCardFx);
  const [note, setNote] = useState("");
  const [dump, setDump] = useState("");
  const monsters = cardFxMonsters();
  const spells = cardFxSpells();

  function refresh() {
    setStore(loadCardFx());
  }

  function pickMonster(cardId: string, skillKey: string, fx: CardFx) {
    setMonsterFx(cardId, skillKey, fx);
    refresh();
  }

  function pickSpell(cardId: string, fx: SpellFx) {
    setSpellFx(cardId, fx);
    refresh();
  }

  async function copyOut() {
    const text = exportCardFx();
    if (!text) {
      setDump("");
      setNote("Không có thay đổi để xuất.");
      return;
    }
    setDump(text);
    try {
      await navigator.clipboard.writeText(text);
      setNote("Đã xuất và chép các thay đổi.");
    } catch {
      setNote("Đã xuất. Giữ phần chữ bên dưới rồi sao chép.");
    }
  }

  return (
    <main className="builder card-fx">
      <header className="deck-head">
        <button type="button" className="chip" onClick={onBack}>
          Quay lại
        </button>
        <strong>{tr("Hiệu ứng lá bài")}</strong>
      </header>
      <p className="tuner-note card-fx-lead">Có hiệu lực khi vào lại trận.</p>
      <div className="deck-tabs">
        <button
          type="button"
          className={`chip${tab === "monster" ? " on" : ""}`}
          onClick={() => {
            setTab("monster");
            setOpen(null);
            setSkill(null);
          }}
        >
          {tr("Quái")}
        </button>
        <button
          type="button"
          className={`chip${tab === "spell" ? " on" : ""}`}
          onClick={() => {
            setTab("spell");
            setOpen(null);
            setSkill(null);
          }}
        >
          {tr("Phép")}
        </button>
      </div>
      <div className="deck-grid">
        {tab === "monster"
          ? monsters.map((card) => {
              const skills = skillsOf(card.id);
              const opened = open === card.id;
              return (
                <Fragment key={card.id}>
                  <button
                    type="button"
                    className="pick press"
                    onClick={() => {
                      setOpen(opened ? null : card.id);
                      setSkill(null);
                    }}
                  >
                    <CardFace monster={card} selected={opened} />
                  </button>
                  {opened ? (
                    <div className="card-fx-panel">
                      <div className="card-fx-skills">
                        {skills.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            className={`chip${skill === item.key ? " on" : ""}`}
                            onClick={() => setSkill(skill === item.key ? null : item.key)}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                      {skill ? (
                        <FxPicks
                          current={shownChoice(card.id, skills.find((item) => item.key === skill) ?? skills[0], store)}
                          note={tideNote(card.id, skills.find((item) => item.key === skill) ?? skills[0], store)}
                          onPick={(fx) => pickMonster(card.id, skill, fx)}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </Fragment>
              );
            })
          : spells.map((card) => {
              const opened = open === card.id;
              return (
                <Fragment key={card.id}>
                  <button
                    type="button"
                    className="pick press"
                    onClick={() => {
                      setOpen(opened ? null : card.id);
                      setSkill(null);
                    }}
                  >
                    <CardFace spellId={card.id} selected={opened} />
                  </button>
                  {opened ? (
                    <div className="card-fx-panel">
                      <FxPicks choices={SPELL_FX_CHOICES} current={spellChoice(card.id, store)} onPick={(fx) => pickSpell(card.id, fx)} />
                    </div>
                  ) : null}
                </Fragment>
              );
            })}
      </div>
      <div className="card-fx-foot">
        <button type="button" className="tuner-save is-red" onClick={() => void copyOut()}>
          Xuất thay đổi
        </button>
        {note ? <p className="tuner-note">{note}</p> : null}
        {dump ? <textarea className="tune-input is-area" readOnly value={dump} onFocus={(event) => event.currentTarget.select()} /> : null}
      </div>
    </main>
  );
}

function FxPicks<T extends string>({
  choices,
  current,
  note,
  onPick,
}: {
  choices?: { id: T; label: string }[];
  current: T | null;
  note?: string;
  onPick: (fx: T) => void;
}) {
  const items = choices ?? (CARD_FX_CHOICES as { id: T; label: string }[]);
  return (
    <div className="card-fx-picks">
      {note ? <p className="tuner-note">{note}</p> : null}
      {items.map((item) => (
        <button key={item.id} type="button" className={`chip${current === item.id ? " on" : ""}`} onClick={() => onPick(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
