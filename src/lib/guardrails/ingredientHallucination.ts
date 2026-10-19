import type { CheckResult } from "../types";
import { INGREDIENT_WATCHLIST, catalogIngredients, findProducts, normalize, productBaseNames } from "../catalog";
import { sentences } from "./util";

// Every product or ingredient the reply names must exist in data/catalog.json,
// and an ingredient tied to a product in the same sentence must be listed for it.

const PRODUCT_NOUNS =
  "serum|oil|mask|toner|cream|wash|balm|strips|treatment|spf|sunscreen|cleanser|moisturi[sz]er|gel|drops|peel|scrub|lotion|mist|essence";
const PRODUCT_LIKE = new RegExp(`\\b(?:star|hydro-star)\\s+(?:${PRODUCT_NOUNS})\\b`, "g");

function problemsIn(sentence: string): string[] {
  const s = normalize(sentence);
  const problems: string[] = [];

  for (const m of s.match(PRODUCT_LIKE) ?? []) {
    if (!productBaseNames.has(m)) problems.push(`hallucination:product:${m}`);
  }

  const named = findProducts(sentence);
  for (const ing of INGREDIENT_WATCHLIST) {
    if (!new RegExp(`\\b${ing}\\b`).test(s)) continue;
    // negations like "doesn't have retinol" are fine
    if (/\b(no|not|doesn'?t|don'?t|without|isn'?t|free of|none)\b/.test(s)) continue;
    if (!catalogIngredients.has(ing)) problems.push(`hallucination:ingredient:${ing}`);
    else if (named.length && !named.some((p) => p.keyIngredients.includes(ing)))
      problems.push(`hallucination:wrong-product:${ing}`);
  }
  return problems;
}

export function checkIngredients(text: string): CheckResult {
  const reasons: string[] = [];
  const kept = sentences(text).filter((s) => {
    const p = problemsIn(s);
    reasons.push(...p);
    return p.length === 0;
  });

  if (reasons.length === 0) return { check: "ingredient-hallucination", verdict: "passed", reasons, text };

  const names = [...new Set(reasons.map((r) => r.split(":").pop()!))];
  const unknown = names.join(", ").replace(/, ([^,]*)$/, " or $1");
  const note = `heads up: i can't find ${unknown} on any starface product page, so i won't claim ${names.length > 1 ? "them" : "it"} 💛`;
  if (kept.length === 0) {
    return { check: "ingredient-hallucination", verdict: "blocked", reasons, text: `${note} each product page on starface.world has the full ingredient list.` };
  }
  return { check: "ingredient-hallucination", verdict: "rewritten", reasons, text: `${note} ${kept.join(" ")}` };
}
