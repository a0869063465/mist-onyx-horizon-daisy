import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { CardMonsterSheet, SpellSheet } from "@/components/game/card-sheets";
import { artSrc, spellSrc } from "@/lib/catalog";
import { tr } from "@/lib/i18n";
import { playPack, playUi, type PackCue } from "@/lib/sfx";
import { PACK, tierRank, type OpenedPack, type Pull, type Purchase, type Tier } from "@/lib/shop";

/**
 * Opening packs (owner's reference video, 19/10; the look is rebuilt here, nothing is taken from the video).
 * 10 packs first stand in two rows (a pack holding a UR has a rainbow frame); MỞ opens them one by one.
 * Each pack: it lands on the stage and lightning strikes beside it; a pack holding a UR also gets a red bolt, a
 * white flash and turns rainbow. Tap: a beam of light falls on it, its top is torn off and the stage bursts into
 * vertical light (blue = all Normal, gold = best is SR, rainbow = a UR). The 3 cards fly in face down (an SR back
 * glows gold, a UR back purple); tap to turn them: an SR jumps up in gold sparks, a UR comes forward in a ring of
 * light until the next tap. Then Tiếp, and after the last pack the results: every card drawn, tap one to read it.
 */
type Step = "enter" | "omen" | "ready" | "cut" | "deal" | "flip";
type Bolt = { key: number; x: number; tone: "blue" | "red"; path: string; branches: string[]; sparks: Spark[] };
type Spark = { dx: number; dy: number; size: number; delay: number };

const BEAM: Record<Tier, PackCue> = { N: "beamN", SR: "beamSR", UR: "beamUR" };
/** The card back by tier (owner, 19/10: an SR back is gold, a UR back purple). */
const BACK: Record<Tier, string> = { N: "/ui/card-back.webp", SR: "/ui/card-back-sr.webp", UR: "/ui/card-back-ur.webp" };
const TIER_LABEL: Record<Tier, string> = { N: "N", SR: "SR", UR: "UR" };
/** When the cards start flying in after the tap, and how far apart. */
const DEAL_AT = 1900;
const DEAL_GAP = 110;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function line(points: Array<[number, number]>) {
  return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}

/** A jagged bolt from the sky to the floor in a 60 × 200 box, with a few short forks. */
function makeBolt(key: number, x: number, tone: "blue" | "red"): Bolt {
  const points: Array<[number, number]> = [[30 + rand(-6, 6), 0]];
  const steps = 11;
  for (let i = 1; i < steps; i += 1) points.push([30 + rand(-11, 11), (i / steps) * 200 + rand(-5, 5)]);
  points.push([30 + rand(-2, 2), 200]);
  const branches = [3, 6, 8].map((at) => {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const fork: Array<[number, number]> = [points[at]];
    let [px, py] = points[at];
    for (let k = 0; k < 3; k += 1) {
      px += dir * rand(4, 9);
      py += rand(8, 16);
      fork.push([px, py]);
    }
    return line(fork);
  });
  const sparks = Array.from({ length: 12 }, () => {
    const angle = rand(Math.PI * 1.05, Math.PI * 1.95);
    const reach = rand(18, 70);
    return { dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach * 0.8, size: rand(2.5, 5), delay: rand(0, 90) };
  });
  return { key, x, tone, path: line(points), branches, sparks };
}

export function PackOpening({ purchase, onDone }: { purchase: Purchase; onDone: () => void }) {
  const total = purchase.packs.length;
  const [phase, setPhase] = useState<"overview" | "pack" | "results">(total > 1 ? "overview" : "pack");
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState<Pull | null>(null);

  function next() {
    playUi("select");
    if (index < total - 1) setIndex(index + 1);
    else setPhase("results");
  }

  return (
    <div className="po" role="dialog" aria-label={tr("Mở gói")}>
      {phase === "overview" ? (
        <Overview
          packs={purchase.packs}
          onOpen={() => {
            playUi("confirm");
            setPhase("pack");
          }}
        />
      ) : null}
      {phase === "pack" ? (
        <PackStage key={index} pack={purchase.packs[index]} count={total > 1 ? `${index + 1}/${total}` : ""} last={index === total - 1} known={total > 1} onNext={next} />
      ) : null}
      {phase === "results" ? <Results purchase={purchase} onTap={setSheet} onDone={onDone} /> : null}
      {phase !== "results" ? (
        <button type="button" className="po-skip" onClick={() => setPhase("results")}>
          {tr("Bỏ qua")}
        </button>
      ) : null}
      {sheet ? (
        sheet.kind === "monster" ? <CardMonsterSheet id={sheet.id} onClose={() => setSheet(null)} /> : <SpellSheet id={sheet.id} onClose={() => setSheet(null)} />
      ) : null}
    </div>
  );
}

