import type { AgentName, EventSource, Verdict } from "../lib/types";

/** big yellow's face (public/big-yellow.png, 200px source), always rendered as a crisp circle */
export function Avatar({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/big-yellow.png"
      alt="big yellow"
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover ring-2 ring-ink"
      style={{ width: size, height: size }}
    />
  );
}

export const AGENT_LABEL: Record<AgentName, string> = {
  router: "router",
  product: "product agent",
  support: "support agent",
  escalation: "human handoff",
};

/** Customer-facing names for the ops dashboard. Internal agent keys stay the same. */
export const DASHBOARD_AGENT_LABEL: Record<AgentName, string> = {
  router: "Sorting step",
  product: "Product assistant",
  support: "Support assistant",
  escalation: "Human team",
};

const VERDICT_STYLE: Record<Verdict, string> = {
  passed: "bg-emerald-100 text-emerald-800",
  rewritten: "bg-amber-100 text-amber-800",
  blocked: "bg-rose-100 text-rose-800",
};
const VERDICT_ICON: Record<Verdict, string> = { passed: "✓", rewritten: "✎", blocked: "⛔" };

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${VERDICT_STYLE[verdict]}`}>
      {VERDICT_ICON[verdict]} {verdict}
    </span>
  );
}

export function Badge({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${dark ? "bg-ink text-sun" : "bg-black/5 text-black/70"}`}>
      {children}
    </span>
  );
}

const SOURCE_STYLE: Record<EventSource, string> = {
  chat: "bg-black/5 text-black/70",
  redteam: "bg-ink text-sun",
  simulated: "bg-violet-100 text-violet-800 border border-dashed border-violet-400",
};

const SOURCE_LABEL: Record<EventSource, string> = {
  chat: "chat",
  redteam: "safety test",
  simulated: "sample",
};

export function SourceBadge({ source }: { source: EventSource }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SOURCE_STYLE[source]}`}>{SOURCE_LABEL[source]}</span>;
}
