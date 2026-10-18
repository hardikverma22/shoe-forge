import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Shoe Forge home" className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M3 20h22l4-6H14l-3-4H3z" fill="currentColor" />
        <rect x="3" y="22" width="26" height="4" rx="1" fill="var(--color-gum)" />
      </svg>
      <span className="font-display text-2xl font-black tracking-tight">ShoeForge</span>
    </Link>
  );
}
