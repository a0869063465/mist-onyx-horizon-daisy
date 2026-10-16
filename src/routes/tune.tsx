import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { CardFace } from "@/components/game/card-face";
import { CopyEdit } from "@/components/game/copy-text";
import { CardFxPage } from "@/components/game/card-fx-page";
import { FxLab } from "@/components/game/fx-lab";
import { artSrc, FORMS, MONSTERS, monsterCard, SPELLS, spellCard, type MonsterCard, type SpellCard } from "@/lib/catalog";
import { defaultMonsterPicture, defaultSpellPicture, hideArt, monsterArts, spellArts, type ArtShot } from "@/lib/art-library";
import { askDraft, attackLabel, chipDraft, MONSTER_ASKS, MONSTER_CHIPS, resetMonster, resetSpell, saveAttack, saveMonster, saveSpell as saveSpellText } from "@/lib/card-edits";
import { ailmentHolds, defaultFxPrefs, defaultLooks, loadActivePack, loadFxPrefs, loadLooks } from "@/lib/fx-prefs";
import { setLang, tr, useLang } from "@/lib/i18n";
import { fxVolume, playCue, playTap, setFxVolume, setSound, setTapVolume, soundOn, tapVolume } from "@/lib/sfx";
import {
  CARD_MARKS,
  DEFAULT_BOARD_LAYOUT,
  DEFAULT_CARD,
  DEFAULT_FIELD,
  DEFAULT_SPELL,
  FIELD_MARKS,
  HUD_MARKS,
  SPELL_MARKS,
  loadBoard,
  loadCard,
  loadField,
  loadSpell,
  saveBoard,
  saveCard,
  saveField,
  saveSpell,
  type BoardLayout,
  type CardKey,
  type FieldKey,
  type HudKey,
  type SpellKey,
  type Spot,
} from "@/lib/layouts";

export const Route = createFileRoute("/tune")({ component: TunePage });

type Screen = "menu" | "board" | "monster" | "spell" | "field" | "text" | "sound" | "fx" | "cardfx";
type BoardPick = HudKey | "notice" | "trail" | "reaction" | "stack" | "env" | "envFoe";

function clamp(value: number, min: number, max: number) {
  return Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
}

function TunePage() {
  const [screen, setScreen] = useState<Screen>("menu");
  if (screen === "menu") return <Menu onPick={setScreen} />;
  if (screen === "board") return <BoardTune onBack={() => setScreen("menu")} />;
  if (screen === "monster") return <SpotTune kind="monster" onBack={() => setScreen("menu")} />;
  if (screen === "spell") return <SpotTune kind="spell" onBack={() => setScreen("menu")} />;
  if (screen === "text") return <CardTextTune onBack={() => setScreen("menu")} />;
  if (screen === "sound") return <SoundTune onBack={() => setScreen("menu")} />;
  if (screen === "fx") return <FxLab onBack={() => setScreen("menu")} />;
  if (screen === "cardfx") return <CardFxPage onBack={() => setScreen("menu")} />;
  return <FieldTune onBack={() => setScreen("menu")} />;
}

function same(live: unknown, base: unknown) {
  return JSON.stringify(live) === JSON.stringify(base);
}

function exportChanges() {
  const out: Record<string, unknown> = {};
  const board = loadBoard();
  const marks = { ...DEFAULT_BOARD_LAYOUT.marks };
  for (const key of Object.keys(marks) as Array<keyof typeof marks>) marks[key] = { ...marks[key], hidden: false };
  if (!same(board, { ...DEFAULT_BOARD_LAYOUT, marks })) out.board = board;
  if (!same(loadCard(), DEFAULT_CARD)) out.monster = loadCard();
  if (!same(loadSpell(), DEFAULT_SPELL)) out.spell = loadSpell();
  if (!same(loadField(), DEFAULT_FIELD)) out.field = loadField();
  const sound = { on: soundOn(), fx: fxVolume(), tap: tapVolume() };
  if (!same(sound, { on: true, fx: 100, tap: 100 })) out.sound = sound;
  const cards = JSON.parse(exportNumbers()) as { monsters: unknown[]; spells: unknown[]; attack?: string };
  if (cards.monsters.length || cards.spells.length || cards.attack) out.cards = cards;
  if (loadActivePack() !== "now") out.fxPack = loadActivePack();
  if (!same(loadFxPrefs("now"), defaultFxPrefs("now"))) out.fxNow = loadFxPrefs("now");
  if (!same(loadFxPrefs("m1"), defaultFxPrefs("m1"))) out.fxM1 = loadFxPrefs("m1");
  if (!same(loadLooks(), defaultLooks())) out.fxLooks = loadLooks();
  if (!ailmentHolds()) out.ailmentHold = false;
  return out;
}

function setupLine() {
  return JSON.stringify({
    board: loadBoard(),
    monster: loadCard(),
    spell: loadSpell(),
    field: loadField(),
    sound: { on: soundOn(), fx: fxVolume(), tap: tapVolume() },
  });
}

