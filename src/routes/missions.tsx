import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type CSSProperties } from "react";
import { Burst } from "@/components/shop/pack-opening";
import { useDaily, useWeekly, type DailyView, type WeeklyView } from "@/lib/daily-missions";
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
 * Hàng nhiệm vụ ngày (chủ game 05/11): mỗi trạng thái là NGUYÊN hàng cắt từ ảnh thiết kế, giữ khung, chữ, icon, ánh sáng.
 * xanh dương (đang làm) / vàng (đủ, chờ nhận) / xanh lá (đã nhận). Chỉ ống tiến độ xanh dương và chữ "n / mục tiêu" do code vẽ
 * (ống rỗng + viên số nằm sẵn trong ảnh, chữ số trong viên đã xoá); ô sao ở hàng vàng là nút nhận thưởng duy nhất bấm được.
 * Toạ độ là % của hàng (đo trên ảnh xanh dương 900 px): t/fh = mép trên và cao của phần đầy, c = tâm dọc của chữ số.
 */
const QROW = [
  { h: 170, t: 70.38, fh: 13.39, c: 77.08 },
  { h: 170, t: 69.01, fh: 13.39, c: 75.70 },
  { h: 170, t: 69.01, fh: 13.39, c: 75.70 },
  { h: 170, t: 69.70, fh: 13.05, c: 76.22 },
  { h: 170, t: 70.04, fh: 13.39, c: 76.73 },
  { h: 170, t: 70.04, fh: 13.39, c: 76.73 },
  { h: 170, t: 69.70, fh: 13.05, c: 76.22 },
  { h: 170, t: 69.35, fh: 13.39, c: 76.05 },
];
const FILL_ONE = 38.39;
const FILL_TWO = 40.47;
const FILL_END = 70.43;
const NUM_LEFT = 29.31;

function DailyCard({ row, at, daily }: { row: ListedMission; at: number; daily: DailyView }) {
  const q = QROW[at] ?? QROW[0];
  const done = daily.done(row);
  const claimed = daily.claimed(row);
  const ready = !claimed && done >= row.goal;
  const [fading, setFading] = useState(false);
  const [pop, setPop] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const left = row.goal >= 10 ? FILL_TWO : FILL_ONE;
  const full = FILL_END - left;
  const ratio = Math.min(1, done / row.goal);

  const press = () => {
    if (!ready) return;
    if (!daily.claim(row)) return;
    playReward("coin");
    playReward("done", 0.12);
    setFading(true);
    setPop((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFading(false), 700);
  };

  return (
    <li
      className={`mx-card is-q${ready ? " is-ready" : ""}${claimed ? " is-claimed" : ""}`}
      style={{ "--i": at, aspectRatio: `900 / ${q.h}` } as CSSProperties}
      aria-label={`${tr(row.title)} ${done} / ${row.goal}`}
    >
      {!claimed && !ready ? <img className="mx-q" src={`/ui/mission/q-b${at}.webp`} alt="" draggable={false} /> : null}
      {ready || (claimed && fading) ? <img className={`mx-q${claimed ? " is-under" : ""}`} src={`/ui/mission/q-g${at}.webp`} alt="" draggable={false} /> : null}
      {claimed ? <img className={`mx-q${fading ? " is-in" : ""}`} src={`/ui/mission/q-d${at}.webp`} alt="" draggable={false} /> : null}
      {!claimed && !ready ? (
        <>
          <i
            className="mx-fill"
            aria-hidden="true"
            style={{ left: `${left}%`, top: `${q.t}%`, height: `${q.fh}%`, width: `${full * ratio}%`, opacity: done > 0 ? 1 : 0 } as CSSProperties}
          />
          <b className={`mx-num${`${done} / ${row.goal}`.length > 6 ? " is-long" : ""}`} style={{ left: `${NUM_LEFT}%`, top: `${q.c}%` }}>
            {done} / {row.goal}
          </b>
        </>
      ) : null}
      {ready ? (
        <button type="button" className="mx-claim" aria-label={tr("Nhận thưởng")} onClick={press} style={{ backgroundImage: `url(/ui/mission/q-g${at}.webp)` }} />
      ) : null}
      {pop > 0 ? (
        <span key={pop} className="mx-pop" aria-hidden="true">
          <Burst count={16} />
          <em>+{row.stars}★</em>
        </span>
      ) : null}
    </li>
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
          style={{ left: `${star.star[0]}%`, top: `${star.star[1]}%`, width: `${star.starW * 1.0}%` }}
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
