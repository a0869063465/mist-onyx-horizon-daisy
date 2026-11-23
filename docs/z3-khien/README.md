# Z3: Lá chắn gộp 1 loại + video khiên (23/11, CHƯA LÀM CODE, để tài khoản khác làm tiếp)

Chủ game dừng giữa chừng. Chưa sửa dòng code nào (git status sạch lúc dừng). Chỉ có nghiên cứu + câu trả lời chốt dưới đây. LƯU Ý: tên "Z3" cũng đang dùng cho mục khung mô tả quái trong `docs/y-chua-lam.md`; đây là việc KHÁC.

## Yêu cầu của chủ game (nguyên ý)
Bây giờ chỉ dùng 1 loại lá chắn (bỏ khiên vật lý / khiên phép riêng), chặn cả sát thương vật lý, phép và chuẩn. Sát thương hỗn hợp chặn hết, nhiều đợt cũng chặn hết. Khiên chỉ tồn tại 2 lượt rồi mất. 3 video chèn (trong thư mục này):
- `buffkhien.mp4`: khiên hình thành (lúc nhận khiên).
- `dokhien.mp4`: khiên hình thành rồi có nháy sáng lúc bị đánh.
- `matkhien.mp4`: viền khiên tan biến.
Ghép PHẦN SAU của `dokhien` và khoảng 0,3 s ĐẦU của `matkhien` (BỎ ÂM phần matkhien) thành 1 video: khiên phát hiện tác dụng lúc bị gây sát thương rồi biến mất. Canh sao đòn đánh hay skill vừa tới thì ĐÚNG LÚC âm khiên vang lên.

## Câu trả lời đã chốt (chủ game 23/11)
1. Lá chắn mới thay HẾT khiên hiện có (Hộ thần của Cơn thịnh nộ của hải vương, Thiên thần hộ mệnh của Nàng tiên giữ khoá, Khiên Ân Huệ, Khiên toàn năng của Hiệp sĩ huyền bí). Khiên "vĩnh viễn" cũng thành lá chắn 2 lượt.
2. Một lá chắn chặn TRỌN MỘT lần dính đòn (đòn đánh, skill hoặc phép; mọi loại sát thương gồm chuẩn và hỗn hợp; nhiều đợt cũng chặn hết cả đòn), rồi biến mất ngay. KHÔNG chặn mọi sát thương trong 2 lượt. Không bị đánh thì tự mất sau 2 lượt.
3. "2 lượt" = 2 lượt chung, tính từ lúc nhận khiên.
4. Cắt video: dokhien từ ~1,0 s (ngay trước nháy sáng, nháy sáng nhất ~1,1–1,5 s) tới ~1,7 s, nối 0,3 s đầu matkhien (tắt âm). Âm khiên vang lúc nháy sáng. Chủ game xác nhận "đúng".
5. Lúc khiên còn đứng: dùng buffkhien dựng khiên, lặp đoạn viền sáng cuối cho tới khi khiên mất (luật buff tạm giữ hiệu ứng liên tục). Chủ game chưa phản đối.
6. Chữ mô tả lá: KHÔNG tự sửa; sửa code xong thì đưa mô tả cũ để chủ game viết mới.
7. 3 lá Hiệp sĩ (hộ vệ, của hậu, của vua) chủ game "sẽ sửa sau, tạm bỏ qua": không đụng chữ và phần khiên của chúng. Lời chúc kỵ sĩ của Hiệp sĩ hộ vệ ("ta" = chính lá đó nhận) chưa rõ loại khiên, bỏ qua.

## Phân công mô hình (chủ game đã chốt)
- Luật (duel.ts): Opus 5.5 high. Hiệu ứng + ghép video + canh âm: Sonnet 5.5 medium. Không làm sai mô hình.

