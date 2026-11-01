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

## Số đo (01/11, khung 30 khung/giây, thước `blue = b - max(r,g)`, `red = r - max(g,b)`)
Video: bể xanh đứng yên: thành đỉnh ~70 (sáng ~8 px, tàn ~20 px trên dải rộng ~470 px), đáy đỉnh ~47 (tăng dần từ ~45% độ sâu lên tới đáy), nội thất ~4-9; lúc mới bật thành ~78, đáy ~92. Màu đỉnh xanh (96,136,235). Bể đỏ: nội thất ~50, thành ~65, hàng sát đáy ~92 giảm về ~10 ở đầu hở; màu đỉnh (243,66,60); đặc hơn xanh khoảng 6-10 lần.
Game sau T2e (cùng thước, vẽ canvas lên nền (165,160,135), vùng bể): xanh thành 74, đáy 43, nội thất 3,4; đỏ thành 79, đáy 97, nội thất 48. Hằng số trong `POOL` (turn-light.tsx). Kiểm: `/tmp/clashtest/meas.mjs` (mất khi hết phiên: dựng canvas lên nền xám, tính thước trên vùng bể, so với số trên).
Hình: bể LoR nằm trong dải đá dưới sân; thành sáng dọc, đáy nhô nhẹ, dải lụa 2 tấm mỗi thành nghiêng ~24° xuống giữa đáy.

## Số đo dải lụa (01/11, clip đỏ 5 s + clip xanh 1:30 chủ game gửi; thước như trên)
Hình: KHÔNG phải sợi, không phải nêm đặc. Là các dải lụa/khói trong mờ chồng nhau; mép dải đậm hơn giữa dải chút (đỉnh cục bộ ~+22 trên trung bình quanh nó), dải mỏng thì đặc hơn dải dày, đầu và đuôi tan dần, chỗ chồng đậm hơn.
Đỏ: pixel đỏ rất không đều (p10 = 0, p50 11-22, p90 ~85, p99 ~130), trung bình vùng trong ~27-33; một đường dọc cắt 2-3 dải, mỗi dải cao ~20% bể; dải đậm ở sát hai thành (tới ~145), thưa ở giữa. Thành trái ~18, phải ~10 trên cùng thước.
Xanh: giữa bể = 0, chỉ có dải gần hai thành (trung bình mỗi bên ~7-8, thành ~30 trên vùng đo); mỗi bên đập nhẹ giữa ~4,5 và ~12 chu kỳ ~9 s, hai bên lệch pha; không đổi khi có lá đặt xuống sân (hai đoạn 0-37 s và 45-96 s giống nhau).
Game (T2f, `RIBBONS` + `POOL`): xanh thành 71-80, đáy 41, nội thất 2,7-3; đỏ thành 75-80, đáy 67, nội thất 33.

## Dải khói (T2i, 01/11): hình và đo chuyển động
Hình (clip đỏ 5 s, xanh 1:30): mỗi thành toả một quạt dải khói/lụa trong mờ, rộng ở thành, thon dần thành sợi nằm dọc đáy ở ~0,2–0,5 bề ngang; mép dải sáng hơn thân, mép KHÔNG bắt chéo (bắt chéo = trông như dây/sợi, chủ game chê). Góc đáy-thành đậm nhất. Đỏ dày, đậm; xanh thưa, nhạt.
Chuyển động: đo trên 20% điểm ảnh dao động nhiều nhất, thước như trên. Video: xanh |đổi|/giây ~45, độ lệch chuẩn ~16–18, nhịp tâm ~0,8 Hz, đỉnh 0,1–0,25 Hz; đỏ ~53–84, ~16–30, ~0,9–1,0 Hz. Phồng xẹp chậm 0,1 Hz (T2h) = đứng yên. Game T2i: xanh 45 / 14 / 0,89 Hz; đỏ 48 / 18 / 0,84 Hz.
Cách đo: tách khung video bằng ffmpeg rawvideo 30 khung/giây; game: gọi thẳng `TurnLightArt.draw(t)` trên trang (import `/src/components/game/turn-light.tsx` qua Vite, vẽ lên `board-full.jpg`) từng mốc 1/30 giây rồi chụp; so cùng thước. Sửa theo số, không theo mắt.

## Dòng chảy (T2k, 01/11, clip đỏ 20 s)
Dải KHÔNG neo ở thành: cả bể là một dòng vòng, dọc thành trái chảy về đáy, dọc đáy sang phải, rời thành phải; dải đậm bị cuốn theo rồi tan, dải mới thay. Đo bằng tương quan dịch chuyển theo hàng (ngang) và cột (dọc) trên phần đổi (trừ trung bình theo thời gian): đỏ trái −0,05 độ sâu/s, phải +0,10, đáy +0,02..0,05 bề ngang/s; xanh trái −0,08, phải +0,04. Chu kỳ một chuyến ~9 s. Dải đi dọc đáy ở cao 0,12–0,32 độ sâu (không sát mép).

## Nước bằng video (T2l, 01/11)

Chủ game gửi video Grok `91cc8e9c` (dải lụa đỏ trên nền đen, 1168×784, 24 hình/giây, 15 s, khung đầu và cuối lệch trung bình 1,7/255 nên lặp liền). Nước trong bể giờ là chính video đó, không còn vẽ bằng code:
- Dải nằm ở hàng 354–551; cắt 352–556, thu 780×136; mép sáng dưới cùng (đáy) ở hàng ~128 của bản thu.
- Độ trong = độ sáng lớn nhất / 200; màu = màu gốc đẩy lên đủ sáng. Bản xanh: B = đỏ gốc, G = 0,42·đỏ + G, R = 0,12·đỏ + G.
- `paintFilm` (turn-light.tsx) kéo khung video phủ bề ngang bể, hàng 128 về đáy, hàng 0 về miệng; bể đỏ lật dọc. Độ đậm `POOL.film`.
- Làm lại file: script trong TIEP-TUC (mục T2l) mô tả các bước; dùng `ffmpeg -c:v libvpx-vp9 -pix_fmt yuva420p`.
