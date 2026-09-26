import { NextResponse } from "next/server";
import { config } from "@/lib/config.ts";
import { sameOrigin } from "@/lib/auth.ts";
import { SESSION_COOKIE } from "@/lib/session.ts";

export function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const res = NextResponse.redirect(`${config.appUrl}/account`, 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
