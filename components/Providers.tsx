"use client";

import { GuideProvider } from "@/lib/guide-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <GuideProvider>{children}</GuideProvider>;
}
