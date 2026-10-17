// Mốc 2 — hiệu ứng hoành tráng nhất trên bàn 2D. Không đổi luật, không chặn chạm.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { actPack, ailmentHolds, fxOn, tideOn } from "@/lib/fx-prefs";
import { fxStyle } from "@/lib/fx-kinds";
import { subscribeFx, type FxEvent, type FxPack, type FxSpot } from "@/lib/spectacle";
import { fxUrl } from "@/lib/preload";

type Chunk = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  r: number;
  g: number;
  b: number;
  size: number;
};

type Glow = {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  life: number;
  max: number;
  x: number;
  y: number;
  spin: number;
  power: number;
  kind: "rune" | "pillar" | "ray";
  angle: number;
};

type Band = {
  mesh: THREE.Mesh;
  life: number;
  max: number;
  x: number;
  y: number;
  power: number;
  spin: number;
};

type Slash = {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  life: number;
  max: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  hit: boolean;
  pack: FxPack;
};

const MAX = 520;

const vert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function tone(color: string) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(0.55, Math.max(0.22, hsl.s * 0.7)), Math.min(0.5, Math.max(0.32, hsl.l)));
  return c;
}

function hot(color: string) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(1, hsl.s * 0.85 + 0.2), Math.min(0.68, Math.max(0.42, hsl.l)));
  return c;
}

function gentle(color: string) {
  const c = new THREE.Color(color);
  return c.b > c.r + 0.08 && c.g > 0.45;
}

function makeMat(fragment: string, color: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: color },
      uLife: { value: 1 },
      uTime: { value: 0 },
      uProgress: { value: 0 },
    },
    vertexShader: vert,
    fragmentShader: fragment,
  });
}

const runeFrag = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uLife;
  uniform float uTime;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float angle = atan(p.y, p.x);
    float outer = smoothstep(1.0, 0.86, r) * smoothstep(0.62, 0.74, r);
    float ticks = step(0.55, abs(sin(angle * 10.0 + uTime * 2.4)));
    float mid = smoothstep(0.58, 0.5, r) * smoothstep(0.36, 0.44, r);
    float spin = 0.5 + 0.5 * sin(angle * 7.0 - uTime * 5.0);
    float core = smoothstep(0.18, 0.0, r);
    float alpha = (outer * (0.35 + ticks) + mid * spin + core * 0.9) * uLife;
    if (alpha < 0.03) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), ticks * 0.55 + core), alpha);
  }
`;

const pillarFrag = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uLife;
  uniform float uTime;
  void main() {
    float side = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
    float body = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.35, vUv.y);
    float streak = 0.55 + 0.45 * sin(vUv.y * 36.0 - uTime * 14.0 + vUv.x * 8.0);
    float alpha = side * body * streak * uLife;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.5), alpha);
  }
`;

const rayFrag = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uLife;
  void main() {
    float across = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
    float along = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.4), across * along * uLife);
  }
`;

const slashFrag = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uLife;
  uniform float uProgress;
  void main() {
    float head = smoothstep(uProgress - 0.22, uProgress - 0.02, vUv.x) * smoothstep(uProgress + 0.04, uProgress - 0.05, vUv.x);
    float tail = smoothstep(0.0, 0.03, vUv.x) * (1.0 - smoothstep(uProgress - 0.55, uProgress, vUv.x));
    float across = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    float core = smoothstep(0.5, 0.0, abs(vUv.y - 0.5));
    float alpha = across * max(head, tail * 0.55) * (0.25 + core * 0.9) * uLife;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), core * head), alpha);
  }
`;

const flashFrag = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uLife;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float v = pow(smoothstep(1.15, 0.0, length(p)), 1.4);
    gl_FragColor = vec4(uColor, v * uLife * 0.72);
  }
