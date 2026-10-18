import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/products";
import { decodeDesign } from "@/lib/design/codec";
import { MATERIALS } from "@/lib/materials/presets";

export const runtime = "nodejs";

/** Tech-pack share card (1200x630): the design's name and its numbered bill of materials. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const d = url.searchParams.get("d");
  const product =
    getProduct(url.searchParams.get("p") ?? "forge-runner") ?? getProduct("forge-runner")!;
  const design = d ? decodeDesign(d) : null;
  const name = design?.name ?? product.name;
  const parts = product.parts.map((p) => {
    const cfg = design?.parts[p.id] ?? p.default;
    return { label: p.label, color: cfg.color, material: MATERIALS[cfg.material].label };
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#1e2bff",
        color: "#ffffff",
        padding: 64,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          paddingRight: 48,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 800 }}>
          <div
            style={{
              display: "flex",
              width: 22,
              height: 22,
              borderRadius: 11,
              border: "4px solid #ffffff",
              marginRight: 10,
            }}
          />
          Shoe Forge
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: -2,
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#c9ccff", marginTop: 24 }}>
            A {product.name}, designed part by part.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            background: "#d7ff3a",
            color: "#0a0a12",
            borderRadius: 999,
            padding: "14px 28px",
            fontSize: 26,
            fontWeight: 800,
            alignSelf: "flex-start",
          }}
        >
          Open it in the studio
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 420,
          borderLeft: "2px solid rgba(255,255,255,0.35)",
          paddingLeft: 36,
          justifyContent: "center",
        }}
      >
        {parts.map((p, i) => (
          <div
            key={p.label}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 24,
              padding: "9px 0",
              borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div style={{ display: "flex", width: 34, fontSize: 16, color: "#c9ccff" }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ display: "flex", flex: 1, fontWeight: 700 }}>{p.label}</div>
            <div style={{ display: "flex", fontSize: 18, color: "#c9ccff", marginRight: 14 }}>
              {p.material}
            </div>
            <div
              style={{
                display: "flex",
                width: 26,
                height: 26,
                borderRadius: 13,
                background: p.color,
                border: "2px solid rgba(255,255,255,0.6)",
              }}
            />
          </div>
        ))}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
