import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { href: "/studio/forge-runner", label: "Studio" },
  { href: "/gallery", label: "My designs" },
];

/**
 * "stock" sits on a dark printed field, "sweep" on the light photo sweep (both fixed colors),
 * and "studio" follows the theme tokens.
 */
export function SiteHeader({
  tone = "studio",
  className = "",
}: {
  tone?: "stock" | "studio" | "sweep";
  className?: string;
}) {
  const stock = tone === "stock";
  const sweep = tone === "sweep";
  const text = stock ? "text-sheet" : sweep ? "text-night" : "text-ink";
  const hover = stock ? "hover:bg-sheet/10" : sweep ? "hover:bg-night/6" : "hover:bg-ink/5";
  const cta = stock ? "bg-volt text-night" : sweep ? "bg-night text-sheet" : "bg-accent text-accent-ink";
  return (
    <header className={`relative z-40 w-full ${text} ${className}`}>
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-6 px-5 py-5 md:px-10">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hidden rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:inline-block ${hover}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/studio/forge-runner"
            className={`group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 ${cta}`}
          >
            Start designing
            <ArrowUpRight
              size={16}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </nav>
      </div>
    </header>
  );
}
