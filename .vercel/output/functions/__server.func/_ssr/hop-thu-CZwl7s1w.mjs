import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as listNotes } from "./notes-hnFrJlbg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hop-thu-CZwl7s1w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Inbox() {
	const [code, setCode] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)(null);
	const open = async () => {
		if (code !== "3725") return;
		const rows = await listNotes({ data: { password: code } }).catch(() => []);
		setNotes(rows);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "inbox",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "home-links",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Màn hình chính"
			})
		}), notes === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mail-form is-page",
			onSubmit: (event) => {
				event.preventDefault();
				open();
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Mật khẩu", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: code,
				inputMode: "numeric",
				type: "password",
				onChange: (event) => setCode(event.target.value)
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				children: "OK"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Huỷ"
			})] })]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Hộp thư" }),
			notes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Chưa có góp ý." }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: notes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: note.title || "Không tên" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: note.created_at.slice(0, 16).replace("T", " ") }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: note.body })
			] }, note.id)) })
		] })]
	});
}
//#endregion
export { Inbox as component };
