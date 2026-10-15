import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as monsterCard, i as MONSTERS, o as MONSTER_CHIPS, r as FORMS, s as SPELLS } from "./catalog-DOYBjZ9O.mjs";
import { _ as Vector3, a as Color, c as Mesh, d as PlaneGeometry, f as Points, g as TorusGeometry, h as ShaderMaterial, i as CircleGeometry, l as MeshBasicMaterial, m as Scene, n as BufferAttribute, o as CylinderGeometry, p as RingGeometry, r as BufferGeometry, s as MathUtils, t as WebGLRenderer, u as PerspectiveCamera } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/card-fx-DwrPXICI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY$1 = "clash-fx-v2";
var KEY_M1 = "clash-fx-m1-v2";
var PACK_KEY = "clash-fx-pack";
var PACK_PARTS = {
	now: [
		"rune",
		"pillar",
		"band",
		"shock",
		"rays",
		"debris",
		"bang",
		"slash"
	],
	m1: [
		"pillar",
		"shock",
		"debris",
		"slash"
	]
};
var FX_PART_LABEL = {
	rune: "Vòng phép",
	pillar: "Cột sáng",
	band: "Vòng 3D xoay",
	shock: "Vòng sóng",
	rays: "Tia",
	debris: "Mảnh vỡ",
	bang: "Nháy sáng",
	slash: "Nhát chém"
};
var FX_SPOT_LABEL = {
	self: "Trên bản thân",
	target: "Trên mục tiêu",
	center: "Giữa bàn"
};
var summon = [
	"rune",
	"pillar",
	"band",
	"shock",
	"rays",
	"debris",
	"bang"
];
var hurt = [
	"debris",
	"shock",
	"rays",
	"bang"
];
var heal = [
	"rune",
	"pillar",
	"band",
	"debris"
];
var FX_ACTIONS = [
	{
		id: "summon",
		title: "1. Triệu hồi",
		spots: [{
			id: "self",
			parts: summon
		}, {
			id: "target",
			parts: summon
		}]
	},
	{
		id: "attack",
		title: "2. Lao vào đánh",
		spots: [{
			id: "self",
			parts: ["slash"]
		}, {
			id: "target",
			parts: [
				"debris",
				"shock",
				"band",
				"rays",
				"bang"
			]
		}]
	},
	{
		id: "hurt",
		title: "3. Mất máu",
		spots: [{
			id: "self",
			parts: hurt
		}, {
			id: "target",
			parts: hurt
		}]
	},
	{
		id: "kill",
		title: "4. Hạ quái",
		spots: [{
			id: "self",
			parts: hurt
		}, {
			id: "target",
			parts: hurt
		}]
	},
	{
		id: "heal",
		title: "5. Hồi máu",
		spots: [{
			id: "self",
			parts: heal
		}, {
			id: "target",
			parts: heal
		}]
	},
	{
		id: "spell",
		title: "6. Phép",
		spots: [{
			id: "center",
			parts: [
				"rune",
				"pillar",
				"band",
				"shock",
				"rays",
				"debris",
				"bang"
			]
		}, {
			id: "target",
			parts: [...[
				"debris",
				"shock",
				"rays",
				"bang",
				"rune",
				"pillar",
				"band"
			], "slash"]
		}]
	},
	{
		id: "healSpell",
		title: "7. Phép hồi",
		spots: [
			{
				id: "center",
				parts: [
					"rune",
					"pillar",
					"band",
					"debris"
				]
			},
			{
				id: "self",
				parts: heal
			},
			{
				id: "target",
				parts: heal
			}
		]
	},
	{
		id: "shake",
		title: "8. Đòn trúng, rung bàn",
		spots: [{
			id: "center",
			parts: [
				"rune",
				"rays",
				"shock",
				"bang"
			]
		}]
	},
	{
		id: "ailment",
		title: "9. Bất lợi kéo dài",
		spots: [{
			id: "self",
			parts: [
				"rune",
				"pillar",
				"shock",
				"debris",
				"band"
			]
		}, {
			id: "target",
			parts: [
				"rune",
				"pillar",
				"shock",
				"debris",
				"band"
			]
		}]
	}
];
var NOW_ON = {
	summon: {
		self: [],
		target: []
	},
	attack: {
		self: [],
		target: []
	},
	hurt: {
		self: [],
		target: []
	},
	kill: {
		self: [],
		target: []
	},
	heal: {
		self: [],
		target: []
	},
	spell: {
		center: [],
		target: ["shock", "rays"]
	},
	healSpell: {
		center: [],
		self: [],
		target: []
	},
	shake: { center: [] },
	ailment: {
		self: [],
		target: []
	}
};
var M1_ON = {
	summon: {
		self: ["shock", "pillar"],
		target: ["pillar", "shock"]
	},
	attack: {
		self: ["slash"],
		target: ["shock"]
	},
	hurt: {
		self: [],
		target: []
	},
	kill: {
		self: [],
		target: []
	},
	heal: {
		self: ["pillar"],
		target: ["pillar"]
	},
	spell: {
		center: [],
		target: []
	},
	healSpell: {
		center: [],
		self: ["pillar"],
		target: ["pillar"]
	},
	shake: { center: [] },
	ailment: {
		self: ["pillar"],
		target: ["pillar"]
	}
};
function fromTable(table) {
	const prefs = {};
	for (const action of FX_ACTIONS) {
		prefs[action.id] = {};
		for (const spot of action.spots) {
			const chosen = table[action.id]?.[spot.id] ?? [];
			prefs[action.id][spot.id] = chosen.filter((part) => spot.parts.includes(part));
		}
	}
	return prefs;
}
function defaultFxPrefs(pack = "now") {
	return fromTable(pack === "m1" ? M1_ON : NOW_ON);
}
function loadActivePack() {
	if (typeof localStorage === "undefined") return "now";
	return localStorage.getItem(PACK_KEY) === "m1" ? "m1" : "now";
}
var LOOK_KEY = "clash-fx-look-v2";
function defaultLooks() {
	const looks = {};
	for (const action of FX_ACTIONS) {
		const edit = action.id === "summon" || action.id === "spell" ? "now" : "m1";
		looks[action.id] = {
			edit,
			hide: {
				now: false,
				m1: false
			}
		};
	}
	return looks;
}
function loadLooks() {
	const looks = defaultLooks();
	if (typeof localStorage === "undefined") return looks;
	try {
		const raw = JSON.parse(localStorage.getItem(LOOK_KEY) ?? "null");
		if (!raw) return looks;
		for (const action of FX_ACTIONS) {
			const saved = raw[action.id];
			if (!saved) continue;
			looks[action.id] = {
				edit: saved.edit === "m1" ? "m1" : "now",
				hide: {
					now: Boolean(saved.hide?.now),
					m1: Boolean(saved.hide?.m1)
				}
			};
		}
	} catch {
		return defaultLooks();
	}
	return looks;
}
function saveLooks(looks) {
	localStorage.setItem(LOOK_KEY, JSON.stringify(looks));
}
function actPack(act) {
	return loadLooks()[act]?.edit ?? "now";
}
function loadFxPrefs(pack = "now") {
	const prefs = defaultFxPrefs(pack);
	if (typeof localStorage === "undefined") return prefs;
	const allow = new Set(PACK_PARTS[pack]);
	try {
		const raw = JSON.parse(localStorage.getItem(pack === "m1" ? KEY_M1 : KEY$1) ?? "null");
		if (!raw) return prefs;
		for (const action of FX_ACTIONS) {
			const saved = raw[action.id];
			if (!saved) continue;
			if (Array.isArray(saved)) {
				for (const spot of action.spots) prefs[action.id][spot.id] = saved.filter((part) => spot.parts.includes(part) && allow.has(part));
				continue;
			}
			for (const spot of action.spots) {
				const list = saved[spot.id];
				if (!Array.isArray(list)) continue;
				prefs[action.id][spot.id] = list.filter((part) => spot.parts.includes(part) && allow.has(part));
			}
		}
	} catch {
		return defaultFxPrefs(pack);
	}
	return prefs;
}
function saveFxPrefs(prefs, pack = "now") {
	localStorage.setItem(pack === "m1" ? KEY_M1 : KEY$1, JSON.stringify(prefs));
}
function fxOn(pack, act, spot, part) {
	return Boolean(loadFxPrefs(pack)[act][spot]?.includes(part));
}
function ailmentHolds() {
	if (typeof localStorage === "undefined") return true;
	return localStorage.getItem("clash-fx-ailment-hold") !== "0";
}
function saveAilmentHold(on) {
	localStorage.setItem("clash-fx-ailment-hold", on ? "1" : "0");
}
function fireBlastOn() {
	if (typeof localStorage === "undefined") return true;
	return localStorage.getItem("clash-fx-fire") !== "0";
}
function saveFireBlast(on) {
	localStorage.setItem("clash-fx-fire", on ? "1" : "0");
}
var TIDE_KEY = "clash-fx-tide";
function tideOn(rank) {
	if (typeof localStorage === "undefined") return true;
	const raw = localStorage.getItem(TIDE_KEY);
	if (raw == null) return true;
	return raw.split(",").includes(rank);
}
function saveTide(rank, on) {
	const next = [
		"small",
		"mid",
		"big"
	].filter((item) => item === rank ? on : tideOn(item));
	localStorage.setItem(TIDE_KEY, next.join(","));
}
function exportFxText(pack) {
	return JSON.stringify({
		pack,
		effects: loadFxPrefs(pack)
	});
}
var YOU = {
	x: 32,
	y: 66
};
var FOE = {
	x: 53,
	y: 30
};
var MID = {
	x: 42,
	y: 44
};
function previewOf(act) {
	if (act === "summon") return [{
		t: "ring",
		act,
		spot: "self",
		...YOU,
		color: "#ffb347",
		power: 1.15
	}, {
		t: "ring",
		act,
		spot: "target",
		...FOE,
		color: "#ffb347",
		power: 1.15
	}];
	if (act === "attack") return [{
		t: "beam",
		act,
		x1: YOU.x,
		y1: YOU.y,
		x2: FOE.x,
		y2: FOE.y,
		color: "#ff8a00"
	}];
	if (act === "hurt") return [{
		t: "burst",
		act,
		spot: "self",
		...YOU,
		color: "#ff4d4d",
		power: .95
	}, {
		t: "burst",
		act,
		spot: "target",
		...FOE,
		color: "#ff4d4d",
		power: .95
	}];
	if (act === "kill") return [{
		t: "burst",
		act,
		spot: "self",
		...YOU,
		color: "#ffb020",
		power: 1.4
	}, {
		t: "burst",
		act,
		spot: "target",
		...FOE,
		color: "#ffb020",
		power: 1.4
	}];
	if (act === "heal") return [{
		t: "ring",
		act,
		spot: "self",
		...YOU,
		color: "#3ec6ff",
		power: .95
	}, {
		t: "ring",
		act,
		spot: "target",
		...FOE,
		color: "#3ec6ff",
		power: .95
	}];
	if (act === "spell") return [{
		t: "ring",
		act,
		spot: "center",
		...MID,
		color: "#ffd36a",
		power: 1.7
	}, {
		t: "burst",
		act,
		spot: "target",
		...FOE,
		color: "#ff4d4d",
		power: 1.1
	}];
	if (act === "healSpell") return [
		{
			t: "ring",
			act,
			spot: "center",
			...MID,
			color: "#7ee7ff",
			power: 1.7
		},
		{
			t: "ring",
			act,
			spot: "self",
			...YOU,
			color: "#3ec6ff",
			power: .95
		},
		{
			t: "ring",
			act,
			spot: "target",
			...FOE,
			color: "#3ec6ff",
			power: .95
		}
	];
	if (act === "ailment") return [{
		t: "ring",
		act,
		spot: "target",
		...FOE,
		color: "#86e27a",
		power: .85
	}];
	return [{
		t: "shake",
		act: "shake",
		spot: "center",
		power: 1
	}];
}
var listeners = /* @__PURE__ */ new Set();
var LASER_MS = 2130;
function emitFx(event) {
	for (const listener of listeners) listener(event);
}
function subscribeFx(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
var MAX = 520;
var vert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
function tone(color) {
	const c = new Color(color);
	const hsl = {
		h: 0,
		s: 0,
		l: 0
	};
	c.getHSL(hsl);
	c.setHSL(hsl.h, Math.min(.55, Math.max(.22, hsl.s * .7)), Math.min(.5, Math.max(.32, hsl.l)));
	return c;
}
function hot(color) {
	const c = new Color(color);
	const hsl = {
		h: 0,
		s: 0,
		l: 0
	};
	c.getHSL(hsl);
	c.setHSL(hsl.h, Math.min(1, hsl.s * .85 + .2), Math.min(.68, Math.max(.42, hsl.l)));
	return c;
}
function makeMat(fragment, color) {
	return new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 2,
		uniforms: {
			uColor: { value: color },
			uLife: { value: 1 },
			uTime: { value: 0 },
			uProgress: { value: 0 }
		},
		vertexShader: vert,
		fragmentShader: fragment
	});
}
var runeFrag = `
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
var pillarFrag = `
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
var rayFrag = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uLife;
  void main() {
    float across = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
    float along = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.4), across * along * uLife);
  }
