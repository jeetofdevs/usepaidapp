import { config } from "@/lib/config.ts";
import { formatUsd } from "@/lib/money.ts";

export const dynamic = "force-dynamic";

export default function Docs() {
  const share = config.recipientShareBps / 100;
  const treasury = config.long.treasury || "<treasury address>";
  return (
    <div className="docs">
      <h1>Docs</h1>
      <p className="muted">How {config.appName} routes long.xyz creator fees to X accounts.</p>

      <h2 id="overview">Overview</h2>
      <p>
        Tokens launched on long.xyz earn creator fees from trading. When a token names the {config.appName} treasury as its
        creator-fee beneficiary, we claim those fees on-chain and credit them to the X account in the token's metadata. The
        account owner doesn't need a wallet or a sign-up.
      </p>

      <h2 id="launch">Launching a token</h2>
      <ol>
        <li>
          Create the token on long.xyz as usual and set the creator-fee beneficiary to:
          <pre>{treasury}</pre>
        </li>
        <li>
          Put the X handle in the token metadata. We check these fields in order: <code>feeRecipient</code>, <code>x</code>,{" "}
          <code>twitter</code>. Values like <code>@alice</code> and <code>https://x.com/alice</code> both work.
          <pre>{`{
  "name": "Moon Nvidia",
  "symbol": "MOON",
  "description": "gm",
  "feeRecipient": "@alice"
}`}</pre>
          If the launch form only has a description, write <code>fees to @alice</code> in it.
        </li>
        <li>The token appears on the site after the next claim cycle.</li>
      </ol>

      <h2 id="split">Fee split</h2>
      <ul>
        <li>
          <strong>{share}%</strong> is credited to the X account.
        </li>
        <li>
          <strong>{100 - share}%</strong> buys back and burns the protocol token. Rounding dust also goes to the burn.
        </li>
      </ul>

      <h2 id="payouts">Payouts</h2>
      <p>
        When an account's balance reaches {formatUsd(config.payoutMilestoneUsd * 1_000_000)}, the whole balance is queued as a
        payout in dollars. If a payout fails (for example, the account can't receive money yet), the amount goes back to the
        balance and is retried at the next milestone.
      </p>

      <h2 id="opt-out">Opting out</h2>
      <p>
        Anyone can put any handle in token metadata, so account owners can opt out. After that, no money is credited to them:
        fees from tokens naming their handle are burned in full. To opt out, sign in with X on the{" "}
        <a href="/account">account page</a>.
      </p>

      <h2 id="api">API</h2>
      <pre>{`GET  /api/stats                     totals
GET  /api/tokens?sort=fees|new&q=   tokens routing fees
GET  /api/profile/:handle           account, tokens, payouts, claims

# Operator endpoints (Authorization: Bearer $CRON_SECRET)
POST /api/cron/claim                run one claim cycle
GET  /api/admin/payouts?status=queued
POST /api/admin/payouts             {"id": 1, "ok": true, "ref": "x-money-ref"}
POST /api/admin/opt-out             {"handle": "alice", "optedOut": true}`}</pre>
    </div>
  );
}
