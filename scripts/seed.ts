// Fills the database with demo tokens, claims, and payouts from the mock launchpad.
import { openDb } from "../lib/db.ts";
import { runClaimCycle } from "../lib/claimer.ts";
import { settlePayout } from "../lib/ledger.ts";
import { listPayouts } from "../lib/queries.ts";
import { MockFeeSource } from "../lib/sources/mock.ts";
import { ManualPayoutProvider } from "../lib/payouts/manual.ts";
import { DEMO_TOKENS } from "../lib/demo.ts";

const db = openDb(process.env.DATABASE_PATH || "./data/feeroute.db");
const source = new MockFeeSource(DEMO_TOKENS, 7);
const opts = { recipientShareBps: 8000, payoutMilestoneMicros: 10_000_000 };

for (let i = 0; i < 6; i++) {
  const r = await runClaimCycle(db, source, new ManualPayoutProvider(), opts);
  console.log(`cycle ${i + 1}: ${r.claimed.length} claims, ${r.payoutsQueued} payouts queued`);
}

// Mark the older half of the queued payouts as paid so the pages show both states.
const queued = listPayouts(db, { status: "queued", limit: 500 });
for (const p of queued.slice(Math.floor(queued.length / 2))) {
  settlePayout(db, p.id, { ok: true, ref: `demo-${p.id}` });
}
console.log("seeded", db.prepare("SELECT COUNT(*) AS n FROM claims").get());
