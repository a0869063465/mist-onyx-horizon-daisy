import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Row } from "@/components/game/mission-panel";
import { missionRows, type MissionRow } from "@/lib/missions";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";
import { useStars } from "@/lib/shop";

type Tab = "daily" | "weekly";

export const Route = createFileRoute("/missions")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => (search.tab === "weekly" ? { tab: "weekly" } : {}),
  component: MissionsPage,
});

const TABS: { key: Tab; label: string }[] = [
  { key: "daily", label: "NGÀY" },
  { key: "weekly", label: "TUẦN" },
];

/**
 * Nhiệm vụ (chủ game 04/11): trang riêng giống Tin tức và Bạn bè, 2 tab Ngày / Tuần. Tab Ngày là các nhiệm vụ đang có
 * (làm mới 0 giờ mỗi ngày). Tab Tuần chờ ảnh chi tiết của chủ game nên còn trống.
 */
function MissionsPage() {
  useLang();
  const navigate = useNavigate();
  const tab: Tab = Route.useSearch().tab ?? "daily";
  const stars = useStars();
  // Đọc từ máy sau khi trang gắn, để trang dựng sẵn và trang trên máy khớp nhau.
  const [daily, setDaily] = useState<MissionRow[]>([]);
  useEffect(() => setDaily(missionRows()), []);
  const weekly: MissionRow[] = [];
  const rows = tab === "daily" ? daily : weekly;
  const index = TABS.findIndex((one) => one.key === tab);

  const pick = (next: Tab) => {
    playUi("select");
    void navigate({ to: "/missions", search: next === "daily" ? {} : { tab: next }, replace: true });
  };

  return (
    <main className="ml mi" data-tab="news">
      <i className="ml-corner is-tl" aria-hidden="true" />
      <i className="ml-corner is-tr" aria-hidden="true" />
      <i className="ml-corner is-bl" aria-hidden="true" />
      <i className="ml-corner is-br" aria-hidden="true" />
      <header className="ml-head">
        <Link to="/" className="ml-back" aria-label={tr("Trở về")} data-sfx onPointerDown={() => playUi("soft")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 5L7.5 12l7 7" />
          </svg>
        </Link>
        <h1>{tr("NHIỆM VỤ")}</h1>
        <span className="ml-wallet" aria-label={tr("Sao của bạn")}>
          <i aria-hidden="true">★</i>
          <b>{stars}</b>
        </span>
      </header>
      <nav className="ml-tabs mi-tabs" role="tablist" style={{ ["--at" as string]: index }}>
        {TABS.map((one) => (
          <button key={one.key} type="button" role="tab" aria-selected={one.key === tab} className={one.key === tab ? "on" : ""} onClick={() => pick(one.key)}>
            <span>{tr(one.label)}</span>
          </button>
        ))}
        <i className="ml-ink" aria-hidden="true" />
      </nav>
      <section className="ml-pane" key={tab}>
        {tab === "weekly" ? (
          <div className="ml-empty">
            <p>{tr("Nhiệm vụ tuần sắp có.")}</p>
          </div>
        ) : (
          <ol className="mp-list mi-list">
            {rows.map((row, at) => (
              <Row key={row.id} row={row} at={at} done={row.done} flash={false} chip={() => undefined} />
            ))}
          </ol>
        )}
      </section>
      <footer className="mi-foot">{tab === "daily" ? tr("Làm mới lúc 0 giờ mỗi ngày") : ""}</footer>
    </main>
  );
}
