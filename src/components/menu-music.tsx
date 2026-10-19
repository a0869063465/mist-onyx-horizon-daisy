import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { FIRST_TRACK, MATCH_TRACKS, pickTrack as pick, TRACKS } from "@/lib/music";
import { fxUrl, musicJob } from "@/lib/preload";
import { loudness, MUSIC_EVENT, musicVolume, soundOn } from "@/lib/sfx";

/** In a match the music sits under the card sounds, so it plays at this share of the Nhạc nền slider. */
const MATCH_SHARE = 0.6;

/** Its own volume (Tuỳ chỉnh → Âm thanh → Nhạc nền), silent when the sound is off. */
function level(inMatch: boolean) {
  return soundOn() ? Math.min(1, loudness(musicVolume()) * (inMatch ? MATCH_SHARE : 1)) : 0;
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

  // The track playing, by its name; the player itself may be given the in-memory copy (fxUrl) instead.
  const track = useRef("");

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    player.current = audio;
    const load = (src: string) => {
      track.current = src;
      audio.src = fxUrl(src);
      // Fetch the other tracks whole in the background, so the next one starts at once too.
      for (const other of [...TRACKS, ...MATCH_TRACKS]) if (other !== src) void musicJob(other);
    };
    const next = () => {
      load(pick(list()));
      audio.volume = level(matchRef.current);
      if (audio.volume > 0) void audio.play().catch(() => undefined);
    };
    audio.addEventListener("ended", next);
    track.current = matchRef.current ? pick(MATCH_TRACKS) : FIRST_TRACK;
    audio.src = fxUrl(track.current);
    const start = () => {
      audio.volume = level(matchRef.current);
      if (!audio.paused || audio.volume <= 0) return;
      // Not started yet: if the load screen has the whole file by now, play that copy (no wait on the network).
      const ready = fxUrl(track.current);
      if (audio.currentTime === 0 && audio.src !== new URL(ready, location.href).href) audio.src = ready;
      void audio.play().catch(() => undefined);
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
    if (!wanted.includes(track.current)) {
      track.current = pick(wanted);
      audio.src = fxUrl(track.current);
    }
    audio.volume = level(inMatch);
    if (audio.volume > 0) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [inMatch]);

  return null;
}
