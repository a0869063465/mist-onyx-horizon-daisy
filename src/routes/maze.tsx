import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import cells from "@/lib/maze-cells.json";
import {
  BOSS_CELLS,
  CHESTS,
  LIVES,
  MONSTERS,
  PORTALS,
  blockedReason,
  cancelPortal,
  chestAt,
  confirmPortal,
  createMaze,
  monsterAt,
  move,
  neighbor,
  resolveBattle,
  DIRS,
  type CellKey,
  type Dir,
  type MazeState,
} from "@/lib/maze";
import { tr, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/maze")({ component: MazePage });

/**
 * Mê cung PvE, phần 2a (chủ game 15/11): màn tĩnh. Ảnh mê cung rộng hết chiều ngang, nằm sát đáy màn hình, khay bảo
 * vật phủ lên mặt vách đá dưới cùng; phần trên thừa là nền đen (sương mù để phần 2b). Mọi vật đặt theo % của ảnh gốc
 * 1142 × 1377 bằng toạ độ ô trong `maze-cells.json` (tâm ô x,y; chân nhân vật fx,fy). Bước đi bằng cách chạm ô kề
 * (chưa có chuyển động); khung đấu bài là chỗ giữ của phần 3.
 */
const W = 1142;
const H = 1377;
type Box = { x: number; y: number; w: number; h: number; fx: number; fy: number };
const CELL = cells as unknown as Record<string, Box>;
const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });
const BOSS_AT = (() => {
  const pts = BOSS_CELLS.map((k) => CELL[k]);
  return { x: pts.reduce((s, c) => s + c.x, 0) / 4, y: pts.reduce((s, c) => s + c.y, 0) / 4, w: pts[0].w * 2 };
})();
const TONE_IMG = { blue: "portal-blue", green: "portal-green", red: "portal-red" } as const;
const ARROW: Record<Dir, string> = { up: "▲", down: "▼", left: "◀", right: "▶" };

