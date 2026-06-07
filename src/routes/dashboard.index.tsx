import { createFileRoute, Link } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeWallet } from "@/lib/credlayer.functions";
import { getT3Session } from "@/lib/terminal3.functions";
import { AnalysisView } from "@/components/credlayer/AnalysisView";
import { OnChainReputationCard } from "@/components/credlayer/OnChainReputationCard";
import { useEffect } from "react";
import { toast } from "sonner";
import { shortAddress } from "@/components/wallet/ConnectWalletButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, KeyRound, CircleDot } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? "";
  const fetchAnalyze = useServerFn(analyzeWallet);
  const fetchSession = useServerFn(getT3Session);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["analysis", address],
    queryFn: () => fetchAnalyze({ data: { address } }),
    enabled: !!address,
    staleTime: 60_000,
  });

  const session = useQuery({
    queryKey: ["t3-session", address],
    queryFn: () => fetchSession({ data: { wallet: address } }),
    enabled: !!address,
    staleTime: 300_000,
  });

  // Surface AI errors as toast
  useEffect(() => {
    if (query.error) {
      toast.error("Analysis failed", { description: (query.error as Error).message });
    }
  }, [query.error]);

  const refresh = useMutation({
    mutationFn: () => fetchAnalyze({ data: { address, force: true } }),
    onSuccess: (data) => {
      qc.setQueryData(["analysis", address], data);
      toast.success("Analysis refreshed");
    },
    onError: (e: Error) => toast.error("Refresh failed", { description: e.message }),
  });

  const t3Mode = session.data?.mode;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            Analyzing {shortAddress(address, 6)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {t3Mode && (
            <Badge
              variant="outline"
              className="gap-1.5 border-border/60"
              title={
                t3Mode === "live"
                  ? "Terminal 3 Agent Auth is connected"
                  : "Terminal 3 secrets not set — running in local mode"
              }
            >
              <CircleDot
                className={
                  t3Mode === "live"
                    ? "h-3 w-3 text-success"
                    : "h-3 w-3 text-muted-foreground"
                }
              />
              Terminal 3 · {t3Mode}
            </Badge>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/permissions" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Permissions
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/credentials" className="gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5" /> Credentials
            </Link>
          </Button>
        </div>
      </div>
      <OnChainReputationCard />
      <AnalysisView
        data={query.data}
        loading={query.isLoading}
        onRefresh={() => refresh.mutate()}
        refreshing={refresh.isPending}
      />
    </div>
  );
}
