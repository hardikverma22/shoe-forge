import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/products";
import { decodeDesign } from "@/lib/design/codec";

export const runtime = "nodejs";

/** Shoebox-label share card (1200x630). Uses the design in ?d= when valid, else the product default. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const d = url.searchParams.get("d");
  const product = getProduct(url.searchParams.get("p") ?? "forge-runner") ?? getProduct("forge-runner")!;
  const design = d ? decodeDesign(d) : null;
  const name = design?.name ?? product.name;
  const parts = product.parts.map((p) => ({
    label: p.label,
    color: design?.parts[p.id]?.color ?? p.default.color,
  }));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#eef1f4", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 28, color: "#5a6378" }}>ShoeForge</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#10162b", lineHeight: 0.95 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 30, color: "#5a6378", marginTop: 20 }}>{product.name}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", background: "#ffffff", border: "2px solid #d3d9e1", borderRadius: 20, padding: 24, width: 520 }}>
            {parts.slice(0, 5).map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", fontSize: 22, color: "#10162b", padding: "6px 0" }}>
                <div style={{ display: "flex", width: 22, height: 22, borderRadius: 11, background: p.color, marginRight: 16, border: "1px solid #d3d9e1" }} />
                {p.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 360 }}>
          {parts.slice(0, 6).map((p, i) => (
            <div key={p.label} style={{ display: "flex", width: 110, height: 110, borderRadius: 55, background: p.color, marginLeft: i === 0 ? 0 : -40, border: "6px solid #ffffff" }} />
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
