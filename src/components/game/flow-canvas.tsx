import { useEffect, useLayoutEffect, useRef } from "react";
import type { FlowTone } from "@/lib/reaction-chain";

/*
 * The light of the reaction icons (chủ game 23/10, after the flows of Runeterra): not smoke but a clear ribbon of light
 * whose inside is a net of thin shimmering lines, the caustics of sunlight under rippling water, forever changing and
 * running down the ribbon toward its target. The ribbon bends like a river, frays softly at its edges, burns brighter
 * where it folds, and lands in a flat white flare. It reaches out from its icon as it shows, surges down its bend when
 * its icon fires and dims away when it fizzles. Drawn with WebGL (a caustics shader on each ribbon); a plain soft glow
 * where WebGL is missing.
 */

/** A point or a direction in the 90 × 160 box the board is drawn in (it is 9:16, so the ribbons keep their shape). */
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
  /** An attack: its blow is drawn on the board, so its light only fades as it lands. */
  strike: boolean;
  /** Seconds before the light starts: an attacker still lunging. */
  delay: number;
};

type Rgb = [number, number, number];
type Pal = { core: Rgb; mid: Rgb; deep: Rgb };

const PAL: Record<FlowTone, Pal> = {
  blue: { core: [0.88, 0.99, 1], mid: [0.22, 0.76, 1], deep: [0.04, 0.32, 0.86] },
  red: { core: [1, 0.9, 0.84], mid: [1, 0.3, 0.18], deep: [0.72, 0.05, 0.03] },
  pink: { core: [1, 0.9, 0.96], mid: [1, 0.33, 0.68], deep: [0.64, 0.04, 0.36] },
  white: { core: [1, 1, 1], mid: [0.84, 0.92, 1], deep: [0.42, 0.52, 0.74] },
  green: { core: [0.9, 1, 0.93], mid: [0.26, 0.92, 0.52], deep: [0.04, 0.52, 0.26] },
};

/** Box units a ribbon reaches out per second as it shows. */
const REACH = 95;
/** The end of a fire: the surge's run down the ribbon, and the bloom where it lands. */
const SURGE = 0.42;
const BLOOM = 0.55;
/** Rows along a ribbon. */
const ROWS = 56;

type Row = { x: number; y: number; nx: number; ny: number };
type Geo = { sig: string; rows: Row[]; len: number; mesh: Float32Array };
type Track = { spec: FlowSpec; born: number; doneAt: number | null; endAt: number | null; gone: number | null; geo: Geo | null; bow: number; seed: number; buffer: WebGLBuffer | null };

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

/** Settling as the old line's streams did: full for 40% of 1.5 seconds, then down to 22%. */
function settle(since: number): number {
  if (since <= 0) return 1;
  const k = since / 1.5;
  if (k <= 0.4) return 1;
  return 1 - 0.78 * smooth(0.4, 1, k);
}

/** Shared with the turn light (turn-light.tsx), so its water is the same light as these flows. */
export const VERTEX = `
attribute vec2 aPos;
attribute vec2 aUv;
attribute float aFold;
uniform vec2 uRes;
varying vec2 vUv;
varying float vFold;
void main() {
  vec2 clip = aPos / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vUv = aUv;
  vFold = aFold;
}`;

// Caustics: a field warped over and over, bright where it folds into thin lines, as light under rippling water. The
// pattern is stretched along the ribbon and runs down it toward the target.
export const RIBBON = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
varying float vFold;
uniform float uTime;
uniform float uLen;
uniform float uFade;
uniform float uGrow;
uniform float uTail;
uniform float uHead;
uniform float uSeed;
uniform vec3 uCore;
uniform vec3 uMid;
uniform vec3 uDeep;

float caustic(vec2 p, float t) {
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}

