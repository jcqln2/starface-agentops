import { NextResponse } from "next/server";
import { simulateTraffic } from "../../../lib/simulate";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(await simulateTraffic());
}
