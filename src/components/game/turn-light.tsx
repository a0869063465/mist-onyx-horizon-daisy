import { useEffect, useLayoutEffect, useRef } from "react";
import { bindRibbon, linkProgram, RIBBON } from "@/components/game/flow-canvas";

/*
 * Dòng sáng của bên đang có lượt (chủ game 28/10, theo video Runeterra): mỗi bên như một bể cá dựng ở giữa sân. Đáy là
 * phần giáp giữa khu của bên đó và giữa sân, hai thành là hai bên chạy về phía giữa sân, miệng bể mở về giữa sân. Không có
 * viền sáng: trong bể là nước sáng lấp lánh (đúng thứ ánh sáng caustics của dây phản ứng, flow-canvas.tsx), đậm ở đáy,
 * nhạt dần về giữa sân, cùng vài dải sáng võng giữa hai thành chảy từ trái sang phải. Đỏ là đối thủ, xanh là mình. Đổi
 * bên: bể cũ tắt dần từ trái sang phải, bể mới chảy vào từ thành trái (lấm tấm sáng trước, rồi nước và các dải sáng tuôn
 * theo). Chữ "TỚI LƯỢT CỦA BẠN" và "VÒNG N" hiện giữa sân, vàng, có bụi sáng quét qua.
 *
 * Nước và dải sáng vẽ bằng WebGL (cùng shader với dây phản ứng); không có WebGL thì một lớp sáng mềm bằng canvas 2D.
 * Bụi sáng và chữ vẽ trên một canvas 2D phía trên.
 */

export type TankSide = "foe" | "you";
/** A tank in % of the board: its walls at x `x0` and `x1`, its bottom at y `base`, open toward y `open`. */
export type TankGeo = { x0: number; x1: number; base: number; open: number };
/** A title in the middle of the field: a new id plays it once. */
export type TitleCue = { id: number; kind: "turn" | "round"; lines: string[] };

type Rgb = [number, number, number];
type Pal = { core: Rgb; mid: Rgb; deep: Rgb };
/** Red for the opponent, blue for you, in the 0–1 colours of the flow shader. */
const PAL: Record<TankSide, Pal> = {
  foe: { core: [1, 0.88, 0.9], mid: [1, 0.2, 0.36], deep: [0.62, 0.02, 0.12] },
  you: { core: [0.86, 0.95, 1], mid: [0.24, 0.56, 1], deep: [0.04, 0.18, 0.76] },
};

/** Seconds: the sparkles before the light, its run across the tank, its fade, and the gap before the new side starts. */
const LEAD = 0.12;
const RUN_IN = 0.38;
const RUN_OUT = 0.44;
const HAND_OVER = 0.05;
/** How soft the moving front is, in parts of the tank's width. */
const SOFT = 0.16;
/** The title: in, hold, out. */
const TITLE_IN = 0.24;
const TITLE_HOLD = 0.95;
const TITLE_OUT = 0.45;
/** Rows along a ribbon of light. */
const ROWS = 48;

/**
 * Ribbons of light in a tank, in parts of the tank: where they leave the left wall (`a`) and reach the right one (`b`),
 * how low they hang in between (`c`, `d`), how wide they are, and how they sway.
 */
const SHEETS = [
  { a: 0.8, c: 0.08, d: 0.12, b: 0.74, w: 1, rate: 0.11, phase: 0 },
  { a: 0.3, c: 0.16, d: 0.56, b: 0.9, w: 0.78, rate: 0.14, phase: 1.9 },
  { a: 0.92, c: 0.58, d: 0.22, b: 0.26, w: 0.78, rate: 0.12, phase: 3.3 },
];