/** The 10 packs before opening, two rows of five; MỞ (or a tap anywhere) opens the first. */
function Overview({ packs, onOpen }: { packs: OpenedPack[]; onOpen: () => void }) {
  return (
    <div className="po-ten" onClick={onOpen}>
      <div className="po-ten-grid">
        {packs.map((pack, index) => (
          <span key={index} className={`po-ten-pack${pack.best === "UR" ? " is-rainbow" : ""}`} style={{ "--i": index } as CSSProperties}>
            <img src={PACK.art} alt="" draggable={false} />
          </span>
        ))}
      </div>
      <button type="button" className="po-open">
        {tr("MỞ")}
      </button>
    </div>
  );
}

/**
 * One pack on the stage. `known`: the pack was already shown rainbow in the 10 pack overview, so it lands rainbow.
 */
function PackStage({ pack, count, last, known, onNext }: { pack: OpenedPack; count: string; last: boolean; known: boolean; onNext: () => void }) {
  const ur = pack.best === "UR";
  const [step, setStep] = useState<Step>("enter");
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const [flash, setFlash] = useState(false);
  const [rainbow, setRainbow] = useState(known && ur);
  const [flipped, setFlipped] = useState<boolean[]>(() => pack.pulls.map(() => false));
  const [pop, setPop] = useState<number | null>(null);
  const [show, setShow] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const boltKey = useRef(0);

  const later = (ms: number, job: () => void) => {
    timers.current.push(window.setTimeout(job, ms));
  };
  const clearAll = () => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  };

  function strike(tone: "blue" | "red", x: number) {
    boltKey.current += 1;
    const bolt = makeBolt(boltKey.current, x, tone);
    setBolts((now) => [...now, bolt]);
    playPack(tone === "red" ? "redStrike" : "strike");
    window.setTimeout(() => setBolts((now) => now.filter((item) => item.key !== bolt.key)), 760);
  }

  // The omen: blue bolts for every pack; a pack holding a UR also gets a red bolt, a flash, and turns rainbow.
  useEffect(() => {
    later(380, () => setStep("omen"));
    later(560, () => strike("blue", 26));
    later(960, () => strike("blue", 74));
    if (ur) {
      later(1400, () => strike("red", 20));
      later(1880, () => {
        setFlash(true);
        playPack("flash");
      });
      later(2120, () => setRainbow(true));
      later(2480, () => setFlash(false));
      later(2700, () => setStep("ready"));
    } else later(1500, () => setStep("ready"));
    return clearAll;
    // Runs once per pack (the stage is keyed by the pack's index).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishOmen() {
    clearAll();
    setBolts([]);
    setFlash(false);
    if (ur) setRainbow(true);
    setStep("ready");
  }

  function cut() {
    clearAll();
    setStep("cut");
    playPack("cut");
    later(260, () => playPack(BEAM[pack.best]));
    later(DEAL_AT, () => setStep("deal"));
    pack.pulls.forEach((_, slot) => later(DEAL_AT + 80 + slot * DEAL_GAP, () => playPack("deal")));
    later(DEAL_AT + pack.pulls.length * DEAL_GAP + 480, () => setStep("flip"));
  }

  function flip(slot: number) {
    if (step !== "flip" || flipped[slot]) return;
    setFlipped((now) => now.map((turned, index) => turned || index === slot));
    const tier = pack.pulls[slot].tier;
    if (tier === "UR") {
      playPack("flipUR");
      later(360, () => setShow(slot));
    } else if (tier === "SR") {
      playPack("flipSR");
      setPop(slot);
      later(980, () => setPop((now) => (now === slot ? null : now)));
    } else playPack("flip");
  }

  function tapStage() {
    if (step === "enter" || step === "omen") return finishOmen();
    if (step === "ready") return cut();
    if (step !== "flip") return;
    if (show !== null) return setShow(null);
    const nextSlot = flipped.findIndex((turned) => !turned);
    if (nextSlot >= 0) flip(nextSlot);
  }

  const packOut = step === "deal" || step === "flip";
  const done = step === "flip" && show === null && flipped.every(Boolean);

  return (
    <div className={`po-stage is-${step}`} onClick={tapStage}>
      <span className="po-floor" aria-hidden="true" />
      {rainbow ? <span className="po-floor-glow" aria-hidden="true" /> : null}
      {count ? <b className="po-count">{count}</b> : null}
      {step === "cut" ? <Stripes tier={pack.best} /> : null}
      {bolts.map((bolt) => (
        <BoltView key={bolt.key} bolt={bolt} />
      ))}
      {step === "cut" ? <span className="po-cone" aria-hidden="true" /> : null}
      {!packOut ? (
        <div className={`po-pack${rainbow ? " is-rainbow" : ""}${flash ? " is-white" : ""}${step === "cut" ? " is-cut" : ""}${step === "ready" ? " is-ready" : ""}`}>
          <img className="po-pack-body" src={PACK.art} alt="" draggable={false} />
          <img className="po-pack-top" src={PACK.art} alt="" draggable={false} />
          {step === "cut" ? <span className="po-pack-light" aria-hidden="true" /> : null}
        </div>
      ) : null}
      {step === "ready" ? <p className="po-hint">{tr("Chạm để mở gói")}</p> : null}
      {packOut ? (
        <div className="po-row">
          {pack.pulls.map((pull, slot) => (
            <PackCard
              key={slot}
              pull={pull}
              slot={slot}
              flipped={flipped[slot]}
              pop={pop === slot}
              away={show === slot}
              onFlip={(event) => {
                event.stopPropagation();
                if (show !== null) setShow(null);
                else flip(slot);
              }}
            />
          ))}
        </div>
      ) : null}
      {show !== null ? <Showcase pull={pack.pulls[show]} onClose={() => setShow(null)} /> : null}
      {flash ? <span className="po-flash" aria-hidden="true" /> : null}
      {done ? (
        <button
          type="button"
          className="po-next"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
        >
          {last ? tr("Xem kết quả") : tr("Tiếp")}
        </button>
      ) : null}
    </div>
  );
}

