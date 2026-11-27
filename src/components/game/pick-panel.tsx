import { useEffect, useRef, useState, type ReactNode } from "react";
import { Medal } from "@/components/game/medal";
import { playIntro } from "@/lib/sfx";
import { tr } from "@/lib/i18n";

/** Một lá trong bảng chọn: khoá trả về khi chọn, hình lá. */
export type PickCard = { key: string; face: ReactNode };

/** Giây để chọn (như bảng Bài khởi đầu); hết giờ thì `onTimeout`. */
const LIMIT = 20;

/**
 * Bảng chọn 1 lá chung (chủ game 26/11): Giảo hoạt của Harpie Lady, Hồi sinh quái thú. Dựng theo khuôn bảng Bài khởi đầu
 * và Sinh mệnh mới (nền tối, chữ vàng, nút OK có vòng đếm 20 giây), nhưng các lá xếp hàng ngang vuốt được, lá chọn
 * glow xanh lá (không xoay vòng). `mine` = false thì là bảng của đối thủ: chỉ thấy lá úp, không bấm được.
 */
export function PickPanel({
  cards,
  mine = true,
  title,
  sub,
  onConfirm,
  onTimeout,
  onCancel,
  need = 1,
  onPicks,
}: {
  cards: PickCard[];
  mine?: boolean;
  title: string;
  sub?: string;
  onConfirm: (key: string) => void;
  /** Hết 20 giây mà chưa OK: nơi gọi tự quyết (Giảo hoạt lấy ngẫu nhiên, Hồi sinh thì lá về tay). */
  onTimeout: () => void;
  /** Có thì có nút Huỷ (Hồi sinh được huỷ; Giảo hoạt không). */
  onCancel?: () => void;
  /** Số lá phải chọn (bỏ lá dư khi tay quá 7 lá, chủ game 27/11); từ 2 trở lên thì OK gọi `onPicks`. */
  need?: number;
  onPicks?: (keys: string[]) => void;
}) {
  const [chosen, setChosen] = useState<string[]>([]);
  const picked = chosen.length >= need ? chosen[chosen.length - 1] ?? null : null;
  const [left, setLeft] = useState(LIMIT);
  const done = useRef(false);
  const pickedRef = useRef(chosen);
  pickedRef.current = chosen;
  const picksRef = useRef(onPicks);
  picksRef.current = onPicks;
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  useEffect(() => {
    if (!mine) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const rest = Math.max(0, LIMIT - Math.floor((Date.now() - started) / 1000));
      setLeft(rest);
      if (rest === 0 && !done.current) {
        done.current = true;
        window.clearInterval(timer);
        timeoutRef.current();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [mine]);

  const choose = (key: string) => {
    if (!mine || done.current) return;
    const now = pickedRef.current;
    const on = now.includes(key);
    if (!on && need > 1 && now.length >= need) return;
    playIntro(on ? "unmark" : "mark");
    setChosen(on ? now.filter((one) => one !== key) : need > 1 ? [...now, key] : [key]);
  };
  const ok = () => {
    const now = pickedRef.current;
    if (!mine || done.current || now.length < need) return;
    done.current = true;
    if (need > 1 && picksRef.current) picksRef.current(now);
    else confirmRef.current(now[0]!);
  };

  return (
    <div className={`op is-pick pk${mine ? "" : " is-foe"}`} role="dialog" aria-label={tr(title)}>
      <div className="op-dim" />
      <div className="op-head">
        <h2 className="op-title">{tr(title)}</h2>
        <p className="op-sub">{tr(mine ? sub ?? "" : "Đối thủ đang chọn…")}</p>
      </div>
      <div className="pk-row">
        {cards.map((card) => {
          const marked = mine && chosen.includes(card.key);
          return (
            <div key={card.key} className={`pk-slot${marked ? " is-marked" : ""}`}>
              <button type="button" className="pk-card" disabled={!mine} onClick={() => choose(card.key)}>
                {mine ? <span className="pk-face">{card.face}</span> : <img className="pk-back" src="/ui/card-back-foe.webp" alt="" draggable={false} />}
              </button>
            </div>
          );
        })}
      </div>
      {mine ? (
        <div className="op-foot rb-foot">
          {onCancel ? (
            <button type="button" className="rb-cancel press" onClick={onCancel}>
              {tr("Huỷ")}
            </button>
          ) : null}
          <button type="button" className="op-ok press" aria-label="OK" disabled={!picked} onClick={ok}>
            <Medal tone="blue" icon="check-mark" />
            <svg className="op-clock" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="18.6" pathLength={100} style={{ strokeDashoffset: 100 - (left / LIMIT) * 100 }} />
            </svg>
          </button>
          <span className="op-left">{left}</span>
        </div>
      ) : null}
    </div>
  );
}
