"use client";

import { createStore, del, get, keys, set } from "idb-keyval";
import type { Design } from "./types";

export type SavedDesign = {
  id: string;
  design: Design;
  thumbnail: Blob | null;
  updatedAt: number;
};

const store = createStore("shoe-forge", "designs");
const PREFIX = "sf:design:";

export async function saveDesign(design: Design, thumbnail: Blob | null, id?: string): Promise<string> {
  const key = id ?? crypto.randomUUID();
  const record: SavedDesign = { id: key, design, thumbnail, updatedAt: Date.now() };
  await set(PREFIX + key, record, store);
  return key;
}

export async function getSavedDesign(id: string): Promise<SavedDesign | undefined> {
  return get<SavedDesign>(PREFIX + id, store);
}

export async function listSavedDesigns(): Promise<SavedDesign[]> {
  const all = await keys(store);
  const ids = all.filter((k): k is string => typeof k === "string" && k.startsWith(PREFIX));
  const records = await Promise.all(ids.map((k) => get<SavedDesign>(k, store)));
  return records.filter((r): r is SavedDesign => Boolean(r)).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteSavedDesign(id: string): Promise<void> {
  await del(PREFIX + id, store);
}

export async function renameSavedDesign(id: string, name: string): Promise<void> {
  const record = await getSavedDesign(id);
  if (!record) return;
  record.design = { ...record.design, name: name.trim().slice(0, 40) || "Untitled design" };
  record.updatedAt = Date.now();
  await set(PREFIX + id, record, store);
}
