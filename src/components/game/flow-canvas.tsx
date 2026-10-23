import { useEffect, useLayoutEffect, useRef } from "react";
import type { FlowTone } from "@/lib/reaction-chain";

/*
 * The smoke of the reaction icons (chủ game 23/10, after the flows of Runeterra): no line and no thread, only soft
 * smoke drifting from an icon to what it acts on along a bend like a river's, billowing and thinning as it goes, with
 * a faint glow where it lands. Puffs of a few soft sprites, added up ("lighter"), make the stream; each flow fades in
 * as it grows from its icon, surges along its bend when its icon fires and thins away when it fizzles.
 */

/** A point or a direction in the 90 × 160 box the board is drawn in (it is 9:16, so the smoke stays round). */
export type BoxPt = { x: number; y: number };

export type FlowSpec = {
  key: string;
  /** Where it leaves and where it lands. */
  a: BoxPt;
  b: BoxPt;
  /** Unit directions: leaving `a`, and arriving at `b`. */
  out: BoxPt;
  into: BoxPt;
  tone: FlowTone;
  done: boolean;
  end: "fire" | "fizzle" | null;
  /** Seconds its end waits, for the big card still flying into the icon. */
  late: number;
  /** An attack: its blow is drawn on the board, so its smoke only fades as it lands. */
  strike: boolean;
  /** Seconds before the smoke starts: an attacker still lunging. */
  delay: number;
};

type Pal = { core: string; mid: string; deep: string };

const PAL: Record<FlowTone, Pal> = {
  red: { core: "#ffd9cf", mid: "#ff4b30", deep: "#b0140a" },
  blue: { core: "#dcf7ff", mid: "#3cb4ff", deep: "#1456c8" },
  pink: { core: "#ffdcef", mid: "#ff4fa6", deep: "#a3105c" },
  white: { core: "#ffffff", mid: "#e9f3ff", deep: "#8fa6cc" },
  green: { core: "#ddffe8", mid: "#3fe07c", deep: "#0f8a42" },
};

/** Box units per second the smoke drifts at, and puffs along each box unit of path (the same on a short flow as on
 *  a long one). */
const DRIFT = 34;
const DENSITY = 2;
const MAX_PUFFS = 520;
/** The end of a fire: the surge's run, and the bloom where it lands. */
const SURGE = 0.42;
const BLOOM = 0.55;

type Row = { x: number; y: number; nx: number; ny: number };
type Geo = { sig: string; rows: Row[]; len: number };
type Puff = { key: string; u: number; speed: number; off: number; wob: number; phase: number; size: number; alpha: number; art: number; bright?: number };
/** Puff shapes: wisps drawn along the flow, this many times longer than wide. */
const STRETCH = 1.7;
type Burst = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; tone: FlowTone };
type Track = {
  spec: FlowSpec;
  born: number;
  doneAt: number | null;
  endAt: number | null;
  gone: number | null;
  geo: Geo | null;
  bow: number;
  carry: number;
  bloomed: boolean;
};

