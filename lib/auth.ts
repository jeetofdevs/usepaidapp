import "server-only";
import { cookies } from "next/headers";
import { config } from "./config.ts";
import { SESSION_COOKIE, type Session, verify } from "./session.ts";

export function xLoginEnabled(): boolean {
  return Boolean(config.xClientId && config.xClientSecret && config.sessionSecret);
}

export async function currentSession(): Promise<Session | null> {
  const jar = await cookies();
  return verify<Session>(jar.get(SESSION_COOKIE)?.value, config.sessionSecret);
}

/** Rejects cross-site form posts: the Origin header must match APP_URL when present. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  return origin === null || origin === config.appUrl;
}
