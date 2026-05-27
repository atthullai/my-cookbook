"use client";

/**
 * About — /about
 *
 * Emotional storytelling page.
 * - Hero: warm gradient, "Every Recipe Has a Story"
 * - App philosophy section
 * - Animated cuisine origin cards (all 20 cuisines)
 * - Feature highlights
 * - Framer Motion scroll-triggered animations
 */
import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  BookOpen, CalendarDays, ShoppingCart,
  Leaf, Zap, Heart, Star, UtensilsCrossed,
} from "lucide-react";

import { ALL_CUISINE_ORIGINS, getCuisineTheme } from "@/lib/cuisine-themes";
import type { CuisineOrigin } from "@/types";

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Cuisine card ──────────────────────────────────────────────────────────────
function CuisineCard({ origin, index }: { origin: CuisineOrigin; index: number }) {
  const theme  = getCuisineTheme(origin);
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: (index % 5) * 0.06, ease: "easeOut" }}
      whileHover={{ scale: 1.05, transition: { duration: 0.18 } }}
      className={`rounded-2xl p-4 ${theme.cardGradient} border border-white/30 shadow-sm cursor-default select-none`}
    >
      <span className="text-3xl block mb-2" aria-hidden="true">{theme.emoji}</span>
      <p className={`text-xs font-semibold uppercase tracking-wide ${theme.headingColor}`}>
        {theme.label}
      </p>
      <p className={`text-xs mt-0.5 ${theme.textColor} opacity-80`}>{theme.descriptor}</p>
    </motion.div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  delay: number;
}
function FeatureCard({ icon, title, body, href, delay }: FeatureCardProps) {
  return (
    <Reveal delay={delay}>
      <Link
        href={href}
        className="block group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
      </Link>
    </Reveal>
  );
}

// ── Philosophy bullet ─────────────────────────────────────────────────────────
function PhilosophyPoint({
  emoji, title, body, delay,
}: { emoji: string; title: string; body: string; delay: number }) {
  return (
    <Reveal delay={delay} className="flex gap-4">
      <span className="text-3xl flex-shrink-0 mt-1" aria-hidden="true">{emoji}</span>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
      </div>
    </Reveal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <main className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-24 px-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: [
              "radial-gradient(circle at 20% 80%, #f97316 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, #ec4899 0%, transparent 50%)",
            ].join(", "),
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="text-7xl mb-6 block"
            aria-hidden="true"
          >
            📖
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
          >
            Every Recipe<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              Has a Story
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.55 }}
            className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed mb-10"
          >
            My Cookbook is where family heritage, culinary curiosity, and everyday
            cooking come together in one personal space — yours alone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.5 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link
              href="/recipes"
              className="px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition shadow-md hover:shadow-lg"
            >
              Browse Recipes
            </Link>
            <Link
              href="/add"
              className="px-6 py-3 rounded-xl bg-white text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition shadow-sm"
            >
              Add a Recipe
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Philosophy ────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <Reveal>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
            What is My Cookbook?
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto text-sm leading-relaxed">
            Not just a recipe manager — a living record of the meals that matter most.
          </p>
        </Reveal>

        <div className="space-y-10">
          <PhilosophyPoint
            emoji="🧑‍🍳"
            title="Your kitchen, your rules"
            body="Every family cooks differently. My Cookbook is built around your recipes — the ones passed down by a grandparent, the quick weeknight favourites, the weekend experiments that turned out surprisingly well."
            delay={0.05}
          />
          <PhilosophyPoint
            emoji="🌍"
            title="A world of flavours at home"
            body="From spicy Karnataka curries to delicate Viennese pastries, our cuisine system covers 20 regional origins so each recipe lives in its cultural context — complete with matching colours and personality."
            delay={0.1}
          />
          <PhilosophyPoint
            emoji="❤️"
            title="Food is love, made tangible"
            body="The Amma's rasam your nose remembers from childhood, the dal tadka that tastes of home when you're far away — those recipes deserve more than a dog-eared notebook page. They deserve to be preserved."
            delay={0.15}
          />
          <PhilosophyPoint
            emoji="📊"
            title="Mindful, not obsessive"
            body="Nutrition data is available when you want it — calories, macros, fibre — without dominating the experience. Cooking is a joy first, a spreadsheet second."
            delay={0.2}
          />
        </div>
      </section>

      {/* ── Feature highlights ────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Built for real home cooks — not food bloggers.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon={<BookOpen size={22} />}
              title="Recipe Library"
              body="Save, search, and filter your entire collection. Full ingredients, steps, nutrition, and chef's notes."
              href="/recipes"
              delay={0}
            />
            <FeatureCard
              icon={<CalendarDays size={22} />}
              title="Meal Planner"
              body="Drag recipes onto a weekly calendar grid. Auto-generate shopping lists from planned meals."
              href="/planner"
              delay={0.06}
            />
            <FeatureCard
              icon={<ShoppingCart size={22} />}
              title="Smart Shopping"
              body="Check off items as you go. Copy the whole list to share — grouped by category."
              href="/planner/shopping"
              delay={0.12}
            />
            <FeatureCard
              icon={<Leaf size={22} />}
              title="Pantry Tracker"
              body="Know what you have, what's running low, and what's about to expire. Suggest recipes from what's on hand."
              href="/pantry"
              delay={0.18}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mt-5">
            <Reveal delay={0.05}>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Nutrition Calculator</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    One click pulls macros from the USDA database — no manual entry required.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <Heart size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Smart Tags</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    16 dietary and flavour tags — auto-assigned by nutrition, manually tuned by you.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Star size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Your Data, Private</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Row-level security in Supabase means only you ever see your recipes. Always.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Cuisine origin showcase ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <Reveal className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">20 Cuisines, One Kitchen</h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Each cuisine gets its own colour palette, personality, and beautiful card design —
            from the first bite to the last scroll.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ALL_CUISINE_ORIGINS.map((origin, i) => (
            <CuisineCard key={origin} origin={origin} index={i} />
          ))}
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 py-16 px-4 text-center text-white">
        <Reveal>
          <UtensilsCrossed size={36} className="mx-auto mb-5 opacity-90" />
          <h2 className="text-3xl font-bold mb-3">Start building your cookbook today</h2>
          <p className="text-orange-100 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Your family&apos;s culinary heritage — preserved, searchable, beautiful.
          </p>
          <Link
            href="/add"
            className="inline-block px-8 py-3 bg-white text-orange-600 font-semibold rounded-xl text-sm hover:bg-orange-50 transition shadow-lg"
          >
            Add your first recipe →
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
