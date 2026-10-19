import type { ProductLink } from "./types";

/** /api/click URL that records the click, then 302s to the real starface.world page. Client-safe (no catalogue import). */
export const clickHref = (eventId: string, link: ProductLink) =>
  `/api/click?eid=${encodeURIComponent(eventId)}&pid=${encodeURIComponent(link.pid)}&kind=${link.kind}&url=${encodeURIComponent(link.url)}`;
