# Việc đang dở + quy tắc (đọc đầu mỗi phiên)

Bản gọn, nạp tự động. Chi tiết từng tính năng đã làm nằm ở `docs/nhat-ky.md` (KHÔNG nạp tự động; cần thì `grep -n "từ khoá" docs/nhat-ky.md`). Ý chưa làm gom từ phiên cũ: `docs/y-chua-lam.md`.

Cách ghi: mỗi việc mới/đang làm chỉ ghi 3 dòng ngắn ở mục "Đang dở" dưới đây. Làm xong và chủ game đã duyệt/áp `main` thì chuyển chi tiết sang `docs/nhat-ky.md`, xoá khỏi đây.

## Đang dở (main: các lá Suối nguồn, Nắng và gió, Tử thần, Rùa, xáo bài, buff chỉ số… đã áp; chi tiết ở nhật ký)

- Hiệp sĩ hộ vệ đổi skill (27/11, nhánh `ccr-9debffc2-yhepws`): LUẬT ĐÃ LÀM (Opus). duel.ts: `isKnight`/`ALL_KNIGHTS`, `knightTutor` + `OATH_STARS` (Lời thề), `SHIELD_KNIGHTS` (Khiên), `canDispatch`/`dispatchKnight` + `swap.knight` trong `pickSwap` (Điều động), bỏ Khiên Ân Huệ (`guardBless` rỗng), Kiếm phòng ngự (`canGuardCover` chỉ còn Hiệp sĩ huyền bí), phí chặn. Chữ lá = chữ chủ game; BALANCE_LOG wave 44; 3 bài thử mới. GIAO DIỆN ĐÃ LÀM 27/11 (Sonnet): play.tsx `monsterAlert` (Hiệp sĩ hộ vệ chớp HỒNG khi quái mình bị đòn tấn công nhắm, theo `reactTone`), chip "Điều động" gọi `dispatchKnight`, rồi bảng Hoán đổi có sẵn (`swapKnightOk`: chỉ hiện quái hợp lệ). Chưa chụp, chưa thử kéo thả/online/điện thoại; icon giữa sân lúc chọn vẫn là lá Hoán đổi; máy chưa dùng Điều động. Luật dự án còn ghi Yêu tinh "chớp cam" (cũ, code đã hồng từ 14/11): chờ chủ game bảo sửa.

- Harpie Lady đổi skill (26/11, nhánh `ccr-9debffc2-yhepws`): LUẬT ĐÃ LÀM (Opus). duel.ts `WILE_CARDS` (4 lá trong SPELL_FORMS của catalog, tranh riêng chủ game gửi 26/11), `castWile`, `wileLand`, `wileReady`, `wileBirds`, `charmCode`, `blessGirls` (Càng xinh đẹp), `beautyTick`, `settleWileCards`, `wilePicks`; Tiến hoá 4 hành động bất kỳ; chữ lá Harpie Lady = chữ chủ game (Càng xinh đẹp ghi rõ lại, Lưu ý thêm câu khoá hành động: CHỜ chủ game duyệt chữ). 7 bài thử mới thay 6 bài cũ.
  Càng xinh đẹp + khoá hành động có NGAY LÚC CHỌN, lá bị nuốt/huỷ vẫn giữ (chủ game 26/11). Claude tự quyết (chờ duyệt): Càng xinh đẹp cộng trước rồi mới trả đòn; lá phép khác của chủ chọn Harpie Lady cũng Càng xinh đẹp nhưng không khoá; Giáp và Vuốt chỉ khi Harpie Lady bị đánh giáp lá cà (không gồm chặn đòn vào người chơi).
  GIAO DIỆN ĐÃ LÀM 26/11 (Sonnet medium): `src/components/game/pick-panel.tsx` (`PickPanel`, CSS `.pk-*` cuối styles.css): bảng chọn 1 lá chung, vuốt ngang, lá chọn glow xanh lá, đếm 20 giây, đối thủ thấy lá úp (chỉ chế độ online). play.tsx: Giảo hoạt (`wileAsk`), Hồi sinh quái thú (`reviveAsk`, kèm nhãn Mộ của bạn / Mộ đối thủ, hết giờ hoặc Huỷ thì lá về tay), `startWileSpell`, `wileTap` (Mê hoặc: quái địch rồi đồng minh rồi Harpie Lady nếu nhiều con). Chụp Chromium 412×915 và 390×740 đạt cả 2 bảng. Chưa thử: kéo thả lá, Mê hoặc nhiều harpie, online (thấy lá úp), điện thoại thật.
  Claude tự quyết giao diện (chờ duyệt): Hồi sinh luôn đặt vào ô trống đầu tiên hàng trước (chưa cho chọn ô); Giáp và Vuốt, Roi điện dùng ngay khi bấm (harpie bị nhắm đã rõ); lá Hồi sinh quái thú đã vào gói/kho/album (bỏ khỏi WAITING_CARDS), nhóm Đa năng; máy (brain.ts) chưa dùng 4 lá lẫn Hồi sinh; Giảo hoạt của máy vẫn chọn ngẫu nhiên.
