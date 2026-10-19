import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { fxVolume, soundOn } from "@/lib/sfx";

/** The owner's two outside-a-match tracks (18/10): one of them at random, then another at random when it ends. */
const TRACKS = ["/music/vong-lap-thu-bai-1.m4a", "/music/vong-lap-thu-bai-2.m4a"];
/** Music sits under the effects: half the effects volume. */
const MUSIC_SHARE = 0.5;

function level() {
  return soundOn() ? (fxVolume() / 100) * MUSIC_SHARE : 0;
}

/**
 * Background music on every screen outside a match (menu, Chọn bộ bài, Chỉnh sửa bộ bài, Tuỳ chỉnh…). It stops in
 * a match and comes back after. Phones only let sound start after a touch, so it begins on the first one.
 */
export function MenuMusic() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const outside = path !== "/play";
  const player = useRef<HTMLAudioElement | null>(null);
  const wanted = useRef(outside);
  wanted.current = outside;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    player.current = audio;
    const next = () => {
      audio.src = TRACKS[Math.floor(Math.random() * TRACKS.length)];
      audio.volume = level();
      if (wanted.current && audio.volume > 0) void audio.play().catch(() => undefined);
    };
    audio.addEventListener("ended", next);
    audio.src = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    const start = () => {
      audio.volume = level();
      if (wanted.current && audio.paused && audio.volume > 0) void audio.play().catch(() => undefined);
    };
    // Volume or sound switched in Tuỳ chỉnh: follow it on the next touch.
    window.addEventListener("pointerdown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      audio.removeEventListener("ended", next);
      audio.pause();
      player.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = player.current;
    if (!audio) return;
    if (!outside) {
      audio.pause();
      return;
    }
    audio.volume = level();
    if (audio.volume > 0) void audio.play().catch(() => undefined);
  }, [outside]);

  return null;
}
