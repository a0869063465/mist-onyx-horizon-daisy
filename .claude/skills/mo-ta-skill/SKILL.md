---
name: mo-ta-skill
description: Viết hoặc sửa chữ mô tả kỹ năng, phép của lá bài Clash of the Beasts theo đúng lối viết của chủ game. Dùng mỗi khi chủ game nhờ viết, soạn nháp, so sánh hoặc đưa ví dụ mô tả skill/phép, hoặc đang dạy/sửa cách làm skill này. Skill này được chủ game đào tạo dần.
---
# Mô tả skill (đang được chủ game đào tạo)

## Hệ đánh số (chủ game chốt 17/11)
- **W0, W1, W2…** = luật của công ty (lời sếp dạy, sếp chưa hài lòng). Mỗi W ghi NGUYÊN VĂN lời chủ game + ngày + một dòng rút gọn. Số bắt đầu từ 0, số kế tiếp cho luật mới, không đánh lại số cũ.
- **Q0, Q1, Q2…** = bài học CÁCH LÀM của Claude, rút ra từ ví dụ chủ game đưa. Chỉ ghi khi liên quan trực tiếp đến cách làm. Mỗi Q ghi ví dụ gốc + một dòng rút gọn.
- Claude TỰ đánh số, không chờ chủ game bảo. Sau mỗi tin nhắn của chủ game trong lúc đào tạo, tự hỏi: (a) sếp đang chưa hài lòng / sửa / dạy luật? → thêm W; (b) sếp đưa ví dụ mà mình học được điều về cách làm? → thêm Q; (c) chỉ là yêu cầu thường → không đánh số.
- Mỗi lần thêm mã, báo chủ game 1 dòng: "Ghi W2: …" hoặc "Ghi Q1: …", để sếp sửa nếu hiểu sai. Gọi đúng mã khi nhắc ("vi phạm W3", "theo Q1").
- Không tự điền luật mẫu từ tài liệu cũ rồi gán mã. W chỉ đến từ lời chủ game.

## Luật của công ty (W)
- **W0** (17/11) Chủ game: "W0 quy tắc đầu tiên, bạn đánh dấu các quy tắc trong mô tả skill là Q0 đến 1,2,3,4... W là các quy tắc lỗi, hoặc quy tắc cách làm, nói dễ hiểu là Q là cách bạn làm việc, W là luật của công ty."
  Rút gọn: quy tắc trong skill này đánh mã, W = luật công ty, Q = cách Claude làm việc, số từ 0.
- **W1** (17/11) Chủ game: "W0 chính là dòng chat đó luôn, bạn phải tự đánh số thông minh cái bạn nhận ra là mình (sếp của bạn) chưa hài lòng, và dạy bạn. Q là cái mình ví dụ, bạn nhận ra và học được liên quan trực tiếp đến cách làm."
  Rút gọn: W0 là chính dòng chat của sếp; Claude tự nhận ra sếp chưa hài lòng/đang dạy để đánh W; Q rút từ ví dụ của sếp, chỉ phần liên quan trực tiếp đến cách làm.
- **W2** (17/11) Chủ game: "C1 đọc kỹ lại đi (đây là giọng không hài lòng đấy), " và () có bao gồm thời điểm kích hoạt không. C2 (tím) trở về trước, vậy là có phải cả dòng không"
  Rút gọn: ĐỌC KỸ ví dụ trước khi hỏi. Điều gì tự suy được từ chính ví dụ (dấu ngoặc kép mở, (màu) đóng bao đúng đoạn nào) thì không hỏi sếp. "Đọc kỹ lại đi" = sếp chưa hài lòng, đúng là hiệu lệnh đánh W.
- **W3** (17/11) Chủ game: "Bạn thấy (đây là câu cú mình lại phải sửa lại cho bạn) quy tắc trước không. () là 1 màu, tức là trước () có gì. Có duy nhất từ Nội tại: đúng không. Vậy thì làm sao."
  Rút gọn: lặp lại lỗi W2: mình lại kết thúc bằng câu hỏi mà ví dụ đã trả lời. Trước khi hỏi, thử trả lời bằng chính ví dụ; trả lời được thì KHÔNG hỏi, chỉ nêu kết luận. (màu) là MỘT màu cho mọi thứ đứng trước nó (tính từ ngoặc kép mở, hoặc đầu dòng nếu không có ngoặc). Trước (tím) chỉ có "Nội tại:" nên tím chỉ là "Nội tại:".

