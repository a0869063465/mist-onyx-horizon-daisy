import { useEffect, useRef, useState, type CSSProperties } from "react";
import { tr } from "@/lib/i18n";
import { playEnd } from "@/lib/sfx";

/**
 * The end of a match (chủ game 22/10, after LoR's nexus falling, T10), all drawn here: a pink-white flash on the
 * losing side's HP, a red whirlwind around it, the HP bursting into crystal shards, the screen going black with red
 * rays drawn into its middle, then a metal crest with blue crystal wings and CHIẾN THẮNG; a loss is red, with THẤT BẠI
 * and no wings. A tap skips ahead; once the crest is up, a tap goes on.
 */
const VORTEX_AT = 0.12;
const CRACK_AT = 0.85;
const SHATTER_AT = 1.3;
const DARK_AT = 1.55;
const RAYS_AT = 1.7;
const CREST_AT = 2.45;

type Shard = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; pts: Array<[number, number]>; life: number; max: number; hue: string; deep: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
type Swirl = { a: number; r: number; w: number; life: number; max: number; size: number };
type Ray = { a: number; from: number; len: number; width: number; wait: number };

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function EndScene({ win, at, tone, onDone }: { win: boolean; at: { x: number; y: number }; tone: "red" | "blue"; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [crest, setCrest] = useState(false);
  const [ready, setReady] = useState(false);
  const skip = useRef<() => void>(() => undefined);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const R = Math.min(W, H) * 0.075;
    const cx = W / 2;
    const cy = H * 0.42;
    const shards: Shard[] = [];
    const sparks: Spark[] = [];
    const swirls: Swirl[] = [];
    const rays: Ray[] = Array.from({ length: 36 }, () => ({ a: rand(0, Math.PI * 2), from: Math.hypot(W, H) * rand(0.55, 0.85), len: rand(90, 240), width: rand(1.2, 3.4), wait: rand(0, 0.32) }));
    const crystal = tone === "red" ? { hue: "#ff9aa8", deep: "#9a0f22" } : { hue: "#bfe6ff", deep: "#1c4fb8" };
    let start = 0;
    let last = 0;
    let raf = 0;
    let broken = false;
    let converged = false;
    let shown = false;
    let jump = 0;
    const timers: number[] = [];

    playEnd("flash");
    timers.push(window.setTimeout(() => playEnd("vortex"), VORTEX_AT * 1000));
    timers.push(window.setTimeout(() => playEnd("shatter"), SHATTER_AT * 1000));
    timers.push(window.setTimeout(() => playEnd("suck"), RAYS_AT * 1000));

    const glow = (x: number, y: number, r: number, inner: string, outer: string, alpha: number) => {
      if (alpha <= 0 || r <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, inner);
      g.addColorStop(1, outer);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const shatter = () => {
      broken = true;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + rand(-0.15, 0.15);
        const speed = rand(260, 760);
        const size = R * rand(0.22, 0.62);
        const n = Math.random() < 0.5 ? 3 : 4;
        const pts: Array<[number, number]> = Array.from({ length: n }, (_, k) => {
          const t = (k / n) * Math.PI * 2 + rand(-0.4, 0.4);
          const s = size * rand(0.55, 1);
          return [Math.cos(t) * s, Math.sin(t) * s * rand(0.5, 1.4)];
        });
        shards.push({ x: at.x, y: at.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - rand(0, 120), rot: rand(0, 6.28), vr: rand(-9, 9), pts, life: rand(1, 1.6), max: 1.6, hue: crystal.hue, deep: crystal.deep });
      }
      for (let i = 0; i < 46; i++) {
        const a = rand(0, Math.PI * 2);
        const speed = rand(150, 820);
        sparks.push({ x: at.x, y: at.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: rand(0.35, 0.9), max: 0.9, size: rand(1.4, 3.6), color: Math.random() < 0.5 ? "#ffffff" : tone === "red" ? "#ffb0b8" : "#bfe6ff" });
      }
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000 + jump;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      // The screen goes black around the end.
      const dark = Math.min(1, Math.max(0, (t - DARK_AT) / 0.5)) * 0.94;
      if (dark > 0) {
        ctx.globalAlpha = dark;
        ctx.fillStyle = "#04040b";
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = "lighter";

      // A pink-white flash bursting from the HP over the whole screen.
      if (t < 0.5) {
        const k = t < 0.07 ? t / 0.07 : Math.max(0, 1 - (t - 0.07) / 0.43);
        ctx.globalAlpha = k * 0.55;
        ctx.fillStyle = "#ffd9ef";
        ctx.fillRect(0, 0, W, H);
        glow(at.x, at.y, R * 8, "rgba(255,255,255,1)", "rgba(255,110,190,0)", k);
        glow(at.x, at.y, R * 2.2, "rgba(255,255,255,1)", "rgba(255,200,235,0)", k);
      }

      // A red whirlwind closing in around it.
      if (t >= VORTEX_AT && t < DARK_AT + 0.2) {
        const k = Math.min(1, (t - VORTEX_AT) / (SHATTER_AT - VORTEX_AT));
        const fade = t < SHATTER_AT ? 1 : Math.max(0, 1 - (t - SHATTER_AT) / 0.45);
        const spin = Math.PI * 2 * (0.6 * (t - VORTEX_AT) + 1.7 * (t - VORTEX_AT) ** 2);
        // a dark red eye under the whirl
        ctx.globalCompositeOperation = "source-over";
        glow(at.x, at.y, R * (3.4 - 0.8 * k), "rgba(90,0,14,0.7)", "rgba(60,0,10,0)", 0.75 * k * fade);
        ctx.globalCompositeOperation = "lighter";
        glow(at.x, at.y, R * (2.4 + k), "rgba(255,60,80,0.9)", "rgba(120,0,20,0)", 0.6 * k * fade);
        ctx.lineCap = "butt";
        // spiral arms: thick and bright at the outside, thin as they curl in to the middle
        const arms = 7;
        const steps = 16;
        for (let i = 0; i < arms; i++) {
          const base = spin + (i / arms) * Math.PI * 2;
          const r0 = R * (3.6 - 2 * k) * (1 + 0.06 * Math.sin(t * 11 + i * 2));
          for (let s = 0; s < steps; s++) {
            const u0 = s / steps;
            const u1 = (s + 1) / steps;
            const a0 = base + u0 * 2.4;
            const a1 = base + Math.min(1, u1 + 0.004) * 2.4;
            const ra = r0 * (1 - 0.6 * u0);
            const rb = r0 * (1 - 0.6 * u1);
            const taper = 1 - u0;
            for (const [width, color, alpha] of [[R * 0.62, "rgba(210,10,40,1)", 0.42], [R * 0.2, "rgba(255,175,190,1)", 0.85]] as const) {
              ctx.globalAlpha = alpha * fade * (0.35 + 0.65 * k) * taper;
              ctx.strokeStyle = color;
              ctx.lineWidth = Math.max(0.8, width * taper * (0.55 + 0.45 * k));
              ctx.beginPath();
              ctx.moveTo(at.x + Math.cos(a0) * ra, at.y + Math.sin(a0) * ra);
              ctx.lineTo(at.x + Math.cos(a1) * rb, at.y + Math.sin(a1) * rb);
              ctx.stroke();
            }
          }
        }
        if (t < SHATTER_AT) {
          for (let i = 0; i < 9; i++) swirls.push({ a: rand(0, Math.PI * 2), r: R * rand(3.4, 5.6), w: rand(6, 12), life: rand(0.5, 0.9), max: 0.9, size: rand(1.6, 3.4) });
        }
      }
      for (let i = swirls.length - 1; i >= 0; i--) {
        const s = swirls[i];
        s.life -= dt;
        if (s.life <= 0) {
          swirls.splice(i, 1);
          continue;
        }
        s.a += s.w * dt;
        s.r = Math.max(R * 0.4, s.r - R * 4.2 * dt);
        const x = at.x + Math.cos(s.a) * s.r;
        const y = at.y + Math.sin(s.a) * s.r;
        ctx.globalAlpha = Math.min(1, s.life / s.max * 1.6);
        ctx.fillStyle = Math.random() < 0.3 ? "#ffd0d6" : "#ff3048";
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // The HP cracks, white-hot, then bursts.
      if (t >= CRACK_AT && t < SHATTER_AT) {
        const k = (t - CRACK_AT) / (SHATTER_AT - CRACK_AT);
        glow(at.x, at.y, R * (1 + k * 0.6), "rgba(255,255,255,1)", "rgba(255,90,120,0)", 0.5 + 0.5 * k);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 6; i++) {
          let a = (i / 6) * Math.PI * 2 + i * 0.7;
          let x = at.x;
          let y = at.y;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          const steps = 2 + Math.round(k * 3);
          for (let s = 0; s < steps; s++) {
            a += rand(-0.5, 0.5);
            x += Math.cos(a) * R * 0.3;
            y += Math.sin(a) * R * 0.3;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      if (t >= SHATTER_AT && !broken) shatter();
      if (t >= SHATTER_AT && t < SHATTER_AT + 0.45) {
        const k = (t - SHATTER_AT) / 0.45;
        glow(at.x, at.y, R * (2 + 9 * k), "rgba(255,255,255,0.9)", "rgba(255,255,255,0)", (1 - k) * 0.9);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath();
        ctx.arc(at.x, at.y, R * (1.2 + 7 * k), 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.life -= dt;
        if (s.life <= 0) {
          shards.splice(i, 1);
          continue;
        }
        s.vx *= Math.pow(0.35, dt);
        s.vy = s.vy * Math.pow(0.35, dt) + 260 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vr * dt;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = Math.min(1, (s.life / s.max) * 1.4);
        const g = ctx.createLinearGradient(-R * 0.5, -R * 0.5, R * 0.5, R * 0.5);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.35, s.hue);
        g.addColorStop(1, s.deep);
        ctx.fillStyle = g;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        s.pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.globalCompositeOperation = "lighter";
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= dt;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        p.vx *= Math.pow(0.12, dt);
        p.vy *= Math.pow(0.12, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Red rays drawn into the middle of the dark screen.
      if (t >= RAYS_AT && t < CREST_AT + 0.1) {
        ctx.lineCap = "round";
        for (const ray of rays) {
          const p = Math.min(1, Math.max(0, (t - RAYS_AT - ray.wait) / (CREST_AT - RAYS_AT - ray.wait)));
          if (p <= 0 || p >= 1) continue;
          const d = ray.from * (1 - p * p);
          const len = ray.len * (1 - p * 0.5);
          const x1 = cx + Math.cos(ray.a) * d;
          const y1 = cy + Math.sin(ray.a) * d;
          const x2 = cx + Math.cos(ray.a) * (d + len);
          const y2 = cy + Math.sin(ray.a) * (d + len);
          const g = ctx.createLinearGradient(x1, y1, x2, y2);
          g.addColorStop(0, "rgba(255,230,230,1)");
          g.addColorStop(0.3, "rgba(255,40,60,0.9)");
          g.addColorStop(1, "rgba(160,0,20,0)");
          ctx.globalAlpha = Math.min(1, p * 3);
          ctx.strokeStyle = g;
          ctx.lineWidth = ray.width;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        const k = (t - RAYS_AT) / (CREST_AT - RAYS_AT);
        glow(cx, cy, R * (0.6 + 2.4 * k), "rgba(255,90,100,1)", "rgba(180,0,30,0)", 0.35 + 0.5 * k);
      }
      if (t >= CREST_AT && !converged) {
        converged = true;
        playEnd(win ? "win" : "lose");
      }
      if (t >= CREST_AT && t < CREST_AT + 0.5) {
        const k = (t - CREST_AT) / 0.5;
        glow(cx, cy, R * (3 + 10 * k), win ? "rgba(255,255,255,1)" : "rgba(255,220,220,1)", win ? "rgba(120,200,255,0)" : "rgba(255,40,60,0)", (1 - k) * 0.95);
      }
      // Behind the crest: a calm glow with motes rising.
      if (t >= CREST_AT) {
        const k = Math.min(1, (t - CREST_AT) / 0.6);
        glow(cx, cy, R * 5.5, win ? "rgba(70,150,255,0.55)" : "rgba(220,30,50,0.55)", "rgba(0,0,0,0)", k * (0.8 + 0.2 * Math.sin(t * 2)));
        if (Math.random() < 0.5) sparks.push({ x: cx + rand(-W * 0.4, W * 0.4), y: cy + rand(R * 1, R * 5), vx: rand(-10, 10), vy: rand(-90, -40), life: rand(1.2, 2.2), max: 2.2, size: rand(1, 2.4), color: win ? "#9fdcff" : "#ff8a96" });
        if (!shown) {
          shown = true;
          setCrest(true);
          timers.push(window.setTimeout(() => setReady(true), 900));
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    skip.current = () => {
      // Straight to the crest.
      if (!shown) {
        jump = Math.max(jump, CREST_AT - (performance.now() - start) / 1000);
        if (!broken) broken = true;
        swirls.length = 0;
      }
    };
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [at.x, at.y, tone, win]);

  return (
    <div
      className={`es${win ? " is-win" : " is-lose"}`}
      role="dialog"
      aria-label={tr(win ? "CHIẾN THẮNG" : "THẤT BẠI")}
      onClick={() => {
        if (ready) onDone();
        else skip.current();
      }}
    >
      <canvas ref={ref} className="es-canvas" aria-hidden="true" />
      {crest ? (
        <div className="es-crest">
          {win ? <Wings /> : null}
          <Crest win={win} />
          <h2 className="es-title">{tr(win ? "CHIẾN THẮNG" : "THẤT BẠI")}</h2>
          {ready ? <p className="es-hint">{tr("Chạm để tiếp tục")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** The metal crest: a steel ring with a crown of spikes, a dark disc and a crystal at its heart. */
function Crest({ win }: { win: boolean }) {
  const disc = win ? ["#3a7fe6", "#0c2154"] : ["#c0283a", "#3c060e"];
  const gem = win ? ["#ffffff", "#9fe4ff", "#2477e8"] : ["#ffffff", "#ff9aa6", "#b0102a"];
  return (
    <svg className="es-medal" viewBox="-80 -86 160 160" aria-hidden="true">
      <defs>
        <linearGradient id="es-steel" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor={win ? "#c9d4e4" : "#e4c4c8"} />
          <stop offset="0.6" stopColor={win ? "#6d7c94" : "#7a4a52"} />
          <stop offset="1" stopColor={win ? "#e6edf7" : "#f0d6da"} />
        </linearGradient>
        <radialGradient id="es-disc" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={disc[0]} />
          <stop offset="1" stopColor={disc[1]} />
        </radialGradient>
        <linearGradient id="es-gem" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={gem[0]} />
          <stop offset="0.4" stopColor={gem[1]} />
          <stop offset="1" stopColor={gem[2]} />
        </linearGradient>
      </defs>
      <g className="es-spikes" fill="url(#es-steel)" stroke="#2b3240" strokeWidth="1.2">
        <path d="M0 -84 L9 -56 L-9 -56 Z" />
        <path d="M-34 -74 L-17 -52 L-33 -46 Z" />
        <path d="M34 -74 L17 -52 L33 -46 Z" />
      </g>
      <circle r="58" fill="none" stroke="url(#es-steel)" strokeWidth="12" />
      <circle r="64" fill="none" stroke="#2b3240" strokeWidth="1.5" />
      <circle r="51.5" fill="none" stroke="#2b3240" strokeWidth="1.5" />
      <circle r="50" fill="url(#es-disc)" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={(Math.cos(a) * 58).toFixed(1)} cy={(Math.sin(a) * 58).toFixed(1)} r="2.2" fill="#2b3240" />;
      })}
      <path className="es-gem" d="M0 -34 L22 0 L0 34 L-22 0 Z" fill="url(#es-gem)" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M0 -34 L8 -4 L0 34 L-8 -4 Z" fill="rgba(255,255,255,0.35)" />
      {win ? null : <path className="es-crack" d="M-40 -18 L-14 -6 L-20 6 L6 14 L2 26 L30 34" fill="none" stroke="#14020a" strokeWidth="3" strokeLinejoin="round" />}
    </svg>
  );
}

/** Blue crystal wings unfolding from both sides of the crest. */
function Wings() {
  const feathers = [
    { a: -12, l: 150, w: 15 },
    { a: 2, l: 172, w: 17 },
    { a: 17, l: 160, w: 16 },
    { a: 32, l: 138, w: 15 },
    { a: 47, l: 112, w: 13 },
    { a: 62, l: 86, w: 11 },
  ];
  return (
    <svg className="es-wings" viewBox="-240 -150 480 260" aria-hidden="true">
      <defs>
        <linearGradient id="es-feather" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1d5bd6" />
          <stop offset="0.45" stopColor="#5ec8ff" />
          <stop offset="1" stopColor="#ecfbff" />
        </linearGradient>
      </defs>
      {[-1, 1].map((side) => (
        <g key={side} transform={`scale(${side} 1)`}>
          {feathers.map((f, i) => {
            const base = 52;
            const tip = base + f.l;
            return (
              <g key={i} className="es-feather" style={{ "--i": i, "--a": `${-f.a}deg` } as CSSProperties}>
                <path
                  d={`M${base} ${-f.w * 0.5} L${tip - 30} ${-f.w} L${tip} 0 L${tip - 34} ${f.w * 0.7} L${base} ${f.w * 0.5} Z`}
                  fill="url(#es-feather)"
                  stroke="#e6f9ff"
                  strokeWidth="1.2"
                  opacity="0.94"
                />
                <path d={`M${base + 6} 0 L${tip - 8} 0`} stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