void main() {
  float u = vUv.x;
  float v = vUv.y;
  float av = abs(v);
  float body = 1.0 - smoothstep(0.3, 1.0, av);
  float core = exp(-av * av * 7.0);
  // Long thin lines along the flow, several across it; far from the origin, where the warp stays fine.
  vec2 p = vec2(u * uLen * 0.07 - uTime * 1.1, v * 1.7) * 3.0 + vec2(uSeed * 7.0 - 250.0, uSeed * 3.0 - 250.0);
  float lines = caustic(p, uTime * 0.85 + uSeed * 5.0) * 1.1 + caustic(p * 1.6 + vec2(3.1, 1.7), uTime * 1.2 + uSeed * 9.0) * 0.45;
  float shimmer = clamp((lines - 0.22) * 1.5, 0.0, 1.6);
  float fray = 1.0 - smoothstep(0.55, 1.0, av) + smoothstep(0.55, 1.0, av) * shimmer * 0.9;
  float ends = smoothstep(0.0, 0.06, u) * (0.7 + 0.3 * u);
  float reach = 1.0 - smoothstep(uGrow - 0.05, uGrow + 0.015, u);
  // Going out from its start to its end (the turn light leaving a tank): gone up to uTail.
  float tail = uTail < 0.0 ? 1.0 : smoothstep(uTail - 0.015, uTail + 0.05, u);
  float surge = uHead < 0.0 ? 0.0 : exp(-pow((u - uHead) * 8.0, 2.0)) * 2.4;
  // A luminous body in the flow's colour, brighter lines over it, white where the lines crowd in the middle; a slight
  // shade under the ribbon so its colour reads on a light floor too.
  vec3 col = mix(uDeep, uMid, 0.7) * body * 0.5;
  col += uMid * shimmer * fray * 0.85;
  col += uCore * (shimmer * shimmer * core * 0.75 + core * 0.12);
  col *= vFold;
  col += uCore * surge * body;
  float k = uFade * ends * reach * tail;
  col *= k;
  gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)) * 0.45 + body * 0.14 * k, 0.0, 1.0));
}`;

// The flare where a ribbon lands: flat across the ribbon, a white heart, a little sparkle.
const FLARE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform float uTime;
uniform float uFade;
uniform vec3 uCore;
uniform vec3 uMid;
void main() {
  vec2 q = vUv;
  float halo = exp(-(q.x * q.x * 3.2 + q.y * q.y * 11.0));
  float heart = exp(-(q.x * q.x * 18.0 + q.y * q.y * 70.0));
  float spark = 0.6 + 0.4 * sin(q.x * 17.0 + uTime * 9.0) * sin(q.y * 6.0 - uTime * 7.0);
  vec3 col = uMid * halo * spark * 0.95 + uCore * heart * 1.5;
  col *= uFade;
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)) * 0.3);
}`;

