// The game's files for the Android app (chủ game 30/10): downloads every file listed in the live site's
// offline-files.json, and its pages, into the app's assets, so the APK plays without the network from its first start.
//
// Usage: node scripts/apk/bundle-web.mjs <site> <assets folder>
//   e.g. node scripts/apk/bundle-web.mjs https://clashofthebeasts.vercel.app android/app/src/main/assets
// Kept in step with WebStore.PAGES (android/app/src/main/java/com/clashofthebeasts/game/WebStore.kt).
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

const [site, out] = process.argv.slice(2);
if (!site || !out) {
  console.error("Usage: node scripts/apk/bundle-web.mjs <site> <assets folder>");
  process.exit(1);
}
const PAGES = ["/", "/modes", "/deck", "/play", "/shop", "/collection", "/tune", "/watch", "/guide", "/hop-thu"];
const pageName = (path) => (path === "/" ? "index.html" : `${path.replace(/^\/+|\/+$/g, "").replaceAll("/", "_")}.html`);

async function get(path) {
  for (let tries = 1; ; tries++) {
    try {
      const res = await fetch(new URL(path, site), { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${path}`);
      return new Uint8Array(await res.arrayBuffer());
    } catch (error) {
      if (tries >= 4) throw error;
      await new Promise((done) => setTimeout(done, 1000 * tries));
    }
  }
}

await rm(out, { recursive: true, force: true });
const listBytes = await get("/offline-files.json");
const list = JSON.parse(new TextDecoder().decode(listBytes));
const paths = Object.keys(list.files);
let next = 0;
let bytes = 0;
const lane = async () => {
  while (next < paths.length) {
    const path = paths[next++];
    const body = await get(path);
    const file = join(out, "web", path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
    bytes += body.length;
  }
};
await Promise.all(Array.from({ length: 8 }, lane));
for (const path of PAGES) {
  const file = join(out, "pages", pageName(path));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, await get(path));
}
await writeFile(join(out, "web-manifest.json"), listBytes);
console.log(`${paths.length} files, ${(bytes / 1e6).toFixed(1)} MB, version ${list.version}, ${PAGES.length} pages`);
