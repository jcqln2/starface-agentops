import { NextResponse } from "next/server";
import { allEvents, allTracks } from "../../../lib/log";
import { computeEngagement, computeStats } from "../../../lib/stats";
import { getProvider } from "../../../lib/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = allEvents();
  return NextResponse.json({
    provider: getProvider().name,
    stats: computeStats(events),
    engagement: computeEngagement(events, allTracks()),
    events: events.slice(-60).reverse(),
  });
}
