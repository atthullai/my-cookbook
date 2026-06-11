"use client";

/**
 * LogSnackModal — log an ad-hoc snack / meal that deducts several pantry items
 * at once (e.g. "2 brioche slices, 3 eggs, 1 tomato, ½ onion") plus optional
 * supplements (e.g. 1 omega capsule). Reuses the FIFO deduction server action.
 * Can re-log a saved quick-combo and save the current snack as a new combo.
 */
import { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { logSnack } from "@/app/actions/consumption";
import { getSupplements } from "@/lib/supplements";
import { getQuickCombos, saveQuickCombo } from "@/lib/quick-combos";
import type { Supplement, QuickCombo, ConsumptionItem, ConsumptionSupplement } from "@/types";

interface PantryRow {
  id: string;
  name: string;
  unit: string | null;
}

interface FoodLine extends ConsumptionItem {
  unitProfile?: Record<string, number> | null;
}

const UNIT_OPTIONS = ["whole", "slice", "piece", "g", "ml", "cup", "tbsp", "tsp"];

export default function LogSnackModal({ onClose, onLogged }: { onClose: () => void; onLogged?: () => void }) {
  const [pantry, setPantry] = useState<PantryRow[]>([]);
  const [supps, setSupps] = useState<Supplement[]>([]);
  const [combos, setCombos] = useState<QuickCombo[]>([]);

  const [lines, setLines] = useState<FoodLine[]>([]);
  const [suppLines, setSuppLines] = useState<ConsumptionSupplement[]>([]);
  const [label, setLabel] = useState("");
  const [asCombo, setAsCombo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("pantry_items")
          .select("id, name, unit")
          .order("name", { ascending: true });
        setPantry((data ?? []) as PantryRow[]);
      } catch { /* ignore */ }
      try { setSupps(await getSupplements()); } catch { /* table may not exist yet */ }
      try { setCombos(await getQuickCombos()); } catch { /* table may not exist yet */ }
    })();
  }, []);

  const pantryByName = useMemo(() => new Map(pantry.map((p) => [p.name, p])), [pantry]);

  const addFood = (name: string) => {
    if (!name) return;
    const row = pantryByName.get(name);
    setLines((ls) => [...ls, {
      ref: name, name,
      qty: 1,
      unit: row?.unit || "whole",
      unitProfile: null,
    }]);
  };
  const updateLine = (i: number, patch: Partial<FoodLine>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const addSupp = (id: string) => {
    const s = supps.find((x) => x.id === id);
    if (!s || suppLines.some((sl) => sl.id === id)) return;
    setSuppLines((sl) => [...sl, { id: s.id, name: s.name, servings: s.dailyServings || 1 }]);
  };
  const updateSupp = (i: number, servings: number) =>
    setSuppLines((sl) => sl.map((s, idx) => (idx === i ? { ...s, servings } : s)));
  const removeSupp = (i: number) => setSuppLines((sl) => sl.filter((_, idx) => idx !== i));

  const loadCombo = (c: QuickCombo) => {
    setLines(c.items.map((it) => ({ ...it, unitProfile: null })));
    setSuppLines(c.supplements ?? []);
    setLabel(c.name);
  };

  const canSubmit = lines.length > 0 || suppLines.length > 0;

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const { pfandCreated } = await logSnack({
        label: label || undefined,
        items: lines.map((l) => ({ ref: l.ref, name: l.name, qty: l.qty, unit: l.unit, unitProfile: l.unitProfile })),
        supplements: suppLines,
      });
      if (asCombo && label.trim()) {
        const comboItems: ConsumptionItem[] = lines.map((l) => ({ ref: l.ref, name: l.name, qty: l.qty, unit: l.unit }));
        await saveQuickCombo(label.trim(), comboItems, suppLines);
      }
      toast.success("Logged" + (asCombo && label.trim() ? " & saved combo" : ""));
      if (pfandCreated.length) toast(`${pfandCreated.length} Pfand deposit(s) added`, { icon: "♻️" });
      onLogged?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Could not log snack");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Log a snack</h3>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "6px 0 14px" }}>
          Pick what you ate — it’s deducted from your pantry. Add supplements too.
        </p>

        {combos.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="modal-label" style={{ marginBottom: 6 }}>Quick combos</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {combos.map((c) => (
                <button key={c.id} type="button" className="button" style={{ fontSize: "0.82rem", padding: "5px 12px" }} onClick={() => loadCombo(c)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Food lines */}
        <div className="modal-label" style={{ marginBottom: 6 }}>Food</div>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600 }}>{l.name}</span>
            <input className="input" type="number" min={0} step="0.5" value={l.qty}
              onChange={(e) => updateLine(i, { qty: parseFloat(e.target.value) || 0 })}
              style={{ width: 70 }} aria-label={`${l.name} quantity`} />
            <select className="input" value={l.unit} onChange={(e) => updateLine(i, { unit: e.target.value })} style={{ width: 92 }} aria-label={`${l.name} unit`}>
              {[...new Set([l.unit, ...UNIT_OPTIONS])].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button type="button" aria-label="Remove" onClick={() => removeLine(i)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <select className="input" value="" onChange={(e) => { addFood(e.target.value); e.currentTarget.value = ""; }} style={{ width: "100%", marginTop: 4 }}>
          <option value="">+ Add food from pantry…</option>
          {pantry.filter((p) => !lines.some((l) => l.ref === p.name)).map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>

        {/* Supplement lines */}
        {supps.length > 0 && (
          <>
            <div className="modal-label" style={{ margin: "16px 0 6px" }}>Supplements</div>
            {suppLines.map((s, i) => (
              <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600 }}>{s.name}</span>
                <input className="input" type="number" min={0} step="0.5" value={s.servings}
                  onChange={(e) => updateSupp(i, parseFloat(e.target.value) || 0)}
                  style={{ width: 70 }} aria-label={`${s.name} servings`} />
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", width: 92 }}>serving(s)</span>
                <button type="button" aria-label="Remove" onClick={() => removeSupp(i)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <select className="input" value="" onChange={(e) => { addSupp(e.target.value); e.currentTarget.value = ""; }} style={{ width: "100%", marginTop: 4 }}>
              <option value="">+ Add supplement…</option>
              {supps.filter((s) => !suppLines.some((sl) => sl.id === s.id)).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </>
        )}

        {/* Name + save-as-combo */}
        <div style={{ marginTop: 16 }}>
          <input className="input" type="text" placeholder="Name (optional) — e.g. Breakfast snack" value={label} onChange={(e) => setLabel(e.target.value)} style={{ width: "100%" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: "0.86rem", color: "var(--muted)", cursor: "pointer" }}>
            <input type="checkbox" checked={asCombo} disabled={!label.trim()} onChange={(e) => setAsCombo(e.target.checked)} />
            Save as a quick combo to re-log later
          </label>
        </div>

        <button type="button" className="button button-primary" onClick={submit} disabled={!canSubmit || saving} style={{ width: "100%", marginTop: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Plus size={16} /> {saving ? "Logging…" : "Log it"}
        </button>
      </div>
    </div>
  );
}
