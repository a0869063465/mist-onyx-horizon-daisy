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
  /** Tên ảnh trong `public/ui/mission/` (không đuôi). */
  art: string;
  locked?: boolean;
};

export const DAILY_LIST: ListedMission[] = [
  { id: "d-first", title: "Chơi trận đầu tiên trong ngày", goal: 1, stars: 1, art: "d0" },
  { id: "d-play3", title: "Chơi 3 trận", goal: 3, stars: 1, art: "d1" },
  { id: "d-play10", title: "Chơi 10 trận", goal: 10, stars: 1, art: "d2" },
  { id: "d-play20", title: "Chơi 20 trận", goal: 20, stars: 1, art: "d3" },
  { id: "d-pvp6", title: "Thắng 6 trận PvP", goal: 6, stars: 1, art: "d4" },
  { id: "d-pvp10", title: "Thắng 10 trận PvP", goal: 10, stars: 1, art: "d5" },
  { id: "d-rank5", title: "Chơi 5 trận Xếp hạng", goal: 5, stars: 1, art: "d6", locked: true },
  { id: "d-rankwin3", title: "Thắng 3 trận Xếp hạng", goal: 3, stars: 1, art: "d7", locked: true },
];

export const WEEKLY_LIST: ListedMission[] = [
  { id: "w-rank15", title: "Chơi 15 trận xếp hạng (X3)", goal: 15, stars: 2, art: "w0", locked: true },
  { id: "w-rankwin6", title: "Thắng 6 trận xếp hạng (X3)", goal: 6, stars: 2, art: "w1", locked: true },
  { id: "w-relic1", title: "Sử dụng 1 bảo vật", goal: 1, stars: 2, art: "t-puzzle", locked: true },
  { id: "w-relic3", title: "Sử dụng 3 bảo vật", goal: 3, stars: 2, art: "t-ring", locked: true },
  { id: "w-cards10", title: "Thu thập 10 lá bài", goal: 10, stars: 2, art: "w4", locked: true },
  { id: "w-cards30", title: "Thu thập 30 lá bài", goal: 30, stars: 2, art: "w5", locked: true },
  { id: "w-rare4", title: "Thu thập 4 điểm SR hoặc UR", goal: 4, stars: 2, art: "w6", locked: true },
];
