import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdminClient } from "./credlayer.server";
import { logActivity } from "./audit.server";
import {
  getT3Mode,
  newCredentialId,
  sha256Hex,
  t3Fetch,
} from "./terminal3/client.server";

const solanaAddress = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address");

// ---------- Default permission catalog ----------

export const DEFAULT_PERMISSIONS: {
  key: string;
  label: string;
  description: string;
  scope: "read" | "write" | "restricted";
}[] = [
  {
    key: "reputation.read",
    label: "Assess credit reputation",
    description: "Allow the AI agent to read your on-chain trust score.",
    scope: "read",
  },
  {
    key: "repayment.read",
    label: "Analyze repayment history",
    description: "Allow analysis of past loan and repayment activity.",
    scope: "read",
  },
  {
    key: "trust.report",
    label: "Generate trust reports",
    description: "Allow the agent to compile trust reports about your wallet.",
    scope: "write",
  },
  {
    key: "credential.issue",
    label: "Issue verifiable credentials",
    description: "Allow the agent to mint Terminal 3 trust credentials on your behalf.",
    scope: "write",
  },
  {
    key: "wallet.metadata",
    label: "Access wallet metadata",
    description: "Allow reading public wallet metadata (balances, programs).",
    scope: "read",
  },
  {
    key: "tx.sign",
    label: "Sign transactions automatically",
    description: "RESTRICTED — never auto-granted. Requires explicit signed approval per action.",
    scope: "restricted",
  },
  {
    key: "tx.transfer",
    label: "Transfer funds",
    description: "RESTRICTED — never auto-granted. Requires explicit signed approval per action.",
    scope: "restricted",
  },
];

// ---------- Permissions ----------

export const listPermissions = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string }) =>
    z.object({ wallet: solanaAddress }).parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const { data: rows } = await supabase
      .from("agent_permissions")
      .select("*")
      .eq("wallet_address", data.wallet);

    console.log(`[listPermissions] Found ${rows?.length ?? 0} permissions for wallet ${data.wallet.slice(0, 8)}...`);
    
    // Merge with defaults so brand-new wallets see the catalog
    const byKey = new Map((rows ?? []).map((r: any) => [r.permission_key, r]));
    const result = DEFAULT_PERMISSIONS.map((p) => {
      const existing = byKey.get(p.key);
      
      // A permission is truly granted only if:
      // 1. granted field is true
      // 2. Not revoked (revoked_at is null)
      // 3. Not expired (expires_at is null or in the future)
      const isGranted = existing?.granted === true 
        && !existing?.revoked_at 
        && (!existing?.expires_at || new Date(existing.expires_at).getTime() > Date.now());
      
      if (existing) {
        console.log(`[listPermissions] ${p.key}: granted=${existing.granted}, revoked_at=${existing.revoked_at}, expires_at=${existing.expires_at}, computed isGranted=${isGranted}`);
      }
      
      return {
        permission_key: p.key,
        label: p.label,
        description: p.description,
        scope: p.scope,
        granted: isGranted,
        expires_at: existing?.expires_at ?? null,
        revoked_at: existing?.revoked_at ?? null,
        updated_at: existing?.updated_at ?? null,
      };
    });
    
    return result;
  });

export const setPermission = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      wallet: string;
      permission_key: string;
      granted: boolean;
      expires_in_days?: number | null;
    }) =>
      z
        .object({
          wallet: solanaAddress,
          permission_key: z.string().min(1).max(64),
          granted: z.boolean(),
          expires_in_days: z.number().int().min(1).max(365).nullable().optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    const def = DEFAULT_PERMISSIONS.find((p) => p.key === data.permission_key);
    if (!def) throw new Error("Unknown permission");
    if (def.scope === "restricted" && data.granted) {
      throw new Error("Restricted permissions require per-transaction signed approval");
    }
    const supabase = getAdminClient();
    const expires_at = data.expires_in_days && data.granted
      ? new Date(Date.now() + data.expires_in_days * 86400_000).toISOString()
      : null;

    const { error } = await supabase.from("agent_permissions").upsert(
      {
        wallet_address: data.wallet,
        permission_key: data.permission_key,
        label: def.label,
        description: def.description,
        scope: def.scope,
        granted: data.granted,
        expires_at,
        revoked_at: data.granted ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address,permission_key" }
    );
    
    if (error) {
      console.error("Failed to update permission:", error);
      throw new Error(`Failed to update permission: ${error.message}`);
    }
    
    await logActivity({
      wallet: data.wallet,
      action: data.granted ? "permission.grant" : "permission.revoke",
      message: `${def.label} ${data.granted ? "granted" : "revoked"}`,
      details: { permission_key: data.permission_key, scope: def.scope, expires_at },
    });
    return { ok: true };
  });

export const revokeAllPermissions = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string }) =>
    z.object({ wallet: solanaAddress }).parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    await supabase
      .from("agent_permissions")
      .update({
        granted: false,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", data.wallet);
    await logActivity({
      wallet: data.wallet,
      action: "permission.revoke_all",
      message: "All agent permissions revoked",
    });
    return { ok: true };
  });

