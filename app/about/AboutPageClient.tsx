"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { BookOpen, CalendarDays, ShoppingCart, Leaf } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { ALL_CUISINE_ORIGINS, getCuisineTheme } from "@/lib/cuisine-themes";
import type { CuisineOrigin } from "@/types";
import LottieAnimation from "@/components/LottieAnimation";
import ProfileTab from "./ProfileTab";
import PrivacyTab from "./PrivacyTab";
import type { CuisineBreakdown, TagBreakdown } from "./page";

const EASE_WARM: [number, number, number, number] = [0.25, 0.1, 0.4, 1.0];

type Tab = "profile" | "cookbook" | "cuisines" | "privacy";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile",  label: "👤 Profile" },
  { id: "cookbook", label: "📖 My Cookbook" },
  { id: "cuisines", label: "🌍 20 Cuisines" },
  { id: "privacy",  label: "🔒 Privacy" },
];

// ── Cuisine card ──────────────────────────────────────────────────────────────
function CuisineCard({ origin, index, recipeCount }: { origin: CuisineOrigin; index: number; recipeCount?: number }) {
  const theme  = getCuisineTheme(origin);
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.38, delay: (index % 5) * 0.055, ease: "easeOut" }}
      whileHover={{ scale: 1.04 }}
      className={`rounded-2xl p-4 ${theme.cardGradient} border border-white/30 shadow-sm cursor-default select-none relative overflow-hidden`}
    >
      {recipeCount != null && recipeCount > 0 && (
        <span className={`absolute top-2 right-2 text-[9px] font-semibold opacity-60 ${theme.textColor}`}>
          {recipeCount} recipe{recipeCount !== 1 ? "s" : ""}
        </span>
      )}
      <span className="text-2xl block mb-2">{theme.emoji}</span>
      <p className={`text-xs font-semibold uppercase tracking-wide ${theme.headingColor}`}>{theme.label}</p>
      <p className={`text-xs mt-0.5 ${theme.textColor} opacity-75 leading-snug`}>{theme.descriptor}</p>
    </motion.div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, body, href, badge, badgeColor,
}: {
  icon: React.ReactNode; title: string; body: string; href: string; badge: string; badgeColor: string;
}) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.42, ease: EASE_WARM }}
    >
      <Link
        href={href}
        className="block rounded-2xl p-5 border h-full transition-all hover:-translate-y-0.5 hover:shadow-md"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: "rgba(184,92,53,0.1)", color: "var(--accent)" }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{title}</h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--muted)" }}>{body}</p>
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ background: badgeColor + "22", color: badgeColor, border: `1px solid ${badgeColor}33` }}
        >
          {badge}
        </span>
      </Link>
    </motion.div>
  );
}

