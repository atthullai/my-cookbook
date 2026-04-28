"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon from "@/components/AppIcon";

const navItems = [
  { href: "/", label: "Home", icon: "home" as const },
  { href: "/recipes", label: "Recipes", icon: "book" as const },
  { href: "/about", label: "About Me", icon: "about" as const },
  { href: "/add", label: "Add Recipe", icon: "add" as const },
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
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} className={isActive ? "site-nav-link active" : "site-nav-link"}>
                <AppIcon name={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
