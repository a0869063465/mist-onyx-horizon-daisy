import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as tr, f as loadCard, m as loadSpell, w as useLang } from "./router-D9l-mBhf.mjs";
import { C as spellCard, c as artSrc, w as spellSrc } from "./catalog-DOYBjZ9O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/card-face-C68Pz_14.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAME_FLOOR = .75;
function FittedName({ spot, value }) {
	const ref = (0, import_react.useRef)(null);
	const [size, setSize] = (0, import_react.useState)(spot.size);
	(0, import_react.useLayoutEffect)(() => {
		const node = ref.current;
		const card = node?.parentElement;
		if (!node || !card) return;
		let dead = false;
		const linesAt = (next) => {
			node.style.fontSize = `${next}cqw`;
			node.style.height = "auto";
			const line = parseFloat(getComputedStyle(node).lineHeight) || 1;
			return node.scrollHeight / line;
		};
		const fit = () => {
			if (dead || card.clientWidth < 2) return;
			const base = spot.size;
			const floor = base * NAME_FLOOR;
			let next = base;
			if (linesAt(base) > 2.2) {
				let lo = floor;
				let hi = base;
				next = floor;
				for (let i = 0; i < 10; i++) {
					const mid = (lo + hi) / 2;
					if (linesAt(mid) <= 2.2) {
						next = mid;
						lo = mid;
					} else hi = mid;
				}
			}
			node.style.fontSize = `${next}cqw`;
			node.style.height = `${spot.height}%`;
			setSize((prev) => Math.abs(prev - next) < .01 ? prev : next);
		};
		fit();
		const watch = new ResizeObserver(fit);
		watch.observe(card);
		const onFonts = () => fit();
		document.fonts?.addEventListener("loadingdone", onFonts);
		document.fonts?.ready.then(onFonts);
		return () => {
			dead = true;
			watch.disconnect();
			document.fonts?.removeEventListener("loadingdone", onFonts);
		};
	}, [
		value,
		spot.size,
		spot.width,
		spot.height
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		ref,
		className: "socket is-name",
		style: {
			left: `${spot.x}%`,
			top: `${spot.y}%`,
			width: `${spot.width}%`,
			height: `${spot.height}%`,
			fontSize: `${size}cqw`
		},
		children: value
	});
}
function NewMark({ spot, kind }) {
	const src = kind === "up" ? "/mark-tang.png" : kind === "down" ? "/mark-giam.png" : "/mark-moi.png";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "socket is-new",
		style: {
			left: `${spot.x}%`,
			top: `${spot.y}%`,
			width: `${spot.width}%`,
			height: `${spot.height}%`
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			draggable: false
		})
	});
}
function CardFace({ monster, spellId, level = 1, dim = false, selected = false, hideStats = false, showNew = false, mark = null, layout, spellLayout, live, gems }) {
	const badge = mark ?? (showNew ? "new" : null);
	const spell = spellId ? spellCard(spellId) : void 0;
	useLang();
	const spots = layout ?? loadCard();
	const spellSpots = spellLayout ?? loadSpell();
	const tier = monster ? monsterTier(monster.stars) : spell ? spellTier(spell.gems) : "";
	const pin = (spot, value, name = false) => hideStats || !name && value === 0 ? null : name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FittedName, {
		spot,
		value: String(value)
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "socket",
		style: {
			left: `${spot.x}%`,
			top: `${spot.y}%`,
			width: `${spot.width}%`,
			height: `${spot.height}%`,
			fontSize: `${spot.size}cqw`
		},
		children: value
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `card${spell ? " is-spell" : ""}${tier}${dim ? " is-dim" : ""}${selected ? " is-selected" : ""}`,
		children: [
			monster ? artSrc(monster.id, level) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: "art",
				src: artSrc(monster.id, level),
				alt: "",
				draggable: false
			}) : null : spell ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: "art",
				src: spellSrc(spell.id),
				alt: "",
				draggable: false
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: "frame",
				src: spell ? "/spell-frame.png" : "/card-frame.png",
				alt: "",
				draggable: false
			}),
			monster ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				pin(spots.stars, monster.stars),
				pin(spots.gems, gems ?? monster.gems),
				pin(spots.def, live?.def ?? monster.def),
				pin(spots.mdef, live?.mdef ?? monster.mdef),
				pin(spots.atk, live?.atk ?? monster.atk),
				pin(spots.hp, live?.hp ?? monster.hp),
				pin(spots.name, tr(live?.name ?? monster.name), true),
				badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewMark, {
					spot: spots.fresh,
					kind: badge
				}) : null
			] }) : spell ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				pin(spellSpots.gems, gems ?? spell.gems),
				pin(spellSpots.name, tr(spell.name), true),
				badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewMark, {
					spot: spellSpots.fresh,
					kind: badge
				}) : null
			] }) : null
		]
	});
}
function monsterTier(stars) {
	if (stars >= 5) return " is-tier-black";
	if (stars >= 4) return " is-tier-purple";
	if (stars === 3) return " is-tier-red";
	if (stars === 2) return " is-tier-yellow";
	return "";
}
function spellTier(gems) {
	if (gems >= 3) return " is-tier-purple";
	if (gems === 2) return " is-tier-red";
	if (gems === 1) return " is-tier-orange";
	return "";
}
//#endregion
export { CardFace as t };
