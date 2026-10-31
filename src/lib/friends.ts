import { createServerFn } from "@tanstack/react-start";

/**
 * Bạn bè (chủ game 31/10): mỗi máy có một ID 8 ký tự (gắn với máy), thêm bạn bằng ID, lời mời kết bạn, mời vào
 * trận (lời mời hết hạn sau 60 giây) và trạng thái: trong trận thì ghi chế độ đang chơi, ngoài trận "Đang chờ".
 */

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ID_LENGTH = 8;
/** Lời mời vào trận hết hạn sau chừng này. */
export const INVITE_MS = 60_000;
/** Không báo trạng thái quá lâu thì coi như đã rời trận (tắt app giữa trận). */
const STALE_MS = 45_000;
/** Bản chụp trận cũ hơn chừng này thì không còn xem được. */
const WATCH_STALE = 3 * 60_000;
/** Có người xem trong chừng này thì trận trên máy (Vs Máy, Test) gửi bản chụp lên. */
const WATCHED_MS = 15_000;

export type FriendMode = "ai" | "test" | "quick" | "custom" | "tutorial" | "trial";
const MODES: FriendMode[] = ["ai", "test", "quick", "custom", "tutorial", "trial"];

export type FriendRow = { id: string; cover: string | null; mode: FriendMode | null; watch: boolean };
export type AskRow = { id: string; cover: string | null; at: number };
export type InviteRow = { id: string; from: string; cover: string | null; code: string; at: number };
export type ReplyRow = { id: string; to: string; state: "no" | "late" };

export function cleanId(raw: unknown): string {
  return typeof raw === "string" ? raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ID_LENGTH) : "";
}

export function validId(id: string): boolean {
  return id.length === ID_LENGTH && [...id].every((ch) => LETTERS.includes(ch));
}

function pair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

function randomId(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return out;
}

async function db() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

function modeOf(raw: unknown): FriendMode | null {
  return MODES.includes(raw as FriendMode) ? (raw as FriendMode) : null;
}

function text(raw: unknown, max: number): string | null {
  return typeof raw === "string" && raw ? raw.slice(0, max) : null;
}

async function areFriends(sql: Awaited<ReturnType<typeof db>>, x: string, y: string): Promise<boolean> {
  const [a, b] = pair(x, y);
  const rows = await sql<{ status: string }>`select status from clash_friends where a = ${a} and b = ${b}`;
  return rows[0]?.status === "friend";
}

type PulseIn = { id: string; cover?: string | null; mode?: string | null; room?: string | null; seat?: string | null };

/** Mỗi vài giây: báo trạng thái, nhận lời mời vào trận, lời mời kết bạn đang chờ, và lời mời mình gửi bị từ chối. */
export const pulse = createServerFn({ method: "POST" })
  .validator((data: PulseIn) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    if (!validId(id)) return { ok: false as const, invites: [] as InviteRow[], asks: 0, replies: [] as ReplyRow[], watched: false };
    const sql = await db();
    const now = Date.now();
    const mode = modeOf(data.mode);
    const room = mode === "quick" || mode === "custom" ? text(data.room, 8) : null;
    const seat = room && (data.seat === "host" || data.seat === "guest") ? data.seat : null;
    const cover = text(data.cover, 80);
    await sql`
      insert into clash_players (id, cover, mode, room, seat, seen_at)
      values (${id}, ${cover}, ${mode}, ${room}, ${seat}, ${now})
      on conflict (id) do update set cover = ${cover}, mode = ${mode}, room = ${room}, seat = ${seat}, seen_at = ${now}
    `;
    if (!mode) await sql`delete from clash_watch where player_id = ${id}`;
    await sql`delete from clash_invites where created_at < ${now - 10 * 60_000}`;
    const invites = await sql<{ id: string; from_id: string; code: string; created_at: number; cover: string | null }>`
      select i.id, i.from_id, i.code, i.created_at, p.cover
      from clash_invites i left join clash_players p on p.id = i.from_id
      where i.to_id = ${id} and i.state = 'open' and i.created_at >= ${now - INVITE_MS}
      order by i.created_at
    `;
    const sent = await sql<{ id: string; to_id: string; state: string; created_at: number }>`
      select id, to_id, state, created_at from clash_invites
      where from_id = ${id} and (state = 'no' or (state = 'open' and created_at < ${now - INVITE_MS}))
    `;
    if (sent.length) {
      await sql.query(`delete from clash_invites where id = any($1)`, [sent.map((row) => row.id)]);
    }
    const watchedRows = await sql<{ watched_at: number | null }>`select watched_at from clash_players where id = ${id}`;
    const watched = Number(watchedRows[0]?.watched_at ?? 0) >= now - WATCHED_MS;
    const asks = await sql<{ n: number }>`
      select count(*) as n from clash_friends where status = 'ask' and from_id <> ${id} and (a = ${id} or b = ${id})
    `;
    return {
      ok: true as const,
      invites: invites.map((row) => ({ id: row.id, from: row.from_id, cover: row.cover, code: row.code, at: Number(row.created_at) })),
      asks: Number(asks[0]?.n ?? 0),
      replies: sent.map((row) => ({ id: row.id, to: row.to_id, state: row.state === "no" ? ("no" as const) : ("late" as const) })),
      watched,
    };
  });

