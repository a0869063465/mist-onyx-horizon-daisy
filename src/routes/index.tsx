import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { tr, useLang } from "@/lib/i18n";
import { artSrc } from "@/lib/catalog";
import { coverOf, loadBook } from "@/lib/deck-book";
import { playUi } from "@/lib/sfx";
import { MissionBoard } from "@/components/game/mission-panel";

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${-((i * 1.7) % 9).toFixed(2)}s`,
  duration: `${7 + ((i * 3) % 6)}s`,
  size: `${3 + (i % 3)}px`,
}));

// The status bar takes the sky blue of the menu picture's top, so the picture seems to run up to the edge (chủ game 23/10).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ name: "theme-color", content: "#5b93e6" }] }),
  component: Home,
});

type Tab = { key: string; label: string; icon: ReactNode; to?: "/shop" | "/collection"; go?: () => void };

function Home() {
  const [wins, setWins] = useState(0);
  const [missions, setMissions] = useState(false);
  const [face, setFace] = useState<string | null>(null);
  useLang();
  useEffect(() => {
    setWins(Number(localStorage.getItem("clash-wins") ?? "0") || 0);
    const book = loadBook();
    const entry = book.decks.find((row) => row.n === book.active) ?? book.decks[0] ?? null;
    setFace(entry ? coverOf(entry) : null);
  }, []);
  // Menu chính (chủ game 31/10): 4 thẻ bình hành mỗi bên, lú nửa ra từ mép màn hình; thẻ chưa có tính năng thì khoá.
  const left: Tab[] = [
    { key: "shop", label: "Cửa hàng", icon: <ShopIcon />, to: "/shop" },
    { key: "events", label: "Sự kiện", icon: <FlagIcon /> },
    { key: "missions", label: "Nhiệm vụ", icon: <ScrollIcon />, go: () => setMissions(true) },
    { key: "album", label: "Bộ sưu tập", icon: <AlbumIcon />, to: "/collection" },
  ];
  const right: Tab[] = [
    { key: "gifts", label: "Phần thưởng", icon: <GiftIcon /> },
    { key: "news", label: "Tin tức", icon: <NewsIcon /> },
    { key: "friends", label: "Bạn bè", icon: <FriendsIcon /> },
    { key: "mail", label: "Thư", icon: <MailIcon /> },
  ];
  return (
    <main className="home">
      <div className="home-stage">
        <img className="home-art" src="/home-bg.jpg" alt="Clash of the Beasts" draggable={false} />
        <div className="home-shade" aria-hidden="true" />
        <div className="home-embers" aria-hidden="true">
          {EMBERS.map((ember, index) => (
            <span
              key={index}
              style={{
                left: ember.left,
                width: ember.size,
                height: ember.size,
                animationDelay: ember.delay,
                animationDuration: ember.duration,
              }}
            />
          ))}
        </div>
        {wins > 0 ? (
          <p className="home-wins">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h16M5 20V9l3 2 4-6 4 6 3-2v11" />
            </svg>
            {tr("Thành đã phá")}: <strong>{wins}</strong>
          </p>
        ) : null}
        {/* Bánh răng Cài đặt (chủ game 31/10): mọi tuỳ chỉnh và Nhập mã. */}
        <Link to="/tune" className="home-gear" data-sfx onPointerDown={() => playUi("soft")} aria-label={tr("Cài đặt")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1L5.3 5.3" />
            <circle cx="12" cy="12" r="6.6" />
          </svg>
        </Link>
        <nav className="home-tabs is-left" aria-label="Menu trái">
          {left.map((tab, index) => (
            <SideTab key={tab.key} tab={tab} side="left" index={index} />
          ))}
        </nav>
        <nav className="home-tabs is-right" aria-label="Menu phải">
          {right.map((tab, index) => (
            <SideTab key={tab.key} tab={tab} side="right" index={index} />
          ))}
        </nav>
        <div className="home-base">
          {/* Hồ sơ: khung tạm, chưa có luật cấp và hạng (chủ game 31/10). */}
          <div className="home-profile">
            <span className="home-avatar">{face ? <img src={artSrc(face)} alt="" draggable={false} /> : null}</span>
            <span className="home-ranks">
              <b>{tr("Cấp")} 1</b>
              <i>{tr("Hạng")} —</i>
            </span>
          </div>
          <Link to="/modes" className="home-play" data-sfx onPointerDown={() => playUi("confirm")} aria-label="Vào đấu trường">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4l9 9M4 4h4l9 9M4 4v4l9 9M20 4l-9 9M20 4h-4M20 4v4M14 15l3 3M10 15l-3 3M15 19l4-4M9 19l-4-4" />
            </svg>
            <span>{tr("Chơi")}</span>
          </Link>
        </div>
      </div>
      {missions ? <MissionBoard onClose={() => setMissions(false)} /> : null}
    </main>
  );
}

function SideTab({ tab, side, index }: { tab: Tab; side: "left" | "right"; index: number }) {
  const shut = !tab.to && !tab.go;
  const inner = (
    <>
      {tab.icon}
      <span>{tr(tab.label)}</span>
      {shut ? <LockIcon /> : null}
    </>
  );
  const className = `home-tab is-${side}${shut ? " is-shut" : ""}`;
  const style = { animationDelay: `${0.3 + index * 0.08}s` };
  if (tab.to) {
    return (
      <Link to={tab.to} className={className} style={style} data-sfx onPointerDown={() => playUi("select")}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={shut}
      aria-disabled={shut}
      data-sfx={shut ? undefined : true}
      onPointerDown={shut ? undefined : () => playUi("select")}
      onClick={tab.go}
    >
      {inner}
    </button>
  );
}

function LockIcon() {
  return (
    <svg className="home-lock" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}

function ScrollIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h10.5a2 2 0 0 1 2 2V19a1.5 1.5 0 0 1-3 0v-1.5H4.5V5.5a2 2 0 0 1 2-2" />
      <path d="M8 8l1.2 1.2L11.5 7M8 12.5l1.2 1.2 2.3-2.2M13.5 8.2h3M13.5 12.7h3" />
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="4" width="11" height="15" rx="1.8" />
      <path d="M5.5 7.5v11A2.5 2.5 0 0 0 8 21h8.5" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M3 9h18M12 9v11M12 9c-1.5-4-6-4-5 0M12 9c1.5-4 6-4 5 0" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 15a4.5 4.5 0 0 1 6 4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9l1.6-5h14.8L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0" />
      <path d="M5 11.6V20h14v-8.4M10 20v-5h4v5" />
    </svg>
  );
}
