import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as setFxVolume, C as tr, D as fxVolume, M as setTapVolume, N as soundOn, O as playCue, P as tapVolume, S as setLang, _ as saveCard, a as DEFAULT_FIELD, b as CopyEdit, c as HUD_MARKS, d as loadBoard, f as loadCard, g as saveBoard, h as saveAlert, i as DEFAULT_CARD, j as setSound, k as playTap, l as SPELL_MARKS, m as loadSpell, n as CARD_MARKS, o as DEFAULT_SPELL, p as loadField, r as DEFAULT_BOARD_LAYOUT, s as FIELD_MARKS, u as loadAlertLook, v as saveField, w as useLang, y as saveSpell } from "./router-D9l-mBhf.mjs";
import { C as spellCard, S as saveSpell$1, _ as monsterCard, a as MONSTER_ASKS, b as saveAttack, c as artSrc, d as attackLabel, f as chipDraft, g as librarySrc, i as MONSTERS, l as askDraft, o as MONSTER_CHIPS, r as FORMS, s as SPELLS, v as resetMonster, x as saveMonster, y as resetSpell } from "./catalog-DOYBjZ9O.mjs";
import { t as CardFace } from "./card-face-C68Pz_14.mjs";
import { A as saveFireBlast, C as fireBlastOn, D as loadLooks, E as loadFxPrefs, F as setSpellFx, H as tideOn, I as shownChoice, M as saveLooks, N as saveTide, O as previewOf, P as setMonsterFx, R as skillsOf, S as exportFxText, T as loadCardFx, V as tideNote, _ as cardFxSpells, a as FX_SPOT_LABEL, b as emitFx, d as ShieldBurst, f as Spectacle, g as cardFxMonsters, h as ailmentHolds, i as FX_PART_LABEL, j as saveFxPrefs, k as saveAilmentHold, l as PACK_PARTS, m as actPack, n as CARD_FX_CHOICES, o as FireBurst, p as WaterBurst, r as FX_ACTIONS, t as BoltBurst, u as SPELL_FX_CHOICES, v as defaultFxPrefs, w as loadActivePack, x as exportCardFx, y as defaultLooks, z as spellChoice } from "./card-fx-DwrPXICI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tune-BPZzlCn2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CardFxPage({ onBack }) {
	const [tab, setTab] = (0, import_react.useState)("monster");
	const [open, setOpen] = (0, import_react.useState)(null);
	const [skill, setSkill] = (0, import_react.useState)(null);
	const [store, setStore] = (0, import_react.useState)(loadCardFx);
	const [note, setNote] = (0, import_react.useState)("");
	const [dump, setDump] = (0, import_react.useState)("");
	const monsters = cardFxMonsters();
	const spells = cardFxSpells();
	function refresh() {
		setStore(loadCardFx());
	}
	function pickMonster(cardId, skillKey, fx) {
		setMonsterFx(cardId, skillKey, fx);
		refresh();
	}
	function pickSpell(cardId, fx) {
		setSpellFx(cardId, fx);
		refresh();
	}
	async function copyOut() {
		const text = exportCardFx();
		if (!text) {
			setDump("");
			setNote("Không có thay đổi để xuất.");
			return;
		}
		setDump(text);
		try {
			await navigator.clipboard.writeText(text);
			setNote("Đã xuất và chép các thay đổi.");
		} catch {
			setNote("Đã xuất. Giữ phần chữ bên dưới rồi sao chép.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "builder card-fx",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "deck-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "chip",
					onClick: onBack,
					children: "Quay lại"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: tr("Hiệu ứng lá bài") })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note card-fx-lead",
				children: "Có hiệu lực khi vào lại trận."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-tabs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `chip${tab === "monster" ? " on" : ""}`,
					onClick: () => {
						setTab("monster");
						setOpen(null);
						setSkill(null);
					},
					children: tr("Quái")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `chip${tab === "spell" ? " on" : ""}`,
					onClick: () => {
						setTab("spell");
						setOpen(null);
						setSkill(null);
					},
					children: tr("Phép")
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "deck-grid",
				children: tab === "monster" ? monsters.map((card) => {
					const skills = skillsOf(card.id);
					const opened = open === card.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pick press",
						onClick: () => {
							setOpen(opened ? null : card.id);
							setSkill(null);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							monster: card,
							selected: opened
						})
					}), opened ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-fx-panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "card-fx-skills",
							children: skills.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `chip${skill === item.key ? " on" : ""}`,
								onClick: () => setSkill(skill === item.key ? null : item.key),
								children: item.name
							}, item.key))
						}), skill ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FxPicks, {
							current: shownChoice(card.id, skills.find((item) => item.key === skill) ?? skills[0], store),
							note: tideNote(card.id, skills.find((item) => item.key === skill) ?? skills[0], store),
							onPick: (fx) => pickMonster(card.id, skill, fx)
						}) : null]
					}) : null] }, card.id);
				}) : spells.map((card) => {
					const opened = open === card.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pick press",
						onClick: () => {
							setOpen(opened ? null : card.id);
							setSkill(null);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
							spellId: card.id,
							selected: opened
						})
					}), opened ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "card-fx-panel",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FxPicks, {
							choices: SPELL_FX_CHOICES,
							current: spellChoice(card.id, store),
							onPick: (fx) => pickSpell(card.id, fx)
						})
					}) : null] }, card.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-fx-foot",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "tuner-save is-red",
						onClick: () => void copyOut(),
						children: "Xuất thay đổi"
					}),
					note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "tuner-note",
						children: note
					}) : null,
					dump ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "tune-input is-area",
						readOnly: true,
						value: dump,
						onFocus: (event) => event.currentTarget.select()
					}) : null
				]
			})
		]
	});
}
function FxPicks({ choices, current, note, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-fx-picks",
		children: [note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "tuner-note",
			children: note
		}) : null, (choices ?? CARD_FX_CHOICES).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: `chip${current === item.id ? " on" : ""}`,
			onClick: () => onPick(item.id),
			children: item.label
		}, item.id))]
	});
}
function undoKey(pack) {
	return pack === "m1" ? "clash-fx-undo-m1" : "clash-fx-undo";
}
function readUndo(pack) {
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem(undoKey(pack));
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : null;
	} catch {
		return null;
	}
}
function FxLab({ onBack }) {
	const [looks, setLooks] = (0, import_react.useState)(() => loadLooks());
	const [act, setAct] = (0, import_react.useState)("summon");
	const [pack, setPack] = (0, import_react.useState)(() => actPack("summon"));
	const [prefs, setPrefs] = (0, import_react.useState)(() => loadFxPrefs(actPack("summon")));
	const [open, setOpen] = (0, import_react.useState)(null);
	const [hold, setHold] = (0, import_react.useState)(() => ailmentHolds());
	const [fire, setFire] = (0, import_react.useState)(() => fireBlastOn());
	const [gun, setGun] = (0, import_react.useState)(false);
	const [bolt, setBolt] = (0, import_react.useState)(false);
	const [boltBig, setBoltBig] = (0, import_react.useState)(false);
	const [tide, setTide] = (0, import_react.useState)(() => ({
		small: tideOn("small"),
		mid: tideOn("mid"),
		big: tideOn("big")
	}));
	const [shield, setShield] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("");
	const [undoPacks, setUndoPacks] = (0, import_react.useState)(() => ["now", "m1"].filter((item) => readUndo(item)));
	const [alertSize, setAlertSize] = (0, import_react.useState)(() => loadAlertLook().glow);
	const [alertBorder, setAlertBorder] = (0, import_react.useState)(() => loadAlertLook().border);
	const look = looks[act];
	function play(next, row = looks[next]) {
		const shown = ["now", "m1"].filter((id) => !row.hide[id]);
		window.setTimeout(() => {
			for (const id of shown) for (const event of previewOf(next)) emitFx({
				...event,
				pack: id
			});
		}, 30);
	}
	function writeLook(nextAct, row) {
		const next = {
			...looks,
			[nextAct]: row
		};
		setLooks(next);
		saveLooks(next);
		return next;
	}
	function pick(next) {
		const row = looks[next];
		setAct(next);
		setPack(row.edit);
		setPrefs(loadFxPrefs(row.edit));
		if (open === next) setOpen(null);
		else {
			setOpen(next);
			play(next, row);
		}
	}
	function choose(next) {
		const row = {
			...look,
			edit: next
		};
		writeLook(act, row);
		setPack(next);
		setPrefs(loadFxPrefs(next));
		play(act, row);
	}
	function flipHide(which) {
		const row = {
			...look,
			hide: {
				...look.hide,
				[which]: !look.hide[which]
			}
		};
		writeLook(act, row);
		play(act, row);
	}
	function toggle(spot, part) {
		const list = prefs[act][spot] ?? [];
		const next = {
			...prefs,
			[act]: {
				...prefs[act],
				[spot]: list.includes(part) ? list.filter((item) => item !== part) : [...list, part]
			}
		};
		setPrefs(next);
		saveFxPrefs(next, pack);
		play(act);
	}
	function reset() {
		if (undoPacks.includes(pack)) {
			const back = readUndo(pack);
			if (back) {
				setPrefs(back);
				saveFxPrefs(back, pack);
				localStorage.removeItem(undoKey(pack));
				setUndoPacks((list) => list.filter((item) => item !== pack));
				setNote("Đã trả lại bộ trước khi bật lại.");
				if (open) play(act);
				return;
			}
		}
		localStorage.setItem(undoKey(pack), JSON.stringify(prefs));
		setUndoPacks((list) => list.includes(pack) ? list : [...list, pack]);
		const next = defaultFxPrefs(pack);
		setPrefs(next);
		saveFxPrefs(next, pack);
		setNote("Đã bật lại đủ hiệu ứng của bộ đang chỉnh. Bấm Trả lại nếu bấm nhầm.");
		if (open) play(act);
	}
	function keep() {
		localStorage.setItem(pack === "m1" ? "clash-fx-keep-m1" : "clash-fx-keep", JSON.stringify(prefs));
		setNote("Đã lưu bộ đang chỉnh.");
	}
	async function copyOut() {
		const text = exportFxText(pack);
		try {
			await navigator.clipboard.writeText(text);
			setNote("Đã chép bộ đang chỉnh. Dán vào cuộc trò chuyện.");
		} catch {
			setNote(text);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner fx-lab",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Về tuỳ chỉnh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Hiệu ứng" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "fx-alert",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Chớp cam" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "tuner-note",
						children: "Chỉnh riêng quầng sáng và độ dày viền."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "alert-preview",
						style: {
							"--alert-size": `${alertSize}px`,
							"--alert-border": `${alertBorder}px`
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "is-alert" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "tuner-note",
						children: ["Quầng ", alertSize]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pad2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "pad-btn",
							onClick: () => setAlertSize((current) => Math.min(96, current + 4)),
							children: "Quầng to hơn"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "pad-btn",
							onClick: () => setAlertSize((current) => Math.max(4, current - 4)),
							children: "Quầng nhỏ hơn"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "tuner-note",
						children: ["Viền ", alertBorder]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pad2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "pad-btn",
							onClick: () => setAlertBorder((current) => Math.min(20, current + 1)),
							children: "Viền dày hơn"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "pad-btn",
							onClick: () => setAlertBorder((current) => Math.max(1, current - 1)),
							children: "Viền mỏng hơn"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "tuner-save",
						onClick: () => {
							saveAlert(alertSize, alertBorder);
							setNote("Đã lưu quầng và viền chớp cam.");
						},
						children: "Lưu chớp cam"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fx-dock",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "fx-side",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `fx-pack${pack === "now" ? " on" : ""}`,
								"aria-label": "Chỉnh hiệu ứng hiện tại",
								onClick: () => choose("now"),
								children: "1"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `fx-pack is-hide${look.hide.now ? " off" : ""}`,
								"aria-label": look.hide.now ? "Hiện hiệu ứng hiện tại trên bàn xem" : "Ẩn hiệu ứng hiện tại trên bàn xem",
								onClick: () => flipHide("now"),
								children: "1"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `fx-pack${pack === "m1" ? " on" : ""}`,
								"aria-label": "Chỉnh hiệu ứng mốc 1",
								onClick: () => choose("m1"),
								children: "2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `fx-pack is-hide${look.hide.m1 ? " off" : ""}`,
								"aria-label": look.hide.m1 ? "Hiện mốc 1 trên bàn xem" : "Ẩn mốc 1 trên bàn xem",
								onClick: () => flipHide("m1"),
								children: "2"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "fx-stage",
						"aria-hidden": true,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: "fx-board",
								src: "/board.png",
								alt: ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: "fx-card is-you",
								src: "/art/kiem-si.jpg",
								alt: ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: "fx-card is-foe",
								src: "/art/ac-ma.jpg",
								alt: ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spectacle, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FireBurst, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoltBurst, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WaterBurst, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldBurst, {})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "fx-replay",
						"aria-label": "Xem lại",
						onClick: () => play(act),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							viewBox: "0 0 24 24",
							"aria-hidden": true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 5.5v13l11-6.5-11-6.5z" })
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Bốn icon là của hành động đang chọn. Số 1 và số 2 nhớ riêng từng hành động. Gạch chéo chỉ ẩn trên bàn xem. Trong trận, hành động đó dùng đúng số đang bật."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fx-actions",
				children: [FX_ACTIONS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "fx-action",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tuner-item${open === item.id ? " on" : ""}`,
						onClick: () => pick(item.id),
						children: item.title
					}), open === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "fx-parts",
						children: [item.id === "ailment" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "fx-part",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: hold,
								onChange: () => {
									const next = !hold;
									setHold(next);
									saveAilmentHold(next);
									play(item.id);
								}
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Giữ trên quái khi còn dính" })]
						}) : null, item.spots.map((spot) => {
							const parts = spot.parts.filter((part) => PACK_PARTS[pack].includes(part));
							if (parts.length === 0) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "fx-spot",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: FX_SPOT_LABEL[spot.id] }), parts.map((part) => {
									const on = (prefs[item.id][spot.id] ?? []).includes(part);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: `fx-part${on ? " on" : ""}`,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: on,
												onChange: () => toggle(spot.id, part)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: `fx-ico ${part}` }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: FX_PART_LABEL[part] })
										]
									}, part);
								})]
							}, spot.id);
						})]
					}) : null]
				}, item.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "fx-action",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tuner-item${open === "special" ? " on" : ""}`,
						onClick: () => setOpen(open === "special" ? null : "special"),
						children: "10. Skill đặc biệt"
					}), open === "special" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "fx-parts",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "fx-part",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: fire,
									onChange: () => {
										const next = !fire;
										setFire(next);
										saveFireBlast(next);
										if (next) emitFx({
											t: "fire",
											x: 53,
											y: 30
										});
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Lửa" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "fx-part",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: gun,
									onChange: () => {
										const next = !gun;
										setGun(next);
										if (!next) return;
										playCue("gunPrep");
										window.setTimeout(() => {
											playCue("gunBoom");
											emitFx({
												t: "fire",
												x: 53,
												y: 30
											});
											setGun(false);
										}, 740);
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Súng" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "fx-part",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: bolt,
									onChange: () => {
										const next = !bolt;
										setBolt(next);
										if (!next) return;
										playCue("boltPrep");
										window.setTimeout(() => {
											playCue("boltSmall");
											emitFx({
												t: "bolt",
												rank: "small",
												x: 53,
												y: 30
											});
											setBolt(false);
										}, 240);
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sét nhỏ" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "fx-part",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: boltBig,
									onChange: () => {
										const next = !boltBig;
										setBoltBig(next);
										if (!next) return;
										playCue("boltPrep");
										window.setTimeout(() => {
											playCue("boltBoom");
											emitFx({
												t: "bolt",
												rank: "big",
												x: 53,
												y: 30
											});
											setBoltBig(false);
										}, 240);
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sét" })]
							}),
							[
								["small", "Con nước nhỏ"],
								["mid", "Con nước trung bình"],
								["big", "Con nước lớn"]
							].map(([rank, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "fx-part",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: tide[rank],
									onChange: () => {
										const next = !tide[rank];
										setTide((now) => ({
											...now,
											[rank]: next
										}));
										saveTide(rank, next);
										if (next) emitFx({
											t: "tide",
											rank,
											x: 53,
											y: 30
										});
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })]
							}, rank)),
							[["phys", "Khiên vật lý"], ["spell", "Khiên phép"]].map(([kind, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "fx-part",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: shield === kind,
									onChange: () => {
										setShield(kind);
										playCue("shield");
										emitFx({
											t: "shield",
											kind,
											x: 53,
											y: 30
										});
										window.setTimeout(() => setShield((now) => now === kind ? null : now), 1200);
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })]
							}, kind))
						]
					}) : null]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: reset,
				children: undoPacks.includes(pack) ? "Trả lại bộ vừa chỉnh" : "Bật lại đủ bộ đang chỉnh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: keep,
				children: "Lưu bộ đang chỉnh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => void copyOut(),
				children: "Xuất cài đặt hiệu ứng đang chỉnh"
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: note
			}) : null
		]
	});
}
var KEPT = [
	["kho-sau-non", "Kho Sâu non"],
	["kho-ken-ngai", "Kho Kén ngài"],
	["kho-chan-ken", "Kho Chân kén"],
	["kho-ngai-khong-lo", "Kho Ngài Khổng lồ"],
	["kho-ngai-nu-hoang", "Kho Ngài Nữ hoàng"],
	["kho-ngai-toi-thuong", "Kho Ngài tối thượng"],
	["kho-kraken", "Kho Kraken"],
	["kho-sua", "Kho Sứa"],
	["kho-hai-long", "Kho Hải long"],
	["kho-phap-su-guong", "Kho Pháp sư gương"],
	["kho-chien-rong", "Kho Chiến rồng"],
	["kho-rong-xuong", "Kho Rồng xương"],
	["kho-quai-dong-ho", "Kho Quái đồng hồ"],
	["kho-tu-sat", "Kho Tủ sắt"],
	["kho-rong-thep", "Kho Rồng thép"],
	["kho-ke-dao-mo", "Kho Kẻ đào mộ"],
	["kho-nguoi-may-vang", "Kho Người máy vàng"],
	["kho-may-liem", "Kho Máy liềm"],
	["kho-rong-con", "Kho Rồng con"],
	["kho-hiep-si-gay", "Kho Hiệp sĩ gậy"],
	["kho-nhen-may", "Kho Nhện máy"],
	["kho-rong-sung", "Kho Rồng súng"],
	["kho-ham-gai", "Kho Hàm gai"],
	["kho-hoa-an-thit", "Kho Hoa ăn thịt"],
	["kho-tien-giap", "Kho Tiên giáp"],
	["kho-canh-hong", "Kho Cánh hồng"],
	["kho-rong-xich", "Kho Rồng xích"],
	["kho-canh-lam", "Kho Cánh lam"],
	["kho-canh-trang", "Kho Cánh trắng"]
];
var HIDDEN_KEY = "clash-hidden-art";
function hiddenArts() {
	try {
		const raw = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
		return new Set(Array.isArray(raw) ? raw.filter((item) => typeof item === "string") : []);
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function hideArt(key) {
	const next = hiddenArts();
	next.add(key);
	localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
}
function visible(shots) {
	const hidden = hiddenArts();
	return shots.filter((shot) => !hidden.has(shot.key));
}
function monsterArts() {
	const shots = [...MONSTERS, ...FORMS].flatMap((card) => card.art ? [{
		key: `monster:${card.art}`,
		src: librarySrc(`monster:${card.art}`),
		label: card.name
	}] : []);
	shots.push({
		key: "monster:te-giac-3",
		src: librarySrc("monster:te-giac-3"),
		label: "Tê giác cấp 3"
	});
	for (const [art, label] of KEPT) shots.push({
		key: `monster:${art}`,
		src: librarySrc(`monster:${art}`),
		label
	});
	return visible(shots);
}
function spellArts() {
	return visible(SPELLS.map((card) => ({
		key: `spell:${card.id}`,
		src: librarySrc(`spell:${card.id}`),
		label: card.name
	})));
}
function defaultMonsterPicture(art) {
	return `monster:${art}`;
}
function defaultSpellPicture(id) {
	return `spell:${id}`;
}
function clamp(value, min, max) {
	return Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
}
function TunePage() {
	const [screen, setScreen] = (0, import_react.useState)("menu");
	if (screen === "menu") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { onPick: setScreen });
	if (screen === "board") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardTune, { onBack: () => setScreen("menu") });
	if (screen === "monster") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotTune, {
		kind: "monster",
		onBack: () => setScreen("menu")
	});
	if (screen === "spell") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotTune, {
		kind: "spell",
		onBack: () => setScreen("menu")
	});
	if (screen === "text") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTextTune, { onBack: () => setScreen("menu") });
	if (screen === "sound") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SoundTune, { onBack: () => setScreen("menu") });
	if (screen === "fx") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FxLab, { onBack: () => setScreen("menu") });
	if (screen === "cardfx") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFxPage, { onBack: () => setScreen("menu") });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldTune, { onBack: () => setScreen("menu") });
}
function same(live, base) {
	return JSON.stringify(live) === JSON.stringify(base);
}
function exportChanges() {
	const out = {};
	const board = loadBoard();
	const marks = { ...DEFAULT_BOARD_LAYOUT.marks };
	for (const key of Object.keys(marks)) marks[key] = {
		...marks[key],
		hidden: false
	};
	if (!same(board, {
		...DEFAULT_BOARD_LAYOUT,
		marks
	})) out.board = board;
	if (!same(loadCard(), DEFAULT_CARD)) out.monster = loadCard();
	if (!same(loadSpell(), DEFAULT_SPELL)) out.spell = loadSpell();
	if (!same(loadField(), DEFAULT_FIELD)) out.field = loadField();
	const sound = {
		on: soundOn(),
		fx: fxVolume(),
		tap: tapVolume()
	};
	if (!same(sound, {
		on: true,
		fx: 100,
		tap: 100
	})) out.sound = sound;
	const cards = JSON.parse(exportNumbers());
	if (cards.monsters.length || cards.spells.length || cards.attack) out.cards = cards;
	if (loadActivePack() !== "now") out.fxPack = loadActivePack();
	if (!same(loadFxPrefs("now"), defaultFxPrefs("now"))) out.fxNow = loadFxPrefs("now");
	if (!same(loadFxPrefs("m1"), defaultFxPrefs("m1"))) out.fxM1 = loadFxPrefs("m1");
	if (!same(loadLooks(), defaultLooks())) out.fxLooks = loadLooks();
	if (!ailmentHolds()) out.ailmentHold = false;
	return out;
}
function setupLine() {
	return JSON.stringify({
		board: loadBoard(),
		monster: loadCard(),
		spell: loadSpell(),
		field: loadField(),
		sound: {
			on: soundOn(),
			fx: fxVolume(),
			tap: tapVolume()
		}
	});
}
function Menu({ onPick }) {
	const [line, setLine] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [dump, setDump] = (0, import_react.useState)("");
	const language = useLang();
	(0, import_react.useEffect)(() => {
		setLine(setupLine());
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "tuner-back",
				children: tr("Về menu")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tr("Tuỳ chỉnh") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: tr("Ngôn ngữ")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pad2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `tuner-item${language === "vi" ? " on" : ""}`,
					onClick: () => setLang("vi"),
					children: "Tiếng Việt"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `tuner-item${language === "en" ? " on" : ""}`,
					onClick: () => setLang("en"),
					children: "English"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => onPick("board"),
				children: tr("Điều chỉnh bàn chơi")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => onPick("monster"),
				children: tr("Điều chỉnh lá quái trên tay")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => onPick("spell"),
				children: tr("Điều chỉnh lá phép trên tay")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => onPick("field"),
				children: tr("Điều chỉnh lá trên sân")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => onPick("text"),
				children: tr("Điều chỉnh nội dung lá bài")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => onPick("sound"),
				children: tr("Âm thanh")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => onPick("fx"),
				children: tr("Hiệu ứng")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => onPick("cardfx"),
				children: tr("Hiệu ứng lá bài")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "tuner-save alt",
				href: "/clash-lite.zip",
				download: true,
				children: tr("Tải gói nhẹ")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					const text = setupLine();
					setLine(text);
					navigator.clipboard?.writeText(text).then(() => setNote("Đã chép. Dán dòng này vào cuộc trò chuyện."), () => setNote("Chưa chép được. Giữ dòng bên dưới rồi sao chép."));
				},
				children: tr("Xuất tuỳ chỉnh")
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: note
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "tune-input",
				readOnly: true,
				value: line,
				onFocus: (event) => event.currentTarget.select()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save is-red",
				onClick: () => {
					if (!window.confirm("Xuất mọi thay đổi trong tuỳ chỉnh?")) return;
					const data = exportChanges();
					if (Object.keys(data).length === 0) {
						setDump("");
						setNote("Không có thay đổi để xuất.");
						return;
					}
					const text = JSON.stringify(data, null, 2);
					setDump(text);
					navigator.clipboard?.writeText(text).then(() => setNote("Đã xuất và chép các thay đổi."), () => setNote("Đã xuất. Giữ phần chữ bên dưới rồi sao chép."));
				},
				children: "Xuất mọi thay đổi"
			}),
			dump ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: "tune-input is-area",
				readOnly: true,
				value: dump,
				onFocus: (event) => event.currentTarget.select()
			}) : null
		]
	});
}
function SoundTune({ onBack }) {
	const [on, setOn] = (0, import_react.useState)(true);
	const [fx, setFx] = (0, import_react.useState)(100);
	const [tap, setTap] = (0, import_react.useState)(100);
	(0, import_react.useEffect)(() => {
		setOn(soundOn());
		setFx(fxVolume());
		setTap(tapVolume());
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Quay lại"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Âm thanh" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Âm lượng trong game, không đổi âm lượng máy."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `tuner-save${on ? "" : " is-mute"}`,
				onClick: () => {
					const next = !on;
					setSound(next);
					setOn(next);
					if (next) playCue("draw");
				},
				children: on ? "Tắt tiếng" : "Đang tắt tiếng"
			}),
			on ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: [
					"Hiệu ứng trận · ",
					fx,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "vol-range",
						type: "range",
						min: 0,
						max: 100,
						value: fx,
						onChange: (event) => {
							const next = Number(event.target.value);
							setFx(next);
							setFxVolume(next);
							setOn(true);
						},
						onPointerUp: () => playCue("draw")
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: [
					"Nút bấm · ",
					tap,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "vol-range",
						type: "range",
						min: 0,
						max: 100,
						value: tap,
						onChange: (event) => {
							const next = Number(event.target.value);
							setTap(next);
							setTapVolume(next);
							setOn(true);
						},
						onPointerUp: () => playTap()
					})
				]
			})] }) : null
		]
	});
}
function Pad({ onNudge, onFont, onWidth, onHeight, fontStep = .4, fontUp = "Chữ to hơn", fontDown = "Chữ nhỏ hơn" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pad4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onNudge(-.4, 0),
				children: "Trái"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onNudge(.4, 0),
				children: "Phải"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onNudge(0, -.4),
				children: "Lên"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onNudge(0, .4),
				children: "Xuống"
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pad2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onFont(fontStep),
				children: fontUp
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onFont(-fontStep),
				children: fontDown
			}),
			onWidth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onWidth(2),
				children: "Rộng hơn"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onWidth(-2),
				children: "Hẹp hơn"
			})] }) : null,
			onHeight ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onHeight(1),
				children: "Cao hơn"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => onHeight(-1),
				children: "Thấp hơn"
			})] }) : null
		]
	})] });
}
function BoardTune({ onBack }) {
	const stage = (0, import_react.useRef)(null);
	const drag = (0, import_react.useRef)(null);
	const [layout, setLayout] = (0, import_react.useState)(loadBoard);
	const [picked, setPicked] = (0, import_react.useState)("notice");
	const [saved, setSaved] = (0, import_react.useState)(false);
	function at(event) {
		const node = stage.current;
		if (!node) return null;
		const rect = node.getBoundingClientRect();
		return {
			x: clamp((event.clientX - rect.left) / rect.width * 100, 0, 98),
			y: clamp((event.clientY - rect.top) / rect.height * 100, 0, 98)
		};
	}
	function place(key, x, y) {
		setSaved(false);
		setLayout((current) => {
			if (key === "notice") return {
				...current,
				notice: {
					...current.notice,
					x: clamp(x, 0, 80),
					y: clamp(y, 0, 90)
				}
			};
			if (key === "trail") return {
				...current,
				trail: {
					...current.trail,
					x: clamp(x, 0, 92),
					y: clamp(y, 0, 90)
				}
			};
			if (key === "reaction") return {
				...current,
				reaction: {
					...current.reaction,
					x: clamp(x, 0, 80),
					y: clamp(y, 0, 90)
				}
			};
			if (key === "stack" || key === "env" || key === "envFoe") {
				const spot = current[key];
				return {
					...current,
					[key]: {
						...spot,
						x: clamp(x, 2, 98),
						y: clamp(y, 2, 98)
					}
				};
			}
			const point = current.marks[key];
			return {
				...current,
				marks: {
					...current.marks,
					[key]: {
						...point,
						x: clamp(x, 2, 98),
						y: clamp(y, 2, 98)
					}
				}
			};
		});
	}
	function nudge(dx, dy) {
		if (picked === "notice") place("notice", layout.notice.x + dx, layout.notice.y + dy);
		else if (picked === "trail") place("trail", layout.trail.x + dx, layout.trail.y + dy);
		else if (picked === "reaction") place("reaction", layout.reaction.x + dx, layout.reaction.y + dy);
		else if (picked === "stack" || picked === "env" || picked === "envFoe") place(picked, layout[picked].x + dx, layout[picked].y + dy);
		else place(picked, layout.marks[picked].x + dx, layout.marks[picked].y + dy);
	}
	function font(delta) {
		setSaved(false);
		setLayout((current) => {
			if (picked === "notice") return {
				...current,
				notice: {
					...current.notice,
					font: clamp(current.notice.font + delta, 1.6, 8)
				}
			};
			if (picked === "trail") return {
				...current,
				trail: {
					...current.trail,
					dot: clamp(current.trail.dot + delta, .8, 8)
				}
			};
			if (picked === "reaction") return {
				...current,
				reaction: {
					...current.reaction,
					font: clamp(current.reaction.font + delta, 1.6, 8)
				}
			};
			if (picked === "stack" || picked === "env" || picked === "envFoe") {
				const spot = current[picked];
				return {
					...current,
					[picked]: {
						...spot,
						size: clamp(spot.size + delta, 1.6, 8)
					}
				};
			}
			const point = current.marks[picked];
			return {
				...current,
				marks: {
					...current.marks,
					[picked]: {
						...point,
						size: clamp(point.size + delta, 1.6, 12)
					}
				}
			};
		});
	}
	function width(delta) {
		setSaved(false);
		setLayout((current) => {
			if (picked === "notice") return {
				...current,
				notice: {
					...current.notice,
					w: clamp(current.notice.w + delta, 20, 90)
				}
			};
			if (picked === "trail") return {
				...current,
				trail: {
					...current.trail,
					w: clamp(current.trail.w + delta, 3, 30)
				}
			};
			if (picked === "reaction") return {
				...current,
				reaction: {
					...current.reaction,
					w: clamp(current.reaction.w + delta, 20, 90)
				}
			};
			if (picked === "stack" || picked === "env" || picked === "envFoe") {
				const spot = current[picked];
				return {
					...current,
					[picked]: {
						...spot,
						width: clamp(spot.width + delta, 6, 48)
					}
				};
			}
			return current;
		});
	}
	function height(delta) {
		setSaved(false);
		setLayout((current) => {
			if (picked === "notice") return {
				...current,
				notice: {
					...current.notice,
					h: clamp(current.notice.h + delta, 4, 24)
				}
			};
			if (picked === "trail") return {
				...current,
				trail: {
					...current.trail,
					h: clamp(current.trail.h + delta, 4, 40)
				}
			};
			if (picked === "reaction") return {
				...current,
				reaction: {
					...current.reaction,
					h: clamp(current.reaction.h + delta, 4, 24)
				}
			};
			if (picked === "stack" || picked === "env" || picked === "envFoe") {
				const spot = current[picked];
				return {
					...current,
					[picked]: {
						...spot,
						height: clamp(spot.height + delta, 4, 28)
					}
				};
			}
			return current;
		});
	}
	const label = picked === "notice" ? "Bảng thông báo" : picked === "trail" ? "Lịch sử thông báo" : picked === "reaction" ? "Thanh phản ứng" : picked === "stack" ? "Xấp bài úp" : picked === "env" ? "Môi trường mình" : picked === "envFoe" ? "Môi trường địch" : HUD_MARKS.find((mark) => mark.key === picked)?.label;
	const boxy = picked === "notice" || picked === "trail" || picked === "reaction" || picked === "stack" || picked === "env" || picked === "envFoe";
	const hidden = picked === "notice" ? layout.notice.hidden === true : picked === "trail" ? layout.trail.hidden === true : picked === "reaction" ? layout.reaction.hidden === true : picked === "stack" || picked === "env" || picked === "envFoe" ? layout[picked].hidden === true : layout.marks[picked].hidden === true;
	function toggleHidden() {
		setSaved(false);
		setLayout((current) => {
			if (picked === "notice") return {
				...current,
				notice: {
					...current.notice,
					hidden: !current.notice.hidden
				}
			};
			if (picked === "trail") return {
				...current,
				trail: {
					...current.trail,
					hidden: !current.trail.hidden
				}
			};
			if (picked === "reaction") return {
				...current,
				reaction: {
					...current.reaction,
					hidden: !current.reaction.hidden
				}
			};
			if (picked === "stack" || picked === "env" || picked === "envFoe") return {
				...current,
				[picked]: {
					...current[picked],
					hidden: !current[picked].hidden
				}
			};
			const point = current.marks[picked];
			return {
				...current,
				marks: {
					...current.marks,
					[picked]: {
						...point,
						hidden: !point.hidden
					}
				}
			};
		});
	}
	function glow(delta) {
		setSaved(false);
		setLayout((current) => ({
			...current,
			trail: {
				...current.trail,
				glow: clamp(current.trail.glow + delta, 0, 12)
			}
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Về tuỳ chỉnh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Chỉnh bàn đấu" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Chọn một số, rồi bấm mũi tên. Kéo cũng được. Lưu xong vào trận để xem."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: stage,
				className: "tune-stage tune-board",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/board.png",
						alt: ""
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-notice${picked === "notice" ? " on" : ""}${layout.notice.hidden ? " is-hidden" : ""}`,
						style: {
							left: `${layout.notice.x}%`,
							top: `${layout.notice.y}%`,
							width: `${layout.notice.w}%`,
							height: `${layout.notice.h}%`,
							fontSize: `${layout.notice.font}cqw`
						},
						onPointerDown: (event) => {
							drag.current = "notice";
							setPicked("notice");
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== "notice") return;
							const spot = at(event);
							if (spot) place("notice", spot.x, spot.y);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: "Thông báo"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-notice is-trail${picked === "trail" ? " on" : ""}${layout.trail.hidden ? " is-hidden" : ""}`,
						style: {
							left: `${layout.trail.x}%`,
							top: `${layout.trail.y}%`,
							width: `${layout.trail.w}%`,
							height: `${layout.trail.h}%`,
							["--dot"]: layout.trail.dot / 1.6
						},
						onPointerDown: (event) => {
							drag.current = "trail";
							setPicked("trail");
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== "trail") return;
							const spot = at(event);
							if (spot) place("trail", spot.x, spot.y);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: [
							"#ff3b3b",
							"#3dcc4a",
							"#3aa0ff",
							"#ff9a1f",
							"#c6ff3d"
						].map((ink) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "trail-slot",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
								className: "trail-dot",
								style: {
									color: ink,
									boxShadow: `0 0 ${layout.trail.glow}px ${layout.trail.glow * .2}px ${ink}`
								}
							})
						}, ink))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-notice${picked === "reaction" ? " on" : ""}${layout.reaction.hidden ? " is-hidden" : ""}`,
						style: {
							left: `${layout.reaction.x}%`,
							top: `${layout.reaction.y}%`,
							width: `${layout.reaction.w}%`,
							height: `${layout.reaction.h}%`,
							fontSize: `${layout.reaction.font}cqw`
						},
						onPointerDown: (event) => {
							drag.current = "reaction";
							setPicked("reaction");
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== "reaction") return;
							const spot = at(event);
							if (spot) place("reaction", spot.x, spot.y);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: "Phản ứng"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-pin${picked === "stack" ? " on" : ""}${layout.stack.hidden ? " is-hidden" : ""}`,
						style: {
							left: `${layout.stack.x}%`,
							top: `${layout.stack.y}%`,
							width: `${layout.stack.width}%`,
							height: `${layout.stack.height}%`,
							fontSize: `${layout.stack.size}cqw`
						},
						onPointerDown: (event) => {
							drag.current = "stack";
							setPicked("stack");
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== "stack") return;
							const spot = at(event);
							if (spot) place("stack", spot.x, spot.y);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: "Xấp"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-pin is-env${picked === "env" ? " on" : ""}${layout.env.hidden ? " is-hidden" : ""}`,
						style: {
							left: `${layout.env.x}%`,
							top: `${layout.env.y}%`,
							width: `${layout.env.width}%`,
							height: `${layout.env.height}%`,
							fontSize: `${layout.env.size}cqw`
						},
						onPointerDown: (event) => {
							drag.current = "env";
							setPicked("env");
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== "env") return;
							const spot = at(event);
							if (spot) place("env", spot.x, spot.y);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: "Môi trường mình"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-pin is-env${picked === "envFoe" ? " on" : ""}${layout.envFoe.hidden ? " is-hidden" : ""}`,
						style: {
							left: `${layout.envFoe.x}%`,
							top: `${layout.envFoe.y}%`,
							width: `${layout.envFoe.width}%`,
							height: `${layout.envFoe.height}%`,
							fontSize: `${layout.envFoe.size}cqw`
						},
						onPointerDown: (event) => {
							drag.current = "envFoe";
							setPicked("envFoe");
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== "envFoe") return;
							const spot = at(event);
							if (spot) place("envFoe", spot.x, spot.y);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: "Môi trường địch"
					}),
					HUD_MARKS.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-pin${picked === mark.key ? " on" : ""}${layout.marks[mark.key].hidden ? " is-hidden" : ""}`,
						style: {
							left: `${layout.marks[mark.key].x}%`,
							top: `${layout.marks[mark.key].y}%`,
							fontSize: `${layout.marks[mark.key].size}cqw`
						},
						onPointerDown: (event) => {
							drag.current = mark.key;
							setPicked(mark.key);
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== mark.key) return;
							const spot = at(event);
							if (spot) place(mark.key, spot.x, spot.y);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: mark.sample
					}, mark.key))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "tuner-note",
				children: ["Đang chọn: ", label]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
				onNudge: nudge,
				onFont: font,
				onWidth: boxy ? width : void 0,
				onHeight: boxy ? height : void 0,
				fontUp: picked === "trail" ? "Chấm to hơn" : "Chữ to hơn",
				fontDown: picked === "trail" ? "Chấm nhỏ hơn" : "Chữ nhỏ hơn"
			}),
			picked === "trail" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pad2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pad-btn",
					onClick: () => glow(.4),
					children: "Glow dày hơn"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pad-btn",
					onClick: () => glow(-.4),
					children: "Glow mỏng hơn"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: toggleHidden,
				children: hidden ? "Hiện mục này" : "Ẩn mục này"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tuner-list",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `tuner-item${picked === "notice" ? " on" : ""}`,
						onClick: () => setPicked("notice"),
						children: [
							"Bảng thông báo",
							layout.notice.hidden ? " · ẩn" : "",
							" · rộng ",
							layout.notice.w,
							" · cao ",
							layout.notice.h,
							" · chữ ",
							layout.notice.font
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `tuner-item${picked === "trail" ? " on" : ""}`,
						onClick: () => setPicked("trail"),
						children: [
							"Lịch sử thông báo",
							layout.trail.hidden ? " · ẩn" : "",
							" · rộng ",
							layout.trail.w,
							" · cao ",
							layout.trail.h,
							" · chấm ",
							layout.trail.dot,
							" · glow ",
							layout.trail.glow
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `tuner-item${picked === "reaction" ? " on" : ""}`,
						onClick: () => setPicked("reaction"),
						children: [
							"Thanh phản ứng",
							layout.reaction.hidden ? " · ẩn" : "",
							" · rộng ",
							layout.reaction.w,
							" · cao ",
							layout.reaction.h,
							" · chữ ",
							layout.reaction.font
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `tuner-item${picked === "stack" ? " on" : ""}`,
						onClick: () => setPicked("stack"),
						children: [
							"Xấp bài úp",
							layout.stack.hidden ? " · ẩn" : "",
							" · rộng ",
							layout.stack.width,
							" · cao ",
							layout.stack.height,
							" · chữ ",
							layout.stack.size
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `tuner-item${picked === "env" ? " on" : ""}`,
						onClick: () => setPicked("env"),
						children: [
							"Môi trường mình",
							layout.env.hidden ? " · ẩn" : "",
							" · rộng ",
							layout.env.width,
							" · cao ",
							layout.env.height,
							" · chữ ",
							layout.env.size
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `tuner-item${picked === "envFoe" ? " on" : ""}`,
						onClick: () => setPicked("envFoe"),
						children: [
							"Môi trường địch",
							layout.envFoe.hidden ? " · ẩn" : "",
							" · rộng ",
							layout.envFoe.width,
							" · cao ",
							layout.envFoe.height,
							" · chữ ",
							layout.envFoe.size
						]
					}),
					HUD_MARKS.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `tuner-item${picked === mark.key ? " on" : ""}`,
						onClick: () => setPicked(mark.key),
						children: [
							mark.label,
							layout.marks[mark.key].hidden ? " · ẩn" : "",
							" · chữ ",
							layout.marks[mark.key].size
						]
					}, mark.key))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					saveBoard(layout);
					setSaved(true);
				},
				children: "Lưu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => {
					setLayout(DEFAULT_BOARD_LAYOUT);
					saveBoard(DEFAULT_BOARD_LAYOUT);
					setSaved(true);
				},
				children: "Trả về mặc định"
			}),
			saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Đã lưu. Vào chơi để xem."
			}) : null
		]
	});
}
function SpotTune({ kind, onBack }) {
	const stage = (0, import_react.useRef)(null);
	const drag = (0, import_react.useRef)(null);
	const [layout, setLayout] = (0, import_react.useState)(() => kind === "monster" ? loadCard() : loadSpell());
	const marks = kind === "monster" ? CARD_MARKS : SPELL_MARKS;
	const [picked, setPicked] = (0, import_react.useState)(marks[0].key);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const spot = layout[picked];
	function at(event) {
		const node = stage.current;
		if (!node) return null;
		const rect = node.getBoundingClientRect();
		return {
			x: clamp((event.clientX - rect.left) / rect.width * 100, 2, 98),
			y: clamp((event.clientY - rect.top) / rect.height * 100, 2, 98)
		};
	}
	function patch(key, next) {
		setSaved(false);
		setLayout((current) => ({
			...current,
			[key]: {
				...current[key],
				...next
			}
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Về tuỳ chỉnh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: kind === "monster" ? "Chỉnh lá quái trên tay" : "Chỉnh lá phép trên tay" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Mũi tên dịch số. Chữ, rộng và cao đổi ô đang chọn."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: stage,
				className: "tune-stage tune-card",
				children: [kind === "monster" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
					monster: monsterCard("tho-den-tinh-nghich"),
					hideStats: true,
					showNew: true,
					layout
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFace, {
					spellId: "mua-ma-thuat",
					hideStats: true,
					showNew: true,
					spellLayout: layout
				}), marks.map((mark) => {
					const place = layout[mark.key];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tune-pin${picked === mark.key ? " on" : ""}${mark.key === "fresh" ? " is-mark" : ""}`,
						style: {
							left: `${place.x}%`,
							top: `${place.y}%`,
							width: `${place.width}%`,
							height: `${place.height}%`,
							fontSize: `${place.size}cqw`
						},
						onPointerDown: (event) => {
							drag.current = mark.key;
							setPicked(mark.key);
							event.currentTarget.setPointerCapture(event.pointerId);
						},
						onPointerMove: (event) => {
							if (drag.current !== mark.key) return;
							const next = at(event);
							if (next) patch(mark.key, next);
						},
						onPointerUp: () => {
							drag.current = null;
						},
						children: mark.key === "fresh" ? null : mark.sample
					}, mark.key);
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "tuner-note",
				children: ["Đang chọn: ", marks.find((mark) => mark.key === picked)?.label]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
				fontStep: 1,
				onNudge: (dx, dy) => patch(picked, {
					x: clamp(spot.x + dx, 2, 98),
					y: clamp(spot.y + dy, 2, 98)
				}),
				onFont: (delta) => patch(picked, { size: clamp(spot.size + delta, 3, 28) }),
				onWidth: (delta) => patch(picked, { width: clamp(spot.width + delta, 8, 96) }),
				onHeight: (delta) => patch(picked, { height: clamp(spot.height + delta, 4, 40) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tuner-list",
				children: marks.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `tuner-item${picked === mark.key ? " on" : ""}`,
					onClick: () => setPicked(mark.key),
					children: [
						mark.label,
						" · chữ ",
						layout[mark.key].size,
						" · rộng ",
						layout[mark.key].width,
						" · cao ",
						layout[mark.key].height
					]
				}, mark.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					if (kind === "monster") saveCard(layout);
					else saveSpell(layout);
					setSaved(true);
				},
				children: "Lưu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => {
					setLayout(kind === "monster" ? DEFAULT_CARD : DEFAULT_SPELL);
					if (kind === "monster") saveCard(DEFAULT_CARD);
					else saveSpell(DEFAULT_SPELL);
					setSaved(true);
				},
				children: "Trả về mặc định"
			}),
			saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Đã lưu. Vào chơi để xem."
			}) : null
		]
	});
}
function FieldTune({ onBack }) {
	const stage = (0, import_react.useRef)(null);
	const drag = (0, import_react.useRef)(null);
	const [layout, setLayout] = (0, import_react.useState)(loadField);
	const [picked, setPicked] = (0, import_react.useState)("name");
	const [saved, setSaved] = (0, import_react.useState)(false);
	const spot = layout[picked];
	function at(event) {
		const node = stage.current;
		if (!node) return null;
		const rect = node.getBoundingClientRect();
		return {
			x: clamp((event.clientX - rect.left) / rect.width * 100, 0, 98),
			y: clamp((event.clientY - rect.top) / rect.height * 100, 0, 98)
		};
	}
	function patch(key, next) {
		setSaved(false);
		setLayout((current) => ({
			...current,
			[key]: {
				...current[key],
				...next
			}
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Về tuỳ chỉnh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Chỉnh lá trên sân" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Số trên quái đang đứng sân. Mũi tên, cỡ chữ, rộng và cao."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: stage,
				className: "tune-stage tune-field",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: "art",
						src: artSrc("tho-den-tinh-nghich"),
						alt: ""
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: "frame",
						src: "/field-frame.png",
						alt: ""
					}),
					FIELD_MARKS.map((mark) => {
						const place = layout[mark.key];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `tune-pin${picked === mark.key ? " on" : ""}`,
							style: {
								left: `${place.x}%`,
								top: `${place.y}%`,
								width: `${place.width}%`,
								height: `${place.height}%`,
								fontSize: `${place.size}cqw`
							},
							onPointerDown: (event) => {
								drag.current = mark.key;
								setPicked(mark.key);
								event.currentTarget.setPointerCapture(event.pointerId);
							},
							onPointerMove: (event) => {
								if (drag.current !== mark.key) return;
								const next = at(event);
								if (next) patch(mark.key, next);
							},
							onPointerUp: () => {
								drag.current = null;
							},
							children: mark.sample
						}, mark.key);
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "tuner-note",
				children: ["Đang chọn: ", FIELD_MARKS.find((mark) => mark.key === picked)?.label]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
				fontStep: 1,
				onNudge: (dx, dy) => patch(picked, {
					x: clamp(spot.x + dx, 0, 98),
					y: clamp(spot.y + dy, 0, 98)
				}),
				onFont: (delta) => patch(picked, { size: clamp(spot.size + delta, 6, 32) }),
				onWidth: (delta) => patch(picked, { width: clamp(spot.width + delta, 8, 96) }),
				onHeight: (delta) => patch(picked, { height: clamp(spot.height + delta, 6, 40) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tuner-list",
				children: FIELD_MARKS.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `tuner-item${picked === mark.key ? " on" : ""}`,
					onClick: () => setPicked(mark.key),
					children: [
						mark.label,
						" · chữ ",
						layout[mark.key].size,
						" · rộng ",
						layout[mark.key].width,
						" · cao ",
						layout[mark.key].height
					]
				}, mark.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					saveField(layout);
					setSaved(true);
				},
				children: "Lưu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pad-btn",
				onClick: () => {
					setLayout(DEFAULT_FIELD);
					saveField(DEFAULT_FIELD);
					setSaved(true);
				},
				children: "Trả về mặc định"
			}),
			saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Đã lưu. Vào chơi để xem."
			}) : null
		]
	});
}
function exportNumbers() {
	const keys = [
		"stars",
		"gems",
		"atk",
		"def",
		"mdef",
		"hp"
	];
	const monsters = [...MONSTERS, ...FORMS].flatMap((base) => {
		const live = monsterCard(base.id);
		if (!live) return [];
		const diff = {};
		for (const key of keys) if (live[key] !== base[key]) diff[key] = live[key];
		if (live.name !== base.name) diff.name = live.name;
		if (live.skill !== base.skill) diff.skill = live.skill;
		if ((live.strong ?? "") !== (base.strong ?? "")) diff.strong = live.strong ?? "";
		if ((live.weak ?? "") !== (base.weak ?? "")) diff.weak = live.weak ?? "";
		if ((live.counter ?? "") !== (base.counter ?? "")) diff.counter = live.counter ?? "";
		if (live.picture && live.picture !== (base.picture || defaultMonsterPicture(base.art))) diff.picture = live.picture;
		const chips = chipDraft(base.id);
		const chipDiff = {};
		for (const chip of MONSTER_CHIPS[base.id] ?? []) if ((chips[chip.key] ?? chip.label) !== chip.label) chipDiff[chip.key] = chips[chip.key];
		if (Object.keys(chipDiff).length) diff.chips = chipDiff;
		const asks = askDraft(base.id);
		const askDiff = {};
		for (const ask of MONSTER_ASKS[base.id] ?? []) if ((asks[ask.key] ?? ask.label) !== ask.label) askDiff[ask.key] = asks[ask.key];
		if (Object.keys(askDiff).length) diff.asks = askDiff;
		return Object.keys(diff).length ? [{
			id: base.id,
			...diff
		}] : [];
	});
	const spells = SPELLS.flatMap((base) => {
		const live = spellCard(base.id);
		if (!live) return [];
		const diff = {};
		if (live.name !== base.name) diff.name = live.name;
		if (live.effect !== base.effect) diff.effect = live.effect;
		if (live.gems !== base.gems) diff.gems = live.gems;
		if (live.picture && live.picture !== (base.picture || defaultSpellPicture(base.id))) diff.picture = live.picture;
		return Object.keys(diff).length ? [{
			id: base.id,
			...diff
		}] : [];
	});
	const attack = attackLabel();
	const payload = {
		monsters,
		spells
	};
	if (attack && attack !== "Tấn công") payload.attack = attack;
	return JSON.stringify(payload, null, 2);
}
function CardTextTune({ onBack }) {
	const [pile, setPile] = (0, import_react.useState)("monster");
	const [id, setId] = (0, import_react.useState)(null);
	const [attack, setAttack] = (0, import_react.useState)(attackLabel);
	const [note, setNote] = (0, import_react.useState)("");
	const [dump, setDump] = (0, import_react.useState)("");
	const outside = new Set(FORMS.map((card) => card.id));
	const starOf = (card) => monsterCard(card.id)?.stars ?? card.stars;
	const gemOf = (card) => spellCard(card.id)?.gems ?? card.gems;
	const roster = [...MONSTERS, ...FORMS].sort((a, b) => starOf(a) - starOf(b) || Number(outside.has(a.id)) - Number(outside.has(b.id)) || a.name.localeCompare(b.name, "vi"));
	const spellRoster = [...SPELLS].sort((a, b) => gemOf(a) - gemOf(b) || a.name.localeCompare(b.name, "vi"));
	const baseMonster = roster.find((card) => card.id === id);
	const baseSpell = SPELLS.find((card) => card.id === id);
	const liveMonster = baseMonster ? monsterCard(baseMonster.id) : void 0;
	if (pile === "monster" && liveMonster && baseMonster) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonsterEdit, {
		base: baseMonster,
		live: liveMonster,
		onBack: () => setId(null),
		onStep: (dir) => setId(neighbor(roster, baseMonster.id, dir)),
		onSaved: setNote
	}, baseMonster.id);
	if (pile === "spell" && baseSpell) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpellEdit, {
		base: baseSpell,
		onBack: () => setId(null),
		onStep: (dir) => setId(neighbor(spellRoster, baseSpell.id, dir)),
		onSaved: setNote
	}, baseSpell.id);
	const list = pile === "monster" ? roster : spellRoster;
	let lastGroup = "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Quay lại"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Nội dung lá bài" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: "Sửa tên, chỉ số, chữ skill và ảnh. Dạng nở của sâu và tê giác ghi Ngoài bộ, hiện trong dựng bộ bài nhưng không cho vào bộ."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: ["Ô tấn công", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "tune-input",
					value: attack,
					onChange: (event) => setAttack(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					saveAttack(attack);
					setNote("Đã lưu ô tấn công.");
				},
				children: "Lưu ô tấn công"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pad2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `tuner-item${pile === "monster" ? " on" : ""}`,
					onClick: () => {
						setPile("monster");
						setId(null);
					},
					children: "Quái thú"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `tuner-item${pile === "spell" ? " on" : ""}`,
					onClick: () => {
						setPile("spell");
						setId(null);
					},
					children: "Phép"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tuner-list",
				children: list.map((card) => {
					const stars = "stars" in card ? monsterCard(card.id)?.stars ?? card.stars : 0;
					const gems = "gems" in card ? spellCard(card.id)?.gems ?? card.gems : 0;
					const group = pile === "monster" ? `${stars} sao` : `${gems} gem`;
					const fresh = group !== lastGroup;
					lastGroup = group;
					const name = pile === "monster" ? monsterCard(card.id)?.name ?? card.name : spellCard(card.id)?.name ?? card.name;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [fresh ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "tuner-group",
						children: group
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "tuner-item",
						onClick: () => setId(card.id),
						children: pile === "monster" && outside.has(card.id) ? `Ngoài bộ · ${name}` : name
					})] }, card.id);
				})
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tuner-note",
				children: note
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					const text = exportNumbers();
					setDump(text);
					navigator.clipboard?.writeText(text).then(() => setNote("Đã chép thay đổi, gồm số, ảnh, mô tả skill và tên ô."), () => setNote("Chưa chép được. Giữ phần chữ bên dưới rồi sao chép."));
				},
				children: "Xuất thay đổi"
			}),
			dump ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: "tune-input is-area",
				readOnly: true,
				value: dump
			}) : null
		]
	});
}
function MonsterEdit({ base, live, onBack, onStep, onSaved }) {
	const [draft, setDraft] = (0, import_react.useState)(live);
	const [chips, setChips] = (0, import_react.useState)(() => chipDraft(base.id));
	const [asks, setAsks] = (0, import_react.useState)(() => askDraft(base.id));
	const fields = MONSTER_CHIPS[base.id] ?? [];
	const questions = MONSTER_ASKS[base.id] ?? [];
	const setNum = (key, value) => {
		const next = Number(value);
		setDraft({
			...draft,
			[key]: Number.isFinite(next) ? next : 0
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Danh sách"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: base.name }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: ["Tên", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "tune-input",
					value: draft.name,
					onChange: (event) => setDraft({
						...draft,
						name: event.target.value
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tune-stats",
				children: [
					["stars", "Sao"],
					["gems", "Gem"],
					["atk", "Công"],
					["def", "Thủ"],
					["mdef", "Thủ phép"],
					["hp", "Máu"]
				].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "tune-field-label",
					children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "tune-input",
						inputMode: "numeric",
						value: draft[key],
						onChange: (event) => setNum(key, event.target.value)
					})]
				}, key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyEdit, {
				label: "Nội dung skill",
				value: draft.skill,
				onChange: (skill) => setDraft({
					...draft,
					skill
				}),
				sized: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtPick, {
				chosen: draft.picture || defaultMonsterPicture(base.art),
				onPick: (key) => setDraft({
					...draft,
					picture: key === defaultMonsterPicture(base.art) ? "" : key
				}),
				onStep: (dir) => {
					saveMonster({
						...draft,
						id: base.id,
						art: base.art,
						picture: draft.picture || ""
					}, chips, asks);
					onStep(dir);
				}
			}),
			questions.map((ask) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: [ask.title, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "tune-input is-area",
					value: asks[ask.key] ?? ask.label,
					onChange: (event) => setAsks({
						...asks,
						[ask.key]: event.target.value
					})
				})]
			}, ask.key)),
			fields.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: [
					chip.tone === "z" ? "Ô đỏ" : "Ô xanh",
					" · ",
					chip.label,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "tune-input",
						value: chips[chip.key] ?? chip.label,
						onChange: (event) => setChips({
							...chips,
							[chip.key]: event.target.value
						})
					})
				]
			}, chip.key)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					saveMonster({
						...draft,
						id: base.id,
						art: base.art,
						picture: draft.picture || ""
					}, chips, asks);
					onSaved(`Đã lưu ${draft.name}.`);
				},
				children: "Lưu lá này"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => {
					resetMonster(base.id);
					setDraft(base);
					setChips(Object.fromEntries(fields.map((chip) => [chip.key, chip.label])));
					setAsks(Object.fromEntries(questions.map((ask) => [ask.key, ask.label])));
					onSaved(`Đã trả ${base.name} về gốc.`);
				},
				children: "Trả về gốc"
			})
		]
	});
}
function SpellEdit({ base, onBack, onStep, onSaved }) {
	const [draft, setDraft] = (0, import_react.useState)(() => spellCard(base.id) ?? base);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "tuner",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-back",
				onClick: onBack,
				children: "Danh sách"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: base.name }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: ["Tên", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "tune-input",
					value: draft.name,
					onChange: (event) => setDraft({
						...draft,
						name: event.target.value
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "tune-field-label",
				children: ["Gem", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "tune-input",
					inputMode: "numeric",
					value: draft.gems,
					onChange: (event) => setDraft({
						...draft,
						gems: Number(event.target.value) || 0
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtPick, {
				chosen: draft.picture || defaultSpellPicture(base.id),
				onPick: (key) => setDraft({
					...draft,
					picture: key === defaultSpellPicture(base.id) ? "" : key
				}),
				onStep: (dir) => {
					saveSpell$1({
						...draft,
						id: base.id,
						picture: draft.picture || ""
					});
					onStep(dir);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyEdit, {
				label: "Nội dung phép",
				value: draft.effect,
				onChange: (effect) => setDraft({
					...draft,
					effect
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save",
				onClick: () => {
					saveSpell$1({
						...draft,
						id: base.id,
						picture: draft.picture || ""
					});
					onSaved(`Đã lưu ${draft.name}.`);
				},
				children: "Lưu lá này"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "tuner-save alt",
				onClick: () => {
					resetSpell(base.id);
					setDraft(base);
					onSaved(`Đã trả ${base.name} về gốc.`);
				},
				children: "Trả về gốc"
			})
		]
	});
}
function neighbor(list, id, dir) {
	return list[(list.findIndex((card) => card.id === id) + dir + list.length) % list.length]?.id ?? id;
}
function ArtPick({ chosen, onPick, onStep }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [gone, setGone] = (0, import_react.useState)(0);
	const [ask, setAsk] = (0, import_react.useState)(null);
	const hold = (0, import_react.useRef)(0);
	const held = (0, import_react.useRef)(false);
	const point = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const shots = [...monsterArts(), ...spellArts()];
	const current = shots.find((shot) => shot.key === chosen) ?? shots[0];
	const groups = [monsterArts(), spellArts()];
	const press = (shot, event) => {
		point.current = {
			x: event.clientX,
			y: event.clientY
		};
		window.clearTimeout(hold.current);
		held.current = false;
		hold.current = window.setTimeout(() => {
			held.current = true;
			setAsk(shot);
		}, 480);
	};
	const release = () => window.clearTimeout(hold.current);
	const slide = (event) => {
		if (Math.hypot(event.clientX - point.current.x, event.clientY - point.current.y) > 12) release();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "art-pick",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "art-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "art-toggle",
					onClick: () => setOpen((value) => !value),
					"aria-label": "Ảnh",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: current?.src,
						alt: ""
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "art-nav",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "art-arrow",
						onClick: () => onStep(-1),
						"aria-label": "Lá trước",
						children: "‹"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "art-arrow",
						onClick: () => onStep(1),
						"aria-label": "Lá sau",
						children: "›"
					})]
				})]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "art-pop",
				children: groups.map((list, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "art-grid",
					children: list.map((shot) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `art-shot${chosen === shot.key ? " on" : ""}`,
						onPointerDown: (event) => press(shot, event),
						onPointerMove: slide,
						onPointerUp: release,
						onPointerCancel: release,
						onContextMenu: (event) => event.preventDefault(),
						onClick: () => {
							if (held.current) {
								held.current = false;
								return;
							}
							onPick(shot.key);
							setOpen(false);
						},
						"aria-label": shot.label,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: shot.src,
							alt: ""
						})
					}, shot.key))
				}, index))
			}, gone) : null,
			ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "art-ask",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Xoá hình ",
						ask.label,
						"?"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							hideArt(ask.key);
							if (chosen === ask.key) {
								const rest = shots.find((shot) => shot.key !== ask.key);
								if (rest) onPick(rest.key);
							}
							setGone((n) => n + 1);
							setAsk(null);
						},
						children: "Xoá"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setAsk(null),
						children: "Không"
					})
				]
			}) : null
		]
	});
}
//#endregion
export { TunePage as component };
