import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlbumBook } from "@/components/collection/album-book";
import { AlbumCover, CardsIcon } from "@/components/collection/album-parts";
import {
  cardSets,
  claimedSets,
  claimSet,
  collectionOwned,
  exchangeCard,
  loadAlbumSeen,
  markAlbumSeen,
  newCards,
  shelfAlbums,
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
  const list = useMemo(() => shelfAlbums(), []);
  const sets = useMemo(() => cardSets(), []);
  const [owned, setOwned] = useState(() => collectionOwned(ownedIds()));
  const [seen, setSeen] = useState(() => loadAlbumSeen());
  const [claimed, setClaimed] = useState(() => claimedSets());
  const [open, setOpen] = useState<{ album: Album; from: DOMRect | null; fresh: string[] } | null>(
    null,
  );
  const fresh = useMemo(() => newCards(owned, seen), [owned, seen]);

  // The album's new cards arrive as it opens, so they count as looked at from then on.
  function openAlbum(album: Album, from: DOMRect | null) {
    // A character album only gathers cards of the environment albums: it neither shows nor clears their new marks.
    const own = album.group !== "char";
    setOpen({
      album,
      from,
      fresh: own ? album.cards.filter((card) => fresh.has(card.id)).map((card) => card.id) : [],
    });
    if (own)
      setSeen(
        markAlbumSeen(album.cards.filter((card) => owned.has(card.id)).map((card) => card.id)),
      );
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

  // Albums with no card yet show only their book (chủ game 08/11).
  const soon = (id: string, name: string, group: "char" | "env"): Album => ({ id, name, env: null, cover: "", cards: [], group });
  const byId = (id: string) => list.find((album) => album.id === id);
  const parts = [
    {
      key: "char",
      title: "Theo nhân vật",
      group: [byId("yugi"), byId("phep"), soon("joey", "Joey", "char")].filter((album): album is Album => !!album),
    },
    {
      key: "env",
      title: "Theo môi trường",
      group: [...list.filter((album) => album.group !== "char" && album.id !== "phep"), soon("vuong-quoc", "Vương đô", "env")],
    },
  ];

  // Only two books are clear at a time; the next one fades in as the row slides, like the hand of cards in a match.
  const rows = useRef<Record<string, HTMLDivElement | null>>({});
  const fade = (row: HTMLDivElement | null) => {
    if (!row) return;
    const box = row.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
    const left = box.left + pad;
    const right = box.right - pad;
    row.querySelectorAll<HTMLElement>(".al-item").forEach((item) => {
      const rect = item.getBoundingClientRect();
      const over = Math.max(0, left - rect.left, rect.right - right);
      item.style.setProperty("--edge", String(Math.max(0.3, 1 - over / (rect.width * 0.9))));
    });
  };
  useLayoutEffect(() => {
    const all = () => Object.values(rows.current).forEach(fade);
    all();
    window.addEventListener("resize", all);
    return () => window.removeEventListener("resize", all);
  });

  return (
    <>
      <div className="al-shelf">
        {parts.map(({ key, title, group }) => (
          <section key={key} className={`al-part is-${key}`}>
            <h3 className="al-banner">{tr(title)}</h3>
            <div className="al-row" ref={(el) => { rows.current[key] = el; }} onScroll={(event) => fade(event.currentTarget)}>
              {group.map((album) => {
                const total = album.cards.length;
                const have = album.cards.filter((card) => owned.has(card.id)).length;
                const done = total > 0 && have === total;
                const empty = total === 0;
                return (
                  <button
                    key={album.id}
                    type="button"
                    className={`al-item${empty ? " is-soon" : ""}`}
                    disabled={empty}
                    onClick={(event) => openAlbum(album, event.currentTarget.querySelector(".al-cover")?.getBoundingClientRect() ?? null)}
                  >
                    <AlbumCover album={album} done={done} />
                    {album.group !== "char" && album.cards.some((card) => fresh.has(card.id)) ? (
                      <i className="al-new" aria-label={tr("Có lá mới")}>
                        !
                      </i>
                    ) : null}
                    <span className={`al-prog${done ? " is-done" : ""}`}>
                      <CardsIcon />
                      <b>{empty ? tr("Sắp có") : `${have}/${total}`}</b>
                      <u>
                        <i style={{ width: `${total ? Math.round((have / total) * 100) : 0}%` }} />
                      </u>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
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
