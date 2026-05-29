"use client";

/**
 * Pfand Tracker — /pfand
 *
 * Persistent list of containers to return to the Pfandautomat.
 * Items are added automatically when a pantry item is discarded (if Pfand detected),
 * or manually here.
 */
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { PfandResult } from "@/lib/pfand";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PfandEntry {
  id: string;
  name: string;
  containerType: string;
  sizeMl: number | null;
  deposit: number;
  pfandType: string;
  returned: boolean;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSizeMl(name: string): number | null {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*(ml|mL|l|L|cl)/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  if (unit === "l") return Math.round(val * 1000);
  if (unit === "cl") return Math.round(val * 10);
  return Math.round(val);
}

function fmtSize(ml: number | null): string {
  if (!ml) return "";
  if (ml >= 1000) return `${(ml / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}L`;
  return `${ml}ml`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function pfandIcon(pfandType: string): string {
  if (pfandType === "crate") return "🧺";
  if (pfandType === "mehrweg") return "🍺";
  return "🥤";
}

const MANUAL_CONTAINER_TYPES = [
  "PET bottle",
  "Aluminium can",
  "Mehrweg glass bottle",
  "Mehrweg plastic bottle",
  "Bottle crate",
];

const DEPOSIT_BY_TYPE: Record<string, number> = {
  "PET bottle": 0.25,
  "Aluminium can": 0.25,
  "Mehrweg glass bottle": 0.08,
  "Mehrweg plastic bottle": 0.08,
  "Bottle crate": 1.5,
};

const PFAND_TYPE_BY_CONTAINER: Record<string, string> = {
  "PET bottle": "einweg",
  "Aluminium can": "einweg",
  "Mehrweg glass bottle": "mehrweg",
  "Mehrweg plastic bottle": "mehrweg",
  "Bottle crate": "crate",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PfandPage() {
  const [entries, setEntries] = useState<PfandEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addContainer, setAddContainer] = useState(MANUAL_CONTAINER_TYPES[0]);
  const [addSize, setAddSize] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setLoading(true);
      if (!user) { window.location.href = "/login"; return; }
      return supabase
        .from("pfand_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
    }).then((res) => {
      if (!res || cancelled) return;
      if (res.error) { toast.error("Failed to load Pfand items"); setLoading(false); return; }
      setEntries(
        (res.data ?? []).map((r) => ({
          id: r.id as string,
          name: r.name as string,
          containerType: r.container_type as string,
          sizeMl: r.size_ml as number | null,
          deposit: parseFloat(r.deposit as string),
          pfandType: r.pfand_type as string,
          returned: r.returned as boolean,
          createdAt: r.created_at as string,
        }))
      );
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => load(), [load]);

  // ── Mark returned ─────────────────────────────────────────────────────────
  const markReturned = async (entry: PfandEntry) => {
    setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, returned: true } : e));
    const { error } = await supabase.from("pfand_items").update({ returned: true }).eq("id", entry.id);
    if (error) {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, returned: false } : e));
      toast.error("Failed to update");
    }
  };

  // ── Clear returned ────────────────────────────────────────────────────────
  const clearReturned = async () => {
    const ids = entries.filter((e) => e.returned).map((e) => e.id);
    setEntries((prev) => prev.filter((e) => !e.returned));
    const { error } = await supabase.from("pfand_items").delete().in("id", ids);
    if (error) { toast.error("Failed to clear"); void load(); }
  };

  // ── Add manually ──────────────────────────────────────────────────────────
  const addManually = async () => {
    if (!addName.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const deposit = DEPOSIT_BY_TYPE[addContainer] ?? 0.25;
    const pfandType = PFAND_TYPE_BY_CONTAINER[addContainer] ?? "einweg";
    const sizeMl = parseSizeMl(addSize) ?? parseSizeMl(addName);

    const { data, error } = await supabase
      .from("pfand_items")
      .insert({
        user_id: user.id,
        name: addName.trim(),
        container_type: addContainer,
        size_ml: sizeMl,
        deposit,
        pfand_type: pfandType,
        returned: false,
      })
      .select()
      .single();

    if (error || !data) { toast.error("Failed to add item"); setSaving(false); return; }

    setEntries((prev) => [{
      id: data.id as string,
      name: data.name as string,
      containerType: data.container_type as string,
      sizeMl: data.size_ml as number | null,
      deposit: parseFloat(data.deposit as string),
      pfandType: data.pfand_type as string,
      returned: false,
      createdAt: data.created_at as string,
    }, ...prev]);

    setAddName("");
    setAddSize("");
    setAddContainer(MANUAL_CONTAINER_TYPES[0]);
    setShowAddForm(false);
    setSaving(false);
    toast.success("Added to Pfand tracker");
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const pending  = entries.filter((e) => !e.returned);
  const returned = entries.filter((e) => e.returned);
  const total    = pending.reduce((s, e) => s + e.deposit, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto" style={{ color: "var(--foreground)" }}>
      <Toaster position="bottom-center" />

      <h1 className="text-2xl font-bold mb-6">Pfand ♻️</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl px-5 py-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>To return</p>
          <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>
            {total.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="rounded-2xl px-5 py-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Items</p>
          <p className="text-2xl font-bold">{pending.length}</p>
        </div>
      </div>

      {/* Pending section */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
        Pending return
      </p>

      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>Loading…</p>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl py-10 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-sm font-medium">All returned!</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Nothing waiting to go back.</p>
        </div>
      ) : (
        <ul className="rounded-2xl overflow-hidden shadow-sm mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <AnimatePresence>
            {pending.map((entry) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                style={{ borderColor: "var(--border)" }}
              >
                {/* Icon */}
                <span className="text-2xl flex-shrink-0">{pfandIcon(entry.pfandType)}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {entry.containerType}
                    {entry.sizeMl ? ` · ${fmtSize(entry.sizeMl)}` : ""}
                    {" · added "}{fmtDate(entry.createdAt)}
                  </p>
                </div>

                {/* Deposit + button */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: "#22c55e" }}>
                    {entry.deposit.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </span>
                  <button
                    onClick={() => void markReturned(entry)}
                    className="text-xs px-3 py-1 rounded-xl border font-medium transition hover:bg-green-500 hover:text-white hover:border-green-500"
                    style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    Mark returned
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Add manually */}
      <AnimatePresence>
        {showAddForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-4 mb-4 overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Add manually</p>
              <button onClick={() => setShowAddForm(false)} style={{ color: "var(--muted)" }}><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Item name (e.g. Gerolsteiner 1.5L)"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={addContainer}
                  onChange={(e) => setAddContainer(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
                >
                  {MANUAL_CONTAINER_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Size (e.g. 500ml)"
                  value={addSize}
                  onChange={(e) => setAddSize(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
                />
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Deposit: <strong style={{ color: "#22c55e" }}>€{(DEPOSIT_BY_TYPE[addContainer] ?? 0.25).toFixed(2)}</strong>
              </p>
              <button
                onClick={() => void addManually()}
                disabled={!addName.trim() || saving}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Plus size={14} /> Add to tracker
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm border transition mb-6"
            style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "var(--surface)" }}
          >
            <Plus size={14} /> Add manually ↗
          </button>
        )}
      </AnimatePresence>

      {/* Returned section */}
      {returned.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Returned ({returned.length})
            </p>
            <button
              onClick={() => void clearReturned()}
              className="text-xs px-3 py-1 rounded-xl border transition hover:border-red-400 hover:text-red-400"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              Clear all
            </button>
          </div>
          <ul className="rounded-2xl overflow-hidden shadow-sm mb-8" style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: 0.5 }}>
            {returned.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                <Check size={16} className="flex-shrink-0 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through truncate">{entry.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {entry.containerType}{entry.sizeMl ? ` · ${fmtSize(entry.sizeMl)}` : ""}
                  </p>
                </div>
                <span className="text-xs line-through" style={{ color: "var(--muted)" }}>
                  €{entry.deposit.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Disposal guide */}
      <div className="rounded-2xl px-5 py-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Disposal guide (no Pfand)</h2>
        <ul className="grid grid-cols-1 gap-1 text-xs" style={{ color: "var(--muted)" }}>
          <li>🟩 <strong>Altglas grün</strong> — wine, oil, sauce jars (remove lid first)</li>
          <li>⬜ <strong>Altglas weiss</strong> — clear glass (sekt, white wine)</li>
          <li>🟫 <strong>Altglas braun</strong> — brown glass (red wine)</li>
          <li>🟡 <strong>Gelbe Tonne</strong> — Tetra Pak, cartons, oat/soy milk</li>
          <li>🔵 <strong>Blaue Tonne</strong> — clean cardboard &amp; paper</li>
          <li>⬛ <strong>Restmüll</strong> — ceramics, crystal, mirrors</li>
        </ul>
        <p className="mt-2 text-xs italic" style={{ color: "var(--muted)", opacity: 0.7 }}>
          No Altglas before 8 AM (noise rules). Metal lids → Gelbe Tonne.
        </p>
      </div>
    </main>
  );
}

// ── Exported helper: add a pfand entry from anywhere (e.g. pantry discard) ───
export async function addPfandEntry(
  name: string,
  pfand: PfandResult,
  sizeMl: number | null = null
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || pfand.pfandType === "none") return false;

  const { error } = await supabase.from("pfand_items").insert({
    user_id: user.id,
    name,
    container_type: pfand.containerType,
    size_ml: sizeMl,
    deposit: pfand.deposit,
    pfand_type: pfand.pfandType,
    returned: false,
  });

  return !error;
}
