# CredLayer Solana Program

On-chain reputation and trust scoring system built with Anchor on Solana.

## Program Information

- **Program ID (Devnet)**: `Gz3cCnwFmXGNx3iFvkRQGuFMcTCf5Dc468V2VuTwKQ4c`
- **Network**: Devnet
- **Authority Wallet**: `82jDjbxnyCbXBddKuhorjEuKsXXVNyFsdzqn9g5uUXCP`

## Features

The CredLayer program provides on-chain storage and management of wallet reputation data:

### Instructions

1. **initialize_reputation** - Create a new reputation account for a wallet
2. **update_reputation** - Update trust score, risk level, and confidence
3. **add_metric** - Add behavioral metrics (stability, diversity, etc.)
4. **add_risk_flag** - Flag suspicious activity
5. **remove_risk_flag** - Remove risk flags
6. **close_reputation** - Close account and reclaim rent

### Account Structure

```rust
pub struct ReputationAccount {
    pub version: u8,
    pub wallet: Pubkey,
    pub authority: Pubkey,
    pub trust_score: u16,           // 0-100
    pub risk_level: RiskLevel,      // HighlyTrusted, Trusted, MediumRisk, HighRisk
    pub confidence: u16,            // 0-10000 (0.00% to 100.00%)
    pub last_updated: i64,
    pub created_at: i64,
    pub update_count: u64,
    pub metrics: [Metric; 6],
    pub risk_flags: [RiskFlag; 8],
    pub active_flags_count: u8,
    pub bump: u8,
}
```

### Risk Levels

- **HighlyTrusted** (81-100): Excellent reputation
- **Trusted** (61-80): Good reputation
- **MediumRisk** (31-60): Average reputation
- **HighRisk** (0-30): Poor reputation

### Behavioral Metrics

1. Behavioral Stability
2. Transaction Diversity
3. Counterparty Quality
4. Smart Contract Hygiene
5. Sybil Resistance
6. Repayment Reliability

### Risk Flags

- Potential Sybil Cluster
- Abnormal Transaction Burst
- Unverified Program Interaction
- Low Protocol Diversity
- Elevated Failure Rate
- New Wallet
- Weak Repayment History

## Development

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor 0.29+

### Build

```bash
cd programs/credlayer
anchor build
```

### Test

```bash
anchor test
```

### Deploy

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Integration

### TypeScript SDK

The frontend includes a TypeScript SDK for interacting with the program:

```typescript
import { useCredLayerProgram } from "@/hooks/use-credlayer-program";

function MyComponent() {
  const { fetchReputation, checkReputationExists, getReputationAddress } = useCredLayerProgram();
  
  // Fetch on-chain reputation
  const reputation = await fetchReputation();
  
  // Check if account exists
  const exists = await checkReputationExists();
  
  // Get PDA address
  const address = getReputationAddress();
}
```

### Server-Side Functions

```typescript
import { fetchOnChainReputation } from "@/lib/credlayer-onchain.server";

// Fetch reputation from server
const reputation = await fetchOnChainReputation(walletAddress);
```

## PDA Derivation

Reputation accounts use a Program Derived Address (PDA):

```
seeds = ["reputation", wallet_pubkey]
program_id = CREDLAYER_PROGRAM_ID
```

## Security

- Only the program authority can initialize and update reputation accounts
- Reputation data is immutable by wallet owners (read-only)
- All updates are logged on-chain with timestamps
- Rent-exempt accounts prevent data loss

## License

MIT