function BoltView({ bolt }: { bolt: Bolt }) {
  return (
    <>
      <svg className={`po-bolt is-${bolt.tone}`} style={{ left: `${bolt.x}%` }} viewBox="0 0 60 200" preserveAspectRatio="none" aria-hidden="true">
        {[bolt.path, ...bolt.branches].map((d, index) => (
          <g key={index} className={index ? "is-fork" : undefined}>
            <path className="po-bolt-glow" d={d} />
            <path className="po-bolt-core" d={d} />
          </g>
        ))}
      </svg>
      <span className={`po-spark is-${bolt.tone}`} style={{ left: `${bolt.x}%` }} aria-hidden="true">
        {bolt.sparks.map((spark, index) => (
          <i key={index} style={{ "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px`, "--s": `${spark.size}px`, "--t": `${spark.delay}ms` } as CSSProperties} />
        ))}
      </span>
    </>
  );
}

/** The burst of vertical light when the pack is torn open, coloured by its best card. */
function Stripes({ tier }: { tier: Tier }) {
  const bars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const x = rand(-2, 100);
        return { x, w: rand(0.5, 3.6), o: rand(0.35, 1), d: rand(0, 600), h: Math.round((x / 100) * 320 + 290) % 360, key: index };
      }),
    [],
  );
  return (
    <span className={`po-stripes is-${tier}`} aria-hidden="true">
      {bars.map((bar) => (
        <i key={bar.key} style={{ "--x": `${bar.x}%`, "--w": `${bar.w}%`, "--o": bar.o, "--d": `${bar.d}ms`, "--h": bar.h } as CSSProperties} />
      ))}
    </span>
  );
}

/**
 * The card as a picture only (owner, 19/10): its art in the gold frame of Đổi hình nền (Chỉnh sửa bộ bài),
 * no figures and no name.
 */
