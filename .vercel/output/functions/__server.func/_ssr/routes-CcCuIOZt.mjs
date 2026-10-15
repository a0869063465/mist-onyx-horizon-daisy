import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as tr, w as useLang } from "./router-D9l-mBhf.mjs";
import { n as sendNote, t as listNotes } from "./notes-hnFrJlbg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CcCuIOZt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const [wins, setWins] = (0, import_react.useState)(0);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	const [sent, setSent] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [fail, setFail] = (0, import_react.useState)(false);
	const [lock, setLock] = (0, import_react.useState)(false);
	const [code, setCode] = (0, import_react.useState)("");
	const [inbox, setInbox] = (0, import_react.useState)(null);
	const held = (0, import_react.useRef)(false);
	const timer = (0, import_react.useRef)(0);
	useLang();
	(0, import_react.useEffect)(() => {
		setWins(Number(localStorage.getItem("clash-wins") ?? "0") || 0);
	}, []);
	const close = () => {
		setOpen(false);
		setTitle("");
		setBody("");
		setFail(false);
	};
	const closeLock = () => {
		setLock(false);
		setCode("");
	};
	const arm = () => {
		held.current = false;
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => {
			held.current = true;
			close();
			setSent(false);
			setInbox(null);
			setLock(true);
		}, 420);
	};
	const drop = () => {
		window.clearTimeout(timer.current);
	};
	const submit = async () => {
		if (busy) return;
		if (!title.trim() && !body.trim()) return;
		setBusy(true);
		setFail(false);
		try {
			if (!(await sendNote({ data: {
				title,
				body
			} })).ok) {
				setFail(true);
				return;
			}
			close();
			setSent(true);
		} catch {
			setFail(true);
		} finally {
			setBusy(false);
		}
	};
	const unlock = async () => {
		if (code !== "3725") return;
		const notes = await listNotes({ data: { password: code } }).catch(() => []);
		closeLock();
		setInbox(notes);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "home",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mail-open",
				onContextMenu: (event) => event.preventDefault(),
				onPointerDown: arm,
				onPointerUp: drop,
				onPointerLeave: drop,
				onPointerCancel: drop,
				onClick: () => {
					if (held.current) return;
					setSent(false);
					closeLock();
					setInbox(null);
					setOpen(true);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					viewBox: "0 0 24 24",
					"aria-hidden": "true",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "3",
						y: "5",
						width: "18",
						height: "14",
						rx: "2"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 7l8 6 8-6" })]
				}), "Góp ý"]
			}),
			sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mail-sent",
				children: "Đã gửi"
			}) : null,
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mail-form",
				onSubmit: (event) => {
					event.preventDefault();
					submit();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Tên vấn đề hoặc lá bài", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: title,
						onChange: (event) => setTitle(event.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Chi tiết", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: body,
						onChange: (event) => setBody(event.target.value)
					})] }),
					fail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Chưa gửi được." }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: busy,
						children: "OK"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: close,
						children: "Huỷ"
					})] })
				]
			}) : null,
			lock ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mail-form",
				onSubmit: (event) => {
					event.preventDefault();
					unlock();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Mật khẩu", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: code,
					inputMode: "numeric",
					type: "password",
					onChange: (event) => setCode(event.target.value)
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					children: "OK"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: closeLock,
					children: "Huỷ"
				})] })]
			}) : null,
			inbox ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mail-form mail-box",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Hộp thư" }),
					inbox.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Chưa có góp ý." }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: inbox.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: note.title || "Không tên" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: note.created_at.slice(0, 16).replace("T", " ") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: note.body })
					] }, note.id)) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setInbox(null),
						children: "Huỷ"
					}) })
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "poster",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/title.png",
							alt: "Clash of the Beasts"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/modes",
							className: "hit hit-play",
							"aria-label": "Vào đấu trường"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/deck",
							className: "hit hit-deck",
							"aria-label": "Xây bộ bài"
						})
					]
				}),
				wins > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "win-note",
					children: [
						tr("Thành đã phá"),
						": ",
						wins
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "home-links",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/tune",
						children: tr("Tuỳ chỉnh bàn và lá")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/watch",
						children: tr("Thông tin")
					})]
				})
			] })
		]
	});
}
//#endregion
export { Home as component };
