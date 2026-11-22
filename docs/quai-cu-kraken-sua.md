# Kraken và Sứa hút ma pháp: bản CŨ (lưu 21/11, chủ game dùng cho quái khác)

Chủ game 21/11: "Các chỉ số và skill của 2 quái này lưu lại, mình sẽ làm cho quái khác." Hai quái này đổi sang chỉ số + skill Ẩn mới (xem TIEP-TUC.md mục Quái ẩn). Đây là bản gốc trước khi đổi, lấy từ `src/lib/catalog.ts`.

## Kraken (`kraken`)
- 2 sao, 1 mana, công 3, thủ 3, thủ phép 0, máu 4. Hình `kraken`. Hệ biển (`SEA_KINDS`).
- Skill (`P("Đắm tàu", "kraken-tentacle")` trong skill-book.ts):
  **Đắm tàu**: Khi giáp lá cà, phần sát thương bị thủ của Kraken chặn được sẽ thêm vào công của hắn.
- Code cũ: duel.ts `strikePair` (`defender.cardId === "kraken"` cộng vào `counter`, `attacker.cardId === "kraken"` cộng vào `atk`, khoảng dòng 3659–3660).
- Mạnh: Trao đổi vật lý, dame rất to, thủ rất mạnh. Yếu: Không có thủ phép, máu không cao. Khắc chế: Đánh phép trúng nó.

## Sứa hút ma pháp (`sua-hut-ma-phap`)
- 2 sao, 1 mana (power-balance-base ghi mana 0), công 1, thủ 0, thủ phép 4, máu 5. Hình `sua`. Hệ biển. Keyword Sao chổi (`keywords.ts`).
- Skill (`A("Tích luỹ ma pháp", "jellyfish")`):
  **Tích luỹ ma pháp**:
  - Phần sát thương phép bị thủ phép chặn được tích lại.
  - Tốn 0 mana gây 3 cộng với số sát thương đã tích tụ lên 1 kẻ địch hoặc người chơi.
- Code cũ: `FieldMon.stored` (duel.ts: `stored = (mon.stored ?? 0) + blocked` ở các đường nhận sát thương phép, ~2614, 3633, 3727, 5206; nút `spit` trong field-chips.ts `3 + ctx.stored`; `skill: 0, cast: "aim"` dòng 720; `card-edits.ts` nhãn "Ma pháp tích tụ" / "Phóng").
- Hệ xếp nhóm: Theo bộ (`deck-filters.ts`: Trái tim hải long, Sứa hút ma pháp, Kraken).
