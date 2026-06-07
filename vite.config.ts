// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";

const bufferShim = fileURLToPath(new URL("./src/lib/buffer-shim.ts", import.meta.url));
const rpcWebsocketsShim = fileURLToPath(
  new URL("./node_modules/rpc-websockets/dist/index.browser.mjs", import.meta.url)
);
const nodeBufferShimPlugin = {
  name: "credlayer-node-buffer-shim",
  enforce: "pre" as const,
  // On Cloudflare Workers (SSR) `node:buffer` is provided natively by
  // nodejs_compat — shimming it there caused a circular import / TDZ
  // ("Cannot access 'bufferModule' before initialization") that 500'd the
  // whole site. We only need the shim for the browser bundle, where Vite
  // would otherwise externalize `buffer` / `node:buffer` to an empty stub.
  resolveId(source: string, _importer: string | undefined, options: { ssr?: boolean }) {
    // rpc-websockets ships an exports map without a default condition, which
    // breaks Vite's resolver on both client and SSR builds. Redirect both.
    if (source === "rpc-websockets") {
      return rpcWebsocketsShim;
    }
    // Buffer shim is browser-only: Cloudflare Workers provide `node:buffer`
    // natively via nodejs_compat, and shimming it there caused a TDZ crash.
    if (options?.ssr) return null;
    if (source === "buffer" || source === "node:buffer") {
      return bufferShim;
    }
    return null;
  },
};

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [nodeBufferShimPlugin],
    optimizeDeps: {
      include: ["buffer"],
    },
  },
});
