import { KEYWORDS, keywordsOf, type NewKeywordId } from "@/lib/keywords";

/** Hàng icon keyword ở cạnh trên bên trái lá quái (chủ game 09/11); không có keyword thì không vẽ gì. */
export function KeywordRow({ cardId }: { cardId: string | undefined | null }) {
  const list = keywordsOf(cardId).filter((id): id is NewKeywordId => id in KEYWORDS);
  if (list.length === 0) return null;
  return (
    <span className="kw-row" data-n={Math.min(3, list.length)} aria-hidden="true">
      {list.map((id) => (
        <img key={id} className="kw-icon" data-kw={id} src={KEYWORDS[id].src} alt="" draggable={false} />
      ))}
    </span>
  );
}