/** The water: the flows' caustics drifting toward the right wall, deepest by the bottom, gone toward the open end. */
const WATER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform float uFront;
uniform float uEnter;
uniform float uFade;
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
  vec2 p = vec2(u * uAspect * 1.5 - uTime * 0.22, v * 1.3 - uTime * 0.05) * 3.0 + vec2(uSeed * 7.0 - 250.0, uSeed * 3.0 - 250.0);
  float lines = caustic(p, uTime * 0.7 + uSeed * 5.0) + caustic(p * 1.7 + vec2(2.3, 4.1), uTime * 0.9 + uSeed * 3.0) * 0.4;
  float shimmer = clamp((lines - 0.2) * 1.4, 0.0, 1.5);
  // No edge line anywhere: the water thins out softly at the walls and at the bottom, as light does.
  float soft = smoothstep(0.0, 0.07, u) * smoothstep(0.0, 0.07, 1.0 - u) * smoothstep(0.0, 0.06, v);
  float deep = pow(1.0 - v, 1.6);
  float walls = (exp(-u * 7.0) + exp(-(1.0 - u) * 7.0)) * pow(1.0 - v, 1.4) * 0.3;
  float body = (deep + walls) * soft;
  vec3 col = mix(uDeep, uMid, 0.6) * body * 0.55;
  col += uMid * shimmer * body * 0.65;
  col += uCore * shimmer * shimmer * deep * deep * soft * 0.4;
  float seen = uEnter > 0.5 ? 1.0 - smoothstep(uFront - 0.16, uFront, u) : smoothstep(uFront - 0.16, uFront, u);
  float k = seen * uFade;
  col *= k;
  gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)) * 0.5 + body * 0.2 * k, 0.0, 1.0));
}`;

type Mode = "off" | "in" | "on" | "out";
type Tank = { mode: Mode; at: number };
type Veil = { front: number; entering: boolean; fade: number };
type Spark = { side: TankSide; x: number; y: number; vx: number; vy: number; age: number; life: number; size: number };
type Glint = { x: number; y: number; vy: number; age: number; life: number; size: number };
type Box = { x0: number; x1: number; base: number; dir: number; depth: number; at: (v: number) => number };
type Painter = { draw: (tanks: Array<{ side: TankSide; veil: Veil; box: Box }>, now: number, w: number, h: number, dpr: number) => void };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const css = (c: Rgb, a: number) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${clamp01(a).toFixed(3)})`;

/** A small seeded random source, so a recorded sketch looks the same every time. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A ribbon's centre line now: a bend from the left wall to the right one, swaying slowly. */
function sheetLine(sheet: (typeof SHEETS)[number], box: Box, now: number) {
  const sway = (k: number) => Math.sin(now * Math.PI * 2 * sheet.rate + sheet.phase + k);
  const width = box.x1 - box.x0;
  const lean = 0.06 * sway(0.7);
  const pts = [
    { x: box.x0, y: box.at(sheet.a + 0.07 * sway(0)) },
    { x: box.x0 + width * (0.3 + lean), y: box.at(Math.max(0, sheet.c + 0.05 * sway(2.1))) },
    { x: box.x0 + width * (0.7 + lean), y: box.at(Math.max(0, sheet.d + 0.05 * sway(3.4))) },
    { x: box.x1, y: box.at(sheet.b + 0.07 * sway(1.3)) },
  ];
  return (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * pts[0].x + 3 * u * u * t * pts[1].x + 3 * u * t * t * pts[2].x + t * t * t * pts[3].x,
      y: u * u * u * pts[0].y + 3 * u * u * t * pts[1].y + 3 * u * t * t * pts[2].y + t * t * t * pts[3].y,
    };
  };
}

