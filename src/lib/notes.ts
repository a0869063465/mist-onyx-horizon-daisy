import { createServerFn } from "@tanstack/react-start";

export type Note = { id: number; title: string; body: string; created_at: string };

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const sendNote = createServerFn({ method: "POST" })
  .validator((data: { title: string; body: string }) => data)
  .handler(async ({ data }) => {
    const title = clip(data.title, 120);
    const body = clip(data.body, 2000);
    if (!title && !body) return { ok: false as const };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`insert into clash_notes (title, body) values (${title}, ${body})`;
    return { ok: true as const };
  });

export const listNotes = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (data.password !== "3725") return [] as Note[];
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<Note>`select id, title, body, created_at::text as created_at from clash_notes order by id desc limit 200`;
  });
