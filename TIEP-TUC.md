# Việc đang dở (đọc trước khi làm)

Ghi lại cuối phiên ngày 16/10/2026. Nhánh làm việc: `claude/test-app-phf3et` (chưa gộp vào `main`).
Vercel tự dựng bản xem thử cho nhánh này. Link chính chỉ đổi khi gộp vào `main`, và phải hỏi chủ game trước khi gộp.

## Quy tắc làm việc với chủ game

- Luật ở `AGENTS.project.md` (CLAUDE.md tự nạp). Đọc hết, chưa rõ 100% thì hỏi trước khi làm.
- Chủ game chỉ dùng điện thoại Android, không có máy tính. Mọi hướng dẫn phải làm được trên điện thoại.
- Đổi chỉ số đơn giản thì tự xếp Tăng/Giảm/Thay đổi lối chơi, tự sửa con số trong mô tả, ghi `BALANCE_LOG` (src/lib/power-balance.ts) và chạy `scripts/stamp-cards.ts` qua Vite để cập nhật `card-clock.ts`.
- Đổi chữ mô tả: thêm dòng vào `STALE_SKILLS` / `STALE_ASKS` (src/lib/card-edits.ts) để bản chỉnh cũ đã lưu không giữ số cũ.
- Mỗi thay đổi người chơi thấy: thêm một dòng vào `PENDING_NOTES` (src/lib/updates.ts).
- Không nhắc tới điểm mạnh, điểm yếu, khắc chế (đang ẩn).
- Bộ test có 9 bài lỗi sẵn (thẻ chia sẻ, giản đồ đăng nhập), không liên quan lá bài. `tsc` có 7 lỗi sẵn.
- Chạy thử luật: dùng `createServer` của Vite (`ssrLoadModule('/src/lib/duel.ts')`) vì Node thuần không hiểu đường dẫn `@/`.

## Đã xong trong phiên này

- Giao diện menu mới (ảnh bìa, nút, tiếng bấm), chữ lá bài Barlow Condensed to hơn 30% (`--card-text: 1.3`).
- Bàn đấu phủ kín màn hình (`public/board-bleed.jpg` nằm dưới `.board`, `board.png` giữ nguyên 100%).
- Nút, bảng thông báo, thanh phản ứng trong trận làm đẹp. Tiếng bấm mới trong trận.
- Hiệu ứng mới theo hệ lá (`src/components/game/arena-fx.tsx`, `src/lib/fx-kinds.ts`), có nút Mới/Cũ trong Tuỳ chỉnh → Hiệu ứng.
- 5 lá môi trường: Thảo nguyên, Đất đá, Núi, Rừng rậm, Bóng tối (luật trong duel.ts, hệ quái trong `src/lib/env-kinds.ts`).
- Chỉnh lá: Chiến binh lẫn khuất, Gã hề đáng sợ, Khủng long vãy kiếm, Kiếm sĩ lửa thiêng, Đấu sĩ bò tót.

## Đang dở 1: hình bàn đấu theo môi trường

Chủ game đã chốt:
- Mỗi môi trường có ảnh **nửa trên** (phía đối thủ) và **nửa dưới** (phía mình). Có thể chỉ có một nửa, nửa còn lại dùng bàn Mặc định (`public/board.png`).
- Khi chơi: nửa trên lấy theo môi trường của đối thủ, nửa dưới theo môi trường của mình. Chỗ nối là đường **gấp khúc tự nhiên, mờ dần, chạy chéo qua sân đá** (từ trái ~63% chiều cao lên phải ~37%), chạy qua la bàn, không né. Cùng một ảnh đủ cho cả hai nửa thì dùng nguyên ảnh, không nối.
- Cảnh ngoài bàn (`board-bleed.jpg`) dùng chung cho mọi môi trường, mép làm mờ như hiện tại.
- Tuỳ chỉnh → Điều chỉnh bàn chơi có nút **chọn môi trường**. Chọn môi trường nào thì hiện ảnh đó, chỉnh tay vị trí các mục, bấm Lưu thì lưu bố cục **riêng cho môi trường đó** (bố cục hiện tại = Mặc định).
- Mục theo **môi trường trên**: chỉ số địch, bảng thông báo, lịch sử thông báo (chấm), thanh phản ứng, ô môi trường địch.
- Mục theo **môi trường dưới**: chỉ số mình, ô môi trường mình, khối nút Rút quái / Rút phép / Hết lượt.
- **Còn chờ chủ game trả lời**: (1) Xấp bài úp theo môi trường dưới, đúng không? (2) Thêm khối ba nút Rút quái / Rút phép / Hết lượt vào Tuỳ chỉnh để chỉnh vị trí, đi chung một khối, đúng không?

Ảnh đã nhận, lưu ở `art-src/moi-truong/` (cỡ 942 × 1670, cùng tỉ lệ bàn gốc):

| Môi trường | Nửa trên | Nửa dưới |
|---|---|---|
| Thảo nguyên | thao-nguyen-tren.jpg | thao-nguyen-duoi.jpg |
| Đất đá | dat-da-tren.jpg | dat-da-duoi.jpg |
| Rừng rậm | rung-ram-du.jpg | rung-ram-du.jpg |
| Núi | nui-du-*.jpg | nui-du-*.jpg |
| Bóng tối | bong-toi-du.jpg | bong-toi-du.jpg |

Núi: ảnh gốc thiếu 3 ô bài phe xanh. Đã có hai bản thêm ô: `nui-du-o-tron.jpg` (chỉ ô, cắt tới viền 1) và `nui-du-vien-da.jpg` (thêm viền 2 đá xám). **Chủ game chưa chọn bản nào.**
Biển sâu chưa có ảnh nên dùng Mặc định.

Bản thử đường nối đã làm bằng Python: mặt nạ = đường chéo + sóng sin + nhiễu, độ mờ ~42±18 px, thêm loang kiểu mây. Chủ game xem và đồng ý hướng này.

## Đang dở 2: hướng dẫn chơi kiểu Lục Thần

Chủ game hỏi có làm phần hướng dẫn chơi giống game Lục Thần không. Video đã gửi không phải video hướng dẫn. Đang chờ chủ game mô tả từng bước hoặc gửi ảnh chụp. Chưa làm gì.
