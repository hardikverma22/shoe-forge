"use client";

import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion } from "motion/react";
import { useSceneMeta } from "@/lib/three/scene-store";

export function LoadingOverlay() {
  const { progress, errors, active } = useProgress();
  const ready = useSceneMeta((s) => s.layout !== null);
  const failed = errors.length > 0;
  const show = failed || !ready;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="loader"
          role="status"
          aria-live="polite"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="absolute inset-0 z-30 grid place-items-center"
        >
          <div className="flex w-[min(80vw,18rem)] flex-col items-center gap-4 text-center">
            {failed ? (
              <>
                <p className="font-medium">The 3D model didn&apos;t load. Check your connection, then reload.</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-[var(--radius-control)] bg-accent px-4 py-2 font-semibold text-accent-ink"
                >
                  Reload
                </button>
              </>
            ) : (
              <>
                <div className="h-1 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${Math.max(4, progress)}%` }} />
                </div>
                <p className="tabular text-sm text-ink-muted">
                  {active || progress < 100 ? `Loading the 3D model ${Math.round(progress)}%` : "Preparing the studio"}
                </p>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
