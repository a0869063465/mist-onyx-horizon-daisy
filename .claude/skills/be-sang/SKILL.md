---
name: be-sang
description: Bể sáng chuyển lượt (turn-light.tsx) theo video LoR. Dùng khi sửa bể sáng/bể cá.
---
# Bể sáng (đọc hoc-tu-video trước)

Nguồn: video LoR 30 s chủ game gửi 01/11 (896 khung, 30 khung/giây).

## Hình đúng
- Ô chữ nhật, mặt trên hở. Hai THÀNH có dải sáng đứng đậm, gắt; đáy có gờ sáng mờ bám cung bo sân. KHÔNG làm mờ hai thành.
- Bên trong chỉ 2-3 tấm lụa RỘNG, trong mờ, hình nêm dài thon dần, từ mỗi thành chéo xuống giữa đáy, chồng nhau, đung đưa chậm. KHÔNG sợi mảnh, KHÔNG vệt bóng chạy, KHÔNG nét neon.
- Xanh: lụa thưa, nhạt. Đỏ: đậm, bão hoà, nhiều tấm rộng hơn.
- Dải ở góc bo hoà vào dòng bể: cùng màu, thon dần ở chỗ giao, không lộ đường nối.

## Chuyển động
- Bật: mũi sáng từ chân thành TRÁI quét sang phải dọc đáy ~0,4 s, dựng thành, lụa hiện ngay sau; thành phải sáng cuối.
- Tắt: xoá trái sang phải ~0,4-0,5 s, thành phải còn lâu nhất.
- Mũi quét trái sang phải mình đã làm đúng.

## Sân (board-full.jpg 841x1870)
Xanh: cạnh phẳng ~62,5%, bo xuống ~2,2% trong ~6% bề ngang. Đỏ: phẳng ~40,5%, bo lên ~2,2% trong ~9%.

## Thử
`/tmp/clashtest/tank.mjs` (xanh, Test), `red.mjs` (đỏ, lượt máy). 390x844 và 390x740. Chụp cạnh khung video cùng mốc.
