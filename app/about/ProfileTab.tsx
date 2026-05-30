"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import type { CuisineOrigin } from "@/types";
import type { CuisineBreakdown, TagBreakdown } from "./page";

// Exact hex colors per cuisine origin from the design reference
const CUISINE_PILL_COLORS: Record<string, string> = {
  "Andhra / Telangana": "#ef5350",
  "Karnataka":          "#66bb6a",
  "Tamil Nadu":         "#ffa726",
  "Kerala":             "#26a69a",
  "North Indian":       "#ab47bc",
  "French":             "#ffd54f",
  "World Kitchen":      "#b0bec5",
  "German":             "#8d6e63",
  "Rajasthani":         "#ffa726",
  "Bengali":            "#42a5f5",
  "Goan":               "#26c6da",
  "Maharashtrian":      "#ef5350",
  "Gujarati":           "#ffca28",
  "Austrian":           "#b0bec5",
  "Italian":            "#ef5350",
  "Chinese":            "#ef9a9a",
  "Japanese":           "#f48fb1",
  "Thai":               "#a5d6a7",
  "Mexican":            "#ff8a65",
  "American":           "#90caf9",
};

interface UserProfile {
  display_name: string;
  bio: string;
  location: string;
  cook_style: string;
  avatar_url: string;
}

interface Props {
  initialProfile: UserProfile;
  userId: string | null;
  stats: { recipes: number; cuisines: number };
  cuisineBreakdown: CuisineBreakdown[];
  tagBreakdown: TagBreakdown;
  pantryCount: number;
  joinedYear: number | null;
}

const EASE_WARM: [number, number, number, number] = [0.25, 0.1, 0.4, 1.0];

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
        <span>{label}</span>
        <span style={{ color }}>{count} {count === 1 ? "recipe" : "recipes"}</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Cuisine pill ──────────────────────────────────────────────────────────────
