import { brainChoose, type Act } from "./brain.ts";
import type { Duel } from "./duel.ts";

/** Luồng suy nghĩ của máy: nhận trận, trả nước đi máy chọn, để trang trận không bị khựng lúc máy nghĩ. */
type Ask = { id: number; state: Duel; budget: number };

const scope = globalThis as unknown as {
  addEventListener: (type: "message", handler: (event: MessageEvent<Ask>) => void) => void;
  postMessage: (data: { id: number; act: Act | null }) => void;
};

scope.addEventListener("message", (event) => {
  const { id, state, budget } = event.data;
  let act: Act | null = null;
  try {
    act = brainChoose(state, budget);
  } catch {
    act = null;
  }
  scope.postMessage({ id, act });
});
