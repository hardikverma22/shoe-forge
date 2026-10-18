"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Info, TriangleAlert } from "lucide-react";
import { useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            type="button"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ type: "spring", bounce: 0.25, visualDuration: 0.35 }}
            onClick={() => useToasts.getState().dismiss(t.id)}
            className="bg-ink text-paper pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full py-2.5 pr-5 pl-3 text-left text-sm font-semibold shadow-[0_16px_40px_-16px_rgb(5_6_26/0.6)]"
          >
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full ${
                t.tone === "error"
                  ? "bg-danger text-white"
                  : t.tone === "success"
                    ? "bg-select text-select-ink"
                    : "bg-paper/15"
              }`}
              aria-hidden="true"
            >
              {t.tone === "error" ? (
                <TriangleAlert size={13} />
              ) : t.tone === "success" ? (
                <Check size={13} />
              ) : (
                <Info size={13} />
              )}
            </span>
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
