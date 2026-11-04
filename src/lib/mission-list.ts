/**
 * Danh sách nhiệm vụ Ngày / Tuần (chủ game 04/11, theo ảnh thiết kế).
 * Hiện chỉ để hiển thị: luật đếm trận, reset ngày/tuần và trả thưởng làm ở bước sau.
 * `locked` = cơ chế chưa có trong game (Xếp hạng, bảo vật, thu thập lá bài): thẻ xám, ghi "Sắp có".
 */
export type ListedMission = {
  id: string;
  title: string;
  goal: number;
  stars: number;
  /** Ảnh hàng của chủ game (khung GPT) trong `public/ui/mission/`, không đuôi. */
  row: string;
  /** Ảnh bảo vật thay icon trong hàng (nếu có). */
  relic?: string;
  locked?: boolean;
};

export const DAILY_LIST: ListedMission[] = [
  { id: "d-first", title: "Chơi trận đầu tiên trong ngày", goal: 1, stars: 1, row: "rd0" },
  { id: "d-play3", title: "Chơi 3 trận", goal: 3, stars: 1, row: "rd1" },
  { id: "d-play10", title: "Chơi 10 trận", goal: 10, stars: 1, row: "rd2" },
  { id: "d-play20", title: "Chơi 20 trận", goal: 20, stars: 1, row: "rd3" },
  { id: "d-pvp6", title: "Thắng 6 trận PvP", goal: 6, stars: 1, row: "rd4" },
  { id: "d-pvp10", title: "Thắng 10 trận PvP", goal: 10, stars: 1, row: "rd5" },
  { id: "d-rank5", title: "Chơi 5 trận Xếp hạng", goal: 5, stars: 1, row: "rd6", locked: true },
  { id: "d-rankwin3", title: "Thắng 3 trận Xếp hạng", goal: 3, stars: 1, row: "rd7", locked: true },
];

export const WEEKLY_LIST: ListedMission[] = [
  { id: "w-rank15", title: "Chơi 15 trận xếp hạng (X3)", goal: 15, stars: 2, row: "rw0", locked: true },
  { id: "w-rankwin6", title: "Thắng 6 trận xếp hạng (X3)", goal: 6, stars: 2, row: "rw1", locked: true },
  { id: "w-relic1", title: "Sử dụng 1 bảo vật", goal: 1, stars: 2, row: "rw2", relic: "t-puzzle", locked: true },
  { id: "w-relic3", title: "Sử dụng 3 bảo vật", goal: 3, stars: 2, row: "rw3", relic: "t-ring", locked: true },
  { id: "w-cards10", title: "Thu thập 10 lá bài", goal: 10, stars: 2, row: "rw4", locked: true },
  { id: "w-cards30", title: "Thu thập 30 lá bài", goal: 30, stars: 2, row: "rw5", locked: true },
  { id: "w-rare4", title: "Thu thập 4 điểm SR hoặc UR", goal: 4, stars: 2, row: "rw6", locked: true },
];
