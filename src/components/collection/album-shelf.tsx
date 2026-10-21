import { useMemo, useState } from "react";
import { AlbumBook } from "@/components/collection/album-book";
import { AlbumCover, CardsIcon } from "@/components/collection/album-parts";
import { albums, cardSets, collectionOwned, loadAlbumSeen, markAlbumSeen, newCards, type Album } from "@/lib/collection";
import { tr } from "@/lib/i18n";
import { ownedIds } from "@/lib/shop";

/**
 * Album sưu tập (owner, 21/10, after the Collector's Files of the video): the albums in two columns, each with its
 * name, its cover, how many of its cards are owned (Hoàn thành! when all) and a red ! while it holds cards not looked
 * at yet. A cover opens its album like a book.
 */
export function AlbumTab() {
  const list = useMemo(() => albums(), []);
  const sets = useMemo(() => cardSets(), []);
  const owned = useMemo(() => collectionOwned(ownedIds()), []);
  const [seen, setSeen] = useState(() => loadAlbumSeen());
  const [open, setOpen] = useState<{ album: Album; from: DOMRect | null } | null>(null);
  const fresh = useMemo(() => newCards(owned, seen), [owned, seen]);

  function openAlbum(album: Album, from: DOMRect | null) {
    setOpen({ album, from });
    setSeen(markAlbumSeen(album.cards.filter((card) => owned.has(card.id)).map((card) => card.id)));
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
      {open ? <AlbumBook album={open.album} from={open.from} owned={owned} sets={sets} albums={list} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
