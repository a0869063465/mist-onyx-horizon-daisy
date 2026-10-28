import { applyMonster, applySpell } from "@/lib/card-edits";

export type MonsterCard = {
  id: string;
  name: string;
  stars: number;
  gems: number;
  skill: string;
  atk: number;
  def: number;
  mdef: number;
  hp: number;
  art: string;
  picture?: string;
  since?: string;
  still?: boolean;
  strong?: string;
  weak?: string;
  counter?: string;
};

export type SpellCard = {
  id: string;
  name: string;
  gems: number;
  effect: string;
  picture?: string;
  env?: boolean;
  since?: string;
};

export const MONSTERS: MonsterCard[] = [
  {
    "id": "phu-thuy-thoi-gian",
    "name": "Phù thuỷ thời gian",
    "stars": 1,
    "gems": 1,
    "skill": "__**Lão hoá**__. \nChọn 1 quái thú là đối thủ hoặc đồng minh.\nĐồng minh (1-2 sao) tăng 35% chỉ số. \nĐối thủ giảm 35% chỉ số,\n\n__**Cường hoá Lão Hoá.**__\nVòng quay thời gian sẽ mở ra\nNếu thành công. Cường hoá Láo hoá tiêu diệt ngay kẻ địch. \nĐồng minh đặc biệt thì tiến hoá.\n\n**__Dòng chảy thời gian__**. \nTốn 2 mana. Ảnh hưởng của ma pháp cường hoá của lão hoá lên tất cả các bài quân trên sân.",
    "atk": 1,
    "def": 1,
    "mdef": 2,
    "hp": 1,
    "art": "thoi-gian",
    "strong": "Đa năng, thay đổi cục diện ván đấu. \nQuái 1 sao nhưng late vẫn khoẻ.",
    "weak": "- Đầu game sẽ khó chơi hơn quái 1 sao khác.\n- Có rủi ro "
  },
  {
    "id": "rong-phun-hoa-cau",
    "name": "Rồng canh pháo đài",
    "stars": 2,
    "gems": 0,
    "skill": "__**Lộ diện**__: \nTiêu hao 0 mana để làm lộ diện tất cả quái thú dự bị của đối thủ.\n\n__**Hoả cầu**__: \nTiêu hao 1 mana phóng cầu lửa, giảm 1 thủ phép và gây 3 sát thương phép lên 1 kẻ địch hoặc người chơi.",
    "atk": 4,
    "def": 1,
    "mdef": 2,
    "hp": 5,
    "art": "rong-hoa"
  },
  {
    "id": "chien-si-gam-nham",
    "name": "Chiến sĩ gặm nhắm",
    "stars": 2,
    "gems": 1,
    "skill": "**__Khiên thú sĩ__**: \nỞ trạng thái phòng thủ, tôi tiêu 1 mana để tăng gấp đôi phòng ngự và thêm 2 máu tối đa. ",
    "atk": 3,
    "def": 1,
    "mdef": 1,
    "hp": 5,
    "art": "gam",
    "strong": "Quái 2 sao nhưng rất trâu",
    "weak": "Công trung bình.",
    "counter": "Nó muốn kích khiên và hồi máu phải có mana, hãy dụ nó kích skill và tiêu diệt lúc nó hết tài nguyên."
  },
  {
    "id": "kiem-si-lua-thieng",
    "name": "Kiếm sĩ lửa thiêng",
    "stars": 3,
    "gems": 0,
    "skill": "**__Vệt lửa__**: \nTiêu hao 1 mana để gây 4 sát thương phép lên 1 kẻ địch.\n\n__**Truy cùng diệt tận:\n**__Sau đòn phép đầu tiên, có thể tiêu thêm 2 máu để gây thêm 4 sát thương phép một lần nữa.\n\n**__Hoả thần long__**: \nTiêu hao thêm 3 máu và 1 mana để gây 4 sát thương phép và 2 sát thương chuẩn.",
    "atk": 3,
    "def": 0,
    "mdef": 2,
    "hp": 7,
    "art": "kiem-si"
  },
  {
    "id": "dau-si-bo-tot",
    "name": "Đấu sĩ bò tót",
    "stars": 3,
    "gems": 1,
    "skill": "**__Chiến lợi phẩm__**: \nHạ gục mục tiêu trong chiến trường\n- Quái 1-2 sao cho 2 điểm, 3 sao cho 3, 4 sao cho 4.\n- Hai điểm đầu tiên hồi máu. Điểm dư sau đó chuyển thành máu tối đa, công, rồi phòng ngự.",
    "atk": 5,
    "def": 1,
    "mdef": 3,
    "hp": 6,
    "art": "bo-tot"
  },
  {
    "id": "trieu-hoi-ac-ma",
    "name": "Triệu hồi ác ma",
    "stars": 4,
    "gems": 0,
    "skill": "__**Khế ước ác ma:\n**__Nếu có ít nhất 3 sao, hãy hiến dâng linh hồn cho ác ma để triệu hồi ta. \nKhế ước cần 1 mana khi triệu hồi, và mỗi mana duy trì thời gian của ác ma thêm 2 lượt.\n\n**__Sấm địa ngục: __**\nGây 5 sát thương phép lên 1 kẻ địch, tốn 0 mana.\nKẻ đang ẩm ướt nhận thêm 2 sát thương và đòn lan sang kẻ địch khác cũng đang ẩm ướt.",
    "atk": 6,
    "def": 0,
    "mdef": 2,
    "hp": 5,
    "art": "ac-ma"
  },
  {
    "id": "ky-si-bong-toi",
    "name": "Kỵ sĩ bóng tối",
    "stars": 4,
    "gems": 1,
    "skill": "__**Kỵ pháp: \n**__Khi giáp lá cà, Ta được nhận +3 công, +2 thủ, hoặc +2 máu tối đa.\n\nNếu đối thủ có công cao hơn hoặc là quái 4 sao trở lên, chiến ý sẽ cho phép ta được thêm 1 lựa chọn.\n\n__**Hiến tế:**__ (1 mana)\n- Kỵ sĩ bóng tối đi qua con đường hỗn mang trong 5 lượt, hiến tế linh hồn (công và phòng ngự về 0 và không thể hành động)\n- Mỗi quái thú 1 sao triệu hồi trong khoãng thời gian này làm mồi cho hiến tế, Tăng 1 điểm phòng ngự của Kỵ sĩ bóng tối, và khả năng hồi 1 máu cuối lượt đấu.\n-Sau khi băng qua hỗn mang, linh hồn kỵ sĩ quay về, tiến hoá thể xác, giải mọi trạng thái bất lợi và hồi đầy máu. Hoá thành Chiến binh huyền thoại.",
    "atk": 4,
    "def": 1,
    "mdef": 1,
    "hp": 7,
    "art": "ky-si"
  },
  {
    "id": "yeu-tinh-chuc-phuc",
    "name": "Yêu tinh chúc phúc",
    "stars": 2,
    "gems": 1,
    "skill": "__**Lời chúc phúc của tinh linh**__: \nKhi ở trên sân, quái khác của bạn được +1 phòng ngự.\n\n__**Hỗ công**__: \nTiêu hao 1 mana. Hỗ trợ 1 đồng minh.\nĐòn kế tiếp của đồng minh tăng 3 công, +1 thủ và 3 sát thương phép.\nHết khi đòn đó xong, hoặc hết lượt.\n\n__**Hộ thủ**__: \nTiêu hao 1 mana.\nKhi đối thủ tấn công người chơi hoặc một quái của bạn, có thể hồi 3 máu và +1 phòng ngự cho quái đang lao ra đỡ đòn hoặc đang bị nhắm đến. ",
    "atk": 0,
    "def": 1,
    "mdef": 1,
    "hp": 3,
    "art": "yeu-tinh"
  },
  {
    "id": "mo-voi-ma-mut",
    "name": "Mộ voi ma mút",
    "stars": 2,
    "gems": 0,
    "skill": "**__Nguyền rủa__**: \nTiêu hao 1 mana, Tôi sẽ hy sinh và sử dụng lượng máu hiện tại tấn công vào 1 quái thú đối phương.\nVà bào mòn chúng qua từng lượt với 1 sát thương chuẩn (gâp đôi khi đến lượt đối phương) đến khi đối phương gục ngã\n\n__**Ác linh:\n**__Khi hy sinh bằng chiến đấu, mộ voi cũng tự kích hoạt bào mòn, nhưng chỉ duy trì 2 lượt.",
    "atk": 3,
    "def": 3,
    "mdef": 4,
    "hp": 2,
    "art": "voi",
    "strong": "Thủ rất to, skill rất mạnh",
    "weak": "Không có dame tay.",
    "counter": "Ra quái thủ cao để huỷ dame tay của nó, hoặc ra quái công cao cùng tự huỷ với nó."
  },
  {
    "id": "ong-khong-lo",
    "name": "Ong khổng lồ",
    "stars": 2,
    "gems": 0,
    "skill": "__**Kim châm tê liệt**__: \nTiêu hao 1 mana gây tê liệt 1 quái thú trong 5 lượt.",
    "atk": 6,
    "def": 0,
    "mdef": 0,
    "hp": 3,
    "art": "ong"
  },
  {
    "id": "linh-chien-da-khong-lo",
    "name": "Lính chiến đá khổng lồ",
    "stars": 2,
    "gems": 1,
    "skill": "**__Tường thành__**: \nKhi một quái thú đồng minh bị đánh thường, hoặc kỹ năng gây sát thương chọn làm mục tiêu. Tiêu hao 1 mana để đỡ cho đồng minh đó.\nChỉ đỡ đòn được 2 lần, tính cả dùng skill.",
    "atk": 1,
    "def": 2,
    "mdef": 2,
    "hp": 8,
    "art": "linh-da",
    "strong": "Thủ mạnh, máu nhiều, còn đỡ được đòn cho team.",
    "weak": "Không có công",
    "counter": "Nó đỡ đòn hộ cũng phải hao mana, hơn nữa khả năng phản đòn của nó cực thấp.\nCứ lấy quái công cao mà giáp đánh."
  },
  {
    "id": "khung-long-vay-kiem",
    "name": "Khủng long vãy kiếm",
    "stars": 2,
    "gems": 1,
    "skill": "**__Vãy phá giáp__**: \nGiao tranh giáp lá cà làm giảm 2 thủ của quái địch.",
    "atk": 1,
    "def": 3,
    "mdef": 0,
    "hp": 5,
    "art": "khung-long",
    "strong": "Khả năng thủ và trừ giáp khi có nhiều đồng minh nhồi vào.",
    "weak": "- Đơn chiến\n- không có thủ phép",
    "counter": "- 1 phép mạnh, hoặc 2 phép trung bình"
  },
  {
    "id": "rong-boc-trung",
    "name": "Rồng bọc trứng",
    "stars": 3,
    "gems": 1,
    "skill": "__**Linh hoạt**__\nĐổi thế công hoặc thế thủ một lần mỗi lượt, trước khi tấn công.\n\n__**Thế công \n**__+4 công.\n \n__**Thế thủ \n**__+2 phòng ngự và không được tấn công. Hết lượt ở thế thủ thì hồi 3 máu.",
    "atk": 0,
    "def": 1,
    "mdef": 0,
    "hp": 8,
    "art": "rong-trung"
  },
  {
    "id": "ga-he-dang-so",
    "name": "Gã hề đáng sợ",
    "stars": 1,
    "gems": 0,
    "skill": "**__Quả cầu bóng đêm__**: \nTiêu 1 mana tích luỹ năng lượng bóng tối mỗi lượt (lượt tích luỹ tự động ở lượt đối thủ mà không tiêu hao mana) tích đủ 2 lần có thể thi triển kỹ năng gây 6 sát thương, cứ thêm 2 lần gây thêm 4 sát thương.",
    "atk": 0,
    "def": 2,
    "mdef": 2,
    "hp": 3,
    "art": "ga-he",
    "strong": "Chỉ số khá, sát thương cao",
    "weak": "- Tích sát thương lâu\n- Không có sức thủ",
    "counter": "Dùng quái có dame vật lý đánh vào, đặc biệt đang lúc hắn gồng skill."
  },
  {
    "id": "tho-den-tinh-nghich",
    "name": "Thỏ đen tinh nghịch",
    "stars": 1,
    "gems": 1,
    "skill": "__**Nhảy qua lại**__: \nCó khả năng né được 40% sát thương trong các cuộc giao tranh, tăng lên đến 75% khi đấu với quái thú từ 3 sao trở lên.",
    "atk": 4,
    "def": 0,
    "mdef": 0,
    "hp": 2,
    "art": "tho-den",
    "strong": "Công cao, có khả năng né tránh",
    "weak": "- Không né được phép\n- Máu rất thấp",
    "counter": "Dùng phép vào nó."
  },
  {
    "id": "cuc-bong-ma-quai",
    "name": "Cục bông ma quái",
    "stars": 1,
    "gems": 0,
    "skill": "__**Phát nổ**__\nKhông hao mana, Tự huỷ, gây sát thương phép lên kẻ địch bằng với công.\n\n__**Pháo kích**__\nDùng 1 mana nhân bản chính nó. \n\n__**Bông mềm**__\nKhi người chơi bị tấn công, Trên tay người chơi bấm Use: Triệu hồi bản thân chặn tốn 1 mana, các bản sao còn lại sẽ lấp đầy sân đấu.\n\n__**Lưu ý:**__\nMỗi loại kỹ năng chỉ dùng 1 lần rồi mất. \nCác kỹ năng ngoài Phát nổ đều không tính là đã hành động.",
    "atk": 2,
    "def": 0,
    "mdef": 0,
    "hp": 1,
    "art": "bong",
    "strong": "Đa năng, từ tấn công, đến phòng thủ, thậm chí ngay từ trên tay.",
    "weak": "Dùng 1 lần rồi mất, hao bài."
  },
  {
    "id": "quai-thu-thien-su",
    "name": "Quái thú thiên sứ",
    "stars": 1,
    "gems": 1,
    "skill": "**__Cầu nguyện__**: \nMỗi lần đến lượt, người chơi cần tiêu hao 1 mana để cầu nguyện, duy trì tôi trên sân khi đến lượt.\n\n**__Ân huệ thiên sứ__**: \nNếu có tôi trên sân, người chơi sẽ nhận thêm 1 mana mỗi khi đến lượt.",
    "atk": 0,
    "def": 0,
    "mdef": 0,
    "hp": 6,
    "art": "thien-su",
    "strong": "Trade mana giúp đẩy ván đấu cực nhanh",
    "weak": "Dễ bị khắc chế, và ngốn mana nếu dùng sai.",
    "counter": "Tiêu diệt nó ngay khi có thể."
  },
  {
    "id": "te-giac-be-con",
    "name": "Tê giác bé con",
    "stars": 1,
    "gems": 0,
    "skill": "__**Thăng cấp**__. \nTốn 1 mana để tiến hoá\nMỗi lần thăng cấp đổi tên và chỉ số gốc, hồi 2 máu.",
    "atk": 2,
    "def": 0,
    "mdef": 0,
    "hp": 3,
    "art": "te-giac",
    "strong": "Kiểm soát tốt thì sẽ có quái mạnh ở giai đoạn cực sớm.",
    "weak": "Rất dễ chết và hao tài nguyên nếu dùng sai",
    "counter": "Đừng để nó tiến hoá và hồi phục, \nHãy tất tay 1 lần. "
  },
  {
    "id": "phu-thuy-ti-hon",
    "name": "Phù thuỷ tí hơn",
    "stars": 1,
    "gems": 0,
    "skill": "**__Cầu sấm__**: \nDùng 1 mana gây sát thương phép bằng 3 cộng với số sao hiện có, lên người đối thủ hoặc 1 quái địch.",
    "atk": 1,
    "def": 0,
    "mdef": 2,
    "hp": 3,
    "art": "ti-hon",
    "strong": "Đầu game hay cuối game đều khoẻ",
    "weak": "Không có sức thủ",
    "counter": "Đánh bằng quái vật lý, nếu công cao chỉ cần 1 đòn"
  },
  {
    "id": "sau-non",
    "name": "Sâu non",
    "stars": 1,
    "gems": 0,
    "skill": "__**Hoá Kén**__: \nTiêu hao 1 mana.\nKén có công 0, thủ 3, thủ phép 1, máu 4.\nTiêu thêm 1 mana để tạo tối đa 2 chân kén, để phòng ngự tốt hơn.\nKén và chân kén hồi 1 máu sau mỗi lượt.\n\nSố Cam: \nĐầu lượt của bạn, kén đếm thêm 1.\nĐủ 4 lần đếm, kén ngài có thể nở ra Ngài Khổng lồ, \nĐủ 5 lần đếm, Ngài Nữ hoàng, \nĐủ 6 lần đếm, Ngài tối thượng.\nChết từ mốc 4 trở lên thì nở đúng ngài mốc đó. ",
    "atk": 1,
    "def": 0,
    "mdef": 0,
    "hp": 2,
    "art": "sau-non",
    "strong": "Sau khi tiến hoá rất mạnh.",
    "weak": "Thời gian kén tuy không lâu, nhưng cũng không dễ để bảo vệ.",
    "counter": "Nếu nó đã hoá kén thì tiêu diệt kén sớm nhất có thể."
  },
  {
    "id": "trai-tim-hai-long",
    "name": "Trái tim hải long",
    "stars": 3,
    "gems": 0,
    "skill": "__**Triều lên:\n**__gây 4 sát thương phép lên 1 lẻ địch\n\n__**Con nước lớn tàn phá: \n**__thêm 1 mana, gây 5 sát thương phép và thêm 1 kẻ địch ngẫu nhiên.\n\n**__Đại hồng thuỷ huỷ diệt__**: \nthêm 2 mana, gây 6 sát thương phép lên tất cả kẻ địch.\n\n__**Ngập lụt**__\nKẻ bị đòn này hạ thì đối phương không dùng ô đó đến hết lượt kế của họ.",
    "atk": 4,
    "def": 1,
    "mdef": 1,
    "hp": 6,
    "art": "hai-long"
  },
  {
    "id": "sua-hut-ma-phap",
    "name": "Sứa hút ma pháp",
    "stars": 2,
    "gems": 1,
    "skill": "__**Tích luỹ ma pháp**__: \n- Phần sát thương phép bị thủ phép chặn được tích lại.\n- Tốn 0 mana gây 3 cộng với số sát thương đã tích tụ lên 1 kẻ địch hoặc người chơi.",
    "atk": 1,
    "def": 0,
    "mdef": 4,
    "hp": 5,
    "art": "sua"
  },
  {
    "id": "con-thinh-no-cua-hai-vuong",
    "name": "Cơn thịnh nộ của hải vương",
    "stars": 1,
    "gems": 0,
    "skill": "__**Hộ thần:**__\nNhận 1 lá chắn vật lý và 1 lá chắn phép vĩnh viễn.\n\nĐè nén: \nMỗi hành động của đối thủ nhắm vào phe ta cho ta +3 công và +3 sát thương cho \"cơn thịnh nộ của hải thần\".\n  \nCơn thịnh nộ của hải thần:\nTiêu hao 1 mana. Gây 2 + 3 × số lần bị đè nén, lên 1 kẻ địch hoặc người chơi đối thủ.\n\nBiển lặng:\nSau khi tấn công hoặc thi triển kỹ năng.Cơn thịnh nộ sẽ biến mất.",
    "atk": 1,
    "def": 0,
    "mdef": 0,
    "hp": 2,
    "art": "hai-vuong"
  },
  {
    "id": "chien-binh-lan-khuat",
    "name": "Chiến binh lẫn khuất",
    "stars": 1,
    "gems": 0,
    "skill": "Ẩn mình: \nTiêu hao 1 mana. Tạo ra thế thân ngay vị trí ta đang đứng. Trong lúc ẩn mình, có thể tuỳ ý ám sát kẻ địch mà không bị phản đòn, sát thương lúc đó gây ra sẽ là sát thương chuẩn. \n\nSố cam cho thấy quá trình ẩn thân đang bắt đầu.",
    "atk": 2,
    "def": 0,
    "mdef": 0,
    "hp": 1,
    "art": "lan-khuat",
    "since": "2026-10-13"
  },
  {
    "id": "ke-san-moi-tu-than",
    "name": "Kẻ săn mồi tử thần",
    "stars": 1,
    "gems": 1,
    "skill": "Kẻ săn mồi tử thần\n- Ta nhắm đến 1 mục tiêu nào đấy. Liên tục hồi sinh và thay đổi loại sát thương đến khi con mồi của mình gục xuống.\n- Mỗi lượt ngươi cần tiêu hao 1 mana, để truy sát con mồi của mình.",
    "atk": 3,
    "def": 0,
    "mdef": 0,
    "hp": 1,
    "art": "san-moi",
    "since": "2026-10-13"
  },
  {
    "id": "sat-nhan-bat-giu",
    "name": "Sát nhân bắt giữ",
    "stars": 1,
    "gems": 1,
    "skill": "Bắt Giữ:\nTiêu hao 0 mana, (không bị tính là hành động). Chọn 1 quái thú địch và khoá cứng đến hết lượt này. (Quái hiện nguyên hình, bị khoá hành động và tất cả buff phòng ngự có lợi)",
    "atk": 3,
    "def": 0,
    "mdef": 0,
    "hp": 2,
    "art": "sat-nhan",
    "since": "2026-10-13"
  },
  {
    "id": "kraken",
    "name": "Kraken",
    "stars": 2,
    "gems": 1,
    "skill": "**__Đắm tàu__**: \nKhi giáp lá cà, phần sát thương bị thủ của Kraken chặn được sẽ thêm vào công của hắn.",
    "atk": 3,
    "def": 3,
    "mdef": 0,
    "hp": 4,
    "art": "kraken",
    "strong": "Trao đổi vật lý, dame rất to, thủ rất mạnh.\n",
    "weak": "Không có thủ phép, máu không cao",
    "counter": "Đánh phép trúng nó"
  },
  {
    "id": "kazura",
    "name": "Kazura",
    "stars": 2,
    "gems": 1,
    "skill": "**__Săn bắt vì bạn__**: \n- Khi tấn công, sát thương ăn vào máu mục tiêu, hồi lượng máu đó cho Kizuran. (Phần sát thương dư hồi cho tôi.)\n \n- Điểm số phía trên là số máu ảo mà tôi hiện có (do Kizuran kiếm được)\n\n__**Ngủ đông\n**__Tôi Không thể bị chọn làm mục tiêu tấn công trong 2 lượt đầu ra sân. Và cũng không thể làm gì trong 2 lượt đó.",
    "atk": 6,
    "def": 1,
    "mdef": 0,
    "hp": 3,
    "art": "kazura",
    "strong": "Công rất cao",
    "weak": "Máu yếu, không có thủ phép",
    "counter": "- 1 phép thường là đi\n- Hoặc lấy quái cấp thấp công cao đổi ngang."
  },
  {
    "id": "kizuran",
    "name": "Kizuran",
    "stars": 2,
    "gems": 1,
    "skill": "**__Chịu đòn vì bạn__**: \nSát thương do tôi nhận được biến thành điểm tích luỹ. Điểm do tôi kiếm được sẽ tạo thành giáp ảo cho Kazura, giúp hắn tự tin hơn khi giao tranh.\n\nSố cam:\nĐây là điểm do Kazura kiếm được, nó sẽ hồi máu cho tôi.",
    "atk": 3,
    "def": 0,
    "mdef": 0,
    "hp": 8,
    "art": "kizuran",
    "strong": "Máu rất trâu",
    "weak": "Không có điểm phòng ngự",
    "counter": "Nó chỉ thực sự khoẻ khi có kazura\nKhông thì chỉ cần dồn 2-3 đòn là đi."
  },
  {
    "id": "ke-giam-ho-linh-hon",
    "name": "Kẻ giám hộ linh hồn",
    "stars": 2,
    "gems": 2,
    "skill": "__**Phẫn nộ**__: \nMỗi 3 máu người chơi đã mất, tăng vĩnh viễn 1 máu tối đa. Chỉ số đã tăng thì không mất.\n\n__**Kiếm hấp thụ linh hồn**__: \n- Khi tấn công, có thể hiến tế 2 máu người chơi, để tăng 1 điểm công, 1 điểm phòng ngự, và 1 máu tối đa trong giao tranh.\n- Mỗi lần về sau, sẽ hiến tế thêm 1 máu nữa, bù lại sẽ cường hoá nhận thêm 1 công và 1 máu tối đa cho mỗi máu hiến tế thêm, ngoài các buff đã nhận.\n- Mỗi sát thương gây được vào mục tiêu sẽ hồi 1 máu cho người chơi.",
    "atk": 2,
    "def": 1,
    "mdef": 0,
    "hp": 4,
    "art": "ke-giam-ho-linh-hon"
  },
  {
    "id": "mat-xanh-huy-diet",
    "name": "Mắt xanh huỷ diệt",
    "stars": 4,
    "gems": 2,
    "skill": "__**Cầu sấm ánh sáng:\n**__Tiêu hao 1 mana. Đòn tấn công tiếp theo thành tia sáng huỷ diệt, sát thương chuẩn bằng đúng công. Sau đòn đó trở lại đánh thường.",
    "atk": 6,
    "def": 4,
    "mdef": 4,
    "hp": 6,
    "art": "mat-xanh-huy-diet"
  },
  {
    "id": "mat-do-tan-pha",
    "name": "Mắt đỏ tàn phá",
    "stars": 4,
    "gems": 0,
    "skill": "__**Cầu lửa địa ngục :\n**__Tiêu hao 1 mana. Hắn khạc quả cầu lửa địa ngục gây sát thương hỗn hơp (4 vật lý, 5 phép và 2 chuẩn) lên quái thú trúng đòn.\n\nNếu tiêu diệt quái thú đó (Mà sát thương còn dư từ 6 trở lên)\nGây sát thương còn dư lên tất cả quái thú còn lại của kẻ địch.",
    "atk": 6,
    "def": 2,
    "mdef": 2,
    "hp": 7,
    "art": "mat-do-tan-pha"
  },
  {
    "id": "hoa-an-thit-nguoi",
    "name": "Hoa ăn thịt người",
    "stars": 1,
    "gems": 1,
    "skill": "Tôi Không đánh thường. Cũng Không thể chặn.\n__**Hấp thụ**__\nTiêu hao 0 mana. Chịu đòn từ 1 quái thú, để cướp 2 máu tối đa của nó, và cộng vào cho bản thân.",
    "atk": 0,
    "def": 3,
    "mdef": 0,
    "hp": 3,
    "art": "hoa-an-thit-nguoi",
    "still": true,
    "strong": "Thủ cao, cướp máu vĩnh viễn, và như 1 dạng dame chuẩn.",
    "weak": "Máu cơ bản thấp, không có thủ phép.",
    "counter": "Tiêu diệt sớm với skill phép."
  },
  {
    "id": "thuong-quan-long",
    "name": "Thương quản long",
    "stars": 4,
    "gems": 1,
    "skill": "__**Cò quay.\n**__Tiêu hao 1 mana\nBa nòng, mỗi nòng có tỉ lệ 45% được bắn.\nNòng 1: gây 6 sát thương vật lý. \nNòng 2: gây 5 sát thương phép. \nNòng 3: gây 4 sát thương chuẩn.\nMỗi nòng chọn 1 kẻ ngẫu nhiên, nhắm vào các kẻ địch khác nhau.",
    "atk": 6,
    "def": 1,
    "mdef": 3,
    "hp": 5,
    "art": "thuong-quan-long"
  },
  {
    "id": "may-nem-bom-hinh-nhen",
    "name": "Máy ném bom hình nhện",
    "stars": 3,
    "gems": 0,
    "skill": "**__Súng phóng lựu__**: \nTiêu hao 1 mana. Chọn 1 mục tiêu.\nTạo cơn mưa bom 5 quả, mỗi quả 1 sát thương chuẩn, nhằm đa phần vào mục tiêu chính và lạc đạn bay đến quái địch khác hoặc người chơi địch.",
    "atk": 5,
    "def": 1,
    "mdef": 3,
    "hp": 5,
    "art": "kho-nhen-may"
  },
  {
    "id": "khong-lo-mot-mat",
    "name": "Khổng lồ 1 mắt",
    "stars": 1,
    "gems": 0,
    "skill": "**__Đập phá__**: \nĐòn đánh thường chủ động của hắn tốn thêm 1 mana. Những lần bị động thì không tốn.\nTăng cho hắn 1 công vĩnh viễn sau mỗi đòn đánh thường.",
    "atk": 3,
    "def": 3,
    "mdef": 0,
    "hp": 1,
    "art": "khong-lo-mot-mat",
    "strong": "Vô dịch trong đấu vật lý",
    "weak": "Không có thủ phép",
    "counter": "Gây dame phép hoặc chuẩn. Chỉ 1 đòn. \n\nĐừng để hắn tích quá nhiều số, Đây là con quái 1 sao duy nhất có thể 1 mình tiễn bạn đi đấy. Đừng đùa với bài của ngài chủ tịch (Kaiba)"
  },
  {
    "id": "may-quay-thuong",
    "name": "Máy quay thưởng",
    "stars": 4,
    "gems": 0,
    "skill": "__**Quay thưởng:\n**__Quay thưởng một lần mỗi lượt, (Lượt quay không ảnh hưởng đến hành động)\n\nVòng quay trúng 2 ô giống nhau thì nhận được hiệu ứng. Quay trượt thì tăng sát thương cho kỹ năng.\n\n- Số 7: nhận mọi hiệu ứng có lợi. (Cường hoá, nhận mọi hiệu ứng cường hoá)\n- Kiếm: +2 công vĩnh viễn. (Cường hoá thêm +2 công.)\n- Khiên: +1 phòng ngự vĩnh viễn. (Cường hoá thêm +1 phòng ngự.)\n- Thập tự: hồi 3 máu. Máu dư thành máu tối đa. (Cường hoá thêm 3 máu tối đa.)\n-Số 6: mất 2 máu. (Cường hoá thì tự hủy.)\n\n__**Con bạc nổi giận: **__\nTiêu hao 1 mana, chọn 1 đối tượng kể cả người chơi, gây sát thương phép bằng số lần quay trượt cộng thêm 3.",
    "atk": 4,
    "def": 2,
    "mdef": 2,
    "hp": 7,
    "art": "may-quay-thuong"
  },
  {
    "id": "rong-con",
    "name": "Rồng con",
    "stars": 1,
    "gems": 0,
    "skill": "**__Hơi thở rồng__**: \nTiêu hao 1 mana để gây 2 sát thương chuẩn và 1 sát thương phép lên 1 kẻ địch hoặc người chơi.",
    "atk": 2,
    "def": 0,
    "mdef": 2,
    "hp": 2,
    "art": "rong-con",
    "strong": "Quái 1 sao duy nhất có sát thương chuẩn trong skill.",
    "weak": "Máu cực yếu, thủ cực yếu",
    "counter": "Quái vật lý đụng nhẹ là đi. "
  },
  {
    "id": "chien-binh-rong",
    "name": "Chiến binh rồng",
    "stars": 3,
    "gems": 2,
    "skill": "__**Vảy rồng: \n**__Mọi sát thương nhận vào được chia ra nhận dần trong 3 lượt.",
    "atk": 4,
    "def": 1,
    "mdef": 1,
    "hp": 4,
    "art": "chien-binh-rong"
  },
  {
    "id": "may-chem",
    "name": "Máy chém",
    "stars": 1,
    "gems": 1,
    "skill": "",
    "atk": 4,
    "def": 0,
    "mdef": 4,
    "hp": 3,
    "art": "may-chem",
    "strong": "Kháng phép, công cao",
    "weak": "Máu yếu, thủ yếu",
    "counter": "Chỉ có cách lấy quái công vật lý, cùng hy sinh với nó."
  },
  {
    "id": "ma-dao-si",
    "name": "Ma đạo sĩ",
    "stars": 3,
    "gems": 0,
    "skill": "__**Ma đạn**__: \nTiêu hao 1 mana, bắn 3 phát liên tục, sát thương tăng dần theo từng loại ma đạn, từ 1 rồi 2 và loạt cuối là 4",
    "atk": 2,
    "def": 3,
    "mdef": 1,
    "hp": 5,
    "art": "ma-dao-si"
  },
  {
    "id": "loi-nguyen-cua-rong",
    "name": "Lời nguyền của rồng",
    "stars": 3,
    "gems": 0,
    "skill": "**__Địa ngục lửa__**: \nTiêu hao 1 mana. Gây 2 sát thương chuẩn lên mọi quái địch. Không trúng người chơi.",
    "atk": 4,
    "def": 1,
    "mdef": 3,
    "hp": 4,
    "art": "loi-nguyen-cua-rong"
  },
  {
    "id": "thien-than-be-nho",
    "name": "Nàng tiên giữ khoá",
    "stars": 1,
    "gems": 1,
    "skill": "__**Thiên thần hộ mệnh**__\nTạo 1 khiên vật lý hoặc 1 khiên phép cho 1 đồng minh.\nKhiên chỉ chặn đúng loại sát thương đó.\nDính sát thương vật lý hoặc phép thì khiên biến mất.\nSát thương chuẩn không đụng tới khiên.\n\n__**Tinh linh bé nhỏ**__\nKhi ta bị nhắm, quái thú đồng minh có thể đỡ đòn hộ cho ta.",
    "atk": 0,
    "def": 0,
    "mdef": 0,
    "hp": 1,
    "art": "thien-than-be-nho",
    "strong": "Khiên vật lý hay phép đều rất mạnh ở đầu và giữa trận.",
    "weak": "Rất mỏng manh, và cần đồng đội",
    "counter": "Dồn lực vào tiêu diệt  nó trước.\nRồi đồng đội nó sau"
  },
  {
    "id": "hiep-si-cua-vua",
    "name": "Hiệp sĩ của vua",
    "stars": 2,
    "gems": 1,
    "skill": "__**Khiên Ân Huệ**__:\n- Ta nhận được lời chúc của kỵ sĩ, nếu có Hiệp sĩ hộ vệ trong bộ bài.\n    Khi lá chắn do Khiên Ân Huệ ban tặng bị mất, đầu mỗi lượt của người chơi, ta được nhận ngay 3 điểm thủ (hoặc thủ phép, tuỳ loại khiên đã mất).\n    Cuối lượt đó, khiên đã mất sẽ được hồi lại nếu ta đã gây được loại sát thương ngược với loại khiên ta đã mất.\n- Ta nhận được lời chúc của hậu, nếu có Hiệp sĩ của hậu trong bộ bài, ban cho ta 1 khiên phép vĩnh viễn. \n\n__**Kiếm tấn công**__:\n- Đòn đánh thứ 1 mài sắc thanh gươm (+5 công).\n- Đòn đánh thứ 2 tiêu hao 1 mana, gây sát thương, rồi trả thanh gươm về trạng thái ban đầu.",
    "atk": 2,
    "def": 3,
    "mdef": 0,
    "hp": 3,
    "art": "hiep-si-cua-vua"
  },
  {
    "id": "hiep-si-ho-ve",
    "name": "Hiệp sĩ hộ vệ",
    "stars": 3,
    "gems": 1,
    "skill": "__**Khiên Ân Huệ**__:\n- Ta nhận được lời chúc của hậu, nếu có Hiệp sĩ của hậu trong bộ bài, ban cho ta 1 lá chắn phép vĩnh viễn.\n- Ta nhận được lời chúc của vua, nếu có Hiệp sĩ của vua trong bộ bài, ban cho ta 1 lá chắn vật lý vĩnh viễn.\n- Ta nhận được lời chúc của kỵ sĩ, nếu có Hiệp sĩ hộ vệ trong bộ bài.\n    Khi lá chắn do Khiên Ân Huệ ban tặng bị mất, đầu mỗi lượt của người chơi, ta được nhận ngay 3 điểm thủ (hoặc thủ phép, tuỳ loại khiên đã mất).\n    Cuối lượt đó, khiên đã mất sẽ được hồi lại nếu ta đã gây được loại sát thương ngược với loại khiên ta đã mất.\n\n__**Kiếm hộ vệ**__:\n- Tiêu hao 1 mana, đỡ đòn hộ cho đồng minh hoặc người chơi. \n- Mỗi lá chắn bị vỡ do ta chủ động lao vào sẽ hấp thu lại 60% sát thương.\n- Khi khiên vỡ vì ta chủ động đỡ đòn hoặc chủ động đánh thì sẽ nổ tích tụ trước đó gây sát thương vào kẻ đối đầu, và hồi lại khiên đó vào cuối lượt.\n- Khi chủ động lao vào tấn công hay đỡ đòn, loại sát thương ta gây ra phụ thuộc vào loại khiên ta đã mất trước đó.\n\n-Số màu cam và tím là biệu thị lượng dame sẽ phản lại nếu tự phá vỡ khiên.\n\n__**Học tập và trưởng thành**__:\n- Học tập: Khi có Hiệp sĩ của vua hoặc Hiệp sĩ của hậu trên sân, ta có thể được triệu hồi, bất kể số sao.\n- Trưởng thành: Khi ra sân với đủ 3 sao, cộng thêm 2 công và 3 máu vĩnh viễn.",
    "atk": 2,
    "def": 0,
    "mdef": 0,
    "hp": 2,
    "art": "hiep-si-ho-ve"
  },
  {
    "id": "hiep-si-cua-hau",
    "name": "Hiệp sĩ của hậu",
    "stars": 2,
    "gems": 1,
    "skill": "__**Khiên Ân Huệ**__:\n- Ta nhận được lời chúc của kỵ sĩ, nếu có Hiệp sĩ hộ vệ trong bộ bài.\n    Khi lá chắn do Khiên Ân Huệ ban tặng bị mất, đầu mỗi lượt của người chơi, ta được nhận ngay 3 điểm thủ (hoặc thủ phép, tuỳ loại khiên đã mất).\n    Cuối lượt đó, khiên đã mất sẽ được hồi lại nếu ta đã gây được loại sát thương ngược với loại khiên ta đã mất.\n- Ta nhận được lời chúc của vua, nếu có Hiệp sĩ của vua trong bộ bài, ban cho ta 1 lá chắn vật lý vĩnh viễn. \n\n__**Đàm phán**__:\n- Tiêu hao 1 mana cho cả hai đòn. Ngoài ta, mỗi bên cần ít nhất 1 quái trên sân.\n- Đòn 1: ta chọn quái của ta để chịu đòn, đối thủ chọn quái của họ để lao vào.\n- Đòn 2: đối thủ chọn quái của họ để chịu đòn, ta chọn quái của ta để lao vào.\n\n- Trong lúc phản ứng, skill của quái và đòn đánh vốn tốn mana đều không hao mana.\n- Quái tham gia không mất trạng thái có lợi và không tính là đã hành động trong lượt này.\n\n__**Kiếm phép**__:\n- Đếm lần lượt 1, 2, 1, 2. Cùng lượt hay khác lượt đều tính.\n- Lần 1: tiêu hao 0 mana. Gây 1 sát thương phép và 1 sát thương vật lý lên 1 quái địch.\n- Lần 2: tiêu hao 1 mana. Gây 3 sát thương vật lý, 3 sát thương phép và 1 sát thương chuẩn lên 1 quái địch.",
    "atk": 1,
    "def": 0,
    "mdef": 3,
    "hp": 3,
    "art": "hiep-si-cua-hau"
  },
  {
    "id": "my-dieu-nhan",
    "name": "Mỹ điểu nhân",
    "stars": 2,
    "gems": 0,
    "skill": "__**Giáp và Vuốt**__\nKhi bị skill hoặc phép nhắm tới, tiêu hao 2 mana để huỷ nó.\nTăng vĩnh viễn 2 thủ và 2 máu tối đa.\n\n__**Thổi bay**__\nTiêu hao 1 mana. Huỷ 1 lá phép ngẫu nhiên trên tay đối thủ.\n\n__**Mê hoặc**__\nTiêu hao 1 mana. Kích động 1 quái địch đánh thường vào ta.\nQuái đó không thể hành động ở lượt sau.\n\n__**Roi điện**__\nKhi bị đòn đánh thường nhắm vào, tiêu hao 2 mana để né.\nTăng vĩnh viễn 3 công và trả 5 sát thương phép.\n\n__**Lông vũ:**__ \nMỗi kỹ năng dùng 1 lần rồi biến mất vĩnh viễn.\nĐủ 4 kỹ năng thì chờ tiến hoá.",
    "atk": 3,
    "def": 1,
    "mdef": 1,
    "hp": 4,
    "art": "my-dieu-nhan"
  },
  {
    "id": "the-than-cua-shien",
    "name": "Thế thân của shien",
    "stars": 1,
    "gems": 0,
    "skill": "__**Thế thân**__:\n- Trên sân, khi một quái đồng minh hoặc người chơi bị nhắm đến, chuyển mục tiêu sang ta.\n- Trên tay, khi 1 đồng minh trên sân có nguy cơ gặp nạn, tiêu hao 1 mana để thế chỗ, đồng minh về tay giữ nguyên trạng thái, và triệu hồi lại ở lượt sau đó mà không tốn mana.",
    "atk": 3,
    "def": 0,
    "mdef": 0,
    "hp": 2,
    "art": "the-than-cua-shien",
    "since": "2026-10-14"
  },
  {
    "id": "phu-thuy-rung-den",
    "name": "Phù thuỷ rừng đen",
    "stars": 1,
    "gems": 0,
    "skill": "__**Nguyền rủa**__: Tiêu hao 1 mana, để nguyền rủa 1 kẻ địch, bảng chọn hiện ra, -3 công -3 sát thương kỹ năng (nếu skill đó là hỗn hợp thì ưu tiên sát thương phép và vật lý trước) -2 thủ -2 thủ phép. Những nguyền rủa này duy trì trong 6 lượt.",
    "atk": 0,
    "def": 0,
    "mdef": 3,
    "hp": 4,
    "art": "phu-thuy-rung-den",
    "since": "2026-10-14"
  }
];

