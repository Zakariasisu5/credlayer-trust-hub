import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings, updateSettings } from "@/lib/credlayer.functions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectWalletButton, shortAddress } from "@/components/wallet/ConnectWalletButton";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const get = useServerFn(getSettings);
  const update = useServerFn(updateSettings);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["settings", wallet],
    queryFn: () => get({ data: { wallet } }),
    enabled: !!wallet,
  });

  const [alerts, setAlerts] = useState(true);
  const [scoreChanges, setScoreChanges] = useState(true);

  useEffect(() => {
    if (q.data) {
      setAlerts(q.data.notify_alerts);
      setScoreChanges(q.data.notify_score_changes);
    }
  }, [q.data]);

  const m = useMutation({
    mutationFn: () =>
      update({
        data: {
          wallet,
          notify_alerts: alerts,
          notify_score_changes: scoreChanges,
          theme: "dark",
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", wallet] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your wallet connection, notifications, and security.
        </p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-3">
        <h3 className="font-semibold">Wallet</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-mono">{shortAddress(wallet, 8)}</div>
            <div className="text-xs text-muted-foreground">Solana mainnet</div>
          </div>
          <ConnectWalletButton />
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-5">
        <h3 className="font-semibold">Notifications</h3>
        {q.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <>
            <Row
              title="Suspicious activity alerts"
              desc="Get notified when CredLayer detects risky behavior on your wallet."
              checked={alerts}
              onChange={setAlerts}
            />
            <Row
              title="Trust score changes"
              desc="Get notified when your reputation score moves significantly."
              checked={scoreChanges}
              onChange={setScoreChanges}
            />
            <div className="pt-2">
              <Button onClick={() => m.mutate()} disabled={m.isPending}>
                {m.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="glass-card rounded-xl p-6 space-y-3">
        <h3 className="font-semibold">Theme</h3>
        <p className="text-sm text-muted-foreground">
          CredLayer is optimized for a dark professional Web3 interface.
        </p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-3">
        <h3 className="font-semibold">Security</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Read-only wallet connection — CredLayer never has spend authority.</li>
          <li>• Disconnect at any time from the wallet menu in the header.</li>
          <li>• Analysis runs server-side using public on-chain data only.</li>
        </ul>
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
