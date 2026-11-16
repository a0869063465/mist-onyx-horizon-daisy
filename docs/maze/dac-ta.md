# Đặc tả vị trí mê cung PvE (bản 2)

## Hệ tọa độ
- Lưới 7×7. Cột 1–7 từ trái sang phải. Hàng A–G từ dưới lên trên (A dưới cùng, G trên cùng).
- Ô viết dạng (cột, hàng), ví dụ (1,A).
- Cửa vào: (1,A), mở ra cạnh dưới.

## Tường (cạnh giữa hai hàng, theo cột)
- G | F: cột 2, 3, 5, 6
- F | E: cột 1, 4
- E | D: cột 2, 3, 5
- D | C: cột 1, 2, 4, 6
- C | B: cột 3, 4, 6
- B | A: cột 2, 3, 5
- Viền dưới (dưới hàng A): cột 2–7. Cột 1 là cửa vào.

Tường dọc (cạnh giữa hai cột, theo hàng):
- Cột 1 | 2: hàng C
- Cột 2 | 3: hàng F, E, B
- Cột 3 | 4: hàng G, A
- Cột 4 | 5: cả 7 hàng
- Cột 5 | 6: hàng C
- Cột 6 | 7: hàng F, E, D, B

Viền ngoài kín, trừ cửa vào.

## Cổng dịch chuyển
- T1 (xanh dương, thường), hai chiều: (1,E) ↔ (4,A)
- T2 (xanh lá, an toàn), hai chiều: (3,G) ↔ (5,A)
- T3 (đỏ, nguy hiểm), một chiều: (1,C) → (6,C)

Khi nhân vật đứng trên ô có cổng, hiện khung chọn: Dịch chuyển hoặc Huỷ. Không tự dịch chuyển.
- Sau khi bấm Huỷ, khung chọn không hiện lại cho tới khi nhân vật bước ra khỏi ô rồi bước vào lại.
- Sau khi dịch chuyển, nhân vật đứng ở ô cổng đích nhưng khung chọn không hiện; chỉ hiện khi bước ra rồi vào lại ô cổng đó.

## Quái (đứng yên, không tuần tra)
- Lv1 (4 con): (1,C), (4,C), (2,D), (3,B)
- Lv2 (3 con): (1,F), (3,E), (6,A)
- Lv3 (2 con): (7,E), (6,D)
- Lv4 Boss (1 con, phòng 2×2): (5,E), (6,E), (5,F), (6,F)

Quái là đại diện trên bản đồ (kiểu Pokémon). Bước vào ô quái thì vào màn đấu bài. Thắng thì quái biến mất khỏi bản đồ và người chơi nhận buff.

## Rương
- Rương 1: (4,G)
- Rương 2: (5,G)

## Cửa phòng boss
- Cạnh dưới của (6,E).

## Điều kiện mở phòng boss
- Đã hạ ít nhất một quái Lv1, một quái Lv2 và một quái Lv3.

## Sương mù (tầm nhìn)
- Tầm nhìn hiện tại: ô nhân vật đang đứng và 1 ô theo mỗi hướng (lên, xuống, trái, phải). Tường chặn tầm nhìn, ô sau tường không sáng qua hướng đó.
- Vùng đã đi qua: 3 ô đầu tiên nhân vật đặt chân tới, tính theo ô riêng biệt (không tính số bước). Mọi ô đều tính như nhau, kể cả cửa vào (1,A). Đi lại các ô này không thêm ô mới.
- Ô nằm trong tầm nhìn hiện tại không được tính vào 3 ô này. Nếu một ô đã đi qua đang nằm trong tầm nhìn, nó không chiếm chỗ trong 3 ô, và ô đi qua tiếp theo sẽ thay vào.
- Ô ngoài hai vùng trên thì đen.
- Quái, rương, cổng và mọi vật thể trong ô đen bị ẩn hoàn toàn.
- Mép sương mờ dần (như các game dungeon khác), không cắt gọn theo ô.

## Chết và reset
- Thua màn đấu bài là chết, mất 1 trong 3 mạng (3 trái tim).
- Khi chết, nhân vật quay về ô đứng trước khi bước vào ô quái (lùi 1 ô). Buff đã nhận và tiến độ hạ quái, mở rương được giữ nguyên.
- Mất hết 3 mạng thì mê cung reset. Người chơi chỉ còn 1 cơ hội nữa để đi lại.
- Nếu thất bại lần nữa (mất hết 3 mạng ở cơ hội cuối) thì mê cung bị khoá.
- Đã bỏ quy tắc "chết 5 lần thì reset".
- Đã mua khoá mở mê cung và không vào mê cung trong 7 ngày thì mê cung reset. (cần xác nhận còn hiệu lực)
- Thoát khỏi mê cung không reset.

## Khoá mê cung
- Mua ở Cửa hàng PVE, giá tính bằng sao (giá cụ thể chưa chốt).
- Hạ boss thì mê cung đó được mở khoá đến hết tháng này.

## Sự kiện gửi ra ngoài
- `encounter { monster_id, level, cell }` (bắt đầu màn đấu bài)
- `monster_defeated { monster_id, level, cell }`
- `buff_granted { level, buff }`
- `chest_opened { chest_id, cell }`
- `teleport_used { pair_id, from, to }`
- `boss_unlocked {}` và `boss_entered { cell }`
- `player_died {}` và `maze_reset {}`

## Trạng thái cần lưu
- Vị trí hiện tại của người chơi.
- Danh sách quái đã hạ, rương đã mở.
- Cờ đã hạ quái Lv1, Lv2, Lv3 để mở boss.
- Số lần chết (đếm đến 5).
- Thời điểm vào mê cung lần cuối và cờ đã mua khoá.
- Trạng thái mở khoá đến hết tháng (sau khi hạ boss).
- Buff đã nhận.
- 3 ô đã đi qua đầu tiên (theo thứ tự).

## Chưa chốt
- Nội dung buff theo từng cấp quái.
- Giá khoá mê cung bằng sao là bao nhiêu.

## Bố cục màn hình (chủ game chốt)
- Ảnh mê cung giữ đúng vị trí như trong ảnh tham chiếu, rộng hết chiều ngang màn hình. Không được đẩy ảnh lên.
- Phần trên thiếu chỗ: phủ sương đen.
- Phần rìa dưới (mặt vách đá): có thể phủ sương đen che bớt, hoặc dùng làm khung. Khung hoặc không khung đều được, miễn đúng phong cách fantasy hiện đại, đồng bộ với màn hình chính.

## Khay bảo vật (chủ game chốt)
- Đặt ở phía dưới màn hình, dùng khung của ảnh khay tham khảo (nền xanh đậm, viền vàng bo góc).
- Bên trái: Dây chuyền. Ở giữa: ba nút Quái, Rương báu, Phòng boss. Bên phải: Trò chơi, Chìa khoá, Trượng, Cân.
- Bên dưới Trò chơi có 3 trái tim, biểu thị 3 mạng.

## Hiệu ứng và việc để sau
- Khi di chuyển vào ô quái có hiệu ứng vào trận (chi tiết chưa mô tả).
- Để sau (chủ game: làm mê cung trước): cách mở lại mê cung bị khoá, quy tắc 7 ngày, buff khi reset, bảo vật, Cửa hàng PVE.
