"use client";

// ---------------------------------------------------------------------------
// LibraryProvider — app-wide context for save state & collections.
// Wrap the root layout with this so any component (RecipeCard, Library page,
// etc.) can read/write save state without prop-drilling.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Collection,
  addToCollection as libAddTo,
  createCollection as libCreate,
  deleteCollection as libDelete,
  getCustomCollections,
  getSavedIds,
  saveRecipe,
  trackView,
  unsaveRecipe,
} from "@/lib/library";

interface LibraryContextValue {
  savedIds: Set<string>;
  collections: Collection[];
  save:               (id: string) => void;
  unsave:             (id: string) => void;
  isSaved:            (id: string) => boolean;
  addToCollection:    (collectionId: string, recipeId: string) => void;
  createCollection:   (name: string) => Collection;
  deleteCollection:   (collectionId: string) => void;
  trackView:          (id: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Collection[]>([]);

  // Hydrate from localStorage on mount (client-only).
  // Wrapped in setTimeout to avoid synchronous setState-in-effect warning.
  useEffect(() => {
    const ids = getSavedIds();
    const cols = getCustomCollections();
    setTimeout(() => {
      setSavedIds(ids);
      setCollections(cols);
    }, 0);
  }, []);

  const save = useCallback((id: string) => {
    saveRecipe(id);
    setSavedIds((prev) => new Set([...prev, id]));
  }, []);

  const unsave = useCallback((id: string) => {
    unsaveRecipe(id);
    setSavedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const addToCollection = useCallback((collectionId: string, recipeId: string) => {
    libAddTo(collectionId, recipeId);
    setCollections(getCustomCollections());
  }, []);

  const createCollection = useCallback((name: string): Collection => {
    const col = libCreate(name);
    setCollections(getCustomCollections());
    return col;
  }, []);

  const deleteCollection = useCallback((collectionId: string) => {
    libDelete(collectionId);
    setCollections(getCustomCollections());
  }, []);

  const doTrackView = useCallback((id: string) => {
    trackView(id);
  }, []);

  return (
    <LibraryContext.Provider value={{
      savedIds,
      collections,
      save,
      unsave,
      isSaved,
      addToCollection,
      createCollection,
      deleteCollection,
      trackView: doTrackView,
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
