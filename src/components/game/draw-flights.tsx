import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * A card drawn from a deck. For the viewer, `target` names the card's place in the hand ("r:3" a reserve monster,
 * "s:1" a spell), so the card that flies is that very card; the opponent's flies face down into their tray.
 * `deal` marks the opening hand, where every card is new and no older card needs to make room.
 */
export type DrawFlight = { id: number; side: "you" | "foe"; target?: string; delay: number; deal?: boolean };

const FLIGHT_MS = 620;
/** The point of the flight where the card is edge on and turns from its back to its face. */
const TURN = 0.48;
const PERSPECTIVE = "perspective(700px)";

/** Scroll the hand strip so the card is fully in view, at once, before anything is measured. */
function bringIntoView(card: HTMLElement) {
  const strip = card.closest<HTMLElement>(".hand");
  if (!strip) return;
  const box = strip.getBoundingClientRect();
  const at = card.getBoundingClientRect();
  if (at.right > box.right) strip.scrollLeft += at.right - box.right;
  else if (at.left < box.left) strip.scrollLeft -= box.left - at.left;
}

function MyFlight({ flight, onDone }: { flight: DrawFlight; onDone: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const pick = document.querySelector<HTMLElement>(`.hand [data-hand="${flight.target}"]`);
    const face = pick?.querySelector<HTMLElement>(".hand-card");
    const top = document.querySelector(".face-pile .deck-pile img:last-child") ?? document.querySelector(".face-pile");
    if (!el || !pick || !face || !top) {
      onDone(flight.id);
      return;
    }
    // The real card waits hidden in its place; the one in flight is a copy of it, with the back over its face.
    pick.style.visibility = "hidden";
    bringIntoView(pick);
    const to = face.getBoundingClientRect();
    const from = top.getBoundingClientRect();
    const copy = face.cloneNode(true) as HTMLElement;
    copy.removeAttribute("data-reserve");
    copy.classList.remove("press", "is-open", "is-alert");
    copy.classList.add("draw-copy");
    el.prepend(copy);
    el.style.left = `${to.left}px`;
    el.style.top = `${to.top}px`;
    el.style.width = `${to.width}px`;
    el.style.height = `${to.height}px`;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const s0 = from.width / to.width;
    const lift = Math.min(70, Math.hypot(dx, dy) * 0.22);
    const at = (t: number) => ({ x: dx * (1 - t), y: dy * (1 - t) });
    const early = at(0.36);
    const mid = at(0.58);
    const timing = { duration: FLIGHT_MS, delay: flight.delay * 1000, fill: "both" as const };
    const fly = el.animate(
      [
        { transform: `${PERSPECTIVE} translate(${dx}px, ${dy}px) scale(${s0}) rotateX(16deg) rotateZ(-5deg) rotateY(0deg)`, offset: 0, easing: "cubic-bezier(0.3, 0.55, 0.6, 1)" },
        { transform: `${PERSPECTIVE} translate(${early.x}px, ${early.y - lift * 0.75}px) scale(${s0 + (1 - s0) * 0.35 + 0.06}) rotateX(13deg) rotateZ(-1deg) rotateY(18deg)`, offset: 0.26, easing: "ease-in" },
        { transform: `${PERSPECTIVE} translate(${mid.x}px, ${mid.y - lift}px) scale(${(s0 + 1) / 2 + 0.1}) rotateX(9deg) rotateZ(3deg) rotateY(90deg)`, offset: TURN, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" },
        { transform: `${PERSPECTIVE} translate(0px, -5px) scale(1.04) rotateX(0deg) rotateZ(0deg) rotateY(0deg)`, offset: 0.86, easing: "ease-in" },
        { transform: `${PERSPECTIVE} translate(0px, 0px) scale(1) rotateX(0deg) rotateZ(0deg) rotateY(0deg)`, offset: 1 },
      ],
      timing,
    );
    // The shadow on the board lengthens and softens as the card rises, and tightens as it lands.
    const shade = el.animate(
      [
        { filter: "drop-shadow(0 3px 3px rgba(0, 0, 0, 0.55))" },
        { filter: "drop-shadow(0 24px 16px rgba(0, 0, 0, 0.38))", offset: TURN },
        { filter: "drop-shadow(0 6px 6px rgba(0, 0, 0, 0.5))", offset: 0.86 },
        { filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55))" },
      ],
      timing,
    );
    const back = el.querySelector<HTMLElement>(".draw-back");
    const turn = back?.animate([{ opacity: 1 }, { opacity: 1, offset: TURN - 0.001 }, { opacity: 0, offset: TURN }, { opacity: 0 }], timing);
    // The face (with its name tag above the card) only shows once the card has turned over.
    const show = copy.animate([{ opacity: 0 }, { opacity: 0, offset: TURN - 0.001 }, { opacity: 1, offset: TURN }, { opacity: 1 }], timing);
    // The cards after the new one slide aside to make room for it (not in the opening deal, where all are new).
    const gap = parseFloat(getComputedStyle(pick.parentElement ?? pick).columnGap) || 0;
    const room = flight.deal ? [] : (Array.from(pick.parentElement?.children ?? []) as HTMLElement[]).slice(Array.from(pick.parentElement?.children ?? []).indexOf(pick) + 1);
    const slides = room.map((card) =>
      card.animate([{ transform: `translateX(${-(to.width + gap)}px)` }, { transform: "translateX(0)" }], { duration: 220, delay: flight.delay * 1000 + 60, easing: "cubic-bezier(0.25, 0.8, 0.3, 1)", fill: "backwards" }),
    );
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      pick.style.visibility = "";
      onDone(flight.id);
    };
    fly.onfinish = land;
    fly.oncancel = land;
    return () => {
      fly.onfinish = null;
      fly.oncancel = null;
      fly.cancel();
      shade.cancel();
      turn?.cancel();
      show.cancel();
      slides.forEach((slide) => slide.cancel());
      copy.remove();
      pick.style.visibility = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} className="draw-flight is-you">
      <img className="draw-back" src="/ui/card-back-you.webp" alt="" draggable={false} />
    </div>
  );
}

