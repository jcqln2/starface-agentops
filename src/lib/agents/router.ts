import type { AgentName } from "../types";

export interface Route { agent: AgentName; reason: string }

// note: "cystic" alone is NOT escalated: the product agent answers and the
// medical-claims guardrail keeps the reply cosmetic + adds the derm disclaimer.
const MEDICAL = [
  /\binfect/i, /\bpregnan/i, /\bprescription\b/i, /\bopen (cut|wound)\b/i,
  /\bbleeding\b/i, /\brash\b/i, /\bself[- ]?harm\b/i, /\bhurt myself\b/i, /\bsuicid/i, /\b(tretinoin|accutane|isotretinoin|antibiotic|medication|meds)\b/i,
  /\b(eczema|rosacea|psoriasis|allergic reaction)\b/i,
];
const SUPPORT = [/\border\b/i, /\bshipping\b/i, /\bsubscription/i, /\btrack(ing)?\b/i, /\brefund\b/i, /\breturn\b/i, /\bwhere('?s| is) my\b/i];

/** Cheap keyword router. The LLM is only used by the agents, never for routing. */
export function route(message: string): Route {
  if (MEDICAL.some((r) => r.test(message))) return { agent: "escalation", reason: "medical or sensitive topic" };
  if (SUPPORT.some((r) => r.test(message))) return { agent: "support", reason: "order, shipping or subscription" };
  return { agent: "product", reason: "product, routine or ingredient question" };
}
