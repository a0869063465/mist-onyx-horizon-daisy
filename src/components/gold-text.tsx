import glyphs from "@/lib/deck-glyphs.json";

/**
 * Chữ vàng ghép từng ký tự cắt NGUYÊN từ ảnh phông chủ game gửi (A1, `public/ui/deck/glyphs.webp`).
 * Ký tự không có trong ảnh phông (dấu chấm, gạch nối, ký hiệu…) để trống như dấu cách.
 * Đơn vị: `--u` = 1 px của ảnh thiết kế 848 px bề ngang (khai báo ở `.dk2`).
 */
type Entry = [number, number, number, number, number, number, number];
const ATLAS = glyphs as unknown as { w: number; h: number; cap: number; g: Record<string, Entry> };
const CAP = ATLAS.cap;
const TRACK = CAP * 0.09;
const SPACE = CAP * 0.34;
let ASC = 0;
let DESC = 0;
for (const e of Object.values(ATLAS.g)) {
  ASC = Math.max(ASC, -e[4]);
  DESC = Math.max(DESC, e[4] + e[3]);
}

function layout(text: string) {
  const out: { e: Entry; pen: number }[] = [];
  let pen = 0;
  for (const ch of Array.from(text)) {
    const e = ATLAS.g[ch];
    if (!e) {
      pen += SPACE;
      continue;
    }
    out.push({ e, pen });
    pen += e[6] + TRACK;
  }
  return { out, width: Math.max(0, pen - TRACK) };
}

/** capU = cỡ chữ hoa tối đa, fitU = bề ngang tối đa (đều theo đơn vị `--u`). */
export function GoldText({ text, capU, fitU }: { text: string; capU: number; fitU: number }) {
  const { out, width } = layout(text);
  const gs = Math.min(capU / CAP, width > 0 ? fitU / width : capU / CAP);
  const k = `calc(var(--u) * ${gs.toFixed(4)})`;
  return (
    <span
      className="gold-text"
      role="img"
      aria-label={text}
      style={{
        width: `calc(${k} * ${width.toFixed(1)})`,
        height: `calc(${k} * ${ASC + DESC})`,
        top: `calc(50% + ${k} * ${(CAP / 2 - ASC).toFixed(1)})`,
      }}
    >
      {out.map(({ e, pen }, i) => (
        <i
          key={i}
          style={{
            left: `calc(${k} * ${(pen - e[5]).toFixed(1)})`,
            top: `calc(${k} * ${(ASC + e[4]).toFixed(1)})`,
            width: `calc(${k} * ${e[2]})`,
            height: `calc(${k} * ${e[3]})`,
            backgroundPosition: `calc(${k} * ${-e[0]}) calc(${k} * ${-e[1]})`,
            backgroundSize: `calc(${k} * ${ATLAS.w}) calc(${k} * ${ATLAS.h})`,
          }}
        />
      ))}
    </span>
  );
}
