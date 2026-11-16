import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import cells from "@/lib/maze-cells.json";
import {
  BOSS_CELLS,
  BOSS_ID,
  CHESTS,
  DIRS,
  LIVES,
  MONSTERS,
  PORTALS,
  blockedReason,
  cancelPortal,
  chestAt,
  confirmPortal,
  createMaze,
  move,
  neighbor,
  openChest,
  resolveBattle,
  visibility,
  type Dir,
  type MazeEvent,
  type MazeResult,
  type MazeState,
} from "@/lib/maze";
import { clearMaze, loadMaze, saveMaze, startMazeBattle, takeMazeResult } from "@/lib/maze-store";
import { useAppMode } from "@/lib/app-mode";
import { tr, useLang } from "@/lib/i18n";
import { playCue, playIntro, playUi } from "@/lib/sfx";

export const Route = createFileRoute("/maze")({ component: MazePage });

/**
 * Mê cung PvE (chủ game 15/11). Ảnh mê cung rộng hết chiều ngang, sát đáy màn hình, khay bảo vật phủ mặt vách đá;
 * mọi vật đặt theo % ảnh gốc 1142 × 1377 bằng toạ độ ô trong `maze-cells.json` (tâm ô x,y; chân nhân vật fx,fy).
 * 2b: sương mù mờ dần (ô sáng = tầm nhìn + 3 ô đi qua sớm nhất), nhân vật lướt 0,42 giây mỗi ô, nhún nhẹ.
 * 3: bước vào ô quái thì hiệu ứng vào trận rồi mở màn đấu bài Vs Máy; hết trận quay về đây áp thắng/thua.
 */
const W = 1142;
const H = 1377;
const STEP_MS = 720;
const WARP_MS = 320;
const ENTRY_MS = 1500;
type Box = { x: number; y: number; w: number; h: number; fx: number; fy: number };
const CELL = cells as unknown as Record<string, Box>;
const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });
const BOSS_AT = (() => {
  const pts = BOSS_CELLS.map((k) => CELL[k]);
  return { x: pts.reduce((s, c) => s + c.x, 0) / 4, y: pts.reduce((s, c) => s + c.y, 0) / 4, w: pts[0].w * 2 };
})();
const TONE_IMG = { blue: "portal-blue", green: "portal-green", red: "portal-red" } as const;
const ARROW: Record<Dir, string> = { up: "▲", down: "▼", left: "◀", right: "▶" };
// Cổng đỏ chỉ có một chiều nhưng ô đến (6,C) cũng vẽ cổng cho đủ cặp như ảnh.
const PORTAL_CELLS = [...Object.keys(PORTALS), "6C"];

/** Chữ báo cho người chơi của các sự kiện mê cung. */
function eventNote(e: MazeEvent): string | null {
  switch (e.type) {
    case "buff_granted":
      return `Hạ quái Lv${e.level}, nhận buff`;
    case "boss_unlocked":
      return "Phòng boss đã mở";
    case "boss_defeated":
      return "Đã hạ boss";
    case "player_died":
      return `Thua trận, còn ${e.lives} mạng`;
    case "maze_reset":
      return "Mê cung đã reset, còn 1 cơ hội";
    case "maze_locked":
      return "Mê cung đã khoá";
    case "chest_opened":
      return "Đã mở rương";
    default:
      return null;
  }
}

