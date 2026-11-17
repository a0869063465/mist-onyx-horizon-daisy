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

## Bài học cách làm (Q)
- **Q0** (từ Ví dụ 1) Cách ĐỌC ví dụ của sếp: cụm chữ trong dấu ngoặc kép, kèm (màu) ngay sau = cụm đó tô màu đó. Chữ không có (màu) thì không tô.
- **Q1** (Ví dụ 1) Bố cục skill: mỗi nhãn một dòng, theo thứ tự "Thời điểm kích hoạt:", "Nội dung:", "Nội tại:". Đập phá có đủ ba. Skill thiếu loại nào thì bỏ nhãn đó (CHƯA chắc, hỏi sếp lần đầu gặp).
- **Q2** (Ví dụ 1) Dấu ":" và chữ nhãn đứng trước nó đều gạch chân.
- **Q3** (Ví dụ 1) Tô màu theo vai trò của cụm: thời điểm kích hoạt = vàng (mỗi thời điểm một cụm riêng, "Khi phát động tấn công" và "Khi lao ra chặn đòn"); mana = xanh lam, gồm cả số ("Tiêu hao 1 mana"); đối tượng đòn đánh = đỏ ("Các đòn đánh thường"); chỉ số kèm số = cam ("1 công"); nhãn "Nội tại" = tím (CHƯA chắc: nhãn hay cả dòng). Từ nối như "tăng vĩnh viễn" không tô.

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
Mã rút ra: Q0, Q1, Q2, Q3.
Lệch với tài liệu cũ (chờ sếp nói): `docs/luat-la-bai.md` mục 9 ghi vàng = thủ, hồng = điều kiện phát động (Thế thân), "tăng" của Đập phá = xanh lá; ví dụ này dùng vàng cho thời điểm kích hoạt và không tô "tăng". Chữ hiện trong `catalog.ts` (dòng "Đòn đánh thường chủ động… Tiêu hao 1 mana. Những lần bị động thì không tốn.") khác hẳn và KHÔNG được sửa khi chưa có lệnh.
