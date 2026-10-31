/**
 * Thư (chủ game 31/10): letters from the game to every player, written by hand by the owner. To send one, add it at
 * the BOTTOM of MAILS: the player gets it the next time the game opens (and its days of life count from then).
 * Gifts are the owner's to set; none is made up here.
 */
export type Gift = { kind: "stars"; n: number } | { kind: "card"; id: string };

export type Mail = {
  /** Never changes or repeats: it tells the phone the letter was got already. */
  id: string;
  from: string;
  title: string;
  body: string;
  gifts?: Gift[];
  /** Days the letter stays after the player got it; 30 if left out. */
  days?: number;
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
];
