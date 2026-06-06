"use client";

// RecipeFeedback — per-user star rating (with public average) + a persistent
// personal note for a recipe. Self-contained: loads/saves via Supabase.

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function RecipeFeedback({ recipeId }: { recipeId: string }) {
  const rid = Number(recipeId);
  const [myStars, setMyStars] = useState(0);
  const [avg, setAvg]         = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [note, setNote]       = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    const [allRatings, myNote] = await Promise.all([
      supabase.from("recipe_ratings").select("user_id, stars").eq("recipe_id", rid),
      uid ? supabase.from("recipe_notes").select("note").eq("recipe_id", rid).eq("user_id", uid).maybeSingle()
          : Promise.resolve({ data: null }),
    ]);

    if (allRatings.data) {
      const rows = allRatings.data as { user_id: string; stars: number }[];
      const count = rows.length;
      const average = count ? rows.reduce((s, r) => s + r.stars, 0) / count : 0;
      setAvg({ average, count });
      if (uid) setMyStars(rows.find((r) => r.user_id === uid)?.stars ?? 0);
    }
    const n = (myNote.data as { note?: string } | null)?.note ?? "";
    setNote(n); setSavedNote(n);
  }, [rid]);

  useEffect(() => {
    if (!Number.isFinite(rid)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [rid, load]);

  const rate = async (stars: number) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { toast.error("Please log in to rate"); return; }
    const prev = myStars;
    setMyStars(stars); // optimistic
    const { error } = await supabase.from("recipe_ratings")
      .upsert({ user_id: auth.user.id, recipe_id: rid, stars }, { onConflict: "user_id,recipe_id" });
    if (error) { setMyStars(prev); toast.error("Couldn't save rating"); return; }
    void load();
  };

  const saveNote = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { toast.error("Please log in"); return; }
    setSavingNote(true);
    const { error } = await supabase.from("recipe_notes")
      .upsert({ user_id: auth.user.id, recipe_id: rid, note, updated_at: new Date().toISOString() }, { onConflict: "user_id,recipe_id" });
    setSavingNote(false);
    if (error) { toast.error("Couldn't save note"); return; }
    setSavedNote(note);
    toast.success("Note saved");
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Rating */}
      <div>
        <h3 style={{ marginBottom: 6 }}>Rating</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 2 }} role="group" aria-label="Rate this recipe">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => void rate(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, lineHeight: 1, padding: 0, color: n <= myStars ? "#e8a23d" : "var(--border)" }}>
                ★
              </button>
            ))}
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            {avg.count > 0 ? `${avg.average.toFixed(1)} from ${avg.count} rating${avg.count > 1 ? "s" : ""}` : "No ratings yet"}
          </span>
        </div>
      </div>

      {/* Personal note */}
      <div>
        <h3 style={{ marginBottom: 6 }}>Your notes</h3>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Stays attached to this recipe (e.g. &quot;too spicy — less chilli next time&quot;).</p>
        <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="Add a note after cooking…" style={{ width: "100%", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button className="button button-primary" type="button" onClick={() => void saveNote()}
            disabled={savingNote || note === savedNote}>
            {savingNote ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    </div>
  );
}
