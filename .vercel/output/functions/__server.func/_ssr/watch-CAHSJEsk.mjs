import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as tr, w as useLang, x as CopyText } from "./router-D9l-mBhf.mjs";
import { C as spellCard, _ as monsterCard, i as MONSTERS, r as FORMS, s as SPELLS, t as DECK_NOTES } from "./catalog-DOYBjZ9O.mjs";
import { t as CardFace } from "./card-face-C68Pz_14.mjs";
import { a as sortStrategies, i as sortCards, n as loadStrategies, r as saveStrategies } from "./strategies-CpEOr7ax.mjs";
import { a as exportStoredHistory, d as matchHistoryProblem, i as diagnoseHistory, l as loadHabits, r as clearHabits, t as Painted, v as watchLines } from "./habits-E9sSgm9g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watch-CAHSJEsk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** 1.1 đến 1.16, mục kế tiếp là 2.0. Rồi 2.1 đến 2.16, rồi 3.0. */
function nextVersion(current) {
	if (!current) return "1.1";
	const [major, minor] = current.split(".").map(Number);
	if (minor >= 16) return `${major + 1}.0`;
	if (minor === 0) return `${major}.1`;
	return `${major}.${minor + 1}`;
}
/** Mỗi mục đủ 10 thay đổi. Mới nhất đứng đầu. Trong mỗi mục, 1 là thay đổi mới nhất. */
var SEALED = [
	{
		version: "1.6",
		remark: "Bản này làm lại Phù thuỷ thời gian, buff hiện như hồi máu, và chỉnh sóng của Trái tim hải long.",
		notes: [
			{
				n: 1,
				text: "Đại thuỷ triều huỷ diệt dùng lại hiệu ứng Con nước lớn tàn phá bản trước, vẫn nổ trên từng kẻ địch."
			},
			{
				n: 2,
				text: "Yêu tinh chúc phúc chớp cam khi đối thủ đánh người chơi hoặc bất kỳ quái nào. Bấm vào hiện skill đỏ, không mở bảng thông tin."
			},
			{
				n: 3,
				text: "Buff tạm giữ hiệu ứng hồi máu liên tục đến khi hết: Kỵ sĩ bóng tối, Hỗ trợ +2 của Yêu tinh chúc phúc, Khiên thú sĩ của Chiến sĩ gặm nhắm."
			},
			{
				n: 4,
				text: "Buff và tự tăng chỉ số cũng là hiệu ứng hồi máu."
			},
			{
				n: 5,
				text: "Lão hoá của Phù thuỷ thời gian lên đồng minh tăng 40% chỉ số. Lên đối thủ còn 1/3 chỉ số."
			},
			{
				n: 6,
				text: "Mọi buff và debuff đều làm tròn. Chỉ số được buff hoặc tăng hiện màu xanh da trời."
			},
			{
				n: 7,
				text: "Phù thuỷ thời gian còn 2 skill. Lão hoá chọn 1 mục tiêu rồi mới hỏi cường hoá. Dòng chảy thời gian tốn 2 mana, trừ chính nó, cần 3 sao mới cường hoá đồng minh."
			},
			{
				n: 8,
				text: "Đấu sĩ bò tót đầy máu: 2 điểm chiến trận đều thành điểm dư. +1 máu tối đa thì máu hiện tại cũng +1."
			},
			{
				n: 9,
				text: "Khi có cả hai, hiệu ứng hồi máu nằm trên số máu mất bay lên."
			},
			{
				n: 10,
				text: "Rồng bọc trứng 0 công, 8 máu. Thế công +8 công. Thế thủ hết lượt hồi 3 máu."
			}
		]
	},
	{
		version: "1.5",
		remark: "Bản này chỉnh Yêu tinh chúc phúc, Hoán đổi, nhịp của máy, và hiệu ứng nước của Trái tim hải long.",
		notes: [
			{
				n: 1,
				text: "Yêu tinh chúc phúc chọn đồng minh, không còn ép chọn kẻ địch."
			},
			{
				n: 2,
				text: "Trái tim hải long: Triều lên là sóng nhỏ trên 1 con. Đại thuỷ triều huỷ diệt nổ riêng trên từng kẻ địch, không còn hiệu ứng chung."
			},
			{
				n: 3,
				text: "Đấu sĩ bò tót đầy máu: điểm hồi không vào được thành điểm dư."
			},
			{
				n: 4,
				text: "Hoán đổi và Phục kích vẫn chớp cam khi bàn không có quái."
			},
			{
				n: 5,
				text: "Hoán đổi: bấm Use mở bảng chọn 2 quái. Quái đang bị nhắm đổi thành quái được chọn."
			},
			{
				n: 6,
				text: "Máy suy nghĩ 2 giây trước mỗi hành động."
			},
			{
				n: 7,
				text: "Skill quái thú và Sấm sét tận thế có hiệu ứng sàn lưới."
			},
			{
				n: 8,
				text: "Kỵ sĩ bóng tối còn 4 công."
			},
			{
				n: 9,
				text: "Yêu tinh chúc phúc dùng Hỗ trợ +2: skill +2 sát thương, kéo đánh +2 công. Giữ đến khi đồng minh tấn công xong, hết lượt thì mất."
			},
			{
				n: 10,
				text: "Triệu hồi ác ma gây 5 sát thương phép."
			}
		]
	},
	{
		version: "1.4",
		remark: "Bản này sửa Cục bông ma quái khi chặn đòn, tiếng độc, và bảng Đã test.",
		notes: [
			{
				n: 1,
				text: "Trái tim hải long: bấm Triều lên rồi Không thì chọn 1 kẻ địch và gây 4 sát thương phép."
			},
			{
				n: 2,
				text: "Kazura còn 1 giáp."
			},
			{
				n: 3,
				text: "Tiếng độc chỉ còn một tiếng đầu, không phát cả ba tiếng."
			},
			{
				n: 4,
				text: "Cục bông trên tay giữ đúng cỡ lá, nút Use nằm dưới. Lao ra chặn thì đòn trúng nó, người chơi không mất máu."
			},
			{
				n: 5,
				text: "Chiến sĩ gặm nhắm lúc chớp cam: bấm quái rồi bấm Khiên thú sĩ là tự chặn, không cần kéo."
			},
			{
				n: 6,
				text: "Chớp cam có quầng sáng rộng hơn. Vào Tuỳ chỉnh, Hiệu ứng, mục Ửng sáng chớp cam để chỉnh kích thước."
			},
			{
				n: 7,
				text: "Cục bông ma quái không tự đỡ. Lúc bị tấn công thì chớp cam cùng Chiến sĩ gặm nhắm nếu đủ điều kiện. Bấm skill đỏ hoặc Use trên tay mới hiện bảng: bản thân chặn không tốn mana, bản sao chặn tốn 1 mana."
			},
			{
				n: 8,
				text: "Kazura cướp máu: phần đã hồi cho Kizuran thì mất khỏi số cam. Chỉ phần hồi không hết mới còn hiện trên Kizuran."
			},
			{
				n: 9,
				text: "Độc có tiếng riêng: sau skill nổ khoảng 1,15 giây, và lúc độc hoặc bào mòn nổ theo lượt."
			},
			{
				n: 10,
				text: "Mục Đã test có Quái, Phép, Testing và Tested. Bấm Quái hoặc Phép vào Testing, bấm Testing thì trả về. Nhấn giữ trong Testing mới sang Tested. Lá mới vẫn ở Quái và Phép."
			}
		]
	},
	{
		version: "1.3",
		remark: "Bản này thêm Chiến thuật, mục Đã test, và chỉnh vài lá phép phản đòn.",
		notes: [
			{
				n: 1,
				text: "Cục bông ma quái có thể nhân bản ra chặn, hoặc chính nó chặn hộ khi quái mình hay người chơi bị tấn công hoặc sát thương phép. Trên tay thì tự triệu hồi rồi nhân bản để chặn."
			},
			{
				n: 2,
				text: "Thông tin có mục Đã test, chọn lá như build deck, không giới hạn, quái xám vẫn chuyển được."
			},
			{
				n: 3,
				text: "Lá đã nằm trong một chiến thuật thì không còn trong kho bài."
			},
			{
				n: 4,
				text: "Chiến thuật mỗi mục một trang. Dưới có Trước và Sau, ngang hàng Xoá. Vào sửa phải nhấn giữ, thoát sửa chỉ bấm một lần."
			},
			{
				n: 5,
				text: "Thông tin có nút Xuất đỏ ở cuối trang. Lần sau chỉ xuất thông tin mới."
			},
			{
				n: 6,
				text: "Thông tin có mục Chiến thuật. Xếp từ nhiều lá đến ít lá, quái xếp theo sao."
			},
			{
				n: 7,
				text: "Hoán đổi: lá chớp cam và có ô Use đỏ bên dưới. Bấm Use rồi chọn 2 quái."
			},
			{
				n: 8,
				text: "Phù thuỷ thời gian mục 3 áp tất cả quái khác, cả hai bên."
			},
			{
				n: 9,
				text: "Sừng lôi phá không gắn dạng người, thiên thần, thiên sứ. Sau đòn Lan hoặc +3, đòn sau chỉ còn sát thương phép thường."
			},
			{
				n: 10,
				text: "Vòng nguyền rủa ác ma chặn đòn đang đánh và nguyền quái đó."
			}
		]
	},
	{
		version: "1.2",
		remark: "Bản này sửa các phép cho khớp mô tả, và xếp lại nút trong chế độ test.",
		notes: [
			{
				n: 1,
				text: "Mưa ma thuật gỡ hết trạng thái xấu của đồng minh."
			},
			{
				n: 2,
				text: "Phục kích dùng khi bị đánh vào quái hoặc vào người, mọi quái bên bạn đều làm được."
			},
			{
				n: 3,
				text: "Lá chắn phản đòn chuyển đòn kỹ năng sang một kẻ địch."
			},
			{
				n: 4,
				text: "Hấp thụ ma pháp chỉ nuốt lá phép đang thi triển."
			},
			{
				n: 5,
				text: "Sừng lôi phá gắn sừng: đòn đánh thành sát thương phép, có Lan và +3."
			},
			{
				n: 6,
				text: "Hoán đổi chọn hai quái, kể cả quái dự bị nếu đủ sao triệu hồi."
			},
			{
				n: 7,
				text: "Sợi xích địa ngục không còn nhân đôi sát thương, đưa cả thủ và thủ phép về 0."
			},
			{
				n: 8,
				text: "Ngài Khổng lồ nở ở lượt 4, Ngài Nữ hoàng ở lượt 5, Ngài tối thượng tự nở ở lượt 6. Mô tả lá đã sửa theo."
			},
			{
				n: 9,
				text: "Skill ghi tất cả quái thú chỉ trúng kẻ địch. Cả hai bên chỉ khi viết rõ cả 2 bên."
			},
			{
				n: 10,
				text: "Nút Reset ở bên trái, Test ở giữa, Trở về ở bên phải. Reset mờ khi không còn gì để đặt lại."
			}
		]
	},
	{
		version: "1.1",
		remark: "Bản này chỉnh kén, ngài, cách đếm lượt và chế độ test.",
		notes: [
			{
				n: 1,
				text: "Cập nhật và AI là hai mục riêng trong Thông tin."
			},
			{
				n: 2,
				text: "Trái tim hải long chỉ còn Triều lên. Hỏi hai cách: thêm 1 mana gây 5 và thêm một kẻ ngẫu nhiên, hoặc thêm 2 mana gây 6 lên cả hàng địch."
			},
			{
				n: 3,
				text: "Chân kén không tấn công, không chặn, không kéo đi. Lượt 4 và 5 bấm Kén ngài để chọn nở."
			},
			{
				n: 4,
				text: "Rời test rồi vào lại vẫn giữ ván. Thoát game, hoặc nhấn giữ Reset, mới bắt đầu lại từ đầu."
			},
			{
				n: 5,
				text: "Chế độ test có nút Trở về, nằm giữa Test và Reset, để quay lại trạng thái trước."
			},
			{
				n: 6,
				text: "Kizuran bật đỡ được kể cả khi đã hành động. Đòn nhắm Kazura chuyển sang Kizuran đang đỡ."
			},
			{
				n: 7,
				text: "Đếm lượt mặc định gồm cả lượt bạn và đối thủ. Tê 3 lượt là lượt hiện tại cộng hết 2 lượt sau."
			},
			{
				n: 8,
				text: "Kén ngài tự nở ở lượt 6. Lượt 4 và 5 mở bằng kỹ năng. Ngài vừa ra chưa hành động."
			},
			{
				n: 9,
				text: "Token không sao, như Chân kén, in tên màu xám."
			},
			{
				n: 10,
				text: "Choáng và đã hành động không còn hiệu ứng bất lợi kéo dài."
			}
		]
	}
];
/** Cũ ở trên, mới ở dưới. Đủ 10 dòng thì tự mở phiên bản mới. */
var PENDING_NOTES = [
	"Cập nhật đủ 10 thay đổi thì tự mở bản mới, không cần nhắc.",
	"Người chơi còn 16 máu, thay vì 20. Hồi máu không vượt quá 16.",
	"Chớp cam chỉnh riêng kích thước quầng và độ dày viền. Cả hai đều giữ.",
	"Lão hoá của Phù thuỷ thời gian: đối thủ còn 1/3 chỉ số. Đồng minh tăng 40% chỉ số. Cả hai làm tròn.",
	"Skill đỏ khi không có phép khác thì nằm giữa lá, và chớp glow đỏ.",
	"Mọi phép chớp cam đều có nút Use đỏ bên dưới, giống Hoán đổi.",
	"Hoán đổi khoá sẵn quái đang bị nhắm. Chỉ chọn thêm 1 quái rồi bấm OK.",
	"Lá chắn phản đòn bấm Use rồi chọn kẻ địch và OK. Gương phòng hộ, Lá chắn phản đòn và Phản nguyền có tiếng gương vỡ.",
	"Sợi xích địa ngục, Thanh gươm ánh sáng và Ngăn chặn phòng ngự có tiếng xích trói.",
	"Sợi xích địa ngục hiện icon xích trên thanh phản ứng. Quái bị trói có hiệu ứng tê, không hành động được.",
	"Sừng lôi phá gắn ngay, không lên thanh phản ứng. Tiếng lúc gắn là tiếng phát skill, không phải tiếng nổ.",
	"Phục kích chặn đòn trước, rồi chọn quái đánh lại và bấm OK. Icon và tiếng là xích, khoá chỉ chớp một nhịp.",
	"Thu hồi quái thú và Hoán đổi giữ cả trạng thái hiện tại của quái, không chỉ máu. Triệu hồi lại thì trạng thái đó trở về.",
	"Thêm Kẻ giám hộ linh hồn. Mỗi 6 máu người chơi đã mất thì tăng vĩnh viễn 1 công, 1 phòng ngự và 2 máu tối đa. Khi tấn công có thể hiến tế 2 máu, phần tăng đó mất sau chiến đấu. Sát thương từ công hồi máu cho người chơi.",
	"Thêm Mắt xanh huỷ diệt. Tiêu hao 1 mana, đòn tấn công tiếp theo thành tia sáng huỷ diệt, sát thương phép bằng đúng công như Sừng lôi phá. Hết đòn đó thì đánh thường lại.",
	"Lá chắn phản đòn ghi tên skill bị phản vào mục tiêu, không ghi tên quái đã thi triển.",
	"Tuỳ chỉnh có gói tiếng Anh. Bấm Tiếng Việt hoặc English để đổi toàn bộ chữ trong game, rồi bấm lại để về tiếng Việt.",
	"Âm xích lúc thi triển Sợi xích địa ngục, Thanh gươm ánh sáng và Ngăn chặn phòng ngự lấy lại tiếng xích cuối, vì đoạn cũ bị câm.",
	"Sừng lôi phá không nhận mục tiêu không gắn được. Dạng người, thiên thần và thiên sứ không được chọn.",
	"Sấm sét tận thế hiện icon đầu lâu trên thanh phản ứng. Chỉ phép và skill tiêu diệt mới dùng icon này: Sấm sét tận thế, Lão hoá cường hoá và Dòng chảy thời gian của Phù thuỷ thời gian.",
	"Phép chậm có nút Use đỏ bên dưới trên lượt của bạn. Sấm sét tận thế, Mưa ma thuật, Thanh gươm ánh sáng và Thu hồi quái thú bấm là thi triển. Sợi xích địa ngục và Phản nguyền bấm Use rồi chọn quái đối thủ.",
	"Ong khổng lồ gây tê liệt 5 lượt, thay vì 3.",
	"Hấp thụ ma pháp, Mưa ma thuật và Vòng xoáy bảo hộ dùng tiếng giải trừ.",
	"Phản nguyền chỉ hiện và chọn quái đang mang trạng thái xấu. Quái không có trạng thái xấu không được chọn.",
	"Tê liệt và xích thì bấm vào quái không hiện tấn công hay skill. Cấm tấn công thì ẩn nút tấn công, skill vẫn hiện.",
	"Phản nguyền chọn đồng minh đang mang trạng thái xấu trước, rồi chọn quái đối thủ để chuyển sang. Thời gian đếm lại từ đầu nếu biết mốc ban đầu.",
	"Triệu hồi không còn chớp sáng của phép. Dòng thông báo trước đó bị gắn nhầm như một lá phép.",
	"Nút Use trên lá phép chỉ hiện khi lá đó dùng được. Thiếu mana, thiếu mục tiêu, hoặc lượt đầu chưa được nhắm đối thủ thì không hiện.",
	"Sợi xích địa ngục khi kéo hay bấm Use đều chỉ chọn được quái đối thủ. Kéo vào đồng minh hay thanh phản ứng thì không ăn.",
	"Kỹ năng gây sát thương có tiếng mở đầu ngay khi thi triển. Trước đó chỉ vài con có tiếng này, còn lại gần như im đến lúc đòn nổ.",
	"Sừng lôi phá có nút Use khi có quái gắn được. Bấm Use rồi chọn quái đó. Người, thiên thần và thiên sứ không hiện.",
	"Sấm lôi phá: quái mang sừng giữ nguyên kỹ năng. Lượt gắn sừng, lần kéo vào quái địch đầu tiên chọn Lan hoặc +3 rồi bấm OK. Đối thủ thấy đó là kỹ năng sát thương.",
	"Mưa ma thuật và các phép giải trừ nổ ngay. Không lên thanh phản ứng, đối thủ không phản được.",
	"Sợi xích địa ngục bấm Use thì viền mục tiêu xanh chuối, giống hệt lúc kéo rê.",
	"Lá chắn phản đòn, Hấp thụ ma pháp, Ngăn chặn phòng ngự và Phục kích khi chưa đủ điều kiện thì kéo rê không hiện mục tiêu và không chọn được.",
	"Lá chắn phản đòn, Gương phòng hộ và Phản nguyền hiện icon mũi tên trên thanh phản ứng. Mũi tên lao tới rồi bay ngược lại.",
	"Mưa ma thuật gỡ trạng thái xấu thì hiện hiệu ứng hồi máu trên quái đó, kể cả khi quái đã đầy máu.",
	"Hấp thụ ma pháp ghi đúng tên lá bị nuốt, không ghi chung là lá phép.",
	"Trong Đã test, ấn giữ lá ở Testing thì sang Test 2. Bấm Testing lần nữa để xem Test 2. Bấm lá Test 2 thì ghi chú, bấm lại thì ẩn. Ấn giữ lá Test 2 mới sang Tested.",
	"Mọi lá phép chưa đủ điều kiện thì kéo không hiện mục tiêu và không dùng được. Hoán đổi cũng vậy, không còn viền mục tiêu khi chưa có quái bị nhắm.",
	"Tê liệt của Ong khổng lồ là đòn trói. Có tiếng xích và icon xích. Lá chắn phản đòn không phản được.",
	"Icon phản đòn trên thanh phản ứng là mũi tên tĩnh: đi sang phải rồi quay lại. Giữ màu hồng, không còn chạy.",
	"Icon phản đòn tô rõ hai đầu mũi tên: đầu lớn bay sang phải, đầu nhỏ bên trái là đòn bị phản lại.",
	"Bấm Use một lá phép thì lá bên cạnh không bị bấm nhầm khi hàng bài xê dịch.",
	"Thanh gươm ánh sáng hiện icon sợi xích trên thanh phản ứng khi đang thi triển.",
	"Quái bị khống chế thì mờ, kể cả sau Thanh gươm ánh sáng. Ô đếm hiện số lượt còn lại, hoặc ∞ nếu trói vĩnh viễn, thay cho chữ Tê.",
	"Nguyền rủa và độc cũng hiện số lượt còn lại, hoặc ∞ nếu vĩnh viễn. Nền ô là xanh chuối.",
	"Lá chắn phản đòn phản xong thì đối phương được phản ứng. Đòn chỉ nổ khi họ không chặn tiếp.",
	"Chiến sĩ gặm nhắm và Đấu sĩ bò tót gắn được Sừng lôi phá. Đòn sừng khi lao vào có tiếng skill phép, không còn mất tiếng.",
	"Icon phản đòn chỉ hiện một lần. Dùng hình mũi tên hồng gãy, đầu chỉ lên.",
	"Mỗi lần phản thêm một mũi tên hồng. Phản nguyền hiện mũi tên ngay khi đối phương còn phản ứng. Bấm OK thì icon biến hết, không sót lại.",
	"Mọi skill hoặc phép đang chọn mục tiêu dùng viền xanh đọt chuối, không còn viền cam.",
	"Sấm lôi phá đứng yên bắn, không lao vào. Thông báo in màu kỹ năng và ghi số sát thương phép. Bỏ chớp sáng phủ bàn khi skill, triệu hồi và hiệu ứng khác.",
	"Vòng nguyền rủa ác ma chặn cả skill gây sát thương của quái thú, rồi nguyền đúng con vừa thi triển. Không chỉ chặn đòn đánh thường.",
	"Tê liệt của Ong khổng lồ hiện ô đếm số lượt. Chữ trong các ô đếm bất lợi to hơn.",
	"Thanh phản ứng nằm dọc, icon canh giữa. Icon đầu ở giữa, icon sau nằm dưới và đẩy icon trước lên. Bảng thông báo vẫn hiện khi thanh phản ứng mở.",
	"Skill sát thương bị Lá chắn phản đòn vẫn nổ tiếng phép và hiệu ứng nổ trên quái trúng đòn. Không còn chớp sáng phủ cả bàn.",
	"Bỏ hết tiếng tút tổng hợp. Skill sát thương bị phản vẫn giữ tiếng nổ. Kiếm sĩ lửa thiêng, cầu lửa giữ tiếng lửa. Ngài giữ tiếng độc.",
	"Thông tin thêm mục Nghiệm thu. Mỗi lần chat sau là một ô. Dòng đầu là tên ô, phần dưới là nội dung.",
	"Lửa, nước và sét chuyển khỏi mục Phép sang mục 10. Skill đặc biệt. Kiếm sĩ lửa thiêng và cầu lửa của Rồng phun hoa cầu dùng lửa. Triều lên, Con nước lớn tàn phá và Đại thuỷ triều huỷ diệt của Trái tim hải long dùng nước. Sấm lôi phá dùng sét. Độc và sét giữ đúng file gif gốc.",
	"Bỏ mục Nghiệm thu khỏi Thông tin.",
	"Phù thuỷ tí hon và Triệu hồi ác ma nổ đúng hiệu ứng mục 6. Phép lúc đòn trúng, kể cả khi thủ phép chặn hết. Bỏ chớp đỏ trên quái và chớp trắng thừa.",
	"Chế độ test lấy đúng phía đang nhìn để vẽ hiệu ứng và số máu. Lật bàn, Trở về hoặc giữ Reset thì xóa hiệu ứng sót.",
	"Vòng nguyền rủa ác ma khi đối phương hết phản ứng sẽ chặn đòn, nguyền quái thi triển và báo lên bảng. Quái hiện ô nguyền ∞.",
	"Kẻ giám hộ linh hồn còn 2 công, phòng ngự 0, 4 máu. Mỗi 4 máu người chơi đã mất thì tăng vĩnh viễn 1 máu tối đa. Hiến tế thêm 1 công, mất sau chiến đấu.",
	"Trong Đã test, bỏ nút Test 2. Ấn giữ lá ở Testing thì sang Tested. Nút Xuất hiện Đã lưu khi phần xuất có thông tin thay đổi.",
	"Phần Xuất thêm mục Đã lưu khi lá trong Đã test đã bấm Lưu có thay đổi. Mục này ghi lá đang ở Testing và lá ở Tested.",
	"Tuỳ chỉnh thêm mục Hiệu ứng lá bài, ngoài mục Hiệu ứng. Bấm quái hiện skill, bấm skill chọn Lửa, Sét hoặc Phép thường. Phép hiện chọn ngay. Nước của Trái tim hải long không nằm trong danh sách này. Vào lại trận thì hiệu ứng mới có tác dụng. Cuối trang có nút Xuất thay đổi.",
	"Hiệu ứng Sét và độc hiện đúng file gif gốc, không pha màu và không làm mờ.",
	"Lá phép không huỷ diệt và không gây sát thương có thêm ô Không trong Hiệu ứng lá bài. Sấm sét tận thế, Phục kích và Virus ăn mòn vẫn có hiệu ứng. Sừng lôi phá vẫn là Sét.",
	"Hiệu ứng lửa chỉ hiện lúc phép nổ. Lúc cast thì không hiện.",
	"Icon đầu lâu trên thanh phản ứng đổi sang hình mới.",
	"Vòng nguyền rủa ác ma giảm một nửa sát thương phép do quái bị nguyền đánh ra.",
	"Gương phòng hộ ghi Suy cùng chỗ khống chế trên quái tấn công, không ghi vào ô đếm. Ô đếm là thông báo skill đặc trưng của quái.",
	"Thu hồi quái thú không hiện chữ Hạ. Quái bị thu về không bị hạ.",
	"Mô tả Thu hồi quái thú viết lại đúng thứ tự: thi triển trước, nổ sau, thu quái và phép, trộn, rút 2 quái vào dự bị.",
	"Thanh gươm ánh sáng cấm tấn công 5 lượt và làm hiện hình mọi quái đang ẩn.",
	"Quái được Thanh gươm ánh sáng hiện hình chỉ hiện đúng số lượt còn trên ô đếm. Hết thì ẩn lại.",
	"Thu hồi quái thú là phép tức thì, tiếng giải chú, không mở phản ứng. Thu quái và phép, rút đúng số đã thu, rồi chọn quái ra sân theo sao đã thu. Quái 4 sao tốn thêm 1 mana.",
	"Phục kích chỉ cộng 2 công trong đòn đánh lại. Hết giao tranh thì mất. Đòn đó có tiếng đánh thường dù không kéo rê.",
	"Sừng lôi phá lúc Use vào quái dùng tiếng thi triển phép thường, không dùng tiếng phép lửa.",
	"Sấm sét tận thế lúc Use có tiếng phát động phép thường. Lúc nổ có hiệu ứng phép thường. Lỗi này xảy ra ở mọi chế độ, không chỉ test.",
	"Hiệu ứng sét xoá nền đen, chỉ còn tia sáng.",
	"Thông báo khi dùng skill ghi đúng tên skill, không còn câu đứng yên bắn tia.",
	"Bảng chọn mục tiêu và các bảng chọn khác nằm dưới thông báo, không che bảng thông báo. Nắm nền bảng là kéo đi được.",
	"Thông báo sát thương phép ghi số máu gây ra sau khi trừ thủ phép. Thủ phép chặn hết thì vẫn báo 0.",
	"Phép lửa không nổ khi đòn bị vòng nguyền chặn, không cháy lên quân tự hao máu. Đòn thêm dùng âm nổ của skill lửa, không phải phép thường.",
	"Cầu lửa địa ngục của Mắt đỏ tàn phá tốn 1 mana. Chọn được quái hoặc người chơi. Đánh vào người thì chặn được. Vào quái thì không có chặn thường. Sát thương vật lý là 4.",
	"Tia sáng huỷ diệt dùng trọn gói skill phép. Cầu lửa địa ngục dùng trọn gói skill lửa.",
	"Tia sáng huỷ diệt lúc bấm là buff công: âm phát động skill sát thương thường và hiệu ứng hồi máu. Phần đánh vẫn là skill phép.",
	"Kỵ sĩ bóng tối có Hiến Tế, tốn 1 mana. Mất công và phòng ngự, không đánh, không skill, không chặn trong 5 lượt. Quái 1-2 sao bạn triệu hồi trong các lượt đó bị hiến tế. Hết lượt thứ 5 thành Chiến binh huyền thoại.",
	"Hiến tế có tiếng cười quỷ và hiệu ứng nổ của phép lửa trên đúng con bị hiến. Kỵ sĩ bóng tối nổ trên chính hắn. Quái 1-2 sao bị ăn thì nổ trên con đó.",
	"Hiệu ứng nổ lửa hiện ngay, không còn khoảng tối đầu trước khi lửa bốc lên.",
	"Lá bị hạ không biến mất ngay. Đòn thường chờ 0,4 giây. Nước và phép sát thương thường chờ 0,2 giây. Lửa và skill sát thương thường chờ 0,4 giây. Độc và bào mòn không chờ. Rồi lá mờ đi trong 0,3 giây. Chữ Hạ hiện lúc bắt đầu mờ. Số sát thương vẫn hiện ngay cả khi quái bị hạ.",
	"Đòn đánh thường: hiệu ứng hạ chờ 0,6 giây, trễ thêm 0,2 giây. Nước, phép, lửa, skill, độc và bào mòn giữ nguyên.",
	"Kỵ sĩ bóng tối đang Hiến Tế: quái 1-2 sao ra sân ở chế độ test cũng bị hiến tế.",
	"Kỵ sĩ bóng tối đang Hiến Tế không chọn chỉ số khi bị đánh. Cuối lượt Hiến Tế hiện số hồi máu và vòng hồi máu, kể cả khi máu đã đầy.",
	"Kỵ sĩ bóng tối đếm Hiến Tế theo lượt chung, không theo lượt của người giữ quái. Đang Hiến Tế thì cuối lượt hồi máu. Hết Hiến Tế thì không hồi.",
	"Kỵ sĩ bóng tối đang Hiến Tế thì cuối lượt hồi máu. Thành Chiến binh huyền thoại vẫn hồi tiếp theo số quái đã hiến tế.",
	"Kỵ sĩ bóng tối thành Chiến binh huyền thoại thì hồi đầy máu và gỡ hết trạng thái xấu, giống Mưa ma thuật. Có tiếng giải trừ và vòng hồi máu.",
	"Chữ trên lá được cập nhật: Kỵ sĩ bóng tối, Yêu tinh chúc phúc, Triệu hồi ác ma, Gã hề đáng sợ, Phù thuỷ tí hơn, Trái tim hải long, Sứa hút ma pháp, Kizuran, Ngài Nữ hoàng, Ngài tối thượng, Lá chắn phản đòn, Sừng lôi phá, Phục kích, Hoán đổi, Thu hồi quái thú, Virus ăn mòn.",
	"Chiến binh huyền thoại có 5 máu gốc, thêm 1 so với trước.",
	"Kho ảnh thêm tám chân dung: Pháp sư gương, Chiến rồng, Rồng xương, Quái đồng hồ, Tủ sắt, Rồng thép, Kẻ đào mộ, Người máy vàng.",
	"Kho ảnh thêm sáu chân dung: Máy liềm, Rồng con, Hiệp sĩ gậy, Nhện máy, Rồng súng, Hàm gai.",
	"Kho ảnh thêm hai chân dung: Hoa ăn thịt, Tiên giáp.",
	"Kho ảnh thêm bốn chân dung: Cánh hồng, Rồng xích, Cánh lam, Cánh trắng.",
	"Thêm Hoa ăn thịt người. 1 sao, 0 ngọc, 0 công, 3 thủ, 0 thủ phép, 3 máu. Không đánh thường, không chặn. Skill cướp tối đa 2 máu tối đa của đối thủ cộng vào Hoa, rồi đối thủ đánh thường vào Hoa.",
	"Thêm hiệu ứng Súng. Lúc phát có tiếng đầu nòng, không có hình. Lúc nổ có tiếng súng và hình nổ lửa.",
	"Thêm Thương quản long. 4 sao, 1 ngọc, 6 công, 1 thủ, 3 thủ phép, 5 máu. Cò quay tốn 1 mana, ba nòng 45%.",
	"Ô đếm trên sân căn trái. Từ 2 ký tự thì ẩn tên quái. Nền ô vẫn trong suốt.",
	"Tích luỹ của Gã hề đáng sợ có lại tiếng năng lượng.",
	"Lộ diện có tiếng buff hồi máu. Hộ thủ, Thăng cấp, Nở và Ăn thịt lúc bấm có cả hình và tiếng hồi máu. Khiên thú sĩ có tiếng buff khiên. Hỗ công có tiếng phát của skill sát thương thường.",
	"Phù thuỷ thời gian có tiếng đồng hồ. Dòng chảy thời gian lấy đoạn đầu. Lão hoá lấy đoạn giữa. Lão hoá cường hoá lấy đoạn cuối.",
	"Rồng bọc trứng: thế thủ dùng tiếng khiên, thế công dùng tiếng phát của skill sát thương thường.",
	"Vì Anh Em và Hoá kén dùng tiếng khiên.",
	"Thêm Kẻ đào mộ. Phép 0 ngọc. Đào một quái hoặc phép đối thủ đã rời sân. Quái vào dự bị, phép lên tay. Bản sao lúc dùng tốn thêm 1 ngọc trên quả cầu. Lá 3 ngọc thì quả cầu trả 3 và bình trả thêm 1.",
	"Thêm Máy ném bom hình nhện. 3 sao, 0 ngọc, công 5, thủ 1, thủ phép 3, máu 5. Súng phóng lựu tốn 1 mana, 6 quả sát thương chuẩn.",
	"Thêm Cỗ máy thời gian. Phép 0 ngọc. Khi đồng minh bị chọn làm mục tiêu, bấm Use trên thanh phản ứng để đưa quái đó về trạng thái đầu lượt chung trước.",
	"Thêm Giáp cơ khí. Phép 0 ngọc. Khi skill đối phương nhắm một đồng minh, bấm Use để tăng 2 công và 2 thủ phép vĩnh viễn. Công sau khi tăng cao hơn đòn thì phản nguyên đòn về quái ra đòn.",
	"Thêm Khổng lồ 1 mắt. 1 sao, 0 ngọc, công 3, thủ 4, thủ phép 0, máu 1. Không có kỹ năng.",
	"Thêm Mũ ma pháp. Phép 0 ngọc. Che sân bằng mũ. Đối phương chỉ thấy mũ. Đổi chỗ khi triệu hồi và đầu lượt chung. Hết khi còn 1 mũ che đúng 1 quái thật.",
	"Ba skill của ngài phải chọn 1 quái trước khi thổi độc. Đại thuỷ triều của Trái tim hải long chọn 2 quái, không quét hết từ đầu.",
	"Thêm Máy quay thưởng. Quay một lần mỗi lượt, không mất hành động. 2 ô giống nhận thưởng, 3 ô thì mạnh hơn. Con bạc nổi giận tính số lần trượt.",
	"Thêm Rồng con và Rồng ngàn tuổi. Rồng con là quái bất tử. Dòng chảy thời gian tiến hoá nó thành Rồng ngàn tuổi. Hơi thở rồng tốn 1 mana, gây sát thương chuẩn và sát thương phép lên 1 quái địch.",
	"Thêm Chiến binh rồng. 3 sao, 0 ngọc, công 5, thủ 2, thủ phép 2, máu 8. Không có kỹ năng. Sát thương nhận vào chia 3 trước phòng ngự: một phần ngay, hai phần vào đầu 2 lượt chung sau. Số 0 không hiện.",
	"Thêm Máy chém. 1 sao, 0 ngọc, công 4, thủ 0, thủ phép 4, máu 3. Không có kỹ năng.",
	"Thêm Ma đạo sĩ. 3 sao, 0 ngọc, công 2, thủ 3, thủ phép 1, máu 5. Ma đạn tốn 1 mana, 3 phát sát thương phép vào 1 quái hoặc người chơi.",
	"Thêm Lời nguyền của rồng. 3 sao, 0 ngọc, công 4, thủ 1, thủ phép 3, máu 4. Địa ngục lửa tốn 0 mana. Chọn 1 quái địch để xét phản đòn, rồi 2 sát thương chuẩn lên mọi quái địch. Không trúng người chơi.",
	"Máy quay thưởng kêu lúc ô cuối dừng. Trúng thưởng có tiếng thắng. Trúng số 6 có tiếng thua.",
	"Tiếng số 7 dài khoảng 2,7 giây. Quay 777 khi đang đầy máu cộng đủ 6 máu tối đa: 3 máu dư và 3 máu cường hoá.",
	"Thanh phản ứng mặc định rộng 20. Ô đếm trên sân mặc định nằm ở x 57.1, rộng 96.",
	"Cuối trang Quái thú và Phép trong dựng bộ bài có thống kê. Quái đếm theo sao, Ngoài bộ để riêng. Phép đếm Môi trường, Khống chế từ 2 lượt, Phản đòn, Hoá giải và Tổng. Trang Deck không có.",
	"Khủng long vãy kiếm còn 2 sao, 1 mana, công 1, thủ phép 0, máu 5.",
	"Lính chiến đá khổng lồ còn 2 sao, công 1, máu 8.",
	"Yêu tinh chúc phúc còn 2 sao, 1 mana, máu 3.",
	"Thỏ đen tinh nghịch, Máy chém, Hoa ăn thịt người và Khổng lồ 1 mắt còn 1 mana.",
	"Mỗi lượt, cả hai người chơi đều nhận 1 mana, không chỉ người đang đến lượt.",
	"Cập nhật mô tả mặc định của Phù thuỷ thời gian, Chiến sĩ gặm nhắm, Triệu hồi ác ma, Mộ voi ma mút, Gã hề đáng sợ, Thỏ đen tinh nghịch, Cục bông ma quái, Quái thú thiên sứ, Tê giác bé con, Phù thuỷ tí hơn, Sâu non, Kraken, Kazura, Kizuran, Hoa ăn thịt người, Thương quản long, Máy quay thưởng, Chiến binh huyền thoại, Kén ngài, Ngài Khổng lồ, Ngài Nữ hoàng và Ngài tối thượng.",
	"Âm thanh mặc định là 100 khi chưa chỉnh.",
	"Tích sao tốn 1, 3, 5, 7 mana cho 1 đến 4 sao. 4 sao là tối đa.",
	"Đủ 4 sao thì ẩn số mana thừa.",
	"Súng phóng lựu của Máy ném bom hình nhện nổ lửa trên mọi mục tiêu trúng đòn, kể cả mục tiêu phụ.",
	"Cò quay của Thương quản long nổ lửa trên các quái trúng đòn. Người chơi không trúng đòn thì không nổ lửa trên người chơi.",
	"Súng phóng lựu của Máy ném bom hình nhện còn 5 loạt. Số sát thương trên mục tiêu nhảy theo từng loạt, không cộng thành một tổng.",
	"Con bạc nổi giận của Máy quay thưởng nổ lại hiệu ứng hình ảnh, không chỉ còn tiếng nổ.",
	"Hoa ăn thịt người không còn hiện chữ Cấm trên sân. Vẫn không đánh thường và không chặn đòn.",
	"Máy quay thưởng còn công 4.",
	"Địa ngục lửa của Lời nguyền của rồng dùng âm và hình lửa. Lửa nổ trên mọi quái trúng đòn, không chỉ mục tiêu được chọn.",
	"Bỏ hình độc đang che quái trên sân. Độc vẫn gây sát thương và vẫn hiện số lượt.",
	"Chiến binh rồng còn máu 6. Góc trái hiện đủ vật lý, phép và chuẩn, mỗi loại đúng vị trí. Không có loại nào thì ẩn loại đó.",
	"Cỗ máy thời gian bấm Use là dùng được khi đồng minh đang bị nhắm. Đưa quái về đầu 3 lượt chung trước.",
	"Cỗ máy thời gian: quái triệu hồi sau đầu 3 lượt chung trước thì về đúng lúc vừa triệu hồi.",
	"Ma đạn của Ma đạo sĩ nổ 3 lần liên tiếp, mỗi phát một nhịp, không gom một lần.",
	"Giáp cơ khí bấm Use là dùng được khi kỹ năng đối phương nhắm một đồng minh.",
	"Mũ ma pháp bấm Use được trong lượt của bạn, khi trên sân còn quái thật.",
	"Virus ăn mòn mỗi lần chọn ngẫu nhiên một quái. Dự bị và sân cập nhật máu ngay. Hết máu thì bị loại. Quái trong bộ bài vẫn được nêu tên.",
	"Quái dự bị và phép trên tay hiện tối đa 3 lá. Kéo ngang để xem lá bị khuất. Kéo lên vẫn dùng lá đó.",
	"Hỗ trợ của Yêu tinh chúc phúc cộng đúng +2 công vào đòn kéo đánh.",
	"Lính chiến đá khổng lồ có Tường thành: tốn 1 mana đỡ đòn thường hoặc kỹ năng gây sát thương cho đồng minh. Chỉ đỡ 2 lần, tính cả skill.",
	"Sấm sét tận thế gây sát thương chuẩn bằng 2 cộng số sao hiện có, lên mọi quái trên sân.",
	"Bảng thông báo kéo lên xuống được khi chữ dài hơn khung.",
	"Skill đánh nhiều mục tiêu: tên skill ở giữa, mỗi mục tiêu một dòng canh trái.",
	"Đại thuỷ triều huỷ diệt chỉ chọn 1 quái, gây sát thương lên mọi kẻ địch. Skill nước nhiều mục tiêu không hiện hình lúc phát.",
	"Mọi thông báo canh trái.",
	"Bảng thông báo: sát thương vật lý màu vàng, sát thương chuẩn màu xám.",
	"Nút skill không còn đè lên quái thứ 3. Ô thứ 3 của mình và địch nhận được kéo thả và bấm.",
	"Đòn thêm ghi rõ dùng lên quái nào.",
	"Sấm sét tận thế chỉ gây sát thương chuẩn lên mọi quái địch, và hiện icon skill gây sát thương.",
	"Giáp cơ khí phát âm phản khi skill bị phản lại.",
	"Bảng thông báo nới lề, chữ không còn sát mép.",
	"Mọi skill khi thi triển đều ghi dùng lên quái hoặc người chơi đang bị nhắm.",
	"Bảng thông báo mặc định rộng 70, lệch trái còn 8.7.",
	"Phù thuỷ thời gian: Lão hoá thường tăng 35% chỉ số đồng minh từ 2 sao trở xuống, và giảm 35% chỉ số kẻ địch. Không chọn kẻ địch bất tử. Cường hoá không cần 3 sao. Bấm Quay, 2 ô giáp đỏ là trúng, 4 ô đầu lâu là trượt. Trượt thì Phù thuỷ thời gian tự huỷ, mục tiêu không đổi. Trúng thì tiêu diệt kẻ địch thường, kể cả Tê giác bé con, cường hoá quái bất tử, tiến hoá đồng minh đặc biệt đến dạng cuối. Đồng minh thường không đổi. Đồng minh thường từ 3 sao được hỏi trước khi quay. Dòng chảy thời gian tốn 1 mana và cũng quay. Trúng thì quét cả sân trừ chính Phù thuỷ thời gian: kẻ địch thường bị tiêu diệt, quái bất tử bị cường hoá, đồng minh dưới 3 sao được cường hoá, đồng minh khác không đổi.",
	"Chiến binh rồng: ba số góc trái trên dùng đúng cỡ chữ của ô số đếm. Cam, tím, trắng giữ đúng chỗ. Loại không có thì ẩn, loại còn lại không dồn.",
	"Bấm quái trên sân để xem mô tả. Mô tả dài như Máy quay thưởng thì kéo xuống được.",
	"Bình dưới quả cầu mana chứa tối đa 1. Dòng chảy thời gian của Phù thuỷ thời gian tốn 2 mana.",
	"Cò quay của Thương quản long hiện trên máy của Máy quay thưởng. Ba ô xáo súng cam, súng tím và súng trắng, lúc chờ là ???. Kéo thì mỗi ô ra súng 45% hoặc trống 55%. Trúng từ 2 súng có âm thưởng vừa. Nòng trúng vẫn bắn ngẫu nhiên như cũ.",
	"Rồng bọc trứng còn 3 sao, tốn 1 mana. Thế công +4 công.",
	"Rồng ngàn tuổi nằm ngoài bộ, tiến hoá từ Rồng con. Rồng con là quái bất tử. Phù thuỷ thời gian lão hoá cường hoá hoặc Dòng chảy thời gian thành công thì biến Rồng con thành Rồng ngàn tuổi.",
	"Vòng quay của Phù thuỷ thời gian: ô giáp đỏ to gấp đôi ô đầu lâu. Trúng 50%.",
	"Phù thuỷ thời gian triệu hồi thêm một lần mỗi lượt, không tính vào lượt triệu hồi thường.",
	"Hiệu ứng lửa của skill nổ phía trước lá bài.",
	"Phù thuỷ thời gian lão hoá đồng minh thường không có tác dụng thì không hiện bảng chọn.",
	"Lão hoá đồng minh thường dưới 3 sao báo: Lão hoá trưởng thành hoá tên quái, tăng 35% chỉ số.",
	"Dòng chảy thời gian báo quét cả sân, rồi liệt kê tiêu diệt, tiến hoá và làm trưởng thành từng quái.",
	"Dung hợp: một lá trên tay và một lá trên sân chớp tím đỏ trong 5 giây. Kéo lá trên tay vào lá trên sân thì hỏi hợp nhất. Ok thì hai lá bay vào giữa, loé sáng, rồi xem mô tả lá kết quả. Bấm Ok hoặc giữ kéo lá đó vào ô.",
	"Kỵ sĩ bóng tối hợp với Lời nguyền của rồng thành Kỵ sĩ cưỡi rồng, ngoài bộ. 5 sao, 0 ngọc, công 6, thủ 3, thủ phép 3, máu 8. Đòn đánh có ít nhất 4 sát thương chuẩn, phần còn lại là vật lý. Sáp lá cà thì các quái địch khác chịu 2 sát thương chuẩn.",
	"Kỵ sĩ cưỡi rồng báo: dùng Mũi thương bị nguyền rủa lên tên quái, ghi sát thương vật lý và sát thương chuẩn, rồi Lửa địa ngục 2 sát thương chuẩn lên các quái còn lại.",
	"Thông báo của Kỵ sĩ cưỡi rồng tô Mũi thương bị nguyền rủa và Lửa địa ngục đúng màu skill.",
	"Kỵ sĩ cưỡi rồng: hiệu ứng lửa nổ sớm hơn 1 giây, âm phát của lửa sớm hơn 0,7 giây so với âm phát đánh thường.",
	"Kỵ sĩ cưỡi rồng: hiệu ứng lửa nổ trễ thêm 0,4 giây. Âm phát của lửa trở lại cùng lúc với âm phát đánh thường.",
	"Kỵ sĩ cưỡi rồng bỏ khoảng 0,4 giây đầu của âm phát lửa.",
	"Kỵ sĩ cưỡi rồng: hiệu ứng lửa lúc nổ sớm hơn 0,2 giây.",
	"Kỵ sĩ cưỡi rồng: âm lửa lúc nổ vào lúc 0,512 giây, trùng khi phát cùng âm nổ đánh thường.",
	"Quái đánh vào Kỵ sĩ cưỡi rồng cũng chịu đúng chuỗi hiệu ứng và âm thanh như lúc kỵ sĩ chủ động đánh.",
	"Rồng ngàn tuổi: Hơi thở rồng còn 3 sát thương chuẩn và 4 sát thương phép.",
	"Tuỳ chỉnh mô tả skill và phép: chỉnh cỡ chữ, in đậm và gạch chân.",
	"Dung hợp phát âm thanh riêng lúc hai lá bay vào hợp nhất.",
	"Cỡ chữ mô tả là một mức chung cho mọi mô tả. Đậm và gạch chân chỉ áp lên đoạn đang bôi đen.",
	"Tên lá bài trong phần mô tả dùng cùng cỡ chữ với nội dung skill.",
	"Khung mô tả khi xem lá bung rộng và che Rút quái, Rút phép, Hết lượt.",
	"Tên lá trong khung đọc skill to hơn nội dung, và lớn theo cỡ chữ chung.",
	"Mô tả quái dung hợp trên sân trở lại màu kem như trước, không còn màu skill.",
	"Chớp đỏ tím lúc có thể dung hợp hiện 3,5 giây thay vì 5 giây.",
	"Mắt đỏ tàn phá hợp với Triệu hồi ác ma thành Rồng ác ma, ngoài bộ. 5 sao, công 8, thủ 2, thủ phép 2, máu 12. Hoả cầu địa ngục gây 6 sát thương chuẩn lên 1 mục tiêu, quái hoặc người chơi.",
	"Sấm sét tận thế tốn 3 mana.",
	"Bộ bài vẫn 24 lá. Quái từ 12 đến 15 lá. Phép từ 9 đến 12 lá.",
	"Mục Deck có chân thống kê: quái theo 1, 2, 3, 4 sao. Phép theo Môi trường, Khống chế, Phản đòn và Hoá giải.",
	"Phép chỉ đổi cách hiện: Môi trường, Phản đòn, Giải trừ, Đa năng, Khống chế, Sát thương. Không đổi luật đánh.",
	"Cỡ chữ mô tả skill không còn làm đổi cỡ chữ trên thông báo. In đậm và gạch chân vẫn giữ.",
	"Cỡ chữ 120% chỉ nằm trong ô tuỳ chỉnh mô tả skill. Mô tả trên sân, phép và thông báo giữ cỡ cũ.",
	"Hoả cầu địa ngục của Rồng ác ma có tiếng nổ lửa khi gây sát thương.",
	"Khế ước ác ma chỉ kích hoạt khi người chơi đang có 3 sao. Đủ 4 sao thì triệu hồi bình thường, không trả khế ước.",
	"Thêm hiệu ứng buff khiên: khiên vật lý màu vàng, khiên phép màu tím. Xem trong mục hiệu ứng đặc biệt.",
	"Thêm Thiên thần bé nhỏ. 1 sao, 1 ngọc, công 0, thủ 0, thủ phép 0, máu 1. Thiên thần hộ mệnh tạo 1 khiên vật lý hoặc khiên phép cho đồng minh. Khiên chặn một lần đúng loại đó. Dính sát thương vật lý hoặc phép thì khiên vỡ. Sát thương chuẩn không đụng tới khiên. Tinh linh bé nhỏ cho đồng minh đỡ đòn hộ khi thiên thần bị nhắm.",
	"Thêm Nữ chúa điểu nhân, quái ngoài bộ. 4 sao, công 6, thủ 3, thủ phép 1, máu 6. Mỹ điểu nhân dùng đủ 4 kỹ năng thì chọn Công chúa hoặc Nữ chúa. Chỉ số lấy của dạng mới. Nữ chúa dùng đủ 4 kỹ năng và thêm 2 hành động của cô thì chờ dạng hoàn mỹ.",
	"Thêm Nữ chúa điểu nhân hoàn mỹ. 5 sao, công 6, thủ 3, thủ phép 3, máu 8. Giáp phản tích sát thương đã chặn cho đòn sau. Gió xoáy và Roi sấm không tốn hành động. Roi sấm biến cả đòn sau, kể cả phần tích, thành sát thương phép.",
	"Ở phần xây bộ bài, bấm lại lá quái ngoài bộ thì đóng bảng thông tin.",
	"Xây bộ bài có khung Cân bằng sức mạnh. Ấn giữ lá thì khung nằm trên mô tả, lần mới nhất ở trên. Chân trang quái và phép ghi lá đổi trong 2 tuần: tên in đậm, Tăng màu xanh, Giảm màu đỏ, Thay đổi lối chơi màu vàng.",
	"Khổng lồ 1 mắt còn 0 mana. Đập phá làm đòn đánh thường chủ động tốn thêm 1 mana. Lần bị động không tốn. Sau mỗi đòn đánh thường tăng vĩnh viễn 1 công.",
	"Khung Cân bằng sức mạnh: chữ lần đổi màu vàng. Chữ Thay đổi lối chơi và tên lá cùng loại màu hồng.",
	"Trong khung Cân bằng sức mạnh, chữ tăng hoặc giảm của từng chỉ số theo hướng sức mạnh: tăng sức mạnh thì xanh, giảm sức mạnh thì đỏ. Câu thêm kỹ năng chưa tô màu.",
	"Quái hoặc phép chưa có lần cân bằng sức mạnh thì không hiện khung đó.",
	"Chữ Cân bằng sức mạnh cùng màu với lần Tăng, Giảm hoặc Thay đổi lối chơi gần nhất.",
	"Yêu tinh chúc phúc tốn 2 mana.",
	"Tăng, Giảm và Thay đổi lối chơi dùng màu rõ cùng độ với ô xuất. Chữ Cân bằng sức mạnh ở chân trang giữ màu vàng riêng.",
	"Thay đổi lối chơi trở lại màu vàng thường.",
	"Tăng dùng xanh thường, Giảm dùng đỏ thường.",
	"Tăng dùng xanh đọt chuối. Thay đổi lối chơi dùng vàng sáng.",
	"Giảm dùng đỏ sáng. Chân trang ghi số sao và dấu sao trước tên quái, không còn ngoặc.",
	"Tăng, Giảm và Thay đổi lối chơi đều in đậm và gạch dưới. Chữ tăng hoặc giảm trong mô tả chỉ tô màu.",
	"Kazura, Kizuran, Đấu sĩ bò tót, Sứa hút ma pháp và Kỵ sĩ bóng tối tốn 1 mana. Chiến binh rồng tốn 2 mana.",
	"Chân trang cân bằng xếp đợt mới nhất trước. Cùng đợt thì ít sao trước. Chữ trong khung to hơn.",
	"Chân trang cân bằng không hiện quá 12 quái và 7 phép.",
	"Vì Anh Em của Kizuran chỉ hiện khi Kazura còn sống trên sân.",
	"Kizuran tốn 2 mana.",
	"Hai nút đỏ tình huống trên cùng một quái không còn đè lên nhau.",
	"Quái thú thiên sứ tốn 0 mana. Đến lượt thì cầu nguyện: tiêu 1 mana để ở lại, không thì rời sân. Vẫn cho thêm 1 mana nếu còn trên sân.",
	"Hơi thở rồng của Rồng con còn 1 sát thương phép, vẫn 2 sát thương chuẩn, và đánh được vào người chơi. Lần này là Giảm.",
	"Hơi thở rồng của Rồng ngàn tuổi cũng đánh được vào người chơi. Sát thương vẫn 3 chuẩn và 4 phép.",
	"Hoả cầu của Rồng canh pháo đài và Ma pháp tích tụ của Sứa hút ma pháp đánh được vào người chơi.",
	"Rồng phun hoả cầu đổi tên thành Rồng canh pháo đài. Máu tăng lên 5.",
	"Quái đánh vào người chơi không còn chui dưới lá trên bàn. Dừng ở khoảng trống giữa hai hàng để kéo vào chặn.",
	"Tích sao đổi thành 1, 3, 6, 10 mana cho 1 đến 4 sao. 4 sao vẫn là tối đa.",
	"Đầu ván mỗi người có 2 quái dự bị và thêm 1 phép trên tay. Phép này không tốn mana, không tích sao, và lượt đó vẫn rút được.",
	"Thông báo tô Khiên vật lý màu vàng và Khiên phép màu tím.",
	"Thông báo tô Kỵ sĩ cưỡi rồng và Rồng ác ma bằng gradient đỏ tím.",
	"Chữ Kỵ sĩ cưỡi rồng và Rồng ác ma trên thông báo sáng, đỏ chạy dần sang tím.",
	"Ván AI kết thúc được lưu để xuất. Nếu máy không giữ được thì báo lỗi, không còn chỉ nói chưa có ván.",
	"Ván AI đã kết thúc vẫn còn khi mở lại trang Xuất lịch sử. Máy không giữ được thì báo lỗi, không nói chưa có ván.",
	"Chữ quái dung hợp trên thông báo cắt trên dưới: nửa trên tím, nửa dưới đỏ.",
	"Yêu tinh chúc phúc còn 1 phòng ngự.",
	"Hoá kén của Sâu non chỉ tạo được 1 Chân kén.",
	"Thổi độc, Thổi độc 2 và Thổi độc 3 chỉ kêu tiếng độc khi đòn nổ, không kêu lúc vừa phát.",
	"Chiến binh rồng còn 4 máu.",
	"Dấu hai chấm sau tên skill không còn nằm một dòng riêng.",
	"Ván AI bạn thắng cũng được lưu. Xuất lịch sử có nút Chẩn đoán.",
	"Chiến binh rồng còn 4 công, 5 máu và 1 thủ phép.",
	"Bản xuất bản cập nhật chỉ số theo code. Mô tả skill đã lưu vẫn giữ.",
	"Dựng bộ bài: lá mới thêm trong 9 ngày, hoặc lá đổi lối chơi trong 6 ngày, có ô New dưới tên. Trên tay thì ẩn.",
	"Mỹ điểu nhân, Nữ chúa điểu nhân, Nữ chúa điểu nhân hoàn mỹ, Kỵ sĩ cưỡi rồng và Rồng ác ma được tính là lá mới thêm 5 ngày trước.",
	"Khổng lồ 1 mắt, Chiến binh rồng, Giáp cơ khí, Quái thú thiên sứ, Thiên thần bé nhỏ, Cỗ máy thời gian và Kẻ đào mộ cũng tính là lá mới thêm cùng ngày.",
	"Ô New không còn dạng viên thuốc. Nó là phù hiệu vàng, nổi và sang hơn.",
	"Ô New dùng phù hiệu Mới thay cho chữ New.",
	"Chỗ chỉnh lá quái trên tay và chỗ chỉnh lá phép trên tay cũng hiện phù hiệu Mới.",
	"Phù hiệu Mới trên lá quái nằm bên phải. Trên lá phép nằm góc trên trái.",
	"Dựng bộ bài hiện lại các lá đã lưu ở cả mục Quái thú, Phép và Deck.",
	"Khi mở bản xuất bản mới, bố cục lá và bàn chơi đã lưu được thay bằng bố cục mặc định mới.",
	"Hoán đổi rồi triệu hồi không còn làm hai quái trùng nhau. Kéo một quái không kéo quái kia, và không quái nào tự biến thành quái khác.",
	"Đầu lượt, nếu cầu có 3 mana và bình có 1 mana, có thể đổi: mất 3 mana cầu, nhận 2 mana đã sử dụng, chuyển 1 mana bình vào cầu.",
	"Giải phóng ma lực chỉ dùng được 1 lần mỗi trận. Đầy cầu và bình lần nữa thì chỉ báo một lần, không lặp lại.",
	"Mục Deck có chân trang: bên phải mở danh sách bộ bài, bên trái lưu và mở file bộ sưu tập.",
	"Yêu tinh chúc phúc tốn 1 mana để ra sân.",
	"Chân mục Deck cuộn theo trang. Thư mục và ô lưu chỉ hiện khi bấm đĩa. Dấu + nằm bên trái icon bộ bài.",
	"Giữ lá quái trong dựng bộ bài hiện khung Điểm mạnh, Điểm yếu và Cách khắc chế dưới mô tả skill, nếu đã điền.",
	"20 lá quái có sẵn điểm mạnh, điểm yếu và cách khắc chế. Mô tả skill không đổi.",
	"Khung giữ quái đổi tiêu đề thành Mục tiêu là xây dựng một quái thú... và Nhưng nó không thể...",
	"Thêm Hiệp sĩ của vua, 2 sao, 1 mana, 2 công, 3 thủ, 0 thủ phép, 1 máu. Đòn 1 gây 2 rồi +5 công. Đòn 2 tốn 1 mana, gây 7, rồi trả gươm về 2.",
	"Thêm Hiệp sĩ hộ vệ, 2 sao, 1 mana, 2 công, 0 thủ, 0 thủ phép, 2 máu. Đỡ hộ tốn 1 mana. Hai khiên vĩnh viễn tách riêng nếu có vua và hậu trong bộ.",
	"Thêm Hiệp sĩ của hậu, 2 sao, 1 mana, 1 công, 0 thủ, 3 thủ phép, 2 máu. Kiếm đàm phán tốn 1 mana cho hai đòn giáp lá cà.",
	"Thêm Hiệp sĩ huyền bí, 5 sao, dung hợp từ 3 hiệp sĩ. 2 công, 3 thủ, 3 thủ phép, 3 máu.",
	"Hiệp sĩ huyền bí ghi 60% sát thương khiên nuốt ở góc trái, chỉ X và Y. Tấn công chém 2 nhát khi chủ động đánh hoặc lao ra đỡ. Phòng ngự và Đàm phán chớp cam, bấm ô đỏ.",
	"Hiệp sĩ hộ vệ ghi 60% sát thương khiên nuốt. Skill lúc dùng tên là Kiếm phòng ngự.",
	"Bảng chọn khi cầu 3 mana và bình 1 mana nền đỏ chìm như nút Xuất. Bảng cầu nguyện, khế ước và duy trì tốn mana nền xanh lá.",
	"Hiệp sĩ của hậu dùng Đàm phán: sau khi chọn quái chịu đòn, máy vẫn chọn được quái lao vào.",
	"Hiệp sĩ hộ vệ lao vào đánh: khiên nuốt đòn phản, ghi 60% thành số cam hoặc tím, không xóa số vừa ghi.",
	"Thông báo sát thương chuẩn ghi 0 khi máu ảo nuốt hết và máu gốc không giảm.",
	"Kizuran tốn 1 mana.",
	"Mỹ điểu nhân: Mê hoặc tiêu hao 0 mana.",
	"Hành động gồm nhiều hành động nhỏ thì mỗi hành động một dòng gạch đầu. Khổng lồ 1 mắt giáp lá cà và Đập phá là hai dòng.",
	"Mỗi thông báo giữ ít nhất 2,5 giây. Thông báo thứ 3 do người chơi gây ra thì hiện ngay và xoá hai thông báo trước.",
	"Bên trái bảng thông báo có lịch sử chấm tròn. Đỏ là lao vào đánh, xanh lam là kỹ năng quái, vàng là chặn đòn, cam là triệu hồi, hồng là phép, đen là thông báo còn lại. Qua lượt thì có gạch xanh đọt chuối.",
	"Đòn đánh tay trừ máu ảo theo vật lý, rồi phép, rồi sát thương chuẩn. Skill và phép trừ phép, rồi vật lý, rồi sát thương chuẩn.",
	"Cập nhật mô tả mặc định của Kazura, Kẻ giám hộ linh hồn, Hiệp sĩ của vua, Hiệp sĩ hộ vệ, Hiệp sĩ của hậu và Hiệp sĩ huyền bí.",
	"Hiệp sĩ hộ vệ dùng Kiếm phòng ngự không còn mất hành động ở lượt sau.",
	"Lịch sử thông báo chỉ hiện 6 chấm mới nhất, cách đều và to hơn. Bấm chấm để xem lại. Kéo trên thông báo để đọc. Bấm ra ngoài thì về thông báo mới nhất.",
	"Chấm mới nhất hiện ngay khi thông báo bắt đầu, không đợi thông báo đó kết thúc.",
	"Lịch sử thông báo còn 5 chấm đặc ruột, cỡ mặc định 1.6. Bắt đầu lượt không có chấm. Rút bài màu đọt chuối. Độc và sát thương theo lượt màu xanh lá. Đòn đánh thường lên người chơi, và sát thương lên quái, màu đỏ. Kỹ năng hoặc phép gây sát thương lên người chơi màu xanh lam.",
	"Sấm lôi phá dùng âm phát khi bắt đầu và âm nổ khi trúng.",
	"Sấm lôi phá lấy tiếng phóng điện đầu làm âm phát.",
	"Sấm lôi phá lấy tiếng sét đầu làm âm nổ.",
	"Thêm hiệu ứng Sét nhỏ trong Skill đặc biệt. Cùng hình sét nhưng nhỏ hơn, âm phát giữ nguyên, âm nổ là tiếng sét nhỏ đã cắt đoạn im. Chưa gắn skill nào.",
	"Hình hiệu ứng sét đổi sang video tia sét mới, chạy nhanh gấp 4.",
	"Hiệu ứng sét đổi sang video nền xanh. Đã bỏ nền và chỉ giữ đoạn tia sét đánh xuống.",
	"Skill sát thương thường mặc định chỉ có hiệu ứng trên mục tiêu: Vòng sóng và Tia.",
	"Sét nhỏ dùng âm phát của sét, âm nổ của sét nhỏ và hình tia sét. Sét dùng âm phát của sét, âm nổ của sét to và hình phép thường.",
	"Hình điện mới là đoạn sét đầu khoảng 1,4 giây, đã bỏ nền. Hình điện cũ chuyển sang hiệu ứng Sét. Âm của cả hai giữ nguyên.",
	"Sấm sét tận thế dùng hiệu ứng sét. Sừng lôi phá và đòn Sấm lôi phá dùng hiệu ứng điện.",
	"Hình điện thu nhỏ cho vừa lá bài. Sấm sét tận thế nổ đúng hình sét và tiếng nổ của sét to khi đánh nhiều quái.",
	"Hình điện khi buff quái mình là 45%. Khi đánh lên địch là 35%.",
	"Roi điện hiện icon phản đòn và tiếng phản, rồi chờ đối phương. Hấp thụ ma pháp nuốt được đòn này. Nếu không bị nuốt, tiếng nổ và hình điện rơi lên cả hai quái.",
	"Chấm cạnh thông báo nhảy ngay theo diễn biến. Dòng chữ vẫn giữ tối thiểu 2,5 giây.",
	"Cầu ma lực và số mana trên thông báo in màu xanh lam.",
	"Lời chúc của kỵ sĩ đổi câu chữ: mất khiên Ân Huệ thì đầu lượt được 3 thủ hoặc 3 thủ phép, cuối lượt khiên hồi nếu gây được sát thương ngược loại.",
	"Hiệp sĩ của hậu: Kiếm đàm phán đổi tên thành Đàm phán. Thêm Kiếm phép, đếm 1 rồi 2, nhắm 1 quái địch.",
	"Đàm phán đòn 2 không còn bắt Hiệp sĩ của hậu lao vào khi quái đòn 1 chết, nếu sân mình còn quái khác.",
	"Hiệp sĩ hộ vệ gốc 3 sao, 1 mana, 1 công, 1 máu. Học tập: có vua hoặc hậu trên sân mình thì triệu hồi không cần đủ sao. Trưởng thành: ra sân lúc đủ 3 sao thì +2 công và +3 máu.",
	"Khung cân bằng: Hiệp sĩ của hậu ghi thêm Kiếm phép. Hiệp sĩ hộ vệ ghi hạ chỉ số, lời chúc của kỵ sĩ và Học tập và trưởng thành.",
	"Roi sấm giống Roi điện. Tiếng nổ là sét to. Hình trên quái mình là điện, hình trên đối thủ là sét.",
	"Mắt xanh huỷ diệt còn 6 công và 6 máu. Tia sáng huỷ diệt gây sát thương chuẩn bằng đúng công.",
	"Tia sáng huỷ diệt dùng laser. Âm phát là điện. Tia đi từ quái ra đòn tới quái trúng, máu trừ từng 1 cho đến hết tia. Hết tia thì nổ điện, lúc đó mới hạ gục.",
	"Lời chúc của kỵ sĩ trên Hiệp sĩ của vua, Hiệp sĩ của hậu và Hiệp sĩ hộ vệ dùng cùng một đoạn mô tả.",
	"Bấm Tia sáng huỷ diệt của Mắt xanh phát hiệu ứng điện, cả tiếng và hình, trên quái vừa nạp.",
	"Tia sáng huỷ diệt bỏ hiệu ứng phép thường lúc nổ. Hiệu ứng hồi máu lúc bấm skill được giữ lại.",
	"Thông báo: sát thương chuẩn in màu xám sáng hơn.",
	"Thông báo: chữ mana sáng hơn. Giải phóng cầu ma lực và Tia sáng huỷ diệt in cả cụm như skill.",
	"Lịch sử chấm chỉ giữ kết quả khi đòn đã nổ. Câu lúc phát, như lao vào, không còn chấm nếu đã có sáp lá cà hoặc kết quả.",
	"Tia laser bỏ đoạn cách đuôi. Đuôi tia nằm đúng giữa lá bài địch.",
	"Thêm Thế thân của shien. 1 sao, 0 mana, 3 công, 2 máu, thủ 0, thủ phép 0. Thế thân bấm lúc thanh phản ứng, tốn 1 mana. Trên sân thì chuyển đòn chọn 1 mục tiêu của đối thủ sang Thế thân của shien, kể cả đòn vào người chơi. Trên tay thì chỉ thế cho quái đồng minh, đòn rơi vào Thế thân của shien, đồng minh về tay giữ nguyên trạng thái. Lượt sau triệu hồi con đó không tốn mana. Triệu hồi con khác hoặc bỏ lượt thì lần sau phải đủ mana.",
	"Mô tả Thế thân của shien đổi câu trên tay: đồng minh có nguy cơ gặp nạn, triệu hồi lại ở lượt sau đó mà không tốn mana.",
	"Thêm Phù thuỷ rừng đen. 1 sao, 0 mana, 0 công, 0 thủ, 3 thủ phép, 4 máu. Nguyền rủa tốn 1 mana, chọn 1 quái địch, có thanh phản ứng. Trừ 3 công, 3 sát thương kỹ năng, 2 thủ, 2 thủ phép trong 6 lượt chung. Công dưới 0 ghi 0 và cấm hành động, kể cả đỡ đòn. Thủ và thủ phép âm làm đòn nặng hơn. Đặt lại chỉ làm mới thời gian.",
	"Deck mặc định là bộ Lv 1 Meta deck. Quái: Khổng lồ 1 mắt, Phù thuỷ tí hơn, Quái thú thiên sứ, Rồng con, Thiên thần bé nhỏ, Hiệp sĩ của vua, Hiệp sĩ hộ vệ, Kazura, Kizuran, Mỹ điểu nhân, Chiến binh rồng, Ma đạo sĩ, Máy ném bom hình nhện, Thương quản long, Hiệp sĩ của hậu. Phép: Giáp cơ khí, Lá chắn phản đòn, Phục kích, Gương phòng hộ, Kẻ đào mộ, Sợi xích địa ngục, Sấm sét tận thế, Virus ăn mòn, Hoán đổi.",
	"Dựng bộ vẫn đúng 24 lá. Quái từ 13 đến 17. Phép từ 7 đến 11.",
	"Bộ mặc định Lv 1 Meta deck lên đầu và được dùng khi vào ván. Bộ máy đang lưu, nếu khác, xuống dưới thành Bộ riêng.",
	"Mỹ điểu nhân: lượt sau không được rút bài vẫn đúng. Máy không còn đứng im vì cứ đòi rút, mà triệu hồi, đánh hoặc kết thúc lượt.",
	"Hiệp sĩ của hậu: trên sân hiện Kiếm phép. Lần 1 tốn 0 mana, 1 sát thương phép và 1 sát thương vật lý. Lần 2 tốn 1 mana, 3 sát thương vật lý, 3 sát thương phép và 1 sát thương chuẩn. Đếm 1 rồi 2, cùng lượt hay khác lượt đều giữ.",
	"Hiệp sĩ của vua và Hiệp sĩ của hậu bỏ lời chúc của kỵ sĩ cũ: không còn 2 máu ảo trước mỗi đòn. Máu của Hiệp sĩ của vua là 3. Máu của Hiệp sĩ của hậu là 3.",
	"Số cam góc trái trên lá quái canh lề trái, không còn canh giữa.",
	"Hiệp sĩ hộ vệ, Kiếm hộ vệ: khi chủ động lao vào tấn công hay đỡ đòn, loại sát thương gây ra theo khiên đã mất trước đó. Mất khiên vật lý thì gây sát thương phép. Mất khiên phép thì gây sát thương vật lý. Mất cả hai thì tính khiên vật lý trước, gây sát thương phép.",
	"Giữ lá quái trong dựng bộ bài không còn khung dưới mô tả skill. Ba ô đó trong tuỳ chỉnh mô tả cũng ẩn.",
	"Tên trên mặt lá quái và phép: vừa 2 dòng thì giữ cỡ cũ. Tràn dòng 3 thì chỉ lá đó nhỏ lại cho đến khi vừa 2 dòng, không nhỏ hơn 75% cỡ gốc.",
	"Cơn thịnh nộ của hải vương có 1 công.",
	"Khổng lồ 1 mắt còn 3 thủ.",
	"Quái thú thiên sứ còn 1 mana. Bảng chọn ghi Cầu nguyện, không còn Duy trì.",
	"Thiên thần bé nhỏ đổi tên thành Nàng tiên giữ khoá.",
	"Kizuran có 3 công.",
	"Chiến binh rồng còn 4 máu và 1 thủ.",
	"Hiệp sĩ hộ vệ có 2 công và 2 máu.",
	"Ma đạo sĩ, Ma đạn: tiêu hao 1 mana, bắn 3 phát liên tục. Sát thương phép 1, rồi 2, loạt cuối 4.",
	"Icon lưu ở chân trang dựng bộ bài: bấm lần nữa thì thu hai icon lại.",
	"Chiến thuật xếp theo số sao chủ yếu của quái trong nhóm, 1 sao trước. Cùng sao thì nhóm có nhiều quái đúng mức sao đó xếp trước.",
	"Kiếm sĩ lửa thiêng: sau Truy cùng diệt tận có Hoả thần long. Tiêu hao thêm 3 máu và 1 mana, gây 4 sát thương phép và 3 sát thương chuẩn. Vẫn chọn mục tiêu.",
	"Màn hình chính có Góp ý ở góc phải trên. Điền tên vấn đề hoặc lá bài và chi tiết, rồi bấm OK. Các dòng được giữ để đọc trên bản đã đăng.",
	"Phù thuỷ tí hơn còn 3 máu.",
	"Góp ý dùng nền trang chính. Ấn giữ Góp ý, nhập mật khẩu, rồi OK hoặc Huỷ để mở hộp thư.",
	"Lá mới lấy ngày ghi trên lá, nhãn Mới trong 9 ngày. Đổi lối chơi lấy ngày trong nhật ký, nhãn trong 6 ngày. Mắt đỏ tàn phá, Kẻ giám hộ linh hồn, Hoa ăn thịt người, Thương quản long và Máy ném bom hình nhện không gắn nhãn.",
	"Quái được tăng sức mạnh dùng nhãn Tăng trong 5 ngày, thay nhãn Mới nếu đang có, và đếm lại từ lần tăng đó.",
	"Quái bị giảm sức mạnh dùng nhãn Giảm trong 5 ngày, thay nhãn Mới nếu đang có, và đếm lại từ lần giảm đó.",
	"Tên kỹ năng tự in đậm và gạch dưới: dòng kết thúc bằng dấu hai chấm, hoặc dòng đầu ngắn không có dấu câu. Lá mới không cần đánh dấu tay.",
	"Nhãn Tăng và Giảm hết đúng khi đủ 5 ngày. Sâu non giảm ngày 9/10 nên hôm nay 14/10 không còn nhãn.",
	"Chiến binh lẫn khuất, Kẻ săn mồi tử thần và Sát nhân bắt giữ thêm ngày 13/10 nên có nhãn Mới.",
	"Ngày thêm lá và ngày tăng, giảm hoặc đổi lối chơi được ghi tự động. Không cần gắn nhãn bằng tay.",
	"Góp ý dùng nền vàng như các mục khác, chữ đổi theo nền.",
	"Trang chiến thuật ghi Quái thú 1 sao, 2 sao, 3 sao và Quái thú chủ lực. Nhóm một lá rộng khoảng một lá rưỡi và đứng cạnh nhau. Rồng ngàn tuổi cần cả Rồng con và Phù thuỷ thời gian.",
	"Tê giác bé con trên sân có nút Thăng cấp. Cấp 1 tốn 1 mana, cấp 2 tốn 2 mana. Cấp cuối thì nút mất.",
	"Nút skill trên sân nằm một danh sách. Thiếu nút thì bản build báo, không im lặng mất nút sau khi giải nén.",
	"Hoa ăn thịt người, Kén ngài và Chân kén không còn hiệu ứng bất lợi kéo dài. Không đánh hoặc không chặn là cơ chế của lá, không giải trừ được.",
	"Kén ngài và Chân kén không hiện chữ Cấm. Không chặn là cơ chế của lá.",
	"Lá đứng yên không hiện chữ Cấm và không có hiệu ứng bất lợi kéo dài. Không giải trừ được. Lá đứng yên thêm sau này cũng vậy.",
	"Quái 2 đến 4 sao có thể triệu hồi hiến tế. Ấn giữ lá trên tay để bật vòng lửa, kéo ra sân rồi chọn quái. Chỉ số cộng thêm là vĩnh viễn.",
	"Kẻ giám hộ linh hồn: Kiếm hấp thụ linh hồn hiến 2 máu lần đầu, mỗi lần sau thêm 1 máu. Buff chỉ trong giao tranh rồi mất. Mỗi máu thêm cho thêm 1 công và 1 máu tối đa.",
	"Kẻ giám hộ linh hồn có thủ gốc 1."
];
function remarkOf(notes) {
	const bits = notes.slice(-3).map((text) => text.split(/[.:]/)[0]?.trim()).filter(Boolean);
	return bits.length ? `Bản này gồm ${bits.join(", ")}.` : "Bản này gom 10 thay đổi.";
}
function openPending(sealed, pending) {
	const opened = [];
	let version = sealed[0]?.version ?? null;
	for (let start = 0; start + 10 <= pending.length; start += 10) {
		version = nextVersion(version);
		const chunk = pending.slice(start, start + 10);
		const notes = [...chunk].reverse().map((text, index) => ({
			n: index + 1,
			text
		}));
		opened.push({
			version,
			remark: remarkOf(chunk),
			notes
		});
	}
	return [...opened.reverse(), ...sealed];
}
var UPDATE_RELEASES = openPending(SEALED, PENDING_NOTES);
var AI_INTRO = "AI nhìn cách bạn chơi, theo hướng của đối thủ. Chưa đủ dữ liệu thì nó đánh lối cơ bản.";
var AI_BASICS = [
	"Rút quái sớm để lên 1 sao, rồi 2 sao.",
	"Đã có quái trên sân thì rút phép để dành, đồng thời tích sao.",
	"Gọi quái sớm khi đủ sao.",
	"Diệt cục bông bản chính, gã hề đang tích năng lượng, và thiên sứ."
];
var MARK_KEY = "clash-export-mark";
function planStamp(plan) {
	return JSON.stringify([
		plan.name,
		[...plan.cards].sort(),
		plan.text,
		plan.source
	]);
}
function currentMark() {
	return {
		notes: UPDATE_RELEASES.flatMap((release) => release.notes.map((note) => `${release.version}|${note.n}|${note.text}`)),
		plans: Object.fromEntries(loadStrategies().map((plan) => [plan.id, planStamp(plan)])),
		tested: testedStamp(loadTested())
	};
}
function readMark() {
	try {
		const data = JSON.parse(localStorage.getItem(MARK_KEY) ?? "");
		if (!data || !Array.isArray(data.notes) || typeof data.plans !== "object" || !data.plans) return null;
		return {
			notes: data.notes.filter((item) => typeof item === "string"),
			plans: data.plans,
			tested: typeof data.tested === "string" ? data.tested : void 0
		};
	} catch {
		return null;
	}
}
function writeMark(mark) {
	localStorage.setItem(MARK_KEY, JSON.stringify(mark));
}
function planBlock(plan) {
	const names = sortCards(plan.cards).map((id) => monsterCard(id)?.name ?? spellCard(id)?.name ?? id);
	return [
		plan.name || "Chưa đặt tên",
		names.length ? `Lá: ${names.join(", ")}` : "Lá: chưa có",
		plan.text ? `Mô tả: ${plan.text}` : "",
		plan.source ? `Nguồn: ${plan.source}` : ""
	].filter(Boolean).join("\n");
}
function testedStamp(board) {
	const ids = (list) => [...list].sort();
	return JSON.stringify({
		tryingMonsters: ids(board.tryingMonsters),
		tryingSpells: ids(board.tryingSpells),
		monsters: ids(board.monsters),
		spells: ids(board.spells)
	});
}
function testedHasCards(board) {
	return board.tryingMonsters.length + board.tryingSpells.length + board.monsters.length + board.spells.length > 0;
}
function testedNames(ids, kind) {
	if (kind === "monster") return ids.map((id) => monsterCard(id)).filter((card) => !!card).sort(byStars).map((card) => card.name);
	return ids.map((id) => spellCard(id)).filter((card) => !!card).sort(byGems).map((card) => card.name);
}
function testedBlock(board) {
	const group = (title, monsters, spells) => {
		const rows = [];
		const monsterNames = testedNames(monsters, "monster");
		const spellNames = testedNames(spells, "spell");
		if (monsterNames.length) rows.push(`Quái: ${monsterNames.join(", ")}`);
		if (spellNames.length) rows.push(`Phép: ${spellNames.join(", ")}`);
		if (!rows.length) return "";
		return [title, ...rows].join("\n");
	};
	const parts = [group("Testing", board.tryingMonsters, board.tryingSpells), group("Tested", board.monsters, board.spells)].filter(Boolean);
	return parts.length ? parts.join("\n\n") : "Không còn lá đã lưu.";
}
function infoText(previous) {
	const known = new Set(previous.notes);
	const updates = UPDATE_RELEASES.flatMap((release) => {
		const notes = [...release.notes].sort((a, b) => a.n - b.n).filter((note) => !known.has(`${release.version}|${note.n}|${note.text}`));
		if (!notes.length) return [];
		return [`${release.version}\n${notes.map((note) => `${note.n}. ${note.text}`).join("\n")}`];
	});
	const plans = sortStrategies(loadStrategies()).filter((plan) => previous.plans[plan.id] !== planStamp(plan)).map(planBlock);
	const saved = loadTested();
	const savedChanged = previous.tested !== void 0 ? previous.tested !== testedStamp(saved) : testedHasCards(saved);
	if (!updates.length && !plans.length && !savedChanged) return "THÔNG TIN MỚI\n\nKhông có thông tin mới.\n";
	const parts = ["THÔNG TIN MỚI"];
	if (updates.length) parts.push(`CẬP NHẬT\n${updates.join("\n\n")}`);
	if (plans.length) parts.push(`CHIẾN THUẬT\n${plans.join("\n\n")}`);
	if (savedChanged) parts.push(`ĐÃ LƯU\n${testedBlock(saved)}`);
	return `${parts.join("\n\n")}\n`;
}
function exportInfo(onDone) {
	const text = infoText(readMark() ?? currentMark());
	const next = currentMark();
	const changed = !text.includes("Không có thông tin mới.");
	const file = new File([text], "thong-tin.txt", { type: "text/plain;charset=utf-8" });
	const finish = () => {
		writeMark(next);
		onDone(changed);
	};
	const save = () => {
		const url = URL.createObjectURL(file);
		const link = document.createElement("a");
		link.href = url;
		link.download = file.name;
		link.click();
		URL.revokeObjectURL(url);
		finish();
	};
	if (navigator.canShare?.({ files: [file] })) {
		navigator.share({
			files: [file],
			title: "Thông tin"
		}).then(finish).catch((error) => {
			if (error instanceof DOMException && error.name === "AbortError") return;
			save();
		});
		return;
	}
	save();
}
function InfoPage() {
	const [pane, setPane] = (0, import_react.useState)("menu");
	const [exported, setExported] = (0, import_react.useState)(false);
	useLang();
	(0, import_react.useEffect)(() => {
		if (!readMark()) writeMark(currentMark());
	}, []);
	if (pane === "updates") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Updates, { onBack: () => setPane("menu") });
	if (pane === "ai") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiWatch, { onBack: () => setPane("menu") });
	if (pane === "plans") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plans, { onBack: () => setPane("menu") });
	if (pane === "tested") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tested, { onBack: () => setPane("menu") });
	if (pane === "matches") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchExport, { onBack: () => setPane("menu") });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "watch is-menu",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "watch-back",
				children: tr("Về sân")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tr("Thông tin") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mode-list",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						onClick: () => setPane("updates"),
						children: tr("Cập nhật")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						onClick: () => setPane("plans"),
						children: tr("Chiến thuật")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						onClick: () => setPane("tested"),
						children: tr("Đã test")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press",
						onClick: () => setPane("matches"),
						children: tr("Xuất lịch sử ván đấu")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "info-foot",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "act press is-export",
					onClick: () => exportInfo(setExported),
					children: tr("Xuất")
				}), exported ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "export-saved",
					children: tr("Đã lưu")
				}) : null]
			})
		]
	});
}
function Tested({ onBack }) {
	const [deck, setDeck] = (0, import_react.useState)(loadTested);
	const [tab, setTab] = (0, import_react.useState)("monster");
	const [info, setInfo] = (0, import_react.useState)(null);
	const [saveGone, setSaveGone] = (0, import_react.useState)(false);
	useLang();
	const gray = new Set(FORMS.map((card) => card.id));
	const busy = /* @__PURE__ */ new Set([
		...deck.monsters,
		...deck.tryingMonsters,
		...deck.test2Monsters
	]);
	const busySpells = /* @__PURE__ */ new Set([
		...deck.spells,
		...deck.tryingSpells,
		...deck.test2Spells
	]);
	const poolMonsters = [...MONSTERS, ...FORMS].filter((card) => !busy.has(card.id)).sort(byStars);
	const poolSpells = SPELLS.filter((card) => !busySpells.has(card.id)).sort(byGems);
	const tryingMonsters = deck.tryingMonsters.map((id) => monsterCard(id)).filter((card) => !!card).sort(byStars);
	const tryingSpells = deck.tryingSpells.map((id) => spellCard(id)).filter((card) => !!card).sort(byGems);
	const pickedMonsters = deck.monsters.map((id) => monsterCard(id)).filter((card) => !!card).sort(byStars);
	const pickedSpells = deck.spells.map((id) => spellCard(id)).filter((card) => !!card).sort(byGems);
	const tabs = [
		"monster",
		"spell",
		"testing",
		"tested"
	];
	const shown = tab === "monster" ? poolMonsters.length : tab === "spell" ? poolSpells.length : tab === "testing" ? tryingMonsters.length + tryingSpells.length : pickedMonsters.length + pickedSpells.length;
	const swipe = (0, import_react.useRef)(null);
	const swiped = (0, import_react.useRef)(false);
	function slide(next) {
		const landed = tabs.indexOf(tab) + next;
		if (landed < 0 || landed >= tabs.length) return;
		setTab(tabs[landed]);
		setInfo(null);
	}
	function tap(id, kind, from) {
		if (info) {
			setInfo(info === id ? null : id);
			return;
		}
		setDeck((current) => {
			if (from === "pool") {
				if (kind === "monster") {
					if (current.tryingMonsters.includes(id) || current.monsters.includes(id) || current.test2Monsters.includes(id)) return current;
					return {
						...current,
						tryingMonsters: [...current.tryingMonsters, id]
					};
				}
				if (current.tryingSpells.includes(id) || current.spells.includes(id) || current.test2Spells.includes(id)) return current;
				return {
					...current,
					tryingSpells: [...current.tryingSpells, id]
				};
			}
			if (from === "testing") return kind === "monster" ? {
				...current,
				tryingMonsters: current.tryingMonsters.filter((item) => item !== id)
			} : {
				...current,
				tryingSpells: current.tryingSpells.filter((item) => item !== id)
			};
			return kind === "monster" ? {
				...current,
				monsters: current.monsters.filter((item) => item !== id)
			} : {
				...current,
				spells: current.spells.filter((item) => item !== id)
			};
		});
	}
	function toTested(id, kind) {
		setDeck((current) => {
			if (kind === "monster") return {
				...current,
				tryingMonsters: current.tryingMonsters.filter((item) => item !== id),
				test2Monsters: current.test2Monsters.filter((item) => item !== id),
				monsters: current.monsters.includes(id) ? current.monsters : [...current.monsters, id]
			};
			return {
				...current,
				tryingSpells: current.tryingSpells.filter((item) => item !== id),
				test2Spells: current.test2Spells.filter((item) => item !== id),
				spells: current.spells.includes(id) ? current.spells : [...current.spells, id]
			};
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "builder",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "deck-head",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "chip",
						onClick: onBack,
						children: "Quay lại"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "deck-count",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: shown })
					}),
					saveGone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "save is-gone" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "save press",
						onClick: () => {
							saveTested(deck);
							setSaveGone(true);
							window.setTimeout(() => setSaveGone(false), 3e3);
						},
						children: tr("Lưu")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-tabs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `chip${tab === "monster" ? " on" : ""}`,
						onClick: () => {
							setTab("monster");
							setInfo(null);
						},
						children: tr("Quái")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `chip${tab === "spell" ? " on" : ""}`,
						onClick: () => {
							setTab("spell");
							setInfo(null);
						},
						children: tr("Phép")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `chip${tab === "testing" ? " on" : ""}`,
						onClick: () => {
							setTab("testing");
							setInfo(null);
						},
						children: "Testing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `chip${tab === "tested" ? " on" : ""}`,
						onClick: () => {
							setTab("tested");
							setInfo(null);
						},
						children: "Tested"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-grid",
				onPointerDown: (event) => {
					swipe.current = {
						x: event.clientX,
						y: event.clientY
					};
				},
				onPointerUp: (event) => {
					if (!swipe.current) return;
					const dx = event.clientX - swipe.current.x;
					const dy = event.clientY - swipe.current.y;
					swipe.current = null;
					if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
					swiped.current = true;
					slide(dx < 0 ? 1 : -1);
				},
				onClickCapture: (event) => {
					if (!swiped.current) return;
					swiped.current = false;
					event.preventDefault();
					event.stopPropagation();
				},
				children: [
					tab === "monster" ? poolMonsters.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPick, {
						gray: gray.has(card.id),
						held: info === card.id,
						onHold: () => setInfo(card.id),
						onTap: () => tap(card.id, "monster", "pool"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							monster: card,
							selected: info === card.id
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestCopy, { id: card.id }) : null] }, card.id)) : null,
					tab === "spell" ? poolSpells.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPick, {
						held: info === card.id,
						onHold: () => setInfo(card.id),
						onTap: () => tap(card.id, "spell", "pool"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							spellId: card.id,
							selected: info === card.id
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestCopy, { id: card.id }) : null] }, card.id)) : null,
					tab === "testing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [tryingMonsters.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPick, {
						gray: gray.has(card.id),
						held: false,
						onHold: () => toTested(card.id, "monster"),
						onTap: () => tap(card.id, "monster", "testing"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { monster: card })
					}) }, card.id)), tryingSpells.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPick, {
						held: false,
						onHold: () => toTested(card.id, "spell"),
						onTap: () => tap(card.id, "spell", "testing"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { spellId: card.id })
					}) }, card.id))] }) : null,
					tab === "tested" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [pickedMonsters.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPick, {
						gray: gray.has(card.id),
						held: info === card.id,
						onHold: () => setInfo(card.id),
						onTap: () => tap(card.id, "monster", "tested"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							monster: card,
							selected: info === card.id
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestCopy, { id: card.id }) : null] }, card.id)), pickedSpells.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPick, {
						held: info === card.id,
						onHold: () => setInfo(card.id),
						onTap: () => tap(card.id, "spell", "tested"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							spellId: card.id,
							selected: info === card.id
						})
					}), info === card.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestCopy, { id: card.id }) : null] }, card.id))] }) : null
				]
			})
		]
	});
}
function byStars(a, b) {
	return a.stars - b.stars || a.name.localeCompare(b.name, "vi");
}
function byGems(a, b) {
	return a.gems - b.gems || a.name.localeCompare(b.name, "vi");
}
var TESTED_KEY = "clash-tested";
function loadTested() {
	const empty = {
		monsters: [],
		spells: [],
		tryingMonsters: [],
		tryingSpells: [],
		test2Monsters: [],
		test2Spells: [],
		notes: {}
	};
	try {
		const raw = JSON.parse(localStorage.getItem(TESTED_KEY) ?? "");
		const ids = (value, kind) => Array.isArray(value) ? value.filter((id) => typeof id === "string" && (kind === "monster" ? !!monsterCard(id) : !!spellCard(id))) : [];
		const monsters = ids(raw.monsters, "monster");
		const spells = ids(raw.spells, "spell");
		for (const id of ids(raw.test2Monsters, "monster")) if (!monsters.includes(id)) monsters.push(id);
		for (const id of ids(raw.test2Spells, "spell")) if (!spells.includes(id)) spells.push(id);
		const notes = raw.notes && typeof raw.notes === "object" ? Object.fromEntries(Object.entries(raw.notes).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "string")) : {};
		return {
			monsters,
			spells,
			tryingMonsters: ids(raw.tryingMonsters, "monster"),
			tryingSpells: ids(raw.tryingSpells, "spell"),
			test2Monsters: [],
			test2Spells: [],
			notes
		};
	} catch {
		return empty;
	}
}
function saveTested(deck) {
	localStorage.setItem(TESTED_KEY, JSON.stringify(deck));
}
function TestCopy({ id }) {
	const monster = monsterCard(id);
	const spell = monster ? void 0 : spellCard(id);
	if (!monster && !spell) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: `focus-copy is-inline${monster ? " is-skill" : " is-spell"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: monster?.name ?? spell?.name }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: monster ? "ink-skill" : "ink-spell",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyText, { text: monster?.skill ?? spell?.effect ?? "" })
			}),
			DECK_NOTES[id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "deck-note",
				children: tr(DECK_NOTES[id])
			}) : null
		]
	});
}
function TestPick({ gray = false, held, onHold, onTap, children }) {
	const timer = (0, import_react.useRef)(null);
	const didHold = (0, import_react.useRef)(false);
	function clear() {
		if (timer.current !== null) window.clearTimeout(timer.current);
		timer.current = null;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `pick press${held ? " is-held" : ""}${gray ? " is-locked" : ""}`,
		onPointerDown: () => {
			didHold.current = false;
			clear();
			timer.current = window.setTimeout(() => {
				didHold.current = true;
				onHold();
			}, 420);
		},
		onPointerUp: clear,
		onPointerCancel: clear,
		onClick: () => {
			if (didHold.current) {
				didHold.current = false;
				return;
			}
			onTap();
		},
		children
	});
}
function MatchExport({ onBack }) {
	const [pack, setPack] = (0, import_react.useState)(null);
	const [problem, setProblem] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [diag, setDiag] = (0, import_react.useState)(null);
	useLang();
	(0, import_react.useEffect)(() => {
		let live = true;
		exportStoredHistory().then((next) => {
			if (!live) return;
			setPack(next);
			setProblem(matchHistoryProblem() ?? "");
		});
		return () => {
			live = false;
		};
	}, []);
	function download() {
		if (pack?.status !== "ready") return;
		const file = new File([pack.json], "lich-su-van-dau.json", { type: "application/json" });
		const url = URL.createObjectURL(file);
		const link = document.createElement("a");
		link.href = url;
		link.download = file.name;
		link.click();
		URL.revokeObjectURL(url);
	}
	async function copy() {
		if (pack?.status !== "ready") return;
		try {
			await navigator.clipboard.writeText(pack.json);
			setNote(tr("Đã sao chép."));
		} catch {
			setNote(tr("Không sao chép được."));
		}
	}
	function countText(count, error) {
		if (error && count === null) return error;
		return `${count ?? 0} bản ghi`;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "watch",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "watch-back",
				onClick: onBack,
				children: "Quay lại"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tr("Xuất lịch sử ván đấu") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "watch-card",
				children: [
					!pack ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Đang đọc lịch sử…") }) : null,
					pack?.status === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: `${pack.count} ${tr("ván AI đã lưu")}` }) : null,
					pack?.status === "empty" && !problem ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Chưa có ván AI nào được lưu.") }) : null,
					pack?.status === "broken" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr(pack.message ?? "Lịch sử không đọc được. Dữ liệu gốc vẫn giữ nguyên.") }) : null,
					problem && pack?.status === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr(problem) }) : null,
					note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: note }) : null,
					diag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "tuner-note",
						children: `IndexedDB: ${diag.idb}
Bộ nhớ tạm: ${diag.memory ?? "không đọc được"}
localStorage: ${countText(diag.local.count, diag.local.error)}
sessionStorage: ${countText(diag.session.count, diag.session.error)}
IndexedDB: ${countText(diag.indexed.count, diag.indexed.error)}
Ghi gần nhất: local ${diag.lastWrite.local}, session ${diag.lastWrite.session}, indexedDB ${diag.lastWrite.idb}
Kết thúc gần nhất: ${diag.lastSeal ? `winner ${diag.lastSeal.winner} step ${diag.lastSeal.step} ${diag.lastSeal.saved ? "đã lưu" : "không lưu"} ${diag.lastSeal.why}` : "chưa có"}
${diag.lines.join("\n")}`
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mode-list",
				children: [pack?.status === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "act press",
					onClick: download,
					children: tr("Tải tệp JSON")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "act press",
					onClick: () => void copy(),
					children: tr("Sao chép JSON")
				})] }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "act alt press",
					onClick: () => void diagnoseHistory().then(setDiag),
					children: "Chẩn đoán"
				})]
			})
		]
	});
}
function Updates({ onBack }) {
	useLang();
	const [index, setIndex] = (0, import_react.useState)(0);
	const current = UPDATE_RELEASES[index];
	const last = UPDATE_RELEASES.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "watch",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "watch-back",
				onClick: onBack,
				children: "Quay lại"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tr("Cập nhật") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "watch-card",
				children: current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "day-nav",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Bản mới hơn",
								disabled: index <= 0,
								onClick: () => setIndex(index - 1),
								children: "‹"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "update-version",
								children: current.version
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Bản cũ hơn",
								disabled: index >= last,
								onClick: () => setIndex(index + 1),
								children: "›"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "update-remark",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Painted, {
							text: current.remark,
							system: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "update-list",
						children: [...current.notes].sort((a, b) => a.n - b.n).map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "update-n",
							children: note.n
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Painted, {
							text: note.text,
							system: true
						}) })] }, note.n))
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tr("Chưa có bản cập nhật.") })
			})
		]
	});
}
function AiWatch({ onBack }) {
	const [habits, setHabits] = (0, import_react.useState)(() => loadHabits());
	const lines = watchLines(habits);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "watch",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "watch-back",
				onClick: onBack,
				children: "Quay lại"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "AI" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "watch-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: AI_INTRO }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "watch-basics",
						children: AI_BASICS.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
					}),
					lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "watch-note",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: line.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: line.text })]
					}, line.title)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act alt press",
						onClick: () => {
							clearHabits();
							setHabits(loadHabits());
						},
						children: "Xoá trí nhớ"
					})
				]
			})
		]
	});
}
function Plans({ onBack }) {
	useLang();
	const [list, setList] = (0, import_react.useState)(() => loadStrategies());
	const [edit, setEdit] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(null);
	const [adding, setAdding] = (0, import_react.useState)(null);
	const [pool, setPool] = (0, import_react.useState)("monster");
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	const [spread, setSpread] = (0, import_react.useState)({});
	const [currentId, setCurrentId] = (0, import_react.useState)(null);
	const hold = (0, import_react.useRef)(null);
	const skipClick = (0, import_react.useRef)(false);
	const foot = (0, import_react.useRef)(null);
	const shown = sortStrategies(list);
	const found = shown.findIndex((row) => row.id === currentId);
	const page = found >= 0 ? found : 0;
	const plan = shown[page];
	(0, import_react.useEffect)(() => {
		if (plan && currentId !== plan.id) setCurrentId(plan.id);
	}, [plan, currentId]);
	(0, import_react.useEffect)(() => {
		if (edit) return;
		foot.current?.scrollIntoView({ block: "end" });
	}, [edit, plan?.id]);
	function commit(next) {
		setList(next);
		saveStrategies(next);
	}
	function patch(id, change) {
		commit(list.map((row) => row.id === id ? {
			...row,
			...change
		} : row));
	}
	function leaveEdit() {
		setEdit(false);
		setAdding(null);
		setOpen(null);
		setConfirmId(null);
	}
	function armEdit() {
		hold.current = window.setTimeout(() => {
			hold.current = null;
			skipClick.current = true;
			setEdit(true);
			setAdding(null);
			setOpen(null);
			setConfirmId(null);
		}, 600);
	}
	function dropEdit() {
		if (hold.current === null) return;
		window.clearTimeout(hold.current);
		hold.current = null;
	}
	function addPlan() {
		const row = {
			id: `s${Date.now()}`,
			name: "Chiến thuật mới",
			cards: [],
			text: "",
			source: ""
		};
		commit([...list, row]);
		setCurrentId(row.id);
		setConfirmId(null);
	}
	const cards = plan ? sortCards(plan.cards) : [];
	const taken = new Set(list.flatMap((row) => row.cards));
	const grayIds = new Set(FORMS.map((card) => card.id));
	const poolCards = plan ? pool === "monster" ? [...MONSTERS, ...FORMS].filter((card) => !taken.has(card.id)).sort((a, b) => a.stars - b.stars || a.name.localeCompare(b.name, "vi")) : [...SPELLS].filter((card) => !taken.has(card.id)).sort((a, b) => a.gems - b.gems || a.name.localeCompare(b.name, "vi")) : [];
	const long = plan ? plan.text.length > 140 || plan.source.length > 80 : false;
	const opened = plan ? Boolean(spread[plan.id]) : false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "watch is-wide is-plan",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "watch-back",
				onClick: onBack,
				children: "Quay lại"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "info-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tr("Chiến thuật") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `wrench${edit ? " on" : ""}`,
					"aria-label": edit ? "Thoát sửa" : "Nhấn giữ để sửa chiến thuật",
					"aria-pressed": edit,
					onContextMenu: (event) => event.preventDefault(),
					onPointerDown: () => {
						if (!edit) armEdit();
					},
					onPointerUp: dropEdit,
					onPointerLeave: dropEdit,
					onPointerCancel: dropEdit,
					onClick: () => {
						if (skipClick.current) {
							skipClick.current = false;
							return;
						}
						if (edit) leaveEdit();
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
						viewBox: "0 0 24 24",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							fill: "currentColor",
							d: "M22.7 19.3 13.4 10a5 5 0 0 0-6.3-6.3l3.2 3.2-2.1 2.1-3.2-3.2a5 5 0 0 0 6.3 6.3l9.3 9.3a1.5 1.5 0 0 0 2.1-2.1Z"
						})
					})
				})]
			}),
			!plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "plan-empty",
				children: tr("Chưa có chiến thuật. Nhấn giữ cờ lê để sửa.")
			}) : null,
			plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "plan",
				children: [
					edit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "plan-name",
						value: plan.name,
						"aria-label": "Tên chiến thuật",
						onChange: (event) => patch(plan.id, { name: event.target.value })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "plan-title",
						children: plan.name || "Chưa đặt tên"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "deck-grid plan-grid",
						children: cards.map((id) => {
							const monster = monsterCard(id);
							const key = `${plan.id}:${id}`;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `plan-card${grayIds.has(id) ? " is-gray" : ""}`,
								onClick: () => {
									if (edit) patch(plan.id, { cards: plan.cards.filter((item) => item !== id) });
									else setOpen(open === key ? null : key);
								},
								children: monster ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									monster,
									selected: open === key
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
									spellId: id,
									selected: open === key
								})
							}), !edit && open === key ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: `focus-copy is-inline${monster ? " is-skill" : " is-spell"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: monster?.name ?? spellCard(id)?.name }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: monster ? "ink-skill" : "ink-spell",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyText, { text: monster?.skill ?? spellCard(id)?.effect ?? "" })
									}),
									DECK_NOTES[id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "deck-note",
										children: tr(DECK_NOTES[id])
									}) : null
								]
							}) : null] }, id);
						})
					}),
					edit && adding === plan.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "deck-tabs plan-tabs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `chip${pool === "monster" ? " on" : ""}`,
								onClick: () => setPool("monster"),
								children: tr("Quái thú")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `chip${pool === "spell" ? " on" : ""}`,
								onClick: () => setPool("spell"),
								children: tr("Phép")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "chip",
								onClick: () => setAdding(null),
								children: "Xong"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "deck-grid plan-grid",
						children: poolCards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `plan-card${"skill" in card && grayIds.has(card.id) ? " is-gray" : ""}`,
							onClick: () => patch(plan.id, { cards: [...plan.cards, card.id] }),
							children: "skill" in card ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { monster: card }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, { spellId: card.id })
						}, card.id))
					})] }) : null,
					edit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						adding === plan.id ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "act alt press plan-wide",
							onClick: () => {
								setAdding(plan.id);
								setPool("monster");
							},
							children: "Thêm lá"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "plan-text",
							value: plan.text,
							"aria-label": "Mô tả chiến thuật",
							placeholder: "Mô tả chiến thuật",
							onChange: (event) => patch(plan.id, { text: event.target.value })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "plan-source",
							value: plan.source,
							"aria-label": "Nguồn",
							placeholder: "Nguồn",
							onChange: (event) => patch(plan.id, { source: event.target.value })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "act press plan-wide",
							onClick: addPlan,
							children: "Thêm chiến thuật"
						})
					] }) : plan.text || plan.source ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `plan-body${long && !opened ? " is-clamp" : ""}`,
						children: [
							plan.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "plan-text",
								children: plan.text
							}) : null,
							plan.source ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "plan-source",
								children: [
									tr("Nguồn"),
									": ",
									plan.source
								]
							}) : null,
							long && !opened ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "plan-more",
								onClick: () => setSpread((current) => ({
									...current,
									[plan.id]: true
								})),
								children: "Xem hết"
							}) : null
						]
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "plan-bar",
				ref: foot,
				children: [
					edit && plan && confirmId === plan.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press plan-wide",
						onClick: () => {
							const rest = list.filter((row) => row.id !== plan.id);
							const order = sortStrategies(rest);
							commit(rest);
							setCurrentId(order[Math.min(page, Math.max(0, order.length - 1))]?.id ?? null);
							setConfirmId(null);
						},
						children: "Xoá"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act alt press plan-wide",
						onClick: () => setConfirmId(null),
						children: "Không"
					})] }) : null,
					edit && plan && confirmId !== plan.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act alt press plan-wide",
						onClick: () => setConfirmId(plan.id),
						children: "Xoá"
					}) : null,
					edit && !plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "act press plan-wide",
						onClick: addPlan,
						children: "Thêm chiến thuật"
					}) : null,
					shown.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "plan-next press",
						"aria-label": "Chiến thuật trước",
						onClick: () => setCurrentId(shown[(page - 1 + shown.length) % shown.length].id),
						children: "<"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "plan-next press",
						"aria-label": "Chiến thuật sau",
						onClick: () => setCurrentId(shown[(page + 1) % shown.length].id),
						children: ">"
					})] }) : null
				]
			})
		]
	});
}
//#endregion
export { InfoPage as component };
