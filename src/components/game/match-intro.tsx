import { useEffect, useRef, type CSSProperties } from "react";
import { FusePic } from "@/components/game/fuse-dance";
import { playIntro } from "@/lib/sfx";
import { tr } from "@/lib/i18n";

/** One side as the VS screen shows it: who (Bạn, Máy, Đối thủ), the deck's name and the champion's art. */
export type IntroSide = { label: string; deck: string | null; art: string | null };

/** The whole scene in ms; the last beat is the champions landing on the board and fading. */
const LENGTH = 4000;

/** Gold specks of the rain: left edge (% of the width), size, delay and fall time, fixed so every match looks alike. */
const RAIN = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  size: 0.7 + ((i * 7) % 5) * 0.28,
  delay: 0.25 + ((i * 13) % 17) * 0.09,
  fall: 1.5 + ((i * 11) % 7) * 0.16,
}));

/** A jagged bolt from the VS medallion out to one side, in a 100 × 100 box (stretched to the screen, so y moves
 *  are kept small), with a short fork near the middle. */
const BOLT = [
  [0, 0],
  [6, -0.9],
  [9, 0.5],
  [15, -1.4],
  [17, -0.3],
  [24, 0.8],
  [27, -0.2],
  [33, 1.1],
  [36, 0.2],
  [42, -1],
  [46, 0.3],
  [50, -0.4],
];
const FORK = [
  [24, 0.8],
  [27, 2.1],
  [29, 1.7],
  [33, 3.2],
];

function boltPath(toward: 1 | -1): string {
  const line = (points: number[][]) => points.map(([x, y], i) => `${i ? "L" : "M"}${(50 + toward * x).toFixed(1)} ${(50 + y * toward).toFixed(1)}`).join("");
  return `${line(BOLT)}${line(FORK)}`;
}

/**
 * Màn VS (chủ game 22/10, T1 trong video LoR; tự dựng lại, không lấy hình hay âm của Riot): the lion logo rushes past
 * in a rain of gold, the two sides slide in (the other player on top, you below, as on the board), a VS medallion spins
 * on a line of light between them, blue lightning strikes, the screen flashes white, and each champion drops onto its
 * half of the board and fades. About 4 seconds; a tap skips it.
 */
export function MatchIntro({ top, bottom, onDone }: { top: IntroSide; bottom: IntroSide; onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    doneRef.current();
  };

  useEffect(() => {
    playIntro("rush");
    playIntro("rain", 0.3);
    playIntro("hum", 0.7);
    playIntro("strike", 2.2);
    playIntro("strike", 2.36);
    playIntro("flash", 2.6);
    playIntro("land", 3.15);
    const timer = window.setTimeout(finish, LENGTH);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const side = (where: "top" | "bottom", info: IntroSide) => (
    <section className={`vs-side is-${where}`}>
      <div className="vs-plate">
        <b className="vs-who">{tr(info.label)}</b>
        {info.deck ? <small className="vs-deck">{info.deck}</small> : null}
      </div>
      {info.art ? (
        <div className="vs-champ">
          <FusePic src={info.art} />
        </div>
      ) : null}
    </section>
  );

  return (
    <div className="vs" role="presentation" onPointerDown={finish}>
      <div className="vs-dim" />
      <div className="vs-rain" aria-hidden="true">
        {RAIN.map((drop, i) => (
          <i key={i} style={{ left: `${drop.x}%`, "--size": `${drop.size}cqw`, "--delay": `${drop.delay}s`, "--fall": `${drop.fall}s` } as CSSProperties} />
        ))}
      </div>
      {side("top", top)}
      {side("bottom", bottom)}
      <div className="vs-line" />
      <svg className="vs-bolts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="vs-bolt" d={boltPath(1)} />
        <path className="vs-bolt is-left" d={boltPath(-1)} />
        <path className="vs-bolt is-core" d={boltPath(1)} />
        <path className="vs-bolt is-core is-left" d={boltPath(-1)} />
      </svg>
      <div className="vs-medal" aria-hidden="true">
        <span className="vs-coin">
          <span className="vs-medal-face">
            <b>VS</b>
          </span>
          <span className="vs-medal-face is-back">
            <b>VS</b>
          </span>
        </span>
      </div>
      <img className="vs-logo" src="/ui/logo.webp" alt="" draggable={false} />
      <div className="vs-flash" />
    </div>
  );
}
