import { NextResponse } from "next/server";
import { config } from "@/lib/config.ts";
import { currentSession, sameOrigin } from "@/lib/auth.ts";
import { setOptOut } from "@/lib/ledger.ts";
import { db } from "@/lib/server.ts";

/** Signed-in account owners opt themselves out (or back in). Form post from /account. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const form = await req.formData();
  const optedOut = form.get("optedOut") === "1";
  setOptOut(db(), session.handle, optedOut);
  return NextResponse.redirect(`${config.appUrl}/account?saved=1`, 303);
}
