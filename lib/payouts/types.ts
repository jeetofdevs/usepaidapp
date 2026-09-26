export type PayoutResult = { ok: true; ref: string } | { ok: false; reason: string };

/** Sends dollars to an X account. */
export interface PayoutProvider {
  readonly name: string;
  /** Returns null when the payout must be settled by hand (the manual provider). */
  send(payout: { id: number; handle: string; amountMicros: number }): Promise<PayoutResult | null>;
}
