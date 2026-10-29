import { useEffect, useLayoutEffect, useRef } from "react";
import type { FlowTone } from "@/lib/reaction-chain";

/*
 * The light of the reaction icons (chủ game 23/10, after the flows of Runeterra): not smoke but a clear ribbon of light
 * whose inside is a net of thin shimmering lines, the caustics of sunlight under rippling water, forever changing and
 * running down the ribbon toward its target. The ribbon bends like a river, frays softly at its edges, burns brighter
 * where it folds, and lands in a flat white flare. It reaches out from its icon as it shows, surges down its bend when
 * its icon fires and dims away when it fizzles. Drawn with WebGL (a caustics shader on each ribbon); a plain soft glow
 * where WebGL is missing.
 *
 * Đợt 2 (chủ game 29/10): a ribbon that reaches a card runs, like a canal reaching a walled city, into a thin moat
 * round it (a ring round a player or an icon); one that an icon stops surges against it without end, as a flood
 * against a dam: foam piled on the wall, spray and drops thrown back, waves running back up the flow; a spread's
 * ribbon runs to a fork and its branches run on from there.
 */

/** A point or a direction in the 90 × 160 box the board is drawn in (it is 9:16, so the ribbons keep their shape). */
export type BoxPt = { x: number; y: number };

/** A moat round what a ribbon reaches, in box units: a card's box (its middle and half size) or a ring. */
export type Moat = { kind: "box"; c: BoxPt; half: BoxPt } | { kind: "ring"; c: BoxPt; r: number };

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
  /** How it lands: a flare (the default), surging against a dam, or nothing (the fork of a spread). */
  land?: "flare" | "dam" | "none";
  /** The moat it runs into round what it reaches. */
  moat?: Moat | null;
  /** A bend it must take along its own left-hand normal (an S, as a river runs). */
  bend?: number;
  /** An arc to its own left-hand side instead (negative: to its right): a flow thrown back goes round its way in. */
  arc?: number;
  /** A branch of a spread: it runs on from the end of that flow, and grows and surges after it. */
  after?: string;
  /** Its width (1: a main flow). */
  width?: number;
  /** How much it widens toward its end (1: as a flow at one target; 0.5: half as much). */
  tail?: number;
  /** A branch out of a fork (hình 2 của chủ game, 29/10): it runs out to `side` (a unit direction), sags back a little
   *  and rises into its target as a U; `min` the least it runs out, in box units. */
  fan?: { side: BoxPt; min: number };
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
/** A moat: seconds it takes to run round once the ribbon is there, its gap from the card and its width (box units). */
const MOAT_RUN = 0.5;
const MOAT_PAD = 1.05;
const MOAT_HALF = 0.62;
/** Drops thrown back by a dam at once. */
const DROPS = 14;

type Row = { x: number; y: number; nx: number; ny: number };
type Geo = { sig: string; rows: Row[]; len: number; mesh: Float32Array };
type Track = {
  spec: FlowSpec;
  born: number;
  doneAt: number | null;
  endAt: number | null;
  gone: number | null;
  geo: Geo | null;
  /** The two arms of its moat. */
  moat: Geo[];
  bow: number;
  seed: number;
  buffer: WebGLBuffer | null;
  moatBuffers: Array<WebGLBuffer | null>;
};

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

