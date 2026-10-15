import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SoundTap } from "@/components/sound-tap";
import { CopySize } from "@/components/game/copy-text";
import { publishLayout } from "@/lib/layouts";
import appCss from "../styles.css?url";

const APP_NAME = "Clash of the Beasts";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#071018" },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png?v=3" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-192.png?v=3" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;800&display=swap",
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
        <CopySize />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
    );
  },
});
