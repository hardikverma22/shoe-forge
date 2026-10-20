// Source models for the shoe lineup (Sketchfab, downloaded with SKETCHFAB_TOKEN).
// `keep` filters the meshes worth shipping (drops shoe boxes and duplicate left shoes).
// `masks` maps a material name to its region split (see scripts/region-masks.mjs). `minArea` is
// tuned per scan: large enough to fold leather highlights back into their panel, small enough to
// keep fragmented atlas pieces (Samba) intact.
export const SHOES = [
  {
    id: "air-jordan-1",
    uid: "fbe52211197c4b449f29de5aa4eb0611",
    keep: /_R_/,
    masks: {
      MAT_Shoe_R: {
        // Clusters: 0, 3, 4 black; 1 white; 2 red; 5 light gray (seams on the white panels).
        k: 6,
        merge: "0+4+3,1+5",
        // The cupsole is one oval island: its white is the midsole wall, its red rim (and the
        // island beside it) the rubber band at the bottom. Elsewhere white is the base, red the overlays.
        boxes: ["0.28,0.23,0.52,0.66;h0-0.165=1+5", "0.28,0.23,0.52,0.66;0.52,0.23,0.66,0.56;h0-0.2=2"],
        attr: true,
        minArea: 0.0004,
      },
    },
  },
  {
    id: "chuck-taylor",
    uid: "0c6ee67086ed43ff8f531a5db991c8ee",
    keep: /.*/,
    masks: {},
  },
  {
    id: "dunk-low",
    uid: "4a3dd6224c2e4c20816ffc159fd82879",
    keep: /.*/,
    masks: {},
  },
  {
    id: "puma-suede",
    uid: "5b098581cb7040d8ba30955ddf2e04c8",
    keep: /.*/,
    masks: {
      material_0: {
        // Clusters (lw 0.6): 0, 5, 8 suede reds; 7 the deeper red of the painted laces; 1, 3, 4, 6
        // cream and its dirt; 2 black. Laces exist only as paint on the vamp, so they come from color.
        k: 9,
        lw: 0.6,
        merge: "0+5+8+7,1+3+4+6",
        attr: true,
        boxes: [
          "0.35,0,0.6,0.42=7:laces",
          // Cream low on the shoe (and the outsole island) is the sole; above it, the Formstrip.
          "h0-0.28=1+3+4+6:sole",
          "0.74,0,1,0.73=1+3+4+6:sole",
          // The white lining and the printed insole.
          "0,0.52,0.39,0.86;0.14,0.84,0.4,0.995;0.36,0.56,0.66,0.75=1+2+3+4+6:lining",
        ],
        minArea: 0.0002,
      },
    },
  },
  {
    id: "old-skool",
    // A CG mockup of a pair (kanesk06). Keep the right shoe; the laces mesh covers both, so clip it.
    uid: "8d8cecbddb7a4d7b8be72c5e3ec86c72",
    keep: /^Object_[456]$/,
    clipX: (x) => x > 0,
    materialPerMesh: { Object_4: "upper", Object_5: "sole", Object_6: "laces" },
    masks: {
      upper: {
        k: 6,
        merge: "0+2+3+4+5",
        boxes: [
          "0,0,0.11,0.41=0+2+3+4+5:A",
          "0,0.4,0.45,1=0+2+3+4+5:B",
          "0.55,0.19,0.81,0.49=0+2+3+4+5:C",
          "0.51,0.48,0.82,1=0+2+3+4+5:D",
          "0.8,0,1,0.9=0+2+3+4+5:E",
          "0.1,0,0.35,0.6=0+2+3+4+5:F",
          // The jazz stripe: the light shapes inside the quarters island.
          "0.05,0.45,0.42,0.9=3:stripe",
        ],
        minArea: 0.0003,
      },
    },
  },
  {
    id: "air-force-1",
    uid: "9497c5d927b04f2281e86a0777784177",
    // Plane.019 is a stray copy of the logo decals, floating beside the shoe.
    keep: /^(?!Plane\.019)/,
    masks: {},
  },
  {
    id: "gazelle",
    uid: "280ae99c7f4647c9aa450e140aa7a9de",
    keep: /.*/,
    masks: {
      material: {
        // Clusters (lw 0.6): 0 white stripes and laces; 1, 3 green suede, 2 its shadows; 4, 5, 6 cream sole.
        k: 7,
        lw: 0.6,
        merge: "1+3+2,5+4+6",
        attr: true,
        // The sole is everything low on the shoe. The laces share the stripes' white and curl every
        // way, so they stay one part with the stripes.
        boxes: ["h0-0.2=0+1+2+3+4+5+6:sole"],
        minArea: 0.0002,
      },
    },
  },
];
