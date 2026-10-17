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

/** Noise through a band that sweeps, with the given band width: the body of a whoosh or a hiss. */
function noiseBand(audio: AudioContext, start: number, dur: number, from: number, to: number, q: number) {
  const frames = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  const node = audio.createBufferSource();
  const band = audio.createBiquadFilter();
  node.buffer = buffer;
  band.type = "bandpass";
  band.Q.value = q;
  band.frequency.setValueAtTime(from, start);
  band.frequency.exponentialRampToValueAtTime(to, start + dur);
  node.connect(band);
  node.start(start);
  node.stop(start + dur + 0.02);
  return { node, band };
}

/** The whirlpool: rushing air that circles left and right faster and faster as it is drawn in and rises. */
function whirl(audio: AudioContext, start: number, dur: number, level: number) {
  const { band } = noiseBand(audio, start, dur, 600, 2600, 2.6);
  const lfo = audio.createOscillator();
  const sweep = audio.createGain();
  const amp = audio.createGain();
  lfo.frequency.setValueAtTime(2.2, start);
  lfo.frequency.exponentialRampToValueAtTime(13, start + dur * 0.85);
  sweep.gain.value = 420;
  lfo.connect(sweep);
  sweep.connect(band.frequency);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), start + dur * 0.8);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  band.connect(amp);
  const pan = typeof audio.createStereoPanner === "function" ? audio.createStereoPanner() : null;
  if (pan) {
    const swing = audio.createGain();
    swing.gain.value = 0.75;
    lfo.connect(swing);
    swing.connect(pan.pan);
    amp.connect(pan);
    pan.connect(audio.destination);
  } else amp.connect(audio.destination);
  lfo.start(start);
  lfo.stop(start + dur + 0.02);
}

/** A deep roar that throbs faster as it grows: the pull of the fusion and its flash. */
function rumble(audio: AudioContext, start: number, dur: number, peak: number, level: number) {
  const saw = audio.createOscillator();
  const sub = audio.createOscillator();
  const low = audio.createBiquadFilter();
  const throb = audio.createGain();
  const lfo = audio.createOscillator();
  const depth = audio.createGain();
  const amp = audio.createGain();
  const { band: air } = noiseBand(audio, start, dur, 140, 320, 0.8);
  saw.type = "sawtooth";
  sub.type = "sine";
  saw.frequency.setValueAtTime(48, start);
  saw.frequency.exponentialRampToValueAtTime(86, start + peak);
  sub.frequency.setValueAtTime(36, start);
  sub.frequency.exponentialRampToValueAtTime(54, start + peak);
  low.type = "lowpass";
  low.Q.value = 2.5;
  low.frequency.setValueAtTime(180, start);
  low.frequency.exponentialRampToValueAtTime(420, start + peak);
  low.frequency.exponentialRampToValueAtTime(160, start + dur);
  lfo.frequency.setValueAtTime(6, start);
  lfo.frequency.linearRampToValueAtTime(12, start + peak);
  depth.gain.value = 0.45;
  throb.gain.value = 0.55;
  lfo.connect(depth);
  depth.connect(throb.gain);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), start + peak);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  saw.connect(low);
  sub.connect(low);
  air.connect(low);
  low.connect(throb);
  throb.connect(amp);
  amp.connect(audio.destination);
  for (const node of [saw, sub, lfo]) {
    node.start(start);
    node.stop(start + dur + 0.02);
  }
}

/** A bright, trembling ring high above the roar while the light bursts and the screen whites out. */
function shimmer(audio: AudioContext, start: number, dur: number, level: number) {
  const amp = audio.createGain();
  const lfo = audio.createOscillator();
  const depth = audio.createGain();
  const shake = audio.createGain();
  lfo.frequency.value = 9;
  depth.gain.value = 0.35;
  shake.gain.value = 0.65;
  lfo.connect(depth);
  depth.connect(shake.gain);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), start + dur * 0.3);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  for (const freq of [1975.5, 2093, 2217.5]) {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.06, start + dur);
    osc.connect(shake);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }
  shake.connect(amp);
  amp.connect(audio.destination);
  lfo.start(start);
  lfo.stop(start + dur + 0.02);
}

/**
 * Fusion, on the beats of the scene (FUSE_BEATS in fuse-dance.tsx): both monsters rise (wind), rush in and smash
 * (a heavy metal hit), spring apart (a whoosh), circle into the whirlpool (rushing air swinging left and right,
 * faster and faster) over a deep throbbing roar that peaks with the flash (glass chimes and a trembling ring), the
 * screen whites out (an airy swell with a choir), the fused monster turns in (a whoosh) and rings in.
 */
function fuseRite(delay: number) {
  whenReady(() => {
    const audio = ctx;
    if (!audio) return;
    const vol = Math.min(1.5, (fxVolume() / 100) * 1.35);
    if (vol <= 0) return;
    const t = audio.currentTime + delay;
    noiseBurst(audio, t, 0.55, 300, 1800, 0.14 * vol);
    noiseBurst(audio, t + 0.56, 0.22, 900, 3200, 0.12 * vol);
    const hit = t + 0.78;
    thump(audio, hit, 0.9 * vol);
    thump(audio, hit + 0.04, 0.5 * vol);
    for (const [freq, at] of [[1318.5, 0], [1975.5, 0.005], [2793.8, 0.01], [3729.3, 0.015]] as const) bell(audio, hit + at, freq, 0.6, 0.05 * vol);
    noiseBurst(audio, hit, 0.3, 3200, 400, 0.24 * vol);
    noiseBurst(audio, hit + 0.02, 0.38, 1800, 420, 0.12 * vol);
    whirl(audio, t + 1.2, 1.45, 0.2 * vol);
    rumble(audio, t + 1.65, 1.95, 1.0, 0.34 * vol);
    const flash = t + 2.3;
    for (const [freq, at] of [[2093, 0], [2637, 0.04], [3136, 0.08], [3951, 0.12], [4699, 0.16]] as const) bell(audio, flash + at, freq, 1.0, 0.045 * vol);
    noiseBurst(audio, flash, 0.8, 5200, 9000, 0.07 * vol);
    shimmer(audio, flash, 1.2, 0.035 * vol);
    const white = t + 2.84;
    noiseBurst(audio, white, 1.2, 180, 6200, 0.26 * vol);
    thump(audio, white, 0.5 * vol);
    for (const freq of [220, 277.2, 329.6, 440]) pad(audio, white, freq, 1.6, 0.05 * vol);
    noiseBurst(audio, t + 3.08, 0.4, 600, 2600, 0.1 * vol);
    const ring = t + 3.4;
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
