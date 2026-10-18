import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getProduct } from "@/lib/products";
import { MATERIAL_IDS } from "@/lib/products/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({ productId: z.string().max(60), prompt: z.string().min(3).max(200) });

const AiColorway = z.object({
  name: z.string().max(40),
  story: z.string().max(160),
  parts: z.array(
    z.object({
      partId: z.string(),
      color: z.string(),
      material: z.enum(MATERIAL_IDS),
    }),
  ),
});

/**
 * Returns the server response for a colorway request. Never leaks the API key or raw model output.
 * Without ANTHROPIC_API_KEY it returns 503 and the client falls back to the local generator.
 */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ai_unavailable" }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const product = getProduct(parsed.data.productId);
  if (!product) return Response.json({ error: "unknown_product" }, { status: 404 });

  const partsSpec = product.parts
    .map((p) => `- ${p.id} (${p.label}): allowed materials ${p.allowedMaterials.join(", ")}`)
    .join("\n");

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: process.env.COLORWAY_MODEL ?? "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(AiColorway) },
      system:
        "You are a senior footwear color designer. You create wearable, harmonious sneaker colorways. " +
        "Keep the sole neutral or gum unless the request clearly asks otherwise. Use at most four distinct hues. " +
        "Only use the part ids and materials you are given. Colors are 6-digit hex values like #1A2B3C.",
      messages: [
        {
          role: "user",
          content: `Product: ${product.name}\nParts:\n${partsSpec}\n\nRequest: ${parsed.data.prompt}\n\nReturn one colorway that covers every part.`,
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "no_colorway" }, { status: 422 });
    }

    // Validate against the product: drop unknown parts, fix disallowed materials, check hex.
    const parts: Record<string, { color: string; material: (typeof MATERIAL_IDS)[number] }> = {};
    for (const p of response.parsed_output.parts) {
      const def = product.parts.find((d) => d.id === p.partId);
      if (!def || !/^#[0-9a-fA-F]{6}$/.test(p.color)) continue;
      parts[def.id] = {
        color: p.color.toUpperCase(),
        material: def.allowedMaterials.includes(p.material) ? p.material : def.default.material,
      };
    }
    return Response.json({ name: response.parsed_output.name, story: response.parsed_output.story, parts });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return Response.json({ error: "rate_limited" }, { status: 429 });
    if (err instanceof Anthropic.APIError) return Response.json({ error: "ai_error" }, { status: 502 });
    return Response.json({ error: "ai_error" }, { status: 500 });
  }
}
