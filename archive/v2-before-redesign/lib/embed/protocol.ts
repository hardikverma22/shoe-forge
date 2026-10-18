import { z } from "zod";
import { MATERIAL_IDS } from "@/lib/products/schema";

/** Messages the host page sends to the embedded studio. */
export const HostMessage = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("sf:setPart"),
    partId: z.string().max(60),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    material: z.enum(MATERIAL_IDS).optional(),
  }),
  z.object({ type: z.literal("sf:getDesign"), requestId: z.string().max(80) }),
]);

/** Messages the studio sends to the host page. Always posted to one explicit origin. */
export type FrameMessage =
  | { type: "sf:ready" }
  | { type: "sf:change"; design: { name: string; parts: Record<string, unknown> }; price: number }
  | { type: "sf:design"; requestId: string; design: { name: string; parts: Record<string, unknown> } }
  | { type: "sf:error"; message: string };
