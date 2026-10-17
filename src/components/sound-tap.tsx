import { useEffect } from "react";
import { playTap, playUi, unlockSound, type UiCue } from "@/lib/sfx";

/** In-match buttons: big turn actions confirm, other buttons select, cards and small chrome are soft. */
function stageCue(node: Element): UiCue {
  if (node.matches(".act.is-end, .act.is-pass, .act.ok, .vow-ok")) return "confirm";
  if (node.matches(".act, .act-chip, .ask-card button")) return "select";
  return "soft";
}

export function SoundTap() {
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      unlockSound();
      const node =
        event.target instanceof Element ? event.target.closest("button, a, [role='button']") : null;
      if (!node || node.hasAttribute("disabled")) return;
      if (node instanceof HTMLInputElement) return;
      if (node.closest("[data-sfx]")) return;
      const cue = node.closest("[data-ui]")?.getAttribute("data-ui") as UiCue | null;
      if (cue) playUi(cue);
      else if (node.closest(".menu-page"))
        playUi(node.matches(".watch-back, .tuner-back") ? "soft" : "select");
      else if (node.closest(".stage")) playUi(stageCue(node));
      else playTap();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
