"use client";

// SITE HEADER MAP
// This is the navigation bar shown at the top of every page.
// On desktop: sticky pill-style top bar.
// On mobile: compact top bar (brand only) + fixed bottom tab bar (5 primary tabs).
// Auto-hides on scroll-down; reappears on scroll-up.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";

const navItems = [
  { href: "/",        label: "Home",       icon: "home"   as const, emoji: "🏠" },
  { href: "/recipes", label: "Recipes",    icon: "book"   as const, emoji: "📖" },
  { href: "/planner", label: "Planner",    icon: "quick"  as const, emoji: "📅" },
  { href: "/pantry",  label: "Pantry",     icon: "onepot" as const, emoji: "🛒" },
  { href: "/pfand",   label: "Pfand",      icon: "about"  as const, emoji: "♻️" },
  { href: "/about",   label: "About Me",   icon: "about"  as const, emoji: "👤" },
  { href: "/add",     label: "Add Recipe", icon: "add"    as const, emoji: "+"  },
];

// The 5 tabs shown in the mobile bottom bar
const bottomTabs = [
  { href: "/",        label: "Home",    emoji: "🏠" },
  { href: "/recipes", label: "Recipes", emoji: "📖" },
  { href: "/planner", label: "Planner", emoji: "📅" },
  { href: "/pantry",  label: "Pantry",  emoji: "🛒" },
  { href: "/add",     label: "Add",     emoji: "+" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className="site-shell"
        style={{ transform: hidden ? "translateY(-110%)" : "translateY(0)", transition: "transform 0.25s ease" }}
      >
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

      {/* Mobile bottom tab bar — hidden on desktop via CSS */}
      <nav className="bottom-tab-bar" aria-label="Main navigation">
        {bottomTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname?.startsWith(tab.href)) ||
            (tab.href === "/recipes" && (pathname?.startsWith("/recipe/") ?? false));
          return (
            <Link key={tab.href} href={tab.href} className={`bottom-tab${isActive ? " active" : ""}`}>
              <span className="bottom-tab-icon">{tab.emoji}</span>
              <span className="bottom-tab-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
