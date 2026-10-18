import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct } from "@/lib/products";
import { EmbedStudio } from "@/components/embed/EmbedStudio";

type Props = { params: Promise<{ productId: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function EmbedPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const sp = await searchParams;
  const product = getProduct(productId);
  if (!product) notFound();
  const accent = sp.accent && /^[0-9a-fA-F]{6}$/.test(sp.accent) ? `#${sp.accent}` : undefined;
  return (
    <Suspense fallback={null}>
      <EmbedStudio productId={product.id} accent={accent} theme={sp.theme === "dark" ? "dark" : sp.theme === "light" ? "light" : undefined} origin={sp.origin} />
    </Suspense>
  );
}
