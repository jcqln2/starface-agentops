import data from "../../data/catalog.json";

export interface Product {
  name: string;
  handle: string;
  type: string;
  shortDescription: string;
  description: string;
  keyIngredients: string[];
  price: string;
  url: string;
  image: string;
}

export const products: Product[] = data.products;

/** lowercase, drop ® / ™, collapse "hydro-stars" -> "hydro-star". */
export const normalize = (s: string) =>
  s.toLowerCase().replace(/[®™]/g, "").replace(/hydro-stars/g, "hydro-star").replace(/\s+/g, " ").trim();

/** every ingredient that appears in at least one real product description */
export const catalogIngredients = new Set(products.flatMap((p) => p.keyIngredients));

/** base product names, e.g. "star balm", "hydro-star", "star treatment" */
export const productBaseNames = new Set(
  products.flatMap((p) => {
    const n = normalize(p.name);
    // full name, name before "+", and the family before ® ("star balm® starfruit" -> "star balm")
    return [n, n.split(" + ")[0].trim(), normalize(p.name.split("®")[0])];
  }),
);

/** skincare ingredients a model might mention; used to spot ones starface doesn't list */
export const INGREDIENT_WATCHLIST = [
  ...catalogIngredients,
  "retinol", "retinoid", "tretinoin", "adapalene", "benzoyl peroxide", "glycolic acid",
  "lactic acid", "azelaic acid", "vitamin c", "snail mucin", "collagen", "peptides",
  "sulfur", "zinc oxide", "hydroquinone", "kojic acid", "bakuchiol", "mandelic acid",
  "ceramides", "squalane", "cica", "centella", "charcoal", "stardust extract",
];

export function findProducts(text: string): Product[] {
  const t = normalize(text);
  return products.filter((p) => t.includes(normalize(p.name)));
}

/** naive keyword retrieval for the product agent: score by word overlap */
export function searchProducts(query: string, k = 3): Product[] {
  const words = normalize(query).split(/[^a-z0-9-]+/).filter((w) => w.length > 3);
  const scored = products
    .filter((p) => !/bundle|trio|pack/i.test(p.name))
    .map((p) => {
      const hay = normalize(`${p.name} ${p.shortDescription} ${p.keyIngredients.join(" ")}`);
      const name = normalize(p.name);
      // a word in the product name counts triple
      return { p, score: words.reduce((n, w) => n + (name.includes(w) ? 3 : hay.includes(w) ? 1 : 0), 0) };
    })
    .sort((a, b) => b.score - a.score || a.p.name.length - b.p.name.length); // prefer the plain product on ties
  const hits = scored.filter((s) => s.score > 0).slice(0, k).map((s) => s.p);
  return hits.length ? hits : products.filter((p) => normalize(p.name) === "hydro-star + big yellow");
}
