import { useEffect } from "react";

/**
 * Takes the whole screen on a touch, since a browser only allows it from one (chủ game 08/11: "tự bung full màn hình khi
 * vào game"). The installed app asks on every touch while it is out of full screen; in a plain browser tab it asks until
 * it has worked once, so a player who leaves full screen on purpose is not pulled back.
 */
export function FullScreen() {
  useEffect(() => {
    const installed = () => window.matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;
    let once = false;
    const ask = () => {
      if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
      if (!installed() && once) return;
      document.documentElement
        .requestFullscreen({ navigationUI: "hide" })
        .then(() => {
          once = true;
        })
        .catch(() => {});
    };
    window.addEventListener("pointerdown", ask, { passive: true });
    return () => window.removeEventListener("pointerdown", ask);
  }, []);
  return null;
}
