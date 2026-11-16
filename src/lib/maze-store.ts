import { createMaze, type MazeState } from "./maze";

/**
 * Mê cung PvE, phần 3 (chủ game 15/11): trạng thái mê cung lưu trên máy (thoát ra không reset), và đường đi
 * qua lại giữa /maze và /play. Vào ô quái: /maze ghi trận đang đánh (`MAZE_BATTLE_KEY`) rồi mở /play chế độ Vs Máy;
 * hết trận, /play ghi kết quả (`MAZE_RESULT_KEY`) và quay về /maze, /maze áp kết quả bằng `resolveBattle`.
 */
const STORE_KEY = "clash-maze";
export const MAZE_BATTLE_KEY = "clash-maze-battle";
export const MAZE_RESULT_KEY = "clash-maze-result";

export interface MazeBattleTicket {
  monsterId: string;
  level: number;
}
export interface MazeBattleResult {
  monsterId: string;
  won: boolean;
}

export function loadMaze(): MazeState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null") as MazeState | null;
    if (raw && typeof raw.at === "string" && Array.isArray(raw.visited)) return { ...createMaze(), ...raw };
  } catch {
    // dữ liệu hỏng: bắt đầu lại
  }
  return createMaze();
}

export function saveMaze(state: MazeState) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // máy chặn lưu: chỉ mất tiến độ khi tắt trang
  }
}

export function clearMaze() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // bỏ qua
  }
}

function readSession<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

/** /maze: mở trận cho ô quái đang đứng. */
export function startMazeBattle(ticket: MazeBattleTicket) {
  sessionStorage.removeItem("clash-net");
  sessionStorage.removeItem(MAZE_RESULT_KEY);
  sessionStorage.setItem("clash-mode", "ai");
  sessionStorage.setItem(MAZE_BATTLE_KEY, JSON.stringify(ticket));
}

/** /play: lấy (và xoá) vé trận mê cung lúc mở trận; trận Vs Máy thường không có vé. */
export function takeMazeBattle(): MazeBattleTicket | null {
  const ticket = readSession<MazeBattleTicket>(MAZE_BATTLE_KEY);
  sessionStorage.removeItem(MAZE_BATTLE_KEY);
  return ticket && typeof ticket.monsterId === "string" ? ticket : null;
}

/** /play: hết trận mê cung thì ghi thắng/thua để /maze áp. */
export function finishMazeBattle(result: MazeBattleResult) {
  sessionStorage.setItem(MAZE_RESULT_KEY, JSON.stringify(result));
}

/** /maze: lấy (và xoá) kết quả trận vừa đánh. */
export function takeMazeResult(): MazeBattleResult | null {
  const result = readSession<MazeBattleResult>(MAZE_RESULT_KEY);
  sessionStorage.removeItem(MAZE_RESULT_KEY);
  return result && typeof result.monsterId === "string" ? result : null;
}
