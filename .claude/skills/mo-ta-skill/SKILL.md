---
name: mo-ta-skill
description: Viết hoặc sửa chữ mô tả kỹ năng, phép của lá bài Clash of the Beasts theo đúng lối viết của chủ game. Dùng mỗi khi chủ game nhờ viết, soạn nháp, so sánh hoặc đưa ví dụ mô tả skill/phép. Skill này được chủ game đào tạo dần bằng ví dụ.
---
# Mô tả skill (đang được chủ game đào tạo bằng ví dụ)

Đọc `docs/luat-la-bai.md` mục 2 (khuôn chữ lá) và mục 5 (quy tắc viết) trước khi viết.

## Luật cứng (có sẵn trong dự án, không đổi)
- Mô tả là của chủ game, cho người chơi đọc. KHÔNG tự sửa chữ trong `catalog.ts`. Chỉ soạn NHÁP trong tin nhắn, chủ game duyệt rồi mới đưa vào code.
- Giữ khuôn dữ liệu: tiêu đề đậm `__**Tên**__.`, "N lượt", "N sát thương phép", "N mana" / "Tiêu hao N mana", tên kỹ năng khớp `SKILL_BOOK`. Thêm chữ có số thì kiểm lại các số game đọc từ chữ.
- Phòng ngự là cả thủ và thủ phép; nói rõ khi chỉ một trong hai. Không nhắc điểm mạnh, điểm yếu, khắc chế.
- Tên quái, tên skill ghi đủ như trong game. Chữ trên lá viết tiếng Việt.
- Chưa rõ 100% cơ chế thì HỎI, không tự thêm cơ chế hay cách hiểu. Quái 5 sao không có cơ chế mới nếu chủ game không nói.
- Đổi chữ của kỹ năng thật (đổi luật) thì sửa code trước, rồi đưa chữ cũ cho chủ game viết chữ mới.

## Cách làm khi được nhờ
1. Đọc kỹ code/luật của kỹ năng (không đoán), xác định từng phần của nó.
2. Đối chiếu mục "Ví dụ chủ game đã duyệt" bên dưới: bắt chước thứ tự câu, từ vựng, độ dài, cách chia dòng của các ví dụ gần nhất.
3. Soạn nháp ngắn, gửi kèm 1 dòng nêu chỗ không chắc. Chờ chủ game sửa.
4. Khi chủ game sửa nháp, so bản sửa với nháp và chép NGUYÊN VĂN bản sửa vào mục ví dụ, ghi thêm "điều rút ra" (1 dòng) nếu thấy một quy tắc lặp lại.

## Quy tắc rút ra từ ví dụ (chủ game chưa dạy gì, để trống)
- (chưa có)

## Ví dụ chủ game đã duyệt (thêm ở cuối, mới dưới cũ)
Mẫu một mục:
```
### <Tên quái / phép> — <Tên skill> (<ngày>)
Chữ chủ game viết: <nguyên văn>
Điều rút ra: <1 dòng, nếu có>
```
- (chưa có ví dụ nào)
