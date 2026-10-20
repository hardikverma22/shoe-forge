# Shoe Forge

Design a sneaker part by part in real-time 3D. Pick a pair from the lineup (Air Force 1, Air Jordan 1, Dunk Low, Gazelle, PUMA Suede, Old Skool, Chuck Taylor, or the original Forge Runner), click any part, give it a real material (leather, suede, knit, mesh, canvas, rubber, patent) and a color, add graphics or text on the surface, try curated colorways, and leave with a share link, a saved design, a PNG or the 3D model.

Built with Next.js 16, React 19, three.js with React Three Fiber and drei, GSAP (ScrollTrigger and SplitText), Motion, Tailwind CSS 4 and Zustand with zundo for undo/redo.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The lineup is at `/shoes`, and each shoe's studio at `/studio/<id>`.


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
| `node scripts/import-shoes.mjs [id ...]` | Downloads the brand scans from Sketchfab (`SKETCHFAB_TOKEN` in `.env.local`), optimizes them and builds their color-region masks (config in `scripts/shoes.mjs`) |
| `node scripts/shoot-thumbs.mjs <url>` | Renders the catalog thumbnails in `public/shoes/` from a running dev server |
| `node scripts/bake-swatches.mjs` | Bakes the lit material swatches used on the home page and in the studio |

## Structure

- `lib/products/` the product schema (zod), the Forge Runner config and the brand lineup (`lineup.ts`). The Forge Runner is built from separate meshes; the brand scans are one textured mesh each, whose parts are color regions recolored in a shader (`components/three/TintModel.tsx`).
- `lib/materials/` material presets and the texture cache.
- `lib/design/` design types, rules, the zustand store with undo, pricing, the URL codec, colorways, saved designs.
- `components/three/` the 3D viewport: model, stage, camera, graphics decals, capture.
- `components/studio/` the studio UI: toolbar, panels, command menu, shortcuts.
- `components/landing/` the home page: one fixed 3D canvas driven by the page's scroll (`lib/three/landing-rig.ts`), live part callouts, the exploded bill of materials, the swatch book and the colorway section.
- `app/api/og` share image.
- `scripts/` asset pipeline.
- `docs/DECISIONS.md` records each departure from the plan, with the reason. `PRODUCT.md` holds the product facts the design follows.

## Credits

- Textures: [ambientCG](https://ambientcg.com), CC0 1.0.
- Forge Runner 3D model: from the original Shoe Forge project. Confirm its license before commercial use.
- Brand models (Sketchfab): kirilldrac78 (Air Force 1, Dunk Low), DeezVertz (Air Jordan 1), kzolozhkov (Gazelle), kanesk06 (Old Skool), turbopurr (Chuck Taylor), all CC BY 4.0; Toni Escribano Llorente (PUMA Suede), CC BY-NC 4.0.
- A fan project, not affiliated with, sponsored or endorsed by Nike, Jordan, adidas, PUMA, Vans or Converse.
