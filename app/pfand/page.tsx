"use client";

import { useState } from "react";
import { detectPfand, disposalEmoji, type PfandResult } from "@/lib/pfand";

interface Row {
  name: string;
  result: PfandResult;
}

const PFAND_COLOR: Record<string, string> = {
  einweg:  "bg-amber-100 text-amber-800 border border-amber-300",
  mehrweg: "bg-green-100 text-green-800 border border-green-300",
  crate:   "bg-blue-100  text-blue-800  border border-blue-300",
  none:    "bg-gray-100  text-gray-600  border border-gray-300",
};

export default function PfandPage() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  function analyse() {
    const lines = input
      .split(/[\n,]+/)
      .map((l) => l.replace(/^\d+x\s*/i, "").trim())
      .filter(Boolean);

    setRows(lines.map((name) => ({ name, result: detectPfand(name) })));
  }

  const totalDeposit = rows.reduce((sum, r) => sum + r.result.deposit, 0);

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ color: "var(--foreground)" }}>
      <h1 className="text-2xl font-bold mb-1">♻️ Pfand &amp; Recycling</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Paste your shopping items — one per line or comma-separated. Get deposit amounts and disposal guidance.
      </p>

      <textarea
        className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none mb-3"
        style={{
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--foreground)",
          minHeight: 120,
        }}
        placeholder={"e.g.\n6x Gerolsteiner 0.75L sparkling water\n2x Red Bull cans\n1x Alpro oat milk 1L\n1x Olive oil glass bottle\n1x Weißbier crate 20 bottles"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={analyse}
        disabled={!input.trim()}
        className="w-full py-3 rounded-2xl text-sm font-semibold transition mb-8 disabled:opacity-40"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        Check Pfand &amp; Disposal
      </button>

      {rows.length > 0 && (
        <>
          <div className="rounded-2xl overflow-hidden shadow-sm mb-6" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide" style={{ background: "var(--surface-strong)", color: "var(--muted)" }}>
                  <th className="text-left px-4 py-2">Item</th>
                  <th className="text-left px-4 py-2">Container</th>
                  <th className="text-center px-4 py-2">Pfand</th>
                  <th className="text-left px-4 py-2">When empty</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{row.result.containerType}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${PFAND_COLOR[row.result.pfandType]}`}>
                        {row.result.pfandType === "none"
                          ? "None"
                          : `€${row.result.deposit.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                        {disposalEmoji(row.result.disposal)} {row.result.disposalLabel}
                      </span>
                      {row.result.note && (
                        <p className="text-xs mt-0.5 italic" style={{ color: "var(--muted)", opacity: 0.7 }}>
                          {row.result.note}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-2xl px-5 py-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="font-semibold">Total Pfand deposit</span>
            <span className="text-xl font-bold" style={{ color: "var(--accent)" }}>
              €{totalDeposit.toFixed(2)}
            </span>
          </div>

          {/* Disposal legend */}
          <div className="mt-6 rounded-2xl px-5 py-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Disposal guide</h2>
            <ul className="grid grid-cols-1 gap-1 text-xs" style={{ color: "var(--muted)" }}>
              <li>🔄 <strong>Pfandautomat</strong> — supermarket deposit machine</li>
              <li>⬜ <strong>Altglas weiss</strong> — clear / white glass (wine, sekt)</li>
              <li>🟫 <strong>Altglas braun</strong> — brown glass (red wine, beer bottles without Pfand)</li>
              <li>🟩 <strong>Altglas grün</strong> — green / mixed glass (oil, sauces, jars)</li>
              <li>🟡 <strong>Gelbe Tonne</strong> — Tetra Pak, cartons, plastic packaging</li>
              <li>🔵 <strong>Blaue Tonne</strong> — clean cardboard &amp; paper</li>
              <li>⬛ <strong>Restmüll</strong> — crystal glass, ceramics, mirrors</li>
            </ul>
            <p className="mt-2 text-xs italic" style={{ color: "var(--muted)", opacity: 0.7 }}>
              No glass disposal before 8 AM (noise restrictions). Remove lids before Altglas.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
