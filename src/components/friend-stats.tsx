import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n";
import { artSrc } from "@/lib/catalog";
import { START_RANK, rankLabel } from "@/lib/rank";
import { rankBoard, rankRadar, type BoardView, type RadarView } from "@/lib/friends";
import { PLAYER_NAME, playerId } from "@/lib/friend-state";
import { RADAR_AXES, RADAR_MIN, STAT_LIST, type Ranked, type StatKey } from "@/lib/ranking";

type Pick = StatKey | "overview";
type Scope = "all" | "friends";

/** Số hiện ở cuối mỗi hàng của bảng xếp hạng. */
function format(stat: StatKey, v: number | null): string {
  if (v === null) return "—";
  switch (stat) {
    case "rank":
      return tr(rankLabel(START_RANK.tier, START_RANK.level));
    case "level":
      return "lv 1";
    case "games":
      return `${v} ${tr("trận")}`;
    case "winrate":
      return `${String(v).replace(".", ",")}%`;
    case "style":
      return `${String(v).replace(".", ",")} ${tr("lượt")}`;
    case "collection":
      return `${v} ${tr("lá")}`;
    case "streak":
      return `${v}`;
  }
}

function Row({ row, stat, me, sel, pin, onTap }: { row: Ranked; stat: StatKey; me: boolean; sel: boolean; pin?: boolean; onTap: (row: Ranked) => void }) {
  const art = row.cover ? artSrc(row.cover, 1) : null;
  return (
    <li className={`fs-row is-p${Math.min(row.pos, 4)}${me ? " is-me" : ""}${sel ? " is-sel" : ""}`}>
      <button type="button" className="fs-hit" onClick={() => onTap(row)} aria-label={`${tr(PLAYER_NAME)} ${row.id}`}>
        <b className="fs-pos">{row.pos}</b>
        <span className="fs-ava">
          <span style={art ? { backgroundImage: `url(${art})` } : undefined} />
        </span>
        <span className="fs-who">
          <b>{tr(PLAYER_NAME)}</b>
          <span className="fs-sub">
            <svg className="fs-emblem" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 4.5 6v6.2c0 4.3 3.2 8.2 7.5 9.8 4.3-1.6 7.5-5.5 7.5-9.8V6z" />
              <path d="M12 7.2 13.6 10.6 17.3 11l-2.8 2.5.8 3.6L12 15.3l-3.3 1.8.8-3.6L6.7 11l3.7-.4z" />
            </svg>
            <i>{tr(rankLabel(START_RANK.tier, START_RANK.level))}</i>
            <em aria-hidden="true">|</em>
            <span className="fs-val">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M6 .8 11.2 6 6 11.2.8 6z" />
              </svg>
              {format(stat, row.v)}
            </span>
            {pin ? (
              <span className="fs-ask" aria-hidden="true">
                ?
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

const CX = 100;
const CY = 100;
const RAD = 70;

function Radar({ view }: { view: RadarView | null }) {
  const point = (i: number, ratio: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / RADAR_AXES.length;
    return [CX + Math.cos(angle) * RAD * ratio, CY + Math.sin(angle) * RAD * ratio] as const;
  };
  const ring = (ratio: number) => RADAR_AXES.map((_, i) => point(i, ratio).join(",")).join(" ");
  const shape = view?.ok && view.enough ? RADAR_AXES.map((axis, i) => point(i, (view.scores[axis] ?? 0) / 5).join(",")).join(" ") : "";
  return (
    <div className="fs-radar">
      <svg viewBox="0 0 200 200" role="img" aria-label={tr("Tổng quan")}>
        <circle cx={CX} cy={CY} r={RAD + 14} className="fs-ring-out" />
        {[1, 2, 3, 4, 5].map((n) => (
          <polygon key={n} points={ring(n / 5)} className="fs-ring" />
        ))}
        {RADAR_AXES.map((_, i) => (
          <line key={i} x1={CX} y1={CY} x2={point(i, 1)[0]} y2={point(i, 1)[1]} className="fs-spoke" />
        ))}
        {shape ? <polygon points={shape} className="fs-shape" /> : null}
        {shape
          ? RADAR_AXES.map((axis, i) => {
              const [x, y] = point(i, (view!.ok ? view!.scores[axis] ?? 0 : 0) / 5);
              return <circle key={axis} cx={x} cy={y} r="2.6" className="fs-dot" />;
            })
          : null}
        {RADAR_AXES.map((axis, i) => {
          const [x, y] = point(i, 1.3);
          const name = STAT_LIST.find((one) => one.key === axis)?.label ?? axis;
          return (
            <text key={axis} x={x} y={y} className="fs-axis" textAnchor="middle" dominantBaseline="middle">
              {tr(name)}
            </text>
          );
        })}
        {view?.ok && view.enough
          ? RADAR_AXES.map((axis, i) => {
              const [x, y] = point(i, 1.3);
              return (
                <text key={`s${axis}`} x={x} y={y + 9} className="fs-score" textAnchor="middle" dominantBaseline="middle">
                  {view.scores[axis] ?? 0}/5
                </text>
              );
            })
          : null}
      </svg>
      {view?.ok && !view.enough ? (
        <p className="fs-none">
          {tr("Chưa đủ dữ liệu")} ({view.total}/{RADAR_MIN})
        </p>
      ) : null}
    </div>
  );
}

/**
 * Chỉ số trong hồ sơ (chủ game 31/10, theo bảng xếp hạng Liên Quân): cột trái là danh sách chỉ số, mỗi chỉ số một bảng
 * xếp hạng, mục cuối Tổng quan là mạng nhện x/5. Hàng của người đang xem hồ sơ nằm ghim ở cuối kèm hạng.
 */
export function StatBoard({ friend, onOpen }: { friend: string; onOpen?: (id: string) => void }) {
  const [pick, setPick] = useState<Pick>("games");
  const [scope, setScope] = useState<Scope>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [board, setBoard] = useState<BoardView | null>(null);
  const [radar, setRadar] = useState<RadarView | null>(null);
  /** Hàng đang chọn (viền vàng, hình nền + thanh HẠNG theo người đó); bấm lại hàng đang chọn thì mở hồ sơ. */
  const [sel, setSel] = useState<Ranked | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let stop = false;
    setBoard(null);
    setRadar(null);
    const mine = playerId();
    if (pick === "overview") {
      rankRadar({ data: { id: mine, subject: friend, scope } })
        .then((got) => !stop && setRadar(got))
        .catch(() => !stop && setRadar({ ok: false }));
    } else {
      rankBoard({ data: { id: mine, subject: friend, stat: pick, scope, q: search } })
        .then((got) => {
          if (stop) return;
          setBoard(got);
          setSel(got.ok ? got.first ?? null : null);
        })
        .catch(() => !stop && setBoard({ ok: false }));
    }
    return () => {
      stop = true;
    };
  }, [friend, pick, scope, search]);

  const stat = pick === "overview" ? null : pick;
  const subject = board?.ok ? board.subject : null;
  const shown = pick === "overview" ? null : sel;
  const shownArt = shown?.cover ? artSrc(shown.cover, 1) : null;
  const tap = (row: Ranked) => {
    if (sel?.id === row.id) onOpen?.(row.id);
    else setSel(row);
  };

  return (
    <div className="fs">
      {shownArt ? <div className="fs-stage" style={{ backgroundImage: `url(${shownArt})` }} aria-hidden="true" /> : null}
      <div className="fs-tools">
        <h3 className="fs-title">
          {tr("BẢNG XẾP HẠNG")}
          <i aria-hidden="true">?</i>
        </h3>
        <label className="fs-select">
          <select value={scope} onChange={(event) => setScope(event.target.value as Scope)} aria-label={tr("Phạm vi xếp hạng")}>
            <option value="all">{tr("Toàn bộ")}</option>
            <option value="friends">{tr("Bạn bè")}</option>
          </select>
        </label>
        <label className="fs-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="M15 15l5.5 5.5" />
          </svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Tìm bạn")} maxLength={8} disabled={pick === "overview"} />
        </label>
      </div>
      <div className="fs-main">
        <nav className="fs-nav" aria-label={tr("Chỉ số")}>
          {STAT_LIST.map((one) => (
            <button key={one.key} type="button" className={pick === one.key ? "on" : ""} onClick={() => setPick(one.key)}>
              {tr(one.label)}
            </button>
          ))}
          <button type="button" className={pick === "overview" ? "on" : ""} onClick={() => setPick("overview")}>
            {tr("Tổng quan")}
          </button>
        </nav>
        <div className="fs-panel">
          {pick === "overview" ? (
            radar === null ? (
              <p className="fs-none">{tr("Đang tải…")}</p>
            ) : radar.ok ? (
              <Radar view={radar} />
            ) : (
              <p className="fs-none">{tr("Không tải được bảng xếp hạng.")}</p>
            )
          ) : board === null ? (
            <p className="fs-none">{tr("Đang tải…")}</p>
          ) : !board.ok ? (
            <p className="fs-none">{tr("Không tải được bảng xếp hạng.")}</p>
          ) : (
            <>
              <ul className="fs-rows">
                {board.rows.length === 0 ? <li className="fs-none">{tr("Không có ai khớp.")}</li> : null}
                {board.rows.map((row) => (
                  <Row key={row.id} row={row} stat={stat!} me={row.id === friend} sel={sel?.id === row.id} onTap={tap} />
                ))}
              </ul>
              {subject ? (
                <ul className="fs-pin">
                  <Row row={subject} stat={stat!} me pin sel={sel?.id === subject.id} onTap={tap} />
                </ul>
              ) : null}
              {shown ? (
                <button type="button" className="fs-first" onClick={() => onOpen?.(shown.id)}>
                  <b>
                    {tr("HẠNG")} {shown.pos}
                  </b>
                  <i>{shown.id}</i>
                  <span>
                    {shown.wins} {tr("Trận Thắng")}
                    <br />
                    {shown.games - shown.wins} {tr("Trận Thua")}
                  </span>
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
