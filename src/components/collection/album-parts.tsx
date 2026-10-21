import type { Ref } from "react";
import { artSrc, monsterCard, spellSrc } from "@/lib/catalog";
import { rarityOf, type Album } from "@/lib/collection";
import { tr } from "@/lib/i18n";

/** A card in an album: its art in the gold frame of Đổi hình nền, no figures, no name; grey while not owned. */
export function AlbumPic({ id, missing = false }: { id: string; missing?: boolean }) {
  const art = monsterCard(id) ? artSrc(id, 1) : spellSrc(id);
  return (
    <span className={`al-pic${missing ? " is-missing" : ""}`}>
      <span className="al-pic-art" style={{ backgroundImage: `url(${art})` }} />
      <img className="al-pic-frame" src="/ui/cover-frame.png" alt="" draggable={false} />
    </span>
  );
}

/** An album's cover: the environment card's picture in a binder with a ringed spine; gold once complete. */
export function AlbumCover({ album, done, className = "", ref }: { album: Album; done: boolean; className?: string; ref?: Ref<HTMLSpanElement> }) {
  return (
    <span ref={ref} className={`al-cover${done ? " is-done" : ""}${className ? ` ${className}` : ""}`}>
      <span className="al-cover-art" style={{ backgroundImage: `url(${album.cover})` }} />
    </span>
  );
}

export function CardsIcon() {
  return (
    <svg className="al-cards-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="11" height="15" rx="1.6" />
      <path d="M9 3.5h9.4a1.6 1.6 0 0 1 1.6 1.6v12.4" />
    </svg>
  );
}

/** A card's rarity on the top right corner of its picture on the sheet, in the collection (owner, 21/10). */
export function RarityBadge({ id }: { id: string }) {
  const tier = rarityOf(id);
  return <b className={`al-rarity msheet-rarity is-${tier}`}>{tier}</b>;
}

/** On the sheet of a card got from a pack or bought: Giám định, which does nothing yet (owner, 21/10). */
export function AppraiseBox() {
  return (
    <section className="cv-lockbox al-appraise">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M15 15l5 5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
      <b>{tr("Giám định")}</b>
    </section>
  );
}
