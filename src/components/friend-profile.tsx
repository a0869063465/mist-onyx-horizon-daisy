import { useEffect, useState, type ReactNode } from "react";
import { tr } from "@/lib/i18n";
import { artSrc } from "@/lib/catalog";
import { START_RANK, rankLabel } from "@/lib/rank";
import { readProfile, type FriendMode } from "@/lib/friends";
import { MODE_LABELS, PLAYER_NAME, playerId } from "@/lib/friend-state";
import { avgTurns, cleanProfile, EMPTY_PROFILE, favourites, winRate, type Profile } from "@/lib/profile";

const MODE_NAMES = { quick: "Đánh thường", custom: "Tuỳ chọn" } as const;

function day(at: number): string {
  const date = new Date(at);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(date.getDate())}/${two(date.getMonth() + 1)} ${two(date.getHours())}:${two(date.getMinutes())}`;
}

type Tab = "overview" | "history" | "stats" | "badges" | "collection";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Tổng quan" },
  { key: "history", label: "Lịch sử đấu" },
  { key: "stats", label: "Chỉ số" },
  { key: "badges", label: "Huy hiệu" },
  { key: "collection", label: "Bộ sưu tập" },
];
const BADGE_SLOTS = 9;

function Tile({ value, label, unit, wide }: { value: ReactNode; label: string; unit?: string; wide?: boolean }) {
  return (
    <div className={`fp-tile${wide ? " is-wide" : ""}`}>
      <b>
        {value}
        {unit ? <small>{unit}</small> : null}
      </b>
      <span>{tr(label)}</span>
    </div>
  );
}

function Bar({ label, have, total }: { label: string; have: number; total: number }) {
  const pct = total ? Math.round((have / total) * 100) : 0;
  return (
    <div className={`fp-bar${total && have >= total ? " is-done" : ""}`}>
      <span>
        <em style={{ fontStyle: "normal" }}>{label}</em>
        <b>
          {have}/{total}
        </b>
      </span>
      <i>
        <b style={{ width: `${pct}%` }} />
      </i>
    </div>
  );
}

/**
 * Hồ sơ bạn bè (chủ game 31/10): hero (hình nền = bìa bộ bài, chân dung, tên, cấp, hạng, trạng thái) và 5 tab dưới
 * cùng: Tổng quan, Lịch sử đấu, Chỉ số, Huy hiệu (chưa có thành tựu), Bộ sưu tập. Chỉ tính trận với người.
 */
export function FriendProfile({ friend, onClose }: { friend: string; onClose: () => void }) {
  const [view, setView] = useState<{ cover: string | null; mode: FriendMode | null; profile: Profile } | null | "fail">(null);
  const [tab, setTab] = useState<Tab>("overview");

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
  const doneAlbums = col ? col.albums.filter((row) => row.total > 0 && row.have >= row.total).length : 0;
  const rate = (mode: "quick" | "custom") => {
    const played = profile.modes[mode];
    return { played, wins: profile.winsBy?.[mode] ?? 0 };
  };
  return (
    <div className="fp" role="dialog" aria-label={tr(PLAYER_NAME)}>
      <div className="fp-bg" style={bg ? { backgroundImage: `url(${bg})` } : undefined} aria-hidden="true" />
      <button type="button" className="ml-back fp-close" aria-label={tr("Trở về")} onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 5L7.5 12l7 7" />
        </svg>
      </button>
      <header className="fp-hero">
        <span className="fp-face">
          <span className="fp-pic" style={bg ? { backgroundImage: `url(${bg})` } : undefined} />
          <em>lv 1</em>
        </span>
        <h2>{tr(PLAYER_NAME)}</h2>
        <i>#{friend}</i>
        <span className="fp-rank">{tr(rankLabel(START_RANK.tier, START_RANK.level))}</span>
        <span className={`fr-state${ready?.mode ? " is-play" : ""}`}>
          {ready?.mode ? `${tr("Đang chơi")} ${tr(MODE_LABELS[ready.mode])}` : tr("Đang chờ")}
        </span>
      </header>
      {view === "fail" ? <p className="fp-note">{tr("Không tải được hồ sơ.")}</p> : null}
      <div className="fp-body" key={tab}>
        {tab === "overview" ? (
          <div className="fp-page">
            <div className="fp-tiles">
              <Tile value={winRate(profile)} unit="%" label="Tỉ lệ thắng" />
              <Tile value="1" label="Cấp độ" />
              <Tile value={profile.games} label="Số trận" />
              <Tile value={turns ?? "—"} unit={turns ? tr("lượt") : undefined} label="Lối chơi (số lượt trung bình)" />
              <Tile wide value={col ? `${col.have}/${col.total}` : "—"} unit={col ? tr("lá") : undefined} label="Bộ sưu tập" />
            </div>
            <div className="fp-box">
              <h3>{tr("Hay chơi")}</h3>
              <div className="fp-fav">
                <span className="fp-deck" style={pet ? { backgroundImage: `url(${pet})` } : undefined} />
                <span>{best.mode ? tr(MODE_NAMES[best.mode]) : tr("Chưa có trận nào với người chơi.")}</span>
              </div>
            </div>
          </div>
        ) : null}
        {tab === "history" ? (
          profile.recent.length === 0 ? (
            <p className="fp-none">{tr("Chưa có trận nào với người chơi.")}</p>
          ) : (
            <ul className="fp-list fp-page">
              {profile.recent.map((game) => {
                const art = game.cover ? artSrc(game.cover, 1) : null;
                return (
                  <li key={game.mid} className={game.win ? "is-win" : "is-loss"}>
                    <span className="fp-deck is-small" style={art ? { backgroundImage: `url(${art})` } : undefined} />
                    <b>{tr(game.win ? "Thắng" : "Thua")}</b>
                    <span>{tr(MODE_NAMES[game.mode])}</span>
                    <i>{day(game.at)}</i>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
        {tab === "stats" ? (
          <div className="fp-page">
            <div className="fp-tiles">
              <Tile value={profile.wins} label="Thắng" />
              <Tile value={profile.games - profile.wins} label="Thua" />
              <Tile value={winRate(profile)} unit="%" label="Tỉ lệ thắng" />
              <Tile value={profile.best ?? 0} label="Chuỗi thắng dài nhất" />
            </div>
            <div className="fp-box">
              <h3>{tr("Tỉ lệ thắng theo chế độ")}</h3>
              {(["quick", "custom"] as const).map((mode) => {
                const row = rate(mode);
                return <Bar key={mode} label={tr(MODE_NAMES[mode])} have={row.wins} total={row.played} />;
              })}
            </div>
          </div>
        ) : null}
        {tab === "badges" ? (
          <div className="fp-page">
            <div className="fp-badges">
              {Array.from({ length: BADGE_SLOTS }, (_, i) => (
                <span key={i} className="fp-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
              ))}
            </div>
            <p className="fp-soon">{tr("Sắp có")}</p>
          </div>
        ) : null}
        {tab === "collection" ? (
          <div className="fp-page">
            <div className="fp-tiles">
              <Tile value={col ? `${col.have}/${col.total}` : "—"} unit={col ? tr("lá") : undefined} label="Số lá có" />
              <Tile value={col ? `${doneAlbums}/${col.albums.length}` : "—"} label="Album hoàn thành" />
            </div>
            {col && col.albums.length ? (
              <div className="fp-box">
                <h3>{tr("Tiến độ album")}</h3>
                {col.albums.map((row) => (
                  <Bar key={row.name} label={tr(row.name)} have={row.have} total={row.total} />
                ))}
              </div>
            ) : (
              <p className="fp-none">{tr("Chưa có dữ liệu sưu tập.")}</p>
            )}
          </div>
        ) : null}
      </div>
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
