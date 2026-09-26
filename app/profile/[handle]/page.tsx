import { notFound } from "next/navigation";
import { config } from "@/lib/config.ts";
import { normalizeHandle } from "@/lib/handle.ts";
import { formatUsd } from "@/lib/money.ts";
import { getAccount, listPayouts, listTokens, recentClaims } from "@/lib/queries.ts";
import { db } from "@/lib/server.ts";
import { ClaimsTable, PayoutsTable, TokensTable } from "@/components/Tables.tsx";

export const dynamic = "force-dynamic";

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const handle = normalizeHandle(decodeURIComponent((await params).handle));
  if (!handle) notFound();

  const d = db();
  const account = getAccount(d, handle);
  const tokens = listTokens(d, { handle, limit: 200 });
  const toMilestone = Math.max(0, config.payoutMilestoneUsd * 1_000_000 - (account?.balance_micros ?? 0));

  return (
    <>
      <div className="profile-head">
        <div className="avatar">{handle[0].toUpperCase()}</div>
        <div>
          <h1>@{handle}</h1>
          <a className="muted" href={`https://x.com/${handle}`} target="_blank" rel="noreferrer">
            x.com/{handle}
          </a>
        </div>
      </div>

      {account?.opted_out ? (
        <p className="notice">This account opted out. Fees from its tokens are burned instead of paid out.</p>
      ) : null}

      <div className="stats">
        <div className="stat">
          <div className="label">Lifetime earned</div>
          <div className="value">{formatUsd(account?.lifetime_micros ?? 0)}</div>
        </div>
        <div className="stat">
          <div className="label">Paid out</div>
          <div className="value">{formatUsd(account?.paid_micros ?? 0)}</div>
        </div>
        <div className="stat">
          <div className="label">Balance</div>
          <div className="value">{formatUsd(account?.balance_micros ?? 0)}</div>
        </div>
        <div className="stat">
          <div className="label">Until next payout</div>
          <div className="value">{formatUsd(toMilestone)}</div>
        </div>
      </div>

      {!account && (
        <p className="notice">
          No tokens route fees to @{handle} yet. Launch one on long.xyz with this handle in its metadata and it will show up
          here after the next claim cycle.
        </p>
      )}

      <section>
        <h2>Tokens</h2>
        <TokensTable rows={tokens} showHandle={false} />
      </section>
      <section>
        <h2>Payouts</h2>
        <PayoutsTable rows={listPayouts(d, { handle, limit: 20 })} />
      </section>
      <section>
        <h2>Claims</h2>
        <ClaimsTable rows={recentClaims(d, { handle, limit: 20 })} showHandle={false} />
      </section>
    </>
  );
}
