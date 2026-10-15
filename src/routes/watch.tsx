import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { CardFace } from "@/components/game/card-face";
import { CopyText } from "@/components/game/copy-text";
import { Painted } from "@/components/game/painted";
import { DECK_NOTES, FORMS, MONSTERS, SPELLS, monsterCard, spellCard } from "@/lib/catalog";
import { clearHabits, loadHabits, watchLines } from "@/lib/habits";
import { diagnoseHistory, exportStoredHistory, matchHistoryProblem, type HistoryDiag, type HistoryPack } from "@/lib/match-history";
import { loadStrategies, saveStrategies, sortCards, sortStrategies, type Strategy } from "@/lib/strategies";
import { tr, useLang } from "@/lib/i18n";
import { UPDATE_RELEASES } from "@/lib/updates";

const AI_INTRO = "AI nhìn cách bạn chơi, theo hướng của đối thủ. Chưa đủ dữ liệu thì nó đánh lối cơ bản.";
const AI_BASICS = [
  "Rút quái sớm để lên 1 sao, rồi 2 sao.",
  "Đã có quái trên sân thì rút phép để dành, đồng thời tích sao.",
  "Gọi quái sớm khi đủ sao.",
  "Diệt cục bông bản chính, gã hề đang tích năng lượng, và thiên sứ.",
];

const MARK_KEY = "clash-export-mark";

type ExportMark = { notes: string[]; plans: Record<string, string>; tested?: string };

function planStamp(plan: Strategy) {
  return JSON.stringify([plan.name, [...plan.cards].sort(), plan.text, plan.source]);
}

function currentMark(): ExportMark {
  return {
    notes: UPDATE_RELEASES.flatMap((release) => release.notes.map((note) => `${release.version}|${note.n}|${note.text}`)),
    plans: Object.fromEntries(loadStrategies().map((plan) => [plan.id, planStamp(plan)])),
    tested: testedStamp(loadTested()),
  };
}

function readMark(): ExportMark | null {
  try {
    const data = JSON.parse(localStorage.getItem(MARK_KEY) ?? "") as Partial<ExportMark>;
    if (!data || !Array.isArray(data.notes) || typeof data.plans !== "object" || !data.plans) return null;
    return {
      notes: data.notes.filter((item): item is string => typeof item === "string"),
      plans: data.plans,
      tested: typeof data.tested === "string" ? data.tested : undefined,
    };
  } catch {
    return null;
  }
}

function writeMark(mark: ExportMark) {
  localStorage.setItem(MARK_KEY, JSON.stringify(mark));
}

function planBlock(plan: Strategy) {
  const names = sortCards(plan.cards).map((id) => monsterCard(id)?.name ?? spellCard(id)?.name ?? id);
  return [plan.name || "Chưa đặt tên", names.length ? `Lá: ${names.join(", ")}` : "Lá: chưa có", plan.text ? `Mô tả: ${plan.text}` : "", plan.source ? `Nguồn: ${plan.source}` : ""]
    .filter(Boolean)
    .join("\n");
}

function testedStamp(board: TestBoard) {
  const ids = (list: string[]) => [...list].sort();
  return JSON.stringify({
    tryingMonsters: ids(board.tryingMonsters),
    tryingSpells: ids(board.tryingSpells),
    monsters: ids(board.monsters),
    spells: ids(board.spells),
  });
}

function testedHasCards(board: TestBoard) {
  return board.tryingMonsters.length + board.tryingSpells.length + board.monsters.length + board.spells.length > 0;
}

function testedNames(ids: string[], kind: "monster" | "spell") {
  if (kind === "monster") {
    return ids
      .map((id) => monsterCard(id))
      .filter((card) => !!card)
      .sort(byStars)
      .map((card) => card.name);
  }
  return ids
    .map((id) => spellCard(id))
    .filter((card) => !!card)
    .sort(byGems)
    .map((card) => card.name);
}

function testedBlock(board: TestBoard) {
  const group = (title: string, monsters: string[], spells: string[]) => {
    const rows: string[] = [];
    const monsterNames = testedNames(monsters, "monster");
    const spellNames = testedNames(spells, "spell");
    if (monsterNames.length) rows.push(`Quái: ${monsterNames.join(", ")}`);
    if (spellNames.length) rows.push(`Phép: ${spellNames.join(", ")}`);
    if (!rows.length) return "";
    return [title, ...rows].join("\n");
  };
  const parts = [group("Testing", board.tryingMonsters, board.tryingSpells), group("Tested", board.monsters, board.spells)].filter(Boolean);
  return parts.length ? parts.join("\n\n") : "Không còn lá đã lưu.";
}

