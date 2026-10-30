import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type DrawFlight = { id: number; side: "you" | "foe"; /** Lá thứ mấy tính từ cuối tay (0 = cuối). */ slot: number; delay: number };

const FLIGHT_MS = 460;

function Flight({ flight, onDone }: { flight: DrawFlight; onDone: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mine = flight.side === "you";
    const pile = document.querySelector(mine ? ".face-pile" : ".foe-pile");
    // Lá bay ra từ mặt xấp (lá trên cùng); xấp hết bài thì từ chỗ để xấp.
    const from = (pile?.querySelector(".deck-pile img:last-child") ?? pile)?.getBoundingClientRect();
    const cards = mine ? document.querySelectorAll<HTMLElement>(".hand .hand-card") : null;
    const target = cards && cards.length ? cards[Math.max(0, cards.length - 1 - flight.slot)] : null;
    const fan = mine ? null : document.querySelector(".foe-fan");
    const to = mine ? (target ?? document.querySelector(".hand"))?.getBoundingClientRect() : (fan?.querySelector("img:last-child") ?? fan)?.getBoundingClientRect();
    if (!from || !to || from.width === 0) {
      onDone(flight.id);
      return;
    }
    const ph = from.height;
    const pw = ph * 0.7;
    const fx = from.left + from.width / 2;
    const fy = from.top + from.height / 2;
    const tx = to.left + to.width / 2;
    const ty = to.top + (mine ? to.height / 2 : to.height / 2);
    const scale = Math.max(0.2, (to.height || ph) / ph);
    el.style.width = `${pw}px`;
    el.style.height = `${ph}px`;
    el.style.left = `${fx - pw / 2}px`;
    el.style.top = `${fy - ph / 2}px`;
    // Lá thật ở tay hiện sau khi lá bay tới nơi.
    const hidden = target ? target.style.visibility : "";
    if (target) target.style.visibility = "hidden";
    const dx = tx - fx;
    const dy = ty - fy;
    const lift = Math.min(60, Math.abs(dy) * 0.18);
    const anim = el.animate(
      [
        { transform: "translate(0px, 0px) rotate(-5deg) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - lift}px) rotate(4deg) scale(${1 + (scale - 1) * 0.55})`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`, opacity: 1 },
      ],
      { duration: FLIGHT_MS, delay: flight.delay * 1000, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)", fill: "both" },
    );
    const finish = () => {
      if (target) target.style.visibility = hidden;
      onDone(flight.id);
    };
    anim.onfinish = finish;
    anim.oncancel = finish;
    return () => {
      anim.onfinish = null;
      anim.oncancel = null;
      anim.cancel();
      if (target) target.style.visibility = hidden;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} className={`draw-flight is-${flight.side}`} />;
}

/** Lá úp bay từ xấp lên tay (mình) hoặc vào khay bài của đối thủ (chủ game 30/10): chỉ hiển thị, luật rút bài không đổi. */
export function DrawFlights({ flights, onDone }: { flights: DrawFlight[]; onDone: (id: number) => void }) {
  if (typeof document === "undefined" || flights.length === 0) return null;
  return createPortal(
    <>
      {flights.map((flight) => (
        <Flight key={flight.id} flight={flight} onDone={onDone} />
      ))}
    </>,
    document.body,
  );
}
