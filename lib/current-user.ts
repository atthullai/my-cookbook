// Cached current-user id lookup so many RecipeCards don't each call auth.getUser().
// Cleared on auth state change so it stays correct across login/logout.
import { supabase } from "@/lib/supabase";

let cached: Promise<string | null> | null = null;

export function getCurrentUserId(): Promise<string | null> {
  if (!cached) {
    cached = supabase.auth.getUser().then(({ data }) => data.user?.id ?? null).catch(() => null);
  }
  return cached;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange(() => { cached = null; });
}
