import type { PartConfig, Vec3 } from "@/lib/products/schema";

export type StageId = "studio" | "daylight" | "sunset" | "night";

export type GraphicKind = "mark" | "upload" | "text";

export type Graphic = {
  id: string;
  kind: GraphicKind;
  /** Data URL for uploads, /marks/... path for marks, rendered PNG for text. */
  src?: string;
  text?: string;
  font?: string;
  color?: string;
  partId: string;
  /** Surface point and normal in the part's local space. */
  position: Vec3;
  normal: Vec3;
  rotation: number;
  scale: number;
};

export type Design = {
  version: 1;
  productId: string;
  name: string;
  parts: Record<string, PartConfig>;
  graphics: Graphic[];
  stage: StageId;
};
