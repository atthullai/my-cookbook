"use client";

// Onboarding wizard — asks dietary prefs, allergies, units, language, then
// marks the user onboarded. Reached automatically after first login (gated by
// PreferencesProvider). Requires an account.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/components/PreferencesProvider";
import {
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
  type AllergenKey,
  type AppLang,
  type DietKey,
  type UnitSystem,
} from "@/lib/preferences";

const STEPS = ["Diet", "Allergies", "Units & Language"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { updatePrefs, loaded, loggedIn, prefs } = usePreferences();

  const [step, setStep]           = useState(0);
  const [diets, setDiets]         = useState<DietKey[]>([]);
  const [allergies, setAllergies] = useState<AllergenKey[]>([]);
  const [units, setUnits]         = useState<UnitSystem>("metric");
  const [language, setLanguage]   = useState<AppLang>("en");
  const [saving, setSaving]       = useState(false);

  // Must be logged in; if already onboarded, leave.
  useEffect(() => {
    if (!loaded) return;
    if (!loggedIn) { router.replace("/login"); return; }
    if (prefs.onboarded) router.replace("/");
  }, [loaded, loggedIn, prefs.onboarded, router]);

  // Prefill from any existing prefs (e.g. revisiting). Syncs form state from
  // the async-loaded preferences once they arrive.
  useEffect(() => {
    if (!loaded) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setDiets(prefs.diets);
    setAllergies(prefs.allergies);
    setUnits(prefs.units);
    setLanguage(prefs.language);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loaded, prefs.diets, prefs.allergies, prefs.units, prefs.language]);

  const toggle = <T,>(arr: T[], v: T, set: (next: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const isLast = step === STEPS.length - 1;
  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  async function finish() {
    setSaving(true);
    await updatePrefs({ diets, allergies, units, language, onboarded: true });
    setSaving(false);
    router.replace("/");
  }

  async function skip() {
    setSaving(true);
    await updatePrefs({ onboarded: true });
    setSaving(false);
    router.replace("/");
  }

  const chip = (active: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", borderRadius: 999, cursor: "pointer",
    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--accent)" : "var(--surface)",
    color: active ? "#fff8f1" : "var(--foreground)",
    fontSize: "0.9rem", fontWeight: 600, transition: "all .15s ease",
  });

  return (
    <main className="container" style={{ maxWidth: 560, paddingTop: "2.5rem", paddingBottom: "4rem" }}>
      {/* Progress */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "var(--accent-strong)" }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <button onClick={skip} disabled={saving} style={{ fontSize: "0.8rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
            Skip
          </button>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "var(--surface-soft)", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", transition: "width .3s ease" }} />
        </div>
      </div>

      {/* Step 0 — Diet */}
      {step === 0 && (
        <section>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 6 }}>What do you eat?</h1>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            We&apos;ll tailor recommendations to your diet. Pick any that apply.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {DIET_OPTIONS.map((o) => (
              <button key={o.key} type="button" style={chip(diets.includes(o.key))}
                onClick={() => toggle(diets, o.key, setDiets)}>
                <span>{o.emoji}</span>{o.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 1 — Allergies */}
      {step === 1 && (
        <section>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 6 }}>Any allergies?</h1>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            We&apos;ll flag recipes that contain these ingredients.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ALLERGEN_OPTIONS.map((o) => (
              <button key={o.key} type="button" style={chip(allergies.includes(o.key))}
                onClick={() => toggle(allergies, o.key, setAllergies)}>
                <span>{o.emoji}</span>{o.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2 — Units & language */}
      {step === 2 && (
        <section>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 6 }}>Final touches</h1>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            How should we show measurements and language?
          </p>

          <p style={{ fontWeight: 600, marginBottom: 10 }}>Units</p>
          <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem" }}>
            {(["metric", "imperial"] as UnitSystem[]).map((u) => (
              <button key={u} type="button" style={chip(units === u)} onClick={() => setUnits(u)}>
                {u === "metric" ? "Metric (g, ml)" : "Imperial (oz, cups)"}
              </button>
            ))}
          </div>

          <p style={{ fontWeight: 600, marginBottom: 10 }}>Language</p>
          <div style={{ display: "flex", gap: 10 }}>
            {(["en", "de"] as AppLang[]).map((l) => (
              <button key={l} type="button" style={chip(language === l)} onClick={() => setLanguage(l)}>
                {l === "en" ? "🇬🇧 English" : "🇩🇪 Deutsch"}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Nav buttons */}
      <div style={{ display: "flex", gap: 12, marginTop: "2.5rem" }}>
        {step > 0 && (
          <button className="button button-soft" type="button" disabled={saving}
            onClick={() => setStep((s) => s - 1)} style={{ flex: "0 0 auto" }}>
            Back
          </button>
        )}
        <button className="button button-primary" type="button" disabled={saving} style={{ flex: 1 }}
          onClick={() => (isLast ? void finish() : setStep((s) => s + 1))}>
          {saving ? "Saving…" : isLast ? "Finish" : "Continue"}
        </button>
      </div>
    </main>
  );
}