/** Danh sách bạn, lời mời kết bạn tới mình, lời mời mình đã gửi. */
export const friendList = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    const empty = { friends: [] as FriendRow[], asks: [] as AskRow[], sent: [] as AskRow[] };
    if (!validId(id)) return empty;
    const sql = await db();
    const now = Date.now();
    const rows = await sql<{ other: string; from_id: string; status: string; created_at: number; cover: string | null; mode: string | null; seen_at: number | null }>`
      select case when f.a = ${id} then f.b else f.a end as other, f.from_id, f.status, f.created_at,
        p.cover, p.mode, p.seen_at
      from clash_friends f
      left join clash_players p on p.id = case when f.a = ${id} then f.b else f.a end
      where f.a = ${id} or f.b = ${id}
      order by f.created_at desc
    `;
    for (const row of rows) {
      if (row.status === "friend") {
        const fresh = row.seen_at !== null && Number(row.seen_at) >= now - STALE_MS;
        const mode = fresh ? modeOf(row.mode) : null;
        const watch = mode === "ai" || mode === "test" || mode === "quick" || mode === "custom";
        empty.friends.push({ id: row.other, cover: row.cover, mode, watch });
      } else if (row.from_id === id) empty.sent.push({ id: row.other, cover: row.cover, at: Number(row.created_at) });
      else empty.asks.push({ id: row.other, cover: row.cover, at: Number(row.created_at) });
    }
    return empty;
  });

export const addFriend = createServerFn({ method: "POST" })
  .validator((data: { id: string; to: string }) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    const to = cleanId(data.to);
    if (!validId(id)) return { ok: false as const, error: "Chưa có ID." };
    if (!validId(to)) return { ok: false as const, error: "ID có 8 ký tự." };
    if (to === id) return { ok: false as const, error: "Đây là ID của bạn." };
    const sql = await db();
    const found = await sql<{ id: string }>`select id from clash_players where id = ${to}`;
    if (!found[0]) return { ok: false as const, error: "Không thấy ID này." };
    const [a, b] = pair(id, to);
    const rows = await sql<{ from_id: string; status: string }>`select from_id, status from clash_friends where a = ${a} and b = ${b}`;
    const row = rows[0];
    if (row?.status === "friend") return { ok: false as const, error: "Đã là bạn." };
    if (row && row.from_id === id) return { ok: false as const, error: "Đã gửi lời mời." };
    if (row) {
      // Người kia đã mời mình: thêm lại là đồng ý luôn.
      await sql`update clash_friends set status = 'friend' where a = ${a} and b = ${b}`;
      return { ok: true as const, friend: true };
    }
    await sql`
      insert into clash_friends (a, b, from_id, status, created_at)
      values (${a}, ${b}, ${id}, 'ask', ${Date.now()})
      on conflict (a, b) do nothing
    `;
    return { ok: true as const, friend: false };
  });

export const answerFriend = createServerFn({ method: "POST" })
  .validator((data: { id: string; from: string; yes: boolean }) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    const from = cleanId(data.from);
    if (!validId(id) || !validId(from)) return { ok: false as const };
    const sql = await db();
    const [a, b] = pair(id, from);
    if (data.yes) await sql`update clash_friends set status = 'friend' where a = ${a} and b = ${b} and status = 'ask' and from_id = ${from}`;
    else await sql`delete from clash_friends where a = ${a} and b = ${b} and status = 'ask' and from_id = ${from}`;
    return { ok: true as const };
  });

/** Xoá bạn, hoặc huỷ lời mời kết bạn mình đã gửi. */
export const removeFriend = createServerFn({ method: "POST" })
  .validator((data: { id: string; other: string }) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    const other = cleanId(data.other);
    if (!validId(id) || !validId(other)) return { ok: false as const };
    const sql = await db();
    const [a, b] = pair(id, other);
    await sql`delete from clash_friends where a = ${a} and b = ${b}`;
    return { ok: true as const };
  });

