import { useEffect, useRef } from "react";
import { subscribeFx, type FxEvent } from "@/lib/spectacle";
import { fxKindOf, fxStyle, type FxKind, type FxStrike } from "@/lib/fx-kinds";

/*
 * Arena effects: a 2D canvas particle system that replaces the old default effects.
 * Every effect is built from the source card's kind (fire, water, storm, …) and strike style
 * (claw, blade, smash, pierce, magic, shot). Coordinates in events are % of the board.
 */

type Bit = "ember" | "drop" | "spark" | "wisp" | "mote" | "leaf" | "rock" | "glyph" | "dust";
type Pal = { core: string; mid: string; deep: string; bit: Bit };

const PAL: Record<FxKind, Pal> = {
  fire: { core: "#fff3b8", mid: "#ff8a1a", deep: "#c22a00", bit: "ember" },
  water: { core: "#eafcff", mid: "#3fb8ff", deep: "#0b4fa8", bit: "drop" },
  storm: { core: "#ffffff", mid: "#8fd8ff", deep: "#3a5cff", bit: "spark" },
  shadow: { core: "#f2dcff", mid: "#a24dff", deep: "#2a0a4a", bit: "wisp" },
  holy: { core: "#ffffff", mid: "#ffe27a", deep: "#ffae20", bit: "mote" },
  nature: { core: "#f2ffd0", mid: "#72e04a", deep: "#1f7a2a", bit: "leaf" },
  earth: { core: "#fff0d0", mid: "#d79a52", deep: "#6b4220", bit: "rock" },
  arcane: { core: "#ffffff", mid: "#c38bff", deep: "#3d2aa8", bit: "glyph" },
  steel: { core: "#ffffff", mid: "#ffd36a", deep: "#8f9aab", bit: "spark" },
  blood: { core: "#ffe0e0", mid: "#ff2d4a", deep: "#6a0010", bit: "drop" },
  beast: { core: "#fff3d6", mid: "#ffb347", deep: "#8a4a12", bit: "dust" },
};
const HEAL: Pal = { core: "#f0fff8", mid: "#4dffb0", deep: "#16a37a", bit: "mote" };
const DEATH: Pal = { core: "#fff6e0", mid: "#ffb020", deep: "#7a2a00", bit: "ember" };

type P = {
  x: number; y: number; vx: number; vy: number; ax: number; ay: number; drag: number;
  life: number; max: number; size: number; grow: number; color: string; shape: Bit | "dot" | "smoke" | "cross" | "streak";
  rot: number; vr: number; add: boolean;
};
type Ring = { x: number; y: number; r: number; vr: number; w: number; life: number; max: number; color: string; squash: number };
type Sigil = { x: number; y: number; r: number; life: number; max: number; pal: Pal; spin: number; squash: number };
type Pillar = { x: number; y: number; w: number; h: number; life: number; max: number; color: string };
type Mark = { kind: "blade" | "claw" | "crack" | "pierce" | "tracer" | "bolt"; x: number; y: number; ang: number; len: number; life: number; max: number; pal: Pal; seed: number; x2?: number; y2?: number };
type Orb = { x1: number; y1: number; x2: number; y2: number; t: number; dur: number; pal: Pal; done: () => void };
type Flash = { life: number; max: number; color: string; power: number };
type Aura = { id: string; x: number; y: number };

