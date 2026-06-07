// Server-only helpers to read CredLayer on-chain reputation accounts.
import { Connection } from "@solana/web3.js";
import {
  decodeReputationAccount,
  getReputationPda,
  type OnChainReputation,
} from "./credlayer-onchain";

function getRpcUrls(): string[] {
  const urls: string[] = [];
  // Highest priority: explicit server-side secret (e.g. Helius/QuickNode/Alchemy)
  const primary =
    process.env.SOLANA_RPC_URL ||
    process.env.HELIUS_RPC_URL ||
    process.env.QUICKNODE_RPC_URL ||
    process.env.VITE_SOLANA_RPC_URL;
  if (primary) urls.push(primary);

  // Public fallbacks. Note: api.devnet.solana.com blocks Cloudflare Worker IPs (HTTP 403).
  // Ankr's free devnet endpoint generally accepts Worker traffic.
  const network = (process.env.VITE_SOLANA_NETWORK ?? "devnet").toLowerCase();
  if (network === "devnet") {
    urls.push("https://rpc.ankr.com/solana_devnet");
    urls.push("https://api.devnet.solana.com");
  } else if (network === "testnet") {
    urls.push("https://api.testnet.solana.com");
  } else {
    urls.push("https://rpc.ankr.com/solana");
    urls.push("https://api.mainnet-beta.solana.com");
  }
  // De-dupe while preserving order
  return Array.from(new Set(urls));
}

async function withFallback<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const urls = getRpcUrls();
  let lastErr: unknown = null;
  for (const url of urls) {
    try {
      const conn = new Connection(url, "confirmed");
      return await fn(conn);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Only fall through on network/auth-style errors; otherwise rethrow.
      if (!/403|401|429|fetch|network|forbidden|blocked|timeout/i.test(msg)) {
        throw err;
      }
      console.warn(`[credlayer] RPC ${url} failed (${msg}); trying next…`);
    }
  }
  throw new Error(
    `All Solana RPC endpoints failed. Set the SOLANA_RPC_URL secret to a provider that allows server traffic (e.g. Helius, QuickNode, Alchemy). Last error: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  );
}

export async function fetchOnChainReputation(
  walletAddress: string
): Promise<OnChainReputation | null> {
  const pda = getReputationPda(walletAddress);
  return withFallback(async (conn) => {
    try {
      const info = await conn.getAccountInfo(pda);
      if (!info) return null;
      
      console.log(`[credlayer] Fetching account ${pda.toBase58()}, data length: ${info.data.length}`);
      return decodeReputationAccount(pda.toBase58(), info.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[credlayer] Failed to get info about account ${pda.toBase58()}:`, msg);
      throw new Error(`Failed to get info about account ${pda.toBase58()}: ${msg}`);
    }
  });
}

export async function checkOnChainReputationExists(
  walletAddress: string
): Promise<boolean> {
  const pda = getReputationPda(walletAddress);
  return withFallback(async (conn) => {
    const info = await conn.getAccountInfo(pda);
    return info !== null;
  });
}
