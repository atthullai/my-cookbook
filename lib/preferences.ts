// ---------------------------------------------------------------------------
// User preferences — onboarding answers + settings, backed by Supabase
// (user_preferences table; migration 20260605_user_library_and_prefs.sql).
//
// Consumed by onboarding (Phase 1), Discover/Recommended filtering, the
// allergen banner (Phase 5), and the settings menu. Data layer only — the
// React provider is added alongside the onboarding flow.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export type DietKey = "vegetarian" | "vegan" | "high-protein";
export type AllergenKey =
  | "peanuts" | "tree-nuts" | "soy" | "eggs" | "milk" | "shellfish" | "gluten" | "sesame";
export type UnitSystem = "metric" | "imperial";
export type AppLang = "en" | "de";

export type CookingExperience = "beginner" | "intermediate" | "advanced";

export interface UserPreferences {
  diets: DietKey[];
  allergies: AllergenKey[];
  units: UnitSystem;
  language: AppLang;
  onboarded: boolean;
  notificationsEnabled: boolean;
  // Settings → Preferences (spec §5.9). Filtering/defaults only, never AI.
  dislikes: string[];
  household: number;
  preferredStore: string;
  cookingExperience: CookingExperience | "";
  favouriteCuisines: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  diets: [],
  allergies: [],
  units: "metric",
  language: "en",
  onboarded: false,
  notificationsEnabled: true,
  dislikes: [],
  household: 1,
  preferredStore: "",
  cookingExperience: "",
  favouriteCuisines: [],
};

export const COOKING_EXPERIENCE_OPTIONS: { key: CookingExperience; label: string; emoji: string }[] = [
  { key: "beginner",     label: "Beginner",     emoji: "🌱" },
  { key: "intermediate", label: "Intermediate", emoji: "🍳" },
  { key: "advanced",     label: "Advanced",     emoji: "👨‍🍳" },
];

// Option lists for the onboarding UI.
export const DIET_OPTIONS: { key: DietKey; label: string; emoji: string }[] = [
  { key: "vegetarian",   label: "Vegetarian",   emoji: "🥗" },
  { key: "vegan",        label: "Vegan",        emoji: "🌱" },
  { key: "high-protein", label: "High Protein", emoji: "💪" },
];

export const ALLERGEN_OPTIONS: { key: AllergenKey; label: string; emoji: string }[] = [
  { key: "peanuts",   label: "Peanuts",   emoji: "🥜" },
  { key: "tree-nuts", label: "Tree nuts", emoji: "🌰" },
  { key: "soy",       label: "Soy",       emoji: "🫘" },
  { key: "eggs",      label: "Eggs",      emoji: "🥚" },
  { key: "milk",      label: "Milk",      emoji: "🥛" },
  { key: "shellfish", label: "Shellfish", emoji: "🦐" },
  { key: "gluten",    label: "Gluten",    emoji: "🌾" },
  { key: "sesame",    label: "Sesame",    emoji: "🌻" },
];

type PreferencesRow = {
  diets: string[] | null;
  allergies: string[] | null;
  units: string | null;
  language: string | null;
  onboarded: boolean | null;
  notifications_enabled: boolean | null;
  dislikes?: string[] | null;
  household?: number | null;
  preferred_store?: string | null;
  cooking_experience?: string | null;
  favourite_cuisines?: string[] | null;
};

const PREF_COLUMNS =
  "diets, allergies, units, language, onboarded, notifications_enabled, dislikes, household, preferred_store, cooking_experience, favourite_cuisines";

function rowToPrefs(row: PreferencesRow): UserPreferences {
  return {
    diets: (row.diets ?? []) as DietKey[],
    allergies: (row.allergies ?? []) as AllergenKey[],
    units: (row.units as UnitSystem) ?? "metric",
    language: (row.language as AppLang) ?? "en",
    onboarded: Boolean(row.onboarded),
    notificationsEnabled: row.notifications_enabled ?? true,
    dislikes: row.dislikes ?? [],
    household: row.household ?? 1,
    preferredStore: row.preferred_store ?? "",
    cookingExperience: (row.cooking_experience as CookingExperience) ?? "",
    favouriteCuisines: row.favourite_cuisines ?? [],
  };
}

const BASE_PREF_COLUMNS = "diets, allergies, units, language, onboarded, notifications_enabled";

/** Returns the current user's preferences, or null if not logged in / no row yet.
 *  Falls back to base columns if the extra-preferences migration hasn't been run. */
export async function getPreferences(): Promise<UserPreferences | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const read = (cols: string) =>
    supabase.from("user_preferences").select(cols).eq("user_id", auth.user!.id).maybeSingle();
  let { data, error } = await read(PREF_COLUMNS);
  if (error) ({ data, error } = await read(BASE_PREF_COLUMNS)); // extra columns may not exist yet
  if (error || !data) return null;
  return rowToPrefs(data as unknown as PreferencesRow);
}

/** Upserts a partial set of preference fields for the current user. */
export async function upsertPreferences(patch: Partial<UserPreferences>): Promise<UserPreferences | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const dbPatch: Record<string, unknown> = { user_id: auth.user.id };
  if (patch.diets !== undefined)                dbPatch.diets = patch.diets;
  if (patch.allergies !== undefined)            dbPatch.allergies = patch.allergies;
  if (patch.units !== undefined)                dbPatch.units = patch.units;
  if (patch.language !== undefined)             dbPatch.language = patch.language;
  if (patch.onboarded !== undefined)            dbPatch.onboarded = patch.onboarded;
  if (patch.notificationsEnabled !== undefined) dbPatch.notifications_enabled = patch.notificationsEnabled;
  if (patch.dislikes !== undefined)             dbPatch.dislikes = patch.dislikes;
  if (patch.household !== undefined)            dbPatch.household = patch.household;
  if (patch.preferredStore !== undefined)       dbPatch.preferred_store = patch.preferredStore;
  if (patch.cookingExperience !== undefined)    dbPatch.cooking_experience = patch.cookingExperience || null;
  if (patch.favouriteCuisines !== undefined)    dbPatch.favourite_cuisines = patch.favouriteCuisines;

  const { error } = await supabase
    .from("user_preferences")
    .upsert(dbPatch, { onConflict: "user_id" });
  if (error) return null;
  // Re-read with the resilient getter (handles pre-migration column absence).
  return getPreferences();
}
