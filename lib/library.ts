// ---------------------------------------------------------------------------
// Library — save state, collections, recently viewed
// Backed by localStorage now; shaped for easy Supabase migration later.
// ---------------------------------------------------------------------------

export interface Collection {
  id: string;
  name: string;
  isSystem: boolean;
  recipeIds: string[];
  createdAt: string;
}

const KEYS = {
  saved:   "lib_saved_v1",
  custom:  "lib_collections_v1",
  viewed:  "lib_viewed_v1",
  madeIt:  "lib_madeit_v1",
} as const;

// ── helpers ────────────────────────────────────────────────────────────────

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function writeSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

function readCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(KEYS.custom);
    return raw ? (JSON.parse(raw) as Collection[]) : [];
  } catch { return []; }
}

function writeCollections(cols: Collection[]) {
  localStorage.setItem(KEYS.custom, JSON.stringify(cols));
}

// ── saved recipes ──────────────────────────────────────────────────────────

export function getSavedIds(): Set<string> {
  return readSet(KEYS.saved);
}

export function saveRecipe(id: string) {
  const set = readSet(KEYS.saved);
  set.add(id);
  writeSet(KEYS.saved, set);
}

export function unsaveRecipe(id: string) {
  const set = readSet(KEYS.saved);
  set.delete(id);
  writeSet(KEYS.saved, set);
}

export function isSaved(id: string): boolean {
  return readSet(KEYS.saved).has(id);
}

// ── recently viewed ────────────────────────────────────────────────────────

export function trackView(id: string) {
  const list = getRecentlyViewedIds();
  const filtered = list.filter((v) => v !== id);
  const next = [id, ...filtered].slice(0, 40); // keep last 40
  localStorage.setItem(KEYS.viewed, JSON.stringify(next));
}

export function getRecentlyViewedIds(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.viewed);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

// ── made it ────────────────────────────────────────────────────────────────

export function getMadeItIds(): Set<string> {
  return readSet(KEYS.madeIt);
}

export function markMadeIt(id: string) {
  const set = readSet(KEYS.madeIt);
  set.add(id);
  writeSet(KEYS.madeIt, set);
}

// ── custom collections ─────────────────────────────────────────────────────

export function getCustomCollections(): Collection[] {
  return readCollections();
}

export function createCollection(name: string): Collection {
  const col: Collection = {
    id: `col_${Date.now()}`,
    name: name.trim(),
    isSystem: false,
    recipeIds: [],
    createdAt: new Date().toISOString(),
  };
  const cols = readCollections();
  writeCollections([...cols, col]);
  return col;
}

export function addToCollection(collectionId: string, recipeId: string) {
  const cols = readCollections().map((c) =>
    c.id === collectionId && !c.recipeIds.includes(recipeId)
      ? { ...c, recipeIds: [...c.recipeIds, recipeId] }
      : c
  );
  writeCollections(cols);
}

export function removeFromCollection(collectionId: string, recipeId: string) {
  const cols = readCollections().map((c) =>
    c.id === collectionId
      ? { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId) }
      : c
  );
  writeCollections(cols);
}

export function deleteCollection(collectionId: string) {
  writeCollections(readCollections().filter((c) => c.id !== collectionId));
}
