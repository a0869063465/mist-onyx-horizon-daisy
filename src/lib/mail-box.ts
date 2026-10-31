import { useEffect, useState } from "react";
import { MAILS, MAIL_DAYS, type Mail, type MailKind } from "@/lib/mails";
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

/** The tab a letter is in: as the owner set it, else gift if it carries a gift, else plain. */
export function kindOf(mail: Mail): MailKind {
  return mail.kind ?? ((mail.gifts?.length ?? 0) > 0 ? "gift" : "mail");
}

export type MailRow = { mail: Mail; kind: MailKind; got: number; read: boolean; claimed: boolean; left: number; owing: boolean };

/** The letters of this phone, newest first (news by its own day). Plain letters go after their days; news never does. */
export function mailRows(now = Date.now(), kind?: MailKind): MailRow[] {
  const box = load();
  const rows: Array<MailRow & { index: number }> = [];
  MAILS.forEach((mail, index) => {
    const entry = box[mail.id];
    if (!entry || entry.gone) return;
    const mine = kindOf(mail);
    if (kind && mine !== kind) return;
    const days = mail.days ?? MAIL_DAYS;
    const ends = entry.got + days * DAY;
    if (mine !== "news" && now >= ends) return;
    rows.push({ mail, index, kind: mine, got: entry.got, read: entry.read, claimed: entry.claimed, left: mine === "news" ? 0 : Math.ceil((ends - now) / DAY), owing: (mail.gifts?.length ?? 0) > 0 && !entry.claimed });
  });
  const when = (row: MailRow) => (row.kind === "news" && row.mail.date ? Date.parse(row.mail.date) || row.got : row.got);
  rows.sort((a, b) => when(b) - when(a) || b.index - a.index);
  return rows;
}

/** Letters not read, or with a gift not claimed: the red dot on the menu and on a tab. */
export function unseenCount(now = Date.now(), kind?: MailKind): number {
  return mailRows(now, kind).filter((row) => !row.read || row.owing).length;
}

/** The count for each tab. */
export function unseenByKind(rows: MailRow[]): Record<MailKind, number> {
  const out: Record<MailKind, number> = { mail: 0, warn: 0, gift: 0, news: 0 };
  for (const row of rows) if (!row.read || row.owing) out[row.kind] += 1;
  return out;
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

export function claimAll(kind?: MailKind): Claimed | null {
  const rows = mailRows(Date.now(), kind).filter((row) => row.owing);
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
  if (!row || row.owing || row.kind === "news") return false;
  const box = load();
  box[id].gone = true;
  save(box);
  return true;
}

export function deletableCount(kind?: MailKind): number {
  return mailRows(Date.now(), kind).filter((row) => row.kind !== "news" && row.read && !row.owing).length;
}

export function deleteRead(kind?: MailKind): number {
  const rows = mailRows(Date.now(), kind).filter((row) => row.kind !== "news" && row.read && !row.owing);
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

/** The day of a letter: news shows the day the owner set, the others the day this phone got them. */
export function mailDay(row: MailRow): string {
  if (row.kind === "news" && row.mail.date) {
    const [year, month, day] = row.mail.date.split("-");
    if (year && month && day) return `${day}/${month}/${year}`;
  }
  return formatDay(row.got);
}

export function formatDay(ms: number): string {
  const date = new Date(ms);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}
