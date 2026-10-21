import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { AlbumCover, AlbumPic, CardsIcon, ChainIcon } from "@/components/collection/album-parts";
import { LockBox } from "@/components/collection/card-vault";
import { CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { FORMS, monsterCard, spellCard } from "@/lib/catalog";
import { albumOf, albumPages, formatNo, setReward, setsOf, type Album, type AlbumCard, type CardSet, type PageItem } from "@/lib/collection";
import { tr } from "@/lib/i18n";

type Stage = "fly" | "open" | "ready" | "closing";
type Turn = { to: number; dir: 1 | -1 };
type Opened = { id: string; from: DOMRect };

/** The cover flies to the middle, then swings open; a page turns; a linked card flares before its sets open. */
const FLY_MS = 460;
const OPEN_MS = 900;
const CLOSE_MS = 220;
const FLIP_MS = 640;
const BURST_MS = 380;
/** A swipe this far across turns the page. */
const SWIPE_PX = 42;

const forms = new Set(FORMS.map((card) => card.id));
const nameOf = (id: string) => monsterCard(id)?.name ?? spellCard(id)?.name ?? id;

/**
 * An album opened (owner, 21/10, after the Collector's Files of the video, made for a phone held upright): one binder
 * page a screen, 4 cards a row and 4 rows, each card's art in the gold frame with its No. under it, grey while not
 * owned. The cover flies in from the shelf and opens like a book; a swipe or the arrows turn the pages. The cards of
 * one set stand together in a gold frame with the set's name and its stars, which light up once all are owned. A card
 * in more than one set, or in a set with cards in another album, carries a chain and a light running round it;
 * tapping it flares it up and opens its sets. Any other card opens its sheet.
 */
export function AlbumBook({
  album,
  from,
  owned,
  sets,
  albums,
  onClose,
}: {
  album: Album;
  from: DOMRect | null;
  owned: Set<string>;
  sets: CardSet[];
  albums: Album[];
  onClose: () => void;
}) {
  const pages = useMemo(() => albumPages(album, sets), [album, sets]);
  const [stage, setStage] = useState<Stage>(from ? "fly" : "ready");
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  const [panel, setPanel] = useState<Opened | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const book = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLSpanElement>(null);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const timers = useRef<number[]>([]);
  const have = album.cards.filter((card) => owned.has(card.id)).length;
  const done = have === album.cards.length;

  const later = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  };
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  // From the cover on the shelf to where the page lies, then it swings open over the first page.
  useLayoutEffect(() => {
    const el = cover.current;
    if (!from || !el || !book.current) return;
    const to = book.current.getBoundingClientRect();
    const place = (rect: { left: number; top: number; width: number; height: number }) => {
      el.style.left = `${rect.left}px`;
      el.style.top = `${rect.top}px`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    };
    el.classList.remove("is-flying");
    place(from);
    el.getBoundingClientRect();
    el.classList.add("is-flying");
    place(to);
    const open = window.setTimeout(() => setStage("open"), FLY_MS + 40);
    const ready = window.setTimeout(() => setStage("ready"), FLY_MS + 40 + OPEN_MS);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(ready);
    };
  }, [from]);

  function close() {
    if (stage === "closing") return;
    setStage("closing");
    later(CLOSE_MS, onClose);
  }

  function go(dir: 1 | -1) {
    const to = index + dir;
    if (turn || stage !== "ready" || to < 0 || to >= pages.length) return;
    setTurn({ to, dir });
    later(FLIP_MS, () => {
      setIndex(to);
      setTurn(null);
    });
  }

  function tap(card: AlbumCard, linked: boolean, at: DOMRect) {
    if (swipe.current?.moved || turn || burst) return;
    if (!linked) {
      setSheet(card.id);
      return;
    }
    setBurst(card.id);
    later(BURST_MS, () => {
      setBurst(null);
      setPanel({ id: card.id, from: at });
    });
  }

  function down(event: ReactPointerEvent) {
    swipe.current = { x: event.clientX, y: event.clientY, moved: false };
  }
  function move(event: ReactPointerEvent) {
    const start = swipe.current;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) start.moved = true;
  }
  function up(event: ReactPointerEvent) {
    const start = swipe.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
  }

  const leaf = (page: number, kind: string) => (
    <div key={page} className={`al-leaf${kind ? ` ${kind}` : ""}`}>
      <AlbumPage items={pages[page]} owned={owned} burst={burst} onTap={tap} />
    </div>
  );
  const leaves = !turn ? [leaf(index, "")] : turn.dir === 1 ? [leaf(turn.to, "is-under"), leaf(index, "is-turn-next")] : [leaf(index, "is-under"), leaf(turn.to, "is-turn-back")];
  const lockFor = (id: string) => (owned.has(id) || forms.has(id) ? null : <LockBox />);
  const shown = turn ? turn.to : index;

  return (
    <div className={`al-view is-${stage}`}>
      <header className="al-head">
        <button type="button" className="cv-back" data-ui="soft" aria-label={tr("Trở về")} onClick={close}>
          {"<<"}
        </button>
        <h2>{tr(album.name)}</h2>
        <span className={`al-tally${done ? " is-done" : ""}`} aria-label={tr("Số lá đã có")}>
          <CardsIcon />
          {have}/{album.cards.length}
        </span>
      </header>
      <div className="al-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <div ref={book} className={`al-book${turn ? " is-turning" : ""}`}>
          {leaves}
        </div>
      </div>
      <footer className="al-foot">
        <button type="button" className="al-arrow" data-ui="soft" aria-label={tr("Trang trước")} disabled={shown === 0 || !!turn} onClick={() => go(-1)}>
          <Chevron back />
        </button>
        <span className="al-dots" aria-label={`${shown + 1}/${pages.length}`}>
          {pages.map((_, page) => (
            <i key={page} className={page === shown ? "on" : ""} />
          ))}
        </span>
        <button type="button" className="al-arrow" data-ui="soft" aria-label={tr("Trang sau")} disabled={shown === pages.length - 1 || !!turn} onClick={() => go(1)}>
          <Chevron />
        </button>
      </footer>
      {stage === "fly" || stage === "open" ? <AlbumCover ref={cover} album={album} done={done} className={`al-fly${stage === "open" ? " is-opening" : ""}`} /> : null}
      {panel ? <SetPanel opened={panel} owned={owned} sets={sets} albums={albums} onView={setSheet} onClose={() => setPanel(null)} /> : null}
      {sheet ? (
        monsterCard(sheet) ? (
          <CardMonsterSheet id={sheet} aside={lockFor(sheet)} asideFor={lockFor} onClose={() => setSheet(null)} />
        ) : (
          <SpellSheet id={sheet} aside={lockFor(sheet)} asideFor={lockFor} onClose={() => setSheet(null)} />
        )
      ) : null}
    </div>
  );
}

