import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { MUSIC_EVENT, musicVolume, soundOn } from "@/lib/sfx";

/** The owner's two outside-a-match tracks (18/10): one of them at random, then another at random when it ends. */
const TRACKS = ["/music/vong-lap-thu-bai-1.m4a", "/music/vong-lap-thu-bai-2.m4a"];
/** Its own volume (Tuỳ chỉnh → Âm thanh → Nhạc nền), silent when the sound is off. */
function level() {
  return soundOn() ? musicVolume() / 100 : 0;
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
    window.addEventListener("pointerdown", start);
    // The music volume or the sound switch changed in Tuỳ chỉnh: follow it at once.
    const follow = () => {
      audio.volume = level();
      if (audio.volume === 0) audio.pause();
      else if (wanted.current && audio.paused) void audio.play().catch(() => undefined);
    };
    window.addEventListener(MUSIC_EVENT, follow);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener(MUSIC_EVENT, follow);
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
