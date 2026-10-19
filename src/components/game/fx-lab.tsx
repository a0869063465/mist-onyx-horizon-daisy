import { useEffect, useState, type CSSProperties } from "react";
import { BoltBurst, FireBurst, ShieldBurst, Spectacle, WaterBurst } from "@/components/game/spectacle";
import { emitFx } from "@/lib/spectacle";
import { ArenaFx } from "@/components/game/arena-fx";
import { fxStyle, setFxStyle, type FxStyle } from "@/lib/fx-kinds";
import { playCue } from "@/lib/sfx";
import { loadAlertLook, saveAlert } from "@/lib/layouts";
import {
  FX_ACTIONS,
  FX_PART_LABEL,
  FX_SPOT_LABEL,
  PACK_PARTS,
  actPack,
  ailmentHolds,
  defaultFxPrefs,
  exportFxText,
  fireBlastOn,
  loadFxPrefs,
  loadLooks,
  previewOf,
  saveFireBlast,
  saveFxPrefs,
  saveLooks,
  saveAilmentHold,
  saveTide,
  tideOn,
  type ActLook,
  type FxAct,
  type FxPack,
  type FxPart,
  type FxPrefs,
  type FxSpot,
} from "@/lib/fx-prefs";

function undoKey(pack: FxPack) {
  return pack === "m1" ? "clash-fx-undo-m1" : "clash-fx-undo";
}

function readUndo(pack: FxPack): FxPrefs | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(undoKey(pack));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxPrefs;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const NEW_KINDS = [
  { card: "kiem-si-lua-thieng", label: "Lửa · chém" },
  { card: "trai-tim-hai-long", label: "Nước · phép" },
  { card: "phu-thuy-ti-hon", label: "Sấm · phép" },
  { card: "ky-si-bong-toi", label: "Bóng tối · chém" },
  { card: "hiep-si-cua-vua", label: "Thánh · chém" },
  { card: "ong-khong-lo", label: "Rừng · đâm" },
  { card: "linh-chien-da-khong-lo", label: "Đá · đập" },
  { card: "ma-dao-si", label: "Ma thuật · phép" },
  { card: "thuong-quan-long", label: "Máy · bắn" },
  { card: "ke-san-moi-tu-than", label: "Máu · vuốt" },
  { card: "chien-si-gam-nham", label: "Thú · vuốt" },
] as const;

const NEW_ACTS = [
  { id: "summon", label: "Triệu hồi" },
  { id: "attack", label: "Đánh" },
  { id: "hurt", label: "Trúng đòn" },
  { id: "kill", label: "Hạ quái" },
  { id: "heal", label: "Hồi máu" },
  { id: "spell", label: "Phép giữa bàn" },
  { id: "ailment", label: "Bất lợi" },
] as const;

const YOU = { x: 32, y: 65.6 };
const FOE = { x: 53, y: 29.6 };

function previewNew(act: (typeof NEW_ACTS)[number]["id"], card: string) {
  const base = { color: "#ffffff", spot: "target" as const };
  if (act === "summon") emitFx({ t: "ring", act: "summon", ...base, spot: "self", x: YOU.x, y: YOU.y, power: 1.15, card });
  else if (act === "attack") emitFx({ t: "beam", act: "attack", x1: YOU.x, y1: YOU.y, x2: FOE.x, y2: FOE.y, color: "#fff", card });
  else if (act === "hurt") emitFx({ t: "burst", act: "hurt", ...base, x: FOE.x, y: FOE.y, power: 0.95, card });
  else if (act === "kill") emitFx({ t: "burst", act: "kill", ...base, x: FOE.x, y: FOE.y, power: 1.4, card });
  else if (act === "heal") emitFx({ t: "ring", act: "heal", ...base, spot: "self", x: YOU.x, y: YOU.y, power: 1.05 });
  else if (act === "spell") emitFx({ t: "ring", act: "spell", ...base, spot: "center", x: 42, y: 44, power: 1.4, card });
  else {
    emitFx({ t: "ailments", act: "ailment", marks: [{ id: "demo", x: FOE.x, y: FOE.y, spot: "target" }] });
    window.setTimeout(() => emitFx({ t: "ailments", act: "ailment", marks: [] }), 3500);
  }
}

