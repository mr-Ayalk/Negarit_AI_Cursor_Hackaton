"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";

const links = [
  { href: "/", label: "Home" },
  { href: "/setup", label: "Enter" },
  { href: "/guide", label: "Guide" },
  { href: "/summary", label: "Story" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          <Image src="/negarit-drum.png" alt="" width={36} height={36} />
          Negarit AI
        </Link>
        <nav className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            title={theme === "light" ? "Dark" : "Light"}
          >
            {theme === "light" ? "☾" : "☀"}
          </button>
          <Link href="/setup" className="btn btn-primary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}>
            Start visit
          </Link>
        </div>
      </div>
    </header>
  );
}
