import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlbumPic } from "@/components/collection/album-parts";
import { rarityOf, rarityTag } from "@/lib/collection";
import { monsterCard } from "@/lib/catalog";
import { formatDay, claimAll, claimMail, deletableCount, deleteMail, deleteRead, markRead, resetMail, useMail, type Claimed, type MailRow } from "@/lib/mail-box";
import type { Gift } from "@/lib/mails";
import { useAppMode } from "@/lib/app-mode";
import { tr, useLang } from "@/lib/i18n";
import { cardName } from "@/lib/shop";
import { playReward, playUi } from "@/lib/sfx";

export const Route = createFileRoute("/mail")({ component: MailPage });

/**
 * Thư (chủ game 31/10), from the main menu: the list of letters across the screen (the look of Lục Thần's mailbox,
 * stood up for a phone), a letter opens in a sheet over it (the look of LoR's: sender, date, body, ĐÍNH KÈM with the
 * gifts and a Nhận button), and two buttons at the bottom as in LoR: claim all, delete the read ones.
 */
function MailPage() {
  useLang();
  const mode = useAppMode();
  const rows = useMail();
  const [openId, setOpenId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [got, setGot] = useState<(Claimed & { id: string | null }) | null>(null);
  const open = rows.find((row) => row.mail.id === openId) ?? null;
  const owing = rows.some((row) => row.owing);
  const sweep = deletableCount();

  const show = (id: string | null, result: Claimed | null) => {
    if (!result) return;
    playReward("done");
    playReward("coin", 0.12);
    setGot({ ...result, id });
    window.setTimeout(() => setGot((now) => (now === null ? null : now.id === id && now.stars === result.stars ? null : now)), 2600);
  };

  return (
    <main className="ml">
      <header className="ml-head">
        <Link to="/" className="ml-back" aria-label={tr("Trở về")} data-sfx onPointerDown={() => playUi("soft")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1>{tr("HỘP THƯ")}</h1>
      </header>
      <ul className="ml-list">
        {rows.length === 0 ? <li className="ml-empty">{tr("Chưa có thư.")}</li> : null}
        {rows.map((row) => (
          <li key={row.mail.id}>
            <button
              type="button"
              className={`ml-card${row.read ? "" : " is-new"}${row.owing ? " is-gift" : ""}${open?.mail.id === row.mail.id ? " is-open" : ""}`}
              onPointerDown={() => playUi("select")}
              onClick={() => {
                markRead(row.mail.id);
                setOpenId(row.mail.id);
              }}
            >
              <span className="ml-ico" aria-hidden="true">
                {row.owing ? <GiftIcon /> : <MailIcon />}
              </span>
              <span className="ml-txt">
                <b>{tr(row.mail.title)}</b>
                <i>
                  {tr(row.mail.from)} · {formatDay(row.got)}
                </i>
              </span>
              {row.owing ? <em className="ml-tag">{tr("Quà")}</em> : row.mail.gifts?.length ? <em className="ml-tag is-done">✓</em> : null}
              {!row.read ? <span className="ml-dot" aria-hidden="true" /> : null}
            </button>
          </li>
        ))}
      </ul>
      <footer className="ml-foot">
        {mode === "publisher" ? (
          <button type="button" className="ml-dev" onClick={() => resetMail()}>
            {tr("Đặt lại thư")}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={`ml-act${owing ? " is-call" : ""}`}
          disabled={!owing}
          aria-label={tr("Nhận tất cả")}
          onClick={() => {
            playUi("confirm");
            show(null, claimAll());
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
        <button type="button" className="ml-act" disabled={sweep === 0} aria-label={tr("Xoá thư đã đọc")} onClick={() => setAsking(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />
          </svg>
        </button>
      </footer>
      {open ? <Sheet row={open} got={got?.id === open.mail.id ? got : null} onClose={() => setOpenId(null)} onClaim={(id) => show(id, claimMail(id))} onDelete={() => deleteMail(open.mail.id) && setOpenId(null)} /> : null}
      {got && got.id === null ? <Result got={got} /> : null}
      {asking ? (
        <div className="ml-back-shade" role="dialog">
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
                  deleteRead();
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

function Sheet({ row, got, onClose, onClaim, onDelete }: { row: MailRow; got: Claimed | null; onClose: () => void; onClaim: (id: string) => void; onDelete: () => void }) {
  const gifts = row.mail.gifts ?? [];
  return (
    <div className="ml-back-shade" onClick={onClose}>
      <section className="ml-sheet" role="dialog" aria-label={row.mail.title} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ml-x" aria-label={tr("Đóng")} onClick={onClose}>
          ✕
        </button>
        <h2>{tr(row.mail.title)}</h2>
        <p className="ml-meta">
          {tr("Người gửi")}: <b>{tr(row.mail.from)}</b>
        </p>
        <p className="ml-meta">
          {tr("Ngày")}: <b>{formatDay(row.got)}</b> ({tr("tự động xoá sau {n} ngày").replace("{n}", String(row.left))})
        </p>
        <p className="ml-body">{tr(row.mail.body)}</p>
        {gifts.length > 0 ? (
          <>
            <h3>{tr("ĐÍNH KÈM")}:</h3>
            <div className="ml-gifts">
              {gifts.map((gift, index) => (
                <GiftTile key={index} gift={gift} done={row.claimed} />
              ))}
            </div>
          </>
        ) : null}
        {got ? <Result got={got} inline /> : null}
        <div className="ml-btns">
          {gifts.length > 0 ? (
            row.claimed ? (
              <span className="ml-claimed">✓ {tr("ĐÃ NHẬN")}</span>
            ) : (
              <button type="button" className="ml-claim" onClick={() => onClaim(row.mail.id)}>
                {tr("NHẬN")}
              </button>
            )
          ) : (
            <span />
          )}
          <button type="button" className="ml-del" disabled={row.owing} onClick={onDelete}>
            {tr("XOÁ")}
          </button>
        </div>
      </section>
    </div>
  );
}

function GiftTile({ gift, done }: { gift: Gift; done: boolean }) {
  if (gift.kind === "stars") {
    return (
      <span className={`ml-gift is-stars${done ? " is-done" : ""}`} aria-label={`${gift.n} ${tr("sao")}`}>
        <i aria-hidden="true">★</i>
        <b>{gift.n}</b>
      </span>
    );
  }
  const entry = { id: gift.id, kind: monsterCard(gift.id) ? ("monster" as const) : ("spell" as const) };
  const tag = rarityTag(gift.id, rarityOf(gift.id));
  return (
    <span className={`ml-gift is-card${done ? " is-done" : ""}`} aria-label={cardName(entry)}>
      <AlbumPic id={gift.id} />
      <em className={`al-rarity ${tag.cls}`}>{tag.text}</em>
    </span>
  );
}

/** What a claim gave: stars flying up, and for each card whether it is new or gave 1 star back. */
function Result({ got, inline = false }: { got: Claimed; inline?: boolean }) {
  return (
    <div className={`ml-result${inline ? " is-inline" : ""}`} aria-live="polite">
      {got.stars + got.refund > 0 ? <b className="ml-plus">+{got.stars + got.refund}★</b> : null}
      {got.cards.map((card, index) => (
        <span key={index}>
          {cardName({ id: card.id, kind: monsterCard(card.id) ? "monster" : "spell" })} · {card.fresh ? tr("MỚI") : "+1★"}
        </span>
      ))}
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7.5l8 6 8-6" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M3 9h18M12 9v11M12 9c-1.5-4-6-4-5 0M12 9c1.5-4 6-4 5 0" />
    </svg>
  );
}
