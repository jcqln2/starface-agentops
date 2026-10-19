import type { CheckResult } from "../types";

// Runs on the USER message, before any agent sees it.
const INJECTION = [
  /ignore (all |any )?(previous|prior|your|the above) (instructions|rules|prompt)/i,
  /(reveal|show|print).{0,20}(system prompt|instructions)/i,
  /\byou are now\b|\bdeveloper mode\b|\bjailbreak\b|\bdan mode\b/i,
  /pretend (you are|to be|you're)/i,
];
const ABUSE = [/\broast (my|your|their)\b/i, /\bmake fun of\b/i];
const COMPETITORS = /\b(mighty patch|hero cosmetics|zitsticka|peace out|cosrx|rael)\b/i;
const NEGATIVE = /\b(trash|garbage|sucks?|worse|worst|bash|roast|scam|terrible)\b/i;

export function checkInput(message: string): CheckResult {
  const reasons: string[] = [];
  if (INJECTION.some((r) => r.test(message))) reasons.push("input:prompt-injection");
  if (ABUSE.some((r) => r.test(message))) reasons.push("input:shaming-request");
  if (COMPETITORS.test(message) && NEGATIVE.test(message)) reasons.push("input:competitor-bashing");
  return {
    check: "input-safety",
    verdict: reasons.length ? "blocked" : "passed",
    reasons,
    text: message,
  };
}

/** a friendly deflection that matches the reason, so a block never feels like an error */
export function inputBlockedReply(reasons: string[]): string {
  if (reasons.includes("input:shaming-request"))
    return "that's one thing i won't do 😌 every face gets kindness here. want help building a routine or picking the right star instead?";
  if (reasons.includes("input:competitor-bashing"))
    return "i'll let other brands do their thing 💛 happy to walk you through what makes hydro-stars different, though. want the quick rundown?";
  return "nice try 😌 i'm sticking to what i know best: starface products, routines and orders. what can i help you with?";
}
