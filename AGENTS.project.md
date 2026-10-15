# Clash of the Beasts

Skill bị động lúc quái chớp cam: bấm quái, rồi bấm skill, là kích hoạt ngay. Không bắt kéo lên icon hay mục tiêu. Skill bị động thêm sau này cũng vậy.

Phòng ngự luôn là cả thủ và thủ phép. Không hiểu thành chỉ một trong hai. adef là phòng ngự, gồm cả def và mdef. def là thủ, mdef là thủ phép. Chữ trên lá bài vẫn viết tiếng Việt. Hội thoại với người chơi thì tiếng Việt.

Khi một lá phép chưa đủ điều kiện kích hoạt, kéo rê không hiện mục tiêu và không chọn được. Quy ước này cho mọi lá, không chỉ vài lá.

Chỉ số được buff hoặc tăng trên quái đang ở sân thì hiện màu xanh da trời, giống yêu tinh chúc phúc. Gồm công, thủ, thủ phép và máu.

Mọi buff và debuff đều làm tròn. Ví dụ tăng 1/3 của 2 là 2/3, làm tròn thành +1. Quy tắc này để dùng cho các hiệu ứng sau, không phải công thức riêng của phù thuỷ thời gian.

Lão hoá của phù thuỷ: đối thủ còn 1/3 chỉ số, làm tròn. Đồng minh tăng 40% chỉ số, làm tròn.

Hiệu ứng buff và tự tăng chỉ số cũng là hiệu ứng hồi máu. Số tăng bay lên và có vòng hồi máu, kể cả khi máu không đổi.

Buff tạm thì hiệu ứng hồi máu giữ liên tục trên đối tượng cho đến khi buff hết. Gồm giáp lá cà của kỵ sĩ bóng tối, phù hộ công của yêu tinh, và tăng chỉ số của chiến sĩ gặm nhắm.

Yêu tinh chớp cam khi đối thủ tấn công người chơi hoặc bất kỳ quái nào. Bấm vào lúc đang chớp thì hiện skill đỏ, không mở bảng thông tin.

Máu tối đa tăng bao nhiêu thì máu hiện tại tăng bấy nhiêu.

Khi tấn công mà hiến tế máu người chơi để tăng chỉ số, những chỉ số vừa hiến tế tự mất sau chiến đấu. Chỉ số đã cộng từ trước thì không mất.

Mỗi thay đổi người chơi thấy phải ghi thêm một dòng vào PENDING_NOTES trong src/lib/updates.ts. Dòng cũ ở trên, dòng mới ở dưới. Đủ 10 dòng thì trang Cập nhật tự mở phiên bản mới. Không chờ nhắc.

Trước khi làm, nếu chưa rõ 100% thì hỏi. Không tự ý thêm cơ chế, hiệu ứng hay cách hiểu mới.

Luôn dừng đột ngột việc đang làm nếu phát hiện vấn đề chưa rõ, và lập tức hỏi lại trước khi làm tiếp.

Trước khi bắt đầu chạy code, tìm hiểu vấn đề xem có gì mô tả:

1. Vấn đề được nói là báo lỗi hay là hướng muốn sửa. Hỏi lại nếu chưa rõ.
2. Mô tả đã dễ hiểu rõ 100% chưa.
3. Có gì bất thường không: kêu sửa đổi theo hướng sai, hoặc phi logic.

Hỏi lại thêm một lần nữa rồi mới làm.

Kiểm tra việc chạy có nguy cơ phức tạp và tốn thời gian không. Nếu có, hỏi thật kỹ để chạy suôn sẻ nhất.

Người chơi chỉ dùng bản xuất bản. Đổi lá bài thì tắt game vào lại là có hiệu lực. Không nhắc Reset, triệu hồi lại, hay quái đang trên bàn giữ chỉ số cũ.

Trong bản cập nhật, tên quái và tên skill phải ghi đủ đúng như trong game, dù người chơi có viết tắt. Tên đó phải khớp từng chữ để in màu: quái màu cam, phép và skill đúng màu của bảng thông báo.

