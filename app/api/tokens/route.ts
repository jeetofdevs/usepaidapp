import { NextResponse } from "next/server";
import { listTokens } from "@/lib/queries.ts";
import { db } from "@/lib/server.ts";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const sort = p.get("sort") === "new" ? "new" : "fees";
  const limit = Number(p.get("limit") ?? 50) || 50;
  return NextResponse.json(listTokens(db(), { sort, limit, q: p.get("q") ?? undefined }));
}
