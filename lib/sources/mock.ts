import type { FeeSource } from "./types.ts";
import type { TokenRecord } from "../ledger.ts";

/** Deterministic fake launchpad for local development and tests. */
export class MockFeeSource implements FeeSource {
  private tokens: TokenRecord[];
  private rng: () => number;

  constructor(tokens: TokenRecord[], seed = 42) {
    this.tokens = tokens;
    let s = seed >>> 0;
    this.rng = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 2 ** 32;
    };
  }

  async discoverTokens(sinceCursor: string | null) {
    const from = sinceCursor ? Number(sinceCursor) : 0;
    return { tokens: this.tokens.slice(from), cursor: String(this.tokens.length) };
  }

  async inspect(tokenAddress: string) {
    const t = this.tokens.find((x) => x.address.toLowerCase() === tokenAddress.toLowerCase());
    if (!t) return { exists: false, name: null, symbol: null, handle: null, routesToTreasury: false, pendingMicros: null };
    return { exists: true, name: t.name, symbol: t.symbol, handle: t.handle, routesToTreasury: true, pendingMicros: 12_340_000 };
  }

  async claim(_tokenAddress: string) {
    // Between $0 and $40 per cycle.
    const amountMicros = Math.floor(this.rng() * 40_000_000);
    const hex = Array.from({ length: 64 }, () => Math.floor(this.rng() * 16).toString(16)).join("");
    return { amountMicros, txHash: `0x${hex}` };
  }
}
