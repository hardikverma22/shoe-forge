import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/studio/forge-runner", label: "Studio" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#brands", label: "For brands" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-accent">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
      <nav aria-label="Main mobile" className="flex gap-5 overflow-x-auto px-5 pb-3 text-sm font-medium md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 transition-colors hover:text-accent">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
