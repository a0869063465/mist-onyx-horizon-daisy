# Hệ thống luật lá bài (dùng để viết mô tả và đọc luật)

Tài liệu này mô tả cách lá bài được lưu, cách chữ lá được đọc, và quy ước khi viết hay sửa mô tả. Mọi con số và tên trong đây lấy từ code; khi code đổi thì sửa tài liệu theo.

## 0. Thuật ngữ (đọc tên đầy đủ, không viết tắt)

| Thuật ngữ | Nghĩa |
|---|---|
| Lá | Một thẻ bài: quái thú hoặc phép. |
| Quái thú (quái) | Lá có công, thủ, thủ phép, máu và kỹ năng. |
| Phép | Lá không có chỉ số, chỉ có tác dụng theo chữ lá. |
| Lá môi trường | Một loại phép đặc biệt (`env: true`), cho quái cùng hệ một số lợi ích khi nằm trên bàn. |
| Công | Sức tấn công (`atk`). |
| Thủ | Phòng ngự trước đòn đánh thường (`def`). |
| Thủ phép | Phòng ngự trước sát thương phép (`mdef`). |
| Máu | Số máu của quái (`hp`). |
| Mana | Tài nguyên trả để triệu hồi và dùng phép, kỹ năng (`gems` trên lá). |
| Sao | Cấp của quái (`stars`, từ 1 đến 5). |
| Sát thương phép | Sát thương từ phép hoặc kỹ năng; bị trừ đi thủ phép của mục tiêu. |
| Sát thương chuẩn | Sát thương không bị trừ bởi thủ hay thủ phép. |
| Đứng yên | Lá không đánh hoặc không chặn vì cơ chế in sẵn trên lá (trường `still`). Khác với "mệt" hay bị khống chế. |
| Chặn | Quái đứng ra nhận đòn thay mục tiêu. |
| Phản ứng | Hành động dùng khi đến lượt đối thủ đang ra đòn (phép phản ứng, chặn, kỹ năng nhanh). |
| Hàng chờ | Các hành động đã xếp nhưng chưa nổ, chờ bên kia đáp lại hoặc xác nhận. |
| Trả đòn | Quái hàng trước còn sống, sau khi bị đánh, được đánh lại. |
| Hàng trước / hàng sau | Hai hàng quái trên sân; quái hàng trước chặn được đòn vào người chơi và quái hàng sau. |
| Triệu hồi | Đưa một quái từ tay ra sân. |
| Hiến tế | Trả một quái trên sân hoặc trên tay để triệu hồi hoặc đổi lấy tác dụng. |
| Dung hợp | Ghép các quái theo công thức thành một quái dạng mới. |
| Tiến hoá | Quái đạt điều kiện thì đổi thành dạng mới (`FORMS`). |
| Hoá giải | Phép huỷ tác dụng của phép hoặc kỹ năng khác (ví dụ Hấp thụ ma pháp). |
| Khống chế | Làm quái không hành động được trong một số lượt. |

## 1. Hai loại lá

| Loại | Nơi lưu | Trường chính |
|---|---|---|
| Quái thú | `MONSTERS`, `FORMS` (dạng tiến hoá/dung hợp, không vào bộ bài) trong `src/lib/catalog.ts` | `id`, `name`, `stars` (1–5), `gems` (mana triệu hồi), `atk`, `def`, `mdef`, `hp`, `skill` (chữ lá), `art`, `picture`, `still` (lá đứng yên), `strong`/`weak`/`counter` |
| Phép | `SPELLS` trong `catalog.ts` | `id`, `name`, `gems` (mana), `effect` (chữ lá), `env` (lá môi trường nếu có) |

- `strong`, `weak`, `counter` **không được đưa ra ngoài** (ẩn theo luật dự án). Không viết chúng vào chữ lá, không nhắc trong bản cập nhật.
- Tổng cộng khoảng 93 mục lá trong `catalog.ts` (quái, dạng ngoài bộ, phép).

## 2. Chữ lá là dữ liệu cho cả người đọc lẫn game

Chữ lá (`skill` của quái, `effect` của phép) vừa để người chơi đọc, vừa được game **đọc số từ đó**. Khi sửa chữ phải giữ đúng khuôn:

- Tiêu đề kỹ năng viết đậm, ví dụ `__**Lão hoá**__.` Game lấy mô tả của một kỹ năng là đoạn từ tiêu đề đó đến tiêu đề kế tiếp (trường `head` trong `skill-book.ts`).
- Số lấy từ chữ:
  - "N lượt": game lấy số lượt đầu tiên gặp.
  - "N sát thương phép": sát thương phép.
  - "N mana": mana tiêu hao.
  - Số kén và máu chân kén lấy từ chữ của Kén ngài.
  
  Thêm chữ có số thì kiểm tra lại các số đó.
- Mana tiêu hao viết "Tiêu hao N mana" hoặc "N mana"; bảng kỹ năng đọc chữ này để hiện viên ngọc.
- Tên kỹ năng trong chữ lá phải khớp với `SKILL_BOOK` (`skill-book.ts`). Nếu không khớp, bảng quái không tìm thấy mô tả.
- Chữ mô tả là của chủ game. Không tự sửa chữ; chỉ sửa chỉ số. Đổi chữ kỹ năng thật (đổi luật) thì sửa code trước, rồi đưa chữ cũ cho chủ game viết chữ mới.

## 3. Phân loại kỹ năng trên bảng quái (`src/lib/skill-book.ts`)

Mỗi kỹ năng có `kind`, quyết định kiểu icon trên bảng quái:

| `kind` | Kiểu | Ý nghĩa |
|---|---|---|
| `active` | chủ động | người chơi bấm trên sân để dùng |
| `risk` | chủ động nguy hiểm | kỹ năng làm hại chính quái đó (Hoá Kén, Hiến Tế, trả máu) |
| `spell` | dùng như phép | dùng trong cửa sổ phản ứng hoặc từ tay |
| `passive` | nội tại | tự hoạt động, không bấm |
| `note` | lưu ý | dòng chú ý chung cho cả bộ kỹ năng |

Cờ bổ sung:
- `slow: true`: kỹ năng chậm, chỉ dùng ở lượt chính của mình, không dùng khi phản ứng.
- `chain: true`: nối với kỹ năng trước (Chân kén nối với Hoá Kén).
- `pick`: lấy vài dòng từ một tiêu đề chung (ví dụ ba lời chúc của hiệp sĩ, vua, hậu).

Thêm kỹ năng mới cho quái: thêm dòng vào `SKILL_BOOK`. Thêm icon: `scripts/skill-icons.mjs`.

## 4. Phân loại phép (`src/lib/spell-kinds.ts`)

Nhóm (dùng để xếp lá trong bộ bài và bảng phép):

| Nhóm | Ví dụ thuộc nhóm |
|---|---|
| Môi trường | Thảo nguyên, Đất đá, Núi, Rừng rậm, Bóng tối, Biển sâu, Cứ địa máy móc, Thánh địa thiên sứ, Núi dung nham |
| Phản đòn | Lá chắn phản đòn, Gương phòng hộ, Phục kích, Hoán đổi, Giáp cơ khí, Cỗ máy thời gian, Hộp ma thuật |
| Giải trừ | Hấp thụ ma pháp, Phản nguyền, Vòng xoáy bảo hộ, Mưa ma thuật |
| Đa năng | Mũ ma pháp, Kẻ đào mộ, Thu hồi quái thú |
| Khống chế | Sợi xích địa ngục, Thanh gươm ánh sáng, Vòng nguyền rủa ác ma, Ngăn chặn phòng ngự |
| Sát thương | Sừng lôi phá, Sấm sét tận thế, Virus ăn mòn |

Tốc độ (`SPEEDS`, trong `spell-kinds.ts`). Tốc độ quyết định cách lá vận hành trong trận và kiểu khung hiển thị trên lá trên tay:

- **Chậm**: chỉ dùng khi quái đứng yên, không dùng khi quái đang lao ra phản ứng. Theo ghi chú của chủ game (30/10), đối thủ chỉ đáp lại bằng Hấp thụ ma pháp.
- **Nhanh**: dùng trong cửa sổ phản ứng, đi vào hàng chờ; đối thủ có thể đáp lại.
- **Siêu tốc**: nổ ngay khi đưa lên; đối thủ thấy sau khi bấm xác nhận.
- **Buff**: tăng sức cho đồng minh.