`;
var slashFrag = `
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
var flashFrag = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uLife;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float v = pow(smoothstep(1.15, 0.0, length(p)), 1.4);
    gl_FragColor = vec4(uColor, v * uLife * 0.72);
  }
`;
function Spectacle() {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		const parent = canvas?.parentElement;
		if (!canvas || !parent) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const renderer = new WebGLRenderer({
			canvas,
			alpha: true,
			antialias: true,
			powerPreference: "high-performance"
		});
		renderer.setClearColor(0, 0);
		renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
		renderer.domElement.style.pointerEvents = "none";
		const scene = new Scene();
		const camera = new PerspectiveCamera(36, 1, .1, 50);
		const view = {
			w: 2,
			h: 2,
			dist: 6.2
		};
		camera.position.set(0, .15, view.dist);
		const positions = new Float32Array(MAX * 3);
		const colors = new Float32Array(MAX * 3);
		const lives = new Float32Array(MAX);
		const sizes = new Float32Array(MAX);
		const geom = new BufferGeometry();
		geom.setAttribute("position", new BufferAttribute(positions, 3));
		geom.setAttribute("color", new BufferAttribute(colors, 3));
		geom.setAttribute("life", new BufferAttribute(lives, 1));
		geom.setAttribute("size", new BufferAttribute(sizes, 1));
		geom.setDrawRange(0, 0);
		const pointsMat = new ShaderMaterial({
			transparent: true,
			depthWrite: false,
			depthTest: false,
			blending: 2,
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
      `
		});
		scene.add(new Points(geom, pointsMat));
		const chunks = [];
		const glows = [];
		const bands = [];
		const poles = [];
		const slashes = [];
		const flashMat = makeMat(flashFrag, new Color("#fff4d2"));
		const flash = new Mesh(new PlaneGeometry(1, 1), flashMat);
		scene.add(flash);
		let flashLife = 0;
		let clock = 0;
		const fit = () => {
			const w = parent.clientWidth || 1;
			const h = parent.clientHeight || 1;
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			view.h = 2 * view.dist * Math.tan(MathUtils.degToRad(camera.fov / 2));
			view.w = view.h * camera.aspect;
		};
		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(parent);
		const at = (x, y, z) => new Vector3((x / 100 - .5) * view.w, (.5 - y / 100) * view.h, z);
		const drop = (mesh) => {
			scene.remove(mesh);
			mesh.geometry.dispose();
			const material = mesh.material;
			if (Array.isArray(material)) material.forEach((item) => item.dispose());
			else material.dispose();
		};
		const debris = (x, y, color, power, count, lift = 1) => {
			for (let i = 0; i < count; i += 1) {
				if (chunks.length >= MAX) chunks.shift();
				const a = Math.random() * Math.PI * 2;
				const speed = (.8 + Math.random() * 2.2) * power;
				chunks.push({
					x: (x / 100 - .5) * view.w,
					y: (.5 - y / 100) * view.h,
					z: .2 + Math.random() * .3,
					vx: Math.cos(a) * speed,
					vy: Math.abs(Math.sin(a)) * speed * .55 * lift + .4,
					vz: (.6 + Math.random() * 2.8) * power,
					life: 1,
					max: .38 + Math.random() * .45,
					r: color.r,
					g: color.g,
					b: color.b,
					size: (7 + Math.random() * 18) * Math.min(1.4, power)
				});
			}
		};
		const rune = (x, y, color, power) => {
			const mat = makeMat(runeFrag, hot(color));
			const mesh = new Mesh(new CircleGeometry(1, 72), mat);
			mesh.rotation.x = 1.12;
			scene.add(mesh);
			glows.push({
				mesh,
				mat,
				life: 1,
				max: .95,
				x,
				y,
				spin: 0,
				power,
				kind: "rune",
				angle: 0
			});
		};
		const pillar = (x, y, color) => {
			const mat = makeMat(pillarFrag, hot(color));
			const mesh = new Mesh(new CylinderGeometry(.22, .55, 2.3, 20, 1, true), mat);
			scene.add(mesh);
			glows.push({
				mesh,
				mat,
				life: 1,
				max: .85,
				x,
				y,
				spin: 0,
				power: 1,
				kind: "pillar",
				angle: 0
			});
		};
		const rays = (x, y, color, count) => {
			for (let i = 0; i < count; i += 1) {
				const mat = makeMat(rayFrag, hot(color));
				const mesh = new Mesh(new PlaneGeometry(1, 1), mat);
				scene.add(mesh);
				glows.push({
					mesh,
					mat,
					life: 1,
					max: .48,
					x,
					y,
					spin: 0,
					power: 1,
					kind: "ray",
					angle: i / count * Math.PI * 2 + Math.random() * .2
				});
			}
		};
		const band = (x, y, color, power) => {
			const mesh = new Mesh(new TorusGeometry(.62, .045, 10, 56), new MeshBasicMaterial({
				color: hot(color),
				transparent: true,
				opacity: .95,
				blending: 2,
				depthWrite: false,
				depthTest: false
			}));
			scene.add(mesh);
			bands.push({
				mesh,
				life: 1,
				max: .7,
				x,
				y,
				power,
				spin: Math.random() * Math.PI
			});
		};
		const shock = (x, y, color, power) => {
			const mesh = new Mesh(new RingGeometry(.72, 1, 64), new MeshBasicMaterial({
				color: hot(color),
				transparent: true,
				opacity: .85,
				side: 2,
				blending: 2,
				depthWrite: false,
				depthTest: false
			}));
			mesh.rotation.x = 1.15;
			scene.add(mesh);
			bands.push({
				mesh,
				life: 1,
				max: .5,
				x,
				y,
				power,
				spin: -1
			});
		};
		const slash = (x1, y1, x2, y2, color, pack = "now", stamp = true) => {
			const mat = makeMat(slashFrag, pack === "m1" ? tone(color) : hot(color));
			const mesh = new Mesh(new PlaneGeometry(1, 1), mat);
			scene.add(mesh);
			slashes.push({
				mesh,
				mat,
				life: 1,
				max: pack === "m1" ? .42 : .36,
				x1,
				y1,
				x2,
				y2,
				color,
				hit: !stamp,
				pack
			});
		};
		const spellSlash = (act, spot, x, y, color, pack) => {
			if (act !== "spell" || !fxOn(pack, "spell", spot, "slash")) return;
			slash(x - 6, y - 8, x + 6, y + 8, color, pack, false);
		};
		const dullShock = (x, y, color, power) => {
			const mesh = new Mesh(new RingGeometry(.55, .78, 40), new MeshBasicMaterial({
				color: tone(color),
				transparent: true,
				opacity: .7,
				side: 2,
				depthWrite: false,
				depthTest: false
			}));
			mesh.rotation.x = 1.15;
			scene.add(mesh);
			bands.push({
				mesh,
				life: 1,
				max: .55,
				x,
				y,
				power,
				spin: -1
			});
		};
		const dullPillar = (x, y, color) => {
			const mesh = new Mesh(new CylinderGeometry(.16, .38, 1.6, 16, 1, true), new MeshBasicMaterial({
				color: tone(color),
				transparent: true,
				opacity: .4,
				side: 2,
				depthWrite: false,
				depthTest: false
			}));
			scene.add(mesh);
			poles.push({
				mesh,
				life: 1,
				max: .7,
				x,
				y
			});
		};
		const m1Hit = (x, y, color) => {
			if (fxOn("m1", "attack", "target", "debris")) debris(x, y, tone(color), .8, 16);
			if (fxOn("m1", "attack", "target", "shock")) dullShock(x, y, color, .7);
		};
		const playM1 = (event) => {
			if (event.t === "burst") {
				if (fxOn("m1", event.act, event.spot, "debris")) debris(event.x, event.y, tone(event.color), event.power * .85, 18);
				if (fxOn("m1", event.act, event.spot, "shock")) dullShock(event.x, event.y, event.color, .55 * event.power);
				spellSlash(event.act, event.spot, event.x, event.y, event.color, "m1");
			}
			if (event.t === "ring") {
				if (fxOn("m1", event.act, event.spot, "shock")) dullShock(event.x, event.y, event.color, .85 * event.power);
				if (fxOn("m1", event.act, event.spot, "pillar")) dullPillar(event.x, event.y, event.color);
				if (fxOn("m1", event.act, event.spot, "debris")) debris(event.x, event.y, tone(event.color), event.power * .7, 12);
				spellSlash(event.act, event.spot, event.x, event.y, event.color, "m1");
			}
			if (event.t === "beam") {
				if (fxOn("m1", "attack", "self", "slash")) slash(event.x1, event.y1, event.x2, event.y2, event.color, "m1");
				else m1Hit(event.x2, event.y2, event.color);
			}
			if (event.t === "shake" && fxOn("m1", "shake", "center", "shock")) dullShock(48, 44, "#c4b09a", 1.2);
		};
		const finishAttack = (x, y, color) => {
			if (fxOn("now", "attack", "target", "debris")) debris(x, y, hot(color), 1.15, 28);
			if (fxOn("now", "attack", "target", "shock")) shock(x, y, color, .9);
			if (fxOn("now", "attack", "target", "band")) band(x, y, color, .8);
			if (fxOn("now", "attack", "target", "rays")) rays(x, y, color, 10);
			if (fxOn("now", "attack", "target", "bang"));
		};
		let ailmentMarks = [];
		const ailmentSeen = /* @__PURE__ */ new Set();
		let ailmentClock = 0;
		const paintAilment = (mark, pack) => {
			const color = "#86e27a";
			if (pack === "m1") {
				if (fxOn("m1", "ailment", mark.spot, "shock")) dullShock(mark.x, mark.y, color, .45);
				if (fxOn("m1", "ailment", mark.spot, "pillar")) dullPillar(mark.x, mark.y, color);
				if (fxOn("m1", "ailment", mark.spot, "debris")) debris(mark.x, mark.y, tone(color), .4, 8);
				return;
			}
			if (fxOn("now", "ailment", mark.spot, "rune")) rune(mark.x, mark.y, color, .7);
			if (fxOn("now", "ailment", mark.spot, "pillar")) pillar(mark.x, mark.y, color);
			if (fxOn("now", "ailment", mark.spot, "shock")) shock(mark.x, mark.y, color, .45);
			if (fxOn("now", "ailment", mark.spot, "band")) band(mark.x, mark.y, color, .4);
			if (fxOn("now", "ailment", mark.spot, "debris")) debris(mark.x, mark.y, hot(color), .45, 10);
		};
		const onFx = (event) => {
			if (event.t === "fire" || event.t === "tide" || event.t === "shield" || event.t === "bolt" || event.t === "laser") return;
			if (event.t === "ailments") {
				const pack = event.pack ?? actPack("ailment");
				const nextIds = new Set(event.marks.map((mark) => mark.id));
				for (const mark of event.marks) if (!ailmentSeen.has(mark.id)) paintAilment(mark, pack);
				for (const id of ailmentSeen) if (!nextIds.has(id)) ailmentSeen.delete(id);
				for (const mark of event.marks) ailmentSeen.add(mark.id);
				ailmentMarks = ailmentHolds() ? event.marks.map((mark) => ({
					...mark,
					pack
				})) : [];
				return;
			}
			if ((event.pack ?? actPack(event.act)) === "m1") {
				playM1(event);
				return;
			}
			if (event.t === "burst") {
				const spot = event.spot;
				if (fxOn("now", event.act, spot, "rune")) rune(event.x, event.y, event.color, event.power);
				if (fxOn("now", event.act, spot, "pillar")) pillar(event.x, event.y, event.color);
				if (fxOn("now", event.act, spot, "band")) band(event.x, event.y, event.color, event.power);
				if (fxOn("now", event.act, spot, "debris")) debris(event.x, event.y, hot(event.color), event.power, 34);
				if (fxOn("now", event.act, spot, "shock")) shock(event.x, event.y, event.color, .7 * event.power);
				if (fxOn("now", event.act, spot, "rays")) rays(event.x, event.y, event.color, 8);
				if (fxOn("now", event.act, spot, "bang")) event.color, event.power;
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
				if (fxOn("now", event.act, spot, "debris")) debris(event.x, event.y, hot(event.color), lift ? .6 : event.power, lift ? 14 : 22, lift ? 1.6 : 1);
				if (fxOn("now", event.act, spot, "bang")) event.color, Math.min(1, event.power);
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
				if (fxOn("now", "shake", "center", "bang"));
			}
		};
		const unsub = subscribeFx(onFx);
		let last = performance.now();
		let raf = 0;
		const loop = (now) => {
			const dt = Math.min(.033, (now - last) / 1e3);
			last = now;
			clock += dt;
			ailmentClock += dt;
			if (ailmentClock > 1.7) {
				ailmentClock = 0;
				for (const mark of ailmentMarks) paintAilment(mark, mark.pack);
			}
			for (let i = chunks.length - 1; i >= 0; i -= 1) {
				const s = chunks[i];
				s.life -= dt / s.max;
				s.x += s.vx * dt;
				s.y += s.vy * dt;
				s.z += s.vz * dt;
				s.vy -= (s.max > 2 ? 0 : 2.2) * dt;
				if (s.max > 2) {
					if (s.y > view.h * .55) s.y = -view.h * .55;
					s.life = .4;
				} else if (s.life <= 0) chunks.splice(i, 1);
			}
			const pos = geom.getAttribute("position");
			const col = geom.getAttribute("color");
			const lifeAttr = geom.getAttribute("life");
			const sizeAttr = geom.getAttribute("size");
			const n = Math.min(MAX, chunks.length);
			for (let i = 0; i < n; i += 1) {
				const s = chunks[i];
				pos.setXYZ(i, s.x, s.y, s.z);
				col.setXYZ(i, s.r, s.g, s.b);
				lifeAttr.setX(i, Math.max(0, s.life));
				sizeAttr.setX(i, s.size * (.7 + Math.min(1.2, s.z) * .45));
			}
			geom.setDrawRange(0, n);
			pos.needsUpdate = true;
			col.needsUpdate = true;
			lifeAttr.needsUpdate = true;
			sizeAttr.needsUpdate = true;
			for (let i = glows.length - 1; i >= 0; i -= 1) {
				const item = glows[i];
				item.life -= dt / item.max;
				item.spin += dt;
				if (item.life <= 0) {
					drop(item.mesh);
					glows.splice(i, 1);
					continue;
				}
				const p = at(item.x, item.y, .3);
				item.mat.uniforms.uLife.value = item.life;
				item.mat.uniforms.uTime.value = clock;
				if (item.kind === "rune") {
					const grown = .25 + (1 - item.life) * (.7 + item.power * .55);
					item.mesh.position.set(p.x, p.y, .15);
					item.mesh.rotation.z = item.spin * .6;
					item.mesh.scale.set(grown, grown, grown);
				} else if (item.kind === "pillar") {
					const rise = Math.min(1, (1 - item.life) * 1.35);
					item.mesh.position.set(p.x, p.y + rise * 1.05, .4);
					item.mesh.scale.set(1, rise, 1);
					item.mesh.rotation.y = item.spin * 2;
					if (Math.floor(item.spin * 14) !== Math.floor((item.spin - dt) * 14) && chunks.length < 518) {
						const c = item.mat.uniforms.uColor.value;
						chunks.push({
							x: p.x + Math.sin(clock * 8 + item.x) * .18,
							y: p.y + rise * .4,
							z: .45,
							vx: Math.cos(clock * 6) * .3,
							vy: 1.4,
							vz: .5,
							life: 1,
							max: .55,
							r: c.r,
							g: c.g,
							b: c.b,
							size: 7
						});
					}
				} else {
					const len = .3 + (1 - item.life) * 1.5;
					item.mesh.position.set(p.x + Math.cos(item.angle) * len * .5, p.y + Math.sin(item.angle) * len * .38, .62);
					item.mesh.rotation.set(0, 0, item.angle - Math.PI / 2);
					item.mesh.scale.set(.06 + item.life * .05, len, 1);
				}
			}
			for (let i = bands.length - 1; i >= 0; i -= 1) {
				const item = bands[i];
				item.life -= dt / item.max;
				if (item.life <= 0) {
					drop(item.mesh);
					bands.splice(i, 1);
					continue;
				}
				const p = at(item.x, item.y, .25);
				item.mesh.position.set(p.x, p.y, .28);
				const grown = item.spin < 0 ? (1 - item.life) * (.6 + item.power) : .35 + (1 - item.life) * (.5 + item.power * .7);
				item.mesh.scale.set(Math.max(.04, grown), Math.max(.04, grown), Math.max(.04, grown));
				if (item.spin >= 0) {
					item.spin += dt * 4.5;
					item.mesh.rotation.set(item.spin, item.spin * .7, 0);
				}
				const material = item.mesh.material;
				material.opacity = item.life * .9;
			}
			for (let i = slashes.length - 1; i >= 0; i -= 1) {
				const item = slashes[i];
				item.life -= dt / item.max;
				const progress = 1 - Math.max(0, item.life);
				item.mat.uniforms.uProgress.value = progress;
				item.mat.uniforms.uLife.value = Math.min(1, item.life * 1.6 + .25);
				if (!item.hit && progress > .9) {
					item.hit = true;
					if (item.pack === "m1") m1Hit(item.x2, item.y2, item.color);
					else finishAttack(item.x2, item.y2, item.color);
				}
				if (item.life <= 0) {
					drop(item.mesh);
					slashes.splice(i, 1);
					continue;
				}
				const a = at(item.x1, item.y1, .5);
				const b = at(item.x2, item.y2, .7);
				const dir = b.clone().sub(a);
				const len = Math.max(.08, dir.length());
				const mid = a.clone().addScaledVector(dir.clone().normalize(), len / 2);
				item.mesh.position.set(mid.x, mid.y, .65);
				item.mesh.rotation.set(0, 0, Math.atan2(dir.y, dir.x));
				item.mesh.scale.set(len, item.pack === "m1" ? .22 : .42, 1);
				if (item.pack !== "m1" && chunks.length < 519 && progress < .92) {
					const tip = a.clone().lerp(b, progress);
					chunks.push({
						x: tip.x,
						y: tip.y,
						z: .7,
						vx: (Math.random() - .5) * .8,
						vy: (Math.random() - .5) * .8,
						vz: 1.2,
						life: 1,
						max: .28,
						r: 1,
						g: .9,
						b: .7,
						size: 8
					});
				}
			}
			for (let i = poles.length - 1; i >= 0; i -= 1) {
				const item = poles[i];
				item.life -= dt / item.max;
				if (item.life <= 0) {
					drop(item.mesh);
					poles.splice(i, 1);
					continue;
				}
				const p = at(item.x, item.y, .3);
				const rise = Math.min(1, (1 - item.life) * 1.2);
				item.mesh.position.set(p.x, p.y + rise * .7, .35);
				item.mesh.scale.set(1, rise, 1);
				item.mesh.material.opacity = item.life * .4;
			}
			flashLife = Math.max(0, flashLife - dt * 2.8);
			flashMat.uniforms.uLife.value = flashLife;
			const dist = view.dist - 1.15;
			const height = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * dist;
			flash.position.set(0, .15, dist);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: "spectacle",
		"aria-hidden": true,
		style: { pointerEvents: "none" }
	});
}
function WaterBurst() {
	const [clips, setClips] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const timers = /* @__PURE__ */ new Set();
		const stop = subscribeFx((event) => {
			if (event.t !== "tide" || !tideOn(event.rank)) return;
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			const id = Date.now() + Math.random();
			setClips((list) => [...list.slice(-4), {
				id,
				rank: event.rank,
				x: event.x,
				y: event.y
			}]);
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
	const src = {
		small: "/fx/nuoc-nho.png?v=2",
		mid: "/fx/nuoc-vua.png?v=2",
		big: "/fx/nuoc-lon.png?v=3"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: clips.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		className: `tide-blast is-${clip.rank}`,
		src: src[clip.rank],
		alt: "",
		draggable: false,
		style: {
			left: `${clip.x}%`,
			top: `${clip.y}%`
		}
	}, clip.id)) });
}
function FireBurst() {
	const [clips, setClips] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const stop = subscribeFx((event) => {
			if (event.t !== "fire") return;
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			const id = Date.now() + Math.random();
			setClips((list) => [...list.slice(-2), {
				id,
				x: event.x,
				y: event.y
			}]);
		});
		return () => {
			stop();
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: clips.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		className: "fire-blast",
		src: "/fx/lua-no.mp4?v=2",
		autoPlay: true,
		muted: true,
		playsInline: true,
		style: {
			left: `${clip.x}%`,
			top: `${clip.y}%`
		},
		onEnded: () => setClips((list) => list.filter((item) => item.id !== clip.id))
	}, clip.id)) });
}
function LaserBeam() {
	const [clips, setClips] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const stop = subscribeFx((event) => {
			if (event.t !== "laser") return;
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			const id = Date.now() + Math.random();
			setClips((list) => [...list.slice(-3), {
				id,
				x1: event.x1,
				y1: event.y1,
				x2: event.x2,
				y2: event.y2
			}]);
		});
		return () => {
			stop();
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: clips.map((clip) => {
		const dx = clip.x2 - clip.x1;
		const dy = (clip.y2 - clip.y1) * (16 / 9);
		const len = Math.max(18, Math.hypot(dx, dy));
		const angle = Math.atan2(dy, dx) * 180 / Math.PI + 180;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			className: "laser-beam",
			src: "/fx/laser.mp4?v=2",
			autoPlay: true,
			muted: true,
			playsInline: true,
			style: {
				left: `calc(${clip.x1}% - ${len}% - 0.4cm)`,
				top: `calc(${clip.y1}% - 4.3%)`,
				width: `calc(${len}% + 0.4cm)`,
				transform: `rotate(${angle}deg)`
			},
			onEnded: () => setClips((list) => list.filter((item) => item.id !== clip.id))
		}, clip.id);
	}) });
}
function BoltBurst() {
	const [clips, setClips] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const stop = subscribeFx((event) => {
			if (event.t !== "bolt") return;
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			const id = Date.now() + Math.random();
			setClips((list) => [...list.slice(-7), {
				id,
				rank: event.rank,
				self: Boolean(event.self),
				x: event.x,
				y: event.y
			}]);
		});
		return () => {
			stop();
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: clips.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		className: `bolt-blast is-${clip.rank}${clip.self ? " is-self" : ""}`,
		src: clip.rank === "small" ? "/fx/set-dien.mp4?v=1" : "/fx/set-to.mp4?v=1",
		autoPlay: true,
		muted: true,
		playsInline: true,
		style: {
			left: `${clip.x}%`,
			top: `${clip.y}%`
		},
		onEnded: () => setClips((list) => list.filter((item) => item.id !== clip.id))
	}, clip.id)) });
}
function ShieldBurst() {
	const [clips, setClips] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const timers = /* @__PURE__ */ new Set();
		const stop = subscribeFx((event) => {
			if (event.t !== "shield") return;
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			const id = Date.now() + Math.random();
			setClips((list) => [...list.slice(-3), {
				id,
				kind: event.kind,
				x: event.x,
				y: event.y
			}]);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: clips.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `shield-buff is-${clip.kind}`,
		style: {
			left: `${clip.x}%`,
			top: `${clip.y}%`
		},
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 80 96",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					className: "ward",
					cx: "40",
					cy: "46",
					r: "34"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					className: "body",
					d: "M40 8 L68 20 V48 C68 67 55 80 40 88 C25 80 12 67 12 48 V20 Z"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					className: "rim",
					d: "M40 8 L68 20 V48 C68 67 55 80 40 88 C25 80 12 67 12 48 V20 Z"
				})
			]
		})
	}, clip.id)) });
}
var KEY = "clash-card-fx";
var CARD_FX_CHOICES = [
	{
		id: "fire",
		label: "Lửa"
	},
	{
		id: "spell",
		label: "Phép thường"
	},
	{
		id: "gun",
		label: "Súng"
	}
];
var SPELL_FX_CHOICES = [
	{
		id: "bolt",
		label: "Sét"
	},
	{
		id: "spark",
		label: "Điện"
	},
	...CARD_FX_CHOICES,
	{
		id: "none",
		label: "Không"
	}
];
var EXTRA = {
	"trai-tim-hai-long": [
		{
			key: "tide",
			name: "Triều lên",
			index: 0
		},
		{
			key: "surge",
			name: "Con nước lớn tàn phá",
			index: 1
		},
		{
			key: "doom",
			name: "Đại thuỷ triều huỷ diệt",
			index: 2
		}
	],
	"kiem-si-lua-thieng": [
		{
			key: "fire",
			name: "Vệt Lửa",
			index: 0
		},
		{
			key: "blood",
			name: "Lửa rồng thiêng",
			index: 1
		},
		{
			key: "echo",
			name: "Đòn thêm",
			index: 8
		},
		{
			key: "last",
			name: "Hoả thần long",
			index: 9
		}
	],
	"mat-xanh-huy-diet": [{
		key: "gaze",
		name: "Tia sáng huỷ diệt",
		index: 0
	}],
	"mat-do-tan-pha": [{
		key: "ball",
		name: "Cầu lửa địa ngục",
		index: 0
	}]
};
var empty = () => ({
	m: {},
	s: {}
});
function isFx(value) {
	return value === "fire" || value === "spell" || value === "gun";
}
function isSpellFx(value) {
	return isFx(value) || value === "none" || value === "bolt" || value === "spark";
}
function loadCardFx() {
	if (typeof localStorage === "undefined") return empty();
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
		const store = empty();
		if (!raw) return store;
		for (const [cardId, row] of Object.entries(raw.m ?? {})) {
			if (!row || typeof row !== "object") continue;
			const next = {};
			for (const [skill, fx] of Object.entries(row)) if (isFx(fx)) next[skill] = fx;
			if (Object.keys(next).length) store.m[cardId] = next;
		}
		for (const [cardId, fx] of Object.entries(raw.s ?? {})) if (isSpellFx(fx)) store.s[cardId] = fx;
		const gaze = store.m["mat-xanh-huy-diet"];
		if (gaze?.gaze) {
			delete gaze.gaze;
			if (!Object.keys(gaze).length) delete store.m["mat-xanh-huy-diet"];
			write(store);
		}
		return store;
	} catch {
		return empty();
	}
}
function write(store) {
	localStorage.setItem(KEY, JSON.stringify(store));
}
function skillsOf(cardId) {
	if (EXTRA[cardId]) return EXTRA[cardId];
	const chips = MONSTER_CHIPS[cardId];
	if (chips?.length) return chips.map((chip, index) => ({
		key: chip.key,
		name: chip.label,
		index: skillIndex(cardId, chip.key, index)
	}));
	const line = monsterCard(cardId)?.skill.split("\n")[0]?.replace(/\.$/, "").trim() || "";
	return [{
		key: "skill",
		name: line.length > 0 && line.length <= 28 ? line : "Kỹ năng",
		index: 0
	}];
}
function skillIndex(cardId, key, fallback) {
	if (cardId === "rong-phun-hoa-cau") return key === "fire" ? 1 : 0;
	if (cardId === "phu-thuy-thoi-gian") return key === "all" ? 2 : 0;
	if (cardId === "ga-he-dang-so") return key === "cast" ? 1 : 0;
	return fallback;
}
function slotFor(cardId, index) {
	const skills = skillsOf(cardId);
	if (cardId === "kiem-si-lua-thieng") {
		if (index === 1) return skills.find((skill) => skill.key === "blood");
		if (index === 8) return skills.find((skill) => skill.key === "echo");
		if (index === 9) return skills.find((skill) => skill.key === "last");
		return skills.find((skill) => skill.key === "fire");
	}
	if (cardId === "phu-thuy-thoi-gian") return skills.find((skill) => skill.key === (index >= 2 ? "all" : "age"));
	if (cardId === "rong-phun-hoa-cau") return skills.find((skill) => skill.key === (index > 0 ? "fire" : "peek"));
	if (cardId === "ga-he-dang-so") return skills.find((skill) => skill.key === (index === 1 ? "cast" : "charge"));
	return skills.find((skill) => skill.index === index) ?? skills[0];
}
function baseSkillLook(cardId, index = 0) {
	if (cardId === "trai-tim-hai-long") return index >= 2 ? "tide-big" : index === 1 ? "tide-mid" : "tide-small";
	if (cardId === "kiem-si-lua-thieng") return "fire";
	if (cardId === "rong-phun-hoa-cau" && index === 1) return "fire";
	if (cardId === "ga-he-dang-so") return index === 1 ? "spell" : null;
	if (cardId === "phu-thuy-ti-hon" || cardId === "trieu-hoi-ac-ma" || cardId === "sua-hut-ma-phap" || cardId === "con-thinh-no-cua-hai-vuong" || cardId === "mo-voi-ma-mut" || cardId === "ngai-khong-lo" || cardId === "ngai-nu-hoang" || cardId === "ngai-hoan-my" || cardId === "ma-dao-si") return "spell";
	if (cardId === "mat-do-tan-pha") return "fire";
	if (cardId === "loi-nguyen-cua-rong") return "fire";
	if (cardId === "thuong-quan-long") return "gun";
	if (cardId === "may-nem-bom-hinh-nhen") return "gun";
	if (cardId === "may-quay-thuong") return index === 1 ? "spell" : null;
	if (cardId === "rong-con" || cardId === "rong-ngan-tuoi" || cardId === "rong-ac-ma") return "fire";
	return null;
}
function choiceOf(cardId, skillKey, store = loadCardFx()) {
	return store.m[cardId]?.[skillKey] ?? null;
}
function shownChoice(cardId, skill, store = loadCardFx()) {
	const picked = choiceOf(cardId, skill.key, store);
	if (picked) return picked;
	const base = baseSkillLook(cardId, skill.index);
	return base === "fire" || base === "spell" || base === "gun" ? base : null;
}
function setMonsterFx(cardId, skillKey, fx) {
	const store = loadCardFx();
	const skill = skillsOf(cardId).find((item) => item.key === skillKey);
	const base = skill ? baseSkillLook(cardId, skill.index) : null;
	const row = { ...store.m[cardId] ?? {} };
	if (base === fx || row[skillKey] === fx) delete row[skillKey];
	else row[skillKey] = fx;
	if (Object.keys(row).length) store.m[cardId] = row;
	else delete store.m[cardId];
	write(store);
}
var SPELL_HIT = /* @__PURE__ */ new Set([
	"sam-set-tan-the",
	"phuc-kich",
	"virus-an-mon"
]);
function spellBase(cardId) {
	if (cardId === "sam-set-tan-the") return "bolt";
	if (cardId === "sung-loi-pha") return "spark";
	if (SPELL_HIT.has(cardId)) return "spell";
	return "none";
}
function setSpellFx(cardId, fx) {
	const store = loadCardFx();
	if (fx === spellBase(cardId) || store.s[cardId] === fx) delete store.s[cardId];
	else store.s[cardId] = fx;
	write(store);
}
function spellChoice(cardId, store = loadCardFx()) {
	return store.s[cardId] ?? spellBase(cardId);
}
function spellFxLook(cardId) {
	return loadCardFx().s[cardId] ?? null;
}
function skillVisual(cardId, index = 0) {
	if (cardId === "mat-xanh-huy-diet") return null;
	const slot = slotFor(cardId, index);
	const picked = slot ? loadCardFx().m[cardId]?.[slot.key] : null;
	if (picked) return picked;
	return baseSkillLook(cardId, index);
}
function cardFxMonsters() {
	return [...MONSTERS, ...FORMS].sort((a, b) => a.stars - b.stars || a.name.localeCompare(b.name, "vi"));
}
function cardFxSpells() {
	return [...SPELLS].sort((a, b) => a.gems - b.gems || a.name.localeCompare(b.name, "vi"));
}
function fxLabel(fx) {
	return SPELL_FX_CHOICES.find((item) => item.id === fx)?.label ?? fx;
}
function exportCardFx() {
	const store = loadCardFx();
	const blocks = [];
	for (const card of cardFxMonsters()) {
		const row = store.m[card.id];
		if (!row) continue;
		const lines = skillsOf(card.id).filter((skill) => row[skill.key]).map((skill) => `${skill.name}: ${fxLabel(row[skill.key])}`);
		if (lines.length) blocks.push([card.name, ...lines].join("\n"));
	}
	for (const card of cardFxSpells()) {
		const fx = store.s[card.id];
		if (fx) blocks.push(`${card.name}: ${fxLabel(fx)}`);
	}
	if (!blocks.length) return "";
	return `HIỆU ỨNG LÁ BÀI\n\n${blocks.join("\n\n")}\n`;
}
function tideNote(cardId, skill, store = loadCardFx()) {
	if (choiceOf(cardId, skill.key, store)) return "";
	const base = baseSkillLook(cardId, skill.index);
	if (base === "tide-small" || base === "tide-mid" || base === "tide-big") return "Skill này giữ nước riêng của Trái tim hải long.";
	return "";
}
//#endregion
export { saveFireBlast as A, spellFxLook as B, fireBlastOn as C, loadLooks as D, loadFxPrefs as E, setSpellFx as F, tideOn as H, shownChoice as I, skillVisual as L, saveLooks as M, saveTide as N, previewOf as O, setMonsterFx as P, skillsOf as R, exportFxText as S, loadCardFx as T, tideNote as V, cardFxSpells as _, FX_SPOT_LABEL as a, emitFx as b, LaserBeam as c, ShieldBurst as d, Spectacle as f, cardFxMonsters as g, ailmentHolds as h, FX_PART_LABEL as i, saveFxPrefs as j, saveAilmentHold as k, PACK_PARTS as l, actPack as m, CARD_FX_CHOICES as n, FireBurst as o, WaterBurst as p, FX_ACTIONS as r, LASER_MS as s, BoltBurst as t, SPELL_FX_CHOICES as u, defaultFxPrefs as v, loadActivePack as w, exportCardFx as x, defaultLooks as y, spellChoice as z };