export const FORMS: MonsterCard[] = [
  {
    "id": "hiep-si-huyen-bi",
    "name": "Hiệp sĩ huyền bí",
    "stars": 5,
    "gems": 0,
    "skill": "__**Khiên toàn năng**__:\nLuôn có lá chắn vật lý và lá chắn phép vĩnh viễn. và có 2 máu ảo trước mọi đòn sát thương.\n\n__**Kiếm toàn năng**__:\n__**Tấn công**__: tiêu hao 1 mana. Mỗi đòn đánh thường chủ động chém 2 phát cùng một mục tiêu. Nhát 2 +5 công. \n\n__**Phòng ngự**__: tiêu hao 1 mana, đỡ đòn cho đồng minh hoặc người chơi. Phản lại 60% sát thương khiên nuốt cho lần lá chắn bị vỡ kế tiếp. \n\nKhi chủ động làm vỡ khiên trong giao tranh, phản sát thương đã tích luỹ vào kẻ đối đầu. Khiên bị vỡ đó sẽ hồi ở cuối lượt.\n\n__**Đàm phán**__: tiêu hao 2 mana khi đối phương có ít nhất 1 quái.\n\n- Chọn người chơi hoặc quái khác để chịu đòn, đối thủ chọn quái ra đòn.\n- Tiếp tục: đối thủ chọn quái chịu đòn, mình chọn kẻ ra đòn. Phản ứng không tốn mana. (Quái tham gia không mất trạng thái có lợi và không tính là đã hành động.)",
    "atk": 2,
    "def": 3,
    "mdef": 3,
    "hp": 3,
    "art": "hiep-si-huyen-bi"
  },
  {
    "id": "ky-si-cuoi-rong",
    "name": "Kỵ sĩ cưỡi rồng",
    "stars": 5,
    "gems": 0,
    "skill": "**__Mũi thương bị nguyền rủa__**: \nCác đòn đánh của ông ấy luôn có ít nhất 4 sát thương chuẩn.\n\n**__Lửa địa ngục__**: \nMỗi khi ông ta sáp lá cà, thì các kẻ địch còn lại đều bị lửa địa ngục gây 2 sát thương chuẩn.",
    "atk": 6,
    "def": 3,
    "mdef": 3,
    "hp": 8,
    "art": "ky-si-cuoi-rong"
  },
  {
    "id": "rong-ac-ma",
    "name": "Rồng ác ma",
    "stars": 5,
    "gems": 0,
    "skill": "__**Hoả cầu địa ngục**__: \n- Tiêu hao 1 mana. Hắn khạc quả cầu lửa địa ngục gây sát thương hỗn hơp (5 vật lý, 6 phép và 3 chuẩn) lên quái thú trúng đòn.\n- Nếu tiêu diệt quái thú đó (Mà sát thương còn dư từ 7 trở lên)\nGây sát thương còn dư lên tất cả quái thú còn lại của kẻ địch.",
    "atk": 8,
    "def": 2,
    "mdef": 2,
    "hp": 12,
    "art": "rong-ac-ma"
  },
  {
    "id": "nu-chua-dieu-nhan",
    "name": "Nữ chúa điểu nhân",
    "stars": 4,
    "gems": 0,
    "skill": "__**Giáp và Vuốt**__\nKhi bị skill hoặc phép nhắm tới, tiêu hao 2 mana để huỷ nó.\nTăng vĩnh viễn 3 thủ phép và 3 máu tối đa.\n\n__**Thổi bay**__\nHuỷ 1 lá phép ngẫu nhiên trên tay đối thủ.\n\n__**Mê hoặc**__\nKích động 1 quái địch đánh thường vào ta.\nQuái đó không thể hành động ở lượt sau.\nHoặc tiêu hao 2 mana để tiến hoá thành Dụ dỗ.\n\n__**Dụ dỗ**__\nDụ 1 quái địch đánh thường vào 1 quái của ta.\nQuái địch vẫn hành động được ở lượt sau.\nKỹ năng không mất  sau khi dùng nữa.\n\n__**Roi điện**__\nKhi bị đòn đánh thường nhắm vào, tiêu hao 1 mana để né.\nTăng vĩnh viễn 1 công và trả 5 sát thương phép.\n\n__**Lông vũ **__\nMỗi kỹ năng chỉ dùng 1 lần rồi biến mất.\n\n__**Tiến hoá**__\nĐủ 4 kỹ năng và thêm 2 hành động của cô, tính từ lúc tiến hoá, thì chờ dạng hoàn mỹ.",
    "atk": 6,
    "def": 3,
    "mdef": 1,
    "hp": 6,
    "art": "nu-chua-dieu-nhan"
  },
  {
    "id": "nu-chua-dieu-nhan-hoan-my",
    "name": "Nữ chúa điểu nhân hoàn mỹ",
    "stars": 5,
    "gems": 0,
    "skill": "__**Giáp phản**__\nSát thương bị thủ hoặc thủ phép chặn lại được cộng vào đòn đánh sau.\nPhép 6 vào thủ phép 3 thì tích 3. Vật lý 2 vào thủ 3 thì tích 2.\nĐang giáp lá cà thì phần vừa chặn dành cho đòn sau, không cộng vào đòn này.\n\n__**Gió xoáy**__\nThổi bay 1 phép ngẫu nhiên của địch.\nLượt sau không được rút bài.\nKhông tính là đã hành động.\n\n__**Dụ dỗ**__\nDụ 1 quái địch đánh thường vào 1 quái của ta.\nQuái địch vẫn hành động được ở lượt sau.\n\n__**Roi sấm**__\nTiêu hao 1 mana.\nĐòn đánh kế tiếp thành sát thương phép, gồm công và mọi sát thương đã tích.\nKhông tính là đã hành động.",
    "atk": 6,
    "def": 3,
    "mdef": 3,
    "hp": 8,
    "art": "nu-chua-dieu-nhan-hoan-my"
  },
  {
    "id": "rong-ngan-tuoi",
    "name": "Rồng ngàn tuổi",
    "stars": 4,
    "gems": 0,
    "skill": "__**Hơi thở rồng**__: \nTiêu hao 1 mana để gây 3 sát thương chuẩn và 4 sát thương phép lên 1 kẻ địch hoặc người chơi.",
    "atk": 7,
    "def": 2,
    "mdef": 3,
    "hp": 9,
    "art": "rong-ngan-tuoi"
  },
  {
    "id": "chien-binh-huyen-thoai",
    "name": "Chiến binh huyền thoại",
    "stars": 5,
    "gems": 0,
    "skill": "__**Chiến sư:**__\nTôi nhận +3 công, +2 thủ và +2 máu tối đa trong chiến đấu.\n\n__**Bền bỉ:\n**__Giữ buff Hiến Tế. Mỗi quái đã hiến tế cộng cho tôi 1 công 1 phòng ngự 1 máu và khả năng hồi 1 máu mỗi cuối lượt.",
    "atk": 2,
    "def": 0,
    "mdef": 0,
    "hp": 5,
    "art": "chien-binh-huyen-thoai"
  },
  {
    "id": "ken-ngai",
    "name": "Kén ngài",
    "stars": 1,
    "gems": 0,
    "skill": "__**Mọc chân:**__ sau khi hoá kén, mọc chân tăng sức phòng ngự, giúp kén dễ dàng sống sót hơn.\n\n__**Nở:**__\nĐầu lượt của bạn, kén đếm thêm 1.\nĐủ 4 lần đếm, kén ngài có thể nở ra Ngài Khổng lồ, \nĐủ 5 lần đếm, Ngài Nữ hoàng, \nĐủ 6 lần đếm, Ngài tối thượng.\nChết từ mốc 4 trở lên thì nở đúng ngài mốc đó.",
    "atk": 0,
    "def": 3,
    "mdef": 1,
    "hp": 4,
    "art": "ken-ngai",
    "still": true
  },
  {
    "id": "chan-ken",
    "name": "Chân kén",
    "stars": 0,
    "gems": 0,
    "skill": "Khi còn trên sân, những sát thương kén ngài phải chịu chuyển toàn bộ cho tôi.",
    "atk": 0,
    "def": 3,
    "mdef": 1,
    "hp": 2,
    "art": "chan-ken",
    "still": true
  },
  {
    "id": "ngai-khong-lo",
    "name": "Ngài Khổng lồ",
    "stars": 3,
    "gems": 0,
    "skill": "__**Thổi độc:\n**__Tiêu hao 1 mana gây 4 sát thương phép lên tất cả quái thú kẻ địch. Quái sống sót dính độc chịu 1 sát thương chuẩn đầu mỗi lượt, kéo dài 3 lượt. ",
    "atk": 3,
    "def": 1,
    "mdef": 0,
    "hp": 6,
    "art": "ngai-khong-lo"
  },
  {
    "id": "ngai-nu-hoang",
    "name": "Ngài Nữ hoàng",
    "stars": 4,
    "gems": 0,
    "skill": "__**Thổi độc**__:\nTiêu hao 1 mana gây 5 sát thương phép lên tất cả quái thú kẻ địch. \n\nGây cho chúng độc trong 5 lượt, gây thêm 1 sát thương mỗi lượt, gấp đôi vào đầu lượt đối thủ.\n\nĐộc sẽ cộng dồn nếu thi triển kỹ năng nhiều lần",
    "atk": 4,
    "def": 2,
    "mdef": 1,
    "hp": 7,
    "art": "ngai-nu-hoang"
  },
  {
    "id": "ngai-hoan-my",
    "name": "Ngài tối thượng",
    "stars": 5,
    "gems": 0,
    "skill": "__**Thổi độc**__: \nTiêu hao 1 mana gây 6 sát thương phép lên tất cả quái thú kẻ địch. \n\nGây cho chúng độc vĩnh viễn, gây thêm 1 sát thương mỗi lượt, gấp đôi vào đầu lượt đối thủ.\n\nĐộc sẽ cộng dồn nếu thi triển kỹ năng nhiều lần",
    "atk": 6,
    "def": 4,
    "mdef": 3,
    "hp": 8,
    "art": "ngai-hoan-my"
  },
  {
    "id": "te-giac-hieu-thang",
    "name": "Tê giác hiếu thắng",
    "stars": 2,
    "gems": 0,
    "skill": "__**Thăng cấp:\n**__Lên cấp cuối tiêu 2 mana và hồi 2 máu.\nTăng công, phòng ngự và chỉ số hồi phục vượt trội.",
    "atk": 3,
    "def": 1,
    "mdef": 1,
    "hp": 4,
    "art": "te-giac-2"
  },
  {
    "id": "te-giac-chien-binh",
    "name": "Chiến binh tê giác",
    "stars": 3,
    "gems": 0,
    "skill": "__**Tinh thần chiến binh**__: \nTăng vĩnh viễn 1 máu tối đa trong mỗi giao tranh.",
    "atk": 5,
    "def": 2,
    "mdef": 2,
    "hp": 5,
    "art": "te-giac-3"
  }
];

