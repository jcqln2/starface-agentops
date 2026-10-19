import type { CheckResult } from "../types";
import { sentences } from "./util";

// big yellow is lowercase, friendly, short, and never shames anyone's skin.
const SHAMING: [RegExp, string][] = [
  [/\b(your )?bad skin\b/gi, "your skin"],
  [/\bfix your face\b/gi, "show your skin some love"],
  [/\b(flaws|imperfections|blemishes)\b/gi, "spots"],
  [/\b(ugly|gross|disgusting|nasty)\b/gi, "extra"],
];
export const MAX_CHARS = 600;

export function checkBrandVoice(text: string): CheckResult {
  const reasons: string[] = [];
  let out = text;

  for (const [re, to] of SHAMING) {
    if (out.match(re)) {
      reasons.push(`voice:shaming:${out.match(re)![0].toLowerCase()}`);
      out = out.replace(re, to);
    }
  }
  if (out !== out.toLowerCase()) {
    reasons.push("voice:not-lowercase");
    out = out.toLowerCase();
  }
  if (out.length > MAX_CHARS) {
    reasons.push("voice:too-long");
    let short = "";
    for (const s of sentences(out)) {
      if ((short + " " + s).length > MAX_CHARS) break;
      short = (short + " " + s).trim();
    }
    out = short || out.slice(0, MAX_CHARS);
  }
  return { check: "brand-voice", verdict: reasons.length ? "rewritten" : "passed", reasons, text: out };
}
