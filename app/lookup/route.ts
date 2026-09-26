import { NextResponse } from "next/server";
import { normalizeHandle } from "@/lib/handle.ts";

export function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(q)) return NextResponse.redirect(new URL(`/token/${q.toLowerCase()}`, url));
  const handle = normalizeHandle(q);
  if (handle) return NextResponse.redirect(new URL(`/profile/${handle}`, url));
  return NextResponse.redirect(new URL("/", url));
}
