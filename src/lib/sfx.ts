const KEY = "clash-sound";
const FX_KEY = "clash-vol-fx";
const TAP_KEY = "clash-vol-tap";

export type Cue = "summon" | "spell" | "skill" | "attack" | "block" | "hit" | "star" | "win" | "lose" | "tap" | "draw" | "spellRise" | "spellBoom" | "veil" | "swordBoom" | "firePrep" | "boltPrep" | "boltBoom" | "boltSmall" | "laserBoom" | "poison" | "reflect" | "chain" | "dispel" | "sacrifice" | "gunPrep" | "gunBoom" | "shield" | "timeFlow" | "timeAge" | "timeBoost" | "reelSpin" | "reelStop" | "reelPair" | "reelTriple" | "reelSeven" | "reelSix" | "fusion" | "riteSummon" | "fuseRite";

const CLIPS: Partial<Record<Cue, string>> = {
  summon: "/sfx/user-summon.ogg?v=4",
  attack: "/sfx/user-attack.ogg?v=4",
  draw: "/sfx/user-draw.ogg?v=4",
  block: "/sfx/user-block.ogg?v=6",
  hit: "/sfx/user-hit.ogg?v=5",
  spellRise: "/sfx/user-spell-rise.ogg?v=4",
  spellBoom: "/sfx/user-spell-boom.ogg?v=4",
  veil: "/sfx/veil-attack.ogg?v=1",
  swordBoom: "/sfx/lua-chay.mp3?v=2",
  firePrep: "/sfx/chuan-bi-skill.mp3?v=1",
  boltPrep: "/sfx/set-phat.mp3?v=2",
  boltBoom: "/sfx/set-no.mp3?v=2",
  boltSmall: "/sfx/set-nho.mp3?v=1",
  laserBoom: "/sfx/laser-no.mp3?v=1",
  poison: "/sfx/doc.mp3?v=2",
  reflect: "/sfx/guong-vo.mp3?v=1",
  chain: "/sfx/xich.mp3?v=2",
  dispel: "/sfx/giai-tru.mp3?v=1",
  sacrifice: "/sfx/hien-te.mp3?v=1",
  gunPrep: "/sfx/sung-phat.mp3?v=1",
  gunBoom: "/sfx/sung-no.mp3?v=1",
  shield: "/sfx/khien-buff.mp3?v=2",
  timeFlow: "/sfx/thoi-gian-dong.mp3?v=2",
  timeAge: "/sfx/thoi-gian-lao.mp3?v=2",
  timeBoost: "/sfx/thoi-gian-cuong.mp3?v=2",
  reelSpin: "/sfx/quay-quay.mp3?v=1",
  reelStop: "/sfx/quay-dung.mp3?v=2",
  reelPair: "/sfx/quay-trung-2.mp3?v=2",
  reelTriple: "/sfx/quay-trung-3.mp3?v=2",
  reelSeven: "/sfx/quay-trung-7.mp3?v=5",
  reelSix: "/sfx/quay-truot.mp3?v=2",
  fusion: "/sfx/dung-hop.mp3?v=1",
};

const CLIP_DELAY: Partial<Record<Cue, number>> = {};

let ctx: AudioContext | null = null;
const cache = new Map<string, Promise<AudioBuffer>>();
const pending: Array<() => void> = [];

function flush() {
  if (!ctx || ctx.state !== "running") return;
  const jobs = pending.splice(0);
  for (const job of jobs) job();
}

function whenReady(job: () => void) {
  const audio = context();
  if (!audio) return;
  if (audio.state === "running") job();
  else {
    pending.push(job);
    void audio.resume().then(flush);
  }
}

function readLevel(key: string) {
  if (typeof localStorage === "undefined") return 100;
  const raw = localStorage.getItem(key);
  if (raw == null || raw.trim() === "") return 100;
  const level = Number(raw);
  if (!Number.isFinite(level)) return 100;
  return Math.min(100, Math.max(0, level));
}

export function soundOn() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(KEY) !== "off";
}

export function setSound(next: boolean) {
  localStorage.setItem(KEY, next ? "on" : "off");
}

export function fxVolume() {
  return readLevel(FX_KEY);
}

export function tapVolume() {
  return readLevel(TAP_KEY);
}

export function setFxVolume(value: number) {
  localStorage.setItem(FX_KEY, String(Math.min(100, Math.max(0, Math.round(value)))));
  setSound(true);
}

export function setTapVolume(value: number) {
  localStorage.setItem(TAP_KEY, String(Math.min(100, Math.max(0, Math.round(value)))));
  setSound(true);
}

export function unlockSound() {
  const audio = context();
  if (!audio) return;
  void audio.resume().then(flush);
  for (const src of Object.values(CLIPS)) if (src) void load(src);
}

