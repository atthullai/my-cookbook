"use client";

// ---------------------------------------------------------------------------
// LibraryProvider — app-wide context for save state, favourites & collections.
//
// Logged-in users are backed by Supabase (syncs across devices); guests fall
// back to localStorage. On first login, local data migrates into the DB once.
//
// The context API stays synchronous-feeling: reads come from React state,
// writes update state optimistically and fire the async DB call in the
// background (rolling back + toasting on failure).
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import {
  Collection,
  // db
  fetchSaved,
  fetchCollections,
  fetchRecentlyViewedIds,
  fetchRecentlyCookedIds,
  saveRecipeDb,
  unsaveRecipeDb,
  setFavouriteDb,
  createCollectionDb,
  deleteCollectionDb,
  addToCollectionDb,
  removeFromCollectionDb,
  trackViewDb,
  migrateLocalToDb,
  // local (guest)
  getSavedIdsLocal,
  getCustomCollectionsLocal,
  getRecentlyViewedIdsLocal,
  saveRecipeLocal,
  unsaveRecipeLocal,
  trackViewLocal,
  createCollectionLocal,
  deleteCollectionLocal,
  addToCollectionLocal,
  removeFromCollectionLocal,
} from "@/lib/library";

interface LibraryContextValue {
  savedIds: Set<string>;
  favouriteIds: Set<string>;
  collections: Collection[];
  recentlyViewedIds: string[];
  recentlyCookedIds: string[];
  ready: boolean;
  save:               (id: string) => void;
  unsave:             (id: string) => void;
  isSaved:            (id: string) => boolean;
  toggleFavourite:    (id: string) => void;
  isFavourite:        (id: string) => boolean;
  addToCollection:    (collectionId: string, recipeId: string) => void;
  removeFromCollection: (collectionId: string, recipeId: string) => void;
  createCollection:   (name: string) => Promise<Collection | null>;
  deleteCollection:   (collectionId: string) => void;
  trackView:          (id: string) => void;
  refresh:            () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds]           = useState<Set<string>>(new Set());
  const [favouriteIds, setFavouriteIds]   = useState<Set<string>>(new Set());
  const [collections, setCollections]     = useState<Collection[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [recentlyCookedIds, setRecentlyCookedIds] = useState<string[]>([]);
  const [ready, setReady]                 = useState(false);

  // null = guest (localStorage); string = logged-in (Supabase)
  const userIdRef = useRef<string | null>(null);

  const loadAll = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;
    userIdRef.current = userId;

    if (userId) {
      // First login on this browser: pull any localStorage data into the DB.
      try {
        const moved = await migrateLocalToDb();
        if (moved) toast.success("Your saved recipes are now synced to your account");
      } catch { /* non-fatal */ }

      const [saved, cols, viewed, cooked] = await Promise.all([
        fetchSaved(),
        fetchCollections(),
        fetchRecentlyViewedIds(),
        fetchRecentlyCookedIds(),
      ]);
      setSavedIds(new Set(saved.map((s) => s.recipeId)));
      setFavouriteIds(new Set(saved.filter((s) => s.isFavourite).map((s) => s.recipeId)));
      setCollections(cols);
      setRecentlyViewedIds(viewed);
      setRecentlyCookedIds(cooked);
    } else {
      setSavedIds(getSavedIdsLocal());
      setFavouriteIds(new Set());
      setCollections(getCustomCollectionsLocal());
      setRecentlyViewedIds(getRecentlyViewedIdsLocal());
      setRecentlyCookedIds([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // Sync state from the external Supabase auth/session system on mount and
    // whenever the user logs in or out. loadAll only setState's after awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void loadAll(); });
    return () => sub.subscription.unsubscribe();
  }, [loadAll]);

  const refresh = useCallback(() => { loadAll(); }, [loadAll]);

  // ── saved ──────────────────────────────────────────────────────────────────
  const save = useCallback((id: string) => {
    setSavedIds((prev) => new Set(prev).add(id));
    if (userIdRef.current) {
      saveRecipeDb(id).catch(() => {
        setSavedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        toast.error("Couldn't save recipe");
      });
    } else {
      saveRecipeLocal(id);
    }
  }, []);

  const unsave = useCallback((id: string) => {
    setSavedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setFavouriteIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (userIdRef.current) {
      unsaveRecipeDb(id).catch(() => {
        setSavedIds((prev) => new Set(prev).add(id));
        toast.error("Couldn't remove recipe");
      });
    } else {
      unsaveRecipeLocal(id);
    }
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  // ── favourites ───────────────────────────────────────────────────────────
  const toggleFavourite = useCallback((id: string) => {
    const wasFav = favouriteIds.has(id);
    const next = !wasFav;
    setFavouriteIds((prev) => { const n = new Set(prev); if (next) n.add(id); else n.delete(id); return n; });
    if (next) setSavedIds((prev) => new Set(prev).add(id)); // favouriting implies saving
    if (userIdRef.current) {
      setFavouriteDb(id, next).catch(() => {
        setFavouriteIds((prev) => { const n = new Set(prev); if (wasFav) n.add(id); else n.delete(id); return n; });
        toast.error("Couldn't update favourite");
      });
    } else if (next) {
      saveRecipeLocal(id);
    }
  }, [favouriteIds]);

  const isFavourite = useCallback((id: string) => favouriteIds.has(id), [favouriteIds]);

  // ── collections ────────────────────────────────────────────────────────────
  const addToCollection = useCallback((collectionId: string, recipeId: string) => {
    setCollections((prev) => prev.map((c) =>
      c.id === collectionId && !c.recipeIds.includes(recipeId)
        ? { ...c, recipeIds: [...c.recipeIds, recipeId] } : c));
    if (userIdRef.current) addToCollectionDb(collectionId, recipeId).catch(() => toast.error("Couldn't add to collection"));
    else addToCollectionLocal(collectionId, recipeId);
  }, []);

  const removeFromCollection = useCallback((collectionId: string, recipeId: string) => {
    setCollections((prev) => prev.map((c) =>
      c.id === collectionId ? { ...c, recipeIds: c.recipeIds.filter((r) => r !== recipeId) } : c));
    if (userIdRef.current) removeFromCollectionDb(collectionId, recipeId).catch(() => toast.error("Couldn't update collection"));
    else removeFromCollectionLocal(collectionId, recipeId);
  }, []);

  const createCollection = useCallback(async (name: string): Promise<Collection | null> => {
    if (userIdRef.current) {
      const col = await createCollectionDb(name);
      if (!col) { toast.error("Couldn't create collection"); return null; }
      setCollections((prev) => [...prev, col]);
      return col;
    }
    const col = createCollectionLocal(name);
    setCollections((prev) => [...prev, col]);
    return col;
  }, []);

  const deleteCollection = useCallback((collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    if (userIdRef.current) deleteCollectionDb(collectionId).catch(() => toast.error("Couldn't delete collection"));
    else deleteCollectionLocal(collectionId);
  }, []);

  // ── recently viewed ──────────────────────────────────────────────────────
  const trackView = useCallback((id: string) => {
    setRecentlyViewedIds((prev) => [id, ...prev.filter((v) => v !== id)].slice(0, 40));
    if (userIdRef.current) trackViewDb(id).catch(() => { /* non-critical */ });
    else trackViewLocal(id);
  }, []);

  return (
    <LibraryContext.Provider value={{
      savedIds,
      favouriteIds,
      collections,
      recentlyViewedIds,
      recentlyCookedIds,
      ready,
      save,
      unsave,
      isSaved,
      toggleFavourite,
      isFavourite,
      addToCollection,
      removeFromCollection,
      createCollection,
      deleteCollection,
      trackView,
      refresh,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}
