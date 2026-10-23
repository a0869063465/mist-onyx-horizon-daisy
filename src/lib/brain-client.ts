import type { Act } from "./brain.ts";
import type { Duel } from "./duel.ts";

/**
 * Gửi trận sang luồng suy nghĩ (brain-worker) và chờ nước đi. Trả về undefined khi máy này không chạy được luồng riêng
 * hoặc luồng không trả lời kịp; khi đó trang trận tự nghĩ ngay trên luồng chính.
 */
const WAIT_MS = 6000;

let worker: Worker | null | undefined;
let seq = 0;
const waiting = new Map<number, (act: Act | null | undefined) => void>();

function boot(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./brain-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; act: Act | null }>) => {
      const done = waiting.get(event.data.id);
      if (!done) return;
      waiting.delete(event.data.id);
      done(event.data.act);
    };
    worker.onerror = () => {
      for (const done of waiting.values()) done(undefined);
      waiting.clear();
      worker?.terminate();
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function think(state: Duel, budget: number): Promise<Act | null | undefined> {
  const thread = typeof Worker === "undefined" ? null : boot();
  if (!thread) return Promise.resolve(undefined);
  seq += 1;
  const id = seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      waiting.delete(id);
      resolve(undefined);
    }, WAIT_MS);
    waiting.set(id, (act) => {
      clearTimeout(timer);
      resolve(act);
    });
    try {
      thread.postMessage({ id, state, budget });
    } catch {
      waiting.delete(id);
      clearTimeout(timer);
      resolve(undefined);
    }
  });
}
