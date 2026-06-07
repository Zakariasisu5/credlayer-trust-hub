// Terminal 3 Agent Auth SDK wrapper (server-only).
//
// When TERMINAL3_API_KEY + TERMINAL3_API_BASE_URL are set, calls forward to
// the real Terminal 3 API. Otherwise we run in "local mode" which mirrors the
// same shape against our Supabase tables so the UI/flows can be developed and
// demoed end-to-end without credentials. Swap-in is a no-op — the public
// surface (issue, verify, revoke, session) stays identical.

export type T3Mode = "live" | "local";

export function getT3Mode(): T3Mode {
  return process.env.TERMINAL3_API_KEY && process.env.TERMINAL3_API_BASE_URL
    ? "live"
    : "local";
}

export async function t3Fetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const base = process.env.TERMINAL3_API_BASE_URL;
  const key = process.env.TERMINAL3_API_KEY;
  if (!base || !key) {
    throw new Error("Terminal 3 not configured (local mode)");
  }
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Terminal3-Project": process.env.TERMINAL3_PROJECT_ID ?? "",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Terminal 3 ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newCredentialId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `vc_${hex}`;
}
