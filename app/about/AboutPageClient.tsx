"use client";

// PROFILE (account-level only, per spec §5.9 / §11):
// avatar, name, bio, "My recipes" / "Created" tabs, and a gear → Settings.
// Deliberately NOT social — no followers/following, posts, or activity feed.

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Settings, Pencil, Check, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import RecipeCard from "@/components/RecipeCard";
import type { RecipeSummary } from "@/types";

interface Profile { display_name: string; bio: string; avatar_url: string }
const EMPTY: Profile = { display_name: "", bio: "", avatar_url: "" };

export default function AboutPageClient() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId]   = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [draft, setDraft]     = useState<Profile>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState<"saved" | "created">("created");
  const [created, setCreated] = useState<RecipeSummary[]>([]);
  const [saved, setSaved]     = useState<RecipeSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const [profileRes, createdRes, savedIdsRes] = await Promise.all([
        supabase.from("user_profiles").select("display_name, bio, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("saved_recipes").select("recipe_id").eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        const p: Profile = {
          display_name: (profileRes.data.display_name as string) ?? "",
          bio: (profileRes.data.bio as string) ?? "",
          avatar_url: (profileRes.data.avatar_url as string) ?? "",
        };
        setProfile(p); setDraft(p);
      }

      setCreated(toRecipeSummaries(mapRecipeRows(createdRes.data ?? [])));

      const savedIds = (savedIdsRes.data ?? []).map((r) => r.recipe_id).filter(Boolean);
      if (savedIds.length > 0) {
        const { data: savedRows } = await supabase.from("recipes").select("*").in("id", savedIds);
        setSaved(toRecipeSummaries(mapRecipeRows(savedRows ?? [])));
      }
      setLoading(false);
    };
    void load();
  }, []);

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert({
        id: userId,
        display_name: draft.display_name,
        bio: draft.bio,
        avatar_url: draft.avatar_url,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setProfile({ ...draft });
      setEditing(false);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const name = profile.display_name || "My Cookbook";
  const initial = name.trim().charAt(0).toUpperCase() || "C";
  const list = tab === "saved" ? saved : created;

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="max-w-screen-lg mx-auto px-5 py-10">

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <div className="flex items-start gap-5 flex-wrap">
                <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-3xl font-bold"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--saffron))", color: "#fff" }}>
                  {profile.avatar_url
                    ? <Image unoptimized src={profile.avatar_url} alt={name} width={88} height={88} className="w-full h-full object-cover" />
                    : initial}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--foreground)" }}>{name}</h1>
                  {profile.bio && <p className="text-sm mt-1 max-w-xl" style={{ color: "var(--muted)" }}>{profile.bio}</p>}
                  <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                    <strong style={{ color: "var(--foreground)" }}>{created.length}</strong> created
                    {" · "}<strong style={{ color: "var(--foreground)" }}>{saved.length}</strong> saved
                  </p>
                </div>
                {userId && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setDraft({ ...profile }); setEditing(true); }}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium"
                      style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface)" }}>
                      <Pencil size={14} /> Edit Profile
                    </button>
                    <Link href="/settings" aria-label="Settings"
                      className="flex items-center justify-center p-2 rounded-xl"
                      style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "var(--surface)" }}>
                      <Settings size={16} />
                    </Link>
                  </div>
                )}
              </div>

              {/* ── Edit form ── */}
              {editing && (
                <div className="rounded-2xl p-5 mt-5 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Edit Profile</h3>
                  <input value={draft.display_name} onChange={(e) => setDraft((p) => ({ ...p, display_name: e.target.value }))}
                    placeholder="Name" className="input w-full" />
                  <textarea value={draft.bio} onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Bio" rows={3} className="input w-full" />
                  <input value={draft.avatar_url} onChange={(e) => setDraft((p) => ({ ...p, avatar_url: e.target.value }))}
                    placeholder="Avatar image URL (optional)" className="input w-full" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void saveProfile()} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                      style={{ background: "var(--accent)", color: "#fff" }}>
                      <Check size={14} /> {saving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" onClick={() => { setEditing(false); setDraft({ ...profile }); }}
                      className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--muted)" }}>
                      <X size={14} className="inline mr-1" />Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tabs ── */}
              <div className="flex gap-6 border-b mt-8 mb-6" style={{ borderColor: "var(--border)" }}>
                {([["created", "Created"], ["saved", "My recipes"]] as const).map(([k, labelText]) => (
                  <button key={k} type="button" onClick={() => setTab(k)}
                    className="pb-3 text-sm font-semibold"
                    style={{
                      color: tab === k ? "var(--accent)" : "var(--muted)",
                      borderBottom: `2px solid ${tab === k ? "var(--accent)" : "transparent"}`,
                      marginBottom: -1,
                    }}>
                    {labelText}
                  </button>
                ))}
              </div>

              {/* ── Recipe grid ── */}
              {list.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
                  <p className="text-3xl mb-2">📖</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {tab === "created" ? "You haven't created any recipes yet." : "No saved recipes yet."}
                  </p>
                  <Link href={tab === "created" ? "/add" : "/discover"}
                    className="inline-block mt-4 px-5 py-2 rounded-xl text-sm font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    {tab === "created" ? "+ Add a recipe" : "Discover recipes"}
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  {list.map((r) => <RecipeCard key={r.id} recipe={r} />)}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
