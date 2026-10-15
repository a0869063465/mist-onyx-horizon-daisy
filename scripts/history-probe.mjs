import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (error) => console.log("PAGEERROR", error.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE", msg.text());
});

async function stores() {
  return page.evaluate(async () => {
    const local = localStorage.getItem("clash-match-history");
    const session = sessionStorage.getItem("clash-match-history");
    const cookie = document.cookie;
    let idb = "missing";
    let idbError = "";
    try {
      if (!indexedDB) idb = "unsupported";
      else {
        idb = await new Promise((resolve) => {
          const request = indexedDB.open("clash-match-db", 1);
          request.onerror = () => resolve("open-error");
          request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("book")) {
              resolve("no-store");
              return;
            }
            const get = db.transaction("book", "readonly").objectStore("book").get("history");
            get.onsuccess = () => resolve(typeof get.result === "string" ? `len:${get.result.length}` : `type:${typeof get.result}`);
            get.onerror = () => resolve("get-error");
          };
        });
      }
    } catch (error) {
      idbError = error instanceof Error ? error.message : String(error);
    }
    return {
      local: local ? `len:${local.length}` : null,
      session: session ? `len:${session.length}` : null,
      cookie,
      idb,
      idbError,
      href: location.href,
    };
  });
}

await page.goto("http://127.0.0.1:8080/modes", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Vs Máy" }).click();
await page.waitForURL("**/play");
await page.getByRole("button", { name: "Cài đặt" }).click();
await page.getByRole("button", { name: "Đầu hàng" }).click();
await page.getByRole("heading", { name: /thắng|thua|Bên/ }).waitFor({ timeout: 8000 });
console.log("AFTER_CONCEDE", JSON.stringify(await stores()));
await page.goto("http://127.0.0.1:8080/watch", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Xuất lịch sử ván đấu" }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Chẩn đoán" }).click();
await page.waitForTimeout(400);
const diag = await page.locator("main").innerText();
console.log("DIAG", diag.replaceAll("\n", " | "));
console.log("AFTER_NAV", JSON.stringify(await stores()));
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: "Xuất lịch sử ván đấu" }).click();
await page.waitForTimeout(800);
const reloaded = await page.locator("main").innerText();
console.log("AFTER_RELOAD", reloaded.replaceAll("\n", " | "));
console.log("STORES_RELOAD", JSON.stringify(await stores()));
await browser.close();