Một lá không có trong `SPEEDS` không có nhãn tốc độ. Kiểu khung (màu) của từng tốc độ do chủ game tự chọn và chỉnh bằng tay, tài liệu này không quy định màu.

## 5. Quy tắc viết mô tả mới

1. Viết bằng tiếng Việt, theo khuôn mục 2: tiêu đề đậm, số có đơn vị rõ, mana viết "N mana".
2. Tên quái và tên kỹ năng trong bản cập nhật phải đúng từng chữ như trong game.
3. Không nhắc điểm mạnh, điểm yếu, khắc chế.
4. Lá đứng yên (không đánh hoặc không chặn vì cơ chế in sẵn): đặt `still: true`. Không đánh dấu từng lá bằng tay ngoài trường này.
5. Lá quái 5 sao không có cơ chế mới trừ khi chủ game nói rõ; luật mới chỉ áp đến quái 4 sao.
6. Luật mới của lá chưa rõ thì hỏi chủ game trước. Không tự thêm cơ chế hay cách hiểu.

## 6. Khi đổi chữ hoặc chỉ số

- **Đổi chỉ số** (công, thủ, thủ phép, máu, mana, sao): sửa số trong `catalog.ts`; ghi một dòng vào `BALANCE_LOG` (`src/lib/power-balance.ts`, nhật ký cân bằng); chạy `scripts/stamp-cards.ts` qua Vite để cập nhật `src/lib/card-clock.ts` (đồng hồ chỉ số của lá). Đổi chỉ số thì tự làm, không cần hỏi.
- **Đổi chữ mô tả**: thêm dòng vào `STALE_SKILLS` hoặc `STALE_ASKS` (`src/lib/card-edits.ts`). Hai danh sách này báo cho game biết bản chỉnh cũ đã lưu trên máy không được giữ chữ cũ.
- **Đổi luật lá**: hỏi chủ game trước. Code phép và kỹ năng đã xây không đụng khi chỉ nhờ sửa phần hiển thị.
- **Mọi thay đổi người chơi thấy**: thêm một dòng ngắn vào `PENDING_NOTES` (mảng ghi chú cập nhật, `src/lib/updates.ts`).

## 7. Khi thêm lá mới, kiểm các chỗ sau

1. `src/lib/catalog.ts`: thêm vào `MONSTERS` hoặc `FORMS` (quái) hoặc `SPELLS` (phép). `id` và `name` phải duy nhất.
2. `src/lib/skill-book.ts`: thêm kỹ năng quái vào `SKILL_BOOK`. Phép: xếp nhóm và tốc độ trong `src/lib/spell-kinds.ts`.
3. `src/lib/icon-briefs.ts`: mô tả ngắn khi người chơi bấm icon phản ứng (`skillBrief` cho kỹ năng, `spellBrief` cho phép).
4. `src/lib/power-balance-base.ts` (chỉ số gốc để so cân bằng), `src/lib/fx-kinds.ts` (hiệu ứng theo hệ), `src/lib/i18n.ts` (chữ tiếng Anh, nếu lá có chữ mới).
5. Lá có trong album nhưng chưa dùng được trong trận: thêm id vào `WAITING_CARDS` (`catalog.ts`). Hiện danh sách này rỗng.
6. Chạy `node scripts/round-rules.mjs` (bộ kiểm luật, các bài mô phỏng luật) và thử trận qua Vite, không chỉ đọc code.

## 8. Phần còn thiếu của hệ thống

- Chưa có danh sách từ khoá chung (ví dụ "khống chế", "tê liệt", "dung hợp" với nghĩa thống nhất) tập trung ở một nơi; mỗi chữ lá tự viết. Cần chủ game duyệt một bảng từ khoá trước khi thêm vào đây.
- Chưa có kiểm tra tự động chữ lá có khớp `SKILL_BOOK` và tên quái hay không; kiểm bằng tay khi thêm lá.
- Chưa có quy định màu khung, màu viền cho từng loại và từng tốc độ trong tài liệu này. Chủ game tự chọn và chỉnh bằng tay.
