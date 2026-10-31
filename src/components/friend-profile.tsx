import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n";
import { artSrc } from "@/lib/catalog";
import { START_RANK, rankLabel } from "@/lib/rank";
import { readProfile, type FriendMode } from "@/lib/friends";
import { MODE_LABELS, PLAYER_NAME, playerId } from "@/lib/friend-state";
import { cleanProfile, EMPTY_PROFILE, favourites, winRate, type Profile } from "@/lib/profile";

const MODE_NAMES = { quick: "Đánh thường", custom: "Tuỳ chọn" } as const;

function day(at: number): string {
  const date = new Date(at);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(date.getDate())}/${two(date.getMonth() + 1)} ${two(date.getHours())}:${two(date.getMinutes())}`;
}

/**
 * Hồ sơ bạn bè (chủ game 31/10): hình nền = bìa bộ bài đang dùng, tên + cấp + hạng, hàng huy hiệu (chưa có),
 * số trận, tỉ lệ thắng, chế độ và bộ bài hay chơi, 10 trận gần nhất. Chỉ tính trận với người.
 */
export function FriendProfile({ friend, onClose }: { friend: string; onClose: () => void }) {
  const [view, setView] = useState<{ cover: string | null; mode: FriendMode | null; profile: Profile } | null | "fail">(null);

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
  return (
    <div className="fp" role="dialog" aria-label={tr(PLAYER_NAME)}>
      <div className="fp-bg" style={bg ? { backgroundImage: `url(${bg})` } : undefined} aria-hidden="true" />
      <button type="button" className="ml-back fp-close" aria-label={tr("Trở về")} onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 5L7.5 12l7 7" />
        </svg>
      </button>
      <div className="fp-card">
        <header className="fp-head">
          <span className="fp-face">
            <span className="fp-pic" style={bg ? { backgroundImage: `url(${bg})` } : undefined} />
            <em>lv 1</em>
          </span>
          <div>
            <h2>{tr(PLAYER_NAME)}</h2>
            <i>#{friend}</i>
            <span className="fp-rank">{tr(rankLabel(START_RANK.tier, START_RANK.level))}</span>
            <span className={`fr-state${ready?.mode ? " is-play" : ""}`}>
              {ready?.mode ? `${tr("Đang chơi")} ${tr(MODE_LABELS[ready.mode])}` : tr("Đang chờ")}
            </span>
          </div>
        </header>
        {view === "fail" ? <p className="fp-note">{tr("Không tải được hồ sơ.")}</p> : null}
        <section className="fp-box">
          <h3>{tr("Huy hiệu")}</h3>
          <p className="fp-none">{tr("Chưa có huy hiệu")}</p>
        </section>
        <section className="fp-stats">
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
        <section className="fp-box">
          <h3>{tr("Lịch sử trận đấu")}</h3>
          {profile.recent.length === 0 ? (
            <p className="fp-none">{tr("Chưa có trận nào với người chơi.")}</p>
          ) : (
            <ul className="fp-list">
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
          )}
        </section>
      </div>
    </div>
  );
}
