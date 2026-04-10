"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { translateEnglishToGerman } from "@/lib/translate";

const DEFAULT_DISPLAY_NAME = "Atthuzhai";
const DEFAULT_ABOUT_EN =
  "This cookbook is my private, living recipe book. Some recipes are mine, some are family recipes from my mom, dad, or granny, and some are dishes I learned from people whose work taught me something important.";
const DEFAULT_ABOUT_DE =
  "Dieses Kochbuch ist mein privates, lebendiges Rezeptbuch. Manche Rezepte sind von mir, manche von meiner Familie, und manche habe ich von anderen Menschen gelernt.";

export default function AboutPage() {
  // The page starts in "view" mode so it reads like a profile page first.
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(DEFAULT_DISPLAY_NAME);
  const [aboutEn, setAboutEn] = useState(DEFAULT_ABOUT_EN);
  const [aboutDe, setAboutDe] = useState(DEFAULT_ABOUT_DE);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lang, setLang] = useState<"en" | "de">("en");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted || !user) return;

      setUserId(user.id);

      // About Me is stored separately from recipes so profile text can change without touching recipe rows.
      const { data } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();

      if (!isMounted || !data) return;

      setDisplayName(data.display_name || DEFAULT_DISPLAY_NAME);
      setAboutEn(data.about_me_en || DEFAULT_ABOUT_EN);
      setAboutDe(data.about_me_de || DEFAULT_ABOUT_DE);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!userId) {
      alert("Please log in first.");
      return;
    }

    setSaving(true);
    const autoAboutDe = aboutDe.trim() || (aboutEn.trim() ? await translateEnglishToGerman(aboutEn) : "");

    // Upsert means "create it if missing, otherwise update it".
    const { error } = await supabase.from("user_profiles").upsert({
      user_id: userId,
      display_name: displayName,
      about_me_en: aboutEn,
      about_me_de: autoAboutDe,
    });
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setAboutDe(autoAboutDe);
    setEditing(false);
  };

  const visibleAbout = lang === "de" && aboutDe.trim() ? aboutDe : aboutEn;

  return (
    <main className="container">
      <h1>About Me</h1>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>{displayName}</h2>
            <p style={{ marginBottom: 0 }}>This page introduces the person behind the cookbook.</p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="button" type="button" onClick={() => setLang("en")} style={{ background: lang === "en" ? "#f0d6c5" : undefined }}>
              EN
            </button>
            <button className="button" type="button" onClick={() => setLang("de")} style={{ background: lang === "de" ? "#f0d6c5" : undefined }}>
              DE
            </button>
            <button className="button button-primary" type="button" onClick={() => setEditing((current) => !current)}>
              {editing ? "Close Edit" : "Edit About Me"}
            </button>
          </div>
        </div>

        {!editing ? (
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{visibleAbout}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
            <textarea className="input" value={aboutEn} onChange={(event) => setAboutEn(event.target.value)} placeholder="About Me (EN)" />
            <textarea className="input" value={aboutDe} onChange={(event) => setAboutDe(event.target.value)} placeholder="About Me (DE, optional if auto-translate should fill it)" />
            <button className="button button-primary" type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving..." : "Save About Me"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