type Painter = { draw: (tracks: Track[], now: number, W: number, H: number) => void; forget: (track: Track) => void; dispose: () => void };

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
    if (!canvas || !parent) return;
    let W = 1;
    let H = 1;
    let dpr = 1;
    const fit = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = parent.clientWidth || 1;
      H = parent.clientHeight || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(parent);

    const tracks = new Map<string, Track>();
    let raf = 0;
    const sx = () => W / 90;
    const sy = () => H / 160;

    // The bend of a ribbon: it leaves square to its icon's card edge and lands square on its target, curving like an
    // S on the way, the way a river never runs straight. Its width breathes along it, and it folds now and then (where
    // it narrows it burns brighter, as a ribbon of light seen edge on).
    const sigOf = (spec: FlowSpec) => `${W}x${H}:${spec.a.x},${spec.a.y},${spec.b.x},${spec.b.y},${spec.out.x},${spec.out.y},${spec.into.x},${spec.into.y}`;
    const geoOf = (spec: FlowSpec, bow: number, seed: number): Geo => {
      const ax = spec.a.x * sx();
      const ay = spec.a.y * sy();
      const bx = spec.b.x * sx();
      const by = spec.b.y * sy();
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / len;
      const ny = (bx - ax) / len;
      const reach = len * 0.42;
      // The bend goes the way the ribbon already leaves its icon, never against it: against it, the two cancel and a
      // ribbon to a card off to the side ran almost straight (chủ game 23/10). Leaving square to the line, it bends
      // either way.
      const lean = spec.out.x * nx + spec.out.y * ny;
      const turn = Math.abs(lean) > 0.12 ? Math.sign(lean) : Math.sign(bow) || 1;
      const bend = turn * Math.abs(bow) * (1 - 0.6 * Math.min(1, Math.abs(lean)));
      const p1 = { x: ax + spec.out.x * reach + nx * bend * len * 0.26, y: ay + spec.out.y * reach + ny * bend * len * 0.26 };
      const p2 = { x: bx - spec.into.x * reach - nx * bend * len * 0.16, y: by - spec.into.y * reach - ny * bend * len * 0.16 };
      const at = (t: number) => {
        const u = 1 - t;
        return {
          x: u * u * u * ax + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * bx,
          y: u * u * u * ay + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * by,
        };
      };
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
        const dx = pts[j + 1].x - pts[j].x;
        const dy = pts[j + 1].y - pts[j].y;
        const d = Math.hypot(dx, dy) || 1;
        rows.push({ x: pts[j].x + dx * k, y: pts[j].y + dy * k, nx: -dy / d, ny: dx / d });
      }
      // Two vertices a row (one each side): position, (u, v), and how bright a fold makes it.
      const unit = sx();
      const lenBox = total / unit;
      const mesh = new Float32Array((ROWS + 1) * 2 * 5);
      rows.forEach((row, i) => {
        const u = i / ROWS;
        const breathe = 1.5 + 0.85 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.8) - 0.55 * u;
        const turn = Math.cos(Math.PI * (0.35 + seed * 0.5 + (u * lenBox) / 34));
        const fold = 0.45 + 0.55 * Math.abs(turn);
        const half = breathe * fold * unit * 1.5;
        const glow = 1 / (0.62 + 0.38 * fold);
        for (const side of [-1, 1]) {
          const at2 = (i * 2 + (side < 0 ? 0 : 1)) * 5;
          mesh[at2] = row.x + row.nx * half * side;
          mesh[at2 + 1] = row.y + row.ny * half * side;
          mesh[at2 + 2] = u;
          mesh[at2 + 3] = side;
          mesh[at2 + 4] = glow;
        }
      });
      return { sig: sigOf(spec), rows, len: total, mesh };
    };

    /** How strongly a ribbon shows now. */
    const fadeOf = (track: Track, now: number): number => {
      const spec = track.spec;
      let k = 1;
      if (track.gone !== null) k *= 1 - clamp01((now - track.gone) / 0.35);
      if (track.endAt !== null && spec.end === "fire" && spec.strike) k *= 1 - clamp01((now - (track.endAt + spec.late + 0.1)) / 0.3);
      else if (track.endAt !== null && spec.end === "fizzle") k *= 1 - 0.92 * smooth(0, 1, (now - (track.endAt + spec.late)) / 0.6);
      else if (track.endAt !== null && spec.end === "fire") k *= settle(now - (track.endAt + spec.late + 0.6));
      else if (track.doneAt !== null && spec.done) k *= settle(now - track.doneAt);
      return k;
    };
    /** How far the ribbon has reached out from its icon (0 to 1). */
    const growOf = (track: Track, now: number): number => {
      const lenBox = (track.geo?.len ?? 0) / sx();
      return clamp01((now - track.born - track.spec.delay) / Math.min(0.75, Math.max(0.22, lenBox / REACH)));
    };
    /** The head of a fire's surge along the ribbon, or -1. */
    const headOf = (track: Track, now: number): number => {
      const spec = track.spec;
      if (spec.end !== "fire" || spec.strike || track.endAt === null) return -1;
      const run = (now - (track.endAt + spec.late + 0.1)) / SURGE;
      return run >= 0 && run < 1 ? run * run : -1;
    };
    /** The bloom where a fired ribbon lands (0 to 1), or -1. */
    const bloomOf = (track: Track, now: number): number => {
      const spec = track.spec;
      if (spec.end !== "fire" || spec.strike || track.endAt === null) return -1;
      const bloom = (now - (track.endAt + spec.late + 0.1 + SURGE)) / BLOOM;
      return bloom >= 0 && bloom < 1 ? bloom : -1;
    };

    const painter = glPainter(canvas, () => dpr, { fadeOf, growOf, headOf, bloomOf }) ?? flatPainter(canvas, () => dpr, { fadeOf, growOf, headOf, bloomOf });

    const sync = (now: number) => {
      const seen = new Set<string>();
      for (const spec of specs.current) {
        seen.add(spec.key);
        let track = tracks.get(spec.key);
        if (!track) {
          track = {
            spec,
            born: now,
            doneAt: spec.done ? now : null,
            endAt: spec.end ? now : null,
            gone: null,
            geo: null,
            bow: (hash(spec.key) < 0.5 ? -1 : 1) * (0.55 + 0.45 * hash(`${spec.key}#`)),
            seed: hash(`${spec.key}~`),
            buffer: null,
          };
          tracks.set(spec.key, track);
        }
        track.gone = null;
        if (spec.done && track.doneAt === null) track.doneAt = now;
        if (spec.end && track.endAt === null) track.endAt = now;
        track.spec = spec;
      }
      for (const [key, track] of tracks) {
        if (!seen.has(key) && track.gone === null) track.gone = now;
        if (track.gone !== null && now - track.gone > 0.4) {
          painter.forget(track);
          tracks.delete(key);
        }
      }
    };

    const frame = (ms: number) => {
      const now = ms / 1000;
      sync(now);
      for (const track of tracks.values()) {
        if (!track.geo || track.geo.sig !== sigOf(track.spec)) {
          track.geo = geoOf(track.spec, track.bow, track.seed);
          painter.forget(track);
        }
      }
      painter.draw([...tracks.values()], now, W, H);
      if (tracks.size) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        painter.draw([], now, W, H);
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
      painter.dispose();
    };
  }, []);

  return <canvas ref={ref} className="rx-light" aria-hidden="true" />;
}

