"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Collection } from "@/lib/library";
import { useLibrary } from "@/components/LibraryProvider";

interface CreateCollectionModalProps {
  onClose: () => void;
  onCreated?: (col: Collection) => void;
}

export default function CreateCollectionModal({ onClose, onCreated }: CreateCollectionModalProps) {
  const { createCollection } = useLibrary();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const col = createCollection(trimmed);
    onCreated?.(col);
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel create-collection-modal" ref={ref}>
        <div className="modal-header">
          <div className="modal-title">New Collection</div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-label" htmlFor="col-name">Collection name</label>
          <input
            id="col-name"
            ref={inputRef}
            className="modal-input"
            type="text"
            placeholder="e.g. Weekend Favourites"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            maxLength={60}
          />
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="modal-btn modal-btn--primary"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