// ── My Cookbook tab ───────────────────────────────────────────────────────────
function CookbookTab({ recipeCount }: { recipeCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_WARM }}
      className="space-y-10"
    >
      {/* Manifesto */}
      <div
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--surface), var(--surface-strong))",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="absolute top-[-10px] left-4 font-serif leading-none pointer-events-none select-none"
          style={{ fontSize: 160, color: "var(--saffron)", opacity: 0.06 }}
        >
          &ldquo;
        </div>
        <p className="relative z-10 text-lg leading-relaxed" style={{ color: "var(--foreground)", fontStyle: "italic" }}>
          Not just a recipe manager —{" "}
          <em style={{ color: "var(--accent)", fontStyle: "italic" }}>a living record of the meals that matter most.</em>
          {" "}Every family cooks differently. The dal tadka your nose remembers from childhood.
          The Amma&apos;s rasam. The recipes that deserve more than a dog-eared notebook page.
        </p>
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)" }}>Everything you need</h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Built for real home cooks — not food bloggers.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <FeatureCard icon={<BookOpen size={20} />} title="Recipe Library"
            body="Save, search, and filter your collection. Full ingredients, step-by-step instructions, nutrition data, and chef's notes. Bilingual EN &amp; DE."
            href="/recipes" badge={recipeCount > 0 ? `${recipeCount} recipes` : "Your collection"} badgeColor="var(--saffron)" />
          <FeatureCard icon={<CalendarDays size={20} />} title="Meal Planner"
            body="Plan a week of meals. Breakfast, lunch, dinner rows. Pantry sufficiency check shows what's missing before you shop."
            href="/planner" badge="Pantry-linked" badgeColor="var(--olive)" />
          <FeatureCard icon={<ShoppingCart size={20} />} title="Smart Shopping"
            body="Gap-based list from planner. Item + category only. Gap hint in note. Grouped by aisle for the shop."
            href="/planner/shopping" badge="Gap-based" badgeColor="var(--teal)" />
          <FeatureCard icon={<Leaf size={20} />} title="Pantry Tracker"
            body="Store-bought and homemade items. Expiry alerts, opened state, FIFO deduction on cooking. Pfand auto-tracking."
            href="/pantry" badge="FIFO · Pfand" badgeColor="var(--saffron)" />
        </div>
      </div>

      {/* Why private */}
      <div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>Why private?</h2>
        <p className="text-sm leading-relaxed italic" style={{ color: "var(--muted)" }}>
          Family recipes are personal. They carry memory, imprecision, love, and context that doesn&apos;t belong on the open internet.
          This cookbook is for the family table — not for food bloggers or SEO.
          Private by design. No ads. No sharing unless you choose to.
        </p>
      </div>

      {/* What makes it different */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--foreground)" }}>What makes it different</h2>
        <div className="flex flex-col gap-2">
          {[
            { bold: "20 cuisine origins",        detail: "each with its own colour palette, personality, and card design" },
            { bold: "Mindful nutrition",          detail: "calories, macros, vitamins available when you want them, never dominant" },
            { bold: "Germany-aware",              detail: "Pfand tracking, disposal guide, Mehrweg/Einweg/carton detection built in" },
            { bold: "Unit conversion built-in",   detail: "recipe uses \"2 onions\"? Pantry stores in g. The bridge is automatic." },
            { bold: "Homemade category",          detail: "ginger-garlic paste, coconut milk, tamarind water — tracked like any pantry item" },
          ].map(({ bold, detail }) => (
            <div
              key={bold}
              className="flex gap-3 items-start px-4 py-3 rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="text-base flex-shrink-0 mt-0.5" style={{ color: "var(--saffron)" }}>✦</span>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>{bold}</span>
                {" — "}{detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl px-8 py-10 text-center" style={{ background: "var(--accent)", color: "#fff" }}>
        <h2 className="text-xl font-bold mb-2">Your family&apos;s culinary heritage</h2>
        <p className="text-sm mb-6 max-w-sm mx-auto leading-relaxed" style={{ opacity: 0.85 }}>
          Preserved, searchable, beautiful — yours alone.
        </p>
        <Link href="/add" className="inline-block px-7 py-2.5 rounded-xl font-semibold text-sm transition"
          style={{ background: "#fff", color: "var(--accent)" }}>
          Add a recipe →
        </Link>
      </div>
    </motion.div>
  );
}

// ── 20 Cuisines tab ───────────────────────────────────────────────────────────
function CuisinesTab({ cuisineBreakdown }: { cuisineBreakdown: CuisineBreakdown[] }) {
  const countMap = new Map(cuisineBreakdown.map((c) => [c.origin, c.count]));
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_WARM }}
    >
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)" }}>20 Cuisines, One Kitchen</h2>
      <p className="text-sm mb-2 italic" style={{ color: "var(--muted)" }}>
        Each cuisine gets its own colour palette, personality, and card design.
        From spicy Andhra curries to delicate Viennese pastries — every recipe lives in its cultural context.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
        {ALL_CUISINE_ORIGINS.map((origin, i) => (
          <CuisineCard key={origin} origin={origin} index={i} recipeCount={countMap.get(origin)} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Page client shell ─────────────────────────────────────────────────────────
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

export default function AboutPageClient({ initialProfile, userId, stats, cuisineBreakdown, tagBreakdown, pantryCount, joinedYear }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const displayName = initialProfile.display_name || "My Cookbook";
  const subtitle    = initialProfile.bio
    ? initialProfile.bio.slice(0, 100) + (initialProfile.bio.length > 100 ? "…" : "")
    : "Recipes handed down, stories kept warm — a private heirloom for the family table.";

  // Split display name: all but last word on line 1, last word italic on line 2
  const nameParts  = displayName.split(" ");
  const nameFirst  = nameParts.slice(0, -1).join(" ");
  const nameLast   = nameParts[nameParts.length - 1];

  const heroStats = [
    { num: stats.recipes,           label: "recipes" },
    { num: stats.cuisines,          label: "cuisines" },
    ...(tagBreakdown.totalTags > 0 ? [{ num: tagBreakdown.totalTags, label: "tags" }] : []),
    { num: 20,                      label: "origins" },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden px-6 pt-14 pb-0 border-b"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 70% 0%, rgba(212,168,83,.08) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 10% 100%, rgba(232,132,74,.06) 0%, transparent 60%),
              var(--linen)
            `,
            borderColor: "var(--border)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end justify-between gap-8">
              {/* Left: text content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE_WARM }}
                className="flex-1 min-w-0"
              >
                {/* Eyebrow */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-6" style={{ background: "var(--saffron)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--saffron)" }}>
                    About the cook
                  </span>
                </div>

                {/* Title — two lines */}
                <h1
                  className="font-bold leading-tight mb-2"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--foreground)" }}
                >
                  {nameFirst && <>{nameFirst}<br /></>}
                  <em style={{ color: "var(--accent)", fontStyle: "italic" }}>{nameLast}</em>
                </h1>

                {/* Subtitle */}
                <p className="text-sm mb-5 italic max-w-lg" style={{ color: "var(--muted)" }}>
                  {subtitle}
                </p>

                {/* Stats */}
                {stats.recipes > 0 && (
                  <div className="flex gap-7 mb-0">
                    {heroStats.map(({ num, label }) => (
                      <div key={label}>
                        <p className="text-[1.7rem] font-bold leading-none" style={{ color: "var(--saffron)" }}>{num}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Right: peacock Lottie */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: EASE_WARM }}
                className="hidden sm:block flex-shrink-0"
              >
                <LottieAnimation
                  src="/animations/peacock.json"
                  loop
                  style={{ width: 130, filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.35))" }}
                />
              </motion.div>
            </div>

            {/* Divider */}
            <div className="mt-8 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)" }} />
          </div>
        </section>

        {/* ── Tab bar ── */}
        <div
          className="sticky top-0 z-20 px-6 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="max-w-3xl mx-auto flex gap-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors"
                style={{ color: activeTab === tab.id ? "var(--saffron)" : "var(--muted)" }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "var(--saffron)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="max-w-3xl mx-auto px-6 py-10">
          {activeTab === "profile"  && (
            <ProfileTab
              initialProfile={initialProfile}
              userId={userId}
              stats={stats}
              cuisineBreakdown={cuisineBreakdown}
              tagBreakdown={tagBreakdown}
              pantryCount={pantryCount}
              joinedYear={joinedYear}
            />
          )}
          {activeTab === "cookbook" && <CookbookTab recipeCount={stats.recipes} />}
          {activeTab === "cuisines" && <CuisinesTab cuisineBreakdown={cuisineBreakdown} />}
          {activeTab === "privacy"  && <PrivacyTab />}
        </div>
      </main>
    </>
  );
}
