"use client";

/**
 * EquipmentPicker
 * Modal / overlay that lets the user browse or search all 56 canonical equipment items
 * by category, then tap to select/deselect.
 *
 * Usage:
 *   <EquipmentPicker
 *     selected={equipment}          // EquipmentDraft[]
 *     onChange={setEquipment}       // (items: EquipmentDraft[]) => void
 *   />
 */

import Image from "next/image";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EQUIPMENT_LIBRARY,
  EQUIPMENT_CATEGORIES,
  findEquipmentItem,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment-library";
import type { EquipmentDraft } from "@/lib/recipe-types";
import AppIcon from "@/components/AppIcon";

// ─── helpers ─────────────────────────────────────────────────────────────────

function itemToEquipmentDraft(item: EquipmentItem): EquipmentDraft {
  return { label_en: item.name_en, label_de: item.name_de, image: item.image };
}

function draftKey(d: EquipmentDraft) {
  return d.label_en.toLowerCase().trim();
}

// ─── EquipmentCard (inside modal) ────────────────────────────────────────────

function EquipmentCard({
  item,
  selected,
  onToggle,
}: {
  item: EquipmentItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 12,
        overflow: "hidden",
        border: selected ? "3px solid var(--color-primary, #e67e22)" : "3px solid transparent",
        cursor: "pointer",
        background: "#ffffff",
        padding: 0,
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: selected ? "0 0 0 2px var(--color-primary, #e67e22)" : "none",
      }}
      title={item.name_en}
    >
      <Image
        src={item.image}
        alt={item.name_en}
        fill
        sizes="(max-width: 600px) 28vw, 120px"
        style={{ objectFit: "contain", padding: 10 }}
        unoptimized
      />
      {/* overlay label */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "4px 4px 5px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
          color: "#fff",
          fontSize: 10,
          fontWeight: 600,
          lineHeight: 1.25,
          textAlign: "center",
          wordBreak: "break-word",
        }}
      >
        {item.name_en}
      </div>
      {/* check badge */}
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--color-primary, #e67e22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ✓
        </div>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EquipmentPicker({
  selected,
  onChange,
}: {
  selected: EquipmentDraft[];
  onChange: (items: EquipmentDraft[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory | "all">("all");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  // Build selected key set — include both stored label_en AND canonical library name
  // so old labels (e.g. "Mixer Grinder / Blender") still highlight the right card.
  const selectedKeys = useMemo(() => {
    const keys = new Set(selected.map(draftKey));
    for (const draft of selected) {
      const canonical = findEquipmentItem(draft.label_en);
      if (canonical) keys.add(canonical.name_en.toLowerCase().trim());
    }
    return keys;
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return EQUIPMENT_LIBRARY.filter((item) => {
      const catMatch = activeCategory === "all" || item.category === activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        item.name_en.toLowerCase().includes(q) ||
        item.name_de.toLowerCase().includes(q) ||
        item.synonyms.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory]);

  function toggle(item: EquipmentItem) {
    const key = item.name_en.toLowerCase().trim();
    if (selectedKeys.has(key)) {
      onChange(selected.filter((d) => draftKey(d) !== key));
    } else {
      onChange([...selected, itemToEquipmentDraft(item)]);
    }
  }

  function removeSelected(draft: EquipmentDraft) {
    onChange(selected.filter((d) => draftKey(d) !== draftKey(draft)));
  }

  return (
    <div>
      {/* ── Selected chips + open button ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {selected.map((draft) => (
          <SelectedChip key={draftKey(draft)} draft={draft} onRemove={() => removeSelected(draft)} />
        ))}
        <button
          type="button"
          className="button"
          onClick={() => setOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <AppIcon name="add" size={16} />
          {selected.length === 0 ? "Add Equipment" : "Edit Equipment"}
        </button>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 1000,
              }}
            />

            {/* sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: "90dvh",
                background: "var(--surface, #fffaf0)",
                borderRadius: "20px 20px 0 0",
                zIndex: 1001,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* header */}
              <div
                style={{
                  padding: "16px 16px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <h3 style={{ flex: 1, margin: 0, fontSize: 18 }}>Choose Equipment</h3>
                <button
                  type="button"
                  className="button"
                  onClick={() => setOpen(false)}
                  style={{ padding: "6px 14px" }}
                >
                  Done
                </button>
              </div>

              {/* search */}
              <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
                <input
                  ref={searchRef}
                  className="input"
                  placeholder="Search equipment…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ width: "100%", marginBottom: 0 }}
                />
              </div>

              {/* category tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  padding: "10px 16px 0",
                  flexShrink: 0,
                  scrollbarWidth: "none",
                }}
              >
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as EquipmentCategory | "all")}
                    style={{
                      flexShrink: 0,
                      padding: "5px 12px",
                      borderRadius: 20,
                      border: activeCategory === cat.id ? "none" : "1px solid var(--border, rgba(83,55,38,0.22))",
                      cursor: "pointer",
                      fontWeight: activeCategory === cat.id ? 700 : 400,
                      background: activeCategory === cat.id ? "var(--accent, #b85d36)" : "var(--oat, #ead9bd)",
                      color: activeCategory === cat.id ? "#fff" : "var(--foreground, #2d2018)",
                      fontSize: 13,
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* grid */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px 16px 32px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                  gap: 10,
                  alignContent: "start",
                }}
              >
                {filtered.length === 0 && (
                  <p style={{ gridColumn: "1 / -1", color: "#999", textAlign: "center", marginTop: 32 }}>
                    No equipment found for &ldquo;{query}&rdquo;
                  </p>
                )}
                {filtered.map((item) => (
                  <EquipmentCard
                    key={item.name_en}
                    item={item}
                    selected={selectedKeys.has(item.name_en.toLowerCase().trim())}
                    onToggle={() => toggle(item)}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SelectedChip ─────────────────────────────────────────────────────────────

function SelectedChip({
  draft,
  onRemove,
}: {
  draft: EquipmentDraft;
  onRemove: () => void;
}) {
  // Prefer the canonical library icon (authoritative); fall back to any stored image.
  const imageSrc = findEquipmentItem(draft.label_en)?.image ?? draft.image ?? null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: imageSrc ? "3px 10px 3px 3px" : "6px 10px",
        background: "var(--oat, #ead9bd)",
        border: "1px solid var(--border, rgba(83,55,38,0.22))",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        color: "var(--foreground, #2d2018)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {imageSrc && (
        <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative", background: "#fff" }}>
          <Image src={imageSrc} alt={draft.label_en} fill style={{ objectFit: "contain", padding: 2 }} unoptimized />
        </div>
      )}
      <span>{draft.label_en}</span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: "var(--muted, #6f5747)",
          fontSize: 18,
          lineHeight: 1,
          marginLeft: 2,
        }}
        aria-label={`Remove ${draft.label_en}`}
      >
        ×
      </button>
    </div>
  );
}
