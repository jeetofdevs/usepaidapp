import type { TokenRecord } from "./ledger.ts";

const DAY = 86_400_000;
const base = Date.UTC(2026, 8, 1);

function addr(n: number): string {
  return "0x" + n.toString(16).padStart(40, "0");
}

/** Sample tokens used by the mock fee source and the seed script. */
export const DEMO_TOKENS: TokenRecord[] = [
  ["Moon Nvidia", "MOON", "moonwhale"],
  ["Apple Pie", "PIE", "piebaker"],
  ["Tesla Frog", "TFROG", "frogdev"],
  ["Micron Cat", "MCAT", "catmaxi"],
  ["Search Dog", "SDOG", "moonwhale"],
  ["Rocket Soft", "RSOFT", "buildooor"],
  ["Chip Chad", "CHAD", "chadchips"],
  ["Orbit Bull", "ORBIT", "spacebull"],
].map(([name, symbol, handle], i) => ({
  address: addr(0x10ce + i),
  chainId: 0,
  name,
  symbol,
  image: null,
  handle,
  creator: addr(0xc0de + i),
  launchedAt: base + i * 2 * DAY,
}));
