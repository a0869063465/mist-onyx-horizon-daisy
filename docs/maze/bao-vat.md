# Bảo vật ngàn năm (mô tả sơ lược, chi tiết làm sau)

Trang bị: sâu, mất khi xong dungeon.
Vật phẩm không thể thiếu khi đi PvE: Chìa khoá.

| Bảo vật | Ảnh | Mô tả |
|---|---|---|
| Trò chơi | Puzzle vàng tam giác (ảnh 1, vị trí 1) | Bẻ khoá các chức năng ẩn của một số lá bài. Rút lá tuỳ ý, nhưng chỉ dùng được 3 lần. |
| Mắt | Mắt Wdjat (ảnh 1, vị trí 2) | Giống quả cầu Pokémon: hút quái thú để dùng lại trong PvE. Khi dùng lại, chỉ số thay đổi, thường yếu hơn quái đã bắt. |
| Trượng | Gậy có quả cầu xanh (ảnh 1, vị trí 3) | Điều khiển quái biến mất. Không nhận buff, tránh được trở ngại. Tác dụng còn ít, đang suy nghĩ thêm. |
| Cân | Cái cân (ảnh 1, vị trí 4) | Khi có rương, mở ngay hoặc bán lại. Đặt một số sao nhất định lên một bên, rương ở bên kia. Rương giá trị cao hơn thì nặng hơn và nghiêng về bên đó. Không giám định thì bán rương có rủi ro. Ngoài ra, cân tăng chỉ số nhận được khi đánh bại quái. |
| Dây chuyền | Mặt tam giác có gai (ảnh 1-2 dây chuyền) | Như radar, la bàn trong hầm ngục. Ba nút chọn: Quái, Rương báu, Phòng boss. Nút Quái: lần đầu chỉ hướng quái yếu nhất còn trong mê cung, nhấp tiếp là quái vừa, nhấp nữa là quái cao. Nếu quái yếu đã bị hạ hết thì tự chuyển sang quái vừa. Khi không còn quái nào ở cả ba cấp thì nút Quái biến mất. Đã bỏ mục "nguy hiểm". |
| Vòng cổ | Vòng có mắt ở giữa (ảnh 4) | Vật phẩm miễn phí theo sự kiện. Là con mắt trong hàng chờ skill của trận đấu (xem trước). |
| Chìa khoá | Ankh (ảnh 3) | Không có thì không thể đi PvE. Dùng để mở khoá map PvE cụ thể. |

AI: bố trí quái hợp lý; quái mạnh buộc người chơi phải nâng sức mạnh mới qua được.

## Khay bảo vật (ảnh tham khảo)
- Khay chỉ hiển thị 5 bảo vật: Dây chuyền, Trò chơi, Chìa khoá, Trượng, Cân.
- Mắt và Vòng cổ không nằm trong khay.

## Hiển thị Dây chuyền (chủ game mô tả)
- Trạng thái thường: mặt dây chuyền không có kim, chỉ có 4 mũi tên trắng có hiệu ứng chỉ về 4 hướng.
- Nhấp chọn một trong 3 nút (Quái, Rương báu, Phòng boss) thì mới chỉ đường về mục tiêu. Khi đó hiện kim (đánh số 1–5 từ trái sang phải):
  - Lên: kim 1 và 5.
  - Trái: kim 1 và 2, chĩa sang trái.
  - Phải: kim 4 và 5, chĩa sang phải.
  - Xuống: kim 2, 3, 4.
- Nhấp ra ngoài mà không phải một thao tác cụ thể (di chuyển, nhấp icon bảo vật) thì bỏ chọn nút.
- Khi bỏ chọn, các kim biến mất.

## Cách tính hướng của Dây chuyền
- Mục tiêu là cái gần nhất theo số bước (tính cả tường và cổng): quái yếu gần nhất, rương gần nhất. Boss thì theo đường ngắn nhất.
- Nhân vật luôn di chuyển từ từ đến giữa ô kế tiếp.
- Kim cập nhật và chỉ đường liên tục trong lúc nhân vật di chuyển.

## Cách làm Dây chuyền (chốt hướng)
- Bản đồ cố định, quái và rương đứng yên, điểm xuất phát cố định, nên tính khoảng cách một lần từ lúc nạp mê cung.
- Với mỗi mục tiêu (từng quái, từng rương, phòng boss) tính số bước từ mọi ô tới mục tiêu đó. Hướng chỉ = hướng sang ô kề có số bước nhỏ hơn.
- Rời khỏi lộ trình chính thì số bước tăng thêm đúng đoạn đi lạc, kim chỉ đường quay lại.
- Quái bị hạ, rương đã mở thì bỏ khỏi danh sách mục tiêu; chọn mục tiêu còn lại có số bước nhỏ nhất.

## Chọn mục tiêu của Dây chuyền (chốt)
- Giữ nguyên mục tiêu và hướng đang chỉ. Chỉ đổi khi mục tiêu khác có số bước nhỏ hơn hẳn.
- Khi đường ngắn nhất đi qua cổng đang đứng, kim hiện cả 4 hướng cùng lúc: kim 1 và 5 hướng lên, kim 2 hướng trái, kim 4 hướng phải, kim 3 hướng xuống. Báo hiệu "dùng cổng này".