export const DECK_NOTES: Record<string, string> = {
  "trai-tim-hai-long": "Kẻ trúng đòn bị Ẩm 2 lượt.",
  "ga-he-dang-so": "Chỉ khi đã trả mana để tích, hết lượt của bạn mới cộng thêm 1 năng lượng. Không trả thì năng lượng đang có bị xoá.",
  "bien-sau": "Quái biển đang trên sân bị Ẩm, không hết.",
  "chien-si-gam-nham": "Phần tăng hết khi hết lượt.",
};

export const SPELLS: SpellCard[] = [
  {
    "id": "sam-set-tan-the",
    "name": "Sấm sét tận thế",
    "gems": 3,
    "effect": "Gây 2 + (số sao hiện có của bạn) thành sát thương chuẩn lên tất cả quái thú kẻ địch."
  },
  {
    "id": "guong-phong-ho",
    "name": "Gương phòng hộ",
    "gems": 1,
    "effect": "Tạo rào chắn ngăn đòn tấn công giáp lá cà, cướp 1/2 mọi chỉ số quái thú đang tấn công.\nLà phép vĩnh viễn. Nếu không tái kích hoạt trong 3 lượt kế tiếp sẽ bị loại bỏ."
  },
  {
    "id": "la-chan-phan-don",
    "name": "Lá chắn phản đòn",
    "gems": 0,
    "effect": "Phản đòn kỹ năng đang nhắm mình sang 1 kẻ địch bất kỳ."
  },
  {
    "id": "soi-xich-dia-nguc",
    "name": "Sợi xích địa ngục",
    "gems": 0,
    "effect": "Khống chế 1 quái thú trong 2 lượt và làm phòng ngự về 0."
  },
  {
    "id": "vong-nguyen-rua-ac-ma",
    "name": "Vòng nguyền rủa ác ma",
    "gems": 0,
    "effect": "Chặn đòn tấn công hoặc skill gây sát thương của quái thú, và nguyền quái đó. Sát thương nó gây ra còn một nửa, vĩnh viễn."
  },
  {
    "id": "sung-loi-pha",
    "name": "Sừng lôi phá",
    "gems": 0,
    "effect": "Gắn sừng cho quái không phải dạng người, thiên thần hay thiên sứ.\nKỹ năng của quái giữ nguyên. Đòn đánh thường thành kỹ năng Sấm lôi phá.\nLượt gắn sừng, lần đánh thường vào quái địch đầu tiên được chọn đánh Lan hoặc +3 sát thương,\nLan: phép tối đa 4 và lan sang quái khác. \n+3: phép (tối đa 8.)\nSau đòn đó, các đòn đánh thường sau đó biến công thành sát thương phép mà không tốn mana."
  },
  {
    "id": "hap-thu-ma-phap",
    "name": "Hấp thụ ma pháp",
    "gems": 0,
    "effect": "Hấp thu lá phép đang thi triển. Không nuốt kỹ năng quái thú.",
    "picture": "spell:thanh-guom-anh-sang"
  },
  {
    "id": "phan-nguyen",
    "name": "Phản nguyền",
    "gems": 0,
    "effect": "Chọn 1 đồng minh đang mang trạng thái xấu, rồi chọn 1 quái đối thủ.\nChuyển trạng thái xấu đó sang quái đối thủ. Thời gian đếm lại từ đầu nếu biết mốc ban đầu.",
    "picture": "spell:hap-thu-ma-phap"
  },
  {
    "id": "phuc-kich",
    "name": "Phục kích",
    "gems": 0,
    "effect": "Khi bị tấn công, chặn đòn trước.\nChọn 1 quái thú bất kỳ. Quái đó tăng 2 công trong đòn này và gây sát thương giáp lá cà lên quái đang tấn công, mà không bị phản đòn.",
    "picture": "spell:vong-xoay-bao-ho"
  },
  {
    "id": "mua-ma-thuat",
    "name": "Mưa ma thuật",
    "gems": 0,
    "effect": "Hồi phục 2 máu cho tất cả đồng minh. Giải trừ tất cả trạng thái bất lợi."
  },
  {
    "id": "hoan-doi",
    "name": "Hoán đổi",
    "gems": 0,
    "effect": "Khi bị tấn công hoặc nhắm đến. Quái đang bị nhắm đã khoá. Chọn 1 quái khác rồi bấm OK. (Quái dự bị phải đủ điều kiện triệu hồi.) Hoán đổi vị trí của nó với quái thú đó.",
    "picture": "spell:phuc-kich"
  },
  {
    "id": "vong-xoay-bao-ho",
    "name": "Vòng xoáy bảo hộ",
    "gems": 0,
    "effect": "Ngăn chặn đòn tấn công, và buộc đối thủ kết thúc ngay lượt.",
    "picture": "spell:hoan-doi"
  },
  {
    "id": "ngan-chan-phong-ngu",
    "name": "Ngăn chặn phòng ngự",
    "gems": 0,
    "effect": "Chỉ định 1 đối thú không thể tham gia phòng ngự trong lượt này (có thể dùng lúc tấn công)"
  },
  {
    "id": "thanh-guom-anh-sang",
    "name": "Thanh gươm ánh sáng",
    "gems": 1,
    "effect": "Ngăn tất cả quái thú đối phương tấn công trong 5 lượt. Làm hiện hình tất cả quái thú đang ẩn mình đúng số lượt trên ô đếm. Hết thì ẩn lại.",
    "picture": "spell:phan-nguyen"
  },
  {
    "id": "thu-hoi-quai-thu",
    "name": "Thu hồi quái thú",
    "gems": 0,
    "effect": "Thu quái trên sân và quái dự bị về bộ quái. (Không tính token và bản sao).\nPhép đang cầm về bộ phép.\n\nRút phép đúng số lá vừa thu. Rút quái dự bị đúng tổng số quái vừa thu.\n\nChọn quái ra sân đúng số quái đã thu trên sân. Mỗi con không vượt sao của một quái đã thu.\n(Quái 4 sao tốn thêm 1 mana)."
  },
  {
    "id": "bien-sau",
    "name": "Biển sâu",
    "gems": 0,
    "effect": "Lá môi trường. Tự nằm trên sân khi vào game, mỗi bộ một lá. Quái biển của bạn ẩn chỉ số với đối thủ. Bạn vẫn thấy. Khi bạn triệu hồi và khi bắt đầu lượt của bạn, các quái đang ẩn bị xáo ô.",
    "env": true
  },
  {
    "id": "thao-nguyen",
    "name": "Thảo nguyên",
    "gems": 0,
    "effect": "Nếu một chiến binh đồng minh tham gia giao tranh, hồi cho hắn 1 máu vào cuối lượt đó.",
    "env": true,
    "since": "2026-10-16"
  },
  {
    "id": "dat-da",
    "name": "Đất đá",
    "gems": 0,
    "effect": "Nếu 1 đồng minh hệ đất đá tham gia giao tranh tăng công bằng với 40% điểm tổng phòng ngự hiện có.",
    "env": true,
    "since": "2026-10-16"
  },
  {
    "id": "nui",
    "name": "Núi",
    "gems": 0,
    "effect": "Chim chóc và rồng tăng thêm 1 sát thương kỹ năng.",
    "env": true,
    "since": "2026-10-16"
  },
  {
    "id": "rung-ram",
    "name": "Rừng rậm",
    "gems": 0,
    "effect": "Thú rừng và côn trùng tăng 2 máu tối đa.",
    "env": true,
    "since": "2026-10-16"
  },
  {
    "id": "bong-toi",
    "name": "Bóng tối",
    "gems": 0,
    "effect": "Khi quái thú bóng tối gây sát thương lên quái thú đối phương, với mỗi quái thú chịu đòn, người chơi đối phương sẽ nhận thêm 1 sát thương. Nhân đôi với sát thương trên 5.",
    "env": true,
    "since": "2026-10-16"
  },
  {
    "id": "cu-dia-may-moc",
    "name": "Cứ địa máy móc",
    "gems": 0,
    "effect": "Trang bị cho quái thú máy móc đồng minh Áo giáp 2 Thủ trước các đòn tấn công vật lý. (Cần 2 công trở lên để đánh vỡ áo giáp)",
    "env": true,
    "since": "2026-10-18"
  },
  {
    "id": "thanh-dia-thien-su",
    "name": "Thánh địa thiên sứ",
    "gems": 0,
    "effect": "- Đối thủ không thể tấn công quái thú thiên sứ, và các thuật sư của ta, trước khi tấn công toàn bộ quái thú khác trên sân, hoặc các chiến binh thiên sứ khác.\n- Khi quái thú chiến binh thiên sứ của ta tấn công vào người chơi và quái thú đối phương, hồi 1 máu cho người chơi.",
    "env": true,
    "since": "2026-10-18"
  },  {
    "id": "nui-dung-nham",
    "name": "Núi dung nham",
    "gems": 0,
    "effect": "Bắt đầu từ lượt thứ 2, mỗi khi bắt đầu lượt đấu, dựa sao số sao của ngươi. gây ngẫu nhiên bấy nhiêu sát thương phép lên các mục tiêu ngẫu nhiẻn (kể cả người chơi) trên sân đấu (có thể trùng)\n- quái thú hệ lửa nhận sát thương sẽ nhận được 1 cộng dồn: +1 công và +1 sát thương phép cho đòn tấn công kế tiếp (có thể để qua nhiều lượt) \nNếu trúng vào ngươi, thì tất cả quái lửa trên sân đều nhận được 1 cộng dồn.",
    "env": true,
    "since": "2026-10-19"
  },

  {
    "id": "virus-an-mon",
    "name": "Virus ăn mòn",
    "gems": 0,
    "effect": "Khi quái thú 1 sao đồng minh bị nhắm, kích hoạt. \nNếu quái đó bị tiêu diệt ngay sau đó, Virus ăn mòn bắt đầu.\nLập tức và mỗi đầu lượt, ăn mòn 1 quái từ 3 sao trở lên của đối thủ, ngẫu nhiên trong bộ bài, dự bị hoặc trên sân.\nGây 1 sát thương chuẩn, gấp đôi nếu từ 4 sao. Hết máu thì bị loại."
  },
  {
    "id": "ke-dao-mo",
    "name": "Kẻ đào mộ",
    "gems": 0,
    "effect": "Đào lại một quái thú hoặc phép đối phương đã rời sân.\nBấm Use, chọn trong bảng quái hoặc phép, rồi bấm OK.\nLá này biến mất. Quái vào dự bị, phép lên tay.\nĐối thủ không thấy mình vừa làm gì.\nBản sao lúc dùng tốn thêm 1 ngọc trên quả cầu.\nLá 3 ngọc thì quả cầu trả 3 và bình trả thêm 1.",
    "picture": "spell:ke-dao-mo"
  },
  {
    "id": "co-may-thoi-gian",
    "name": "Cỗ máy thời gian",
    "gems": 0,
    "effect": "Khi một quái đồng minh bị chọn làm mục tiêu của phép, kỹ năng hoặc đòn đánh thường.\nThanh phản ứng hiện ra thì bấm Use.\nĐưa quái đó về trạng thái ở đầu 3 lượt chung trước.\nNếu nó được triệu hồi sau mốc đó thì về đúng trạng thái lúc vừa triệu hồi.",
    "picture": "spell:co-may-thoi-gian"
  },
  {
    "id": "giap-co-khi",
    "name": "Giáp cơ khí",
    "gems": 0,
    "effect": "Khi một quái đồng minh bị một kỹ năng của quái đối phương nhắm đến.\nThanh phản ứng hiện ra thì bấm Use.\nTăng 2 công và 2 thủ phép vĩnh viễn, trước khi đòn rơi.\nNếu công sau khi tăng cao hơn sát thương của đòn, phản nguyên đòn về quái ra đòn.\nNhiều phát cùng loại thì cộng. Đòn hỗn hợp thì lấy loại cao nhất.",
    "picture": "spell:giap-co-khi"
  },
  {
    "id": "mu-ma-phap",
    "name": "Mũ ma pháp",
    "gems": 0,
    "effect": "Cần có quái trên sân.\nTạo mũ che sân của bạn. Đối phương chỉ thấy mũ. Bạn vẫn thấy quái thật.\nMũ: 0 công, 0 thủ, 0 thủ phép, 1 máu. Không điều khiển. Không buff.\nMũ và quái đổi chỗ khi bạn triệu hồi, và khi bắt đầu lượt chung.\nĐòn, kỹ năng, phép trúng đúng ô quái thì vào quái. Trúng ô mũ thì mũ chịu.\nHết khi còn đúng 1 mũ che đúng 1 quái thật.",
    "picture": "spell:mu-ma-phap"
  }
];