// ---------- Verifiable credentials ----------

export const listCredentials = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string }) =>
    z.object({ wallet: solanaAddress }).parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const { data: rows } = await supabase
      .from("verifiable_credentials")
      .select("*")
      .eq("subject_wallet", data.wallet)
      .order("issued_at", { ascending: false });
    return rows ?? [];
  });

export const issueCredential = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string }) =>
    z.object({ wallet: solanaAddress }).parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = getAdminClient();

    // Require credential.issue permission to be granted
    const { data: perm } = await supabase
      .from("agent_permissions")
      .select("granted,revoked_at,expires_at")
      .eq("wallet_address", data.wallet)
      .eq("permission_key", "credential.issue")
      .maybeSingle();
    
    // Check if permission is truly granted (not revoked and not expired)
    const isGranted = perm?.granted === true 
      && !perm?.revoked_at 
      && (!perm?.expires_at || new Date(perm.expires_at).getTime() > Date.now());
    
    if (!isGranted) {
      throw new Error("Permission 'Issue verifiable credentials' is not granted");
    }

    // Pull latest analysis as the credential subject
    const { data: analysis } = await supabase
      .from("wallet_analyses")
      .select("trust_score,risk_level,confidence,updated_at")
      .eq("wallet_address", data.wallet)
      .maybeSingle();
    if (!analysis) throw new Error("Analyze the wallet before issuing a credential");

    const credential_id = newCredentialId();
    const issued_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 90 * 86400_000).toISOString();
    const issuer = process.env.TERMINAL3_PROJECT_ID
      ? `did:terminal3:${process.env.TERMINAL3_PROJECT_ID}`
      : "did:credlayer:issuer";

    const payload = {
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://credlayer.xyz/v1"],
      type: ["VerifiableCredential", "CredLayerTrustCredential"],
      id: credential_id,
      issuer,
      issuanceDate: issued_at,
      expirationDate: expires_at,
      credentialSubject: {
        id: `did:sol:${data.wallet}`,
        trustScore: analysis.trust_score,
        riskLevel: analysis.risk_level,
        confidence: Number(analysis.confidence),
        verifiedAt: analysis.updated_at,
      },
    };

    const credential_hash = await sha256Hex(JSON.stringify(payload));

    // Issuance status describes whether Terminal 3 signed this credential.
    //   live-signed — Terminal 3 returned a signature
    //   live-failed — Terminal 3 configured but call failed (fell back to local signing)
    //   local       — Terminal 3 not configured; signed locally
    let signature: string | null = null;
    let t3_status: "live-signed" | "live-failed" | "local" = "local";
    let t3_error: string | null = null;

    if (getT3Mode() === "live") {
      try {
        const t3 = await t3Fetch<{ signature?: string }>("/v1/credentials/issue", {
          method: "POST",
          body: JSON.stringify({ credential: payload, hash: credential_hash }),
        });
        signature = t3.signature ?? null;
        t3_status = signature ? "live-signed" : "live-failed";
        if (!signature) t3_error = "Terminal 3 accepted the request but returned no signature";
      } catch (e) {
        t3_status = "live-failed";
        t3_error = e instanceof Error ? e.message : String(e);
        console.error("Terminal 3 issuance failed, falling back to local:", e);
      }
    }

    await supabase.from("verifiable_credentials").insert({
      credential_id,
      subject_wallet: data.wallet,
      issuer,
      trust_score: analysis.trust_score,
      risk_level: analysis.risk_level,
      status: "active",
      payload,
      credential_hash,
      signature,
      issued_at,
      expires_at,
    });

    await logActivity({
      wallet: data.wallet,
      action: "credential.issue",
      status: t3_status === "live-failed" ? "failed" : "success",
      message: `Credential ${credential_id} issued (${t3_status})`,
      details: { credential_id, credential_hash, t3_status, t3_error },
    });

    return { credential_id, credential_hash, t3_status, t3_error, mode: getT3Mode() };
  });

