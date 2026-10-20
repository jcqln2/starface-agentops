"use client";

import { useEffect, useState } from "react";
import { Badge, DASHBOARD_AGENT_LABEL, SourceBadge, VerdictBadge } from "../../components/ui";
import type { AgentName, ChatEvent, Verdict } from "../../lib/types";
import type { Engagement, Stats } from "../../lib/stats";

interface Payload { provider: string; stats: Stats; engagement: Engagement; events: ChatEvent[] }

export default function OpsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [open, setOpen] = useState<ChatEvent | null>(null);
  const [running, setRunning] = useState<"" | "redteam" | "simulate">("");
  const [err, setErr] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      setData(await res.json());
      setErr("");
    } catch {
      setErr("couldn't reach the event log");
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  async function run(kind: "redteam" | "simulate") {
    setRunning(kind);
    try {
      await fetch(`/api/${kind}`, { method: "POST" });
      await load();
    } finally {
      setRunning("");
    }
  }

  const s = data?.stats;
  const g = data?.engagement;
  const blockedRate = s?.rates.blocked ?? 0;
  const blockedTone: Tone | undefined = !s ? undefined : blockedRate === 0 ? "good" : blockedRate >= 10 ? "bad" : undefined;
  const passedTone: Tone | undefined = s && s.rates.passed >= 80 ? "good" : undefined;
  const escalationTone: Tone | undefined =
    s && s.total > 0 && s.escalations / s.total >= 0.25 ? "bad" : undefined;
  const ctrTone: Tone | undefined = g && g.ctr.overall > 0 ? "good" : undefined;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">big yellow agent dashboard</h1>
          <p className="text-sm opacity-70">
            Live view of how the assistant is doing · demo data · updates every few seconds
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => run("simulate")}
            disabled={!!running}
            className="rounded-full border-2 border-dashed border-violet-500 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-800 disabled:opacity-50"
          >
            {running === "simulate" ? "adding sample chats…" : "add sample chats"}
          </button>
          <button
            onClick={() => run("redteam")}
            disabled={!!running}
            className="rounded-full border-2 border-rose-600 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 disabled:opacity-50"
          >
            {running === "redteam" ? "running safety test…" : "run safety test (8 tricky questions)"}
          </button>
        </div>
      </div>
      {err && <p className="mb-4 text-sm text-rose-700">{err}</p>}

      <SectionTitle>Safety checks and handoffs <span className="font-medium opacity-60">· all chats, including tests</span></SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Replies sent" value={s?.total ?? 0} note="How many times the assistant answered." />
        <Stat
          label="Sent as written"
          value={s ? `${s.rates.passed}%` : "–"}
          hint={plural(s?.byVerdict.passed ?? 0, "message")}
          note="Replies that needed no safety edits."
          tone={passedTone}
        />
        <Stat
          label="Fixed before sending"
          value={s ? `${s.rates.rewritten}%` : "–"}
          hint={plural(s?.byVerdict.rewritten ?? 0, "message")}
          note="Replies adjusted to stay on-brand and safe."
        />
        <Stat
          label="Stopped"
          value={s ? `${s.rates.blocked}%` : "–"}
          hint={plural(s?.byVerdict.blocked ?? 0, "message")}
          note="Replies blocked for safety. Lower is usually better."
          tone={blockedTone}
        />
        <Stat
          label="Handed to a human"
          value={s?.escalations ?? 0}
          note="Chats the assistant couldn’t solve."
          tone={escalationTone}
        />
        <Stat
          label="Typical response time"
          value={s ? `${s.latency.p50} ms` : "–"}
          note="How long most replies take."
        />
        <Stat
          label="Slowest response times"
          value={s ? `${s.latency.p95} ms` : "–"}
          note="1 in 20 replies is slower than this"
        />
        <Stat
          label="Assistants used"
          value={s ? Object.values(s.byAgent).filter((n) => n > 0).length : 0}
          note="How many different assistants took a chat."
        />
      </div>

      <div className="mt-3 grid items-start gap-3 md:grid-cols-2">
        <Panel title="Who handled each chat">
          {(["product", "support", "escalation", "router"] as AgentName[]).map((a) => (
            <Bar key={a} label={DASHBOARD_AGENT_LABEL[a]} value={s?.byAgent[a] ?? 0} total={s?.total ?? 0} />
          ))}
        </Panel>
        <Panel title="Why replies were fixed or stopped">
          {s && s.total > 0 && Object.keys({ ...s.blockReasons, ...s.rewriteReasons }).length === 0 && (
            <p className="text-sm opacity-60">Nothing flagged yet. Run the safety test to see examples.</p>
          )}
          <Reasons title="Stopped" counts={s?.blockReasons ?? {}} tone="rose" />
          <Reasons title="Fixed before sending" counts={s?.rewriteReasons ?? {}} tone="amber" />
        </Panel>
      </div>

      <SectionTitle>How people use it <span className="font-medium opacity-60">· real and sample chats, safety tests not counted</span></SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Chats" value={g?.conversations ?? 0} />
        <Stat label="Total messages" value={g?.messages ?? 0} hint="customer + assistant" />
        <Stat label="Messages per chat" value={g?.avgMessagesPerConversation ?? 0} />
        <Stat
          label="Click rate"
          value={g ? `${g.ctr.overall}%` : "–"}
          hint={`${plural(g?.clicks.total ?? 0, "click")} from ${plural(g?.impressions.total ?? 0, "product")} shown`}
          note="How often people tap a product that was shown."
          tone={ctrTone}
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Panel title="Replies by assistant">
          {(["product", "support", "escalation", "router"] as AgentName[]).map((a) => (
            <Bar key={a} label={DASHBOARD_AGENT_LABEL[a]} value={g?.repliesByAgent[a] ?? 0} total={(g?.messages ?? 0) / 2} />
          ))}
          <p className="pt-1 text-[11px] opacity-50">Counts assistant replies; each pairs with one customer message</p>
        </Panel>
        <Panel title="Click rate by where it appeared">
          <CtrRow label="Product suggestions" ctr={g?.ctr.product ?? 0} clicks={g?.clicks.product ?? 0} impressions={g?.impressions.product ?? 0} />
          <CtrRow label={'"Shop all" button'} ctr={g?.ctr.shop ?? 0} clicks={g?.clicks.shop ?? 0} impressions={g?.impressions.shop ?? 0} />
          <p className="pt-1 text-[11px] opacity-50">Shown = appeared in a reply. Clicked = customer tapped it.</p>
        </Panel>
        <Panel title="Most-clicked products">
          {g && g.topProducts.length === 0 && <p className="text-sm opacity-60">No products shown yet.</p>}
          <table className="w-full text-xs">
            <tbody>
              {(g?.topProducts ?? []).map((p) => (
                <tr key={p.pid} className="border-b border-black/5 last:border-0">
                  <td className="max-w-[150px] truncate py-1 font-medium">{p.name}</td>
                  <td className="py-1 text-right opacity-60">{p.clicks} of {p.impressions} clicked</td>
                  <td className="w-14 py-1 text-right font-bold">{p.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SectionTitle>recent events <span className="font-medium opacity-60">· click a row for draft vs final</span></SectionTitle>
      <div className="max-h-[540px] overflow-y-auto rounded-3xl border-2 border-ink bg-white">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#fff3a6] text-xs uppercase tracking-wide">
            <tr>
              {["time", "source", "assistant", "verdict", "latency", "message"].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.events ?? []).map((e) => (
              <tr key={e.id} onClick={() => setOpen(e)} className="cursor-pointer border-t border-black/10 hover:bg-sun/30">
                <td className="whitespace-nowrap px-3 py-2 text-xs opacity-70">{new Date(e.ts).toLocaleTimeString()}</td>
                <td className="px-3 py-2"><SourceBadge source={e.source} /></td>
                <td className="px-3 py-2 text-xs font-medium">{DASHBOARD_AGENT_LABEL[e.agent]}</td>
                <td className="px-3 py-2"><VerdictBadge verdict={e.verdict} /></td>
                <td className="px-3 py-2 text-xs">{e.latencyMs} ms</td>
                <td className="max-w-[280px] truncate px-3 py-2">{e.userMessage}</td>
              </tr>
            ))}
            {data && data.events.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm opacity-60">No chats yet. Send a message, add sample chats, or run the safety test.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <EventDialog event={open} onClose={() => setOpen(null)} />}
    </main>
  );
}

function plural(n: number, singular: string, pluralForm = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-7 text-sm font-extrabold uppercase tracking-wide first:mt-0">{children}</h2>;
}

function CtrRow({ label, ctr, clicks, impressions }: { label: string; ctr: number; clicks: number; impressions: number }) {
  return (
    <div className="flex items-baseline justify-between rounded-xl bg-sun/30 px-3 py-2">
      <span className="text-xs font-semibold">{label}</span>
      <span>
        <span className="text-xl font-extrabold">{ctr}%</span>
        <span className="ml-2 text-[11px] opacity-60">{clicks} of {impressions}</span>
      </span>
    </div>
  );
}

type Tone = "good" | "bad";

function Stat({ label, value, hint, note, tone }: { label: string; value: number | string; hint?: string; note?: string; tone?: Tone }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className={`text-2xl font-extrabold ${tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : ""}`}>{value}</p>
      {hint && <p className="text-xs opacity-60">{hint}</p>}
      {note && <p className="mt-0.5 text-[11px] leading-snug opacity-50">{note}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-4">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Reasons({ title, counts, tone }: { title: string; counts: Record<string, number>; tone: "rose" | "amber" }) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return null;
  const max = rows[0][1];
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-50">{title}</p>
      {rows.map(([reason, n]) => <Bar key={reason} label={reason} value={n} total={max} tone={tone} />)}
    </div>
  );
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone?: "rose" | "amber" }) {
  const w = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-44 shrink-0 truncate font-medium">{label}</span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-black/5">
        <span className={`block h-full rounded-full ${tone === "rose" ? "bg-rose-400" : tone === "amber" ? "bg-amber-400" : "bg-sunDeep"}`} style={{ width: `${w}%` }} />
      </span>
      <span className="w-6 text-right">{value}</span>
    </div>
  );
}

