import { createServerFn } from "@tanstack/react-start";

export type NetDeck = { monsters: string[]; spells: string[] };
export type NetSeat = "host" | "guest";

type WireDuel = {
  turn: 0 | 1;
  step: "main" | "respond" | "over";
  winner: 0 | 1 | null;
  hold: { priority: 0 | 1 } | null;
};

type RoomRow = {
  host_deck: string;
  guest_deck: string | null;
  duel: string | null;
  rev: number | string;
  updated_at: number | string;
};

const TTL = 3 * 60 * 60 * 1000;
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function db() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

async function sweep() {
  const sql = await db();
  await sql`delete from clash_rooms where updated_at < ${Date.now() - TTL}`;
}

function deckOf(value: NetDeck): NetDeck {
  const list = (ids: unknown) =>
    Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && id.length < 80).slice(0, 40) : [];
  return { monsters: list(value?.monsters), spells: list(value?.spells) };
}

function readDeck(raw: string | null): NetDeck | null {
  if (!raw) return null;
  try {
    return deckOf(JSON.parse(raw) as NetDeck);
  } catch {
    return null;
  }
}

function actor(duel: WireDuel): 0 | 1 | null {
  if (duel.winner) return null;
  if (duel.step === "respond") return duel.hold?.priority ?? null;
  if (duel.step === "main") return duel.turn;
  return null;
}

function codeOf() {
  let code = "";
  for (let i = 0; i < 4; i += 1) code += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return code;
}

export const openRoom = createServerFn({ method: "POST" })
  .validator((data: { deck: NetDeck }) => data)
  .handler(async ({ data }) => {
    const sql = await db();
    await sweep();
    const deck = JSON.stringify(deckOf(data.deck));
    const now = Date.now();
    for (let n = 0; n < 8; n += 1) {
      const code = codeOf();
      const rows = await sql<{ code: string }>`
        insert into clash_rooms (code, host_deck, guest_deck, duel, rev, updated_at)
        values (${code}, ${deck}, null, null, 0, ${now})
        on conflict (code) do nothing
        returning code
      `;
      if (rows[0]) return { code: rows[0].code };
    }
    throw new Error("Không tạo được mã.");
  });

export const joinRoom = createServerFn({ method: "POST" })
  .validator((data: { code: string; deck: NetDeck }) => data)
  .handler(async ({ data }) => {
    const sql = await db();
    await sweep();
    const code = data.code.trim().toUpperCase();
    const deck = JSON.stringify(deckOf(data.deck));
    const rows = await sql<{ code: string }>`
      update clash_rooms
      set guest_deck = ${deck}, updated_at = ${Date.now()}
      where code = ${code} and guest_deck is null
      returning code
    `;
    if (rows[0]) return { ok: true as const, code };
    const found = await sql<{ guest_deck: string | null }>`select guest_deck from clash_rooms where code = ${code}`;
    if (!found[0]) return { ok: false as const, error: "Không thấy mã này." };
    return { ok: false as const, error: "Phòng đã có người." };
  });

export const pushDuel = createServerFn({ method: "POST" })
  .validator((data: { code: string; seat: NetSeat; duel: string }) => data)
  .handler(async ({ data }) => {
    if (data.duel.length > 200000) return { ok: false as const, error: "Ván không đọc được." };
    let duel: WireDuel;
    try {
      duel = JSON.parse(data.duel) as WireDuel;
    } catch {
      return { ok: false as const, error: "Ván không đọc được." };
    }
    const sql = await db();
    const rows = await sql<Pick<RoomRow, "duel" | "rev">>`select duel, rev from clash_rooms where code = ${data.code}`;
    const room = rows[0];
    if (!room) return { ok: false as const, error: "Phòng đã đóng." };
    let current: WireDuel | null = null;
    if (room.duel) {
      try {
        current = JSON.parse(room.duel) as WireDuel;
      } catch {
        current = null;
      }
    }
    const side = data.seat === "host" ? 0 : 1;
    const conceded = duel.winner !== null && duel.winner !== side;
    if (!current) {
      if (data.seat !== "host") return { ok: false as const, error: "Chưa tới lượt." };
    } else if (!conceded && actor(current) !== side) {
      return { ok: false as const, error: "Chưa tới lượt." };
    }
    const rev = Number(room.rev);
    const saved = await sql<{ rev: number | string }>`
      update clash_rooms
      set duel = ${data.duel}, rev = ${rev + 1}, updated_at = ${Date.now()}
      where code = ${data.code} and rev = ${rev}
      returning rev
    `;
    if (!saved[0]) return { ok: false as const, error: "Nước đi bị chồng. Thử lại." };
    return { ok: true as const, rev: Number(saved[0].rev) };
  });

export const pollRoom = createServerFn({ method: "POST" })
  .validator((data: { code: string; seat: NetSeat }) => data)
  .handler(async ({ data }) => {
    const sql = await db();
    const now = Date.now();
    await sql`delete from clash_rooms where updated_at < ${now - TTL}`;
    const rows = await sql<RoomRow>`
      select host_deck, guest_deck, duel, rev, updated_at from clash_rooms where code = ${data.code}
    `;
    const room = rows[0];
    if (!room) return { phase: "gone" as const, rev: 0, duel: "", guestDeck: null };
    if (now - Number(room.updated_at) > 60_000) {
      await sql`update clash_rooms set updated_at = ${now} where code = ${data.code}`;
    }
    return {
      phase: room.duel ? ("play" as const) : ("wait" as const),
      rev: Number(room.rev),
      duel: room.duel ?? "",
      guestDeck: data.seat === "host" && !room.duel ? readDeck(room.guest_deck) : null,
    };
  });
