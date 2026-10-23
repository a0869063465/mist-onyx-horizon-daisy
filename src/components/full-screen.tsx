import { useEffect } from "react";

/**
 * Toàn màn hình (chủ game 23/10): the installed app asks for fullscreen itself, since Android does not always hide its
 * bars on launch (the owner had to swipe a few times). Browsers only grant it on a touch, so every touch while not
 * fullscreen asks again, which also covers coming back from another app. A page open in a normal browser tab is left
 * alone.
 */
export function FullScreen() {
  useEffect(() => {
    const installed = () => window.matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;
    const ask = () => {
      if (!installed() || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
      document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    };
    window.addEventListener("pointerdown", ask, { passive: true });
    return () => window.removeEventListener("pointerdown", ask);
  }, []);
  return null;
}
