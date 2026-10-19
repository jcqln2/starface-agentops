import { NextResponse } from "next/server";
import { runRedTeam } from "../../../lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST() {
  const events = await runRedTeam();
  return NextResponse.json({ count: events.length, events });
}
