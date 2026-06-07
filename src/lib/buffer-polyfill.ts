// Browser-only polyfill. bn.js, @solana/web3.js, and @solana/spl-token reach
// for a global `Buffer` during module init, so the assignment must be
// synchronous and happen before any Solana code is evaluated. Import this at
// the very top of the app entry (src/routes/__root.tsx).
//
// We import from the explicit `buffer/` package subpath so Vite resolves to
// the npm `buffer` polyfill rather than externalizing to `node:buffer` (which
// is unavailable in the browser bundle).
import { Buffer as NodeBuffer } from "./buffer-shim.js";

if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { Buffer?: unknown; global?: unknown };
  if (!g.Buffer) g.Buffer = NodeBuffer;
  if (!g.global) g.global = globalThis;
}

export {};
