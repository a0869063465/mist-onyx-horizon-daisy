import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CardVault } from "@/components/collection/card-vault";
import { GlyphDefs } from "@/components/game/monster-sheet";
import { tr, useLang } from "@/lib/i18n";
import { useStars } from "@/lib/shop";

export const Route = createFileRoute("/collection")({ component: CollectionPage });

/**
 * Bộ sưu tập (owner, 21/10), from the main menu: two tabs, Kho bài first, then Album sưu tập. The cards owned are
 * read on this phone after the first render, so the page the server sent matches.
 */
function CollectionPage() {
  useLang();
  const stars = useStars();
  const [tab, setTab] = useState<"vault" | "album">("vault");
  const [booted, setBooted] = useState(false);
  useEffect(() => setBooted(true), []);

  return (
    <main className="cv">
      <GlyphDefs />
      <header className="cv-head">
        <Link to="/" className="cv-back" aria-label={tr("Trở về")}>
          {"<<"}
        </Link>
        <h1>{tr("Bộ sưu tập")}</h1>
        <span className="cv-wallet" aria-label={tr("Sao của bạn")}>
          <i aria-hidden="true">★</i>
          <b>{stars}</b>
        </span>
      </header>
      <nav className="cv-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "vault"} className={tab === "vault" ? "on" : ""} onClick={() => setTab("vault")}>
          {tr("Kho bài")}
        </button>
        <button type="button" role="tab" aria-selected={tab === "album"} className={tab === "album" ? "on" : ""} onClick={() => setTab("album")}>
          {tr("Album sưu tập")}
        </button>
      </nav>
      {booted ? tab === "vault" ? <CardVault /> : <p className="cv-soon">{tr("Album sưu tập có ở đợt sau.")}</p> : null}
    </main>
  );
}
