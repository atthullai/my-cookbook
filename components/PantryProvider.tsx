"use client";

// PantryProvider — loads a lightweight snapshot of what's in the user's pantry
// (ingredient names + library ids) so recipe cards can show an availability
// indicator ("5 of 7 ingredients") without each card querying Supabase.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

function norm(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ").replace(/s$/, "");
}

interface PantryContextValue {
  ready: boolean;
  /** True if this ingredient link is plausibly covered by the pantry. */
  has: (link: { libraryId: string | null; name_en: string }) => boolean;
  refresh: () => void;
}

const PantryContext = createContext<PantryContextValue | null>(null);

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const [names, setNames]   = useState<Set<string>>(new Set());
  const [libIds, setLibIds] = useState<Set<string>>(new Set());
  const [ready, setReady]   = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setNames(new Set()); setLibIds(new Set()); setReady(true); return; }
    const { data, error } = await supabase
      .from("pantry_items")
      .select("name, ingredient_library_id")
      .eq("user_id", auth.user.id);
    if (!error && data) {
      setNames(new Set(data.map((r) => norm(String(r.name ?? ""))).filter(Boolean)));
      setLibIds(new Set(data.map((r) => r.ingredient_library_id).filter(Boolean).map(String)));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const has = useCallback((link: { libraryId: string | null; name_en: string }) => {
    if (link.libraryId && libIds.has(String(link.libraryId))) return true;
    const n = norm(link.name_en);
    return n.length > 2 && names.has(n);
  }, [names, libIds]);

  const value = useMemo(() => ({ ready, has, refresh: () => { void load(); } }), [ready, has, load]);

  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry(): PantryContextValue {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error("usePantry must be used inside <PantryProvider>");
  return ctx;
}