function FoeFlight({ flight, onDone }: { flight: DrawFlight; onDone: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const top = document.querySelector(".foe-pile .deck-pile img:last-child") ?? document.querySelector(".foe-pile");
    const fan = document.querySelector(".foe-fan");
    const slot = fan?.querySelector<HTMLElement>("img:last-child");
    const to = (slot ?? fan)?.getBoundingClientRect();
    const from = top?.getBoundingClientRect();
    if (!el || !from || !to || from.width === 0) {
      onDone(flight.id);
      return;
    }
    if (slot) slot.style.visibility = "hidden";
    el.style.left = `${to.left}px`;
    el.style.top = `${to.top}px`;
    el.style.width = `${to.width}px`;
    el.style.height = `${to.height}px`;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const s0 = from.width / (to.width || from.width);
    const lift = Math.min(50, Math.hypot(dx, dy) * 0.2);
    const timing = { duration: FLIGHT_MS * 0.85, delay: flight.delay * 1000, fill: "both" as const };
    const fly = el.animate(
      [
        { transform: `${PERSPECTIVE} translate(${dx}px, ${dy}px) scale(${s0}) rotateX(-14deg) rotateZ(4deg)`, easing: "cubic-bezier(0.35, 0.1, 0.4, 1)" },
        { transform: `${PERSPECTIVE} translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(${(s0 + 1) / 2 + 0.08}) rotateX(-8deg) rotateZ(-6deg)`, offset: 0.5, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" },
        { transform: `${PERSPECTIVE} translate(0px, 0px) scale(1) rotateX(0deg) rotateZ(0deg)` },
      ],
      timing,
    );
    const shade = el.animate(
      [
        { filter: "drop-shadow(0 3px 3px rgba(0, 0, 0, 0.55))" },
        { filter: "drop-shadow(0 18px 12px rgba(0, 0, 0, 0.38))", offset: 0.5 },
        { filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55))" },
      ],
      timing,
    );
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      if (slot) slot.style.visibility = "";
      onDone(flight.id);
    };
    fly.onfinish = land;
    fly.oncancel = land;
    return () => {
      fly.onfinish = null;
      fly.oncancel = null;
      fly.cancel();
      shade.cancel();
      if (slot) slot.style.visibility = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} className="draw-flight is-foe">
      <img className="draw-back" src="/ui/card-back-foe.webp" alt="" draggable={false} />
    </div>
  );
}

/**
 * Cards drawn from a deck (chủ game 30/10): the viewer's card flies from the top of their deck to its own place in the
 * hand, turning over the edge from its back to its face, so the card that lands is the card they play; the opponent's
 * flies face down into their tray. Only a show: the draw itself already happened.
 */
export function DrawFlights({ flights, onDone }: { flights: DrawFlight[]; onDone: (id: number) => void }) {
  if (typeof document === "undefined" || flights.length === 0) return null;
  return createPortal(
    <>
      {flights.map((flight) =>
        flight.side === "you" && flight.target ? <MyFlight key={flight.id} flight={flight} onDone={onDone} /> : <FoeFlight key={flight.id} flight={flight} onDone={onDone} />,
      )}
    </>,
    document.body,
  );
}
