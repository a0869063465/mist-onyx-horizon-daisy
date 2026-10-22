import { useLayoutEffect, useRef, useState } from "react";
import { artSrc, fakeMonsterCard, spellCard, spellSrc, type MonsterCard } from "@/lib/catalog";
import { tr, useLang } from "@/lib/i18n";
import { loadCard, loadSpell, type CardKey, type SpellKey, type Spot } from "@/lib/layouts";

// Long names may shrink to 0.75 of the old size; card text is now 1.3x, so 0.75 / 1.3.
const NAME_FLOOR = 0.58;

/** Card text size from a layout number, scaled by the --card-text factor in styles.css. */
export function cardText(size: number, unit = "cqw") {
  return `calc(${size}${unit} * var(--card-text, 1))`;
}

function FittedName({ spot, value }: { spot: Spot; value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(spot.size);

  useLayoutEffect(() => {
    const node = ref.current;
    const card = node?.parentElement;
    if (!node || !card) return;
    let dead = false;

    const linesAt = (next: number) => {
      node.style.fontSize = cardText(next);
      node.style.height = "auto";
      const line = parseFloat(getComputedStyle(node).lineHeight) || 1;
      return node.scrollHeight / line;
    };

    const fit = () => {
      if (dead || card.clientWidth < 2) return;
      const base = spot.size;
      const floor = base * NAME_FLOOR;
      const room = (card.clientHeight * spot.height) / 100 + 1;
      const fits = (size: number) => linesAt(size) <= 2.2 && node.scrollHeight <= room;
      let next = base;
      if (!fits(base)) {
        let lo = floor;
        let hi = base;
        next = floor;
        for (let i = 0; i < 10; i++) {
          const mid = (lo + hi) / 2;
          if (fits(mid)) {
            next = mid;
            lo = mid;
          } else {
            hi = mid;
          }
        }
      }
      node.style.fontSize = cardText(next);
      node.style.height = `${spot.height}%`;
      setSize((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
    };

    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(card);
    const onFonts = () => fit();
    document.fonts?.addEventListener("loadingdone", onFonts);
    void document.fonts?.ready.then(onFonts);
    return () => {
      dead = true;
      watch.disconnect();
      document.fonts?.removeEventListener("loadingdone", onFonts);
    };
  }, [value, spot.size, spot.width, spot.height]);

  return (
    <span
      ref={ref}
      className="socket is-name"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.width}%`,
        height: `${spot.height}%`,
        fontSize: cardText(size),
      }}
    >
      {value}
    </span>
  );
}

function NewMark({ spot, kind }: { spot: Spot; kind: "new" | "up" | "down" }) {
  const src = kind === "up" ? "/mark-tang.png" : kind === "down" ? "/mark-giam.png" : "/mark-moi.png";
  return (
    <span
      className="socket is-new"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.width}%`,
        height: `${spot.height}%`,
      }}
    >
      <img src={src} alt="" draggable={false} />
    </span>
  );
}

export function CardFace({
  monster,
  spellId,
  level = 1,
  dim = false,
  selected = false,
  hideStats = false,
  hideName = false,
  showNew = false,
  mark = null,
  layout,
  spellLayout,
  live,
  gems,
  fake = false,
}: {
  monster?: MonsterCard | null;
  spellId?: string;
  level?: number;
  dim?: boolean;
  selected?: boolean;
  hideStats?: boolean;
  /** No name on the card (the deck builder's pool shows only the art and figures). */
  hideName?: boolean;
  showNew?: boolean;
  mark?: "new" | "up" | "down" | null;
  layout?: Record<CardKey, Spot>;
  spellLayout?: Record<SpellKey, Spot>;
  live?: { name: string; atk: number; def: number; mdef: number; hp: number };
  gems?: number | string;
  /** A fake card (the starter deck's weaker copy): shows its cut stats, in red where below the real card's. */
  fake?: boolean;
}) {
  const badge = mark ?? (showNew ? "new" : null);
  const spell = spellId ? spellCard(spellId) : undefined;
  useLang();
  const spots = layout ?? loadCard();
  const spellSpots = spellLayout ?? loadSpell();
  const tier = monster ? monsterTier(monster.stars) : spell ? spellTier(spell.gems) : "";
  const cut = monster && fake && !live ? fakeMonsterCard(monster) : monster;
  const pin = (spot: Spot, value: string | number, name = false, key?: "atk" | "def" | "mdef" | "hp") =>
    hideStats || (!name && value === 0) ? null : name ? (
      <FittedName spot={spot} value={String(value)} />
    ) : (
      <span
        className={`socket${fake && monster && key && typeof value === "number" && value < monster[key] ? " is-cut" : ""}`}
        style={{
          left: `${spot.x}%`,
          top: `${spot.y}%`,
          width: `${spot.width}%`,
          height: `${spot.height}%`,
          fontSize: cardText(spot.size),
        }}
      >
        {value}
      </span>
    );
  return (
    <div className={`card${spell ? " is-spell" : ""}${tier}${dim ? " is-dim" : ""}${selected ? " is-selected" : ""}`}>
      {monster ? (
        artSrc(monster.id, level) ? <img className="art" src={artSrc(monster.id, level)} alt="" draggable={false} /> : null
      ) : spell ? (
        <img className="art" src={spellSrc(spell.id)} alt="" draggable={false} />
      ) : null}
      <img className="frame" src={spell ? "/spell-frame.png" : "/card-frame.png"} alt="" draggable={false} />
      {monster ? (
        <>
          {pin(spots.stars, monster.stars)}
          {pin(spots.gems, gems ?? monster.gems)}
          {pin(spots.def, live?.def ?? cut?.def ?? monster.def, false, "def")}
          {pin(spots.mdef, live?.mdef ?? cut?.mdef ?? monster.mdef, false, "mdef")}
          {pin(spots.atk, live?.atk ?? cut?.atk ?? monster.atk, false, "atk")}
          {pin(spots.hp, live?.hp ?? cut?.hp ?? monster.hp, false, "hp")}
          {hideName ? null : pin(spots.name, tr(live?.name ?? monster.name), true)}
          {badge ? <NewMark spot={spots.fresh} kind={badge} /> : null}
        </>
      ) : spell ? (
        <>
          {pin(spellSpots.gems, gems ?? spell.gems)}
          {hideName ? null : pin(spellSpots.name, tr(spell.name), true)}
          {badge ? <NewMark spot={spellSpots.fresh} kind={badge} /> : null}
        </>
      ) : null}
    </div>
  );
}

function monsterTier(stars: number) {
  if (stars >= 5) return " is-tier-black";
  if (stars >= 4) return " is-tier-purple";
  if (stars === 3) return " is-tier-red";
  if (stars === 2) return " is-tier-yellow";
  return "";
}

function spellTier(gems: number) {
  if (gems >= 3) return " is-tier-purple";
  if (gems === 2) return " is-tier-red";
  if (gems === 1) return " is-tier-orange";
  return "";
}
