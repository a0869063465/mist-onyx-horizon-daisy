---
name: la-moi
description: Quy trình làm lá bài MỚI (quái, phép, dạng ngoài bộ) cho Clash of the Beasts. Đọc MỖI LẦN thêm hoặc sửa lá mới: thứ tự làm, mô hình đề xuất từng phần, danh sách file phải chạm, cách tự chọn mô hình.
---
# Làm lá mới

## Nguyên tắc
- Chữ lá do chủ game viết, giữ nguyên từng chữ. Không tự sửa chữ lá, không tự sửa mô tả.
- Skill nào chủ game ghi rõ thì làm luôn, không hỏi lại những gì đã ghi. Chỉ hỏi chỗ thật sự mơ hồ, và nêu rõ câu hỏi.
- Mỗi phần đề xuất mô hình + nỗ lực. Chủ game chỉ đổi mô hình và duyệt "ok".
- Mô hình đang chạy khác mô hình đã chốt cho phần đó: DỪNG, báo, chờ đổi. Không tự làm "cho nhanh".
- Phần nào đổi xuống mô hình thấp hơn đề xuất thì báo trước khi làm. Chỉ dùng Opus 5.5 high khi phần đó chạm engine (luật).
- Ảnh lá có nền: xin ảnh không nền ngay khi thêm lá (kiểm kênh alpha). Không tự cắt nền.
- Mỗi thay đổi người chơi thấy: 1 dòng NGẮN trong `PENDING_NOTES` (`src/lib/updates.ts`).

## Thứ tự làm (tối ưu: làm từ việc rẻ, ít rủi ro đến việc chạm luật)
1. Dữ liệu lá: `src/lib/catalog.ts` (MONSTERS / SPELLS / FORMS, chữ lá nguyên văn), `power-balance-base.ts`, `i18n.ts` (PAIRS tên Anh), `fx-kinds.ts`, `env-kinds.ts` (hệ), `card-edits.ts` nếu có chip. Chạy `scripts/stamp-cards.ts` qua Vite khi có chỉ số. Lá chưa dùng được: thêm vào `WAITING_CARDS`.
2. Ảnh: `public/art/<id>.jpg` (lá quái/phép). Ảnh có nền: ghi nhận, xin ảnh không nền khi cần cho bảng chọn/hiệu ứng.
3. Hiển thị kỹ năng: `skill-book.ts` (P/A/S/R/NOTE, `slow()`, `buff()`, `joined()`), `skill-icons.ts` / `skill-art-ids.ts` nếu có icon riêng, `icon-briefs.ts` (chữ icon), `field-chips.ts` (nút trên sân, cờ `gate`), `keywords.ts` nếu có keyword.
4. Chức năng đơn giản (chỉ số, buff/debuff một lần, quái không kỹ năng): `duel.ts` theo khuôn lá cùng loại có sẵn.
5. Luật phức tạp (chạm hàng chờ, phản ứng, đổi chỗ, quái nhân bản, nhiều bước): `duel.ts` + `preview.ts` + `reaction-chain.ts`. Đọc skill `flow` nếu có dòng chảy.
6. Kiểm thử: `node scripts/round-rules.mjs` (thêm bài cho luật mới; giữ tổng pass), `npx tsc --noEmit` (7 lỗi cũ là bình thường), chụp Chromium 390×844 và 390×740 trong game rồi gửi chủ game.
7. Ghi `TIEP-TUC.md` (ngắn), `PENDING_NOTES`, commit + push nhánh đang làm.

## Mô hình đề xuất theo phần
| Phần | Mô hình | Nỗ lực |
|---|---|---|
| Dữ liệu lá, chữ, i18n, hệ, chỉ số | Sonnet 5.5 | medium |
| Icon, nút trên sân, hiển thị kỹ năng đơn giản | Sonnet 5.5 | medium |
| Kỹ năng một bước, không chạm hàng chờ (buff, triệu hồi thêm, hồi máu) | Sonnet 5.5 | high |
| Kỹ năng chậm/nhanh/siêu tốc, hàng chờ, phản ứng, quái nhân bản, đổi chỗ | Opus 5.5 | high |
| Luật mới ảnh hưởng nhiều lá (ví dụ Thủ lĩnh cộng dồn theo công hiện tại) | Opus 5.5 | high |

## Danh sách file dễ quên khi thêm lá
- `catalog.ts`, `power-balance-base.ts`, `card-clock.ts` (stamp-cards), `i18n.ts`
- `fx-kinds.ts`, `env-kinds.ts`, `skill-book.ts`, `icon-briefs.ts`, `field-chips.ts`
- `card-edits.ts` (STALE_SKILLS/STALE_ASKS khi đổi chữ cũ), `seal-passives.ts` (lá có skill bị động phải có dòng; thiếu thì round-rules báo lỗi)
- `keywords.ts` nếu có keyword, `updates.ts` (PENDING_NOTES)
- Ảnh: `public/art/<id>.jpg`; ảnh không nền khi cần

## Tự kiểm trước khi báo xong
- Lá mới có mặt trong bảng quái, kho bài, album (đúng số No nếu thuộc album).
- Nhấn từng skill trên bảng quái: tên đúng màu viền, icon đúng lá.
- Lá không nằm trong `WAITING_CARDS` khi đã có luật; có trong đó khi chưa có luật.
