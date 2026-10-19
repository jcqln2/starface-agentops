// Fetches Starface's public Shopify catalogue and writes a trimmed data/catalog.json.
// Ingredients are only recorded when the ingredient name literally appears in the
// product's own description; nothing is inferred or invented.
import { writeFileSync, mkdirSync } from "node:fs";

const SOURCE = "https://starface.world/products.json?limit=250";
const KNOWN_INGREDIENTS = [
  "hydrocolloid", "salicylic acid", "niacinamide", "tea tree oil", "aloe vera",
  "witch hazel", "hyaluronic acid", "glycerin", "vitamin a", "licorice root",
  "vitamin e", "shea butter", "cocoa butter", "coconut oil", "squalane", "ceramides", "centella", "zinc",
];
const SKIP = /mystery compact - \d|build your own bundle|gift card/i;

const strip = (html = "") =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function shortDescription(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).length > 220) break;
    out = (out + " " + s).trim();
  }
  return out || text.slice(0, 220);
}

const res = await fetch(SOURCE, { headers: { "user-agent": "starface-agentops-demo" } });
if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
const { products } = await res.json();

const catalog = products
  .filter((p) => !SKIP.test(p.title) && !/^sanrio-\d/.test(p.handle))
  .filter((p, i, all) => all.findIndex((q) => q.title === p.title) === i) // drop duplicate listings
  .map((p) => {
    const text = strip(p.body_html);
    // "layer it under hydrocolloid stars" describes a pairing, not this product's formula
    const lower = text.toLowerCase().replace(/layer(ing)?( it)? under [^.]*?hydrocolloid stars/g, "");
    return {
      name: p.title,
      handle: p.handle,
      type: p.product_type || "",
      shortDescription: shortDescription(text),
      description: text.slice(0, 1200),
      keyIngredients: KNOWN_INGREDIENTS.filter((i) => lower.includes(i)),
      price: p.variants?.[0]?.price ? `$${p.variants[0].price}` : "",
      url: `https://starface.world/products/${p.handle}`,
      image: p.images?.[0]?.src ? `${p.images[0].src.split("?")[0]}?width=160` : "",
    };
  });

mkdirSync("data", { recursive: true });
writeFileSync(
  "data/catalog.json",
  JSON.stringify(
    {
      source: SOURCE,
      fetchedAt: new Date().toISOString(),
      note: "keyIngredients = known ingredient names found verbatim in the product description. empty = unknown.",
      products: catalog,
    },
    null,
    2,
  ),
);
console.log(`wrote ${catalog.length} products to data/catalog.json`);
