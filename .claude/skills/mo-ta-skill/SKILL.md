---
name: mo-ta-skill
description: Viết hoặc sửa chữ mô tả kỹ năng, phép của lá bài Clash of the Beasts theo đúng lối viết của chủ game. Dùng mỗi khi chủ game nhờ viết, soạn nháp, so sánh hoặc đưa ví dụ mô tả skill/phép. Skill này được chủ game đào tạo dần bằng ví dụ.
---
# Mô tả skill (đang được chủ game đào tạo bằng ví dụ)

Đọc `docs/luat-la-bai.md` mục 2 (khuôn chữ lá) và mục 5 (quy tắc viết) trước khi viết.

## Đánh số quy tắc (chủ game 17/11)
- **W0, W1, W2…** = luật của công ty (chủ game): cái gì đúng/sai về chữ mô tả. Số bắt đầu từ 0, thêm luật mới thì lấy số kế tiếp, không đánh lại số cũ.
- **Q0, Q1, Q2…** = cách Claude làm việc khi viết mô tả.
- Khi báo cáo hoặc chủ game nhắc, gọi đúng mã (ví dụ "vi phạm W3", "bước Q1").

## Luật của công ty (W)
- **W0** Mô tả là của chủ game, cho người chơi đọc. KHÔNG tự sửa chữ trong `catalog.ts`. Chỉ soạn NHÁP trong tin nhắn, chủ game duyệt rồi mới đưa vào code.
- **W1** Giữ khuôn dữ liệu: tiêu đề đậm `__**Tên**__.`, "N lượt", "N sát thương phép", "N mana" / "Tiêu hao N mana", tên kỹ năng khớp `SKILL_BOOK`. Thêm chữ có số thì kiểm lại các số game đọc từ chữ.
- **W2** Phòng ngự là cả thủ và thủ phép; nói rõ khi chỉ một trong hai.
- **W3** Không nhắc điểm mạnh, điểm yếu, khắc chế.
- **W4** Tên quái, tên skill ghi đủ như trong game. Chữ trên lá viết tiếng Việt.
- **W5** Chưa rõ 100% cơ chế thì HỎI, không tự thêm cơ chế hay cách hiểu. Quái 5 sao không có cơ chế mới nếu chủ game không nói.
- **W6** Đổi chữ của kỹ năng thật (đổi luật) thì sửa code trước, rồi đưa chữ cũ cho chủ game viết chữ mới.

## Cách làm của Claude (Q)
- **Q0** Đọc kỹ code/luật của kỹ năng (không đoán), xác định từng phần của nó.
- **Q1** Đối chiếu mục "Ví dụ chủ game đã duyệt" bên dưới: bắt chước thứ tự câu, từ vựng, độ dài, cách chia dòng của các ví dụ gần nhất.
- **Q2** Soạn nháp ngắn, gửi kèm 1 dòng nêu chỗ không chắc, ghi rõ nháp theo mã W nào. Chờ chủ game sửa.
- **Q3** Khi chủ game sửa nháp, so bản sửa với nháp, chép NGUYÊN VĂN bản sửa vào mục ví dụ; nếu thấy quy tắc lặp lại thì hỏi chủ game rồi thêm thành W mới (số kế tiếp).

## Luật mới rút ra từ ví dụ (tiếp số W, chủ game chưa dạy gì, để trống)
- (chưa có; luật đầu tiên sẽ là W7)

## Ví dụ chủ game đã duyệt (thêm ở cuối, mới dưới cũ)
Mẫu một mục:
```
### <Tên quái / phép> — <Tên skill> (<ngày>)
Chữ chủ game viết: <nguyên văn>
Điều rút ra: <1 dòng, nếu có, ghi mã W>
```
- (chưa có ví dụ nào)
