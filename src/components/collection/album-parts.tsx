import { useState, type Ref } from "react";
import { AppraisePanel } from "@/components/collection/appraise-panel";
import { canAppraise } from "@/lib/appraisal";
import { artSrc, monsterCard, spellSrc } from "@/lib/catalog";
import { rarityOf, rarityTag, type Album } from "@/lib/collection";
import { trialTag } from "@/lib/owned-cards";
import { tr } from "@/lib/i18n";

/** A card in an album: its art in the gold frame of Đổi hình nền, no figures, no name; grey while not owned. */
export function AlbumPic({ id, missing = false, vault = false }: { id: string; missing?: boolean; vault?: boolean }) {
  const art = monsterCard(id) ? artSrc(id, 1) : spellSrc(id);
  // A trial card (lent this week, chủ game 08/11) shows in colour but is still not owned.
  const fake = missing && trialTag(id) !== null;
  return (
    <span className={`al-pic${vault ? " is-vault" : ""}${fake ? " is-fake" : missing ? " is-missing" : ""}`}>
      <span className="al-pic-art" style={{ backgroundImage: `url(${art})` }} />
      <img className="al-pic-frame" src={vault ? "/ui/col/card-frame.webp" : "/ui/cover-frame.png"} alt="" draggable={false} />
    </span>
  );
}

/** The books drawn for the shelf (name on the plaque) and for opening (the same without the name); `soon` = no cards yet. */
export const BOOKS = new Set(["nui", "bong-toi", "thao-nguyen", "rung-ram", "dat-da", "bien-sau", "cu-dia-may-moc", "thanh-dia-thien-su", "nui-dung-nham", "vuong-quoc", "phep", "yugi", "joey"]);

/** Where each book's body sits across its 480-wide picture (left and right edge), measured from the pictures. */
export const BOOK_X: Record<string, [number, number]> = {
  "bien-sau": [0.098, 0.894], "bong-toi": [0.108, 0.929], "cu-dia-may-moc": [0.106, 0.915], "dat-da": [0.094, 0.906], joey: [0.106, 0.915],
  "nui-dung-nham": [0.106, 0.929], nui: [0.117, 0.883], phep: [0.104, 0.912], "rung-ram": [0.108, 0.894], "thanh-dia-thien-su": [0.1, 0.9],
  "thao-nguyen": [0.104, 0.915], "vuong-quoc": [0.096, 0.9], yugi: [0.102, 0.898],
};

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

/**
 * A card as it stands in the album: the art in the window of the owner's own frame (`slot.webp`) with its number on the
 * plate, so the group panel looks like the pages (chủ game 08/11). Sized by its container's width.
 */
export function SlotCard({ id, no, missing = false }: { id: string; no?: string; missing?: boolean }) {
  const art = monsterCard(id) ? artSrc(id, 1) : spellSrc(id);
  return (
    <span className={`slot-card${missing ? " is-missing" : ""}`}>
      <span className="slot-card-art" style={{ backgroundImage: `url(${art})` }} />
      <img className="slot-card-frame" src="/ui/col/slot.webp" alt="" draggable={false} />
      {no ? <b className="slot-card-no">{no}</b> : null}
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