const monsterById = new Map([...MONSTERS, ...FORMS].map((card) => [card.id, card]));
const spellById = new Map(SPELLS.map((card) => [card.id, card]));

export function monsterCard(id: string): MonsterCard | undefined {
  const card = monsterById.get(id);
  return card ? applyMonster(card) : undefined;
}

export function isStill(id: string): boolean {
  return Boolean(monsterCard(id)?.still);
}

export function spellCard(id: string): SpellCard | undefined {
  const card = spellById.get(id);
  return card ? applySpell(card) : undefined;
}

export function isWarrior(name: string): boolean {
  return /kiếm sĩ|chiến binh|chiến sĩ/i.test(name);
}

const ART_REV = "48";

export function librarySrc(picture: string): string {
  if (picture.startsWith("spell:")) return `/art/spells/${picture.slice(6)}.jpg?v=${ART_REV}`;
  if (picture.startsWith("monster:")) return `/art/${picture.slice(8)}.jpg?v=${ART_REV}`;
  return "";
}

export function spellSrc(id: string): string {
  const picture = spellCard(id)?.picture;
  if (picture) {
    const src = librarySrc(picture);
    if (src) return src;
  }
  return `/art/spells/${id}.jpg?v=${ART_REV}`;
}

export function artSrc(id: string, level = 1): string {
  const card = monsterCard(id);
  if (card?.picture) {
    const src = librarySrc(card.picture);
    if (src) return src;
  }
  if (id === "mu") return `/art/mu.jpg?v=${ART_REV}`;
  if (id === "te-giac-be-con" && level >= 3) return `/art/te-giac-3.jpg?v=${ART_REV}`;
  if (id === "te-giac-be-con" && level === 2) return `/art/te-giac-2.jpg?v=${ART_REV}`;
  if (!card?.art) return card ? "" : `/art/tho-den.jpg?v=${ART_REV}`;
  return `/art/${card.art}.jpg?v=${ART_REV}`;
}

