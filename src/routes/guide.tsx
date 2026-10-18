import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { artSrc } from "@/lib/catalog";
import { tr, useLang } from "@/lib/i18n";
import { playTutorial, TUTORIALS, tutorialsDone, type TutorialInfo } from "@/lib/tutorial-list";

export const Route = createFileRoute("/guide")({ component: GuidePage });

/**
 * Hướng dẫn (owner, 18/10): what the Hướng dẫn button on Chọn bộ bài opens, made after LoR's challenge list. One
 * banner per tutorial with its monster, HOÀN THÀNH once it was played to the end. Tapping a banner starts it.
 */
function GuidePage() {
  const navigate = useNavigate();
  const [done, setDone] = useState<string[]>([]);
  useLang();

  useEffect(() => {
    setDone(tutorialsDone());
  }, []);

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
                className={`lor-trial${finished ? " is-done" : ""}`}
                data-ui="confirm"
                onClick={() => start(row)}
              >
                <span className="lor-trial-art" style={{ backgroundImage: `url(${artSrc(row.art, 1)})` }} />
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
    </main>
  );
}