/** Evenly spaced rows along a path of points (in px), each with its left-hand normal. */
function rowsAlong(pts: Array<{ x: number; y: number }>, count: number): { rows: Row[]; total: number } {
  const cum = [0];
  for (let i = 1; i < pts.length; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const last = pts.length - 1;
  const total = cum[last] || 1;
  const rows: Row[] = [];
  let j = 0;
  for (let i = 0; i <= count; i += 1) {
    const want = (i / count) * total;
    while (j < last - 1 && cum[j + 1] < want) j += 1;
    const span = cum[j + 1] - cum[j] || 1;
    const k = (want - cum[j]) / span;
    const dx = pts[j + 1].x - pts[j].x;
    const dy = pts[j + 1].y - pts[j].y;
    const d = Math.hypot(dx, dy) || 1;
    rows.push({ x: pts[j].x + dx * k, y: pts[j].y + dy * k, nx: -dy / d, ny: dx / d });
  }
  return { rows, total };
}

/** Two vertices a row (one each side): position, (u, v), and how bright a fold makes it. */
function meshOf(rows: Row[], halfOf: (u: number) => number, glowOf: (u: number) => number): Float32Array {
  const mesh = new Float32Array(rows.length * 2 * 5);
  const steps = rows.length - 1 || 1;
  rows.forEach((row, i) => {
    const u = i / steps;
    const half = halfOf(u);
    const glow = glowOf(u);
    for (const side of [-1, 1]) {
      const at = (i * 2 + (side < 0 ? 0 : 1)) * 5;
      mesh[at] = row.x + row.nx * half * side;
      mesh[at + 1] = row.y + row.ny * half * side;
      mesh[at + 2] = u;
      mesh[at + 3] = side;
      mesh[at + 4] = glow;
    }
  });
  return mesh;
}

/** The outline of a moat (in px), clockwise from the top middle, and the point nearest to where the ribbon lands. */
function moatPath(moat: Moat, sx: number, sy: number, unit: number): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  if (moat.kind === "ring") {
    const cx = moat.c.x * sx;
    const cy = moat.c.y * sy;
    const r = moat.r * sx + unit * MOAT_PAD * 0.7;
    for (let i = 0; i < 240; i += 1) {
      const t = -Math.PI / 2 + (i / 240) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r });
    }
    return pts;
  }
  const cx = moat.c.x * sx;
  const cy = moat.c.y * sy;
  const hw = moat.half.x * sx + unit * MOAT_PAD;
  const hh = moat.half.y * sy + unit * MOAT_PAD;
  const rc = Math.min(hw, hh) * 0.16 + unit * 0.9;
  // A rounded box: straight edges and quarter turns, clockwise from the middle of the top edge.
  const corner = (ccx: number, ccy: number, from: number) => {
    for (let i = 0; i <= 12; i += 1) {
      const t = from + (i / 12) * (Math.PI / 2);
      pts.push({ x: ccx + Math.cos(t) * rc, y: ccy + Math.sin(t) * rc });
    }
  };
  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / (unit * 0.6)));
    for (let i = 0; i < n; i += 1) pts.push({ x: x1 + ((x2 - x1) * i) / n, y: y1 + ((y2 - y1) * i) / n });
  };
  edge(cx, cy - hh, cx + hw - rc, cy - hh);
  corner(cx + hw - rc, cy - hh + rc, -Math.PI / 2);
  edge(cx + hw, cy - hh + rc, cx + hw, cy + hh - rc);
  corner(cx + hw - rc, cy + hh - rc, 0);
  edge(cx + hw - rc, cy + hh, cx - hw + rc, cy + hh);
  corner(cx - hw + rc, cy + hh - rc, Math.PI / 2);
  edge(cx - hw, cy + hh - rc, cx - hw, cy - hh + rc);
  corner(cx - hw + rc, cy - hh + rc, Math.PI);
  edge(cx - hw + rc, cy - hh, cx, cy - hh);
  return pts;
}

const VERTEX = `
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
// pattern is stretched along the ribbon and runs down it toward the target. Against a dam the water piles up near
// the end: it churns there and waves run back up the flow.
const RIBBON = `
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
uniform float uHead;
uniform float uSeed;
uniform float uDam;
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
  float surge = uHead < 0.0 ? 0.0 : exp(-pow((u - uHead) * 8.0, 2.0)) * 2.4;
  // A luminous body in the flow's colour, brighter lines over it, white where the lines crowd in the middle; a slight
  // shade under the ribbon so its colour reads on a light floor too.
  vec3 col = mix(uDeep, uMid, 0.7) * body * 0.5;
  col += uMid * shimmer * fray * 0.85;
  col += uCore * (shimmer * shimmer * core * 0.75 + core * 0.12);
  col *= vFold;
  col += uCore * surge * body;
  // Dammed: churning foam near the wall and waves running back up the flow, one after another.
  if (uDam > 0.0) {
    float near = smoothstep(0.58, 1.0, u);
    float churn = 0.5 + 0.5 * sin(uTime * 19.0 + v * 9.0 + u * uLen * 0.8) * sin(uTime * 13.0 - v * 5.0);
    float back = 0.0;
    for (int k = 0; k < 3; k++) {
      float ph = fract(uTime * 0.8 + float(k) / 3.0 + uSeed);
      float at = 1.0 - ph * 0.42;
      back += exp(-pow((u - at) * 24.0, 2.0)) * (1.0 - ph) * (1.0 - av * 0.6);
    }
    col += uCore * (back * 1.25 * body + near * near * churn * (0.45 + 0.55 * core) * 0.9) * uDam;
    col += uMid * near * 0.35 * body * uDam;
  }
  float k = uFade * ends * reach;
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

