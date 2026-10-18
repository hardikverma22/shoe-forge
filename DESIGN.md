---
name: Shoe Forge
description: The sneaker tech pack, alive. A real 3D shoe with eight numbered, editable parts.
colors:
  night: "#0a0a12"
  sheet: "#ffffff"
  volt: "#d7ff3a"
  signal: "#ff4a1c"
  cobalt: "#1e2bff"
  sweep: "#e6e7ea"
  sweep-hi: "#f7f7f8"
  sweep-lo: "#d6d8dd"
  on-sweep-2: "#4f5263"
  on-night-2: "#a9acd2"
  on-cobalt-2: "#c9ccff"
  paper: "#e9eaee"
  surface: "#ffffff"
  surface-2: "#f5f6fc"
  ink: "#0a0a12"
  ink-muted: "#4b4f6e"
  line: "#d3d6ea"
  line-strong: "#0a0a12"
  accent: "#1e2bff"
  accent-ink: "#ffffff"
  select: "#d7ff3a"
  select-ink: "#0a0a12"
  danger: "#d9321a"
  studio-hi: "#fbfbfc"
  studio-lo: "#d9dbe0"
  paper-dark: "#080912"
  surface-dark: "#11132a"
  surface-2-dark: "#171a36"
  ink-dark: "#f1f2ff"
  ink-muted-dark: "#a3a7d4"
  line-dark: "#262a52"
  accent-dark: "#7a84ff"
  accent-ink-dark: "#080912"
  danger-dark: "#ff6a4d"
  studio-hi-dark: "#22243a"
  studio-lo-dark: "#05060c"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(4rem, 10.5vw, 9.5rem)"
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: "-0.012em"
    fontVariation: "\"wdth\" 62"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(3rem, 7.5vw, 7rem)"
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: "-0.012em"
    fontVariation: "\"wdth\" 62"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: "-0.012em"
    fontVariation: "\"wdth\" 62"
  title-sm:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: "-0.012em"
    fontVariation: "\"wdth\" 62"
  body-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.375
    fontVariation: "\"wdth\" 100"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontVariation: "\"wdth\" 100"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
    fontVariation: "\"wdth\" 100"
  spec:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.02em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 88"
rounded:
  tile: "12px"
  card: "14px"
  surface: "16px"
  sheet: "24px"
  control: "999px"
spacing:
  gutter-sm: "20px"
  gutter-lg: "40px"
  section-sm: "96px"
  section-lg: "144px"
  grid: "32px"
components:
  cta-sweep:
    backgroundColor: "{colors.night}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "56px"
    padding: "0 24px 0 28px"
  cta-final:
    backgroundColor: "{colors.night}"
    textColor: "{colors.volt}"
    rounded: "{rounded.control}"
    height: "64px"
    padding: "0 28px 0 32px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-select:
    backgroundColor: "{colors.select}"
    textColor: "{colors.select-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  callout-label:
    backgroundColor: "{colors.night}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 12px 4px 4px"
  callout-label-active:
    backgroundColor: "{colors.volt}"
    textColor: "{colors.night}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 12px 4px 4px"
  part-row-selected:
    backgroundColor: "{colors.select}"
    textColor: "{colors.select-ink}"
    rounded: "{rounded.tile}"
    padding: "10px"
  tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "36px"
  segmented-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 14px"
  input-pill:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 20px"
  spec-readout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.spec}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 20px 10px 12px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    width: "min(94vw, 34rem)"
  material-strip:
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: Shoe Forge

## Overview

**Creative North Star: "The Live Tech Pack"**

Shoe Forge is a factory spec sheet that came to life around a real 3D sneaker. Every part is numbered 01 to 08, tethered to the shoe by a thin leader line, and every callout is a control: point at it and the spec line prints the part, its material and its HEX code; click it and you recolor that part. Browsing and authoring are one object. The page reads like printed stock (a neutral photo sweep, night, white sheet, volt) with a condensed industrial headline voice and a monospaced spec voice for every number.

