import { useEffect, useRef, useState } from "react";
import { runJobs, type Job } from "@/lib/preload";

/** Seconds before "Vào luôn" appears, for a slow connection. */
const SKIP_AFTER = 20;

/**
 * Full-screen loading screen with a real progress bar: it counts finished downloads, and calls onDone
 * once every job settled (or the player pressed "Vào luôn"). The background is /load-<kind>.jpg when present.
 */
export function LoadScreen({ kind, title, jobs, onDone }: { kind: "game" | "match"; title: string; jobs: () => Job[]; onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [skip, setSkip] = useState(false);
  const finished = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
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
    <div className={`load-screen is-${kind}`} role="status" aria-live="polite">
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
