import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "Docs" };

const SNIPPET = `<div id="configurator"></div>
<script src="https://YOUR-SITE/embed.js"></script>
<script>
  const cfg = ShoeForge.mount(document.getElementById("configurator"), {
    product: "forge-runner",
    theme: "light",
    accent: "2B3CFF",
  });
  cfg.on("change", ({ price }) => console.log("Price is now", price));
</script>`;

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-[var(--radius-control)] bg-ink p-4 text-sm leading-relaxed text-paper">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-14 px-5 py-12 md:px-10">
        <header className="space-y-4">
          <h1 className="font-display text-6xl font-black">Embed the configurator</h1>
          <p className="text-lg text-ink-muted">Add a product configurator to your store with one script tag. Everything runs in an iframe, so your page stays fast and isolated.</p>
        </header>

        <section aria-labelledby="quick" className="space-y-4">
          <h2 id="quick" className="font-display text-3xl font-extrabold">Quick start</h2>
          <Code>{SNIPPET}</Code>
        </section>

        <section aria-labelledby="options" className="space-y-4">
          <h2 id="options" className="font-display text-3xl font-extrabold">Options</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="py-2 pr-4">Option</th>
                <th className="py-2 pr-4">Values</th>
                <th className="py-2">What it does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr><td className="py-2 pr-4 font-mono">product</td><td className="pr-4">forge-runner</td><td>Which product to load.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">theme</td><td className="pr-4">light, dark</td><td>Colors of the studio chrome.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">accent</td><td className="pr-4">6-digit hex</td><td>Accent color for buttons and highlights.</td></tr>
              <tr><td className="py-2 pr-4 font-mono">height</td><td className="pr-4">CSS length</td><td>Height of the iframe. Default 620px.</td></tr>
            </tbody>
          </table>
        </section>

        <section aria-labelledby="methods" className="space-y-4">
          <h2 id="methods" className="font-display text-3xl font-extrabold">Methods</h2>
          <ul className="space-y-3 text-sm">
            <li><code className="font-mono">setPart(partId, {"{ color?, material? }"})</code>: change one part. Rules apply, so an invalid material is rejected with an error event.</li>
            <li><code className="font-mono">getDesign()</code>: returns a Promise with the design name and part settings.</li>
            <li><code className="font-mono">on(event, callback)</code>: subscribe to events.</li>
            <li><code className="font-mono">destroy()</code>: remove the iframe and listeners.</li>
          </ul>
        </section>

        <section aria-labelledby="events" className="space-y-4">
          <h2 id="events" className="font-display text-3xl font-extrabold">Events</h2>
          <ul className="space-y-3 text-sm">
            <li><code className="font-mono">ready</code>: the studio has loaded.</li>
            <li><code className="font-mono">change</code>: a part changed. Payload: {"{ design, price }"}.</li>
            <li><code className="font-mono">error</code>: a request was refused. Payload: {"{ message }"}.</li>
          </ul>
        </section>

        <section aria-labelledby="security" className="space-y-3">
          <h2 id="security" className="font-display text-3xl font-extrabold">Security</h2>
          <p className="text-sm text-ink-muted">Messages are checked against the host origin on both sides and validated with schemas. Replies go only to that origin, never to a wildcard.</p>
        </section>

        <section id="credits" aria-labelledby="credits-h" className="space-y-3">
          <h2 id="credits-h" className="font-display text-3xl font-extrabold">Credits</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
            <li>Textures: ambientCG, CC0 1.0.</li>
            <li>3D model: the shoe model from the original Shoe Forge project. Confirm its license before commercial use.</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