function MazePage() {
  useLang();
  const navigate = useNavigate();
  const mode = useAppMode();
  const [maze, setMaze] = useState<MazeState>(() => createMaze());
  const [ready, setReady] = useState(false);
  const [face, setFace] = useState<Dir>("up");
  // Nhân vật lướt giữa các ô; tắt lúc mới mở trang, lúc dịch chuyển và lúc reset (nhảy thẳng).
  const [glide, setGlide] = useState(false);
  const [walk, setWalk] = useState(0);
  // Hai bước chân mỗi ô: một tiếng ở đầu, một ở giữa nhịp.
  useEffect(() => {
    if (!walk) return;
    playCue("mazeStep");
    const id = window.setTimeout(() => playCue("mazeStep"), STEP_MS / 2);
    return () => window.clearTimeout(id);
  }, [walk]);
  const [warp, setWarp] = useState(false);
  const [entry, setEntry] = useState<{ x: number; y: number; level: number; boss: boolean } | null>(null);
  const [note, setNote] = useState<{ text: string; id: number } | null>(null);
  const busy = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Mở trang: nạp mê cung đã lưu, áp kết quả trận vừa đánh (nếu có).
  useEffect(() => {
    let state = loadMaze();
    const result = takeMazeResult();
    let events: MazeEvent[] = [];
    if (result && state.pending?.monsterId === result.monsterId) {
      const res = resolveBattle(state, result.won);
      if (res.ok) {
        events = res.events;
        // Nhân vật lùi về ô trước (thua) thì lướt từ ô quái; reset thì nhảy thẳng về cửa vào.
        if (!events.some((e) => e.type === "maze_reset")) {
          busy.current = true;
          setMaze(state);
          setReady(true);
          window.setTimeout(() => {
            setGlide(true);
            busy.current = false;
            apply(res, null);
          }, 450);
          return;
        }
        state = res.state;
      }
    }
    setMaze(state);
    setReady(true);
    showEvents(events);
    requestAnimationFrame(() => requestAnimationFrame(() => setGlide(true)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) saveMaze(maze);
  }, [maze, ready]);

  function showEvents(events: MazeEvent[]) {
    const text = events.map(eventNote).filter(Boolean).at(-1);
    if (text) setNote({ text, id: Date.now() });
  }

  /** Áp một kết quả: đổi trạng thái, báo sự kiện, gặp quái thì chạy hiệu ứng vào trận sau khi nhân vật tới ô. */
  function apply(res: MazeResult, dir: Dir | null) {
    if (!res.ok) return;
    if (dir) setFace(dir);
    if (res.events.some((e) => e.type === "maze_reset")) {
      setGlide(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setGlide(true)));
    }
    setMaze(res.state);
    setWalk((n) => n + 1);
    showEvents(res.events);
    busy.current = true;
    window.setTimeout(() => {
      busy.current = false;
      if (res.state.pending) fight(res.state);
    }, STEP_MS);
  }

  function step(dir: Dir) {
    if (busy.current || entry) return;
    apply(move(maze, dir), dir);
  }

  function teleport() {
    if (busy.current) return;
    const res = confirmPortal(maze);
    if (!res.ok) return;
    busy.current = true;
    playIntro("rush");
    setWarp(true);
    window.setTimeout(() => {
      setGlide(false);
      setMaze(res.state);
      showEvents(res.events);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setGlide(true);
          setWarp(false);
          busy.current = false;
          if (res.state.pending) window.setTimeout(() => fight(res.state), WARP_MS);
        }),
      );
    }, WARP_MS);
  }

  /** Hiệu ứng vào trận (vòng sáng + màn tối khép lại quanh quái) rồi mở màn đấu bài. */
  function fight(state: MazeState) {
    const battle = state.pending;
    if (!battle) return;
    const boss = battle.monsterId === BOSS_ID;
    const c = boss ? BOSS_AT : CELL[battle.at];
    const box = boardRef.current?.getBoundingClientRect();
    const x = box ? box.left + (c.x / W) * box.width : window.innerWidth / 2;
    const y = box ? box.top + (c.y / H) * box.height : window.innerHeight / 2;
    busy.current = true;
    setEntry({ x, y, level: battle.level, boss });
    playIntro("strike");
    playIntro("flash", 0.35);
    window.setTimeout(() => {
      startMazeBattle({ monsterId: battle.monsterId, level: battle.level });
      void navigate({ to: "/play" });
    }, ENTRY_MS);
  }

  function resetAll() {
    clearMaze();
    setGlide(false);
    setMaze(createMaze());
    setNote(null);
    requestAnimationFrame(() => requestAnimationFrame(() => setGlide(true)));
  }

  const free = ready && !maze.pending && !maze.prompt && !maze.locked && !entry;
  const hero = CELL[maze.at];
  const vis = visibility(maze);
  const lit = new Set(vis.lit);
  const gone = new Set(maze.defeated);
  const chest = chestAt(maze, maze.at);
  const shown = (k: string) => (lit.has(k) ? 1 : 0);

  return (
    <main className="mz">
      <Link to="/" className="mz-back" aria-label={tr("Trở về")}>
        {"<<"}
      </Link>
      {mode === "publisher" ? (
        <button type="button" className="mz-reset" onClick={resetAll}>
          {tr("Đặt lại mê cung")}
        </button>
      ) : null}
      <div className="mz-board" ref={boardRef}>
        <img className="mz-map" src="/maze/board.jpg" alt="" draggable={false} />
        <div className="mz-layer">
          {PORTAL_CELLS.map((k) => {
            const c = CELL[k];
            const tone = (PORTALS[k]?.tone ?? "red") as keyof typeof TONE_IMG;
            return (
              <img
                key={`p${k}`}
                className="mz-obj is-portal"
                src={`/maze/${TONE_IMG[tone]}.webp`}
                alt=""
                style={{ ...pct(c.x, c.y), width: `${((c.w * 0.95) / W) * 100}%`, opacity: shown(k) }}
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
                style={{ ...pct(c.x, c.y), width: `${((c.w * 0.62) / W) * 100}%`, opacity: shown(ch.at) }}
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
                style={{ ...pct(c.x, c.y), width: `${((c.w * 0.82) / W) * 100}%`, opacity: shown(m.at) }}
                draggable={false}
              />
            );
          })}
          {!maze.bossDefeated && (
            <img
              className="mz-obj"
              src="/maze/boss.webp"
              alt=""
              style={{
                ...pct(BOSS_AT.x, BOSS_AT.y),
                width: `${((BOSS_AT.w * 0.95) / W) * 100}%`,
                opacity: BOSS_CELLS.some((k) => lit.has(k)) ? 1 : 0,
              }}
              draggable={false}
            />
          )}
          <Fog lit={vis.lit} />
          {ready ? (
            <div
              className={`mz-hero${glide ? " is-glide" : ""}${warp ? " is-warp" : ""}`}
              style={{ ...pct(hero.fx, hero.fy), height: `${((hero.h * 1.15) / H) * 100}%` }}
            >
              <i key={walk} className={`mz-sprite${walk ? " is-walk" : ""}`} style={{ backgroundImage: `url(/maze/walk-${face}.webp)` }} />
            </div>
          ) : null}
        </div>
      </div>

      {chest && free ? (
        <button
          type="button"
          className="mz-chest-btn"
          onClick={() => {
            playUi("confirm");
            apply(openChest(maze), null);
          }}
        >
          {tr("Mở rương")}
        </button>
      ) : null}

      {note ? (
        <p key={note.id} className="mz-note">
          {tr(note.text)}
        </p>
      ) : null}

      <section className="mz-tray" aria-label={tr("Bảo vật")}>
        <div className="mz-necklace">
          <img src="/maze/item-necklace.webp" alt={tr("Dây chuyền")} draggable={false} />
          {DIRS.map((dir) => {
            const next = neighbor(maze.at, dir);
            const on = free && !!next && !blockedReason(maze, dir);
            return (
              <button key={dir} type="button" className={`mz-dpad is-${dir}`} aria-label={dir} disabled={!on} onClick={() => step(dir)}>
                {ARROW[dir]}
              </button>
            );
          })}
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

      {maze.prompt && !warp && ready ? (
        <div className="mz-modal" role="dialog">
          <div>
            <p>{tr("Dịch chuyển?")}</p>
            <button type="button" onClick={teleport}>
              {tr("Dịch chuyển")}
            </button>
            <button type="button" onClick={() => apply(cancelPortal(maze), null)}>
              {tr("Huỷ")}
            </button>
          </div>
        </div>
      ) : null}
      {/* Thoát giữa trận rồi quay lại: quái vẫn đang chờ, chỉ còn cách vào trận lại. */}
      {ready && maze.pending && !entry && !busy.current ? (
        <div className="mz-modal" role="dialog">
          <div>
            <p>{maze.pending.monsterId === BOSS_ID ? tr("Đang giao chiến với boss") : `${tr("Đang giao chiến với quái")} Lv${maze.pending.level}`}</p>
            <button type="button" onClick={() => fight(maze)}>
              {tr("Vào trận")}
            </button>
          </div>
        </div>
      ) : null}
      {ready && maze.locked ? (
        <div className="mz-modal" role="dialog">
          <div>
            <p>{tr("Mê cung đã khoá")}</p>
            <Link to="/" className="mz-modal-link">
              {tr("Về menu")}
            </Link>
          </div>
        </div>
      ) : null}
      {entry ? <BattleEntry {...entry} /> : null}
    </main>
  );
}