function CuisinePill({ origin, count }: { origin: string; count: number }) {
  let theme: ReturnType<typeof getCuisineTheme> | null = null;
  try { theme = getCuisineTheme(origin as CuisineOrigin); } catch { /* unmapped */ }

  const color = CUISINE_PILL_COLORS[origin] ?? "var(--accent)";

  return (
    <Link
      href={`/recipes?cuisine=${encodeURIComponent(origin)}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-opacity hover:opacity-80"
      style={{
        background: `${color}18`,
        color,
        borderColor: `${color}44`,
      }}
    >
      {theme?.emoji ?? "🍽"} {theme?.label ?? origin}
      <span className="opacity-60">· {count}</span>
    </Link>
  );
}

export default function ProfileTab({ initialProfile, userId, stats, cuisineBreakdown, tagBreakdown, pantryCount, joinedYear }: Props) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [draft,   setDraft]   = useState<UserProfile>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id:           userId,
          display_name: draft.display_name,
          bio:          draft.bio,
          location:     draft.location,
          cook_style:   draft.cook_style,
          avatar_url:   draft.avatar_url,
          updated_at:   new Date().toISOString(),
        });
      if (error) throw error;
      setProfile({ ...draft });
      setEditing(false);
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasCuisines = cuisineBreakdown.length > 0;
  const hasTagData  = stats.recipes > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_WARM }}
      className="grid gap-6"
      style={{ gridTemplateColumns: editing ? "1fr" : "clamp(240px,28%,280px) 1fr" }}
    >

      {/* ── Sidebar ── */}
      {!editing && (
        <div className="flex flex-col gap-4">
          {/* Profile card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Card header */}
            <div
              className="px-5 pt-5 pb-4 text-center"
              style={{
                background: "linear-gradient(135deg, var(--parchment), var(--surface-strong))",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {/* Avatar */}
              <div
                className="w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-2.5 overflow-hidden text-2xl"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--saffron))",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  border: "2px solid rgba(212,168,83,0.3)",
                }}
              >
                {profile.avatar_url ? (
                  <Image unoptimized src={profile.avatar_url} alt="avatar" width={60} height={60} className="w-full h-full object-cover" />
                ) : (
                  "👩‍🍳"
                )}
              </div>

              {/* Name */}
              <p className="font-bold text-base leading-tight" style={{ color: "var(--foreground)" }}>
                {profile.display_name || (userId ? "Your Cookbook" : "My Cookbook")}
              </p>

              {/* Handle · location */}
              <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
                {profile.display_name
                  ? `@${profile.display_name.toLowerCase().replace(/\s+/g, "")}${profile.location ? ` · ${profile.location}` : ""}`
                  : profile.location || "@cookbook"}
              </p>

              {/* Role badge */}
              <span
                className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                style={{
                  background: "rgba(212,168,83,.1)",
                  borderColor: "rgba(212,168,83,.2)",
                  color: "var(--saffron)",
                }}
              >
                {profile.cook_style || "🏡 Home cook · Heirloom keeper"}
              </span>
            </div>

            {/* Meta rows */}
            <div className="px-4 py-1">
              {[
                { label: "Joined",        value: joinedYear ? String(joinedYear) : "—" },
                { label: "Recipes",       value: stats.recipes > 0 ? String(stats.recipes) : "—" },
                { label: "Cuisines",      value: stats.cuisines > 0 ? `${stats.cuisines} active · 20 supported` : "—" },
                { label: "Language",      value: "EN · DE" },
                { label: "Cookbook",      value: "Private 🔒" },
                { label: "Pantry items",  value: pantryCount > 0 ? `${pantryCount} tracked` : "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-[5px]"
                  style={{ borderBottom: "1px solid var(--border)", fontSize: 12 }}
                >
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span className="font-medium text-right" style={{ color: "var(--foreground)" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Edit button */}
            {userId && (
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => { setDraft({ ...profile }); setEditing(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition"
                  style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}
                >
                  <Pencil size={13} /> Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Recipe breakdown */}
          {hasTagData && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
                Recipe breakdown
              </p>
              <ProgressBar label="🌱 Vegetarian / Vegan" count={tagBreakdown.vegetarian} total={stats.recipes} color="var(--olive)" />
              <ProgressBar label="🌶 Spicy" count={tagBreakdown.spicy} total={stats.recipes} color="var(--accent)" />
              <ProgressBar label="⚡ Quick" count={tagBreakdown.quick} total={stats.recipes} color="var(--saffron)" />
              <ProgressBar label="💪 High protein" count={tagBreakdown.highProtein} total={stats.recipes} color="var(--teal)" />
            </div>
          )}
        </div>
      )}

      {/* ── Main content ── */}
      <div className="space-y-8 min-w-0">

        {/* Edit form */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-2xl p-6 overflow-hidden space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>Edit Profile</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>Display Name</label>
                <input value={draft.display_name} onChange={(e) => setDraft((p) => ({ ...p, display_name: e.target.value }))}
                  placeholder="e.g. Saran's Kitchen"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>Location</label>
                <input value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Chennai, Tamil Nadu"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>Cooking Style</label>
              <input value={draft.cook_style} onChange={(e) => setDraft((p) => ({ ...p, cook_style: e.target.value }))}
                placeholder="e.g. Home cook · South Indian specialist"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>Bio</label>
              <textarea value={draft.bio} onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
                rows={3} placeholder="Tell your food story…"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>Avatar URL (optional)</label>
              <input value={draft.avatar_url} onChange={(e) => setDraft((p) => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={saveProfile} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                style={{ background: "var(--accent)", color: "#fff" }}>
                <Check size={14} /> {saving ? "Saving…" : "Save Profile"}
              </button>
              <button type="button" onClick={() => { setEditing(false); setDraft({ ...profile }); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                <X size={14} className="inline mr-1" />Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Bio */}
        {!editing && (profile.bio || (!userId)) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Bio</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>A few words about this cookbook</p>
            <div className="mt-3 pl-4 text-sm leading-relaxed italic"
              style={{ borderLeft: "2px solid var(--saffron)", color: "var(--muted)" }}>
              {profile.bio ||
                "Every family cooks differently. Click \"Edit Profile\" to add your food story — the family influences, favourite cuisines, the dish that started it all."}
            </div>
          </div>
        )}

        {/* Cuisines I cook */}
        {!editing && hasCuisines && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Cuisines I cook</p>
            <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>Active in your cookbook</p>
            <div className="flex flex-wrap gap-2">
              {cuisineBreakdown.map(({ origin, count }) => (
                <CuisinePill key={origin} origin={origin} count={count} />
              ))}
            </div>
          </div>
        )}

        {/* Cooking style cards */}
        {!editing && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Cooking style</p>
            <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>How you cook</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🏡", name: "Home cook",         desc: "Everyday meals, family portions, no-fuss techniques" },
                { emoji: "📜", name: "Heirloom keeper",   desc: "Preserving recipes passed down through generations" },
                { emoji: "🧪", name: "Weekend explorer",  desc: "New cuisines and techniques on weekends" },
                { emoji: "⚖️", name: "Mindful, not obsessive", desc: "Nutrition available when needed — cooking is joy first" },
              ].map(({ emoji, name, desc }) => (
                <div key={name} className="rounded-xl p-3 transition-colors"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <span className="text-xl block mb-2">{emoji}</span>
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>{name}</p>
                  <p className="text-xs leading-snug" style={{ color: "var(--muted)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cookbook journey timeline */}
        {!editing && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Cookbook journey</p>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>How this collection grew</p>
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-1 bottom-1 w-px"
                style={{ background: "linear-gradient(180deg, var(--saffron), transparent)" }} />
              {[
                {
                  date: "Family heritage",
                  text: "Andhra and Karnataka recipes from grandmothers and aunts — the thakalis, rasams, and chutneys that smell like home. The recipes that live in memory, finally written down.",
                },
                {
                  date: "A new kitchen",
                  text: "New pantry constraints, different ingredients, different shelves. Learning to cook familiar food in an unfamiliar kitchen — and discovering new dishes along the way.",
                },
                {
                  date: "Building this cookbook",
                  text: `${stats.recipes > 0 ? `${stats.recipes} recipes` : "Recipes"}, ${stats.cuisines > 0 ? `${stats.cuisines} cuisines` : "multiple cuisines"}, a pantry tracker, a meal planner — a living record of what the family eats, private and growing.`,
                },
              ].map(({ date, text }, i) => (
                <div key={i} className="relative mb-5 last:mb-0">
                  <div className="absolute -left-6 top-[3px] w-3.5 h-3.5 rounded-full"
                    style={{ background: "var(--background)", border: "2px solid var(--saffron)" }} />
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--saffron)" }}>{date}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