type Timing = {
  fadeOf: (track: Track, now: number) => number;
  growOf: (track: Track, now: number) => number;
  headOf: (track: Track, now: number) => number;
  bloomOf: (track: Track, now: number) => number;
};

/** The flare's quad where a ribbon lands: across the ribbon (`w`) and along it (`h`), in px. */
function flareQuad(geo: Geo, w: number, h: number): Float32Array {
  const tail = geo.rows[ROWS];
  const tx = tail.ny;
  const ty = -tail.nx;
  const quad = new Float32Array(4 * 5);
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([qx, qy], i) => {
    quad[i * 5] = tail.x + tail.nx * qx * w + tx * qy * h;
    quad[i * 5 + 1] = tail.y + tail.ny * qx * w + ty * qy * h;
    quad[i * 5 + 2] = qx;
    quad[i * 5 + 3] = qy;
    quad[i * 5 + 4] = 1;
  });
  return quad;
}

/** A WebGL program from the shared vertex shader and `fragment`, or null when it will not build. */
export function linkProgram(g: WebGLRenderingContext, fragment: string): WebGLProgram | null {
  const compile = (type: number, source: string) => {
    const shader = g.createShader(type)!;
    g.shaderSource(shader, source);
    g.compileShader(shader);
    return shader;
  };
  const program = g.createProgram()!;
  g.attachShader(program, compile(g.VERTEX_SHADER, VERTEX));
  g.attachShader(program, compile(g.FRAGMENT_SHADER, fragment));
  g.linkProgram(program);
  return g.getProgramParameter(program, g.LINK_STATUS) ? program : null;
}

/** Points the mesh vertices to the shared attributes: position, (u, v), fold. */
export function bindRibbon(g: WebGLRenderingContext, program: WebGLProgram) {
  const stride = 5 * 4;
  const pos = g.getAttribLocation(program, "aPos");
  const uv = g.getAttribLocation(program, "aUv");
  const fold = g.getAttribLocation(program, "aFold");
  g.enableVertexAttribArray(pos);
  g.vertexAttribPointer(pos, 2, g.FLOAT, false, stride, 0);
  g.enableVertexAttribArray(uv);
  g.vertexAttribPointer(uv, 2, g.FLOAT, false, stride, 8);
  if (fold >= 0) {
    g.enableVertexAttribArray(fold);
    g.vertexAttribPointer(fold, 1, g.FLOAT, false, stride, 16);
  }
}

