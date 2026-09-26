import {
  createPublicClient,
  createWalletClient,
  defineChain,
  getAddress,
  http,
  parseAbi,
  parseAbiItem,
  type AbiEvent,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { FeeSource } from "./types.ts";
import type { TokenRecord } from "../ledger.ts";
import { handleFromMetadata, type TokenMetadata } from "../handle.ts";
import { tokenAmountToMicros } from "../money.ts";

export type LongXyzConfig = {
  rpcUrl: string;
  chainId: number;
  treasury: string;
  privateKey: string;
  feeContract: string;
  launchEvent: string;
  claimableFn: string;
  claimFn: string;
  fromBlock: bigint;
  feeAssetDecimals: number;
  feeAssetUsd: number;
};

const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
]);
const LOG_CHUNK = 5_000n;
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/";

/**
 * Reads tokens and creator fees from long.xyz contracts.
 *
 * The contract address and ABI signatures come from config, because they must match
 * the contracts long.xyz has deployed. The launch event must expose `token` (address)
 * and `tokenURI` (string) arguments; `creator` is optional.
 */
export class LongXyzFeeSource implements FeeSource {
  private cfg: LongXyzConfig;
  private pub;
  private wallet;
  private event: AbiEvent;
  private feeAbi;

  constructor(cfg: LongXyzConfig) {
    for (const k of ["rpcUrl", "treasury", "privateKey", "feeContract", "launchEvent", "claimableFn", "claimFn"] as const) {
      if (!cfg[k]) throw new Error(`long.xyz source: missing config ${k}`);
    }
    if (!cfg.chainId) throw new Error("long.xyz source: missing config chainId");
    this.cfg = cfg;
    const chain = defineChain({
      id: cfg.chainId,
      name: "long.xyz chain",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [cfg.rpcUrl] } },
    });
    this.pub = createPublicClient({ chain, transport: http(cfg.rpcUrl) });
    const account = privateKeyToAccount(cfg.privateKey as `0x${string}`);
    if (account.address.toLowerCase() !== cfg.treasury.toLowerCase()) {
      throw new Error("TREASURY_PRIVATE_KEY does not match TREASURY_ADDRESS");
    }
    this.wallet = createWalletClient({ chain, account, transport: http(cfg.rpcUrl) });
    this.event = parseAbiItem(cfg.launchEvent) as AbiEvent;
    this.feeAbi = parseAbi([cfg.claimableFn, cfg.claimFn]);
  }

  private fn(sig: string): string {
    const m = sig.match(/function\s+(\w+)/);
    if (!m) throw new Error(`bad function signature: ${sig}`);
    return m[1];
  }

  async discoverTokens(sinceCursor: string | null) {
    const latest = await this.pub.getBlockNumber();
    let from = sinceCursor ? BigInt(sinceCursor) + 1n : this.cfg.fromBlock;
    const tokens: TokenRecord[] = [];

    while (from <= latest) {
      const to = from + LOG_CHUNK - 1n > latest ? latest : from + LOG_CHUNK - 1n;
      const logs = await this.pub.getLogs({ event: this.event, fromBlock: from, toBlock: to });
      for (const log of logs) {
        const args = (log as unknown as { args: Record<string, unknown> }).args;
        const token = args.token as Address | undefined;
        if (!token) continue;
        const rec = await this.toRecord(token, args, log.blockNumber ?? to);
        if (rec) tokens.push(rec);
      }
      from = to + 1n;
    }
    return { tokens, cursor: latest.toString() };
  }

  private async toRecord(token: Address, args: Record<string, unknown>, blockNumber: bigint): Promise<TokenRecord | null> {
    const meta = typeof args.tokenURI === "string" ? await fetchMetadata(args.tokenURI) : {};
    const handle = handleFromMetadata(meta);
    if (!handle) return null;

    // Skip tokens whose fees don't reach us: the claimable call must work for our treasury.
    try {
      await this.readClaimable(token);
    } catch {
      return null;
    }

    const [name, symbol] = await Promise.all([
      this.pub.readContract({ address: token, abi: ERC20_ABI, functionName: "name" }).catch(() => meta.name ?? "Unknown"),
      this.pub.readContract({ address: token, abi: ERC20_ABI, functionName: "symbol" }).catch(() => meta.symbol ?? "???"),
    ]);
    const block = await this.pub.getBlock({ blockNumber });
    return {
      address: getAddress(token),
      chainId: this.cfg.chainId,
      name: String(name),
      symbol: String(symbol),
      image: typeof meta.image === "string" ? resolveUri(meta.image) : null,
      handle,
      creator: typeof args.creator === "string" ? args.creator : null,
      launchedAt: Number(block.timestamp) * 1000,
    };
  }

  private readClaimable(token: Address): Promise<bigint> {
    return this.pub.readContract({
      address: this.cfg.feeContract as Address,
      abi: this.feeAbi,
      functionName: this.fn(this.cfg.claimableFn),
      args: [token, this.cfg.treasury as Address],
    } as never) as Promise<bigint>;
  }

  async claim(tokenAddress: string) {
    const token = getAddress(tokenAddress);
    const pending = await this.readClaimable(token);
    if (pending === 0n) return { amountMicros: 0, txHash: null };

    const { request } = await this.pub.simulateContract({
      address: this.cfg.feeContract as Address,
      abi: this.feeAbi,
      functionName: this.fn(this.cfg.claimFn),
      args: [token],
      account: this.wallet.account,
    } as never);
    const hash = await this.wallet.writeContract(request as never);
    const receipt = await this.pub.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`claim reverted: ${hash}`);

    return {
      amountMicros: tokenAmountToMicros(pending, this.cfg.feeAssetDecimals, this.cfg.feeAssetUsd),
      txHash: hash,
    };
  }
}

function resolveUri(uri: string): string {
  return uri.startsWith("ipfs://") ? IPFS_GATEWAY + uri.slice("ipfs://".length) : uri;
}

async function fetchMetadata(uri: string): Promise<TokenMetadata> {
  try {
    if (uri.startsWith("data:application/json")) {
      const body = uri.slice(uri.indexOf(",") + 1);
      const json = uri.includes(";base64,") ? Buffer.from(body, "base64").toString("utf8") : decodeURIComponent(body);
      return JSON.parse(json);
    }
    if (uri.trim().startsWith("{")) return JSON.parse(uri);
    const res = await fetch(resolveUri(uri), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return {};
    return (await res.json()) as TokenMetadata;
  } catch {
    return {};
  }
}
