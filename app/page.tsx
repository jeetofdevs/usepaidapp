import Link from "next/link";
import { config } from "@/lib/config.ts";
import { formatUsd } from "@/lib/money.ts";
import { getStats, listTokens, recentClaims } from "@/lib/queries.ts";
import { db } from "@/lib/server.ts";
import { ClaimsTable, TokensTable } from "@/components/Tables.tsx";
import { Lookup } from "@/components/Lookup.tsx";

export const dynamic = "force-dynamic";

export default function Home() {
  const d = db();
  const stats = getStats(d);
  const share = config.recipientShareBps / 100;

  return (
    <>
      <div className="hero">
        <h1>Send long.xyz token fees to any X account.</h1>
        <p className="lede">
          Launch a token on long.xyz with {config.appName} as its fee beneficiary and name an X handle. We claim the creator fees
          on-chain and pay {share}% of them out to that account in dollars. The other {100 - share}% buys back and burns.
        </p>
        <Lookup />
      </div>

      <div className="stats">
        <div className="stat">
          <div className="label">Fees claimed</div>
          <div className="value">{formatUsd(stats.claimedMicros)}</div>
        </div>
        <div className="stat">
          <div className="label">Paid to X accounts</div>
          <div className="value">{formatUsd(stats.paidMicros)}</div>
        </div>
        <div className="stat">
          <div className="label">Bought back and burned</div>
          <div className="value">{formatUsd(stats.burnedMicros)}</div>
        </div>
        <div className="stat">
          <div className="label">Tokens routing fees</div>
          <div className="value">{stats.tokens}</div>
        </div>
      </div>

      <section>
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="n">01</div>
            <h3>Launch on long.xyz</h3>
            <p>
              Set the creator-fee beneficiary to the {config.appName} treasury and put an X handle in the token metadata.{" "}
              <Link href="/docs#launch">See the format.</Link>
            </p>
          </div>
          <div className="step">
            <div className="n">02</div>
            <h3>We claim the fees</h3>
            <p>Every cycle, the claimer collects pending creator fees on-chain and credits them to that X account.</p>
          </div>
          <div className="step">
            <div className="n">03</div>
            <h3>Paid in dollars</h3>
            <p>
              Once the balance reaches {formatUsd(config.payoutMilestoneUsd * 1_000_000)}, it is paid out to the account. No wallet
              or sign-up needed.
            </p>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <div className="split" aria-hidden>
            <div className="a" style={{ width: `${share}%` }} />
            <div className="b" style={{ width: `${100 - share}%` }} />
          </div>
          <div className="legend">
            <span>
              <i style={{ background: "var(--accent)" }} />
              {share}% to the X account
            </span>
            <span>
              <i style={{ background: "var(--burn)" }} />
              {100 - share}% buyback and burn
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2>Recent claims</h2>
        <ClaimsTable rows={recentClaims(d, { limit: 10 })} />
      </section>

      <section>
        <h2>Top tokens</h2>
        <TokensTable rows={listTokens(d, { limit: 10 })} />
      </section>
    </>
  );
}
