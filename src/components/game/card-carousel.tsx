import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { CardFace } from "@/components/game/card-face";
import { monsterCard, spellCard } from "@/lib/catalog";
import { tr } from "@/lib/i18n";
import { markFace } from "@/lib/power-balance";
import { playUi } from "@/lib/sfx";

/** A move shorter than this is a tap, not a drag. */
const NUDGE = 12;

/**
 * The 3D fan of related cards (owner, 19/10, after the Legends of Runeterra card view he recorded): the card in
 * focus stands in front, the others lean away to both sides behind it. Drag sideways to turn the fan; tap a side card
 * to bring it to the front, tap the front card to read it; tap outside the fan to close it. Cards look like the ones
 * in the deck builder's pool (no name on the card; the name is under the fan).
 */
export function CardCarousel({ ids, focus, onOpen, onClose }: { ids: string[]; focus: string; onOpen: (id: string) => void; onClose: () => void }) {
  const start = Math.max(0, ids.indexOf(focus));
  const [pos, setPos] = useState(start);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(360);
  const stage = useRef<HTMLDivElement>(null);
  const grab = useRef<{ pointer: number; x0: number; pos0: number; moved: boolean; t0: number } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    const measure = () => setWidth(stage.current?.clientWidth || window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const step = Math.min(width * 0.36, 200);
  const last = ids.length - 1;
  const current = Math.round(Math.min(last, Math.max(0, pos)));

  function settle(next: number) {
    const target = Math.min(last, Math.max(0, next));
    if (target !== current) playUi("soft");
    setPos(target);
  }

  function down(event: ReactPointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // A drag on a phone sends no click afterwards, so the "just dragged" mark must not wait for one (owner, 19/10:
    // taps were sometimes lost after turning the fan).
    dragged.current = false;
    grab.current = { pointer: event.pointerId, x0: event.clientX, pos0: pos, moved: false, t0: performance.now() };
  }

  function move(event: ReactPointerEvent) {
    const held = grab.current;
    if (!held || held.pointer !== event.pointerId) return;
    const dx = event.clientX - held.x0;
    if (!held.moved && Math.abs(dx) < NUDGE) return;
    if (!held.moved) {
      held.moved = true;
      setDragging(true);
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    }
    // Past either end the fan only gives a little.
    const raw = held.pos0 - dx / step;
    setPos(raw < 0 ? raw * 0.3 : raw > last ? last + (raw - last) * 0.3 : raw);
  }

  function up(event: ReactPointerEvent) {
    const held = grab.current;
    if (!held || held.pointer !== event.pointerId) return;
    grab.current = null;
    if (!held.moved) return;
    // The click that follows a drag is not a tap.
    dragged.current = true;
    setDragging(false);
    const dx = event.clientX - held.x0;
    const fast = Math.abs(dx) / Math.max(1, performance.now() - held.t0) > 0.6;
    const rough = held.pos0 - dx / step;
    settle(fast && Math.round(rough) === Math.round(held.pos0) ? Math.round(held.pos0) - Math.sign(dx) : Math.round(rough));
  }

  // Taps act on the click (after the finger is up), so nothing under the fan gets the same tap once it closes.
  function tap(event: ReactMouseEvent) {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    // On the front card it opens it, on a side card it brings it to the front, outside it closes the fan.
    const hit = (event.target as Element).closest?.("[data-at]");
    if (!hit) {
      onClose();
      return;
    }
    const at = Number(hit.getAttribute("data-at"));
    if (at === current) {
      playUi("select");
      onOpen(ids[at]);
    } else settle(at);
  }

  function cancel() {
    grab.current = null;
    setDragging(false);
    settle(Math.round(pos));
  }

  const shown = ids[current];
  const name = monsterCard(shown)?.name ?? spellCard(shown)?.name ?? "";

  return (
    <div
      className={`cc-back${dragging ? " is-dragging" : ""}`}
      role="dialog"
      aria-label={tr("Lá liên quan")}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onClick={tap}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="cc-stage" ref={stage}>
        {ids.map((id, at) => {
          const d = at - pos;
          const far = Math.abs(d);
          const side = Math.sign(d);
          const reach = Math.min(far, 1) * step + Math.max(0, far - 1) * step * 0.42;
          const style = {
            "--x": `${side * reach}px`,
            "--z": `${-far * 150}px`,
            "--ry": `${-Math.max(-1.4, Math.min(1.4, d)) * 34}deg`,
            "--rz": `${Math.max(-2, Math.min(2, d)) * 3}deg`,
            "--y": `${Math.min(far, 3) * 2.2}%`,
            "--s": `${1 - Math.min(far, 3) * 0.07}`,
            zIndex: 100 - Math.round(far * 10),
            opacity: far > 3.4 ? 0 : 1,
          } as CSSProperties;
          const monster = monsterCard(id);
          return (
            <div key={id} className={`cc-card${at === current ? " is-front" : ""}`} data-at={at} style={style}>
              {monster ? <CardFace monster={monster} hideName mark={markFace(id)} /> : <CardFace spellId={id} hideName mark={markFace(id)} />}
            </div>
          );
        })}
      </div>
      <div className="cc-foot">
        <b className="cc-name">{tr(name)}</b>
        <span className="cc-dots" aria-hidden="true">
          {ids.map((id, at) => (
            <i key={id} className={at === current ? "on" : undefined} />
          ))}
        </span>
      </div>
    </div>
  );
}
