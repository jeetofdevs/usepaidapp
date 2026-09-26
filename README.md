# Feeroute

Route the creator fees of [long.xyz](https://long.xyz) tokens to any X account, paid in dollars.

A token launched on long.xyz names the Feeroute treasury as its creator-fee beneficiary and puts an X handle in its
metadata. Feeroute claims the fees on-chain, credits **80%** to that X account and uses **20%** to buy back and burn.
When an account's balance reaches the payout milestone ($10 by default), the balance is queued as a payout.

Feeroute is an independent project. It is not affiliated with long.xyz, X, or UsePaid.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript
- SQLite through Node's built-in `node:sqlite` (Node 22.13 or later)
- viem for on-chain reads and claims

## Quick start

```bash
npm install
cp .env.example .env.local
npm run seed      # demo data from the mock launchpad
npm run dev       # http://localhost:3000
npm test
```

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Live totals (refresh every 15s), fees-per-day chart, how it works, recent claims, top tokens, lookup |
| `/launch` | Step-by-step launch guide: copy the treasury address, build the metadata for a handle |
| `/check` | Eligibility checker: is this token set up, does it have a handle, has it been picked up |
| `/account` | Sign in with X to see your earnings and opt out (or back in) yourself |
| `/profile/:handle` | X profile picture, earnings by token, balance, distance to next payout, payouts, claims |
| `/token/:address` | A token's fees, split, and claim history |
| `/leaderboard` | Top accounts and tokens |
| `/docs` | Launch format, fee split, payouts, opt-out, API |

## How it's built

```
lib/
  money.ts          integer micro-dollar math and the 80/20 split
  handle.ts         reads the X handle from token metadata
  db.ts             SQLite schema
  ledger.ts         records claims, queues and settles payouts, opt-out
  claimer.ts        one cycle: discover tokens, then claim, then send payouts
  sources/
    types.ts        FeeSource interface
    mock.ts         fake launchpad for development
    longxyz.ts      long.xyz on-chain source (viem)
  payouts/
    manual.ts       queues payouts for an operator to settle
```

Run a claim cycle from cron with either:

```bash
npm run claim
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-host/api/cron/claim
```

## Before going live

1. **Check the long.xyz contracts.** `lib/sources/longxyz.ts` is generic: the fee contract address, the launch event,
   and the `claimable` / `claim` function signatures come from `.env` (`LONG_*`). The defaults in `.env.example` are
   placeholders. Replace them with the contracts long.xyz has actually deployed, and test against a fork first.
2. **Price the fee asset.** `LONG_FEE_ASSET_USD` is a fixed price. If fees are paid in a stock token or ETH, swap in a
   live price oracle.
3. **Payouts.** `ManualPayoutProvider` only queues payouts. An operator sends them and marks each one with
   `POST /api/admin/payouts`. To automate this, implement `PayoutProvider` for your payment rail.
4. **Buyback and burn.** Burns are recorded as `pending` in the `burns` table. The swap and burn transaction isn't
   automated yet.
5. **Sign in with X.** Create an OAuth 2.0 app at developer.x.com, set its callback to `$APP_URL/auth/x/callback`,
   and fill in `X_CLIENT_ID`, `X_CLIENT_SECRET` and `SESSION_SECRET`. Without them, `/account` explains that sign-in
   isn't set up. The sign-in flow hasn't been tested against X yet.
6. **Metadata lookups in `/check`.** Set `LONG_TOKEN_URI_FN` to the function long.xyz tokens use for their metadata URI.
7. **Secrets.** Keep `TREASURY_PRIVATE_KEY` in a secrets manager and set a long random `CRON_SECRET`.
