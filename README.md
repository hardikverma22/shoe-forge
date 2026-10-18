# Shoe Forge

Design a sneaker part by part in real-time 3D. Click any of the eight parts, give it a real material (leather, suede, knit, mesh, canvas, rubber, patent) and a color, add graphics or text on the surface, try curated or AI-generated colorways, and leave with a share link, a saved design, a PNG or the 3D model.

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
| `node scripts/bake-swatches.mjs` | Bakes the lit material swatches used on the home page and in the studio |

## Structure

- `lib/products/` the product schema (zod) and the Forge Runner config. A new product is a GLB plus one config file.
- `lib/materials/` material presets and the texture cache.
- `lib/design/` design types, rules, the zustand store with undo, pricing, the URL codec, colorways, saved designs.
- `components/three/` the 3D viewport: model, stage, camera, graphics decals, capture.
- `components/studio/` the studio UI: toolbar, panels, command menu, shortcuts.
- `components/landing/` the home page: one fixed 3D canvas driven by the page's scroll (`lib/three/landing-rig.ts`), live part callouts, the exploded bill of materials, the swatch book and the colorway section.
- `app/api/colorway` Claude-backed colorway route. `app/api/og` share image.
- `scripts/` asset pipeline.
- `docs/DECISIONS.md` records each departure from the plan, with the reason. `PRODUCT.md` holds the product facts the design follows.

## Credits

- Textures: [ambientCG](https://ambientcg.com), CC0 1.0.
- 3D model: from the original Shoe Forge project. Confirm its license before commercial use.
