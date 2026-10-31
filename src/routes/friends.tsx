import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr, useLang } from "@/lib/i18n";
import { artSrc } from "@/lib/catalog";
import { START_RANK, rankLabel } from "@/lib/rank";
import { playUi } from "@/lib/sfx";
import { addFriend, answerFriend, cleanId, friendList, ID_LENGTH, removeFriend, type AskRow, type FriendRow } from "@/lib/friends";
import { FriendProfile } from "@/components/friend-profile";
import { MODE_LABELS, PLAYER_NAME, playerId, readPulse, setFriendMatch, setPulse, usePulse } from "@/lib/friend-state";

type Tab = "friends" | "asks" | "sent";

export const Route = createFileRoute("/friends")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    search.tab === "asks" || search.tab === "sent" ? { tab: search.tab } : {},
  component: FriendsPage,
});

type Lists = { friends: FriendRow[]; asks: AskRow[]; sent: AskRow[] };

/**
 * Bạn bè (chủ game 31/10): ID của máy + Sao chép, thêm bạn bằng ID, hàng xanh khi có lời mời kết bạn mới, 3 tab
 * Bạn bè (n) / Lời mời / Kết bạn. Mỗi bạn: bìa bộ bài đang dùng, "lv 1", "Người chơi" + ID, hạng, trạng thái, nút ⋮.
 */
