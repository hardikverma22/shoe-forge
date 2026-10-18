"use client";

import { useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => useToasts.getState().dismiss(t.id)}
          className={`pointer-events-auto glass max-w-md rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-medium shadow-lg ${
            t.tone === "error" ? "text-danger" : t.tone === "success" ? "text-accent" : "text-ink"
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
