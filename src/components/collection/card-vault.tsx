import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AlbumPic, AppraiseBox, RarityBadge } from "@/components/collection/album-parts";
import { CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { Glyph } from "@/components/game/monster-sheet";
import { ReactGlyph } from "@/components/game/react-glyph";
import { FORMS, MONSTERS, SPELLS, monsterCard, spellCard, spellSrc } from "@/lib/catalog";
import { awaitsAppraisal, collectionOwned, rarityOf } from "@/lib/collection";
import { ENV_FILTERS, MONSTER_TYPES, passesFilter, plainName, STAR_FILTERS } from "@/lib/deck-filters";
import { tr } from "@/lib/i18n";
import { loadRates, ownedIds, tierRank, type Tier } from "@/lib/shop";
import { SPELL_KINDS, spellKind, spellKindRank, type SpellKind, type SpellKindKey } from "@/lib/spell-kinds";
import { loadStrategies } from "@/lib/strategies";

type Kind = "monster" | "spell";
type Pick = { id: string; kind: Kind };
type Row = Pick & { name: string; stars: number; form: boolean; owned: boolean; tier: Tier };
/** By rarity, UR first (the default; owner, 21/10), Normal first on the next tap; or Thông thường. */
type Sort = { by: "normal" } | { by: "rarity"; up: boolean };
type Panel = "env" | "filter" | "sort" | null;
/** Monsters and spells shown (at least one), monster types and stars, spell groups, rarities. */
type VaultFilter = { monsters: boolean; spells: boolean; types: string[]; stars: number[]; kinds: SpellKindKey[]; tiers: Tier[] };

const NO_FILTER: VaultFilter = { monsters: true, spells: true, types: [], stars: [], kinds: [], tiers: [] };
const RARITIES: Tier[] = ["N", "SR", "UR"];
const RARITY_NAME: Record<Tier, string> = { N: "N", SR: "SR", UR: "UR" };

/**
 * Kho bài (owner, 21/10): every card, like the deck builder's pool, in a new look. On top: the search, the
 * environment button (its list drops down, a second tap folds it), the filter (monsters and spells on or off, the
 * monster types and stars, the spell groups, the rarity) and the sort (rarity up, again for down, or Thông thường:
 * most stars first, then the spells by group). Cards not owned are dimmed, not locked: the lock shows on the card's
 * sheet, where Giám định will go later. Forms come last, dimmed.
 */
export function CardVault() {
  const [query, setQuery] = useState("");
  const [envs, setEnvs] = useState<string[]>([]);
  const [filter, setFilter] = useState<VaultFilter>(NO_FILTER);
  const [sort, setSort] = useState<Sort>({ by: "rarity", up: false });
  const [panel, setPanel] = useState<Panel>(null);
  const [sheet, setSheet] = useState<Pick | null>(null);
  const plans = useMemo(() => loadStrategies(), []);
  const owned = useMemo(() => collectionOwned(ownedIds()), []);
  const rates = useMemo(() => loadRates(), []);
  const forms = useMemo(() => new Set(FORMS.map((card) => card.id)), []);

  const q = plainName(query);
  const named = (name: string) => !q || plainName(name).includes(q) || plainName(tr(name)).includes(q);
  const rows: Row[] = [];
  if (filter.monsters) {
    for (const base of [...MONSTERS, ...FORMS]) {
      const card = monsterCard(base.id) ?? base;
      if (!named(card.name) || !passesFilter(card.id, { envs, types: filter.types, stars: filter.stars }, plans)) continue;
      const form = forms.has(card.id);
      rows.push({ id: card.id, kind: "monster", name: card.name, stars: card.stars, form, owned: !form && owned.has(card.id), tier: rarityOf(card.id, rates) });
    }
  }
  if (filter.spells) {
    for (const base of SPELLS) {
      const card = spellCard(base.id) ?? base;
      if (!named(card.name) || (filter.kinds.length && !filter.kinds.includes(spellKind(card.id).key))) continue;
      rows.push({ id: card.id, kind: "spell", name: card.name, stars: 0, form: false, owned: owned.has(card.id), tier: rarityOf(card.id, rates) });
    }
  }
  const shown = (filter.tiers.length ? rows.filter((row) => filter.tiers.includes(row.tier)) : rows).sort((a, b) => order(a, b, sort));

  const filterCount = filter.types.length + filter.stars.length + filter.kinds.length + filter.tiers.length + (filter.monsters && filter.spells ? 0 : 1);
  // Not owned: the lock; got from a pack or bought: Giám định; the default deck's and forms: nothing.
  const lock = (id: string) => (forms.has(id) ? null : !owned.has(id) ? <LockBox /> : awaitsAppraisal(id, owned) ? <AppraiseBox /> : null);
  const badge = (id: string) => <RarityBadge id={id} />;

  function flip(next: Exclude<Panel, null>) {
    setPanel((now) => (now === next ? null : next));
  }

  function toggle<K extends "types" | "stars" | "kinds" | "tiers">(key: K, value: VaultFilter[K][number]) {
    setFilter((now) => {
      const list = now[key] as Array<typeof value>;
      return { ...now, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  // Monsters and spells each turn on and off; the last one on stays on.
  function show(key: "monsters" | "spells") {
    setFilter((now) => {
      const other = key === "monsters" ? "spells" : "monsters";
      if (now[key] && !now[other]) return now;
      return { ...now, [key]: !now[key] };
    });
  }

  return (
    <section className="cv-vault">
      <div className="cv-tools">
        <label className="cv-search">
          <Glyph name="magnifying-glass" fill="#cfe0ff" />
          <input value={query} placeholder={tr("Tìm lá bài")} onChange={(event) => setQuery(event.target.value)} />
          {query ? (
            <button type="button" className="cv-search-x" data-ui="soft" aria-label={tr("Xoá")} onClick={() => setQuery("")}>
              ✕
            </button>
          ) : null}
        </label>
        <ToolButton label={tr("Môi trường")} on={panel === "env"} count={envs.length} onClick={() => flip("env")}>
          <Glyph name="mountains" />
        </ToolButton>
        <ToolButton label={tr("Lọc")} on={panel === "filter"} count={filterCount} onClick={() => flip("filter")}>
          <Glyph name="funnel" />
        </ToolButton>
        <ToolButton label={tr("Sắp xếp")} on={panel === "sort"} count={sort.by === "rarity" && !sort.up ? 0 : 1} onClick={() => flip("sort")}>
          <SortIcon up={sort.by === "rarity" ? sort.up : null} />
        </ToolButton>
      </div>

      {panel === "env" ? (
        <div className="cv-drop">
          <div className="cv-envs">
            {ENV_FILTERS.map((env) => (
              <button
                key={env.id}
                type="button"
                data-ui="soft"
                className={`cv-env${envs.includes(env.id) ? " on" : ""}`}
                onClick={() => setEnvs((now) => (now.includes(env.id) ? now.filter((id) => id !== env.id) : [...now, env.id]))}
              >
                <img src={spellSrc(env.id)} alt="" draggable={false} />
                <span>{tr(env.label)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="cv-clear" disabled={!envs.length} onClick={() => setEnvs([])}>
            {tr("Bỏ chọn")}
          </button>
        </div>
      ) : null}

      {panel === "filter" ? (
        <div className="cv-drop">
          <div className="cv-show">
            <button type="button" data-ui="soft" className={`cv-show-btn is-monster${filter.monsters ? " on" : ""}`} aria-pressed={filter.monsters} onClick={() => show("monsters")}>
              <Glyph name="wolf-head" />
              <span>{tr("Quái thú")}</span>
            </button>
            <button type="button" data-ui="soft" className={`cv-show-btn is-spell${filter.spells ? " on" : ""}`} aria-pressed={filter.spells} onClick={() => show("spells")}>
              <Glyph name="spell-book" />
              <span>{tr("Phép")}</span>
            </button>
          </div>
          {filter.monsters ? (
            <>
              <h3 className="cv-drop-head">{tr("Loại quái")}</h3>
              <div className="cv-chips">
                {MONSTER_TYPES.map((type) => (
                  <button key={type.key} type="button" data-ui="soft" className={`cv-chip${filter.types.includes(type.key) ? " on" : ""}`} onClick={() => toggle("types", type.key)}>
                    <Glyph name={type.icon} />
                    <span>{tr(type.label)}</span>
                  </button>
                ))}
              </div>
              <h3 className="cv-drop-head">{tr("Số sao")}</h3>
              <div className="cv-row">
                {STAR_FILTERS.map((stars) => (
                  <button key={stars} type="button" data-ui="soft" className={`cv-star${filter.stars.includes(stars) ? " on" : ""}`} onClick={() => toggle("stars", stars)}>
                    <i aria-hidden="true">★</i>
                    {stars}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {filter.spells ? (
            <>
              <h3 className="cv-drop-head">{tr("Nhóm phép")}</h3>
              <div className="cv-chips">
                {SPELL_KINDS.map((kind) => (
                  <button
                    key={kind.key}
                    type="button"
                    data-ui="soft"
                    className={`cv-chip is-kind${filter.kinds.includes(kind.key) ? " on" : ""}`}
                    style={{ "--tone": kind.tone } as CSSProperties}
                    onClick={() => toggle("kinds", kind.key)}
                  >
                    <KindIcon kind={kind} />
                    <span>{tr(kind.label)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <h3 className="cv-drop-head">{tr("Độ hiếm")}</h3>
          <div className="cv-row">
            {RARITIES.map((tier) => (
              <button key={tier} type="button" data-ui="soft" className={`cv-rarity is-${tier}${filter.tiers.includes(tier) ? " on" : ""}`} onClick={() => toggle("tiers", tier)}>
                {RARITY_NAME[tier]}
              </button>
            ))}
          </div>
          <button type="button" className="cv-clear" disabled={filterCount === 0} onClick={() => setFilter(NO_FILTER)}>
            {tr("Bỏ lọc")}
          </button>
        </div>
      ) : null}

      {panel === "sort" ? (
        <div className="cv-drop is-sort">
          <button type="button" data-ui="soft" className={`cv-sort${sort.by === "rarity" ? " on" : ""}`} onClick={() => setSort((now) => ({ by: "rarity", up: now.by === "rarity" ? !now.up : false }))}>
            <span>{tr("Độ hiếm")}</span>
            <small>{sort.by === "rarity" && !sort.up ? "UR → SR → N" : "N → SR → UR"}</small>
          </button>
          <button type="button" data-ui="soft" className={`cv-sort${sort.by === "normal" ? " on" : ""}`} onClick={() => setSort({ by: "normal" })}>
            <span>{tr("Thông thường")}</span>
            <small>{tr("Quái nhiều sao trước, rồi phép theo nhóm")}</small>
          </button>
        </div>
      ) : null}

      <div className="cv-pool">
        <div className="cv-grid">
          {shown.map((row) => (
            <button key={row.id} type="button" data-ui="soft" className={`cv-card${row.owned ? "" : " is-dim"}`} onClick={() => setSheet(row)}>
              <AlbumPic id={row.id} missing={!row.owned} />
              <b className={`cv-tag is-${row.tier}`}>{RARITY_NAME[row.tier]}</b>
            </button>
          ))}
        </div>
        {shown.length === 0 ? <p className="cv-empty">{tr("Không có lá nào khớp.")}</p> : null}
      </div>

      {sheet ? (
        sheet.kind === "monster" ? (
          <CardMonsterSheet id={sheet.id} aside={lock(sheet.id)} asideFor={lock} badge={badge(sheet.id)} badgeFor={badge} onClose={() => setSheet(null)} />
        ) : (
          <SpellSheet id={sheet.id} aside={lock(sheet.id)} asideFor={lock} badge={badge(sheet.id)} badgeFor={badge} onClose={() => setSheet(null)} />
        )
      ) : null}
    </section>
  );
}

/** Forms last; then by rarity when asked (monsters before spells inside one rarity); then Thông thường. */
function order(a: Row, b: Row, sort: Sort): number {
  if (a.form !== b.form) return a.form ? 1 : -1;
  if (sort.by === "rarity" && a.tier !== b.tier) return (tierRank(a.tier) - tierRank(b.tier)) * (sort.up ? 1 : -1);
  if (a.kind !== b.kind) return a.kind === "monster" ? -1 : 1;
  if (a.kind === "monster") return b.stars - a.stars || a.name.localeCompare(b.name, "vi");
  return spellKindRank(a.id) - spellKindRank(b.id) || a.name.localeCompare(b.name, "vi");
}

function ToolButton({ label, on, count, onClick, children }: { label: string; on: boolean; count: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`cv-tool${on ? " on" : ""}${count ? " is-set" : ""}`} aria-label={label} aria-expanded={on} onClick={onClick}>
      {children}
      {count ? <b className="cv-tool-count">{count}</b> : null}
    </button>
  );
}

/** A spell group's icon, as on the deck list: the reaction bar's where there is one, else its game icon. */
function KindIcon({ kind }: { kind: SpellKind }) {
  if (kind.react === "rebound") {
    return (
      <span className="cv-kind-pic">
        <ReactGlyph kind="rebound" />
      </span>
    );
  }
  if (kind.react) return <ReactGlyph kind={kind.react} />;
  return <Glyph name={kind.glyph ?? "info"} fill={kind.tone} />;
}

/** Bars of three lengths with an arrow: the sort button; the arrow points the way of the rarity sort. */
function SortIcon({ up }: { up: boolean | null }) {
  return (
    <svg className="cv-sort-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h9M4 12h6M4 18h3" />
      <path d={up === false ? "M18 5v14M14.5 15.5 18 19l3.5-3.5" : "M18 19V5M14.5 8.5 18 5l3.5 3.5"} />
    </svg>
  );
}

/** On the sheet of a card not owned yet: the lock (Giám định comes here later; owner, 21/10). */
export function LockBox() {
  return (
    <section className="cv-lockbox">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="4.5" y="10" width="15" height="11" rx="2.4" fill="currentColor" />
      </svg>
      <b>{tr("Chưa có lá này")}</b>
    </section>
  );
}