const ROWS = 64;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smooth(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Settling like the old line's streams: full for 40% of 1.5 seconds, then down to 22%. */
function settle(since: number): number {
  if (since <= 0) return 1;
  const k = since / 1.5;
  if (k <= 0.4) return 1;
  return 1 - 0.78 * smooth(0.4, 1, k);
}

export function FlowCanvas({ flows }: { flows: FlowSpec[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const specs = useRef<FlowSpec[]>(flows);
  const wake = useRef<() => void>(() => undefined);

  useLayoutEffect(() => {
    specs.current = flows;
    wake.current();
  }, [flows]);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;
    let W = 1;
    let H = 1;
    let dpr = 1;
    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = parent.clientWidth || 1;
      H = parent.clientHeight || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(parent);

    // Soft smoke wisps, longer than wide (drawn along the flow): a dozen overlapping blobs blurred together, three
    // shapes per colour, with no bright core so that only where they crowd does the smoke glow. And a round glow.
    const blurs = "filter" in ctx;
    const arts = new Map<string, HTMLCanvasElement[]>();
    const artsOf = (tone: FlowTone) => {
      const known = arts.get(tone);
      if (known) return known;
      const pal = PAL[tone];
      const list = [0, 1, 2].map((variant) => {
        const w = 128;
        const h = 64;
        const raw = document.createElement("canvas");
        raw.width = w;
        raw.height = h;
        const g = raw.getContext("2d")!;
        let seed = (variant + 1) * 9301 + tone.length * 49297;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        for (let i = 0; i < 12; i += 1) {
          const cx = w / 2 + (rnd() - 0.5) * 66;
          const cy = h / 2 + (rnd() - 0.5) * 16;
          const r = 10 + rnd() * 12;
          const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, rgba(i % 3 === 0 ? pal.core : pal.mid, 0.38));
          grad.addColorStop(0.6, rgba(pal.deep, 0.14));
          grad.addColorStop(1, rgba(pal.deep, 0));
          g.fillStyle = grad;
          g.beginPath();
          g.arc(cx, cy, r, 0, Math.PI * 2);
          g.fill();
        }
        if (!blurs) return raw;
        const soft = document.createElement("canvas");
        soft.width = w;
        soft.height = h;
        const sg = soft.getContext("2d")!;
        sg.filter = "blur(6px)";
        sg.drawImage(raw, 0, 0);
        return soft;
      });
      arts.set(tone, list);
      return list;
    };
    const glows = new Map<string, HTMLCanvasElement>();
    const glowOf = (tone: FlowTone) => {
      const known = glows.get(tone);
      if (known) return known;
      const pal = PAL[tone];
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, rgba(pal.core, 0.95));
      grad.addColorStop(0.28, rgba(pal.mid, 0.6));
      grad.addColorStop(1, rgba(pal.deep, 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      glows.set(tone, c);
      return c;
    };

    const tracks = new Map<string, Track>();
    const puffs: Puff[] = [];
    const bursts: Burst[] = [];
    let raf = 0;
    let last = 0;

    const sx = () => W / 90;
    const sy = () => H / 160;

    // The bend of a flow: it leaves square to its icon's card edge and lands square on its target, bowing gently to one
    // side on the way, the way a river never runs straight.
    const geoOf = (spec: FlowSpec, bow: number): Geo => {
      const ax = spec.a.x * sx();
      const ay = spec.a.y * sy();
      const bx = spec.b.x * sx();
      const by = spec.b.y * sy();
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / len;
      const ny = (bx - ax) / len;
      const reach = len * 0.42;
      const p1 = { x: ax + spec.out.x * reach + nx * bow * len * 0.26, y: ay + spec.out.y * reach + ny * bow * len * 0.26 };
      const p2 = { x: bx - spec.into.x * reach - nx * bow * len * 0.16, y: by - spec.into.y * reach - ny * bow * len * 0.16 };
      const at = (t: number) => {
        const u = 1 - t;
        return {
          x: u * u * u * ax + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * bx,
          y: u * u * u * ay + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * by,
        };
      };
      // Even steps along the bend, so the smoke drifts at one speed.
      const fine = 160;
      const pts = Array.from({ length: fine + 1 }, (_, i) => at(i / fine));
      const cum = [0];
      for (let i = 1; i <= fine; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const total = cum[fine] || 1;
      const rows: Row[] = [];
      let j = 0;
      for (let i = 0; i <= ROWS; i += 1) {
        const want = (i / ROWS) * total;
        while (j < fine - 1 && cum[j + 1] < want) j += 1;
        const span = cum[j + 1] - cum[j] || 1;
        const k = (want - cum[j]) / span;
        const x = pts[j].x + (pts[j + 1].x - pts[j].x) * k;
        const y = pts[j].y + (pts[j + 1].y - pts[j].y) * k;
        const dx = pts[j + 1].x - pts[j].x;
        const dy = pts[j + 1].y - pts[j].y;
        const d = Math.hypot(dx, dy) || 1;
        rows.push({ x, y, nx: -dy / d, ny: dx / d });
      }
      return { sig: sigOf(spec), rows, len: total };
    };
    const sigOf = (spec: FlowSpec) => `${W}x${H}:${spec.a.x},${spec.a.y},${spec.b.x},${spec.b.y},${spec.out.x},${spec.out.y},${spec.into.x},${spec.into.y}`;
    const rowAt = (geo: Geo, u: number): Row => {
      const f = clamp01(u) * ROWS;
      const i = Math.min(ROWS - 1, Math.floor(f));
      const k = f - i;
      const a = geo.rows[i];
      const b = geo.rows[i + 1];
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, nx: a.nx + (b.nx - a.nx) * k, ny: a.ny + (b.ny - a.ny) * k };
    };

    /** How strongly a flow shows now. */
    const fadeOf = (track: Track, now: number): number => {
      const spec = track.spec;
      let k = clamp01((now - track.born) / 0.25);
      if (track.gone !== null) k *= 1 - clamp01((now - track.gone) / 0.45);
      if (track.endAt !== null && spec.end === "fire" && spec.strike) k *= 1 - clamp01((now - (track.endAt + spec.late + 0.1)) / 0.3);
      else if (track.endAt !== null && spec.end === "fizzle") k *= 1 - 0.92 * smooth(0, 1, (now - (track.endAt + spec.late)) / 0.6);
      else if (track.endAt !== null && spec.end === "fire") k *= settle(now - (track.endAt + spec.late + 0.6));
      else if (track.doneAt !== null && spec.done) k *= settle(now - track.doneAt);
      return k;
    };

    const sync = (now: number) => {
      const seen = new Set<string>();
      for (const spec of specs.current) {
        seen.add(spec.key);
        let track = tracks.get(spec.key);
        if (!track) {
          track = { spec, born: now, doneAt: spec.done ? now : null, endAt: spec.end ? now : null, gone: null, geo: null, bow: (hash(spec.key) < 0.5 ? -1 : 1) * (0.55 + 0.45 * hash(`${spec.key}#`)), carry: 0, bloomed: false };
          tracks.set(spec.key, track);
        }
        if (track.gone !== null) track.gone = null;
        if (spec.done && track.doneAt === null) track.doneAt = now;
        if (spec.end && track.endAt === null) track.endAt = now;
        track.spec = spec;
      }
      for (const [key, track] of tracks) {
        if (!seen.has(key) && track.gone === null) track.gone = now;
      }
    };

    const spawn = (track: Track, now: number, dt: number) => {
      const spec = track.spec;
      const geo = track.geo;
      if (!geo || track.gone !== null || now - track.born < spec.delay) return;
      if (spec.end === "fizzle" && track.endAt !== null && now > track.endAt + spec.late) return;
      if (spec.end === "fire" && spec.strike && track.endAt !== null && now > track.endAt + spec.late + 0.1) return;
      const calm = (spec.done || spec.end) && !(spec.end === "fire" && track.endAt !== null && now < track.endAt + spec.late + 0.6) ? 0.45 : 1;
      track.carry += DENSITY * DRIFT * calm * dt;
      while (track.carry >= 1) {
        track.carry -= 1;
        if (puffs.length >= MAX_PUFFS) puffs.shift();
        // One puff in four is a wide, faint haze that binds the wisps into one stream.
        const haze = Math.random() < 0.25;
        puffs.push({
          key: spec.key,
          u: Math.random() * 0.025,
          speed: DRIFT * (0.8 + Math.random() * 0.4) * (haze ? 0.75 : 1),
          off: (Math.random() + Math.random() - 1) * 1.1,
          wob: 1.4 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
          size: (0.8 + Math.random() * 0.5) * (haze ? 1.9 : 1),
          alpha: (0.16 + Math.random() * 0.1) * (haze ? 0.45 : 1),
          art: Math.floor(Math.random() * 3),
        });
      }
    };

    const frame = (nowMs: number) => {
      const now = nowMs / 1000;
      const dt = Math.min(0.05, last ? now - last : 0.016);
      last = now;
      sync(now);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const unit = sx();
      const fades = new Map<string, number>();
      for (const [key, track] of tracks) {
        if (!track.geo || track.geo.sig !== sigOf(track.spec)) track.geo = geoOf(track.spec, track.bow);
        fades.set(key, fadeOf(track, now));
        spawn(track, now, dt);
      }
      // The smoke: each puff drifts along its bend, swaying across it, billowing in the middle and thinning out.
      for (let i = puffs.length - 1; i >= 0; i -= 1) {
        const puff = puffs[i];
        const track = tracks.get(puff.key);
        if (!track || !track.geo) {
          puffs.splice(i, 1);
          continue;
        }
        const spec = track.spec;
        const slow = spec.end === "fizzle" && track.endAt !== null && now > track.endAt + spec.late ? 0.4 : 1;
        puff.u += ((puff.speed * unit) / track.geo.len) * dt * slow;
        if (puff.u >= 1) {
          puffs.splice(i, 1);
          continue;
        }
        const u = puff.u;
        const row = rowAt(track.geo, u);
        const spread = (0.6 + 1.2 * Math.pow(Math.sin(Math.PI * u), 0.8) - 0.3 * u) * unit;
        const sway = puff.off + 0.42 * Math.sin(puff.phase + now * puff.wob + u * 7);
        const x = row.x + row.nx * sway * spread;
        const y = row.y + row.ny * sway * spread;
        const r = (1.9 + 1.1 * Math.sin(Math.PI * u)) * unit * puff.size;
        const shape = smooth(0, 0.1, u) * (1 - 0.55 * smooth(0.84, 1, u));
        // Brighter and thinner patches travel down the stream, as the light runs along a flow in Runeterra.
        const lenBox = track.geo.len / unit;
        const wave = 0.5 + 0.5 * Math.sin(u * lenBox * 0.33 - now * 5.2 + track.bow * 7);
        const alpha = puff.alpha * shape * (0.5 + 0.7 * wave) * (fades.get(puff.key) ?? 0) * (puff.bright ?? 1);
        if (alpha <= 0.002) continue;
        ctx.globalAlpha = Math.min(1, alpha);
        // Along the flow: the tangent is the normal turned a quarter.
        ctx.setTransform(dpr * row.ny, dpr * -row.nx, dpr * row.nx, dpr * row.ny, dpr * x, dpr * y);
        ctx.drawImage(artsOf(spec.tone)[puff.art], -r * STRETCH, -r, r * 2 * STRETCH, r * 2);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Where it lands: a faint glow; when it fires, a surge runs down the bend and blooms there.
      for (const track of tracks.values()) {
        const spec = track.spec;
        const geo = track.geo;
        if (!geo) continue;
        const fade = fades.get(spec.key) ?? 0;
        const grown = now - track.born - spec.delay - (geo.len / (DRIFT * unit)) * 0.85;
        const tail = geo.rows[ROWS];
        if (grown > 0 && fade > 0.01) {
          // As in Runeterra: a flare flattened across the flow where it lands, with a white heart, flickering.
          const pulse = 0.88 + 0.12 * Math.sin(now * 9 + track.bow * 3) + 0.05 * Math.sin(now * 23);
          const r = 3.6 * unit * pulse;
          const nx = tail.nx;
          const ny = tail.ny;
          ctx.setTransform(dpr * nx, dpr * ny, dpr * ny, dpr * -nx, dpr * tail.x, dpr * tail.y);
          ctx.globalAlpha = 0.8 * fade * clamp01(grown / 0.3);
          ctx.drawImage(glowOf(spec.tone), -r * 1.8, -r * 0.65, r * 3.6, r * 1.3);
          ctx.globalAlpha = 0.85 * fade * clamp01(grown / 0.3);
          ctx.drawImage(glowOf("white"), -r * 0.8, -r * 0.3, r * 1.6, r * 0.6);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        if (spec.end !== "fire" || spec.strike || track.endAt === null) continue;
        const start = track.endAt + spec.late + 0.1;
        const run = (now - start) / SURGE;
        if (run >= 0 && run < 1) {
          const head = rowAt(geo, run * run);
          const r = 3.6 * unit;
          ctx.globalAlpha = 0.95;
          ctx.drawImage(glowOf(spec.tone), head.x - r * 1.6, head.y - r * 1.6, r * 3.2, r * 3.2);
          ctx.drawImage(glowOf("white"), head.x - r * 0.7, head.y - r * 0.7, r * 1.4, r * 1.4);
          if (puffs.length < MAX_PUFFS) {
            puffs.push({ key: spec.key, u: run * run, speed: DRIFT * 0.6, off: (Math.random() - 0.5) * 0.5, wob: 2, phase: Math.random() * 6, size: 0.9, alpha: 0.32, art: Math.floor(Math.random() * 3), bright: 1.4 });
          }
        }
        if (run >= 1 && !track.bloomed) {
          track.bloomed = true;
          for (let n = 0; n < 16; n += 1) {
            const turn = Math.random() * Math.PI * 2;
            const speed = (14 + Math.random() * 18) * unit;
            bursts.push({ x: tail.x, y: tail.y, vx: Math.cos(turn) * speed, vy: Math.sin(turn) * speed, life: 0.5 + Math.random() * 0.3, max: 0.8, size: (1.6 + Math.random() * 1.6) * unit, tone: spec.tone });
          }
        }
        const bloom = (now - start - SURGE) / BLOOM;
        if (bloom >= 0 && bloom < 1) {
          const r = (3 + 7 * bloom) * unit;
          ctx.globalAlpha = 0.85 * (1 - bloom);
          ctx.drawImage(glowOf(spec.tone), tail.x - r, tail.y - r, r * 2, r * 2);
        }
      }
      for (let i = bursts.length - 1; i >= 0; i -= 1) {
        const bit = bursts[i];
        bit.life -= dt;
        if (bit.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }
        const drag = Math.pow(0.12, dt);
        bit.vx *= drag;
        bit.vy *= drag;
        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        const k = bit.life / bit.max;
        const r = bit.size * (1.6 - 0.6 * k);
        ctx.globalAlpha = 0.5 * k;
        ctx.drawImage(artsOf(bit.tone)[i % 3], bit.x - r * 1.4, bit.y - r, r * 2.8, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      for (const [key, track] of tracks) {
        if (track.gone !== null && now - track.gone > 0.5 && !puffs.some((puff) => puff.key === key)) tracks.delete(key);
      }
      if (tracks.size || puffs.length || bursts.length) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        last = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    wake.current = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    wake.current();
    return () => {
      wake.current = () => undefined;
      resize.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="rx-smoke" aria-hidden="true" />;
}
