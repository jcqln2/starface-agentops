import type { CheckResult } from "../types";
import { DERM_DISCLAIMER, sentences } from "./util";

// Starface sells cosmetics (+ OTC acne products). Chat must never make drug-style
// claims (cure / treat / heal), diagnose, or give prescription advice.

/** sentences that can't be safely reworded: drop them entirely */
const HARD = [
  { reason: "medical:diagnosis", re: /\b(you (have|probably have|might have)|sounds like|looks like) (a |an )?(cystic acne|rosacea|eczema|psoriasis|infection|dermatitis|staph|cellulitis)\b/i },
  { reason: "medical:prescription", re: /\b(prescription|tretinoin|accutane|isotretinoin|antibiotics?|stop taking|instead of (your )?(meds|medication|doctor))\b/i },
  { reason: "medical:fda-claim", re: /\bfda[- ]approved\b/i },
  { reason: "medical:cure", re: /\b(cures?|curing)\b/i },
  { reason: "medical:guarantee", re: /\b(guaranteed?|permanently|forever|100% clear)\b/i },
];

/** words that can be softened into cosmetic language, keeping the verb form */
const SOFT: { reason: string; re: RegExp; to: (suffix: string) => string }[] = [
  // "treat" but not the product name "star treatment"
  { reason: "medical:treat", re: /\btreat(s|ing)?\b(?!ment)/gi, to: (x) => (x === "s" ? "cares for" : x === "ing" ? "caring for" : "care for") },
  { reason: "medical:heal", re: /\bheal(s|ing)?\b/gi, to: (x) => `sooth${x === "ing" ? "ing" : "e" + x}` },
];

const NEEDS_DISCLAIMER = /\b(cystic|infect|infection|open (cut|wound)|bleeding|rash|scar|pain(ful)?|medication|derm)/i;

export function checkMedicalClaims(text: string, userMessage = ""): CheckResult {
  const reasons = new Set<string>();
  let kept = sentences(text).filter((s) => {
    const hit = HARD.find((h) => h.re.test(s));
    if (hit) reasons.add(hit.reason);
    return !hit;
  });
  kept = kept.map((s) =>
    SOFT.reduce((acc, r) => {
      if (acc.match(r.re)) reasons.add(r.reason);
      return acc.replace(r.re, (_m, suffix?: string) => r.to(suffix?.toLowerCase() ?? ""));
    }, s),
  );

  if (reasons.size === 0) return { check: "medical-claims", verdict: "passed", reasons: [], text };

  if (kept.length === 0) {
    return {
      check: "medical-claims",
      verdict: "blocked",
      reasons: [...reasons],
      text: `i can't give medical advice, bestie. ${DERM_DISCLAIMER}`,
    };
  }
  let out = kept.join(" ");
  if (/\bcystic\b/i.test(text) && /\b(cure|treat|heal|get rid of|eliminate)s?\b/i.test(text)) {
    reasons.add("medical:cystic-claim");
  }
  if (NEEDS_DISCLAIMER.test(text + " " + userMessage) && !out.includes("dermatologist")) {
    out += ` ${DERM_DISCLAIMER}`;
  }
  return { check: "medical-claims", verdict: "rewritten", reasons: [...reasons], text: out };
}