// The dam: where the flow strikes the icon that stops it. q.x runs across the flow, q.y along it (+1 downstream, the
// wall's side). A bowed wall of churning foam faces the flow; spray bursts back from it in flickering streaks and
// ripples spread back up the water, again and again.
const DAM = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform float uTime;
uniform float uFade;
uniform float uSeed;
uniform vec3 uCore;
uniform vec3 uMid;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec2 q = vUv;
  float t = uTime;
  float wall = 0.4 - 0.5 * q.x * q.x;
  float d = q.y - wall;
  float churn = noise(vec2(q.x * 6.0 + uSeed * 17.0, q.y * 5.0 - t * 3.4)) * 0.6 + noise(vec2(q.x * 14.0 - t * 2.1, q.y * 10.0 + t * 4.3)) * 0.4;
  float foam = exp(-d * d * 55.0) * (1.0 - q.x * q.x) * (0.45 + churn);
  vec2 w = vec2(q.x, wall - q.y);
  float r = length(w);
  float ang = atan(w.x, max(w.y, 0.001));
  float up = step(0.0, -d);
  float streak = pow(abs(sin(ang * 5.0 + noise(vec2(ang * 2.0 + uSeed * 5.0, t * 2.6)) * 3.0)), 12.0);
  float spray = 0.0;
  for (int k = 0; k < 2; k++) {
    float burst = fract(t * 1.6 + float(k) * 0.5 + uSeed);
    float ring = smoothstep(burst * 0.9 - 0.22, burst * 0.9, r) * (1.0 - smoothstep(burst * 0.9, burst * 0.9 + 0.07, r));
    spray += streak * ring * (1.0 - burst) * 1.5;
  }
  float waves = 0.0;
  for (int k = 0; k < 3; k++) {
    float ph = fract(t * 0.95 + float(k) / 3.0 + uSeed * 0.5);
    waves += exp(-pow((r - ph * 0.95) * 13.0, 2.0)) * (1.0 - ph) * (1.0 - abs(q.x) * 0.6);
  }
  float edge = 1.0 - smoothstep(0.62, 1.0, length(q * vec2(0.85, 1.0)));
  vec3 col = uCore * foam * 1.2 + (uMid * 0.75 + uCore * 0.25) * waves * up * 0.65 + mix(uMid, uCore, 0.65) * spray * up;
  col *= edge * uFade;
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)) * 0.35);
}`;

// A drop of spray: a round soft dot with a bright heart; its brightness rides in the fold attribute.
const DROP = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
varying float vFold;
uniform vec3 uCore;
uniform vec3 uMid;
void main() {
  float r2 = dot(vUv, vUv);
  float glow = exp(-r2 * 4.5);
  float heart = exp(-r2 * 16.0);
  vec3 col = (uMid * glow * 0.8 + uCore * heart * 1.3) * vFold;
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

    // Where a ribbon ends (px): on its moat where it has one (the nearest point of the moat's outline), else at `b`.
    const tipOf = (spec: FlowSpec, path: Array<{ x: number; y: number }> | null): { x: number; y: number; at: number } => {
      const bx = spec.b.x * sx();
      const by = spec.b.y * sy();
      if (!path || !spec.moat) return { x: bx, y: by, at: -1 };
      if (spec.moat.kind === "ring") {
        // A ring is met where the ribbon comes in, square to it.
        const len = Math.hypot(spec.into.x * sx(), spec.into.y * sy()) || 1;
        const ux = (spec.into.x * sx()) / len;
        const uy = (spec.into.y * sy()) / len;
        const cx = spec.moat.c.x * sx();
        const cy = spec.moat.c.y * sy();
        let best = 0;
        let bestDot = Infinity;
        path.forEach((pt, i) => {
          const dot = (pt.x - cx) * ux + (pt.y - cy) * uy;
          if (dot < bestDot) {
            bestDot = dot;
            best = i;
          }
        });
        return { ...path[best], at: best };
      }
      let best = 0;
      let bestD = Infinity;
      path.forEach((pt, i) => {
        const dd = (pt.x - bx) ** 2 + (pt.y - by) ** 2;
        if (dd < bestD) {
          bestD = dd;
          best = i;
        }
      });
      return { ...path[best], at: best };
    };

    // The bend of a ribbon: it leaves square to its icon's card edge and lands square on its target, curving like an
    // S on the way, the way a river never runs straight. Its width breathes along it, and it folds now and then (where
    // it narrows it burns brighter, as a ribbon of light seen edge on).
    const sigOf = (spec: FlowSpec) =>
      `${W}x${H}:${spec.a.x},${spec.a.y},${spec.b.x},${spec.b.y},${spec.out.x},${spec.out.y},${spec.into.x},${spec.into.y},${spec.bend ?? ""},${spec.arc ?? ""},${spec.land ?? ""},${spec.width ?? 1},${spec.tail ?? 1},${spec.fan ? `${spec.fan.side.x},${spec.fan.side.y},${spec.fan.min}` : ""},${spec.moat ? JSON.stringify(spec.moat) : ""}`;
    const build = (track: Track) => {
      const spec = track.spec;
      const unit = sx();
      const path = spec.moat ? moatPath(spec.moat, sx(), sy(), unit) : null;
      const tip = tipOf(spec, path);
      const ax = spec.a.x * sx();
      const ay = spec.a.y * sy();
      const bx = tip.x;
      const by = tip.y;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / len;
      const ny = (bx - ax) / len;
      const reach = len * 0.42;
      // The bend goes the way the ribbon already leaves its icon, never against it: against it, the two cancel and a
      // ribbon to a card off to the side ran almost straight (chủ game 23/10). Leaving square to the line, it bends
      // either way. A ribbon told how to bend does so; one told to arc swings round to one side all the way (a flow
      // thrown back keeps clear of its way in, chủ game 29/10).
      const lean = spec.out.x * nx + spec.out.y * ny;
      const turn = Math.abs(lean) > 0.12 ? Math.sign(lean) : Math.sign(track.bow) || 1;
      const arcs = spec.arc !== undefined;
      const bend = spec.arc ?? spec.bend ?? turn * Math.abs(track.bow) * (1 - 0.6 * Math.min(1, Math.abs(lean)));
      const k1 = arcs ? 0.3 : 0.26;
      const k2 = arcs ? 0.3 : -0.16;
      let p1 = { x: ax + spec.out.x * reach + nx * bend * len * k1, y: ay + spec.out.y * reach + ny * bend * len * k1 };
      let p2 = { x: bx - spec.into.x * reach + nx * bend * len * k2, y: by - spec.into.y * reach + ny * bend * len * k2 };
      if (spec.fan) {
        // A branch out of a fork, as the owner drew it (29/10): out sideways toward its target, sagging back a little,
        // then up and in to it, a U; a farther target, sideways or ahead, takes a wider U round the nearer ones.
        const fx = spec.into.x;
        const fy = spec.into.y;
        const lx = spec.fan.side.x;
        const ly = spec.fan.side.y;
        const dx = bx - ax;
        const dy = by - ay;
        const v = Math.max(unit * 2, dx * fx + dy * fy);
        const wide = Math.max(Math.abs(dx * lx + dy * ly), spec.fan.min * unit) + v * 0.15;
        const sag = wide * 0.12;
        p1 = { x: ax + lx * wide * 0.75 - fx * sag, y: ay + ly * wide * 0.75 - fy * sag };
        p2 = { x: bx - fx * (v * 0.5 + sag) + lx * wide * 0.25, y: by - fy * (v * 0.5 + sag) + ly * wide * 0.25 };
      }
      const base = (t: number) => {
        const u = 1 - t;
        return {
          x: u * u * u * ax + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * bx,
          y: u * u * u * ay + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * by,
        };
      };
      // A long way that runs almost straight takes one soft bend, and only a very long one (over half the board) an
      // S, the bends dying away at both ends so it still leaves and lands square. A short way, one already curving,
      // a way thrown back, one into a dam and a branch keep their own line (chủ game 29/10).
      let bends = 0;
      if (!arcs && spec.land !== "dam" && !spec.fan && len > H * 0.2) {
        let stray = 0;
        for (let i = 1; i < 16; i += 1) {
          const pt = base(i / 16);
          stray = Math.max(stray, Math.abs((pt.x - ax) * nx + (pt.y - ay) * ny));
        }
        if (stray < len * 0.06) bends = len > H * 0.5 ? 2 : 1;
      }
      const wind = (bends === 2 ? Math.min(len * 0.05, unit * 5) : Math.min(len * 0.07, unit * 5)) * (track.seed < 0.5 ? -1 : 1);
      const at = (t: number) => {
        const pt = base(t);
        const s = Math.sin(Math.PI * t);
        const off = bends === 1 ? wind * s * s : bends === 2 ? wind * s * Math.sin(2 * Math.PI * t) : 0;
        return { x: pt.x + nx * off, y: pt.y + ny * off };
      };
      const { rows, total } = rowsAlong(Array.from({ length: 161 }, (_, i) => at(i / 160)), ROWS);
      const lenBox = total / unit;
      const width = spec.width ?? 1;
      const tail = spec.tail ?? 1;
      const dam = spec.land === "dam";
      const seed = track.seed;
      const foldAt = (u: number) => 0.45 + 0.55 * Math.abs(Math.cos(Math.PI * (0.35 + seed * 0.5 + (u * lenBox) / 34)));
      const mesh = meshOf(
        rows,
        (u) => {
          // Into a dam it keeps its old shape, the water piling up and spreading along the wall (chủ game 29/10: so
          // the icon that stops it looks natural). Else its head as wide as it always was and its tail wider, as a
          // dragon's flame; a spread's trunk widens half as much.
          const breathe = dam
            ? (1.5 + 0.85 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.8) - 0.55 * u) * (1 + 0.95 * smooth(0.7, 1, u))
            : 1.5 + tail * Math.pow(u, 0.9) + 0.25 * Math.sin(u * 9 + seed * 6);
          return breathe * foldAt(u) * unit * 1.5 * width;
        },
        (u) => 1 / (0.62 + 0.38 * foldAt(u)),
      );
      track.geo = { sig: sigOf(spec), rows, len: total, mesh };
      // The moat: two thin arms from where the ribbon comes in, round either side, meeting on the far side.
      track.moat = [];
      if (path && tip.at >= 0) {
        const n = path.length;
        const halfN = Math.floor(n / 2);
        for (const dir of [1, -1]) {
          const arm = Array.from({ length: halfN + 1 }, (_, i) => path[(tip.at + dir * i + n * 2) % n]);
          const { rows: armRows, total: armLen } = rowsAlong(arm, ROWS);
          const armMesh = meshOf(
            armRows,
            (u) => unit * MOAT_HALF * (0.85 + 0.25 * Math.sin(u * 9 + seed * 6)) * (1 - 0.35 * smooth(0.8, 1, u)),
            () => 1.1,
          );
          track.moat.push({ sig: "", rows: armRows, len: armLen, mesh: armMesh });
        }
      }
    };

    /** Seconds a ribbon takes to reach out. */
    const reachTime = (track: Track) => Math.min(0.75, Math.max(0.22, (track.geo?.len ?? 0) / sx() / REACH));
    /** When a ribbon starts to reach out: a branch waits for the flow it runs on from. */
    const startOf = (track: Track, depth = 0): number => {
      const own = track.born + track.spec.delay;
      const parent = track.spec.after && depth < 3 ? tracks.get(track.spec.after) : undefined;
      return parent ? Math.max(own, startOf(parent, depth + 1) + reachTime(parent)) : own;
    };
    /** When a fire's surge starts down a ribbon: a branch's after its trunk's. */
    const fireOf = (track: Track): number | null => {
      if (track.endAt === null) return null;
      return track.endAt + track.spec.late + 0.1 + (track.spec.after ? SURGE * 0.85 : 0);
    };

    /** How strongly a ribbon shows now. */
    const fadeOf = (track: Track, now: number): number => {
      const spec = track.spec;
      let k = 1;
      const fire = fireOf(track);
      if (track.gone !== null) k *= 1 - clamp01((now - track.gone) / 0.35);
      if (fire !== null && spec.end === "fire" && spec.strike) k *= 1 - clamp01((now - fire) / 0.3);
      else if (track.endAt !== null && spec.end === "fizzle") k *= 1 - 0.92 * smooth(0, 1, (now - (track.endAt + spec.late)) / 0.6);
      else if (fire !== null && spec.end === "fire") k *= settle(now - (fire + 0.5));
      else if (track.doneAt !== null && spec.done) k *= settle(now - track.doneAt);
      return k;
    };
    /** How far the ribbon has reached out from its icon (0 to 1). */
    const growOf = (track: Track, now: number): number => clamp01((now - startOf(track)) / reachTime(track));
    /** How far its moat has run round (0 to 1), once the ribbon is there. */
    const moatOf = (track: Track, now: number): number => clamp01((now - startOf(track) - reachTime(track)) / MOAT_RUN);
    /** The head of a fire's surge along the ribbon, or -1; past 1 it runs on round the moat. */
    const headOf = (track: Track, now: number): number => {
      const spec = track.spec;
      const fire = fireOf(track);
      if (spec.end !== "fire" || spec.strike || fire === null) return -1;
      const run = (now - fire) / SURGE;
      return run >= 0 && run < 1 ? run * run : -1;
    };
    const moatHeadOf = (track: Track, now: number): number => {
      const spec = track.spec;
      const fire = fireOf(track);
      if (spec.end !== "fire" || spec.strike || fire === null) return -1;
      const run = (now - fire - SURGE) / 0.36;
      return run >= 0 && run < 1 ? run : -1;
    };
    /** The bloom where a fired ribbon lands (0 to 1), or -1. */
    const bloomOf = (track: Track, now: number): number => {
      const spec = track.spec;
      const fire = fireOf(track);
      if (spec.end !== "fire" || spec.strike || fire === null) return -1;
      const bloom = (now - (fire + SURGE)) / BLOOM;
      return bloom >= 0 && bloom < 1 ? bloom : -1;
    };

    const timing: Timing = { fadeOf, growOf, moatOf, headOf, moatHeadOf, bloomOf };
    const painter = glPainter(canvas, () => dpr, timing) ?? flatPainter(canvas, () => dpr, timing);

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
            moat: [],
            bow: (hash(spec.key) < 0.5 ? -1 : 1) * (0.55 + 0.45 * hash(`${spec.key}#`)),
            seed: hash(`${spec.key}~`),
            buffer: null,
            moatBuffers: [],
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
          painter.forget(track);
          build(track);
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
  moatOf: (track: Track, now: number) => number;
  headOf: (track: Track, now: number) => number;
  moatHeadOf: (track: Track, now: number) => number;
  bloomOf: (track: Track, now: number) => number;
};

