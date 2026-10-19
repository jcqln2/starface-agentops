import { describe, expect, it } from "vitest";
import { clickHref, isAllowedUrl, linksFor, SHOP_LINK } from "../src/lib/links";
import { computeEngagement, rate } from "../src/lib/stats";
import { pickClicks } from "../src/lib/simulate";
import type { ChatEvent, EventSource, ProductLink, TrackEvent } from "../src/lib/types";

const card = (pid: string, name = pid): ProductLink => ({ pid, kind: "product", name, price: "$1", url: `https://starface.world/products/${pid}`, image: "" });

let seq = 0;
function event(sessionId: string, agent: ChatEvent["agent"], links: ProductLink[] = [], source: EventSource = "chat"): ChatEvent {
  return {
    id: `e${++seq}`, ts: "", sessionId, source, provider: "mock", userMessage: "hi", agent, routeReason: "",
    draft: "", final: "", verdict: "passed", checks: [], links, latencyMs: 100,
  };
}
const track = (e: ChatEvent, l: ProductLink, type: TrackEvent["type"]): TrackEvent => ({
  id: `t${++seq}`, ts: "", type, eventId: e.id, sessionId: e.sessionId, pid: l.pid, kind: l.kind, source: e.source,
});
const impressions = (e: ChatEvent) => e.links.map((l) => track(e, l, "impression"));

describe("links", () => {
  it("builds cards only for products named in the final reply, plus a shop pill", () => {
    const links = linksFor("product", "try star strips® + salicylic acid, then hydro-star® clear.", "passed");
    expect(links.map((l) => l.pid)).toEqual(["star-strips-salicylic-acid", "hydro-star-clear", "shop-all"]);
    expect(links[0].url).toBe("https://starface.world/products/star-strips-salicylic-acid");
  });

  it("gives no cards to support, escalation or blocked replies", () => {
    expect(linksFor("support", "hydro-star® clear", "passed")).toEqual([]);
    expect(linksFor("escalation", "hydro-star® clear", "passed")).toEqual([]);
    expect(linksFor("product", "hydro-star® clear", "blocked")).toEqual([]);
  });

  it("only allows redirects to starface.world", () => {
    expect(isAllowedUrl("https://starface.world/products/tiny-star")).toBe(true);
    expect(isAllowedUrl("https://shop.starface.world/x")).toBe(true);
    expect(isAllowedUrl("https://starface.world.evil.com/")).toBe(false);
    expect(isAllowedUrl("http://starface.world/")).toBe(false);
    expect(isAllowedUrl("javascript:alert(1)")).toBe(false);
  });

  it("encodes the click-through url", () => {
    expect(clickHref("abc", SHOP_LINK)).toBe("/api/click?eid=abc&pid=shop-all&kind=shop&url=https%3A%2F%2Fstarface.world");
  });
});

describe("engagement stats", () => {
  const a = card("tiny-star", "tiny star");
  const b = card("hydro-star-clear", "hydro-star® clear");
  const s1a = event("s1", "product", [a, SHOP_LINK]);
  const s1b = event("s1", "support");
  const s2a = event("s2", "product", [a, b, SHOP_LINK], "simulated");
  const red = event("r1", "product", [a, SHOP_LINK], "redteam");
  const events = [s1a, s1b, s2a, red];
  const tracks = [
    ...impressions(s1a), ...impressions(s2a), ...impressions(red),
    track(s1a, a, "click"), track(s2a, a, "click"), track(s2a, SHOP_LINK, "click"),
    track(red, a, "click"), // red team traffic must not count
  ];
  const g = computeEngagement(events, tracks);

  it("counts conversations and messages, excluding red team", () => {
    expect(g.conversations).toBe(2);
    expect(g.messages).toBe(6); // 3 replies, each = 1 user + 1 agent message
    expect(g.avgMessagesPerConversation).toBe(3);
    expect(g.repliesByAgent).toEqual({ router: 0, product: 2, support: 1, escalation: 0 });
  });

  it("splits impressions, clicks and ctr into product vs shop", () => {
    expect(g.impressions).toEqual({ total: 5, product: 3, shop: 2 });
    expect(g.clicks).toEqual({ total: 3, product: 2, shop: 1 });
    expect(g.ctr).toEqual({ overall: 60, product: 66.7, shop: 50 });
  });

  it("ranks products by clicks with per-product ctr", () => {
    expect(g.topProducts[0]).toEqual({ pid: "tiny-star", name: "tiny star", impressions: 2, clicks: 2, ctr: 100 });
    expect(g.topProducts[1]).toMatchObject({ pid: "hydro-star-clear", clicks: 0, ctr: 0 });
  });

  it("handles an empty log", () => {
    const empty = computeEngagement([], []);
    expect(empty.conversations).toBe(0);
    expect(empty.avgMessagesPerConversation).toBe(0);
    expect(empty.ctr.overall).toBe(0);
    expect(rate(1, 0)).toBe(0);
  });
});

describe("simulated clicks", () => {
  it("clicks a link when the rng falls under that kind's ctr", () => {
    const e = event("s", "product", [card("x"), SHOP_LINK]);
    const rolls = [0.1, 0.5]; // product 0.1 < 0.32 -> click; shop 0.5 > 0.12 -> no click
    expect(pickClicks(e, () => rolls.shift()!).map((l) => l.pid)).toEqual(["x"]);
  });
});
