# Decisions and deviations from the rebuild plan

The plan in `docs/REBUILD_PLAN.md` was the starting point. These changes were made on purpose while building.

| Area | Plan said | What was built | Why |
|---|---|---|---|
| UI kit | shadcn/ui + Radix + vaul + cmdk | Hand-built primitives on native `<dialog>`, buttons, radio groups | Fewer dependencies, no interactive CLI setup, native focus trap and Escape. |
| Lighting environment | drei `Environment` preset (remote HDRI) | `RoomEnvironment` via PMREM, generated locally | The remote HDRI blocked rendering when offline, and it adds a third-party runtime dependency. |
| Post-processing | Outline + N8AO + SMAA | Emissive highlight on hover and selection | `@react-three/postprocessing` 3.2 has no N8AO; the composer complicates the transparent canvas. Outline can come back later. |
| Part mapping | Mesh name per part from gltfjsx | Named nodes created by `scripts/split-parts.mjs` | The optimizer merged materials and parts. Named nodes keep each part addressable. |
| Camera focus and explode | Hand-tuned per part | Derived from each part's bounding box | Removes the most fragile tuning step. |
| Model textures | Photo textures in the GLB | Stripped; PBR sets from ambientCG loaded separately | The engine uses its own materials, so the photo textures were dead weight. |
| Optimizer | `gltf-transform optimize` default | `--join false --instance false` after splitting | Default joins and dedupes away the per-part structure. |
| Dependency pins | Exact versions in plan | Exact pins for runtime; `^` allowed for some dev tools | `esbuild@0.25` conflicted with Vite 8; removed the explicit pin. |
| Next.js config | `cacheComponents` etc. from scaffold | Removed | Not needed for this app; keeps the caching model simple. |
| Lenis smooth scroll | Planned | Not used | Native scroll plus ScrollTrigger scrub works and keeps input behavior standard. |
| Canvas picking | Pointer capture for drags | No capture | `setPointerCapture` redirected pointer-up and broke R3F click detection. |

## Lint rule suppressions

Three files disable `react-hooks/immutability`. Three.js objects (materials, textures, the scene environment, mesh transforms) are mutated imperatively each frame, which the R3F docs describe. The React Compiler rule does not model that. Each file has a comment saying so.

## Not yet built (honest status)

- S4 turntable video, S6 tech pack PDF, and the video part of export.
- A1–A3 AR (Quick Look, WebXR, QR handoff).
- Drag-to-move for placed graphics is implemented but has no e2e test yet.
- Lighthouse, FPS and bundle-size budgets are not measured yet.
- Vercel deployment and the GitHub push have not been done.
- AI colorway route has no rate limit (the Upstash dependency was removed).

## 2026-10-18: redesign and scope cut

- The Haiku-built look was replaced with a new visual world ("Live Tech Pack"): cobalt stock, volt actions, Archivo condensed and Martian Mono, numbered part callouts tethered to the 3D shoe. Product facts live in `PRODUCT.md`.
- Removed at the owner's request: bag, sizes, pricing, mock checkout, the embed SDK (`public/embed.js`, `/embed`) and the `/docs` page.
- The home page uses one fixed, transparent R3F canvas. Each section marks a `data-slot`; the scroll choreographer in `components/landing/Landing.tsx` points the camera's view offset at that slot, so the shoe travels between sections without remounting.
- Material swatches are baked from the CC0 normal and roughness maps by `scripts/bake-swatches.mjs` and multiplied over a color in CSS, so they show the real grain in any color.
