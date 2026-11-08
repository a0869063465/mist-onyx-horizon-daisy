# Tiến độ hiện tại (đọc trước khi làm)

Cập nhật: 08/11/2026. Nguồn đúng là nhánh `main`. Lịch sử đầy đủ: `docs/lich-su-tien-do.md` (không cần đọc khi bắt đầu việc mới).

## Quy tắc cập nhật file này

- File chỉ ghi trạng thái HIỆN TẠI: việc đang mở, câu hỏi chờ chủ game, mục "Đã lên main" gần nhất.
- Mỗi lần áp `main`: đổi mục "Đã lên main", bỏ việc đã xong khỏi "Đang mở", ghi hash `main` mới. Làm trong cùng lần áp.
- Việc xong cũ chuyển sang `docs/lich-su-tien-do.md` (thêm dưới cùng, không sửa cũ). Mục "Đã lên main" giữ tối đa 10 dòng.
- Mỗi việc mới: 3 dòng kế hoạch (vừa làm / hiện trạng / sắp làm), kèm mô hình và nỗ lực. Ghi file trước khi sửa code.
- Ghi rõ nhánh và "đã lên main?" ở mỗi mục. Không để "CHƯA áp main" cho việc đã có trong `main`.

## Đánh số việc (Vx)

- Mỗi việc mới chủ game gửi, Claude gán số kế tiếp: V1, V2, V3… Số không tái dùng.
- Bộ đếm hiện tại: **lần gán kế tiếp là V2**. Sau mỗi lần gán, tăng bộ đếm lên 1 và ghi vào bảng "Đang mở".
- Các V cũ (V1–V8, V8A–D trong lịch sử) đã đóng, không dùng lại số.

## Trạng thái nhanh

- `main`: `0756de3` (08/11/2026). Nhánh `Sualoi` có thêm 1 commit chưa lên `main`: `24840c1` (Hoán đổi: chọn sai không làm trận đứng yên, máy chỉ nhắm quái mình).
- Bộ sưu tập (sách, bìa, trang, lá): giao diện mới đã lên `main` (T1–T10).
- Nhiệm vụ Ngày/Tuần, bảng sau trận, hồ sơ, bảng xếp hạng, replay, hộp thư, tin tức: đã lên `main`.
- Hộp ma thuật, Gương vào hàng chờ, Hấp thụ ma pháp nuốt phép, V2–V4, V8B: đã lên `main`.

## Đã lên main gần đây

- 08/11: album (bìa sách, trang, lật quanh gáy, nhóm lá) T1–T10, kệ album theo ảnh, toàn màn hình.
- 06/11: menu chính (icon, vị trí, mở khoá), vuốt đổi tab, vuốt đổi lá, khoá thao tác web, nhạc trận.
- 05/11: nhiệm vụ Ngày/Tuần (3 trạng thái, nút nhận, bảng sau trận), nền menu video, nhạc menu.
- 04/11: Hấp thụ ma pháp nuốt phép nhanh, Giáp và Vuốt chờ trong chuỗi, V2 đổi bài đầu trận, V4 lá rút, V8B chọn mục tiêu bằng đèn pin.
- 03/11: khung lá (tay, sân, phép theo tốc độ), gợi ý khi gặp vấn đề, Gương dựng sẵn vào hàng chờ, tên skill theo màu viền.

## Đang mở

