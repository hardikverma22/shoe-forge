import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import { RenderView } from "./RenderView";

/** Dev only: one shoe on a transparent canvas, for the catalog thumbnails (scripts/shoot-thumbs.mjs). */
export default async function RenderPage({ params }: { params: Promise<{ productId: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) notFound();
  return <RenderView productId={product.id} />;
}
