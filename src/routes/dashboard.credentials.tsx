import { createFileRoute, Link } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listCredentials,
  issueCredential,
  revokeCredential,
  verifyCredential,
  type VerificationResult,
} from "@/lib/terminal3.functions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  BadgeCheck,
  Copy,
  ExternalLink,
  Plus,
  ShieldCheck,
  ShieldX,
  XCircle,
  Loader2,
  Zap,
  CircleDot,
} from "lucide-react";
import { copyToClipboard } from "@/lib/copy";

export const Route = createFileRoute("/dashboard/credentials")({
  component: CredentialsPage,
});

type IssueResp = Awaited<ReturnType<typeof issueCredential>>;
type RevokeResp = Awaited<ReturnType<typeof revokeCredential>>;

function CredentialsPage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";
  const list = useServerFn(listCredentials);
  const issue = useServerFn(issueCredential);
  const revoke = useServerFn(revokeCredential);
  const verify = useServerFn(verifyCredential);
  const qc = useQueryClient();

  const [lastIssue, setLastIssue] = useState<IssueResp | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<
    Record<string, VerificationResult>
  >({});

  const q = useQuery({
    queryKey: ["credentials", wallet],
    queryFn: () => list({ data: { wallet } }),
    enabled: !!wallet,
  });

  const issueM = useMutation({
    mutationFn: () => issue({ data: { wallet } }),
    onSuccess: (r) => {
      setLastIssue(r);
      const label =
        r.t3_status === "live-signed"
          ? "Signed by Terminal 3"
          : r.t3_status === "live-failed"
            ? "Issued locally (Terminal 3 unavailable)"
            : "Issued locally";
      toast.success("Credential issued", { description: `${r.credential_id} · ${label}` });
      qc.invalidateQueries({ queryKey: ["credentials", wallet] });
    },
    onError: (e: Error) => toast.error("Issuance failed", { description: e.message }),
  });

  const revokeM = useMutation({
    mutationFn: (credential_id: string) => revoke({ data: { wallet, credential_id } }),
    onSuccess: async (r: RevokeResp, credential_id) => {
      setConfirmRevokeId(null);
      const label =
        r.t3_status === "live-revoked"
          ? "Revoked on Terminal 3"
          : r.t3_status === "live-failed"
            ? "Revoked locally (Terminal 3 unavailable)"
            : "Revoked locally";
      toast.success("Credential revoked", { description: label });
      qc.invalidateQueries({ queryKey: ["credentials", wallet] });
      // Re-verify immediately so the row reflects the new state.
      try {
        const v = await verify({ data: { credential_id } });
        setVerifyResults((s) => ({ ...s, [credential_id]: v }));
      } catch {
        /* noop */
      }
    },
    onError: (e: Error) => {
      setConfirmRevokeId(null);
      toast.error("Revoke failed", { description: e.message });
    },
  });

  const verifyM = useMutation({
    mutationFn: (credential_id: string) => verify({ data: { credential_id } }),
    onSuccess: (v) =>
      setVerifyResults((s) => ({ ...s, [v.credential_id]: v })),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Verifiable Credentials</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Portable, signed trust credentials backed by Terminal 3. Share the
            credential ID with any protocol — they can verify it without seeing
            your data.
          </p>
        </div>
        <Button onClick={() => issueM.mutate()} disabled={issueM.isPending || !wallet}>
          {issueM.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Issue new credential
        </Button>
      </div>

      {lastIssue && <IssuanceStatusCard r={lastIssue} />}

      {q.data?.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No credentials yet. Grant the{" "}
            <strong>Issue verifiable credentials</strong> permission, then issue one.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {q.data?.map((c: any) => {
          const v = verifyResults[c.credential_id];
          const isRevoking =
            revokeM.isPending && confirmRevokeId === c.credential_id;
          return (
            <Card key={c.credential_id} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                      Trust Credential
                      <Badge
                        variant={c.status === "active" ? "secondary" : "destructive"}
                        className="uppercase text-[10px]"
                      >
                        {c.status}
                      </Badge>
                      {c.signature && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          <Zap className="h-3 w-3 mr-1" /> Terminal 3 signed
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs break-all">
                      {c.credential_id}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const ok = await copyToClipboard(c.credential_id);
                        if (ok) toast.success("Copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => verifyM.mutate(c.credential_id)}
                      disabled={verifyM.isPending}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Verify
                    </Button>
                    <Button size="sm" variant="secondary" asChild>
                      <Link to="/verify" search={{ id: c.credential_id }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {c.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmRevokeId(c.credential_id)}
                        disabled={isRevoking}
                      >
                        {isRevoking ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Trust score" value={String(c.trust_score)} />
                  <Stat label="Risk level" value={c.risk_level} />
                  <Stat
                    label="Issued"
                    value={new Date(c.issued_at).toLocaleDateString()}
                  />
                  <Stat
                    label="Expires"
                    value={
                      c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString()
                        : "—"
                    }
                  />
                </div>
                {v && (
                  <div
                    className={`flex items-center gap-2 text-xs rounded-md border px-3 py-2 ${
                      v.valid
                        ? "border-success/40 text-success"
                        : "border-destructive/40 text-destructive"
                    }`}
                  >
                    {v.valid ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldX className="h-3.5 w-3.5" />
                    )}
                    <span className="font-medium uppercase tracking-wider">
                      {v.valid ? "Verified" : "Invalid"}
                    </span>
                    <span className="text-muted-foreground">
                      · status {v.status} {v.reason ? `· ${v.reason}` : ""}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={!!confirmRevokeId}
        onOpenChange={(o) => !o && setConfirmRevokeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this credential?</AlertDialogTitle>
            <AlertDialogDescription>
              Revocation is immediate and propagated to Terminal 3 when configured.
              Any third party that re-verifies the credential ID will see it as
              <strong> invalid</strong>. This cannot be undone — you'll need to issue
              a new credential.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="font-mono text-xs break-all bg-muted/40 rounded p-2">
            {confirmRevokeId}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeM.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revokeM.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirmRevokeId) revokeM.mutate(confirmRevokeId);
              }}
            >
              {revokeM.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Revoking…
                </>
              ) : (
                "Revoke credential"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IssuanceStatusCard({ r }: { r: IssueResp }) {
  const tone =
    r.t3_status === "live-signed"
      ? "border-success/40 text-success"
      : r.t3_status === "live-failed"
        ? "border-warning/40 text-warning"
        : "border-border text-muted-foreground";
  const headline =
    r.t3_status === "live-signed"
      ? "Issued and signed by Terminal 3"
      : r.t3_status === "live-failed"
        ? "Issued locally — Terminal 3 call failed"
        : "Issued in local mode (Terminal 3 not configured)";
  return (
    <Card className={`glass-card border ${tone}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CircleDot className="h-3.5 w-3.5" />
          Last issuance · {r.mode}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <p className="font-medium">{headline}</p>
        <p className="font-mono break-all">{r.credential_id}</p>
        {r.t3_error && (
          <p className="text-destructive">Terminal 3 error: {r.t3_error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-mono">{value}</p>
    </div>
  );
}
