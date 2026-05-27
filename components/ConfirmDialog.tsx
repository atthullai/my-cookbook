"use client";

/**
 * ConfirmDialog — modal for delete/destructive action confirmations.
 *
 * Features:
 * - Backdrop blur overlay
 * - Framer Motion: scale in from center
 * - Red "Delete" button with spinner when loading=true
 * - Pressing Escape cancels the dialog
 *
 * Usage:
 *   <ConfirmDialog
 *     open={!!deleteTarget}
 *     title={`Delete "${deleteTarget?.title}"?`}
 *     message="This action cannot be undone."
 *     onConfirm={handleDelete}
 *     onCancel={() => setDeleteTarget(null)}
 *     loading={isDeleting}
 *   />
 */
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open:         boolean;
  title:        string;
  message:      string;
  confirmLabel?: string;
  onConfirm:    () => void;
  onCancel:     () => void;
  loading?:     boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              {/* Icon + title */}
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5 p-2 rounded-full flex-shrink-0" style={{ background: "rgba(220,38,38,0.1)" }}>
                  <AlertTriangle size={18} style={{ color: "#dc2626" }} />
                </div>
                <div>
                  <h2
                    id="confirm-dialog-title"
                    className="text-base font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {title}
                  </h2>
                  <p
                    id="confirm-dialog-message"
                    className="mt-1 text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end mt-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                  style={{ color: "var(--muted)", background: "var(--surface-strong)", border: "1px solid var(--border)" }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={onConfirm}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition"
                  style={{ background: "#dc2626", color: "#ffffff", border: "1px solid #b91c1c" }}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