The grounds stay quiet so the shoe carries the color. The hero and the studio sit on a seamless light photo sweep (lit center, darker floor), lit by a neutral softbox rig with neutral tone mapping so a picked color renders as picked. Night takes over for the part tour, capabilities and footer; white sheet holds the material swatch book; the colorway section drenches the whole stage in each pair's own color; the closing section is a volt field. Saturated color lives in the pair, in volt selection, and in the colorway fields, never in the furniture.

The direction refuses the category default: a glowing shoe floating on black with a neon button. The hero was revised from a cobalt field to the neutral sweep at the user's request ("the blue is too loud"); cobalt survives only as the studio's light-theme accent, the share card ground and a few small accents.

**Key Characteristics:**
- Neutral photo sweep under the shoe; color comes from the pair.
- Numbered callouts (01 to 08) with leader lines and dots, tethered to the live 3D model.
- Archivo at its narrowest width (wdth 62, weight 850) for every heading.
- Martian Mono for part numbers, HEX codes, measurements and status lines, with slash separators.
- Volt means "this one": active callouts, the selected part, the toured part, success.
- Pill controls everywhere; rounded rectangles only for content.
- Two token layers: fixed stock for the home page, themed studio tokens (light default, dark under `.dark`).

## Colors

A printed-stock palette: neutral grounds (sweep, night, sheet, paper) with one selection color (volt) and one working accent (cobalt in light, periwinkle in dark), so the shoe is always the most colorful thing on screen.

### Primary
- **Volt** (volt / select): the selection color. Active callout labels, leader lines and dots; the selected row in the parts rail and selected part chips; the part-number badge on the studio callout; the toured part's ring; success toasts; text selection; the focus ring on stock sections; the closing "Your pair is waiting." field; the 3D selection highlight on the home page and in the dark studio. Always paired with night text.
- **Cobalt** (cobalt / accent, light theme): the studio's working accent. Primary buttons (Save, Open), focus rings, range-track fill, checked swatch rings, custom-color links, the loading bar, and the 3D selection highlight in the light studio. On the home page it is limited to small accents: the second headline line in the materials section, the discs behind the four marks in capabilities, the checked ring in the hero color tray. It is also the ground of the generated share card. Never a section ground on the home page.

### Secondary
- **Signal Orange** (signal): lives in the pair, not the interface. The default hero pair's lining and patent side stripes, a hero tray swatch, and the mesh sample in the swatch book. Code uses the literal value rather than the token.
- **Periwinkle** (accent-dark): the studio accent under `.dark`, replacing cobalt where cobalt would vibrate on navy surfaces; paired with near-black accent ink.

### Neutral
- **Night** (night): the ink of the home page and the ground of the tour, capabilities and footer; the fill of the hero and final CTAs; the callout label fill (at 85% at rest).
- **Sheet** (sheet): white stock. The material swatch-book section, text on night, the hero color tray.
- **Photo Sweep** (sweep, sweep-hi, sweep-lo): the hero and 404 backdrop. A radial highlight (sweep-hi) sits above-center and a floor falloff (sweep-lo) darkens the bottom 45%.
- **Sweep Graphite** (on-sweep-2): secondary text, slashes and idle spec copy on the sweep.
- **Night Lavender** (on-night-2): secondary text on night (capabilities, footer).
- **Pale Cobalt** (on-cobalt-2): secondary text on night in the part tour and on the share card. The name is left over from the retired cobalt hero.
- **Studio Paper / Surface / Surface 2** (paper, surface, surface-2): the studio's backdrop, panels and recessed fields (inputs, the custom-color drawer). Dark equivalents carry the `-dark` suffix and move to deep navy.
- **Ink / Ink Muted** (ink, ink-muted): studio text and secondary text; near-white and lavender in dark.
- **Line / Line Strong** (line, line-strong): hairline panel borders and dividers; line-strong is full ink for outlined part numbers and hover borders.
- **Studio Highlight / Floor** (studio-hi, studio-lo): the studio's own sweep, which follows the theme.
- **Danger** (danger): destructive buttons, error toasts and inline error text.

