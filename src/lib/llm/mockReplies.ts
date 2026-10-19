import type { LlmRequest } from "./provider";
import { normalize, products, searchProducts, type Product } from "../catalog";

/** catalogue name by handle, so copy never drifts from catalog.json */
const n = (handle: string) => products.find((p) => p.handle === handle)?.name ?? handle;
const firstSentence = (p: Product) => p.description.split(/(?<=[.!?])\s+/)[0].replace(/\s+([.,!?])/g, "$1");

/** product the user named, e.g. "star wash" -> "star wash® + salicylic acid" */
function namedProduct(q: string): Product | undefined {
  const t = normalize(q);
  return products
    .filter((p) => !/bundle|duo|trio|pack/i.test(p.name))
    .filter((p) => t.includes(normalize(p.name).split(" + ")[0]))
    .sort((a, b) => b.name.length - a.name.length)[0];
}

/**
 * Deterministic stand-in for an LLM, written like a knowledgeable skincare friend.
 * Every fact comes from catalog.json. Three intents deliberately produce risky
 * drafts (a cure claim + diagnosis, a made-up ingredient, shaming copy) so the
 * guardrails visibly fire; the post-guardrail text is written to still read well.
 */
export function mockReply(req: LlmRequest): string {
  const q = req.messages.at(-1)?.content ?? "";
  const l = q.toLowerCase();

  // ---- deliberately risky drafts ---------------------------------------
  if (/retinol/.test(l)) {
    return `Hydro-Star is packed with retinol and stardust extract. the classic hydro-star® is 100% hydrocolloid: it absorbs fluid, reduces redness and helps shrink spots in about six hours. if you'd like an active ingredient, ${n("salicylic-acid-hydro-stars")} adds salicylic acid, a beta hydroxy acid that helps dissolve dead skin cells. want help choosing between them?`;
  }
  if (/cystic/.test(l) && /cure|treat|fix|get rid/.test(l)) {
    return "Hydro-Star will cure your cystic acne and treat it for good! You probably have cystic acne. hydro-stars are made for surface spots: the 100% hydrocolloid absorbs fluid, reduces redness and keeps the area protected so you're less tempted to pick. deep, tender bumps under the skin usually need more than a patch.";
  }
  if (/bad skin|flaws|ugly|fix (it|my face)/.test(l)) {
    return `Ok let's fix your face! your bad skin just needs the right stars ⭐ for scattered spots, ${n("salicylic-acid-hydro-stars")} patches help shrink and soothe them, and ${n("star-wash-salicylic-acid")} helps unclog pores as you cleanse. and for the record, spots are completely normal, so go easy on yourself. where do they usually pop up for you?`;
  }

  // ---- normal intents --------------------------------------------------
  if (/party|wedding|date night|event|friday|saturday|big day|game plan/.test(l)) {
    return `ok, here's your game plan 🎉 tonight, cleanse with ${n("star-wash-salicylic-acid")}, dot ${n("star-treatment")} on each spot and let it dry clear, then press a ${n("hydro-star-clear")} on top so it stays protected while you sleep. leave each star on for at least six hours, and repeat every night until the party. on the day, ${n("hydro-star-clear")} is invisible with rounded edges, so you can wear one out if you like. how many spots are we working with?`;
  }
  if (/makeup|foundation|concealer/.test(l)) {
    return `yes, with a little strategy 💄 ${n("hydro-star-clear")} is made to blend in: it's invisible, has rounded edges and comes in two sizes, 14mm and 18mm. stick it on clean, dry skin first, then do your makeup around it rather than over it, since the product page doesn't cover layering foundation on top. at night, ${n("star-wash-salicylic-acid")} removes makeup, oil and buildup in one step. want a morning routine to go with it?`;
  }
  if (/tiny|small|little|chin|bumps/.test(l)) {
    return `for tiny bumps, ${n("tiny-star")} is your match ⭐ each patch is 10mm wide, made for the smallest spots, and a pack has 48 in six bright colors. stick one on clean, dry skin and leave it on for at least six hours or overnight. if a spot feels like it's still brewing under the surface, ${n("microdarts")} reach early-stage pimples with salicylic acid and niacinamide. are yours more surface spots or under-the-skin ones?`;
  }
  if (/blackhead|pores|nose/.test(l)) {
    return `for blackheads, ${n("star-strips")} are the move: they lift away excess oil, dirt and buildup, with aloe vera and witch hazel to leave skin feeling soft. use them once a week for best results. on the other days, ${n("star-wash-salicylic-acid")} helps unclog pores as you cleanse. want to hear about the salicylic acid version of the strips too?`;
  }
  if (/lip|balm|chapped/.test(l)) {
    return `star balm® has you covered 💋 it moisturizes lips in 15 minutes and keeps them hydrated for up to 8 hours, with shea butter, cocoa butter and coconut oil. there's a flavor for every mood, from ${n("star-balm-starfruit")} to ${n("star-balm-unscented")} if you like it simple. which one are you eyeing?`;
  }
  if (/picked|popped|flaky|scab|dry patch/.test(l)) {
    return `no judgment, it happens to all of us 💛 ${n("hydro-star-recovery")} is made for skin that's dry, flaky or freshly picked, with vitamin a, aloe vera and licorice root. put a star on the spot to keep it protected while it recovers, and repeat as needed. if it looks irritated or isn't settling down, it's worth checking in with a dermatologist. how's it feeling right now?`;
  }
  if (/what'?s in|ingredient|contain|made (of|with)/.test(l)) {
    const p = namedProduct(q) ?? searchProducts(q, 1)[0];
    const ings = p.keyIngredients.length
      ? `${p.name} lists ${p.keyIngredients.join(", ").replace(/, ([^,]*)$/, " and $1")} as key ingredients.`
      : `the product page doesn't call out key ingredients for ${p.name}, so the full list on its page is your best bet.`;
    const about = firstSentence(p).replace(`${p.name} is `, "it's ").replace(`${p.name} are `, "they're ");
    return `great question ✨ ${ings} ${about} want tips on fitting it into your routine?`;
  }
  if (/how (do|should|to) (i )?(use|apply|wear)|how long/.test(l)) {
    return `easy 💛 start with clean, dry skin, press a hydro-star® onto the spot and smooth down the edges. leave it on for at least six hours, or overnight; hydro-stars are clinically proven to shrink pimples in six hours. the 100% hydrocolloid absorbs fluid and reduces redness, and it's a cute reminder not to pick. for invisible daytime wear try ${n("hydro-star-clear")}, or ${n("salicylic-acid-hydro-stars")} for spots that need a little extra. want help picking a size?`;
  }
  if (/routine|sensitive|regimen|daily|surface spots/.test(l)) {
    return `here's a simple routine ✨ cleanse with ${n("star-wash-salicylic-acid")}, then follow with ${n("star-cream-salicylic-acid")}; the pair is formulated for breakout-prone and sensitive skin. when a spot shows up, dot on ${n("star-treatment")}, let it dry completely, then add a hydro-star® on top for at least six hours. want me to point you to the ${n("sal-acid-skincare-duo")} so you get both together?`;
  }

  const p = namedProduct(q) ?? searchProducts(q, 1)[0];
  return `${p.name} could be a lovely fit 💛 ${firstSentence(p)} want me to walk you through how to use it, or compare it with another star?`;
}