## Đo video (đã làm)
- 3 file 960x960, 24 fps, 3,04 s, nền xanh lá (màu giữ chỗ lá), có âm AAC. Đỉnh âm: buffkhien -9,2 dB, dokhien -9,6 dB, matkhien -19,9 dB (nhỏ, cần nâng).
- buffkhien: viền cam hình thành ~0,2–0,8 s rồi đứng yên sáng tới hết (âm dâng dần, nổi ~2,3 s).
- dokhien: hình thành như trên, nháy sáng toàn lá ~1,0–1,5 s (mặt lá trắng vàng), rồi về viền đứng yên. Âm khiên to nằm quanh lúc nháy sáng (RMS lên ~-19 dB từ ~1,3 s).
- matkhien: 2 khung đầu (0–0,3 s) viền cam còn sáng rồi TẮT HẲN, phần còn lại là lá trơn. Âm đầu video nhỏ dần.
- Cách làm video theo `.claude/skills/vfx/SKILL.md` (alpha = 3×max(r,g,b) sau khi trừ nền xanh lá; lá xanh là màu giữ chỗ nên khoét bằng lá thật như `CardBurn`/`CardShatter`, hoặc đo vị trí lá: lá nằm khoảng x 25–75%, y 9–80% khung). Âm cắt cùng mốc với hình.

## Bản đồ code (duel.ts, số dòng ở HEAD f7e956b, có thể lệch)
- Trường quái: `ward?: "phys"|"spell"` (98), `wardStay` (99), `oath {phys,spell}` (102, khiên vĩnh viễn), `oathBack`, `oathShot` (Hiệp sĩ hộ vệ, KHÔNG đụng).
- Chặn: `soak()` (~2713, dùng sau `hurt`, trong `takePhysicalCore` ~2642 và `damageSpell` ~2727), `swallowOath()` (~2053, gọi 2649/2731/3955/4035/4096/5625), `spellLanded` (~2756, đọc `ward === "spell"`), gói sát thương `pack` (~5611–5626 hàm vỡ khiên theo gói phys/spell/tru), `wardTag` ("(Khiên vật lý đã vỡ)").
- Nơi cấp khiên: Thiên thần hộ mệnh (~9453: `ward: kind`), Hộ thần (~1988 `oath {phys,spell}` cho `con-thinh-no-cua-hai-vuong`), `oath` mặc định các hiệp sĩ (~2012–2044), Khiên toàn năng của Hiệp sĩ huyền bí.
- Hướng làm: gom `ward`/`oath` thành MỘT cờ lá chắn kèm bộ đếm lượt (đếm trong `endTurnCore`/`finishRound`); khi một đòn (sau khi biết mục tiêu trúng) chạm quái có lá chắn thì sát thương của CẢ đòn (mọi loại, mọi đợt) về 0 và lá chắn mất; ghi sự kiện `Duel.shield` {id, uid} cho hiệu ứng; hết 2 lượt thì mất (hiệu ứng tan, không nháy). Chú ý `bareUids` (Đòn cuối cùng: bỏ khiên), Huỷ diệt/Bẫy thú (`slay`: giết thẳng, bỏ khiên), Hấp thụ cướp máu tối đa, sát thương chuẩn (`tru`), Chiến binh rồng (nợ `debt`), `spendPartners`.
- Hiển thị: `.ward` trên lá (play.tsx/CSS), thông báo "đã vỡ", bảng quái, `skill-book.ts` (`SkillEntry.buff`), `icon-briefs.ts`, `reaction-chain.ts`; PENDING_NOTES một dòng; round-rules thêm bài (chặn hỗn hợp, nhiều đợt, chuẩn, hết 2 lượt).

## Việc phải làm theo thứ tự
1. (Opus high) Luật như trên + bài round-rules + chạy tự đấu không kẹt.
2. (Sonnet medium) Ghép video `khien-do.webm` + `khien-mat` thành một clip, âm khiên (nâng +dB, đỉnh ~-3 dB, cue mới trong `sfx.ts`), `buffkhien` thành clip dựng khiên + vòng lặp viền sáng đứng yên. Canh: âm khiên vang đúng lúc đòn/skill chạm (xem K1 `ramHit` trong arena-fx, `fxAt`, `ROUSE_MS`).
3. Đưa mô tả cũ các lá có khiên cho chủ game viết lại (không tự sửa chữ).
