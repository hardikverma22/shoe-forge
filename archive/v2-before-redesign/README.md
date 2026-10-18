# Shoe Forge

A product configurator for footwear brands. Shoppers design a sneaker in real-time 3D, choose materials and colors per part, add graphics, get AI-generated colorways, and export a picture, a 3D model, or a share link. Brands embed it with one script tag.

Built with Next.js 16, React 19, three.js with React Three Fiber and drei, GSAP (ScrollTrigger and SplitText), Motion, Tailwind CSS 4, Zustand with zundo for undo/redo, and the Anthropic SDK for colorways.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The studio is at `/studio/forge-runner`.

Copy `.env.example` to `.env.local` to turn on AI colorways. Without `ANTHROPIC_API_KEY` the app uses a local generator and says so.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, strict mode |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end and accessibility tests (Playwright, Chromium) |
| `npm run assets:model` | Rebuilds `public/models/forge-runner.glb` from the source glTF |
| `npm run assets:textures` | Re-downloads the CC0 PBR texture sets from ambientCG |

## Structure

- `lib/products/` the product schema (zod) and the Forge Runner config. A new product is a GLB plus one config file.
- `lib/materials/` material presets and the texture cache.
- `lib/design/` design types, rules, the zustand store with undo, pricing, the URL codec, colorways, saved designs.
- `components/three/` the 3D viewport: model, stage, camera, graphics decals, capture.
- `components/studio/` the studio UI: toolbar, panels, command menu, shortcuts.
- `components/landing/` the landing page, including the pinned exploded-view scroll section.
- `app/api/colorway` Claude-backed colorway route. `app/api/og` share image.
- `public/embed.js` the embed SDK. `app/embed/[productId]` is the iframe it loads.
- `scripts/` asset pipeline.
- `docs/DECISIONS.md` records each departure from the plan, with the reason.

## Embed

```html
<div id="configurator"></div>
<script src="https://YOUR-SITE/embed.js"></script>
<script>
  ShoeForge.mount(document.getElementById("configurator"), { product: "forge-runner" });
</script>
```

Full reference at `/docs`.

## Credits

- Textures: [ambientCG](https://ambientcg.com), CC0 1.0.
- 3D model: from the original Shoe Forge project. Confirm its license before commercial use.
