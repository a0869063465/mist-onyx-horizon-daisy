import { useEffect, useLayoutEffect, useRef } from "react";

/*
 * Dòng sáng của bên đang có lượt (chủ game 28/10, theo video Runeterra): mỗi bên như một bể cá dựng ở giữa sân. Đáy là
 * phần giáp giữa khu của bên đó và giữa sân, hai thành chạy từ đáy về phía giữa sân, miệng bể mở về giữa sân. Không có
 * viền sáng (chủ game: Runeterra không có): bể chỉ hiện qua nước sáng và các dải sáng. Trong bể
 * là những dải sáng như dòng nước, mỗi dải gồm nhiều sợi sáng mảnh, võng giữa hai thành và lắc nhẹ. Đỏ là đối thủ, xanh
 * là mình. Đổi bên: bể cũ tắt dần từ trái sang phải, bể mới chảy vào từ thành trái (lấm tấm sáng trước, rồi viền sáng
 * chạy dọc đáy sang thành phải, các dải sáng tuôn theo). Chữ "TỚI LƯỢT CỦA BẠN" và "VÒNG N" hiện giữa sân, vàng, có bụi
 * sáng quét qua.
 *
 * Vẽ bằng canvas 2D: lớp ánh sáng nằm dưới lá quái (màu phủ thường để còn đậm trên nền đá sáng), lớp chữ nằm trên.
 */

export type TankSide = "foe" | "you";
/** A tank in % of the board: its walls at x `x0` and `x1`, its bottom line at y `base`, open toward y `open`. */
export type TankGeo = { x0: number; x1: number; base: number; open: number };
/** A title in the middle of the field: a new id plays it once. */
export type TitleCue = { id: number; kind: "turn" | "round"; lines: string[] };

type Rgb = [number, number, number];
/** `gain`: how much stronger its water and ribbons show; `bank`: the band along the bottom, its depth in parts of the tank,
 *  its strength and how far it feathers out behind the bottom into the field's own colour. The red is the orange red of its floor, which hides on the stone more than the blue does, so it is
 *  laid on stronger and its bank reaches over the grass at the edge of the red field (chủ game 30/10). */
const TONE: Record<TankSide, { mid: Rgb; core: Rgb; gain: number; bank: [number, number, number] }> = {
  foe: { mid: [226, 32, 10], core: [255, 205, 170], gain: 1.2, bank: [0.34, 0.75, 0.14] },
  you: { mid: [30, 105, 240], core: [205, 228, 255], gain: 1, bank: [0.16, 0.5, 0] },
};

/** Seconds: the sparkles before the light, its run across the tank, its fade, and the gap before the new side starts. */
const LEAD = 0.12;
const RUN_IN = 0.36;
const RUN_OUT = 0.42;
const HAND_OVER = 0.05;
/** How soft the moving front is, in parts of the tank's width. */
const SOFT = 0.16;
/** The title: in, hold, out. */
const TITLE_IN = 0.24;
const TITLE_HOLD = 0.95;
const TITLE_OUT = 0.45;

/** The pool's strengths per side: the haze rising off the bottom (alphas along `hazeDepth` of the depth), the wall edge, the bottom rim and the bank. */
const POOL: Record<TankSide, { haze: number[]; hazeDepth: number; wall: number; rim: number; bank: number; corner: number }> = {
  you: { haze: [0.42, 0.26, 0.1, 0], hazeDepth: 0.6, wall: 0.6, rim: 0.5, bank: 0.7, corner: 0.45 },
  foe: { haze: [0.4, 0.22, 0.07, 0], hazeDepth: 0.75, wall: 0.45, rim: 0.4, bank: 0.5, corner: 0.6 },
};

/**
 * Smoke wisps (clips of 01/11, measured frame by frame): from each wall a fan of thin see-through sheets, broad where they
 * leave the wall and thinning to a thread that settles along the bottom, like smoke breathed out or silk in water. Each
 * one rolls (its two edges twist past each other, brighter where it turns edge-on), flutters with a wave running out
 * along it, sways slowly and fades in and out on its own clock, so the fan never stands still. Measured on the video:
 * pixels in the wisps change by about 3× their spread every second, most of the change near 1 Hz with a slow part at
 * 0.1–0.4 Hz.
 */
