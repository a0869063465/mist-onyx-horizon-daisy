import { useMemo, useState, type ReactNode } from "react";
import { CardFace } from "@/components/game/card-face";
import { artSrc, monsterCard, spellSrc } from "@/lib/catalog";
import { tr } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";
import {
  byPower,
  cardName,
  DEFAULT_TIERS,
  freshRates,
  loadRates,
  moveCard,
  naturalTier,
  ownedIds,
  PACK,
  packOdds,
  packPool,
  ratesText,
  saveRates,
  TIER_NAME,
  tierOf,
  tierRank,
  TIERS,
  withTier,
  type PackEntry,
  type Rates,
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


function thumb(entry: PackEntry) {
  return entry.kind === "monster" ? artSrc(entry.id, 1) : spellSrc(entry.id);
}

/**
 * Tỉ lệ: each card drawn is UR, SR or Normal by three percents (owner, 19/10: no weight per card; UR and SR are
 * typed, Normal is the rest), then any card of that tier with the same chance. The publisher can still move a card to
 * another tier. Kept on this phone; Sao chép copies the numbers as text to paste to Claude for everyone.
 */
export function RatePanel({ editable, onClose }: { editable: boolean; onClose: () => void }) {
  const [rates, setRates] = useState<Rates>(() => loadRates());
  const [copied, setCopied] = useState<"" | "ok" | "manual">("");
  const pool = useMemo(() => packPool(), []);
  const odds = useMemo(() => packOdds(rates), [rates]);

  function update(next: Rates) {
    saveRates(next);
    setRates(next);
    setCopied("");
  }

  function reset() {
    playUi("select");
    update(freshRates());
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

  const changed = rates.tiers.UR !== DEFAULT_TIERS.UR || rates.tiers.SR !== DEFAULT_TIERS.SR || Object.keys(rates.moved).length > 0;
  const foot = editable ? (
    <>
      <button type="button" className="shop-soft" onClick={reset} disabled={!changed}>
        {tr("Về mặc định")}
      </button>
      <button type="button" className="shop-main" onClick={() => void copy()}>
        {copied === "ok" ? tr("Đã sao chép") : tr("Sao chép")}
      </button>
    </>
  ) : undefined;

  return (
    <Panel title={tr("Tỉ lệ")} onClose={onClose} foot={foot}>
      <p className="rate-note">{tr("Mỗi lá rút ra là UR, SR hay Normal theo số % dưới đây; trong cùng bậc, lá nào cũng có cơ hội như nhau.")}</p>
      <div className="rate-tierbox">
        {TIERS.map((tier) => (
          <label key={tier} className={`rate-tierline is-${tier}`}>
            <b className={`po-tag is-${tier}`}>{tier}</b>
            {editable && tier !== "N" ? (
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.1}
                value={rates.tiers[tier]}
                aria-label={`${tier} %`}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (event.target.value !== "" && Number.isFinite(value)) update(withTier(rates, tier, value));
                }}
              />
            ) : (
              <span className="rate-tierval">{String(rates.tiers[tier]).replace(".", ",")}</span>
            )}
            <span>%</span>
            {tier === "N" && editable ? <small>{tr("phần còn lại")}</small> : null}
          </label>
        ))}
      </div>
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
      <p className="rate-note">{tr("Số % cạnh mỗi lá là cơ hội lá đó có trong 1 gói. 10 gói luôn có ít nhất 1 UR.")}</p>
      {editable ? <p className="rate-note">{tr("Bấm UR, SR, N cạnh một lá để đổi bậc lá đó. Chỉnh xong bấm Sao chép rồi gửi cho Claude.")}</p> : null}
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
              return (
                <div key={entry.id} className={`rate-row${moved ? " is-edited" : ""}`}>
                  <span className="rate-art" style={{ backgroundImage: `url(${thumb(entry)})` }} />
                  <div className="rate-main">
                    <div className="rate-line">
                      <span className="rate-name">
                        {tr(cardName(entry))}
                        {moved ? <small> ({TIER_NAME[naturalTier(entry)]} →)</small> : null}
                      </span>
                      <b className="rate-pct">{percent(odds.card[entry.id] ?? 0)}</b>
                    </div>
                    {editable ? (
                      <div className="rate-line">
                        <span className="rate-tiers">
                          {TIERS.map((option) => (
                            <button key={option} type="button" className={`rate-tier is-${option}${option === tier ? " on" : ""}`} onClick={() => option !== tier && update(moveCard(rates, entry, option))}>
                              {option}
                            </button>
                          ))}
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
            <button key={entry.id} type="button" className={`shop-card${owned.has(entry.id) ? " is-owned" : ""}`} onClick={() => onTap(entry)}>
              {monster ? <CardFace monster={monster} /> : <CardFace spellId={entry.id} />}
              <b className={`po-tag is-${tier}`}>{tier}</b>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
