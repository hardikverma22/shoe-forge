"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Design } from "@/lib/design/types";

export type BagItem = {
  id: string;
  productId: string;
  design: Design;
  size: string;
  quantity: number;
  unitPrice: number;
  thumbnail: string | null;
  addedAt: number;
};

type BagState = {
  items: BagItem[];
  add: (item: Omit<BagItem, "id" | "quantity" | "addedAt">) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, id: crypto.randomUUID(), quantity: 1, addedAt: Date.now() }],
        })),
      setQuantity: (id, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, quantity: Math.min(10, Math.max(1, quantity)) } : i)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "sf:bag", storage: createJSONStorage(() => localStorage) },
  ),
);

export const bagCount = (items: BagItem[]) => items.reduce((n, i) => n + i.quantity, 0);
