import { track as vercelTrack } from "@vercel/analytics";

export type EventProps = Record<string, string | number | boolean | null>;

/**
 * One place for every product event. Sends to Vercel Analytics, and when the studio runs
 * inside an embed it also tells the host page through a window event (see the embed bridge).
 */
export function track(name: string, props: EventProps = {}) {
  try {
    vercelTrack(name, props);
  } catch {
    // analytics must never break the UI
  }
  if (typeof window !== "undefined" && window.parent !== window) {
    window.dispatchEvent(new CustomEvent("sf:track", { detail: { name, props } }));
  }
}
