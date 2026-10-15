import { useEffect } from "react";
import { playTap, unlockSound } from "@/lib/sfx";

export function SoundTap() {
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      unlockSound();
      const node = event.target instanceof Element ? event.target.closest("button, a, [role='button']") : null;
      if (!node || node.hasAttribute("disabled")) return;
      if (node instanceof HTMLInputElement) return;
      playTap();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