/** One binder page: 16 pockets, a framed set taking as many as its cards. */
function AlbumPage({ items, owned, burst, onTap }: { items: PageItem[]; owned: Set<string>; burst: string | null; onTap: (card: AlbumCard, linked: boolean, at: DOMRect) => void }) {
  return (
    <div className="al-page">
      <div className="al-pockets">
        {items.map((item, index) => {
          if (item.type === "blank") {
            return (
              <span key={`blank-${index}`} className="al-pocket is-blank">
                <span className="al-slot" />
              </span>
            );
          }
          if (item.type === "card") return <Pocket key={item.card.id} card={item.card} owned={owned.has(item.card.id)} linked={item.linked} burst={burst === item.card.id} onTap={onTap} />;
          const complete = item.set.ids.every((id) => owned.has(id));
          return (
            <div key={`set-${item.set.id}`} className={`al-set${complete ? " is-done" : ""}`} style={{ "--n": item.cards.length } as CSSProperties}>
              <span className="al-set-tag">
                <b>{tr(item.set.name)}</b>
                <i>★{setReward(item.set)}</i>
              </span>
              {item.cards.map((card) => (
                <Pocket key={card.id} card={card} owned={owned.has(card.id)} linked={false} burst={false} onTap={onTap} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Pocket({ card, owned, linked, burst, onTap }: { card: AlbumCard; owned: boolean; linked: boolean; burst: boolean; onTap: (card: AlbumCard, linked: boolean, at: DOMRect) => void }) {
  return (
    <button
      type="button"
      data-ui="soft"
      className={`al-pocket${owned ? "" : " is-missing"}${linked ? " is-linked" : ""}${burst ? " is-burst" : ""}`}
      aria-label={tr(nameOf(card.id))}
      onClick={(event) => onTap(card, linked, event.currentTarget.getBoundingClientRect())}
    >
      <span className="al-slot">
        <AlbumPic id={card.id} missing={!owned} />
        {linked ? (
          <i className="al-link">
            <ChainIcon />
          </i>
        ) : null}
      </span>
      <span className="al-no">{formatNo(card.no)}</span>
    </button>
  );
}

/**
 * The sets of a linked card (owner, 21/10): the card large, then each of its sets with its name, its stars at the top
 * right and its cards with their album and No.; what is missing is dimmed, the stars too until the set is complete.
 * Xem opens the card's sheet, and so does tapping any card of a set.
 */
function SetPanel({ opened, owned, sets, albums, onView, onClose }: { opened: Opened; owned: Set<string>; sets: CardSet[]; albums: Album[]; onView: (id: string) => void; onClose: () => void }) {
  const { id, from } = opened;
  const where = (card: string) => {
    const album = albumOf(card, albums);
    return { album: album?.name ?? "", no: album?.cards.find((row) => row.id === card)?.no };
  };
  const self = where(id);
  // The panel grows out of the card that was tapped.
  const origin = { "--from-x": `${from.left + from.width / 2 - window.innerWidth / 2}px`, "--from-y": `${from.top + from.height / 2 - window.innerHeight / 2}px` } as CSSProperties;
  return (
    <div className="al-panel-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="al-panel" role="dialog" aria-label={tr(nameOf(id))} style={origin}>
        <button type="button" className="msheet-x" aria-label="Đóng" onClick={onClose}>
          ✕
        </button>
        <div className="al-panel-top">
          <span className="al-panel-pic">
            <AlbumPic id={id} missing={!owned.has(id)} />
          </span>
          <div className="al-panel-info">
            <h3>{tr(nameOf(id))}</h3>
            <small>
              {self.no ? formatNo(self.no) : ""} · {tr(self.album)}
            </small>
            <button type="button" className="al-panel-view" onClick={() => onView(id)}>
              {tr("Xem")}
            </button>
          </div>
        </div>
        {setsOf(id, sets).map((set) => {
          const complete = set.ids.every((card) => owned.has(card));
          return (
            <section key={set.id} className={`al-panel-set${complete ? " is-done" : ""}`}>
              <header>
                <b>{tr(set.name)}</b>
                <i>★{setReward(set)}</i>
              </header>
              <div className="al-panel-cards">
                {set.ids.map((card) => {
                  const at = where(card);
                  return (
                    <button
                      key={card}
                      type="button"
                      data-ui="soft"
                      className={`al-panel-card${owned.has(card) ? "" : " is-missing"}${card === id ? " is-self" : ""}`}
                      aria-label={tr(nameOf(card))}
                      onClick={() => onView(card)}
                    >
                      <AlbumPic id={card} missing={!owned.has(card)} />
                      <small>{at.no ? formatNo(at.no) : ""}</small>
                      <small>{tr(at.album)}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={back ? "M15 4.5 7.5 12l7.5 7.5" : "M9 4.5 16.5 12 9 19.5"} />
    </svg>
  );
}
