// Runs one claim cycle against the configured fee source. Suitable for a cron job.
import { config } from "../lib/config.ts";
import { openDb } from "../lib/db.ts";
import { runClaimCycle } from "../lib/claimer.ts";
import { MockFeeSource } from "../lib/sources/mock.ts";
import { LongXyzFeeSource } from "../lib/sources/longxyz.ts";
import { ManualPayoutProvider } from "../lib/payouts/manual.ts";
import { WebhookPayoutProvider } from "../lib/payouts/webhook.ts";
import { DEMO_TOKENS } from "../lib/demo.ts";

const db = openDb(config.databasePath);
const source = config.feeSource === "longxyz" ? new LongXyzFeeSource(config.long) : new MockFeeSource(DEMO_TOKENS, Date.now() & 0xffff);
const payouts =
  config.payoutProvider === "webhook"
    ? new WebhookPayoutProvider(config.payoutWebhookUrl, config.payoutWebhookSecret)
    : new ManualPayoutProvider();
const report = await runClaimCycle(db, source, payouts, {
  recipientShareBps: config.recipientShareBps,
  milestones: config.milestones,
});
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
