import { KEYWORDS, keywordsOf } from "@/lib/keywords";

/** Hàng icon keyword ở cạnh trên bên trái lá quái (chủ game 09/11); không có keyword thì không vẽ gì. */
export function KeywordRow({ cardId }: { cardId: string | undefined | null }) {
  const list = keywordsOf(cardId);
  if (list.length === 0) return null;
  return (
    <span className="kw-row" aria-hidden="true">
      {list.map((id) => (
        <img key={id} className="kw-icon" src={KEYWORDS[id].src} alt="" draggable={false} />
      ))}
    </span>
  );
}
