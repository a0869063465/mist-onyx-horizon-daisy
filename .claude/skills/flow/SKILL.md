---
name: flow
description: Vẽ hoặc sửa dòng chảy (flow) của skill/phép nhiều mục tiêu trong Clash of the Beasts. Dùng mỗi khi chủ game nhắc tới flow, dòng chảy, nhánh, điểm tách, điểm chạm.
---
# Dòng chảy skill/phép nhiều mục tiêu

## Chuẩn (chủ game chốt 29/10): chuan-2-quai-hang-doc.png
Máy chém hàng trước + Rồng con hàng sau, cùng cột.
- Điểm tách nằm NGAY TRÊN dòng vào một mục tiêu, cách hàng như cũ (FORK_SHARE 0,25), không bó ở giữa sân.
- Dòng vào mục tiêu đó đi tiếp lên mép gần, lệch giữa một chút.
- Dòng kia dùng chung nửa đầu (tia tổng), nửa sau tách ra thành MỘT vòng cung mềm ra ngoài lá hàng trước, vào chéo góc mép gần lá hàng sau.

## Luật bắt buộc
1. Tia tổng + BẤT KỲ một nhánh = một dòng liền, mượt, uốn tự nhiên. Ở điểm tách, nhánh rời đi theo đúng hướng tia tổng đang tới rồi mới cong dần ra. Không gãy góc.
2. Không đoạn thẳng. Không chạy dọc làn, dọc khe, dọc mép bàn. Không uốn thừa: một vòng cung mềm; đường rất dài mới cho chữ S nhẹ.
3. Góc chạm 40°–70° so với mép lá (nhắm ~55°), không dưới 40°, không vuông 90°. Chạm góc lá được (vào chéo). Không chạm cạnh trong khe giữa 2 lá.
4. Được đi đè qua lá, ô sao, xấp bài. Nhánh không cắt nhau, nhánh ngoài ôm nhánh trong. Không ra ngoài mép bàn.
5. Chạm mép lá thì tách vào hào (boxArms trong flow-canvas.tsx, giữ nguyên). Vòng viên máu người chơi như cũ.

## Giữ nguyên, không đụng
Dòng một mục tiêu (vào giữa mép lá), dòng phản về, dòng hồng Vòng nguyền rủa ác ma / Gương phòng hộ. Trường hợp đã ok:
- 6 quái: Kazura / Ma đạo sĩ đi chung nửa đầu với nhánh hàng trước, vòng rộng, vào xiên giữa cạnh ngoài.
- Lá hàng trước chạm chéo góc mép gần (bản A).
- Nét vẽ tay của chủ game cho lá giữa hàng sau (DRAWN).
- 2 quái hàng dọc (chuẩn).

## Cách làm với chủ game
- Mỗi lần 1 trường hợp, gửi đúng 1 ảnh, chờ xem. Chưa rõ thì đưa 2–3 cách (A/B/C).
- Chủ game báo chỗ xấu thì sửa cả nhóm cùng đặc điểm, không vá riêng.
- Không mở ảnh cũ mà không ghi rõ là ảnh cũ (chủ game thấy mọi ảnh Claude mở).
- Lệnh bị từ chối vẫn có thể đã chạy: kiểm tra git status / git log, lọt thì hoàn lại.
- Mỗi thay đổi người chơi thấy: 1 dòng PENDING_NOTES; ghi góp ý vào TIEP-TUC.md.

## Code
- src/lib/fan-plan.ts: fanRoutes (nhánh), columnPair (chuẩn cùng cột), wayOf, drawnRoute. Toạ độ: % bàn ra hộp 90 × 160 (x·0,9, y·1,6); đường = chuỗi Bézier bậc 3.
- src/routes/play.tsx: forkFor (điểm tách), FORK_SHARE.
- src/components/game/reaction-line.tsx: tia tổng (key `<id>|fork`) và nhánh.
- src/components/game/flow-canvas.tsx: vẽ dải sáng, hào, đập nước.

## Thử
1. npm run dev (cổng 8080; curl ra 000 thì chạy lại).
2. node .claude/skills/flow/scripts/scenes.mjs <thư mục> → <cảnh>-0.json, <cảnh>-1.json.
3. VH=917 node .claude/skills/flow/scripts/run.mjs <thư mục>/<cảnh>-0.json <ra> "swap|<thư mục>/<cảnh>-1.json" "wait|3800" "shot|a"
4. Cắt phía đỏ: PIL crop((0,230,824,1000)). Chạy 1 lần một lúc (chạy song song thì bảng Bài khởi đầu che bàn).
5. tsc --noEmit có sẵn 7 lỗi.
