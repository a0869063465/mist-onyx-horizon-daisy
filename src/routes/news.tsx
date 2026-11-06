import { createFileRoute, Link } from "@tanstack/react-router";
import { NewsBoard } from "@/components/news-board";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";

export const Route = createFileRoute("/news")({ component: NewsPage });


/**
 * Tin tức (chủ game 31/10), after LoR's: a grid of posts (picture, day, title) under two tabs, MỚI ĐÂY (everything,
 * newest first) and THÔNG TIN BẢN CẬP NHẬT (the update posts); a post opens as a page. The posts are the news of
 * MAILS, the same ones as the Tin tức tab of Hộp thư. The row of Facebook / Instagram / YouTube / X waits for the
 * owner's links.
 */
function NewsPage() {
  useLang();
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
      <NewsBoard />
    </main>
  );
}
