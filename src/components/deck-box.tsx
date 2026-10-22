import { artSrc, spellCard, spellSrc } from "@/lib/catalog";
import { tr } from "@/lib/i18n";

/** Gradients the deck boxes and the panel icons share; drawn once on the page. */
export function LorDefs() {
  return (
    <svg className="glyph-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <linearGradient id="lor-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1b8" />
          <stop offset="0.12" stopColor="#e6bd62" />
          <stop offset="0.3" stopColor="#b98431" />
          <stop offset="0.5" stopColor="#f2d27e" />
          <stop offset="0.7" stopColor="#a8732a" />
          <stop offset="0.86" stopColor="#d9b05a" />
          <stop offset="1" stopColor="#6a430f" />
        </linearGradient>
        <linearGradient id="lor-gold-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a5c1a" />
          <stop offset="0.35" stopColor="#f3d488" />
          <stop offset="0.65" stopColor="#c08d3a" />
          <stop offset="1" stopColor="#6e4812" />
        </linearGradient>
        <linearGradient id="lor-stack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1eee8" />
          <stop offset="0.5" stopColor="#bdb8ae" />
          <stop offset="1" stopColor="#7d786f" />
        </linearGradient>
        <linearGradient id="lor-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f04a3e" />
          <stop offset="0.55" stopColor="#c8211a" />
          <stop offset="1" stopColor="#8e110c" />
        </linearGradient>
        <linearGradient id="lor-star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="0.5" stopColor="#f39033" />
          <stop offset="1" stopColor="#c45a12" />
        </linearGradient>
        <linearGradient id="lor-silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#e2ddd2" />
          <stop offset="1" stopColor="#a49d90" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * A deck box as LoR draws it: the cover monster behind a gold frame whose two top posts hold a stack of cards,
 * a pointed bottom, the environment card's round socket over the bottom of the art (when the deck has one), the
 * red star ribbon of a favourite, and a red ! on top of a deck that cannot be played yet.
 */
export function DeckBox({ cover, spells, fav, warn }: { cover?: string | null; spells: string[]; fav?: boolean; warn?: boolean }) {
  const art = cover ? artSrc(cover, 1) : null;
  const env = spells.find((id) => spellCard(id)?.env);
  return (
    <span className="lor-box">
      <span className="lor-box-art" style={art ? { backgroundImage: `url(${art})` } : undefined} />
      <svg className="lor-box-frame" viewBox="0 0 160 222" aria-hidden="true">
        <rect
          x="23"
          y="4"
          width="114"
          height="19"
          rx="2.5"
          fill="url(#lor-stack)"
          stroke="#45413b"
          strokeWidth="0.8"
        />
        <path
          d="M25 8.5H135M25 12.5H135M25 16.5H135"
          stroke="#6f6a62"
          strokeWidth="0.7"
          opacity="0.75"
        />
        <path
          fillRule="evenodd"
          fill="url(#lor-gold)"
          stroke="#2c1c05"
          strokeWidth="1.2"
          d="M6 14Q6 6 14 6H25L27 22H133L135 6H146Q154 6 154 14V188L149 196H99L80 213L61 196H11L6 188Z M15 28V185H145V28Z"
        />
        <path d="M15 28V185H145V28Z" fill="none" stroke="#120b02" strokeWidth="2" />
        <path
          d="M16.5 29.5V183.5H143.5V29.5Z"
          fill="none"
          stroke="#f6dc94"
          strokeWidth="0.6"
          opacity="0.7"
        />
        <path
          d="M8 16V186M152 16V186"
          stroke="url(#lor-gold-side)"
          strokeWidth="1.4"
          opacity="0.8"
        />
        <path d="M70 199L80 208L90 199" fill="none" stroke="#2c1c05" strokeWidth="1.2" />
        <path d="M11 192H62M98 192H149" stroke="#f6dc94" strokeWidth="0.6" opacity="0.6" />
        {fav ? (
          <g className="lor-ribbon">
            <path
              d="M-7 33H54L46 43L54 53H-7Z"
              fill="url(#lor-ribbon)"
              stroke="#4e0603"
              strokeWidth="0.9"
            />
            <path d="M-7 53L1 58V53Z" fill="#5c0805" />
            <path d="M-4 35.5H50" stroke="#ff9a8a" strokeWidth="0.7" opacity="0.6" />
            <path
              d="M14 36.2L16.1 40.9L21.2 41.4L17.3 44.8L18.5 49.8L14 47.2L9.5 49.8L10.7 44.8L6.8 41.4L11.9 40.9Z"
              fill="#f7f3ea"
            />
          </g>
        ) : null}
      </svg>
      {env ? (
        <span className="lor-box-env">
          <img src={spellSrc(env)} alt="" draggable={false} />
        </span>
      ) : null}
      {warn ? (
        <span className="lor-box-warn" aria-label={tr("Chưa đủ lá")}>
          !
        </span>
      ) : null}
    </span>
  );
}
