import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct } from "@/lib/products";
import { StudioShell } from "@/components/studio/StudioShell";

type Params = Promise<{ productId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) return {};
  const og = `/api/og?p=${product.id}`;
  return {
    title: `Design your ${product.name}`,
    openGraph: { images: [og] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

export default async function StudioPage({ params }: { params: Params }) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) notFound();
  return (
    <Suspense fallback={<div className="grid h-dvh place-items-center text-ink-muted">Opening the studio…</div>}>
      <StudioShell productId={product.id} />
    </Suspense>
  );
}
