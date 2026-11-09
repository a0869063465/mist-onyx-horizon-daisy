# Hệ thống luật lá bài (dùng để viết mô tả và đọc luật)

Tài liệu này mô tả cách lá bài được lưu, cách chữ lá được đọc, và quy ước khi viết hay sửa mô tả. Mọi con số và tên trong đây lấy từ code; khi code đổi thì sửa tài liệu theo.

## 1. Hai loại lá

| Loại | Nơi lưu | Trường chính |
|---|---|---|
| Quái thú | `MONSTERS`, `FORMS` (dạng tiến hoá/dung hợp, không vào bộ bài) trong `src/lib/catalog.ts` | `id`, `name`, `stars` (1–5), `gems` (mana triệu hồi), `atk`, `def`, `mdef`, `hp`, `skill` (chữ lá), `art`, `picture`, `still` (lá đứng yên), `strong`/`weak`/`counter` |
| Phép | `SPELLS` trong `catalog.ts` | `id`, `name`, `gems` (mana), `effect` (chữ lá), `env` (lá môi trường nếu có) |

- `atk` = công, `def` = thủ, `mdef` = thủ phép, `hp` = máu.
- `strong`, `weak`, `counter` **không được đưa ra ngoài** (ẩn theo luật dự án). Không viết chúng vào chữ lá, không nhắc trong bản cập nhật.
- Tổng cộng khoảng 93 mục lá trong `catalog.ts` (quái, dạng ngoài bộ, phép).
- Lá môi trường là phép có `env: true`, hiện trong nhóm Môi trường.

## 2. Chữ lá là dữ liệu cho cả người đọc lẫn game

Chữ lá (`skill` của quái, `effect` của phép) vừa để người chơi đọc, vừa được game **đọc số từ đó**. Khi sửa chữ phải giữ đúng khuôn:

- Tiêu đề kỹ năng viết đậm: `__**Lão hoá**__.` Game tìm đoạn mô tả từ tiêu đề này đến tiêu đề kế tiếp (`head` trong `skill-book.ts`).
- Số lấy từ chữ: "N lượt" (lấy số lượt đầu tiên), "N sát thương phép", "N mana", số kén và máu chân kén lấy từ chữ Kén ngài. Thêm chữ có số thì kiểm tra lại các số đó.
- Mana tiêu hao viết "Tiêu hao N mana" hoặc "N mana"; bảng kỹ năng đọc để hiện viên ngọc.
- Tên kỹ năng trong chữ lá phải khớp với `SKILL_BOOK` (`skill-book.ts`), nếu không bảng quái không tìm thấy mô tả.
- Chữ mô tả là của chủ game. Không tự sửa chữ; chỉ sửa chỉ số. Đổi chữ skill thật thì sửa code trước, rồi đưa chữ cũ cho chủ game viết chữ mới.

## 3. Phân loại kỹ năng trên bảng quái (`src/lib/skill-book.ts`)

Mỗi kỹ năng có `kind` quyết định màu viền icon:

| `kind` | Màu | Ý nghĩa |
|---|---|---|
| `active` | xanh lam | chủ động bấm trên sân |
| `risk` | cam (chủ động nguy hiểm, tự hại mình) | Hoá Kén, Hiến Tế, trả máu |
| `spell` | hồng | dùng như phép phản ứng, trong cửa sổ đáp hoặc từ tay |
| `passive` | tím | tự hoạt động |
| `note` | vàng | "Lưu ý" của cả bộ kỹ năng |

Ngoài ra:
- `slow: true`: kỹ năng chậm, chỉ dùng ở lượt chính, không dùng khi phản ứng (viền đỏ).
- `chain: true`: nối với kỹ năng trước (Chân kén nối Hoá Kén).
- `pick`: lấy vài dòng từ một tiêu đề chung (ví dụ ba lời chúc của hiệp sĩ, vua, hậu).

Thêm quái có kỹ năng mới: thêm dòng vào `SKILL_BOOK`. Thêm icon: `scripts/skill-icons.mjs`.

## 4. Phân loại phép (`src/lib/spell-kinds.ts`)

Nhóm (hiện trong bộ bài, bảng phép):

