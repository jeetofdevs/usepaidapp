"use client";

import { useEffect, useState } from "react";

type Stats = { claimedMicros: number; paidMicros: number; burnedMicros: number; tokens: number; accounts: number };

function usd(micros: number) {
  return (micros / 1_000_000).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Headline totals that refresh every 15 seconds. */
export function LiveStats({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState(initial);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (res.ok && !stop) {
          setStats(await res.json());
          setLive(true);
        }
      } catch {
        if (!stop) setLive(false);
      }
    };
    const id = setInterval(tick, 15_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="label">Fees claimed</div>
          <div className="value">{usd(stats.claimedMicros)}</div>
        </div>
        <div className="stat">
          <div className="label">Paid to X accounts</div>
          <div className="value">{usd(stats.paidMicros)}</div>
        </div>
        <div className="stat">
          <div className="label">Bought back and burned</div>
          <div className="value">{usd(stats.burnedMicros)}</div>
        </div>
        <div className="stat">
          <div className="label">Tokens routing fees</div>
          <div className="value">{stats.tokens}</div>
        </div>
      </div>
      <div className="live">
        <span className={live ? "pulse on" : "pulse"} /> Updates every 15 seconds
      </div>
    </>
  );
}
