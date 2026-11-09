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

## 9. Thống kê từ khoá theo màu (cập nhật sau mỗi phiên)

Quy ước của chủ game: "từ khoá" là chữ tô màu trong chữ lá. Tên từ khoá không dùng chung với "keyword" (mục sau này, chủ game sẽ nói riêng). Màu không có từ khoá thì không ghi.

Viết tắt: lam = xanh lam, d = đỏ, v = vàng, h = hồng, lu = xanh lá, ch = xanh đọt chuối, ca = cam, t = tím, gvt = gradient vàng tím.

Thống kê cập nhật (10/11/2026, sau các đợt từ khoá 1–5). Nguồn: màu có sẵn trong code (`sheet-ink.ts`, `.ink-*` trong `styles.css`) cộng các từ khoá chủ game đã duyệt. Màu không có từ khoá thì không ghi.

- **lam** (xanh lam): giải trừ trạng thái bất lợi (code); Tiêu hao N mana; Dùng x mana; sát thương phép; x của sát thương phép (Cầu sấm, Hơi thở rồng); chịu đòn phép.
- **d** (đỏ): hiến tế (code); chịu đòn; lên đối thủ; lên 1 quái địch; lên 1 kẻ địch; lên người chơi.
- **v** (vàng): thủ (code); phòng ngự (phần trên của gvt).
- **h** (hồng): tiến hoá (code).
- **lu** (xanh lá): máu, máu tối đa, hồi máu (code); N máu tối đa; tăng (Đập phá); x công vĩnh viễn (chờ xác nhận, theo "tăng").
- **ca** (cam): N lượt, công (code); Mỗi đòn đánh; đòn đánh là chủ động; số sao hiện có (Cầu sấm); 40% và 75% (Nhảy qua lại); đòn đánh vật lý; quái thú từ 3 sao trở lên.
- **t** (tím): thủ phép, phòng ngự (phần dưới của gvt) (code); khả năng né (Nhảy qua lại).
- **xám**: sát thương chuẩn (viết tắt "xa", Hơi thở rồng); không thể hành động / tấn công (code).
- **ch** (xanh đọt chuối): chưa có từ khoá.
- **gvt** (gradient vàng tím): phòng ngự. Chủ game (10/11): tím đang quá nhiều, vàng tới 55% (đã đổi trong `styles.css`).

Không phải màu: Hấp thụ là skill chậm, đỏ (chủ game); code hiện là chủ động xanh lam, chưa đổi.

### Từ khoá do chủ game định nghĩa (10/11/2026)

Cột "Dữ liệu hiện có" lấy từ `catalog.ts` lúc viết; chữ lá thật vẫn là của chủ game.

| Từ khoá | Màu | Nghĩa | Dữ liệu hiện có |
|---|---|---|---|
| Tiêu hao N mana | lam (xanh lam) | Số mana trả khi dùng kỹ năng. | N = 0: 3 lần; N = 1: 29 lần. |
| Chịu đòn | d (đỏ) | Nhận đòn đánh tay. Nếu là đòn phép thì màu lam: "Chịu đòn phép". | Nhiều lá dùng chữ này trong kỹ năng. |
| Chịu đòn phép | lam (xanh lam) | Nhận sát thương phép. | Chưa có lá nào tách riêng chữ này. |
| N máu tối đa | lu (xanh lá) | Lượng máu tối đa bị cướp hoặc được cộng. | N = 1, 2, 3 có trong chữ lá. |
| Hấp thụ | (skill) chậm, đỏ | Kỹ năng hút máu tối đa của quái đã chịu đòn. Chủ game định nghĩa: skill chậm và skill đỏ. | Hoa ăn thịt người: "Hấp thụ", chịu đòn từ 1 quái thú, cướp 2 máu tối đa. Code hiện ghi là chủ động xanh lam, không phải chậm đỏ. |

