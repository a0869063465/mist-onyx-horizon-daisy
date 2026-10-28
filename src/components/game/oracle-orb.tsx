import { useId } from "react";

/*
 * Con mắt và nút huỷ cạnh nút OK (chủ game 28/10, theo con mắt trong video Runeterra): không phải icon trên nút đá mà là
 * một viên cầu trong khung vàng có hai mấu nhọn hai bên.
 * - Con mắt: chưa có hành động nào đang chờ thì là viên đồng khép kín, có đường nối ngang như mí mắt (`shut`); có hành
 *   động chờ thì mí mở ra, lộ con mắt xanh phát sáng (`open`); đang bấm xem trước thì mắt thành viên ngọc trắng sáng,
 *   lững lờ đảo quanh (`look`).
 * - Nút huỷ: cùng khung, viên màu đỏ có dấu X khắc chìm khi khép; mở ra thì dấu X đỏ phát sáng.
 */

export type OracleKind = "eye" | "cancel";
export type OracleState = "shut" | "open" | "look";

export function OracleOrb({ kind, state }: { kind: OracleKind; state: OracleState }) {
  const id = `or${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const eye = kind === "eye";
  const neon = eye ? "#58c2ff" : "#ff4a3d";
  const deep = eye ? ["#123a96", "#06123a"] : ["#7a0d0a", "#2a0303"];
  const lid = eye ? ["#ffe3a0", "#c88a2c", "#5a3306"] : ["#ff9c8c", "#b51f16", "#3e0503"];
  return (
    <svg className={`oracle is-${kind} is-${state}`} viewBox="-60 -50 120 100" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4c6" />
          <stop offset="0.45" stopColor="#e1a83c" />
          <stop offset="1" stopColor="#6e4208" />
        </linearGradient>
        <radialGradient id={`${id}-lid`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor={lid[0]} />
          <stop offset="0.5" stopColor={lid[1]} />
          <stop offset="1" stopColor={lid[2]} />
        </radialGradient>
        <radialGradient id={`${id}-deep`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor={deep[0]} />
          <stop offset="1" stopColor={deep[1]} />
        </radialGradient>
        <radialGradient id={`${id}-pearl`} cx="0.4" cy="0.36" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e2f2ff" />
          <stop offset="1" stopColor="#8fc4ff" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" result="soft" />
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${id}-well`}>
          <circle r="36" />
        </clipPath>
      </defs>
      {/* The gold frame, with a spike on each side as it sits on the line through the middle of the field. */}
      <path d="M-58 0L-44 -7L-44 7Z M58 0L44 -7L44 7Z" fill={`url(#${id}-gold)`} stroke="#3e2604" strokeWidth="1" />
      <circle r="45" fill={`url(#${id}-gold)`} stroke="#3e2604" strokeWidth="1.2" />
      <circle r="41" fill="#140d05" />
      {/* Inside: the glowing emblem, behind the lids. */}
      <g clipPath={`url(#${id}-well)`}>
        <circle r="38" fill={`url(#${id}-deep)`} />
        <g className="oracle-mark" filter={`url(#${id}-glow)`}>
          {eye ? (
            <>
              <path d="M-27 0Q0 -24 27 0Q0 24 -27 0Z" fill="none" stroke={neon} strokeWidth="4" strokeLinejoin="round" />
              <circle r="9.5" fill="none" stroke={neon} strokeWidth="3.6" />
              <circle r="3.6" fill={neon} />
            </>
          ) : (
            <path d="M-15 -15L15 15M15 -15L-15 15" stroke={neon} strokeWidth="6" strokeLinecap="round" />
          )}
          <circle r="34" fill="none" stroke={neon} strokeWidth="2.6" opacity="0.85" />
        </g>
        {eye ? (
          <g className="oracle-pearl">
            <circle r="27" fill={`url(#${id}-pearl)`} filter={`url(#${id}-glow)`} />
            <ellipse cx="-7" cy="-9" rx="10" ry="6" fill="#fff" opacity="0.75" />
          </g>
        ) : null}
        {/* The lids: the two halves of a closed metal ball that part when there is something waiting. */}
        <g className="oracle-lid is-top">
          <path d="M-38 0A38 38 0 0 1 38 0Z" fill={`url(#${id}-lid)`} />
          <path d="M-38 0H38" stroke="#000" strokeOpacity="0.55" strokeWidth="2.4" />
        </g>
        <g className="oracle-lid is-bottom">
          <path d="M-38 0A38 38 0 0 0 38 0Z" fill={`url(#${id}-lid)`} />
          <path d="M-38 1.2H38" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" />
        </g>
        {eye ? null : (
          <path className="oracle-carve" d="M-13 -13L13 13M13 -13L-13 13" stroke="#000" strokeOpacity="0.42" strokeWidth="5" strokeLinecap="round" />
        )}
        <ellipse className="oracle-gloss" cx="-9" cy="-17" rx="17" ry="8" fill="#fff" opacity="0.32" />
      </g>
      <circle r="41" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
    </svg>
  );
}
