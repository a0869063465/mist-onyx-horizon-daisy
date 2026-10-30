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
1. Tia tổng + BẤT KỲ một nhánh = một dòng liền, mượt, uốn tự nhiên, không gãy góc. Mẫu "liền mạch" là ảnh chuẩn: nhánh Rồng con rời điểm tách thành một vòng cung đẹp ra ngoài lá trước. KHÔNG ép nhánh rời đi dọc hướng tia tổng nếu làm nhánh bị bẻ khúc (đã thử 29/10: nhánh Rồng con đi lên trước rồi mới vòng ra, chủ game: "ảnh chuẩn dòng sau không bị gãy khúc như thế này, vòng uốn cong rất đẹp"). Không có cơ chế ép hướng; muốn tia tổng nối mượt thì đặt điểm tách trên dòng thẳng với kẻ ra đòn (như chuẩn), các nhánh khác vòng cung như nhánh Rồng con.
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
- Kiểu mới (`columnPair`) dùng cho MỌI skill/phép trúng 2–3 mục tiêu, có hay không có 2 lá cùng cột (chủ game 29/10: "chỉ khi skill bắn vào từ 4 quái trở lên mới dùng kiểu cũ"). Từ 4 trở lên dùng nhánh cũ (`fanRoutes` chung).
- Nhánh được đi xuyên qua lá. Không len qua khe giữa 2 lá (chủ game 29/10: "đừng làm cái kiểu lòn đường kẻ đó nữa"). Nhánh vào quái hàng sau không có lá mục tiêu đứng trước: một vòng cung mềm đè qua hàng trước, vào mép gần lệch giữa 0,15 bề ngang về phía điểm tách, xiên ~55°.
- Các nhánh không gối lên nhau: nhánh vào lá ngay trên điểm tách nghiêng về phía không có nhánh khác.
- Icon chặn từng nhánh đứng ở 70% đường nhánh tính từ điểm tách (`COVER_ALONG`); quái chặn trượt tới đó, được đè lá khác (chủ game chọn B 29/10).

## Dòng phản về / dòng đánh trả (chủ game chốt khi sửa Lá chắn phản đòn 29/10; áp cho Phục kích 30/10)
Dùng cho mọi dòng đi ngược về kẻ ra đòn: skill bị phản (Lá chắn phản đòn, Giáp cơ khí), dòng hồng Gương phòng hộ / Vòng nguyền rủa ác ma về kẻ đánh, dòng đỏ đồng minh Phục kích đánh trả kẻ dùng skill, và phép/skill phản đòn thêm sau.
1. KHÔNG đi thẳng vào, KHÔNG lòn dưới icon skill/đòn đứng trước lá kẻ ra đòn. Vòng sang một bên, né đường tới.
2. Đường tới và đường về chạy ngược chiều, mỗi đường vòng về bên trái của chính nó: đường về cung rộng (`arc` = swing × 1,1), đường tới cong nhẹ ngược lại (swing × 0,35). Bên vòng: bên rộng hơn, về phía giữa bàn (`swingOf`); có icon nằm gần đường thì vòng về phía xa icon đó (`clearOf`).
3. Đáp vào CẠNH BÊN lá đích (phía nó vòng tới / phía đồng minh), không đáp giữa mép gần dưới icon.
4. Bỏ uốn lượn, đầu không nhỏ. Dòng sát thương (đỏ, skill bị phản): đuôi to như skill sát thương. Dòng hồng không sát thương (Gương, Vòng nguyền): cung còn 1/3, đuôi loe một nửa.
5. Đường về chờ đường tới chạm icon rồi mới chạy (`after`).
6. Dòng hồng tới đồng minh được chọn (Phục kích, chủ game chốt 30/10): KHÔNG đáp giữa mép gần lá, vì đó là chỗ icon tấn công của đồng minh (gối lên nhau). Đáp vào CẠNH BÊN lá phía icon phép, cách mép gần 1/3 nửa lá, vào xiên ~55°; có lá đứng sát bên phía đó thì vào GÓC GẦN, chéo 45° (`besideFree` trong play.tsx). Áp cho mọi phép sau này có dòng tới đồng minh mà đồng minh hiện icon tấn công ở mép gần.
Code: reaction-line.tsx, vòng dựng `backs`/`arcs` và đoạn "The way back lands on the side".

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
