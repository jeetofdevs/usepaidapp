import "server-only";
import { config } from "./config.ts";
import { type Db, openDb } from "./db.ts";
import type { LedgerOptions } from "./ledger.ts";
import { MockFeeSource } from "./sources/mock.ts";
import { LongXyzFeeSource } from "./sources/longxyz.ts";
import type { FeeSource } from "./sources/types.ts";
import { ManualPayoutProvider } from "./payouts/manual.ts";
import { WebhookPayoutProvider } from "./payouts/webhook.ts";
import type { PayoutProvider } from "./payouts/types.ts";
import { DEMO_TOKENS } from "./demo.ts";

const g = globalThis as unknown as { __db?: Db };

export function db(): Db {
  g.__db ??= openDb(config.databasePath);
  return g.__db;
}

export function ledgerOptions(): LedgerOptions {
  return { recipientShareBps: config.recipientShareBps, milestones: config.milestones };
}

export function feeSource(): FeeSource {
  if (config.feeSource === "longxyz") return new LongXyzFeeSource(config.long);
  return new MockFeeSource(DEMO_TOKENS, Date.now() & 0xffff);
}

export function payoutProvider(): PayoutProvider {
  if (config.payoutProvider === "webhook") {
    return new WebhookPayoutProvider(config.payoutWebhookUrl, config.payoutWebhookSecret);
  }
  return new ManualPayoutProvider();
}

/** Constant-time check of a bearer token against CRON_SECRET. */
export function authorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (given.length !== config.cronSecret.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ config.cronSecret.charCodeAt(i);
  return diff === 0;
}