### Named Rules
**The Shoe Carries the Color Rule.** Grounds stay neutral (sweep, paper, night, sheet). Saturated color belongs to the pair, to volt selection and to a colorway's own field. The 3D rig uses neutral softboxes and neutral tone mapping so picked colors stay true.

**The Volt Means Selected Rule.** Volt marks the thing being pointed at or edited, with night text on it. Apart from the closing field, it is never decorative fill.

**The Two Stocks Rule.** Stock tokens (night, sheet, sweep, volt, cobalt) are fixed and ignore the theme; the home page uses only these. Studio tokens (paper, surface, ink, accent, select) follow `.dark`; the studio and gallery use only these.

**The Full-Ink Field Rule.** On a colorway field, all text, including secondary text, is full ink: night or white, whichever `inkOn` picks for the field. Fields range from yellow to red, so tints are not allowed.

## Typography

**Display Font:** Archivo, variable width axis at wdth 62 (with system-ui)
**Body Font:** Archivo at wdth 100 (with system-ui)
**Label/Mono Font:** Martian Mono at wdth 88 (with ui-monospace)

**Character:** One industrial grotesque in two widths: squeezed to its narrowest and heaviest for headlines that read like a stamped spec sheet, and normal width for the interface. A narrow monospace prints the numbers.

### Hierarchy
- **Display** (850, clamp(4rem, 10.5vw, 9.5rem), 0.88): the hero ("Yours, part by part.") and the closing section. Lines can rise out of their own masks.
- **Headline** (850, clamp(3rem, 7.5vw, 7rem), 0.88): section headings for materials and capabilities, and the colorway name (up to clamp(3.5rem, 9vw, 8.5rem)) and the tour's part name.
- **Title** (850, 2.5rem, 0.88): the studio part heading, capability row titles (2.5rem to 3.25rem), material strip names (2rem to 2.5rem), the gallery empty state.
- **Title Small** (850, 1.75rem, 0.88): the parts-rail heading, dialog titles, the logo wordmark (1.55rem), colorway preset names (1.5rem).
- **Body Large** (400, 1.125rem, 1.375): landing paragraphs, max width about 28rem to 30rem.
- **Body** (400, 0.875rem): studio descriptions and helper text, usually in ink-muted.
- **Label** (600 to 700, 0.8125rem to 1rem, line-height 1): buttons, tabs, callout labels, chips, field headings ("Material", "Color" at 0.875rem bold).
- **Spec** (Martian Mono 400, 0.6875rem, 0.02em, tabular numerals): part numbers, HEX codes, roughness values, counters ("03 / 08"), the spec line and the hero's printed readout.

### Named Rules
**The Condensed Voice Rule.** Every heading uses the display utility: Archivo at wdth 62, weight 850, leading 0.88, tracking -0.012em. There is no second display face.

**The Spec Voice Rule.** Martian Mono is only for numbers, HEX codes, part numbers, measurements and one-line status readouts, with " / " separating fields (e.g. "06 / Side stripes / Leather / #2B3CFF"). Never body copy.

**The Two-Digit Rule.** Parts are always numbered with two digits (01 to 08) in the spec voice, set inside a round badge.

## Layout

The home page is a stack of full-viewport scenes over one fixed, transparent 3D canvas. Each scene marks a slot (a box the canvas reads) and the shoe flies between slots as you scroll. Content lives in a container capped at 92rem with a 20px gutter on phones and 40px from md up; long sections pad 96px vertically on phones and 144px from md up.

Scenes use a two-column grid from md: copy on the left (about 0.85fr to 0.95fr) and the shoe slot on the right (about 1.05fr to 1.15fr); on phones the slot stacks above or between the copy. The part tour and colorways are CSS-sticky pinned scenes, 100svh tall inside a runway of 100svh plus 42svh to 45svh per stop. The hero's bottom edge is a hairline rule carrying the spec line. Callout labels sit on two rails, above and below the shoe, and push apart so they never overlap; under 700px they collapse to number-only badges.

