import { createServerFn } from "@tanstack/react-start";

/** A deck sent to a room: its cards, and its name and cover for the VS screen (chủ game 22/10). */
export type NetDeck = { monsters: string[]; spells: string[]; name?: string; cover?: string | null; fake?: string[] };
export type NetSeat = "host" | "guest";

type Vote = "want" | "left" | null;

type WireDuel = {
  mid?: string;
  turn: 0 | 1;
  step: "main" | "respond" | "over";
  winner: 0 | 1 | null;
  hold: { priority: 0 | 1 } | null;
  opener?: { done: [boolean, boolean] } | null;
  again?: [Vote, Vote] | null;
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
  const text = (raw: unknown, max: number) => (typeof raw === "string" ? raw.slice(0, max) : undefined);
  return { monsters: list(value?.monsters), spells: list(value?.spells), fake: list(value?.fake), name: text(value?.name, 40), cover: text(value?.cover, 80) ?? null };
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
    // Đổi bài đầu trận: both sides choose at the same time, so a side still choosing may send its pick.
    const swapping = Boolean(current?.opener && !current.opener.done[side]);
    let body = data.duel;
    if (current && current.winner !== null && current.winner !== undefined) {
      // Chơi lại (Tuỳ chọn, chủ game 22/10): after a match each side sends its vote, which changes only that side's
      // vote on the finished match; once the guest wants to play again the host opens the next match.
      if (duel.winner === null) {
        if (side !== 0 || current.again?.[1] !== "want" || duel.mid === current.mid) return { ok: false as const, error: "Chưa tới lượt." };
      } else {
        const votes: [Vote, Vote] = [current.again?.[0] ?? null, current.again?.[1] ?? null];
        votes[side] = duel.again?.[side] ?? null;
        body = JSON.stringify({ ...current, again: votes });
      }
    } else if (current?.mid && duel.mid && current.mid !== duel.mid) {
      // A move from the match before (Chơi lại has opened a new one).
      return { ok: false as const, error: "Ván đã đổi." };
    } else if (!current) {
      if (data.seat !== "host") return { ok: false as const, error: "Chưa tới lượt." };
    } else if (!conceded && !swapping && actor(current) !== side) {
      return { ok: false as const, error: "Chưa tới lượt." };
    }
    const rev = Number(room.rev);
    const saved = await sql<{ rev: number | string }>`
      update clash_rooms
      set duel = ${body}, rev = ${rev + 1}, updated_at = ${Date.now()}
      where code = ${data.code} and rev = ${rev}
      returning rev
    `;
    if (!saved[0]) return { ok: false as const, error: "Nước đi bị chồng. Thử lại." };
    return { ok: true as const, rev: Number(saved[0].rev) };
  });

/** `deck`: the host also gets the guest's deck after the match has opened (Chơi lại opens the next one). */
export const pollRoom = createServerFn({ method: "POST" })
  .validator((data: { code: string; seat: NetSeat; deck?: boolean }) => data)
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
      guestDeck: data.seat === "host" && (!room.duel || data.deck) ? readDeck(room.guest_deck) : null,
    };
  });

/** A waiting player who stopped polling this long ago has left the queue. */
const QUEUE_STALE = 20_000;

type Seek =
  | { phase: "wait" }
  | { phase: "matched"; code: string; seat: NetSeat };

/**
 * Đánh thường (owner, 18/10): each waiting phone calls this every second or so with its ticket. Two waiting
 * players are paired into a new room; who hosts, and so who moves first, is random. The room already holds both
 * decks, so the match opens as soon as the host's game sees it.
 */
export const seekMatch = createServerFn({ method: "POST" })
  .validator((data: { ticket: string; deck: NetDeck }) => data)
  .handler(async ({ data }): Promise<Seek> => {
    const sql = await db();
    const now = Date.now();
    const ticket = String(data.ticket).slice(0, 64);
    await sql`delete from clash_queue where (code is null and updated_at < ${now - QUEUE_STALE}) or updated_at < ${now - TTL}`;
    const mine = await sql<{ code: string | null; seat: string | null }>`select code, seat from clash_queue where ticket = ${ticket}`;
    if (mine[0]?.code) return { phase: "matched", code: mine[0].code, seat: mine[0].seat === "host" ? "host" : "guest" };
    const deck = JSON.stringify(deckOf(data.deck));
    if (mine[0]) await sql`update clash_queue set updated_at = ${now} where ticket = ${ticket}`;
    else {
      await sql`
        insert into clash_queue (ticket, deck, code, seat, joined_at, updated_at)
        values (${ticket}, ${deck}, null, null, ${now}, ${now})
        on conflict (ticket) do nothing
      `;
    }
    const others = await sql<{ ticket: string; deck: string }>`
      select ticket, deck from clash_queue
      where ticket <> ${ticket} and code is null and updated_at >= ${now - QUEUE_STALE}
      order by joined_at
      limit 5
    `;
    for (const other of others) {
      const meHost = Math.random() < 0.5;
      const hostDeck = meHost ? deck : other.deck;
      const guestDeck = meHost ? other.deck : deck;
      let code = "";
      for (let n = 0; n < 8 && !code; n += 1) {
        const tried = codeOf();
        const made = await sql<{ code: string }>`
          insert into clash_rooms (code, host_deck, guest_deck, duel, rev, updated_at)
          values (${tried}, ${hostDeck}, ${guestDeck}, null, 0, ${now})
          on conflict (code) do nothing
          returning code
        `;
        if (made[0]) code = made[0].code;
      }
      if (!code) break;
      const mySeat = meHost ? "host" : "guest";
      const theirSeat = meHost ? "guest" : "host";
      const claimed = await sql<{ ticket: string }>`
        update clash_queue
        set code = ${code}, seat = case when ticket = ${ticket} then ${mySeat} else ${theirSeat} end, updated_at = ${now}
        where ticket in (${ticket}, ${other.ticket}) and code is null
        returning ticket
      `;
      if (claimed.length === 2) return { phase: "matched", code, seat: mySeat };
      // Someone else paired one of us first: undo this pairing and its room.
      await sql`update clash_queue set code = null, seat = null where code = ${code}`;
      await sql`delete from clash_rooms where code = ${code}`;
      const again = await sql<{ code: string | null; seat: string | null }>`select code, seat from clash_queue where ticket = ${ticket}`;
      if (again[0]?.code) return { phase: "matched", code: again[0].code, seat: again[0].seat === "host" ? "host" : "guest" };
    }
    return { phase: "wait" };
  });

/** Huỷ: leave the queue (a ticket already paired stays, and its room expires unplayed). */
export const leaveQueue = createServerFn({ method: "POST" })
  .validator((data: { ticket: string }) => data)
  .handler(async ({ data }) => {
    const sql = await db();
    await sql`delete from clash_queue where ticket = ${String(data.ticket).slice(0, 64)} and code is null`;
    return { ok: true as const };
  });