/** A quad at a ribbon's end: across it (`w`) and along it (`h`), in px, its middle `shift` px back up the ribbon. */
function endQuad(geo: Geo, w: number, h: number, shift = 0): Float32Array {
  const tail = geo.rows[ROWS];
  const tx = tail.ny;
  const ty = -tail.nx;
  const cx = tail.x - tx * shift;
  const cy = tail.y - ty * shift;
  const quad = new Float32Array(4 * 5);
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([qx, qy], i) => {
    quad[i * 5] = cx + tail.nx * qx * w + tx * qy * h;
    quad[i * 5 + 1] = cy + tail.ny * qx * w + ty * qy * h;
    quad[i * 5 + 2] = qx;
    quad[i * 5 + 3] = qy;
    quad[i * 5 + 4] = 1;
  });
  return quad;
}

/** The drops a dam throws back now, as two triangles each (px), their brightness in the fold attribute. */
function dropsOf(geo: Geo, now: number, seed: number, unit: number, fade: number): Float32Array {
  const tail = geo.rows[ROWS];
  // Along the flow at the wall, and back up it.
  const tx = tail.ny;
  const ty = -tail.nx;
  const out = new Float32Array(DROPS * 6 * 5);
  for (let i = 0; i < DROPS; i += 1) {
    const r1 = hash(`${seed}:${i}:a`);
    const r2 = hash(`${seed}:${i}:b`);
    const r3 = hash(`${seed}:${i}:c`);
    const cycle = 0.7 + 0.5 * r3;
    const life = (now / cycle + r1) % 1;
    // Thrown back up the flow and out to the sides, slowing as it goes.
    const angle = (r2 - 0.5) * 2.6;
    const dirX = -tx * Math.cos(angle) + tail.nx * Math.sin(angle);
    const dirY = -ty * Math.cos(angle) + tail.ny * Math.sin(angle);
    const dist = unit * (3 + 7 * r3) * life * (1.4 - 0.6 * life);
    const x = tail.x - tx * unit * 0.6 + dirX * dist;
    const y = tail.y - ty * unit * 0.6 + dirY * dist;
    const size = unit * (0.32 + 0.38 * r1) * (1 - 0.45 * life);
    const lit = Math.pow(1 - life, 1.4) * fade * (0.6 + 0.4 * r2);
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    corners.forEach(([qx, qy], k) => {
      const at = (i * 6 + k) * 5;
      out[at] = x + qx * size;
      out[at + 1] = y + qy * size;
      out[at + 2] = qx;
      out[at + 3] = qy;
      out[at + 4] = lit;
    });
  }
  return out;
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
  const compile = (type: number, source: string) => {
    const shader = g.createShader(type)!;
    g.shaderSource(shader, source);
    g.compileShader(shader);
    return shader;
  };
  const link = (fragment: string) => {
    const program = g.createProgram()!;
    g.attachShader(program, compile(g.VERTEX_SHADER, VERTEX));
    g.attachShader(program, compile(g.FRAGMENT_SHADER, fragment));
    g.linkProgram(program);
    return g.getProgramParameter(program, g.LINK_STATUS) ? program : null;
  };
  const ribbon = link(RIBBON);
  const flare = link(FLARE);
  const damProgram = link(DAM);
  const drop = link(DROP);
  if (!ribbon || !flare || !damProgram || !drop) return null;
  const spot = (program: WebGLProgram, name: string) => g.getUniformLocation(program, name);
  const quadBuffer = g.createBuffer();
  const bind = (program: WebGLProgram) => {
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
  };
  // A lost context (the GPU reset) would show as a blank sheet: hide the light rather than that.
  let lost = g.isContextLost();
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    canvas.style.visibility = "hidden";
  };
  canvas.addEventListener("webglcontextlost", onLost);
  const ribbonDraw = (mesh: Float32Array, buffer: WebGLBuffer | null, len: number, unit: number, uniforms: { fade: number; grow: number; head: number; seed: number; dam: number; pal: Pal }) => {
    let buf = buffer;
    if (!buf) {
      buf = g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER, buf);
      g.bufferData(g.ARRAY_BUFFER, mesh, g.STATIC_DRAW);
    } else g.bindBuffer(g.ARRAY_BUFFER, buf);
    bind(ribbon);
    g.uniform1f(spot(ribbon, "uLen"), len / unit);
    g.uniform1f(spot(ribbon, "uFade"), uniforms.fade);
    g.uniform1f(spot(ribbon, "uGrow"), uniforms.grow);
    g.uniform1f(spot(ribbon, "uHead"), uniforms.head);
    g.uniform1f(spot(ribbon, "uSeed"), uniforms.seed);
    g.uniform1f(spot(ribbon, "uDam"), uniforms.dam);
    g.uniform3fv(spot(ribbon, "uCore"), uniforms.pal.core);
    g.uniform3fv(spot(ribbon, "uMid"), uniforms.pal.mid);
    g.uniform3fv(spot(ribbon, "uDeep"), uniforms.pal.deep);
    g.drawArrays(g.TRIANGLE_STRIP, 0, mesh.length / 5);
    return buf;
  };
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
        const pal = PAL[track.spec.tone];
        const dam = track.spec.land === "dam" ? smooth(0.85, 1, timing.growOf(track, now)) : 0;
        track.buffer = ribbonDraw(geo.mesh, track.buffer, geo.len, unit, { fade, grow: timing.growOf(track, now) * 1.08, head: timing.headOf(track, now), seed: track.seed, dam, pal });
        // The moat: the same light, thin, running round either side from where the ribbon comes in.
        const round = timing.moatOf(track, now);
        if (round > 0) {
          const head = timing.moatHeadOf(track, now);
          track.moat.forEach((arm, i) => {
            track.moatBuffers[i] = ribbonDraw(arm.mesh, track.moatBuffers[i] ?? null, arm.len, unit, { fade: fade * 0.9, grow: round * 1.08, head, seed: (track.seed + i * 0.37) % 1, dam: 0, pal });
          });
        }
      }
      g.useProgram(flare);
      g.uniform2f(spot(flare, "uRes"), W, H);
      g.uniform1f(spot(flare, "uTime"), time);
      g.bindBuffer(g.ARRAY_BUFFER, quadBuffer);
      for (const track of tracks) {
        const geo = track.geo;
        const land = track.spec.land ?? "flare";
        if (land !== "flare") continue;
        const fade = timing.fadeOf(track, now);
        const grown = timing.growOf(track, now);
        const bloom = timing.bloomOf(track, now);
        if (!geo || fade <= 0.003 || grown < 0.9) continue;
        const pal = PAL[track.spec.tone];
        const flicker = 0.9 + 0.1 * Math.sin(now * 11 + track.seed * 20) + 0.05 * Math.sin(now * 27);
        const lit = (bloom >= 0 ? 1 + 1.6 * bloom : 1) * flicker;
        g.bufferData(g.ARRAY_BUFFER, endQuad(geo, unit * 4.6 * lit, unit * 1.9 * lit), g.DYNAMIC_DRAW);
        bind(flare);
        g.uniform1f(spot(flare, "uFade"), fade * (bloom >= 0 ? 1.4 * (1 - bloom) + 0.6 : 1) * smooth(0.9, 1, grown));
        g.uniform3fv(spot(flare, "uCore"), pal.core);
        g.uniform3fv(spot(flare, "uMid"), pal.mid);
        g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      }
      // Dams: the foam wall, the spray and the waves, then the drops thrown back.
      const dams = tracks.filter((track) => track.spec.land === "dam" && track.geo);
      if (dams.length) {
        g.useProgram(damProgram);
        g.uniform2f(spot(damProgram, "uRes"), W, H);
        g.uniform1f(spot(damProgram, "uTime"), time);
        for (const track of dams) {
          const fade = timing.fadeOf(track, now) * smooth(0.85, 1, timing.growOf(track, now));
          if (fade <= 0.003) continue;
          const pal = PAL[track.spec.tone];
          g.bufferData(g.ARRAY_BUFFER, endQuad(track.geo!, unit * 6.6 * (track.spec.width ?? 1), unit * 5.6, unit * 2.2), g.DYNAMIC_DRAW);
          bind(damProgram);
          g.uniform1f(spot(damProgram, "uFade"), fade);
          g.uniform1f(spot(damProgram, "uSeed"), track.seed);
          g.uniform3fv(spot(damProgram, "uCore"), pal.core);
          g.uniform3fv(spot(damProgram, "uMid"), pal.mid);
          g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
        }
        g.useProgram(drop);
        g.uniform2f(spot(drop, "uRes"), W, H);
        for (const track of dams) {
          const fade = timing.fadeOf(track, now) * smooth(0.85, 1, timing.growOf(track, now));
          if (fade <= 0.003) continue;
          const pal = PAL[track.spec.tone];
          g.bufferData(g.ARRAY_BUFFER, dropsOf(track.geo!, now, track.seed, unit, fade), g.DYNAMIC_DRAW);
          bind(drop);
          g.uniform3fv(spot(drop, "uCore"), pal.core);
          g.uniform3fv(spot(drop, "uMid"), pal.mid);
          g.drawArrays(g.TRIANGLES, 0, DROPS * 6);
        }
      }
    },
    forget(track) {
      if (!lost) {
        if (track.buffer) g.deleteBuffer(track.buffer);
        for (const buffer of track.moatBuffers) if (buffer) g.deleteBuffer(buffer);
      }
      track.buffer = null;
      track.moatBuffers = [];
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      if (!lost) {
        g.deleteProgram(ribbon);
        g.deleteProgram(flare);
        g.deleteProgram(damProgram);
        g.deleteProgram(drop);
        g.deleteBuffer(quadBuffer);
      }
      // Free the context once the canvas is really gone (not when React only runs the effect again on it).
      window.setTimeout(() => {
        if (!canvas.isConnected) g.getExtension("WEBGL_lose_context")?.loseContext();
      }, 0);
    },
  };
}