export const inviteFriend = createServerFn({ method: "POST" })
  .validator((data: { id: string; to: string; code: string }) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    const to = cleanId(data.to);
    const code = cleanId(data.code).slice(0, 4);
    if (!validId(id) || !validId(to) || code.length !== 4) return { ok: false as const, error: "Không gửi được lời mời." };
    const sql = await db();
    if (!(await areFriends(sql, id, to))) return { ok: false as const, error: "Hai bạn chưa kết bạn." };
    await sql`delete from clash_invites where from_id = ${id} and to_id = ${to}`;
    await sql`
      insert into clash_invites (id, from_id, to_id, code, state, created_at)
      values (${randomId(12)}, ${id}, ${to}, ${code}, 'open', ${Date.now()})
    `;
    return { ok: true as const };
  });

export const answerInvite = createServerFn({ method: "POST" })
  .validator((data: { id: string; invite: string; yes: boolean }) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    const invite = typeof data.invite === "string" ? data.invite.slice(0, 20) : "";
    const sql = await db();
    const rows = await sql<{ code: string; created_at: number }>`
      update clash_invites set state = ${data.yes ? "yes" : "no"}
      where id = ${invite} and to_id = ${id} and state = 'open'
      returning code, created_at
    `;
    const row = rows[0];
    if (!row || Number(row.created_at) < Date.now() - INVITE_MS) return { ok: false as const, error: "Lời mời đã hết hạn." };
    return { ok: true as const, code: row.code };
  });

/** Xem trận (đợt B): trận chạy trên máy (Vs Máy, Test) gửi bản chụp sau mỗi nước. */
export const pushWatch = createServerFn({ method: "POST" })
  .validator((data: { id: string; duel: string; rev: number }) => data)
  .handler(async ({ data }) => {
    const id = cleanId(data.id);
    if (!validId(id) || typeof data.duel !== "string" || data.duel.length > 300000) return { ok: false as const };
    const sql = await db();
    const now = Date.now();
    const rev = Math.max(0, Math.floor(Number(data.rev) || 0));
    await sql`
      insert into clash_watch (player_id, duel, rev, updated_at) values (${id}, ${data.duel}, ${rev}, ${now})
      on conflict (player_id) do update set duel = ${data.duel}, rev = ${rev}, updated_at = ${now}
    `;
    return { ok: true as const };
  });

export type WatchView =
  | { phase: "play"; duel: string; rev: number; side: 0 | 1; mode: FriendMode }
  | { phase: "wait" }
  | { phase: "gone" };

/** Người xem: đọc trận bạn mình đang đánh (chỉ bạn bè mới xem được). `side` = bên của bạn mình trong trận. */
export const readWatch = createServerFn({ method: "POST" })
  .validator((data: { id: string; friend: string }) => data)
  .handler(async ({ data }): Promise<WatchView> => {
    const id = cleanId(data.id);
    const friend = cleanId(data.friend);
    if (!validId(id) || !validId(friend)) return { phase: "gone" };
    const sql = await db();
    if (!(await areFriends(sql, id, friend))) return { phase: "gone" };
    const now = Date.now();
    const players = await sql<{ mode: string | null; room: string | null; seat: string | null; seen_at: number }>`
      select mode, room, seat, seen_at from clash_players where id = ${friend}
    `;
    const player = players[0];
    const mode = player && Number(player.seen_at) >= now - STALE_MS ? modeOf(player.mode) : null;
    if (!player || !mode) return { phase: "gone" };
    await sql`update clash_players set watched_at = ${now} where id = ${friend}`;
    if ((mode === "quick" || mode === "custom") && player.room) {
      const rooms = await sql<{ duel: string | null; rev: number }>`select duel, rev from clash_rooms where code = ${player.room}`;
      const room = rooms[0];
      if (!room) return { phase: "gone" };
      if (!room.duel) return { phase: "wait" };
      return { phase: "play", duel: room.duel, rev: Number(room.rev), side: player.seat === "guest" ? 1 : 0, mode };
    }
    const shots = await sql<{ duel: string; rev: number; updated_at: number }>`
      select duel, rev, updated_at from clash_watch where player_id = ${friend}
    `;
    const shot = shots[0];
    if (!shot || Number(shot.updated_at) < now - WATCH_STALE) return { phase: "wait" };
    return { phase: "play", duel: shot.duel, rev: Number(shot.rev), side: 0, mode };
  });