export const DECK_SIZE = 24;
/** Luật bộ bài (chủ game 28/10): 16 đến 24 lá, ít nhất 13 quái, phép không bắt buộc. */
export const DECK_MIN = 16;
export const MIN_MONSTERS = 13;
export const MIN_SPELLS = 0;

export function deckLegal(monsterCount: number, spellCount: number): boolean {
  const total = monsterCount + spellCount;
  return monsterCount >= MIN_MONSTERS && spellCount >= MIN_SPELLS && total >= DECK_MIN && total <= DECK_SIZE;
}

/** Bộ bài Khởi đầu (chủ game 22/10): the only deck a new player has, made of FAKE cards (see FAKE_MONSTERS). */
export const DEFAULT_DECK = {
  monsters: [
    "chien-binh-rong",
    "hiep-si-cua-vua",
    "kazura",
    "kizuran",
    "rong-phun-hoa-cau",
    "khung-long-vay-kiem",
    "khong-lo-mot-mat",
    "phu-thuy-ti-hon",
    "rong-con",
    "quai-thu-thien-su",
    "tho-den-tinh-nghich",
    "hoa-an-thit-nguoi",
    "may-chem",
  ],
  spells: [
    "vong-xoay-bao-ho",
    "soi-xich-dia-nguc",
    "hoan-doi",
    "phuc-kich",
    "thu-hoi-quai-thu",
    "thanh-guom-anh-sang",
    "hap-thu-ma-phap",
  ],
};
export const STARTER_NAME = "Bộ bài Khởi đầu";

