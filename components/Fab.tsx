"use client";

// Floating Action Button — global quick actions: Add / Import / Scan / Plan /
// Grocery. Hidden on auth & onboarding routes. Sits above the mobile tab bar.

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, PencilLine, Link2, ScanLine, CalendarPlus, ShoppingCart } from "lucide-react";
import AddFromUrlModal from "@/components/AddFromUrlModal";

const HIDDEN_ON = ["/login", "/onboarding", "/welcome"];

type Action = { icon: React.ReactNode; label: string; go?: string; action?: "url" };

const ACTIONS: Action[] = [
  { icon: <PencilLine size={16} />,   label: "Create new recipe",  go: "/add" },
  { icon: <Link2 size={16} />,        label: "Add recipe from URL", action: "url" },
  { icon: <ScanLine size={16} />,     label: "Scan",        go: "/pantry?scan=1" },
  { icon: <CalendarPlus size={16} />, label: "Plan a meal", go: "/planner" },
  { icon: <ShoppingCart size={16} />, label: "Add grocery", go: "/planner/shopping" },
];

export default function Fab() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (pathname && HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const go = (href: string) => { setOpen(false); router.push(href); };
  const runAction = (a: Action) => {
    if (a.action === "url") { setOpen(false); setShowUrl(true); return; }
    if (a.go) go(a.go);
  };

  return (
    <div ref={ref} className="fab-root" style={{ position: "fixed", right: 20, bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)", zIndex: 60 }}>
      {showUrl && <AddFromUrlModal onClose={() => setShowUrl(false)} />}
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, alignItems: "flex-end" }}>
          {ACTIONS.map((a) => (
            <button key={a.label} type="button" onClick={() => runAction(a)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 14px",
                borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--foreground)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,0,0,0.12)", whiteSpace: "nowrap",
              }}>
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      )}
      <button type="button" aria-label={open ? "Close quick actions" : "Open quick actions"} aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "var(--accent)", color: "#fff8f1", marginLeft: "auto", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.22)", transition: "transform .18s ease",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>
        <Plus size={26} />
      </button>
    </div>
  );
}
