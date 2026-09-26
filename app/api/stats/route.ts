import { NextResponse } from "next/server";
import { getStats } from "@/lib/queries.ts";
import { db } from "@/lib/server.ts";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getStats(db()));
}
