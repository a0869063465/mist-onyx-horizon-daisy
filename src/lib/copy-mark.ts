export function plainCopy(text: string) {
  return text.replaceAll("**", "").replaceAll("__", "");
}

export type CopyBit = { text: string; bold: boolean; under: boolean } | { br: true };

export function parseCopy(raw: string): CopyBit[] {
  const out: CopyBit[] = [];
  let bold = false;
  let under = false;
  for (const bit of markSkillTitles(raw).split(/(\*\*|__|\n)/)) {
    if (bit === "**") bold = !bold;
    else if (bit === "__") under = !under;
    else if (bit === "\n") out.push({ br: true });
    else if (bit) out.push({ text: bit, bold, under });
  }
  return out;
}

/** Dòng tên kỹ năng chưa đánh dấu thì tự in đậm và gạch dưới. */
function markSkillTitles(raw: string): string {
  const lines = raw.split("\n");
  let seen = false;
  return lines
    .map((line) => {
      if (line.includes("**") || line.includes("__")) {
        if (line.trim()) seen = true;
        return line;
      }
      const titled = /^(\s*)(.+?)(\s*[:：])(\s*)$/.exec(line);
      if (titled) {
        const name = titled[2].trim();
        if (name.length >= 2 && name.length <= 48 && !/^[-•]/.test(name)) {
          seen = true;
          return `${titled[1]}__**${name}**__${titled[3]}${titled[4]}`;
        }
      }
      if (!seen && line.trim()) {
        const name = line.trim();
        if (name.length >= 2 && name.length <= 48 && !/^[-•]/.test(name) && !/[.!?,，]/.test(name)) {
          seen = true;
          return `${line.match(/^\s*/)?.[0] ?? ""}__**${name}**__`;
        }
        seen = true;
      }
      return line;
    })
    .join("\n");
}

const SIZE_KEY = "clash-copy-size";

export function loadCopySize() {
  if (typeof localStorage === "undefined") return 100;
  const next = Number(localStorage.getItem(SIZE_KEY));
  if (!Number.isFinite(next)) return 100;
  return Math.min(160, Math.max(70, Math.round(next)));
}

export function saveCopySize(size: number) {
  const next = Math.min(160, Math.max(70, Math.round(size)));
  localStorage.setItem(SIZE_KEY, String(next));
  applyCopySize(next);
  window.dispatchEvent(new Event("clash-copy-size"));
  return next;
}

export function applyCopySize(size = loadCopySize()) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--copy-size", String(size));
}

