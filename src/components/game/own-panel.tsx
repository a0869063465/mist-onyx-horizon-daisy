import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { albumOf, ALBUM_GOTO_KEY } from "@/lib/collection";
import { copyCap } from "@/lib/catalog";
import { tr } from "@/lib/i18n";
import { ownedCopiesOf } from "@/lib/owned-cards";
import { PACK, packPool } from "@/lib/shop";

/**
 * Tab "Sở hữu" of a card's sheet (chủ game 15/11), on the right of the card: how many copies are owned, and where to
 * go from here. "Nhận thêm lá này" hides the rest and shows the packs it comes from and the NPCs that can be fought
 * for it (no NPC exists yet, so that part says "Sắp có"), with a back button.
 */
export function OwnPanel({ id, onDeck }: { id: string; /** On the deck builder itself: "Đến deck" only closes the sheet. */ onDeck?: () => void }) {
  const go = useNavigate();
  const [view, setView] = useState<"main" | "get">("main");
  const have = ownedCopiesOf(id);
  const cap = copyCap(id);
  const album = albumOf(id);
  const inPack = packPool().some((entry) => entry.id === id);

  if (view === "get") {
    return (
      <div className="own-panel">
        <h3 className="own-title">{tr("Nhận thêm lá này")}</h3>
        <p className="own-label">{tr("Gói quay")}</p>
        <ul className="own-list">{inPack ? <li>{tr(PACK.name)}</li> : <li className="is-none">{tr("Không có trong gói nào")}</li>}</ul>
        <p className="own-label">{tr("Đánh NPC")}</p>
        <ul className="own-list">
          <li className="is-none">{tr("Sắp có")}</li>
        </ul>
        <button type="button" className="own-btn is-back" onClick={() => setView("main")}>
          {tr("Trở lại")}
        </button>
      </div>
    );
  }
  return (
    <div className="own-panel">
      <p className="own-count">
        {tr("Sở hữu")}: <b>{have}</b>/{cap} {tr("lá")}
      </p>
      <button type="button" className="own-btn" onClick={() => (onDeck ? onDeck() : go({ to: "/deck" }))}>
        {tr("Đến deck")}
      </button>
      <button
        type="button"
        className="own-btn"
        disabled={!album}
        onClick={() => {
          if (!album) return;
          sessionStorage.setItem(ALBUM_GOTO_KEY, album.id);
          go({ to: "/collection" });
          // Already on the collection: the page is not opened again, so it is told.
          window.dispatchEvent(new Event(ALBUM_GOTO_KEY));
        }}
      >
        {tr("Đến album")}
      </button>
      <button type="button" className="own-btn is-get" onClick={() => setView("get")}>
        {tr("Nhận thêm lá này")}
      </button>
    </div>
  );
}
