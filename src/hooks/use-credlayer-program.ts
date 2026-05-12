import { useCallback, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  decodeReputationAccount,
  getReputationPda,
  type OnChainReputation,
} from "@/lib/credlayer-onchain";

export function useCredLayerProgram() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;

  const getReputationAddress = useCallback(
    (target?: string) => {
      const addr = target ?? wallet;
      if (!addr) return null;
      return getReputationPda(addr);
    },
    [wallet]
  );

  const fetchReputation = useCallback(
    async (target?: string): Promise<OnChainReputation | null> => {
      const pda = getReputationAddress(target);
      if (!pda) return null;
      const info = await connection.getAccountInfo(pda);
      if (!info) return null;
      return decodeReputationAccount(pda.toBase58(), info.data);
    },
    [connection, getReputationAddress]
  );

  const checkReputationExists = useCallback(
    async (target?: string): Promise<boolean> => {
      const pda = getReputationAddress(target);
      if (!pda) return false;
      const info = await connection.getAccountInfo(pda);
      return info !== null;
    },
    [connection, getReputationAddress]
  );

  return useMemo(
    () => ({
      wallet,
      connection,
      getReputationAddress,
      fetchReputation,
      checkReputationExists,
    }),
    [wallet, connection, getReputationAddress, fetchReputation, checkReputationExists]
  );
}