function infoText(previous: ExportMark) {
  const known = new Set(previous.notes);
  const updates = UPDATE_RELEASES.flatMap((release) => {
    const notes = [...release.notes].sort((a, b) => a.n - b.n).filter((note) => !known.has(`${release.version}|${note.n}|${note.text}`));
    if (!notes.length) return [];
    return [`${release.version}\n${notes.map((note) => `${note.n}. ${note.text}`).join("\n")}`];
  });
  const plans = sortStrategies(loadStrategies())
    .filter((plan) => previous.plans[plan.id] !== planStamp(plan))
    .map(planBlock);
  const saved = loadTested();
  const savedChanged = previous.tested !== undefined ? previous.tested !== testedStamp(saved) : testedHasCards(saved);
  if (!updates.length && !plans.length && !savedChanged) return "THÔNG TIN MỚI\n\nKhông có thông tin mới.\n";
  const parts = ["THÔNG TIN MỚI"];
  if (updates.length) parts.push(`CẬP NHẬT\n${updates.join("\n\n")}`);
  if (plans.length) parts.push(`CHIẾN THUẬT\n${plans.join("\n\n")}`);
  if (savedChanged) parts.push(`ĐÃ LƯU\n${testedBlock(saved)}`);
  return `${parts.join("\n\n")}\n`;
}

function exportInfo(onDone: (saved: boolean) => void) {
  const previous = readMark() ?? currentMark();
  const text = infoText(previous);
  const next = currentMark();
  const changed = !text.includes("Không có thông tin mới.");
  const file = new File([text], "thong-tin.txt", { type: "text/plain;charset=utf-8" });
  const finish = () => {
    writeMark(next);
    onDone(changed);
  };
  const save = () => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    finish();
  };
  if (navigator.canShare?.({ files: [file] })) {
    void navigator.share({ files: [file], title: "Thông tin" }).then(finish).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      save();
    });
    return;
  }
  save();
}

export const Route = createFileRoute("/watch")({ component: InfoPage });

function InfoPage() {
  const [pane, setPane] = useState<"menu" | "updates" | "ai" | "plans" | "tested" | "matches">("menu");
  const [exported, setExported] = useState(false);
  useLang();
  useEffect(() => {
    if (!readMark()) writeMark(currentMark());
  }, []);
  if (pane === "updates") return <Updates onBack={() => setPane("menu")} />;
  if (pane === "ai") return <AiWatch onBack={() => setPane("menu")} />;
  if (pane === "plans") return <Plans onBack={() => setPane("menu")} />;
  if (pane === "tested") return <Tested onBack={() => setPane("menu")} />;
  if (pane === "matches") return <MatchExport onBack={() => setPane("menu")} />;
  return (
    <main className="watch is-menu">
      <Link to="/" className="watch-back">
        {tr("Về sân")}
      </Link>
      <h1>{tr("Thông tin")}</h1>
      <div className="mode-list">
        <button type="button" className="act press" onClick={() => setPane("updates")}>
          {tr("Cập nhật")}
        </button>
        <button type="button" className="act press" onClick={() => setPane("plans")}>
          {tr("Chiến thuật")}
        </button>
        <button type="button" className="act press" onClick={() => setPane("tested")}>
          {tr("Đã test")}
        </button>
        <button type="button" className="act press" onClick={() => setPane("matches")}>
          {tr("Xuất lịch sử ván đấu")}
        </button>
      </div>
      <footer className="info-foot">
        <button type="button" className="act press is-export" onClick={() => exportInfo(setExported)}>
          {tr("Xuất")}
        </button>
        {exported ? <p className="export-saved">{tr("Đã lưu")}</p> : null}
      </footer>
    </main>
  );
}

type TestBoard = {
  monsters: string[];
  spells: string[];
  tryingMonsters: string[];
  tryingSpells: string[];
  test2Monsters: string[];
  test2Spells: string[];
  notes: Record<string, string>;
};