function FriendsPage() {
  useLang();
  const navigate = useNavigate();
  const tab: Tab = Route.useSearch().tab ?? "friends";
  const pulse = usePulse();
  const [me, setMe] = useState("");
  const [lists, setLists] = useState<Lists | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [look, setLook] = useState<string | null>(null);
  const busy = useRef(false);

  const load = useCallback(async () => {
    const id = playerId();
    if (!id || busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const got = await friendList({ data: { id } });
      setLists(got);
      setFailed(false);
      setPulse({ ...readPulse(), asks: got.asks.length });
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMe(playerId());
    void load();
    const timer = window.setInterval(() => document.visibilityState === "visible" && void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  // Lời mời kết bạn mới tới (báo trạng thái thấy nhiều hơn danh sách đang có): tải lại.
  useEffect(() => {
    if (lists && pulse.asks > lists.asks.length) void load();
  }, [pulse.asks, lists, load]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 3600);
    return () => window.clearTimeout(timer);
  }, [note]);

  const pick = (next: Tab) => {
    playUi("select");
    setMenu(null);
    void navigate({ to: "/friends", search: next === "friends" ? {} : { tab: next }, replace: true });
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(me);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNote("Không sao chép được.");
    }
  }

  async function add() {
    const to = cleanId(input);
    if (to.length !== ID_LENGTH) {
      setNote("ID có 8 ký tự.");
      return;
    }
    playUi("confirm");
    try {
      const got = await addFriend({ data: { id: me, to } });
      if (!got.ok) {
        setNote(got.error);
        return;
      }
      setInput("");
      setNote(got.friend ? "Đã thêm bạn." : "Đã gửi lời mời kết bạn.");
      await load();
    } catch {
      setNote("Mất kết nối. Thử lại.");
    }
  }

  async function answer(from: string, yes: boolean) {
    playUi(yes ? "confirm" : "soft");
    try {
      await answerFriend({ data: { id: me, from, yes } });
      if (yes) setNote("Đã thêm bạn.");
    } catch {
      setNote("Mất kết nối. Thử lại.");
    }
    await load();
  }

  async function drop(other: string) {
    setAsking(null);
    setMenu(null);
    playUi("soft");
    try {
      await removeFriend({ data: { id: me, other } });
    } catch {
      setNote("Mất kết nối. Thử lại.");
    }
    await load();
  }

  function invite(to: string) {
    setMenu(null);
    playUi("confirm");
    setFriendMatch({ kind: "invite", to });
    void navigate({ to: "/modes" });
  }

  function watch(friend: string) {
    setMenu(null);
    playUi("confirm");
    sessionStorage.setItem("clash-watch", friend);
    void navigate({ to: "/play" });
  }

  const friends = lists?.friends ?? [];
  const asks = lists?.asks ?? [];
  const sent = lists?.sent ?? [];
  const index = tab === "friends" ? 0 : tab === "asks" ? 1 : 2;
  const tabs: { key: Tab; label: string; count?: number; badge?: number }[] = [
    { key: "friends", label: `Bạn bè (${friends.length})` },
    { key: "asks", label: "Lời mời", badge: asks.length },
    { key: "sent", label: "Kết bạn" },
  ];

  return (
    <main className="ml fr" onClick={() => setMenu(null)}>
      <i className="ml-corner is-tl" aria-hidden="true" />
      <i className="ml-corner is-tr" aria-hidden="true" />
      <i className="ml-corner is-bl" aria-hidden="true" />
      <i className="ml-corner is-br" aria-hidden="true" />
      <header className="ml-head">
        <Link to="/" className="ml-back" aria-label={tr("Trở về")} data-sfx onPointerDown={() => playUi("soft")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 5L7.5 12l7 7" />
          </svg>
        </Link>
        <h1>{tr("BẠN BÈ")}</h1>
        <button
          type="button"
          className={`ml-back fr-refresh${loading ? " is-spin" : ""}`}
          aria-label={tr("Làm mới")}
          onClick={() => {
            playUi("soft");
            void load();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12a7 7 0 1 1-2.1-5" />
            <path d="M19.5 4.5v4h-4" />
          </svg>
        </button>
      </header>
      <section className="fr-top">
        <div className="fr-me">
          <span>{tr("ID của bạn")}</span>
          <b>{me || "--------"}</b>
          <button type="button" className="fr-btn is-copy" onClick={() => void copy()}>
            {tr(copied ? "Đã chép" : "Sao chép")}
          </button>
        </div>
        <form
          className="fr-add"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <input
            value={input}
            maxLength={ID_LENGTH + 4}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder={tr("Nhập ID để kết bạn")}
            aria-label={tr("Nhập ID để kết bạn")}
            onChange={(event) => setInput(cleanId(event.target.value))}
          />
          <button type="submit" className="fr-btn is-yes" disabled={!me}>
            {tr("Thêm")}
          </button>
        </form>
        {asks.length > 0 && tab !== "asks" ? (
          <button type="button" className="fr-news" onClick={() => pick("asks")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="8.5" r="3.2" />
              <path d="M3.8 19.5a6.2 6.2 0 0 1 12.4 0M18.5 8v6M15.5 11h6" />
            </svg>
            <span>{tr("Có {n} lời mời kết bạn mới").replace("{n}", String(asks.length))}</span>
            <i aria-hidden="true">›</i>
          </button>
        ) : null}
      </section>
      <nav className="ml-tabs fr-tabs" role="tablist" style={{ ["--at" as string]: index }}>
        {tabs.map((one) => (
          <button key={one.key} type="button" role="tab" aria-selected={one.key === tab} className={one.key === tab ? "on" : ""} onClick={() => pick(one.key)}>
            <span>{tr(one.label)}</span>
            {one.badge ? <em className="ml-badge">{one.badge > 9 ? "9+" : one.badge}</em> : null}
          </button>
        ))}
        <i className="ml-ink" aria-hidden="true" />
      </nav>
      <section className="ml-pane" key={tab}>
        {lists === null ? (
          <div className="ml-empty">
            <p>{tr(failed ? "Không kết nối được máy chủ." : "Đang tải…")}</p>
          </div>
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <Empty text="Chưa có bạn. Nhập ID của bạn bè để kết bạn." />
          ) : (
            <ul className="ml-list fr-list">
              {friends.map((row, order) => (
                <li key={row.id} style={{ ["--i" as string]: order }}>
                  <div className="fr-row">
                    <Face
                      cover={row.cover}
                      onOpen={() => {
                        playUi("select");
                        setLook(row.id);
                      }}
                    />
                    <div className="fr-who">
                      <b>{tr(PLAYER_NAME)}</b>
                      <i>{row.id}</i>
                      <span className={`fr-state${row.mode ? " is-play" : ""}`}>
                        {row.mode ? `${tr("Đang chơi")} ${tr(MODE_LABELS[row.mode])}` : tr("Đang chờ")}
                      </span>
                    </div>
                    <span className="fr-rank">{tr(rankLabel(START_RANK.tier, START_RANK.level))}</span>
                    <button
                      type="button"
                      className="fr-more"
                      aria-label={tr("Thêm")}
                      onClick={(event) => {
                        event.stopPropagation();
                        playUi("soft");
                        setMenu(menu === row.id ? null : row.id);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="5.5" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="12" cy="18.5" r="1.8" />
                      </svg>
                    </button>
                    {menu === row.id ? (
                      <div className="fr-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                        <button type="button" role="menuitem" disabled={Boolean(row.mode)} onClick={() => invite(row.id)}>
                          {tr("Mời vào trận")}
                        </button>
                        {row.watch ? (
                          <button type="button" role="menuitem" onClick={() => watch(row.id)}>
                            {tr("Xem trận")}
                          </button>
                        ) : null}
                        <button type="button" role="menuitem" className="is-danger" onClick={() => setAsking(row.id)}>
                          {tr("Xoá bạn")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : tab === "asks" ? (
          asks.length === 0 ? (
            <Empty text="Không có lời mời kết bạn." />
          ) : (
            <ul className="ml-list fr-list">
              {asks.map((row, order) => (
                <li key={row.id} style={{ ["--i" as string]: order }}>
                  <div className="fr-row">
                    <Face cover={row.cover} />
                    <div className="fr-who">
                      <b>{tr(PLAYER_NAME)}</b>
                      <i>{row.id}</i>
                      <span className="fr-state">{tr("Muốn kết bạn với bạn")}</span>
                    </div>
                    <div className="fr-acts">
                      <button type="button" className="fr-btn is-yes" onClick={() => void answer(row.id, true)}>
                        {tr("Đồng ý")}
                      </button>
                      <button type="button" className="fr-btn" onClick={() => void answer(row.id, false)}>
                        {tr("Từ chối")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : sent.length === 0 ? (
          <Empty text="Chưa gửi lời mời kết bạn nào." />
        ) : (
          <ul className="ml-list fr-list">
            {sent.map((row, order) => (
              <li key={row.id} style={{ ["--i" as string]: order }}>
                <div className="fr-row">
                  <Face cover={row.cover} />
                  <div className="fr-who">
                    <b>{tr(PLAYER_NAME)}</b>
                    <i>{row.id}</i>
                    <span className="fr-state">{tr("Đang chờ trả lời")}</span>
                  </div>
                  <div className="fr-acts">
                    <button type="button" className="fr-btn" onClick={() => void drop(row.id)}>
                      {tr("Huỷ")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {look ? <FriendProfile friend={look} onClose={() => setLook(null)} /> : null}
      {note ? <p className="fr-toast is-page">{tr(note)}</p> : null}
      {asking ? (
        <div className="fr-ask-back" onClick={() => setAsking(null)}>
          <div className="fr-ask" role="dialog" aria-label={tr("Xoá bạn")} onClick={(event) => event.stopPropagation()}>
            <h2>{tr("Xoá bạn")}</h2>
            <p>
              {tr(PLAYER_NAME)} <b>{asking}</b>
            </p>
            <div className="fr-acts">
              <button type="button" className="fr-btn is-danger" onClick={() => void drop(asking)}>
                {tr("Xoá")}
              </button>
              <button type="button" className="fr-btn" onClick={() => setAsking(null)}>
                {tr("Huỷ")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Face({ cover, onOpen }: { cover: string | null; onOpen?: () => void }) {
  const art = cover ? artSrc(cover, 1) : null;
  return (
    <span className={`fr-face${onOpen ? " is-tap" : ""}`} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onClick={onOpen}>
      <span className="fr-pic" style={art ? { backgroundImage: `url(${art})` } : undefined} />
      <em className="fr-lv">lv 1</em>
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="ml-empty">
      <svg className="ml-ico" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8.5" r="3" />
        <circle cx="16.5" cy="9.5" r="2.4" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 15a4.5 4.5 0 0 1 6 4" />
      </svg>
      <p>{tr(text)}</p>
    </div>
  );
}
