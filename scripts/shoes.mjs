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
    id: "superstar",
    uid: "7ea0ff1d54af4209bac2921ee37110b6",
    keep: /.*/,
    masks: {
      superstar: {
        // 6 clusters keep leather highlights (slate, dark gray) apart from the white stripes; they fold back into the upper.
        k: 6,
        merge: "0+4+3,1+5",
        attr: true,
        // The scan bakes stripes, rubber sidewall, shell toe and lining into the same tones: split them by atlas area.
        boxes: [
          "0.14,0,0.2,0.12;0.19,0,0.355,0.73;0.35,0,0.42,0.24;0.43,0,0.75,0.17;0,0.72,0.13,0.98;0.24,0.82,0.29,0.97;0,0.86,1,1=1+2+5:shell",
          // The sidewall islands are rubber whatever their dirt, and so is everything this low on the shoe.
          "0.2,0,0.355,0.73=0+1+2+3+4+5:shell",
          "h0-0.22=0+1+2+3+4+5:shell",
          // The printed sockliner.
          "0.55,0.38,0.98,0.72=0+1+2+3+4+5:lining",
        ],
        minArea: 0.0004,
      },
    },
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
    uid: "5f8241541e7846af869b6bb0ceb72adf",
    keep: /.*/,
    masks: { Default_OBJ: { k: 6, merge: "0+5,1+4", minArea: 0.0004 } },
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
