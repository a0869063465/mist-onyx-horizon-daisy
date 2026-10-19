import { useEffect } from "react";

/**
 * The installed app (owner, 19/10): registers public/sw.js, which keeps every file of the game on the phone so it
 * installs from Chrome like an app and plays without the network. Each start asks it to fetch what changed.
 * Not in the dev server, whose files change on every save.
 */
export function OfflineApp() {
  useEffect(() => {
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => (reg.active ?? reg.waiting ?? reg.installing)?.postMessage("sync"))
      .catch(() => undefined);
  }, []);
  return null;
}