function Tested({ onBack }: { onBack: () => void }) {
  const [deck, setDeck] = useState(loadTested);
  const [tab, setTab] = useState<"monster" | "spell" | "testing" | "tested">("monster");
  const [info, setInfo] = useState<string | null>(null);
  const [saveGone, setSaveGone] = useState(false);
  useLang();
  const gray = new Set(FORMS.map((card) => card.id));
  const busy = new Set([...deck.monsters, ...deck.tryingMonsters, ...deck.test2Monsters]);
  const busySpells = new Set([...deck.spells, ...deck.tryingSpells, ...deck.test2Spells]);
  const poolMonsters = [...MONSTERS, ...FORMS].filter((card) => !busy.has(card.id)).sort(byStars);
  const poolSpells = SPELLS.filter((card) => !busySpells.has(card.id)).sort(byGems);
  const tryingMonsters = deck.tryingMonsters.map((id) => monsterCard(id)).filter((card) => !!card).sort(byStars);
  const tryingSpells = deck.tryingSpells.map((id) => spellCard(id)).filter((card) => !!card).sort(byGems);
  const pickedMonsters = deck.monsters.map((id) => monsterCard(id)).filter((card) => !!card).sort(byStars);
  const pickedSpells = deck.spells.map((id) => spellCard(id)).filter((card) => !!card).sort(byGems);
  const tabs = ["monster", "spell", "testing", "tested"] as const;
  const shown =
    tab === "monster"
      ? poolMonsters.length
      : tab === "spell"
        ? poolSpells.length
        : tab === "testing"
          ? tryingMonsters.length + tryingSpells.length
          : pickedMonsters.length + pickedSpells.length;
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  function slide(next: number) {
    const index = tabs.indexOf(tab);
    const landed = index + next;
    if (landed < 0 || landed >= tabs.length) return;
    setTab(tabs[landed]);
    setInfo(null);
  }

  function tap(id: string, kind: "monster" | "spell", from: "pool" | "testing" | "tested") {
    if (info) {
      setInfo(info === id ? null : id);
      return;
    }
    setDeck((current) => {
      if (from === "pool") {
        if (kind === "monster") {
          if (current.tryingMonsters.includes(id) || current.monsters.includes(id) || current.test2Monsters.includes(id)) return current;
          return { ...current, tryingMonsters: [...current.tryingMonsters, id] };
        }
        if (current.tryingSpells.includes(id) || current.spells.includes(id) || current.test2Spells.includes(id)) return current;
        return { ...current, tryingSpells: [...current.tryingSpells, id] };
      }
      if (from === "testing") {
        return kind === "monster"
          ? { ...current, tryingMonsters: current.tryingMonsters.filter((item) => item !== id) }
          : { ...current, tryingSpells: current.tryingSpells.filter((item) => item !== id) };
      }
      return kind === "monster"
        ? { ...current, monsters: current.monsters.filter((item) => item !== id) }
        : { ...current, spells: current.spells.filter((item) => item !== id) };
    });
  }

  function toTested(id: string, kind: "monster" | "spell") {
    setDeck((current) => {
      if (kind === "monster") {
        return {
          ...current,
          tryingMonsters: current.tryingMonsters.filter((item) => item !== id),
          test2Monsters: current.test2Monsters.filter((item) => item !== id),
          monsters: current.monsters.includes(id) ? current.monsters : [...current.monsters, id],
        };
      }
      return {
        ...current,
        tryingSpells: current.tryingSpells.filter((item) => item !== id),
        test2Spells: current.test2Spells.filter((item) => item !== id),
        spells: current.spells.includes(id) ? current.spells : [...current.spells, id],
      };
    });
  }

  return (
    <main className="builder">
      <header className="deck-head">
        <button type="button" className="chip" onClick={onBack}>
          Quay lại
        </button>
        <div className="deck-count">
          <strong>{shown}</strong>
        </div>
        {saveGone ? (
          <span className="save is-gone" />
        ) : (
          <button
            type="button"
            className="save press"
            onClick={() => {
              saveTested(deck);
              setSaveGone(true);
              window.setTimeout(() => setSaveGone(false), 3000);
            }}
          >
            {tr("Lưu")}
          </button>
        )}
      </header>
      <div className="deck-tabs">
        <button type="button" className={`chip${tab === "monster" ? " on" : ""}`} onClick={() => { setTab("monster"); setInfo(null); }}>
          {tr("Quái")}
        </button>
        <button type="button" className={`chip${tab === "spell" ? " on" : ""}`} onClick={() => { setTab("spell"); setInfo(null); }}>
          {tr("Phép")}
        </button>
        <button type="button" className={`chip${tab === "testing" ? " on" : ""}`} onClick={() => { setTab("testing"); setInfo(null); }}>
          Testing
        </button>
        <button type="button" className={`chip${tab === "tested" ? " on" : ""}`} onClick={() => { setTab("tested"); setInfo(null); }}>
          Tested
        </button>
      </div>
      <div
        className="deck-grid"
        onPointerDown={(event) => {
          swipe.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          if (!swipe.current) return;
          const dx = event.clientX - swipe.current.x;
          const dy = event.clientY - swipe.current.y;
          swipe.current = null;
          if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
          swiped.current = true;
          slide(dx < 0 ? 1 : -1);
        }}
        onClickCapture={(event) => {
          if (!swiped.current) return;
          swiped.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {tab === "monster"
          ? poolMonsters.map((card) => (
              <Fragment key={card.id}>
                <TestPick gray={gray.has(card.id)} held={info === card.id} onHold={() => setInfo(card.id)} onTap={() => tap(card.id, "monster", "pool")}>
                  <CardFace monster={card} selected={info === card.id} />
                </TestPick>
                {info === card.id ? <TestCopy id={card.id} /> : null}
              </Fragment>
            ))
          : null}
        {tab === "spell"
          ? poolSpells.map((card) => (
              <Fragment key={card.id}>
                <TestPick held={info === card.id} onHold={() => setInfo(card.id)} onTap={() => tap(card.id, "spell", "pool")}>
                  <CardFace spellId={card.id} selected={info === card.id} />
                </TestPick>
                {info === card.id ? <TestCopy id={card.id} /> : null}
              </Fragment>
            ))
          : null}
        {tab === "testing" ? (
          <>
            {tryingMonsters.map((card) => (
              <Fragment key={card.id}>
                <TestPick gray={gray.has(card.id)} held={false} onHold={() => toTested(card.id, "monster")} onTap={() => tap(card.id, "monster", "testing")}>
                  <CardFace monster={card} />
                </TestPick>
              </Fragment>
            ))}
            {tryingSpells.map((card) => (
              <Fragment key={card.id}>
                <TestPick held={false} onHold={() => toTested(card.id, "spell")} onTap={() => tap(card.id, "spell", "testing")}>
                  <CardFace spellId={card.id} />
                </TestPick>
              </Fragment>
            ))}
          </>
        ) : null}
        {tab === "tested" ? (
          <>
            {pickedMonsters.map((card) => (
              <Fragment key={card.id}>
                <TestPick gray={gray.has(card.id)} held={info === card.id} onHold={() => setInfo(card.id)} onTap={() => tap(card.id, "monster", "tested")}>
                  <CardFace monster={card} selected={info === card.id} />
                </TestPick>
                {info === card.id ? <TestCopy id={card.id} /> : null}
              </Fragment>
            ))}
            {pickedSpells.map((card) => (
              <Fragment key={card.id}>
                <TestPick held={info === card.id} onHold={() => setInfo(card.id)} onTap={() => tap(card.id, "spell", "tested")}>
                  <CardFace spellId={card.id} selected={info === card.id} />
                </TestPick>
                {info === card.id ? <TestCopy id={card.id} /> : null}
              </Fragment>
            ))}
          </>
        ) : null}
      </div>
    </main>
  );
}

function byStars(a: { stars: number; name: string }, b: { stars: number; name: string }) {
  return a.stars - b.stars || a.name.localeCompare(b.name, "vi");
}

function byGems(a: { gems: number; name: string }, b: { gems: number; name: string }) {
  return a.gems - b.gems || a.name.localeCompare(b.name, "vi");
}

const TESTED_KEY = "clash-tested";

function loadTested(): TestBoard {
  const empty: TestBoard = { monsters: [], spells: [], tryingMonsters: [], tryingSpells: [], test2Monsters: [], test2Spells: [], notes: {} };
  try {
    const raw = JSON.parse(localStorage.getItem(TESTED_KEY) ?? "") as {
      monsters?: unknown;
      spells?: unknown;
      tryingMonsters?: unknown;
      tryingSpells?: unknown;
      test2Monsters?: unknown;
      test2Spells?: unknown;
      notes?: unknown;
    };
    const ids = (value: unknown, kind: "monster" | "spell") =>
      Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && (kind === "monster" ? !!monsterCard(id) : !!spellCard(id))) : [];
    const monsters = ids(raw.monsters, "monster");
    const spells = ids(raw.spells, "spell");
    for (const id of ids(raw.test2Monsters, "monster")) if (!monsters.includes(id)) monsters.push(id);
    for (const id of ids(raw.test2Spells, "spell")) if (!spells.includes(id)) spells.push(id);
    const notes = raw.notes && typeof raw.notes === "object" ? Object.fromEntries(Object.entries(raw.notes).filter((entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string")) : {};
    return {
      monsters,
      spells,
      tryingMonsters: ids(raw.tryingMonsters, "monster"),
      tryingSpells: ids(raw.tryingSpells, "spell"),
      test2Monsters: [],
      test2Spells: [],
      notes,
    };
  } catch {
    return empty;
  }
}

function saveTested(deck: TestBoard) {
  localStorage.setItem(TESTED_KEY, JSON.stringify(deck));
}

function TestCopy({ id }: { id: string }) {
  const monster = monsterCard(id);
  const spell = monster ? undefined : spellCard(id);
  if (!monster && !spell) return null;
  return (
    <aside className={`focus-copy is-inline${monster ? " is-skill" : " is-spell"}`}>
      <h2>{monster?.name ?? spell?.name}</h2>
      <p className={monster ? "ink-skill" : "ink-spell"}>
        <CopyText text={monster?.skill ?? spell?.effect ?? ""} />
      </p>
      {DECK_NOTES[id] ? <p className="deck-note">{tr(DECK_NOTES[id])}</p> : null}
    </aside>
  );
}

function TestPick({ gray = false, held, onHold, onTap, children }: { gray?: boolean; held: boolean; onHold: () => void; onTap: () => void; children: ReactNode }) {
  const timer = useRef<number | null>(null);
  const didHold = useRef(false);
  function clear() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }
  return (
    <button
      type="button"
      className={`pick press${held ? " is-held" : ""}${gray ? " is-locked" : ""}`}
      onPointerDown={() => {
        didHold.current = false;
        clear();
        timer.current = window.setTimeout(() => {
          didHold.current = true;
          onHold();
        }, 420);
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onClick={() => {
        if (didHold.current) {
          didHold.current = false;
          return;
        }
        onTap();
      }}
    >
      {children}
    </button>
  );
}

function MatchExport({ onBack }: { onBack: () => void }) {
  const [pack, setPack] = useState<HistoryPack | null>(null);
  const [problem, setProblem] = useState("");
  const [note, setNote] = useState("");
  const [diag, setDiag] = useState<HistoryDiag | null>(null);
  useLang();
  useEffect(() => {
    let live = true;
    void exportStoredHistory().then((next) => {
      if (!live) return;
      setPack(next);
      setProblem(matchHistoryProblem() ?? "");
    });
    return () => {
      live = false;
    };
  }, []);
  function download() {
    if (pack?.status !== "ready") return;
    const file = new File([pack.json], "lich-su-van-dau.json", { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }
  async function copy() {
    if (pack?.status !== "ready") return;
    try {
      await navigator.clipboard.writeText(pack.json);
      setNote(tr("Đã sao chép."));
    } catch {
      setNote(tr("Không sao chép được."));
    }
  }
  function countText(count: number | null, error: string) {
    if (error && count === null) return error;
    return `${count ?? 0} bản ghi`;
  }
  return (
    <main className="watch">
      <button type="button" className="watch-back" onClick={onBack}>
        Quay lại
      </button>
      <h1>{tr("Xuất lịch sử ván đấu")}</h1>
      <section className="watch-card">
        {!pack ? <p>{tr("Đang đọc lịch sử…")}</p> : null}
        {pack?.status === "ready" ? <p>{`${pack.count} ${tr("ván AI đã lưu")}`}</p> : null}
        {pack?.status === "empty" && !problem ? <p>{tr("Chưa có ván AI nào được lưu.")}</p> : null}
        {pack?.status === "broken" ? <p>{tr(pack.message ?? "Lịch sử không đọc được. Dữ liệu gốc vẫn giữ nguyên.")}</p> : null}
        {problem && pack?.status === "ready" ? <p>{tr(problem)}</p> : null}
        {note ? <p>{note}</p> : null}
        {diag ? (
          <pre className="tuner-note">
            {`IndexedDB: ${diag.idb}
Bộ nhớ tạm: ${diag.memory ?? "không đọc được"}
localStorage: ${countText(diag.local.count, diag.local.error)}
sessionStorage: ${countText(diag.session.count, diag.session.error)}
IndexedDB: ${countText(diag.indexed.count, diag.indexed.error)}
Ghi gần nhất: local ${diag.lastWrite.local}, session ${diag.lastWrite.session}, indexedDB ${diag.lastWrite.idb}
Kết thúc gần nhất: ${diag.lastSeal ? `winner ${diag.lastSeal.winner} step ${diag.lastSeal.step} ${diag.lastSeal.saved ? "đã lưu" : "không lưu"} ${diag.lastSeal.why}` : "chưa có"}
${diag.lines.join("\n")}`}
          </pre>
        ) : null}
      </section>
      <div className="mode-list">
        {pack?.status === "ready" ? (
          <>
            <button type="button" className="act press" onClick={download}>
              {tr("Tải tệp JSON")}
            </button>
            <button type="button" className="act press" onClick={() => void copy()}>
              {tr("Sao chép JSON")}
            </button>
          </>
        ) : null}
        <button type="button" className="act alt press" onClick={() => void diagnoseHistory().then(setDiag)}>
          Chẩn đoán
        </button>
      </div>
    </main>
  );
}

function Updates({ onBack }: { onBack: () => void }) {
  useLang();
  const [index, setIndex] = useState(0);
  const current = UPDATE_RELEASES[index];
  const last = UPDATE_RELEASES.length - 1;
  return (
    <main className="watch">
      <button type="button" className="watch-back" onClick={onBack}>
        Quay lại
      </button>
      <h1>{tr("Cập nhật")}</h1>
      <section className="watch-card">
        {current ? (
          <>
            <div className="day-nav">
              <button type="button" aria-label="Bản mới hơn" disabled={index <= 0} onClick={() => setIndex(index - 1)}>
                ‹
              </button>
              <strong className="update-version">{current.version}</strong>
              <button type="button" aria-label="Bản cũ hơn" disabled={index >= last} onClick={() => setIndex(index + 1)}>
                ›
              </button>
            </div>
            <p className="update-remark">
              <Painted text={current.remark} system />
            </p>
            <ol className="update-list">
              {[...current.notes].sort((a, b) => a.n - b.n).map((note) => (
                <li key={note.n}>
                  <b className="update-n">{note.n}</b>
                  <span>
                    <Painted text={note.text} system />
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>{tr("Chưa có bản cập nhật.")}</p>
        )}
      </section>
    </main>
  );
}

function AiWatch({ onBack }: { onBack: () => void }) {
  const [habits, setHabits] = useState(() => loadHabits());
  const lines = watchLines(habits);
  return (
    <main className="watch">
      <button type="button" className="watch-back" onClick={onBack}>
        Quay lại
      </button>
      <h1>AI</h1>
      <section className="watch-card">
        <p>{AI_INTRO}</p>
        <ul className="watch-basics">
          {AI_BASICS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {lines.map((line) => (
          <div key={line.title} className="watch-note">
            <h3>{line.title}</h3>
            <p>{line.text}</p>
          </div>
        ))}
        <button
          type="button"
          className="act alt press"
          onClick={() => {
            clearHabits();
            setHabits(loadHabits());
          }}
        >
          Xoá trí nhớ
        </button>
      </section>
    </main>
  );
}

function Plans({ onBack }: { onBack: () => void }) {
  useLang();
  const [list, setList] = useState<Strategy[]>(() => loadStrategies());
  const [edit, setEdit] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [pool, setPool] = useState<"monster" | "spell">("monster");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [spread, setSpread] = useState<Record<string, boolean>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const hold = useRef<number | null>(null);
  const skipClick = useRef(false);
  const foot = useRef<HTMLDivElement>(null);
  const shown = sortStrategies(list);
  const found = shown.findIndex((row) => row.id === currentId);
  const page = found >= 0 ? found : 0;
  const plan = shown[page];

  useEffect(() => {
    if (plan && currentId !== plan.id) setCurrentId(plan.id);
  }, [plan, currentId]);

  useEffect(() => {
    if (edit) return;
    foot.current?.scrollIntoView({ block: "end" });
  }, [edit, plan?.id]);

  function commit(next: Strategy[]) {
    setList(next);
    saveStrategies(next);
  }

  function patch(id: string, change: Partial<Strategy>) {
    commit(list.map((row) => (row.id === id ? { ...row, ...change } : row)));
  }

  function leaveEdit() {
    setEdit(false);
    setAdding(null);
    setOpen(null);
    setConfirmId(null);
  }

  function armEdit() {
    hold.current = window.setTimeout(() => {
      hold.current = null;
      skipClick.current = true;
      setEdit(true);
      setAdding(null);
      setOpen(null);
      setConfirmId(null);
    }, 600);
  }

  function dropEdit() {
    if (hold.current === null) return;
    window.clearTimeout(hold.current);
    hold.current = null;
  }

  function addPlan() {
    const row: Strategy = { id: `s${Date.now()}`, name: "Chiến thuật mới", cards: [], text: "", source: "" };
    const next = [...list, row];
    commit(next);
    setCurrentId(row.id);
    setConfirmId(null);
  }

  const cards = plan ? sortCards(plan.cards) : [];
  const taken = new Set(list.flatMap((row) => row.cards));
  const grayIds = new Set(FORMS.map((card) => card.id));
  const poolCards = plan
    ? pool === "monster"
      ? [...MONSTERS, ...FORMS].filter((card) => !taken.has(card.id)).sort((a, b) => a.stars - b.stars || a.name.localeCompare(b.name, "vi"))
      : [...SPELLS].filter((card) => !taken.has(card.id)).sort((a, b) => a.gems - b.gems || a.name.localeCompare(b.name, "vi"))
    : [];
  const long = plan ? plan.text.length > 140 || plan.source.length > 80 : false;
  const opened = plan ? Boolean(spread[plan.id]) : false;

  return (
    <main className="watch is-wide is-plan">
      <button type="button" className="watch-back" onClick={onBack}>
        Quay lại
      </button>
      <div className="info-head">
        <h1>{tr("Chiến thuật")}</h1>
        <button
          type="button"
          className={`wrench${edit ? " on" : ""}`}
          aria-label={edit ? "Thoát sửa" : "Nhấn giữ để sửa chiến thuật"}
          aria-pressed={edit}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={() => {
            if (!edit) armEdit();
          }}
          onPointerUp={dropEdit}
          onPointerLeave={dropEdit}
          onPointerCancel={dropEdit}
          onClick={() => {
            if (skipClick.current) {
              skipClick.current = false;
              return;
            }
            if (edit) leaveEdit();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M22.7 19.3 13.4 10a5 5 0 0 0-6.3-6.3l3.2 3.2-2.1 2.1-3.2-3.2a5 5 0 0 0 6.3 6.3l9.3 9.3a1.5 1.5 0 0 0 2.1-2.1Z" />
          </svg>
        </button>
      </div>
      {!plan ? <p className="plan-empty">{tr("Chưa có chiến thuật. Nhấn giữ cờ lê để sửa.")}</p> : null}
      {plan ? (
        <section className="plan">
          {edit ? (
            <input className="plan-name" value={plan.name} aria-label="Tên chiến thuật" onChange={(event) => patch(plan.id, { name: event.target.value })} />
          ) : (
            <h2 className="plan-title">{plan.name || "Chưa đặt tên"}</h2>
          )}
          <div className="deck-grid plan-grid">
            {cards.map((id) => {
              const monster = monsterCard(id);
              const key = `${plan.id}:${id}`;
              return (
                <Fragment key={id}>
                  <button
                    type="button"
                    className={`plan-card${grayIds.has(id) ? " is-gray" : ""}`}
                    onClick={() => {
                      if (edit) patch(plan.id, { cards: plan.cards.filter((item) => item !== id) });
                      else setOpen(open === key ? null : key);
                    }}
                  >
                    {monster ? <CardFace monster={monster} selected={open === key} /> : <CardFace spellId={id} selected={open === key} />}
                  </button>
                  {!edit && open === key ? (
                    <aside className={`focus-copy is-inline${monster ? " is-skill" : " is-spell"}`}>
                      <h2>{monster?.name ?? spellCard(id)?.name}</h2>
                      <p className={monster ? "ink-skill" : "ink-spell"}>
                        <CopyText text={monster?.skill ?? spellCard(id)?.effect ?? ""} />
                      </p>
                      {DECK_NOTES[id] ? <p className="deck-note">{tr(DECK_NOTES[id])}</p> : null}
                    </aside>
                  ) : null}
                </Fragment>
              );
            })}
          </div>
          {edit && adding === plan.id ? (
            <>
              <div className="deck-tabs plan-tabs">
                <button type="button" className={`chip${pool === "monster" ? " on" : ""}`} onClick={() => setPool("monster")}>{tr("Quái thú")}</button>
                <button type="button" className={`chip${pool === "spell" ? " on" : ""}`} onClick={() => setPool("spell")}>{tr("Phép")}</button>
                <button type="button" className="chip" onClick={() => setAdding(null)}>Xong</button>
              </div>
              <div className="deck-grid plan-grid">
                {poolCards.map((card) => (
                  <button key={card.id} type="button" className={`plan-card${"skill" in card && grayIds.has(card.id) ? " is-gray" : ""}`} onClick={() => patch(plan.id, { cards: [...plan.cards, card.id] })}>
                    {"skill" in card ? <CardFace monster={card} /> : <CardFace spellId={card.id} />}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {edit ? (
            <>
              {adding === plan.id ? null : (
                <button type="button" className="act alt press plan-wide" onClick={() => { setAdding(plan.id); setPool("monster"); }}>
                  Thêm lá
                </button>
              )}
              <textarea className="plan-text" value={plan.text} aria-label="Mô tả chiến thuật" placeholder="Mô tả chiến thuật" onChange={(event) => patch(plan.id, { text: event.target.value })} />
              <input className="plan-source" value={plan.source} aria-label="Nguồn" placeholder="Nguồn" onChange={(event) => patch(plan.id, { source: event.target.value })} />
              <button type="button" className="act press plan-wide" onClick={addPlan}>
                Thêm chiến thuật
              </button>
            </>
          ) : plan.text || plan.source ? (
            <div className={`plan-body${long && !opened ? " is-clamp" : ""}`}>
              {plan.text ? <p className="plan-text">{plan.text}</p> : null}
              {plan.source ? <p className="plan-source">{tr("Nguồn")}: {plan.source}</p> : null}
              {long && !opened ? (
                <button type="button" className="plan-more" onClick={() => setSpread((current) => ({ ...current, [plan.id]: true }))}>
                  Xem hết
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
      <div className="plan-bar" ref={foot}>
        {edit && plan && confirmId === plan.id ? (
          <>
            <button
              type="button"
              className="act press plan-wide"
              onClick={() => {
                const rest = list.filter((row) => row.id !== plan.id);
                const order = sortStrategies(rest);
                commit(rest);
                setCurrentId(order[Math.min(page, Math.max(0, order.length - 1))]?.id ?? null);
                setConfirmId(null);
              }}
            >
              Xoá
            </button>
            <button type="button" className="act alt press plan-wide" onClick={() => setConfirmId(null)}>
              Không
            </button>
          </>
        ) : null}
        {edit && plan && confirmId !== plan.id ? (
          <button type="button" className="act alt press plan-wide" onClick={() => setConfirmId(plan.id)}>
            Xoá
          </button>
        ) : null}
        {edit && !plan ? (
          <button type="button" className="act press plan-wide" onClick={addPlan}>
            Thêm chiến thuật
          </button>
        ) : null}
        {shown.length > 1 ? (
          <>
            <button type="button" className="plan-next press" aria-label="Chiến thuật trước" onClick={() => setCurrentId(shown[(page - 1 + shown.length) % shown.length].id)}>
              {"<"}
            </button>
            <button type="button" className="plan-next press" aria-label="Chiến thuật sau" onClick={() => setCurrentId(shown[(page + 1) % shown.length].id)}>
              {">"}
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}
