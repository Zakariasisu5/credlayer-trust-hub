import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import {
  Shield,
  Brain,
  Activity,
  Lock,
  ArrowRight,
  Github,
  BookOpen,
  Mail,
  CheckCircle2,
  Cpu,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CredLayer — On-chain Reputation & Trust Scoring on Solana" },
      {
        name: "description",
        content:
          "Real wallet trust scores powered by on-chain analysis and AI. Built for DeFi protocols and autonomous AI agents on Solana.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { connected } = useWallet();
  const navigate = useNavigate();

  // Auto-route to dashboard once connected
  useEffect(() => {
    if (connected) navigate({ to: "/dashboard" });
  }, [connected, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.84_0.17_92)] to-[oklch(0.72_0.2_240)] grid place-items-center">
              <Shield className="h-4 w-4 text-background" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-gradient-gold">Cred</span>
              <span className="text-gradient-electric">Layer</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition">How it works</a>
            <a href="#trust" className="hover:text-foreground transition">Security</a>
            <a href="#features" className="hover:text-foreground transition">Features</a>
          </nav>
          <ConnectWalletButton />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 credlayer-grid-bg pointer-events-none" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live on Solana mainnet
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              On-chain reputation for{" "}
              <span className="text-gradient-gold">wallets</span> and{" "}
              <span className="text-gradient-electric">AI agents</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              CredLayer analyzes Solana wallet behavior in real time and generates
              AI-powered trust scores. Help DeFi apps and autonomous agents make
              safer decisions before every transaction.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ConnectWalletButton size="lg" />
              <Button asChild size="lg" variant="outline">
                <a href="#how-it-works" className="gap-2">
                  Learn more <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Non-custodial</div>
              <div className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5" /> AI-powered</div>
              <div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> Real-time</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">How CredLayer works</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Three steps from raw on-chain data to a trustworthy reputation signal.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "1. Read on-chain data",
              body: "We fetch transaction history, program interactions, and balance signals directly from Solana via Helius RPC.",
            },
            {
              icon: Brain,
              title: "2. AI reputation engine",
              body: "Our AI engine evaluates behavior, detects sybil and risk patterns, and produces a confidence-weighted trust score.",
            },
            {
              icon: Shield,
              title: "3. Trust score & insights",
              body: "Results are surfaced as a clean 0–100 score with actionable risk insights for users, dApps, and AI agents.",
            },
          ].map((step) => (
            <div key={step.title} className="glass-card rounded-xl p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center mb-4">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Wallet trust score", d: "0–100 score with risk classification badge.", icon: Shield },
            { t: "AI risk intelligence", d: "Sybil detection, behavioral patterns, predictions.", icon: Brain },
            { t: "Reputation analyzer", d: "Search any Solana wallet for instant insights.", icon: Search },
            { t: "Developer API", d: "Embed trust scores directly into your dApp.", icon: Cpu },
          ].map((f) => (
            <div key={t_key(f.t)} className="rounded-xl border border-border/60 bg-card/50 p-5">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="container mx-auto px-4 py-20">
        <div className="glass-card rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
          <Lock className="h-8 w-8 text-primary mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-bold">Non-custodial by design</h2>
          <p className="mt-3 text-muted-foreground">
            CredLayer never holds your funds, never asks for private keys, and only
            reads public on-chain data. Connect your Phantom, Solflare, or Backpack
            wallet to access your reputation dashboard — disconnect any time.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 text-left text-sm">
            {[
              "Read-only wallet connection",
              "Public on-chain data only",
              "AI analysis runs server-side",
              "Open trust score methodology",
            ].map((i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ConnectWalletButton size="lg" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60">
        <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[oklch(0.84_0.17_92)] to-[oklch(0.72_0.2_240)] grid place-items-center">
                <Shield className="h-3.5 w-3.5 text-background" />
              </div>
              <span className="font-bold">CredLayer</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Decentralized reputation protocol on Solana.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground">How it works</a></li>
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#trust" className="hover:text-foreground">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://docs.solana.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-foreground"><BookOpen className="h-3.5 w-3.5" /> Docs</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-foreground"><Github className="h-3.5 w-3.5" /> GitHub</a></li>
              <li><a href="mailto:hello@credlayer.app" className="inline-flex items-center gap-2 hover:text-foreground"><Mail className="h-3.5 w-3.5" /> Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CredLayer. Built on Solana.
        </div>
      </footer>
    </div>
  );
}

function t_key(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-");
}
