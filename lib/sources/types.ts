import type { TokenRecord } from "../ledger.ts";

/** Where fees come from. One implementation per launchpad (or a mock for development). */
export interface FeeSource {
  /** Tokens launched since the last sync that name our treasury as fee beneficiary and carry an X handle. */
  discoverTokens(sinceCursor: string | null): Promise<{ tokens: TokenRecord[]; cursor: string | null }>;
  /** Claims pending fees for a token and returns the USD value claimed, in micro-dollars. */
  claim(tokenAddress: string): Promise<{ amountMicros: number; txHash: string | null }>;
}
