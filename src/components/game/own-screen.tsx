import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { GoldText } from "@/components/gold-text";
import { GetView } from "@/components/game/own-panel";
import { copyCap } from "@/lib/catalog";
import { albumOf, ALBUM_GOTO_KEY } from "@/lib/collection";
import { isFavCard, toggleFavCard } from "@/lib/fav-cards";
import { tr } from "@/lib/i18n";
import { playUi, type UiCue } from "@/lib/sfx";
import { ownedCopiesOf, trialTag } from "@/lib/owned-cards";
import { useStars } from "@/lib/shop";
import { trialEnds } from "@/lib/trial-deck";

/**
 * Tab "Sở hữu" của bảng mô tả theo ảnh linh kiện chủ game gửi 16/11 (`public/ui/own/*`, cắt NGUYÊN từ ảnh 848×1855 đã
 * đặt sẵn). Mọi toạ độ là px của ảnh thiết kế, đơn vị `--u` = 100cqw / 848; trục dọc tính từ `Y0`.
 */
const Y0 = 455;
const H = 975;
const GEO: Record<string, [number, number, number, number]> = {
  frame: [30, 465, 789, 948],
  divider: [429, 948, 338, 33],
  "tab-line": [68, 563, 649, 19],
  x: [719, 493, 76, 74],
  slot: [524, 995, 151, 136],
  box: [420, 804, 366, 141],
  "btn-deck": [79, 1162, 336, 93],
  "btn-album": [436, 1162, 336, 93],
  "btn-get": [82, 1275, 687, 102],
  dialog: [122, 760, 604, 486],
  "btn-rent7": [164, 909, 521, 87],
  "btn-rent30": [164, 1012, 521, 86],
  "btn-buy": [163, 1114, 522, 89],
};
const TABS: { key: string; label: string; x: number; w: number; text: [number, number] }[] = [
  { key: "chuc-nang", label: "Chức năng", x: 69, w: 178, text: [69, 180] },
  { key: "ky-nang", label: "Kỹ năng", x: 259, w: 158, text: [270, 137] },
  { key: "chi-so", label: "Chỉ số", x: 423, w: 139, text: [437, 109] },
  { key: "so-huu", label: "Sở hữu", x: 568, w: 149, text: [582, 123] },
];
const PRICES = [
  { key: "rent7", price: 20 },
  { key: "rent30", price: 50 },
  { key: "buy", price: 150 },
] as const;

const at = (name: string, extra?: CSSProperties): CSSProperties => {
  const [x, y, w, h] = GEO[name];
  return { left: `calc(var(--u) * ${x})`, top: `calc(var(--u) * ${y - Y0})`, width: `calc(var(--u) * ${w})`, height: `calc(var(--u) * ${h})`, ...extra };
};
const box = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `calc(var(--u) * ${x})`,
  top: `calc(var(--u) * ${y - Y0})`,
  width: `calc(var(--u) * ${w})`,
  height: `calc(var(--u) * ${h})`,
});

