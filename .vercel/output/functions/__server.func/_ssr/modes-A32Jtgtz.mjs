import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as tr, w as useLang } from "./router-D9l-mBhf.mjs";
import { r as loadDeck } from "./deck-DAKxYBzq.mjs";
import { n as openRoom, t as joinRoom } from "./net-room-BL71IoEz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/modes-A32Jtgtz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function remember(code, seat) {
	sessionStorage.setItem("clash-mode", "net");
	sessionStorage.setItem("clash-net", JSON.stringify({
		code,
		seat
	}));
}
function ModesPage() {
	const navigate = useNavigate();
	const [online, setOnline] = (0, import_react.useState)(false);
	const [code, setCode] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	useLang();
	function goLocal(mode) {
		sessionStorage.setItem("clash-mode", mode);
		sessionStorage.removeItem("clash-net");
		navigate({ to: "/play" });
	}
	async function host() {
		setBusy(true);
		setNote("");
		try {
			remember((await openRoom({ data: { deck: loadDeck() } })).code, "host");
			await navigate({ to: "/play" });
		} catch {
			setNote("Không tạo được mã.");
			setBusy(false);
		}
	}
	async function join() {
		const next = code.trim().toUpperCase();
		if (next.length < 4) {
			setNote("Nhập đủ 4 ký tự.");
			return;
		}
		setBusy(true);
		setNote("");
		try {
			const joined = await joinRoom({ data: {
				code: next,
				deck: loadDeck()
			} });
			if (!joined.ok) {
				setNote(joined.error);
				setBusy(false);
				return;
			}
			remember(joined.code, "guest");
			await navigate({ to: "/play" });
		} catch {
			setNote("Không vào được phòng.");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "watch",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "watch-back",
				children: tr("Về sân")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tr("Chọn cách chơi") }),
			online ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "room-box",
				onSubmit: (event) => {
					event.preventDefault();
					join();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Online" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						disabled: busy,
						onClick: () => void host(),
						children: tr("Lấy mã")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [tr("Nhập mã"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: code,
						maxLength: 4,
						autoCapitalize: "characters",
						onChange: (event) => setCode(event.target.value.toUpperCase())
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "act alt press",
						disabled: busy,
						children: tr("Vào mã")
					}),
					note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: note }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act alt press",
						onClick: () => setOnline(false),
						children: tr("Quay lại")
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mode-list",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						onClick: () => goLocal("ai"),
						children: tr("Vs Máy")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Vs Player" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						onClick: () => goLocal("hotseat"),
						children: tr("2 người 1 máy")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act alt press",
						onClick: () => setOnline(true),
						children: "Online"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						onClick: () => goLocal("test"),
						children: "Test"
					})
				]
			})
		]
	});
}
//#endregion
export { ModesPage as component };
