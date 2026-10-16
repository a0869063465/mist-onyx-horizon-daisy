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

## Đã xong: hình bàn đấu theo môi trường

- Ảnh bàn ở `public/env/` (846 × 1500), bảng ánh xạ ở `src/lib/env-boards.ts`. Đường nối chéo mờ là mặt nạ `public/env/seam.png` (CSS `mask-image` trên `.board-art.is-top`).
- Nửa trên = môi trường đối thủ, nửa dưới = môi trường mình. Môi trường không có ảnh (Biển sâu, không mang) dùng `board.png`.
- Bố cục riêng từng môi trường: `loadBoard(env)` / `saveBoard(layout, env)` / `matchBoard(topEnv, bottomEnv)` trong `src/lib/layouts.ts`, lưu ở khoá `clash-board-layout:<env>`; chưa lưu thì theo Mặc định.
- Theo nửa trên: chỉ số địch, thông báo, lịch sử thông báo, thanh phản ứng, ô môi trường địch. Theo nửa dưới: chỉ số mình, ô môi trường mình, xấp bài úp, khối nút Rút quái / Rút phép / Hết lượt (`actions`, mới thêm vào Tuỳ chỉnh).
- Núi dùng bản thêm ô có viền đá xám. Ảnh gốc chủ game gửi nằm trong lịch sử git (commit c4f248f, thư mục `art-src/`) nếu cần làm lại.
- Ô đặt quái trên bàn (vị trí lá) vẫn cố định theo bàn gốc, chưa chỉnh theo từng môi trường.

## Đang dở 2: hướng dẫn chơi kiểu Lục Thần

Chủ game hỏi có làm phần hướng dẫn chơi giống game Lục Thần không. Video đã gửi không phải video hướng dẫn. Đang chờ chủ game mô tả từng bước hoặc gửi ảnh chụp. Chưa làm gì.
