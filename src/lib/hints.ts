/**
 * Gợi ý khi người chơi gặp vấn đề (chủ game 03/11): chỉ hiện khi cùng một hành vi lặp `HINT_AFTER` lần, và mỗi gợi ý
 * chỉ một lần, lưu trên máy. Bấm >> thì đóng, không thì tự tắt sau `HINT_MS`.
 */
const KEY = "clash-hints";
export const HINT_AFTER = 3;
export const HINT_MS = 8000;

type Book = { n: Record<string, number>; seen: Record<string, boolean> };

function read(): Book {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Book>;
    return { n: raw.n ?? {}, seen: raw.seen ?? {} };
  } catch {
    return { n: {}, seen: {} };
  }
}

function write(book: Book) {
  try {
    localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    // Only this visit then.
  }
}

/** One more time the player did it: true when the hint should show now (third time, never shown before). */
export function countHint(id: string): boolean {
  const book = read();
  if (book.seen[id]) return false;
  book.n[id] = (book.n[id] ?? 0) + 1;
  if (book.n[id] < HINT_AFTER) {
    write(book);
    return false;
  }
  book.seen[id] = true;
  write(book);
  return true;
}

/** Nhà phát hành: đặt lại để thử. */
export function resetHints() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to reset.
  }
}
