import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type CSSProperties } from "react";
import { Burst } from "@/components/shop/pack-opening";
import { useDaily, type DailyView } from "@/lib/daily-missions";
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
          {list.map((row, at) => (tab === "weekly" ? <Card key={row.id} row={row} at={at} /> : <DailyCard key={row.id} row={row} at={at} daily={daily} />))}
        </ol>
      </div>
    </main>
  );
}

function Card({ row, at }: { row: ListedMission; at: number }) {
  const done = 0;
  return (
    <li className={`mx-card${row.locked ? " is-locked" : ""}`} style={{ "--i": at, "--p": Math.min(1, done / row.goal) } as CSSProperties} aria-label={`${tr(row.title)} ${done} / ${row.goal}`}>
      <img className="mx-row" src={`/ui/mission/${row.row}.webp`} alt="" draggable={false} />
      <i className="mx-fill" aria-hidden="true" />
      {row.relic ? (
        <span className="mx-relic" aria-hidden="true">
          <img src={`/ui/mission/${row.relic}.webp`} alt="" draggable={false} />
        </span>
      ) : null}
      <span className="mx-prize" aria-hidden="true">
        <img src="/ui/star.webp" alt="" draggable={false} />
        <b>×{row.stars}</b>
      </span>
      {row.locked ? <span className="mx-soon">{tr("Sắp có")}</span> : null}
    </li>
  );
}

/**
 * Hàng nhiệm vụ ngày (chủ game 05/11): mỗi trạng thái là NGUYÊN hàng cắt từ ảnh thiết kế, giữ khung, chữ, icon, ánh sáng.
 * xanh dương (đang làm) / vàng (đủ, chờ nhận) / xanh lá (đã nhận). Chỉ ống tiến độ xanh dương và chữ "n / mục tiêu" do code vẽ
 * (ống rỗng + viên số nằm sẵn trong ảnh, chữ số trong viên đã xoá); ô sao ở hàng vàng là nút nhận thưởng duy nhất bấm được.
 * Toạ độ là % của hàng (đo trên ảnh xanh dương 900 px): t/fh = mép trên và cao của phần đầy, c = tâm dọc của chữ số.
 */
const QROW = [
  { h: 175, t: 70.37, fh: 13.01, c: 76.88 },
  { h: 173, t: 68.49, fh: 13.16, c: 75.07 },
  { h: 173, t: 68.15, fh: 13.16, c: 74.73 },
  { h: 170, t: 68.67, fh: 13.05, c: 75.19 },
  { h: 173, t: 68.82, fh: 13.16, c: 75.4 },
  { h: 173, t: 68.82, fh: 13.16, c: 75.4 },
  { h: 173, t: 67.81, fh: 12.82, c: 74.22 },
  { h: 170, t: 68.32, fh: 13.39, c: 75.02 },
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
