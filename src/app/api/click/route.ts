import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAllowedUrl, SHOP_URL } from "../../../lib/links";
import { findEvent, recordTrack } from "../../../lib/log";

export const dynamic = "force-dynamic";

/** GET /api/click?eid=&pid=&kind=&url=  records the click, then 302s to starface.world */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const url = q.get("url") ?? "";
  if (!isAllowedUrl(url)) return NextResponse.redirect(SHOP_URL, 302);

  const event = findEvent(q.get("eid") ?? "");
  if (event) {
    recordTrack({
      id: randomUUID(),
      ts: new Date().toISOString(),
      type: "click",
      eventId: event.id,
      sessionId: event.sessionId,
      pid: q.get("pid") ?? "unknown",
      kind: q.get("kind") === "shop" ? "shop" : "product",
      source: event.source,
    });
  }
  return NextResponse.redirect(url, 302);
}
