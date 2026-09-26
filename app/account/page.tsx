import Link from "next/link";
import { currentSession, xLoginEnabled } from "@/lib/auth.ts";
import { formatUsd } from "@/lib/money.ts";
import { getAccount, listTokens } from "@/lib/queries.ts";
import { db } from "@/lib/server.ts";
import { Avatar } from "@/components/Avatar.tsx";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  disabled: "Sign in with X isn't set up on this server yet.",
  state: "The sign-in link expired or was already used. Try again.",
  token: "X didn't accept the sign-in. Try again.",
  profile: "We couldn't read your X username. Try again.",
};

export default async function Account({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const session = await currentSession();

  if (!session) {
    return (
      <div className="docs">
        <h1>Your account</h1>
        <p className="muted">
          Sign in with X to see what your handle has earned and to choose whether tokens can send fees to it.
        </p>
        {error && <p className="notice error">{ERRORS[error] ?? "Sign-in failed. Try again."}</p>}
        {xLoginEnabled() ? (
          <a className="btn" href="/auth/x">
            Sign in with X
          </a>
        ) : (
          <p className="notice">Sign in with X isn't set up on this server yet. The operator needs to add X_CLIENT_ID, X_CLIENT_SECRET and SESSION_SECRET.</p>
        )}
        <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>
          We only read your username. We never post for you.
        </p>
      </div>
    );
  }

  const d = db();
  const account = getAccount(d, session.handle);
  const tokens = listTokens(d, { handle: session.handle, limit: 200 });
  const optedOut = Boolean(account?.opted_out);

  return (
    <div className="docs">
      <div className="profile-head" style={{ paddingTop: 48 }}>
        <Avatar handle={session.handle} />
        <div>
          <h1 style={{ margin: 0 }}>@{session.handle}</h1>
          <Link className="muted" href={`/profile/${session.handle}`}>
            View public profile
          </Link>
        </div>
      </div>
      {saved && <p className="notice ok">Saved.</p>}

      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat">
          <div className="label">Earned</div>
          <div className="value">{formatUsd(account?.lifetime_micros ?? 0)}</div>
        </div>
        <div className="stat">
          <div className="label">Paid out</div>
          <div className="value">{formatUsd(account?.paid_micros ?? 0)}</div>
        </div>
        <div className="stat">
          <div className="label">Tokens</div>
          <div className="value">{tokens.length}</div>
        </div>
      </div>

      <h2>Fees from tokens</h2>
      <p>
        {optedOut
          ? "You've opted out. Fees from tokens that name your handle are burned in full, and nothing is credited to you."
          : "Tokens that name your handle send you their creator fees. If you don't want to be linked to these tokens, opt out. After that, their fees are burned instead."}
      </p>
      <form action="/api/account/opt-out" method="post">
        <input type="hidden" name="optedOut" value={optedOut ? "0" : "1"} />
        <button className={optedOut ? "btn" : "btn btn-danger"} type="submit">
          {optedOut ? "Opt back in" : "Opt out"}
        </button>
      </form>

      <form action="/auth/logout" method="post" style={{ marginTop: 40 }}>
        <button className="btn btn-ghost" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