/** Every recorded sound, fetched and decoded ahead so the first play is never silent. */
export function soundJobs(): Array<() => Promise<unknown>> {
  if (typeof window === "undefined") return [];
  return [...new Set(Object.values(CLIPS))].filter(Boolean).map((src) => () => load(src as string));
}

function load(src: string) {
  const pending = cache.get(src);
  if (pending) return pending;
  const next = fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(src);
      return res.arrayBuffer();
    })
    .then((raw) => {
      const audio = ctx ?? new AudioContext();
      ctx = audio;
      return audio.decodeAudioData(raw.slice(0));
    })
    .catch((error) => {
      cache.delete(src);
      throw error;
    });
  cache.set(src, next);
  return next;
}

let poisonNode: AudioBufferSourceNode | null = null;

function playClip(src: string, delay = 0, replace = false, offset = 0) {
  whenReady(() => {
    void load(src)
      .then((buffer) => {
        if (!ctx || !soundOn()) return;
        if (replace) {
          try {
            poisonNode?.stop();
          } catch {
            /* already ended */
          }
          poisonNode = null;
        }
        const node = ctx.createBufferSource();
        const amp = ctx.createGain();
        node.buffer = buffer;
        amp.gain.value = Math.min(1.5, (fxVolume() / 100) * 1.35);
        node.connect(amp);
        amp.connect(ctx.destination);
        node.start(ctx.currentTime + delay, Math.min(Math.max(0, offset), Math.max(0, buffer.duration - 0.05)));
        if (replace) poisonNode = node;
      })
      .catch(() => undefined);
  });
}

function context() {
  if (!soundOn() || typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number, slide = freq) {
  whenReady(() => {
    const audio = ctx;
    if (!audio) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const start = audio.currentTime + at;
    const level = Math.min(0.9, gain * (fxVolume() / 100) * 6);
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), start + dur);
    amp.gain.setValueAtTime(Math.max(0.0001, level), start);
    amp.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  });
}

export function playTap() {
  whenReady(() => {
    const audio = ctx;
    if (!audio) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const start = audio.currentTime;
    const level = Math.min(0.55, (tapVolume() / 100) * 0.5);
    osc.type = "square";
    osc.frequency.setValueAtTime(740, start);
    osc.frequency.exponentialRampToValueAtTime(420, start + 0.05);
    amp.gain.setValueAtTime(Math.max(0.0001, level), start);
    amp.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.07);
  });
}

export function playCue(kind: Cue, delay?: number, offset = 0) {
  if (kind === "tap") return playTap();
  if (kind === "riteSummon") return riteSummon(delay ?? 0);
  if (kind === "fuseRite") return fuseRite(delay ?? 0);
  const clip = CLIPS[kind];
  if (clip) return playClip(clip, delay ?? CLIP_DELAY[kind] ?? 0, kind === "poison", offset);
  if (kind === "block" || kind === "hit") tone(140, 0, 0.12, "square", 0.07, 70);
  if (kind === "star") tone(660, 0, 0.16, "triangle", 0.08, 990);
  if (kind === "win") {
    tone(523, 0, 0.16, "triangle", 0.08, 523);
    tone(659, 0.14, 0.16, "triangle", 0.08, 659);
    tone(784, 0.28, 0.28, "triangle", 0.08, 784);
  }
  if (kind === "lose") tone(220, 0, 0.35, "sine", 0.08, 110);
}

export type UiCue = "confirm" | "select" | "soft";

function noiseBurst(audio: AudioContext, start: number, dur: number, from: number, to: number, level: number) {
  const frames = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  const node = audio.createBufferSource();
  const band = audio.createBiquadFilter();
  const amp = audio.createGain();
  node.buffer = buffer;
  band.type = "bandpass";
  band.Q.value = 1.4;
  band.frequency.setValueAtTime(from, start);
  band.frequency.exponentialRampToValueAtTime(to, start + dur);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), start + dur * 0.35);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  node.connect(band);
  band.connect(amp);
  amp.connect(audio.destination);
  node.start(start);
  node.stop(start + dur + 0.02);
}

function bell(audio: AudioContext, start: number, freq: number, dur: number, level: number) {
  const osc = audio.createOscillator();
  const shine = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = "triangle";
  shine.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  shine.frequency.setValueAtTime(freq * 2.01, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp);
  shine.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  shine.start(start);
  osc.stop(start + dur + 0.02);
  shine.stop(start + dur + 0.02);
}

function thump(audio: AudioContext, start: number, level: number) {
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, start);
  osc.frequency.exponentialRampToValueAtTime(52, start + 0.22);
  amp.gain.setValueAtTime(Math.max(0.0001, level), start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  osc.stop(start + 0.28);
}