`;

export function Spectacle() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.domElement.style.pointerEvents = "none";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    const view = { w: 2, h: 2, dist: 6.2 };
    camera.position.set(0, 0.15, view.dist);

    const positions = new Float32Array(MAX * 3);
    const colors = new Float32Array(MAX * 3);
    const lives = new Float32Array(MAX);
    const sizes = new Float32Array(MAX);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("life", new THREE.BufferAttribute(lives, 1));
    geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geom.setDrawRange(0, 0);
    const pointsMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        attribute float life;
        attribute vec3 color;
        varying float vLife;
        varying vec3 vColor;
        void main() {
          vLife = life;
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (260.0 / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vLife;
        varying vec3 vColor;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          if (d > 0.5) discard;
          float core = smoothstep(0.22, 0.0, d);
          float a = smoothstep(0.5, 0.08, d) * vLife;
          gl_FragColor = vec4(mix(vColor, vec3(1.0), core), a);
        }
      `,
    });
    scene.add(new THREE.Points(geom, pointsMat));

    const chunks: Chunk[] = [];
    const glows: Glow[] = [];
    const bands: Band[] = [];
    const poles: { mesh: THREE.Mesh; life: number; max: number; x: number; y: number }[] = [];
    const slashes: Slash[] = [];
    const flashMat = makeMat(flashFrag, new THREE.Color("#fff4d2"));
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
    scene.add(flash);
    let flashLife = 0;
    let clock = 0;

    const fit = () => {
      const w = parent.clientWidth || 1;
      const h = parent.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      view.h = 2 * view.dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      view.w = view.h * camera.aspect;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);

    const at = (x: number, y: number, z: number) => new THREE.Vector3((x / 100 - 0.5) * view.w, (0.5 - y / 100) * view.h, z);

    const drop = (mesh: THREE.Mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
    };

    const debris = (x: number, y: number, color: THREE.Color, power: number, count: number, lift = 1) => {
      for (let i = 0; i < count; i += 1) {
        if (chunks.length >= MAX) chunks.shift();
        const a = Math.random() * Math.PI * 2;
        const speed = (0.8 + Math.random() * 2.2) * power;
        chunks.push({
          x: (x / 100 - 0.5) * view.w,
          y: (0.5 - y / 100) * view.h,
          z: 0.2 + Math.random() * 0.3,
          vx: Math.cos(a) * speed,
          vy: Math.abs(Math.sin(a)) * speed * 0.55 * lift + 0.4,
          vz: (0.6 + Math.random() * 2.8) * power,
          life: 1,
          max: 0.38 + Math.random() * 0.45,
          r: color.r,
          g: color.g,
          b: color.b,
          size: (7 + Math.random() * 18) * Math.min(1.4, power),
        });
      }
    };

    const bang = (_color: string, _power: number) => {};

    const rune = (x: number, y: number, color: string, power: number) => {
      const mat = makeMat(runeFrag, hot(color));
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 72), mat);
      mesh.rotation.x = 1.12;
      scene.add(mesh);
      glows.push({ mesh, mat, life: 1, max: 0.95, x, y, spin: 0, power, kind: "rune", angle: 0 });
    };

    const pillar = (x: number, y: number, color: string) => {
      const mat = makeMat(pillarFrag, hot(color));
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.55, 2.3, 20, 1, true), mat);
      scene.add(mesh);
      glows.push({ mesh, mat, life: 1, max: 0.85, x, y, spin: 0, power: 1, kind: "pillar", angle: 0 });
    };

    const rays = (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i += 1) {
        const mat = makeMat(rayFrag, hot(color));
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        scene.add(mesh);
        glows.push({
          mesh,
          mat,
          life: 1,
          max: 0.48,
          x,
          y,
          spin: 0,
          power: 1,
          kind: "ray",
          angle: (i / count) * Math.PI * 2 + Math.random() * 0.2,
        });
      }
    };

    const band = (x: number, y: number, color: string, power: number) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.045, 10, 56),
        new THREE.MeshBasicMaterial({
          color: hot(color),
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        }),
      );
      scene.add(mesh);
      bands.push({ mesh, life: 1, max: 0.7, x, y, power, spin: Math.random() * Math.PI });
    };

    const shock = (x: number, y: number, color: string, power: number) => {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.72, 1, 64),
        new THREE.MeshBasicMaterial({
          color: hot(color),
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        }),
      );
      mesh.rotation.x = 1.15;
      scene.add(mesh);
      bands.push({ mesh, life: 1, max: 0.5, x, y, power, spin: -1 });
    };

    const slash = (x1: number, y1: number, x2: number, y2: number, color: string, pack: FxPack = "now", stamp = true) => {
      const mat = makeMat(slashFrag, pack === "m1" ? tone(color) : hot(color));
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      scene.add(mesh);
      slashes.push({ mesh, mat, life: 1, max: pack === "m1" ? 0.42 : 0.36, x1, y1, x2, y2, color, hit: !stamp, pack });
    };

    const spellSlash = (act: string, spot: FxSpot, x: number, y: number, color: string, pack: FxPack) => {
      if (act !== "spell" || !fxOn(pack, "spell", spot, "slash")) return;
      slash(x - 6, y - 8, x + 6, y + 8, color, pack, false);
    };

    const dullShock = (x: number, y: number, color: string, power: number) => {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.78, 40),
        new THREE.MeshBasicMaterial({
          color: tone(color),
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          depthWrite: false,
          depthTest: false,
        }),
      );
      mesh.rotation.x = 1.15;
      scene.add(mesh);
      bands.push({ mesh, life: 1, max: 0.55, x, y, power, spin: -1 });
    };

    const dullPillar = (x: number, y: number, color: string) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.38, 1.6, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color: tone(color),
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
          depthTest: false,
        }),
      );
      scene.add(mesh);
      poles.push({ mesh, life: 1, max: 0.7, x, y });
    };

    const m1Hit = (x: number, y: number, color: string) => {
      if (fxOn("m1", "attack", "target", "debris")) debris(x, y, tone(color), 0.8, 16);
      if (fxOn("m1", "attack", "target", "shock")) dullShock(x, y, color, 0.7);
    };

    const playM1 = (event: FxEvent) => {
      if (event.t === "burst") {
        if (fxOn("m1", event.act, event.spot, "debris")) debris(event.x, event.y, tone(event.color), event.power * 0.85, 18);
        if (fxOn("m1", event.act, event.spot, "shock")) dullShock(event.x, event.y, event.color, 0.55 * event.power);
        spellSlash(event.act, event.spot, event.x, event.y, event.color, "m1");
      }
      if (event.t === "ring") {
        if (fxOn("m1", event.act, event.spot, "shock")) dullShock(event.x, event.y, event.color, 0.85 * event.power);
        if (fxOn("m1", event.act, event.spot, "pillar")) dullPillar(event.x, event.y, event.color);
        if (fxOn("m1", event.act, event.spot, "debris")) debris(event.x, event.y, tone(event.color), event.power * 0.7, 12);
        spellSlash(event.act, event.spot, event.x, event.y, event.color, "m1");
      }
      if (event.t === "beam") {
        if (fxOn("m1", "attack", "self", "slash")) slash(event.x1, event.y1, event.x2, event.y2, event.color, "m1");
        else m1Hit(event.x2, event.y2, event.color);
      }
      if (event.t === "shake" && fxOn("m1", "shake", "center", "shock")) dullShock(48, 44, "#c4b09a", 1.2);
    };

    const finishAttack = (x: number, y: number, color: string) => {
      if (fxOn("now", "attack", "target", "debris")) debris(x, y, hot(color), 1.15, 28);
      if (fxOn("now", "attack", "target", "shock")) shock(x, y, color, 0.9);
      if (fxOn("now", "attack", "target", "band")) band(x, y, color, 0.8);
      if (fxOn("now", "attack", "target", "rays")) rays(x, y, color, 10);
      if (fxOn("now", "attack", "target", "bang")) bang(color, 0.9);
    };

    let ailmentMarks: { id: string; x: number; y: number; spot: "self" | "target"; pack: "now" | "m1" }[] = [];
    const ailmentSeen = new Set<string>();
    let ailmentClock = 0;

    const paintAilment = (mark: { x: number; y: number; spot: "self" | "target" }, pack: "now" | "m1") => {
      const color = "#86e27a";
      if (pack === "m1") {
        if (fxOn("m1", "ailment", mark.spot, "shock")) dullShock(mark.x, mark.y, color, 0.45);
        if (fxOn("m1", "ailment", mark.spot, "pillar")) dullPillar(mark.x, mark.y, color);
        if (fxOn("m1", "ailment", mark.spot, "debris")) debris(mark.x, mark.y, tone(color), 0.4, 8);
        return;
      }
      if (fxOn("now", "ailment", mark.spot, "rune")) rune(mark.x, mark.y, color, 0.7);
      if (fxOn("now", "ailment", mark.spot, "pillar")) pillar(mark.x, mark.y, color);
      if (fxOn("now", "ailment", mark.spot, "shock")) shock(mark.x, mark.y, color, 0.45);
      if (fxOn("now", "ailment", mark.spot, "band")) band(mark.x, mark.y, color, 0.4);
      if (fxOn("now", "ailment", mark.spot, "debris")) debris(mark.x, mark.y, hot(color), 0.45, 10);
    };

    const onFx = (event: FxEvent) => {
      if (fxStyle() === "new") {
        ailmentMarks = [];
        return;
      }
      if (event.t === "fire" || event.t === "tide" || event.t === "shield" || event.t === "bolt" || event.t === "laser" || event.t === "rite") return;
      if (event.t === "ailments") {
        const pack = event.pack ?? actPack("ailment");
        const nextIds = new Set(event.marks.map((mark) => mark.id));
        for (const mark of event.marks) {
          if (!ailmentSeen.has(mark.id)) paintAilment(mark, pack);
        }
        for (const id of ailmentSeen) if (!nextIds.has(id)) ailmentSeen.delete(id);
        for (const mark of event.marks) ailmentSeen.add(mark.id);
        ailmentMarks = ailmentHolds() ? event.marks.map((mark) => ({ ...mark, pack })) : [];
        return;
      }
      const pack = event.pack ?? actPack(event.act);
      if (pack === "m1") {
        playM1(event);
        return;
      }
      if (event.t === "burst") {
        const spot = event.spot;
        if (fxOn("now", event.act, spot, "rune")) rune(event.x, event.y, event.color, event.power);
        if (fxOn("now", event.act, spot, "pillar")) pillar(event.x, event.y, event.color);
        if (fxOn("now", event.act, spot, "band")) band(event.x, event.y, event.color, event.power);
        if (fxOn("now", event.act, spot, "debris")) debris(event.x, event.y, hot(event.color), event.power, 34);
        if (fxOn("now", event.act, spot, "shock")) shock(event.x, event.y, event.color, 0.7 * event.power);
        if (fxOn("now", event.act, spot, "rays")) rays(event.x, event.y, event.color, 8);
        if (fxOn("now", event.act, spot, "bang")) bang(event.color, event.power);
        spellSlash(event.act, spot, event.x, event.y, event.color, "now");
      }
      if (event.t === "ring") {
        const spot = event.spot;
        const lift = event.act === "heal" || event.act === "healSpell";
        if (fxOn("now", event.act, spot, "rune")) rune(event.x, event.y, event.color, event.power);
        if (fxOn("now", event.act, spot, "pillar")) pillar(event.x, event.y, event.color);
        if (fxOn("now", event.act, spot, "band")) band(event.x, event.y, event.color, event.power);
        if (fxOn("now", event.act, spot, "shock")) shock(event.x, event.y, event.color, event.power);
        if (fxOn("now", event.act, spot, "rays")) rays(event.x, event.y, event.color, event.act === "spell" && spot === "center" ? 14 : 10);
        if (fxOn("now", event.act, spot, "debris")) debris(event.x, event.y, hot(event.color), lift ? 0.6 : event.power, lift ? 14 : 22, lift ? 1.6 : 1);
        if (fxOn("now", event.act, spot, "bang")) bang(event.color, Math.min(1, event.power));
        spellSlash(event.act, spot, event.x, event.y, event.color, "now");
      }
      if (event.t === "beam") {
        if (fxOn("now", "attack", "self", "slash")) slash(event.x1, event.y1, event.x2, event.y2, event.color);
        else finishAttack(event.x2, event.y2, event.color);
      }
      if (event.t === "shake") {
        if (fxOn("now", "shake", "center", "rune")) rune(48, 44, "#f0d7a2", 1.8);
        if (fxOn("now", "shake", "center", "rays")) rays(48, 44, "#f3e2bc", 16);
        if (fxOn("now", "shake", "center", "shock")) shock(48, 44, "#f0d7a2", 1.6);
        if (fxOn("now", "shake", "center", "bang")) bang("#fff1cc", 1);
      }
    };
    const unsub = subscribeFx(onFx);

    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      clock += dt;
      ailmentClock += dt;
      if (ailmentClock > 1.7) {
        ailmentClock = 0;
        for (const mark of ailmentMarks) paintAilment(mark, mark.pack);
      }

      for (let i = chunks.length - 1; i >= 0; i -= 1) {
        const s = chunks[i]!;
        s.life -= dt / s.max;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        s.vy -= (s.max > 2 ? 0 : 2.2) * dt;
        if (s.max > 2) {
          if (s.y > view.h * 0.55) s.y = -view.h * 0.55;
          s.life = 0.4;
        } else if (s.life <= 0) chunks.splice(i, 1);
      }
      const pos = geom.getAttribute("position") as THREE.BufferAttribute;
      const col = geom.getAttribute("color") as THREE.BufferAttribute;
      const lifeAttr = geom.getAttribute("life") as THREE.BufferAttribute;
      const sizeAttr = geom.getAttribute("size") as THREE.BufferAttribute;
      const n = Math.min(MAX, chunks.length);
      for (let i = 0; i < n; i += 1) {
        const s = chunks[i]!;
        pos.setXYZ(i, s.x, s.y, s.z);
        col.setXYZ(i, s.r, s.g, s.b);
        lifeAttr.setX(i, Math.max(0, s.life));
        sizeAttr.setX(i, s.size * (0.7 + Math.min(1.2, s.z) * 0.45));
      }
      geom.setDrawRange(0, n);
      pos.needsUpdate = true;
      col.needsUpdate = true;
      lifeAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;

      for (let i = glows.length - 1; i >= 0; i -= 1) {
        const item = glows[i]!;
        item.life -= dt / item.max;
        item.spin += dt;
        if (item.life <= 0) {
          drop(item.mesh);
          glows.splice(i, 1);
          continue;
        }
        const p = at(item.x, item.y, 0.3);
        item.mat.uniforms.uLife!.value = item.life;
        item.mat.uniforms.uTime!.value = clock;
        if (item.kind === "rune") {
          const grown = 0.25 + (1 - item.life) * (0.7 + item.power * 0.55);
          item.mesh.position.set(p.x, p.y, 0.15);
          item.mesh.rotation.z = item.spin * 0.6;
          item.mesh.scale.set(grown, grown, grown);
        } else if (item.kind === "pillar") {
          const rise = Math.min(1, (1 - item.life) * 1.35);
          item.mesh.position.set(p.x, p.y + rise * 1.05, 0.4);
          item.mesh.scale.set(1, rise, 1);
          item.mesh.rotation.y = item.spin * 2;
          const step = Math.floor(item.spin * 14);
          const prev = Math.floor((item.spin - dt) * 14);
          if (step !== prev && chunks.length < MAX - 2) {
            const c = item.mat.uniforms.uColor!.value as THREE.Color;
            chunks.push({
              x: p.x + Math.sin(clock * 8 + item.x) * 0.18,
              y: p.y + rise * 0.4,
              z: 0.45,
              vx: Math.cos(clock * 6) * 0.3,
              vy: 1.4,
              vz: 0.5,
              life: 1,
              max: 0.55,
              r: c.r,
              g: c.g,
              b: c.b,
              size: 7,
            });
          }
        } else {
          const len = 0.3 + (1 - item.life) * 1.5;
          item.mesh.position.set(p.x + Math.cos(item.angle) * len * 0.5, p.y + Math.sin(item.angle) * len * 0.38, 0.62);
          item.mesh.rotation.set(0, 0, item.angle - Math.PI / 2);
          item.mesh.scale.set(0.06 + item.life * 0.05, len, 1);
        }
      }

      for (let i = bands.length - 1; i >= 0; i -= 1) {
        const item = bands[i]!;
        item.life -= dt / item.max;
        if (item.life <= 0) {
          drop(item.mesh);
          bands.splice(i, 1);
          continue;
        }
        const p = at(item.x, item.y, 0.25);
        item.mesh.position.set(p.x, p.y, 0.28);
        const grown = item.spin < 0 ? (1 - item.life) * (0.6 + item.power) : 0.35 + (1 - item.life) * (0.5 + item.power * 0.7);
        item.mesh.scale.set(Math.max(0.04, grown), Math.max(0.04, grown), Math.max(0.04, grown));
        if (item.spin >= 0) {
          item.spin += dt * 4.5;
          item.mesh.rotation.set(item.spin, item.spin * 0.7, 0);
        }
        const material = item.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = item.life * 0.9;
      }

      for (let i = slashes.length - 1; i >= 0; i -= 1) {
        const item = slashes[i]!;
        item.life -= dt / item.max;
        const progress = 1 - Math.max(0, item.life);
        item.mat.uniforms.uProgress!.value = progress;
        item.mat.uniforms.uLife!.value = Math.min(1, item.life * 1.6 + 0.25);
        if (!item.hit && progress > 0.9) {
          item.hit = true;
          if (item.pack === "m1") m1Hit(item.x2, item.y2, item.color);
          else finishAttack(item.x2, item.y2, item.color);
        }
        if (item.life <= 0) {
          drop(item.mesh);
          slashes.splice(i, 1);
          continue;
        }
        const a = at(item.x1, item.y1, 0.5);
        const b = at(item.x2, item.y2, 0.7);
        const dir = b.clone().sub(a);
        const len = Math.max(0.08, dir.length());
        const mid = a.clone().addScaledVector(dir.clone().normalize(), len / 2);
        item.mesh.position.set(mid.x, mid.y, 0.65);
        item.mesh.rotation.set(0, 0, Math.atan2(dir.y, dir.x));
        item.mesh.scale.set(len, item.pack === "m1" ? 0.22 : 0.42, 1);
        if (item.pack !== "m1" && chunks.length < MAX - 1 && progress < 0.92) {
          const tip = a.clone().lerp(b, progress);
          chunks.push({
            x: tip.x,
            y: tip.y,
            z: 0.7,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            vz: 1.2,
            life: 1,
            max: 0.28,
            r: 1,
            g: 0.9,
            b: 0.7,
            size: 8,
          });
        }
      }

      for (let i = poles.length - 1; i >= 0; i -= 1) {
        const item = poles[i]!;
        item.life -= dt / item.max;
        if (item.life <= 0) {
          drop(item.mesh);
          poles.splice(i, 1);
          continue;
        }
        const p = at(item.x, item.y, 0.3);
        const rise = Math.min(1, (1 - item.life) * 1.2);
        item.mesh.position.set(p.x, p.y + rise * 0.7, 0.35);
        item.mesh.scale.set(1, rise, 1);
        (item.mesh.material as THREE.MeshBasicMaterial).opacity = item.life * 0.4;
      }

      flashLife = Math.max(0, flashLife - dt * 2.8);
      flashMat.uniforms.uLife!.value = flashLife;
      const dist = view.dist - 1.15;
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
      flash.position.set(0, 0.15, dist);
      flash.scale.set(height * camera.aspect * 1.15, height * 1.15, 1);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      ro.disconnect();
      geom.dispose();
      pointsMat.dispose();
      glows.forEach((item) => drop(item.mesh));
      bands.forEach((item) => drop(item.mesh));
      poles.forEach((item) => drop(item.mesh));
      slashes.forEach((item) => drop(item.mesh));
      drop(flash);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="spectacle" aria-hidden style={{ pointerEvents: "none" }} />;
}

