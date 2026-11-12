---
name: vfx
description: Cài hoặc sửa hiệu ứng (VFX) từ video chủ game gửi. Đọc MỖI LẦN chèn hay chỉnh VFX: luật hình + âm, cách mã hoá, đo tâm, bảng video đã gắn.
---
# VFX từ video của chủ game

## Luật (chủ game 06/11)
- Chủ game bảo "chèn hiệu ứng" mà không nói gì thêm = thay CẢ hình LẪN âm thanh bằng của video. Video gốc có đường âm AAC: tách ra dùng, bỏ âm cũ của chính skill/hiệu ứng đó. Không bao giờ bỏ `-an` rồi giữ âm cũ.
- Chủ game giao quyền "tự sắp xếp / quyết hướng" thì chỉ ĐỀ XUẤT (bảng video → skill), báo lại, CHỜ "ok" rồi mới gắn code.
- Gắn xong phải CHỤP trong game (390×844 và 390×740) rồi gửi chủ game, không nói "chưa chụp".
- Đo, không đoán: điểm "phát lực" (đốm trắng nóng nhất) của video phải rơi đúng TÂM lá bài (hoặc tâm vùng hiệu ứng nếu là cả hàng). Đo bằng số liệu từng khung (min kênh màu > 170, trung bình toạ độ) rồi dời video bằng `transform`.
- Mỗi thay đổi người chơi thấy: thêm 1 dòng NGẮN vào `PENDING_NOTES` (`src/lib/updates.ts`), tên skill ghi đúng như trong game.

## Cách làm
1. Hình: `ffmpeg -ss <bỏ đầu đen> -i video -an -vf "scale=<480..512>:-2,fps=24,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='min(255,3*max(max(r(X,Y),g(X,Y)),b(X,Y)))'" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 42..44 -auto-alt-ref 0 public/fx/<tên>.webm` (nền đen → trong suốt, màu giữ nguyên; KHÔNG dùng `mix-blend-mode: screen`, trên sân xanh mất màu). Safari không có alpha webm (chủ game dùng Android Chrome).
2. Âm: `ffmpeg -ss <cùng mốc cắt đầu> -i video -vn -af volume=<dB> -ac 2 -ar 44100 -c:a libmp3lame -q:a 4 public/sfx/<tên>.mp3`. Chỉnh `volume` để đỉnh khoảng −3 dB (đo bằng `volumedetect`). Cắt đầu hình bao nhiêu thì cắt âm bấy nhiêu.
3. Cue: thêm tên vào `type Cue` và đường dẫn vào `CLIPS` trong `src/lib/sfx.ts` (CLIPS tự tải trước).
4. Phát: component video (`src/components/game/spectacle.tsx`) gọi `playCue(...)` ngay lúc thêm clip, chống phát chồng (nhiều mục tiêu cùng lúc: một tiếng, `lastTideSound` / `lastHealSound` > 350 ms). Thêm video vào `FX_VIDEOS` (`src/lib/preload.ts`).
5. Bỏ âm cũ: tìm nhánh `playCue` trong `src/routes/play.tsx` chạy cho đúng skill đó (vd `monsterKill` → `spellRise`/`spellBoom`, `damageStart`) và loại bằng cờ (vd `waterCast`).
6. Thử: dựng cảnh bằng `createServer` Vite + `testGrant` (xem scratchpad `wave/mk3.mjs`, `run2.mjs`, `snd.mjs`: `snd.mjs` móc `AudioBufferSourceNode.start` để thấy clip nào chạy).

## Bảng video đã gắn (nhánh VFX)
| Video | Hiệu ứng | Skill | File hình / âm |
|---|---|---|---|
| `fb195226` (4,0 s, bỏ 0,36 s đầu) | sóng lớn dâng, phủ cả hàng | Đại hồng thuỷ huỷ diệt (cả hàng của mục tiêu) | `fx/dai-hong-thuy.webm`, `sfx/dai-hong-thuy.mp3` (cue `tideWave`) |
| `89f54956` (3,0 s) | giọt rơi, cột nước phun | Triều lên | `fx/thuy-tru.webm`, `sfx/thuy-tru.mp3` (`tideRise`) |
| `7d71e086` (3,0 s) | hạt tụ, nổ nước toả đều | Con nước lớn tàn phá | `fx/thuy-no.webm`, `sfx/thuy-no.mp3` (`tideBurst`) |
| `0552b72a` (3,0 s) | xoáy nước chém bắn sang phải | Cơn thịnh nộ của hải thần (Cơn thịnh nộ của hải vương) | `fx/thuy-xoay.webm`, `sfx/thuy-xoay.mp3` (`tideSwirl`) |
| `6a822d23` (3,1 s) | vòng sáng xanh lục + dấu cộng | hồi máu, buff, tự tăng chỉ số (KHÔNG gồm tăng máu tối đa, giữ vòng cũ) | `fx/hoi-mau.webm`, `sfx/hoi-mau.mp3` (`heal`, gain +12 dB vì video rất nhỏ tiếng) |
| `03aa4a8f` (3,0 s) | khói độc lục | Thổi độc (CHƯA gắn) | |

Đo điểm phát lực (% khung video): xoáy nước (63; 51) lúc 1,1–1,5 s → `.tide-vid.is-rage { translate(-63%, -51%) }`; cột nước rơi (50; ~57) và nổ nước (50; ~55) nằm giữa ngang, cao hơn tâm lá khoảng 2% chiều cao bàn (giữ `translate(-50%, -78%)` vì vòng sóng đáy nằm ở ~85% khung).

## Lỗi đã mắc
- 06/11: chỉ gắn HÌNH, bỏ âm của video (`-an`), vẫn dùng âm nổ cũ. Sửa: mọi lần chèn VFX phải thay cả âm.
- 06/11: chủ game bảo "tự sắp xếp" mà gắn code luôn. Sửa: đề xuất, báo lại, chờ "ok".
- 06/11: nói "chưa chụp trong game". Sửa: chụp trước khi báo xong.