Lưu ý:
- Tên "Hấp thụ" trùng tên phép "Hấp thụ ma pháp" (phép giải trừ). Cần đặt rõ khi viết lại chữ lá.
- Trong code, Hấp thụ của Hoa ăn thịt người vẫn là `active` (xanh lam) và có `harmSkill`, không phải `slow` và `risk`. Chưa đổi, chờ chủ game xác nhận.
- Dùng màu của từ khoá làm nhãn trong bảng: `Tiêu hao N mana` xanh lam, `Chịu đòn` đỏ, `N máu tối đa` xanh lá.

### Từ khoá đợt 2 (10/11/2026)

| Từ khoá | Màu | Nghĩa | Dữ liệu hiện có |
|---|---|---|---|
| Đập phá | (tên kỹ năng) | Kỹ năng nội tại của Khổng lồ 1 mắt: đòn đánh thường chủ động Tiêu hao 1 mana, và mỗi đòn đánh thường tăng vĩnh viễn công. | `khong-lo-mot-mat` trong `catalog.ts`: "Đòn đánh thường chủ động của hắn tốn thêm 1 mana. Những lần bị động thì không tốn. Tăng cho hắn 1 công vĩnh viễn sau mỗi đòn đánh thường." |
| Mỗi đòn đánh | ca (cam) | Điều kiện kích hoạt. | Chữ lá có "sau mỗi đòn đánh thường". |
| đòn đánh là chủ động | ca (cam) | Điều kiện: đòn đánh do người chơi chủ động ra, không phải khi bị đánh. | "Đòn đánh thường chủ động" trong chữ lá. |
| tăng | lu (xanh lá) | Tác dụng tăng chỉ số. | "Tăng cho hắn 1 công vĩnh viễn". |
| x công vĩnh viễn | lu (xanh lá) theo "tăng"; "công" ca theo quy ước cũ | Lượng công tăng vĩnh viễn. | 1 công. |
| Tiêu hao 1 mana | lam (xanh lam) | Áp màu có sẵn của "Tiêu hao N mana". | "Tiêu hao 1 mana" trong chữ lá Đập phá (sau 10/11). |

Lưu ý:
- Chữ lá Đập phá đã đổi (10/11, theo chủ game) từ "tốn thêm 1 mana" thành "Tiêu hao 1 mana"; STALE_SKILLS có thêm dòng để bản lưu cũ không giữ chữ cũ. Còn lại: trial.ts (gợi ý Sát hạch) và appraisal.ts (lý do câu hỏi) vẫn ghi "tốn thêm 1 mana", chờ chủ game chọn đổi hay giữ.
- Màu của "x công vĩnh viễn" chưa được chủ game nói. Tôi để "công" theo quy ước cam, còn "tăng" theo lục. Cần xác nhận.
- Khung màu của các từ khoá mới do chủ game làm thủ công, tài liệu không ghi khung.

### Từ khoá đợt 3 (10/11/2026)

Cầu sấm là phép (skill) của Phù thuỷ tí hơn. Không ghi tốc độ vì đây là phép nhanh, chỉ ghi khi là skill chậm (chủ game).

| Từ khoá | Màu | Nghĩa | Dữ liệu hiện có |
|---|---|---|---|
| Dùng x mana | lam (xanh lam) | Số mana tiêu hao khi dùng. | Cầu sấm: "Dùng 1 mana", x = 1. |
| sát thương phép | lam (xanh lam) | Loại sát thương phép (bị trừ thủ phép). | Cầu sấm: "gây sát thương phép". |
| x (số gốc của sát thương) | lam (xanh lam) | Lượng sát thương cơ bản, cộng thêm theo điều kiện. | Cầu sấm: "bằng 2 cộng với…", x = 2. |
| số sao hiện có | ca (cam) | Điều kiện/lượng cộng thêm: số sao hiện có của người dùng. | Cầu sấm: "số sao hiện có". |
| lên đối thủ | d (đỏ) | Mục tiêu: người chơi đối phương. | Cầu sấm: "lên người đối thủ hoặc 1 quái địch". |
| lên 1 quái địch | d (đỏ) | Mục tiêu: 1 quái thú địch. | Cầu sấm: cùng câu trên. |

