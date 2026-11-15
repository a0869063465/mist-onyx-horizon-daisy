import type { CSSProperties, ReactNode } from "react";

/**
 * K3 (chủ game 14/11): lá phép vừa dùng hiện to giữa sân trên một vòng phép đang quay, toả tia sáng và một vòng sóng theo màu
 * tốc độ của phép (chậm đỏ, nhanh hồng, siêu tốc trắng, buff xanh lá), rồi thu vào icon của nó trên chuỗi (`to`), hoặc tan
 * lên khi phép không vào chuỗi. Học nhịp của hai video tham khảo, hình do game tự vẽ: vòng phép cổ ngữ hợp bàn đấu fantasy.
 */
export function CastShow({
  tone,
  to,
  onEnd,
  children,
}: {
  tone: string;
  /** Where the card flies when the show ends: the offset to its icon in % of the board (x of its width, y of its height)
   *  and the scale that shrinks it to the icon. Without it the card dissolves upward. */
  to?: { dx: number; dy: number; shrink: number };
  onEnd?: () => void;
  children: ReactNode;
}) {
  const style = { "--cast": tone, ...(to ? { "--dx": to.dx, "--dy": to.dy, "--shrink": to.shrink } : {}) } as CSSProperties;
  return (
    <div
      className={`cast-show${to ? " is-homing" : " is-fading"}`}
      style={style}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onEnd?.();
      }}
    >
      <span className="cast-rays" aria-hidden="true" />
      <svg className="cast-ring" viewBox="-60 -60 120 120" aria-hidden="true">
        <circle r="56" className="cast-ring-out" />
        <circle r="47" className="cast-ring-in" />
        <path className="cast-ring-star" d="M0 -47 L40.7 23.5 L-40.7 23.5 Z M0 47 L-40.7 -23.5 L40.7 -23.5 Z" />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r1 = i % 2 ? 49.5 : 48.5;
          return <line key={i} className="cast-ring-tick" x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * 54.5} y2={Math.sin(a) * 54.5} />;
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          return <circle key={i} className="cast-ring-gem" cx={Math.cos(a) * 51.5} cy={Math.sin(a) * 51.5} r="2.3" />;
        })}
      </svg>
      <span className="cast-wave" aria-hidden="true" />
      <span className="cast-wave is-late" aria-hidden="true" />
      <div className="cast-card">{children}</div>
      <span className="cast-motes" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} style={{ left: `${8 + ((i * 37) % 84)}%`, "--d": `${(i * 0.09).toFixed(2)}s`, "--s": 0.7 + ((i * 7) % 5) / 6 } as CSSProperties} />
        ))}
      </span>
    </div>
  );
}
