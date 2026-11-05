import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type CSSProperties } from "react";
import { Burst } from "@/components/shop/pack-opening";
import { DailyCard } from "@/components/mission-card";
import { useDaily, useWeekly, type WeeklyView } from "@/lib/daily-missions";
import { WEEK_GEO } from "@/lib/weekly-geo";
import { DAILY_LIST, WEEKLY_LIST, type ListedMission } from "@/lib/mission-list";
import { tr, useLang } from "@/lib/i18n";
import { playReward, playUi } from "@/lib/sfx";

type Tab = "daily" | "weekly";

export const Route = createFileRoute("/missions")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => (search.tab === "weekly" ? { tab: "weekly" } : {}),
  component: MissionsPage,
});

/**
 * Nhiệm vụ (chủ game 04/11): nền, tiêu đề và hai nút tab cắt từ ảnh thiết kế của chủ game (`bg-day` / `bg-week`),
 * các hàng là khung GPT của chủ game (`rd*` / `rw*`), chỉ phủ lên ngôi sao + số thưởng (sao của chủ game) và bảo vật. Mọi toạ độ tính theo ảnh gốc 841×1870 (đơn vị `--u`), nên khớp ở mọi cỡ màn.
 * Tiến độ hiện chưa đếm (luật đếm làm sau): chữ và thanh trong ảnh đang là 0 / n.
 */
function MissionsPage() {
  useLang();
  const navigate = useNavigate();
  const tab: Tab = Route.useSearch().tab ?? "daily";
  const list = tab === "weekly" ? WEEKLY_LIST : DAILY_LIST;
  const daily = useDaily();
  const weekly = useWeekly();

  const pick = (next: Tab) => {
    if (next === tab) return;
    playUi("select");
    void navigate({ to: "/missions", search: next === "daily" ? {} : { tab: next }, replace: true });
  };

  return (
    <main className="mx-page">
      <div className={`mx is-${tab}`} style={{ backgroundImage: `url(/ui/mission/${tab === "weekly" ? "bg-week" : "bg-day"}.webp)` }}>
        <Link to="/" className="mx-back" aria-label={tr("Trở về")} data-sfx onPointerDown={() => playUi("soft")} />
        <div className="mx-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "daily"} aria-label={tr("Nhiệm vụ ngày")} className="mx-tab is-day" onClick={() => pick("daily")} />
          <button type="button" role="tab" aria-selected={tab === "weekly"} aria-label={tr("Nhiệm vụ tuần")} className="mx-tab is-week" onClick={() => pick("weekly")} />
        </div>
        <ol className="mx-list" key={tab}>
          {list.map((row, at) => (tab === "weekly" ? <WeeklyCard key={row.id} row={row} at={at} weekly={weekly} /> : <DailyCard key={row.id} row={row} at={at} daily={daily} />))}
        </ol>
      </div>
    </main>
  );
}

/**
 * Hàng nhiệm vụ tuần (chủ game 05/11): như hàng ngày, 3 trạng thái cắt nguyên từ ảnh (tím đang làm / vàng chờ nhận / xanh lá đã nhận).
 * Các hàng trong ảnh không có ô sao: ô sao ×2 (ảnh chủ game) chèn đè lên; ô sao sáng là nút nhận duy nhất. Chữ số trong viên "n / mục tiêu"
 * và chữ "3" của "(X3)" trong tên đã xoá khỏi ảnh, code vẽ lại (X3 → X2 → X1 → X0 khi nhận xong).
 */
const WEEK_FLASH = 1300;
function WeeklyCard({ row, at, weekly }: { row: ListedMission; at: number; weekly: WeeklyView }) {
  const repeat = row.repeat ?? 1;
  const claims = weekly.claims(row);
  const left = repeat - claims;
  const done = weekly.done(row);
  const [flash, setFlash] = useState(false);
  const [settle, setSettle] = useState(0);
  const [pop, setPop] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const finished = left <= 0;
  const view: "p" | "g" | "d" = flash || finished ? "d" : done >= row.goal ? "g" : "p";
  const geo = WEEK_GEO[view][at];
  const pg = WEEK_GEO.p[at];
  const star = WEEK_GEO[view === "d" ? "p" : view][at];

  const press = () => {
    if (view !== "g" || !weekly.claim(row)) return;
    playReward("coin");
    playReward("done", 0.12);
    setFlash(true);
    setPop((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setFlash(false);
      setSettle((n) => n + 1);
    }, WEEK_FLASH);
  };

  const tube = pg.tube ?? [70, 84];
  const mid = (tube[0] + tube[1]) / 2;
  const ratio = Math.min(1, done / row.goal);
  const fill = pg.fill ?? [40, 70];
  const digit = geo.digit;
  const text = `${done} / ${row.goal}`;

  return (
    <li
      className={`mx-card is-q is-wk is-v${view}`}
      style={{ "--i": at, aspectRatio: "900 / 196" } as CSSProperties}
      aria-label={`${tr(row.title)} ${done} / ${row.goal}`}
    >
      {view === "p" ? <img key={`p${settle}`} className={`mx-q${settle > 0 ? " is-in" : ""}`} src={`/ui/mission/w-p${at}.webp`} alt="" draggable={false} /> : null}
      {view === "g" || (view === "d" && flash) ? <img className={`mx-q${view === "d" ? " is-under" : ""}`} src={`/ui/mission/w-g${at}.webp`} alt="" draggable={false} /> : null}
      {view === "d" ? <img className={`mx-q${flash ? " is-in" : ""}`} src={`/ui/mission/w-d${at}.webp`} alt="" draggable={false} /> : null}
      {view === "p" ? (
        <>
          <i
            className="mx-fill is-wk"
            aria-hidden="true"
            style={{ left: `${fill[0]}%`, top: `${tube[0] + 1.3}%`, height: `${tube[1] - tube[0] - 2.6}%`, width: `${(fill[1] - fill[0]) * ratio}%`, opacity: done > 0 ? 1 : 0 } as CSSProperties}
          />
          <b className="mx-num is-wkn" style={{ left: `${pg.num?.[0] ?? 29.7}%`, top: `${mid}%` }}>
            {text}
          </b>
          <img className="mx-box" src={row.stars === 1 ? "/ui/mission/wk-star1.webp" : "/ui/mission/wk-star.webp"} alt="" draggable={false} style={{ left: `${star.star[0]}%`, top: `${star.star[1]}%`, width: `${star.starW * 1.0}%` }} />
        </>
      ) : null}
      {view === "g" ? (
        <button
          type="button"
          className="mx-box is-glow"
          aria-label={tr("Nhận thưởng")}
          onClick={press}
          style={{ left: `${star.star[0]}%`, top: `${star.star[1]}%`, width: `${star.starW * 0.8}%` }}
        >
          <img src={row.stars === 1 ? "/ui/mission/wk-glow1.webp" : "/ui/mission/wk-glow2.webp"} alt="" draggable={false} />
        </button>
      ) : null}
      {digit ? (
        <b
          className={`mx-dig is-${view}`}
          aria-hidden="true"
          style={{ left: `${digit[0]}%`, top: `${digit[1] + 0.6}%`, fontSize: `${(digit[2] * 196) / 900 / 0.69}cqw` }}
        >
          {Math.max(0, left)}
        </b>
      ) : null}
      {pop > 0 ? (
        <span key={pop} className="mx-pop" aria-hidden="true" style={{ left: `${star.star[0]}%`, top: `${star.star[1]}%` }}>
          <Burst count={16} />
          <em>+{row.stars}★</em>
        </span>
      ) : null}
    </li>
  );
}
