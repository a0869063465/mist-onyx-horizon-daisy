import { useEffect, useState, type CSSProperties } from "react";
import { AlbumPic } from "@/components/collection/album-parts";
import { albumOf, cardName, exchangePrice, formatNo, rarityOf, setReward, setsOf, type Album, type CardSet } from "@/lib/collection";
import { tr } from "@/lib/i18n";
import { useStars } from "@/lib/shop";

export type Opened = { id: string; from: DOMRect };

const where = (card: string, albums: Album[]) => {
  const album = albumOf(card, albums);
  return { album: album?.name ?? "", no: album?.cards.find((row) => row.id === card)?.no };
};

/**
 * A set's stars (owner, 21/10): dimmed until all its cards are owned, then Nhận to take them (once), then ticked.
 */
export function SetPrize({ set, complete, claimed, onClaim }: { set: CardSet; complete: boolean; claimed: boolean; onClaim: (set: CardSet, at: DOMRect) => void }) {
  const stars = setReward(set);
  if (claimed) return <i className="al-prize is-got">★{stars} ✓</i>;
  if (!complete) return <i className="al-prize is-dim">★{stars}</i>;
  return (
    <button
      type="button"
      className="al-prize is-claim"
      onClick={(event) => {
        event.stopPropagation();
        onClaim(set, event.currentTarget.getBoundingClientRect());
      }}
    >
      {tr("Nhận")} ★{stars}
    </button>
  );
}

/** On the sheet of an album card not owned yet: the lock, and Đổi with its price in stars. */
export function ExchangeBox({ id, onAsk }: { id: string; onAsk: (id: string) => void }) {
  return (
    <section className="cv-lockbox al-trade">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="4.5" y="10" width="15" height="11" rx="2.4" fill="currentColor" />
      </svg>
      <b>{tr("Chưa có lá này")}</b>
      <button type="button" className="al-trade-btn" onClick={() => onAsk(id)}>
        {tr("Đổi")} <i>★{exchangePrice(id)}</i>
      </button>
    </section>
  );
}

