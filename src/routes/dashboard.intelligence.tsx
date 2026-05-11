import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeWallet } from "@/lib/credlayer.functions";
import { Brain, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/credlayer/RiskBadge";

export const Route = createFileRoute("/dashboard/intelligence")({
  component: IntelligencePage,
});

function IntelligencePage() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? "";
  const fetchAnalyze = useServerFn(analyzeWallet);
  const { data, isLoading } = useQuery({
    queryKey: ["analysis", address],
    queryFn: () => fetchAnalyze({ data: { address } }),
    enabled: !!address,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Risk Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sybil detection, suspicious patterns, and behavioral classification.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" /> <Skeleton className="h-64" />
        </div>
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card icon={ShieldCheck} title="Risk classification">
              <RiskBadge level={data.risk_level} />
              <p className="mt-3 text-sm text-muted-foreground">
                AI confidence {(data.confidence * 100).toFixed(0)}%
              </p>
            </Card>
            <Card icon={AlertTriangle} title="Sybil signals">
              <div className="text-3xl font-bold">
                {data.suspicious_flags.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">flagged patterns</p>
            </Card>
            <Card icon={Activity} title="Reliability">
              <div className="text-3xl font-bold">
                {data.behavioral_metrics.reliability}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">based on tx success rate</p>
            </Card>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> AI insights
            </h3>
            <ul className="space-y-3 text-sm">
              {data.ai_insights.map((i, idx) => (
                <li key={idx} className="rounded-lg border border-border/60 bg-card/50 p-3">
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Suspicious patterns</h3>
              {data.suspicious_flags.length === 0 ? (
                <p className="text-sm text-success">None detected.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.suspicious_flags.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Risk predictions</h3>
              {data.risk_predictions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No predictions available.</p>
              ) : (
                <div className="space-y-3">
                  {data.risk_predictions.map((p, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{p.label}</span>
                        <span className="font-mono">{(p.probability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width: `${p.probability * 100}%`, background: "var(--electric)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card rounded-xl p-10 text-center">
      <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
      <p className="mt-3 text-sm text-muted-foreground">
        Run an analysis from the Dashboard or Analyzer to see risk intelligence.
      </p>
    </div>
  );
}
