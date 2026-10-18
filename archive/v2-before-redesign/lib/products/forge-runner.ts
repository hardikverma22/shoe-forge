import { ProductDef } from "./schema";

/**
 * Forge Runner: the first product. The glTF has eight parts, one per node in
 * public/models/forge-runner.glb (see scripts/split-parts.mjs).
 * Camera views are offsets from the centered model; the engine derives per-part
 * focus points and explode directions from each part's bounding box.
 */
export const forgeRunner = ProductDef.parse({
  id: "forge-runner",
  name: "Forge Runner",
  tagline: "A low-profile trainer built for city miles.",
  modelUrl: "/models/forge-runner.glb",
  basePrice: 129,
  currency: "EUR",
  realLengthMeters: 0.28,
  parts: [
    {
      id: "upper",
      label: "Upper",
      meshName: "upper",
      allowedMaterials: ["leather", "suede", "knit", "mesh", "canvas", "patent"],
      default: { material: "leather", color: "#F4F4F2" },
      description: "The main body of the shoe.",
    },
    {
      id: "laces",
      label: "Laces",
      meshName: "laces",
      allowedMaterials: ["canvas", "knit"],
      default: { material: "canvas", color: "#1B1B1F" },
      description: "Flat laces across the vamp.",
    },
    {
      id: "toecap",
      label: "Toe cap",
      meshName: "toecap",
      allowedMaterials: ["leather", "suede", "patent", "rubber"],
      default: { material: "leather", color: "#F4F4F2" },
      description: "Protects the front of the shoe.",
    },
    {
      id: "lining",
      label: "Lining",
      meshName: "lining",
      allowedMaterials: ["mesh", "canvas", "knit"],
      default: { material: "mesh", color: "#E8E4DC" },
      description: "Inner fabric that touches your foot.",
    },
    {
      id: "sole",
      label: "Sole",
      meshName: "sole",
      allowedMaterials: ["rubber"],
      default: { material: "rubber", color: "#C08A55" },
      description: "Gum rubber outsole.",
    },
    {
      id: "stripes",
      label: "Side stripes",
      meshName: "stripes",
      allowedMaterials: ["leather", "suede", "patent"],
      default: { material: "leather", color: "#2B3CFF" },
      description: "Two stripes along the side panel.",
    },
    {
      id: "heel",
      label: "Heel band",
      meshName: "heel",
      allowedMaterials: ["leather", "suede", "patent", "rubber"],
      default: { material: "leather", color: "#1B1B1F" },
      description: "Band that wraps the heel.",
    },
    {
      id: "tongue",
      label: "Tongue patch",
      meshName: "tongue",
      allowedMaterials: ["leather", "suede", "canvas"],
      default: { material: "canvas", color: "#2B3CFF" },
      description: "Branded patch on the tongue.",
    },
  ],
  palette: [
    "#F4F4F2", "#1B1B1F", "#2B3CFF", "#C08A55", "#D6332F", "#F2C14E",
    "#3A7D44", "#7A4FD0", "#FF8A3D", "#8FA3B8", "#5C3A21", "#E86FA1",
  ],
  cameraViews: [
    { id: "three-quarter", label: "3/4", position: [1.9, 1.0, 2.8] },
    { id: "side", label: "Side", position: [0, 0.35, 2.9] },
    { id: "front", label: "Front", position: [2.7, 0.3, 0] },
    { id: "back", label: "Back", position: [-2.7, 0.3, 0] },
    { id: "top", label: "Top", position: [0, 3.1, 0.02] },
    { id: "sole", label: "Sole", position: [0.1, -2.9, 0.4] },
  ],
  graphicZones: ["upper", "heel", "tongue"],
  rules: [
    { type: "maxGraphics", max: 4 },
  ],
  colorways: [
    {
      id: "gum-classic",
      name: "Gum classic",
      story: "White leather with the gum sole that started it all.",
      parts: {
        upper: { material: "leather", color: "#F4F4F2" },
        sole: { material: "rubber", color: "#C08A55" },
        stripes: { material: "leather", color: "#C08A55" },
      },
    },
    {
      id: "ultramarine",
      name: "Ultramarine",
      story: "All-blue knit with a matching lining.",
      parts: {
        upper: { material: "knit", color: "#2B3CFF" },
        lining: { material: "knit", color: "#2B3CFF" },
        laces: { material: "knit", color: "#F4F4F2" },
        sole: { material: "rubber", color: "#1B1B1F" },
      },
    },
    {
      id: "night-run",
      name: "Night run",
      story: "Black knit with patent stripes that catch the streetlights.",
      parts: {
        upper: { material: "knit", color: "#1B1B1F" },
        stripes: { material: "patent", color: "#F2C14E" },
        sole: { material: "rubber", color: "#1B1B1F" },
      },
    },
    {
      id: "clay-court",
      name: "Clay court",
      story: "Off-white canvas with an orange heel.",
      parts: {
        upper: { material: "canvas", color: "#F4F4F2" },
        heel: { material: "rubber", color: "#FF8A3D" },
        sole: { material: "rubber", color: "#F4F4F2" },
      },
    },
    {
      id: "forest",
      name: "Forest",
      story: "Green suede with gum rubber underfoot.",
      parts: {
        upper: { material: "suede", color: "#3A7D44" },
        toecap: { material: "suede", color: "#3A7D44" },
        sole: { material: "rubber", color: "#C08A55" },
      },
    },
    {
      id: "volcanic",
      name: "Volcanic",
      story: "Charcoal suede with a red heel band.",
      parts: {
        upper: { material: "suede", color: "#3B3B42" },
        heel: { material: "leather", color: "#D6332F" },
        sole: { material: "rubber", color: "#1B1B1F" },
      },
    },
    {
      id: "sorbet",
      name: "Sorbet",
      story: "Pink mesh with a sunny yellow stripe.",
      parts: {
        upper: { material: "mesh", color: "#E86FA1" },
        stripes: { material: "leather", color: "#F2C14E" },
        lining: { material: "mesh", color: "#F4F4F2" },
      },
    },
    {
      id: "monochrome",
      name: "Monochrome",
      story: "Every part in white, mixing leather, mesh and rubber.",
      parts: {
        upper: { material: "leather", color: "#F4F4F2" },
        lining: { material: "mesh", color: "#F4F4F2" },
        sole: { material: "rubber", color: "#F4F4F2" },
        heel: { material: "leather", color: "#F4F4F2" },
      },
    },
  ],
});
