import { findProducts, normalize } from "./catalog";
import type { AgentName, ProductLink, Verdict } from "./types";

export const SHOP_URL = "https://starface.world";
export const SHOP_LINK: ProductLink = { pid: "shop-all", kind: "shop", name: "shop all starface", price: "", url: SHOP_URL, image: "" };

/** Cards come from the FINAL reply, so a product a guardrail removed never gets a card. */
export function linksFor(agent: AgentName, finalText: string, verdict: Verdict): ProductLink[] {
  if (agent !== "product" || verdict === "blocked") return [];
  const found = findProducts(finalText);
  // "star strips" is inside "star strips + salicylic acid": keep only the most specific match
  const specific = found.filter((p) => !found.some((q) => q !== p && q.name.includes(p.name)));
  const text = normalize(finalText);
  specific.sort((a, b) => text.indexOf(normalize(a.name)) - text.indexOf(normalize(b.name))); // mention order
  const cards = specific.slice(0, 3).map<ProductLink>((p) => ({
    pid: p.handle, kind: "product", name: p.name, price: p.price, url: p.url, image: p.image,
  }));
  return [...cards, SHOP_LINK];
}

/** Only ever redirect to starface.world, so /api/click can't become an open redirect. */
export function isAllowedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (u.hostname === "starface.world" || u.hostname.endsWith(".starface.world"));
  } catch {
    return false;
  }
}

export { clickHref } from "./clickHref";
