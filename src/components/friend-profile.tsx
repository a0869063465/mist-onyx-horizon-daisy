import { useEffect, useState, type ReactNode } from "react";
import { tr } from "@/lib/i18n";
import { artSrc } from "@/lib/catalog";
import { START_RANK, rankLabel } from "@/lib/rank";
import { readProfile, type FriendMode } from "@/lib/friends";
import { MODE_LABELS, PLAYER_NAME, playerId } from "@/lib/friend-state";
import { AlbumPic } from "@/components/collection/album-parts";
import { DeckDrawer, type SummarySeat } from "@/components/game/match-summary";
import { CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { cardName } from "@/lib/collection";
import { avgTurns, cleanProfile, EMPTY_PROFILE, favourites, winRate, type DeckLite, type Profile } from "@/lib/profile";

const MODE_NAMES = { quick: "Đánh thường", custom: "Tuỳ chọn" } as const;

function stamp(at: number): string {
  const date = new Date(at);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(date.getDate())}/${two(date.getMonth() + 1)}/${date.getFullYear()} ${two(date.getHours())}:${two(date.getMinutes())}`;
}

type Tab = "overview" | "history" | "stats" | "collection";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Tổng quan" },
  { key: "history", label: "Lịch sử đấu" },
  { key: "stats", label: "Chỉ số" },
  { key: "collection", label: "Bộ sưu tập" },
];

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="fp-cell">
      <span>{tr(label)}</span>
      <b>{value}</b>
    </div>
  );
}

const percent = (have: number, total: number) => (total ? Math.floor((have / total) * 100) : 0);

/**
 * Hồ sơ bạn bè (chủ game 31/10, theo ảnh Liên Quân: Lịch sử đấu, Chỉ số, Huy chương danh dự, Phần thưởng bộ sưu tập):
 * phần đầu (bố cục Tổng quan cũ) luôn hiện, 3 tab dưới cùng: Lịch sử đấu, Chỉ số, Bộ sưu tập. Chỉ tính trận với người.
 */
export function FriendProfile({ friend, onClose }: { friend: string; onClose: () => void }) {
  const [view, setView] = useState<{ cover: string | null; mode: FriendMode | null; profile: Profile } | null | "fail">(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [menu, setMenu] = useState<string | null>(null);
  const [deck, setDeck] = useState<{ label: string; cards: DeckLite } | null>(null);
  const [sheet, setSheet] = useState<{ id: string; kind: "monster" | "spell" } | null>(null);
  const [filter, setFilter] = useState<"all" | "quick" | "custom">("all");
  const [pick, setPick] = useState(0);

  useEffect(() => {
    let stop = false;
    readProfile({ data: { id: playerId(), friend } })
      .then((got) => {
        if (stop) return;
        if (!got.ok) setView("fail");
        else setView({ cover: got.cover, mode: got.mode, profile: cleanProfile(got.profile) ?? EMPTY_PROFILE });
      })
      .catch(() => !stop && setView("fail"));
    return () => {
      stop = true;
    };
  }, [friend]);

  const ready = view && view !== "fail" ? view : null;
  const profile = ready?.profile ?? EMPTY_PROFILE;
  const best = favourites(profile);
  const bg = ready?.cover ? artSrc(ready.cover, 1) : null;
  const pet = best.cover ? artSrc(best.cover, 1) : null;
  const turns = avgTurns(profile);
  const col = profile.collection;
  const albumsDone = col ? col.albums.filter((row) => row.total > 0 && row.have >= row.total).length : 0;
  const games = profile.recent.filter((game) => filter === "all" || game.mode === filter);
  const sets = col?.sets ?? [];
  const set = sets[Math.min(pick, Math.max(0, sets.length - 1))];
  const setHave = set ? set.cards.filter((card) => card.own).length : 0;
  const rate = (mode: "quick" | "custom") => {
    const played = profile.modes[mode];
    const wins = profile.winsBy?.[mode] ?? 0;
    return `${played ? Math.round((wins / played) * 100) : 0}% · ${wins}/${played}`;
  };

  return (
    <div className={`fp is-${tab}`} role="dialog" aria-label={tr(PLAYER_NAME)}>
      <div className="fp-bg" style={bg ? { backgroundImage: `url(${bg})` } : undefined} aria-hidden="true" />
      <header className="fp-bar">
        <button type="button" className="fp-back" aria-label={tr("Trở về")} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 4.5L6.5 12l9 7.5V4.5z" />
          </svg>
          <b>{tr("HỒ SƠ")}</b>
        </button>
        {tab === "history" ? (
          <label className="fp-select">
            <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label={tr("Lọc trận")}>
              <option value="all">{tr("Tất cả trận đấu")}</option>
              <option value="quick">{tr("Đánh thường")}</option>
              <option value="custom">{tr("Tuỳ chọn")}</option>
            </select>
          </label>
        ) : null}
      </header>
      <section className="fp-top">
        <span className="fp-face">
          <span className="fp-pic" style={bg ? { backgroundImage: `url(${bg})` } : undefined} />
          <em>1</em>
        </span>
        <div className="fp-id">
          <h2>{tr(PLAYER_NAME)}</h2>
          <span className="fp-rank">{tr(rankLabel(START_RANK.tier, START_RANK.level))}</span>
          <i>#{friend}</i>
          <span className={`fr-state${ready?.mode ? " is-play" : ""}`}>
            {ready?.mode ? `${tr("Đang chơi")} ${tr(MODE_LABELS[ready.mode])}` : tr("Đang chờ")}
          </span>
        </div>
      </section>
      {view === "fail" ? <p className="fp-note">{tr("Không tải được hồ sơ.")}</p> : null}
      <div className="fp-body" key={tab}>
        {tab === "overview" ? (
          <div className="fp-over">
            <section className="fp-badges-box">
              <h3>{tr("Huy hiệu")}</h3>
              <div className="fp-badges-row" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} />
                ))}
              </div>
              <p>{tr("Chưa có huy hiệu")}</p>
            </section>
      <section className="fp-quick">
              <div>
                <b>{profile.games}</b>
                <span>{tr("Số trận")}</span>
              </div>
              <div>
                <b>{winRate(profile)}%</b>
                <span>{tr("Tỉ lệ thắng")}</span>
              </div>
              <div>
                <b>{best.mode ? tr(MODE_NAMES[best.mode]) : "—"}</b>
                <span>{tr("Chế độ hay chơi")}</span>
              </div>
              <div>
                <span className="fp-deck" style={pet ? { backgroundImage: `url(${pet})` } : undefined} />
                <span>{tr("Bộ bài hay chơi")}</span>
              </div>
            </section>
          </div>
        ) : null}
        {tab === "history" ? (
          games.length === 0 ? (
            <p className="fp-none">{tr("Chưa có trận nào với người chơi.")}</p>
          ) : (
            <ul className="fp-games">
              {games.map((game) => {
                const art = game.cover ? artSrc(game.cover, 1) : null;
                return (
                  <li key={game.mid} className={game.win ? "is-win" : "is-loss"}>
                    <span className="fp-ava">
                      <span className="fp-ava-pic" style={art ? { backgroundImage: `url(${art})` } : undefined} />
                      <em>1</em>
                    </span>
                    <div className="fp-res">
                      <b>{tr(game.win ? "CHIẾN THẮNG" : "THẤT BẠI")}</b>
                      <span>{tr(MODE_NAMES[game.mode])}</span>
                    </div>
                    <div className="fp-meta">
                      <i>{game.turns ? `${game.turns} ${tr("lượt")}` : "—"}</i>
                      <time>{stamp(game.at)}</time>
                    </div>
                    <div className="fp-btns">
                      {menu === game.mid ? (
                        <>
                          <button
                            type="button"
                            className="fp-round is-blue"
                            disabled={!game.mine}
                            aria-label={tr("Bộ bài của bạn")}
                            onClick={() => {
                              setMenu(null);
                              if (game.mine) setDeck({ label: PLAYER_NAME, cards: game.mine });
                            }}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <rect x="5" y="4" width="10" height="14" rx="1.6" />
                              <path d="M9 6.5h8.4a1.6 1.6 0 0 1 1.6 1.6V19" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="fp-round is-red"
                            disabled={!game.foe}
                            aria-label={tr("Bộ bài đối thủ")}
                            onClick={() => {
                              setMenu(null);
                              if (game.foe) setDeck({ label: "Đối thủ", cards: game.foe });
                            }}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <rect x="5" y="4" width="10" height="14" rx="1.6" />
                              <path d="M9 6.5h8.4a1.6 1.6 0 0 1 1.6 1.6V19" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button type="button" className="fp-round" aria-label={tr("Xem bộ bài")} onClick={() => setMenu(game.mid)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8 7h11M8 12h11M8 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
                          </svg>
                        </button>
                      )}
                      <button type="button" className="fp-round" disabled aria-label={tr("Xem lại")}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5M4.5 4.5v4h4" />
                          <path d="M10.5 9l4.5 3-4.5 3z" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
        {tab === "stats" ? (
          <div className="fp-sheet">
            <div className="fp-grid2">
              <Row label="Trận" value={profile.games} />
              <Row label="Tỉ lệ thắng" value={`${winRate(profile)}%`} />
              <Row label="Thắng" value={profile.wins} />
              <Row label="Thua" value={profile.games - profile.wins} />
              <Row label="Chuỗi thắng dài nhất" value={profile.best ?? 0} />
              <Row label="Lối chơi (lượt trung bình)" value={turns ?? "—"} />
              <Row label="Đánh thường" value={rate("quick")} />
              <Row label="Tuỳ chọn" value={rate("custom")} />
            </div>
          </div>
        ) : null}
        {tab === "collection" ? (
          col ? (
            <div className="fp-coll">
              <div className="fp-total">
                <span className="fp-total-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="3.5" y="5" width="11" height="15" rx="1.6" />
                    <path d="M9 3.5h9.4a1.6 1.6 0 0 1 1.6 1.6v12.4" />
                  </svg>
                </span>
                <div>
                  <span>{tr("Tổng số lá")}</span>
                  <b>
                    {col.have}
                    <small>/{col.total}</small>
                  </b>
                </div>
              </div>
              <h3 className="fp-sec">{tr("BỘ SƯU TẬP")}</h3>
              <ul className="fp-albums">
                {col.albums.map((row) => {
                  const pct = percent(row.have, row.total);
                  return (
                    <li key={row.name} className={pct >= 100 ? "is-done" : ""}>
                      <span className="fp-album-ring" style={{ ["--p" as string]: `${pct}%` }}>
                        <span className="fp-album-pic" style={row.cover ? { backgroundImage: `url(${row.cover})` } : undefined} />
                      </span>
                      <b className="fp-album-pct">{pct}%</b>
                      <span className="fp-album-name">{tr(row.name)}</span>
                    </li>
                  );
                })}
              </ul>
              {set ? (
                <>
                  <h3 className="fp-sec">{tr("CÁC NHÓM BÀI")}</h3>
                  <div className="fp-sets">
                    <ul className="fp-set-list">
                      {sets.map((one, index) => {
                        const own = one.cards.filter((card) => card.own).length;
                        return (
                          <li key={one.name}>
                            <button type="button" className={index === pick ? "on" : ""} onClick={() => setPick(index)}>
                              <b>{tr(one.name)}</b>
                              <span>
                                {own}/{one.cards.length}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="fp-set">
                      <h4>{tr(set.name)}</h4>
                      <p>
                        {tr("THU THẬP TẤT CẢ")} <b>{setHave}/{set.cards.length}</b>
                      </p>
                      <div className="fp-set-grid">
                        {set.cards.map((card) => (
                          <span key={card.id} className="fp-set-cell">
                            <AlbumPic id={card.id} missing={!card.own} />
                            <em>{tr(cardName(card.id))}</em>
                          </span>
                        ))}
                      </div>
                      <div className={`fp-reward${setHave >= set.cards.length ? " is-done" : ""}`}>
                        <span className="fp-reward-star" aria-hidden="true">
                          ★
                        </span>
                        <div>
                          <b>{tr("PHẦN THƯỞNG")}</b>
                          <span>{set.reward}</span>
                        </div>
                        <i aria-hidden="true">{setHave >= set.cards.length ? "✓" : ""}</i>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="fp-none">{tr("Chưa có dữ liệu sưu tập.")}</p>
          )
        ) : null}
      </div>
      {deck ? (
        <DeckDrawer
          seat={{ label: deck.label, deck: deck.cards.name ?? null, cover: deck.cards.cover ?? null, board: "", cards: deck.cards } as SummarySeat}
          cards={deck.cards}
          leaving={false}
          onPick={setSheet}
          onClose={() => setDeck(null)}
        />
      ) : null}
      {sheet?.kind === "monster" ? <CardMonsterSheet id={sheet.id} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === "spell" ? <SpellSheet id={sheet.id} onClose={() => setSheet(null)} /> : null}
      <nav className="fp-tabs" role="tablist">
        {TABS.map((one) => (
          <button key={one.key} type="button" role="tab" aria-selected={tab === one.key} className={tab === one.key ? "on" : ""} onClick={() => setTab(one.key)}>
            {tr(one.label)}
          </button>
        ))}
      </nav>
    </div>
  );
}
