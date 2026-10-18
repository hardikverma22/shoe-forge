# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone curious enough to open it: sneaker fans who want to make a pair their own, people who enjoy playing with well-made 3D toys, and the designers, engineers and brand people who will judge it as a product. The user asked that it be built "like a product anyone would want to explore", so no single audience leads; exploration and play lead.

## Product Purpose

Shoe Forge lets you design a sneaker in real-time 3D: pick any of its eight parts, give each one a real material and a color, add graphics or text on the surface, try curated or AI-generated colorways, and leave with a share link, a saved design, or an export (PNG, GLB). Success is a visitor who starts playing within seconds and leaves with a pair they made.

## Positioning

A configurator driven by a typed product schema and real PBR materials (leather, suede, knit, mesh, canvas, rubber, patent) on a real 3D model, where every part is individually editable by clicking the shoe itself.

## Operating Context

- Desktop and touch devices; the studio must work as a bottom sheet on phones.
- The 3D model is `public/models/forge-runner.glb` (eight parts: upper, laces, toe cap, lining, sole, side stripes, heel band, tongue patch).
- PBR texture sets live in `public/textures/<material>/` (CC0, ambientCG).
- AI colorways go through `/api/colorway` (Claude); without an API key the app falls back to a local generator and says so.

## Capabilities and Constraints

- Keep: part selection on the shoe, per-part material/color/finish, graphics (marks, upload, text) placed on the surface, curated + random + AI colorways, undo/redo, command palette, share link, local "My designs" gallery, PNG/GLB export, light/dark.
- Removed at the user's request (2026-10-18): bag, sizes, mock checkout, and the embed SDK + docs page. Do not reintroduce price, cart or embed messaging.
- Stack is fixed: Next.js 16 (App Router), React 19, R3F 9 + drei 10, three 0.186, GSAP 3.15 (+ @gsap/react), Motion 14, Lenis, Tailwind 4, Zustand + zundo.

## Brand Commitments

- Name: Shoe Forge. Product: Forge Runner.
- No real-world brand names or logos (Nike, Adidas, etc.). Original marks only (`public/marks/`).
- Copy in plain sentence case; buttons say exactly what they do.

## Evidence on Hand

- One real 3D model, seven real texture sets, four original marks, eight curated colorways with names and one-line stories (`lib/products/forge-runner.ts`).
- No customers, testimonials, press or usage numbers exist. Do not invent them.

## Product Principles

1. Play first: the shoe is touchable within one viewport, on every page that shows it.
2. The shoe is the interface: editing happens on the object, panels support it.
3. Real surfaces over flat color: materials must read as materials.
4. Nothing blocks exploration: no sign-up, no cart, no gates.

## Accessibility & Inclusion

WCAG 2.1 AA. Every 3D interaction has a keyboard/list equivalent; respect prefers-reduced-motion.
