import { useState, type Ref } from "react";
import { AppraisePanel } from "@/components/collection/appraise-panel";
import { canAppraise } from "@/lib/appraisal";
import { artSrc, monsterCard, spellSrc } from "@/lib/catalog";
import { rarityOf, rarityTag, type Album } from "@/lib/collection";
import { fakeIds } from "@/lib/owned-cards";
import { tr } from "@/lib/i18n";

/** A card in an album: its art in the gold frame of Đổi hình nền, no figures, no name; grey while not owned. */
export function AlbumPic({ id, missing = false, vault = false }: { id: string; missing?: boolean; vault?: boolean }) {
  const art = monsterCard(id) ? artSrc(id, 1) : spellSrc(id);
  // A fake card (the starter deck's cut copy) shows in colour (owner 22/10) but is still not owned.
  const fake = missing && fakeIds([id]).length > 0;
  return (
    <span className={`al-pic${vault ? " is-vault" : ""}${fake ? " is-fake" : missing ? " is-missing" : ""}`}>
      <span className="al-pic-art" style={{ backgroundImage: `url(${art})` }} />
      <img className="al-pic-frame" src={vault ? "/ui/col/card-frame.webp" : "/ui/cover-frame.png"} alt="" draggable={false} />
    </span>
  );
}

/** The books drawn for the shelf (name on the plaque) and for opening (the same without the name); `soon` = no cards yet. */
export const BOOKS = new Set(["nui", "bong-toi", "thao-nguyen", "rung-ram", "dat-da", "bien-sau", "cu-dia-may-moc", "thanh-dia-thien-su", "nui-dung-nham", "vuong-quoc", "phep", "yugi", "joey"]);

/** What the book says on its plaque: the album's name. */
export function albumTitle(_id: string, name: string): string {
  return name;
}

/**
 * An album's cover: one picture of a book (chủ game 08/11). On the shelf it carries its name; the one that flies and
 * swings open (`clean`) is the same book without the name.
 */
export function AlbumCover({ album, done, clean = false, className = "", ref }: { album: Pick<Album, "id" | "name" | "cover">; done: boolean; clean?: boolean; className?: string; ref?: Ref<HTMLSpanElement> }) {
  const src = BOOKS.has(album.id) ? `/ui/col/${clean ? "open" : "shelf"}/${album.id}.webp` : null;
  return (
    <span ref={ref} className={`al-cover is-book${done ? " is-done" : ""}${className ? ` ${className}` : ""}`}>
      {src ? <img className="al-cover-book" src={src} alt={tr(album.name)} draggable={false} /> : null}
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
  const tag = rarityTag(id, rarityOf(id));
  return <b className={`al-rarity msheet-rarity ${tag.cls}`}>{tag.text}</b>;
}

/**
 * On the sheet of a card got from a pack or bought: the lock with Giám định, a button this time (owner, 21/10), which
 * does nothing until Giám định is made.
 */
export function AppraiseBox({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="cv-lockbox al-appraise" onClick={() => canAppraise(id) && setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="4.5" y="10" width="15" height="11" rx="2.4" fill="currentColor" />
        </svg>
        <b>{tr("Giám định")}</b>
      </button>
      {open ? <AppraisePanel id={id} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