const MAX_P = 900;

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function ArenaFx() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const sprites = new Map<string, HTMLCanvasElement>();
    const sprite = (color: string, soft = false) => {
      const key = `${color}|${soft}`;
      let c = sprites.get(key);
      if (c) return c;
      c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      if (soft) {
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
      } else {
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.22, color);
        grad.addColorStop(0.6, color + "55");
        grad.addColorStop(1, "rgba(0,0,0,0)");
      }
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      sprites.set(key, c);
      return c;
    };

    const ps: P[] = [];
    const rings: Ring[] = [];
    const sigils: Sigil[] = [];
    const pillars: Pillar[] = [];
    const marks: Mark[] = [];
    const orbs: Orb[] = [];
    const flashes: Flash[] = [];
    let auras: Aura[] = [];
    const timers: number[] = [];
    let raf = 0;
    let last = 0;
    let clock = 0;

    const px = (x: number) => (x / 100) * W;
    const py = (y: number) => (y / 100) * H;
    const unit = () => Math.min(W, H) / 100;

    const add = (p: Partial<P> & { x: number; y: number }) => {
      if (ps.length >= MAX_P) ps.shift();
      ps.push({ vx: 0, vy: 0, ax: 0, ay: 0, drag: 0.9, life: 1, max: 1, size: 3, grow: 0, color: "#fff", shape: "dot", rot: rand(0, 6.28), vr: rand(-4, 4), add: true, ...p });
    };

    const bits = (x: number, y: number, pal: Pal, n: number, speed: number, opts: { up?: number; spread?: number; shape?: P["shape"]; life?: number; size?: number } = {}) => {
      const u = unit();
      const shape = opts.shape ?? pal.bit;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2);
        const s = rand(0.3, 1) * speed * u;
        const life = rand(0.5, 1) * (opts.life ?? 0.9);
        const solid = shape === "rock" || shape === "leaf" || shape === "wisp" || shape === "dust";
        add({
          x, y,
          vx: Math.cos(a) * s * (opts.spread ?? 1),
          vy: Math.sin(a) * s - (opts.up ?? 0) * u,
          ay: shape === "rock" ? 60 * u : shape === "ember" || shape === "mote" ? -18 * u : shape === "leaf" ? 8 * u : shape === "drop" || shape === "dust" ? 30 * u : 0,
          drag: shape === "spark" ? 0.86 : 0.92,
          life, max: life,
          size: (opts.size ?? 1) * (shape === "wisp" ? rand(7, 13) : shape === "rock" ? rand(1.4, 3) : shape === "leaf" ? rand(1.6, 2.8) : shape === "dust" ? rand(4, 8) : rand(1.2, 2.6)) * u,
          grow: shape === "wisp" || shape === "dust" ? 1.2 : 0,
          color: Math.random() < 0.35 ? pal.core : Math.random() < 0.7 ? pal.mid : pal.deep,
          shape,
          add: !solid,
        });
      }
    };

    const ring = (x: number, y: number, color: string, r0: number, speed: number, life: number, w = 3, squash = 0.6) => {
      const u = unit();
      rings.push({ x, y, r: r0 * u, vr: speed * u, w: w * u * 0.6, life, max: life, color, squash });
    };
    const sigil = (x: number, y: number, pal: Pal, r: number, life = 1.2) => {
      sigils.push({ x, y, r: r * unit(), life, max: life, pal, spin: rand(0, 6.28), squash: 0.5 });
    };
    const pillar = (x: number, y: number, color: string, w: number, h: number, life = 0.8) => {
      pillars.push({ x, y, w: w * unit(), h: h * unit(), life, max: life, color });
    };
    const flash = (color: string, power: number, life = 0.25) => flashes.push({ life, max: life, color, power });
    const mark = (m: Omit<Mark, "life" | "seed"> & { life?: number }) => marks.push({ ...m, life: m.life ?? m.max, seed: Math.random() * 1000 });
    const later = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(() => {
        fn();
        wake();
      }, ms));
    };

    // ---------- composed effects ----------

    const impact = (x: number, y: number, pal: Pal, power: number) => {
      const u = unit();
      add({ x, y, life: 0.2, max: 0.2, size: 8 * u * power, grow: 1.4, color: pal.mid, shape: "dot" });
      ring(x, y, pal.mid, 3, 70 * power, 0.35, 4 * power, 0.85);
      bits(x, y, pal, Math.round(16 * power), 55 * power, { shape: "spark", life: 0.45 });
      bits(x, y, pal, Math.round(10 * power), 30 * power, { life: 0.9 });
    };

    const strikeAt = (x1: number, y1: number, x2: number, y2: number, pal: Pal, strike: FxStrike) => {
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const u = unit();
      if (strike === "blade") {
        mark({ kind: "blade", x: x2, y: y2, ang: ang - 1.1, len: 13 * u, max: 0.38, pal });
        later(70, () => mark({ kind: "blade", x: x2, y: y2, ang: ang + 1.9, len: 11 * u, max: 0.34, pal }));
      } else if (strike === "claw") {
        mark({ kind: "claw", x: x2, y: y2, ang: ang + 0.7, len: 14 * u, max: 0.4, pal });
      } else if (strike === "smash") {
        mark({ kind: "crack", x: x2, y: y2, ang, len: 13 * u, max: 0.75, pal });
        bits(x2, y2 + 2 * u, PAL.earth, 10, 35, { shape: "rock", up: 25 });
        bits(x2, y2 + 3 * u, PAL.beast, 6, 12, { shape: "dust", life: 1.1 });
        ring(x2, y2 + 2 * u, pal.core, 4, 90, 0.4, 5, 0.45);
        shakeLight(0.6);
      } else if (strike === "pierce") {
        mark({ kind: "pierce", x: x2, y: y2, ang, len: 22 * u, max: 0.3, pal });
      }
      impact(x2, y2, pal, strike === "smash" ? 1.25 : 1);
    };

    let shakeAmt = 0;
    const shakeLight = (power: number) => {
      shakeAmt = Math.max(shakeAmt, power);
    };

    const attack = (e: Extract<FxEvent, { t: "beam" }>) => {
      const [kind, strike] = fxKindOf(e.card);
      const pal = PAL[kind];
      const x1 = px(e.x1), y1 = py(e.y1), x2 = px(e.x2), y2 = py(e.y2);
      if (strike === "magic") {
        sigil(x1, y1, pal, 9, 0.6);
        orbs.push({ x1, y1, x2, y2, t: 0, dur: 0.32, pal, done: () => { impact(x2, y2, pal, 1.15); sigil(x2, y2, pal, 7, 0.5); } });
        return;
      }
      if (strike === "shot") {
        add({ x: x1, y: y1, life: 0.14, max: 0.14, size: 4 * unit(), grow: 1, color: pal.mid, shape: "dot" });
        for (let i = 0; i < 3; i++) later(i * 70, () => {
          mark({ kind: "tracer", x: x1, y: y1, x2, y2, ang: 0, len: 0, max: 0.18, pal });
          impact(x2 + rand(-2, 2) * unit(), y2 + rand(-2, 2) * unit(), pal, 0.7);
        });
        return;
      }
      // melee: a streak rushes in, then the strike lands
      mark({ kind: "tracer", x: x1, y: y1, x2, y2, ang: 0, len: 0, max: 0.24, pal });
      later(220, () => strikeAt(x1, y1, x2, y2, pal, strike));
    };

    const hurt = (x: number, y: number, card: string | undefined, power: number) => {
      const pal = card ? PAL[fxKindOf(card)[0]] : PAL.blood;
      impact(x, y, pal, power);
      if (pal.bit === "spark" && card) mark({ kind: "bolt", x, y, ang: 0, len: 26 * unit(), max: 0.3, pal });
      flash(pal.mid, 0.08 * power, 0.18);
    };

    const kill = (x: number, y: number, card: string | undefined) => {
      const u = unit();
      const pal = card ? PAL[fxKindOf(card)[0]] : DEATH;
      add({ x, y, life: 0.28, max: 0.28, size: 11 * u, grow: 1.6, color: pal.core, shape: "dot" });
      ring(x, y, pal.core, 4, 110, 0.5, 6, 0.8);
      later(90, () => ring(x, y, pal.mid, 2, 70, 0.6, 4, 0.8));
      bits(x, y, pal, 30, 70, { shape: "spark", life: 0.6 });
      bits(x, y, PAL.earth, 14, 45, { shape: "rock", up: 20 });
      for (let i = 0; i < 8; i++) add({ x: x + rand(-4, 4) * u, y: y + rand(-4, 4) * u, vx: rand(-8, 8) * u, vy: rand(-14, -4) * u, drag: 0.94, life: 1.3, max: 1.3, size: rand(6, 11) * u, grow: 1.4, color: "#2a2230", shape: "smoke", add: false });
      later(250, () => {
        add({ x, y, vy: -26 * u, ax: 0, ay: -6 * u, drag: 0.97, life: 1.4, max: 1.4, size: 6 * u, grow: 0.3, color: "#bfe8ff", shape: "dot" });
        bits(x, y, { ...pal, bit: "mote" }, 10, 10, { up: 18, life: 1.3 });
      });
      flash(pal.mid, 0.22, 0.3);
      shakeLight(1);
    };

    const summon = (x: number, y: number, card: string | undefined, power: number) => {
      const [kind] = fxKindOf(card);
      const pal = PAL[kind];
      const u = unit();
      sigil(x, y + 4 * u, pal, 14 * power, 1.25);
      pillar(x, y + 6 * u, pal.mid, 13 * power, 70, 0.9);
      later(120, () => {
        ring(x, y + 5 * u, pal.core, 4, 80 * power, 0.55, 5, 0.45);
        bits(x, y + 4 * u, pal, Math.round(26 * power), 28, { up: 30, life: 1.2 });
        add({ x, y, life: 0.32, max: 0.32, size: 9 * u * power, grow: 1.3, color: pal.mid, shape: "dot" });
      });
      if (kind === "storm") later(80, () => mark({ kind: "bolt", x, y, ang: 0, len: 40 * u, max: 0.35, pal }));
      flash(pal.mid, 0.1, 0.3);
    };

    const heal = (x: number, y: number, power: number) => {
      const u = unit();
      sigil(x, y + 4 * u, HEAL, 10 * power, 1);
      ring(x, y, HEAL.mid, 3, 40, 0.6, 3, 0.55);
      for (let i = 0; i < Math.round(8 * power); i++) {
        add({ x: x + rand(-7, 7) * u, y: y + rand(-2, 6) * u, vy: rand(-22, -12) * u, drag: 0.96, life: rand(0.8, 1.2), max: 1.2, size: rand(2.2, 3.6) * u, color: Math.random() < 0.5 ? HEAL.core : HEAL.mid, shape: "cross" });
      }
      bits(x, y + 2 * u, HEAL, Math.round(12 * power), 12, { up: 22, life: 1.1 });
      pillar(x, y + 5 * u, HEAL.mid, 9 * power, 40, 0.7);
    };

    const spellCenter = (x: number, y: number, card: string | undefined, power: number) => {
      const pal = PAL[fxKindOf(card ?? "hap-thu-ma-phap")[0]];
      sigil(x, y, pal, 22 * power, 1.3);
      later(200, () => {
        ring(x, y, pal.core, 6, 120 * power, 0.6, 6, 0.6);
        bits(x, y, pal, 30, 50, { life: 1 });
        flash(pal.mid, 0.16, 0.35);
      });
    };

    // Sacrifice summon: a blood sigil opens on the slot, embers spiral up, a pillar of hellfire falls and slams
    // into a shockwave as the monster arrives.
    const rite = (x: number, y: number) => {
      const u = unit();
      const fire = PAL.fire;
      const blood = PAL.blood;
      flash("#5a0008", 0.35, 0.9);
      sigil(x, y + 3 * u, blood, 30, 2.4);
      later(120, () => sigil(x, y + 3 * u, fire, 18, 2.1));
      ring(x, y + 3 * u, blood.mid, 34, -18, 0.9, 3, 0.45);
      for (let i = 0; i < 26; i++) {
        later(i * 28, () => {
          const a = i * 0.9;
          const r = rand(10, 26) * u;
          add({
            x: x + Math.cos(a) * r,
            y: y + 3 * u + Math.sin(a) * r * 0.45,
            vx: -Math.sin(a) * 14 * u,
            vy: rand(-46, -26) * u,
            ay: -10 * u,
            drag: 0.95,
            life: rand(0.9, 1.4),
            max: 1.4,
            size: rand(1.6, 3) * u,
            color: Math.random() < 0.4 ? fire.core : Math.random() < 0.7 ? fire.mid : blood.mid,
            shape: "ember",
          });
        });
      }
      later(300, () => ring(x, y + 3 * u, fire.mid, 26, -22, 0.6, 2, 0.45));
      later(620, () => {
        pillar(x, y + 4 * u, blood.mid, 22, 110, 0.9);
        pillar(x, y + 4 * u, fire.core, 8, 110, 0.75);
        flash(fire.mid, 0.18, 0.25);
      });
      later(900, () => {
        flash("#fff1d0", 0.42, 0.35);
        shakeLight(1.3);
        ring(x, y + 3 * u, fire.core, 6, 150, 0.55, 7, 0.42);
        ring(x, y + 3 * u, blood.mid, 4, 95, 0.8, 5, 0.42);
        bits(x, y, fire, 46, 80, { shape: "spark", life: 0.6 });
        bits(x, y + 2 * u, fire, 30, 30, { up: 28, life: 1.3 });
        bits(x, y + 4 * u, PAL.beast, 12, 18, { shape: "dust", life: 1.4 });
        sigil(x, y + 3 * u, fire, 24, 1.1);
      });
      later(1150, () => bits(x, y + 2 * u, blood, 20, 16, { up: 34, life: 1.6 }));
    };

    const onEvent = (e: FxEvent) => {
      if (e.t === "rite") {
        if (!reduced) {
          rite(px(e.x), py(e.y));
          wake();
        }
        return;
      }
      if (reduced || fxStyle() !== "new") return;
      if (e.t === "ailments") {
        auras = e.marks.map((m) => ({ id: m.id, x: m.x, y: m.y }));
      } else if (e.t === "beam") {
        attack(e);
      } else if (e.t === "burst") {
        const x = px(e.x), y = py(e.y);
        if (e.act === "kill") kill(x, y, e.card);
        else if (e.act === "heal" || e.act === "healSpell") heal(x, y, e.power);
        else if (e.act === "summon") summon(x, y, e.card, e.power);
        else hurt(x, y, e.card, e.power);
      } else if (e.t === "ring") {
        const x = px(e.x), y = py(e.y);
        if (e.act === "summon") summon(x, y, e.card, e.power);
        else if (e.act === "heal" || e.act === "healSpell") heal(x, y, Math.min(1.2, e.power));
        else if (e.spot === "center") spellCenter(x, y, e.card, Math.min(1.4, e.power));
        else hurt(x, y, e.card, e.power);
      } else if (e.t === "shake") {
        shakeLight(e.power);
        flash("#ff3030", 0.12, 0.3);
      } else return;
      wake();
    };
    const unsub = subscribeFx(onEvent);

    // ---------- drawing ----------

    const drawSigil = (s: Sigil, k: number) => {
      const a = Math.min(1, (1 - k) * 4) * Math.min(1, k * 2.2);
      const r = s.r * (0.75 + 0.25 * Math.min(1, (1 - k) * 3));
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(1, s.squash);
      ctx.rotate(s.spin + clock * 1.6);
      ctx.globalAlpha = a;
      ctx.strokeStyle = s.pal.mid;
      ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = r * 0.025;
      ctx.strokeStyle = s.pal.core;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 24; i++) {
        const t = (i / 24) * Math.PI * 2;
        const r1 = r * (i % 2 ? 0.86 : 0.9);
        ctx.beginPath(); ctx.moveTo(Math.cos(t) * r1, Math.sin(t) * r1); ctx.lineTo(Math.cos(t) * r * 0.98, Math.sin(t) * r * 0.98); ctx.stroke();
      }
      ctx.lineWidth = r * 0.035;
      ctx.strokeStyle = s.pal.mid;
      for (const off of [0, Math.PI]) {
        ctx.beginPath();
        for (let i = 0; i <= 3; i++) {
          const t = off + (i / 3) * Math.PI * 2 - Math.PI / 2;
          const X = Math.cos(t) * r * 0.78, Y = Math.sin(t) * r * 0.78;
          if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        ctx.stroke();
      }
      ctx.rotate(-clock * 3.2);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = a * 0.55;
      const glow = sprite(s.pal.mid, true);
      ctx.drawImage(glow, s.x - r * 1.2, s.y - r * 1.2 * s.squash, r * 2.4, r * 2.4 * s.squash);
    };

    const drawMark = (m: Mark, k: number) => {
      const p = 1 - k; // progress 0..1
      const a = Math.min(1, k * 2.5);
      ctx.save();
      ctx.lineCap = "round";
      if (m.kind === "blade") {
        const sweep = 2.2 * Math.min(1, p * 2.4);
        ctx.translate(m.x, m.y);
        ctx.rotate(m.ang);
        for (const [w, c, al] of [[m.len * 0.32, m.pal.mid, 0.45], [m.len * 0.12, m.pal.core, 1]] as const) {
          ctx.globalAlpha = a * al;
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(0, 0, m.len, -1.1, -1.1 + sweep);
          ctx.stroke();
        }
      } else if (m.kind === "claw") {
        const reveal = Math.min(1, p * 3);
        ctx.translate(m.x, m.y);
        ctx.rotate(m.ang);
        for (let i = -1; i <= 1; i++) {
          const off = i * m.len * 0.28;
          for (const [w, c, al] of [[m.len * 0.16, m.pal.mid, 0.5], [m.len * 0.06, m.pal.core, 1]] as const) {
            ctx.globalAlpha = a * al;
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(-m.len * 0.6, off);
            ctx.lineTo(-m.len * 0.6 + m.len * 1.2 * reveal, off + m.len * 0.1);
            ctx.stroke();
          }
        }
      } else if (m.kind === "crack") {
        ctx.translate(m.x, m.y);
        ctx.globalAlpha = a;
        let seed = m.seed;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        for (let i = 0; i < 9; i++) {
          const t = (i / 9) * Math.PI * 2 + rnd() * 0.5;
          let X = 0, Y = 0;
          ctx.strokeStyle = m.pal.core;
          ctx.lineWidth = m.len * 0.06;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const len = m.len * (0.6 + rnd() * 0.6) * Math.min(1, p * 4);
          for (let s = 1; s <= 4; s++) {
            X = Math.cos(t + (rnd() - 0.5) * 0.6) * len * (s / 4);
            Y = Math.sin(t + (rnd() - 0.5) * 0.6) * len * (s / 4) * 0.6;
            ctx.lineTo(X, Y);
          }
          ctx.stroke();
        }
      } else if (m.kind === "pierce") {
        ctx.translate(m.x, m.y);
        ctx.rotate(m.ang);
        const reach = m.len * Math.min(1, p * 3);
        for (const [w, c, al] of [[m.len * 0.12, m.pal.mid, 0.45], [m.len * 0.04, m.pal.core, 1]] as const) {
          ctx.globalAlpha = a * al;
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(-m.len * 0.5, 0);
          ctx.lineTo(-m.len * 0.5 + reach, 0);
          ctx.stroke();
        }
      } else if (m.kind === "tracer" && m.x2 != null && m.y2 != null) {
        const head = Math.min(1, p * 1.6);
        const tail = Math.max(0, head - 0.45);
        const hx = m.x + (m.x2 - m.x) * head, hy = m.y + (m.y2 - m.y) * head;
        const tx = m.x + (m.x2 - m.x) * tail, ty = m.y + (m.y2 - m.y) * tail;
        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, m.pal.core);
        for (const [w, al] of [[unit() * 4.5, 0.4], [unit() * 1.6, 1]] as const) {
          ctx.globalAlpha = a * al;
          ctx.strokeStyle = al === 1 ? grad : m.pal.mid;
          ctx.lineWidth = w;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        }
      } else if (m.kind === "bolt") {
        let seed = Math.floor(clock * 30) + m.seed;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        const top = m.y - m.len;
        for (const [w, c, al] of [[unit() * 3, m.pal.mid, 0.5], [unit() * 1.1, "#ffffff", 1]] as const) {
          ctx.globalAlpha = a * al;
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(m.x + (rnd() - 0.5) * m.len * 0.3, top);
          for (let s = 1; s <= 7; s++) ctx.lineTo(m.x + (rnd() - 0.5) * m.len * 0.22 * (1 - s / 8), top + (m.len * s) / 7);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawP = (p: P) => {
      const k = p.life / p.max;
      const s = p.size * (1 + p.grow * (1 - k));
      ctx.globalAlpha = Math.min(1, k * 1.8) * (p.shape === "smoke" ? 0.45 : p.shape === "dust" ? 0.35 : p.shape === "wisp" ? 0.55 : 1);
      ctx.globalCompositeOperation = p.add ? "lighter" : "source-over";
      switch (p.shape) {
        case "spark":
        case "streak": {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, s * 0.45);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
          ctx.stroke();
          break;
        }
        case "rock": {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.moveTo(-s, -s * 0.6); ctx.lineTo(s * 0.8, -s * 0.8); ctx.lineTo(s, s * 0.5); ctx.lineTo(-s * 0.4, s); ctx.closePath(); ctx.fill();
          ctx.restore();
          break;
        }
        case "leaf": {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          break;
        }
        case "glyph": {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, s * 0.3);
          ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0); ctx.closePath(); ctx.stroke();
          ctx.restore();
          break;
        }
        case "cross": {
          ctx.save(); ctx.translate(p.x, p.y);
          ctx.drawImage(sprite(p.color), -s * 1.6, -s * 1.6, s * 3.2, s * 3.2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-s * 0.18, -s * 0.7, s * 0.36, s * 1.4);
          ctx.fillRect(-s * 0.7, -s * 0.18, s * 1.4, s * 0.36);
          ctx.restore();
          break;
        }
        case "smoke":
        case "wisp":
        case "dust": {
          ctx.drawImage(sprite(p.color, true), p.x - s, p.y - s, s * 2, s * 2);
          break;
        }
        default: {
          const flick = p.shape === "ember" ? 0.75 + 0.25 * Math.sin(clock * 40 + p.rot * 10) : 1;
          ctx.drawImage(sprite(p.color), p.x - s * flick, p.y - s * flick, s * 2 * flick, s * 2 * flick);
        }
      }
    };

    const busy = () => ps.length || rings.length || sigils.length || pillars.length || marks.length || orbs.length || flashes.length || auras.length || shakeAmt > 0.01;

    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      clock += dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      shakeAmt *= Math.pow(0.02, dt);
      const sx = shakeAmt > 0.01 ? (Math.random() - 0.5) * shakeAmt * unit() * 2 : 0;
      const sy = shakeAmt > 0.01 ? (Math.random() - 0.5) * shakeAmt * unit() * 2 : 0;
      ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);

      // persistent ailment auras: slow sickly swirl with dripping motes
      if (auras.length) {
        ctx.globalCompositeOperation = "lighter";
        for (const a of auras) {
          const x = px(a.x), y = py(a.y), u = unit();
          for (let i = 0; i < 3; i++) {
            const t = clock * 1.4 + (i * Math.PI * 2) / 3;
            ctx.globalAlpha = 0.75;
            const s = 3.2 * u;
            ctx.drawImage(sprite("#86e27a"), x + Math.cos(t) * 8 * u - s, y + Math.sin(t) * 3.2 * u + 6 * u - s, s * 2, s * 2);
          }
          if (Math.random() < dt * 3) add({ x: x + rand(-6, 6) * u, y: y + rand(-4, 4) * u, vy: 6 * u, ay: 10 * u, drag: 0.97, life: 1, max: 1, size: 1.6 * u, color: "#7dd65a", shape: "drop" });
        }
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = pillars.length - 1; i >= 0; i--) {
        const p = pillars[i];
        p.life -= dt;
        if (p.life <= 0) { pillars.splice(i, 1); continue; }
        const k = p.life / p.max;
        const grow = Math.min(1, (1 - k) * 5);
        const g = ctx.createLinearGradient(0, p.y - p.h * grow, 0, p.y);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.7, p.color);
        g.addColorStop(1, "#ffffff");
        ctx.globalAlpha = k * 0.55;
        ctx.fillStyle = g;
        const w = p.w * (0.4 + 0.6 * k);
        ctx.fillRect(p.x - w / 2, p.y - p.h * grow, w, p.h * grow);
        ctx.globalAlpha = k * 0.9;
        ctx.fillRect(p.x - w / 8, p.y - p.h * grow, w / 4, p.h * grow);
      }
      for (let i = sigils.length - 1; i >= 0; i--) {
        const s = sigils[i];
        s.life -= dt;
        if (s.life <= 0) { sigils.splice(i, 1); continue; }
        drawSigil(s, s.life / s.max);
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.life -= dt;
        if (r.life <= 0) { rings.splice(i, 1); continue; }
        const k = r.life / r.max;
        r.r += r.vr * dt;
        ctx.globalAlpha = k;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = Math.max(0.5, r.w * k);
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * r.squash, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.t += dt;
        const k = Math.min(1, o.t / o.dur);
        const e = k * k * (3 - 2 * k);
        const x = o.x1 + (o.x2 - o.x1) * e;
        const y = o.y1 + (o.y2 - o.y1) * e - Math.sin(k * Math.PI) * unit() * 8;
        const s = unit() * 7;
        ctx.globalAlpha = 1;
        ctx.drawImage(sprite(o.pal.mid), x - s, y - s, s * 2, s * 2);
        if (Math.random() < 0.9) add({ x, y, vx: rand(-6, 6) * unit(), vy: rand(-6, 6) * unit(), life: 0.4, max: 0.4, size: unit() * 2.2, color: o.pal.core, shape: o.pal.bit === "glyph" ? "glyph" : "dot" });
        if (k >= 1) { orbs.splice(i, 1); o.done(); }
      }
      for (let i = marks.length - 1; i >= 0; i--) {
        const m = marks[i];
        m.life -= dt;
        if (m.life <= 0) { marks.splice(i, 1); continue; }
        ctx.globalCompositeOperation = "lighter";
        drawMark(m, m.life / m.max);
      }
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life -= dt;
        if (p.life <= 0) { ps.splice(i, 1); continue; }
        const f = Math.pow(p.drag, dt * 60);
        p.vx = (p.vx + p.ax * dt) * f;
        p.vy = (p.vy + p.ay * dt) * f;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        drawP(p);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= dt;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (f.life / f.max) * f.power;
        ctx.fillStyle = f.color;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      canvas.style.transform = "";
      if (busy()) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        last = 0;
        ctx.clearRect(0, 0, W, H);
      }
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    return () => {
      unsub();
      resize.disconnect();
      for (const t of timers) window.clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="arena-fx" aria-hidden />;
}
