import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchOnChainReputation } from "./credlayer-onchain.server";

const solanaAddress = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address");

export const getOnChainReputation = createServerFn({ method: "POST" })
  .inputValidator((data: { address: string }) =>
    z.object({ address: solanaAddress }).parse(data)
  )
  .handler(async ({ data }) => {
    try {
      const rep = await fetchOnChainReputation(data.address);
      return { reputation: rep, error: null as string | null };
    } catch (err) {
      console.error("on-chain reputation fetch failed", err);
      return {
        reputation: null,
        error: err instanceof Error ? err.message : "Failed to fetch on-chain reputation",
      };
    }
  });
