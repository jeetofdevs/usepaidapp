import Link from "next/link";
import { formatUsd } from "@/lib/money.ts";
import type { ClaimRow, PayoutRow, TokenRow } from "@/lib/queries.ts";

export function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function timeAgo(ms: number) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ClaimsTable({ rows, showHandle = true }: { rows: ClaimRow[]; showHandle?: boolean }) {
  if (!rows.length) return <div className="empty">No claims yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Token</th>
            {showHandle && <th>Paid to</th>}
            <th className="num">Claimed</th>
            <th className="num">To account</th>
            <th className="num">Burned</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/token/${c.token}`}>${c.symbol}</Link>
              </td>
              {showHandle && (
                <td>
                  <Link href={`/profile/${c.handle}`}>@{c.handle}</Link>
                </td>
              )}
              <td className="num">{formatUsd(c.amount_micros)}</td>
              <td className="num">{formatUsd(c.recipient_micros)}</td>
              <td className="num muted">{formatUsd(c.burn_micros)}</td>
              <td className="muted">{timeAgo(c.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TokensTable({ rows, showHandle = true }: { rows: TokenRow[]; showHandle?: boolean }) {
  if (!rows.length) return <div className="empty">No tokens yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Address</th>
            {showHandle && <th>Fees go to</th>}
            <th className="num">Fees claimed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.address}>
              <td>
                <Link href={`/token/${t.address}`}>
                  <strong>${t.symbol}</strong> <span className="muted">{t.name}</span>
                </Link>
              </td>
              <td className="mono muted">{shortAddr(t.address)}</td>
              {showHandle && (
                <td>
                  <Link href={`/profile/${t.handle}`}>@{t.handle}</Link>
                </td>
              )}
              <td className="num">{formatUsd(t.fees_micros)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PayoutsTable({ rows }: { rows: PayoutRow[] }) {
  if (!rows.length) return <div className="empty">No payouts yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th className="num">Amount</th>
            <th>Status</th>
            <th>Queued</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="mono muted">{p.id}</td>
              <td className="num">{formatUsd(p.amount_micros)}</td>
              <td>
                <span className={`pill ${p.status}`}>{p.status}</span>
              </td>
              <td className="muted">{timeAgo(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
