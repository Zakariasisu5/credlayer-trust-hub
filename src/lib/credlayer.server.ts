// Server-only helpers — Helius RPC + AI analysis. Never import from client.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function getAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const HELIUS_BASE = "https://mainnet.helius-rpc.com";

async function heliusRpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) throw new Error("HELIUS_API_KEY is not configured");
  const res = await fetch(`${HELIUS_BASE}/?api-key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "credlayer", method, params }),
  });
  if (!res.ok) throw new Error(`Helius RPC ${method} failed: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Helius RPC error: ${json.error.message}`);
  return json.result as T;
}

export type WalletRawData = {
  balanceSol: number;
  txCount: number;
  recentSignatures: { signature: string; slot: number; blockTime: number | null; err: unknown }[];
  enrichedTxs: any[];
  walletAgeDays: number | null;
  uniqueProgramIds: string[];
  failedTxRatio: number;
};

export async function fetchWalletRawData(address: string): Promise<WalletRawData> {
  // 1. Balance
  const balance = await heliusRpc<{ value: number }>("getBalance", [address]);
  const balanceSol = (balance?.value ?? 0) / 1_000_000_000;

  // 2. Recent signatures
  const signatures = await heliusRpc<
    { signature: string; slot: number; blockTime: number | null; err: unknown }[]
  >("getSignaturesForAddress", [address, { limit: 100 }]);

  const recentSignatures = signatures || [];
  const txCount = recentSignatures.length;

  // 3. Wallet age (oldest of the 100 signatures)
  let walletAgeDays: number | null = null;
  if (recentSignatures.length > 0) {
    const oldest = recentSignatures[recentSignatures.length - 1].blockTime;
    if (oldest) {
      walletAgeDays = Math.floor((Date.now() / 1000 - oldest) / 86400);
    }
  }

  const failedTxRatio =
    txCount > 0 ? recentSignatures.filter((s) => s.err !== null).length / txCount : 0;

  // 4. Enriched transactions for the most recent ~25
  const apiKey = process.env.HELIUS_API_KEY!;
  let enrichedTxs: any[] = [];
  const sigsToEnrich = recentSignatures.slice(0, 25).map((s) => s.signature);
  if (sigsToEnrich.length > 0) {
    try {
      const r = await fetch(
        `https://api.helius.xyz/v0/transactions?api-key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: sigsToEnrich }),
        }
      );
      if (r.ok) enrichedTxs = await r.json();
    } catch (e) {
      console.error("Helius enriched tx fetch failed", e);
    }
  }

  // 5. Unique program ids touched
  const programs = new Set<string>();
  for (const tx of enrichedTxs) {
    if (Array.isArray(tx?.instructions)) {
      for (const ix of tx.instructions) {
        if (ix?.programId) programs.add(ix.programId);
      }
    }
  }

  return {
    balanceSol,
    txCount,
    recentSignatures: recentSignatures.slice(0, 50),
    enrichedTxs,
    walletAgeDays,
    uniqueProgramIds: Array.from(programs),
    failedTxRatio,
  };
}

// Heuristic, deterministic trust score calculation from raw on-chain data.
export function computeBaseScore(raw: WalletRawData) {
  let score = 50;
  // Wallet age bonus (max +20)
  if (raw.walletAgeDays !== null) {
    score += Math.min(20, Math.floor(raw.walletAgeDays / 30));
  }
  // Activity bonus (max +15)
  score += Math.min(15, Math.floor(raw.txCount / 10));
  // Program diversity (max +10)
  score += Math.min(10, raw.uniqueProgramIds.length);
  // Balance signal (max +5)
  if (raw.balanceSol > 0.1) score += 3;
  if (raw.balanceSol > 1) score += 2;
  // Penalties
  if (raw.failedTxRatio > 0.2) score -= 15;
  else if (raw.failedTxRatio > 0.1) score -= 7;
  if (raw.txCount === 0) score = 10;
  return Math.max(0, Math.min(100, score));
}

export function classifyRisk(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 75) return "low";
  if (score >= 55) return "medium";
  if (score >= 35) return "high";
  return "critical";
}
