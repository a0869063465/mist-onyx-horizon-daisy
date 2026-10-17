# Việc đang dở (đọc trước khi làm)

Ghi lại cuối phiên ngày 17/10/2026. Nhánh làm việc: `claude/test-app-phf3et` (chưa gộp vào `main`).
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

## Đã xong: màn tải

- `src/lib/preload.ts`: `gameJobs()` (tiếng, video hiệu ứng, hình bàn mọi môi trường, khung lá, phông) và `matchJobs(duel)` (hình mọi lá hai bên mang vào trận). Video giữ bản trong bộ nhớ, thẻ `<video>` lấy qua `fxUrl()`.
- `src/components/game/load-screen.tsx`: màn tải game (gắn ở `__root.tsx`, chạy một lần khi mở app) và màn tải trận (đầu `play.tsx`). % là số file đã tải xong thật. Quá 20 giây hiện nút Vào luôn.
- Nền riêng: chủ game sẽ gửi. Đặt vào `public/load-game.jpg` và `public/load-match.jpg` là tự hiện; chưa có thì nền tối.

## Đang dở: hướng dẫn chơi

- Nút Hướng dẫn tạm đặt trong Chọn cách chơi (`modes.tsx`, chế độ `tutorial`). Chủ game trả lời câu "mở từ đâu" là "c", chưa nói cách nào. Cần hỏi lại.
- Linh vật: Người giữ khoá (`public/tutorial/nguoi-giu-khoa.webp`, chủ game gửi). Khung thoại gọn đứng cạnh chỗ đang hướng dẫn, nút » nổi khối thay OK.
- Trận hướng dẫn: `src/lib/tutorial.ts` dựng bài cố định. Bạn có Rồng con, Khổng lồ 1 mắt và Hấp thụ ma pháp; Sợi xích địa ngục nằm thứ 2 trong xấp phép, lên đầu khi tới bước rút phép. Đối thủ cầm Sợi xích địa ngục, rút Phù thuỷ tí hơn.
- Các bước ở `src/components/game/tutorial.tsx` (mảng `steps`), theo đúng kịch bản thứ 2 của chủ game (17/10). Lượt đối thủ được dàn sẵn qua `drive` (rút, triệu hồi, dùng Sợi xích địa ngục, kết thúc lượt; nhường cho Sợi xích địa ngục của bạn). Máy tự đánh chỉ bật lại sau khi hướng dẫn xong.
- Chủ game duyệt danh sách bước (17/10) và đã sửa: câu 13, 14, 16, 18, 33; vòng sáng sao bọc cả ngôi sao (`left` trong `Focus`); bước 18–20 chỉ sáng quái 1 sao (`data-stars` trên lá trên tay); bước 19 làm mẫu lặp lại, người chơi phải tự kéo thả; bước 20 chỉ chỉ cách bấm Triệu hồi (lượt này đã triệu hồi rồi); bước 26 sáng cả bảng thông báo; bước 29 giữ màn tối; xong hoặc Bỏ qua thì về màn trước khi vào hướng dẫn (`clash-tutorial-from`).
- Sửa lỗi game thật: sau khi kéo thả quái, cú chạm kế tiếp bị nuốt (`suppressClick` giờ xoá khi có cú chạm mới trên bàn).
- Bấm Triệu hồi trên lá quái giờ triệu hồi luôn vào ô trống đầu tiên từ trái sang. Hết ô trống hoặc đang chọn hiến tế (giữ lâu lá) thì chọn ô bằng tay như cũ.
- Số trên góc xấp bài to gấp đôi, ô vàng nổi khối. Số phép trên tay và quái dự bị của đối phương to gấp đôi, ô 3D (`COUNT_MARKS` / `markScale` trong `layouts.ts`, Tuỳ chỉnh cũng theo).

## Đã xong: bảng quái mới (chủ game vẽ bảng trắng, 17/10)

- `src/components/game/monster-sheet.tsx`: bấm quái trên tay hoặc trên sân. Trên: icon kỹ năng (chủ động vòng xanh lam, nội tại vòng tím). Giữa: lá kiểu trên sân (`SheetCard` trong play.tsx, số cam góc trái trên = `fieldCount`), tên, nút 3D. Dưới: mô tả của icon đang chọn.
- Bảng kỹ năng từng quái: `src/lib/skill-book.ts` (tên, loại, icon, tiêu đề trong chữ lá; mô tả cắt từ chữ lá nên sửa chữ lá là theo). Quái mới thì thêm dòng vào `SKILL_BOOK`.
- Icon: game-icons.net (CC BY 3.0, có dòng ghi nguồn trong Cài đặt). Thêm icon: `npm pack @iconify-json/game-icons`, giải nén, `node scripts/skill-icons.mjs <đường dẫn icons.json>` sinh lại `src/lib/skill-icons.ts`. Bộ envato chủ game gửi là hàng trả phí có watermark, không dùng.
- Nút theo kiểu Lục Thần (chủ game duyệt lại): ô tối viền phát sáng, huy hiệu tròn icon vàng, chữ dưới. Triệu hồi vàng (icon up-card), Hiến tế đỏ (candle-skull), Dung hợp tím (linked-rings), quái dung hợp ra sân tím pha đỏ. Chỉ hiện khi luật cho phép (chạy thử luật trước). Ngọc + số mana kế bên chữ khi tốn mana. Icon kỹ năng: huy hiệu vành vàng 4 mấu kim cương (`Rim`).
- Hiến tế → khung chọn quái 3D (`vow3d`), nút Triệu hồi đỏ nhỏ. Giữ lâu lá vẫn dùng được.
- Dung hợp → bàn tối đi, KHÔNG nghiêng (video tham khảo bị quay ngang). Hai lá bay từ chỗ của chúng vào giữa, chồng lên, loé sáng + tia, lá mới hiện to, rồi bảng quái dung hợp → Triệu hồi → lá thu nhỏ bay xuống ô (`FuseShow` trong play.tsx). Kéo lá lên quái để dung hợp (cách cũ) vẫn giữ.
- Hiệu ứng triệu hồi hiến tế: `rite` trong arena-fx (luôn chạy, không theo nút Mới/Cũ) + tiếng `riteSummon` tổng hợp trong sfx.ts. Lửa và tiếng cười trên quái bị hiến tế giữ nguyên.
- Chủ game nói "Số 1 2 và 3 tiêu đề không có ý nghĩa, bỏ đi", chưa xác nhận cách hiểu. Kịch bản mới có danh sách 1–4 (Rút bài, Triệu hồi, Kỹ năng, Ma pháp) nên vẫn giữ số.
