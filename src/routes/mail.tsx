import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlbumPic } from "@/components/collection/album-parts";
import { monsterCard, artSrc } from "@/lib/catalog";
import { rarityOf, rarityTag } from "@/lib/collection";
import { claimAll, claimMail, deletableCount, deleteMail, deleteRead, markRead, mailDay, resetMail, unseenByKind, useMail, type Claimed, type MailRow } from "@/lib/mail-box";
import type { Gift, MailKind } from "@/lib/mails";
import { useAppMode } from "@/lib/app-mode";
import { tr, useLang } from "@/lib/i18n";
import { cardName, useStars } from "@/lib/shop";
import { playReward, playUi } from "@/lib/sfx";

const TABS: Array<{ key: MailKind; label: string; empty: string }> = [
  { key: "mail", label: "Thư", empty: "Chưa có thư." },
  { key: "warn", label: "Báo vi phạm", empty: "Không có báo cáo vi phạm." },
  { key: "gift", label: "Thư quà", empty: "Chưa có thư quà." },
  { key: "news", label: "Tin tức", empty: "Chưa có tin tức." },
];

export const Route = createFileRoute("/mail")({
  validateSearch: (search: Record<string, unknown>): { tab?: MailKind } => ({ tab: TABS.some((one) => one.key === search.tab) ? (search.tab as MailKind) : undefined }),
  component: MailPage,
});

/**
 * Hộp thư (chủ game 31/10), made over after LoR's: four tabs across the top (Thư, Báo vi phạm, Thư quà, Tin tức), the
 * letters as flat rows under them, a letter opens as a page that slides in (sender, day, body, ĐÍNH KÈM with the gifts
 * and a Nhận button), and two square buttons at the bottom: claim all and delete the read ones, of the tab in view.
 */
