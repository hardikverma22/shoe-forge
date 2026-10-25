import { ProductDef, type NamedColor } from "./schema";
import { forgeRunner } from "./forge-runner";

/**
 * The brand lineup: real silhouettes from openly licensed Sketchfab models (see scripts/shoes.mjs).
 * Parts are whole materials or color regions of the scan's texture, recolored in place.
 * Region indices and default colors come from public/models/<id>/manifest.json.
 * Fan project: not affiliated with or endorsed by any of these brands.
 */

export const NAMED_COLORS: NamedColor[] = [
  { hex: "#F4F4F2", name: "White" },
  { hex: "#EDE6D6", name: "Sail" },
  { hex: "#8E9196", name: "Wolf Grey" },
  { hex: "#4A4D52", name: "Cool Grey" },
  { hex: "#111111", name: "Black" },
  { hex: "#C8102E", name: "University Red" },
  { hex: "#7A1F2B", name: "Team Maroon" },
  { hex: "#FF5A1F", name: "Total Orange" },
  { hex: "#F2C14E", name: "Varsity Maize" },
  { hex: "#D7FF3A", name: "Volt" },
  { hex: "#1F5C3A", name: "Pine Green" },
  { hex: "#8DB9E8", name: "University Blue" },
  { hex: "#1F4FBF", name: "Game Royal" },
  { hex: "#1C2541", name: "Obsidian" },
  { hex: "#6E3FB8", name: "Court Purple" },
  { hex: "#F25C9C", name: "Laser Pink" },
  { hex: "#B07A47", name: "Gum" },
  { hex: "#D6A65C", name: "Wheat" },
];

const PALETTE = NAMED_COLORS.slice(0, 12).map((c) => c.hex);
const VIEWS = forgeRunner.cameraViews;
const sketchfab = (path: string) => `https://sketchfab.com/3d-models/${path}`;

