import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { MUSIC_EVENT, musicVolume, soundOn } from "@/lib/sfx";

/** The owner's two outside-a-match tracks (18/10): one of them at random, then another at random when it ends. */
const TRACKS = ["/music/vong-lap-thu-bai-1.m4a", "/music/vong-lap-thu-bai-2.m4a"];
/** The owner's match track (19/10), played over and over. */
const MATCH_TRACKS = ["/music/vong-lan-card.mp3"];
/** In a match the music sits under the card sounds, so it plays at this share of the Nhạc nền slider. */
const MATCH_SHARE = 0.6;

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/** Its own volume (Tuỳ chỉnh → Âm thanh → Nhạc nền), silent when the sound is off. */
function level(inMatch: boolean) {
  return soundOn() ? (musicVolume() / 100) * (inMatch ? MATCH_SHARE : 1) : 0;
}

/**
 * Background music: outside a match (menu, Chọn bộ bài, Chỉnh sửa bộ bài, Tuỳ chỉnh…) the two Vòng Lặp Thú Bài
 * tracks, in a match Vòng Lặp Card. Phones only let sound start after a touch, so it begins on the first one.
 */
export function MenuMusic() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const inMatch = path === "/play";
  const player = useRef<HTMLAudioElement | null>(null);
  const matchRef = useRef(inMatch);
  matchRef.current = inMatch;
  const list = () => (matchRef.current ? MATCH_TRACKS : TRACKS);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    player.current = audio;
    const next = () => {
      audio.src = pick(list());
      audio.volume = level(matchRef.current);
      if (audio.volume > 0) void audio.play().catch(() => undefined);
    };
    audio.addEventListener("ended", next);
    audio.src = pick(list());
    const start = () => {
      audio.volume = level(matchRef.current);
      if (audio.paused && audio.volume > 0) void audio.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", start);
    // The music volume or the sound switch changed in Tuỳ chỉnh: follow it at once.
    const follow = () => {
      audio.volume = level(matchRef.current);
      if (audio.volume === 0) audio.pause();
      else if (audio.paused) void audio.play().catch(() => undefined);
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

  // Entering or leaving a match switches to the other music.
  useEffect(() => {
    const audio = player.current;
    if (!audio) return;
    const wanted = inMatch ? MATCH_TRACKS : TRACKS;
    if (!wanted.some((src) => audio.src.endsWith(src))) audio.src = pick(wanted);
    audio.volume = level(inMatch);
    if (audio.volume > 0) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [inMatch]);

  return null;
}
