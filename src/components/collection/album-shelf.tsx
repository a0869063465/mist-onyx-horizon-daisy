import { useMemo, useState } from "react";
import { AlbumBook } from "@/components/collection/album-book";
import { AlbumCover, CardsIcon } from "@/components/collection/album-parts";
import {
  albums,
  cardSets,
  claimedSets,
  claimSet,
  collectionOwned,
  exchangeCard,
  loadAlbumSeen,
  markAlbumSeen,
  newCards,
  type Album,
  type CardSet,
} from "@/lib/collection";
import { tr } from "@/lib/i18n";
import { ownedIds } from "@/lib/shop";

/**
 * Album sưu tập (owner, 21/10, after the Collector's Files of the video): the albums in two columns, each with its
 * name, its cover, how many of its cards are owned (Hoàn thành! when all) and a red ! while it holds cards not looked
 * at yet. A cover opens its album like a book. Cards bought with stars and set rewards taken there are kept here too.
 */
export function AlbumTab() {
  const list = useMemo(() => albums(), []);
  const sets = useMemo(() => cardSets(), []);
  const [owned, setOwned] = useState(() => collectionOwned(ownedIds()));
  const [seen, setSeen] = useState(() => loadAlbumSeen());
  const [claimed, setClaimed] = useState(() => claimedSets());
  const [open, setOpen] = useState<{ album: Album; from: DOMRect | null; fresh: string[] } | null>(null);
  const fresh = useMemo(() => newCards(owned, seen), [owned, seen]);

  // The album's new cards arrive as it opens, so they count as looked at from then on.
  function openAlbum(album: Album, from: DOMRect | null) {
    setOpen({ album, from, fresh: album.cards.filter((card) => fresh.has(card.id)).map((card) => card.id) });
    setSeen(markAlbumSeen(album.cards.filter((card) => owned.has(card.id)).map((card) => card.id)));
  }

  // A card bought in another album stays new there until that album is opened.
  function exchange(id: string): boolean {
    if (!exchangeCard(id)) return false;
    setOwned(collectionOwned(ownedIds()));
    if (open?.album.cards.some((card) => card.id === id)) setSeen(markAlbumSeen([id]));
    return true;
  }

  function claim(set: CardSet): number {
    const stars = claimSet(set);
    if (stars) setClaimed(claimedSets());
    return stars;
  }

  return (
    <>
      <div className="al-shelf">
        <div className="al-grid">
          {list.map((album) => {
            const have = album.cards.filter((card) => owned.has(card.id)).length;
            const done = have === album.cards.length;
            return (
              <button
                key={album.id}
                type="button"
                className="al-item"
                onClick={(event) => openAlbum(album, event.currentTarget.querySelector(".al-cover")?.getBoundingClientRect() ?? null)}
              >
                <span className="al-name">{tr(album.name)}</span>
                <span className="al-item-cover">
                  <AlbumCover album={album} done={done} />
                  {album.cards.some((card) => fresh.has(card.id)) ? (
                    <i className="al-new" aria-label={tr("Có lá mới")}>
                      !
                    </i>
                  ) : null}
                </span>
                {done ? (
                  <b className="al-done">{tr("Hoàn thành!")}</b>
                ) : (
                  <span className="al-count">
                    <CardsIcon />
                    {have}/{album.cards.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {open ? (
        <AlbumBook
          album={open.album}
          from={open.from}
          fresh={open.fresh}
          owned={owned}
          claimed={claimed}
          sets={sets}
          albums={list}
          onExchange={exchange}
          onClaim={claim}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}