- Lá Hồi sinh quái thú (26/11, nhánh `ccr-9debffc2-yhepws`): LUẬT ĐÃ LÀM (Opus). duel.ts `REVIVE_CARD`, `reviveReady/Choices/Slots/Code`, `castRevive`, `reviveLand`, `reviveTick`; 4 bài thử đạt. Tranh: `docs/anh-tiep-tuc/hoi-sinh-quai-thu.jpg`; lá đang trong `WAITING_CARDS`.
  Luật chốt: phản ứng đòn đánh thường của quái địch (vào người chơi hoặc quái mình) thì quái trong mộ 2 phe lên ô trống HÀNG TRƯỚC phe mình, ngửa, đủ chỉ số, chạy Khi triệu hồi, lao ra chặn, 2 lượt chung; chậm ở lượt chính 3 lượt chung; lượt đang diễn ra tính là lượt 1; hết hạn về mộ (không tính bị tiêu diệt); quái 5 sao được; lá đứng yên không chọn khi phản ứng.
  Phần lá + bảng chọn quái trong mộ đã làm (xem mục Harpie Lady ở trên); còn: lá chớp khi dùng được (đang như Bẫy thú), máy (brain.ts) chưa dùng.

- Chưa thử bằng mắt/online/máy/điện thoại: hầu hết lá mới (xem `docs/nhat-ky.md`, grep tên lá).
- Nhánh `ccr-9debffc2-yhepws` (Song sát, Thiên sứ vô hình + Khoá 1, Tinh linh đàn hạc…) CHƯA gộp `main`, ghi chú riêng ở nhánh đó.
- Icon skill chờ chủ game vẽ (27/11, đã gửi ảnh tổng hợp): 6 chưa có riêng (three-friends, harp, cupidon-arrow, sands-of-time, card-draw, round-star) + 9 skill đang mượn icon của skill khác (Nắng ấm lên, Hộ thủ, Gặt hồn, Thổi bay, Sinh mệnh mới, Thế thân trên tay, Điều động, Lời thề, Càng xinh đẹp). Vẽ xong: đặt `public/ui/skill/<tên>.webp` (256 px tròn) + thêm tên vào `src/lib/skill-art-ids.ts`; skill nào mượn thì đổi tên icon trong `src/lib/skill-book.ts`. Mê cung PvE (`/maze`): còn bộ bài quái, bảo vật, Cửa hàng PvE, quy tắc 7 ngày.
- Chờ chủ game: bài Phục kích thỉnh thoảng FAIL trong round-rules (cũ).

## Quy tắc làm việc với chủ game (luật dự án ở `AGENTS.project.md`)

