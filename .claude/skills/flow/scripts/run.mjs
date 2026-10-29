// node run.mjs <duel.json> <out-prefix> steps...
// steps: wait|ms  shot|name  until|sel  eval|js  tap|sel  drag|fromSel|toSel  state
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
const require = createRequire(`${process.cwd()}/package.json`);
const pw = await import(pathToFileURL(require.resolve("playwright")).href);
const chromium = pw.chromium ?? pw.default.chromium;
const [scene, prefix, ...steps] = process.argv.slice(2);
const duel = JSON.parse(readFileSync(scene, "utf8"));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: Number(process.env.VW ?? 412), height: Number(process.env.VH ?? 860) }, deviceScaleFactor: 2, hasTouch: false })).newPage();
page.on("pageerror", (err) => console.log("pageerror:", err.message));
page.on("console", (msg) => { if (msg.type() === "error") console.log("console:", msg.text().slice(0, 200)); });
await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => { sessionStorage.setItem("clash-mode", "ai"); localStorage.setItem("clash-starter-v1", "1"); });
await page.goto("http://localhost:8080/play", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".board", { timeout: 90000 });
await page.waitForFunction(() => !document.querySelector(".load-screen"), null, { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(800);
const hook = `(() => {
  const el = document.querySelector(".board");
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber"));
  for (let f = el[key]; f; f = f.return) {
    for (let h = f.memoizedState; h; h = h.next) {
      const v = h.memoizedState;
      if (v && v.players && v.mode && h.queue && h.queue.dispatch) return h;
    }
  }
  return null;
})()`;
const swapped = await page.evaluate(([next, hookJs]) => {
  const h = eval(hookJs);
  if (!h) return "no hook";
  h.queue.dispatch(next);
  return "ok";
}, [duel, hook]);
console.log("swap", swapped);
for (const step of steps) {
  const [kind, ...rest] = step.split("|");
  if (kind === "wait") await page.waitForTimeout(Number(rest[0]));
  else if (kind === "shot") { await page.screenshot({ path: `${prefix}-${rest[0]}.png` }); console.log("shot", rest[0]); }
  else if (kind === "until") { await page.waitForSelector(rest[0], { timeout: Number(rest[1] ?? 40000) }).catch(() => console.log("no", rest[0])); }
  else if (kind === "eval") console.log("eval", JSON.stringify(await page.evaluate(rest.join("|"))));
  else if (kind === "swap") {
    const next = JSON.parse(readFileSync(rest[0], "utf8"));
    console.log("swap", await page.evaluate(([n, hookJs]) => { const h = eval(hookJs); if (!h) return "no hook"; h.queue.dispatch(n); return "ok"; }, [next, hook]));
  }
  else if (kind === "tap") {
    const box = await page.locator(rest[0]).first().boundingBox({ timeout: 3000 }).catch(() => null);
    if (!box) { console.log("no tap target", rest[0]); continue; }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    console.log("tap", rest[0]);
  } else if (kind === "drag") {
    const a = await page.locator(rest[0]).first().boundingBox({ timeout: 3000 }).catch(() => null);
    const b = await page.locator(rest[1]).first().boundingBox({ timeout: 3000 }).catch(() => null);
    if (!a || !b) { console.log("no drag target", rest[0], rest[1]); continue; }
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(380);
    const steps = 14;
    for (let i = 1; i <= steps; i += 1) {
      await page.mouse.move(a.x + a.width / 2 + ((b.x + b.width / 2) - (a.x + a.width / 2)) * (i / steps), a.y + a.height / 2 + ((b.y + b.height / 2) - (a.y + a.height / 2)) * (i / steps));
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    console.log("drag", rest[0], "->", rest[1]);
  } else if (kind === "state") {
    const st = await page.evaluate((hookJs) => {
      const h = eval(hookJs);
      const d = h?.memoizedState;
      if (!d) return null;
      const field = (p) => p.field.map((m) => (m ? `${m.cardId}:${m.hp}${m.dim ? "*" : ""}` : "-")).join(" ");
      return {
        step: d.step, turn: d.turn, round: d.round, live: d.live,
        pending: d.pending?.kind ?? null, hold: d.hold ? { pr: d.hold.priority, stage: d.hold.stage ?? false, blocker: d.hold.blocker, seed: Boolean(d.hold.seed) } : null,
        p0: { hp: d.players[0].hp, orb: d.players[0].orb, hand: d.players[0].hand.join(","), field: field(d.players[0]) },
        p1: { hp: d.players[1].hp, orb: d.players[1].orb, hand: d.players[1].hand.join(","), field: field(d.players[1]) },
        oracle: [...document.querySelectorAll(".oracle-act")].map((b) => `${b.getAttribute("aria-label")}:${b.disabled ? "off" : "on"}${b.classList.contains("is-peek") ? ":peek" : ""}`),
        ok: document.querySelector(".act.medal-act")?.getAttribute("aria-label") ?? null,
        icons: [...document.querySelectorAll(".rx-icon")].map((i) => i.className.replace("rx-icon ", "")),
        toast: document.querySelector(".rx-hint, .rx-note, .banner")?.textContent?.slice(0, 80) ?? null,
      };
    }, hook);
    console.log("state", JSON.stringify(st));
  }
}
await browser.close();
