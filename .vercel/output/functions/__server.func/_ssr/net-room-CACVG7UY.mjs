import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/net-room-CACVG7UY.js
var TTL = 108e5;
var LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
async function db() {
	const { getSql } = await import("./db-C8oNZun-.mjs");
	return getSql();
}
async function sweep() {
	await (await db())`delete from clash_rooms where updated_at < ${Date.now() - TTL}`;
}
function deckOf(value) {
	const list = (ids) => Array.isArray(ids) ? ids.filter((id) => typeof id === "string" && id.length < 80).slice(0, 40) : [];
	return {
		monsters: list(value?.monsters),
		spells: list(value?.spells)
	};
}
function readDeck(raw) {
	if (!raw) return null;
	try {
		return deckOf(JSON.parse(raw));
	} catch {
		return null;
	}
}
function actor(duel) {
	if (duel.winner) return null;
	if (duel.step === "respond") return duel.hold?.priority ?? null;
	if (duel.step === "main") return duel.turn;
	return null;
}
function codeOf() {
	let code = "";
	for (let i = 0; i < 4; i += 1) code += LETTERS[Math.floor(Math.random() * 32)];
	return code;
}
var openRoom_createServerFn_handler = createServerRpc({
	id: "9c515b5ab74ba576fee659189c3a54a59530c677852757366ae3d985490de28d",
	name: "openRoom",
	filename: "src/lib/net-room.ts"
}, (opts) => openRoom.__executeServer(opts));
var openRoom = createServerFn({ method: "POST" }).validator((data) => data).handler(openRoom_createServerFn_handler, async ({ data }) => {
	const sql = await db();
	await sweep();
	const deck = JSON.stringify(deckOf(data.deck));
	const now = Date.now();
	for (let n = 0; n < 8; n += 1) {
		const rows = await sql`
        insert into clash_rooms (code, host_deck, guest_deck, duel, rev, updated_at)
        values (${codeOf()}, ${deck}, null, null, 0, ${now})
        on conflict (code) do nothing
        returning code
      `;
		if (rows[0]) return { code: rows[0].code };
	}
	throw new Error("Không tạo được mã.");
});
var joinRoom_createServerFn_handler = createServerRpc({
	id: "15ecc3e755df3b9ed0ec9f8129ac6476b1e87c909c14de331df347c1d6df1f6f",
	name: "joinRoom",
	filename: "src/lib/net-room.ts"
}, (opts) => joinRoom.__executeServer(opts));
var joinRoom = createServerFn({ method: "POST" }).validator((data) => data).handler(joinRoom_createServerFn_handler, async ({ data }) => {
	const sql = await db();
	await sweep();
	const code = data.code.trim().toUpperCase();
	if ((await sql`
      update clash_rooms
      set guest_deck = ${JSON.stringify(deckOf(data.deck))}, updated_at = ${Date.now()}
      where code = ${code} and guest_deck is null
      returning code
    `)[0]) return {
		ok: true,
		code
	};
	if (!(await sql`select guest_deck from clash_rooms where code = ${code}`)[0]) return {
		ok: false,
		error: "Không thấy mã này."
	};
	return {
		ok: false,
		error: "Phòng đã có người."
	};
});
var pushDuel_createServerFn_handler = createServerRpc({
	id: "d5ecf24ba4072f599dc81f8181e26fb47b3bf086a2d8d53b8c743e9ea41a78b6",
	name: "pushDuel",
	filename: "src/lib/net-room.ts"
}, (opts) => pushDuel.__executeServer(opts));
var pushDuel = createServerFn({ method: "POST" }).validator((data) => data).handler(pushDuel_createServerFn_handler, async ({ data }) => {
	if (data.duel.length > 2e5) return {
		ok: false,
		error: "Ván không đọc được."
	};
	let duel;
	try {
		duel = JSON.parse(data.duel);
	} catch {
		return {
			ok: false,
			error: "Ván không đọc được."
		};
	}
	const sql = await db();
	const room = (await sql`select duel, rev from clash_rooms where code = ${data.code}`)[0];
	if (!room) return {
		ok: false,
		error: "Phòng đã đóng."
	};
	let current = null;
	if (room.duel) try {
		current = JSON.parse(room.duel);
	} catch {
		current = null;
	}
	const side = data.seat === "host" ? 0 : 1;
	const conceded = duel.winner !== null && duel.winner !== side;
	if (!current) {
		if (data.seat !== "host") return {
			ok: false,
			error: "Chưa tới lượt."
		};
	} else if (!conceded && actor(current) !== side) return {
		ok: false,
		error: "Chưa tới lượt."
	};
	const rev = Number(room.rev);
	const saved = await sql`
      update clash_rooms
      set duel = ${data.duel}, rev = ${rev + 1}, updated_at = ${Date.now()}
      where code = ${data.code} and rev = ${rev}
      returning rev
    `;
	if (!saved[0]) return {
		ok: false,
		error: "Nước đi bị chồng. Thử lại."
	};
	return {
		ok: true,
		rev: Number(saved[0].rev)
	};
});
var pollRoom_createServerFn_handler = createServerRpc({
	id: "05d40818bc546e2e078d59d041621272806464b17ff29de63862bc624fd86bc6",
	name: "pollRoom",
	filename: "src/lib/net-room.ts"
}, (opts) => pollRoom.__executeServer(opts));
var pollRoom = createServerFn({ method: "POST" }).validator((data) => data).handler(pollRoom_createServerFn_handler, async ({ data }) => {
	const sql = await db();
	const now = Date.now();
	await sql`delete from clash_rooms where updated_at < ${now - TTL}`;
	const room = (await sql`
      select host_deck, guest_deck, duel, rev, updated_at from clash_rooms where code = ${data.code}
    `)[0];
	if (!room) return {
		phase: "gone",
		rev: 0,
		duel: "",
		guestDeck: null
	};
	if (now - Number(room.updated_at) > 6e4) await sql`update clash_rooms set updated_at = ${now} where code = ${data.code}`;
	return {
		phase: room.duel ? "play" : "wait",
		rev: Number(room.rev),
		duel: room.duel ?? "",
		guestDeck: data.seat === "host" && !room.duel ? readDeck(room.guest_deck) : null
	};
});
//#endregion
export { joinRoom_createServerFn_handler, openRoom_createServerFn_handler, pollRoom_createServerFn_handler, pushDuel_createServerFn_handler };
