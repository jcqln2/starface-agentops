import type { AgentName, ChatEvent, ProductLink, TrackEvent, Verdict } from "./types";

const pct = (sorted: number[], p: number) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : 0;
/** ratio as a percentage with one decimal; 0 when there's no denominator */
export const rate = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
const emptyAgents = (): Record<AgentName, number> => ({ router: 0, product: 0, support: 0, escalation: 0 });

// ---- guardrail / ops stats: every event, red team included -------------------

export interface Stats {
  total: number;
  byVerdict: Record<Verdict, number>;
  rates: Record<Verdict, number>;
  blockReasons: Record<string, number>;
  rewriteReasons: Record<string, number>;
  byAgent: Record<AgentName, number>;
  escalations: number;
  latency: { p50: number; p95: number };
}

export function computeStats(events: ChatEvent[]): Stats {
  const byVerdict: Record<Verdict, number> = { passed: 0, rewritten: 0, blocked: 0 };
  const byAgent = emptyAgents();
  const blockReasons: Record<string, number> = {};
  const rewriteReasons: Record<string, number> = {};

  for (const e of events) {
    byVerdict[e.verdict]++;
    byAgent[e.agent]++;
    for (const c of e.checks) {
      const bucket = c.verdict === "blocked" ? blockReasons : c.verdict === "rewritten" ? rewriteReasons : null;
      if (bucket) for (const r of c.reasons) bucket[r] = (bucket[r] ?? 0) + 1;
    }
  }
  const total = events.length;
  const sorted = events.map((e) => e.latencyMs).sort((a, b) => a - b);

  return {
    total,
    byVerdict,
    rates: {
      passed: Math.round(rate(byVerdict.passed, total)),
      rewritten: Math.round(rate(byVerdict.rewritten, total)),
      blocked: Math.round(rate(byVerdict.blocked, total)),
    },
    blockReasons,
    rewriteReasons,
    byAgent,
    escalations: byAgent.escalation,
    latency: { p50: pct(sorted, 50), p95: pct(sorted, 95) },
  };
}

// ---- engagement stats: customer-like traffic only (chat + simulated) ----------

export interface ProductCtr { pid: string; name: string; impressions: number; clicks: number; ctr: number }

export interface Engagement {
  conversations: number;
  messages: number; // user + agent messages
  avgMessagesPerConversation: number;
  repliesByAgent: Record<AgentName, number>;
  impressions: { total: number; product: number; shop: number };
  clicks: { total: number; product: number; shop: number };
  ctr: { overall: number; product: number; shop: number };
  topProducts: ProductCtr[];
}

export function computeEngagement(events: ChatEvent[], tracks: TrackEvent[]): Engagement {
  const real = events.filter((e) => e.source !== "redteam");
  const realTracks = tracks.filter((t) => t.source !== "redteam");
  const conversations = new Set(real.map((e) => e.sessionId)).size;
  const messages = real.length * 2;

  const repliesByAgent = emptyAgents();
  for (const e of real) repliesByAgent[e.agent]++;

  const count = (type: TrackEvent["type"], kind?: ProductLink["kind"]) =>
    realTracks.filter((t) => t.type === type && (!kind || t.kind === kind)).length;
  const impressions = { total: count("impression"), product: count("impression", "product"), shop: count("impression", "shop") };
  const clicks = { total: count("click"), product: count("click", "product"), shop: count("click", "shop") };

  const names = new Map(real.flatMap((e) => e.links.map((l) => [l.pid, l.name] as const)));
  const byPid = new Map<string, ProductCtr>();
  for (const t of realTracks) {
    if (t.kind !== "product") continue;
    const row = byPid.get(t.pid) ?? { pid: t.pid, name: names.get(t.pid) ?? t.pid, impressions: 0, clicks: 0, ctr: 0 };
    row[t.type === "click" ? "clicks" : "impressions"]++;
    byPid.set(t.pid, row);
  }
  const topProducts = [...byPid.values()]
    .map((r) => ({ ...r, ctr: rate(r.clicks, r.impressions) }))
    .sort((a, b) => b.clicks - a.clicks || b.ctr - a.ctr)
    .slice(0, 6);

  return {
    conversations,
    messages,
    avgMessagesPerConversation: conversations ? Math.round((messages / conversations) * 10) / 10 : 0,
    repliesByAgent,
    impressions,
    clicks,
    ctr: {
      overall: rate(clicks.total, impressions.total),
      product: rate(clicks.product, impressions.product),
      shop: rate(clicks.shop, impressions.shop),
    },
    topProducts,
  };
}