export function WaterBurst() {
  const [clips, setClips] = useState<{ id: number; rank: "small" | "mid" | "big"; x: number; y: number }[]>([]);
  useEffect(() => {
    const timers = new Set<number>();
    const stop = subscribeFx((event) => {
      if (event.t !== "tide" || !tideOn(event.rank)) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const id = Date.now() + Math.random();
      setClips((list) => [...list.slice(-4), { id, rank: event.rank, x: event.x, y: event.y }]);
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setClips((list) => list.filter((item) => item.id !== id));
      }, 900);
      timers.add(timer);
    });
    return () => {
      stop();
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);
  const src = { small: "/fx/nuoc-nho.png?v=2", mid: "/fx/nuoc-vua.png?v=2", big: "/fx/nuoc-lon.png?v=3" };
  return (
    <>
      {clips.map((clip) => (
        <img
          key={clip.id}
          className={`tide-blast is-${clip.rank}`}
          src={src[clip.rank]}
          alt=""
          draggable={false}
          style={{ left: `${clip.x}%`, top: `${clip.y}%` }}
        />
      ))}
    </>
  );
}

export function FireBurst() {
  const [clips, setClips] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    const stop = subscribeFx((event) => {
      if (event.t !== "fire") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const id = Date.now() + Math.random();
      setClips((list) => [...list.slice(-2), { id, x: event.x, y: event.y }]);
    });
    return () => {
      stop();
    };
  }, []);
  return (
    <>
      {clips.map((clip) => (
        <video
          key={clip.id}
          className="fire-blast"
          src={fxUrl("/fx/lua-no.mp4?v=2")}
          autoPlay
          muted
          playsInline
          style={{ left: `${clip.x}%`, top: `${clip.y}%` }}
          onEnded={() => setClips((list) => list.filter((item) => item.id !== clip.id))}
        />
      ))}
    </>
  );
}