export const revokeCredential = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string; credential_id: string }) =>
    z
      .object({ wallet: solanaAddress, credential_id: z.string().min(3).max(80) })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const revoked_at = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("verifiable_credentials")
      .update({ status: "revoked", revoked_at })
      .eq("credential_id", data.credential_id)
      .eq("subject_wallet", data.wallet);
    if (upErr) throw new Error(upErr.message);

    let t3_status: "live-revoked" | "live-failed" | "local" = "local";
    let t3_error: string | null = null;
    if (getT3Mode() === "live") {
      try {
        await t3Fetch(`/v1/credentials/${encodeURIComponent(data.credential_id)}/revoke`, {
          method: "POST",
        });
        t3_status = "live-revoked";
      } catch (e) {
        t3_status = "live-failed";
        t3_error = e instanceof Error ? e.message : String(e);
        console.error("Terminal 3 revoke failed:", e);
      }
    }
    await logActivity({
      wallet: data.wallet,
      action: "credential.revoke",
      status: t3_status === "live-failed" ? "failed" : "success",
      message: `Credential ${data.credential_id} revoked (${t3_status})`,
      details: { credential_id: data.credential_id, t3_status, t3_error },
    });
    return { ok: true, t3_status, t3_error, revoked_at, mode: getT3Mode() };
  });

// ---------- Public verification ----------

export type VerificationResult = {
  found: boolean;
  valid: boolean;
  credential_id: string;
  subject_wallet?: string;
  issuer?: string;
  trust_score?: number;
  risk_level?: string;
  status?: string;
  issued_at?: string;
  expires_at?: string;
  reason?: string;
};

export const verifyCredential = createServerFn({ method: "POST" })
  .inputValidator((data: { credential_id: string }) =>
    z.object({ credential_id: z.string().min(3).max(80) }).parse(data)
  )
  .handler(async ({ data }): Promise<VerificationResult> => {
    const supabase = getAdminClient();
    const { data: row } = await supabase
      .from("verifiable_credentials")
      .select("*")
      .eq("credential_id", data.credential_id)
      .maybeSingle();
    if (!row) {
      return { found: false, valid: false, credential_id: data.credential_id, reason: "Credential not found" };
    }
    const expired = row.expires_at && new Date(row.expires_at).getTime() < Date.now();
    const valid = row.status === "active" && !expired;

    // Recompute hash to detect tampering
    const recomputed = await sha256Hex(JSON.stringify(row.payload));
    const tampered = recomputed !== row.credential_hash;

    return {
      found: true,
      valid: valid && !tampered,
      credential_id: row.credential_id,
      subject_wallet: row.subject_wallet,
      issuer: row.issuer,
      trust_score: row.trust_score,
      risk_level: row.risk_level,
      status: tampered ? "tampered" : row.status,
      issued_at: row.issued_at,
      expires_at: row.expires_at ?? undefined,
      reason: tampered
        ? "Credential hash mismatch"
        : expired
        ? "Credential expired"
        : row.status !== "active"
        ? `Credential ${row.status}`
        : undefined,
    };
  });

// ---------- Session ----------

export const getT3Session = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string }) =>
    z.object({ wallet: solanaAddress }).parse(data)
  )
  .handler(async ({ data }) => {
    return {
      mode: getT3Mode(),
      wallet: data.wallet,
      issuer: process.env.TERMINAL3_PROJECT_ID
        ? `did:terminal3:${process.env.TERMINAL3_PROJECT_ID}`
        : "did:credlayer:issuer",
      authenticated: true,
      authenticated_at: new Date().toISOString(),
    };
  });

// ---------- Activity log ----------

export const listActivity = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string; limit?: number }) =>
    z
      .object({
        wallet: solanaAddress,
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = getAdminClient();
    const { data: rows } = await supabase
      .from("agent_activity_log")
      .select("*")
      .eq("wallet_address", data.wallet)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    return rows ?? [];
  });