The studio is a full-height app: a 64px toolbar, then at lg a 15.5rem parts rail, the canvas, and a 24rem side panel. Below lg the rail becomes a row of part chips and the panel becomes a bottom sheet (8.75rem collapsed, 64dvh open). Floating readouts (spec line, view bar) sit in the canvas's bottom corners. The gallery uses a 3-column card grid with a faint 32px drafting grid behind each preview.

## Elevation & Depth

Grounds are flat. Depth comes from the 3D scene itself: two contact shadows under the sole (a tight one where it meets the floor and a wide, faint one) on top of the sweep's lit-center falloff. Shadows in the interface belong only to things that float above the shoe or the page, and they are long, soft, negative-spread drops tinted night-blue (rgb 5 6 26) rather than gray.

### Shadow Vocabulary
- **Float, small** (`box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.45)`): the active callout label.
- **Float, medium** (`box-shadow: 0 12px 30px -12px rgb(5 6 26 / 0.6)`): the studio callout label; the view bar uses `0 10px 30px -18px rgb(5 6 26 / 0.5)`.
- **Float, large** (`box-shadow: 0 24px 60px -20px rgb(5 6 26 / 0.6)`): the hero color tray; toasts use `0 16px 40px -16px rgb(5 6 26 / 0.6)`.
- **Modal** (`box-shadow: 0 40px 80px -30px rgb(5 6 26 / 0.55)`): dialogs.
- **Sheet** (`box-shadow: 0 -20px 50px -30px rgb(5 6 26 / 0.45)`): the studio's bottom sheet on phones and tablets (removed at lg).
- **Thumb** (`box-shadow: 0 1px 2px rgb(10 10 18 / 0.12), 0 4px 10px -4px rgb(10 10 18 / 0.18)`): the selected segment in a segmented control.
- **Bead** (`box-shadow: inset 0 -3px 6px rgb(0 0 0 / 0.14)`): color swatches, so they read as rounded buttons of dye.

### Named Rules
**The Flat Ground, Floating Tools Rule.** Panels, rails and sections never cast shadows. Only floating tools (callouts, tray, toasts, view bar, dialogs, sheet) do, using the night-tinted vocabulary above.

## Shapes

Two shape families. Everything you press is a full pill (999px): buttons, icon buttons, tabs, segmented controls, chips, inputs, callout labels, toasts, the spec readout, and the round part-number badges and swatches. Content gets gently rounded rectangles: material tiles and part rows (12px), material strips in the swatch book (14px), dialogs, gallery and colorway cards (16px), the top of the bottom sheet (24px). Borders are 1px hairlines in line, or 1.5px full-ink rings around swatches on colorway fields. The logo is itself a callout (a ring, a dot and a leader line) and leader lines are 1px to 1.5px with non-scaling strokes.

## Components

### Buttons
Solid, rounded and confident; a hover is a small lift, not a color change.
- **Shape:** full pill (999px).
- **Home CTAs:** night fill with sheet text, 56px tall (64px with volt text on the closing field), bold label with a trailing up-right arrow. On a colorway field the CTA inverts to field-ink fill with field-colored text.
- **Studio primary:** accent fill with accent-ink text at 40px (32px small, 48px large); also a select (volt) variant, an outline variant (surface, line border, line-strong on hover), a ghost and a danger variant.
- **Hover / Focus:** home CTAs lift 2px to 4px over 500ms on the expo-out curve and the arrow nudges up-right; studio buttons brighten (filter) and press to 98% scale. Focus is a 2px accent outline at 3px offset (volt on stock sections).
- **Icon buttons:** 40px round, ghost, ink at 6% on hover.

### Chips
- **Style:** pills with a 1px border. Part chips (phones) carry a swatch dot, a spec number and the label; colorway chips carry the pair's name; prompt chips are small bordered pills.
- **State:** selected part chips fill with volt; the current colorway chip fills with the field's ink and takes the field color as text.

