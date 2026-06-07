// CredLayer Solana program configuration (public values)
export const CREDLAYER_PROGRAM_ID =
  import.meta.env.VITE_CREDLAYER_PROGRAM_ID ??
  "Gz3cCnwFmXGNx3iFvkRQGuFMcTCf5Dc468V2VuTwKQ4c";

export const SOLANA_NETWORK =
  (import.meta.env.VITE_SOLANA_NETWORK as "devnet" | "mainnet-beta" | "testnet") ??
  "devnet";

export const SOLANA_RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export const REPUTATION_SEED = "reputation";

export type RiskLevel = "HighlyTrusted" | "Trusted" | "MediumRisk" | "HighRisk";

export const RISK_LEVELS: RiskLevel[] = [
  "HighlyTrusted",
  "Trusted",
  "MediumRisk",
  "HighRisk",
];

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 81) return "HighlyTrusted";
  if (score >= 61) return "Trusted";
  if (score >= 31) return "MediumRisk";
  return "HighRisk";
}
