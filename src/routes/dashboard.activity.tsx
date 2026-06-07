import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActivity } from "@/lib/terminal3.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, ShieldAlert, Activity } from "lucide-react";

export const Route = createFileRoute("/dashboard/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const fetchActivity = useServerFn(listActivity);

  const q = useQuery({
    queryKey: ["activity", wallet],
    queryFn: () => fetchActivity({ data: { wallet, limit: 100 } }),
    enabled: !!wallet,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Agent Activity Log</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every permission change, credential lifecycle event, and verification
          performed for your wallet is recorded here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !q.data?.length ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              No activity yet. Grant a permission or issue a credential to see entries here.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {q.data.map((row) => (
                <li key={row.id} className="py-3 flex items-start gap-3">
                  <StatusIcon status={row.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{row.message || row.action}</span>
                      <Badge variant="outline" className="text-xs font-mono">{row.action}</Badge>
                      <StatusBadge status={row.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(row.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "failed") return <XCircle className="h-4 w-4 text-destructive mt-0.5" />;
  if (status === "denied") return <ShieldAlert className="h-4 w-4 text-warning mt-0.5" />;
  return <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "failed" ? "destructive" : status === "denied" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="text-xs capitalize">
      {status}
    </Badge>
  );
}
