---
name: chuyen-cua-so
description: Chuyển sang cửa sổ làm việc mới của dự án Clash of the Beasts mà không mất việc đang dở. Dùng khi người dùng nói muốn hết cửa sổ, sang cửa sổ khác, hoặc chuẩn bị làm mới ngữ cảnh.
---

# Chuyển cửa sổ làm việc

Dùng skill này trước khi kết thúc một cửa sổ để cửa sổ mới tiếp tục đúng việc.

## Bước 1: Kiểm tra trạng thái repo
- Chạy `git status` và `git log -3`.
- Nếu còn thay đổi chưa commit: hỏi người dùng có muốn commit và đẩy lên nhánh làm việc không. Không tự đẩy lên `main`.
- Nếu có commit chưa đẩy: đẩy lên nhánh làm việc (không ép).

## Bước 2: Ghi việc đang dở vào `TIEP-TUC.md`
Thêm một mục ngắn ở đầu, gồm:
- Việc vừa làm (1–2 dòng).
- Các câu hỏi còn mở, chờ người dùng trả lời.
- Việc sắp làm và mô hình/nỗ lực đề xuất (nếu chưa chốt thì ghi "chưa chốt").

## Bước 3: Cập nhật thống kê từ khoá
Nếu phiên này có từ khoá mới hoặc đổi màu, cập nhật mục 9 trong `docs/luat-la-bai.md`.

## Bước 4: Báo người dùng câu lệnh tiếp tục
Đưa cho người dùng đoạn sau để dán vào cửa sổ mới:

> Tiếp tục dự án Clash of the Beasts trên nhánh `ccr-b3cdb72e-7r9yr6`.
> 1. Đọc `TIEP-TUC.md` và `docs/luat-la-bai.md` (mục 9).
> 2. Chạy `git status` và `git log -3`.
> 3. Báo lại việc đang dở, câu hỏi còn mở, và việc sẽ làm tiếp.
> Quy tắc: không ghi đè dữ liệu mới của main; chỉ sửa đúng phần được nói; hỏi trước khi đổi luật lá hay chữ lá.

## Quy tắc chung
- Không ép push, không đổi dữ liệu số của main khi chưa được nói.
- Không mở cửa sổ mới thay người dùng; chỉ chuẩn bị và đưa câu lệnh.