/** A ribbon's triangle strip, laid out as the flows' meshes are: position, (u, side), fold brightness. */
function sheetMesh(line: (t: number) => { x: number; y: number }, half: number, seed: number, unit: number) {
  const pts = Array.from({ length: ROWS + 1 }, (_, i) => line(i / ROWS));
  let len = 0;
  for (let i = 1; i <= ROWS; i += 1) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const mesh = new Float32Array((ROWS + 1) * 2 * 5);
  pts.forEach((pt, i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(ROWS, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    const u = i / ROWS;
    const turn = Math.cos(Math.PI * (0.35 + seed * 0.5 + (u * len) / unit / 30));
    const fold = 0.5 + 0.5 * Math.abs(turn);
    const breadth = half * (0.62 + 0.38 * Math.sin(Math.PI * u)) * fold;
    const glow = 1 / (0.62 + 0.38 * fold);
    for (const side of [-1, 1]) {
      const at = (i * 2 + (side < 0 ? 0 : 1)) * 5;
      mesh[at] = pt.x + nx * breadth * side;
      mesh[at + 1] = pt.y + ny * breadth * side;
      mesh[at + 2] = u;
      mesh[at + 3] = side;
      mesh[at + 4] = glow;
    }
  });
  return { mesh, len };
}

function glPainter(canvas: HTMLCanvasElement): Painter | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const g = gl;
  const water = linkProgram(g, WATER);
  const ribbon = linkProgram(g, RIBBON);
  if (!water || !ribbon) return null;
  const quad = g.createBuffer();
  const strip = g.createBuffer();
  const spot = (program: WebGLProgram, name: string) => g.getUniformLocation(program, name);
  let lost = g.isContextLost();
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    canvas.style.visibility = "hidden";
  });
  return {
    draw(tanks, now, w, h, dpr) {
      if (lost) return;
      g.viewport(0, 0, Math.round(w * dpr), Math.round(h * dpr));
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      if (!tanks.length) return;
      g.enable(g.BLEND);
      g.blendFunc(g.ONE, g.ONE);
      const time = now % 120;
      const unit = w / 90;
      for (const { side, veil, box } of tanks) {
        const pal = PAL[side];
        const open = box.at(1);
        // The water.
        g.useProgram(water);
        g.uniform2f(spot(water, "uRes"), w, h);
        g.uniform1f(spot(water, "uTime"), time);
        g.uniform1f(spot(water, "uAspect"), (box.x1 - box.x0) / Math.max(1, box.depth));
        g.uniform1f(spot(water, "uFront"), veil.front);
        g.uniform1f(spot(water, "uEnter"), veil.entering ? 1 : 0);
        g.uniform1f(spot(water, "uFade"), veil.fade);
        g.uniform1f(spot(water, "uSeed"), side === "foe" ? 0.31 : 0.67);
        g.uniform3fv(spot(water, "uCore"), pal.core);
        g.uniform3fv(spot(water, "uMid"), pal.mid);
        g.uniform3fv(spot(water, "uDeep"), pal.deep);
        g.bindBuffer(g.ARRAY_BUFFER, quad);
        g.bufferData(
          g.ARRAY_BUFFER,
          new Float32Array([box.x0, box.base, 0, 0, 1, box.x1, box.base, 1, 0, 1, box.x0, open, 0, 1, 1, box.x1, open, 1, 1, 1]),
          g.DYNAMIC_DRAW,
        );
        bindRibbon(g, water);
        g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
        // The ribbons hanging in it.
        g.useProgram(ribbon);
        g.uniform2f(spot(ribbon, "uRes"), w, h);
        g.uniform1f(spot(ribbon, "uTime"), time);
        g.uniform1f(spot(ribbon, "uHead"), -1);
        g.uniform3fv(spot(ribbon, "uCore"), pal.core);
        g.uniform3fv(spot(ribbon, "uMid"), pal.mid);
        g.uniform3fv(spot(ribbon, "uDeep"), pal.deep);
        g.bindBuffer(g.ARRAY_BUFFER, strip);
        SHEETS.forEach((sheet, i) => {
          const seed = (i + 1) * 0.23 + (side === "foe" ? 0.11 : 0.53);
          const { mesh, len } = sheetMesh(sheetLine(sheet, box, now), box.depth * 0.1 * sheet.w, seed, unit);
          g.bufferData(g.ARRAY_BUFFER, mesh, g.DYNAMIC_DRAW);
          bindRibbon(g, ribbon);
          g.uniform1f(spot(ribbon, "uLen"), len / unit);
          g.uniform1f(spot(ribbon, "uFade"), veil.fade * 0.85);
          g.uniform1f(spot(ribbon, "uGrow"), veil.entering ? veil.front * 1.06 : 2);
          g.uniform1f(spot(ribbon, "uTail"), veil.entering ? -1 : veil.front);
          g.uniform1f(spot(ribbon, "uSeed"), seed);
          g.drawArrays(g.TRIANGLE_STRIP, 0, (ROWS + 1) * 2);
        });
      }
    },
  };
}

