"use client";

/**
 * About Me — /about
 *
 * Personal profile page that the user can edit:
 * - Name, bio, location, cooking style
 * - Saved to user_profiles in Supabase
 * - Shows cookbook stats (recipe count, cuisine count)
 * - App feature highlights below
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  BookOpen, CalendarDays, ShoppingCart, Leaf,
  Pencil, Check, X, ChefHat, MapPin, Sparkles,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { ALL_CUISINE_ORIGINS, getCuisineTheme } from "@/lib/cuisine-themes";
import type { CuisineOrigin } from "@/types";

const EASE_WARM: [number, number, number, number] = [0.25, 0.1, 0.4, 1.0];

interface UserProfile {
  display_name: string;
  bio: string;
  location: string;
  cook_style: string;
  avatar_url: string;
}

const EMPTY_PROFILE: UserProfile = {
  display_name: "",
  bio: "",
  location: "",
  cook_style: "",
  avatar_url: "",
};

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: EASE_WARM }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Cuisine showcase card ─────────────────────────────────────────────────────
function CuisineCard({ origin, index }: { origin: CuisineOrigin; index: number }) {
  const theme  = getCuisineTheme(origin);
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: (index % 5) * 0.06, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      className={`rounded-2xl p-4 ${theme.cardGradient} border border-white/30 shadow-sm cursor-default select-none`}
    >
      <span className="text-3xl block mb-2">{theme.emoji}</span>
      <p className={`text-xs font-semibold uppercase tracking-wide ${theme.headingColor}`}>{theme.label}</p>
      <p className={`text-xs mt-0.5 ${theme.textColor} opacity-80`}>{theme.descriptor}</p>
    </motion.div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, body, href, delay }: { icon: React.ReactNode; title: string; body: string; href: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <Link href={href}
        className="block group rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "rgba(184,92,53,0.1)", color: "var(--accent)" }}>
          {icon}
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
      </Link>
    </Reveal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [profile,   setProfile]   = useState<UserProfile>(EMPTY_PROFILE);
  const [draft,     setDraft]     = useState<UserProfile>(EMPTY_PROFILE);
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [stats,     setStats]     = useState({ recipes: 0, cuisines: 0 });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      // Load profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const p: UserProfile = {
          display_name: (profileData.display_name as string) ?? "",
          bio:          (profileData.bio as string) ?? "",
          location:     (profileData.location as string) ?? "",
          cook_style:   (profileData.cook_style as string) ?? "",
          avatar_url:   (profileData.avatar_url as string) ?? "",
        };
        setProfile(p);
        setDraft(p);
      }

      // Load stats
      const { data: recipes } = await supabase
        .from("recipes")
        .select("cuisine_origin")
        .eq("user_id", user.id);

      if (recipes) {
        const uniqueCuisines = new Set(recipes.map((r) => r.cuisine_origin as string).filter(Boolean));
        setStats({ recipes: recipes.length, cuisines: uniqueCuisines.size });
      }
    } catch {
      // user_profiles table might not exist yet — show setup prompt
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

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
          updated_at:   new Date().toISOString(),
        });

      if (error) {
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          toast.error("Run the setup migration first. Copy the SQL from below.", { duration: 8000 });
        } else {
          throw error;
        }
        return;
      }

      setProfile({ ...draft });
      setEditing(false);
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Profile hero ──────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-4 py-16"
          style={{
            background: "linear-gradient(160deg, var(--linen) 0%, var(--parchment) 60%, var(--background) 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_WARM }}
              className="rounded-3xl p-8 shadow-lg"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-5">
                  {/* Avatar circle */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
                    style={{ background: "rgba(184,92,53,0.12)" }}
                  >
                    {profile.avatar_url ? (
                      <Image unoptimized src={profile.avatar_url} alt="Profile avatar" width={80} height={80} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <ChefHat size={36} style={{ color: "var(--accent)" }} />
                    )}
                  </div>

                  <div>
                    {loading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-6 w-40 rounded" style={{ background: "var(--border)" }} />
                        <div className="h-4 w-28 rounded" style={{ background: "var(--border)" }} />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                          {profile.display_name || (userId ? "Your Cookbook" : "My Cookbook")}
                        </h1>
                        {profile.location && (
                          <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: "var(--muted)" }}>
                            <MapPin size={13} /> {profile.location}
                          </p>
                        )}
                        {profile.cook_style && (
                          <p className="flex items-center gap-1.5 text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                            <Sparkles size={13} /> {profile.cook_style}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                {userId && !editing && (
                  <button
                    type="button"
                    onClick={() => { setDraft({ ...profile }); setEditing(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{ background: "var(--surface-strong)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    <Pencil size={14} /> Edit Profile
                  </button>
                )}
              </div>

              {/* Bio */}
              {!editing && profile.bio && (
                <p className="mt-5 leading-relaxed" style={{ color: "var(--muted)" }}>
                  {profile.bio}
                </p>
              )}

              {/* No profile yet */}
              {!editing && !loading && userId && !profile.display_name && (
                <p className="mt-4 text-sm italic" style={{ color: "var(--muted)", opacity: 0.7 }}>
                  Click &ldquo;Edit Profile&rdquo; to add your name, bio, and cooking style.
                </p>
              )}

              {/* Stats */}
              {!editing && !loading && stats.recipes > 0 && (
                <div className="flex gap-6 mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{stats.recipes}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Recipes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{stats.cuisines}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Cuisines</p>
                  </div>
                </div>
              )}

              {/* ── Edit form ─────────────────────────────────────────────── */}
              {editing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 space-y-4 overflow-hidden"
                >
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                        Display Name
                      </label>
                      <input
                        value={draft.display_name}
                        onChange={(e) => setDraft((p) => ({ ...p, display_name: e.target.value }))}
                        placeholder="e.g. Saran's Kitchen"
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                        Location
                      </label>
                      <input
                        value={draft.location}
                        onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
                        placeholder="e.g. Chennai, Tamil Nadu"
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                      Cooking Style
                    </label>
                    <input
                      value={draft.cook_style}
                      onChange={(e) => setDraft((p) => ({ ...p, cook_style: e.target.value }))}
                      placeholder="e.g. Home cook • South Indian specialist • Weekend baker"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                      Bio
                    </label>
                    <textarea
                      value={draft.bio}
                      onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      placeholder="Tell your food story — family influences, favourite cuisines, the dish that started it all…"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                      style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                      Avatar URL (optional)
                    </label>
                    <input
                      value={draft.avatar_url}
                      onChange={(e) => setDraft((p) => ({ ...p, avatar_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: "var(--parchment)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      <Check size={14} /> {saving ? "Saving…" : "Save Profile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditing(false); setDraft({ ...profile }); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
                      style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                    >
                      <X size={14} className="inline mr-1" />Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── What is My Cookbook ─────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <Reveal>
            <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--foreground)" }}>
              What is My Cookbook?
            </h2>
            <p className="text-center text-sm mb-10 max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
              Not just a recipe manager — a living record of the meals that matter most.
            </p>
          </Reveal>
          <div className="space-y-8">
            {[
              { emoji: "🧑‍🍳", title: "Your kitchen, your rules", body: "Every family cooks differently. Your recipes — the ones passed down by a grandparent, the quick weeknight favourites, the weekend experiments — all in one place." },
              { emoji: "🌍", title: "20 cuisine origins", body: "From spicy Karnataka curries to delicate Viennese pastries. Each recipe lives in its cultural context with matching colours and personality." },
              { emoji: "❤️", title: "Food is love, made tangible", body: "The Amma's rasam your nose remembers from childhood. The dal tadka that tastes of home. Those recipes deserve more than a dog-eared notebook page." },
              { emoji: "📊", title: "Mindful, not obsessive", body: "Nutrition data is available when you want it — calories, macros, fibre — without dominating the experience. Cooking is a joy first, a spreadsheet second." },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07} className="flex gap-4">
                <span className="text-3xl flex-shrink-0 mt-1">{p.emoji}</span>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Feature highlights ───────────────────────────────────────────── */}
        <section className="py-16 px-4" style={{ background: "var(--surface)" }}>
          <div className="max-w-5xl mx-auto">
            <Reveal className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Everything you need</h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--muted)" }}>Built for real home cooks — not food bloggers.</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <FeatureCard icon={<BookOpen size={22} />} title="Recipe Library" body="Save, search, and filter your collection. Full ingredients, steps, nutrition, and chef's notes." href="/recipes" delay={0} />
              <FeatureCard icon={<CalendarDays size={22} />} title="Meal Planner" body="Drag recipes onto a weekly calendar. Auto-generate shopping lists from planned meals." href="/planner" delay={0.06} />
              <FeatureCard icon={<ShoppingCart size={22} />} title="Smart Shopping" body="Check off items as you go. Copy the whole list to share — grouped by category." href="/planner/shopping" delay={0.12} />
              <FeatureCard icon={<Leaf size={22} />} title="Pantry Tracker" body="Know what's running low or expiring. Suggest recipes from what's on hand." href="/pantry" delay={0.18} />
            </div>
          </div>
        </section>

        {/* ── Cuisine showcase ─────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>20 Cuisines, One Kitchen</h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
              Each cuisine gets its own colour palette, personality, and beautiful card design.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CUISINE_ORIGINS.map((origin, i) => (
              <CuisineCard key={origin} origin={origin} index={i} />
            ))}
          </div>
        </section>

        {/* ── Footer CTA ───────────────────────────────────────────────────── */}
        <section className="py-14 px-4 text-center" style={{ background: "var(--accent)", color: "#fff" }}>
          <Reveal>
            <h2 className="text-2xl font-bold mb-3">Your family&apos;s culinary heritage</h2>
            <p className="mb-8 max-w-md mx-auto text-sm leading-relaxed" style={{ opacity: 0.85 }}>
              Preserved, searchable, beautiful — yours alone.
            </p>
            <Link href="/add"
              className="inline-block px-8 py-3 rounded-xl font-semibold text-sm transition"
              style={{ background: "#fff", color: "var(--accent)" }}
            >
              Add a recipe →
            </Link>
          </Reveal>
        </section>
      </main>
    </>
  );
}
