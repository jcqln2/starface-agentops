export type AgentName = "router" | "product" | "support" | "escalation";
export type Verdict = "passed" | "rewritten" | "blocked";
/** "simulated" = synthetic demo traffic from the simulate button; never mixed up with real chats */
export type EventSource = "chat" | "redteam" | "simulated";

export interface CheckResult {
  check: "input-safety" | "medical-claims" | "ingredient-hallucination" | "brand-voice";
  verdict: Verdict;
  reasons: string[]; // short machine-ish labels, e.g. "medical:cure"
  text: string; // text after this check (unchanged when passed)
}

/** a tappable card or pill attached to an agent reply */
export interface ProductLink {
  pid: string; // catalogue handle, or "shop-all"
  kind: "product" | "shop";
  name: string;
  price: string;
  url: string;
  image: string;
}

export interface ChatEvent {
  id: string;
  ts: string;
  sessionId: string;
  source: EventSource;
  provider: string;
  userMessage: string;
  agent: AgentName;
  routeReason: string;
  draft: string;
  final: string;
  verdict: Verdict;
  checks: CheckResult[];
  links: ProductLink[];
  latencyMs: number;
}

/** link impressions (served with a reply) and clicks (via /api/click) */
export interface TrackEvent {
  id: string;
  ts: string;
  type: "impression" | "click";
  eventId: string;
  sessionId: string;
  pid: string;
  kind: ProductLink["kind"];
  source: EventSource;
}
