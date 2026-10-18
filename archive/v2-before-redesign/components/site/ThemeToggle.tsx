"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoid a hydration mismatch: render a same-size placeholder until mounted.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) return <span className="size-10" aria-hidden="true" />;

  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to day studio theme" : "Switch to night shift theme"}
      className="grid size-10 place-items-center rounded-full border border-line bg-surface transition-colors hover:text-accent"
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
