"use client";

// Welcome — first-launch landing for signed-out visitors. Peacock hero, the
// case for creating an account (sync), and a sign-in CTA. Logged-in users are
// sent straight to the home dashboard.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LottieAnimation from "@/components/LottieAnimation";

const BENEFITS = [
  { icon: "☁️", text: "Recipes backed up & synced across devices" },
  { icon: "📅", text: "Meal plans follow you everywhere" },
  { icon: "🛒", text: "Shopping lists stay in sync" },
  { icon: "💻", text: "Use the web version on any device" },
];

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
      else setChecking(false);
    });
  }, [router]);

  if (checking) return null;

  return (
    <main
      style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem 1.25rem",
        background: [
          "radial-gradient(ellipse 80% 60% at 70% 15%, rgba(212,168,83,.12) 0%, transparent 55%)",
          "radial-gradient(ellipse 60% 80% at 10% 85%, rgba(232,132,74,.10) 0%, transparent 55%)",
          "linear-gradient(160deg, var(--linen) 0%, var(--parchment) 55%, var(--background) 100%)",
        ].join(", "),
      }}
    >
      <div style={{ maxWidth: 980, width: "100%", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2rem", justifyContent: "center" }}>

        {/* Peacock */}
        <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center" }} aria-hidden>
          <LottieAnimation src="/animations/peacock.json" loop style={{ width: "clamp(260px, 38vw, 520px)", height: "clamp(260px, 38vw, 520px)" }} />
        </div>

        {/* Copy */}
        <div style={{ flex: "1 1 340px", maxWidth: 460 }}>
          <p style={{ color: "var(--accent-strong)", fontSize: "0.72rem", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.85rem" }}>
            Welcome
          </p>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", lineHeight: 1.02, letterSpacing: "-0.02em", color: "var(--foreground)", marginBottom: "1rem", fontFamily: '"Iowan Old Style", "Palatino Linotype", Georgia, serif' }}>
            My <span style={{ color: "var(--accent)" }}>Cookbook</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Recipes handed down, meals planned, pantry tracked — a warm, private kitchen companion.
          </p>

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "grid", gap: 10 }}>
            {BENEFITS.map((b) => (
              <li key={b.text} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--foreground)", fontSize: "0.92rem" }}>
                <span aria-hidden style={{ fontSize: "1.1rem" }}>{b.icon}</span>{b.text}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/login" className="button button-primary" style={{ flex: "1 1 auto", textAlign: "center", justifyContent: "center" }}>
              Sign in / Create account
            </Link>
            <Link href="/recipes" className="button button-soft" style={{ flex: "0 0 auto", textAlign: "center" }}>
              Browse recipes
            </Link>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.9rem" }}>
            Without an account, your recipes won&apos;t sync across devices.
          </p>
        </div>
      </div>
    </main>
  );
}
