import Link from "next/link";

/** A part callout (ring, dot, leader line) pointing at the wordmark. */
export function Logo({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Shoe Forge home"
      className={`group inline-flex items-center gap-1.5 ${className}`}
    >
      <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true" className="shrink-0">
        <circle cx="8" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle
          cx="8"
          cy="11"
          r="2.4"
          fill="currentColor"
          className="transition-transform duration-300 group-hover:scale-125"
          style={{ transformOrigin: "8px 11px" }}
        />
        <path d="M14.5 11H29" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="display text-[1.55rem] leading-none tracking-[-0.01em]">Shoe Forge</span>
    </Link>
  );
}
