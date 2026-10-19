import type { CheckResult, Verdict } from "../types";
import { checkMedicalClaims } from "./medicalClaims";
import { checkIngredients } from "./ingredientHallucination";
import { checkBrandVoice } from "./brandVoice";

export { checkInput, inputBlockedReply } from "./inputSafety";
export { checkMedicalClaims, checkIngredients, checkBrandVoice };

const rank: Record<Verdict, number> = { passed: 0, rewritten: 1, blocked: 2 };
export const worst = (vs: Verdict[]): Verdict =>
  vs.reduce<Verdict>((a, b) => (rank[b] > rank[a] ? b : a), "passed");

/** Runs every output check in order; each sees the previous check's text. */
export function runOutputGuardrails(draft: string, userMessage: string) {
  const checks: CheckResult[] = [];
  let text = draft;
  for (const run of [
    (t: string) => checkMedicalClaims(t, userMessage),
    checkIngredients,
    checkBrandVoice,
  ]) {
    const r = run(text);
    checks.push(r);
    text = r.text;
  }
  return { final: text, checks, verdict: worst(checks.map((c) => c.verdict)) };
}