/** Without WebGL: a soft glow rising off the bottom, and the ribbons as soft strokes. */
function flatPainter(canvas: HTMLCanvasElement): Painter {
  const ctx = canvas.getContext("2d");
  return {
    draw(tanks, now, w, h, dpr) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const { side, veil, box } of tanks) {
        const pal = PAL[side];
        const width = box.x1 - box.x0;
        ctx.save();
        const haze = ctx.createLinearGradient(0, box.base, 0, box.at(0.85));
        haze.addColorStop(0, css(pal.mid, 0.42));
        haze.addColorStop(0.4, css(pal.mid, 0.16));
        haze.addColorStop(1, css(pal.mid, 0));
        ctx.fillStyle = haze;
        ctx.fillRect(box.x0, Math.min(box.base, box.at(0.85)), width, box.depth * 0.85);
        ctx.lineCap = "round";
        for (const sheet of SHEETS) {
          const line = sheetLine(sheet, box, now);
          for (const [lw, alpha, ink] of [
            [box.depth * 0.16 * sheet.w, 0.14, pal.mid],
            [box.depth * 0.05 * sheet.w, 0.3, pal.mid],
            [1.2, 0.7, pal.core],
          ] as const) {
            ctx.beginPath();
            for (let i = 0; i <= 24; i += 1) {
              const pt = line(i / 24);
              if (i === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            ctx.strokeStyle = css(ink, alpha);
            ctx.lineWidth = lw;
            ctx.stroke();
          }
        }
        // Only the part the moving front has passed shows (or, going out, the part it has not reached).
        const veilFill = ctx.createLinearGradient(box.x0, 0, box.x1, 0);
        for (let i = 0; i <= 10; i += 1) {
          const u = i / 10;
          const seen = veil.entering ? clamp01((veil.front - u) / SOFT) : clamp01((u - veil.front) / SOFT);
          veilFill.addColorStop(u, `rgba(0,0,0,${(seen * veil.fade).toFixed(3)})`);
        }
        ctx.globalCompositeOperation = "destination-in";
        ctx.fillStyle = veilFill;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    },
  };
}

/** The drawing, kept apart from React so it can also be played frame by frame. */
export class TurnLightArt {
  private painter: Painter;
  private top: CanvasRenderingContext2D;
  private lightCanvas: HTMLCanvasElement;
  private tanks: Record<TankSide, Tank> = { foe: { mode: "off", at: 0 }, you: { mode: "off", at: 0 } };
  private sparks: Spark[] = [];
  private glints: Glint[] = [];
  private cue: { cue: TitleCue; at: number } | null = null;
  private side: TankSide | null = null;
  private last = 0;
  private random = seeded(28);
  private w = 1;
  private h = 1;
  private dpr = 1;
  geo: Record<TankSide, TankGeo> = {
    foe: { x0: 5, x1: 91.6, base: 41.4, open: 51 },
    you: { x0: 5, x1: 91.6, base: 61.4, open: 51 },
  };
  font = '"Barlow Condensed", system-ui, sans-serif';

  constructor(light: HTMLCanvasElement, top: HTMLCanvasElement) {
    this.lightCanvas = light;
    this.painter = glPainter(light) ?? flatPainter(light);
    this.top = top.getContext("2d")!;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.dpr = dpr;
    for (const canvas of [this.lightCanvas, this.top.canvas]) {
      canvas.width = Math.round(this.w * dpr);
      canvas.height = Math.round(this.h * dpr);
    }
  }

  /** Who holds the turn now; `instant` shows it without the hand-over (a page opened mid-match). */
  setSide(side: TankSide | null, now: number, instant = false) {
    if (side === this.side) return;
    const before = this.side;
    this.side = side;
    if (before && this.tanks[before].mode !== "off") this.tanks[before] = { mode: instant ? "off" : "out", at: now };
    if (side) this.tanks[side] = instant ? { mode: "on", at: now } : { mode: "in", at: now + (before ? HAND_OVER : 0) };
  }

  showTitle(cue: TitleCue, now: number) {
    if (this.cue?.cue.id === cue.id) return;
    this.cue = { cue, at: now };
  }

  /** Draws the frame at `now` (seconds); false once nothing moves any more. */
  draw(now: number): boolean {
    const dt = this.last ? Math.min(0.05, Math.max(0, now - this.last)) : 1 / 60;
    this.last = now;
    const shown: Array<{ side: TankSide; veil: Veil; box: Box }> = [];
    for (const side of ["foe", "you"] as const) {
      const tank = this.tanks[side];
      if (tank.mode === "off") continue;
      const age = now - tank.at;
      if (tank.mode === "in" && age >= LEAD + RUN_IN) this.tanks[side] = { mode: "on", at: tank.at };
      if (tank.mode === "out" && age >= RUN_OUT) {
        this.tanks[side] = { mode: "off", at: now };
        continue;
      }
      const veil = this.veilOf(side, now);
      const box = this.box(side);
      shown.push({ side, veil, box });
      this.spawn(side, now, dt, veil, box);
    }
    this.painter.draw(shown, now, this.w, this.h, this.dpr);
    const top = this.top;
    top.setTransform(1, 0, 0, 1, 0, 0);
    top.clearRect(0, 0, top.canvas.width, top.canvas.height);
    const sparking = this.drawSparks(dt);
    const titling = this.drawTitle(now, dt);
    return shown.length > 0 || sparking || titling;
  }

  /** How much of a tank shows across its width: a soft front moving left to right. */
  private veilOf(side: TankSide, now: number): Veil {
    const tank = this.tanks[side];
    const age = now - tank.at;
    if (tank.mode === "in") {
      if (age < LEAD) return { front: -SOFT, entering: true, fade: 1 };
      return { front: -SOFT + (1 + SOFT * 2) * easeOut(clamp01((age - LEAD) / RUN_IN)), entering: true, fade: 1 };
    }
    if (tank.mode === "out") {
      const k = clamp01(age / RUN_OUT);
      return { front: -SOFT + (1 + SOFT * 2) * easeInOut(k), entering: false, fade: 1 - k * 0.35 };
    }
    return { front: 1 + SOFT * 2, entering: true, fade: 1 };
  }

  private box(side: TankSide): Box {
    const g = this.geo[side];
    const x0 = (g.x0 / 100) * this.w;
    const x1 = (g.x1 / 100) * this.w;
    const base = (g.base / 100) * this.h;
    const open = (g.open / 100) * this.h;
    const dir = open >= base ? 1 : -1;
    const depth = Math.abs(open - base);
    return { x0, x1, base, dir, depth, at: (v: number) => base + dir * depth * v };
  }

  /** Sparkles: a few before the light comes in, many at its head as it runs, a few drifting while it stays. */
  private spawn(side: TankSide, now: number, dt: number, veil: Veil, box: Box) {
    const { x0, x1, base, dir, depth } = box;
    const width = x1 - x0;
    const tank = this.tanks[side];
    const age = now - tank.at;
    const add = (x: number, y: number, up: number) =>
      this.sparks.push({ side, x, y, vx: (this.random() - 0.5) * 18, vy: dir * up, age: 0, life: 0.5 + this.random() * 0.7, size: 0.7 + this.random() * 1.4 });
    let rate = 0;
    if (tank.mode === "in" && age < LEAD + RUN_IN) rate = 120;
    else if (tank.mode === "on") rate = 6;
    let n = rate * dt;
    while (n > 0) {
      if (n < 1 && this.random() > n) break;
      n -= 1;
      if (tank.mode === "in" && age < LEAD) add(x0 + this.random() * 6, base + dir * this.random() * depth * 0.8, 8 + this.random() * 20);
      else if (tank.mode === "in") {
        const hx = x0 + clamp01(veil.front) * width;
        add(hx + (this.random() - 0.5) * 18, base + dir * this.random() * depth * 0.6, 10 + this.random() * 30);
      } else {
        const nearWall = this.random() < 0.5;
        add(nearWall ? (this.random() < 0.5 ? x0 + 3 : x1 - 3) : x0 + this.random() * width, base + dir * this.random() * depth * (nearWall ? 0.8 : 0.3), 6 + this.random() * 14);
      }
    }
  }

  private drawSparks(dt: number): boolean {
    const ctx = this.top;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    const unit = Math.max(1, this.w / 412);
    this.sparks = this.sparks.filter((spark) => {
      spark.age += dt;
      if (spark.age >= spark.life || this.tanks[spark.side].mode === "off") return false;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      const pal = PAL[spark.side];
      const k = 1 - spark.age / spark.life;
      const r = spark.size * unit;
      ctx.fillStyle = css(pal.mid, 0.3 * k);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = css(pal.core, 0.95 * k);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, r, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalCompositeOperation = "source-over";
    return this.sparks.length > 0;
  }

  /** "TỚI LƯỢT CỦA BẠN" or "VÒNG N" in the middle of the field: gold letters, a sweep of gold dust, then away. */
  private drawTitle(now: number, dt: number): boolean {
    const show = this.cue;
    if (!show) return false;
    const ctx = this.top;
    const age = now - show.at;
    const total = TITLE_IN + TITLE_HOLD + TITLE_OUT;
    if (age > total + 0.8) {
      this.cue = null;
      this.glints = [];
      return false;
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const fade = age < TITLE_IN ? clamp01(age / TITLE_IN) : age > TITLE_IN + TITLE_HOLD ? 1 - clamp01((age - TITLE_IN - TITLE_HOLD) / TITLE_OUT) : 1;
    const grow = 1 + 0.07 * (1 - easeOut(clamp01(age / 0.32)));
    const cx = ((this.geo.you.x0 + this.geo.you.x1) / 2 / 100) * this.w;
    const cy = ((this.geo.foe.open + this.geo.you.open) / 2 / 100) * this.h;
    const lines = show.cue.lines;
    const size = (show.cue.kind === "round" ? 0.085 : 0.095) * this.w;
    const gap = size * 1.02;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(grow, grow);
    ctx.font = `800 ${size}px ${this.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const top = -((lines.length - 1) * gap) / 2;
    let span = 0;
    for (const line of lines) span = Math.max(span, ctx.measureText(line).width);
    if (fade > 0) {
      ctx.globalAlpha = fade;
      lines.forEach((line, i) => {
        const y = top + i * gap;
        const gold = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
        gold.addColorStop(0, "#fff6cf");
        gold.addColorStop(0.45, "#f1c45a");
        gold.addColorStop(0.55, "#d79a2b");
        gold.addColorStop(1, "#9a6214");
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = size * 0.18;
        ctx.shadowOffsetY = size * 0.05;
        ctx.lineWidth = size * 0.09;
        ctx.strokeStyle = "#3a2104";
        ctx.strokeText(line, 0, y);
        ctx.shadowColor = "transparent";
        ctx.fillStyle = gold;
        ctx.fillText(line, 0, y);
      });
      if (show.cue.kind === "round") {
        const reach = easeOut(clamp01((age - 0.08) / 0.4)) * span * 0.62;
        const rule = ctx.createLinearGradient(-reach, 0, reach, 0);
        rule.addColorStop(0, "rgba(255,214,120,0)");
        rule.addColorStop(0.5, "rgba(255,236,170,0.95)");
        rule.addColorStop(1, "rgba(255,214,120,0)");
        ctx.fillStyle = rule;
        ctx.fillRect(-reach, top + size * 0.62, reach * 2, Math.max(1.2, size * 0.05));
      }
      ctx.globalAlpha = 1;
    }
    // The gold dust sweeping across the letters as they come in.
    const sweep = (age - 0.06) / 0.62;
    if (sweep > 0 && sweep < 1) {
      const sx = -span / 2 + sweep * span;
      for (let i = 0; i < 4; i += 1) {
        this.glints.push({
          x: sx + (this.random() - 0.5) * 10,
          y: top - size * 0.5 + this.random() * ((lines.length - 1) * gap + size),
          vy: -(6 + this.random() * 16),
          age: 0,
          life: 0.45 + this.random() * 0.55,
          size: 0.6 + this.random() * 1.2,
        });
      }
    }
    ctx.globalCompositeOperation = "lighter";
    this.glints = this.glints.filter((glint) => {
      glint.age += dt;
      if (glint.age >= glint.life) return false;
      glint.y += glint.vy * dt;
      const k = 1 - glint.age / glint.life;
      ctx.fillStyle = `rgba(255,214,110,${(0.35 * k).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(glint.x, glint.y, glint.size * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,248,214,${(0.95 * k).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(glint.x, glint.y, glint.size, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.restore();
    return true;
  }
}

/**
 * Dòng sáng chuyển lượt trên bàn: `side` là bên đang có lượt (đối thủ ở trên, mình ở dưới), `geo` là hai bể theo phần
 * trăm của bàn (đã tính vết cắt), `cue` là chữ giữa sân.
 */
export function TurnLight({ side, geo, cue }: { side: TankSide | null; geo: Record<TankSide, TankGeo>; cue: TitleCue | null }) {
  const lightRef = useRef<HTMLCanvasElement | null>(null);
  const topRef = useRef<HTMLCanvasElement | null>(null);
  const artRef = useRef<TurnLightArt | null>(null);
  const wake = useRef<() => void>(() => undefined);
  const first = useRef(true);

  useLayoutEffect(() => {
    const light = lightRef.current;
    const top = topRef.current;
    if (!light || !top) return;
    const art = new TurnLightArt(light, top);
    artRef.current = art;
    let raf = 0;
    const frame = () => {
      raf = 0;
      if (art.draw(performance.now() / 1000)) raf = requestAnimationFrame(frame);
    };
    wake.current = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const fit = () => {
      const box = light.parentElement?.getBoundingClientRect();
      if (!box) return;
      art.resize(box.width, box.height, Math.min(1.5, window.devicePixelRatio || 1));
      wake.current();
    };
    fit();
    const resize = new ResizeObserver(fit);
    if (light.parentElement) resize.observe(light.parentElement);
    return () => {
      resize.disconnect();
      if (raf) cancelAnimationFrame(raf);
      wake.current = () => undefined;
      artRef.current = null;
    };
  }, []);

  useEffect(() => {
    const art = artRef.current;
    if (!art) return;
    art.geo = geo;
    art.setSide(side, performance.now() / 1000, first.current);
    first.current = false;
    wake.current();
  }, [side, geo]);

  useEffect(() => {
    const art = artRef.current;
    if (!art || !cue) return;
    art.showTitle(cue, performance.now() / 1000);
    wake.current();
  }, [cue]);

  return (
    <>
      <canvas ref={lightRef} className="turn-light" aria-hidden="true" />
      <canvas ref={topRef} className="turn-title" aria-hidden="true" />
    </>
  );
}
