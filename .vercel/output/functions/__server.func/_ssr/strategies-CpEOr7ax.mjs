import { C as spellCard, _ as monsterCard } from "./catalog-DOYBjZ9O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/strategies-CpEOr7ax.js
var KEY = "clash-strategies";
var BUILTIN_STRATEGIES = [
	{
		id: "tinh-huong",
		name: "Quái thú tình huống",
		cards: [
			"cuc-bong-ma-quai",
			"ke-san-moi-tu-than",
			"thien-than-be-nho",
			"phu-thuy-rung-den",
			"phu-thuy-thoi-gian",
			"rong-con",
			"sat-nhan-bat-giu",
			"the-than-cua-shien",
			"yeu-tinh-chuc-phuc"
		],
		text: "Những quái thú rất yếu khi tình huống không phù hợp.\n\nVà rất mạnh nếu dùng đúng lúc.",
		source: ""
	},
	{
		id: "cap-thap",
		name: "Cấp thấp, chiến đấu ngay",
		cards: [
			"con-thinh-no-cua-hai-vuong",
			"hoa-an-thit-nguoi",
			"khong-lo-mot-mat",
			"may-chem",
			"phu-thuy-ti-hon",
			"tho-den-tinh-nghich"
		],
		text: "Các quái thú có thể chiến đấu sớm, hữu dụng ngay.\nTiêu mana sớm, và chiếm lợi thế hiệu quả.",
		source: ""
	},
	{
		id: "tich-luy",
		name: "Tích luỹ và nhận",
		cards: [
			"chien-binh-lan-khuat",
			"ga-he-dang-so",
			"quai-thu-thien-su",
			"sau-non",
			"te-giac-be-con"
		],
		text: "Những quái thú chưa có tác dụng ngay khi ra sân, thường là phải ở lượt sau đó",
		source: ""
	},
	{
		id: "chien-dau",
		name: "Các quái thú chiến đấu",
		cards: [
			"chien-si-gam-nham",
			"ke-giam-ho-linh-hon",
			"ong-khong-lo",
			"rong-phun-hoa-cau"
		],
		text: "Những quái thú có thể chiến đấu ngay.\n\nBộ skill của chúng vẫn có tác dụng trong 1 số tình huống.",
		source: ""
	},
	{
		id: "phong-da-dung",
		name: "Phòng ngự đa dụng",
		cards: [
			"khung-long-vay-kiem",
			"linh-chien-da-khong-lo",
			"mo-voi-ma-mut"
		],
		text: "Lợi dụng sức phòng ngự cao để:\nChe chắn, phá giáp, huỷ diệt 1 quái thú,...",
		source: ""
	},
	{
		id: "khien-hiep-si",
		name: "Khiên của các Hiệp sĩ",
		cards: [
			"hiep-si-cua-hau",
			"hiep-si-cua-vua",
			"hiep-si-ho-ve"
		],
		text: "Các hiệp sĩ sẽ lợi dụng cơ chế khiên để phòng ngự.\n\nDùng khiên để tấn công với tốc độ chậm.",
		source: ""
	},
	{
		id: "guom-khien",
		name: "Thanh gươm và cái khiên",
		cards: ["kazura", "kizuran"],
		text: "Kazura là thanh gươm\nKizuran là cái khiên\nCùng trên sân thì chúng tuy 2 mà như 1 vậy.",
		source: "Joey vs Rex rapter (Anime tập 13)"
	},
	{
		id: "don-chien",
		name: "Đơn chiến và tiến hoá",
		cards: [
			"my-dieu-nhan",
			"nu-chua-dieu-nhan",
			"nu-chua-dieu-nhan-hoan-my"
		],
		text: "Harpie có thể đơn chiến hiệu quả 1 mình trên sân đấu, cô đa năng và có khả năng tự bảo vệ cao.",
		source: ""
	},
	{
		id: "sat-lon",
		name: "Gây sát thương lớn",
		cards: [
			"kiem-si-lua-thieng",
			"loi-nguyen-cua-rong",
			"ma-dao-si",
			"may-nem-bom-hinh-nhen",
			"trieu-hoi-ac-ma"
		],
		text: "Có thể là sát thương lan, ngẫu nhiên, hoặc dồn 1 mục tiêu.\n\nNhưng điểm chung là dame đều rất lớn.",
		source: ""
	},
	{
		id: "chien-binh",
		name: "Chiến binh",
		cards: [
			"chien-binh-rong",
			"te-giac-chien-binh",
			"dau-si-bo-tot"
		],
		text: "Những quái thú chỉ số cao, và bộ skill phù hợp với cận chiến.",
		source: ""
	},
	{
		id: "chi-so-tot",
		name: "Chỉ số tốt, sát thương cao",
		cards: ["mat-xanh-huy-diet"],
		text: "",
		source: ""
	},
	{
		id: "may-rui",
		name: "May rủi. Chỉ số, hồi phục và sát thương",
		cards: ["may-quay-thuong"],
		text: "Chỉ số tốt nếu quay trúng\nSống sót, hồi máu tốt nếu quay trúng\nSát thương cao nếu quay trúng",
		source: ""
	},
	{
		id: "sat-da-nang",
		name: "Sát thương đa năng",
		cards: ["mat-do-tan-pha", "rong-ac-ma"],
		text: "Sát thương đơn mục tiêu khổng lồ.\nNếu dùng thông minh thì biến thành lượng sát thương lan lớn.\n\nDung hợp tạo ra rồng ác ma.",
		source: ""
	},
	{
		id: "sat-on",
		name: "Sát thương ổn định",
		cards: ["thuong-quan-long"],
		text: "Tuỳ vào may rủi, nhưng lượng sát thương toả ra ổn.\nVấn đề là chỉ số thủ và máu không cao.",
		source: ""
	},
	{
		id: "ben-bi",
		name: "Chiến binh bền bỉ",
		cards: [
			"ky-si-bong-toi",
			"chien-binh-huyen-thoai",
			"ky-si-cuoi-rong"
		],
		text: "Chuyên giáp lá cà. Bền bỉ trong giao tranh.\n\nNghi thức hiến tế triệu hồi Kiếm sĩ huyền thoại.\n\nDung hợp với rồng nguyền rủa, tạo thành Kỵ sĩ rồng.",
		source: "Yugi, vs Gã hề (Kaiba tháp game), vs kén ngài (Haga đảo đấu bài)"
	}
];
var EVOLUTIONS = [
	{
		result: "te-giac-hieu-thang",
		needs: ["te-giac-be-con"]
	},
	{
		result: "te-giac-chien-binh",
		needs: ["te-giac-be-con"]
	},
	{
		result: "rong-ngan-tuoi",
		needs: ["rong-con", "phu-thuy-thoi-gian"]
	},
	{
		result: "ken-ngai",
		needs: ["sau-non"]
	},
	{
		result: "ngai-khong-lo",
		needs: ["sau-non"]
	},
	{
		result: "ngai-nu-hoang",
		needs: ["sau-non"]
	},
	{
		result: "ngai-hoan-my",
		needs: ["sau-non"]
	},
	{
		result: "nu-chua-dieu-nhan",
		needs: ["my-dieu-nhan"]
	},
	{
		result: "nu-chua-dieu-nhan-hoan-my",
		needs: ["my-dieu-nhan"]
	},
	{
		result: "chien-binh-huyen-thoai",
		needs: ["ky-si-bong-toi"]
	},
	{
		result: "ky-si-cuoi-rong",
		needs: ["ky-si-bong-toi", "loi-nguyen-cua-rong"]
	},
	{
		result: "rong-ac-ma",
		needs: ["mat-do-tan-pha", "trieu-hoi-ac-ma"]
	},
	{
		result: "hiep-si-huyen-bi",
		needs: [
			"hiep-si-cua-vua",
			"hiep-si-ho-ve",
			"hiep-si-cua-hau"
		]
	}
];
function sortCards(ids) {
	return [...ids].sort((a, b) => {
		const left = monsterCard(a);
		const right = monsterCard(b);
		if (left && right) return left.stars - right.stars || left.name.localeCompare(right.name, "vi");
		if (left) return -1;
		if (right) return 1;
		const spellA = spellCard(a);
		const spellB = spellCard(b);
		return (spellA?.gems ?? 0) - (spellB?.gems ?? 0) || (spellA?.name ?? a).localeCompare(spellB?.name ?? b, "vi");
	});
}
function mainStars(ids) {
	const tally = /* @__PURE__ */ new Map();
	for (const id of ids) {
		const stars = monsterCard(id)?.stars;
		if (stars === void 0) continue;
		tally.set(stars, (tally.get(stars) ?? 0) + 1);
	}
	let stars = 0;
	let count = 0;
	for (const [star, n] of tally) if (n > count || n === count && star < stars) {
		stars = star;
		count = n;
	}
	return {
		stars,
		count
	};
}
function sortStrategies(list) {
	return [...list].sort((a, b) => {
		const left = mainStars(a.cards);
		const right = mainStars(b.cards);
		if (left.stars !== right.stars) return left.stars - right.stars;
		if (left.count !== right.count) return right.count - left.count;
		return a.name.localeCompare(b.name, "vi");
	});
}
var GROUP_TITLES = [
	"",
	"Quái thú 1 sao",
	"Quái thú 2 sao",
	"Quái thú 3 sao",
	"Quái thú chủ lực"
];
function deckTactics(deckIds, list) {
	const owned = new Set(deckIds);
	const unlocked = new Set(EVOLUTIONS.filter((row) => row.needs.every((id) => owned.has(id))).map((row) => row.result));
	const groups = /* @__PURE__ */ new Map();
	for (const plan of sortStrategies(list)) {
		const stars = mainStars(plan.cards).stars;
		const band = stars >= 4 ? 4 : stars;
		if (band < 1 || band > 4) continue;
		const shown = /* @__PURE__ */ new Set();
		for (const id of plan.cards) if (owned.has(id) || unlocked.has(id)) shown.add(id);
		for (const row of EVOLUTIONS) {
			if (!unlocked.has(row.result)) continue;
			if (row.needs.every((id) => plan.cards.includes(id))) shown.add(row.result);
		}
		if (!shown.size) continue;
		const group = groups.get(band) ?? {
			title: GROUP_TITLES[band],
			plans: []
		};
		group.plans.push({
			id: plan.id,
			name: plan.name,
			cards: sortCards([...shown])
		});
		groups.set(band, group);
	}
	return [
		1,
		2,
		3,
		4
	].flatMap((band) => {
		const group = groups.get(band);
		return group ? [group] : [];
	});
}
function clean(raw) {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const row = item;
		if (typeof row.id !== "string" || typeof row.name !== "string") return [];
		const cards = Array.isArray(row.cards) ? row.cards.filter((id) => typeof id === "string" && (monsterCard(id) || spellCard(id))) : [];
		return [{
			id: row.id,
			name: row.name,
			cards,
			text: typeof row.text === "string" ? row.text : "",
			source: typeof row.source === "string" ? row.source : ""
		}];
	});
}
function loadStrategies() {
	if (typeof localStorage === "undefined") return BUILTIN_STRATEGIES;
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return BUILTIN_STRATEGIES;
		const saved = clean(JSON.parse(raw));
		return saved.length ? saved : BUILTIN_STRATEGIES;
	} catch {
		return BUILTIN_STRATEGIES;
	}
}
function saveStrategies(list) {
	localStorage.setItem(KEY, JSON.stringify(list));
}
//#endregion
export { sortStrategies as a, sortCards as i, loadStrategies as n, saveStrategies as r, deckTactics as t };
