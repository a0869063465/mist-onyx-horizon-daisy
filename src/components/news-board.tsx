import { useState } from "react";
import { artSrc } from "@/lib/catalog";
import { markRead, mailDay, useMail, type MailRow } from "@/lib/mail-box";
import { tr } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";

type Filter = "new" | "update";

/** The grid of posts with its two tabs and the open post, on the Tin tức page and in the Tin tức tab of Hộp thư (chủ game 06/11). */
export function NewsBoard() {
  const rows = useMail().filter((row) => row.kind === "news");
  const [filter, setFilter] = useState<Filter>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = filter === "update" ? rows.filter((row) => row.mail.tag === "update") : rows;
  const open = rows.find((row) => row.mail.id === openId) ?? null;
  const fresh = (list: MailRow[]) => list.filter((row) => !row.read).length;

  return (
    <>
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
    </>
  );
}