Khách là người quyết định. Chưa rõ 100% thì hỏi trước khi làm. Không tự tách một câu trả lời thành hai luật. Không tự thêm cơ chế.

Quái không lao ra đỡ cho quái khác, trừ các trường hợp đặc biệt đã có trong game. Skill hoặc đòn đánh vào người chơi thì chặn được.

Khi chuyển hành động từ dạng này sang dạng kia, trước khi làm phải tách rồi hỏi nếu chưa chắc:

1. Nó có bao nhiêu phần?
2. Phần chuyển sang dạng mới có đầy đủ không? Nếu không, phần nào?

Ví dụ sừng lôi phá có 2 phần: buff công, rồi đòn đánh thường chuyển thành skill phép. Phần tấn công đó đầy đủ. Buff có 2 dạng: buff công (âm skill sát thương thường, hiệu ứng hồi máu) và buff hồi máu (âm hoá giải phép, hiệu ứng hồi máu).

Ví dụ phản kích có 3 phần: chặn đòn, khoá mục tiêu, đánh trả. Phần chuyển không đầy đủ. Chỉ lấy phần gây sát thương, tức phần nổ.

Đã chọn phần nào thì lấy đúng một gói hiệu ứng và âm thanh của phần đó trong mục tuỳ chỉnh. Không trộn, ví dụ không lấy âm lửa kèm hiệu ứng skill sát thương thường.

Quy tắc này chỉ cho skill và phép thêm sau này. Code phép và skill đã xây không đụng.

Việc bắt đầu rườm rà, hoặc phải tự thêm cơ chế để xử, thì dừng và hỏi. Không mất thời gian dài tự mò.

Mô tả trên lá là cho người chơi đọc, không phải lệnh để sửa code. Không tự sửa chữ mô tả. Chỉ số thì sửa luôn, không cần hỏi mô tả. Khi người chơi yêu cầu đổi skill thật, sửa code xong rồi mới đưa mô tả cũ để họ viết mô tả mới.

Người chơi nhắc một tình trạng là đang báo lỗi. Trái với logic đã có và biết cách đưa về thì sửa, không hỏi. Chưa chắc thì hỏi. Không biến báo lỗi thành luật mới.

Khi người chơi nói light packing, hoặc nói tên file gói nhẹ, xuất gói mới nhất để họ tải trên bản đã xuất bản.

Bảng chọn mục tiêu và các bảng chọn khác nằm dưới bảng thông báo, không che bảng đó. Nắm nền bảng thì kéo đi được.

Thông báo sát thương phép ghi số sau khi trừ thủ phép. Bị chặn hết vẫn ghi 0. Quái ẩn mình thì ghi "quái thú ẩn mình", không lộ tên, kể cả đòn lan.

Ô đếm trên quái là thông báo skill đặc trưng của quái. Chữ khống chế và bất lợi không đặt vào ô đó. Gương phòng hộ ghi "Suy".

Thông báo lúc đang dùng skill ghi đúng tên skill.

Hiến tế dùng một gói: hình là hiệu ứng nổ của phép lửa, âm là tiếng cười quỷ. Hiệu ứng đặt trên đúng đối tượng bị hiến. Kỵ sĩ bóng tối bấm Hiến Tế thì đối tượng là chính hắn. Quái 1-2 sao vừa triệu hồi bị ăn thì đối tượng là con đó.

Lá đứng yên là lá không đánh hoặc không chặn vì cơ chế in sẵn trên lá, không phải vì dính debuff. Hoa ăn thịt người, Kén ngài và Chân kén là lá đứng yên. Lá đứng yên không hiện chữ Cấm, không có hiệu ứng âm thanh hay hình ảnh của bất lợi, và không giải trừ được. Lá đứng yên thêm sau này chỉ cần đánh dấu đứng yên, không gắn tay từng lá.

Quái 5 sao là trường hợp đặc biệt. Cơ chế mới mà người chơi không đề cập tới quái 5 sao thì quái 5 sao không có cơ chế đó. Chỉ áp dụng tối đa đến quái 4 sao.
