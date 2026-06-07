import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrustScoreRadial } from "./TrustScoreRadial";
import { RiskBadge } from "./RiskBadge";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  Wallet,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/credlayer.functions";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalysisView({
  data,
  loading,
  onRefresh,
  refreshing,
}: {
  data: AnalysisResult | null | undefined;
  loading: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  if (loading) return <AnalysisSkeleton />;
  if (!data) {
    return (
      <div className="glass-card rounded-xl p-10 text-center">
        <Wallet className="h-8 w-8 text-muted-foreground mx-auto" />
        <h3 className="mt-3 font-semibold">No analysis yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Run an analysis to see real-time trust insights for this wallet.
        </p>
      </div>
    );
  }

  const metricBars = Object.entries(data.behavioral_metrics).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
  }));

  return (
    <div className="grid gap-6">
      {/* Top row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-xl p-6 lg:col-span-1 flex flex-col items-center justify-center">
          <TrustScoreRadial score={data.trust_score} />
          <div className="mt-4 flex flex-col items-center gap-2">
            <RiskBadge level={data.risk_level} />
            <div className="text-xs text-muted-foreground">
              AI confidence: {(data.confidence * 100).toFixed(0)}%
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Refresh analysis
            </Button>
          )}
        </div>

        <div className="glass-card rounded-xl p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Wallet overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Balance" value={`${data.analytics.balance_sol.toFixed(3)} SOL`} />
            <Stat label="Transactions" value={data.analytics.tx_count.toString()} />
            <Stat
              label="Wallet age"
              value={
                data.analytics.wallet_age_days !== null
                  ? `${data.analytics.wallet_age_days}d`
                  : "—"
              }
            />
            <Stat label="Programs" value={data.analytics.unique_programs.toString()} />
          </div>
          <div className="mt-6">
            <div className="text-xs text-muted-foreground mb-2">Reputation trend (last 7 days)</div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.reputation_history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--electric)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--electric)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Behavioral metrics + AI insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" /> Behavioral metrics
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--electric)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> AI insights
          </h3>
          <ul className="space-y-3 text-sm">
            {data.ai_insights.map((insight, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{insight}</span>
              </li>
            ))}
          </ul>
          {data.risk_predictions.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border/60">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Risk predictions
              </div>
              <div className="space-y-2">
                {data.risk_predictions.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{p.label}</span>
                      <span className="font-mono">{(p.probability * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-electric"
                        style={{
                          width: `${p.probability * 100}%`,
                          background: "var(--electric)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suspicious flags + recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Suspicious activity alerts
          </h3>
          {data.suspicious_flags.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> No suspicious patterns detected.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.suspicious_flags.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Recent on-chain activity
          </h3>
          {data.recent_activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent transactions.</p>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {data.recent_activity.slice(0, 8).map((tx) => (
                <li key={tx.signature} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={
                        "h-1.5 w-1.5 rounded-full " +
                        (tx.success ? "bg-success" : "bg-destructive")
                      }
                    />
                    <a
                      href={`https://solscan.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs truncate hover:text-primary inline-flex items-center gap-1"
                    >
                      {tx.signature.slice(0, 10)}…{tx.signature.slice(-6)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tx.block_time
                      ? new Date(tx.block_time * 1000).toLocaleString()
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-1" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