function Menu({ onPick }: { onPick: (screen: Screen) => void }) {
  const [line, setLine] = useState("");
  const [note, setNote] = useState("");
  const [dump, setDump] = useState("");
  const language = useLang();
  useEffect(() => {
    setLine(setupLine());
  }, []);
  return (
    <main className="tuner menu-page">
      <Link to="/" className="tuner-back">
        {tr("Về menu")}
      </Link>
      <h1>{tr("Tuỳ chỉnh")}</h1>
      <p className="tuner-note">{tr("Ngôn ngữ")}</p>
      <div className="pad2">
        <button type="button" className={`tuner-item${language === "vi" ? " on" : ""}`} onClick={() => setLang("vi")}>
          Tiếng Việt
        </button>
        <button type="button" className={`tuner-item${language === "en" ? " on" : ""}`} onClick={() => setLang("en")}>
          English
        </button>
      </div>
      <button type="button" className="tuner-save" onClick={() => onPick("board")}>
        {tr("Điều chỉnh bàn chơi")}
      </button>
      <button type="button" className="tuner-save alt" onClick={() => onPick("monster")}>
        {tr("Điều chỉnh lá quái trên tay")}
      </button>
      <button type="button" className="tuner-save alt" onClick={() => onPick("spell")}>
        {tr("Điều chỉnh lá phép trên tay")}
      </button>
      <button type="button" className="tuner-save alt" onClick={() => onPick("field")}>
        {tr("Điều chỉnh lá trên sân")}
      </button>
      <button type="button" className="tuner-save alt" onClick={() => onPick("text")}>
        {tr("Điều chỉnh nội dung lá bài")}
      </button>
      <button type="button" className="tuner-save" onClick={() => onPick("sound")}>
        {tr("Âm thanh")}
      </button>
      <button type="button" className="tuner-save alt" onClick={() => onPick("fx")}>
        {tr("Hiệu ứng")}
      </button>
      <button type="button" className="tuner-save alt" onClick={() => onPick("cardfx")}>
        {tr("Hiệu ứng lá bài")}
      </button>
      <a className="tuner-save alt" href="/clash-lite.zip" download>
        {tr("Tải gói nhẹ")}
      </a>
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          const text = setupLine();
          setLine(text);
          void navigator.clipboard?.writeText(text).then(
            () => setNote("Đã chép. Dán dòng này vào cuộc trò chuyện."),
            () => setNote("Chưa chép được. Giữ dòng bên dưới rồi sao chép."),
          );
        }}
      >
        {tr("Xuất tuỳ chỉnh")}
      </button>
      {note ? <p className="tuner-note">{note}</p> : null}
      <input className="tune-input" readOnly value={line} onFocus={(event) => event.currentTarget.select()} />
      <button
        type="button"
        className="tuner-save is-red"
        onClick={() => {
          if (!window.confirm("Xuất mọi thay đổi trong tuỳ chỉnh?")) return;
          const data = exportChanges();
          if (Object.keys(data).length === 0) {
            setDump("");
            setNote("Không có thay đổi để xuất.");
            return;
          }
          const text = JSON.stringify(data, null, 2);
          setDump(text);
          void navigator.clipboard?.writeText(text).then(
            () => setNote("Đã xuất và chép các thay đổi."),
            () => setNote("Đã xuất. Giữ phần chữ bên dưới rồi sao chép."),
          );
        }}
      >
        Xuất mọi thay đổi
      </button>
      {dump ? <textarea className="tune-input is-area" readOnly value={dump} onFocus={(event) => event.currentTarget.select()} /> : null}
    </main>
  );
}

function SoundTune({ onBack }: { onBack: () => void }) {
  const [on, setOn] = useState(true);
  const [fx, setFx] = useState(100);
  const [tap, setTap] = useState(100);
  useEffect(() => {
    setOn(soundOn());
    setFx(fxVolume());
    setTap(tapVolume());
  }, []);
  return (
    <main className="tuner">
      <button type="button" className="tuner-back" onClick={onBack}>
        Quay lại
      </button>
      <h1>Âm thanh</h1>
      <p className="tuner-note">Âm lượng trong game, không đổi âm lượng máy.</p>
      <button
        type="button"
        className={`tuner-save${on ? "" : " is-mute"}`}
        onClick={() => {
          const next = !on;
          setSound(next);
          setOn(next);
          if (next) playCue("draw");
        }}
      >
        {on ? "Tắt tiếng" : "Đang tắt tiếng"}
      </button>
      {on ? (
        <>
          <label className="tune-field-label">
            Hiệu ứng trận · {fx}
            <input
              className="vol-range"
              type="range"
              min={0}
              max={100}
              value={fx}
              onChange={(event) => {
                const next = Number(event.target.value);
                setFx(next);
                setFxVolume(next);
                setOn(true);
              }}
              onPointerUp={() => playCue("draw")}
            />
          </label>
          <label className="tune-field-label">
            Nút bấm · {tap}
            <input
              className="vol-range"
              type="range"
              min={0}
              max={100}
              value={tap}
              onChange={(event) => {
                const next = Number(event.target.value);
                setTap(next);
                setTapVolume(next);
                setOn(true);
              }}
              onPointerUp={() => playTap()}
            />
          </label>
        </>
      ) : null}
    </main>
  );
}

