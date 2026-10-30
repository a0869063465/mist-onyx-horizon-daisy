import { useEffect, useRef, useState } from "react";
import { runJobs, type Job } from "@/lib/preload";

/** Seconds before "Vào luôn" appears, for a slow connection. */
const SKIP_AFTER = 20;

/** What the match loading screen shows above the bar: the mode, and the monsters of your deck to pick one from. */
export type LoadFace = { mode: string; pool: Array<{ name: string; art: string }> };

/**
 * Full-screen loading screen with a real progress bar: it counts finished downloads, and calls onDone
 * once every job settled (or the player pressed "Vào luôn"). The background is /load-<kind>.jpg when present.
 * Before a match it also shows a dark banner like Runeterra's (chủ game 22/10, T15): the mode, and one monster of your
 * deck picked at random, in a gold ring with its name. Its foot stops a little above the loading line and the bar, so
 * it never covers them (chủ game, câu 12). The monster's story is for later (câu 11).
 */
const LOGOS = ["/ui/logo.webp", "/ui/logo-snake.webp"];

/** Màn tải game hiện ngẫu nhiên một trong hai linh vật: sư tử hoặc rắn (chủ game 30/10). */
export function LoadScreen({ kind, title, jobs, onDone, face }: { kind: "game" | "match"; title: string; jobs: () => Job[]; onDone: () => void; face?: LoadFace }) {
  const [shown] = useState(() => (face?.pool.length ? face.pool[Math.floor(Math.random() * face.pool.length)] : null));
  // Chọn sau khi trang gắn xong: máy chủ dựng sẵn trang này nên chọn lúc dựng thì HTML luôn mang logo sư tử.
  const [logo, setLogo] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [skip, setSkip] = useState(false);
  const finished = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (kind === "game") setLogo(LOGOS[Math.floor(Math.random() * LOGOS.length)]);
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      doneRef.current();
    };
    const timer = window.setTimeout(() => setSkip(true), SKIP_AFTER * 1000);
    void runJobs(jobs(), (done, total) => setPct(total === 0 ? 100 : Math.floor((done / total) * 100))).then(() => {
      setPct(100);
      window.setTimeout(finish, 250);
    });
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`load-screen is-${kind}${face ? " has-banner" : ""}`} role="status" aria-live="polite">
      {kind === "game" && logo ? <img className="load-logo" src={logo} alt="Clash of the Beasts" fetchPriority="high" draggable={false} /> : null}
      {face ? (
        <div className="load-banner">
          <b className="load-mode">{face.mode}</b>
          <i className="load-rule" />
          {shown ? (
            <>
              <span className="load-ring">
                <img src={shown.art} alt="" draggable={false} />
              </span>
              <span className="load-name">{shown.name}</span>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="load-foot">
        <div className="load-row">
          <span className="load-title">{title}</span>
          <span className="load-pct">{pct}%</span>
        </div>
        <div className="load-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        {skip && pct < 100 ? (
          <button
            type="button"
            className="act alt press load-skip"
            onClick={() => {
              if (finished.current) return;
              finished.current = true;
              doneRef.current();
            }}
          >
            Vào luôn
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Game load: runs once when the app opens, over whatever page it opened on. */
export function GameLoad({ jobs }: { jobs: () => Job[] }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <LoadScreen kind="game" title="Đang tải trò chơi" jobs={jobs} onDone={() => setOpen(false)} />;
}
