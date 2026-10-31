import { useEffect, useState } from "react";
import { MAILS, MAIL_DAYS, type Mail } from "@/lib/mails";
import { addOwned, addStars, ownedIds } from "@/lib/shop";

/**
 * Thư (chủ game 31/10), the player's side: which letters this phone got, when, and what was read, claimed or deleted.
 * A letter lives its days (30 unless it says) from the moment this phone got it, then goes, gifts unclaimed and all.
 */
type Entry = { got: number; read: boolean; claimed: boolean; gone: boolean };
type Box = Record<string, Entry>;

const KEY = "clash-mail";
const DAY = 86_400_000;
const listeners = new Set<() => void>();

function load(): Box {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    return raw && typeof raw === "object" ? (raw as Box) : {};
  } catch {
    return {};
  }
}

function save(box: Box) {
  try {
    localStorage.setItem(KEY, JSON.stringify(box));
  } catch {
    // Only for this visit then.
  }
  for (const hear of listeners) hear();
}

/** Letters the owner added since the last visit arrive now. */
export function syncMail(now = Date.now()) {
  const box = load();
  let changed = false;
  for (const mail of MAILS) {
    if (box[mail.id]) continue;
    box[mail.id] = { got: now, read: false, claimed: false, gone: false };
    changed = true;
  }
  if (changed) save(box);
}

export type MailRow = { mail: Mail; got: number; read: boolean; claimed: boolean; left: number; owing: boolean };

export function mailRows(now = Date.now()): MailRow[] {
  const box = load();
  const rows: Array<MailRow & { index: number }> = [];
  MAILS.forEach((mail, index) => {
    const entry = box[mail.id];
    if (!entry || entry.gone) return;
    const ends = entry.got + (mail.days ?? MAIL_DAYS) * DAY;
    if (now >= ends) return;
    rows.push({ mail, index, got: entry.got, read: entry.read, claimed: entry.claimed, left: Math.ceil((ends - now) / DAY), owing: (mail.gifts?.length ?? 0) > 0 && !entry.claimed });
  });
  rows.sort((a, b) => b.got - a.got || b.index - a.index);
  return rows;
}

/** Letters not read, or with a gift not claimed: the red dot on the menu. */
export function unseenCount(now = Date.now()): number {
  return mailRows(now).filter((row) => !row.read || row.owing).length;
}

export function markRead(id: string) {
  const box = load();
  if (!box[id] || box[id].read) return;
  box[id].read = true;
  save(box);
}

export type Claimed = { stars: number; refund: number; cards: Array<{ id: string; fresh: boolean }> };

/** Gifts are kept at once (stars added, cards owned, a card owned already gives 1 star back), then the flag is set. */
function take(row: MailRow, box: Box, into: Claimed) {
  const owned = ownedIds();
  for (const gift of row.mail.gifts ?? []) {
    if (gift.kind === "stars") {
      addStars(gift.n);
      into.stars += gift.n;
    } else if (owned.has(gift.id)) {
      addStars(1);
      into.refund += 1;
      into.cards.push({ id: gift.id, fresh: false });
    } else {
      addOwned(gift.id);
      owned.add(gift.id);
      into.cards.push({ id: gift.id, fresh: true });
    }
  }
  box[row.mail.id].claimed = true;
  box[row.mail.id].read = true;
}

export function claimMail(id: string): Claimed | null {
  const row = mailRows().find((one) => one.mail.id === id);
  if (!row || !row.owing) return null;
  const box = load();
  const got: Claimed = { stars: 0, refund: 0, cards: [] };
  take(row, box, got);
  save(box);
  return got;
}

export function claimAll(): Claimed | null {
  const rows = mailRows().filter((row) => row.owing);
  if (rows.length === 0) return null;
  const box = load();
  const got: Claimed = { stars: 0, refund: 0, cards: [] };
  for (const row of rows) take(row, box, got);
  save(box);
  return got;
}

/** A letter with a gift not claimed is not deleted (a slip of the finger would lose it). */
export function deleteMail(id: string): boolean {
  const row = mailRows().find((one) => one.mail.id === id);
  if (!row || row.owing) return false;
  const box = load();
  box[id].gone = true;
  save(box);
  return true;
}

export function deletableCount(): number {
  return mailRows().filter((row) => row.read && !row.owing).length;
}

export function deleteRead(): number {
  const rows = mailRows().filter((row) => row.read && !row.owing);
  if (rows.length === 0) return 0;
  const box = load();
  for (const row of rows) box[row.mail.id].gone = true;
  save(box);
  return rows.length;
}

/** Publisher tool: forget what this phone got, to see the letters arrive again. */
export function resetMail() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
  syncMail();
}

/** The letters now, read after the first render so the server's page matches; follows every change. */
export function useMail(): MailRow[] {
  const [rows, setRows] = useState<MailRow[]>([]);
  useEffect(() => {
    const refresh = () => {
      syncMail();
      setRows(mailRows());
    };
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, []);
  return rows;
}

export function formatDay(ms: number): string {
  const date = new Date(ms);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}
