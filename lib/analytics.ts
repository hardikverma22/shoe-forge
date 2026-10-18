import { track as vercelTrack } from "@vercel/analytics";

export type EventProps = Record<string, string | number | boolean | null>;

/**
 * One place for every product event. Sends to Vercel Analytics.
 */
export function track(name: string, props: EventProps = {}) {
  try {
    vercelTrack(name, props);
  } catch {
    // analytics must never break the UI
  }
}
