import { createFileRoute, Link } from "@tanstack/react-router";
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
import { START_RANK, rankFrame, rankLabel } from "@/lib/rank";
import { playerId } from "@/lib/friend-state";
import { FriendProfile } from "@/components/friend-profile";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ name: "theme-color", content: "#0b1b2c" }] }),
  component: Home,
});

// Toạ độ lấy từ ảnh H3 (826 × 1905); ảnh nguyên liệu cắt giữ nguyên chữ.
const W = 826;
const H = 1905;
const box = (x: number, y: number, w: number, h: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%` });

type LobbyMode = "ai" | "quick" | "ranked" | "custom";
const TILES: { key: LobbyMode; label: string }[] = [
  { key: "ai", label: "Đánh với máy" },
  { key: "quick", label: "Đánh thường" },
  { key: "ranked", label: "Xếp hạng" },
  { key: "custom", label: "Tuỳ chọn" },
];
const BAR: Record<LobbyMode, string> = { ai: "/ui/home/bar-ai.webp", quick: "/ui/home/bar-quick.webp", ranked: "/ui/home/bar-ranked.webp", custom: "/ui/home/bar-custom.webp" };

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hiệu ứng bấm của mọi nút: lún + sáng + vòng sáng; nút khoá thì rung. */
function hit(root: HTMLElement | null, locked: boolean) {
  if (!root || reduced()) return;
  const art = root.querySelector<HTMLElement>(":scope > img, :scope > .lobby-art");
  const ring = root.querySelector<HTMLElement>(":scope > .lobby-ring");
  if (art) {
    art.animate(
      locked
        ? [{ transform: "translateX(0)" }, { transform: "translateX(-4%)" }, { transform: "translateX(4%)" }, { transform: "translateX(-2%)" }, { transform: "translateX(0)" }]
        : [{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(.9)", filter: "brightness(1.35)" }, { transform: "scale(1.06)", filter: "brightness(1.2)" }, { transform: "scale(1)", filter: "brightness(1)" }],
      { duration: locked ? 320 : 380, easing: "ease-out" },
    );
  }
  ring?.animate([{ opacity: 0.95, transform: "scale(.78)" }, { opacity: 0, transform: "scale(1.22)" }], { duration: 460, easing: "ease-out" });
}

type Btn = { key: string; label: string; img: string; at: [number, number, number, number]; to?: "/missions" | "/tune" | "/mail" | "/friends"; dot?: boolean };

function Home() {
  useLang();
  const stars = useStars();
  const picker = useRef<HTMLDialogElement>(null);
  const [selectedMode, setSelectedMode] = useState<LobbyMode>("quick");
  useEffect(() => {
    const saved = localStorage.getItem("clash-play-mode");
    if (saved === "ai" || saved === "quick" || saved === "custom") setSelectedMode(saved);
  }, []);
  function selectMode(mode: LobbyMode, el: HTMLElement | null) {
    hit(el, mode === "ranked");
    if (mode === "ranked") {
      playUi("soft");
      return;
    }
    setSelectedMode(mode);
    localStorage.setItem("clash-play-mode", mode);
    playUi("confirm");
    window.setTimeout(() => picker.current?.close(), reduced() ? 0 : 260);
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
  const [navOn, setNavOn] = useState<number | null>(null);

  const buttons: Btn[] = [
    { key: "missions", label: "Nhiệm vụ", img: "quest", at: [19, 669, 137, 138], to: "/missions", dot: quests },
    { key: "rewards", label: "Phần thưởng", img: "gift", at: [17, 827, 140, 139], dot: true },
    { key: "ranks", label: "Xếp hạng", img: "rank", at: [19, 986, 137, 137] },
    { key: "settings", label: "Cài đặt", img: "settings", at: [672, 669, 135, 138], to: "/tune" },
    { key: "mail", label: "Thư", img: "mail", at: [671, 827, 138, 139], to: "/mail", dot: mails.some(row => !row.read || row.owing) },
    { key: "friends", label: "Bạn bè", img: "friends", at: [672, 986, 138, 137], to: "/friends", dot: friends.asks > 0 },
  ];
  const navItems: { label: string; to?: "/deck" | "/shop" | "/collection"; left: number; width: number }[] = [
    { label: "Sự kiện", left: 0, width: 196 },
    { label: "Bộ bài", to: "/deck", left: 196, width: 195 },
    { label: "Cửa hàng", to: "/shop", left: 391, width: 214 },
    { label: "Bộ sưu tập", to: "/collection", left: 605, width: 171 },
  ];
  const NAV = { x: 22, y: 1730, w: 784, h: 139 };
  function pressNav(index: number, el: HTMLElement, locked: boolean) {
    playUi(locked ? "soft" : "select");
    setNavOn(index);
    if (locked) window.setTimeout(() => setNavOn(now => (now === index ? null : now)), 900);
    const flash = el.querySelector<HTMLElement>(".lobby-nav-flash");
    if (flash && !reduced()) flash.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 480, easing: "ease-out" });
    if (locked && !reduced()) el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-3%)" }, { transform: "translateX(3%)" }, { transform: "translateX(0)" }], { duration: 300 });
  }

  const h = (n: number) => `calc(var(--h) * ${n})`;
  return (
    <main className="lobby">
      <div className="lobby-stage">
        <img className="lobby-background" src="/home-bg-video.jpg" alt="" draggable={false} />
        <video className="lobby-background" src="/home-bg.mp4" poster="/home-bg-video.jpg" autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
        <div className="lobby-bottom-shade" aria-hidden="true" />

        {buttons.map(({ key, label, img, at, to, dot }) => {
          const style = box(...at);
          const content = (
            <>
              <img src={`/ui/home/btn-${img}.webp`} alt={tr(label)} draggable={false} />
              <span className="lobby-ring" />
              {dot ? <i className="lobby-dot" aria-hidden="true" /> : null}
            </>
          );
          return to ? (
            <Link key={key} to={to} className="lobby-btn" style={style} onPointerDown={event => { playUi("select"); hit(event.currentTarget, false); }}>{content}</Link>
          ) : (
            <button key={key} type="button" className="lobby-btn is-locked" style={style} aria-label={`${tr(label)} — ${tr("Sắp có")}`} onPointerDown={event => { playUi("soft"); hit(event.currentTarget, true); }}>{content}</button>
          );
        })}

        <div className="lobby-account">
          <button type="button" className="lobby-mode" onClick={() => { playUi("select"); picker.current?.showModal(); picker.current?.focus(); }} onPointerDown={event => hit(event.currentTarget, false)} aria-label={tr("Chọn chế độ chơi")} aria-haspopup="dialog">
            <img src={BAR[selectedMode]} alt={tr(TILES.find(item => item.key === selectedMode)!.label)} draggable={false} />
            <span className="lobby-ring" />
          </button>

          <img className="lobby-coin-star" src="/ui/home/star-gold.webp" alt="" draggable={false} style={{ left: h(4), top: h(-92), width: h(66) }} />
          <b className="lobby-coin-num" style={{ left: h(86), top: h(-86), fontSize: h(54) }} aria-label={tr("Số sao")}>{stars}</b>
          <img className="lobby-coin-star" src="/ui/home/star-rainbow.webp" alt="" draggable={false} style={{ left: h(228), top: h(-92), width: h(66) }} />
          <b className="lobby-coin-num" style={{ left: h(310), top: h(-86), fontSize: h(54) }} title={tr("Sao hiếm — sắp có")}>0</b>

          <button type="button" className="lobby-profile" onClick={() => { playUi("select"); setMine(playerId()); }} aria-label={tr("Hồ sơ")}>
            <span className="lobby-name" style={{ top: h(4), right: h(172), fontSize: h(56) }}>{tr("Người chơi")}</span>
            <span className="lobby-rank" style={{ top: h(76), right: h(165), fontSize: h(49) }}>{tr(rankLabel(START_RANK.tier, START_RANK.level))}</span>
            {(() => {
              // Ô trống của khung khớp đúng chỗ ảnh đại diện (102 đơn vị), khung nhô ra ngoài theo tỉ lệ.
              const f = rankFrame(START_RANK.tier);
              const [hl, ht, hr, hb] = f.hole;
              const k = 102 / (hr - hl);
              return (
                <i className="lobby-avatar" style={{ ["--k" as string]: k }}>
                  {face ? (
                    <img className="art" src={artSrc(face)} alt="" draggable={false}
                      style={{ left: `calc(var(--h) * ${(59 - 51).toFixed(1)})`, top: `calc(var(--h) * ${(58.5 - ((hb - ht) * k) / 2).toFixed(1)})`, width: `calc(var(--h) * 102)`, height: `calc(var(--h) * ${((hb - ht) * k).toFixed(1)})` }} />
                  ) : null}
                  <img className="frame" src={f.src} alt="" draggable={false}
                    style={{ left: `calc(var(--h) * ${(8 - hl * k).toFixed(1)})`, top: `calc(var(--h) * ${(58.5 - ((hb - ht) * k) / 2 - ht * k).toFixed(1)})`, width: `calc(var(--h) * ${(f.w * k).toFixed(1)})`, height: `calc(var(--h) * ${(f.h * k).toFixed(1)})` }} />
                </i>
              );
            })()}
          </button>
        </div>

        <div className="lobby-play" style={box(30, 1430, 784, 290)} aria-label={tr("Chơi")}>
          <button type="button" className="lobby-btn is-locked is-wide" style={{ left: 0, top: `${(0 / 290) * 100}%`, width: `${(373 / 784) * 100}%`, height: `${(270 / 290) * 100}%` }} aria-label="PvE — Phiêu lưu (sắp có)" onPointerDown={event => { playUi("soft"); hit(event.currentTarget, true); }}>
            <img src="/ui/home/pve.webp" alt="PvE · Phiêu lưu" draggable={false} /><span className="lobby-ring" />
          </button>
          <Link to="/modes" className="lobby-btn is-wide" style={{ left: `${((406 - 30) / 784) * 100}%`, top: `${(-9 / 290) * 100}%`, width: `${(408 / 784) * 100}%`, height: `${(288 / 290) * 100}%` }} aria-label="PvP — Đấu hạng" onPointerDown={event => { playUi("confirm"); hit(event.currentTarget, false); }}>
            <img src="/ui/home/pvp.webp" alt="PvP · Đấu hạng" draggable={false} /><span className="lobby-ring" />
          </Link>
        </div>

        <nav className="lobby-nav" style={box(NAV.x, NAV.y, NAV.w, NAV.h)} aria-label={tr("Điều hướng chính")}>
          <img src="/ui/home/nav.webp" alt="" draggable={false} />
          {navItems.map((item, index) => {
            const style = { left: `${(item.left / 776) * 100}%`, width: `${(item.width / 776) * 100}%` };
            const style2 = { ...style };
            const inner = (
              <>
                <span className="lobby-nav-flash" />
                <span className={`lobby-nav-glow${navOn === index ? " is-on" : ""}`} />
              </>
            );
            // vùng bấm nằm trong khung 776 px bên trong ảnh (lề 4 + 4 px đã tính khi cắt)
            return item.to ? (
              <Link key={item.label} to={item.to} className="lobby-nav-hit" style={{ ...style2, left: `calc(${(4 / NAV.w) * 100}% + ${(item.left / 776) * (776 / NAV.w) * 100}%)`, width: `${(item.width / NAV.w) * 100}%` }} aria-label={tr(item.label)} onPointerDown={event => pressNav(index, event.currentTarget, false)}>{inner}</Link>
            ) : (
              <button key={item.label} type="button" className="lobby-nav-hit" style={{ ...style2, left: `calc(${(4 / NAV.w) * 100}% + ${(item.left / 776) * (776 / NAV.w) * 100}%)`, width: `${(item.width / NAV.w) * 100}%` }} aria-label={`${tr(item.label)} — ${tr("Sắp có")}`} onPointerDown={event => pressNav(index, event.currentTarget, true)}>{inner}</button>
            );
          })}
        </nav>

        <dialog ref={picker} tabIndex={-1} className="lobby-picker" aria-label={tr("Chọn chế độ")} onClick={event => {
          if (event.target === event.currentTarget) picker.current?.close();
        }}>
          <img src="/ui/home/dialog.webp" alt={tr("Chọn chế độ")} draggable={false} />
          {TILES.map((item, index) => (
            <button key={item.key} type="button" className={`lobby-tile t${index}${selectedMode === item.key ? " is-selected" : ""}`} aria-label={tr(item.label)} aria-pressed={selectedMode === item.key} onClick={event => selectMode(item.key, event.currentTarget)}>
              <span className="lobby-ring" />
              {selectedMode === item.key ? <span className="lobby-tile-check" aria-hidden="true">✓</span> : null}
            </button>
          ))}
          <button type="button" className="lobby-close" aria-label={tr("Đóng")} onClick={event => { hit(event.currentTarget, false); window.setTimeout(() => picker.current?.close(), reduced() ? 0 : 200); }}><span className="lobby-ring" /></button>
        </dialog>
      </div>
      {mine ? <FriendProfile friend={mine} onClose={() => setMine(null)} /> : null}
    </main>
  );
}
