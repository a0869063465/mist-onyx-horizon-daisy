const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 776, height: 500 }, deviceScaleFactor: 1.4 });
await p.goto("file://" + process.argv[2] + "/sheet.html"); await p.waitForTimeout(800);
await p.screenshot({ path: process.argv[2] + "/icon-xuat.png", fullPage: true }); await b.close(); })();
