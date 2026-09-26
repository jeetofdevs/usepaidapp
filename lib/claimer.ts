import { type Db, getKv, setKv } from "./db.ts";
import { type LedgerOptions, recordClaim, settlePayout, upsertToken } from "./ledger.ts";
import { listPayouts, listTokens } from "./queries.ts";
import type { FeeSource } from "./sources/types.ts";
import type { PayoutProvider } from "./payouts/types.ts";

export type CycleReport = {
  discovered: number;
  claimed: { token: string; amountMicros: number; txHash: string | null }[];
  payoutsQueued: number;
  payoutsSent: number;
  errors: { token?: string; payout?: number; message: string }[];
};

const CURSOR_KEY = "source_cursor";

/** One full pass: find new tokens, claim their fees, then try to send queued payouts. */
export async function runClaimCycle(db: Db, source: FeeSource, payouts: PayoutProvider, opts: LedgerOptions): Promise<CycleReport> {
  const report: CycleReport = { discovered: 0, claimed: [], payoutsQueued: 0, payoutsSent: 0, errors: [] };

  const { tokens, cursor } = await source.discoverTokens(getKv(db, CURSOR_KEY));
  for (const t of tokens) upsertToken(db, t);
  if (cursor !== null) setKv(db, CURSOR_KEY, cursor);
  report.discovered = tokens.length;

  for (const token of listTokens(db, { limit: 200, sort: "new" })) {
    try {
      const { amountMicros, txHash } = await source.claim(token.address);
      if (amountMicros <= 0) continue;
      const { payoutId } = recordClaim(db, opts, token.address, amountMicros, txHash);
      report.claimed.push({ token: token.address, amountMicros, txHash });
      if (payoutId !== null) report.payoutsQueued++;
    } catch (e) {
      report.errors.push({ token: token.address, message: (e as Error).message });
    }
  }

  for (const p of listPayouts(db, { status: "queued", limit: 200 })) {
    try {
      const result = await payouts.send({ id: p.id, handle: p.handle, amountMicros: p.amount_micros });
      if (result === null) continue;
      settlePayout(db, p.id, result);
      if (result.ok) report.payoutsSent++;
    } catch (e) {
      report.errors.push({ payout: p.id, message: (e as Error).message });
    }
  }

  return report;
}
