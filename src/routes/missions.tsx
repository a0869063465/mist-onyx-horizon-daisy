import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { DAILY_LIST, WEEKLY_LIST, type ListedMission } from "@/lib/mission-list";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";

type Tab = "daily" | "weekly";

export const Route = createFileRoute("/missions")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => (search.tab === "weekly" ? { tab: "weekly" } : {}),
  component: MissionsPage,
});

const ART = (name: string) => `/ui/mission/${name}.webp`;

/**
 * Nhiệm vụ (chủ game 04/11): nền, tiêu đề và hai nút tab cắt từ ảnh thiết kế của chủ game (`bg-day` / `bg-week`),
 * các hàng do code vẽ. Mọi toạ độ tính theo ảnh gốc 841×1870 (đơn vị `--u`), nên khớp ở mọi cỡ màn.
 * Tiến độ hiện chưa đếm (luật đếm làm sau), sao là ngôi sao của chủ game.
 */
function MissionsPage() {
  useLang();
  const navigate = useNavigate();
  const tab: Tab = Route.useSearch().tab ?? "daily";
  const list = tab === "weekly" ? WEEKLY_LIST : DAILY_LIST;

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
          {list.map((row, at) => (
            <Card key={row.id} row={row} at={at} />
          ))}
        </ol>
      </div>
    </main>
  );
}

function Card({ row, at }: { row: ListedMission; at: number }) {
  const done = 0;
  const treasure = row.art.startsWith("t-");
  return (
    <li className={`mx-card${row.locked ? " is-locked" : ""}`} style={{ "--i": at } as CSSProperties}>
      <span className={`mx-art${treasure ? " is-treasure" : ""}`}>
        <img src={ART(row.art)} alt="" draggable={false} />
      </span>
      <span className="mx-body">
        <b className="mx-title">{tr(row.title)}</b>
        <span className="mx-bar" style={{ "--p": Math.min(1, done / row.goal) } as CSSProperties}>
          <i />
          <em>
            {done} / {row.goal}
          </em>
        </span>
      </span>
      <span className="mx-prize">
        <img src="/ui/star.webp" alt="" draggable={false} />
        <b>×{row.stars}</b>
      </span>
      {row.locked ? <span className="mx-soon">{tr("Sắp có")}</span> : null}
    </li>
  );
}
