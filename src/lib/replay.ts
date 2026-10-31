/**
 * Replay (chủ game 31/10): ghi từng bước của trận (Vs Máy, Đánh thường, Tuỳ chọn) dưới dạng bản đầu + các phần đổi,
 * nén gzip rồi gửi lên máy chủ khi hết trận. Phát lại: dựng lại từng bước, có mốc sẵn để tua nhanh.
 */
type Key = string | number;
/** [0, đường, giá trị] gán; [1, đường] xoá khoá; [2, đường, độ dài] cắt mảng. */
export type Patch = [0, Key[], unknown] | [1, Key[]] | [2, Key[], number];
export type ReplayMode = "ai" | "quick" | "custom";
export type ReplayData = { v: 1; mid: string; mode: ReplayMode; seat: "host" | "guest"; start: unknown; steps: [number, Patch[]][] };

const isObj = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function walk(a: unknown, b: unknown, path: Key[], out: Patch[]) {
  if (a === b) return;
  if (Array.isArray(a) && Array.isArray(b)) {
    const shared = Math.min(a.length, b.length);
    for (let i = 0; i < shared; i += 1) walk(a[i], b[i], [...path, i], out);
    for (let i = shared; i < b.length; i += 1) out.push([0, [...path, i], b[i]]);
    if (b.length < a.length) out.push([2, path, b.length]);
    return;
  }
  if (isObj(a) && isObj(b)) {
    for (const key of Object.keys(a)) if (!(key in b)) out.push([1, [...path, key]]);
    for (const key of Object.keys(b)) walk(a[key], b[key], [...path, key], out);
    return;
  }
  out.push([0, path, b]);
}

/** Phần đổi từ `a` sang `b` (cả hai là dữ liệu JSON thuần). */
export function diffJson(a: unknown, b: unknown): Patch[] {
  const out: Patch[] = [];
  walk(a, b, [], out);
  return out;
}

/** Áp phần đổi lên `root` (sửa tại chỗ), trả về gốc mới (khi gán cả gốc). */
export function applyJson(root: unknown, patches: Patch[]): unknown {
  let top = root;
  for (const patch of patches) {
    const path = patch[1];
    if (path.length === 0) {
      if (patch[0] === 0) top = clone(patch[2]);
      continue;
    }
    let node = top as Record<Key, unknown>;
    for (let i = 0; i < path.length - 1; i += 1) node = node[path[i] as string] as Record<Key, unknown>;
    const last = path[path.length - 1] as string;
    if (patch[0] === 0) node[last] = clone(patch[2]);
    else if (patch[0] === 1) delete node[last];
    else (node[last] as unknown[]).length = patch[2];
  }
  return top;
}

const clone = <T,>(value: T): T => (value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T));

/** Ghi trận trên máy này: bản đầu rồi mỗi lần trận đổi thì thêm phần đổi. */
export class ReplayRecorder {
  readonly mid: string;
  private readonly started = Date.now();
  private prev: unknown;
  private readonly data: ReplayData;

  constructor(mid: string, mode: ReplayMode, seat: "host" | "guest", first: unknown) {
    this.mid = mid;
    this.prev = clone(first);
    this.data = { v: 1, mid, mode, seat, start: this.prev, steps: [] };
  }

  push(next: unknown) {
    const plain = clone(next);
    const patches = diffJson(this.prev, plain);
    if (!patches.length) return;
    this.data.steps.push([Date.now() - this.started, patches]);
    this.prev = plain;
  }

  get size() {
    return this.data.steps.length;
  }

  done(): ReplayData {
    return this.data;
  }
}

function toBase64(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}

function fromBase64(text: string): Uint8Array {
  const raw = atob(text);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Nén để gửi lên máy chủ: "gz:" + base64 của gzip, máy không có CompressionStream thì gửi thẳng "js:" + JSON. */
export async function packReplay(data: ReplayData): Promise<string> {
  const json = JSON.stringify(data);
  if (typeof CompressionStream === "undefined") return `js:${json}`;
  return `gz:${toBase64(await pipe(new TextEncoder().encode(json), new CompressionStream("gzip")))}`;
}

export async function unpackReplay(text: string): Promise<ReplayData | null> {
  try {
    const json = text.startsWith("gz:") ? new TextDecoder().decode(await pipe(fromBase64(text.slice(3)), new DecompressionStream("gzip"))) : text.slice(3);
    const data = JSON.parse(json) as ReplayData;
    return data?.v === 1 && Array.isArray(data.steps) ? data : null;
  } catch {
    return null;
  }
}

const EVERY = 20;

/** Dựng lại bước thứ i của trận; giữ bản chụp mỗi 20 bước để tua tới đâu cũng nhanh. */
export class ReplayBook {
  readonly data: ReplayData;
  private readonly marks: string[] = [];

  constructor(data: ReplayData) {
    this.data = data;
    let state = clone(data.start);
    this.marks.push(JSON.stringify(state));
    data.steps.forEach(([, patches], i) => {
      state = applyJson(state, patches);
      if ((i + 1) % EVERY === 0) this.marks.push(JSON.stringify(state));
    });
  }

  /** Số khung (bản đầu + mỗi bước). */
  get length() {
    return this.data.steps.length + 1;
  }

  /** Thời điểm (ms từ đầu trận) của khung i. */
  timeAt(index: number) {
    return index <= 0 ? 0 : this.data.steps[Math.min(index, this.data.steps.length) - 1]![0];
  }

  frame<T>(index: number): T {
    const at = Math.max(0, Math.min(index, this.length - 1));
    const mark = Math.floor(at / EVERY);
    let state = JSON.parse(this.marks[mark]!) as unknown;
    for (let i = mark * EVERY; i < at; i += 1) state = applyJson(state, this.data.steps[i]![1]);
    return state as T;
  }
}