type Wisp = {
  /** Where it leaves the wall (part of the depth from the bottom), how thick it is there, how far across it reaches and how low it ends. */
  v: number;
  thick: number;
  reach: number;
  end: number;
  /** Strength, and the phases and rates (Hz) of its slow sway, its fade and its roll. */
  alpha: number;
  phase: number;
  sway: number;
  fade: number;
  roll: number;
};
const WISP_COUNT: Record<TankSide, number> = { you: 5, foe: 7 };
/** Colours: the see-through body, the brighter edges; strength; how fast it moves (the blue clip is calmer than the red). */
const WISP_TONE: Record<TankSide, { body: Rgb; edge: Rgb; alpha: number; speed: number }> = {
  you: { body: [60, 120, 250], edge: [110, 160, 255], alpha: 1.3, speed: 0.95 },
  foe: { body: [226, 40, 14], edge: [255, 122, 74], alpha: 1.35, speed: 1.15 },
};

/** A fixed set of wisps per wall, spread over the wall's height (lower ones shorter), drawn from a seeded source so every load looks alike. */
function makeWisps(side: TankSide, seed: number): Wisp[] {
  const rand = seeded(seed);
  const n = WISP_COUNT[side];
  return Array.from({ length: n }, (_, i) => {
    const k = (i + 0.5) / n;
    return {
      v: 0.18 + k * 0.68 + (rand() - 0.5) * 0.08,
      thick: 0.2 + rand() * 0.2,
      reach: 0.22 + k * 0.26 + rand() * 0.06,
      end: 0.03 + rand() * 0.07,
      alpha: 0.75 + rand() * 0.35,
      phase: rand() * Math.PI * 2,
      sway: 0.12 + rand() * 0.2,
      fade: 0.08 + rand() * 0.12,
      roll: 0.24 + rand() * 0.18,
    };
  });
}
const WISPS: Record<TankSide, [Wisp[], Wisp[]]> = {
  you: [makeWisps("you", 11), makeWisps("you", 23)],
  foe: [makeWisps("foe", 37), makeWisps("foe", 41)],
};
/** The wisps are drawn at this part of the full resolution and scaled up, which softens their edges like smoke. */
const WISP_SCALE = 0.5;

/** The court's edge on the new board (measured on board-full.jpg): flat across, then rounding away from the open end at each wall, by this much of the board's height. */
const EDGE_DIP = 0.022;
/** How far in from each wall the rounded corner of the court's edge reaches, in parts of the width (blue ~6%, red ~9%). */
const EDGE_CORNER: Record<TankSide, number> = { you: 0.06, foe: 0.09 };

type Mode = "off" | "in" | "on" | "out";
type Tank = { mode: Mode; at: number };
type Spark = { side: TankSide; x: number; y: number; vx: number; vy: number; age: number; life: number; size: number };
type Glint = { x: number; y: number; vy: number; age: number; life: number; size: number };

const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

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

/** The drawing, kept apart from React so it can also be played frame by frame. */
export class TurnLightArt {
  private light: CanvasRenderingContext2D;
  private title: CanvasRenderingContext2D;
  private layer: Record<TankSide, CanvasRenderingContext2D>;
  private smoke: CanvasRenderingContext2D;
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

  constructor(light: HTMLCanvasElement, title: HTMLCanvasElement) {
    this.light = light.getContext("2d")!;
    this.title = title.getContext("2d")!;
    const own = () => {
      const canvas = document.createElement("canvas");
      return canvas.getContext("2d")!;
    };
    this.layer = { foe: own(), you: own() };
    this.smoke = own();
  }

  resize(w: number, h: number, dpr: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.dpr = dpr;
    for (const ctx of [this.light, this.title, this.layer.foe, this.layer.you]) {
      ctx.canvas.width = Math.round(this.w * dpr);
      ctx.canvas.height = Math.round(this.h * dpr);
    }
    this.smoke.canvas.width = Math.max(1, Math.round(this.w * dpr * WISP_SCALE));
    this.smoke.canvas.height = Math.max(1, Math.round(this.h * dpr * WISP_SCALE));
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
    const { light } = this;
    light.setTransform(1, 0, 0, 1, 0, 0);
    light.clearRect(0, 0, light.canvas.width, light.canvas.height);
    let busy = false;
    for (const side of ["foe", "you"] as const) {
      const tank = this.tanks[side];
      if (tank.mode === "off") continue;
      busy = true;
      const age = now - tank.at;
      if (tank.mode === "in" && age >= LEAD + RUN_IN) this.tanks[side] = { mode: "on", at: tank.at };
      if (tank.mode === "out" && age >= RUN_OUT) {
        this.tanks[side] = { mode: "off", at: now };
        continue;
      }
      const mask = this.maskOf(side, now);
      if (!mask) continue;
      this.paintTank(side, now, mask);
      light.globalCompositeOperation = "lighter";
      light.drawImage(this.layer[side].canvas, 0, 0);
      light.globalCompositeOperation = "source-over";
      this.spawn(side, now, dt, mask);
    }
    busy = this.drawSparks(dt) || busy;
    busy = this.drawTitle(now, dt) || busy;
    return busy;
  }

