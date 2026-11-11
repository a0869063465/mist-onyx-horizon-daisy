import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, Settings, Gift, Mail, Users, Trophy, Layers, ShoppingCart, BookOpen, RefreshCw } from "lucide-react";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";
import { useMail } from "@/lib/mail-box";
import { missionsReady, onMissions } from "@/lib/mission-store";
import { usePulse } from "@/lib/friend-state";
import { useEffect, useState } from "react";
import "@/home-lobby.css";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ name: "theme-color", content: "#0b1b2c" }] }),
  component: Home,
});

// Layout measured from the approved 702 × 1536 reference. All anchors are
// percentages of the same 9:20 stage, independent of the video dimensions.
function Home() {
  useLang();
  const mails = useMail();
  const friends = usePulse();
  const [quests, setQuests] = useState(false);
  useEffect(() => {
    setQuests(missionsReady());
    return onMissions(() => setQuests(missionsReady()));
  }, []);
  const sideItems = [
    { key: "attendance", label: "Điểm danh", icon: CalendarCheck },
    { key: "missions", label: "Nhiệm vụ", icon: ClipboardList, to: "/missions" as const, dot: quests },
    { key: "settings", label: "Cài đặt", icon: Settings, to: "/tune" as const },
    { key: "rewards", label: "Phần thưởng", icon: Gift },
    { key: "mail", label: "Thư", icon: Mail, to: "/mail" as const, dot: mails.some(row => !row.read || row.owing) },
    { key: "friends", label: "Bạn bè", icon: Users, to: "/friends" as const, dot: friends.asks > 0 },
  ];
  return (
    <main className="lobby">
      <div className="lobby-stage">
        <img className="lobby-background" src="/home-bg-video.jpg" alt="" draggable={false} />
        <video className="lobby-background" src="/home-bg.mp4" poster="/home-bg-video.jpg" autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
        <div className="lobby-bottom-shade" aria-hidden="true" />
        <nav className="lobby-shortcuts" aria-label={tr("Menu chính")}>
          {sideItems.map(({ key, label, icon: Icon, to, dot }, index) => {
            const content = <><Icon aria-hidden="true" /><span>{tr(label)}</span>{dot ? <i className="lobby-dot" aria-hidden="true" /> : null}</>;
            const className = `lobby-shortcut lobby-shortcut-${index}`;
            return to ? <Link key={key} to={to} className={className} onPointerDown={() => playUi("select")}>{content}</Link>
              : <button key={key} type="button" className={className} disabled aria-label={`${tr(label)} — ${tr("Sắp có")}`}>{content}</button>;
          })}
        </nav>
        <Link to="/modes" className="lobby-mode" onPointerDown={() => playUi("select")} aria-label={tr("Chọn chế độ chơi")}>
          <span className="lobby-mode-marker" aria-hidden="true" />
          <b>{tr("Đánh thường")}</b>
          <img src="/ui/home/season-cards.svg" alt="" draggable={false} />
          <RefreshCw aria-hidden="true" />
        </Link>
        <div className="lobby-play" aria-label={tr("Chơi")}>
          <button type="button" className="lobby-play-card" disabled aria-label="PvE — Phiêu lưu (sắp có)"><img src="/ui/home/pve.svg" alt="PvE · Phiêu lưu" draggable={false} /></button>
          <Link to="/modes" className="lobby-play-card" onPointerDown={() => playUi("confirm")} aria-label="PvP — Đấu hạng"><img src="/ui/home/pvp.svg" alt="PvP · Đấu hạng" draggable={false} /></Link>
        </div>
        <nav className="lobby-navigation" aria-label={tr("Điều hướng chính")}>
          <button type="button" disabled><Trophy aria-hidden="true" /><span>{tr("Xếp hạng")}</span></button>
          <Link to="/deck" onPointerDown={() => playUi("select")}><Layers aria-hidden="true" /><span>{tr("Bộ bài")}</span></Link>
          <Link to="/shop" onPointerDown={() => playUi("select")}><ShoppingCart aria-hidden="true" /><span>{tr("Cửa hàng")}</span></Link>
          <Link to="/collection" onPointerDown={() => playUi("select")}><BookOpen aria-hidden="true" /><span>{tr("Bộ sưu tập")}</span></Link>
        </nav>
      </div>
    </main>
  );
}
