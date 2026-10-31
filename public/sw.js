/*
 * The installed app (owner, 19/10): Chrome can install the game like an app, and the game keeps every file it needs
 * on the phone, so it opens and plays without the network (online modes still need it).
 *
 * offline-files.json (written at build time) lists every file with a short hash. On install and on each start the
 * worker fetches that list and downloads only the files whose hash changed; files no longer listed are dropped.
 * Pictures, sounds, music, videos and scripts are then served from the phone. Pages are fetched from the network
 * first (so a new version shows on the next start) and fall back to the copy kept on the phone.
 */
const FILES = "clash-files";
const PAGES = "clash-pages";
const FONTS = "clash-fonts";
const META = "/__offline-meta.json";
const PAGE_PATHS = ["/", "/modes", "/deck", "/play", "/shop", "/collection", "/tune", "/watch", "/guide", "/hop-thu", "/mail", "/news", "/friends"];
const PAGE_WAIT_MS = 4000;

let syncing = null;

async function readMeta(cache) {
  const hit = await cache.match(META);
  if (!hit) return { version: "", files: {} };
  try {
    return await hit.json();
  } catch {
    return { version: "", files: {} };
  }
}

/** Downloads what changed since the last list, a few files at a time. */
function sync() {
  if (syncing) return syncing;
  syncing = (async () => {
    const res = await fetch("/offline-files.json", { cache: "no-store" });
    if (!res.ok) return;
    const list = await res.json();
    const cache = await caches.open(FILES);
    const known = await readMeta(cache);
    if (known.version === list.version) return;
    const want = Object.entries(list.files).filter(([path, hash]) => known.files[path] !== hash);
    const kept = { ...known.files };
    for (const path of Object.keys(kept)) if (!(path in list.files)) delete kept[path];
    let next = 0;
    const lane = async () => {
      while (next < want.length) {
        const [path, hash] = want[next++];
        try {
          const file = await fetch(path, { cache: "reload" });
          if (file.ok) {
            await cache.put(path, file);
            kept[path] = hash;
          }
        } catch {
          // Tried again on the next start.
        }
      }
    };
    await Promise.all(Array.from({ length: 6 }, lane));
    // Files that left the game.
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname;
      if (path !== META && !(path in list.files)) await cache.delete(request);
    }
    const complete = want.every(([path, hash]) => kept[path] === hash);
    await cache.put(META, new Response(JSON.stringify({ version: complete ? list.version : "", files: kept }), { headers: { "content-type": "application/json" } }));
    // The pages, so every screen opens without the network.
    const pages = await caches.open(PAGES);
    await Promise.all(
      PAGE_PATHS.map(async (path) => {
        try {
          const page = await fetch(path, { cache: "no-store" });
          if (page.ok) await pages.put(path, page);
        } catch {
          // Kept from before.
        }
      }),
    );
  })()
    .catch(() => undefined)
    .finally(() => {
      syncing = null;
    });
  return syncing;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(sync());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// The game asks for a check each time it opens.
self.addEventListener("message", (event) => {
  if (event.data === "sync") event.waitUntil(sync());
});

async function page(request) {
  const path = new URL(request.url).pathname;
  const pages = await caches.open(PAGES);
  try {
    const res = await Promise.race([fetch(request), new Promise((_, fail) => setTimeout(() => fail(new Error("slow")), PAGE_WAIT_MS))]);
    if (res.ok) pages.put(path, res.clone());
    return res;
  } catch {
    return (await pages.match(path)) ?? (await pages.match("/")) ?? Response.error();
  }
}

async function file(request) {
  const cache = await caches.open(FILES);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(request);
  // Scripts of a newer version arrive before the list says so: keep them too.
  if (res.ok && new URL(request.url).pathname.startsWith("/assets/")) cache.put(new URL(request.url).pathname, res.clone());
  return res;
}

async function font(request) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit ?? fresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(font(request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Server calls (rooms, matchmaking, notes) always go to the network.
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/__")) return;
  if (request.mode === "navigate") {
    event.respondWith(page(request));
    return;
  }
  if (url.pathname === "/offline-files.json" || url.pathname === "/sw.js") return;
  event.respondWith(file(request));
});
