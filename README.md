# CredLayer

> **AI-Powered On-Chain Reputation & Trust Infrastructure for Solana**
> A decentralized reputation protocol that turns on-chain behavior into explainable trust scores, issues verifiable credentials via **Terminal 3**, and powers safer DeFi and autonomous AI agents.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana)](https://solana.com)
[![Terminal 3](https://img.shields.io/badge/Powered_by-Terminal_3-00C2FF?style=for-the-badge)](https://terminal3.io)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

---

## 1. Project Summary

**CredLayer** is a decentralized reputation layer for the Solana ecosystem.

It analyzes any wallet's on-chain history, produces a **0–100 trust score** with risk classification and AI-generated explainability, and issues that score as a **verifiable credential through Terminal 3** so other dApps, lenders, and AI agents can consume it without re-running the analysis.

Built for the **Terminal 3 Hackathon** — bringing reusable, privacy-preserving identity and reputation to autonomous on-chain finance.

---

## 2. Hackathon Submission

| | |
|---|---|
| **Project name** | CredLayer |
| **Track** | Identity, Reputation & AI Agents |
| **Demo wallet** | Connect any Solana wallet (Phantom / Solflare / Backpack) on devnet |
| **Network** | Solana Devnet |
| **Status** | MVP — end-to-end working build |

---

## 3. The Problem

In Web3, **trust is invisible**. A wallet address tells you nothing about whether it is:

- A real user or a bot / Sybil cluster
- Reliable enough to lend to or transact with
- Eligible for an airdrop, allowlist, or DAO vote
- Safe for an autonomous AI agent to interact with

Traditional credit scores don't exist on-chain, and every protocol has to re-invent the wheel — running their own risk analysis on the same public data.

---

## 4. The Solution

CredLayer is a **shared reputation primitive**:

1. **Analyze** any Solana wallet in real time using on-chain data + an AI risk engine.
2. **Score** behavior across activity, counterparty quality, DeFi participation, and risk signals.
3. **Issue** the result as a **Verifiable Credential via Terminal 3**, signed and timestamped.
4. **Consume** the credential from any dApp, lending protocol, or AI agent — no re-computation.

The credential is portable, revocable, and verifiable off-chain — exactly the primitive Terminal 3 was built to provide.

---

## 5. Terminal 3 Integration

Terminal 3 powers the **identity and credentialing layer** of CredLayer.

| Capability | How CredLayer uses it |
|---|---|
| **Credential issuance** | When a user receives a trust score, we mint a Terminal 3 VC containing `subject_wallet`, `trust_score`, `risk_level`, `issued_at`, `expires_at`, and a hash of the underlying analytics. |
| **Credential verification** | Any third party can verify the credential signature against Terminal 3's issuer registry — no CredLayer backend needed. |
| **Revocation** | When a wallet's risk profile changes materially, the old credential is revoked through Terminal 3. |
| **Local fallback** | If `TERMINAL3_API_BASE_URL` is not configured, CredLayer issues a locally signed credential with the same schema for local dev — see `src/lib/terminal3/`. |

Integration code lives in:

- `src/lib/terminal3.functions.ts` — server functions (`createServerFn`) for issue / verify / revoke
- `src/lib/terminal3/client.server.ts` — server-side Terminal 3 client
- `supabase/migrations/...verifiable_credentials...` — credential audit table

---

## 6. Key Features

- **Wallet Reputation Analyzer** — paste any Solana address, get a trust score, risk badge, behavioral metrics, and AI-generated insights.
- **AI Risk Intelligence** — Sybil-cluster detection, anomaly classification, 14-day risk forecasting, behavioral typing (retail / trader / bot / Sybil).
- **Verifiable Credentials** — every score can be issued as a Terminal 3 VC, listed under `/dashboard/credentials`.
- **Personal Dashboard** — your own wallet's score, history, alerts, and credential vault.
- **Reputation Leaderboard** — top trusted wallets and fastest-growing reputations.
- **Developer API** — REST surface + API-key management for protocols and AI agents.
- **Agent Permissions & Activity Log** — fine-grained, revocable permissions for autonomous agents acting on a user's behalf, with a full audit trail.
- **On-chain Anchor program** — Rust + Anchor program for storing canonical reputation PDAs on Solana.

---

## 7. Architecture

```text
                ┌──────────────────────────────────────┐
                │              CredLayer UI            │
                │  React 19 · TanStack Start · Tailwind│
                └──────────────┬───────────────────────┘
                               │  serverFn RPC (typed)
                ┌──────────────▼───────────────────────┐
                │       TanStack Server Functions       │
                │  - reputation engine                  │
                │  - AI risk engine (Lovable AI Gateway)│
                │  - terminal3.functions.ts             │
                │  - audit & permissions                │
                └─────┬──────────────┬───────────┬─────┘
                      │              │           │
        ┌─────────────▼─┐ ┌──────────▼───────┐ ┌─▼──────────────┐
        │               │ │   Terminal 3     │ │  Solana RPC    │
        │  Cloud DB     │ │   (VC issue /    │ │  + Anchor      │
        │  (Postgres)   │ │    verify /      │ │  program       │
        │               │ │    revoke)       │ │  (PDA storage) │
        └───────────────┘ └──────────────────┘ └────────────────┘
```

---

## 8. Tech Stack

**Frontend**
- React 19 + TypeScript (strict)
- TanStack Router & TanStack Start (SSR)
- Tailwind CSS v4 + Radix UI
- Recharts for visualizations
- Solana Wallet Adapter (Phantom, Solflare, Backpack, Wallet-Standard)

**Backend (TanStack server functions on Cloudflare Workers)**
- `createServerFn` for typed RPC
- Cloud (managed Postgres + Auth) for analytics, credentials, permissions, audit log
- AI Gateway for the LLM risk-explanation layer
- **Terminal 3 SDK** for verifiable credentials

**Smart Contract**
- Rust + Anchor (`programs/credlayer`)
- PDA-based reputation accounts on Solana Devnet

**Infra**
- Deployed on Cloudflare Workers (via TanStack Start build)
- Cloud for DB / auth / secrets

---

## 9. Quick Start

### Prerequisites

- Node 18+ or **Bun 1.x**
- A Solana wallet (Phantom, Solflare, or Backpack) on **devnet**
- (Optional) Rust + Solana CLI + Anchor — only needed to rebuild the on-chain program

### Install & run

```bash
git clone https://github.com/Zakariasisu5/Cred-Layer.git
cd Cred-Layer
bun install
cp .env.example .env   # fill in values — see section 10
bun run dev
```

Open `http://localhost:3000` and click **Connect Wallet**.

### Production build

```bash
bun run build      # builds client + server bundles for Cloudflare Workers
bun run preview    # preview the production build locally
```

### Smart contract (optional)

```bash
cd programs/credlayer
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

---

## 10. Environment Variables

Copy `.env.example` → `.env`. Never commit `.env` (already in `.gitignore`).

| Variable | Purpose | Required |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Cloud (browser) | yes |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Cloud (server) | yes |
| `VITE_SOLANA_NETWORK` / `VITE_SOLANA_RPC_URL` | Solana cluster | yes |
| `VITE_CREDLAYER_PROGRAM_ID` | On-chain program ID | optional |
| `TERMINAL3_API_BASE_URL` / `TERMINAL3_API_KEY` / `TERMINAL3_PROJECT_ID` | Terminal 3 issuer credentials | optional — falls back to local signer |

---

## 11. How Trust Scores Are Computed

```
TrustScore = Σ(positive_signals × weights) − Σ(risk_penalties × 0.45)
```

**Positive signals (0–100):** wallet age · transaction activity · success rate · protocol diversity · repayment history · counterparty quality.

**Risk penalties (0–100):** transaction bursts · Sybil cluster proximity · unverified program calls · failed-tx ratio.

**Risk bands:**
- 🟢 **Highly Trusted** 81–100
- 🔵 **Trusted** 61–80
- 🟡 **Medium Risk** 31–60
- 🔴 **High Risk** 0–30

---

## 12. Use Cases

- **DeFi lenders** — gate under-collateralized loans by trust score
- **Airdrop teams** — filter Sybil clusters before token distribution
- **DAOs** — weight votes by reputation
- **AI agents** — fetch a Terminal 3-verified score before transacting on a user's behalf
- **Wallet apps** — show counterparty risk inline

---

## 13. Roadmap

- ✅ Reputation engine, analyzer, dashboard, leaderboard
- ✅ Anchor program with PDA reputation accounts
- ✅ Terminal 3 VC issue / verify / revoke + audit log
- ✅ Agent permissions with revocation
- 🚧 Live mainnet RPC + indexer
- 🚧 ML scoring model
- 🔮 Cross-chain (EVM) reputation portability
- 🔮 Reputation oracle for on-chain consumers

---

## 14. Project Structure

```
src/
  routes/                  TanStack file-based routes (dashboard, analyzer, credentials, …)
  components/              UI components (wallet, credlayer, layout, ui)
  lib/
    credlayer.functions.ts        reputation server functions
    credlayer-onchain.functions.ts Anchor / Solana program calls
    terminal3.functions.ts        Terminal 3 VC server functions
    terminal3/client.server.ts    Terminal 3 server client
    audit.server.ts               audit logging helper
  integrations/supabase/   Auto-generated Lovable Cloud clients (do not edit)
programs/credlayer/        Anchor program (Rust)
supabase/migrations/       SQL migrations (RLS + grants)
```

---

## 15. Team

Built for the **Terminal 3 Hackathon** by the CredLayer team — believers that **reputation is the missing primitive of decentralized finance and the AI-agent economy**.

---

## 16. License

MIT — see [LICENSE](LICENSE).

---

## 17. Acknowledgements

- **Terminal 3** — verifiable credential infrastructure
- **Solana Foundation** — blockchain & Anchor framework
- **TanStack** — Router & Start
- **Radix UI**, **Tailwind CSS**, **Recharts**

---

<div align="center">

**⭐ If CredLayer is useful, star the repo — it helps the hackathon submission.**

</div>
