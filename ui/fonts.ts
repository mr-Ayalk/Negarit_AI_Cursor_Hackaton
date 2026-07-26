import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

/**
 * Developer-forward type stack (Vercel / IDE aesthetic).
 * Mono drives UI chrome; Grotesk softens long-form reading.
 */
export const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
