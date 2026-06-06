"use client";

// ReceiptScanner — snap/upload a shopping receipt, OCR it with Tesseract.js
// (lazy-loaded), extract candidate product lines, and let the user review/edit
// before bulk-adding to the pantry. OCR is best-effort, so review is required.

import { useState } from "react";
import { X } from "lucide-react";

// Lines that are clearly not products.
const SKIP = /total|subtotal|sub-total|\btax\b|\bvat\b|cash|change|card|visa|master|balance|amount|eur|usd|gbp|payment|receipt|invoice|\bdate\b|\btime\b|store|tel\b|thank|www|http|qty|price|discount|loyalty|points/i;

function parseReceipt(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || SKIP.test(line)) continue;
    const cleaned = line
      .replace(/[€$£]\s?\d+[.,]\d{2}/g, " ")        // currency amounts
      .replace(/\b\d+[.,]\d{2}\b/g, " ")             // prices
      .replace(/\bx?\d+\s?(kg|g|ml|l|pcs|x)\b/gi, " ") // quantities/units
      .replace(/\b\d+\b/g, " ")                       // stray numbers
      .replace(/[^a-zA-ZÀ-ſ\s&'-]/g, " ")  // keep letters/space/&'-
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.replace(/[^a-zA-Z]/g, "").length < 3) continue;
    out.push(cleaned.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
  }
  return [...new Set(out)].slice(0, 40);
}

export default function ReceiptScanner({ onClose, onAdd }: { onClose: () => void; onAdd: (names: string[]) => void }) {
  const [stage, setStage] = useState<"pick" | "working" | "review">("pick");
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<{ name: string; on: boolean }[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStage("working"); setProgress(0);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const names = parseReceipt(data.text ?? "");
      setRows(names.map((n) => ({ name: n, on: true })));
      setStage("review");
    } catch {
      alert("Couldn't read the receipt. Try a clearer, well-lit photo.");
      setStage("pick");
    } finally {
      e.target.value = "";
    }
  };

  const selected = rows.filter((r) => r.on && r.name.trim());

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>Scan receipt</p>
          <button type="button" onClick={onClose} style={{ color: "var(--muted)" }}><X size={16} /></button>
        </div>

        {stage === "pick" && (
          <div className="text-center py-6">
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Take a clear photo of your receipt. We&apos;ll pull out the items so you can add them to your pantry.
            </p>
            <label className="button button-primary" style={{ cursor: "pointer" }}>
              📷 Choose receipt photo
              <input type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
            </label>
          </div>
        )}

        {stage === "working" && (
          <div className="text-center py-10">
            <p className="text-sm mb-3" style={{ color: "var(--foreground)" }}>Reading receipt… {progress}%</p>
            <div style={{ height: 6, borderRadius: 999, background: "var(--surface-strong)", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", transition: "width .2s" }} />
            </div>
          </div>
        )}

        {stage === "review" && (
          <>
            {rows.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>No items detected. Try a clearer photo.</p>
            ) : (
              <>
                <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Untick anything that isn&apos;t food, edit names if needed.</p>
                <div className="space-y-2" style={{ maxHeight: "48vh", overflowY: "auto" }}>
                  {rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="checkbox" checked={r.on} onChange={() => setRows((p) => p.map((x, j) => j === i ? { ...x, on: !x.on } : x))} />
                      <input className="input" value={r.name} style={{ flex: 1 }}
                        onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="button" onClick={() => setStage("pick")}>Rescan</button>
              <button type="button" className="button button-primary" disabled={selected.length === 0}
                onClick={() => onAdd(selected.map((r) => r.name.trim()))}>
                Add {selected.length} to pantry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
