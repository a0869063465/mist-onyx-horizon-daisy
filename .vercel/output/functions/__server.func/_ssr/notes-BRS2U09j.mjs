import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notes-BRS2U09j.js
function clip(value, max) {
	return typeof value === "string" ? value.trim().slice(0, max) : "";
}
var sendNote_createServerFn_handler = createServerRpc({
	id: "3f89063fe7151acb3c339cc3f995e1ae43ec9479b168d16664aadb3b1abf0afc",
	name: "sendNote",
	filename: "src/lib/notes.ts"
}, (opts) => sendNote.__executeServer(opts));
var sendNote = createServerFn({ method: "POST" }).validator((data) => data).handler(sendNote_createServerFn_handler, async ({ data }) => {
	const title = clip(data.title, 120);
	const body = clip(data.body, 2e3);
	if (!title && !body) return { ok: false };
	const { getSql } = await import("./db-C8oNZun-.mjs");
	await (await getSql())`insert into clash_notes (title, body) values (${title}, ${body})`;
	return { ok: true };
});
var listNotes_createServerFn_handler = createServerRpc({
	id: "9893a21cecf9328291c97894ea74488705ec15ba3d1f7ca6fc87d219049cfd2c",
	name: "listNotes",
	filename: "src/lib/notes.ts"
}, (opts) => listNotes.__executeServer(opts));
var listNotes = createServerFn({ method: "POST" }).validator((data) => data).handler(listNotes_createServerFn_handler, async ({ data }) => {
	if (data.password !== "3725") return [];
	const { getSql } = await import("./db-C8oNZun-.mjs");
	return (await getSql())`select id, title, body, created_at::text as created_at from clash_notes order by id desc limit 200`;
});
//#endregion
export { listNotes_createServerFn_handler, sendNote_createServerFn_handler };
