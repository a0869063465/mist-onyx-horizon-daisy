import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MissionCard } from "@/components/game/mission-panel";
import { WEEKLY_LIST } from "@/lib/mission-list";
import { dailyRows, type MissionRow } from "@/lib/missions";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";

type Tab = "daily" | "weekly";

export const Route = createFileRoute("/missions")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => (search.tab === "weekly" ? { tab: "weekly" } : {}),
  component: MissionsPage,
});

/**
 * Nhiệm vụ (chủ game 04/11): nền, tiêu đề và hai nút tab cắt từ ảnh thiết kế của chủ game (`bg-day` / `bg-week`),
 * các hàng là khung GPT của chủ game (`rd*` / `rw*`), chỉ phủ lên ngôi sao + số thưởng (sao của chủ game) và bảo vật. Mọi toạ độ tính theo ảnh gốc 841×1870 (đơn vị `--u`), nên khớp ở mọi cỡ màn.
 * Tiến độ Ngày đọc từ `missions.ts`; tab Tuần chưa đếm (khoá).
 */
function MissionsPage() {
  useLang();
  const navigate = useNavigate();
  const tab: Tab = Route.useSearch().tab ?? "daily";
  // Đọc tiến độ trên máy sau khi trang gắn, để trang dựng sẵn và trang trên máy khớp nhau.
  const [daily, setDaily] = useState<MissionRow[]>([]);
  useEffect(() => setDaily(dailyRows()), []);
  const list: MissionRow[] = tab === "weekly" ? WEEKLY_LIST.map((row) => ({ ...row, done: 0 })) : daily;

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
            <MissionCard key={row.id} row={row} at={at} done={row.done} />
          ))}
        </ol>
      </div>
    </main>
  );
}
