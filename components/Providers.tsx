"use client";

import { GuideProvider } from "@/lib/guide-context";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GuideProvider>{children}</GuideProvider>
    </ThemeProvider>
  );
}