- Chủ game chỉ dùng điện thoại Android. Hướng dẫn phải làm được trên điện thoại.
- MÔ HÌNH: mỗi việc có mô hình + nỗ lực đã chốt (luật `duel.ts` = Opus, giao diện/hiệu ứng = Sonnet, ghi chú = thấp). Mỗi lần xin "ok" hoặc sắp làm, viết **tên mô hình + mức nỗ lực** in đậm ở dòng riêng. Mô hình đang chạy khác chốt thì DỪNG, báo, chờ đổi. Xong phần của mô hình đang chạy thì DỪNG, báo "đổi sang mô hình Y để làm phần Z". Mỗi kế hoạch phải có đề xuất mô hình + nỗ lực, không chờ bị hỏi.
- KẾ HOẠCH NGẮN: 3 mục (việc vừa làm, hiện trạng, việc sắp làm), dưới 4 dòng mỗi việc, không bảng dài. Ghi vào đây ngay khi bắt đầu.
- CHỜ "OK": mọi chỉnh sửa, kể cả nhỏ, kể cả góp ý vừa gửi: ghi, đưa kế hoạch, hỏi, chờ "ok" rồi mới sửa. Giao quyền chọn hướng thì ĐỀ XUẤT và báo lại, chưa gắn code.
- LÀM HÀNG LOẠT: chỉ làm MỘT mẫu, gửi ảnh, chờ "ok" mới chạy cả lô. Mẫu thử làm ở scratchpad.
- SỬA ĐÚNG PHẦN ĐƯỢC NÊU: phần chủ game đã hài lòng giữ nguyên; không sửa lan. Trước khi sửa ảnh/CSS/hàm dùng chung, liệt kê mọi chỗ dùng; nếu phải đụng chỗ khác thì làm bản riêng. Tự chọn cách cắt/làm ảnh (độ sáng thành trong suốt, làm tối mép, bỏ glow…) thì dừng, nói cách làm, chờ ok TRƯỚC khi áp vào game.
- SỬA THEO NHÓM: chủ game báo một chỗ xấu thì tìm mọi trường hợp cùng đặc điểm, đưa cách sửa chung (vẫn chờ "ok"), không vá riêng.
- LUẬT LÁ: code phép/skill đã xây không đụng; nhờ về icon/dòng thì chỉ sửa phần hiển thị (reaction-chain, reaction-line, play). Chưa chắc cơ chế lá chạy ngay hay chờ thì HỎI.
- TỰ KIỂM TRƯỚC KHI KẾT LUẬN "CHƯA CÓ": lá mới nhắc cơ chế (né đòn, sát thương chuẩn, hồi máu, Linh hoạt…) thì GREP duel.ts/catalog/keywords trước. Không hỏi điều ảnh/code đã trả lời được; chỉ hỏi chỗ thật sự mơ hồ.
- GIAO DIỆN: đọc kỹ tài nguyên gốc, chốt bức tranh chung và HỎI hết khâu thiết kế (vị trí, kích thước, lúc hiện/ẩn, cách huỷ, áp chỗ nào) trước khi làm; không làm bản tạm để thử. Chủ game đưa ảnh khung/nút/ô/glow thì CẮT NGUYÊN rồi gắn (skill `giao-dien`), không vẽ lại bằng CSS; muốn dựng bằng code phải hỏi. Ảnh của tab nào thì làm trên tab đó, nói rõ "tôi sửa tab X, ảnh Y" khi có thể nhầm. KHÔNG cắt/làm mờ nền ảnh khi chủ game chưa duyệt.
- ẢNH LÁ MỚI: chủ game gửi ảnh có nền thì tự xin ảnh không nền (cho dung hợp, hiệu ứng); đừng `.convert('RGB')` ảnh RGBA; không tự cắt nền. Ảnh chủ game gửi nền đen/khung có viền: cắt sát theo pixel sáng trước khi đặt vào `public/ui`.
- VFX/VIDEO: đọc `.claude/skills/vfx/SKILL.md` (và `hoc-tu-video`, `be-sang` nếu liên quan). "Chèn hiệu ứng" = thay CẢ hình lẫn âm của video. Xem kỹ video bằng số liệu và chụp cận, dựng game cạnh khung video để so; không làm theo trí nhớ.
- DÒNG CHẢY (flow): đọc `.claude/skills/flow/SKILL.md` trước. Dòng không đi thẳng, phải uốn lượn, được đi đè qua lá, nhưng đường đã cong thì không uốn thêm; góc chạm lá 40°–70°; icon/dòng đặt sau không được gối lên icon/dòng đặt trước; dòng phản về phải vòng, né đường tới. Làm tiếp trên bản mới nhất đã xong, không mở ảnh/bản cũ mà không nói là cũ. Mỗi lần chỉ làm một trường hợp nhỏ, gửi một ảnh, chờ chủ game xem rồi sang trường hợp kế. Hình vẽ tay của chủ game: làm đúng lời chủ game nói lần cuối về hình đó, sửa đúng phần được vẽ, cách nhanh và sát lời nhất.
- Đổi chỉ số đơn giản: tự xếp Tăng/Giảm/Thay đổi lối chơi, sửa số trong mô tả, ghi `BALANCE_LOG` (src/lib/power-balance.ts), chạy `scripts/stamp-cards.ts` qua Vite (cần `/tmp/alias-register.mjs` + `/tmp/alias-hooks.mjs`, viết lại mỗi phiên: loader đổi `@/` thành `src/`).
- Đổi chữ mô tả: thêm dòng vào `STALE_SKILLS` / `STALE_ASKS` (src/lib/card-edits.ts). Mô tả trên lá là cho người chơi đọc, không tự sửa chữ.
- Mỗi thay đổi người chơi thấy: thêm một dòng NGẮN vào `PENDING_NOTES` (src/lib/updates.ts).
- Không nhắc điểm mạnh, điểm yếu, khắc chế (đang ẩn).
- Kết thúc việc: xong phần dành cho mô hình đang chạy thì DỪNG, báo, chờ chủ game duyệt mô hình + nỗ lực của phần kế; xong thì không tự sang bước kế.
- Ảnh/video: chủ game chỉ muốn thứ đã nói; không tự thêm cơ chế.
- Chủ game đánh số "1. 2. 3. 6." thì ô chat tự đổi 6 thành 4; khi trích lại viết "Câu 6:".

## Cách thử

- Test: `node scripts/round-rules.mjs` (bài Phục kích chập chờn là cũ), `tsc` có 7 lỗi cũ, 9 bài lỗi sẵn không liên quan lá bài.
- Chạy thử luật: dùng `createServer` của Vite (`ssrLoadModule('/src/lib/duel.ts')`), Node thuần không hiểu `@/`.
- Dev: `npm ci` nếu thiếu node_modules, `npm run dev` (cổng 8080, KHÔNG `pkill -f vite`). Chụp Chromium 412×915: trận Test dựng bằng `testGrant` rồi nạp sessionStorage `clash-test-duel` + `clash-mode`=test; Vs Máy thật qua `/modes`.
- Đơn vị CSS: dùng `var(--cqw)`, `var(--cqh)`, `var(--cqmin)`, KHÔNG viết `cqw` trần (Safari cũ). Phần tử nhân bản ra ngoài mà dùng cqw phải bọc trong container.
- Safari không phát WebM alpha: dùng bản MP4 nền đen (`flatFx`/`alphaSrc` trong preload.ts).