Lưu ý:
- Chữ lá Cầu sấm (`catalog.ts`, Phù thuỷ tí hơn): "Dùng 1 mana gây sát thương phép bằng 2 cộng với số sao hiện có, lên người đối thủ hoặc 1 quái địch." Đây là chữ hiện có, chưa đổi.
- Tên kỹ năng trong bảng quái là "Cầu sấm" (`skill-book.ts`, kiểu chủ động xanh lam). Lá khác có "Cầu sấm ánh sáng" (Mắt xanh huỷ diệt) là một skill khác, không gộp.

### Từ khoá đợt 4 (10/11/2026)

Hơi thở rồng là skill chủ động của hai quái: Rồng con và Rồng ngàn tuổi. Cả hai đều tiêu hao 1 mana, nhắm 1 kẻ địch hoặc người chơi.

| Từ khoá | Màu | Nghĩa | Dữ liệu hiện có |
|---|---|---|---|
| sát thương chuẩn (viết tắt: xa) | xám | Sát thương không bị trừ thủ hay thủ phép. Ký hiệu viết tắt "xa". | Rồng con: 2; Rồng ngàn tuổi: 3. |
| sát thương phép | lam (xanh lam) | Như đợt 3: màu lam. Chủ game không nói màu lần này, tôi áp màu cũ. | Rồng con: 1; Rồng ngàn tuổi: 4. |
| Tiêu hao 1 mana | lam (xanh lam) | Màu có sẵn của "Tiêu hao N mana". | Cả hai lá. |
| lên 1 kẻ địch | đỏ | Mục tiêu: 1 quái thú địch. | Cả hai lá. |
| lên người chơi | đỏ | Mục tiêu: người chơi đối phương. | Cả hai lá. |

Lưu ý:
- Chữ lá Rồng con: "Tiêu hao 1 mana để gây 2 sát thương chuẩn và 1 sát thương phép lên 1 kẻ địch hoặc người chơi." Rồng ngàn tuổi: "…gây 3 sát thương chuẩn và 4 sát thương phép…". Chữ hiện có, chưa đổi.
- Màu xám bây giờ có từ khoá đầu tiên (sát thương chuẩn). Mục 9 trước đây hỏi xám có giữ không; câu này đã có câu trả lời một phần, chờ chủ game xác nhận.
- Màu của "x sát thương phép" chưa được chủ game nói trong tin này, nên tôi áp lam theo đợt 3. Cần xác nhận.

### Từ khoá đợt 5 (10/11/2026)

Nhảy qua lại là skill nội tại (tím) của Thỏ đen tinh nghịch (`tho-den-tinh-nghich`). Chữ lá: "Có khả năng né được 40% sát thương trong các cuộc giao tranh, tăng lên đến 75% khi đấu với quái thú từ 3 sao trở lên."

| Từ khoá | Màu | Nghĩa | Dữ liệu hiện có |
|---|---|---|---|
| khả năng né | t (tím) | Cơ chế né sát thương. | "Có khả năng né được…" |
| 40% (x) | ca (cam) | Tỉ lệ né, gắn với "đòn đánh vật lý". | 40% |
| đòn đánh vật lý | ca (cam) | Loại đòn bị né. | "…trong các cuộc giao tranh" (đòn đánh thường). |
| 75% (x) | ca (cam) | Tỉ lệ né đòn đánh vật lý khi đấu với quái từ 3 sao trở lên. Gắn với "đòn đánh vật lý" (bổ nghĩa cho "khả năng né"), không gắn với điều kiện sao. | 75% |
| quái thú từ 3 sao trở lên | ca (cam) | Điều kiện: đối thủ là quái từ 3 sao trở lên (đứng sau, không phải cụm gắn với số 75%). | "…khi đấu với quái thú từ 3 sao trở lên" |

Về x sau cùng (75%): chủ game xác nhận 75% theo "đòn đánh vật lý", giống 40%. Lý do: số đó bổ nghĩa cho "khả năng né đòn đánh vật lý", không gắn với điều kiện sao.

Lưu ý:
- Chữ lá hiện có, chưa đổi.
- Màu t (tím) cho "khả năng né" là theo bạn. Dùng cùng màu với nội tại của bảng quái (passive = tím trong `skill-book.ts`), tôi không cần đổi code.
