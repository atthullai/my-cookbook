"use client";

// SITE HEADER MAP
// This is the navigation bar shown at the top of every page.
// Add/remove nav links in navItems. The active link styling is calculated from the current URL.

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon from "@/components/AppIcon";

const navItems = [
  { href: "/",        label: "Home",       icon: "home"   as const, emoji: "🏠" },
  { href: "/recipes", label: "Recipes",    icon: "book"   as const, emoji: "📖" },
  { href: "/planner", label: "Planner",    icon: "quick"  as const, emoji: "📅" },
  { href: "/pantry",  label: "Pantry",     icon: "onepot" as const, emoji: "🛒" },
  { href: "/pfand",   label: "Pfand",      icon: "about"  as const, emoji: "♻️" },
  { href: "/about",   label: "About Me",   icon: "about"  as const, emoji: "👤" },
  { href: "/add",     label: "Add Recipe", icon: "add"    as const, emoji: ""   },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-shell">
      <div className="site-topbar">
        <Link href="/" className="site-brand">
          <span className="site-brand-mark">
            <AppIcon name="book" size={18} />
          </span>
          <span>
            <strong>Atthuzhai&apos;s Cookbook</strong>
            <small>Private bilingual family recipes</small>
          </span>
        </Link>

        <nav className="site-nav">
          {navItems.map((item) => {
            // Mark the link active when the current page exactly matches it,
            // or when we are inside that section, like /recipe/123 under Recipes.
            // /recipe/[id] is the canonical recipe detail route, so highlight "Recipes" there too.
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href)) ||
              (item.href === "/recipes" && (pathname?.startsWith("/recipe/") ?? false));

            return (
              <Link key={item.href} href={item.href} className={isActive ? "site-nav-link active" : "site-nav-link"}>
                <span>{item.emoji ? `${item.emoji} ${item.label}` : item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