/** Đổi sao lấy lá, asked once more: the card, its price, the stars before and after (owner, 21/10). */
export function ExchangeAsk({ id, albums, onCancel, onConfirm }: { id: string; albums: Album[]; onCancel: () => void; onConfirm: () => void }) {
  const stars = useStars();
  const price = exchangePrice(id);
  const tier = rarityOf(id);
  const short = stars < price;
  const at = where(id, albums);
  return (
    <div className="al-ask-back" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="al-ask" role="dialog" aria-label={tr("Đổi lá")}>
        <h3>{tr("Đổi lá")}</h3>
        <div className="al-ask-card">
          <span className="al-ask-pic">
            <AlbumPic id={id} />
          </span>
          <div className="al-ask-info">
            <b>{tr(cardName(id))}</b>
            <small>
              {at.no ? formatNo(at.no) : ""} · {tr(at.album)}
            </small>
            <span className={`al-rarity is-${tier}`}>{tier}</span>
          </div>
        </div>
        <div className="al-ask-row">
          <span>{tr("Giá")}</span>
          <b>★{price}</b>
        </div>
        <div className="al-ask-row">
          <span>{tr("Sao của bạn")}</span>
          {short ? (
            <b>★{stars}</b>
          ) : (
            <b>
              ★{stars} <i>→</i> <em>★{stars - price}</em>
            </b>
          )}
        </div>
        {short ? <p className="al-ask-short">{tr("Không đủ sao.")}</p> : null}
        <div className="al-ask-btns">
          <button type="button" className="al-ask-no" onClick={onCancel}>
            {tr("Huỷ")}
          </button>
          <button type="button" className="al-ask-yes" disabled={short} onClick={onConfirm}>
            {tr("Đổi")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Streaks of light rushing in from all round the screen. */
const STREAKS = Array.from({ length: 12 }, (_, k) => ({ angle: k * 30 + (k % 2 ? 11 : -7), delay: (k * 53) % 190, reach: 56 + ((k * 23) % 26) }));
const DOTS = 8;

/**
 * The card bought (owner, 21/10, after the video): streaks of light rush in, whirl into a ring of sparks, the ring
 * closes into a white card and the card's picture shows through, with Đã nhận lá and OK. The light takes the card's
 * rarity colour.
 */
export function ExchangeShow({ id, onDone }: { id: string; onDone: () => void }) {
  const [step, setStep] = useState<"streak" | "ring" | "card" | "shown">("streak");
  useEffect(() => {
    const timers = [window.setTimeout(() => setStep("ring"), 560), window.setTimeout(() => setStep("card"), 1420), window.setTimeout(() => setStep("shown"), 1880)];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
  return (
    <div className={`al-forge is-${step} tone-${rarityOf(id)}`}>
      <span className="al-forge-streaks" aria-hidden="true">
        {STREAKS.map((streak, k) => (
          <i key={k} style={{ "--a": `${streak.angle}deg`, "--d": `${streak.delay}ms`, "--r": `${streak.reach}vmin` } as CSSProperties} />
        ))}
      </span>
      <span className="al-forge-ring" aria-hidden="true">
        {Array.from({ length: DOTS }, (_, k) => (
          <i key={k} style={{ "--k": k } as CSSProperties} />
        ))}
      </span>
      <span className="al-forge-card">
        <AlbumPic id={id} />
        <i className="al-forge-white" />
      </span>
      <p className="al-forge-text">{tr("Đã nhận lá")}</p>
      <button type="button" className="al-forge-ok" disabled={step !== "shown"} onClick={onDone}>
        OK
      </button>
    </div>
  );
}

/**
 * Tiến độ sưu tập (owner, 21/10, after the video's Card Collection Status): the album's count climbs from what it was
 * to what it is now, a golden light rises under it, then how much of the album that is, and OK.
 */
export function StatShow({ from, to, total, onDone }: { from: number; to: number; total: number; onDone: () => void }) {
  const [shown, setShown] = useState(from);
  const [lit, setLit] = useState(false);
  useEffect(() => {
    let frame = 0;
    const span = Math.min(1200, 320 + 110 * Math.max(1, to - from));
    const wait = window.setTimeout(() => {
      const start = performance.now();
      const tick = () => {
        const u = Math.min(1, (performance.now() - start) / span);
        setShown(Math.round(from + (to - from) * (1 - (1 - u) ** 3)));
        if (u < 1) frame = requestAnimationFrame(tick);
        else setLit(true);
      };
      frame = requestAnimationFrame(tick);
    }, 420);
    return () => {
      window.clearTimeout(wait);
      cancelAnimationFrame(frame);
    };
  }, [from, to]);
  return (
    <div className={`al-stat-back${lit ? " is-lit" : ""}`}>
      <div className="al-stat">
        <span className="al-stat-tag">{tr("Tiến độ sưu tập")}</span>
        <b className="al-stat-num">
          {shown}/{total}
        </b>
        <i className="al-stat-swoosh" aria-hidden="true" />
        <p className="al-stat-pct">{to >= total ? tr("Hoàn thành album!") : `${tr("Đã sưu tập")} ${Math.floor((to / total) * 100)}%`}</p>
        <button type="button" className="al-stat-ok" disabled={!lit} onClick={onDone}>
          OK
        </button>
      </div>
    </div>
  );
}

/**
 * The sets of a linked card (owner, 21/10): the card large, then each of its sets with its name, its stars at the top
 * right and its cards with their album and No.; what is missing is dimmed, the stars too until the set is complete,
 * then Nhận. Xem opens the card's sheet, and so does tapping any card of a set; Đổi buys the card when not owned.
 */
export function SetPanel({
  opened,
  owned,
  claimed,
  sets,
  albums,
  onView,
  onAsk,
  onClaim,
  onClose,
}: {
  opened: Opened;
  owned: Set<string>;
  claimed: Set<string>;
  sets: CardSet[];
  albums: Album[];
  onView: (id: string) => void;
  onAsk: (id: string) => void;
  onClaim: (set: CardSet, at: DOMRect) => void;
  onClose: () => void;
}) {
  const { id, from } = opened;
  const self = where(id, albums);
  // The panel grows out of the card that was tapped.
  const origin = { "--from-x": `${from.left + from.width / 2 - window.innerWidth / 2}px`, "--from-y": `${from.top + from.height / 2 - window.innerHeight / 2}px` } as CSSProperties;
  return (
    <div className="al-panel-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="al-panel" role="dialog" aria-label={tr(cardName(id))} style={origin}>
        <button type="button" className="msheet-x" aria-label="Đóng" onClick={onClose}>
          ✕
        </button>
        <div className="al-panel-top">
          <span className="al-panel-pic">
            <AlbumPic id={id} missing={!owned.has(id)} />
          </span>
          <div className="al-panel-info">
            <h3>{tr(cardName(id))}</h3>
            <small>
              {self.no ? formatNo(self.no) : ""} · {tr(self.album)}
            </small>
            <span className="al-panel-btns">
              <button type="button" className="al-panel-view" onClick={() => onView(id)}>
                {tr("Xem")}
              </button>
              {owned.has(id) ? null : (
                <button type="button" className="al-panel-view is-trade" onClick={() => onAsk(id)}>
                  {tr("Đổi")} <i>★{exchangePrice(id)}</i>
                </button>
              )}
            </span>
          </div>
        </div>
        {setsOf(id, sets).map((set) => {
          const complete = set.ids.every((card) => owned.has(card));
          return (
            <section key={set.id} className={`al-panel-set${complete ? " is-done" : ""}`}>
              <header>
                <b>{tr(set.name)}</b>
                <SetPrize set={set} complete={complete} claimed={claimed.has(set.id)} onClaim={onClaim} />
              </header>
              <div className="al-panel-cards">
                {set.ids.map((card) => {
                  const at = where(card, albums);
                  return (
                    <button
                      key={card}
                      type="button"
                      data-ui="soft"
                      className={`al-panel-card${owned.has(card) ? "" : " is-missing"}${card === id ? " is-self" : ""}`}
                      aria-label={tr(cardName(card))}
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
