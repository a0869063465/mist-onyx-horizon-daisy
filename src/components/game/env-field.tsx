import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { BoardId } from "@/lib/board-cut";

/**
 * Sân động (chủ game 21/11): mỗi nửa sân Rừng rậm / Bóng tối là video chạy trên ảnh bàn. Mỗi nửa chọn ngẫu nhiên giữa
 * 3 lựa chọn: ảnh tĩnh 30 giây, video 1, video 2; không lựa chọn nào lặp lại hai lần liên tiếp. Giảm chuyển động = chỉ ảnh tĩnh.
 * Video cắt theo bàn A (720 px rộng); bàn B = bàn A thêm dải phía trên nên chỉ dời xuống (đo 21/11: nửa trên +105, nửa dưới +103).
 */
const KEYS: Record<string, string> = { "rung-ram": "rung", "bong-toi": "bongtoi" };
export const ENV_FIELD_FILES = Object.values(KEYS)
  .flatMap((k) => ["", "-b"].flatMap((b) => [`${k}-top${b}.webp`, `${k}-bot${b}.webp`, ...[1, 2].flatMap((n) => [`${k}-${n}-top${b}.mp4`, `${k}-${n}-bot${b}.mp4`])]))
  .map((f) => `/env-fx/${f}`);

/** Bàn B (chủ game 21/11): khung sao/mana nhỏ hơn và nằm chỗ khác bàn A, nên video bản B đã xoá khung cũ; khung của B (cắt từ board-b.jpg) đặt đè lên. Số đo theo ảnh bàn B rộng 720 px, cao 1472,8 px. */
const PILL: Record<"top" | "bot", { x: number; y: number; w: number; h: number }> = {
  top: { x: 522.14, y: 464.68, w: 131.36, h: 36.12 },
  bot: { x: 529.53, y: 1019.66, w: 132.18, h: 34.48 },
};
const B_H = 1472.8;

type Kind = "still" | 1 | 2;
const KINDS: Kind[] = ["still", 1, 2];
const STILL_MS = 30000;
const FADE_MS = 600;

/** Hộp từng nửa trên từng bàn (phần trăm bàn; bàn rộng 720 px: A cao 1276, B cao 1472). */
const BOX: Record<BoardId, Record<"top" | "bot", { top: number; h: number }>> = {
  a: { top: { top: 0, h: (504 / 1276) * 100 }, bot: { top: (726 / 1276) * 100, h: (452 / 1276) * 100 } },
  b: { top: { top: (105 / 1472) * 100, h: (504 / 1472) * 100 }, bot: { top: ((728 + 103) / 1472) * 100, h: (452 / 1472) * 100 } },
};

function reduced() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function hasEnvField(env: string | null | undefined): boolean {
  return Boolean(env && KEYS[env]);
}

export function EnvField({ env, half, board }: { env: string; half: "top" | "bot"; board: BoardId }) {
  const key = KEYS[env];
  const [kind, setKind] = useState<Kind>(() => KINDS[Math.floor(Math.random() * KINDS.length)]);
  const [shown, setShown] = useState(false);
  const [seq, setSeq] = useState(0);
  const still = reduced();
  const kindRef = useRef(kind);
  kindRef.current = kind;

  function next() {
    const options = KINDS.filter((k) => k !== kindRef.current);
    setKind(options[Math.floor(Math.random() * options.length)]);
    setSeq((n) => n + 1);
  }

  useEffect(() => {
    if (still) return;
    if (kind === "still") {
      setShown(false);
      const t = window.setTimeout(next, STILL_MS);
      return () => window.clearTimeout(t);
    }
    setShown(false);
    const t = window.setTimeout(() => setShown(true), 30);
    return () => window.clearTimeout(t);
  }, [kind, still]);

  if (!key) return null;
  const box = BOX[board][half];
  const style: CSSProperties = { top: `${box.top}%`, height: `${box.h}%` };
  const b = board === "b";
  const fade = b && half === "bot" ? " is-fade" : "";
  const sfx = b ? "-b" : "";
  const pill = PILL[half];
  return (
    <>
    <div className={`env-field is-${half}${fade}`} style={style} aria-hidden>
      <img src={`/env-fx/${key}-${half}${sfx}.webp`} alt="" />
      {!still && kind !== "still" && (
        <video
          key={`${key}-${kind}-${half}-${seq}`}
          className={shown ? "is-on" : ""}
          src={`/env-fx/${key}-${kind}-${half}${sfx}.mp4`}
          muted
          playsInline
          autoPlay
          preload="auto"
          onEnded={() => {
            setShown(false);
            window.setTimeout(next, FADE_MS);
          }}
        />
      )}
    </div>
    {b && (
      <img
        className="env-pill"
        alt=""
        aria-hidden
        src={`/env-fx/pill-${half}.webp`}
        style={{ left: `${(pill.x / 720) * 100}%`, top: `${(pill.y / B_H) * 100}%`, width: `${(pill.w / 720) * 100}%`, height: `${(pill.h / B_H) * 100}%` }}
      />
    )}
    </>
  );
}