function EventDialog({ event, onClose }: { event: ChatEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-ink bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-extrabold">event {event.id.slice(0, 8)}</h3>
          <button onClick={onClose} className="rounded-full bg-black/5 px-3 py-1 text-sm">close</button>
        </div>
        <p className="mb-3 text-sm"><b>user:</b> {event.userMessage}</p>
        <p className="mb-3 flex items-center gap-2 text-xs opacity-80"><SourceBadge source={event.source} /> session {event.sessionId.slice(0, 12)}</p>
        <p className="mb-3 text-xs opacity-70">route: {event.routeReason} → {DASHBOARD_AGENT_LABEL[event.agent]} · {event.latencyMs} ms</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-rose-50 p-3">
            <p className="mb-1 text-xs font-bold uppercase text-rose-700">original draft</p>
            <p className="text-sm">{event.draft}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="mb-1 text-xs font-bold uppercase text-emerald-700">final reply</p>
            <p className="text-sm">{event.final}</p>
          </div>
        </div>
        {event.links.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <span className="font-bold uppercase tracking-wide">links served:</span>
            {event.links.map((l) => <Badge key={l.pid}>{l.name}</Badge>)}
          </p>
        )}
        <h4 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide">guardrail checks</h4>
        <ul className="space-y-1 text-sm">
          {event.checks.map((c) => (
            <li key={c.check} className="flex items-start gap-2">
              <span className="w-44 shrink-0 font-medium">{c.check}</span>
              <span className="flex flex-1 flex-wrap gap-1.5">
                <VerdictBadge verdict={c.verdict as Verdict} />
                {c.reasons.map((r) => <Badge key={r}>{r}</Badge>)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
