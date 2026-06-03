"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Nav structure
// ---------------------------------------------------------------------------

type NavItem =
  | { type: "link"; href: string; label: string }
  | { type: "dropdown"; href: string; label: string; key: string; items: { href: string; label: string }[] };

const navItems: NavItem[] = [
  { type: "link", href: "/", label: "Home" },
  {
    type: "dropdown",
    href: "/discover",
    label: "Discover",
    key: "discover",
    items: [
      { href: "/recipes",             label: "Recipes"    },
      { href: "/discover/categories", label: "Categories" },
    ],
  },
  { type: "link", href: "/library",  label: "Library" },
  { type: "link", href: "/planner",  label: "Planner" },
  {
    type: "dropdown",
    href: "/pantry",
    label: "Pantry",
    key: "pantry",
    items: [
      { href: "/planner/shopping",   label: "Shopping List" },
      { href: "/pfand",              label: "Pfand"         },
    ],
  },
];

const bottomTabs = [
  { href: "/",        label: "Home",    emoji: "🏠" },
  { href: "/discover",label: "Discover",emoji: "🔍" },
  { href: "/library", label: "Library", emoji: "📚" },
  { href: "/planner", label: "Planner", emoji: "📅" },
  { href: "/pantry",  label: "Pantry",  emoji: "🥫" },
];

// ---------------------------------------------------------------------------
// DropdownMenu component
// ---------------------------------------------------------------------------

function DropdownMenu({
  item,
  isActive,
}: {
  item: Extract<NavItem, { type: "dropdown" }>;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // "v" key opens the dropdown when the button is focused
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "v" || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    },
    []
  );

  return (
    <div className="nav-dropdown-root" ref={ref}>
      <div className={`site-nav-link nav-dropdown-trigger${isActive ? " active" : ""}`}>
        <Link href={item.href} style={{ flex: 1 }}>{item.label}</Link>
        <button
          ref={btnRef}
          className="nav-chevron-btn"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onKeyDown}
          type="button"
          aria-label={`Open ${item.label} submenu`}
        >
          <span className={`nav-chevron${open ? " open" : ""}`}>▾</span>
        </button>
      </div>

      {open && (
        <div className="nav-dropdown-panel" role="menu">
          {item.items.map((sub) => {
            const active =
              pathname === sub.href ||
              (sub.href !== "/" && pathname?.startsWith(sub.href));
            return (
              <Link
                key={sub.href}
                href={sub.href}
                role="menuitem"
                className={`nav-dropdown-item${active ? " active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User menu
// ---------------------------------------------------------------------------

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isUserActive =
    pathname?.startsWith("/about") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/feedback");

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "v" || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
    if (e.key === "Escape") setOpen(false);
  }, []);

  return (
    <div className="nav-dropdown-root nav-user-root" ref={ref}>
      <button
        className={`site-nav-link nav-user-btn${open || isUserActive ? " active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        type="button"
      >
        <span className="nav-user-avatar">👤</span>
        <span className="nav-user-name">Atthullai</span>
        <span className={`nav-chevron${open ? " open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="nav-dropdown-panel nav-dropdown-panel--right" role="menu">
          {/* Mini profile card */}
          <div className="nav-user-card">
            <span className="nav-user-card-avatar">👤</span>
            <div>
              <div className="nav-user-card-name">Atthullai</div>
              <div className="nav-user-card-role">Chef &amp; Developer</div>
            </div>
          </div>
          <div className="nav-dropdown-divider" />
          <Link href="/about"    role="menuitem" className="nav-dropdown-item" onClick={() => setOpen(false)}>Profile</Link>
          <Link href="/settings" role="menuitem" className="nav-dropdown-item" onClick={() => setOpen(false)}>Settings</Link>
          <Link href="/feedback" role="menuitem" className="nav-dropdown-item" onClick={() => setOpen(false)}>Feedback &amp; Support</Link>
          <div className="nav-dropdown-divider" />
          <button className="nav-dropdown-item nav-dropdown-item--danger" role="menuitem" onClick={() => setOpen(false)}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification bell
// ---------------------------------------------------------------------------

function NotificationBell() {
  return (
    <button className="site-nav-link nav-icon-btn" aria-label="Notifications" type="button">
      <span className="nav-bell">🔔</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main header
// ---------------------------------------------------------------------------

export default function SiteHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 80);
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
          {/* Brand */}
          <Link href="/" className="site-brand">
            <span>
              <strong>Atthuzhai&apos;s Cookbook</strong>
              <small>Private bilingual family recipes</small>
            </span>
          </Link>

          {/* Primary nav */}
          <nav className="site-nav">
            {navItems.map((item) => {
              if (item.type === "link") {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`site-nav-link${isActive ? " active" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              }
              // dropdown
              const isActive = item.items.some(
                (sub) =>
                  pathname === sub.href ||
                  (sub.href !== "/" && pathname?.startsWith(sub.href))
              );
              return (
                <DropdownMenu key={item.key} item={item} isActive={isActive} />
              );
            })}
          </nav>

          {/* Right-side icons */}
          <div className="site-nav site-nav-right">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="bottom-tab-bar" aria-label="Main navigation">
        {bottomTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname?.startsWith(tab.href));
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
