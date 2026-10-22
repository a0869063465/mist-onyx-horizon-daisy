import { artSrc, monsterCard, spellCard, spellSrc } from "./catalog.ts";
import { ENV_BOARDS, DEFAULT_BOARD_ART, bottomArt, topArt } from "./env-boards.ts";
import { FIRST_TRACK, MATCH_TRACKS } from "./music.ts";
import { soundJobs } from "./sfx.ts";
import type { Duel } from "./duel.ts";

export type Job = () => Promise<unknown>;

/** Decoded pictures stay referenced here so the browser keeps them in memory for the whole session. */
const pictures = new Map<string, HTMLImageElement>();
/** Effect videos are held as in-memory files; fxUrl hands the copy to <video> so it never waits on the network. */
const clips = new Map<string, string>();
const clipJobs = new Map<string, Promise<unknown>>();

export function fxUrl(src: string): string {
  return clips.get(src) ?? src;
}

/** A music track as an in-memory file once fetched (the music player asks with fxUrl); fetches it otherwise. */
export function musicJob(src: string): Promise<unknown> {
  return clip(src);
}

function picture(src: string): Promise<unknown> {
  if (!src || pictures.has(src)) return Promise.resolve();
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  pictures.set(src, img);
  return img.decode().catch(() => undefined);
}

function clip(src: string): Promise<unknown> {
  const known = clipJobs.get(src);
  if (known) return known;
  const job = fetch(src)
    .then((res) => (res.ok ? res.blob() : null))
    .then((blob) => {
      if (blob) clips.set(src, URL.createObjectURL(blob));
    })
    .catch(() => undefined);
  clipJobs.set(src, job);
  return job;
}

function font(): Promise<unknown> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load('800 16px "Barlow Condensed"', "Aă"),
    document.fonts.load('700 16px "Be Vietnam Pro"', "Aă"),
  ]).catch(() => undefined);
}

/** Effect videos, kept as named so the players can ask fxUrl for the same string. */
export const FX_VIDEOS = [
  "/fx/lua-no.mp4?v=2",
  "/fx/laser.mp4?v=2",
  "/fx/set-dien.mp4?v=1",
  "/fx/set-to.mp4?v=1",
  "/fx/hien-te-vong.mp4?v=2",
];

const CORE_PICTURES = [
  "/home-bg.jpg",
  "/title.png",
  DEFAULT_BOARD_ART,
  "/board-bleed.jpg",
  "/card-frame.png",
  "/spell-frame.png",
  "/field-frame.png",
  "/mark-tang.png",
  "/mark-giam.png",
  "/mark-moi.png",
  "/env/seam.png",
  "/tutorial/nguoi-giu-khoa.webp",
  "/ui/fuse-swirl.webp",
  "/ui/cover-frame.png",
  "/ui/logo.webp",
  "/ui/pack.webp",
  "/ui/card-back.webp",
  "/ui/card-back-sr.webp",
  "/ui/card-back-ur.webp",
  "/fx/skull.png",
  "/fx/rebound.png",
  "/fx/doc.gif",
  "/fx/nuoc-lon.png?v=3",
  "/fx/nuoc-nho.png?v=2",
  "/fx/nuoc-vua.png?v=2",
  "/art/gun-phys.png?v=1",
  "/art/gun-spell.png?v=1",
  "/art/gun-tru.png?v=1",
  "/art/reel-kiem.png?v=3",
  "/art/reel-tim.png?v=3",
  "/art/time-wheel.png?v=1",
  "/art/time-needle.png?v=1",
];

/** Game load: everything any match may need that does not depend on the decks. */
export function gameJobs(): Job[] {
  if (typeof window === "undefined") return [];
  const boards = Object.values(ENV_BOARDS).flatMap((art) => [art.top, art.bottom]);
  return [
    font,
    ...[...new Set([...CORE_PICTURES, ...boards])].map((src) => () => picture(src)),
    ...FX_VIDEOS.map((src) => () => clip(src)),
    ...soundJobs(),
    () => clip(FIRST_TRACK),
  ];
}

/** Match load: the art of every card both sides brought, and the two board halves. */
export function matchJobs(duel: Duel): Job[] {
  if (typeof window === "undefined") return [];
  const srcs = new Set<string>([topArt(duel.players[1].env), bottomArt(duel.players[0].env), topArt(duel.players[0].env), bottomArt(duel.players[1].env)]);
  for (const player of duel.players) {
    const monsters = new Set<string>([...(player.roster ?? []), ...player.reserve.map((held) => held.id), ...player.monsterDeck.map((held) => held.id)]);
    for (const id of monsters) {
      if (!monsterCard(id)) continue;
      srcs.add(artSrc(id));
      if (id === "te-giac-be-con") {
        srcs.add(artSrc(id, 2));
        srcs.add(artSrc(id, 3));
      }
    }
    const spells = new Set<string>([...player.hand, ...player.spellDeck, ...(player.env ? [player.env] : [])]);
    for (const id of spells) if (spellCard(id)) srcs.add(spellSrc(id));
  }
  // The champions of the VS screen: a cover can be a form the deck makes, not a card in it.
  for (const face of duel.faces ?? []) if (face.cover && monsterCard(face.cover)) srcs.add(artSrc(face.cover));
  return [...[...srcs].filter(Boolean).map((src) => () => picture(src)), ...MATCH_TRACKS.map((src) => () => clip(src))];
}

/** Runs every job, a few at a time; progress counts finished jobs, failed ones included, so it always reaches 100%. */
export async function runJobs(jobs: Job[], onProgress: (done: number, total: number) => void, lanes = 6): Promise<void> {
  const total = jobs.length;
  let done = 0;
  let next = 0;
  onProgress(0, total);
  const lane = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      await Promise.race([job().catch(() => undefined), new Promise((resolve) => setTimeout(resolve, 30000))]);
      done += 1;
      onProgress(done, total);
    }
  };
  await Promise.all(Array.from({ length: Math.min(lanes, Math.max(1, total)) }, lane));
}
