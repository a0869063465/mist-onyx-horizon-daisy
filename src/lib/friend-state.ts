import { useEffect, useState } from "react";
import { ID_LENGTH, type FriendMode, type InviteRow } from "./friends";

/** Phía máy của Bạn bè: ID của máy, chế độ đang chơi, và những gì lần báo trạng thái gần nhất mang về. */

const ID_KEY = "clash-player-id";
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** ID 8 ký tự gắn với máy (chủ game 31/10, C6): tạo một lần, lưu trên máy. */
export function playerId(): string {
  try {
    const saved = localStorage.getItem(ID_KEY);
    if (saved && saved.length === ID_LENGTH) return saved;
    let id = "";
    const bytes = new Uint32Array(ID_LENGTH);
    crypto.getRandomValues(bytes);
    for (const n of bytes) id += LETTERS[n % LETTERS.length];
    localStorage.setItem(ID_KEY, id);
    return id;
  } catch {
    return "";
  }
}

/** Tên hiện trên danh sách (chủ game 31/10: chưa có hệ thống tên). */
export const PLAYER_NAME = "Người chơi";

export const MODE_LABELS: Record<FriendMode, string> = {
  ai: "Vs Máy",
  test: "Test",
  quick: "Đánh thường",
  custom: "Tuỳ chọn",
  tutorial: "Hướng dẫn",
  trial: "Thực chiến",
};

/** Mời / nhận lời mời vào trận: trang Chọn bộ bài đọc cái này rồi mở phòng hoặc vào phòng. */
export const FRIEND_MATCH_KEY = "clash-friend-match";
export type FriendMatch = { kind: "invite"; to: string } | { kind: "join"; from: string; code: string };

export function loadFriendMatch(): FriendMatch | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(FRIEND_MATCH_KEY) ?? "null") as FriendMatch | null;
    if (raw?.kind === "invite" && typeof raw.to === "string") return raw;
    if (raw?.kind === "join" && typeof raw.code === "string" && typeof raw.from === "string") return raw;
  } catch {
    // Không đọc được: coi như không có.
  }
  return null;
}

export function setFriendMatch(value: FriendMatch | null) {
  if (value) sessionStorage.setItem(FRIEND_MATCH_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(FRIEND_MATCH_KEY);
}

/** Đang xem trận của bạn: ID bạn đó (sessionStorage), và bên của bạn đó trong trận. */
export const WATCH_KEY = "clash-watch";
export const WATCH_SEAT_KEY = "clash-watch-seat";

/** Chế độ đang chơi trên máy này, theo trang trận (null = ngoài trận = Đang chờ). */
export function currentMode(): { mode: FriendMode | null; room: string | null; seat: string | null } {
  const none = { mode: null, room: null, seat: null };
  if (typeof window === "undefined" || window.location.pathname !== "/play") return none;
  if (sessionStorage.getItem(WATCH_KEY)) return none;
  const saved = sessionStorage.getItem("clash-mode");
  try {
    const net = JSON.parse(sessionStorage.getItem("clash-net") ?? "null") as { code?: string; seat?: string; quick?: boolean } | null;
    if (net?.code) return { mode: net.quick ? "quick" : "custom", room: net.code, seat: net.seat ?? null };
  } catch {
    // Không có phòng.
  }
  if (saved === "test") return { ...none, mode: "test" };
  if (saved === "tutorial") return { ...none, mode: "tutorial" };
  if (saved === "trial") return { ...none, mode: "trial" };
  return { ...none, mode: "ai" };
}

/** `watched`: có bạn bè đang xem trận trên máy này (trận Vs Máy / Test thì gửi bản chụp lên). */
type Shared = { asks: number; invites: InviteRow[]; watched: boolean };
let shared: Shared = { asks: 0, invites: [], watched: false };
const listeners = new Set<() => void>();

export function setPulse(next: Shared) {
  shared = next;
  for (const fn of listeners) fn();
}

export function readPulse(): Shared {
  return shared;
}

/** Số lời mời kết bạn đang chờ mình (chấm đỏ thẻ Bạn bè ở menu, hàng xanh tin mới). */
export function usePulse(): Shared {
  const [value, setValue] = useState(shared);
  useEffect(() => {
    const fn = () => setValue(shared);
    listeners.add(fn);
    fn();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return value;
}
