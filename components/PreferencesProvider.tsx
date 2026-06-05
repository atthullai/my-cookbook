"use client";

// ---------------------------------------------------------------------------
// PreferencesProvider — app-wide user preferences (diets, allergies, units,
// language, onboarding state). Backed by Supabase (user_preferences table).
//
// Also gates onboarding: a logged-in user who hasn't completed onboarding is
// redirected to /onboarding (except on auth/onboarding routes themselves).
// Guests are never forced to onboard — an account is optional.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  upsertPreferences,
  type UserPreferences,
} from "@/lib/preferences";

interface PreferencesContextValue {
  prefs: UserPreferences;
  loaded: boolean;
  loggedIn: boolean;
  updatePrefs: (patch: Partial<UserPreferences>) => Promise<void>;
  refresh: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Routes where we never force an onboarding redirect.
const ONBOARD_EXEMPT = ["/onboarding", "/login", "/welcome"];

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [prefs, setPrefs]       = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded]     = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    setLoggedIn(Boolean(user));
    if (user) {
      const p = await getPreferences();
      setPrefs(p ?? DEFAULT_PREFERENCES); // null row → treat as not onboarded
    } else {
      setPrefs(DEFAULT_PREFERENCES);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // Onboarding gate.
  useEffect(() => {
    if (!loaded || !loggedIn) return;
    if (prefs.onboarded) return;
    if (pathname && ONBOARD_EXEMPT.some((p) => pathname.startsWith(p))) return;
    router.replace("/onboarding");
  }, [loaded, loggedIn, prefs.onboarded, pathname, router]);

  const updatePrefs = useCallback(async (patch: Partial<UserPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...patch })); // optimistic
    const saved = await upsertPreferences(patch);
    if (saved) setPrefs(saved);
  }, []);

  const refresh = useCallback(() => { void load(); }, [load]);

  return (
    <PreferencesContext.Provider value={{ prefs, loaded, loggedIn, updatePrefs, refresh }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return ctx;
}
