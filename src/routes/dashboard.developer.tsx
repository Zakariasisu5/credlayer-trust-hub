import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
} from "@/lib/credlayer.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Code2, Copy, Plus, Trash2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { copyToClipboard } from "@/lib/copy";

export const Route = createFileRoute("/dashboard/developer")({
  component: DeveloperPage,
});

function DeveloperPage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const list = useServerFn(listApiKeys);
  const create = useServerFn(createApiKey);
  const remove = useServerFn(deleteApiKey);
  const qc = useQueryClient();

  const keys = useQuery({
    queryKey: ["api-keys", wallet],
    queryFn: () => list({ data: { wallet } }),
    enabled: !!wallet,
  });

  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const createM = useMutation({
    mutationFn: () => create({ data: { wallet, name } }),
    onSuccess: (res) => {
      setCreatedKey(res.full_key);
      setName("");
      qc.invalidateQueries({ queryKey: ["api-keys", wallet] });
      toast.success("API key created");
    },
    onError: (e: Error) =>
      toast.error("Couldn't create key", { description: e.message }),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => remove({ data: { wallet, id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys", wallet] });
      toast.success("Key revoked");
    },
  });

  const totalRequests =
    keys.data?.reduce((acc, k: any) => acc + (k.request_count ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Developer Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Embed CredLayer trust scores into your dApp via the REST API.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Stat label="Active API keys" value={keys.data?.length ?? 0} />
        <Stat label="Total requests" value={totalRequests} />
        <Stat label="Plan" value="Free · 1k req/mo" />
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" /> API Keys
          </h3>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setCreatedKey(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" /> New key</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Name your key. The full key is shown only once after creation.
                </DialogDescription>
              </DialogHeader>
              {!createdKey ? (
                <>
                  <Input
                    placeholder="e.g. Production app"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => createM.mutate()}
                      disabled={!name.trim() || createM.isPending}
                    >
                      {createM.isPending ? "Creating…" : "Create"}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <CreatedKeyView k={createdKey} onClose={() => { setOpen(false); setCreatedKey(null); }} />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {keys.isLoading ? (
          <Skeleton className="h-24" />
        ) : !keys.data || keys.data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No API keys yet. Create one to start using the CredLayer API.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {keys.data.map((k: any) => (
              <li key={k.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{k.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {k.key_prefix}…  ·  {k.request_count} requests
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteM.mutate(k.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-3">Endpoint example</h3>
        <pre className="rounded-lg bg-muted p-4 text-xs font-mono overflow-x-auto">
{`POST https://api.credlayer.app/v1/score
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{ "wallet": "9WzD…dBjK" }

→ {
  "trust_score": 82,
  "risk_level": "low",
  "confidence": 0.91,
  "behavioral_metrics": { ... },
  "ai_insights": [ ... ]
}`}
        </pre>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

function CreatedKeyView({ k, onClose }: { k: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Copy your key now. You won't be able to see it again.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all">
            {k}
          </code>
          <Button
            size="icon"
            variant="outline"
            onClick={async () => {
              const ok = await copyToClipboard(k);
              if (ok) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}