export function FxLab({ onBack }: { onBack: () => void }) {
  const [looks, setLooks] = useState(() => loadLooks());
  const [act, setAct] = useState<FxAct>("summon");
  const [pack, setPack] = useState<FxPack>(() => actPack("summon"));
  const [prefs, setPrefs] = useState<FxPrefs>(() => loadFxPrefs(actPack("summon")));
  const [open, setOpen] = useState<FxAct | "special" | null>(null);
  const [hold, setHold] = useState(() => ailmentHolds());
  const [fire, setFire] = useState(() => fireBlastOn());
  const [gun, setGun] = useState(false);
  const [bolt, setBolt] = useState(false);
  const [boltBig, setBoltBig] = useState(false);
  const [tide, setTide] = useState(() => ({ small: tideOn("small"), mid: tideOn("mid"), big: tideOn("big") }));
  const [shield, setShield] = useState<null | "phys" | "spell">(null);
  const [note, setNote] = useState("");
  const [undoPacks, setUndoPacks] = useState<FxPack[]>(() => (["now", "m1"] as const).filter((item) => readUndo(item)));
  const [alertSize, setAlertSize] = useState(() => loadAlertLook().glow);
  const [alertBorder, setAlertBorder] = useState(() => loadAlertLook().border);
  const look = looks[act];
  const [style, setStyle] = useState<FxStyle>("new");
  const [demo, setDemo] = useState("kiem-si-lua-thieng");
  useEffect(() => setStyle(fxStyle()), []);

  function play(next: FxAct, row: ActLook = looks[next]) {
    const shown = (["now", "m1"] as const).filter((id) => !row.hide[id]);
    window.setTimeout(() => {
      for (const id of shown) for (const event of previewOf(next)) emitFx({ ...event, pack: id });
    }, 30);
  }

  function writeLook(nextAct: FxAct, row: ActLook) {
    const next = { ...looks, [nextAct]: row };
    setLooks(next);
    saveLooks(next);
    return next;
  }

  function pick(next: FxAct) {
    const row = looks[next];
    setAct(next);
    setPack(row.edit);
    setPrefs(loadFxPrefs(row.edit));
    if (open === next) setOpen(null);
    else {
      setOpen(next);
      play(next, row);
    }
  }

  function choose(next: FxPack) {
    const row = { ...look, edit: next };
    writeLook(act, row);
    setPack(next);
    setPrefs(loadFxPrefs(next));
    play(act, row);
  }

  function flipHide(which: FxPack) {
    const row = { ...look, hide: { ...look.hide, [which]: !look.hide[which] } };
    writeLook(act, row);
    play(act, row);
  }

  function toggle(spot: FxSpot, part: FxPart) {
    const list = prefs[act][spot] ?? [];
    const next = {
      ...prefs,
      [act]: { ...prefs[act], [spot]: list.includes(part) ? list.filter((item) => item !== part) : [...list, part] },
    };
    setPrefs(next);
    saveFxPrefs(next, pack);
    play(act);
  }

  function reset() {
    if (undoPacks.includes(pack)) {
      const back = readUndo(pack);
      if (back) {
        setPrefs(back);
        saveFxPrefs(back, pack);
        localStorage.removeItem(undoKey(pack));
        setUndoPacks((list) => list.filter((item) => item !== pack));
        setNote("Đã trả lại bộ trước khi bật lại.");
        if (open) play(act);
        return;
      }
    }
    localStorage.setItem(undoKey(pack), JSON.stringify(prefs));
    setUndoPacks((list) => (list.includes(pack) ? list : [...list, pack]));
    const next = defaultFxPrefs(pack);
    setPrefs(next);
    saveFxPrefs(next, pack);
    setNote("Đã bật lại đủ hiệu ứng của bộ đang chỉnh. Bấm Trả lại nếu bấm nhầm.");
    if (open) play(act);
  }

  function keep() {
    localStorage.setItem(pack === "m1" ? "clash-fx-keep-m1" : "clash-fx-keep", JSON.stringify(prefs));
    setNote("Đã lưu bộ đang chỉnh.");
  }

  async function copyOut() {
    const text = exportFxText(pack);
    try {
      await navigator.clipboard.writeText(text);
      setNote("Đã chép bộ đang chỉnh. Dán vào cuộc trò chuyện.");
    } catch {
      setNote(text);
    }
  }

  return (
    <main className="tuner fx-lab">
      <button type="button" className="tuner-back" onClick={onBack}>
        Về tuỳ chỉnh
      </button>
      <h1>Hiệu ứng</h1>
      <section className="fx-alert">
        <h2>Kiểu hiệu ứng trong trận</h2>
        <p className="tuner-note">Mới: hiệu ứng theo hệ của từng lá. Cũ: hiệu ứng trước đây, chỉnh ở các mục bên dưới.</p>
        <div className="pad2">
          <button type="button" className={`tuner-item${style === "new" ? " on" : ""}`} onClick={() => { setFxStyle("new"); setStyle("new"); }}>
            Mới
          </button>
          <button type="button" className={`tuner-item${style === "old" ? " on" : ""}`} onClick={() => { setFxStyle("old"); setStyle("old"); }}>
            Cũ
          </button>
        </div>
        {style === "new" ? (
          <>
            <div className="fx-stage" aria-hidden>
              <img className="fx-board" src="/board.png" alt="" />
              <img className="fx-card is-you" src="/art/kiem-si.jpg" alt="" />
              <img className="fx-card is-foe" src="/art/ac-ma.jpg" alt="" />
              <ArenaFx />
            </div>
            <p className="tuner-note">Hệ</p>
            <div className="fx-kinds">
              {NEW_KINDS.map((row) => (
                <button key={row.card} type="button" className={`tuner-item${demo === row.card ? " on" : ""}`} onClick={() => setDemo(row.card)}>
                  {row.label}
                </button>
              ))}
            </div>
            <p className="tuner-note">Xem thử</p>
            <div className="fx-kinds">
              {NEW_ACTS.map((row) => (
                <button key={row.id} type="button" className="pad-btn" onClick={() => previewNew(row.id, demo)}>
                  {row.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </section>
      <section className="fx-alert">
        <h2>Chớp cam</h2>
        <p className="tuner-note">Chỉnh riêng quầng sáng và độ dày viền.</p>
        <div className="alert-preview" style={{ "--alert-size": `${alertSize}px`, "--alert-border": `${alertBorder}px` } as CSSProperties}>
          <div className="is-alert" />
        </div>
        <p className="tuner-note">Quầng {alertSize}</p>
        <div className="pad2">
          <button type="button" className="pad-btn" onClick={() => setAlertSize((current) => Math.min(96, current + 4))}>
            Quầng to hơn
          </button>
          <button type="button" className="pad-btn" onClick={() => setAlertSize((current) => Math.max(4, current - 4))}>
            Quầng nhỏ hơn
          </button>
        </div>
        <p className="tuner-note">Viền {alertBorder}</p>
        <div className="pad2">
          <button type="button" className="pad-btn" onClick={() => setAlertBorder((current) => Math.min(20, current + 1))}>
            Viền dày hơn
          </button>
          <button type="button" className="pad-btn" onClick={() => setAlertBorder((current) => Math.max(1, current - 1))}>
            Viền mỏng hơn
          </button>
        </div>
        <button
          type="button"
          className="tuner-save"
          onClick={() => {
            saveAlert(alertSize, alertBorder);
            setNote("Đã lưu quầng và viền chớp cam.");
          }}
        >
          Lưu chớp cam
        </button>
      </section>
      <div className="fx-dock">
        <div className="fx-side">
          <button type="button" className={`fx-pack${pack === "now" ? " on" : ""}`} aria-label="Chỉnh hiệu ứng hiện tại" onClick={() => choose("now")}>
            1
          </button>
          <button
            type="button"
            className={`fx-pack is-hide${look.hide.now ? " off" : ""}`}
            aria-label={look.hide.now ? "Hiện hiệu ứng hiện tại trên bàn xem" : "Ẩn hiệu ứng hiện tại trên bàn xem"}
            onClick={() => flipHide("now")}
          >
            1
          </button>
          <button type="button" className={`fx-pack${pack === "m1" ? " on" : ""}`} aria-label="Chỉnh hiệu ứng mốc 1" onClick={() => choose("m1")}>
            2
          </button>
          <button
            type="button"
            className={`fx-pack is-hide${look.hide.m1 ? " off" : ""}`}
            aria-label={look.hide.m1 ? "Hiện mốc 1 trên bàn xem" : "Ẩn mốc 1 trên bàn xem"}
            onClick={() => flipHide("m1")}
          >
            2
          </button>
        </div>
        <div className="fx-stage" aria-hidden>
          <img className="fx-board" src="/board.png" alt="" />
          <img className="fx-card is-you" src="/art/kiem-si.jpg" alt="" />
          <img className="fx-card is-foe" src="/art/ac-ma.jpg" alt="" />
          <Spectacle />
          <FireBurst />
          <BoltBurst />
          <WaterBurst />
          <ShieldBurst />
        </div>
        <button type="button" className="fx-replay" aria-label="Xem lại" onClick={() => play(act)}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
        </button>
      </div>
      <p className="tuner-note">
        Bốn icon là của hành động đang chọn. Số 1 và số 2 nhớ riêng từng hành động. Gạch chéo chỉ ẩn trên bàn xem. Trong trận, hành động đó dùng đúng số đang bật.
      </p>
      <div className="fx-actions">
        {FX_ACTIONS.map((item) => (
          <div key={item.id} className="fx-action">
            <button type="button" className={`tuner-item${open === item.id ? " on" : ""}`} onClick={() => pick(item.id)}>
              {item.title}
            </button>
            {open === item.id ? (
              <div className="fx-parts">
                {item.id === "ailment" ? (
                  <label className="fx-part">
                    <input
                      type="checkbox"
                      checked={hold}
                      onChange={() => {
                        const next = !hold;
                        setHold(next);
                        saveAilmentHold(next);
                        play(item.id);
                      }}
                    />
                    <span>Giữ trên quái khi còn dính</span>
                  </label>
                ) : null}
                {item.spots.map((spot) => {
                  const parts = spot.parts.filter((part) => PACK_PARTS[pack].includes(part));
                  if (parts.length === 0) return null;
                  return (
                    <section key={spot.id} className="fx-spot">
                      <h2>{FX_SPOT_LABEL[spot.id]}</h2>
                      {parts.map((part) => {
                        const on = (prefs[item.id][spot.id] ?? []).includes(part);
                        return (
                          <label key={part} className={`fx-part${on ? " on" : ""}`}>
                            <input type="checkbox" checked={on} onChange={() => toggle(spot.id, part)} />
                            <i className={`fx-ico ${part}`} />
                            <span>{FX_PART_LABEL[part]}</span>
                          </label>
                        );
                      })}
                    </section>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
        <div className="fx-action">
          <button type="button" className={`tuner-item${open === "special" ? " on" : ""}`} onClick={() => setOpen(open === "special" ? null : "special")}>
            10. Skill đặc biệt
          </button>
          {open === "special" ? (
            <div className="fx-parts">
              <label className="fx-part">
                <input
                  type="checkbox"
                  checked={fire}
                  onChange={() => {
                    const next = !fire;
                    setFire(next);
                    saveFireBlast(next);
                    if (next) emitFx({ t: "fire", x: 53, y: 30 });
                  }}
                />
                <span>Lửa</span>
              </label>
              <label className="fx-part">
                <input
                  type="checkbox"
                  checked={gun}
                  onChange={() => {
                    const next = !gun;
                    setGun(next);
                    if (!next) return;
                    playCue("gunPrep");
                    window.setTimeout(() => {
                      playCue("gunBoom");
                      emitFx({ t: "fire", x: 53, y: 30 });
                      setGun(false);
                    }, 740);
                  }}
                />
                <span>Súng</span>
              </label>
              <label className="fx-part">
                <input
                  type="checkbox"
                  checked={bolt}
                  onChange={() => {
                    const next = !bolt;
                    setBolt(next);
                    if (!next) return;
                    playCue("boltPrep");
                    window.setTimeout(() => {
                      playCue("boltSmall");
                      emitFx({ t: "bolt", rank: "small", x: 53, y: 30 });
                      setBolt(false);
                    }, 240);
                  }}
                />
                <span>Sét nhỏ</span>
              </label>
              <label className="fx-part">
                <input
                  type="checkbox"
                  checked={boltBig}
                  onChange={() => {
                    const next = !boltBig;
                    setBoltBig(next);
                    if (!next) return;
                    playCue("boltPrep");
                    window.setTimeout(() => {
                      playCue("boltBoom");
                      emitFx({ t: "bolt", rank: "big", x: 53, y: 30 });
                      setBoltBig(false);
                    }, 240);
                  }}
                />
                <span>Sét</span>
              </label>
              {([
                ["small", "Con nước nhỏ"],
                ["mid", "Con nước trung bình"],
                ["big", "Con nước lớn"],
              ] as const).map(([rank, label]) => (
                <label key={rank} className="fx-part">
                  <input
                    type="checkbox"
                    checked={tide[rank]}
                    onChange={() => {
                      const next = !tide[rank];
                      setTide((now) => ({ ...now, [rank]: next }));
                      saveTide(rank, next);
                      if (next) emitFx({ t: "tide", rank, x: 53, y: 30 });
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
              {(
                [
                  ["phys", "Khiên vật lý"],
                  ["spell", "Khiên phép"],
                ] as const
              ).map(([kind, label]) => (
                <label key={kind} className="fx-part">
                  <input
                    type="checkbox"
                    checked={shield === kind}
                    onChange={() => {
                      setShield(kind);
                      playCue("shield");
                      emitFx({ t: "shield", kind, x: 53, y: 30 });
                      window.setTimeout(() => setShield((now) => (now === kind ? null : now)), 1200);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <button type="button" className="tuner-save alt" onClick={reset}>
        {undoPacks.includes(pack) ? "Trả lại bộ vừa chỉnh" : "Bật lại đủ bộ đang chỉnh"}
      </button>
      <button type="button" className="tuner-save" onClick={keep}>
        Lưu bộ đang chỉnh
      </button>
      <button type="button" className="tuner-save" onClick={() => void copyOut()}>
        Xuất cài đặt hiệu ứng đang chỉnh
      </button>
      {note ? <p className="tuner-note">{note}</p> : null}
    </main>
  );
}
