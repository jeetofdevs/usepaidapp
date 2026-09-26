import type { Db } from "./db.ts";

export type Stats = { claimedMicros: number; paidMicros: number; burnedMicros: number; tokens: number; accounts: number };

export function getStats(db: Db): Stats {
  const c = db.prepare("SELECT COALESCE(SUM(amount_micros),0) AS claimed, COALESCE(SUM(burn_micros),0) AS burned FROM claims").get() as {
    claimed: number;
    burned: number;
  };
  const p = db.prepare("SELECT COALESCE(SUM(amount_micros),0) AS paid FROM payouts WHERE status = 'paid'").get() as { paid: number };
  const t = db.prepare("SELECT COUNT(*) AS n FROM tokens").get() as { n: number };
  const a = db.prepare("SELECT COUNT(*) AS n FROM accounts WHERE lifetime_micros > 0").get() as { n: number };
  return { claimedMicros: c.claimed, paidMicros: p.paid, burnedMicros: c.burned, tokens: t.n, accounts: a.n };
}

export type TokenRow = {
  address: string;
  chain_id: number;
  name: string;
  symbol: string;
  image: string | null;
  handle: string;
  creator: string | null;
  launched_at: number;
  fees_micros: number;
};

export function listTokens(
  db: Db,
  opts: { limit?: number; sort?: "fees" | "new"; q?: string; handle?: string } = {},
): TokenRow[] {
  const order = opts.sort === "new" ? "launched_at DESC" : "fees_micros DESC, launched_at DESC";
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  if (opts.handle) {
    return db.prepare(`SELECT * FROM tokens WHERE handle = ? ORDER BY ${order} LIMIT ?`).all(opts.handle, limit) as TokenRow[];
  }
  if (opts.q) {
    const like = `%${opts.q.toLowerCase()}%`;
    return db
      .prepare(
        `SELECT * FROM tokens WHERE lower(name) LIKE ? OR lower(symbol) LIKE ? OR handle LIKE ? OR address LIKE ?
         ORDER BY ${order} LIMIT ?`,
      )
      .all(like, like, like, like, limit) as TokenRow[];
  }
  return db.prepare(`SELECT * FROM tokens ORDER BY ${order} LIMIT ?`).all(limit) as TokenRow[];
}

export function getToken(db: Db, address: string): TokenRow | null {
  return (db.prepare("SELECT * FROM tokens WHERE address = ?").get(address.toLowerCase()) as TokenRow | undefined) ?? null;
}

export function tokenTotals(db: Db, address: string) {
  return db
    .prepare(
      `SELECT COUNT(*) AS claims, COALESCE(SUM(recipient_micros),0) AS recipient, COALESCE(SUM(burn_micros),0) AS burn
       FROM claims WHERE token = ?`,
    )
    .get(address.toLowerCase()) as { claims: number; recipient: number; burn: number };
}

export type AccountRow = {
  handle: string;
  balance_micros: number;
  lifetime_micros: number;
  paid_micros: number;
  opted_out: number;
  created_at: number;
};

export function getAccount(db: Db, handle: string): AccountRow | null {
  return (db.prepare("SELECT * FROM accounts WHERE handle = ?").get(handle) as AccountRow | undefined) ?? null;
}

export function topAccounts(db: Db, limit = 25): AccountRow[] {
  return db
    .prepare("SELECT * FROM accounts WHERE lifetime_micros > 0 ORDER BY lifetime_micros DESC LIMIT ?")
    .all(limit) as AccountRow[];
}

export type ClaimRow = {
  id: number;
  token: string;
  handle: string;
  amount_micros: number;
  recipient_micros: number;
  burn_micros: number;
  tx_hash: string | null;
  created_at: number;
  symbol: string;
};

export function recentClaims(db: Db, opts: { handle?: string; token?: string; limit?: number } = {}): ClaimRow[] {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.handle) {
    where.push("c.handle = ?");
    args.push(opts.handle);
  }
  if (opts.token) {
    where.push("c.token = ?");
    args.push(opts.token.toLowerCase());
  }
  args.push(opts.limit ?? 20);
  return db
    .prepare(
      `SELECT c.*, t.symbol FROM claims c JOIN tokens t ON t.address = c.token
       ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY c.created_at DESC, c.id DESC LIMIT ?`,
    )
    .all(...args) as ClaimRow[];
}

export type PayoutRow = {
  id: number;
  handle: string;
  amount_micros: number;
  status: "queued" | "paid" | "failed";
  provider_ref: string | null;
  created_at: number;
  settled_at: number | null;
};

export function listPayouts(db: Db, opts: { handle?: string; status?: PayoutRow["status"]; limit?: number } = {}): PayoutRow[] {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.handle) {
    where.push("handle = ?");
    args.push(opts.handle);
  }
  if (opts.status) {
    where.push("status = ?");
    args.push(opts.status);
  }
  args.push(opts.limit ?? 50);
  return db
    .prepare(`SELECT * FROM payouts ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC LIMIT ?`)
    .all(...args) as PayoutRow[];
}
