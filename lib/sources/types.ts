import type { TokenRecord } from "../ledger.ts";

export type Inspection = {
  /** The address is a token contract we could read. */
  exists: boolean;
  name: string | null;
  symbol: string | null;
  /** X handle found in the token metadata, if any. */
  handle: string | null;
  /** Creator fees for this token are claimable by our treasury. */
  routesToTreasury: boolean;
  /** Fees waiting to be claimed, in micro-dollars (null when unknown). */
  pendingMicros: number | null;
};

/** Where fees come from. One implementation per launchpad (or a mock for development). */
export interface FeeSource {
  /** Tokens launched since the last sync that name our treasury as fee beneficiary and carry an X handle. */
  discoverTokens(sinceCursor: string | null): Promise<{ tokens: TokenRecord[]; cursor: string | null }>;
  /** Claims pending fees for a token and returns the USD value claimed, in micro-dollars. */
  /** Reads a token's current setup without changing anything. Used by the eligibility checker. */
  inspect(tokenAddress: string): Promise<Inspection>;
  claim(tokenAddress: string): Promise<{ amountMicros: number; txHash: string | null }>;
}
