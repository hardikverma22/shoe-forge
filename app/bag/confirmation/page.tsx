"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { formatPrice } from "@/lib/design/pricing";
import type { BagItem } from "@/lib/bag/store";

type Last = { order: string; subtotal: number; currency: "EUR" | "USD"; items: BagItem[] };

function Confirmation() {
  const params = useSearchParams();
  const [last, setLast] = useState<Last | null>(null);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem("sf:last-order");
        if (raw) setLast(JSON.parse(raw) as Last);
      } catch {
        setLast(null);
      }
    });
  }, []);

  if (!last || last.order !== params.get("o")) {
    return (
      <div className="space-y-4">
        <p className="text-ink-muted">We couldn&apos;t find that order in this browser.</p>
        <Link href="/studio/forge-runner" className="underline underline-offset-4">
          Back to the studio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">Order {last.order}</p>
      <h1 className="font-display text-6xl font-black">Thanks. Your pair is in the queue.</h1>
      <p className="text-ink-muted">This is a demo checkout. Nothing was charged.</p>
      <p className="tabular font-display text-3xl font-extrabold text-gum">{formatPrice(last.subtotal, last.currency)}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {last.items.map((i) => (
          <li key={i.id}>
            {i.design.name}, EU {i.size}, quantity {i.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12 md:px-10">
        <Suspense fallback={null}>
          <Confirmation />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