export const airJordan1 = ProductDef.parse({
  id: "air-jordan-1",
  name: "Air Jordan 1 High",
  brand: "Jordan",
  category: "Basketball",
  kind: "tint",
  tagline: "The 1985 high-top that started it all.",
  modelUrl: "/models/air-jordan-1.glb",
  orientation: { x: 0, y: 90, z: 0 },
  credit: { author: "DeezVertz", url: sketchfab("nike-air-jordan-1-fbe52211197c4b449f29de5aa4eb0611"), license: "CC BY 4.0" },
  basePrice: 180,
  currency: "USD",
  realLengthMeters: 0.3,
  parts: [
    { id: "base", label: "Quarter", source: { material: "MAT_Shoe_R", region: 1 }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "leather", color: "#C2C2C2" }, description: "The quarter panels on both sides." },
    { id: "overlays", label: "Toe box, heel and wing", source: { material: "MAT_Shoe_R", region: 2 }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "leather", color: "#A12024" }, description: "The perforated toe box, the heel and the ankle wing with its logo." },
    { id: "swoosh", label: "Swoosh, mudguard and collar", source: { material: "MAT_Shoe_R", region: 0 }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "leather", color: "#0E0E0E" }, description: "The Swoosh, the mudguard around the toe, the eyestay and the collar." },
    { id: "midsole", label: "Midsole", source: { material: "MAT_Shoe_R", region: 3 }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#F2F1F1" }, description: "The cupsole wall." },
    { id: "outsole", label: "Outsole", source: { material: "MAT_Shoe_R", region: 4 }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#BD272C" }, description: "The rubber band at the bottom of the cupsole." },
    { id: "laces", label: "Laces", source: { material: "MAT_Laces_R" }, allowedMaterials: ["canvas", "knit"], default: { material: "canvas", color: "#232323" }, description: "Flat laces." },
    { id: "insole", label: "Insole", view: "top", source: { material: "MAT_Sole_R" }, allowedMaterials: ["mesh", "leather"], default: { material: "mesh", color: "#1E1D1D" }, description: "The sockliner inside." },
  ],
  colors: NAMED_COLORS,
  palette: PALETTE,
  cameraViews: VIEWS,
  graphicZones: ["base", "overlays", "swoosh"],
  rules: [{ type: "maxGraphics", max: 4 }],
  colorways: [
    { id: "bred-toe", name: "Bred Toe", story: "Gym red toe box and heel, black Swoosh on white (2018).", parts: { base: { color: "#F4F4F2" }, overlays: { color: "#C8102E" }, swoosh: { color: "#111111" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#C8102E" }, laces: { color: "#111111" } } },
    { id: "royal-toe", name: "Royal Toe", story: "The toe formula in game royal and black (2020).", parts: { base: { color: "#F4F4F2" }, overlays: { color: "#1F4FBF" }, swoosh: { color: "#111111" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#1F4FBF" }, laces: { color: "#111111" } } },
    { id: "yellow-toe", name: "Yellow Toe", story: "Named, like every toe pair, for the color of its toe box (2019).", parts: { base: { color: "#F4F4F2" }, overlays: { color: "#F2C14E" }, swoosh: { color: "#111111" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#F2C14E" }, laces: { color: "#111111" } } },
  ],
});

export const chuckTaylor = ProductDef.parse({
  id: "chuck-taylor",
  name: "Chuck Taylor All Star High",
  brand: "Converse",
  category: "Canvas",
  kind: "tint",
  tagline: "Canvas, rubber and a star on the ankle since 1917.",
  modelUrl: "/models/chuck-taylor.glb",
  orientation: { x: 0, y: 0, z: 0 },
  credit: { author: "turbopurr", url: sketchfab("converse-classic-0c6ee67086ed43ff8f531a5db991c8ee"), license: "CC BY 4.0" },
  basePrice: 70,
  currency: "USD",
  realLengthMeters: 0.29,
  parts: [
    { id: "canvas", label: "Canvas", source: { material: "FIRM" }, allowedMaterials: ["canvas", "suede", "leather"], default: { material: "canvas", color: "#454442" }, description: "The canvas upper." },
    { id: "laces", label: "Laces", source: { material: "LACE" }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#C6C2BC" }, description: "Flat cotton laces." },
    { id: "eyelets", label: "Eyelets", source: { material: "RINGS" }, allowedMaterials: ["rubber", "patent"], default: { material: "rubber", color: "#B3B3B3" }, description: "Metal rings for the laces." },
    { id: "sidewall", label: "Sidewall and toe cap", source: { material: "SOIL" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#FFFFFF" }, description: "The vulcanized rubber wall and the toe cap on top." },
    { id: "stripe", label: "Sidewall stripe", source: { material: "SOIL_BLACK" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#111111" }, description: "The thin line around the foxing." },
    { id: "toecap", label: "Toe bumper", source: { material: "SOIL_FRONT" }, allowedMaterials: ["rubber", "patent"], default: { material: "rubber", color: "#FFF7F7" }, description: "The rubber bumper around the front of the toe." },
    { id: "outsole", label: "Outsole", source: { material: "soil_bottom" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#454442" }, description: "Diamond-tread rubber." },
    { id: "label", label: "Ankle patch", source: { material: "LABLE" }, allowedMaterials: ["rubber", "leather"], default: { material: "rubber", color: "#454442" }, description: "The round star patch on the inner ankle." },
  ],
  colors: NAMED_COLORS,
  palette: PALETTE,
  cameraViews: VIEWS,
  graphicZones: ["canvas"],
  rules: [{ type: "maxGraphics", max: 4 }],
  colorways: [
    { id: "black", name: "Black", story: "Black canvas, white laces and toe cap: the core high-top.", parts: { canvas: { color: "#111111" }, laces: { color: "#F4F4F2" }, sidewall: { color: "#F4F4F2" }, toecap: { color: "#F4F4F2" } } },
    { id: "optical-white", name: "Optical White", story: "Pure white canvas, white laces and sole.", parts: { canvas: { color: "#F4F4F2" }, laces: { color: "#F4F4F2" }, sidewall: { color: "#F4F4F2" }, toecap: { color: "#F4F4F2" } } },
    { id: "navy", name: "Navy", story: "Deep blue canvas, white laces.", parts: { canvas: { color: "#1C2541" }, laces: { color: "#F4F4F2" }, sidewall: { color: "#F4F4F2" }, toecap: { color: "#F4F4F2" } } },
    { id: "maroon", name: "Maroon", story: "Maroon canvas, a core color.", parts: { canvas: { color: "#7A1F2B" }, laces: { color: "#F4F4F2" }, sidewall: { color: "#F4F4F2" }, toecap: { color: "#F4F4F2" } } },
    { id: "red", name: "Red", story: "Red canvas, one of the colors Converse keeps in stock.", parts: { canvas: { color: "#C8102E" }, laces: { color: "#F4F4F2" }, sidewall: { color: "#F4F4F2" }, toecap: { color: "#F4F4F2" } } },
  ],
});

export const dunkLow = ProductDef.parse({
  id: "dunk-low",
  name: "Nike Dunk Low",
  brand: "Nike",
  category: "Court",
  kind: "tint",
  tagline: "College colors, made for the court in 1985.",
  modelUrl: "/models/dunk-low.glb",
  orientation: { x: 0, y: 0, z: 0 },
  credit: { author: "kirilldrac78", url: sketchfab("dunk-low-4a3dd6224c2e4c20816ffc159fd82879"), license: "CC BY 4.0" },
  basePrice: 115,
  currency: "USD",
  realLengthMeters: 0.29,
  // A clean CG model: every part is its own flat material, so each recolors exactly.
  parts: [
    { id: "base", label: "Base", source: { material: "Blue_Shammy_Leather" }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "leather", color: "#D1D1D1" }, description: "Toe box and quarter panels." },
    { id: "overlays", label: "Overlays", source: { material: "Blue_Suede_Leather" }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "suede", color: "#4F4F4F" }, description: "Mudguard, eyestay and heel overlays." },
    { id: "swoosh", label: "Swoosh", source: { material: "Yellow_Shammy_Leather" }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "leather", color: "#806B9E" }, description: "The Swoosh on both sides." },
    { id: "laces", label: "Laces", source: { material: "Material.005" }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#E7E7E7" }, description: "Flat laces." },
    { id: "tongue", label: "Tongue", source: { material: "Copper_Grid" }, allowedMaterials: ["mesh", "canvas", "leather"], default: { material: "mesh", color: "#E7E7E7" }, description: "The nylon tongue." },
    { id: "lining", label: "Collar lining", source: { material: "Material.003" }, allowedMaterials: ["mesh", "leather"], default: { material: "mesh", color: "#E7E7E7" }, description: "Padded collar and lining." },
    { id: "tag", label: "Tongue tag", source: { material: "Material.001" }, allowedMaterials: ["leather", "canvas"], default: { material: "leather", color: "#E7E7E7" }, description: "The tag at the top of the tongue." },
    { id: "stitching", label: "Stitching", source: { material: "Material.002" }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#575757" }, description: "Thread around every panel." },
    { id: "midsole", label: "Midsole", source: { material: "Material.009" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#4A4A4A" }, description: "The cupsole wall." },
    { id: "outsole", label: "Outsole", source: { material: "Material.008" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#504368" }, description: "Rubber traction underfoot, and the sockliner." },
  ],
  colors: NAMED_COLORS,
  palette: PALETTE,
  cameraViews: VIEWS,
  graphicZones: ["base", "overlays"],
  rules: [{ type: "maxGraphics", max: 4 }],
  colorways: [
    { id: "panda", name: "Panda", story: "White base, black overlays: StockX's most resold sneaker.", parts: { base: { color: "#F4F4F2" }, overlays: { color: "#111111", material: "leather" }, swoosh: { color: "#111111" }, laces: { color: "#F4F4F2" }, tongue: { color: "#F4F4F2" }, lining: { color: "#F4F4F2" }, tag: { color: "#111111" }, stitching: { color: "#F4F4F2" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#111111" } } },
    { id: "syracuse", name: "Syracuse", story: "White and orange blaze, a 1985 Be True to Your School original.", parts: { base: { color: "#F4F4F2" }, overlays: { color: "#FF5A1F", material: "leather" }, swoosh: { color: "#FF5A1F" }, laces: { color: "#F4F4F2" }, tongue: { color: "#F4F4F2" }, lining: { color: "#F4F4F2" }, tag: { color: "#FF5A1F" }, stitching: { color: "#F4F4F2" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#FF5A1F" } } },
    { id: "kentucky", name: "Kentucky", story: "White and varsity royal, from the same 1985 school pack.", parts: { base: { color: "#F4F4F2" }, overlays: { color: "#1F4FBF", material: "leather" }, swoosh: { color: "#1F4FBF" }, laces: { color: "#F4F4F2" }, tongue: { color: "#F4F4F2" }, lining: { color: "#F4F4F2" }, tag: { color: "#1F4FBF" }, stitching: { color: "#F4F4F2" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#1F4FBF" } } },
    { id: "michigan", name: "Michigan", story: "Varsity maize and midnight navy, another 1985 school.", parts: { base: { color: "#F2C14E" }, overlays: { color: "#1C2541", material: "leather" }, swoosh: { color: "#1C2541" }, laces: { color: "#F2C14E" }, tongue: { color: "#1C2541" }, lining: { color: "#F2C14E" }, tag: { color: "#F2C14E" }, stitching: { color: "#1C2541" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#1C2541" } } },
    { id: "unc", name: "UNC", story: "White and university blue for North Carolina.", parts: { base: { color: "#F4F4F2" }, overlays: { color: "#8DB9E8", material: "leather" }, swoosh: { color: "#8DB9E8" }, laces: { color: "#F4F4F2" }, tongue: { color: "#F4F4F2" }, lining: { color: "#F4F4F2" }, tag: { color: "#8DB9E8" }, stitching: { color: "#F4F4F2" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#8DB9E8" } } },
  ],
});

export const pumaSuede = ProductDef.parse({
  id: "puma-suede",
  name: "PUMA Suede Classic",
  brand: "PUMA",
  category: "Court",
  kind: "tint",
  tagline: "The b-boy suede since 1968.",
  modelUrl: "/models/puma-suede.glb",
  orientation: { x: 0, y: 90, z: 0 },
  credit: { author: "Toni Escribano Llorente", url: sketchfab("puma-suede-5b098581cb7040d8ba30955ddf2e04c8"), license: "CC BY-NC 4.0" },
  basePrice: 75,
  currency: "USD",
  realLengthMeters: 0.29,
  parts: [
    { id: "upper", label: "Suede upper", source: { material: "material_0", region: 0 }, allowedMaterials: ["suede", "leather"], default: { material: "suede", color: "#DA4750" }, description: "Soft suede upper." },
    { id: "formstrip", label: "Formstrip", source: { material: "material_0", region: 1 }, allowedMaterials: ["leather", "suede"], default: { material: "leather", color: "#E2CCC0" }, description: "The Formstrip on both sides." },
    { id: "laces", label: "Laces", source: { material: "material_0", region: 3 }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#D21E39" }, description: "Fat laces." },
    { id: "sole", label: "Sole", source: { material: "material_0", region: 4 }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#DAC3B6" }, description: "The rubber cupsole." },
    { id: "lining", label: "Lining", source: { material: "material_0", region: 5 }, allowedMaterials: ["leather", "mesh"], default: { material: "leather", color: "#9D948B" }, description: "Inner lining and insole." },
    // The scan's print is a washed-out cream; the default paints it the real gold foil.
    { id: "logo", label: "PUMA print", view: "side", source: { material: "material_0", region: 6, color: "#E4B9A3" }, allowedMaterials: ["leather", "patent"], default: { material: "leather", color: "#C9A45A" }, description: "The foil PUMA Suede print on the side." },
  ],
  colors: NAMED_COLORS,
  palette: PALETTE,
  cameraViews: VIEWS,
  graphicZones: ["upper"],
  rules: [{ type: "maxGraphics", max: 4 }],
  colorways: [
    { id: "ribbon-red", name: "Ribbon Red", story: "Red suede, white Formstrip (365347).", parts: { upper: { color: "#C8102E" }, formstrip: { color: "#F4F4F2" }, laces: { color: "#C8102E" }, sole: { color: "#F4F4F2" } } },
    { id: "red-black", name: "Red Black", story: "Red suede with a black Formstrip (363242-25).", parts: { upper: { color: "#C8102E" }, formstrip: { color: "#111111" }, laces: { color: "#C8102E" }, sole: { color: "#F4F4F2" } } },
    { id: "black-white", name: "Black White", story: "Black suede, white Formstrip.", parts: { upper: { color: "#111111" }, formstrip: { color: "#F4F4F2" }, laces: { color: "#111111" }, sole: { color: "#F4F4F2" } } },
    { id: "verdant-green", name: "Verdant Green", story: "Green suede with a navy Formstrip (363242-22).", parts: { upper: { color: "#1F5C3A" }, formstrip: { color: "#1C2541" }, laces: { color: "#1F5C3A" }, sole: { color: "#F4F4F2" } } },
  ],
});

export const oldSkool = ProductDef.parse({
  id: "old-skool",
  name: "Vans Old Skool",
  brand: "Vans",
  category: "Skate",
  kind: "tint",
  tagline: "The skate shoe with the side stripe, 1977.",
  modelUrl: "/models/old-skool.glb",
  orientation: { x: 0, y: 90, z: 0 },
  credit: { author: "kanesk06", url: sketchfab("shoes-mockup-asset-vans-skate-old-skool-8d8cecbddb7a4d7b8be72c5e3ec86c72"), license: "CC BY 4.0" },
  basePrice: 70,
  currency: "USD",
  realLengthMeters: 0.29,
  // A neutral-gray CG mockup made for coloring: every panel is its own clean island, and the
  // default is painted as the classic black and white (source.color is the model's own gray).
  parts: [
    { id: "toe", label: "Toe and tongue", view: "three-quarter", source: { material: "upper", region: 5, color: "#5B5B5B" }, allowedMaterials: ["suede", "canvas", "leather"], default: { material: "suede", color: "#111111" }, description: "Suede toe cap and the tongue." },
    { id: "quarters", label: "Quarters", view: "three-quarter", source: { material: "upper", region: 3, color: "#797979" }, allowedMaterials: ["canvas", "suede", "leather"], default: { material: "canvas", color: "#111111" }, description: "Canvas quarter panels and eyestay." },
    { id: "stripe", label: "Jazz stripe", view: "side", source: { material: "upper", region: 8, color: "#BCBCBC" }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "leather", color: "#F4F4F2" }, description: "The side stripe on both sides." },
    { id: "heel", label: "Heel counter", source: { material: "upper", region: 2, color: "#929292" }, allowedMaterials: ["suede", "leather"], default: { material: "suede", color: "#111111" }, description: "The suede heel counter." },
    { id: "collar", label: "Collar", source: { material: "upper", region: 7, color: "#ACACAC" }, allowedMaterials: ["suede", "canvas", "leather"], default: { material: "suede", color: "#111111" }, description: "The padded collar." },
    { id: "sidewall", label: "Sidewall", view: "side", source: { material: "upper", region: 6, color: "#A7A7A7" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#F4F4F2" }, description: "The vulcanized rubber foxing." },
    { id: "outsole", label: "Outsole", view: "sole", source: { material: "sole", color: "#808080" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#6E4A2F" }, description: "Waffle rubber outsole." },
    { id: "laces", label: "Laces", source: { material: "laces", region: 1, color: "#BCBABA" }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#F4F4F2" }, description: "Flat laces." },
  ],
  colors: NAMED_COLORS,
  palette: PALETTE,
  cameraViews: VIEWS,
  graphicZones: ["quarters", "toe", "heel"],
  rules: [{ type: "maxGraphics", max: 4 }],
  colorways: [
    { id: "black-white", name: "Black White", story: "Still the most popular Old Skool, decades on.", parts: {  } },
    { id: "navy", name: "Navy", story: "Navy with a white stripe, a core color.", parts: { toe: { color: "#1C2541" }, quarters: { color: "#1C2541" }, heel: { color: "#1C2541" }, collar: { color: "#1C2541" } } },
    { id: "black-black", name: "Black Black", story: "Triple black, stripe and sidewall too.", parts: { toe: { color: "#111111" }, quarters: { color: "#111111" }, heel: { color: "#111111" }, collar: { color: "#111111" }, stripe: { color: "#111111" }, sidewall: { color: "#111111" }, outsole: { color: "#111111" }, laces: { color: "#111111" } } },
    { id: "true-white", name: "True White", story: "All white, a core color.", parts: { toe: { color: "#F4F4F2" }, quarters: { color: "#F4F4F2" }, heel: { color: "#F4F4F2" }, collar: { color: "#F4F4F2" }, stripe: { color: "#F4F4F2" }, laces: { color: "#F4F4F2" } } },
  ],
});

export const airForce1 = ProductDef.parse({
  id: "air-force-1",
  name: "Nike Air Force 1 '07",
  brand: "Nike",
  category: "Basketball",
  kind: "tint",
  tagline: "Bruce Kilgore's 1982 court shoe, the best-selling sneaker there is.",
  modelUrl: "/models/air-force-1.glb",
  orientation: { x: 0, y: 180, z: 0 },
  credit: { author: "kirilldrac78", url: sketchfab("air-force1-9497c5d927b04f2281e86a0777784177"), license: "CC BY 4.0" },
  basePrice: 115,
  currency: "USD",
  realLengthMeters: 0.29,
  // A clean CG model: every part is its own flat material.
  parts: [
    { id: "upper", label: "Upper", source: { material: "Fine_leather_black" }, allowedMaterials: ["leather", "suede", "patent"], default: { material: "leather", color: "#E7E7E7" }, description: "Toe box, quarters, overlays and the Swoosh: one piece of leather." },
    { id: "laces", label: "Laces", source: { material: "Hex_fabric_Cloth" }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#D7D7D7" }, description: "Flat laces." },
    { id: "lining", label: "Collar lining", source: { material: "Fabric" }, allowedMaterials: ["mesh", "leather"], default: { material: "mesh", color: "#E3E3E3" }, description: "Padded collar and tongue lining." },
    { id: "logos", label: "Logos", source: { material: "Fabric_Pattern_06" }, allowedMaterials: ["leather"], default: { material: "leather", color: "#E7E7E7" }, description: "Nike Air on the heel and the tongue." },
    { id: "stitching", label: "Stitching", source: { material: "Material.004" }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#BCBCBC" }, description: "Thread around every panel." },
    { id: "deubre", label: "Lace deubré", view: "top", source: { material: "Metal" }, allowedMaterials: ["leather", "patent"], default: { material: "patent", color: "#C9CCD1" }, description: "The metal tag on the laces." },
    { id: "deubre-trim", label: "Deubré trim", view: "top", source: { material: "Degradable_Metal" }, allowedMaterials: ["leather", "patent"], default: { material: "patent", color: "#C9CCD1" }, description: "The deubré's raised lettering and the side mark." },
    { id: "sole-stitch", label: "Sole stitching", view: "side", source: { material: "Plane.003__0" }, allowedMaterials: ["canvas"], default: { material: "canvas", color: "#F4F4F2" }, description: "The stitch line around the midsole." },
    { id: "midsole", label: "Midsole", view: "side", source: { material: "Material.001" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#E7E7E7" }, description: "The Air sole wall, and the sockliner inside." },
    { id: "outsole", label: "Outsole", source: { material: "Material.002" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#E7E7E7" }, description: "The rubber band under the midsole." },
    { id: "rim", label: "Outsole rim", source: { material: "Material.010" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#D6D6D6" }, description: "The thin edge at the very bottom." },
    { id: "tread", label: "Tread", source: { material: "Material.006" }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#FFFFFF" }, description: "The pivot-circle traction underfoot." },
  ],
  colors: NAMED_COLORS,
  palette: PALETTE,
  cameraViews: VIEWS,
  graphicZones: ["upper"],
  rules: [{ type: "maxGraphics", max: 4 }],
  colorways: [
    { id: "triple-white", name: "Triple White", story: "White on white, the most iconic Air Force 1 since its 1990s run on the street.", parts: { upper: { color: "#F4F4F2" }, laces: { color: "#F4F4F2" }, lining: { color: "#F4F4F2" }, logos: { color: "#F4F4F2" }, stitching: { color: "#F4F4F2" }, "sole-stitch": { color: "#F4F4F2" }, midsole: { color: "#F4F4F2" }, outsole: { color: "#F4F4F2" }, rim: { color: "#F4F4F2" }, tread: { color: "#F4F4F2" } } },
    { id: "triple-black", name: "Triple Black", story: "The all-black pair, Wheat and White's equal as an AF1 icon.", parts: { upper: { color: "#111111" }, laces: { color: "#111111" }, lining: { color: "#111111" }, logos: { color: "#111111" }, stitching: { color: "#111111" }, "sole-stitch": { color: "#111111" }, deubre: { color: "#111111" }, "deubre-trim": { color: "#111111" }, midsole: { color: "#111111" }, outsole: { color: "#111111" }, rim: { color: "#111111" }, tread: { color: "#111111" } } },
    { id: "flax", name: "Flax", story: "Wheat nubuck, white midsole, gum outsole (2019, CJ9179-200).", parts: { upper: { color: "#D6A65C", material: "suede" }, laces: { color: "#D6A65C" }, lining: { color: "#D6A65C" }, logos: { color: "#D6A65C" }, stitching: { color: "#B07A47" }, "sole-stitch": { color: "#EDE6D6" }, midsole: { color: "#EDE6D6" }, outsole: { color: "#B07A47" }, rim: { color: "#B07A47" }, tread: { color: "#B07A47" } } },
  ],
});

export const gazelle = ProductDef.parse({
  id: "gazelle",
  name: "adidas Gazelle",
  brand: "adidas",
  category: "Terrace",
  kind: "tint",
  tagline: "Suede trainer from 1966, back on every terrace.",
  modelUrl: "/models/gazelle.glb",
  orientation: { x: 0, y: 39.4, z: 0 },
  credit: { author: "kzolozhkov", url: sketchfab("adidas-gazelle-280ae99c7f4647c9aa450e140aa7a9de"), license: "CC BY 4.0" },
  basePrice: 100,
  currency: "USD",
  realLengthMeters: 0.29,
  parts: [
    { id: "upper", label: "Suede upper", source: { material: "material", region: 1 }, allowedMaterials: ["suede", "leather"], default: { material: "suede", color: "#2B5839" }, description: "Soft suede upper and tongue." },
    { id: "stripes", label: "Three Stripes and laces", source: { material: "material", region: 0 }, allowedMaterials: ["leather", "suede"], default: { material: "leather", color: "#B2B9C0" }, description: "Serrated Three Stripes, laces and heel trim." },
    { id: "lining", label: "Heel tab and lining", source: { material: "material", region: 2 }, allowedMaterials: ["leather", "suede"], default: { material: "leather", color: "#808377" }, description: "The pull tab, collar lining and insole." },
    { id: "sole", label: "Sole", source: { material: "material", region: 3 }, allowedMaterials: ["rubber"], default: { material: "rubber", color: "#8D8574" }, description: "The rubber cupsole." },
  ],
  colors: NAMED_COLORS,
  palette: PALETTE,
  cameraViews: VIEWS,
  graphicZones: ["upper"],
  rules: [{ type: "maxGraphics", max: 4 }],
  colorways: [
    { id: "collegiate-green", name: "Collegiate Green", story: "The heritage colour: green suede, white stripes.", parts: { upper: { color: "#1F5C3A" }, stripes: { color: "#F4F4F2" } } },
    { id: "collegiate-navy", name: "Collegiate Navy", story: "The safe first Gazelle: navy suede, white stripes.", parts: { upper: { color: "#1C2541" }, stripes: { color: "#F4F4F2" } } },
    { id: "collegiate-burgundy", name: "Collegiate Burgundy", story: "The colour of the 2023 Gazelle Indoor revival.", parts: { upper: { color: "#6B1F2A" }, stripes: { color: "#F4F4F2" } } },
    { id: "core-black", name: "Core Black", story: "Black suede, white stripes: a staple.", parts: { upper: { color: "#111111" }, stripes: { color: "#F4F4F2" } } },
  ],
});

export const LINEUP: ProductDef[] = [airForce1, airJordan1, dunkLow, gazelle, pumaSuede, oldSkool, chuckTaylor];
