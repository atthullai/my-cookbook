"use client";

/**
 * Supplements — /supplements
 *
 * Serving-based tracking (parallel to food): each supplement has a container of
 * N servings, a daily dose, and a reorder threshold. "Took today" decrements the
 * daily dose; when supply runs low you can add it to the shopping list. Excluded
 * from recipe sufficiency checks — these aren't ingredients.
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, ShoppingCart, X, AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import HubTabs from "@/components/HubTabs";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Supplement } from "@/types";
import {
  getSupplements, addSupplement, updateSupplement, deleteSupplement,
  takeSupplement, supplementDaysLeft, supplementNeedsReorder, takenToday,
} from "@/lib/supplements";
import { resolveIngredientImage } from "@/lib/ingredient-images";

const BLANK = {
  name: "", brand: "",
  servingsPerContainer: "" as number | "" ,
  servingsRemaining: "" as number | "",
  dailyServings: 1 as number,
  reorderAtDays: 7 as number,
  notes: "",
};

export default function SupplementsPage() {
  const [items, setItems] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setItems(await getSupplements()); }
    catch { /* table may not exist until migration is run */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditId(null); setForm({ ...BLANK }); setShowForm(true); };
  const openEdit = (s: Supplement) => {
    setEditId(s.id);
    setForm({
      name: s.name, brand: s.brand ?? "",
      servingsPerContainer: s.servingsPerContainer ?? "",
      servingsRemaining: s.servingsRemaining ?? "",
      dailyServings: s.dailyServings ?? 1,
      reorderAtDays: s.reorderAtDays ?? 7,
      notes: s.notes ?? "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      servingsPerContainer: form.servingsPerContainer === "" ? null : Number(form.servingsPerContainer),
      servingsRemaining: form.servingsRemaining === "" ? null : Number(form.servingsRemaining),
      dailyServings: Number(form.dailyServings) || 1,
      reorderAtDays: Number(form.reorderAtDays) || 7,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editId) await updateSupplement(editId, payload);
      else await addSupplement(payload);
      setShowForm(false);
      toast.success(editId ? "Updated" : "Added");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const onTake = async (s: Supplement) => {
    try { await takeSupplement(s.id); toast.success(`Took ${s.name}`); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const onReorder = async (s: Supplement) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");
      const { data: existing } = await supabase.from("shopping_list").select("name, checked").eq("user_id", user.id);
      const dup = (existing ?? []).filter((r: { checked: boolean }) => !r.checked)
        .some((r: { name: string }) => r.name.toLowerCase() === s.name.toLowerCase());
      if (dup) { toast("Already in your shopping list", { icon: "ℹ️" }); return; }
      const { error } = await supabase.from("shopping_list").insert({
        user_id: user.id, name: s.name, quantity: 1, unit: "", category: "other", checked: false, source: "supplement",
      });
      if (error) throw error;
      toast.success(`${s.name} added to shopping list`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try { await deleteSupplement(deleteId); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setDeleteId(null); }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
     <div className="max-w-2xl mx-auto px-5 pt-5 pb-24">
      <Toaster position="top-center" />
      <HubTabs />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 6px" }}>
        <h1 style={{ margin: 0 }}>Supplements</h1>
        <button type="button" className="button button-primary" onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} /> Add
        </button>
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 0 }}>
        Track vitamins, protein, omega and more by servings. Mark “Took today” to count down your supply.
      </p>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{editId ? "Edit supplement" : "New supplement"}</h3>
            <button type="button" aria-label="Close" onClick={() => setShowForm(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Name</span>
              <input className="input" value={form.name} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Omega-3" />
            </label>
            <label className="field"><span>Brand (optional)</span>
              <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
            <label className="field"><span>Servings / container</span>
              <input className="input" type="number" min={0} value={form.servingsPerContainer} onChange={(e) => setForm({ ...form, servingsPerContainer: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="60" /></label>
            <label className="field"><span>Servings remaining</span>
              <input className="input" type="number" min={0} value={form.servingsRemaining} onChange={(e) => setForm({ ...form, servingsRemaining: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="defaults to container" /></label>
            <label className="field"><span>Daily dose (servings)</span>
              <input className="input" type="number" min={0} step="0.5" value={form.dailyServings} onChange={(e) => setForm({ ...form, dailyServings: Number(e.target.value) })} /></label>
            <label className="field"><span>Reorder when ≤ (days)</span>
              <input className="input" type="number" min={0} value={form.reorderAtDays} onChange={(e) => setForm({ ...form, reorderAtDays: Number(e.target.value) })} /></label>
            <label className="field" style={{ gridColumn: "1 / -1" }}><span>Notes (optional)</span>
              <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          </div>
          <button type="button" className="button button-primary" onClick={save} style={{ width: "100%", marginTop: 14 }}>{editId ? "Save" : "Add supplement"}</button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--muted)" }}>
          No supplements yet. Tap <strong>Add</strong> to track your first.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((s) => {
            const days = supplementDaysLeft(s);
            const low = supplementNeedsReorder(s);
            const took = takenToday(s);
            return (
              <div key={s.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {(() => {
                  const src = resolveIngredientImage(s.name) ?? "/ingredients/supplements.png";
                  return (
                    <span style={{ width: 42, height: 42, borderRadius: "50%", background: "#f4f4f3", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }} aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" width={36} height={36} style={{ objectFit: "contain" }} loading="lazy" />
                    </span>
                  );
                })()}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{s.name}{s.brand ? <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {s.brand}</span> : null}</div>
                  <div style={{ fontSize: "0.84rem", color: "var(--muted)", marginTop: 2 }}>
                    {s.servingsRemaining != null ? `${s.servingsRemaining} left` : "—"}
                    {days != null && <> · ~{days} day{days === 1 ? "" : "s"}</>}
                    {` · ${s.dailyServings}/day`}
                  </div>
                  {low && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: "0.78rem", fontWeight: 600, color: "#b4540a" }}>
                      <AlertTriangle size={13} /> Running low — reorder soon
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button type="button" className="button" disabled={took} onClick={() => onTake(s)} title="Mark taken today" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.82rem" }}>
                    <Check size={14} /> {took ? "Taken" : "Took today"}
                  </button>
                  {low && (
                    <button type="button" className="button" onClick={() => onReorder(s)} aria-label="Add to shopping list" title="Add to shopping list" style={{ padding: "7px 9px" }}>
                      <ShoppingCart size={15} />
                    </button>
                  )}
                  <button type="button" className="button" onClick={() => openEdit(s)} aria-label="Edit" style={{ padding: "7px 9px" }}><Pencil size={15} /></button>
                  <button type="button" className="button" onClick={() => setDeleteId(s.id)} aria-label="Delete" style={{ padding: "7px 9px" }}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          open={!!deleteId}
          title="Delete supplement?"
          message="This removes it from your tracker."
          confirmLabel="Delete"
          onConfirm={onDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
     </div>
    </main>
  );
}
