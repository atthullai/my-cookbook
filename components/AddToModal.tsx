"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, CalendarDays, ShoppingCart, FolderHeart, Plus } from "lucide-react";
import { useLibrary } from "@/components/LibraryProvider";
import CreateCollectionModal from "@/components/CreateCollectionModal";

interface AddToModalProps {
  recipeId: string;
  recipeTitle: string;
  onClose: () => void;
}

export default function AddToModal({ recipeId, recipeTitle, onClose }: AddToModalProps) {
  const router = useRouter();
  const { collections, addToCollection } = useLibrary();
  const [showCollections, setShowCollections] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleAddToCollection(colId: string) {
    addToCollection(colId, recipeId);
    setAdded((prev) => ({ ...prev, [colId]: true }));
  }

  if (showCreateCollection) {
    return (
      <CreateCollectionModal
        onClose={() => setShowCreateCollection(false)}
        onCreated={(col) => {
          addToCollection(col.id, recipeId);
          setAdded((prev) => ({ ...prev, [col.id]: true }));
          setShowCreateCollection(false);
        }}
      />
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel add-to-modal" ref={ref}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Add to…</div>
            <div className="modal-subtitle">{recipeTitle}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="add-to-options">
          {/* Meal Planner */}
          <button
            className="add-to-option"
            onClick={() => { onClose(); router.push("/planner"); }}
          >
            <span className="add-to-option-icon"><CalendarDays size={18} /></span>
            <div className="add-to-option-text">
              <span className="add-to-option-label">Meal Planner</span>
              <span className="add-to-option-desc">Schedule this recipe for a day</span>
            </div>
          </button>

          {/* Shopping List */}
          <button
            className="add-to-option"
            onClick={() => { onClose(); router.push("/shopping"); }}
          >
            <span className="add-to-option-icon"><ShoppingCart size={18} /></span>
            <div className="add-to-option-text">
              <span className="add-to-option-label">Shopping List</span>
              <span className="add-to-option-desc">Add ingredients to your list</span>
            </div>
          </button>

          {/* Collections */}
          <button
            className="add-to-option"
            onClick={() => setShowCollections((v) => !v)}
          >
            <span className="add-to-option-icon"><FolderHeart size={18} /></span>
            <div className="add-to-option-text">
              <span className="add-to-option-label">Collections</span>
              <span className="add-to-option-desc">Organise into a folder</span>
            </div>
            <span className="add-to-option-chevron">{showCollections ? "▴" : "▾"}</span>
          </button>

          {showCollections && (
            <div className="add-to-collections">
              {collections.length === 0 && (
                <p className="add-to-empty">No collections yet.</p>
              )}
              {collections.map((col) => (
                <button
                  key={col.id}
                  className={`add-to-collection-item${added[col.id] ? " added" : ""}`}
                  onClick={() => handleAddToCollection(col.id)}
                  disabled={added[col.id]}
                >
                  <FolderHeart size={14} />
                  <span>{col.name}</span>
                  {added[col.id] && <span className="add-to-check">✓</span>}
                </button>
              ))}
              <button
                className="add-to-collection-item add-to-new"
                onClick={() => setShowCreateCollection(true)}
              >
                <Plus size={14} />
                <span>New collection</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
