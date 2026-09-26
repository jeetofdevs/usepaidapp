// Payouts happen when an account's lifetime earnings cross a milestone.
// Each crossing sends the account's full unpaid balance.

export type Milestones = {
  /** Ascending thresholds in micro-dollars, e.g. $5, $10, $20 … $1,000. */
  list: number[];
  /** After the last listed threshold, a new milestone every `stepMicros`. */
  stepMicros: number;
};

export const DEFAULT_MILESTONES_USD = [5, 10, 20, 50, 100, 250, 500, 1000];
export const DEFAULT_STEP_USD = 1000;

export function parseMilestones(listUsd: string | undefined, stepUsd: string | undefined): Milestones {
  const list = (listUsd ? listUsd.split(",").map(Number) : DEFAULT_MILESTONES_USD).map((n) => Math.round(n * 1_000_000));
  const stepMicros = Math.round((stepUsd ? Number(stepUsd) : DEFAULT_STEP_USD) * 1_000_000);
  if (!list.length || list.some((n, i) => !Number.isFinite(n) || n <= 0 || (i > 0 && n <= list[i - 1]))) {
    throw new Error("PAYOUT_MILESTONES_USD must be ascending positive numbers");
  }
  if (!Number.isFinite(stepMicros) || stepMicros <= 0) throw new Error("PAYOUT_MILESTONE_STEP_USD must be positive");
  return { list, stepMicros };
}

/** The first milestone strictly above `reachedMicros`. */
export function nextMilestone(reachedMicros: number, m: Milestones): number {
  for (const t of m.list) if (t > reachedMicros) return t;
  const last = m.list[m.list.length - 1];
  return last + (Math.floor((reachedMicros - last) / m.stepMicros) + 1) * m.stepMicros;
}

/** The highest milestone at or below `lifetimeMicros`, or 0 if none is reached yet. */
export function highestReached(lifetimeMicros: number, m: Milestones): number {
  if (lifetimeMicros < m.list[0]) return 0;
  const last = m.list[m.list.length - 1];
  if (lifetimeMicros < last) return [...m.list].reverse().find((t) => t <= lifetimeMicros)!;
  return last + Math.floor((lifetimeMicros - last) / m.stepMicros) * m.stepMicros;
}

/** "$5, $10, $20 … and every $1,000 after" */
export function describeMilestones(m: Milestones): string {
  const usd = (micros: number) => "$" + (micros / 1_000_000).toLocaleString("en-US");
  return `${m.list.map(usd).join(", ")}, then every ${usd(m.stepMicros)}`;
}