/** Sacrifice summon: a dark rising drone and a rushing wind that slam into a deep boom, then a low choir chord. */
function riteSummon(delay: number) {
  whenReady(() => {
    const audio = ctx;
    if (!audio) return;
    const vol = Math.min(1.5, (fxVolume() / 100) * 1.35);
    if (vol <= 0) return;
    const t = audio.currentTime + delay;
    const drone = audio.createOscillator();
    const under = audio.createOscillator();
    const low = audio.createBiquadFilter();
    const amp = audio.createGain();
    drone.type = "sawtooth";
    under.type = "sine";
    drone.frequency.setValueAtTime(46, t);
    drone.frequency.exponentialRampToValueAtTime(92, t + 0.95);
    under.frequency.setValueAtTime(23, t);
    under.frequency.exponentialRampToValueAtTime(46, t + 0.95);
    low.type = "lowpass";
    low.frequency.setValueAtTime(220, t);
    low.frequency.exponentialRampToValueAtTime(1400, t + 0.95);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.8);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
    drone.connect(low);
    under.connect(low);
    low.connect(amp);
    amp.connect(audio.destination);
    drone.start(t);
    under.start(t);
    drone.stop(t + 1.2);
    under.stop(t + 1.2);
    noiseBurst(audio, t + 0.1, 0.85, 260, 5200, 0.2 * vol);
    const hit = t + 0.95;
    thump(audio, hit, 0.9 * vol);
    thump(audio, hit + 0.05, 0.6 * vol);
    noiseBurst(audio, hit, 0.9, 3800, 180, 0.32 * vol);
    for (const [freq, at] of [[110, 0], [164.8, 0.02], [220, 0.04], [329.6, 0.07]] as const) bell(audio, hit + at, freq, 1.6, 0.07 * vol);
  });
}

/** A soft pad note that swells in and fades: the choir under the fusion. */
function pad(audio: AudioContext, start: number, freq: number, dur: number, level: number) {
  const osc = audio.createOscillator();
  const air = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = "triangle";
  air.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  air.frequency.setValueAtTime(freq * 2.003, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), start + dur * 0.45);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp);
  air.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  air.start(start);
  osc.stop(start + dur + 0.02);
  air.stop(start + dur + 0.02);
}

/**
 * Fusion, timed to the scene: the card sweeps onto its partner (rising wind), the two flare into a star
 * (glass chimes), the screen whites out (a huge airy swell with a choir), and the new monster rings in.
 */
function fuseRite(delay: number) {
  whenReady(() => {
    const audio = ctx;
    if (!audio) return;
    const vol = Math.min(1.5, (fxVolume() / 100) * 1.35);
    if (vol <= 0) return;
    const t = audio.currentTime + delay;
    noiseBurst(audio, t, 0.85, 250, 2600, 0.16 * vol);
    tone(330, delay + 0.05, 0.8, "sine", 0.02, 660);
    const flare = t + 0.9;
    for (const [freq, at] of [[1568, 0], [2093, 0.05], [2637, 0.1], [3136, 0.15], [3951, 0.2], [2637, 0.3], [3520, 0.38]] as const) bell(audio, flare + at, freq, 0.9, 0.05 * vol);
    noiseBurst(audio, flare, 0.8, 5200, 9000, 0.07 * vol);
    const white = t + 1.65;
    noiseBurst(audio, white, 1.3, 180, 6200, 0.3 * vol);
    thump(audio, white + 0.05, 0.55 * vol);
    for (const freq of [220, 277.2, 329.6, 440]) pad(audio, white, freq, 1.9, 0.06 * vol);
    const ring = t + 2.5;
    for (const [freq, at] of [[523.3, 0], [659.3, 0.04], [784, 0.08], [1046.5, 0.12]] as const) bell(audio, ring + at, freq, 1.4, 0.08 * vol);
  });
}

/** Menu sounds: confirm = main action, select = secondary button, soft = small links. */
export function playUi(cue: UiCue) {
  whenReady(() => {
    const audio = ctx;
    if (!audio) return;
    const vol = tapVolume() / 100;
    if (vol <= 0) return;
    const t = audio.currentTime;
    if (cue === "confirm") {
      thump(audio, t, 0.55 * vol);
      noiseBurst(audio, t, 0.32, 600, 5200, 0.16 * vol);
      bell(audio, t + 0.04, 784, 0.6, 0.11 * vol);
      bell(audio, t + 0.1, 1175, 0.7, 0.09 * vol);
      bell(audio, t + 0.16, 1568, 0.8, 0.07 * vol);
    } else if (cue === "select") {
      noiseBurst(audio, t, 0.14, 1800, 4200, 0.08 * vol);
      bell(audio, t + 0.01, 988, 0.32, 0.09 * vol);
      bell(audio, t + 0.06, 1319, 0.36, 0.06 * vol);
    } else {
      noiseBurst(audio, t, 0.05, 3200, 2400, 0.06 * vol);
      bell(audio, t, 1480, 0.12, 0.05 * vol);
    }
  });
}
