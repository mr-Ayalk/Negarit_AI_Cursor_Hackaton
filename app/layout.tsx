import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Negarit AI — Adwa Museum Guide",
  description:
    "WiFi-powered visiting guide for Adwa Museum. Voice stories, Addis AI for Amharic, ElevenLabs voice, Chapa payments, and a day chronicle of your visit.",
  applicationName: "Negarit AI",
  icons: {
    icon: "/negarit-drum.png",
    apple: "/negarit-drum.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('negarit-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
