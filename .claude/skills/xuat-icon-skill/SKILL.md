---
name: xuat-icon-skill
description: Xuất ảnh các icon skill (phác thảo + 1 dòng mô tả) để chủ game vẽ lại. Dùng khi chủ game nhờ "xuất icon", "gửi icon cần vẽ", hoặc cần danh sách icon skill chưa có hình riêng.
---
# /xuat-icon-skill

Chủ game chỉ dùng điện thoại, tự vẽ icon rồi gửi lại. Ảnh xuất ra phải gọn, các icon xếp SÁT NHAU, mỗi icon một dòng mô tả nhỏ bên dưới.

## Chuẩn ảnh (chủ game chốt 27/11)
- Mỗi icon = vòng tròn 200 px, nền xanh đêm chuyển sắc (`radial-gradient #2b3a78 → #0d1430`), viền `#6f86d6` dày 3 px. Giống vòng icon trong game, KHÔNG viền vàng, KHÔNG khung thẻ.
- Trong vòng: phác thảo nét trắng đơn giản (viewBox 200×200, nét dày 5), chỉ nhấn màu đúng ý nghĩa (đỏ = ra, xanh dương = vào, xanh lá = hồi, vàng = tia/chuôi kiếm). Chỉ là gợi ý bố cục để chủ game vẽ lại, KHÔNG phải hình đưa vào game.
- Dưới vòng: TÊN skill (vàng `#ffd77a`, đậm) rồi 1 DÒNG MÔ TẢ nhỏ (12 px, `#cfd8f5`) ghi hình cần vẽ theo lời chủ game. Không thêm nhãn khác.
- Lưới 3 cột, khoảng cách 6 px, rộng 760 px, chụp Chromium `deviceScaleFactor` 1.4. Một ảnh duy nhất cho cả lô.
- CHỈ đưa icon chủ game đã chọn vẽ. Icon chủ game không vẽ thì loại khỏi ảnh (không nhắc lại, trừ khi chủ game hỏi).
- Muốn xem icon cũ để so: dùng ảnh thật `public/ui/skill/<tên>.webp` trong vòng; icon chưa có tranh dùng glyph trắng từ `SKILL_ICONS` (`src/lib/skill-icons.ts`).

## Cách làm
1. Chốt danh sách icon + mô tả đúng lời chủ game (hình chủ game nói lần cuối là hình đúng). Chưa rõ hình thì hỏi, không tự bịa.
2. Sửa `ICONS` trong `.claude/skills/xuat-icon-skill/make-sheet.py` (tên, mô tả, SVG phác thảo; có sẵn 5 icon mẫu: Nắng ấm lên, Sinh mệnh mới, Gặt hồn, Lời thề, Càng xinh đẹp).
3. Chạy: `python3 .claude/skills/xuat-icon-skill/make-sheet.py <thư mục scratchpad>` rồi `NODE_PATH=$(npm root -g) node .claude/skills/xuat-icon-skill/shot.cjs <thư mục scratchpad>` (ra `icon-xuat.png`; cần chỉnh `height` trong shot.cjs nếu nhiều icon, ảnh chụp fullPage nên không sao).
4. Xem ảnh một lần cho đúng, rồi `SendUserFile` (display render). Trả lời ngắn: liệt kê icon + mô tả, nói phác thảo chỉ là gợi ý.

## Khi chủ game vẽ xong gửi lại
Đặt `public/ui/skill/<tên-icon>.webp` (256 px, tròn, nền trong như bộ cũ; làm theo `docs/nhat-ky.md` mục "Icon skill vẽ tay"), thêm tên vào `src/lib/skill-art-ids.ts`, đổi tên icon của skill trong `src/lib/skill-book.ts`. Icon giữa màn hình dùng bản `public/ui/skill-c/`.