function MailPage() {
  useLang();
  const mode = useAppMode();
  const stars = useStars();
  const rows = useMail();
  const navigate = Route.useNavigate();
  const { tab = "mail" } = Route.useSearch();
  const [openId, setOpenId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [got, setGot] = useState<(Claimed & { id: string | null }) | null>(null);
  const unseen = unseenByKind(rows);
  const here = rows.filter((row) => row.kind === tab);
  const open = rows.find((row) => row.mail.id === openId) ?? null;
  const owing = here.some((row) => row.owing);
  const sweep = deletableCount(tab);
  const index = TABS.findIndex((one) => one.key === tab);
  const info = TABS[index];

  const pick = (key: MailKind) => {
    if (key === tab) return;
    playUi("select");
    setOpenId(null);
    setGot(null);
    void navigate({ search: { tab: key }, replace: true });
  };

  const claimed = (id: string | null, result: Claimed | null) => {
    if (!result) return;
    playReward("done");
    playReward("coin", 0.14);
    setGot({ ...result, id });
  };

  const show = (row: MailRow) => {
    markRead(row.mail.id);
    setGot(null);
    setOpenId(row.mail.id);
  };

  return (
    <main className="ml" data-tab={tab}>
      <i className="ml-corner is-tl" aria-hidden="true" />
      <i className="ml-corner is-tr" aria-hidden="true" />
      <i className="ml-corner is-bl" aria-hidden="true" />
      <i className="ml-corner is-br" aria-hidden="true" />
      <header className="ml-head">
        <Link to="/" className="ml-back" aria-label={tr("Trở về")} data-sfx onPointerDown={() => playUi("soft")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 5L7.5 12l7 7" />
          </svg>
        </Link>
        <h1>{tr("HỘP THƯ")}</h1>
        <span className="ml-wallet" aria-label={tr("Sao của bạn")}>
          <i aria-hidden="true">★</i>
          <b>{stars}</b>
        </span>
      </header>
      <nav className="ml-tabs" role="tablist" style={{ ["--at" as string]: index }}>
        {TABS.map((one) => (
          <button key={one.key} type="button" role="tab" aria-selected={one.key === tab} aria-label={tr(one.label)} data-kind={one.key} className={one.key === tab ? "on" : ""} onClick={() => pick(one.key)}>
            <TabIcon kind={one.key} />
            <span>{tr(one.label)}</span>
            {unseen[one.key] > 0 ? <em className="ml-badge">{unseen[one.key] > 9 ? "9+" : unseen[one.key]}</em> : null}
          </button>
        ))}
        <i className="ml-ink" aria-hidden="true" />
      </nav>
      <section className="ml-pane" key={tab}>
        {here.length === 0 ? (
          <div className="ml-empty">
            <TabIcon kind={tab} />
            <p>{tr(info.empty)}</p>
          </div>
        ) : (
          <ul className={`ml-list${tab === "news" ? " is-news" : ""}`}>
            {here.map((row, order) => (
              <li key={row.mail.id} style={{ ["--i" as string]: order }}>
                <Row row={row} open={openId === row.mail.id} onOpen={() => show(row)} />
              </li>
            ))}
          </ul>
        )}
      </section>
      {tab !== "news" || mode === "publisher" ? (
        <footer className="ml-foot">
          {mode === "publisher" ? (
            <button type="button" className="ml-dev" onClick={() => resetMail()}>
              {tr("Đặt lại thư")}
            </button>
          ) : (
            <span />
          )}
          {tab !== "news" ? (
            <>
              <button
                type="button"
                className={`ml-act${owing ? " is-call" : ""}`}
                disabled={!owing}
                aria-label={tr("Nhận tất cả")}
                onClick={() => {
                  playUi("confirm");
                  claimed(null, claimAll(tab));
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </button>
              <button type="button" className="ml-act" disabled={sweep === 0} aria-label={tr("Xoá thư đã đọc")} onClick={() => setAsking(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 7h14M9.5 7V5h5v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />
                </svg>
              </button>
            </>
          ) : null}
        </footer>
      ) : null}
      {open ? <Detail row={open} onClose={() => setOpenId(null)} onClaim={() => claimed(open.mail.id, claimMail(open.mail.id))} onDelete={() => deleteMail(open.mail.id) && setOpenId(null)} /> : null}
      {got ? <Reward got={got} onClose={() => setGot(null)} /> : null}
      {asking ? (
        <div className="ml-shade" role="dialog">
          <div className="ml-ask">
            <p>{tr("Xoá {n} thư đã đọc?").replace("{n}", String(sweep))}</p>
            <div>
              <button type="button" onClick={() => setAsking(false)}>
                {tr("Huỷ")}
              </button>
              <button
                type="button"
                className="is-go"
                onClick={() => {
                  deleteRead(tab);
                  setAsking(false);
                }}
              >
                {tr("Xoá")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Row({ row, open, onOpen }: { row: MailRow; open: boolean; onOpen: () => void }) {
  const fresh = !row.read;
  const news = row.kind === "news";
  return (
    <button type="button" className={`ml-row is-${row.kind}${fresh ? " is-new" : ""}${open ? " is-open" : ""}`} onPointerDown={() => playUi("select")} onClick={onOpen}>
      {news ? (
        <span className="ml-thumb" style={{ backgroundImage: `url(${artSrc(row.mail.cover ?? "khong-lo-mot-mat")})` }} aria-hidden="true">
          <b>{mailDay(row)}</b>
        </span>
      ) : (
        <span className="ml-seal" aria-hidden="true">
          <Seal kind={row.kind} fresh={fresh} />
        </span>
      )}
      <span className="ml-txt">
        <b>{tr(row.mail.title)}</b>
        <i>
          {news ? tr(row.mail.tag === "update" ? "Thông tin bản cập nhật" : "Mới đây") : `${mailDay(row)} · ${tr("còn {n} ngày").replace("{n}", String(row.left))}`}
        </i>
      </span>
      {row.owing ? <span className="ml-clip" aria-label={tr("Quà")}><GiftGlyph /></span> : null}
      {row.kind === "warn" ? <em className="ml-tag">{tr("VI PHẠM")}</em> : null}
      {fresh ? <span className="ml-dot" aria-hidden="true" /> : null}
    </button>
  );
}

function Detail({ row, onClose, onClaim, onDelete }: { row: MailRow; onClose: () => void; onClaim: () => void; onDelete: () => void }) {
  const gifts = row.mail.gifts ?? [];
  const news = row.kind === "news";
  return (
    <div className={`ml-detail is-${row.kind}`} role="dialog" aria-label={row.mail.title}>
      <header className="ml-dhead">
        <button type="button" className="ml-back" aria-label={tr("Trở về")} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 5L7.5 12l7 7" />
          </svg>
        </button>
        <span>{tr(TABS.find((one) => one.key === row.kind)?.label ?? "Thư")}</span>
      </header>
      <div className="ml-dbody">
        {news ? <div className="ml-hero" style={{ backgroundImage: `url(${artSrc(row.mail.cover ?? "khong-lo-mot-mat")})` }} /> : null}
        {row.kind === "warn" ? (
          <p className="ml-warn">
            <TabIcon kind="warn" />
            {tr("Thông báo vi phạm")}
          </p>
        ) : null}
        <h2>{tr(row.mail.title)}</h2>
        <p className="ml-meta">
          {tr("Người gửi")}: <b>{tr(row.mail.from)}</b>
        </p>
        <p className="ml-meta">
          {tr("Ngày")}: <b>{mailDay(row)}</b>
          {news ? null : ` (${tr("tự động xoá sau {n} ngày").replace("{n}", String(row.left))})`}
        </p>
        <p className="ml-body">{tr(row.mail.body)}</p>
        {gifts.length > 0 ? (
          <>
            <h3>{tr("ĐÍNH KÈM")}:</h3>
            <div className="ml-slots">
              {gifts.map((gift, index) => (
                <Slot key={index} gift={gift} done={row.claimed} />
              ))}
            </div>
          </>
        ) : null}
      </div>
      {news ? null : (
        <footer className="ml-dfoot">
          {gifts.length > 0 ? (
            row.claimed ? (
              <span className="ml-claimed">✓ {tr("ĐÃ NHẬN")}</span>
            ) : (
              <button type="button" className="ml-claim" onClick={onClaim}>
                <span>{tr("NHẬN")}</span>
              </button>
            )
          ) : (
            <span />
          )}
          <button type="button" className="ml-del" disabled={row.owing} onClick={onDelete}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14M9.5 7V5h5v2M7 7l1 12h8l1-12" />
            </svg>
            {tr("XOÁ")}
          </button>
        </footer>
      )}
    </div>
  );
}

function Slot({ gift, done }: { gift: Gift; done: boolean }) {
  if (gift.kind === "stars") {
    return (
      <span className={`ml-slot is-stars${done ? " is-done" : ""}`} aria-label={`${gift.n} ${tr("sao")}`}>
        <i aria-hidden="true">★</i>
        <b>{gift.n}</b>
      </span>
    );
  }
  const entry = { id: gift.id, kind: monsterCard(gift.id) ? ("monster" as const) : ("spell" as const) };
  const tier = rarityOf(gift.id);
  const tag = rarityTag(gift.id, tier);
  return (
    <span className={`ml-slot is-card is-${tier}${done ? " is-done" : ""}`} aria-label={cardName(entry)}>
      <AlbumPic id={gift.id} />
      <em className={`al-rarity ${tag.cls}`}>{tag.text}</em>
    </span>
  );
}

/**
 * "BẠN ĐÃ NHẬN ĐƯỢC" (chủ game 31/10, after LoR's): the whole screen for what a claim gave. A band with a starfield and
 * dashed rings turning on both sides, each gift lit in the middle (stars as a gem, a card in its frame with NEW or the
 * star it gave back), a tap anywhere goes on.
 */
function Reward({ got, onClose }: { got: Claimed; onClose: () => void }) {
  const items: Array<{ key: string; gift: Gift; note: string }> = [];
  if (got.stars > 0) items.push({ key: "stars", gift: { kind: "stars", n: got.stars }, note: `${tr("SAO")} ×${got.stars}` });
  got.cards.forEach((card, index) => items.push({ key: `c${index}`, gift: { kind: "card", id: card.id }, note: card.fresh ? tr("MỚI") : tr("Đã có · hoàn +1★") }));
  return (
    <div className="ml-got" role="dialog" aria-label={tr("BẠN ĐÃ NHẬN ĐƯỢC")} onClick={onClose}>
      <h2>{tr("BẠN ĐÃ NHẬN ĐƯỢC")}</h2>
      <div className="ml-band">
        <span className="ml-ring is-a" aria-hidden="true" />
        <span className="ml-ring is-b" aria-hidden="true" />
        <span className="ml-wave" aria-hidden="true" />
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} className="ml-mote" style={{ ["--x" as string]: `${(i * 37 + 9) % 100}%`, ["--d" as string]: `${(i % 5) * 0.7}s`, ["--s" as string]: `${2 + (i % 3)}px` }} aria-hidden="true" />
        ))}
        <div className="ml-prizes">
          {items.map((item, order) => (
            <figure key={item.key} className="ml-prize" style={{ ["--o" as string]: order }}>
              <Slot gift={item.gift} done={false} />
              <figcaption>
                {item.gift.kind === "card" ? <b>{cardName({ id: item.gift.id, kind: monsterCard(item.gift.id) ? "monster" : "spell" })}</b> : null}
                <span>{item.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <p className="ml-go">{tr("Nhấp vào màn hình để tiếp tục")}</p>
    </div>
  );
}

function TabIcon({ kind }: { kind: MailKind }) {
  return (
    <svg className="ml-ico" viewBox="0 0 32 32" aria-hidden="true">
      {kind === "mail" ? (
        <>
          <rect x="4.5" y="8" width="23" height="16" rx="2.2" />
          <path d="M5.5 10l10.5 8 10.5-8" />
        </>
      ) : kind === "warn" ? (
        <>
          <path d="M16 5.5l12 20.5H4z" />
          <path d="M16 13v6.2" />
          <circle cx="16" cy="22.2" r="0.9" className="fill" />
        </>
      ) : kind === "gift" ? (
        <>
          <rect x="5.5" y="12" width="21" height="14" rx="1.6" />
          <path d="M4.5 12h23M16 12v14M16 12c-2-5.5-8.5-5-6.5-1.2M16 12c2-5.5 8.5-5 6.5-1.2" />
        </>
      ) : (
        <>
          <rect x="6.5" y="5.5" width="19" height="22" rx="2" />
          <path d="M12 5.5V4h8v1.5M11 13h10M11 17.5h10M11 22h6" />
        </>
      )}
    </svg>
  );
}

/** The envelope in a row: sealed when not read, open when read; a warning triangle or a gift for those. */
function Seal({ kind, fresh }: { kind: MailKind; fresh: boolean }) {
  if (kind === "warn") return <TabIcon kind="warn" />;
  if (kind === "gift") return <TabIcon kind="gift" />;
  return (
    <svg className="ml-ico" viewBox="0 0 32 32">
      {fresh ? (
        <>
          <rect x="4.5" y="8" width="23" height="16" rx="2.2" />
          <path d="M5.5 10l10.5 8 10.5-8" />
          <circle cx="16" cy="18" r="2.6" className="fill" />
        </>
      ) : (
        <>
          <path d="M4.5 13.5L16 5.5l11.5 8V24a2.2 2.2 0 01-2.2 2.2H6.7A2.2 2.2 0 014.5 24z" />
          <path d="M5.5 14.5L16 21.5l10.5-7" />
        </>
      )}
    </svg>
  );
}

function GiftGlyph() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="5.5" y="12" width="21" height="14" rx="1.6" />
      <path d="M4.5 12h23M16 12v14M16 12c-2-5.5-8.5-5-6.5-1.2M16 12c2-5.5 8.5-5 6.5-1.2" />
    </svg>
  );
}
