import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { artSrc } from "@/lib/catalog";
import { markRead, mailDay, useMail, type MailRow } from "@/lib/mail-box";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";

export const Route = createFileRoute("/news")({ component: NewsPage });

type Filter = "new" | "update";

/**
 * Tin tức (chủ game 31/10), after LoR's: a grid of posts (picture, day, title) under two tabs, MỚI ĐÂY (everything,
 * newest first) and THÔNG TIN BẢN CẬP NHẬT (the update posts); a post opens as a page. The posts are the news of
 * MAILS, the same ones as the Tin tức tab of Hộp thư. The row of Facebook / Instagram / YouTube / X waits for the
 * owner's links.
 */
function NewsPage() {
  useLang();
  const rows = useMail().filter((row) => row.kind === "news");
  const [filter, setFilter] = useState<Filter>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = filter === "update" ? rows.filter((row) => row.mail.tag === "update") : rows;
  const open = rows.find((row) => row.mail.id === openId) ?? null;
  const fresh = (list: MailRow[]) => list.filter((row) => !row.read).length;

  return (
    <main className="ml nw" data-tab="news">
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
        <h1>{tr("TIN TỨC")}</h1>
      </header>
      <nav className="ml-tabs nw-tabs" role="tablist" style={{ ["--at" as string]: filter === "new" ? 0 : 1 }}>
        <button type="button" role="tab" aria-selected={filter === "new"} className={filter === "new" ? "on" : ""} onClick={() => { playUi("select"); setFilter("new"); }}>
          <span>{tr("MỚI ĐÂY")}</span>
          {fresh(rows) > 0 ? <em className="ml-badge">{fresh(rows)}</em> : null}
        </button>
        <button type="button" role="tab" aria-selected={filter === "update"} className={filter === "update" ? "on" : ""} onClick={() => { playUi("select"); setFilter("update"); }}>
          <span>{tr("THÔNG TIN BẢN CẬP NHẬT")}</span>
          {fresh(rows.filter((row) => row.mail.tag === "update")) > 0 ? <em className="ml-badge">{fresh(rows.filter((row) => row.mail.tag === "update"))}</em> : null}
        </button>
        <i className="ml-ink" aria-hidden="true" />
      </nav>
      <section className="ml-pane" key={filter}>
        {shown.length === 0 ? (
          <div className="ml-empty">
            <p>{tr("Chưa có tin tức.")}</p>
          </div>
        ) : (
          <ul className="nw-grid">
            {shown.map((row, order) => (
              <li key={row.mail.id} style={{ ["--i" as string]: order }}>
                <button
                  type="button"
                  className={`nw-card${row.read ? "" : " is-new"}`}
                  onPointerDown={() => playUi("select")}
                  onClick={() => {
                    markRead(row.mail.id);
                    setOpenId(row.mail.id);
                  }}
                >
                  <span className="nw-pic" style={{ backgroundImage: `url(${artSrc(row.mail.cover ?? "khong-lo-mot-mat")})` }}>
                    <b>{mailDay(row)}</b>
                    {row.read ? null : <em>{tr("MỚI")}</em>}
                  </span>
                  <span className="nw-title">{tr(row.mail.title)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {open ? (
        <div className="ml-detail is-news" role="dialog" aria-label={open.mail.title}>
          <header className="ml-dhead">
            <button type="button" className="ml-back" aria-label={tr("Trở về")} onClick={() => setOpenId(null)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.5 5L7.5 12l7 7" />
              </svg>
            </button>
            <span>{tr("TIN TỨC")}</span>
          </header>
          <div className="ml-dbody">
            <div className="ml-hero" style={{ backgroundImage: `url(${artSrc(open.mail.cover ?? "khong-lo-mot-mat")})` }} />
            <h2>{tr(open.mail.title)}</h2>
            <p className="ml-meta">
              {tr("Ngày")}: <b>{mailDay(open)}</b>
            </p>
            <p className="ml-body">{tr(open.mail.body)}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