function Face({ pull }: { pull: Pull }) {
  const art = pull.kind === "monster" ? artSrc(pull.id, 1) : spellSrc(pull.id);
  return (
    <span className="po-face">
      <span className="po-face-art" style={{ backgroundImage: `url(${art})` }} />
      <img className="po-face-frame" src="/ui/cover-frame.png" alt="" draggable={false} />
    </span>
  );
}

/** MỚI for a card drawn for the first time, its tier, and +1★ for a card already owned. */
function Badges({ pull }: { pull: Pull }) {
  return (
    <>
      {pull.fresh ? <b className="po-new">{tr("MỚI")}</b> : null}
      <b className={`po-tag is-${pull.tier}`}>{TIER_LABEL[pull.tier]}</b>
      {pull.refund ? <b className="po-refund">+{pull.refund}★</b> : null}
    </>
  );
}

function PackCard({ pull, slot, flipped, pop, away, onFlip }: { pull: Pull; slot: number; flipped: boolean; pop: boolean; away: boolean; onFlip: (event: MouseEvent) => void }) {
  return (
    <span className="po-slot" style={{ "--i": slot } as CSSProperties}>
      <button type="button" className={`po-card is-${pull.tier}${flipped ? " is-flipped" : ""}${pop ? " is-pop" : ""}${away ? " is-away" : ""}`} onClick={onFlip} aria-label={flipped ? undefined : tr("Lật lá")}>
        <span className="po-card-inner">
          <span className="po-card-back">
            <img src={BACK[pull.tier]} alt="" draggable={false} />
          </span>
          <span className="po-card-front">
            <Face pull={pull} />
          </span>
        </span>
        {flipped ? <Badges pull={pull} /> : null}
        {pop ? <Burst count={16} /> : null}
      </button>
    </span>
  );
}

/** Sparks flying out from the middle of their box. */
function Burst({ count, rainbow = false }: { count: number; rainbow?: boolean }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + rand(-0.2, 0.2);
        const reach = rand(34, 70);
        return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, s: rand(3, 6.5), d: rand(0, 160), h: Math.round(rand(0, 360)), key: index };
      }),
    [count],
  );
  // The reach is in px for a card in the row; the UR showcase spreads it wider (--k in styles.css).
  return (
    <span className={`po-burst${rainbow ? " is-rainbow" : ""}`} aria-hidden="true">
      {sparks.map((spark) => (
        <i key={spark.key} style={{ "--x": `${spark.x}px`, "--y": `${spark.y}px`, "--s": `${spark.s}px`, "--d": `${spark.d}ms`, "--h": spark.h } as CSSProperties} />
      ))}
    </span>
  );
}

/** A UR comes forward in a ring of light and stays there until a tap sends it back (owner, 19/10). */
function Showcase({ pull, onClose }: { pull: Pull; onClose: () => void }) {
  return (
    <div
      className="po-show"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <span className="po-bubble" aria-hidden="true" />
      <span className="po-show-card">
        <Face pull={pull} />
        <Badges pull={pull} />
      </span>
      <Burst count={26} rainbow />
    </div>
  );
}

/** Every card drawn, rarest first; tap one to read it, OK goes back to the shop. */
function Results({ purchase, onTap, onDone }: { purchase: Purchase; onTap: (pull: Pull) => void; onDone: () => void }) {
  const pulls = useMemo(() => purchase.packs.flatMap((pack) => pack.pulls).sort((a, b) => tierRank(b.tier) - tierRank(a.tier)), [purchase]);
  return (
    <div className="po-results">
      <header className="po-results-head">
        <h2>{tr("Kết quả mở gói")}</h2>
        <p>
          {tr("Lá mới nhận")}: <b>{purchase.fresh}</b>
          {purchase.refund ? (
            <>
              {" · "}
              {tr("Lá trùng hoàn")}: <b className="is-star">+{purchase.refund}★</b>
            </>
          ) : null}
        </p>
      </header>
      <div className="po-grid">
        {pulls.map((pull, index) => (
          <button key={index} type="button" className={`po-res is-${pull.tier}`} style={{ "--i": index } as CSSProperties} onClick={() => onTap(pull)}>
            <Face pull={pull} />
            <Badges pull={pull} />
          </button>
        ))}
      </div>
      <footer className="po-results-foot">
        <button
          type="button"
          className="po-ok"
          onClick={() => {
            playUi("confirm");
            onDone();
          }}
        >
          OK
        </button>
      </footer>
    </div>
  );
}
