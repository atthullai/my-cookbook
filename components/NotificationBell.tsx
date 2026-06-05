"use client";

// NotificationBell — header bell with a live count + dropdown of actionable
// reminders: today's planned meals, shopping items to buy, and pantry items
// expiring soon or low in stock. Quiet when the user is signed out.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Notif = { id: string; icon: string; text: string; href: string };

const EXPIRY_SOON_DAYS = 3;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setItems([]); return; }

    const today = new Date().toISOString().slice(0, 10);
    const [mealRes, groceryRes, pantryRes] = await Promise.all([
      supabase.from("planned_meals").select("id", { count: "exact", head: true }).eq("meal_date", today),
      supabase.from("shopping_list").select("id", { count: "exact", head: true }).eq("checked", false),
      supabase.from("pantry_items").select("quantity, low_stock_threshold, expiry_date"),
    ]);

    const next: Notif[] = [];

    if ((mealRes.count ?? 0) > 0) {
      next.push({ id: "meals", icon: "📅", text: `${mealRes.count} meal${mealRes.count === 1 ? "" : "s"} planned today`, href: "/planner" });
    }
    if ((groceryRes.count ?? 0) > 0) {
      next.push({ id: "grocery", icon: "🛒", text: `${groceryRes.count} item${groceryRes.count === 1 ? "" : "s"} to buy`, href: "/planner/shopping" });
    }

    const pantry = pantryRes.data ?? [];
    const now = Date.now();
    const expiring = pantry.filter((p) => {
      if (!p.expiry_date) return false;
      const days = Math.ceil((new Date(p.expiry_date).getTime() - now) / 86_400_000);
      return days <= EXPIRY_SOON_DAYS;
    }).length;
    const lowStock = pantry.filter((p) =>
      p.low_stock_threshold != null && p.quantity != null && Number(p.quantity) <= Number(p.low_stock_threshold),
    ).length;

    if (expiring > 0) next.push({ id: "expiring", icon: "⚠️", text: `${expiring} item${expiring === 1 ? "" : "s"} expiring soon`, href: "/pantry" });
    if (lowStock > 0) next.push({ id: "low", icon: "📉", text: `${lowStock} item${lowStock === 1 ? "" : "s"} low in stock`, href: "/pantry" });

    setItems(next);
  }, []);

  useEffect(() => {
    // Syncs notification state from Supabase on mount and auth changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const count = items.length;

  return (
    <div className="nav-dropdown-root" ref={ref} style={{ position: "relative" }}>
      <button className="site-nav-link nav-icon-btn" aria-label="Notifications" type="button"
        aria-expanded={open} onClick={() => { setOpen((v) => !v); void load(); }}>
        <span className="nav-bell">🔔</span>
        {count > 0 && (
          <span aria-hidden style={{
            position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, padding: "0 4px",
            borderRadius: 999, background: "var(--berry, #c0392b)", color: "#fff", fontSize: 10,
            fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
          }}>{count}</span>
        )}
      </button>

      {open && (
        <div className="nav-dropdown-panel nav-dropdown-panel--right" role="menu" style={{ minWidth: 240 }}>
          <div className="nav-user-card">
            <span className="nav-user-card-avatar">🔔</span>
            <div>
              <div className="nav-user-card-name">Notifications</div>
              <div className="nav-user-card-role">{count > 0 ? `${count} new` : "You're all caught up"}</div>
            </div>
          </div>
          <div className="nav-dropdown-divider" />
          {count === 0 ? (
            <div className="nav-dropdown-item" style={{ color: "var(--muted)", cursor: "default" }}>
              Nothing needs your attention.
            </div>
          ) : (
            items.map((n) => (
              <Link key={n.id} href={n.href} role="menuitem" className="nav-dropdown-item"
                onClick={() => setOpen(false)} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span aria-hidden>{n.icon}</span>
                <span>{n.text}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
