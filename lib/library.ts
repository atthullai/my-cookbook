// ---------------------------------------------------------------------------
// Library — save state, favourites, collections, recently viewed/cooked, search.
//
// Two backends:
//   • Logged-in  → Supabase (syncs across devices). Tables created in
//     migration 20260605_user_library_and_prefs.sql.
//   • Guest      → localStorage (so the app still works signed-out).
//
// On first login, localStorage data is migrated into Supabase once
// (see migrateLocalToDb), then the DB is the source of truth.
//
// App layer uses recipe ids as STRINGS; the DB columns are BIGINT, so we
// parseInt on write and String() on read.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export interface Collection {
  id: string;
  name: string;
  isSystem: boolean;
  recipeIds: string[];
  createdAt: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}

export interface SavedRecipe {
  recipeId: string;
  isFavourite: boolean;
}

export type SearchKind = "text" | "ingredient";

// ===========================================================================
// localStorage layer (guest mode + one-time migration source)
// ===========================================================================

const KEYS = {
  saved:    "lib_saved_v1",
  custom:   "lib_collections_v1",
  viewed:   "lib_viewed_v1",
  madeIt:   "lib_madeit_v1",
  migrated: "lib_migrated_v1",
} as const;

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function writeSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
}

function readCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(KEYS.custom);
    return raw ? (JSON.parse(raw) as Collection[]) : [];
  } catch { return []; }
}

function writeCollections(cols: Collection[]) {
  try { localStorage.setItem(KEYS.custom, JSON.stringify(cols)); } catch { /* ignore */ }
}

// ── guest: saved ────────────────────────────────────────────────────────────
export function getSavedIdsLocal(): Set<string> { return readSet(KEYS.saved); }
export function saveRecipeLocal(id: string)   { const s = readSet(KEYS.saved); s.add(id);    writeSet(KEYS.saved, s); }
export function unsaveRecipeLocal(id: string) { const s = readSet(KEYS.saved); s.delete(id); writeSet(KEYS.saved, s); }

// ── guest: recently viewed ──────────────────────────────────────────────────
export function trackViewLocal(id: string) {
  const list = getRecentlyViewedIdsLocal().filter((v) => v !== id);
  try { localStorage.setItem(KEYS.viewed, JSON.stringify([id, ...list].slice(0, 40))); } catch { /* ignore */ }
}
export function getRecentlyViewedIdsLocal(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.viewed);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

// ── guest: made it / cooked ─────────────────────────────────────────────────
export function getMadeItIdsLocal(): Set<string> { return readSet(KEYS.madeIt); }
export function markMadeItLocal(id: string) { const s = readSet(KEYS.madeIt); s.add(id); writeSet(KEYS.madeIt, s); }

// ── guest: collections ──────────────────────────────────────────────────────
export function getCustomCollectionsLocal(): Collection[] { return readCollections(); }
export function createCollectionLocal(name: string): Collection {
  const col: Collection = {
    id: `col_${Date.now()}`, name: name.trim(), isSystem: false,
    recipeIds: [], createdAt: new Date().toISOString(),
  };
  writeCollections([...readCollections(), col]);
  return col;
}
export function addToCollectionLocal(collectionId: string, recipeId: string) {
  writeCollections(readCollections().map((c) =>
    c.id === collectionId && !c.recipeIds.includes(recipeId)
      ? { ...c, recipeIds: [...c.recipeIds, recipeId] } : c));
}
export function removeFromCollectionLocal(collectionId: string, recipeId: string) {
  writeCollections(readCollections().map((c) =>
    c.id === collectionId ? { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId) } : c));
}
export function deleteCollectionLocal(collectionId: string) {
  writeCollections(readCollections().filter((c) => c.id !== collectionId));
}

// ===========================================================================
// Supabase layer (logged-in)
// ===========================================================================

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Parse a string recipe id to the BIGINT the DB expects; null if not numeric. */
function toRecipeBigint(id: string): number | null {
  const n = Number.parseInt(id, 10);
  return Number.isFinite(n) ? n : null;
}