## Bài học cách làm (Q)
- **Q0** (Ví dụ 1, sửa theo W2) Cách ĐỌC ví dụ của sếp: dấu ngoặc kép MỞ rồi (màu) ĐÓNG bao đúng cụm được tô màu đó; chữ ngoài cặp đó không tô. Nhãn "Thời điểm kích hoạt" đứng ngoài ngoặc nên KHÔNG tô, chỉ "Khi phát động tấn công" và "Khi lao ra chặn đòn" tô vàng. (màu) mà không có ngoặc kép mở thì tô MỘT màu cho mọi thứ đứng trước nó tới đầu dòng; trước (tím) chỉ có "Nội tại:" nên chỉ "Nội tại:" tím (không phải cả dòng).
- **Q1** (Ví dụ 1, sếp xác nhận) Bố cục skill: mỗi nhãn một dòng, thứ tự "Thời điểm kích hoạt:", "Nội dung:", "Nội tại:". Skill không có loại nào thì không ghi nhãn đó.
- **Q2** (Ví dụ 1) Dấu ":" và chữ nhãn đứng trước nó đều gạch chân (nhãn "Nội tại:" vừa tím vừa gạch chân).
- **Q3** (Ví dụ 1) Tô màu theo vai trò của cụm: từng thời điểm kích hoạt = vàng; mana = xanh lam gồm cả số ("Tiêu hao 1 mana"); đối tượng đòn đánh = đỏ ("Các đòn đánh thường"); chỉ số kèm số = cam ("1 công"). Từ nối như "tăng vĩnh viễn" không tô.

## Nền dự án (có sẵn từ AGENTS.project.md và docs/luat-la-bai.md, không mang mã W/Q)
Đọc `docs/luat-la-bai.md` mục 2 (khuôn chữ lá) và mục 5 (quy tắc viết) trước khi viết.
- Mô tả là của chủ game, cho người chơi đọc. KHÔNG tự sửa chữ trong `catalog.ts`; chỉ soạn NHÁP trong tin nhắn, chủ game duyệt rồi mới đưa vào code. Đổi chữ kỹ năng thật (đổi luật) thì sửa code trước, rồi đưa chữ cũ cho chủ game viết chữ mới.
- Giữ khuôn dữ liệu: tiêu đề đậm `__**Tên**__.`, "N lượt", "N sát thương phép", "N mana" / "Tiêu hao N mana", tên kỹ năng khớp `SKILL_BOOK`. Thêm chữ có số thì kiểm lại các số game đọc từ chữ.
- Phòng ngự là cả thủ và thủ phép; nói rõ khi chỉ một trong hai. Không nhắc điểm mạnh, điểm yếu, khắc chế.
- Tên quái, tên skill ghi đủ như trong game. Chữ trên lá viết tiếng Việt.
- Chưa rõ 100% cơ chế thì HỎI, không tự thêm cơ chế hay cách hiểu. Quái 5 sao không có cơ chế mới nếu chủ game không nói.

## Quy trình nền khi được nhờ viết mô tả
1. Đọc kỹ code/luật của kỹ năng (không đoán), xác định từng phần.
2. Đối chiếu các mục W và Q bên trên, và ví dụ bên dưới: bắt chước thứ tự câu, từ vựng, độ dài, cách chia dòng của ví dụ gần nhất.
3. Soạn nháp ngắn, kèm 1 dòng nêu chỗ không chắc. Chờ chủ game sửa.
4. Khi chủ game sửa nháp: chép NGUYÊN VĂN bản sửa vào mục ví dụ, rồi áp quy tắc đánh số ở trên.

## Ví dụ chủ game đã duyệt (thêm ở cuối, mới dưới cũ)
Mẫu một mục:
```
### <Tên quái / phép> — <Tên skill> (<ngày>)
Chữ chủ game viết: <nguyên văn>
Mã rút ra: <Wn / Qn, nếu có>
```
### Khổng lồ 1 mắt — Đập phá (17/11) — Ví dụ 1
Chữ chủ game viết (nguyên văn, kể cả dấu ngoặc):
```
Đập phá của khổng lồ 1 mắt
Thời điểm kích hoạt: "Khi phát động tấn công (vàng) và "Khi lao ra chặn đòn (vàng)
Nội dung: "Tiêu hao 1 mana (xanh lam)
Nội tại: (tím) "Các đòn đánh thường (đỏ) tăng vĩnh viễn "1 công (cam).
Dấu : và nội dung trước nó định dạng gạch chân.
```
Mã rút ra: Q0, Q1, Q2, Q3 (đã sửa lại sau W2).
Lệch với tài liệu cũ: `docs/luat-la-bai.md` mục 9 ghi vàng = thủ, hồng = điều kiện phát động (Thế thân), "tăng" của Đập phá = xanh lá; ví dụ này tô vàng "Khi phát động tấn công"/"Khi lao ra chặn đòn" và không tô "tăng". Chưa sửa tài liệu, chờ lệnh. Chữ hiện trong `catalog.ts` (dòng "Đòn đánh thường chủ động… Tiêu hao 1 mana. Những lần bị động thì không tốn.") khác hẳn và KHÔNG được sửa khi chưa có lệnh.
