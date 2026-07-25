import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Negarit AI — Adwa Museum Guide",
  description:
    "Bluetooth-powered AI visiting guide for Adwa Museum. Voice stories, Telebirr payments, and a day blog of your visit.",
  applicationName: "Negarit AI",
  icons: {
    icon: "/negarit-drum.png",
    apple: "/negarit-drum.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1410",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