/** Without WebGL: each ribbon is a soft glow along its bend, a plain flare where it lands, its moat a thin glow line,
 *  a dam a white burst. */
function flatPainter(canvas: HTMLCanvasElement, dprOf: () => number, timing: Timing): Painter {
  const ctx = canvas.getContext("2d");
  const css = (rgb: Rgb, alpha: number) => `rgba(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)},${alpha})`;
  const stroke = (rows: Row[], last: number, widths: ReadonlyArray<readonly [number, Rgb, number]>, fade: number) => {
    if (!ctx || last < 1) return;
    for (const [width, rgb, alpha] of widths) {
      ctx.strokeStyle = css(rgb, alpha * fade);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(rows[0].x, rows[0].y);
      for (let i = 1; i <= last; i += 1) ctx.lineTo(rows[i].x, rows[i].y);
      ctx.stroke();
    }
  };
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
        const width = track.spec.width ?? 1;
        stroke(geo.rows, Math.round(ROWS * timing.growOf(track, now)), [
          [unit * 4.2 * width, pal.mid, 0.16],
          [unit * 1.6 * width, pal.mid, 0.4],
          [unit * 0.6 * width, pal.core, 0.65],
        ], fade);
        const round = timing.moatOf(track, now);
        for (const arm of track.moat) stroke(arm.rows, Math.round(ROWS * round), [[unit * 1.2, pal.mid, 0.3], [unit * 0.4, pal.core, 0.6]], fade);
        if (track.spec.land === "dam" && timing.growOf(track, now) >= 1) {
          const tail = geo.rows[ROWS];
          const pulse = 0.75 + 0.25 * Math.sin(now * 9 + track.seed * 10);
          const glow = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, unit * 4 * pulse);
          glow.addColorStop(0, css(pal.core, 0.8 * fade));
          glow.addColorStop(1, css(pal.mid, 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(tail.x, tail.y, unit * 4 * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    },
    forget() {},
    dispose() {},
  };
}
