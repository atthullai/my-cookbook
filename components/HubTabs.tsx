"use client";

// Shared tab strip that ties Pantry · Shopping List · Pfand into one "Lists" hub.
// Rendered at the top of each of the three pages; highlights the active route.

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Pantry", href: "/pantry" },
  { label: "Shopping List", href: "/shopping" },
  { label: "Supplements", href: "/supplements" },
  { label: "Pfand", href: "/pfand" },
];

export default function HubTabs() {
  const pathname = usePathname() ?? "";
  return (
    <div className="hub-tabs" role="tablist">
      {TABS.map((t) => {
        const active = pathname === t.href || (t.href === "/shopping" && pathname.startsWith("/shopping"));
        return (
          <Link key={t.href} href={t.href} role="tab" aria-selected={active} className={active ? "hub-tab active" : "hub-tab"}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
