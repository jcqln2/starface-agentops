import { NextResponse } from "next/server";
import { handleMessage } from "../../../lib/pipeline";
import type { ChatTurn } from "../../../lib/llm/provider";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { message, history, sessionId } = (await req.json()) as { message?: string; history?: ChatTurn[]; sessionId?: string };
  if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });
  const event = await handleMessage(message.trim().slice(0, 1000), {
    history,
    sessionId: sessionId?.slice(0, 64),
  });
  return NextResponse.json(event);
}
