import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listPermissions,
  setPermission,
  revokeAllPermissions,
} from "@/lib/terminal3.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Ban } from "lucide-react";

export const Route = createFileRoute("/dashboard/permissions")({
  component: PermissionsPage,
});

function PermissionsPage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const list = useServerFn(listPermissions);
  const set = useServerFn(setPermission);
  const revokeAll = useServerFn(revokeAllPermissions);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["permissions", wallet],
    queryFn: () => list({ data: { wallet } }),
    enabled: !!wallet,
  });

  const m = useMutation({
    mutationFn: (vars: { key: string; granted: boolean }) =>
      set({ data: { wallet, permission_key: vars.key, granted: vars.granted, expires_in_days: vars.granted ? 30 : null } }),
    onSuccess: () => {
      toast.success("Permission updated");
      qc.invalidateQueries({ queryKey: ["permissions", wallet] });
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const revokeAllM = useMutation({
    mutationFn: () => revokeAll({ data: { wallet } }),
    onSuccess: () => {
      toast.success("All permissions revoked");
      qc.invalidateQueries({ queryKey: ["permissions", wallet] });
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">AI Agent Permissions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Control exactly what the CredLayer AI agent may do on your behalf. Toggles take
            effect instantly. Restricted actions always require per-transaction signed approval.
          </p>
        </div>
        <Button variant="destructive" onClick={() => revokeAllM.mutate()} disabled={revokeAllM.isPending}>
          <Ban className="h-4 w-4 mr-2" />
          Revoke all
        </Button>
      </div>

      <div className="grid gap-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.data?.map((p) => (
          <Card key={p.permission_key} className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    {p.scope === "restricted" ? (
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    )}
                    {p.label}
                    <Badge variant={p.scope === "restricted" ? "destructive" : "secondary"} className="ml-2 uppercase text-[10px]">
                      {p.scope}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">{p.description}</CardDescription>
                </div>
                <Switch
                  checked={p.granted}
                  disabled={p.scope === "restricted" || m.isPending}
                  onCheckedChange={(v) => m.mutate({ key: p.permission_key, granted: v })}
                />
              </div>
            </CardHeader>
            {p.granted && p.expires_at && (
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Expires {new Date(p.expires_at).toLocaleString()}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
