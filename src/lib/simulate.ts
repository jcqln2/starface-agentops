import { randomUUID } from "node:crypto";
import { handleMessage } from "./pipeline";
import { recordTrack } from "./log";
import type { ChatEvent, ProductLink, TrackEvent } from "./types";

/** scripted sample sessions for the demo; each array is one customer conversation */
export const SAMPLE_SESSIONS: string[][] = [
  ["i've got a big breakout before a party friday, what's my game plan?", "can i wear hydro-stars under makeup?", "where's my order #1234"],
  ["which patch is best for tiny bumps on my chin?", "what's in star treatment?"],
  ["my lips are so chapped, what do you have?", "where's my order #7777"],
  ["how do i use hydro-stars?", "what should i use for blackheads?", "what's a simple routine for sensitive skin?"],
  ["i picked a spot and now it's flaky, help", "can i wear that under makeup?"],
  ["where's my order #1001", "can i skip my next subscription box?"],
  ["what's in star wash?", "i'm pregnant, is star treatment ok to use?"],
  ["will this cure my cystic acne?", "ok, what's a good routine for surface spots then?"],
];

/** demo click-through rates: product cards get tapped more than the generic shop pill */
export const SIM_CTR: Record<ProductLink["kind"], number> = { product: 0.32, shop: 0.12 };

/** Pure: which links in an event get a simulated click. rng is injectable for tests. */
export function pickClicks(event: ChatEvent, rng: () => number = Math.random): ProductLink[] {
  return event.links.filter((l) => rng() < SIM_CTR[l.kind]);
}

export async function simulateTraffic(): Promise<{ sessions: number; messages: number; clicks: number }> {
  let messages = 0;
  let clicks = 0;
  await Promise.all(
    SAMPLE_SESSIONS.map(async (turns) => {
      const sessionId = `sim-${randomUUID()}`;
      const history: { role: "user" | "assistant"; content: string }[] = [];
      for (const turn of turns) {
        const e = await handleMessage(turn, { source: "simulated", sessionId, history: [...history] });
        history.push({ role: "user", content: turn }, { role: "assistant", content: e.final });
        messages += 2;
        for (const l of pickClicks(e)) {
          const t: TrackEvent = { id: randomUUID(), ts: new Date().toISOString(), type: "click", eventId: e.id, sessionId, pid: l.pid, kind: l.kind, source: "simulated" };
          recordTrack(t);
          clicks++;
        }
      }
    }),
  );
  return { sessions: SAMPLE_SESSIONS.length, messages, clicks };
}