// ── DB: saved + favourites ──────────────────────────────────────────────────
export async function fetchSaved(): Promise<SavedRecipe[]> {
  const { data, error } = await supabase
    .from("saved_recipes")
    .select("recipe_id, is_favourite")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({ recipeId: String(r.recipe_id), isFavourite: Boolean(r.is_favourite) }));
}

export async function saveRecipeDb(recipeId: string): Promise<void> {
  const userId = await uid();
  const rid = toRecipeBigint(recipeId);
  if (!userId || rid === null) return;
  await supabase.from("saved_recipes").upsert(
    { user_id: userId, recipe_id: rid },
    { onConflict: "user_id,recipe_id", ignoreDuplicates: true },
  );
}

export async function unsaveRecipeDb(recipeId: string): Promise<void> {
  const userId = await uid();
  const rid = toRecipeBigint(recipeId);
  if (!userId || rid === null) return;
  await supabase.from("saved_recipes").delete().eq("user_id", userId).eq("recipe_id", rid);
}

export async function setFavouriteDb(recipeId: string, fav: boolean): Promise<void> {
  const userId = await uid();
  const rid = toRecipeBigint(recipeId);
  if (!userId || rid === null) return;
  // Favouriting implies saving — upsert with the flag.
  await supabase.from("saved_recipes").upsert(
    { user_id: userId, recipe_id: rid, is_favourite: fav },
    { onConflict: "user_id,recipe_id" },
  );
}

// ── DB: collections ─────────────────────────────────────────────────────────
type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean | null;
  created_at: string;
  collection_recipes: { recipe_id: number }[] | null;
};

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("user_collections")
    .select("id, name, description, cover_image_url, is_public, created_at, collection_recipes(recipe_id)")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as CollectionRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    isSystem: false,
    recipeIds: (row.collection_recipes ?? []).map((cr) => String(cr.recipe_id)),
    createdAt: row.created_at,
    description: row.description ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    isPublic: row.is_public ?? false,
  }));
}

export async function createCollectionDb(
  name: string,
  opts?: { description?: string; coverImageUrl?: string; isPublic?: boolean },
): Promise<Collection | null> {
  const userId = await uid();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("user_collections")
    .insert({
      user_id: userId,
      name: name.trim(),
      description: opts?.description ?? null,
      cover_image_url: opts?.coverImageUrl ?? null,
      is_public: opts?.isPublic ?? false,
    })
    .select("id, created_at")
    .single();
  if (error || !data) return null;
  return {
    id: data.id, name: name.trim(), isSystem: false, recipeIds: [],
    createdAt: data.created_at,
    description: opts?.description, coverImageUrl: opts?.coverImageUrl, isPublic: opts?.isPublic ?? false,
  };
}

export async function deleteCollectionDb(collectionId: string): Promise<void> {
  await supabase.from("user_collections").delete().eq("id", collectionId);
}

export async function addToCollectionDb(collectionId: string, recipeId: string): Promise<void> {
  const rid = toRecipeBigint(recipeId);
  if (rid === null) return;
  await supabase.from("collection_recipes").upsert(
    { collection_id: collectionId, recipe_id: rid },
    { onConflict: "collection_id,recipe_id", ignoreDuplicates: true },
  );
}

export async function removeFromCollectionDb(collectionId: string, recipeId: string): Promise<void> {
  const rid = toRecipeBigint(recipeId);
  if (rid === null) return;
  await supabase.from("collection_recipes").delete()
    .eq("collection_id", collectionId).eq("recipe_id", rid);
}

// ── DB: recently viewed ─────────────────────────────────────────────────────
export async function trackViewDb(recipeId: string): Promise<void> {
  const userId = await uid();
  const rid = toRecipeBigint(recipeId);
  if (!userId || rid === null) return;
  await supabase.from("recipe_views").upsert(
    { user_id: userId, recipe_id: rid, viewed_at: new Date().toISOString() },
    { onConflict: "user_id,recipe_id" },
  );
}

