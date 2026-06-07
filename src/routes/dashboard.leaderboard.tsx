import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/credlayer.functions";
import { Trophy, ExternalLink, AlertTriangle } from "lucide-react";
import { RiskBadge } from "@/components/credlayer/RiskBadge";
import { shortAddress } from "@/components/wallet/ConnectWalletButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fetchLb = useServerFn(getLeaderboard);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchLb(),
    refetchInterval: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load leaderboard", {
        description: (error as Error).message,
      });
    }
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" /> Reputation Leaderboard
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Top trusted wallets analyzed by CredLayer.
        </p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <p className="mt-3 text-sm font-medium">Couldn't load leaderboard</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto break-words">
              {(error as Error).message}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying…" : "Retry"}
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-10 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">
              The leaderboard is empty. Wallets appear here as they get analyzed.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="text-left p-4">Rank</th>
                <th className="text-left p-4">Wallet</th>
                <th className="text-left p-4">Trust score</th>
                <th className="text-left p-4">Risk</th>
                <th className="text-left p-4">Tx count</th>
                <th className="text-left p-4">Updated</th>
                <th className="text-right p-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.wallet_address}
                  className="border-b border-border/40 hover:bg-accent/30 transition"
                >
                  <td className="p-4 font-bold">
                    {i === 0 && <span className="text-gradient-gold">#1</span>}
                    {i !== 0 && <span className="text-muted-foreground">#{i + 1}</span>}
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {shortAddress(row.wallet_address, 6)}
                  </td>
                  <td className="p-4">
                    <span className="text-lg font-semibold text-gradient-electric">
                      {row.trust_score}
                    </span>
                  </td>
                  <td className="p-4"><RiskBadge level={row.risk_level} /></td>
                  <td className="p-4 text-muted-foreground">{row.tx_count}</td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(row.updated_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={`https://solscan.io/account/${row.wallet_address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-primary inline-flex"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