/**
 * Lá fake (chủ game 22/10): the starter deck's cards are weaker copies until the real card is owned (from a pack, a
 * gift or bought with stars). What each loses: attack, defence (thủ), magic defence (kháng phép), health, and for
 * Phù thuỷ tí hơn the damage of its one skill. Every fake spell costs 1 mana more.
 */
export type FakeCut = { atk?: number; def?: number; mdef?: number; hp?: number; skill?: number };
export const FAKE_MONSTERS: Record<string, FakeCut> = {
  "chien-binh-rong": { atk: 1, def: 1, mdef: 1 },
  "hiep-si-cua-vua": { atk: 1, def: 1, hp: 2 },
  kazura: { atk: 2, hp: 1 },
  kizuran: { hp: 3 },
  "rong-phun-hoa-cau": { atk: 2, def: 1, hp: 2 },
  "khung-long-vay-kiem": { def: 1, hp: 2 },
  "khong-lo-mot-mat": { atk: 1, def: 1 },
  "phu-thuy-ti-hon": { hp: 1, skill: 1 },
  "rong-con": { hp: 1, mdef: 1 },
  "quai-thu-thien-su": { hp: 2 },
  "tho-den-tinh-nghich": { atk: 1, hp: 1 },
  "hoa-an-thit-nguoi": { def: 1, hp: 1 },
  "may-chem": { atk: 1, mdef: 1, hp: 2 },
};
export const FAKE_SPELLS = new Set(DEFAULT_DECK.spells);

/** The same monster as its fake: lower stats, never below 0 (health never below 1). */
export function fakeMonsterCard(card: MonsterCard): MonsterCard {
  const cut = FAKE_MONSTERS[card.id];
  if (!cut) return card;
  return {
    ...card,
    atk: Math.max(0, card.atk - (cut.atk ?? 0)),
    def: Math.max(0, card.def - (cut.def ?? 0)),
    mdef: Math.max(0, card.mdef - (cut.mdef ?? 0)),
    hp: Math.max(1, card.hp - (cut.hp ?? 0)),
  };
}