/** Tên lá chia hai dòng ở dấu cách gần giữa nhất khi dài. */
function nameLines(name: string): string[] {
  const words = name.split(" ");
  if (name.length <= 9 || words.length < 2) return [name];
  let best = 1;
  let gap = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const left = words.slice(0, i).join(" ").length;
    const diff = Math.abs(left - (name.length - left - 1));
    if (diff < gap) {
      gap = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/**
 * Phản hồi khi bấm (chủ game 16/11: giống nút màn chính, KHÔNG có vệt quét khi chạm; vệt quét chỉ ở nút mời bấm):
 * hình lún rồi nảy, vòng sáng vàng toả ra, kèm tiếng. Nút khoá / thiếu sao thì rung và tiếng trầm.
 */
function feel(el: HTMLElement | null, cue: UiCue, mode: "tap" | "pop" | "deny" = "tap") {
  playUi(mode === "deny" ? "deny" : cue);
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const img = el.querySelector<HTMLElement>(":scope > img");
  if (mode === "deny") {
    img?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4%)" }, { transform: "translateX(4%)" }, { transform: "translateX(-2%)" }, { transform: "translateX(0)" }], { duration: 320, easing: "ease-out" });
    return;
  }
  img?.animate(
    mode === "pop"
      ? [{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(.84)", filter: "brightness(1.4)" }, { transform: "scale(1.2)", filter: "brightness(1.35)" }, { transform: "scale(1)", filter: "brightness(1)" }]
      : [{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(.93)", filter: "brightness(1.3)" }, { transform: "scale(1.04)", filter: "brightness(1.15)" }, { transform: "scale(1)", filter: "brightness(1)" }],
    { duration: mode === "pop" ? 420 : 340, easing: "ease-out" },
  );
  const ring = document.createElement("i");
  ring.className = "os-ring";
  el.appendChild(ring);
  const run = ring.animate([{ opacity: 0.95, transform: "scale(.82)" }, { opacity: 0, transform: "scale(1.2)" }], { duration: 460, easing: "ease-out" });
  run.onfinish = () => ring.remove();
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Thời gian còn lại của lá thử: "7D 12:24", dưới một ngày chỉ "12:24". */
function leftText(now: number): string {
  const left = Math.max(0, trialEnds(now) - now);
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(left / day);
  const rest = left % day;
  const clock = `${pad(Math.floor(rest / 3600000))}:${pad(Math.floor((rest % 3600000) / 60000))}`;
  return days >= 1 ? `${days}D ${clock}` : clock;
}

export function OwnScreen({
  id,
  name,
  card,
  badge,
  stars,
  tabs,
  tab,
  onTab,
  onClose,
  onDeck,
}: {
  id: string;
  name: string;
  card: ReactNode;
  badge?: ReactNode;
  stars?: number;
  tabs: { key: string; label: string }[];
  tab: string;
  onTab: (key: string) => void;
  onClose: () => void;
  onDeck?: () => void;
}) {
  const go = useNavigate();
  const have = ownedCopiesOf(id);
  const cap = copyCap(id);
  const album = albumOf(id);
  const poor = useStars();
  const [fav, setFav] = useState(() => isFavCard(id));
  const [dialog, setDialog] = useState(false);
  const [getting, setGetting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lent = have < 1 && trialTag(id) !== null;
  useEffect(() => {
    setFav(isFavCard(id));
    setDialog(false);
    setGetting(false);
  }, [id]);
  useEffect(() => {
    if (!lent) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [lent]);
  const lines = nameLines(name);
  const selected = TABS.find((item) => tabs.some((one) => one.key === tab && one.label === item.label)) ?? TABS[3];
  const barWidth = selected.w;

  return (
    <div className="msheet-back os-back" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="os-wrap" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="os" style={{ height: `calc(var(--u) * ${H})` }} role="dialog" aria-label={name}>
          <div className="os-frame" style={at("frame")} />
          <img className="os-img" src="/ui/own/divider.webp" alt="" draggable={false} style={at("divider")} />

          <img className="os-img" src="/ui/own/tab-line.webp" alt="" draggable={false} style={at("tab-line")} />
          <img
            className="os-img os-bar"
            src="/ui/own/tab-ky-nang-bar.webp"
            alt=""
            draggable={false}
            style={{ left: `calc(var(--u) * ${selected.x})`, top: `calc(var(--u) * ${563 - Y0})`, width: `calc(var(--u) * ${barWidth})`, height: `calc(var(--u) * 19)` }}
          />
          {TABS.map((item) => {
            const found = tabs.find((one) => one.label === item.label);
            if (!found) return null;
            const on = found.key === tab;
            return (
              <button key={item.key} type="button" role="tab" aria-selected={on} aria-label={item.label} className="os-tab" style={box(item.x, 520, item.w, 56)} onClick={() => { if (found.key !== tab) feel(null, "rune"); onTab(found.key); }}>
                <img className="os-tab-img" src={`/ui/own/tab-${item.key}-off.webp`} alt="" draggable={false} style={{ left: `calc(var(--u) * ${item.text[0] - item.x})`, width: `calc(var(--u) * ${item.text[1]})`, top: 0 }} />
                <img className="os-tab-img os-tab-on" src={`/ui/own/tab-${item.key}-on.webp`} alt="" draggable={false} style={{ left: `calc(var(--u) * ${item.text[0] - item.x})`, width: `calc(var(--u) * ${item.text[1]})`, top: 0, opacity: on ? 1 : 0 }} />
              </button>
            );
          })}
          <button type="button" className="os-hit" aria-label="Đóng" style={at("x")} onClick={(event) => { feel(event.currentTarget, "soft"); onClose(); }}>
            <img className="os-img" src="/ui/own/x.webp" alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
          </button>

          <div className="os-card" style={box(78, 664, 307, 461)}>
            {card}
            {badge}
          </div>

          <div className="os-name" style={box(417, 664, 215, 100)}>
            {lines.map((line, i) => (
              <div key={i} className="os-name-line" style={{ height: `calc(var(--u) * 48)` }}>
                <GoldText text={line} capU={34} fitU={210} />
              </div>
            ))}
          </div>
          {stars ? (
            <span className={`os-stars tag-stars is-s${Math.min(5, Math.max(1, stars))}`} style={box(648, 668, 150, 70)}>
              <i className="tag-star" />
              <b>{stars}</b>
            </span>
          ) : null}

          <img className="os-img" src="/ui/own/box.webp" alt="" draggable={false} style={at("box")} />
          <div className="os-count" style={box(630, 846, 120, 56)}>
            <GoldText text={`${have}/${cap}`} capU={30} fitU={84} />
          </div>

          {have >= 1 ? (
            <button
              type="button"
              className="os-hit"
              aria-label={tr("Yêu thích")}
              aria-pressed={fav}
              style={at("slot")}
              onClick={(event) => {
                const on = toggleFavCard(id);
                setFav(on);
                feel(event.currentTarget, "charm", "pop");
              }}
            >
              <img className="os-img" src={fav ? "/ui/own/heart-on.webp" : "/ui/own/heart-off.webp"} alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
            </button>
          ) : lent ? (
            <div className="os-slot" style={at("slot")}>
              <img className="os-img" src="/ui/own/hourglass.webp" alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
              <div className="os-left" style={{ left: 0, width: "100%", top: `calc(var(--u) * 82)`, height: `calc(var(--u) * 34)` }}>
                <GoldText text={leftText(now)} capU={25} fitU={122} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="os-hit"
              aria-label={tr("Mở khóa")}
              style={at("slot")}
              onClick={(event) => {
                feel(event.currentTarget, "seal");
                setDialog(true);
              }}
            >
              <img className="os-img" src="/ui/own/lock.webp" alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
            </button>
          )}

          <button type="button" className="os-hit" aria-label="Deck" style={at("btn-deck")} onClick={(event) => {
              feel(event.currentTarget, "select");
              if (onDeck) onDeck();
              else go({ to: "/deck" });
            }}
          >
            <img className="os-img" src="/ui/own/btn-deck.webp" alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
          </button>
          <button
            type="button"
            className="os-hit"
            aria-label="Album"
            aria-disabled={!album}
            style={at("btn-album")}
            onClick={(event) => {
              if (!album) {
                feel(event.currentTarget, "deny", "deny");
                return;
              }
              feel(event.currentTarget, "select");
              sessionStorage.setItem(ALBUM_GOTO_KEY, album.id);
              go({ to: "/collection" });
              window.dispatchEvent(new Event(ALBUM_GOTO_KEY));
            }}
          >
            <img className="os-img" src="/ui/own/btn-album.webp" alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
          </button>
          <button
            type="button"
            className="os-hit os-cta"
            aria-label={tr("Nhận thêm lá này")}
            style={at("btn-get")}
            onClick={(event) => {
              feel(event.currentTarget, "confirm");
              setGetting(true);
            }}
          >
            <img className="os-img" src="/ui/own/btn-get.webp" alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
          </button>

          {getting ? (
            <div className="os-get" style={box(60, 640, 730, 500)}>
              <GetView id={id} onBack={() => setGetting(false)} />
            </div>
          ) : null}

          {dialog ? (
            <div className="os-dim" onClick={() => { playUi("soft"); setDialog(false); }}>
              <div className="os-dialog" onClick={(event) => event.stopPropagation()}>
                <img className="os-img" src="/ui/own/dialog.webp" alt="" draggable={false} style={at("dialog")} />
                <button type="button" className="os-hit" aria-label="Đóng" style={box(634, 787, 64, 64)} onClick={(event) => { feel(event.currentTarget, "soft"); setDialog(false); }}>
                  <img className="os-img" src="/ui/own/x.webp" alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
                </button>
                {PRICES.map((row) => {
                  const lack = poor < row.price;
                  return (
                    <button key={row.key} type="button" className={`os-hit os-buy${lack ? " is-poor" : ""}`} aria-label={`${row.key} ${row.price}`} aria-disabled={lack} style={at(`btn-${row.key}`)} onClick={(event) => feel(event.currentTarget, "gem", lack ? "deny" : "tap")}>
                      <img className="os-img" src={`/ui/own/btn-${row.key}.webp`} alt="" draggable={false} style={{ inset: 0, width: "100%", height: "100%" }} />
                      <span className="os-price" style={{ left: `calc(var(--u) * 409)`, width: `calc(var(--u) * 100)`, top: `calc(var(--u) * 24)`, height: `calc(var(--u) * 40)` }}>
                        <GoldText text={String(row.price)} capU={24} fitU={64} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