| Việc | Trạng thái | Mô hình đề xuất |
|---|---|---|
| V1: Mô tả skill đổi màu thông minh (chủ game gửi 08/11) | Chờ làm rõ: skill nào, đổi màu theo gì (từ khoá, loại, mức) | Chưa chốt |
| Album: lề trái còn lộ trang trước; sách "Đất Hoang" nâu chưa dùng | Chờ chủ game chọn chỗ dùng | Sonnet 5.5 medium |
| Album: chữ tiếng Anh "Theo nhân vật/môi trường", "Sắp có" chưa dịch; trang mô tả lá chưa đổi kiểu | Chưa làm | Sonnet 5.5 low |
| Album và toàn bộ giao diện mới: chưa thử điện thoại thật, màn rất ngắn/rất dài | Chưa kiểm | — |
| Robot tí hon (V4): 5 dạng biến hình | Chờ chủ game mô tả chỉ số, hình, luật | Opus 5.5 high (khi có luật) |
| Lồng tiếng nhân vật chủ chốt (V5) | Chờ file giọng, nhân vật, lúc nói | Sonnet 5.5 low |
| Menu: Thông tin chưa có nút (Cập nhật, Đã test, Xuất lịch sử đang ẩn) | Đã báo chủ game, chờ quyết | — |
| Hồ sơ: cấp và hạng chưa có luật lên hạng; chưa có chỗ đổi tên | Chờ chủ game | — |
| Nhiệm vụ Tuần: kho đếm đã có trong code, chưa xác nhận đủ luật với chủ game | Cần kiểm lại với chủ game | Opus 5.5 high |
| Hộp thư, tin tức, bạn bè: hàng Facebook/Instagram/YouTube/X | Chờ đường dẫn chủ game | — |
| Đánh thường online 2 máy (ghép phòng, nhiệm vụ đếm trận) | Chưa thử | — |
| Mô tả Kim châm, Virus ăn mòn, Phản nguyền, Hoán đổi, Cỗ máy thời gian, Giáp cơ khí (chữ lá) | Chờ chủ game viết | — |
| Máy (AI) chưa dùng Hấp thụ để nuốt; chưa hiểu Giáp/Cỗ máy dạng chờ | Chưa làm (nhắc chủ game) | Opus 5.5 high |
| APK Android: `android/` đã có trên `main` nhưng gác, khoá ký ở chủ game | Gác theo yêu cầu chủ game | — |

## Chờ chủ game trả lời

- Bông mềm, Hộ thủ, Tường thành có đổi glow trắng như Khiên thú sĩ không?
- Sách "Đất Hoang" nâu dùng ở kệ nào?
- Hồ sơ: luật lên hạng (Tập chơi IV → các hạng) và chỗ đổi tên người chơi.
- Nhiệm vụ Tuần: "Thắng 15 trận" có tính trận Vs Máy không?

## Quy tắc làm việc với chủ game (cốt lõi)

- Mỗi việc có mô hình và nỗ lực đã chốt. Mô hình đang chạy khác thì DỪNG, báo, chờ chủ game đổi. Xong phần được duyệt thì DỪNG, không tự làm bước kế.
- Mỗi kế hoạch ngắn: 3 mục (vừa làm / hiện trạng / sắp làm), kèm đề xuất mô hình và nỗ lực. Không plan dài.
- Chỉ sửa code khi chủ game đã nói "ok". Góp ý mới: ghi vào file, đưa kế hoạch, chờ "ok".
- Chỉ sửa đúng phần được nêu. Phần chủ game đã hài lòng giữ nguyên.
- Không sửa luật lá khi chủ game chỉ nhờ phần nhìn. Khi chưa chắc lá chạy ngay hay chờ, hỏi trước.
- Không tự thêm cơ chế, hiệu ứng hay cách hiểu mới. Chưa rõ 100% thì hỏi.
- Ảnh/video của việc đang làm: chỉ dùng đúng ảnh được nêu. Đừng mở ảnh cũ mà không nói rõ là ảnh cũ.
- Mỗi thay đổi người chơi thấy: thêm 1 dòng `PENDING_NOTES` (`src/lib/updates.ts`), ngắn như chủ game viết.
- Chủ game chỉ dùng điện thoại Android. Mọi hướng dẫn phải làm được trên điện thoại.
- Các lỗi đã mắc (làm nhầm tab, không nêu mô hình, sửa khi chưa "ok", gối dòng/icon, dòng chảy đi thẳng): chi tiết trong `docs/lich-su-tien-do.md`, mục "LỖI ĐÃ MẮC". Đọc khi làm việc dòng chảy hoặc giao diện trận.
