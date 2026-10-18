import { useEffect } from "react";
import { playUi, unlockSound, type UiCue } from "@/lib/sfx";

/** In-match buttons: big turn actions confirm, other buttons select, cards and small chrome are soft. */
function stageCue(node: Element): UiCue {
  if (node.matches(".act.is-end, .act.is-pass, .act.ok, .vow-ok")) return "confirm";
  if (node.matches(".act, .act-chip, .ask-card button")) return "select";
  return "soft";
}

/**
 * Every other screen (deck builder, deck select, tutorials, sheets) uses the menu sounds too, instead of the old
 * beep (owner, 18/10): main actions confirm, close buttons and small chips are soft, other buttons select.
 */
function pageCue(node: Element): UiCue {
  if (node.matches(".lor-play, .dk-cover-set")) return "confirm";
  if (node.matches(".msheet-x, .lor-x, .dk-tip, .dk-chip, .dk-search-x, [aria-label='Đóng']")) return "soft";
  return "select";
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
      else playUi(pageCue(node));
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