function Pad({
  onNudge,
  onFont,
  onWidth,
  onHeight,
  fontStep = 0.4,
  fontUp = "Chữ to hơn",
  fontDown = "Chữ nhỏ hơn",
}: {
  onNudge: (dx: number, dy: number) => void;
  onFont: (delta: number) => void;
  onWidth?: (delta: number) => void;
  onHeight?: (delta: number) => void;
  fontStep?: number;
  fontUp?: string;
  fontDown?: string;
}) {
  return (
    <>
      <div className="pad4">
        <button type="button" className="pad-btn" onClick={() => onNudge(-0.4, 0)}>
          Trái
        </button>
        <button type="button" className="pad-btn" onClick={() => onNudge(0.4, 0)}>
          Phải
        </button>
        <button type="button" className="pad-btn" onClick={() => onNudge(0, -0.4)}>
          Lên
        </button>
        <button type="button" className="pad-btn" onClick={() => onNudge(0, 0.4)}>
          Xuống
        </button>
      </div>
      <div className="pad2">
        <button type="button" className="pad-btn" onClick={() => onFont(fontStep)}>
          {fontUp}
        </button>
        <button type="button" className="pad-btn" onClick={() => onFont(-fontStep)}>
          {fontDown}
        </button>
        {onWidth ? (
          <>
            <button type="button" className="pad-btn" onClick={() => onWidth(2)}>
              Rộng hơn
            </button>
            <button type="button" className="pad-btn" onClick={() => onWidth(-2)}>
              Hẹp hơn
            </button>
          </>
        ) : null}
        {onHeight ? (
          <>
            <button type="button" className="pad-btn" onClick={() => onHeight(1)}>
              Cao hơn
            </button>
            <button type="button" className="pad-btn" onClick={() => onHeight(-1)}>
              Thấp hơn
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

function BoardTune({ onBack }: { onBack: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<BoardPick | null>(null);
  const [layout, setLayout] = useState<BoardLayout>(loadBoard);
  const [picked, setPicked] = useState<BoardPick>("notice");
  const [saved, setSaved] = useState(false);

  function at(event: ReactPointerEvent) {
    const node = stage.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 98),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 98),
    };
  }

  function place(key: BoardPick, x: number, y: number) {
    setSaved(false);
    setLayout((current) => {
      if (key === "notice") return { ...current, notice: { ...current.notice, x: clamp(x, 0, 80), y: clamp(y, 0, 90) } };
      if (key === "trail") return { ...current, trail: { ...current.trail, x: clamp(x, 0, 92), y: clamp(y, 0, 90) } };
      if (key === "reaction") return { ...current, reaction: { ...current.reaction, x: clamp(x, 0, 80), y: clamp(y, 0, 90) } };
      if (key === "stack" || key === "env" || key === "envFoe") {
        const spot = current[key];
        return { ...current, [key]: { ...spot, x: clamp(x, 2, 98), y: clamp(y, 2, 98) } };
      }
      const point = current.marks[key];
      return { ...current, marks: { ...current.marks, [key]: { ...point, x: clamp(x, 2, 98), y: clamp(y, 2, 98) } } };
    });
  }

  function nudge(dx: number, dy: number) {
    if (picked === "notice") place("notice", layout.notice.x + dx, layout.notice.y + dy);
    else if (picked === "trail") place("trail", layout.trail.x + dx, layout.trail.y + dy);
    else if (picked === "reaction") place("reaction", layout.reaction.x + dx, layout.reaction.y + dy);
    else if (picked === "stack" || picked === "env" || picked === "envFoe") place(picked, layout[picked].x + dx, layout[picked].y + dy);
    else place(picked, layout.marks[picked].x + dx, layout.marks[picked].y + dy);
  }

  function font(delta: number) {
    setSaved(false);
    setLayout((current) => {
      if (picked === "notice") return { ...current, notice: { ...current.notice, font: clamp(current.notice.font + delta, 1.6, 8) } };
      if (picked === "trail") return { ...current, trail: { ...current.trail, dot: clamp(current.trail.dot + delta, 0.8, 8) } };
      if (picked === "reaction") return { ...current, reaction: { ...current.reaction, font: clamp(current.reaction.font + delta, 1.6, 8) } };
      if (picked === "stack" || picked === "env" || picked === "envFoe") {
        const spot = current[picked];
        return { ...current, [picked]: { ...spot, size: clamp(spot.size + delta, 1.6, 8) } };
      }
      const point = current.marks[picked];
      return { ...current, marks: { ...current.marks, [picked]: { ...point, size: clamp(point.size + delta, 1.6, 12) } } };
    });
  }

  function width(delta: number) {
    setSaved(false);
    setLayout((current) => {
      if (picked === "notice") return { ...current, notice: { ...current.notice, w: clamp(current.notice.w + delta, 20, 90) } };
      if (picked === "trail") return { ...current, trail: { ...current.trail, w: clamp(current.trail.w + delta, 3, 30) } };
      if (picked === "reaction") return { ...current, reaction: { ...current.reaction, w: clamp(current.reaction.w + delta, 20, 90) } };
      if (picked === "stack" || picked === "env" || picked === "envFoe") {
        const spot = current[picked];
        return { ...current, [picked]: { ...spot, width: clamp(spot.width + delta, 6, 48) } };
      }
      return current;
    });
  }

  function height(delta: number) {
    setSaved(false);
    setLayout((current) => {
      if (picked === "notice") return { ...current, notice: { ...current.notice, h: clamp(current.notice.h + delta, 4, 24) } };
      if (picked === "trail") return { ...current, trail: { ...current.trail, h: clamp(current.trail.h + delta, 4, 40) } };
      if (picked === "reaction") return { ...current, reaction: { ...current.reaction, h: clamp(current.reaction.h + delta, 4, 24) } };
      if (picked === "stack" || picked === "env" || picked === "envFoe") {
        const spot = current[picked];
        return { ...current, [picked]: { ...spot, height: clamp(spot.height + delta, 4, 28) } };
      }
      return current;
    });
  }

  const label =
    picked === "notice" ? "Bảng thông báo" : picked === "trail" ? "Lịch sử thông báo" : picked === "reaction" ? "Thanh phản ứng" : picked === "stack" ? "Xấp bài úp" : picked === "env" ? "Môi trường mình" : picked === "envFoe" ? "Môi trường địch" : HUD_MARKS.find((mark) => mark.key === picked)?.label;
  const boxy = picked === "notice" || picked === "trail" || picked === "reaction" || picked === "stack" || picked === "env" || picked === "envFoe";
  const hidden =
    picked === "notice"
      ? layout.notice.hidden === true
      : picked === "trail"
        ? layout.trail.hidden === true
        : picked === "reaction"
        ? layout.reaction.hidden === true
        : picked === "stack" || picked === "env" || picked === "envFoe"
          ? layout[picked].hidden === true
          : layout.marks[picked].hidden === true;

  function toggleHidden() {
    setSaved(false);
    setLayout((current) => {
      if (picked === "notice") return { ...current, notice: { ...current.notice, hidden: !current.notice.hidden } };
      if (picked === "trail") return { ...current, trail: { ...current.trail, hidden: !current.trail.hidden } };
      if (picked === "reaction") return { ...current, reaction: { ...current.reaction, hidden: !current.reaction.hidden } };
      if (picked === "stack" || picked === "env" || picked === "envFoe") return { ...current, [picked]: { ...current[picked], hidden: !current[picked].hidden } };
      const point = current.marks[picked];
      return { ...current, marks: { ...current.marks, [picked]: { ...point, hidden: !point.hidden } } };
    });
  }

  function glow(delta: number) {
    setSaved(false);
    setLayout((current) => ({ ...current, trail: { ...current.trail, glow: clamp(current.trail.glow + delta, 0, 12) } }));
  }

  return (
    <main className="tuner">
      <button type="button" className="tuner-back" onClick={onBack}>
        Về tuỳ chỉnh
      </button>
      <h1>Chỉnh bàn đấu</h1>
      <p className="tuner-note">Chọn một số, rồi bấm mũi tên. Kéo cũng được. Lưu xong vào trận để xem.</p>
      <div ref={stage} className="tune-stage tune-board">
        <img src="/board.png" alt="" />
        <button
          type="button"
          className={`tune-notice${picked === "notice" ? " on" : ""}${layout.notice.hidden ? " is-hidden" : ""}`}
          style={{
            left: `${layout.notice.x}%`,
            top: `${layout.notice.y}%`,
            width: `${layout.notice.w}%`,
            height: `${layout.notice.h}%`,
            fontSize: `${layout.notice.font}cqw`,
          }}
          onPointerDown={(event) => {
            drag.current = "notice";
            setPicked("notice");
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (drag.current !== "notice") return;
            const spot = at(event);
            if (spot) place("notice", spot.x, spot.y);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          Thông báo
        </button>
        <button
          type="button"
          className={`tune-notice is-trail${picked === "trail" ? " on" : ""}${layout.trail.hidden ? " is-hidden" : ""}`}
          style={{
            left: `${layout.trail.x}%`,
            top: `${layout.trail.y}%`,
            width: `${layout.trail.w}%`,
            height: `${layout.trail.h}%`,
            ["--dot" as string]: layout.trail.dot / 1.6,
          } as CSSProperties}
          onPointerDown={(event) => {
            drag.current = "trail";
            setPicked("trail");
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (drag.current !== "trail") return;
            const spot = at(event);
            if (spot) place("trail", spot.x, spot.y);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          {(["#ff3b3b", "#3dcc4a", "#3aa0ff", "#ff9a1f", "#c6ff3d"] as const).map((ink) => (
            <span key={ink} className="trail-slot">
              <i
                className="trail-dot"
                style={{
                  color: ink,
                  boxShadow: `0 0 ${layout.trail.glow}px ${layout.trail.glow * 0.2}px ${ink}`,
                }}
              />
            </span>
          ))}
        </button>
        <button
          type="button"
          className={`tune-notice${picked === "reaction" ? " on" : ""}${layout.reaction.hidden ? " is-hidden" : ""}`}
          style={{
            left: `${layout.reaction.x}%`,
            top: `${layout.reaction.y}%`,
            width: `${layout.reaction.w}%`,
            height: `${layout.reaction.h}%`,
            fontSize: `${layout.reaction.font}cqw`,
          }}
          onPointerDown={(event) => {
            drag.current = "reaction";
            setPicked("reaction");
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (drag.current !== "reaction") return;
            const spot = at(event);
            if (spot) place("reaction", spot.x, spot.y);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          Phản ứng
        </button>
        <button
          type="button"
          className={`tune-pin${picked === "stack" ? " on" : ""}${layout.stack.hidden ? " is-hidden" : ""}`}
          style={{
            left: `${layout.stack.x}%`,
            top: `${layout.stack.y}%`,
            width: `${layout.stack.width}%`,
            height: `${layout.stack.height}%`,
            fontSize: `${layout.stack.size}cqw`,
          }}
          onPointerDown={(event) => {
            drag.current = "stack";
            setPicked("stack");
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (drag.current !== "stack") return;
            const spot = at(event);
            if (spot) place("stack", spot.x, spot.y);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          Xấp
        </button>
        <button
          type="button"
          className={`tune-pin is-env${picked === "env" ? " on" : ""}${layout.env.hidden ? " is-hidden" : ""}`}
          style={{
            left: `${layout.env.x}%`,
            top: `${layout.env.y}%`,
            width: `${layout.env.width}%`,
            height: `${layout.env.height}%`,
            fontSize: `${layout.env.size}cqw`,
          }}
          onPointerDown={(event) => {
            drag.current = "env";
            setPicked("env");
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (drag.current !== "env") return;
            const spot = at(event);
            if (spot) place("env", spot.x, spot.y);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          Môi trường mình
        </button>
        <button
          type="button"
          className={`tune-pin is-env${picked === "envFoe" ? " on" : ""}${layout.envFoe.hidden ? " is-hidden" : ""}`}
          style={{
            left: `${layout.envFoe.x}%`,
            top: `${layout.envFoe.y}%`,
            width: `${layout.envFoe.width}%`,
            height: `${layout.envFoe.height}%`,
            fontSize: `${layout.envFoe.size}cqw`,
          }}
          onPointerDown={(event) => {
            drag.current = "envFoe";
            setPicked("envFoe");
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (drag.current !== "envFoe") return;
            const spot = at(event);
            if (spot) place("envFoe", spot.x, spot.y);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          Môi trường địch
        </button>
        {HUD_MARKS.map((mark) => (
          <button
            key={mark.key}
            type="button"
            className={`tune-pin${picked === mark.key ? " on" : ""}${layout.marks[mark.key].hidden ? " is-hidden" : ""}`}
            style={{ left: `${layout.marks[mark.key].x}%`, top: `${layout.marks[mark.key].y}%`, fontSize: `${layout.marks[mark.key].size}cqw` }}
            onPointerDown={(event) => {
              drag.current = mark.key;
              setPicked(mark.key);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (drag.current !== mark.key) return;
              const spot = at(event);
              if (spot) place(mark.key, spot.x, spot.y);
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
          >
            {mark.sample}
          </button>
        ))}
      </div>
      <p className="tuner-note">Đang chọn: {label}</p>
      <Pad
        onNudge={nudge}
        onFont={font}
        onWidth={boxy ? width : undefined}
        onHeight={boxy ? height : undefined}
        fontUp={picked === "trail" ? "Chấm to hơn" : "Chữ to hơn"}
        fontDown={picked === "trail" ? "Chấm nhỏ hơn" : "Chữ nhỏ hơn"}
      />
      {picked === "trail" ? (
        <div className="pad2">
          <button type="button" className="pad-btn" onClick={() => glow(0.4)}>
            Glow dày hơn
          </button>
          <button type="button" className="pad-btn" onClick={() => glow(-0.4)}>
            Glow mỏng hơn
          </button>
        </div>
      ) : null}
      <button type="button" className="pad-btn" onClick={toggleHidden}>
        {hidden ? "Hiện mục này" : "Ẩn mục này"}
      </button>
      <div className="tuner-list">
        <button type="button" className={`tuner-item${picked === "notice" ? " on" : ""}`} onClick={() => setPicked("notice")}>
          Bảng thông báo{layout.notice.hidden ? " · ẩn" : ""} · rộng {layout.notice.w} · cao {layout.notice.h} · chữ {layout.notice.font}
        </button>
        <button type="button" className={`tuner-item${picked === "trail" ? " on" : ""}`} onClick={() => setPicked("trail")}>
          Lịch sử thông báo{layout.trail.hidden ? " · ẩn" : ""} · rộng {layout.trail.w} · cao {layout.trail.h} · chấm {layout.trail.dot} · glow {layout.trail.glow}
        </button>
        <button type="button" className={`tuner-item${picked === "reaction" ? " on" : ""}`} onClick={() => setPicked("reaction")}>
          Thanh phản ứng{layout.reaction.hidden ? " · ẩn" : ""} · rộng {layout.reaction.w} · cao {layout.reaction.h} · chữ {layout.reaction.font}
        </button>
        <button type="button" className={`tuner-item${picked === "stack" ? " on" : ""}`} onClick={() => setPicked("stack")}>
          Xấp bài úp{layout.stack.hidden ? " · ẩn" : ""} · rộng {layout.stack.width} · cao {layout.stack.height} · chữ {layout.stack.size}
        </button>
        <button type="button" className={`tuner-item${picked === "env" ? " on" : ""}`} onClick={() => setPicked("env")}>
          Môi trường mình{layout.env.hidden ? " · ẩn" : ""} · rộng {layout.env.width} · cao {layout.env.height} · chữ {layout.env.size}
        </button>
        <button type="button" className={`tuner-item${picked === "envFoe" ? " on" : ""}`} onClick={() => setPicked("envFoe")}>
          Môi trường địch{layout.envFoe.hidden ? " · ẩn" : ""} · rộng {layout.envFoe.width} · cao {layout.envFoe.height} · chữ {layout.envFoe.size}
        </button>
        {HUD_MARKS.map((mark) => (
          <button key={mark.key} type="button" className={`tuner-item${picked === mark.key ? " on" : ""}`} onClick={() => setPicked(mark.key)}>
            {mark.label}
            {layout.marks[mark.key].hidden ? " · ẩn" : ""} · chữ {layout.marks[mark.key].size}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          saveBoard(layout);
          setSaved(true);
        }}
      >
        Lưu
      </button>
      <button
        type="button"
        className="pad-btn"
        onClick={() => {
          setLayout(DEFAULT_BOARD_LAYOUT);
          saveBoard(DEFAULT_BOARD_LAYOUT);
          setSaved(true);
        }}
      >
        Trả về mặc định
      </button>
      {saved ? <p className="tuner-note">Đã lưu. Vào chơi để xem.</p> : null}
    </main>
  );
}

function SpotTune({ kind, onBack }: { kind: "monster" | "spell"; onBack: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<string | null>(null);
  const [layout, setLayout] = useState<Record<string, Spot>>(() => (kind === "monster" ? loadCard() : loadSpell()));
  const marks = kind === "monster" ? CARD_MARKS : SPELL_MARKS;
  const [picked, setPicked] = useState(marks[0].key);
  const [saved, setSaved] = useState(false);
  const spot = layout[picked];

  function at(event: ReactPointerEvent) {
    const node = stage.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 2, 98),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 2, 98),
    };
  }

  function patch(key: string, next: Partial<Spot>) {
    setSaved(false);
    setLayout((current) => ({ ...current, [key]: { ...current[key], ...next } }));
  }

  return (
    <main className="tuner">
      <button type="button" className="tuner-back" onClick={onBack}>
        Về tuỳ chỉnh
      </button>
      <h1>{kind === "monster" ? "Chỉnh lá quái trên tay" : "Chỉnh lá phép trên tay"}</h1>
      <p className="tuner-note">Mũi tên dịch số. Chữ, rộng và cao đổi ô đang chọn.</p>
      <div ref={stage} className="tune-stage tune-card">
        {kind === "monster" ? (
          <CardFace monster={monsterCard("tho-den-tinh-nghich")} hideStats showNew layout={layout as Record<CardKey, Spot>} />
        ) : (
          <CardFace spellId="mua-ma-thuat" hideStats showNew spellLayout={layout as Record<SpellKey, Spot>} />
        )}
        {marks.map((mark) => {
          const place = layout[mark.key];
          return (
            <button
              key={mark.key}
              type="button"
              className={`tune-pin${picked === mark.key ? " on" : ""}${mark.key === "fresh" ? " is-mark" : ""}`}
              style={{
                left: `${place.x}%`,
                top: `${place.y}%`,
                width: `${place.width}%`,
                height: `${place.height}%`,
                fontSize: `${place.size}cqw`,
              }}
              onPointerDown={(event) => {
                drag.current = mark.key;
                setPicked(mark.key);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (drag.current !== mark.key) return;
                const next = at(event);
                if (next) patch(mark.key, next);
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
            >
              {mark.key === "fresh" ? null : mark.sample}
            </button>
          );
        })}
      </div>
      <p className="tuner-note">Đang chọn: {marks.find((mark) => mark.key === picked)?.label}</p>
      <Pad
        fontStep={1}
        onNudge={(dx, dy) => patch(picked, { x: clamp(spot.x + dx, 2, 98), y: clamp(spot.y + dy, 2, 98) })}
        onFont={(delta) => patch(picked, { size: clamp(spot.size + delta, 3, 28) })}
        onWidth={(delta) => patch(picked, { width: clamp(spot.width + delta, 8, 96) })}
        onHeight={(delta) => patch(picked, { height: clamp(spot.height + delta, 4, 40) })}
      />
      <div className="tuner-list">
        {marks.map((mark) => (
          <button key={mark.key} type="button" className={`tuner-item${picked === mark.key ? " on" : ""}`} onClick={() => setPicked(mark.key)}>
            {mark.label} · chữ {layout[mark.key].size} · rộng {layout[mark.key].width} · cao {layout[mark.key].height}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          if (kind === "monster") saveCard(layout as Record<CardKey, Spot>);
          else saveSpell(layout as Record<SpellKey, Spot>);
          setSaved(true);
        }}
      >
        Lưu
      </button>
      <button
        type="button"
        className="pad-btn"
        onClick={() => {
          const next = kind === "monster" ? DEFAULT_CARD : DEFAULT_SPELL;
          setLayout(next);
          if (kind === "monster") saveCard(DEFAULT_CARD);
          else saveSpell(DEFAULT_SPELL);
          setSaved(true);
        }}
      >
        Trả về mặc định
      </button>
      {saved ? <p className="tuner-note">Đã lưu. Vào chơi để xem.</p> : null}
    </main>
  );
}

function FieldTune({ onBack }: { onBack: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<FieldKey | null>(null);
  const [layout, setLayout] = useState(loadField);
  const [picked, setPicked] = useState<FieldKey>("name");
  const [saved, setSaved] = useState(false);
  const spot = layout[picked];

  function at(event: ReactPointerEvent) {
    const node = stage.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 98),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 98),
    };
  }

  function patch(key: FieldKey, next: Partial<Spot>) {
    setSaved(false);
    setLayout((current) => ({ ...current, [key]: { ...current[key], ...next } }));
  }

  return (
    <main className="tuner">
      <button type="button" className="tuner-back" onClick={onBack}>
        Về tuỳ chỉnh
      </button>
      <h1>Chỉnh lá trên sân</h1>
      <p className="tuner-note">Số trên quái đang đứng sân. Mũi tên, cỡ chữ, rộng và cao.</p>
      <div ref={stage} className="tune-stage tune-field">
        <img className="art" src={artSrc("tho-den-tinh-nghich")} alt="" />
        <img className="frame" src="/field-frame.png" alt="" />
        {FIELD_MARKS.map((mark) => {
          const place = layout[mark.key];
          return (
            <button
              key={mark.key}
              type="button"
              className={`tune-pin${picked === mark.key ? " on" : ""}`}
              style={{
                left: `${place.x}%`,
                top: `${place.y}%`,
                width: `${place.width}%`,
                height: `${place.height}%`,
                fontSize: `${place.size}cqw`,
              }}
              onPointerDown={(event) => {
                drag.current = mark.key;
                setPicked(mark.key);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (drag.current !== mark.key) return;
                const next = at(event);
                if (next) patch(mark.key, next);
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
            >
              {mark.sample}
            </button>
          );
        })}
      </div>
      <p className="tuner-note">Đang chọn: {FIELD_MARKS.find((mark) => mark.key === picked)?.label}</p>
      <Pad
        fontStep={1}
        onNudge={(dx, dy) => patch(picked, { x: clamp(spot.x + dx, 0, 98), y: clamp(spot.y + dy, 0, 98) })}
        onFont={(delta) => patch(picked, { size: clamp(spot.size + delta, 6, 32) })}
        onWidth={(delta) => patch(picked, { width: clamp(spot.width + delta, 8, 96) })}
        onHeight={(delta) => patch(picked, { height: clamp(spot.height + delta, 6, 40) })}
      />
      <div className="tuner-list">
        {FIELD_MARKS.map((mark) => (
          <button key={mark.key} type="button" className={`tuner-item${picked === mark.key ? " on" : ""}`} onClick={() => setPicked(mark.key)}>
            {mark.label} · chữ {layout[mark.key].size} · rộng {layout[mark.key].width} · cao {layout[mark.key].height}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          saveField(layout);
          setSaved(true);
        }}
      >
        Lưu
      </button>
      <button
        type="button"
        className="pad-btn"
        onClick={() => {
          setLayout(DEFAULT_FIELD);
          saveField(DEFAULT_FIELD);
          setSaved(true);
        }}
      >
        Trả về mặc định
      </button>
      {saved ? <p className="tuner-note">Đã lưu. Vào chơi để xem.</p> : null}
    </main>
  );
}

function exportNumbers() {
  const keys = ["stars", "gems", "atk", "def", "mdef", "hp"] as const;
  const monsters = [...MONSTERS, ...FORMS].flatMap((base) => {
    const live = monsterCard(base.id);
    if (!live) return [];
    const diff: Record<string, number | string | Record<string, string>> = {};
    for (const key of keys) if (live[key] !== base[key]) diff[key] = live[key];
    if (live.name !== base.name) diff.name = live.name;
    if (live.skill !== base.skill) diff.skill = live.skill;
    if ((live.strong ?? "") !== (base.strong ?? "")) diff.strong = live.strong ?? "";
    if ((live.weak ?? "") !== (base.weak ?? "")) diff.weak = live.weak ?? "";
    if ((live.counter ?? "") !== (base.counter ?? "")) diff.counter = live.counter ?? "";
    if (live.picture && live.picture !== (base.picture || defaultMonsterPicture(base.art))) diff.picture = live.picture;
    const chips = chipDraft(base.id);
    const chipDiff: Record<string, string> = {};
    for (const chip of MONSTER_CHIPS[base.id] ?? []) {
      if ((chips[chip.key] ?? chip.label) !== chip.label) chipDiff[chip.key] = chips[chip.key];
    }
    if (Object.keys(chipDiff).length) diff.chips = chipDiff;
    const asks = askDraft(base.id);
    const askDiff: Record<string, string> = {};
    for (const ask of MONSTER_ASKS[base.id] ?? []) {
      if ((asks[ask.key] ?? ask.label) !== ask.label) askDiff[ask.key] = asks[ask.key];
    }
    if (Object.keys(askDiff).length) diff.asks = askDiff;
    return Object.keys(diff).length ? [{ id: base.id, ...diff }] : [];
  });
  const spells = SPELLS.flatMap((base) => {
    const live = spellCard(base.id);
    if (!live) return [];
    const diff: Record<string, number | string> = {};
    if (live.name !== base.name) diff.name = live.name;
    if (live.effect !== base.effect) diff.effect = live.effect;
    if (live.gems !== base.gems) diff.gems = live.gems;
    if (live.picture && live.picture !== (base.picture || defaultSpellPicture(base.id))) diff.picture = live.picture;
    return Object.keys(diff).length ? [{ id: base.id, ...diff }] : [];
  });
  const attack = attackLabel();
  const payload: { monsters: typeof monsters; spells: typeof spells; attack?: string } = { monsters, spells };
  if (attack && attack !== "Tấn công") payload.attack = attack;
  return JSON.stringify(payload, null, 2);
}

function CardTextTune({ onBack }: { onBack: () => void }) {
  const [pile, setPile] = useState<"monster" | "spell">("monster");
  const [id, setId] = useState<string | null>(null);
  const [attack, setAttack] = useState(attackLabel);
  const [note, setNote] = useState("");
  const [dump, setDump] = useState("");
  const outside = new Set(FORMS.map((card) => card.id));
  const starOf = (card: (typeof MONSTERS)[number]) => monsterCard(card.id)?.stars ?? card.stars;
  const gemOf = (card: (typeof SPELLS)[number]) => spellCard(card.id)?.gems ?? card.gems;
  const roster = [...MONSTERS, ...FORMS].sort(
    (a, b) => starOf(a) - starOf(b) || Number(outside.has(a.id)) - Number(outside.has(b.id)) || a.name.localeCompare(b.name, "vi"),
  );
  const spellRoster = [...SPELLS].sort((a, b) => gemOf(a) - gemOf(b) || a.name.localeCompare(b.name, "vi"));
  const baseMonster = roster.find((card) => card.id === id);
  const baseSpell = SPELLS.find((card) => card.id === id);
  const liveMonster = baseMonster ? monsterCard(baseMonster.id) : undefined;

  if (pile === "monster" && liveMonster && baseMonster) {
    return (
      <MonsterEdit
        key={baseMonster.id}
        base={baseMonster}
        live={liveMonster}
        onBack={() => setId(null)}
        onStep={(dir) => setId(neighbor(roster, baseMonster.id, dir))}
        onSaved={setNote}
      />
    );
  }
  if (pile === "spell" && baseSpell) {
    return (
      <SpellEdit
        key={baseSpell.id}
        base={baseSpell}
        onBack={() => setId(null)}
        onStep={(dir) => setId(neighbor(spellRoster, baseSpell.id, dir))}
        onSaved={setNote}
      />
    );
  }

  const list = pile === "monster" ? roster : spellRoster;
  let lastGroup = "";
  return (
    <main className="tuner">
      <button type="button" className="tuner-back" onClick={onBack}>
        Quay lại
      </button>
      <h1>Nội dung lá bài</h1>
      <p className="tuner-note">Sửa tên, chỉ số, chữ skill và ảnh. Dạng nở của sâu và tê giác ghi Ngoài bộ, hiện trong dựng bộ bài nhưng không cho vào bộ.</p>
      <label className="tune-field-label">
        Ô tấn công
        <input className="tune-input" value={attack} onChange={(event) => setAttack(event.target.value)} />
      </label>
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          saveAttack(attack);
          setNote("Đã lưu ô tấn công.");
        }}
      >
        Lưu ô tấn công
      </button>
      <div className="pad2">
        <button type="button" className={`tuner-item${pile === "monster" ? " on" : ""}`} onClick={() => { setPile("monster"); setId(null); }}>
          Quái thú
        </button>
        <button type="button" className={`tuner-item${pile === "spell" ? " on" : ""}`} onClick={() => { setPile("spell"); setId(null); }}>
          Phép
        </button>
      </div>
      <div className="tuner-list">
        {list.map((card) => {
          const stars = "stars" in card ? (monsterCard(card.id)?.stars ?? card.stars) : 0;
          const gems = "gems" in card ? (spellCard(card.id)?.gems ?? card.gems) : 0;
          const group = pile === "monster" ? `${stars} sao` : `${gems} gem`;
          const fresh = group !== lastGroup;
          lastGroup = group;
          const name = pile === "monster" ? (monsterCard(card.id)?.name ?? card.name) : (spellCard(card.id)?.name ?? card.name);
          return (
            <span key={card.id}>
              {fresh ? <p className="tuner-group">{group}</p> : null}
              <button type="button" className="tuner-item" onClick={() => setId(card.id)}>
                {pile === "monster" && outside.has(card.id) ? `Ngoài bộ · ${name}` : name}
              </button>
            </span>
          );
        })}
      </div>
      {note ? <p className="tuner-note">{note}</p> : null}
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          const text = exportNumbers();
          setDump(text);
          void navigator.clipboard?.writeText(text).then(
            () => setNote("Đã chép thay đổi, gồm số, ảnh, mô tả skill và tên ô."),
            () => setNote("Chưa chép được. Giữ phần chữ bên dưới rồi sao chép."),
          );
        }}
      >
        Xuất thay đổi
      </button>
      {dump ? <textarea className="tune-input is-area" readOnly value={dump} /> : null}
    </main>
  );
}

function MonsterEdit({
  base,
  live,
  onBack,
  onStep,
  onSaved,
}: {
  base: MonsterCard;
  live: MonsterCard;
  onBack: () => void;
  onStep: (dir: -1 | 1) => void;
  onSaved: (note: string) => void;
}) {
  const [draft, setDraft] = useState(live);
  const [chips, setChips] = useState(() => chipDraft(base.id));
  const [asks, setAsks] = useState(() => askDraft(base.id));
  const fields = MONSTER_CHIPS[base.id] ?? [];
  const questions = MONSTER_ASKS[base.id] ?? [];
  const setNum = (key: "stars" | "gems" | "atk" | "def" | "mdef" | "hp", value: string) => {
    const next = Number(value);
    setDraft({ ...draft, [key]: Number.isFinite(next) ? next : 0 });
  };
  return (
    <main className="tuner">
      <button type="button" className="tuner-back" onClick={onBack}>
        Danh sách
      </button>
      <h1>{base.name}</h1>
      <label className="tune-field-label">
        Tên
        <input className="tune-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <div className="tune-stats">
        {(
          [
            ["stars", "Sao"],
            ["gems", "Gem"],
            ["atk", "Công"],
            ["def", "Thủ"],
            ["mdef", "Thủ phép"],
            ["hp", "Máu"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="tune-field-label">
            {label}
            <input className="tune-input" inputMode="numeric" value={draft[key]} onChange={(event) => setNum(key, event.target.value)} />
          </label>
        ))}
      </div>
      <CopyEdit label="Nội dung skill" value={draft.skill} onChange={(skill) => setDraft({ ...draft, skill })} sized />
      <ArtPick
        chosen={draft.picture || defaultMonsterPicture(base.art)}
        onPick={(key) => setDraft({ ...draft, picture: key === defaultMonsterPicture(base.art) ? "" : key })}
        onStep={(dir) => {
          saveMonster({ ...draft, id: base.id, art: base.art, picture: draft.picture || "" }, chips, asks);
          onStep(dir);
        }}
      />
      {questions.map((ask) => (
        <label key={ask.key} className="tune-field-label">
          {ask.title}
          <textarea className="tune-input is-area" value={asks[ask.key] ?? ask.label} onChange={(event) => setAsks({ ...asks, [ask.key]: event.target.value })} />
        </label>
      ))}
      {fields.map((chip) => (
        <label key={chip.key} className="tune-field-label">
          {chip.tone === "z" ? "Ô đỏ" : "Ô xanh"} · {chip.label}
          <input
            className="tune-input"
            value={chips[chip.key] ?? chip.label}
            onChange={(event) => setChips({ ...chips, [chip.key]: event.target.value })}
          />
        </label>
      ))}
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          saveMonster({ ...draft, id: base.id, art: base.art, picture: draft.picture || "" }, chips, asks);
          onSaved(`Đã lưu ${draft.name}.`);
        }}
      >
        Lưu lá này
      </button>
      <button
        type="button"
        className="tuner-save alt"
        onClick={() => {
          resetMonster(base.id);
          setDraft(base);
          setChips(Object.fromEntries(fields.map((chip) => [chip.key, chip.label])));
          setAsks(Object.fromEntries(questions.map((ask) => [ask.key, ask.label])));
          onSaved(`Đã trả ${base.name} về gốc.`);
        }}
      >
        Trả về gốc
      </button>
    </main>
  );
}

function SpellEdit({
  base,
  onBack,
  onStep,
  onSaved,
}: {
  base: SpellCard;
  onBack: () => void;
  onStep: (dir: -1 | 1) => void;
  onSaved: (note: string) => void;
}) {
  const [draft, setDraft] = useState(() => spellCard(base.id) ?? base);
  return (
    <main className="tuner">
      <button type="button" className="tuner-back" onClick={onBack}>
        Danh sách
      </button>
      <h1>{base.name}</h1>
      <label className="tune-field-label">
        Tên
        <input className="tune-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <label className="tune-field-label">
        Gem
        <input
          className="tune-input"
          inputMode="numeric"
          value={draft.gems}
          onChange={(event) => setDraft({ ...draft, gems: Number(event.target.value) || 0 })}
        />
      </label>
      <ArtPick
        chosen={draft.picture || defaultSpellPicture(base.id)}
        onPick={(key) => setDraft({ ...draft, picture: key === defaultSpellPicture(base.id) ? "" : key })}
        onStep={(dir) => {
          saveSpellText({ ...draft, id: base.id, picture: draft.picture || "" });
          onStep(dir);
        }}
      />
      <CopyEdit label="Nội dung phép" value={draft.effect} onChange={(effect) => setDraft({ ...draft, effect })} />
      <button
        type="button"
        className="tuner-save"
        onClick={() => {
          saveSpellText({ ...draft, id: base.id, picture: draft.picture || "" });
          onSaved(`Đã lưu ${draft.name}.`);
        }}
      >
        Lưu lá này
      </button>
      <button
        type="button"
        className="tuner-save alt"
        onClick={() => {
          resetSpell(base.id);
          setDraft(base);
          onSaved(`Đã trả ${base.name} về gốc.`);
        }}
      >
        Trả về gốc
      </button>
    </main>
  );
}

function neighbor<T extends { id: string }>(list: T[], id: string, dir: -1 | 1) {
  const index = list.findIndex((card) => card.id === id);
  const next = list[(index + dir + list.length) % list.length];
  return next?.id ?? id;
}

function ArtPick({ chosen, onPick, onStep }: { chosen: string; onPick: (key: string) => void; onStep: (dir: -1 | 1) => void }) {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(0);
  const [ask, setAsk] = useState<ArtShot | null>(null);
  const hold = useRef(0);
  const held = useRef(false);
  const point = useRef({ x: 0, y: 0 });
  const shots = [...monsterArts(), ...spellArts()];
  const current = shots.find((shot) => shot.key === chosen) ?? shots[0];
  const groups = [monsterArts(), spellArts()];
  const press = (shot: ArtShot, event: ReactPointerEvent) => {
    point.current = { x: event.clientX, y: event.clientY };
    window.clearTimeout(hold.current);
    held.current = false;
    hold.current = window.setTimeout(() => {
      held.current = true;
      setAsk(shot);
    }, 480);
  };
  const release = () => window.clearTimeout(hold.current);
  const slide = (event: ReactPointerEvent) => {
    if (Math.hypot(event.clientX - point.current.x, event.clientY - point.current.y) > 12) release();
  };
  return (
    <div className="art-pick">
      <div className="art-row">
        <button type="button" className="art-toggle" onClick={() => setOpen((value) => !value)} aria-label="Ảnh">
          <img src={current?.src} alt="" />
        </button>
        <div className="art-nav">
          <button type="button" className="art-arrow" onClick={() => onStep(-1)} aria-label="Lá trước">
            ‹
          </button>
          <button type="button" className="art-arrow" onClick={() => onStep(1)} aria-label="Lá sau">
            ›
          </button>
        </div>
      </div>
      {open ? (
        <div className="art-pop" key={gone}>
          {groups.map((list, index) => (
            <div key={index} className="art-grid">
              {list.map((shot: ArtShot) => (
                <button
                  key={shot.key}
                  type="button"
                  className={`art-shot${chosen === shot.key ? " on" : ""}`}
                  onPointerDown={(event) => press(shot, event)}
                  onPointerMove={slide}
                  onPointerUp={release}
                  onPointerCancel={release}
                  onContextMenu={(event) => event.preventDefault()}
                  onClick={() => {
                    if (held.current) {
                      held.current = false;
                      return;
                    }
                    onPick(shot.key);
                    setOpen(false);
                  }}
                  aria-label={shot.label}
                >
                  <img src={shot.src} alt="" />
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {ask ? (
        <div className="art-ask">
          <p>Xoá hình {ask.label}?</p>
          <button
            type="button"
            onClick={() => {
              hideArt(ask.key);
              if (chosen === ask.key) {
                const rest = shots.find((shot) => shot.key !== ask.key);
                if (rest) onPick(rest.key);
              }
              setGone((n) => n + 1);
              setAsk(null);
            }}
          >
            Xoá
          </button>
          <button type="button" onClick={() => setAsk(null)}>
            Không
          </button>
        </div>
      ) : null}
    </div>
  );
}
