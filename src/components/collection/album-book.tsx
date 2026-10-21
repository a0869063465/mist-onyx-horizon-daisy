import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ExchangeAsk, ExchangeBox, ExchangeShow, SetPanel, SetPrize, StatShow, type Opened } from "@/components/collection/album-panels";
import { AlbumCover, AlbumPic, CardsIcon, ChainIcon } from "@/components/collection/album-parts";
import { CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { FORMS, monsterCard } from "@/lib/catalog";
import { albumPages, cardName, cardNumbers, formatNo, rarityOf, type Album, type AlbumCard, type CardSet, type PageItem } from "@/lib/collection";
import { tr } from "@/lib/i18n";
import { loadRates, type Rates, type Tier } from "@/lib/shop";

type Stage = "fly" | "open" | "ready" | "closing";
type Turn = { to: number; dir: 1 | -1 };
/** Stars taken from a set, rising from its Nhận. */
type Float = { key: number; x: number; y: number; stars: number };
type Tap = (card: AlbumCard, linked: boolean, at: DOMRect) => void;

/** The cover flies to the middle, then swings open; a page turns; a linked card flares before its sets open. */
const FLY_MS = 460;
const OPEN_MS = 900;
const CLOSE_MS = 220;
const FLIP_MS = 640;
const BURST_MS = 380;
/** A new card drops into its pocket in this long, the next one on the page a little later. */
const ARRIVE_MS = 800;
const STAGGER_MS = 130;
/** A swipe this far across turns the page. */
const SWIPE_PX = 42;

const forms = new Set(FORMS.map((card) => card.id));
const idsOf = (page: PageItem[]) => page.flatMap((item) => (item.type === "card" ? [item.card.id] : item.type === "set" ? item.cards.map((card) => card.id) : []));
const without = (from: Set<string>, ids: string[]) => new Set([...from].filter((id) => !ids.includes(id)));

/**
 * An album opened (owner, 21/10, after the Collector's Files of the video, made for a phone held upright): one binder
 * page a screen, 4 cards a row and 4 rows, each card's art in the gold frame with its No. under it, grey while not
 * owned. The cover flies in from the shelf and opens like a book; a swipe or the arrows turn the pages. The cards of
 * one set stand together in a gold frame with the set's name and its stars, which light up once all are owned and
 * are taken with Nhận. A card in more than one set, or in a set with cards in another album, carries a chain and a
 * light running round it; tapping it flares it up and opens its sets. Any other card opens its sheet, where a card not
 * owned can be bought with stars (Đổi). Cards new since the album was last looked at, and a card just bought, drop
 * into their pockets in a glow of their rarity's colour, page after page, then Tiến độ sưu tập counts the album up.
 */
export function AlbumBook({
  album,
  from,
  fresh,
  owned,
  claimed,
  sets,
  albums,
  onExchange,
  onClaim,
  onClose,
}: {
  album: Album;
  from: DOMRect | null;
  /** Cards new to this album since it was last opened. */
  fresh: string[];
  owned: Set<string>;
  claimed: Set<string>;
  sets: CardSet[];
  albums: Album[];
  onExchange: (id: string) => boolean;
  onClaim: (set: CardSet) => number;
  onClose: () => void;
}) {
  const pages = useMemo(() => albumPages(album, sets), [album, sets]);
  const rates = useMemo(() => loadRates(), []);
  const numbered = useMemo(() => cardNumbers(), []);
  const here = useMemo(() => new Set(album.cards.map((card) => card.id)), [album]);
  const [stage, setStage] = useState<Stage>(from ? "fly" : "ready");
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  const [panel, setPanel] = useState<Opened | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(() => new Set(fresh.filter((id) => here.has(id))));
  const [arriving, setArriving] = useState<string[]>([]);
  const [stat, setStat] = useState<{ from: number; to: number } | null>(null);
  const [ask, setAsk] = useState<string | null>(null);
  const [forge, setForge] = useState<{ id: string; before: number } | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const book = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLSpanElement>(null);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const timers = useRef<number[]>([]);
  const at = useRef(0);
  const started = useRef(false);
  const have = album.cards.filter((card) => owned.has(card.id)).length;
  const done = have === album.cards.length;
  const busy = pending.size > 0 || arriving.length > 0 || !!stat || !!forge || !!ask;

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

  function turnTo(to: number) {
    setTurn({ to, dir: to > at.current ? 1 : -1 });
    later(FLIP_MS, () => {
      at.current = to;
      setIndex(to);
      setTurn(null);
    });
  }

  function go(dir: 1 | -1) {
    const to = at.current + dir;
    if (turn || busy || stage !== "ready" || to < 0 || to >= pages.length) return;
    turnTo(to);
  }

  /** New cards drop in, page after page, then the album's count climbs from `before`. */
  function reveal(ids: string[], before: number) {
    const spots = pages.map((page, n) => ({ n, ids: idsOf(page).filter((id) => ids.includes(id)) })).filter((spot) => spot.ids.length);
    let page = at.current;
    let wait = 0;
    for (const spot of spots) {
      if (spot.n !== page) {
        const to = spot.n;
        later(wait, () => turnTo(to));
        wait += FLIP_MS + 120;
        page = to;
      }
      later(wait, () => setArriving(spot.ids));
      wait += ARRIVE_MS + STAGGER_MS * (spot.ids.length - 1);
      later(wait, () => {
        setArriving([]);
        setPending((now) => without(now, spot.ids));
      });
      wait += 160;
    }
    if (spots.length) later(wait, () => setStat({ from: before, to: before + spots.reduce((sum, spot) => sum + spot.ids.length, 0) }));
  }

  // Once the album lies open, its new cards arrive.
  useEffect(() => {
    if (stage !== "ready" || started.current) return;
    started.current = true;
    const news = [...pending];
    if (news.length) later(250, () => reveal(news, have - news.length));
    // Only when the album first lies open; the cards and counts are the ones it opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function close() {
    if (stage === "closing") return;
    setStage("closing");
    later(CLOSE_MS, onClose);
  }

  function tap(card: AlbumCard, linked: boolean, rect: DOMRect) {
    if (swipe.current?.moved || turn || burst || busy) return;
    if (!linked) {
      setSheet(card.id);
      return;
    }
    setBurst(card.id);
    later(BURST_MS, () => {
      setBurst(null);
      setPanel({ id: card.id, from: rect });
    });
  }

  // Bought: saved at once, then the light show; a card of this album then drops into its pocket.
  function buy(id: string) {
    if (!onExchange(id)) return;
    setAsk(null);
    setSheet(null);
    setPanel(null);
    if (here.has(id)) setPending((now) => new Set(now).add(id));
    setForge({ id, before: have });
  }

  function forged() {
    if (!forge) return;
    setForge(null);
    if (here.has(forge.id)) reveal([forge.id], forge.before);
  }

  function claim(set: CardSet, rect: DOMRect) {
    const stars = onClaim(set);
    if (!stars) return;
    const key = performance.now();
    setFloats((now) => [...now, { key, x: rect.left + rect.width / 2, y: rect.top, stars }]);
    later(1300, () => setFloats((now) => now.filter((float) => float.key !== key)));
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
      <AlbumPage
        items={pages[page]}
        owned={owned}
        claimed={claimed}
        rates={rates}
        burst={burst}
        pending={pending}
        arriving={arriving}
        onTap={tap}
        onClaim={claim}
      />
    </div>
  );
  const leaves = !turn ? [leaf(index, "")] : turn.dir === 1 ? [leaf(turn.to, "is-under"), leaf(index, "is-turn-next")] : [leaf(index, "is-under"), leaf(turn.to, "is-turn-back")];
  const asideFor = (id: string) => (owned.has(id) || forms.has(id) || !numbered.has(id) ? null : <ExchangeBox id={id} onAsk={setAsk} />);
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
        <button type="button" className="al-arrow" data-ui="soft" aria-label={tr("Trang trước")} disabled={shown === 0 || !!turn || busy} onClick={() => go(-1)}>
          <Chevron back />
        </button>
        <span className="al-dots" aria-label={`${shown + 1}/${pages.length}`}>
          {pages.map((_, page) => (
            <i key={page} className={page === shown ? "on" : ""} />
          ))}
        </span>
        <button type="button" className="al-arrow" data-ui="soft" aria-label={tr("Trang sau")} disabled={shown === pages.length - 1 || !!turn || busy} onClick={() => go(1)}>
          <Chevron />
        </button>
      </footer>
      {stage === "fly" || stage === "open" ? <AlbumCover ref={cover} album={album} done={done} className={`al-fly${stage === "open" ? " is-opening" : ""}`} /> : null}
      {panel ? (
        <SetPanel opened={panel} owned={owned} claimed={claimed} sets={sets} albums={albums} onView={setSheet} onAsk={setAsk} onClaim={claim} onClose={() => setPanel(null)} />
      ) : null}
      {sheet ? (
        monsterCard(sheet) ? (
          <CardMonsterSheet id={sheet} aside={asideFor(sheet)} asideFor={asideFor} onClose={() => setSheet(null)} />
        ) : (
          <SpellSheet id={sheet} aside={asideFor(sheet)} asideFor={asideFor} onClose={() => setSheet(null)} />
        )
      ) : null}
      {ask ? <ExchangeAsk id={ask} albums={albums} onCancel={() => setAsk(null)} onConfirm={() => buy(ask)} /> : null}
      {forge ? <ExchangeShow id={forge.id} onDone={forged} /> : null}
      {stat ? <StatShow from={stat.from} to={stat.to} total={album.cards.length} onDone={() => setStat(null)} /> : null}
      {floats.map((float) => (
        <span key={float.key} className="al-float" style={{ left: float.x, top: float.y }}>
          +{float.stars}★
        </span>
      ))}
    </div>
  );
}

/** One binder page: 16 pockets, a framed set taking as many as its cards. */
function AlbumPage({
  items,
  owned,
  claimed,
  rates,
  burst,
  pending,
  arriving,
  onTap,
  onClaim,
}: {
  items: PageItem[];
  owned: Set<string>;
  claimed: Set<string>;
  rates: Rates;
  burst: string | null;
  pending: Set<string>;
  arriving: string[];
  onTap: Tap;
  onClaim: (set: CardSet, at: DOMRect) => void;
}) {
  const pocket = (card: AlbumCard, linked: boolean) => (
    <Pocket
      key={card.id}
      card={card}
      owned={owned.has(card.id)}
      linked={linked}
      tier={rarityOf(card.id, rates)}
      burst={burst === card.id}
      pending={pending.has(card.id)}
      arrive={arriving.indexOf(card.id)}
      onTap={onTap}
    />
  );
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
          if (item.type === "card") return pocket(item.card, item.linked);
          const complete = item.set.ids.every((id) => owned.has(id));
          return (
            <div key={`set-${item.set.id}`} className={`al-set${complete ? " is-done" : ""}`} style={{ "--n": item.cards.length } as CSSProperties}>
              <span className="al-set-tag">
                <b>{tr(item.set.name)}</b>
                <SetPrize set={item.set} complete={complete} claimed={claimed.has(item.set.id)} onClaim={onClaim} />
              </span>
              {item.cards.map((card) => pocket(card, false))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** `arrive`: its place among the cards dropping in now on this page, -1 when it is not one of them. */
function Pocket({
  card,
  owned,
  linked,
  tier,
  burst,
  pending,
  arrive,
  onTap,
}: {
  card: AlbumCard;
  owned: boolean;
  linked: boolean;
  tier: Tier;
  burst: boolean;
  pending: boolean;
  arrive: number;
  onTap: Tap;
}) {
  const cls = `al-pocket tone-${tier}${owned ? "" : " is-missing"}${linked ? " is-linked" : ""}${burst ? " is-burst" : ""}${
    arrive >= 0 ? " is-arriving" : pending ? " is-pending" : ""
  }`;
  return (
    <button
      type="button"
      data-ui="soft"
      className={cls}
      style={arrive >= 0 ? ({ "--i": arrive } as CSSProperties) : undefined}
      aria-label={tr(cardName(card.id))}
      onClick={(event) => onTap(card, linked, event.currentTarget.getBoundingClientRect())}
    >
      <span className="al-slot">
        <AlbumPic id={card.id} missing={!owned} />
        {linked ? (
          <i className="al-link">
            <ChainIcon />
          </i>
        ) : null}
        {arrive >= 0 ? <i className="al-flash" aria-hidden="true" /> : null}
      </span>
      <span className="al-no">{formatNo(card.no)}</span>
    </button>
  );
}

function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={back ? "M15 4.5 7.5 12l7.5 7.5" : "M9 4.5 16.5 12 9 19.5"} />
    </svg>
  );
}
