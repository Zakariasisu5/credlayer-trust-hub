import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeWallet } from "@/lib/credlayer.functions";
import { AnalysisView } from "@/components/credlayer/AnalysisView";
import { OnChainReputationCard } from "@/components/credlayer/OnChainReputationCard";
import { useEffect } from "react";
import { toast } from "sonner";
import { shortAddress } from "@/components/wallet/ConnectWalletButton";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? "";
  const fetchAnalyze = useServerFn(analyzeWallet);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["analysis", address],
    queryFn: () => fetchAnalyze({ data: { address } }),
    enabled: !!address,
    staleTime: 60_000,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Analyzing {shortAddress(address, 6)}
        </p>
      </div>
      <AnalysisView
        data={query.data}
        loading={query.isLoading}
        onRefresh={() => refresh.mutate()}
        refreshing={refresh.isPending}
      />
    </div>
  );
}
