import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { GlyphDefs } from "@/components/game/monster-sheet";
import { PackOpening } from "@/components/shop/pack-opening";
import { PackCards, RatePanel } from "@/components/shop/shop-panels";
import { useAppMode } from "@/lib/app-mode";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";
import { addStars, BUNDLE_PRICE, BUNDLE_SIZE, buyPacks, clearOwned, PACK, PACK_PRICE, useStars, type PackEntry, type Purchase } from "@/lib/shop";

export const Route = createFileRoute("/shop")({ component: ShopPage });

/** Stars the publisher's test button adds: enough for 10 packs. */
const TEST_STARS = BUNDLE_PRICE;

/**
 * Cửa hàng (owner's reference video, 19/10): the packs on sale; a pack's page with its art, Tỉ lệ, Lá trong gói
 * and the buy buttons (1 pack, or 10 with a UR for sure); buying asks first, then the packs are opened.
 * Only the publisher can come in for now (owner, 19/10: guests get it once stars can be earned), with test tools
 * to add stars and to forget the cards drawn.
 */
function ShopPage() {
  useLang();
  const mode = useAppMode();
  const stars = useStars();
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<"list" | "pack">("list");
  const [panel, setPanel] = useState<"rates" | "cards" | null>(null);
  const [asking, setAsking] = useState<1 | 10 | null>(null);
  const [opening, setOpening] = useState<Purchase | null>(null);
  const [sheet, setSheet] = useState<PackEntry | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => setBooted(true), []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!booted) return <main className="shop" />;
  if (mode !== "publisher") {
    return (
      <main className="shop is-shut">
        <header className="shop-head">
          <Link to="/" className="shop-back" aria-label={tr("Trở về")}>
            {"<<"}
          </Link>
          <h1>{tr("Cửa hàng")}</h1>
        </header>
        <p className="shop-shut">{tr("Cửa hàng chưa mở.")}</p>
      </main>
    );
  }

  function buy(count: 1 | 10) {
    const done = buyPacks(count);
    setAsking(null);
    if (!done) {
      setNotice(tr("Không đủ sao."));
      return;
    }
    playUi("confirm");
    setOpening(done);
  }

  return (
    <main className="shop">
      <GlyphDefs />
      <header className="shop-head">
        {view === "pack" ? (
          <button type="button" className="shop-back" aria-label={tr("Trở về")} onClick={() => setView("list")}>
            {"<<"}
          </button>
        ) : (
          <Link to="/" className="shop-back" aria-label={tr("Trở về")}>
            {"<<"}
          </Link>
        )}
        <h1>{view === "pack" ? tr(PACK.name) : tr("Cửa hàng")}</h1>
        <span className="shop-wallet" aria-label={tr("Sao của bạn")}>
          <i aria-hidden="true">★</i>
          <b>{stars}</b>
        </span>
      </header>

      <div className="shop-body">
        {view === "list" ? (
          <section className="shop-list">
            <h2 className="shop-section">{tr("Gói bài")}</h2>
            <div className="shop-tiles">
              <button
                type="button"
                className="shop-tile"
                onClick={() => {
                  playUi("select");
                  setView("pack");
                }}
              >
                <span className="shop-tile-name">{tr(PACK.name)}</span>
                <span className="shop-tile-art">
                  <img src={PACK.art} alt="" draggable={false} />
                </span>
                <span className="shop-tile-price">
                  {tr("1 gói")} <i aria-hidden="true">★</i>
                  {PACK_PRICE}
                </span>
              </button>
            </div>
          </section>
        ) : (
          <section className="shop-pack">
            <div className="shop-hero">
              <div className="shop-hero-art">
                <img src={PACK.art} alt="" draggable={false} />
              </div>
              <div className="shop-hero-text">
                <p>{tr(PACK.blurb)}</p>
                <div className="shop-links">
                  <button type="button" onClick={() => setPanel("rates")}>
                    {tr("Tỉ lệ")} <span aria-hidden="true">›</span>
                  </button>
                  <button type="button" onClick={() => setPanel("cards")}>
                    {tr("Lá trong gói")} <span aria-hidden="true">›</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="shop-buys">
              <button type="button" className="shop-buy" onClick={() => setAsking(1)}>
                <b>
                  <i aria-hidden="true">★</i>
                  {PACK_PRICE}
                </b>
                <small>{tr("1 gói")}</small>
              </button>
              <button type="button" className="shop-buy is-ten" onClick={() => setAsking(10)}>
                <b>
                  <i aria-hidden="true">★</i>
                  {BUNDLE_PRICE}
                </b>
                <small>{tr("10 gói (chắc chắn có 1 UR)")}</small>
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className="shop-tools">
        <span>{tr("Công cụ nhà phát hành")}</span>
        <button
          type="button"
          onClick={() => {
            playUi("select");
            addStars(TEST_STARS);
            setNotice(`+${TEST_STARS}★`);
          }}
        >
          +{TEST_STARS} {tr("sao")}
        </button>
        <button
          type="button"
          onClick={() => {
            playUi("select");
            clearOwned();
            setNotice(tr("Đã xoá lá đã có."));
          }}
        >
          {tr("Xoá lá đã có")}
        </button>
      </footer>

      {notice ? <p className="shop-notice">{notice}</p> : null}
      {asking ? <ConfirmBuy count={asking} stars={stars} onCancel={() => setAsking(null)} onBuy={() => buy(asking)} /> : null}
      {panel === "rates" ? <RatePanel editable onClose={() => setPanel(null)} /> : null}
      {panel === "cards" ? <PackCards onTap={setSheet} onClose={() => setPanel(null)} /> : null}
      {sheet ? (
        sheet.kind === "monster" ? <CardMonsterSheet id={sheet.id} onClose={() => setSheet(null)} /> : <SpellSheet id={sheet.id} onClose={() => setSheet(null)} />
      ) : null}
      {opening ? <PackOpening purchase={opening} onDone={() => setOpening(null)} /> : null}
    </main>
  );
}

/** Xác nhận mua: what it costs and the stars before and after. */
function ConfirmBuy({ count, stars, onCancel, onBuy }: { count: 1 | 10; stars: number; onCancel: () => void; onBuy: () => void }) {
  const price = count === BUNDLE_SIZE ? BUNDLE_PRICE : PACK_PRICE;
  const short = stars < price;
  return (
    <div className="shop-modal-back" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="shop-modal" role="dialog" aria-label={tr("Xác nhận mua")}>
        <h3>{tr("Xác nhận mua")}</h3>
        <p>
          {tr("Dùng")} <b>{price}★</b> {tr("để mua")} {count} {tr(PACK.name)}?
        </p>
        <div className="shop-modal-stars">
          <span>{tr("Sao của bạn")}</span>
          <b>
            {stars} → {short ? "—" : stars - price}
          </b>
        </div>
        {short ? <p className="shop-short">{tr("Không đủ sao.")}</p> : null}
        <div className="shop-modal-acts">
          <button type="button" className="shop-soft" onClick={onCancel}>
            {tr("Huỷ")}
          </button>
          <button type="button" className="shop-main" disabled={short} onClick={onBuy}>
            {tr("Mua")}
          </button>
        </div>
      </section>
    </div>
  );
}
