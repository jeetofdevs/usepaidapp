import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { config } from "@/lib/config.ts";
import { normalizeHandle } from "@/lib/handle.ts";
import { OAUTH_COOKIE, type OAuthState, SESSION_COOKIE, SESSION_TTL_MS, sign, verify } from "@/lib/session.ts";

export const dynamic = "force-dynamic";

function fail(reason: string) {
  const res = NextResponse.redirect(`${config.appUrl}/account?error=${encodeURIComponent(reason)}`);
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/auth/x" });
  return res;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const jar = await cookies();
  const saved = verify<OAuthState>(jar.get(OAUTH_COOKIE)?.value, config.sessionSecret);
  const code = params.get("code");
  if (!saved || !code || params.get("state") !== saved.state) return fail("state");

  const basic = Buffer.from(`${config.xClientId}:${config.xClientSecret}`).toString("base64");
  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${basic}` },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${config.appUrl}/auth/x/callback`,
      code_verifier: saved.verifier,
    }),
  });
  if (!tokenRes.ok) return fail("token");
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return fail("token");

  const meRes = await fetch("https://api.x.com/2/users/me", { headers: { authorization: `Bearer ${access_token}` } });
  if (!meRes.ok) return fail("profile");
  const me = (await meRes.json()) as { data?: { username?: string } };
  const handle = me.data?.username ? normalizeHandle(me.data.username) : null;
  if (!handle) return fail("profile");

  const res = NextResponse.redirect(`${config.appUrl}/account`);
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/auth/x" });
  res.cookies.set(SESSION_COOKIE, sign({ handle, exp: Date.now() + SESSION_TTL_MS }, config.sessionSecret), {
    httpOnly: true,
    secure: config.appUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}
