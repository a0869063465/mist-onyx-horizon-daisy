import { useEffect, useState } from "react";

/**
 * Publisher or guest (owner, 18/10). Codes typed in Thông tin → Nhập mã switch it: NHAPHATHANH back to the
 * publisher's full app, KHACH to the guest view, where Tuỳ chỉnh keeps only Ngôn ngữ and Âm thanh and Thông tin
 * keeps only Chiến thuật and Nhập mã. Kept on this phone; the publisher view is the default.
 */
export type AppMode = "publisher" | "guest";

const KEY = "clash-app-mode";
const CODES: Record<string, AppMode> = { NHAPHATHANH: "publisher", KHACH: "guest" };
const listeners = new Set<(mode: AppMode) => void>();

export function appMode(): AppMode {
  try {
    return localStorage.getItem(KEY) === "guest" ? "guest" : "publisher";
  } catch {
    return "publisher";
  }
}

/** Codes are upper case; what the player types counts without accents and spaces. */
export function plainCode(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "D")
    .replace(/\s+/g, "")
    .toUpperCase();
}

/** The mode a code switches to, or null for a code that does nothing. */
export function redeemCode(text: string): AppMode | null {
  const mode = CODES[plainCode(text)] ?? null;
  if (!mode) return null;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Only for this visit then.
  }
  for (const hear of listeners) hear(mode);
  return mode;
}

export function useAppMode(): AppMode {
  const [mode, setMode] = useState<AppMode>("publisher");
  useEffect(() => {
    setMode(appMode());
    listeners.add(setMode);
    return () => {
      listeners.delete(setMode);
    };
  }, []);
  return mode;
}
