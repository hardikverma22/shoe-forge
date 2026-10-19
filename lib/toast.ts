"use client";

import { create } from "zustand";

export type Toast = { id: number; message: string; tone: "info" | "success" | "error" };

type ToastState = {
  toasts: Toast[];
  push: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = nextId++;
    // The same message again replaces the old toast instead of stacking a copy.
    set((s) => ({ toasts: [...s.toasts.filter((t) => t.message !== message).slice(-2), { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  info: (m: string) => useToasts.getState().push(m, "info"),
  success: (m: string) => useToasts.getState().push(m, "success"),
  error: (m: string) => useToasts.getState().push(m, "error"),
};
