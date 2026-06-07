// Concrete shim for the npm `buffer` package, used by:
//   1. src/lib/buffer-polyfill.ts (browser polyfill) — imported directly so
//      Vite does not externalize `buffer` / `node:buffer` to the empty
//      browser stub.
//   2. The SSR/Worker build via the `credlayer-node-buffer-shim` Vite plugin
//      in vite.config.ts, which redirects `buffer` and `node:buffer` to this
//      file. This avoids Rollup tree-shaking the named `Buffer` export when
//      Solana libs do `import { Buffer } from "buffer"`.
import * as bufferModule from "buffer/index.js";

type BufferCtor = typeof import("buffer").Buffer;

interface BufferPackage {
  Buffer: BufferCtor;
  SlowBuffer: unknown;
  INSPECT_MAX_BYTES: number;
  kMaxLength: number;
}

const mod = bufferModule as unknown as { default?: BufferPackage } & BufferPackage;
const bufferExports: BufferPackage = mod.default ?? mod;

export const Buffer: BufferCtor = bufferExports.Buffer;
export const SlowBuffer = bufferExports.SlowBuffer;
export const INSPECT_MAX_BYTES = bufferExports.INSPECT_MAX_BYTES;
export const kMaxLength = bufferExports.kMaxLength;

export default bufferExports;
