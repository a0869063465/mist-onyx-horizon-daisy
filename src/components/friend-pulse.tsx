import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { answerInvite, INVITE_MS, pulse, type InviteRow } from "@/lib/friends";
import { currentMode, PLAYER_NAME, playerId, setFriendMatch, setPulse } from "@/lib/friend-state";
import { coverOf, loadBook } from "@/lib/deck-book";
import { artSrc } from "@/lib/catalog";
import { tr, useLang } from "@/lib/i18n";
import { playUi } from "@/lib/sfx";

const EVERY = 5000;

/**
 * Bạn bè (chủ game 31/10): mỗi vài giây máy báo trạng thái (trong trận ghi chế độ, ngoài trận Đang chờ) và nhận
 * lời mời vào trận. Lời mời hiện ở mọi màn ngoài trận: Nhận / Từ chối, hết hạn sau 60 giây.
 */
export function FriendPulse() {
  useLang();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [note, setNote] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef(new Map<string, number>());
  const gone = useRef(new Set<string>());
  const busy = useRef(false);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (stop || busy.current || document.visibilityState !== "visible") return;
      const id = playerId();
      if (!id) return;
      busy.current = true;
      try {
        const book = loadBook();
        const entry = book.decks.find((row) => row.n === book.active) ?? book.decks[0] ?? null;
        const where = currentMode();
        const got = await pulse({ data: { id, cover: entry ? coverOf(entry) : null, ...where } });
        if (stop || !got.ok) return;
        const at = Date.now();
        for (const row of got.invites) if (!seen.current.has(row.id)) seen.current.set(row.id, at);
        const open = got.invites.filter((row) => !gone.current.has(row.id));
        setInvites(open);
        setPulse({ asks: got.asks, invites: open, watched: got.watched });
        const reply = got.replies[0];
        if (reply) setNote(reply.state === "no" ? "Bạn bè đã từ chối lời mời." : "Lời mời vào trận đã hết hạn.");
      } catch {
        // Mất mạng: thử lại lần sau.
      } finally {
        busy.current = false;
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), EVERY);
    const wake = () => void tick();
    document.addEventListener("visibilitychange", wake);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [path]);

  useEffect(() => {
    if (!invites.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [invites.length]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 3600);
    return () => window.clearTimeout(timer);
  }, [note]);

  const inMatch = path === "/play";
  const live = invites.filter((row) => now - (seen.current.get(row.id) ?? now) < INVITE_MS);
  const top = inMatch ? null : live[0] ?? null;

  async function answer(row: InviteRow, yes: boolean) {
    gone.current.add(row.id);
    setInvites((list) => list.filter((item) => item.id !== row.id));
    playUi(yes ? "confirm" : "soft");
    try {
      const got = await answerInvite({ data: { id: playerId(), invite: row.id, yes } });
      if (!yes) return;
      if (!got.ok) {
        setNote(got.error);
        return;
      }
      setFriendMatch({ kind: "join", from: row.from, code: got.code });
      await navigate({ to: "/modes" });
    } catch {
      if (yes) setNote("Không vào được phòng.");
    }
  }

  const left = top ? Math.max(0, Math.ceil((INVITE_MS - (now - (seen.current.get(top.id) ?? now))) / 1000)) : 0;
  const art = top?.cover ? artSrc(top.cover, 1) : null;
  return (
    <>
      {top ? (
        <div className="fr-invite" role="dialog" aria-label={tr("Mời vào trận")}>
          <span className="fr-invite-face" style={art ? { backgroundImage: `url(${art})` } : undefined} />
          <div className="fr-invite-text">
            <b>
              {tr(PLAYER_NAME)} <i>{top.from}</i>
            </b>
            <span>{tr("mời bạn vào trận")}</span>
          </div>
          <span className="fr-invite-left">{left}</span>
          <div className="fr-invite-acts">
            <button type="button" className="fr-btn is-yes" onClick={() => void answer(top, true)}>
              {tr("Nhận")}
            </button>
            <button type="button" className="fr-btn" onClick={() => void answer(top, false)}>
              {tr("Từ chối")}
            </button>
          </div>
          <i className="fr-invite-bar" style={{ transform: `scaleX(${left / (INVITE_MS / 1000)})` }} />
        </div>
      ) : null}
      {note ? <p className="fr-toast">{tr(note)}</p> : null}
    </>
  );
}