function MazePage() {
  useLang();
  const [maze, setMaze] = useState<MazeState>(() => createMaze());
  const [face, setFace] = useState<Dir>("up");

  const step = (dir: Dir) => {
    const res = move(maze, dir);
    if (!res.ok) return;
    setFace(dir);
    setMaze(res.state);
  };
  const free = !maze.pending && !maze.prompt && !maze.locked;
  const hero = CELL[maze.at];
  const heroDir = face === "up" ? "up" : face;
  const gone = new Set(maze.defeated);
  // Cổng đỏ chỉ có một chiều nhưng ô đến (6,C) cũng vẽ cổng cho đủ cặp như ảnh.
  const portalCells = [...Object.keys(PORTALS), "6C"];

  return (
    <main className="mz">
      <Link to="/" className="mz-back" aria-label={tr("Trở về")}>
        {"<<"}
      </Link>
      <div className="mz-board">
        <img className="mz-map" src="/maze/board.jpg" alt="" draggable={false} />
        <div className="mz-layer">
          {portalCells.map((k) => {
            const c = CELL[k];
            const tone = (PORTALS[k]?.tone ?? "red") as keyof typeof TONE_IMG;
            return (
              <img
                key={`p${k}`}
                className="mz-obj is-portal"
                src={`/maze/${TONE_IMG[tone]}.webp`}
                alt=""
                style={{ ...pct(c.x, c.y), width: `${(c.w * 0.95 / W) * 100}%` }}
                draggable={false}
              />
            );
          })}
          {CHESTS.filter((c) => !maze.chestsOpened.includes(c.id)).map((ch) => {
            const c = CELL[ch.at];
            return (
              <img
                key={ch.id}
                className="mz-obj"
                src="/maze/chest.webp"
                alt=""
                style={{ ...pct(c.x, c.y), width: `${(c.w * 0.62 / W) * 100}%` }}
                draggable={false}
              />
            );
          })}
          {MONSTERS.filter((m) => !gone.has(m.id)).map((m) => {
            const c = CELL[m.at];
            return (
              <img
                key={m.id}
                className="mz-obj is-monster"
                src={`/maze/mon-${m.level}.webp`}
                alt=""
                style={{ ...pct(c.x, c.y), width: `${(c.w * 0.82 / W) * 100}%` }}
                draggable={false}
              />
            );
          })}
          {!maze.bossDefeated && (
            <img
              className="mz-obj"
              src="/maze/boss.webp"
              alt=""
              style={{ ...pct(BOSS_AT.x, BOSS_AT.y), width: `${(BOSS_AT.w * 0.95 / W) * 100}%` }}
              draggable={false}
            />
          )}
          {free &&
            DIRS.map((dir) => {
              const next = neighbor(maze.at, dir);
              if (!next || blockedReason(maze, dir)) return null;
              const c = CELL[next];
              return (
                <button
                  key={dir}
                  type="button"
                  className="mz-step"
                  aria-label={dir}
                  style={{ ...pct(c.x, c.y), width: `${(c.w / W) * 100}%`, height: `${(c.h / H) * 100}%` }}
                  onClick={() => step(dir)}
                >
                  <span>{ARROW[dir]}</span>
                </button>
              );
            })}
          <img
            className="mz-hero"
            src={`/maze/hero-${face === "down" ? "down" : heroDir}.webp`}
            alt=""
            style={{ ...pct(hero.fx, hero.fy), height: `${(hero.h * 1.15 / H) * 100}%` }}
            draggable={false}
          />
        </div>
      </div>

      <section className="mz-tray" aria-label={tr("Bảo vật")}>
        <div className="mz-necklace">
          <img src="/maze/item-necklace.webp" alt={tr("Dây chuyền")} draggable={false} />
        </div>
        <div className="mz-pick">
          <span>{tr("Quái")}</span>
          <span>{tr("Rương báu")}</span>
          <span>{tr("Phòng boss")}</span>
        </div>
        <div className="mz-game">
          <img src="/maze/item-game.webp" alt={tr("Trò chơi")} draggable={false} />
          <div className="mz-lives" aria-label={`${maze.lives}/${LIVES}`}>
            {Array.from({ length: LIVES }, (_, i) => (
              <i key={i} className={i < maze.lives ? "" : "is-lost"} aria-hidden="true">
                ♥
              </i>
            ))}
          </div>
        </div>
        <div className="mz-items">
          <img src="/maze/item-key.webp" alt={tr("Chìa khoá")} draggable={false} />
          <img src="/maze/item-wand.webp" alt={tr("Trượng")} draggable={false} />
          <img className="is-wide" src="/maze/item-scale.webp" alt={tr("Cân")} draggable={false} />
        </div>
      </section>

      {maze.prompt && (
        <div className="mz-modal" role="dialog">
          <div>
            <p>{tr("Dịch chuyển?")}</p>
            <button type="button" onClick={() => setMaze(confirmPortal(maze).state)}>
              {tr("Dịch chuyển")}
            </button>
            <button type="button" onClick={() => setMaze(cancelPortal(maze).state)}>
              {tr("Huỷ")}
            </button>
          </div>
        </div>
      )}
      {maze.pending && (
        <div className="mz-modal" role="dialog">
          <div>
            <p>{`${tr("Vào trận")} · Lv${maze.pending.level} (${maze.pending.at})`}</p>
            <small>{tr("Phần 3 sẽ nối màn đấu bài. Tạm thử:")}</small>
            <button type="button" onClick={() => setMaze(resolveBattle(maze, true).state)}>
              {tr("Thắng")}
            </button>
            <button type="button" onClick={() => setMaze(resolveBattle(maze, false).state)}>
              {tr("Thua")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// Giữ tham chiếu để cùng một chỗ lấy dữ liệu khi phần 2b thêm sương mù.
void monsterAt;
void chestAt;
