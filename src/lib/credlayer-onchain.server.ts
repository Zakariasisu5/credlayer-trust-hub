// Server-only helpers to read CredLayer on-chain reputation accounts.
import { Connection } from "@solana/web3.js";
import {
  decodeReputationAccount,
  getReputationPda,
  type OnChainReputation,
} from "./credlayer-onchain";

function getRpcUrl() {
  return (
    process.env.SOLANA_RPC_URL ??
    process.env.VITE_SOLANA_RPC_URL ??
    "https://api.devnet.solana.com"
  );
}

let cached: Connection | null = null;
function getConnection() {
  if (!cached) cached = new Connection(getRpcUrl(), "confirmed");
  return cached;
}

export async function fetchOnChainReputation(
  walletAddress: string
): Promise<OnChainReputation | null> {
  const pda = getReputationPda(walletAddress);
  const conn = getConnection();
  const info = await conn.getAccountInfo(pda);
  if (!info) return null;
  return decodeReputationAccount(pda.toBase58(), info.data);
}

export async function checkOnChainReputationExists(
  walletAddress: string
): Promise<boolean> {
  const pda = getReputationPda(walletAddress);
  const conn = getConnection();
  const info = await conn.getAccountInfo(pda);
  return info !== null;
}
