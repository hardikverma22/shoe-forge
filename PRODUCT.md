# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone curious enough to open it: sneaker fans who want to make a pair their own, people who enjoy playing with well-made 3D toys, and the designers, engineers and brand people who will judge it as a product. The user asked that it be built "like a product anyone would want to explore", so no single audience leads; exploration and play lead.

## Product Purpose

Shoe Forge lets you design a sneaker in real-time 3D: pick any of its eight parts, give each one a real material and a color, add graphics or text on the surface, try curated colorways, and leave with a share link, a saved design, or an export (PNG, GLB). Success is a visitor who starts playing within seconds and leaves with a pair they made.

## Positioning

A configurator driven by a typed product schema and real PBR materials (leather, suede, knit, mesh, canvas, rubber, patent) on a real 3D model, where every part is individually editable by clicking the shoe itself.

## Operating Context

- Desktop and touch devices; the studio must work as a bottom sheet on phones.
- The 3D model is `public/models/forge-runner.glb` (eight parts: upper, laces, toe cap, lining, sole, side stripes, heel band, tongue patch).
- PBR texture sets live in `public/textures/<material>/` (CC0, ambientCG).

## Capabilities and Constraints

- Keep: part selection on the shoe, per-part material/color/finish, graphics (marks, upload, text) placed on the surface, curated + random colorways, undo/redo, command palette, share link, local "My designs" gallery, PNG/GLB export, light/dark.
- Removed at the user's request (2026-10-18): bag, sizes, mock checkout, and the embed SDK + docs page. Do not reintroduce price, cart or embed messaging.
- Stack is fixed: Next.js 16 (App Router), React 19, R3F 9 + drei 10, three 0.186, GSAP 3.15 (+ @gsap/react), Motion 14, Lenis, Tailwind 4, Zustand + zundo.

## Brand Commitments

- Name: Shoe Forge. Original product: Forge Runner.
- Since 2026-10-19 the user wants real brand silhouettes (Nike, Jordan, adidas, PUMA, Vans, Converse) and accepts the trademark risk for this side project. Brand names appear on the shoes and in the catalog; every page that lists them says it is a fan project, not affiliated or endorsed.
- The brand shoes are Sketchfab models under CC BY 4.0 (PUMA Suede: CC BY-NC 4.0, so the project stays non-commercial). Credit each author in the studio and on /shoes.
- Graphics library marks stay original (`public/marks/`).
- Copy in plain sentence case; buttons say exactly what they do.

## Evidence on Hand

- The Forge Runner model, seven texture sets, the original mark library and eight curated colorways (`lib/products/forge-runner.ts`).
- Seven brand shoes with three or four real colorways each (`lib/products/lineup.ts`, built by `scripts/import-shoes.mjs` from `scripts/shoes.mjs`). Air Force 1, Dunk Low and Old Skool are clean CG models (one material or clean UV island per part); AJ1, Gazelle, PUMA Suede and Chuck Taylor are scans whose parts are color regions of the texture.
- Prefer CG models with one material per part over photo scans. Scans with shattered texture atlases (the old Samba) cannot be split into clean parts and were dropped (Samba, Superstar, the old Old Skool scan).
- No customers, testimonials, press or usage numbers exist. Do not invent them.

## Product Principles

1. Play first: the shoe is touchable within one viewport, on every page that shows it.
2. The shoe is the interface: editing happens on the object, panels support it.
3. Real surfaces over flat color: materials must read as materials.
4. Nothing blocks exploration: no sign-up, no cart, no gates.

## Accessibility & Inclusion

WCAG 2.1 AA. Every 3D interaction has a keyboard/list equivalent; respect prefers-reduced-motion.
