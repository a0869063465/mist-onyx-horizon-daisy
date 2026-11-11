import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, Settings, Gift, Mail, Users, Trophy, Layers, ShoppingCart, BookOpen, RefreshCw, Zap, Swords, X, Check } from "lucide-react";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";
import { useMail } from "@/lib/mail-box";
import { missionsReady, onMissions } from "@/lib/mission-store";
import { usePulse } from "@/lib/friend-state";
import { useEffect, useRef, useState } from "react";
import "@/home-lobby.css";
import { useStars } from "@/lib/shop";
import { artSrc } from "@/lib/catalog";
import { coverOf, loadBook } from "@/lib/deck-book";
import { START_RANK, rankLabel } from "@/lib/rank";
import { playerId } from "@/lib/friend-state";
import { FriendProfile } from "@/components/friend-profile";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ name: "theme-color", content: "#0b1b2c" }] }),
  component: Home,
});

// Layout measured from the approved 702 × 1536 reference. All anchors are
// percentages of the same 9:20 stage, independent of the video dimensions.

type LobbyMode = "ai" | "quick" | "ranked" | "custom";
const lobbyModes: { key: LobbyMode; label: string; description: string; background: string }[] = [
  { key: "ai", label: "Đánh với máy", description: "Đấu với máy", background: "/art/spells/thanh-dia-thien-su.jpg" },
  { key: "quick", label: "Đánh thường", description: "Đấu với người chơi", background: "/art/spells/nui.jpg" },
  { key: "ranked", label: "Xếp hạng", description: "Tranh tài xếp hạng — Sắp có", background: "/env/rung-ram.jpg" },
  { key: "custom", label: "Tuỳ chọn", description: "Tạo phòng hoặc nhập mã", background: "/art/spells/thanh-dia-thien-su.jpg" },
];

function ModeSymbol({ mode }: { mode: LobbyMode }) {
  if (mode === "quick") return <Zap aria-hidden="true" />;
  if (mode === "custom") return <Swords aria-hidden="true" />;
  if (mode === "ranked") return <Trophy aria-hidden="true" />;
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 53h32v6H15v-6h2Zm4-4c0-10 14-14 14-23l-9 6-11-5 7-13 12-5 4-7 5 12c11 12 9 24 6 35H21Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="m24 23 4-2M39 18c8 13 6 20 3 26" fill="none" stroke="#12283b" strokeWidth="3" strokeLinecap="round"/></svg>;
}

function Home() {
  useLang();
  const stars = useStars();
  const picker = useRef<HTMLDialogElement>(null);
  const [selectedMode, setSelectedMode] = useState<LobbyMode>("quick");
  useEffect(() => {
    const saved = localStorage.getItem("clash-play-mode");
    if (saved === "ai" || saved === "quick" || saved === "custom") setSelectedMode(saved);
  }, []);
  const selected = lobbyModes.find(item => item.key === selectedMode)!;
  function openPicker() { playUi("select"); picker.current?.showModal(); }
  function selectMode(mode: LobbyMode) {
    if (mode === "ranked") return;
    setSelectedMode(mode);
    localStorage.setItem("clash-play-mode", mode);
    playUi("confirm");
    picker.current?.close();
  }
  const [mine, setMine] = useState<string | null>(null);
  const [face, setFace] = useState<string | null>(null);
  useEffect(() => {
    const book = loadBook();
    const entry = book.decks.find(row => row.n === book.active) ?? book.decks[0];
    setFace(entry ? coverOf(entry) : null);
  }, []);
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
        <div className="lobby-account">
          <div className="lobby-currencies" aria-label={tr("Số sao")}>
            <span><i className="lobby-star" aria-hidden="true">★</i><b>{stars}</b></span>
            <span title={tr("Sao cầu vồng — sắp có")}><i className="lobby-star is-rainbow" aria-hidden="true">★</i><b>—</b></span>
          </div>
          <button type="button" className="lobby-profile" onClick={() => { playUi("select"); setMine(playerId()); }} aria-label={tr("Hồ sơ")}>
            <span><b>{tr("Người chơi")}</b><small>{tr(rankLabel(START_RANK.tier, START_RANK.level))}</small></span>
            <i className="lobby-avatar">{face ? <img src={artSrc(face)} alt="" draggable={false} /> : null}</i>
          </button>
        </div>
        <button type="button" className="lobby-mode" onClick={openPicker} aria-label={tr("Chọn chế độ chơi")} aria-haspopup="dialog">
          <span className="lobby-mode-marker" aria-hidden="true" />
          <b>{tr(selected.label)}</b>
          <img src="/ui/home/season-cards.svg" alt="" draggable={false} />
          <span className={`lobby-bar-symbol is-${selectedMode}`}><ModeSymbol mode={selectedMode} /></span>
          <RefreshCw aria-hidden="true" />
        </button>
        <div className="lobby-play" aria-label={tr("Chơi")}>
          <button type="button" className="lobby-play-card" disabled aria-label="PvE — Phiêu lưu (sắp có)"><img src="/ui/home/pve.svg" alt="PvE · Phiêu lưu" draggable={false} /></button>
          <Link to="/modes" className="lobby-play-card" onPointerDown={() => playUi("confirm")} aria-label="PvP — Đấu hạng"><img src="/ui/home/pvp.svg" alt="PvP · Đấu hạng" draggable={false} /></Link>
        </div>
        <dialog ref={picker} className="lobby-picker" aria-labelledby="lobby-picker-title" onClick={event => {
          if (event.target === event.currentTarget) {
            const box = event.currentTarget.getBoundingClientRect();
            if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) picker.current?.close();
          }
        }}>
          <header><h2 id="lobby-picker-title">{tr("Chọn chế độ")}</h2><button type="button" autoFocus onClick={() => picker.current?.close()} aria-label={tr("Đóng")}><X /></button></header>
          <div className="lobby-picker-grid">
            {lobbyModes.map(item => <button key={item.key} type="button" className={`lobby-choice is-${item.key}${selectedMode === item.key ? " is-selected" : ""}`} disabled={item.key === "ranked"} onClick={() => selectMode(item.key)} aria-pressed={selectedMode === item.key}>
              <img src={item.background} alt="" draggable={false} />
              <span className="lobby-choice-content"><ModeSymbol mode={item.key} /><b>{tr(item.label)}</b><small>{tr(item.description)}</small></span>
              {selectedMode === item.key ? <span className="lobby-choice-check"><Check /></span> : null}
            </button>)}
          </div>
        </dialog>
        <nav className="lobby-navigation" aria-label={tr("Điều hướng chính")}>
          <button type="button" disabled><Trophy aria-hidden="true" /><span>{tr("Xếp hạng")}</span></button>
          <Link to="/deck" onPointerDown={() => playUi("select")}><Layers aria-hidden="true" /><span>{tr("Bộ bài")}</span></Link>
          <Link to="/shop" onPointerDown={() => playUi("select")}><ShoppingCart aria-hidden="true" /><span>{tr("Cửa hàng")}</span></Link>
          <Link to="/collection" onPointerDown={() => playUi("select")}><BookOpen aria-hidden="true" /><span>{tr("Bộ sưu tập")}</span></Link>
        </nav>
      </div>
      {mine ? <FriendProfile friend={mine} onClose={() => setMine(null)} /> : null}
    </main>
  );
}
