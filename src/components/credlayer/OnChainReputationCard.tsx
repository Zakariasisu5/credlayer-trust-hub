import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOnChainReputation } from "@/lib/credlayer-onchain.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ShieldAlert, Link2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CREDLAYER_PROGRAM_ID,
  SOLANA_NETWORK,
  type RiskLevel,
} from "@/lib/credlayer-config";

const riskStyle: Record<RiskLevel, { label: string; cls: string }> = {
  HighlyTrusted: {
    label: "Highly Trusted",
    cls: "bg-success/15 text-success border-success/30",
  },
  Trusted: {
    label: "Trusted",
    cls: "bg-primary/15 text-primary border-primary/30",
  },
  MediumRisk: {
    label: "Medium Risk",
    cls: "bg-warning/15 text-warning border-warning/30",
  },
  HighRisk: {
    label: "High Risk",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

function explorerUrl(pda: string) {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/address/${pda}${cluster}`;
}

export function OnChainReputationCard() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? "";
  const fetchOnChain = useServerFn(getOnChainReputation);

  const { data, isLoading, error } = useQuery({
    queryKey: ["onchain-reputation", address],
    queryFn: () => fetchOnChain({ data: { address } }),
    enabled: !!address,
    staleTime: 60_000,
  });

  const rep = data?.reputation ?? null;
  const fetchError = (error as Error | undefined)?.message ?? data?.error ?? null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            On-Chain Reputation
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Live data from CredLayer program on Solana {SOLANA_NETWORK}
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {CREDLAYER_PROGRAM_ID.slice(0, 4)}…{CREDLAYER_PROGRAM_ID.slice(-4)}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : fetchError ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        ) : !rep ? (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-sm text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              No on-chain reputation account exists for this wallet yet. Once an
              authority publishes your score on-chain, it will appear here.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Trust Score
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tabular-nums">
                    {rep.trustScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Confidence
                </div>
                <div className="text-2xl font-semibold tabular-nums">
                  {rep.confidencePercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  riskStyle[rep.riskLevel].cls
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                {riskStyle[rep.riskLevel].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3 text-xs">
              <div>
                <div className="text-muted-foreground">Updates</div>
                <div className="font-mono">{rep.updateCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last updated</div>
                <div className="font-mono">
                  {rep.lastUpdated
                    ? new Date(rep.lastUpdated * 1000).toLocaleDateString()
                    : "—"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Reputation PDA</div>
                <a
                  href={explorerUrl(rep.pda)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                >
                  {rep.pda.slice(0, 8)}…{rep.pda.slice(-8)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