| Nhóm | Ví dụ thuộc nhóm |
|---|---|
| Môi trường | Thảo nguyên, Đất đá, Núi, Rừng rậm, Bóng tối, Biển sâu, Cứ địa máy móc, Thánh địa thiên sứ, Núi dung nham |
| Phản đòn | Lá chắn phản đòn, Gương phòng hộ, Phục kích, Hoán đổi, Giáp cơ khí, Cỗ máy thời gian, Hộp ma thuật |
| Giải trừ | Hấp thụ ma pháp, Phản nguyền, Vòng xoáy bảo hộ, Mưa ma thuật |
| Đa năng | Mũ ma pháp, Kẻ đào mộ, Thu hồi quái thú |
| Khống chế | Sợi xích địa ngục, Thanh gươm ánh sáng, Vòng nguyền rủa ác ma, Ngăn chặn phòng ngự |
| Sát thương | Sừng lôi phá, Sấm sét tận thế, Virus ăn mòn |

Tốc độ (`SPEEDS`), quyết định màu khung lá trên tay và cách lá dùng trong trận:

- **Chậm** (khung đỏ): chỉ dùng khi quái đứng yên; đối thủ chỉ đáp bằng Hấp thụ ma pháp.
- **Nhanh** (khung hồng): dùng khi phản ứng, đi vào hàng chờ, đối thủ đáp lại được.
- **Siêu tốc** (khung trắng): nổ ngay khi đưa lên, đối thủ thấy sau khi xác nhận.
- **Buff** (khung xanh lá): tăng sức cho đồng minh.

Một lá không có trong `SPEEDS` không có nhãn tốc độ.

## 5. Quy tắc viết mô tả mới

1. Viết bằng tiếng Việt, theo khuôn mục 2 (tiêu đề đậm, số có đơn vị rõ, mana viết "N mana").
2. Tên quái và tên kỹ năng trong bảng cập nhật phải đúng từng chữ như trong game.
3. Không nhắc điểm mạnh, điểm yếu, khắc chế.
4. Lá đứng yên (không đánh hoặc không chặn vì cơ chế in sẵn): đặt `still: true`. Không đánh dấu từng lá bằng tay ngoài trường này.
5. Lá quái 5 sao không có cơ chế mới trừ khi chủ game nói rõ; luật mới chỉ áp đến quái 4 sao.
6. Luật mới của lá chưa rõ thì hỏi chủ game trước. Không tự thêm cơ chế hay cách hiểu.

## 6. Khi đổi chữ hoặc chỉ số

- **Đổi chỉ số**: sửa số trong `catalog.ts`, ghi `BALANCE_LOG` (`src/lib/power-balance.ts`), chạy `scripts/stamp-cards.ts` qua Vite để cập nhật `card-clock.ts`. Đổi chỉ số thì tự làm, không hỏi.
- **Đổi chữ**: thêm dòng vào `STALE_SKILLS` hoặc `STALE_ASKS` (`src/lib/card-edits.ts`), để bản chỉnh cũ đã lưu không giữ số cũ.
- **Đổi luật lá**: hỏi chủ game trước. Code phép/skill đã xây không đụng khi chỉ nhờ phần hiển thị.
- **Mọi thay đổi người chơi thấy**: thêm một dòng ngắn vào `PENDING_NOTES` (`src/lib/updates.ts`).

## 7. Khi thêm lá mới, kiểm các chỗ sau

1. `catalog.ts`: thêm vào `MONSTERS`/`FORMS` hoặc `SPELLS`, có `id` và `name` duy nhất.
2. `skill-book.ts`: thêm kỹ năng vào `SKILL_BOOK` (quái) hoặc `spell-kinds.ts` (phép: nhóm, tốc độ).
3. `icon-briefs.ts`: mô tả ngắn khi bấm icon phản ứng (`skillBrief`/`spellBrief`).
4. `power-balance-base.ts` và `fx-kinds.ts` (hiệu ứng theo hệ), `i18n.ts` (chữ tiếng Anh nếu có).
5. Lá chưa dùng được: thêm vào `WAITING_CARDS` (hiện trong album nhưng chưa vào gói/bộ).
6. Chạy `node scripts/round-rules.mjs` (bộ bài luật) và thử trận qua Vite, không chỉ đọc code.

## 8. Điều còn chưa có trong hệ thống

- Chưa có danh sách từ khoá chung (ví dụ tên trạng thái như "khống chế", "tê liệt") tập trung ở một nơi; mỗi chữ lá tự viết. Khi cần, thêm một bảng từ khoá vào tài liệu này và chủ game duyệt.
- Chưa có kiểm tra tự động chữ lá có khớp `SKILL_BOOK` và tên quái hay không; kiểm bằng tay khi thêm lá.
