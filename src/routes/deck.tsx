import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { CardFace } from "@/components/game/card-face";
import { CopyText } from "@/components/game/copy-text";
import { DEFAULT_DECK, DECK_NOTES, FORMS, MONSTERS, SPELLS, monsterCard, spellCard, type MonsterCard, type SpellCard } from "@/lib/catalog";
import { deckBalance, deckIssues, loadDeck, saveDeck, type BeastDeck, type DeckSide } from "@/lib/deck";
import { cardsOf, freshDeck, loadBook, openBookFile, saveBook, saveBookFile, type DeckEntry } from "@/lib/deck-book";
import { tr, useLang } from "@/lib/i18n";
import { footRows, infoBlocks, markFace } from "@/lib/power-balance";
import { deckTactics, loadStrategies } from "@/lib/strategies";

export const Route = createFileRoute("/deck")({ component: DeckPage });

type Tab = "monster" | "spell" | "using";

function DeckPage() {
  const [deck, setDeck] = useState<BeastDeck>(DEFAULT_DECK);
  const [book, setBook] = useState<DeckEntry[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState<Tab>("monster");
  const [info, setInfo] = useState<string | null>(null);
  const [saveGone, setSaveGone] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const plansScroll = useRef(0);
  useLang();

  useEffect(() => {
    const stored = loadBook();
    const found = stored.decks.find((row) => row.n === stored.active) ?? stored.decks[0];
    setBook(stored.decks);
    setActive(found?.n ?? null);
    if (found) setDeck(cardsOf(found));
    else setDeck(loadDeck());
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted || active == null) return;
    setBook((current) => {
      const row = current.find((entry) => entry.n === active);
      if (!row) return current;
      if (sameIds(row.monsters, deck.monsters) && sameIds(row.spells, deck.spells)) return current;
      return current.map((entry) => (entry.n === active ? { ...entry, monsters: deck.monsters, spells: deck.spells } : entry));
    });
  }, [deck, active, booted]);

  useEffect(() => {
    if (!booted) return;
    saveBook({ decks: book, active });
  }, [book, active, booted]);

  const issue = deckIssues(deck);
  const balance = deckBalance(deck);

  function addMonster(id: string) {
    setDeck((current) => {
      if (current.monsters.includes(id) || current.monsters.length >= 17 || current.monsters.length + current.spells.length >= 24) return current;
      return { ...current, monsters: [...current.monsters, id] };
    });
  }

  function addSpell(id: string) {
    setDeck((current) => {
      if (current.spells.includes(id) || current.spells.length >= 11 || current.monsters.length + current.spells.length >= 24) return current;
      if (spellCard(id)?.env && current.spells.some((item) => spellCard(item)?.env)) return current;
      return { ...current, spells: [...current.spells, id] };
    });
  }

  function dropMonster(id: string) {
    setDeck((current) => ({ ...current, monsters: current.monsters.filter((item) => item !== id) }));
  }

  function dropSpell(id: string) {
    setDeck((current) => ({ ...current, spells: current.spells.filter((item) => item !== id) }));
  }

  function tapCard(id: string, kind: "monster" | "spell", fromDeck: boolean) {
    if (info) {
      setInfo(info === id ? null : id);
      return;
    }
    if (fromDeck) {
      if (kind === "monster") dropMonster(id);
      else dropSpell(id);
      return;
    }
    if (kind === "monster") {
      if (FORMS.some((card) => card.id === id)) return;
      addMonster(id);
    } else addSpell(id);
  }

  const pickedMonsters = deck.monsters
    .map((id) => monsterCard(id))
    .filter((card): card is MonsterCard => !!card)
    .sort(byStars);
  const pickedSpells = deck.spells
    .map((id) => spellCard(id))
    .filter((card): card is SpellCard => !!card)
    .sort(byMana);
  const lockedIds = new Set(FORMS.map((card) => card.id));
  const poolMonsters = [
    ...MONSTERS.filter((card) => !deck.monsters.includes(card.id)).map((card) => monsterCard(card.id) ?? card),
    ...FORMS.map((card) => monsterCard(card.id) ?? card),
  ].sort(byStars);
  const poolSpells = SPELLS.filter((card) => !deck.spells.includes(card.id))
    .map((card) => spellCard(card.id) ?? card)
    .sort(byMana);

  if (plansOpen) {
    return <DeckPlans ids={[...deck.monsters, ...deck.spells]} onBack={() => {
      setPlansOpen(false);
      window.requestAnimationFrame(() => window.scrollTo(0, plansScroll.current));
    }} />;
  }

  return (
    <main className="builder menu-page is-sub">
      <header className="deck-head">
        <Link to="/" className="chip">
          {tr("Về sân")}
        </Link>
        <div className="deck-count">
          <strong>{deck.monsters.length + deck.spells.length}/24</strong>
        </div>
        {saveGone ? (
          <span className="save is-gone" />
        ) : (
          <button
            type="button"
            className="save press"
            disabled={Boolean(issue)}
            onClick={() => {
              saveDeck(deck);
              setSaveGone(true);
              window.setTimeout(() => setSaveGone(false), 3000);
            }}
          >
            {tr("Lưu")}
          </button>
        )}
      </header>
      <div className="deck-tabs">
        <button type="button" className={`chip${tab === "monster" ? " on" : ""}`} onClick={() => { setTab("monster"); setInfo(null); }}>
          {tr("Quái thú")}
        </button>
        <button type="button" className={`chip${tab === "spell" ? " on" : ""}`} onClick={() => { setTab("spell"); setInfo(null); }}>
          {tr("Phép")}
        </button>
        <button type="button" className={`chip${tab === "using" ? " on" : ""}`} onClick={() => { setTab("using"); setInfo(null); }}>
          Deck
        </button>
      </div>
      <Need balance={balance} />
      <div className="deck-grid">
        {tab === "monster"
          ? poolMonsters.map((card) => (
              <Fragment key={card.id}>
                <CardPick
                  held={info === card.id}
                  locked={lockedIds.has(card.id)}
                  onHold={() => setInfo(card.id)}
                  onTap={() => tapCard(card.id, "monster", false)}
                >
                  <CardFace monster={card} selected={info === card.id} mark={markFace(card.id)} />
                </CardPick>
                {info === card.id ? <HeldInfo id={card.id} /> : null}
              </Fragment>
            ))
          : null}
        {tab === "spell"
          ? spellBands(poolSpells).map((band) => (
              <Fragment key={band.label || "rest"}>
                {band.label ? <h3 className="deck-band">{tr(band.label)}</h3> : null}
                {band.cards.map((card) => (
                  <Fragment key={card.id}>
                    <CardPick held={info === card.id} onHold={() => setInfo(card.id)} onTap={() => tapCard(card.id, "spell", false)}>
                      <CardFace spellId={card.id} selected={info === card.id} mark={markFace(card.id)} />
                    </CardPick>
                    {info === card.id ? <HeldInfo id={card.id} /> : null}
                  </Fragment>
                ))}
              </Fragment>
            ))
          : null}
        {tab === "using" ? (
          <>
            {pickedMonsters.map((card) => (
              <Fragment key={card.id}>
                <CardPick held={info === card.id} onHold={() => setInfo(card.id)} onTap={() => tapCard(card.id, "monster", true)}>
                  <CardFace monster={card} selected={info === card.id} mark={markFace(card.id)} />
                </CardPick>
                {info === card.id ? <HeldInfo id={card.id} /> : null}
              </Fragment>
            ))}
            {pickedSpells.map((card) => (
              <Fragment key={card.id}>
                <CardPick held={info === card.id} onHold={() => setInfo(card.id)} onTap={() => tapCard(card.id, "spell", true)}>
                  <CardFace spellId={card.id} selected={info === card.id} mark={markFace(card.id)} />
                </CardPick>
                {info === card.id ? <HeldInfo id={card.id} /> : null}
              </Fragment>
            ))}
          </>
        ) : null}
      </div>
      {tab === "monster" ? (
        <>
          <DeckStats lines={monsterStatLines()} />
          <PowerFoot kind="monster" />
        </>
      ) : null}
      {tab === "spell" ? (
        <>
          <DeckStats lines={spellStatLines()} />
          <PowerFoot kind="spell" />
        </>
      ) : null}
      {tab === "using" ? (
        <DeckFoot
          monsters={pickedMonsters}
          spells={pickedSpells}
          onPlans={() => {
            plansScroll.current = window.scrollY;
            setPlansOpen(true);
            window.scrollTo(0, 0);
          }}
        />
      ) : null}
      {tab === "using" ? (
        <DeckBar
          decks={book}
          active={active}
          onChoose={(n) => {
            const row = book.find((entry) => entry.n === n);
            if (!row) return;
            setActive(n);
            setDeck(cardsOf(row));
          }}
          onRename={(n, name) => setBook((current) => current.map((entry) => (entry.n === n ? { ...entry, name } : entry)))}
          onAdd={() => {
            const row = freshDeck(book);
            setBook((current) => [...current, row]);
            setActive(row.n);
            setDeck(cardsOf(row));
          }}
          onDelete={(n) => {
            const next = book.filter((entry) => entry.n !== n);
            const fallback = [...next].sort((a, b) => a.n - b.n).at(-1) ?? null;
            setBook(next);
            if (active === n) {
              setActive(fallback?.n ?? null);
              if (fallback) setDeck(cardsOf(fallback));
            }
          }}
          onSave={() => saveBookFile({ decks: book, active })}
          onLoad={async () => {
            const loaded = await openBookFile();
            if (!loaded || loaded === "bad") return loaded === "bad";
            const pick = loaded.decks[0] ?? null;
            setBook(loaded.decks);
            setActive(pick?.n ?? null);
            if (pick) setDeck(cardsOf(pick));
            return false;
          }}
        />
      ) : null}
    </main>
  );
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function byStars(a: MonsterCard, b: MonsterCard) {
  return a.stars - b.stars || a.name.localeCompare(b.name, "vi");
}

function byMana(a: SpellCard, b: SpellCard) {
  return a.gems - b.gems || a.name.localeCompare(b.name, "vi");
}

const SPELL_BANDS: { label: string; ids: string[] }[] = [
  { label: "Môi trường", ids: ["bien-sau", "thao-nguyen", "dat-da", "nui", "rung-ram", "bong-toi", "cu-dia-may-moc"] },
  { label: "Phản đòn", ids: ["co-may-thoi-gian", "giap-co-khi", "hoan-doi", "la-chan-phan-don", "phuc-kich", "guong-phong-ho"] },
  { label: "Giải trừ", ids: ["hap-thu-ma-phap", "mua-ma-thuat", "phan-nguyen", "vong-xoay-bao-ho"] },
  { label: "Đa năng", ids: ["ke-dao-mo", "mu-ma-phap", "thu-hoi-quai-thu"] },
  { label: "Khống chế", ids: ["soi-xich-dia-nguc", "thanh-guom-anh-sang", "vong-nguyen-rua-ac-ma", "ngan-chan-phong-ngu"] },
  { label: "Sát thương", ids: ["sung-loi-pha", "sam-set-tan-the", "virus-an-mon"] },
];

function spellBands(cards: SpellCard[]) {
  const bands = SPELL_BANDS.map((band) => ({
    label: band.label,
    cards: band.ids.map((id) => cards.find((card) => card.id === id)).filter((card): card is SpellCard => !!card),
  })).filter((band) => band.cards.length > 0);
  const listed = new Set(SPELL_BANDS.flatMap((band) => band.ids));
  const rest = cards.filter((card) => !listed.has(card.id)).sort(byMana);
  if (rest.length) bands.push({ label: "", cards: rest });
  return bands;
}

function countBands(cards: { id: string; env?: boolean }[]) {
  return SPELL_BANDS.map((band) => `${tr(band.label)}: ${cards.filter((card) => band.ids.includes(card.id) || (band.label === "Môi trường" && card.env)).length}`);
}

function monsterStatLines() {
  const outside = new Set(FORMS.map((card) => card.id));
  const counts = new Map<number, number>();
  let forms = 0;
  for (const card of [...MONSTERS, ...FORMS]) {
    const live = monsterCard(card.id) ?? card;
    if (outside.has(card.id)) {
      forms += 1;
      continue;
    }
    counts.set(live.stars, (counts.get(live.stars) ?? 0) + 1);
  }
  const lines = [...counts.keys()]
    .sort((a, b) => a - b)
    .map((stars) => `${stars} ${tr("sao")}: ${counts.get(stars)}`);
  lines.push(`${tr("Ngoài bộ")}: ${forms}`);
  return lines;
}

function spellStatLines() {
  return [...countBands(SPELLS.map((card) => spellCard(card.id) ?? card)), `${tr("Tổng")}: ${SPELLS.length}`];
}

function DeckBar({
  decks,
  active,
  onChoose,
  onRename,
  onAdd,
  onDelete,
  onSave,
  onLoad,
}: {
  decks: DeckEntry[];
  active: number | null;
  onChoose: (n: number) => void;
  onRename: (n: number, name: string) => void;
  onAdd: () => void;
  onDelete: (n: number) => void;
  onSave: () => Promise<"saved" | "cancel">;
  onLoad: () => Promise<boolean>;
}) {
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [saveAsk, setSaveAsk] = useState(false);
  const [saveGone, setSaveGone] = useState(false);
  const [badFile, setBadFile] = useState(false);
  const rows = [...decks].sort((a, b) => a.n - b.n);

  useEffect(() => {
    if (!open) return;
    function away(event: PointerEvent) {
      const node = event.target;
      if (node instanceof Node && bar.current?.contains(node)) return;
      setOpen(false);
      setEditing(null);
      setConfirm(null);
    }
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  return (
    <footer className="deck-bar" ref={bar}>
      <div className="deck-files">
        <button type="button" className={`deck-ico press${saveAsk ? " on" : ""}`} aria-label={tr("Lưu bộ sưu tập")} onClick={() => setSaveAsk((value) => !value)}>
          <FloppyIcon />
        </button>
        {saveAsk ? (
          <>
            <button
              type="button"
              className={`deck-ico press${saveGone ? " is-gone" : ""}`}
              aria-label={tr("Ghi vào file")}
              onClick={() => {
                setSaveGone(true);
                window.setTimeout(() => setSaveGone(false), 2000);
                void onSave();
              }}
            >
              <FloppyIcon />
            </button>
            <button
              type="button"
              className="deck-ico press"
              aria-label={tr("Mở bộ sưu tập")}
              onClick={() => {
                void onLoad().then((bad) => setBadFile(bad));
              }}
            >
              <FolderIcon />
            </button>
            {badFile ? <span className="deck-file-bad">{tr("Không đọc được file.")}</span> : null}
          </>
        ) : null}
      </div>
      <div className="deck-switch">
        {open ? (
          <button type="button" className="deck-plus press" onClick={onAdd} aria-label={tr("Thêm bộ bài")}>
            +
          </button>
        ) : null}
        <div className="deck-stack">
          {open ? (
            <div className="deck-book">
              {rows.map((row) => (
              <DeckRow
                key={row.n}
                row={row}
                on={row.n === active}
                editing={editing === row.n}
                confirm={confirm === row.n}
                editOpen={editing != null}
                onEdit={(n) => {
                  setConfirm(null);
                  setEditing(n);
                }}
                onChoose={(n) => {
                  setEditing(null);
                  setConfirm(null);
                  onChoose(n);
                }}
                onRename={onRename}
                onAskDelete={(n) => {
                  setEditing(null);
                  setConfirm(n);
                }}
                onDelete={(n) => {
                  setConfirm(null);
                  onDelete(n);
                }}
                onCancelDelete={() => setConfirm(null)}
                onStopEdit={() => setEditing(null)}
              />
            ))}
          </div>
        ) : null}
        <button type="button" className={`deck-ico press${open ? " on" : ""}`} aria-label={tr("Bộ bài")} onClick={() => setOpen((value) => !value)}>
          <StackIcon />
        </button>
        </div>
      </div>
    </footer>
  );
}

function DeckRow({
  row,
  on,
  editing,
  confirm,
  editOpen,
  onEdit,
  onChoose,
  onRename,
  onAskDelete,
  onDelete,
  onCancelDelete,
  onStopEdit,
}: {
  row: DeckEntry;
  on: boolean;
  editing: boolean;
  confirm: boolean;
  editOpen: boolean;
  onEdit: (n: number) => void;
  onChoose: (n: number) => void;
  onRename: (n: number, name: string) => void;
  onAskDelete: (n: number) => void;
  onDelete: (n: number) => void;
  onCancelDelete: () => void;
  onStopEdit: () => void;
}) {
  const held = useRef(false);
  const timer = useRef<number | null>(null);
  const jumped = useRef(false);

  function arm(go: () => void) {
    held.current = false;
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      held.current = true;
      go();
    }, 420);
  }

  function drop() {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  }

  return (
    <div className={`deck-row${on ? " on" : ""}`}>
      <button
        type="button"
        className="deck-num press"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={() => arm(() => onAskDelete(row.n))}
        onPointerUp={drop}
        onPointerCancel={drop}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          onChoose(row.n);
        }}
      >
        {row.n}
      </button>
      {editing ? (
        <input
          className="deck-name-edit"
          value={row.name}
          autoFocus
          onChange={(event) => onRename(row.n, event.target.value)}
          onBlur={() => {
            window.setTimeout(() => {
              if (document.activeElement?.closest(".deck-name-edit")) return;
              onStopEdit();
            }, 0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") onStopEdit();
          }}
        />
      ) : (
        <button
          type="button"
          className="deck-name press"
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={() => {
            if (editOpen) {
              jumped.current = true;
              onEdit(row.n);
              return;
            }
            arm(() => onEdit(row.n));
          }}
          onPointerUp={drop}
          onPointerCancel={drop}
          onClick={() => {
            if (jumped.current) {
              jumped.current = false;
              return;
            }
            if (held.current) {
              held.current = false;
              return;
            }
            onChoose(row.n);
          }}
        >
          {row.name || tr("Chưa đặt tên")}
        </button>
      )}
      {confirm ? (
        <span className="deck-ask">
          <b>{tr("Xoá bộ này?")}</b>
          <button type="button" onClick={() => onDelete(row.n)}>
            {tr("Xoá")}
          </button>
          <button type="button" onClick={onCancelDelete}>
            {tr("Không")}
          </button>
        </span>
      ) : null}
    </div>
  );
}

function FloppyIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 4h14l6 6v18H6V4z" />
      <path d="M18 4v7h7" />
      <rect x="10" y="17" width="12" height="9" />
      <rect x="11" y="6" width="6" height="4" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M3 11V8h8l2 3h16v4H3z" />
      <path d="M3 14h26l-3 13H6L3 14z" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="8" y="6" width="14" height="18" />
      <rect x="11" y="9" width="14" height="18" />
    </svg>
  );
}

function DeckStats({ lines }: { lines: string[] }) {
  return (
    <p className="deck-stats">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </p>
  );
}

function DeckFoot({ monsters, spells, onPlans }: { monsters: MonsterCard[]; spells: SpellCard[]; onPlans: () => void }) {
  const stars = [1, 2, 3, 4].map((n) => `${n} ${tr("sao")}: ${monsters.filter((card) => card.stars === n).length}`);
  const spellLines = countBands(spells);
  return (
    <div className="deck-stats">
      <div className="deck-stats-top">
        <div className="deck-stats-copy">
          <b>{tr("Quái thú")}</b>
          {stars.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <button type="button" className="deck-plans-open" onClick={onPlans}>
          {tr("Các chiến thuật đang có trong bộ bài")}
        </button>
      </div>
      <div className="deck-stats-copy">
        <b>{tr("Phép")}</b>
        {spellLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </div>
  );
}

function DeckPlans({ ids, onBack }: { ids: string[]; onBack: () => void }) {
  const groups = deckTactics(ids, loadStrategies());
  const gray = new Set(FORMS.map((card) => card.id));
  return (
    <main className="watch is-wide deck-plans menu-page">
      <button type="button" className="watch-back" onClick={onBack}>
        {tr("Trở về")}
      </button>
      <h1>{tr("Các chiến thuật đang có trong bộ bài")}</h1>
      {groups.length ? (
        groups.map((group) => (
          <section key={group.title} className="deck-plan-band">
            <h2 className={group.title === "Quái thú chủ lực" ? "is-main" : undefined}>{tr(group.title)}</h2>
            <div className="deck-plan-row">
              {group.plans.map((plan) => (
                <article key={plan.id} className={`plan${plan.cards.length === 1 ? " is-narrow" : ""}`}>
                  <h3 className="plan-title">{plan.name}</h3>
                  <div className="deck-grid plan-grid">
                    {plan.cards.map((id) => {
                      const monster = monsterCard(id);
                      return (
                        <div key={id} className={`plan-card${gray.has(id) ? " is-gray" : ""}`}>
                          {monster ? <CardFace monster={monster} /> : <CardFace spellId={id} />}
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="plan-empty">{tr("Bộ này chưa có chiến thuật nào.")}</p>
      )}
    </main>
  );
}

function Mark({ side }: { side: DeckSide }) {
  return <b className={side.bad ? "is-bad" : "is-ok"}>{`${side.sign}${side.n}`}</b>;
}

function Need({ balance }: { balance: { monster: DeckSide; spell: DeckSide } }) {
  return (
    <p className="deck-need">
      <span>{tr("Quái thú")}: <Mark side={balance.monster} /></span>
      <span>{tr("Phép")}: <Mark side={balance.spell} /></span>
    </p>
  );
}

function HeldInfo({ id }: { id: string }) {
  return (
    <>
      <BalanceInfo id={id} />
      <CardCopy id={id} />
    </>
  );
}

function BalanceInfo({ id }: { id: string }) {
  const blocks = infoBlocks(id);
  if (!blocks.length) return null;
  return (
    <aside className="power-card">
      <h2 className={`is-${blocks[0].tone}`}>{tr("Cân bằng sức mạnh")}</h2>
      {blocks.map((block, index) => (
        <div key={`${block.at}-${block.when}`} className={index ? "power-block is-next" : "power-block"}>
          <p className="power-head">
            <span className="power-when">- {tr(block.when)},</span> <b className={`power-tone is-${block.tone}`}>{tr(block.toneText)}</b>:
          </p>
          {block.lines.map((line, lineIndex) => (
            <p key={lineIndex}>
              {line.map((bit, bitIndex) =>
                bit.mark ? (
                  <span key={bitIndex} className={`power-bit is-${bit.mark}`}>{tr(bit.text)}</span>
                ) : (
                  <span key={bitIndex}>{tr(bit.text)}</span>
                ),
              )}
            </p>
          ))}
        </div>
      ))}
    </aside>
  );
}

function PowerFoot({ kind }: { kind: "monster" | "spell" }) {
  const rows = footRows(kind);
  if (!rows.length) return null;
  return (
    <section className="power-foot">
      <b>{tr("Cân bằng sức mạnh")}</b>
      {rows.map((row) => (
        <span key={row.id} className={`power-name is-${row.tone}`}>
          {kind === "monster" ? `${row.stars}★ ${tr(row.name)}` : tr(row.name)}
        </span>
      ))}
    </section>
  );
}

function CardCopy({ id }: { id: string }) {
  const monster = monsterCard(id);
  const spell = monster ? undefined : spellCard(id);
  if (!monster && !spell) return null;
  return (
    <aside className={`focus-copy is-inline${monster ? " is-skill" : " is-spell"}`}>
      <h2>{tr(monster?.name ?? spell?.name ?? "")}</h2>
      <p className={monster ? "ink-skill" : "ink-spell"}>
        <CopyText text={monster?.skill ?? spell?.effect ?? ""} />
      </p>
      {DECK_NOTES[id] ? <p className="deck-note">{tr(DECK_NOTES[id])}</p> : null}
    </aside>
  );
}

function CardPick({ held, locked = false, onHold, onTap, children }: { held: boolean; locked?: boolean; onHold: () => void; onTap: () => void; children: ReactNode }) {
  const timer = useRef<number | null>(null);
  const didHold = useRef(false);

  function clear() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }

  return (
    <button
      type="button"
      className={`pick press${held ? " is-held" : ""}${locked ? " is-locked" : ""}`}
      onPointerDown={() => {
        didHold.current = false;
        clear();
        timer.current = window.setTimeout(() => {
          didHold.current = true;
          onHold();
        }, 420);
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onClick={() => {
        if (didHold.current) {
          didHold.current = false;
          return;
        }
        if (locked && !held) return;
        onTap();
      }}
    >
      {children}
    </button>
  );
}
