"use client";

/**
 * ConfirmModal
 * Reusable confirmation dialog for delete / destructive actions.
 *
 * Usage:
 *   <ConfirmModal
 *     open={!!deleteTarget}
 *     title={`Delete "${deleteTarget?.title_en}"?`}
 *     message="This cannot be undone."
 *     onConfirm={handleDelete}
 *     onCancel={() => setDeleteTarget(null)}
 *   />
 *
 * Set danger={false} for non-destructive confirmations (confirm button turns indigo).
 * Slides up on mobile, centres on ≥sm screens.
 */
import { AnimatePresence, motion } from "framer-motion";

interface ConfirmModalProps {
  open:          boolean;
  title:         string;
  message?:      string;
  confirmLabel?: string;
  onConfirm:     () => void;
  onCancel:      () => void;
  danger?:       boolean;
  loading?:      boolean;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  danger = true,
  loading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop — click to cancel */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={loading ? undefined : onCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby={message ? "confirm-modal-message" : undefined}
            className="relative bg-white rounded-2xl shadow-xl p-6 mx-4 w-full max-w-sm"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <h2
              id="confirm-modal-title"
              className="text-lg font-semibold mb-2 text-gray-900"
            >
              {title}
            </h2>

            {message && (
              <p
                id="confirm-modal-message"
                className="text-sm text-gray-500 mb-5"
              >
                {message}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className={[
                  "px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-60",
                  danger
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-indigo-500 hover:bg-indigo-600",
                ].join(" ")}
              >
                {loading ? "…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