  /** How much of a tank shows across its width: a soft front moving left to right. */
  private maskOf(side: TankSide, now: number): { front: number; entering: boolean; fade: number } | null {
    const tank = this.tanks[side];
    const age = now - tank.at;
    if (tank.mode === "on") return { front: 2, entering: true, fade: 1 };
    if (tank.mode === "in") {
      if (age < LEAD) return { front: -1, entering: true, fade: 1 };
      return { front: -SOFT + (1 + SOFT * 2) * easeOut(clamp01((age - LEAD) / RUN_IN)), entering: true, fade: 1 };
    }
    if (tank.mode === "out") {
      const k = clamp01(age / RUN_OUT);
      return { front: -SOFT + (1 + SOFT * 2) * easeInOut(k), entering: false, fade: 1 - k * 0.35 };
    }
    return null;
  }

  /** Visibility (0..1) at a part `u` across the tank. */
  private seen(mask: { front: number; entering: boolean; fade: number }, u: number) {
    const v = mask.entering ? clamp01((mask.front - u) / SOFT) : clamp01((u - mask.front) / SOFT);
    return v * mask.fade;
  }

  private box(side: TankSide) {
    const g = this.geo[side];
    const x0 = (g.x0 / 100) * this.w;
    const x1 = (g.x1 / 100) * this.w;
    const base = (g.base / 100) * this.h;
    const open = (g.open / 100) * this.h;
    const dir = open >= base ? 1 : -1;
    const depth = Math.abs(open - base);
    return { x0, x1, base, dir, depth, at: (v: number) => base + dir * depth * v };
  }

