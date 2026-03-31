"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AboutPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Saran");
  const [aboutEn, setAboutEn] = useState(
    "This cookbook is my private, living recipe book. Some recipes are mine, some are family recipes from my mom, dad, or granny, and some are dishes I learned from people whose work taught me something important."
  );
  const [aboutDe, setAboutDe] = useState(
    "Dieses Kochbuch ist mein privates, lebendiges Rezeptbuch. Manche Rezepte sind von mir, manche von meiner Familie, und manche habe ich von anderen Menschen gelernt."
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted || !user) return;

      setUserId(user.id);

      const { data } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();

      if (!isMounted || !data) return;

      setDisplayName(data.display_name || "Saran");
      setAboutEn(data.about_me_en || aboutEn);
      setAboutDe(data.about_me_de || aboutDe);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [aboutDe, aboutEn]);

  const handleSave = async () => {
    if (!userId) {
      alert("Please log in first.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("user_profiles").upsert({
      user_id: userId,
      display_name: displayName,
      about_me_en: aboutEn,
      about_me_de: aboutDe,
    });
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }
  };

  return (
    <main className="container">
      <h1>About Me</h1>
      <div className="card">
        <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
        <textarea className="input" value={aboutEn} onChange={(event) => setAboutEn(event.target.value)} placeholder="About Me (EN)" />
        <textarea className="input" value={aboutDe} onChange={(event) => setAboutDe(event.target.value)} placeholder="About Me (DE)" />
        <button className="button button-primary" type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving..." : "Save About Me"}
        </button>
      </div>
    </main>
  );
}
