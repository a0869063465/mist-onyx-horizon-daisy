import { useMemo, useState, type ReactNode } from "react";
import { CardFace } from "@/components/game/card-face";
import { artSrc, monsterCard, spellCard, spellSrc } from "@/lib/catalog";
import { tr } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";
import {
  cardName,
  clampWeight,
  DEFAULT_WEIGHT,
  loadRates,
  naturalTier,
  ownedIds,
  PACK,
  packOdds,
  packPool,
  ratesText,
  saveRates,
  tidyEdit,
  TIER_NAME,
  tierOf,
  tierRank,
  TIERS,
  weightOf,
  type PackEntry,
  type Rates,
  type Tier,
} from "@/lib/shop";

function Panel({ title, onClose, children, foot }: { title: string; onClose: () => void; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="shop-panel-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="shop-panel" role="dialog" aria-label={title}>
        <header className="shop-panel-head">
          <h3>{title}</h3>
          <button type="button" className="shop-x" aria-label={tr("Đóng")} onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="shop-panel-body">{children}</div>
        {foot ? <footer className="shop-panel-foot">{foot}</footer> : null}
      </section>
    </div>
  );
}

function percent(value: number) {
  const pct = value * 100;
  return `${pct >= 10 ? pct.toFixed(0) : pct >= 1 ? pct.toFixed(1) : pct.toFixed(2)}%`.replace(".", ",");
}

function byPower(a: PackEntry, b: PackEntry) {
  const rank = (entry: PackEntry) => (entry.kind === "monster" ? (monsterCard(entry.id)?.stars ?? 0) : 10 + (spellCard(entry.id)?.gems ?? 0));
  return rank(a) - rank(b) || cardName(a).localeCompare(cardName(b), "vi");
}

function thumb(entry: PackEntry) {
  return entry.kind === "monster" ? artSrc(entry.id, 1) : spellSrc(entry.id);
}

/**
 * Tỉ lệ: the chance a pack holds each card, worked out from the weights (a bigger weight comes up more often).
 * The publisher can move a card to another tier and change its weight (owner, 19/10: tune on this phone first);
 * Sao chép copies the changes as text to paste to Claude, who puts them in the game for everyone.
 */