### Cards / Containers
- **Corner Style:** 12px tiles, 14px material strips, 16px cards and dialogs.
- **Background:** surface in the studio and gallery; a colorway's own field for colorway cards; the material swatch surface for material tiles.
- **Shadow Strategy:** flat at rest (see Elevation). Cards lift 2px to 4px on hover.
- **Border:** 1px line, or a 1px ring on material tiles that becomes a 2px accent ring with offset when checked.
- **Internal Padding:** 12px to 20px.

### Inputs / Fields
- **Style:** pills on surface-2 with a 1px line border, 40px to 48px tall; the HEX field uses the spec voice in uppercase.
- **Focus:** the border shifts to accent (or a 2px accent ring for the inline design-name field).
- **Range:** a 4px pill track filled with accent up to the value, and an 18px round thumb (surface fill, 2px accent border) that scales to 1.15 while dragged.

### Navigation
- **Site header:** logo left; text links and a "Start designing" pill right. Three tones: on the sweep (night text, night CTA), on stock night (sheet text, volt CTA) and in the studio (ink text, accent CTA).
- **Studio tabs:** a row of equal pills; the active tab is ink with paper text, inactive tabs are ink-muted with a 6% ink hover. Arrow keys move between them.
- **Tour progress:** eight 3px bars; done bars are sheet at 60%, the current bar is volt.

### Part Callout (signature)
A label pill tethered to the live 3D model by a polyline leader and a dot at the part's center. At rest: night (85%) pill with sheet text, a 24px round spec badge with a 60% sheet border, the part name and a swatch dot of the part's color. Active (hovered, focused or open): volt pill with night text, a 1.5px volt leader and a 4.5px volt dot. Clicking opens a white color tray beside the label. In the studio the single callout is an ink pill with a volt number badge and an ink leader.

### Spec Line (signature)
A one-line printed readout in the spec voice that prints whatever part you point at: number badge, part, material and HEX, separated by slashes in the secondary color, followed by a swatch dot. It sits on the hero's bottom hairline rule, and in the studio as a translucent surface pill (85%, backdrop blur) in the canvas's bottom-left corner.

### Material Swatch (signature)
A baked grayscale relief texture of the real material multiplied over the chosen color, so a swatch shows grain at the right color. Patent instead uses a render of the real glossy material blended in hard light. In the swatch book each strip lays a field-tinted scrim under its text so the grain never breaks contrast, and it shows roughness, sheen and clearcoat as mono meters.

## Do's and Don'ts

### Do:
- **Do** put the shoe on the neutral sweep (sweep with sweep-hi and sweep-lo) on the home page, and on the theme-following studio sweep in the studio.
- **Do** use volt with night text for whatever is selected, hovered or being toured.
- **Do** number parts 01 to 08 in Martian Mono inside a round badge, and print states as a slash-separated spec line.
- **Do** set every heading in the display utility (Archivo wdth 62, 850, leading 0.88).
- **Do** make every control a full pill (999px) and keep content rectangles at 12px to 16px.
- **Do** keep floating-tool shadows long, soft and night-tinted (rgb 5 6 26) with negative spread.
- **Do** pick text on any colorway field with full ink (night or white), including secondary text.
- **Do** ease motion on the expo-out curve (cubic-bezier(0.16, 1, 0.3, 1)) and drop all motion under prefers-reduced-motion.

### Don't:
- **Don't** float a glowing shoe on black with a neon button; that is the category default this system refuses.
- **Don't** use cobalt as a section ground on the home page; it was retired from the hero because it was too loud. Keep it to the studio accent, the share card and small accents.
- **Don't** light or tone-map the shoe with color: keep the softbox rig neutral and use neutral tone mapping (ACES shifts saturated blues toward violet).
- **Don't** use Martian Mono for paragraphs or headings.
- **Don't** mix stock tokens into the studio or themed studio tokens into the home page.
- **Don't** give panels, rails or sections a drop shadow.
- **Don't** use square-cornered buttons or inputs.
