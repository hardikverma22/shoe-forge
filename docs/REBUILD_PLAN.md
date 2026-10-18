# Shoe Forge 2.0 — Rebuild Plan

> Written 2026-10-18. This plan is meant to be executed step by step by an AI coding agent (Claude Haiku) or a human.
> Every version number, file path, command and code block here was chosen on purpose. **Follow it literally.** When something does not work, use the "When stuck" rules in section 0. Do not improvise new architecture.

---

## Table of contents

0. [Rules for the executor (read first)](#0-rules-for-the-executor-read-first)
1. [Vision: what we are building and why a company would want it](#1-vision)
2. [Audit of the current project](#2-audit-of-the-current-project)
3. [Feature list with acceptance criteria](#3-feature-list)
4. [Design system](#4-design-system)
5. [Tech stack (pinned versions)](#5-tech-stack-pinned-versions)
6. [Architecture](#6-architecture)
7. [Execution phases (the actual work)](#7-execution-phases)
8. [Quality bars: performance, accessibility, testing](#8-quality-bars)
9. [Deployment](#9-deployment)
10. [Known pitfalls (R3F + Next.js + GSAP)](#10-known-pitfalls)
11. [Final checklist](#11-final-checklist)

---

## 0. Rules for the executor (read first)

1. **Work one task at a time, in order.** Tasks are numbered `P<phase>.<task>`. Do not start a task until the previous one passes its "Done when" checks.
2. **After every task, run:**
   ```bash
   npm run lint && npm run typecheck && npm run build
   ```
   All three must pass. Then commit with the commit message given in the task. Never commit a failing build.
3. **Never change a pinned version** in section 5 unless `npm install` fails. If it fails, install the closest version that works, and write the change in `docs/DECISIONS.md` with the reason.
4. **Copy code blocks exactly**, then adapt only the parts marked `// TODO(executor)`.
5. **Do not invent library APIs.** If you are unsure an API exists, open the package source in `node_modules/<pkg>` and check (`grep -rn "functionName" node_modules/<pkg>/dist | head`). If it does not exist, find the real API in the package's README or `.d.ts` files.
6. **Look at what you build.** After any UI task, run the dev server and take a screenshot in the browser (desktop 1440×900 and mobile 390×844). Compare with the description in the task. Fix visual problems before committing.
7. **When stuck** (same error after 3 attempts): stop, write the error, what you tried and your best guess into `docs/BLOCKERS.md`, then move on to the next task that does not depend on it.
8. **Keep TypeScript strict.** No `any` unless a line comment explains why. No `@ts-ignore`.
9. **Client components:** every file that uses hooks, R3F, GSAP, Motion, or browser APIs starts with `"use client";`.
10. **No trademarks.** Do not use Nike, Puma, Adidas, Jordan or any real brand names or logos anywhere (they are in the old project; they must go). Use the original "Forge" marks we create in P2.4.
11. **Write user-facing copy in plain sentence case.** Buttons say exactly what they do ("Save design", "Download PNG"), never "Submit" or "Click here". Don't use all-caps labels.

---

## 1. Vision

### 1.1 One-sentence pitch

**Shoe Forge is a product configurator engine for footwear brands: shoppers design a sneaker in real time 3D, see it in their room with AR, and check out. Brands embed it on their store with one script tag and get a production-ready tech pack for every order.**

### 1.2 Who it's for

| Audience | What they need | Which features prove it |
|---|---|---|
| Shoppers / sneakerheads | Fun, fast, beautiful customization they can share | Studio, AI colorways, share links, AR, turntable video |
| Footwear / DTC brands (buyers) | A configurator that raises conversion and plugs into their store | Product-agnostic schema, rules engine, live pricing, embed SDK, analytics events, tech-pack export |
| Hiring managers / engineers | Evidence of senior-level frontend + 3D skill | Clean architecture, typed schema, tests, perf budget, a11y, docs, case study |

### 1.3 What makes it "buyable" (the differentiators)

1. **Product-agnostic engine.** Products are described by a typed JSON schema (parts, allowed materials, prices, camera focus points, decal zones, rules). Adding a new shoe = drop in a GLB + write one config file. This is what companies pay for (Threekit, Zakeke and others sell exactly this).
2. **Real PBR materials**, not flat colors: leather, suede, knit, mesh, canvas, rubber, patent, each with normal and roughness maps, finish sliders, and pattern scale.
3. **Click-on-the-shoe editing** with hover outline, plus an accessible part list.
4. **Custom graphics:** upload your own image or type text, then place it by clicking on the shoe surface and drag to move it.
5. **AI colorway generator:** "a pair inspired by Tokyo at night" → a full palette applied to every part, using the Claude API.
6. **Undo / redo, keyboard shortcuts, command palette.** Feels like a pro tool.
7. **Share and save:** design encoded in the URL, local "My designs" library with thumbnails, dynamic share image (shoebox-label style).
8. **Exports:** high-res PNG (transparent option), 360° turntable video (WebM/MP4), GLB model, and a **PDF tech pack** (part → material → color HEX → price) that a factory could use.
9. **AR:** "See it on your floor" — WebXR on Android, Quick Look (USDZ) on iOS, QR code handoff on desktop.
10. **Commerce-ready:** live price, size picker, rules engine ("patent leather is not available for the sole"), bag drawer, mock checkout.
11. **Embed SDK:** `<script src=".../embed.js">` + `postMessage` API (`setPart`, `getDesign`, `onChange`, `onAddToBag`) with a docs page.
12. **Cinematic landing page:** the shoe takes itself apart into its parts as you scroll, each part labeled like a technical drawing, then snaps back together. This is the one "wow" moment.

### 1.4 Non-goals (do not build)

- User accounts, a real database, real payments. (Section 7, phase 15 lists these as optional stretch work only after everything else is done.)
- A 3D modeling tool. We only configure existing models.

---

## 2. Audit of the current project

What exists today (`master`, commit `54c88e5`):

- Vite 4 + React 18 + R3F 8 + drei 9 + three 0.152 + Valtio + Framer Motion 10 + GSAP 3.11, plain JavaScript, Tailwind 3. Deployed to GitHub Pages.
- One model `public/shoe.gltf` (+ `shoe.bin`): one mesh `shoe` with **8 primitives** → R3F nodes `shoe`, `shoe_1` … `shoe_7`, using materials `laces, mesh, caps, inner, sole, stripes, band, patch`. Has `POSITION`, `NORMAL`, `TEXCOORD_0` (UVs exist, so textures and decals work). Bounding box ≈ 0.52 × 0.35 × 0.47 units.
- 6 photo textures used as color maps (floor, table, jeans…) which look like wallpaper on a shoe, 6 colors, 2 trademarked decals (Nike, Puma).

Problems to fix in the rebuild:

| # | Problem | Where | Fix in 2.0 |
|---|---|---|---|
| 1 | Mutates the shared, cached GLTF materials directly | `Shoe.jsx` `materials.mesh.color = …` | Create our own `MeshPhysicalMaterial` per part (P3.3) |
| 2 | Creates a new `gsap.timeline()` and `new ScrollTrigger({})` on **every render** (no deps on `useLayoutEffect`) → leaks and jank | `Shoe.jsx` | `useGSAP` with scope + cleanup (P10) |
| 3 | `useFrame` adds `sin()/250` to position every frame → shoe drifts forever | `Shoe.jsx` | drei `<Float>` (P3.5) |
| 4 | Repeated hand-written code for 8 parts | `Shoe.jsx`, `Overlay.jsx` | Schema-driven loops (P3.1) |
| 5 | `preserveDrawingBuffer: true` + `querySelector("canvas")` for download | `Overlay.jsx` | Proper render-to-blob export (P7.3) |
| 6 | Loading state is `if (progress) setloaded(true)` → shows app at 1% | `App.jsx` | Real progress loader (P3.7) |
| 7 | Trademarked logos | `public/nike.png`, `puma.png` | Original marks (P2.4) |
| 8 | Photo textures as albedo, no normal/roughness maps, flat lighting (`pointLight` + `ambientLight`) | `MainCanvas.jsx` | PBR texture sets + environment lighting + contact shadows (P2.3, P3.4) |
| 9 | No TypeScript, tests, a11y, keyboard support, or reduced-motion support | everywhere | Sections 8 and P13 |
| 10 | `leva` and `react-color` installed but unused or dated | `package.json` | Removed |

**Keep:** `public/shoe.gltf` + `shoe.bin` (we optimize them in P2.1), and the idea of a scroll-driven intro.

---

## 3. Feature list

MVP = must ship. Stretch = only after all MVP items pass.

### 3.1 Studio (configurator) — MVP

| ID | Feature | Acceptance criteria |
|---|---|---|
| F1 | Part selection | Hover a part on the 3D shoe → outline + cursor pointer + tooltip with the part name. Click selects it. The part list in the side panel shows the same selection. Keys `[` and `]` cycle parts. |
| F2 | Color | Curated swatches (12 per product) + a full picker (HEX input, hue/saturation) + "recent colors" (last 8). Changing color animates (~250 ms lerp), it doesn't jump. |
| F3 | Material | 7 material presets (Leather, Suede, Knit, Mesh, Canvas, Rubber, Patent). Each part only shows the materials its schema allows. Material change cross-fades. |
| F4 | Finish | Sliders: roughness, sheen (fabrics only), pattern scale. "Reset part" button. |
| F5 | Camera | View buttons: Side, Front, Back, Top, Sole, 3/4. Selecting a part flies the camera to its focus point (GSAP, 0.9 s, `power3.inOut`). Orbit/zoom are clamped so the shoe never leaves frame. Auto-rotate toggle. Double-click empty space resets the view. |
| F6 | Undo / redo | `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`, toolbar buttons, 100 steps. One color drag = one history step. |
| F7 | Command palette | `Cmd/Ctrl+K` opens a palette: jump to part, apply preset, change view, export, toggle theme. |
| F8 | Lighting stage | 4 stage presets: Studio, Daylight, Sunset, Night. Soft contact shadow under the shoe. Backdrop color follows the theme. |
| F9 | Responsive | ≥1024 px: right side panel. <1024 px: bottom sheet (drawer) with tabs. Touch orbit works. No horizontal scroll at 360 px. |
| F10 | Live price | Price updates when materials or graphics change, with a number roll animation. |

### 3.2 Graphics — MVP

| ID | Feature | Acceptance criteria |
|---|---|---|
| G1 | Built-in marks | 4 original Forge marks (SVG → PNG) in a grid. |
| G2 | Upload | Accept PNG/JPG/SVG ≤ 2 MB. Non-square images keep their aspect ratio. Error message if too big or the wrong type. |
| G3 | Text | Type up to 12 characters, choose from 3 fonts, choose a color. Rendered to a canvas texture. |
| G4 | Placement | "Place on shoe" mode: click on the upper → the graphic appears at that point, aligned to the surface. Drag to move it along the surface. Sliders: size, rotation. Up to 4 graphics per design. Delete with the `Delete` key or a button. |

### 3.3 Colorways — MVP

| ID | Feature | Acceptance criteria |
|---|---|---|
| C1 | Presets | 8 curated colorways per product, shown as clickable chips with mini palette previews. |
| C2 | Surprise me | Generates a harmonious random colorway (color theory: analogous / complementary / triadic + neutrals for the sole). `R` key. |
| C3 | AI colorway | A text prompt → a server route calls Claude → returns a validated palette + materials + a name and a one-line story. Shows a loading shimmer on the shoe while it waits. Without an API key it falls back to C2 and says so. Rate-limited. |

### 3.4 Save, share, export — MVP

| ID | Feature | Acceptance criteria |
|---|---|---|
| S1 | Share link | "Copy link" puts the design into the URL (`/studio/<product>?d=<compressed>`). Opening that URL restores the exact design. Uploaded images are not included in links, and the UI says so. |
| S2 | My designs | Save to the browser (IndexedDB) with name + thumbnail. List, rename, duplicate, delete on `/gallery`. |
| S3 | PNG | 1×, 2×, 4× resolution, optional transparent background. |
| S4 | Turntable video | 6 s 360° spin recorded from the canvas, downloads `.webm` (or `.mp4` where the browser supports it). Shows a progress ring. |
| S5 | GLB | Exports the configured model as `.glb`. |
| S6 | Tech pack PDF | A4 PDF: product name, design name, date, 3 renders (side, top, back), table of part / material / HEX / finish / price, graphics list, total price, QR code to the share link. |
| S7 | Share image | `/api/og?d=…` returns a 1200×630 PNG styled like a shoebox label with the palette and design name. Used as the `og:image` for share links. |

### 3.5 AR — MVP

| ID | Feature | Acceptance criteria |
|---|---|---|
| A1 | iOS | "See in your space" exports USDZ and opens AR Quick Look. |
| A2 | Android | WebXR `immersive-ar` session with hit-test: tap to place the shoe on the floor at real size (~28 cm long). |
| A3 | Desktop | Shows a QR code for the share link with "Scan with your phone to see it in AR". |

### 3.6 Commerce — MVP (mock)

| ID | Feature | Acceptance criteria |
|---|---|---|
| M1 | Rules engine | The schema can forbid a material on a part, or require one part to match another ("laces match the upper"). Forbidden options show disabled with a tooltip explaining why. |
| M2 | Size | EU 36–47 / US selector, required before adding to the bag. |
| M3 | Bag | Drawer with thumbnails, quantity, price, remove. Stored locally. "Checkout" goes to a mock confirmation page with an order number and the tech pack download. |

### 3.7 Platform — MVP

| ID | Feature | Acceptance criteria |
|---|---|---|
| E1 | Embed route | `/embed/<product>` renders only the studio (no site header), themable via query params (`accent`, `theme`). |
| E2 | Embed SDK | `public/embed.js` creates an iframe and exposes `ShoeForge.mount(el, options)` returning `{ setPart, setDesign, getDesign, on(event, cb), destroy }`. Messages validated with zod on both sides. Origin checked. |
| E3 | Docs | `/docs` page: quick start, options, events, a live embedded example. |
| E4 | Analytics events | One `track(event, props)` function; events: `part_selected`, `material_changed`, `color_changed`, `graphic_added`, `ai_colorway_requested`, `export`, `share`, `add_to_bag`. Sent to Vercel Analytics and to the embed host via `postMessage`. |

### 3.8 Marketing site — MVP

| ID | Feature | Acceptance criteria |
|---|---|---|
| L1 | Hero | Shoe falls into the frame and settles with a soft bounce; headline letters reveal with GSAP SplitText; one CTA "Start designing". |
| L2 | Exploded view | Pinned section: as you scroll, the shoe separates into its 8 parts, each with a leader line and label (name + default material), then reassembles. Scrubbed with ScrollTrigger. |
| L3 | Material run | Pinned section: the shoe's upper changes Leather → Suede → Knit → Patent as you scroll, with a big material name that swaps. |
| L4 | For brands | Section with the embed code snippet (copy button), 4 capability blocks, and a live mini embed. |
| L5 | Gallery strip | Horizontally scrolling preset colorways; click opens them in the studio. |
| L6 | Footer | Credits (model and texture licenses), GitHub link, author. |
| L7 | Reduced motion | With `prefers-reduced-motion: reduce`, no scroll scrubbing or pinning; show static frames instead. |

### 3.9 Stretch (only after everything above passes)

- X1 Compare mode: two designs side by side, synced cameras (drei `View`).
- X2 Second product (`MaterialsVariantsShoe` from Khronos, CC BY 4.0) to prove the engine is product-agnostic.
- X3 Real-time collaboration (Liveblocks or Supabase Realtime).
- X4 Accounts + cloud saves (Supabase).
- X5 Stripe test-mode checkout.
- X6 WebGPU renderer when R3F v10 is stable.

---

## 4. Design system

### 4.1 Concept: "The sample room"

Sneaker brands build every new shoe in a sample room: a cool, evenly lit photo cyclorama, technical drawings pinned on the wall, swatch cards, and the gum-rubber color of a classic sole. The site borrows that vocabulary:

- **Backgrounds** look like a photo-studio sweep (cool grey with a soft spotlight), not a flat page.
- **Technical-drawing details** (thin leader lines, part callouts, dimension marks) appear only where they carry information: the exploded view, the tech pack, part labels.
- **The shoebox label** is the motif for share cards, saved-design cards and the tech pack header.
- **One bold moment:** the exploded-view scroll. Everything else stays quiet and disciplined.

### 4.2 Color tokens

Light theme ("Day studio"):

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#EEF1F4` | Page background (cyclorama) |
| `--surface` | `#FFFFFF` | Panels, sheets |
| `--ink` | `#10162B` | Primary text, icons |
| `--ink-muted` | `#5A6378` | Secondary text |
| `--line` | `#D3D9E1` | Borders, dividers, leader lines |
| `--accent` | `#2B3CFF` | Ultramarine. Primary actions, selection, focus ring |
| `--accent-ink` | `#FFFFFF` | Text on accent |
| `--gum` | `#C08A55` | Gum-sole tan. Price, highlights, "new" markers, sparingly |
| `--danger` | `#D6332F` | Errors, delete |

Dark theme ("Night shift"):

| Token | Hex |
|---|---|
| `--paper` | `#0D111C` |
| `--surface` | `#161B29` |
| `--ink` | `#E8ECF4` |
| `--ink-muted` | `#8A93A8` |
| `--line` | `#252C3D` |
| `--accent` | `#7C88FF` |
| `--accent-ink` | `#0D111C` |
| `--gum` | `#D9A46F` |
| `--danger` | `#FF6B66` |

Rules: accent is for interactive things only. Gum appears at most once per screen. Never put a gradient behind text. Text on `--paper` must meet 4.5:1 contrast (both themes pass with these values; re-check if you change any).

### 4.3 Typography

- **Display:** `Big Shoulders` (Google Fonts, weights 700–900). A condensed athletic face from Chicago street signage. Used for headlines, part names in the exploded view, and the price. Set tight: `letter-spacing: -0.01em`, `line-height: 0.9` for display sizes.
- **UI and body:** `Instrument Sans` (weights 400, 500, 600). Use `font-variant-numeric: tabular-nums` for prices, HEX values and dimensions.
- Load both with `next/font/google`. If `Big_Shoulders` is not exported by your Next version, use `Big_Shoulders_Display`.

Type scale (rem, ratio ≈ 1.333):

| Token | Size | Font | Use |
|---|---|---|---|
| `display-xl` | clamp(4rem, 12vw, 11rem) | Big Shoulders 900 | Hero headline |
| `display-l` | clamp(3rem, 7vw, 6rem) | Big Shoulders 800 | Section headlines |
| `display-m` | 2.25rem | Big Shoulders 800 | Panel titles, price |
| `title` | 1.25rem | Instrument Sans 600 | Card titles |
| `body` | 1rem / 1.6 | Instrument Sans 400 | Body copy, max 70 characters per line |
| `small` | 0.875rem / 1.5 | Instrument Sans 500 | Labels, captions |
| `micro` | 0.75rem / 1.4 | Instrument Sans 500 | Leader-line labels, HEX values |

Don'ts: no all-caps eyebrow labels above headings, no single word in a different color or italic inside headlines, no `→` appended to buttons, no middle-dot meta strings.

### 4.4 Shape, space, elevation

- Spacing scale: Tailwind default (4 px base). Panels use 24 px padding on desktop, 16 px on mobile.
- Radius **by hierarchy**, not one value for everything: swatches are circles; buttons `10px`; panels and sheets `20px`; the canvas has no radius.
- Elevation: panels float on the canvas with `backdrop-blur(16px)` and `background: color-mix(in oklab, var(--surface) 82%, transparent)` and a 1 px `--line` border. No grey drop shadows on cards. Only the bottom sheet and dialogs get a shadow: `0 24px 60px -20px rgb(16 22 43 / 0.35)`.

### 4.5 Motion principles

| Kind | Tool | Spec |
|---|---|---|
| Scroll storytelling (landing) | GSAP + ScrollTrigger + Lenis | Scrubbed, `scrub: 0.6`, pinned sections |
| One page-load moment (hero) | GSAP timeline + SplitText | Letters rise from a mask, 0.04 s stagger, `power4.out`, 1.1 s total |
| Camera moves | GSAP on a target object | 0.9 s `power3.inOut` |
| UI response (open, select, confirm) | Motion (`motion/react`) | Springs: `{ type: "spring", stiffness: 420, damping: 32 }` for panels; `layoutId` for the selected swatch ring |
| Material and color change | `useFrame` lerp | Color lerp factor 0.18 per frame; ~250 ms |
| Price change | Motion `animate` number | 0.4 s |

Rules: no fade-up animation on every section. No hover animations on every card. Motion only when the user acts or for the single hero moment. Respect `prefers-reduced-motion` everywhere (`gsap.matchMedia()` and Motion's `useReducedMotion()`).

### 4.6 Layout wireframes

**Landing (desktop):**
```
┌──────────────────────────────────────────────────────────────┐
│ ShoeForge                      Studio  Gallery  For brands  ◐ │  ← header, transparent
│                                                              │
│  BUILD                                    [3D shoe, big,     │
│  YOUR                                      falls in, floats] │
│  PAIR.                                                       │
│  Design a sneaker in 3D, see it on your floor,               │
│  and order it.          [Start designing]                     │
├──────────────────────────────────────────────────────────────┤
│ (pinned)        laces ──┐                                     │
│  Eight pieces.   tongue ─┼─  [shoe exploded into 8 parts]     │
│  One pair.       sole ───┘    labels with leader lines        │
├──────────────────────────────────────────────────────────────┤
│ (pinned)   LEATHER  → SUEDE → KNIT → PATENT (big type swaps)  │
│            [shoe upper changes material]                      │
├──────────────────────────────────────────────────────────────┤
│ For brands:  <script> snippet [Copy]  | live mini embed       │
│ 4 capability blocks (different sizes, not identical cards)    │
├──────────────────────────────────────────────────────────────┤
│ Colorway strip  ← horizontal scroll →                         │
├──────────────────────────────────────────────────────────────┤
│ Footer: credits, licenses, GitHub                             │
└──────────────────────────────────────────────────────────────┘
```
Text is left-aligned. The shoe sits on the right half on desktop and below the headline on mobile.

**Studio (desktop ≥1024 px):**
```
┌──────────────────────────────────────────────────────────────┐
│ ← ShoeForge   Forge Runner  "Untitled design"  ↶ ↷   ⌘K  Share  Bag(1) │
├───────────────────────────────────────────────┬──────────────┤
│                                               │ Parts        │
│                                               │ ● Upper      │
│             [ 3D canvas, full bleed ]         │ ○ Laces …    │
│                                               ├──────────────┤
│                                               │ Material     │
│  [Side][Front][Back][Top][Sole][3/4] ⟳        │ Color        │
│                                               │ Finish       │
│                                               ├──────────────┤
│                                               │ €149  [Size] │
│                                               │ [Add to bag] │
└───────────────────────────────────────────────┴──────────────┘
   Left floating rail: Design | Graphics | Colorways | Stage | Export
```

**Studio (mobile <1024 px):** canvas fills the screen; a bottom sheet with 3 snap points (peek 96 px: price + add to bag; half: tabs; full). The view buttons become a horizontal chip row above the sheet.

---

## 5. Tech stack (pinned versions)

Checked against npm on 2026-10-18. Pin these exact versions (no `^`) in `package.json`.

| Package | Version | Why |
|---|---|---|
| `next` | 16.4.2 | App Router, route handlers (AI + OG), image optimization, Vercel deploy |
| `react`, `react-dom` | 19.3.1 | R3F 9 requires React `>=19 <19.4` |
| `typescript` | 5.9.3 | **Not 7.x.** TS 7 (native port) is too new for the Next/ESLint toolchain |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | CSS-first config |
| `shadcn` (CLI, via `npx`) | 4.22.0 | Accessible primitives (Radix) we own and restyle |
| `three` | 0.186.1 | |
| `@types/three` | 0.186.0 | |
| `@react-three/fiber` | 9.8.2 | React 19 line |
| `@react-three/drei` | 10.7.9 | Matches fiber 9 |
| `@react-three/postprocessing` | 3.2.0 | Outline, SMAA, N8AO |
| `postprocessing` | 6.39.5 | Peer of the above |
| `@react-three/xr` | 6.6.32 | WebXR AR on Android |
| `three-mesh-bvh` | 0.9.16 | Fast raycasting for hover/decal placement |
| `gsap` | 3.15.0 | All plugins (ScrollTrigger, SplitText, Flip, CustomEase) are free, including commercial use |
| `@gsap/react` | 2.1.2 | `useGSAP` hook with automatic cleanup |
| `motion` | 14.3.0 | UI animation (`import { motion } from "motion/react"`) |
| `lenis` | 1.3.27 | Smooth scroll synced with ScrollTrigger |
| `zustand` | 5.0.15 | State |
| `zundo` | 2.3.0 | Undo/redo middleware for zustand |
| `immer` | 11.1.21 | Simple nested updates |
| `zod` | 4.6.7 | Schema validation (product config, URL decode, AI output, embed messages) |
| `lz-string` | 1.5.0 | Compress designs into URLs |
| `idb-keyval` | 6.3.0 | IndexedDB for saved designs |
| `cmdk` | 1.1.1 | Installed by shadcn `command` |
| `react-colorful` | 5.8.1 | Small, accessible color picker |
| `jspdf` | 4.2.1 | Tech pack PDF |
| `qrcode` | latest 1.x | QR codes (AR handoff, tech pack) |
| `@anthropic-ai/sdk` | 0.135.0 | AI colorways |
| `@upstash/ratelimit` + `@upstash/redis` | 2.2.0 / 1.39.0 | Rate limit the AI route (optional, only if env vars exist) |
| `@vercel/analytics` | 2.0.1 | Events |
| `next-themes` | 0.4.6 | Light/dark |
| `lucide-react` | 1.59.0 | Icons |
| `sonner` | 2.0.8 | Toasts (via shadcn) |
| `vaul` | via shadcn `drawer` | Mobile bottom sheet |
| Dev: `vitest` 5.0.5, `@testing-library/react`, `jsdom`, `@playwright/test` 1.64.1, `prettier` 3.9.10, `prettier-plugin-tailwindcss` 0.8.1, `@gltf-transform/cli` 4.5.1, `gltfjsx` 6.5.3, `r3f-perf` 7.2.3 | | |

**Do not install:** `@google/model-viewer` (requires three ^0.183, conflicts), `leva`, `react-color`, `valtio`, `framer-motion` (renamed to `motion`).

---

## 6. Architecture

### 6.1 Folder structure (final)

```
shoe-forge/
├─ app/
│  ├─ layout.tsx                 # fonts, ThemeProvider, Analytics, Toaster
│  ├─ globals.css                # Tailwind v4 + tokens
│  ├─ page.tsx                   # landing
│  ├─ studio/[productId]/page.tsx
│  ├─ gallery/page.tsx
│  ├─ bag/confirmation/page.tsx
│  ├─ docs/page.tsx
│  ├─ embed/[productId]/page.tsx
│  ├─ api/colorway/route.ts      # AI colorway (Claude)
│  └─ api/og/route.tsx           # share image
├─ components/
│  ├─ ui/                        # shadcn (generated, then restyled)
│  ├─ site/                      # Header, Footer, ThemeToggle, Logo
│  ├─ landing/                   # Hero, ExplodedSection, MaterialRun, ForBrands, ColorwayStrip, LandingCanvas
│  ├─ studio/                    # StudioShell, PartList, MaterialPicker, ColorPicker, FinishControls,
│  │                             # GraphicsPanel, ColorwaysPanel, StagePanel, ExportPanel, ViewBar,
│  │                             # PriceBlock, SizePicker, BagDrawer, CommandMenu, Toolbar, MobileSheet
│  └─ three/                     # ProductModel, Stage, CameraRig, PartInteraction, Graphics,
│                                # SceneCapture, ARButton, Loader
├─ lib/
│  ├─ products/
│  │  ├─ schema.ts               # zod schema + types for ProductDef
│  │  ├─ forge-runner.ts         # config for the existing shoe
│  │  └─ index.ts                # registry: getProduct(id)
│  ├─ materials/
│  │  ├─ presets.ts              # 7 material presets
│  │  └─ factory.ts              # build MeshPhysicalMaterial from preset + part config
│  ├─ design/
│  │  ├─ types.ts                # Design type
│  │  ├─ store.ts                # zustand + zundo + immer
│  │  ├─ defaults.ts             # build default design from ProductDef
│  │  ├─ rules.ts                # rules engine
│  │  ├─ pricing.ts              # price calculator
│  │  ├─ codec.ts                # encode/decode URL
│  │  ├─ colorways.ts            # presets + harmony generator
│  │  └─ saved.ts                # IndexedDB save/list/delete
│  ├─ export/                    # png.ts, video.ts, glb.ts, usdz.ts, techpack.ts
│  ├─ embed/protocol.ts          # zod message schemas shared by host + iframe
│  ├─ analytics.ts
│  ├─ scroll/                    # LenisProvider, landing scroll progress store
│  └─ utils.ts                   # cn(), clamp, etc.
├─ public/
│  ├─ models/forge-runner.glb    # optimized
│  ├─ textures/<material>/{color,normal,roughness}.webp
│  ├─ marks/*.png                # original Forge marks
│  ├─ env/studio.hdr             # optional local HDRI
│  └─ embed.js                   # SDK (built from lib/embed/sdk.ts)
├─ scripts/                      # fetch-textures.mjs, optimize-model.sh, build-embed.mjs
├─ tests/                        # unit (vitest) + e2e (playwright)
└─ docs/                         # this plan, DECISIONS.md, BLOCKERS.md, CASE_STUDY.md
```

### 6.2 Data model

```ts
// lib/products/schema.ts  (summary — full code in P3.1)
ProductDef {
  id: string                       // "forge-runner"
  name: string                     // "Forge Runner"
  modelUrl: string                 // "/models/forge-runner.glb"
  basePrice: number                // 129
  currency: "EUR" | "USD"
  realLengthMeters: number         // 0.28 (for AR scale)
  parts: PartDef[]
  palette: string[]                // 12 curated swatches
  cameraViews: CameraView[]        // side/front/back/top/sole/three-quarter
  graphicZones: string[]           // part ids that accept graphics
  rules: Rule[]
  colorways: ColorwayPreset[]
}
PartDef {
  id: string                       // "upper"
  label: string                    // "Upper"
  meshName: string                 // "shoe_1" (node name in the GLB)
  allowedMaterials: MaterialId[]
  default: PartConfig
  focus: { position: Vec3; target: Vec3 }
  explode: Vec3                    // offset for the exploded view
}
PartConfig { material: MaterialId; color: string /* #RRGGBB */; roughness?: number; sheen?: number; scale?: number }
Design {
  version: 1
  productId: string
  name: string
  parts: Record<partId, PartConfig>
  graphics: Graphic[]              // max 4
  stage: "studio" | "daylight" | "sunset" | "night"
}
Graphic { id; kind: "mark" | "upload" | "text"; src?: string; text?: string; font?: string; color?: string;
          partId: string; position: Vec3; normal: Vec3; rotation: number; scale: number }
```

### 6.3 State flow

```
              ┌──────────── URL ?d=… (codec.decode, zod-validated) ──────────┐
              ▼                                                              │
  ProductDef ─► defaults.ts ─► useDesignStore (zustand + zundo + immer) ─────┤
                                  │  actions: setPartColor, setPartMaterial,  │
                                  │  applyColorway, addGraphic, moveGraphic…  │
                                  │  every action passes through rules.ts     │
          ┌───────────────────────┼─────────────────────────┐                 │
          ▼                       ▼                         ▼                 │
  three/ProductModel      studio/* panels           pricing.ts → PriceBlock   │
  (reads with selectors,  (read + call actions)                               │
   lerps in useFrame)                                                         │
          │                                                                   │
          ▼                                                                   │
  export/* (png, video, glb, usdz, techpack)    codec.encode ─► Share link ───┘
```

A separate small store `useStudioUI` holds UI-only state: selected part, hovered part, active tab, placing-graphic mode, auto-rotate, camera view. It is **not** in undo history.

### 6.4 Rendering pipeline (studio)

```
<Canvas dpr={[1, 2]} shadows={false} gl={{ antialias: false }} camera={{ fov: 35 }}>
  <PerformanceMonitor> + <AdaptiveDpr pixelated={false}>
  <Stage preset=…>      → <Environment> (preset or local HDR) + key light + <ContactShadows>
  <Bvh firstHitOnly>    → <ProductModel> (meshes with our MeshPhysicalMaterials)
                           └─ <Graphics> (drei <Decal> per graphic)
  <CameraRig>           → OrbitControls (clamped) + GSAP fly-to
  <EffectComposer multisampling={0}> → <N8AO> <Outline> <SMAA>
  <SceneCapture>        → registers a capture() function for exports
</Canvas>
```

---

## 7. Execution phases

Each task has: **Goal**, **Steps**, **Done when**, **Commit**.

### Phase 0 — Prepare the repository

#### P0.1 Preserve the old version

Steps:
```bash
cd /Users/hardik/Projects/shoe-forge
git checkout master && git pull
git tag v1-legacy
git push origin v1-legacy
git checkout -b rebuild/v2
```
Done when: `git tag` shows `v1-legacy`, current branch is `rebuild/v2`.
Commit: none.

#### P0.2 Scaffold Next.js next to the old app, then move it in

`create-next-app` refuses non-empty folders, so scaffold in a sibling folder.

```bash
cd /Users/hardik/Projects
npx create-next-app@16.4.2 shoe-forge-next --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes
```
Then move the old app's useful assets aside and replace the project files:
```bash
cd /Users/hardik/Projects/shoe-forge
mkdir -p /tmp/sf-legacy && cp public/shoe.gltf public/shoe.bin /tmp/sf-legacy/
git rm -r -q src index.html vite.config.js tailwind.config.js postcss.config.js .eslintrc.cjs package.json package-lock.json public
rsync -a --exclude .git --exclude node_modules --exclude README.md /Users/hardik/Projects/shoe-forge-next/ ./
mkdir -p public/models/source && cp /tmp/sf-legacy/shoe.gltf /tmp/sf-legacy/shoe.bin public/models/source/
rm -rf /Users/hardik/Projects/shoe-forge-next
npm install
```
Pin exact versions: edit `package.json` so `next`, `react`, `react-dom`, `typescript` match section 5 exactly (no `^`), then `npm install`.

Add scripts to `package.json`:
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "format": "prettier --write ."
}
```
In `tsconfig.json` make sure `"strict": true` and add `"noUncheckedIndexedAccess": true`.

Done when: `npm run dev` shows the default Next page at http://localhost:3000; lint, typecheck and build pass.
Commit: `chore: scaffold Next.js 16 app, keep legacy model assets`

#### P0.3 Install dependencies

```bash
npm i --save-exact three@0.186.1 @react-three/fiber@9.8.2 @react-three/drei@10.7.9 @react-three/postprocessing@3.2.0 postprocessing@6.39.5 @react-three/xr@6.6.32 three-mesh-bvh@0.9.16 gsap@3.15.0 @gsap/react@2.1.2 motion@14.3.0 lenis@1.3.27 zustand@5.0.15 zundo@2.3.0 immer@11.1.21 zod@4.6.7 lz-string@1.5.0 idb-keyval@6.3.0 react-colorful@5.8.1 jspdf@4.2.1 qrcode @anthropic-ai/sdk@0.135.0 @upstash/ratelimit@2.2.0 @upstash/redis@1.39.0 @vercel/analytics@2.0.1 next-themes@0.4.6 lucide-react@1.59.0
npm i -D --save-exact @types/three@0.186.0 @types/qrcode vitest@5.0.5 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test@1.64.1 prettier@3.9.10 prettier-plugin-tailwindcss@0.8.1 @gltf-transform/cli@4.5.1 gltfjsx@6.5.3 r3f-perf@7.2.3
```
If npm reports a peer-dependency conflict, read it. Do **not** use `--force`. `--legacy-peer-deps` is allowed only for `@react-three/xr` or `r3f-perf`; write that in `docs/DECISIONS.md`.

Create `.prettierrc`:
```json
{ "plugins": ["prettier-plugin-tailwindcss"], "semi": true, "singleQuote": false, "printWidth": 100 }
```

Create `.env.example`:
```
# AI colorways (optional; without it the app uses the local generator)
ANTHROPIC_API_KEY=
# Optional, rate limiting for /api/colorway
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Make sure `.gitignore` contains `.env*.local` and `.env`.

Done when: install succeeds, build passes.
Commit: `chore: add 3D, animation, state and tooling dependencies`

#### P0.4 shadcn/ui

```bash
npx shadcn@4.22.0 init
```
Choose: style default, base color neutral, CSS variables yes. Then:
```bash
npx shadcn@4.22.0 add button tooltip slider tabs dialog drawer sheet command popover dropdown-menu toggle-group input label scroll-area separator sonner select switch badge skeleton
```
Done when: `components/ui/*` exist, `lib/utils.ts` has `cn()`, build passes.
Commit: `chore: add shadcn/ui primitives`

---

### Phase 1 — Design system and app shell

#### P1.1 Tokens and fonts

Replace the token section of `app/globals.css` (keep the `@import "tailwindcss";` line and any `@import "tw-animate-css"` shadcn added at the top). Map shadcn's variable names to our tokens so shadcn components automatically use our palette:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --paper: #eef1f4;
  --surface: #ffffff;
  --ink: #10162b;
  --ink-muted: #5a6378;
  --line: #d3d9e1;
  --accent-brand: #2b3cff;
  --accent-ink: #ffffff;
  --gum: #c08a55;
  --danger: #d6332f;

  /* shadcn mapping */
  --background: var(--paper);
  --foreground: var(--ink);
  --card: var(--surface);
  --card-foreground: var(--ink);
  --popover: var(--surface);
  --popover-foreground: var(--ink);
  --primary: var(--accent-brand);
  --primary-foreground: var(--accent-ink);
  --secondary: color-mix(in oklab, var(--ink) 6%, var(--surface));
  --secondary-foreground: var(--ink);
  --muted: color-mix(in oklab, var(--ink) 5%, var(--surface));
  --muted-foreground: var(--ink-muted);
  --accent: color-mix(in oklab, var(--accent-brand) 10%, var(--surface));
  --accent-foreground: var(--ink);
  --destructive: var(--danger);
  --border: var(--line);
  --input: var(--line);
  --ring: var(--accent-brand);
  --radius: 10px;
}

.dark {
  --paper: #0d111c;
  --surface: #161b29;
  --ink: #e8ecf4;
  --ink-muted: #8a93a8;
  --line: #252c3d;
  --accent-brand: #7c88ff;
  --accent-ink: #0d111c;
  --gum: #d9a46f;
  --danger: #ff6b66;
}

@theme inline {
  --color-paper: var(--paper);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-line: var(--line);
  --color-brand: var(--accent-brand);
  --color-brand-ink: var(--accent-ink);
  --color-gum: var(--gum);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --font-display: var(--font-big-shoulders);
  --font-sans: var(--font-instrument-sans);
}

@layer base {
  * { @apply border-border; }
  html { color-scheme: light; }
  html.dark { color-scheme: dark; }
  body {
    @apply bg-paper text-ink font-sans antialiased;
    /* cyclorama: soft spotlight on a cool sweep */
    background-image: radial-gradient(120% 80% at 70% 30%, color-mix(in oklab, var(--surface) 70%, transparent), transparent 60%);
    background-attachment: fixed;
  }
  :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  .tabular { font-variant-numeric: tabular-nums; }
}

@utility glass {
  background: color-mix(in oklab, var(--surface) 82%, transparent);
  backdrop-filter: blur(16px);
  border: 1px solid var(--line);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
If shadcn generated extra variables (e.g. `--chart-1`, `--sidebar`), keep them below ours.

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const display = Big_Shoulders({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-big-shoulders" });
const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-instrument-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Shoe Forge — design your sneaker in 3D", template: "%s · Shoe Forge" },
  description: "Design a sneaker in real-time 3D, see it on your floor in AR, and export a production tech pack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
```
(If `@vercel/analytics/react` is not the right import path in v2, check `node_modules/@vercel/analytics/package.json` `exports` and use `@vercel/analytics/next` instead.)

Done when: a test page shows Big Shoulders headlines and Instrument Sans body text; toggling the `dark` class on `<html>` switches colors.
Commit: `feat(design): tokens, fonts, theme provider`

#### P1.2 Site chrome

Create:
- `components/site/Logo.tsx` — an SVG wordmark: "ShoeForge" in Big Shoulders 900 with a small anvil-shaped glyph (simple path: a trapezoid on a rectangle). `aria-label="Shoe Forge home"`.
- `components/site/ThemeToggle.tsx` — shadcn `Button` variant ghost, icon `Sun`/`Moon` from lucide, uses `useTheme()`. Must render a placeholder of the same size until mounted (avoid hydration mismatch).
- `components/site/Header.tsx` — logo left; nav links "Studio" (`/studio/forge-runner`), "Gallery", "For brands" (`/#brands`), "Docs"; theme toggle right. On the landing page it is transparent and becomes `glass` after scrolling 40 px (`useMotionValueEvent(scrollY, …)` from `motion/react`). Mobile: links collapse into a shadcn `Sheet`.
- `components/site/Footer.tsx` — credits block (fill in licenses in P2), GitHub link, "Built by Hardik Verma".

Done when: header and footer look right in both themes at 1440 px and 390 px; tab order is logical; focus ring visible.
Commit: `feat(site): header, footer, theme toggle, logo`

---

### Phase 2 — Asset pipeline

#### P2.1 Optimize the shoe model

```bash
mkdir -p scripts
npx gltf-transform copy public/models/source/shoe.gltf /tmp/shoe.glb
npx gltf-transform optimize /tmp/shoe.glb public/models/forge-runner.glb --compress meshopt --texture-compress webp
npx gltf-transform inspect public/models/forge-runner.glb
```
Save these commands in `scripts/optimize-model.sh`.

Then inspect node and material names:
```bash
npx gltfjsx public/models/forge-runner.glb --types --output /tmp/ForgeRunner.tsx
grep -n "geometry=\|material=" /tmp/ForgeRunner.tsx
```
Write the list of mesh node names and their material names into `docs/DECISIONS.md` under "Model nodes". Expected (from the original): 8 meshes, materials `laces, mesh, caps, inner, sole, stripes, band, patch`. **The mesh names may change after optimization** (e.g. `shoe`, `shoe_1` … or `Shoe_1`…). Use the real names from this output in P3.2.

Meshopt needs a decoder at runtime. drei's `useGLTF(url, draco?, meshopt = true)` enables `MeshoptDecoder` by default — verify in `node_modules/@react-three/drei/core/Gltf.*` or `useGLTF.*`.

Done when: `public/models/forge-runner.glb` exists and is smaller than the original `shoe.bin` (619 KB). `public/models/source/` stays in git as the source of truth.
Commit: `build(assets): optimized meshopt GLB for Forge Runner`

#### P2.2 Model license check

The original model looks like the shoe from the pmndrs/three.js shoe configurator demos. Search for its origin (Sketchfab / pmndrs sandboxes). Write what you find in `docs/DECISIONS.md` under "Asset licenses". If the license is unclear, add a footer credit "Shoe model adapted from the pmndrs community demos" and note in `docs/BLOCKERS.md` that the author should confirm the license before any commercial use.

Commit: `docs: record model provenance`

#### P2.3 PBR texture sets

All textures from ambientCG (CC0 — free for commercial use, no attribution required, but we credit anyway). Download URL format: `https://ambientcg.com/get?file=<ID>_1K-JPG.zip` (verified working 2026-10-18 for the IDs below).

Candidate IDs per material (download all, look at each `*_Color.jpg`, and keep the one that looks best on a shoe; small-scale grain is better than big patterns):

| Material | Candidate ambientCG IDs |
|---|---|
| leather | `Leather037`, `Leather026`, `Leather011` |
| suede | `Fabric030`, `Fabric026` (use only normal + roughness; suede look comes from sheen) |
| knit | `Fabric048`, `Fabric062` |
| mesh | `Fabric045`, `Fabric062` |
| canvas | `Fabric026`, `Fabric030` |
| rubber | `Rubber004` |
| patent | `Plastic010` (normal only; patent = clearcoat) |

`scripts/fetch-textures.mjs`:
```js
// Usage: node scripts/fetch-textures.mjs
// Downloads ambientCG 1K JPG sets, extracts Color/NormalGL/Roughness, converts to 1024px WebP.
import { mkdir, writeFile, rm } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const SETS = {
  leather: "Leather037",
  suede: "Fabric030",
  knit: "Fabric048",
  mesh: "Fabric045",
  canvas: "Fabric026",
  rubber: "Rubber004",
  patent: "Plastic010",
}; // TODO(executor): swap IDs after you look at the candidates

const tmp = path.resolve(".tmp-textures");
await mkdir(tmp, { recursive: true });

for (const [name, id] of Object.entries(SETS)) {
  const url = `https://ambientcg.com/get?file=${id}_1K-JPG.zip`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const zip = path.join(tmp, `${id}.zip`);
  await writeFile(zip, Buffer.from(await res.arrayBuffer()));
  const dir = path.join(tmp, id);
  execSync(`mkdir -p "${dir}" && unzip -o -q "${zip}" -d "${dir}"`);
  const out = path.resolve("public/textures", name);
  await mkdir(out, { recursive: true });
  const map = { Color: "color", NormalGL: "normal", Roughness: "roughness" };
  for (const [suffix, target] of Object.entries(map)) {
    const src = path.join(dir, `${id}_1K-JPG_${suffix}.jpg`);
    // sips is built into macOS; on Linux use `npx sharp-cli` instead
    execSync(`npx --yes sharp-cli -i "${src}" -o "${out}/${target}.webp" -f webp -q 82 resize 1024 1024`, { stdio: "inherit" });
  }
  console.log("ok", name, id);
}
await rm(tmp, { recursive: true, force: true });
```
If file names inside the zip differ, list them (`unzip -l`) and adjust `src`. If `sharp-cli` flags differ, check `npx sharp-cli --help`.

Also download one studio HDRI from Poly Haven (CC0), 1K: e.g. `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr` → `public/env/studio.hdr`. If that URL 404s, pick any studio HDRI at polyhaven.com/hdris (category "studio") and use its 1K `.hdr` link. Use drei `Environment` presets for the other stages.

Delete the old photo textures (they are not in the new `public/` anyway).

Done when: `public/textures/<7 materials>/{color,normal,roughness}.webp` exist, each < 400 KB; credits added to `Footer.tsx` and `docs/DECISIONS.md`.
Commit: `build(assets): CC0 PBR texture sets and studio HDRI`

#### P2.4 Original Forge marks

Create 4 simple SVG marks in `public/marks/` (white fill on transparent, viewBox 0 0 512 512): `anvil.svg` (anvil silhouette), `spark.svg` (8-point star), `wave.svg` (a single swoosh-free wave line, thick stroke — must not resemble any brand), `monogram.svg` ("SF" in Big Shoulders converted to paths, or simple geometric letters). Also export each to a 512 px PNG (`npx sharp-cli -i x.svg -o x.png`), since decals use PNG textures.

Done when: 4 SVG + 4 PNG files exist and look clean on dark and light backgrounds.
Commit: `feat(assets): original Forge graphic marks`

---

### Phase 3 — Core 3D engine

#### P3.1 Product schema

`lib/products/schema.ts`:
```ts
import { z } from "zod";

export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3>;

export const MaterialId = z.enum(["leather", "suede", "knit", "mesh", "canvas", "rubber", "patent"]);
export type MaterialId = z.infer<typeof MaterialId>;

export const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const PartConfig = z.object({
  material: MaterialId,
  color: Hex,
  roughness: z.number().min(0).max(1).optional(),
  sheen: z.number().min(0).max(1).optional(),
  scale: z.number().min(0.25).max(4).optional(),
});
export type PartConfig = z.infer<typeof PartConfig>;

export const PartDef = z.object({
  id: z.string(),
  label: z.string(),
  meshName: z.string(),
  allowedMaterials: z.array(MaterialId).min(1),
  default: PartConfig,
  focus: z.object({ position: Vec3, target: Vec3 }),
  explode: Vec3,
  description: z.string(),
});
export type PartDef = z.infer<typeof PartDef>;

export const Rule = z.discriminatedUnion("type", [
  z.object({ type: z.literal("forbidMaterial"), part: z.string(), material: MaterialId, reason: z.string() }),
  z.object({ type: z.literal("matchColor"), part: z.string(), follows: z.string(), reason: z.string() }),
  z.object({ type: z.literal("maxGraphics"), max: z.number().int().min(0) }),
]);
export type Rule = z.infer<typeof Rule>;

export const CameraView = z.object({ id: z.string(), label: z.string(), position: Vec3, target: Vec3 });
export type CameraView = z.infer<typeof CameraView>;

export const ColorwayPreset = z.object({
  id: z.string(),
  name: z.string(),
  parts: z.record(z.string(), PartConfig.partial()),
});
export type ColorwayPreset = z.infer<typeof ColorwayPreset>;

export const ProductDef = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  modelUrl: z.string(),
  basePrice: z.number(),
  currency: z.enum(["EUR", "USD"]),
  realLengthMeters: z.number(),
  modelScale: z.number(),
  parts: z.array(PartDef).min(1),
  palette: z.array(Hex).length(12),
  cameraViews: z.array(CameraView),
  graphicZones: z.array(z.string()),
  rules: z.array(Rule),
  colorways: z.array(ColorwayPreset),
});
export type ProductDef = z.infer<typeof ProductDef>;
```

#### P3.2 Forge Runner config

`lib/products/forge-runner.ts`. Map the 8 materials of the model to friendly part names (use the real mesh names from P2.1):

| model material | part id | label | allowed materials |
|---|---|---|---|
| mesh | `upper` | Upper | leather, suede, knit, mesh, canvas, patent |
| laces | `laces` | Laces | canvas, knit |
| caps | `toecap` | Toe cap | leather, suede, patent, rubber |
| inner | `lining` | Lining | mesh, canvas, knit |
| sole | `sole` | Sole | rubber |
| stripes | `stripes` | Side stripes | leather, suede, patent |
| band | `heel` | Heel band | leather, suede, patent, rubber |
| patch | `tongue` | Tongue patch | leather, suede, canvas |

Write the file with `ProductDef.parse({...})` so a bad config fails loudly at import. Use:
- `basePrice: 129`, `currency: "EUR"`, `realLengthMeters: 0.28`, `modelScale: 3` (tune in P3.5 so the shoe fills ~60% of the canvas width).
- `palette`: `["#F4F4F2","#1B1B1F","#2B3CFF","#C08A55","#D6332F","#F2C14E","#3A7D44","#7A4FD0","#FF8A3D","#8FA3B8","#5C3A21","#E86FA1"]`.
- `rules`: `forbidMaterial sole patent` ("Patent leather cracks on a flexing sole"), `matchColor laces follows upper`?? — **no**, make that a colorway option, not a rule; use instead `maxGraphics 4`.
- `explode` offsets: start with sole `[0,-0.35,0]`, upper `[0,0.12,0]`, laces `[0,0.45,0.05]`, toecap `[0,0.05,0.35]`, lining `[0,0.3,-0.1]`, stripes `[0.35,0.05,0]`, heel `[0,0.1,-0.4]`, tongue `[0,0.55,0.15]`. Tune visually in P10.2.
- `focus` points and `cameraViews`: start from the old app's camera positions (`[0.10, -0.57, 2.94]` worked for the configurator) and tune with the temporary helper in P3.6.
- 8 colorways, each with a real name and a reason to exist, e.g. "Gum classic" (white leather upper, gum sole `#C08A55`), "Ultramarine" (all-blue knit), "Night run" (black knit, reflective-looking patent stripes), "Clay court" (off-white canvas + orange), "Forest" (green suede + gum), "Volcanic" (charcoal suede + red heel), "Sorbet" (pink + yellow mesh), "Monochrome" (all `#F4F4F2` mixed materials).

`lib/products/index.ts`:
```ts
import { forgeRunner } from "./forge-runner";
import type { ProductDef } from "./schema";

const products: Record<string, ProductDef> = { [forgeRunner.id]: forgeRunner };
export function getProduct(id: string): ProductDef | undefined { return products[id]; }
export const productIds = Object.keys(products);
```
Done when: `npm run typecheck` passes; a vitest test in `tests/unit/products.test.ts` imports the product and checks every part's `default.material` is in `allowedMaterials`.
Commit: `feat(engine): typed product schema and Forge Runner config`

#### P3.3 Material presets and factory

`lib/materials/presets.ts`:
```ts
import type { MaterialId } from "@/lib/products/schema";

export type MaterialPreset = {
  id: MaterialId;
  label: string;
  description: string;
  roughness: number;
  metalness: number;
  sheen: number;            // 0..1, fabrics get sheen
  sheenRoughness: number;
  clearcoat: number;        // patent gets clearcoat
  clearcoatRoughness: number;
  normalScale: number;
  repeat: number;           // texture tiling on the UVs
  useColorMap: boolean;     // false = tint only (keeps colors clean)
  priceDelta: number;       // added to base price per part using it
};

export const MATERIALS: Record<MaterialId, MaterialPreset> = {
  leather: { id: "leather", label: "Leather", description: "Smooth full-grain leather", roughness: 0.55, metalness: 0, sheen: 0, sheenRoughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.6, normalScale: 0.6, repeat: 3, useColorMap: false, priceDelta: 12 },
  suede: { id: "suede", label: "Suede", description: "Soft napped suede", roughness: 0.95, metalness: 0, sheen: 1, sheenRoughness: 0.8, clearcoat: 0, clearcoatRoughness: 0, normalScale: 0.4, repeat: 4, useColorMap: false, priceDelta: 15 },
  knit: { id: "knit", label: "Knit", description: "Engineered knit, breathable", roughness: 0.85, metalness: 0, sheen: 0.6, sheenRoughness: 0.6, clearcoat: 0, clearcoatRoughness: 0, normalScale: 1, repeat: 6, useColorMap: false, priceDelta: 8 },
  mesh: { id: "mesh", label: "Mesh", description: "Open performance mesh", roughness: 0.8, metalness: 0, sheen: 0.3, sheenRoughness: 0.5, clearcoat: 0, clearcoatRoughness: 0, normalScale: 1.2, repeat: 8, useColorMap: false, priceDelta: 0 },
  canvas: { id: "canvas", label: "Canvas", description: "Heavy cotton canvas", roughness: 0.9, metalness: 0, sheen: 0.2, sheenRoughness: 0.7, clearcoat: 0, clearcoatRoughness: 0, normalScale: 0.8, repeat: 5, useColorMap: false, priceDelta: 0 },
  rubber: { id: "rubber", label: "Rubber", description: "Durable natural rubber", roughness: 0.7, metalness: 0, sheen: 0, sheenRoughness: 0, clearcoat: 0.05, clearcoatRoughness: 0.8, normalScale: 0.5, repeat: 4, useColorMap: false, priceDelta: 0 },
  patent: { id: "patent", label: "Patent", description: "High-gloss patent leather", roughness: 0.2, metalness: 0, sheen: 0, sheenRoughness: 0, clearcoat: 1, clearcoatRoughness: 0.05, normalScale: 0.1, repeat: 3, useColorMap: false, priceDelta: 20 },
};
export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];
```

`lib/materials/factory.ts` — one hook that loads all texture sets once, and a function that applies a preset + part config to an existing `MeshPhysicalMaterial` (we mutate **our own** material, never the GLTF one):
```ts
"use client";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { MATERIALS, MATERIAL_IDS } from "./presets";
import type { MaterialId, PartConfig } from "@/lib/products/schema";

type TexSet = { color: THREE.Texture; normal: THREE.Texture; roughness: THREE.Texture };

const paths = MATERIAL_IDS.flatMap((id) => [
  `/textures/${id}/color.webp`,
  `/textures/${id}/normal.webp`,
  `/textures/${id}/roughness.webp`,
]);

export function useMaterialTextures(): Record<MaterialId, TexSet> {
  const textures = useTexture(paths);
  const out = {} as Record<MaterialId, TexSet>;
  MATERIAL_IDS.forEach((id, i) => {
    const [color, normal, roughness] = [textures[i * 3]!, textures[i * 3 + 1]!, textures[i * 3 + 2]!];
    color.colorSpace = THREE.SRGBColorSpace;     // only the color map is sRGB
    for (const t of [color, normal, roughness]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    }
    out[id] = { color, normal, roughness };
  });
  return out;
}
useTexture.preload(paths);

export function createPartMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color: "#ffffff" });
}

/** Applies material maps and scalar params. Color is lerped separately in useFrame. */
export function applyPreset(mat: THREE.MeshPhysicalMaterial, id: MaterialId, cfg: PartConfig, tex: Record<MaterialId, TexSet>) {
  const p = MATERIALS[id];
  const set = tex[id];
  // Each part needs its own texture clones so repeat can differ per part.
  const repeat = p.repeat * (cfg.scale ?? 1);
  const clone = (t: THREE.Texture) => { const c = t.clone(); c.repeat.set(repeat, repeat); c.needsUpdate = true; return c; };
  mat.map?.dispose(); mat.normalMap?.dispose(); mat.roughnessMap?.dispose();
  mat.map = p.useColorMap ? clone(set.color) : null;
  mat.normalMap = clone(set.normal);
  mat.normalScale.set(p.normalScale, p.normalScale);
  mat.roughnessMap = clone(set.roughness);
  mat.roughness = cfg.roughness ?? p.roughness;
  mat.metalness = p.metalness;
  mat.sheen = cfg.sheen ?? p.sheen;
  mat.sheenRoughness = p.sheenRoughness;
  mat.sheenColor.set("#ffffff");
  mat.clearcoat = p.clearcoat;
  mat.clearcoatRoughness = p.clearcoatRoughness;
  mat.needsUpdate = true;
}
```
Note: `Texture.clone()` shares the image, so this is cheap. Dispose clones when replaced (done above).

Done when: typecheck passes. (Visual check comes in P3.5.)
Commit: `feat(engine): PBR material presets and factory`

#### P3.4 Design store (zustand + zundo + immer)

`lib/design/types.ts`:
```ts
import type { PartConfig, Vec3 } from "@/lib/products/schema";
export type StageId = "studio" | "daylight" | "sunset" | "night";
export type Graphic = {
  id: string; kind: "mark" | "upload" | "text";
  src?: string; text?: string; font?: string; color?: string;
  partId: string; position: Vec3; normal: Vec3; rotation: number; scale: number;
};
export type Design = {
  version: 1; productId: string; name: string;
  parts: Record<string, PartConfig>; graphics: Graphic[]; stage: StageId;
};
```

`lib/design/defaults.ts`:
```ts
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "./types";
export function defaultDesign(p: ProductDef): Design {
  return {
    version: 1, productId: p.id, name: "Untitled design", stage: "studio", graphics: [],
    parts: Object.fromEntries(p.parts.map((part) => [part.id, { ...part.default }])),
  };
}
```

`lib/design/rules.ts`:
```ts
import type { MaterialId, ProductDef } from "@/lib/products/schema";
export function materialBlockedReason(p: ProductDef, partId: string, m: MaterialId): string | null {
  const part = p.parts.find((x) => x.id === partId);
  if (!part) return "Unknown part";
  if (!part.allowedMaterials.includes(m)) return `${part.label} isn't made in this material`;
  const rule = p.rules.find((r) => r.type === "forbidMaterial" && r.part === partId && r.material === m);
  return rule && rule.type === "forbidMaterial" ? rule.reason : null;
}
export function maxGraphics(p: ProductDef): number {
  const r = p.rules.find((x) => x.type === "maxGraphics");
  return r && r.type === "maxGraphics" ? r.max : 4;
}
```

`lib/design/store.ts`:
```ts
"use client";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import type { Design, Graphic, StageId } from "./types";
import type { MaterialId, PartConfig, ProductDef } from "@/lib/products/schema";
import { materialBlockedReason, maxGraphics } from "./rules";

type Actions = {
  load: (d: Design) => void;
  setPartColor: (partId: string, color: string) => void;
  setPartMaterial: (p: ProductDef, partId: string, m: MaterialId) => string | null; // returns error reason
  setPartFinish: (partId: string, patch: Pick<PartConfig, "roughness" | "sheen" | "scale">) => void;
  resetPart: (p: ProductDef, partId: string) => void;
  applyParts: (parts: Record<string, Partial<PartConfig>>) => void;
  addGraphic: (p: ProductDef, g: Graphic) => string | null;
  updateGraphic: (id: string, patch: Partial<Graphic>) => void;
  removeGraphic: (id: string) => void;
  setStage: (s: StageId) => void;
  rename: (name: string) => void;
};
export type DesignState = { design: Design | null } & Actions;

export const useDesignStore = create<DesignState>()(
  temporal(
    immer((set, get) => ({
      design: null,
      load: (d) => set((s) => { s.design = d; }),
      setPartColor: (id, color) => set((s) => { if (s.design?.parts[id]) s.design.parts[id].color = color; }),
      setPartMaterial: (p, id, m) => {
        const reason = materialBlockedReason(p, id, m);
        if (reason) return reason;
        set((s) => {
          const part = s.design?.parts[id];
          if (!part) return;
          part.material = m; delete part.roughness; delete part.sheen; // finish resets to the preset
        });
        return null;
      },
      setPartFinish: (id, patch) => set((s) => { const part = s.design?.parts[id]; if (part) Object.assign(part, patch); }),
      resetPart: (p, id) => set((s) => {
        const def = p.parts.find((x) => x.id === id);
        if (def && s.design) s.design.parts[id] = { ...def.default };
      }),
      applyParts: (parts) => set((s) => {
        if (!s.design) return;
        for (const [id, patch] of Object.entries(parts)) {
          const part = s.design.parts[id];
          if (part) Object.assign(part, patch);
        }
      }),
      addGraphic: (p, g) => {
        const d = get().design;
        if (!d) return "No design loaded";
        if (d.graphics.length >= maxGraphics(p)) return `You can add up to ${maxGraphics(p)} graphics`;
        set((s) => { s.design?.graphics.push(g); });
        return null;
      },
      updateGraphic: (id, patch) => set((s) => {
        const g = s.design?.graphics.find((x) => x.id === id);
        if (g) Object.assign(g, patch);
      }),
      removeGraphic: (id) => set((s) => { if (s.design) s.design.graphics = s.design.graphics.filter((g) => g.id !== id); }),
      setStage: (stage) => set((s) => { if (s.design) s.design.stage = stage; }),
      rename: (name) => set((s) => { if (s.design) s.design.name = name.slice(0, 40); }),
    })),
    {
      limit: 100,
      partialize: (state) => ({ design: state.design }),
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    },
  ),
);

/** Wrap continuous gestures (color drag, slider drag) so they make ONE history entry. */
export const history = {
  undo: () => useDesignStore.temporal.getState().undo(),
  redo: () => useDesignStore.temporal.getState().redo(),
  pause: () => useDesignStore.temporal.getState().pause(),
  resume: () => useDesignStore.temporal.getState().resume(),
  clear: () => useDesignStore.temporal.getState().clear(),
};
```
For a drag: on `pointerdown` call `history.pause()`… but pausing means the final value isn't recorded. Correct pattern: on pointerdown, **record nothing**; while dragging, call the action with history paused; on pointerup, `resume()` and call the action once more with the final value. Put that in a helper `useHistoryGesture()` in `lib/design/useHistoryGesture.ts`:
```ts
"use client";
import { useRef } from "react";
import { history } from "./store";
export function useHistoryGesture<T>(apply: (v: T) => void) {
  const dragging = useRef(false);
  return {
    onStart: () => { if (!dragging.current) { dragging.current = true; history.pause(); } },
    onChange: (v: T) => apply(v),
    onEnd: (v: T) => { dragging.current = false; history.resume(); apply(v); },
  };
}
```
**Check:** zundo stores the state *before* each change. Write a vitest test: start, 10 onChange calls, onEnd → exactly 1 undo returns to the original color. If it fails, adjust (e.g. call `apply(initialValue)` silently first, then resume). Get the test green before moving on.

`lib/design/ui-store.ts` (no history):
```ts
"use client";
import { create } from "zustand";
type UI = {
  selectedPart: string | null; hoveredPart: string | null;
  view: string | null; autoRotate: boolean;
  placing: null | { kind: "mark" | "upload" | "text"; src?: string; text?: string; font?: string; color?: string };
  selectedGraphic: string | null;
  set: (patch: Partial<Omit<UI, "set">>) => void;
};
export const useStudioUI = create<UI>((set) => ({
  selectedPart: null, hoveredPart: null, view: null, autoRotate: false, placing: null, selectedGraphic: null,
  set: (patch) => set(patch),
}));
```
Done when: unit tests for store actions, rules, and the history gesture pass (`npm test`).
Commit: `feat(engine): design store with undo/redo and rules`

#### P3.5 ProductModel component

`components/three/ProductModel.tsx`:
```tsx
"use client";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { applyPreset, createPartMaterial, useMaterialTextures } from "@/lib/materials/factory";

type Props = {
  product: ProductDef;
  design: Design;
  /** 0..1, used by the landing page exploded view */
  explode?: React.RefObject<number>;
  onPartPointer?: (partId: string | null, e?: ThreeEvent<PointerEvent>) => void;
  onPartClick?: (partId: string, e: ThreeEvent<MouseEvent>) => void;
  children?: (partId: string) => React.ReactNode; // graphics per part
};

export function ProductModel({ product, design, explode, onPartPointer, onPartClick, children }: Props) {
  const { nodes } = useGLTF(product.modelUrl) as unknown as { nodes: Record<string, THREE.Mesh> };
  const tex = useMaterialTextures();

  // our own materials, one per part, created once
  const mats = useMemo(
    () => Object.fromEntries(product.parts.map((p) => [p.id, createPartMaterial()])) as Record<string, THREE.MeshPhysicalMaterial>,
    [product],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  // apply material presets when material/finish changes
  useEffect(() => {
    for (const part of product.parts) {
      const cfg = design.parts[part.id];
      const mat = mats[part.id];
      if (cfg && mat) applyPreset(mat, cfg.material, cfg, tex);
    }
  }, [design.parts, mats, product.parts, tex]);

  // smooth color transitions + exploded offsets
  const target = useMemo(() => new THREE.Color(), []);
  const groupRefs = useRef<Record<string, THREE.Group | null>>({});
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.001, dt); // frame-rate independent lerp (~250ms)
    for (const part of product.parts) {
      const cfg = design.parts[part.id];
      const mat = mats[part.id];
      if (cfg && mat) mat.color.lerp(target.set(cfg.color), k);
      const g = groupRefs.current[part.id];
      if (g) {
        const e = explode?.current ?? 0;
        g.position.set(part.explode[0] * e, part.explode[1] * e, part.explode[2] * e);
      }
    }
  });

  return (
    <group scale={product.modelScale} dispose={null}>
      {product.parts.map((part) => {
        const node = nodes[part.meshName];
        if (!node) { console.warn(`Mesh ${part.meshName} not found`); return null; }
        return (
          <group key={part.id} ref={(g) => { groupRefs.current[part.id] = g; }}>
            <mesh
              name={part.id}
              geometry={node.geometry}
              material={mats[part.id]}
              onPointerOver={(e) => { e.stopPropagation(); onPartPointer?.(part.id, e); }}
              onPointerOut={() => onPartPointer?.(null)}
              onClick={(e) => { e.stopPropagation(); onPartClick?.(part.id, e); }}
            >
              {children?.(part.id)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
```
Note: if the GLB's nodes have their own transforms (position/rotation on the node), copy them: `position={node.position} rotation={node.rotation} scale={node.scale}` on the `<mesh>`. Check `/tmp/ForgeRunner.tsx` from P2.1 — if gltfjsx emitted transforms or a rotated parent group, reproduce them exactly. The old app also applied `rotation={[0.9, -2.5, -0.2]}` to the group; we want the shoe upright with the toe pointing to +X; find the right rotation visually and put it in the product config as `modelRotation` if needed (add it to the schema).

Done when: a temporary page `app/dev/page.tsx` (delete before P14) shows the shoe with materials, colors change when you edit the default design in code.
Commit: `feat(three): schema-driven ProductModel with PBR materials`

#### P3.6 Stage, camera rig, canvas

`components/three/Stage.tsx` — props `{ preset: StageId }`:
- `studio`: `<Environment files="/env/studio.hdr" environmentIntensity={0.9} />` + a key `directionalLight` (intensity 1.2, position `[3,4,2]`).
- `daylight`: `<Environment preset="park" environmentIntensity={0.8} />`.
- `sunset`: `<Environment preset="sunset" />` + warm directional light `#ffb27a`.
- `night`: `<Environment preset="night" environmentIntensity={0.5} />` + two `Lightformer`s (accent color rim light) inside the Environment.
- Always: `<ContactShadows position={[0, -0.36*modelScale?, 0]} opacity={0.45} blur={2.4} far={1.2} resolution={512} frames={1}/>` — set `frames={1}` for performance, and re-render the shadow when the stage changes (change its `key`).
- Background: no 3D background. The canvas is transparent (`gl={{ alpha: true }}`) so the CSS cyclorama shows through. That also makes transparent PNG export easy.

Check drei preset names exist: `grep -n "sunset\|night\|park" node_modules/@react-three/drei/helpers/environment-assets.*`.

`components/three/CameraRig.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import gsap from "gsap";
import type { ProductDef, Vec3 } from "@/lib/products/schema";
import { useStudioUI } from "@/lib/design/ui-store";

export function CameraRig({ product }: { product: ProductDef }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const view = useStudioUI((s) => s.view);
  const selected = useStudioUI((s) => s.selectedPart);
  const autoRotate = useStudioUI((s) => s.autoRotate);

  const flyTo = (position: Vec3, target: Vec3) => {
    const c = controls.current;
    if (!c) return;
    gsap.to(camera.position, { x: position[0], y: position[1], z: position[2], duration: 0.9, ease: "power3.inOut", onUpdate: () => c.update() });
    gsap.to(c.target, { x: target[0], y: target[1], z: target[2], duration: 0.9, ease: "power3.inOut" });
  };

  useEffect(() => {
    const v = product.cameraViews.find((x) => x.id === view);
    if (v) flyTo(v.position, v.target);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = product.parts.find((x) => x.id === selected);
    if (p) flyTo(p.focus.position, p.focus.target);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      minDistance={1.4}
      maxDistance={4.5}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
      autoRotate={autoRotate}
      autoRotateSpeed={1.2}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
```
When the user starts dragging, kill running camera tweens: listen to the controls `start` event and call `gsap.killTweensOf(camera.position)` and `gsap.killTweensOf(controls.target)`.

**Tuning helper (temporary):** add a dev-only button that logs `camera.position.toArray()` and `controls.target.toArray()` to the console. Use it to find good values for every camera view and part focus point, then paste them into `forge-runner.ts`. Remove the helper afterwards.

`components/three/StudioCanvas.tsx`:
```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Bvh, PerformanceMonitor, Preload } from "@react-three/drei";
import { Suspense, useState } from "react";
// ...imports of Stage, CameraRig, ProductModel, PartInteraction, Effects, SceneCapture

export default function StudioCanvas(/* props */) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0.1, 0.4, 2.9], fov: 35, near: 0.05, far: 50 }}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      onPointerMissed={() => {/* clear selection */}}
      aria-label="3D view of your shoe. Use the panel to change parts."
      role="img"
    >
      <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        {/* <Stage/> <Bvh firstHitOnly><ProductModel/></Bvh> <CameraRig/> <Effects/> <SceneCapture/> */}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
```
In pages, load it with `const StudioCanvas = dynamic(() => import("@/components/three/StudioCanvas"), { ssr: false, loading: () => <CanvasSkeleton/> })`. `dynamic` with `ssr: false` must be called from a client component, so put it inside `StudioShell.tsx` (client).

Done when: orbit is smooth, clamped, camera flies between views, the shoe sits on a soft shadow, all 4 stages look good. Screenshot each stage.
Commit: `feat(three): stage presets, camera rig, studio canvas`

#### P3.7 Loader

`components/three/Loader.tsx` — an HTML overlay (outside the Canvas) that reads `useProgress()` from drei: shows the Logo and a thin progress bar along the bottom of the canvas area, plus the percent in tabular numbers. Fades out with Motion `AnimatePresence` when `active === false && progress === 100`. Never show the app before loading finishes; never get stuck: if `errors.length > 0`, show "The 3D model didn't load. Check your connection and reload." with a Reload button.

Commit: `feat(three): real progress loader`

---

### Phase 4 — Studio UI

#### P4.1 Route and shell

`app/studio/[productId]/page.tsx` (server component):
```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/products";
import { StudioShell } from "@/components/studio/StudioShell";

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ productId: string }>; searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const { d } = await searchParams;
  const product = getProduct(productId);
  if (!product) return {};
  const og = d ? `/api/og?d=${encodeURIComponent(d)}` : `/api/og?p=${productId}`;
  return { title: `Design your ${product.name}`, openGraph: { images: [og] }, twitter: { card: "summary_large_image", images: [og] } };
}

export default async function StudioPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) notFound();
  return <StudioShell productId={product.id} />;
}
```
(In Next 15+/16, `params` and `searchParams` are Promises. Await them.)

`components/studio/StudioShell.tsx` (client): reads `?d=` with `useSearchParams()` (wrap the shell in `<Suspense>` in the page because `useSearchParams` requires it), decodes it (P7.1) or builds `defaultDesign`, calls `useDesignStore.getState().load(...)` once and `history.clear()`. Layout per wireframe 4.6. Full-viewport (`h-dvh`), canvas absolutely positioned behind the panels.

Pass `productId`, not the product object, from server to client (ProductDef contains only serializable data, but keeping a single source via `getProduct()` on the client is simpler).

Done when: `/studio/forge-runner` shows the shoe full-screen with empty panels; `/studio/nope` shows 404.
Commit: `feat(studio): route and shell layout`

#### P4.2 Part list + 3D picking + outline

- `components/studio/PartList.tsx`: a `role="radiogroup"` list (shadcn `ToggleGroup type="single"` works) of parts with a small swatch showing current color and material icon. Selection uses Motion `layoutId="part-indicator"` for a sliding highlight. Arrow keys move between parts.
- `components/three/PartInteraction.tsx`: wires `onPartPointer` → `useStudioUI.set({ hoveredPart })`, sets `document.body.style.cursor = "pointer"`; `onPartClick` → `selectedPart`. A drei `<Html>` tooltip near the pointer shows the hovered part's label (use `distanceFactor` off; position at `e.point`).
- `components/three/Effects.tsx`:
```tsx
"use client";
import { EffectComposer, Outline, SMAA, N8AO, Selection } from "@react-three/postprocessing";
```
  Wrap the model in `<Selection>` and each part mesh in `<Select enabled={hovered === id || selected === id}>`. Outline color: accent token value (read from CSS with `getComputedStyle(document.documentElement).getPropertyValue("--accent-brand")`; re-read on theme change). `edgeStrength={3}`, `width={1000}`, `blur`, `xRay={false}`. Add `<N8AO aoRadius={0.4} intensity={1.5} halfRes />` and `<SMAA />`. Check exact prop names in `node_modules/@react-three/postprocessing/dist/*.d.ts`.
  If `Selection`/`Select` makes ProductModel awkward, put `<Select>` inside ProductModel via an optional `wrapMesh` render prop.
- Keys `[` / `]` cycle parts (ignore when focus is in an input).

Done when: hovering the shoe outlines parts, clicking selects and flies the camera; list and 3D stay in sync; works with keyboard only.
Commit: `feat(studio): part picking with hover outline and accessible part list`

#### P4.3 Material picker

`components/studio/MaterialPicker.tsx`: grid of 7 tiles (each tile = a 64 px circular crop of `color.webp` tinted with the part's current color using CSS `background-blend-mode: multiply`), label and price delta ("+€12"). Disabled tiles (rules) show at 40% opacity with a shadcn `Tooltip` carrying the reason. Click → `setPartMaterial`; if it returns a reason, `toast.error(reason)`. Track `material_changed`.

Commit: `feat(studio): material picker with rules`

#### P4.4 Color picker

`components/studio/ColorPicker.tsx`:
- 12 palette swatches (circles 32 px, `aria-label` = color name — add a `name` map in the product config or compute a simple name like "Ultramarine #2B3CFF").
- The selected swatch gets a ring animated with `layoutId="swatch-ring"`.
- "Custom" opens a shadcn `Popover` with `HexColorPicker` from `react-colorful` + `HexColorInput`. Use `useHistoryGesture` for the drag (one undo step per drag).
- "Recent" row: last 8 custom colors, stored in `localStorage` key `sf:recent-colors` (wrap in try/catch).
- "Apply to all parts" small text button.

Commit: `feat(studio): color picker with recents and single-step undo`

#### P4.5 Finish controls

shadcn `Slider`s: Roughness (0–1), Sheen (only when the material preset has sheen > 0), Pattern scale (0.5–2). Each uses `useHistoryGesture`. "Reset part" button. Values shown in tabular numbers.

Commit: `feat(studio): finish controls`

#### P4.6 View bar, toolbar, shortcuts, command palette

- `ViewBar.tsx`: shadcn `ToggleGroup` with the 6 views + auto-rotate toggle. Double-clicking empty canvas resets to the "three-quarter" view (use `onDoubleClick` on the canvas wrapper and check `useStudioUI.getState().hoveredPart === null`).
- `Toolbar.tsx` (top bar): back link, product name, editable design name (inline input, Enter to confirm), undo/redo buttons (disabled state from `useStore(useDesignStore.temporal, s => s.pastStates.length)`), `⌘K` button, Share, Bag.
- `lib/hooks/useShortcuts.ts`: one `keydown` listener. Shortcuts: `mod+z` undo, `mod+shift+z` / `mod+y` redo, `mod+k` palette, `[` `]` parts, `1`–`6` views, `r` surprise me, `space` toggle auto-rotate, `Delete`/`Backspace` delete selected graphic, `Escape` cancel placing / clear selection. Ignore when `event.target` is an input, textarea or contenteditable. Show them in a "Keyboard shortcuts" dialog (`?` key).
- `CommandMenu.tsx`: shadcn `CommandDialog` with groups Parts, Colorways, Views, Export, Theme.

Done when: every shortcut works; the palette can do everything listed.
Commit: `feat(studio): views, toolbar, shortcuts, command palette`

#### P4.7 Panel layout + mobile sheet

- Desktop: right panel `glass` rounded-xl, 360 px wide, `ScrollArea`. Sections: Parts, Material, Color, Finish; bottom sticky: PriceBlock + Size + Add to bag.
- Left rail (desktop): vertical tabs Design / Graphics / Colorways / Stage / Export — switches the right panel's content. Animate the content swap with Motion `AnimatePresence mode="popLayout"` (opacity + 8 px x-shift, 180 ms).
- Mobile (<1024 px, use a `useMediaQuery` hook): shadcn `Drawer` (vaul) non-modal, `snapPoints={[0.12, 0.5, 0.92]}`, `modal={false}`, `dismissible={false}`. Peek shows price + Add to bag; tabs across the top of the sheet. Check vaul prop names in `node_modules/vaul/dist/index.d.ts`.

Done when: layout matches wireframes at 1440, 1024, 768, 390 and 360 px; no horizontal scroll; the canvas is never fully covered at the peek snap.
Commit: `feat(studio): responsive panels and mobile bottom sheet`

---

### Phase 5 — Graphics (decals)

#### P5.1 Graphics panel

`components/studio/GraphicsPanel.tsx`: three sections.
- Marks: 4 tiles from `/marks/*.png`. Click → `useStudioUI.set({ placing: { kind: "mark", src } })` and a hint toast "Click on the shoe to place it".
- Upload: `<input type="file" accept="image/png,image/jpeg,image/svg+xml">`. Validate type and size ≤ 2 MB; error text under the input otherwise. Read with `FileReader.readAsDataURL`. For SVG, draw it to a 1024 px canvas first and convert to PNG data URL (decals need raster).
- Text: input (max 12 characters), font select (Big Shoulders, Instrument Sans, and one script-like Google font e.g. "Caveat" loaded with next/font), color swatches. Render with `lib/graphics/textToDataUrl.ts`:
```ts
export async function textToDataUrl(text: string, fontFamily: string, color: string): Promise<string> {
  await document.fonts.load(`900 160px ${fontFamily}`);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = `900 160px ${fontFamily}`;
  const w = Math.ceil(ctx.measureText(text).width) + 40;
  c.width = w; c.height = 220;
  ctx.font = `900 160px ${fontFamily}`;
  ctx.fillStyle = color; ctx.textBaseline = "middle";
  ctx.fillText(text, 20, 110);
  return c.toDataURL("image/png");
}
```
  (`fontFamily` must be the real CSS family name next/font generated — read it from the font object's `.style.fontFamily`.)
- Below: list of placed graphics with thumbnail, size slider, rotation slider, delete button.

#### P5.2 Placement and dragging on the surface

`components/three/Graphics.tsx`, rendered as `children(partId)` inside each part mesh (drei `<Decal>` must be a child of the mesh it projects onto):
```tsx
"use client";
import * as THREE from "three";
import { Decal, useTexture } from "@react-three/drei";
import type { Graphic } from "@/lib/design/types";

export function GraphicDecal({ g, selected }: { g: Graphic; selected: boolean }) {
  const tex = useTexture(g.src!);
  tex.colorSpace = THREE.SRGBColorSpace;
  const aspect = (tex.image as HTMLImageElement).width / (tex.image as HTMLImageElement).height || 1;
  // orientation: look along the surface normal, then spin by g.rotation
  const n = new THREE.Vector3(...g.normal);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  const e = new THREE.Euler().setFromQuaternion(q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), g.rotation)));
  return (
    <Decal position={g.position} rotation={e} scale={[g.scale * aspect, g.scale, g.scale]}>
      <meshPhysicalMaterial map={tex} transparent polygonOffset polygonOffsetFactor={-4} roughness={0.6} toneMapped depthTest />
    </Decal>
  );
}
```
Important details:
- `position` and `normal` must be in the **mesh's local space** (Decal projects in local space). Convert the click: `const local = mesh.worldToLocal(e.point.clone())`; normal: `e.face!.normal` is already in local (object) space for the clicked geometry — but if the mesh has a non-uniform scale, transform it with `normalMatrix`. Store the local values in the design.
- The decal scale is in local units too: since the product group has `scale={modelScale}`, a default `g.scale` of about `0.08` local is ~25% of the shoe height. Tune it.
- Placing: in `PartInteraction`, if `useStudioUI.placing` is set and the clicked part is in `product.graphicZones`, call `addGraphic` with a new `crypto.randomUUID()` id, then clear `placing`, select the new graphic. If the part is not allowed, toast "Graphics can go on: Upper, Heel band, Tongue patch".
- Dragging: when a graphic is selected, `pointerdown` on its part starts a drag: disable OrbitControls (`controls.enabled = false` via `useThree(s => s.controls)`), on `pointermove` over the same part update `position`/`normal` (use `useHistoryGesture` so a drag = one undo step), on `pointerup` re-enable controls.
- A selected graphic shows a ring: a drei `<Ring>` at the same position, oriented with the normal, accent color, `depthTest={false}`.
- Uploaded images are data URLs. They live in the store (and in IndexedDB saves) but are stripped from share links (P7.1).

Done when: you can place marks, uploads and text on the upper, drag them along the surface without the camera moving, resize, rotate, delete, and undo every step. No z-fighting flicker (polygonOffset).
Commit: `feat(graphics): place, drag, scale and rotate custom graphics on the shoe`

---

### Phase 6 — Colorways

#### P6.1 Presets panel

`ColorwaysPanel.tsx`: product colorways as cards with a 4-color mini palette strip (the 4 most visible parts: upper, sole, laces, stripes) + name. Clicking calls `applyParts(preset.parts)` (one undo step). Selected card gets the accent outline. Track it.

#### P6.2 Harmony generator ("Surprise me")

`lib/design/colorways.ts`:
- Helpers `hexToHsl`, `hslToHex`.
- `generateColorway(product, seed?)`: pick a random base hue; pick a scheme at random from `analogous` (±30°), `complementary` (+180°), `triadic` (+120°, +240°), `split` (+150°, +210°); upper = base (s 45–75%, l 35–60%); stripes / heel = scheme accents; laces = upper or white (`#F4F4F2`) 50/50; sole = one of neutrals `#F4F4F2`, `#1B1B1F`, `#C08A55` (gum); lining = a light tint of the base (l 85%); tongue = accent. Materials: random allowed material per part, but keep the sole rubber.
- Use a seeded RNG (mulberry32) so tests are deterministic.
- `R` key and a "Surprise me" button (dice icon) call it.

Unit test: output colors are valid hex; every material is allowed by rules.

Commit: `feat(colorways): curated presets and harmony-based generator`

#### P6.3 AI colorway route (Claude API)

`app/api/colorway/route.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getProduct } from "@/lib/products";
import { MaterialId } from "@/lib/products/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({ productId: z.string(), prompt: z.string().min(3).max(200) });

const AiColorway = z.object({
  name: z.string().describe("Short colorway name, 1-3 words"),
  story: z.string().describe("One sentence, under 20 words, describing the inspiration"),
  parts: z.array(z.object({
    partId: z.string(),
    color: z.string().describe("Hex color like #1A2B3C"),
    material: MaterialId,
  })),
});

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ai_unavailable" }, { status: 503 });
  }
  // Optional rate limit (only when Upstash env vars exist): 10 requests per IP per hour.
  // TODO(executor): implement with @upstash/ratelimit Ratelimit.slidingWindow(10, "1 h") keyed by
  // req.headers.get("x-forwarded-for"); return 429 { error: "rate_limited" } when exceeded.

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const product = getProduct(parsed.data.productId);
  if (!product) return Response.json({ error: "unknown_product" }, { status: 404 });

  const partsSpec = product.parts
    .map((p) => `- ${p.id} (${p.label}): allowed materials ${p.allowedMaterials.join(", ")}`)
    .join("\n");

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(AiColorway) },
      system:
        "You are a senior footwear color designer. You create wearable, harmonious sneaker colorways. " +
        "Keep soles neutral or gum unless the request clearly asks otherwise. Use at most 4 distinct hues. " +
        "Only use the part ids and materials you are given.",
      messages: [{
        role: "user",
        content: `Product: ${product.name}\nParts:\n${partsSpec}\n\nRequest: ${parsed.data.prompt}\n\nReturn one colorway covering every part.`,
      }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "no_colorway" }, { status: 422 });
    }
    // Validate against the product: drop unknown parts, fix disallowed materials.
    const out = response.parsed_output;
    const parts: Record<string, { color: string; material: z.infer<typeof MaterialId> }> = {};
    for (const p of out.parts) {
      const def = product.parts.find((d) => d.id === p.partId);
      if (!def || !/^#[0-9a-fA-F]{6}$/.test(p.color)) continue;
      parts[def.id] = { color: p.color.toUpperCase(), material: def.allowedMaterials.includes(p.material) ? p.material : def.default.material };
    }
    return Response.json({ name: out.name, story: out.story, parts });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return Response.json({ error: "rate_limited" }, { status: 429 });
    if (err instanceof Anthropic.APIError) return Response.json({ error: "ai_error" }, { status: 502 });
    throw err;
  }
}
```
Notes for the executor:
- These API names were checked against `@anthropic-ai/sdk` 0.135.0 on 2026-10-18 (`client.beta.messages.parse`, `betaZodOutputFormat` from `@anthropic-ai/sdk/helpers/beta/zod`, `fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta). If typecheck complains, open `node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.d.ts` and `helpers/beta/zod.d.ts` and match the real signatures. Do not switch to `fetch`.
- `fallbacks: "default"` lets the API retry on another model if the main one declines. If you get a 400 about `fallbacks`, remove the `betas` and `fallbacks` lines and note it in `docs/DECISIONS.md`.
- Model: `claude-opus-5-5` with `effort: "low"` (fast, good taste). To cut cost later, the owner can switch to `claude-haiku-5-5`; make the model an env var `COLORWAY_MODEL` with that default.
- The zod helper may not support `.describe()` on every field type with zod 4 — if it errors, remove the `.describe()` calls and put the descriptions in the system prompt.

Client side (`components/studio/AiColorway.tsx`): text input with placeholder "Tokyo at night, neon on black", 4 example prompt chips, a "Generate" button. While waiting: disable the button, show a shimmer overlay over the canvas (a CSS gradient sweep, `pointer-events: none`). On success: `applyParts(parts)` (one undo step) + toast with the name and story. On `503 ai_unavailable`: run `generateColorway` and toast "AI is off on this site, so here's a generated colorway instead." On `429`: "You've made a lot of requests. Try again in an hour." Track `ai_colorway_requested`.

Done when: with a key in `.env.local`, prompts produce sensible colorways in < 8 s; without a key, the fallback works.
Commit: `feat(ai): Claude-powered colorway generator with local fallback`

---

### Phase 7 — Save, share, export

#### P7.1 URL codec

`lib/design/codec.ts`:
```ts
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";
import { PartConfig, Vec3 } from "@/lib/products/schema";
import type { Design } from "./types";

const SharedGraphic = z.object({
  id: z.string(), kind: z.enum(["mark", "text"]), src: z.string().optional(), text: z.string().max(12).optional(),
  font: z.string().optional(), color: z.string().optional(), partId: z.string(),
  position: Vec3, normal: Vec3, rotation: z.number(), scale: z.number(),
});
const SharedDesign = z.object({
  version: z.literal(1), productId: z.string(), name: z.string().max(40),
  parts: z.record(z.string(), PartConfig), graphics: z.array(SharedGraphic).max(4),
  stage: z.enum(["studio", "daylight", "sunset", "night"]),
});

export function encodeDesign(d: Design): { value: string; droppedUploads: number } {
  const graphics = d.graphics.filter((g) => g.kind !== "upload");
  // text graphics: drop the rendered data URL, keep text/font/color; re-render on load
  const slim = { ...d, graphics: graphics.map((g) => (g.kind === "text" ? { ...g, src: undefined } : g)) };
  return { value: compressToEncodedURIComponent(JSON.stringify(slim)), droppedUploads: d.graphics.length - graphics.length };
}

export function decodeDesign(value: string): Design | null {
  try {
    const json = decompressFromEncodedURIComponent(value);
    if (!json) return null;
    const parsed = SharedDesign.safeParse(JSON.parse(json));
    return parsed.success ? (parsed.data as Design) : null;
  } catch { return null; }
}
```
On load, for text graphics without `src`, call `textToDataUrl` before rendering. Marks keep `src` like `/marks/anvil.png` (validate it starts with `/marks/` to prevent arbitrary URLs).

Share button: `navigator.share` when available (mobile), otherwise copy to clipboard; toast "Link copied". If `droppedUploads > 0`: "Link copied. Uploaded images aren't included in links." Track `share`. Also keep the URL in sync while editing with `history.replaceState` (debounced 500 ms) so a refresh keeps the design.

Unit tests: round trip; garbage input returns null; upload graphics are dropped; marks with external URLs are rejected.

Commit: `feat(share): compressed, validated design links`

#### P7.2 Saved designs (IndexedDB)

`lib/design/saved.ts` with `idb-keyval`: `saveDesign(design, thumbnailBlob)`, `listDesigns()`, `getDesign(id)`, `renameDesign`, `duplicateDesign`, `deleteDesign`. Key prefix `sf:design:`. Store `{ id, design, thumbnail (Blob), updatedAt }`. Thumbnail = 512 px PNG from the capture function (P7.3). Save button in the toolbar (`mod+s`). Toast "Saved to this browser".

`/gallery` page: two sections — "Colorways" (product presets, open in studio with `?d=`) and "My designs" (cards styled like shoebox labels: thumbnail on top, a label strip with design name in Big Shoulders, product, date, and the 4-color palette; menu with Open, Rename, Duplicate, Delete — delete asks for confirmation in a dialog). Empty state: "Designs you save appear here." + "Start designing" button.

Commit: `feat(save): local design library and gallery`

#### P7.3 Scene capture + PNG export

`components/three/SceneCapture.tsx` registers a capture function into a tiny store so UI outside the Canvas can call it:
```tsx
"use client";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { create } from "zustand";
import * as THREE from "three";

type Capture = (opts: { scale: number; transparent: boolean; background?: string; view?: { position: THREE.Vector3Tuple; target: THREE.Vector3Tuple } }) => Promise<Blob>;
export const useCapture = create<{ capture: Capture | null }>(() => ({ capture: null }));

export function SceneCapture() {
  const { gl, scene, camera, size } = useThree();
  useEffect(() => {
    const capture: Capture = async ({ scale, transparent, background, view }) => {
      const prevRatio = gl.getPixelRatio();
      const prevClear = gl.getClearColor(new THREE.Color()).getHex();
      const prevAlpha = gl.getClearAlpha();
      const cam = (camera as THREE.PerspectiveCamera).clone();
      if (view) { cam.position.set(...view.position); cam.lookAt(...view.target); }
      gl.setPixelRatio(scale);
      gl.setSize(size.width, size.height, false);
      if (transparent) gl.setClearColor(0x000000, 0); else gl.setClearColor(background ?? "#EEF1F4", 1);
      gl.render(scene, cam);
      const blob = await new Promise<Blob>((res, rej) => gl.domElement.toBlob((b) => (b ? res(b) : rej(new Error("capture failed"))), "image/png"));
      gl.setPixelRatio(prevRatio);
      gl.setSize(size.width, size.height, false);
      gl.setClearColor(prevClear, prevAlpha);
      return blob;
    };
    useCapture.setState({ capture });
    return () => useCapture.setState({ capture: null });
  }, [gl, scene, camera, size]);
  return null;
}
```
Note: this renders without post-processing (outline etc.), which is what we want for exports. Hide selection outlines/rings during capture anyway by setting `useStudioUI.set({ hoveredPart: null })` before capturing. `toBlob` right after `gl.render` in the same task works without `preserveDrawingBuffer`.

`lib/export/png.ts`: `downloadBlob(blob, filename)` helper (object URL + `<a download>` + revoke). Export panel: resolution toggle (1×, 2×, 4×), "Transparent background" switch, "Download PNG" button. 4× on a phone may exceed GPU limits: cap at `gl.capabilities.maxTextureSize`.

Commit: `feat(export): high-res PNG export`

#### P7.4 Turntable video

`lib/export/video.ts`:
- `const stream = canvas.captureStream(60)`; choose mime: first supported of `video/mp4;codecs=avc1`, `video/webm;codecs=vp9`, `video/webm` via `MediaRecorder.isTypeSupported`.
- Before recording: set camera to the three-quarter view, disable controls, set `autoRotate` false and instead rotate the **product group** 360° over 6 s with a GSAP tween on a ref (expose a `turntable` ref from the studio canvas via the same zustand capture store: `rotateProduct(progress)`).
- Record 6 s at 1080 px height if possible (temporarily set pixel ratio so the canvas backing size ≈ 1920×1080 on desktop); show a progress ring (Motion `pathLength`) and a Cancel button; restore everything after.
- Download `shoe-forge-<design-name>.webm|mp4`. Track `export` with `{ type: "video" }`.

Commit: `feat(export): 360° turntable video`

#### P7.5 GLB export

`lib/export/glb.ts`:
```ts
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
export async function exportGLB(object: THREE.Object3D): Promise<Blob> {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(object, { binary: true, onlyVisible: true });
  return new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
}
```
Export only the product group (expose it via a ref in the capture store), not the whole scene. Decals are meshes, so they export too. Check the result opens in https://gltf-viewer.donmccurdy.com.

Commit: `feat(export): GLB download`

#### P7.6 Tech pack PDF

`lib/export/techpack.ts` with `jspdf` and `qrcode`:
- A4 portrait, margins 16 mm, embed fonts? jsPDF built-in Helvetica is fine (no custom font embedding needed).
- Header bar styled like a shoebox label: product name, design name, date, "Tech pack" — black rule lines.
- 3 renders from `capture({ scale: 2, transparent: false, background: "#FFFFFF", view })` for side, top, back views → `doc.addImage`.
- Table: Part | Material | Color (draw a small filled rect + HEX) | Roughness | Price delta.
- Graphics list (kind, part, size).
- Totals: base price, material extras, graphics extras, total.
- QR code (`QRCode.toDataURL(shareUrl)`) bottom-right with "Scan to open this design".
- Footer: "Generated by Shoe Forge".
Download `techpack-<design>.pdf`.

Commit: `feat(export): production tech pack PDF`

#### P7.7 Share image (OG)

`app/api/og/route.tsx` with `ImageResponse` from `next/og`, runtime `edge` or `nodejs` (either works; prefer `nodejs` if fonts are loaded from disk). Query `d` (encoded design) or `p` (product id). Decode with `decodeDesign` (it must not import client-only code; keep `codec.ts` free of `"use client"`). Layout 1200×630: cyclorama background; left: the product name and design name in Big Shoulders (load the font file: fetch the `.ttf` from Google Fonts at build or commit `public/fonts/BigShoulders-Black.ttf` — OFL license allows this), a shoebox-label box with rows Part / Color for 5 parts and color chips; right: large overlapping color chips forming a palette fan. Invalid `d` → product default.

Done when: `/api/og?p=forge-runner` returns a PNG; pasting a share link into https://www.opengraph.xyz (after deploy) shows the card.
Commit: `feat(share): dynamic shoebox-label share image`

---

### Phase 8 — Commerce (mock)

#### P8.1 Pricing

`lib/design/pricing.ts`:
```ts
import { MATERIALS } from "@/lib/materials/presets";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "./types";
export const GRAPHIC_PRICE = { mark: 6, upload: 10, text: 8 } as const;
export function priceOf(p: ProductDef, d: Design) {
  const materials = Object.values(d.parts).reduce((sum, part) => sum + MATERIALS[part.material].priceDelta, 0);
  const graphics = d.graphics.reduce((sum, g) => sum + GRAPHIC_PRICE[g.kind], 0);
  return { base: p.basePrice, materials, graphics, total: p.basePrice + materials + graphics };
}
export const formatPrice = (n: number, currency: "EUR" | "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
```
`PriceBlock.tsx`: total in Big Shoulders `display-m`, tabular, color `--gum`; animate number changes with Motion `animate(from, to, { duration: 0.4, onUpdate })`; a "Price details" popover listing the breakdown. Unit test pricing.

#### P8.2 Size picker + bag

- `SizePicker.tsx`: EU 36–47 grid of buttons (radiogroup), US equivalents shown small. Remember last size in localStorage.
- `lib/bag/store.ts`: zustand `persist` middleware (localStorage key `sf:bag`). Items: `{ id, design, size, qty, price, thumbnail (data URL 256px) }`.
- "Add to bag": requires a size (if missing, shake the size picker with Motion and show "Choose a size first"). Item thumbnail from capture. Opens `BagDrawer` (shadcn `Sheet` side right) with items, qty steppers, remove, subtotal, "Checkout".
- Checkout → `/bag/confirmation`: order number `SF-` + 6 random base32 chars, summary, "Download tech pack" for each item (re-render requires a canvas: instead store the tech pack data and generate the PDF with renders from the saved thumbnails), "Back to studio". Clear the bag. Say clearly on the page that this is a demo and nothing was charged.
- Track `add_to_bag`.

Commit: `feat(commerce): pricing, sizes, bag and demo checkout`

---

### Phase 9 — AR

#### P9.1 Capability detection + button

`components/three/ARButton.tsx` decides which flow to show:
- iOS Safari: `document.createElement("a").relList.supports("ar")` → Quick Look flow.
- Android Chrome: `navigator.xr && await navigator.xr.isSessionSupported("immersive-ar")` → WebXR flow.
- Otherwise: QR code dialog with the share link and "Scan with your phone to see it in AR".

#### P9.2 iOS Quick Look

`lib/export/usdz.ts`:
```ts
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
export async function exportUSDZ(object: THREE.Object3D): Promise<Blob> {
  const exporter = new USDZExporter();
  const arraybuffer = await exporter.parseAsync(object);   // verified exists in three r186
  return new Blob([arraybuffer], { type: "model/vnd.usdz+zip" });
}
```
Before export, clone the product group and set its scale so the shoe's length equals `product.realLengthMeters` (compute the bounding box length on X with `Box3`). Then:
```ts
const a = document.createElement("a");
a.rel = "ar";
a.href = URL.createObjectURL(blob);
const img = document.createElement("img"); a.appendChild(img); // Quick Look requires a child <img>
a.click();
```
Note: USDZ supports base color, normal, roughness, clearcoat; sheen is lost — fine.

#### P9.3 Android WebXR

Use `@react-three/xr` v6: `const store = createXRStore({ hitTest: true, domOverlay: true })`; render `<XR store={store}>` inside the Canvas around the product; button calls `store.enterAR()`. In AR: show a reticle at the hit-test result (`useXRHitTest` — check the v6 API in `node_modules/@react-three/xr/dist/*.d.ts`; names changed between v5 and v6), tap places the shoe at real scale; a DOM overlay "Done" button exits. If the API is too different from expected after 3 tries, keep only Quick Look + QR, log it in `docs/BLOCKERS.md`.

Done when: tested on a real iPhone (Quick Look opens with the configured colors) and, if available, an Android phone. If no devices are available, test the code paths with Chrome's WebXR emulator extension and note it.
Commit: `feat(ar): Quick Look on iOS, WebXR on Android, QR handoff on desktop`

---

### Phase 10 — Landing page (the cinematic part)

#### P10.1 Lenis + GSAP setup

`lib/scroll/LenisProvider.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  return <>{children}</>;
}
```
Use it only on the landing page (not the studio).

`lib/scroll/progress.ts`: a plain mutable object (not React state) that ScrollTriggers write and `useFrame` reads, so scroll never re-renders React:
```ts
export const landing = { heroIn: 0, explode: 0, materialIndex: 0, materialMix: 0, section: "hero" as "hero" | "explode" | "materials" | "rest" };
```

#### P10.2 Landing canvas

`components/landing/LandingCanvas.tsx`: one `position: fixed; inset: 0; z-index: 0; pointer-events: none` canvas behind the whole landing page (loaded with `dynamic(..., { ssr: false })`). It renders `ProductModel` with the "Gum classic" colorway, `Stage preset="studio"`, a `<Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>` (fixes the old drifting bug), and a `LandingDirector` component with `useFrame` that reads `landing.*` and:
- positions/rotates the product group per section (hero: right side, tilted 3/4; explode: centered, side view, slowly turning; materials: centered close-up on the upper);
- sets the `explode` ref (passed to `ProductModel`) from `landing.explode`;
- uses damped interpolation (`THREE.MathUtils.damp`) toward the targets so it feels smooth even with fast scrolling.
On mobile, the shoe is centered and smaller (`useThree(s => s.size.width) < 768`).

Material run: `landing.materialIndex` (0–3) picks Leather/Suede/Knit/Patent for the upper. Change the design object passed to `ProductModel` only when the index changes (store it in React state updated from the ScrollTrigger `onUpdate` only when the integer changes).

#### P10.3 Hero

`components/landing/Hero.tsx`: headline "Build your pair." in `display-xl` split over 3 lines on desktop ("Build / your / pair."). Use `useGSAP` + `SplitText`:
```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(useGSAP, SplitText);

export function Hero() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = SplitText.create(".hero-title", { type: "lines,chars", mask: "lines" });
      gsap.timeline({ defaults: { ease: "power4.out" } })
        .from(split.chars, { yPercent: 110, stagger: 0.04, duration: 0.9 })
        .from(".hero-sub", { opacity: 0, y: 12, duration: 0.6 }, "-=0.4")
        .from(".hero-cta", { opacity: 0, y: 12, duration: 0.6 }, "-=0.45")
        .to(landingHeroIn, { value: 1, duration: 1.2, ease: "elastic.out(1, 0.6)" }, 0.1); // shoe falls in
      return () => split.revert();
    });
  }, { scope: root });
  // ...
}
```
(`landingHeroIn` = a small `{ value: 0 }` object or use `landing.heroIn` directly by tweening `landing` with `{ heroIn: 1 }`.) Check SplitText's `mask` option exists in 3.15 (`grep -n "mask" node_modules/gsap/SplitText.js | head`); if not, wrap lines with `overflow: hidden` manually.

Copy:
- Headline: "Build your pair."
- Sub: "Design a sneaker in real-time 3D, see it on your floor, and download the tech pack to make it."
- CTA: "Start designing" → `/studio/forge-runner`. Secondary text link: "Embed it in your store" → `#brands`.

#### P10.4 Exploded view section (the signature moment)

`components/landing/ExplodedSection.tsx`: height `300vh`, inner `sticky top-0 h-dvh`. ScrollTrigger:
```ts
ScrollTrigger.create({
  trigger: sectionRef.current, start: "top top", end: "bottom bottom", scrub: 0.6,
  onUpdate: (self) => {
    // 0 → 0.15: hold assembled; 0.15 → 0.55: explode; 0.55 → 0.8: hold; 0.8 → 1: reassemble
    const p = self.progress;
    landing.explode = p < 0.15 ? 0 : p < 0.55 ? (p - 0.15) / 0.4 : p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2;
    landing.section = "explode";
  },
});
```
Labels: an HTML overlay (not in the canvas) with 8 labels. Each label's screen position comes from projecting the part's exploded centroid: in the `LandingDirector`'s `useFrame`, compute `worldPos.project(camera)` for each part and write `x, y` into a shared object; a React component reads it in a `requestAnimationFrame` loop and sets `style.transform` directly on the label elements (no React state per frame). Draw the leader line as an SVG `<line>` from the label to the part point. Labels fade in when `explode > 0.6`. Each label: part name in Big Shoulders 800, default material in `micro`, a 1 px `--line` leader line ending in a 4 px dot. This technical-drawing look is the one place we use it heavily.

Left column copy (fades between two lines tied to progress): "Eight pieces." → "One pair." On mobile, show the labels as a list under the canvas instead of floating labels.

Compute part centroids once: `geometry.computeBoundingBox()` → center.

#### P10.5 Material run

`components/landing/MaterialRun.tsx`: `400vh`, sticky inner. Giant material name (`display-xl`) changes Leather → Suede → Knit → Patent with a vertical mask slide (GSAP timeline scrubbed by the same ScrollTrigger). Under it, one sentence per material from `MATERIALS[id].description`. The canvas shows the upper in that material (P10.2).

#### P10.6 For brands section (`id="brands"`)

- Headline: "Put it on your store."
- Code block with the embed snippet (from P12) and a "Copy" button (toast "Copied").
- 4 capability blocks with **different sizes** in a 2-row asymmetric grid (one wide, three narrow), each with a real claim: "Any shoe, one config file", "Rules your factory can live with", "A tech pack with every order", "Events for your analytics". No identical card stack, no icons-in-circles.
- A live mini embed iframe (`/embed/forge-runner?theme=light`) 16:10, lazy (`loading="lazy"`).

#### P10.7 Colorway strip + footer

Horizontal scroll row of the 8 presets (CSS `overflow-x: auto; scroll-snap-type: x mandatory`), each card a shoebox label with the palette and name; click opens `/studio/forge-runner?d=<encoded preset>`. Thumbnails: pre-render them once with a script or at runtime with a small offscreen canvas — simplest: render palette chips only (no 3D) to keep the landing light.

#### P10.8 Reduced motion and mobile

With reduced motion: no Lenis, no pinning, no scrubbing. Show the exploded view as a static frame (`landing.explode = 1` with labels shown as a list), the material run as a 4-item grid. Use `gsap.matchMedia()` with `"(prefers-reduced-motion: reduce)"`. Test with the OS setting on.

Done when: scrolling the landing is smooth (no jank in the Performance panel), pin sections release correctly, no layout shift, resizing the window re-computes triggers (`ScrollTrigger.refresh()` after the canvas loads), reduced-motion version works, mobile version works.
Commit (one per task): `feat(landing): …`

---

### Phase 11 — Gallery polish

Already built in P7.2. Add: search by name, sort by updated date, and an "Open in studio" transition: use Motion `layoutId` on the thumbnail so it expands into the studio canvas area (works only within the same layout; if cross-route shared layout is too hard, use the View Transitions API: `document.startViewTransition` — check browser support and fall back to a normal navigation).

Commit: `feat(gallery): search, sort, open transition`

---

### Phase 12 — Embed SDK and docs

#### P12.1 Protocol

`lib/embed/protocol.ts` (shared by iframe and host SDK):
```ts
import { z } from "zod";
export const HostToFrame = z.discriminatedUnion("type", [
  z.object({ type: z.literal("sf:setPart"), partId: z.string(), color: z.string().optional(), material: z.string().optional() }),
  z.object({ type: z.literal("sf:setDesign"), encoded: z.string() }),
  z.object({ type: z.literal("sf:getDesign"), requestId: z.string() }),
]);
export const FrameToHost = z.discriminatedUnion("type", [
  z.object({ type: z.literal("sf:ready") }),
  z.object({ type: z.literal("sf:change"), encoded: z.string(), price: z.number() }),
  z.object({ type: z.literal("sf:design"), requestId: z.string(), encoded: z.string() }),
  z.object({ type: z.literal("sf:addToBag"), encoded: z.string(), size: z.string(), price: z.number() }),
  z.object({ type: z.literal("sf:event"), name: z.string(), props: z.record(z.string(), z.unknown()) }),
]);
```

#### P12.2 Embed route

`app/embed/[productId]/page.tsx`: renders `StudioShell` with `embedded` prop: no site header, no bag (Add to bag posts `sf:addToBag` to the parent instead), compact toolbar. Query params: `theme=light|dark`, `accent=<hex without #>` (validate hex; set `--accent-brand` on the root element). Listens to `message` events, validates with `HostToFrame.safeParse`, and only accepts messages from `document.referrer`'s origin or an `allowedOrigin` query param. Posts `FrameToHost` messages with `targetOrigin` = that origin (never `"*"`).

Set headers so it can be framed: in `next.config.ts` `headers()` for `/embed/:path*`: `Content-Security-Policy: frame-ancestors *` (and for every other route `frame-ancestors 'self'`).

#### P12.3 SDK script

`lib/embed/sdk.ts` → built to `public/embed.js` with esbuild (`scripts/build-embed.mjs`, run in `prebuild`). Keep it dependency-free (do not import zod into the SDK; write small type guards instead) and < 4 KB gzipped.
```ts
// usage: ShoeForge.mount(document.getElementById("configurator"), { product: "forge-runner", theme: "light", accent: "2B3CFF" })
type Options = { product: string; theme?: "light" | "dark"; accent?: string; design?: string; height?: string };
```
`mount` creates the iframe (`allow="xr-spatial-tracking; fullscreen; clipboard-write"`, `title="Shoe configurator"`), returns `{ setPart, setDesign, getDesign (Promise), on(event, cb), destroy }`.

#### P12.4 Docs page

`/docs`: quick start (the snippet), options table, methods table, events table, a live example (an iframe embed with buttons "Make it red", "Get design" printing the result), and a short "How it works" with the protocol. Use simple MDX-free JSX with a small `CodeBlock` component (no heavy syntax highlighter; style with CSS).

Done when: a plain HTML test file (`tests/embed-host.html`, served by `npx serve tests`) embeds the configurator from localhost and all methods/events work; messages from a wrong origin are ignored.
Commit: `feat(embed): iframe embed, postMessage SDK, docs`

---

### Phase 13 — Performance, accessibility, SEO, analytics

#### P13.1 Performance

- Lighthouse (mobile) on `/`: Performance ≥ 85, LCP < 2.5 s, CLS < 0.05. On `/studio/forge-runner`: Performance ≥ 70 (3D-heavy), TBT < 300 ms.
- Studio steady state ≥ 55 fps on a mid laptop; ≥ 30 fps on a mid phone. Use `r3f-perf` (dev only, behind `?perf`) to check draw calls (< 40) and memory (textures disposed when switching materials — watch the texture count stay stable after 50 material changes).
- `useGLTF.preload` and `useTexture.preload` for the studio route; landing loads the canvas after the hero text is visible (dynamic import).
- `next/image` for any images; fonts via next/font (no layout shift).
- Turn off N8AO when `PerformanceMonitor` declines (pass a `quality` state).
- `frameloop="demand"` is **not** used (we animate colors and float); but pause rendering when the tab is hidden (R3F does this automatically via rAF).

#### P13.2 Accessibility (WCAG 2.1 AA)

- Everything in the studio is usable with keyboard only (canvas interactions have panel equivalents).
- Canvas has `role="img"` and an `aria-label` that updates with the design summary ("Forge Runner, Ultramarine knit upper, gum rubber sole…") via an `aria-live="polite"` region announcing changes ("Upper changed to suede").
- Color swatches have names; selected state is not color-only (ring + check icon).
- Contrast checked in both themes. Focus visible everywhere. Touch targets ≥ 44 px on mobile.
- Run `npx @axe-core/cli http://localhost:3000` and the Playwright axe check (P14) — 0 serious/critical issues.

#### P13.3 SEO

`app/sitemap.ts`, `app/robots.ts`, metadata per route, `og:image` (P7.7), `app/icon.svg` (anvil glyph) and `app/apple-icon.png`. JSON-LD `SoftwareApplication` on the landing.

#### P13.4 Analytics

`lib/analytics.ts`:
```ts
import { track as vercelTrack } from "@vercel/analytics";
type Props = Record<string, string | number | boolean | null>;
export function track(name: string, props: Props = {}) {
  try { vercelTrack(name, props); } catch {}
  if (typeof window !== "undefined" && window.parent !== window) {
    window.dispatchEvent(new CustomEvent("sf:track", { detail: { name, props } })); // embed bridge listens and posts sf:event
  }
}
```
Check the real import for `track` in `@vercel/analytics` v2.

Commit per task: `perf: …`, `a11y: …`, `feat(seo): …`, `feat(analytics): …`

---

### Phase 14 — Tests, CI, docs, launch

#### P14.1 Unit tests (Vitest)

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", include: ["tests/unit/**/*.test.ts?(x)"], setupFiles: ["tests/setup.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```
Required tests: products config validity, rules, store actions, history gesture (1 drag = 1 undo), codec round trip + rejection cases, pricing, colorway generator determinism, embed protocol parsing.

#### P14.2 E2E (Playwright)

`npx playwright install chromium`. Tests in `tests/e2e/`:
1. Landing loads, hero text visible, "Start designing" navigates to the studio.
2. Studio: wait for the loader to disappear; select "Upper" in the part list; click a palette swatch; the URL `d` param changes; reload → same design (compare `decodeDesign` of the URL).
3. Undo/redo with keyboard.
4. Share: click Share → clipboard contains a URL with `?d=` (grant clipboard permissions in the test).
5. Export PNG triggers a download with a `.png` filename.
6. Add to bag requires a size; then the bag shows 1 item; checkout shows an order number.
7. axe accessibility scan on `/`, `/studio/forge-runner`, `/gallery`, `/docs` (`@axe-core/playwright`) — no serious/critical violations.
8. Visual snapshot of the studio at 1440×900 (WebGL in headless Chromium: launch with `--use-gl=swiftshader` or `--use-angle=swiftshader`; allow a 2% pixel diff).

#### P14.3 CI

Replace `.github/workflows/workflow.yml` (GitHub Pages deploy) with `.github/workflows/ci.yml`:
```yaml
name: CI
on: { push: { branches: [master, "rebuild/**"] }, pull_request: {} }
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
```
Deployment happens through Vercel's GitHub integration (section 9), not this workflow.

#### P14.4 README + case study

Rewrite `README.md`: hero GIF (record the exploded-view scroll and a studio session; keep GIF < 8 MB or use an MP4 in a GitHub release), live demo link, feature list, "Add your own product in 5 minutes" guide (GLB → gltf-transform → product config), embed snippet, tech stack, architecture diagram (the one from 6.3), scripts, license and asset credits.

`docs/CASE_STUDY.md`: problem, constraints, architecture decisions (why schema-driven, why our own materials, why zustand+zundo, why render-to-blob capture, why scroll progress lives outside React), performance numbers before/after (old app vs new: bundle size, Lighthouse, fps), what was hard (decal placement on curved surfaces, one-step undo for drags, scroll ↔ 3D sync), what's next. This is what a hiring manager or buyer reads.

Delete `app/dev/` test pages and any tuning helpers.

Commit: `docs: README and case study`, `ci: lint, typecheck, unit and e2e tests`

---

### Phase 15 — Optional stretch (only after the final checklist passes)

In this order, each in its own branch:
1. X2 Second product — Khronos `MaterialsVariantsShoe` (CC BY 4.0, by Shopify): download the GLB from `https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe`, inspect its meshes with gltfjsx, write `lib/products/variants-shoe.ts` with whatever parts its meshes allow (it may have fewer, coarser parts). Add a product switcher. Credit Shopify per CC BY.
2. X1 Compare mode with drei `View` (two views in one canvas, `/compare?a=…&b=…`).
3. X4 Accounts + cloud saves (Supabase auth + Postgres + storage for thumbnails/uploads).
4. X5 Stripe Checkout in test mode.
5. X3 Live collaboration (Liveblocks presence: see other cursors and selections).

---

## 8. Quality bars

| Area | Bar |
|---|---|
| Lint / types | 0 errors, 0 warnings, strict TS |
| Unit tests | All pass; engine code (`lib/`) ≥ 80% line coverage (`vitest --coverage`) |
| E2E | All pass in CI |
| Lighthouse mobile | `/` ≥ 85 performance, ≥ 95 accessibility, ≥ 95 best practices, 100 SEO |
| FPS | Studio ≥ 55 desktop, ≥ 30 mid phone |
| Bundle | Landing first-load JS < 250 KB gzip excluding the lazily loaded 3D chunk |
| Assets | GLB < 400 KB; each texture < 400 KB; total studio download < 5 MB |
| A11y | axe: 0 serious/critical; full keyboard flow; reduced motion respected |
| Visual | Screenshots at 1440, 1024, 768, 390, 360 px in both themes reviewed; no overflow, no overlapping text |

---

## 9. Deployment

1. Push `rebuild/v2` to GitHub. Open a PR into `master`.
2. Import the repo at vercel.com (framework auto-detected: Next.js). Set env vars: `ANTHROPIC_API_KEY` (optional), `UPSTASH_REDIS_REST_URL`/`TOKEN` (optional), `NEXT_PUBLIC_SITE_URL` = the production URL.
3. Every PR gets a preview URL; test on a real phone (AR!).
4. Merge to `master` → production.
5. Disable GitHub Pages in the repo settings (old site) or make it redirect: replace the Pages content with a tiny `index.html` that has `<meta http-equiv="refresh" content="0; url=https://<new-url>">` — optional.
6. Update the GitHub repo description, website link and topics (`threejs`, `react-three-fiber`, `product-configurator`, `nextjs`, `gsap`, `webxr`).

---

## 10. Known pitfalls

1. **SSR + WebGL:** never import R3F components into a server component. Always `dynamic(() => import(...), { ssr: false })` from inside a client component.
2. **React 19 Strict Mode double-mounts effects in dev.** All GSAP code goes in `useGSAP` (auto cleanup). All manual listeners must be removed in cleanup. ScrollTriggers created outside `useGSAP` must be `kill()`ed.
3. **Don't mutate `useGLTF` materials.** They are cached and shared between every component that loads the same URL (landing + studio + embed). Use our own materials (P3.3).
4. **Color spaces:** only color/albedo textures are `SRGBColorSpace`; normal and roughness stay linear. `THREE.Color.set("#hex")` already converts from sRGB.
5. **Scroll → 3D:** never put scroll progress in React state. Write to a mutable object, read in `useFrame`.
6. **Lenis + ScrollTrigger:** call `ScrollTrigger.refresh()` after fonts and the canvas load (`document.fonts.ready.then(() => ScrollTrigger.refresh())`), otherwise pin positions are wrong.
7. **Decals:** position/normal are local to the mesh; `polygonOffset` avoids z-fighting; a decal on a highly curved area stretches — keep graphic zones on flatter parts.
8. **Undo for drags:** use `useHistoryGesture`, otherwise one color drag creates 60 history entries.
9. **Export without preserveDrawingBuffer:** render and call `toBlob` in the same task (P7.3).
10. **iOS Safari:** WebGL context can be lost on memory pressure — keep textures at 1K, handle `webglcontextlost` by showing "Reload the 3D view".
11. **`useSearchParams` in Next 16** needs a `<Suspense>` boundary or the build fails with a CSR bailout error.
12. **`params` is a Promise** in Next 15+ pages and route handlers. `await` it.
13. **Next `dynamic()` + named exports:** `dynamic(() => import("./X").then((m) => m.X), { ssr: false })`.
14. **postMessage security:** always check `event.origin`; always pass a specific `targetOrigin`.
15. **Big data URLs in zustand history:** uploaded images are stored once in the graphic; zundo stores references, but `JSON.stringify` equality on huge strings is slow. If undo gets slow, compare with a custom equality that skips `src` (compare ids and transforms only).
16. **Mobile drawer + OrbitControls:** stop pointer events on the drawer from reaching the canvas (`onPointerDown={(e) => e.stopPropagation()}` on the drawer content).

---

## 11. Final checklist

Tick each item, with proof (screenshot, test name or link), in the PR description:

- [ ] Old app tagged `v1-legacy`
- [ ] No trademarked names or logos anywhere (`grep -ri "nike\|puma\|adidas\|jordan" app components lib public` returns nothing)
- [ ] F1–F10, G1–G4, C1–C3, S1–S7, A1–A3, M1–M3, E1–E4, L1–L7 all meet their acceptance criteria
- [ ] Both themes reviewed at 5 widths
- [ ] Reduced-motion version reviewed
- [ ] Lighthouse and FPS bars met (numbers in the case study)
- [ ] Unit + e2e + axe green in CI
- [ ] Asset licenses and credits in the footer and README
- [ ] `.env.example` complete; app works without any env vars (AI falls back)
- [ ] README with GIF, live link, "add a product" guide, embed snippet
- [ ] `docs/CASE_STUDY.md` written
- [ ] Deployed on Vercel; share link preview card verified; AR tested on a real phone
