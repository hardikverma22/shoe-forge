import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-6 px-5">
      <h1 className="font-display text-6xl font-black">Page not found</h1>
      <p className="text-ink-muted">That page doesn&apos;t exist, or the design link is broken.</p>
      <Link className="rounded-[var(--radius-control)] bg-accent px-5 py-2.5 font-semibold text-accent-ink" href="/">
        Back to home
      </Link>
    </main>
  );
}
