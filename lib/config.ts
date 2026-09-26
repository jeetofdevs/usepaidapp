function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number, got "${raw}"`);
  return n;
}

export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Feeroute",
  databasePath: process.env.DATABASE_PATH || "./data/feeroute.db",
  cronSecret: process.env.CRON_SECRET || "",
  recipientShareBps: num("RECIPIENT_SHARE_BPS", 8000),
  payoutMilestoneUsd: num("PAYOUT_MILESTONE_USD", 10),
  feeSource: (process.env.FEE_SOURCE || "mock") as "mock" | "longxyz",
  payoutProvider: (process.env.PAYOUT_PROVIDER || "manual") as "manual",
  long: {
    rpcUrl: process.env.LONG_RPC_URL || "",
    chainId: num("LONG_CHAIN_ID", 0),
    treasury: process.env.TREASURY_ADDRESS || "",
    privateKey: process.env.TREASURY_PRIVATE_KEY || "",
    feeContract: process.env.LONG_FEE_CONTRACT || "",
    launchEvent: process.env.LONG_LAUNCH_EVENT || "",
    claimableFn: process.env.LONG_CLAIMABLE_FN || "",
    claimFn: process.env.LONG_CLAIM_FN || "",
    fromBlock: BigInt(process.env.LONG_FROM_BLOCK || "0"),
    feeAssetDecimals: num("LONG_FEE_ASSET_DECIMALS", 18),
    feeAssetUsd: num("LONG_FEE_ASSET_USD", 1),
  },
};
