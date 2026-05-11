import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeWallet } from "@/lib/credlayer.functions";
import { AnalysisView } from "@/components/credlayer/AnalysisView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/analyzer")({
  component: AnalyzerPage,
});

function AnalyzerPage() {
  const [address, setAddress] = useState("");
  const fetchAnalyze = useServerFn(analyzeWallet);
  const m = useMutation({
    mutationFn: (addr: string) => fetchAnalyze({ data: { address: addr } }),
    onError: (e: Error) => toast.error("Analysis failed", { description: e.message }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    m.mutate(address.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Wallet Reputation Analyzer</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search any Solana wallet to get a real-time AI-powered reputation analysis.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass-card rounded-xl p-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter Solana wallet address (e.g. 9WzD…dBjK)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="pl-9 font-mono"
          />
        </div>
        <Button type="submit" disabled={m.isPending || !address.trim()}>
          {m.isPending ? "Analyzing…" : "Analyze"}
        </Button>
      </form>

      <AnalysisView data={m.data} loading={m.isPending} />
    </div>
  );
}
