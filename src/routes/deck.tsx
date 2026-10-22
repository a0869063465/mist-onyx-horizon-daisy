import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { DeckRow } from "@/components/deck-row";
import { CardFace } from "@/components/game/card-face";
import { BalanceLines, CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { Glyph, GlyphDefs, Rim } from "@/components/game/monster-sheet";
import { artSrc, DEFAULT_DECK, DECK_NOTES, FORMS, MONSTERS, SPELLS, monsterCard, spellCard, spellSrc, type MonsterCard, type SpellCard } from "@/lib/catalog";
import { canReachForm, canUseCard, fakeIds } from "@/lib/owned-cards";
import { byMana, byStars, deckBalance, deckIssues, loadDeck, saveDeck, type BeastDeck, type DeckSide } from "@/lib/deck";
import { cardsOf, coverChoices, coverOf, freshDeck, loadBook, saveBook, type DeckEntry } from "@/lib/deck-book";
import { ENV_FILTERS, filterOn, MONSTER_TYPES, NO_FILTER, passesFilter, plainName, STAR_FILTERS, type PoolFilter } from "@/lib/deck-filters";
import { tr, useLang } from "@/lib/i18n";
import { infoBlocks, markFace } from "@/lib/power-balance";
import { spellKindRank } from "@/lib/spell-kinds";
import { deckTactics, loadStrategies } from "@/lib/strategies";

export const Route = createFileRoute("/deck")({ component: DeckPage });

type Kind = "monster" | "spell";
type Pick = { id: string; kind: Kind };
/** A finger (or mouse) on a card: it becomes a drag after a short hold, or at once when it moves sideways. */
type Grab = Pick & { from: "pool" | "list"; canDrag: boolean; pointer: number; x0: number; y0: number; armed: boolean; moved: boolean; timer: number | null };
type Ghost = Pick & { from: "pool" | "list"; x: number; y: number; over: string | null };

/** Hold this long to pick a card up; a quick swipe still scrolls. */
const HOLD_MS = 300;
const NUDGE = 8;
const DECK_SIZE = 24;

/**
 * Chỉnh sửa bộ bài (owner's layout, 18/10, after the LoR deck builder), opened from a deck on the Chọn bộ bài
 * screen (the book's active deck), and back there with <<: the card pool on top, three to a row;
 * the deck list bottom left; search, monster / spell / save and the deck name, tactics and filter bottom right.
 * Drag a card from the pool down onto the list to add it, a row of the list up onto the pool to take it out;
 * tap a card or a row to read it.
 */
function DeckPage() {
  const [deck, setDeck] = useState<BeastDeck>(DEFAULT_DECK);
  const [book, setBook] = useState<DeckEntry[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [booted, setBooted] = useState(false);
  const [mode, setMode] = useState<Kind>("monster");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PoolFilter>(NO_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sheet, setSheet] = useState<Pick | null>(null);
  const [saved, setSaved] = useState(false);
  const [naming, setNaming] = useState<string | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [covering, setCovering] = useState(false);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const grab = useRef<Grab | null>(null);
  // A press that turned into a drag or a swipe is not a tap: its click (if the browser sends one) is ignored.
  const skipTap = useRef(false);
  const savedTimer = useRef(0);
  const plans = useMemo(() => loadStrategies(), []);
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
      return current.map((entry) => (entry.n === active ? { ...entry, monsters: deck.monsters, spells: deck.spells, at: Date.now() } : entry));
    });
  }, [deck, active, booted]);

  useEffect(() => {
    if (!booted) return;
    saveBook({ decks: book, active });
  }, [book, active, booted]);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  function addCard(pick: Pick) {
    if (!canUseCard(pick.id)) return;
    setDeck((current) => {
      const total = current.monsters.length + current.spells.length;
      if (total >= DECK_SIZE) return current;
      if (pick.kind === "monster") {
        if (current.monsters.includes(pick.id) || current.monsters.length >= 17 || FORMS.some((card) => card.id === pick.id)) return current;
        return { ...current, monsters: [...current.monsters, pick.id] };
      }
      if (current.spells.includes(pick.id) || current.spells.length >= 11) return current;
      if (spellCard(pick.id)?.env && current.spells.some((item) => spellCard(item)?.env)) return current;
      return { ...current, spells: [...current.spells, pick.id] };
    });
  }

  function dropCard(pick: Pick) {
    setDeck((current) =>
      pick.kind === "monster"
        ? { ...current, monsters: current.monsters.filter((item) => item !== pick.id) }
        : { ...current, spells: current.spells.filter((item) => item !== pick.id) },
    );
  }

  // Dragging: the page listens to every move so a card can travel from the pool to the list and back.
  useEffect(() => {
    const overAt = (x: number, y: number) => {
      const node = document.elementFromPoint(x, y);
      return node instanceof Element ? (node.closest("[data-drop]")?.getAttribute("data-drop") ?? null) : null;
    };
    const stopTimer = (held: Grab) => {
      if (held.timer !== null) window.clearTimeout(held.timer);
      held.timer = null;
    };
    const move = (event: PointerEvent) => {
      const held = grab.current;
      if (!held || event.pointerId !== held.pointer) return;
      if (!held.armed) {
        const dx = event.clientX - held.x0;
        const dy = event.clientY - held.y0;
        if (Math.abs(dx) < NUDGE && Math.abs(dy) < NUDGE) return;
        held.moved = true;
        stopTimer(held);
        if (held.canDrag && Math.abs(dx) > Math.abs(dy)) {
          held.armed = true;
          setGhost({ id: held.id, kind: held.kind, from: held.from, x: event.clientX, y: event.clientY, over: overAt(event.clientX, event.clientY) });
        } else {
          // Up and down is a scroll, not a drag.
          grab.current = null;
        }
        return;
      }
      setGhost((now) => (now ? { ...now, x: event.clientX, y: event.clientY, over: overAt(event.clientX, event.clientY) } : now));
    };
    const up = (event: PointerEvent) => {
      const held = grab.current;
      if (!held || event.pointerId !== held.pointer) return;
      stopTimer(held);
      grab.current = null;
      skipTap.current = held.armed || held.moved;
      if (held.armed) {
        const over = overAt(event.clientX, event.clientY);
        setGhost(null);
        if (held.from === "pool" && over === "list") addCard(held);
        if (held.from === "list" && over === "pool") dropCard(held);
      }
    };
    const cancel = (event: PointerEvent) => {
      const held = grab.current;
      if (!held || event.pointerId !== held.pointer) return;
      stopTimer(held);
      grab.current = null;
      skipTap.current = true;
      setGhost(null);
    };
    // Once a card is picked up the page must not scroll under the finger.
    const block = (event: TouchEvent) => {
      if (grab.current?.armed) event.preventDefault();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      document.removeEventListener("touchmove", block);
    };
    // addCard and dropCard only use state setters, so the first ones stay right.
  }, []);

  function press(event: ReactPointerEvent, pick: Pick, from: "pool" | "list", canDrag: boolean) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    skipTap.current = false;
    const held: Grab = { ...pick, from, canDrag, pointer: event.pointerId, x0: event.clientX, y0: event.clientY, armed: false, moved: false, timer: null };
    if (canDrag) {
      held.timer = window.setTimeout(() => {
        if (grab.current !== held || held.armed) return;
        held.armed = true;
        held.timer = null;
        setGhost({ id: held.id, kind: held.kind, from, x: held.x0, y: held.y0, over: from });
      }, HOLD_MS);
    }
    grab.current = held;
  }

  const issue = deckIssues(deck);
  const balance = deckBalance(deck);
  const total = deck.monsters.length + deck.spells.length;
  // At least 13 monsters and 7 spells; 24 cards at most (chủ game 22/10).
  const short = Math.max(0, 13 - deck.monsters.length) + Math.max(0, 7 - deck.spells.length);
  const canSave = short === 0 && !issue;
  const inDeck = new Set([...deck.monsters, ...deck.spells]);
  // The starter deck's cards play as fakes until their real cards are owned: cut stats in red, spells 1 mana more.
  const fakes = new Set(booted ? fakeIds([...MONSTERS, ...SPELLS].map((card) => card.id)) : []);
  // Forms come from play, not the deck; a guest's cards not opened from packs yet are locked too (owner, 19/10).
  // Read on this phone after the first render, so the page the server sent matches.
  const locked = new Set([...FORMS.map((card) => card.id), ...(booted ? [...MONSTERS, ...SPELLS].map((card) => card.id).filter((id) => !canUseCard(id)) : [])]);
  const entry = book.find((row) => row.n === active) ?? null;
  const deckName = entry?.name ?? tr("Bộ bài");

  const q = plainName(query);
  const named = (name: string) => !q || plainName(name).includes(q) || plainName(tr(name)).includes(q);
  const live = (card: MonsterCard) => monsterCard(card.id) ?? card;
  // Cards not owned are left out of the pool, and forms unless all the cards they need are owned (owner, 21/10); the
  // publisher has them all. Read after the first render, like the locks.
  const formIds = new Set(FORMS.map((card) => card.id));
  const shown = (id: string) => !booted || (formIds.has(id) ? canReachForm(id) : canUseCard(id));
  const allMonsters = [...MONSTERS.map(live).sort(byStars), ...FORMS.map(live).sort(byStars)].filter((card) => shown(card.id));
  const allSpells = SPELLS.map((card) => spellCard(card.id) ?? card)
    .filter((card) => shown(card.id))
    .sort((a, b) => spellKindRank(a.id) - spellKindRank(b.id) || byMana(a, b));
  // Typing a name searches monsters and spells together; otherwise the pool shows the kind its icon picked.
  const poolMonsters = q || mode === "monster" ? allMonsters.filter((card) => named(card.name) && passesFilter(card.id, filter, plans)) : [];
  const poolSpells = q || mode === "spell" ? allSpells.filter((card) => named(card.name)) : [];

  const pickedMonsters = deck.monsters
    .map((id) => monsterCard(id))
    .filter((card): card is MonsterCard => !!card)
    .sort(byStars);
  const pickedSpells = deck.spells
    .map((id) => spellCard(id))
    .filter((card): card is SpellCard => !!card)
    .sort(byMana);

  // The sheet opens on the click, after the finger is up, so that same tap cannot land on the sheet's backdrop.
  function tap(pick: Pick) {
    if (skipTap.current) {
      skipTap.current = false;
      return;
    }
    setSheet(pick);
  }

  function save() {
    if (!canSave) return;
    saveDeck(deck);
    setSaved(true);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 3000);
  }

  function rename(value: string) {
    const name = value.trim();
    setNaming(null);
    if (!name) return;
    if (entry) {
      setBook((current) => current.map((row) => (row.n === entry.n ? { ...row, name, at: Date.now() } : row)));
      return;
    }
    const row = { ...freshDeck(book), name, monsters: deck.monsters, spells: deck.spells };
    setBook((current) => [...current, row]);
    setActive(row.n);
  }

  // The cover the player chose stays on the deck's box (Chọn bộ bài) while the deck can still show it.
  function setCover(id: string) {
    if (entry) {
      setBook((current) => current.map((row) => (row.n === entry.n ? { ...row, cover: id, coverSet: true, at: Date.now() } : row)));
      return;
    }
    const row = { ...freshDeck(book), monsters: deck.monsters, spells: deck.spells, cover: id, coverSet: true };
    setBook((current) => [...current, row]);
    setActive(row.n);
  }

  function toggle<K extends keyof PoolFilter>(key: K, value: PoolFilter[K][number]) {
    setFilter((current) => {
      const list = current[key] as Array<typeof value>;
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, [key]: next };
    });
    // A monster filter shows the monsters.
    setMode("monster");
  }

  if (plansOpen) {
    return <DeckPlans ids={[...deck.monsters, ...deck.spells]} onBack={() => setPlansOpen(false)} />;
  }

  const ghostCard = ghost ? (ghost.kind === "monster" ? monsterCard(ghost.id) : undefined) : undefined;
  const ghostFits = ghost ? (ghost.from === "pool" ? ghost.over === "list" : ghost.over === "pool") : false;

  return (
    <main className={`dk-page${ghost ? " is-dragging" : ""}`}>
      <GlyphDefs />
      <header className="dk-head">
        <Link to="/modes" className="dk-back" aria-label={tr("Trở về")}>
          {"<<"}
        </Link>
        <h1>{tr("Chỉnh sửa bộ bài")}</h1>
      </header>
      <section className={`dk-pool${ghost?.from === "list" ? " is-target" : ""}${ghost?.from === "list" && ghost.over === "pool" ? " is-over" : ""}`} data-drop="pool">
        <div className="dk-grid">
          {poolMonsters.map((card) => (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              className={`dk-card${inDeck.has(card.id) ? " is-in" : ""}${locked.has(card.id) ? " is-locked" : ""}${ghost?.id === card.id ? " is-lifted" : ""}`}
              onPointerDown={(event) => press(event, { id: card.id, kind: "monster" }, "pool", !inDeck.has(card.id) && !locked.has(card.id))}
              onClick={() => tap({ id: card.id, kind: "monster" })}
              onContextMenu={(event) => event.preventDefault()}
            >
              <CardFace monster={card} hideName fake={fakes.has(card.id)} mark={markFace(card.id)} />
              {locked.has(card.id) ? (
                <span className="dk-lock" aria-hidden="true">
                  <LockIcon />
                </span>
              ) : null}
            </div>
          ))}
          {poolSpells.map((card) => (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              className={`dk-card is-spell${inDeck.has(card.id) ? " is-in" : ""}${locked.has(card.id) ? " is-locked" : ""}${ghost?.id === card.id ? " is-lifted" : ""}`}
              onPointerDown={(event) => press(event, { id: card.id, kind: "spell" }, "pool", !inDeck.has(card.id) && !locked.has(card.id))}
              onClick={() => tap({ id: card.id, kind: "spell" })}
              onContextMenu={(event) => event.preventDefault()}
            >
              <CardFace spellId={card.id} hideName gems={fakes.has(card.id) ? `${card.gems}+1` : undefined} mark={markFace(card.id)} />
              {locked.has(card.id) ? (
                <span className="dk-lock" aria-hidden="true">
                  <LockIcon />
                </span>
              ) : null}
            </div>
          ))}
        </div>
        {poolMonsters.length + poolSpells.length === 0 ? <p className="dk-empty">{tr("Không có lá nào khớp.")}</p> : null}
      </section>
      <section className="dk-bottom">
        <div className={`dk-list${ghost?.from === "pool" ? " is-target" : ""}${ghost?.from === "pool" && ghost.over === "list" ? " is-over" : ""}`} data-drop="list">
          <div className="dk-rows">
            {pickedMonsters.map((card) => (
              <DeckRow
                key={card.id}
                id={card.id}
                kind="monster"
                lifted={ghost?.id === card.id}
                onPress={(event) => press(event, { id: card.id, kind: "monster" }, "list", true)}
                onTap={() => tap({ id: card.id, kind: "monster" })}
              />
            ))}
            {pickedSpells.map((card) => (
              <DeckRow
                key={card.id}
                id={card.id}
                kind="spell"
                lifted={ghost?.id === card.id}
                onPress={(event) => press(event, { id: card.id, kind: "spell" }, "list", true)}
                onTap={() => tap({ id: card.id, kind: "spell" })}
              />
            ))}
            {total === 0 ? <p className="dk-rows-empty">{tr("Kéo lá từ kho xuống đây.")}</p> : null}
          </div>
          {filterOpen ? <FilterPanel filter={filter} onToggle={toggle} onClear={() => setFilter(NO_FILTER)} /> : null}
        </div>
        <aside className="dk-side">
          <label className="dk-search">
            <span className="dk-search-ico">
              <Glyph name="magnifying-glass" fill="#d8c79a" />
            </span>
            <input value={query} placeholder={tr("Tìm lá bài")} onChange={(event) => setQuery(event.target.value)} />
            {query ? (
              <button type="button" className="dk-search-x" aria-label={tr("Xoá")} onClick={() => setQuery("")}>
                ✕
              </button>
            ) : null}
          </label>
          <DragTip />
          {/* Row 1: Quái, Phép. Row 2: Thống kê, Lọc, Lưu; Lưu sits right above Đổi hình nền (owner, 18/10). */}
          <div className="dk-pad">
            <div className="dk-tools is-main">
              <button type="button" className={`dk-tool is-monster${mode === "monster" && !q ? " on" : ""}`} aria-label={tr("Quái thú")} onClick={() => setMode("monster")}>
                <ToolGem glyph="wolf-head" rim="note" ring="#ffd23c" deep="#4a3400" />
                <Count side={balance.monster} />
              </button>
              <button type="button" className={`dk-tool is-spell${mode === "spell" && !q ? " on" : ""}`} aria-label={tr("Phép")} onClick={() => setMode("spell")}>
                <ToolGem glyph="spell-book" rim="passive" ring="#b45cff" deep="#2a0d4a" />
                <Count side={balance.spell} />
              </button>
            </div>
            <div className="dk-tools is-stack">
              <button type="button" className="dk-tool is-small" aria-label={tr("Các chiến thuật đang có trong bộ bài")} onClick={() => setPlansOpen(true)}>
                <ToolGem glyph="histogram" rim="active" ring="#3ec6ff" deep="#0b2a4a" />
              </button>
              <button
                type="button"
                className={`dk-tool is-small${filterOpen ? " on" : ""}${filterOn(filter) ? " is-set" : ""}`}
                aria-label={tr("Lọc")}
                onClick={() => setFilterOpen((open) => !open)}
              >
                <ToolGem glyph="funnel" rim="steel" ring="#b9bec8" deep="#2a2d33" />
              </button>
              <button type="button" className={`dk-tool is-small is-save${canSave ? "" : " is-off"}${saved ? " is-saved" : ""}`} aria-label={tr("Lưu")} disabled={!canSave} onClick={save}>
                <ToolGem glyph={saved ? "check-mark" : "save"} rim="active" ring="#3ec6ff" deep="#0b2a4a" />
                {short > 0 ? <b className="dk-count is-bad">-{short}</b> : null}
              </button>
            </div>
          </div>
          <div className="dk-foot">
            <button type="button" className="dk-name" onClick={() => setNaming(entry?.name ?? "")}>
              <span className="dk-name-text">{deckName}</span>
            </button>
            <button type="button" className="dk-tool is-small" aria-label={tr("Đổi hình nền")} onClick={() => setCovering(true)}>
              <ToolGem glyph="portrait" rim="note" ring="#e9c46a" deep="#3a2a06" />
            </button>
            {naming !== null ? (
              <input
                className="dk-name-edit"
                autoFocus
                value={naming}
                maxLength={40}
                aria-label={tr("Tên bộ bài")}
                onChange={(event) => setNaming(event.target.value)}
                onBlur={(event) => rename(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            ) : null}
          </div>
        </aside>
      </section>
      {ghost ? (
        <div className={`dk-ghost${ghostFits ? " is-fit" : ""}`} style={{ left: ghost.x, top: ghost.y }}>
          {ghost.kind === "monster" ? <CardFace monster={ghostCard} hideName /> : <CardFace spellId={ghost.id} hideName />}
        </div>
      ) : null}
      {sheet ? (
        sheet.kind === "monster" ? (
          <CardMonsterSheet id={sheet.id} aside={<BalanceBox id={sheet.id} />} note={DECK_NOTES[sheet.id]} asideFor={(id) => <BalanceBox id={id} />} noteFor={(id) => DECK_NOTES[id]} onClose={() => setSheet(null)} />
        ) : (
          <SpellSheet id={sheet.id} aside={<BalanceBox id={sheet.id} />} note={DECK_NOTES[sheet.id]} asideFor={(id) => <BalanceBox id={id} />} noteFor={(id) => DECK_NOTES[id]} onClose={() => setSheet(null)} />
        )
      ) : null}
      {covering ? (
        <CoverPicker
          choices={coverChoices(deck)}
          current={entry ? coverOf({ ...entry, monsters: deck.monsters, spells: deck.spells }) : null}
          onPick={(id) => {
            setCover(id);
            setCovering(false);
          }}
          onClose={() => setCovering(false)}
        />
      ) : null}
    </main>
  );
}

/**
 * The deck builder's tip under the search box (owner, 18/10): raised, gently swaying letters led by a yellow "?".
 * Tapping it dissolves it to a small "?"; tapping that brings it back. The choice is remembered on this phone.
 */
const TIP_KEY = "clash-deck-tip";

function DragTip() {
  const [sunk, setSunk] = useState(false);
  useEffect(() => {
    try {
      setSunk(localStorage.getItem(TIP_KEY) === "sunk");
    } catch {
      // Shown by default.
    }
  }, []);
  function flip() {
    setSunk((now) => {
      try {
        localStorage.setItem(TIP_KEY, now ? "up" : "sunk");
      } catch {
        // Only this visit then.
      }
      return !now;
    });
  }
  return (
    <button type="button" className={`dk-tip${sunk ? " is-sunk" : ""}`} aria-expanded={!sunk} onClick={flip}>
      <span className="dk-tip-text">
        <i className="dk-tip-mark" aria-hidden="true">
          ?
        </i>
        <span>
          <b>{tr("Kéo ngang")}</b> {tr("hoặc")} <b>{tr("Ấn giữ")}</b> {tr("để di chuyển lá bài")}
        </span>
      </span>
      <span className="dk-tip-tab" aria-hidden="true">
        ?
      </span>
    </button>
  );
}

/** Power balance notes beside the card on its sheet, under its name (owner, 18/10: instead of a Cân bằng icon). */
function BalanceBox({ id }: { id: string }) {
  const blocks = infoBlocks(id);
  if (!blocks.length) return null;
  return (
    <section className={`msheet-balance is-${blocks[0].tone}`}>
      <b>{tr("Cân bằng sức mạnh")}</b>
      <BalanceLines id={id} />
    </section>
  );
}

/** Đổi hình nền: the deck's monsters and the forms they can become; pick one and set it as the deck's cover. */
function CoverPicker({ choices, current, onPick, onClose }: { choices: string[]; current: string | null; onPick: (id: string) => void; onClose: () => void }) {
  const [picked, setPicked] = useState<string | null>(current);
  return (
    <div className="dk-cover-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="dk-cover" role="dialog" aria-label={tr("Đổi hình nền")}>
        <button type="button" className="msheet-x" aria-label={tr("Đóng")} onClick={onClose}>
          ✕
        </button>
        <h2>{tr("Đổi hình nền")}</h2>
        {choices.length ? (
          <div className="dk-cover-grid">
            {choices.map((id) => (
              <button key={id} type="button" className={`dk-cover-pick${picked === id ? " on" : ""}`} onClick={() => setPicked(id)}>
                <span className="dk-cover-art" style={{ backgroundImage: `url(${artSrc(id, 1)})` }} />
                <img className="dk-cover-frame" src="/ui/cover-frame.png" alt="" draggable={false} />
              </button>
            ))}
          </div>
        ) : (
          <p className="dk-cover-empty">{tr("Bộ bài chưa có quái thú.")}</p>
        )}
        <button type="button" className="dk-cover-set" disabled={!picked} onClick={() => picked && onPick(picked)}>
          {tr("Đặt làm ảnh bìa")}
        </button>
      </div>
    </div>
  );
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

/** A round 3D gem with a game icon, like the skill icons, for the tool buttons. */
function ToolGem({ glyph, rim, ring, deep }: { glyph: string; rim: string; ring: string; deep: string }) {
  return (
    <span className="sk3d dk-gem" style={{ "--ring": ring, "--deep": deep } as CSSProperties}>
      <span className="sk3d-gem">
        <span className="sk3d-core">
          <Glyph name={glyph} />
        </span>
        <Rim kind={rim} />
      </span>
    </span>
  );
}

/** How far the monsters or spells are from the least the deck needs: -x in red when short, +x spare. */
function Count({ side }: { side: DeckSide }) {
  return <b className={`dk-count${side.bad ? " is-bad" : " is-ok"}`}>{`${side.sign}${side.n}`}</b>;
}

/** The pool filter, over the deck list: environment, monster type and stars; tap the filter icon to hide it. */
function FilterPanel({
  filter,
  onToggle,
  onClear,
}: {
  filter: PoolFilter;
  onToggle: <K extends keyof PoolFilter>(key: K, value: PoolFilter[K][number]) => void;
  onClear: () => void;
}) {
  return (
    <div className="dk-filter">
      <h3 className="dk-filter-head">{tr("Môi trường")}</h3>
      <div className="dk-filter-grid">
        {ENV_FILTERS.map((env) => (
          <button key={env.id} type="button" className={`dk-chip is-env${filter.envs.includes(env.id) ? " on" : ""}`} onClick={() => onToggle("envs", env.id)}>
            <span className="dk-chip-ico">
              <img src={spellSrc(env.id)} alt="" draggable={false} />
            </span>
            <span className="dk-chip-label">{tr(env.label)}</span>
          </button>
        ))}
      </div>
      <h3 className="dk-filter-head">{tr("Loại quái")}</h3>
      <div className="dk-filter-grid">
        {MONSTER_TYPES.map((type) => (
          <button key={type.key} type="button" className={`dk-chip is-type${filter.types.includes(type.key) ? " on" : ""}`} onClick={() => onToggle("types", type.key)}>
            <span className="dk-chip-ico">
              <Glyph name={type.icon} />
            </span>
            <span className="dk-chip-label">{tr(type.label)}</span>
          </button>
        ))}
      </div>
      <h3 className="dk-filter-head">{tr("Số sao")}</h3>
      <div className="dk-stars">
        {STAR_FILTERS.map((stars) => (
          <button key={stars} type="button" className={`dk-num${filter.stars.includes(stars) ? " on" : ""}`} onClick={() => onToggle("stars", stars)}>
            {stars}
          </button>
        ))}
      </div>
      <button type="button" className="dk-clear" disabled={!filterOn(filter)} onClick={onClear}>
        {tr("Bỏ lọc")}
      </button>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="4.5" y="10" width="15" height="11" rx="2.4" fill="currentColor" />
    </svg>
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
