/**
 * Thư (chủ game 31/10): letters and news from the game to every player, written by hand by the owner. To send one,
 * add it at the BOTTOM of MAILS: the player gets it the next time the game opens (and its days of life count from then).
 * Four tabs as in LoR: Thư, Báo vi phạm, Thư quà, Tin tức. Gifts are the owner's to set; none is made up here.
 */
export type Gift = { kind: "stars"; n: number } | { kind: "card"; id: string };

export type MailKind = "mail" | "warn" | "gift" | "news";

export type Mail = {
  /** Never changes or repeats: it tells the phone the letter was got already. */
  id: string;
  from: string;
  title: string;
  body: string;
  /** The tab it belongs to; left out, a letter with a gift is a gift letter and the rest are plain letters. */
  kind?: MailKind;
  gifts?: Gift[];
  /** Days the letter stays after the player got it; 30 if left out. News never goes. */
  days?: number;
  /** News: the card whose picture heads the post (khong-lo-mot-mat if left out). */
  cover?: string;
  /** News: the day of the post, "2026-10-31"; shown instead of the day it was got. */
  date?: string;
  /** News: "new" (MỚI ĐÂY) or "update" (THÔNG TIN BẢN CẬP NHẬT), for the News page. */
  tag?: "new" | "update";
};

export const MAIL_DAYS = 30;
export const MAIL_FROM = "Clash of the Beasts";

export const MAILS: Mail[] = [
  {
    id: "chao-mung",
    from: MAIL_FROM,
    title: "Chào mừng đến Clash of the Beasts",
    body: "Chào mừng bạn đến với Clash of the Beasts! Hãy chọn một bộ bài, bước vào sân đấu và cho mọi người thấy quái thú của bạn mạnh đến đâu. Hộp thư này sẽ báo cho bạn mọi tin mới và quà từ chúng tôi.",
  },
  {
    id: "ban-dau-moi",
    from: MAIL_FROM,
    title: "Bàn đấu mới và menu mới",
    body: "Bàn đấu đã được làm mới, nút OK có icon mới và menu chính có thêm Hộp thư, Cửa hàng, Bộ sưu tập. Chúc bạn chơi vui!",
  },
  {
    id: "tin-ban-dau-moi",
    from: MAIL_FROM,
    kind: "news",
    tag: "update",
    date: "2026-10-31",
    cover: "rong-con",
    title: "Bàn đấu mới và nút OK mới",
    body: "Bàn đấu được làm mới hoàn toàn với sân đỏ và xanh, giữa sân là nền đá có vạch vàng. Nút OK có ba mặt mới: dấu tick khi xác nhận, mũi tên khi chuyển quyền và đồng hồ cát khi hết vòng.",
  },
  {
    id: "tin-hop-thu",
    from: MAIL_FROM,
    kind: "news",
    tag: "new",
    date: "2026-10-31",
    cover: "khong-lo-mot-mat",
    title: "Hộp thư đã mở cửa",
    body: "Hộp thư có bốn tab: Thư, Báo vi phạm, Thư quà và Tin tức. Quà trong thư được nhận một lần, thư hết hạn sau 30 ngày kể từ lúc bạn nhận được.",
  },
];