export async function fetchRecentlyViewedIds(limit = 40): Promise<string[]> {
  const { data, error } = await supabase
    .from("recipe_views")
    .select("recipe_id")
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => String(r.recipe_id));
}

// ── DB: cook history ────────────────────────────────────────────────────────
export async function logCookDb(recipeId: string, servings?: number, note?: string): Promise<void> {
  const userId = await uid();
  const rid = toRecipeBigint(recipeId);
  if (!userId || rid === null) return;
  await supabase.from("cook_history").insert({
    user_id: userId, recipe_id: rid, servings: servings ?? null, note: note ?? null,
  });
}

export async function fetchRecentlyCookedIds(limit = 40): Promise<string[]> {
  const { data, error } = await supabase
    .from("cook_history")
    .select("recipe_id, cooked_at")
    .not("recipe_id", "is", null)
    .order("cooked_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of data) {
    const id = String(r.recipe_id);
    if (!seen.has(id)) { seen.add(id); out.push(id); }
    if (out.length >= limit) break;
  }
  return out;
}

// ── DB: search history ──────────────────────────────────────────────────────
export async function logSearchDb(term: string, kind: SearchKind = "text"): Promise<void> {
  const userId = await uid();
  const t = term.trim();
  if (!userId || !t) return;
  await supabase.from("search_history").insert({ user_id: userId, term: t, kind });
}

export async function fetchSearchHistory(limit = 10): Promise<string[]> {
  const { data, error } = await supabase
    .from("search_history")
    .select("term, searched_at")
    .order("searched_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of data) {
    const t = String(r.term);
    const key = t.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(t); }
    if (out.length >= limit) break;
  }
  return out;
}

// ===========================================================================
// One-time localStorage → Supabase migration
// ===========================================================================

export function hasMigratedLocal(): boolean {
  try { return localStorage.getItem(KEYS.migrated) === "true"; } catch { return false; }
}

function markMigratedLocal() {
  try { localStorage.setItem(KEYS.migrated, "true"); } catch { /* ignore */ }
}

/** Returns true if any local data was migrated (so callers can toast). */
export async function migrateLocalToDb(): Promise<boolean> {
  if (hasMigratedLocal()) return false;
  const userId = await uid();
  if (!userId) return false;

  let moved = false;

  // saved
  const savedRows = [...getSavedIdsLocal()]
    .map((id) => ({ user_id: userId, recipe_id: toRecipeBigint(id) }))
    .filter((r): r is { user_id: string; recipe_id: number } => r.recipe_id !== null);
  if (savedRows.length) {
    await supabase.from("saved_recipes").upsert(savedRows, { onConflict: "user_id,recipe_id", ignoreDuplicates: true });
    moved = true;
  }

  // recently viewed
  const viewedRows = getRecentlyViewedIdsLocal()
    .map((id, i) => ({ user_id: userId, recipe_id: toRecipeBigint(id), viewed_at: new Date(Date.now() - i * 1000).toISOString() }))
    .filter((r): r is { user_id: string; recipe_id: number; viewed_at: string } => r.recipe_id !== null);
  if (viewedRows.length) {
    await supabase.from("recipe_views").upsert(viewedRows, { onConflict: "user_id,recipe_id" });
    moved = true;
  }

  // made it → cook_history
  const cookedRows = [...getMadeItIdsLocal()]
    .map((id) => ({ user_id: userId, recipe_id: toRecipeBigint(id) }))
    .filter((r): r is { user_id: string; recipe_id: number } => r.recipe_id !== null);
  if (cookedRows.length) {
    await supabase.from("cook_history").insert(cookedRows);
    moved = true;
  }

  // collections + members
  for (const col of getCustomCollectionsLocal()) {
    const created = await createCollectionDb(col.name, { description: col.description, isPublic: col.isPublic });
    if (created) {
      for (const rid of col.recipeIds) await addToCollectionDb(created.id, rid);
      moved = true;
    }
  }

  markMigratedLocal();
  return moved;
}
