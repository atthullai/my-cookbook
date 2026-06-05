"use client";

// Settings — edit preferences (diet, allergies, units, language, notifications)
// and sign out. Linked from the header user menu.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { usePreferences } from "@/components/PreferencesProvider";
import {
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
  type AllergenKey,
  type AppLang,
  type DietKey,
  type UnitSystem,
} from "@/lib/preferences";

export default function SettingsPage() {
  const router = useRouter();
  const { prefs, loaded, loggedIn, updatePrefs } = usePreferences();

  useEffect(() => {
    if (loaded && !loggedIn) router.replace("/login");
  }, [loaded, loggedIn, router]);

  const [saving, setSaving] = useState(false);

  const save = async (patch: Parameters<typeof updatePrefs>[0], label: string) => {
    setSaving(true);
    await updatePrefs(patch);
    setSaving(false);
    toast.success(`${label} updated`);
  };

  const toggleInArray = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const chip = (active: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 14px", borderRadius: 999, cursor: "pointer",
    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--accent)" : "var(--surface)",
    color: active ? "#fff8f1" : "var(--foreground)",
    fontSize: "0.85rem", fontWeight: 600, transition: "all .15s ease",
  });

  const sectionStyle: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem",
  };

  return (
    <main className="container" style={{ maxWidth: 620, paddingTop: "2rem", paddingBottom: "4rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem" }}>Settings</h1>

      {/* Diet */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Dietary preferences</p>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 12 }}>Used to tailor recommendations.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DIET_OPTIONS.map((o) => (
            <button key={o.key} type="button" style={chip(prefs.diets.includes(o.key))} disabled={saving}
              onClick={() => save({ diets: toggleInArray(prefs.diets, o.key) as DietKey[] }, "Diet")}>
              <span>{o.emoji}</span>{o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Allergies & restrictions</p>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: 12 }}>Recipes with these are flagged.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALLERGEN_OPTIONS.map((o) => (
            <button key={o.key} type="button" style={chip(prefs.allergies.includes(o.key))} disabled={saving}
              onClick={() => save({ allergies: toggleInArray(prefs.allergies, o.key) as AllergenKey[] }, "Allergies")}>
              <span>{o.emoji}</span>{o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Units */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Units</p>
        <div style={{ display: "flex", gap: 8 }}>
          {(["metric", "imperial"] as UnitSystem[]).map((u) => (
            <button key={u} type="button" style={chip(prefs.units === u)} disabled={saving}
              onClick={() => save({ units: u }, "Units")}>
              {u === "metric" ? "Metric (g, ml)" : "Imperial (oz, cups)"}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Language</p>
        <div style={{ display: "flex", gap: 8 }}>
          {(["en", "de"] as AppLang[]).map((l) => (
            <button key={l} type="button" style={chip(prefs.language === l)} disabled={saving}
              onClick={() => save({ language: l }, "Language")}>
              {l === "en" ? "🇬🇧 English" : "🇩🇪 Deutsch"}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontWeight: 700, marginBottom: 2 }}>Notifications</p>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Meal reminders & grocery alerts.</p>
          </div>
          <button type="button" disabled={saving}
            onClick={() => save({ notificationsEnabled: !prefs.notificationsEnabled }, "Notifications")}
            aria-pressed={prefs.notificationsEnabled}
            style={{
              width: 48, height: 28, borderRadius: 999, border: "none", cursor: "pointer", position: "relative",
              background: prefs.notificationsEnabled ? "var(--accent)" : "var(--border)", transition: "background .15s ease",
            }}>
            <span style={{
              position: "absolute", top: 3, left: prefs.notificationsEnabled ? 23 : 3,
              width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .15s ease",
            }} />
          </button>
        </div>
      </div>

      {/* Account */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Account</p>
        <button type="button" className="button" onClick={() => void logout()}
          style={{ color: "var(--berry)", borderColor: "var(--border)" }}>
          Sign out
        </button>
      </div>
    </main>
  );
}
