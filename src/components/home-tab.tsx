import { Link } from "@tanstack/react-router";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { tr } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";
import type { MenuIcon, MenuIconKey } from "@/lib/layouts";

export type Tab = { key: string; label: string; pic: MenuIconKey; bg: string; to?: "/shop" | "/collection" | "/mail" | "/news" | "/friends" | "/missions"; go?: () => void; dot?: boolean };

// Menu chính (chủ game 06/11): trái Bộ sưu tập, Sự kiện, Bảng xếp hạng, Cửa hàng; phải Phần thưởng, Nhiệm vụ, Bạn bè, Thư. Chấm đỏ do trang menu gắn.
export const LEFT_TABS: Tab[] = [
  { key: "album", label: "Bộ sưu tập", pic: "album", bg: "/art/ky-si-cuoi-rong.jpg", to: "/collection" },
  { key: "events", label: "Sự kiện", pic: "events", bg: "/art/rong-ac-ma.jpg" },
  { key: "ranks", label: "Bảng xếp hạng", pic: "ranks", bg: "/art/phu-thuy-rung-den.jpg" },
  { key: "shop", label: "Cửa hàng", pic: "shop", bg: "/art/khong-lo-mot-mat.jpg", to: "/shop" },
];
export const RIGHT_TABS: Tab[] = [
  { key: "gifts", label: "Phần thưởng", pic: "gifts", bg: "/art/thien-su.jpg" },
  { key: "missions", label: "Nhiệm vụ", pic: "missions", bg: "/art/hiep-si-cua-hau.jpg", to: "/missions" },
  { key: "friends", label: "Bạn bè", pic: "friends", bg: "/art/kizuran.jpg", to: "/friends" },
  { key: "mail", label: "Thư", pic: "mail", bg: "/art/my-dieu-nhan.jpg", to: "/mail" },
];

/** Kéo icon trong Tuỳ chỉnh (xem trước): thẻ thành khối không bấm được, icon kéo được. */
export type IconDrag = {
  picked: MenuIconKey;
  down: (key: MenuIconKey, event: ReactPointerEvent<HTMLImageElement>) => void;
  move: (event: ReactPointerEvent<HTMLImageElement>) => void;
  up: () => void;
};

export function SideTab({ tab, side, index, icon, drag }: { tab: Tab; side: "left" | "right"; index: number; icon: MenuIcon; drag?: IconDrag }) {
  const shut = !tab.to && !tab.go;
  const iconStyle = { "--ix": `${icon.dx}rem`, "--iy": `${icon.dy}rem`, "--ih": `${icon.size}rem` } as CSSProperties;
  const live = drag
    ? { onPointerDown: (event: ReactPointerEvent<HTMLImageElement>) => drag.down(tab.pic, event), onPointerMove: drag.move, onPointerUp: drag.up, onPointerCancel: drag.up }
    : {};
  const inner = (
    <>
      <span className="home-tab-art" style={{ backgroundImage: `url(${tab.bg})` }} aria-hidden="true" />
      <img
        className={`home-tab-icon${drag ? " is-live" : ""}${drag?.picked === tab.pic ? " is-picked" : ""}`}
        src={`/ui/menu/ic-${tab.pic}.webp`}
        style={iconStyle}
        alt={tr(tab.label)}
        draggable={false}
        {...live}
      />
      {shut ? <LockIcon /> : null}
      {tab.dot ? <span className="home-tab-dot" aria-hidden="true" /> : null}
    </>
  );
  const className = `home-tab is-${side}${shut ? " is-shut" : ""}`;
  const style = { animationDelay: `${0.3 + index * 0.08}s` };
  if (drag) {
    return (
      <div className={className} style={{ animation: "none" }}>
        {inner}
      </div>
    );
  }
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

export function LockIcon() {
  return (
    <svg className="home-lock" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
