import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { verifyCredential, type VerificationResult } from "@/lib/terminal3.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldX, ArrowLeft, Search } from "lucide-react";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/verify")({
  validateSearch: (s) => search.parse(s),
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verify Credential — CredLayer" },
      { name: "description", content: "Verify a CredLayer / Terminal 3 trust credential." },
    ],
  }),
});

function VerifyPage() {
  const { id } = Route.useSearch();
  const [input, setInput] = useState(id ?? "");
  const verify = useServerFn(verifyCredential);
  const m = useMutation({ mutationFn: (cid: string) => verify({ data: { credential_id: cid } }) });

  useEffect(() => {
    if (id) m.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Credential Verification</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Anyone — lenders, protocols, third parties — can verify a CredLayer trust credential
            here. No wallet connection required.
          </p>
        </div>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) m.mutate(input.trim());
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="vc_xxxxxxxxxxxxxxxx"
                className="font-mono"
              />
              <Button type="submit" disabled={m.isPending}>
                <Search className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </form>
          </CardContent>
        </Card>

        {m.data && <ResultCard result={m.data} />}
        {m.error && <p className="text-sm text-destructive">{(m.error as Error).message}</p>}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: VerificationResult }) {
  const ok = result.found && result.valid;
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {ok ? (
            <>
              <BadgeCheck className="h-7 w-7 text-success" />
              <span className="text-success">Verified</span>
            </>
          ) : (
            <>
              <ShieldX className="h-7 w-7 text-destructive" />
              <span className="text-destructive">Invalid</span>
            </>
          )}
          {result.status && (
            <Badge variant={ok ? "secondary" : "destructive"} className="uppercase">
              {result.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {result.reason && <p className="text-destructive">{result.reason}</p>}
        <Row k="Credential ID" v={result.credential_id} mono />
        {result.subject_wallet && <Row k="Subject wallet" v={result.subject_wallet} mono />}
        {result.issuer && <Row k="Issuer" v={result.issuer} mono />}
        {result.trust_score !== undefined && <Row k="Trust score" v={String(result.trust_score)} />}
        {result.risk_level && <Row k="Risk level" v={result.risk_level} />}
        {result.issued_at && <Row k="Issued" v={new Date(result.issued_at).toLocaleString()} />}
        {result.expires_at && <Row k="Expires" v={new Date(result.expires_at).toLocaleString()} />}
      </CardContent>
    </Card>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 pb-2">
      <span className="text-muted-foreground">{k}</span>
      <span className={mono ? "font-mono text-xs break-all text-right" : "text-right"}>{v}</span>
    </div>
  );
}
