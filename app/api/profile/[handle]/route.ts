import { NextResponse } from "next/server";
import { normalizeHandle } from "@/lib/handle.ts";
import { getAccount, listPayouts, listTokens, recentClaims } from "@/lib/queries.ts";
import { db } from "@/lib/server.ts";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const handle = normalizeHandle(decodeURIComponent((await params).handle));
  if (!handle) return NextResponse.json({ error: "invalid handle" }, { status: 400 });
  const d = db();
  return NextResponse.json({
    handle,
    account: getAccount(d, handle),
    tokens: listTokens(d, { handle, limit: 200 }),
    payouts: listPayouts(d, { handle, limit: 50 }),
    claims: recentClaims(d, { handle, limit: 50 }),
  });
}
