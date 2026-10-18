export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 max-w-7xl border-t border-line px-5 py-10 text-sm text-ink-muted md:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row">
        <div className="space-y-2">
          <p className="font-display text-xl font-extrabold text-ink">ShoeForge</p>
          <p className="max-w-md">
            Built by Hardik Verma. The 3D model and textures are credited in the{" "}
            <a className="underline underline-offset-4 hover:text-accent" href="/docs#credits">
              credits
            </a>
            .
          </p>
        </div>
        <div className="flex gap-6">
          <a className="underline underline-offset-4 hover:text-accent" href="https://github.com/hardikverma22/shoe-forge">
            GitHub
          </a>
          <a className="underline underline-offset-4 hover:text-accent" href="/docs">
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