/**
 * Sương mù (2b): lớp đen phủ ảnh mê cung, khoét các ô sáng. Mỗi ô có độ sáng riêng, tiến dần về đích (mờ dần
 * khoảng 0,45 giây) nên ô mới sáng lên, ô cũ tối đi mượt; mép mềm nhờ làm mờ cả lớp. Lớp tràn ra ngoài ảnh một
 * khoảng để mép ảnh vẫn đen sau khi làm mờ.
 */
const FOG_PAD = 0.06;
const FOG_FADE = 0.45;
function Fog({ lit }: { lit: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const want = useRef(new Set(lit));
  const level = useRef<Record<string, number> | null>(null);
  want.current = new Set(lit);

  useLayoutEffect(() => {
    let frame = 0;
    let last = performance.now();
    let size = "";
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const canvas = ref.current;
      if (!canvas) return;
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      // Lần đầu: sáng ngay, không mờ dần.
      if (!level.current) {
        level.current = {};
        for (const k of want.current) level.current[k] = 1;
      }
      const lv = level.current;
      let moved = false;
      for (const k of Object.keys(CELL)) {
        const goal = want.current.has(k) ? 1 : 0;
        const cur = lv[k] ?? 0;
        if (cur === goal) continue;
        const next = goal > cur ? Math.min(goal, cur + dt / FOG_FADE) : Math.max(goal, cur - dt / FOG_FADE);
        lv[k] = next;
        moved = true;
      }
      const cw = Math.round(canvas.clientWidth / 2);
      const ch = Math.round(canvas.clientHeight / 2);
      const key = `${cw}x${ch}`;
      if (!moved && key === size) return;
      if (key !== size) {
        canvas.width = cw;
        canvas.height = ch;
        size = key;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const sx = cw / (W * (1 + 2 * FOG_PAD));
      const sy = ch / (H * (1 + 2 * FOG_PAD));
      const ox = W * FOG_PAD;
      const oy = H * FOG_PAD;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "destination-out";
      for (const [k, a] of Object.entries(lv)) {
        if (a <= 0) continue;
        const c = CELL[k];
        // Ô sáng lấn lên trên một chút để thấy mặt tường phía sau (ảnh nhìn chéo từ trên xuống).
        const x0 = c.x - c.w * 0.56;
        const y0 = c.y - c.h * 0.78;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#000";
        ctx.fillRect((x0 + ox) * sx, (y0 + oy) * sy, c.w * 1.12 * sx, c.h * 1.36 * sy);
      }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={ref} className="mz-fog" aria-hidden="true" style={{ left: `-${FOG_PAD * 100}%`, top: `-${FOG_PAD * 100}%`, width: `${100 + FOG_PAD * 200}%`, height: `${100 + FOG_PAD * 200}%` }} />;
}

/** Hiệu ứng vào trận: loé sáng + vòng sóng ở quái, chữ VÀO TRẬN, rồi màn tối khép lại quanh quái. */
function BattleEntry({ x, y, level, boss }: { x: number; y: number; level: number; boss: boolean }) {
  return (
    <div className={`mz-entry${boss ? " is-boss" : ""}`} style={{ ["--ex" as string]: `${x}px`, ["--ey" as string]: `${y}px` }} aria-hidden="true">
      <i className="mz-entry-flash" />
      <i className="mz-entry-ring" />
      <i className="mz-entry-ring is-late" />
      <i className="mz-entry-iris" />
      <div className="mz-entry-title">
        <b>{tr("VÀO TRẬN")}</b>
        <small>{boss ? "BOSS" : `${tr("Quái")} Lv${level}`}</small>
      </div>
    </div>
  );
}