export function RatePanel({ editable, onClose }: { editable: boolean; onClose: () => void }) {
  const [rates, setRates] = useState<Rates>(() => loadRates());
  const [copied, setCopied] = useState<"" | "ok" | "manual">("");
  const pool = useMemo(() => packPool(), []);
  const odds = useMemo(() => packOdds(rates), [rates]);

  function change(entry: PackEntry, edit: { tier?: Tier; weight?: number }) {
    setRates((now) => {
      const merged = { ...now[entry.id], ...edit };
      // Moving a card to another tier gives it that tier's usual weight.
      if (edit.tier && edit.weight === undefined) delete merged.weight;
      const tidy = tidyEdit(entry, merged);
      const next = { ...now };
      if (tidy) next[entry.id] = tidy;
      else delete next[entry.id];
      saveRates(next);
      return next;
    });
    setCopied("");
  }

  function reset() {
    playUi("select");
    saveRates({});
    setRates({});
    setCopied("");
  }

  async function copy() {
    playUi("select");
    try {
      await navigator.clipboard.writeText(ratesText(rates));
      setCopied("ok");
    } catch {
      setCopied("manual");
    }
  }

  const foot = editable ? (
    <>
      <button type="button" className="shop-soft" onClick={reset} disabled={!Object.keys(rates).length}>
        {tr("Về mặc định")}
      </button>
      <button type="button" className="shop-main" onClick={() => void copy()}>
        {copied === "ok" ? tr("Đã sao chép") : tr("Sao chép")}
      </button>
    </>
  ) : undefined;

  return (
    <Panel title={tr("Tỉ lệ")} onClose={onClose} foot={foot}>
      <p className="rate-sum">
        {tr("Mỗi gói")}:{" "}
        <span className="is-UR">
          {tr("có UR")} {percent(odds.best.UR)}
        </span>{" "}
        ·{" "}
        <span className="is-SR">
          {tr("cao nhất SR")} {percent(odds.best.SR)}
        </span>{" "}
        ·{" "}
        <span className="is-N">
          {tr("toàn Normal")} {percent(odds.best.N)}
        </span>
      </p>
      <p className="rate-note">{tr("Số % là cơ hội lá đó có trong 1 gói. 10 gói luôn có ít nhất 1 UR.")}</p>
      {editable ? (
        <p className="rate-note">
          {tr("Trọng số mặc định")}: Normal {DEFAULT_WEIGHT.N}, SR {DEFAULT_WEIGHT.SR}, UR {DEFAULT_WEIGHT.UR}. {tr("Số càng lớn càng dễ ra; 0 là không ra. Chỉnh xong bấm Sao chép rồi gửi cho Claude.")}
        </p>
      ) : null}
      {copied === "manual" ? <textarea className="rate-copy" readOnly value={ratesText(rates)} onFocus={(event) => event.currentTarget.select()} /> : null}
      {TIERS.map((tier) => {
        const rows = pool.filter((entry) => tierOf(entry, rates) === tier).sort(byPower);
        return (
          <section key={tier} className="rate-group">
            <h4 className={`rate-head is-${tier}`}>
              {TIER_NAME[tier]} · {rows.length} {tr("lá")}
            </h4>
            {rows.map((entry) => {
              const moved = tierOf(entry, rates) !== naturalTier(entry);
              const weight = weightOf(entry, rates);
              return (
                <div key={entry.id} className={`rate-row${rates[entry.id] ? " is-edited" : ""}`}>
                  <span className="rate-art" style={{ backgroundImage: `url(${thumb(entry)})` }} />
                  <div className="rate-main">
                    <div className="rate-line">
                      <span className="rate-name">
                        {tr(cardName(entry))}
                        {moved ? <small> ({tr("thường là")} {TIER_NAME[naturalTier(entry)]})</small> : null}
                      </span>
                      <b className="rate-pct">{percent(odds.card[entry.id] ?? 0)}</b>
                    </div>
                    {editable ? (
                      <div className="rate-line">
                        <span className="rate-tiers">
                          {TIERS.map((option) => (
                            <button key={option} type="button" className={`rate-tier is-${option}${option === tier ? " on" : ""}`} onClick={() => option !== tier && change(entry, { tier: option })}>
                              {option}
                            </button>
                          ))}
                        </span>
                        <span className="rate-weight">
                          <button type="button" aria-label={tr("Giảm")} onClick={() => change(entry, { weight: clampWeight(weight - 1) })}>
                            −
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={weight}
                            aria-label={tr("Trọng số")}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (event.target.value !== "" && Number.isFinite(value)) change(entry, { weight: clampWeight(value) });
                            }}
                          />
                          <button type="button" aria-label={tr("Tăng")} onClick={() => change(entry, { weight: clampWeight(weight + 1) })}>
                            +
                          </button>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </Panel>
  );
}

/** Lá trong gói: every card the pack can hold with its tier; tap one to read it. */
export function PackCards({ onTap, onClose }: { onTap: (entry: PackEntry) => void; onClose: () => void }) {
  const rates = useMemo(() => loadRates(), []);
  const owned = useMemo(() => ownedIds(), []);
  const rows = useMemo(
    () =>
      packPool()
        .map((entry) => ({ entry, tier: tierOf(entry, rates) }))
        .sort((a, b) => tierRank(b.tier) - tierRank(a.tier) || byPower(a.entry, b.entry)),
    [rates],
  );
  return (
    <Panel title={`${tr("Lá trong gói")} · ${rows.length}`} onClose={onClose}>
      <p className="rate-note">{tr(PACK.name)}</p>
      <div className="shop-cards">
        {rows.map(({ entry, tier }) => {
          const monster = entry.kind === "monster" ? monsterCard(entry.id) : undefined;
          return (
            <button key={entry.id} type="button" className="shop-card" onClick={() => onTap(entry)}>
              {monster ? <CardFace monster={monster} /> : <CardFace spellId={entry.id} />}
              <b className={`po-tag is-${tier}`}>{tier}</b>
              {owned.has(entry.id) ? <b className="shop-owned">{tr("Đã có")}</b> : null}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
