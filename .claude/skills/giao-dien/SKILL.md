---
name: giao-dien
description: Dựng màn giao diện từ ảnh linh kiện chủ game đưa: cắt nguyên, cài vào, chèn hiệu ứng, đo cho giống 100%. Đọc MỖI LẦN chủ game đưa ảnh khung/nút/ô/glow/phông để làm hoặc sửa màn.
---
# Dựng giao diện từ linh kiện chủ game (bản nháp 15/11, chủ game sẽ sửa)

Skill chỉ xoay quanh: ÁP thành phần chủ game đưa thành thành phẩm, rồi ĐO cho giống 100%. Không tự vẽ, không tự chỉnh chi tiết gốc.

## Luật cứng
- Cắt NGUYÊN ảnh. Không co, không làm mờ, không đổi màu, không thu glow, không xoá chữ in sẵn. Glow chủ game đưa nhỏ thì để nhỏ.
- Không dựng lại bằng CSS/SVG. Muốn dựng bằng code thì hỏi trước.
- Ảnh của màn/tab nào thì làm đúng màn/tab đó. Có thể nhầm thì nói rõ "tôi sửa X theo ảnh Y" và chờ xác nhận.
- Thiếu vị trí/ảnh thì HỎI, không tự đặt. Chưa rõ 100% thì hỏi.
- Xong phần được duyệt thì DỪNG, gửi ảnh, chờ chủ game.

## Các bước
1. **Nhận ảnh.** Ưu tiên ảnh 1:1 đã đặt sẵn mọi linh kiện (vị trí, cỡ, glow đều lấy từ đó). Ghi rõ đã nhận ảnh nào, thiếu ảnh nào.
2. **Cắt nguyên** bằng PIL+numpy (không cài thêm gói khi chưa được phép). Nền đen: alpha = 3×max(r,g,b). Nền khác: bao lồi hoặc flood-fill dừng ở viền. Ô tranh trong khung: flood-fill vùng trong đường viền mảnh để thành trong suốt. Cắt trực tiếp từ ảnh 1:1 thì không xử lý gì thêm. Lưu `public/ui/<màn>/*.webp`.
3. **Chữ từ ảnh phông.** Tách từng ký tự (dải dòng + chiếu dọc), lập atlas + manifest JSON, ghép bằng `<i>` định vị theo `background-position`. Ký tự không có trong phông thì để trống. Mẫu: `src/components/gold-text.tsx`.
4. **Ảnh trong khung nghiêng.** Đo 4 góc ô tranh (khớp đường thẳng 4 cạnh, giao điểm), giải ma trận phối cảnh 8 ẩn → CSS `matrix3d`. `matrix3d` cần px nên đặt `--k` = bề ngang / bề ngang ảnh thiết kế bằng ResizeObserver, `transform: scale(var(--k)) matrix3d(...)`.
5. **Toạ độ.** Đơn vị `--u = 100cqw / bề ngang ảnh thiết kế` (848). Mọi vị trí viết bằng px của ảnh. Nhớ `max-width:none` cho ảnh vì Tailwind preflight ép `max-width:100%`.
6. **Đo kiểm.** Khớp mẫu (numpy, sai số trung bình trên vùng alpha > 240, dò dời + tỉ lệ, cho phép co ngang/dọc riêng) để lấy đúng vị trí/cỡ từng miếng trong ảnh 1:1. Chụp game bằng Playwright Chromium viewport 424×928, deviceScaleFactor 2 (đúng 848 px), đặt cạnh ảnh gốc. Chưa khớp thì chỉnh SỐ, không đổi hình.
7. **Hiệu ứng.** Chỉ chèn SAU khi tĩnh đã khớp. Dùng đúng ảnh/video chủ game đưa (xem skill `vfx`), không tự vẽ thêm.
8. **Báo cáo** (3 mục ngắn theo CLAUDE.md): gửi ảnh miếng cắt + ảnh so sánh; nói rõ chỗ chưa đo, chưa thử điện thoại; liệt kê MỌI chỗ tự làm (không có trong ảnh chủ game).
9. Ghi `PENDING_NOTES` (src/lib/updates.ts) nếu người chơi thấy khác; cập nhật `TIEP-TUC.md`.

## Ví dụ làm mẫu
Màn Chọn bộ bài `/modes` (15/11): `src/routes/modes.tsx`, khối CSS `.dk2-*` cuối `src/styles.css`, miếng cắt `public/ui/deck/`, atlas `src/lib/deck-glyphs.json`.
