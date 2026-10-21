import type { Ref } from "react";
import { artSrc, monsterCard, spellSrc } from "@/lib/catalog";
import type { Album } from "@/lib/collection";

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

/** Two links of a chain: a card whose sets open from it. */
export function ChainIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.2 13.8a4 4 0 0 0 5.66 0l3.2-3.2a4 4 0 0 0-5.66-5.66l-1.1 1.1" />
      <path d="M13.8 10.2a4 4 0 0 0-5.66 0l-3.2 3.2a4 4 0 0 0 5.66 5.66l1.1-1.1" />
    </svg>
  );
}
