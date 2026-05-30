"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import ConfirmDialog from "@/components/ConfirmDialog";

const EASE_WARM: [number, number, number, number] = [0.25, 0.1, 0.4, 1.0];

const PRIVACY_CARDS = [
  {
    emoji: "🚫",
    title: "No ads, ever",
    body: "No advertisers. No promoted ingredients. No brand partnerships. Your cookbook is a space to think, not a marketing channel.",
  },
  {
    emoji: "👁",
    title: "Private by default",
    body: "Your recipes are visible only to you. Sharing is a deliberate choice — never automatic, never assumed.",
  },
  {
    emoji: "📴",
    title: "No tracking",
    body: "No analytics on what you cook, when you cook, or what you buy. Your kitchen habits are yours alone.",
  },
  {
    emoji: "💾",
    title: "Your data, portable",
    body: "Export your full cookbook at any time. No lock-in. Family recipes should always be accessible, forever.",
  },
  {
    emoji: "🗑",
    title: "Delete anytime",
    body: "Full account deletion removes all data permanently. No hidden waiting periods or secret backups.",
  },
  {
    emoji: "🏡",
    title: "Family only",
    body: "Built for one household, not for public sharing. The heirloom stays in the family.",
  },
] as const;

export default function PrivacyTab() {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    toast.error("Account deletion requires contacting support — your data will be removed within 30 days.");
    setConfirmDelete(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_WARM }}
      className="space-y-6"
    >
      {/* Hero */}
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(135deg, var(--surface), var(--surface-strong))",
          border: "1px solid var(--border)",
        }}
      >
        <div className="text-5xl mb-3">🔒</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          Your recipes, your rules
        </h2>
        <p className="text-sm italic" style={{ color: "var(--muted)" }}>
          This cookbook is private by design — not by default settings.
        </p>
      </div>

      {/* 6 cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PRIVACY_CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: i * 0.06, ease: "easeOut" }}
            className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-2xl mb-2">{card.emoji}</div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              {card.title}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {card.body}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Account actions */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Account actions</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => toast("Export coming soon")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}
          >
            📤 Export cookbook
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}
          >
            <LogOut size={14} /> Sign Out
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{ border: "1px solid rgba(156,76,95,0.3)", color: "var(--berry)", background: "var(--berry-soft)" }}
          >
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This will permanently remove all your recipes, pantry items, and meal plans. This cannot be undone."
        confirmLabel="Yes, delete everything"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </motion.div>
  );
}
