import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SoundTap } from "@/components/sound-tap";
import { MenuMusic } from "@/components/menu-music";
import { OfflineApp } from "@/components/offline-app";
import { FullScreen } from "@/components/full-screen";
import { WebGuard } from "@/components/web-guard";
import { FriendPulse } from "@/components/friend-pulse";
import { CopySize } from "@/components/game/copy-text";
import { publishLayout } from "@/lib/layouts";
import { GameLoad } from "@/components/game/load-screen";
import { gameJobs } from "@/lib/preload";
import appCss from "../styles.css?url";

const APP_NAME = "Clash of the Beasts";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#071018" },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png?v=3" },
      { rel: "stylesheet", href: appCss },
      // With credentials, so a preview link behind a login can still be installed.
      { rel: "manifest", href: "/manifest.json", crossOrigin: "use-credentials" },
      { rel: "apple-touch-icon", href: "/icon-192.png?v=3" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;800&family=Barlow+Condensed:wght@500;600;700&family=Cinzel:wght@600;700&display=swap",
      },
    ],
  }),
  component: () => {
    publishLayout();
    return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <SoundTap />
        <MenuMusic />
        <OfflineApp />
        <FullScreen />
        <WebGuard />
        <CopySize />
        <AuthProvider>
          <Outlet />
          <FriendPulse />
        </AuthProvider>
        <GameLoad jobs={gameJobs} />
        <Scripts />
      </body>
    </html>
    );
  },
});