export function LaserBeam() {
  const [clips, setClips] = useState<{ id: number; x1: number; y1: number; x2: number; y2: number }[]>([]);
  useEffect(() => {
    const stop = subscribeFx((event) => {
      if (event.t !== "laser") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const id = Date.now() + Math.random();
      setClips((list) => [...list.slice(-3), { id, x1: event.x1, y1: event.y1, x2: event.x2, y2: event.y2 }]);
    });
    return () => {
      stop();
    };
  }, []);
  return (
    <>
      {clips.map((clip) => {
        const dx = clip.x2 - clip.x1;
        const dy = (clip.y2 - clip.y1) * (16 / 9);
        const len = Math.max(18, Math.hypot(dx, dy));
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
        return (
          <video
            key={clip.id}
            className="laser-beam"
            src={fxUrl("/fx/laser.mp4?v=2")}
            autoPlay
            muted
            playsInline
            style={{
              left: `calc(${clip.x1}% - ${len}% - 0.4cm)`,
              top: `calc(${clip.y1}% - 4.3%)`,
              width: `calc(${len}% + 0.4cm)`,
              transform: `rotate(${angle}deg)`,
            }}
            onEnded={() => setClips((list) => list.filter((item) => item.id !== clip.id))}
          />
        );
      })}
    </>
  );
}

