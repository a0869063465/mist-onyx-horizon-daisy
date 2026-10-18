import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { artSrc } from "@/lib/catalog";
import { tr, useLang } from "@/lib/i18n";
import { playTutorial, TUTORIALS, tutorialsDone, type TutorialInfo } from "@/lib/tutorial-list";

export const Route = createFileRoute("/guide")({ component: GuidePage });

/**
 * Hướng dẫn (owner, 18/10): what the Hướng dẫn button on Chọn bộ bài opens, made after LoR's challenge list. One
 * banner per tutorial, the two monsters facing each other, HOÀN THÀNH once it was played to the end. Tapping a
 * banner slides in its panel from the right: name, the two monsters VS, what it teaches, who it is for, Chơi ngay.
 */
function GuidePage() {
  const navigate = useNavigate();
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useLang();

  useEffect(() => {
    setDone(tutorialsDone());
  }, []);

  const shown = TUTORIALS.find((row) => row.key === open) ?? null;

  function start(row: TutorialInfo) {
    sessionStorage.setItem("clash-mode", "tutorial");
    sessionStorage.removeItem("clash-net");
    playTutorial(row.key);
    // The tutorial comes back to this list when it ends or is skipped.
    sessionStorage.setItem("clash-tutorial-from", window.location.pathname);
    void navigate({ to: "/play" });
  }

  return (
    <main className="lor-page">
      <div className="lor-main">
        <header className="lor-head">
          <Link to="/modes" className="lor-stone is-back" aria-label={tr("Trở về")}>
            {"<<"}
          </Link>
          <h1>{tr("Chọn hướng dẫn")}</h1>
          <span className="lor-head-gap" aria-hidden="true" />
        </header>
        <section className="lor-trials">
          {TUTORIALS.map((row) => {
            const finished = done.includes(row.key);
            return (
              <button
                key={row.key}
                type="button"
                className={`lor-trial${finished ? " is-done" : ""}${row.key === open ? " on" : ""}`}
                onClick={() => setOpen(row.key)}
              >
                <span className="lor-trial-art is-left" style={{ backgroundImage: `url(${artSrc(row.left, 1)})` }} />
                <span className="lor-trial-art is-right" style={{ backgroundImage: `url(${artSrc(row.right, 1)})` }} />
                <span className="lor-trial-title">
                  {tr(row.title)}
                  <svg viewBox="0 0 120 10" aria-hidden="true">
                    <path d="M2 3H50l10 6 10-6H118" />
                  </svg>
                </span>
                {finished ? (
                  <span className="lor-trial-done">
                    <i aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M5.5 12.5l4.2 4.2L18.5 7.5" />
                      </svg>
                    </i>
                    <b>{tr("Hoàn thành")}</b>
                  </span>
                ) : null}
              </button>
            );
          })}
        </section>
      </div>
      {shown ? (
        <div className="lor-drawer-back" onClick={(event) => event.target === event.currentTarget && setOpen(null)}>
          <aside className="lor-trial-panel" role="dialog" aria-label={tr(shown.title)}>
            <h2 className="lor-trial-name">{tr(shown.title)}</h2>
            <svg className="lor-flourish" viewBox="0 0 240 20" aria-hidden="true">
              <path d="M3 16h9q4 0 4-4v-2h94M130 10h94v2q0 4 4 4h9" />
              <path d="M110 10l10-7 10 7-10 7z" />
              <circle cx="22" cy="14" r="1.4" />
              <circle cx="218" cy="14" r="1.4" />
            </svg>
            <div className="lor-vs">
              <span className="lor-vs-face" style={{ backgroundImage: `url(${artSrc(shown.left, 1)})` }} />
              <span className="lor-vs-mid">
                <b>VS</b>
                <svg viewBox="0 0 60 14" aria-hidden="true">
                  <path d="M0 11H23l7-7 7 7H60" />
                </svg>
              </span>
              <span className="lor-vs-face" style={{ backgroundImage: `url(${artSrc(shown.right, 1)})` }} />
            </div>
            <p className="lor-trial-text">{tr(shown.text)}</p>
            <div className="lor-trial-level">
              <span>{tr("Độ khó đề nghị cho:")}</span>
              <b>{tr(shown.level)}</b>
            </div>
            <button type="button" className="lor-play" data-ui="confirm" onClick={() => start(shown)}>
              {tr("Chơi ngay")}
            </button>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
