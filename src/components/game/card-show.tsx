import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Where a shown card goes when it leaves: a place on screen (a hand card, a slot of the field), or nowhere (it fades). */
export type ShowLeave = { to: () => DOMRect | null | undefined; land?: boolean };

const IN_MS = 420;
const OUT_MS = 360;
const LAND_MS = 460;

/**
 * Một lá hiện to giữa sân (chủ game 13/11, theo video): bay ra từ `from` (xấp bài: lật từ lưng sang mặt, có loé sáng; lá
 * trên tay: nhấc thẳng ra), đứng đó, rồi khi có `leave` thì bay tới đích (về tay, hoặc đáp xuống ô sân có vệt sáng) và báo
 * `onLeft`. Chỉ là hình: việc thật (rút, triệu hồi) do nơi gọi làm.
 */
export function CardShow({
  from,
  flip = false,
  leave,
  onLeft,
  top,
  children,
  under,
}: {
  from: () => DOMRect | null | undefined;
  /** Comes out face down and turns over on the way (a card drawn from the deck), with a burst of light. */
  flip?: boolean;
  leave: ShowLeave | null;
  onLeft: () => void;
  /** Centre of the card, in % of the board's height. */
  top: number;
  children: ReactNode;
  /** Under the card: the choices (the row arrows, the summon buttons). */
  under?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const left = useRef(onLeft);
  left.current = onLeft;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The card keeps the shape of a card in the hand, whatever the screen.
    const hand = document.querySelector(".hand .hand-card")?.getBoundingClientRect();
    if (hand && hand.width > 0) el.style.aspectRatio = `${hand.width} / ${hand.height}`;
    const own = el.getBoundingClientRect();
    const start = from();
    if (!start || start.width === 0 || own.width === 0) return;
    const dx = start.left + start.width / 2 - (own.left + own.width / 2);
    const dy = start.top + start.height / 2 - (own.top + own.height / 2);
    const s0 = start.width / own.width;
    const base = "translate(-50%, -50%)";
    const fly = el.animate(
      flip
        ? [
            { transform: `${base} perspective(900px) translate(${dx}px, ${dy}px) scale(${s0}) rotateY(180deg)`, easing: "cubic-bezier(0.3, 0.6, 0.4, 1)" },
            { transform: `${base} perspective(900px) translate(${dx * 0.35}px, ${dy * 0.35}px) scale(${s0 + (1 - s0) * 0.7}) rotateY(90deg)`, offset: 0.5, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
            { transform: `${base} perspective(900px) translate(0px, 0px) scale(1.07) rotateY(0deg)`, offset: 0.86 },
            { transform: `${base} perspective(900px) translate(0px, 0px) scale(1) rotateY(0deg)` },
          ]
        : [
            { transform: `${base} translate(${dx}px, ${dy}px) scale(${s0})`, easing: "cubic-bezier(0.2, 0.75, 0.3, 1)" },
            { transform: `${base} translate(0px, 0px) scale(1.05)`, offset: 0.8 },
            { transform: `${base} translate(0px, 0px) scale(1)` },
          ],
      { duration: flip ? IN_MS + 140 : IN_MS, fill: "backwards" },
    );
    const back = el.querySelector<HTMLElement>(".card-show-back");
    const face = el.querySelector<HTMLElement>(".card-show-face");
    const turn = flip ? back?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.499 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: IN_MS + 140, fill: "both" }) : null;
    const show = flip ? face?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.499 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }], { duration: IN_MS + 140, fill: "backwards" }) : null;
    return () => {
      fly.cancel();
      turn?.cancel();
      show?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaving = Boolean(leave);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !leave) return;
    const own = el.getBoundingClientRect();
    const to = leave.to();
    const base = "translate(-50%, -50%)";
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      left.current();
    };
    if (!to || to.width === 0 || own.width === 0) {
      const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
      fade.onfinish = finish;
      fade.oncancel = finish;
      return () => {
        fade.onfinish = null;
        fade.oncancel = null;
      };
    }
    const dx = to.left + to.width / 2 - (own.left + own.width / 2);
    const dy = to.top + to.height / 2 - (own.top + own.height / 2);
    const sx = to.width / own.width;
    const sy = to.height / own.height;
    const fly = leave.land
      ? el.animate(
          [
            { transform: `${base} perspective(900px) translate(0px, 0px) scale(1) rotateX(0deg)`, filter: "brightness(1) drop-shadow(0 0 0 rgba(140, 220, 255, 0))", easing: "cubic-bezier(0.5, 0, 0.7, 0.4)" },
            { transform: `${base} perspective(900px) translate(${dx * 0.18}px, ${dy * 0.18 - 14}px) scale(1.08) rotateX(18deg)`, filter: "brightness(1.5) drop-shadow(0 0 18px rgba(140, 220, 255, 0.95))", offset: 0.3, easing: "cubic-bezier(0.5, 0, 0.8, 0.5)" },
            { transform: `${base} perspective(900px) translate(${dx}px, ${dy}px) scale(${sx * 1.08}, ${sy * 1.08}) rotateX(46deg)`, filter: "brightness(1.9) drop-shadow(0 0 22px rgba(190, 240, 255, 1))", offset: 0.86 },
            { transform: `${base} perspective(900px) translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotateX(0deg)`, filter: "brightness(2.6) drop-shadow(0 0 26px #ffffff)" },
          ],
          { duration: LAND_MS, fill: "forwards" },
        )
      : el.animate(
          [
            { transform: `${base} translate(0px, 0px) scale(1)`, easing: "cubic-bezier(0.45, 0, 0.6, 1)" },
            { transform: `${base} translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          ],
          { duration: OUT_MS, fill: "forwards" },
        );
    fly.onfinish = finish;
    fly.oncancel = finish;
    return () => {
      fly.onfinish = null;
      fly.oncancel = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <>
      {flip && !leaving ? <i className="card-show-burst" style={{ top: `${top}%` }} aria-hidden="true" /> : null}
      <div ref={ref} className={`card-show${leave?.land ? " is-landing" : ""}`} style={{ top: `${top}%` }}>
        <div className="card-show-face">{children}</div>
        {flip ? <img className="card-show-back" src="/ui/card-back-you.webp" alt="" draggable={false} /> : null}
      </div>
      {under && !leaving ? under : null}
    </>
  );
}