function glPainter(canvas: HTMLCanvasElement, dprOf: () => number, timing: Timing): Painter | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const g = gl;
  const ribbon = linkProgram(g, RIBBON);
  const flare = linkProgram(g, FLARE);
  if (!ribbon || !flare) return null;
  const spot = (program: WebGLProgram, name: string) => g.getUniformLocation(program, name);
  const quadBuffer = g.createBuffer();
  const bind = (program: WebGLProgram) => bindRibbon(g, program);
  // A lost context (the GPU reset) would show as a blank sheet: hide the light rather than that.
  let lost = g.isContextLost();
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    canvas.style.visibility = "hidden";
  };
  canvas.addEventListener("webglcontextlost", onLost);
  return {
    draw(tracks, now, W, H) {
      if (lost) return;
      const dpr = dprOf();
      g.viewport(0, 0, Math.round(W * dpr), Math.round(H * dpr));
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      if (!tracks.length) return;
      g.enable(g.BLEND);
      g.blendFunc(g.ONE, g.ONE);
      const time = now % 120;
      const unit = W / 90;
      g.useProgram(ribbon);
      g.uniform2f(spot(ribbon, "uRes"), W, H);
      g.uniform1f(spot(ribbon, "uTime"), time);
      for (const track of tracks) {
        const geo = track.geo;
        const fade = timing.fadeOf(track, now);
        if (!geo || fade <= 0.003) continue;
        if (!track.buffer) {
          track.buffer = g.createBuffer();
          g.bindBuffer(g.ARRAY_BUFFER, track.buffer);
          g.bufferData(g.ARRAY_BUFFER, geo.mesh, g.STATIC_DRAW);
        } else g.bindBuffer(g.ARRAY_BUFFER, track.buffer);
        bind(ribbon);
        const pal = PAL[track.spec.tone];
        g.uniform1f(spot(ribbon, "uLen"), geo.len / unit);
        g.uniform1f(spot(ribbon, "uFade"), fade);
        g.uniform1f(spot(ribbon, "uGrow"), timing.growOf(track, now) * 1.08);
        g.uniform1f(spot(ribbon, "uTail"), -1);
        g.uniform1f(spot(ribbon, "uHead"), timing.headOf(track, now));
        g.uniform1f(spot(ribbon, "uSeed"), track.seed);
        g.uniform3fv(spot(ribbon, "uCore"), pal.core);
        g.uniform3fv(spot(ribbon, "uMid"), pal.mid);
        g.uniform3fv(spot(ribbon, "uDeep"), pal.deep);
        g.drawArrays(g.TRIANGLE_STRIP, 0, (ROWS + 1) * 2);
      }
      g.useProgram(flare);
      g.uniform2f(spot(flare, "uRes"), W, H);
      g.uniform1f(spot(flare, "uTime"), time);
      g.bindBuffer(g.ARRAY_BUFFER, quadBuffer);
      for (const track of tracks) {
        const geo = track.geo;
        const fade = timing.fadeOf(track, now);
        const grown = timing.growOf(track, now);
        const bloom = timing.bloomOf(track, now);
        if (!geo || fade <= 0.003 || grown < 0.9) continue;
        const pal = PAL[track.spec.tone];
        const flicker = 0.9 + 0.1 * Math.sin(now * 11 + track.seed * 20) + 0.05 * Math.sin(now * 27);
        const lit = (bloom >= 0 ? 1 + 1.6 * bloom : 1) * flicker;
        g.bufferData(g.ARRAY_BUFFER, flareQuad(geo, unit * 4.6 * lit, unit * 1.9 * lit), g.DYNAMIC_DRAW);
        bind(flare);
        g.uniform1f(spot(flare, "uFade"), fade * (bloom >= 0 ? 1.4 * (1 - bloom) + 0.6 : 1) * smooth(0.9, 1, grown));
        g.uniform3fv(spot(flare, "uCore"), pal.core);
        g.uniform3fv(spot(flare, "uMid"), pal.mid);
        g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      }
    },
    forget(track) {
      if (track.buffer && !lost) g.deleteBuffer(track.buffer);
      track.buffer = null;
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      if (!lost) {
        g.deleteProgram(ribbon);
        g.deleteProgram(flare);
        g.deleteBuffer(quadBuffer);
      }
      // Free the context once the canvas is really gone (not when React only runs the effect again on it).
      window.setTimeout(() => {
        if (!canvas.isConnected) g.getExtension("WEBGL_lose_context")?.loseContext();
      }, 0);
    },
  };
}

/** Without WebGL: each ribbon is a soft glow along its bend, with a plain flare where it lands. */
function flatPainter(canvas: HTMLCanvasElement, dprOf: () => number, timing: Timing): Painter {
  const ctx = canvas.getContext("2d");
  const css = (rgb: Rgb, alpha: number) => `rgba(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)},${alpha})`;
  return {
    draw(tracks, now, W, H) {
      if (!ctx) return;
      const dpr = dprOf();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const unit = W / 90;
      for (const track of tracks) {
        const geo = track.geo;
        const fade = timing.fadeOf(track, now);
        if (!geo || fade <= 0.003) continue;
        const pal = PAL[track.spec.tone];
        const last = Math.round(ROWS * timing.growOf(track, now));
        if (last < 1) continue;
        for (const [width, rgb, alpha] of [
          [unit * 4.2, pal.mid, 0.16],
          [unit * 1.6, pal.mid, 0.4],
          [unit * 0.6, pal.core, 0.65],
        ] as const) {
          ctx.strokeStyle = css(rgb, alpha * fade);
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(geo.rows[0].x, geo.rows[0].y);
          for (let i = 1; i <= last; i += 1) ctx.lineTo(geo.rows[i].x, geo.rows[i].y);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    },
    forget() {},
    dispose() {},
  };
}
