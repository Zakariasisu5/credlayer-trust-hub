// Shared decoder for the CredLayer on-chain ReputationAccount.
// Layout (little-endian):
//   [0..8]   anchor discriminator
//   [8]      version (u8)
//   [9..41]  wallet (Pubkey, 32 bytes)
//   [41..73] authority (Pubkey, 32 bytes)
//   [73..75] trust_score (u16)
//   [75]     risk_level (enum u8)
//   [76..78] confidence (u16)
//   [78..86] last_updated (i64)
//   [86..94] created_at (i64)
//   [94..102] update_count (u64)
//   ...metrics + flags trailing
import { PublicKey } from "@solana/web3.js";
import {
  CREDLAYER_PROGRAM_ID,
  REPUTATION_SEED,
  RISK_LEVELS,
  type RiskLevel,
} from "./credlayer-config";

export type OnChainReputation = {
  pda: string;
  version: number;
  wallet: string;
  authority: string;
  trustScore: number;
  riskLevel: RiskLevel;
  confidence: number; // 0-10000 (basis points)
  confidencePercent: number; // 0-100
  lastUpdated: number; // unix seconds
  createdAt: number; // unix seconds
  updateCount: number;
};

export function getReputationPda(wallet: string): PublicKey {
  const programId = new PublicKey(CREDLAYER_PROGRAM_ID);
  const walletKey = new PublicKey(wallet);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), walletKey.toBuffer()],
    programId
  );
  return pda;
}

export function decodeReputationAccount(
  pda: string,
  data: Uint8Array
): OnChainReputation | null {
  if (data.length < 102) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  try {
    const version = view.getUint8(8);
    const wallet = new PublicKey(data.slice(9, 41)).toBase58();
    const authority = new PublicKey(data.slice(41, 73)).toBase58();
    const trustScore = view.getUint16(73, true);
    const riskIdx = view.getUint8(75);
    const confidence = view.getUint16(76, true);
    const lastUpdated = Number(view.getBigInt64(78, true));
    const createdAt = Number(view.getBigInt64(86, true));
    const updateCount = Number(view.getBigUint64(94, true));
    return {
      pda,
      version,
      wallet,
      authority,
      trustScore,
      riskLevel: RISK_LEVELS[riskIdx] ?? "HighRisk",
      confidence,
      confidencePercent: confidence / 100,
      lastUpdated,
      createdAt,
      updateCount,
    };
  } catch (err) {
    console.error("Failed to decode reputation account", err);
    return null;
  }
}
