import { NextResponse } from "next/server";
import { runClaimCycle } from "@/lib/claimer.ts";
import { authorized, db, feeSource, ledgerOptions, payoutProvider } from "@/lib/server.ts";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

let running = false;

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (running) return NextResponse.json({ error: "a claim cycle is already running" }, { status: 409 });
  running = true;
  try {
    const report = await runClaimCycle(db(), feeSource(), payoutProvider(), ledgerOptions());
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  } finally {
    running = false;
  }
}
