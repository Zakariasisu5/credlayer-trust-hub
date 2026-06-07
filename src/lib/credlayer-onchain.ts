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
import { Buffer } from "buffer";
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
  console.log(`[credlayer] Decoding account ${pda}, data length: ${data.length}`);
  console.log(`[credlayer] First 120 bytes (hex):`, Buffer.from(data.slice(0, Math.min(120, data.length))).toString('hex'));
  
  if (data.length < 102) {
    console.error(`Account data too short: ${data.length} bytes, expected at least 102`);
    return null;
  }
  
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  try {
    // Read discriminator (first 8 bytes)
    const discriminator = Array.from(data.slice(0, 8));
    console.log(`[credlayer] Discriminator:`, discriminator);
    
    // Read version
    const version = view.getUint8(8);
    console.log(`[credlayer] Version:`, version);
    
    // Read wallet pubkey (32 bytes starting at offset 9)
    const walletBytes = data.slice(9, 41);
    console.log(`[credlayer] Wallet bytes (hex):`, Buffer.from(walletBytes).toString('hex'));
    let wallet: string;
    try {
      wallet = new PublicKey(walletBytes).toBase58();
      console.log(`[credlayer] Wallet:`, wallet);
    } catch (err) {
      console.error("Failed to parse wallet pubkey:", err);
      throw new Error(`Invalid wallet pubkey at offset 9: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Read authority pubkey (32 bytes starting at offset 41)
    const authorityBytes = data.slice(41, 73);
    console.log(`[credlayer] Authority bytes (hex):`, Buffer.from(authorityBytes).toString('hex'));
    let authority: string;
    try {
      authority = new PublicKey(authorityBytes).toBase58();
      console.log(`[credlayer] Authority:`, authority);
    } catch (err) {
      console.error("Failed to parse authority pubkey:", err);
      throw new Error(`Invalid authority pubkey at offset 41: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    const trustScore = view.getUint16(73, true);
    const riskIdx = view.getUint8(75);
    const confidence = view.getUint16(76, true);
    const lastUpdated = Number(view.getBigInt64(78, true));
    const createdAt = Number(view.getBigInt64(86, true));
    const updateCount = Number(view.getBigUint64(94, true));
    
    console.log(`[credlayer] Decoded values:`, {
      trustScore,
      riskIdx,
      confidence,
      lastUpdated,
      createdAt,
      updateCount
    });
    
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to decode reputation account ${pda}:`, msg);
    throw new Error(`Failed to decode reputation account: ${msg}`);
  }
}
