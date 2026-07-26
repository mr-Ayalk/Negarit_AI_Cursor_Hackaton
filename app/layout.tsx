import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { fontVariables } from "@/ui/fonts";

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
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-font="mono"
      data-font-size="md"
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('negarit-theme');if(t==='dark'||t==='light')d.setAttribute('data-theme',t);else d.setAttribute('data-theme','dark');var f=localStorage.getItem('negarit-font');if(f==='mono'||f==='sans'||f==='hybrid')d.setAttribute('data-font',f);else d.setAttribute('data-font','mono');var s=localStorage.getItem('negarit-font-size');if(s==='sm'||s==='md'||s==='lg')d.setAttribute('data-font-size',s);else d.setAttribute('data-font-size','md');}catch(e){}})();`,
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
