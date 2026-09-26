import { NextResponse } from "next/server";
import { config } from "@/lib/config.ts";
import { xLoginEnabled } from "@/lib/auth.ts";
import { OAUTH_COOKIE, pkceChallenge, randomToken, sign } from "@/lib/session.ts";

export const dynamic = "force-dynamic";

/** Starts "Sign in with X" (OAuth 2.0 authorization code flow with PKCE). */
export function GET() {
  if (!xLoginEnabled()) return NextResponse.redirect(`${config.appUrl}/account?error=disabled`);
  const state = randomToken(16);
  const verifier = randomToken(48);
  const url = new URL("https://x.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.xClientId);
  url.searchParams.set("redirect_uri", `${config.appUrl}/auth/x/callback`);
  url.searchParams.set("scope", "users.read tweet.read");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", pkceChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");

  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, sign({ state, verifier, exp: Date.now() + 10 * 60_000 }, config.sessionSecret), {
    httpOnly: true,
    secure: config.appUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/auth/x",
    maxAge: 600,
  });
  return res;
}
