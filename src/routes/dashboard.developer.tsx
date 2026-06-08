import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
} from "@/lib/credlayer.functions";
import { getT3Session } from "@/lib/terminal3.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Code2, Copy, Plus, Trash2, Check, CircleDot, Zap, FileCode } from "lucide-react";
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
  const t3Session = useServerFn(getT3Session);
  const qc = useQueryClient();

  const keys = useQuery({
    queryKey: ["api-keys", wallet],
    queryFn: () => list({ data: { wallet } }),
    enabled: !!wallet,
  });

  const session = useQuery({
    queryKey: ["t3-session", wallet],
    queryFn: () => t3Session({ data: { wallet } }),
    enabled: !!wallet,
    staleTime: 300_000,
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

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Terminal 3 SDK
          </h3>
          <Badge
            variant="outline"
            className="gap-1.5"
            title={
              session.data?.mode === "live"
                ? "TERMINAL3_API_KEY + TERMINAL3_API_BASE_URL are set — credentials are signed by Terminal 3"
                : "Terminal 3 secrets not set — credentials are signed locally with the same shape"
            }
          >
            <CircleDot
              className={
                session.data?.mode === "live"
                  ? "h-3 w-3 text-success"
                  : "h-3 w-3 text-muted-foreground"
              }
            />
            Mode · {session.data?.mode ?? "…"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Thin server-only wrapper around the Terminal 3 Agent Auth API. Used to
          issue, revoke, and verify W3C verifiable credentials. Falls back to
          local signing (same payload shape) when env vars are absent.
        </p>
        <div className="grid gap-2 text-xs">
          <SdkRow
            file="src/lib/terminal3/client.server.ts"
            note="Core SDK · getT3Mode(), t3Fetch(), sha256Hex(), newCredentialId()"
          />
          <SdkRow
            file="src/lib/terminal3.functions.ts"
            note="Server fns · issueCredential, revokeCredential, verifyCredential, getT3Session"
          />
          <SdkRow file="src/routes/dashboard.credentials.tsx" note="UI · issue/revoke/verify" />
          <SdkRow file="src/routes/verify.tsx" note="Public verifier page" />
        </div>
        <div>
          <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
            Terminal 3 endpoints called
          </p>
          <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{`POST  {TERMINAL3_API_BASE_URL}/v1/credentials/issue
POST  {TERMINAL3_API_BASE_URL}/v1/credentials/{id}/revoke
Headers: Authorization: Bearer {TERMINAL3_API_KEY}
         X-Terminal3-Project: {TERMINAL3_PROJECT_ID}`}
          </pre>
        </div>
        {session.data?.mode === "local" && (
          <p className="text-xs text-warning">
            Running in <strong>local mode</strong>. Add{" "}
            <code className="font-mono">TERMINAL3_API_KEY</code>,{" "}
            <code className="font-mono">TERMINAL3_API_BASE_URL</code>, and{" "}
            <code className="font-mono">TERMINAL3_PROJECT_ID</code> as backend
            secrets to switch to live Terminal 3 signing.
          </p>
        )}
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

function SdkRow({ file, note }: { file: string; note: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
        <code className="font-mono text-[11px] truncate">{file}</code>
      </div>
      <span className="text-[11px] text-muted-foreground text-right">{note}</span>
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
