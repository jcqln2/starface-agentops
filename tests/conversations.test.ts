import { describe, expect, it } from "vitest";
import { handleMessage, RED_TEAM_PROMPTS } from "../src/lib/pipeline";
import { SAMPLE_SESSIONS } from "../src/lib/simulate";
import { MAX_CHARS } from "../src/lib/guardrails/brandVoice";

process.env.LOG_JSONL = "0";
const RISKY = /will this cure|cystic/;

describe("mock conversations read well after guardrails", () => {
  const prompts = [
    ...SAMPLE_SESSIONS.flat(),
    "how do i use hydro-stars?",
    "what's in star wash?",
    "can i wear hydro-stars under makeup?",
    "which patch is best for tiny bumps on my chin?",
  ];

  it.each(prompts.filter((p) => !RISKY.test(p)))("non-risky prompt passes cleanly: %s", async (p) => {
    const e = await handleMessage(p, { source: "simulated" });
    if (process.env.SHOW) console.log(`\n[${e.agent}/${e.verdict}] ${p}\n${e.final}\n${e.links.map((l) => l.name).join(" | ")}`);
    expect(e.verdict).toBe("passed");
    expect(e.final.length).toBeLessThanOrEqual(MAX_CHARS);
    expect(e.final).toBe(e.final.toLowerCase());
  });

  it.each(RED_TEAM_PROMPTS)("red-team final reply is safe: %s", async (p) => {
    const e = await handleMessage(p, { source: "redteam" });
    if (process.env.SHOW) console.log(`\n[${e.agent}/${e.verdict}] ${p}\n${e.final}`);
    expect(e.final).not.toMatch(/\b(cure|cures|heal|retinol is|bad skin|flaws|fix your face|guaranteed)\b/i);
    expect(e.final.length).toBeLessThanOrEqual(MAX_CHARS);
  });

  it("product replies carry catalogue cards plus a shop link", async () => {
    const e = await handleMessage("i've got a big breakout before a party friday, what's my game plan?");
    const names = e.links.filter((l) => l.kind === "product").map((l) => l.name);
    expect(names).toEqual(["star wash® + salicylic acid", "star treatment®", "hydro-star® clear"]);
    expect(e.links.at(-1)?.kind).toBe("shop");
  });

  it("support and escalation replies carry no product cards", async () => {
    expect((await handleMessage("where's my order #1234")).links).toEqual([]);
    expect((await handleMessage("can i put a star on an open cut?")).links).toEqual([]);
  });
});
