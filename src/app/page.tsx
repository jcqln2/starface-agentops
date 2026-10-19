"use client";

import { useEffect, useRef, useState } from "react";
import { AGENT_LABEL, Avatar, Badge, VerdictBadge } from "../components/ui";
import { clickHref } from "../lib/clickHref";
import type { ChatEvent, ProductLink } from "../lib/types";

type Msg = { role: "user"; content: string } | { role: "assistant"; content: string; event?: ChatEvent };

const SUGGESTIONS = [
  "i've got a big breakout before a party friday, what's my game plan?",
  "can i wear hydro-stars under makeup?",
  "which patch is best for tiny bumps on my chin?",
  "where's my order #1234",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "hi bestie, big yellow here ⭐ ask me about routines, which star to pick, or your order. what's going on with your skin today?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { setSessionId(crypto.randomUUID()); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history, sessionId }),
      });
      const event = (await res.json()) as ChatEvent;
      setMessages((m) => [...m, { role: "assistant", content: event.final, event }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "oops, something hiccuped on my end. mind trying that again?" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4">
      <div className="flex h-[calc(100vh-150px)] min-h-[560px] flex-col rounded-[2rem] border-2 border-ink bg-white shadow-[6px_6px_0_#1a1a1a]">
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[80%] rounded-3xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed text-white">{m.content}</p>
              </div>
            ) : (
              <AssistantBubble key={i} content={m.content} event={m.event} />
            ),
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm opacity-60">
              <Avatar size={36} /> big yellow is typing…
            </div>
          )}
          <div ref={bottom} />
        </div>

        <div className="border-t-2 border-ink/10 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={busy} className="rounded-full bg-sun/60 px-3 py-1 text-left text-xs font-medium hover:bg-sun disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type a msg…"
              className="flex-1 rounded-full border-2 border-ink px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-sun"
            />
            <button disabled={busy} className="rounded-full bg-ink px-5 text-sm font-bold text-sun disabled:opacity-40">send</button>
          </form>
        </div>
      </div>
    </main>
  );
}

function AssistantBubble({ content, event }: { content: string; event?: ChatEvent }) {
  const cards = event?.links.filter((l) => l.kind === "product") ?? [];
  const shop = event?.links.find((l) => l.kind === "shop");
  return (
    <div className="flex items-start gap-2.5">
      <Avatar size={36} />
      <div className="min-w-0 max-w-[85%] space-y-2">
        {event && (
          <p className="text-[11px] font-medium text-black/50">
            router → <span className="font-bold text-black/80">{AGENT_LABEL[event.agent]}</span>
            {event.agent === "escalation" && " · handed to a human"}
          </p>
        )}
        <p className="rounded-3xl rounded-tl-md border-2 border-sun bg-[#fff8d6] px-4 py-2.5 text-sm leading-relaxed" data-role="assistant">{content}</p>
        {event && cards.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {cards.map((l) => <ProductCard key={l.pid} eventId={event.id} link={l} />)}
          </div>
        )}
        {event && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge dark>{AGENT_LABEL[event.agent]}</Badge>
            <VerdictBadge verdict={event.verdict} />
            <Badge>{event.latencyMs} ms</Badge>
            <Badge>{event.provider}</Badge>
            {shop && (
              <a href={clickHref(event.id, shop)} target="_blank" rel="noopener" className="ml-auto rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-bold hover:bg-sun">
                shop all starface ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ eventId, link }: { eventId: string; link: ProductLink }) {
  return (
    <a
      href={clickHref(eventId, link)}
      target="_blank"
      rel="noopener"
      className="flex min-w-0 items-center gap-2 rounded-2xl border-2 border-ink bg-white p-2 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a]"
    >
      {link.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.image} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-sun/30 object-contain p-0.5" />
      ) : (
        <span className="h-11 w-11 shrink-0 rounded-xl bg-sun/40" />
      )}
      <span className="min-w-0">
        <span className="line-clamp-2 block text-xs font-bold leading-tight">{link.name}</span>
        <span className="text-[11px] text-black/60">{link.price} · view ↗</span>
      </span>
    </a>
  );
}