export function BoltBurst() {
  const [clips, setClips] = useState<{ id: number; rank: "small" | "big"; self: boolean; x: number; y: number }[]>([]);
  useEffect(() => {
    const stop = subscribeFx((event) => {
      if (event.t !== "bolt") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const id = Date.now() + Math.random();
      setClips((list) => [...list.slice(-7), { id, rank: event.rank, self: Boolean(event.self), x: event.x, y: event.y }]);
    });
    return () => {
      stop();
    };
  }, []);
  return (
    <>
      {clips.map((clip) => (
        <video
          key={clip.id}
          className={`bolt-blast is-${clip.rank}${clip.self ? " is-self" : ""}`}
          src={fxUrl(clip.rank === "small" ? "/fx/set-dien.mp4?v=1" : "/fx/set-to.mp4?v=1")}
          autoPlay
          muted
          playsInline
          style={{ left: `${clip.x}%`, top: `${clip.y}%` }}
          onEnded={() => setClips((list) => list.filter((item) => item.id !== clip.id))}
        />
      ))}
    </>
  );
}

export function ShieldBurst() {
  const [clips, setClips] = useState<{ id: number; kind: "phys" | "spell"; x: number; y: number }[]>([]);
  useEffect(() => {
    const timers = new Set<number>();
    const stop = subscribeFx((event) => {
      if (event.t !== "shield") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const id = Date.now() + Math.random();
      setClips((list) => [...list.slice(-3), { id, kind: event.kind, x: event.x, y: event.y }]);
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setClips((list) => list.filter((item) => item.id !== id));
      }, 1200);
      timers.add(timer);
    });
    return () => {
      stop();
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);
  return (
    <>
      {clips.map((clip) => (
        <span key={clip.id} className={`shield-buff is-${clip.kind}`} style={{ left: `${clip.x}%`, top: `${clip.y}%` }} aria-hidden>
          <svg viewBox="0 0 80 96">
            <circle className="ward" cx="40" cy="46" r="34" />
            <path className="body" d="M40 8 L68 20 V48 C68 67 55 80 40 88 C25 80 12 67 12 48 V20 Z" />
            <path className="rim" d="M40 8 L68 20 V48 C68 67 55 80 40 88 C25 80 12 67 12 48 V20 Z" />
          </svg>
        </span>
      ))}
    </>
  );
}
