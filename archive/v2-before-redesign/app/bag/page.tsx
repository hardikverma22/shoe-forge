"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button, IconButton } from "@/components/ui/primitives";
import { useBag } from "@/lib/bag/store";
import { formatPrice } from "@/lib/design/pricing";
import { getProduct } from "@/lib/products";

export default function BagPage() {
  const router = useRouter();
  const items = useBag((s) => s.items);
  const setQuantity = useBag((s) => s.setQuantity);
  const remove = useBag((s) => s.remove);
  const clear = useBag((s) => s.clear);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const currency = (items[0] && getProduct(items[0].productId)?.currency) || "EUR";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-10">
        <h1 className="font-display text-6xl font-black">Bag</h1>
        {items.length === 0 ? (
          <div className="mt-10 space-y-4">
            <p className="text-ink-muted">Your bag is empty. Design a pair and add it here.</p>
            <Link href="/studio/forge-runner" className="inline-flex rounded-[var(--radius-control)] bg-accent px-5 py-2.5 font-semibold text-accent-ink">
              Start designing
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_280px]">
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-4">
                  <div className="grid size-24 shrink-0 place-items-center rounded-[var(--radius-control)] bg-paper">
                    {i.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={i.thumbnail} alt={`${i.design.name} preview`} className="size-full object-contain" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="font-semibold">{i.design.name}</p>
                      <p className="text-sm text-ink-muted">Size EU {i.size}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        Qty
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={i.quantity}
                          onChange={(e) => setQuantity(i.id, Number(e.target.value))}
                          className="h-9 w-16 rounded-[var(--radius-control)] border border-line bg-paper px-2"
                        />
                      </label>
                      <p className="tabular font-semibold">{formatPrice(i.unitPrice * i.quantity, currency)}</p>
                    </div>
                  </div>
                  <IconButton label={`Remove ${i.design.name}`} onClick={() => remove(i.id)}>
                    <Trash2 size={16} aria-hidden="true" />
                  </IconButton>
                </li>
              ))}
            </ul>
            <aside className="h-fit space-y-4 rounded-[var(--radius-panel)] border border-line bg-surface p-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="tabular font-semibold">{formatPrice(subtotal, currency)}</span>
              </div>
              <p className="text-xs text-ink-muted">Demo checkout. Nothing is charged, and no order is sent to a factory.</p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  const order = `SF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                  sessionStorage.setItem("sf:last-order", JSON.stringify({ order, subtotal, currency, items }));
                  clear();
                  router.push(`/bag/confirmation?o=${order}`);
                }}
              >
                Checkout (demo)
              </Button>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