  private paintTank(side: TankSide, now: number, mask: { front: number; entering: boolean; fade: number }) {
    const ctx = this.layer[side];
    const tone = TONE[side];
    const { x0, x1, base, dir, depth, at } = this.box(side);
    const width = x1 - x0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Colour is laid down normally, so it stays deep red or blue on the light stone; only the white cores add light.
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const unit = Math.max(1, this.w / 412);

    // Measured on the LoR video (01/11, see skill be-sang): the blue pool is nearly empty inside (mean ~4 of 100) with a bright edge down
    // each wall (peak ~70) and a haze rising off the bottom (peak ~47, gone by ~45% of the depth); the red one is filled from the bottom
    // (peak ~92 falling to ~10 at the open end, mean ~50) with a wall only a little brighter than its fill.
    const spec = POOL[side];
    const haze = ctx.createLinearGradient(0, base, 0, at(spec.hazeDepth));
    spec.haze.forEach((alpha, i) => haze.addColorStop(i / (spec.haze.length - 1), rgba(tone.mid, alpha)));
    ctx.fillStyle = haze;
    ctx.fillRect(x0, Math.min(base, at(spec.hazeDepth)), width, depth * spec.hazeDepth);
    // The bottom runs on from the edge of the side's area with no gap: a band of the colour along it (chủ game 30/10).
    const [bankDepth, bankAlpha, bankLead] = tone.bank;
    const behind = base - dir * depth * bankLead;
    const bank = ctx.createLinearGradient(0, behind, 0, at(bankDepth));
    const span = depth * (bankDepth + bankLead);
    const lead = (depth * bankLead) / span;
    if (lead > 0) bank.addColorStop(0, rgba(tone.mid, 0));
    bank.addColorStop(lead, rgba(tone.mid, bankAlpha * spec.bank));
    bank.addColorStop(lead + (1 - lead) * 0.5, rgba(tone.mid, bankAlpha * spec.bank * 0.6));
    bank.addColorStop(1, rgba(tone.mid, 0));
    ctx.fillStyle = bank;
    ctx.fillRect(x0, Math.min(behind, at(bankDepth)), width, span);
    // The walls: a bright edge (about 2% of the width) with a soft glow (about 4.5%) fading toward the inside.
    for (const [edge, inward] of [
      [x0, 1],
      [x1, -1],
    ] as const) {
      const glow = ctx.createLinearGradient(edge, 0, edge + inward * width * 0.045, 0);
      glow.addColorStop(0, rgba(tone.mid, spec.wall));
      glow.addColorStop(0.45, rgba(tone.mid, spec.wall * 0.7));
      glow.addColorStop(1, rgba(tone.mid, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(Math.min(edge, edge + inward * width * 0.045), Math.min(base, at(0.95)), width * 0.045, depth * 0.95);
      const hot = ctx.createLinearGradient(edge, 0, edge + inward * width * 0.02, 0);
      hot.addColorStop(0, rgba(tone.mid, Math.min(1, spec.wall * 1.15)));
      hot.addColorStop(1, rgba(tone.mid, 0));
      ctx.fillStyle = hot;
      ctx.fillRect(Math.min(edge, edge + inward * width * 0.02), Math.min(base, at(0.95)), width * 0.02, depth * 0.95);
    }

    // The corners where each wall meets the bottom are the deepest (clips of 01/11).
    for (const cx of [x0, x0 + width]) {
      const r = width * 0.32;
      const g = ctx.createRadialGradient(cx, base, 0, cx, base, r);
      g.addColorStop(0, rgba(tone.mid, spec.corner));
      g.addColorStop(0.35, rgba(tone.mid, spec.corner * 0.45));
      g.addColorStop(1, rgba(tone.mid, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, Math.min(base, at(1)), r * 2, depth);
    }

    // Smoke wisps from both walls, drawn small and scaled up so their edges are soft.
    this.paintWisps(side, now, x0, width, at);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.smoke.canvas, 0, 0, this.w, this.h);

    // The rim: a bright edge down both walls and along the bottom, following the rounded corners of the court's rim so it
    // covers the gold (the bottom keeps to the court's edge; the top is open).
    {
      const lift = this.h * EDGE_DIP;
      const wall = base - dir * lift;
      const corner = width * EDGE_CORNER[side];
      const flat = base + 0.0025 * this.h * Math.sin(now * 1.3);
      const rim = (up: number) => {
        ctx.beginPath();
        ctx.moveTo(x0, at(0.92));
        ctx.lineTo(x0, wall + up);
        ctx.bezierCurveTo(x0 + corner * 0.2, wall + (flat - wall) * 0.55 + up, x0 + corner * 0.55, flat - (flat - wall) * 0.08 + up, x0 + corner, flat + up);
        ctx.bezierCurveTo(x0 + width * 0.35, base + up, x0 + width * 0.65, base + up, x1 - corner, flat + up);
        ctx.bezierCurveTo(x1 - corner * 0.55, flat - (flat - wall) * 0.08 + up, x1 - corner * 0.2, wall + (flat - wall) * 0.55 + up, x1, wall + up);
        ctx.lineTo(x1, at(0.92));
      };
      ctx.globalCompositeOperation = "source-over";
      for (const [up, line, alpha] of [
        [0, 20, 0.2],
        [-dir * 1, 11, 0.36],
        [-dir * 2, 5, 0.7],
      ] as const) {
        rim(up * unit);
        ctx.strokeStyle = rgba(tone.mid, alpha * spec.rim);
        ctx.lineWidth = line * unit;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "lighter";
      rim(-dir * 2 * unit);
      ctx.strokeStyle = rgba(tone.core, 0.3 * spec.rim);
      ctx.lineWidth = 2 * unit;
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    // The moving front: only the part it has passed shows (or, fading out, only the part it has not reached yet).
    if (mask.front < 1 + SOFT || !mask.entering || mask.fade < 1) {
      ctx.globalCompositeOperation = "destination-in";
      const veil = ctx.createLinearGradient(x0, 0, x1, 0);
      const stops = 12;
      for (let i = 0; i <= stops; i += 1) {
        const u = i / stops;
        veil.addColorStop(u, `rgba(0,0,0,${this.seen(mask, u).toFixed(3)})`);
      }
      ctx.fillStyle = veil;
      // Beyond the walls the gradient's end colours hold, which is all the glow out there needs.
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalCompositeOperation = "lighter";
    }

    ctx.globalCompositeOperation = "source-over";
  }

  /** The smoke wisps of a tank into the small smoke canvas (see `Wisp`). */
  private paintWisps(side: TankSide, now: number, x0: number, width: number, at: (v: number) => number) {
    const ctx = this.smoke;
    const scale = this.dpr * WISP_SCALE;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const unit = Math.max(1, this.w / 412);
    const tone = WISP_TONE[side];
    const tau = Math.PI * 2;
    const t = now * tone.speed;
    const steps = 30;
    WISPS[side].forEach((wisps, wall) => {
      const sign = wall === 0 ? 1 : -1;
      const from = wall === 0 ? x0 : x0 + width;
      wisps.forEach((w) => {
        const ph = w.phase;
        const vA = w.v + 0.07 * Math.sin(tau * w.sway * t + ph);
        const reach = w.reach + 0.05 * Math.sin(tau * w.sway * 1.7 * t + ph * 1.3);
        const vEnd = w.end + 0.02 * Math.sin(tau * w.sway * 0.8 * t + ph * 2.1);
        const bow = 0.06 * Math.sin(tau * w.sway * 1.3 * t + ph * 0.6);
        const life = 0.5 + 0.5 * Math.sin(tau * w.fade * t + ph * 0.7);
        const strength = w.alpha * tone.alpha * (0.22 + 0.78 * life * life);
        // The spine: a cubic from the wall into the tank that settles along the bottom.
        const p1u = reach * 0.38;
        const p1v = vA * 0.92 + bow;
        const p2u = reach * 0.7;
        const p2v = vEnd + (vA - vEnd) * 0.18;
        const upper: Array<[number, number]> = [];
        const lower: Array<[number, number]> = [];
        const spine: Array<[number, number, number]> = [];
        for (let k = 0; k <= steps; k += 1) {
          const s = k / steps;
          const m = 1 - s;
          const u = 3 * m * m * s * p1u + 3 * m * s * s * p2u + s * s * s * reach;
          let v = m * m * m * vA + 3 * m * m * s * p1v + 3 * m * s * s * p2v + s * s * s * vEnd;
          // A flutter running out along it, growing toward the loose end.
          v += 0.04 * s * Math.sin(tau * 1.2 * s - tau * w.roll * 0.7 * t + ph);
          // Its roll: the sheet turns slowly, thinning as it goes edge on (its edges never cross, which reads as string).
          const turn = 0.62 + 0.38 * Math.cos(tau * 0.85 * s - tau * w.roll * t + ph * 2);
          const half = (w.thick / 2) * Math.pow(m, 1.1) * (0.85 + 0.15 * Math.sin(tau * 2.2 * s - tau * 0.45 * t + ph)) + 0.004;
          const x = from + sign * width * u;
          upper.push([x, at(Math.max(0, v + half * turn))]);
          lower.push([x, at(Math.max(0, v - half * turn))]);
          spine.push([x, at(Math.max(0, v)), Math.abs(turn)]);
        }
        const tipX = from + sign * width * reach;
        const along = (rgb: Rgb, alpha: number) => {
          const gr = ctx.createLinearGradient(from, 0, tipX, 0);
          gr.addColorStop(0, rgba(rgb, alpha * 0.7));
          gr.addColorStop(0.18, rgba(rgb, alpha));
          gr.addColorStop(0.6, rgba(rgb, alpha * 0.6));
          gr.addColorStop(1, rgba(rgb, 0));
          return gr;
        };
        // The see-through body.
        ctx.beginPath();
        upper.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        for (let k = lower.length - 1; k >= 0; k -= 1) ctx.lineTo(lower[k][0], lower[k][1]);
        ctx.closePath();
        ctx.fillStyle = along(tone.body, 0.55 * strength);
        ctx.fill();
        // The edges, denser than the body: a soft wide stroke under a fine one.
        for (const edge of [upper, lower]) {
          for (const [wide, k] of [
            [7, 0.22],
            [3, 0.45],
          ] as const) {
            ctx.beginPath();
            edge.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.strokeStyle = along(tone.edge, k * strength);
            ctx.lineWidth = wide * unit;
            ctx.stroke();
          }
        }
        // Where it turns edge on, a short dense streak along the spine.
        for (let k = 1; k < spine.length; k += 1) {
          const edgeOn = 1 - Math.min(spine[k][2], spine[k - 1][2]);
          if (edgeOn < 0.5) continue;
          const fadeOut = 1 - k / spine.length;
          ctx.beginPath();
          ctx.moveTo(spine[k - 1][0], spine[k - 1][1]);
          ctx.lineTo(spine[k][0], spine[k][1]);
          ctx.strokeStyle = rgba(tone.edge, ((edgeOn - 0.5) / 0.26) * 0.35 * strength * fadeOut);
          ctx.lineWidth = 6 * unit;
          ctx.stroke();
        }
      });
    });
  }

  /** Sparkles: a few before the light comes in, many at its head as it runs, a few drifting while it stays. */
  private spawn(side: TankSide, now: number, dt: number, mask: { front: number; entering: boolean; fade: number }) {
    const { x0, x1, base, dir, depth } = this.box(side);
    const width = x1 - x0;
    const tank = this.tanks[side];
    const age = now - tank.at;
    const add = (x: number, y: number, up: number) =>
      this.sparks.push({
        side,
        x,
        y,
        vx: (this.random() - 0.5) * 18,
        vy: dir * up,
        age: 0,
        life: 0.5 + this.random() * 0.7,
        size: 0.7 + this.random() * 1.4,
      });
    let rate = 0;
    if (tank.mode === "in" && age < LEAD + RUN_IN) rate = 140;
    else if (tank.mode === "on") rate = 7;
    let n = rate * dt;
    while (n > 0) {
      if (n < 1 && this.random() > n) break;
      n -= 1;
      if (tank.mode === "in" && age < LEAD) add(x0 + this.random() * 4, base + dir * this.random() * depth * 0.8, 8 + this.random() * 20);
      else if (tank.mode === "in") {
        const hx = x0 + clamp01(mask.front) * width;
        add(hx + (this.random() - 0.5) * 16, base + dir * this.random() * depth * 0.3, 10 + this.random() * 30);
      } else {
        const onWall = this.random() < 0.5;
        add(onWall ? (this.random() < 0.5 ? x0 : x1) : x0 + this.random() * width, base + dir * this.random() * depth * (onWall ? 0.8 : 0.15), 6 + this.random() * 14);
      }
    }
  }

  private drawSparks(dt: number): boolean {
    const ctx = this.light;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    const unit = Math.max(1, this.w / 412);
    this.sparks = this.sparks.filter((spark) => {
      spark.age += dt;
      if (spark.age >= spark.life) return false;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      const tank = this.tanks[spark.side];
      if (tank.mode === "off") return false;
      const tone = TONE[spark.side];
      const k = 1 - spark.age / spark.life;
      const r = spark.size * unit;
      ctx.fillStyle = rgba(tone.mid, 0.25 * k);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(tone.core, 0.9 * k);
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
    const ctx = this.title;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const show = this.cue;
    if (!show) return false;
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
    const mid = this.geo.foe.open;
    const cx = (((this.geo.you.x0 + this.geo.you.x1) / 2) / 100) * this.w;
    const cy = ((mid + this.geo.you.open) / 2 / 100) * this.h;
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
        const line = ctx.createLinearGradient(-reach, 0, reach, 0);
        line.addColorStop(0, "rgba(255,214,120,0)");
        line.addColorStop(0.5, "rgba(255,236,170,0.95)");
        line.addColorStop(1, "rgba(255,214,120,0)");
        ctx.fillStyle = line;
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
  const titleRef = useRef<HTMLCanvasElement | null>(null);
  const artRef = useRef<TurnLightArt | null>(null);
  const wake = useRef<() => void>(() => undefined);
  const first = useRef(true);

  useLayoutEffect(() => {
    const light = lightRef.current;
    const title = titleRef.current;
    if (!light || !title) return;
    const art = new TurnLightArt(light, title);
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
      art.resize(box.width, box.height, Math.min(2, window.devicePixelRatio || 1));
      wake.current();
    };
    fit();
    const resize = new ResizeObserver(fit);
    if (light.parentElement) resize.observe(light.parentElement);
    return () => {
      resize.disconnect();
      if (raf) cancelAnimationFrame(raf);
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
      <canvas ref={titleRef} className="turn-title" aria-hidden="true" />
    </>
  );
}
