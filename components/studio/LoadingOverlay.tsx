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
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="absolute inset-0 z-30 grid place-items-center"
        >
          <div className="flex w-[min(80vw,20rem)] flex-col items-center gap-4 text-center">
            {failed ? (
              <>
                <p className="font-semibold">
                  The 3D model didn&apos;t load. Check your connection, then reload.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-accent text-accent-ink rounded-full px-5 py-2.5 font-bold"
                >
                  Reload
                </button>
              </>
            ) : (
              <>
                <div className="bg-line relative h-[3px] w-full overflow-hidden rounded-full">
                  <div
                    className="bg-accent absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
                    style={{ width: `${Math.max(6, progress)}%` }}
                  />
                </div>
                <p className="spec text-ink-muted">
                  {active || progress < 100
                    ? `Loading the 3D model / ${String(Math.round(progress)).padStart(3, "0")}%`
                    : "Setting up the studio"}
                </p>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
